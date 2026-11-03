import React, { useState, useEffect, useRef } from 'react';
import { sendSystemNotification } from '../lib/notificationHelper';
import { 
  LayoutDashboard, 
  CheckSquare, 
  Clock, 
  Target, 
  DollarSign, 
  Calendar, 
  Archive, 
  BookOpen,
  Zap,
  Flame,
  Award,
  Search,
  Menu,
  X,
  Settings,
  Trophy,
  FileText,
  Pin,
  CheckCircle,
  HelpCircle,
  Book,
  Heart,
  Maximize,
  Minimize,
  Download,
  Smartphone,
  Laptop,
  Cloud,
  RefreshCw,
  CloudOff,
  Database,
  Wifi,
  Check,
  Copy,
  Compass,
  User,
  Layers,
  Lock,
  Bell,
  Timer,
  LogOut,
  FolderKanban,
  Bot,
  Sun,
  Moon
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { QuickReminder } from '../types';
import { PomodoroIcon } from './icons/PomodoroIcon';

interface SidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  xpTotal: number;
  streak: number;
  level: number;
  pinned?: boolean;
  setPinned?: (pinned: boolean) => void;
  syncKey: string;
  syncStatus: 'idle' | 'syncing' | 'synced' | 'error';
  connectSyncKey: (key: string) => Promise<void>;
  disconnectSync: () => void;
  userName?: string;
  userPhoto?: string;
  onLockApp?: () => void;
  appLockEnabled?: boolean;
  onLogout?: () => void;
  currentUser?: any;
  onAddReminder?: (reminder: QuickReminder) => void;
  onOpenStreakHub?: () => void;
  onOpenRankingModal?: () => void;
  mobileNavbarMode?: 'fixed' | 'flexible';
  mobileNavbarShape?: 'oval' | 'reta';
  themeMode?: 'dark' | 'light';
  onToggleThemeMode?: () => void;
}

interface SearchResult {
  id: string;
  title: string;
  description: string;
  category: 'Tarefa' | 'Rotina' | 'Meta' | 'Nota' | 'Documento' | 'Calendário';
  tab: string;
}

