import express from "express";

/* =========================================================================
   SECURITY HARDENING ENGINE: ANTI-SQLi, ANTI-XSS, RATE-LIMITING, SCRIPT KIDDIE TRAPS
   ========================================================================= */

// In-Memory Dynamic IP Blacklist Store (for IPs that trigger vulnerability probe traps)
const blockedIpsMap = new Map<string, number>(); // IP -> unblock timestamp

// In-Memory Sliding Window Rate Limiter Store
interface RateLimitRecord {
  count: number;
  resetTime: number;
}

const globalRateLimitMap = new Map<string, RateLimitRecord>();
const authRateLimitMap = new Map<string, RateLimitRecord>();
const pinRateLimitMap = new Map<string, RateLimitRecord>();

// Cleanup stale rate limit and blocked IP records every 5 minutes
const cleanupTimer = setInterval(() => {
  const now = Date.now();
  for (const [ip, unblockTime] of blockedIpsMap.entries()) {
    if (now > unblockTime) blockedIpsMap.delete(ip);
  }
  for (const [ip, rec] of globalRateLimitMap.entries()) {
    if (now > rec.resetTime) globalRateLimitMap.delete(ip);
  }
  for (const [ip, rec] of authRateLimitMap.entries()) {
    if (now > rec.resetTime) authRateLimitMap.delete(ip);
  }
  for (const [ip, rec] of pinRateLimitMap.entries()) {
    if (now > rec.resetTime) pinRateLimitMap.delete(ip);
  }
}, 5 * 60 * 1000);
if (cleanupTimer && typeof cleanupTimer.unref === "function") {
  cleanupTimer.unref();
}

/**
 * Gets real client IP address considering proxy headers
 */
function getClientIp(req: express.Request): string {
  if (!req) return "127.0.0.1";
  const forwarded = req.headers ? req.headers["x-forwarded-for"] : undefined;
  if (typeof forwarded === "string") {
    return forwarded.split(",")[0].trim();
  } else if (Array.isArray(forwarded) && forwarded.length > 0) {
    return forwarded[0].trim();
  }
  const realIp = req.headers ? req.headers["x-real-ip"] : undefined;
  if (typeof realIp === "string") {
    return realIp.trim();
  }
  return req.socket?.remoteAddress || "127.0.0.1";
}

/**
 * Express Middleware: IP Blacklist Enforcer (Blocks IPs caught probing or scanning)
 */
export function ipBlacklistCheckMiddleware(req: express.Request, res: express.Response, next: express.NextFunction) {
  const ip = getClientIp(req);
  const unblockTime = blockedIpsMap.get(ip);
  const now = Date.now();

  if (unblockTime && now < unblockTime) {
    return res.status(403).json({
      error: "Acesso bloqueado temporariamente por atividade suspeita ou escaneamento de vulnerabilidades."
    });
  }

  next();
}

/**
 * Express Middleware: Security HTTP Headers & Server Hardening
 */
export function securityHeadersMiddleware(req: express.Request, res: express.Response, next: express.NextFunction) {
  // Hide server technology signature (Prevents stack fingerprinting / CMS / server vulnerability scans)
  res.removeHeader("X-Powered-By");

  // Prevent MIME-type sniffing
  res.setHeader("X-Content-Type-Options", "nosniff");

  // Enable legacy browser XSS filtering
  res.setHeader("X-XSS-Protection", "1; mode=block");

  // Enforce HSTS (Strict-Transport-Security)
  res.setHeader("Strict-Transport-Security", "max-age=31536000; includeSubDomains; preload");

  // Referrer Policy
  res.setHeader("Referrer-Policy", "strict-origin-when-cross-origin");

  // Restrict unneeded browser feature permissions
  res.setHeader("Permissions-Policy", "camera=(), microphone=(), geolocation=(), payment=()");

  // Prevent framing unless allowed for AI Studio preview
  res.setHeader("X-Frame-Options", "SAMEORIGIN");

  next();
}

/* =========================================================================
   ANTI-SCRIPT KIDDIE & AUTOMATED SCANNER DEFENSE ENGINE
   ========================================================================= */

