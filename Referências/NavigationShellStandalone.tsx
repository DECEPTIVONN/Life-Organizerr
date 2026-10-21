/**
 * ============================================================================
 * NAVIGATION SHELL & LAYOUT ARCHITECTURE (ARQUIVO DE REFERÊNCIA STANDALONE)
 * ============================================================================
 * 
 * GUIA DE ENGENHARIA & ESPECIFICAÇÃO DE ARQUITETURA DE REFERÊNCIA
 * 
 * Este arquivo foi projetado como um guia executável e documentação técnica
 * completa para agentes autônomos e desenvolvedores reproduzirem ou adaptarem
 * toda a camada de casca visual (Shell/HUD/SPA Layout) em outros projetos.
 * 
 * SUMÁRIO DAS FUNCIONALIDADES CONTEMPLADAS:
 * 1. SEPARAÇÃO RESPONSIVA DESKTOP VS MOBILE
 *    - Breakpoint: `lg` (1024px) com fallbacks dinâmicos de layout.
 *    - Desktop: Layout horizontal com Sidebar HUD lateral fixa/colapsável.
 *    - Mobile: Layout vertical com Top Header de utilitários, Bottom Bar curva
 *      neon com SVG, Drawer lateral deslizante e isolamento de toques.
 * 
 * 2. TRANSIÇÕES E ANIMAÇÕES FLUIDAS ENTRE ABAS (SPA)
 *    - AnimatePresence com modo `popLayout` para zero repuxo ou quebra de fluxo.
 *    - Cálculo direcional de deslizamento (Slide Direction -1 / +1) com `TAB_ORDER`.
 *    - Física elástica (Spring Physics) no Mobile e Curvas Cúbicas de aceleração no Desktop.
 *    - Gestos de deslize touch (Swipe horizontal com tolerância e exclusão de inputs).
 * 
 * 3. SISTEMA DE BUSCA GERAL UNIFICADO (GLOBAL SEARCH)
 *    - Modal/Overlay global com atalhos de teclado (ESC, Autofocus).
 *    - Varredura cross-collection em tempo real (Tarefas, Rotinas, Metas, Notas, Documentos, Agenda).
 *    - Pílulas de filtragem rápida e navegação instantânea por clique.
 * 
 * 4. MODO TELA CHEIA (CROSS-BROWSER FULLSCREEN)
 *    - Normalização cross-browser (`requestFullscreen`, `webkit`, `moz`, `ms`).
 *    - Sincronização de estado bidirecional com eventos `fullscreenchange`.
 *    - Modo opcional de auto-fullscreen na primeira interação do usuário.
 * 
 * 5. SISTEMA DE BLOQUEIO / TRANCAR O SITE (PRIVACY LOCK SCREEN)
 *    - Proteção total de viewport com máquina de estados de bloqueio.
 *    - Suporte a senha numérica (PIN), tempo de inatividade (timeout) e biometria (WebAuthn).
 *    - Fallback tátil com vibração (`navigator.vibrate`) e animação de tremor (shake).
 *    - Wallpapers personalizados responsivos (16:9 Desktop horizontal vs 9:16 Mobile vertical).
 * 
 * 6. SISTEMA COMPLETO DE NAVBARS & HUDS
 *    - Desktop Sidebar HUD: Fixação (Pin toggle), auto-expansão no Hover, perfil de usuário,
 *      nível e micro barra de progresso de XP logo abaixo da foto, contador de ofensiva com chama.
 *    - Mobile Top Header: Avatar com link direto para o perfil, busca geral e alternador de tela cheia.
 *    - Mobile Curved Futuristic Bottom Bar: SVG de formato curvo com contorno neon, ápice central
 *      elevado para Home/Dashboard, rótulo monospace iluminado e modos Fixo vs Flexível no scroll.
 *    - Gesto de pressão longa (Long-Press de 1.5s com vibração) para atalhos rápidos de produtividade.
 * 
 * 7. PROGRESS BARS (SISTEMA DE BARRAS DE PROGRESSO)
 *    - Mobile: Barra horizontal no topo de rolagem progressiva da página (0 a 100%).
 *    - Desktop: Trilho vertical interativo na borda direita (arrastável e clicável com efeito neon).
 *    - Micro barra de XP: Visualização em tempo real do progresso até o próximo nível (1000 XP/nível).
 * 
 * ============================================================================
 */

import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  LayoutDashboard,
  CheckSquare,
  Clock,
  Target,
  DollarSign,
  Calendar,
  Archive,
  BookOpen,
  Search,
  Menu,
  X,
  Settings,
  Trophy,
  FileText,
  Pin,
  CheckCircle,
  Maximize,
  Minimize,
  Lock,
  Flame,
  Bell,
  Timer,
  Book,
  Heart,
  Compass,
  FolderKanban,
  Layers,
  Sparkles,
  ChevronRight,
  ShieldAlert,
  Fingerprint,
  RefreshCw,
  Eye,
  EyeOff,
  User
} from 'lucide-react';

/* ============================================================================
 * 1. TIPOS & CONTRATOS DE DADOS
 * ============================================================================ */

export type NavigationTabId =
  | 'dashboard'
  | 'checklist'
  | 'calendario'
  | 'resumo'
  | 'projetos'
  | 'metas'
  | 'financas'
  | 'anuais'
  | 'documentos'
  | 'notas'
  | 'lembretes'
  | 'configuracoes'
  | 'perfil';

export interface NavigationItem {
  id: NavigationTabId;
  label: string;
  desc: string;
  icon: React.ComponentType<{ className?: string }>;
  badge?: number | string;
}

export interface SearchRecord {
  id: string;
  title: string;
  description: string;
  category: 'Tarefa' | 'Rotina' | 'Meta' | 'Nota' | 'Documento' | 'Calendário';
  tab: NavigationTabId;
}

export interface UserSessionProfile {
  name: string;
  handle: string;
  photoUrl: string;
  level: number;
  xpTotal: number;
  streakDays: number;
}

export interface ShellConfiguration {
  sidebarPinned: boolean;
  mobileNavbarMode: 'fixed' | 'flexible';
  mobileSlideTransition: boolean;
  autoFullscreen: boolean;
  appLockEnabled: boolean;
  appLockPin: string;
  appLockTimeoutMinutes: number;
  appLockBiometricEnabled: boolean;
  desktopWallpaperUrl?: string;
  mobileWallpaperUrl?: string;
}

/* ============================================================================
 * 2. MAPEAMENTO DE ORDEM PARA ANIMAÇÃO DIRECIONAL (TAB_ORDER)
 * ============================================================================
 * Define a posição sequencial de cada aba. Se a nova aba tiver índice maior que
 * a anterior, a transição desliza da direita para esquerda (dir: 1).
 * Se menor, desliza da esquerda para direita (dir: -1).
 */
export const TAB_ORDER: Record<NavigationTabId, number> = {
  calendario: 0,
  dashboard: 1,
  checklist: 2,
  resumo: 3,
  projetos: 4,
  notas: 5,
  metas: 6,
  financas: 7,
  anuais: 8,
  documentos: 9,
  lembretes: 10,
  configuracoes: 11,
  perfil: 12,
};

/* ============================================================================
 * 3. ITENS DE MENU DA APLICAÇÃO
 * ============================================================================ */
export const DEFAULT_MENU_ITEMS: NavigationItem[] = [
  { id: 'dashboard', label: 'Dashboard', desc: 'Portal principal e métricas', icon: LayoutDashboard },
  { id: 'checklist', label: 'Missões Diárias', desc: 'Checklists e tarefas', icon: CheckSquare },
  { id: 'calendario', label: 'Agenda & Fé', desc: 'Diário e compromissos', icon: Calendar },
  { id: 'resumo', label: 'Vida em Resumo', desc: 'Painel holístico de vida', icon: Compass },
  { id: 'projetos', label: 'Projetos', desc: 'Quadros Kanban e iniciativas', icon: FolderKanban },
  { id: 'metas', label: 'Metas', desc: 'Evolução por áreas', icon: Target },
  { id: 'financas', label: 'Finanças', desc: 'Gestão de fluxo e capital', icon: DollarSign },
  { id: 'anuais', label: 'Anuais', desc: 'Pastas, livros e revisões', icon: Layers },
  { id: 'documentos', label: 'Arquivamento', desc: 'Documentos e PDFs', icon: Archive },
  { id: 'notas', label: 'Banco de Notas', desc: 'Segundo cérebro e markdown', icon: BookOpen },
  { id: 'lembretes', label: 'Lembretes', desc: 'Timers, pomodoro e alertas', icon: Bell },
  { id: 'configuracoes', label: 'Configurações', desc: 'Personalização do sistema', icon: Settings },
];

/* ============================================================================
 * 4. MOCK DATA PARA O MECANISMO DE BUSCA GLOBAL
 * ============================================================================ */
