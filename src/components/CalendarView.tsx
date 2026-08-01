import React, { useState, useEffect, useRef } from 'react';
import { 
  Calendar, 
  ChevronLeft, 
  ChevronRight, 
  Plus, 
  Trash2, 
  BookOpen, 
  FileText,
  AlertCircle,
  Zap,
  Save,
  X,
  Sparkles,
  Heart,
  Settings,
  Check,
  Compass,
  Sliders,
  CheckCircle,
  ChevronDown,
  ChevronUp,
  Sun,
  Moon,
  Book,
  CalendarDays,
  Clock,
  Tag,
  Table,
  Edit2,
  Search,
  User,
  LogIn,
  LogOut,
  Bell,
  RefreshCw,
  Maximize2,
  MoreHorizontal,
  SlidersHorizontal,
  ArrowUpDown,
  Filter,
  ExternalLink,
  Globe
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { CalendarNote, DailyTask, SubTask, MonthlyReview, BookTracker, BibleTracker, RoutineItem, WeeklyReview, FutureEvent } from '../types';
import { saveGoogleOAuthTokens, clearGoogleOAuthSession, refreshGoogleAccessToken, getValidGoogleAccessToken } from '../utils/googleToken';
// @ts-ignore
import classicalLightEngraving from '../assets/images/classical_light_engraving_1784335041654.jpg';

interface CalendarViewProps {
  notes: CalendarNote[];
  setNotes: React.Dispatch<React.SetStateAction<CalendarNote[]>>;
  addXp: (amount: number) => void;
  dailyTasks: DailyTask[];
  monthlyReviews: MonthlyReview[];
  setMonthlyReviews: React.Dispatch<React.SetStateAction<MonthlyReview[]>>;
  weeklyReviews: WeeklyReview[];
  setWeeklyReviews: React.Dispatch<React.SetStateAction<WeeklyReview[]>>;
  bookTracker?: BookTracker;
  bibleTracker?: BibleTracker;
  routine?: RoutineItem[];
  futureEvents: FutureEvent[];
  setFutureEvents: React.Dispatch<React.SetStateAction<FutureEvent[]>>;
  userName?: string;
  setUserName?: (name: string) => void;
  userPhoto?: string;
  setUserPhoto?: (photo: string) => void;
  userEmail?: string;
  setUserEmail?: (email: string) => void;
  freeEditMode?: boolean;
}

const DEFAULT_GRATITUDE_TEMPLATE = `Sou profundamente grato(a) hoje por:
1. 
2. 
3. `;

const DEFAULT_DECREES_TEMPLATE = `Eu decreto que hoje serei forte, focado(a) e superarei todos os meus desafios com resiliência. Estou em paz e em sintonia com a abundância.`;

const DEFAULT_PRAYER_TEMPLATE = `Senhor, agradeço por mais um dia de vida. Peço sabedoria para guiar minhas ações, proteção para o meu caminho e paz para o meu coração e da minha família. Amém.`;

export default function CalendarView({ 
  notes, 
  setNotes, 
  addXp, 
  dailyTasks,
  monthlyReviews,
  setMonthlyReviews,
  weeklyReviews,
  setWeeklyReviews,
  bookTracker,
  bibleTracker,
  routine,
  futureEvents,
  setFutureEvents,
  userName,
  setUserName,
  userPhoto,
  setUserPhoto,
  userEmail,
  setUserEmail,
  freeEditMode = false
}: CalendarViewProps) {
  const BIBLE_TOTAL_CHAPTERS = 1189;

  // Helper to construct/update a day's checklist incorporating dailyTasks (morning, general, night) 
  // as well as the virtual Leitura and Bíblia tasks.
  const getFullDailyTasks = (): DailyTask[] => {
    const list = [...dailyTasks];
    
    // Add weekly routine tasks for the selected day of the week
    if (selectedDateStr && routine) {
      try {
        const parts = selectedDateStr.split('-');
        const dateObj = new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2]));
        const dayOfWeek = dateObj.getDay(); // 0 = Sunday, 1 = Monday, etc.
        
        const routineTasksForDay = routine
          .filter(item => item.dayOfWeek === dayOfWeek || item.isEveryDay)
          .sort((a, b) => a.time.localeCompare(b.time))
          .map(item => ({
            id: `routine-${item.id}`,
            text: `[Rotina às ${item.time}] ${item.task}`,
            completed: false,
            xpReward: 10,
            category: 'Rotina Semanal'
          }));
          
        list.push(...routineTasksForDay);
      } catch (err) {
        console.error("Error mapping routine to daily tasks", err);
      }
    }
    
    // Add Leitura task if bookTracker is configured
    if (bookTracker && bookTracker.bookName) {
      const total = bookTracker.totalPages || 250;
      const read = bookTracker.pagesRead || 0;
      const remainingPages = Math.max(0, total - read);
      if (remainingPages > 0) {
        // Calculate daily target
        let daysElapsed = 0;
        if (bookTracker.startedDate) {
          const start = new Date(bookTracker.startedDate);
          const today = new Date();
          start.setHours(0, 0, 0, 0);
          today.setHours(0, 0, 0, 0);
          const diffTime = today.getTime() - start.getTime();
          daysElapsed = Math.max(0, Math.floor(diffTime / (1000 * 60 * 60 * 24)));
        }
        const deadline = bookTracker.deadlineDays || 7;
        const remainingDays = Math.max(1, deadline - daysElapsed);
        const dailyTarget = Math.ceil(remainingPages / remainingDays);

        list.push({
          id: 'task-leitura',
          text: `Ler ${dailyTarget} pág. do livro: ${bookTracker.bookName}`,
          completed: false,
          xpReward: 25,
          category: 'Leitura',
          isRecurring: true,
          period: 'geral'
        });
      }
    }

    // Add Bíblia task if bibleTracker is configured
    if (bibleTracker) {
      const vezes = bibleTracker.vezesNoAno || 1;
      const jaLidos = bibleTracker.capitulosJaLidos || 0;
      const totalToRead = BIBLE_TOTAL_CHAPTERS * vezes;
      const remainingChapters = Math.max(0, totalToRead - jaLidos);
      if (remainingChapters > 0) {
        // Calculate adapted target based on remaining days of the year
        const today = new Date();
        const endOfYear = new Date(today.getFullYear(), 11, 31);
        const diffTime = Math.max(0, endOfYear.getTime() - today.getTime());
        const daysRemainingInYear = Math.max(1, Math.ceil(diffTime / (1000 * 60 * 60 * 24)));
        const adaptedDailyTarget = Math.max(1, Math.ceil(remainingChapters / daysRemainingInYear));

        list.push({
          id: 'task-biblia',
          text: `Ler ${adaptedDailyTarget} cap. da Bíblia Sagrada`,
          completed: false,
          xpReward: 25,
          category: 'Espiritualidade',
          isRecurring: true,
          period: 'geral'
        });
      }
    }

    return list;
  };

  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDateStr, setSelectedDateStr] = useState<string | null>(() => {
    return localStorage.getItem('calendar_selected_date_str') || null;
  });

  useEffect(() => {
    if (selectedDateStr) {
      localStorage.setItem('calendar_selected_date_str', selectedDateStr);
    } else {
      localStorage.removeItem('calendar_selected_date_str');
    }
  }, [selectedDateStr]);
  
  // --- States and Actions for 'O que vem por aí' (Future Events) ---
  const [upcomingView, setUpcomingView] = useState<'table' | 'calendar'>('table');
  const [newEventName, setNewEventName] = useState('');
  const [newEventDate, setNewEventDate] = useState('');
  const [newEventTag, setNewEventTag] = useState('Viagem');
  
  const [editingEventId, setEditingEventId] = useState<string | null>(null);
  const [editEventName, setEditEventName] = useState('');
  const [editEventDate, setEditEventDate] = useState('');
  const [editEventTag, setEditEventTag] = useState('');

  const [openModalEvent, setOpenModalEvent] = useState<FutureEvent | null>(null);
  const [openModalNotes, setOpenModalNotes] = useState('');
  const [isSyncingGoogle5, setIsSyncingGoogle5] = useState(false);
  const [filterTagUpcoming, setFilterTagUpcoming] = useState('Todas');
  const [searchQueryUpcoming, setSearchQueryUpcoming] = useState('');

  const TAG_OPTIONS = [
    'ANIVERSÁRIO', 
    'GAME', 
    'NATAL', 
    'AGENDA GOOGLE', 
    'Viagem', 
    'Trabalho', 
    'Estudos', 
    'Pessoal', 
    'Importante', 
    'Lazer', 
    'Espiritual', 
    'Família'
  ];

  const getTagColor = (tag: string) => {
    switch (tag?.toUpperCase()) {
      case 'ANIVERSÁRIO':
        return 'bg-[#153e2b] text-[#4ade80] border border-[#166534] font-semibold';
      case 'GAME':
      case 'JOGOS':
        return 'bg-[#3b1764] text-[#c084fc] border border-[#6b21a8] font-semibold';
      case 'NATAL':
      case 'FESTA':
        return 'bg-[#4c0519] text-[#fb7185] border border-[#9f1239] font-semibold';
      case 'AGENDA GOOGLE':
      case 'GOOGLE AGENDA':
      case 'GOOGLE':
        return 'bg-[#431407] text-[#fb923c] border border-[#9a3412] font-semibold';
      case 'VIAGEM':
        return 'bg-[#1e3a8a] text-[#60a5fa] border border-[#1d4ed8] font-semibold';
      case 'TRABALHO':
        return 'bg-[#451a03] text-[#f87171] border border-[#78350f] font-semibold';
      case 'ESTUDOS':
        return 'bg-[#31104b] text-[#e879f9] border border-[#701a75] font-semibold';
      case 'PESSOAL':
        return 'bg-[#134e4a] text-[#2dd4bf] border border-[#0f766e] font-semibold';
      case 'IMPORTANTE':
        return 'bg-[#7f1d1d] text-[#fca5a5] border border-[#b91c1c] font-semibold';
      default:
        return 'bg-[#18181b] text-[#a1a1aa] border border-[#27272a] font-semibold';
    }
  };

  const formatEventDateLong = (dateStr: string) => {
    if (!dateStr) return '';
    try {
      const parts = dateStr.split('-');
      if (parts.length === 3) {
        const year = parseInt(parts[0], 10);
        const month = parseInt(parts[1], 10) - 1;
        const day = parseInt(parts[2], 10);
        const d = new Date(year, month, day);
        return d.toLocaleDateString('pt-BR', { day: 'numeric', month: 'long', year: 'numeric' });
      }
      return dateStr;
    } catch {
      return dateStr;
    }
  };

  const handleSyncNext5GoogleEvents = async () => {
    let tok = await getValidGoogleAccessToken();
    if (!tok) {
      await handleGoogleLogin();
      return;
    }
    setGoogleToken(tok);

    setIsSyncingGoogle5(true);
    try {
      const todayStr = getTodayDateStr();
      const timeMin = new Date().toISOString();
      let response = await fetch(`/api/calendar/events?timeMin=${encodeURIComponent(timeMin)}`, {
        headers: { Authorization: `Bearer ${tok}` }
      });

      if (!response.ok && response.status === 401) {
        const newToken = await refreshGoogleAccessToken();
        if (newToken) {
          tok = newToken;
          setGoogleToken(newToken);
          response = await fetch(`/api/calendar/events?timeMin=${encodeURIComponent(timeMin)}`, {
            headers: { Authorization: `Bearer ${newToken}` }
          });
        }
      }

      if (!response.ok) {
        throw new Error('Não foi possível buscar eventos do Google Agenda.');
      }

      const data = await response.json();
      const items: any[] = data.items || [];
      
      const upcoming = items
        .filter(ev => {
          const evDate = ev.start?.date || (ev.start?.dateTime ? ev.start.dateTime.slice(0, 10) : '');
          return evDate >= todayStr;
        })
        .sort((a, b) => {
          const dateA = a.start?.date || a.start?.dateTime || '';
          const dateB = b.start?.date || b.start?.dateTime || '';
          return dateA.localeCompare(dateB);
        })
        .slice(0, 5);

      if (upcoming.length === 0) {
        alert('Nenhum evento futuro próximo encontrado no seu Google Agenda.');
        return;
      }

      const convertedEvents: FutureEvent[] = upcoming.map(ev => ({
        id: 'gcal-' + (ev.id || Math.random().toString(36).substring(2, 9)),
        name: ev.summary || 'Evento Google Agenda',
        date: ev.start?.date || (ev.start?.dateTime ? ev.start.dateTime.slice(0, 10) : todayStr),
        tags: ['AGENDA GOOGLE']
      }));

      setFutureEvents(prev => {
        const updated = [...prev];
        convertedEvents.forEach(cEv => {
          const existingIdx = updated.findIndex(e => e.name === cEv.name && e.date === cEv.date);
          if (existingIdx >= 0) {
            updated[existingIdx] = cEv;
          } else {
            updated.push(cEv);
          }
        });
        return updated.sort((a, b) => a.date.localeCompare(b.date));
      });

      addXp(20);
      alert(`${upcoming.length} próximos eventos do Google Agenda importados com sucesso!`);
    } catch (err: any) {
      console.error(err);
      alert(err.message || 'Erro ao sincronizar eventos do Google Agenda.');
    } finally {
      setIsSyncingGoogle5(false);
    }
  };

  const handleAddFutureEvent = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!newEventName.trim() || !newEventDate) return;

    const newEvent: FutureEvent = {
      id: 'fe-' + Math.random().toString(36).substring(2, 9),
      name: newEventName.trim(),
      date: newEventDate,
      tags: [newEventTag]
    };

    setFutureEvents(prev => [...prev, newEvent].sort((a, b) => a.date.localeCompare(b.date)));
    setNewEventName('');
    setNewEventDate('');
    addXp(15);
  };

  const handleDeleteFutureEvent = (id: string) => {
    setFutureEvents(prev => prev.filter(ev => ev.id !== id));
    addXp(-5);
  };

  const handleStartEditEvent = (ev: FutureEvent) => {
    setEditingEventId(ev.id);
    setEditEventName(ev.name);
    setEditEventDate(ev.date);
    setEditEventTag(ev.tags[0] || 'Viagem');
  };

  const handleSaveEditEvent = (id: string) => {
    if (!editEventName.trim() || !editEventDate) return;
    setFutureEvents(prev => prev.map(ev => {
      if (ev.id === id) {
        return {
          ...ev,
          name: editEventName.trim(),
          date: editEventDate,
          tags: [editEventTag]
        };
      }
      return ev;
    }).sort((a, b) => a.date.localeCompare(b.date)));
    setEditingEventId(null);
    addXp(5);
  };
  
  const [viewMode, setViewMode] = useState<'grid' | 'weekly'>('grid');
  const [dayChecklist, setDayChecklist] = useState<DailyTask[]>([]);
  const [expandedDayTasks, setExpandedDayTasks] = useState<Record<string, boolean>>({});
  const [newDayTaskText, setNewDayTaskText] = useState('');
  
  // Reference for the side panel container to allow smooth scrolling
  const panelRef = React.useRef<HTMLDivElement>(null);
  
  // Topic Tabs for Active Day Note
  const [activeTopic, setActiveTopic] = useState<'diario' | 'checklist' | 'espiritualidade' | 'alteregos' | 'saude' | 'agenda'>('diario');
  const [activeSubtopic, setActiveSubtopic] = useState<'gratidao' | 'decretos' | 'oracao'>('gratidao');
  
  // Master Templates configuration
  const [isEditingTemplates, setIsEditingTemplates] = useState(false);
  const [tempTemplateGratitude, setTempTemplateGratitude] = useState('');
  const [tempTemplateDecrees, setTempTemplateDecrees] = useState('');
  const [tempTemplatePrayer, setTempTemplatePrayer] = useState('');

  // Loaded Master Templates
  const [templateGratitude, setTemplateGratitude] = useState(() => {
    return localStorage.getItem('planner_template_gratitude') || DEFAULT_GRATITUDE_TEMPLATE;
  });
  const [templateDecrees, setTemplateDecrees] = useState(() => {
    return localStorage.getItem('planner_template_decretos') || DEFAULT_DECREES_TEMPLATE;
  });
  const [templatePrayer, setTemplatePrayer] = useState(() => {
    return localStorage.getItem('planner_template_oracao') || DEFAULT_PRAYER_TEMPLATE;
  });

  // Local state for selected day's text inputs to avoid rendering lags
  const [journalText, setJournalText] = useState('');
  const [gratitudeText, setGratitudeText] = useState('');
  const [decreesText, setDecreesText] = useState('');
  const [prayerText, setPrayerText] = useState('');
  const [noteReminderTime, setNoteReminderTime] = useState('');
  const [alterEgoWinner, setAlterEgoWinner] = useState<'Alfredo' | 'Beto' | null>(null);
  const [alterEgoText, setAlterEgoText] = useState('');
  const [sleepBedTime, setSleepBedTime] = useState('');
  const [sleepWakeTime, setSleepWakeTime] = useState('');
  const [foodMorning, setFoodMorning] = useState('');
  const [foodAfternoon, setFoodAfternoon] = useState('');
  const [foodNight, setFoodNight] = useState('');
  const [waterLiters, setWaterLiters] = useState<number>(0);

  // Track loaded date to prevent state re-initialization during real-time typing
  const loadedDateRef = useRef<string | null>(null);
  const [savingStatus, setSavingStatus] = useState<'idle' | 'saving' | 'saved'>('idle');

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

  // --- Google Calendar and OAuth Login Integration ---
  const [googleUser, setGoogleUser] = useState<{ name: string; email: string; picture: string } | null>(() => {
    const saved = localStorage.getItem('google_calendar_user');
    return saved ? JSON.parse(saved) : null;
  });
  const [googleToken, setGoogleToken] = useState<string | null>(() => {
    return localStorage.getItem('google_calendar_token');
  });
  const [googleEvents, setGoogleEvents] = useState<any[]>([]);
  const [isLoadingEvents, setIsLoadingEvents] = useState(false);
  const [googleError, setGoogleError] = useState<string | null>(null);
  const [isProfileDropdownOpen, setIsProfileDropdownOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearchOpen, setIsSearchOpen] = useState(false);

  // Google Event form states
  const [isAddingGoogleEvent, setIsAddingGoogleEvent] = useState(false);
  const [editingGoogleEventId, setEditingGoogleEventId] = useState<string | null>(null);
  const [googleEventTitle, setGoogleEventTitle] = useState('');
  const [googleEventDescription, setGoogleEventDescription] = useState('');
  const [googleEventAllDay, setGoogleEventAllDay] = useState(false);
  const [googleEventStartTime, setGoogleEventStartTime] = useState('09:00');
  const [googleEventEndTime, setGoogleEventEndTime] = useState('10:00');

  const getNextDayStr = (dateStr: string) => {
    const d = new Date(dateStr + 'T12:00:00');
    d.setDate(d.getDate() + 1);
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  };

  const handleStartEditGoogleEvent = (event: any) => {
    setEditingGoogleEventId(event.id);
    setGoogleEventTitle(event.summary || '');
    setGoogleEventDescription(event.description || '');
    
    if (event.start?.date) {
      setGoogleEventAllDay(true);
      setGoogleEventStartTime('09:00');
      setGoogleEventEndTime('10:00');
    } else if (event.start?.dateTime) {
      setGoogleEventAllDay(false);
      const startParts = event.start.dateTime.split('T');
      if (startParts[1]) {
        setGoogleEventStartTime(startParts[1].substring(0, 5));
      }
      const endParts = event.end?.dateTime?.split('T') || [];
      if (endParts[1]) {
        setGoogleEventEndTime(endParts[1].substring(0, 5));
      }
    }
    setIsAddingGoogleEvent(false);
  };

  const handleAddGoogleEvent = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    let tok = await getValidGoogleAccessToken();
    if (!tok) return;
    setGoogleToken(tok);
    if (!googleEventTitle.trim() || !selectedDateStr) return;

    setIsLoadingEvents(true);
    try {
      const userTimeZone = Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC';
      const body: any = {
        summary: googleEventTitle.trim(),
        description: googleEventDescription.trim(),
      };

      if (googleEventAllDay) {
        body.start = { date: selectedDateStr };
        body.end = { date: getNextDayStr(selectedDateStr) };
      } else {
        body.start = { dateTime: `${selectedDateStr}T${googleEventStartTime}:00`, timeZone: userTimeZone };
        body.end = { dateTime: `${selectedDateStr}T${googleEventEndTime}:00`, timeZone: userTimeZone };
      }

      let response = await fetch('/api/calendar/events', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${tok}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(body)
      });

      if (!response.ok && response.status === 401) {
        const newToken = await refreshGoogleAccessToken();
        if (newToken) {
          tok = newToken;
          setGoogleToken(newToken);
          response = await fetch('/api/calendar/events', {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${newToken}`,
              'Content-Type': 'application/json'
            },
            body: JSON.stringify(body)
          });
        }
      }

      if (!response.ok) {
        throw new Error('Falha ao criar evento no Google Agenda');
      }

      setIsAddingGoogleEvent(false);
      setGoogleEventTitle('');
      setGoogleEventDescription('');
      setGoogleEventAllDay(false);
      setGoogleEventStartTime('09:00');
      setGoogleEventEndTime('10:00');
      addXp(15);
      
      await fetchGoogleEvents(tok);
    } catch (err: any) {
      console.error(err);
      alert(err.message || 'Erro ao criar evento');
    } finally {
      setIsLoadingEvents(false);
    }
  };

  const handleUpdateGoogleEvent = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    let tok = await getValidGoogleAccessToken();
    if (!tok) return;
    setGoogleToken(tok);
    if (!editingGoogleEventId || !googleEventTitle.trim() || !selectedDateStr) return;

    setIsLoadingEvents(true);
    try {
      const userTimeZone = Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC';
      const body: any = {
        summary: googleEventTitle.trim(),
        description: googleEventDescription.trim(),
      };

      if (googleEventAllDay) {
        body.start = { date: selectedDateStr };
        body.end = { date: getNextDayStr(selectedDateStr) };
      } else {
        body.start = { dateTime: `${selectedDateStr}T${googleEventStartTime}:00`, timeZone: userTimeZone };
        body.end = { dateTime: `${selectedDateStr}T${googleEventEndTime}:00`, timeZone: userTimeZone };
      }

      let response = await fetch(`/api/calendar/events/${editingGoogleEventId}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${tok}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(body)
      });

      if (!response.ok && response.status === 401) {
        const newToken = await refreshGoogleAccessToken();
        if (newToken) {
          tok = newToken;
          setGoogleToken(newToken);
          response = await fetch(`/api/calendar/events/${editingGoogleEventId}`, {
            method: 'PUT',
            headers: {
              'Authorization': `Bearer ${newToken}`,
              'Content-Type': 'application/json'
            },
            body: JSON.stringify(body)
          });
        }
      }

      if (!response.ok) {
        throw new Error('Falha ao atualizar evento no Google Agenda');
      }

      setEditingGoogleEventId(null);
      setGoogleEventTitle('');
      setGoogleEventDescription('');
      setGoogleEventAllDay(false);
      setGoogleEventStartTime('09:00');
      setGoogleEventEndTime('10:00');
      addXp(10);
      
      await fetchGoogleEvents(tok);
    } catch (err: any) {
      console.error(err);
      alert(err.message || 'Erro ao atualizar evento');
    } finally {
      setIsLoadingEvents(false);
    }
  };

  const handleDeleteGoogleEvent = async (eventId: string) => {
    let tok = await getValidGoogleAccessToken();
    if (!tok) return;
    setGoogleToken(tok);
    if (!confirm('Deseja realmente excluir este evento do seu Google Agenda?')) return;

    setIsLoadingEvents(true);
    try {
      let response = await fetch(`/api/calendar/events/${eventId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${tok}`
        }
      });

      if (!response.ok && response.status === 401) {
        const newToken = await refreshGoogleAccessToken();
        if (newToken) {
          tok = newToken;
          setGoogleToken(newToken);
          response = await fetch(`/api/calendar/events/${eventId}`, {
            method: 'DELETE',
            headers: {
              'Authorization': `Bearer ${newToken}`
            }
          });
        }
      }

      if (!response.ok) {
        throw new Error('Falha ao excluir evento no Google Agenda');
      }

      addXp(5);
      await fetchGoogleEvents(tok);
    } catch (err: any) {
      console.error(err);
      alert(err.message || 'Erro ao excluir evento');
    } finally {
      setIsLoadingEvents(false);
    }
  };

  const fetchGoogleEvents = async (tokenToUse?: string) => {
    let tok = tokenToUse || (await getValidGoogleAccessToken());
    if (!tok) return;
    setGoogleToken(tok);

    setIsLoadingEvents(true);
    setGoogleError(null);
    try {
      const startOfView = new Date(year, month, -10);
      const endOfView = new Date(year, month + 1, 10);
      const timeMin = startOfView.toISOString();
      const timeMax = endOfView.toISOString();

      let response = await fetch(`/api/calendar/events?timeMin=${encodeURIComponent(timeMin)}&timeMax=${encodeURIComponent(timeMax)}`, {
        headers: {
          'Authorization': `Bearer ${tok}`
        }
      });

      if (!response.ok && response.status === 401) {
        const newToken = await refreshGoogleAccessToken();
        if (newToken) {
          tok = newToken;
          setGoogleToken(newToken);
          response = await fetch(`/api/calendar/events?timeMin=${encodeURIComponent(timeMin)}&timeMax=${encodeURIComponent(timeMax)}`, {
            headers: {
              'Authorization': `Bearer ${newToken}`
            }
          });
        }
      }

      if (!response.ok) {
        let detailedError = '';
        try {
          const text = await response.text();
          try {
            const errJson = JSON.parse(text);
            detailedError = errJson.error || text;
          } catch {
            detailedError = text;
          }
        } catch {
          detailedError = `Erro ${response.status} ao carregar resposta do servidor`;
        }
        throw new Error(detailedError || `Erro ${response.status} ao buscar eventos`);
      }

      const data = await response.json();
      if (data.items) {
        setGoogleEvents(data.items);
      } else {
        setGoogleEvents([]);
      }
    } catch (err: any) {
      console.error('Error fetching Google events:', err);
      setGoogleError(err.message || 'Falha ao buscar eventos do Google Agenda');
    } finally {
      setIsLoadingEvents(false);
    }
  };

  useEffect(() => {
    if (googleToken) {
      fetchGoogleEvents();
    }
  }, [currentDate, googleToken, viewMode]);

  const handleGoogleLogin = async () => {
    try {
      const redirectUri = `${window.location.origin}/auth/callback`;
      const response = await fetch(`/api/auth/google/url?redirect_uri=${encodeURIComponent(redirectUri)}&scope=calendar`);
      if (!response.ok) {
        const errText = await response.json();
        alert(errText.error || 'Erro ao gerar URL de autenticação.');
        return;
      }
      const { url } = await response.json();

      const width = 500;
      const height = 650;
      const left = window.screen.width / 2 - width / 2;
      const top = window.screen.height / 2 - height / 2;

      const authWindow = window.open(
        url,
        'google_oauth_popup',
        `width=${width},height=${height},top=${top},left=${left}`
      );

      if (!authWindow) {
        alert('Por favor, permita popups para este site para conectar o Google Agenda.');
      }
    } catch (err) {
      console.error('Error opening Google OAuth:', err);
    }
  };

  const handleGoogleLogout = () => {
    clearGoogleOAuthSession();
    setGoogleUser(null);
    setGoogleToken(null);
    setGoogleEvents([]);
    setGoogleError(null);
    setIsProfileDropdownOpen(false);
  };

  // Restore or refresh session on mount
  useEffect(() => {
    const restoreSession = async () => {
      const savedUser = localStorage.getItem('google_calendar_user');
      const savedRefreshToken = localStorage.getItem('google_calendar_refresh_token');
      if (savedUser || savedRefreshToken) {
        const validTok = await getValidGoogleAccessToken();
        if (validTok) {
          setGoogleToken(validTok);
          fetchGoogleEvents(validTok);
        }
      }
    };
    restoreSession();
  }, []);

  useEffect(() => {
    const handleOAuthMessage = (event: MessageEvent) => {
      const origin = event.origin;
      if (!origin.endsWith('.run.app') && !origin.includes('localhost')) {
        return;
      }

      if (event.data?.type === 'GOOGLE_OAUTH_SUCCESS') {
        const { tokens, profile } = event.data;
        if (tokens?.access_token) {
          saveGoogleOAuthTokens(tokens, profile);

          if (profile) {
            // Auto-fill logic
            const defaultName = 'Nando';
            const defaultEmail = 'etanomicosl5@gmail.com';
            const defaultPhoto = 'https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?q=80&w=100';

            if (setUserName && (!userName || userName.trim() === '' || userName === defaultName)) {
              setUserName(profile.name);
              localStorage.setItem('mbc_userName', profile.name);
            }
            if (setUserEmail && (!userEmail || userEmail.trim() === '' || userEmail === defaultEmail)) {
              setUserEmail(profile.email);
              localStorage.setItem('mbc_userEmail', profile.email);
            }
            if (setUserPhoto && (!userPhoto || userPhoto.trim() === '' || userPhoto === defaultPhoto)) {
              setUserPhoto(profile.picture);
              localStorage.setItem('mbc_userPhoto', profile.picture);
            }
          }
          setGoogleToken(tokens.access_token);
          setGoogleUser(profile);
          // Wait a brief moment to ensure state is committed
          setTimeout(() => {
            fetchGoogleEvents(tokens.access_token);
          }, 100);
        }
      } else if (event.data?.type === 'GOOGLE_OAUTH_FAILURE') {
        alert('Falha na autenticação do Google: ' + event.data.error);
      }
    };

    window.addEventListener('message', handleOAuthMessage);
    return () => window.removeEventListener('message', handleOAuthMessage);
  }, [userName, userEmail, userPhoto, setUserName, setUserEmail, setUserPhoto]);

  useEffect(() => {
    const handleStorageChange = () => {
      const savedToken = localStorage.getItem('google_calendar_token');
      const savedUser = localStorage.getItem('google_calendar_user');
      if (savedToken && savedToken !== googleToken) {
        setGoogleToken(savedToken);
        fetchGoogleEvents(savedToken);
      }
      if (savedUser) {
        try {
          const parsed = JSON.parse(savedUser);
          setGoogleUser(parsed);
        } catch (e) {}
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, [googleToken]);

  const getEventsForDay = (dateStr: string) => {
    let dayEvents = googleEvents.filter(event => {
      if (!event.start) return false;
      if (event.start.date) {
        return event.start.date === dateStr;
      }
      if (event.start.dateTime) {
        const evDate = event.start.dateTime.substring(0, 10);
        return evDate === dateStr;
      }
      return false;
    });

    if (searchQuery.trim()) {
      dayEvents = dayEvents.filter(e => 
        (e.summary || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
        (e.description || '').toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    const localEvents = futureEvents.filter(ev => {
      const matchesDate = ev.date === dateStr;
      if (!matchesDate) return false;
      if (searchQuery.trim()) {
        return ev.name.toLowerCase().includes(searchQuery.toLowerCase());
      }
      return true;
    });

    const combined = [
      ...dayEvents.map(e => ({
        id: e.id,
        name: e.summary || 'Sem Título',
        isGoogle: true,
        tag: 'Google',
        description: e.description || '',
        rawGoogleEvent: e
      })),
      ...localEvents.map(e => ({
        id: e.id,
        name: e.name,
        isGoogle: false,
        tag: e.tags[0] || 'Geral',
        description: ''
      }))
    ];

    return combined;
  };

  const getEventColor = (name: string, isGoogle: boolean) => {
    const lower = name.toLowerCase();
    if (lower.includes('aniversário') || lower.includes('niver') || lower.includes('mês-versario')) {
      return 'bg-[#7c3aed] text-white hover:bg-[#6d28d9]'; 
    }
    if (lower.includes('férias') || lower.includes('folga') || lower.includes('vacation')) {
      return 'bg-[#0284c7] text-white hover:bg-[#0369a1]'; 
    }
    if (lower.includes('feriado') || lower.includes('natal') || lower.includes('ano novo') || lower.includes('independência')) {
      return 'bg-[#e11d48] text-white hover:bg-[#be123c]'; 
    }
    if (isGoogle) {
      return 'bg-[#2563eb] text-white hover:bg-[#1d4ed8]'; 
    }
    const colors = [
      'bg-[#059669] text-white hover:bg-[#047857]', 
      'bg-[#d97706] text-white hover:bg-[#b45309]', 
      'bg-[#4f46e5] text-white hover:bg-[#4338ca]', 
      'bg-[#0891b2] text-white hover:bg-[#0e7490]', 
    ];
    let hash = 0;
    for (let i = 0; i < name.length; i++) {
      hash = name.charCodeAt(i) + ((hash << 5) - hash);
    }
    const index = Math.abs(hash) % colors.length;
    return colors[index];
  };

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

  // Helper to get week number
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
    setReviewWeekYear(year);
    // Find the week number for the current month/year date
    const d = new Date(year, month, 15); // midpoint of currently viewed month
    setReviewWeekNumber(getWeekNumber(d));
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
    setReviewYear(year);
    setReviewMonth(month);
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

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const months = [
    'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
    'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
  ];

  const daysOfWeek = ['dom.', 'seg.', 'ter.', 'qua.', 'qui.', 'sex.', 'sáb.'];

  // Helper date generators
  const getTodayDateStr = () => {
    const d = new Date();
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
  };

  const getTomorrowDateStr = () => {
    const d = new Date();
    d.setDate(d.getDate() + 1);
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
  };

  const formatShortDate = (dateStr: string) => {
    const parts = dateStr.split('-');
    if (parts.length === 3) {
      return `${parts[2]}/${parts[1]}`;
    }
    return dateStr;
  };

  const formatLongDate = (dateStr: string) => {
    try {
      const parts = dateStr.split('-');
      const d = new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2]));
      return d.toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
    } catch {
      return dateStr;
    }
  };

  // Find record for current selected day
  const activeRecord = notes.find(n => n.date === selectedDateStr);

  // Sync inputs when selectedDateStr changes or when first loading
  useEffect(() => {
    // Avoid re-initialization if data for selectedDateStr is already loaded into local input states
    if (loadedDateRef.current === selectedDateStr && activeRecord) {
      return;
    }

    loadedDateRef.current = selectedDateStr;

    if (activeRecord && activeRecord.isDailyRecord) {
      setJournalText(activeRecord.journalText || '');
      setGratitudeText(
        activeRecord.gratitudeText && 
        activeRecord.gratitudeText.trim() && 
        activeRecord.gratitudeText !== DEFAULT_GRATITUDE_TEMPLATE 
          ? activeRecord.gratitudeText 
          : templateGratitude
      );
      setDecreesText(
        activeRecord.decreesText && 
        activeRecord.decreesText.trim() && 
        activeRecord.decreesText !== DEFAULT_DECREES_TEMPLATE 
          ? activeRecord.decreesText 
          : templateDecrees
      );
      setPrayerText(
        activeRecord.prayerText && 
        activeRecord.prayerText.trim() && 
        activeRecord.prayerText !== DEFAULT_PRAYER_TEMPLATE 
          ? activeRecord.prayerText 
          : templatePrayer
      );
      
      setSleepBedTime(activeRecord.sleepBedTime || '');
      setSleepWakeTime(activeRecord.sleepWakeTime || '');
      setFoodMorning(activeRecord.foodMorning || '');
      setFoodAfternoon(activeRecord.foodAfternoon || '');
      setFoodNight(activeRecord.foodNight || '');
      setWaterLiters(activeRecord.waterLiters ?? 0);
      setNoteReminderTime(activeRecord.reminderTime || '');
      
      const fullTasks = getFullDailyTasks();
      let initialChecklist = [];
      
      if (!activeRecord.checklist) {
        initialChecklist = fullTasks.map(t => ({ ...t, completed: false }));
      } else {
        // Map over fullTasks, keeping completion state of existing tasks
        const mergedBaseTasks = fullTasks.map(ft => {
          const existing = activeRecord.checklist!.find(t => t.id === ft.id);
          if (existing) {
            return {
              ...ft,
              completed: existing.completed,
              subtasks: existing.subtasks
            };
          }
          return { ...ft, completed: false };
        });
        
        // Keep any custom tasks created for this day in CalendarView (which won't be in fullTasks)
        const fullTaskIds = new Set(fullTasks.map(t => t.id));
        const customTasks = activeRecord.checklist.filter(t => !fullTaskIds.has(t.id));
        
        initialChecklist = [...mergedBaseTasks, ...customTasks];
      }
      setDayChecklist(initialChecklist);
      setAlterEgoWinner(activeRecord.alterEgoWinner || null);
      setAlterEgoText(activeRecord.alterEgoText || '');
      setSavingStatus('idle');
    } else {
      // If no daily record exists yet, the Personal Diary is kept completely blank (manual input)
      // while spirituality options are pre-loaded with current Master Templates as a starting point.
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
      
      const fullTasks = getFullDailyTasks();
      setDayChecklist(fullTasks.map(t => ({ ...t, completed: false })));
      setAlterEgoWinner(null);
      setAlterEgoText('');
      setSavingStatus('idle');
    }
  }, [selectedDateStr, activeRecord?.id, templateGratitude, templateDecrees, templatePrayer]);

  // Handle Master Templates state editing initiation
  const handleOpenTemplateSettings = () => {
    setTempTemplateGratitude(templateGratitude);
    setTempTemplateDecrees(templateDecrees);
    setTempTemplatePrayer(templatePrayer);
    setIsEditingTemplates(true);
    
    // Smoothly scroll the template editor panel into view (extremely useful on smaller screen viewports)
    setTimeout(() => {
      panelRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }, 100);
  };

  const handleSaveMasterTemplates = () => {
    localStorage.setItem('planner_template_gratitude', tempTemplateGratitude);
    localStorage.setItem('planner_template_decretos', tempTemplateDecrees);
    localStorage.setItem('planner_template_oracao', tempTemplatePrayer);
    
    // Proactively update active day's text states if they were blank or matched old templates
    let nextGratitude = gratitudeText;
    let nextDecrees = decreesText;
    let nextPrayer = prayerText;

    if (gratitudeText === templateGratitude || gratitudeText === DEFAULT_GRATITUDE_TEMPLATE || !gratitudeText.trim()) {
      nextGratitude = tempTemplateGratitude;
      setGratitudeText(tempTemplateGratitude);
    }
    if (decreesText === templateDecrees || decreesText === DEFAULT_DECREES_TEMPLATE || !decreesText.trim()) {
      nextDecrees = tempTemplateDecrees;
      setDecreesText(tempTemplateDecrees);
    }
    if (prayerText === templatePrayer || prayerText === DEFAULT_PRAYER_TEMPLATE || !prayerText.trim()) {
      nextPrayer = tempTemplatePrayer;
      setPrayerText(tempTemplatePrayer);
    }

    setTemplateGratitude(tempTemplateGratitude);
    setTemplateDecrees(tempTemplateDecrees);
    setTemplatePrayer(tempTemplatePrayer);
    setIsEditingTemplates(false);
    addXp(15);

    // Apply and persist to all notes (automatically applying configured templates where default or blank)
    setNotes(prev => {
      const updated = prev.map(n => {
        if (n.isDailyRecord) {
          const g = (!n.gratitudeText || n.gratitudeText.trim() === '' || n.gratitudeText === templateGratitude || n.gratitudeText === DEFAULT_GRATITUDE_TEMPLATE) ? tempTemplateGratitude : n.gratitudeText;
          const d = (!n.decreesText || n.decreesText.trim() === '' || n.decreesText === templateDecrees || n.decreesText === DEFAULT_DECREES_TEMPLATE) ? tempTemplateDecrees : n.decreesText;
          const p = (!n.prayerText || n.prayerText.trim() === '' || n.prayerText === templatePrayer || n.prayerText === DEFAULT_PRAYER_TEMPLATE) ? tempTemplatePrayer : n.prayerText;
          return {
            ...n,
            gratitudeText: g,
            decreesText: d,
            prayerText: p
          };
        }
        return n;
      });

      if (selectedDateStr) {
        const idx = updated.findIndex(n => n.date === selectedDateStr);
        if (idx === -1) {
          const newRecord: CalendarNote = {
            id: 'rec-' + Math.random().toString(36).substring(2, 9),
            date: selectedDateStr,
            title: 'Registro de ' + formatShortDate(selectedDateStr),
            content: 'Diário, Checklist & Fé',
            isDailyRecord: true,
            journalText: '',
            gratitudeText: tempTemplateGratitude,
            decreesText: tempTemplateDecrees,
            prayerText: tempTemplatePrayer
          };
          updated.push(newRecord);
        }
      }
      return updated;
    });
  };

  // Auto-launch today and tomorrow on mount/load as proper daily records
  useEffect(() => {
    const todayStr = getTodayDateStr();
    const tomorrowStr = getTomorrowDateStr();
    
    setNotes(prev => {
      let updated = [...prev];
      let changed = false;
      
      const hasTodayDaily = updated.some(n => n.date === todayStr && n.isDailyRecord);
      if (!hasTodayDaily) {
        const existingIdx = updated.findIndex(n => n.date === todayStr && !n.isDailyRecord);
        if (existingIdx !== -1) {
          updated[existingIdx] = {
            ...updated[existingIdx],
            isDailyRecord: true,
            journalText: '',
            gratitudeText: templateGratitude,
            decreesText: templateDecrees,
            prayerText: templatePrayer,
            content: 'Diário & Espiritualidade'
          };
        } else {
          updated.push({
            id: 'rec-' + Math.random().toString(36).substring(2, 9),
            date: todayStr,
            title: 'Registro de ' + formatShortDate(todayStr),
            content: 'Diário & Espiritualidade',
            isDailyRecord: true,
            journalText: '',
            gratitudeText: templateGratitude,
            decreesText: templateDecrees,
            prayerText: templatePrayer
          });
        }
        changed = true;
      }
      
      const hasTomorrowDaily = updated.some(n => n.date === tomorrowStr && n.isDailyRecord);
      if (!hasTomorrowDaily) {
        const existingIdx = updated.findIndex(n => n.date === tomorrowStr && !n.isDailyRecord);
        if (existingIdx !== -1) {
          updated[existingIdx] = {
            ...updated[existingIdx],
            isDailyRecord: true,
            journalText: '',
            gratitudeText: templateGratitude,
            decreesText: templateDecrees,
            prayerText: templatePrayer,
            content: 'Diário & Espiritualidade'
          };
        } else {
          updated.push({
            id: 'rec-' + Math.random().toString(36).substring(2, 9),
            date: tomorrowStr,
            title: 'Registro de ' + formatShortDate(tomorrowStr),
            content: 'Diário & Espiritualidade',
            isDailyRecord: true,
            journalText: '',
            gratitudeText: templateGratitude,
            decreesText: templateDecrees,
            prayerText: templatePrayer
          });
        }
        changed = true;
      }
      
      if (changed) {
        return updated;
      }
      return prev;
    });
  }, [templateGratitude, templateDecrees, templatePrayer, setNotes]);

  // Handle active day selection with smooth scrolling and closing master templates
  const handleSelectDate = (dateStr: string) => {
    setSelectedDateStr(dateStr);
    setIsEditingTemplates(false); // Close templates configuration to view day record
    
    // Smoothly scroll the editor panel into view
    setTimeout(() => {
      panelRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }, 100);

    const exists = notes.some(n => n.date === dateStr && n.isDailyRecord);
    if (!exists) {
      const tomorrowStr = getTomorrowDateStr();
      
      // Auto-launch with 1 day of anticipation
      if (dateStr <= tomorrowStr) {
        setNotes(prev => {
          const existingIdx = prev.findIndex(n => n.date === dateStr);
          if (existingIdx !== -1) {
            const updated = [...prev];
            updated[existingIdx] = {
              ...updated[existingIdx],
              isDailyRecord: true,
              journalText: '',
              gratitudeText: templateGratitude,
              decreesText: templateDecrees,
              prayerText: templatePrayer,
              content: 'Diário & Espiritualidade'
            };
            return updated;
          }
          
          const newRecord: CalendarNote = {
            id: 'rec-' + Math.random().toString(36).substring(2, 9),
            date: dateStr,
            title: 'Registro de ' + formatShortDate(dateStr),
            content: 'Diário & Espiritualidade',
            isDailyRecord: true,
            journalText: '',
            gratitudeText: templateGratitude,
            decreesText: templateDecrees,
            prayerText: templatePrayer
          };
          return [...prev, newRecord];
        });
        addXp(10); // Reward XP for proactive launch
      }
    }
  };

  // Manual launch button for future days (> 1 day of anticipation)
  const handleManualLaunch = () => {
    if (!selectedDateStr) return;
    
    setNotes(prev => {
      const existingIdx = prev.findIndex(n => n.date === selectedDateStr);
      if (existingIdx !== -1) {
        const updated = [...prev];
        updated[existingIdx] = {
          ...updated[existingIdx],
          isDailyRecord: true,
          journalText: '',
          gratitudeText: templateGratitude,
          decreesText: templateDecrees,
          prayerText: templatePrayer,
          content: 'Diário & Espiritualidade'
        };
        return updated;
      }
      
      const newRecord: CalendarNote = {
        id: 'rec-' + Math.random().toString(36).substring(2, 9),
        date: selectedDateStr,
        title: 'Registro de ' + formatShortDate(selectedDateStr),
        content: 'Diário & Espiritualidade',
        isDailyRecord: true,
        journalText: '',
        gratitudeText: templateGratitude,
        decreesText: templateDecrees,
        prayerText: templatePrayer
      };
      return [...prev, newRecord];
    });
    addXp(15);
  };

  // Save changes on the active record
  const handleSaveCurrentRecord = () => {
    if (!selectedDateStr) return;
    setSavingStatus('saving');

    const finalGratitude = gratitudeText.trim() ? gratitudeText : templateGratitude;
    const finalDecrees = decreesText.trim() ? decreesText : templateDecrees;
    const finalPrayer = prayerText.trim() ? prayerText : templatePrayer;

    setGratitudeText(finalGratitude);
    setDecreesText(finalDecrees);
    setPrayerText(finalPrayer);

    setNotes(prev => {
      const idx = prev.findIndex(n => n.date === selectedDateStr);
      if (idx !== -1) {
        const updated = [...prev];
        updated[idx] = {
          ...updated[idx],
          journalText: journalText,
          gratitudeText: finalGratitude,
          decreesText: finalDecrees,
          prayerText: finalPrayer,
          checklist: dayChecklist,
          alterEgoWinner: alterEgoWinner,
          alterEgoText: alterEgoText,
          sleepBedTime: sleepBedTime,
          sleepWakeTime: sleepWakeTime,
          foodMorning: foodMorning,
          foodAfternoon: foodAfternoon,
          foodNight: foodNight,
          waterLiters: waterLiters,
          reminderTime: noteReminderTime.trim() || undefined,
          title: 'Registro de ' + formatShortDate(selectedDateStr),
          content: journalText ? (journalText.substring(0, 40) + (journalText.length > 40 ? '...' : '')) : 'Diário, Checklist & Fé',
          isDailyRecord: true
        };
        return updated;
      } else {
        const newRecord: CalendarNote = {
          id: 'rec-' + Math.random().toString(36).substring(2, 9),
          date: selectedDateStr,
          title: 'Registro de ' + formatShortDate(selectedDateStr),
          content: journalText ? (journalText.substring(0, 40) + (journalText.length > 40 ? '...' : '')) : 'Diário, Checklist & Fé',
          isDailyRecord: true,
          journalText: journalText,
          gratitudeText: finalGratitude,
          decreesText: finalDecrees,
          prayerText: finalPrayer,
          checklist: dayChecklist,
          alterEgoWinner: alterEgoWinner,
          alterEgoText: alterEgoText,
          sleepBedTime: sleepBedTime,
          sleepWakeTime: sleepWakeTime,
          foodMorning: foodMorning,
          foodAfternoon: foodAfternoon,
          foodNight: foodNight,
          waterLiters: waterLiters,
          reminderTime: noteReminderTime.trim() || undefined
        };
        return [...prev, newRecord];
      }
    });

    setTimeout(() => {
      setSavingStatus('saved');
      addXp(5);
    }, 400);
  };

  // Real-time auto-save for Espaço Diário & Fé in CalendarView when freeEditMode is active (debounced)
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
          title: 'Registro de ' + formatShortDate(selectedDateStr),
          content: journalText ? (journalText.substring(0, 40) + (journalText.length > 40 ? '...' : '')) : 'Diário, Checklist & Fé',
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
          waterLiters,
          reminderTime: noteReminderTime.trim() || undefined
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
    waterLiters,
    noteReminderTime
  ]);

  const saveChecklistToNotes = (updatedChecklist: DailyTask[]) => {
    if (!selectedDateStr) return;
    setNotes(prev => {
      const idx = prev.findIndex(n => n.date === selectedDateStr);
      if (idx !== -1) {
        const updated = [...prev];
        updated[idx] = {
          ...updated[idx],
          checklist: updatedChecklist,
          isDailyRecord: true
        };
        return updated;
      } else {
        const finalGratitude = gratitudeText.trim() ? gratitudeText : templateGratitude;
        const finalDecrees = decreesText.trim() ? decreesText : templateDecrees;
        const finalPrayer = prayerText.trim() ? prayerText : templatePrayer;
        const newRecord: CalendarNote = {
          id: 'rec-' + Math.random().toString(36).substring(2, 9),
          date: selectedDateStr,
          title: 'Registro de ' + formatShortDate(selectedDateStr),
          content: journalText ? (journalText.substring(0, 40) + (journalText.length > 40 ? '...' : '')) : 'Diário, Checklist & Fé',
          isDailyRecord: true,
          journalText: journalText,
          gratitudeText: finalGratitude,
          decreesText: finalDecrees,
          prayerText: finalPrayer,
          checklist: updatedChecklist,
          alterEgoWinner: alterEgoWinner,
          alterEgoText: alterEgoText,
          sleepBedTime: sleepBedTime,
          sleepWakeTime: sleepWakeTime,
          foodMorning: foodMorning,
          foodAfternoon: foodAfternoon,
          foodNight: foodNight,
          waterLiters: waterLiters
        };
        return [...prev, newRecord];
      }
    });
  };

  const handleToggleDayTask = (id: string) => {
    setDayChecklist(prev => {
      const updated = prev.map(t => {
        if (t.id === id) {
          const updatedCompleted = !t.completed;
          addXp(updatedCompleted ? t.xpReward || 10 : -(t.xpReward || 10));
          const updatedSubtasks = t.subtasks?.map(sub => ({ ...sub, completed: updatedCompleted }));
          return { ...t, completed: updatedCompleted, subtasks: updatedSubtasks };
        }
        return t;
      });
      saveChecklistToNotes(updated);
      return updated;
    });
  };

  const handleToggleDaySubtask = (taskId: string, subtaskId: string) => {
    setDayChecklist(prev => {
      const updated = prev.map(t => {
        if (t.id !== taskId) return t;
        if (!t.subtasks) return t;

        const updatedSubtasks = t.subtasks.map(sub => {
          if (sub.id === subtaskId) {
            return { ...sub, completed: !sub.completed };
          }
          return sub;
        });

        const allCompleted = updatedSubtasks.every(sub => sub.completed);
        const wasCompleted = t.completed;
        const nowCompleted = allCompleted;

        if (nowCompleted && !wasCompleted) {
          addXp(t.xpReward || 10);
        } else if (!nowCompleted && wasCompleted) {
          addXp(-(t.xpReward || 10));
        }

        return {
          ...t,
          subtasks: updatedSubtasks,
          completed: nowCompleted
        };
      });
      saveChecklistToNotes(updated);
      return updated;
    });
  };

  const handleAddDayTask = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newDayTaskText.trim()) return;
    const newTask: DailyTask = {
      id: 'dt-day-' + Math.random().toString(36).substring(2, 9),
      text: newDayTaskText.trim(),
      completed: false,
      xpReward: 10,
      category: 'O Básico'
    };
    setDayChecklist(prev => {
      const updated = [...prev, newTask];
      saveChecklistToNotes(updated);
      return updated;
    });
    setNewDayTaskText('');
  };

  const handleDeleteDayTask = (id: string, completed: boolean) => {
    if (completed) {
      addXp(-10);
    }
    setDayChecklist(prev => {
      const updated = prev.filter(t => t.id !== id);
      saveChecklistToNotes(updated);
      return updated;
    });
  };

  const handleDeleteRecord = () => {
    if (confirm('Tem certeza de que deseja apagar o registro completo deste dia?')) {
      setNotes(notes.filter(n => n.date !== selectedDateStr));
    }
  };

  // Calculate calendar days
  const firstDayOfMonth = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const prevMonthDays = new Date(year, month, 0).getDate();

  const calendarDays: Array<{ dateStr: string; dayNum: number; isCurrentMonth: boolean }> = [];

  // Previous month padding days
  for (let i = firstDayOfMonth - 1; i >= 0; i--) {
    const d = prevMonthDays - i;
    const prevMonth = month === 0 ? 11 : month - 1;
    const prevYear = month === 0 ? year - 1 : year;
    const dateStr = `${prevYear}-${String(prevMonth + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
    calendarDays.push({ dateStr, dayNum: d, isCurrentMonth: false });
  }

  // Current month days
  for (let i = 1; i <= daysInMonth; i++) {
    const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(i).padStart(2, '0')}`;
    calendarDays.push({ dateStr, dayNum: i, isCurrentMonth: true });
  }

  // Next month padding days to fill 42 cells
  const remainingCells = 42 - calendarDays.length;
  for (let i = 1; i <= remainingCells; i++) {
    const nextMonth = month === 11 ? 0 : month + 1;
    const nextYear = month === 11 ? year + 1 : year;
    const dateStr = `${nextYear}-${String(nextMonth + 1).padStart(2, '0')}-${String(i).padStart(2, '0')}`;
    calendarDays.push({ dateStr, dayNum: i, isCurrentMonth: false });
  }

  const getWeeklyDays = () => {
    const current = new Date(currentDate);
    const day = current.getDay();
    const sunday = new Date(current);
    sunday.setDate(current.getDate() - day);

    const days: Array<{ dateStr: string; dayNum: number; isCurrentMonth: boolean }> = [];
    for (let i = 0; i < 7; i++) {
      const d = new Date(sunday);
      d.setDate(sunday.getDate() + i);
      const dateStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
      days.push({
        dateStr,
        dayNum: d.getDate(),
        isCurrentMonth: d.getMonth() === month
      });
    }
    return days;
  };

  const handlePrevWeek = () => {
    setCurrentDate(prev => {
      const d = new Date(prev);
      d.setDate(d.getDate() - 7);
      return d;
    });
  };

  const handleNextWeek = () => {
    setCurrentDate(prev => {
      const d = new Date(prev);
      d.setDate(d.getDate() + 7);
      return d;
    });
  };

  const daysToRender = viewMode === 'grid' ? calendarDays : getWeeklyDays();

  const handlePrevMonth = () => {
    setCurrentDate(new Date(year, month - 1, 1));
  };

  const handleNextMonth = () => {
    setCurrentDate(new Date(year, month + 1, 1));
  };

  const [isMonthDropdownOpen, setIsMonthDropdownOpen] = useState(false);

  return (
    <div id="calendar-view" className="space-y-6 pb-12 relative">
      
      {/* Premium Header - Styled to match screenshot */}
      <div className="flex items-center justify-between border-b border-zinc-800/80 pb-4">
        {/* Month Selector Dropdown */}
        <div className="relative">
          <button
            onClick={() => setIsMonthDropdownOpen(!isMonthDropdownOpen)}
            className="text-2xl md:text-3xl font-black text-white tracking-tight flex items-center gap-1.5 hover:text-zinc-300 transition-colors capitalize focus:outline-none select-none"
          >
            {months[month]} <ChevronDown className="h-5 w-5 text-zinc-500" />
          </button>

          {isMonthDropdownOpen && (
            <div className="absolute left-0 mt-2 w-48 bg-[#0d0d10] border border-zinc-800 rounded-2xl shadow-2xl overflow-hidden z-50">
              <div className="max-h-60 overflow-y-auto py-1.5 scrollbar-thin">
                {months.map((m, i) => (
                  <button
                    key={m}
                    onClick={() => {
                      setCurrentDate(new Date(year, i, 1));
                      setIsMonthDropdownOpen(false);
                    }}
                    className={`w-full text-left px-4 py-2 text-xs font-bold transition-colors ${
                      i === month
                        ? 'bg-zinc-900 text-orange-500'
                        : 'text-zinc-400 hover:bg-zinc-900 hover:text-white'
                    }`}
                  >
                    {m}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Action Controls - Search, Today, Checklist, and Profile */}
        <div className="flex items-center gap-3.5 md:gap-5">
          {/* Search Bar */}
          <div className="flex items-center gap-2">
            {isSearchOpen && (
              <motion.div 
                initial={{ width: 0, opacity: 0 }}
                animate={{ width: 'auto', opacity: 1 }}
                className="relative flex items-center bg-zinc-950 border border-zinc-900 rounded-xl px-2.5 py-1"
              >
                <input
                  type="text"
                  placeholder="Buscar eventos..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="bg-transparent text-xs text-white placeholder-zinc-500 focus:outline-none w-28 md:w-40 font-medium"
                />
                {searchQuery && (
                  <button onClick={() => setSearchQuery('')} className="text-zinc-500 hover:text-white p-0.5">
                    <X className="h-3 w-3" />
                  </button>
                )}
              </motion.div>
            )}
            <button
              onClick={() => setIsSearchOpen(!isSearchOpen)}
              className={`p-1.5 rounded-lg transition-colors ${isSearchOpen ? 'text-orange-500 hover:bg-zinc-900' : 'text-zinc-400 hover:text-white hover:bg-zinc-900/60'}`}
              title="Buscar evento"
            >
              <Search className="h-5 w-5" />
            </button>
          </div>

          {/* Today Button styled as [18] */}
          <button
            onClick={() => {
              setCurrentDate(new Date());
              setViewMode('grid');
            }}
            className="h-7 w-7 rounded-lg border-2 border-zinc-600 hover:border-white text-zinc-400 hover:text-white flex items-center justify-center text-[10px] font-extrabold font-mono transition-all hover:scale-105 active:scale-95"
            title="Hoje"
          >
            {new Date().getDate()}
          </button>

          {/* Tasks checklist quick action */}
          <button
            onClick={() => {
              const todayStr = getTodayDateStr();
              handleSelectDate(todayStr);
              setActiveTopic('checklist');
            }}
            className="h-7 w-7 rounded-lg text-zinc-400 hover:text-white flex items-center justify-center hover:bg-zinc-900/60 transition-colors"
            title="Checklist de Hoje"
          >
            <Check className="h-5 w-5" />
          </button>

          {/* Profile & Google Auth Dropdown */}
          <div className="relative">
            <button
              onClick={() => setIsProfileDropdownOpen(!isProfileDropdownOpen)}
              className="focus:outline-none block hover:scale-105 active:scale-95 transition-all"
            >
              {googleUser && googleUser.picture ? (
                <img
                  src={googleUser.picture}
                  alt={googleUser.name}
                  referrerPolicy="no-referrer"
                  className="w-8 h-8 rounded-full border border-zinc-800 hover:border-zinc-500 transition-all object-cover shadow-lg"
                />
              ) : (
                <div className="w-8 h-8 rounded-full bg-zinc-900 border border-zinc-800 hover:border-zinc-700 flex items-center justify-center text-zinc-400 hover:text-white transition-all shadow-lg">
                  <User className="h-4 w-4" />
                </div>
              )}
            </button>

            {isProfileDropdownOpen && (
              <div className="absolute right-0 mt-2.5 w-64 bg-[#0d0d10] border border-zinc-800 rounded-2xl shadow-2xl p-4.5 space-y-4 z-50 text-left">
                {googleUser ? (
                  <div className="space-y-4">
                    <div className="flex items-center gap-3">
                      <img
                        src={googleUser.picture}
                        alt={googleUser.name}
                        referrerPolicy="no-referrer"
                        className="w-10 h-10 rounded-full border border-zinc-800"
                      />
                      <div className="overflow-hidden">
                        <p className="text-xs font-bold text-white truncate">{googleUser.name}</p>
                        <p className="text-[10px] text-zinc-500 truncate">{googleUser.email}</p>
                      </div>
                    </div>
                    <div className="border-t border-zinc-900 pt-3 flex flex-col gap-2">
                      <div className="flex items-center gap-1.5 text-[10px] text-zinc-400 font-mono">
                        <span className="h-1.5 w-1.5 bg-green-500 rounded-full animate-pulse" />
                        Google Agenda Sincronizado
                      </div>
                      {isLoadingEvents ? (
                        <div className="text-[10px] text-orange-500 animate-pulse font-mono">
                          Sincronizando eventos...
                        </div>
                      ) : googleError ? (
                        <div className="text-[10px] text-red-400 bg-red-950/30 border border-red-900/40 p-2.5 rounded-xl mt-1 space-y-1.5">
                          <p className="font-bold text-red-300">Erro na Sincronização:</p>
                          <p className="text-[9px] font-mono leading-relaxed break-all bg-zinc-950 p-1.5 rounded border border-zinc-900">{googleError}</p>
                          {(googleError.toLowerCase().includes('api') || googleError.includes('403') || googleError.toLowerCase().includes('access_not_configured')) && (
                            <p className="text-[9px] text-zinc-400 leading-normal border-t border-zinc-900 pt-1.5 mt-1">
                              💡 <strong>Ação Necessária:</strong> É necessário ativar a <strong>Google Calendar API</strong> em seu projeto no Google Cloud Console.
                            </p>
                          )}
                        </div>
                      ) : (
                        <div className="text-[10px] text-zinc-400 font-mono mt-0.5">
                          ✓ {googleEvents.length} {googleEvents.length === 1 ? 'evento carregado' : 'eventos carregados'}
                        </div>
                      )}
                      <button
                        onClick={handleGoogleLogout}
                        className="w-full flex items-center justify-center gap-1.5 py-2 px-3 bg-zinc-950 hover:bg-zinc-900 border border-zinc-850 text-red-400 hover:text-red-300 text-xs font-bold rounded-xl transition-colors"
                      >
                        <LogOut className="h-3.5 w-3.5" /> Desconectar Google
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <div className="text-center py-2">
                      <Calendar className="h-8 w-8 text-orange-500 mx-auto mb-2" />
                      <p className="text-xs font-bold text-white">Google Agenda</p>
                      <p className="text-[10px] text-zinc-500 mt-1 leading-relaxed">
                        Conecte sua conta do Google para visualizar seus compromissos, feriados e aniversários em tempo real na Agenda.
                      </p>
                    </div>
                    <button
                      onClick={handleGoogleLogin}
                      className="w-full flex items-center justify-center gap-2 py-2 px-3 bg-white hover:bg-zinc-200 text-black text-xs font-extrabold rounded-xl transition-all shadow-lg active:scale-98"
                    >
                      <LogIn className="h-4 w-4" /> Entrar com o Google
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Sub Toolbar - Holds additional controls nicely sorted */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-zinc-950/20 border border-zinc-900/60 p-3 rounded-2xl">
        <div className="flex items-center gap-2">
          {/* Grid vs Semanal Switcher */}
          <div className="flex bg-zinc-950 p-1 rounded-xl border border-zinc-900 text-xs font-bold text-gray-400 shrink-0">
            <button
              onClick={() => setViewMode('grid')}
              className={`px-3 py-1.5 rounded-lg transition-all ${
                viewMode === 'grid'
                  ? 'bg-[#18181b] text-white shadow-lg border border-zinc-800'
                  : 'hover:text-white border border-transparent'
              }`}
            >
              Grid
            </button>
            <button
              onClick={() => setViewMode('weekly')}
              className={`px-3 py-1.5 rounded-lg transition-all ${
                viewMode === 'weekly'
                  ? 'bg-[#18181b] text-white shadow-lg border border-zinc-800'
                  : 'hover:text-white border border-transparent'
              }`}
            >
              Semanal
            </button>
          </div>

          {/* Year selector */}
          <select
            value={year}
            onChange={(e) => {
              const newYear = parseInt(e.target.value, 10);
              setCurrentDate(new Date(newYear, month, 1));
            }}
            className="bg-zinc-950 border border-zinc-900 hover:border-zinc-800 text-white rounded-xl px-3 py-1.5 text-xs font-bold font-mono focus:outline-none cursor-pointer transition-all"
          >
            {Array.from({ length: 27 }, (_, i) => 2024 + i).map((y) => (
              <option key={y} value={y}>
                {y}
              </option>
            ))}
          </select>
          
          {/* Manual Month navigation controls */}
          <div className="flex gap-1">
            <button 
              onClick={viewMode === 'grid' ? handlePrevMonth : handlePrevWeek} 
              className="p-1.5 bg-zinc-950 hover:bg-zinc-900 border border-zinc-900 rounded-lg text-zinc-400 hover:text-white transition-colors"
              title="Anterior"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <button 
              onClick={viewMode === 'grid' ? handleNextMonth : handleNextWeek} 
              className="p-1.5 bg-zinc-950 hover:bg-zinc-900 border border-zinc-900 rounded-lg text-zinc-400 hover:text-white transition-colors"
              title="Próximo"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Template Gear Settings */}
          <button
            onClick={handleOpenTemplateSettings}
            className="flex items-center justify-center p-2.5 bg-zinc-950 hover:bg-zinc-900 text-gray-300 rounded-xl border border-zinc-900 hover:border-zinc-800 transition-colors hover:text-orange-500 shrink-0"
            title="Modelos de Espiritualidade"
          >
            <Settings className="h-4 w-4 text-orange-500" />
          </button>

          {/* Monthly / Weekly Review Actions */}
          <button
            onClick={handleOpenReview}
            className="flex items-center gap-1.5 px-3 py-2 bg-zinc-950 hover:bg-zinc-900 text-xs text-orange-500 hover:text-orange-400 font-bold rounded-xl border border-orange-500/10 hover:border-orange-500/30 transition-all"
          >
            <Compass className="h-3.5 w-3.5 text-orange-500" />
            <span className="hidden sm:inline">Review Mensal</span>
          </button>

          <button
            onClick={handleOpenWeeklyReview}
            className="flex items-center gap-1.5 px-3 py-2 bg-zinc-950 hover:bg-zinc-900 text-xs text-orange-500 hover:text-orange-400 font-bold rounded-xl border border-orange-500/10 hover:border-orange-500/30 transition-all"
          >
            <CalendarDays className="h-3.5 w-3.5 text-orange-500" />
            <span className="hidden sm:inline">Review Semanal</span>
          </button>
        </div>
      </div>

      {/* Main Grid Content */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Monthly Calendar Grid */}
        <div className="lg:col-span-12 bg-[#0a0a0c]/60 rounded-2xl border border-zinc-800/80 p-5 space-y-4">
          
          {/* Days of week header - lowercase matching the screenshot */}
          <div className="grid grid-cols-7 gap-1 text-center font-bold text-gray-500 text-[11px] pb-2 border-b border-zinc-800/60">
            {daysOfWeek.map(day => (
              <div key={day} className="py-1 lowercase font-medium">{day}</div>
            ))}
          </div>

          {/* Calendar Day Cells */}
          <div className="grid grid-cols-7 gap-1 bg-zinc-950/40 p-1 rounded-2xl border border-zinc-900/40">
            {daysToRender.map((cell, idx) => {
              const cellRecord = notes.find(n => n.date === cell.dateStr);
              const isSelected = selectedDateStr === cell.dateStr;
              const isToday = cell.dateStr === getTodayDateStr();
              const isTomorrow = cell.dateStr === getTomorrowDateStr();
              
              const hasDiary = cellRecord && cellRecord.journalText && cellRecord.journalText.trim().length > 0;
              const hasSpirituality = cellRecord && (
                (cellRecord.gratitudeText && cellRecord.gratitudeText.trim().length > 0) ||
                (cellRecord.decreesText && cellRecord.decreesText.trim().length > 0) ||
                (cellRecord.prayerText && cellRecord.prayerText.trim().length > 0)
              );

              const events = getEventsForDay(cell.dateStr);

              return (
                <button
                  key={idx}
                  onClick={() => handleSelectDate(cell.dateStr)}
                  className={`min-h-[120px] p-2.5 rounded-xl border text-left flex flex-col justify-start transition-all relative outline-none select-none ${
                    cell.isCurrentMonth ? 'bg-[#0f0f12]/30' : 'bg-[#050507]/20 opacity-30'
                  } ${
                    isSelected 
                      ? 'border-orange-500/80 bg-orange-500/5 shadow-[0_0_12px_rgba(249,115,22,0.12)]' 
                      : isToday
                        ? 'border-zinc-700 bg-zinc-800/10'
                        : 'border-zinc-900/80 hover:border-zinc-800 hover:bg-zinc-900/10'
                  }`}
                >
                  {/* Day Number and small indicators row */}
                  <div className="flex justify-between items-center w-full mb-1">
                    {isToday ? (
                      <span className="bg-[#ccdcfd] text-[#0d1b3e] font-extrabold rounded-full text-[10px] w-5 h-5 flex items-center justify-center">
                        {cell.dayNum}
                      </span>
                    ) : (
                      <span className={`text-[11px] font-extrabold font-mono ${
                        isTomorrow
                          ? 'text-orange-400'
                          : isSelected ? 'text-orange-500' : 'text-zinc-400'
                      }`}>
                        {cell.dayNum}
                      </span>
                    )}

                    {/* Clean micro-dots for original features (journal, faith) */}
                    <div className="flex gap-1 items-center">
                      {hasDiary && (
                        <span className="h-1.5 w-1.5 bg-blue-500 rounded-full" title="Diário registrado" />
                      )}
                      {hasSpirituality && (
                        <span className="h-1.5 w-1.5 bg-purple-500 rounded-full" title="Fé registrada" />
                      )}
                    </div>
                  </div>

                  {/* Complete Events List - Rendered as beautiful horizontal blocks like Google Calendar */}
                  <div className="flex flex-col gap-1 w-full mt-1.5 flex-1 overflow-hidden justify-start pointer-events-none">
                    {events.slice(0, 3).map((ev) => (
                      <div
                        key={ev.id}
                        className={`w-full px-1.5 py-0.5 text-[9px] font-bold rounded truncate text-left tracking-tight shadow-sm border border-black/10 transition-colors ${getEventColor(ev.name, ev.isGoogle)}`}
                        title={`${ev.name}${ev.description ? ' - ' + ev.description : ''}`}
                      >
                        {ev.name}
                      </div>
                    ))}
                    {events.length > 3 && (
                      <div className="text-[8px] text-zinc-500 font-bold px-1 select-none text-left">
                        + {events.length - 3} mais
                      </div>
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Sticky floating '+' button - styled perfectly */}
        <button
          onClick={() => {
            const todayStr = getTodayDateStr();
            handleSelectDate(todayStr);
          }}
          className="fixed bottom-6 right-6 md:bottom-8 md:right-8 bg-[#2f437c] hover:bg-[#3b539c] text-white p-4 rounded-2xl shadow-xl shadow-black/40 hover:scale-105 active:scale-95 transition-all z-40 flex items-center justify-center border border-[#405697]"
          title="Nova Entrada/Evento"
        >
          <Plus className="h-6 w-6" />
        </button>

      {/* Fullscreen Modal Overlay for Espaço Diário & Fé or Master Templates */}
      <AnimatePresence>
        {(selectedDateStr || isEditingTemplates) && (
          <div 
            onClick={() => {
              setSelectedDateStr(null);
              setIsEditingTemplates(false);
            }}
            className="fixed inset-0 z-[9999] bg-[#040405]/95 backdrop-blur-md flex items-center justify-center p-4 md:p-6 overflow-hidden cursor-pointer"
          >
            <motion.div
              onClick={(e) => e.stopPropagation()}
              initial={{ scale: 0.95, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 20 }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              className="cursor-default bg-[#0a0a0c] border border-zinc-800 rounded-3xl w-full max-w-4xl h-full max-h-[85vh] my-auto flex flex-col overflow-hidden shadow-2xl shadow-orange-500/5 text-left"
            >
              <div ref={panelRef} className="flex flex-col h-full overflow-hidden">
          
          <AnimatePresence mode="wait">
            {isEditingTemplates ? (
              /* Master Templates Editor Mode */
              <motion.div
                key="templates-editor"
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.98 }}
                className="p-5 flex flex-col h-full space-y-4"
              >
                <div className="flex justify-between items-center border-b border-zinc-800 pb-3">
                  <div>
                    <h3 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
                      <Settings className="h-4 w-4 text-orange-500" />
                      Modelos de Espiritualidade
                    </h3>
                    <p className="text-[10px] text-gray-500 mt-0.5">
                      Define os textos automáticos carregados com antecedência.
                    </p>
                  </div>
                  <button 
                    onClick={() => setIsEditingTemplates(false)}
                    className="p-1 hover:bg-zinc-800 text-zinc-400 rounded-lg"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>

                <div className="flex-1 space-y-4 overflow-y-auto max-h-[500px] pr-1">
                  <div>
                    <label className="text-[10px] text-orange-400 font-bold block mb-1 uppercase flex items-center gap-1">
                      <Heart className="h-3 w-3" /> Caderno da Gratidão (Modelo)
                    </label>
                    <textarea
                      value={tempTemplateGratitude}
                      onChange={(e) => setTempTemplateGratitude(e.target.value)}
                      className="w-full h-24 bg-zinc-950 border border-zinc-800 rounded-xl p-2.5 text-xs text-white focus:outline-none focus:border-orange-500/50 resize-none font-mono"
                    />
                  </div>

                  <div>
                    <label className="text-[10px] text-orange-400 font-bold block mb-1 uppercase flex items-center gap-1">
                      <Zap className="h-3 w-3" /> Decretos Diários (Modelo)
                    </label>
                    <textarea
                      value={tempTemplateDecrees}
                      onChange={(e) => setTempTemplateDecrees(e.target.value)}
                      className="w-full h-24 bg-zinc-950 border border-zinc-800 rounded-xl p-2.5 text-xs text-white focus:outline-none focus:border-orange-500/50 resize-none font-mono"
                    />
                  </div>

                  <div>
                    <label className="text-[10px] text-orange-400 font-bold block mb-1 uppercase flex items-center gap-1">
                      <Compass className="h-3 w-3" /> Oração Diária (Modelo)
                    </label>
                    <textarea
                      value={tempTemplatePrayer}
                      onChange={(e) => setTempTemplatePrayer(e.target.value)}
                      className="w-full h-24 bg-zinc-950 border border-zinc-800 rounded-xl p-2.5 text-xs text-white focus:outline-none focus:border-orange-500/50 resize-none font-mono"
                    />
                  </div>
                </div>

                <div className="flex gap-2 pt-2 border-t border-zinc-800">
                  <button
                    onClick={() => setIsEditingTemplates(false)}
                    className="flex-1 py-2 bg-zinc-900 hover:bg-zinc-800 text-zinc-300 font-bold text-xs rounded-xl transition-colors"
                  >
                    Descartar
                  </button>
                  <button
                    onClick={handleSaveMasterTemplates}
                    className="flex-1 py-2 bg-orange-500 hover:bg-orange-600 text-white font-bold text-xs rounded-xl flex items-center justify-center gap-1.5 transition-colors"
                  >
                    <Save className="h-3.5 w-3.5" /> Salvar Modelos
                  </button>
                </div>
              </motion.div>
            ) : (
              /* Regular Day Record Mode */
              <motion.div
                key="day-record"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="p-5 flex flex-col h-full space-y-4"
              >
                {/* Panel Header */}
                <div className="flex justify-between items-start border-b border-zinc-800 pb-3">
                  <div>
                    <h3 className="text-xs font-bold text-white uppercase tracking-wider">
                      Espaço Diário & Fé
                    </h3>
                    <p className="text-[10px] text-orange-500 font-mono font-bold mt-0.5 capitalize">
                      {selectedDateStr ? formatLongDate(selectedDateStr) : 'Selecione uma data'}
                    </p>
                  </div>
                  <div className="flex items-center gap-1.5">
                    {activeRecord && (
                      <button
                        onClick={handleDeleteRecord}
                        className="p-1.5 hover:bg-zinc-900 text-zinc-500 hover:text-red-500 rounded-lg transition-colors"
                        title="Apagar este dia"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    )}
                    <button
                      onClick={() => setSelectedDateStr(null)}
                      className="p-1.5 hover:bg-zinc-800 text-zinc-400 hover:text-white rounded-lg transition-colors"
                      title="Fechar"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                </div>

                {/* Main Body */}
                {!selectedDateStr ? (
                  <div className="text-center py-20">
                    <Calendar className="h-8 w-8 text-zinc-700 mx-auto mb-2" />
                    <p className="text-xs text-gray-500">Selecione um dia no calendário para editar ou visualizar.</p>
                  </div>
                ) : (
                  /* Active Day Entry Editor */
                  <div className="flex-1 flex flex-col space-y-4">
                    
                     {/* Primary Topic Selector (Grid de Categorias de Bloco) */}
                    <div className="grid grid-cols-3 sm:grid-cols-6 gap-2 bg-zinc-950 p-2 rounded-2xl border border-zinc-900">
                      {[
                        { id: 'diario', label: 'Diário Pessoal', icon: BookOpen },
                        { id: 'checklist', label: 'Checklist', icon: Check },
                        { id: 'espiritualidade', label: 'Espiritualidade', icon: Sparkles },
                        { id: 'alteregos', label: 'Alter Egos', icon: Sliders },
                        { id: 'saude', label: 'Saúde', icon: Heart },
                        { id: 'agenda', label: 'Google Agenda', icon: CalendarDays },
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

                    {/* Topic Content Container */}
                    <div className="flex-1 min-h-[250px] flex flex-col justify-between">
                      {activeTopic === 'diario' ? (
                        /* DIARIO TOPIC */
                        <div className="space-y-2 flex-1 flex flex-col">
                          <div className="flex justify-between items-center">
                            <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">
                              Como foi seu dia?
                            </span>
                            <span className="text-[9px] text-gray-500 font-mono">
                              {journalText.length} caracteres
                            </span>
                          </div>
                          <textarea
                            value={journalText}
                            onChange={(e) => setJournalText(e.target.value)}
                            placeholder="Escreva aqui como foi o seu dia, suas vitórias, lições aprendidas e sentimentos... registre tudo."
                            className="w-full flex-1 min-h-[160px] bg-zinc-950/40 border border-zinc-800 rounded-xl p-3 text-xs text-white focus:outline-none focus:border-orange-500/50 resize-none font-sans leading-relaxed"
                          />
                        </div>
                      ) : activeTopic === 'checklist' ? (
                        /* CHECKLIST TOPIC */
                        <div className="space-y-3 flex-1 flex flex-col">
                          <div className="flex justify-between items-center">
                            <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">
                              Tarefas Inegociáveis deste Dia
                            </span>
                            <span className="text-[10px] text-orange-500 font-mono font-bold">
                              {dayChecklist.filter(t => t.completed).length}/{dayChecklist.length} concluídas
                            </span>
                          </div>

                          {/* Quick Add Task Form */}
                          <form onSubmit={handleAddDayTask} className="flex gap-2">
                            <input
                              type="text"
                              value={newDayTaskText}
                              onChange={(e) => setNewDayTaskText(e.target.value)}
                              placeholder="Nova tarefa para hoje..."
                              className="flex-1 bg-zinc-950/40 border border-zinc-850 rounded-lg px-3 py-1.5 text-xs text-white focus:outline-none focus:border-orange-500/50 font-sans"
                            />
                            <button
                              type="submit"
                              className="bg-zinc-900 hover:bg-zinc-800 text-orange-500 border border-zinc-800 rounded-lg px-3 py-1.5 transition-colors font-bold text-xs"
                            >
                              Adicionar
                            </button>
                          </form>

                          {/* Checklist Items list */}
                          <div className="flex-1 overflow-y-auto max-h-[195px] space-y-1.5 pr-1 scrollbar-thin">
                            {dayChecklist.length === 0 ? (
                              <div className="text-center py-8 border border-dashed border-zinc-900 rounded-xl animate-pulse">
                                <p className="text-[11px] text-zinc-500">Nenhuma tarefa para este dia.</p>
                              </div>
                            ) : (
                              dayChecklist.map((task) => {
                                const hasSubtasks = task.subtasks && task.subtasks.length > 0;
                                const isExpanded = !!expandedDayTasks[task.id];
                                const completedSubs = task.subtasks?.filter(s => s.completed).length || 0;
                                
                                return (
                                  <div
                                    key={task.id}
                                    className="flex flex-col p-2.5 bg-[#0e0e11]/60 border border-zinc-900 hover:border-zinc-850 rounded-xl transition-all"
                                  >
                                    <div className="flex items-center justify-between">
                                      <label className="flex items-center gap-2.5 cursor-pointer flex-1 min-w-0">
                                        <div className="relative flex items-center justify-center shrink-0">
                                          <input
                                            type="checkbox"
                                            checked={task.completed}
                                            onChange={() => handleToggleDayTask(task.id)}
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
                                        {task.id === 'task-leitura' && <BookOpen className="h-3.5 w-3.5 text-orange-400 shrink-0" />}
                                        {task.id === 'task-biblia' && <Book className="h-3.5 w-3.5 text-amber-500 shrink-0" />}
                                        {task.period === 'manha' && <Sun className="h-3.5 w-3.5 text-amber-400 shrink-0" />}
                                        {task.period === 'noite' && <Moon className="h-3.5 w-3.5 text-indigo-400 shrink-0" />}
                                        <span className={`text-xs truncate ${task.completed ? 'line-through text-gray-500 font-medium' : 'text-gray-300 font-medium'}`}>
                                          {task.text}
                                        </span>
                                        {hasSubtasks && (
                                          <span className="text-[9px] text-zinc-500 font-mono ml-1.5">
                                            ({completedSubs}/{task.subtasks!.length} etapas)
                                          </span>
                                        )}
                                      </label>
                                      
                                      <div className="flex items-center gap-1">
                                        {hasSubtasks && (
                                          <button
                                            onClick={() => setExpandedDayTasks(p => ({ ...p, [task.id]: !p[task.id] }))}
                                            className="p-1 text-zinc-500 hover:text-orange-500 transition-colors"
                                          >
                                            {isExpanded ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
                                          </button>
                                        )}
                                        <button
                                          onClick={() => handleDeleteDayTask(task.id, task.completed)}
                                          className="p-1 text-zinc-600 hover:text-red-500 transition-colors"
                                          title="Remover tarefa"
                                        >
                                          <Trash2 className="h-3 w-3" />
                                        </button>
                                      </div>
                                    </div>

                                    {/* Nested steps if expanded */}
                                    {hasSubtasks && isExpanded && (
                                      <div className="pl-6 pt-2 mt-1.5 border-t border-zinc-900 space-y-1 bg-zinc-950/20 rounded pb-1">
                                        {task.subtasks!.map(sub => (
                                          <label key={sub.id} className="flex items-center gap-2 cursor-pointer py-0.5 select-none">
                                            <div className="relative flex items-center justify-center shrink-0">
                                              <input
                                                type="checkbox"
                                                checked={sub.completed}
                                                onChange={() => handleToggleDaySubtask(task.id, sub.id)}
                                                className="sr-only"
                                              />
                                              <div
                                                className={`w-3.5 h-3.5 rounded border flex items-center justify-center transition-all duration-200 ${
                                                  sub.completed
                                                    ? 'bg-gradient-to-br from-orange-500 to-amber-600 border-orange-500 text-black scale-105'
                                                    : 'border-zinc-800 hover:border-orange-500/30 bg-zinc-950/80'
                                                }`}
                                              >
                                                {sub.completed && (
                                                  <svg
                                                    className="w-2 h-2 stroke-black stroke-[3]"
                                                    fill="none"
                                                    viewBox="0 0 24 24"
                                                    stroke="currentColor"
                                                  >
                                                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                                                  </svg>
                                                )}
                                              </div>
                                            </div>
                                            <span className={`text-[10px] ${sub.completed ? 'line-through text-zinc-600' : 'text-zinc-400'}`}>
                                              {sub.text}
                                            </span>
                                          </label>
                                        ))}
                                      </div>
                                    )}
                                  </div>
                                );
                              })
                            )}
                          </div>
                        </div>
                      ) : activeTopic === 'espiritualidade' ? (
                        /* ESPIRITUALIDADE TOPIC */
                        <div className="space-y-3 flex-1 flex flex-col">
                          {/* Spirituality Sub-Pills */}
                          <div className="flex gap-1.5">
                            {(['gratidao', 'decretos', 'oracao'] as const).map((sub) => {
                              const labelMap = { gratidao: 'Gratidão', decretos: 'Decretos', oracao: 'Oração' };
                              const iconMap = { 
                                gratidao: <Heart className="h-3 w-3" />, 
                                decretos: <Zap className="h-3 w-3" />, 
                                oracao: <Compass className="h-3 w-3" /> 
                              };
                              return (
                                <button
                                  key={sub}
                                  onClick={() => setActiveSubtopic(sub)}
                                  className={`flex-1 py-1.5 px-2 text-[10px] font-bold rounded-lg border flex items-center justify-center gap-1 transition-all ${
                                    activeSubtopic === sub
                                      ? 'bg-orange-500/10 border-orange-500/30 text-orange-400'
                                      : 'bg-zinc-900/40 border-zinc-800/60 text-gray-400 hover:text-gray-300'
                                  }`}
                                >
                                  {iconMap[sub]}
                                  {labelMap[sub]}
                                </button>
                              );
                            })}
                          </div>

                          {/* Sub-pill Text Input */}
                          <div className="flex-1 flex flex-col space-y-1.5">
                            {activeSubtopic === 'gratidao' && (
                              <div className="flex-1 flex flex-col">
                                <div className="flex justify-between items-center mb-1">
                                  <label className="text-[9px] text-gray-500 font-bold uppercase tracking-wider">
                                    Caderno da Gratidão (Edição Diária)
                                  </label>
                                  <button
                                    type="button"
                                    onClick={() => setGratitudeText(templateGratitude)}
                                    className="text-[9px] text-orange-500 hover:text-orange-400 font-bold transition-colors"
                                    title="Carregar ou restaurar o modelo configurado"
                                  >
                                    Restaurar Modelo
                                  </button>
                                </div>
                                <textarea
                                  value={gratitudeText}
                                  onChange={(e) => setGratitudeText(e.target.value)}
                                  placeholder="Liste o que você é grato hoje..."
                                  className="w-full flex-1 min-h-[140px] bg-zinc-950/40 border border-zinc-800 rounded-xl p-3 text-xs text-white focus:outline-none focus:border-orange-500/50 resize-none font-sans leading-relaxed"
                                />
                              </div>
                            )}

                            {activeSubtopic === 'decretos' && (
                              <div className="flex-1 flex flex-col">
                                <div className="flex justify-between items-center mb-1">
                                  <label className="text-[9px] text-gray-500 font-bold uppercase tracking-wider">
                                    Decretos e Afirmações (Edição Diária)
                                  </label>
                                  <button
                                    type="button"
                                    onClick={() => setDecreesText(templateDecrees)}
                                    className="text-[9px] text-orange-500 hover:text-orange-400 font-bold transition-colors"
                                    title="Carregar ou restaurar o modelo configurado"
                                  >
                                    Restaurar Modelo
                                  </button>
                                </div>
                                <textarea
                                  value={decreesText}
                                  onChange={(e) => setDecreesText(e.target.value)}
                                  placeholder="Declare palavras de vitória..."
                                  className="w-full flex-1 min-h-[140px] bg-zinc-950/40 border border-zinc-800 rounded-xl p-3 text-xs text-white focus:outline-none focus:border-orange-500/50 resize-none font-sans leading-relaxed"
                                />
                              </div>
                            )}

                            {activeSubtopic === 'oracao' && (
                              <div className="flex-1 flex flex-col">
                                <div className="flex justify-between items-center mb-1">
                                  <label className="text-[9px] text-gray-500 font-bold uppercase tracking-wider">
                                    Sua Oração para Hoje (Edição Diária)
                                  </label>
                                  <button
                                    type="button"
                                    onClick={() => setPrayerText(templatePrayer)}
                                    className="text-[9px] text-orange-500 hover:text-orange-400 font-bold transition-colors"
                                    title="Carregar ou restaurar o modelo configurado"
                                  >
                                    Restaurar Modelo
                                  </button>
                                </div>
                                <textarea
                                  value={prayerText}
                                  onChange={(e) => setPrayerText(e.target.value)}
                                  placeholder="Sua oração ou meditação sagrada de hoje..."
                                  className="w-full flex-1 min-h-[140px] bg-zinc-950/40 border border-zinc-800 rounded-xl p-3 text-xs text-white focus:outline-none focus:border-orange-500/50 resize-none font-sans leading-relaxed"
                                />
                              </div>
                            )}
                          </div>
                        </div>
                      ) : activeTopic === 'alteregos' ? (
                        /* ALTER EGOS TOPIC */
                        <div className="space-y-3.5 flex-1 flex flex-col">
                          <div>
                            <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider block">
                              Alter Ego Dominante do Dia
                            </span>
                            <p className="text-[9px] text-zinc-500 mt-0.5 leading-relaxed">
                              Selecione qual lado prevaleceu no dia de hoje: Disciplina/Foco (Alfredo) ou Impulso/Procrastinação (Beto).
                            </p>
                          </div>

                          <div className="grid grid-cols-2 gap-2">
                            <button
                              type="button"
                              onClick={() => setAlterEgoWinner('Alfredo')}
                              className={`py-2.5 px-3 rounded-xl border text-center transition-all flex items-center justify-center gap-2 ${
                                alterEgoWinner === 'Alfredo'
                                  ? 'bg-orange-500/10 border-orange-500/40 text-orange-400 shadow-[0_2px_10px_rgba(249,115,22,0.1)] font-bold'
                                  : 'bg-zinc-950/60 border-zinc-900 text-gray-500 hover:text-gray-300'
                              }`}
                            >
                              <CheckCircle className="h-4 w-4 text-orange-500" />
                              <div className="text-left">
                                <span className="text-[11px] block">Alfredo</span>
                                <span className="text-[8px] text-zinc-500 block font-normal">Disciplina</span>
                              </div>
                            </button>

                            <button
                              type="button"
                              onClick={() => setAlterEgoWinner('Beto')}
                              className={`py-2.5 px-3 rounded-xl border text-center transition-all flex items-center justify-center gap-2 ${
                                alterEgoWinner === 'Beto'
                                  ? 'bg-rose-500/10 border-rose-500/40 text-rose-400 shadow-[0_2px_10px_rgba(244,63,94,0.1)] font-bold'
                                  : 'bg-zinc-950/60 border-zinc-900 text-gray-500 hover:text-gray-300'
                              }`}
                            >
                              <AlertCircle className="h-4 w-4 text-rose-500" />
                              <div className="text-left">
                                <span className="text-[11px] block">Beto</span>
                                <span className="text-[8px] text-zinc-500 block font-normal">Impulso</span>
                              </div>
                            </button>
                          </div>

                          <div className="flex-1 flex flex-col">
                            <label className="text-[9px] text-gray-500 font-bold uppercase tracking-wider mb-1 block">
                              Reflexão Comportamental (Registro Diário)
                            </label>
                            <textarea
                              value={alterEgoText}
                              onChange={(e) => setAlterEgoText(e.target.value)}
                              placeholder="Onde Alfredo foi forte hoje? Em qual momento o Beto tentou tomar o controle?"
                              className="w-full flex-1 min-h-[100px] bg-zinc-950/40 border border-zinc-800 rounded-xl p-3 text-xs text-white focus:outline-none focus:border-orange-500/50 resize-none font-sans leading-relaxed"
                            />
                          </div>
                        </div>
                      ) : activeTopic === 'saude' ? (
                        /* SAÚDE TOPIC */
                        <div className="space-y-4 flex-1 flex flex-col overflow-y-auto max-h-[350px] pr-1 scrollbar-thin">
                          {/* Sleep Section */}
                          <div className="bg-zinc-950/40 border border-zinc-900 rounded-xl p-3.5 space-y-3">
                            <div className="flex items-center gap-2 border-b border-zinc-900 pb-2">
                              <Clock className="h-4 w-4 text-orange-500" />
                              <span className="text-xs font-bold text-white uppercase tracking-wider">
                                Registro de Sono
                              </span>
                            </div>
                            
                            <div className="grid grid-cols-2 gap-3">
                              <div>
                                <label className="text-[10px] text-zinc-400 font-bold block mb-1">
                                  Quando se deitou:
                                </label>
                                <input
                                  type="time"
                                  value={sleepBedTime}
                                  onChange={(e) => setSleepBedTime(e.target.value)}
                                  className="w-full bg-zinc-950 border border-zinc-850 rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-orange-500/50 font-mono"
                                />
                              </div>
                              
                              <div>
                                <label className="text-[10px] text-zinc-400 font-bold block mb-1">
                                  Quando acordou:
                                </label>
                                <input
                                  type="time"
                                  value={sleepWakeTime}
                                  onChange={(e) => setSleepWakeTime(e.target.value)}
                                  className="w-full bg-zinc-950 border border-zinc-850 rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-orange-500/50 font-mono"
                                />
                              </div>
                            </div>

                            {/* Sleep calculation display */}
                            {sleepBedTime && sleepWakeTime && (
                              <div className="mt-2 text-center p-2 bg-orange-500/5 border border-orange-500/10 rounded-lg">
                                <span className="text-[10px] text-zinc-400">Tempo total de sono calculado:</span>
                                <div className="text-sm font-bold text-orange-400 font-mono mt-0.5">
                                  {(() => {
                                    const bedParts = sleepBedTime.split(':').map(Number);
                                    const wakeParts = sleepWakeTime.split(':').map(Number);
                                    if (bedParts.length === 2 && wakeParts.length === 2) {
                                      let bedMin = bedParts[0] * 60 + bedParts[1];
                                      let wakeMin = wakeParts[0] * 60 + wakeParts[1];
                                      if (wakeMin <= bedMin) {
                                        wakeMin += 24 * 60;
                                      }
                                      const diffHr = Math.floor((wakeMin - bedMin) / 60);
                                      const diffMn = (wakeMin - bedMin) % 60;
                                      return `${diffHr}h${diffMn > 0 ? ` ${diffMn}m` : ''}`;
                                    }
                                    return '0h';
                                  })()}
                                </div>
                              </div>
                            )}
                          </div>

                          {/* Food Section */}
                          <div className="bg-zinc-950/40 border border-zinc-900 rounded-xl p-3.5 space-y-3">
                            <div className="flex items-center gap-2 border-b border-zinc-900 pb-2">
                              <BookOpen className="h-4 w-4 text-orange-500" />
                              <span className="text-xs font-bold text-white uppercase tracking-wider">
                                Registro de Alimentação
                              </span>
                            </div>

                            <div className="space-y-2.5">
                              <div>
                                <label className="text-[10px] text-zinc-400 font-bold block mb-1">
                                  Manhã:
                                </label>
                                <input
                                  type="text"
                                  value={foodMorning}
                                  onChange={(e) => setFoodMorning(e.target.value)}
                                  placeholder="Ex: Ovos mexidos, café e banana"
                                  className="w-full bg-zinc-950 border border-zinc-850 rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-orange-500/50"
                                />
                              </div>

                              <div>
                                <label className="text-[10px] text-zinc-400 font-bold block mb-1">
                                  Tarde:
                                </label>
                                <input
                                  type="text"
                                  value={foodAfternoon}
                                  onChange={(e) => setFoodAfternoon(e.target.value)}
                                  placeholder="Ex: Arroz, feijão, frango grelhado e salada"
                                  className="w-full bg-zinc-950 border border-zinc-850 rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-orange-500/50"
                                />
                              </div>

                              <div>
                                <label className="text-[10px] text-zinc-400 font-bold block mb-1">
                                  Noite:
                                </label>
                                <input
                                  type="text"
                                  value={foodNight}
                                  onChange={(e) => setFoodNight(e.target.value)}
                                  placeholder="Ex: Sopa de legumes ou whey com aveia"
                                  className="w-full bg-zinc-950 border border-zinc-850 rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-orange-500/50"
                                />
                              </div>
                            </div>
                          </div>

                          {/* Water Section */}
                          <div className="bg-zinc-950/40 border border-zinc-900 rounded-xl p-3.5 space-y-3">
                            <div className="flex items-center justify-between border-b border-zinc-900 pb-2">
                              <div className="flex items-center gap-2">
                                <Zap className="h-4 w-4 text-blue-500" />
                                <span className="text-xs font-bold text-white uppercase tracking-wider">
                                  Consumo de Água
                                </span>
                              </div>
                              <span className="text-xs font-bold text-blue-400 font-mono">
                                {waterLiters.toFixed(1)} Litros
                              </span>
                            </div>

                            <div className="flex items-center gap-3">
                              <button
                                type="button"
                                onClick={() => setWaterLiters(prev => Math.max(0, parseFloat((prev - 0.25).toFixed(2))))}
                                className="w-10 h-10 bg-zinc-950 border border-zinc-850 rounded-lg flex items-center justify-center text-xs text-zinc-400 hover:text-white transition-colors"
                              >
                                -250ml
                              </button>
                              <div className="flex-1 text-center font-mono font-bold text-zinc-300 text-sm">
                                {waterLiters.toFixed(2)} L
                              </div>
                              <button
                                type="button"
                                onClick={() => setWaterLiters(prev => parseFloat((prev + 0.25).toFixed(2)))}
                                className="w-10 h-10 bg-zinc-900 border border-zinc-800 rounded-lg flex items-center justify-center text-xs text-blue-400 hover:text-blue-300 transition-colors"
                              >
                                +250ml
                              </button>
                              <button
                                type="button"
                                onClick={() => setWaterLiters(prev => parseFloat((prev + 0.50).toFixed(2)))}
                                className="w-10 h-10 bg-zinc-900 border border-blue-900/30 rounded-lg flex items-center justify-center text-xs text-blue-400 hover:text-blue-300 transition-colors"
                              >
                                +500ml
                              </button>
                            </div>
                            
                            {/* Water range / slider option for custom amount */}
                            <div className="space-y-1">
                              <div className="flex justify-between text-[9px] text-zinc-500 font-mono">
                                <span>0L</span>
                                <span>Meta: 3.0L</span>
                                <span>5L</span>
                              </div>
                              <input
                                type="range"
                                min="0"
                                max="5"
                                step="0.1"
                                value={waterLiters}
                                onChange={(e) => setWaterLiters(parseFloat(parseFloat(e.target.value).toFixed(2)))}
                                className="w-full accent-blue-500 bg-zinc-950 border border-zinc-850 rounded-lg h-2"
                              />
                            </div>
                          </div>
                        </div>
                      ) : (
                        /* AGENDA / GOOGLE CALENDAR TOPIC */
                        <div className="space-y-4 flex-1 flex flex-col overflow-y-auto max-h-[350px] pr-1 scrollbar-thin">
                          {!googleToken ? (
                            <div className="flex-1 flex flex-col items-center justify-center text-center p-6 bg-zinc-950/40 border border-zinc-900 rounded-xl space-y-4 min-h-[220px]">
                              <CalendarDays className="h-10 w-10 text-zinc-600" />
                              <div>
                                <h4 className="text-xs font-bold text-white uppercase tracking-wider">Google Agenda Desconectado</h4>
                                <p className="text-[10px] text-zinc-400 mt-1 max-w-[280px] leading-relaxed">
                                  Conecte sua conta do Google para visualizar, adicionar, alterar ou remover eventos do seu Google Agenda diretamente por aqui.
                                </p>
                              </div>
                              <button
                                type="button"
                                onClick={handleGoogleLogin}
                                className="px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white rounded-lg text-xs font-bold transition-all flex items-center gap-1.5"
                              >
                                <LogIn className="h-3.5 w-3.5" />
                                Conectar Google Agenda
                              </button>
                            </div>
                          ) : (
                            <div className="space-y-3.5 flex-1 flex flex-col">
                              {isLoadingEvents && (
                                <div className="text-center py-2 text-[10px] text-orange-400 font-bold flex items-center justify-center gap-1.5 bg-orange-500/5 rounded-lg border border-orange-500/10">
                                  <span className="animate-spin h-3 w-3 border-2 border-orange-500 border-t-transparent rounded-full inline-block"></span>
                                  Sincronizando com o Google Agenda...
                                </div>
                              )}

                              {/* EVENT FORM (ADD OR EDIT) */}
                              {(isAddingGoogleEvent || editingGoogleEventId) ? (
                                <form 
                                  onSubmit={(e) => {
                                    e.preventDefault();
                                    if (editingGoogleEventId) {
                                      handleUpdateGoogleEvent();
                                    } else {
                                      handleAddGoogleEvent();
                                    }
                                  }}
                                  className="bg-zinc-950/60 border border-zinc-900 rounded-xl p-3.5 space-y-3"
                                >
                                  <div className="flex justify-between items-center border-b border-zinc-900 pb-1.5">
                                    <span className="text-[10px] font-bold text-white uppercase tracking-wider">
                                      {editingGoogleEventId ? 'Alterar Evento' : 'Novo Evento no Google'}
                                    </span>
                                    <button
                                      type="button"
                                      onClick={() => {
                                        setIsAddingGoogleEvent(false);
                                        setEditingGoogleEventId(null);
                                      }}
                                      className="text-zinc-500 hover:text-white"
                                    >
                                      <X className="h-4 w-4" />
                                    </button>
                                  </div>

                                  <div className="space-y-2.5">
                                    <div>
                                      <label className="text-[9px] text-zinc-450 font-bold block mb-1">Título do Evento:</label>
                                      <input
                                        type="text"
                                        required
                                        value={googleEventTitle}
                                        onChange={(e) => setGoogleEventTitle(e.target.value)}
                                        placeholder="Ex: Reunião de Planejamento"
                                        className="w-full bg-zinc-950 border border-zinc-850 rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-orange-500/50"
                                      />
                                    </div>

                                    <div>
                                      <label className="text-[9px] text-zinc-450 font-bold block mb-1">Descrição / Notas:</label>
                                      <textarea
                                        value={googleEventDescription}
                                        onChange={(e) => setGoogleEventDescription(e.target.value)}
                                        placeholder="Mais detalhes sobre o compromisso..."
                                        className="w-full bg-zinc-950 border border-zinc-850 rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-orange-500/50 min-h-[60px] resize-none"
                                      />
                                    </div>

                                    <div className="flex items-center gap-2 py-1 select-none">
                                      <input
                                        type="checkbox"
                                        id="googleEventAllDay"
                                        checked={googleEventAllDay}
                                        onChange={(e) => setGoogleEventAllDay(e.target.checked)}
                                        className="accent-orange-500 h-3.5 w-3.5 rounded border-zinc-850 bg-zinc-950"
                                      />
                                      <label htmlFor="googleEventAllDay" className="text-xs text-zinc-300 font-medium cursor-pointer">
                                        Dia Inteiro
                                      </label>
                                    </div>

                                    {!googleEventAllDay && (
                                      <div className="grid grid-cols-2 gap-3.5">
                                        <div>
                                          <label className="text-[9px] text-zinc-450 font-bold block mb-1">Hora de Início:</label>
                                          <input
                                            type="time"
                                            value={googleEventStartTime}
                                            onChange={(e) => setGoogleEventStartTime(e.target.value)}
                                            className="w-full bg-zinc-950 border border-zinc-850 rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-orange-500/50 font-mono"
                                          />
                                        </div>
                                        <div>
                                          <label className="text-[9px] text-zinc-450 font-bold block mb-1">Hora de Fim:</label>
                                          <input
                                            type="time"
                                            value={googleEventEndTime}
                                            onChange={(e) => setGoogleEventEndTime(e.target.value)}
                                            className="w-full bg-zinc-950 border border-zinc-850 rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-orange-500/50 font-mono"
                                          />
                                        </div>
                                      </div>
                                    )}
                                  </div>

                                  <div className="flex gap-2 pt-2.5">
                                    <button
                                      type="button"
                                      onClick={() => {
                                        setIsAddingGoogleEvent(false);
                                        setEditingGoogleEventId(null);
                                      }}
                                      className="flex-1 py-1.5 bg-zinc-900 hover:bg-zinc-850 border border-zinc-800 text-zinc-400 hover:text-white rounded-lg text-xs font-bold transition-all"
                                    >
                                      Cancelar
                                    </button>
                                    <button
                                      type="submit"
                                      className="flex-1 py-1.5 bg-orange-500 hover:bg-orange-600 text-white rounded-lg text-xs font-bold transition-all"
                                    >
                                      {editingGoogleEventId ? 'Salvar Alterações' : 'Criar Evento'}
                                    </button>
                                  </div>
                                </form>
                              ) : (
                                <div className="space-y-3">
                                  {/* BUTTON TO ADD EVENT */}
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setIsAddingGoogleEvent(true);
                                      setEditingGoogleEventId(null);
                                      setGoogleEventTitle('');
                                      setGoogleEventDescription('');
                                      setGoogleEventAllDay(false);
                                      setGoogleEventStartTime('09:00');
                                      setGoogleEventEndTime('10:00');
                                    }}
                                    className="w-full py-2 bg-zinc-950 border border-dashed border-zinc-800 hover:border-orange-500/50 hover:bg-zinc-950/60 text-zinc-400 hover:text-white text-xs font-bold rounded-xl flex items-center justify-center gap-1.5 transition-all"
                                  >
                                    <Plus className="h-4 w-4 text-orange-500" />
                                    Adicionar Evento ao Google Agenda
                                  </button>

                                  {/* LIST DAILY EVENTS */}
                                  <div className="space-y-2.5">
                                    <span className="text-[10px] text-gray-500 font-bold uppercase tracking-wider block">
                                      Eventos Sincronizados deste Dia
                                    </span>

                                    {(() => {
                                      const googleDayEvents = getEventsForDay(selectedDateStr).filter(ev => ev.isGoogle);
                                      
                                      if (googleDayEvents.length === 0) {
                                        return (
                                          <div className="text-center py-6 bg-zinc-950/20 border border-zinc-900/60 rounded-xl">
                                            <p className="text-[10px] text-zinc-500">Nenhum evento do Google Agenda para esta data.</p>
                                          </div>
                                        );
                                      }

                                      const formatGoogleEventTime = (ev: any) => {
                                        if (ev.start?.date) return 'Dia Inteiro';
                                        if (ev.start?.dateTime) {
                                          const start = new Date(ev.start.dateTime);
                                          const end = ev.end?.dateTime ? new Date(ev.end.dateTime) : null;
                                          const pad = (n: number) => String(n).padStart(2, '0');
                                          const startStr = `${pad(start.getHours())}:${pad(start.getMinutes())}`;
                                          if (end) {
                                            const endStr = `${pad(end.getHours())}:${pad(end.getMinutes())}`;
                                            return `${startStr} - ${endStr}`;
                                          }
                                          return startStr;
                                        }
                                        return 'Sem Horário';
                                      };

                                      return (
                                        <div className="space-y-2">
                                          {googleDayEvents.map(ev => {
                                            const rawEv = (ev as any).rawGoogleEvent;
                                            return (
                                              <div 
                                                key={ev.id} 
                                                className="group bg-zinc-950/40 border border-zinc-900 hover:border-zinc-800 rounded-xl p-3 flex items-start justify-between gap-3 transition-all"
                                              >
                                                <div className="space-y-1 min-w-0 flex-1">
                                                  <div className="flex items-center gap-1.5 flex-wrap">
                                                    <span className="text-xs font-bold text-white truncate">{ev.name}</span>
                                                    <span className="text-[9px] bg-orange-500/10 text-orange-400 px-1.5 py-0.5 rounded border border-orange-500/20 font-bold uppercase tracking-wider scale-95 origin-left">
                                                      Google
                                                    </span>
                                                  </div>
                                                  
                                                  <div className="flex items-center gap-1.5 text-[10px] text-zinc-450 font-mono">
                                                    <Clock className="h-3 w-3 text-orange-500" />
                                                    <span>{rawEv ? formatGoogleEventTime(rawEv) : 'Dia Inteiro'}</span>
                                                  </div>

                                                  {ev.description && (
                                                    <p className="text-[10px] text-zinc-400 leading-relaxed font-sans mt-1 bg-zinc-950/50 p-1.5 rounded border border-zinc-900/40">
                                                      {ev.description}
                                                    </p>
                                                  )}
                                                </div>

                                                <div className="flex items-center gap-1 shrink-0 opacity-80 group-hover:opacity-100 transition-opacity">
                                                  <button
                                                    type="button"
                                                    onClick={() => {
                                                      if (rawEv) {
                                                        handleStartEditGoogleEvent(rawEv);
                                                      }
                                                    }}
                                                    className="p-1.5 text-zinc-500 hover:text-orange-500 hover:bg-zinc-900 rounded-lg transition-all"
                                                    title="Editar evento"
                                                  >
                                                    <Edit2 className="h-3.5 w-3.5" />
                                                  </button>
                                                  <button
                                                    type="button"
                                                    onClick={() => handleDeleteGoogleEvent(ev.id)}
                                                    className="p-1.5 text-zinc-500 hover:text-red-500 hover:bg-zinc-900 rounded-lg transition-all"
                                                    title="Excluir evento"
                                                  >
                                                    <Trash2 className="h-3.5 w-3.5" />
                                                  </button>
                                                </div>
                                              </div>
                                            );
                                          })}
                                        </div>
                                      );
                                    })()}
                                  </div>
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      )}
                    </div>

                    {/* Bottom Save Area */}
                    <div className="pt-3 border-t border-zinc-800 flex items-center justify-between">
                      <span className="text-[10px] text-gray-500 font-mono">
                        {savingStatus === 'saving' && (
                          <span className="text-orange-400 flex items-center gap-1">
                            <span className="animate-ping h-1.5 w-1.5 rounded-full bg-orange-400 inline-block"></span>
                            Salvando no banco...
                          </span>
                        )}
                        {savingStatus === 'saved' && (
                          <span className="text-green-500 flex items-center gap-1 font-bold">
                            <Check className="h-3 w-3" /> Alterações salvas!
                          </span>
                        )}
                        {savingStatus === 'idle' && (
                          <span className="text-zinc-600">Edição em tempo real</span>
                        )}
                      </span>

                      <button
                        onClick={handleSaveCurrentRecord}
                        className="bg-orange-500 hover:bg-orange-600 text-white font-bold text-xs px-4 py-2 rounded-lg flex items-center gap-1.5 transition-colors shadow-lg shadow-orange-500/10"
                      >
                        <Save className="h-3.5 w-3.5" /> Salvar Alterações
                      </button>
                    </div>

                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>

              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      </div>

      {/* O que vem por aí (Future Events Planner - Enhanced Notion Style) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 mt-6 text-left">
        {/* Left Panel: Table or Cards */}
        <div className="lg:col-span-8 bg-[#0a0a0d] border border-zinc-800/90 rounded-2xl p-5 relative overflow-hidden shadow-2xl">
          
          {/* Header Bar matching image design */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-zinc-800/80 pb-4 mb-4">
            
            {/* Left side: View switcher tabs in dark capsule */}
            <div className="flex items-center gap-3">
              <div className="flex items-center bg-[#121216] border border-zinc-800/90 p-1 rounded-xl">
                <button
                  onClick={() => setUpcomingView('table')}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                    upcomingView === 'table'
                      ? 'bg-zinc-800/90 text-white shadow'
                      : 'text-zinc-400 hover:text-zinc-200'
                  }`}
                >
                  <Table className="h-3.5 w-3.5 text-zinc-300" />
                  Tabela
                </button>
                <button
                  onClick={() => setUpcomingView('calendar')}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                    upcomingView === 'calendar'
                      ? 'bg-zinc-800/90 text-white shadow'
                      : 'text-zinc-400 hover:text-zinc-200'
                  }`}
                >
                  <CalendarDays className="h-3.5 w-3.5 text-zinc-300" />
                  Calendário
                </button>
              </div>
            </div>

            {/* Right side: Action toolbar icons & Primary Blue Button */}
            <div className="flex items-center gap-1.5 self-end md:self-auto">
              <button 
                onClick={() => setFilterTagUpcoming(filterTagUpcoming === 'Todas' ? 'ANIVERSÁRIO' : 'Todas')}
                className="p-1.5 text-zinc-400 hover:text-white hover:bg-zinc-800/60 rounded-lg transition-colors"
                title="Filtrar"
              >
                <Sliders className="h-4 w-4" />
              </button>
              <button 
                className="p-1.5 text-zinc-400 hover:text-white hover:bg-zinc-800/60 rounded-lg transition-colors"
                title="Ordenar"
              >
                <ArrowUpDown className="h-4 w-4" />
              </button>
              <button 
                className="p-1.5 text-zinc-400 hover:text-white hover:bg-zinc-800/60 rounded-lg transition-colors"
                title="Ação Rápida"
              >
                <Zap className="h-4 w-4" />
              </button>
              <button 
                className="p-1.5 text-zinc-400 hover:text-white hover:bg-zinc-800/60 rounded-lg transition-colors"
                title="Destaques AI"
              >
                <Sparkles className="h-4 w-4 text-amber-400/80" />
              </button>
              <button 
                className="p-1.5 text-zinc-400 hover:text-white hover:bg-zinc-800/60 rounded-lg transition-colors"
                title="Buscar"
              >
                <Search className="h-4 w-4" />
              </button>
              <button 
                className="p-1.5 text-zinc-400 hover:text-white hover:bg-zinc-800/60 rounded-lg transition-colors"
                title="Expandir"
              >
                <Maximize2 className="h-4 w-4" />
              </button>
              <button 
                className="p-1.5 text-zinc-400 hover:text-white hover:bg-zinc-800/60 rounded-lg transition-colors"
                title="Opções"
              >
                <MoreHorizontal className="h-4 w-4" />
              </button>

              {/* Blue Primary Button "Nova v" */}
              <button
                onClick={() => {
                  const name = prompt("Nome do novo evento:");
                  if (name) {
                    const date = prompt("Data do evento (AAAA-MM-DD):", getTodayDateStr());
                    if (date) {
                      setFutureEvents(prev => [...prev, {
                        id: 'fe-' + Math.random().toString(36).substring(2, 9),
                        name,
                        date,
                        tags: ['Viagem']
                      }].sort((a, b) => a.date.localeCompare(b.date)));
                    }
                  }
                }}
                className="bg-[#1d4ed8] hover:bg-[#2563eb] text-white text-xs font-extrabold px-3.5 py-1.5 rounded-lg flex items-center gap-1 shadow-md shadow-blue-600/20 transition-all ml-1 cursor-pointer"
              >
                <Plus className="h-3.5 w-3.5" />
                Nova
                <ChevronDown className="h-3 w-3 ml-0.5 opacity-80" />
              </button>
            </div>
          </div>

          {/* Sub-bar: Filters & Google Agenda Sync button */}
          <div className="flex flex-wrap items-center justify-between gap-3 pb-3 mb-2 text-xs border-b border-zinc-800/50">
            <div className="flex items-center gap-2">
              <span className="text-zinc-400 font-semibold flex items-center gap-1.5 bg-zinc-900/80 px-2.5 py-1 rounded-md border border-zinc-800">
                <CalendarDays className="h-3.5 w-3.5 text-zinc-400" /> Date
                <ChevronDown className="h-3 w-3 text-zinc-500" />
              </span>
              <button 
                onClick={handleSyncNext5GoogleEvents}
                disabled={isSyncingGoogle5}
                className="flex items-center gap-1.5 px-3 py-1 rounded-md bg-orange-500/10 hover:bg-orange-500/20 border border-orange-500/30 text-orange-400 font-bold text-[11px] transition-all cursor-pointer"
                title="Buscar próximos 5 eventos do Google Agenda"
              >
                <RefreshCw className={`h-3.5 w-3.5 ${isSyncingGoogle5 ? 'animate-spin' : ''}`} />
                {isSyncingGoogle5 ? 'Buscando...' : 'Puxar Próximos 5 da Agenda Google'}
              </button>
            </div>

            {freeEditMode && (
              <span className="text-[11px] font-mono text-emerald-400/90 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded">
                ⚡ Edição Livre Ativa (Clique para alterar inline)
              </span>
            )}
          </div>

          {upcomingView === 'table' ? (
            <div className="space-y-4">
              <div className="overflow-x-auto rounded-xl border border-zinc-800/80 bg-zinc-950/40">
                <table className="w-full text-left text-xs text-zinc-300 divide-y divide-zinc-800/70 border-collapse">
                  <thead>
                    <tr className="bg-[#111115] text-zinc-400 font-bold text-[11px] tracking-wide uppercase">
                      <th className="py-2.5 px-3 border-r border-zinc-800/60 min-w-[200px]">
                        <span className="flex items-center gap-1.5">
                          <span className="text-zinc-500 font-serif lowercase">Aa</span>
                          Nome do Evento
                        </span>
                      </th>
                      <th className="py-2.5 px-3 border-r border-zinc-800/60 min-w-[170px]">
                        <span className="flex items-center gap-1.5">
                          <CalendarDays className="h-3.5 w-3.5 text-zinc-400" />
                          Data
                        </span>
                      </th>
                      <th className="py-2.5 px-3 border-r border-zinc-800/60 min-w-[140px]">
                        <span className="flex items-center gap-1.5">
                          <Tag className="h-3.5 w-3.5 text-zinc-400" />
                          Tags
                        </span>
                      </th>
                      <th className="py-2.5 px-2 text-center w-10 border-r border-zinc-800/60 text-zinc-500">
                        +
                      </th>
                      <th className="py-2.5 px-2 text-right w-12 text-zinc-500">
                        ...
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-800/50 bg-[#0c0c0f]">
                    {futureEvents.map(ev => {
                      const isEditing = editingEventId === ev.id;
                      return (
                        <tr key={ev.id} className="hover:bg-zinc-900/40 transition-colors group">
                          {/* Name + ABRIR button */}
                          <td className="py-2.5 px-3 border-r border-zinc-800/60 font-semibold text-white">
                            {isEditing ? (
                              <input
                                type="text"
                                value={editEventName}
                                onChange={(e) => setEditEventName(e.target.value)}
                                className="w-full bg-zinc-900 border border-zinc-700 rounded px-2 py-1 text-white text-xs focus:outline-none focus:border-blue-500"
                              />
                            ) : (
                              <div className="flex items-center justify-between gap-2">
                                <div className="flex items-center gap-2 min-w-0">
                                  <FileText className="h-3.5 w-3.5 text-zinc-400 shrink-0" />
                                  <span 
                                    className="truncate cursor-pointer hover:text-blue-400"
                                    onClick={() => freeEditMode ? handleStartEditEvent(ev) : setOpenModalEvent(ev)}
                                  >
                                    {ev.name}
                                  </span>
                                </div>
                                <button
                                  onClick={() => setOpenModalEvent(ev)}
                                  className="px-2 py-0.5 bg-[#18181b] hover:bg-zinc-800 border border-zinc-700/80 text-[10px] font-bold font-mono text-zinc-300 hover:text-white rounded uppercase tracking-wider shrink-0 transition-all shadow-sm cursor-pointer"
                                >
                                  ABRIR
                                </button>
                              </div>
                            )}
                          </td>

                          {/* Date formatted as 10 de dezembro de 2026 */}
                          <td className="py-2.5 px-3 border-r border-zinc-800/60 text-zinc-300 font-medium">
                            {isEditing ? (
                              <input
                                type="date"
                                value={editEventDate}
                                onChange={(e) => setEditEventDate(e.target.value)}
                                className="bg-zinc-900 border border-zinc-700 rounded px-2 py-1 text-white text-xs focus:outline-none focus:border-blue-500"
                              />
                            ) : (
                              <span 
                                className="cursor-pointer hover:text-white"
                                onClick={() => freeEditMode && handleStartEditEvent(ev)}
                              >
                                {formatEventDateLong(ev.date)}
                              </span>
                            )}
                          </td>

                          {/* Tags pill badge */}
                          <td className="py-2.5 px-3 border-r border-zinc-800/60">
                            {isEditing ? (
                              <select
                                value={editEventTag}
                                onChange={(e) => setEditEventTag(e.target.value)}
                                className="bg-zinc-900 border border-zinc-700 rounded px-2 py-1 text-white text-xs focus:outline-none focus:border-blue-500"
                              >
                                {TAG_OPTIONS.map(opt => (
                                  <option key={opt} value={opt}>{opt}</option>
                                ))}
                              </select>
                            ) : (
                              <span 
                                className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] uppercase tracking-wider font-extrabold border ${getTagColor(ev.tags[0])} shadow-sm cursor-pointer`}
                                onClick={() => freeEditMode && handleStartEditEvent(ev)}
                              >
                                {ev.tags[0] || 'Viagem'}
                              </span>
                            )}
                          </td>

                          {/* Add property icon column */}
                          <td className="py-2.5 px-2 text-center border-r border-zinc-800/60 text-zinc-600 hover:text-zinc-300 cursor-pointer">
                            +
                          </td>

                          {/* Actions column */}
                          <td className="py-2.5 px-2 text-right">
                            {isEditing ? (
                              <div className="flex justify-end gap-1">
                                <button
                                  onClick={() => handleSaveEditEvent(ev.id)}
                                  className="p-1 text-emerald-400 hover:bg-emerald-500/10 rounded"
                                  title="Salvar"
                                >
                                  <Check className="h-3.5 w-3.5" />
                                </button>
                                <button
                                  onClick={() => setEditingEventId(null)}
                                  className="p-1 text-rose-400 hover:bg-rose-500/10 rounded"
                                  title="Cancelar"
                                >
                                  <X className="h-3.5 w-3.5" />
                                </button>
                              </div>
                            ) : (
                              <div className="flex justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                <button
                                  onClick={() => handleStartEditEvent(ev)}
                                  className="p-1 text-zinc-400 hover:text-white rounded"
                                  title="Editar"
                                >
                                  <Edit2 className="h-3.5 w-3.5" />
                                </button>
                                <button
                                  onClick={() => handleDeleteFutureEvent(ev.id)}
                                  className="p-1 text-zinc-400 hover:text-rose-400 rounded"
                                  title="Excluir"
                                >
                                  <Trash2 className="h-3.5 w-3.5" />
                                </button>
                              </div>
                            )}
                          </td>
                        </tr>
                      );
                    })}

                    {/* Inline "+ Nova linha" bottom row matching Notion */}
                    <tr className="bg-[#0a0a0d] hover:bg-zinc-900/30 transition-colors">
                      <td colSpan={5} className="p-0">
                        <form onSubmit={handleAddFutureEvent} className="flex items-center gap-2 px-3 py-2 text-xs text-zinc-500">
                          <Plus className="h-3.5 w-3.5 text-zinc-500" />
                          <input
                            type="text"
                            placeholder="Nova linha..."
                            value={newEventName}
                            onChange={(e) => setNewEventName(e.target.value)}
                            className="bg-transparent border-none text-white text-xs placeholder-zinc-500 focus:outline-none flex-1 py-1"
                          />
                          <input
                            type="date"
                            value={newEventDate}
                            onChange={(e) => setNewEventDate(e.target.value)}
                            className="bg-zinc-900/90 border border-zinc-800 rounded px-2 py-1 text-white text-xs focus:outline-none"
                          />
                          <select
                            value={newEventTag}
                            onChange={(e) => setNewEventTag(e.target.value)}
                            className="bg-zinc-900/90 border border-zinc-800 rounded px-2 py-1 text-zinc-300 text-xs focus:outline-none"
                          >
                            {TAG_OPTIONS.map(opt => (
                              <option key={opt} value={opt}>{opt}</option>
                            ))}
                          </select>
                          <button
                            type="submit"
                            className="bg-blue-600 hover:bg-blue-500 text-white text-[11px] font-bold px-3 py-1 rounded transition-colors"
                          >
                            Adicionar
                          </button>
                        </form>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          ) : (
            /* Cards View */
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {futureEvents.map(ev => {
                // Inline remaining calculation inside renderer
                const getDaysRemaining = (targetDateStr: string) => {
                  const today = new Date();
                  today.setHours(0, 0, 0, 0);
                  const target = new Date(targetDateStr + 'T00:00:00');
                  target.setHours(0, 0, 0, 0);
                  const diffTime = target.getTime() - today.getTime();
                  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
                };

                const days = getDaysRemaining(ev.date);
                let countdownLabel = '';
                let countdownColor = 'bg-orange-500/10 text-orange-400 border-orange-500/20';
                
                if (days === 0) {
                  countdownLabel = 'Hoje!';
                  countdownColor = 'bg-rose-500/20 text-rose-400 border-rose-500/30 animate-pulse';
                } else if (days === 1) {
                  countdownLabel = 'Amanhã';
                  countdownColor = 'bg-amber-500/20 text-amber-400 border-amber-500/30';
                } else if (days < 0) {
                  countdownLabel = `Passou há ${Math.abs(days)} d`;
                  countdownColor = 'bg-zinc-900 text-zinc-500 border-zinc-800';
                } else {
                  countdownLabel = `Faltam ${days} dias`;
                }

                return (
                  <div key={ev.id} className="p-4 bg-zinc-950/30 border border-zinc-850/80 hover:border-zinc-800 rounded-2xl flex flex-col justify-between gap-4 group relative transition-all duration-300">
                    <div className="flex justify-between items-start gap-2">
                      <div>
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[9px] font-bold border ${getTagColor(ev.tags[0])} mb-2.5`}>
                          {ev.tags[0]}
                        </span>
                        <h3 className="text-sm font-bold text-white tracking-tight leading-snug group-hover:text-orange-400 transition-colors">
                          {ev.name}
                        </h3>
                      </div>
                      
                      <button
                        onClick={() => handleDeleteFutureEvent(ev.id)}
                        className="opacity-0 group-hover:opacity-100 p-1.5 text-zinc-500 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition-all"
                        title="Excluir"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>

                    <div className="flex justify-between items-center text-xs border-t border-zinc-850/60 pt-3.5 mt-1">
                      <span className="text-zinc-500 font-mono">
                        {new Date(ev.date + 'T00:00:00').toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' })}
                      </span>
                      <span className={`px-2.5 py-1 rounded-lg text-[9px] font-extrabold border ${countdownColor}`}>
                        {countdownLabel}
                      </span>
                    </div>
                  </div>
                );
              })}
              {futureEvents.length === 0 && (
                <div className="col-span-full py-12 text-center text-zinc-500">
                  Nenhum evento futuro cadastrado. Use a aba "Tabela" para planejar!
                </div>
              )}
            </div>
          )}
        </div>

        {/* Right Panel: Stoic Quote & Image */}
        <div className="lg:col-span-4 bg-gradient-to-b from-[#111115]/80 to-[#0c0c10]/80 border border-zinc-800 rounded-3xl p-6 flex flex-col justify-between relative overflow-hidden min-h-[380px]">
          {/* Subtle geometric grid background */}
          <div className="absolute inset-0 bg-[radial-gradient(#1c1c24_1px,transparent_1px)] [background-size:16px_16px] opacity-20 pointer-events-none" />
          
          {/* Heading */}
          <div className="relative z-10 text-left w-full">
            <span className="text-[10px] font-bold text-zinc-500 tracking-widest uppercase block mb-1">VISÃO DE LONGO PRAZO</span>
            <h3 className="text-sm font-extrabold text-white tracking-tight flex items-center gap-1.5">
              <Sparkles className="h-3.5 w-3.5 text-amber-500" /> O Futuro nos Pertence
            </h3>
          </div>

          {/* The Beautiful Engraving Art */}
          <div className="relative w-full my-4 flex-1 flex items-center justify-center">
            <div className="relative group rounded-2xl overflow-hidden border border-zinc-800/80 shadow-2xl shadow-orange-500/5 aspect-[4/3] w-full max-w-[240px]">
              {/* Amber-gold thin border frame inside */}
              <div className="absolute inset-1.5 border border-amber-500/10 rounded-[10px] pointer-events-none z-10 transition-colors group-hover:border-amber-500/20" />
              
              {/* Soft radial golden gradient glow behind */}
              <div className="absolute inset-0 bg-gradient-to-t from-orange-950/20 to-transparent pointer-events-none mix-blend-color-burn" />

              <img
                src={classicalLightEngraving}
                alt="Visão Clássica do Amanhã"
                className="w-full h-full object-cover grayscale opacity-90 group-hover:scale-105 transition-transform duration-700"
                referrerPolicy="no-referrer"
              />
            </div>
          </div>

          {/* The Stoic Quote */}
          <div className="relative z-10 text-center w-full">
            <p className="text-[11px] leading-relaxed text-zinc-400 italic font-medium px-2">
              "A felicidade e a liberdade começam com a clara compreensão de uma coisa: algumas coisas estão sob nosso controle e outras não. Planeje com ousadia."
            </p>
            <span className="text-[9px] text-amber-500 font-mono mt-1.5 block tracking-widest uppercase">— Epicteto</span>
          </div>
        </div>
      </div>

      {/* Future Event Detail Modal (ABRIR) */}
      <AnimatePresence>
        {openModalEvent && (
          <div 
            onClick={() => setOpenModalEvent(null)}
            className="fixed inset-0 z-[9999] bg-[#040405]/90 backdrop-blur-sm flex items-center justify-center p-4 cursor-pointer"
          >
            <motion.div
              onClick={(e) => e.stopPropagation()}
              initial={{ scale: 0.95, opacity: 0, y: 15 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 15 }}
              className="cursor-default bg-[#0e0e12] border border-zinc-800 rounded-2xl w-full max-w-lg p-6 my-auto shadow-2xl text-left relative"
            >
              <div className="flex justify-between items-start mb-4 border-b border-zinc-800/80 pb-3">
                <div className="flex items-center gap-2">
                  <FileText className="h-4 w-4 text-blue-400" />
                  <h3 className="text-sm font-extrabold text-white tracking-tight">Detalhes do Evento</h3>
                </div>
                <button
                  onClick={() => setOpenModalEvent(null)}
                  className="p-1 text-zinc-400 hover:text-white hover:bg-zinc-800 rounded-lg transition-colors cursor-pointer"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              <div className="space-y-4 text-xs">
                <div>
                  <label className="block text-[11px] font-bold text-zinc-400 mb-1">Nome do Evento</label>
                  <input
                    type="text"
                    value={openModalEvent.name}
                    onChange={(e) => setOpenModalEvent({ ...openModalEvent, name: e.target.value })}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-white font-semibold focus:outline-none focus:border-blue-500"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-bold text-zinc-400 mb-1">Data Prevista</label>
                    <input
                      type="date"
                      value={openModalEvent.date}
                      onChange={(e) => setOpenModalEvent({ ...openModalEvent, date: e.target.value })}
                      className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-white font-medium focus:outline-none focus:border-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-zinc-400 mb-1">Tag / Categoria</label>
                    <select
                      value={openModalEvent.tags[0] || 'Viagem'}
                      onChange={(e) => setOpenModalEvent({ ...openModalEvent, tags: [e.target.value] })}
                      className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-white font-medium focus:outline-none focus:border-blue-500"
                    >
                      {TAG_OPTIONS.map(opt => (
                        <option key={opt} value={opt}>{opt}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-zinc-400 mb-1">Data Formatada</label>
                  <p className="text-zinc-300 font-medium bg-zinc-950/60 p-2.5 rounded-lg border border-zinc-800/80">
                    📅 {formatEventDateLong(openModalEvent.date)}
                  </p>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-zinc-400 mb-1">Ações do Evento</label>
                  <div className="flex flex-wrap gap-2 pt-1">
                    <button
                      onClick={() => {
                        setFutureEvents(prev => prev.map(ev => ev.id === openModalEvent.id ? openModalEvent : ev));
                        setOpenModalEvent(null);
                        addXp(10);
                      }}
                      className="flex-1 bg-blue-600 hover:bg-blue-500 text-white font-bold py-2 px-4 rounded-lg flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                    >
                      <Save className="h-3.5 w-3.5" /> Salvar Alterações
                    </button>
                    <button
                      onClick={() => {
                        handleDeleteFutureEvent(openModalEvent.id);
                        setOpenModalEvent(null);
                      }}
                      className="bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/30 font-bold py-2 px-3 rounded-lg transition-colors cursor-pointer"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Weekly Review Modal Overlay */}
      <AnimatePresence>
        {isWeeklyReviewOpen && (
          <div 
            onClick={() => setIsWeeklyReviewOpen(false)}
            className="fixed inset-0 z-50 bg-[#040405]/95 backdrop-blur-md flex items-center justify-center p-4 md:p-6 overflow-hidden cursor-pointer"
          >
            <motion.div
              onClick={(e) => e.stopPropagation()}
              initial={{ scale: 0.95, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 20 }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              className="cursor-default bg-[#0a0a0c] border border-zinc-800 rounded-3xl w-full max-w-6xl h-full max-h-[85vh] flex flex-col overflow-hidden shadow-2xl shadow-orange-500/5 text-left"
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
                    {weekReviewSavingStatus === 'saving' ? 'Salvando...' : 'Salvar na Agenda'}
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
          <div 
            onClick={() => setIsReviewOpen(false)}
            className="fixed inset-0 z-50 bg-[#040405]/95 backdrop-blur-md flex items-center justify-center p-4 md:p-6 overflow-hidden cursor-pointer"
          >
            <motion.div
              onClick={(e) => e.stopPropagation()}
              initial={{ scale: 0.95, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 20 }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              className="cursor-default bg-[#0a0a0c] border border-zinc-800 rounded-3xl w-full max-w-6xl h-full max-h-[85vh] flex flex-col overflow-hidden shadow-2xl shadow-orange-500/5"
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
                  onClick={() => setIsReviewOpen(false)}
                  className="p-1.5 bg-zinc-900 hover:bg-zinc-800 text-zinc-400 hover:text-white rounded-xl border border-zinc-800 transition-colors"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              {/* Modal Body (Dual Column Scrollable) */}
              <div className="flex-1 overflow-y-auto p-4 md:p-6 grid grid-cols-1 lg:grid-cols-12 gap-6 scrollbar-thin text-left">
                
                {/* Left Form: Reflection Fields */}
                <div className="lg:col-span-7 space-y-5">
                  
                  {/* One sentence summary */}
                  <div className="space-y-2 bg-[#0d0d10]/40 border border-zinc-900 rounded-2xl p-4 text-left">
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
                  <div className="space-y-3 bg-[#0d0d10]/40 border border-zinc-900 rounded-2xl p-4 text-left">
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
                              onClick={() => setReviewMemorableMoments(prev => prev.filter((_, i) => i !== idx))}
                              className="text-zinc-600 hover:text-red-500 p-1 rounded transition-colors lg:opacity-0 group-hover:opacity-100 shrink-0"
                              title="Remover"
                            >
                              <Trash2 className="h-3 w-3" />
                            </button>
                          </div>
                        ))
                      )}
                    </div>
                  </div>

                  {/* Aprendizados */}
                  <div className="space-y-3 bg-[#0d0d10]/40 border border-zinc-900 rounded-2xl p-4 text-left">
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
                              onClick={() => setReviewLearnings(prev => prev.filter((_, i) => i !== idx))}
                              className="text-zinc-600 hover:text-red-500 p-1 rounded transition-colors lg:opacity-0 group-hover:opacity-100 shrink-0"
                              title="Remover"
                            >
                              <Trash2 className="h-3 w-3" />
                            </button>
                          </div>
                        ))
                      )}
                    </div>
                  </div>

                  {/* Melhorar */}
                  <div className="space-y-3 bg-[#0d0d10]/40 border border-zinc-900 rounded-2xl p-4 text-left">
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
                              onClick={() => setReviewImprovements(prev => prev.filter((_, i) => i !== idx))}
                              className="text-zinc-600 hover:text-red-500 p-1 rounded transition-colors lg:opacity-0 group-hover:opacity-100 shrink-0"
                              title="Remover"
                            >
                              <Trash2 className="h-3 w-3" />
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
                  <div className="flex-1 overflow-y-auto p-4 space-y-4 scrollbar-thin text-left">
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
                            <BookOpen className="h-8 w-8 text-zinc-700 animate-pulse" />
                            <h4 className="text-xs font-bold text-zinc-400">Nenhum registro encontrado</h4>
                            <p className="text-[10px] text-zinc-500 max-w-[200px]">Os diários diários e logs da Agenda de {months[reviewMonth]} aparecerão aqui para ajudar você a refletir!</p>
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
                                <p className="text-[11px] text-gray-300 leading-relaxed italic bg-zinc-950/40 p-2 rounded-lg border border-zinc-900/60">
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
                    <span className="text-xs font-bold text-white block">Evolução Mental</span>
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
                        Salvar Reflexão
                      </>
                    )}
                  </button>
                </div>
              </div>

            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}
