import { WeeklyReview, MonthlyReview } from '../types';

export type MonthlyReviewTimingType = 'last_day' | 'first_day_next' | 'specific_day';

export interface ReviewWeeklyTiming {
  enabled: boolean;
  dayOfWeek: number; // 0 = Domingo, 1 = Segunda, 2 = Terça, 3 = Quarta, 4 = Quinta, 5 = Sexta, 6 = Sábado
  time: string; // HH:mm format, e.g. "19:00"
}

export interface ReviewMonthlyTiming {
  enabled: boolean;
  timingType: MonthlyReviewTimingType;
  dayOfMonth: number; // 1-31, used when timingType === 'specific_day'
  time: string; // HH:mm format, e.g. "20:00"
}

export interface ReviewRemindersSettings {
  weekly: ReviewWeeklyTiming;
  monthly: ReviewMonthlyTiming;
}

export const DEFAULT_REVIEW_REMINDERS_SETTINGS: ReviewRemindersSettings = {
  weekly: {
    enabled: true,
    dayOfWeek: 0, // Domingo por padrão (ou Sábado/Segunda)
    time: '19:00',
  },
  monthly: {
    enabled: true,
    timingType: 'last_day', // Último dia do mês
    dayOfMonth: 30,
    time: '20:00',
  },
};

export const REVIEW_REMINDERS_STORAGE_KEY = 'mbc_review_reminders_settings';

export const getReviewRemindersSettings = (): ReviewRemindersSettings => {
  try {
    const raw = localStorage.getItem(REVIEW_REMINDERS_STORAGE_KEY);
    if (!raw) return DEFAULT_REVIEW_REMINDERS_SETTINGS;
    const parsed = JSON.parse(raw);
    return {
      weekly: {
        enabled: parsed.weekly?.enabled !== undefined ? !!parsed.weekly.enabled : DEFAULT_REVIEW_REMINDERS_SETTINGS.weekly.enabled,
        dayOfWeek: typeof parsed.weekly?.dayOfWeek === 'number' ? parsed.weekly.dayOfWeek : DEFAULT_REVIEW_REMINDERS_SETTINGS.weekly.dayOfWeek,
        time: parsed.weekly?.time || DEFAULT_REVIEW_REMINDERS_SETTINGS.weekly.time,
      },
      monthly: {
        enabled: parsed.monthly?.enabled !== undefined ? !!parsed.monthly.enabled : DEFAULT_REVIEW_REMINDERS_SETTINGS.monthly.enabled,
        timingType: parsed.monthly?.timingType || DEFAULT_REVIEW_REMINDERS_SETTINGS.monthly.timingType,
        dayOfMonth: typeof parsed.monthly?.dayOfMonth === 'number' ? parsed.monthly.dayOfMonth : DEFAULT_REVIEW_REMINDERS_SETTINGS.monthly.dayOfMonth,
        time: parsed.monthly?.time || DEFAULT_REVIEW_REMINDERS_SETTINGS.monthly.time,
      },
    };
  } catch (e) {
    console.error('Failed to load review reminders settings', e);
    return DEFAULT_REVIEW_REMINDERS_SETTINGS;
  }
};

export const saveReviewRemindersSettings = (settings: ReviewRemindersSettings): void => {
  try {
    localStorage.setItem(REVIEW_REMINDERS_STORAGE_KEY, JSON.stringify(settings));
    window.dispatchEvent(new CustomEvent('mbc_review_reminders_changed', { detail: settings }));
    window.dispatchEvent(new Event('storage'));
  } catch (e) {
    console.error('Failed to save review reminders settings', e);
  }
};

export const WEEK_DAYS_OPTIONS = [
  { value: 0, label: 'Domingo', description: 'Fechamento tradicional do fim de semana' },
  { value: 6, label: 'Sábado', description: 'Balanço da semana antes do descanso' },
  { value: 1, label: 'Segunda-feira', description: 'Primeiro dia da próxima semana / planejamento' },
  { value: 5, label: 'Sexta-feira', description: 'Encerramento dos dias úteis' },
  { value: 4, label: 'Quinta-feira', description: 'Pré-fim de semana' },
  { value: 3, label: 'Quarta-feira', description: 'Meio da semana' },
  { value: 2, label: 'Terça-feira', description: 'Início do ciclo' },
];

export const MONTH_TIMING_OPTIONS = [
  { 
    value: 'last_day' as MonthlyReviewTimingType, 
    label: 'Último dia do mês', 
    description: 'Dispara no encerramento exato do mês (dia 28, 29, 30 ou 31)' 
  },
  { 
    value: 'first_day_next' as MonthlyReviewTimingType, 
    label: 'Primeiro dia do próximo mês', 
    description: 'Dispara no dia 1º para avaliar o mês anterior e abrir o novo ciclo' 
  },
  { 
    value: 'specific_day' as MonthlyReviewTimingType, 
    label: 'Dia fixo específico', 
    description: 'Escolha um dia determinado (ex: dia 30, dia 28...)' 
  },
];

