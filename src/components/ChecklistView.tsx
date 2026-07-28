import React, { useState, useEffect } from 'react';
import { 
  CheckSquare, 
  Plus, 
  Trash2, 
  Zap, 
  Trophy, 
  Award,
  Flame,
  Check,
  Clock,
  RefreshCw,
  Sun,
  Moon,
  List,
  ChevronDown,
  ChevronUp,
  ChevronLeft,
  ChevronRight,
  Book,
  BookOpen,
  Calendar,
  AlertCircle,
  HelpCircle,
  Sparkles,
  TrendingUp,
  Sliders,
  Play,
  X,
  LayoutGrid,
  Briefcase,
  Dumbbell,
  Gamepad2,
  Coffee,
  MoreHorizontal,
  Edit3,
  Bell,
  AlertTriangle,
  Tag
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { DailyTask, SubTask, BookTracker, BibleTracker, RoutineItem, YearlyBook, WeeklyReview, CalendarNote } from '../types';
import { syncBookWithYearlyBooks, calculateReadingInterval, formatDateBR } from '../utils/bookUtils';

interface ChecklistViewProps {
  dailyTasks: DailyTask[];
  setDailyTasks: React.Dispatch<React.SetStateAction<DailyTask[]>>;
  streak: number;
  addXp: (amount: number) => void;
  xpTotal: number;
  bookTracker: BookTracker;
  setBookTracker: React.Dispatch<React.SetStateAction<BookTracker>>;
  bibleTracker: BibleTracker;
  setBibleTracker: React.Dispatch<React.SetStateAction<BibleTracker>>;
  activeTab?: 'checklist' | 'rotina';
  setActiveTab?: (tab: 'checklist' | 'rotina') => void;
  gridRoutine?: Record<string, { text: string; color?: string; startTime?: string; endTime?: string }>;
  setGridRoutine?: (newGrid: any) => void;
  routine?: RoutineItem[];
  setRoutine?: React.Dispatch<React.SetStateAction<RoutineItem[]>>;
  books?: YearlyBook[];
  setBooks?: React.Dispatch<React.SetStateAction<YearlyBook[]>>;
  weeklyReviews?: WeeklyReview[];
  setWeeklyReviews?: React.Dispatch<React.SetStateAction<WeeklyReview[]>>;
  calendarNotes?: CalendarNote[];
  setCalendarNotes?: React.Dispatch<React.SetStateAction<CalendarNote[]>>;
}

// Bible total chapters standard (1189 is standard for Protestant bible)
const BIBLE_TOTAL_CHAPTERS = 1189;

// Helper to get formatted local date (YYYY-MM-DD)
const getTodayDateStr = () => {
  return new Date().toISOString().split('T')[0];
};

const parseLocalDate = (dateStr: string) => {
  const [year, month, day] = dateStr.split('-').map(Number);
  return new Date(year, month - 1, day, 12, 0, 0);
};

const calculateStreak = (history: { date: string }[]) => {
  if (!history || history.length === 0) return 0;
  const uniqueDates = Array.from(new Set(history.map(h => h.date))).sort().reverse();
  if (uniqueDates.length === 0) return 0;
  
  const todayStr = getTodayDateStr();
  const todayDate = parseLocalDate(todayStr);
  const yesterdayDate = new Date(todayDate);
  yesterdayDate.setDate(yesterdayDate.getDate() - 1);
  const yesterdayStr = yesterdayDate.toISOString().split('T')[0];
  
  const mostRecent = uniqueDates[0];
  if (mostRecent !== todayStr && mostRecent !== yesterdayStr) {
    return 0; // broken
  }
  
  let streak = 1;
  for (let i = 1; i < uniqueDates.length; i++) {
    const dateA = parseLocalDate(uniqueDates[i - 1]);
    const dateB = parseLocalDate(uniqueDates[i]);
    const diffTime = dateA.getTime() - dateB.getTime();
    const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24));
    if (diffDays === 1) {
      streak++;
    } else {
      break;
    }
  }
  return streak;
};

const getHeatmapData = (history: any[], isBook: boolean) => {
  const data = [];
  const today = new Date();
  
  for (let i = 27; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(today.getDate() - i);
    const dateStr = d.toISOString().split('T')[0];
    
    // Find logs for this day
    const dayLogs = history.filter(h => h.date === dateStr);
    const totalRead = dayLogs.reduce((sum, h) => sum + (isBook ? (h.pagesReadToday || 0) : (h.chaptersReadToday || 0)), 0);
    
    // Target for that day (or fallback)
    const target = dayLogs.length > 0 ? (dayLogs[0].dailyTarget || 1) : 1;
    
    let level = 0; // 0: no reading, 1: read some, 2: met target
    if (totalRead > 0) {
      if (totalRead >= target) {
        level = 2;
      } else {
        level = 1;
      }
    }
    
    data.push({
      date: dateStr,
      totalRead,
      target,
      level,
      dayOfWeek: d.getDay(),
      dayOfMonth: d.getDate(),
      monthLabel: d.toLocaleString('pt-BR', { month: 'short' })
    });
  }
  return data;
};