// Known vulnerability scanner User-Agent signatures (Nikto, Sqlmap, Gobuster, etc.)
const SCANNER_USER_AGENTS = [
  /sqlmap/i,
  /nikto/i,
  /gobuster/i,
  /dirbuster/i,
  /wpscan/i,
  /nmap/i,
  /masscan/i,
  /zgrab/i,
  /censys/i,
  /shodan/i,
  /acunetix/i,
  /nessus/i,
  /openvas/i,
  /netsparker/i,
  /whatweb/i,
  /arachni/i,
  /hydra/i,
  /medusa/i,
  /havij/i,
  /striker/i,
  /burpcollaborator/i
];

// Typical paths probed by script kiddies / automated scanner scripts
const SCRIPT_KIDDIE_PROBE_PATHS = [
  /\/\.env/i,
  /\/\.git/i,
  /\/\.svn/i,
  /\/wp-login\.php/i,
  /\/wp-admin/i,
  /\/wp-includes/i,
  /\/xmlrpc\.php/i,
  /\/phpmyadmin/i,
  /\/pma/i,
  /\/admin\.php/i,
  /\/cgi-bin/i,
  /\/actuator/i,
  /\/solr/i,
  /\/boaform/i,
  /\/\.aws/i,
  /\/etc\/passwd/i,
  /\/config\.json/i,
  /\/backup\.sql/i,
  /\/dump\.sql/i,
  /\/database\.sqlite/i,
  /\/eval-expression/i,
  /\/\.remote/i,
  /\/stenv/i
];

/**
 * Express Middleware: Blocks known Automated Scanner User-Agents
 */
export function antiScannerUserAgentMiddleware(req: express.Request, res: express.Response, next: express.NextFunction) {
  const ua = req.headers["user-agent"] || "";

  for (const pattern of SCANNER_USER_AGENTS) {
    if (pattern.test(ua)) {
      const ip = getClientIp(req);
      // Block IP for 1 hour
      blockedIpsMap.set(ip, Date.now() + 60 * 60 * 1000);
      console.warn(`[Security Alert] Script kiddie scanner blocked (UA: ${ua}) from IP ${ip}`);
      return res.status(403).json({ error: "Acesso negado por identificação de ferramenta automatizada de escaneamento." });
    }
  }

  next();
}

/**
 * Express Middleware: Script Kiddie Probe Trap & Honeypot
 * Catches common automated exploits (PHP, WordPress, phpMyAdmin, config file downloads)
 */
export function antiScriptKiddieProbeMiddleware(req: express.Request, res: express.Response, next: express.NextFunction) {
  const url = req.originalUrl || req.url;

  for (const pattern of SCRIPT_KIDDIE_PROBE_PATHS) {
    if (pattern.test(url)) {
      const ip = getClientIp(req);
      // Temporarily block IP for 1 hour for hitting honeypot/probe routes
      blockedIpsMap.set(ip, Date.now() + 60 * 60 * 1000);
      console.warn(`[Security Alert] Script kiddie probe hit (${url}) from IP ${ip}. IP blacklisted.`);
      return res.status(404).send("Not Found");
    }
  }

  next();
}

/**
 * Express Middleware: Path Traversal (Directory Traversal) Protection
 */
const PATH_TRAVERSAL_REGEX = /(\.\.\/|\.\.\\|%2e%2e%2f|%2e%2e\/|%2e%2e%5c|\.\.%2f|\.\.%5c)/i;

export function antiPathTraversalMiddleware(req: express.Request, res: express.Response, next: express.NextFunction) {
  const url = req.originalUrl || req.url;

  if (PATH_TRAVERSAL_REGEX.test(url)) {
    const ip = getClientIp(req);
    console.warn(`[Security Alert] Directory Traversal attempt detected (${url}) from IP ${ip}`);
    return res.status(400).json({ error: "Tentativa de navegação de diretório inválida bloqueada." });
  }

  // Check body string values for path traversal
  if (req.body && typeof req.body === "object") {
    const bodyStr = JSON.stringify(req.body);
    if (PATH_TRAVERSAL_REGEX.test(bodyStr)) {
      return res.status(400).json({ error: "Caminho de arquivo inválido detectado no payload." });
    }
  }

  next();
}

/**
 * Express Middleware: HTTP Method Guard (Only allows safe standard methods)
 */
