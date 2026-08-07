import React, { useState, useEffect, useRef } from 'react';
import { 
  FileText, 
  CalendarDays, 
  BookOpen, 
  Book, 
  Check, 
  Sparkles, 
  Sliders, 
  Heart, 
  Zap, 
  Clock, 
  X, 
  Save, 
  Trash2, 
  Plus, 
  Star, 
  Edit, 
  CheckSquare, 
  Compass, 
  User, 
  PlusCircle, 
  Layers,
  Award,
  BookMarked,
  BarChart,
  HelpCircle,
  Eye,
  CheckCircle2,
  Calendar,
  ChevronDown,
  ChevronUp,
  Upload,
  TrendingUp,
  Pause,
  Play,
  Folder
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import TagManagementModal from './TagManagementModal';
import TagInputWithMention from './TagInputWithMention';
import { CalendarNote, DailyTask, MonthlyReview, WeeklyReview, YearlyBook, SubTask, Goal, FinanceEntry } from '../types';
import { calculateReadingInterval, formatDateBR } from '../utils/bookUtils';
import { handleAutoListKeyDown, formatTimeInput, moveCursorToEnd } from '../utils/listUtils';

interface AnuaisViewProps {
  notes: CalendarNote[];
  setNotes: React.Dispatch<React.SetStateAction<CalendarNote[]>>;
  addXp: (amount: number) => void;
  dailyTasks: DailyTask[];
  monthlyReviews: MonthlyReview[];
  setMonthlyReviews: React.Dispatch<React.SetStateAction<MonthlyReview[]>>;
  weeklyReviews: WeeklyReview[];
  setWeeklyReviews: React.Dispatch<React.SetStateAction<WeeklyReview[]>>;
  bookTracker: any;
  setBookTracker?: React.Dispatch<React.SetStateAction<any>>;
  bibleTracker: any;
  routine: any;
  goals?: Goal[];
  finances?: FinanceEntry[];
  books?: YearlyBook[];
  setBooks?: React.Dispatch<React.SetStateAction<YearlyBook[]>>;
  freeEditMode?: boolean;
}

export default function AnuaisView({
  notes,
  setNotes,
  addXp,
  dailyTasks,
  monthlyReviews,
  setMonthlyReviews,
  weeklyReviews,
  setWeeklyReviews,
  bookTracker,
  setBookTracker,
  bibleTracker,
  routine,
  goals = [],
  finances = [],
  books: propBooks,
  setBooks: propSetBooks,
  freeEditMode = false
}: AnuaisViewProps) {
  const [selectedYear, setSelectedYear] = useState(() => Math.max(2026, new Date().getFullYear()));
  const [selectedMonthIndex, setSelectedMonthIndex] = useState<number>(0); // 0-11 for months, -1 for "Livros"

  const isBookInMonthAndYear = (bk: YearlyBook, yr: number, monthIdx: number) => {
    if (bk.year !== yr) return false;

    if (bk.readingInterval && bk.readingInterval.trim()) {
      const regex = /\/(\d{1,2})/g;
      let match;
      const monthsFound: number[] = [];
      while ((match = regex.exec(bk.readingInterval)) !== null) {
        monthsFound.push(parseInt(match[1], 10) - 1);
      }
      if (monthsFound.length > 0) {
        return monthsFound.includes(monthIdx);
      }
    }

    if (bk.startDate) {
      const d = new Date(bk.startDate);
      if (d.getFullYear() === yr && d.getMonth() === monthIdx) return true;
    }
    if (bk.endDate) {
      const d = new Date(bk.endDate);
      if (d.getFullYear() === yr && d.getMonth() === monthIdx) return true;
    }

    return false;
  };

  const getCompletedTasksAverage = () => {
    const monthNotes = notes.filter(n => {
      if (!n.date) return false;
      const [y, m, d] = n.date.split('-').map(Number);
      return y === selectedYear && (m - 1) === selectedMonthIndex;
    });

    let totalCompleted = 0;
    let totalTasksCount = 0;
    let daysWithChecklist = 0;

    monthNotes.forEach(note => {
      if (note.checklist && note.checklist.length > 0) {
        daysWithChecklist++;
        note.checklist.forEach(t => {
          totalTasksCount++;
          if (t.completed) {
            totalCompleted++;
          }
        });
      }
    });

    const avgCompletedPerDay = daysWithChecklist > 0 ? (totalCompleted / daysWithChecklist).toFixed(1) : '0';
    const successPercentage = totalTasksCount > 0 ? Math.round((totalCompleted / totalTasksCount) * 100) : 0;

    return {
      avg: avgCompletedPerDay,
      percent: successPercentage,
      days: daysWithChecklist,
      total: totalCompleted
    };
  };

  const getMonthlyFinancialBalance = () => {
    if (!finances || finances.length === 0) return 0;
    
    const list: FinanceEntry[] = [];
    
    finances.forEach(entry => {
      const tDate = new Date(entry.date + 'T12:00:00');
      const tYear = tDate.getFullYear();
      const tMonth = tDate.getMonth();
      
      if (selectedYear < tYear || (selectedYear === tYear && selectedMonthIndex < tMonth)) {
        return;
      }
      
      if (selectedYear === tYear && selectedMonthIndex === tMonth) {
        list.push(entry);
        return;
      }
      
      if (entry.isRecurring) {
        let isActive = false;
        
        if (entry.recurringType === 'always') {
          isActive = true;
        } else if (entry.recurringType === 'months') {
          const diffMonths = (selectedYear - tYear) * 12 + (selectedMonthIndex - tMonth);
          isActive = diffMonths < (entry.recurringMonths || 1);
        } else if (entry.recurringType === 'until_date') {
          if (entry.recurringUntilDate) {
            const limitDate = new Date(entry.recurringUntilDate + 'T12:00:00');
            const targetDate = new Date(selectedYear, selectedMonthIndex, 15);
            isActive = targetDate <= limitDate || (selectedYear === limitDate.getFullYear() && selectedMonthIndex === limitDate.getMonth());
          }
        }
        
        if (isActive) {
          list.push(entry);
        }
      }
    });
    
    const income = list.filter(e => e.type === 'income').reduce((sum, e) => sum + e.amount, 0);
    const expense = list.filter(e => e.type === 'expense').reduce((sum, e) => sum + e.amount, 0);
    const investment = list.filter(e => e.type === 'investment').reduce((sum, e) => sum + e.amount, 0);
    
    return income - expense - investment;
  };

  const formatBRL = (val: number) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);
  };
  const [viewMode, setViewMode] = useState<'lista' | 'galeria'>('lista');
  const [isTagModalOpen, setIsTagModalOpen] = useState(false);

  // Year Overview Card View mode and custom background covers
  const [viewingDetail, setViewingDetail] = useState(false);
  const [editingImageYear, setEditingImageYear] = useState<number | null>(null);
  const [imageUrlInput, setImageUrlInput] = useState('');
  const [yearlyImages, setYearlyImages] = useState<Record<number, string>>(() => {
    const saved = localStorage.getItem('mbc_yearly_images');
    if (saved) {
      try { return JSON.parse(saved); } catch (e) { console.error(e); }
    }
    return {
      2024: 'https://images.unsplash.com/photo-1579783902614-a3fb3927b6a5?q=80&w=1000',
      2025: 'https://images.unsplash.com/photo-1513364776144-60967b0f800f?q=80&w=1000',
      2026: 'https://images.unsplash.com/photo-1541701494587-cb58502866ab?q=80&w=1000',
      2027: 'https://images.unsplash.com/photo-1501472312651-726afd116ff1?q=80&w=1000',
      2028: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?q=80&w=1000',
      2029: 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?q=80&w=1000',
      2030: 'https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?q=80&w=1000'
    };
  });

  useEffect(() => {
    localStorage.setItem('mbc_yearly_images', JSON.stringify(yearlyImages));
  }, [yearlyImages]);

  // Dynamic Year List State & New Year addition states
  const [overviewYears, setOverviewYears] = useState<number[]>(() => {
    const saved = localStorage.getItem('mbc_overview_years');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed.sort((a, b) => a - b);
        }
      } catch (e) {
        console.error(e);
      }
    }
    return [2024, 2025, 2026, 2027, 2028, 2029, 2030];
  });

  useEffect(() => {
    localStorage.setItem('mbc_overview_years', JSON.stringify(overviewYears));
  }, [overviewYears]);

  const [isEditingMonthlyReview, setIsEditingMonthlyReview] = useState(false);

  // Synchronize monthly review inputs dynamically with the selected year/month index
  useEffect(() => {
    const r = monthlyReviews.find(mr => mr.year === selectedYear && mr.month === selectedMonthIndex);
    if (r) {
      setMonthlyOneSentence(r.oneSentence || '');
      setMonthlyMemorableMoments(r.memorableMoments || []);
      setMonthlyLearnings(r.learnings || []);
      setMonthlyImprovements(r.improvements || []);
      setIsEditingMonthlyReview(false);
    } else {
      setMonthlyOneSentence('');
      setMonthlyMemorableMoments([]);
      setMonthlyLearnings([]);
      setMonthlyImprovements([]);
      setIsEditingMonthlyReview(true);
    }
    setNewMoment('');
    setNewLearning('');
    setNewImprovement('');
  }, [selectedYear, selectedMonthIndex, monthlyReviews]);

  // Collapsible sections in monthly view
  const [isMonthlyReviewOpen, setIsMonthlyReviewOpen] = useState(() => {
    return localStorage.getItem('mbc_is_monthly_review_open') !== 'false';
  });
  const [isWeeklyReviewsOpen, setIsWeeklyReviewsOpen] = useState(() => {
    return localStorage.getItem('mbc_is_weekly_reviews_open') !== 'false';
  });

  useEffect(() => {
    localStorage.setItem('mbc_is_monthly_review_open', String(isMonthlyReviewOpen));
  }, [isMonthlyReviewOpen]);

  useEffect(() => {
    localStorage.setItem('mbc_is_weekly_reviews_open', String(isWeeklyReviewsOpen));
  }, [isWeeklyReviewsOpen]);

  const [isAddingYear, setIsAddingYear] = useState(false);
  const [newYearInput, setNewYearInput] = useState('');
  const [addYearError, setAddYearError] = useState('');

  // Weekly review dropdown state
  const [expandedWeekNum, setExpandedWeekNum] = useState<number | null>(null);

  const handleAddYear = () => {
    setAddYearError('');
    const yr = parseInt(newYearInput.trim(), 10);
    if (isNaN(yr) || yr < 1900 || yr > 2100) {
      setAddYearError('Ano inválido (1900-2100)');
      return;
    }
    if (overviewYears.includes(yr)) {
      setAddYearError('Este ano já existe!');
      return;
    }
    setOverviewYears(prev => [...prev, yr].sort((a, b) => a - b));
    setNewYearInput('');
    setIsAddingYear(false);
    addXp(50);
  };

  // Daily Workspace states
  const [selectedDateStr, setSelectedDateStr] = useState<string | null>(null);
  const [activeTopic, setActiveTopic] = useState<'diario' | 'checklist' | 'espiritualidade' | 'alteregos' | 'saude'>('diario');
  const [activeSubtopic, setActiveSubtopic] = useState<'gratidao' | 'decretos' | 'oracao'>('gratidao');

  // Active day editor states
  const [journalText, setJournalText] = useState('');
  const [gratitudeText, setGratitudeText] = useState('');
  const [decreesText, setDecreesText] = useState('');
  const [prayerText, setPrayerText] = useState('');
  const [sleepBedTime, setSleepBedTime] = useState('');
  const [sleepWakeTime, setSleepWakeTime] = useState('');
  const [foodMorning, setFoodMorning] = useState('');
  const [foodAfternoon, setFoodAfternoon] = useState('');
  const [foodNight, setFoodNight] = useState('');
  const [waterLiters, setWaterLiters] = useState(0);
  const [dayChecklist, setDayChecklist] = useState<DailyTask[]>([]);
  const [alterEgoWinner, setAlterEgoWinner] = useState<'Alfredo' | 'Beto' | null>(null);
  const [alterEgoText, setAlterEgoText] = useState('');
  const [newDayTaskText, setNewDayTaskText] = useState('');
  const [savingStatus, setSavingStatus] = useState<'idle' | 'saving' | 'saved'>('idle');

  // Master templates retrieved from localStorage or defaults
  const [templateGratitude, setTemplateGratitude] = useState(() => {
    return localStorage.getItem('planner_template_gratitude') || '1. \n2. \n3. ';
  });
  const [templateDecrees, setTemplateDecrees] = useState(() => {
    return localStorage.getItem('planner_template_decretos') || 'Eu sou abundante, focado e resiliente.';
  });
  const [templatePrayer, setTemplatePrayer] = useState(() => {
    return localStorage.getItem('planner_template_oracao') || 'Senhor, guie meus passos hoje.';
  });

  // Yearly Books states
  const [localBooks, setLocalBooks] = useState<YearlyBook[]>(() => {
    const saved = localStorage.getItem('mbc_yearly_books');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error('Failed to parse mbc_yearly_books', e);
      }
    }
    // Seed some demo books
    return [
      {
        id: 'book-1',
        year: 2026,
        title: 'Hábitos Atômicos',
        author: 'James Clear',
        totalPages: 320,
        pagesRead: 140,
        status: 'lendo',
        rating: 4,
        review: 'Excelente livro sobre micro-hábitos e disciplina.',
        startDate: '2026-01-02',
        readingInterval: '02/01/2026 - Em andamento'
      },
      {
        id: 'book-2',
        year: 2026,
        title: 'O Homem Mais Rico da Babilônia',
        author: 'George S. Clason',
        totalPages: 160,
        pagesRead: 160,
        status: 'lido',
        rating: 5,
        review: 'Leitura obrigatória sobre finanças e poupança.',
        startDate: '2026-02-10',
        endDate: '2026-02-25',
        readingInterval: '10/02/2026 a 25/02/2026'
      },
      {
        id: 'book-3',
        year: 2026,
        title: 'A Única Coisa',
        author: 'Gary Keller',
        totalPages: 240,
        pagesRead: 0,
        status: 'quero_ler',
        rating: 0,
        review: '',
        readingInterval: 'A iniciar'
      }
    ];
  });

  const books = propBooks || localBooks;
  const setBooks = propSetBooks || setLocalBooks;

  // Save books list to localStorage whenever local state changes
  useEffect(() => {
    if (!propBooks) {
      localStorage.setItem('mbc_yearly_books', JSON.stringify(localBooks));
    }
  }, [localBooks, propBooks]);

  // Book edit form states
  const [isBookModalOpen, setIsBookModalOpen] = useState(false);
  const [editingBookId, setEditingBookId] = useState<string | null>(null);
  const [bookTitle, setBookTitle] = useState('');
  const [bookAuthor, setBookAuthor] = useState('');
  const [bookTotalPages, setBookTotalPages] = useState(200);
  const [bookPagesRead, setBookPagesRead] = useState(0);
  const [bookStatus, setBookStatus] = useState<'lendo' | 'lido' | 'quero_ler' | 'dropado'>('quero_ler');
  const [bookRating, setBookRating] = useState(0);
  const [bookReview, setBookReview] = useState('');
  const [bookReadingInterval, setBookReadingInterval] = useState('');
  const [bookFilterTab, setBookFilterTab] = useState<'todos' | 'lendo' | 'lido' | 'quero_ler' | 'dropado'>('todos');

  // Monthly Review Form states (for the selected month in the selected year)
  const [isMonthlyReviewModalOpen, setIsMonthlyReviewModalOpen] = useState(false);
  const [monthlyOneSentence, setMonthlyOneSentence] = useState('');
  const [monthlyMemorableMoments, setMonthlyMemorableMoments] = useState<string[]>([]);
  const [monthlyLearnings, setMonthlyLearnings] = useState<string[]>([]);
  const [monthlyImprovements, setMonthlyImprovements] = useState<string[]>([]);
  const [newMoment, setNewMoment] = useState('');
  const [newLearning, setNewLearning] = useState('');
  const [newImprovement, setNewImprovement] = useState('');
  const [monthlyReviewSavingStatus, setMonthlyReviewSavingStatus] = useState<'idle' | 'saving' | 'saved'>('idle');

  // Weekly Review states
  const [isWeeklyReviewModalOpen, setIsWeeklyReviewModalOpen] = useState(false);
  const [selectedWeekNum, setSelectedWeekNum] = useState<number | null>(null);
  const [weeklyOneSentence, setWeeklyOneSentence] = useState('');
  const [weeklyMemorableMoments, setWeeklyMemorableMoments] = useState<string[]>([]);
  const [weeklyLearnings, setWeeklyLearnings] = useState<string[]>([]);
  const [weeklyImprovements, setWeeklyImprovements] = useState<string[]>([]);
  const [weeklyReadings, setWeeklyReadings] = useState('');
  const [newWeekMoment, setNewWeekMoment] = useState('');
  const [newWeekLearning, setNewWeekLearning] = useState('');
  const [newWeekImprovement, setNewWeekImprovement] = useState('');
  const [weeklyReviewSavingStatus, setWeeklyReviewSavingStatus] = useState<'idle' | 'saving' | 'saved'>('idle');

  const years = Array.from({ length: 26 }, (_, i) => 2025 + i); // 2025 to 2050
  const months = [
    'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
    'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
  ];

  // Helper to load monthly review data
  const handleOpenMonthlyReview = () => {
    const existing = monthlyReviews.find(r => r.year === selectedYear && r.month === selectedMonthIndex);
    if (existing) {
      setMonthlyOneSentence(existing.oneSentence || '');
      setMonthlyMemorableMoments(existing.memorableMoments || []);
      setMonthlyLearnings(existing.learnings || []);
      setMonthlyImprovements(existing.improvements || []);
    } else {
      setMonthlyOneSentence('');
      setMonthlyMemorableMoments([]);
      setMonthlyLearnings([]);
      setMonthlyImprovements([]);
    }
    setNewMoment('');
    setNewLearning('');
    setNewImprovement('');
    setMonthlyReviewSavingStatus('idle');
    setIsMonthlyReviewModalOpen(true);
  };

  const handleSaveMonthlyReview = () => {
    setMonthlyReviewSavingStatus('saving');
    const newReview: MonthlyReview = {
      id: `mr-${selectedYear}-${selectedMonthIndex}`,
      year: selectedYear,
      month: selectedMonthIndex,
      oneSentence: monthlyOneSentence,
      memorableMoments: monthlyMemorableMoments,
      learnings: monthlyLearnings,
      improvements: monthlyImprovements
    };

    setMonthlyReviews(prev => {
      const idx = prev.findIndex(r => r.year === selectedYear && r.month === selectedMonthIndex);
      if (idx !== -1) {
        const copy = [...prev];
        copy[idx] = newReview;
        return copy;
      } else {
        return [...prev, newReview];
      }
    });

    const xpKey = `xp_awarded_mr_${selectedYear}_${selectedMonthIndex}`;
    if (localStorage.getItem(xpKey) !== 'true') {
      addXp(60);
      localStorage.setItem(xpKey, 'true');
    }

    setTimeout(() => {
      setMonthlyReviewSavingStatus('saved');
      setTimeout(() => setIsMonthlyReviewModalOpen(false), 800);
    }, 500);
  };

  // Helper to get week ranges for a specific month
  const getWeeksForMonth = (yr: number, monthIdx: number) => {
    const weeksList = [];
    const firstDay = new Date(yr, monthIdx, 1);
    const lastDay = new Date(yr, monthIdx + 1, 0);

    // Get ISO weeks that overlap with this month
    const startWeek = getWeekNumber(firstDay);
    const endWeek = getWeekNumber(lastDay);

    // Handle end-of-year weeks rollover gracefully
    let adjustedEndWeek = endWeek;
    if (endWeek < startWeek && monthIdx === 11) {
      adjustedEndWeek = 53;
    }

    for (let w = startWeek; w <= adjustedEndWeek; w++) {
      weeksList.push(w);
    }
    return weeksList;
  };

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
    
    return `${formatDate(startOfWeek)} a ${formatDate(endOfWeek)}`;
  };

  // Open Weekly Review Form
  const handleOpenWeeklyReview = (wkNum: number) => {
    setSelectedWeekNum(wkNum);
    const existing = weeklyReviews.find(r => r.year === selectedYear && r.weekNumber === wkNum);
    if (existing) {
      setWeeklyOneSentence(existing.oneSentence || '');
      setWeeklyMemorableMoments(existing.memorableMoments || []);
      setWeeklyLearnings(existing.learnings || []);
      setWeeklyImprovements(existing.improvements || []);
      setWeeklyReadings(existing.readings || '');
    } else {
      setWeeklyOneSentence('');
      setWeeklyMemorableMoments([]);
      setWeeklyLearnings([]);
      setWeeklyImprovements([]);
      setWeeklyReadings('');
    }
    setNewWeekMoment('');
    setNewWeekLearning('');
    setNewWeekImprovement('');
    setWeeklyReviewSavingStatus('idle');
    setIsWeeklyReviewModalOpen(true);
  };

  const handleSaveWeeklyReview = () => {
    if (selectedWeekNum === null) return;
    setWeeklyReviewSavingStatus('saving');
    const newReview: WeeklyReview = {
      id: `wr-${selectedYear}-${selectedWeekNum}`,
      year: selectedYear,
      weekNumber: selectedWeekNum,
      oneSentence: weeklyOneSentence,
      memorableMoments: weeklyMemorableMoments,
      learnings: weeklyLearnings,
      improvements: weeklyImprovements,
      readings: weeklyReadings
    };

    setWeeklyReviews(prev => {
      const idx = prev.findIndex(r => r.year === selectedYear && r.weekNumber === selectedWeekNum);
      if (idx !== -1) {
        const copy = [...prev];
        copy[idx] = newReview;
        return copy;
      } else {
        return [...prev, newReview];
      }
    });

    const xpKey = `xp_awarded_wr_${selectedYear}_${selectedWeekNum}`;
    if (localStorage.getItem(xpKey) !== 'true') {
      addXp(40);
      localStorage.setItem(xpKey, 'true');
    }

    setTimeout(() => {
      setWeeklyReviewSavingStatus('saved');
      setTimeout(() => setIsWeeklyReviewModalOpen(false), 800);
    }, 500);
  };

  // Get days list of selected month
  const getDaysInMonth = (yr: number, monthIdx: number) => {
    const daysCount = new Date(yr, monthIdx + 1, 0).getDate();
    const daysList = [];
    const weekdayNames = ['Domingo', 'Segunda-feira', 'Terça-feira', 'Quarta-feira', 'Quinta-feira', 'Sexta-feira', 'Sábado'];

    for (let d = daysCount; d >= 1; d--) {
      const dateObj = new Date(yr, monthIdx, d);
      const isoString = `${yr}-${String(monthIdx + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
      daysList.push({
        dayNum: d,
        dateStr: isoString,
        weekday: weekdayNames[dateObj.getDay()]
      });
    }
    return daysList;
  };

  // Build the dynamic checklist for the daily workspace view
  const buildDailyChecklist = (dateStr: string) => {
    const list = dailyTasks.filter((t: any) => t.isRecurring !== false || !t.createdDate || t.createdDate === dateStr);
    
    // Merge routine tasks
    if (routine) {
      try {
        const parts = dateStr.split('-');
        const dateObj = new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2]));
        const dayOfWeek = dateObj.getDay();
        
        const routineTasksForDay = routine
          .filter((item: any) => item.dayOfWeek === dayOfWeek || item.isEveryDay)
          .sort((a: any, b: any) => a.time.localeCompare(b.time))
          .map((item: any) => ({
            id: `routine-${item.id}`,
            text: `[Rotina às ${item.time}] ${item.task}`,
            completed: false,
            xpReward: 10,
            category: 'Rotina Semanal'
          }));
          
        list.push(...routineTasksForDay);
      } catch (err) {
        console.error("Error building checklist routine", err);
      }
    }

    // Add Leitura task if bookTracker is configured
    if (bookTracker && bookTracker.bookName) {
      const total = bookTracker.totalPages || 250;
      const read = bookTracker.pagesRead || 0;
      const remainingPages = Math.max(0, total - read);
      if (remainingPages > 0) {
        const deadline = bookTracker.deadlineDays || 7;
        const dailyTarget = Math.ceil(remainingPages / deadline);
        list.push({
          id: 'task-leitura',
          text: `Ler ${dailyTarget} pág. do livro: ${bookTracker.bookName}`,
          completed: false,
          xpReward: 25,
          category: 'Leitura',
          isRecurring: true
        });
      }
    }

    // Add Bíblia task if bibleTracker is configured
    if (bibleTracker && bibleTracker.capitulosPorDia) {
      list.push({
        id: 'task-biblia',
        text: `Ler ${bibleTracker.capitulosPorDia} cap. da Bíblia`,
        completed: false,
        xpReward: 25,
        category: 'Espiritualidade',
        isRecurring: true
      });
    }

    return list;
  };

  // Open Daily Workspace modal
  const handleOpenDailyWorkspace = (dateStr: string) => {
    setSelectedDateStr(dateStr);
    setActiveTopic('diario');
    
    const existing = notes.find(n => n.date === dateStr);
    if (existing && existing.isDailyRecord) {
      setJournalText(existing.journalText || '');
      setGratitudeText(existing.gratitudeText || templateGratitude);
      setDecreesText(existing.decreesText || templateDecrees);
      setPrayerText(existing.prayerText || templatePrayer);
      setSleepBedTime(existing.sleepBedTime || '');
      setSleepWakeTime(existing.sleepWakeTime || '');
      setFoodMorning(existing.foodMorning || '');
      setFoodAfternoon(existing.foodAfternoon || '');
      setFoodNight(existing.foodNight || '');
      setWaterLiters(existing.waterLiters ?? 0);
      setAlterEgoWinner(existing.alterEgoWinner || null);
      setAlterEgoText(existing.alterEgoText || '');

      const baseChecklist = buildDailyChecklist(dateStr);
      if (!existing.checklist) {
        setDayChecklist(baseChecklist);
      } else {
        const merged = baseChecklist.map(bt => {
          const matched = existing.checklist!.find(t => t.id === bt.id);
          return matched ? { ...bt, completed: matched.completed, subtasks: matched.subtasks } : bt;
        });
        const customOnly = existing.checklist.filter(t => !baseChecklist.some(bt => bt.id === t.id));
        setDayChecklist([...merged, ...customOnly]);
      }
    } else {
      setJournalText('');
      setGratitudeText(templateGratitude);
      setDecreesText(templateDecrees);
      setPrayerText(templatePrayer);
      setSleepBedTime('');
      setSleepWakeTime('');
      setFoodMorning('');
      setFoodAfternoon('');
      setFoodNight('');
      setWaterLiters(0);
      setAlterEgoWinner(null);
      setAlterEgoText('');
      setDayChecklist(buildDailyChecklist(dateStr));
    }
    setSavingStatus('idle');
  };

  const handleSaveDailyRecord = () => {
    if (!selectedDateStr) return;
    setSavingStatus('saving');

    const finalGratitude = gratitudeText.trim() ? gratitudeText : templateGratitude;
    const finalDecrees = decreesText.trim() ? decreesText : templateDecrees;
    const finalPrayer = prayerText.trim() ? prayerText : templatePrayer;

    setNotes(prev => {
      const idx = prev.findIndex(n => n.date === selectedDateStr);
      const updatedRecord: CalendarNote = {
        id: idx !== -1 ? prev[idx].id : 'rec-' + Math.random().toString(36).substring(2, 9),
        date: selectedDateStr,
        title: 'Registro de ' + selectedDateStr.split('-').reverse().join('/'),
        content: journalText ? (journalText.substring(0, 40) + '...') : 'Diário, Checklist & Fé',
        isDailyRecord: true,
        journalText,
        gratitudeText: finalGratitude,
        decreesText: finalDecrees,
        prayerText: finalPrayer,
        checklist: dayChecklist,
        alterEgoWinner,
        alterEgoText,
        sleepBedTime,
        sleepWakeTime,
        foodMorning,
        foodAfternoon,
        foodNight,
        waterLiters
      };

      if (idx !== -1) {
        const copy = [...prev];
        copy[idx] = updatedRecord;
        return copy;
      } else {
        return [...prev, updatedRecord];
      }
    });

    setTimeout(() => {
      setSavingStatus('saved');
      addXp(15);
      setTimeout(() => setSelectedDateStr(null), 700);
    }, 500);
  };

  // Real-time auto-save for Espaço Diário & Fé in AnuaisView when freeEditMode is active (debounced)
  useEffect(() => {
    if (!freeEditMode || !selectedDateStr) return;

    const timer = setTimeout(() => {
      const finalGratitude = gratitudeText.trim() ? gratitudeText : templateGratitude;
      const finalDecrees = decreesText.trim() ? decreesText : templateDecrees;
      const finalPrayer = prayerText.trim() ? prayerText : templatePrayer;

      setNotes(prev => {
        const idx = prev.findIndex(n => n.date === selectedDateStr);
        const updatedRecord: CalendarNote = {
          id: idx !== -1 ? prev[idx].id : 'rec-' + selectedDateStr,
          date: selectedDateStr,
          title: 'Registro de ' + selectedDateStr.split('-').reverse().join('/'),
          content: journalText ? (journalText.substring(0, 40) + '...') : 'Diário, Checklist & Fé',
          isDailyRecord: true,
          journalText,
          gratitudeText: finalGratitude,
          decreesText: finalDecrees,
          prayerText: finalPrayer,
          checklist: dayChecklist,
          alterEgoWinner,
          alterEgoText,
          sleepBedTime,
          sleepWakeTime,
          foodMorning,
          foodAfternoon,
          foodNight,
          waterLiters
        };

        if (idx !== -1) {
          if (JSON.stringify(prev[idx]) === JSON.stringify(updatedRecord)) return prev;
          const copy = [...prev];
          copy[idx] = updatedRecord;
          return copy;
        } else {
          return [...prev, updatedRecord];
        }
      });
    }, 350);

    return () => clearTimeout(timer);
  }, [
    freeEditMode,
    selectedDateStr,
    journalText,
    gratitudeText,
    decreesText,
    prayerText,
    dayChecklist,
    alterEgoWinner,
    alterEgoText,
    sleepBedTime,
    sleepWakeTime,
    foodMorning,
    foodAfternoon,
    foodNight,
    waterLiters
  ]);

  const saveChecklistToNotes = (updatedChecklist: DailyTask[]) => {
    if (!selectedDateStr) return;
    setNotes(prev => {
      const idx = prev.findIndex(n => n.date === selectedDateStr);
      const finalGratitude = gratitudeText.trim() ? gratitudeText : templateGratitude;
      const finalDecrees = decreesText.trim() ? decreesText : templateDecrees;
      const finalPrayer = prayerText.trim() ? prayerText : templatePrayer;
      const updatedRecord: CalendarNote = {
        id: idx !== -1 ? prev[idx].id : 'rec-' + Math.random().toString(36).substring(2, 9),
        date: selectedDateStr,
        title: 'Registro de ' + selectedDateStr.split('-').reverse().join('/'),
        content: journalText ? (journalText.substring(0, 40) + '...') : 'Diário, Checklist & Fé',
        isDailyRecord: true,
        journalText,
        gratitudeText: finalGratitude,
        decreesText: finalDecrees,
        prayerText: finalPrayer,
        checklist: updatedChecklist,
        alterEgoWinner,
        alterEgoText,
        sleepBedTime,
        sleepWakeTime,
        foodMorning,
        foodAfternoon,
        foodNight,
        waterLiters
      };

      if (idx !== -1) {
        const copy = [...prev];
        copy[idx] = updatedRecord;
        return copy;
      } else {
        return [...prev, updatedRecord];
      }
    });
  };

  const handleToggleChecklistItem = (id: string) => {
    setDayChecklist(prev => {
      const updated = prev.map(t => {
        if (t.id === id) {
          const updatedCompleted = !t.completed;
          addXp(updatedCompleted ? t.xpReward || 10 : -(t.xpReward || 10));
          return { ...t, completed: updatedCompleted };
        }
        return t;
      });
      saveChecklistToNotes(updated);
      return updated;
    });
  };

  const handleAddCustomDayTask = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newDayTaskText.trim()) return;
    const newTask: DailyTask = {
      id: 'task-custom-' + Date.now(),
      text: newDayTaskText.trim(),
      completed: false,
      xpReward: 15,
      category: 'Geral'
    };
    setDayChecklist(prev => {
      const updated = [...prev, newTask];
      saveChecklistToNotes(updated);
      return updated;
    });
    setNewDayTaskText('');
    addXp(5);
  };

  const handleDeleteCustomDayTask = (id: string) => {
    setDayChecklist(prev => {
      const updated = prev.filter(t => t.id !== id);
      saveChecklistToNotes(updated);
      return updated;
    });
  };

  // Yearly Book handlers
  const handleOpenAddBook = () => {
    setEditingBookId(null);
    setBookTitle('');
    setBookAuthor('');
    setBookTotalPages(200);
    setBookPagesRead(0);
    setBookStatus('quero_ler');
    setBookRating(0);
    setBookReview('');
    setBookReadingInterval('');
    setIsBookModalOpen(true);
  };

  const handleOpenEditBook = (bk: YearlyBook) => {
    setEditingBookId(bk.id);
    setBookTitle(bk.title);
    setBookAuthor(bk.author);
    setBookTotalPages(bk.totalPages);
    setBookPagesRead(bk.pagesRead);
    setBookStatus(bk.status);
    setBookRating(bk.rating || 0);
    setBookReview(bk.review || '');
    setBookReadingInterval(bk.readingInterval || '');
    setIsBookModalOpen(true);
  };

  const handleResumeBookInAnuais = (bk: YearlyBook) => {
    const todayStr = new Date().toISOString().split('T')[0];
    const startDate = bk.startDate || todayStr;
    const interval = calculateReadingInterval(startDate, undefined, 'lendo');

    setBooks(prev => prev.map(b => b.id === bk.id ? {
      ...b,
      status: 'lendo',
      endDate: undefined,
      readingInterval: interval
    } : b));

    if (setBookTracker) {
      setBookTracker({
        bookName: bk.title,
        totalPages: bk.totalPages,
        deadlineDays: 7,
        pagesRead: bk.pagesRead,
        startedDate: startDate,
        history: []
      });
    }
    addXp(15);
  };

  const handlePauseBookInAnuais = (bk: YearlyBook) => {
    const todayStr = new Date().toISOString().split('T')[0];
    const startDate = bk.startDate || todayStr;
    const interval = calculateReadingInterval(startDate, todayStr, 'dropado');

    setBooks(prev => prev.map(b => b.id === bk.id ? {
      ...b,
      status: 'dropado',
      endDate: todayStr,
      readingInterval: interval
    } : b));

    if (setBookTracker && bookTracker?.bookName?.toLowerCase() === bk.title.toLowerCase()) {
      setBookTracker({
        bookName: '',
        totalPages: 250,
        deadlineDays: 7,
        pagesRead: 0,
        startedDate: undefined,
        history: []
      });
    }
  };

  const handleSaveBook = (e: React.FormEvent) => {
    e.preventDefault();
    if (!bookTitle.trim()) return;

    const todayStr = new Date().toISOString().split('T')[0];

    if (editingBookId) {
      // Edit mode
      setBooks(prev => prev.map(b => {
        if (b.id !== editingBookId) return b;
        const startDate = b.startDate || (bookStatus !== 'quero_ler' ? todayStr : undefined);
        const endDate = (bookStatus === 'lido' || bookStatus === 'dropado') ? (b.endDate || todayStr) : undefined;
        const interval = bookReadingInterval.trim() || calculateReadingInterval(startDate, endDate, bookStatus);

        return {
          ...b,
          title: bookTitle,
          author: bookAuthor,
          totalPages: bookTotalPages,
          pagesRead: Math.min(bookPagesRead, bookTotalPages),
          status: bookStatus,
          rating: bookRating,
          review: bookReview,
          startDate: startDate,
          endDate: endDate,
          readingInterval: interval
        };
      }));
      addXp(20);
    } else {
      // Create mode
      const startDate = bookStatus !== 'quero_ler' ? todayStr : undefined;
      const endDate = (bookStatus === 'lido' || bookStatus === 'dropado') ? todayStr : undefined;
      const interval = bookReadingInterval.trim() || calculateReadingInterval(startDate, endDate, bookStatus);

      const newBook: YearlyBook = {
        id: 'bk-' + Math.random().toString(36).substring(2, 9),
        year: selectedYear,
        title: bookTitle,
        author: bookAuthor,
        totalPages: bookTotalPages,
        pagesRead: Math.min(bookPagesRead, bookTotalPages),
        status: bookStatus,
        rating: bookRating,
        review: bookReview,
        startDate: startDate,
        endDate: endDate,
        readingInterval: interval
      };
      setBooks(prev => [...prev, newBook]);
      addXp(40);
    }
    setIsBookModalOpen(false);
  };

  const handleDeleteBook = (id: string) => {
    if (window.confirm('Excluir este livro da estante?')) {
      setBooks(prev => prev.filter(b => b.id !== id));
      addXp(-10);
    }
  };

  const handleQuickPageIncrement = (bookId: string, inc: number) => {
    setBooks(prev => prev.map(b => {
      if (b.id !== bookId) return b;
      const nextRead = Math.min(b.totalPages, Math.max(0, b.pagesRead + inc));
      const nextStatus = nextRead === b.totalPages ? 'lido' : 'lendo';
      const todayStr = new Date().toISOString().split('T')[0];
      const endDate = nextStatus === 'lido' ? todayStr : b.endDate;
      const interval = calculateReadingInterval(b.startDate, endDate, nextStatus);

      if (nextStatus === 'lido' && b.status !== 'lido') {
        addXp(100); // Level completion massive reward
      }
      return {
        ...b,
        pagesRead: nextRead,
        status: nextStatus as any,
        endDate: endDate,
        readingInterval: interval
      };
    }));
    addXp(10);
  };

  // Filter books of selected year and tab filter
  const yearBooks = books.filter(b => b.year === selectedYear);
  const filteredBooks = yearBooks.filter(b => {
    if (bookFilterTab === 'todos') return true;
    return b.status === bookFilterTab;
  });

  return (
    <div id="anuais-view" className="space-y-6 pb-12">
      <AnimatePresence mode="wait">
        {!viewingDetail ? (
          <motion.div
            key="anuais-overview"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            transition={{ duration: 0.25 }}
            className="space-y-6"
          >
            {/* Title Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-zinc-900 pb-5">
              <div>
                <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight flex items-center gap-2">
                  <Layers className="h-5 sm:h-6 w-5 sm:w-6 text-orange-500 shrink-0" />
                  Central de <span className="text-orange-500 uppercase">Anuais</span>
                </h1>
                <p className="text-gray-500 text-xs mt-1">
                  Planejamento, diários e livros consolidados de longo prazo por ano.
                </p>
              </div>

              {/* Dynamic Add Year Panel */}
              <div className="flex items-center gap-3 shrink-0">
                <button
                  onClick={() => setIsAddingYear(true)}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-orange-500/10 hover:bg-orange-500/20 text-orange-400 border border-orange-500/20 text-xs font-bold rounded-xl transition-all"
                >
                  <Plus className="h-4 w-4" />
                  <span>Adicionar Ano</span>
                </button>
              </div>
            </div>

            {/* Years Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {overviewYears.map((year) => {
            const coverImage = yearlyImages[year] || 'https://images.unsplash.com/photo-1541701494587-cb58502866ab?q=80&w=1000';

            // Stats calculation for the card
            // 1. Metas (Concluídas)
            const goalsForYear = goals.filter(g => g.createdAt?.startsWith(String(year)));
            const completedGoalsCount = goalsForYear.filter(g => g.completed).length;

            // 2. Livros (Lidos)
            const booksReadCount = books.filter(b => b.year === year && b.status === 'lido').length;

            // 3. Disciplina (de acordo com os alter-egos)
            const notesForYear = notes.filter(n => n.date.startsWith(String(year)) && n.isDailyRecord);
            const alfredoWins = notesForYear.filter(n => n.alterEgoWinner === 'Alfredo').length;
            const betoWins = notesForYear.filter(n => n.alterEgoWinner === 'Beto').length;
            const totalWins = alfredoWins + betoWins;
            const disciplinePercent = totalWins > 0 ? Math.round((alfredoWins / totalWins) * 100) : 100;

            const isEditingThisCover = editingImageYear === year;

            return (
              <div
                key={year}
                onClick={() => {
                  setSelectedYear(year);
                  setViewingDetail(true);
                  addXp(10);
                }}
                className="relative aspect-[16/10] rounded-3xl overflow-hidden cursor-pointer border border-zinc-900/80 hover:border-orange-500/40 transition-all duration-300 shadow-xl group hover:shadow-[0_0_30px_rgba(249,115,22,0.08)] bg-zinc-950"
              >
                {/* Background Image */}
                <img
                  src={coverImage}
                  alt={`Ano ${year}`}
                  className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-105"
                  referrerPolicy="no-referrer"
                />

                {/* Dark Vignette Overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-zinc-950/25 to-transparent opacity-95 transition-opacity duration-300 group-hover:opacity-90" />
                <div className="absolute inset-0 bg-gradient-to-b from-zinc-950/80 via-zinc-950/20 to-transparent opacity-100" />

                {/* Normal State: Centered Year (No brackets) */}
                <div className="absolute inset-0 flex items-center justify-center transition-all duration-350 group-hover:opacity-0 group-hover:scale-95">
                  <span className="text-2xl font-mono font-black text-zinc-300 uppercase tracking-widest drop-shadow-lg">
                    {year}
                  </span>
                </div>

                {/* Hover/Touch State: Stats Overlay */}
                <div className="absolute inset-0 flex flex-col justify-between p-5 opacity-0 group-hover:opacity-100 transition-all duration-300 bg-black/40 backdrop-blur-[2px] z-10">
                  {/* Top bar with Year badge and Edit Cover button */}
                  <div className="flex justify-between items-center">
                    <div className="bg-orange-500/20 border border-orange-500/30 text-orange-400 text-[10px] px-3 py-1 rounded-xl font-bold font-mono tracking-wider">
                      {year}
                    </div>

                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setEditingImageYear(year);
                        setImageUrlInput(coverImage);
                      }}
                      className="p-1.5 bg-zinc-950/80 hover:bg-zinc-900 border border-zinc-850 text-zinc-400 hover:text-white rounded-lg transition-colors flex items-center gap-1 text-[9px] font-bold font-mono"
                      title="Alterar Capa"
                    >
                      <Sliders className="h-3 w-3" />
                      <span>CAPA</span>
                    </button>
                  </div>

                  {/* Centered Year button equivalent like WITCHER card */}
                  <div className="flex justify-center">
                    <div className="bg-white text-black font-black text-xs px-5 py-2 rounded-xl shadow-lg uppercase tracking-widest hover:scale-105 transition-transform">
                      Entrar em {year}
                    </div>
                  </div>

                  {/* Bottom Stats Grid (METAS, LIVROS, DISCIPLINA) matching the Witcher style */}
                  <div className="grid grid-cols-3 text-center border-t border-zinc-800/40 pt-2.5">
                    <div className="flex flex-col">
                      <span className="text-[8px] text-zinc-500 font-bold uppercase tracking-wider font-mono">Metas</span>
                      <span className="text-sm font-mono font-black text-white mt-0.5">{completedGoalsCount}</span>
                    </div>
                    <div className="flex flex-col border-x border-zinc-800/40">
                      <span className="text-[8px] text-zinc-500 font-bold uppercase tracking-wider font-mono">Livros</span>
                      <span className="text-sm font-mono font-black text-white mt-0.5">{booksReadCount}</span>
                    </div>
                    <div className="flex flex-col">
                      <span className="text-[8px] text-zinc-500 font-bold uppercase tracking-wider font-mono">Disciplina</span>
                      <span className="text-sm font-mono font-black text-orange-400 mt-0.5">{disciplinePercent}%</span>
                    </div>
                  </div>
                </div>

                {/* Inline Change Image Form */}
                {isEditingThisCover && (
                  <div
                    className="absolute inset-0 bg-black/95 backdrop-blur-md p-4 flex flex-col justify-center space-y-3.5 z-30"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <div className="space-y-1">
                      <span className="text-[9px] text-zinc-400 font-bold uppercase tracking-wider font-mono">URL da Capa de {year}</span>
                      <input
                        type="text"
                        value={imageUrlInput}
                        onChange={(e) => setImageUrlInput(e.target.value)}
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
                                    if (typeof reader.result === 'string') {
                                      setImageUrlInput(reader.result);
                                    }
                                  };
                                  reader.readAsDataURL(file);
                                }
                              }
                            }
                          }
                        }}
                        placeholder="Cole a URL ou Cole uma imagem da área de transferência..."
                        className="bg-zinc-900 border border-zinc-800 text-xs text-white rounded-xl px-3 py-2 w-full focus:outline-none focus:border-orange-500/50 font-sans"
                      />
                    </div>

                    <div className="space-y-1">
                      <span className="text-[9px] text-zinc-400 font-bold uppercase tracking-wider font-mono block">Ou Carregar do Computador</span>
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
                            const reader = new FileReader();
                            reader.onloadend = () => {
                              if (typeof reader.result === 'string') {
                                setImageUrlInput(reader.result);
                              }
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
                                    if (typeof reader.result === 'string') {
                                      setImageUrlInput(reader.result);
                                    }
                                  };
                                  reader.readAsDataURL(file);
                                }
                              }
                            }
                          }
                        }}
                        onClick={() => document.getElementById(`anuais-file-upload-${year}`)?.click()}
                        tabIndex={0}
                        className="group flex flex-col items-center justify-center gap-1 px-4 py-3 bg-zinc-950/40 hover:bg-zinc-950/80 border border-dashed border-zinc-800 hover:border-orange-500/30 rounded-xl cursor-pointer transition-all duration-200 outline-none select-none text-center"
                      >
                        <Upload className="h-4 w-4 text-zinc-500 group-hover:text-orange-400 group-hover:scale-110 transition-transform duration-300" />
                        <span className="text-[10px] text-zinc-300 font-bold uppercase tracking-wider">Escolher Imagem / Arrastar ou Colar (Ctrl + V)</span>
                        <input
                          id={`anuais-file-upload-${year}`}
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) {
                              const reader = new FileReader();
                              reader.onloadend = () => {
                                if (typeof reader.result === 'string') {
                                  setImageUrlInput(reader.result);
                                }
                              };
                              reader.readAsDataURL(file);
                            }
                          }}
                        />
                      </div>
                    </div>

                    <div className="flex gap-2 pt-1">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setYearlyImages(prev => ({ ...prev, [year]: imageUrlInput.trim() }));
                          setEditingImageYear(null);
                          addXp(15);
                        }}
                        className="flex-1 bg-orange-500 hover:bg-orange-600 text-white text-[10px] font-bold py-2 rounded-lg transition-colors font-sans"
                      >
                        Salvar
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setEditingImageYear(null);
                        }}
                        className="flex-1 bg-zinc-850 hover:bg-zinc-800 text-zinc-400 text-[10px] font-bold py-2 rounded-lg transition-colors font-sans"
                      >
                        Cancelar
                      </button>
                    </div>
                  </div>
                )}
              </div>
            );
          })}

          {/* Interactive + Year Card */}
          <div
            onClick={() => setIsAddingYear(true)}
            className="relative aspect-[16/10] rounded-3xl overflow-hidden cursor-pointer border border-dashed border-zinc-800 hover:border-orange-500/50 hover:bg-orange-500/[0.02] transition-all duration-300 flex flex-col items-center justify-center gap-3 bg-zinc-950/30 group"
          >
            <div className="p-3 bg-zinc-900 group-hover:bg-orange-500/10 rounded-2xl border border-zinc-800 group-hover:border-orange-500/20 transition-all">
              <Plus className="h-6 w-6 text-zinc-500 group-hover:text-orange-500 transition-colors" />
            </div>
            <div className="text-center">
              <span className="text-xs font-bold text-zinc-400 group-hover:text-white transition-colors block">Adicionar Novo Ano</span>
              <span className="text-[10px] text-zinc-650 block mt-0.5 font-mono">Consolide um novo ciclo</span>
            </div>
          </div>

        </div>
        </motion.div>
      ) : (
        <motion.div
          key={`anuais-detail-${selectedYear}`}
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -15 }}
          transition={{ duration: 0.25 }}
          className="space-y-6"
        >
      {/* Title Header with Back button and Month Selector in place of Year selector */}
      <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-4 border-b border-zinc-900 pb-5">
        <div className="flex items-center gap-3">
          <button
            onClick={() => setViewingDetail(false)}
            className="p-2 bg-zinc-900 hover:bg-zinc-850 text-gray-400 hover:text-white rounded-xl border border-zinc-850 transition-colors"
            title="Voltar para Central"
          >
            <X className="h-4 w-4" />
          </button>
          <div>
            <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight flex items-center gap-2">
              <Layers className="h-5 sm:h-6 w-5 sm:w-6 text-orange-500 shrink-0" />
              <span>Ano {selectedYear}</span>
            </h1>
            <p className="text-gray-500 text-xs mt-0.5">
              Selecione os meses no menu ao lado para navegar.
            </p>
          </div>
        </div>

        {/* The Year selector becomes the Month selector as requested */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1.5 xl:pb-0 scrollbar-none bg-zinc-950 p-1 border border-zinc-900 rounded-2xl max-w-full">
          {months.map((m, idx) => (
            <button
              key={m}
              onClick={() => {
                setSelectedMonthIndex(idx);
                addXp(2);
              }}
              className={`px-3 py-1.5 text-[10.5px] font-bold transition-all flex items-center gap-1 rounded-xl border whitespace-nowrap ${
                selectedMonthIndex === idx
                  ? 'bg-orange-500/10 border-orange-500/40 text-orange-500 font-black'
                  : 'bg-transparent border-transparent text-gray-500 hover:text-gray-300'
              }`}
            >
              <span>{m}</span>
            </button>
          ))}
          <button
            onClick={() => {
              setSelectedMonthIndex(-1);
              addXp(2);
            }}
            className={`px-3 py-1.5 text-[10.5px] font-bold transition-all flex items-center gap-1.5 rounded-xl border whitespace-nowrap ${
              selectedMonthIndex === -1
                ? 'bg-orange-500/10 border-orange-500/40 text-orange-500 font-black'
                : 'bg-transparent border-transparent text-gray-500 hover:text-gray-300'
            }`}
          >
            <BookMarked className="h-3 w-3 shrink-0" />
            <span>Livros ({filteredBooks.length})</span>
          </button>
        </div>
      </div>

      {/* Notion style workspace structure: Simplified to full-width as the sidebar has been removed */}
      <div className="w-full">
        {/* Right workspace view (Split pane as in Image 3) */}
        <div className="w-full space-y-6">
          <AnimatePresence mode="wait">
            {selectedMonthIndex === -1 ? (
              /* --- YEARLY BOOKS SPACE --- */
              <motion.div
                key="yearly-books"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2 }}
                className="bg-[#0c0c0e]/40 border border-zinc-900 rounded-3xl p-6 space-y-6"
              >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-zinc-900 pb-5">
                <div>
                  <h3 className="text-lg font-black text-white tracking-tight flex items-center gap-2">
                    <Book className="h-5 w-5 text-orange-500" />
                    Estante de Livros de {selectedYear}
                  </h3>
                  <p className="text-gray-500 text-xs mt-0.5">
                    Seu espaço dedicado de leitura. Complete metas e registre resumos para evoluir!
                  </p>
                </div>

                <button
                  onClick={handleOpenAddBook}
                  className="bg-orange-500 hover:bg-orange-600 text-white text-xs font-bold px-4 py-2.5 rounded-xl flex items-center gap-1.5 transition-colors shadow-lg shadow-orange-500/5 self-start sm:self-auto"
                >
                  <Plus className="h-4 w-4" />
                  Adicionar Livro
                </button>
              </div>

              {/* Book shelf Stats */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="bg-zinc-950 p-3.5 border border-zinc-900 rounded-2xl flex flex-col justify-between">
                  <span className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider block">Lidos no Ano</span>
                  <div className="text-2xl font-mono font-black text-emerald-400 mt-1">
                    {yearBooks.filter(b => b.status === 'lido').length}
                  </div>
                  <span className="text-[8px] text-zinc-600 block mt-0.5">Livros concluídos</span>
                </div>

                <div className="bg-zinc-950 p-3.5 border border-zinc-900 rounded-2xl flex flex-col justify-between">
                  <span className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider block">Leitura Ativa</span>
                  <div className="text-2xl font-mono font-black text-amber-400 mt-1">
                    {yearBooks.filter(b => b.status === 'lendo').length}
                  </div>
                  <span className="text-[8px] text-zinc-600 block mt-0.5">Sendo lidos agora</span>
                </div>

                <div className="bg-zinc-950 p-3.5 border border-zinc-900 rounded-2xl flex flex-col justify-between">
                  <span className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider block">Dropados / Pausados</span>
                  <div className="text-2xl font-mono font-black text-rose-400 mt-1">
                    {yearBooks.filter(b => b.status === 'dropado').length}
                  </div>
                  <span className="text-[8px] text-zinc-600 block mt-0.5">Pausados para continuar depois</span>
                </div>

                <div className="bg-zinc-950 p-3.5 border border-zinc-900 rounded-2xl flex flex-col justify-between">
                  <span className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider block">Total no Acervo</span>
                  <div className="text-2xl font-mono font-black text-zinc-400 mt-1">
                    {yearBooks.length}
                  </div>
                  <span className="text-[8px] text-zinc-600 block mt-0.5">Acervo do ano</span>
                </div>
              </div>

              {/* Status Filter Tabs */}
              <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar text-xs">
                {[
                  { id: 'todos', label: 'Todos' },
                  { id: 'lendo', label: '📖 Lendo' },
                  { id: 'lido', label: '✅ Lidos' },
                  { id: 'dropado', label: '⏸️ Dropados / Pausados' },
                  { id: 'quero_ler', label: '📌 Quero Ler' }
                ].map(tab => (
                  <button
                    key={tab.id}
                    onClick={() => setBookFilterTab(tab.id as any)}
                    className={`px-3 py-1.5 rounded-xl text-[11px] font-bold transition-all whitespace-nowrap ${
                      bookFilterTab === tab.id
                        ? 'bg-orange-500 text-white shadow-sm'
                        : 'bg-zinc-900/60 text-zinc-400 hover:text-white hover:bg-zinc-800'
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>

              {/* Books List Grid */}
              {filteredBooks.length === 0 ? (
                <div className="text-center py-16 border border-dashed border-zinc-900 rounded-2xl">
                  <BookOpen className="h-8 w-8 text-zinc-700 mx-auto mb-2" />
                  <p className="text-xs text-zinc-500">Nenhum livro encontrado com o filtro selecionado.</p>
                  <button
                    onClick={handleOpenAddBook}
                    className="mt-3 text-orange-500 hover:text-orange-400 text-xs font-bold underline"
                  >
                    Adicionar um livro agora
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {filteredBooks.map((bk) => {
                    const percent = bk.totalPages > 0 ? Math.round((bk.pagesRead / bk.totalPages) * 100) : 0;
                    const displayInterval = bk.readingInterval || calculateReadingInterval(bk.startDate, bk.endDate, bk.status);

                    return (
                      <div
                        key={bk.id}
                        className="p-4 bg-zinc-950 border border-zinc-900/60 rounded-2xl space-y-4 hover:border-zinc-800 transition-all group flex flex-col justify-between"
                      >
                        <div className="space-y-2">
                          <div className="flex items-start justify-between gap-2">
                            <div>
                              <span className={`inline-block text-[8px] font-bold uppercase px-2 py-0.5 rounded border ${
                                bk.status === 'lido'
                                  ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400'
                                  : bk.status === 'lendo'
                                  ? 'bg-amber-500/10 border-amber-500/20 text-amber-400'
                                  : bk.status === 'dropado'
                                  ? 'bg-rose-500/10 border-rose-500/20 text-rose-400'
                                  : 'bg-zinc-900/50 border-zinc-850 text-zinc-500'
                              }`}>
                                {bk.status === 'lido' 
                                  ? 'Lido' 
                                  : bk.status === 'lendo' 
                                  ? 'Lendo' 
                                  : bk.status === 'dropado' 
                                  ? 'Pausado / Dropado' 
                                  : 'Quero Ler'}
                              </span>
                              <h4 className="text-xs font-black text-white mt-2 group-hover:text-orange-500 transition-colors leading-snug">
                                {bk.title}
                              </h4>
                              <p className="text-[10px] text-zinc-500">por {bk.author || 'Autor desconhecido'}</p>

                              {displayInterval && (
                                <p className="text-[9.5px] text-zinc-400 font-mono mt-1 flex items-center gap-1">
                                  <Calendar className="h-3 w-3 text-zinc-500 shrink-0" />
                                  <span>{displayInterval}</span>
                                </p>
                              )}
                            </div>

                            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-all">
                              <button
                                onClick={() => handleOpenEditBook(bk)}
                                className="p-1 hover:bg-zinc-900 text-zinc-500 hover:text-white rounded transition-colors"
                                title="Editar"
                              >
                                <Edit className="h-3 w-3" />
                              </button>
                              <button
                                onClick={() => handleDeleteBook(bk.id)}
                                className="p-1 hover:bg-zinc-900 text-zinc-500 hover:text-rose-500 rounded transition-colors"
                                title="Excluir"
                              >
                                <Trash2 className="h-3 w-3" />
                              </button>
                            </div>
                          </div>

                          {/* Pages progress bar */}
                          <div className="space-y-1 pt-1">
                            <div className="flex justify-between text-[9px] text-zinc-400 font-mono">
                              <span>Progresso: {percent}%</span>
                              <span>{bk.pagesRead} / {bk.totalPages} pág.</span>
                            </div>
                            <div className="h-1.5 w-full bg-zinc-900 rounded-full overflow-hidden">
                              <div
                                className={`h-full rounded-full transition-all duration-300 ${
                                  bk.status === 'lido' 
                                    ? 'bg-emerald-500' 
                                    : bk.status === 'dropado'
                                    ? 'bg-rose-500'
                                    : 'bg-orange-500'
                                }`}
                                style={{ width: `${percent}%` }}
                              />
                            </div>
                          </div>

                          {/* Stars Rating */}
                          {bk.status === 'lido' && bk.rating && bk.rating > 0 && (
                            <div className="flex items-center gap-0.5 pt-1">
                              {Array.from({ length: 5 }).map((_, i) => (
                                <Star
                                  key={i}
                                  className={`h-3 w-3 ${
                                    i < (bk.rating || 0) ? 'text-amber-400 fill-amber-400' : 'text-zinc-750'
                                  }`}
                                />
                              ))}
                            </div>
                          )}

                          {/* Notes summary */}
                          {bk.review && (
                            <p className="text-[9.5px] text-zinc-400 font-sans italic leading-relaxed bg-zinc-900/40 p-2.5 rounded-xl border border-zinc-900/60 mt-2">
                              "{bk.review}"
                            </p>
                          )}
                        </div>

                        {/* Quick actions bar */}
                        <div className="flex gap-1.5 pt-3 border-t border-zinc-900 mt-auto">
                          {(bk.status === 'dropado' || bk.status === 'quero_ler') && (
                            <button
                              onClick={() => handleResumeBookInAnuais(bk)}
                              className="w-full py-1.5 px-3 bg-orange-500/10 hover:bg-orange-500/20 text-orange-400 border border-orange-500/20 rounded-xl text-[10px] font-bold transition-all flex items-center justify-center gap-1.5"
                            >
                              <Play className="h-3 w-3 fill-orange-400" />
                              Continuar Lendo (Retomar)
                            </button>
                          )}

                          {bk.status === 'lendo' && (
                            <>
                              <button
                                onClick={() => handleQuickPageIncrement(bk.id, 10)}
                                className="py-1 px-2 bg-zinc-900 hover:bg-zinc-800 text-zinc-300 rounded-lg text-[9px] font-mono font-bold transition-all"
                              >
                                +10 pág.
                              </button>
                              <button
                                onClick={() => handleQuickPageIncrement(bk.id, 30)}
                                className="py-1 px-2 bg-zinc-900 hover:bg-zinc-800 text-zinc-300 rounded-lg text-[9px] font-mono font-bold transition-all"
                              >
                                +30 pág.
                              </button>
                              <button
                                onClick={() => handlePauseBookInAnuais(bk)}
                                className="py-1 px-2 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 rounded-lg text-[9px] font-bold transition-all"
                                title="Pausar / Dropar esta leitura"
                              >
                                Pausar
                              </button>
                              <button
                                onClick={() => {
                                  const todayStr = new Date().toISOString().split('T')[0];
                                  const interval = calculateReadingInterval(bk.startDate, todayStr, 'lido');
                                  setBooks(prev => prev.map(b => b.id === bk.id ? { 
                                    ...b, 
                                    pagesRead: b.totalPages, 
                                    status: 'lido',
                                    endDate: todayStr,
                                    readingInterval: interval
                                  } : b));
                                  addXp(100);
                                }}
                                className="py-1 px-2 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 rounded-lg text-[9px] font-bold transition-all"
                              >
                                Concluir
                              </button>
                            </>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
              </motion.div>
            ) : (
              /* --- MONTH WORKSPACE SPACE (Image 3) --- */
              <motion.div
                key={`month-workspace-${selectedMonthIndex}`}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2 }}
                className="space-y-6"
              >
                {/* Unified Monthly Review Block */}
                {(() => {
                  const r = monthlyReviews.find(mr => mr.year === selectedYear && mr.month === selectedMonthIndex);
                  const weeksInMonth = getWeeksForMonth(selectedYear, selectedMonthIndex);
                  const monthWeeklyReviews = weeklyReviews.filter(
                    wr => wr.year === selectedYear && weeksInMonth.includes(wr.weekNumber)
                  );
                return (
                  <div className="p-6 bg-zinc-950/60 border border-zinc-900 rounded-3xl space-y-5">
                    {/* Collapsible Dropdown Header & Visual Trigger */}
                    <div 
                      onClick={() => setIsMonthlyReviewOpen(!isMonthlyReviewOpen)}
                      className="cursor-pointer select-none group space-y-4"
                    >
                      <div className="flex justify-between items-start">
                        <div>
                          <span className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider block">
                            MÓDULO DE AVALIAÇÃO • {months[selectedMonthIndex]} / {selectedYear}
                          </span>
                          <h2 className="text-sm font-black text-white tracking-tight mt-0.5 flex items-center gap-1.5">
                            Review Mensal
                            {r ? (
                              <span className="px-2 py-0.5 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-md text-[9px] font-black uppercase tracking-wider flex items-center gap-1">
                                <Check className="h-3 w-3" /> Preenchido
                              </span>
                            ) : (
                              <span className="px-2 py-0.5 bg-orange-500/10 border border-orange-500/20 text-orange-400 rounded-md text-[9px] font-black uppercase tracking-wider flex items-center gap-1 animate-pulse">
                                <Sparkles className="h-3 w-3" /> Pendente
                              </span>
                            )}
                          </h2>
                        </div>
                        <div className="flex items-center gap-3 shrink-0">
                          <span className="text-[9px] text-zinc-600 font-mono hidden sm:inline-block">
                            Auto-salvamento ativo
                          </span>
                          <div className="p-1.5 bg-zinc-900/60 border border-zinc-850 rounded-xl group-hover:bg-zinc-800 transition-colors">
                            <ChevronDown className={`h-4 w-4 text-zinc-400 group-hover:text-white transition-transform duration-300 ${isMonthlyReviewOpen ? 'transform rotate-180' : 'transform rotate-0'}`} />
                          </div>
                        </div>
                      </div>

                      {/* Small Banner (Módulos de Vida em Resumo) */}
                      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 pt-3.5 border-t border-zinc-900">
                        {/* Card 1: Leituras */}
                        <div className="p-3 bg-zinc-950/40 border border-zinc-900/80 rounded-2xl flex items-center gap-2.5 hover:border-orange-500/20 transition-all duration-300">
                          <div className="p-2 bg-orange-500/10 rounded-xl text-orange-400 shrink-0">
                            <BookOpen className="h-4 w-4" />
                          </div>
                          <div className="min-w-0">
                            <span className="text-[9px] text-zinc-500 font-bold uppercase tracking-wider block">Estudos & Leituras</span>
                            <span className="text-xs text-zinc-200 font-mono block truncate font-bold">
                              {books.filter(b => isBookInMonthAndYear(b, selectedYear, selectedMonthIndex) && b.status === 'lendo').length} lendo | {books.filter(b => isBookInMonthAndYear(b, selectedYear, selectedMonthIndex) && b.status === 'lido').length} lidos
                            </span>
                          </div>
                        </div>

                        {/* Card 2: Produtividade */}
                        <div className="p-3 bg-zinc-950/40 border border-zinc-900/80 rounded-2xl flex items-center gap-2.5 hover:border-orange-500/20 transition-all duration-300">
                          <div className="p-2 bg-amber-500/10 rounded-xl text-amber-400 shrink-0">
                            <CheckSquare className="h-4 w-4" />
                          </div>
                          <div className="min-w-0">
                            <span className="text-[9px] text-zinc-500 font-bold uppercase tracking-wider block">Média de Conclusão</span>
                            <span className="text-xs text-zinc-200 font-mono block truncate font-bold">
                              {(() => {
                                const stats = getCompletedTasksAverage();
                                return `${stats.avg} tarefas/dia (${stats.percent}% concluído)`;
                              })()}
                            </span>
                          </div>
                        </div>

                        {/* Card 3: Diários & Reflexões */}
                        <div className="p-3 bg-zinc-950/40 border border-zinc-900/80 rounded-2xl flex items-center gap-2.5 hover:border-orange-500/20 transition-all duration-300">
                          <div className="p-2 bg-emerald-500/10 rounded-xl text-emerald-400 shrink-0">
                            <FileText className="h-4 w-4" />
                          </div>
                          <div className="min-w-0">
                            <span className="text-[9px] text-zinc-500 font-bold uppercase tracking-wider block">Diário & Reflexão</span>
                            <span className="text-xs text-zinc-200 font-mono block truncate font-bold">
                              {notes.filter(n => {
                                const d = new Date(n.date);
                                return d.getFullYear() === selectedYear && d.getMonth() === selectedMonthIndex;
                              }).length} registros no mês
                            </span>
                          </div>
                        </div>

                        {/* Card 4: Saldo Financeiro */}
                        <div className="p-3 bg-zinc-950/40 border border-zinc-900/80 rounded-2xl flex items-center gap-2.5 hover:border-orange-500/20 transition-all duration-300">
                          <div className="p-2 bg-emerald-500/10 rounded-xl text-emerald-400 shrink-0">
                            <TrendingUp className="h-4 w-4" />
                          </div>
                          <div className="min-w-0">
                            <span className="text-[9px] text-zinc-500 font-bold uppercase tracking-wider block">Saldo do Mês</span>
                            <span className={`text-xs font-mono block truncate font-bold ${
                              getMonthlyFinancialBalance() >= 0 ? 'text-emerald-400' : 'text-rose-400'
                            }`}>
                              {formatBRL(getMonthlyFinancialBalance())}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Expandable Body */}
                    <AnimatePresence initial={false}>
                      {isMonthlyReviewOpen && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: 'auto' }}
                          exit={{ opacity: 0, height: 0 }}
                          transition={{ duration: 0.25 }}
                          className="overflow-hidden pt-5 border-t border-zinc-900 space-y-5"
                        >
                          {r && !isEditingMonthlyReview ? (
                            /* --- VISUALIZATION VIEW --- */
                            <div className="space-y-6">
                              {/* Frase do Mês Card */}
                              <div className="p-5 bg-gradient-to-r from-zinc-950/80 to-zinc-900/40 border border-zinc-900 rounded-2xl relative overflow-hidden flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                                <div className="space-y-1">
                                  <span className="text-[9px] text-orange-500 font-black uppercase tracking-wider">O Mês em uma Frase</span>
                                  <p className="text-sm font-serif italic text-zinc-100 leading-relaxed max-w-xl">
                                    "{r.oneSentence || 'Nenhuma frase cadastrada.'}"
                                  </p>
                                </div>
                                <button
                                  onClick={() => setIsEditingMonthlyReview(true)}
                                  className="flex items-center gap-1.5 px-4 py-2 bg-zinc-900 hover:bg-zinc-850 text-zinc-200 text-xs font-bold rounded-xl border border-zinc-800 transition-colors shrink-0"
                                >
                                  <Edit className="h-3.5 w-3.5 text-orange-500" />
                                  <span>Editar Review</span>
                                </button>
                              </div>

                              {/* Highlights Grids */}
                              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                {/* Momentos Marcantes */}
                                <div className="p-4 bg-zinc-950/40 border border-zinc-900/60 rounded-2xl space-y-3 flex flex-col">
                                  <div className="flex items-center gap-2 text-orange-400 pb-2.5 border-b border-zinc-900/80">
                                    <Award className="h-4 w-4" />
                                    <h4 className="text-[10px] font-black uppercase tracking-wider">Momentos Marcantes</h4>
                                  </div>
                                  <div className="space-y-2 max-h-[180px] overflow-y-auto pr-1">
                                    {r.memorableMoments && r.memorableMoments.length > 0 ? (
                                      r.memorableMoments.map((item, idx) => (
                                        <div key={idx} className="p-2.5 bg-zinc-900/20 border border-zinc-900/50 rounded-xl text-xs text-zinc-300 flex items-start gap-2 leading-relaxed">
                                          <span className="text-orange-500 font-bold shrink-0">•</span>
                                          <span className="break-words">{item}</span>
                                        </div>
                                      ))
                                    ) : (
                                      <p className="text-[11px] text-zinc-600 italic">Nenhum momento registrado.</p>
                                    )}
                                  </div>
                                </div>

                                {/* Aprendizados */}
                                <div className="p-4 bg-zinc-950/40 border border-zinc-900/60 rounded-2xl space-y-3 flex flex-col">
                                  <div className="flex items-center gap-2 text-emerald-400 pb-2.5 border-b border-zinc-900/80">
                                    <Sparkles className="h-4 w-4" />
                                    <h4 className="text-[10px] font-black uppercase tracking-wider">Aprendizados & Insights</h4>
                                  </div>
                                  <div className="space-y-2 max-h-[180px] overflow-y-auto pr-1">
                                    {r.learnings && r.learnings.length > 0 ? (
                                      r.learnings.map((item, idx) => (
                                        <div key={idx} className="p-2.5 bg-zinc-900/20 border border-zinc-900/50 rounded-xl text-xs text-zinc-300 flex items-start gap-2 leading-relaxed">
                                          <span className="text-emerald-500 font-bold shrink-0">•</span>
                                          <span className="break-words">{item}</span>
                                        </div>
                                      ))
                                    ) : (
                                      <p className="text-[11px] text-zinc-600 italic">Nenhum aprendizado registrado.</p>
                                    )}
                                  </div>
                                </div>

                                {/* Ajustes */}
                                <div className="p-4 bg-zinc-950/40 border border-zinc-900/60 rounded-2xl space-y-3 flex flex-col">
                                  <div className="flex items-center gap-2 text-amber-400 pb-2.5 border-b border-zinc-900/80">
                                    <Sliders className="h-4 w-4" />
                                    <h4 className="text-[10px] font-black uppercase tracking-wider">Ajustes & Melhorias</h4>
                                  </div>
                                  <div className="space-y-2 max-h-[180px] overflow-y-auto pr-1">
                                    {r.improvements && r.improvements.length > 0 ? (
                                      r.improvements.map((item, idx) => (
                                        <div key={idx} className="p-2.5 bg-zinc-900/20 border border-zinc-900/50 rounded-xl text-xs text-zinc-300 flex items-start gap-2 leading-relaxed">
                                          <span className="text-amber-500 font-bold shrink-0">•</span>
                                          <span className="break-words">{item}</span>
                                        </div>
                                      ))
                                    ) : (
                                      <p className="text-[11px] text-zinc-600 italic">Nenhum ajuste registrado.</p>
                                    )}
                                  </div>
                                </div>
                              </div>

                              {/* Leituras da Semana deste Mês */}
                              <div className="p-4 bg-zinc-950/40 border border-zinc-900/60 rounded-2xl space-y-3">
                                <div className="flex items-center gap-2 text-orange-400 pb-2 border-b border-zinc-900/80">
                                  <BookOpen className="h-4 w-4" />
                                  <h4 className="text-[10px] font-black uppercase tracking-wider">Leituras Semanais do Mês</h4>
                                </div>
                                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                                  {getWeeksForMonth(selectedYear, selectedMonthIndex).map((wkNum) => {
                                    const wr = monthWeeklyReviews.find(w => w.weekNumber === wkNum);
                                    return (
                                      <div key={wkNum} className="p-3 bg-zinc-900/10 border border-zinc-900/40 rounded-xl space-y-1.5 flex flex-col justify-between">
                                        <div>
                                          <span className="text-[9px] text-zinc-500 font-bold uppercase tracking-wider block">Semana {wkNum}</span>
                                          {wr && wr.readings ? (
                                            <p className="text-xs text-zinc-300 whitespace-pre-wrap leading-relaxed mt-1 italic font-sans">
                                              "{wr.readings}"
                                            </p>
                                          ) : (
                                            <p className="text-[10px] text-zinc-600 italic mt-1">Nenhuma registrada</p>
                                          )}
                                        </div>
                                      </div>
                                    );
                                  })}
                                </div>
                              </div>
                            </div>
                          ) : (
                            /* --- EDITING VIEW --- */
                            <div className="space-y-5">
                              {/* Frase do mês */}
                              <div className="space-y-1.5">
                                <div className="flex justify-between items-center">
                                  <label className="text-[10px] text-zinc-400 font-bold uppercase tracking-wider block">O mês em uma frase:</label>
                                  {r && (
                                    <button
                                      type="button"
                                      onClick={() => setIsEditingMonthlyReview(false)}
                                      className="text-[10px] text-zinc-500 hover:text-orange-400 font-bold transition-colors"
                                    >
                                      Visualizar Registro
                                    </button>
                                  )}
                                </div>
                                <input
                                  type="text"
                                  value={monthlyOneSentence}
                                  onChange={(e) => {
                                    setMonthlyOneSentence(e.target.value);
                                  }}
                                  placeholder="Ex: Um ciclo de intensa superação de metas e progresso em hábitos."
                                  className="w-full bg-zinc-950 border border-zinc-900 rounded-xl p-3 text-xs text-white focus:outline-none focus:border-orange-500/50 font-medium"
                                />
                              </div>

                              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                {/* Momentos marcantes */}
                                <div className="space-y-3">
                                  <label className="text-[10px] text-zinc-400 font-bold uppercase tracking-wider block">Momentos Marcantes:</label>
                                  <div className="flex gap-2">
                                    <input
                                      type="text"
                                      value={newMoment}
                                      onChange={(e) => setNewMoment(e.target.value)}
                                      placeholder="Adicionar momento..."
                                      className="flex-1 bg-zinc-950 border border-zinc-900 rounded-xl px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-orange-500/50"
                                      onKeyDown={(e) => {
                                        if (e.key === 'Enter') {
                                          e.preventDefault();
                                          if (!newMoment.trim()) return;
                                          setMonthlyMemorableMoments(p => [...p, newMoment.trim()]);
                                          setNewMoment('');
                                        }
                                      }}
                                    />
                                    <button
                                      type="button"
                                      onClick={() => {
                                        if (!newMoment.trim()) return;
                                        setMonthlyMemorableMoments(p => [...p, newMoment.trim()]);
                                        setNewMoment('');
                                      }}
                                      className="bg-zinc-900 text-orange-500 border border-zinc-850 rounded-xl px-2.5 text-[10px] font-bold hover:bg-zinc-850"
                                    >
                                      +
                                    </button>
                                  </div>
                                  <div className="space-y-1.5 max-h-[150px] overflow-y-auto pr-1">
                                    {monthlyMemorableMoments.length === 0 && (
                                      <p className="text-[10px] text-zinc-650 italic">Nenhum momento adicionado.</p>
                                    )}
                                    {monthlyMemorableMoments.map((item, index) => (
                                      <div key={index} className="flex items-center justify-between p-2 bg-zinc-950/40 border border-zinc-900 rounded-lg text-xs">
                                        <span className="text-zinc-300 break-words flex-1 pr-2">• {item}</span>
                                        <button
                                          onClick={() => setMonthlyMemorableMoments(p => p.filter((_, i) => i !== index))}
                                          className="text-zinc-500 hover:text-rose-500 shrink-0"
                                        >
                                          <Trash2 className="h-3.5 w-3.5" />
                                        </button>
                                      </div>
                                    ))}
                                  </div>
                                </div>

                                {/* Aprendizados */}
                                <div className="space-y-3">
                                  <label className="text-[10px] text-zinc-400 font-bold uppercase tracking-wider block">Aprendizados & Insights:</label>
                                  <div className="flex gap-2">
                                    <input
                                      type="text"
                                      value={newLearning}
                                      onChange={(e) => setNewLearning(e.target.value)}
                                      placeholder="Adicionar aprendizado..."
                                      className="flex-1 bg-zinc-950 border border-zinc-900 rounded-xl px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-orange-500/50"
                                      onKeyDown={(e) => {
                                        if (e.key === 'Enter') {
                                          e.preventDefault();
                                          if (!newLearning.trim()) return;
                                          setMonthlyLearnings(p => [...p, newLearning.trim()]);
                                          setNewLearning('');
                                        }
                                      }}
                                    />
                                    <button
                                      type="button"
                                      onClick={() => {
                                        if (!newLearning.trim()) return;
                                        setMonthlyLearnings(p => [...p, newLearning.trim()]);
                                        setNewLearning('');
                                      }}
                                      className="bg-zinc-900 text-orange-500 border border-zinc-850 rounded-xl px-2.5 text-[10px] font-bold hover:bg-zinc-850"
                                    >
                                      +
                                    </button>
                                  </div>
                                  <div className="space-y-1.5 max-h-[150px] overflow-y-auto pr-1">
                                    {monthlyLearnings.length === 0 && (
                                      <p className="text-[10px] text-zinc-650 italic">Nenhum aprendizado adicionado.</p>
                                    )}
                                    {monthlyLearnings.map((item, index) => (
                                      <div key={index} className="flex items-center justify-between p-2 bg-zinc-950/40 border border-zinc-900 rounded-lg text-xs">
                                        <span className="text-zinc-300 break-words flex-1 pr-2">• {item}</span>
                                        <button
                                          onClick={() => setMonthlyLearnings(p => p.filter((_, i) => i !== index))}
                                          className="text-zinc-500 hover:text-rose-500 shrink-0"
                                        >
                                          <Trash2 className="h-3.5 w-3.5" />
                                        </button>
                                      </div>
                                    ))}
                                  </div>
                                </div>

                                {/* O que melhorar */}
                                <div className="space-y-3">
                                  <label className="text-[10px] text-zinc-400 font-bold uppercase tracking-wider block">Ajustes & Melhorias:</label>
                                  <div className="flex gap-2">
                                    <input
                                      type="text"
                                      value={newImprovement}
                                      onChange={(e) => setNewImprovement(e.target.value)}
                                      placeholder="Adicionar melhoria..."
                                      className="flex-1 bg-zinc-950 border border-zinc-900 rounded-xl px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-orange-500/50"
                                      onKeyDown={(e) => {
                                        if (e.key === 'Enter') {
                                          e.preventDefault();
                                          if (!newImprovement.trim()) return;
                                          setMonthlyImprovements(p => [...p, newImprovement.trim()]);
                                          setNewImprovement('');
                                        }
                                      }}
                                    />
                                    <button
                                      type="button"
                                      onClick={() => {
                                        if (!newImprovement.trim()) return;
                                        setMonthlyImprovements(p => [...p, newImprovement.trim()]);
                                        setNewImprovement('');
                                      }}
                                      className="bg-zinc-900 text-orange-500 border border-zinc-850 rounded-xl px-2.5 text-[10px] font-bold hover:bg-zinc-850"
                                    >
                                      +
                                    </button>
                                  </div>
                                  <div className="space-y-1.5 max-h-[150px] overflow-y-auto pr-1">
                                    {monthlyImprovements.length === 0 && (
                                      <p className="text-[10px] text-zinc-650 italic">Nenhum item adicionado.</p>
                                    )}
                                    {monthlyImprovements.map((item, index) => (
                                      <div key={index} className="flex items-center justify-between p-2 bg-zinc-950/40 border border-zinc-900 rounded-lg text-xs">
                                        <span className="text-zinc-300 break-words flex-1 pr-2">• {item}</span>
                                        <button
                                          onClick={() => setMonthlyImprovements(p => p.filter((_, i) => i !== index))}
                                          className="text-zinc-500 hover:text-rose-500 shrink-0"
                                        >
                                          <Trash2 className="h-3.5 w-3.5" />
                                        </button>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              </div>

                              {/* Action buttons */}
                              <div className="flex justify-end pt-3 border-t border-zinc-900 gap-2">
                                <button
                                  type="button"
                                  onClick={() => {
                                    handleSaveMonthlyReview();
                                    setIsEditingMonthlyReview(false);
                                  }}
                                  className="px-5 py-2.5 bg-orange-500 hover:bg-orange-600 text-white text-xs font-black rounded-xl flex items-center gap-1.5 transition-all shadow-md"
                                >
                                  <Save className="h-4 w-4" />
                                  <span>Salvar Review Mensal</span>
                                </button>
                              </div>
                            </div>
                          )}
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                );
              })()}

              {/* Weeks of this Month (Squares Grid Layout) */}
              <div className="p-5 bg-zinc-950/40 border border-zinc-900 rounded-3xl space-y-4">
                <div 
                  onClick={() => setIsWeeklyReviewsOpen(!isWeeklyReviewsOpen)}
                  className="flex justify-between items-center cursor-pointer select-none group pb-1.5 border-b border-zinc-900/60"
                >
                  <span className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider block">
                    Reviews Semanais ({months[selectedMonthIndex]})
                  </span>
                  <ChevronDown className={`h-4 w-4 text-zinc-500 group-hover:text-white transition-transform duration-200 ${isWeeklyReviewsOpen ? 'transform rotate-0' : 'transform -rotate-90'}`} />
                </div>

                <AnimatePresence initial={false}>
                  {isWeeklyReviewsOpen && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      transition={{ duration: 0.2 }}
                      className="space-y-4 overflow-hidden"
                    >
                      {/* Squares Grid displayed on the same line */}
                      <div className="grid grid-cols-2 xs:grid-cols-3 sm:grid-cols-5 gap-3.5">
                        {getWeeksForMonth(selectedYear, selectedMonthIndex).map((wkNum) => {
                          const existingWr = weeklyReviews.find(r => r.year === selectedYear && r.weekNumber === wkNum);
                          const isExpanded = expandedWeekNum === wkNum;
                          
                          return (
                            <div
                              key={wkNum}
                              onClick={() => {
                                if (!existingWr) {
                                  handleOpenWeeklyReview(wkNum);
                                } else {
                                  const isExpandedNow = !isExpanded;
                                  setExpandedWeekNum(isExpandedNow ? wkNum : null);
                                  if (isExpandedNow) {
                                    setTimeout(() => {
                                      const element = document.getElementById(`expanded-week-detail-${wkNum}`);
                                      if (element) {
                                        element.scrollIntoView({ behavior: 'smooth', block: 'center' });
                                      }
                                    }, 150);
                                  }
                                }
                              }}
                              className={`aspect-square rounded-2xl p-4 flex flex-col justify-between cursor-pointer select-none border transition-all duration-300 ${
                                isExpanded 
                                  ? 'border-orange-500 bg-orange-500/5 shadow-lg shadow-orange-500/5 scale-[1.02]' 
                                  : existingWr 
                                    ? 'border-orange-500/20 bg-zinc-950/60 hover:border-orange-500/40' 
                                    : 'border-zinc-850 bg-zinc-950/20 hover:border-zinc-800'
                              }`}
                            >
                              <div className="space-y-1">
                                <span className="text-xs font-black text-white block">Semana {wkNum}</span>
                                <span className="text-[9px] text-zinc-500 font-mono block">
                                  {getWeekDateRange(selectedYear, wkNum)}
                                </span>
                              </div>

                              <div className="flex items-center justify-between mt-2 pt-2 border-t border-zinc-900/40">
                                <span className={`text-[8px] font-bold uppercase px-1.5 py-0.5 rounded border transition-colors ${
                                  existingWr
                                    ? 'bg-orange-500/10 border-orange-500/20 text-orange-400'
                                    : 'bg-zinc-900 border-zinc-850 text-zinc-500'
                                }`}>
                                  {existingWr ? 'Revisado ✓' : 'Pendente'}
                                </span>
                                {existingWr && (
                                  <span className="w-1.5 h-1.5 bg-orange-500 rounded-full inline-block animate-pulse" />
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>

                      {/* Dropdown Content of Expanded Week Card */}
                      <AnimatePresence initial={false}>
                        {expandedWeekNum !== null && (() => {
                          const wkNum = expandedWeekNum;
                          const existingWr = weeklyReviews.find(r => r.year === selectedYear && r.weekNumber === wkNum);
                          
                          return (
                            <motion.div
                              id={`expanded-week-detail-${wkNum}`}
                              key={`expanded-week-${wkNum}`}
                              initial={{ height: 0, opacity: 0 }}
                              animate={{ height: 'auto', opacity: 1 }}
                              exit={{ height: 0, opacity: 0 }}
                              transition={{ duration: 0.2 }}
                              className="border border-zinc-900 rounded-2xl bg-[#070709] overflow-hidden"
                            >
                              <div className="p-4.5 space-y-4 text-xs">
                                <div className="flex justify-between items-center pb-2.5 border-b border-zinc-900/60">
                                  <h4 className="text-xs font-black text-white flex items-center gap-1.5">
                                    <span className="w-2 h-2 rounded-full bg-orange-500" />
                                    Conteúdo da Semana {wkNum}
                                  </h4>
                                  <span className="text-[9px] text-zinc-500 font-mono">
                                    ({getWeekDateRange(selectedYear, wkNum)})
                                  </span>
                                </div>

                                {existingWr ? (
                                  <div className="space-y-4">
                                    {existingWr.oneSentence && (
                                      <p className="text-xs font-serif italic text-white leading-relaxed bg-zinc-950/40 p-3 rounded-xl border border-zinc-900">
                                        "{existingWr.oneSentence}"
                                      </p>
                                    )}
                                    <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 pt-1 text-[10.5px]">
                                      <div className="space-y-1.5">
                                        <span className="text-[9px] text-zinc-500 font-bold block uppercase tracking-wider">Momentos Marcantes:</span>
                                        {existingWr.memorableMoments && existingWr.memorableMoments.length > 0 ? (
                                          <ul className="list-disc pl-3.5 space-y-1 text-zinc-300">
                                            {existingWr.memorableMoments.map((m, i) => <li key={i}>{m}</li>)}
                                          </ul>
                                        ) : (
                                          <p className="text-[10px] text-zinc-650 italic">Nenhum adicionado</p>
                                        )}
                                      </div>
                                      <div className="space-y-1.5">
                                        <span className="text-[9px] text-zinc-500 font-bold block uppercase tracking-wider">Aprendizados:</span>
                                        {existingWr.learnings && existingWr.learnings.length > 0 ? (
                                          <ul className="list-disc pl-3.5 space-y-1 text-zinc-300">
                                            {existingWr.learnings.map((l, i) => <li key={i}>{l}</li>)}
                                          </ul>
                                        ) : (
                                          <p className="text-[10px] text-zinc-650 italic">Nenhum adicionado</p>
                                        )}
                                      </div>
                                      <div className="space-y-1.5">
                                        <span className="text-[9px] text-zinc-500 font-bold block uppercase tracking-wider">O que melhorar:</span>
                                        {existingWr.improvements && existingWr.improvements.length > 0 ? (
                                          <ul className="list-disc pl-3.5 space-y-1 text-zinc-300">
                                            {existingWr.improvements.map((im, i) => <li key={i}>{im}</li>)}
                                          </ul>
                                        ) : (
                                          <p className="text-[10px] text-zinc-650 italic">Nenhum adicionado</p>
                                        )}
                                      </div>
                                      {/* Leitura(s) da Semana */}
                                      <div className="space-y-1.5">
                                        <span className="text-[9px] text-zinc-500 font-bold block uppercase tracking-wider">Leitura(s) da Semana:</span>
                                        {existingWr.readings ? (
                                          <p className="text-zinc-300 whitespace-pre-wrap leading-relaxed">
                                            {existingWr.readings}
                                          </p>
                                        ) : (
                                          <p className="text-[10px] text-zinc-650 italic">Nenhuma registrada</p>
                                        )}
                                      </div>
                                    </div>
                                    <div className="flex justify-end pt-2 border-t border-zinc-900/60">
                                      <button
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          handleOpenWeeklyReview(wkNum);
                                        }}
                                        className="px-3 py-1.5 bg-zinc-900 hover:bg-zinc-850 text-white text-[10px] font-bold rounded-lg border border-zinc-800 transition-colors"
                                      >
                                        Editar Review Semanal
                                      </button>
                                    </div>
                                  </div>
                                ) : (
                                  <div className="text-center py-5 space-y-2">
                                    <p className="text-xs text-zinc-500 font-medium">Nenhum registro para esta semana.</p>
                                    <button
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        handleOpenWeeklyReview(wkNum);
                                      }}
                                      className="px-3.5 py-2 bg-orange-500 hover:bg-orange-600 text-white text-[10px] font-black rounded-lg transition-colors shadow-sm"
                                    >
                                      Iniciar Review da Semana {wkNum}
                                    </button>
                                  </div>
                                )}
                              </div>
                            </motion.div>
                          );
                        })()}
                      </AnimatePresence>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Days List of this Month */}
              <div className="bg-[#0b0b0d]/50 border border-zinc-900 rounded-3xl p-5 space-y-4">
                <div className="flex justify-between items-center border-b border-zinc-900 pb-3">
                  <span className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider">
                    Registros Diários (Ordem Descendente)
                  </span>
                  <span className="text-[9px] text-zinc-600 font-mono block">
                    Selecione um dia para abrir o Espaço Diário & Fé
                  </span>
                </div>

                <div className="divide-y divide-zinc-900/50 max-h-[600px] overflow-y-auto pr-2 scrollbar-thin">
                  {getDaysInMonth(selectedYear, selectedMonthIndex).map((day) => {
                    const record = notes.find(n => n.date === day.dateStr && n.isDailyRecord);
                    const completedTasksCount = record?.checklist?.filter(t => t.completed).length || 0;
                    const totalTasksCount = record?.checklist?.length || 0;
                    
                    return (
                      <div
                        key={day.dateStr}
                        onClick={() => handleOpenDailyWorkspace(day.dateStr)}
                        className="py-3.5 flex items-center justify-between hover:bg-zinc-900/10 px-3 -mx-3 rounded-2xl transition-all cursor-pointer group"
                      >
                        <div className="flex items-center gap-3 min-w-0 flex-1 pr-4">
                          <div className="space-y-0.5 shrink-0">
                            <span className="text-[11px] font-serif italic font-black text-gray-200 group-hover:text-orange-400 transition-colors block">
                              {day.dayNum}/{selectedMonthIndex + 1}/{selectedYear}
                            </span>
                            <span className="text-[9px] text-zinc-500 block capitalize leading-none">
                              {day.weekday}
                            </span>
                          </div>
                          {record?.journalText && (
                            <span className="text-[10.5px] text-zinc-400 font-sans italic truncate flex-1 ml-3 border-l border-zinc-900/60 pl-3 leading-relaxed">
                              {record.journalText}
                            </span>
                          )}
                        </div>

                        <div className="flex items-center gap-3 shrink-0">
                          {/* Alter ego indicator */}
                          {record?.alterEgoWinner && (
                            <span className={`text-[8px] font-bold font-mono uppercase px-1.5 py-0.5 rounded border ${
                              record.alterEgoWinner === 'Alfredo' 
                                ? 'bg-orange-500/10 border-orange-500/20 text-orange-400' 
                                : 'bg-rose-500/10 border-rose-500/20 text-rose-400'
                            }`} title="Vencedor do Alter Ego">
                              {record.alterEgoWinner}
                            </span>
                          )}

                          {/* Checklist completion tracker badge */}
                          {totalTasksCount > 0 ? (
                            <span className={`text-[9.5px] font-bold font-mono px-2 py-0.5 rounded-full border ${
                              completedTasksCount === totalTasksCount 
                                ? 'bg-emerald-500/15 border-emerald-500/20 text-emerald-400' 
                                : 'bg-zinc-900 border-zinc-850 text-zinc-500'
                            }`}>
                              {completedTasksCount}/{totalTasksCount}
                            </span>
                          ) : (
                            <span className="text-[9px] font-bold font-mono text-zinc-650">-</span>
                          )}

                          <span className="text-[10px] text-zinc-600 font-bold uppercase transition-colors group-hover:text-white flex items-center gap-1 select-none font-mono">
                            <span>Abrir</span>
                            <span>→</span>
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
      </motion.div>
    )}
  </AnimatePresence>

      {/* --- DAILY WORKSPACE DETAILED FULL MODAL (All tabs of Espaço Diário & Fé) --- */}
      <AnimatePresence>
        {selectedDateStr && (
          <div 
            onClick={() => setSelectedDateStr(null)}
            className="fixed inset-0 z-[9999] bg-[#040405]/95 backdrop-blur-md flex items-center justify-center p-4 md:p-6 overflow-hidden cursor-pointer"
          >
            <motion.div
              onClick={(e) => e.stopPropagation()}
              initial={{ scale: 0.95, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 20 }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              className="cursor-default bg-[#0a0a0c] border border-zinc-800 rounded-3xl w-full max-w-6xl h-full max-h-[85vh] my-auto flex flex-col overflow-hidden shadow-2xl shadow-orange-500/5 text-left"
            >
              {/* Header */}
              <div className="p-5 border-b border-zinc-850 flex items-center justify-between bg-zinc-950/40">
                <div>
                  <h3 className="text-xs font-bold text-white uppercase tracking-wider">
                    Espaço Diário & Fé
                  </h3>
                  <p className="text-[10.5px] text-orange-500 font-mono font-bold mt-0.5">
                    Data: {selectedDateStr.split('-').reverse().join('/')}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setIsTagModalOpen(true)}
                    className="px-2.5 py-1 bg-zinc-900 hover:bg-zinc-800 text-orange-400 border border-orange-500/30 text-[10px] font-bold rounded-lg flex items-center gap-1 transition-colors"
                    title="Abrir Central de Tags (@)"
                  >
                    <Folder className="h-3 w-3" /> Tags
                  </button>
                  <button
                    onClick={() => setSelectedDateStr(null)}
                    className="p-1.5 hover:bg-zinc-900 text-zinc-400 hover:text-white rounded-lg transition-colors"
                  >
                    <X className="h-4.5 w-4.5" />
                  </button>
                </div>
              </div>

              {/* Sub tabs list selectors (Grid de Categorias de Bloco) */}
              <div className="px-5 py-3 border-b border-zinc-900 grid grid-cols-3 sm:grid-cols-5 gap-2 bg-zinc-950/40">
                {[
                  { id: 'diario', label: 'Diário Pessoal', icon: BookOpen },
                  { id: 'checklist', label: 'Checklist Diário', icon: CheckSquare },
                  { id: 'espiritualidade', label: 'Espiritualidade', icon: Sparkles },
                  { id: 'alteregos', label: 'Alter Egos', icon: Sliders },
                  { id: 'saude', label: 'Saúde & Hábitos', icon: Heart }
                ].map((tb) => {
                  const Icon = tb.icon;
                  const isActive = activeTopic === tb.id;
                  return (
                    <button
                      key={tb.id}
                      type="button"
                      onClick={() => setActiveTopic(tb.id as any)}
                      className={`flex flex-col items-center justify-center p-3 rounded-2xl transition-all font-sans ${
                        isActive
                          ? 'bg-orange-500 text-white font-extrabold shadow-lg shadow-orange-500/20 border border-orange-400/40 scale-[1.02]'
                          : 'bg-zinc-900/80 hover:bg-zinc-850 text-zinc-400 hover:text-white border border-zinc-800/80'
                      }`}
                    >
                      <Icon className={`h-5 w-5 ${isActive ? 'text-white' : 'text-orange-400'}`} />
                      <span className="text-[11px] font-bold mt-1.5 text-center leading-tight">
                        {tb.label}
                      </span>
                    </button>
                  );
                })}
              </div>

              {/* Main Tab Content */}
              <div className="flex-1 overflow-y-auto p-5 space-y-4">
                {activeTopic === 'diario' && (
                  <div className="space-y-2 flex flex-col h-full min-h-[300px]">
                    <div className="flex justify-between items-center text-[10px] text-zinc-500 uppercase tracking-wider font-bold">
                      <span>Reflexões do dia</span>
                      <span>{journalText.length} caractere(s)</span>
                    </div>
                    <TagInputWithMention
                      value={journalText}
                      onChange={setJournalText}
                      rows={10}
                      openTagManagerModal={() => setIsTagModalOpen(true)}
                      placeholder="Relate detalhadamente como foi o seu dia, seus sentimentos, suas lutas e conquistas... Use @ para invocar tags ou @# para criar."
                    />
                  </div>
                )}

                {activeTopic === 'checklist' && (
                  <div className="space-y-4 min-h-[300px]">
                    <div className="flex justify-between items-center text-[10px] uppercase tracking-wider font-bold">
                      <span className="text-zinc-400">Suas Missões Diárias</span>
                      <span className="text-orange-500 font-mono font-bold">
                        {dayChecklist.filter(t => t.completed).length}/{dayChecklist.length} Concluídas
                      </span>
                    </div>

                    {/* Quick Add Custom Item Form */}
                    <form onSubmit={handleAddCustomDayTask} className="flex gap-2">
                      <input
                        type="text"
                        value={newDayTaskText}
                        onChange={(e) => setNewDayTaskText(e.target.value)}
                        placeholder="Adicionar tarefa rápida específica para este dia..."
                        className="flex-1 bg-zinc-950 border border-zinc-850 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-orange-500/50"
                      />
                      <button
                        type="submit"
                        className="bg-zinc-900 hover:bg-zinc-800 text-orange-500 border border-zinc-800 rounded-xl px-4 py-2 text-xs font-bold transition-all"
                      >
                        Adicionar
                      </button>
                    </form>

                    {/* List */}
                    <div className="space-y-2 max-h-[250px] overflow-y-auto pr-1">
                      {dayChecklist.length === 0 ? (
                        <div className="text-center py-10 border border-dashed border-zinc-900 rounded-2xl">
                          <p className="text-xs text-zinc-500">Nenhuma missão para este dia.</p>
                        </div>
                      ) : (
                        dayChecklist.map((task) => (
                          <div
                            key={task.id}
                            className="flex items-center justify-between p-3 bg-zinc-950 border border-zinc-900 rounded-xl hover:border-zinc-850 transition-all"
                          >
                            <label className="flex items-center gap-3 cursor-pointer min-w-0 flex-1">
                              <div className="relative flex items-center justify-center shrink-0">
                                <input
                                  type="checkbox"
                                  checked={task.completed}
                                  onChange={() => handleToggleChecklistItem(task.id)}
                                  className="sr-only"
                                />
                                <div
                                  className={`w-4 h-4 rounded border flex items-center justify-center transition-all duration-200 ${
                                    task.completed
                                      ? 'bg-gradient-to-br from-orange-500 to-amber-600 border-orange-500 shadow-sm shadow-orange-500/20 text-black scale-105'
                                      : 'border-zinc-800 hover:border-orange-500/50 bg-zinc-950/80'
                                  }`}
                                >
                                  {task.completed && (
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
                              <span className={`text-xs truncate ${task.completed ? 'line-through text-zinc-500' : 'text-zinc-300 font-bold'}`}>
                                {task.text}
                              </span>
                            </label>

                            {task.id.startsWith('task-custom') && (
                              <button
                                onClick={() => handleDeleteCustomDayTask(task.id)}
                                className="text-zinc-600 hover:text-rose-500 p-1 rounded hover:bg-zinc-900"
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </button>
                            )}
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                )}

                {activeTopic === 'espiritualidade' && (
                  <div className="space-y-4 min-h-[300px]">
                    {/* Sub pills */}
                    <div className="flex gap-1 bg-zinc-950 p-1 border border-zinc-900 rounded-xl">
                      {(['gratidao', 'decretos', 'oracao'] as const).map((sub) => (
                        <button
                          key={sub}
                          onClick={() => setActiveSubtopic(sub)}
                          className={`flex-1 py-1.5 text-[9.5px] font-bold uppercase rounded-lg transition-all ${
                            activeSubtopic === sub
                              ? 'bg-orange-500/10 text-orange-400 border border-orange-500/20'
                              : 'text-zinc-500 hover:text-zinc-300'
                          }`}
                        >
                          {sub === 'gratidao' ? 'Gratidão' : sub === 'decretos' ? 'Decretos' : 'Oração'}
                        </button>
                      ))}
                    </div>

                    {/* Area text editors with template loader */}
                    <div className="space-y-2 flex-1 flex flex-col">
                      <div className="flex justify-between items-center text-[10px] text-zinc-500 uppercase font-bold">
                        <span>
                          {activeSubtopic === 'gratidao' ? 'Caderno da Gratidão' : activeSubtopic === 'decretos' ? 'Afirmações & Decretos' : 'Minhas Orações'}
                        </span>
                        <button
                          type="button"
                          onClick={() => {
                            if (activeSubtopic === 'gratidao') setGratitudeText(templateGratitude);
                            if (activeSubtopic === 'decretos') setDecreesText(templateDecrees);
                            if (activeSubtopic === 'oracao') setPrayerText(templatePrayer);
                            addXp(2);
                          }}
                          className="text-orange-500 hover:text-orange-400 transition-colors"
                        >
                          Carregar Modelo
                        </button>
                      </div>

                      {activeSubtopic === 'gratidao' && (
                        <textarea
                          value={gratitudeText}
                          onChange={(e) => setGratitudeText(e.target.value)}
                          onKeyDown={(e) => handleAutoListKeyDown(e, gratitudeText, setGratitudeText)}
                          placeholder="Liste 3 motivos para agradecer hoje..."
                          className="w-full flex-1 min-h-[280px] sm:min-h-[340px] bg-zinc-950 border border-zinc-900 rounded-2xl p-4 text-xs text-white focus:outline-none focus:border-orange-500/50 resize-y font-sans leading-relaxed"
                        />
                      )}

                      {activeSubtopic === 'decretos' && (
                        <textarea
                          value={decreesText}
                          onChange={(e) => setDecreesText(e.target.value)}
                          onKeyDown={(e) => handleAutoListKeyDown(e, decreesText, setDecreesText)}
                          placeholder="Eu sou..."
                          className="w-full flex-1 min-h-[280px] sm:min-h-[340px] bg-zinc-950 border border-zinc-900 rounded-2xl p-4 text-xs text-white focus:outline-none focus:border-orange-500/50 resize-y font-sans leading-relaxed"
                        />
                      )}

                      {activeSubtopic === 'oracao' && (
                        <textarea
                          value={prayerText}
                          onChange={(e) => setPrayerText(e.target.value)}
                          onKeyDown={(e) => handleAutoListKeyDown(e, prayerText, setPrayerText)}
                          placeholder="Sua oração pessoal..."
                          className="w-full flex-1 min-h-[280px] sm:min-h-[340px] bg-zinc-950 border border-zinc-900 rounded-2xl p-4 text-xs text-white focus:outline-none focus:border-orange-500/50 resize-y font-sans leading-relaxed"
                        />
                      )}
                    </div>
                  </div>
                )}

                {activeTopic === 'alteregos' && (
                  <div className="space-y-4 min-h-[300px]">
                    <div>
                      <span className="text-[10px] text-zinc-400 font-bold block uppercase tracking-wider">
                        Vencedor de Hoje
                      </span>
                      <p className="text-[9.5px] text-zinc-500 leading-normal mt-0.5">
                        Defina se Alfredo (Disciplina e Progresso) ou Beto (Preguiça e Impulsividade) governou suas decisões hoje.
                      </p>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <button
                        type="button"
                        onClick={() => {
                          setAlterEgoWinner('Alfredo');
                          addXp(5);
                        }}
                        className={`p-4 rounded-2xl border text-center transition-all flex flex-col items-center justify-center gap-1 ${
                          alterEgoWinner === 'Alfredo'
                            ? 'bg-orange-500/10 border-orange-500/30 text-orange-400 font-black'
                            : 'bg-zinc-950 border-zinc-900 text-zinc-500 hover:text-zinc-300'
                        }`}
                      >
                        <Zap className="h-5 w-5 mb-1" />
                        <span className="text-xs">Alfredo</span>
                        <span className="text-[8px] uppercase tracking-wider opacity-60">Disciplina</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          setAlterEgoWinner('Beto');
                          addXp(5);
                        }}
                        className={`p-4 rounded-2xl border text-center transition-all flex flex-col items-center justify-center gap-1 ${
                          alterEgoWinner === 'Beto'
                            ? 'bg-rose-500/10 border-rose-500/30 text-rose-400 font-black'
                            : 'bg-zinc-950 border-zinc-900 text-zinc-500 hover:text-zinc-300'
                        }`}
                      >
                        <Trash2 className="h-5 w-5 mb-1" />
                        <span className="text-xs">Beto</span>
                        <span className="text-[8px] uppercase tracking-wider opacity-60">Impulso</span>
                      </button>
                    </div>

                    <div className="space-y-1">
                      <span className="text-[10px] text-zinc-500 font-bold block uppercase mt-2">Reflexão Comportamental</span>
                      <textarea
                        value={alterEgoText}
                        onChange={(e) => setAlterEgoText(e.target.value)}
                        onKeyDown={(e) => handleAutoListKeyDown(e, alterEgoText, setAlterEgoText)}
                        placeholder="Quais gatilhos você enfrentou? Onde o Alfredo foi forte? Onde o Beto tentou infiltrar?"
                        className="w-full h-32 bg-zinc-950 border border-zinc-900 rounded-2xl p-4 text-xs text-white focus:outline-none focus:border-orange-500/50 resize-none font-sans"
                      />
                    </div>
                  </div>
                )}

                {activeTopic === 'saude' && (
                  <div className="space-y-5 min-h-[300px]">
                    {/* Sleep times */}
                    <div className="bg-zinc-950 p-4 border border-zinc-900 rounded-2xl space-y-3">
                      <div className="text-[10px] text-zinc-400 font-bold uppercase tracking-wider flex items-center gap-1.5 border-b border-zinc-900 pb-2">
                        <Clock className="h-4 w-4 text-orange-500" />
                        <span>Controle de Sono</span>
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="text-[10px] text-zinc-500 block mb-1">Deitou-se às:</label>
                          <input
                            type="text"
                            inputMode="numeric"
                            placeholder="23:00"
                            maxLength={5}
                            value={sleepBedTime}
                            onChange={(e) => setSleepBedTime(formatTimeInput(e.target.value))}
                            onFocus={moveCursorToEnd}
                            onClick={moveCursorToEnd}
                            className="w-full bg-zinc-900 border border-zinc-800 rounded-lg p-2 text-xs text-white font-mono focus:outline-none focus:border-orange-500/50"
                          />
                        </div>
                        <div>
                          <label className="text-[10px] text-zinc-500 block mb-1">Acordou às:</label>
                          <input
                            type="text"
                            inputMode="numeric"
                            placeholder="07:00"
                            maxLength={5}
                            value={sleepWakeTime}
                            onChange={(e) => setSleepWakeTime(formatTimeInput(e.target.value))}
                            onFocus={moveCursorToEnd}
                            onClick={moveCursorToEnd}
                            className="w-full bg-zinc-900 border border-zinc-800 rounded-lg p-2 text-xs text-white font-mono focus:outline-none focus:border-orange-500/50"
                          />
                        </div>
                      </div>
                    </div>

                    {/* Meal logger */}
                    <div className="bg-zinc-950 p-4 border border-zinc-900 rounded-2xl space-y-3">
                      <div className="text-[10px] text-zinc-400 font-bold uppercase tracking-wider flex items-center gap-1.5 border-b border-zinc-900 pb-2">
                        <Heart className="h-4 w-4 text-rose-500" />
                        <span>Refeições e Dieta</span>
                      </div>

                      <div className="space-y-2.5">
                        <div>
                          <label className="text-[9px] text-zinc-500 block">Café da Manhã:</label>
                          <textarea
                            value={foodMorning}
                            onChange={(e) => setFoodMorning(e.target.value)}
                            onKeyDown={(e) => handleAutoListKeyDown(e, foodMorning, setFoodMorning)}
                            placeholder="O que comeu de manhã..."
                            rows={2}
                            className="w-full bg-zinc-900 border border-zinc-800 rounded-lg p-2 text-xs text-white focus:outline-none focus:border-rose-500/50 resize-y min-h-[52px]"
                          />
                        </div>
                        <div>
                          <label className="text-[9px] text-zinc-500 block">Almoço / Lanche:</label>
                          <textarea
                            value={foodAfternoon}
                            onChange={(e) => setFoodAfternoon(e.target.value)}
                            onKeyDown={(e) => handleAutoListKeyDown(e, foodAfternoon, setFoodAfternoon)}
                            placeholder="O que comeu à tarde..."
                            rows={2}
                            className="w-full bg-zinc-900 border border-zinc-800 rounded-lg p-2 text-xs text-white focus:outline-none focus:border-rose-500/50 resize-y min-h-[52px]"
                          />
                        </div>
                        <div>
                          <label className="text-[9px] text-zinc-500 block">Jantar / Ceia:</label>
                          <textarea
                            value={foodNight}
                            onChange={(e) => setFoodNight(e.target.value)}
                            onKeyDown={(e) => handleAutoListKeyDown(e, foodNight, setFoodNight)}
                            placeholder="O que comeu à noite..."
                            rows={2}
                            className="w-full bg-zinc-900 border border-zinc-800 rounded-lg p-2 text-xs text-white focus:outline-none focus:border-rose-500/50 resize-y min-h-[52px]"
                          />
                        </div>
                      </div>
                    </div>

                    {/* Water incrementer */}
                    <div className="bg-zinc-950 p-4 border border-zinc-900 rounded-2xl flex items-center justify-between">
                      <div className="space-y-1">
                        <span className="text-[10px] text-zinc-400 font-bold block uppercase tracking-wider">Hidratação</span>
                        <div className="text-sm font-mono font-bold text-white">
                          {waterLiters.toFixed(1)} L / 3.0 L
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => {
                            setWaterLiters(prev => Math.max(0, prev - 0.5));
                            addXp(-2);
                          }}
                          className="w-8 h-8 rounded-full bg-zinc-900 hover:bg-zinc-850 border border-zinc-800 font-bold text-zinc-400 text-sm flex items-center justify-center transition-all"
                        >
                          -
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setWaterLiters(prev => Math.min(6, prev + 0.5));
                            addXp(5);
                          }}
                          className="w-8 h-8 rounded-full bg-orange-500/10 hover:bg-orange-500/20 border border-orange-500/20 font-bold text-orange-500 text-sm flex items-center justify-center transition-all"
                        >
                          +
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Save footer */}
              <div className="p-4 bg-zinc-950 border-t border-zinc-850 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setSelectedDateStr(null)}
                  className="px-4 py-2 bg-zinc-900 hover:bg-zinc-800 text-zinc-300 text-xs font-bold rounded-xl transition-all"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={handleSaveDailyRecord}
                  disabled={savingStatus === 'saving'}
                  className="px-5 py-2 bg-orange-500 hover:bg-orange-600 text-white text-xs font-bold rounded-xl flex items-center gap-1.5 transition-all shadow-lg shadow-orange-500/5"
                >
                  <Save className="h-3.5 w-3.5" />
                  <span>{savingStatus === 'saving' ? 'Salvando...' : savingStatus === 'saved' ? 'Salvo ✓' : 'Salvar Registro'}</span>
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* --- MONTHLY REVIEW DETAILED MODAL --- */}
      <AnimatePresence>
        {isMonthlyReviewModalOpen && (
          <div 
            onClick={() => setIsMonthlyReviewModalOpen(false)}
            className="fixed inset-0 z-50 bg-[#040405]/95 backdrop-blur-md flex items-center justify-center p-4 md:p-6 overflow-hidden cursor-pointer"
          >
            <motion.div
              onClick={(e) => e.stopPropagation()}
              initial={{ scale: 0.95, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 20 }}
              className="cursor-default bg-[#0a0a0c] border border-zinc-800 rounded-3xl w-full max-w-2xl h-full max-h-[80vh] flex flex-col overflow-hidden shadow-2xl text-left"
            >
              <div className="p-5 border-b border-zinc-850 bg-zinc-950/40 flex items-center justify-between">
                <div>
                  <h3 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
                    <Award className="h-4 w-4 text-orange-500" />
                    Review Mensal - {months[selectedMonthIndex]} / {selectedYear}
                  </h3>
                  <p className="text-[10px] text-zinc-500 mt-0.5">Analise e consolide seus resultados mensais de forma estruturada.</p>
                </div>
                <button onClick={() => setIsMonthlyReviewModalOpen(false)} className="text-zinc-400 hover:text-white p-1">
                  <X className="h-4.5 w-4.5" />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-5 space-y-4">
                {/* One sentence summary */}
                <div className="space-y-1">
                  <label className="text-[10px] text-zinc-400 font-bold block uppercase tracking-wider">O mês em uma única frase:</label>
                  <input
                    type="text"
                    value={monthlyOneSentence}
                    onChange={(e) => setMonthlyOneSentence(e.target.value)}
                    placeholder="Resuma o mês em poucas palavras impactantes..."
                    className="w-full bg-zinc-950 border border-zinc-900 rounded-xl p-3 text-xs text-white focus:outline-none focus:border-orange-500/50"
                  />
                </div>

                {/* Moments section */}
                <div className="space-y-2">
                  <label className="text-[10px] text-zinc-400 font-bold block uppercase tracking-wider">Momentos Marcantes & Conquistas:</label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={newMoment}
                      onChange={(e) => setNewMoment(e.target.value)}
                      placeholder="Adicionar momento memorável..."
                      className="flex-1 bg-zinc-950 border border-zinc-900 rounded-xl px-3 py-1.5 text-xs text-white"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        if (!newMoment.trim()) return;
                        setMonthlyMemorableMoments(p => [...p, newMoment.trim()]);
                        setNewMoment('');
                      }}
                      className="bg-zinc-900 text-orange-500 border border-zinc-850 rounded-xl px-3 py-1 text-xs font-bold hover:bg-zinc-850"
                    >
                      Adicionar
                    </button>
                  </div>
                  <div className="space-y-1">
                    {monthlyMemorableMoments.map((item, index) => (
                      <div key={index} className="flex items-center justify-between p-2 bg-zinc-950/40 border border-zinc-900 rounded-lg text-xs">
                        <span className="text-zinc-300">• {item}</span>
                        <button onClick={() => setMonthlyMemorableMoments(p => p.filter((_, i) => i !== index))} className="text-zinc-500 hover:text-rose-500">
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Learnings section */}
                <div className="space-y-2">
                  <label className="text-[10px] text-zinc-400 font-bold block uppercase tracking-wider">Aprendizados & Insights:</label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={newLearning}
                      onChange={(e) => setNewLearning(e.target.value)}
                      placeholder="O que você aprendeu este mês..."
                      className="flex-1 bg-zinc-950 border border-zinc-900 rounded-xl px-3 py-1.5 text-xs text-white"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        if (!newLearning.trim()) return;
                        setMonthlyLearnings(p => [...p, newLearning.trim()]);
                        setNewLearning('');
                      }}
                      className="bg-zinc-900 text-orange-500 border border-zinc-850 rounded-xl px-3 py-1 text-xs font-bold hover:bg-zinc-850"
                    >
                      Adicionar
                    </button>
                  </div>
                  <div className="space-y-1">
                    {monthlyLearnings.map((item, index) => (
                      <div key={index} className="flex items-center justify-between p-2 bg-zinc-950/40 border border-zinc-900 rounded-lg text-xs">
                        <span className="text-zinc-300">• {item}</span>
                        <button onClick={() => setMonthlyLearnings(p => p.filter((_, i) => i !== index))} className="text-zinc-500 hover:text-rose-500">
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Improvements section */}
                <div className="space-y-2">
                  <label className="text-[10px] text-zinc-400 font-bold block uppercase tracking-wider">O que melhorar para o próximo mês:</label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={newImprovement}
                      onChange={(e) => setNewImprovement(e.target.value)}
                      placeholder="O que faltou ou pode ser melhorado..."
                      className="flex-1 bg-zinc-950 border border-zinc-900 rounded-xl px-3 py-1.5 text-xs text-white"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        if (!newImprovement.trim()) return;
                        setMonthlyImprovements(p => [...p, newImprovement.trim()]);
                        setNewImprovement('');
                      }}
                      className="bg-zinc-900 text-orange-500 border border-zinc-850 rounded-xl px-3 py-1 text-xs font-bold hover:bg-zinc-850"
                    >
                      Adicionar
                    </button>
                  </div>
                  <div className="space-y-1">
                    {monthlyImprovements.map((item, index) => (
                      <div key={index} className="flex items-center justify-between p-2 bg-zinc-950/40 border border-zinc-900 rounded-lg text-xs">
                        <span className="text-zinc-300">• {item}</span>
                        <button onClick={() => setMonthlyImprovements(p => p.filter((_, i) => i !== index))} className="text-zinc-500 hover:text-rose-500">
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="p-4 border-t border-zinc-850 flex justify-end gap-2 bg-zinc-950/40">
                <button onClick={() => setIsMonthlyReviewModalOpen(false)} className="px-4 py-2 bg-zinc-900 text-zinc-300 text-xs font-bold rounded-xl">Cancelar</button>
                <button onClick={handleSaveMonthlyReview} className="px-5 py-2 bg-orange-500 text-white text-xs font-bold rounded-xl flex items-center gap-1.5">
                  <Save className="h-3.5 w-3.5" />
                  <span>{monthlyReviewSavingStatus === 'saving' ? 'Salvando...' : 'Salvar Review'}</span>
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* --- WEEKLY REVIEW DETAILED MODAL --- */}
      <AnimatePresence>
        {isWeeklyReviewModalOpen && selectedWeekNum !== null && (
          <div 
            onClick={() => setIsWeeklyReviewModalOpen(false)}
            className="fixed inset-0 z-50 bg-[#040405]/95 backdrop-blur-md flex items-center justify-center p-4 md:p-6 overflow-hidden cursor-pointer"
          >
            <motion.div
              onClick={(e) => e.stopPropagation()}
              initial={{ scale: 0.95, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 20 }}
              className="cursor-default bg-[#0a0a0c] border border-zinc-800 rounded-3xl w-full max-w-2xl h-full max-h-[80vh] flex flex-col overflow-hidden shadow-2xl text-left"
            >
              <div className="p-5 border-b border-zinc-850 bg-zinc-950/40 flex items-center justify-between">
                <div>
                  <h3 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
                    <CheckSquare className="h-4 w-4 text-orange-500" />
                    Review Semanal - Semana {selectedWeekNum} ({getWeekDateRange(selectedYear, selectedWeekNum)}) / {selectedYear}
                  </h3>
                  <p className="text-[10px] text-zinc-500 mt-0.5">Analise o andamento das suas metas de rotina e rituais semanais.</p>
                </div>
                <button onClick={() => setIsWeeklyReviewModalOpen(false)} className="text-zinc-400 hover:text-white p-1">
                  <X className="h-4.5 w-4.5" />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-5 space-y-4">
                {/* One sentence summary */}
                <div className="space-y-1">
                  <label className="text-[10px] text-zinc-400 font-bold block uppercase tracking-wider">A semana em uma frase:</label>
                  <input
                    type="text"
                    value={weeklyOneSentence}
                    onChange={(e) => setWeeklyOneSentence(e.target.value)}
                    placeholder="Como você definiria esta semana que se passou..."
                    className="w-full bg-zinc-950 border border-zinc-900 rounded-xl p-3 text-xs text-white focus:outline-none focus:border-orange-500/50"
                  />
                </div>

                {/* Week moments */}
                <div className="space-y-2">
                  <label className="text-[10px] text-zinc-400 font-bold block uppercase tracking-wider">Principais Vitórias & Momentos:</label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={newWeekMoment}
                      onChange={(e) => setNewWeekMoment(e.target.value)}
                      placeholder="Adicionar vitória..."
                      className="flex-1 bg-zinc-950 border border-zinc-900 rounded-xl px-3 py-1.5 text-xs text-white"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        if (!newWeekMoment.trim()) return;
                        setWeeklyMemorableMoments(p => [...p, newWeekMoment.trim()]);
                        setNewWeekMoment('');
                      }}
                      className="bg-zinc-900 text-orange-500 border border-zinc-850 rounded-xl px-3 py-1 text-xs font-bold hover:bg-zinc-850"
                    >
                      Adicionar
                    </button>
                  </div>
                  <div className="space-y-1">
                    {weeklyMemorableMoments.map((item, index) => (
                      <div key={index} className="flex items-center justify-between p-2 bg-zinc-950/40 border border-zinc-900 rounded-lg text-xs">
                        <span className="text-zinc-300">• {item}</span>
                        <button onClick={() => setWeeklyMemorableMoments(p => p.filter((_, i) => i !== index))} className="text-zinc-500 hover:text-rose-500">
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Week learnings */}
                <div className="space-y-2">
                  <label className="text-[10px] text-zinc-400 font-bold block uppercase tracking-wider">O que aprendeu de mais relevante:</label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={newWeekLearning}
                      onChange={(e) => setNewWeekLearning(e.target.value)}
                      placeholder="Aprendizados da semana..."
                      className="flex-1 bg-zinc-950 border border-zinc-900 rounded-xl px-3 py-1.5 text-xs text-white"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        if (!newWeekLearning.trim()) return;
                        setWeeklyLearnings(p => [...p, newWeekLearning.trim()]);
                        setNewWeekLearning('');
                      }}
                      className="bg-zinc-900 text-orange-500 border border-zinc-850 rounded-xl px-3 py-1 text-xs font-bold hover:bg-zinc-850"
                    >
                      Adicionar
                    </button>
                  </div>
                  <div className="space-y-1">
                    {weeklyLearnings.map((item, index) => (
                      <div key={index} className="flex items-center justify-between p-2 bg-zinc-950/40 border border-zinc-900 rounded-lg text-xs">
                        <span className="text-zinc-300">• {item}</span>
                        <button onClick={() => setWeeklyLearnings(p => p.filter((_, i) => i !== index))} className="text-zinc-500 hover:text-rose-500">
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Week improvements */}
                <div className="space-y-2">
                  <label className="text-[10px] text-zinc-400 font-bold block uppercase tracking-wider">Ajustes comportamentais para a próxima semana:</label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={newWeekImprovement}
                      onChange={(e) => setNewWeekImprovement(e.target.value)}
                      placeholder="O que ajustar de hábitos..."
                      className="flex-1 bg-zinc-950 border border-zinc-900 rounded-xl px-3 py-1.5 text-xs text-white"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        if (!newWeekImprovement.trim()) return;
                        setWeeklyImprovements(p => [...p, newWeekImprovement.trim()]);
                        setNewWeekImprovement('');
                      }}
                      className="bg-zinc-900 text-orange-500 border border-zinc-850 rounded-xl px-3 py-1 text-xs font-bold hover:bg-zinc-850"
                    >
                      Adicionar
                    </button>
                  </div>
                  <div className="space-y-1">
                    {weeklyImprovements.map((item, index) => (
                      <div key={index} className="flex items-center justify-between p-2 bg-zinc-950/40 border border-zinc-900 rounded-lg text-xs">
                        <span className="text-zinc-300">• {item}</span>
                        <button onClick={() => setWeeklyImprovements(p => p.filter((_, i) => i !== index))} className="text-zinc-500 hover:text-rose-500">
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Week readings */}
                <div className="space-y-2">
                  <label className="text-[10px] text-zinc-400 font-bold block uppercase tracking-wider">Leitura(s) da Semana:</label>
                  <textarea
                    value={weeklyReadings}
                    onChange={(e) => setWeeklyReadings(e.target.value)}
                    onKeyDown={(e) => handleAutoListKeyDown(e, weeklyReadings, setWeeklyReadings)}
                    placeholder="Quais livros, capítulos ou artigos leu essa semana..."
                    className="w-full min-h-[70px] bg-zinc-950 border border-zinc-900 rounded-xl p-3 text-xs text-white focus:outline-none focus:border-orange-500/50 resize-none font-sans leading-relaxed"
                  />
                </div>
              </div>

              <div className="p-4 border-t border-zinc-850 flex justify-end gap-2 bg-zinc-950/40">
                <button onClick={() => setIsWeeklyReviewModalOpen(false)} className="px-4 py-2 bg-zinc-900 text-zinc-300 text-xs font-bold rounded-xl">Cancelar</button>
                <button onClick={handleSaveWeeklyReview} className="px-5 py-2 bg-orange-500 text-white text-xs font-bold rounded-xl flex items-center gap-1.5">
                  <Save className="h-3.5 w-3.5" />
                  <span>{weeklyReviewSavingStatus === 'saving' ? 'Salvando...' : 'Salvar Review'}</span>
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* --- YEARLY BOOK CREATION/EDIT MODAL --- */}
      <AnimatePresence>
        {isBookModalOpen && (
          <div 
            onClick={() => setIsBookModalOpen(false)}
            className="fixed inset-0 z-50 bg-[#040405]/95 backdrop-blur-md flex items-center justify-center p-4 md:p-6 overflow-hidden cursor-pointer"
          >
            <motion.div
              onClick={(e) => e.stopPropagation()}
              initial={{ scale: 0.95, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 20 }}
              className="cursor-default bg-[#0a0a0c] border border-zinc-800 rounded-3xl w-full max-w-md flex flex-col overflow-hidden shadow-2xl text-left"
            >
              <form onSubmit={handleSaveBook}>
                <div className="p-5 border-b border-zinc-850 bg-zinc-950/40 flex items-center justify-between">
                  <h3 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
                    <Book className="h-4 w-4 text-orange-500" />
                    {editingBookId ? 'Editar Livro' : 'Adicionar Livro à Estante'}
                  </h3>
                  <button type="button" onClick={() => setIsBookModalOpen(false)} className="text-zinc-400 hover:text-white">
                    <X className="h-4 w-4" />
                  </button>
                </div>

                <div className="p-5 space-y-4">
                  <div className="space-y-1">
                    <label className="text-[10px] text-zinc-400 font-bold block uppercase">Título do Livro</label>
                    <input
                      type="text"
                      required
                      value={bookTitle}
                      onChange={(e) => setBookTitle(e.target.value)}
                      placeholder="Ex: Hábitos Atômicos"
                      className="w-full bg-zinc-950 border border-zinc-900 rounded-xl p-2.5 text-xs text-white focus:outline-none focus:border-orange-500/50"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] text-zinc-400 font-bold block uppercase">Autor</label>
                    <input
                      type="text"
                      value={bookAuthor}
                      onChange={(e) => setBookAuthor(e.target.value)}
                      placeholder="Ex: James Clear"
                      className="w-full bg-zinc-950 border border-zinc-900 rounded-xl p-2.5 text-xs text-white focus:outline-none focus:border-orange-500/50"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="text-[10px] text-zinc-400 font-bold block uppercase">Total de Páginas</label>
                      <input
                        type="number"
                        min={1}
                        value={bookTotalPages}
                        onChange={(e) => setBookTotalPages(Math.max(1, parseInt(e.target.value, 10) || 1))}
                        className="w-full bg-zinc-950 border border-zinc-900 rounded-xl p-2.5 text-xs text-white focus:outline-none focus:border-orange-500/50 font-mono"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-[10px] text-zinc-400 font-bold block uppercase">Páginas Lidas</label>
                      <input
                        type="number"
                        min={0}
                        max={bookTotalPages}
                        value={bookPagesRead}
                        onChange={(e) => setBookPagesRead(Math.max(0, parseInt(e.target.value, 10) || 0))}
                        className="w-full bg-zinc-950 border border-zinc-900 rounded-xl p-2.5 text-xs text-white focus:outline-none focus:border-orange-500/50 font-mono"
                      />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] text-zinc-400 font-bold block uppercase">Status da Leitura</label>
                    <select
                      value={bookStatus}
                      onChange={(e) => setBookStatus(e.target.value as any)}
                      className="w-full bg-zinc-950 border border-zinc-900 rounded-xl p-2.5 text-xs text-white focus:outline-none cursor-pointer"
                    >
                      <option value="quero_ler">Quero Ler (Fila)</option>
                      <option value="lendo">Lendo Ativamente</option>
                      <option value="lido">Concluído (Lido)</option>
                      <option value="dropado">Pausado / Dropado (Interrompido)</option>
                    </select>
                  </div>

                  {bookStatus === 'lido' && (
                    <div className="space-y-1">
                      <label className="text-[10px] text-zinc-400 font-bold block uppercase">Sua Avaliação (Estrelas)</label>
                      <div className="flex items-center gap-1.5 pt-1">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <button
                            type="button"
                            key={star}
                            onClick={() => setBookRating(star)}
                            className="p-1 hover:scale-110 transition-transform"
                          >
                            <Star
                              className={`h-5 w-5 ${
                                star <= bookRating ? 'text-amber-400 fill-amber-400' : 'text-zinc-700'
                              }`}
                            />
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="space-y-1">
                    <label className="text-[10px] text-zinc-400 font-bold block uppercase">Intervalo de Leitura (dd/mm-dd/mm)</label>
                    <input
                      type="text"
                      value={bookReadingInterval}
                      onChange={(e) => setBookReadingInterval(e.target.value)}
                      placeholder="Ex: 01/05-15/05"
                      className="w-full bg-zinc-950 border border-zinc-900 rounded-xl p-2.5 text-xs text-white focus:outline-none focus:border-orange-500/50 font-mono"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] text-zinc-400 font-bold block uppercase">Resumo / Notas / Mini Review</label>
                    <textarea
                      value={bookReview}
                      onChange={(e) => setBookReview(e.target.value)}
                      onKeyDown={(e) => handleAutoListKeyDown(e, bookReview, setBookReview)}
                      placeholder="Escreva um breve resumo ou notas sobre o livro..."
                      className="w-full h-20 bg-zinc-950 border border-zinc-900 rounded-xl p-2.5 text-xs text-white focus:outline-none resize-none font-sans"
                    />
                  </div>
                </div>

                <div className="p-4 border-t border-zinc-850 flex justify-end gap-2 bg-zinc-950/40">
                  <button type="button" onClick={() => setIsBookModalOpen(false)} className="px-4 py-2 bg-zinc-900 text-zinc-300 text-xs font-bold rounded-xl">Cancelar</button>
                  <button type="submit" className="px-5 py-2 bg-orange-500 text-white text-xs font-bold rounded-xl">Salvar Livro</button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* --- ADD YEAR CENTRAL MODAL --- */}
      <AnimatePresence>
        {isAddingYear && (
          <div 
            onClick={() => setIsAddingYear(false)}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm cursor-pointer"
          >
            <motion.div
              onClick={(e) => e.stopPropagation()}
              initial={{ scale: 0.95, opacity: 0, y: 10 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 10 }}
              transition={{ duration: 0.2 }}
              className="cursor-default w-full max-w-sm bg-zinc-950 border border-zinc-850 rounded-3xl overflow-hidden shadow-2xl shadow-orange-500/5 text-left"
            >
              <div className="p-6 space-y-4">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 bg-orange-500/10 rounded-xl text-orange-400">
                    <Calendar className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="text-sm font-black text-white uppercase tracking-wider">Adicionar Ano</h3>
                    <p className="text-[10px] text-zinc-500">Crie um novo ciclo de planejamento anual.</p>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] text-zinc-400 font-bold uppercase tracking-wider block">Ano de Planejamento:</label>
                  <input
                    type="number"
                    min="1900"
                    max="2100"
                    value={newYearInput}
                    onChange={(e) => setNewYearInput(e.target.value)}
                    placeholder="Ex: 2027"
                    className="w-full bg-zinc-900 border border-zinc-800 rounded-xl p-3 text-sm text-white focus:outline-none focus:border-orange-500/50 font-mono text-center font-bold"
                    autoFocus
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleAddYear();
                      }
                    }}
                  />
                  {addYearError && (
                    <span className="text-[10px] text-rose-500 font-mono block text-center mt-1">{addYearError}</span>
                  )}
                </div>
              </div>

              <div className="px-6 py-4 bg-zinc-900/40 border-t border-zinc-900 flex justify-end gap-2">
                <button
                  onClick={() => {
                    setIsAddingYear(false);
                    setNewYearInput('');
                    setAddYearError('');
                  }}
                  className="px-4 py-2 bg-zinc-900 hover:bg-zinc-850 text-zinc-400 hover:text-white text-xs font-bold rounded-xl border border-zinc-855 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleAddYear}
                  className="px-5 py-2 bg-orange-500 hover:bg-orange-600 text-white text-xs font-black rounded-xl transition-all shadow-md shadow-orange-500/10"
                >
                  Adicionar
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
      {/* Tag Management Modal */}
      <TagManagementModal
        isOpen={isTagModalOpen}
        onClose={() => setIsTagModalOpen(false)}
        allCalendarNotes={notes}
      />
    </div>
  );
}
