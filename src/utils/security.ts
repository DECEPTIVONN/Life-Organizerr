/**
 * CLIENT-SIDE SECURITY HARDENING ENGINE
 * Sanitization, Anti-XSS, Anti-SQLi, Prompt Injection Defense, and Brute Force Throttling
 */

/**
 * Escapes HTML characters to prevent XSS attacks when displaying user content
 */
export function sanitizeHtml(str: string): string {
  if (typeof str !== 'string') return '';
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    .replace(/\//g, '&#x2F;');
}

/**
 * Strips dangerous HTML tags, javascript: links, and inline event handlers
 */
export function sanitizeInput(input: string): string {
  if (typeof input !== 'string') return '';
  return input
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/javascript\s*:/gi, '')
    .replace(/data\s*:\s*text\/html/gi, '')
    .replace(/on\w+\s*=/gi, 'noevent=')
    .trim();
}

/**
 * Detects SQL Injection attack patterns in client text inputs
 */
export function isSqlInjectionPattern(value: string): boolean {
  if (typeof value !== 'string') return false;
  const sqliRegexes = [
    /(\b(SELECT|INSERT|UPDATE|DELETE|DROP|ALTER|CREATE|TRUNCATE|EXEC|UNION)\b)/i,
    /('|\"|\bOR\b|\bAND\b)\s*['\"]?\s*1\s*=\s*1/i,
    /--\s*$/,
    /\/\*[\s\S]*?\*\//,
    /;\s*(DROP|DELETE|UPDATE|INSERT)\b/i
  ];
  return sqliRegexes.some(rx => rx.test(value));
}

/**
 * Detects Prompt Injection attempts in user input intended for AI models
 */
export function sanitizeAiPrompt(userPrompt: string): { prompt: string; isPromptInjected: boolean } {
  if (typeof userPrompt !== 'string') return { prompt: '', isPromptInjected: false };

  const promptInjectionPatterns = [
    /ignore\s+(all\s+)?previous\s+instructions/i,
    /disregard\s+(all\s+)?prior\s+prompts/i,
    /system\s*prompt\s*:/i,
    /you\s+are\s+now\s+a\s+DAN/i,
    /developer\s+mode\s+enabled/i,
    /override\s+safety\s+guidelines/i,
    /reveal\s+your\s+instructions/i
  ];

  let isPromptInjected = false;
  let cleaned = userPrompt;

  for (const rx of promptInjectionPatterns) {
    if (rx.test(cleaned)) {
      isPromptInjected = true;
      cleaned = cleaned.replace(rx, '[CONTEUDO_RESTRITO]');
    }
  }

  // Wrap user prompt safely
  const safePrompt = `<user_input_content>\n${sanitizeInput(cleaned)}\n</user_input_content>`;
  return { prompt: safePrompt, isPromptInjected };
}

/* =========================================================================
   BRUTE-FORCE & CREDENTIAL STUFFING CLIENT THROTTLER
   ========================================================================= */

const FAILED_LOGIN_KEY = 'mbc_security_failed_logins';
const LOCKOUT_KEY = 'mbc_security_lockout_until';

export function checkLoginLockout(): { locked: boolean; remainingSeconds: number } {
  const lockoutUntilRaw = localStorage.getItem(LOCKOUT_KEY);
  if (lockoutUntilRaw) {
    const lockoutUntil = parseInt(lockoutUntilRaw, 10);
    const now = Date.now();
    if (now < lockoutUntil) {
      return { locked: true, remainingSeconds: Math.ceil((lockoutUntil - now) / 1000) };
    } else {
      localStorage.removeItem(LOCKOUT_KEY);
      localStorage.removeItem(FAILED_LOGIN_KEY);
    }
  }
  return { locked: false, remainingSeconds: 0 };
}

export function recordFailedLoginAttempt(maxAttempts = 5, lockoutDurationMs = 120000): { locked: boolean; remainingAttempts: number } {
  const failedCount = parseInt(localStorage.getItem(FAILED_LOGIN_KEY) || '0', 10) + 1;
  localStorage.setItem(FAILED_LOGIN_KEY, String(failedCount));

  if (failedCount >= maxAttempts) {
    const lockoutTime = Date.now() + lockoutDurationMs;
    localStorage.setItem(LOCKOUT_KEY, String(lockoutTime));
    return { locked: true, remainingAttempts: 0 };
  }

  return { locked: false, remainingAttempts: maxAttempts - failedCount };
}

export function resetFailedLoginAttempts(): void {
  localStorage.removeItem(FAILED_LOGIN_KEY);
  localStorage.removeItem(LOCKOUT_KEY);
}
