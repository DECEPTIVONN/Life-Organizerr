import React, { useState, useEffect, useRef } from 'react';
import { 
  Menu, 
  X, 
  Trophy, 
  Zap, 
  Flame, 
  Award,
  Maximize2,
  Cloud,
  AlertTriangle
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

// Subcomponents
import Sidebar from './components/Sidebar';
import LockScreen from './components/LockScreen';
import AppLoadingScreen from './components/AppLoadingScreen';
import { AuthModal } from './components/AuthModal';
import { AuthUser } from './lib/auth';
import { syncAndRegisterCurrentDevice } from './lib/devices';
import DashboardView from './components/DashboardView';
import ChecklistView from './components/ChecklistView';
import FinancesView from './components/FinancesView';
import RoutineView from './components/RoutineView';
import GoalsView from './components/GoalsView';
import CalendarView from './components/CalendarView';
import DocumentsView from './components/DocumentsView';
import NotesView from './components/NotesView';
import SettingsView from './components/SettingsView';
import ProfileView from './components/ProfileView';
import { THEME_PRESETS, applyThemeColor } from './utils/themeColors';
import { getValidGoogleAccessToken, clearGoogleOAuthSession } from './utils/googleToken';
import LifeSummaryView, { LifeSummaryState, defaultState, mergeWithDefaults } from './components/LifeSummaryView';
import HabitsTrackerView from './components/HabitsTrackerView';
import AnuaisView from './components/AnuaisView';
import RemindersView from './components/RemindersView';
import ProjetosView from './components/ProjetosView';
import StreakHubModal from './components/StreakHubModal';
import { LeagueRankingModal } from './components/LeagueRankingModal';
import { LeagueRankingView } from './components/LeagueRankingView';
import { saveToSupabase, loadFromSupabase, loadMetadataFromSupabase, getSupabaseClient, subscribeToCrossTabSync } from './lib/supabase';
import { getOrCreateDeviceId } from './lib/devices';
import { 
  enqueueMutation, 
  processMutationQueue, 
  loadOfflineSnapshot, 
  saveOfflineSnapshot,
  subscribeToMutationQueue,
  clearAllMutations
} from './lib/indexedDbQueue';
import { OfflineNotificationBanner } from './components/OfflineNotificationBanner';
import { sendSystemNotification, syncAlarmsToServiceWorker } from './lib/notificationHelper';

import { DEFAULT_VISION_BOARD_CARDS } from './components/VisionBoard';
import { BankAccount, CreditCardItem, DebtItem, BudgetLimit } from './components/FinancesView';
import { cleanupExpiredGridRoutine, cleanupExpiredRoutineItems } from './utils/routineUtils';

// Types
import { 
  DailyTask, 
  Goal, 
  FinanceEntry, 
  CalendarNote, 
  ArchivedDocument, 
  Note, 
  RoutineItem,
  MonthlyReview,
  WeeklyReview,
  BookTracker,
  BibleTracker,
  TimelineGoal,
  FutureEvent,
  Habit,
  YearlyBook,
  QuickReminder,
  Project,
  VisionBoardCard,
  PortfolioAsset,
  InvestmentTransaction
} from './types';



// Helper to get formatted local date (YYYY-MM-DD)
const getTodayDateStr = () => {
  return new Date().toISOString().split('T')[0];
};

export const defaultAreaImages: Record<string, string> = {
  'Saúde': 'https://images.unsplash.com/photo-1608155686393-8fdd966d784d?q=80&w=1000', // Marble Neptune / classical sculpture style
  'Financeiro': 'https://images.unsplash.com/photo-1584290860587-211bfb66aa0f?q=80&w=1000', // Classical gold painting style
  'Social': 'https://images.unsplash.com/photo-1581022295087-35e59370ac36?q=80&w=1000', // Pierre-Auguste Cot - Springtime / swing
  'Hobbies': 'https://images.unsplash.com/photo-1495446815901-a7297e633e8d?q=80&w=1000', // Library bedroom with coffee
  'Espiritualidade': 'https://images.unsplash.com/photo-1475924156734-496f6cac6ec1?q=80&w=1000', // Caspar David Friedrich mystic mountain style
  'Físico': 'https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?q=80&w=1000', // Classical athlete anatomy style
  'Carreira': 'https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?q=80&w=1000' // Architecture blueprints study style
};

const cleanAndSortObject = (obj: any): any => {
  if (obj === null) return null;
  if (obj === undefined) return null;
  if (Array.isArray(obj)) {
    return obj.map(item => cleanAndSortObject(item));
  }
  if (typeof obj === 'object') {
    const sortedObj: any = {};
    const keys = Object.keys(obj).sort();
    for (const key of keys) {
      const val = obj[key];
      if (val !== undefined) {
        sortedObj[key] = cleanAndSortObject(val);
      }
    }
    return sortedObj;
  }
  return obj;
};

// Helper to stringify objects with sorted keys recursively, ignoring undefined values
const safeStringify = (obj: any): string => {
  return JSON.stringify(cleanAndSortObject(obj));
};

export default function App() {
  // --- Sidebar Mobile Toggle State ---
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // --- Sidebar HUD Pinned state ---
  const [sidebarPinned, setSidebarPinned] = useState(() => {
    return localStorage.getItem('mbc_sidebarPinned') !== 'false';
  });

  // --- App Lock States ---
  const [appLockEnabled, setAppLockEnabled] = useState(() => {
    return localStorage.getItem('mbc_app_lock_enabled') === 'true';
  });

  const [appLockPassword, setAppLockPassword] = useState(() => {
    return localStorage.getItem('mbc_app_lock_password') || '';
  });

  const [appLockTimeout, setAppLockTimeout] = useState(() => {
    const saved = localStorage.getItem('mbc_app_lock_timeout');
    return saved ? parseInt(saved, 10) : -1;
  });

  const [appLockBiometricEnabled, setAppLockBiometricEnabled] = useState(() => {
    return localStorage.getItem('mbc_app_lock_biometric_enabled') === 'true';
  });

  const [isAppLocked, setIsAppLocked] = useState(() => {
    const enabled = localStorage.getItem('mbc_app_lock_enabled') === 'true';
    const pass = localStorage.getItem('mbc_app_lock_password') || '';
    return enabled && pass !== '';
  });

  // Loading screen state (only displayed when genuinely synchronizing data with the cloud)
  const [isSyncLoading, setIsSyncLoading] = useState<boolean>(false);
  const [isUnlockLoading, setIsUnlockLoading] = useState<boolean>(false);

  // --- Core Auth & User Session States ---
  const [currentUser, setCurrentUser] = useState<AuthUser | null>(() => {
    const savedLocal = localStorage.getItem('mbc_auth_user');
    if (savedLocal) {
      try { return JSON.parse(savedLocal); } catch (e) {}
    }
    const savedSession = sessionStorage.getItem('mbc_auth_user');
    if (savedSession) {
      try { return JSON.parse(savedSession); } catch (e) {}
    }
    return null;
  });

  const [isAuthModalOpen, setIsAuthModalOpen] = useState<boolean>(() => {
    return !currentUser;
  });

  // --- Core States & LocalStorage Hydration ---
  const [userName, setUserName] = useState(() => {
    if (currentUser?.name) return currentUser.name;
    return localStorage.getItem('mbc_userName') || 'Nando';
  });

  const [userPhoto, setUserPhoto] = useState(() => {
    if (currentUser?.photo) return currentUser.photo;
    return localStorage.getItem('mbc_userPhoto') || 'https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?q=80&w=100';
  });

  const [userHandle, setUserHandle] = useState(() => {
    if (currentUser?.username) return `@${currentUser.username}`;
    return localStorage.getItem('mbc_userHandle') || '@usuario';
  });

  const [userEmail, setUserEmail] = useState(() => {
    if (currentUser?.email) return currentUser.email;
    return localStorage.getItem('mbc_userEmail') || 'etanomicosl5@gmail.com';
  });

  const [userPassword, setUserPassword] = useState(() => {
    return localStorage.getItem('mbc_userPassword') || '••••••••';
  });

  const [autoFullscreen, setAutoFullscreen] = useState(() => {
    return localStorage.getItem('mbc_autoFullscreen') !== 'false';
  });

  const [showChecklistDateSelector, setShowChecklistDateSelector] = useState(() => {
    return localStorage.getItem('mbc_show_checklist_date_selector') === 'true';
  });

  const [mobileSlideTransition, setMobileSlideTransition] = useState(() => {
    return localStorage.getItem('mbc_mobile_slide_transition') !== 'false';
  });

  // Mobile Navbar Mode ('fixed' vs 'flexible')
  const [mobileNavbarMode, setMobileNavbarMode] = useState<'fixed' | 'flexible'>(() => {
    return (localStorage.getItem('mbc_mobile_navbar_mode') as 'fixed' | 'flexible') || 'fixed';
  });

  const [activeThemePreset, setActiveThemePreset] = useState<string>(() => {
    return localStorage.getItem('mbc_theme_preset') || 'default';
  });

  const [customThemeHex, setCustomThemeHex] = useState<string>(() => {
    return localStorage.getItem('mbc_custom_theme_hex') || '#3396f3';
  });

  // Custom Loading / Splash Screen Images (Vertical for mobile/portrait, Horizontal for desktop/landscape)
  const [loadingScreenVerticalImage, setLoadingScreenVerticalImage] = useState<string>(() => {
    return localStorage.getItem('mbc_loading_screen_vertical_image') || '';
  });

  const [loadingScreenHorizontalImage, setLoadingScreenHorizontalImage] = useState<string>(() => {
    return localStorage.getItem('mbc_loading_screen_horizontal_image') || '';
  });

  // Custom Lock Screen Backgrounds (Desktop Horizontal 16:9, Mobile Vertical 9:16)
  const [lockScreenDesktopImage, setLockScreenDesktopImage] = useState<string>(() => {
    return localStorage.getItem('mbc_lock_screen_desktop_image') || '';
  });

  const [lockScreenMobileImage, setLockScreenMobileImage] = useState<string>(() => {
    return localStorage.getItem('mbc_lock_screen_mobile_image') || '';
  });

  useEffect(() => {
    if (lockScreenDesktopImage) {
      localStorage.setItem('mbc_lock_screen_desktop_image', lockScreenDesktopImage);
    } else {
      localStorage.removeItem('mbc_lock_screen_desktop_image');
    }
  }, [lockScreenDesktopImage]);

  useEffect(() => {
    if (lockScreenMobileImage) {
      localStorage.setItem('mbc_lock_screen_mobile_image', lockScreenMobileImage);
    } else {
      localStorage.removeItem('mbc_lock_screen_mobile_image');
    }
  }, [lockScreenMobileImage]);

  useEffect(() => {
    if (activeThemePreset === 'custom' && customThemeHex) {
      applyThemeColor(customThemeHex);
    } else {
      const presetObj = THEME_PRESETS.find(p => p.id === activeThemePreset);
      if (presetObj) {
        applyThemeColor(presetObj.primaryHex);
      }
    }
    if (activeThemePreset) {
      localStorage.setItem('mbc_theme_preset', activeThemePreset);
    }
    if (customThemeHex) {
      localStorage.setItem('mbc_custom_theme_hex', customThemeHex);
    }
  }, [activeThemePreset, customThemeHex]);

  const [isMobile, setIsMobile] = useState(() => typeof window !== 'undefined' && window.innerWidth < 1024);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 1024);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const [freeEditMode, setFreeEditMode] = useState(() => {
    return localStorage.getItem('mbc_freeEditMode') === 'true';
  });

  const [accountDeactivated, setAccountDeactivated] = useState(() => {
    return localStorage.getItem('mbc_accountDeactivated') === 'true';
  });

  const [activeTab, setActiveTab] = useState(() => {
    return localStorage.getItem('mbc_activeTab') || 'dashboard';
  });

  const [reminders, setReminders] = useState<QuickReminder[]>(() => {
    try {
      const saved = localStorage.getItem('mbc_reminders');
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.error('Error loading reminders:', e);
    }
    return [
      {
        id: 'rem-demo-1',
        title: 'Beber 500ml de Água 💧',
        mode: 'timer',
        durationSeconds: 300,
        targetTimestamp: Date.now() + 300000,
        paused: false,
        category: 'Saúde',
        priority: 'media',
        soundEnabled: true,
        status: 'active',
        createdAt: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
      }
    ];
  });

  const [projects, setProjects] = useState<Project[]>(() => {
    try {
      const saved = localStorage.getItem('mbc_projects');
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.error('Error loading projects:', e);
    }
    return [];
  });

  useEffect(() => {
    try {
      localStorage.setItem('mbc_projects', JSON.stringify(projects));
    } catch (e) {
      console.error('Error saving projects:', e);
    }
  }, [projects]);


  // --- Lifted Navigation Sub-States ---
  const [checklistActiveTab, setChecklistActiveTab] = useState<'checklist' | 'rotina' | 'rotina-semanal' | 'habitos'>('checklist');
  const [goalsViewMode, setGoalsViewMode] = useState<'areas' | 'all' | 'leitura' | 'timeline'>('areas');
  const [goalsSelectedArea, setGoalsSelectedArea] = useState<string | null>(null);
  const [settingsScreen, setSettingsScreen] = useState<any>('main');
  const [settingsHistory, setSettingsHistory] = useState<any[]>([]);
  const [lifeSummaryActiveArea, setLifeSummaryActiveArea] = useState<any>(null);
  const isPoppingRef = useRef(false);

  // --- Mobile Lateral Tab Slide Transitions & Touch Gestures ---
  const TAB_ORDER: Record<string, number> = {
    calendario: 0,
    dashboard: 1,
    checklist: 2,
    notas: 3,
    rotina: 4,
    habitos: 5,
    metas: 6,
    financas: 7,
    anuais: 8,
    documentos: 9,
    configuracoes: 10,
  };

  const prevTabRef = useRef<string>(activeTab);
  const [slideDirection, setSlideDirection] = useState<number>(1);

  useEffect(() => {
    if (prevTabRef.current !== activeTab) {
      const prevIdx = TAB_ORDER[prevTabRef.current] ?? 0;
      const newIdx = TAB_ORDER[activeTab] ?? 0;
      setSlideDirection(newIdx >= prevIdx ? 1 : -1);
      prevTabRef.current = activeTab;
    }
  }, [activeTab]);

  const touchStartRef = useRef<{ x: number; y: number; time: number } | null>(null);

  const handleTouchStart = (e: React.TouchEvent) => {
    if (!isMobile || !mobileSlideTransition) return;
    const touch = e.touches[0];
    const target = e.target as HTMLElement | null;
    if (target && (
      target.closest('input, textarea, select, button, a, [data-no-swipe], .no-swipe, [role="slider"], .overflow-x-auto') ||
      ['INPUT', 'TEXTAREA', 'BUTTON', 'SELECT'].includes(target.tagName)
    )) {
      touchStartRef.current = null;
      return;
    }
    touchStartRef.current = {
      x: touch.clientX,
      y: touch.clientY,
      time: Date.now()
    };
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (!isMobile || !mobileSlideTransition || !touchStartRef.current) return;
    const touch = e.changedTouches[0];
    const deltaX = touch.clientX - touchStartRef.current.x;
    const deltaY = touch.clientY - touchStartRef.current.y;
    const timeDiff = Date.now() - touchStartRef.current.time;
    touchStartRef.current = null;

    // Strict velocity and direction check (horizontal distance must dominate vertical scroll)
    if (timeDiff < 450 && Math.abs(deltaX) > 50 && Math.abs(deltaX) > Math.abs(deltaY) * 2) {
      const MAIN_MOBILE_TABS = ['calendario', 'dashboard', 'checklist', 'notas'];
      const currentIndex = MAIN_MOBILE_TABS.indexOf(activeTab);
      if (currentIndex !== -1) {
        if (deltaX < 0 && currentIndex < MAIN_MOBILE_TABS.length - 1) {
          setActiveTab(MAIN_MOBILE_TABS[currentIndex + 1]);
        } else if (deltaX > 0 && currentIndex > 0) {
          setActiveTab(MAIN_MOBILE_TABS[currentIndex - 1]);
        }
      }
    }
  };

  const [xpTotal, setXpTotal] = useState<number>(() => {
    const saved = localStorage.getItem('mbc_xpTotal');
    return saved ? parseInt(saved, 10) : 985;
  });

  const [streak, setStreak] = useState<number>(() => {
    const saved = localStorage.getItem('mbc_streak');
    return saved ? parseInt(saved, 10) : 4;
  });

  const [isStreakHubOpen, setIsStreakHubOpen] = useState(false);
  const [isRankingModalOpen, setIsRankingModalOpen] = useState(false);

  const [bookTracker, setBookTracker] = useState<BookTracker>(() => {
    try {
      const saved = localStorage.getItem('mbc_bookTracker');
      if (saved && saved !== 'undefined') {
        return JSON.parse(saved);
      }
    } catch (e) {
      console.error("Failed to parse mbc_bookTracker", e);
    }
    const today = new Date();
    const getPastDateStr = (daysAgo: number) => {
      const d = new Date(today);
      d.setDate(today.getDate() - daysAgo);
      return d.toISOString().split('T')[0];
    };

    return {
      bookName: 'Hábitos Atômicos',
      totalPages: 250,
      deadlineDays: 14,
      pagesRead: 53,
      startedDate: getPastDateStr(5),
      history: [
        { date: getPastDateStr(4), pagesReadToday: 15, dailyTarget: 18 },
        { date: getPastDateStr(3), pagesReadToday: 20, dailyTarget: 18 },
        { date: getPastDateStr(2), pagesReadToday: 18, dailyTarget: 18 },
        { date: getPastDateStr(0), pagesReadToday: 12, dailyTarget: 18 }
      ]
    };
  });

  const [bibleTracker, setBibleTracker] = useState<BibleTracker>(() => {
    try {
      const saved = localStorage.getItem('mbc_bibleTracker');
      if (saved && saved !== 'undefined') {
        return JSON.parse(saved);
      }
    } catch (e) {
      console.error("Failed to parse mbc_bibleTracker", e);
    }

    const today = new Date();
    const getPastDateStr = (daysAgo: number) => {
      const d = new Date(today);
      d.setDate(today.getDate() - daysAgo);
      return d.toISOString().split('T')[0];
    };

    return {
      vezesNoAno: 1,
      capitulosJaLidos: 16,
      chaptersReadToday: 4,
      lastReadDate: getPastDateStr(0),
      history: [
        { date: getPastDateStr(4), chaptersReadToday: 4, dailyTarget: 4 },
        { date: getPastDateStr(3), chaptersReadToday: 4, dailyTarget: 4 },
        { date: getPastDateStr(2), chaptersReadToday: 4, dailyTarget: 4 },
        { date: getPastDateStr(0), chaptersReadToday: 4, dailyTarget: 4 }
      ]
    };
  });

  // Local storage persistence for trackers
  useEffect(() => {
    localStorage.setItem('mbc_bookTracker', JSON.stringify(bookTracker));
  }, [bookTracker]);

  useEffect(() => {
    localStorage.setItem('mbc_bibleTracker', JSON.stringify(bibleTracker));
  }, [bibleTracker]);

  // Master Templates state for Espaço Diário & Fé cloud synchronization
  const [masterTemplates, setMasterTemplates] = useState<{ gratitude: string; decrees: string; prayer: string }>(() => {
    try {
      const g = localStorage.getItem('planner_template_gratitude') || `Sou profundamente grato(a) hoje por:\n1. \n2. \n3. `;
      const d = localStorage.getItem('planner_template_decretos') || `Eu decreto que hoje serei forte, focado(a) e superarei todos os meus desafios com resiliência. Estou em paz e em sintonia com a abundância.`;
      const p = localStorage.getItem('planner_template_oracao') || `Senhor, agradeço por mais um dia de vida. Peço sabedoria para guiar minhas ações, proteção para o meu caminho e paz para o meu coração e da minha família. Amém.`;
      return { gratitude: g, decrees: d, prayer: p };
    } catch {
      return {
        gratitude: `Sou profundamente grato(a) hoje por:\n1. \n2. \n3. `,
        decrees: `Eu decreto que hoje serei forte, focado(a) e superarei todos os meus desafios com resiliência. Estou em paz e em sintonia com a abundância.`,
        prayer: `Senhor, agradeço por mais um dia de vida. Peço sabedoria para guiar minhas ações, proteção para o meu caminho e paz para o meu coração e da minha família. Amém.`
      };
    }
  });

  useEffect(() => {
    if (masterTemplates.gratitude) localStorage.setItem('planner_template_gratitude', masterTemplates.gratitude);
    if (masterTemplates.decrees) localStorage.setItem('planner_template_decretos', masterTemplates.decrees);
    if (masterTemplates.prayer) localStorage.setItem('planner_template_oracao', masterTemplates.prayer);
  }, [masterTemplates]);

  // Daily Workspace Settings for Espaço Diário & Fé cloud synchronization
  const [dailyWorkspaceSettings, setDailyWorkspaceSettings] = useState<{ notifEnabled: boolean; reminderTime: string }>(() => {
    return {
      notifEnabled: localStorage.getItem('mbc_daily_workspace_notif_enabled') !== 'false',
      reminderTime: localStorage.getItem('mbc_daily_workspace_reminder_time') || '21:00'
    };
  });

  useEffect(() => {
    localStorage.setItem('mbc_daily_workspace_notif_enabled', String(dailyWorkspaceSettings.notifEnabled));
    localStorage.setItem('mbc_daily_workspace_reminder_time', dailyWorkspaceSettings.reminderTime || '21:00');
  }, [dailyWorkspaceSettings]);

  // --- App Lock Synchronization and Inactivity Timeout ---
  useEffect(() => {
    localStorage.setItem('mbc_app_lock_enabled', String(appLockEnabled));
  }, [appLockEnabled]);

  useEffect(() => {
    localStorage.setItem('mbc_app_lock_password', appLockPassword);
  }, [appLockPassword]);

  useEffect(() => {
    localStorage.setItem('mbc_app_lock_timeout', String(appLockTimeout));
  }, [appLockTimeout]);

  useEffect(() => {
    localStorage.setItem('mbc_app_lock_biometric_enabled', String(appLockBiometricEnabled));
  }, [appLockBiometricEnabled]);

  useEffect(() => {
    if (!appLockEnabled || !appLockPassword || appLockTimeout <= 0 || isAppLocked) {
      return;
    }

    let lastActive = Date.now();

    const handleActivity = () => {
      lastActive = Date.now();
    };

    // User activity listeners
    window.addEventListener('mousemove', handleActivity);
    window.addEventListener('mousedown', handleActivity);
    window.addEventListener('keydown', handleActivity);
    window.addEventListener('scroll', handleActivity);
    window.addEventListener('touchstart', handleActivity);

    // Dynamic inactivity checker
    const interval = setInterval(() => {
      const inactiveMs = Date.now() - lastActive;
      const timeoutMs = appLockTimeout * 60 * 1000;
      if (inactiveMs >= timeoutMs) {
        setIsAppLocked(true);
      }
    }, 5000); // Check every 5 seconds

    return () => {
      window.removeEventListener('mousemove', handleActivity);
      window.removeEventListener('mousedown', handleActivity);
      window.removeEventListener('keydown', handleActivity);
      window.removeEventListener('scroll', handleActivity);
      window.removeEventListener('touchstart', handleActivity);
      clearInterval(interval);
    };
  }, [appLockEnabled, appLockPassword, appLockTimeout, isAppLocked]);

  // Level calculation: level = Math.floor(xpTotal / 1000) + 1
  const level = Math.floor(xpTotal / 1000) + 1;
  const [prevLevel, setPrevLevel] = useState(level);
  const [showLevelUp, setShowLevelUp] = useState(false);

  // --- Sub-data States with Hydration & Initial Demo Data ---
  const [dailyTasks, setDailyTasks] = useState<DailyTask[]>(() => {
    const d = new Date();
    const todayStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    const lastReset = localStorage.getItem('mbc_last_daily_reset');
    const needsReset = lastReset !== todayStr;

    try {
      const saved = localStorage.getItem('mbc_dailyTasks');
      if (saved && saved !== 'undefined') {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          if (needsReset) {
            if (lastReset) {
              try {
                const savedNotesStr = localStorage.getItem('mbc_calendarNotes') || '[]';
                const pastNotes: any[] = JSON.parse(savedNotesStr);
                const existingIdx = pastNotes.findIndex(n => n.date === lastReset);
                if (existingIdx !== -1) {
                  pastNotes[existingIdx].checklist = parsed;
                  pastNotes[existingIdx].isDailyRecord = true;
                } else {
                  pastNotes.push({
                    id: 'cn-' + Math.random().toString(36).substring(2, 9),
                    date: lastReset,
                    title: `Registro Diário (${lastReset})`,
                    content: '',
                    isDailyRecord: true,
                    checklist: parsed
                  });
                }
                localStorage.setItem('mbc_calendarNotes', JSON.stringify(pastNotes));
              } catch (e) {
                console.error("Failed to archive previous daily tasks:", e);
              }
            }

            const resetTasks = parsed
              .filter((t: DailyTask) => t.isRecurring !== false || (t.createdDate && t.createdDate === todayStr))
              .map((t: DailyTask) => ({
                ...t,
                completed: false,
                subtasks: t.subtasks?.map((s) => ({ ...s, completed: false }))
              }));
            localStorage.setItem('mbc_last_daily_reset', todayStr);
            return resetTasks;
          }
          return parsed.filter((t: DailyTask) => t.isRecurring !== false || !t.createdDate || t.createdDate === todayStr);
        }
      }
    } catch (e) {
      console.error("Failed to parse mbc_dailyTasks", e);
    }

    localStorage.setItem('mbc_last_daily_reset', todayStr);
    return [
      { id: 'dt-1', text: 'Limpar a mente e meditar por 15 minutos', completed: false, xpReward: 10, category: 'O Básico' },
      { id: 'dt-2', text: 'Treino de alta intensidade na academia', completed: false, xpReward: 10, category: 'O Básico' },
      { id: 'dt-3', text: 'Leitura de 10 páginas de livro de desenvolvimento', completed: false, xpReward: 10, category: 'Segundo Cérebro' },
      { id: 'dt-4', text: 'Revisar as metas e projetos da semana', completed: false, xpReward: 10, category: 'Metas' },
      { id: 'dt-5', text: 'Registrar despesas e receitas diárias', completed: false, xpReward: 10, category: 'Canalização' }
    ];
  });

  useEffect(() => {
    try {
      localStorage.setItem('mbc_dailyTasks', JSON.stringify(dailyTasks));
    } catch (e) {
      console.error("Error saving dailyTasks to localStorage:", e);
    }
  }, [dailyTasks]);

  const [goals, setGoals] = useState<Goal[]>(() => {
    try {
      const saved = localStorage.getItem('mbc_goals');
      if (saved && saved !== 'undefined') {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch (e) {
      console.error("Failed to parse mbc_goals", e);
    }
    return [
      { 
        id: 'g-1', 
        title: 'Dominar Desenvolvimento Full Stack', 
        actionsDone: 4, 
        actionsTotal: 10, 
        completed: false, 
        xpReward: 100,
        area: 'Carreira',
        createdAt: '2026-07-01',
        deadline: '2026-12-31',
        notes: [
          { id: 'n-g1-1', date: '2026-07-02', text: 'Instalei o Node.js e iniciei estudos do Express.' },
          { id: 'n-g1-2', date: '2026-07-05', text: 'Configurei banco de dados básico e as primeiras rotas.' }
        ]
      },
      { 
        id: 'g-2', 
        title: 'Ler 12 livros de alta performance este ano', 
        actionsDone: 3, 
        actionsTotal: 12, 
        completed: false, 
        xpReward: 100,
        area: 'Hobbies',
        createdAt: '2026-07-02',
        deadline: '2026-12-31',
        notes: [
          { id: 'n-g2-1', date: '2026-07-04', text: 'Terminei a leitura do livro "Hábitos Atômicos" de James Clear.' }
        ]
      },
      { 
        id: 'g-3', 
        title: 'Faturar R$ 5.000 com freelas extras', 
        actionsDone: 3, 
        actionsTotal: 5, 
        completed: false, 
        xpReward: 100,
        area: 'Financeiro',
        createdAt: '2026-07-03',
        deadline: '2026-09-30',
        notes: [
          { id: 'n-g3-1', date: '2026-07-06', text: 'Fechei o primeiro contrato de freela de landing page!' }
        ]
      },
      { 
        id: 'g-4', 
        title: 'Desafio Físico de 30 Dias Ininterruptos', 
        actionsDone: 30, 
        actionsTotal: 30, 
        completed: true, 
        xpReward: 100,
        area: 'Físico',
        createdAt: '2026-06-12',
        completedAt: '2026-07-12',
        notes: [
          { id: 'n-g4-1', date: '2026-06-15', text: 'Primeiros 3 dias de cardio concluídos sem falhar.' },
          { id: 'n-g4-2', date: '2026-07-12', text: 'Desafio completo! 30 dias ininterruptos de treino extremo.' }
        ]
      }
    ];
  });

  const [timelines, setTimelines] = useState<TimelineGoal[]>(() => {
    try {
      const saved = localStorage.getItem('mbc_timelines');
      if (saved && saved !== 'undefined') {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) return parsed;
      }
    } catch (e) {
      console.error("Failed to parse mbc_timelines", e);
    }
    return [
      {
        id: 't-1',
        objective: 'Falar Inglês Fluente',
        createdAt: '2026-07-16',
        actions: [
          { id: 'ta-1', text: 'Usar Duolingo (30 min) todos os dias', completed: false, horizon: '1_day' },
          { id: 'ta-2', text: 'Assistir a 1 vídeo no YouTube em inglês', completed: false, horizon: '1_week' },
          { id: 'ta-3', text: 'Ler 1 artigo curto por semana', completed: false, horizon: '1_week' },
          { id: 'ta-4', text: 'Completar 4 semanas sem desanimar', completed: false, horizon: '1_month' },
          { id: 'ta-5', text: 'Fazer 1 conversação experimental de 30 min', completed: false, horizon: '1_month' },
          { id: 'ta-6', text: 'Fazer um curso intensivo de conversação', completed: false, horizon: '1_year' },
          { id: 'ta-7', text: 'Alcançar nível intermediário/avançado', completed: false, horizon: '3_years' },
          { id: 'ta-8', text: 'Falar inglês fluentemente em reuniões de trabalho', completed: false, horizon: '10_years' }
        ]
      },
      {
        id: 't-2',
        objective: 'Maratonista (Correr 42k)',
        createdAt: '2026-07-16',
        actions: [
          { id: 'ta-9', text: 'Caminhar/Correr leve por 20 minutos', completed: false, horizon: '1_day' },
          { id: 'ta-10', text: 'Correr 10k sem parar no final de semana', completed: false, horizon: '1_week' },
          { id: 'ta-11', text: 'Treinar 4 vezes na semana consistentemente', completed: false, horizon: '1_month' },
          { id: 'ta-12', text: 'Correr a primeira Meia Maratona (21k)', completed: false, horizon: '1_year' },
          { id: 'ta-13', text: 'Estabilizar ritmo e treinos de longa distância', completed: false, horizon: '3_years' },
          { id: 'ta-14', text: 'Concluir uma Maratona oficial (42k)', completed: false, horizon: '10_years' }
        ]
      }
    ];
  });

  const [finances, setFinances] = useState<FinanceEntry[]>(() => {
    try {
      const saved = localStorage.getItem('mbc_finances');
      if (saved && saved !== 'undefined') {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch (e) {
      console.error("Failed to parse mbc_finances", e);
    }
    return [
      { id: 'f-1', type: 'income', amount: 4500.00, category: 'Salário', description: 'Salário Tech Dev', date: getTodayDateStr() },
      { id: 'f-2', type: 'income', amount: 1200.00, category: 'Freelance', description: 'Criação de Landing Page', date: getTodayDateStr() },
      { id: 'f-3', type: 'expense', amount: 1800.00, category: 'Moradia', description: 'Aluguel & Condomínio', date: getTodayDateStr() },
      { id: 'f-4', type: 'expense', amount: 350.00, category: 'Alimentação', description: 'Supermercado Semanal', date: getTodayDateStr() },
      { id: 'f-5', type: 'expense', amount: 29.90, category: 'Assinaturas', description: 'MBCplanner Premium', date: getTodayDateStr() },
      { id: 'f-6', type: 'expense', amount: 119.00, category: 'Lazer', description: 'Mensalidade Academia', date: getTodayDateStr() }
    ];
  });

  const [routine, setRoutine] = useState<RoutineItem[]>(() => {
    try {
      const saved = localStorage.getItem('mbc_routine');
      if (saved && saved !== 'undefined') {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) return cleanupExpiredRoutineItems(parsed).cleaned;
      }
    } catch (e) {
      console.error("Failed to parse mbc_routine", e);
    }
    return [
      // Segunda-feira (1)
      { id: 'rt-1', dayOfWeek: 1, time: '07:00', task: 'Acordar, luz solar e copo d\'água', completed: true },
      { id: 'rt-2', dayOfWeek: 1, time: '07:30', task: 'Leitura matinal (15 min)', completed: true },
      { id: 'rt-3', dayOfWeek: 1, time: '08:00', task: 'Planejamento diário MBC', completed: true },
      { id: 'rt-4', dayOfWeek: 1, time: '09:00', task: 'Deep Work - Foco inabalável', completed: false },
      { id: 'rt-5', dayOfWeek: 1, time: '14:00', task: 'Estudos / Cursos online', completed: false },
      { id: 'rt-6', dayOfWeek: 1, time: '18:00', task: 'Treino de Força / Academia', completed: false },

      // Terça-feira (2)
      { id: 'rt-7', dayOfWeek: 2, time: '07:00', task: 'Acordar, luz solar e hidratação', completed: false },
      { id: 'rt-8', dayOfWeek: 2, time: '07:30', task: 'Meditação transcendental', completed: false },
      { id: 'rt-9', dayOfWeek: 2, time: '09:00', task: 'Deep Work - Projetos Principais', completed: false },
      { id: 'rt-10', dayOfWeek: 2, time: '18:00', task: 'Corrida ao ar livre', completed: false },

      // Quarta-feira (3)
      { id: 'rt-11', dayOfWeek: 3, time: '07:00', task: 'Acordar e café da manhã leve', completed: false },
      { id: 'rt-12', dayOfWeek: 3, time: '07:30', task: 'Escrita livre / Diário matinal', completed: false },
      { id: 'rt-13', dayOfWeek: 3, time: '09:00', task: 'Reuniões de Alinhamento e Foco', completed: false },
      { id: 'rt-14', dayOfWeek: 3, time: '18:00', task: 'Treino de Força / Academia', completed: false },

      // Quinta-feira (4)
      { id: 'rt-15', dayOfWeek: 4, time: '07:00', task: 'Acordar e Alongamento leve', completed: false },
      { id: 'rt-16', dayOfWeek: 4, time: '07:30', task: 'Revisão de anotações e metas', completed: false },
      { id: 'rt-17', dayOfWeek: 4, time: '09:00', task: 'Deep Work - Escrita e código', completed: false },
      { id: 'rt-18', dayOfWeek: 4, time: '18:00', task: 'Cardio de alta intensidade', completed: false },

      // Sexta-feira (5)
      { id: 'rt-19', dayOfWeek: 5, time: '07:00', task: 'Acordar, luz solar e copo d\'água', completed: true },
      { id: 'rt-20', dayOfWeek: 5, time: '07:30', task: 'Visualização de objetivos', completed: true },
      { id: 'rt-21', dayOfWeek: 5, time: '09:00', task: 'Deep Work - Finalizar tarefas semanais', completed: false },
      { id: 'rt-22', dayOfWeek: 5, time: '15:00', task: 'Organização do Segundo Cérebro', completed: false },
      { id: 'rt-23', dayOfWeek: 5, time: '18:00', task: 'Treino de Força / Academia', completed: false },

      // Sábado (6)
      { id: 'rt-24', dayOfWeek: 6, time: '08:00', task: 'Acordar sem pressa', completed: false },
      { id: 'rt-25', dayOfWeek: 6, time: '09:00', task: 'Café da manhã especial', completed: false },
      { id: 'rt-26', dayOfWeek: 6, time: '10:00', task: 'Atividades de lazer e natureza', completed: false },
      { id: 'rt-27', dayOfWeek: 6, time: '16:00', task: 'Estudo pessoal livre', completed: false },

      // Domingo (0)
      { id: 'rt-28', dayOfWeek: 0, time: '08:30', task: 'Acordar e meditação', completed: false },
      { id: 'rt-29', dayOfWeek: 0, time: '10:00', task: 'Revisão Semanal MBCplanner', completed: false },
      { id: 'rt-30', dayOfWeek: 0, time: '16:00', task: 'Preparar marmitas e rotinas da semana', completed: false },
      { id: 'rt-31', dayOfWeek: 0, time: '21:00', task: 'Higiene do sono', completed: false }
    ];
  });

  const [calendarNotes, setCalendarNotes] = useState<CalendarNote[]>(() => {
    try {
      const saved = localStorage.getItem('mbc_calendarNotes');
      if (saved && saved !== 'undefined') {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch (e) {
      console.error("Failed to parse mbc_calendarNotes", e);
    }
    return [
      { 
        id: 'cn-1', 
        date: getTodayDateStr(), 
        title: 'Check-in Geral MBCplanner', 
        content: 'Fazer check in geral e revisar as notas das metas de vida.' 
      },
      { 
        id: 'cn-2', 
        date: (() => {
          const d = new Date();
          d.setDate(d.getDate() - 2);
          return d.toISOString().split('T')[0];
        })(), 
        title: 'Revisão de Finanças Mensais', 
        content: 'Analisar as contas do início do mês, planejar investimentos e aportes na corretora.' 
      },
      { 
        id: 'cn-3', 
        date: (() => {
          const d = new Date();
          d.setDate(d.getDate() - 4);
          return d.toISOString().split('T')[0];
        })(), 
        title: 'Início do Protocolo de Foco', 
        content: 'Primeiro dia de restrição total de dopamina barata e foco máximo no trabalho.' 
      },
      { 
        id: 'cn-4', 
        date: (() => {
          const d = new Date();
          d.setDate(d.getDate() + 1);
          return d.toISOString().split('T')[0];
        })(), 
        title: 'Estudo de Arquitetura Limpa', 
        content: 'Estudar os padrões de projeto de Software Architecture e implementar nas APIs.' 
      }
    ];
  });

  const [monthlyReviews, setMonthlyReviews] = useState<MonthlyReview[]>(() => {
    try {
      const saved = localStorage.getItem('mbc_monthlyReviews');
      if (saved && saved !== 'undefined') {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) return parsed;
      }
    } catch (e) {
      console.error("Failed to parse mbc_monthlyReviews", e);
    }
    return [
      {
        id: 'mr-1',
        year: 2026,
        month: 6, // Julho (indexing is 0-11, so 6 is July)
        oneSentence: 'Um mês focado em construir as bases do meu novo projeto e melhorar a rotina.',
        memorableMoments: [
          'Consegui completar os 30 dias de desafio físico ininterrupto.',
          'Fechei o primeiro contrato de freela para criar a landing page.'
        ],
        learnings: [
          'A consistência supera a intensidade no longo prazo.',
          'Configurar rotas de backend com Node.js e Express não é tão complexo se planejado.'
        ],
        improvements: [
          'Melhorar o horário de acordar aos fins de semana.',
          'Manter a planilha de finanças sempre atualizada no dia do gasto.'
        ]
      }
    ];
  });

  const [weeklyReviews, setWeeklyReviews] = useState<WeeklyReview[]>(() => {
    try {
      const saved = localStorage.getItem('mbc_weeklyReviews');
      if (saved && saved !== 'undefined') {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) return parsed;
      }
    } catch (e) {
      console.error("Failed to parse mbc_weeklyReviews", e);
    }
    return [
      {
        id: 'wr-2026-28',
        year: 2026,
        weekNumber: 28,
        oneSentence: 'Uma semana de grandes vitórias no desenvolvimento do app e consistência nos treinos.',
        memorableMoments: [
          'Integração bem-sucedida do banco de dados Firestore no MBCplanner.',
          'Consegui treinar 5 vezes na semana, mantendo a dieta alinhada.'
        ],
        learnings: [
          'Descanso adequado no meio da semana é fundamental para manter a produtividade alta na sexta.',
          'Técnica Pomodoro funciona muito bem para sessões de Deep Work.'
        ],
        improvements: [
          'Reduzir o tempo de tela após as 22h para melhorar o sono.',
          'Organizar as finanças logo na segunda-feira pela manhã.'
        ]
      }
    ];
  });

  useEffect(() => {
    localStorage.setItem('mbc_weeklyReviews', JSON.stringify(weeklyReviews));
  }, [weeklyReviews]);

  const [books, setBooks] = useState<YearlyBook[]>(() => {
    try {
      const saved = localStorage.getItem('mbc_yearly_books');
      if (saved && saved !== 'undefined') {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch (e) {
      console.error("Failed to parse mbc_yearly_books", e);
    }
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

  useEffect(() => {
    localStorage.setItem('mbc_yearly_books', JSON.stringify(books));
  }, [books]);

  const [futureEvents, setFutureEvents] = useState<FutureEvent[]>(() => {
    try {
      const saved = localStorage.getItem('mbc_futureEvents');
      if (saved && saved !== 'undefined') {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) return parsed;
      }
    } catch (e) {
      console.error("Failed to parse mbc_futureEvents", e);
    }
    return [
      { id: 'fe-1', name: 'Viagem de Férias (Gramado)', date: '2026-08-15', tags: ['Viagem'] },
      { id: 'fe-2', name: 'Exame de Certificação Cloud', date: '2026-09-10', tags: ['Estudos'] },
      { id: 'fe-3', name: 'Casamento Lucas & Mari', date: '2026-10-24', tags: ['Família'] },
    ];
  });

  useEffect(() => {
    localStorage.setItem('mbc_futureEvents', JSON.stringify(futureEvents));
  }, [futureEvents]);

  const [habits, setHabits] = useState<Habit[]>(() => {
    try {
      const saved = localStorage.getItem('mbc_habits');
      if (saved && saved !== 'undefined') {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) return parsed;
      }
    } catch (e) {
      console.error("Failed to parse mbc_habits", e);
    }
    return [
      {
        id: 'hab-1',
        name: 'Caminhada matinal',
        type: 'good',
        category: 'Saúde',
        frequency: '3x na semana',
        history: { '2026-07-11': true, '2026-07-12': true, '2026-07-14': true },
        createdAt: '2026-07-01'
      },
      {
        id: 'hab-2',
        name: 'Academia',
        type: 'good',
        category: 'Exercício',
        frequency: 'Personalizado',
        history: { '2026-07-14': true },
        createdAt: '2026-07-01'
      },
      {
        id: 'hab-3',
        name: 'Resolver palavra cruzada',
        type: 'good',
        category: 'Estudo',
        frequency: 'Diário',
        history: { '2026-07-11': true, '2026-07-12': true, '2026-07-13': true, '2026-07-14': true, '2026-07-15': true },
        createdAt: '2026-07-01'
      },
      {
        id: 'hab-4',
        name: 'Comer doce após o almoço',
        type: 'bad',
        category: 'Saúde',
        frequency: 'Diário',
        history: { '2026-07-11': true, '2026-07-13': true },
        createdAt: '2026-07-01'
      },
      {
        id: 'hab-5',
        name: 'Dormir tarde',
        type: 'bad',
        category: 'Saúde',
        frequency: 'Diário',
        history: { '2026-07-12': true, '2026-07-14': true, '2026-07-15': true, '2026-07-16': true },
        createdAt: '2026-07-01'
      }
    ];
  });

  useEffect(() => {
    localStorage.setItem('mbc_habits', JSON.stringify(habits));
  }, [habits]);

  const [documents, setDocuments] = useState<ArchivedDocument[]>(() => {
    try {
      const saved = localStorage.getItem('mbc_documents');
      if (saved && saved !== 'undefined') {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch (e) {
      console.error("Failed to parse mbc_documents", e);
    }
    return [
      { id: 'doc-1', name: 'contrato_freelance_desenvolvimento.pdf', category: 'Contratos', date: '2026-07-09', size: '1.2 MB' },
      { id: 'doc-2', name: 'comprovante_aluguel_julho.pdf', category: 'Financeiro', date: '2026-07-05', size: '340 KB' },
      { id: 'doc-3', name: 'plano_de_estudos_segundo_cerebro.pdf', category: 'Estudos', date: '2026-07-01', size: '2.1 MB' },
      { id: 'doc-4', name: 'certidao_quitacao_eleitoral.pdf', category: 'Pessoal', date: '2026-06-15', size: '150 KB' }
    ];
  });

  const [notes, setNotes] = useState<Note[]>(() => {
    try {
      const saved = localStorage.getItem('mbc_notes');
      if (saved && saved !== 'undefined') {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch (e) {
      console.error("Failed to parse mbc_notes", e);
    }
    return [
      { 
        id: 'n-1', 
        title: 'Metas MBCplanner 2026', 
        content: 'Organização geral das metas do ano:\n1. Disciplina inabalável com Alfredo.\n2. Evitar os gatilhos do Beto.\n3. Registro diário financeiro.', 
        tags: ['Metas', 'MBC'], 
        updatedAt: '10/07/2026' 
      },
      { 
        id: 'n-2', 
        title: 'Estudo de Finanças Pessoais', 
        content: 'Anotações do livro "Pai Rico Pai Pobre" e estratégias de aportes mensais:\n- Pagar-se primeiro (guardar 20%).\n- Ativos vs Passivos.', 
        tags: ['Estudos', 'Financeiro'], 
        updatedAt: '09/07/2026' 
      },
      { 
        id: 'n-3', 
        title: 'Protocolo de Alta Performance', 
        content: 'Regras de ouro:\n- Sem celular na primeira hora do dia.\n- Banho frio matinal para foco imediato.\n- Bloqueio total de redes sociais de 09:00 às 17:00.\n- Revisão diária à noite com reflexão Alfredo vs Beto.', 
        tags: ['Rotina', 'Foco'], 
        updatedAt: '08/07/2026' 
      }
    ];
  });

  const [areaImages, setAreaImages] = useState<Record<string, string>>(() => {
    try {
      const saved = localStorage.getItem('mbc_area_images_v2');
      if (saved) {
        return JSON.parse(saved);
      }
    } catch (e) {
      console.error("Failed to parse area images", e);
    }
    return defaultAreaImages;
  });

  useEffect(() => {
    localStorage.setItem('mbc_area_images_v2', JSON.stringify(areaImages));
  }, [areaImages]);

  const defaultCustomCards = [
    { id: 'card-1', emoji: '☠️', title: 'PODER', imageUrl: 'https://images.unsplash.com/photo-1509198397868-475647b2a1e5?q=80&w=600&auto=format&fit=crop' },
    { id: 'card-2', emoji: '💪', title: 'FORCE', imageUrl: 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?q=80&w=600&auto=format&fit=crop' },
    { id: 'card-3', emoji: '⛰️', title: 'DISCIPLINE', imageUrl: 'https://images.unsplash.com/photo-1517838277536-f5f99be501cd?q=80&w=600&auto=format&fit=crop' },
    { id: 'card-4', emoji: '🧠', title: 'STRATEGY', imageUrl: 'https://images.unsplash.com/photo-1529699211952-734e80c4d42b?q=80&w=600&auto=format&fit=crop' },
    { id: 'card-5', emoji: '🕊️', title: 'PEACE', imageUrl: 'https://images.unsplash.com/photo-1506126613408-eca07ce68773?q=80&w=600&auto=format&fit=crop' },
    { id: 'card-6', emoji: '🤑', title: 'Prosperidade', imageUrl: 'https://images.unsplash.com/photo-1618042164219-62c820f10723?q=80&w=600&auto=format&fit=crop' }
  ];

  const [customCards, setCustomCards] = useState<any[]>(() => {
    try {
      const saved = localStorage.getItem('dashboard_custom_cards');
      if (saved) {
        return JSON.parse(saved);
      }
    } catch (e) {
      console.error("Failed to parse custom cards", e);
    }
    return defaultCustomCards;
  });

  useEffect(() => {
    localStorage.setItem('dashboard_custom_cards', JSON.stringify(customCards));
  }, [customCards]);

  const [lifeSummary, setLifeSummary] = useState<LifeSummaryState>(() => {
    try {
      const saved = localStorage.getItem('mbc_life_summary_v1');
      if (saved) {
        return mergeWithDefaults(JSON.parse(saved));
      }
    } catch (e) {
      console.error("Failed to parse life summary state", e);
    }
    return mergeWithDefaults(defaultState);
  });

  useEffect(() => {
    localStorage.setItem('mbc_life_summary_v1', JSON.stringify(lifeSummary));
  }, [lifeSummary]);

  const [gridRoutine, setGridRoutine] = useState<Record<string, { text: string; color?: string; startTime?: string; endTime?: string }>>(() => {
    try {
      const saved = localStorage.getItem('mbc_grid_routine');
      if (saved) return cleanupExpiredGridRoutine(JSON.parse(saved)).cleaned;
    } catch (e) {
      console.error("Failed to parse mbc_grid_routine", e);
    }
    const defaultGridRoutine: Record<string, { text: string; color?: string; startTime?: string; endTime?: string }> = {};
    for (let d = 1; d <= 5; d++) {
      defaultGridRoutine[`07:00-${d}`] = { text: 'Acordar+Café', color: 'teal', startTime: '07:00', endTime: '08:00' };
      defaultGridRoutine[`08:00-${d}`] = { text: 'Deslocamento+Ler', color: 'red', startTime: '08:00', endTime: '09:00' };
      defaultGridRoutine[`09:00-${d}`] = { text: 'Trabalho', color: 'plum', startTime: '09:00', endTime: '12:00' };
      defaultGridRoutine[`12:00-${d}`] = { text: 'Almoço', color: 'brown', startTime: '12:00', endTime: '13:00' };
      defaultGridRoutine[`13:00-${d}`] = { text: 'Trabalho', color: 'plum', startTime: '13:00', endTime: '18:00' };
      defaultGridRoutine[`18:00-${d}`] = { text: 'Exercício', color: 'orange', startTime: '18:00', endTime: '19:00' };
      defaultGridRoutine[`19:00-${d}`] = { text: 'Deslocamento+Ler', color: 'red', startTime: '19:00', endTime: '20:00' };
      defaultGridRoutine[`20:00-${d}`] = { text: 'Freelance', color: 'gray', startTime: '20:00', endTime: '21:00' };
      defaultGridRoutine[`21:00-${d}`] = { text: 'Diário', color: 'blue', startTime: '21:00', endTime: '22:00' };
      defaultGridRoutine[`22:00-${d}`] = { text: 'Desligar telas', color: 'gray', startTime: '22:00', endTime: '23:00' };
      defaultGridRoutine[`23:00-${d}`] = { text: 'Dormir', color: 'gray', startTime: '23:00', endTime: '24:00' };
    }
    return defaultGridRoutine;
  });

  useEffect(() => {
    localStorage.setItem('mbc_grid_routine', JSON.stringify(gridRoutine));
  }, [gridRoutine]);

  // --- Synchronized Cloud States ---
  const [lastDailyResetDate, setLastDailyResetDate] = useState<string>(() => {
    return localStorage.getItem('last_daily_reset_date') || '';
  });
  useEffect(() => {
    localStorage.setItem('last_daily_reset_date', lastDailyResetDate);
  }, [lastDailyResetDate]);

  // Automatically remove non-recurring routine blocks whose week has ended
  useEffect(() => {
    const resGrid = cleanupExpiredGridRoutine(gridRoutine);
    if (resGrid.removedCount > 0) {
      setGridRoutine(resGrid.cleaned);
    }
    const resRoutine = cleanupExpiredRoutineItems(routine);
    if (resRoutine.removedCount > 0) {
      setRoutine(resRoutine.cleaned);
    }
  }, [lastDailyResetDate]);

  const [bankAccounts, setBankAccounts] = useState<BankAccount[]>(() => {
    try {
      const saved = localStorage.getItem('mbc_bank_accounts');
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.error("Failed to parse mbc_bank_accounts", e);
    }
    return [
      { id: 'acc-1', name: 'Conta Corrente Itaú', bank: 'Itaú Unibanco', type: 'Conta Corrente', balance: 14250.80, color: '#ec4899', iconBg: 'bg-pink-500/10' },
      { id: 'acc-2', name: 'Reserva Nubank', bank: 'Nu Pagamentos', type: 'Conta de Rendimento', balance: 32400.00, color: '#8b5cf6', iconBg: 'bg-purple-500/10' },
      { id: 'acc-3', name: 'Conta Internacional Nomad', bank: 'Nomad Global', type: 'Dólar / Investimentos', balance: 5120.50, color: '#3b82f6', iconBg: 'bg-blue-500/10' },
      { id: 'acc-4', name: 'Carteira Mercado Pago', bank: 'Mercado Pago', type: 'Carteira Digital', balance: 1850.30, color: '#06b6d4', iconBg: 'bg-cyan-500/10' }
    ];
  });
  useEffect(() => {
    localStorage.setItem('mbc_bank_accounts', JSON.stringify(bankAccounts));
  }, [bankAccounts]);

  const [creditCards, setCreditCards] = useState<CreditCardItem[]>(() => {
    try {
      const saved = localStorage.getItem('mbc_credit_cards');
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.error("Failed to parse mbc_credit_cards", e);
    }
    return [
      { id: 'card-1', name: 'Itaú Personnalité Visa Infinite', bank: 'Itaú Unibanco', last4: '8842', brand: 'Visa', usedLimit: 4850.20, totalLimit: 35000.00, closingDay: 28, dueDay: 5, color: '#ec4899' },
      { id: 'card-2', name: 'Nubank Ultravioleta', bank: 'Nubank', last4: '4192', brand: 'Mastercard', usedLimit: 2150.90, totalLimit: 20000.00, closingDay: 15, dueDay: 22, color: '#8b5cf6' },
      { id: 'card-3', name: 'Inter Black Mastercard', bank: 'Banco Inter', last4: '1234', brand: 'Mastercard', usedLimit: 1200.00, totalLimit: 15000.00, closingDay: 5, dueDay: 12, color: '#d97706' }
    ];
  });
  useEffect(() => {
    localStorage.setItem('mbc_credit_cards', JSON.stringify(creditCards));
  }, [creditCards]);

  const [debtItems, setDebtItems] = useState<DebtItem[]>(() => {
    try {
      const saved = localStorage.getItem('mbc_debt_items');
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.error("Failed to parse mbc_debt_items", e);
    }
    return [
      { id: 'debt-1', name: 'Financiamento Imobiliário', creditor: 'Caixa Econômica Federal', totalAmount: 185000, remainingAmount: 142000, monthlyPayment: 1850, interestRate: 0.75, dueDate: '2026-08-10', category: 'Imóvel', notes: 'Taxa TR + 8.5% a.a. Amortização SAC.' },
      { id: 'debt-2', name: 'Consórcio Automotivo', creditor: 'Porto Seguro', totalAmount: 45000, remainingAmount: 18200, monthlyPayment: 920, interestRate: 0.15, dueDate: '2026-08-15', category: 'Veículo', notes: 'Faltam 20 parcelas de 80.' },
      { id: 'debt-3', name: 'Empréstimo Pessoal', creditor: 'Banco Itaú', totalAmount: 15000, remainingAmount: 4800, monthlyPayment: 680, interestRate: 1.85, dueDate: '2026-08-20', category: 'Empréstimo', notes: 'Taxa pré-fixada. Quitar com amortização antecipada.' }
    ];
  });
  useEffect(() => {
    localStorage.setItem('mbc_debt_items', JSON.stringify(debtItems));
  }, [debtItems]);

  const [budgetLimits, setBudgetLimits] = useState<BudgetLimit[]>(() => {
    try {
      const savedNew = localStorage.getItem('mbc_budget_limits_v2');
      if (savedNew) return JSON.parse(savedNew);
    } catch (e) {
      console.error("Failed to parse mbc_budget_limits_v2", e);
    }
    return [
      { id: 'b-1', category: 'Moradia', amount: 3500, startYear: 2026, startMonth: 0, isRecurring: true, recurringType: 'always' },
      { id: 'b-2', category: 'Alimentação', amount: 2200, startYear: 2026, startMonth: 0, isRecurring: true, recurringType: 'always' },
      { id: 'b-3', category: 'Transporte', amount: 1200, startYear: 2026, startMonth: 0, isRecurring: true, recurringType: 'always' },
      { id: 'b-4', category: 'Lazer & Estilo de Vida', amount: 1500, startYear: 2026, startMonth: 0, isRecurring: true, recurringType: 'always' },
      { id: 'b-5', category: 'Saúde & Bem-estar', amount: 800, startYear: 2026, startMonth: 0, isRecurring: true, recurringType: 'always' },
      { id: 'b-6', category: 'Outros', amount: 500, startYear: 2026, startMonth: 0, isRecurring: true, recurringType: 'always' }
    ];
  });
  useEffect(() => {
    localStorage.setItem('mbc_budget_limits_v2', JSON.stringify(budgetLimits));
  }, [budgetLimits]);

  const [portfolioAssets, setPortfolioAssets] = useState<PortfolioAsset[]>(() => {
    try {
      const saved = localStorage.getItem('meu_foco_portfolio_assets');
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.error("Failed to parse meu_foco_portfolio_assets", e);
    }
    return [];
  });
  useEffect(() => {
    localStorage.setItem('meu_foco_portfolio_assets', JSON.stringify(portfolioAssets));
  }, [portfolioAssets]);

  const [investmentTransactions, setInvestmentTransactions] = useState<InvestmentTransaction[]>(() => {
    try {
      const saved = localStorage.getItem('meu_foco_investment_transactions');
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.error("Failed to parse meu_foco_investment_transactions", e);
    }
    return [
      { id: 'it-1', date: '2026-01-10', type: 'deposit', assetTicker: 'CDB', amount: 5000, totalValue: 5000, notes: 'Aporte inicial Tesouro/CDB' },
      { id: 'it-2', date: '2026-02-05', type: 'deposit', assetTicker: 'IVVB11', amount: 3000, totalValue: 3000, notes: 'Aporte mensal S&P 500' },
      { id: 'it-3', date: '2026-03-12', type: 'yield', assetTicker: 'HGLG11', amount: 180, totalValue: 180, notes: 'Dividendos recebidos FIIs' }
    ];
  });
  useEffect(() => {
    localStorage.setItem('meu_foco_investment_transactions', JSON.stringify(investmentTransactions));
  }, [investmentTransactions]);

  const [visionBoardCards, setVisionBoardCards] = useState<VisionBoardCard[]>(() => {
    try {
      const saved = localStorage.getItem('mbc_vision_board_cards_v1');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch (e) {
      console.error("Failed to parse mbc_vision_board_cards_v1", e);
    }
    return DEFAULT_VISION_BOARD_CARDS;
  });
  useEffect(() => {
    localStorage.setItem('mbc_vision_board_cards_v1', JSON.stringify(visionBoardCards));
  }, [visionBoardCards]);

  // Additional cloud-synchronized states
  const [cardsPerRow, setCardsPerRow] = useState<number>(() => {
    const saved = localStorage.getItem('mbc_vb_cards_per_row_v1');
    return saved ? parseInt(saved, 10) : 3;
  });
  useEffect(() => {
    localStorage.setItem('mbc_vb_cards_per_row_v1', cardsPerRow.toString());
  }, [cardsPerRow]);

  const [sheetOverrides, setSheetOverrides] = useState<Record<string, { planned: number; actual: number }>>(() => {
    try {
      const saved = localStorage.getItem('mbc_sheet_overrides');
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.error("Failed to parse mbc_sheet_overrides", e);
    }
    return {};
  });
  useEffect(() => {
    localStorage.setItem('mbc_sheet_overrides', JSON.stringify(sheetOverrides));
  }, [sheetOverrides]);

  const [financesMainSubtab, setFinancesMainSubtab] = useState<'dashboard' | 'entries' | 'budget' | 'planning' | 'investments' | 'sheets'>(() => {
    const saved = localStorage.getItem('finances_main_subtab');
    if (saved === 'dashboard' || saved === 'entries' || saved === 'budget' || saved === 'planning' || saved === 'investments' || saved === 'sheets') return saved;
    return 'dashboard';
  });
  useEffect(() => {
    localStorage.setItem('finances_main_subtab', financesMainSubtab);
  }, [financesMainSubtab]);

  const [isFinancesBudgetOpen, setIsFinancesBudgetOpen] = useState<boolean>(() => {
    return localStorage.getItem('finances_budget_open') === 'true';
  });
  useEffect(() => {
    localStorage.setItem('finances_budget_open', String(isFinancesBudgetOpen));
  }, [isFinancesBudgetOpen]);

  const [isFinancesEntriesOpen, setIsFinancesEntriesOpen] = useState<boolean>(() => {
    return localStorage.getItem('finances_entries_open') === 'true';
  });
  useEffect(() => {
    localStorage.setItem('finances_entries_open', String(isFinancesEntriesOpen));
  }, [isFinancesEntriesOpen]);

  const [yearlyImages, setYearlyImages] = useState<Record<number, string>>(() => {
    try {
      const saved = localStorage.getItem('mbc_yearly_images');
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.error("Failed to parse mbc_yearly_images", e);
    }
    return {};
  });
  useEffect(() => {
    localStorage.setItem('mbc_yearly_images', JSON.stringify(yearlyImages));
  }, [yearlyImages]);

  const [overviewYears, setOverviewYears] = useState<number[]>(() => {
    try {
      const saved = localStorage.getItem('mbc_overview_years');
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.error("Failed to parse mbc_overview_years", e);
    }
    return [2026, 2027, 2028, 2029, 2030];
  });
  useEffect(() => {
    localStorage.setItem('mbc_overview_years', JSON.stringify(overviewYears));
  }, [overviewYears]);

  const [isMonthlyReviewOpen, setIsMonthlyReviewOpen] = useState<boolean>(() => {
    return localStorage.getItem('mbc_is_monthly_review_open') === 'true';
  });
  useEffect(() => {
    localStorage.setItem('mbc_is_monthly_review_open', String(isMonthlyReviewOpen));
  }, [isMonthlyReviewOpen]);

  const [isWeeklyReviewsOpen, setIsWeeklyReviewsOpen] = useState<boolean>(() => {
    return localStorage.getItem('mbc_is_weekly_reviews_open') === 'true';
  });
  useEffect(() => {
    localStorage.setItem('mbc_is_weekly_reviews_open', String(isWeeklyReviewsOpen));
  }, [isWeeklyReviewsOpen]);

  const [userBio, setUserBio] = useState<string>(() => {
    return localStorage.getItem('mbc_userBio') || 'Construindo um império de disciplina diária. Foco na jornada e maestria contínua.';
  });
  useEffect(() => {
    localStorage.setItem('mbc_userBio', userBio);
  }, [userBio]);

  const [userArchetype, setUserArchetype] = useState<string>(() => {
    return localStorage.getItem('mbc_userArchetype') || 'Estrategista & Construtor';
  });
  useEffect(() => {
    localStorage.setItem('mbc_userArchetype', userArchetype);
  }, [userArchetype]);

  const [focusTrainingDate, setFocusTrainingDate] = useState<string>(() => {
    return localStorage.getItem('mbc_focus_training_date') || new Date().toISOString().split('T')[0];
  });
  useEffect(() => {
    localStorage.setItem('mbc_focus_training_date', focusTrainingDate);
  }, [focusTrainingDate]);

  const [dashboardChecklistOpen, setDashboardChecklistOpen] = useState<boolean>(() => {
    return localStorage.getItem('dashboard_checklist_open') !== 'false';
  });
  useEffect(() => {
    localStorage.setItem('dashboard_checklist_open', String(dashboardChecklistOpen));
  }, [dashboardChecklistOpen]);

  const [dashboardHabitsOpen, setDashboardHabitsOpen] = useState<boolean>(() => {
    return localStorage.getItem('dashboard_habits_open') !== 'false';
  });
  useEffect(() => {
    localStorage.setItem('dashboard_habits_open', String(dashboardHabitsOpen));
  }, [dashboardHabitsOpen]);

  const [dashboardGoalsOpen, setDashboardGoalsOpen] = useState<boolean>(() => {
    return localStorage.getItem('dashboard_goals_open') !== 'false';
  });
  useEffect(() => {
    localStorage.setItem('dashboard_goals_open', String(dashboardGoalsOpen));
  }, [dashboardGoalsOpen]);

  const [dashboardFinancesOpen, setDashboardFinancesOpen] = useState<boolean>(() => {
    return localStorage.getItem('dashboard_finances_open') !== 'false';
  });
  useEffect(() => {
    localStorage.setItem('dashboard_finances_open', String(dashboardFinancesOpen));
  }, [dashboardFinancesOpen]);

  const [reminderInitialMode, setReminderInitialMode] = useState<'timer' | 'cronometer' | 'pomodoro'>(() => {
    const saved = localStorage.getItem('mbc_reminder_initial_mode');
    if (saved === 'cronometer' || saved === 'timer' || saved === 'pomodoro') return saved;
    return 'timer';
  });
  useEffect(() => {
    localStorage.setItem('mbc_reminder_initial_mode', reminderInitialMode);
  }, [reminderInitialMode]);

  const [language, setLanguage] = useState<string>(() => {
    return localStorage.getItem('mbc_language') || 'pt';
  });
  useEffect(() => {
    localStorage.setItem('mbc_language', language);
  }, [language]);

  const [backgroundNotificationsEnabled, setBackgroundNotificationsEnabled] = useState<boolean>(() => {
    return localStorage.getItem('mbc_background_notifications_enabled') !== 'false';
  });
  useEffect(() => {
    localStorage.setItem('mbc_background_notifications_enabled', String(backgroundNotificationsEnabled));
  }, [backgroundNotificationsEnabled]);

  const [isOnline, setIsOnline] = useState<boolean>(typeof navigator !== 'undefined' ? navigator.onLine : true);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // --- Supabase Cloud & Multi-Device Synchronization Logic ---
  const [syncKey, setSyncKey] = useState<string>(() => {
    if (currentUser?.syncKey) return currentUser.syncKey;
    return localStorage.getItem('mbc_sync_key') || 'USUARIO_UNICO';
  });
  const [syncStatus, setSyncStatus] = useState<'idle' | 'syncing' | 'synced' | 'error'>('idle');
  const [isInitialLoadComplete, setIsInitialLoadComplete] = useState(false);
  const isInitialLoadCompleteRef = useRef(false);
  const [showSyncToast, setShowSyncToast] = useState(false);

  // Auto-close sync toast after 5s
  useEffect(() => {
    if (showSyncToast) {
      const timer = setTimeout(() => {
        setShowSyncToast(false);
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [showSyncToast]);

  // Keep track of the last serialized state pushed to or pulled from Firestore to prevent infinite loops
  const lastSyncedStateRef = useRef<string>('');
  const lastRemoteUpdatedAtRef = useRef<string | null>(null);
  const isApplyingRemoteUpdateRef = useRef<boolean>(false);

  // Keep a reference to the latest local state to solve stale closure issues in the onSnapshot listener
  const latestStateRef = useRef({
    userName,
    userPhoto,
    userHandle,
    xpTotal,
    streak,
    dailyTasks,
    goals,
    timelines,
    finances,
    routine,
    calendarNotes,
    monthlyReviews,
    weeklyReviews,
    documents,
    notes,
    bookTracker,
    bibleTracker,
    areaImages,
    lifeSummary,
    futureEvents,
    habits,
    gridRoutine,
    customCards,
    activeThemePreset,
    customThemeHex,
    reminders,
    masterTemplates,
    dailyWorkspaceSettings,
    projects,
    lastDailyResetDate,
    bankAccounts,
    creditCards,
    debtItems,
    budgetLimits,
    portfolioAssets,
    investmentTransactions,
    visionBoardCards,
    cardsPerRow,
    sheetOverrides,
    financesMainSubtab,
    isFinancesBudgetOpen,
    isFinancesEntriesOpen,
    yearlyImages,
    overviewYears,
    isMonthlyReviewOpen,
    isWeeklyReviewsOpen,
    userBio,
    userArchetype,
    focusTrainingDate,
    dashboardChecklistOpen,
    dashboardHabitsOpen,
    dashboardGoalsOpen,
    dashboardFinancesOpen,
    reminderInitialMode,
    language,
    backgroundNotificationsEnabled
  });

  // Automatically keep latestStateRef in sync with latest React state on every single render
  useEffect(() => {
    latestStateRef.current = {
      userName,
      userPhoto,
      userHandle,
      xpTotal,
      streak,
      dailyTasks,
      goals,
      timelines,
      finances,
      routine,
      calendarNotes,
      monthlyReviews,
      weeklyReviews,
      documents,
      notes,
      bookTracker,
      bibleTracker,
      areaImages,
      lifeSummary,
      futureEvents,
      habits,
      gridRoutine,
      customCards,
      activeThemePreset,
      customThemeHex,
      reminders,
      masterTemplates,
      dailyWorkspaceSettings,
      projects,
      lastDailyResetDate,
      bankAccounts,
      creditCards,
      debtItems,
      budgetLimits,
      portfolioAssets,
      investmentTransactions,
      visionBoardCards,
      cardsPerRow,
      sheetOverrides,
      financesMainSubtab,
      isFinancesBudgetOpen,
      isFinancesEntriesOpen,
      yearlyImages,
      overviewYears,
      isMonthlyReviewOpen,
      isWeeklyReviewsOpen,
      userBio,
      userArchetype,
      focusTrainingDate,
      dashboardChecklistOpen,
      dashboardHabitsOpen,
      dashboardGoalsOpen,
      dashboardFinancesOpen,
      reminderInitialMode,
      language,
      backgroundNotificationsEnabled
    };
  });

  // Save syncKey in localStorage initially or save on change
  useEffect(() => {
    if (syncKey) {
      localStorage.setItem('mbc_sync_key', syncKey);
    } else {
      localStorage.removeItem('mbc_sync_key');
    }
  }, [syncKey]);

  // --- Background Device Registration & Heartbeat ---
  useEffect(() => {
    syncAndRegisterCurrentDevice().catch(() => {});

    const heartbeatInterval = setInterval(() => {
      syncAndRegisterCurrentDevice().catch(() => {});
    }, 300000);

    return () => clearInterval(heartbeatInterval);
  }, [userEmail, syncKey]);

  // --- Central Notification Scheduler & SW Alarm Synchronizer ---
  const notifiedKeysRef = useRef<Set<string>>(new Set());

  // Synchronize active alarms/reminders/tasks with Service Worker for background persistence
  useEffect(() => {
    const doSync = () => {
      const dailySpaceNotifEnabled = localStorage.getItem('mbc_daily_workspace_notif_enabled') !== 'false';
      const dailySpaceTime = localStorage.getItem('mbc_daily_workspace_reminder_time') || '21:00';
      const bgNotifEnabled = localStorage.getItem('mbc_background_notifications_enabled') !== 'false';

      syncAlarmsToServiceWorker({
        reminders,
        dailyTasks,
        routine,
        gridRoutine,
        notes,
        calendarNotes,
        dailySpaceEnabled: dailySpaceNotifEnabled,
        dailySpaceTime,
        backgroundEnabled: bgNotifEnabled
      }, syncKey);
    };

    doSync();

    const handleStorageChange = () => doSync();
    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, [reminders, dailyTasks, routine, gridRoutine, notes, calendarNotes]);

  useEffect(() => {
    if (typeof window === 'undefined' || typeof Notification === 'undefined') return;

    const checkNotifications = async () => {
      if (Notification.permission !== 'granted') return;
      if (localStorage.getItem('mbc_background_notifications_enabled') === 'false') return;

      const now = new Date();
      const pad = (n: number) => String(n).padStart(2, '0');
      const todayDateStr = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;
      const currentHHMM = `${pad(now.getHours())}:${pad(now.getMinutes())}`;
      const dayOfWeek = now.getDay(); // 0 = Dom, 1 = Seg, ...

      // 1. Routine Items (blocos de tempo de rotina diária)
      routine.forEach(item => {
        const timeToRemind = item.reminderTime || item.time;
        if (!timeToRemind) return;
        const matchesDay = item.isEveryDay || item.dayOfWeek === undefined || item.dayOfWeek === -1 || item.dayOfWeek === dayOfWeek;
        if (matchesDay && timeToRemind === currentHHMM) {
          const key = `routine-${item.id}-${todayDateStr}-${currentHHMM}`;
          if (!notifiedKeysRef.current.has(key)) {
            notifiedKeysRef.current.add(key);
            sendSystemNotification(`Lembrete de Rotina: ${item.task}`, {
              body: `Horário planejado: ${timeToRemind} | Rotina Diária`,
              tag: `routine-${item.id}`
            });
          }
        }
      });

      // 2. Standalone Notes (Notas)
      notes.forEach(n => {
        if (!n.reminderTime || n.archived) return;
        if (n.reminderTime !== currentHHMM) return;

        let shouldTrigger = false;
        const rec = n.reminderRecurrence || 'none';

        if (rec === 'daily') {
          shouldTrigger = true;
        } else if (rec === 'weekly') {
          if (!n.reminderDate) {
            shouldTrigger = true;
          } else {
            const remD = new Date(n.reminderDate + 'T00:00:00');
            shouldTrigger = remD.getDay() === dayOfWeek;
          }
        } else if (rec === 'monthly') {
          if (!n.reminderDate) {
            shouldTrigger = true;
          } else {
            const remD = new Date(n.reminderDate + 'T00:00:00');
            shouldTrigger = remD.getDate() === now.getDate();
          }
        } else {
          // 'none' or default single occurrence
          shouldTrigger = !n.reminderDate || n.reminderDate === todayDateStr;
        }

        if (shouldTrigger) {
          const key = `note-${n.id}-${todayDateStr}-${currentHHMM}`;
          if (!notifiedKeysRef.current.has(key)) {
            notifiedKeysRef.current.add(key);
            sendSystemNotification(`Lembrete de Nota: ${n.title}`, {
              body: n.content ? n.content.substring(0, 100) : 'Lembrete de anotação',
              tag: `note-${n.id}`
            });
          }
        }
      });

      // 3. Calendar Notes (Registros/Anotações do Dia)
      calendarNotes.forEach(cn => {
        if (!cn.reminderTime) return;
        if (cn.date === todayDateStr && cn.reminderTime === currentHHMM) {
          const key = `calnote-${cn.id}-${todayDateStr}-${currentHHMM}`;
          if (!notifiedKeysRef.current.has(key)) {
            notifiedKeysRef.current.add(key);
            sendSystemNotification(`Lembrete de Anotação: ${cn.title}`, {
              body: cn.content ? cn.content.substring(0, 100) : 'Lembrete da Agenda',
              tag: `calnote-${cn.id}`
            });
          }
        }
      });

      // 4. Daily Tasks (Checklist Inegociável)
      dailyTasks.forEach(task => {
        if (!task.reminderTime || task.completed) return;
        if (task.reminderTime === currentHHMM) {
          const key = `task-${task.id}-${todayDateStr}-${currentHHMM}`;
          if (!notifiedKeysRef.current.has(key)) {
            notifiedKeysRef.current.add(key);
            sendSystemNotification(`Lembrete de Tarefa: ${task.text}`, {
              body: `Horário: ${task.reminderTime} | Pilar: ${task.category}`,
              tag: `task-${task.id}`
            });
          }
        }
      });

      // 5. Google Calendar Events for today
      const googleToken = await getValidGoogleAccessToken();
      if (googleToken) {
        try {
          const timeMin = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0).toISOString();
          const timeMax = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59).toISOString();
          const res = await fetch(`/api/calendar/events?timeMin=${encodeURIComponent(timeMin)}&timeMax=${encodeURIComponent(timeMax)}`, {
            headers: { Authorization: `Bearer ${googleToken}` }
          });
          if (res.ok) {
            const data = await res.json();
            if (data.items) {
              data.items.forEach((ev: any) => {
                let eventTime = '';
                if (ev.start?.dateTime) {
                  const evDate = new Date(ev.start.dateTime);
                  eventTime = `${pad(evDate.getHours())}:${pad(evDate.getMinutes())}`;
                } else if (ev.start?.date === todayDateStr) {
                  // All day event - notify at 09:00
                  eventTime = '09:00';
                }

                if (eventTime && eventTime === currentHHMM) {
                  const key = `gcal-${ev.id}-${todayDateStr}-${currentHHMM}`;
                  if (!notifiedKeysRef.current.has(key)) {
                    notifiedKeysRef.current.add(key);
                    sendSystemNotification(`Google Agenda: ${ev.summary || 'Evento do dia'}`, {
                      body: ev.description ? ev.description.substring(0, 100) : `Evento no Google Agenda agendado para hoje`,
                      tag: `gcal-${ev.id}`
                    });
                  }
                }
              });
            }
          }
        } catch (e) {
          // background fetch silent error ignore
        }
      }

      // 6. Meu Dia Notification Trigger
      const dailySpaceNotifEnabled = localStorage.getItem('mbc_daily_workspace_notif_enabled') !== 'false';
      const dailySpaceTime = localStorage.getItem('mbc_daily_workspace_reminder_time') || '21:00';
      if (dailySpaceNotifEnabled && dailySpaceTime === currentHHMM) {
        const key = `dailyworkspace-${todayDateStr}-${currentHHMM}`;
        if (!notifiedKeysRef.current.has(key)) {
          notifiedKeysRef.current.add(key);
          sendSystemNotification('Meu Dia', {
            body: 'Hora de registrar suas reflexões do dia, checklist, orações e hábitos!',
            tag: 'dailyworkspace'
          });
        }
      }
    };

    const interval = setInterval(checkNotifications, 30000);
    checkNotifications();

    return () => clearInterval(interval);
  }, [routine, notes, calendarNotes, dailyTasks]);

  // Initial load & Realtime / Periodic Sync from Cloud (Firestore + Supabase + CrossTab)
  useEffect(() => {
    if (!syncKey) return;

    let isSubscribed = true;
    const currentDevId = getOrCreateDeviceId();

    const applyIncomingData = (data: any, remoteUpdatedAt?: string, originDeviceId?: string) => {
      if (!data || typeof data !== 'object') return;

      if (originDeviceId && originDeviceId === currentDevId) {
        // Echo of our own write from server, only update timestamp ref
        if (remoteUpdatedAt) {
          lastRemoteUpdatedAtRef.current = remoteUpdatedAt;
        }
        return;
      }

      // Mark that we are applying remote updates to prevent auto-save from echoing back
      isApplyingRemoteUpdateRef.current = true;

      const current = latestStateRef.current;

      const incomingData = {
        userName: data.userName !== undefined ? data.userName : current.userName,
        userPhoto: data.userPhoto !== undefined ? data.userPhoto : current.userPhoto,
        userHandle: data.userHandle !== undefined ? data.userHandle : current.userHandle,
        xpTotal: data.xpTotal !== undefined ? Number(data.xpTotal) : current.xpTotal,
        streak: data.streak !== undefined ? Number(data.streak) : current.streak,
        dailyTasks: Array.isArray(data.dailyTasks) ? data.dailyTasks : (data.dailyTasks !== undefined ? data.dailyTasks : current.dailyTasks),
        goals: Array.isArray(data.goals) ? data.goals : (data.goals !== undefined ? data.goals : current.goals),
        timelines: Array.isArray(data.timelines) ? data.timelines : (data.timelines !== undefined ? data.timelines : current.timelines),
        finances: data.finances !== undefined ? data.finances : current.finances,
        routine: data.routine !== undefined ? data.routine : current.routine,
        calendarNotes: data.calendarNotes !== undefined ? data.calendarNotes : current.calendarNotes,
        monthlyReviews: data.monthlyReviews !== undefined ? data.monthlyReviews : current.monthlyReviews,
        weeklyReviews: data.weeklyReviews !== undefined ? data.weeklyReviews : current.weeklyReviews,
        documents: data.documents !== undefined ? data.documents : current.documents,
        notes: data.notes !== undefined ? data.notes : current.notes,
        bookTracker: data.bookTracker !== undefined ? data.bookTracker : current.bookTracker,
        bibleTracker: data.bibleTracker !== undefined ? data.bibleTracker : current.bibleTracker,
        areaImages: data.areaImages !== undefined ? data.areaImages : current.areaImages,
        lifeSummary: data.lifeSummary ? mergeWithDefaults(data.lifeSummary) : current.lifeSummary,
        futureEvents: data.futureEvents !== undefined ? data.futureEvents : current.futureEvents,
        habits: Array.isArray(data.habits) ? data.habits : (data.habits !== undefined ? data.habits : current.habits),
        gridRoutine: data.gridRoutine !== undefined ? data.gridRoutine : current.gridRoutine,
        customCards: data.customCards !== undefined ? data.customCards : current.customCards,
        activeThemePreset: data.activeThemePreset !== undefined ? data.activeThemePreset : current.activeThemePreset,
        customThemeHex: data.customThemeHex !== undefined ? data.customThemeHex : current.customThemeHex,
        reminders: data.reminders !== undefined ? data.reminders : current.reminders,
        masterTemplates: data.masterTemplates !== undefined ? data.masterTemplates : (current as any).masterTemplates,
        dailyWorkspaceSettings: data.dailyWorkspaceSettings !== undefined ? data.dailyWorkspaceSettings : (current as any).dailyWorkspaceSettings,
        projects: Array.isArray(data.projects) ? data.projects : (data.projects !== undefined ? data.projects : current.projects),
        lastDailyResetDate: data.lastDailyResetDate !== undefined ? data.lastDailyResetDate : current.lastDailyResetDate,
        bankAccounts: data.bankAccounts !== undefined ? data.bankAccounts : current.bankAccounts,
        creditCards: data.creditCards !== undefined ? data.creditCards : current.creditCards,
        debtItems: data.debtItems !== undefined ? data.debtItems : current.debtItems,
        budgetLimits: data.budgetLimits !== undefined ? data.budgetLimits : current.budgetLimits,
        portfolioAssets: data.portfolioAssets !== undefined ? data.portfolioAssets : current.portfolioAssets,
        investmentTransactions: data.investmentTransactions !== undefined ? data.investmentTransactions : current.investmentTransactions,
        visionBoardCards: data.visionBoardCards !== undefined ? data.visionBoardCards : current.visionBoardCards,
        cardsPerRow: data.cardsPerRow !== undefined ? data.cardsPerRow : current.cardsPerRow,
        sheetOverrides: data.sheetOverrides !== undefined ? data.sheetOverrides : current.sheetOverrides,
        financesMainSubtab: data.financesMainSubtab !== undefined ? data.financesMainSubtab : current.financesMainSubtab,
        isFinancesBudgetOpen: data.isFinancesBudgetOpen !== undefined ? data.isFinancesBudgetOpen : current.isFinancesBudgetOpen,
        isFinancesEntriesOpen: data.isFinancesEntriesOpen !== undefined ? data.isFinancesEntriesOpen : current.isFinancesEntriesOpen,
        yearlyImages: data.yearlyImages !== undefined ? data.yearlyImages : current.yearlyImages,
        overviewYears: data.overviewYears !== undefined ? data.overviewYears : current.overviewYears,
        isMonthlyReviewOpen: data.isMonthlyReviewOpen !== undefined ? data.isMonthlyReviewOpen : current.isMonthlyReviewOpen,
        isWeeklyReviewsOpen: data.isWeeklyReviewsOpen !== undefined ? data.isWeeklyReviewsOpen : current.isWeeklyReviewsOpen,
        userBio: data.userBio !== undefined ? data.userBio : current.userBio,
        userArchetype: data.userArchetype !== undefined ? data.userArchetype : current.userArchetype,
        focusTrainingDate: data.focusTrainingDate !== undefined ? data.focusTrainingDate : current.focusTrainingDate,
        dashboardChecklistOpen: data.dashboardChecklistOpen !== undefined ? data.dashboardChecklistOpen : current.dashboardChecklistOpen,
        dashboardHabitsOpen: data.dashboardHabitsOpen !== undefined ? data.dashboardHabitsOpen : current.dashboardHabitsOpen,
        dashboardGoalsOpen: data.dashboardGoalsOpen !== undefined ? data.dashboardGoalsOpen : current.dashboardGoalsOpen,
        dashboardFinancesOpen: data.dashboardFinancesOpen !== undefined ? data.dashboardFinancesOpen : current.dashboardFinancesOpen,
        reminderInitialMode: data.reminderInitialMode !== undefined ? data.reminderInitialMode : current.reminderInitialMode,
        language: data.language !== undefined ? data.language : current.language,
        backgroundNotificationsEnabled: data.backgroundNotificationsEnabled !== undefined ? data.backgroundNotificationsEnabled : current.backgroundNotificationsEnabled,
        loadingScreenVerticalImage: data.loadingScreenVerticalImage !== undefined ? data.loadingScreenVerticalImage : current.loadingScreenVerticalImage,
        loadingScreenHorizontalImage: data.loadingScreenHorizontalImage !== undefined ? data.loadingScreenHorizontalImage : current.loadingScreenHorizontalImage
      };

      const incomingSerialized = safeStringify(incomingData);
      lastSyncedStateRef.current = incomingSerialized;
      latestStateRef.current = incomingData;
      if (remoteUpdatedAt) {
        lastRemoteUpdatedAtRef.current = remoteUpdatedAt;
      }

      // Hydrate React state
      setUserName(incomingData.userName);
      setUserPhoto(incomingData.userPhoto);
      setUserHandle(incomingData.userHandle);
      setXpTotal(incomingData.xpTotal);
      setStreak(incomingData.streak);
      setDailyTasks(incomingData.dailyTasks);
      setGoals(incomingData.goals);
      setTimelines(incomingData.timelines || []);
      setFinances(incomingData.finances);
      setRoutine(Array.isArray(incomingData.routine) ? cleanupExpiredRoutineItems(incomingData.routine).cleaned : incomingData.routine);
      setCalendarNotes(incomingData.calendarNotes);
      setMonthlyReviews(incomingData.monthlyReviews);
      setWeeklyReviews(incomingData.weeklyReviews);
      setDocuments(incomingData.documents);
      setNotes(incomingData.notes);
      setBookTracker(incomingData.bookTracker);
      setBibleTracker(incomingData.bibleTracker);
      setAreaImages(incomingData.areaImages);
      setLifeSummary(incomingData.lifeSummary);
      setFutureEvents(incomingData.futureEvents);
      setHabits(incomingData.habits);
      setProjects(incomingData.projects || []);
      if (incomingData.reminders) setReminders(incomingData.reminders);
      if (incomingData.customCards) setCustomCards(incomingData.customCards);
      if (incomingData.gridRoutine !== undefined) setGridRoutine(cleanupExpiredGridRoutine(incomingData.gridRoutine).cleaned);
      if (incomingData.activeThemePreset !== undefined) setActiveThemePreset(incomingData.activeThemePreset);
      if (incomingData.customThemeHex !== undefined) setCustomThemeHex(incomingData.customThemeHex);
      if (incomingData.loadingScreenVerticalImage !== undefined) setLoadingScreenVerticalImage(incomingData.loadingScreenVerticalImage);
      if (incomingData.loadingScreenHorizontalImage !== undefined) setLoadingScreenHorizontalImage(incomingData.loadingScreenHorizontalImage);
      if (incomingData.lastDailyResetDate !== undefined) setLastDailyResetDate(incomingData.lastDailyResetDate);
      if (incomingData.bankAccounts !== undefined) setBankAccounts(incomingData.bankAccounts);
      if (incomingData.creditCards !== undefined) setCreditCards(incomingData.creditCards);
      if (incomingData.debtItems !== undefined) setDebtItems(incomingData.debtItems);
      if (incomingData.budgetLimits !== undefined) setBudgetLimits(incomingData.budgetLimits);
      if (incomingData.portfolioAssets !== undefined) setPortfolioAssets(incomingData.portfolioAssets);
      if (incomingData.investmentTransactions !== undefined) setInvestmentTransactions(incomingData.investmentTransactions);
      if (incomingData.visionBoardCards !== undefined) setVisionBoardCards(incomingData.visionBoardCards);
      if (incomingData.cardsPerRow !== undefined) setCardsPerRow(incomingData.cardsPerRow);
      if (incomingData.sheetOverrides !== undefined) setSheetOverrides(incomingData.sheetOverrides);
      if (incomingData.financesMainSubtab !== undefined) setFinancesMainSubtab(incomingData.financesMainSubtab);
      if (incomingData.isFinancesBudgetOpen !== undefined) setIsFinancesBudgetOpen(incomingData.isFinancesBudgetOpen);
      if (incomingData.isFinancesEntriesOpen !== undefined) setIsFinancesEntriesOpen(incomingData.isFinancesEntriesOpen);
      if (incomingData.yearlyImages !== undefined) setYearlyImages(incomingData.yearlyImages);
      if (incomingData.overviewYears !== undefined) setOverviewYears(incomingData.overviewYears);
      if (incomingData.isMonthlyReviewOpen !== undefined) setIsMonthlyReviewOpen(incomingData.isMonthlyReviewOpen);
      if (incomingData.isWeeklyReviewsOpen !== undefined) setIsWeeklyReviewsOpen(incomingData.isWeeklyReviewsOpen);
      if (incomingData.userBio !== undefined) setUserBio(incomingData.userBio);
      if (incomingData.userArchetype !== undefined) setUserArchetype(incomingData.userArchetype);
      if (incomingData.focusTrainingDate !== undefined) setFocusTrainingDate(incomingData.focusTrainingDate);
      if (incomingData.dashboardChecklistOpen !== undefined) setDashboardChecklistOpen(incomingData.dashboardChecklistOpen);
      if (incomingData.dashboardHabitsOpen !== undefined) setDashboardHabitsOpen(incomingData.dashboardHabitsOpen);
      if (incomingData.dashboardGoalsOpen !== undefined) setDashboardGoalsOpen(incomingData.dashboardGoalsOpen);
      if (incomingData.dashboardFinancesOpen !== undefined) setDashboardFinancesOpen(incomingData.dashboardFinancesOpen);
      if (incomingData.reminderInitialMode !== undefined) setReminderInitialMode(incomingData.reminderInitialMode);
      if (incomingData.language !== undefined) setLanguage(incomingData.language);
      if (incomingData.backgroundNotificationsEnabled !== undefined) setBackgroundNotificationsEnabled(incomingData.backgroundNotificationsEnabled);
      if ((incomingData as any).masterTemplates) setMasterTemplates((incomingData as any).masterTemplates);
      if ((incomingData as any).dailyWorkspaceSettings) setDailyWorkspaceSettings((incomingData as any).dailyWorkspaceSettings);

      // Batch save to local storage
      localStorage.setItem('mbc_userName', incomingData.userName);
      localStorage.setItem('mbc_userPhoto', incomingData.userPhoto);
      localStorage.setItem('mbc_userHandle', incomingData.userHandle);
      localStorage.setItem('mbc_xpTotal', incomingData.xpTotal.toString());
      localStorage.setItem('mbc_streak', incomingData.streak.toString());
      localStorage.setItem('mbc_dailyTasks', JSON.stringify(incomingData.dailyTasks));
      localStorage.setItem('mbc_goals', JSON.stringify(incomingData.goals));
      localStorage.setItem('mbc_timelines', JSON.stringify(incomingData.timelines || []));
      localStorage.setItem('mbc_finances', JSON.stringify(incomingData.finances));
      localStorage.setItem('mbc_routine', JSON.stringify(incomingData.routine));
      localStorage.setItem('mbc_calendarNotes', JSON.stringify(incomingData.calendarNotes));
      localStorage.setItem('mbc_monthlyReviews', JSON.stringify(incomingData.monthlyReviews));
      localStorage.setItem('mbc_weeklyReviews', JSON.stringify(incomingData.weeklyReviews));
      localStorage.setItem('mbc_documents', JSON.stringify(incomingData.documents));
      localStorage.setItem('mbc_notes', JSON.stringify(incomingData.notes));
      localStorage.setItem('mbc_bookTracker', JSON.stringify(incomingData.bookTracker));
      localStorage.setItem('mbc_bibleTracker', JSON.stringify(incomingData.bibleTracker));
      localStorage.setItem('mbc_area_images_v2', JSON.stringify(incomingData.areaImages));
      localStorage.setItem('mbc_life_summary_v1', JSON.stringify(incomingData.lifeSummary));
      localStorage.setItem('mbc_futureEvents', JSON.stringify(incomingData.futureEvents));
      localStorage.setItem('mbc_habits', JSON.stringify(incomingData.habits));
      localStorage.setItem('mbc_projects', JSON.stringify(incomingData.projects || []));
      localStorage.setItem('mbc_reminders', JSON.stringify(incomingData.reminders || []));
      if (incomingData.customCards) localStorage.setItem('dashboard_custom_cards', JSON.stringify(incomingData.customCards));
      if (incomingData.gridRoutine !== undefined) localStorage.setItem('mbc_grid_routine', JSON.stringify(incomingData.gridRoutine));
      if (incomingData.activeThemePreset !== undefined) localStorage.setItem('mbc_theme_preset', incomingData.activeThemePreset);
      if (incomingData.customThemeHex !== undefined) localStorage.setItem('mbc_custom_theme_hex', incomingData.customThemeHex);
      if (incomingData.loadingScreenVerticalImage !== undefined) localStorage.setItem('mbc_loading_screen_vertical_image', incomingData.loadingScreenVerticalImage);
      if (incomingData.loadingScreenHorizontalImage !== undefined) localStorage.setItem('mbc_loading_screen_horizontal_image', incomingData.loadingScreenHorizontalImage);
      if (incomingData.lastDailyResetDate !== undefined) localStorage.setItem('last_daily_reset_date', incomingData.lastDailyResetDate);
      if (incomingData.bankAccounts !== undefined) localStorage.setItem('mbc_bank_accounts', JSON.stringify(incomingData.bankAccounts));
      if (incomingData.creditCards !== undefined) localStorage.setItem('mbc_credit_cards', JSON.stringify(incomingData.creditCards));
      if (incomingData.debtItems !== undefined) localStorage.setItem('mbc_debt_items', JSON.stringify(incomingData.debtItems));
      if (incomingData.budgetLimits !== undefined) localStorage.setItem('mbc_budget_limits_v2', JSON.stringify(incomingData.budgetLimits));
      if (incomingData.portfolioAssets !== undefined) localStorage.setItem('meu_foco_portfolio_assets', JSON.stringify(incomingData.portfolioAssets));
      if (incomingData.investmentTransactions !== undefined) localStorage.setItem('meu_foco_investment_transactions', JSON.stringify(incomingData.investmentTransactions));
      if (incomingData.visionBoardCards !== undefined) localStorage.setItem('mbc_vision_board_cards_v1', JSON.stringify(incomingData.visionBoardCards));
      if (incomingData.cardsPerRow !== undefined) localStorage.setItem('mbc_vb_cards_per_row_v1', incomingData.cardsPerRow.toString());
      if (incomingData.sheetOverrides !== undefined) localStorage.setItem('mbc_sheet_overrides', JSON.stringify(incomingData.sheetOverrides));
      if (incomingData.financesMainSubtab !== undefined) localStorage.setItem('finances_main_subtab', incomingData.financesMainSubtab);
      if (incomingData.isFinancesBudgetOpen !== undefined) localStorage.setItem('finances_budget_open', String(incomingData.isFinancesBudgetOpen));
      if (incomingData.isFinancesEntriesOpen !== undefined) localStorage.setItem('finances_entries_open', String(incomingData.isFinancesEntriesOpen));
      if (incomingData.yearlyImages !== undefined) localStorage.setItem('mbc_yearly_images', JSON.stringify(incomingData.yearlyImages));
      if (incomingData.overviewYears !== undefined) localStorage.setItem('mbc_overview_years', JSON.stringify(incomingData.overviewYears));
      if (incomingData.isMonthlyReviewOpen !== undefined) localStorage.setItem('mbc_is_monthly_review_open', String(incomingData.isMonthlyReviewOpen));
      if (incomingData.isWeeklyReviewsOpen !== undefined) localStorage.setItem('mbc_is_weekly_reviews_open', String(incomingData.isWeeklyReviewsOpen));
      if (incomingData.userBio !== undefined) localStorage.setItem('mbc_userBio', incomingData.userBio);
      if (incomingData.userArchetype !== undefined) localStorage.setItem('mbc_userArchetype', incomingData.userArchetype);
      if (incomingData.focusTrainingDate !== undefined) localStorage.setItem('mbc_focus_training_date', incomingData.focusTrainingDate);
      if (incomingData.dashboardChecklistOpen !== undefined) localStorage.setItem('dashboard_checklist_open', String(incomingData.dashboardChecklistOpen));
      if (incomingData.dashboardHabitsOpen !== undefined) localStorage.setItem('dashboard_habits_open', String(incomingData.dashboardHabitsOpen));
      if (incomingData.dashboardGoalsOpen !== undefined) localStorage.setItem('dashboard_goals_open', String(incomingData.dashboardGoalsOpen));
      if (incomingData.dashboardFinancesOpen !== undefined) localStorage.setItem('dashboard_finances_open', String(incomingData.dashboardFinancesOpen));
      if (incomingData.reminderInitialMode !== undefined) localStorage.setItem('mbc_reminder_initial_mode', incomingData.reminderInitialMode);
      if (incomingData.language !== undefined) localStorage.setItem('mbc_language', incomingData.language);
      if (incomingData.backgroundNotificationsEnabled !== undefined) localStorage.setItem('mbc_background_notifications_enabled', String(incomingData.backgroundNotificationsEnabled));

      if (originDeviceId && originDeviceId !== currentDevId) {
        setShowSyncToast(true);
      }

      // Keep last synced state in sync with incoming payload to avoid bounce-back
      try {
        lastSyncedStateRef.current = safeStringify(incomingData);
      } catch (e) {}

      setTimeout(() => {
        isApplyingRemoteUpdateRef.current = false;
      }, 1200);
    };

    async function checkRemoteData(isInitial = false) {
      if (isInitial) setSyncStatus('syncing');
      try {
        if (!isInitial) {
          const meta = await loadMetadataFromSupabase(syncKey);
          if (meta && meta.updated_at && lastRemoteUpdatedAtRef.current === meta.updated_at) {
            if (isSubscribed) setSyncStatus('synced');
            return;
          }
        }

        const remoteRecord = await loadFromSupabase(syncKey);
        if (remoteRecord && remoteRecord.data && isSubscribed) {
          if (remoteRecord.updated_at) {
            lastRemoteUpdatedAtRef.current = remoteRecord.updated_at;
          }
          applyIncomingData(remoteRecord.data, remoteRecord.updated_at, remoteRecord.originDeviceId);
          await saveOfflineSnapshot(`latest_${syncKey}`, remoteRecord.data);
          if (isInitial) {
            await clearAllMutations();
          }
        } else if (isInitial) {
          const offlineSnapshot = await loadOfflineSnapshot(`latest_${syncKey}`);
          if (offlineSnapshot && isSubscribed) {
            applyIncomingData(offlineSnapshot);
          }
        }
        if (isSubscribed) setSyncStatus('synced');
      } catch (err) {
        console.warn('Remote sync load warning:', err);
        if (isSubscribed && isInitial) {
          try {
            const offlineSnapshot = await loadOfflineSnapshot(`latest_${syncKey}`);
            if (offlineSnapshot && isSubscribed) {
              applyIncomingData(offlineSnapshot);
            }
          } catch (e) {}
          setSyncStatus('error');
        }
      } finally {
        if (isSubscribed && isInitial) {
          setTimeout(() => {
            if (isSubscribed) {
              setIsInitialLoadComplete(true);
              isInitialLoadCompleteRef.current = true;
            }
          }, 500);
        }
      }
    }

    // 1. Initial hydration
    checkRemoteData(true);

    // 2. Realtime Cross-tab Sync Subscription (Instant <5ms sync between multiple open tabs on same device)
    const unsubscribeCrossTab = subscribeToCrossTabSync(syncKey, (incomingPayload, updatedAt, originDeviceId) => {
      if (isSubscribed && incomingPayload) {
        applyIncomingData(incomingPayload, updatedAt, originDeviceId);
        saveOfflineSnapshot(`latest_${syncKey}`, incomingPayload);
        setSyncStatus('synced');
      }
    });

    // 3. Realtime Supabase Multi-Device Subscriptions (<100ms instant cross-device sync)
    const client = getSupabaseClient();
    const cleanSyncKey = syncKey.trim().toUpperCase();
    let postgresChannel: any = null;
    let broadcastRoomChannel: any = null;

    if (client && cleanSyncKey) {
      try {
        // A. Postgres Table Changes Listener
        postgresChannel = client
          .channel(`realtime_user_sync_${cleanSyncKey}`)
          .on(
            'postgres_changes',
            {
              event: '*',
              schema: 'public',
              table: 'user_sync',
              filter: `sync_key=eq.${cleanSyncKey}`
            },
            (payload: any) => {
              if (payload?.new?.data && isSubscribed) {
                const originDevId = payload.new.data?._originDeviceId || (payload.new as any).origin_device_id || '';
                if (originDevId !== currentDevId) {
                  applyIncomingData(payload.new.data, payload.new.updated_at, originDevId);
                  saveOfflineSnapshot(`latest_${syncKey}`, payload.new.data);
                  setSyncStatus('synced');
                }
              }
            }
          )
          .subscribe();

        // B. Instant Global Broadcast Channel (Peer-to-peer across PC, mobile, tablets)
        broadcastRoomChannel = client
          .channel(`sync_room_${cleanSyncKey}`, {
            config: { broadcast: { ack: false, self: false } }
          })
          .on(
            'broadcast',
            { event: 'REMOTE_STATE_UPDATED' },
            (payload: any) => {
              if (!isSubscribed) return;
              const bData = payload?.payload;
              if (bData && bData.syncKey === cleanSyncKey) {
                const originDevId = bData.originDeviceId || '';
                if (originDevId !== currentDevId) {
                  checkRemoteData(false);
                }
              }
            }
          )
          .subscribe();
      } catch (e) {
        console.warn('Realtime channels subscribe warning:', e);
      }
    }

    // 4. Ultra-responsive active polling (every 3.5 seconds while tab is active)
    const pollingInterval = setInterval(() => {
      if (isSubscribed && document.visibilityState === 'visible') {
        checkRemoteData(false);
      }
    }, 3500);

    // 5. Instant check on window focus, online event, or visibility change
    const handleFocusOrOnline = () => {
      if (isSubscribed && document.visibilityState === 'visible') {
        checkRemoteData(false);
      }
    };
    window.addEventListener('focus', handleFocusOrOnline);
    window.addEventListener('online', handleFocusOrOnline);
    document.addEventListener('visibilitychange', handleFocusOrOnline);

    // 6. Throttled touch/click interaction refresh (refreshes if user taps after idle)
    let lastInteractionCheckTime = 0;
    const handleUserInteraction = () => {
      const now = Date.now();
      if (now - lastInteractionCheckTime > 3000 && isSubscribed && document.visibilityState === 'visible') {
        lastInteractionCheckTime = now;
        checkRemoteData(false);
      }
    };
    window.addEventListener('pointerdown', handleUserInteraction, { passive: true });

    return () => {
      isSubscribed = false;
      unsubscribeCrossTab();
      clearInterval(pollingInterval);
      window.removeEventListener('focus', handleFocusOrOnline);
      window.removeEventListener('online', handleFocusOrOnline);
      document.removeEventListener('visibilitychange', handleFocusOrOnline);
      window.removeEventListener('pointerdown', handleUserInteraction);
      if (client) {
        if (postgresChannel) client.removeChannel(postgresChannel);
        if (broadcastRoomChannel) client.removeChannel(broadcastRoomChannel);
      }
    };
  }, [syncKey]);

  // Debounced push to Cloud (Firestore + Supabase) via IndexedDB Mutation Queue
  useEffect(() => {
    if (!isInitialLoadComplete || !isInitialLoadCompleteRef.current) return;
    if (!syncKey) return;

    // If this render was triggered by applying an incoming remote update, do not push back to avoid infinite loops
    if (isApplyingRemoteUpdateRef.current) {
      return;
    }

    // Serialize current local state with all synchronized values
    const currentData = {
      userName,
      userPhoto,
      userHandle,
      xpTotal,
      streak,
      dailyTasks,
      goals,
      timelines,
      finances,
      routine,
      calendarNotes,
      monthlyReviews,
      weeklyReviews,
      documents,
      notes,
      bookTracker,
      bibleTracker,
      areaImages,
      lifeSummary,
      futureEvents,
      habits,
      gridRoutine,
      customCards,
      activeThemePreset,
      customThemeHex,
      reminders,
      masterTemplates,
      dailyWorkspaceSettings,
      projects,
      lastDailyResetDate,
      bankAccounts,
      creditCards,
      debtItems,
      budgetLimits,
      portfolioAssets,
      investmentTransactions,
      visionBoardCards,
      cardsPerRow,
      sheetOverrides,
      financesMainSubtab,
      isFinancesBudgetOpen,
      isFinancesEntriesOpen,
      yearlyImages,
      overviewYears,
      isMonthlyReviewOpen,
      isWeeklyReviewsOpen,
      userBio,
      userArchetype,
      focusTrainingDate,
      dashboardChecklistOpen,
      dashboardHabitsOpen,
      dashboardGoalsOpen,
      dashboardFinancesOpen,
      reminderInitialMode,
      language,
      backgroundNotificationsEnabled,
      loadingScreenVerticalImage,
      loadingScreenHorizontalImage
    };
    const currentSerialized = safeStringify(currentData);

    // If current state matches the last synced state, do not push (prevents loops)
    if (currentSerialized === lastSyncedStateRef.current || !lastSyncedStateRef.current) {
      return;
    }

    setSyncStatus('syncing');

    const performSync = async () => {
      if (isApplyingRemoteUpdateRef.current) return;

      try {
        const nowIso = new Date().toISOString();
        localStorage.setItem('mbc_last_local_write', nowIso);
        const cleanCurrentData = JSON.parse(currentSerialized);

        // 1. Instantly register in IndexedDB Mutation Queue and save offline snapshot
        await enqueueMutation({
          syncKey,
          payload: cleanCurrentData,
          type: 'full_state_sync',
          description: 'Sincronização de alterações de estado da aplicação'
        });
        await saveOfflineSnapshot(`latest_${syncKey}`, cleanCurrentData);

        // 2. Process queue if online
        if (typeof navigator !== 'undefined' && navigator.onLine) {
          const queueResult = await processMutationQueue(saveToSupabase);
          if (queueResult.failed === 0) {
            lastSyncedStateRef.current = currentSerialized;
            lastRemoteUpdatedAtRef.current = nowIso;
            setSyncStatus('synced');
          } else {
            setSyncStatus('error');
          }
        } else {
          // Offline: Mutation is safely retained in IndexedDB
          setSyncStatus('idle');
        }
      } catch (err) {
        console.error('Error saving to IndexedDB / cloud:', err);
        setSyncStatus('error');
      }
    };

    const timeoutId = setTimeout(performSync, 600);

    // Flush immediately if user switches tabs or navigates away
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'hidden') {
        performSync();
      }
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      clearTimeout(timeoutId);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [
    syncKey,
    userName,
    userPhoto,
    userHandle,
    xpTotal,
    streak,
    dailyTasks,
    goals,
    timelines,
    finances,
    routine,
    calendarNotes,
    monthlyReviews,
    weeklyReviews,
    documents,
    notes,
    bookTracker,
    bibleTracker,
    areaImages,
    lifeSummary,
    futureEvents,
    habits,
    gridRoutine,
    customCards,
    activeThemePreset,
    customThemeHex,
    reminders,
    masterTemplates,
    dailyWorkspaceSettings,
    projects,
    lastDailyResetDate,
    bankAccounts,
    creditCards,
    debtItems,
    budgetLimits,
    portfolioAssets,
    investmentTransactions,
    visionBoardCards,
    cardsPerRow,
    sheetOverrides,
    financesMainSubtab,
    isFinancesBudgetOpen,
    isFinancesEntriesOpen,
    yearlyImages,
    overviewYears,
    isMonthlyReviewOpen,
    isWeeklyReviewsOpen,
    userBio,
    userArchetype,
    focusTrainingDate,
    dashboardChecklistOpen,
    dashboardHabitsOpen,
    dashboardGoalsOpen,
    dashboardFinancesOpen,
    reminderInitialMode,
    language,
    backgroundNotificationsEnabled,
    loadingScreenVerticalImage,
    loadingScreenHorizontalImage,
    isInitialLoadComplete
  ]);

  const connectSyncKey = async (key: string) => {
    const trimmed = key.trim().toUpperCase();
    if (!trimmed) return;
    
    setSyncStatus('syncing');
    try {
      setIsInitialLoadComplete(false);
      isInitialLoadCompleteRef.current = false;
      setSyncKey(trimmed);
      localStorage.setItem('mbc_sync_key', trimmed);
    } catch (err) {
      console.error("Error connecting sync key:", err);
      setSyncStatus('error');
    }
  };

  // Handle successful login/signup
  const handleAuthSuccess = async (user: AuthUser, rememberMe: boolean) => {
    setCurrentUser(user);
    setIsAuthModalOpen(false);

    if (rememberMe) {
      localStorage.setItem('mbc_auth_user', JSON.stringify(user));
      localStorage.setItem('mbc_remember_me', 'true');
      sessionStorage.removeItem('mbc_auth_user');
    } else {
      sessionStorage.setItem('mbc_auth_user', JSON.stringify(user));
      localStorage.removeItem('mbc_auth_user');
      localStorage.setItem('mbc_remember_me', 'false');
    }

    if (user.name) {
      setUserName(user.name);
      localStorage.setItem('mbc_userName', user.name);
    }
    if (user.username) {
      setUserHandle(`@${user.username}`);
      localStorage.setItem('mbc_userHandle', `@${user.username}`);
    }
    if (user.email) {
      setUserEmail(user.email);
      localStorage.setItem('mbc_userEmail', user.email);
    }
    if (user.photo) {
      setUserPhoto(user.photo);
      localStorage.setItem('mbc_userPhoto', user.photo);
    }

    if (user.syncKey) {
      await connectSyncKey(user.syncKey);
    }

    setIsUnlockLoading(false);
    setIsSyncLoading(true);
  };

  const handleLogout = () => {
    clearGoogleOAuthSession();
    localStorage.removeItem('mbc_auth_user');
    sessionStorage.removeItem('mbc_auth_user');
    localStorage.removeItem('mbc_sync_key');
    setCurrentUser(null);
    setIsAuthModalOpen(true);
  };

  // Keep Google OAuth token fresh proactively as long as user is logged in
  useEffect(() => {
    const keepGoogleAlive = async () => {
      const refreshToken = localStorage.getItem('google_calendar_refresh_token');
      if (refreshToken || localStorage.getItem('google_calendar_user')) {
        await getValidGoogleAccessToken();
      }
    };
    keepGoogleAlive();
    const interval = setInterval(keepGoogleAlive, 10 * 60 * 1000); // 10 minutes
    return () => clearInterval(interval);
  }, []);

  // Sync session on startup
  useEffect(() => {
    const autoInitSync = async () => {
      if (currentUser?.syncKey) {
        setSyncKey(currentUser.syncKey);
        localStorage.setItem('mbc_sync_key', currentUser.syncKey);
      } else if (!localStorage.getItem('mbc_sync_key')) {
        setIsAuthModalOpen(true);
      }
    };
    autoInitSync();
  }, [currentUser]);

  const disconnectSync = async () => {
    await connectSyncKey('USUARIO_UNICO');
  };

  // --- Effects for LocalStorage Sync and History Management (Mobile/Android back button support) ---
  useEffect(() => {
    // Replace initial state with current values
    window.history.replaceState({
      activeTab,
      checklistActiveTab,
      goalsViewMode,
      goalsSelectedArea,
      settingsScreen,
      lifeSummaryActiveArea
    }, '', '');
  }, []);

  const pushNavigationState = (
    tab: string, 
    checklistTab: 'checklist' | 'rotina', 
    goalsMode: 'areas' | 'all' | 'leitura' | 'timeline', 
    goalsArea: string | null, 
    setScr: string, 
    lifeArea: any
  ) => {
    if (isPoppingRef.current) return;
    
    // Compare if anything actually changed
    const currentState = window.history.state;
    if (
      currentState &&
      currentState.activeTab === tab &&
      currentState.checklistActiveTab === checklistTab &&
      currentState.goalsViewMode === goalsMode &&
      currentState.goalsSelectedArea === goalsArea &&
      currentState.settingsScreen === setScr &&
      currentState.lifeSummaryActiveArea === lifeArea
    ) {
      return; // No change, do not push
    }
    
    window.history.pushState({
      activeTab: tab,
      checklistActiveTab: checklistTab,
      goalsViewMode: goalsMode,
      goalsSelectedArea: goalsArea,
      settingsScreen: setScr,
      lifeSummaryActiveArea: lifeArea
    }, '', '');
  };

  useEffect(() => {
    pushNavigationState(
      activeTab,
      checklistActiveTab,
      goalsViewMode,
      goalsSelectedArea,
      settingsScreen,
      lifeSummaryActiveArea
    );
    localStorage.setItem('mbc_activeTab', activeTab);
  }, [
    activeTab,
    checklistActiveTab,
    goalsViewMode,
    goalsSelectedArea,
    settingsScreen,
    lifeSummaryActiveArea
  ]);

  useEffect(() => {
    const handlePopState = (event: PopStateEvent) => {
      if (event.state) {
        isPoppingRef.current = true;
        
        if (event.state.activeTab) setActiveTab(event.state.activeTab);
        if (event.state.checklistActiveTab) setChecklistActiveTab(event.state.checklistActiveTab);
        if (event.state.goalsViewMode) setGoalsViewMode(event.state.goalsViewMode);
        setGoalsSelectedArea(event.state.goalsSelectedArea);
        if (event.state.settingsScreen) setSettingsScreen(event.state.settingsScreen);
        setLifeSummaryActiveArea(event.state.lifeSummaryActiveArea);
        
        setTimeout(() => {
          isPoppingRef.current = false;
        }, 50);
      } else {
        setActiveTab('dashboard');
      }
    };

    window.addEventListener('popstate', handlePopState);
    return () => {
      window.removeEventListener('popstate', handlePopState);
    };
  }, []);

  useEffect(() => { localStorage.setItem('mbc_userName', userName); }, [userName]);
  useEffect(() => { localStorage.setItem('mbc_xpTotal', xpTotal.toString()); }, [xpTotal]);
  useEffect(() => { localStorage.setItem('mbc_streak', streak.toString()); }, [streak]);
  useEffect(() => { localStorage.setItem('mbc_dailyTasks', JSON.stringify(dailyTasks)); }, [dailyTasks]);
  useEffect(() => { localStorage.setItem('mbc_goals', JSON.stringify(goals)); }, [goals]);
  useEffect(() => { localStorage.setItem('mbc_timelines', JSON.stringify(timelines)); }, [timelines]);
  useEffect(() => { localStorage.setItem('mbc_finances', JSON.stringify(finances)); }, [finances]);
  useEffect(() => { 
    localStorage.setItem('mbc_routine', JSON.stringify(routine)); 
    localStorage.setItem('mbc_last_local_write', new Date().toISOString());
  }, [routine]);

  useEffect(() => { 
    localStorage.setItem('mbc_grid_routine', JSON.stringify(gridRoutine)); 
    localStorage.setItem('mbc_last_local_write', new Date().toISOString());
  }, [gridRoutine]);

  useEffect(() => { localStorage.setItem('mbc_calendarNotes', JSON.stringify(calendarNotes)); }, [calendarNotes]);
  useEffect(() => { localStorage.setItem('mbc_monthlyReviews', JSON.stringify(monthlyReviews)); }, [monthlyReviews]);
  useEffect(() => { localStorage.setItem('mbc_documents', JSON.stringify(documents)); }, [documents]);
  useEffect(() => { localStorage.setItem('mbc_notes', JSON.stringify(notes)); }, [notes]);

  // --- Sync today's dailyTasks with calendarNotes for today's date ---
  useEffect(() => {
    const d = new Date();
    const todayStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    setCalendarNotes(prevNotes => {
      const existingIdx = prevNotes.findIndex(n => n.date === todayStr);
      if (existingIdx !== -1) {
        const existingRecord = prevNotes[existingIdx];
        const existingChecklist = existingRecord.checklist || [];
        
        // Retain non-daily task items (routine, grid, book reading, custom day tasks)
        // Any standard daily task that is no longer in dailyTasks is excluded (was deleted by user)
        const retainedNonDaily = existingChecklist.filter(t => 
          t.id.startsWith('routine-') || 
          t.id.startsWith('grid-') || 
          t.id === 'task-leitura' || 
          t.id === 'task-biblia' || 
          t.id.startsWith('dt-day-')
        );
        
        const mergedChecklist = [...dailyTasks, ...retainedNonDaily];
        if (JSON.stringify(existingRecord.checklist) === JSON.stringify(mergedChecklist)) {
          return prevNotes;
        }
        const updated = [...prevNotes];
        updated[existingIdx] = {
          ...existingRecord,
          isDailyRecord: true,
          checklist: mergedChecklist
        };
        return updated;
      } else {
        return [
          ...prevNotes,
          {
            id: 'cn-' + Math.random().toString(36).substring(2, 9),
            date: todayStr,
            title: `Registro Diário (${todayStr})`,
            content: '',
            isDailyRecord: true,
            checklist: dailyTasks
          }
        ];
      }
    });
  }, [dailyTasks]);

  // --- Automatic Daily Reset Effect for Daily Tasks ---
  useEffect(() => {
    const checkDailyReset = () => {
      const d = new Date();
      const todayStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
      const lastReset = localStorage.getItem('mbc_last_daily_reset');
      if (lastReset && lastReset !== todayStr) {
        // Archive previous day's checklist before resetting
        setCalendarNotes(prevNotes => {
          const existingIdx = prevNotes.findIndex(n => n.date === lastReset);
          if (existingIdx !== -1) {
            const updated = [...prevNotes];
            updated[existingIdx] = {
              ...updated[existingIdx],
              isDailyRecord: true,
              checklist: dailyTasks
            };
            return updated;
          } else {
            return [
              ...prevNotes,
              {
                id: 'cn-' + Math.random().toString(36).substring(2, 9),
                date: lastReset,
                title: `Registro Diário (${lastReset})`,
                content: '',
                isDailyRecord: true,
                checklist: dailyTasks
              }
            ];
          }
        });

        // Reset tasks for the new todayStr
        setDailyTasks(prev => prev
          .filter(t => t.isRecurring !== false || (t.createdDate && t.createdDate === todayStr))
          .map(t => ({
            ...t,
            completed: false,
            subtasks: t.subtasks?.map(s => ({ ...s, completed: false }))
          }))
        );
        localStorage.setItem('mbc_last_daily_reset', todayStr);
      }
    };

    checkDailyReset();

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        checkDailyReset();
      }
    };

    window.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('focus', checkDailyReset);

    // Periodic check every minute
    const interval = setInterval(checkDailyReset, 60000);

    return () => {
      window.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('focus', checkDailyReset);
      clearInterval(interval);
    };
  }, [dailyTasks]);

  // --- Auto-seeder Effect for First Load ---
  useEffect(() => {
    const isFirstTime = !localStorage.getItem('mbc_has_seeded_v3');
      
    if (isFirstTime) {
      loadDemoData();
      localStorage.setItem('mbc_has_seeded_v3', 'true');
    }
  }, []);

  // --- Auto-fill from Google Profile on Mount if defaults are active ---
  useEffect(() => {
    const savedGoogleUser = localStorage.getItem('google_calendar_user');
    if (savedGoogleUser) {
      try {
        const profile = JSON.parse(savedGoogleUser);
        if (profile) {
          const defaultName = 'Nando';
          const defaultEmail = 'etanomicosl5@gmail.com';
          const defaultPhoto = 'https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?q=80&w=100';
          
          if (!userName || userName === defaultName) {
            setUserName(profile.name);
            localStorage.setItem('mbc_userName', profile.name);
          }
          if (!userEmail || userEmail === defaultEmail) {
            setUserEmail(profile.email);
            localStorage.setItem('mbc_userEmail', profile.email);
          }
          if (!userPhoto || userPhoto === defaultPhoto) {
            setUserPhoto(profile.picture);
            localStorage.setItem('mbc_userPhoto', profile.picture);
          }
        }
      } catch (e) {
        console.error('Failed to parse saved Google user:', e);
      }
    }
  }, []);

  // --- Auto-fullscreen on first user interaction (mouse or touch) whenever enabled ---
  useEffect(() => {
    const handleUserInteraction = () => {
      const isAuto = localStorage.getItem('mbc_autoFullscreen') !== 'false';
      const doc = document as any;
      const isFS = !!(
        doc.fullscreenElement ||
        doc.webkitFullscreenElement ||
        doc.mozFullScreenElement ||
        doc.msFullscreenElement
      );

      if (isAuto && !isFS) {
        try {
          const docEl = document.documentElement as any;
          if (docEl) {
            if (docEl.requestFullscreen) {
              const res = docEl.requestFullscreen();
              if (res && typeof res.catch === 'function') {
                res.catch(() => {});
              }
            } else if (docEl.webkitRequestFullscreen) {
              docEl.webkitRequestFullscreen();
            } else if (docEl.mozRequestFullScreen) {
              docEl.mozRequestFullScreen();
            } else if (docEl.msRequestFullscreen) {
              docEl.msRequestFullscreen();
            }
            localStorage.setItem('mbc_fullscreen', 'true');
          }
        } catch (err) {
          console.error('Falha ao acionar tela cheia automaticamente:', err);
        }
      }
    };

    const events = ['pointerdown', 'touchstart', 'mousedown', 'click'];
    const opts = { capture: true, passive: true };

    events.forEach(evt => {
      window.addEventListener(evt, handleUserInteraction, opts);
      document.addEventListener(evt, handleUserInteraction, opts);
    });

    return () => {
      events.forEach(evt => {
        window.removeEventListener(evt, handleUserInteraction, opts);
        document.removeEventListener(evt, handleUserInteraction, opts);
      });
    };
  }, [autoFullscreen]);

  // --- Level-Up Detection Effect ---
  useEffect(() => {
    if (level > prevLevel) {
      setShowLevelUp(true);
    }
    setPrevLevel(level);
  }, [level, prevLevel]);

  // --- Global XP Adder Helper ---
  const addXp = (amount: number) => {
    setXpTotal(prev => {
      const nextXp = Math.max(0, prev + amount);
      return nextXp;
    });
  };

  // --- Content Seeder for Demo Content ---
  const loadDemoData = () => {
    const demoDailyTasks: DailyTask[] = [
      { id: 'dt-1', text: 'Limpar a mente e meditar por 15 minutos', completed: false, xpReward: 10, category: 'O Básico' },
      { id: 'dt-2', text: 'Treino de alta intensidade na academia', completed: false, xpReward: 10, category: 'O Básico' },
      { id: 'dt-3', text: 'Leitura de 10 páginas de livro de desenvolvimento', completed: false, xpReward: 10, category: 'Segundo Cérebro' },
      { id: 'dt-4', text: 'Revisar as metas e projetos da semana', completed: false, xpReward: 10, category: 'Metas' },
      { id: 'dt-5', text: 'Registrar despesas e receitas diárias', completed: false, xpReward: 10, category: 'Canalização' }
    ];

    const demoGoals: Goal[] = [
      { 
        id: 'g-1', 
        title: 'Dominar Desenvolvimento Full Stack', 
        actionsDone: 4, 
        actionsTotal: 10, 
        completed: false, 
        xpReward: 100,
        area: 'Carreira',
        createdAt: '2026-07-01',
        deadline: '2026-12-31',
        notes: [
          { id: 'n-g1-1', date: '2026-07-02', text: 'Instalei o Node.js e iniciei estudos do Express.' },
          { id: 'n-g1-2', date: '2026-07-05', text: 'Configurei banco de dados básico e as primeiras rotas.' }
        ]
      },
      { 
        id: 'g-2', 
        title: 'Ler 12 livros de alta performance este ano', 
        actionsDone: 3, 
        actionsTotal: 12, 
        completed: false, 
        xpReward: 100,
        area: 'Hobbies',
        createdAt: '2026-07-02',
        deadline: '2026-12-31',
        notes: [
          { id: 'n-g2-1', date: '2026-07-04', text: 'Terminei a leitura do livro "Hábitos Atômicos" de James Clear.' }
        ]
      },
      { 
        id: 'g-3', 
        title: 'Faturar R$ 5.000 com freelas extras', 
        actionsDone: 3, 
        actionsTotal: 5, 
        completed: false, 
        xpReward: 100,
        area: 'Financeiro',
        createdAt: '2026-07-03',
        deadline: '2026-09-30',
        notes: [
          { id: 'n-g3-1', date: '2026-07-06', text: 'Fechei o primeiro contrato de freela de landing page!' }
        ]
      },
      { 
        id: 'g-4', 
        title: 'Desafio Físico de 30 Dias Ininterruptos', 
        actionsDone: 30, 
        actionsTotal: 30, 
        completed: true, 
        xpReward: 100,
        area: 'Físico',
        createdAt: '2026-06-12',
        completedAt: '2026-07-12',
        notes: [
          { id: 'n-g4-1', date: '2026-06-15', text: 'Primeiros 3 dias de cardio concluídos sem falhar.' },
          { id: 'n-g4-2', date: '2026-07-12', text: 'Desafio completo! 30 dias ininterruptos de treino extremo.' }
        ]
      }
    ];

    const demoFinances: FinanceEntry[] = [
      { id: 'f-1', type: 'income', amount: 4500.00, category: 'Salário', description: 'Salário Tech Dev', date: getTodayDateStr() },
      { id: 'f-2', type: 'income', amount: 1200.00, category: 'Freelance', description: 'Criação de Landing Page', date: getTodayDateStr() },
      { id: 'f-3', type: 'expense', amount: 1800.00, category: 'Moradia', description: 'Aluguel & Condomínio', date: getTodayDateStr() },
      { id: 'f-4', type: 'expense', amount: 350.00, category: 'Alimentação', description: 'Supermercado Semanal', date: getTodayDateStr() },
      { id: 'f-5', type: 'expense', amount: 29.90, category: 'Assinaturas', description: 'MBCplanner Premium', date: getTodayDateStr() },
      { id: 'f-6', type: 'expense', amount: 119.00, category: 'Lazer', description: 'Mensalidade Academia', date: getTodayDateStr() }
    ];

    const demoRoutine: RoutineItem[] = [
      // Segunda-feira (1)
      { id: 'rt-1', dayOfWeek: 1, time: '07:00', task: 'Acordar, luz solar e copo d\'água', completed: true },
      { id: 'rt-2', dayOfWeek: 1, time: '07:30', task: 'Leitura matinal (15 min)', completed: true },
      { id: 'rt-3', dayOfWeek: 1, time: '08:00', task: 'Planejamento diário MBC', completed: true },
      { id: 'rt-4', dayOfWeek: 1, time: '09:00', task: 'Deep Work - Foco inabalável', completed: false },
      { id: 'rt-5', dayOfWeek: 1, time: '14:00', task: 'Estudos / Cursos online', completed: false },
      { id: 'rt-6', dayOfWeek: 1, time: '18:00', task: 'Treino de Força / Academia', completed: false },

      // Terça-feira (2)
      { id: 'rt-7', dayOfWeek: 2, time: '07:00', task: 'Acordar, luz solar e hidratação', completed: false },
      { id: 'rt-8', dayOfWeek: 2, time: '07:30', task: 'Meditação transcendental', completed: false },
      { id: 'rt-9', dayOfWeek: 2, time: '09:00', task: 'Deep Work - Projetos Principais', completed: false },
      { id: 'rt-10', dayOfWeek: 2, time: '18:00', task: 'Corrida ao ar livre', completed: false },

      // Quarta-feira (3)
      { id: 'rt-11', dayOfWeek: 3, time: '07:00', task: 'Acordar e café da manhã leve', completed: false },
      { id: 'rt-12', dayOfWeek: 3, time: '07:30', task: 'Escrita livre / Diário matinal', completed: false },
      { id: 'rt-13', dayOfWeek: 3, time: '09:00', task: 'Reuniões de Alinhamento e Foco', completed: false },
      { id: 'rt-14', dayOfWeek: 3, time: '18:00', task: 'Treino de Força / Academia', completed: false },

      // Quinta-feira (4)
      { id: 'rt-15', dayOfWeek: 4, time: '07:00', task: 'Acordar e Alongamento leve', completed: false },
      { id: 'rt-16', dayOfWeek: 4, time: '07:30', task: 'Revisão de anotações e metas', completed: false },
      { id: 'rt-17', dayOfWeek: 4, time: '09:00', task: 'Deep Work - Escrita e código', completed: false },
      { id: 'rt-18', dayOfWeek: 4, time: '18:00', task: 'Cardio de alta intensidade', completed: false },

      // Sexta-feira (5)
      { id: 'rt-19', dayOfWeek: 5, time: '07:00', task: 'Acordar, luz solar e copo d\'água', completed: true },
      { id: 'rt-20', dayOfWeek: 5, time: '07:30', task: 'Visualização de objetivos', completed: true },
      { id: 'rt-21', dayOfWeek: 5, time: '09:00', task: 'Deep Work - Finalizar tarefas semanais', completed: false },
      { id: 'rt-22', dayOfWeek: 5, time: '15:00', task: 'Organização do Segundo Cérebro', completed: false },
      { id: 'rt-23', dayOfWeek: 5, time: '18:00', task: 'Treino de Força / Academia', completed: false },

      // Sábado (6)
      { id: 'rt-24', dayOfWeek: 6, time: '08:00', task: 'Acordar sem pressa', completed: false },
      { id: 'rt-25', dayOfWeek: 6, time: '09:00', task: 'Café da manhã especial', completed: false },
      { id: 'rt-26', dayOfWeek: 6, time: '10:00', task: 'Atividades de lazer e natureza', completed: false },
      { id: 'rt-27', dayOfWeek: 6, time: '16:00', task: 'Estudo pessoal livre', completed: false },

      // Domingo (0)
      { id: 'rt-28', dayOfWeek: 0, time: '08:30', task: 'Acordar e meditação', completed: false },
      { id: 'rt-29', dayOfWeek: 0, time: '10:00', task: 'Revisão Semanal MBCplanner', completed: false },
      { id: 'rt-30', dayOfWeek: 0, time: '16:00', task: 'Preparar marmitas e rotinas da semana', completed: false },
      { id: 'rt-31', dayOfWeek: 0, time: '21:00', task: 'Higiene do sono', completed: false }
    ];

    const demoCalendarNotes: CalendarNote[] = [
      { 
        id: 'cn-1', 
        date: getTodayDateStr(), 
        title: 'Check-in Geral MBCplanner', 
        content: 'Fazer check in geral e revisar as notas das metas de vida.' 
      },
      { 
        id: 'cn-2', 
        date: (() => {
          const d = new Date();
          d.setDate(d.getDate() - 2);
          return d.toISOString().split('T')[0];
        })(), 
        title: 'Revisão de Finanças Mensais', 
        content: 'Analisar as contas do início do mês, planejar investimentos e aportes na corretora.' 
      },
      { 
        id: 'cn-3', 
        date: (() => {
          const d = new Date();
          d.setDate(d.getDate() - 4);
          return d.toISOString().split('T')[0];
        })(), 
        title: 'Início do Protocolo de Foco', 
        content: 'Primeiro dia de restrição total de dopamina barata e foco máximo no trabalho.' 
      },
      { 
        id: 'cn-4', 
        date: (() => {
          const d = new Date();
          d.setDate(d.getDate() + 1);
          return d.toISOString().split('T')[0];
        })(), 
        title: 'Estudo de Arquitetura Limpa', 
        content: 'Estudar os padrões de projeto de Software Architecture e implementar nas APIs.' 
      }
    ];

    const demoDocuments: ArchivedDocument[] = [
      { id: 'doc-1', name: 'contrato_freelance_desenvolvimento.pdf', category: 'Contratos', date: '2026-07-09', size: '1.2 MB' },
      { id: 'doc-2', name: 'comprovante_aluguel_julho.pdf', category: 'Financeiro', date: '2026-07-05', size: '340 KB' },
      { id: 'doc-3', name: 'plano_de_estudos_segundo_cerebro.pdf', category: 'Estudos', date: '2026-07-01', size: '2.1 MB' },
      { id: 'doc-4', name: 'certidao_quitacao_eleitoral.pdf', category: 'Pessoal', date: '2026-06-15', size: '150 KB' }
    ];

    const demoNotes: Note[] = [
      { 
        id: 'n-1', 
        title: 'Metas MBCplanner 2026', 
        content: 'Organização geral das metas do ano:\n1. Disciplina inabalável com Alfredo.\n2. Evitar os gatilhos do Beto.\n3. Registro diário financeiro.', 
        tags: ['Metas', 'MBC'], 
        updatedAt: '10/07/2026' 
      },
      { 
        id: 'n-2', 
        title: 'Estudo de Finanças Pessoais', 
        content: 'Anotações do livro "Pai Rico Pai Pobre" e estratégias de aportes mensais:\n- Pagar-se primeiro (guardar 20%).\n- Ativos vs Passivos.', 
        tags: ['Estudos', 'Financeiro'], 
        updatedAt: '09/07/2026' 
      },
      { 
        id: 'n-3', 
        title: 'Protocolo de Alta Performance', 
        content: 'Regras de ouro:\n- Sem celular na primeira hora do dia.\n- Banho frio matinal para foco imediato.\n- Bloqueio total de redes sociais de 09:00 às 17:00.\n- Revisão diária à noite com reflexão Alfredo vs Beto.', 
        tags: ['Rotina', 'Foco'], 
        updatedAt: '08/07/2026' 
      }
    ];

    setDailyTasks(demoDailyTasks);
    setGoals(demoGoals);
    setFinances(demoFinances);
    setRoutine(demoRoutine);
    setCalendarNotes(demoCalendarNotes);
    setDocuments(demoDocuments);
    setNotes(demoNotes);

    localStorage.setItem('mbc_dailyTasks', JSON.stringify(demoDailyTasks));
    localStorage.setItem('mbc_goals', JSON.stringify(demoGoals));
    localStorage.setItem('mbc_finances', JSON.stringify(demoFinances));
    localStorage.setItem('mbc_routine', JSON.stringify(demoRoutine));
    localStorage.setItem('mbc_calendarNotes', JSON.stringify(demoCalendarNotes));
    localStorage.setItem('mbc_documents', JSON.stringify(demoDocuments));
    localStorage.setItem('mbc_notes', JSON.stringify(demoNotes));

    addXp(150); // Reward substantial XP for initialization
  };

  // --- Content Tab Router ---
  const renderTabContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return (
          <DashboardView 
            userName={userName}
            setUserName={setUserName}
            xpTotal={xpTotal}
            streak={streak}
            level={level}
            activeGoalsCount={goals.filter(g => !g.completed).length}
            completedGoalsCount={goals.filter(g => g.completed).length}
            goals={goals}
            dailyTasks={dailyTasks}
            setDailyTasks={setDailyTasks}
            setActiveTab={setActiveTab}
            addXp={addXp}
            loadDemoData={loadDemoData}
            finances={finances}
            habits={habits}
            setHabits={setHabits}
            routine={routine}
            customCards={customCards}
            setCustomCards={setCustomCards}
            onOpenStreakHub={() => setIsStreakHubOpen(true)}
            onOpenRankingModal={() => setActiveTab('classificacao')}
            isChecklistOpen={dashboardChecklistOpen}
            setIsChecklistOpen={setDashboardChecklistOpen}
            isHabitsOpen={dashboardHabitsOpen}
            setIsHabitsOpen={setDashboardHabitsOpen}
            isGoalsOpen={dashboardGoalsOpen}
            setIsGoalsOpen={setDashboardGoalsOpen}
            isFinancesOpen={dashboardFinancesOpen}
            setIsFinancesOpen={setDashboardFinancesOpen}
          />
        );
      case 'classificacao':
      case 'ligas':
        return (
          <LeagueRankingView
            xpTotal={xpTotal}
            level={level}
            userName={userName}
            addXp={addXp}
            onClose={() => setActiveTab('dashboard')}
          />
        );
      case 'checklist':
        return (
          <ChecklistView 
            dailyTasks={dailyTasks}
            setDailyTasks={setDailyTasks}
            routine={routine}
            setRoutine={setRoutine}
            streak={streak}
            onOpenStreakHub={() => setIsStreakHubOpen(true)}
            addXp={addXp}
            xpTotal={xpTotal}
            bookTracker={bookTracker}
            setBookTracker={setBookTracker}
            bibleTracker={bibleTracker}
            setBibleTracker={setBibleTracker}
            activeTab={checklistActiveTab}
            setActiveTab={setChecklistActiveTab}
            gridRoutine={gridRoutine}
            setGridRoutine={setGridRoutine}
            books={books}
            setBooks={setBooks}
            weeklyReviews={weeklyReviews}
            setWeeklyReviews={setWeeklyReviews}
            monthlyReviews={monthlyReviews}
            setMonthlyReviews={setMonthlyReviews}
            calendarNotes={calendarNotes}
            setCalendarNotes={setCalendarNotes}
            showDateSelector={showChecklistDateSelector}
            lastDailyResetDate={lastDailyResetDate}
            setLastDailyResetDate={setLastDailyResetDate}
            habits={habits}
            setHabits={setHabits}
          />
        );
      case 'rotina':
        return (
          <ChecklistView 
            dailyTasks={dailyTasks}
            setDailyTasks={setDailyTasks}
            routine={routine}
            setRoutine={setRoutine}
            streak={streak}
            onOpenStreakHub={() => setIsStreakHubOpen(true)}
            addXp={addXp}
            xpTotal={xpTotal}
            bookTracker={bookTracker}
            setBookTracker={setBookTracker}
            bibleTracker={bibleTracker}
            setBibleTracker={setBibleTracker}
            activeTab={checklistActiveTab === 'checklist' ? 'rotina' : checklistActiveTab}
            setActiveTab={setChecklistActiveTab}
            gridRoutine={gridRoutine}
            setGridRoutine={setGridRoutine}
            books={books}
            setBooks={setBooks}
            weeklyReviews={weeklyReviews}
            setWeeklyReviews={setWeeklyReviews}
            monthlyReviews={monthlyReviews}
            setMonthlyReviews={setMonthlyReviews}
            calendarNotes={calendarNotes}
            setCalendarNotes={setCalendarNotes}
            showDateSelector={showChecklistDateSelector}
            lastDailyResetDate={lastDailyResetDate}
            setLastDailyResetDate={setLastDailyResetDate}
            habits={habits}
            setHabits={setHabits}
          />
        );
      case 'habitos':
        return (
          <ChecklistView 
            dailyTasks={dailyTasks}
            setDailyTasks={setDailyTasks}
            routine={routine}
            setRoutine={setRoutine}
            streak={streak}
            onOpenStreakHub={() => setIsStreakHubOpen(true)}
            addXp={addXp}
            xpTotal={xpTotal}
            bookTracker={bookTracker}
            setBookTracker={setBookTracker}
            bibleTracker={bibleTracker}
            setBibleTracker={setBibleTracker}
            activeTab="habitos"
            setActiveTab={setChecklistActiveTab}
            gridRoutine={gridRoutine}
            setGridRoutine={setGridRoutine}
            books={books}
            setBooks={setBooks}
            weeklyReviews={weeklyReviews}
            setWeeklyReviews={setWeeklyReviews}
            monthlyReviews={monthlyReviews}
            setMonthlyReviews={setMonthlyReviews}
            calendarNotes={calendarNotes}
            setCalendarNotes={setCalendarNotes}
            showDateSelector={showChecklistDateSelector}
            lastDailyResetDate={lastDailyResetDate}
            setLastDailyResetDate={setLastDailyResetDate}
            habits={habits}
            setHabits={setHabits}
          />
        );
      case 'metas':
        return (
          <GoalsView 
            goals={goals}
            setGoals={setGoals}
            timelines={timelines}
            setTimelines={setTimelines}
            addXp={addXp}
            bookTracker={bookTracker}
            setBookTracker={setBookTracker}
            bibleTracker={bibleTracker}
            setBibleTracker={setBibleTracker}
            areaImages={areaImages}
            setAreaImages={setAreaImages}
            viewMode={goalsViewMode}
            setViewMode={setGoalsViewMode}
            selectedArea={goalsSelectedArea}
            setSelectedArea={setGoalsSelectedArea}
            visionBoardCards={visionBoardCards}
            setVisionBoardCards={setVisionBoardCards}
            cardsPerRow={cardsPerRow}
            setCardsPerRow={setCardsPerRow}
          />
        );
      case 'financas':
        return (
          <FinancesView 
            finances={finances}
            setFinances={setFinances}
            addXp={addXp}
            bankAccounts={bankAccounts}
            setBankAccounts={setBankAccounts}
            creditCards={creditCards}
            setCreditCards={setCreditCards}
            debtItems={debtItems}
            setDebtItems={setDebtItems}
            budgetLimits={budgetLimits}
            setBudgetLimits={setBudgetLimits}
            portfolioAssets={portfolioAssets}
            setPortfolioAssets={setPortfolioAssets}
            investmentTransactions={investmentTransactions}
            setInvestmentTransactions={setInvestmentTransactions}
            activeTab={financesMainSubtab}
            setActiveTab={setFinancesMainSubtab}
            isBudgetOpen={isFinancesBudgetOpen}
            setIsBudgetOpen={setIsFinancesBudgetOpen}
            isEntriesOpen={isFinancesEntriesOpen}
            setIsEntriesOpen={setIsFinancesEntriesOpen}
            sheetOverrides={sheetOverrides}
            setSheetOverrides={setSheetOverrides}
          />
        );
      case 'calendario':
        return (
          <CalendarView 
            notes={calendarNotes}
            setNotes={setCalendarNotes}
            addXp={addXp}
            dailyTasks={dailyTasks}
            setDailyTasks={setDailyTasks}
            gridRoutine={gridRoutine}
            monthlyReviews={monthlyReviews}
            setMonthlyReviews={setMonthlyReviews}
            weeklyReviews={weeklyReviews}
            setWeeklyReviews={setWeeklyReviews}
            bookTracker={bookTracker}
            setBookTracker={setBookTracker}
            bibleTracker={bibleTracker}
            setBibleTracker={setBibleTracker}
            books={books}
            setBooks={setBooks}
            routine={routine}
            futureEvents={futureEvents}
            setFutureEvents={setFutureEvents}
            userName={userName}
            setUserName={setUserName}
            userPhoto={userPhoto}
            setUserPhoto={setUserPhoto}
            userEmail={userEmail}
            setUserEmail={setUserEmail}
            freeEditMode={freeEditMode}
            masterTemplates={masterTemplates}
            setMasterTemplates={setMasterTemplates}
          />
        );
      case 'anuais':
        return (
          <AnuaisView 
            notes={calendarNotes}
            setNotes={setCalendarNotes}
            addXp={addXp}
            dailyTasks={dailyTasks}
            setDailyTasks={setDailyTasks}
            gridRoutine={gridRoutine}
            monthlyReviews={monthlyReviews}
            setMonthlyReviews={setMonthlyReviews}
            weeklyReviews={weeklyReviews}
            setWeeklyReviews={setWeeklyReviews}
            bookTracker={bookTracker}
            setBookTracker={setBookTracker}
            bibleTracker={bibleTracker}
            setBibleTracker={setBibleTracker}
            routine={routine}
            goals={goals}
            finances={finances}
            books={books}
            setBooks={setBooks}
            freeEditMode={freeEditMode}
            masterTemplates={masterTemplates}
            setMasterTemplates={setMasterTemplates}
            isMonthlyReviewOpen={isMonthlyReviewOpen}
            setIsMonthlyReviewOpen={setIsMonthlyReviewOpen}
            isWeeklyReviewsOpen={isWeeklyReviewsOpen}
            setIsWeeklyReviewsOpen={setIsWeeklyReviewsOpen}
            yearlyImages={yearlyImages}
            setYearlyImages={setYearlyImages}
            overviewYears={overviewYears}
            setOverviewYears={setOverviewYears}
          />
        );
      case 'projetos':
        return (
          <ProjetosView 
            projects={projects}
            setProjects={setProjects}
            addXp={addXp}
            userName={userName}
            userPhoto={userPhoto}
          />
        );
      case 'documentos':
        return (
          <DocumentsView 
            documents={documents}
            setDocuments={setDocuments}
            addXp={addXp}
          />
        );
      case 'notas':
        return (
          <NotesView 
            notes={notes}
            setNotes={setNotes}
            addXp={addXp}
            freeEditMode={freeEditMode}
          />
        );
      case 'lembretes':
        return (
          <RemindersView 
            reminders={reminders}
            setReminders={setReminders}
            addXp={addXp}
            initialMode={reminderInitialMode}
            setInitialMode={setReminderInitialMode}
          />
        );
      case 'resumo':
        return (
          <LifeSummaryView 
            state={lifeSummary}
            onChange={setLifeSummary}
            addXp={addXp}
            goals={goals}
            setGoals={setGoals}
            timelines={timelines}
            setTimelines={setTimelines}
            bookTracker={bookTracker}
            setBookTracker={setBookTracker}
            bibleTracker={bibleTracker}
            setBibleTracker={setBibleTracker}
            areaImages={areaImages}
            setAreaImages={setAreaImages}
            activeArea={lifeSummaryActiveArea}
            setActiveArea={setLifeSummaryActiveArea}
          />
        );
      case 'perfil':
        return (
          <ProfileView 
            userName={userName}
            setUserName={setUserName}
            userPhoto={userPhoto}
            setUserPhoto={setUserPhoto}
            userHandle={userHandle}
            setUserHandle={setUserHandle}
            userEmail={userEmail}
            setUserEmail={setUserEmail}
            xpTotal={xpTotal}
            streak={streak}
            level={level}
            addXp={addXp}
            goals={goals}
            dailyTasks={dailyTasks}
            finances={finances}
            habits={habits}
            routine={routine}
            userBio={userBio}
            setUserBio={setUserBio}
            userArchetype={userArchetype}
            setUserArchetype={setUserArchetype}
            focusTrainingDate={focusTrainingDate}
            setFocusTrainingDate={setFocusTrainingDate}
            onOpenStreakHub={() => setIsStreakHubOpen(true)}
            onOpenRankingModal={() => setActiveTab('classificacao')}
          />
        );
      case 'configuracoes':
        return (
          <SettingsView 
            userName={userName}
            setUserName={setUserName}
            userPhoto={userPhoto}
            setUserPhoto={setUserPhoto}
            userHandle={userHandle}
            setUserHandle={setUserHandle}
            userEmail={userEmail}
            setUserEmail={setUserEmail}
            userPassword={userPassword}
            setUserPassword={setUserPassword}
            freeEditMode={freeEditMode}
            setFreeEditMode={setFreeEditMode}
            autoFullscreen={autoFullscreen}
            setAutoFullscreen={setAutoFullscreen}
            showDateSelector={showChecklistDateSelector}
            setShowDateSelector={setShowChecklistDateSelector}
            mobileSlideTransition={mobileSlideTransition}
            setMobileSlideTransition={setMobileSlideTransition}
            mobileNavbarMode={mobileNavbarMode}
            setMobileNavbarMode={setMobileNavbarMode}
            setAccountDeactivated={setAccountDeactivated}
            onLogout={handleLogout}
            syncKey={syncKey}
            syncStatus={syncStatus}
            connectSyncKey={connectSyncKey}
            disconnectSync={disconnectSync}
            addXp={addXp}
            currentScreen={settingsScreen}
            setCurrentScreen={setSettingsScreen}
            screenHistory={settingsHistory}
            setScreenHistory={setSettingsHistory}
            appLockEnabled={appLockEnabled}
            setAppLockEnabled={setAppLockEnabled}
            appLockPassword={appLockPassword}
            setAppLockPassword={setAppLockPassword}
            appLockTimeout={appLockTimeout}
            setAppLockTimeout={setAppLockTimeout}
            isAppLocked={isAppLocked}
            setIsAppLocked={setIsAppLocked}
            appLockBiometricEnabled={appLockBiometricEnabled}
            setAppLockBiometricEnabled={setAppLockBiometricEnabled}
            activeThemePreset={activeThemePreset}
            setActiveThemePreset={setActiveThemePreset}
            customThemeHex={customThemeHex}
            setCustomThemeHex={setCustomThemeHex}
            language={language}
            setLanguage={setLanguage}
            backgroundNotificationsEnabled={backgroundNotificationsEnabled}
            setBackgroundNotificationsEnabled={setBackgroundNotificationsEnabled}
            dailyWorkspaceSettings={dailyWorkspaceSettings}
            setDailyWorkspaceSettings={setDailyWorkspaceSettings}
            loadingScreenVerticalImage={loadingScreenVerticalImage}
            setLoadingScreenVerticalImage={(img) => {
              setLoadingScreenVerticalImage(img);
              localStorage.setItem('mbc_loading_screen_vertical_image', img);
            }}
            loadingScreenHorizontalImage={loadingScreenHorizontalImage}
            setLoadingScreenHorizontalImage={(img) => {
              setLoadingScreenHorizontalImage(img);
              localStorage.setItem('mbc_loading_screen_horizontal_image', img);
            }}
            onPreviewLoadingScreen={() => {
              setIsUnlockLoading(false);
              setIsSyncLoading(true);
            }}
            lockScreenDesktopImage={lockScreenDesktopImage}
            setLockScreenDesktopImage={(img) => {
              setLockScreenDesktopImage(img);
              if (img) localStorage.setItem('mbc_lock_screen_desktop_image', img);
              else localStorage.removeItem('mbc_lock_screen_desktop_image');
            }}
            lockScreenMobileImage={lockScreenMobileImage}
            setLockScreenMobileImage={(img) => {
              setLockScreenMobileImage(img);
              if (img) localStorage.setItem('mbc_lock_screen_mobile_image', img);
              else localStorage.removeItem('mbc_lock_screen_mobile_image');
            }}
          />
        );
      default:
        return <div className="text-white text-center py-12">Tab não encontrada.</div>;
    }
  };

  if (isAppLocked) {
    return (
      <LockScreen 
        userName={userName}
        userPhoto={userPhoto}
        correctPassword={appLockPassword}
        appLockBiometricEnabled={appLockBiometricEnabled}
        lockScreenDesktopImage={lockScreenDesktopImage}
        lockScreenMobileImage={lockScreenMobileImage}
        onUnlock={() => {
          setIsAppLocked(false);
          setIsUnlockLoading(false);
          setIsSyncLoading(false);
        }}
      />
    );
  }

  // If user is not logged in or auth modal is open, display ONLY the full-screen standalone Auth interface
  if (!currentUser || isAuthModalOpen) {
    return (
      <div className="fixed inset-0 w-full h-full overflow-hidden bg-black">
        <OfflineNotificationBanner />
        <AuthModal 
          isOpen={true} 
          onSuccess={handleAuthSuccess} 
        />
      </div>
    );
  }

  // If in brief synchronization / loading state (after unlock or initial startup)
  if (isSyncLoading) {
    return (
      <AppLoadingScreen 
        userName={userName}
        userPhoto={userPhoto}
        loadingScreenVerticalImage={loadingScreenVerticalImage}
        loadingScreenHorizontalImage={loadingScreenHorizontalImage}
        syncStatus={syncStatus}
        isUnlockFlow={isUnlockLoading}
        minDurationMs={1400}
        onComplete={() => {
          setIsSyncLoading(false);
          setIsUnlockLoading(false);
        }}
      />
    );
  }

  if (accountDeactivated) {
    return (
      <div className="min-h-screen bg-[#040405] text-zinc-300 font-sans flex flex-col items-center justify-center p-6 relative overflow-hidden">
        {/* Glow backgrounds */}
        <div className="absolute top-1/4 left-1/4 w-[400px] h-[400px] bg-red-600/5 rounded-full blur-[100px] pointer-events-none" />
        <div className="absolute bottom-1/4 right-1/4 w-[400px] h-[400px] bg-orange-600/5 rounded-full blur-[100px] pointer-events-none" />
        
        <div className="max-w-md w-full bg-[#09090b]/60 border border-zinc-900 rounded-3xl p-8 text-center relative z-10 shadow-2xl space-y-6">
          <div className="h-16 w-16 bg-red-500/10 border border-red-500/20 rounded-2xl flex items-center justify-center text-red-500 mx-auto animate-pulse">
            <AlertTriangle className="h-8 w-8" />
          </div>
          
          <div className="space-y-2">
            <h1 className="text-xl font-black text-white uppercase tracking-wider font-mono">Conta Desativada</h1>
            <p className="text-xs text-zinc-500 font-mono">Esta conta foi desativada temporariamente conforme solicitado.</p>
          </div>
          
          <p className="text-xs text-zinc-400 leading-relaxed font-mono">
            Seus dados locais, hábitos e metas de evolução pessoal permanecem totalmente preservados nos nossos servidores locais e cloud. Você pode retornar à jornada de alta performance a qualquer momento.
          </p>
          
          <div className="pt-4 border-t border-zinc-900/60">
            <button
              onClick={() => {
                setAccountDeactivated(false);
                localStorage.setItem('mbc_accountDeactivated', 'false');
                addXp(20);
              }}
              className="w-full py-3 bg-gradient-to-r from-orange-500 to-amber-600 hover:from-orange-600 hover:to-amber-700 text-xs font-bold uppercase tracking-wider text-white rounded-xl shadow-lg shadow-orange-500/10 active:scale-95 transition-all"
            >
              Reativar Minha Conta
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div id="main-app-container" className="flex flex-col lg:flex-row min-h-screen bg-[#040405] text-zinc-300 font-sans">
      {/* PWA Offline / Reconnected Banner */}
      <OfflineNotificationBanner />
      
      {/* 1. Dynamic HUD Navigation (Sidebar and mobile header integrated) */}
      <Sidebar 
        activeTab={activeTab} 
        setActiveTab={setActiveTab} 
        xpTotal={xpTotal}
        streak={streak}
        level={level}
        pinned={sidebarPinned}
        setPinned={(p) => {
          setSidebarPinned(p);
          localStorage.setItem('mbc_sidebarPinned', String(p));
        }}
        syncKey={syncKey}
        syncStatus={syncStatus}
        connectSyncKey={connectSyncKey}
        disconnectSync={disconnectSync}
        userName={userName}
        userPhoto={userPhoto}
        onLockApp={() => setIsAppLocked(true)}
        appLockEnabled={appLockEnabled && appLockPassword !== ''}
        onLogout={handleLogout}
        currentUser={currentUser}
        onAddReminder={(newRem) => setReminders(prev => [newRem, ...prev])}
        onOpenStreakHub={() => setIsStreakHubOpen(true)}
        onOpenRankingModal={() => setIsRankingModalOpen(true)}
        mobileNavbarMode={mobileNavbarMode}
      />

      {/* 2. Main Workspace Area (responsive margin/padding for the fixed desktop HUD and mobile header) */}
      <main 
        id="workspace-area" 
        className={`flex-1 overflow-x-hidden min-h-screen pt-16 pb-28 lg:pt-8 lg:pb-8 transition-all duration-300 ${
          sidebarPinned ? 'lg:pl-64' : 'lg:pl-[76px]'
        }`}
      >
        {/* Background visual orange glow circles (matches the sleek premium layout) */}
        <div className="absolute top-0 right-1/4 w-[500px] h-[500px] bg-orange-600/5 rounded-full blur-[120px] pointer-events-none" />
        <div className="absolute bottom-1/4 left-1/4 w-[400px] h-[400px] bg-amber-600/5 rounded-full blur-[100px] pointer-events-none" />

        <div 
          className={`mx-auto py-8 relative overflow-x-hidden transition-all duration-300 ${
            activeTab === 'classificacao' || activeTab === 'ligas'
              ? 'w-full max-w-full px-2 sm:px-4 lg:px-6'
              : 'max-w-6xl px-4 sm:px-6 lg:px-8'
          }`}
          onTouchStart={handleTouchStart}
          onTouchEnd={handleTouchEnd}
        >
          <AnimatePresence mode="popLayout" custom={slideDirection} initial={false}>
            <motion.div
              key={activeTab}
              custom={slideDirection}
              variants={
                isMobile && mobileSlideTransition
                  ? {
                      enter: (dir: number) => ({
                        x: dir > 0 ? '100%' : '-100%',
                        opacity: 0,
                        scale: 0.98,
                      }),
                      center: {
                        x: '0%',
                        opacity: 1,
                        scale: 1,
                      },
                      exit: (dir: number) => ({
                        x: dir > 0 ? '-100%' : '100%',
                        opacity: 0,
                        scale: 0.98,
                      }),
                    }
                  : {
                      enter: { opacity: 0, y: 12 },
                      center: { opacity: 1, y: 0 },
                      exit: { opacity: 0, y: -12 },
                    }
              }
              initial="enter"
              animate="center"
              exit="exit"
              transition={
                isMobile && mobileSlideTransition
                  ? {
                      type: "spring",
                      stiffness: 340,
                      damping: 32,
                      mass: 0.75,
                    }
                  : {
                      duration: 0.22,
                      ease: [0.16, 1, 0.3, 1],
                    }
              }
              className="w-full"
            >
              {renderTabContent()}
            </motion.div>
          </AnimatePresence>
        </div>
      </main>

      {/* 4. Level-Up Glowing Celebration Dialog (Image 5 + High Gamification Style) */}
      <AnimatePresence>
        {showLevelUp && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div 
              className="fixed inset-0 bg-black/90 backdrop-blur-md"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowLevelUp(false)}
            />

            <motion.div 
              className="bg-zinc-950 border-2 border-orange-500 rounded-2xl p-8 max-w-sm w-full text-center relative overflow-hidden z-50 shadow-[0_0_50px_rgba(249,115,22,0.3)]"
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.8, opacity: 0 }}
            >
              {/* Orange light beam animation */}
              <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-orange-500 via-amber-500 to-orange-500" />
              
              <div className="mx-auto w-16 h-16 bg-orange-500/10 rounded-full flex items-center justify-center border border-orange-500/30 mb-4 animate-bounce">
                <Trophy className="h-8 w-8 text-orange-500 fill-orange-500/10" />
              </div>

              <h2 className="text-2xl font-black text-white tracking-tight uppercase">
                LEVEL UP!
              </h2>
              <p className="text-xs text-orange-500 font-bold font-mono tracking-widest uppercase mt-1">
                Você subiu de nível
              </p>

              <div className="my-6 bg-zinc-900 border border-zinc-800 p-4 rounded-xl">
                <span className="text-xs text-gray-400 block font-semibold uppercase">Novo Nível</span>
                <span className="text-5xl font-black text-white font-mono mt-1 block">
                  {level}
                </span>
                <p className="text-[10px] text-gray-500 font-mono mt-2">
                  Total de {xpTotal} XP Acumulados
                </p>
              </div>

              <p className="text-xs text-gray-400">
                Continue cumprindo suas tarefas diárias inegociáveis, gerenciando suas finanças e conquistando metas para progredir ainda mais!
              </p>

              <button
                onClick={() => setShowLevelUp(false)}
                className="w-full bg-orange-500 hover:bg-orange-600 text-white font-bold text-xs py-3 rounded-lg mt-6 shadow-[0_4px_12px_rgba(249,115,22,0.4)] transition-all uppercase tracking-wider"
              >
                Continuar Jornada
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Real-time sync notification toast */}
      <AnimatePresence>
        {showSyncToast && (
          <motion.div
            initial={{ opacity: 0, y: 50, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            transition={{ duration: 0.3, ease: 'easeOut' }}
            className="fixed bottom-6 right-6 z-50 max-w-sm w-[calc(100vw-3rem)] bg-[#070709] rounded-2xl p-4 backdrop-blur-md"
            style={{
              borderColor: 'var(--color-orange-500, #f97316)',
              borderWidth: '1.5px',
              borderStyle: 'solid',
              boxShadow: '0 0 25px var(--accent-glow, rgba(249, 115, 22, 0.3))'
            }}
          >
            <div className="flex items-center gap-4">
              <div 
                className="p-2.5 rounded-xl text-white flex items-center justify-center shrink-0"
                style={{
                  backgroundColor: 'var(--accent-glow-subtle, rgba(249, 115, 22, 0.15))',
                  borderColor: 'var(--color-orange-400, #fb923c)',
                  borderWidth: '1px',
                  borderStyle: 'solid',
                  boxShadow: '0 0 12px var(--accent-glow, rgba(249, 115, 22, 0.2))'
                }}
              >
                <Cloud 
                  className="h-5 w-5 animate-pulse" 
                  style={{ color: 'var(--color-orange-400, #fb923c)' }}
                />
              </div>
              <div className="flex-1 min-w-0">
                <h4 className="text-xs font-black text-white tracking-widest uppercase font-sans">
                  DISPOSITIVO SINCRONIZADO
                </h4>
                <p className="text-[11px] text-zinc-400 mt-0.5 leading-relaxed">
                  Mudanças recebidas em tempo real de outro dispositivo.
                </p>
              </div>
              <button
                onClick={() => setShowSyncToast(false)}
                className="text-zinc-500 hover:text-zinc-300 p-1 rounded-lg transition-colors shrink-0 cursor-pointer"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Central de Ofensivas & Congelamento Modal (Sugestões 1 & 2) */}
      <StreakHubModal
        isOpen={isStreakHubOpen}
        onClose={() => setIsStreakHubOpen(false)}
        masterStreak={streak}
        onUpdateMasterStreak={setStreak}
        onNavigateToTab={(tabId) => setActiveTab(tabId)}
        xpTotal={xpTotal}
        addXp={addXp}
      />

      {/* Central de Ligas e Classificação (Duolingo Style Ranking) */}
      <LeagueRankingModal
        isOpen={isRankingModalOpen}
        onClose={() => setIsRankingModalOpen(false)}
        xpTotal={xpTotal}
        level={level}
        userName={userName}
        addXp={addXp}
      />
    </div>
  );
}
