// src/utils/streakStore.ts

export interface CategoryStreak {
  id: 'checklist' | 'habits' | 'reading' | 'journal';
  name: string;
  description: string;
  currentStreak: number;
  bestStreak: number;
  lastActiveDate: string; // YYYY-MM-DD
  completedToday: boolean;
  color: string; // e.g. 'orange', 'emerald', 'blue', 'purple'
}

export interface StreakMilestone {
  id: string;
  daysRequired: number;
  title: string;
  description: string;
  xpReward: number;
  badge: string;
}

export const STREAK_MILESTONES: StreakMilestone[] = [
  { id: 'm3', daysRequired: 3, title: 'Primeira Centelha', description: '3 dias seguidos de foco total', xpReward: 50, badge: '🔥 Centelha' },
  { id: 'm7', daysRequired: 7, title: 'Hábito de Bronze', description: '1 semana ininterrupta de disciplina', xpReward: 150, badge: '🥉 Bronze 7D' },
  { id: 'm14', daysRequired: 14, title: 'Dominador Semanal', description: '2 semanas consecutivas de vitórias', xpReward: 350, badge: '🥈 Prata 14D' },
  { id: 'm30', daysRequired: 30, title: 'Chama Inabalável', description: '1 mês inteiro de foco de alto nível', xpReward: 800, badge: '🥇 Ouro 30D' },
  { id: 'm60', daysRequired: 60, title: 'Mestre do Raciocínio', description: '60 dias de evolução sem interrupção', xpReward: 1800, badge: '💎 Diamante 60D' },
  { id: 'm100', daysRequired: 100, title: 'Lenda de Foco', description: '100 dias de constância épica', xpReward: 5000, badge: '👑 Lenda 100D' }
];

export interface WeeklyStreakQuest {
  id: string;
  title: string;
  description: string;
  targetCount: number;
  currentCount: number;
  xpReward: number;
  freezeReward: number;
  claimed: boolean;
  expiresInDays: number;
}

export interface StreakHubData {
  masterStreak: number;
  bestMasterStreak: number;
  streakFreezes: number; // Escudos disponíveis (ex: 2)
  maxFreezes: number;
  freezeUsedDates: string[]; // Datas em que congelamento foi consumido
  recoveryAvailable: boolean; // Se perdeu o streak ontem e pode resgatar hoje
  recoveryUsedDate?: string;
  claimedMilestones: string[]; // IDs dos marcos já resgatados
  weeklyQuest: WeeklyStreakQuest;
  categoryStreaks: {
    checklist: CategoryStreak;
    habits: CategoryStreak;
    reading: CategoryStreak;
    journal: CategoryStreak;
  };
}

const STORAGE_KEY = 'mbc_streak_hub_v2';

export const getDefaultStreakData = (): StreakHubData => {
  const todayStr = new Date().toISOString().split('T')[0];
  const storedStreak = parseInt(localStorage.getItem('mbc_streak') || '4', 10);

  return {
    masterStreak: storedStreak,
    bestMasterStreak: Math.max(storedStreak, 12),
    streakFreezes: 2,
    maxFreezes: 3,
    freezeUsedDates: [],
    recoveryAvailable: false,
    claimedMilestones: storedStreak >= 3 ? ['m3'] : [],
    weeklyQuest: {
      id: 'wq_1',
      title: 'Semana Inabalável: 5/5 Vitórias',
      description: 'Mantenha a ofensiva ativa por pelo menos 5 dias nesta semana',
      targetCount: 5,
      currentCount: Math.min(storedStreak, 4),
      xpReward: 350,
      freezeReward: 1,
      claimed: false,
      expiresInDays: 3
    },
    categoryStreaks: {
      checklist: {
        id: 'checklist',
        name: 'Missões Diárias',
        description: 'Checklist e tarefas diárias concluídas',
        currentStreak: storedStreak,
        bestStreak: Math.max(storedStreak, 10),
        lastActiveDate: todayStr,
        completedToday: true,
        color: 'from-orange-500 to-amber-500'
      },
      habits: {
        id: 'habits',
        name: 'Hábitos Frequentes',
        description: 'Execução de rotinas e bons hábitos',
        currentStreak: Math.max(1, storedStreak - 1),
        bestStreak: 8,
        lastActiveDate: todayStr,
        completedToday: true,
        color: 'from-emerald-500 to-teal-500'
      },
      reading: {
        id: 'reading',
        name: 'Leitura & Estudos',
        description: 'Páginas lidas de livros ou leitura bíblica',
        currentStreak: 3,
        bestStreak: 7,
        lastActiveDate: todayStr,
        completedToday: false,
        color: 'from-blue-500 to-cyan-500'
      },
      journal: {
        id: 'journal',
        name: 'Espaço Diário & Fé',
        description: 'Reflexões, gratidões e orações diárias',
        currentStreak: 5,
        bestStreak: 14,
        lastActiveDate: todayStr,
        completedToday: true,
        color: 'from-purple-500 to-pink-500'
      }
    }
  };
};

