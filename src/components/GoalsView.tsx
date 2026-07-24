import React, { useState, useEffect, useRef } from 'react';
import { 
  Target, 
  Plus, 
  Trash2, 
  CheckCircle, 
  ChevronDown, 
  ChevronUp, 
  PlusCircle, 
  MinusCircle,
  Trophy,
  Award,
  Flame,
  RefreshCw,
  Calendar,
  Clock,
  History,
  Image as ImageIcon,
  Upload,
  Link as LinkIcon,
  ChevronLeft,
  MessageSquare,
  BookOpen,
  Book,
  Heart,
  Coins,
  Users,
  Palette,
  Sparkles,
  Dumbbell,
  Briefcase
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Goal, BookTracker, BibleTracker, TimelineGoal, TimelineAction } from '../types';

interface GoalsViewProps {
  goals: Goal[];
  setGoals: React.Dispatch<React.SetStateAction<Goal[]>>;
  timelines?: TimelineGoal[];
  setTimelines?: React.Dispatch<React.SetStateAction<TimelineGoal[]>>;
  addXp: (amount: number) => void;
  bookTracker?: BookTracker;
  setBookTracker?: React.Dispatch<React.SetStateAction<BookTracker>>;
  bibleTracker?: BibleTracker;
  setBibleTracker?: React.Dispatch<React.SetStateAction<BibleTracker>>;
  areaImages?: Record<string, string>;
  setAreaImages?: React.Dispatch<React.SetStateAction<Record<string, string>>>;
  viewMode?: 'areas' | 'all' | 'leitura' | 'timeline';
  setViewMode?: (mode: 'areas' | 'all' | 'leitura' | 'timeline') => void;
  selectedArea?: string | null;
  setSelectedArea?: (area: string | null) => void;
}

// Default Museum / Fine Art Painting images matching the screenshot mood
const defaultAreaImages: Record<string, string> = {
  'Saúde': 'https://images.unsplash.com/photo-1608155686393-8fdd966d784d?q=80&w=1000', // Marble Neptune / classical sculpture style
  'Financeiro': 'https://images.unsplash.com/photo-1584290860587-211bfb66aa0f?q=80&w=1000', // Classical gold painting style
  'Social': 'https://images.unsplash.com/photo-1581022295087-35e59370ac36?q=80&w=1000', // Pierre-Auguste Cot - Springtime / swing
  'Hobbies': 'https://images.unsplash.com/photo-1495446815901-a7297e633e8d?q=80&w=1000', // Library bedroom with coffee
  'Espiritualidade': 'https://images.unsplash.com/photo-1475924156734-496f6cac6ec1?q=80&w=1000', // Caspar David Friedrich mystic mountain style
  'Físico': 'https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?q=80&w=1000', // Classical athlete anatomy style
  'Carreira': 'https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?q=80&w=1000' // Architecture blueprints study style
};

const LIFE_AREAS = [
  'Saúde',
  'Financeiro',
  'Social',
  'Hobbies',
  'Espiritualidade',
  'Físico',
  'Carreira'
];

const areaMeta: Record<string, { icon: React.ComponentType<any>; color: string; dotColor: string; bgGlow: string }> = {
  'Saúde': {
    icon: Heart,
    color: 'from-rose-500/10 to-pink-500/10 border-rose-500/20 text-rose-400',
    dotColor: 'bg-rose-500',
    bgGlow: 'hover:shadow-[0_0_30px_rgba(244,63,94,0.1)]'
  },
  'Financeiro': {
    icon: Coins,
    color: 'from-amber-500/10 to-yellow-500/10 border-amber-500/20 text-amber-400',
    dotColor: 'bg-amber-500',
    bgGlow: 'hover:shadow-[0_0_30px_rgba(245,158,11,0.1)]'
  },
  'Social': {
    icon: Users,
    color: 'from-blue-500/10 to-indigo-500/10 border-blue-500/20 text-blue-400',
    dotColor: 'bg-blue-500',
    bgGlow: 'hover:shadow-[0_0_30px_rgba(59,130,246,0.1)]'
  },
  'Hobbies': {
    icon: Palette,
    color: 'from-purple-500/10 to-pink-500/10 border-purple-500/20 text-purple-400',
    dotColor: 'bg-purple-500',
    bgGlow: 'hover:shadow-[0_0_30px_rgba(168,85,247,0.1)]'
  },
  'Espiritualidade': {
    icon: Sparkles,
    color: 'from-amber-400/10 to-orange-500/10 border-amber-500/20 text-amber-400',
    dotColor: 'bg-amber-400',
    bgGlow: 'hover:shadow-[0_0_30px_rgba(251,191,36,0.1)]'
  },
  'Físico': {
    icon: Dumbbell,
    color: 'from-emerald-500/10 to-teal-500/10 border-emerald-500/20 text-emerald-400',
    dotColor: 'bg-emerald-500',
    bgGlow: 'hover:shadow-[0_0_30px_rgba(16,185,129,0.1)]'
  },
  'Carreira': {
    icon: Briefcase,
    color: 'from-cyan-500/10 to-sky-500/10 border-cyan-500/20 text-cyan-400',
    dotColor: 'bg-cyan-500',
    bgGlow: 'hover:shadow-[0_0_30px_rgba(6,182,212,0.1)]'
  }
};

