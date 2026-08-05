// src/utils/leagueStore.ts

export interface League {
  id: string;
  name: string;
  divisionName: string;
  badgeIcon: 'trophy' | 'medal' | 'award' | 'gem' | 'flame' | 'crown';
  color: string;
  bgColor: string;
  borderColor: string;
  glowColor: string;
  xpMultiplier: number;
}

export const LEAGUES: League[] = [
  {
    id: 'bronze',
    name: 'BRONZE',
    divisionName: 'DIVISÃO BRONZE',
    badgeIcon: 'trophy',
    color: 'text-amber-400',
    bgColor: 'bg-amber-500/15',
    borderColor: 'border-amber-500/40',
    glowColor: 'rgba(245, 158, 11, 0.3)',
    xpMultiplier: 1.0,
  },
  {
    id: 'prata',
    name: 'PRATA',
    divisionName: 'DIVISÃO PRATA',
    badgeIcon: 'medal',
    color: 'text-slate-300',
    bgColor: 'bg-slate-400/15',
    borderColor: 'border-slate-400/40',
    glowColor: 'rgba(148, 163, 184, 0.3)',
    xpMultiplier: 1.3,
  },
  {
    id: 'ouro',
    name: 'OURO',
    divisionName: 'DIVISÃO OURO',
    badgeIcon: 'award',
    color: 'text-yellow-400',
    bgColor: 'bg-yellow-500/15',
    borderColor: 'border-yellow-500/40',
    glowColor: 'rgba(234, 179, 8, 0.3)',
    xpMultiplier: 1.7,
  },
  {
    id: 'safira',
    name: 'SAFIRA',
    divisionName: 'DIVISÃO SAFIRA',
    badgeIcon: 'gem',
    color: 'text-cyan-400',
    bgColor: 'bg-cyan-500/15',
    borderColor: 'border-cyan-500/40',
    glowColor: 'rgba(6, 182, 212, 0.3)',
    xpMultiplier: 2.2,
  },
  {
    id: 'rubi',
    name: 'RUBI',
    divisionName: 'DIVISÃO RUBI',
    badgeIcon: 'flame',
    color: 'text-rose-400',
    bgColor: 'bg-rose-500/15',
    borderColor: 'border-rose-500/40',
    glowColor: 'rgba(244, 63, 94, 0.3)',
    xpMultiplier: 2.8,
  },
  {
    id: 'diamante',
    name: 'DIAMANTE',
    divisionName: 'DIVISÃO DIAMANTE',
    badgeIcon: 'crown',
    color: 'text-purple-400',
    bgColor: 'bg-purple-500/15',
    borderColor: 'border-purple-500/40',
    glowColor: 'rgba(168, 85, 247, 0.3)',
    xpMultiplier: 3.5,
  },
];

export interface LeagueParticipant {
  id: string;
  name: string;
  avatarIcon: 'crown' | 'zap' | 'shield' | 'sprout' | 'moon';
  subtitle: string;
  description: string;
  level: number;
  xp: number;
  isUser?: boolean;
  countryFlag: string;
  badgeBg: string;
  textColor: string;
  borderColor: string;
  rank?: number;
  zone?: 'promotion' | 'maintain' | 'relegation';
}

export interface UserLeagueState {
  weeklyLeagueIndex: number;
  monthlyLeagueIndex: number;
  userWeeklyXP: number;
  userMonthlyXP: number;
  lastXPUpdateDate: string;
  weeklyCycleStartDate: string;
  monthlyCycleStartDate: string;
  weeklyHistory: Array<{ week: string; leagueIndex: number; finalRank: number; xp: number }>;
  monthlyHistory: Array<{ month: string; leagueIndex: number; finalRank: number; xp: number }>;
}

const STORAGE_KEY = 'mbc_league_store_v4';

