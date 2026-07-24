import React, { useState, useEffect } from 'react';
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
  HelpCircle,
  TrendingUp,
  Award,
  Sparkles,
  CheckCircle,
  AlertTriangle,
  Edit2
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Habit } from '../types';

interface HabitsTrackerViewProps {
  habits: Habit[];
  setHabits: React.Dispatch<React.SetStateAction<Habit[]>>;
  addXp: (amount: number) => void;
}

const CATEGORY_OPTIONS = [
  'Exercício',
  'Suplemento',
  'Leitura',
  'Saúde',
  'Trabalho',
  'Estudo',
  'Outro'
];

export default function HabitsTrackerView({ habits, setHabits, addXp }: HabitsTrackerViewProps) {
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

  // Reference week date calculations (Sábado to Sexta)
  const [referenceDate, setReferenceDate] = useState<Date>(() => new Date());
  const [weekDates, setWeekDates] = useState<Date[]>([]);

  // Calculate the dates for SÁB, DOM, SEG, TER, QUA, QUI, SEX week containing the referenceDate
  useEffect(() => {
    const dates: Date[] = [];
    const d = new Date(referenceDate);
    d.setHours(12, 0, 0, 0); // avoid timezone issues
    
    // Find the nearest preceding Saturday (or today if it is Saturday)
    // day indices: Sun=0, Mon=1, ..., Sat=6
    // If today is Sunday (0), offset to Saturday is -1 day
    // If today is Monday (1), offset is -2 days
    // If today is Friday (5), offset is -6 days
    // If today is Saturday (6), offset is 0 days
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

  // Helper to get formatted key YYYY-MM-DD
  const formatDateKey = (date: Date): string => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  // Helper to map category to icon
  const getCategoryIcon = (category: string, isBad: boolean) => {
    if (isBad) return <AlertTriangle className="h-4 w-4 text-rose-400" />;
    switch (category) {
      case 'Exercício':
        return <Dumbbell className="h-4 w-4 text-emerald-400" />;
      case 'Suplemento':
        return <Award className="h-4 w-4 text-cyan-400" />;
      case 'Leitura':
        return <BookOpen className="h-4 w-4 text-amber-400" />;
      case 'Saúde':
        return <Heart className="h-4 w-4 text-rose-400" />;
      case 'Trabalho':
        return <Briefcase className="h-4 w-4 text-blue-400" />;
      case 'Estudo':
        return <Book className="h-4 w-4 text-purple-400" />;
      default:
        return <Zap className="h-4 w-4 text-zinc-400" />;
    }
  };

  // Toggle habit check for a specific day
  const handleToggleHabitDay = (habitId: string, dateKey: string) => {
    setHabits(prevHabits => {
      return prevHabits.map(habit => {
        if (habit.id === habitId) {
          const currentHistory = { ...habit.history };
          const isCurrentlyChecked = !!currentHistory[dateKey];
          
          if (isCurrentlyChecked) {
            delete currentHistory[dateKey];
          } else {
            currentHistory[dateKey] = true;
            // Award XP for completion
            if (habit.type === 'good') {
              addXp(10); // Good habit completed: +10 XP
            } else {
              addXp(15); // Bad habit avoided/resisted: +15 XP (more difficult!)
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
    
    addXp(20); // +20 XP for planning a habit!
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

  // Calculate stats for reference week (7 days: Sábado to Sexta)
  const statsByDay = weekDates.map(date => {
    const dateKey = formatDateKey(date);
    let completedCount = 0;
    
    habits.forEach(habit => {
      if (habit.history[dateKey]) {
        completedCount++;
      }
    });
    
    return {
      dayLabel: date.toLocaleDateString('pt-BR', { weekday: 'short' }).replace('.', '').toUpperCase(),
      dayNum: date.getDate(),
      completedCount
    };
  });

  const maxCompletionsInWeek = Math.max(...statsByDay.map(s => s.completedCount), 1);

  // Efficiency by category calculations for the reference week
  const categoryEfficiency = CATEGORY_OPTIONS.map(cat => {
    const catHabits = habits.filter(h => h.category === cat);
    if (catHabits.length === 0) return null;

    let totalPossibleChecks = catHabits.length * 7;
    let checkedCount = 0;

    catHabits.forEach(habit => {
      weekDates.forEach(date => {
        const dateKey = formatDateKey(date);
        if (habit.history[dateKey]) {
          checkedCount++;
        }
      });
    });

    const percent = Math.round((checkedCount / totalPossibleChecks) * 100);

    return {
      category: cat,
      habitsCount: catHabits.length,
      percent
    };
  }).filter(Boolean) as { category: string; habitsCount: number; percent: number }[];

  // Habit consistency ranking for the reference week
  const habitConsistencyRanking = habits.map(habit => {
    let checkedCount = 0;
    
    weekDates.forEach(date => {
      const dateKey = formatDateKey(date);
      if (habit.history[dateKey]) {
        checkedCount++;
      }
    });

    const percent = Math.round((checkedCount / 7) * 100);

    return {
      id: habit.id,
      name: habit.name,
      checkedCount,
      percent,
      type: habit.type
    };
  }).sort((a, b) => b.percent - a.percent);

  // Filtered habits list
  const filteredHabits = habits.filter(habit => {
    const matchesCategory = activeCategoryFilter === 'Todos' || habit.category === activeCategoryFilter;
    const matchesType = activeTypeFilter === 'all' || 
      (activeTypeFilter === 'good' && habit.type === 'good') || 
      (activeTypeFilter === 'bad' && habit.type === 'bad');
    const matchesSearch = habit.name.toLowerCase().includes(searchQuery.toLowerCase());
    
    return matchesCategory && matchesType && matchesSearch;
  });

  // Week selection control helpers
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

  return (
    <div className="space-y-6 text-left max-w-7xl mx-auto px-4 sm:px-6 pb-24">
      
      {/* Header section with title and week switcher */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-zinc-800/60 pb-6">
        <div>
          <span className="text-[10px] font-bold text-orange-500 tracking-widest uppercase block mb-1">PROGRAMA DE EXCELÊNCIA</span>
          <h1 className="text-2xl font-black text-white tracking-tight flex items-center gap-2">
            <Zap className="h-6 w-6 text-orange-500 animate-pulse" /> Rastreador de Hábitos
          </h1>
          <p className="text-xs text-zinc-400 mt-1">Monitore e fortifique rituais produtivos, quebrando hábitos prejudiciais.</p>
        </div>

        {/* Reference Week Switcher */}
        <div className="flex items-center gap-2 self-start md:self-auto bg-zinc-950/80 p-1.5 rounded-2xl border border-zinc-800/80">
          <button 
            onClick={handlePrevWeek} 
            className="p-2 text-zinc-400 hover:text-white hover:bg-zinc-900 rounded-xl transition-all"
            title="Semana Anterior"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          
          <div className="px-3 text-center min-w-[150px]">
            <span className="text-xs font-bold text-white block">Semana de Referência</span>
            <span className="text-[10px] text-orange-400 font-mono font-medium block mt-0.5">{getWeekRangeLabel()}</span>
          </div>

          <button 
            onClick={handleNextWeek} 
            className="p-2 text-zinc-400 hover:text-white hover:bg-zinc-900 rounded-xl transition-all"
            title="Próxima Semana"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" />
            </svg>
          </button>

          <button 
            onClick={handleResetToCurrentWeek} 
            className="px-3 py-2 bg-orange-500/10 border border-orange-500/20 text-orange-400 hover:bg-orange-500 hover:text-white rounded-xl text-[10px] font-extrabold tracking-wider uppercase transition-all"
          >
            Hoje
          </button>
        </div>
      </div>

      {/* DASHBOARD: ANÁLISE DE DESEMPENHO */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left widget: Registros Completados por Dia (Bar chart) */}
        <div className="lg:col-span-4 bg-[#0a0a0c]/60 border border-zinc-850 rounded-3xl p-6 relative overflow-hidden backdrop-blur-md flex flex-col justify-between">
          <div>
            <div className="flex justify-between items-start mb-4">
              <div>
                <h3 className="text-xs font-extrabold text-zinc-400 uppercase tracking-widest">Análise de Desempenho</h3>
                <h2 className="text-sm font-bold text-white tracking-tight mt-1">Registros Completados por Dia</h2>
              </div>
              <span className="text-[9px] bg-zinc-900 border border-zinc-800 text-zinc-500 px-2 py-1 rounded-lg font-mono">
                Máx: {maxCompletionsInWeek} checks
              </span>
            </div>
            <p className="text-[11px] text-zinc-500 leading-normal mb-6">Comparação das suas vitórias diárias na semana de referência</p>
          </div>

          {/* Bar Chart Canvas */}
          <div className="flex items-end justify-between h-[150px] pt-4 px-2 bg-zinc-950/20 rounded-2xl border border-zinc-900/60">
            {statsByDay.map((stat, idx) => {
              const barHeightPercent = (stat.completedCount / maxCompletionsInWeek) * 100;
              const hasCompleted = stat.completedCount > 0;
              return (
                <div key={idx} className="flex flex-col items-center flex-1 group">
                  <div className="relative w-full flex justify-center h-[100px] items-end px-1.5">
                    {/* Tooltip on Hover */}
                    <div className="absolute bottom-full mb-1 bg-zinc-900 border border-zinc-800 px-2 py-0.5 rounded text-[9px] text-white opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none font-mono">
                      {stat.completedCount} checks
                    </div>
                    
                    {/* Gradient Bar */}
                    <motion.div 
                      initial={{ height: 0 }}
                      animate={{ height: `${Math.max(barHeightPercent, 4)}%` }}
                      transition={{ duration: 0.5, delay: idx * 0.05 }}
                      className={`w-full rounded-t-lg transition-all ${
                        hasCompleted 
                          ? 'bg-gradient-to-t from-orange-600 to-amber-400 shadow-[0_0_8px_rgba(249,115,22,0.2)]' 
                          : 'bg-zinc-900/60 border border-zinc-850'
                      }`}
                    />
                  </div>
                  
                  {/* Labels */}
                  <span className="text-[9px] font-bold text-zinc-400 mt-2 font-mono">{stat.dayLabel}</span>
                  <span className="text-[10px] text-zinc-500 font-mono mt-0.5">{stat.dayNum}</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Center widget: Eficiência por Categoria */}
        <div className="lg:col-span-4 bg-[#0a0a0c]/60 border border-zinc-850 rounded-3xl p-6 relative overflow-hidden backdrop-blur-md">
          <div>
            <h3 className="text-xs font-extrabold text-zinc-400 uppercase tracking-widest mb-1">Eficiência por Categoria</h3>
            <p className="text-[11px] text-zinc-500 mb-6">Taxa de preenchimento consolidada por tipo de ritual planejado</p>
          </div>

          <div className="space-y-4">
            {categoryEfficiency.map((cat, idx) => {
              let categoryColor = 'bg-orange-500 shadow-[0_0_8px_rgba(249,115,22,0.3)]';
              let categoryDot = 'bg-orange-500';
              if (cat.category === 'Exercício') { categoryColor = 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.3)]'; categoryDot = 'bg-emerald-500'; }
              else if (cat.category === 'Saúde') { categoryColor = 'bg-rose-500 shadow-[0_0_8px_rgba(244,63,94,0.3)]'; categoryDot = 'bg-rose-500'; }
              else if (cat.category === 'Estudo') { categoryColor = 'bg-purple-500 shadow-[0_0_8px_rgba(168,85,247,0.3)]'; categoryDot = 'bg-purple-500'; }
              else if (cat.category === 'Suplemento') { categoryColor = 'bg-cyan-500 shadow-[0_0_8px_rgba(6,182,212,0.3)]'; categoryDot = 'bg-cyan-500'; }
              else if (cat.category === 'Leitura') { categoryColor = 'bg-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.3)]'; categoryDot = 'bg-amber-500'; }
              else if (cat.category === 'Trabalho') { categoryColor = 'bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.3)]'; categoryDot = 'bg-blue-500'; }

              return (
                <div key={idx} className="space-y-1.5 text-xs">
                  <div className="flex justify-between items-center">
                    <span className="font-bold text-white flex items-center gap-1.5">
                      <span className={`w-2 h-2 rounded-full ${categoryDot}`} />
                      {cat.category} <span className="text-[10px] text-zinc-500 font-normal">({cat.habitsCount} {cat.habitsCount === 1 ? 'hábito' : 'hábitos'})</span>
                    </span>
                    <span className="font-mono font-bold text-zinc-400">{cat.percent}%</span>
                  </div>
                  
                  {/* Progress track */}
                  <div className="w-full bg-zinc-950/60 border border-zinc-900 rounded-full h-2 overflow-hidden">
                    <motion.div 
                      initial={{ width: 0 }}
                      animate={{ width: `${cat.percent}%` }}
                      transition={{ duration: 0.8, ease: "easeOut" }}
                      className={`h-full rounded-full ${categoryColor}`}
                    />
                  </div>
                </div>
              );
            })}
            {categoryEfficiency.length === 0 && (
              <div className="py-8 text-center text-zinc-500 text-xs">
                Nenhuma categoria ativa nesta semana de referência.
              </div>
            )}
          </div>
        </div>

        {/* Right widget: Ranking de Consistência dos Hábitos */}
        <div className="lg:col-span-4 bg-[#0a0a0c]/60 border border-zinc-850 rounded-3xl p-6 relative overflow-hidden backdrop-blur-md">
          <div>
            <h3 className="text-xs font-extrabold text-zinc-400 uppercase tracking-widest mb-1">Ranking de Consistência</h3>
            <p className="text-[11px] text-zinc-500 mb-6">Porcentagem de dias concluídos com sucesso neste período de 7 dias</p>
          </div>

          <div className="space-y-4 max-h-[220px] overflow-y-auto pr-1.5 scrollbar-thin">
            {habitConsistencyRanking.map((item, idx) => {
              const isBad = item.type === 'bad';
              const progressColor = isBad 
                ? 'bg-rose-500 shadow-[0_0_8px_rgba(244,63,94,0.3)]' 
                : 'bg-orange-500 shadow-[0_0_8px_rgba(249,115,22,0.3)]';

              return (
                <div key={item.id} className="space-y-1.5 text-xs">
                  <div className="flex justify-between items-center">
                    <span className="font-bold text-white truncate max-w-[180px] block" title={item.name}>
                      {item.name} {isBad && <span className="text-[9px] text-rose-400 font-normal">(Evitar)</span>}
                    </span>
                    <span className="text-zinc-500 text-[10px] font-mono">
                      <strong className="text-zinc-300">{item.checkedCount} / 7 dias</strong> ({item.percent}%)
                    </span>
                  </div>
                  
                  {/* Progress bar */}
                  <div className="w-full bg-zinc-950/60 border border-zinc-900 rounded-full h-1.5 overflow-hidden">
                    <motion.div 
                      initial={{ width: 0 }}
                      animate={{ width: `${item.percent}%` }}
                      transition={{ duration: 0.8, ease: "easeOut" }}
                      className={`h-full rounded-full ${progressColor}`}
                    />
                  </div>
                </div>
              );
            })}
            {habitConsistencyRanking.length === 0 && (
              <div className="py-8 text-center text-zinc-500 text-xs">
                Crie seu primeiro hábito abaixo para preencher o ranking!
              </div>
            )}
          </div>
        </div>

      </div>

      {/* TRACKER DETAILS CONTAINER */}
      <div className="bg-[#0a0a0c]/60 border border-zinc-850 rounded-3xl p-6 relative overflow-hidden backdrop-blur-md">
        
        {/* FILTERS & SEARCH ROW */}
        <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-4 border-b border-zinc-850 pb-5 mb-6">
          
          {/* Category Tabs */}
          <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-none pb-2 xl:pb-0">
            {['Todos', ...CATEGORY_OPTIONS].map(cat => (
              <button
                key={cat}
                onClick={() => setActiveCategoryFilter(cat)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap border ${
                  activeCategoryFilter === cat
                    ? 'bg-orange-500 text-white border-orange-500/30 shadow-lg shadow-orange-500/10'
                    : 'bg-zinc-900/60 border-zinc-800 text-zinc-400 hover:text-white hover:bg-zinc-850'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          {/* Quick Filters, Search & Add Action button */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
            
            {/* Good vs Bad Habit segment selector */}
            <div className="flex bg-zinc-950 border border-zinc-850 p-1 rounded-xl">
              <button
                onClick={() => setActiveTypeFilter('all')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  activeTypeFilter === 'all'
                    ? 'bg-zinc-850 text-white'
                    : 'text-zinc-500 hover:text-zinc-300'
                }`}
              >
                Todos
              </button>
              <button
                onClick={() => setActiveTypeFilter('good')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  activeTypeFilter === 'good'
                    ? 'bg-zinc-850 text-emerald-400'
                    : 'text-zinc-500 hover:text-zinc-300'
                }`}
              >
                Bons
              </button>
              <button
                onClick={() => setActiveTypeFilter('bad')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  activeTypeFilter === 'bad'
                    ? 'bg-zinc-850 text-rose-400'
                    : 'text-zinc-500 hover:text-zinc-300'
                }`}
              >
                Ruins
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
              className="bg-emerald-500 hover:bg-emerald-600 text-white font-bold text-xs px-4 py-2.5 rounded-xl flex items-center justify-center gap-1.5 transition-colors"
            >
              <Plus className="h-4 w-4" /> Novo Hábito
            </button>
          </div>

        </div>

        {/* HABITS WEEKLY GRID TABLE */}
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
                              {CATEGORY_OPTIONS.map(cat => (
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
                          {/* Colored circular category icon */}
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
                              <span className="text-[10px] text-zinc-500 font-medium">🏷️ {habit.category}</span>
                              <span className="text-zinc-600 font-bold text-[8px]">•</span>
                              <span className="text-[10px] text-zinc-500 font-bold bg-zinc-900 border border-zinc-850 px-1.5 py-0.5 rounded-md">{habit.frequency}</span>
                            </div>
                          </div>
                        </div>
                      )}
                    </td>

                    {/* Week Checks Columns */}
                    {weekDates.map((date, dayIdx) => {
                      const dateKey = formatDateKey(date);
                      const isChecked = !!habit.history[dateKey];
                      
                      let checkGlowColor = 'hover:border-emerald-500/50 hover:bg-emerald-500/5';
                      let activeColor = 'bg-emerald-500 border-emerald-500 text-black shadow-lg shadow-emerald-500/20';
                      
                      if (isBad) {
                        checkGlowColor = 'hover:border-rose-500/50 hover:bg-rose-500/5';
                        activeColor = 'bg-rose-500 border-rose-500 text-white shadow-lg shadow-rose-500/20';
                      } else {
                        checkGlowColor = 'hover:border-orange-500/50 hover:bg-orange-500/5';
                        activeColor = 'bg-orange-500 border-orange-500 text-black shadow-lg shadow-orange-500/20';
                      }

                      return (
                        <td key={dayIdx} className="py-4 px-2 text-center">
                          <button
                            onClick={() => handleToggleHabitDay(habit.id, dateKey)}
                            className={`w-8 h-8 rounded-full border-2 flex items-center justify-center mx-auto transition-all duration-300 focus:outline-none ${
                              isChecked
                                ? activeColor
                                : `border-zinc-800 bg-zinc-950/40 text-transparent ${checkGlowColor}`
                            }`}
                            title={isBad ? "Sucesso em evitar este hábito prejudicial!" : "Marcar como concluído!"}
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
                  <td colSpan={9} className="py-12 text-center text-zinc-500 text-xs">
                    Nenhum hábito cadastrado nesta categoria. Clique em "+ Novo Hábito" para planejar!
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

      </div>

      {/* NEW HABIT MODAL DIALOG */}
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
                    <p className="text-[10px] text-zinc-500 font-medium">Incorpore novos hábitos à sua rotina</p>
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
                      <CheckCircle className="h-3.5 w-3.5" /> Ritual Bom
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
                      ? '✓ Marque para ganhar +10 XP cada vez que realizar o hábito bom.'
                      : '⚠ Marque para ganhar +15 XP cada vez que evitar ou resistir ao hábito prejudicial.'}
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
                      {CATEGORY_OPTIONS.map(cat => (
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