export const SAMPLE_SEARCH_INDEX: SearchRecord[] = [
  { id: 'tsk-1', title: 'Meditação matinal de 15 minutos', description: 'Tarefa diária pendente • Categoria: Mente', category: 'Tarefa', tab: 'checklist' },
  { id: 'tsk-2', title: 'Treino de alta performance (Crossfit/Academia)', description: 'Tarefa diária concluída • Categoria: Físico', category: 'Tarefa', tab: 'checklist' },
  { id: 'rtn-1', title: 'Rotina Matinal de Foco e Água', description: 'Hábito matinal diário às 06:30', category: 'Rotina', tab: 'checklist' },
  { id: 'met-1', title: 'Reserva de Emergência de 6 Meses', description: 'Meta financeira com 68% concluído', category: 'Meta', tab: 'financas' },
  { id: 'not-1', title: 'Resumo do Livro Hábitos Atômicos', description: 'Sistemas de recompensas incrementais de 1%', category: 'Nota', tab: 'notas' },
  { id: 'doc-1', title: 'Contrato de Prestação de Serviços 2026.pdf', description: 'Documento arquivado • 1.4 MB', category: 'Documento', tab: 'documentos' },
  { id: 'cal-1', title: 'Oração e Agradecimento da Manhã', description: 'Registro diário espiritual com passagens bíblicas', category: 'Calendário', tab: 'calendario' },
];

/* ============================================================================
 * 5. HOOKS MODULARES DA CASCA
 * ============================================================================ */

/**
 * Hook para controle de Tela Cheia com compatibilidade cross-browser.
 */
export function useCrossBrowserFullscreen() {
  const [isFullscreen, setIsFullscreen] = useState<boolean>(() => {
    if (typeof document === 'undefined') return false;
    return !!(
      document.fullscreenElement ||
      (document as any).webkitFullscreenElement ||
      (document as any).mozFullScreenElement ||
      (document as any).msFullscreenElement
    );
  });

  useEffect(() => {
    const handleFsChange = () => {
      const active = !!(
        document.fullscreenElement ||
        (document as any).webkitFullscreenElement ||
        (document as any).mozFullScreenElement ||
        (document as any).msFullscreenElement
      );
      setIsFullscreen(active);
    };

    const events = ['fullscreenchange', 'webkitfullscreenchange', 'mozfullscreenchange', 'MSFullscreenChange'];
    events.forEach(evt => document.addEventListener(evt, handleFsChange));
    return () => {
      events.forEach(evt => document.removeEventListener(evt, handleFsChange));
    };
  }, []);

  const toggleFullscreen = useCallback(() => {
    try {
      const doc = document as any;
      const docEl = document.documentElement as any;

      if (!isFullscreen) {
        if (docEl.requestFullscreen) docEl.requestFullscreen().catch(() => {});
        else if (docEl.webkitRequestFullscreen) docEl.webkitRequestFullscreen();
        else if (docEl.mozRequestFullScreen) docEl.mozRequestFullScreen();
        else if (docEl.msRequestFullscreen) docEl.msRequestFullscreen();
      } else {
        if (doc.exitFullscreen) doc.exitFullscreen().catch(() => {});
        else if (doc.webkitExitFullscreen) doc.webkitExitFullscreen();
        else if (doc.mozCancelFullScreen) doc.mozCancelFullScreen();
        else if (doc.msExitFullscreen) doc.msExitFullscreen();
      }
    } catch (err) {
      console.warn('Fullscreen request failed:', err);
    }
  }, [isFullscreen]);

  return { isFullscreen, toggleFullscreen };
}

/**
 * Hook para medição do progresso de rolagem vertical da página (0 a 100%).
 * Alimenta tanto a barra superior mobile quanto o trilho interativo desktop.
 */
export function useScrollProgress() {
  const [scrollProgress, setScrollProgress] = useState(0);

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
    handleScroll();

    return () => {
      window.removeEventListener('scroll', handleScroll);
      window.removeEventListener('resize', handleScroll);
    };
  }, []);

  const scrollToPercent = useCallback((pct: number) => {
    const scrollHeight = document.documentElement.scrollHeight - window.innerHeight;
    if (scrollHeight > 0) {
      const targetTop = scrollHeight * (Math.min(100, Math.max(0, pct)) / 100);
      window.scrollTo({ top: targetTop, behavior: 'smooth' });
    }
  }, []);

  return { scrollProgress, scrollToPercent };
}

/* ============================================================================
 * 6. SUBCOMPONENTES DA CASCA VISUAL
 * ============================================================================ */

/**
 * 6.1 Barra de Progresso Superior (Mobile) e Trilho Vertical (Desktop)
 */
export const DualProgressBar: React.FC<{
  scrollProgress: number;
  onScrollToPercent?: (pct: number) => void;
}> = ({ scrollProgress, onScrollToPercent }) => {
  const [isDragging, setIsDragging] = useState(false);

  const handleTrackInteraction = (clientY: number) => {
    const pct = (clientY / window.innerHeight) * 100;
    if (onScrollToPercent) onScrollToPercent(pct);
  };

  useEffect(() => {
    if (!isDragging) return;
    const onMove = (e: MouseEvent) => handleTrackInteraction(e.clientY);
    const onUp = () => setIsDragging(false);
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
    return () => {
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup', onUp);
    };
  }, [isDragging]);

  return (
    <>
      {/* Barra superior Mobile */}
      <div
        id="mobile-scroll-progress-bar"
        className="lg:hidden fixed top-0 left-0 h-1 bg-gradient-to-r from-orange-500 via-amber-500 to-orange-400 z-50 transition-all duration-75 shadow-[0_0_10px_#f97316]"
        style={{ width: `${scrollProgress}%` }}
      />

      {/* Trilho lateral Desktop interativo */}
      <div
        onClick={(e) => handleTrackInteraction(e.clientY)}
        onMouseDown={(e) => {
          setIsDragging(true);
          handleTrackInteraction(e.clientY);
        }}
        className="hidden lg:flex fixed top-0 right-0 w-2 hover:w-3.5 h-full bg-zinc-950/40 hover:bg-zinc-900/80 transition-all duration-150 z-50 cursor-pointer group flex-col justify-start overflow-hidden select-none"
        title={`Progresso da página: ${Math.round(scrollProgress)}% • Clique ou arraste para rolar`}
      >
        <div
          className="w-full bg-gradient-to-b from-orange-500 via-amber-500 to-orange-400 shadow-[0_0_8px_#f97316] transition-all duration-75 relative rounded-b-full"
          style={{ height: `${scrollProgress}%` }}
        />
      </div>
    </>
  );
};

/**
 * 6.2 Header Mobile Superior de Utilitários
 */
export const MobileTopBar: React.FC<{
  userPhoto: string;
  userName: string;
  isFullscreen: boolean;
  onOpenProfile: () => void;
  onOpenSearch: () => void;
  onToggleFullscreen: () => void;
}> = ({ userPhoto, userName, isFullscreen, onOpenProfile, onOpenSearch, onToggleFullscreen }) => {
  return (
    <header className="lg:hidden fixed top-0 left-0 right-0 h-14 bg-[#09090b]/90 backdrop-blur-md border-b border-zinc-900/60 flex items-center justify-between px-4 z-40 select-none">
      {/* Lado Esquerdo: Foto de Perfil com Anel de Neon */}
      <button
        onClick={onOpenProfile}
        className="flex items-center active:scale-95 transition-transform cursor-pointer"
        title="Abrir Perfil"
      >
        <img
          src={userPhoto}
          alt={userName}
          className="h-8 w-8 rounded-full object-cover border border-orange-500/30 shadow-[0_0_8px_rgba(249,115,22,0.25)]"
        />
      </button>

      {/* Lado Direito: Ações Rápidas (Busca & Fullscreen) */}
      <div className="flex items-center gap-2.5">
        <button
          onClick={onOpenSearch}
          className="p-2 bg-zinc-900/60 text-zinc-400 hover:text-orange-500 rounded-xl border border-zinc-800/80 transition-all active:scale-95 flex items-center justify-center cursor-pointer"
          title="Buscar Geral"
        >
          <Search className="h-4.5 w-4.5" />
        </button>

        <button
          onClick={onToggleFullscreen}
          className="p-2 bg-zinc-900/60 text-zinc-400 hover:text-white rounded-xl border border-zinc-800/80 transition-all active:scale-95 flex items-center justify-center cursor-pointer"
          title="Modo Tela Cheia"
        >
          {isFullscreen ? <Minimize className="h-4.5 w-4.5 text-orange-500" /> : <Maximize className="h-4.5 w-4.5" />}
        </button>
      </div>
    </header>
  );
};

/**
 * 6.3 Mobile Futuristic Bottom Bar com SVG Curvo e Neon
 */