export function loadLeagueState(): UserLeagueState {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      return JSON.parse(saved);
    }
  } catch (e) {
    console.error('Failed to load league store', e);
  }

  const nowStr = new Date().toISOString().split('T')[0];
  return {
    weeklyLeagueIndex: 0, // Starts in Bronze
    monthlyLeagueIndex: 0, // Starts in Bronze
    userWeeklyXP: 121,
    userMonthlyXP: 480,
    lastXPUpdateDate: nowStr,
    weeklyCycleStartDate: nowStr,
    monthlyCycleStartDate: nowStr,
    weeklyHistory: [],
    monthlyHistory: [],
  };
}

export function saveLeagueState(state: UserLeagueState): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch (e) {
    console.error('Failed to save league store', e);
  }
}

export function getLeagueParticipants(
  mode: 'weekly' | 'monthly',
  leagueIndex: number,
  userXP: number,
  userLevel: number,
  userName: string = 'GABRIEL GS'
): LeagueParticipant[] {
  const safeIndex = Math.min(Math.max(leagueIndex, 0), LEAGUES.length - 1);
  const league = LEAGUES[safeIndex];
  const mult = league.xpMultiplier;

  const isWeekly = mode === 'weekly';
  const displayUserXP = Math.max(0, userXP);

  // 1. Beto: Indisciplinado e improdutivo
  const betoXP = Math.round((isWeekly ? 35 : 140) * mult);

  // 2. Alberto: Buscando melhorar de vida, em evolução
  const albertoXP = Math.round((isWeekly ? 75 : 300) * mult);

  // 3. Alfredo: Cumpre todos os deveres, disciplina inabalável
  const alfredoXP = Math.round((isWeekly ? 120 : 480) * mult);

  // 4. Prime: A melhor versão do usuário, teto máximo
  const primeBase = isWeekly ? 155 : 620;
  const primeXP = Math.round(Math.max(displayUserXP * 1.12, primeBase * mult));

  const displayName = userName && userName.trim() !== '' ? userName : 'GABRIEL GS';

  const rawParticipants: LeagueParticipant[] = [
    {
      id: 'user',
      name: displayName,
      avatarIcon: 'crown',
      subtitle: `NÍVEL ${userLevel} • VOCÊ`,
      description: 'Sua pontuação real ganha com atividades e tarefas cumpridas',
      level: userLevel,
      xp: displayUserXP,
      isUser: true,
      countryFlag: 'BR',
      badgeBg: 'bg-purple-600/30 text-purple-300 border border-purple-500/50 shadow-sm shadow-purple-500/20',
      textColor: 'text-purple-300 font-extrabold',
      borderColor: 'border-purple-500/60',
    },
    {
      id: 'prime',
      name: 'Prime',
      avatarIcon: 'zap',
      subtitle: `NÍVEL ${Math.max(userLevel + 4, 12)} • SUA MELHOR VERSÃO`,
      description: 'Faz além do proposto, foco inabalável e rendimento máximo',
      level: Math.max(userLevel + 4, 12),
      xp: primeXP,
      countryFlag: 'BR',
      badgeBg: 'bg-amber-500/20 text-amber-300 border border-amber-500/40 shadow-sm shadow-amber-500/20',
      textColor: 'text-amber-400 font-extrabold',
      borderColor: 'border-amber-500/30',
    },
    {
      id: 'alfredo',
      name: 'Alfredo',
      avatarIcon: 'shield',
      subtitle: `NÍVEL ${Math.max(userLevel + 1, 8)} • DISCIPLINA INABALÁVEL`,
      description: 'Cumpre todas as metas diárias e tarefas sem falhar',
      level: Math.max(userLevel + 1, 8),
      xp: alfredoXP,
      countryFlag: 'PT',
      badgeBg: 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 shadow-sm shadow-emerald-500/20',
      textColor: 'text-emerald-400 font-extrabold',
      borderColor: 'border-emerald-500/30',
    },
    {
      id: 'alberto',
      name: 'Alberto',
      avatarIcon: 'sprout',
      subtitle: `NÍVEL ${Math.max(userLevel - 1, 5)} • EM EVOLUÇÃO`,
      description: 'Buscando constante melhoria, ativo na maioria dos dias',
      level: Math.max(userLevel - 1, 5),
      xp: albertoXP,
      countryFlag: 'ES',
      badgeBg: 'bg-blue-500/20 text-blue-300 border border-blue-500/40 shadow-sm shadow-blue-500/20',
      textColor: 'text-blue-400 font-extrabold',
      borderColor: 'border-blue-500/30',
    },
    {
      id: 'beto',
      name: 'Beto',
      avatarIcon: 'moon',
      subtitle: `NÍVEL ${Math.max(userLevel - 3, 2)} • INDISCIPLINADO`,
      description: 'Procrastina e faz poucas tarefas diárias (versão a superar)',
      level: Math.max(userLevel - 3, 2),
      xp: betoXP,
      countryFlag: 'BR',
      badgeBg: 'bg-zinc-800 text-zinc-400 border border-zinc-700',
      textColor: 'text-zinc-400 font-medium',
      borderColor: 'border-zinc-800',
    },
  ];

  // Sort descending by XP. Tie-breaker gives user advantage
  rawParticipants.sort((a, b) => {
    if (b.xp !== a.xp) return b.xp - a.xp;
    if (a.isUser) return -1;
    if (b.isUser) return 1;
    return 0;
  });

  return rawParticipants.map((p, idx) => {
    const rank = idx + 1;
    let zone: 'promotion' | 'maintain' | 'relegation' = 'maintain';
    if (rank <= 2) zone = 'promotion';
    else if (rank >= 4) zone = 'relegation';

    return {
      ...p,
      rank,
      zone,
    };
  });
}

