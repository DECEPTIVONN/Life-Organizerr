import React, { useState, useEffect, useMemo } from 'react';
import { 
  Zap, 
  Plus, 
  Trash2, 
  Check, 
  X, 
  Search, 
  Dumbbell, 
  Heart, 
  BookOpen, 
  Briefcase, 
  Book, 
  TrendingUp,
  Award,
  Sparkles,
  CheckCircle2,
  AlertTriangle,
  Edit2,
  ChevronLeft,
  ChevronRight,
  Calendar,
  CalendarDays,
  CalendarRange,
  BarChart3,
  Trophy,
  SlidersHorizontal,
  Pill,
  GraduationCap,
  Wallet,
  Utensils,
  Moon,
  Target,
  Tag,
  Layers,
  Flame,
  Activity,
  ArrowRight
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Habit } from '../types';

interface HabitsTrackerViewProps {
  habits: Habit[];
  setHabits: React.Dispatch<React.SetStateAction<Habit[]>>;
  addXp: (amount: number) => void;
  onToggleHabitSync?: (habitId: string, habitName: string, dateKey: string, isCompleted: boolean) => void;
}

export type TimeframeMode = 'semana' | 'mes' | 'ano' | 'total' | 'personalizada';

export const CATEGORY_OPTIONS = [
  'Exercício',
  'Suplemento',
  'Leitura',
  'Espiritualidade',
  'Saúde',
  'Trabalho',
  'Estudo',
  'Finanças',
  'Produtividade',
  'Alimentação',
  'Sono',
  'Outro'
];

// Helper to format Date as YYYY-MM-DD in local time
export const formatDateKey = (date: Date): string => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

// Parse YYYY-MM-DD to local Date object
export const parseDateKey = (str: string): Date => {
  const [y, m, d] = str.split('-').map(Number);
  return new Date(y, (m || 1) - 1, d || 1, 12, 0, 0);
};