export const getWeeklyReviewDayLabel = (dayOfWeek: number): string => {
  switch (dayOfWeek) {
    case 0: return 'Domingo';
    case 1: return 'Segunda-feira (Primeiro dia da próxima semana)';
    case 2: return 'Terça-feira';
    case 3: return 'Quarta-feira';
    case 4: return 'Quinta-feira';
    case 5: return 'Sexta-feira';
    case 6: return 'Sábado';
    default: return 'Domingo';
  }
};

export const getMonthlyReviewTimingLabel = (monthly: ReviewMonthlyTiming): string => {
  if (monthly.timingType === 'last_day') {
    return 'Último dia do mês';
  }
  if (monthly.timingType === 'first_day_next') {
    return 'Primeiro dia do próximo mês';
  }
  return `Dia ${monthly.dayOfMonth} de cada mês`;
};

export const getWeekNumber = (d: Date = new Date()): number => {
  const date = new Date(d.getTime());
  date.setHours(0, 0, 0, 0);
  date.setDate(date.getDate() + 3 - (date.getDay() + 6) % 7);
  const week1 = new Date(date.getFullYear(), 0, 4);
  return 1 + Math.round(((date.getTime() - week1.getTime()) / 86400000 - 3 + (week1.getDay() + 6) % 7) / 7);
};

export const isTodayWeeklyReviewDay = (
  settings: ReviewRemindersSettings = getReviewRemindersSettings(),
  now: Date = new Date()
): boolean => {
  if (!settings.weekly.enabled) return false;
  return now.getDay() === settings.weekly.dayOfWeek;
};

export const isTodayMonthlyReviewDay = (
  settings: ReviewRemindersSettings = getReviewRemindersSettings(),
  now: Date = new Date()
): boolean => {
  if (!settings.monthly.enabled) return false;

  const currentDay = now.getDate();
  const currentMonth = now.getMonth();
  const currentYear = now.getFullYear();

  if (settings.monthly.timingType === 'last_day') {
    // Tomorrow is day 1 of next month
    const tomorrow = new Date(currentYear, currentMonth, currentDay + 1);
    return tomorrow.getDate() === 1;
  }

  if (settings.monthly.timingType === 'first_day_next') {
    // Today is the 1st of the month
    return currentDay === 1;
  }

  if (settings.monthly.timingType === 'specific_day') {
    // Cap at the last day of this month in case month has fewer days (e.g. Feb 28)
    const lastDayOfMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
    const targetDay = Math.min(settings.monthly.dayOfMonth || 30, lastDayOfMonth);
    return currentDay === targetDay;
  }

  return false;
};

/**
 * Returns which month index (0-11) and year the user is being reminded to review.
 * If timingType is 'first_day_next', on the 1st day of the month they are reviewing the PREVIOUS month.
 */
export const getTargetReviewMonthAndYear = (
  settings: ReviewRemindersSettings = getReviewRemindersSettings(),
  now: Date = new Date()
): { month: number; year: number } => {
  if (settings.monthly.timingType === 'first_day_next' && now.getDate() === 1) {
    const prevDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    return { month: prevDate.getMonth(), year: prevDate.getFullYear() };
  }
  return { month: now.getMonth(), year: now.getFullYear() };
};

export const hasCompletedWeeklyReview = (
  weeklyReviews: WeeklyReview[],
  weekNum?: number,
  year?: number
): boolean => {
  const now = new Date();
  const targetYear = year ?? now.getFullYear();
  const targetWeek = weekNum ?? getWeekNumber(now);

  const existing = weeklyReviews.find(r => r.year === targetYear && r.weekNumber === targetWeek);
  if (!existing) return false;

  const hasSentence = !!existing.oneSentence && existing.oneSentence.trim().length > 0;
  const hasMemorable = !!existing.memorableMoments && existing.memorableMoments.some(m => m && m.trim().length > 0);
  const hasLearnings = !!existing.learnings && existing.learnings.some(l => l && l.trim().length > 0);
  const hasImprovements = !!existing.improvements && existing.improvements.some(i => i && i.trim().length > 0);

  return hasSentence || hasMemorable || hasLearnings || hasImprovements;
};

export const hasCompletedMonthlyReview = (
  monthlyReviews: MonthlyReview[],
  month?: number,
  year?: number
): boolean => {
  const now = new Date();
  const targetYear = year ?? now.getFullYear();
  const targetMonth = month ?? now.getMonth();

  const existing = monthlyReviews.find(r => r.year === targetYear && r.month === targetMonth);
  if (!existing) return false;

  const hasSentence = !!existing.oneSentence && existing.oneSentence.trim().length > 0;
  const hasMemorable = !!existing.memorableMoments && existing.memorableMoments.some(m => m && m.trim().length > 0);
  const hasLearnings = !!existing.learnings && existing.learnings.some(l => l && l.trim().length > 0);
  const hasImprovements = !!existing.improvements && existing.improvements.some(i => i && i.trim().length > 0);

  return hasSentence || hasMemorable || hasLearnings || hasImprovements;
};