export default function ChecklistView({
  dailyTasks,
  setDailyTasks,
  streak,
  addXp,
  xpTotal,
  bookTracker,
  setBookTracker,
  bibleTracker,
  setBibleTracker,
  activeTab: propActiveTab,
  setActiveTab: propSetActiveTab,
  gridRoutine: propGridRoutine,
  setGridRoutine: propSetGridRoutine,
  routine: propRoutine,
  setRoutine: propSetRoutine,
  books: propBooks,
  setBooks: propSetBooks,
  weeklyReviews: propWeeklyReviews,
  setWeeklyReviews: propSetWeeklyReviews,
  calendarNotes,
  setCalendarNotes
}: ChecklistViewProps) {
  const [localBooks, setLocalBooks] = useState<YearlyBook[]>([]);
  const actualBooks = propBooks || localBooks;
  const actualSetBooks = propSetBooks || setLocalBooks;
  const actualWeeklyReviews = propWeeklyReviews;
  const actualSetWeeklyReviews = propSetWeeklyReviews;

  const todayStr = getTodayDateStr();
  const [selectedDate, setSelectedDate] = useState<string>(todayStr);
  const isToday = selectedDate === todayStr;

  // Active tasks for selectedDate
  const activeTasks = (() => {
    if (selectedDate === todayStr) {
      return dailyTasks;
    }
    const note = calendarNotes?.find(n => n.date === selectedDate);
    if (note && note.checklist && note.checklist.length > 0) {
      return note.checklist;
    }
    return dailyTasks.map(t => ({
      ...t,
      completed: false,
      subtasks: t.subtasks?.map(s => ({ ...s, completed: false }))
    }));
  })();

  const updateActiveTasks = (updater: (prev: DailyTask[]) => DailyTask[]) => {
    if (selectedDate === todayStr) {
      setDailyTasks(updater);
    } else if (setCalendarNotes) {
      setCalendarNotes(prevNotes => {
        const existingIdx = prevNotes.findIndex(n => n.date === selectedDate);
        const currentList = existingIdx !== -1 && prevNotes[existingIdx].checklist && prevNotes[existingIdx].checklist.length > 0
          ? prevNotes[existingIdx].checklist!
          : dailyTasks.map(t => ({ ...t, completed: false, subtasks: t.subtasks?.map(s => ({ ...s, completed: false })) }));
        
        const newTasks = updater(currentList);
        
        if (existingIdx !== -1) {
          const updated = [...prevNotes];
          updated[existingIdx] = {
            ...updated[existingIdx],
            isDailyRecord: true,
            checklist: newTasks
          };
          return updated;
        } else {
          return [
            ...prevNotes,
            {
              id: 'cn-' + Math.random().toString(36).substring(2, 9),
              date: selectedDate,
              title: `Registro Diário (${selectedDate})`,
              content: '',
              isDailyRecord: true,
              checklist: newTasks
            }
          ];
        }
      });
    }
  };
  const [newTaskText, setNewTaskText] = useState('');
  const [newTaskCategory, setNewTaskCategory] = useState('O Básico');
  const [newTaskIsRecurring, setNewTaskIsRecurring] = useState(true);
  const [newTaskPeriod, setNewTaskPeriod] = useState<'manha' | 'noite' | 'geral'>('geral');
  const [isAdding, setIsAdding] = useState(false);
  const [newTaskSubtasks, setNewTaskSubtasks] = useState<string[]>([]);
  const [currentSubtaskText, setCurrentSubtaskText] = useState('');
  const [expandedTasks, setExpandedTasks] = useState<Record<string, boolean>>({});

  // Editing Task Modal & Delete Confirm States
  const [editingTask, setEditingTask] = useState<DailyTask | null>(null);
  const [editText, setEditText] = useState('');
  const [editCategory, setEditCategory] = useState('O Básico');
  const [editPeriod, setEditPeriod] = useState<'manha' | 'noite' | 'geral'>('geral');
  const [editIsRecurring, setEditIsRecurring] = useState(true);
  const [editReminderTime, setEditReminderTime] = useState('');
  const [editSubtasks, setEditSubtasks] = useState<SubTask[]>([]);
  const [editSubtaskInput, setEditSubtaskInput] = useState('');
  const [showDeleteConfirmModal, setShowDeleteConfirmModal] = useState(false);

  // Notification scheduler for tasks with reminderTime
  useEffect(() => {
    if (typeof window === 'undefined' || typeof Notification === 'undefined') return;

    const checkReminders = () => {
      const now = new Date();
      const currentHHMM = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
      const todayStr = now.toISOString().split('T')[0];

      dailyTasks.forEach(task => {
        if (task.reminderTime && task.reminderTime === currentHHMM && !task.completed) {
          const notifKey = `notified_${task.id}_${todayStr}_${currentHHMM}`;
          if (!localStorage.getItem(notifKey)) {
            localStorage.setItem(notifKey, '1');
            if (Notification.permission === 'granted') {
              try {
                new Notification(`Lembrete TRONUS: ${task.text}`, {
                  body: `Horário planejado: ${task.reminderTime} | Pilar: ${task.category}`,
                  icon: '/pwa_app_icon_1784938132164.jpg'
                });
              } catch (e) {
                console.warn('Could not display notification:', e);
              }
            }
          }
        }
      });
    };

    const interval = setInterval(checkReminders, 20000);
    checkReminders();
    return () => clearInterval(interval);
  }, [dailyTasks]);

  // Accordion Toggle States
  const [morningOpen, setMorningOpen] = useState(true);
  const [nightOpen, setNightOpen] = useState(true);
  const [generalOpen, setGeneralOpen] = useState(true);
  const [bookOpen, setBookOpen] = useState(false);
  const [bibleOpen, setBibleOpen] = useState(false);

  // Tracker Config Dialogs
  const [showBookConfig, setShowBookConfig] = useState(false);
  const [showBibleConfig, setShowBibleConfig] = useState(false);

  // Book Config form states
  const [bookFormName, setBookFormName] = useState(bookTracker?.bookName || 'Hábitos Atômicos');
  const [bookFormTotalPages, setBookFormTotalPages] = useState(bookTracker?.totalPages || 250);
  const [bookFormDeadline, setBookFormDeadline] = useState(bookTracker?.deadlineDays || 7);
  const [bookFormPagesRead, setBookFormPagesRead] = useState(bookTracker?.pagesRead || 0);

  // Bible Config form states
  const [bibleFormMode, setBibleFormMode] = useState<'vezes' | 'capitulos'>('vezes');
  const [bibleFormVezes, setBibleFormVezes] = useState(bibleTracker?.vezesNoAno || 1);
  const [bibleFormCapitulos, setBibleFormCapitulos] = useState(bibleTracker?.capitulosPorDia || 4);
  const [bibleFormJaLidos, setBibleFormJaLidos] = useState(bibleTracker?.capitulosJaLidos || 0);

  // Daily Logging Input states
  const [pagesLoggedToday, setPagesLoggedToday] = useState('');
  const [chaptersLoggedToday, setChaptersLoggedToday] = useState('');

  // ----------------------------------------------------
  // GRID ROUTINE STATE & CONFIG (First Image)
  // ----------------------------------------------------
  const [localActiveTab, setLocalActiveTab] = useState<'checklist' | 'rotina'>('checklist');
  const activeTab = propActiveTab !== undefined ? propActiveTab : localActiveTab;
  const setActiveTab = propSetActiveTab !== undefined ? propSetActiveTab : setLocalActiveTab;

  const HOURS = [
    '06:00', '07:00', '08:00', '09:00', '10:00', '11:00', '12:00',
    '13:00', '14:00', '15:00', '16:00', '17:00', '18:00',
    '19:00', '20:00', '21:00', '22:00', '23:00', '24:00'
  ];

  const DAYS = [
    { id: 1, name: 'Segunda' },
    { id: 2, name: 'Terça' },
    { id: 3, name: 'Quarta' },
    { id: 4, name: 'Quinta' },
    { id: 5, name: 'Sexta' },
    { id: 6, name: 'Sábado' },
    { id: 7, name: 'Domingo' }
  ];

  const [localGridRoutine, setLocalGridRoutine] = useState<Record<string, { text: string; color?: string; startTime?: string; endTime?: string }>>(() => {
    try {
      const saved = localStorage.getItem('mbc_grid_routine');
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.error("Failed to parse mbc_grid_routine", e);
    }

    const defaultGridRoutine: Record<string, { text: string; color?: string; startTime?: string; endTime?: string }> = {};
    for (let d = 1; d <= 5; d++) {
      defaultGridRoutine[`07:00-${d}`] = { text: 'Acordar+Café', color: 'teal', startTime: '07:00', endTime: '08:00' };
      defaultGridRoutine[`08:00-${d}`] = { text: 'Deslocamento+Ler', color: 'red', startTime: '08:00', endTime: '09:00' };
      defaultGridRoutine[`09:00-${d}`] = { text: 'Trabalho', color: 'plum', startTime: '09:00', endTime: '12:00' };
      defaultGridRoutine[`10:00-${d}`] = { text: 'Trabalho', color: 'plum', startTime: '09:00', endTime: '12:00' };
      defaultGridRoutine[`11:00-${d}`] = { text: 'Trabalho', color: 'plum', startTime: '09:00', endTime: '12:00' };
      defaultGridRoutine[`12:00-${d}`] = { text: 'Almoço', color: 'brown', startTime: '12:00', endTime: '13:00' };
      defaultGridRoutine[`13:00-${d}`] = { text: 'Trabalho', color: 'plum', startTime: '13:00', endTime: '18:00' };
      defaultGridRoutine[`14:00-${d}`] = { text: 'Trabalho', color: 'plum', startTime: '13:00', endTime: '18:00' };
      defaultGridRoutine[`15:00-${d}`] = { text: 'Trabalho', color: 'plum', startTime: '13:00', endTime: '18:00' };
      defaultGridRoutine[`16:00-${d}`] = { text: 'Trabalho', color: 'plum', startTime: '13:00', endTime: '18:00' };
      defaultGridRoutine[`17:00-${d}`] = { text: 'Trabalho', color: 'plum', startTime: '13:00', endTime: '18:00' };
      defaultGridRoutine[`18:00-${d}`] = { text: 'Exercício', color: 'orange', startTime: '18:00', endTime: '19:00' };
      defaultGridRoutine[`19:00-${d}`] = { text: 'Deslocamento+Ler', color: 'red', startTime: '19:00', endTime: '20:00' };
      defaultGridRoutine[`20:00-${d}`] = { text: 'Freelance', color: 'gray', startTime: '20:00', endTime: '21:00' };
      defaultGridRoutine[`21:00-${d}`] = { text: 'Diário', color: 'blue', startTime: '21:00', endTime: '22:00' };
      defaultGridRoutine[`22:00-${d}`] = { text: 'Desligar telas', color: 'gray', startTime: '22:00', endTime: '23:00' };
      defaultGridRoutine[`23:00-${d}`] = { text: 'Dormir', color: 'gray', startTime: '23:00', endTime: '24:00' };
    }

    return defaultGridRoutine;
  });

  const gridRoutine = propGridRoutine !== undefined ? propGridRoutine : localGridRoutine;

  const saveGridRoutine = (newGrid: any) => {
    if (propSetGridRoutine) {
      propSetGridRoutine(newGrid);
    } else {
      setLocalGridRoutine(newGrid);
    }
    localStorage.setItem('mbc_grid_routine', JSON.stringify(newGrid));
  };

  const [editingCell, setEditingCell] = useState<{ hour: string; day: number } | null>(null);
  const [originalGroupKeys, setOriginalGroupKeys] = useState<string[]>([]);
  const [cellText, setCellText] = useState('');
  const [cellColor, setCellColor] = useState('gray');
  const [isAddingBlock, setIsAddingBlock] = useState(false);
  const [cellStartTime, setCellStartTime] = useState('08:00');
  const [cellEndTime, setCellEndTime] = useState('09:00');
  const [cellSelectedDays, setCellSelectedDays] = useState<number[]>([1]);
  const [showClearModal, setShowClearModal] = useState(false);

  // ----------------------------------------------------
  // Dynamic Calculation Helpers
  // ----------------------------------------------------

  // Calculate days remaining in 2026 dynamically
  const getDaysRemainingInYear = () => {
    const today = new Date();
    const endOfYear = new Date(today.getFullYear(), 11, 31);
    const diffTime = Math.max(0, endOfYear.getTime() - today.getTime());
    return Math.max(1, Math.ceil(diffTime / (1000 * 60 * 60 * 24)));
  };

  const daysRemainingInYear = getDaysRemainingInYear();

  // Time-blocking helper functions
  const getNextHour = (hour: string): string => {
    const index = HOURS.indexOf(hour);
    if (index !== -1 && index < HOURS.length - 1) {
      return HOURS[index + 1];
    }
    const [h, m] = hour.split(':').map(Number);
    const nextH = (h + 1) % 24;
    return `${String(nextH).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
  };

  const getCellBlockInfo = (hour: string, dayId: number) => {
    const exactKey = `${hour}-${dayId}`;
    const block = gridRoutine[exactKey];
    if (block) {
      const startIdx = HOURS.indexOf(hour);
      const endHour = block.endTime || getNextHour(hour);
      const endIdx = HOURS.indexOf(endHour);
      let rowSpan = 1;
      if (startIdx !== -1 && endIdx !== -1 && endIdx > startIdx) {
        rowSpan = endIdx - startIdx;
      }
      return {
        type: 'start' as const,
        block,
        rowSpan
      };
    }

    const currentIdx = HOURS.indexOf(hour);
    if (currentIdx > 0) {
      for (let i = 0; i < currentIdx; i++) {
        const earlierHour = HOURS[i];
        const earlierKey = `${earlierHour}-${dayId}`;
        const b = gridRoutine[earlierKey];
        if (b) {
          const startIdx = HOURS.indexOf(earlierHour);
          const endHour = b.endTime || getNextHour(earlierHour);
          const endIdx = HOURS.indexOf(endHour);
          if (startIdx !== -1 && endIdx !== -1 && startIdx <= currentIdx && endIdx > currentIdx) {
            return {
              type: 'covered' as const,
              block: b
            };
          }
        }
      }
    }

    return { type: 'empty' as const };
  };

  const getBlockColorClasses = (colorOrCategory: string) => {
    const norm = colorOrCategory?.toLowerCase() || '';
    if (norm === 'trabalho' || norm === 'plum') {
      return 'bg-indigo-950/70 text-indigo-300 border-indigo-500/40 hover:bg-indigo-900/30';
    }
    if (norm === 'exercício' || norm === 'exercicio' || norm === 'orange') {
      return 'bg-emerald-950/70 text-emerald-300 border-emerald-500/40 hover:bg-emerald-900/30';
    }
    if (norm === 'estudo' || norm === 'red') {
      return 'bg-amber-950/70 text-amber-300 border-amber-500/40 hover:bg-amber-900/30';
    }
    if (norm === 'lazer' || norm === 'pink' || norm === 'rose') {
      return 'bg-rose-950/70 text-rose-300 border-rose-500/40 hover:bg-rose-900/30';
    }
    if (norm === 'rotina' || norm === 'teal' || norm === 'blue' || norm === 'brown') {
      return 'bg-violet-950/70 text-violet-300 border-violet-500/40 hover:bg-violet-900/30';
    }
    return 'bg-zinc-900/80 text-zinc-300 border-zinc-800 hover:bg-zinc-800/30';
  };

  const getCategoryDotColor = (colorOrCategory: string) => {
    const norm = colorOrCategory?.toLowerCase() || '';
    if (norm === 'trabalho' || norm === 'plum') return 'bg-indigo-500';
    if (norm === 'exercício' || norm === 'exercicio' || norm === 'orange') return 'bg-emerald-500';
    if (norm === 'estudo' || norm === 'red') return 'bg-amber-500';
    if (norm === 'lazer' || norm === 'pink' || norm === 'rose') return 'bg-rose-500';
    if (norm === 'rotina' || norm === 'teal' || norm === 'blue' || norm === 'brown') return 'bg-violet-500';
    return 'bg-zinc-500';
  };

  const getCurrentWeekDates = () => {
    const now = new Date();
    const day = now.getDay(); // 0 is Sunday, 1 is Monday...
    const diff = now.getDate() - day + (day === 0 ? -6 : 1);
    const monday = new Date(now.setDate(diff));
    
    const dates = [];
    for (let i = 0; i < 7; i++) {
      const d = new Date(monday);
      d.setDate(monday.getDate() + i);
      dates.push(d.getDate());
    }
    return dates;
  };

  const currentWeekDates = getCurrentWeekDates();

  const handleOpenEditModal = (hour: string, dayId: number, block: any) => {
    setEditingCell({ hour, day: dayId });
    setCellText(block.text);
    setCellColor(block.color || 'gray');
    const effStartTime = block.startTime || hour;
    setCellStartTime(effStartTime);
    setCellEndTime(block.endTime || getNextHour(hour));

    // Find all keys and days in gridRoutine matching this block text and start time
    const matchedKeys: string[] = [];
    const matchedDays: number[] = [];
    for (let d = 1; d <= 7; d++) {
      const key = `${effStartTime}-${d}`;
      const cell = gridRoutine[key];
      if (cell && cell.text === block.text) {
        matchedKeys.push(key);
        matchedDays.push(d);
      }
    }
    const currentKey = `${hour}-${dayId}`;
    if (!matchedKeys.includes(currentKey)) {
      matchedKeys.push(currentKey);
    }

    setOriginalGroupKeys(matchedKeys);
    setCellSelectedDays(matchedDays.length > 0 ? matchedDays : [dayId]);
    setIsAddingBlock(false);
  };

  const handleOpenCreateModal = (hour: string, dayId: number) => {
    setEditingCell(null);
    setOriginalGroupKeys([]);
    setCellText('');
    setCellColor('Rotina');
    setCellStartTime(hour);
    setCellEndTime(getNextHour(hour));
    setCellSelectedDays([dayId]);
    setIsAddingBlock(true);
  };

  // Book Tracker calculations
  const getBookMetrics = () => {
    const total = bookTracker?.totalPages || 250;
    const read = bookTracker?.pagesRead || 0;
    const deadline = bookTracker?.deadlineDays || 7;
    const bookName = bookTracker?.bookName || 'Livro da Semana';

    const remainingPages = Math.max(0, total - read);

    // Calculate days elapsed
    let daysElapsed = 0;
    if (bookTracker?.startedDate) {
      const start = new Date(bookTracker.startedDate);
      const today = new Date();
      start.setHours(0, 0, 0, 0);
      today.setHours(0, 0, 0, 0);
      const diffTime = today.getTime() - start.getTime();
      daysElapsed = Math.max(0, Math.floor(diffTime / (1000 * 60 * 60 * 24)));
    }

    const remainingDays = Math.max(1, deadline - daysElapsed);
    
    // Automatically adjusted target: ceil(remaining pages / remaining days)
    const dailyTarget = Math.ceil(remainingPages / remainingDays);
    const progressPercent = Math.min(100, Math.round((read / total) * 100));

    return {
      bookName,
      total,
      read,
      deadline,
      remainingPages,
      remainingDays,
      dailyTarget,
      progressPercent
    };
  };

  const bookMetrics = getBookMetrics();

  // Bible Tracker calculations
  const getBibleMetrics = () => {
    const vezes = bibleTracker?.vezesNoAno || 1;
    const jaLidos = bibleTracker?.capitulosJaLidos || 0;
    const lastReadDate = bibleTracker?.lastReadDate || '';
    const readToday = bibleTracker?.lastReadDate === getTodayDateStr() ? bibleTracker?.chaptersReadToday || 0 : 0;

    const totalToRead = BIBLE_TOTAL_CHAPTERS * vezes;
    const remainingChapters = Math.max(0, totalToRead - jaLidos);

    // Calculate standard requirements
    const wholeYearTarget = Math.ceil(totalToRead / 365);

    // Calculate adapted target based on remaining days of the year
    const adaptedDailyTarget = Math.max(1, Math.ceil(remainingChapters / daysRemainingInYear));
    const progressPercent = Math.min(100, Math.round((jaLidos / totalToRead) * 100));

    // Check plan feasibility (whole year perspective)
    let isPlanPossible = true;
    let warningMessage = '';
    let estimateRecommendation = '';

    if (bibleTracker?.capitulosPorDia) {
      const capPerDay = bibleTracker.capitulosPorDia;
      const yearlyCapability = capPerDay * 365;
      if (yearlyCapability < BIBLE_TOTAL_CHAPTERS) {
        isPlanPossible = false;
        const requiredForOneTime = Math.ceil(BIBLE_TOTAL_CHAPTERS / 365); // 4 chapters
        warningMessage = `Meta impossível! Ler ${capPerDay} capítulo(s)/dia resultará em apenas ${yearlyCapability} capítulos lidos no ano (faltariam ${BIBLE_TOTAL_CHAPTERS - yearlyCapability} capítulos para completar a Bíblia 1 vez).`;
        estimateRecommendation = `Para completar a Bíblia pelo menos uma vez no ano, você deve ler no mínimo ${requiredForOneTime} capítulos por dia (total de 1.460 capítulos no ano).`;
      } else {
        const estimatedTimes = (yearlyCapability / BIBLE_TOTAL_CHAPTERS).toFixed(2);
        estimateRecommendation = `Meta excelente! No ritmo de ${capPerDay} capítulos por dia, você lerá a Bíblia inteira aproximadamente ${estimatedTimes} vezes no ano!`;
      }
    } else {
      // Checked by Vezes no Ano
      const neededCapPerDay = Math.ceil(totalToRead / 365);
      estimateRecommendation = `Meta de ler a Bíblia ${vezes} vez(es) no ano requer em média ${neededCapPerDay} capítulos por dia durante o ano todo.`;
    }

    return {
      vezes,
      jaLidos,
      totalToRead,
      remainingChapters,
      wholeYearTarget,
      adaptedDailyTarget,
      progressPercent,
      isPlanPossible,
      warningMessage,
      estimateRecommendation,
      readToday
    };
  };

  const bibleMetrics = getBibleMetrics();

  const bookStreak = calculateStreak(bookTracker?.history || []);
  const bibleStreak = calculateStreak(bibleTracker?.history || []);

  const bookHeatmap = getHeatmapData(bookTracker?.history || [], true);
  const bibleHeatmap = getHeatmapData(bibleTracker?.history || [], false);

  // ----------------------------------------------------
  // Action Handlers
  // ----------------------------------------------------

  const handleResetForNewDay = () => {
    if (window.confirm("Deseja redefinir o checklist do dia selecionado? Isso irá desmarcar todas as tarefas e etapas.")) {
      updateActiveTasks(prev => 
        prev.map(t => ({
          ...t,
          completed: false,
          subtasks: t.subtasks?.map(s => ({ ...s, completed: false }))
        }))
      );
      if (isToday) {
        setBibleTracker(prev => ({
          ...prev,
          chaptersReadToday: 0
        }));
      }
    }
  };

  // Grouped stats calculation
  const totalTasks = activeTasks.length;
  const completedTasks = activeTasks.filter(t => t.completed).length;
  const isComboComplete = totalTasks > 0 && completedTasks === totalTasks;
  const xpEarnedToday = activeTasks
    .filter(t => t.completed)
    .reduce((acc, t) => acc + t.xpReward, 0) + (isComboComplete ? 25 : 0);

  const dateObj = parseLocalDate(selectedDate);
  const formattedDate = dateObj.toLocaleDateString('pt-BR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  });

  const handleAddTask = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTaskText.trim()) return;

    const mappedSubtasks = newTaskSubtasks.map((text) => ({
      id: 'st-' + Math.random().toString(36).substring(2, 9),
      text,
      completed: false
    }));

    const newTask: DailyTask = {
      id: Math.random().toString(36).substring(2, 9),
      text: newTaskText.trim(),
      completed: false,
      xpReward: 10,
      category: newTaskCategory,
      isRecurring: newTaskIsRecurring,
      period: newTaskPeriod,
      subtasks: mappedSubtasks,
      createdDate: selectedDate
    };

    updateActiveTasks(prev => [...prev, newTask]);
    setNewTaskText('');
    setNewTaskSubtasks([]);
    setCurrentSubtaskText('');
    setIsAdding(false);
  };

  const handleDeleteTask = (id: string, completed: boolean, xpReward: number) => {
    if (completed) {
      addXp(-xpReward);
    }
    updateActiveTasks(prev => prev.filter(t => t.id !== id));
  };

  // Helper Handlers for Editing Task Modal
  const handleOpenTaskEditModal = (task: DailyTask) => {
    setEditingTask(task);
    setEditText(task.text);
    setEditCategory(task.category || 'O Básico');
    setEditPeriod(task.period || 'geral');
    setEditIsRecurring(task.isRecurring !== false);
    setEditReminderTime(task.reminderTime || '');
    setEditSubtasks(task.subtasks ? task.subtasks.map(s => ({ ...s })) : []);
    setEditSubtaskInput('');
    setShowDeleteConfirmModal(false);
  };

  const handleAddEditSubtask = () => {
    if (!editSubtaskInput.trim()) return;
    const newSub: SubTask = {
      id: 'st-' + Math.random().toString(36).substring(2, 9),
      text: editSubtaskInput.trim(),
      completed: false
    };
    setEditSubtasks(prev => [...prev, newSub]);
    setEditSubtaskInput('');
  };

  const handleToggleEditSubtask = (subId: string) => {
    setEditSubtasks(prev =>
      prev.map(s => (s.id === subId ? { ...s, completed: !s.completed } : s))
    );
  };

  const handleRemoveEditSubtask = (subId: string) => {
    setEditSubtasks(prev => prev.filter(s => s.id !== subId));
  };

  const handleUpdateEditSubtaskText = (subId: string, text: string) => {
    setEditSubtasks(prev =>
      prev.map(s => (s.id === subId ? { ...s, text } : s))
    );
  };

  const handleSaveEditedTask = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingTask || !editText.trim()) return;

    if (editReminderTime && typeof Notification !== 'undefined' && Notification.permission === 'default') {
      Notification.requestPermission().catch(() => {});
    }

    updateActiveTasks(prevTasks =>
      prevTasks.map(t => {
        if (t.id === editingTask.id) {
          return {
            ...t,
            text: editText.trim(),
            category: editCategory,
            period: editPeriod,
            isRecurring: editIsRecurring,
            reminderTime: editReminderTime.trim() || undefined,
            subtasks: editSubtasks
          };
        }
        return t;
      })
    );

    setEditingTask(null);
  };

  const handleConfirmDeleteFromModal = () => {
    if (!editingTask) return;
    handleDeleteTask(editingTask.id, editingTask.completed, editingTask.xpReward);
    setShowDeleteConfirmModal(false);
    setEditingTask(null);
  };

  const handleToggleTask = (id: string) => {
    updateActiveTasks(prevTasks => {
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

  const handleToggleSubtask = (taskId: string, subtaskId: string) => {
    updateActiveTasks(prevTasks => {
      return prevTasks.map(t => {
        if (t.id !== taskId) return t;
        if (!t.subtasks) return t;

        const updatedSubtasks = t.subtasks.map(s => {
          if (s.id === subtaskId) {
            return { ...s, completed: !s.completed };
          }
          return s;
        });

        const allCompleted = updatedSubtasks.every(s => s.completed);
        const wasCompleted = t.completed;
        const nowCompleted = allCompleted;

        if (nowCompleted && !wasCompleted) {
          addXp(t.xpReward);
        } else if (!nowCompleted && wasCompleted) {
          addXp(-t.xpReward);
        }

        return {
          ...t,
          subtasks: updatedSubtasks,
          completed: nowCompleted
        };
      });
    });
  };

  // Book Tracking actions
  const handleSaveBookConfig = (e: React.FormEvent) => {
    e.preventDefault();
    const todayStr = getTodayDateStr();
    const pRead = Number(bookFormPagesRead) || 0;
    const totalP = Number(bookFormTotalPages) || 250;
    const isCompleted = pRead >= totalP;

    const newTrackerData: BookTracker = {
      bookName: bookFormName,
      totalPages: totalP,
      deadlineDays: Number(bookFormDeadline) || 7,
      pagesRead: pRead,
      startedDate: bookTracker?.startedDate || todayStr,
      history: bookTracker?.history || []
    };

    if (isCompleted) {
      syncBookWithYearlyBooks(
        { ...newTrackerData, pagesRead: totalP },
        actualBooks,
        actualSetBooks,
        actualWeeklyReviews,
        actualSetWeeklyReviews
      );

      setBookTracker({
        bookName: '',
        totalPages: 250,
        deadlineDays: 7,
        pagesRead: 0,
        startedDate: undefined,
        history: []
      });
      setBookFormName('');
      setBookFormPagesRead(0);
      setShowBookConfig(false);
      addXp(100);
      alert(`🎉 Parabéns! O livro "${bookFormName}" foi concluído e salvo no seu histórico em Anuais. O campo foi liberado para você registrar o próximo livro!`);
    } else {
      setBookTracker(newTrackerData);
      syncBookWithYearlyBooks(
        newTrackerData,
        actualBooks,
        actualSetBooks,
        actualWeeklyReviews,
        actualSetWeeklyReviews
      );
      setShowBookConfig(false);
      addXp(20);
    }
  };

  const handleLogBookReading = (e: React.FormEvent) => {
    e.preventDefault();
    const pRead = Number(pagesLoggedToday);
    if (!pRead || pRead <= 0) return;

    const currentPagesRead = bookTracker?.pagesRead || 0;
    const total = bookTracker?.totalPages || 250;
    const updatedPagesRead = Math.min(total, currentPagesRead + pRead);
    const todayStr = getTodayDateStr();

    const history = bookTracker?.history || [];
    const targetToday = bookMetrics.dailyTarget;

    const updatedHistory = [
      {
        date: todayStr,
        pagesReadToday: pRead,
        dailyTarget: targetToday
      },
      ...history
    ];

    const isCompletedNow = updatedPagesRead >= total;

    const updatedTracker = {
      ...bookTracker,
      pagesRead: updatedPagesRead,
      history: updatedHistory
    };

    if (isCompletedNow) {
      syncBookWithYearlyBooks(
        { ...updatedTracker, pagesRead: total },
        actualBooks,
        actualSetBooks,
        actualWeeklyReviews,
        actualSetWeeklyReviews
      );

      setBookTracker({
        bookName: '',
        totalPages: 250,
        deadlineDays: 7,
        pagesRead: 0,
        startedDate: undefined,
        history: []
      });
      setBookFormName('');
      setBookFormPagesRead(0);
      setPagesLoggedToday('');
      addXp(100);
      alert(`🎉 Parabéns! Você concluiu a leitura de "${bookTracker.bookName}"! Ele foi salvo no seu histórico em Anuais e o campo foi liberado para o próximo livro.`);
    } else {
      setBookTracker(updatedTracker);
      syncBookWithYearlyBooks(
        updatedTracker,
        actualBooks,
        actualSetBooks,
        actualWeeklyReviews,
        actualSetWeeklyReviews
      );

      let gainedXp = 10;
      if (pRead >= targetToday) {
        gainedXp += 15;
      }
      addXp(gainedXp);
      setPagesLoggedToday('');
    }
  };

  const handleCompleteActiveBook = () => {
    if (!bookTracker?.bookName) return;
    const total = bookTracker.totalPages || 250;
    const title = bookTracker.bookName;

    syncBookWithYearlyBooks(
      { ...bookTracker, pagesRead: total },
      actualBooks,
      actualSetBooks,
      actualWeeklyReviews,
      actualSetWeeklyReviews
    );

    setBookTracker({
      bookName: '',
      totalPages: 250,
      deadlineDays: 7,
      pagesRead: 0,
      startedDate: undefined,
      history: []
    });
    setBookFormName('');
    setBookFormPagesRead(0);
    addXp(100);
    alert(`🎉 Parabéns! O livro "${title}" foi marcado como concluído e salvo no seu histórico em Anuais. O campo foi liberado para o próximo livro!`);
  };

  const handlePauseActiveBook = () => {
    if (!bookTracker?.bookName) return;
    const title = bookTracker.bookName;
    const todayStr = getTodayDateStr();
    const startDate = bookTracker.startedDate || todayStr;
    const interval = calculateReadingInterval(startDate, todayStr, 'dropado');

    actualSetBooks(prev => prev.map(b => {
      if (b.title.trim().toLowerCase() === title.trim().toLowerCase()) {
        return {
          ...b,
          status: 'dropado',
          endDate: todayStr,
          readingInterval: interval
        };
      }
      return b;
    }));

    setBookTracker({
      bookName: '',
      totalPages: 250,
      deadlineDays: 7,
      pagesRead: 0,
      startedDate: undefined,
      history: []
    });
    setBookFormName('');
    setBookFormPagesRead(0);
    alert(`O livro "${title}" foi pausado e salvo no seu histórico de livros dropados em Anuais.`);
  };

  const handleResumeBookFromHistory = (bk: YearlyBook) => {
    const todayStr = getTodayDateStr();
    const startDate = bk.startDate || todayStr;
    const interval = calculateReadingInterval(startDate, undefined, 'lendo');

    actualSetBooks(prev => prev.map(b => b.id === bk.id ? {
      ...b,
      status: 'lendo',
      endDate: undefined,
      readingInterval: interval
    } : b));

    const newTracker: BookTracker = {
      bookName: bk.title,
      totalPages: bk.totalPages,
      deadlineDays: 7,
      pagesRead: bk.pagesRead,
      startedDate: startDate,
      history: []
    };

    setBookTracker(newTracker);
    setBookFormName(bk.title);
    setBookFormTotalPages(bk.totalPages);
    setBookFormPagesRead(bk.pagesRead);

    syncBookWithYearlyBooks(
      newTracker,
      actualBooks,
      actualSetBooks,
      actualWeeklyReviews,
      actualSetWeeklyReviews
    );

    setShowBookConfig(false);
    addXp(15);
  };

  // Bible Tracking actions
  const handleSaveBibleConfig = (e: React.FormEvent) => {
    e.preventDefault();
    setBibleTracker({
      vezesNoAno: bibleFormMode === 'vezes' ? Number(bibleFormVezes) : undefined,
      capitulosPorDia: bibleFormMode === 'capitulos' ? Number(bibleFormCapitulos) : undefined,
      capitulosJaLidos: Number(bibleFormJaLidos) || 0,
      chaptersReadToday: 0,
      lastReadDate: getTodayDateStr(),
      history: []
    });
    setShowBibleConfig(false);
    addXp(20);
  };

  const handleLogBibleReading = (e: React.FormEvent) => {
    e.preventDefault();
    const chRead = Number(chaptersLoggedToday);
    if (!chRead || chRead <= 0) return;

    const currentJaLidos = bibleTracker?.capitulosJaLidos || 0;
    const currentTodayRead = bibleTracker?.lastReadDate === getTodayDateStr() ? bibleTracker?.chaptersReadToday || 0 : 0;
    const updatedJaLidos = Math.min(BIBLE_TOTAL_CHAPTERS * (bibleTracker?.vezesNoAno || 1), currentJaLidos + chRead);

    const updatedTodayRead = currentTodayRead + chRead;
    const history = bibleTracker?.history || [];
    const targetToday = bibleMetrics.adaptedDailyTarget;

    const updatedHistory = [
      {
        date: getTodayDateStr(),
        chaptersReadToday: chRead,
        dailyTarget: targetToday
      },
      ...history
    ];

    setBibleTracker(prev => ({
      ...prev,
      capitulosJaLidos: updatedJaLidos,
      chaptersReadToday: updatedTodayRead,
      lastReadDate: getTodayDateStr(),
      history: updatedHistory
    }));

    // XP rewards: +10 base XP, +15 bonus if daily adapted target is completed today!
    let gainedXp = 10;
    if (updatedTodayRead >= targetToday && currentTodayRead < targetToday) {
      gainedXp += 15;
    }
    addXp(gainedXp);

    setChaptersLoggedToday('');
  };

  // Grouping tasks for rendering
  const morningTasks = activeTasks.filter(t => t.period === 'manha');
  const nightTasks = activeTasks.filter(t => t.period === 'noite');
  const generalTasks = activeTasks.filter(t => !t.period || t.period === 'geral');

  // Modular renderer for a checklist task item row
  function renderTaskRow(task: DailyTask) {
    const hasSubtasks = task.subtasks && task.subtasks.length > 0;
    const isExpanded = !!expandedTasks[task.id];
    const completedSubs = task.subtasks?.filter(s => s.completed).length || 0;

    return (
      <motion.div
        key={task.id}
        className={`rounded-xl border flex flex-col transition-all group overflow-hidden ${
          task.completed
            ? 'bg-orange-500/5 border-orange-500/10 text-gray-500'
            : 'bg-zinc-900/30 border-zinc-800/35 text-gray-200 hover:border-zinc-700/60'
        }`}
        layout
      >
        <div className="p-3.5 flex items-center justify-between gap-4">
          <div 
            onClick={() => handleOpenTaskEditModal(task)}
            className="flex items-center gap-3 flex-1 min-w-0 cursor-pointer group/tasktitle"
          >
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                handleToggleTask(task.id);
              }}
              className={`h-4.5 w-4.5 rounded border flex items-center justify-center transition-all flex-shrink-0 ${
                task.completed
                  ? 'bg-orange-500 border-orange-500 text-white'
                  : 'border-zinc-700 hover:border-orange-500 bg-zinc-950'
              }`}
            >
              {task.completed && <Check className="h-3 w-3 stroke-[3]" />}
            </button>

            <div className="truncate pr-2 flex items-center flex-wrap gap-1.5">
              <span className={`text-xs font-medium transition-all group-hover/tasktitle:text-orange-400 ${task.completed ? 'line-through text-gray-500' : 'text-white'}`}>
                {task.text}
              </span>
              <span className="text-[9px] bg-zinc-800/80 text-gray-400 px-1.5 py-0.5 rounded font-mono uppercase tracking-wide">
                {task.category}
              </span>
              {task.isRecurring !== false ? (
                <span className="text-[9px] bg-orange-500/10 text-orange-400 border border-orange-500/20 px-1.5 py-0.5 rounded font-mono uppercase tracking-wide inline-flex items-center gap-0.5">
                  <Clock className="h-2.5 w-2.5" /> Diária
                </span>
              ) : (
                <span className="text-[9px] bg-zinc-800/90 text-zinc-300 border border-zinc-700/60 px-1.5 py-0.5 rounded font-mono uppercase tracking-wide inline-flex items-center gap-0.5">
                  <Calendar className="h-2.5 w-2.5" /> Apenas Hoje
                </span>
              )}
              {task.reminderTime && (
                <span className="text-[9px] bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 px-1.5 py-0.5 rounded font-mono font-bold uppercase tracking-wide inline-flex items-center gap-0.5">
                  <Bell className="h-2.5 w-2.5" /> {task.reminderTime}
                </span>
              )}
              {hasSubtasks && (
                <span className="text-[9px] bg-orange-500/10 text-orange-400 border border-orange-500/20 px-1.5 py-0.5 rounded font-mono font-bold uppercase tracking-wide inline-flex items-center gap-0.5">
                  ({completedSubs}/{task.subtasks!.length} etapas)
                </span>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {hasSubtasks && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setExpandedTasks(prev => ({ ...prev, [task.id]: !prev[task.id] }));
                }}
                className="text-zinc-500 hover:text-orange-500 transition-colors p-1"
                title="Expandir Etapas"
              >
                {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
              </button>
            )}

            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                handleOpenTaskEditModal(task);
              }}
              className="text-zinc-500 hover:text-orange-400 transition-colors p-1 opacity-0 group-hover:opacity-100 focus:opacity-100"
              title="Editar Tarefa"
            >
              <Edit3 className="h-3.5 w-3.5" />
            </button>

            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setEditingTask(task);
                setShowDeleteConfirmModal(true);
              }}
              className="text-zinc-600 hover:text-red-500 transition-colors p-1 opacity-0 group-hover:opacity-100 focus:opacity-100"
              title="Excluir Tarefa"
            >
              <Trash2 className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>

        {/* Subtasks Block Progress (Visible at the bottom of the card when collapsed) */}
        {hasSubtasks && !isExpanded && (
          <div className="flex gap-0.5 h-1.5 bg-zinc-950/45 px-3.5 pb-1">
            {task.subtasks!.map((sub, idx) => (
              <div 
                key={sub.id || idx}
                className={`h-1 flex-1 rounded-sm transition-all ${
                  sub.completed 
                    ? 'bg-orange-500/90 shadow-[0_0_6px_rgba(249,115,22,0.3)]' 
                    : 'bg-zinc-800'
                }`}
              />
            ))}
          </div>
        )}

        {/* Subtasks Expanded Section */}
        {hasSubtasks && isExpanded && (
          <div className="px-10 pb-4 space-y-2 border-t border-zinc-900 bg-zinc-950/20 pt-3">
            {/* Expanded Header Block Progress Bar */}
            <div className="flex items-center justify-between gap-2 border-b border-zinc-900/60 pb-2.5 mb-2.5">
              <span className="text-[9px] text-zinc-500 font-black uppercase tracking-wider font-mono">Progresso das Etapas</span>
              <div className="flex gap-1.5 flex-1 max-w-[140px] justify-end">
                {task.subtasks!.map((sub, idx) => (
                  <div 
                    key={sub.id || idx}
                    className={`h-2 flex-1 rounded-sm min-w-[6px] max-w-[20px] transition-all ${
                      sub.completed
                        ? 'bg-orange-500 shadow-[0_0_8px_rgba(249,115,22,0.4)]'
                        : 'bg-zinc-800'
                    }`}
                  />
                ))}
              </div>
            </div>

            {/* Custom Styled Checklist Inegociável Subtasks Checkboxes */}
            <div className="space-y-1.5">
              {task.subtasks!.map(sub => (
                <button
                  key={sub.id}
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleToggleSubtask(task.id, sub.id);
                  }}
                  className="flex items-center gap-3 w-full text-left py-1.5 hover:bg-zinc-900/20 px-2.5 rounded-lg transition-colors group/sub select-none"
                >
                  <div className={`h-4.5 w-4.5 rounded flex items-center justify-center border transition-all flex-shrink-0 ${
                    sub.completed
                      ? 'bg-orange-500 border-orange-500 text-white shadow-[0_0_8px_rgba(249,115,22,0.3)]'
                      : 'border-zinc-800/40 bg-zinc-950 group-hover/sub:border-orange-500/40'
                  }`}>
                    {sub.completed && <Check className="h-3 w-3 stroke-[3]" />}
                  </div>
                  <span className={`text-xs transition-all ${
                    sub.completed ? 'line-through text-gray-500' : 'text-gray-300 group-hover/sub:text-white font-medium'
                  }`}>
                    {sub.text}
                  </span>
                </button>
              ))}
            </div>
          </div>
        )}
      </motion.div>
    );
  }

  return (
    <div id="checklist-view" className="space-y-6 pb-12">
      {/* 1. Header Area */}
      <div className="flex flex-row items-center justify-between gap-3 w-full border-b border-zinc-900/60 pb-4">
        <div className="min-w-0">
          <h1 className="text-lg sm:text-2xl font-black text-white tracking-tight flex items-center gap-1.5 sm:gap-2 truncate">
            <CheckSquare className="h-5 sm:h-6 w-5 sm:w-6 text-orange-500 shrink-0" />
            <span className="truncate">Missões <span className="text-orange-500 uppercase">Diárias</span></span>
          </h1>
          <p className="text-gray-500 text-[10px] sm:text-xs capitalize mt-0.5 sm:mt-1 truncate">
            {formattedDate}
          </p>
        </div>

        {/* Combo Streak Indicator */}
        <div className="flex items-center gap-1.5 bg-orange-500/10 border border-orange-500/10 px-2.5 sm:px-3.5 py-1 sm:py-1.5 rounded-lg text-[10px] sm:text-xs text-orange-500 font-bold shrink-0">
          <Flame className="h-3.5 sm:h-4 w-3.5 sm:w-4 fill-orange-500/20" />
          <span>{streak} {streak === 1 ? 'dia' : 'dias'} em combo</span>
        </div>
      </div>

      {/* Tabs Selector for Checklist vs Routine Grid */}
      <div className="flex items-center bg-zinc-900/30 p-1.5 rounded-2xl max-w-md backdrop-blur-md shadow-lg">
        <button
          onClick={() => setActiveTab('checklist')}
          className={`flex-1 px-5 py-2.5 rounded-xl text-xs font-extrabold uppercase tracking-widest transition-all duration-300 flex items-center justify-center gap-2.5 ${
            activeTab === 'checklist'
              ? 'bg-gradient-to-r from-orange-600 to-orange-500 text-white shadow-[0_4px_20px_rgba(249,115,22,0.35)] scale-[1.02]'
              : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/30'
          }`}
        >
          <List className={`h-4 w-4 transition-transform ${activeTab === 'checklist' ? 'scale-110' : ''}`} />
          <span>Missões Diárias</span>
        </button>
        <button
          onClick={() => setActiveTab('rotina')}
          className={`flex-1 px-5 py-2.5 rounded-xl text-xs font-extrabold uppercase tracking-widest transition-all duration-300 flex items-center justify-center gap-2.5 ${
            activeTab === 'rotina'
              ? 'bg-gradient-to-r from-orange-600 to-orange-500 text-white shadow-[0_4px_20px_rgba(249,115,22,0.35)] scale-[1.02]'
              : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/30'
          }`}
        >
          <Clock className={`h-4 w-4 transition-transform ${activeTab === 'rotina' ? 'scale-110' : ''}`} />
          <span>Rotina Diária</span>
        </button>
      </div>

      {activeTab === 'checklist' ? (
        <>
          {/* Date Selector Header Bar */}
          <div className="flex flex-wrap items-center justify-between gap-3 bg-[#111115] border border-zinc-800/80 rounded-2xl p-3.5 shadow-md">
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => {
                  const d = parseLocalDate(selectedDate);
                  d.setDate(d.getDate() - 1);
                  const prevStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
                  setSelectedDate(prevStr);
                }}
                className="px-3 py-1.5 bg-zinc-900 hover:bg-zinc-800 text-zinc-300 hover:text-white rounded-xl border border-zinc-800 transition-all flex items-center gap-1 text-xs font-bold"
                title="Dia Anterior"
              >
                <ChevronLeft className="h-4 w-4 text-orange-500" />
                <span className="hidden sm:inline">Dia Anterior</span>
              </button>

              <div className="relative flex items-center">
                <input
                  type="date"
                  value={selectedDate}
                  onChange={(e) => e.target.value && setSelectedDate(e.target.value)}
                  className="bg-zinc-900 border border-zinc-800 rounded-xl px-3 py-1.5 text-xs font-mono font-bold text-white focus:outline-none focus:border-orange-500/50 cursor-pointer"
                />
              </div>

              <button
                type="button"
                onClick={() => {
                  const d = parseLocalDate(selectedDate);
                  d.setDate(d.getDate() + 1);
                  const nextStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
                  setSelectedDate(nextStr);
                }}
                className="px-3 py-1.5 bg-zinc-900 hover:bg-zinc-800 text-zinc-300 hover:text-white rounded-xl border border-zinc-800 transition-all flex items-center gap-1 text-xs font-bold"
                title="Próximo Dia"
              >
                <span className="hidden sm:inline">Próximo Dia</span>
                <ChevronRight className="h-4 w-4 text-orange-500" />
              </button>

              {!isToday && (
                <button
                  type="button"
                  onClick={() => setSelectedDate(todayStr)}
                  className="px-3 py-1.5 bg-orange-500/10 hover:bg-orange-500/20 text-orange-400 border border-orange-500/30 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5"
                >
                  <Calendar className="h-3.5 w-3.5" /> Ir para Hoje
                </button>
              )}
            </div>

            <div className="flex items-center gap-2 text-xs">
              {isToday ? (
                <span className="px-3 py-1 bg-orange-500/10 border border-orange-500/20 text-orange-400 font-mono font-bold rounded-lg uppercase text-[10px] flex items-center gap-1.5">
                  <span className="h-2 w-2 rounded-full bg-orange-500 animate-pulse" />
                  HOJE ({formatDateBR(selectedDate)})
                </span>
              ) : selectedDate < todayStr ? (
                <span className="px-3 py-1 bg-blue-500/10 border border-blue-500/20 text-blue-400 font-mono font-bold rounded-lg uppercase text-[10px] flex items-center gap-1.5">
                  <Clock className="h-3 w-3" /> HISTÓRICO SALVO ({formatDateBR(selectedDate)})
                </span>
              ) : (
                <span className="px-3 py-1 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 font-mono font-bold rounded-lg uppercase text-[10px] flex items-center gap-1.5">
                  <Sparkles className="h-3 w-3" /> PLANEJAMENTO ({formatDateBR(selectedDate)})
                </span>
              )}
            </div>
          </div>

      {/* 3. Daily Progress Panel */}
      <div className="bg-zinc-900/40 border border-zinc-800 rounded-xl p-5 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-orange-500/10 rounded-xl border border-orange-500/20">
            <CheckSquare className="h-6 w-6 text-orange-500" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-white">Progresso Diário</h3>
            <p className="text-[11px] text-gray-500 mt-0.5">
              {completedTasks} de {totalTasks} tarefas completas
            </p>
          </div>
        </div>
        <div className="text-right">
          <span className="text-2xl font-black text-white font-mono">
            {totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0}%
          </span>
          <span className="text-[10px] text-gray-500 font-mono block mt-0.5">
            {completedTasks === totalTasks && totalTasks > 0 ? 'Tudo concluído!' : 'Em andamento'}
          </span>
        </div>
      </div>

      {/* 4. Active Tasks Groupings - Collapsible Accordions for Manhã, Noite, and Geral */}
      <div className="space-y-4">
        
        {/* Accordions Header controls */}
        <div className="flex items-center justify-between border-b border-zinc-900 pb-2">
          <h2 className="text-xs font-bold text-gray-400 uppercase tracking-wider">
            Rotinas e Checklist Diário
          </h2>
          <div className="flex items-center gap-2">
            {activeTasks.length > 0 && (
              <button
                type="button"
                onClick={handleResetForNewDay}
                className="text-xs font-bold text-gray-400 hover:text-white flex items-center gap-1.5 transition-colors bg-zinc-900/60 hover:bg-zinc-900 px-3 py-1.5 rounded-lg border border-zinc-800"
              >
                <RefreshCw className="h-3.5 w-3.5 text-orange-500" /> Iniciar Novo Dia
              </button>
            )}
            <button
              onClick={() => setIsAdding(!isAdding)}
              className="text-xs font-bold text-orange-500 hover:text-orange-400 flex items-center gap-1.5 transition-colors bg-orange-500/10 px-3 py-1.5 rounded-lg border border-orange-500/20"
            >
              <Plus className="h-3.5 w-3.5" /> Adicionar Tarefa
            </button>
          </div>
        </div>

        {/* Task Adding Form Overlay */}
        <AnimatePresence>
          {isAdding && (
            <motion.form 
              onSubmit={handleAddTask}
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="bg-zinc-900 p-4 rounded-xl border border-orange-500/30 overflow-hidden space-y-3 shadow-xl"
            >
              <div>
                <label className="text-[10px] text-gray-400 uppercase font-bold block mb-1">Nome da Tarefa</label>
                <input
                  type="text"
                  value={newTaskText}
                  onChange={(e) => setNewTaskText(e.target.value)}
                  placeholder="Ex: Treinar na academia, Beber 3L de água..."
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-orange-500/50"
                  maxLength={50}
                  required
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] text-gray-400 uppercase font-bold block mb-1">Pilar de Organização</label>
                  <select
                    value={newTaskCategory}
                    onChange={(e) => setNewTaskCategory(e.target.value)}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-xs text-gray-350 focus:outline-none focus:border-orange-500/50"
                  >
                    <option value="O Básico">O Básico (Checklist/Hábitos)</option>
                    <option value="Segundo Cérebro">Segundo Cérebro (Estudos/Notas)</option>
                    <option value="Metas">Metas e Projetos</option>
                    <option value="Canalização">Canalização e Ação</option>
                  </select>
                </div>

                <div>
                  <label className="text-[10px] text-gray-400 uppercase font-bold block mb-1">Período do Dia</label>
                  <select
                    value={newTaskPeriod}
                    onChange={(e) => setNewTaskPeriod(e.target.value as any)}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-xs text-gray-350 focus:outline-none focus:border-orange-500/50"
                  >
                    <option value="geral">Geral / Dia Todo</option>
                    <option value="manha">Manhã (Rotina Matinal)</option>
                    <option value="noite">Noite (Rotina Noturna)</option>
                  </select>
                </div>
              </div>

              <div className="flex items-center gap-2 py-1 select-none">
                <input
                  type="checkbox"
                  id="is-recurring-checkbox"
                  checked={newTaskIsRecurring}
                  onChange={(e) => setNewTaskIsRecurring(e.target.checked)}
                  className="rounded border-zinc-800 bg-zinc-950 text-orange-500 focus:ring-0 focus:ring-offset-0 h-4 w-4"
                />
                <label htmlFor="is-recurring-checkbox" className="text-xs text-gray-300 font-medium cursor-pointer">
                  Recorrente (todos os dias)
                </label>
              </div>

              {/* Etapas / Subtarefas section */}
              <div className="border-t border-zinc-900 pt-3 space-y-2">
                <label className="text-[10px] text-gray-400 uppercase font-bold block">Etapas / Subtarefas (Opcional)</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={currentSubtaskText}
                    onChange={(e) => setCurrentSubtaskText(e.target.value)}
                    placeholder="Adicione uma etapa para esta tarefa..."
                    className="flex-1 bg-zinc-950 border border-zinc-900 rounded-lg px-3 py-1.5 text-xs text-white focus:outline-none focus:border-orange-500/50"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        if (currentSubtaskText.trim()) {
                          setNewTaskSubtasks([...newTaskSubtasks, currentSubtaskText.trim()]);
                          setCurrentSubtaskText('');
                        }
                      }
                    }}
                  />
                  <button
                    type="button"
                    onClick={() => {
                      if (currentSubtaskText.trim()) {
                        setNewTaskSubtasks([...newTaskSubtasks, currentSubtaskText.trim()]);
                        setCurrentSubtaskText('');
                      }
                    }}
                    className="bg-zinc-800 hover:bg-zinc-700 text-orange-500 font-bold text-xs px-3 py-1.5 rounded-lg border border-zinc-800/40 transition-colors"
                  >
                    + Etapa
                  </button>
                </div>

                {newTaskSubtasks.length > 0 && (
                  <div className="space-y-1.5 bg-zinc-950/40 p-2.5 rounded-xl border border-zinc-900 max-h-[120px] overflow-y-auto">
                    {newTaskSubtasks.map((st, sidx) => (
                      <div key={sidx} className="flex items-center justify-between bg-zinc-900/40 px-2 py-1.5 rounded border border-zinc-900">
                        <span className="text-[11px] text-gray-300 font-medium">{st}</span>
                        <button
                          type="button"
                          onClick={() => setNewTaskSubtasks(newTaskSubtasks.filter((_, i) => i !== sidx))}
                          className="text-zinc-500 hover:text-red-500 transition-colors text-[10px] font-bold"
                        >
                          Remover
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="flex justify-end gap-2 pt-1 border-t border-zinc-900 pt-3">
                <button
                  type="button"
                  onClick={() => setIsAdding(false)}
                  className="text-xs text-gray-400 hover:text-white px-3 py-1.5 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="bg-orange-500 hover:bg-orange-600 text-white font-semibold text-xs px-4 py-1.5 rounded-lg transition-colors"
                >
                  Confirmar Tarefa
                </button>
              </div>
            </motion.form>
          )}
        </AnimatePresence>

        {/* ACCORDION 1: ROTINA MATINAL (Manhã) */}
        <div className="bg-[#0a0a0c]/40 border border-zinc-800/30 rounded-xl overflow-hidden">
          <button 
            onClick={() => setMorningOpen(!morningOpen)}
            className="w-full p-4 flex items-center justify-between bg-zinc-900/20 hover:bg-zinc-900/40 transition-colors border-b border-zinc-800/30 text-left"
          >
            <div className="flex items-center gap-2.5">
              <Sun className="h-4.5 w-4.5 text-amber-500" />
              <span className="text-xs font-bold text-white tracking-wide">Rotina Matinal (Manhã)</span>
              <span className="text-[10px] bg-zinc-800 text-zinc-400 px-2 py-0.5 rounded-full font-mono">
                {morningTasks.filter(t => t.completed).length}/{morningTasks.length}
              </span>
            </div>
            {morningOpen ? <ChevronUp className="h-4 w-4 text-zinc-500" /> : <ChevronDown className="h-4 w-4 text-zinc-500" />}
          </button>

          <AnimatePresence initial={false}>
            {morningOpen && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="overflow-hidden p-3 space-y-2"
              >
                {morningTasks.length === 0 ? (
                  <p className="text-[11px] text-zinc-500 italic py-2 px-1">Nenhuma tarefa matinal definida. Adicione tarefas selecionando o período "Manhã".</p>
                ) : (
                  morningTasks.map(task => renderTaskRow(task))
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* ACCORDION 2: ROTINA NOTURNA (Noite) */}
        <div className="bg-[#0a0a0c]/40 border border-zinc-800/30 rounded-xl overflow-hidden">
          <button 
            onClick={() => setNightOpen(!nightOpen)}
            className="w-full p-4 flex items-center justify-between bg-zinc-900/20 hover:bg-zinc-900/40 transition-colors border-b border-zinc-800/30 text-left"
          >
            <div className="flex items-center gap-2.5">
              <Moon className="h-4.5 w-4.5 text-indigo-400" />
              <span className="text-xs font-bold text-white tracking-wide">Rotina Noturna (Noite)</span>
              <span className="text-[10px] bg-zinc-800 text-zinc-400 px-2 py-0.5 rounded-full font-mono">
                {nightTasks.filter(t => t.completed).length}/{nightTasks.length}
              </span>
            </div>
            {nightOpen ? <ChevronUp className="h-4 w-4 text-zinc-500" /> : <ChevronDown className="h-4 w-4 text-zinc-500" />}
          </button>

          <AnimatePresence initial={false}>
            {nightOpen && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="overflow-hidden p-3 space-y-2"
              >
                {nightTasks.length === 0 ? (
                  <p className="text-[11px] text-zinc-500 italic py-2 px-1">Nenhuma tarefa noturna definida. Adicione tarefas selecionando o período "Noite".</p>
                ) : (
                  nightTasks.map(task => renderTaskRow(task))
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* ACCORDION 3: TAREFAS GERAIS */}
        <div className="bg-[#0a0a0c]/40 border border-zinc-800/30 rounded-xl overflow-hidden">
          <button 
            onClick={() => setGeneralOpen(!generalOpen)}
            className="w-full p-4 flex items-center justify-between bg-zinc-900/20 hover:bg-zinc-900/40 transition-colors border-b border-zinc-800/30 text-left"
          >
            <div className="flex items-center gap-2.5">
              <List className="h-4.5 w-4.5 text-orange-500" />
              <span className="text-xs font-bold text-white tracking-wide">Tarefas Gerais / Checklist Diário</span>
              <span className="text-[10px] bg-zinc-800 text-zinc-400 px-2 py-0.5 rounded-full font-mono">
                {generalTasks.filter(t => t.completed).length}/{generalTasks.length}
              </span>
            </div>
            {generalOpen ? <ChevronUp className="h-4 w-4 text-zinc-500" /> : <ChevronDown className="h-4 w-4 text-zinc-500" />}
          </button>

          <AnimatePresence initial={false}>
            {generalOpen && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="overflow-hidden p-3 space-y-2"
              >
                {generalTasks.length === 0 ? (
                  <p className="text-[11px] text-zinc-500 italic py-2 px-1">Nenhuma tarefa geral definida.</p>
                ) : (
                  generalTasks.map(task => renderTaskRow(task))
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* ACCORDION 4: LEITURA SEMANAL */}
        <div className="bg-[#0a0a0c]/40 border border-zinc-800/30 rounded-xl overflow-hidden">
          <div 
            onClick={() => setBookOpen(!bookOpen)}
            className="w-full p-4 flex items-center justify-between bg-zinc-900/20 hover:bg-zinc-900/40 transition-colors border-b border-zinc-800/30 text-left cursor-pointer select-none"
          >
            <div className="flex items-center gap-2.5">
              <BookOpen className="h-4.5 w-4.5 text-orange-500" />
              <span className="text-xs font-bold text-white tracking-wide">Leitura Semanal</span>
              <span className="text-[10px] bg-zinc-800/40 text-zinc-400 px-2 py-0.5 rounded-full font-mono">
                {bookMetrics.progressPercent}%
              </span>
              {bookStreak > 0 && (
                <span className="flex items-center gap-1 bg-orange-500/10 border border-orange-500/10 px-2 py-0.5 rounded-full text-[9px] text-orange-400 font-bold lowercase">
                  <Flame className="h-3 w-3 fill-orange-500/15" />
                  {bookStreak} {bookStreak === 1 ? 'dia' : 'dias'}
                </span>
              )}
            </div>
            <div className="flex items-center gap-3">
              <button 
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setShowBookConfig(true);
                }}
                className="text-[10px] font-bold text-zinc-400 hover:text-white bg-zinc-800/60 hover:bg-zinc-700 px-2 py-1 rounded transition-colors"
              >
                Configurar
              </button>
              {bookOpen ? <ChevronUp className="h-4 w-4 text-zinc-500" /> : <ChevronDown className="h-4 w-4 text-zinc-500" />}
            </div>
          </div>

          <AnimatePresence initial={false}>
            {bookOpen && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="overflow-hidden p-5 space-y-4 bg-zinc-950/20 text-left"
              >
                {!bookTracker?.bookName ? (
                  <div className="text-center py-6 space-y-3 bg-zinc-950/60 p-4 rounded-xl border border-zinc-900">
                    <BookOpen className="h-8 w-8 text-zinc-600 mx-auto" />
                    <div className="space-y-1">
                      <h4 className="text-xs font-bold text-white">Nenhum livro ativo sendo lido</h4>
                      <p className="text-[10px] text-zinc-500">Configure um novo livro ou retome uma leitura pausada do seu histórico em Anuais.</p>
                    </div>
                    <button
                      onClick={() => setShowBookConfig(true)}
                      className="bg-orange-500 hover:bg-orange-600 text-white text-xs font-bold px-4 py-2 rounded-xl transition-all inline-flex items-center gap-1.5 shadow-lg shadow-orange-500/10"
                    >
                      <Plus className="h-3.5 w-3.5" />
                      Configurar ou Retomar Livro
                    </button>
                  </div>
                ) : (
                  <>
                    <div className="flex items-start justify-between gap-2">
                      <div className="space-y-1">
                        <h3 className="text-sm font-bold text-white leading-snug">
                          {bookMetrics.bookName}
                        </h3>
                        <p className="text-[10px] text-gray-500">
                          Progresso: <span className="text-white font-bold">{bookMetrics.read}</span> de <span className="text-white font-bold">{bookMetrics.total}</span> páginas ({bookMetrics.progressPercent}%)
                        </p>
                      </div>

                      <div className="flex items-center gap-1.5 shrink-0">
                        <button
                          type="button"
                          onClick={handlePauseActiveBook}
                          className="px-2.5 py-1 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/20 rounded-lg text-[10px] font-bold transition-all"
                          title="Pausar esta leitura e salvar no histórico de livros dropados"
                        >
                          Pausar / Dropar
                        </button>
                        <button
                          type="button"
                          onClick={handleCompleteActiveBook}
                          className="px-2.5 py-1 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/20 rounded-lg text-[10px] font-bold transition-all"
                          title="Marcar livro como lido e salvar em Anuais"
                        >
                          Concluir Livro
                        </button>
                      </div>
                    </div>

                    {/* Progress bar */}
                    <div className="w-full bg-[#18181b] h-2 rounded-full overflow-hidden border border-[#27272a]/50">
                      <motion.div 
                        className="bg-gradient-to-r from-orange-500 to-amber-500 h-full rounded-full"
                        initial={{ width: 0 }}
                        animate={{ width: `${bookMetrics.progressPercent}%` }}
                        transition={{ duration: 0.3 }}
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4 bg-zinc-950/65 p-3 rounded-xl border border-zinc-900">
                      <div>
                        <span className="text-[9px] text-gray-500 block uppercase font-bold tracking-wider">Meta de Hoje</span>
                        <span className="text-lg font-black text-orange-500 font-mono">
                          {bookMetrics.dailyTarget} <span className="text-xs font-normal text-gray-400 font-sans">págs</span>
                        </span>
                      </div>
                      <div>
                        <span className="text-[9px] text-gray-500 block uppercase font-bold tracking-wider">Dias Restantes</span>
                        <span className="text-lg font-black text-white font-mono">
                          {bookMetrics.remainingDays} <span className="text-xs font-normal text-gray-400 font-sans">dias</span>
                        </span>
                      </div>
                    </div>

                    {/* Log reading form */}
                    <form onSubmit={handleLogBookReading} className="flex gap-2">
                      <input 
                        type="number"
                        min="1"
                        max={bookMetrics.remainingPages}
                        value={pagesLoggedToday}
                        onChange={(e) => setPagesLoggedToday(e.target.value)}
                        placeholder="Quantas páginas leu hoje?"
                        className="flex-1 bg-zinc-950 border border-zinc-900 rounded-lg px-3 py-1.5 text-xs text-white focus:outline-none focus:border-orange-500/50 font-mono"
                      />
                      <button
                        type="submit"
                        className="bg-orange-500 hover:bg-orange-600 text-white font-bold text-xs px-4 py-1.5 rounded-lg transition-colors flex items-center gap-1.5"
                      >
                        Registrar Leitura
                      </button>
                    </form>

                    {/* Heatmap Grid */}
                    <div className="space-y-1.5 pt-1">
                      <div className="flex items-center justify-between text-[9px] text-zinc-550 font-bold uppercase tracking-wider">
                        <span>Consistência (28 dias)</span>
                        <span>Sequência: {bookStreak} {bookStreak === 1 ? 'dia' : 'dias'}</span>
                      </div>
                      <div className="flex gap-1 justify-between bg-zinc-950/40 p-2.5 rounded-xl border border-zinc-900">
                        {bookHeatmap.map((day, i) => {
                          let bgClass = 'bg-zinc-950 border border-zinc-900/60';
                          let titleText = `${day.date}: nenhuma leitura`;
                          if (day.level === 1) {
                            bgClass = 'bg-orange-500/20 border border-orange-500/10 hover:bg-orange-500/35';
                            titleText = `${day.date}: ${day.totalRead} págs lidas (Meta: ${day.target})`;
                          } else if (day.level === 2) {
                            bgClass = 'bg-orange-500 border border-orange-400 hover:bg-orange-400';
                            titleText = `${day.date}: ${day.totalRead} págs (Meta batida! 🎉)`;
                          }
                          
                          return (
                            <div 
                              key={i} 
                              className={`w-[11px] h-[11px] rounded-[3px] transition-all cursor-help ${bgClass}`}
                              title={titleText}
                            />
                          );
                        })}
                      </div>
                    </div>
                  </>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* ACCORDION 5: LEITURA DA BÍBLIA */}
        <div className="bg-[#0a0a0c]/40 border border-zinc-800/30 rounded-xl overflow-hidden">
          <div 
            onClick={() => setBibleOpen(!bibleOpen)}
            className="w-full p-4 flex items-center justify-between bg-zinc-900/20 hover:bg-zinc-900/40 transition-colors border-b border-zinc-800/30 text-left cursor-pointer select-none"
          >
            <div className="flex items-center gap-2.5">
              <Book className="h-4.5 w-4.5 text-amber-500" />
              <span className="text-xs font-bold text-white tracking-wide">Leitura da Bíblia</span>
              <span className="text-[10px] bg-zinc-800/40 text-zinc-400 px-2 py-0.5 rounded-full font-mono">
                {bibleMetrics.progressPercent}%
              </span>
              {bibleStreak > 0 && (
                <span className="flex items-center gap-1 bg-amber-500/10 border border-amber-500/10 px-2 py-0.5 rounded-full text-[9px] text-amber-400 font-bold lowercase">
                  <Flame className="h-3 w-3 fill-amber-500/15" />
                  {bibleStreak} {bibleStreak === 1 ? 'dia' : 'dias'}
                </span>
              )}
            </div>
            <div className="flex items-center gap-3">
              <button 
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setShowBibleConfig(true);
                }}
                className="text-[10px] font-bold text-zinc-400 hover:text-white bg-zinc-800/60 hover:bg-zinc-700 px-2 py-1 rounded transition-colors"
              >
                Configurar
              </button>
              {bibleOpen ? <ChevronUp className="h-4 w-4 text-zinc-500" /> : <ChevronDown className="h-4 w-4 text-zinc-500" />}
            </div>
          </div>

          <AnimatePresence initial={false}>
            {bibleOpen && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="overflow-hidden p-5 space-y-4 bg-zinc-950/20 text-left"
              >
                <div className="space-y-1">
                  <h3 className="text-sm font-bold text-white leading-snug">
                    Bíblia Sagrada ({bibleMetrics.vezes}x no ano)
                  </h3>
                  <p className="text-[10px] text-gray-500">
                    Progresso do plano: <span className="text-white font-bold">{bibleMetrics.jaLidos}</span> de <span className="text-white font-bold">{bibleMetrics.totalToRead}</span> capítulos ({bibleMetrics.progressPercent}%)
                  </p>
                </div>

                {/* Progress bar */}
                <div className="w-full bg-[#18181b] h-2 rounded-full overflow-hidden border border-[#27272a]/50">
                  <motion.div 
                    className="bg-gradient-to-r from-amber-500 to-yellow-500 h-full rounded-full"
                    initial={{ width: 0 }}
                    animate={{ width: `${bibleMetrics.progressPercent}%` }}
                    transition={{ duration: 0.3 }}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4 bg-zinc-950/65 p-3 rounded-xl border border-zinc-900">
                  <div>
                    <span className="text-[9px] text-gray-500 block uppercase font-bold tracking-wider font-sans">Meta Hoje (Adaptada)</span>
                    <span className="text-lg font-black text-amber-500 font-mono">
                      {bibleMetrics.adaptedDailyTarget} <span className="text-xs font-normal text-gray-400 font-sans">capítulos</span>
                    </span>
                    <span className="text-[8px] text-zinc-550 block mt-0.5">Lido hoje: {bibleMetrics.readToday} / {bibleMetrics.adaptedDailyTarget}</span>
                  </div>
                  <div>
                    <span className="text-[9px] text-gray-550 block uppercase font-bold tracking-wider font-sans">Restam em 2026</span>
                    <span className="text-lg font-black text-white font-mono">
                      {daysRemainingInYear} <span className="text-xs font-normal text-gray-400 font-sans font-medium">dias</span>
                    </span>
                    <span className="text-[8px] text-zinc-550 block mt-0.5">Falta ler: {bibleMetrics.remainingChapters} caps</span>
                  </div>
                </div>

                {/* Log reading form */}
                <form onSubmit={handleLogBibleReading} className="flex gap-2">
                  <input 
                    type="number"
                    min="1"
                    max={bibleMetrics.remainingChapters}
                    value={chaptersLoggedToday}
                    onChange={(e) => setChaptersLoggedToday(e.target.value)}
                    placeholder="Quantos capítulos leu hoje?"
                    className="flex-1 bg-zinc-950 border border-zinc-900 rounded-lg px-3 py-1.5 text-xs text-white focus:outline-none focus:border-orange-500/50 font-mono"
                  />
                  <button
                    type="submit"
                    className="bg-amber-500 hover:bg-amber-600 text-zinc-950 font-bold text-xs px-4 py-1.5 rounded-lg transition-colors flex items-center gap-1.5"
                  >
                    Registrar
                  </button>
                </form>

                {/* Heatmap Grid */}
                <div className="space-y-1.5 pt-1">
                  <div className="flex items-center justify-between text-[9px] text-zinc-550 font-bold uppercase tracking-wider">
                    <span>Consistência (28 dias)</span>
                    <span>Sequência: {bibleStreak} {bibleStreak === 1 ? 'dia' : 'dias'}</span>
                  </div>
                  <div className="flex gap-1 justify-between bg-zinc-950/40 p-2.5 rounded-xl border border-zinc-900">
                    {bibleHeatmap.map((day, i) => {
                      let bgClass = 'bg-zinc-950 border border-zinc-900/60';
                      let titleText = `${day.date}: nenhuma leitura`;
                      if (day.level === 1) {
                        bgClass = 'bg-amber-500/20 border border-amber-500/10 hover:bg-amber-500/35';
                        titleText = `${day.date}: ${day.totalRead} caps lidos (Meta: ${day.target})`;
                      } else if (day.level === 2) {
                        bgClass = 'bg-amber-500 border border-amber-400 hover:bg-amber-400';
                        titleText = `${day.date}: ${day.totalRead} caps (Meta batida! 🎉)`;
                      }
                      
                      return (
                        <div 
                          key={i} 
                          className={`w-[11px] h-[11px] rounded-[3px] transition-all cursor-help ${bgClass}`}
                          title={titleText}
                        />
                      );
                    })}
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

      </div>

      {/* ----------------------------------------------------
          CONFIG DIALOGS OVERLAYS
         ---------------------------------------------------- */}

      {/* Book Tracker Configuration Modal */}
      {showBookConfig && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-black/80 backdrop-blur-sm" onClick={() => setShowBookConfig(false)} />
          <motion.div 
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-zinc-950 border border-zinc-800 rounded-2xl w-full max-w-lg overflow-hidden z-50 p-6 space-y-5 shadow-2xl max-h-[90vh] flex flex-col"
          >
            <div className="flex items-center justify-between border-b border-zinc-900 pb-3 shrink-0">
              <h3 className="text-sm font-black text-white uppercase tracking-wider flex items-center gap-2">
                <BookOpen className="h-4.5 w-4.5 text-orange-500" />
                Configurar Leitura & Histórico
              </h3>
              <button onClick={() => setShowBookConfig(false)} className="text-zinc-500 hover:text-white p-1">✕</button>
            </div>

            <div className="overflow-y-auto space-y-6 pr-1 custom-scrollbar">
              <form onSubmit={handleSaveBookConfig} className="space-y-4 bg-zinc-900/30 p-4 rounded-xl border border-zinc-900">
                <h4 className="text-xs font-bold text-white uppercase tracking-wider text-orange-400">Novo Livro / Editar Livro Atual</h4>
                <div>
                  <label className="text-[10px] text-gray-400 font-bold block mb-1 uppercase">Nome do Livro</label>
                  <input 
                    type="text"
                    required
                    placeholder="Nome do Livro..."
                    value={bookFormName}
                    onChange={(e) => setBookFormName(e.target.value)}
                    className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-orange-500/50"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-[10px] text-gray-400 font-bold block mb-1 uppercase">Total de Páginas</label>
                    <input 
                      type="number"
                      min="1"
                      required
                      value={bookFormTotalPages}
                      onChange={(e) => setBookFormTotalPages(Number(e.target.value))}
                      className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-orange-500/50 font-mono"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] text-gray-400 font-bold block mb-1 uppercase">Prazo (Dias)</label>
                    <input 
                      type="number"
                      min="1"
                      required
                      value={bookFormDeadline}
                      onChange={(e) => setBookFormDeadline(Number(e.target.value))}
                      className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-orange-500/50 font-mono"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-[10px] text-gray-400 font-bold block mb-1 uppercase">Páginas Já Lidas</label>
                  <input 
                    type="number"
                    min="0"
                    max={bookFormTotalPages}
                    required
                    value={bookFormPagesRead}
                    onChange={(e) => setBookFormPagesRead(Number(e.target.value))}
                    className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-orange-500/50 font-mono"
                  />
                  <span className="text-[9px] text-gray-500 mt-1 block">Útil caso você já tenha começado o livro.</span>
                </div>

                <div className="flex justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowBookConfig(false)}
                    className="text-xs text-gray-400 hover:text-white px-3 py-1.5 transition-colors"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="bg-orange-500 hover:bg-orange-600 text-white font-bold text-xs px-4 py-1.5 rounded-lg transition-colors"
                  >
                    Salvar / Iniciar Leitura
                  </button>
                </div>
              </form>

              {/* History / Dropped Books list */}
              {actualBooks && actualBooks.length > 0 && (
                <div className="space-y-3 pt-2">
                  <h4 className="text-xs font-bold text-zinc-300 uppercase tracking-wider flex items-center justify-between">
                    <span>Histórico de Livros em Anuais ({actualBooks.length})</span>
                  </h4>

                  <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                    {actualBooks.map((bk) => {
                      const isCurrentlyActive = bookTracker?.bookName?.trim().toLowerCase() === bk.title.trim().toLowerCase();
                      const statusColor = 
                        bk.status === 'lido' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' :
                        bk.status === 'dropado' ? 'bg-rose-500/10 text-rose-400 border-rose-500/20' :
                        bk.status === 'lendo' ? 'bg-orange-500/10 text-orange-400 border-orange-500/20' :
                        'bg-zinc-800 text-zinc-400 border-zinc-700';

                      const statusLabel = 
                        bk.status === 'lido' ? 'Lido' :
                        bk.status === 'dropado' ? 'Pausado / Dropado' :
                        bk.status === 'lendo' ? 'Lendo Atualmente' :
                        'Quero Ler';

                      return (
                        <div key={bk.id} className="bg-zinc-900/50 border border-zinc-900 rounded-xl p-3 flex items-center justify-between gap-3 hover:border-zinc-800 transition-colors">
                          <div className="space-y-1 min-w-0 flex-1">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="text-xs font-bold text-white truncate">{bk.title}</span>
                              <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full border ${statusColor}`}>
                                {statusLabel}
                              </span>
                            </div>
                            <p className="text-[10px] text-zinc-500">
                              {bk.pagesRead} / {bk.totalPages} págs • Intervalo: {bk.readingInterval || '—'}
                            </p>
                          </div>

                          {!isCurrentlyActive && bk.status !== 'lido' && (
                            <button
                              type="button"
                              onClick={() => handleResumeBookFromHistory(bk)}
                              className="px-3 py-1.5 bg-orange-500/10 hover:bg-orange-500/20 text-orange-400 border border-orange-500/20 rounded-lg text-[10px] font-bold transition-all shrink-0 flex items-center gap-1"
                            >
                              <Play className="h-3 w-3 fill-orange-400" />
                              Continuar Lendo
                            </button>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        </div>
      )}

      {/* Bible Tracker Configuration Modal */}
      {showBibleConfig && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-black/80 backdrop-blur-sm" onClick={() => setShowBibleConfig(false)} />
          <motion.div 
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-zinc-950 border border-zinc-800 rounded-2xl w-full max-w-md overflow-hidden z-50 p-6 space-y-4 shadow-2xl"
          >
            <div className="flex items-center justify-between border-b border-zinc-900 pb-2">
              <h3 className="text-sm font-black text-white uppercase tracking-wider flex items-center gap-2">
                <Book className="h-4.5 w-4.5 text-amber-500" />
                Configurar Plano da Bíblia
              </h3>
              <button onClick={() => setShowBibleConfig(false)} className="text-zinc-500 hover:text-white">✕</button>
            </div>

            {/* Programmatic warnings/estimates based on active inputs */}
            <div className="bg-amber-500/5 border border-amber-500/10 p-3.5 rounded-xl space-y-1.5">
              <span className="text-[9px] text-amber-400 font-bold block uppercase tracking-wider flex items-center gap-1">
                <AlertCircle className="h-3 w-3" /> Análise de Viabilidade
              </span>
              <p className="text-[10px] text-zinc-300 leading-relaxed">
                {bibleFormMode === 'capitulos' ? (
                  (bibleFormCapitulos * 365) < BIBLE_TOTAL_CHAPTERS ? (
                    <span className="text-red-400 font-bold">
                      Impossível completar a Bíblia 1 vez! No ritmo de {bibleFormCapitulos} capítulos por dia, você completará apenas {bibleFormCapitulos * 365} capítulos no ano. São necessários pelo menos {Math.ceil(BIBLE_TOTAL_CHAPTERS / 365)} capítulos por dia.
                    </span>
                  ) : (
                    <span className="text-emerald-400 font-bold flex items-center gap-1">
                      <Sparkles className="h-3.5 w-3.5" /> Meta possível! Você completará a Bíblia {((bibleFormCapitulos * 365) / BIBLE_TOTAL_CHAPTERS).toFixed(1)} vezes no ano.
                    </span>
                  )
                ) : (
                  <span className="text-amber-400 font-bold">
                    Para ler a Bíblia {bibleFormVezes} vez(es) em 1 ano (365 dias), você precisará ler pelo menos {Math.ceil((BIBLE_TOTAL_CHAPTERS * bibleFormVezes) / 365)} capítulos por dia.
                  </span>
                )}
              </p>
              <div className="text-[9px] text-zinc-500 leading-normal border-t border-zinc-850 pt-1.5">
                <span className="font-bold block text-zinc-400">Dica:</span>
                A Bíblia contém {BIBLE_TOTAL_CHAPTERS} capítulos. Como já estamos em julho de 2026, insira abaixo quantos capítulos você já leu para adaptar sua rotina aos {daysRemainingInYear} dias restantes!
              </div>
            </div>

            <form onSubmit={handleSaveBibleConfig} className="space-y-4">
              <div className="flex bg-zinc-900 p-1 rounded-lg border border-zinc-850">
                <button
                  type="button"
                  onClick={() => setBibleFormMode('vezes')}
                  className={`flex-1 text-center py-1.5 text-xs font-bold rounded transition-colors ${
                    bibleFormMode === 'vezes' ? 'bg-amber-500 text-zinc-950' : 'text-gray-400 hover:text-white'
                  }`}
                >
                  Vezes no Ano
                </button>
                <button
                  type="button"
                  onClick={() => setBibleFormMode('capitulos')}
                  className={`flex-1 text-center py-1.5 text-xs font-bold rounded transition-colors ${
                    bibleFormMode === 'capitulos' ? 'bg-amber-500 text-zinc-950' : 'text-gray-400 hover:text-white'
                  }`}
                >
                  Capítulos por Dia
                </button>
              </div>

              {bibleFormMode === 'vezes' ? (
                <div>
                  <label className="text-[10px] text-gray-400 font-bold block mb-1 uppercase">Quantas Vezes quer Ler no Ano?</label>
                  <input 
                    type="number"
                    min="1"
                    max="10"
                    required
                    value={bibleFormVezes}
                    onChange={(e) => setBibleFormVezes(Number(e.target.value))}
                    className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-orange-500/50 font-mono"
                  />
                </div>
              ) : (
                <div>
                  <label className="text-[10px] text-gray-400 font-bold block mb-1 uppercase">Quantos Capítulos Quer Ler por Dia?</label>
                  <input 
                    type="number"
                    min="1"
                    max="150"
                    required
                    value={bibleFormCapitulos}
                    onChange={(e) => setBibleFormCapitulos(Number(e.target.value))}
                    className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-orange-500/50 font-mono"
                  />
                </div>
              )}

              <div>
                <label className="text-[10px] text-gray-400 font-bold block mb-1 uppercase">Quantos Capítulos já leu até agora?</label>
                <input 
                  type="number"
                  min="0"
                  max={BIBLE_TOTAL_CHAPTERS * (bibleFormMode === 'vezes' ? bibleFormVezes : 5)}
                  required
                  value={bibleFormJaLidos}
                  onChange={(e) => setBibleFormJaLidos(Number(e.target.value))}
                  className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-orange-500/50 font-mono"
                />
                <span className="text-[9px] text-gray-500 mt-1 block">O sistema adaptará a leitura diária restante para os {daysRemainingInYear} dias restantes no ano de 2026!</span>
              </div>

              <div className="flex justify-end gap-2 border-t border-zinc-900 pt-3">
                <button
                  type="button"
                  onClick={() => setShowBibleConfig(false)}
                  className="text-xs text-gray-400 hover:text-white px-3 py-1.5 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="bg-amber-500 hover:bg-amber-600 text-zinc-950 font-bold text-xs px-4 py-1.5 rounded-lg transition-colors"
                >
                  Confirmar e Salvar
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
      </>
      ) : (
        <div className="space-y-6">
          {/* Header Card */}
          <div className="bg-zinc-950 border border-zinc-900 p-6 rounded-2xl space-y-6 shadow-xl relative overflow-hidden">
            <div className="absolute top-0 right-0 w-64 h-64 bg-orange-500/5 rounded-full blur-3xl -mr-20 -mt-20 pointer-events-none" />
            
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-zinc-900 pb-5">
              <div>
                <h2 className="text-lg font-black text-white flex items-center gap-2.5">
                  <Clock className="h-5.5 w-5.5 text-orange-500" /> Rotina Semanal
                </h2>
                <p className="text-xs text-zinc-400 mt-1">Organize seus blocos de tempo para máxima produtividade de segunda a domingo.</p>
              </div>
              
              <div className="flex items-center gap-2.5">
                <button
                  type="button"
                  onClick={() => setShowClearModal(true)}
                  className="text-xs font-semibold text-red-400 bg-red-400/5 hover:bg-red-400/10 border border-red-500/10 px-4 py-2 rounded-xl transition-all flex items-center gap-1.5"
                >
                  <Trash2 className="h-3.5 w-3.5" /> Limpar
                </button>
                <button
                  onClick={() => {
                    setEditingCell(null);
                    setCellText('');
                    setCellColor('Rotina');
                    setCellStartTime('08:00');
                    setCellEndTime('09:00');
                    setCellSelectedDays([1]);
                    setIsAddingBlock(true);
                  }}
                  className="bg-orange-500 hover:bg-orange-600 active:scale-95 text-white font-bold text-xs px-4.5 py-2.5 rounded-xl transition-all flex items-center gap-2 shadow-[0_4px_20px_rgba(249,115,22,0.25)]"
                >
                  <Plus className="h-4 w-4" /> Novo Bloco
                </button>
              </div>
            </div>

            {/* Category Legends */}
            <div className="flex flex-wrap items-center gap-x-5 gap-y-2.5 text-xs text-zinc-400">
              <span className="font-bold text-zinc-500 uppercase tracking-wider text-[10px] mr-1">Categorias:</span>
              <div className="flex items-center gap-2">
                <span className="h-2.5 w-2.5 rounded-full bg-indigo-500" />
                <span className="font-medium text-zinc-300">Trabalho</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="h-2.5 w-2.5 rounded-full bg-emerald-500" />
                <span className="font-medium text-zinc-300">Exercício</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="h-2.5 w-2.5 rounded-full bg-amber-500" />
                <span className="font-medium text-zinc-300">Estudo</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="h-2.5 w-2.5 rounded-full bg-rose-500" />
                <span className="font-medium text-zinc-300">Lazer</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="h-2.5 w-2.5 rounded-full bg-violet-500" />
                <span className="font-medium text-zinc-300">Rotina</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="h-2.5 w-2.5 rounded-full bg-zinc-500" />
                <span className="font-medium text-zinc-300">Outro</span>
              </div>
            </div>

            {/* Weekly Routine Grid Table */}
            <div className="overflow-x-auto rounded-2xl border border-zinc-900 bg-zinc-950/40 scrollbar-none shadow-inner">
              <table className="w-full border-collapse text-left min-w-[900px]">
                <thead>
                  <tr className="bg-zinc-900/20 border-b border-zinc-900 text-[11px] font-bold text-zinc-400 uppercase tracking-wider">
                    <th className="p-3.5 text-center border-r border-zinc-900 w-24">Hora</th>
                    {DAYS.map((day, idx) => (
                      <th key={day.id} className="p-3.5 border-r border-zinc-900">
                        <div className="flex items-baseline gap-1.5">
                          <span>{day.name}</span>
                          <span className="text-[10px] font-mono text-zinc-500 font-normal">{currentWeekDates[idx]}</span>
                        </div>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-900 text-xs">
                  {HOURS.map((hour) => (
                    <tr key={hour} className="group/row">
                      <td className="p-3 text-center font-mono font-bold text-zinc-500 border-r border-zinc-900 bg-zinc-950/80 select-none">
                        {hour}
                      </td>
                      {[1, 2, 3, 4, 5, 6, 7].map((dayId) => {
                        const cellInfo = getCellBlockInfo(hour, dayId);

                        if (cellInfo.type === 'start') {
                          const block = cellInfo.block;
                          const colorClasses = getBlockColorClasses(block.color || 'gray');
                          const rowSpan = cellInfo.rowSpan;
                          const displayEndTime = block.endTime || getNextHour(hour);

                          return (
                            <td 
                              key={dayId} 
                              rowSpan={rowSpan}
                              className="p-1 border-r border-zinc-900 align-top"
                            >
                              <div 
                                onClick={() => handleOpenEditModal(hour, dayId, block)}
                                className={`h-full p-2.5 rounded-none border flex flex-col justify-between transition-all hover:brightness-110 cursor-pointer shadow-md active:scale-[0.99] select-none ${colorClasses}`}
                                style={{ minHeight: `${rowSpan * 42}px` }}
                              >
                                <div className="space-y-1">
                                  <div className="font-bold text-xs leading-snug tracking-wide line-clamp-2">
                                    {block.text}
                                  </div>
                                </div>
                                <div className="font-mono text-[9px] opacity-70 mt-1">
                                  {hour} - {displayEndTime}
                                </div>
                              </div>
                            </td>
                          );
                        } else if (cellInfo.type === 'covered') {
                          return null;
                        } else {
                          // empty cell
                          return (
                            <td 
                              key={dayId} 
                              className="p-1 border-r border-zinc-900 group-hover/row:bg-zinc-900/5 transition-colors cursor-pointer"
                              onClick={() => handleOpenCreateModal(hour, dayId)}
                            >
                              <div className="h-10 rounded-none border border-dashed border-transparent hover:border-zinc-800 hover:bg-zinc-900/20 flex items-center justify-center transition-all group">
                                <span className="opacity-0 group-hover:opacity-100 text-[10px] font-bold text-orange-500 flex items-center gap-1">
                                  <Plus className="h-3 w-3" /> Adicionar
                                </span>
                              </div>
                            </td>
                          );
                        }
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Time Block creation/editing modal */}
          <AnimatePresence>
            {(isAddingBlock || editingCell) && (
              <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4">
                <motion.div 
                  initial={{ opacity: 0, scale: 0.95, y: 15 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95, y: 15 }}
                  transition={{ type: "spring", duration: 0.35 }}
                  className="bg-zinc-950 border border-zinc-850 w-full max-w-md rounded-2xl overflow-hidden shadow-2xl flex flex-col"
                >
                  {/* Header */}
                  <div className="p-5 border-b border-zinc-900 flex items-center justify-between">
                    <h3 className="text-sm font-black text-white uppercase tracking-wider">
                      {editingCell ? 'Editar Bloco' : 'Novo Bloco'}
                    </h3>
                    <button
                      onClick={() => {
                        setIsAddingBlock(false);
                        setEditingCell(null);
                      }}
                      className="text-zinc-400 hover:text-white bg-zinc-900 hover:bg-zinc-800 p-1.5 rounded-lg transition-colors"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>

                  {/* Form */}
                  <div className="p-5 space-y-5">
                    {/* Atividade */}
                    <div className="space-y-1.5">
                      <label className="text-[10px] text-zinc-400 uppercase font-bold tracking-wider block">Atividade</label>
                      <input
                        type="text"
                        value={cellText}
                        onChange={(e) => setCellText(e.target.value)}
                        placeholder="Nome do bloco de tempo"
                        className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-orange-500/50 transition-colors"
                        maxLength={40}
                        autoFocus
                      />
                    </div>

                    {/* Dias da Semana (Selecione Vários) */}
                    <div className="space-y-2">
                      <label className="text-[10px] text-zinc-400 uppercase font-bold tracking-wider block">Dias da semana (selecione vários)</label>
                      <div className="flex gap-1.5 justify-between">
                        {DAYS.map((day) => {
                          const isSelected = cellSelectedDays.includes(day.id);
                          const dayLabel = day.name.substring(0, 3); // "Seg", "Ter", etc.
                          return (
                            <button
                              key={day.id}
                              type="button"
                              onClick={() => {
                                if (cellSelectedDays.includes(day.id)) {
                                  // Don't allow empty days list
                                  if (cellSelectedDays.length > 1) {
                                    setCellSelectedDays(cellSelectedDays.filter(id => id !== day.id));
                                  }
                                } else {
                                  setCellSelectedDays([...cellSelectedDays, day.id]);
                                }
                              }}
                              className={`flex-1 py-2 text-xs font-bold rounded-lg border transition-all ${
                                isSelected
                                  ? 'bg-orange-500 border-orange-500 text-white shadow-lg shadow-orange-500/10 shadow-orange-500/25 border-transparent'
                                  : 'bg-zinc-900 border-zinc-850 text-zinc-400 hover:text-white hover:border-zinc-750'
                              }`}
                            >
                              {dayLabel}
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    {/* Início & Fim */}
                    <div className="space-y-2">
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                          <label className="text-[10px] text-zinc-400 uppercase font-bold tracking-wider block flex items-center justify-between">
                            <span>Início</span>
                            <span className="text-[9px] text-orange-400 font-mono font-normal">ex: 07:30</span>
                          </label>
                          <input
                            type="text"
                            value={cellStartTime}
                            onChange={(e) => setCellStartTime(e.target.value)}
                            placeholder="07:30"
                            className="w-full bg-zinc-900 border border-zinc-850 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-orange-500/50 font-mono transition-colors"
                          />
                        </div>

                        <div className="space-y-1.5">
                          <label className="text-[10px] text-zinc-400 uppercase font-bold tracking-wider block flex items-center justify-between">
                            <span>Fim</span>
                            <span className="text-[9px] text-orange-400 font-mono font-normal">ex: 08:43</span>
                          </label>
                          <input
                            type="text"
                            value={cellEndTime}
                            onChange={(e) => setCellEndTime(e.target.value)}
                            placeholder="08:43"
                            className="w-full bg-zinc-900 border border-zinc-850 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-orange-500/50 font-mono transition-colors"
                          />
                        </div>
                      </div>

                      {/* Quick Presets for Custom Intervals */}
                      <div className="flex flex-wrap gap-1.5 pt-1">
                        <span className="text-[9px] font-bold text-zinc-500 uppercase tracking-wider self-center">Atalhos:</span>
                        {[
                          { label: '7:30 - 8:43', start: '07:30', end: '08:43' },
                          { label: '08:00 - 09:00', start: '08:00', end: '09:00' },
                          { label: '09:00 - 10:30', start: '09:00', end: '10:30' },
                          { label: '14:00 - 15:30', start: '14:00', end: '15:30' }
                        ].map((preset) => (
                          <button
                            key={preset.label}
                            type="button"
                            onClick={() => {
                              setCellStartTime(preset.start);
                              setCellEndTime(preset.end);
                            }}
                            className={`px-2 py-0.5 text-[9px] font-mono rounded border transition-all ${
                              cellStartTime === preset.start && cellEndTime === preset.end
                                ? 'bg-orange-500/20 border-orange-500/50 text-orange-400 font-bold'
                                : 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:text-white'
                            }`}
                          >
                            {preset.label}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Categoria */}
                    <div className="space-y-2">
                      <label className="text-[10px] text-zinc-400 uppercase font-bold tracking-wider block">Categoria</label>
                      <div className="grid grid-cols-3 gap-2">
                        {[
                          { id: 'Trabalho', icon: Briefcase, color: 'bg-indigo-600' },
                          { id: 'Exercício', icon: Dumbbell, color: 'bg-emerald-600' },
                          { id: 'Estudo', icon: BookOpen, color: 'bg-amber-600' },
                          { id: 'Lazer', icon: Gamepad2, color: 'bg-rose-600' },
                          { id: 'Rotina', icon: Coffee, color: 'bg-violet-500' },
                          { id: 'Outro', icon: MoreHorizontal, color: 'bg-zinc-700' }
                        ].map((cat) => {
                          const isSelected = cellColor.toLowerCase() === cat.id.toLowerCase();
                          const IconComponent = cat.icon;
                          return (
                            <button
                              key={cat.id}
                              type="button"
                              onClick={() => setCellColor(cat.id)}
                              className={`py-2 px-3 rounded-xl border text-xs font-bold flex flex-col items-center gap-1.5 transition-all ${
                                isSelected
                                  ? `${cat.color} border-transparent text-white scale-[1.03] shadow-md`
                                  : 'bg-zinc-900 border-zinc-850 text-zinc-400 hover:text-white hover:border-zinc-750'
                              }`}
                            >
                              <IconComponent className="h-4 w-4" />
                              <span>{cat.id}</span>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  </div>

                  {/* Footer Action Buttons */}
                  <div className="p-5 border-t border-zinc-900 bg-zinc-950/50 flex items-center justify-between gap-3">
                    {editingCell ? (
                      <button
                        type="button"
                        onClick={() => {
                          const updated = { ...gridRoutine };
                          if (originalGroupKeys.length > 0) {
                            originalGroupKeys.forEach(k => delete updated[k]);
                          }
                          if (editingCell) {
                            delete updated[`${editingCell.hour}-${editingCell.day}`];
                          }
                          saveGridRoutine(updated);
                          setEditingCell(null);
                        }}
                        className="text-xs font-semibold text-red-400 bg-red-400/5 hover:bg-red-400/10 hover:text-red-300 border border-red-500/10 px-4 py-2 rounded-xl transition-all flex items-center gap-1.5"
                      >
                        <Trash2 className="h-3.5 w-3.5" /> Excluir
                      </button>
                    ) : (
                      <div /> // placeholder for alignment
                    )}

                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          setIsAddingBlock(false);
                          setEditingCell(null);
                        }}
                        className="text-xs font-semibold text-zinc-400 hover:text-white px-4 py-2 transition-colors"
                      >
                        Cancelar
                      </button>
                      <button
                        type="button"
                        disabled={!cellText.trim()}
                        onClick={() => {
                          const updated = { ...gridRoutine };
                          
                          // If editing, delete all original group keys
                          if (editingCell) {
                            if (originalGroupKeys.length > 0) {
                              originalGroupKeys.forEach(k => delete updated[k]);
                            }
                            delete updated[`${editingCell.hour}-${editingCell.day}`];
                          }

                          // Save block for each selected day
                          cellSelectedDays.forEach(dayId => {
                            updated[`${cellStartTime}-${dayId}`] = {
                              text: cellText.trim(),
                              color: cellColor,
                              startTime: cellStartTime,
                              endTime: cellEndTime
                            };
                          });

                          saveGridRoutine(updated);
                          setIsAddingBlock(false);
                          setEditingCell(null);
                        }}
                        className="bg-orange-500 hover:bg-orange-600 disabled:opacity-50 text-white font-bold text-xs px-5 py-2 rounded-xl transition-all shadow-[0_4px_15px_rgba(249,115,22,0.2)]"
                      >
                        {editingCell ? 'Salvar' : 'Adicionar'}
                      </button>
                    </div>
                  </div>
                </motion.div>
              </div>
            )}
          </AnimatePresence>

          {/* Confirmation Modal for Clearing Weekly Routine */}
          <AnimatePresence>
            {showClearModal && (
              <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
                <motion.div 
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  className="bg-zinc-950 border border-zinc-800 rounded-2xl p-6 max-w-md w-full shadow-2xl space-y-4"
                >
                  <div className="flex items-center gap-3 text-red-400">
                    <div className="p-2.5 rounded-xl bg-red-500/10 border border-red-500/20">
                      <Trash2 className="h-6 w-6 text-red-400" />
                    </div>
                    <div>
                      <h3 className="text-base font-bold text-white">Limpar Rotina Semanal</h3>
                      <p className="text-xs text-zinc-400">Esta ação não poderá ser desfeita.</p>
                    </div>
                  </div>
                  
                  <p className="text-xs text-zinc-300 leading-relaxed">
                    Tem certeza de que deseja remover todos os blocos de horário e atividades da sua rotina semanal? A grade ficará totalmente vazia.
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
                        saveGridRoutine({});
                        if (propSetRoutine) propSetRoutine([]);
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
      )}

      {/* Modal 1: Editar Tarefa Diária */}
      <AnimatePresence>
        {editingTask && !showDeleteConfirmModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              className="bg-zinc-950 border border-zinc-800 rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl flex flex-col max-h-[90vh]"
            >
              {/* Modal Header */}
              <div className="p-4 sm:p-5 border-b border-zinc-800/80 flex items-center justify-between bg-zinc-900/40">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 bg-orange-500/10 rounded-xl border border-orange-500/20">
                    <Edit3 className="h-4 sm:h-5 w-4 sm:w-5 text-orange-500" />
                  </div>
                  <div>
                    <h3 className="text-sm sm:text-base font-bold text-white tracking-tight">Editar Tarefa Diária</h3>
                    <p className="text-[10px] sm:text-xs text-zinc-400">Ajuste os detalhes, etapas, lembrete e recorrência</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setEditingTask(null)}
                  className="p-1.5 text-zinc-400 hover:text-white rounded-lg hover:bg-zinc-800 transition-colors"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              {/* Modal Body */}
              <form onSubmit={handleSaveEditedTask} className="p-4 sm:p-5 space-y-4 overflow-y-auto flex-1">
                {/* Nome da Tarefa */}
                <div>
                  <label className="text-[10px] text-gray-400 uppercase font-bold block mb-1">
                    Nome da Tarefa <span className="text-orange-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={editText}
                    onChange={(e) => setEditText(e.target.value)}
                    placeholder="Ex: Treinar na academia, Beber 3L de água..."
                    className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-3.5 py-2.5 text-xs sm:text-sm text-white focus:outline-none focus:border-orange-500/60 transition-colors"
                    required
                  />
                </div>

                {/* Recorrência */}
                <div>
                  <label className="text-[10px] text-gray-400 uppercase font-bold block mb-1">
                    Recorrência da Tarefa
                  </label>
                  <div className="grid grid-cols-2 gap-2.5">
                    <button
                      type="button"
                      onClick={() => setEditIsRecurring(true)}
                      className={`p-3 rounded-xl border text-left transition-all flex flex-col gap-1 ${
                        editIsRecurring
                          ? 'bg-orange-500/10 border-orange-500/50 text-orange-400'
                          : 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:text-zinc-200'
                      }`}
                    >
                      <div className="flex items-center gap-1.5 font-bold text-xs">
                        <Clock className="h-3.5 w-3.5 text-orange-500" />
                        <span>Todos os dias</span>
                      </div>
                      <span className="text-[10px] text-zinc-400 leading-tight">
                        Recorrente diariamente (reseta a cada novo dia)
                      </span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setEditIsRecurring(false)}
                      className={`p-3 rounded-xl border text-left transition-all flex flex-col gap-1 ${
                        !editIsRecurring
                          ? 'bg-orange-500/10 border-orange-500/50 text-orange-400'
                          : 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:text-zinc-200'
                      }`}
                    >
                      <div className="flex items-center gap-1.5 font-bold text-xs">
                        <Calendar className="h-3.5 w-3.5 text-orange-500" />
                        <span>Apenas no dia criada</span>
                      </div>
                      <span className="text-[10px] text-zinc-400 leading-tight">
                        Disponível apenas no dia atual / em que foi criada
                      </span>
                    </button>
                  </div>
                </div>

                {/* Pilar de Organização e Período */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="text-[10px] text-gray-400 uppercase font-bold block mb-1">
                      Pilar de Organização
                    </label>
                    <select
                      value={editCategory}
                      onChange={(e) => setEditCategory(e.target.value)}
                      className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-orange-500/60"
                    >
                      <option value="O Básico">O Básico (Checklist/Hábitos)</option>
                      <option value="Segundo Cérebro">Segundo Cérebro (Estudos/Notas)</option>
                      <option value="Metas">Metas e Projetos</option>
                      <option value="Canalização">Canalização e Ação</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-[10px] text-gray-400 uppercase font-bold block mb-1">
                      Período do Dia
                    </label>
                    <select
                      value={editPeriod}
                      onChange={(e) => setEditPeriod(e.target.value as any)}
                      className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-orange-500/60"
                    >
                      <option value="geral">Geral / Dia Todo</option>
                      <option value="manha">Manhã (Rotina Matinal)</option>
                      <option value="noite">Noite (Rotina Noturna)</option>
                    </select>
                  </div>
                </div>

                {/* Horário de Lembrete (Notificação) */}
                <div>
                  <label className="text-[10px] text-gray-400 uppercase font-bold block mb-1 flex items-center justify-between">
                    <span>Horário do Lembrete (Notificação)</span>
                    {editReminderTime && (
                      <button
                        type="button"
                        onClick={() => setEditReminderTime('')}
                        className="text-[9px] text-zinc-500 hover:text-orange-400 lowercase font-mono"
                      >
                        remover lembrete
                      </button>
                    )}
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="time"
                      value={editReminderTime}
                      onChange={(e) => setEditReminderTime(e.target.value)}
                      className="flex-1 bg-zinc-900 border border-zinc-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-orange-500/60"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        if (typeof Notification !== 'undefined') {
                          if (Notification.permission !== 'granted') {
                            Notification.requestPermission().then(permission => {
                              if (permission === 'granted') {
                                alert('Notificações no navegador ativadas!');
                              } else {
                                alert('Permissão para notificações foi negada no seu navegador.');
                              }
                            });
                          } else {
                            alert('Notificações no navegador já estão ativadas!');
                          }
                        } else {
                          alert('Seu navegador não suporta notificações de sistema.');
                        }
                      }}
                      className="px-3 py-2 bg-zinc-900 border border-zinc-800 hover:bg-zinc-800 text-zinc-300 rounded-xl text-xs flex items-center gap-1.5 transition-colors shrink-0"
                    >
                      <Bell className="h-3.5 w-3.5 text-indigo-400" />
                      <span>Notificações</span>
                    </button>
                  </div>
                </div>

                {/* Etapas / Subtarefas */}
                <div className="border-t border-zinc-900 pt-3 space-y-2">
                  <label className="text-[10px] text-gray-400 uppercase font-bold block">
                    Etapas / Subtarefas ({editSubtasks.length})
                  </label>

                  {/* Input para adicionar nova etapa */}
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={editSubtaskInput}
                      onChange={(e) => setEditSubtaskInput(e.target.value)}
                      placeholder="Adicionar uma nova etapa..."
                      className="flex-1 bg-zinc-900 border border-zinc-800 rounded-xl px-3 py-1.5 text-xs text-white focus:outline-none focus:border-orange-500/60"
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          handleAddEditSubtask();
                        }
                      }}
                    />
                    <button
                      type="button"
                      onClick={handleAddEditSubtask}
                      className="bg-zinc-800 hover:bg-zinc-700 text-orange-400 font-bold text-xs px-3.5 py-1.5 rounded-xl border border-zinc-700/50 transition-colors"
                    >
                      + Etapa
                    </button>
                  </div>

                  {/* Lista de Etapas */}
                  {editSubtasks.length > 0 && (
                    <div className="space-y-1.5 bg-zinc-900/50 p-2.5 rounded-xl border border-zinc-800/80 max-h-[160px] overflow-y-auto">
                      {editSubtasks.map((st) => (
                        <div key={st.id} className="flex items-center gap-2 bg-zinc-950 p-2 rounded-lg border border-zinc-800/60">
                          <button
                            type="button"
                            onClick={() => handleToggleEditSubtask(st.id)}
                            className={`h-4 w-4 rounded border flex items-center justify-center transition-all shrink-0 ${
                              st.completed
                                ? 'bg-orange-500 border-orange-500 text-white'
                                : 'border-zinc-700 bg-zinc-900'
                            }`}
                          >
                            {st.completed && <Check className="h-2.5 w-2.5 stroke-[3]" />}
                          </button>
                          <input
                            type="text"
                            value={st.text}
                            onChange={(e) => handleUpdateEditSubtaskText(st.id, e.target.value)}
                            className={`flex-1 bg-transparent text-xs focus:outline-none ${
                              st.completed ? 'line-through text-zinc-500' : 'text-zinc-200'
                            }`}
                          />
                          <button
                            type="button"
                            onClick={() => handleRemoveEditSubtask(st.id)}
                            className="text-zinc-500 hover:text-red-400 p-1 transition-colors"
                            title="Excluir Etapa"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Modal Footer */}
                <div className="border-t border-zinc-900 pt-3.5 flex items-center justify-between gap-3">
                  <button
                    type="button"
                    onClick={() => setShowDeleteConfirmModal(true)}
                    className="text-xs font-bold text-red-500 hover:text-red-400 hover:bg-red-500/10 px-3 py-2 rounded-xl border border-red-500/20 transition-colors flex items-center gap-1.5"
                  >
                    <Trash2 className="h-3.5 w-3.5" /> Excluir Tarefa
                  </button>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setEditingTask(null)}
                      className="text-xs text-zinc-400 hover:text-white px-3.5 py-2 rounded-xl transition-colors"
                    >
                      Cancelar
                    </button>
                    <button
                      type="submit"
                      className="bg-orange-500 hover:bg-orange-600 text-white font-bold text-xs px-4 py-2 rounded-xl transition-all shadow-lg shadow-orange-500/20"
                    >
                      Salvar Alterações
                    </button>
                  </div>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Modal 2: Confirmação de Exclusão */}
      <AnimatePresence>
        {showDeleteConfirmModal && editingTask && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/85 backdrop-blur-md">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="bg-zinc-950 border border-red-500/30 rounded-2xl p-5 w-full max-w-md shadow-2xl space-y-4"
            >
              <div className="flex items-center gap-3 text-red-500">
                <div className="p-2.5 bg-red-500/10 rounded-xl border border-red-500/20">
                  <AlertTriangle className="h-6 w-6 text-red-500" />
                </div>
                <div>
                  <h4 className="text-base font-black text-white">Excluir Tarefa?</h4>
                  <p className="text-xs text-zinc-400">Esta ação não poderá ser desfeita.</p>
                </div>
              </div>

              <p className="text-xs text-zinc-300 bg-zinc-900/60 p-3 rounded-xl border border-zinc-800/60 leading-relaxed">
                Tem certeza de que deseja excluir permanentemente a tarefa <strong className="text-white">"{editingTask.text}"</strong>?
              </p>

              <div className="flex items-center justify-end gap-2.5 pt-2">
                <button
                  type="button"
                  onClick={() => setShowDeleteConfirmModal(false)}
                  className="px-4 py-2 text-xs font-semibold text-zinc-400 hover:text-white bg-zinc-900 hover:bg-zinc-800 rounded-xl border border-zinc-800 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={handleConfirmDeleteFromModal}
                  className="px-4 py-2 text-xs font-bold text-white bg-red-600 hover:bg-red-500 rounded-xl transition-colors shadow-lg shadow-red-600/30"
                >
                  Sim, Excluir
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}