function Sidebar({ 
  activeTab, 
  setActiveTab, 
  xpTotal, 
  streak, 
  level,
  pinned = true,
  setPinned,
  syncKey,
  syncStatus,
  connectSyncKey,
  disconnectSync,
  userName = 'Nando',
  userPhoto = 'https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?q=80&w=100',
  onLockApp,
  appLockEnabled = false,
  onLogout,
  currentUser,
  onAddReminder,
  onOpenStreakHub,
  onOpenRankingModal,
  mobileNavbarMode = 'fixed',
  mobileNavbarShape = 'oval',
  themeMode = 'dark',
  onToggleThemeMode
}: SidebarProps) {
  
  // Animation/HUD state
  const [isHovered, setIsHovered] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchFilter, setSearchFilter] = useState<string>('todos');
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [showLanguageDropdown, setShowLanguageDropdown] = useState(false);

  // Mobile navbar visibility (fixed vs flexible on scroll down / up)
  const [isMobileNavHidden, setIsMobileNavHidden] = useState(false);
  const lastScrollYRef = useRef(0);
  const navScrollTouchStartYRef = useRef<number | null>(null);

  const searchInputRef = useRef<HTMLInputElement>(null);

  // Fullscreen state
  const [isFullscreen, setIsFullscreen] = useState(false);
  
  // PWA states
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [showInstallModal, setShowInstallModal] = useState(false);

  // Long-press state for mobile navbar "Notas" tab
  const [radialMenuOpen, setRadialMenuOpen] = useState(false);
  const [selectedShortcut, setSelectedShortcut] = useState<'timer' | 'cronometro' | 'pomodoro' | 'lembretes'>('timer');
  const [pressProgress, setPressProgress] = useState(0);
  const longPressTimerRef = useRef<any>(null);
  const progressAnimRef = useRef<any>(null);
  const pressStartTsRef = useRef<number>(0);
  const touchStartYRef = useRef<number | null>(null);

  // Quick Modal state for Timer, Cronômetro & Pomodoro
  const [quickModalType, setQuickModalType] = useState<'timer' | 'cronometer' | 'pomodoro' | null>(null);
  const [quickReminderTitle, setQuickReminderTitle] = useState('');
  const [quickHours, setQuickHours] = useState<number>(0);
  const [quickMinutes, setQuickMinutes] = useState<number>(15);

  // Pomodoro custom break settings
  const [pomoBreakMode, setPomoBreakMode] = useState<'interval' | 'specific'>('interval');
  const [pomoFocusMinutes, setPomoFocusMinutes] = useState<number>(25);
  const [pomoBreakMinutes, setPomoBreakMinutes] = useState<number>(5);
  const [pomoSpecificMinute, setPomoSpecificMinute] = useState<number>(45);

  const handleCreateQuickReminder = (e: React.FormEvent) => {
    e.preventDefault();
    if (!quickModalType) return;

    const totalMinutes = (quickHours * 60) + quickMinutes;
    const totalSecs = Math.max(60, Math.min(36000, totalMinutes * 60)); // 1 min to 10 hours
    const defaultTitle = quickModalType === 'pomodoro'
      ? 'Sessão Pomodoro'
      : quickModalType === 'timer'
      ? 'Timer Rápido'
      : 'Alerta de Cronômetro';
    const targetTs = Date.now() + totalSecs * 1000;
    const formattedTarget = new Date(targetTs).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });

    // Calculate Pomodoro initial phase
    const focusIntervalMins = pomoBreakMode === 'interval' ? pomoFocusMinutes : pomoSpecificMinute;
    const totalCycles = pomoBreakMode === 'interval' ? Math.max(1, Math.ceil(totalMinutes / (pomoFocusMinutes || 25))) : 1;
    const firstPhaseDurationMins = Math.min(totalMinutes, focusIntervalMins || 25);
    const phaseEndTs = Date.now() + (firstPhaseDurationMins * 60 * 1000);

    const newReminder: QuickReminder = {
      id: 'rem-' + Math.random().toString(36).substring(2, 9),
      title: quickReminderTitle.trim() || defaultTitle,
      description: quickModalType === 'pomodoro'
        ? `Sessão total: ${totalMinutes}m | Pausa: ${pomoBreakMinutes}m ${pomoBreakMode === 'interval' ? `a cada ${pomoFocusMinutes}m` : `aos ${pomoSpecificMinute}m`}`
        : `Notificação agendada para as ${formattedTarget} (${quickHours > 0 ? `${quickHours}h ` : ''}${quickMinutes}min)`,
      mode: quickModalType,
      durationSeconds: totalSecs,
      targetTimestamp: targetTs,
      status: 'active',
      createdAt: new Date().toISOString(),
      soundEnabled: true,
      category: 'Foco',
      priority: 'media',

      // Pomodoro fields
      pomodoroTotalMinutes: totalMinutes,
      pomodoroFocusMinutes: focusIntervalMins,
      pomodoroBreakMinutes: pomoBreakMinutes,
      pomodoroBreakMode: pomoBreakMode,
      pomodoroSpecificBreakMinute: pomoSpecificMinute,
      pomodoroCurrentPhase: 'focus',
      pomodoroCurrentCycle: 1,
      pomodoroTotalCycles: totalCycles,
      pomodoroPhaseEndTimestamp: phaseEndTs
    };

    // Immediate System Notification on Creation
    const modeLabel = quickModalType === 'pomodoro'
      ? 'Sessão Pomodoro Iniciada'
      : quickModalType === 'timer'
      ? '⏱️ Timer Iniciado'
      : '⏰ Alerta de Cronômetro Ativo';
    sendSystemNotification(`${modeLabel}: ${newReminder.title}`, {
      body: `Contagem ativa! (${quickHours > 0 ? `${quickHours}h ` : ''}${quickMinutes}min). Notificação agendada para as ${formattedTarget}.`,
      tag: `quick-reminder-${newReminder.id}`
    });

    if (onAddReminder) {
      onAddReminder(newReminder);
    } else {
      try {
        const saved = JSON.parse(localStorage.getItem('mbc_reminders') || '[]');
        localStorage.setItem('mbc_reminders', JSON.stringify([newReminder, ...saved]));
      } catch (err) {
        console.error('Error saving quick reminder:', err);
      }
    }

    setQuickModalType(null);
    setActiveTab('lembretes');
  };

  const HOLD_DURATION = 1500; // 1.5s (1500ms) hold time

  const startNotasLongPress = (e?: React.TouchEvent | React.MouseEvent) => {
    pressStartTsRef.current = Date.now();
    setPressProgress(0);
    setSelectedShortcut('timer');

    if (e && 'touches' in e && e.touches.length > 0) {
      touchStartYRef.current = e.touches[0].clientY;
    } else if (e && 'clientY' in e) {
      touchStartYRef.current = (e as React.MouseEvent).clientY;
    }

    const updateProgress = () => {
      const elapsed = Date.now() - pressStartTsRef.current;
      const pct = Math.min(100, (elapsed / HOLD_DURATION) * 100);
      setPressProgress(pct);

      if (elapsed < HOLD_DURATION) {
        progressAnimRef.current = requestAnimationFrame(updateProgress);
      }
    };

    progressAnimRef.current = requestAnimationFrame(updateProgress);

    longPressTimerRef.current = setTimeout(() => {
      if (typeof navigator !== 'undefined' && navigator.vibrate) {
        try { navigator.vibrate(40); } catch (err) {}
      }
      setRadialMenuOpen(true);
      setPressProgress(0);
      if (progressAnimRef.current) cancelAnimationFrame(progressAnimRef.current);
    }, HOLD_DURATION);
  };

  const handleTouchMoveShortcut = (e: React.TouchEvent | React.MouseEvent) => {
    let currentY: number | null = null;
    if ('touches' in e && e.touches.length > 0) {
      currentY = e.touches[0].clientY;
    } else if ('clientY' in e) {
      currentY = (e as React.MouseEvent).clientY;
    }

    if (touchStartYRef.current === null || currentY === null) return;
    const deltaY = touchStartYRef.current - currentY; // positive when sliding UP
    if (deltaY > 50) {
      setSelectedShortcut('lembretes');
    } else if (deltaY > 15) {
      setSelectedShortcut('cronometro');
    } else {
      setSelectedShortcut('timer');
    }
  };

  const handleNotasRelease = (wasClicked = false) => {
    if (longPressTimerRef.current) {
      clearTimeout(longPressTimerRef.current);
      longPressTimerRef.current = null;
    }
    if (progressAnimRef.current) {
      cancelAnimationFrame(progressAnimRef.current);
      progressAnimRef.current = null;
    }

    const elapsed = Date.now() - pressStartTsRef.current;
    setPressProgress(0);

    if (radialMenuOpen || elapsed >= HOLD_DURATION) {
      if (selectedShortcut === 'pomodoro') {
        setQuickModalType('pomodoro');
        setQuickReminderTitle('');
        setQuickHours(0);
        setQuickMinutes(25);
      } else if (selectedShortcut === 'timer') {
        setQuickModalType('timer');
        setQuickReminderTitle('');
        setQuickHours(0);
        setQuickMinutes(15);
      } else if (selectedShortcut === 'cronometro') {
        setQuickModalType('cronometer');
        setQuickReminderTitle('');
        setQuickHours(0);
        setQuickMinutes(10);
      } else if (selectedShortcut === 'lembretes') {
        setActiveTab('lembretes');
      }
      setRadialMenuOpen(false);
    } else if (wasClicked) {
      setActiveTab('notas');
      setMobileMenuOpen(false);
    }

    touchStartYRef.current = null;
  };

  const cancelNotasLongPress = (wasClicked = false) => {
    handleNotasRelease(wasClicked);
  };


  // Listen to Fullscreen changes and save to localStorage
  useEffect(() => {
    const handleFullscreenChange = () => {
      const active = !!document.fullscreenElement;
      setIsFullscreen(active);
      localStorage.setItem('mbc_fullscreen', active ? 'true' : 'false');
    };
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    document.addEventListener('webkitfullscreenchange', handleFullscreenChange);
    document.addEventListener('mozfullscreenchange', handleFullscreenChange);
    document.addEventListener('MSFullscreenChange', handleFullscreenChange);
    
    // Initial check in case it's already full
    setIsFullscreen(!!document.fullscreenElement);
    
    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
      document.removeEventListener('webkitfullscreenchange', handleFullscreenChange);
      document.removeEventListener('mozfullscreenchange', handleFullscreenChange);
      document.removeEventListener('MSFullscreenChange', handleFullscreenChange);
    };
  }, []);

  // Real-time page scroll progress tracking for progressive navbars
  const [scrollProgress, setScrollProgress] = useState(0);
  const [isDraggingScrollTrack, setIsDraggingScrollTrack] = useState(false);

  const handleScrollTrackInteraction = (clientY: number) => {
    const scrollHeight = document.documentElement.scrollHeight - window.innerHeight;
    if (scrollHeight <= 0) return;
    const windowHeight = window.innerHeight;
    const pct = Math.min(1, Math.max(0, clientY / windowHeight));
    window.scrollTo({ top: scrollHeight * pct });
  };

  useEffect(() => {
    if (!isDraggingScrollTrack) return;
    const handleMouseMove = (e: MouseEvent) => {
      handleScrollTrackInteraction(e.clientY);
    };
    const handleMouseUp = () => {
      setIsDraggingScrollTrack(false);
    };
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDraggingScrollTrack]);

  // Reset navbar visibility when tab changes, menus open, or when switching to fixed mode
  useEffect(() => {
    setIsMobileNavHidden(false);
  }, [activeTab, mobileMenuOpen, radialMenuOpen, mobileNavbarMode]);

  useEffect(() => {
    const handleScroll = () => {
      const scrollTop = window.scrollY || document.documentElement.scrollTop;
      const scrollHeight = document.documentElement.scrollHeight - window.innerHeight;
      if (scrollHeight > 0) {
        const pct = Math.min(100, Math.max(0, (scrollTop / scrollHeight) * 100));
        setScrollProgress(pct);
      } else {
        setScrollProgress(0);
      }

      if (mobileNavbarMode === 'flexible') {
        if (scrollTop <= 25) {
          setIsMobileNavHidden(false);
          lastScrollYRef.current = scrollTop;
          return;
        }

        const diff = scrollTop - lastScrollYRef.current;
        if (Math.abs(diff) > 8) {
          if (diff > 0 && scrollTop > 40) {
            // Scrolling down -> hide navbar
            setIsMobileNavHidden(true);
          } else if (diff < 0) {
            // Scrolling up -> show navbar
            setIsMobileNavHidden(false);
          }
          lastScrollYRef.current = scrollTop;
        }
      }
    };

    const handleTouchStart = (e: TouchEvent) => {
      if (e.touches && e.touches[0]) {
        navScrollTouchStartYRef.current = e.touches[0].clientY;
      }
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (mobileNavbarMode !== 'flexible') return;
      if (navScrollTouchStartYRef.current === null || !e.touches || !e.touches[0]) return;
      
      const currentY = e.touches[0].clientY;
      const diffY = currentY - navScrollTouchStartYRef.current;
      const scrollTop = window.scrollY || document.documentElement.scrollTop;

      if (scrollTop <= 25) {
        setIsMobileNavHidden(false);
        return;
      }

      if (diffY < -12 && scrollTop > 30) {
        // Dragging finger up (content scrolls down) -> hide navbar
        setIsMobileNavHidden(true);
        navScrollTouchStartYRef.current = currentY;
      } else if (diffY > 12) {
        // Dragging finger down (content scrolls up) -> show navbar
        setIsMobileNavHidden(false);
        navScrollTouchStartYRef.current = currentY;
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    window.addEventListener('resize', handleScroll, { passive: true });
    window.addEventListener('touchstart', handleTouchStart, { passive: true });
    window.addEventListener('touchmove', handleTouchMove, { passive: true });

    // Recalculate on DOM updates (e.g. content loading or tab switching)
    const observer = new ResizeObserver(() => {
      handleScroll();
    });
    if (document.body) {
      observer.observe(document.body);
    }

    handleScroll();

    return () => {
      window.removeEventListener('scroll', handleScroll);
      window.removeEventListener('resize', handleScroll);
      window.removeEventListener('touchstart', handleTouchStart);
      window.removeEventListener('touchmove', handleTouchMove);
      observer.disconnect();
    };
  }, [activeTab, mobileNavbarMode]);

  // Listen to PWA install prompt
  useEffect(() => {
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
      console.log('beforeinstallprompt event triggered!');
    };
    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    return () => window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
  }, []);

  const toggleFullscreen = () => {
    try {
      if (!document.fullscreenElement) {
        const docEl = document.documentElement as any;
        if (docEl.requestFullscreen) {
          docEl.requestFullscreen();
        } else if (docEl.webkitRequestFullscreen) {
          docEl.webkitRequestFullscreen();
        } else if (docEl.msRequestFullscreen) {
          docEl.msRequestFullscreen();
        }
      } else {
        const doc = document as any;
        if (doc.exitFullscreen) {
          doc.exitFullscreen();
        } else if (doc.webkitExitFullscreen) {
          doc.webkitExitFullscreen();
        } else if (doc.msExitFullscreen) {
          doc.msExitFullscreen();
        }
      }
    } catch (err) {
      console.error('Falha ao alternar tela cheia', err);
    }
  };

  const triggerInstall = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      console.log(`PWA install response: ${outcome}`);
      setDeferredPrompt(null);
    } else {
      setShowInstallModal(true);
    }
  };

  // Level & XP Progress
  const xpInCurrentLevel = xpTotal % 1000;
  const progressPercent = (xpInCurrentLevel / 1000) * 100;

  // Navigation Items
  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', desc: 'Portal principal', icon: LayoutDashboard },
    { id: 'checklist', label: 'Missões Diárias', desc: 'Metas e rotinas diárias', icon: CheckSquare },
    { id: 'calendario', label: 'Agenda', desc: 'Diário & Fé', icon: Calendar },
    { id: 'resumo', label: 'Vida em resumo', desc: 'Painel holístico', icon: Compass },
    { id: 'projetos', label: 'Projetos', desc: 'Quadros Kanban & Hub', icon: FolderKanban },
    { id: 'agentes', label: 'Agentes & IA', desc: 'Prompts automáticos e chat', icon: Bot },
    { id: 'metas', label: 'Metas', desc: 'Evolução pessoal', icon: Target },
    { id: 'financas', label: 'Finanças', desc: 'Gestão de capital', icon: DollarSign },
    { id: 'anuais', label: 'Anuais', desc: 'Pastas, diários & livros', icon: Layers },
    { id: 'documentos', label: 'Arquivamento', desc: 'Documentos e PDFs', icon: Archive },
    { id: 'notas', label: 'Banco de Notas', desc: 'Segundo cérebro', icon: BookOpen },
    { id: 'lembretes', label: 'Lembretes Rápido', desc: 'Timers e Alertas', icon: Bell },
    { id: 'configuracoes', label: 'Configurações', desc: 'Ajustes do sistema', icon: Settings },
  ];

  // Mobile Drawer Navigation Items (Menu)
  const mobileMenuItems = [
    {
      id: 'busca',
      label: 'Busca Geral',
      desc: 'Pesquisar em tudo',
      icon: Search,
      action: () => {
        setMobileMenuOpen(false);
        setSearchOpen(true);
      }
    },
    {
      id: 'resumo',
      label: 'Vida em resumo',
      desc: 'Painel holístico',
      icon: Compass,
      action: () => {
        setActiveTab('resumo');
        setMobileMenuOpen(false);
      }
    },
    {
      id: 'projetos',
      label: 'Projetos',
      desc: 'Quadros Kanban & Hub',
      icon: FolderKanban,
      action: () => {
        setActiveTab('projetos');
        setMobileMenuOpen(false);
      }
    },
    {
      id: 'agentes',
      label: 'Agentes & IA',
      desc: 'Prompts automáticos e chat',
      icon: Bot,
      action: () => {
        setActiveTab('agentes');
        setMobileMenuOpen(false);
      }
    },
    {
      id: 'checklist',
      label: 'Missões Diárias',
      desc: 'Metas e rotinas diárias',
      icon: CheckSquare,
      action: () => {
        setActiveTab('checklist');
        setMobileMenuOpen(false);
      }
    },
    {
      id: 'anuais',
      label: 'Anuais',
      desc: 'Pastas, diários & livros',
      icon: Layers,
      action: () => {
        setActiveTab('anuais');
        setMobileMenuOpen(false);
      }
    },
    {
      id: 'metas',
      label: 'Metas',
      desc: 'Evolução pessoal',
      icon: Target,
      action: () => {
        setActiveTab('metas');
        setMobileMenuOpen(false);
      }
    },
    {
      id: 'financas',
      label: 'Finanças',
      desc: 'Gestão de capital',
      icon: DollarSign,
      action: () => {
        setActiveTab('financas');
        setMobileMenuOpen(false);
      }
    },
    {
      id: 'documentos',
      label: 'Arquivamento',
      desc: 'Documentos e PDFs',
      icon: Archive,
      action: () => {
        setActiveTab('documentos');
        setMobileMenuOpen(false);
      }
    },
    {
      id: 'configuracoes',
      label: 'Configurações',
      desc: 'Ajustes do sistema',
      icon: Settings,
      action: () => {
        setActiveTab('configuracoes');
        setMobileMenuOpen(false);
      }
    }
  ];

  // Global Ctrl+K Shortcut to toggle Search
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        setSearchOpen(prev => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Autofocus input when search overlay opens
  useEffect(() => {
    if (searchOpen) {
      setTimeout(() => {
        searchInputRef.current?.focus();
      }, 100);
    } else {
      setSearchQuery('');
    }
  }, [searchOpen]);

  // Execute search queries across all sections from localStorage
  useEffect(() => {
    if (!searchOpen) return;

    const query = searchQuery.trim().toLowerCase();
    
    // 1. Gather all local data
    let dailyTasks: any[] = [];
    let routine: any[] = [];
    let goals: any[] = [];
    let notes: any[] = [];
    let documents: any[] = [];
    let calendarNotes: any[] = [];

    try { dailyTasks = JSON.parse(localStorage.getItem('mbc_dailyTasks') || '[]'); } catch {}
    try { routine = JSON.parse(localStorage.getItem('mbc_routine') || '[]'); } catch {}
    try { goals = JSON.parse(localStorage.getItem('mbc_goals') || '[]'); } catch {}
    try { notes = JSON.parse(localStorage.getItem('mbc_notes') || '[]'); } catch {}
    try { documents = JSON.parse(localStorage.getItem('mbc_documents') || '[]'); } catch {}
    try { calendarNotes = JSON.parse(localStorage.getItem('mbc_calendarNotes') || '[]'); } catch {}

    const results: SearchResult[] = [];

    // Filter checklists
    if (searchFilter === 'todos' || searchFilter === 'tarefas') {
      dailyTasks.forEach((t: any) => {
        if (t.task?.toLowerCase().includes(query)) {
          results.push({
            id: t.id || Math.random().toString(),
            title: t.task,
            description: t.completed ? 'Tarefa de checklist (Concluída)' : 'Tarefa de checklist (Pendente)',
            category: 'Tarefa',
            tab: 'checklist'
          });
        }
      });
    }

    // Filter routines
    if (searchFilter === 'todos' || searchFilter === 'rotina') {
      routine.forEach((r: any) => {
        if (r.task?.toLowerCase().includes(query)) {
          results.push({
            id: r.id || Math.random().toString(),
            title: r.task,
            description: `Hábito de Rotina • ${r.time || 'Sem horário'}`,
            category: 'Rotina',
            tab: 'rotina'
          });
        }
      });
    }

    // Filter goals
    if (searchFilter === 'todos' || searchFilter === 'metas') {
      goals.forEach((g: any) => {
        if (g.title?.toLowerCase().includes(query) || g.category?.toLowerCase().includes(query)) {
          results.push({
            id: g.id || Math.random().toString(),
            title: g.title,
            description: `Meta • Categoria: ${g.category || 'Geral'} (${g.completed ? 'Concluída' : 'Em progresso'})`,
            category: 'Meta',
            tab: 'metas'
          });
        }
      });
    }

    // Filter notes
    if (searchFilter === 'todos' || searchFilter === 'notas') {
      notes.forEach((n: any) => {
        if (n.title?.toLowerCase().includes(query) || n.content?.toLowerCase().includes(query)) {
          results.push({
            id: n.id || Math.random().toString(),
            title: n.title,
            description: n.content ? n.content.substring(0, 100) + '...' : 'Nota sem conteúdo',
            category: 'Nota',
            tab: 'notas'
          });
        }
      });
    }

    // Filter documents
    if (searchFilter === 'todos' || searchFilter === 'documentos') {
      documents.forEach((d: any) => {
        if (d.name?.toLowerCase().includes(query) || d.category?.toLowerCase().includes(query)) {
          results.push({
            id: d.id || Math.random().toString(),
            title: d.name,
            description: `Documento • Categoria: ${d.category} • Tamanho: ${d.size || 'N/A'}`,
            category: 'Documento',
            tab: 'documentos'
          });
        }
      });
    }

    // Filter calendar
    if (searchFilter === 'todos' || searchFilter === 'calendario') {
      calendarNotes.forEach((c: any) => {
        const titleMatch = c.title?.toLowerCase().includes(query);
        const descMatch = c.content?.toLowerCase().includes(query);
        const journalMatch = c.journalText?.toLowerCase().includes(query);
        
        if (titleMatch || descMatch || journalMatch) {
          results.push({
            id: c.id || Math.random().toString(),
            title: c.title || `Registro de ${c.date}`,
            description: c.journalText ? `Diário: ${c.journalText.substring(0, 80)}...` : `Espiritualidade: ${c.content || 'Atividades'}`,
            category: 'Calendário',
            tab: 'calendario'
          });
        }
      });
    }

    setSearchResults(results);
  }, [searchQuery, searchFilter, searchOpen]);

  const handleSearchResultClick = (tab: string) => {
    setActiveTab(tab);
    setSearchOpen(false);
    setMobileMenuOpen(false);
  };

  const isMenuBtnActive = mobileMenuOpen || ['rotina', 'habitos', 'metas', 'financas', 'documentos'].includes(activeTab);
  const isExpanded = isHovered || pinned;

  return (
    <>
      {/* 1. PROGRESSIVE PAGE SCROLL BAR (MOBILE ONLY) */}
      <div 
        id="progressBar" 
        className="lg:hidden fixed top-0 left-0 h-1 bg-gradient-to-r from-orange-500 via-amber-500 to-orange-400 z-50 transition-all duration-75 shadow-[0_0_10px_var(--color-orange-500,#f97316)]"
        style={{ width: `${scrollProgress}%` }}
      />

      {/* DESKTOP RIGHT EDGE PROGRESSIVE VERTICAL SCROLLBAR TRACK */}
      <div 
        onClick={(e) => handleScrollTrackInteraction(e.clientY)}
        onMouseDown={(e) => {
          setIsDraggingScrollTrack(true);
          handleScrollTrackInteraction(e.clientY);
        }}
        className="hidden lg:flex fixed top-0 right-0 w-2 hover:w-3 h-full bg-zinc-950/30 hover:bg-zinc-900/60 transition-all duration-150 z-50 cursor-pointer group flex-col justify-start overflow-hidden select-none border-0"
        title={`Progresso da página: ${Math.round(scrollProgress)}% • Clique ou arraste para navegar`}
      >
        <div 
          className="w-full bg-gradient-to-b from-orange-500 via-amber-500 to-orange-400 shadow-[0_0_8px_var(--color-orange-500,#f97316)] transition-all duration-75 relative rounded-b-full border-0"
          style={{ height: `${scrollProgress}%` }}
        />
      </div>

      {/* 2. MOBILE HEADER BAR (TOP UTILITIES) */}
      {activeTab !== 'classificacao' && activeTab !== 'ligas' && (
        <div className="lg:hidden fixed top-0 left-0 right-0 h-14 bg-[#09090b]/90 backdrop-blur-md border-b border-zinc-900/60 flex items-center justify-between px-4 z-40 select-none">

          {/* Left Side: User Image only */}
          <button 
            onClick={() => setActiveTab('perfil')}
            className="flex items-center active:scale-95 transition-transform"
            title="Ver seu Perfil"
          >
            <img 
              src={userPhoto} 
              alt={userName} 
              className="h-8 w-8 rounded-full object-cover border border-orange-500/20 shadow-[0_0_8px_rgba(249,115,22,0.15)]" 
              referrerPolicy="no-referrer"
            />
          </button>

          {/* Right Side: Icons aligned to the right */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Quick Theme Toggle (Light vs Dark) */}
            {onToggleThemeMode && (
              <button 
                onClick={onToggleThemeMode}
                className="p-2 bg-zinc-900/40 text-zinc-400 hover:text-orange-500 rounded-xl border border-zinc-800/80 transition-all active:scale-95 flex items-center justify-center cursor-pointer"
                title={themeMode === 'light' ? 'Alternar para Modo Escuro' : 'Alternar para Modo Claro'}
              >
                {themeMode === 'light' ? (
                  <Moon className="h-4.5 w-4.5 text-zinc-700" />
                ) : (
                  <Sun className="h-4.5 w-4.5 text-amber-400" />
                )}
              </button>
            )}

            {/* Quick Search */}
            <button 
              onClick={() => setSearchOpen(true)}
              className="p-2 bg-zinc-900/40 text-zinc-400 hover:text-orange-500 rounded-xl border border-zinc-800/80 transition-all active:scale-95 flex items-center justify-center cursor-pointer"
              title="Buscar Geral"
            >
              <Search className="h-4.5 w-4.5" />
            </button>

            {/* Mobile Fullscreen Toggle Button */}
            <button 
              onClick={toggleFullscreen}
              className="p-2 bg-zinc-900/40 text-zinc-400 hover:text-white rounded-xl border border-zinc-800/80 transition-all active:scale-95 flex items-center justify-center cursor-pointer"
              title="Modo Tela Cheia"
            >
              {isFullscreen ? <Minimize className="h-4.5 w-4.5 text-orange-500" /> : <Maximize className="h-4.5 w-4.5" />}
            </button>
          </div>
        </div>
      )}

      {/* 2b. MOBILE DRAWER SLIDING MENU */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <div className="fixed inset-0 z-40 lg:hidden flex">
            {/* Backdrop */}
            <motion.div 
              className="fixed inset-0 bg-black/80 backdrop-blur-sm"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.25, ease: 'easeInOut' }}
              onClick={() => setMobileMenuOpen(false)}
            />

            {/* Sidebar content */}
            <motion.div 
              className="relative flex flex-col w-64 h-full bg-[#09090b] border-r border-zinc-900 z-50 p-5 pt-8 shadow-2xl"
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'spring', damping: 28, stiffness: 240, mass: 0.8 }}
            >
              {/* Drawer Header with Close Button */}
              <div className="flex items-center justify-end pb-4 border-b border-zinc-900/60 mb-6">
                <button 
                  onClick={() => setMobileMenuOpen(false)}
                  className="p-1 hover:bg-zinc-900 text-zinc-500 hover:text-white rounded-lg transition-colors"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              {/* User profile with XP progress bar inside mobile (matches desktop sidebar) */}
              <div className="mb-6 p-4 bg-zinc-950 rounded-2xl border border-zinc-900/80 space-y-3">
                <button 
                  onClick={() => {
                    setActiveTab('perfil');
                    setMobileMenuOpen(false);
                  }}
                  className="flex items-center gap-3 min-w-0 text-left hover:opacity-80 transition-opacity active:scale-95 w-full cursor-pointer"
                  title="Ver seu Perfil"
                >
                  <img 
                    src={userPhoto} 
                    alt={userName} 
                    className="h-9 w-9 rounded-full object-cover border border-orange-500/20 flex-shrink-0 shadow-[0_0_8px_rgba(249,115,22,0.15)]"
                    referrerPolicy="no-referrer"
                  />
                  <div className="min-w-0 flex-1">
                    <h3 className="text-xs font-bold text-white tracking-tight truncate">{userName}</h3>
                    <p className="text-[9px] text-orange-500 font-mono font-bold">{xpTotal} XP Acumulados</p>
                  </div>
                </button>

                {/* Experience progress bar */}
                <div>
                  <div className="w-full bg-zinc-900/80 h-1.5 rounded-full overflow-hidden border border-zinc-800/40">
                    <div 
                      className="bg-gradient-to-r from-orange-500 to-amber-500 h-full rounded-full transition-all duration-300" 
                      style={{ width: `${progressPercent}%` }} 
                    />
                  </div>
                  <div className="flex items-center justify-between text-[8px] font-mono text-gray-500 mt-1">
                    <span>{xpInCurrentLevel} / 1000 XP</span>
                    <button
                      onClick={() => {
                        if (onOpenStreakHub) onOpenStreakHub();
                        setMobileMenuOpen(false);
                      }}
                      className="text-orange-400 hover:text-orange-300 flex items-center gap-0.5 font-bold hover:bg-orange-500/10 px-1 rounded transition-colors cursor-pointer"
                      title="Abrir Central de Ofensivas & Congelamento"
                    >
                      <Flame className="h-2.5 w-2.5 animate-pulse" /> {streak} dias
                    </button>
                  </div>
                </div>
              </div>

              {/* Navigation Items */}
              <nav className="flex-1 space-y-1.5 overflow-y-auto">
                {mobileMenuItems.map((item) => {
                  const isActive = activeTab === item.id;
                  const Icon = item.icon;
                  return (
                    <button
                      key={item.id}
                      onClick={item.action}
                      className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-xs font-bold transition-all relative ${
                        isActive 
                          ? 'text-orange-500 bg-orange-500/5 border border-orange-500/20 shadow' 
                          : 'text-gray-400 hover:text-white hover:bg-zinc-900 border border-transparent'
                      }`}
                    >
                      <Icon className="h-4 w-4 text-orange-500" />
                      <div className="text-left">
                        <div className="text-xs font-bold">{item.label}</div>
                        <div className="text-[9px] text-zinc-500 font-mono mt-0.5">{item.desc}</div>
                      </div>
                    </button>
                  );
                })}

                {/* Extra Utility options for mobile PWA & Fullscreen */}
                <div className="pt-2 border-t border-zinc-900/60 mt-2 space-y-1">
                  <button
                    onClick={() => {
                      setMobileMenuOpen(false);
                      toggleFullscreen();
                    }}
                    className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-xs font-bold text-gray-400 hover:text-white hover:bg-zinc-900 border border-transparent transition-all"
                  >
                    {isFullscreen ? (
                      <Minimize className="h-4 w-4 text-orange-500" />
                    ) : (
                      <Maximize className="h-4 w-4 text-zinc-500" />
                    )}
                    <div className="text-left">
                      <div className="text-xs font-bold text-zinc-300">{isFullscreen ? 'Sair de Tela Cheia' : 'Modo Tela Cheia'}</div>
                      <div className="text-[9px] text-zinc-500 font-mono mt-0.5">{isFullscreen ? 'Minimizar visualização' : 'Navegar sem barras'}</div>
                    </div>
                  </button>
                </div>
              </nav>

              {/* Footer */}
              <div className="pt-4 border-t border-zinc-900 text-center text-[10px] text-gray-600 font-mono">
                TRONUS SYSTEMS
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* 3. MOBILE BOTTOM NAV BAR (Fixed or Flexible on scroll, Oval vs Reta shape) */}
      {mobileNavbarShape === 'reta' ? (
        <div 
          className={`lg:hidden fixed bottom-0 left-0 right-0 z-40 transition-transform duration-300 ease-in-out ${
            isMobileNavHidden && mobileNavbarMode === 'flexible' && !mobileMenuOpen && !radialMenuOpen
              ? 'translate-y-[120%]'
              : 'translate-y-0'
          }`}
        >
          {/* Straight bar container matching Image 2 */}
          <div className="w-full h-16 bg-[#0a0a0f]/95 backdrop-blur-xl border-t border-zinc-800/80 shadow-[0_-4px_24px_rgba(0,0,0,0.6)] flex items-stretch justify-around px-1 relative pointer-events-auto">
            {/* Item 1: Menu */}
            <button 
              onClick={() => setMobileMenuOpen(true)}
              className="relative flex-1 flex flex-col items-center justify-center group cursor-pointer select-none outline-none focus:outline-none active:bg-transparent bg-transparent"
              style={{ WebkitTapHighlightColor: 'transparent', WebkitTouchCallout: 'none' }}
            >
              {isMenuBtnActive && (
                <div className="absolute top-0 w-8 h-1 bg-orange-500 rounded-b-full shadow-[0_2px_12px_var(--color-orange-500,#f97316)] z-10" />
              )}
              <div 
                className={`transition-all duration-200 ${
                  isMenuBtnActive 
                    ? "text-orange-500 filter drop-shadow-[0_0_8px_rgba(249,115,22,0.8)]" 
                    : "text-zinc-500 group-hover:text-zinc-300"
                }`}
              >
                <Menu className="h-5 w-5" />
              </div>
              <span className={`text-[9px] font-mono tracking-widest uppercase mt-1 transition-colors ${
                isMenuBtnActive
                  ? "font-bold text-orange-500 drop-shadow-[0_0_6px_rgba(249,115,22,0.6)]"
                  : "font-semibold text-zinc-500 group-hover:text-zinc-300"
              }`}>
                MENU
              </span>
            </button>

            {/* Item 2: Calendário / Agenda */}
            <button 
              onClick={() => {
                setActiveTab('calendario');
                setMobileMenuOpen(false);
              }}
              className="relative flex-1 flex flex-col items-center justify-center group cursor-pointer select-none outline-none focus:outline-none active:bg-transparent bg-transparent"
              style={{ WebkitTapHighlightColor: 'transparent', WebkitTouchCallout: 'none' }}
            >
              {activeTab === 'calendario' && !mobileMenuOpen && (
                <div className="absolute top-0 w-8 h-1 bg-orange-500 rounded-b-full shadow-[0_2px_12px_var(--color-orange-500,#f97316)] z-10" />
              )}
              <div 
                className={`transition-all duration-200 ${
                  activeTab === 'calendario' && !mobileMenuOpen
                    ? "text-orange-500 filter drop-shadow-[0_0_8px_rgba(249,115,22,0.8)]" 
                    : "text-zinc-500 group-hover:text-zinc-300"
                }`}
              >
                <Calendar className="h-5 w-5" />
              </div>
              <span className={`text-[9px] font-mono tracking-widest uppercase mt-1 transition-colors ${
                activeTab === 'calendario' && !mobileMenuOpen
                  ? "font-bold text-orange-500 drop-shadow-[0_0_6px_rgba(249,115,22,0.6)]"
                  : "font-semibold text-zinc-500 group-hover:text-zinc-300"
              }`}>
                AGENDA
              </span>
            </button>

            {/* Item 3: Home / Início */}
            <button 
              onClick={() => {
                setActiveTab('dashboard');
                setMobileMenuOpen(false);
              }}
              className="relative flex-1 flex flex-col items-center justify-center group cursor-pointer select-none outline-none focus:outline-none active:bg-transparent bg-transparent"
              style={{ WebkitTapHighlightColor: 'transparent', WebkitTouchCallout: 'none' }}
            >
              {activeTab === 'dashboard' && !mobileMenuOpen && (
                <div className="absolute top-0 w-8 h-1 bg-orange-500 rounded-b-full shadow-[0_2px_12px_var(--color-orange-500,#f97316)] z-10" />
              )}
              <div 
                className={`transition-all duration-200 ${
                  activeTab === 'dashboard' && !mobileMenuOpen
                    ? "text-orange-500 filter drop-shadow-[0_0_8px_rgba(249,115,22,0.8)]" 
                    : "text-zinc-500 group-hover:text-zinc-300"
                }`}
              >
                <LayoutDashboard className="h-5 w-5" />
              </div>
              <span className={`text-[9px] font-mono tracking-widest uppercase mt-1 transition-colors ${
                activeTab === 'dashboard' && !mobileMenuOpen
                  ? "font-bold text-orange-500 drop-shadow-[0_0_6px_rgba(249,115,22,0.6)]"
                  : "font-semibold text-zinc-500 group-hover:text-zinc-300"
              }`}>
                INÍCIO
              </span>
            </button>

            {/* Item 4: Checklist / Tarefas */}
            <button 
              onClick={() => {
                setActiveTab('checklist');
                setMobileMenuOpen(false);
              }}
              className="relative flex-1 flex flex-col items-center justify-center group cursor-pointer select-none outline-none focus:outline-none active:bg-transparent bg-transparent"
              style={{ WebkitTapHighlightColor: 'transparent', WebkitTouchCallout: 'none' }}
            >
              {activeTab === 'checklist' && !mobileMenuOpen && (
                <div className="absolute top-0 w-8 h-1 bg-orange-500 rounded-b-full shadow-[0_2px_12px_var(--color-orange-500,#f97316)] z-10" />
              )}
              <div 
                className={`transition-all duration-200 ${
                  activeTab === 'checklist' && !mobileMenuOpen
                    ? "text-orange-500 filter drop-shadow-[0_0_8px_rgba(249,115,22,0.8)]" 
                    : "text-zinc-500 group-hover:text-zinc-300"
                }`}
              >
                <CheckSquare className="h-5 w-5" />
              </div>
              <span className={`text-[9px] font-mono tracking-widest uppercase mt-1 transition-colors ${
                activeTab === 'checklist' && !mobileMenuOpen
                  ? "font-bold text-orange-500 drop-shadow-[0_0_6px_rgba(249,115,22,0.6)]"
                  : "font-semibold text-zinc-500 group-hover:text-zinc-300"
              }`}>
                TAREFAS
              </span>
            </button>

            {/* Item 5: Notas (Com Long-Press para Lembretes/Cronômetro/Timer) */}
            <button 
              onTouchStart={startNotasLongPress}
              onTouchMove={handleTouchMoveShortcut}
              onTouchEnd={() => cancelNotasLongPress(true)}
              onTouchCancel={() => cancelNotasLongPress(false)}
              onMouseDown={startNotasLongPress}
              onMouseMove={handleTouchMoveShortcut}
              onMouseUp={() => cancelNotasLongPress(true)}
              onMouseLeave={() => cancelNotasLongPress(false)}
              className="relative flex-1 flex flex-col items-center justify-center group cursor-pointer select-none outline-none focus:outline-none active:bg-transparent bg-transparent"
              style={{ WebkitTapHighlightColor: 'transparent', WebkitTouchCallout: 'none' }}
            >
              {pressProgress > 0 && (
                <svg className="absolute inset-0 w-full h-full -rotate-90 pointer-events-none z-20 overflow-visible">
                  <circle
                    cx="50%"
                    cy="40%"
                    r="16"
                    stroke="rgba(249, 115, 22, 0.2)"
                    strokeWidth="2.5"
                    fill="none"
                  />
                  <circle
                    cx="50%"
                    cy="40%"
                    r="16"
                    stroke="#f97316"
                    strokeWidth="2.5"
                    fill="none"
                    strokeDasharray="100"
                    strokeDashoffset={100 - (100 * pressProgress) / 100}
                    strokeLinecap="round"
                  />
                </svg>
              )}
              {activeTab === 'notas' && !mobileMenuOpen && (
                <div className="absolute top-0 w-8 h-1 bg-orange-500 rounded-b-full shadow-[0_2px_12px_var(--color-orange-500,#f97316)] z-10" />
              )}
              <div 
                className={`transition-all duration-200 ${
                  activeTab === 'notas' && !mobileMenuOpen
                    ? "text-orange-500 filter drop-shadow-[0_0_8px_rgba(249,115,22,0.8)]" 
                    : "text-zinc-500 group-hover:text-zinc-300"
                }`}
              >
                <BookOpen className="h-5 w-5" />
              </div>
              <span className={`text-[9px] font-mono tracking-widest uppercase mt-1 transition-colors ${
                activeTab === 'notas' && !mobileMenuOpen
                  ? "font-bold text-orange-500 drop-shadow-[0_0_6px_rgba(249,115,22,0.6)]"
                  : "font-semibold text-zinc-500 group-hover:text-zinc-300"
              }`}>
                NOTAS
              </span>
            </button>
          </div>
        </div>
      ) : (
        /* OVAL: MOBILE CURVED FUTURISTIC BOTTOM NAV BAR */
        <div 
          className={`lg:hidden fixed bottom-0 left-0 right-0 h-[92px] pointer-events-none z-40 transition-transform duration-300 ease-in-out ${
            isMobileNavHidden && mobileNavbarMode === 'flexible' && !mobileMenuOpen && !radialMenuOpen
              ? 'translate-y-[120%]'
              : 'translate-y-0'
          }`}
        >
          {/* SVG background with neon glowing stroke and dark filled area */}
          <div className="absolute inset-0 pointer-events-auto">
            <svg 
              className="w-full h-full filter drop-shadow-[0_-8px_16px_rgba(249,115,22,0.25)]" 
              viewBox="0 0 100 100" 
              preserveAspectRatio="none"
            >
              {/* Main curved path border */}
              <path 
                d="M 0 30 Q 50 0 100 30 L 100 100 L 0 100 Z" 
                fill="none" 
                stroke="var(--color-orange-500, #f97316)" 
                strokeWidth="1.5" 
              />
              {/* Main curved path background */}
              <path 
                d="M 0 30 Q 50 0 100 30 L 100 100 L 0 100 Z" 
                fill="#09090b" 
                opacity="0.98"
              />
            </svg>
          </div>

          {/* Navigation buttons container */}
          <div className="absolute inset-x-0 bottom-0 top-3 flex items-start justify-around px-2 pb-2 pointer-events-auto">
            {/* Item 1: Menu */}
            <button 
              onClick={() => setMobileMenuOpen(true)}
              className="relative flex flex-col items-center justify-center w-14 h-14 group cursor-pointer select-none outline-none focus:outline-none active:bg-transparent bg-transparent"
              style={{ WebkitTapHighlightColor: 'transparent', WebkitTouchCallout: 'none' }}
            >
              <div 
                className={`transition-all duration-300 ${
                  isMenuBtnActive 
                    ? "text-orange-500 scale-110 -translate-y-2 filter drop-shadow-[0_0_10px_rgba(249,115,22,0.8)]" 
                    : "text-zinc-400 group-hover:text-white"
                }`}
              >
                <Menu className="h-5 w-5" />
              </div>
              {isMenuBtnActive && (
                <>
                  <div className="absolute bottom-5.5 w-6 h-0.5 bg-orange-500 rounded-full shadow-[0_0_12px_#f97316] z-10" />
                  <span className="absolute bottom-1.5 text-[7px] font-mono font-black tracking-widest text-orange-500 uppercase">
                    MENU
                  </span>
                </>
              )}
            </button>

            {/* Item 2: Calendário */}
            <button 
              onClick={() => {
                setActiveTab('calendario');
                setMobileMenuOpen(false);
              }}
              className="relative flex flex-col items-center justify-center w-14 h-14 group cursor-pointer select-none outline-none focus:outline-none active:bg-transparent bg-transparent"
              style={{ WebkitTapHighlightColor: 'transparent', WebkitTouchCallout: 'none' }}
            >
              <div 
                className={`transition-all duration-300 ${
                  activeTab === 'calendario' && !mobileMenuOpen
                    ? "text-orange-500 scale-110 -translate-y-2 filter drop-shadow-[0_0_10px_rgba(249,115,22,0.8)]" 
                    : "text-zinc-400 group-hover:text-white"
                }`}
              >
                <Calendar className="h-5 w-5" />
              </div>
              {activeTab === 'calendario' && !mobileMenuOpen && (
                <>
                  <div className="absolute bottom-5.5 w-6 h-0.5 bg-orange-500 rounded-full shadow-[0_0_12px_#f97316] z-10" />
                  <span className="absolute bottom-1.5 text-[7px] font-mono font-black tracking-widest text-orange-500 uppercase">
                    AGENDA
                  </span>
                </>
              )}
            </button>

            {/* Item 3: Home (Dashboard) - sits at x=50, the exact peak of the curve */}
            <button 
              onClick={() => {
                setActiveTab('dashboard');
                setMobileMenuOpen(false);
              }}
              className="relative flex flex-col items-center justify-center w-14 h-14 group cursor-pointer select-none outline-none focus:outline-none active:bg-transparent bg-transparent"
              style={{ WebkitTapHighlightColor: 'transparent', WebkitTouchCallout: 'none' }}
            >
              <div 
                className={`transition-all duration-300 ${
                  activeTab === 'dashboard' && !mobileMenuOpen
                    ? "text-orange-500 scale-115 -translate-y-2.5 filter drop-shadow-[0_0_10px_rgba(249,115,22,0.8)]" 
                    : "text-zinc-400 group-hover:text-white"
                }`}
              >
                <LayoutDashboard className="h-5.5 w-5.5" />
              </div>
              {activeTab === 'dashboard' && !mobileMenuOpen && (
                <>
                  <div className="absolute bottom-5.5 w-6 h-0.5 bg-orange-500 rounded-full shadow-[0_0_12px_#f97316] z-10" />
                  <span className="absolute bottom-1.5 text-[7px] font-mono font-black tracking-widest text-orange-500 uppercase">
                    HOME
                  </span>
                </>
              )}
            </button>

            {/* Item 4: Checklist Diária */}
            <button 
              onClick={() => {
                setActiveTab('checklist');
                setMobileMenuOpen(false);
              }}
              className="relative flex flex-col items-center justify-center w-14 h-14 group cursor-pointer select-none outline-none focus:outline-none active:bg-transparent bg-transparent"
              style={{ WebkitTapHighlightColor: 'transparent', WebkitTouchCallout: 'none' }}
            >
              <div 
                className={`transition-all duration-300 ${
                  activeTab === 'checklist' && !mobileMenuOpen
                    ? "text-orange-500 scale-110 -translate-y-2 filter drop-shadow-[0_0_10px_rgba(249,115,22,0.8)]" 
                    : "text-zinc-400 group-hover:text-white"
                }`}
              >
                <CheckSquare className="h-5 w-5" />
              </div>
              {activeTab === 'checklist' && !mobileMenuOpen && (
                <>
                  <div className="absolute bottom-5.5 w-6 h-0.5 bg-orange-500 rounded-full shadow-[0_0_12px_#f97316] z-10" />
                  <span className="absolute bottom-1.5 text-[7px] font-mono font-black tracking-widest text-orange-500 uppercase">
                    TAREFAS
                  </span>
                </>
              )}
            </button>

            {/* Item 5: Notas (Com Long-Press para Lembretes/Cronômetro/Timer) */}
            <button 
              onTouchStart={startNotasLongPress}
              onTouchMove={handleTouchMoveShortcut}
              onTouchEnd={() => cancelNotasLongPress(true)}
              onTouchCancel={() => cancelNotasLongPress(false)}
              onMouseDown={startNotasLongPress}
              onMouseMove={handleTouchMoveShortcut}
              onMouseUp={() => cancelNotasLongPress(true)}
              onMouseLeave={() => cancelNotasLongPress(false)}
              className="relative flex flex-col items-center justify-center w-14 h-14 group cursor-pointer select-none outline-none focus:outline-none active:bg-transparent bg-transparent"
              style={{ WebkitTapHighlightColor: 'transparent', WebkitTouchCallout: 'none' }}
            >
              {/* Visual holding progress ring */}
              {pressProgress > 0 && (
                <svg className="absolute inset-0 w-full h-full -rotate-90 pointer-events-none z-20 overflow-visible">
                  <circle
                    cx="28"
                    cy="28"
                    r="22"
                    stroke="rgba(249, 115, 22, 0.2)"
                    strokeWidth="3"
                    fill="none"
                  />
                  <circle
                    cx="28"
                    cy="28"
                    r="22"
                    stroke="#f97316"
                    strokeWidth="3"
                    fill="none"
                    strokeDasharray="138"
                    strokeDashoffset={138 - (138 * pressProgress) / 100}
                    strokeLinecap="round"
                  />
                </svg>
              )}

              <div 
                className={`transition-all duration-300 ${
                  activeTab === 'notas' && !mobileMenuOpen
                    ? "text-orange-500 scale-110 -translate-y-2 filter drop-shadow-[0_0_10px_rgba(249,115,22,0.8)]" 
                    : "text-zinc-400 group-hover:text-white"
                }`}
              >
                <BookOpen className="h-5 w-5" />
              </div>
              {activeTab === 'notas' && !mobileMenuOpen && (
                <>
                  <div className="absolute bottom-5.5 w-6 h-0.5 bg-orange-500 rounded-full shadow-[0_0_12px_#f97316] z-10" />
                  <span className="absolute bottom-1.5 text-[7px] font-mono font-black tracking-widest text-orange-500 uppercase">
                    NOTAS
                  </span>
                </>
              )}
            </button>
          </div>
        </div>
      )}

      {/* QUICK ACTION POPOVER FOR LEMBRETES & TIMER (Triggered by hold on "Notas" in Mobile Navbar) */}
      {radialMenuOpen && (
        <div 
          onTouchMove={handleTouchMoveShortcut}
          className="fixed inset-0 z-50 flex items-end justify-end p-4 pb-20 bg-black/60 backdrop-blur-sm lg:hidden animate-in fade-in duration-150 select-none"
        >
          {/* Backdrop Click to Close */}
          <div 
            className="absolute inset-0" 
            onClick={() => setRadialMenuOpen(false)} 
          />

          {/* Right-aligned Floating Card without header */}
          <div className="relative z-10 w-64 bg-zinc-900/95 border border-zinc-800 rounded-2xl p-3 shadow-2xl shadow-black/80 backdrop-blur-xl animate-in slide-in-from-bottom-3 zoom-in-95 duration-150 space-y-2">
            
            {/* Actions Stack: Lembretes, Cronômetro & Timer */}
            <div className="space-y-2">
              {/* Option 1: Lembretes */}
              <button
                onClick={() => {
                  setActiveTab('lembretes');
                  setRadialMenuOpen(false);
                }}
                onMouseEnter={() => setSelectedShortcut('lembretes')}
                onTouchStart={() => setSelectedShortcut('lembretes')}
                className={`w-full p-2.5 rounded-xl border transition-all cursor-pointer group shadow-sm flex items-center justify-between ${
                  selectedShortcut === 'lembretes'
                    ? 'bg-zinc-800 border-orange-500/80 ring-1 ring-orange-500/40 text-white shadow-orange-500/10'
                    : 'bg-zinc-800/40 border-zinc-700/30 text-zinc-400 opacity-80 hover:bg-zinc-800 hover:text-white'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-lg transition-transform ${
                    selectedShortcut === 'lembretes'
                      ? 'bg-orange-500/20 border border-orange-500/40 text-orange-400 scale-105'
                      : 'bg-orange-500/10 border border-orange-500/20 text-orange-400'
                  }`}>
                    <Bell className="h-4 w-4" />
                  </div>
                  <div className="text-left">
                    <div className={`text-xs font-bold transition-colors ${
                      selectedShortcut === 'lembretes' ? 'text-orange-400' : 'text-zinc-200'
                    }`}>
                      Lembretes
                    </div>
                    <div className="text-[10px] text-zinc-400 font-normal">
                      Central de lembretes rápido
                    </div>
                  </div>
                </div>
              </button>

              {/* Option 2: Cronômetro */}
              <button
                onClick={() => {
                  setQuickModalType('cronometer');
                  setQuickReminderTitle('');
                  setQuickHours(0);
                  setQuickMinutes(10);
                  setRadialMenuOpen(false);
                }}
                onMouseEnter={() => setSelectedShortcut('cronometro')}
                onTouchStart={() => setSelectedShortcut('cronometro')}
                className={`w-full p-2.5 rounded-xl border transition-all cursor-pointer group shadow-sm flex items-center justify-between ${
                  selectedShortcut === 'cronometro'
                    ? 'bg-zinc-800 border-orange-500/80 ring-1 ring-orange-500/40 text-white shadow-orange-500/10'
                    : 'bg-zinc-800/40 border-zinc-700/30 text-zinc-400 opacity-80 hover:bg-zinc-800 hover:text-white'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-lg transition-transform ${
                    selectedShortcut === 'cronometro'
                      ? 'bg-orange-500/20 border border-orange-500/40 text-orange-400 scale-105'
                      : 'bg-orange-500/10 border border-orange-500/20 text-orange-400'
                  }`}>
                    <Clock className="h-4 w-4" />
                  </div>
                  <div className="text-left">
                    <div className={`text-xs font-bold transition-colors ${
                      selectedShortcut === 'cronometro' ? 'text-orange-400' : 'text-zinc-200'
                    }`}>
                      Cronômetro
                    </div>
                    <div className="text-[10px] text-zinc-400 font-normal">
                      Definir alerta com tempo limite
                    </div>
                  </div>
                </div>
              </button>

              {/* Option 3: Timer */}
              <button
                onClick={() => {
                  setQuickModalType('timer');
                  setQuickReminderTitle('');
                  setQuickHours(0);
                  setQuickMinutes(15);
                  setRadialMenuOpen(false);
                }}
                onMouseEnter={() => setSelectedShortcut('timer')}
                onTouchStart={() => setSelectedShortcut('timer')}
                className={`w-full p-2.5 rounded-xl border transition-all cursor-pointer group shadow-sm flex items-center justify-between ${
                  selectedShortcut === 'timer'
                    ? 'bg-zinc-800 border-amber-500/80 ring-1 ring-amber-500/40 text-white shadow-amber-500/10'
                    : 'bg-zinc-800/40 border-zinc-700/30 text-zinc-400 opacity-80 hover:bg-zinc-800 hover:text-white'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-lg transition-transform ${
                    selectedShortcut === 'timer'
                      ? 'bg-amber-500/20 border border-amber-500/40 text-amber-400 scale-105'
                      : 'bg-amber-500/10 border border-amber-500/20 text-amber-400'
                  }`}>
                    <Timer className="h-4 w-4" />
                  </div>
                  <div className="text-left">
                    <div className={`text-xs font-bold transition-colors ${
                      selectedShortcut === 'timer' ? 'text-amber-400' : 'text-zinc-200'
                    }`}>
                      Timer
                    </div>
                    <div className="text-[10px] text-zinc-400 font-normal">
                      Contagem regressiva e aviso
                    </div>
                  </div>
                </div>
              </button>

              {/* Option 4: Pomodoro */}
              <button
                onClick={() => {
                  setQuickModalType('pomodoro');
                  setQuickReminderTitle('');
                  setQuickHours(0);
                  setQuickMinutes(25);
                  setRadialMenuOpen(false);
                }}
                onMouseEnter={() => setSelectedShortcut('pomodoro')}
                onTouchStart={() => setSelectedShortcut('pomodoro')}
                className={`w-full p-2.5 rounded-xl border transition-all cursor-pointer group shadow-sm flex items-center justify-between ${
                  selectedShortcut === 'pomodoro'
                    ? 'bg-zinc-800 border-rose-500/80 ring-1 ring-rose-500/40 text-white shadow-rose-500/10'
                    : 'bg-zinc-800/40 border-zinc-700/30 text-zinc-400 opacity-80 hover:bg-zinc-800 hover:text-white'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-lg transition-transform ${
                    selectedShortcut === 'pomodoro'
                      ? 'bg-rose-500/20 border border-rose-500/40 text-rose-400 scale-105'
                      : 'bg-rose-500/10 border border-rose-500/20 text-rose-400'
                  }`}>
                    <PomodoroIcon className="h-4 w-4" />
                  </div>
                  <div className="text-left">
                    <div className={`text-xs font-bold transition-colors ${
                      selectedShortcut === 'pomodoro' ? 'text-rose-400' : 'text-zinc-200'
                    }`}>
                      Pomodoro
                    </div>
                    <div className="text-[10px] text-zinc-400 font-normal">
                      Ciclo de foco de 25 min
                    </div>
                  </div>
                </div>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* QUICK TIMER / CRONÔMETRO / POMODORO MODAL */}
      <AnimatePresence>
        {quickModalType && (
          <div 
            onClick={() => setQuickModalType(null)}
            className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-md flex items-center justify-center p-4 cursor-pointer select-none"
          >
            <motion.div
              onClick={(e) => e.stopPropagation()}
              initial={{ scale: 0.95, opacity: 0, y: 15 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 15 }}
              className="cursor-default bg-zinc-950 border border-zinc-800 rounded-3xl p-6 md:p-8 w-full max-w-md md:max-w-2xl shadow-2xl text-left space-y-6 relative max-h-[90vh] overflow-y-auto"
            >
              {/* Header */}
              <div className="flex items-center justify-between border-b border-zinc-900 pb-4">
                <div className="flex items-center gap-3">
                  <div className={`p-3 rounded-2xl border ${
                    quickModalType === 'pomodoro'
                      ? 'bg-rose-500/10 border-rose-500/20 text-rose-400'
                      : quickModalType === 'timer'
                      ? 'bg-amber-500/10 border-amber-500/20 text-amber-400'
                      : 'bg-orange-500/10 border-orange-500/20 text-orange-400'
                  }`}>
                    {quickModalType === 'pomodoro' ? (
                      <PomodoroIcon className="h-5 w-5" />
                    ) : quickModalType === 'timer' ? (
                      <Timer className="h-5 w-5" />
                    ) : (
                      <Clock className="h-5 w-5" />
                    )}
                  </div>
                  <div>
                    <h3 className="text-sm font-extrabold text-white uppercase tracking-wider">
                      {quickModalType === 'pomodoro'
                        ? 'Nova Sessão Pomodoro'
                        : quickModalType === 'timer'
                        ? 'Novo Timer Rápido'
                        : 'Novo Alerta de Cronômetro'}
                    </h3>
                    <p className="text-[11px] text-zinc-400 font-medium">
                      {quickModalType === 'pomodoro'
                        ? 'Ciclo de foco com notificação sonora ao finalizar'
                        : quickModalType === 'timer' 
                        ? 'Contagem regressiva com notificação ao finalizar'
                        : 'Notificação ao atingir o tempo desejado'}
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setQuickModalType(null)}
                  className="p-1.5 rounded-xl text-zinc-400 hover:text-white hover:bg-zinc-900 transition-colors"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              {/* Mode Switcher inside Quick Modal */}
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider block mb-1">
                  Modo de Lembrete
                </label>
                <div className="grid grid-cols-3 gap-2 bg-zinc-900/80 p-1.5 rounded-2xl border border-zinc-800">
                  <button
                    type="button"
                    onClick={() => {
                      setQuickModalType('timer');
                      if (quickMinutes === 25) setQuickMinutes(15);
                    }}
                    className={`py-2 px-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                      quickModalType === 'timer'
                        ? 'bg-amber-500/20 border border-amber-500/50 text-amber-400 shadow-sm'
                        : 'text-zinc-400 hover:text-white'
                    }`}
                  >
                    <Timer className="h-3.5 w-3.5" />
                    <span>Timer</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setQuickModalType('cronometer');
                      if (quickMinutes === 25) setQuickMinutes(10);
                    }}
                    className={`py-2 px-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                      quickModalType === 'cronometer'
                        ? 'bg-orange-500/20 border border-orange-500/50 text-orange-400 shadow-sm'
                        : 'text-zinc-400 hover:text-white'
                    }`}
                  >
                    <Clock className="h-3.5 w-3.5" />
                    <span>Agendado</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setQuickModalType('pomodoro');
                      setQuickHours(0);
                      setQuickMinutes(25);
                    }}
                    className={`py-2 px-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                      quickModalType === 'pomodoro'
                        ? 'bg-rose-500/20 border border-rose-500/50 text-rose-400 shadow-sm'
                        : 'text-zinc-400 hover:text-white'
                    }`}
                  >
                    <PomodoroIcon className="h-3.5 w-3.5 text-rose-400" />
                    <span>Pomodoro</span>
                  </button>
                </div>
              </div>

              {/* Form Content */}
              <form onSubmit={handleCreateQuickReminder} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Left side: Title and Presets */}
                  <div className="space-y-4">
                    {/* Field 1: Title */}
                    <div className="space-y-1.5">
                      <label className="text-[11px] font-bold text-zinc-300 uppercase tracking-wider block">
                        Nome do Lembrete <span className="text-zinc-500 font-normal">(Opcional)</span>
                      </label>
                      <input
                        type="text"
                        value={quickReminderTitle}
                        onChange={(e) => setQuickReminderTitle(e.target.value)}
                        placeholder={
                          quickModalType === 'pomodoro'
                            ? 'Ex: Estudo Pomodoro, Leitura focada, Código...'
                            : quickModalType === 'timer'
                            ? 'Ex: Pausa para o café, Estudo em foco...'
                            : 'Ex: Alerta de treino, Limite de reunião...'
                        }
                        className="w-full bg-zinc-900 border border-zinc-800 focus:border-orange-500 focus:ring-1 focus:ring-orange-500 text-white text-xs rounded-xl px-3.5 py-2.5 outline-none transition-all placeholder:text-zinc-600"
                      />
                    </div>

                    {/* Field 2: Presets */}
                    <div className="space-y-2">
                      <label className="text-[11px] font-bold text-zinc-300 uppercase tracking-wider block">
                        {quickModalType === 'pomodoro' ? 'Ciclos Pomodoro' : 'Atalhos de Tempo'}
                      </label>
                      <div className="grid grid-cols-4 gap-1.5">
                        {(quickModalType === 'pomodoro'
                          ? [
                              { label: '25m Foco', h: 0, m: 25 },
                              { label: '5m Pausa', h: 0, m: 5 },
                              { label: '15m Pausa', h: 0, m: 15 },
                              { label: '50m Intenso', h: 0, m: 50 },
                              { label: '1 hora', h: 1, m: 0 },
                              { label: '1h 30m', h: 1, m: 30 },
                              { label: '2 horas', h: 2, m: 0 },
                              { label: '3 horas', h: 3, m: 0 }
                            ]
                          : quickModalType === 'timer'
                          ? [
                              { label: '1 min', h: 0, m: 1 },
                              { label: '5 min', h: 0, m: 5 },
                              { label: '15 min', h: 0, m: 15 },
                              { label: '25 min', h: 0, m: 25 },
                              { label: '45 min', h: 0, m: 45 },
                              { label: '1 hora', h: 1, m: 0 },
                              { label: '2 horas', h: 2, m: 0 },
                              { label: '5 horas', h: 5, m: 0 }
                            ]
                          : [
                              { label: '1 min', h: 0, m: 1 },
                              { label: '5 min', h: 0, m: 5 },
                              { label: '10 min', h: 0, m: 10 },
                              { label: '30 min', h: 0, m: 30 },
                              { label: '1 hora', h: 1, m: 0 },
                              { label: '2 horas', h: 2, m: 0 },
                              { label: '3 horas', h: 3, m: 0 },
                              { label: '5 horas', h: 5, m: 0 }
                            ]
                        ).map((preset, idx) => {
                          const isActive = quickHours === preset.h && quickMinutes === preset.m;
                          return (
                            <button
                              key={idx}
                              type="button"
                              onClick={() => {
                                setQuickHours(preset.h);
                                setQuickMinutes(preset.m);
                              }}
                              className={`py-1.5 px-2 rounded-lg text-[11px] font-bold transition-all cursor-pointer ${
                                isActive
                                  ? quickModalType === 'pomodoro'
                                    ? 'bg-rose-500/20 border border-rose-500/60 text-rose-400 shadow-sm'
                                    : 'bg-orange-500/20 border border-orange-500/60 text-orange-400 shadow-sm'
                                  : 'bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-white hover:bg-zinc-850'
                              }`}
                            >
                              {preset.label}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  </div>

                  {/* Right side: Time Selector & Preview */}
                  <div className="space-y-4 flex flex-col justify-between">
                    {/* Field 3: Time Selector (Hours & Minutes) */}
                    <div className="space-y-1.5">
                      <label className="text-[11px] font-bold text-zinc-300 uppercase tracking-wider block">
                        Ajuste Fino de Duração (1 min até 10 horas)
                      </label>
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="text-[10px] font-mono font-bold text-zinc-500 uppercase block mb-1">
                            Horas
                          </label>
                          <select
                            value={quickHours}
                            onChange={(e) => setQuickHours(Number(e.target.value))}
                            className="w-full bg-zinc-900 border border-zinc-800 text-white rounded-xl p-2.5 text-xs outline-none focus:border-orange-500 font-mono"
                          >
                            {Array.from({ length: 11 }).map((_, i) => (
                              <option key={i} value={i}>
                                {i} {i === 1 ? 'hora' : 'horas'}
                              </option>
                            ))}
                          </select>
                        </div>

                        <div>
                          <label className="text-[10px] font-mono font-bold text-zinc-500 uppercase block mb-1">
                            Minutos
                          </label>
                          <select
                            value={quickMinutes}
                            onChange={(e) => setQuickMinutes(Number(e.target.value))}
                            className="w-full bg-zinc-900 border border-zinc-800 text-white rounded-xl p-2.5 text-xs outline-none focus:border-orange-500 font-mono"
                          >
                            {Array.from({ length: 60 }).map((_, i) => (
                              <option key={i} value={i}>
                                {i} {i === 1 ? 'minuto' : 'minutos'}
                              </option>
                            ))}
                          </select>
                        </div>
                      </div>
                    </div>

                    {/* Preview Box */}
                    <div className="bg-zinc-900/60 border border-zinc-800/80 rounded-2xl p-3.5 flex items-center justify-between text-xs">
                      <span className="text-zinc-400 font-medium">Horário da Notificação:</span>
                      <span className={`font-extrabold font-mono px-2.5 py-1 rounded-lg border ${
                        quickModalType === 'pomodoro'
                          ? 'text-rose-400 bg-rose-500/10 border-rose-500/20'
                          : 'text-orange-400 bg-orange-500/10 border-orange-500/20'
                      }`}>
                        {new Date(Date.now() + Math.max(60, (quickHours * 3600 + quickMinutes * 60)) * 1000).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Pomodoro Dedicated Break Options */}
                {quickModalType === 'pomodoro' && (
                  <div className="bg-zinc-900/80 border border-rose-500/30 rounded-2xl p-4 space-y-3.5">
                    <div className="flex items-center justify-between flex-wrap gap-2">
                      <span className="text-xs font-bold text-rose-400 uppercase tracking-wider flex items-center gap-1.5">
                        <Flame className="h-4 w-4" />
                        Configuração de Pausas da Sessão
                      </span>
                      <div className="flex bg-zinc-950 p-1 rounded-xl border border-zinc-800 gap-1 text-[10px] font-bold">
                        <button
                          type="button"
                          onClick={() => setPomoBreakMode('interval')}
                          className={`px-2.5 py-1 rounded-lg transition-all cursor-pointer ${
                            pomoBreakMode === 'interval'
                              ? 'bg-rose-500 text-white shadow-sm font-black'
                              : 'text-zinc-400 hover:text-white'
                          }`}
                        >
                          De quanto em quanto
                        </button>
                        <button
                          type="button"
                          onClick={() => setPomoBreakMode('specific')}
                          className={`px-2.5 py-1 rounded-lg transition-all cursor-pointer ${
                            pomoBreakMode === 'specific'
                              ? 'bg-rose-500 text-white shadow-sm font-black'
                              : 'text-zinc-400 hover:text-white'
                          }`}
                        >
                          Tempo específico
                        </button>
                      </div>
                    </div>

                    {pomoBreakMode === 'interval' ? (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                          <label className="text-[10px] font-mono font-bold text-zinc-400 uppercase block mb-1">
                            Pausa a cada (Intervalo de Foco):
                          </label>
                          <div className="flex items-center gap-1.5 bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2">
                            <input
                              type="number"
                              min="5"
                              max="180"
                              value={pomoFocusMinutes}
                              onChange={(e) => setPomoFocusMinutes(Math.max(1, parseInt(e.target.value) || 25))}
                              className="w-full bg-transparent text-xs font-bold font-mono text-white outline-none"
                            />
                            <span className="text-[10px] text-zinc-500 font-mono">min</span>
                          </div>
                        </div>

                        <div>
                          <label className="text-[10px] font-mono font-bold text-zinc-400 uppercase block mb-1">
                            Duração da Pausa:
                          </label>
                          <div className="flex items-center gap-1.5 bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2">
                            <input
                              type="number"
                              min="1"
                              max="60"
                              value={pomoBreakMinutes}
                              onChange={(e) => setPomoBreakMinutes(Math.max(1, parseInt(e.target.value) || 5))}
                              className="w-full bg-transparent text-xs font-bold font-mono text-white outline-none"
                            />
                            <span className="text-[10px] text-zinc-500 font-mono">min</span>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                          <label className="text-[10px] font-mono font-bold text-zinc-400 uppercase block mb-1">
                            Fazer pausa aos (Minutos de Foco):
                          </label>
                          <div className="flex items-center gap-1.5 bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2">
                            <input
                              type="number"
                              min="1"
                              max={(quickHours * 60) + quickMinutes || 120}
                              value={pomoSpecificMinute}
                              onChange={(e) => setPomoSpecificMinute(Math.max(1, parseInt(e.target.value) || 45))}
                              className="w-full bg-transparent text-xs font-bold font-mono text-white outline-none"
                            />
                            <span className="text-[10px] text-zinc-500 font-mono">min</span>
                          </div>
                        </div>

                        <div>
                          <label className="text-[10px] font-mono font-bold text-zinc-400 uppercase block mb-1">
                            Duração da Pausa:
                          </label>
                          <div className="flex items-center gap-1.5 bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2">
                            <input
                              type="number"
                              min="1"
                              max="60"
                              value={pomoBreakMinutes}
                              onChange={(e) => setPomoBreakMinutes(Math.max(1, parseInt(e.target.value) || 5))}
                              className="w-full bg-transparent text-xs font-bold font-mono text-white outline-none"
                            />
                            <span className="text-[10px] text-zinc-500 font-mono">min</span>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Resumo da sessão */}
                    <div className="text-[11px] text-zinc-300 bg-rose-500/10 border border-rose-500/20 p-3 rounded-xl flex items-start gap-2">
                      <Flame className="h-4 w-4 text-rose-400 shrink-0 mt-0.5" />
                      <div>
                        <span className="text-rose-400 font-extrabold block mb-0.5">Resumo do Pomodoro:</span>
                        <span>
                          {pomoBreakMode === 'interval'
                            ? `Sessão total de ${(quickHours * 60) + quickMinutes} min com ${Math.max(1, Math.ceil(((quickHours * 60) + quickMinutes) / (pomoFocusMinutes || 25)))} ciclo(s) de foco (${pomoFocusMinutes} min cada) e pausas de ${pomoBreakMinutes} min.`
                            : `Sessão total de ${(quickHours * 60) + quickMinutes} min com pausa de ${pomoBreakMinutes} min programada para o minuto ${pomoSpecificMinute}.`
                          }
                        </span>
                      </div>
                    </div>
                  </div>
                )}

                {/* Actions */}
                <div className="flex items-center justify-end gap-2.5 pt-4 border-t border-zinc-900">
                  <button
                    type="button"
                    onClick={() => setQuickModalType(null)}
                    className="px-4 py-2.5 rounded-xl border border-zinc-800 hover:bg-zinc-900 text-zinc-400 hover:text-white font-bold text-xs transition-colors cursor-pointer"
                  >
                    Cancelar
                  </button>

                  <button
                    type="submit"
                    className={`px-5 py-2.5 rounded-xl font-extrabold text-xs flex items-center gap-2 transition-all shadow-lg cursor-pointer ${
                      quickModalType === 'pomodoro'
                        ? 'bg-gradient-to-r from-rose-600 to-amber-600 hover:from-rose-500 hover:to-amber-500 text-white shadow-rose-500/20'
                        : 'bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-400 hover:to-amber-400 text-white shadow-orange-500/20'
                    }`}
                  >
                    {quickModalType === 'pomodoro' ? (
                      <PomodoroIcon className="h-4 w-4" />
                    ) : quickModalType === 'timer' ? (
                      <Timer className="h-4 w-4" />
                    ) : (
                      <Clock className="h-4 w-4" />
                    )}
                    <span>
                      {quickModalType === 'pomodoro'
                        ? 'Iniciar Pomodoro'
                        : quickModalType === 'timer'
                        ? 'Iniciar Timer'
                        : 'Criar Alerta'}
                    </span>
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* 4. DESKTOP SIDEBAR HUD (RESPONSIVE COLLAPSIBLE & PINNABLE) */}
      <aside 
        id="sidebarHUD" 
        className={`fixed left-0 top-0 h-full bg-[#040405]/95 backdrop-blur-md border-r border-zinc-900 flex flex-col justify-between transition-all duration-300 select-none z-30 hidden lg:flex ${
          isExpanded ? 'w-64' : 'w-[76px]'
        }`}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        {/* User Mini profile with Leveling details - aligned with Pin button when expanded, and perfectly centered when collapsed */}
        <div className={`border-b border-zinc-900/60 bg-[#07070a]/40 overflow-hidden relative transition-all duration-300 ${
          isExpanded ? 'p-4' : 'py-5 px-0 flex flex-col items-center justify-center'
        }`}>
          <div className={`flex items-center gap-3 ${isExpanded ? 'justify-between w-full' : 'justify-center'}`}>
            <button 
              onClick={() => setActiveTab('perfil')}
              className="flex items-center gap-3 min-w-0 text-left hover:opacity-80 transition-opacity active:scale-95"
              title="Ver seu Perfil"
            >
              <img 
                src={userPhoto} 
                alt={userName} 
                className="h-8 w-8 rounded-full object-cover border border-orange-500/20 flex-shrink-0 shadow-[0_0_8px_rgba(249,115,22,0.15)]"
                referrerPolicy="no-referrer"
              />
              <div className={`transition-opacity duration-300 min-w-0 ${isExpanded ? 'opacity-100 block' : 'opacity-0 hidden w-0 h-0'}`}>
                <h3 className="text-xs font-bold text-white tracking-tight truncate">{userName}</h3>
                <p className="text-[9px] text-orange-500 font-mono font-bold">{xpTotal} XP Acumulados</p>
              </div>
            </button>

            {/* Pin Button - aligned with profile on the right side */}
            {isExpanded && setPinned && (
              <button 
                onClick={() => setPinned(!pinned)}
                className={`p-1.5 rounded hover:bg-zinc-900 transition-colors flex-shrink-0 ${pinned ? 'text-orange-500' : 'text-zinc-500 hover:text-white'}`}
                title={pinned ? 'Desafixar menu' : 'Fixar menu lateral'}
              >
                <Pin className="h-3.5 w-3.5" />
              </button>
            )}
          </div>

          {isExpanded ? (
            <motion.div 
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              className="mt-3 space-y-2.5 w-full"
            >
              {/* Experience progress micro bar */}
              <div>
                <div className="w-full bg-zinc-900/80 h-1.5 rounded-full overflow-hidden border border-zinc-800/40">
                  <div className="bg-gradient-to-r from-orange-500 to-amber-500 h-full rounded-full" style={{ width: `${progressPercent}%` }} />
                </div>
                <div className="flex items-center justify-between text-[8px] font-mono text-gray-500 mt-1">
                  <span>{xpInCurrentLevel} / 1000 XP</span>
                  <button
                    onClick={onOpenStreakHub}
                    className="text-orange-400 hover:text-orange-300 flex items-center gap-0.5 font-bold hover:bg-orange-500/10 px-1 rounded transition-colors"
                    title="Abrir Central de Ofensivas & Congelamento"
                  >
                    <Flame className="h-2.5 w-2.5 animate-pulse" /> {streak} dias
                  </button>
                </div>
              </div>
            </motion.div>
          ) : (
            <div 
              className="w-10 h-1 bg-zinc-900/60 rounded-full overflow-hidden mt-3 border-0"
              title={`Progresso da página: ${Math.round(scrollProgress)}%`}
            >
              <div 
                className="bg-orange-500 h-full rounded-full transition-all duration-75 shadow-[0_0_4px_var(--color-orange-500,#f97316)] border-0" 
                style={{ width: `${scrollProgress}%` }} 
              />
            </div>
          )}
        </div>

        {/* Navigation Section - scrollbar is completely hidden when minimized */}
        <nav 
          className={`flex-1 px-2.5 py-4 space-y-1.5 flex flex-col items-center overflow-y-auto transition-all ${
            isExpanded 
              ? '' 
              : 'no-scrollbar scrollbar-none sidebar-minimized-scroll [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden [&::-webkit-scrollbar]:w-0'
          }`}
        >
          {/* Quick Search Button in Sidebar - perfectly centered when collapsed */}
          <button
            onClick={() => setSearchOpen(true)}
            className={`w-full flex items-center rounded-xl text-zinc-400 hover:text-white hover:bg-zinc-900/40 border border-transparent transition-all group duration-200 ${
              isExpanded ? 'px-3 py-2.5 justify-start' : 'p-2.5 justify-center h-10 w-10'
            }`}
            title="Buscar"
          >
            <Search className="h-4.5 w-4.5 text-zinc-500 group-hover:text-orange-500 transition-colors flex-shrink-0" />
            <div className={`text-left transition-all duration-300 overflow-hidden whitespace-nowrap ${isExpanded ? 'ml-3 opacity-100 max-w-[160px]' : 'ml-0 opacity-0 max-w-0 pointer-events-none'}`}>
              <div className="text-[11px] font-bold leading-none">Buscar Geral</div>
            </div>
          </button>

          {menuItems.map((item) => {
            const isActive = activeTab === item.id;
            const Icon = item.icon;
            
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`w-full flex items-center rounded-xl text-left transition-all group relative duration-200 border ${
                  isActive 
                    ? 'text-orange-500 bg-orange-500/5 border-orange-500/20 shadow-[inset_0_0_8px_rgba(249,115,22,0.05)] font-bold' 
                    : 'text-gray-400 hover:text-white hover:bg-zinc-900/40 border-transparent'
                } ${
                  isExpanded ? 'px-3 py-2.5 justify-start' : 'p-2.5 justify-center h-10 w-10'
                }`}
              >
                {/* Active left tiny glow accent bar */}
                {isActive && (
                  <div className="w-[3px] bg-orange-500 shadow-[0_0_8px_var(--color-orange-500,#f97316)] h-1/2 absolute left-0 top-1/4 rounded-r-lg" />
                )}

                <Icon className={`h-4.5 w-4.5 transition-colors flex-shrink-0 ${isActive ? 'text-orange-500' : 'text-zinc-500 group-hover:text-white'}`} />
                
                <div className={`text-left transition-all duration-300 overflow-hidden whitespace-nowrap ${isExpanded ? 'ml-3 opacity-100 max-w-[160px]' : 'ml-0 opacity-0 max-w-0 pointer-events-none'}`}>
                  <div className="text-[11px] font-bold leading-none">{item.label}</div>
                  <div className="text-[8px] text-zinc-500 mt-1 font-mono">{item.desc}</div>
                </div>
              </button>
            );
          })}
        </nav>

        {/* Utilities: Language Selector & Config Footer - centered and aligned */}
        <div className="p-3 border-t border-zinc-900/60 bg-[#050507]/60 flex flex-col items-center gap-1.5">
          {/* Fullscreen & Install App triggers inside Desktop Sidebar */}
          <div className={`w-full flex flex-col gap-1 ${isExpanded ? 'px-1' : 'items-center px-0'}`}>
            {/* Quick Theme Toggle (Light vs Dark) */}
            {onToggleThemeMode && (
              <button
                onClick={onToggleThemeMode}
                className={`flex items-center rounded-xl text-zinc-400 hover:text-orange-400 hover:bg-orange-500/10 border border-transparent hover:border-orange-500/20 transition-all group duration-200 w-full cursor-pointer ${
                  isExpanded ? 'px-3 py-2 justify-start gap-3' : 'p-2 justify-center h-10 w-10'
                }`}
                title={themeMode === 'light' ? 'Mudar para Modo Escuro' : 'Mudar para Modo Claro'}
              >
                <div className="p-1 bg-amber-500/10 rounded-lg border border-amber-500/20 group-hover:bg-amber-500/20 group-hover:border-amber-500/40 transition-all flex items-center justify-center flex-shrink-0 shadow-[0_0_8px_rgba(245,158,11,0.15)]">
                  {themeMode === 'light' ? (
                    <Moon className="h-3.5 w-3.5 text-zinc-700 group-hover:scale-110 transition-all" />
                  ) : (
                    <Sun className="h-3.5 w-3.5 text-amber-400 group-hover:scale-110 transition-all" />
                  )}
                </div>
                <span className={`text-[11px] font-bold leading-none transition-all duration-300 overflow-hidden whitespace-nowrap ${isExpanded ? 'opacity-100 max-w-[160px]' : 'opacity-0 max-w-0 pointer-events-none'}`}>
                  {themeMode === 'light' ? 'Modo Escuro' : 'Modo Claro'}
                </span>
              </button>
            )}

            <button
              onClick={toggleFullscreen}
              className={`flex items-center rounded-xl text-zinc-400 hover:text-white hover:bg-zinc-900/40 border border-transparent transition-all group duration-200 w-full cursor-pointer ${
                isExpanded ? 'px-3 py-2 justify-start gap-3' : 'p-2 justify-center h-10 w-10'
              }`}
              title="Alternar Tela Cheia"
            >
              {isFullscreen ? (
                <Minimize className="h-4 w-4 text-orange-500 flex-shrink-0 group-hover:scale-110 transition-all" />
              ) : (
                <Maximize className="h-4 w-4 text-zinc-500 group-hover:text-white flex-shrink-0 group-hover:scale-110 transition-all" />
              )}
              <span className={`text-[11px] font-bold leading-none transition-all duration-300 overflow-hidden whitespace-nowrap ${isExpanded ? 'opacity-100 max-w-[160px]' : 'opacity-0 max-w-0 pointer-events-none'}`}>
                {isFullscreen ? 'Sair de Tela' : 'Tela Cheia'}
              </span>
            </button>

            {appLockEnabled && onLockApp && (
              <button
                onClick={onLockApp}
                className={`flex items-center rounded-xl text-zinc-400 hover:text-orange-400 hover:bg-orange-500/10 border border-transparent hover:border-orange-500/20 transition-all group duration-200 w-full ${
                  isExpanded ? 'px-3 py-2 justify-start gap-3' : 'p-2 justify-center h-10 w-10'
                }`}
                title="Trancar App (PIN)"
              >
                <div className="p-1 bg-orange-500/10 rounded-lg border border-orange-500/20 group-hover:bg-orange-500/20 group-hover:border-orange-500/40 transition-all flex items-center justify-center flex-shrink-0 shadow-[0_0_8px_rgba(249,115,22,0.15)]">
                  <Lock className="h-3.5 w-3.5 text-orange-400 group-hover:scale-110 transition-all" />
                </div>
                <span className={`text-[11px] font-bold leading-none transition-all duration-300 overflow-hidden whitespace-nowrap ${isExpanded ? 'opacity-100 max-w-[160px]' : 'opacity-0 max-w-0 pointer-events-none'}`}>
                  Trancar App
                </span>
              </button>
            )}
          </div>

          <div className={`text-center mt-2 transition-all duration-300 overflow-hidden ${isExpanded ? 'opacity-100 max-h-6' : 'opacity-0 max-h-0'}`}>
            <span className="text-[8px] text-zinc-600 font-mono uppercase block">TRONUS SYSTEMS</span>
          </div>
        </div>
      </aside>

      {/* 5. GORGEOUS DETAILED GLOBAL SEARCH OVERLAY */}
      <AnimatePresence>
        {searchOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* Dark background overlay */}
            <motion.div 
              className="fixed inset-0 bg-black/95 backdrop-blur-md"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSearchOpen(false)}
            />

            {/* Container box */}
            <motion.div 
              className="relative bg-zinc-950/80 border border-zinc-800 rounded-2xl w-full max-w-2xl overflow-hidden z-50 flex flex-col h-[520px] shadow-[0_0_50px_rgba(249,115,22,0.15)]"
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
            >
              {/* Header search bar area */}
              <div className="p-4 border-b border-zinc-900 flex items-center justify-between gap-3">
                <div className="flex-1 relative flex items-center">
                  <Search className="h-5 w-5 text-orange-500 absolute left-3 pointer-events-none" />
                  <input
                    ref={searchInputRef}
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="O que você está procurando? Digite sua busca..."
                    className="w-full bg-zinc-900/60 border border-zinc-800 rounded-xl py-3 pl-10 pr-24 text-sm text-white focus:outline-none focus:border-orange-500/50 transition-colors font-sans"
                  />
                  <div className="absolute right-3 hidden sm:flex gap-1.5 pointer-events-none">
                    <kbd className="px-2 py-0.5 bg-zinc-950 border border-zinc-800 text-[9px] font-mono text-zinc-500 rounded">ESC</kbd>
                  </div>
                </div>
                <button 
                  onClick={() => setSearchOpen(false)}
                  className="p-2 hover:bg-zinc-900 text-zinc-400 hover:text-white rounded-xl transition-colors"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              {/* Filters list */}
              <div className="px-4 py-2 bg-zinc-950 border-b border-zinc-900 flex items-center overflow-x-auto scrollbar-none">
                <nav className="internal-nav-secondary max-w-full flex-nowrap" aria-label="Filtros de Pesquisa">
                  {[
                    { id: 'todos', label: 'Todos' },
                    { id: 'tarefas', label: 'Checklist' },
                    { id: 'rotina', label: 'Rotinas' },
                    { id: 'metas', label: 'Metas' },
                    { id: 'notas', label: 'Notas' },
                    { id: 'documentos', label: 'Documentos' },
                    { id: 'calendario', label: 'Calendário / Fé' }
                  ].map((f) => (
                    <button
                      type="button"
                      key={f.id}
                      onClick={() => setSearchFilter(f.id)}
                      className={`internal-nav-secondary-btn ${searchFilter === f.id ? 'active' : ''}`}
                    >
                      <span>{f.label}</span>
                    </button>
                  ))}
                </nav>
              </div>

              {/* Search Results lists */}
              <div className="flex-1 overflow-y-auto p-4 space-y-2">
                {searchResults.length > 0 ? (
                  searchResults.map((res) => {
                    const iconMap = {
                      Tarefa: <CheckCircle className="h-4 w-4 text-blue-400" />,
                      Rotina: <Clock className="h-4 w-4 text-purple-400" />,
                      Meta: <Target className="h-4 w-4 text-orange-400" />,
                      Nota: <Book className="h-4 w-4 text-emerald-400" />,
                      Documento: <FileText className="h-4 w-4 text-yellow-400" />,
                      Calendário: <Heart className="h-4 w-4 text-red-400" />
                    };
                    return (
                      <button
                        key={res.id}
                        onClick={() => handleSearchResultClick(res.tab)}
                        className="w-full flex items-start gap-3.5 p-3.5 bg-zinc-900/30 hover:bg-orange-500/5 border border-zinc-900 hover:border-orange-500/20 rounded-xl transition-all hover:translate-x-1 duration-200 text-left"
                      >
                        <div className="p-2 bg-zinc-950 rounded-lg border border-zinc-800">
                          {iconMap[res.category]}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex justify-between items-center">
                            <span className="text-xs font-black text-white uppercase tracking-wide truncate">{res.title}</span>
                            <span className="text-[8px] font-mono font-bold text-orange-500 bg-orange-500/10 px-1.5 py-0.5 rounded border border-orange-500/20 uppercase">
                              {res.category}
                            </span>
                          </div>
                          <p className="text-[11px] text-gray-500 mt-1 leading-relaxed line-clamp-1">{res.description}</p>
                        </div>
                      </button>
                    );
                  })
                ) : (
                  <div className="text-center py-20">
                    <HelpCircle className="h-10 w-10 text-zinc-700 mx-auto mb-3 animate-pulse" />
                    <h4 className="text-xs font-bold text-white uppercase tracking-wider">Nenhum resultado encontrado</h4>
                    <p className="text-[11px] text-zinc-500 mt-1.5 max-w-xs mx-auto">
                      Digite outras palavras ou altere seus filtros de categorias no menu acima.
                    </p>
                  </div>
                )}
              </div>

              {/* Bottom bar search hint */}
              <div className="p-3 bg-zinc-950 border-t border-zinc-900 text-[10px] text-zinc-600 font-mono text-center">
                HUD SEARCH SYSTEM • CLIQUE EM UM RESULTADO PARA IR DIRETAMENTE À PÁGINA
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* 6. PWA INSTALLATION GUIDE MODAL (TRONUS DESIGNED) */}
      <AnimatePresence>
        {showInstallModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* Backdrop with extreme blur */}
            <motion.div 
              className="fixed inset-0 bg-black/95 backdrop-blur-md"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowInstallModal(false)}
            />

            {/* Glowing Panel */}
            <motion.div 
              className="bg-zinc-950 border border-orange-500/30 rounded-2xl p-6 max-w-md w-full relative overflow-hidden z-50 shadow-[0_0_40px_rgba(249,115,22,0.15)]"
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
            >
              {/* Neon border top accent */}
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-orange-500 via-amber-500 to-orange-500" />

              {/* Close Button */}
              <button 
                onClick={() => setShowInstallModal(false)}
                className="absolute top-4 right-4 p-1 hover:bg-zinc-900 text-zinc-500 hover:text-white rounded-lg transition-colors"
              >
                <X className="h-4 w-4" />
              </button>

              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 rounded-xl border border-orange-500/40 bg-black overflow-hidden flex items-center justify-center p-0.5 shadow-[0_0_20px_rgba(249,115,22,0.3)] flex-shrink-0">
                  <img src="/icon-192.png" alt="Life Organizer App Icon" className="w-full h-full object-contain rounded-lg" referrerPolicy="no-referrer" />
                </div>
                <div>
                  <h3 className="text-sm font-black text-white uppercase tracking-wider">Instalar Life Organizer</h3>
                  <p className="text-[9px] text-orange-500 font-mono font-bold">EXPERIÊNCIA DE APLICATIVO NATIVO</p>
                </div>
              </div>

              <p className="text-xs text-zinc-400 mb-5 leading-relaxed">
                Instale o painel na tela inicial do seu dispositivo para obter inicialização instantânea, desempenho aprimorado, tela cheia real e acesso offline facilitado!
              </p>

              <div className="space-y-4">
                {/* iOS Safari Guide */}
                <div className="p-3.5 bg-zinc-900/50 rounded-xl border border-zinc-900/80">
                  <div className="flex items-center gap-2 mb-2">
                    <Laptop className="h-3.5 w-3.5 text-orange-500" />
                    <span className="text-xs font-bold text-white font-mono">DISPOSITIVOS APPLE (iOS / Safari)</span>
                  </div>
                  <ol className="text-[11px] text-zinc-400 list-decimal pl-4 space-y-1">
                    <li>Pressione o botão de <strong className="text-orange-400">Compartilhar</strong> (ícone de quadrado com seta para cima na barra inferior).</li>
                    <li>Role o menu de opções e toque em <strong className="text-white">"Adicionar à Tela de Início"</strong>.</li>
                    <li>Confirme clicando em <strong className="text-orange-400">"Adicionar"</strong> no canto superior direito.</li>
                  </ol>
                </div>

                {/* Android Chrome Guide */}
                <div className="p-3.5 bg-zinc-900/50 rounded-xl border border-zinc-900/80">
                  <div className="flex items-center gap-2 mb-2">
                    <Smartphone className="h-3.5 w-3.5 text-orange-500" />
                    <span className="text-xs font-bold text-white font-mono">ANDROID & CHROME (Desktop/Mobile)</span>
                  </div>
                  <ol className="text-[11px] text-zinc-400 list-decimal pl-4 space-y-1">
                    <li>Toque no ícone de <strong className="text-orange-400">três pontinhos</strong> (canto superior direito do navegador).</li>
                    <li>Selecione a opção <strong className="text-white">"Instalar aplicativo"</strong> ou <strong className="text-white">"Adicionar à tela inicial"</strong>.</li>
                    <li>Aproveite o Life Organizer com suporte completo a gestos e imersão total!</li>
                  </ol>
                </div>
              </div>

              <button
                onClick={() => setShowInstallModal(false)}
                className="w-full bg-orange-500 hover:bg-orange-600 text-white font-bold text-xs py-2.5 rounded-lg mt-5 transition-all uppercase tracking-wider"
              >
                Entendido
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}

export default React.memo(Sidebar);