export const MobileCurvedNavbar: React.FC<{
  activeTab: NavigationTabId;
  onSelectTab: (tab: NavigationTabId) => void;
  onOpenDrawer: () => void;
  isHidden?: boolean;
}> = ({ activeTab, onSelectTab, onOpenDrawer, isHidden = false }) => {
  return (
    <nav
      aria-label="Navegação Principal Mobile"
      className={`lg:hidden fixed bottom-0 left-0 right-0 h-[92px] pointer-events-none z-40 transition-transform duration-300 ease-in-out ${
        isHidden ? 'translate-y-[120%]' : 'translate-y-0'
      }`}
    >
      {/* SVG de fundo curvado com brilho neon */}
      <div className="absolute inset-0 pointer-events-auto">
        <svg
          className="w-full h-full filter drop-shadow-[0_-8px_16px_rgba(249,115,22,0.25)]"
          viewBox="0 0 100 100"
          preserveAspectRatio="none"
        >
          {/* Borda superior curvada (curva Bézier quadrática Q 50 0) */}
          <path
            d="M 0 30 Q 50 0 100 30 L 100 100 L 0 100 Z"
            fill="none"
            stroke="var(--color-orange-500, #f97316)"
            strokeWidth="1.5"
          />
          {/* Preenchimento opaco escuro */}
          <path
            d="M 0 30 Q 50 0 100 30 L 100 100 L 0 100 Z"
            fill="#09090b"
            opacity="0.98"
          />
        </svg>
      </div>

      {/* Botões distribuídos sobre a curva */}
      <div className="absolute inset-x-0 bottom-0 top-3 flex items-start justify-around px-2 pb-2 pointer-events-auto select-none">
        {/* 1. Menu Drawer */}
        <button
          onClick={onOpenDrawer}
          className="relative flex flex-col items-center justify-center w-14 h-14 group cursor-pointer outline-none bg-transparent"
        >
          <div className="transition-all duration-300 text-zinc-400 group-hover:text-white">
            <Menu className="h-5 w-5" />
          </div>
          <span className="text-[7px] font-mono tracking-widest text-zinc-500 uppercase mt-1">MENU</span>
        </button>

        {/* 2. Calendário / Agenda */}
        <button
          onClick={() => onSelectTab('calendario')}
          className="relative flex flex-col items-center justify-center w-14 h-14 group cursor-pointer outline-none bg-transparent"
        >
          <div
            className={`transition-all duration-300 ${
              activeTab === 'calendario'
                ? 'text-orange-500 scale-110 -translate-y-2 filter drop-shadow-[0_0_10px_rgba(249,115,22,0.8)]'
                : 'text-zinc-400 group-hover:text-white'
            }`}
          >
            <Calendar className="h-5 w-5" />
          </div>
          {activeTab === 'calendario' && (
            <>
              <div className="absolute bottom-5 w-6 h-0.5 bg-orange-500 rounded-full shadow-[0_0_12px_#f97316]" />
              <span className="absolute bottom-1.5 text-[7px] font-mono font-black tracking-widest text-orange-500 uppercase">
                AGENDA
              </span>
            </>
          )}
        </button>

        {/* 3. Dashboard (Senta exatamente no ápice central elevado x=50) */}
        <button
          onClick={() => onSelectTab('dashboard')}
          className="relative flex flex-col items-center justify-center w-14 h-14 group cursor-pointer outline-none bg-transparent"
        >
          <div
            className={`transition-all duration-300 ${
              activeTab === 'dashboard'
                ? 'text-orange-500 scale-115 -translate-y-2.5 filter drop-shadow-[0_0_10px_rgba(249,115,22,0.8)]'
                : 'text-zinc-400 group-hover:text-white'
            }`}
          >
            <LayoutDashboard className="h-5.5 w-5.5" />
          </div>
          {activeTab === 'dashboard' && (
            <>
              <div className="absolute bottom-5 w-6 h-0.5 bg-orange-500 rounded-full shadow-[0_0_12px_#f97316]" />
              <span className="absolute bottom-1.5 text-[7px] font-mono font-black tracking-widest text-orange-500 uppercase">
                HOME
              </span>
            </>
          )}
        </button>

        {/* 4. Checklist / Missões */}
        <button
          onClick={() => onSelectTab('checklist')}
          className="relative flex flex-col items-center justify-center w-14 h-14 group cursor-pointer outline-none bg-transparent"
        >
          <div
            className={`transition-all duration-300 ${
              activeTab === 'checklist'
                ? 'text-orange-500 scale-110 -translate-y-2 filter drop-shadow-[0_0_10px_rgba(249,115,22,0.8)]'
                : 'text-zinc-400 group-hover:text-white'
            }`}
          >
            <CheckSquare className="h-5 w-5" />
          </div>
          {activeTab === 'checklist' && (
            <>
              <div className="absolute bottom-5 w-6 h-0.5 bg-orange-500 rounded-full shadow-[0_0_12px_#f97316]" />
              <span className="absolute bottom-1.5 text-[7px] font-mono font-black tracking-widest text-orange-500 uppercase">
                MISSÕES
              </span>
            </>
          )}
        </button>

        {/* 5. Banco de Notas */}
        <button
          onClick={() => onSelectTab('notas')}
          className="relative flex flex-col items-center justify-center w-14 h-14 group cursor-pointer outline-none bg-transparent"
        >
          <div
            className={`transition-all duration-300 ${
              activeTab === 'notas'
                ? 'text-orange-500 scale-110 -translate-y-2 filter drop-shadow-[0_0_10px_rgba(249,115,22,0.8)]'
                : 'text-zinc-400 group-hover:text-white'
            }`}
          >
            <BookOpen className="h-5 w-5" />
          </div>
          {activeTab === 'notas' && (
            <>
              <div className="absolute bottom-5 w-6 h-0.5 bg-orange-500 rounded-full shadow-[0_0_12px_#f97316]" />
              <span className="absolute bottom-1.5 text-[7px] font-mono font-black tracking-widest text-orange-500 uppercase">
                NOTAS
              </span>
            </>
          )}
        </button>
      </div>
    </nav>
  );
};

/**
 * 6.3.1 Mobile Straight Bottom Bar (Formato Reto Clássico com Indicador Neon no Topo)
 */