export const loadStreakHubData = (): StreakHubData => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      // Ensure structure exists
      const defaults = getDefaultStreakData();
      return {
        ...defaults,
        ...parsed,
        categoryStreaks: {
          ...defaults.categoryStreaks,
          ...(parsed.categoryStreaks || {})
        }
      };
    }
  } catch (e) {
    console.error('Error loading streak hub data', e);
  }
  return getDefaultStreakData();
};

export const saveStreakHubData = (data: StreakHubData) => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    localStorage.setItem('mbc_streak', data.masterStreak.toString());
  } catch (e) {
    console.error('Error saving streak hub data', e);
  }
};

/**
 * Returns Flame level information based on active streak days
 */
export interface HeatmapDay {
  dateStr: string; // YYYY-MM-DD
  dayNum: number;
  weekday: string;
  intensity: 0 | 1 | 2 | 3 | 4; // 0: empty, 1: low, 2: medium, 3: high, 4: max
  tasksDone: number;
}

export const generateLast28DaysHeatmap = (currentStreak: number): HeatmapDay[] => {
  const days: HeatmapDay[] = [];
  const today = new Date();
  
  for (let i = 27; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    const dateStr = d.toISOString().split('T')[0];
    const dayNum = d.getDate();
    const weekday = d.toLocaleDateString('pt-BR', { weekday: 'narrow' }).toUpperCase();
    
    // Determine intensity based on if within current streak or pseudo-random history
    const isStreakDay = i < currentStreak;
    let intensity: 0 | 1 | 2 | 3 | 4 = 0;
    let tasksDone = 0;

    if (isStreakDay) {
      // Current streak days are filled with high/max activity
      intensity = (3 + (i % 2)) as 3 | 4;
      tasksDone = 5 + (i % 4);
    } else {
      // Historical pattern for non-streak days
      const hash = (i * 7 + 13) % 10;
      if (hash > 6) {
        intensity = 2;
        tasksDone = 3;
      } else if (hash > 3) {
        intensity = 1;
        tasksDone = 1;
      } else {
        intensity = 0;
        tasksDone = 0;
      }
    }

    days.push({
      dateStr,
      dayNum,
      weekday,
      intensity,
      tasksDone
    });
  }

  return days;
};

export const getFlameTier = (days: number) => {
  if (days >= 30) {
    return {
      tier: 'Chama Sagrada',
      badgeColor: 'border-purple-500/50 bg-purple-500/10 text-purple-300',
      flameGradient: 'from-purple-500 via-pink-500 to-amber-400',
      glow: 'shadow-[0_0_20px_rgba(168,85,247,0.4)]',
      multiplier: '3.0x XP',
      iconColor: 'text-purple-400'
    };
  } else if (days >= 14) {
    return {
      tier: 'Chama de Diamante',
      badgeColor: 'border-cyan-500/50 bg-cyan-500/10 text-cyan-300',
      flameGradient: 'from-cyan-400 via-blue-500 to-indigo-500',
      glow: 'shadow-[0_0_20px_rgba(6,182,212,0.4)]',
      multiplier: '2.0x XP',
      iconColor: 'text-cyan-400'
    };
  } else if (days >= 7) {
    return {
      tier: 'Chama de Ouro',
      badgeColor: 'border-amber-500/50 bg-amber-500/10 text-amber-300',
      flameGradient: 'from-amber-400 via-orange-500 to-yellow-500',
      glow: 'shadow-[0_0_20px_rgba(245,158,11,0.4)]',
      multiplier: '1.5x XP',
      iconColor: 'text-amber-400'
    };
  } else if (days >= 3) {
    return {
      tier: 'Chama de Prata',
      badgeColor: 'border-zinc-400/50 bg-zinc-400/10 text-zinc-300',
      flameGradient: 'from-zinc-300 via-zinc-400 to-amber-500',
      glow: 'shadow-[0_0_15px_rgba(212,212,216,0.3)]',
      multiplier: '1.2x XP',
      iconColor: 'text-zinc-300'
    };
  } else {
    return {
      tier: 'Chama de Bronze',
      badgeColor: 'border-orange-500/30 bg-orange-500/10 text-orange-400',
      flameGradient: 'from-orange-500 to-amber-600',
      glow: 'shadow-[0_0_12px_rgba(249,115,22,0.3)]',
      multiplier: '1.0x XP',
      iconColor: 'text-orange-500'
    };
  }
};
