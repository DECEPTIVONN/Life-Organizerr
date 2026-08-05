export interface SubTask {
  id: string;
  text: string;
  completed: boolean;
}

export interface DailyTask {
  id: string;
  text: string;
  completed: boolean;
  xpReward: number;
  category: string;
  isRecurring?: boolean;
  period?: 'manha' | 'noite' | 'geral';
  subtasks?: SubTask[];
  reminderTime?: string;
  createdDate?: string;
}

export interface BookTracker {
  bookName?: string;
  totalPages: number;
  deadlineDays: number;
  pagesRead: number;
  startedDate?: string;
  history?: { date: string; pagesReadToday: number; dailyTarget: number }[];
}

export interface BibleTracker {
  vezesNoAno?: number;
  capitulosPorDia?: number;
  capitulosJaLidos: number;
  chaptersReadToday?: number; // tracker for current day
  lastReadDate?: string; // tracker for current day
  history?: { date: string; chaptersReadToday: number; dailyTarget: number }[];
}

export interface Goal {
  id: string;
  title: string;
  actionsDone: number;
  actionsTotal: number;
  completed: boolean;
  xpReward: number;
  isRecurring?: boolean;
  streak?: number;
  lastCompletedDate?: string;
  area?: string; // Saúde, Financeiro, Social, Hobbies, Espiritualidade, Físico, Carreira
  createdAt?: string; // YYYY-MM-DD
  updatedAt?: string; // YYYY-MM-DD (optional)
  deadline?: string; // YYYY-MM-DD (optional)
  completedAt?: string; // YYYY-MM-DD
  notes?: { id: string; date: string; text: string; actionIndex?: number }[];
}

export interface TimelineAction {
  id: string;
  text: string;
  completed: boolean;
  horizon: '1_day' | '1_week' | '1_month' | '1_year' | '3_years' | '10_years';
}

export interface TimelineGoal {
  id: string;
  objective: string;
  targetDate?: string;
  createdAt: string;
  actions: TimelineAction[];
}

export interface FinanceEntry {
  id: string;
  type: 'income' | 'expense' | 'investment';
  amount: number;
  category: string;
  description: string;
  date: string;
  isRecurring?: boolean;
  recurringType?: 'always' | 'months' | 'until_date';
  recurringMonths?: number;
  recurringUntilDate?: string;
}

export interface CalendarNote {
  id: string;
  date: string; // YYYY-MM-DD
  title: string;
  content: string;
  journalText?: string;
  gratitudeText?: string;
  decreesText?: string;
  prayerText?: string;
  isDailyRecord?: boolean;
  checklist?: DailyTask[];
  alterEgoWinner?: 'Alfredo' | 'Beto' | null;
  alterEgoText?: string;
  sleepBedTime?: string;
  sleepWakeTime?: string;
  foodMorning?: string;
  foodAfternoon?: string;
  foodNight?: string;
  waterLiters?: number;
  reminderTime?: string; // e.g., "14:00"
}

export interface ArchivedDocument {
  id: string;
  name: string;
  category: string;
  date: string;
  size: string;
}

export interface Note {
  id: string;
  title: string;
  content: string;
  tags: string[];
  updatedAt: string;
  createdAt?: string;
  archived?: boolean;
  reminderTime?: string; // e.g., "10:30"
  reminderDate?: string; // e.g., "2026-07-25"
  reminderRecurrence?: 'none' | 'daily' | 'weekly' | 'monthly'; // e.g., "none" | "daily" | "weekly" | "monthly"
}

export interface RoutineItem {
  id: string;
  dayOfWeek: number; // 0 = Sunday, 1 = Monday, etc. (use -1 for every day)
  time: string; // e.g., "08:00"
  endTime?: string; // e.g., "09:00"
  task: string;
  completed: boolean;
  isEveryDay?: boolean;
  isWeeklyRecurring?: boolean;
  completedDays?: number[]; // indices of days completed (0-6)
  category?: string; // e.g., "Trabalho", "Exercício", "Estudo", "Lazer", "Rotina", "Outro"
  reminderTime?: string; // e.g., "08:00"
}

export interface UserStats {
  level: number;
  xp: number;
  streak: number;
  xpTotal: number;
  badgesCount: number;
}

export interface MonthlyReview {
  id: string;
  year: number;
  month: number; // 0-11
  oneSentence: string;
  memorableMoments: string[];
  learnings: string[];
  improvements: string[];
}

export interface WeeklyReview {
  id: string;
  year: number;
  weekNumber: number; // 1-53 or calendar week
  oneSentence: string;
  memorableMoments: string[];
  learnings: string[];
  improvements: string[];
  readings?: string;
}

export interface FutureEvent {
  id: string;
  name: string;
  date: string; // YYYY-MM-DD
  tags: string[]; // e.g., ["Viagem", "Trabalho", "Estudos", "Importante"]
}

export interface Habit {
  id: string;
  name: string;
  type: 'good' | 'bad'; // 'good' = Bom, 'bad' = Ruim
  category: string; // e.g., 'Exercício', 'Suplemento', 'Leitura', 'Saúde', 'Trabalho', 'Estudo', 'Outro'
  frequency: string; // e.g., 'Diário', '3x na semana', 'Personalizado', etc.
  history: Record<string, boolean>; // key: YYYY-MM-DD, value: true if completed (for good) or avoided (for bad)
  createdAt: string; // YYYY-MM-DD
}

export interface YearlyBook {
  id: string;
  year: number;
  title: string;
  author: string;
  totalPages: number;
  pagesRead: number;
  status: 'lendo' | 'lido' | 'quero_ler' | 'dropado';
  rating?: number; // 1-5 stars
  review?: string;
  startDate?: string;
  endDate?: string;
  readingInterval?: string; // dd/mm/yyyy - dd/mm/yyyy
}export interface VisionBoardCard {
  id: string;
  area: string; // 'Saúde', 'Financeiro', 'Social', 'Hobbies', 'Espiritualidade', 'Físico', 'Carreira'
  title: string;
  imageUrl: string;
  caption?: string;
  targetYear?: string;
  completed?: boolean;
  createdAt?: string;
  orientation?: 'horizontal' | 'vertical';
}

export interface QuickReminder {
  id: string;
  title: string;
  description?: string;
  mode: 'timer' | 'cronometer' | 'pomodoro';
  durationSeconds?: number;
  targetTimestamp?: number;
  paused?: boolean;
  remainingSecondsWhenPaused?: number;
  scheduledDate?: string;
  scheduledTime?: string;
  recurrence?: 'none' | 'daily' | 'workdays' | 'weekly';
  category?: 'Foco' | 'Saúde' | 'Trabalho' | 'Estudo' | 'Pessoal' | 'Outros';
  priority?: 'baixa' | 'media' | 'alta';
  soundEnabled?: boolean;
  status: 'active' | 'triggered' | 'completed' | 'paused';
  createdAt: string;
  triggeredAt?: string;

  // Pomodoro Configuration & Runtime State
  pomodoroTotalMinutes?: number;
  pomodoroFocusMinutes?: number;
  pomodoroBreakMinutes?: number;
  pomodoroBreakMode?: 'interval' | 'specific'; // 'interval' = a cada X min, 'specific' = em X min específicos
  pomodoroSpecificBreakMinute?: number;
  pomodoroCurrentPhase?: 'focus' | 'break';
  pomodoroCurrentCycle?: number;
  pomodoroTotalCycles?: number;
  pomodoroPhaseEndTimestamp?: number;
  pomodoroPhaseRemainingSeconds?: number;
}

