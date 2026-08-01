import React, { useState, useEffect } from 'react';
import { 
  Flame, 
  Zap, 
  Target, 
  Trophy, 
  Compass, 
  Brain, 
  ChevronRight,
  ChevronDown,
  TrendingUp,
  CheckCircle,
  Clock,
  DollarSign,
  TrendingDown,
  ArrowRight,
  CheckSquare,
  Sparkles,
  BookOpen,
  Calendar,
  Layers,
  Activity,
  PlusCircle,
  Plus,
  AlertTriangle,
  Wallet,
  ArrowUpRight,
  ArrowDownRight,
  Check,
  Award,
  Edit2,
  CalendarDays,
  Upload
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Goal, DailyTask, FinanceEntry, Habit, RoutineItem } from '../types';

function compressImageFile(file: File): Promise<string> {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;
        const maxDim = 800;
        if (width > maxDim || height > maxDim) {
          if (width > height) {
            height = Math.round((height * maxDim) / width);
            width = maxDim;
          } else {
            width = Math.round((width * maxDim) / height);
            height = maxDim;
          }
        }
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(img, 0, 0, width, height);
          resolve(canvas.toDataURL('image/jpeg', 0.8));
        } else {
          resolve(e.target?.result as string);
        }
      };
      img.onerror = () => resolve(e.target?.result as string);
      img.src = e.target?.result as string;
    };
    reader.readAsDataURL(file);
  });
}

interface DashboardViewProps {
  userName: string;
  setUserName: (name: string) => void;
  xpTotal: number;
  streak: number;
  level: number;
  activeGoalsCount: number;
  completedGoalsCount: number;
  goals: Goal[];
  dailyTasks: DailyTask[];
  setDailyTasks: React.Dispatch<React.SetStateAction<DailyTask[]>>;
  setActiveTab: (tab: string) => void;
  addXp: (amount: number) => void;
  loadDemoData: () => void;
  finances: FinanceEntry[];
  habits: Habit[];
  setHabits: React.Dispatch<React.SetStateAction<Habit[]>>;
  routine: RoutineItem[];
  customCards?: any[];
  setCustomCards?: React.Dispatch<React.SetStateAction<any[]>>;
}