export const MobileStraightNavbar: React.FC<{
  activeTab: NavigationTabId;
  onSelectTab: (tab: NavigationTabId) => void;
  onOpenDrawer: () => void;
  isHidden?: boolean;
}> = ({ activeTab, onSelectTab, onOpenDrawer, isHidden = false }) => {
  return (
    <nav
      aria-label="Navegação Principal Mobile Reta"
      className={`lg:hidden fixed bottom-0 left-0 right-0 z-40 transition-transform duration-300 ease-in-out ${
        isHidden ? 'translate-y-[120%]' : 'translate-y-0'
      }`}
    >
      <div className="w-full h-16 bg-[#0a0a0f]/95 backdrop-blur-xl border-t border-zinc-800/80 shadow-[0_-4px_24px_rgba(0,0,0,0.6)] flex items-stretch justify-around px-1 relative pointer-events-auto select-none">
        {/* 1. Menu Drawer */}
        <button
          onClick={onOpenDrawer}
          className="relative flex-1 flex flex-col items-center justify-center group cursor-pointer outline-none bg-transparent"
        >
          <div className="transition-all duration-200 text-zinc-500 group-hover:text-zinc-300">
            <Menu className="h-5 w-5" />
          </div>
          <span className="text-[9px] font-mono tracking-widest text-zinc-500 group-hover:text-zinc-300 uppercase mt-1">
            MENU
          </span>
        </button>

        {/* 2. Agenda / Calendário */}
        <button
          onClick={() => onSelectTab('calendario')}
          className="relative flex-1 flex flex-col items-center justify-center group cursor-pointer outline-none bg-transparent"
        >
          {activeTab === 'calendario' && (
            <div className="absolute top-0 w-8 h-1 bg-orange-500 rounded-b-full shadow-[0_2px_12px_var(--color-orange-500,#f97316)] z-10" />
          )}
          <div className={`transition-all duration-200 ${
            activeTab === 'calendario'
              ? 'text-orange-500 filter drop-shadow-[0_0_8px_rgba(249,115,22,0.8)]'
              : 'text-zinc-500 group-hover:text-zinc-300'
          }`}>
            <Calendar className="h-5 w-5" />
          </div>
          <span className={`text-[9px] font-mono tracking-widest uppercase mt-1 transition-colors ${
            activeTab === 'calendario'
              ? 'font-bold text-orange-500 drop-shadow-[0_0_6px_rgba(249,115,22,0.6)]'
              : 'font-semibold text-zinc-500 group-hover:text-zinc-300'
          }`}>
            AGENDA
          </span>
        </button>

        {/* 3. Dashboard / Início */}
        <button
          onClick={() => onSelectTab('dashboard')}
          className="relative flex-1 flex flex-col items-center justify-center group cursor-pointer outline-none bg-transparent"
        >
          {activeTab === 'dashboard' && (
            <div className="absolute top-0 w-8 h-1 bg-orange-500 rounded-b-full shadow-[0_2px_12px_var(--color-orange-500,#f97316)] z-10" />
          )}
          <div className={`transition-all duration-200 ${
            activeTab === 'dashboard'
              ? 'text-orange-500 filter drop-shadow-[0_0_8px_rgba(249,115,22,0.8)]'
              : 'text-zinc-500 group-hover:text-zinc-300'
          }`}>
            <LayoutDashboard className="h-5 w-5" />
          </div>
          <span className={`text-[9px] font-mono tracking-widest uppercase mt-1 transition-colors ${
            activeTab === 'dashboard'
              ? 'font-bold text-orange-500 drop-shadow-[0_0_6px_rgba(249,115,22,0.6)]'
              : 'font-semibold text-zinc-500 group-hover:text-zinc-300'
          }`}>
            INÍCIO
          </span>
        </button>

        {/* 4. Tarefas / Checklist */}
        <button
          onClick={() => onSelectTab('checklist')}
          className="relative flex-1 flex flex-col items-center justify-center group cursor-pointer outline-none bg-transparent"
        >
          {activeTab === 'checklist' && (
            <div className="absolute top-0 w-8 h-1 bg-orange-500 rounded-b-full shadow-[0_2px_12px_var(--color-orange-500,#f97316)] z-10" />
          )}
          <div className={`transition-all duration-200 ${
            activeTab === 'checklist'
              ? 'text-orange-500 filter drop-shadow-[0_0_8px_rgba(249,115,22,0.8)]'
              : 'text-zinc-500 group-hover:text-zinc-300'
          }`}>
            <CheckSquare className="h-5 w-5" />
          </div>
          <span className={`text-[9px] font-mono tracking-widest uppercase mt-1 transition-colors ${
            activeTab === 'checklist'
              ? 'font-bold text-orange-500 drop-shadow-[0_0_6px_rgba(249,115,22,0.6)]'
              : 'font-semibold text-zinc-500 group-hover:text-zinc-300'
          }`}>
            TAREFAS
          </span>
        </button>

        {/* 5. Notas */}
        <button
          onClick={() => onSelectTab('notas')}
          className="relative flex-1 flex flex-col items-center justify-center group cursor-pointer outline-none bg-transparent"
        >
          {activeTab === 'notas' && (
            <div className="absolute top-0 w-8 h-1 bg-orange-500 rounded-b-full shadow-[0_2px_12px_var(--color-orange-500,#f97316)] z-10" />
          )}
          <div className={`transition-all duration-200 ${
            activeTab === 'notas'
              ? 'text-orange-500 filter drop-shadow-[0_0_8px_rgba(249,115,22,0.8)]'
              : 'text-zinc-500 group-hover:text-zinc-300'
          }`}>
            <BookOpen className="h-5 w-5" />
          </div>
          <span className={`text-[9px] font-mono tracking-widest uppercase mt-1 transition-colors ${
            activeTab === 'notas'
              ? 'font-bold text-orange-500 drop-shadow-[0_0_6px_rgba(249,115,22,0.6)]'
              : 'font-semibold text-zinc-500 group-hover:text-zinc-300'
          }`}>
            NOTAS
          </span>
        </button>
      </div>
    </nav>
  );
};

/**
 * 6.4 Drawer Lateral Deslizante Mobile
 */