export default function GoalsView({ 
  goals, 
  setGoals, 
  timelines = [],
  setTimelines = () => {},
  addXp,
  bookTracker,
  setBookTracker,
  bibleTracker,
  setBibleTracker,
  areaImages = defaultAreaImages,
  setAreaImages = () => {},
  viewMode: propViewMode,
  setViewMode: propSetViewMode,
  selectedArea: propSelectedArea,
  setSelectedArea: propSetSelectedArea
}: GoalsViewProps) {
  // Navigation & Tabs
  const [localViewMode, setLocalViewMode] = useState<'areas' | 'all' | 'leitura' | 'timeline'>('areas'); // areas initially
  const [localSelectedArea, setLocalSelectedArea] = useState<string | null>(null);

  const viewMode = propViewMode !== undefined ? propViewMode : localViewMode;
  const setViewMode = propSetViewMode !== undefined ? propSetViewMode : setLocalViewMode;
  const selectedArea = propSelectedArea !== undefined ? propSelectedArea : localSelectedArea;
  const setSelectedArea = propSetSelectedArea !== undefined ? propSetSelectedArea : setLocalSelectedArea;

  // Goal adding forms
  const [isAdding, setIsAdding] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newActionsTotal, setNewActionsTotal] = useState(3);
  const [newIsRecurring, setNewIsRecurring] = useState(false);
  const [newArea, setNewArea] = useState<string>('Saúde');
  const [newDeadline, setNewDeadline] = useState('');

  // Editing area images
  const [isChangingImage, setIsChangingImage] = useState(false);
  const [imageUrlInput, setImageUrlInput] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Expanded goals
  const [expandedGoalId, setExpandedGoalId] = useState<string | null>(null);

  // Inline note text state maps
  const [noteInputs, setNoteInputs] = useState<Record<string, string>>({});

  const getTodayDateStr = () => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  };

  const todayStr = getTodayDateStr();

  // Timeline states
  const [selectedTimelineId, setSelectedTimelineId] = useState<string | null>(() => {
    return timelines.length > 0 ? timelines[0].id : null;
  });
  const [newTimelineObjective, setNewTimelineObjective] = useState('');
  const [newActionTexts, setNewActionTexts] = useState<Record<string, string>>({});

  useEffect(() => {
    if (!selectedTimelineId && timelines.length > 0) {
      setSelectedTimelineId(timelines[0].id);
    }
  }, [timelines, selectedTimelineId]);

  const handleCreateTimeline = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTimelineObjective.trim()) return;
    const newId = 't-' + Math.random().toString(36).substring(2, 9);
    const newTimeline: TimelineGoal = {
      id: newId,
      objective: newTimelineObjective.trim(),
      createdAt: todayStr,
      actions: []
    };
    setTimelines([newTimeline, ...timelines]);
    setNewTimelineObjective('');
    setSelectedTimelineId(newId);
    addXp(20);
  };

  const handleDeleteTimeline = (id: string) => {
    if (window.confirm("Deseja realmente excluir este Plano de Ação? Isso apagará todas as ações registradas.")) {
      setTimelines(timelines.filter(t => t.id !== id));
      if (selectedTimelineId === id) {
        const remaining = timelines.filter(t => t.id !== id);
        setSelectedTimelineId(remaining.length > 0 ? remaining[0].id : null);
      }
    }
  };

  const handleAddTimelineAction = (timelineId: string, horizon: '1_day' | '1_week' | '1_month' | '1_year' | '3_years' | '10_years') => {
    const key = `${timelineId}_${horizon}`;
    const text = newActionTexts[key] || '';
    if (!text.trim()) return;

    setTimelines(prev => prev.map(t => {
      if (t.id === timelineId) {
        const newAction: TimelineAction = {
          id: 'ta-' + Math.random().toString(36).substring(2, 9),
          text: text.trim(),
          completed: false,
          horizon
        };
        return {
          ...t,
          actions: [...t.actions, newAction]
        };
      }
      return t;
    }));

    setNewActionTexts(prev => ({ ...prev, [key]: '' }));
    addXp(5);
  };

  const handleToggleTimelineAction = (timelineId: string, actionId: string) => {
    setTimelines(prev => prev.map(t => {
      if (t.id === timelineId) {
        return {
          ...t,
          actions: t.actions.map(act => {
            if (act.id === actionId) {
              const nextStatus = !act.completed;
              if (nextStatus) {
                addXp(10);
              } else {
                addXp(-10);
              }
              return { ...act, completed: nextStatus };
            }
            return act;
          })
        };
      }
      return t;
    }));
  };

  const handleRemoveTimelineAction = (timelineId: string, actionId: string) => {
    setTimelines(prev => prev.map(t => {
      if (t.id === timelineId) {
        const act = t.actions.find(a => a.id === actionId);
        if (act && act.completed) {
          addXp(-10);
        }
        return {
          ...t,
          actions: t.actions.filter(a => a.id !== actionId)
        };
      }
      return t;
    }));
  };

  // Helper to categorize goals on-the-fly if they don't have an area
  const getGoalArea = (goal: Goal): string => {
    if (goal.area) return goal.area;
    const title = goal.title.toLowerCase();
    if (title.includes('salário') || title.includes('freela') || title.includes('faturar') || title.includes('dinheiro') || title.includes('financeiro') || title.includes('reserva')) {
      return 'Financeiro';
    }
    if (title.includes('livro') || title.includes('ler') || title.includes('hobby') || title.includes('backlog') || title.includes('jogo')) {
      return 'Hobbies';
    }
    if (title.includes('academia') || title.includes('treino') || title.includes('físico') || title.includes('correr') || title.includes('desafio físico')) {
      return 'Físico';
    }
    if (title.includes('desenvolvimento') || title.includes('estudo') || title.includes('carreira') || title.includes('trabalho') || title.includes('full stack')) {
      return 'Carreira';
    }
    if (title.includes('meditar') || title.includes('mente') || title.includes('saúde') || title.includes('comer') || title.includes('gordura')) {
      return 'Saúde';
    }
    if (title.includes('relacionamento') || title.includes('social') || title.includes('amigo') || title.includes('namorad')) {
      return 'Social';
    }
    if (title.includes('oração') || title.includes('decreto') || title.includes('espiritualidade') || title.includes('alma')) {
      return 'Espiritualidade';
    }
    return 'Saúde'; // default fallback
  };

  // Pre-process goals by area mapping
  const goalsWithArea = goals.map(g => ({
    ...g,
    area: getGoalArea(g)
  }));

  const handleCreateGoal = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim() || newActionsTotal <= 0) return;

    const areaToUse = selectedArea || newArea;

    const newGoal: Goal = {
      id: Math.random().toString(36).substring(2, 9),
      title: newTitle.trim(),
      actionsDone: 0,
      actionsTotal: newActionsTotal,
      completed: false,
      xpReward: 100, // 100 XP for achieving a major goal
      isRecurring: newIsRecurring,
      streak: newIsRecurring ? 0 : undefined,
      lastCompletedDate: undefined,
      area: areaToUse,
      createdAt: todayStr,
      deadline: newDeadline || undefined,
      notes: []
    };

    setGoals([newGoal, ...goals]);
    setNewTitle('');
    setNewActionsTotal(3);
    setNewIsRecurring(false);
    setNewDeadline('');
    setIsAdding(false);

    // Minor XP for initiating a goal
    addXp(15);
  };

  const handleActionIncrement = (id: string) => {
    setGoals(prev => prev.map(g => {
      if (g.id === id) {
        const nextDone = Math.min(g.actionsTotal, g.actionsDone + 1);
        const isNowCompleted = nextDone === g.actionsTotal;
        
        if (g.isRecurring) {
          if (isNowCompleted) {
            const alreadyCompletedToday = g.lastCompletedDate === todayStr;
            if (!alreadyCompletedToday) {
              const yesterdayStr = (() => {
                const d = new Date();
                d.setDate(d.getDate() - 1);
                return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
              })();
              
              const isStreakMaintained = g.lastCompletedDate === yesterdayStr || g.lastCompletedDate === todayStr;
              const newStreak = isStreakMaintained ? (g.streak || 0) + 1 : 1;
              
              addXp(g.xpReward); // Trigger 100 XP reward!
              return { 
                ...g, 
                actionsDone: nextDone, 
                completed: true,
                lastCompletedDate: todayStr,
                completedAt: todayStr,
                streak: newStreak,
                updatedAt: todayStr
              };
            }
          }
          
          // Small XP for progress step
          addXp(10);
          return { ...g, actionsDone: nextDone, updatedAt: todayStr };
        } else {
          if (isNowCompleted && !g.completed) {
            addXp(g.xpReward); // Trigger 100 XP reward!
            return { 
              ...g, 
              actionsDone: nextDone, 
              completed: true,
              completedAt: todayStr,
              updatedAt: todayStr
            };
          }
          
          // Small XP for progress step
          addXp(10);
          return { ...g, actionsDone: nextDone, updatedAt: todayStr };
        }
      }
      return g;
    }));
  };

  const handleActionDecrement = (id: string) => {
    setGoals(prev => prev.map(g => {
      if (g.id === id) {
        const nextDone = Math.max(0, g.actionsDone - 1);
        addXp(-10);
        
        if (g.isRecurring) {
          const wasCompletedToday = g.lastCompletedDate === todayStr;
          if (wasCompletedToday && nextDone < g.actionsTotal) {
            addXp(-g.xpReward); // Deduct the reward
            const nextStreak = Math.max(0, (g.streak || 1) - 1);
            return { 
              ...g, 
              actionsDone: nextDone, 
              completed: false,
              lastCompletedDate: undefined,
              streak: nextStreak,
              updatedAt: todayStr
            };
          }
        }
        
        return { 
          ...g, 
          actionsDone: nextDone, 
          completed: false,
          completedAt: undefined,
          updatedAt: todayStr
        };
      }
      return g;
    }));
  };

  const handleDeleteGoal = (id: string, completed: boolean, xpReward: number) => {
    if (completed) {
      addXp(-xpReward);
    }
    setGoals(goals.filter(g => g.id !== id));
  };

  const toggleExpandGoal = (id: string) => {
    setExpandedGoalId(expandedGoalId === id ? null : id);
  };

  // Add step notes
  const handleAddGoalNote = (goalId: string) => {
    const text = noteInputs[goalId] || '';
    if (!text.trim()) return;

    setGoals(prev => prev.map(g => {
      if (g.id === goalId) {
        const currentNotes = g.notes || [];
        const newNoteItem = {
          id: Math.random().toString(36).substring(2, 9),
          date: todayStr,
          text: text.trim(),
          actionIndex: g.actionsDone
        };
        return {
          ...g,
          notes: [newNoteItem, ...currentNotes],
          updatedAt: todayStr
        };
      }
      return g;
    }));

    // Clear note input
    setNoteInputs(prev => ({ ...prev, [goalId]: '' }));
    addXp(5); // Extra small reward for documenting your progress!
  };

  const handleRemoveGoalNote = (goalId: string, noteId: string) => {
    setGoals(prev => prev.map(g => {
      if (g.id === goalId && g.notes) {
        return {
          ...g,
          notes: g.notes.filter(n => n.id !== noteId),
          updatedAt: todayStr
        };
      }
      return g;
    }));
  };

  // Cover image changes (link)
  const handleSaveImageUrl = (area: string) => {
    if (!imageUrlInput.trim()) return;
    setAreaImages(prev => ({
      ...prev,
      [area]: imageUrlInput.trim()
    }));
    setImageUrlInput('');
    setIsChangingImage(false);
  };

  // Cover image changes (file upload)
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>, area: string) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64String = reader.result as string;
        setAreaImages(prev => ({
          ...prev,
          [area]: base64String
        }));
        setIsChangingImage(false);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleOpenAreaAndExpandGoal = (area: string, goalId: string) => {
    setSelectedArea(area);
    setExpandedGoalId(goalId);
  };

  const formatDateBr = (dateStr?: string) => {
    if (!dateStr) return '';
    const parts = dateStr.split('-');
    if (parts.length !== 3) return dateStr;
    return `${parts[2]}/${parts[1]}/${parts[0]}`;
  };

  const formatTimelineDate = (dateStr?: string) => {
    if (!dateStr) return 'Recentemente';
    const parts = dateStr.split('-');
    if (parts.length !== 3) return dateStr;
    const date = new Date(parseInt(parts[0]), parseInt(parts[1]) - 1, parseInt(parts[2]));
    return date.toLocaleDateString('pt-BR', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });
  };

  // Active & Completed Goals based on view context
  const filteredGoals = selectedArea 
    ? goalsWithArea.filter(g => g.area === selectedArea)
    : goalsWithArea;

  const activeGoals = filteredGoals.filter(g => !g.completed || g.isRecurring);
  const completedGoals = filteredGoals.filter(g => g.completed && !g.isRecurring);

  return (
    <div id="goals-view" className="space-y-6 pb-12">
      {/* 1. Header with custom tabs */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-zinc-800 pb-4">
        <div>
          <h1 className="text-2xl font-black text-white tracking-tight flex items-center gap-2">
            <Target className="h-6 w-6 text-orange-500" />
            Metas de Vida
          </h1>
          <p className="text-gray-400 text-xs mt-1">
            Seu planner de alta performance dividido em pilares fundamentais.
          </p>
        </div>

        {/* Tab selector and general buttons */}
        <div className="flex items-center gap-2 self-start md:self-auto">
          {!selectedArea && (
            <div className="flex bg-zinc-900/80 p-1 rounded-xl">
              <button
                onClick={() => setViewMode('areas')}
                className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all ${
                  viewMode === 'areas' 
                    ? 'bg-orange-500 text-white shadow-md' 
                    : 'text-gray-400 hover:text-white'
                }`}
              >
                Áreas da Vida
              </button>
              <button
                onClick={() => setViewMode('all')}
                className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all ${
                  viewMode === 'all' 
                    ? 'bg-orange-500 text-white shadow-md' 
                    : 'text-gray-400 hover:text-white'
                }`}
              >
                Visão Geral (Todas)
              </button>
              <button
                onClick={() => setViewMode('leitura')}
                className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all ${
                  viewMode === 'leitura' 
                    ? 'bg-orange-500 text-white shadow-md' 
                    : 'text-gray-400 hover:text-white'
                }`}
              >
                Metas de Leitura
              </button>
              <button
                onClick={() => setViewMode('timeline')}
                className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all ${
                  viewMode === 'timeline' 
                    ? 'bg-orange-500 text-white shadow-md' 
                    : 'text-gray-400 hover:text-white'
                }`}
              >
                Timeline de Ação
              </button>
            </div>
          )}

          {goals.some(g => g.isRecurring) && (
            <button
              type="button"
              onClick={() => {
                if (window.confirm("Zerar as ações concluídas de TODAS as suas metas diárias recorrentes? Isso reinicia o progresso do dia.")) {
                  setGoals(prev => prev.map(g => g.isRecurring ? { ...g, actionsDone: 0 } : g));
                }
              }}
              className="text-xs font-bold text-gray-400 hover:text-white flex items-center gap-1.5 transition-colors bg-zinc-900/60 hover:bg-zinc-900 px-3 py-2 rounded-lg border border-zinc-800"
              title="Reinicia todas as metas diárias"
            >
              <RefreshCw className="h-3.5 w-3.5 text-orange-500" /> Zerar Diárias
            </button>
          )}

          <button
            onClick={() => {
              if (selectedArea) {
                setIsAdding(!isAdding);
              } else {
                setViewMode('all');
                setIsAdding(true);
              }
            }}
            className="bg-orange-500 hover:bg-orange-600 text-white font-bold text-xs px-4 py-2 rounded-lg flex items-center gap-1.5 shadow-[0_4px_12px_rgba(249,115,22,0.3)] transition-colors"
          >
            {isAdding ? 'Fechar Form' : '+ Nova Meta'}
          </button>
        </div>
      </div>

      {/* Goal creation Form */}
      <AnimatePresence>
        {isAdding && (
          <motion.form
            onSubmit={handleCreateGoal}
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="bg-zinc-900 border border-orange-500/30 rounded-xl p-5 space-y-4 shadow-xl"
          >
            <div className="flex items-center justify-between border-b border-zinc-850 pb-2">
              <h3 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
                <Target className="h-4 w-4 text-orange-500" />
                Definir Nova Meta {selectedArea ? `em ${selectedArea}` : ''}
              </h3>
              <span className="text-[10px] text-orange-500 font-mono font-bold bg-orange-500/10 px-2 py-0.5 rounded">
                {newIsRecurring ? 'Ganha +100 XP a cada dia completo' : 'Ganha +100 XP ao concluir'}
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="md:col-span-2">
                <label className="text-[10px] text-gray-400 font-bold block mb-1 uppercase">Título da Meta</label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Correr 10km, Guardar reserva, Ler clássicos..."
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-orange-500/50"
                  maxLength={55}
                />
              </div>

              <div>
                <label className="text-[10px] text-gray-400 font-bold block mb-1 uppercase">Passos/Ações Totais</label>
                <input
                  type="number"
                  min="1"
                  max="100"
                  required
                  value={newActionsTotal}
                  onChange={(e) => setNewActionsTotal(parseInt(e.target.value) || 1)}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-orange-500/50 font-mono"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {!selectedArea && (
                <div>
                  <label className="text-[10px] text-gray-400 font-bold block mb-1 uppercase">Área da Vida</label>
                  <select
                    value={newArea}
                    onChange={(e) => setNewArea(e.target.value)}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-orange-500/50"
                  >
                    {LIFE_AREAS.map(area => (
                      <option key={area} value={area}>{area}</option>
                    ))}
                  </select>
                </div>
              )}

              <div className={selectedArea ? "md:col-span-2" : ""}>
                <label className="text-[10px] text-gray-400 font-bold block mb-1 uppercase">Prazo / Deadline (Opcional)</label>
                <input
                  type="date"
                  value={newDeadline}
                  onChange={(e) => setNewDeadline(e.target.value)}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-orange-500/50 font-mono"
                />
              </div>
            </div>

            <div className="flex items-center gap-2 py-1 select-none">
              <input
                type="checkbox"
                id="is-recurring-goal-checkbox"
                checked={newIsRecurring}
                onChange={(e) => setNewIsRecurring(e.target.checked)}
                className="rounded border-zinc-800 bg-zinc-950 text-orange-500 focus:ring-0 focus:ring-offset-0 h-4 w-4"
              />
              <label htmlFor="is-recurring-goal-checkbox" className="text-xs text-gray-300 font-medium cursor-pointer">
                Meta Recorrente (diária - reseta o progresso diariamente e acumula XP)
              </label>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-zinc-850">
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
                Criar Meta (+15 XP)
              </button>
            </div>
          </motion.form>
        )}
      </AnimatePresence>

      {/* 2. MAIN AREAS GRID (Image 1 & 2 inspired portrait museum paintings list) */}
      <AnimatePresence mode="wait">
        {!selectedArea && viewMode === 'areas' && (
          <motion.div
            key="areas-grid"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            transition={{ duration: 0.25 }}
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6"
          >
            {LIFE_AREAS.map((areaName) => {
            const areaActiveGoals = goalsWithArea.filter(g => g.area === areaName && (!g.completed || g.isRecurring));
            const areaCompletedCount = goalsWithArea.filter(g => g.area === areaName && g.completed && !g.isRecurring).length;
            const totalAreaGoals = goalsWithArea.filter(g => g.area === areaName).length;
            const completedAreaGoals = goalsWithArea.filter(g => g.area === areaName && g.completed).length;
            const progressPercent = totalAreaGoals > 0 ? Math.round((completedAreaGoals / totalAreaGoals) * 100) : 0;

            const meta = areaMeta[areaName] || {
              icon: Target,
              color: 'from-orange-500/10 to-amber-500/10 border-orange-500/20 text-orange-400',
              dotColor: 'bg-orange-500',
              bgGlow: 'hover:shadow-[0_0_30px_rgba(249,115,22,0.1)]'
            };
            const IconComponent = meta.icon;

            return (
              <div 
                key={areaName} 
                onClick={() => {
                  setSelectedArea(areaName);
                  setIsAdding(false);
                  setExpandedGoalId(null);
                }}
                className={`relative aspect-[3/4.2] rounded-3xl overflow-hidden cursor-pointer border border-zinc-800/80 hover:border-orange-500/40 transition-all duration-300 shadow-xl group/card relative ${meta.bgGlow}`}
              >
                {/* Background Image */}
                <img 
                  src={areaImages[areaName] || defaultAreaImages[areaName]} 
                  alt={areaName} 
                  className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 ease-out group-hover/card:scale-105"
                  referrerPolicy="no-referrer"
                />

                {/* Vignettes for rich contrast */}
                <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-zinc-950/25 to-transparent opacity-95 transition-opacity duration-300 group-hover/card:opacity-90" />
                <div className="absolute inset-0 bg-gradient-to-b from-zinc-950/80 via-zinc-950/20 to-transparent opacity-100" />

                {/* Overlaid Header at the top of the image card */}
                <div className="absolute top-4 left-4 right-4 flex justify-between items-start z-10">
                  <div className="flex items-center gap-2.5">
                    <div className={`p-2 bg-gradient-to-br ${meta.color} rounded-xl border flex items-center justify-center transition-all duration-300 group-hover/card:scale-110 shadow-inner backdrop-blur-sm bg-opacity-40`}>
                      <IconComponent className="h-4.5 w-4.5" />
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-white tracking-wide font-serif filter drop-shadow-md">{areaName}</h3>
                      <p className="text-[9px] text-zinc-400 font-mono filter drop-shadow-md">Área de Vida</p>
                    </div>
                  </div>

                  <div className="flex flex-col items-end gap-1">
                    <span className="text-[8px] text-orange-400 font-mono font-black bg-zinc-950/80 backdrop-blur-sm px-2 py-0.5 rounded border border-orange-500/20">
                      {areaActiveGoals.length} ATIVAS
                    </span>
                    {areaCompletedCount > 0 && (
                      <span className="text-[8px] text-emerald-400 font-mono font-black bg-zinc-950/80 backdrop-blur-sm px-2 py-0.5 rounded border border-emerald-500/20">
                        {areaCompletedCount} ✓
                      </span>
                    )}
                  </div>
                </div>

                {/* Floating stats overlay at the bottom of the image card */}
                <div className="absolute bottom-4 left-4 right-4 p-3 bg-zinc-950/85 backdrop-blur-md border border-zinc-850 rounded-2xl shadow-2xl transition-all duration-300 group-hover/card:border-orange-500/30">
                  <div className="flex justify-between items-center mb-1.5">
                    <span className="text-[9px] text-zinc-400 font-black uppercase tracking-wider font-mono">Progresso Geral</span>
                    <span className="text-xs font-mono font-black text-white">{progressPercent}%</span>
                  </div>
                  
                  {/* Sleek Progress Bar */}
                  <div className="w-full h-1.5 bg-zinc-900 rounded-full overflow-hidden border border-zinc-800/50">
                    <div 
                      className="h-full bg-gradient-to-r from-orange-500 to-amber-500 rounded-full transition-all duration-500 shadow-[0_0_8px_rgba(249,115,22,0.4)]"
                      style={{ width: `${progressPercent}%` }}
                    />
                  </div>
                  
                  <div className="flex justify-between items-center mt-2.5 pt-2.5 border-t border-zinc-900/60">
                    <span className="text-[9px] text-zinc-500 font-mono">Total: {totalAreaGoals} metas</span>
                    <span className="text-[9px] text-orange-400 font-bold group-hover/card:text-orange-300 transition-colors flex items-center gap-1 font-mono uppercase tracking-wider">
                      Gerenciar <span className="transition-transform group-hover/card:translate-x-0.5">→</span>
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
          </motion.div>
        )}
      </AnimatePresence>

      {/* 3. LEGACY GENERAL LIST (Enhanced) */}
      <AnimatePresence mode="wait">
        {!selectedArea && viewMode === 'all' && (
          <motion.div
            key="all-goals"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            transition={{ duration: 0.25 }}
            className="grid grid-cols-1 gap-6"
          >
            <FormAndListContainer 
              activeGoals={activeGoals}
            completedGoals={completedGoals}
            expandedGoalId={expandedGoalId}
            toggleExpandGoal={toggleExpandGoal}
            handleActionIncrement={handleActionIncrement}
            handleActionDecrement={handleActionDecrement}
            handleDeleteGoal={handleDeleteGoal}
            todayStr={todayStr}
            formatDateBr={formatDateBr}
            noteInputs={noteInputs}
            setNoteInputs={setNoteInputs}
            handleAddGoalNote={handleAddGoalNote}
            handleRemoveGoalNote={handleRemoveGoalNote}
            LIFE_AREAS={LIFE_AREAS}
            showCategoryTag={true}
          />
          </motion.div>
        )}
      </AnimatePresence>

      {/* 3.5 INTEGRATED READING GOALS (Monthly/Annual - Book & Bible) */}
      <AnimatePresence mode="wait">
        {!selectedArea && viewMode === 'leitura' && (
          <motion.div
            key="leitura-goals"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            transition={{ duration: 0.25 }}
            className="space-y-6"
          >
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            
            {/* CARD 1: METAS DE LIVROS (MENSAL/ANUAL) */}
            <div className="bg-zinc-900/40 border border-zinc-850 rounded-2xl p-6 space-y-6 relative overflow-hidden">
              <div className="absolute top-0 right-0 p-12 bg-orange-500/5 rounded-full blur-3xl pointer-events-none" />
              
              <div className="flex justify-between items-start border-b border-zinc-850 pb-3">
                <div>
                  <h3 className="text-base font-black text-white uppercase tracking-wide flex items-center gap-2">
                    <BookOpen className="h-5 w-5 text-orange-500" /> Metas de Livros
                  </h3>
                  <p className="text-[10px] text-zinc-500 mt-1 uppercase tracking-wider">Acompanhamento Mensal e Anual</p>
                </div>
                <div className="bg-orange-500/10 text-orange-400 border border-orange-500/20 px-2.5 py-1 rounded text-[10px] font-mono font-bold">
                  Reforço Semanal
                </div>
              </div>

              {/* Annual Stats Row */}
              <div className="grid grid-cols-2 gap-4 bg-zinc-950/40 p-4 rounded-xl border border-zinc-900">
                <div className="space-y-1">
                  <span className="text-[9px] text-zinc-500 font-bold block uppercase tracking-wider">Meta Anual (Estimativa)</span>
                  <span className="text-xl font-black text-white font-mono">12 <span className="text-xs font-normal text-zinc-400">Livros</span></span>
                  <span className="text-[8px] text-zinc-600 block">Base: 1 livro a cada ~30 dias</span>
                </div>
                <div className="space-y-1">
                  <span className="text-[9px] text-zinc-500 font-bold block uppercase tracking-wider">Progresso Atual</span>
                  <span className="text-xl font-black text-orange-500 font-mono">
                    {bookTracker?.pagesRead && bookTracker.pagesRead >= bookTracker.totalPages ? '1' : '0'} <span className="text-xs font-normal text-zinc-400">Concluído</span>
                  </span>
                  <span className="text-[8px] text-zinc-600 block">Em andamento: {bookTracker?.bookName || 'Nenhum'}</span>
                </div>
              </div>

              {/* Monthly target card */}
              <div className="space-y-3.5">
                <h4 className="text-xs font-black text-gray-300 uppercase tracking-widest flex items-center gap-1.5">
                  <span className="h-1.5 w-1.5 rounded-full bg-orange-500"></span>
                  Livro Ativo
                </h4>

                <div className="bg-zinc-950/60 p-4 rounded-xl border border-zinc-900 space-y-3">
                  <div className="flex justify-between items-start">
                    <div>
                      <h5 className="text-xs font-bold text-white">{bookTracker?.bookName || 'Nenhum livro ativo'}</h5>
                      <p className="text-[10px] text-zinc-500 mt-0.5">Prazo de leitura: {bookTracker?.deadlineDays || 7} dias</p>
                    </div>
                    <span className="text-xs font-black text-orange-500 font-mono">
                      {bookTracker ? Math.round((bookTracker.pagesRead / bookTracker.totalPages) * 100) : 0}%
                    </span>
                  </div>

                  {/* Progress bar */}
                  <div className="w-full bg-[#18181b] h-1.5 rounded-full overflow-hidden">
                    <div 
                      className="bg-orange-500 h-full rounded-full transition-all" 
                      style={{ width: `${bookTracker ? Math.min(100, Math.round((bookTracker.pagesRead / bookTracker.totalPages) * 100)) : 0}%` }}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-[10px]">
                    <div className="text-zinc-500 font-sans">Lido: <span className="text-zinc-300 font-mono font-bold">{bookTracker?.pagesRead || 0} pág</span></div>
                    <div className="text-zinc-500 font-sans text-right">Faltam: <span className="text-zinc-300 font-mono font-bold">{Math.max(0, (bookTracker?.totalPages || 250) - (bookTracker?.pagesRead || 0))} pág</span></div>
                  </div>
                </div>
              </div>

              {/* Bookshelf Visual Decor */}
              <div className="space-y-2">
                <span className="text-[9px] text-zinc-500 uppercase tracking-widest font-black block">Estante de Leituras Recentes</span>
                <div className="h-16 border-b border-amber-800 bg-zinc-950/40 rounded-lg relative flex items-end px-4 gap-2">
                  {/* Book 1 (Completed dummy to make it look authentic) */}
                  <div className="w-6 h-12 bg-gradient-to-t from-red-800 to-red-600 rounded-t border-t border-red-500 flex items-center justify-center cursor-help shadow-lg" title="Pai Rico, Pai Pobre (100% Lido)">
                    <span className="text-[8px] text-white/40 font-mono uppercase font-black -rotate-90">PR</span>
                  </div>
                  {/* Book 2 (Completed dummy) */}
                  <div className="w-5 h-13 bg-gradient-to-t from-blue-800 to-blue-600 rounded-t border-t border-blue-500 flex items-center justify-center cursor-help shadow-lg" title="Rápido e Devagar (100% Lido)">
                    <span className="text-[8px] text-white/40 font-mono uppercase font-black -rotate-90">RD</span>
                  </div>
                  {/* Book 3 (Current Active Book) */}
                  {bookTracker && (
                    <motion.div 
                      className="w-7 bg-gradient-to-t from-orange-600 to-amber-500 rounded-t border-t border-orange-400 flex items-center justify-center cursor-help shadow-xl"
                      style={{ height: `${24 + Math.round((bookTracker.pagesRead / bookTracker.totalPages) * 24)}px` }}
                      title={`${bookTracker.bookName} (${Math.round((bookTracker.pagesRead / bookTracker.totalPages) * 100)}% Lido)`}
                    >
                      <span className="text-[8px] text-zinc-950 font-bold uppercase -rotate-90 font-mono">
                        {(bookTracker.bookName || 'L').substring(0,2).toUpperCase()}
                      </span>
                    </motion.div>
                  )}
                  {/* Shelf line shadow */}
                  <div className="absolute inset-x-0 bottom-0 h-[3px] bg-amber-900 rounded-b" />
                </div>
              </div>

            </div>

            {/* CARD 2: METAS DA BÍBLIA (MENSAL/ANUAL) */}
            <div className="bg-zinc-900/40 border border-zinc-850 rounded-2xl p-6 space-y-6 relative overflow-hidden">
              <div className="absolute top-0 right-0 p-12 bg-amber-500/5 rounded-full blur-3xl pointer-events-none" />
              
              <div className="flex justify-between items-start border-b border-zinc-850 pb-3">
                <div>
                  <h3 className="text-base font-black text-white uppercase tracking-wide flex items-center gap-2">
                    <Book className="h-5 w-5 text-amber-500" /> Plano da Bíblia
                  </h3>
                  <p className="text-[10px] text-zinc-500 mt-1 uppercase tracking-wider">Metas de Consistência Espiritual</p>
                </div>
                <div className="bg-amber-500/10 text-amber-400 border border-amber-500/20 px-2.5 py-1 rounded text-[10px] font-mono font-bold">
                  Anual
                </div>
              </div>

              {/* Annual Stats Row */}
              <div className="grid grid-cols-2 gap-4 bg-zinc-950/40 p-4 rounded-xl border border-zinc-900">
                <div className="space-y-1">
                  <span className="text-[9px] text-zinc-500 font-bold block uppercase tracking-wider">Meta Anual</span>
                  <span className="text-xl font-black text-white font-mono">{bibleTracker?.vezesNoAno || 1} <span className="text-xs font-normal text-zinc-400">Leitura(s)</span></span>
                  <span className="text-[8px] text-zinc-600 block font-sans">Total: {1189 * (bibleTracker?.vezesNoAno || 1)} capítulos</span>
                </div>
                <div className="space-y-1">
                  <span className="text-[9px] text-zinc-500 font-bold block uppercase tracking-wider">Capítulos Lidos</span>
                  <span className="text-xl font-black text-amber-500 font-mono">
                    {bibleTracker?.capitulosJaLidos || 0} <span className="text-xs font-normal text-zinc-400 font-sans">Lidos</span>
                  </span>
                  <span className="text-[8px] text-zinc-600 block font-sans">Restantes: {Math.max(0, (1189 * (bibleTracker?.vezesNoAno || 1)) - (bibleTracker?.capitulosJaLidos || 0))} caps</span>
                </div>
              </div>

              {/* Progress bar */}
              <div className="space-y-2">
                <div className="flex justify-between text-[10px] text-zinc-400 font-sans">
                  <span>Conclusão Bíblica Geral:</span>
                  <span className="text-amber-500 font-bold font-mono">
                    {bibleTracker ? Math.round(((bibleTracker.capitulosJaLidos) / (1189 * (bibleTracker.vezesNoAno || 1))) * 100) : 0}%
                  </span>
                </div>
                <div className="w-full bg-[#18181b] h-2.5 rounded-full overflow-hidden border border-[#27272a]">
                  <div 
                    className="bg-gradient-to-r from-amber-500 to-yellow-500 h-full rounded-full transition-all" 
                    style={{ width: `${bibleTracker ? Math.min(100, Math.round(((bibleTracker.capitulosJaLidos) / (1189 * (bibleTracker.vezesNoAno || 1))) * 100)) : 0}%` }}
                  />
                </div>
              </div>

              {/* Monthly breakdown stats */}
              <div className="space-y-2.5 bg-zinc-950/60 p-4 rounded-xl border border-zinc-900">
                <span className="text-[9px] text-zinc-500 uppercase tracking-widest font-black block">Monitoramento Mensal</span>
                <div className="text-xs text-zinc-300 leading-relaxed space-y-1.5 font-sans">
                  <p>
                    Para atingir a meta no prazo restante, você deve ler aproximadamente <span className="text-amber-500 font-bold font-mono">
                      {Math.ceil((1189 * (bibleTracker?.vezesNoAno || 1) - (bibleTracker?.capitulosJaLidos || 0)) / 171)} capítulos por dia
                    </span> de hoje até o final do ano (considerando 171 dias restantes em 2026).
                  </p>
                  <p className="text-[10px] text-zinc-500 border-t border-zinc-900 pt-1.5">
                    Seu ritmo diário configurado inicial era de <span className="text-white font-semibold font-mono">{bibleTracker?.capitulosPorDia || 4} capítulos por dia</span>. O sistema adaptará automaticamente suas metas a cada dia se você ficar à frente ou atrás!
                  </p>
                </div>
              </div>

            </div>

          </div>

          {/* CHRONOLOGY & PROGRESS ESTIMATION FEEDBACK (Full width) */}
          <div className="bg-zinc-900/30 border border-zinc-850 rounded-2xl p-6 space-y-4">
            <h3 className="text-xs font-black text-gray-300 uppercase tracking-widest flex items-center gap-1.5">
              <span className="h-1.5 w-1.5 rounded-full bg-amber-500 animate-ping"></span>
              Histórico Consolidado de Leituras
            </h3>

            {(!bookTracker?.history || bookTracker.history.length === 0) && (!bibleTracker?.history || bibleTracker.history.length === 0) ? (
              <div className="text-center py-8 text-zinc-600 text-xs italic font-sans">
                Nenhum registro de leitura encontrado. Registre suas páginas ou capítulos lidos no checklist diário para visualizar o progresso!
              </div>
            ) : (
              <div className="space-y-3 max-h-[250px] overflow-y-auto custom-scrollbar">
                {/* Book reading history logs */}
                {bookTracker?.history?.map((log, index) => (
                  <div key={`book-log-${index}`} className="flex items-center justify-between p-3 bg-zinc-950/40 rounded-xl border border-zinc-900 text-xs">
                    <div className="flex items-center gap-2">
                      <BookOpen className="h-4 w-4 text-orange-500" />
                      <div>
                        <span className="font-bold text-white">Leitura: {bookTracker.bookName}</span>
                        <span className="text-[10px] text-zinc-500 block font-sans">Registrado em {log.date}</span>
                      </div>
                    </div>
                    <div className="text-right">
                      <span className="font-mono font-bold text-orange-500">+{log.pagesReadToday} págs</span>
                      <span className="text-[9px] text-zinc-500 block font-sans">Meta era {log.dailyTarget} págs</span>
                    </div>
                  </div>
                ))}

                {/* Bible reading history logs */}
                {bibleTracker?.history?.map((log, index) => (
                  <div key={`bible-log-${index}`} className="flex items-center justify-between p-3 bg-zinc-950/40 rounded-xl border border-zinc-900 text-xs">
                    <div className="flex items-center gap-2">
                      <Book className="h-4 w-4 text-amber-500" />
                      <div>
                        <span className="font-bold text-white">Bíblia Sagrada</span>
                        <span className="text-[10px] text-zinc-500 block font-sans">Registrado em {log.date}</span>
                      </div>
                    </div>
                    <div className="text-right">
                      <span className="font-mono font-bold text-amber-500">+{log.chaptersReadToday} caps</span>
                      <span className="text-[9px] text-zinc-500 block font-sans">Meta era {log.dailyTarget} caps</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 3.5 TIMELINE DE AÇÃO VIEW */}
      <AnimatePresence mode="wait">
        {!selectedArea && viewMode === 'timeline' && (
          <motion.div
            key="timeline-goals"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            transition={{ duration: 0.25 }}
            className="space-y-6"
          >
          {/* Header Section */}
          <div className="bg-zinc-900/40 border border-zinc-850 rounded-2xl p-6 flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="space-y-1">
              <h2 className="text-xl font-bold text-white flex items-center gap-2">
                <Target className="h-5 w-5 text-orange-500" />
                Linha do Tempo e Planos de Ação
              </h2>
              <p className="text-xs text-gray-400">
                Trace grandes objetivos de longo prazo e desdobre-os em ações diárias de alto impacto.
              </p>
            </div>

            {/* Quick Create Form */}
            <form onSubmit={handleCreateTimeline} className="flex gap-2 w-full md:w-auto md:min-w-[400px]">
              <input
                type="text"
                placeholder="Ex: Falar Inglês Fluente, Maratonista..."
                value={newTimelineObjective}
                onChange={(e) => setNewTimelineObjective(e.target.value)}
                className="flex-1 bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-2 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-orange-500/50"
              />
              <button
                type="submit"
                className="bg-orange-500 hover:bg-orange-600 text-white text-xs font-bold px-4 py-2 rounded-xl flex items-center gap-1.5 transition-colors shadow-md"
              >
                <Plus className="h-4 w-4" /> Planejar
              </button>
            </form>
          </div>

          {/* Plan Selector Sidebar/Tabs */}
          {timelines.length === 0 ? (
            <div className="text-center py-16 bg-zinc-900/20 rounded-2xl border border-zinc-850 p-6 space-y-3">
              <div className="mx-auto w-12 h-12 rounded-full bg-zinc-900 flex items-center justify-center text-zinc-600 border border-zinc-800">
                <Target className="h-6 w-6" />
              </div>
              <p className="text-sm font-bold text-gray-300">Nenhum plano de ação de longo prazo iniciado</p>
              <p className="text-xs text-gray-500 max-w-md mx-auto">
                Digite um objetivo geral no campo acima (ex: "Transição de Carreira para Dev" ou "Independência Financeira aos 30") para começar a desdobrar suas ações de 1 dia a 10 anos.
              </p>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Selector Bar */}
              <div className="flex items-center gap-2 overflow-x-auto pb-2 custom-scrollbar">
                <span className="text-xs font-bold text-gray-500 uppercase tracking-wider shrink-0 mr-2 font-mono">Seus Planos:</span>
                {timelines.map((t) => {
                  const isSelected = selectedTimelineId === t.id;
                  const totalAct = t.actions.length;
                  const doneAct = t.actions.filter(a => a.completed).length;
                  const pct = totalAct > 0 ? Math.round((doneAct / totalAct) * 100) : 0;

                  return (
                    <button
                      key={t.id}
                      onClick={() => setSelectedTimelineId(t.id)}
                      className={`px-4 py-2.5 rounded-xl border text-xs font-bold transition-all flex items-center gap-2 shrink-0 ${
                        isSelected
                          ? 'bg-zinc-800 border-orange-500/40 text-white shadow-md'
                          : 'bg-zinc-900/40 border-zinc-850 text-gray-400 hover:text-white hover:bg-zinc-900'
                      }`}
                    >
                      <span>{t.objective}</span>
                      {totalAct > 0 && (
                        <span className={`text-[10px] px-1.5 py-0.5 rounded-md font-mono ${
                          pct === 100 ? 'bg-emerald-500/20 text-emerald-400' : 'bg-zinc-950 text-orange-400'
                        }`}>
                          {pct}%
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>

              {/* Selected Plan Details and Matrix */}
              {(() => {
                const activePlan = timelines.find(t => t.id === selectedTimelineId);
                if (!activePlan) return null;

                const planTotalActions = activePlan.actions.length;
                const planDoneActions = activePlan.actions.filter(a => a.completed).length;
                const planPct = planTotalActions > 0 ? Math.round((planDoneActions / planTotalActions) * 100) : 0;

                return (
                  <div className="space-y-6 animate-fade-in">
                    {/* Active Plan Header Cards */}
                    <div className="bg-zinc-900/60 border border-zinc-850 rounded-2xl p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                      <div className="space-y-1">
                        <span className="text-[10px] font-black text-orange-500 uppercase tracking-widest block font-mono">
                          Plano de Longo Prazo Ativo
                        </span>
                        <h3 className="text-lg font-black text-white font-serif tracking-tight">
                          {activePlan.objective}
                        </h3>
                        <p className="text-[10px] text-gray-500">
                          Iniciado em {formatDateBr(activePlan.createdAt)}
                        </p>
                      </div>

                      <div className="flex items-center gap-4 w-full sm:w-auto">
                        {/* Overall Progress */}
                        <div className="text-right shrink-0">
                          <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest block font-mono mb-1">
                            Progresso Geral
                          </span>
                          <div className="flex items-center gap-2">
                            <div className="w-24 bg-zinc-950 h-2 rounded-full overflow-hidden border border-zinc-800">
                              <div
                                className="bg-gradient-to-r from-orange-500 to-amber-500 h-full transition-all duration-500"
                                style={{ width: `${planPct}%` }}
                              />
                            </div>
                            <span className="text-xs font-mono font-bold text-white">
                              {planDoneActions}/{planTotalActions} ({planPct}%)
                            </span>
                          </div>
                        </div>

                        {/* Delete Plan Button */}
                        <button
                          onClick={() => handleDeleteTimeline(activePlan.id)}
                          className="p-2.5 bg-red-500/10 hover:bg-red-500/20 text-red-400 hover:text-red-300 rounded-xl border border-red-500/20 transition-all ml-auto sm:ml-0"
                          title="Excluir Plano de Ação"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </div>

                    {/* Timeline Grid matrix: 1 day, 1 week, 1 month, 1 year, 3 years, 10 years */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
                      {[
                        { id: '1_day', name: '1 Dia', subtitle: 'Ações Diárias', color: 'text-amber-400 border-amber-500/20 bg-amber-500/5', progressColor: 'bg-amber-500' },
                        { id: '1_week', name: '1 Semana', subtitle: 'Metas Semanais', color: 'text-orange-400 border-orange-500/20 bg-orange-500/5', progressColor: 'bg-orange-500' },
                        { id: '1_month', name: '1 Mês', subtitle: 'Projetos Mensais', color: 'text-rose-400 border-rose-500/20 bg-rose-500/5', progressColor: 'bg-rose-500' },
                        { id: '1_year', name: '1 Ano', subtitle: 'Conquistas do Ano', color: 'text-cyan-400 border-cyan-500/20 bg-cyan-500/5', progressColor: 'bg-cyan-500' },
                        { id: '3_years', name: '3 Anos', subtitle: 'Médio Prazo', color: 'text-violet-400 border-violet-500/20 bg-violet-500/5', progressColor: 'bg-violet-500' },
                        { id: '10_years', name: '10 Anos', subtitle: 'Visão de Legado', color: 'text-fuchsia-400 border-fuchsia-500/20 bg-fuchsia-500/5', progressColor: 'bg-fuchsia-500' },
                      ].map((horizon) => {
                        const horizonActions = activePlan.actions.filter(a => a.horizon === horizon.id);
                        const totalAct = horizonActions.length;
                        const doneAct = horizonActions.filter(a => a.completed).length;
                        const horizonPct = totalAct > 0 ? Math.round((doneAct / totalAct) * 100) : 0;
                        const key = `${activePlan.id}_${horizon.id}`;
                        const actionTextValue = newActionTexts[key] || '';

                        return (
                          <div
                            key={horizon.id}
                            className="bg-zinc-900/40 backdrop-blur-md border border-zinc-850 hover:border-zinc-800 rounded-2xl p-4 flex flex-col justify-between min-h-[360px] hover:shadow-[0_4px_20px_rgba(0,0,0,0.2)] transition-all group"
                          >
                            <div className="space-y-3">
                              {/* Horizon Divider-Tag Header */}
                              <div className={`p-3 rounded-xl border ${horizon.color} flex items-center justify-between`}>
                                <div>
                                  <h4 className="text-sm font-black tracking-tight">{horizon.name}</h4>
                                  <p className="text-[9px] text-gray-400 font-sans">{horizon.subtitle}</p>
                                </div>
                                {totalAct > 0 && (
                                  <span className="text-[10px] font-mono font-bold bg-zinc-950 px-2 py-0.5 rounded-md">
                                    {doneAct}/{totalAct}
                                  </span>
                                )}
                              </div>

                              {/* Simple Horizon Progress Bar */}
                              {totalAct > 0 && (
                                <div className="w-full bg-zinc-950 h-1 rounded-full overflow-hidden border border-zinc-900">
                                  <div
                                    className={`${horizon.progressColor} h-full transition-all duration-300`}
                                    style={{ width: `${horizonPct}%` }}
                                  />
                                </div>
                              )}

                              {/* Actions Checklist list */}
                              <div className="space-y-1.5 max-h-[220px] overflow-y-auto custom-scrollbar pr-1 pt-1">
                                {horizonActions.length === 0 ? (
                                  <div className="text-center py-8 text-zinc-600 text-[10px] italic font-sans">
                                    Sem ações definidas. Adicione-as abaixo!
                                  </div>
                                ) : (
                                  horizonActions.map((act) => (
                                    <div
                                      key={act.id}
                                      className="flex items-center justify-between gap-1 p-2 bg-zinc-950/20 hover:bg-zinc-950/50 rounded-lg border border-zinc-900 text-xs group/item transition-colors"
                                    >
                                      <label className="flex items-start gap-2 cursor-pointer flex-1 select-none py-0.5">
                                        <div className="relative flex items-center justify-center shrink-0 mt-0.5">
                                          <input
                                            type="checkbox"
                                            checked={act.completed}
                                            onChange={() => handleToggleTimelineAction(activePlan.id, act.id)}
                                            className="sr-only"
                                          />
                                          <div
                                            className={`w-3.5 h-3.5 rounded border flex items-center justify-center transition-all duration-200 ${
                                              act.completed
                                                ? 'bg-gradient-to-br from-orange-500 to-amber-600 border-orange-500 shadow-sm shadow-orange-500/20 text-black scale-105'
                                                : 'border-zinc-800 hover:border-orange-500/50 bg-zinc-950/80'
                                            }`}
                                          >
                                            {act.completed && (
                                              <svg
                                                className="w-2.5 h-2.5 stroke-black stroke-[3]"
                                                fill="none"
                                                viewBox="0 0 24 24"
                                                stroke="currentColor"
                                              >
                                                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                                              </svg>
                                            )}
                                          </div>
                                        </div>
                                        <span className={`text-[11px] leading-tight break-words font-sans ${
                                          act.completed ? 'text-zinc-500 line-through' : 'text-zinc-200'
                                        }`}>
                                          {act.text}
                                        </span>
                                      </label>

                                      <button
                                        onClick={() => handleRemoveTimelineAction(activePlan.id, act.id)}
                                        className="text-zinc-600 hover:text-red-400 p-1 opacity-0 group-hover/item:opacity-100 focus:opacity-100 transition-opacity"
                                        title="Remover"
                                      >
                                        <Trash2 className="h-3 w-3" />
                                      </button>
                                    </div>
                                  ))
                                )}
                              </div>
                            </div>

                            {/* Add Action Input Box */}
                            <div className="mt-4 pt-3 border-t border-zinc-900/60">
                              <div className="flex gap-1.5">
                                <input
                                  type="text"
                                  placeholder="Nova ação..."
                                  value={actionTextValue}
                                  onChange={(e) => setNewActionTexts(prev => ({ ...prev, [key]: e.target.value }))}
                                  onKeyDown={(e) => {
                                    if (e.key === 'Enter') {
                                      handleAddTimelineAction(activePlan.id, horizon.id as any);
                                    }
                                  }}
                                  className="flex-1 bg-zinc-950 border border-zinc-850 rounded-lg px-2 py-1.5 text-[11px] text-white focus:outline-none focus:border-orange-500/40 placeholder-zinc-600"
                                />
                                <button
                                  onClick={() => handleAddTimelineAction(activePlan.id, horizon.id as any)}
                                  className="p-1.5 bg-orange-500/10 hover:bg-orange-500 text-orange-400 hover:text-white border border-orange-500/20 hover:border-orange-500 rounded-lg transition-all shrink-0"
                                  title="Adicionar Ação"
                                >
                                  <Plus className="h-3.5 w-3.5" />
                                </button>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })()}
            </div>
          )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* 4. DETAIL AREA VIEW (Parallax visual + Timeline) */}
      <AnimatePresence mode="wait">
        {selectedArea && (
          <motion.div
            key={`detail-${selectedArea}`}
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            transition={{ duration: 0.25 }}
            className="space-y-6"
          >
          {/* Breadcrumb & back action */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                setSelectedArea(null);
                setIsAdding(false);
              }}
              className="flex items-center gap-1.5 text-xs text-gray-400 hover:text-white transition-colors bg-zinc-900/60 px-3 py-1.5 rounded-lg border border-zinc-800"
            >
              <ChevronLeft className="h-4 w-4" /> Voltar para Áreas
            </button>
            <span className="text-zinc-600 text-xs">/</span>
            <span className="text-xs text-orange-500 font-bold uppercase tracking-wider">{selectedArea}</span>
          </div>

          {/* Area Cover Banner */}
          <div className="relative h-64 md:h-80 w-full rounded-2xl overflow-hidden border border-zinc-800 shadow-lg group">
            <img 
              src={areaImages[selectedArea] || defaultAreaImages[selectedArea]} 
              alt={selectedArea} 
              className="w-full h-full object-cover"
              referrerPolicy="no-referrer"
            />
            {/* Ambient gradients */}
            <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-zinc-950/40 to-transparent" />
            
            {/* Banner text info */}
            <div className="absolute bottom-6 left-6 right-6 flex flex-col md:flex-row md:items-end justify-between gap-4">
              <div>
                <h2 className="text-3xl font-black text-white font-serif tracking-tight">{selectedArea}</h2>
                <p className="text-gray-300 text-xs mt-1">
                  Gerencie suas metas de {selectedArea.toLowerCase()} e acompanhe o registro cronológico na linha do tempo.
                </p>
              </div>

              {/* Cover customization controls */}
              <div className="relative">
                <button
                  onClick={() => setIsChangingImage(!isChangingImage)}
                  className="bg-zinc-950/80 backdrop-blur-sm hover:bg-zinc-900 border border-zinc-850 hover:border-orange-500/40 text-xs text-white font-bold px-3.5 py-2 rounded-xl flex items-center gap-2 shadow-lg transition-all"
                >
                  <ImageIcon className="h-3.5 w-3.5 text-orange-500" />
                  Alterar Imagem de Capa
                </button>
              </div>
            </div>

            {/* Change Cover Form Overlay */}
            <AnimatePresence>
              {isChangingImage && (
                <motion.div 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="absolute inset-0 bg-zinc-950/95 backdrop-blur-sm p-6 flex flex-col justify-center items-center"
                >
                  <div className="max-w-lg w-full space-y-4">
                    <div className="text-center">
                      <h3 className="text-sm font-black text-white uppercase tracking-wider">Mudar Imagem: {selectedArea}</h3>
                      <p className="text-[10px] text-gray-400 mt-1">Insira um link da web ou faça o upload de um arquivo local.</p>
                    </div>

                    <div className="space-y-3 bg-zinc-900 p-4 rounded-xl border border-zinc-850">
                      {/* URL option */}
                      <div className="space-y-1.5">
                        <label className="text-[9px] text-gray-400 font-bold block uppercase flex items-center gap-1">
                          <LinkIcon className="h-3 w-3 text-orange-500" /> Link da Imagem (URL)
                        </label>
                        <div className="flex gap-2">
                          <input 
                            type="text"
                            placeholder="https://exemplo.com/imagem.jpg"
                            value={imageUrlInput}
                            onChange={(e) => setImageUrlInput(e.target.value)}
                            className="flex-1 bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-1.5 text-xs text-white focus:outline-none focus:border-orange-500/50"
                          />
                          <button
                            onClick={() => handleSaveImageUrl(selectedArea)}
                            className="bg-orange-500 hover:bg-orange-600 text-white font-bold text-xs px-4 py-1.5 rounded-lg transition-colors"
                          >
                            Aplicar
                          </button>
                        </div>
                      </div>

                      <div className="relative flex py-1 items-center">
                        <div className="flex-grow border-t border-zinc-800"></div>
                        <span className="flex-shrink mx-3 text-[10px] text-gray-500 font-bold uppercase">Ou</span>
                        <div className="flex-grow border-t border-zinc-800"></div>
                      </div>

                      {/* Upload option */}
                      <div className="space-y-1.5">
                        <label className="text-[9px] text-gray-400 font-bold block uppercase flex items-center gap-1">
                          <Upload className="h-3 w-3 text-orange-500" /> Upload de Arquivo Local
                        </label>
                        <input 
                          type="file"
                          accept="image/*"
                          ref={fileInputRef}
                          onChange={(e) => handleFileUpload(e, selectedArea)}
                          className="hidden"
                        />
                        <div
                          onClick={() => fileInputRef.current?.click()}
                          onDragOver={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                          }}
                          onDrop={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            const file = e.dataTransfer.files?.[0];
                            if (file && file.type.startsWith('image/')) {
                              const reader = new FileReader();
                              reader.onloadend = () => {
                                const base64String = reader.result as string;
                                setAreaImages(prev => ({
                                  ...prev,
                                  [selectedArea]: base64String
                                }));
                                setIsChangingImage(false);
                              };
                              reader.readAsDataURL(file);
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
                                    const reader = new FileReader();
                                    reader.onloadend = () => {
                                      const base64String = reader.result as string;
                                      setAreaImages(prev => ({
                                        ...prev,
                                        [selectedArea]: base64String
                                      }));
                                      setIsChangingImage(false);
                                    };
                                    reader.readAsDataURL(file);
                                  }
                                }
                              }
                            }
                          }}
                          tabIndex={0}
                          className="w-full bg-zinc-950 hover:bg-zinc-900 border border-zinc-800 hover:border-orange-500/30 text-xs text-gray-300 py-3 rounded-lg flex flex-col items-center justify-center gap-1 border-dashed cursor-pointer outline-none focus:border-orange-500 transition-all text-center select-none"
                        >
                          <div className="flex items-center gap-2">
                            <Upload className="h-4 w-4 text-orange-500" /> 
                            <span>Selecionar ou Arrastar Imagem</span>
                          </div>
                          <span className="text-[9px] text-zinc-500 font-mono">Suporta colar direto com <span className="text-orange-500 font-bold">Ctrl + V</span></span>
                        </div>
                      </div>
                    </div>

                    <div className="flex justify-end gap-2">
                      <button
                        onClick={() => {
                          setIsChangingImage(false);
                          setImageUrlInput('');
                        }}
                        className="text-xs text-gray-400 hover:text-white px-4 py-1.5 transition-colors"
                      >
                        Cancelar
                      </button>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Grid Layout: Goals & Notes on Left, Completed Goals Timeline on Right */}
          <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
            
            {/* LEFT COLUMN: Goals Management (2 cols) */}
            <div className="xl:col-span-2 space-y-6">
              <FormAndListContainer 
                activeGoals={activeGoals}
                completedGoals={completedGoals}
                expandedGoalId={expandedGoalId}
                toggleExpandGoal={toggleExpandGoal}
                handleActionIncrement={handleActionIncrement}
                handleActionDecrement={handleActionDecrement}
                handleDeleteGoal={handleDeleteGoal}
                todayStr={todayStr}
                formatDateBr={formatDateBr}
                noteInputs={noteInputs}
                setNoteInputs={setNoteInputs}
                handleAddGoalNote={handleAddGoalNote}
                handleRemoveGoalNote={handleRemoveGoalNote}
                LIFE_AREAS={LIFE_AREAS}
                showCategoryTag={false}
              />
            </div>

            {/* RIGHT COLUMN: Timeline do Histórico de Conclusão */}
            <div className="bg-zinc-900/30 p-5 rounded-2xl border border-zinc-850 h-fit space-y-5">
              <div className="flex items-center gap-2 border-b border-zinc-850 pb-2.5">
                <History className="h-4 w-4 text-orange-500" />
                <h3 className="text-xs font-black text-white uppercase tracking-wider">Timeline de Conquistas</h3>
              </div>

              {completedGoals.length === 0 ? (
                <div className="text-center py-10 px-4">
                  <Award className="h-8 w-8 text-zinc-600 mx-auto stroke-1 mb-2 animate-pulse" />
                  <p className="text-xs text-zinc-400 font-bold">Nenhum registro ainda</p>
                  <p className="text-[10px] text-zinc-500 mt-1 leading-relaxed">
                    Alcance os objetivos de {selectedArea.toLowerCase()} para desbloquear eventos na linha do tempo.
                  </p>
                </div>
              ) : (
                <div className="relative pl-4 space-y-6 before:absolute before:left-[9px] before:top-2 before:bottom-2 before:w-[1px] before:bg-zinc-800">
                  {completedGoals.map((g) => (
                    <div key={g.id} className="relative group">
                      {/* Timeline Dot Node */}
                      <div className="absolute -left-[19px] top-0.5 p-0.5 bg-[#040405] rounded-full">
                        <div className="h-2 w-2 rounded-full bg-emerald-500 ring-4 ring-emerald-500/10 shadow-[0_0_8px_rgba(16,185,129,0.3)]" />
                      </div>

                      {/* Content Card */}
                      <div className="space-y-1.5">
                        <span className="text-[9px] text-emerald-500 font-bold font-mono tracking-wider block bg-emerald-500/10 w-fit px-1.5 py-0.5 rounded">
                          {formatTimelineDate(g.completedAt || g.createdAt)}
                        </span>
                        
                        <h4 className="text-xs font-bold text-white group-hover:text-orange-400 transition-colors">
                          {g.title}
                        </h4>

                        <div className="flex items-center gap-3 text-[10px] text-zinc-500">
                          <span>Concluída em {g.actionsTotal}/{g.actionsTotal} etapas</span>
                          <span>•</span>
                          <span className="text-orange-500 font-bold font-mono">+{g.xpReward} XP ganho</span>
                        </div>

                        {/* Notes nested in timeline */}
                        {g.notes && g.notes.length > 0 && (
                          <div className="mt-2 bg-zinc-900/60 p-2.5 rounded-lg border border-zinc-850/60 space-y-1.5">
                            <span className="text-[8px] text-zinc-500 font-bold uppercase tracking-widest block">Registro de etapas:</span>
                            <div className="space-y-1 max-h-[110px] overflow-y-auto custom-scrollbar">
                              {g.notes.map((note) => (
                                <div key={note.id} className="text-[10px] text-zinc-300 flex items-start gap-1 font-sans">
                                  <span className="text-zinc-600">[{formatDateBr(note.date)}]</span>
                                  <span className="text-zinc-400">Passo {note.actionIndex || '✓'}:</span>
                                  <span className="text-zinc-200">{note.text}</span>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

          </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// Inner modular component to handle Goals lists cleanly
interface FormAndListContainerProps {
  activeGoals: Goal[];
  completedGoals: Goal[];
  expandedGoalId: string | null;
  toggleExpandGoal: (id: string) => void;
  handleActionIncrement: (id: string) => void;
  handleActionDecrement: (id: string) => void;
  handleDeleteGoal: (id: string, completed: boolean, xpReward: number) => void;
  todayStr: string;
  formatDateBr: (dateStr?: string) => string;
  noteInputs: Record<string, string>;
  setNoteInputs: React.Dispatch<React.SetStateAction<Record<string, string>>>;
  handleAddGoalNote: (goalId: string) => void;
  handleRemoveGoalNote: (goalId: string, noteId: string) => void;
  LIFE_AREAS: string[];
  showCategoryTag?: boolean;
}

function FormAndListContainer({
  activeGoals,
  completedGoals,
  expandedGoalId,
  toggleExpandGoal,
  handleActionIncrement,
  handleActionDecrement,
  handleDeleteGoal,
  todayStr,
  formatDateBr,
  noteInputs,
  setNoteInputs,
  handleAddGoalNote,
  handleRemoveGoalNote,
  showCategoryTag
}: FormAndListContainerProps) {
  return (
    <div className="space-y-6">
      
      {/* ACTIVE GOALS Section */}
      <div className="space-y-3.5">
        <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-widest flex items-center gap-1.5">
          <Target className="h-3.5 w-3.5 text-orange-500" />
          Metas em Progresso ({activeGoals.length})
        </h3>

        <div className="space-y-3">
          {activeGoals.length === 0 ? (
            <div className="text-center py-10 bg-zinc-900/10 rounded-xl border border-zinc-900">
              <p className="text-xs text-gray-500">Nenhuma meta ativa cadastrada nesta área.</p>
            </div>
          ) : (
            activeGoals.map((goal) => {
              const progress = Math.round((goal.actionsDone / goal.actionsTotal) * 100);
              const isExpanded = expandedGoalId === goal.id;
              
              return (
                <div key={goal.id} className="bg-zinc-900/40 rounded-xl border border-zinc-800 overflow-hidden shadow-sm hover:border-zinc-750 transition-colors">
                  <div 
                    onClick={() => toggleExpandGoal(goal.id)}
                    className="p-4 flex items-center justify-between gap-4 cursor-pointer hover:bg-zinc-900/60 transition-all"
                  >
                    <div className="flex items-center gap-3">
                      <div className="p-2.5 bg-orange-500/10 rounded-lg text-orange-500 flex-shrink-0">
                        <Target className="h-4 w-4" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <h4 className="text-xs font-bold text-white font-sans">{goal.title}</h4>
                          
                          {showCategoryTag && goal.area && (
                            <span className="text-[8px] bg-zinc-800 text-zinc-300 border border-zinc-700 px-1.5 py-0.5 rounded font-mono uppercase tracking-wider">
                              {goal.area}
                            </span>
                          )}
                          
                          {goal.isRecurring && (
                            <span className="text-[8px] bg-orange-500/10 text-orange-400 border border-orange-500/20 px-1.5 py-0.5 rounded font-mono uppercase tracking-wide">
                              Diária
                            </span>
                          )}
                          {goal.isRecurring && (goal.streak || 0) > 0 && (
                            <span className="text-[8px] bg-amber-500/10 text-amber-400 border border-amber-500/20 px-1.5 py-0.5 rounded font-mono uppercase tracking-wide flex items-center gap-0.5">
                              <Flame className="h-2.5 w-2.5 fill-amber-500/20 text-amber-500" /> {goal.streak} dias
                            </span>
                          )}
                        </div>

                        <p className="text-[10px] text-gray-500 mt-1 flex items-center gap-2 flex-wrap">
                          <span>{goal.actionsDone}/{goal.actionsTotal} ações concluídas</span>
                          <span>•</span>
                          <span className="flex items-center gap-1">
                            <Calendar className="h-3 w-3 text-zinc-600" />
                            Criada em {formatDateBr(goal.createdAt)}
                          </span>
                          <span>•</span>
                          <span className="flex items-center gap-1">
                            <History className="h-3 w-3 text-orange-500" />
                            Editada em {formatDateBr(goal.updatedAt || goal.createdAt)}
                          </span>

                          {goal.deadline && (
                            <>
                              <span>•</span>
                              <span className="text-rose-500 flex items-center gap-1 font-mono">
                                <Clock className="h-3 w-3" />
                                Prazo: {formatDateBr(goal.deadline)}
                              </span>
                            </>
                          )}

                          {goal.isRecurring && goal.lastCompletedDate === todayStr && (
                            <span className="text-[8px] text-emerald-400 font-bold bg-emerald-500/10 px-1.5 py-0.5 rounded border border-emerald-500/10">Completada Hoje!</span>
                          )}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-4">
                      <span className="text-xs font-bold text-orange-500 font-mono">{progress}%</span>
                      {isExpanded ? <ChevronUp className="h-4 w-4 text-gray-500" /> : <ChevronDown className="h-4 w-4 text-gray-500" />}
                    </div>
                  </div>

                  {/* Expanded goal details / interactive steps / notes */}
                  <AnimatePresence>
                    {isExpanded && (
                      <motion.div 
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="px-4 pb-4 border-t border-zinc-900 pt-3 bg-zinc-950/40 space-y-4"
                      >
                        {/* 1. Interactive step slider */}
                        <div className="flex items-center justify-between bg-zinc-900/30 p-2 rounded-xl border border-zinc-850">
                          <span className="text-[9px] text-gray-400 font-bold uppercase tracking-wide">Ações de Progresso:</span>
                          <div className="flex items-center gap-2">
                            <button
                              onClick={(e) => { e.stopPropagation(); handleActionDecrement(goal.id); }}
                              className="text-gray-500 hover:text-orange-500 transition-colors"
                              title="Remover etapa"
                            >
                              <MinusCircle className="h-5 w-5" />
                            </button>
                            <button
                              onClick={(e) => { e.stopPropagation(); handleActionIncrement(goal.id); }}
                              className="text-orange-500 hover:text-orange-400 transition-colors"
                              title="Marcar etapa"
                            >
                              <PlusCircle className="h-5 w-5" />
                            </button>
                          </div>
                        </div>

                        {/* Custom visual stepper bar */}
                        <div className="flex gap-1.5 overflow-x-auto py-0.5">
                          {Array.from({ length: goal.actionsTotal }).map((_, i) => (
                            <div 
                              key={i} 
                              className={`h-2 flex-1 rounded min-w-[8px] transition-all ${
                                i < goal.actionsDone 
                                  ? 'bg-orange-500 shadow-[0_0_8px_rgba(249,115,22,0.3)]' 
                                  : 'bg-zinc-850'
                              }`} 
                            />
                          ))}
                        </div>

                        {/* 2. Step Notes Form ("notas no progresso das etapas") */}
                        <div className="space-y-2 pt-2 border-t border-zinc-900">
                          <label className="text-[9px] text-gray-400 font-bold block uppercase flex items-center gap-1">
                            <MessageSquare className="h-3 w-3 text-orange-500" /> Registrar Nota do Progresso Atual
                          </label>
                          <div className="flex gap-2">
                            <input 
                              type="text"
                              placeholder="Adicione notas (ex: Completei a aula de rotas, bati o tempo do cardio)..."
                              value={noteInputs[goal.id] || ''}
                              onChange={(e) => setNoteInputs(prev => ({ ...prev, [goal.id]: e.target.value }))}
                              className="flex-1 bg-zinc-950 border border-zinc-850 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-orange-500/50"
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') {
                                  e.preventDefault();
                                  handleAddGoalNote(goal.id);
                                }
                              }}
                            />
                            <button
                              type="button"
                              onClick={() => handleAddGoalNote(goal.id)}
                              className="bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 hover:border-orange-500/40 text-orange-500 font-bold text-xs px-3.5 py-2 rounded-lg transition-colors flex items-center gap-1.5"
                            >
                              + Nota
                            </button>
                          </div>
                        </div>

                        {/* 3. Steps notes log history list */}
                        {goal.notes && goal.notes.length > 0 && (
                          <div className="space-y-1.5 bg-zinc-950/85 p-3 rounded-xl border border-zinc-900/60 max-h-40 overflow-y-auto custom-scrollbar">
                            <span className="text-[8px] text-zinc-500 font-bold uppercase tracking-widest block">Histórico de anotações:</span>
                            <div className="space-y-2">
                              {goal.notes.map((note) => (
                                <div key={note.id} className="text-xs text-zinc-300 flex items-start justify-between gap-4 group/note">
                                  <div className="flex items-start gap-1.5 flex-1">
                                    <span className="text-zinc-500 text-[10px] font-mono font-bold">[{formatDateBr(note.date)}]</span>
                                    <span className="text-orange-500 text-[10px] font-mono font-semibold">Passo {note.actionIndex}:</span>
                                    <span className="text-zinc-200 leading-relaxed font-sans">{note.text}</span>
                                  </div>
                                  <button
                                    onClick={() => handleRemoveGoalNote(goal.id, note.id)}
                                    className="text-zinc-600 hover:text-red-500 opacity-0 group-hover/note:opacity-100 transition-opacity"
                                    title="Remover nota"
                                  >
                                    <Trash2 className="h-3 w-3" />
                                  </button>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Delete & stats block */}
                        <div className="flex justify-between items-center text-[10px] pt-2 border-t border-zinc-900/60">
                          <span className="text-gray-500">Recompensa final: <span className="text-orange-500 font-bold">+{goal.xpReward} XP</span></span>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              if (window.confirm("Deseja realmente excluir esta meta permanente?")) {
                                handleDeleteGoal(goal.id, goal.completed, goal.xpReward);
                              }
                            }}
                            className="text-red-500 hover:underline flex items-center gap-1 font-semibold"
                          >
                            <Trash2 className="h-3 w-3" /> Excluir Meta
                          </button>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* METAS CONCLUÍDAS Section */}
      <div className="space-y-3.5 pt-2">
        <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-widest flex items-center gap-1.5">
          <CheckCircle className="h-3.5 w-3.5 text-emerald-500" />
          Alcançadas & Concluídas ({completedGoals.length})
        </h3>

        <div className="space-y-2">
          {completedGoals.length === 0 ? (
            <div className="text-center py-8 bg-zinc-900/10 rounded-xl border border-zinc-900">
              <p className="text-xs text-gray-500">Nenhuma meta arquivada como concluída nesta área.</p>
            </div>
          ) : (
            completedGoals.map((goal) => (
              <motion.div
                key={goal.id}
                className="p-4 bg-zinc-900/20 border border-emerald-500/15 rounded-xl flex items-center justify-between gap-4 group hover:border-emerald-500/35 transition-colors"
                layout
              >
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-emerald-500/10 text-emerald-400 rounded-full border border-emerald-500/20">
                    <CheckCircle className="h-4 w-4" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-gray-400 line-through font-sans">{goal.title}</h4>
                    <p className="text-[9px] text-emerald-500 font-bold font-mono mt-0.5 flex items-center gap-2 flex-wrap">
                      <span>✓ Meta alcançada em {formatDateBr(goal.completedAt || goal.createdAt)}!</span>
                      {goal.notes && goal.notes.length > 0 && (
                        <span className="text-gray-500 font-sans">({goal.notes.length} anotações arquivadas)</span>
                      )}
                    </p>
                  </div>
                </div>

                <button
                  onClick={() => {
                    if (window.confirm("Deseja excluir permanentemente do seu histórico de conquistas?")) {
                      handleDeleteGoal(goal.id, goal.completed, goal.xpReward);
                    }
                  }}
                  className="text-zinc-600 hover:text-red-500 transition-colors p-1.5 opacity-0 group-hover:opacity-100 focus:opacity-100"
                  title="Excluir do Histórico"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </motion.div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