const ALLOWED_HTTP_METHODS = new Set(["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS", "HEAD"]);

export function httpMethodGuardMiddleware(req: express.Request, res: express.Response, next: express.NextFunction) {
  if (!req.method || !ALLOWED_HTTP_METHODS.has(req.method.toUpperCase())) {
    return res.status(405).json({ error: `Método HTTP ${req.method} não é permitido.` });
  }
  next();
}

/**
 * Express Middleware: Sliding Window Rate Limiter (Anti-DDoS / Anti-Brute Force)
 */
export function createRateLimiter(
  map: Map<string, RateLimitRecord>,
  maxRequests: number,
  windowMs: number,
  errorMessage: string
) {
  return (req: express.Request, res: express.Response, next: express.NextFunction) => {
    const ip = getClientIp(req);
    const now = Date.now();
    let record = map.get(ip);

    if (!record || now > record.resetTime) {
      record = { count: 1, resetTime: now + windowMs };
      map.set(ip, record);
      return next();
    }

    record.count++;
    if (record.count > maxRequests) {
      const retryAfterSec = Math.ceil((record.resetTime - now) / 1000);
      res.setHeader("Retry-After", String(retryAfterSec));
      return res.status(429).json({
        error: errorMessage,
        retryAfterSeconds: retryAfterSec
      });
    }

    next();
  };
}

// Pre-configured rate limiters
export const globalApiRateLimiter = createRateLimiter(
  globalRateLimitMap,
  150, // 150 requests
  15 * 60 * 1000, // per 15 minutes
  "Muitas requisições enviadas. Proteção contra Negação de Serviço (DDoS) ativa. Tente novamente em alguns minutos."
);

export const authEndpointRateLimiter = createRateLimiter(
  authRateLimitMap,
  20, // 20 requests
  5 * 60 * 1000, // per 5 minutes
  "Muitas tentativas de autenticação. Proteção contra força bruta ativa. Aguarde 5 minutos."
);

export const pinBruteForceLimiter = createRateLimiter(
  pinRateLimitMap,
  8, // 8 attempts
  5 * 60 * 1000, // per 5 minutes
  "Limite de validação de PIN excedido. Proteção contra Credential Stuffing ativa."
);

/* =========================================================================
   SQL INJECTION (SQLi) PROTECTION ENGINE
   ========================================================================= */