export default function HabitsTrackerView({ habits, setHabits, addXp, onToggleHabitSync }: HabitsTrackerViewProps) {
  // Period / Timeframe Filter: Semana, Mês, Ano, Total, Data personalizada
  const [timeframeMode, setTimeframeMode] = useState<TimeframeMode>('semana');

  // Filters
  const [activeCategoryFilter, setActiveCategoryFilter] = useState<string>('Todos');
  const [activeTypeFilter, setActiveTypeFilter] = useState<'all' | 'good' | 'bad'>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Modal State for adding a habit
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [newHabitName, setNewHabitName] = useState('');
  const [newHabitType, setNewHabitType] = useState<'good' | 'bad'>('good');
  const [newHabitCategory, setNewHabitCategory] = useState('Exercício');
  const [newHabitFrequency, setNewHabitFrequency] = useState('Diário');

  // Edit State
  const [editingHabitId, setEditingHabitId] = useState<string | null>(null);
  const [editHabitName, setEditHabitName] = useState('');
  const [editHabitCategory, setEditHabitCategory] = useState('');
  const [editHabitFrequency, setEditHabitFrequency] = useState('');

  // ===================== TIME NAVIGATION STATES =====================
  // 1. Week View: reference date
  const [referenceDate, setReferenceDate] = useState<Date>(() => new Date());
  const [weekDates, setWeekDates] = useState<Date[]>([]);

  // 2. Month View: reference month (Date object)
  const [referenceMonth, setReferenceMonth] = useState<Date>(() => new Date());

  // 3. Year View: reference year number
  const [referenceYear, setReferenceYear] = useState<number>(() => new Date().getFullYear());

  // 4. Custom Date Range: Start & End string YYYY-MM-DD
  const todayKey = useMemo(() => formatDateKey(new Date()), []);
  const [customStartDate, setCustomStartDate] = useState<string>(() => {
    const d = new Date();
    d.setDate(d.getDate() - 13);
    return formatDateKey(d);
  });
  const [customEndDate, setCustomEndDate] = useState<string>(() => todayKey);

  // Dynamic categories list (built from default + habits categories)
  const availableCategories = useMemo(() => {
    const set = new Set<string>(CATEGORY_OPTIONS);
    habits.forEach(h => {
      if (h.category) set.add(h.category);
    });
    return Array.from(set);
  }, [habits]);

  // Calculate the dates for the week containing referenceDate (Saturday to Friday)
  useEffect(() => {
    const dates: Date[] = [];
    const d = new Date(referenceDate);
    d.setHours(12, 0, 0, 0);
    
    const dayOfWeek = d.getDay();
    const offsetToSaturday = (dayOfWeek + 1) % 7;
    
    const saturday = new Date(d);
    saturday.setDate(d.getDate() - offsetToSaturday);

    for (let i = 0; i < 7; i++) {
      const nextDay = new Date(saturday);
      nextDay.setDate(saturday.getDate() + i);
      dates.push(nextDay);
    }
    setWeekDates(dates);
  }, [referenceDate]);

  // Calculate dates in referenceMonth
  const monthDates = useMemo(() => {
    const year = referenceMonth.getFullYear();
    const month = referenceMonth.getMonth();
    const numDays = new Date(year, month + 1, 0).getDate();
    const dates: Date[] = [];
    for (let day = 1; day <= numDays; day++) {
      dates.push(new Date(year, month, day, 12, 0, 0));
    }
    return dates;
  }, [referenceMonth]);

  // Calculate dates in custom range
  const customRangeDates = useMemo(() => {
    if (!customStartDate || !customEndDate) return [];
    const start = parseDateKey(customStartDate);
    const end = parseDateKey(customEndDate);
    if (start > end) return [];

    const dates: Date[] = [];
    const curr = new Date(start);
    // Limit to 60 days max for table rendering safety
    let count = 0;
    while (curr <= end && count < 62) {
      dates.push(new Date(curr));
      curr.setDate(curr.getDate() + 1);
      count++;
    }
    return dates;
  }, [customStartDate, customEndDate]);

  // Category Icon mapper
  const getCategoryIcon = (category: string, isBad?: boolean, className: string = "h-4 w-4") => {
    if (isBad) return <AlertTriangle className={`${className} text-rose-400`} />;
    switch (category) {
      case 'Exercício':
        return <Dumbbell className={`${className} text-emerald-400`} />;
      case 'Suplemento':
        return <Pill className={`${className} text-cyan-400`} />;
      case 'Leitura':
        return <BookOpen className={`${className} text-amber-400`} />;
      case 'Espiritualidade':
        return <Sparkles className={`${className} text-indigo-400`} />;
      case 'Saúde':
        return <Heart className={`${className} text-rose-400`} />;
      case 'Trabalho':
        return <Briefcase className={`${className} text-blue-400`} />;
      case 'Estudo':
        return <GraduationCap className={`${className} text-purple-400`} />;
      case 'Finanças':
        return <Wallet className={`${className} text-emerald-300`} />;
      case 'Produtividade':
        return <Target className={`${className} text-sky-400`} />;
      case 'Alimentação':
        return <Utensils className={`${className} text-orange-400`} />;
      case 'Sono':
        return <Moon className={`${className} text-violet-400`} />;
      default:
        return <Zap className={`${className} text-zinc-400`} />;
    }
  };

  // Toggle habit check for a specific day
  const handleToggleHabitDay = (habitId: string, dateKey: string) => {
    let toggledHabitName = '';
    let newStatus = false;

    setHabits(prevHabits => {
      return prevHabits.map(habit => {
        if (habit.id === habitId) {
          toggledHabitName = habit.name;
          const currentHistory = { ...habit.history };
          const isCurrentlyChecked = !!currentHistory[dateKey];
          newStatus = !isCurrentlyChecked;
          
          if (isCurrentlyChecked) {
            delete currentHistory[dateKey];
          } else {
            currentHistory[dateKey] = true;
            // Award XP for completion
            if (habit.type === 'good') {
              addXp(10); // Good habit completed: +10 XP
            } else {
              addXp(15); // Bad habit avoided/resisted: +15 XP
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

    if (onToggleHabitSync && toggledHabitName) {
      onToggleHabitSync(habitId, toggledHabitName, dateKey, newStatus);
    }
  };

  // Save new habit
  const handleAddHabitSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newHabitName.trim()) return;

    const newHabit: Habit = {
      id: 'habit-' + Date.now(),
      name: newHabitName.trim(),
      type: newHabitType,
      category: newHabitCategory,
      frequency: newHabitFrequency,
      history: {},
      createdAt: formatDateKey(new Date())
    };

    setHabits(prev => [newHabit, ...prev]);
    
    // Reset form
    setNewHabitName('');
    setNewHabitType('good');
    setNewHabitCategory('Exercício');
    setNewHabitFrequency('Diário');
    setIsAddModalOpen(false);
    
    addXp(20);
  };

  // Start Editing
  const handleStartEdit = (habit: Habit) => {
    setEditingHabitId(habit.id);
    setEditHabitName(habit.name);
    setEditHabitCategory(habit.category);
    setEditHabitFrequency(habit.frequency);
  };

  // Save Edit
  const handleSaveEdit = (habitId: string) => {
    if (!editHabitName.trim()) return;
    setHabits(prev => prev.map(h => {
      if (h.id === habitId) {
        return {
          ...h,
          name: editHabitName.trim(),
          category: editHabitCategory,
          frequency: editHabitFrequency
        };
      }
      return h;
    }));
    setEditingHabitId(null);
  };

  // Delete Habit
  const handleDeleteHabit = (habitId: string) => {
    if (confirm('Tem certeza de que deseja excluir este hábito?')) {
      setHabits(prev => prev.filter(h => h.id !== habitId));
    }
  };

  // ===================== STREAK & STATS CALCULATIONS =====================
  const calculateStreak = (habit: Habit): { current: number; best: number; totalChecks: number } => {
    const dates = Object.keys(habit.history)
      .filter(d => habit.history[d])
      .sort();
    
    const totalChecks = dates.length;
    if (totalChecks === 0) return { current: 0, best: 0, totalChecks: 0 };

    // Calculate best streak
    let best = 1;
    let currRun = 1;
    for (let i = 1; i < dates.length; i++) {
      const prev = parseDateKey(dates[i - 1]);
      const curr = parseDateKey(dates[i]);
      const diffDays = Math.round((curr.getTime() - prev.getTime()) / (1000 * 60 * 60 * 24));
      if (diffDays === 1) {
        currRun++;
        if (currRun > best) best = currRun;
      } else if (diffDays > 1) {
        currRun = 1;
      }
    }

    // Calculate current streak
    let current = 0;
    const today = parseDateKey(todayKey);
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayKey = formatDateKey(yesterday);

    let checkDate = habit.history[todayKey] ? today : (habit.history[yesterdayKey] ? yesterday : null);

    if (checkDate) {
      current = 1;
      const testD = new Date(checkDate);
      while (true) {
        testD.setDate(testD.getDate() - 1);
        const k = formatDateKey(testD);
        if (habit.history[k]) {
          current++;
        } else {
          break;
        }
      }
    }

    return { current, best, totalChecks };
  };

  // Filtered habits list
  const filteredHabits = useMemo(() => {
    return habits.filter(habit => {
      const matchesCategory = activeCategoryFilter === 'Todos' || habit.category === activeCategoryFilter;
      const matchesType = activeTypeFilter === 'all' || 
        (activeTypeFilter === 'good' && habit.type === 'good') || 
        (activeTypeFilter === 'bad' && habit.type === 'bad');
      const matchesSearch = habit.name.toLowerCase().includes(searchQuery.toLowerCase());
      
      return matchesCategory && matchesType && matchesSearch;
    });
  }, [habits, activeCategoryFilter, activeTypeFilter, searchQuery]);

  // ===================== STATS COMPUTATIONS =====================
  // 1. Week Stats
  const weekStats = useMemo(() => {
    const statsByDay = weekDates.map(date => {
      const dateKey = formatDateKey(date);
      let completedCount = 0;
      habits.forEach(habit => {
        if (habit.history[dateKey]) completedCount++;
      });
      return {
        date,
        dayLabel: date.toLocaleDateString('pt-BR', { weekday: 'short' }).replace('.', '').toUpperCase(),
        dayNum: date.getDate(),
        completedCount
      };
    });

    const maxCompletionsInWeek = Math.max(...statsByDay.map(s => s.completedCount), 1);
    const totalWeeklyChecks = statsByDay.reduce((acc, curr) => acc + curr.completedCount, 0);

    return { statsByDay, maxCompletionsInWeek, totalWeeklyChecks };
  }, [weekDates, habits]);

  // Category efficiency for the selected timeframe
  const categoryEfficiency = useMemo(() => {
    let targetDates: Date[] = weekDates;
    if (timeframeMode === 'mes') targetDates = monthDates;
    else if (timeframeMode === 'personalizada') targetDates = customRangeDates;

    if (targetDates.length === 0) return [];

    return availableCategories.map(cat => {
      const catHabits = habits.filter(h => h.category === cat);
      if (catHabits.length === 0) return null;

      const totalPossible = catHabits.length * targetDates.length;
      let checkedCount = 0;

      catHabits.forEach(habit => {
        targetDates.forEach(date => {
          const k = formatDateKey(date);
          if (habit.history[k]) checkedCount++;
        });
      });

      const percent = totalPossible > 0 ? Math.round((checkedCount / totalPossible) * 100) : 0;
      return {
        category: cat,
        habitsCount: catHabits.length,
        percent,
        checkedCount,
        totalPossible
      };
    }).filter(Boolean) as { category: string; habitsCount: number; percent: number; checkedCount: number; totalPossible: number }[];
  }, [availableCategories, habits, timeframeMode, weekDates, monthDates, customRangeDates]);

  // Habit consistency ranking
  const habitConsistencyRanking = useMemo(() => {
    let targetDates: Date[] = weekDates;
    if (timeframeMode === 'mes') targetDates = monthDates;
    else if (timeframeMode === 'personalizada') targetDates = customRangeDates;
    else if (timeframeMode === 'ano') {
      // All dates in the reference year
      const yDates: Date[] = [];
      const numDays = ((referenceYear % 4 === 0 && referenceYear % 100 !== 0) || referenceYear % 400 === 0) ? 366 : 365;
      const start = new Date(referenceYear, 0, 1, 12, 0, 0);
      for (let i = 0; i < numDays; i++) {
        const d = new Date(start);
        d.setDate(start.getDate() + i);
        yDates.push(d);
      }
      targetDates = yDates;
    }

    if (targetDates.length === 0) return [];

    return habits.map(habit => {
      let checkedCount = 0;
      targetDates.forEach(date => {
        const k = formatDateKey(date);
        if (habit.history[k]) checkedCount++;
      });
      const percent = targetDates.length > 0 ? Math.round((checkedCount / targetDates.length) * 100) : 0;
      return {
        id: habit.id,
        name: habit.name,
        category: habit.category,
        checkedCount,
        totalDays: targetDates.length,
        percent,
        type: habit.type
      };
    }).sort((a, b) => b.percent - a.percent);
  }, [habits, timeframeMode, weekDates, monthDates, customRangeDates, referenceYear]);

  // Total View Stats
  const globalTotalStats = useMemo(() => {
    let totalAllChecks = 0;
    let maxStreakGlobal = 0;
    
    habits.forEach(h => {
      const s = calculateStreak(h);
      totalAllChecks += s.totalChecks;
      if (s.best > maxStreakGlobal) maxStreakGlobal = s.best;
    });

    const averageStreak = habits.length > 0 
      ? Math.round(habits.reduce((acc, h) => acc + calculateStreak(h).current, 0) / habits.length)
      : 0;

    return { totalAllChecks, maxStreakGlobal, averageStreak };
  }, [habits]);

  // Month navigation helpers
  const handlePrevMonth = () => {
    const prev = new Date(referenceMonth);
    prev.setMonth(prev.getMonth() - 1);
    setReferenceMonth(prev);
  };

  const handleNextMonth = () => {
    const next = new Date(referenceMonth);
    next.setMonth(next.getMonth() + 1);
    setReferenceMonth(next);
  };

  const handleResetToCurrentMonth = () => {
    setReferenceMonth(new Date());
  };

  // Year navigation helpers
  const handlePrevYear = () => setReferenceYear(y => y - 1);
  const handleNextYear = () => setReferenceYear(y => y + 1);
  const handleResetToCurrentYear = () => setReferenceYear(new Date().getFullYear());

  // Week navigation helpers
  const handlePrevWeek = () => {
    const prev = new Date(referenceDate);
    prev.setDate(prev.getDate() - 7);
    setReferenceDate(prev);
  };

  const handleNextWeek = () => {
    const next = new Date(referenceDate);
    next.setDate(next.getDate() + 7);
    setReferenceDate(next);
  };

  const handleResetToCurrentWeek = () => {
    setReferenceDate(new Date());
  };

  const getWeekRangeLabel = () => {
    if (weekDates.length < 7) return '';
    const start = weekDates[0];
    const end = weekDates[6];
    const startStr = start.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' });
    const endStr = end.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' });
    return `${startStr} - ${endStr}`;
  };

  const MONTH_NAMES = [
    'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
    'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
  ];

  return (
    <div className="space-y-6 text-left max-w-7xl mx-auto px-4 sm:px-6 pb-24">
      
      {/* ===================== HEADER SECTION ===================== */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-zinc-850 pb-6">
        <div>
          <span className="text-[10px] font-bold text-orange-500 tracking-widest uppercase block mb-1">
            PROGRAMA DE EXCELÊNCIA & HÁBITOS
          </span>
          <h1 className="text-2xl font-black text-white tracking-tight flex items-center gap-2">
            <Zap className="h-6 w-6 text-orange-500 animate-pulse" /> Rastreador de Hábitos
          </h1>
          <p className="text-xs text-zinc-400 mt-1">
            Monitore rituais diários, impulsione hábitos virtuosos e elimine rituais prejudiciais.
          </p>
        </div>

        {/* Timeframe Period Switcher Bar (Semana, Mês, Ano, Total, Data personalizada) */}
        <div className="flex items-center gap-1 bg-zinc-950 p-1.5 rounded-2xl border border-zinc-800 self-start md:self-auto overflow-x-auto max-w-full">
          <button
            onClick={() => setTimeframeMode('semana')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
              timeframeMode === 'semana'
                ? 'bg-orange-500 text-white shadow-sm shadow-orange-500/20'
                : 'text-zinc-400 hover:text-white hover:bg-zinc-900'
            }`}
          >
            <CalendarDays className="h-3.5 w-3.5" />
            <span>Semana</span>
          </button>

          <button
            onClick={() => setTimeframeMode('mes')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
              timeframeMode === 'mes'
                ? 'bg-orange-500 text-white shadow-sm shadow-orange-500/20'
                : 'text-zinc-400 hover:text-white hover:bg-zinc-900'
            }`}
          >
            <Calendar className="h-3.5 w-3.5" />
            <span>Mês</span>
          </button>

          <button
            onClick={() => setTimeframeMode('ano')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
              timeframeMode === 'ano'
                ? 'bg-orange-500 text-white shadow-sm shadow-orange-500/20'
                : 'text-zinc-400 hover:text-white hover:bg-zinc-900'
            }`}
          >
            <BarChart3 className="h-3.5 w-3.5" />
            <span>Ano</span>
          </button>

          <button
            onClick={() => setTimeframeMode('total')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
              timeframeMode === 'total'
                ? 'bg-orange-500 text-white shadow-sm shadow-orange-500/20'
                : 'text-zinc-400 hover:text-white hover:bg-zinc-900'
            }`}
          >
            <Trophy className="h-3.5 w-3.5" />
            <span>Total</span>
          </button>

          <button
            onClick={() => setTimeframeMode('personalizada')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
              timeframeMode === 'personalizada'
                ? 'bg-orange-500 text-white shadow-sm shadow-orange-500/20'
                : 'text-zinc-400 hover:text-white hover:bg-zinc-900'
            }`}
          >
            <SlidersHorizontal className="h-3.5 w-3.5" />
            <span>Data personalizada</span>
          </button>
        </div>
      </div>

      {/* ===================== TIMEFRAME NAVIGATION BAR ===================== */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-zinc-950/80 p-3 rounded-2xl border border-zinc-850">
        
        {timeframeMode === 'semana' && (
          <div className="flex items-center gap-2">
            <button 
              onClick={handlePrevWeek} 
              className="p-2 text-zinc-400 hover:text-white hover:bg-zinc-900 rounded-xl transition-all"
              title="Semana Anterior"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <div className="px-3 text-center min-w-[160px]">
              <span className="text-xs font-extrabold text-white block">Semana de Referência</span>
              <span className="text-[10px] text-orange-400 font-mono font-bold block mt-0.5">{getWeekRangeLabel()}</span>
            </div>
            <button 
              onClick={handleNextWeek} 
              className="p-2 text-zinc-400 hover:text-white hover:bg-zinc-900 rounded-xl transition-all"
              title="Próxima Semana"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
            <button 
              onClick={handleResetToCurrentWeek} 
              className="px-3 py-1.5 bg-orange-500/10 border border-orange-500/20 text-orange-400 hover:bg-orange-500 hover:text-white rounded-xl text-[10px] font-black tracking-wider uppercase transition-all ml-1"
            >
              Hoje
            </button>
          </div>
        )}

        {timeframeMode === 'mes' && (
          <div className="flex items-center gap-2">
            <button 
              onClick={handlePrevMonth} 
              className="p-2 text-zinc-400 hover:text-white hover:bg-zinc-900 rounded-xl transition-all"
              title="Mês Anterior"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <div className="px-3 text-center min-w-[160px]">
              <span className="text-xs font-extrabold text-white block">
                {MONTH_NAMES[referenceMonth.getMonth()]} de {referenceMonth.getFullYear()}
              </span>
              <span className="text-[10px] text-orange-400 font-mono font-bold block mt-0.5">
                {monthDates.length} dias no mês
              </span>
            </div>
            <button 
              onClick={handleNextMonth} 
              className="p-2 text-zinc-400 hover:text-white hover:bg-zinc-900 rounded-xl transition-all"
              title="Próximo Mês"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
            <button 
              onClick={handleResetToCurrentMonth} 
              className="px-3 py-1.5 bg-orange-500/10 border border-orange-500/20 text-orange-400 hover:bg-orange-500 hover:text-white rounded-xl text-[10px] font-black tracking-wider uppercase transition-all ml-1"
            >
              Este Mês
            </button>
          </div>
        )}

        {timeframeMode === 'ano' && (
          <div className="flex items-center gap-2">
            <button 
              onClick={handlePrevYear} 
              className="p-2 text-zinc-400 hover:text-white hover:bg-zinc-900 rounded-xl transition-all"
              title="Ano Anterior"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <div className="px-3 text-center min-w-[140px]">
              <span className="text-sm font-black text-white block">Ano {referenceYear}</span>
              <span className="text-[10px] text-orange-400 font-mono font-bold block mt-0.5">12 Meses Consolidado</span>
            </div>
            <button 
              onClick={handleNextYear} 
              className="p-2 text-zinc-400 hover:text-white hover:bg-zinc-900 rounded-xl transition-all"
              title="Próximo Ano"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
            <button 
              onClick={handleResetToCurrentYear} 
              className="px-3 py-1.5 bg-orange-500/10 border border-orange-500/20 text-orange-400 hover:bg-orange-500 hover:text-white rounded-xl text-[10px] font-black tracking-wider uppercase transition-all ml-1"
            >
              Ano Atual
            </button>
          </div>
        )}

        {timeframeMode === 'total' && (
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-orange-500/10 border border-orange-500/20 text-orange-400">
              <Trophy className="h-4 w-4" />
            </div>
            <div>
              <span className="text-xs font-black text-white block">Histórico Geral Acumulado</span>
              <span className="text-[10px] text-zinc-400 font-medium block">
                Todas as vitórias, sequências e métricas desde o primeiro registro
              </span>
            </div>
          </div>
        )}

        {timeframeMode === 'personalizada' && (
          <div className="flex flex-wrap items-center gap-2.5">
            <div className="flex items-center gap-1.5 bg-zinc-900 border border-zinc-800 rounded-xl px-2.5 py-1">
              <span className="text-[10px] font-bold text-zinc-500 uppercase">De:</span>
              <input 
                type="date" 
                value={customStartDate} 
                onChange={e => setCustomStartDate(e.target.value)}
                className="bg-transparent text-xs text-white font-mono focus:outline-none"
              />
            </div>
            <div className="flex items-center gap-1.5 bg-zinc-900 border border-zinc-800 rounded-xl px-2.5 py-1">
              <span className="text-[10px] font-bold text-zinc-500 uppercase">Até:</span>
              <input 
                type="date" 
                value={customEndDate} 
                onChange={e => setCustomEndDate(e.target.value)}
                className="bg-transparent text-xs text-white font-mono focus:outline-none"
              />
            </div>
            
            {/* Quick Presets */}
            <div className="flex items-center gap-1 ml-1">
              <button
                onClick={() => {
                  const d = new Date();
                  d.setDate(d.getDate() - 6);
                  setCustomStartDate(formatDateKey(d));
                  setCustomEndDate(todayKey);
                }}
                className="px-2 py-1 bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-[10px] text-zinc-300 font-bold rounded-lg transition-colors"
              >
                7D
              </button>
              <button
                onClick={() => {
                  const d = new Date();
                  d.setDate(d.getDate() - 13);
                  setCustomStartDate(formatDateKey(d));
                  setCustomEndDate(todayKey);
                }}
                className="px-2 py-1 bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-[10px] text-zinc-300 font-bold rounded-lg transition-colors"
              >
                14D
              </button>
              <button
                onClick={() => {
                  const d = new Date();
                  d.setDate(d.getDate() - 29);
                  setCustomStartDate(formatDateKey(d));
                  setCustomEndDate(todayKey);
                }}
                className="px-2 py-1 bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-[10px] text-zinc-300 font-bold rounded-lg transition-colors"
              >
                30D
              </button>
            </div>
          </div>
        )}

        {/* Global Quick Info Badge */}
        <div className="flex items-center gap-2 self-end sm:self-auto">
          <span className="text-[11px] text-zinc-400 font-bold flex items-center gap-1 bg-zinc-900 border border-zinc-800 px-2.5 py-1 rounded-xl">
            <Zap className="h-3.5 w-3.5 text-orange-400" />
            <strong className="text-white font-mono">{habits.length}</strong> hábitos ativos
          </span>
        </div>

      </div>

      {/* ===================== PERFORMANCE SUMMARY WIDGETS ===================== */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left widget: Activity / Checks metric */}
        <div className="lg:col-span-4 bg-[#0a0a0c]/60 border border-zinc-850 rounded-3xl p-6 relative overflow-hidden backdrop-blur-md flex flex-col justify-between">
          <div>
            <div className="flex justify-between items-start mb-2">
              <div>
                <h3 className="text-xs font-extrabold text-zinc-400 uppercase tracking-widest">
                  {timeframeMode === 'semana' ? 'Análise Diária' : timeframeMode === 'mes' ? 'Desempenho Mensal' : timeframeMode === 'ano' ? 'Desempenho Anual' : timeframeMode === 'total' ? 'Recordes Globais' : 'Período Personalizado'}
                </h3>
                <h2 className="text-sm font-bold text-white tracking-tight mt-1">
                  {timeframeMode === 'semana' && 'Registros por Dia da Semana'}
                  {timeframeMode === 'mes' && 'Aderência ao Longo do Mês'}
                  {timeframeMode === 'ano' && `Consolidado de ${referenceYear}`}
                  {timeframeMode === 'total' && 'Grandes Marcos e Sequências'}
                  {timeframeMode === 'personalizada' && 'Registros no Intervalo'}
                </h2>
              </div>
              <span className="text-[9px] bg-zinc-900 border border-zinc-800 text-zinc-400 px-2.5 py-1 rounded-lg font-mono font-bold flex items-center gap-1">
                <Flame className="h-3 w-3 text-orange-500" />
                {timeframeMode === 'semana' ? `${weekStats.totalWeeklyChecks} checks` : timeframeMode === 'total' ? `${globalTotalStats.totalAllChecks} checks` : `${habits.length} rituais`}
              </span>
            </div>
            <p className="text-[11px] text-zinc-500 leading-normal mb-5">
              {timeframeMode === 'semana' && 'Comparações das suas vitórias diárias na semana de referência.'}
              {timeframeMode === 'mes' && `Acompanhamento de todos os dias de ${MONTH_NAMES[referenceMonth.getMonth()]}.`}
              {timeframeMode === 'ano' && 'Resumo das vitórias e rituais sustentados durante todo o ano.'}
              {timeframeMode === 'total' && 'Estatísticas acumuladas desde a criação dos hábitos no sistema.'}
              {timeframeMode === 'personalizada' && `Acompanhamento entre ${customStartDate} e ${customEndDate}.`}
            </p>
          </div>

          {/* Visualization: Week Bar Chart OR Total KPIs */}
          {timeframeMode === 'semana' ? (
            <div className="flex items-end justify-between h-[140px] pt-4 px-2 bg-zinc-950/40 rounded-2xl border border-zinc-900/60">
              {weekStats.statsByDay.map((stat, idx) => {
                const barHeightPercent = (stat.completedCount / weekStats.maxCompletionsInWeek) * 100;
                const hasCompleted = stat.completedCount > 0;
                return (
                  <div key={idx} className="flex flex-col items-center flex-1 group">
                    <div className="relative w-full flex justify-center h-[90px] items-end px-1.5">
                      <div className="absolute bottom-full mb-1 bg-zinc-900 border border-zinc-800 px-2 py-0.5 rounded text-[9px] text-white opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none font-mono z-20">
                        {stat.completedCount} checks
                      </div>
                      <motion.div 
                        initial={{ height: 0 }}
                        animate={{ height: `${Math.max(barHeightPercent, 4)}%` }}
                        transition={{ duration: 0.4, delay: idx * 0.04 }}
                        className={`w-full rounded-t-lg transition-all ${
                          hasCompleted 
                            ? 'bg-gradient-to-t from-orange-600 to-amber-400 shadow-[0_0_8px_rgba(249,115,22,0.25)]' 
                            : 'bg-zinc-900/60 border border-zinc-850'
                        }`}
                      />
                    </div>
                    <span className="text-[9px] font-bold text-zinc-400 mt-2 font-mono">{stat.dayLabel}</span>
                    <span className="text-[10px] text-zinc-500 font-mono mt-0.5">{stat.dayNum}</span>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-3 pt-2">
              <div className="bg-zinc-950/60 border border-zinc-900 p-3.5 rounded-2xl">
                <span className="text-[10px] font-bold text-zinc-500 uppercase block">Total de Conclusões</span>
                <span className="text-xl font-black text-white font-mono mt-1 block flex items-center gap-1.5">
                  <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                  {timeframeMode === 'total' 
                    ? globalTotalStats.totalAllChecks 
                    : habits.reduce((acc, h) => {
                        const target = timeframeMode === 'mes' ? monthDates : timeframeMode === 'personalizada' ? customRangeDates : [];
                        return acc + target.filter(d => h.history[formatDateKey(d)]).length;
                      }, 0)}
                </span>
                <span className="text-[9px] text-zinc-500 mt-0.5 block">checks no período</span>
              </div>
              <div className="bg-zinc-950/60 border border-zinc-900 p-3.5 rounded-2xl">
                <span className="text-[10px] font-bold text-zinc-500 uppercase block">Melhor Sequência</span>
                <span className="text-xl font-black text-orange-400 font-mono mt-1 block flex items-center gap-1.5">
                  <Flame className="h-4 w-4 text-orange-500" />
                  {globalTotalStats.maxStreakGlobal} dias
                </span>
                <span className="text-[9px] text-zinc-500 mt-0.5 block">recorde histórico</span>
              </div>
            </div>
          )}
        </div>

        {/* Center widget: Eficiência por Categoria */}
        <div className="lg:col-span-4 bg-[#0a0a0c]/60 border border-zinc-850 rounded-3xl p-6 relative overflow-hidden backdrop-blur-md">
          <div className="flex items-center justify-between mb-1">
            <h3 className="text-xs font-extrabold text-zinc-400 uppercase tracking-widest flex items-center gap-1.5">
              <Activity className="h-3.5 w-3.5 text-orange-400" />
              Eficiência por Categoria
            </h3>
          </div>
          <p className="text-[11px] text-zinc-500 mb-5">Taxa de preenchimento consolidada no período ativo</p>

          <div className="space-y-3.5 max-h-[220px] overflow-y-auto pr-1 scrollbar-thin">
            {categoryEfficiency.map((cat, idx) => (
              <div key={idx} className="space-y-1.5 text-xs">
                <div className="flex justify-between items-center">
                  <span className="font-bold text-white flex items-center gap-1.5">
                    {getCategoryIcon(cat.category, false, "h-3.5 w-3.5")}
                    <span>{cat.category}</span>
                    <span className="text-[10px] text-zinc-500 font-normal">
                      ({cat.habitsCount})
                    </span>
                  </span>
                  <span className="font-mono font-bold text-zinc-400">{cat.percent}%</span>
                </div>
                
                <div className="w-full bg-zinc-950/60 border border-zinc-900 rounded-full h-2 overflow-hidden">
                  <motion.div 
                    initial={{ width: 0 }}
                    animate={{ width: `${cat.percent}%` }}
                    transition={{ duration: 0.6, ease: "easeOut" }}
                    className="h-full rounded-full bg-gradient-to-r from-orange-500 to-amber-400"
                  />
                </div>
              </div>
            ))}
            {categoryEfficiency.length === 0 && (
              <div className="py-8 text-center text-zinc-500 text-xs">
                Nenhum registro encontrado nesta categoria no período.
              </div>
            )}
          </div>
        </div>

        {/* Right widget: Ranking de Consistência dos Hábitos */}
        <div className="lg:col-span-4 bg-[#0a0a0c]/60 border border-zinc-850 rounded-3xl p-6 relative overflow-hidden backdrop-blur-md">
          <div className="flex items-center justify-between mb-1">
            <h3 className="text-xs font-extrabold text-zinc-400 uppercase tracking-widest flex items-center gap-1.5">
              <Trophy className="h-3.5 w-3.5 text-amber-400" />
              Ranking de Consistência
            </h3>
          </div>
          <p className="text-[11px] text-zinc-500 mb-5">Hábito mais consistente no período selecionado</p>

          <div className="space-y-3 max-h-[220px] overflow-y-auto pr-1.5 scrollbar-thin">
            {habitConsistencyRanking.map((item, idx) => {
              const isBad = item.type === 'bad';
              return (
                <div key={item.id} className="space-y-1.5 text-xs">
                  <div className="flex justify-between items-center">
                    <span className="font-bold text-white truncate max-w-[180px] flex items-center gap-1.5" title={item.name}>
                      <span className="text-[10px] font-mono text-zinc-500">#{idx + 1}</span>
                      {getCategoryIcon(item.category, isBad, "h-3 w-3 shrink-0")}
                      <span className="truncate">{item.name}</span>
                      {isBad && <span className="text-[9px] text-rose-400 font-normal">(Evitar)</span>}
                    </span>
                    <span className="text-zinc-500 text-[10px] font-mono">
                      <strong className="text-zinc-300">{item.checkedCount}/{item.totalDays}</strong> ({item.percent}%)
                    </span>
                  </div>
                  
                  <div className="w-full bg-zinc-950/60 border border-zinc-900 rounded-full h-1.5 overflow-hidden">
                    <motion.div 
                      initial={{ width: 0 }}
                      animate={{ width: `${item.percent}%` }}
                      transition={{ duration: 0.6, ease: "easeOut" }}
                      className={`h-full rounded-full ${isBad ? 'bg-rose-500' : 'bg-orange-500'}`}
                    />
                  </div>
                </div>
              );
            })}
            {habitConsistencyRanking.length === 0 && (
              <div className="py-8 text-center text-zinc-500 text-xs">
                Cadastre seus rituais para acompanhar o ranking!
              </div>
            )}
          </div>
        </div>

      </div>

      {/* ===================== TRACKER DETAILS CONTAINER ===================== */}
      <div className="bg-[#0a0a0c]/60 border border-zinc-850 rounded-3xl p-6 relative overflow-hidden backdrop-blur-md">
        
        {/* FILTERS & SEARCH ROW */}
        <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-4 border-b border-zinc-850 pb-5 mb-6">
          
          {/* Category Tabs with explicit, rich Lucide Icons */}
          <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-none pb-2 xl:pb-0 max-w-full">
            <button
              onClick={() => setActiveCategoryFilter('Todos')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap border ${
                activeCategoryFilter === 'Todos'
                  ? 'bg-orange-500 text-white border-orange-500/30 shadow-lg shadow-orange-500/10'
                  : 'bg-zinc-900/60 border-zinc-800 text-zinc-400 hover:text-white hover:bg-zinc-850'
              }`}
            >
              <Layers className="h-3.5 w-3.5" />
              <span>Todos</span>
            </button>

            {availableCategories.map(cat => (
              <button
                key={cat}
                onClick={() => setActiveCategoryFilter(cat)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap border ${
                  activeCategoryFilter === cat
                    ? 'bg-orange-500 text-white border-orange-500/30 shadow-lg shadow-orange-500/10'
                    : 'bg-zinc-900/60 border-zinc-800 text-zinc-400 hover:text-white hover:bg-zinc-850'
                }`}
              >
                {getCategoryIcon(cat, false, "h-3.5 w-3.5")}
                <span>{cat}</span>
              </button>
            ))}
          </div>

          {/* Quick Filters, Search & Add Action button */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
            
            {/* Good vs Bad Habit segment selector with icons */}
            <div className="flex bg-zinc-950 border border-zinc-850 p-1 rounded-xl">
              <button
                onClick={() => setActiveTypeFilter('all')}
                className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  activeTypeFilter === 'all'
                    ? 'bg-zinc-850 text-white'
                    : 'text-zinc-500 hover:text-zinc-300'
                }`}
              >
                <Layers className="h-3 w-3" />
                <span>Todos</span>
              </button>
              <button
                onClick={() => setActiveTypeFilter('good')}
                className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  activeTypeFilter === 'good'
                    ? 'bg-zinc-850 text-emerald-400'
                    : 'text-zinc-500 hover:text-zinc-300'
                }`}
              >
                <CheckCircle2 className="h-3 w-3" />
                <span>Bons</span>
              </button>
              <button
                onClick={() => setActiveTypeFilter('bad')}
                className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  activeTypeFilter === 'bad'
                    ? 'bg-zinc-850 text-rose-400'
                    : 'text-zinc-500 hover:text-zinc-300'
                }`}
              >
                <AlertTriangle className="h-3 w-3" />
                <span>Ruins</span>
              </button>
            </div>

            {/* Search Box */}
            <div className="relative flex-1 sm:w-60">
              <Search className="h-3.5 w-3.5 text-zinc-500 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Filtrar por nome..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-zinc-950/60 border border-zinc-850 rounded-xl py-2 pl-9 pr-4 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-orange-500/40 focus:bg-zinc-950 transition-all"
              />
            </div>

            {/* New Habit Button */}
            <button
              onClick={() => setIsAddModalOpen(true)}
              className="bg-emerald-500 hover:bg-emerald-600 text-white font-bold text-xs px-4 py-2.5 rounded-xl flex items-center justify-center gap-1.5 transition-colors shadow-md shadow-emerald-500/10 active:scale-95"
            >
              <Plus className="h-4 w-4" /> Novo Hábito
            </button>
          </div>

        </div>

        {/* ===================== VIEW 1: SEMANA ===================== */}
        {timeframeMode === 'semana' && (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-zinc-300 border-collapse">
              <thead>
                <tr className="border-b border-zinc-850 text-zinc-500 font-bold uppercase tracking-wider text-[10px] bg-zinc-950/10">
                  <th className="pb-3 pt-2 px-4 min-w-[240px]">Detalhes do Hábito</th>
                  {weekDates.map((date, idx) => {
                    const dayLabel = date.toLocaleDateString('pt-BR', { weekday: 'short' }).substring(0, 3).replace('.', '').toUpperCase();
                    const isToday = formatDateKey(new Date()) === formatDateKey(date);
                    return (
                      <th key={idx} className="pb-3 pt-2 px-2 text-center w-14">
                        <span className={`block font-extrabold ${isToday ? 'text-orange-400' : 'text-zinc-500'}`}>{dayLabel}</span>
                        <span className={`block text-[10px] font-mono mt-0.5 ${isToday ? 'bg-orange-500/10 text-orange-400 border border-orange-500/20 px-1.5 py-0.5 rounded-md inline-block font-extrabold' : 'text-zinc-400 font-normal'}`}>
                          {date.getDate()}
                        </span>
                      </th>
                    );
                  })}
                  <th className="pb-3 pt-2 px-4 text-right w-24">Ações</th>
                </tr>
              </thead>
              
              <tbody className="divide-y divide-zinc-850/40">
                {filteredHabits.map(habit => {
                  const isEditing = editingHabitId === habit.id;
                  const isBad = habit.type === 'bad';

                  return (
                    <tr key={habit.id} className="hover:bg-zinc-900/10 transition-colors group">
                      
                      {/* Habit Details Column */}
                      <td className="py-4 px-4">
                        {isEditing ? (
                          <div className="space-y-2 max-w-xs">
                            <input
                              type="text"
                              value={editHabitName}
                              onChange={(e) => setEditHabitName(e.target.value)}
                              className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-2.5 py-1.5 text-white text-xs focus:outline-none focus:border-orange-500"
                            />
                            <div className="flex gap-2">
                              <select
                                value={editHabitCategory}
                                onChange={(e) => setEditHabitCategory(e.target.value)}
                                className="bg-zinc-900 border border-zinc-800 rounded-lg px-2 py-1 text-white text-[11px] focus:outline-none"
                              >
                                {availableCategories.map(cat => (
                                  <option key={cat} value={cat}>{cat}</option>
                                ))}
                              </select>
                              <input
                                type="text"
                                value={editHabitFrequency}
                                onChange={(e) => setEditHabitFrequency(e.target.value)}
                                className="w-24 bg-zinc-900 border border-zinc-800 rounded-lg px-2 py-1 text-white text-[11px] focus:outline-none"
                                placeholder="Frequência"
                              />
                            </div>
                          </div>
                        ) : (
                          <div className="flex items-center gap-3">
                            <div className={`p-2.5 rounded-xl border flex-shrink-0 ${
                              isBad 
                                ? 'bg-rose-500/10 border-rose-500/20 text-rose-500 shadow-sm shadow-rose-500/5' 
                                : 'bg-orange-500/10 border-orange-500/20 text-orange-500 shadow-sm shadow-orange-500/5'
                            }`}>
                              {getCategoryIcon(habit.category, isBad)}
                            </div>
                            
                            <div className="min-w-0">
                              <h4 className="text-xs font-extrabold text-white leading-normal truncate flex items-center gap-1.5">
                                {habit.name}
                                <span className={`text-[8px] uppercase tracking-wider px-1.5 py-0.5 rounded-md font-black border ${
                                  isBad 
                                    ? 'bg-rose-500/10 text-rose-400 border-rose-500/20' 
                                    : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                                }`}>
                                  {isBad ? 'Evitar' : 'Bom'}
                                </span>
                              </h4>
                              
                              <div className="flex items-center gap-2 mt-1">
                                <span className="text-[10px] text-zinc-400 font-medium flex items-center gap-1">
                                  <Tag className="h-2.5 w-2.5 text-zinc-500" />
                                  {habit.category}
                                </span>
                                <span className="text-zinc-600 font-bold text-[8px]">•</span>
                                <span className="text-[10px] text-zinc-400 font-bold bg-zinc-900 border border-zinc-850 px-1.5 py-0.5 rounded-md">
                                  {habit.frequency}
                                </span>
                              </div>
                            </div>
                          </div>
                        )}
                      </td>

                      {/* Week Checks Columns */}
                      {weekDates.map((date, dayIdx) => {
                        const dateKey = formatDateKey(date);
                        const isChecked = !!habit.history[dateKey];
                        
                        let checkGlowColor = isBad 
                          ? 'hover:border-rose-500/50 hover:bg-rose-500/5' 
                          : 'hover:border-orange-500/50 hover:bg-orange-500/5';
                        let activeColor = isBad 
                          ? 'bg-rose-500 border-rose-500 text-white shadow-lg shadow-rose-500/20' 
                          : 'bg-orange-500 border-orange-500 text-black shadow-lg shadow-orange-500/20';

                        return (
                          <td key={dayIdx} className="py-4 px-2 text-center">
                            <button
                              onClick={() => handleToggleHabitDay(habit.id, dateKey)}
                              className={`w-8 h-8 rounded-full border-2 flex items-center justify-center mx-auto transition-all duration-200 focus:outline-none ${
                                isChecked
                                  ? activeColor
                                  : `border-zinc-800 bg-zinc-950/40 text-transparent ${checkGlowColor}`
                              }`}
                              title={isBad ? "Sucesso em evitar este hábito!" : "Marcar como concluído!"}
                            >
                              <Check className="h-4.5 w-4.5 stroke-[3]" />
                            </button>
                          </td>
                        );
                      })}

                      {/* Actions Column */}
                      <td className="py-4 px-4 text-right">
                        {isEditing ? (
                          <div className="flex justify-end gap-1.5">
                            <button
                              onClick={() => handleSaveEdit(habit.id)}
                              className="p-1.5 bg-emerald-500/10 border border-emerald-500/20 hover:bg-emerald-500 hover:text-black rounded-lg transition-colors text-emerald-400"
                              title="Salvar"
                            >
                              <Check className="h-3.5 w-3.5" />
                            </button>
                            <button
                              onClick={() => setEditingHabitId(null)}
                              className="p-1.5 bg-rose-500/10 border border-rose-500/20 hover:bg-rose-500 text-white rounded-lg transition-colors text-rose-400"
                              title="Cancelar"
                            >
                              <X className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        ) : (
                          <div className="flex justify-end gap-1.5 opacity-100 xl:opacity-0 xl:group-hover:opacity-100 transition-opacity">
                            <button
                              onClick={() => handleStartEdit(habit)}
                              className="p-1.5 text-zinc-500 hover:text-white hover:bg-zinc-800 rounded-lg transition-all"
                              title="Editar Hábito"
                            >
                              <Edit2 className="h-3.5 w-3.5" />
                            </button>
                            <button
                              onClick={() => handleDeleteHabit(habit.id)}
                              className="p-1.5 text-zinc-500 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition-all"
                              title="Excluir Hábito"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        )}
                      </td>

                    </tr>
                  );
                })}

                {filteredHabits.length === 0 && (
                  <tr>
                    <td colSpan={10} className="py-12 text-center text-zinc-500 text-xs">
                      Nenhum hábito cadastrado nesta categoria. Clique em "+ Novo Hábito" para planejar!
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}

        {/* ===================== VIEW 2: MÊS ===================== */}
        {timeframeMode === 'mes' && (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-zinc-300 border-collapse">
              <thead>
                <tr className="border-b border-zinc-850 text-zinc-500 font-bold uppercase tracking-wider text-[10px] bg-zinc-950/10">
                  <th className="pb-3 pt-2 px-4 min-w-[220px] sticky left-0 bg-[#0a0a0c] z-10">Hábito</th>
                  {monthDates.map((date) => {
                    const isToday = formatDateKey(date) === todayKey;
                    const dayNum = date.getDate();
                    const dayOfWeek = date.toLocaleDateString('pt-BR', { weekday: 'narrow' });
                    return (
                      <th key={dayNum} className="pb-3 pt-2 px-1 text-center min-w-[28px]">
                        <span className={`block text-[9px] ${isToday ? 'text-orange-400 font-extrabold' : 'text-zinc-500'}`}>
                          {dayOfWeek}
                        </span>
                        <span className={`block font-mono text-[10px] mt-0.5 ${
                          isToday ? 'bg-orange-500/20 text-orange-400 px-1 py-0.5 rounded font-black' : 'text-zinc-400'
                        }`}>
                          {dayNum}
                        </span>
                      </th>
                    );
                  })}
                  <th className="pb-3 pt-2 px-4 text-center min-w-[90px]">Taxa Mês</th>
                  <th className="pb-3 pt-2 px-4 text-right min-w-[80px]">Ações</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-zinc-850/40">
                {filteredHabits.map(habit => {
                  const isBad = habit.type === 'bad';
                  const monthChecks = monthDates.filter(d => habit.history[formatDateKey(d)]).length;
                  const monthPercent = Math.round((monthChecks / monthDates.length) * 100);

                  return (
                    <tr key={habit.id} className="hover:bg-zinc-900/10 transition-colors group">
                      {/* Name column */}
                      <td className="py-3 px-4 sticky left-0 bg-[#0a0a0c] z-10 shadow-sm">
                        <div className="flex items-center gap-2.5">
                          <div className={`p-1.5 rounded-lg border flex-shrink-0 ${
                            isBad ? 'bg-rose-500/10 border-rose-500/20 text-rose-400' : 'bg-orange-500/10 border-orange-500/20 text-orange-400'
                          }`}>
                            {getCategoryIcon(habit.category, isBad, "h-3.5 w-3.5")}
                          </div>
                          <div className="min-w-0">
                            <h4 className="text-xs font-bold text-white truncate max-w-[150px]">{habit.name}</h4>
                            <span className="text-[10px] text-zinc-500 block truncate">{habit.category}</span>
                          </div>
                        </div>
                      </td>

                      {/* Day cells for the whole month */}
                      {monthDates.map(date => {
                        const k = formatDateKey(date);
                        const isChecked = !!habit.history[k];
                        const isToday = k === todayKey;

                        return (
                          <td key={k} className="py-3 px-0.5 text-center">
                            <button
                              onClick={() => handleToggleHabitDay(habit.id, k)}
                              className={`w-6 h-6 rounded-md flex items-center justify-center mx-auto transition-all ${
                                isChecked
                                  ? isBad ? 'bg-rose-500 text-white shadow-sm' : 'bg-orange-500 text-black shadow-sm font-bold'
                                  : isToday 
                                  ? 'border border-orange-500/50 bg-orange-500/5 hover:bg-orange-500/10'
                                  : 'bg-zinc-950/60 hover:bg-zinc-900 border border-zinc-850/60'
                              }`}
                              title={`${date.toLocaleDateString('pt-BR')}: ${isChecked ? 'Concluído' : 'Não feito'}`}
                            >
                              {isChecked ? <Check className="h-3.5 w-3.5 stroke-[3]" /> : <span className="w-1 h-1 rounded-full bg-zinc-800" />}
                            </button>
                          </td>
                        );
                      })}

                      {/* Month rate */}
                      <td className="py-3 px-4 text-center font-mono">
                        <span className="text-xs font-bold text-white">{monthChecks}/{monthDates.length}</span>
                        <span className="text-[10px] text-orange-400 font-bold block">{monthPercent}%</span>
                      </td>

                      {/* Actions */}
                      <td className="py-3 px-4 text-right">
                        <div className="flex justify-end gap-1">
                          <button
                            onClick={() => handleStartEdit(habit)}
                            className="p-1 text-zinc-500 hover:text-white rounded"
                            title="Editar"
                          >
                            <Edit2 className="h-3 w-3" />
                          </button>
                          <button
                            onClick={() => handleDeleteHabit(habit.id)}
                            className="p-1 text-zinc-500 hover:text-rose-400 rounded"
                            title="Excluir"
                          >
                            <Trash2 className="h-3 w-3" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}

                {filteredHabits.length === 0 && (
                  <tr>
                    <td colSpan={monthDates.length + 3} className="py-12 text-center text-zinc-500 text-xs">
                      Nenhum hábito cadastrado nesta categoria.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}

        {/* ===================== VIEW 3: ANO ===================== */}
        {timeframeMode === 'ano' && (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-zinc-300 border-collapse">
              <thead>
                <tr className="border-b border-zinc-850 text-zinc-500 font-bold uppercase tracking-wider text-[10px] bg-zinc-950/10">
                  <th className="pb-3 pt-2 px-4 min-w-[200px]">Hábito</th>
                  {MONTH_NAMES.map((name, idx) => (
                    <th key={idx} className="pb-3 pt-2 px-2 text-center w-20">
                      <span className="block text-[10px] font-bold text-zinc-400">{name.substring(0, 3)}</span>
                    </th>
                  ))}
                  <th className="pb-3 pt-2 px-4 text-center min-w-[100px]">Total Ano</th>
                  <th className="pb-3 pt-2 px-4 text-right w-20">Ações</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-zinc-850/40">
                {filteredHabits.map(habit => {
                  const isBad = habit.type === 'bad';
                  let annualTotal = 0;

                  return (
                    <tr key={habit.id} className="hover:bg-zinc-900/10 transition-colors group">
                      {/* Habit info */}
                      <td className="py-4 px-4">
                        <div className="flex items-center gap-2.5">
                          <div className={`p-2 rounded-xl border flex-shrink-0 ${
                            isBad ? 'bg-rose-500/10 border-rose-500/20 text-rose-400' : 'bg-orange-500/10 border-orange-500/20 text-orange-400'
                          }`}>
                            {getCategoryIcon(habit.category, isBad, "h-4 w-4")}
                          </div>
                          <div>
                            <h4 className="text-xs font-bold text-white">{habit.name}</h4>
                            <span className="text-[10px] text-zinc-500">{habit.category}</span>
                          </div>
                        </div>
                      </td>

                      {/* 12 Months breakdown */}
                      {MONTH_NAMES.map((_, monthIdx) => {
                        const daysInMonth = new Date(referenceYear, monthIdx + 1, 0).getDate();
                        let monthChecks = 0;
                        for (let d = 1; d <= daysInMonth; d++) {
                          const k = `${referenceYear}-${String(monthIdx + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
                          if (habit.history[k]) monthChecks++;
                        }
                        annualTotal += monthChecks;
                        const pct = Math.round((monthChecks / daysInMonth) * 100);

                        return (
                          <td key={monthIdx} className="py-3 px-2 text-center font-mono">
                            <div className="bg-zinc-950/80 border border-zinc-900 rounded-xl p-2">
                              <span className="text-xs font-bold text-white block">{monthChecks}</span>
                              <div className="w-full bg-zinc-900 rounded-full h-1 mt-1.5 overflow-hidden">
                                <div 
                                  className={`h-full rounded-full ${isBad ? 'bg-rose-500' : 'bg-orange-500'}`}
                                  style={{ width: `${pct}%` }}
                                />
                              </div>
                              <span className="text-[9px] text-zinc-500 font-bold block mt-1">{pct}%</span>
                            </div>
                          </td>
                        );
                      })}

                      {/* Annual total */}
                      <td className="py-3 px-4 text-center font-mono">
                        <span className="text-sm font-black text-orange-400 block">{annualTotal} checks</span>
                        <span className="text-[10px] text-zinc-500 block">no ano</span>
                      </td>

                      {/* Actions */}
                      <td className="py-3 px-4 text-right">
                        <div className="flex justify-end gap-1">
                          <button
                            onClick={() => handleStartEdit(habit)}
                            className="p-1.5 text-zinc-500 hover:text-white rounded"
                            title="Editar"
                          >
                            <Edit2 className="h-3.5 w-3.5" />
                          </button>
                          <button
                            onClick={() => handleDeleteHabit(habit.id)}
                            className="p-1.5 text-zinc-500 hover:text-rose-400 rounded"
                            title="Excluir"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}

                {filteredHabits.length === 0 && (
                  <tr>
                    <td colSpan={15} className="py-12 text-center text-zinc-500 text-xs">
                      Nenhum hábito cadastrado nesta categoria.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}

        {/* ===================== VIEW 4: TOTAL (ALL TIME) ===================== */}
        {timeframeMode === 'total' && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredHabits.map(habit => {
              const streak = calculateStreak(habit);
              const isBad = habit.type === 'bad';
              const isCheckedToday = !!habit.history[todayKey];

              return (
                <div 
                  key={habit.id}
                  className="bg-zinc-950/80 border border-zinc-850 rounded-2xl p-5 relative overflow-hidden flex flex-col justify-between hover:border-zinc-700 transition-colors"
                >
                  <div>
                    {/* Top badge & icon */}
                    <div className="flex items-start justify-between gap-3 mb-3">
                      <div className="flex items-center gap-2.5">
                        <div className={`p-2 rounded-xl border ${
                          isBad ? 'bg-rose-500/10 border-rose-500/20 text-rose-400' : 'bg-orange-500/10 border-orange-500/20 text-orange-400'
                        }`}>
                          {getCategoryIcon(habit.category, isBad, "h-4 w-4")}
                        </div>
                        <div>
                          <h4 className="text-sm font-extrabold text-white leading-tight">{habit.name}</h4>
                          <span className="text-[10px] text-zinc-400 font-medium flex items-center gap-1 mt-0.5">
                            <Tag className="h-2.5 w-2.5 text-zinc-500" />
                            {habit.category} • {habit.frequency}
                          </span>
                        </div>
                      </div>
                      
                      <span className={`text-[9px] uppercase tracking-wider px-2 py-0.5 rounded-md font-bold border ${
                        isBad ? 'bg-rose-500/10 text-rose-400 border-rose-500/20' : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                      }`}>
                        {isBad ? 'Evitar' : 'Bom'}
                      </span>
                    </div>

                    {/* Stats Grid */}
                    <div className="grid grid-cols-3 gap-2 my-4 bg-black/40 p-3 rounded-xl border border-zinc-900 text-center font-mono">
                      <div>
                        <span className="text-[9px] text-zinc-500 uppercase block">Total</span>
                        <span className="text-xs font-black text-white">{streak.totalChecks}</span>
                      </div>
                      <div>
                        <span className="text-[9px] text-zinc-500 uppercase block">Atual</span>
                        <span className="text-xs font-black text-orange-400 flex items-center justify-center gap-0.5">
                          <Flame className="h-3 w-3 text-orange-500" />
                          {streak.current}d
                        </span>
                      </div>
                      <div>
                        <span className="text-[9px] text-zinc-500 uppercase block">Recorde</span>
                        <span className="text-xs font-black text-amber-400 flex items-center justify-center gap-0.5">
                          <Trophy className="h-3 w-3 text-amber-500" />
                          {streak.best}d
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Bottom Action: Toggle Today + Edit/Delete */}
                  <div className="flex items-center justify-between pt-3 border-t border-zinc-900 mt-2">
                    <button
                      onClick={() => handleToggleHabitDay(habit.id, todayKey)}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                        isCheckedToday
                          ? isBad 
                            ? 'bg-rose-500 text-white shadow-md' 
                            : 'bg-emerald-500 text-black shadow-md'
                          : 'bg-zinc-900 hover:bg-zinc-850 text-zinc-300 border border-zinc-800'
                      }`}
                    >
                      <Check className="h-3.5 w-3.5 stroke-[3]" />
                      <span>{isCheckedToday ? 'Concluído Hoje' : 'Marcar Hoje'}</span>
                    </button>

                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => handleStartEdit(habit)}
                        className="p-1.5 text-zinc-500 hover:text-white rounded-lg hover:bg-zinc-900"
                        title="Editar"
                      >
                        <Edit2 className="h-3.5 w-3.5" />
                      </button>
                      <button
                        onClick={() => handleDeleteHabit(habit.id)}
                        className="p-1.5 text-zinc-500 hover:text-rose-400 rounded-lg hover:bg-zinc-900"
                        title="Excluir"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>

                </div>
              );
            })}

            {filteredHabits.length === 0 && (
              <div className="col-span-full py-12 text-center text-zinc-500 text-xs">
                Nenhum hábito cadastrado nesta categoria.
              </div>
            )}
          </div>
        )}

        {/* ===================== VIEW 5: DATA PERSONALIZADA ===================== */}
        {timeframeMode === 'personalizada' && (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-zinc-300 border-collapse">
              <thead>
                <tr className="border-b border-zinc-850 text-zinc-500 font-bold uppercase tracking-wider text-[10px] bg-zinc-950/10">
                  <th className="pb-3 pt-2 px-4 min-w-[220px]">Hábito</th>
                  {customRangeDates.map((date, idx) => {
                    const isToday = formatDateKey(date) === todayKey;
                    return (
                      <th key={idx} className="pb-3 pt-2 px-1 text-center min-w-[32px]">
                        <span className="block text-[9px] text-zinc-500 font-bold">
                          {date.toLocaleDateString('pt-BR', { weekday: 'narrow' })}
                        </span>
                        <span className={`block font-mono text-[10px] ${isToday ? 'text-orange-400 font-black' : 'text-zinc-400'}`}>
                          {date.getDate()}/{date.getMonth() + 1}
                        </span>
                      </th>
                    );
                  })}
                  <th className="pb-3 pt-2 px-4 text-center min-w-[90px]">Total Período</th>
                  <th className="pb-3 pt-2 px-4 text-right w-20">Ações</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-zinc-850/40">
                {filteredHabits.map(habit => {
                  const isBad = habit.type === 'bad';
                  const checksInInterval = customRangeDates.filter(d => habit.history[formatDateKey(d)]).length;
                  const intervalPercent = customRangeDates.length > 0 
                    ? Math.round((checksInInterval / customRangeDates.length) * 100) 
                    : 0;

                  return (
                    <tr key={habit.id} className="hover:bg-zinc-900/10 transition-colors group">
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2.5">
                          <div className={`p-1.5 rounded-lg border flex-shrink-0 ${
                            isBad ? 'bg-rose-500/10 border-rose-500/20 text-rose-400' : 'bg-orange-500/10 border-orange-500/20 text-orange-400'
                          }`}>
                            {getCategoryIcon(habit.category, isBad, "h-3.5 w-3.5")}
                          </div>
                          <div>
                            <h4 className="text-xs font-bold text-white">{habit.name}</h4>
                            <span className="text-[10px] text-zinc-500">{habit.category}</span>
                          </div>
                        </div>
                      </td>

                      {/* Day cells for custom range */}
                      {customRangeDates.map((date, dIdx) => {
                        const k = formatDateKey(date);
                        const isChecked = !!habit.history[k];
                        return (
                          <td key={dIdx} className="py-3 px-1 text-center">
                            <button
                              onClick={() => handleToggleHabitDay(habit.id, k)}
                              className={`w-6 h-6 rounded-md flex items-center justify-center mx-auto transition-all ${
                                isChecked
                                  ? isBad ? 'bg-rose-500 text-white' : 'bg-orange-500 text-black font-bold'
                                  : 'bg-zinc-950 hover:bg-zinc-900 border border-zinc-850'
                              }`}
                              title={`${date.toLocaleDateString('pt-BR')}: ${isChecked ? 'Concluído' : 'Não feito'}`}
                            >
                              {isChecked ? <Check className="h-3 w-3 stroke-[3]" /> : <span className="w-1 h-1 rounded-full bg-zinc-800" />}
                            </button>
                          </td>
                        );
                      })}

                      {/* Total in interval */}
                      <td className="py-3 px-4 text-center font-mono">
                        <span className="text-xs font-bold text-white">{checksInInterval}/{customRangeDates.length}</span>
                        <span className="text-[10px] text-orange-400 font-bold block">{intervalPercent}%</span>
                      </td>

                      {/* Actions */}
                      <td className="py-3 px-4 text-right">
                        <div className="flex justify-end gap-1">
                          <button
                            onClick={() => handleStartEdit(habit)}
                            className="p-1 text-zinc-500 hover:text-white rounded"
                            title="Editar"
                          >
                            <Edit2 className="h-3 w-3" />
                          </button>
                          <button
                            onClick={() => handleDeleteHabit(habit.id)}
                            className="p-1 text-zinc-500 hover:text-rose-400 rounded"
                            title="Excluir"
                          >
                            <Trash2 className="h-3 w-3" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}

                {filteredHabits.length === 0 && (
                  <tr>
                    <td colSpan={customRangeDates.length + 3} className="py-12 text-center text-zinc-500 text-xs">
                      Nenhum hábito cadastrado nesta categoria.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}

      </div>

      {/* ===================== NEW HABIT MODAL DIALOG ===================== */}
      <AnimatePresence>
        {isAddModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            
            {/* Backdrop */}
            <motion.div
              className="fixed inset-0 bg-black/80 backdrop-blur-sm"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsAddModalOpen(false)}
            />

            {/* Modal Body */}
            <motion.div
              className="relative bg-zinc-950 border border-zinc-800 rounded-3xl w-full max-w-md overflow-hidden z-50 shadow-[0_0_50px_rgba(249,115,22,0.15)] p-6 text-left"
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
            >
              {/* Header */}
              <div className="flex justify-between items-center border-b border-zinc-900 pb-4 mb-5">
                <div className="flex items-center gap-2">
                  <div className="p-2 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-xl">
                    <Plus className="h-4 w-4" />
                  </div>
                  <div>
                    <h2 className="text-base font-extrabold text-white tracking-tight">Criar Novo Hábito</h2>
                    <p className="text-[10px] text-zinc-500 font-medium">Incorpore novos rituais à sua rotina diária</p>
                  </div>
                </div>
                
                <button
                  onClick={() => setIsAddModalOpen(false)}
                  className="p-1 hover:bg-zinc-900 text-zinc-500 hover:text-white rounded-lg transition-colors"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              {/* Form */}
              <form onSubmit={handleAddHabitSubmit} className="space-y-4">
                
                {/* Name */}
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider block">Nome do Hábito</label>
                  <input
                    type="text"
                    required
                    placeholder="Ex: Beber 3L de água, Fazer cardio, Ler livro..."
                    value={newHabitName}
                    onChange={(e) => setNewHabitName(e.target.value)}
                    className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-3 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-orange-500/50 transition-colors"
                  />
                </div>

                {/* Habit Type Selector (Good vs Bad) */}
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider block">Tipo de Hábito</label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setNewHabitType('good')}
                      className={`py-3 px-4 rounded-xl border text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
                        newHabitType === 'good'
                          ? 'bg-emerald-500/10 border-emerald-500 text-emerald-400 font-extrabold'
                          : 'bg-zinc-900 border-zinc-800 text-zinc-500 hover:text-zinc-300'
                      }`}
                    >
                      <CheckCircle2 className="h-3.5 w-3.5" /> Ritual Bom
                    </button>
                    <button
                      type="button"
                      onClick={() => setNewHabitType('bad')}
                      className={`py-3 px-4 rounded-xl border text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
                        newHabitType === 'bad'
                          ? 'bg-rose-500/10 border-rose-500 text-rose-400 font-extrabold'
                          : 'bg-zinc-900 border-zinc-800 text-zinc-500 hover:text-zinc-300'
                      }`}
                    >
                      <AlertTriangle className="h-3.5 w-3.5" /> Quebrar Ruim
                    </button>
                  </div>
                  <span className="text-[9px] text-zinc-500 block mt-1 leading-normal">
                    {newHabitType === 'good' 
                      ? '✓ Ganhe +10 XP ao realizar este hábito benéfico.'
                      : '⚠ Ganhe +15 XP ao resistir/evitar o hábito prejudicial.'}
                  </span>
                </div>

                {/* Category & Frequency Row */}
                <div className="grid grid-cols-2 gap-3">
                  
                  {/* Category */}
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider block">Categoria</label>
                    <select
                      value={newHabitCategory}
                      onChange={(e) => setNewHabitCategory(e.target.value)}
                      className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-3 py-3 text-xs text-white focus:outline-none focus:border-orange-500/50"
                    >
                      {availableCategories.map(cat => (
                        <option key={cat} value={cat}>{cat}</option>
                      ))}
                    </select>
                  </div>

                  {/* Frequency */}
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider block">Frequência</label>
                    <select
                      value={newHabitFrequency}
                      onChange={(e) => setNewHabitFrequency(e.target.value)}
                      className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-3 py-3 text-xs text-white focus:outline-none focus:border-orange-500/50"
                    >
                      <option value="Diário">Diário</option>
                      <option value="3x na semana">3x na semana</option>
                      <option value="5x na semana">5x na semana</option>
                      <option value="Finais de semana">Finais de semana</option>
                      <option value="Personalizado">Personalizado</option>
                    </select>
                  </div>

                </div>

                {/* Action Buttons */}
                <div className="flex gap-2.5 pt-4 border-t border-zinc-900 mt-5">
                  <button
                    type="button"
                    onClick={() => setIsAddModalOpen(false)}
                    className="flex-1 bg-zinc-900 hover:bg-zinc-850 text-zinc-400 font-bold text-xs py-3 rounded-xl transition-colors border border-zinc-800"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="flex-1 bg-emerald-500 hover:bg-emerald-600 text-white font-bold text-xs py-3 rounded-xl shadow-lg shadow-emerald-500/10 transition-colors"
                  >
                    Planejar Ritual
                  </button>
                </div>

              </form>
            </motion.div>

          </div>
        )}
      </AnimatePresence>

    </div>
  );
}
