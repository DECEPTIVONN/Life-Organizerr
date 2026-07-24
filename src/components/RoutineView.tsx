import React, { useState, useEffect } from 'react';
import { 
  Clock, 
  Plus, 
  Trash2, 
  CalendarDays,
  CheckCircle,
  HelpCircle,
  TrendingUp,
  Zap,
  List,
  LayoutGrid,
  Check,
  Compass,
  X,
  Sparkles,
  BookOpen,
  ChevronLeft,
  ChevronRight,
  Save,
  AlertCircle,
  Pencil
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { RoutineItem, MonthlyReview, CalendarNote, WeeklyReview } from '../types';

interface RoutineViewProps {
  routine: RoutineItem[];
  setRoutine: React.Dispatch<React.SetStateAction<RoutineItem[]>>;
  gridRoutine?: Record<string, any>;
  setGridRoutine?: (newGrid: any) => void;
  addXp: (amount: number) => void;
  monthlyReviews: MonthlyReview[];
  setMonthlyReviews: React.Dispatch<React.SetStateAction<MonthlyReview[]>>;
  weeklyReviews: WeeklyReview[];
  setWeeklyReviews: React.Dispatch<React.SetStateAction<WeeklyReview[]>>;
  notes: CalendarNote[];
  setNotes?: React.Dispatch<React.SetStateAction<CalendarNote[]>>;
}

const DEFAULT_GRATITUDE_TEMPLATE = `Sou profundamente grato(a) hoje por:
1. 
2. 
3. `;

const DEFAULT_PRAYER_TEMPLATE = `Senhor, agradeço por mais um dia de vida. Peço sabedoria para guiar minhas ações, proteção para o meu caminho e paz para o meu coração e da minha família. Amém.`;

export default function RoutineView({ 
  routine, 
  setRoutine, 
  gridRoutine,
  setGridRoutine,
  addXp,
  monthlyReviews,
  setMonthlyReviews,
  weeklyReviews,
  setWeeklyReviews,
  notes,
  setNotes
}: RoutineViewProps) {
  const [selectedDay, setSelectedDay] = useState<number>(() => {
    return new Date().getDay();
  });
  const [isAdding, setIsAdding] = useState(false);
  const [time, setTime] = useState('08:00');
  const [taskText, setTaskText] = useState('');
  const [isEveryDay, setIsEveryDay] = useState(false);
  const [viewMode, setViewMode] = useState<'lista' | 'quadro'>('lista');

  // Edit / Clear states
  const [editingItem, setEditingItem] = useState<RoutineItem | null>(null);
  const [editTime, setEditTime] = useState('08:00');
  const [editTaskText, setEditTaskText] = useState('');
  const [editIsEveryDay, setEditIsEveryDay] = useState(false);
  const [editSelectedDay, setEditSelectedDay] = useState<number>(1);
  const [showClearModal, setShowClearModal] = useState(false);

  // Days of the week, starting with Sunday as the first day (0)
  const daysOfWeek = [
    { id: 0, name: 'Dom', fullName: 'Domingo' },
    { id: 1, name: 'Seg', fullName: 'Segunda-feira' },
    { id: 2, name: 'Ter', fullName: 'Terça-feira' },
    { id: 3, name: 'Qua', fullName: 'Quarta-feira' },
    { id: 4, name: 'Qui', fullName: 'Quinta-feira' },
    { id: 5, name: 'Sex', fullName: 'Sexta-feira' },
    { id: 6, name: 'Sáb', fullName: 'Sábado' }
  ];

  const months = [
    'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
    'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
  ];

  // --- Monthly Review (Review Mensal) States ---
  const [isReviewOpen, setIsReviewOpen] = useState(false);
  const [reviewYear, setReviewYear] = useState(new Date().getFullYear());
  const [reviewMonth, setReviewMonth] = useState(new Date().getMonth());
  
  const [reviewOneSentence, setReviewOneSentence] = useState('');
  const [reviewMemorableMoments, setReviewMemorableMoments] = useState<string[]>([]);
  const [reviewLearnings, setReviewLearnings] = useState<string[]>([]);
  const [reviewImprovements, setReviewImprovements] = useState<string[]>([]);
  
  const [newMemorableItem, setNewMemorableItem] = useState('');
  const [newLearningItem, setNewLearningItem] = useState('');
  const [newImprovementItem, setNewImprovementItem] = useState('');
  const [reviewSavingStatus, setReviewSavingStatus] = useState<'idle' | 'saving' | 'saved'>('idle');

  // Sync Monthly Review data when year or month changes
  useEffect(() => {
    const existing = monthlyReviews.find(r => r.year === reviewYear && r.month === reviewMonth);
    if (existing) {
      setReviewOneSentence(existing.oneSentence || '');
      setReviewMemorableMoments(existing.memorableMoments || []);
      setReviewLearnings(existing.learnings || []);
      setReviewImprovements(existing.improvements || []);
    } else {
      setReviewOneSentence('');
      setReviewMemorableMoments([]);
      setReviewLearnings([]);
      setReviewImprovements([]);
    }
    setReviewSavingStatus('idle');
  }, [reviewYear, reviewMonth, monthlyReviews]);

  // Helper to get current week number
  const getWeekNumber = (d: Date) => {
    const date = new Date(d.getTime());
    date.setHours(0, 0, 0, 0);
    date.setDate(date.getDate() + 3 - (date.getDay() + 6) % 7);
    const week1 = new Date(date.getFullYear(), 0, 4);
    return 1 + Math.round(((date.getTime() - week1.getTime()) / 86400000 - 3 + (week1.getDay() + 6) % 7) / 7);
  };

  const getWeekDateRange = (yr: number, wkNum: number) => {
    const jan1 = new Date(yr, 0, 1);
    const jan1Day = jan1.getDay();
    const startOfWeek1 = new Date(jan1.getTime() - jan1Day * 24 * 60 * 60 * 1000);
    
    const startOfWeek = new Date(startOfWeek1.getTime() + (wkNum - 1) * 7 * 24 * 60 * 60 * 1000);
    const endOfWeek = new Date(startOfWeek.getTime() + 6 * 24 * 60 * 60 * 1000);
    
    const formatDate = (d: Date) => {
      const dy = String(d.getDate()).padStart(2, '0');
      const mn = String(d.getMonth() + 1).padStart(2, '0');
      return `${dy}/${mn}`;
    };
    
    const formatDateIso = (d: Date) => {
      const y = d.getFullYear();
      const m = String(d.getMonth() + 1).padStart(2, '0');
      const day = String(d.getDate()).padStart(2, '0');
      return `${y}-${m}-${day}`;
    };

    return {
      formatted: `${formatDate(startOfWeek)} a ${formatDate(endOfWeek)}`,
      startIso: formatDateIso(startOfWeek),
      endIso: formatDateIso(endOfWeek)
    };
  };

  const getTodayDateStr = () => {
    const d = new Date();
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
  };

  // --- Weekly Review (Review Semanal) States ---
  const [isWeeklyReviewOpen, setIsWeeklyReviewOpen] = useState(false);
  const [reviewWeekYear, setReviewWeekYear] = useState(new Date().getFullYear());
  const [reviewWeekNumber, setReviewWeekNumber] = useState(() => getWeekNumber(new Date()));
  
  const [weekReviewOneSentence, setWeekReviewOneSentence] = useState('');
  const [weekReviewMemorableMoments, setWeekReviewMemorableMoments] = useState<string[]>([]);
  const [weekReviewLearnings, setWeekReviewLearnings] = useState<string[]>([]);
  const [weekReviewImprovements, setWeekReviewImprovements] = useState<string[]>([]);
  
  const [newWeekMemorableItem, setNewWeekMemorableItem] = useState('');
  const [newWeekLearningItem, setNewWeekLearningItem] = useState('');
  const [newWeekImprovementItem, setNewWeekImprovementItem] = useState('');
  const [weekReviewSavingStatus, setWeekReviewSavingStatus] = useState<'idle' | 'saving' | 'saved'>('idle');

  // Sync Weekly Review data when year or week changes
  useEffect(() => {
    const existing = weeklyReviews.find(r => r.year === reviewWeekYear && r.weekNumber === reviewWeekNumber);
    if (existing) {
      setWeekReviewOneSentence(existing.oneSentence || '');
      setWeekReviewMemorableMoments(existing.memorableMoments || []);
      setWeekReviewLearnings(existing.learnings || []);
      setWeekReviewImprovements(existing.improvements || []);
    } else {
      setWeekReviewOneSentence('');
      setWeekReviewMemorableMoments([]);
      setWeekReviewLearnings([]);
      setWeekReviewImprovements([]);
    }
    setWeekReviewSavingStatus('idle');
  }, [reviewWeekYear, reviewWeekNumber, weeklyReviews]);

  const handleOpenWeeklyReview = () => {
    setReviewWeekYear(new Date().getFullYear());
    setReviewWeekNumber(getWeekNumber(new Date()));
    setIsWeeklyReviewOpen(true);
  };

  const handleSaveWeeklyReview = () => {
    setWeekReviewSavingStatus('saving');
    
    const newReview: WeeklyReview = {
      id: `wr-${reviewWeekYear}-${reviewWeekNumber}`,
      year: reviewWeekYear,
      weekNumber: reviewWeekNumber,
      oneSentence: weekReviewOneSentence,
      memorableMoments: weekReviewMemorableMoments,
      learnings: weekReviewLearnings,
      improvements: weekReviewImprovements
    };
    
    setWeeklyReviews(prev => {
      const idx = prev.findIndex(r => r.year === reviewWeekYear && r.weekNumber === reviewWeekNumber);
      if (idx !== -1) {
        const copy = [...prev];
        copy[idx] = newReview;
        return copy;
      } else {
        return [...prev, newReview];
      }
    });

    // Save as Agenda note (CalendarNote)
    const reviewDate = getTodayDateStr();
    const noteId = `cn-wr-${reviewWeekYear}-${reviewWeekNumber}`;
    const formattedContent = `Review Semanal - Semana ${reviewWeekNumber} (${reviewWeekYear})
  
Uma frase: ${weekReviewOneSentence}

Momentos Memoráveis:
${weekReviewMemorableMoments.map(m => `- ${m}`).join('\n')}

Aprendizados:
${weekReviewLearnings.map(l => `- ${l}`).join('\n')}

Melhorias para a próxima semana:
${weekReviewImprovements.map(i => `- ${i}`).join('\n')}`;

    if (setNotes) {
      setNotes(prev => {
        const idx = prev.findIndex(n => n.id === noteId);
        if (idx !== -1) {
          const copy = [...prev];
          copy[idx] = { ...copy[idx], content: formattedContent, title: `📝 Review Semanal - Semana ${reviewWeekNumber}`, date: reviewDate };
          return copy;
        } else {
          const newCalendarNote: CalendarNote = {
            id: noteId,
            date: reviewDate,
            title: `📝 Review Semanal - Semana ${reviewWeekNumber}`,
            content: formattedContent,
            isDailyRecord: false
          };
          return [newCalendarNote, ...prev];
        }
      });
    }

    // Award XP
    const xpKey = `xp_awarded_wr_${reviewWeekYear}_${reviewWeekNumber}`;
    const alreadyAwarded = localStorage.getItem(xpKey) === 'true';
    if (!alreadyAwarded) {
      addXp(30);
      localStorage.setItem(xpKey, 'true');
    }
    
    setTimeout(() => {
      setWeekReviewSavingStatus('saved');
      setTimeout(() => setWeekReviewSavingStatus('idle'), 2000);
    }, 600);
  };

  const handleOpenReview = () => {
    setReviewYear(new Date().getFullYear());
    setReviewMonth(new Date().getMonth());
    setIsReviewOpen(true);
  };

  const handleSaveReview = () => {
    setReviewSavingStatus('saving');
    
    const newReview: MonthlyReview = {
      id: `mr-${reviewYear}-${reviewMonth}`,
      year: reviewYear,
      month: reviewMonth,
      oneSentence: reviewOneSentence,
      memorableMoments: reviewMemorableMoments,
      learnings: reviewLearnings,
      improvements: reviewImprovements
    };
    
    setMonthlyReviews(prev => {
      const idx = prev.findIndex(r => r.year === reviewYear && r.month === reviewMonth);
      if (idx !== -1) {
        const copy = [...prev];
        copy[idx] = newReview;
        return copy;
      } else {
        return [...prev, newReview];
      }
    });
    
    // Award XP if not already awarded for this month
    const xpKey = `xp_awarded_mr_${reviewYear}_${reviewMonth}`;
    const alreadyAwarded = localStorage.getItem(xpKey) === 'true';
    if (!alreadyAwarded) {
      addXp(50);
      localStorage.setItem(xpKey, 'true');
    }
    
    setTimeout(() => {
      setReviewSavingStatus('saved');
      setTimeout(() => setReviewSavingStatus('idle'), 2000);
    }, 600);
  };

  // Filter items for the selected day
  const filteredRoutine = routine
    .filter(item => item.dayOfWeek === selectedDay || item.isEveryDay)
    .sort((a, b) => a.time.localeCompare(b.time));

  const handleAddTask = (e: React.FormEvent) => {
    e.preventDefault();
    if (!taskText.trim()) return;

    const newItem: RoutineItem = {
      id: Math.random().toString(36).substring(2, 9),
      dayOfWeek: isEveryDay ? -1 : selectedDay,
      time,
      task: taskText.trim(),
      completed: false,
      isEveryDay,
      completedDays: []
    };

    setRoutine([...routine, newItem]);
    setTaskText('');
    setIsEveryDay(false);
    setIsAdding(false);

    // Reward XP
    addXp(15);
  };

  const handleToggleCompleted = (id: string) => {
    setRoutine(prev => prev.map(item => {
      if (item.id === id) {
        if (item.isEveryDay) {
          const completedDays = item.completedDays || [];
          const isCurrentlyCompleted = completedDays.includes(selectedDay);
          const nextCompletedDays = isCurrentlyCompleted
            ? completedDays.filter(d => d !== selectedDay)
            : [...completedDays, selectedDay];
          
          addXp(!isCurrentlyCompleted ? 10 : -10);
          return { ...item, completedDays: nextCompletedDays };
        } else {
          const nextState = !item.completed;
          addXp(nextState ? 10 : -10);
          return { ...item, completed: nextState };
        }
      }
      return item;
    }));
  };

  const handleStartEditTask = (item: RoutineItem) => {
    setEditingItem(item);
    setEditTime(item.time || '08:00');
    setEditTaskText(item.task || '');
    setEditIsEveryDay(!!item.isEveryDay);
    setEditSelectedDay(item.dayOfWeek >= 0 ? item.dayOfWeek : selectedDay);
  };

  const handleSaveEditTask = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingItem || !editTaskText.trim()) return;

    setRoutine(prev => prev.map(item => {
      if (item.id === editingItem.id) {
        return {
          ...item,
          time: editTime,
          task: editTaskText.trim(),
          isEveryDay: editIsEveryDay,
          dayOfWeek: editIsEveryDay ? -1 : editSelectedDay
        };
      }
      return item;
    }));

    setEditingItem(null);
  };

  const handleDeleteItem = (id: string, completed: boolean) => {
    if (completed) {
      addXp(-10);
    }
    setRoutine(routine.filter(item => item.id !== id));
  };

  return (
    <div id="routine-view" className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-white tracking-tight flex items-center gap-2">
            <Clock className="h-6 w-6 text-orange-500" />
            Rotina <span className="text-orange-500 uppercase">Semanal</span>
          </h1>
          <p className="text-gray-400 text-xs mt-1">
            Planejamento de hábitos recorrentes e horários fixos
          </p>
        </div>

        <div className="flex items-center gap-2.5 self-start md:self-auto flex-wrap">
          {/* View Toggle */}
          <div className="flex items-center bg-zinc-950 p-1 rounded-xl">
            <button
              onClick={() => setViewMode('lista')}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wider transition-all flex items-center gap-1.5 ${
                viewMode === 'lista'
                  ? 'bg-orange-500 text-white shadow-[0_4px_10px_rgba(249,115,22,0.25)]'
                  : 'text-zinc-500 hover:text-zinc-350'
              }`}
            >
              <List className="h-3.5 w-3.5" />
              Lista
            </button>
            <button
              onClick={() => setViewMode('quadro')}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wider transition-all flex items-center gap-1.5 ${
                viewMode === 'quadro'
                  ? 'bg-orange-500 text-white shadow-[0_4px_10px_rgba(249,115,22,0.25)]'
                  : 'text-zinc-500 hover:text-zinc-300'
              }`}
            >
              <LayoutGrid className="h-3.5 w-3.5" />
              Quadro
            </button>
          </div>

          <button
            onClick={handleOpenReview}
            className="flex items-center gap-1.5 px-3 py-2 bg-zinc-900 hover:bg-zinc-850 text-xs text-orange-500 hover:text-orange-400 font-bold rounded-lg border border-orange-500/20 hover:border-orange-500/40 transition-colors shadow-[0_0_10px_rgba(249,115,22,0.05)] h-[38px]"
          >
            <Compass className="h-3.5 w-3.5 text-orange-500 animate-pulse" />
            Review Mensal
          </button>

          <button
            onClick={handleOpenWeeklyReview}
            className="flex items-center gap-1.5 px-3 py-2 bg-zinc-900 hover:bg-zinc-850 text-xs text-orange-500 hover:text-orange-400 font-bold rounded-lg border border-orange-500/20 hover:border-orange-500/40 transition-colors shadow-[0_0_10px_rgba(249,115,22,0.05)] h-[38px]"
          >
            <CalendarDays className="h-3.5 w-3.5 text-orange-500 animate-pulse" />
            Review Semanal
          </button>

          <button
            onClick={() => setIsAdding(!isAdding)}
            className="bg-orange-500 hover:bg-orange-600 text-white font-bold text-xs px-4 py-2 rounded-lg flex items-center gap-1.5 shadow-[0_4px_12px_rgba(249,115,22,0.3)] transition-colors h-[38px]"
          >
            {isAdding ? 'Fechar' : 'Adicionar Atividade'}
          </button>

          <button
            type="button"
            onClick={() => setShowClearModal(true)}
            className="text-xs font-semibold text-red-400 bg-red-400/5 hover:bg-red-400/10 border border-red-500/10 px-3 py-2 rounded-lg transition-all flex items-center gap-1.5 h-[38px]"
          >
            <Trash2 className="h-3.5 w-3.5" /> Limpar
          </button>
        </div>
      </div>

      {/* Add New Routine Item Form (REPOSITIONED OUTSIDE so it works for both Board and List mode!) */}
      <AnimatePresence>
        {isAdding && (
          <motion.form
            onSubmit={handleAddTask}
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="bg-zinc-900 border border-orange-500/30 rounded-xl p-5 space-y-4 text-left"
          >
            <div className="flex items-center justify-between border-b border-zinc-800 pb-2">
              <h3 className="text-xs font-bold text-white uppercase tracking-wider">
                {isEveryDay ? 'Nova Atividade para Todos os Dias' : `Nova Atividade para ${daysOfWeek.find(d => d.id === selectedDay)?.fullName}`}
              </h3>
              <span className="text-[10px] text-orange-500 font-mono font-bold bg-orange-500/10 px-2 py-0.5 rounded">
                Ganha +15 XP ao criar
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
              <div className="md:col-span-1">
                <label className="text-[10px] text-gray-400 font-bold block mb-1 uppercase">Horário</label>
                <input
                  type="time"
                  required
                  value={time}
                  onChange={(e) => setTime(e.target.value)}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-orange-500/50 font-mono"
                />
              </div>

              <div className="md:col-span-3">
                <label className="text-[10px] text-gray-400 font-bold block mb-1 uppercase">Descrição da Atividade</label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Meditação, Leitura de livros, Estudar inglês..."
                  value={taskText}
                  onChange={(e) => setTaskText(e.target.value)}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-orange-500/50"
                  maxLength={60}
                />
              </div>
            </div>

            {/* Repetition Options Selector (IMPROVED DESIGN / CHECHBOX UPGRADE) */}
            <div className="space-y-2 pt-2 border-t border-zinc-850">
              <label className="text-[10px] text-gray-400 font-bold block uppercase tracking-wider">Repetição / Frequência</label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {/* Option 1: Repeat on this weekday */}
                <button
                  type="button"
                  onClick={() => setIsEveryDay(false)}
                  className={`p-3 rounded-xl border text-left transition-all ${
                    !isEveryDay 
                      ? 'bg-orange-500/10 border-orange-500/40 text-white shadow-[0_4px_12px_rgba(249,115,22,0.1)]' 
                      : 'bg-zinc-950/40 border-zinc-900 text-zinc-400 hover:border-zinc-850 hover:text-zinc-300'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <div className={`h-4.5 w-4.5 rounded-full border flex items-center justify-center shrink-0 transition-colors ${
                      !isEveryDay ? 'border-orange-500 bg-orange-500' : 'border-zinc-700 bg-transparent'
                    }`}>
                      {!isEveryDay && <Check className="h-3 w-3 text-white stroke-[3.5]" />}
                    </div>
                    <div>
                      <span className="text-xs font-bold block">Repetir neste dia toda semana</span>
                      <span className="text-[9px] text-zinc-500 block mt-0.5">
                        Toda {daysOfWeek.find(d => d.id === selectedDay)?.fullName}
                      </span>
                    </div>
                  </div>
                </button>

                {/* Option 2: Repeat every day */}
                <button
                  type="button"
                  onClick={() => setIsEveryDay(true)}
                  className={`p-3 rounded-xl border text-left transition-all ${
                    isEveryDay 
                      ? 'bg-orange-500/10 border-orange-500/40 text-white shadow-[0_4px_12px_rgba(249,115,22,0.1)]' 
                      : 'bg-zinc-950/40 border-zinc-900 text-zinc-400 hover:border-zinc-850 hover:text-zinc-300'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <div className={`h-4.5 w-4.5 rounded-full border flex items-center justify-center shrink-0 transition-colors ${
                      isEveryDay ? 'border-orange-500 bg-orange-500' : 'border-zinc-700 bg-transparent'
                    }`}>
                      {isEveryDay && <Check className="h-3 w-3 text-white stroke-[3.5]" />}
                    </div>
                    <div>
                      <span className="text-xs font-bold block">Todos os dias</span>
                      <span className="text-[9px] text-zinc-500 block mt-0.5">
                        Repetir diariamente de Domingo a Sábado
                      </span>
                    </div>
                  </div>
                </button>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-zinc-800">
              <button
                type="button"
                onClick={() => setIsAdding(false)}
                className="text-xs text-gray-400 hover:text-white px-3 py-1.5 transition-colors"
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="bg-orange-500 hover:bg-orange-600 text-white font-bold text-xs px-5 py-1.5 rounded-lg transition-colors"
              >
                Adicionar Atividade
              </button>
            </div>
          </motion.form>
        )}
      </AnimatePresence>

      {viewMode === 'lista' ? (
        <>
        {/* Week Day Switcher Buttons (Sunday starts the week) */}
        <div className="grid grid-cols-7 gap-1 bg-zinc-950 p-1.5 rounded-xl border border-zinc-900">
          {daysOfWeek.map((day) => {
            const isActive = selectedDay === day.id;
            const count = routine.filter(item => item.dayOfWeek === day.id || item.isEveryDay).length;
            
            return (
              <button
                key={day.id}
                onClick={() => setSelectedDay(day.id)}
                className={`py-3 px-1 rounded-lg text-xs font-bold text-center transition-all relative ${
                  isActive
                    ? 'bg-orange-500 text-white shadow-[0_4px_10px_rgba(249,115,22,0.25)]'
                    : 'text-gray-500 hover:text-gray-300 hover:bg-zinc-900/50'
                }`}
              >
                <span className="block font-sans">{day.name}</span>
                {count > 0 && (
                  <span className={`inline-block mt-1 text-[9px] px-1 rounded-full ${isActive ? 'bg-white text-orange-600' : 'bg-zinc-800 text-gray-400'} font-mono`}>
                    {count}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Routine list for selected day */}
        <div className="space-y-4">
          <h2 className="text-xs font-bold text-gray-400 uppercase tracking-widest text-left">
            {daysOfWeek.find(d => d.id === selectedDay)?.fullName} • Agenda do Dia
          </h2>

          <div className="space-y-2">
            {filteredRoutine.length === 0 ? (
              <div className="text-center py-12 bg-zinc-900/10 rounded-xl border border-zinc-900">
                <CalendarDays className="h-8 w-8 text-zinc-700 mx-auto mb-2" />
                <p className="text-xs text-gray-500">Nenhuma atividade planejada para este dia.</p>
                <button
                  onClick={() => setIsAdding(true)}
                  className="text-xs font-bold text-orange-500 hover:underline mt-2 inline-block"
                >
                  Planejar primeira atividade
                </button>
              </div>
            ) : (
              filteredRoutine.map((item) => {
                const isItemCompleted = item.isEveryDay 
                  ? (item.completedDays || []).includes(selectedDay)
                  : item.completed;
                return (
                  <motion.div
                    key={item.id}
                    className={`p-4 rounded-xl border flex items-center justify-between gap-4 transition-all group ${
                      isItemCompleted
                        ? 'bg-orange-500/5 border-orange-500/20 text-gray-500'
                        : 'bg-zinc-900/30 border-zinc-800 text-gray-200'
                    }`}
                    layout
                  >
                    <div className="flex items-center gap-4 flex-1 min-w-0">
                      <span className="font-mono text-xs text-orange-500 font-bold bg-orange-500/10 px-2 py-0.5 rounded flex-shrink-0">
                        {item.time}
                      </span>
                      
                      <span className={`text-xs font-medium truncate text-left ${isItemCompleted ? 'line-through text-gray-500' : 'text-white'}`}>
                        {item.task}
                      </span>

                      {item.isEveryDay && (
                        <span className="text-[9px] bg-orange-500/10 text-orange-400 border border-orange-500/20 px-1.5 py-0.5 rounded font-mono uppercase tracking-wide inline-flex items-center gap-0.5 flex-shrink-0">
                          Todos os dias
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-3">
                      <button
                        onClick={() => handleToggleCompleted(item.id)}
                        className={`text-xs font-bold font-mono px-3 py-1 rounded-lg border transition-all ${
                          isItemCompleted
                            ? 'bg-orange-500 text-white border-orange-500'
                            : 'border-zinc-700 text-gray-400 hover:border-orange-500 hover:text-white'
                        }`}
                      >
                        {isItemCompleted ? 'Feito! (+10 XP)' : 'Completar'}
                      </button>

                      <button
                        onClick={() => handleStartEditTask(item)}
                        className="text-zinc-650 hover:text-orange-400 transition-colors p-1 opacity-0 group-hover:opacity-100 focus:opacity-100"
                        title="Editar Atividade"
                      >
                        <Pencil className="h-3.5 w-3.5" />
                      </button>

                      <button
                        onClick={() => handleDeleteItem(item.id, isItemCompleted)}
                        className="text-zinc-650 hover:text-red-500 transition-colors p-1 opacity-0 group-hover:opacity-100 focus:opacity-100"
                        title="Remover"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </motion.div>
                );
              })
            )}
          </div>
        </div>
        </>
      ) : (
        <div className="space-y-6">
          {/* Weekly Board (7 Columns) */}
          <div className="overflow-x-auto pb-4 scrollbar-none">
            <div className="flex gap-4 min-w-[1200px]">
              {daysOfWeek.map((day) => {
                const dayTasks = routine
                  .filter(item => item.dayOfWeek === day.id || item.isEveryDay)
                  .sort((a, b) => a.time.localeCompare(b.time));

                return (
                  <div key={day.id} className="flex-1 min-w-[160px] bg-zinc-950/40 border border-zinc-900 rounded-2xl p-4 flex flex-col space-y-3.5 hover:border-zinc-800/80 transition-colors">
                    {/* Column Header */}
                    <div className="flex items-center justify-between border-b border-zinc-900 pb-2">
                      <span className="text-xs font-black text-white uppercase tracking-wider flex items-center gap-1.5">
                        <span className="h-1.5 w-1.5 rounded-full bg-orange-500" />
                        {day.fullName}
                      </span>
                      <span className="text-[10px] font-mono bg-zinc-900 text-gray-500 px-1.5 py-0.5 rounded font-bold">
                        {dayTasks.length}
                      </span>
                    </div>

                    {/* Task Stack */}
                    <div className="flex-1 space-y-2 max-h-[450px] overflow-y-auto pr-1 scrollbar-none">
                      {dayTasks.length === 0 ? (
                        <div className="text-center py-8 text-gray-650 border border-dashed border-zinc-900 rounded-xl flex flex-col items-center justify-center p-2">
                          <span className="text-[10px] uppercase font-bold text-zinc-600">Sem Tarefas</span>
                        </div>
                      ) : (
                        dayTasks.map((item) => {
                          const isItemCompleted = item.isEveryDay 
                            ? (item.completedDays || []).includes(day.id)
                            : item.completed;

                          return (
                            <div 
                              key={`${item.id}-${day.id}`} 
                              className={`p-2.5 rounded-xl border text-left flex flex-col justify-between gap-2.5 group relative transition-all ${
                                isItemCompleted 
                                  ? 'bg-orange-500/[0.02] border-orange-500/10 text-gray-500' 
                                  : 'bg-zinc-900/30 border-zinc-900 text-gray-200 hover:border-zinc-800'
                              }`}
                            >
                              <div className="flex items-center justify-between gap-1">
                                <span className="font-mono text-[9px] text-orange-500 font-bold bg-orange-500/5 px-1 py-0.5 rounded">
                                  {item.time}
                                </span>
                                {item.isEveryDay && (
                                  <span className="text-[7px] font-bold text-gray-500 uppercase tracking-widest">Diário</span>
                                )}
                              </div>

                              <p className={`text-[10.5px] leading-snug font-medium break-words ${isItemCompleted ? 'line-through text-gray-500' : 'text-zinc-300'}`}>
                                {item.task}
                              </p>

                              {/* Action Bar inside card */}
                              <div className="flex items-center justify-between border-t border-zinc-900/60 pt-2 mt-0.5">
                                <button
                                  onClick={() => {
                                    // Switch active selectedDay to execute toggle completed correctly
                                    setSelectedDay(day.id);
                                    handleToggleCompleted(item.id);
                                  }}
                                  className={`p-1 rounded-lg border transition-all ${
                                    isItemCompleted 
                                      ? 'bg-orange-500 border-orange-500 text-white' 
                                      : 'border-zinc-800 hover:border-orange-500 text-zinc-500 hover:text-white'
                                  }`}
                                  title={isItemCompleted ? 'Desmarcar' : 'Completar tarefa (+10 XP)'}
                                >
                                  <Check className="h-3 w-3 stroke-[3]" />
                                </button>

                                <div className="flex items-center gap-1">
                                  <button
                                    onClick={() => handleStartEditTask(item)}
                                    className="text-zinc-650 hover:text-orange-400 p-1 transition-colors opacity-60 hover:opacity-100"
                                    title="Editar Atividade"
                                  >
                                    <Pencil className="h-3.5 w-3.5" />
                                  </button>

                                  <button
                                    onClick={() => handleDeleteItem(item.id, isItemCompleted)}
                                    className="text-zinc-650 hover:text-red-400 p-1 transition-colors opacity-60 hover:opacity-100"
                                    title="Excluir"
                                  >
                                    <Trash2 className="h-3.5 w-3.5" />
                                  </button>
                                </div>
                              </div>
                            </div>
                          );
                        })
                      )}
                    </div>

                    {/* Quick Add for this specific day (Opens form smoothly and configures selectedDay!) */}
                    <button
                      onClick={() => {
                        setSelectedDay(day.id);
                        setIsAdding(true);
                        // scroll up smoothly to add activity input
                        const el = document.getElementById('routine-view');
                        if (el) el.scrollIntoView({ behavior: 'smooth' });
                      }}
                      className="w-full py-1.5 bg-zinc-950/80 border border-zinc-900 hover:bg-zinc-900/40 text-gray-500 hover:text-zinc-300 rounded-xl text-[9px] font-bold uppercase tracking-wider transition-all flex items-center justify-center gap-1"
                    >
                      <Plus className="h-3 w-3" /> Adicionar
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Weekly Review Modal Overlay */}
      <AnimatePresence>
        {isWeeklyReviewOpen && (
          <div className="fixed inset-0 z-50 bg-[#040405]/95 backdrop-blur-md flex items-center justify-center p-4 md:p-6 overflow-hidden">
            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 20 }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              className="bg-[#0a0a0c] border border-zinc-800 rounded-3xl w-full max-w-6xl h-full max-h-[85vh] flex flex-col overflow-hidden shadow-2xl shadow-orange-500/5 text-left"
            >
              
              {/* Modal Header */}
              <div className="flex justify-between items-center px-6 py-4 border-b border-zinc-850 bg-[#0e0e11]/80 backdrop-blur-sm">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-orange-500/10 rounded-xl border border-orange-500/20 text-orange-500">
                    <CalendarDays className="h-5 w-5 animate-pulse" />
                  </div>
                  <div className="text-left">
                    <h2 className="text-sm md:text-base font-black text-white tracking-tight">Reflexão Semanal</h2>
                    <p className="text-zinc-500 text-[10px] hidden md:block">Avalie sua semana, consolide aprendizados e planeje melhorias.</p>
                  </div>
                </div>

                {/* Week Picker / Switcher */}
                <div className="flex items-center bg-zinc-950/80 px-2.5 py-1 rounded-xl border border-zinc-900 text-[11px] text-gray-400 font-bold gap-2">
                  <button 
                    type="button"
                    onClick={() => {
                      if (reviewWeekNumber === 1) {
                        setReviewWeekNumber(52);
                        setReviewWeekYear(prev => prev - 1);
                      } else {
                        setReviewWeekNumber(prev => prev - 1);
                      }
                    }} 
                    className="hover:text-orange-500 transition-colors p-0.5"
                  >
                    <ChevronLeft className="h-3.5 w-3.5" />
                  </button>
                  <span className="font-mono text-white tracking-wide min-w-[140px] text-center text-xs">
                    Semana {reviewWeekNumber} ({getWeekDateRange(reviewWeekYear, reviewWeekNumber).formatted}) de {reviewWeekYear}
                  </span>
                  <button 
                    type="button"
                    onClick={() => {
                      if (reviewWeekNumber === 52) {
                        setReviewWeekNumber(1);
                        setReviewWeekYear(prev => prev + 1);
                      } else {
                        setReviewWeekNumber(prev => prev + 1);
                      }
                    }} 
                    className="hover:text-orange-500 transition-colors p-0.5"
                  >
                    <ChevronRight className="h-3.5 w-3.5" />
                  </button>
                </div>

                <button
                  type="button"
                  onClick={() => setIsWeeklyReviewOpen(false)}
                  className="p-1.5 bg-zinc-900 hover:bg-zinc-800 text-zinc-400 hover:text-white rounded-xl border border-zinc-800 transition-colors"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              {/* Modal Body (Dual Column Scrollable) */}
              <div className="flex-1 overflow-y-auto p-4 md:p-6 grid grid-cols-1 lg:grid-cols-12 gap-6 scrollbar-thin">
                
                {/* Left Form: Reflection Fields */}
                <div className="lg:col-span-7 space-y-5 text-left">
                  
                  {/* One sentence summary */}
                  <div className="space-y-2 bg-[#0d0d10]/40 border border-zinc-900 rounded-2xl p-4">
                    <label className="text-xs font-bold text-gray-400 uppercase tracking-wider flex items-center gap-1.5">
                      <BookOpen className="h-4 w-4 text-orange-500" />
                      Como você resume esta semana em uma frase?
                    </label>
                    <p className="text-[10px] text-zinc-500">Defina o sentimento principal ou a grande realização desta semana.</p>
                    <textarea
                      value={weekReviewOneSentence}
                      onChange={(e) => setWeekReviewOneSentence(e.target.value)}
                      placeholder="Ex: Uma semana produtiva, de muito foco técnico e avanço nas metas de condicionamento físico..."
                      className="w-full min-h-[60px] bg-zinc-950/60 border border-zinc-850 rounded-xl p-3 text-xs text-white focus:outline-none focus:border-orange-500/50 resize-none font-sans leading-relaxed"
                    />
                  </div>

                  {/* Memoráveis */}
                  <div className="space-y-3 bg-[#0d0d10]/40 border border-zinc-900 rounded-2xl p-4">
                    <label className="text-xs font-bold text-gray-400 uppercase tracking-wider flex items-center gap-1.5">
                      <Sparkles className="h-4 w-4 text-orange-500" />
                      Vitórias ou Momentos Memoráveis da Semana:
                    </label>
                    <p className="text-[10px] text-zinc-500">Conquistas, momentos de foco inabalável ou dias de alto desempenho.</p>
                    
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={newWeekMemorableItem}
                        onChange={(e) => setNewWeekMemorableItem(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            if (newWeekMemorableItem.trim()) {
                              setWeekReviewMemorableMoments(prev => [...prev, newWeekMemorableItem.trim()]);
                              setNewWeekMemorableItem('');
                            }
                          }
                        }}
                        placeholder="Ex: Completei 5 treinos de cardio; Terminei de ler mais um livro..."
                        className="flex-1 bg-zinc-950/60 border border-zinc-850 rounded-xl px-3 py-2 text-xs text-white placeholder-zinc-600 focus:outline-none focus:border-orange-500/50"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          if (newWeekMemorableItem.trim()) {
                            setWeekReviewMemorableMoments(prev => [...prev, newWeekMemorableItem.trim()]);
                            setNewWeekMemorableItem('');
                          }
                        }}
                        className="bg-zinc-900 hover:bg-zinc-800 text-orange-500 border border-zinc-800 text-xs px-4 rounded-xl transition-colors font-bold"
                      >
                        +
                      </button>
                    </div>

                    <div className="space-y-2 mt-2">
                      {weekReviewMemorableMoments.length === 0 ? (
                        <p className="text-[10px] text-zinc-600 italic">Nenhum item adicionado ainda.</p>
                      ) : (
                        weekReviewMemorableMoments.map((item, idx) => (
                          <div key={idx} className="flex justify-between items-center bg-zinc-950/50 px-3 py-1.5 rounded-lg border border-zinc-900 text-xs text-white">
                            <span>{item}</span>
                            <button
                              type="button"
                              onClick={() => setWeekReviewMemorableMoments(prev => prev.filter((_, i) => i !== idx))}
                              className="text-red-500 hover:text-red-400 font-bold px-1"
                            >
                              remover
                            </button>
                          </div>
                        ))
                      )}
                    </div>
                  </div>

                  {/* Aprendizados */}
                  <div className="space-y-3 bg-[#0d0d10]/40 border border-zinc-900 rounded-2xl p-4">
                    <label className="text-xs font-bold text-gray-400 uppercase tracking-wider flex items-center gap-1.5">
                      <BookOpen className="h-4 w-4 text-orange-500" />
                      O que aprendi nesta semana?
                    </label>
                    <p className="text-[10px] text-zinc-500">Lições aprendidas, insights sobre rotina, ou novas teorias assimiladas.</p>
                    
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={newWeekLearningItem}
                        onChange={(e) => setNewWeekLearningItem(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            if (newWeekLearningItem.trim()) {
                              setWeekReviewLearnings(prev => [...prev, newWeekLearningItem.trim()]);
                              setNewWeekLearningItem('');
                            }
                          }
                        }}
                        placeholder="Ex: Acordar cedo sem olhar o celular melhora o rendimento matinal em 100%..."
                        className="flex-1 bg-zinc-950/60 border border-zinc-850 rounded-xl px-3 py-2 text-xs text-white placeholder-zinc-600 focus:outline-none focus:border-orange-500/50"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          if (newWeekLearningItem.trim()) {
                            setWeekReviewLearnings(prev => [...prev, newWeekLearningItem.trim()]);
                            setNewWeekLearningItem('');
                          }
                        }}
                        className="bg-zinc-900 hover:bg-zinc-800 text-orange-500 border border-zinc-800 text-xs px-4 rounded-xl transition-colors font-bold"
                      >
                        +
                      </button>
                    </div>

                    <div className="space-y-2 mt-2">
                      {weekReviewLearnings.length === 0 ? (
                        <p className="text-[10px] text-zinc-600 italic">Nenhum item adicionado ainda.</p>
                      ) : (
                        weekReviewLearnings.map((item, idx) => (
                          <div key={idx} className="flex justify-between items-center bg-zinc-950/50 px-3 py-1.5 rounded-lg border border-zinc-900 text-xs text-white">
                            <span>{item}</span>
                            <button
                              type="button"
                              onClick={() => setWeekReviewLearnings(prev => prev.filter((_, i) => i !== idx))}
                              className="text-red-500 hover:text-red-400 font-bold px-1"
                            >
                              remover
                            </button>
                          </div>
                        ))
                      )}
                    </div>
                  </div>

                  {/* Melhorias */}
                  <div className="space-y-3 bg-[#0d0d10]/40 border border-zinc-900 rounded-2xl p-4">
                    <label className="text-xs font-bold text-gray-400 uppercase tracking-wider flex items-center gap-1.5">
                      <AlertCircle className="h-4 w-4 text-orange-500" />
                      O que posso fazer de melhor ou diferente na próxima semana?
                    </label>
                    <p className="text-[10px] text-zinc-500">Pontos de melhoria, correção de rumo e eliminação de maus hábitos.</p>
                    
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={newWeekImprovementItem}
                        onChange={(e) => setNewWeekImprovementItem(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            if (newWeekImprovementItem.trim()) {
                              setWeekReviewImprovements(prev => [...prev, newWeekImprovementItem.trim()]);
                              setNewWeekImprovementItem('');
                            }
                          }
                        }}
                        placeholder="Ex: Beber mais água no meio da tarde; Bloquear redes sociais a partir das 21h..."
                        className="flex-1 bg-zinc-950/60 border border-zinc-850 rounded-xl px-3 py-2 text-xs text-white placeholder-zinc-600 focus:outline-none focus:border-orange-500/50"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          if (newWeekImprovementItem.trim()) {
                            setWeekReviewImprovements(prev => [...prev, newWeekImprovementItem.trim()]);
                            setNewWeekImprovementItem('');
                          }
                        }}
                        className="bg-zinc-900 hover:bg-zinc-800 text-orange-500 border border-zinc-800 text-xs px-4 rounded-xl transition-colors font-bold"
                      >
                        +
                      </button>
                    </div>

                    <div className="space-y-2 mt-2">
                      {weekReviewImprovements.length === 0 ? (
                        <p className="text-[10px] text-zinc-600 italic">Nenhum item adicionado ainda.</p>
                      ) : (
                        weekReviewImprovements.map((item, idx) => (
                          <div key={idx} className="flex justify-between items-center bg-zinc-950/50 px-3 py-1.5 rounded-lg border border-zinc-900 text-xs text-white">
                            <span>{item}</span>
                            <button
                              type="button"
                              onClick={() => setWeekReviewImprovements(prev => prev.filter((_, i) => i !== idx))}
                              className="text-red-500 hover:text-red-400 font-bold px-1"
                            >
                              remover
                            </button>
                          </div>
                        ))
                      )}
                    </div>
                  </div>

                </div>

                {/* Right Panel: Agenda History / Logs for Selected Week */}
                <div className="lg:col-span-5 space-y-4">
                  <div className="bg-[#0e0e11]/90 border border-zinc-850 rounded-2xl p-5 h-full flex flex-col min-h-[400px]">
                    <div className="border-b border-zinc-800 pb-3 flex justify-between items-center shrink-0">
                      <div>
                        <h3 className="text-xs font-bold text-white uppercase tracking-wider">Histórico da Agenda</h3>
                        <p className="text-[10px] text-zinc-500 mt-0.5">Logs e diários da semana correspondente.</p>
                      </div>
                      <span className="text-[10px] bg-zinc-950 text-orange-500 border border-orange-500/10 px-2.5 py-0.5 rounded-full font-mono font-bold">
                        {(() => {
                          const range = getWeekDateRange(reviewWeekYear, reviewWeekNumber);
                          return notes.filter(n => n.date >= range.startIso && n.date <= range.endIso).length;
                        })()} logs
                      </span>
                    </div>

                    <div className="flex-1 overflow-y-auto pt-4 space-y-4 pr-1 scrollbar-thin">
                      {(() => {
                        const range = getWeekDateRange(reviewWeekYear, reviewWeekNumber);
                        const weekNotes = notes
                          .filter(n => n.date >= range.startIso && n.date <= range.endIso)
                          .sort((a, b) => a.date.localeCompare(b.date));

                        if (weekNotes.length === 0) {
                          return (
                            <div className="text-center py-20">
                              <CalendarDays className="h-8 w-8 text-zinc-700 mx-auto mb-2.5" />
                              <p className="text-xs text-zinc-500">Nenhum diário registrado para este período.</p>
                              <p className="text-[10px] text-zinc-650 max-w-[220px] mx-auto mt-1">
                                Os registros feitos no Calendário / Agenda que caírem entre {range.formatted} aparecerão aqui!
                              </p>
                            </div>
                          );
                        }

                        return weekNotes.map(n => (
                          <div key={n.id} className="bg-zinc-950/40 border border-zinc-900 rounded-xl p-3.5 text-left hover:border-zinc-800 transition-colors">
                            <div className="flex justify-between items-center border-b border-zinc-900 pb-2 mb-2">
                              <span className="text-xs font-bold text-white">{n.title || 'Diário Diário'}</span>
                              <span className="font-mono text-[9px] text-zinc-500 bg-zinc-900 px-2 py-0.5 rounded font-bold">{n.date}</span>
                            </div>
                            
                            {n.content && <p className="text-[11px] text-zinc-400 line-clamp-3 mb-2">{n.content}</p>}
                            
                            {n.journalText && (
                              <div className="mt-1 bg-zinc-950/60 p-2 rounded border border-zinc-900/50">
                                <span className="text-[8px] uppercase tracking-wider font-bold text-orange-500 font-mono">Diário Íntimo</span>
                                <p className="text-[10px] text-zinc-300 mt-0.5 line-clamp-2">{n.journalText}</p>
                              </div>
                            )}

                            {n.gratitudeText && (
                              <div className="mt-1 bg-zinc-950/60 p-2 rounded border border-zinc-900/50">
                                <span className="text-[8px] uppercase tracking-wider font-bold text-emerald-500 font-mono">Gratidão</span>
                                <p className="text-[10px] text-zinc-300 mt-0.5 line-clamp-2">{n.gratitudeText}</p>
                              </div>
                            )}
                          </div>
                        ));
                      })()}
                    </div>
                  </div>
                </div>

              </div>

              {/* Modal Footer */}
              <div className="px-6 py-4 border-t border-zinc-850 bg-[#0e0e11]/80 flex justify-between items-center shrink-0">
                <div className="flex items-center gap-2 text-zinc-500">
                  <Clock className="h-4 w-4 text-zinc-500" />
                  <span className="text-[10px] font-mono">
                    {weekReviewSavingStatus === 'saving' && "Salvando revisão semanal..."}
                    {weekReviewSavingStatus === 'saved' && "Revisão salva com sucesso!"}
                    {weekReviewSavingStatus === 'idle' && "Alterações prontas para salvar"}
                  </span>
                </div>

                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={() => setIsWeeklyReviewOpen(false)}
                    className="px-4 py-2 bg-zinc-900 hover:bg-zinc-850 text-xs font-bold text-gray-400 hover:text-white rounded-xl border border-zinc-800 transition-colors"
                  >
                    Fechar
                  </button>
                  <button
                    type="button"
                    onClick={handleSaveWeeklyReview}
                    disabled={weekReviewSavingStatus === 'saving'}
                    className="bg-orange-500 hover:bg-orange-600 disabled:bg-orange-500/50 text-white font-bold text-xs px-5 py-2 rounded-xl flex items-center gap-1.5 shadow-[0_4px_12px_rgba(249,115,22,0.2)] transition-colors"
                  >
                    <Save className="h-3.5 w-3.5" />
                    {weekReviewSavingStatus === 'saving' ? 'Salvando...' : 'Salvar na Agenda (+30 XP)'}
                  </button>
                </div>
              </div>

            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Monthly Review Modal Overlay */}
      <AnimatePresence>
        {isReviewOpen && (
          <div className="fixed inset-0 z-50 bg-[#040405]/95 backdrop-blur-md flex items-center justify-center p-4 md:p-6 overflow-hidden">
            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 20 }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              className="bg-[#0a0a0c] border border-zinc-800 rounded-3xl w-full max-w-6xl h-full max-h-[85vh] flex flex-col overflow-hidden shadow-2xl shadow-orange-500/5 text-left"
            >
              
              {/* Modal Header */}
              <div className="flex justify-between items-center px-6 py-4 border-b border-zinc-850 bg-[#0e0e11]/80 backdrop-blur-sm">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-orange-500/10 rounded-xl border border-orange-500/20 text-orange-500">
                    <Compass className="h-5 w-5 animate-pulse" />
                  </div>
                  <div className="text-left">
                    <h2 className="text-sm md:text-base font-black text-white tracking-tight">Reflexão Mensal</h2>
                    <p className="text-zinc-500 text-[10px] hidden md:block">Avalie o seu progresso, declare vitórias e alinhe seus objetivos.</p>
                  </div>
                </div>

                {/* Month Picker / Switcher */}
                <div className="flex items-center bg-zinc-950/80 px-2.5 py-1 rounded-xl border border-zinc-900 text-[11px] text-gray-400 font-bold gap-2">
                  <button 
                    type="button"
                    onClick={() => {
                      if (reviewMonth === 0) {
                        setReviewMonth(11);
                        setReviewYear(prev => prev - 1);
                      } else {
                        setReviewMonth(prev => prev - 1);
                      }
                    }} 
                    className="hover:text-orange-500 transition-colors p-0.5"
                  >
                    <ChevronLeft className="h-3.5 w-3.5" />
                  </button>
                  <span className="font-mono text-white tracking-wide min-w-[110px] text-center text-xs">
                    {months[reviewMonth]} de {reviewYear}
                  </span>
                  <button 
                    type="button"
                    onClick={() => {
                      if (reviewMonth === 11) {
                        setReviewMonth(0);
                        setReviewYear(prev => prev + 1);
                      } else {
                        setReviewMonth(prev => prev + 1);
                      }
                    }} 
                    className="hover:text-orange-500 transition-colors p-0.5"
                  >
                    <ChevronRight className="h-3.5 w-3.5" />
                  </button>
                </div>

                <button
                  type="button"
                  onClick={() => setIsReviewOpen(false)}
                  className="p-1.5 bg-zinc-900 hover:bg-zinc-800 text-zinc-400 hover:text-white rounded-xl border border-zinc-800 transition-colors"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              {/* Modal Body (Dual Column Scrollable) */}
              <div className="flex-1 overflow-y-auto p-4 md:p-6 grid grid-cols-1 lg:grid-cols-12 gap-6 scrollbar-thin">
                
                {/* Left Form: Reflection Fields */}
                <div className="lg:col-span-7 space-y-5">
                  
                  {/* One sentence summary */}
                  <div className="space-y-2 bg-[#0d0d10]/40 border border-zinc-900 rounded-2xl p-4">
                    <label className="text-xs font-bold text-gray-400 uppercase tracking-wider flex items-center gap-1.5">
                      <BookOpen className="h-4 w-4 text-orange-500" />
                      Uma frase para descrever esse mês
                    </label>
                    <p className="text-[10px] text-zinc-500">Defina o foco primordial ou o sentimento geral que marcou este ciclo.</p>
                    <textarea
                      value={reviewOneSentence}
                      onChange={(e) => setReviewOneSentence(e.target.value)}
                      placeholder="Ex: Um mês de muito foco profissional, superação física e consolidação de hábitos matinais..."
                      className="w-full min-h-[60px] bg-zinc-950/60 border border-zinc-850 rounded-xl p-3 text-xs text-white focus:outline-none focus:border-orange-500/50 resize-none font-sans leading-relaxed"
                    />
                  </div>

                  {/* Memoráveis */}
                  <div className="space-y-3 bg-[#0d0d10]/40 border border-zinc-900 rounded-2xl p-4">
                    <label className="text-xs font-bold text-gray-400 uppercase tracking-wider flex items-center gap-1.5">
                      <Sparkles className="h-4 w-4 text-orange-500" />
                      Momento memorável:
                    </label>
                    <p className="text-[10px] text-zinc-500">Marcos, vitórias, conquistas ou momentos especiais dignos de nota.</p>
                    
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={newMemorableItem}
                        onChange={(e) => setNewMemorableItem(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            if (newMemorableItem.trim()) {
                              setReviewMemorableMoments(prev => [...prev, newMemorableItem.trim()]);
                              setNewMemorableItem('');
                            }
                          }
                        }}
                        placeholder="Adicione um momento ou vitória marcante..."
                        className="flex-1 bg-zinc-950/60 border border-zinc-850 rounded-xl px-3 py-1.5 text-xs text-white focus:outline-none focus:border-orange-500/50"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          if (newMemorableItem.trim()) {
                            setReviewMemorableMoments(prev => [...prev, newMemorableItem.trim()]);
                            setNewMemorableItem('');
                          }
                        }}
                        className="bg-zinc-900 hover:bg-zinc-800 text-orange-500 border border-zinc-850 rounded-xl px-3 py-1.5 text-xs font-bold transition-colors flex items-center justify-center min-w-[40px]"
                      >
                        <Plus className="h-4 w-4" />
                      </button>
                    </div>
                    
                    <div className="space-y-1.5 max-h-[140px] overflow-y-auto scrollbar-thin pr-1">
                      {reviewMemorableMoments.length === 0 ? (
                        <div className="text-center py-4 border border-dashed border-zinc-900 rounded-xl bg-zinc-950/20">
                          <p className="text-[11px] text-zinc-600">Nenhum momento registrado. Digite e adicione acima!</p>
                        </div>
                      ) : (
                        reviewMemorableMoments.map((item, idx) => (
                          <div key={idx} className="flex items-center justify-between p-2 bg-[#0e0e11]/60 border border-zinc-900 hover:border-zinc-850 rounded-xl group transition-all">
                            <span className="text-xs text-gray-300 font-medium flex items-start gap-2 leading-relaxed text-left">
                              <span className="text-orange-500 font-bold mt-0.5">•</span>
                              {item}
                            </span>
                            <button
                              type="button"
                              onClick={() => setReviewMemorableMoments(prev => prev.filter((_, i) => i !== idx))}
                              className="text-zinc-600 hover:text-red-500 p-1 rounded transition-colors lg:opacity-0 group-hover:opacity-100 shrink-0"
                              title="Remover"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        ))
                      )}
                    </div>
                  </div>

                  {/* Aprendizados */}
                  <div className="space-y-3 bg-[#0d0d10]/40 border border-zinc-900 rounded-2xl p-4">
                    <label className="text-xs font-bold text-gray-400 uppercase tracking-wider flex items-center gap-1.5">
                      <Compass className="h-4 w-4 text-orange-500" />
                      O que aprendi:
                    </label>
                    <p className="text-[10px] text-zinc-500">Lições, erros transformados em sabedoria, ou conhecimentos valiosos adquiridos.</p>
                    
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={newLearningItem}
                        onChange={(e) => setNewLearningItem(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            if (newLearningItem.trim()) {
                              setReviewLearnings(prev => [...prev, newLearningItem.trim()]);
                              setNewLearningItem('');
                            }
                          }
                        }}
                        placeholder="Adicione um aprendizado ou lição..."
                        className="flex-1 bg-zinc-950/60 border border-zinc-850 rounded-xl px-3 py-1.5 text-xs text-white focus:outline-none focus:border-orange-500/50"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          if (newLearningItem.trim()) {
                            setReviewLearnings(prev => [...prev, newLearningItem.trim()]);
                            setNewLearningItem('');
                          }
                        }}
                        className="bg-zinc-900 hover:bg-zinc-800 text-orange-500 border border-zinc-850 rounded-xl px-3 py-1.5 text-xs font-bold transition-colors flex items-center justify-center min-w-[40px]"
                      >
                        <Plus className="h-4 w-4" />
                      </button>
                    </div>
                    
                    <div className="space-y-1.5 max-h-[140px] overflow-y-auto scrollbar-thin pr-1">
                      {reviewLearnings.length === 0 ? (
                        <div className="text-center py-4 border border-dashed border-zinc-900 rounded-xl bg-zinc-950/20">
                          <p className="text-[11px] text-zinc-600">Nenhuma lição adicionada ainda.</p>
                        </div>
                      ) : (
                        reviewLearnings.map((item, idx) => (
                          <div key={idx} className="flex items-center justify-between p-2 bg-[#0e0e11]/60 border border-zinc-900 hover:border-zinc-850 rounded-xl group transition-all">
                            <span className="text-xs text-gray-300 font-medium flex items-start gap-2 leading-relaxed text-left">
                              <span className="text-orange-500 font-bold mt-0.5">•</span>
                              {item}
                            </span>
                            <button
                              type="button"
                              onClick={() => setReviewLearnings(prev => prev.filter((_, i) => i !== idx))}
                              className="text-zinc-600 hover:text-red-500 p-1 rounded transition-colors lg:opacity-0 group-hover:opacity-100 shrink-0"
                              title="Remover"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        ))
                      )}
                    </div>
                  </div>

                  {/* Melhorar */}
                  <div className="space-y-3 bg-[#0d0d10]/40 border border-zinc-900 rounded-2xl p-4">
                    <label className="text-xs font-bold text-gray-400 uppercase tracking-wider flex items-center gap-1.5">
                      <AlertCircle className="h-4 w-4 text-orange-500" />
                      O que eu tenho que melhorar:
                    </label>
                    <p className="text-[10px] text-zinc-500">Pontos de melhoria, fraquezas identificadas, ou ajustes necessários para o próximo mês.</p>
                    
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={newImprovementItem}
                        onChange={(e) => setNewImprovementItem(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            if (newImprovementItem.trim()) {
                              setReviewImprovements(prev => [...prev, newImprovementItem.trim()]);
                              setNewImprovementItem('');
                            }
                          }
                        }}
                        placeholder="Adicione um ponto de melhoria..."
                        className="flex-1 bg-zinc-950/60 border border-zinc-850 rounded-xl px-3 py-1.5 text-xs text-white focus:outline-none focus:border-orange-500/50"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          if (newImprovementItem.trim()) {
                            setReviewImprovements(prev => [...prev, newImprovementItem.trim()]);
                            setNewImprovementItem('');
                          }
                        }}
                        className="bg-zinc-900 hover:bg-zinc-800 text-orange-500 border border-zinc-850 rounded-xl px-3 py-1.5 text-xs font-bold transition-colors flex items-center justify-center min-w-[40px]"
                      >
                        <Plus className="h-4 w-4" />
                      </button>
                    </div>
                    
                    <div className="space-y-1.5 max-h-[140px] overflow-y-auto scrollbar-thin pr-1">
                      {reviewImprovements.length === 0 ? (
                        <div className="text-center py-4 border border-dashed border-zinc-900 rounded-xl bg-zinc-950/20">
                          <p className="text-[11px] text-zinc-600">Nenhum ponto de melhoria listado.</p>
                        </div>
                      ) : (
                        reviewImprovements.map((item, idx) => (
                          <div key={idx} className="flex items-center justify-between p-2 bg-[#0e0e11]/60 border border-zinc-900 hover:border-zinc-850 rounded-xl group transition-all">
                            <span className="text-xs text-gray-300 font-medium flex items-start gap-2 leading-relaxed text-left">
                              <span className="text-orange-500 font-bold mt-0.5">•</span>
                              {item}
                            </span>
                            <button
                              type="button"
                              onClick={() => setReviewImprovements(prev => prev.filter((_, i) => i !== idx))}
                              className="text-zinc-600 hover:text-red-500 p-1 rounded transition-colors lg:opacity-0 group-hover:opacity-100 shrink-0"
                              title="Remover"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        ))
                      )}
                    </div>
                  </div>

                </div>

                {/* Right Column: Memory Jogger Timeline (Daily logs of this month) */}
                <div className="lg:col-span-5 flex flex-col bg-[#0e0e11]/60 border border-zinc-900 rounded-2xl overflow-hidden h-[500px] lg:h-auto">
                  
                  {/* Timeline Header */}
                  <div className="p-4 border-b border-zinc-850 bg-[#070709]/80 flex justify-between items-center text-left">
                    <div>
                      <h3 className="text-xs font-black text-white uppercase tracking-wider flex items-center gap-1.5">
                        <BookOpen className="h-3.5 w-3.5 text-orange-500" />
                        Histórico de {months[reviewMonth]}
                      </h3>
                      <p className="text-[9px] text-zinc-500">Seus diários e fé salvos este mês na Agenda.</p>
                    </div>
                    <span className="bg-zinc-900 text-orange-500 font-mono font-bold text-[9px] px-2 py-0.5 rounded-lg border border-zinc-800">
                      {notes.filter(n => n.date.startsWith(`${reviewYear}-${String(reviewMonth + 1).padStart(2, '0')}`)).length} registros
                    </span>
                  </div>

                  {/* Timeline Body */}
                  <div className="flex-1 overflow-y-auto p-4 space-y-4 scrollbar-thin">
                    {(() => {
                      const prefix = `${reviewYear}-${String(reviewMonth + 1).padStart(2, '0')}`;
                      const filtered = notes.filter(n => n.date.startsWith(prefix) && (
                        (n.journalText && n.journalText.trim().length > 0) ||
                        (n.gratitudeText && n.gratitudeText.trim().length > 0 && n.gratitudeText !== DEFAULT_GRATITUDE_TEMPLATE) ||
                        (n.prayerText && n.prayerText.trim().length > 0 && n.prayerText !== DEFAULT_PRAYER_TEMPLATE) ||
                        (n.checklist && n.checklist.length > 0)
                      )).sort((a, b) => a.date.localeCompare(b.date));

                      if (filtered.length === 0) {
                        return (
                          <div className="h-full flex flex-col items-center justify-center text-center p-6 space-y-2">
                            <BookOpen className="h-8 w-8 text-zinc-700 animate-pulse mx-auto" />
                            <h4 className="text-xs font-bold text-zinc-400">Nenhum registro encontrado</h4>
                            <p className="text-[10px] text-zinc-500 max-w-[200px] mx-auto">Os diários diários e logs da Agenda de {months[reviewMonth]} aparecerão aqui para ajudar você a refletir!</p>
                          </div>
                        );
                      }

                      return filtered.map((log) => {
                        const dateParts = log.date.split('-');
                        const displayDay = dateParts.length === 3 ? `${dateParts[2]}/${dateParts[1]}` : log.date;
                        
                        const completedTasks = log.checklist ? log.checklist.filter(t => t.completed).length : 0;
                        const totalTasks = log.checklist ? log.checklist.length : 0;
                        
                        return (
                          <div key={log.id} className="p-3 bg-[#0a0a0c]/80 border border-zinc-900 rounded-xl space-y-2 text-left">
                            <div className="flex justify-between items-center">
                              <span className="text-[10px] font-bold font-mono text-orange-500 bg-orange-500/5 px-2 py-0.5 rounded border border-orange-500/15">
                                Dia {displayDay}
                              </span>
                              {totalTasks > 0 && (
                                <span className="text-[9px] text-zinc-500 font-mono">
                                  Checklist: {completedTasks}/{totalTasks}
                                </span>
                              )}
                            </div>

                            {log.journalText && log.journalText.trim().length > 0 && (
                              <div className="space-y-1">
                                <span className="text-[9px] text-zinc-500 font-bold uppercase tracking-wider block">Diário Pessoal:</span>
                                <p className="text-[11px] text-gray-300 leading-relaxed italic bg-zinc-950/40 p-2 rounded-lg border border-zinc-900/60 text-left">
                                  "{log.journalText.length > 150 ? log.journalText.substring(0, 150) + '...' : log.journalText}"
                                </p>
                              </div>
                            )}

                            {((log.gratitudeText && log.gratitudeText.trim().length > 0 && log.gratitudeText !== DEFAULT_GRATITUDE_TEMPLATE) ||
                              (log.prayerText && log.prayerText.trim().length > 0 && log.prayerText !== DEFAULT_PRAYER_TEMPLATE)) && (
                              <div className="pt-1 flex gap-1 flex-wrap">
                                {log.gratitudeText && log.gratitudeText.trim().length > 0 && log.gratitudeText !== DEFAULT_GRATITUDE_TEMPLATE && (
                                  <span className="text-[8px] font-bold px-1.5 py-0.5 bg-purple-500/5 border border-purple-500/10 text-purple-400 rounded">
                                    Gratidão
                                  </span>
                                )}
                                {log.prayerText && log.prayerText.trim().length > 0 && log.prayerText !== DEFAULT_PRAYER_TEMPLATE && (
                                  <span className="text-[8px] font-bold px-1.5 py-0.5 bg-blue-500/5 border border-blue-500/10 text-blue-400 rounded">
                                    Oração
                                  </span>
                                )}
                              </div>
                            )}
                          </div>
                        );
                      });
                    })()}
                  </div>

                </div>

              </div>

              {/* Modal Footer */}
              <div className="flex flex-col sm:flex-row justify-between items-center px-6 py-4 border-t border-zinc-850 bg-[#0e0e11]/80 gap-3">
                <div className="flex items-center gap-2 text-left self-start sm:self-auto">
                  <span className="p-1.5 bg-orange-500/10 border border-orange-500/20 text-orange-500 rounded-lg shrink-0">
                    <Zap className="h-4 w-4 animate-pulse" />
                  </span>
                  <div>
                    <span className="text-xs font-bold text-white block">Recompensa Mental +50 XP</span>
                    <span className="text-[10px] text-zinc-500 block">Refletir ajuda a expandir seu nível de maestria pessoal.</span>
                  </div>
                </div>

                <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
                  <span className="text-[10px] text-gray-500 font-mono hidden md:inline">
                    {reviewSavingStatus === 'saving' && "Salvando reflexão..."}
                    {reviewSavingStatus === 'saved' && "Salvo com sucesso!"}
                    {reviewSavingStatus === 'idle' && "Alterações prontas"}
                  </span>
                  <button
                    type="button"
                    onClick={handleSaveReview}
                    disabled={reviewSavingStatus === 'saving'}
                    className="w-full sm:w-auto bg-orange-500 hover:bg-orange-600 disabled:opacity-50 text-white font-bold text-xs px-5 py-2.5 rounded-xl flex items-center justify-center gap-2 transition-all shadow-lg shadow-orange-500/10"
                  >
                    {reviewSavingStatus === 'saving' ? (
                      <>
                        <span className="animate-spin h-3.5 w-3.5 border-2 border-white border-t-transparent rounded-full" />
                        Salvando...
                      </>
                    ) : reviewSavingStatus === 'saved' ? (
                      <>
                        <Check className="h-4 w-4 text-white" />
                        Reflexão Salva!
                      </>
                    ) : (
                      <>
                        <Save className="h-4 w-4" />
                        Salvar Reflexão & Resgatar XP
                      </>
                    )}
                  </button>
                </div>
              </div>

            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Edit Activity Modal */}
      <AnimatePresence>
        {editingItem && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-zinc-950 border border-zinc-800 rounded-2xl p-6 max-w-md w-full space-y-5 text-left shadow-2xl"
            >
              <div className="flex items-center justify-between border-b border-zinc-900 pb-3">
                <div className="flex items-center gap-2">
                  <Pencil className="h-4 w-4 text-orange-500" />
                  <h3 className="text-sm font-black text-white uppercase tracking-wider">Editar Atividade</h3>
                </div>
                <button
                  type="button"
                  onClick={() => setEditingItem(null)}
                  className="text-zinc-500 hover:text-white p-1 transition-colors"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              <form onSubmit={handleSaveEditTask} className="space-y-4">
                <div>
                  <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider block mb-1.5">
                    Nome da Atividade
                  </label>
                  <input
                    type="text"
                    value={editTaskText}
                    onChange={(e) => setEditTaskText(e.target.value)}
                    placeholder="Ex: Treino de Musculação"
                    className="w-full bg-zinc-900 border border-zinc-800 focus:border-orange-500/50 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-zinc-600 outline-none transition-all"
                    required
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider block mb-1.5">
                      Horário
                    </label>
                    <input
                      type="time"
                      value={editTime}
                      onChange={(e) => setEditTime(e.target.value)}
                      className="w-full bg-zinc-900 border border-zinc-800 focus:border-orange-500/50 rounded-xl px-3.5 py-2.5 text-xs text-white outline-none transition-all"
                      required
                    />
                  </div>

                  <div>
                    <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider block mb-1.5">
                      Frequência
                    </label>
                    <button
                      type="button"
                      onClick={() => setEditIsEveryDay(!editIsEveryDay)}
                      className={`w-full py-2.5 px-3 rounded-xl border text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
                        editIsEveryDay
                          ? 'bg-orange-500/10 border-orange-500/30 text-orange-400'
                          : 'bg-zinc-900 border-zinc-800 text-zinc-400'
                      }`}
                    >
                      {editIsEveryDay ? 'Todos os Dias' : 'Dia Específico'}
                    </button>
                  </div>
                </div>

                {!editIsEveryDay && (
                  <div>
                    <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider block mb-1.5">
                      Dia da Semana
                    </label>
                    <div className="grid grid-cols-7 gap-1">
                      {daysOfWeek.map((day) => (
                        <button
                          key={day.id}
                          type="button"
                          onClick={() => setEditSelectedDay(day.id)}
                          className={`py-2 text-[10px] font-bold rounded-lg border transition-all ${
                            editSelectedDay === day.id
                              ? 'bg-orange-500 border-orange-500 text-white'
                              : 'bg-zinc-900 border-zinc-800 text-zinc-500 hover:text-white'
                          }`}
                        >
                          {day.name}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                <div className="flex items-center justify-end gap-3 pt-3 border-t border-zinc-900">
                  <button
                    type="button"
                    onClick={() => setEditingItem(null)}
                    className="px-4 py-2 rounded-xl text-xs font-semibold text-zinc-400 hover:text-white bg-zinc-900 border border-zinc-800"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 rounded-xl text-xs font-bold text-white bg-orange-500 hover:bg-orange-600 transition-all shadow-lg shadow-orange-500/20"
                  >
                    Salvar Alterações
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Clear Routine Confirmation Modal */}
      <AnimatePresence>
        {showClearModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-zinc-950 border border-red-500/20 rounded-2xl p-6 max-w-sm w-full space-y-4 text-left shadow-2xl"
            >
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-red-500/10 border border-red-500/20 rounded-xl text-red-500 shrink-0">
                  <AlertCircle className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">Limpar Rotina Semanal</h3>
                  <p className="text-xs text-zinc-400">Esta ação não poderá ser desfeita.</p>
                </div>
              </div>

              <p className="text-xs text-zinc-300 leading-relaxed">
                Tem certeza de que deseja apagar todas as atividades da rotina semanal?
              </p>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowClearModal(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-zinc-400 hover:text-white bg-zinc-900 border border-zinc-800 hover:bg-zinc-850 transition-all"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setRoutine([]);
                    if (setGridRoutine) setGridRoutine({});
                    setShowClearModal(false);
                  }}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-white bg-red-600 hover:bg-red-500 transition-all shadow-lg shadow-red-600/20"
                >
                  Sim, Limpar Tudo
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}