export default function DashboardView({
  userName,
  setUserName,
  xpTotal,
  streak,
  level,
  activeGoalsCount,
  goals,
  dailyTasks,
  setDailyTasks,
  setActiveTab,
  addXp,
  loadDemoData,
  finances = [],
  habits = [],
  setHabits,
  routine = [],
  customCards: propCustomCards,
  setCustomCards: propSetCustomCards
}: DashboardViewProps) {
  const [seederApplied, setSeederApplied] = useState(false);

  // States for up to 8 customizable cards
  const [localCustomCards, setLocalCustomCards] = useState<any[]>(() => {
    const saved = localStorage.getItem('dashboard_custom_cards');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error(e);
      }
    }
    return [
      {
        id: 'card-1',
        emoji: '☠️',
        title: 'PODER',
        imageUrl: 'https://images.unsplash.com/photo-1509198397868-475647b2a1e5?q=80&w=600&auto=format&fit=crop'
      },
      {
        id: 'card-2',
        emoji: '💪',
        title: 'FORCE',
        imageUrl: 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?q=80&w=600&auto=format&fit=crop'
      },
      {
        id: 'card-3',
        emoji: '⛰️',
        title: 'DISCIPLINE',
        imageUrl: 'https://images.unsplash.com/photo-1517838277536-f5f99be501cd?q=80&w=600&auto=format&fit=crop'
      },
      {
        id: 'card-4',
        emoji: '🧠',
        title: 'STRATEGY',
        imageUrl: 'https://images.unsplash.com/photo-1529699211952-734e80c4d42b?q=80&w=600&auto=format&fit=crop'
      },
      {
        id: 'card-5',
        emoji: '🕊️',
        title: 'PEACE',
        imageUrl: 'https://images.unsplash.com/photo-1506126613408-eca07ce68773?q=80&w=600&auto=format&fit=crop'
      },
      {
        id: 'card-6',
        emoji: '🤑',
        title: 'Prosperidade',
        imageUrl: 'https://images.unsplash.com/photo-1618042164219-62c820f10723?q=80&w=600&auto=format&fit=crop'
      }
    ];
  });

  const customCards = propCustomCards || localCustomCards;
  const setCustomCards = (newVal: any) => {
    if (propSetCustomCards) {
      propSetCustomCards(newVal);
    } else {
      setLocalCustomCards(newVal);
    }
  };

  const [editingCard, setEditingCard] = useState<any | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [editEmoji, setEditEmoji] = useState('');
  const [editImageUrl, setEditImageUrl] = useState('');

  useEffect(() => {
    localStorage.setItem('dashboard_custom_cards', JSON.stringify(customCards));
  }, [customCards]);

  const PRESET_IMAGES = [
    { name: 'Poder (Herói)', url: 'https://images.unsplash.com/photo-1509198397868-475647b2a1e5?q=80&w=600&auto=format&fit=crop' },
    { name: 'Força (Treino)', url: 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?q=80&w=600&auto=format&fit=crop' },
    { name: 'Disciplina (Atividade)', url: 'https://images.unsplash.com/photo-1517838277536-f5f99be501cd?q=80&w=600&auto=format&fit=crop' },
    { name: 'Estratégia (Xadrez)', url: 'https://images.unsplash.com/photo-1529699211952-734e80c4d42b?q=80&w=600&auto=format&fit=crop' },
    { name: 'Paz (Meditação)', url: 'https://images.unsplash.com/photo-1506126613408-eca07ce68773?q=80&w=600&auto=format&fit=crop' },
    { name: 'Prosperidade (Ouro)', url: 'https://images.unsplash.com/photo-1618042164219-62c820f10723?q=80&w=600&auto=format&fit=crop' },
    { name: 'Tecnologia (Código)', url: 'https://images.unsplash.com/photo-1555066931-4365d14bab8c?q=80&w=600&auto=format&fit=crop' },
    { name: 'Mentalidade (Estátua)', url: 'https://images.unsplash.com/photo-1549887534-1541e9326642?q=80&w=600&auto=format&fit=crop' },
    { name: 'Universo (Estrelas)', url: 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?q=80&w=600&auto=format&fit=crop' }
  ];

  const startEditing = (card: any) => {
    setEditingCard(card);
    setEditTitle(card.title);
    setEditEmoji(card.emoji);
    setEditImageUrl(card.imageUrl);
  };

  const saveEditedCard = () => {
    if (!editingCard) return;
    setCustomCards(prev => prev.map(c => {
      if (c.id === editingCard.id) {
        return {
          ...c,
          title: editTitle.trim() || 'Sem Título',
          emoji: editEmoji.trim() || '✨',
          imageUrl: editImageUrl.trim() || 'https://images.unsplash.com/photo-1509198397868-475647b2a1e5?q=80&w=600&auto=format&fit=crop'
        };
      }
      return c;
    }));
    setEditingCard(null);
  };

  const deleteCard = (cardId: string) => {
    setCustomCards(prev => prev.filter(c => c.id !== cardId));
    setEditingCard(null);
  };

  // Dropdown / Collapsible sections states
  const [isChecklistOpen, setIsChecklistOpen] = useState(() => {
    const saved = localStorage.getItem('dashboard_checklist_open');
    return saved !== null ? saved === 'true' : true;
  });
  const [isHabitsOpen, setIsHabitsOpen] = useState(() => {
    const saved = localStorage.getItem('dashboard_habits_open');
    return saved !== null ? saved === 'true' : true;
  });
  const [isGoalsOpen, setIsGoalsOpen] = useState(() => {
    const saved = localStorage.getItem('dashboard_goals_open');
    return saved !== null ? saved === 'true' : true;
  });
  const [isFinancesOpen, setIsFinancesOpen] = useState(() => {
    const saved = localStorage.getItem('dashboard_finances_open');
    return saved !== null ? saved === 'true' : true;
  });

  useEffect(() => {
    localStorage.setItem('dashboard_checklist_open', String(isChecklistOpen));
  }, [isChecklistOpen]);

  useEffect(() => {
    localStorage.setItem('dashboard_habits_open', String(isHabitsOpen));
  }, [isHabitsOpen]);

  useEffect(() => {
    localStorage.setItem('dashboard_goals_open', String(isGoalsOpen));
  }, [isGoalsOpen]);

  useEffect(() => {
    localStorage.setItem('dashboard_finances_open', String(isFinancesOpen));
  }, [isFinancesOpen]);

  const addNewCard = () => {
    if (customCards.length >= 8) return;
    const newId = `card-${Date.now()}`;
    const newCard = {
      id: newId,
      emoji: '⭐',
      title: 'NOVA PÁGINA',
      imageUrl: 'https://images.unsplash.com/photo-1509198397868-475647b2a1e5?q=80&w=600&auto=format&fit=crop'
    };
    setCustomCards(prev => [...prev, newCard]);
    // Immediately open edit modal for the new card
    setEditingCard(newCard);
    setEditTitle(newCard.title);
    setEditEmoji(newCard.emoji);
    setEditImageUrl(newCard.imageUrl);
  };

  // Helper to get today's formatted key YYYY-MM-DD
  const getTodayDateKey = (): string => {
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };
  const todayKey = getTodayDateKey();

  // Toggle checklist tasks from Dashboard
  const handleToggleDashboardTask = (id: string) => {
    setDailyTasks(prevTasks => {
      const task = prevTasks.find(t => t.id === id);
      if (!task) return prevTasks;

      const updatedCompleted = !task.completed;
      
      if (updatedCompleted) {
        addXp(task.xpReward);
      } else {
        addXp(-task.xpReward);
      }

      const newTasks = prevTasks.map(t => {
        if (t.id === id) {
          const updatedSubtasks = t.subtasks?.map(sub => ({ ...sub, completed: updatedCompleted })) || [];
          return { ...t, completed: updatedCompleted, subtasks: updatedSubtasks };
        }
        return t;
      });

      const allDoneBefore = prevTasks.length > 0 && prevTasks.every(t => t.id === id ? updatedCompleted : t.completed);
      const allDoneNow = newTasks.length > 0 && newTasks.every(t => t.completed);

      if (allDoneNow && !allDoneBefore) {
        addXp(25);
      } else if (!allDoneNow && allDoneBefore) {
        addXp(-25);
      }

      return newTasks;
    });
  };

  // Toggle habits from Dashboard
  const handleToggleDashboardHabit = (habitId: string) => {
    if (!setHabits) return;
    setHabits(prevHabits => {
      return prevHabits.map(habit => {
        if (habit.id === habitId) {
          const currentHistory = { ...habit.history };
          const isCurrentlyChecked = !!currentHistory[todayKey];
          
          if (isCurrentlyChecked) {
            delete currentHistory[todayKey];
            if (habit.type === 'good') {
              addXp(-10);
            } else {
              addXp(-15);
            }
          } else {
            currentHistory[todayKey] = true;
            if (habit.type === 'good') {
              addXp(10);
            } else {
              addXp(15);
            }
          }
          
          return {
            ...habit,
            history: currentHistory
          };
        }
        return habit;
      });
    });
  };

  // Calculate Average progress of goals
  const averageGoalProgress = goals.length > 0 
    ? Math.round((goals.reduce((acc, g) => acc + (g.actionsDone / g.actionsTotal), 0) / goals.length) * 100) 
    : 0;

  // Calculate Checklist completion rate for today
  const completedChecklistCount = dailyTasks.filter(t => t.completed).length;
  const checklistPercent = dailyTasks.length > 0 
    ? Math.round((completedChecklistCount / dailyTasks.length) * 100) 
    : 0;

  // Calculate Habits completed today
  const habitsTodayCount = habits.filter(h => !!h.history[todayKey]).length;
  const habitsPercent = habits.length > 0
    ? Math.round((habitsTodayCount / habits.length) * 100)
    : 0;

  // Calculate Habits weekly efficiency
  const getPast7DaysKeys = () => {
    const keys = [];
    for (let i = 0; i < 7; i++) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const year = d.getFullYear();
      const month = String(d.getMonth() + 1).padStart(2, '0');
      const day = String(d.getDate()).padStart(2, '0');
      keys.push(`${year}-${month}-${day}`);
    }
    return keys;
  };
  const past7Days = getPast7DaysKeys();
  let totalHabitSlots = habits.length * 7;
  let completedHabitSlots = 0;
  habits.forEach(h => {
    past7Days.forEach(dateKey => {
      if (h.history[dateKey]) completedHabitSlots++;
    });
  });
  const habitsWeeklyPercent = totalHabitSlots > 0 ? Math.round((completedHabitSlots / totalHabitSlots) * 100) : 0;

  // Financial Calculations
  const totalIncome = finances.filter(f => f.type === 'income').reduce((sum, f) => sum + f.amount, 0);
  const totalExpense = finances.filter(f => f.type === 'expense').reduce((sum, f) => sum + f.amount, 0);
  const totalInvestment = finances.filter(f => f.type === 'investment').reduce((sum, f) => sum + f.amount, 0);
  const availableBalance = totalIncome - totalExpense;
  const netSavingsRate = totalIncome > 0 ? Math.max(0, Math.min(100, Math.round(((totalIncome - totalExpense - totalInvestment) / totalIncome) * 100))) : 0;

  // Routine for today
  const todayDayIdx = new Date().getDay(); // 0 = Sunday, 1 = Monday, etc.
  const todayRoutines = routine.filter(r => r.dayOfWeek === todayDayIdx || r.dayOfWeek === -1 || r.isEveryDay);
  const completedTodayRoutines = todayRoutines.filter(r => r.completedDays?.includes(todayDayIdx) || r.completed).length;
  const routinePercent = todayRoutines.length > 0 ? Math.round((completedTodayRoutines / todayRoutines.length) * 100) : 0;

  // Level progress
  const xpInCurrentLevel = xpTotal % 1000;
  const progressPercent = (xpInCurrentLevel / 1000) * 100;

  // Os 6 Pilares do Planner (REAL DATA LINKED)
  const pilares = [
    {
      id: 'checklist',
      title: 'Checklist Diário',
      subtitle: `${completedChecklistCount} de ${dailyTasks.length} rituais diários`,
      progress: checklistPercent,
      icon: CheckSquare,
      color: 'from-orange-500 to-amber-500'
    },
    {
      id: 'habitos',
      title: 'Hábitos (Bons & Ruins)',
      subtitle: `${habitsTodayCount} de ${habits.length} consolidados hoje`,
      progress: habitsPercent,
      icon: Zap,
      color: 'from-amber-500 to-yellow-500'
    },
    {
      id: 'rotina',
      title: 'Rotina Semanal',
      subtitle: `${completedTodayRoutines} de ${todayRoutines.length} afazeres de hoje`,
      progress: routinePercent,
      icon: Clock,
      color: 'from-orange-600 to-red-500'
    },
    {
      id: 'metas',
      title: 'Metas & Evolução',
      subtitle: `${activeGoalsCount} metas em progresso ativo`,
      progress: averageGoalProgress,
      icon: Target,
      color: 'from-orange-500 to-rose-500'
    },
    {
      id: 'financas',
      title: 'Controle de Caixa',
      subtitle: `Taxa de economia: ${netSavingsRate}%`,
      progress: netSavingsRate,
      icon: DollarSign,
      color: 'from-amber-500 to-orange-600'
    },
    {
      id: 'calendario',
      title: 'Agenda & Diário',
      subtitle: 'Registro de compromissos e fé',
      progress: Math.min(100, (goals.filter(g => g.completed).length * 15) + 40),
      icon: Calendar,
      color: 'from-orange-500 to-red-600'
    }
  ];

  // Current Date Formatter
  const formattedDate = new Date().toLocaleDateString('pt-BR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long'
  });

  // Time Calculations for Progress Bars
  const now = new Date();
  const currentHour = now.getHours();
  const currentMinute = now.getMinutes();
  const currentSecond = now.getSeconds();
  
  // 1. Day Remaining (How many hours are left in the day)
  const hoursElapsed = currentHour + currentMinute / 60 + currentSecond / 3600;
  const hoursRemaining = 24 - hoursElapsed;
  const dayPercentRemaining = Math.max(0, Math.min(100, Math.round((hoursRemaining / 24) * 100)));
  const dayPercentElapsed = 100 - dayPercentRemaining;

  // 2. Week Completed (Sunday is first day - 0 to 6)
  const dayOfWeek = now.getDay();
  const weekDaysElapsed = dayOfWeek + hoursElapsed / 24;
  const weekPercentCompleted = Math.max(0, Math.min(100, Math.round((weekDaysElapsed / 7) * 100)));

  // 3. Month Passed
  const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
  const monthDaysElapsed = now.getDate() - 1 + hoursElapsed / 24;
  const monthPercentPassed = Math.max(0, Math.min(100, Math.round((monthDaysElapsed / daysInMonth) * 100)));

  // 4. Year Passed
  const isLeapYear = (y: number) => (y % 4 === 0 && y % 100 !== 0) || y % 400 === 0;
  const totalDaysInYear = isLeapYear(now.getFullYear()) ? 366 : 365;
  const startOfYear = new Date(now.getFullYear(), 0, 1);
  const diffTime = Math.max(0, now.getTime() - startOfYear.getTime());
  const daysElapsedInYear = diffTime / (1000 * 60 * 60 * 24);
  const yearPercentPassed = Math.max(0, Math.min(100, Math.round((daysElapsedInYear / totalDaysInYear) * 100)));

  // Miniature Calendar calculations
  const currentMonthDate = new Date(now.getFullYear(), now.getMonth(), 1);
  const firstDayIndex = currentMonthDate.getDay(); // 0 = Sunday, 1 = Monday, etc.
  const daysInCurrentMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();

  return (
    <div id="dashboard-view" className="space-y-8 pb-12 max-w-7xl mx-auto px-4 text-left">
      
      {/* Top Header Row */}
      <div id="dashboard-header" className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-zinc-800/40 pb-6">
        <div>
          <div className="flex items-center gap-3">
            <h1 id="greeting" className="text-3xl font-extrabold text-white tracking-tight flex items-center gap-2">
              Fala, <span className="text-orange-500 font-display">{userName}</span>
            </h1>
          </div>
          <p id="current-date" className="text-gray-400 text-sm mt-1 capitalize font-medium flex items-center gap-1.5">
            <CalendarDays className="h-4 w-4 text-orange-500" />
            {formattedDate}
          </p>
        </div>

        {/* Level Indicator Pill */}
        <div id="level-pill" className="flex items-center gap-3 bg-zinc-950/80 border border-zinc-800/80 px-4 py-2.5 rounded-2xl shadow-[0_4px_12px_rgba(0,0,0,0.5)]">
          <Trophy className="h-4.5 w-4.5 text-orange-500 fill-orange-500/10 animate-bounce" />
          <div className="text-left">
            <span className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest block">Classificação</span>
            <span className="text-xs font-black text-white font-mono">Nível {level}</span>
          </div>
        </div>
      </div>



      {/* Grid of Key Gamified Metrics */}
      <div id="dashboard-metrics-grid" className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* Streak Card */}
        <motion.div 
          id="metric-streak-card"
          className="bg-[#0a0a0c]/60 p-5 rounded-2xl border border-zinc-850 hover:border-orange-500/20 transition-all flex flex-col justify-between"
          whileHover={{ y: -2 }}
        >
          <div className="flex items-center justify-between">
            <span className="text-[10px] text-gray-400 font-extrabold tracking-widest uppercase">Frequência</span>
            <Flame className="h-5 w-5 text-orange-500 fill-orange-500/20 animate-pulse" />
          </div>
          <div className="mt-4">
            <span className="text-4xl font-black text-white font-mono">{streak}</span>
            <span className="text-xs text-gray-500 ml-2 font-bold">DIAS SEGUIDOS</span>
          </div>
          <p className="text-[10px] text-gray-500 mt-2 border-t border-zinc-900 pt-2 font-medium">
            Seu maior recorde ativo no planner.
          </p>
        </motion.div>

        {/* XP Total Card */}
        <motion.div 
          id="metric-xp-card"
          className="bg-[#0a0a0c]/60 p-5 rounded-2xl border border-zinc-850 hover:border-orange-500/20 transition-all flex flex-col justify-between"
          whileHover={{ y: -2 }}
        >
          <div className="flex items-center justify-between">
            <span className="text-[10px] text-gray-400 font-extrabold tracking-widest uppercase">XP Acumulado</span>
            <Zap className="h-5 w-5 text-amber-500 fill-amber-500/20" />
          </div>
          <div className="mt-4">
            <span className="text-4xl font-black text-white font-mono">{xpTotal}</span>
            <span className="text-xs text-gray-500 ml-2 font-bold">XP TOTAL</span>
          </div>
          <div className="mt-2 border-t border-zinc-900 pt-2">
            <div className="w-full bg-[#18181b] h-1.5 rounded-full overflow-hidden">
              <div className="bg-orange-500 h-full rounded-full" style={{ width: `${progressPercent}%` }} />
            </div>
            <p className="text-[9px] text-gray-500 mt-1 text-right font-mono font-bold">
              Faltam {1000 - xpInCurrentLevel} XP para o Nível {level + 1}
            </p>
          </div>
        </motion.div>

        {/* Checklist Completeness Card */}
        <motion.div 
          id="metric-goals-card"
          className="bg-[#0a0a0c]/60 p-5 rounded-2xl border border-zinc-850 hover:border-orange-500/20 transition-all flex flex-col justify-between"
          whileHover={{ y: -2 }}
        >
          <div className="flex items-center justify-between">
            <span className="text-[10px] text-gray-400 font-extrabold tracking-widest uppercase">Checklist de Hoje</span>
            <CheckSquare className="h-5 w-5 text-emerald-400" />
          </div>
          <div className="mt-4">
            <span className="text-4xl font-black text-white font-mono">{completedChecklistCount}</span>
            <span className="text-xs text-gray-500 ml-2 font-bold">DE {dailyTasks.length} RITUAIS</span>
          </div>
          <div className="mt-2 border-t border-zinc-900 pt-2">
            <div className="w-full bg-[#18181b] h-1.5 rounded-full overflow-hidden">
              <div className="bg-emerald-500 h-full rounded-full" style={{ width: `${checklistPercent}%` }} />
            </div>
            <p className="text-[9px] text-emerald-400 mt-1 text-right font-bold">
              {checklistPercent}% concluído hoje
            </p>
          </div>
        </motion.div>

        {/* Saldo Financeiro Card */}
        <motion.div 
          id="metric-badges-card"
          className="bg-[#0a0a0c]/60 p-5 rounded-2xl border border-zinc-850 hover:border-orange-500/20 transition-all flex flex-col justify-between"
          whileHover={{ y: -2 }}
        >
          <div className="flex items-center justify-between">
            <span className="text-[10px] text-gray-400 font-extrabold tracking-widest uppercase">Saldo de Caixa</span>
            <Wallet className="h-5 w-5 text-cyan-400" />
          </div>
          <div className="mt-4">
            <span className="text-2xl font-black text-white font-mono">
              R$ {availableBalance.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </span>
          </div>
          <p className="text-[10px] text-gray-500 mt-2 border-t border-zinc-900 pt-2 font-medium flex items-center justify-between">
            <span>Último mês:</span>
            <span className={availableBalance >= 0 ? 'text-emerald-400 font-bold' : 'text-rose-400 font-bold'}>
              {availableBalance >= 0 ? '+' : ''} R$ {availableBalance.toLocaleString('pt-BR')}
            </span>
          </p>
        </motion.div>
      </div>

      {/* 8 GALERIA DE CARDS PERSONALIZÁVEIS */}
      <div id="custom-gallery-cards-section" className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-sm font-bold text-white tracking-wider flex items-center gap-2 uppercase">
              <Sparkles className="h-4 w-4 text-orange-500" /> Foco & Mentalidade
            </h2>
            <p className="text-[10px] text-zinc-500 mt-0.5">Clique em qualquer imagem para abrir ou personalizar seu card mental (máx. 8 cards).</p>
          </div>
          {customCards.length < 8 && (
            <button
              onClick={addNewCard}
              className="px-3 py-1.5 bg-orange-500/10 border border-orange-500/20 text-orange-400 hover:bg-orange-500 hover:text-black rounded-xl text-[10px] font-extrabold transition-all flex items-center gap-1"
            >
              <Plus className="h-3 w-3" /> Novo Card
            </button>
          )}
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {customCards.map((card) => (
            <motion.div
              key={card.id}
              onClick={() => startEditing(card)}
              className="relative rounded-2xl overflow-hidden group border border-zinc-850/80 bg-zinc-950/60 aspect-video md:h-40 transition-all hover:border-orange-500/40 cursor-pointer"
              whileHover={{ scale: 1.02 }}
            >
              {/* Background image */}
              <img
                src={card.imageUrl}
                alt={card.title}
                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                referrerPolicy="no-referrer"
              />
              {/* Overlay with dark gradient */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/95 via-black/40 to-black/10 flex flex-col justify-between p-4" />

              {/* Edit indicator (pencil on hover) */}
              <div className="absolute top-3 right-3 p-1.5 rounded-lg bg-black/60 border border-zinc-850 text-zinc-400 opacity-0 group-hover:opacity-100 transition-opacity">
                <Edit2 className="h-3 w-3" />
              </div>

              {/* Title & Emoji at the bottom */}
              <div className="absolute bottom-3 left-3 right-3">
                <span className="text-xs font-black text-white tracking-wider uppercase drop-shadow flex items-center gap-1.5 font-display">
                  <span className="text-sm">{card.emoji}</span>
                  <span>{card.title}</span>
                </span>
              </div>
            </motion.div>
          ))}

          {/* Add card placeholder card */}
          {customCards.length < 8 && (
            <motion.div
              onClick={addNewCard}
              className="rounded-2xl border border-dashed border-zinc-800 hover:border-orange-500/50 bg-zinc-950/25 flex flex-col items-center justify-center p-4 h-40 cursor-pointer text-zinc-500 hover:text-orange-400 transition-all group"
              whileHover={{ scale: 1.02 }}
            >
              <Plus className="h-6 w-6 mb-1.5 group-hover:scale-110 duration-200" />
              <span className="text-[10px] font-bold font-mono tracking-wide uppercase">Nova página</span>
            </motion.div>
          )}
        </div>
      </div>

      {/* 3 COLUMNS: METRIC PROGRESS, LIFE SHORTCUTS, MINI CALENDAR */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* COL 1: Time remaining & passed miniatures (Left) */}
        <div className="bg-[#0a0a0c]/60 border border-zinc-850 rounded-3xl p-6 relative overflow-hidden flex flex-col justify-between min-h-[360px]">
          <div className="space-y-4">
            <div>
              <span className="text-[10px] text-orange-500 font-extrabold tracking-widest uppercase block">Tempo & Ciclos</span>
              <h3 className="text-sm font-black text-white tracking-tight mt-0.5 uppercase">Progresso Temporal</h3>
            </div>
            
            <p className="text-[11px] text-zinc-500 leading-relaxed">
              Monitore o escoamento natural do tempo para manter o senso de urgência e clareza de metas.
            </p>

            <div className="space-y-4 pt-1">
              {/* Day Remaining */}
              <div className="space-y-1">
                <div className="flex justify-between items-center text-[11px]">
                  <span className="text-zinc-400 font-bold">Dia (Resta {hoursRemaining.toFixed(1)}h)</span>
                  <span className="text-orange-500 font-mono font-bold">{dayPercentRemaining}% restante</span>
                </div>
                <div className="w-full bg-[#141417] h-2 rounded-full overflow-hidden border border-zinc-900">
                  <div 
                    className="bg-orange-500 h-full rounded-full transition-all duration-500"
                    style={{ width: `${dayPercentElapsed}%` }}
                  />
                </div>
              </div>

              {/* Week Heatmap (Replacing Week and Year Progress Bars) */}
              <div className="space-y-1.5">
                <div className="flex justify-between items-center text-[11px]">
                  <span className="text-zinc-400 font-bold">Semana (Dom a Sáb)</span>
                  <span className="text-cyan-400 font-mono font-bold">{weekPercentCompleted}% decorrido</span>
                </div>
                <div className="flex gap-1 justify-between bg-zinc-950/40 p-2 rounded-xl border border-zinc-900">
                  {['D', 'S', 'T', 'Q', 'Q', 'S', 'S'].map((dayLabel, i) => {
                    const isToday = i === dayOfWeek;
                    const isPast = i < dayOfWeek;
                    
                    let bgClass = 'bg-zinc-950 border border-zinc-900/60 text-zinc-500';
                    let titleText = `${dayLabel} (Futuro)`;
                    if (isPast) {
                      bgClass = 'bg-cyan-500/20 border border-cyan-500/10 hover:bg-cyan-500/35 text-cyan-400';
                      titleText = `${dayLabel} (Passado)`;
                    } else if (isToday) {
                      bgClass = 'bg-cyan-500 border border-cyan-400 text-black font-extrabold shadow-[0_0_8px_rgba(6,182,212,0.4)]';
                      titleText = `${dayLabel} (Hoje)`;
                    }
                    
                    return (
                      <div 
                        key={i} 
                        className={`flex-1 text-center py-1.5 rounded-[4px] text-[10px] font-mono transition-all cursor-help ${bgClass}`}
                        title={titleText}
                      >
                        {dayLabel}
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Month Passed */}
              <div className="space-y-1">
                <div className="flex justify-between items-center text-[11px]">
                  <span className="text-zinc-400 font-bold">Mês Corrente</span>
                  <span className="text-amber-500 font-mono font-bold">{monthPercentPassed}% decorrido</span>
                </div>
                <div className="w-full bg-[#141417] h-2 rounded-full overflow-hidden border border-zinc-900">
                  <div 
                    className="bg-amber-500 h-full rounded-full transition-all duration-500"
                    style={{ width: `${monthPercentPassed}%` }}
                  />
                </div>
              </div>

              {/* Year Passed with monthly Heatmap */}
              <div className="space-y-1.5 pt-1.5 border-t border-zinc-900/60">
                <div className="flex justify-between items-center text-[11px]">
                  <span className="text-zinc-400 font-bold">Ano de {now.getFullYear()}</span>
                  <span className="text-emerald-500 font-mono font-bold">{yearPercentPassed}% decorrido</span>
                </div>
                
                <div className="grid grid-cols-6 gap-1 bg-zinc-950/40 p-2 rounded-xl border border-zinc-900">
                  {['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'].map((monthLabel, i) => {
                    const currentMonthIdx = now.getMonth();
                    const isCurrent = i === currentMonthIdx;
                    const isPast = i < currentMonthIdx;
                    
                    let bgClass = 'bg-zinc-950 border border-zinc-900/60 text-zinc-500';
                    let titleText = `${monthLabel} (Futuro)`;
                    
                    if (isPast) {
                      bgClass = 'bg-emerald-500/20 border border-emerald-500/10 hover:bg-emerald-500/35 text-emerald-400';
                      titleText = `${monthLabel} (Passado)`;
                    } else if (isCurrent) {
                      bgClass = 'bg-emerald-500 border border-emerald-400 text-black font-extrabold shadow-[0_0_8px_rgba(16,185,129,0.4)]';
                      titleText = `${monthLabel} (Atual)`;
                    }
                    
                    return (
                      <div 
                        key={i} 
                        className={`text-center py-1 rounded-[4px] text-[9px] font-mono transition-all cursor-help ${bgClass}`}
                        title={titleText}
                      >
                        {monthLabel}
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
          
          <div className="border-t border-zinc-900 mt-4 pt-3 text-[9px] text-zinc-500 font-bold font-mono uppercase tracking-widest text-center">
            Memento Mori • Viva o Agora
          </div>
        </div>

        {/* COL 2: Life Shortcuts Card (Middle) */}
        <div className="bg-[#0a0a0c]/60 border border-zinc-850 rounded-3xl p-6 relative overflow-hidden flex flex-col justify-between min-h-[360px]">
          <div>
            <div className="mb-4">
              <span className="text-[10px] text-orange-500 font-extrabold tracking-widest uppercase block">Atalhos de Foco</span>
              <h3 className="text-sm font-black text-white tracking-tight mt-0.5 uppercase">Eixos de Vida & Rotina</h3>
            </div>
            
            <p className="text-[11px] text-zinc-500 mb-4 leading-relaxed">
              Atalhos de alto nível para centralizar rituais de desenvolvimento, evolução espiritual e fé.
            </p>

            <div className="space-y-2.5">
              {/* Shortcut: Espaço Diário e Fé */}
              <button
                onClick={() => {
                  localStorage.setItem('calendar_selected_date_str', todayKey);
                  setActiveTab('calendario');
                }}
                className="w-full p-2.5 rounded-xl bg-zinc-950 border border-zinc-900 hover:border-orange-500/40 text-left transition-all flex items-center gap-3 group"
              >
                <div className="p-2 bg-orange-500/10 text-orange-500 rounded-lg group-hover:bg-orange-500 group-hover:text-black transition-all">
                  <Sparkles className="h-4 w-4" />
                </div>
                <div>
                  <h4 className="text-[11px] font-extrabold text-white group-hover:text-orange-400 transition-colors">Espaço Diário & Fé</h4>
                  <p className="text-[9px] text-zinc-500 font-medium mt-0.5">Acesso direto ao devocional, orações e metas do dia.</p>
                </div>
              </button>

              {/* Shortcut: Metas */}
              <button
                onClick={() => setActiveTab('metas')}
                className="w-full p-2.5 rounded-xl bg-zinc-950 border border-zinc-900 hover:border-orange-500/40 text-left transition-all flex items-center gap-3 group"
              >
                <div className="p-2 bg-amber-500/10 text-amber-500 rounded-lg group-hover:bg-amber-500 group-hover:text-black transition-all">
                  <Target className="h-4 w-4" />
                </div>
                <div>
                  <h4 className="text-[11px] font-extrabold text-white group-hover:text-amber-400 transition-colors">Metas Ativas</h4>
                  <p className="text-[9px] text-zinc-500 font-medium mt-0.5">Acompanhamento de objetivos de curto, médio e longo prazo.</p>
                </div>
              </button>

              {/* Shortcut: Vida em Resumo */}
              <button
                onClick={() => setActiveTab('resumo')}
                className="w-full p-2.5 rounded-xl bg-zinc-950 border border-zinc-900 hover:border-orange-500/40 text-left transition-all flex items-center gap-3 group"
              >
                <div className="p-2 bg-cyan-500/10 text-cyan-400 rounded-lg group-hover:bg-cyan-500 group-hover:text-black transition-all">
                  <Compass className="h-4 w-4" />
                </div>
                <div>
                  <h4 className="text-[11px] font-extrabold text-white group-hover:text-cyan-400 transition-colors">Vida em Resumo</h4>
                  <p className="text-[9px] text-zinc-500 font-medium mt-0.5">Valores, visão ampla e os 6 pilares de sustentação.</p>
                </div>
              </button>
            </div>
          </div>

          <div className="border-t border-zinc-900 mt-4 pt-3 text-[9px] text-zinc-500 font-bold font-mono uppercase tracking-widest text-center">
            Consistência supera Intensidade
          </div>
        </div>

        {/* COL 3: Mini calendar (Right) */}
        <div className="bg-[#0a0a0c]/60 border border-zinc-850 rounded-3xl p-6 relative overflow-hidden flex flex-col justify-between min-h-[360px]">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-[10px] text-orange-500 font-extrabold tracking-widest uppercase block">Mini Calendário</span>
                <h3 className="text-sm font-black text-white tracking-tight mt-0.5 uppercase font-display">
                  {now.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })}
                </h3>
              </div>
              <Calendar className="h-4.5 w-4.5 text-orange-500" />
            </div>

            {/* Calendar grid */}
            <div className="bg-zinc-950/80 p-3 rounded-2xl border border-zinc-900/60">
              {/* Days of week header */}
              <div className="grid grid-cols-7 gap-1 text-center text-[9px] font-black text-zinc-500 uppercase tracking-wider mb-2 border-b border-zinc-900 pb-1.5">
                <span>D</span>
                <span>S</span>
                <span>T</span>
                <span>Q</span>
                <span>Q</span>
                <span>S</span>
                <span>S</span>
              </div>

              {/* Grid of days */}
              <div className="grid grid-cols-7 gap-1 text-center text-[10px] font-mono font-bold">
                {/* Empty spacers */}
                {Array.from({ length: firstDayIndex }).map((_, i) => (
                  <span key={`empty-${i}`} className="p-1 block text-zinc-800"></span>
                ))}
                
                {/* Active days in month */}
                {Array.from({ length: daysInCurrentMonth }).map((_, i) => {
                  const dayNum = i + 1;
                  const dateStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(dayNum).padStart(2, '0')}`;
                  const isToday = dayNum === now.getDate();
                  
                  return (
                    <button
                      key={`day-${dayNum}`}
                      onClick={() => {
                        localStorage.setItem('calendar_selected_date_str', dateStr);
                        setActiveTab('calendario');
                      }}
                      className={`p-1 rounded-md transition-all hover:bg-orange-500 hover:text-black ${
                        isToday
                          ? 'bg-orange-500 text-black shadow-[0_0_8px_rgba(249,115,22,0.4)] font-black'
                          : 'text-zinc-300 hover:scale-105'
                      }`}
                      title={`Ir para o dia ${dayNum}`}
                    >
                      {dayNum}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          <div className="border-t border-zinc-900 mt-4 pt-3 text-[9px] text-zinc-500 font-bold text-center">
            Clique na data para abrir o Diário
          </div>
        </div>

      </div>

      {/* MODAL DE EDIÇÃO DE CARD */}
      <AnimatePresence>
        {editingCard && (
          <div 
            onClick={() => setEditingCard(null)}
            className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md cursor-pointer"
          >
            <motion.div
              onClick={(e) => e.stopPropagation()}
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="cursor-default bg-zinc-950 border border-zinc-850 rounded-3xl p-6 w-full max-w-md my-auto shadow-[0_20px_50px_rgba(0,0,0,0.8)] text-left space-y-5"
            >
              <div className="flex justify-between items-center border-b border-zinc-900 pb-3">
                <h3 className="text-xs font-black text-white flex items-center gap-2 uppercase tracking-wider">
                  <Sparkles className="h-4 w-4 text-orange-500" /> Personalizar Card
                </h3>
                <button
                  onClick={() => setEditingCard(null)}
                  className="text-zinc-500 hover:text-white transition-colors font-bold text-xs uppercase"
                >
                  Fechar
                </button>
              </div>

              <div className="space-y-4">
                <div className="grid grid-cols-4 gap-3">
                  <div className="col-span-1 space-y-1">
                    <label className="text-[9px] text-zinc-500 font-extrabold uppercase tracking-wider block">Emoji</label>
                    <input
                      type="text"
                      value={editEmoji}
                      onChange={(e) => setEditEmoji(e.target.value)}
                      className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-2 py-2 text-white font-bold text-center focus:outline-none focus:border-orange-500"
                      maxLength={4}
                    />
                  </div>
                  <div className="col-span-3 space-y-1">
                    <label className="text-[9px] text-zinc-500 font-extrabold uppercase tracking-wider block">Título / Texto</label>
                    <input
                      type="text"
                      value={editTitle}
                      onChange={(e) => setEditTitle(e.target.value)}
                      className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-3 py-2 text-xs text-white font-bold focus:outline-none focus:border-orange-500"
                      placeholder="Ex: PODER"
                      maxLength={20}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="space-y-1">
                    <label className="text-[9px] text-zinc-500 font-extrabold uppercase tracking-wider block">URL da Imagem</label>
                    <input
                      type="text"
                      value={editImageUrl}
                      onChange={(e) => setEditImageUrl(e.target.value)}
                      onPaste={(e) => {
                        const items = e.clipboardData?.items;
                        if (items) {
                          for (let i = 0; i < items.length; i++) {
                            if (items[i].type.indexOf('image') !== -1) {
                              e.preventDefault();
                              const file = items[i].getAsFile();
                              if (file) {
                                compressImageFile(file).then(res => setEditImageUrl(res));
                              }
                            }
                          }
                        }
                      }}
                      className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-3 py-2 text-[10px] text-white font-mono focus:outline-none focus:border-orange-500/50"
                      placeholder="Cole a URL da imagem (ou Cole a imagem diretamente...)"
                    />
                  </div>

                  {/* New Premium Image File Upload Dropzone & Clipboard Paste Area */}
                  <div className="space-y-1.5">
                    <span className="text-[9px] text-zinc-500 font-extrabold uppercase tracking-wider block">Ou Enviar Arquivo Local</span>
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      id="dashboard-card-upload-file"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          compressImageFile(file).then(res => setEditImageUrl(res));
                        }
                      }}
                    />
                    <div
                      onDragOver={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                      }}
                      onDrop={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        const file = e.dataTransfer.files?.[0];
                        if (file && file.type.startsWith('image/')) {
                          compressImageFile(file).then(res => setEditImageUrl(res));
                        }
                      }}
                      onPaste={(e) => {
                        const items = e.clipboardData?.items;
                        if (items) {
                          for (let i = 0; i < items.length; i++) {
                            if (items[i].type.indexOf('image') !== -1) {
                              e.preventDefault();
                              const file = items[i].getAsFile();
                              if (file) {
                                compressImageFile(file).then(res => setEditImageUrl(res));
                              }
                            }
                          }
                        }
                      }}
                      onClick={() => document.getElementById('dashboard-card-upload-file')?.click()}
                      tabIndex={0}
                      className="group border border-dashed border-zinc-800 hover:border-orange-500/40 focus:border-orange-500/60 bg-zinc-950/40 hover:bg-zinc-950/80 rounded-2xl p-4 text-center cursor-pointer transition-all duration-200 outline-none select-none"
                    >
                      <Upload className="h-5 w-5 text-zinc-500 group-hover:text-orange-400 group-hover:scale-110 transition-all duration-300 mx-auto mb-1.5" />
                      <p className="text-[10px] font-black text-zinc-300 group-hover:text-orange-400/90 transition-colors uppercase tracking-wider">Escolher Imagem do Computador</p>
                      <p className="text-[9px] text-zinc-500 mt-1">Arraste, selecione ou simplesmente <span className="text-orange-500 font-bold">Cole (Ctrl + V)</span> aqui</p>
                    </div>
                  </div>
                </div>

                {/* Preset choices gallery */}
                <div className="space-y-1.5">
                  <span className="text-[9px] text-zinc-500 font-extrabold uppercase tracking-wider block">Imagens Recomendadas</span>
                  <div className="grid grid-cols-3 gap-2 max-h-[120px] overflow-y-auto pr-1 scrollbar-thin">
                    {PRESET_IMAGES.map((preset) => (
                      <button
                        key={preset.name}
                        onClick={() => setEditImageUrl(preset.url)}
                        className={`p-1.5 rounded-xl border text-[9px] font-bold text-left truncate transition-all flex items-center gap-1.5 bg-zinc-900/50 ${
                          editImageUrl === preset.url
                            ? 'border-orange-500 text-orange-400 bg-orange-500/5'
                            : 'border-zinc-850 hover:border-zinc-700 text-zinc-300'
                        }`}
                      >
                        <div className="w-4 h-4 rounded overflow-hidden flex-shrink-0">
                          <img src={preset.url} className="w-full h-full object-cover" />
                        </div>
                        <span className="truncate">{preset.name}</span>
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between pt-4 border-t border-zinc-900">
                <button
                  onClick={() => deleteCard(editingCard.id)}
                  className="px-3 py-1.5 bg-rose-500/10 border border-rose-500/20 text-rose-400 hover:bg-rose-500 hover:text-white rounded-xl text-[10px] font-bold transition-all uppercase"
                >
                  Excluir
                </button>
                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => setEditingCard(null)}
                    className="px-3 py-1.5 bg-zinc-900 hover:bg-zinc-850 text-zinc-400 rounded-xl text-[10px] font-bold transition-all uppercase"
                  >
                    Cancelar
                  </button>
                  <button
                    onClick={saveEditedCard}
                    className="px-4 py-1.5 bg-orange-500 hover:bg-orange-600 text-white rounded-xl text-[10px] font-bold transition-all uppercase"
                  >
                    Salvar
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* CORE INTEGRATION DASHBOARD ACTION BLOCKS */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Column: Today's Interactive Checklist */}
        <div className="lg:col-span-6 bg-[#0a0a0c]/60 border border-zinc-850 rounded-3xl p-6 relative overflow-hidden flex flex-col h-fit self-start">
          <div>
            <div className={`flex justify-between items-center select-none ${isChecklistOpen ? 'mb-4' : 'mb-0'}`}>
              <div 
                onClick={() => setIsChecklistOpen(!isChecklistOpen)} 
                className="flex items-center gap-2.5 cursor-pointer group"
              >
                <div className="text-left">
                  <span className="text-[10px] text-orange-500 font-extrabold tracking-widest uppercase">Execução Direta</span>
                  <h3 className="text-base font-black text-white tracking-tight mt-0.5 flex items-center gap-2">
                    Checklist de Hoje
                    <ChevronDown className={`h-4 w-4 text-zinc-500 group-hover:text-white transition-transform duration-200 ${isChecklistOpen ? 'transform rotate-0' : 'transform -rotate-90'}`} />
                  </h3>
                </div>
              </div>
              {isChecklistOpen && (
                <button 
                  onClick={() => setActiveTab('checklist')}
                  className="text-xs text-orange-400 hover:text-white font-bold flex items-center gap-1 transition-colors"
                >
                  Gerenciar <ArrowRight className="h-3 w-3" />
                </button>
              )}
            </div>
            
            <AnimatePresence initial={false}>
              {isChecklistOpen && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.2 }}
                  className="overflow-hidden"
                >
                  <p className="text-xs text-zinc-500 mb-4 leading-normal">
                    Conclua suas tarefas inegociáveis do dia diretamente do painel inicial.
                  </p>

                  <div className="space-y-2 max-h-[280px] overflow-y-auto pr-1 scrollbar-thin">
                    {dailyTasks.map(task => (
                      <div 
                        key={task.id} 
                        className={`p-3 rounded-xl border flex items-center justify-between transition-all ${
                          task.completed 
                            ? 'bg-zinc-950/20 border-zinc-900 text-zinc-500' 
                            : 'bg-zinc-900/40 border-zinc-850 text-white hover:border-zinc-800'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <button
                            onClick={() => handleToggleDashboardTask(task.id)}
                            className={`w-5 h-5 rounded-md border flex items-center justify-center transition-colors ${
                              task.completed 
                                ? 'bg-emerald-500 border-emerald-500 text-black' 
                                : 'border-zinc-700 hover:border-orange-500/50 bg-zinc-950'
                            }`}
                          >
                            {task.completed && <Check className="h-3.5 w-3.5 stroke-[3]" />}
                          </button>
                          <div>
                            <span className={`text-xs font-bold leading-normal ${task.completed ? 'line-through text-zinc-600' : 'text-zinc-200'}`}>
                              {task.text}
                            </span>
                            {task.period && (
                              <div className="flex items-center gap-2 mt-0.5">
                                <span className="text-[8px] text-zinc-500 font-bold">
                                  {task.period.toUpperCase()}
                                </span>
                              </div>
                            )}
                          </div>
                        </div>
                        
                        <span className={`text-[10px] font-mono font-bold ${task.completed ? 'text-emerald-500' : 'text-zinc-500'}`}>
                          {task.completed ? 'Completo' : 'Pendente'}
                        </span>
                      </div>
                    ))}

                    {dailyTasks.length === 0 && (
                      <div className="py-12 text-center text-zinc-500 border border-dashed border-zinc-850 rounded-2xl bg-zinc-950/20">
                        <CheckSquare className="h-8 w-8 text-zinc-600 mx-auto mb-2" />
                        <p className="text-xs">Nenhum ritual cadastrado para hoje.</p>
                        <button 
                          onClick={() => setActiveTab('checklist')}
                          className="mt-3 px-4 py-2 bg-orange-500/10 border border-orange-500/20 text-orange-400 hover:bg-orange-500 hover:text-white rounded-xl text-xs font-extrabold transition-all"
                        >
                          Adicionar no Checklist
                        </button>
                      </div>
                    )}
                  </div>

                  {dailyTasks.length > 0 && (
                    <div className="mt-4 pt-4 border-t border-zinc-900 flex justify-between items-center text-xs">
                      <span className="text-zinc-500 font-medium">Status de Conclusão:</span>
                      <span className="text-emerald-400 font-extrabold font-mono flex items-center gap-1">
                        <CheckCircle className="h-3.5 w-3.5" /> {completedChecklistCount}/{dailyTasks.length} Cumpridos
                      </span>
                    </div>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* Right Column: Today's Habits Tracker */}
        <div className="lg:col-span-6 bg-[#0a0a0c]/60 border border-zinc-850 rounded-3xl p-6 relative overflow-hidden flex flex-col h-fit self-start">
          <div>
            <div className={`flex justify-between items-center select-none ${isHabitsOpen ? 'mb-4' : 'mb-0'}`}>
              <div 
                onClick={() => setIsHabitsOpen(!isHabitsOpen)} 
                className="flex items-center gap-2.5 cursor-pointer group"
              >
                <div className="text-left">
                  <span className="text-[10px] text-orange-500 font-extrabold tracking-widest uppercase">Fortificação Diária</span>
                  <h3 className="text-base font-black text-white tracking-tight mt-0.5 flex items-center gap-2">
                    Hábitos de Hoje
                    <ChevronDown className={`h-4 w-4 text-zinc-500 group-hover:text-white transition-transform duration-200 ${isHabitsOpen ? 'transform rotate-0' : 'transform -rotate-90'}`} />
                  </h3>
                </div>
              </div>
              {isHabitsOpen && (
                <button 
                  onClick={() => setActiveTab('habitos')}
                  className="text-xs text-orange-400 hover:text-white font-bold flex items-center gap-1 transition-colors"
                >
                  Ver Histórico <ArrowRight className="h-3 w-3" />
                </button>
              )}
            </div>
            
            <AnimatePresence initial={false}>
              {isHabitsOpen && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.2 }}
                  className="overflow-hidden"
                >
                  <p className="text-xs text-zinc-500 mb-4 leading-normal">
                    Rituais ativos e vícios indesejáveis. Registre a vitória de hoje diretamente do painel inicial.
                  </p>

                  <div className="space-y-2 max-h-[280px] overflow-y-auto pr-1 scrollbar-thin">
                    {habits.map(habit => {
                      const isChecked = !!habit.history[todayKey];
                      const isBad = habit.type === 'bad';
                      
                      return (
                        <div 
                          key={habit.id} 
                          className={`p-3 rounded-xl border flex items-center justify-between transition-all ${
                            isChecked 
                              ? isBad
                                ? 'bg-rose-950/10 border-rose-950 text-rose-500'
                                : 'bg-orange-950/10 border-orange-950 text-orange-400' 
                              : 'bg-zinc-900/40 border-zinc-850 text-white hover:border-zinc-800'
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            <button
                              onClick={() => handleToggleDashboardHabit(habit.id)}
                              className={`w-6 h-6 rounded-full border flex items-center justify-center transition-all ${
                                isChecked 
                                  ? isBad 
                                    ? 'bg-rose-500 border-rose-500 text-white shadow-md shadow-rose-500/10' 
                                    : 'bg-orange-500 border-orange-500 text-black shadow-md shadow-orange-500/10'
                                  : 'border-zinc-700 bg-zinc-950 hover:border-orange-500/30'
                              }`}
                            >
                              {isChecked && <Check className="h-4 w-4 stroke-[3]" />}
                            </button>
                            
                            <div>
                              <span className={`text-xs font-bold flex items-center gap-2 ${isChecked ? 'text-zinc-400' : 'text-zinc-200'}`}>
                                {habit.name}
                                <span className={`text-[8px] uppercase px-1.5 py-0.5 rounded-md font-black border ${
                                  isBad 
                                    ? 'bg-rose-500/10 text-rose-400 border-rose-500/10' 
                                    : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/10'
                                }`}>
                                  {isBad ? 'Evitar' : 'Bom'}
                                </span>
                              </span>
                              
                              <span className="text-[9px] text-zinc-500 font-bold block mt-0.5">
                                🏷️ {habit.category} • {habit.frequency}
                              </span>
                            </div>
                          </div>

                          <div className="text-right">
                            <span className={`text-[9px] font-bold font-mono px-2 py-0.5 rounded-lg border ${
                              isChecked 
                                ? isBad
                                  ? 'bg-rose-500/10 text-rose-400 border-rose-500/20'
                                  : 'bg-orange-500/10 text-orange-400 border-orange-500/20'
                                : 'bg-zinc-950 text-zinc-500 border-zinc-900'
                            }`}>
                              {isChecked ? 'Concluído' : 'Pendente'}
                            </span>
                          </div>
                        </div>
                      );
                    })}

                    {habits.length === 0 && (
                      <div className="py-12 text-center text-zinc-500 border border-dashed border-zinc-850 rounded-2xl bg-zinc-950/20">
                        <Zap className="h-8 w-8 text-zinc-600 mx-auto mb-2" />
                        <p className="text-xs">Nenhum hábito cadastrado para rastrear.</p>
                        <button 
                          onClick={() => setActiveTab('habitos')}
                          className="mt-3 px-4 py-2 bg-orange-500/10 border border-orange-500/20 text-orange-400 hover:bg-orange-500 hover:text-white rounded-xl text-xs font-extrabold transition-all"
                        >
                          Adicionar Hábito
                        </button>
                      </div>
                    )}
                  </div>

                  {habits.length > 0 && (
                    <div className="mt-4 pt-4 border-t border-zinc-900 flex justify-between items-center text-xs">
                      <span className="text-zinc-500 font-medium">Consistência Semanal dos Hábitos:</span>
                      <span className="text-orange-400 font-extrabold font-mono">{habitsWeeklyPercent}% de preenchimento</span>
                    </div>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

      </div>

      {/* METAS & FINANÇAS ROW */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Widget: Active Goals */}
        <div className="lg:col-span-6 bg-[#0a0a0c]/60 border border-zinc-850 rounded-3xl p-6 relative overflow-hidden flex flex-col h-fit self-start">
          <div>
            <div className={`flex justify-between items-center select-none ${isGoalsOpen ? 'mb-4' : 'mb-0'}`}>
              <div 
                onClick={() => setIsGoalsOpen(!isGoalsOpen)} 
                className="flex items-center gap-2.5 cursor-pointer group"
              >
                <div className="text-left">
                  <span className="text-[10px] text-orange-500 font-extrabold tracking-widest uppercase">Evolução Pessoal</span>
                  <h3 className="text-base font-black text-white tracking-tight mt-0.5 flex items-center gap-2">
                    Metas Ativas
                    <ChevronDown className={`h-4 w-4 text-zinc-500 group-hover:text-white transition-transform duration-200 ${isGoalsOpen ? 'transform rotate-0' : 'transform -rotate-90'}`} />
                  </h3>
                </div>
              </div>
              {isGoalsOpen && (
                <button 
                  onClick={() => setActiveTab('metas')}
                  className="text-xs text-orange-400 hover:text-white font-bold flex items-center gap-1 transition-colors"
                >
                  Gerenciar Metas <ArrowRight className="h-3 w-3" />
                </button>
              )}
            </div>

            <AnimatePresence initial={false}>
              {isGoalsOpen && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.2 }}
                  className="overflow-hidden"
                >
                  <p className="text-xs text-zinc-500 mb-6 leading-normal">
                    Confira suas principais metas planejadas e complete ações estruturadas para subir de nível.
                  </p>

                  <div className="space-y-4 max-h-[220px] overflow-y-auto pr-1">
                    {goals.filter(g => !g.completed).slice(0, 3).map(goal => {
                      const goalProgress = Math.round((goal.actionsDone / goal.actionsTotal) * 100);
                      return (
                        <div key={goal.id} className="space-y-1.5 text-xs">
                          <div className="flex justify-between items-center">
                            <span className="font-extrabold text-white truncate max-w-[280px] block" title={goal.title}>
                              🎯 {goal.title}
                            </span>
                            <span className="text-zinc-500 text-[10px] font-mono">
                              <strong className="text-zinc-300">{goal.actionsDone}/{goal.actionsTotal} ações</strong> ({goalProgress}%)
                            </span>
                          </div>
                          
                          {/* Progress bar */}
                          <div className="w-full bg-zinc-950/60 border border-zinc-900 rounded-full h-1.5 overflow-hidden">
                            <div 
                              className="bg-orange-500 shadow-[0_0_8px_rgba(249,115,22,0.3)] h-full rounded-full transition-all duration-500"
                              style={{ width: `${goalProgress}%` }}
                            />
                          </div>
                        </div>
                      );
                    })}

                    {goals.filter(g => !g.completed).length === 0 && (
                      <div className="py-8 text-center text-zinc-500 border border-dashed border-zinc-850 rounded-xl bg-zinc-950/20">
                        <p className="text-xs">Nenhuma meta ativa cadastrada no momento.</p>
                        <button 
                          onClick={() => setActiveTab('metas')}
                          className="mt-2 text-xs text-orange-400 font-extrabold hover:underline"
                        >
                          Planejar primeira meta agora
                        </button>
                      </div>
                    )}
                  </div>

                  <div className="border-t border-zinc-900/60 mt-6 pt-4 flex justify-between items-center text-xs">
                    <span className="text-zinc-500">Média geral de progresso:</span>
                    <span className="text-orange-400 font-extrabold font-mono">{averageGoalProgress}% completado</span>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* Right Widget: Real Finances Summary & Transactions */}
        <div className="lg:col-span-6 bg-[#0a0a0c]/60 border border-zinc-850 rounded-3xl p-6 relative overflow-hidden flex flex-col h-fit self-start">
          <div>
            <div className={`flex justify-between items-center select-none ${isFinancesOpen ? 'mb-4' : 'mb-0'}`}>
              <div 
                onClick={() => setIsFinancesOpen(!isFinancesOpen)} 
                className="flex items-center gap-2.5 cursor-pointer group"
              >
                <div className="text-left">
                  <span className="text-[10px] text-orange-500 font-extrabold tracking-widest uppercase">Gestão Financeira</span>
                  <h3 className="text-base font-black text-white tracking-tight mt-0.5 flex items-center gap-2">
                    Finanças Consolidadas
                    <ChevronDown className={`h-4 w-4 text-zinc-500 group-hover:text-white transition-transform duration-200 ${isFinancesOpen ? 'transform rotate-0' : 'transform -rotate-90'}`} />
                  </h3>
                </div>
              </div>
              {isFinancesOpen && (
                <button 
                  onClick={() => setActiveTab('financas')}
                  className="text-xs text-orange-400 hover:text-white font-bold flex items-center gap-1 transition-colors"
                >
                  Lançamentos <ArrowRight className="h-3 w-3" />
                </button>
              )}
            </div>

            <AnimatePresence initial={false}>
              {isFinancesOpen && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.2 }}
                  className="overflow-hidden"
                >
                  {/* Income and Expense summary bars */}
                  <div className="grid grid-cols-2 gap-3 mb-6">
                    <div className="bg-zinc-950 border border-zinc-850/60 p-3 rounded-xl flex items-center gap-2.5">
                      <div className="p-1.5 bg-emerald-500/10 text-emerald-400 rounded-lg">
                        <ArrowUpRight className="h-4 w-4" />
                      </div>
                      <div>
                        <span className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider block">Receitas</span>
                        <span className="text-xs font-extrabold text-white font-mono">R$ {totalIncome.toLocaleString()}</span>
                      </div>
                    </div>

                    <div className="bg-zinc-950 border border-zinc-850/60 p-3 rounded-xl flex items-center gap-2.5">
                      <div className="p-1.5 bg-rose-500/10 text-rose-400 rounded-lg">
                        <ArrowDownRight className="h-4 w-4" />
                      </div>
                      <div>
                        <span className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider block">Despesas</span>
                        <span className="text-xs font-extrabold text-white font-mono">R$ {totalExpense.toLocaleString()}</span>
                      </div>
                    </div>
                  </div>

                  {/* List of 3 most recent real transactions */}
                  <h4 className="text-[10px] text-zinc-400 font-extrabold uppercase tracking-widest mb-2">Lançamentos Recentes</h4>
                  <div className="space-y-2 max-h-[140px] overflow-y-auto">
                    {finances.slice(-3).reverse().map(entry => {
                      const isIncome = entry.type === 'income';
                      return (
                        <div key={entry.id} className="bg-zinc-950/40 p-2.5 border border-zinc-900 rounded-xl flex items-center justify-between text-xs">
                          <div className="flex items-center gap-2 truncate">
                            <span className={`text-[8px] font-black uppercase px-1.5 py-0.5 rounded ${
                              isIncome 
                                ? 'bg-emerald-500/10 text-emerald-400' 
                                : 'bg-rose-500/10 text-rose-400'
                            }`}>
                              {entry.type === 'income' ? 'Rec' : entry.type === 'expense' ? 'Desp' : 'Inv'}
                            </span>
                            <span className="font-extrabold text-white truncate max-w-[160px]">{entry.description}</span>
                          </div>
                          
                          <div className="text-right">
                            <span className={`font-mono font-bold ${isIncome ? 'text-emerald-400' : 'text-zinc-300'}`}>
                              {isIncome ? '+' : '-'} R$ {entry.amount.toLocaleString()}
                            </span>
                          </div>
                        </div>
                      );
                    })}

                    {finances.length === 0 && (
                      <div className="py-6 text-center text-zinc-500 text-xs">
                        Nenhum lançamento financeiro registrado ainda.
                      </div>
                    )}
                  </div>

                  <div className="border-t border-zinc-900/60 mt-6 pt-4 flex justify-between items-center text-xs">
                    <span className="text-zinc-500">Dinheiro Disponível Geral:</span>
                    <span className={`font-mono font-bold ${availableBalance >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                      R$ {availableBalance.toLocaleString()}
                    </span>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

      </div>

      {/* COMPREHENSIVE DAILY ROUTINE VIEW */}
      <div className="bg-[#0a0a0c]/60 border border-zinc-850 rounded-3xl p-6 relative overflow-hidden text-xs">
        <div className="flex justify-between items-center mb-4">
          <div>
            <span className="text-[10px] text-orange-500 font-extrabold tracking-widest uppercase">Cronograma de Atividades</span>
            <h3 className="text-base font-black text-white tracking-tight mt-0.5">Sua Rotina para Hoje</h3>
          </div>
          <button 
            onClick={() => setActiveTab('rotina')}
            className="text-xs text-orange-400 hover:text-white font-bold flex items-center gap-1 transition-colors"
          >
            Editar Rotina <ArrowRight className="h-3 w-3" />
          </button>
        </div>
        
        <p className="text-xs text-zinc-500 mb-6 leading-normal">
          Seus compromissos recorrentes agendados na aba "Rotina Semanal" para o dia corrente.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {todayRoutines.map(item => (
            <div key={item.id} className="bg-zinc-950 p-4 border border-zinc-900 rounded-2xl flex items-start gap-3">
              <div className="p-2 bg-zinc-900 rounded-xl text-orange-400">
                <Clock className="h-4 w-4" />
              </div>
              <div className="text-left">
                <span className="text-[10px] font-mono text-orange-500 font-bold block">{item.time}</span>
                <span className="text-xs font-extrabold text-white block mt-0.5 leading-snug">{item.task}</span>
                <span className="text-[9px] text-zinc-500 block mt-1 font-medium">
                  {item.isEveryDay ? 'Todos os dias' : 'Semanal'}
                </span>
              </div>
            </div>
          ))}

          {todayRoutines.length === 0 && (
            <div className="sm:col-span-4 py-8 text-center text-zinc-500 border border-dashed border-zinc-850 rounded-2xl bg-zinc-950/20">
              Não há afazeres agendados para a rotina de hoje. Agende novos na aba "Rotina Semanal".
            </div>
          )}
        </div>
      </div>

      {/* Os 6 Pilares Section */}
      <div id="section-6-pilares" className="space-y-4">
        <h2 className="text-lg font-bold text-white tracking-wider flex items-center gap-2 uppercase">
          <Compass className="h-4 w-4 text-orange-500 animate-spin-slow" /> Os 6 Pilares do Planner Integrado
        </h2>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {pilares.map((pilar) => {
            const IconComponent = pilar.icon;
            return (
              <motion.div
                key={pilar.id}
                className="bg-[#0a0a0c]/60 hover:bg-zinc-900/60 p-5 rounded-2xl border border-zinc-850 hover:border-orange-500/20 transition-all flex flex-col justify-between gap-4 cursor-pointer relative overflow-hidden group text-left"
                onClick={() => setActiveTab(pilar.id)}
                whileHover={{ scale: 1.01 }}
              >
                {/* Visual gradient accent on hover */}
                <div className="absolute top-0 left-0 w-1 h-full bg-orange-500/50 opacity-0 group-hover:opacity-100 transition-opacity" />

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2.5 bg-zinc-950 rounded-xl text-orange-500 group-hover:bg-orange-500/10 group-hover:text-orange-400 transition-colors border border-zinc-900">
                      <IconComponent className="h-5 w-5" />
                    </div>
                    <div>
                      <h3 className="text-sm font-extrabold text-white group-hover:text-orange-500 transition-colors">
                        {pilar.title}
                      </h3>
                      <p className="text-[11px] text-gray-500 font-medium">
                        {pilar.subtitle}
                      </p>
                    </div>
                  </div>
                  <ChevronRight className="h-4 w-4 text-gray-600 group-hover:text-orange-500 transition-colors" />
                </div>

                <div className="space-y-1">
                  <div className="flex justify-between items-center text-[10px]">
                    <span className="text-gray-500 font-mono font-bold uppercase">Consistência Real</span>
                    <span className="text-orange-500 font-black font-mono">{pilar.progress}%</span>
                  </div>
                  <div className="w-full bg-[#18181b] h-1.5 rounded-full overflow-hidden">
                    <div className="bg-gradient-to-r from-orange-500 to-amber-500 h-full rounded-full" style={{ width: `${pilar.progress}%` }} />
                  </div>
                </div>

                <div className="text-[10px] text-orange-500 font-extrabold flex items-center gap-1 group-hover:underline mt-1">
                  <span>Acessar Módulo</span>
                  <ChevronRight className="h-3 w-3" />
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
