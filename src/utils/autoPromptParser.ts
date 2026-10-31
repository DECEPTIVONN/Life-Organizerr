/**
 * Utility to parse natural language scheduled prompt strings.
 * Examples supported:
 * - "(todo dias as 15hrs) pesquise e informe a temperatura e previsão do tempo para São Paulo"
 * - "(todo dia 15 de dezembro as 7hrs) me lembre: hoje é aniversário de João Inácio , lembre-se de dar parabéns pra ele"
 * - "(dia 28/10 não repetir) me lembre de fazer compras no mercado"
 * - "(todos os dias às 08:30) resumo das principais tarefas de hoje"
 * - "(semanalmente toda segunda às 09h) relatório de metas semanais"
 */

export interface ParsedScheduleResult {
  cleanPrompt: string;
  date: string; // YYYY-MM-DD
  time: string; // HH:mm
  recurrence: 'none' | 'daily' | 'weekly' | 'monthly' | 'yearly';
  extractedMetaDesc: string;
}

const MONTHS_MAP: Record<string, number> = {
  janeiro: 0,
  jan: 0,
  fevereiro: 1,
  fev: 1,
  março: 2,
  marco: 2,
  mar: 2,
  abril: 3,
  abr: 3,
  maio: 4,
  mai: 4,
  junho: 5,
  jun: 5,
  julho: 6,
  jul: 6,
  agosto: 7,
  ago: 7,
  setembro: 8,
  set: 8,
  outubro: 9,
  out: 9,
  novembro: 10,
  nov: 10,
  dezembro: 11,
  dez: 11,
};

export function parseAutoPromptSchedule(input: string): ParsedScheduleResult {
  const trimmed = input.trim();
  const now = new Date();
  const currentYear = now.getFullYear();

  let targetDate = `${currentYear}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
  let targetTime = '09:00';
  let recurrence: 'none' | 'daily' | 'weekly' | 'monthly' | 'yearly' = 'none';
  let cleanPrompt = trimmed;
  let schedulePart = '';

  // 1. Look for parentheses block, e.g. "(...)" at beginning or within the string
  const parenMatch = trimmed.match(/^\s*\(([^)]+)\)\s*(.*)$/s);
  if (parenMatch) {
    schedulePart = parenMatch[1].toLowerCase().trim();
    cleanPrompt = parenMatch[2].trim();
  }

  if (schedulePart) {
    // Check recurrence keywords
    if (/não\s+repetir|nao\s+repetir|apenas\s+uma\s+vez|única\s+vez/i.test(schedulePart)) {
      recurrence = 'none';
    } else if (/todo\s*dias?|todos\s+os\s+dias|diariamente|di[aá]rio/i.test(schedulePart)) {
      // Could be "todo dia 15 de dezembro" -> yearly!
      if (/todo\s+dia\s+\d+\s+de\s+[a-zç]+/i.test(schedulePart)) {
        recurrence = 'yearly';
      } else if (/todo\s+dia\s+\d+/i.test(schedulePart)) {
        recurrence = 'monthly';
      } else {
        recurrence = 'daily';
      }
    } else if (/semanalmente|toda\s+(segunda|terça|terca|quarta|quinta|sexta|sábado|sabado|domingo)/i.test(schedulePart)) {
      recurrence = 'weekly';
    } else if (/mensalmente|todo\s+m[eê]s/i.test(schedulePart)) {
      recurrence = 'monthly';
    } else if (/anualmente|todo\s+ano/i.test(schedulePart)) {
      recurrence = 'yearly';
    }

    // Time extraction: e.g. "as 15hrs", "às 15h", "as 15:30", "15hrs", "7hrs", "às 7"
    const timeMatch = schedulePart.match(/(?:[aàá]s\s*)?(\d{1,2})(?:[:h](\d{2}))?\s*(?:hrs?|horas?)?/i);
    if (timeMatch) {
      let hours = parseInt(timeMatch[1], 10);
      let mins = timeMatch[2] ? parseInt(timeMatch[2], 10) : 0;
      if (hours >= 0 && hours <= 23 && mins >= 0 && mins <= 59) {
        targetTime = `${String(hours).padStart(2, '0')}:${String(mins).padStart(2, '0')}`;
      }
    }

    // Specific Date extraction: e.g. "15 de dezembro" or "dia 28/10" or "28/10/2026"
    const slashDateMatch = schedulePart.match(/(\d{1,2})\/(\d{1,2})(?:\/(\d{4}))?/);
    if (slashDateMatch) {
      const day = parseInt(slashDateMatch[1], 10);
      const month = parseInt(slashDateMatch[2], 10);
      const year = slashDateMatch[3] ? parseInt(slashDateMatch[3], 10) : currentYear;
      targetDate = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    } else {
      const writtenDateMatch = schedulePart.match(/(\d{1,2})\s+de\s+([a-zç]+)/i);
      if (writtenDateMatch) {
        const day = parseInt(writtenDateMatch[1], 10);
        const monthName = writtenDateMatch[2].toLowerCase();
        if (MONTHS_MAP[monthName] !== undefined) {
          const monthIndex = MONTHS_MAP[monthName] + 1;
          targetDate = `${currentYear}-${String(monthIndex).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
          if (!schedulePart.includes('não repetir') && !schedulePart.includes('nao repetir')) {
            recurrence = 'yearly';
          }
        }
      }
    }
  }

  // Format description
  const recLabels: Record<string, string> = {
    none: 'Execução única (não repete)',
    daily: 'Repete diariamente',
    weekly: 'Repete semanalmente',
    monthly: 'Repete mensalmente',
    yearly: 'Repete anualmente',
  };

  const extractedMetaDesc = `${recLabels[recurrence]} às ${targetTime} (início: ${targetDate})`;

  return {
    cleanPrompt: cleanPrompt || input,
    date: targetDate,
    time: targetTime,
    recurrence,
    extractedMetaDesc,
  };
}
