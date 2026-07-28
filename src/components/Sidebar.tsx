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
  LogOut
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

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
  currentUser
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
  
  // Sync state
  const [showSyncModal, setShowSyncModal] = useState(false);

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
      {/* 1. GAMIFIED PROGRESS BAR (TOP OF THE SCREEN) */}
      <div 
        id="progressBar" 
        className="fixed top-0 left-0 h-1 bg-gradient-to-r from-orange-500 via-amber-500 to-orange-400 z-50 transition-all duration-300 shadow-[0_0_8px_#f97316]"
        style={{ width: `${progressPercent}%` }}
      />

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
          {/* Mobile Cloud Sync Status Button */}
          <button 
            onClick={() => setShowSyncModal(true)}
            className={`p-2 bg-zinc-900/40 rounded-xl border border-zinc-800/80 transition-all active:scale-95 flex items-center justify-center ${
              syncKey 
                ? syncStatus === 'syncing' 
                  ? 'text-amber-500 animate-pulse border-amber-500/20 shadow-[0_0_8px_rgba(245,158,11,0.2)]' 
                  : syncStatus === 'error' 
                    ? 'text-red-500 border-red-500/20' 
                    : 'text-green-500 border-green-500/20 shadow-[0_0_8px_rgba(34,197,94,0.2)]' 
                : 'text-zinc-500 hover:text-white'
            }`}
            title="Sincronização na Nuvem"
          >
            {syncKey ? <Cloud className="h-4.5 w-4.5" /> : <CloudOff className="h-4.5 w-4.5 text-zinc-600" />}
          </button>

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
                      setShowSyncModal(true);
                    }}
                    className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-xs font-bold text-gray-400 hover:text-white hover:bg-zinc-900 border border-transparent transition-all"
                  >
                    <Cloud className={`h-4 w-4 ${syncKey ? 'text-green-500 animate-pulse' : 'text-orange-500'}`} />
                    <div className="text-left">
                      <div className="text-xs font-bold text-zinc-300">Sincronizar Dispositivos</div>
                      <div className="text-[9px] text-zinc-500 font-mono mt-0.5">
                        {syncKey ? `Conectado: ${syncKey}` : 'Sincronizar dados na nuvem'}
                      </div>
                    </div>
                  </button>

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
              stroke="#f97316" 
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

          {/* Item 5: Notas */}
          <button 
            onClick={() => {
              setActiveTab('notas');
              setMobileMenuOpen(false);
            }}
            className="relative flex flex-col items-center justify-center w-14 h-14 group cursor-pointer"
          >
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

          {isExpanded && (
            <motion.div 
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              className="mt-3 space-y-2 w-full"
            >
              {/* Experience progress micro bar */}
              <div className="w-full bg-zinc-900 h-1.5 rounded-full overflow-hidden border border-zinc-800">
                <div className="bg-gradient-to-r from-orange-500 to-amber-500 h-full rounded-full" style={{ width: `${progressPercent}%` }} />
              </div>
              <div className="flex items-center justify-between text-[8px] font-mono text-gray-500">
                <span>{xpInCurrentLevel} / 1000 XP</span>
                <span className="text-orange-500 flex items-center gap-0.5 font-bold">
                  <Flame className="h-2.5 w-2.5" /> {streak} dias
                </span>
              </div>
            </motion.div>
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
                  <div className="w-[3px] bg-orange-500 shadow-[0_0_8px_#f97316] h-1/2 absolute left-0 top-1/4 rounded-r-lg" />
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
              onClick={() => setShowSyncModal(true)}
              className={`flex items-center rounded-xl text-zinc-400 hover:text-white hover:bg-zinc-900/40 border border-transparent transition-all group duration-200 w-full ${
                isExpanded ? 'px-3 py-2 justify-start gap-3' : 'p-2 justify-center h-10 w-10'
              }`}
              title="Sincronização na Nuvem"
            >
              <Cloud className={`h-4 w-4 flex-shrink-0 group-hover:scale-110 transition-all ${
                syncKey 
                  ? syncStatus === 'syncing' 
                    ? 'text-amber-500 animate-pulse' 
                    : syncStatus === 'error' 
                      ? 'text-red-500' 
                      : 'text-green-500' 
                  : 'text-orange-500'
              }`} />
              <span className={`text-[11px] font-bold leading-none transition-all duration-300 ${isExpanded ? 'opacity-100 block' : 'opacity-0 hidden w-0 overflow-hidden'}`}>
                {syncKey ? (syncStatus === 'error' ? 'Erro de Sync' : syncStatus === 'syncing' ? 'Sincronizando' : 'Sincronizado') : 'Sincronizar'}
              </span>
            </button>

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

      {/* 7. SUPABASE SYNC MODAL */}
      <AnimatePresence>
        {showSyncModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div 
              className="fixed inset-0 bg-black/95 backdrop-blur-md"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowSyncModal(false)}
            />

            <motion.div 
              className="bg-zinc-950 border border-emerald-500/30 rounded-2xl p-6 max-w-md w-full relative overflow-hidden z-50 shadow-[0_0_40px_rgba(16,185,129,0.15)]"
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
            >
              {/* Neon border top accent */}
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-emerald-500 via-teal-500 to-emerald-500" />

              {/* Close Button */}
              <button 
                onClick={() => setShowSyncModal(false)}
                className="absolute top-4 right-4 p-1 hover:bg-zinc-900 text-zinc-500 hover:text-white rounded-lg transition-colors"
              >
                <X className="h-4 w-4" />
              </button>

              <div className="flex items-center gap-3 mb-4">
                <div className="p-2.5 bg-emerald-500/10 rounded-xl border border-emerald-500/20 text-emerald-400">
                  <Cloud className="h-6 w-6 animate-pulse" />
                </div>
                <div>
                  <h3 className="text-sm font-black text-white uppercase tracking-wider">Sincronização Cloud</h3>
                  <p className="text-[9px] text-emerald-400 font-mono font-bold">SUPABASE DATABASE</p>
                </div>
              </div>

              <p className="text-xs text-zinc-400 mb-5 leading-relaxed">
                Seus dados são salvos e sincronizados automaticamente na nuvem sempre que você realiza alterações. Ao abrir o aplicativo em qualquer dispositivo, seu progresso é recuperado instantaneamente!
              </p>

              {syncKey ? (
                <div className="space-y-4">
                  {/* Connected Status Card */}
                  <div className={`p-4 rounded-xl border flex flex-col gap-2 relative transition-all ${
                    syncStatus === 'error'
                      ? 'border-red-500/25 bg-red-950/10'
                      : syncStatus === 'syncing'
                        ? 'border-amber-500/25 bg-amber-950/10'
                        : 'border-green-500/20 bg-zinc-900/50'
                  }`}>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className={`w-2 h-2 rounded-full animate-pulse inline-block ${
                          syncStatus === 'error' ? 'bg-red-500' : syncStatus === 'syncing' ? 'bg-amber-500' : 'bg-green-500'
                        }`}></span>
                        <span className={`text-[10px] font-mono font-bold uppercase tracking-widest ${
                          syncStatus === 'error' ? 'text-red-500' : syncStatus === 'syncing' ? 'text-amber-500' : 'text-green-500'
                        }`}>
                          {syncStatus === 'error' 
                            ? 'ERRO DE CONEXÃO' 
                            : syncStatus === 'syncing' 
                              ? 'SINCRONIZANDO COM A NUVEM' 
                              : 'SINC ATIVA E AUTOMÁTICA'}
                        </span>
                      </div>
                      <span className="text-[9px] text-zinc-500 font-mono uppercase font-bold">
                        {syncStatus === 'syncing' ? 'Sincronizando...' : syncStatus === 'error' ? 'Erro' : 'Sincronizado'}
                      </span>
                    </div>

                    <div className="flex items-center justify-between bg-zinc-950 p-2.5 rounded-lg border border-zinc-900 mt-2">
                      <code className="text-xs text-zinc-300 font-mono font-bold tracking-wider">{syncKey}</code>
                      <button
                        onClick={() => {
                          navigator.clipboard.writeText(syncKey);
                        }}
                        className="p-1 hover:bg-zinc-900 text-zinc-400 hover:text-white rounded transition-all"
                        title="Copiar Chave"
                      >
                        <Copy className="h-3.5 w-3.5 text-orange-500" />
                      </button>
                    </div>

                    <p className="text-[10px] text-zinc-500 leading-normal mt-1">
                      {syncStatus === 'error'
                        ? 'Ocorreu um erro de comunicação ou permissão com o banco de dados. Suas alterações locais permanecem salvas em seu navegador e serão sincronizadas assim que a conexão for restabelecida.'
                        : syncStatus === 'syncing'
                          ? 'Salvando e atualizando suas alterações em tempo real nos servidores seguros da nuvem.'
                          : 'Você está conectado ao perfil de sincronização acima. Seus dados estão salvos de forma segura e imediata.'}
                    </p>
                  </div>

                  {/* Connect alternative key section */}
                  <div className="pt-2 border-t border-zinc-900">
                    <label className="text-[9px] text-zinc-400 font-mono font-bold uppercase tracking-wider block mb-1.5">Sincronizar com Chave Personalizada (Avançado)</label>
                    <div className="flex gap-2">
                      <input 
                        type="text" 
                        id="sync-key-input"
                        placeholder="Ex: MINHA_CHAVE_2026"
                        className="flex-1 bg-zinc-900/60 border border-zinc-850 rounded-lg px-3 py-2 text-xs text-white font-mono placeholder-zinc-700 focus:outline-none focus:border-orange-500 transition-all uppercase"
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            const val = (e.target as HTMLInputElement).value;
                            if (val.trim()) connectSyncKey(val);
                          }
                        }}
                      />
                      <button
                        onClick={() => {
                          const val = (document.getElementById('sync-key-input') as HTMLInputElement)?.value;
                          if (val && val.trim()) connectSyncKey(val);
                        }}
                        className="bg-orange-500 hover:bg-orange-600 text-white font-bold text-xs px-4 py-2 rounded-lg transition-all uppercase tracking-wider font-mono flex items-center gap-1"
                      >
                        Carregar
                      </button>
                    </div>
                  </div>

                  <div className="flex gap-2 pt-2">
                    <button
                      onClick={() => {
                        if (confirm("Deseja restaurar a chave de sincronização padrão (USUARIO_UNICO)? Seus dados locais serão sincronizados com o perfil principal.")) {
                          disconnectSync();
                        }
                      }}
                      className="flex-1 bg-zinc-900 hover:bg-zinc-850 text-zinc-400 hover:text-white border border-zinc-850 font-bold text-xs py-2.5 rounded-lg transition-all uppercase tracking-wider"
                      title="Restaurar chave de sincronização padrão"
                    >
                      Restaurar Padrão
                    </button>
                    <button
                      onClick={() => setShowSyncModal(false)}
                      className="flex-1 bg-orange-500 hover:bg-orange-600 text-white font-bold text-xs py-2.5 rounded-lg transition-all border border-transparent uppercase tracking-wider"
                    >
                      Fechar
                    </button>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  {/* Disconnected State: Connect Form */}
                  <div>
                    <label className="text-[10px] text-zinc-400 font-mono font-bold uppercase tracking-wider block mb-1.5">Insira ou Crie sua Chave de Sincronização</label>
                    <div className="flex gap-2">
                      <input 
                        type="text" 
                        id="sync-key-input"
                        placeholder="Ex: nando_sync_2026"
                        className="flex-1 bg-zinc-900/60 border border-zinc-850 rounded-lg px-3 py-2 text-xs text-white font-mono placeholder-zinc-700 focus:outline-none focus:border-orange-500 transition-all uppercase"
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            const val = (e.target as HTMLInputElement).value;
                            if (val.trim()) connectSyncKey(val);
                          }
                        }}
                      />
                      <button
                        onClick={() => {
                          const val = (document.getElementById('sync-key-input') as HTMLInputElement)?.value;
                          if (val && val.trim()) connectSyncKey(val);
                        }}
                        className="bg-orange-500 hover:bg-orange-600 text-white font-bold text-xs px-4 py-2 rounded-lg transition-all uppercase tracking-wider font-mono flex items-center gap-1"
                      >
                        Conectar
                      </button>
                    </div>
                  </div>

                  <div className="relative flex py-1 items-center">
                    <div className="flex-grow border-t border-zinc-900"></div>
                    <span className="flex-shrink mx-3 text-[9px] text-zinc-600 font-mono font-bold uppercase">Ou</span>
                    <div className="flex-grow border-t border-zinc-900"></div>
                  </div>

                  <button
                    onClick={() => {
                      const randomId = 'mbc-' + Math.random().toString(36).substring(2, 8).toUpperCase();
                      connectSyncKey(randomId);
                    }}
                    className="w-full bg-orange-500/10 hover:bg-orange-500/20 text-orange-500 border border-orange-500/20 font-bold text-xs py-2.5 rounded-lg transition-all flex items-center justify-center gap-2 uppercase tracking-wider font-mono shadow-[0_0_15px_rgba(249,115,22,0.05)]"
                  >
                    <RefreshCw className="h-3.5 w-3.5 text-orange-500" />
                    Gerar Chave Aleatória
                  </button>
                </div>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}