export function advanceLeagueCycle(
  state: UserLeagueState,
  mode: 'weekly' | 'monthly',
  userXP: number,
  userLevel: number,
  userName: string
): { newState: UserLeagueState; result: 'promoted' | 'maintained' | 'relegated'; newLeague: League } {
  const isWeekly = mode === 'weekly';
  const currentLeagueIndex = isWeekly ? state.weeklyLeagueIndex : state.monthlyLeagueIndex;

  const participants = getLeagueParticipants(mode, currentLeagueIndex, userXP, userLevel, userName);
  const userParticipant = participants.find((p) => p.isUser);
  const userRank = userParticipant?.rank || 3;

  let newLeagueIndex = currentLeagueIndex;
  let result: 'promoted' | 'maintained' | 'relegated' = 'maintained';

  if (userRank <= 2) {
    newLeagueIndex = Math.min(currentLeagueIndex + 1, LEAGUES.length - 1);
    result = 'promoted';
  } else if (userRank >= 4) {
    newLeagueIndex = Math.max(currentLeagueIndex - 1, 0);
    result = 'relegated';
  }

  const newState = { ...state };
  if (isWeekly) {
    newState.weeklyLeagueIndex = newLeagueIndex;
    newState.weeklyCycleStartDate = new Date().toISOString().split('T')[0];
    newState.weeklyHistory = [
      ...(newState.weeklyHistory || []),
      {
        week: new Date().toISOString().split('T')[0],
        leagueIndex: currentLeagueIndex,
        finalRank: userRank,
        xp: userXP,
      },
    ];
  } else {
    newState.monthlyLeagueIndex = newLeagueIndex;
    newState.monthlyCycleStartDate = new Date().toISOString().split('T')[0];
    newState.monthlyHistory = [
      ...(newState.monthlyHistory || []),
      {
        month: new Date().toISOString().split('T')[0],
        leagueIndex: currentLeagueIndex,
        finalRank: userRank,
        xp: userXP,
      },
    ];
  }

  saveLeagueState(newState);
  return {
    newState,
    result,
    newLeague: LEAGUES[newLeagueIndex],
  };
}