// Known SQL Injection attack signature patterns
const SQLI_PATTERNS = [
  /(\b(SELECT|INSERT|UPDATE|DELETE|DROP|ALTER|CREATE|TRUNCATE|EXEC|UNION)\b)/i,
  /('|\"|\bOR\b|\bAND\b)\s*['\"]?\s*1\s*=\s*1/i,
  /('|\"|\bOR\b|\bAND\b)\s*['\"]?\s*['\"]/i,
  /--\s*$/m,
  /\/\*[\s\S]*?\*\//,
  /;\s*(DROP|DELETE|UPDATE|INSERT|CREATE|ALTER|TRUNCATE)\b/i,
  /WAITFOR\s+DELAY/i,
  /PG_SLEEP\(/i,
  /BENCHMARK\(/i,
  /HAVING\s+1=1/i
];

/**
 * Inspects values recursively for SQL injection signatures
 */
function containsSqlInjection(value: any): boolean {
  if (typeof value === "string") {
    // Check if value matches suspicious SQL injection vectors
    for (const pattern of SQLI_PATTERNS) {
      if (pattern.test(value)) {
        return true;
      }
    }
    return false;
  }

  if (typeof value === "object" && value !== null) {
    for (const key of Object.keys(value)) {
      if (containsSqlInjection(key) || containsSqlInjection(value[key])) {
        return true;
      }
    }
  }

  return false;
}

/**
 * Express Middleware: Anti-SQL Injection Defense Filter
 */
export function antiSqlInjectionMiddleware(req: express.Request, res: express.Response, next: express.NextFunction) {
  // Check Query Params
  if (req.query && containsSqlInjection(req.query)) {
    console.warn(`[Security Alert] SQL Injection attempt blocked in query params from IP ${getClientIp(req)}`);
    return res.status(400).json({ error: "Parâmetro de requisição com formato inválido ou suspeito detectado." });
  }

  // Check Body Payload
  if (req.body && containsSqlInjection(req.body)) {
    console.warn(`[Security Alert] SQL Injection attempt blocked in body payload from IP ${getClientIp(req)}`);
    return res.status(400).json({ error: "Conteúdo enviado rejeitado pelos filtros de segurança anti-SQLi." });
  }

  // Check URL Path Parameters
  if (req.params && containsSqlInjection(req.params)) {
    console.warn(`[Security Alert] SQL Injection attempt blocked in URL params from IP ${getClientIp(req)}`);
    return res.status(400).json({ error: "Identificador de URL inválido." });
  }

  next();
}

/* =========================================================================
   CROSS-SITE SCRIPTING (XSS) & INPUT SANITIZATION ENGINE
   ========================================================================= */

/**
 * Escapes dangerous HTML entities to prevent Reflected and Stored XSS
 */
export function escapeHtml(str: string): string {
  if (typeof str !== "string") return "";
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#x27;")
    .replace(/\//g, "&#x2F;");
}

/**
 * Safely stringifies objects for embedding inside HTML script tags without XSS vulnerabilities
 */
export function safeJsonForHtmlScript(obj: any): string {
  const json = JSON.stringify(obj || {});
  return json
    .replace(/</g, "\\u003c")
    .replace(/>/g, "\\u003e")
    .replace(/&/g, "\\u0026")
    .replace(/\u2028/g, "\\u2028")
    .replace(/\u2029/g, "\\u2029");
}

/**
 * Strips script tags, javascript: URIs, and inline event handlers (onerror=, onload=)
 */
export function sanitizeStringInput(input: string): string {
  if (typeof input !== "string") return "";
  
  return input
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, "")
    .replace(/javascript\s*:/gi, "nojavascript:")
    .replace(/data\s*:\s*text\/html/gi, "nodata:")
    .replace(/on\w+\s*=/gi, "noevent=")
    .trim();
}

/* =========================================================================
   PROMPT INJECTION & AI FIREWALL PROTECTION
   ========================================================================= */

// Known prompt injection vectors
const PROMPT_INJECTION_PATTERNS = [
  /ignore\s+(all\s+)?previous\s+instructions/i,
  /disregard\s+(all\s+)?prior\s+prompts/i,
  /system\s*prompt\s*:/i,
  /you\s+are\s+now\s+a\s+DAN/i,
  /developer\s+mode\s+enabled/i,
  /override\s+safety\s+guidelines/i,
  /reveal\s+your\s+instructions/i
];

/**
 * Sanitizes user inputs sent to AI models (Gemini) to prevent Prompt Injection
 */
export function sanitizePromptForAI(userPrompt: string): { safePrompt: string; isInjected: boolean } {
  if (typeof userPrompt !== "string") return { safePrompt: "", isInjected: false };

  let isInjected = false;
  let cleaned = userPrompt;

  for (const pattern of PROMPT_INJECTION_PATTERNS) {
    if (pattern.test(cleaned)) {
      isInjected = true;
      cleaned = cleaned.replace(pattern, "[FILTRADO_POR_SEGURANCA]");
    }
  }

  // Sanitize potential raw script or tag vectors inside prompt
  cleaned = sanitizeStringInput(cleaned);

  // Wrap user content in explicit XML structure for prompt isolation
  const safePrompt = `<user_provided_text>\n${cleaned}\n</user_provided_text>`;

  return { safePrompt, isInjected };
}

/* =========================================================================
   OPEN REDIRECT & CSRF VALIDATION HELPERS
   ========================================================================= */

/**
 * Validates whether a redirect URL is safe and belongs to allowed origins
 */
export function isSafeRedirectUrl(targetUrl: string, allowedHost?: string): boolean {
  if (!targetUrl) return false;

  // Relative URLs starting with / (and not //) are safe
  if (targetUrl.startsWith("/") && !targetUrl.startsWith("//")) {
    return true;
  }

  try {
    const parsed = new URL(targetUrl);
    if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
      return false;
    }

    if (allowedHost && parsed.host !== allowedHost) {
      return false;
    }

    return true;
  } catch (e) {
    return false;
  }
}