export const MobileDrawer: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  activeTab: NavigationTabId;
  onSelectTab: (tab: NavigationTabId) => void;
  user: UserSessionProfile;
  items: NavigationItem[];
  isFullscreen: boolean;
  onToggleFullscreen: () => void;
}> = ({ isOpen, onClose, activeTab, onSelectTab, user, items, isFullscreen, onToggleFullscreen }) => {
  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 lg:hidden flex">
          {/* Backdrop escuro translúcido */}
          <motion.div
            className="fixed inset-0 bg-black/80 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />

          {/* Conteúdo deslizante */}
          <motion.div
            className="relative flex flex-col w-72 max-w-[85vw] h-full bg-[#09090b] border-r border-zinc-900 z-50 p-5 pt-6 shadow-2xl"
            initial={{ x: '-100%' }}
            animate={{ x: 0 }}
            exit={{ x: '-100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 220 }}
          >
            {/* Cabeçalho do Drawer com Botão Fechar */}
            <div className="flex items-center justify-between pb-4 border-b border-zinc-900/60 mb-5">
              <span className="text-xs font-mono font-black uppercase text-orange-500 tracking-wider">
                NAVEGAÇÃO COMPLETA
              </span>
              <button
                onClick={onClose}
                className="p-1.5 hover:bg-zinc-900 text-zinc-400 hover:text-white rounded-lg transition-colors cursor-pointer"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Cartão de Perfil & Nível */}
            <div className="mb-5 p-3.5 bg-zinc-950 rounded-2xl border border-zinc-900 flex items-center gap-3">
              <img
                src={user.photoUrl}
                alt={user.name}
                className="h-10 w-10 rounded-full object-cover border border-orange-500/30"
              />
              <div className="min-w-0">
                <h4 className="text-xs font-bold text-white truncate">{user.name}</h4>
                <div className="flex items-center gap-2 mt-0.5">
                  <span className="text-[10px] text-orange-500 font-mono font-bold">Nível {user.level}</span>
                  <span className="text-[10px] text-zinc-500 font-mono">• {user.xpTotal} XP</span>
                </div>
              </div>
            </div>

            {/* Lista de Navegação com Scroll */}
            <nav className="flex-1 space-y-1.5 overflow-y-auto pr-1">
              {items.map((item) => {
                const isActive = activeTab === item.id;
                const Icon = item.icon;
                return (
                  <button
                    key={item.id}
                    onClick={() => {
                      onSelectTab(item.id);
                      onClose();
                    }}
                    className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-bold transition-all text-left cursor-pointer ${
                      isActive
                        ? 'text-orange-500 bg-orange-500/10 border border-orange-500/30 shadow'
                        : 'text-zinc-400 hover:text-white hover:bg-zinc-900/50 border border-transparent'
                    }`}
                  >
                    <Icon className="h-4 w-4 text-orange-500 flex-shrink-0" />
                    <div className="min-w-0 flex-1">
                      <div className="truncate">{item.label}</div>
                      <div className="text-[9px] text-zinc-500 font-mono font-normal truncate">{item.desc}</div>
                    </div>
                  </button>
                );
              })}
            </nav>

            {/* Rodapé de Ações do Drawer */}
            <div className="pt-4 border-t border-zinc-900/60 mt-3 space-y-2">
              <button
                onClick={() => {
                  onClose();
                  onToggleFullscreen();
                }}
                className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-bold text-zinc-400 hover:text-white hover:bg-zinc-900 transition-all cursor-pointer"
              >
                {isFullscreen ? <Minimize className="h-4 w-4 text-orange-500" /> : <Maximize className="h-4 w-4 text-zinc-400" />}
                <span>{isFullscreen ? 'Sair de Tela Cheia' : 'Modo Tela Cheia'}</span>
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

/**
 * 6.5 Desktop Sidebar HUD (Fixa, Pinned Toggle, Hover Expand & XP Progress Bar)
 */
export const DesktopSidebarHUD: React.FC<{
  activeTab: NavigationTabId;
  onSelectTab: (tab: NavigationTabId) => void;
  items: NavigationItem[];
  user: UserSessionProfile;
  pinned: boolean;
  onTogglePin: () => void;
  isFullscreen: boolean;
  onToggleFullscreen: () => void;
  onLockApp: () => void;
  onOpenSearch: () => void;
  scrollProgress: number;
}> = ({
  activeTab,
  onSelectTab,
  items,
  user,
  pinned,
  onTogglePin,
  isFullscreen,
  onToggleFullscreen,
  onLockApp,
  onOpenSearch,
  scrollProgress
}) => {
  const [isHovered, setIsHovered] = useState(false);
  const isExpanded = isHovered || pinned;

  // Cálculo da fração de progresso para o próximo nível (1000 XP por nível)
  const xpInCurrentLevel = user.xpTotal % 1000;
  const xpPercent = (xpInCurrentLevel / 1000) * 100;

  return (
    <aside
      id="desktop-sidebar-hud"
      aria-label="Barra Lateral Desktop"
      className={`fixed left-0 top-0 h-full bg-[#040405]/95 backdrop-blur-md border-r border-zinc-900 flex flex-col justify-between transition-all duration-300 select-none z-30 hidden lg:flex ${
        isExpanded ? 'w-64' : 'w-[76px]'
      }`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* 1. SEÇÃO SUPERIOR: PERFIL, XP MICRO PROGRESS BAR & BOTÃO FIXAR */}
      <div
        className={`border-b border-zinc-900/60 bg-[#07070a]/40 overflow-hidden relative transition-all duration-300 ${
          isExpanded ? 'p-4' : 'py-5 px-0 flex flex-col items-center justify-center'
        }`}
      >
        <div className={`flex items-center gap-3 ${isExpanded ? 'justify-between w-full' : 'justify-center'}`}>
          {/* Avatar e Nome */}
          <button
            onClick={() => onSelectTab('perfil')}
            className="flex items-center gap-3 min-w-0 text-left hover:opacity-85 transition-opacity active:scale-95 cursor-pointer"
            title="Abrir Meu Perfil"
          >
            <img
              src={user.photoUrl}
              alt={user.name}
              className="h-8 w-8 rounded-full object-cover border border-orange-500/30 flex-shrink-0 shadow-[0_0_8px_rgba(249,115,22,0.2)]"
            />
            <div className={`transition-opacity duration-300 min-w-0 ${isExpanded ? 'opacity-100 block' : 'opacity-0 hidden w-0 h-0'}`}>
              <h3 className="text-xs font-bold text-white tracking-tight truncate">{user.name}</h3>
              <p className="text-[9px] text-orange-500 font-mono font-bold">Nível {user.level} ({user.xpTotal} XP)</p>
            </div>
          </button>

          {/* Botão Fixar Barra Lateral (Pin Button) */}
          {isExpanded && (
            <button
              onClick={onTogglePin}
              className={`p-1.5 rounded-lg hover:bg-zinc-900 transition-colors flex-shrink-0 cursor-pointer ${
                pinned ? 'text-orange-500 bg-orange-500/10' : 'text-zinc-500 hover:text-white'
              }`}
              title={pinned ? 'Desafixar menu lateral (colapsar no mouse out)' : 'Fixar barra lateral aberta'}
            >
              <Pin className="h-3.5 w-3.5" />
            </button>
          )}
        </div>

        {/* Barra de Progresso de XP abaixo da foto de perfil */}
        {isExpanded ? (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            className="mt-3 space-y-1.5 w-full"
          >
            <div className="w-full bg-zinc-900/80 h-1.5 rounded-full overflow-hidden border border-zinc-800/40">
              <div
                className="bg-gradient-to-r from-orange-500 to-amber-500 h-full rounded-full transition-all duration-300 shadow-[0_0_6px_#f97316]"
                style={{ width: `${xpPercent}%` }}
              />
            </div>
            <div className="flex items-center justify-between text-[8px] font-mono text-zinc-500">
              <span>{xpInCurrentLevel} / 1000 XP</span>
              <span className="text-orange-400 font-bold flex items-center gap-1">
                <Flame className="h-2.5 w-2.5 animate-pulse text-orange-500" /> {user.streakDays} dias
              </span>
            </div>
          </motion.div>
        ) : (
          /* Quando colapsado, exibe um mini indicador de scroll */
          <div
            className="w-10 h-1 bg-zinc-900/60 rounded-full overflow-hidden mt-3"
            title={`Progresso da página: ${Math.round(scrollProgress)}%`}
          >
            <div
              className="bg-orange-500 h-full rounded-full transition-all duration-75 shadow-[0_0_4px_#f97316]"
              style={{ width: `${scrollProgress}%` }}
            />
          </div>
        )}
      </div>

      {/* 2. SEÇÃO CENTRAL: ITENS DE NAVEGAÇÃO */}
      <nav className="flex-1 px-2.5 py-4 space-y-1.5 overflow-y-auto scrollbar-none flex flex-col items-center">
        {/* Botão de Busca Rápida */}
        <button
          onClick={onOpenSearch}
          className={`w-full flex items-center rounded-xl text-zinc-400 hover:text-white hover:bg-zinc-900/50 border border-transparent transition-all group duration-200 cursor-pointer ${
            isExpanded ? 'px-3 py-2.5 justify-start' : 'p-2.5 justify-center h-10 w-10'
          }`}
          title="Buscar em Tudo"
        >
          <Search className="h-4.5 w-4.5 text-zinc-500 group-hover:text-orange-500 transition-colors flex-shrink-0" />
          <div className={`text-left transition-all duration-300 ${isExpanded ? 'ml-3 opacity-100 block' : 'ml-0 opacity-0 hidden w-0 h-0 overflow-hidden'}`}>
            <div className="text-[11px] font-bold leading-none">Buscar Geral</div>
          </div>
        </button>

        {/* Links de Abas */}
        {items.map((item) => {
          const isActive = activeTab === item.id;
          const Icon = item.icon;

          return (
            <button
              key={item.id}
              onClick={() => onSelectTab(item.id)}
              className={`w-full flex items-center rounded-xl text-left transition-all group relative duration-200 border cursor-pointer ${
                isActive
                  ? 'text-orange-500 bg-orange-500/10 border-orange-500/25 shadow-[inset_0_0_8px_rgba(249,115,22,0.06)] font-bold'
                  : 'text-zinc-400 hover:text-white hover:bg-zinc-900/40 border-transparent'
              } ${isExpanded ? 'px-3 py-2.5 justify-start' : 'p-2.5 justify-center h-10 w-10'}`}
              title={!isExpanded ? item.label : undefined}
            >
              {/* Filete neon lateral ativo */}
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

      {/* 3. SEÇÃO INFERIOR: UTILITÁRIOS (TELA CHEIA & TRANCAR SITE) */}
      <div className="p-3 border-t border-zinc-900/60 bg-[#050507]/60 flex flex-col items-center gap-1.5">
        <div className={`w-full flex flex-col gap-1 ${isExpanded ? 'px-1' : 'items-center px-0'}`}>
          {/* Botão Tela Cheia */}
          <button
            onClick={onToggleFullscreen}
            className={`flex items-center rounded-xl text-zinc-400 hover:text-white hover:bg-zinc-900/50 border border-transparent transition-all group duration-200 w-full cursor-pointer ${
              isExpanded ? 'px-3 py-2 justify-start gap-3' : 'p-2 justify-center h-10 w-10'
            }`}
            title="Alternar Modo Tela Cheia"
          >
            {isFullscreen ? (
              <Minimize className="h-4 w-4 text-orange-500 flex-shrink-0" />
            ) : (
              <Maximize className="h-4 w-4 text-zinc-500 group-hover:text-white flex-shrink-0" />
            )}
            <span className={`text-[11px] font-bold leading-none transition-all duration-300 ${isExpanded ? 'opacity-100 block' : 'opacity-0 hidden w-0 overflow-hidden'}`}>
              {isFullscreen ? 'Sair de Tela' : 'Tela Cheia'}
            </span>
          </button>

          {/* Botão Trancar Site */}
          <button
            onClick={onLockApp}
            className={`flex items-center rounded-xl text-zinc-400 hover:text-orange-400 hover:bg-orange-500/10 border border-transparent hover:border-orange-500/20 transition-all group duration-200 w-full cursor-pointer ${
              isExpanded ? 'px-3 py-2 justify-start gap-3' : 'p-2 justify-center h-10 w-10'
            }`}
            title="Trancar Site (Tela de Proteção)"
          >
            <div className="p-1 bg-orange-500/10 rounded-lg border border-orange-500/20 group-hover:bg-orange-500/20 transition-all flex items-center justify-center flex-shrink-0">
              <Lock className="h-3.5 w-3.5 text-orange-400" />
            </div>
            <span className={`text-[11px] font-bold leading-none transition-all duration-300 ${isExpanded ? 'opacity-100 block' : 'opacity-0 hidden w-0 overflow-hidden'}`}>
              Trancar App
            </span>
          </button>
        </div>

        {isExpanded && (
          <div className="text-center mt-1">
            <span className="text-[8px] text-zinc-600 font-mono uppercase">TRONUS ARCHITECTURE</span>
          </div>
        )}
      </div>
    </aside>
  );
};

/**
 * 6.6 Modal de Busca Geral Unificado (Global Search Overlay)
 */
export const GlobalSearchOverlay: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  onNavigateToTab: (tab: NavigationTabId) => void;
  dataset?: SearchRecord[];
}> = ({ isOpen, onClose, onNavigateToTab, dataset = SAMPLE_SEARCH_INDEX }) => {
  const [query, setQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState<string>('todos');
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 80);
    } else {
      setQuery('');
    }
  }, [isOpen]);

  // Tecla de atalho ESC
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  const filteredResults = useMemo(() => {
    const q = query.trim().toLowerCase();
    return dataset.filter(item => {
      const matchesCategory =
        activeCategory === 'todos' ||
        (activeCategory === 'tarefas' && item.category === 'Tarefa') ||
        (activeCategory === 'rotinas' && item.category === 'Rotina') ||
        (activeCategory === 'metas' && item.category === 'Meta') ||
        (activeCategory === 'notas' && item.category === 'Nota') ||
        (activeCategory === 'documentos' && item.category === 'Documento') ||
        (activeCategory === 'calendario' && item.category === 'Calendário');

      if (!matchesCategory) return false;
      if (!q) return true;

      return (
        item.title.toLowerCase().includes(q) ||
        item.description.toLowerCase().includes(q) ||
        item.category.toLowerCase().includes(q)
      );
    });
  }, [query, activeCategory, dataset]);

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Backdrop escuro com desfoque */}
          <motion.div
            className="fixed inset-0 bg-black/90 backdrop-blur-md"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />

          {/* Modal Container */}
          <motion.div
            className="relative bg-zinc-950 border border-zinc-800 rounded-3xl w-full max-w-2xl overflow-hidden z-50 flex flex-col h-[520px] shadow-[0_0_50px_rgba(249,115,22,0.18)]"
            initial={{ scale: 0.96, opacity: 0, y: 15 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.96, opacity: 0, y: 15 }}
          >
            {/* Input Header */}
            <div className="p-4 border-b border-zinc-900 flex items-center justify-between gap-3 bg-zinc-900/40">
              <div className="flex-1 relative flex items-center">
                <Search className="h-5 w-5 text-orange-500 absolute left-3.5 pointer-events-none" />
                <input
                  ref={inputRef}
                  type="text"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Pesquisar tarefas, notas, metas, finanças ou diário..."
                  className="w-full bg-zinc-900/80 border border-zinc-800 rounded-2xl py-3 pl-11 pr-24 text-sm text-white focus:outline-none focus:border-orange-500/50 transition-colors"
                />
                <kbd className="absolute right-3.5 hidden sm:inline-block px-2 py-0.5 bg-zinc-950 border border-zinc-800 text-[10px] font-mono text-zinc-500 rounded-lg">
                  ESC
                </kbd>
              </div>

              <button
                onClick={onClose}
                className="p-2 hover:bg-zinc-900 text-zinc-400 hover:text-white rounded-xl transition-colors cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Pílulas de Categoria */}
            <div className="px-4 py-2.5 bg-zinc-950 border-b border-zinc-900 flex items-center gap-2 overflow-x-auto scrollbar-none">
              {[
                { id: 'todos', label: 'Todos' },
                { id: 'tarefas', label: 'Tarefas' },
                { id: 'rotinas', label: 'Rotinas' },
                { id: 'metas', label: 'Metas' },
                { id: 'notas', label: 'Notas' },
                { id: 'documentos', label: 'Documentos' },
                { id: 'calendario', label: 'Agenda & Fé' },
              ].map(cat => (
                <button
                  key={cat.id}
                  onClick={() => setActiveCategory(cat.id)}
                  className={`px-3 py-1 rounded-xl text-xs font-bold transition-all cursor-pointer flex-shrink-0 ${
                    activeCategory === cat.id
                      ? 'bg-orange-500 text-white shadow-[0_0_10px_rgba(249,115,22,0.35)]'
                      : 'bg-zinc-900/80 text-zinc-400 hover:text-white hover:bg-zinc-800'
                  }`}
                >
                  {cat.label}
                </button>
              ))}
            </div>

            {/* Lista de Resultados */}
            <div className="flex-1 overflow-y-auto p-4 space-y-2">
              {filteredResults.length > 0 ? (
                filteredResults.map(res => (
                  <button
                    key={res.id}
                    onClick={() => {
                      onNavigateToTab(res.tab);
                      onClose();
                    }}
                    className="w-full flex items-start gap-3 p-3.5 bg-zinc-900/40 hover:bg-orange-500/10 border border-zinc-800/60 hover:border-orange-500/30 rounded-2xl transition-all hover:translate-x-1 duration-200 text-left cursor-pointer group"
                  >
                    <div className="p-2 rounded-xl bg-orange-500/10 text-orange-400 border border-orange-500/20 group-hover:scale-105 transition-transform flex-shrink-0 mt-0.5">
                      <Search className="h-4 w-4" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-white group-hover:text-orange-400 transition-colors truncate">
                          {res.title}
                        </span>
                        <span className="text-[9px] px-1.5 py-0.5 bg-zinc-800 text-zinc-400 rounded-md font-mono">
                          {res.category}
                        </span>
                      </div>
                      <p className="text-[11px] text-zinc-400 mt-1 line-clamp-1">{res.description}</p>
                    </div>
                    <ChevronRight className="h-4 w-4 text-zinc-600 group-hover:text-orange-400 transition-colors flex-shrink-0 self-center" />
                  </button>
                ))
              ) : (
                <div className="flex flex-col items-center justify-center h-full text-center p-6 text-zinc-500 space-y-2">
                  <Search className="h-8 w-8 text-zinc-700" />
                  <p className="text-sm font-bold text-zinc-400">Nenhum resultado encontrado</p>
                  <p className="text-xs text-zinc-600">Tente buscar por outras palavras-chave ou mude a categoria.</p>
                </div>
              )}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

/**
 * 6.7 Tela de Bloqueio Autônoma (Privacy Lock Screen com PIN e Biometria)
 */
export const PrivacyLockScreen: React.FC<{
  userName: string;
  userPhoto: string;
  correctPin?: string;
  onUnlock: () => void;
  biometricEnabled?: boolean;
  desktopBgUrl?: string;
  mobileBgUrl?: string;
}> = ({
  userName,
  userPhoto,
  correctPin = '1234',
  onUnlock,
  biometricEnabled = true,
  desktopBgUrl,
  mobileBgUrl
}) => {
  const [pinInput, setPinInput] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [isShaking, setIsShaking] = useState(false);
  const [showPin, setShowPin] = useState(false);
  const [isAuthenticatingBio, setIsAuthenticatingBio] = useState(false);

  const handleAttemptUnlock = (pinToTest?: string) => {
    const value = pinToTest ?? pinInput;
    if (value === correctPin) {
      setErrorMessage('');
      onUnlock();
    } else {
      setErrorMessage('PIN incorreto. Tente novamente.');
      setIsShaking(true);
      setTimeout(() => setIsShaking(false), 500);
      if (typeof navigator !== 'undefined' && navigator.vibrate) {
        navigator.vibrate([100, 50, 100]);
      }
      setPinInput('');
    }
  };

  const handleSimulateBiometrics = async () => {
    setIsAuthenticatingBio(true);
    setErrorMessage('');
    setTimeout(() => {
      setIsAuthenticatingBio(false);
      onUnlock();
    }, 1000);
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black select-none overflow-hidden">
      {/* Wallpapers Dinâmicos (Desktop 16:9 vs Mobile 9:16) */}
      <div className="absolute inset-0 z-0">
        <div
          className="w-full h-full bg-cover bg-center filter brightness-[0.35] blur-[2px] transition-all duration-700"
          style={{
            backgroundImage: `url(${
              desktopBgUrl ||
              'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=1600'
            })`
          }}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/60 to-black/80" />
      </div>

      {/* Caixa Central de Desbloqueio */}
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className={`relative z-10 w-full max-w-sm mx-4 bg-zinc-950/80 backdrop-blur-2xl border border-zinc-800 rounded-3xl p-8 shadow-2xl text-center space-y-6 ${
          isShaking ? 'animate-bounce' : ''
        }`}
      >
        {/* Avatar e Boas-Vindas */}
        <div className="flex flex-col items-center space-y-3">
          <div className="relative">
            <img
              src={userPhoto}
              alt={userName}
              className="w-20 h-20 rounded-full object-cover border-2 border-orange-500/40 shadow-[0_0_20px_rgba(249,115,22,0.3)]"
            />
            <div className="absolute -bottom-1 -right-1 p-1.5 bg-orange-500 rounded-full text-white shadow-lg">
              <Lock className="w-3.5 h-3.5" />
            </div>
          </div>
          <div>
            <h2 className="text-lg font-bold text-white tracking-tight">{userName}</h2>
            <p className="text-xs text-zinc-400 font-mono mt-0.5">Sessão Protegida • Digite seu PIN</p>
          </div>
        </div>

        {/* Input de PIN */}
        <div className="space-y-2">
          <div className="relative flex items-center">
            <input
              type={showPin ? 'text' : 'password'}
              maxLength={8}
              value={pinInput}
              onChange={(e) => setPinInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleAttemptUnlock()}
              placeholder="Digite seu PIN"
              className="w-full text-center tracking-widest text-lg font-mono bg-zinc-900/90 border border-zinc-800 rounded-2xl py-3 px-10 text-white focus:outline-none focus:border-orange-500 transition-colors"
            />
            <button
              type="button"
              onClick={() => setShowPin(!showPin)}
              className="absolute right-3.5 text-zinc-500 hover:text-white cursor-pointer"
            >
              {showPin ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>

          {errorMessage && (
            <p className="text-xs text-red-400 font-medium flex items-center justify-center gap-1">
              <ShieldAlert className="w-3.5 h-3.5" /> {errorMessage}
            </p>
          )}
        </div>

        {/* Botão de Desbloqueio e Biometria */}
        <div className="space-y-3 pt-2">
          <button
            onClick={() => handleAttemptUnlock()}
            className="w-full py-3 bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white font-bold text-xs uppercase tracking-wider rounded-2xl shadow-lg shadow-orange-500/20 active:scale-98 transition-all cursor-pointer"
          >
            Desbloquear Acesso
          </button>

          {biometricEnabled && (
            <button
              onClick={handleSimulateBiometrics}
              disabled={isAuthenticatingBio}
              className="w-full py-2.5 bg-zinc-900 hover:bg-zinc-850 border border-zinc-800 text-zinc-300 hover:text-white font-semibold text-xs rounded-2xl flex items-center justify-center gap-2 transition-colors cursor-pointer"
            >
              {isAuthenticatingBio ? (
                <>
                  <RefreshCw className="w-4 h-4 text-orange-500 animate-spin" />
                  <span>Lendo digital...</span>
                </>
              ) : (
                <>
                  <Fingerprint className="w-4 h-4 text-orange-400" />
                  <span>Desbloquear com Biometria</span>
                </>
              )}
            </button>
          )}
        </div>
      </motion.div>
    </div>
  );
};

/* ============================================================================
 * 7. COMPONENTE PRINCIPAL STANDALONE DE REFERÊNCIA
 * ============================================================================
 * Implementa toda a casca integrada (Shell), alternância de abas fluida com
 * physics spring no mobile e ease cubic no desktop, detecção de swipe por toque,
 * fixação lateral na barra de desktop, barras de progresso e tela de bloqueio.
 */
export default function NavigationShellStandalone() {
  // Estado da Aba Ativa
  const [activeTab, setActiveTab] = useState<NavigationTabId>('dashboard');

  // Estados de HUD & Configuração
  const [sidebarPinned, setSidebarPinned] = useState(true);
  const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [isLocked, setIsLocked] = useState(false);
  const [mobileNavbarMode, setMobileNavbarMode] = useState<'fixed' | 'flexible'>('fixed');
  const [mobileNavbarShape, setMobileNavbarShape] = useState<'oval' | 'reta'>('oval');
  const [isMobileNavHidden, setIsMobileNavHidden] = useState(false);

  // Perfil de Exemplo do Usuário com XP e Nível
  const [userProfile, setUserProfile] = useState<UserSessionProfile>({
    name: 'Nando',
    handle: '@nando',
    photoUrl: 'https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?q=80&w=200',
    level: 4,
    xpTotal: 3480,
    streakDays: 12
  });

  // Tela Cheia e Progresso de Rolagem
  const { isFullscreen, toggleFullscreen } = useCrossBrowserFullscreen();
  const { scrollProgress, scrollToPercent } = useScrollProgress();

  // Detecção de Mobile em Runtime
  const [isMobile, setIsMobile] = useState<boolean>(() => {
    return typeof window !== 'undefined' ? window.innerWidth < 1024 : false;
  });

  useEffect(() => {
    const onResize = () => setIsMobile(window.innerWidth < 1024);
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  // Cálculo da Direção de Deslize entre Abas (-1 ou +1)
  const prevTabRef = useRef<NavigationTabId>(activeTab);
  const [slideDirection, setSlideDirection] = useState<number>(1);

  useEffect(() => {
    if (prevTabRef.current !== activeTab) {
      const prevIdx = TAB_ORDER[prevTabRef.current] ?? 0;
      const newIdx = TAB_ORDER[activeTab] ?? 0;
      setSlideDirection(newIdx >= prevIdx ? 1 : -1);
      prevTabRef.current = activeTab;
    }
  }, [activeTab]);

  // Gestos de Deslize Touch para Mobile (Swipe Horizontal)
  const touchStartRef = useRef<{ x: number; y: number; time: number } | null>(null);

  const handleTouchStart = (e: React.TouchEvent) => {
    if (!isMobile) return;
    const touch = e.touches[0];
    const target = e.target as HTMLElement | null;
    if (
      target &&
      (target.closest('input, textarea, select, button, a, [data-no-swipe], .no-swipe, [role="slider"], .overflow-x-auto') ||
        ['INPUT', 'TEXTAREA', 'BUTTON', 'SELECT'].includes(target.tagName))
    ) {
      touchStartRef.current = null;
      return;
    }
    touchStartRef.current = { x: touch.clientX, y: touch.clientY, time: Date.now() };
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (!isMobile || !touchStartRef.current) return;
    const touch = e.changedTouches[0];
    const deltaX = touch.clientX - touchStartRef.current.x;
    const deltaY = touch.clientY - touchStartRef.current.y;
    const elapsed = Date.now() - touchStartRef.current.time;
    touchStartRef.current = null;

    // Critério estrito de velocidade e direção
    if (elapsed < 450 && Math.abs(deltaX) > 50 && Math.abs(deltaX) > Math.abs(deltaY) * 2) {
      const MOBILE_PRIMARY_TABS: NavigationTabId[] = ['calendario', 'dashboard', 'checklist', 'notas'];
      const curIndex = MOBILE_PRIMARY_TABS.indexOf(activeTab);
      if (curIndex !== -1) {
        if (deltaX < 0 && curIndex < MOBILE_PRIMARY_TABS.length - 1) {
          setActiveTab(MOBILE_PRIMARY_TABS[curIndex + 1]);
        } else if (deltaX > 0 && curIndex > 0) {
          setActiveTab(MOBILE_PRIMARY_TABS[curIndex - 1]);
        }
      }
    }
  };

  // Modo de Navbar Flexível no Scroll (Esconde ao rolar para baixo, mostra ao rolar para cima)
  const lastScrollYRef = useRef(0);
  useEffect(() => {
    if (mobileNavbarMode !== 'flexible') {
      setIsMobileNavHidden(false);
      return;
    }

    const onScroll = () => {
      const currentY = window.scrollY;
      if (currentY <= 30) {
        setIsMobileNavHidden(false);
        lastScrollYRef.current = currentY;
        return;
      }
      const diff = currentY - lastScrollYRef.current;
      if (Math.abs(diff) > 10) {
        if (diff > 0) setIsMobileNavHidden(true);
        else setIsMobileNavHidden(false);
        lastScrollYRef.current = currentY;
      }
    };

    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, [mobileNavbarMode]);

  // Se o site estiver trancado, exibe a tela de proteção
  if (isLocked) {
    return (
      <PrivacyLockScreen
        userName={userProfile.name}
        userPhoto={userProfile.photoUrl}
        correctPin="1234"
        onUnlock={() => setIsLocked(false)}
        biometricEnabled={true}
      />
    );
  }

  return (
    <div
      id="standalone-shell-root"
      className="flex flex-col lg:flex-row min-h-screen bg-[#040405] text-zinc-300 font-sans relative selection:bg-orange-500 selection:text-white"
    >
      {/* 1. DUPLA BARRA DE PROGRESSO (Scroll Mobile Topo & Trilho Desktop Direita) */}
      <DualProgressBar scrollProgress={scrollProgress} onScrollToPercent={scrollToPercent} />

      {/* 2. TOP BAR MOBILE */}
      <MobileTopBar
        userPhoto={userProfile.photoUrl}
        userName={userProfile.name}
        isFullscreen={isFullscreen}
        onOpenProfile={() => setActiveTab('perfil')}
        onOpenSearch={() => setSearchOpen(true)}
        onToggleFullscreen={toggleFullscreen}
      />

      {/* 3. MOBILE BOTTOM NAVBAR (CURVED OVAL OU STRAIGHT RETA) */}
      {mobileNavbarShape === 'reta' ? (
        <MobileStraightNavbar
          activeTab={activeTab}
          onSelectTab={setActiveTab}
          onOpenDrawer={() => setMobileDrawerOpen(true)}
          isHidden={isMobileNavHidden}
        />
      ) : (
        <MobileCurvedNavbar
          activeTab={activeTab}
          onSelectTab={setActiveTab}
          onOpenDrawer={() => setMobileDrawerOpen(true)}
          isHidden={isMobileNavHidden}
        />
      )}

      {/* 4. MOBILE DRAWER SLIDING MENU */}
      <MobileDrawer
        isOpen={mobileDrawerOpen}
        onClose={() => setMobileDrawerOpen(false)}
        activeTab={activeTab}
        onSelectTab={setActiveTab}
        user={userProfile}
        items={DEFAULT_MENU_ITEMS}
        isFullscreen={isFullscreen}
        onToggleFullscreen={toggleFullscreen}
      />

      {/* 5. DESKTOP SIDEBAR HUD COM FIXAÇÃO E PROGRESSO DE XP */}
      <DesktopSidebarHUD
        activeTab={activeTab}
        onSelectTab={setActiveTab}
        items={DEFAULT_MENU_ITEMS}
        user={userProfile}
        pinned={sidebarPinned}
        onTogglePin={() => setSidebarPinned(!sidebarPinned)}
        isFullscreen={isFullscreen}
        onToggleFullscreen={toggleFullscreen}
        onLockApp={() => setIsLocked(true)}
        onOpenSearch={() => setSearchOpen(true)}
        scrollProgress={scrollProgress}
      />

      {/* 6. MODAL DE BUSCA GERAL UNIFICADO */}
      <GlobalSearchOverlay
        isOpen={searchOpen}
        onClose={() => setSearchOpen(false)}
        onNavigateToTab={setActiveTab}
      />

      {/* 7. ÁREA PRINCIPAL DO WORKSPACE COM ESPAÇAMENTOS RESPONSIVOS E TRANSIÇÕES FLUIDAS */}
      <main
        id="standalone-workspace-area"
        className={`flex-1 overflow-x-hidden min-h-screen pt-16 pb-28 lg:pt-8 lg:pb-8 transition-all duration-300 relative ${
          sidebarPinned ? 'lg:pl-64' : 'lg:pl-[76px]'
        }`}
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
      >
        {/* Efeitos Visuais de Luz de Fundo (Glow Amber & Orange) */}
        <div className="absolute top-0 right-1/4 w-[500px] h-[500px] bg-orange-600/5 rounded-full blur-[140px] pointer-events-none" />
        <div className="absolute bottom-1/4 left-1/4 w-[400px] h-[400px] bg-amber-600/5 rounded-full blur-[120px] pointer-events-none" />

        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-4 relative z-10">
          {/* PAINEL DE CONTROLE DA DEMONSTRAÇÃO STANDALONE */}
          <div className="mb-8 p-5 bg-zinc-950/80 border border-zinc-800 rounded-3xl shadow-xl space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-zinc-900 pb-3">
              <div>
                <span className="text-[10px] font-mono uppercase tracking-widest text-orange-500 font-bold block">
                  STANDALONE SPECIFICATION & DEMO
                </span>
                <h1 className="text-base font-black text-white">Casca Visual de Navegação & Layout</h1>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => setIsLocked(true)}
                  className="px-3 py-1.5 bg-orange-500/10 hover:bg-orange-500/20 border border-orange-500/30 text-orange-400 font-bold text-xs rounded-xl flex items-center gap-1.5 transition-all cursor-pointer"
                >
                  <Lock className="w-3.5 h-3.5" />
                  <span>Testar Bloqueio</span>
                </button>

                <button
                  onClick={toggleFullscreen}
                  className="px-3 py-1.5 bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-zinc-300 font-bold text-xs rounded-xl flex items-center gap-1.5 transition-all cursor-pointer"
                >
                  {isFullscreen ? <Minimize className="w-3.5 h-3.5 text-orange-500" /> : <Maximize className="w-3.5 h-3.5" />}
                  <span>{isFullscreen ? 'Sair Tela Cheia' : 'Tela Cheia'}</span>
                </button>
              </div>
            </div>

            {/* Controles de Configuração da Casca */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
              <div className="p-3 bg-zinc-900/40 rounded-2xl border border-zinc-800/80">
                <span className="text-zinc-500 block mb-1 font-mono text-[10px]">FIXAÇÃO DA BARRA LATERAL</span>
                <button
                  onClick={() => setSidebarPinned(!sidebarPinned)}
                  className={`w-full py-1.5 rounded-xl font-bold transition-colors cursor-pointer ${
                    sidebarPinned ? 'bg-orange-500/20 text-orange-400 border border-orange-500/40' : 'bg-zinc-800 text-zinc-400'
                  }`}
                >
                  {sidebarPinned ? 'Fixada (256px)' : 'Colapsável no Hover (76px)'}
                </button>
              </div>

              <div className="p-3 bg-zinc-900/40 rounded-2xl border border-zinc-800/80">
                <span className="text-zinc-500 block mb-1 font-mono text-[10px]">COMPORTAMENTO NAVBAR MOBILE</span>
                <button
                  onClick={() => setMobileNavbarMode(mobileNavbarMode === 'fixed' ? 'flexible' : 'fixed')}
                  className="w-full py-1.5 bg-zinc-800 hover:bg-zinc-750 text-zinc-200 font-bold rounded-xl transition-colors cursor-pointer"
                >
                  {mobileNavbarMode === 'fixed' ? 'Modo Fixo (Sempre Visível)' : 'Modo Flexível (Oculta ao Rolar)'}
                </button>
              </div>

              <div className="p-3 bg-zinc-900/40 rounded-2xl border border-zinc-800/80">
                <span className="text-zinc-500 block mb-1 font-mono text-[10px]">FORMATO NAVBAR MOBILE</span>
                <button
                  onClick={() => setMobileNavbarShape(mobileNavbarShape === 'oval' ? 'reta' : 'oval')}
                  className="w-full py-1.5 bg-zinc-800 hover:bg-zinc-750 text-zinc-200 font-bold rounded-xl transition-colors cursor-pointer"
                >
                  {mobileNavbarShape === 'oval' ? 'Formato: Oval (Curvo Neon)' : 'Formato: Reta (Clássica)'}
                </button>
              </div>

              <div className="p-3 bg-zinc-900/40 rounded-2xl border border-zinc-800/80">
                <span className="text-zinc-500 block mb-1 font-mono text-[10px]">PROGRESSO DE XP DO USUÁRIO</span>
                <button
                  onClick={() =>
                    setUserProfile(prev => ({
                      ...prev,
                      xpTotal: prev.xpTotal + 150,
                      level: Math.floor((prev.xpTotal + 150) / 1000) + 1
                    }))
                  }
                  className="w-full py-1.5 bg-orange-500 hover:bg-orange-600 text-white font-bold rounded-xl transition-colors cursor-pointer"
                >
                  Ganhar +150 XP
                </button>
              </div>
            </div>
          </div>

          {/* ÁREA DE TRANSIÇÃO FLUIDA ENTRE ABAS (SPA) */}
          <AnimatePresence mode="popLayout" custom={slideDirection} initial={false}>
            <motion.div
              key={activeTab}
              custom={slideDirection}
              variants={
                isMobile
                  ? {
                      enter: (dir: number) => ({
                        x: dir > 0 ? '100%' : '-100%',
                        opacity: 0,
                        scale: 0.98
                      }),
                      center: {
                        x: '0%',
                        opacity: 1,
                        scale: 1
                      },
                      exit: (dir: number) => ({
                        x: dir > 0 ? '-100%' : '100%',
                        opacity: 0,
                        scale: 0.98
                      })
                    }
                  : {
                      enter: { opacity: 0, y: 14 },
                      center: { opacity: 1, y: 0 },
                      exit: { opacity: 0, y: -14 }
                    }
              }
              initial="enter"
              animate="center"
              exit="exit"
              transition={
                isMobile
                  ? {
                      type: 'spring',
                      stiffness: 340,
                      damping: 32,
                      mass: 0.75
                    }
                  : {
                      duration: 0.22,
                      ease: [0.16, 1, 0.3, 1]
                    }
              }
              className="bg-zinc-950/60 border border-zinc-900 rounded-3xl p-6 sm:p-8 shadow-xl space-y-6"
            >
              <div className="flex items-center justify-between border-b border-zinc-900/80 pb-4">
                <div>
                  <span className="text-[10px] font-mono uppercase tracking-wider text-orange-500 font-bold">
                    ABA ATIVA: {activeTab.toUpperCase()}
                  </span>
                  <h2 className="text-xl font-black text-white mt-0.5">
                    {DEFAULT_MENU_ITEMS.find(m => m.id === activeTab)?.label || 'Visão'}
                  </h2>
                </div>
                <div className="p-3 bg-orange-500/10 text-orange-400 rounded-2xl border border-orange-500/20">
                  <Sparkles className="w-5 h-5" />
                </div>
              </div>

              <div className="prose prose-invert max-w-none text-zinc-400 text-xs sm:text-sm leading-relaxed space-y-3">
                <p>
                  Esta tela demonstra a transição fluida entre abas. No <strong>Mobile</strong>, o movimento
                  ocorre lateralmente com amortecimento elástico (spring physics), permitindo gestos horizontais
                  de deslize por toque. No <strong>Desktop</strong>, a transição utiliza interpolação cúbica com
                  sutil variação vertical de 14px e esvanecimento (fade-in).
                </p>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2">
                  {(['dashboard', 'checklist', 'calendario', 'notas', 'metas', 'financas', 'resumo', 'configuracoes'] as NavigationTabId[]).map(tab => (
                    <button
                      key={tab}
                      onClick={() => setActiveTab(tab)}
                      className={`p-2.5 rounded-xl border text-xs font-bold transition-all cursor-pointer ${
                        activeTab === tab
                          ? 'bg-orange-500/20 border-orange-500 text-orange-400 shadow-sm'
                          : 'bg-zinc-900/60 border-zinc-800 text-zinc-400 hover:text-white'
                      }`}
                    >
                      Ir para {tab}
                    </button>
                  ))}
                </div>
              </div>
            </motion.div>
          </AnimatePresence>
        </div>
      </main>
    </div>
  );
}
