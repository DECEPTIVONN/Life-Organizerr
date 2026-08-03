import React, { useState, useEffect, useRef } from 'react';
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
  LogOut
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { QuickReminder } from '../types';

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
}

interface SearchResult {
  id: string;
  title: string;
  description: string;
  category: 'Tarefa' | 'Rotina' | 'Meta' | 'Nota' | 'Documento' | 'Calendário';
  tab: string;
}

export default function Sidebar({ 
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
  onAddReminder
}: SidebarProps) {
  
  // Animation/HUD state
  const [isHovered, setIsHovered] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchFilter, setSearchFilter] = useState<string>('todos');
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [showLanguageDropdown, setShowLanguageDropdown] = useState(false);

  const searchInputRef = useRef<HTMLInputElement>(null);

  // Fullscreen state
  const [isFullscreen, setIsFullscreen] = useState(false);
  
  // PWA states
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [showInstallModal, setShowInstallModal] = useState(false);

  // Long-press state for mobile navbar "Notas" tab
  const [radialMenuOpen, setRadialMenuOpen] = useState(false);
  const [selectedShortcut, setSelectedShortcut] = useState<'timer' | 'cronometro' | 'lembretes'>('timer');
  const [pressProgress, setPressProgress] = useState(0);
  const longPressTimerRef = useRef<any>(null);
  const progressAnimRef = useRef<any>(null);
  const pressStartTsRef = useRef<number>(0);
  const touchStartYRef = useRef<number | null>(null);

  // Quick Modal state for Timer & Cronômetro
  const [quickModalType, setQuickModalType] = useState<'timer' | 'cronometer' | null>(null);
  const [quickReminderTitle, setQuickReminderTitle] = useState('');
  const [quickHours, setQuickHours] = useState<number>(0);
  const [quickMinutes, setQuickMinutes] = useState<number>(15);

  const handleCreateQuickReminder = (e: React.FormEvent) => {
    e.preventDefault();
    if (!quickModalType) return;

    const totalSecs = Math.max(60, Math.min(36000, (quickHours * 3600) + (quickMinutes * 60))); // 1 min to 10 hours
    const defaultTitle = quickModalType === 'timer' ? 'Timer Rápido' : 'Alerta de Cronômetro';
    const targetTs = Date.now() + totalSecs * 1000;
    const formattedTarget = new Date(targetTs).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });

    const newReminder: QuickReminder = {
      id: 'rem-' + Math.random().toString(36).substring(2, 9),
      title: quickReminderTitle.trim() || defaultTitle,
      description: `Notificação agendada para as ${formattedTarget} (${quickHours > 0 ? `${quickHours}h ` : ''}${quickMinutes}min)`,
      mode: quickModalType,
      durationSeconds: totalSecs,
      targetTimestamp: targetTs,
      status: 'active',
      createdAt: new Date().toISOString(),
      soundEnabled: true,
      category: 'Foco',
      priority: 'media'
    };

    // Immediate Web Browser Notification on Creation
    if (typeof Notification !== 'undefined') {
      if (Notification.permission === 'granted') {
        const modeLabel = quickModalType === 'timer' ? '⏱️ Timer Iniciado' : '⏰ Alerta de Cronômetro Ativo';
        new Notification(`${modeLabel}: ${newReminder.title}`, {
          body: `Contagem ativa! (${quickHours > 0 ? `${quickHours}h ` : ''}${quickMinutes}min). Notificação agendada para as ${formattedTarget}.`,
          icon: '/icon.png'
        });
      } else if (Notification.permission !== 'denied') {
        Notification.requestPermission();
      }
    }

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
      if (selectedShortcut === 'timer') {
        setQuickModalType('timer');
        setQuickReminderTitle('');
        setQuickHours(0);
        setQuickMinutes(25);
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
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    window.addEventListener('resize', handleScroll, { passive: true });

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
      observer.disconnect();
    };
  }, [activeTab]);

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
    { id: 'resumo', label: 'Vida em resumo', desc: 'Painel holístico', icon: Compass },
    { id: 'checklist', label: 'Missões Diárias', desc: 'Metas e rotinas diárias', icon: CheckSquare },
    { id: 'rotina', label: 'Rotina Semanal', desc: 'Hábitos frequentes', icon: Clock },
    { id: 'habitos', label: 'Hábitos', desc: 'Bons & Ruins', icon: Zap },
    { id: 'metas', label: 'Metas', desc: 'Evolução pessoal', icon: Target },
    { id: 'financas', label: 'Finanças', desc: 'Gestão de capital', icon: DollarSign },
    { id: 'calendario', label: 'Agenda', desc: 'Diário & Fé', icon: Calendar },
    { id: 'anuais', label: 'Anuais', desc: 'Pastas, diários & livros', icon: Layers },
    { id: 'documentos', label: 'Arquivamento', desc: 'Documentos e PDFs', icon: Archive },
    { id: 'notas', label: 'Banco de Notas', desc: 'Segundo cérebro', icon: BookOpen },
    { id: 'lembretes', label: 'Lembretes Rápido', desc: 'Timers e Alertas', icon: Bell },
    { id: 'perfil', label: 'Perfil de Foco', desc: 'Status e conquistas', icon: User },
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
      id: 'rotina',
      label: 'Rotina Semanal',
      desc: 'Hábitos frequentes',
      icon: Clock,
      action: () => {
        setActiveTab('rotina');
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
      id: 'habitos',
      label: 'Hábitos',
      desc: 'Bons & Ruins',
      icon: Zap,
      action: () => {
        setActiveTab('habitos');
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
      id: 'perfil',
      label: 'Perfil de Foco',
      desc: 'Status e conquistas',
      icon: User,
      action: () => {
        setActiveTab('perfil');
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
        className="hidden lg:flex fixed top-0 right-0 w-2.5 hover:w-3.5 h-full bg-zinc-900/40 hover:bg-zinc-800/80 transition-all duration-150 z-50 cursor-pointer group flex-col justify-start overflow-hidden select-none"
        title={`Progresso da página: ${Math.round(scrollProgress)}% • Clique ou arraste para navegar`}
      >
        <div 
          className="w-full bg-gradient-to-b from-orange-500 via-amber-500 to-orange-400 shadow-[0_0_12px_var(--color-orange-500,#f97316)] transition-all duration-75 relative rounded-b-full"
          style={{ height: `${scrollProgress}%` }}
        />
      </div>

      {/* 2. MOBILE HEADER BAR (TOP UTILITIES) */}
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
        <div className="flex items-center gap-3">
          {/* Quick Search */}
          <button 
            onClick={() => setSearchOpen(true)}
            className="p-2 bg-zinc-900/40 text-zinc-400 hover:text-orange-500 rounded-xl border border-zinc-800/80 transition-all active:scale-95 flex items-center justify-center"
            title="Buscar Geral"
          >
            <Search className="h-4.5 w-4.5" />
          </button>

          {/* Mobile Fullscreen Toggle Button */}
          <button 
            onClick={toggleFullscreen}
            className="p-2 bg-zinc-900/40 text-zinc-400 hover:text-white rounded-xl border border-zinc-800/80 transition-all active:scale-95 flex items-center justify-center"
            title="Modo Tela Cheia"
          >
            {isFullscreen ? <Minimize className="h-4.5 w-4.5 text-orange-500" /> : <Maximize className="h-4.5 w-4.5" />}
          </button>
        </div>
      </div>

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
              onClick={() => setMobileMenuOpen(false)}
            />

            {/* Sidebar content */}
            <motion.div 
              className="relative flex flex-col w-64 h-full bg-[#09090b] border-r border-zinc-900 z-50 p-5 pt-8"
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
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

              {/* Profile card inside mobile */}
              <div className="mb-6 p-4 bg-zinc-950 rounded-xl border border-zinc-900">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-orange-500/10 rounded-lg border border-orange-500/20">
                    <Trophy className="h-5 w-5 text-orange-500" />
                  </div>
                  <div>
                    <h4 className="text-xs font-black text-white uppercase tracking-wider">Membro Premium</h4>
                    <p className="text-[10px] text-gray-500 font-mono mt-0.5">Nível {level} ({xpTotal} XP)</p>
                  </div>
                </div>
                
                {/* Micro Streak */}
                <div className="mt-3 pt-3 border-t border-zinc-900 flex items-center justify-between">
                  <span className="text-[10px] text-gray-400 flex items-center gap-1">
                    <Flame className="h-3.5 w-3.5 text-orange-500" /> Streak:
                  </span>
                  <span className="text-[10px] font-bold text-orange-400 font-mono">
                    {streak} dias
                  </span>
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

      {/* 3. MOBILE CURVED FUTURISTIC BOTTOM NAV BAR */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 h-[92px] pointer-events-none z-40">

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
            className="relative flex flex-col items-center justify-center w-14 h-14 group cursor-pointer"
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
            className="relative flex flex-col items-center justify-center w-14 h-14 group cursor-pointer"
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
            className="relative flex flex-col items-center justify-center w-14 h-14 group cursor-pointer"
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
            className="relative flex flex-col items-center justify-center w-14 h-14 group cursor-pointer"
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
            className="relative flex flex-col items-center justify-center w-14 h-14 group cursor-pointer select-none"
            title="Segure para Atalhos de Tempo"
          >
            {/* Visual holding progress ring */}
            {pressProgress > 0 && (
              <svg className="absolute inset-0 w-full h-full -rotate-90 pointer-events-none z-20">
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
                  setQuickMinutes(25);
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
            </div>
          </div>
        </div>
      )}

      {/* QUICK TIMER / CRONÔMETRO MODAL */}
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
              className="cursor-default bg-zinc-950 border border-zinc-800 rounded-3xl p-6 w-full max-w-md shadow-2xl text-left space-y-5 relative"
            >
              {/* Header */}
              <div className="flex items-center justify-between border-b border-zinc-900 pb-4">
                <div className="flex items-center gap-3">
                  <div className={`p-3 rounded-2xl border ${
                    quickModalType === 'timer'
                      ? 'bg-amber-500/10 border-amber-500/20 text-amber-400'
                      : 'bg-orange-500/10 border-orange-500/20 text-orange-400'
                  }`}>
                    {quickModalType === 'timer' ? <Timer className="h-5 w-5" /> : <Clock className="h-5 w-5" />}
                  </div>
                  <div>
                    <h3 className="text-sm font-extrabold text-white uppercase tracking-wider">
                      {quickModalType === 'timer' ? 'Novo Timer Rápido' : 'Novo Alerta de Cronômetro'}
                    </h3>
                    <p className="text-[11px] text-zinc-400 font-medium">
                      {quickModalType === 'timer' 
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

              {/* Form Content */}
              <form onSubmit={handleCreateQuickReminder} className="space-y-4">
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
                      quickModalType === 'timer'
                        ? 'Ex: Pausa para o café, Estudo em foco...'
                        : 'Ex: Alerta de treino, Limite de reunião...'
                    }
                    className="w-full bg-zinc-900 border border-zinc-800 focus:border-orange-500 focus:ring-1 focus:ring-orange-500 text-white text-xs rounded-xl px-3.5 py-2.5 outline-none transition-all placeholder:text-zinc-600"
                  />
                </div>

                {/* Field 2: Presets */}
                <div className="space-y-2">
                  <label className="text-[11px] font-bold text-zinc-300 uppercase tracking-wider block">
                    Atalhos de Tempo
                  </label>
                  <div className="grid grid-cols-4 gap-1.5">
                    {(quickModalType === 'timer'
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
                              ? 'bg-orange-500/20 border border-orange-500/60 text-orange-400 shadow-sm'
                              : 'bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-white hover:bg-zinc-850'
                          }`}
                        >
                          {preset.label}
                        </button>
                      );
                    })}
                  </div>
                </div>

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
                  <span className="text-orange-400 font-extrabold font-mono bg-orange-500/10 border border-orange-500/20 px-2.5 py-1 rounded-lg">
                    {new Date(Date.now() + Math.max(60, (quickHours * 3600 + quickMinutes * 60)) * 1000).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>

                {/* Actions */}
                <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-zinc-900">
                  <button
                    type="button"
                    onClick={() => setQuickModalType(null)}
                    className="px-4 py-2.5 rounded-xl border border-zinc-800 hover:bg-zinc-900 text-zinc-400 hover:text-white font-bold text-xs transition-colors cursor-pointer"
                  >
                    Cancelar
                  </button>

                  <button
                    type="submit"
                    className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-400 hover:to-amber-400 text-white font-extrabold text-xs flex items-center gap-2 transition-all shadow-lg shadow-orange-500/20 cursor-pointer"
                  >
                    {quickModalType === 'timer' ? <Timer className="h-4 w-4" /> : <Clock className="h-4 w-4" />}
                    <span>{quickModalType === 'timer' ? 'Iniciar Timer' : 'Criar Alerta'}</span>
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
                <div className="w-full bg-zinc-900 h-1.5 rounded-full overflow-hidden border border-zinc-800">
                  <div className="bg-gradient-to-r from-orange-500 to-amber-500 h-full rounded-full" style={{ width: `${progressPercent}%` }} />
                </div>
                <div className="flex items-center justify-between text-[8px] font-mono text-gray-500 mt-1">
                  <span>{xpInCurrentLevel} / 1000 XP</span>
                  <span className="text-orange-500 flex items-center gap-0.5 font-bold">
                    <Flame className="h-2.5 w-2.5" /> {streak} dias
                  </span>
                </div>
              </div>
            </motion.div>
          ) : (
            <div 
              className="w-10 h-1 bg-zinc-900 rounded-full overflow-hidden mt-3 border border-zinc-800"
              title={`Progresso da página: ${Math.round(scrollProgress)}%`}
            >
              <div 
                className="bg-orange-500 h-full rounded-full transition-all duration-75 shadow-[0_0_6px_var(--color-orange-500,#f97316)]" 
                style={{ width: `${scrollProgress}%` }} 
              />
            </div>
          )}
        </div>

        {/* Navigation Section */}
        <nav className="flex-1 px-2.5 py-4 space-y-1.5 overflow-y-auto scrollbar-none flex flex-col items-center">
          {/* Quick Search Button in Sidebar - perfectly centered when collapsed */}
          <button
            onClick={() => setSearchOpen(true)}
            className={`w-full flex items-center rounded-xl text-zinc-400 hover:text-white hover:bg-zinc-900/40 border border-transparent transition-all group duration-200 ${
              isExpanded ? 'px-3 py-2.5 justify-start' : 'p-2.5 justify-center h-10 w-10'
            }`}
            title="Buscar"
          >
            <Search className="h-4.5 w-4.5 text-zinc-500 group-hover:text-orange-500 transition-colors flex-shrink-0" />
            <div className={`text-left transition-all duration-300 ${isExpanded ? 'ml-3 opacity-100 block' : 'ml-0 opacity-0 hidden w-0 h-0 overflow-hidden'}`}>
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
                
                <div className={`text-left transition-all duration-300 ${isExpanded ? 'ml-3 opacity-100 block' : 'ml-0 opacity-0 hidden w-0 h-0 overflow-hidden'}`}>
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
            <button
              onClick={toggleFullscreen}
              className={`flex items-center rounded-xl text-zinc-400 hover:text-white hover:bg-zinc-900/40 border border-transparent transition-all group duration-200 w-full ${
                isExpanded ? 'px-3 py-2 justify-start gap-3' : 'p-2 justify-center h-10 w-10'
              }`}
              title="Alternar Tela Cheia"
            >
              {isFullscreen ? (
                <Minimize className="h-4 w-4 text-orange-500 flex-shrink-0 group-hover:scale-110 transition-all" />
              ) : (
                <Maximize className="h-4 w-4 text-zinc-500 group-hover:text-white flex-shrink-0 group-hover:scale-110 transition-all" />
              )}
              <span className={`text-[11px] font-bold leading-none transition-all duration-300 ${isExpanded ? 'opacity-100 block' : 'opacity-0 hidden w-0 overflow-hidden'}`}>
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
                <span className={`text-[11px] font-bold leading-none transition-all duration-300 ${isExpanded ? 'opacity-100 block' : 'opacity-0 hidden w-0 overflow-hidden'}`}>
                  Trancar App
                </span>
              </button>
            )}
          </div>

          <div className={`text-center mt-2 transition-all duration-300 ${isExpanded ? 'opacity-100 block' : 'opacity-0 hidden h-0'}`}>
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
              <div className="px-4 py-2 bg-zinc-950 border-b border-zinc-900 flex gap-2 overflow-x-auto scrollbar-none">
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
                    key={f.id}
                    onClick={() => setSearchFilter(f.id)}
                    className={`px-3 py-1 rounded-full text-[10px] font-bold border whitespace-nowrap transition-all ${
                      searchFilter === f.id
                        ? 'bg-orange-500/10 border-orange-500/40 text-orange-400 shadow-[0_0_8px_rgba(249,115,22,0.1)]'
                        : 'bg-zinc-900 border-zinc-800/80 text-gray-400 hover:text-white'
                    }`}
                  >
                    {f.label}
                  </button>
                ))}
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
                <div className="p-2.5 bg-orange-500/10 rounded-xl border border-orange-500/20 text-orange-500">
                  <Smartphone className="h-6 w-6 animate-bounce" />
                </div>
                <div>
                  <h3 className="text-sm font-black text-white uppercase tracking-wider">Instalar TRONUS HUD</h3>
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
                    <li>Aproveite o TRONUS com suporte completo a gestos e imersão total!</li>
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
