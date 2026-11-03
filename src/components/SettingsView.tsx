import React, { useState, useEffect } from 'react';
import { requestNotificationPermission, sendSystemNotification } from '../lib/notificationHelper';
import { NotificationSettings } from './NotificationSettings';
import { 
  User, 
  Lock, 
  ArrowUpDown,
  Shield, 
  Bell, 
  Maximize, 
  ChevronRight, 
  ArrowLeft, 
  Search, 
  Download, 
  Trash2, 
  LogOut, 
  Eye, 
  EyeOff, 
  Check, 
  AlertTriangle,
  Cloud,
  CheckCircle,
  HelpCircle,
  Smartphone,
  Sparkles,
  RefreshCw,
  Image as ImageIcon,
  LogIn,
  X,
  Upload,
  Laptop,
  QrCode,
  Clock,
  Globe,
  Edit2,
  Monitor,
  ShieldCheck,
  Sliders,
  CheckCircle2,
  Palette,
  Fingerprint,
  Clipboard,
  Database,
  Play,
  FolderKanban,
  Layers,
  Grid,
  Sun,
  Moon
} from 'lucide-react';
import { subscribeToMutationQueue, processMutationQueue, clearAllMutations, QueueStatus } from '../lib/indexedDbQueue';
import { isPlatformAuthenticatorAvailable, verifyBiometric } from '../utils/biometricAuth';
import { Calendar } from 'lucide-react';
import { ReviewReminderModal } from './ReviewReminderModal';
import { 
  getReviewRemindersSettings, 
  saveReviewRemindersSettings, 
  getWeeklyReviewDayLabel, 
  getMonthlyReviewTimingLabel, 
  ReviewRemindersSettings 
} from '../utils/reviewReminderUtils';
import defaultLockBg from '../assets/images/1271888.jpg';
import ColorSchemeModal from './ColorSchemeModal';
import { THEME_PRESETS, applyThemeColor, applyDarkBackgroundStyle } from '../utils/themeColors';
import type { BackgroundAtmosphereMode, BackgroundAtmosphereIntensity } from './CinematicBackground';
import { motion, AnimatePresence } from 'motion/react';
import QRCode from 'qrcode';
import { setSupabaseConfig, testSupabaseConnection } from '../lib/supabase';
import { authorizeQrLoginSession, createQrLoginSession, checkQrLoginSessionStatus, QrLoginSession } from '../lib/auth';
import { saveGoogleOAuthTokens, clearGoogleOAuthSession, refreshGoogleAccessToken, getValidGoogleAccessToken } from '../utils/googleToken';
import {
  ConnectedDevice,
  syncAndRegisterCurrentDevice,
  fetchAccountDevices,
  updateConnectedDevice,
  removeConnectedDevice,
  saveAccountDevices,
  getAccountKey,
  formatLastActiveTime,
  detectDeviceDetails
} from '../lib/devices';

export type { ConnectedDevice };

interface SettingsViewProps {
  userName: string;
  setUserName: (name: string) => void;
  userPhoto: string;
  setUserPhoto: (photo: string) => void;
  userHandle: string;
  setUserHandle: (handle: string) => void;
  userEmail: string;
  setUserEmail: (email: string) => void;
  userPassword: string;
  setUserPassword: (pass: string) => void;
  
  // Free Edit Mode
  freeEditMode?: boolean;
  setFreeEditMode?: (mode: boolean) => void;

  // Fullscreen
  autoFullscreen: boolean;
  setAutoFullscreen: (auto: boolean) => void;
  
  // Date Selector in Missões Diárias
  showDateSelector?: boolean;
  setShowDateSelector?: (show: boolean) => void;

  // Mobile Slide Animation
  mobileSlideTransition?: boolean;
  setMobileSlideTransition?: (enabled: boolean) => void;

  // Mobile Navbar Mode (Fixed vs Flexible)
  mobileNavbarMode?: 'fixed' | 'flexible';
  setMobileNavbarMode?: (mode: 'fixed' | 'flexible') => void;

  // Mobile Navbar Shape (Oval vs Reta)
  mobileNavbarShape?: 'oval' | 'reta';
  setMobileNavbarShape?: (shape: 'oval' | 'reta') => void;

  // Card Glow Effect
  cardGlowEnabled?: boolean;
  setCardGlowEnabled?: (enabled: boolean) => void;

  // Theme Color Customization
  activeThemePreset?: string;
  setActiveThemePreset?: (preset: string) => void;
  customThemeHex?: string;
  setCustomThemeHex?: (hex: string) => void;

  // System Theme Mode (Dark vs Light - Architectural Mode)
  themeMode?: 'dark' | 'light';
  setThemeMode?: (mode: 'dark' | 'light') => void;

  // Cinematic Luxury Background Atmosphere
  backgroundAtmosphere?: BackgroundAtmosphereMode;
  setBackgroundAtmosphere?: (mode: BackgroundAtmosphereMode) => void;
  backgroundIntensity?: BackgroundAtmosphereIntensity;
  setBackgroundIntensity?: (intensity: BackgroundAtmosphereIntensity) => void;
  backgroundGridEnabled?: boolean;
  setBackgroundGridEnabled?: (enabled: boolean) => void;
  backgroundAnimated?: boolean;
  setBackgroundAnimated?: (animated: boolean) => void;
  
  // Account Status
  setAccountDeactivated: (deactivated: boolean) => void;
  onLogout?: () => void;
  
  // Sync Profile
  syncKey: string;
  syncStatus: string;
  connectSyncKey: (key: string) => Promise<void>;
  disconnectSync: () => Promise<void>;
  
  // XP & Feedback
  addXp: (xp: number) => void;
  currentScreen?: SettingsScreen;
  setCurrentScreen?: (screen: SettingsScreen) => void;
  screenHistory?: SettingsScreen[];
  setScreenHistory?: React.Dispatch<React.SetStateAction<SettingsScreen[]>>;

  // App Lock
  appLockEnabled: boolean;
  setAppLockEnabled: (enabled: boolean) => void;
  appLockPassword?: string;
  setAppLockPassword: (password: string) => void;
  appLockTimeout: number;
  setAppLockTimeout: (timeout: number) => void;
  isAppLocked: boolean;
  setIsAppLocked: (locked: boolean) => void;
  appLockBiometricEnabled?: boolean;
  setAppLockBiometricEnabled?: (enabled: boolean) => void;
  language?: string;
  setLanguage?: (lang: string) => void;
  backgroundNotificationsEnabled?: boolean;
  setBackgroundNotificationsEnabled?: (enabled: boolean) => void;
  dailyWorkspaceSettings?: { enabled: boolean; time: string };
  setDailyWorkspaceSettings?: (settings: { enabled: boolean; time: string }) => void;

  // Custom Loading / Splash Screen Customization
  loadingScreenVerticalImage?: string;
  setLoadingScreenVerticalImage?: (img: string) => void;
  loadingScreenHorizontalImage?: string;
  setLoadingScreenHorizontalImage?: (img: string) => void;
  onPreviewLoadingScreen?: () => void;

  // Custom Lock Screen Backgrounds (Desktop & Mobile)
  lockScreenDesktopImage?: string;
  setLockScreenDesktopImage?: (img: string) => void;
  lockScreenMobileImage?: string;
  setLockScreenMobileImage?: (img: string) => void;
}

type SettingsScreen = 
  | 'main' 
  | 'sua_conta' 
  | 'informacoes_conta' 
  | 'alterar_senha' 
  | 'desativar_conta' 
  | 'seguranca' 
  | 'dispositivos_conectados'
  | 'notificacoes' 
  | 'exibicao';

const AVATAR_PRESETS = [
  'https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?q=80&w=150', // Atleta clássico
  'https://images.unsplash.com/photo-1608155686393-8fdd966d784d?q=80&w=150', // Escultura Netuno
  'https://images.unsplash.com/photo-1584290860587-211bfb66aa0f?q=80&w=150', // Detalhe ouro clássico
  'https://images.unsplash.com/photo-1579783902614-a3fb3927b6a5?q=80&w=150', // Pintura renascentista
  'https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=150', // Retrato moderno 1
  'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?q=80&w=150'  // Retrato moderno 2
];

export default function SettingsView({
  userName,
  setUserName,
  userPhoto,
  setUserPhoto,
  userHandle,
  setUserEmail,
  userEmail,
  setUserHandle,
  userPassword,
  setUserPassword,
  freeEditMode = false,
  setFreeEditMode,
  autoFullscreen,
  setAutoFullscreen,
  showDateSelector = false,
  setShowDateSelector,
  mobileSlideTransition = true,
  setMobileSlideTransition,
  mobileNavbarMode = 'fixed',
  setMobileNavbarMode,
  mobileNavbarShape = 'oval',
  setMobileNavbarShape,
  cardGlowEnabled = true,
  setCardGlowEnabled,
  setAccountDeactivated,
  onLogout,
  syncKey,
  syncStatus,
  connectSyncKey,
  disconnectSync,
  addXp,
  currentScreen: propCurrentScreen,
  setCurrentScreen: propSetCurrentScreen,
  screenHistory: propScreenHistory,
  setScreenHistory: propSetScreenHistory,
  appLockEnabled,
  setAppLockEnabled,
  appLockPassword = '',
  setAppLockPassword,
  appLockTimeout,
  setAppLockTimeout,
  isAppLocked,
  setIsAppLocked,
  appLockBiometricEnabled = false,
  setAppLockBiometricEnabled,
  activeThemePreset = 'default',
  setActiveThemePreset,
  customThemeHex = '#3396f3',
  setCustomThemeHex,
  themeMode = 'dark',
  setThemeMode,
  backgroundAtmosphere: propBackgroundAtmosphere,
  setBackgroundAtmosphere: propSetBackgroundAtmosphere,
  backgroundIntensity: propBackgroundIntensity,
  setBackgroundIntensity: propSetBackgroundIntensity,
  backgroundGridEnabled: propBackgroundGridEnabled,
  setBackgroundGridEnabled: propSetBackgroundGridEnabled,
  backgroundAnimated: propBackgroundAnimated,
  setBackgroundAnimated: propSetBackgroundAnimated,
  language: propLanguage,
  setLanguage: propSetLanguage,
  backgroundNotificationsEnabled: propBackgroundNotificationsEnabled,
  setBackgroundNotificationsEnabled: propSetBackgroundNotificationsEnabled,
  dailyWorkspaceSettings: propDailyWorkspaceSettings,
  setDailyWorkspaceSettings: propSetDailyWorkspaceSettings,
  loadingScreenVerticalImage = '',
  setLoadingScreenVerticalImage,
  loadingScreenHorizontalImage = '',
  setLoadingScreenHorizontalImage,
  onPreviewLoadingScreen,
  lockScreenDesktopImage = '',
  setLockScreenDesktopImage,
  lockScreenMobileImage = '',
  setLockScreenMobileImage
}: SettingsViewProps) {
  
  // Theme Color Scheme Modal State
  const [isColorSchemeModalOpen, setIsColorSchemeModalOpen] = useState(false);

  // Kanban Default View Style State (Padrão vs Simplificado)
  const [kanbanDefaultStyle, setKanbanDefaultStyle] = useState<'padrao' | 'simplificado'>(() => {
    try {
      const saved = localStorage.getItem('mbc_kanban_view_style');
      if (saved === 'simplificado' || saved === 'padrao') return saved;
    } catch (e) {}
    return 'padrao';
  });

  const handleSetKanbanDefaultStyle = (style: 'padrao' | 'simplificado') => {
    setKanbanDefaultStyle(style);
    localStorage.setItem('mbc_kanban_view_style', style);
    window.dispatchEvent(new CustomEvent('mbc_kanban_style_changed', { detail: style }));
    addXp(10);
  };

  // Biometric device support check
  const [isBiometricSupported, setIsBiometricSupported] = useState(false);
  const [isBiometricVerifying, setIsBiometricVerifying] = useState(false);

  useEffect(() => {
    isPlatformAuthenticatorAvailable().then(supported => {
      setIsBiometricSupported(supported);
    });
  }, []);

  // Navigation stack state
  const [localCurrentScreen, setLocalCurrentScreen] = useState<SettingsScreen>('main');
  const [localScreenHistory, setLocalScreenHistory] = useState<SettingsScreen[]>([]);

  const currentScreen = propCurrentScreen !== undefined ? propCurrentScreen : localCurrentScreen;
  const setCurrentScreen = propSetCurrentScreen !== undefined ? propSetCurrentScreen : setLocalCurrentScreen;
  const screenHistory = propScreenHistory !== undefined ? propScreenHistory : localScreenHistory;
  const setScreenHistory = propSetScreenHistory !== undefined ? propSetScreenHistory : setLocalScreenHistory;
  
  // Localized configuration search
  const [searchQuery, setSearchQuery] = useState('');

  // Form states
  const [editName, setEditName] = useState(userName);
  const [editPhoto, setEditPhoto] = useState(userPhoto);
  const [editHandle, setEditHandle] = useState(userHandle);
  const [editEmail, setEditEmail] = useState(userEmail);
  const [editPassword, setEditPassword] = useState(userPassword);
  
  const [showPassword, setShowPassword] = useState(false);
  const [showAvatarDropdown, setShowAvatarDropdown] = useState(false);
  
  // App Lock form states
  const [newLockPassword, setNewLockPassword] = useState('');
  const [confirmLockPassword, setConfirmLockPassword] = useState('');
  const [lockError, setLockError] = useState('');
  const [lockSuccess, setLockSuccess] = useState('');
  const [showLockPasswordForm, setShowLockPasswordForm] = useState(false);

  const [saveFeedback, setSaveFeedback] = useState<string | null>(null);
  
  // Sync & Database states
  const [customSyncInput, setCustomSyncInput] = useState('');
  const [syncConnecting, setSyncConnecting] = useState(false);
  const [syncFeedback, setSyncFeedback] = useState<string | null>(null);

  // IndexedDB Mutation Queue states
  const [queueStatus, setQueueStatus] = useState<QueueStatus>({
    pendingCount: 0,
    isProcessing: false,
    isOnline: true
  });
  const [queueFlushing, setQueueFlushing] = useState(false);
  const [queueFeedback, setQueueFeedback] = useState<string | null>(null);

  useEffect(() => {
    const unsubscribe = subscribeToMutationQueue((status) => {
      setQueueStatus(status);
    });
    return () => unsubscribe();
  }, []);

  const handleFlushQueue = async () => {
    setQueueFlushing(true);
    setQueueFeedback(null);
    try {
      const res = await processMutationQueue();
      if (res.processed > 0) {
        setQueueFeedback(`${res.processed} ${res.processed === 1 ? 'alteração sincronizada' : 'alterações sincronizadas'} com a nuvem!`);
      } else if (res.failed > 0) {
        setQueueFeedback(`Erro ao sincronizar ${res.failed} itens. Verifique a conexão com a internet.`);
      } else {
        setQueueFeedback('Nenhuma alteração pendente na fila.');
      }
    } catch (err: any) {
      setQueueFeedback('Falha ao processar fila: ' + (err?.message || String(err)));
    } finally {
      setQueueFlushing(false);
    }
  };

  // Supabase states
  const [supabaseUrl, setSupabaseUrl] = useState(() => localStorage.getItem('mbc_supabase_url') || '');
  const [supabaseAnonKey, setSupabaseAnonKey] = useState(() => localStorage.getItem('mbc_supabase_anon_key') || '');
  const [supabaseFeedback, setSupabaseFeedback] = useState<string | null>(null);
  const [showSupabaseModal, setShowSupabaseModal] = useState(false);

  // Notification toggles
  const [notifDaily, setNotifDaily] = useState(true);
  const [notifFinances, setNotifFinances] = useState(false);
  const [notifRoutine, setNotifRoutine] = useState(true);
  const [localNotifBackground, setLocalNotifBackground] = useState(() => {
    return localStorage.getItem('mbc_background_notifications_enabled') !== 'false';
  });
  const notifBackground = propBackgroundNotificationsEnabled !== undefined ? propBackgroundNotificationsEnabled : localNotifBackground;
  const setNotifBackground = (val: boolean | ((prev: boolean) => boolean)) => {
    const nextVal = typeof val === 'function' ? val(notifBackground) : val;
    if (propSetBackgroundNotificationsEnabled) propSetBackgroundNotificationsEnabled(nextVal);
    setLocalNotifBackground(nextVal);
  };

  const [localDailyWorkspaceNotifEnabled, setLocalDailyWorkspaceNotifEnabled] = useState(() => {
    return localStorage.getItem('mbc_daily_workspace_notif_enabled') !== 'false';
  });
  const dailyWorkspaceNotifEnabled = propDailyWorkspaceSettings?.enabled !== undefined ? propDailyWorkspaceSettings.enabled : localDailyWorkspaceNotifEnabled;
  const setDailyWorkspaceNotifEnabled = (val: boolean | ((prev: boolean) => boolean)) => {
    const nextVal = typeof val === 'function' ? val(dailyWorkspaceNotifEnabled) : val;
    if (propSetDailyWorkspaceSettings) {
      propSetDailyWorkspaceSettings({
        enabled: nextVal,
        time: dailyWorkspaceReminderTime
      });
    }
    setLocalDailyWorkspaceNotifEnabled(nextVal);
  };

  const [localDailyWorkspaceReminderTime, setLocalDailyWorkspaceReminderTime] = useState(() => {
    return localStorage.getItem('mbc_daily_workspace_reminder_time') || '21:00';
  });
  const dailyWorkspaceReminderTime = propDailyWorkspaceSettings?.time !== undefined ? propDailyWorkspaceSettings.time : localDailyWorkspaceReminderTime;
  const setDailyWorkspaceReminderTime = (val: string | ((prev: string) => string)) => {
    const nextVal = typeof val === 'function' ? val(dailyWorkspaceReminderTime) : val;
    if (propSetDailyWorkspaceSettings) {
      propSetDailyWorkspaceSettings({
        enabled: dailyWorkspaceNotifEnabled,
        time: nextVal
      });
    }
    setLocalDailyWorkspaceReminderTime(nextVal);
  };

  // Review Reminders state (Semanal & Mensal)
  const [reviewReminders, setReviewReminders] = useState<ReviewRemindersSettings>(() => getReviewRemindersSettings());
  const [isReviewReminderModalOpen, setIsReviewReminderModalOpen] = useState(false);
  const [reminderModalTab, setReminderModalTab] = useState<'weekly' | 'monthly' | 'all'>('all');

  useEffect(() => {
    const handleRemindersUpdate = () => {
      setReviewReminders(getReviewRemindersSettings());
    };
    window.addEventListener('mbc_review_reminders_changed', handleRemindersUpdate);
    window.addEventListener('storage', handleRemindersUpdate);
    return () => {
      window.removeEventListener('mbc_review_reminders_changed', handleRemindersUpdate);
      window.removeEventListener('storage', handleRemindersUpdate);
    };
  }, []);

  // Install trigger (PWA)
  const [pwaPrompt, setPwaPrompt] = useState<any>(null);
  const [pwaInstalled, setPwaInstalled] = useState(false);

  // Language state
  const [localSelectedLanguage, setLocalSelectedLanguage] = useState(() => {
    return localStorage.getItem('mbc_language') || 'pt';
  });
  const selectedLanguage = propLanguage !== undefined ? propLanguage : localSelectedLanguage;
  const setSelectedLanguage = (lang: string) => {
    if (propSetLanguage) propSetLanguage(lang);
    setLocalSelectedLanguage(lang);
  };

  // Google Calendar Integration states
  const [googleUser, setGoogleUser] = useState<{ name: string; email: string; picture: string } | null>(() => {
    const saved = localStorage.getItem('google_calendar_user');
    return saved ? JSON.parse(saved) : null;
  });

  // Connected Devices state
  const [connectedDevices, setConnectedDevices] = useState<ConnectedDevice[]>(() => {
    const saved = localStorage.getItem('mbc_connected_devices');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      } catch (e) {}
    }

    const { browser, os, fullName, deviceType } = detectDeviceDetails();
    const nowTs = Date.now();

    return [
      {
        id: 'dev-curr-session',
        name: fullName,
        browser,
        os,
        isCurrent: true,
        lastActiveTimestamp: nowTs,
        lastActive: formatLastActiveTime(nowTs, true),
        ip: '189.28.102.44',
        deviceType
      }
    ];
  });

  const [editingDevice, setEditingDevice] = useState<ConnectedDevice | null>(null);
  const [showConnectDeviceModal, setShowConnectDeviceModal] = useState(false);
  const [editDeviceCustomName, setEditDeviceCustomName] = useState('');

  // Estados para gerar QR Code de conexão de novo aparelho (5 minutos / 300s)
  const [connectQrSession, setConnectQrSession] = useState<QrLoginSession | null>(null);
  const [connectQrDataUrl, setConnectQrDataUrl] = useState<string | null>(null);
  const [connectQrCountdown, setConnectQrCountdown] = useState<number>(300);
  const [connectQrLoading, setConnectQrLoading] = useState<boolean>(false);
  const [connectDeviceTab, setConnectDeviceTab] = useState<'qrcode' | 'codigo'>('qrcode');
  const [manualCodeInput, setManualCodeInput] = useState<string>('');
  const [manualCodeAuthorizing, setManualCodeAuthorizing] = useState<boolean>(false);
  const [manualCodeFeedback, setManualCodeFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Estado do formato da barra de navegação mobile (oval vs reta)
  const [currentNavbarShape, setCurrentNavbarShape] = useState<'oval' | 'reta'>(() => {
    return mobileNavbarShape || (localStorage.getItem('mbc_mobile_navbar_shape') as 'oval' | 'reta') || 'oval';
  });

  useEffect(() => {
    if (mobileNavbarShape) {
      setCurrentNavbarShape(mobileNavbarShape);
    }
  }, [mobileNavbarShape]);

  // Estado do estilo de fundo escuro (preto padrão vs preto amoled)
  const [darkBackgroundStyle, setDarkBackgroundStyle] = useState<'padrao' | 'amoled'>(() => {
    return (typeof window !== 'undefined' ? (localStorage.getItem('mbc_dark_background_style') as 'padrao' | 'amoled') : 'padrao') || 'padrao';
  });

  // Cinematic Luxury Background Atmosphere States
  const [localBackgroundAtmosphere, setLocalBackgroundAtmosphere] = useState<BackgroundAtmosphereMode>(() => {
    return (localStorage.getItem('mbc_background_atmosphere') as BackgroundAtmosphereMode) || 'cinematic';
  });
  const backgroundAtmosphere = propBackgroundAtmosphere !== undefined ? propBackgroundAtmosphere : localBackgroundAtmosphere;
  const handleSelectBackgroundAtmosphere = (mode: BackgroundAtmosphereMode) => {
    if (propSetBackgroundAtmosphere) propSetBackgroundAtmosphere(mode);
    setLocalBackgroundAtmosphere(mode);
    localStorage.setItem('mbc_background_atmosphere', mode);
    if (mode === 'amoled') {
      applyDarkBackgroundStyle('amoled');
      setDarkBackgroundStyle('amoled');
    } else {
      applyDarkBackgroundStyle('padrao');
      setDarkBackgroundStyle('padrao');
    }
    addXp(15);
  };

  const [localBackgroundIntensity, setLocalBackgroundIntensity] = useState<BackgroundAtmosphereIntensity>(() => {
    return (localStorage.getItem('mbc_background_intensity') as BackgroundAtmosphereIntensity) || 'subtle';
  });
  const backgroundIntensity = propBackgroundIntensity !== undefined ? propBackgroundIntensity : localBackgroundIntensity;
  const handleSelectBackgroundIntensity = (intensity: BackgroundAtmosphereIntensity) => {
    if (propSetBackgroundIntensity) propSetBackgroundIntensity(intensity);
    setLocalBackgroundIntensity(intensity);
    localStorage.setItem('mbc_background_intensity', intensity);
    addXp(10);
  };

  const [localBackgroundGridEnabled, setLocalBackgroundGridEnabled] = useState<boolean>(() => {
    return localStorage.getItem('mbc_background_grid_enabled') !== 'false';
  });
  const backgroundGridEnabled = propBackgroundGridEnabled !== undefined ? propBackgroundGridEnabled : localBackgroundGridEnabled;
  const handleToggleBackgroundGrid = (enabled: boolean) => {
    if (propSetBackgroundGridEnabled) propSetBackgroundGridEnabled(enabled);
    setLocalBackgroundGridEnabled(enabled);
    localStorage.setItem('mbc_background_grid_enabled', String(enabled));
    addXp(10);
  };

  const [localBackgroundAnimated, setLocalBackgroundAnimated] = useState<boolean>(() => {
    return localStorage.getItem('mbc_background_animated') !== 'false';
  });
  const backgroundAnimated = propBackgroundAnimated !== undefined ? propBackgroundAnimated : localBackgroundAnimated;
  const handleToggleBackgroundAnimated = (anim: boolean) => {
    if (propSetBackgroundAnimated) propSetBackgroundAnimated(anim);
    setLocalBackgroundAnimated(anim);
    localStorage.setItem('mbc_background_animated', String(anim));
    addXp(10);
  };

  // Função para gerar uma nova sessão de QR Code de 5 minutos
  const generateNewDeviceQr = async () => {
    setConnectQrLoading(true);
    setManualCodeFeedback(null);
    try {
      const session = await createQrLoginSession();
      setConnectQrSession(session);
      setConnectQrCountdown(300);

      // Payload do QR Code com link direto e parâmetros de sessão
      const qrPayload = `${window.location.origin}/?qr_session=${session.sessionId}`;
      const url = await QRCode.toDataURL(qrPayload, {
        width: 280,
        margin: 2,
        color: {
          dark: '#09090b',
          light: '#ffffff'
        }
      });
      setConnectQrDataUrl(url);
    } catch (err) {
      console.error('Erro ao gerar QR Code para pareamento:', err);
    } finally {
      setConnectQrLoading(false);
    }
  };

  // Efeito disparado quando o modal de conectar dispositivo abre
  useEffect(() => {
    if (showConnectDeviceModal) {
      generateNewDeviceQr();
    } else {
      setConnectQrDataUrl(null);
      setConnectQrSession(null);
      setManualCodeInput('');
      setManualCodeFeedback(null);
    }
  }, [showConnectDeviceModal]);

  // Contagem regressiva de 5 minutos (300 segundos) e polling de conexão
  useEffect(() => {
    if (!showConnectDeviceModal || !connectQrSession) return;

    const timer = setInterval(() => {
      setConnectQrCountdown(prev => {
        if (prev <= 1) {
          clearInterval(timer);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    // Polling caso o outro aparelho escaneie o QR Code e autorize a sessão
    const pollInterval = setInterval(async () => {
      if (connectQrSession?.sessionId) {
        const updated = await checkQrLoginSessionStatus(connectQrSession.sessionId);
        if (updated && updated.status === 'authorized') {
          clearInterval(pollInterval);
          // Registrar novo aparelho conectado na lista
          const nowTs = Date.now();
          const newDev: ConnectedDevice = {
            id: `dev-qr-${nowTs}`,
            name: updated.user?.name ? `${updated.user.name} (Novo Aparelho)` : 'Novo Aparelho Conectado via QR Code',
            browser: 'Navegador / App',
            os: 'Dispositivo Pareado',
            isCurrent: false,
            lastActiveTimestamp: nowTs,
            lastActive: formatLastActiveTime(nowTs, false),
            ip: '189.28.102.89',
            deviceType: 'mobile'
          };
          const accKey = getAccountKey();
          const currentDevs = await fetchAccountDevices();
          const newList = [newDev, ...currentDevs.filter(d => d.id !== newDev.id)];
          await saveAccountDevices(accKey, newList);
          setConnectedDevices(newList);
          setManualCodeFeedback({ type: 'success', message: 'Aparelho conectado com sucesso via QR Code!' });
          setTimeout(() => {
            setShowConnectDeviceModal(false);
          }, 2000);
        }
      }
    }, 2500);

    return () => {
      clearInterval(timer);
      clearInterval(pollInterval);
    };
  }, [showConnectDeviceModal, connectQrSession]);

  // Sync and update connected devices in real time
  useEffect(() => {
    let isMounted = true;

    const performSync = async () => {
      try {
        const updated = await syncAndRegisterCurrentDevice();
        if (isMounted) {
          setConnectedDevices(updated);
        }
      } catch (err) {
        console.warn('Connected devices sync error:', err);
      }
    };

    performSync();

    // Re-sync and re-evaluate active timers every 8 seconds
    const interval = setInterval(() => {
      performSync();
    }, 8000);

    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, [userEmail, syncKey]);
  const [googleToken, setGoogleToken] = useState<string | null>(() => {
    return localStorage.getItem('google_calendar_token');
  });

  const handleGoogleLogin = async () => {
    try {
      const redirectUri = `${window.location.origin}/auth/callback`;
      const response = await fetch(`/api/auth/google/url?redirect_uri=${encodeURIComponent(redirectUri)}&scope=calendar`);
      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        alert(data.error || 'Erro ao gerar URL de autenticação do Google.');
        return;
      }

      const { url } = data;
      if (!url) {
        alert('URL de autenticação do Google não recebida.');
        return;
      }

      const width = 550;
      const height = 650;
      const left = window.screen.width / 2 - width / 2;
      const top = window.screen.height / 2 - height / 2;

      const authWindow = window.open(
        url,
        'google_oauth_popup',
        `width=${width},height=${height},top=${top},left=${left},status=no,toolbar=no,menubar=no`
      );

      if (!authWindow) {
        window.location.href = url;
      }
    } catch (err: any) {
      console.error('Error opening Google OAuth:', err);
      alert('Erro ao conectar ao Google Agenda: ' + (err?.message || 'Falha de rede.'));
    }
  };

  const handleGoogleLogout = () => {
    clearGoogleOAuthSession();
    setGoogleUser(null);
    setGoogleToken(null);
  };

  useEffect(() => {
    const handleOAuthMessageInSettings = (event: MessageEvent) => {
      const origin = event.origin;
      if (event.origin !== window.location.origin && !origin.endsWith('.run.app') && !origin.includes('localhost')) {
        return;
      }

      if (event.data?.type === 'GOOGLE_OAUTH_SUCCESS') {
        const { tokens, profile } = event.data;
        if (tokens?.access_token) {
          saveGoogleOAuthTokens(tokens, profile);

          if (profile) {
            // Auto-fill logic: only fill if empty or default values
            const defaultName = 'Nando';
            const defaultEmail = 'etanomicosl5@gmail.com';
            const defaultPhoto = 'https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?q=80&w=100';

            if (!userName || userName.trim() === '' || userName === defaultName) {
              if (profile.name) {
                setUserName(profile.name);
                localStorage.setItem('mbc_userName', profile.name);
              }
            }
            if (!userEmail || userEmail.trim() === '' || userEmail === defaultEmail) {
              if (profile.email) {
                setUserEmail(profile.email);
                localStorage.setItem('mbc_userEmail', profile.email);
              }
            }
            if (!userPhoto || userPhoto.trim() === '' || userPhoto === defaultPhoto) {
              if (profile.picture) {
                setUserPhoto(profile.picture);
                localStorage.setItem('mbc_userPhoto', profile.picture);
              }
            }
          }
          setGoogleToken(tokens.access_token);
          setGoogleUser(profile);
        }
      }
    };

    window.addEventListener('message', handleOAuthMessageInSettings);
    return () => window.removeEventListener('message', handleOAuthMessageInSettings);
  }, [userName, userEmail, userPhoto, setUserName, setUserEmail, setUserPhoto]);

  useEffect(() => {
    const checkValidToken = async () => {
      const savedRefreshToken = localStorage.getItem('google_calendar_refresh_token');
      if (savedRefreshToken || localStorage.getItem('google_calendar_user')) {
        const validTok = await getValidGoogleAccessToken();
        if (validTok) {
          setGoogleToken(validTok);
        }
      }
    };
    checkValidToken();
  }, []);

  useEffect(() => {
    const handleStorageChange = () => {
      const savedToken = localStorage.getItem('google_calendar_token');
      const savedUser = localStorage.getItem('google_calendar_user');
      if (savedToken && savedToken !== googleToken) {
        setGoogleToken(savedToken);
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

  // Sync state variables with original props when navigation occurs
  useEffect(() => {
    setEditName(userName);
    setEditPhoto(userPhoto);
    setEditHandle(userHandle);
    setEditEmail(userEmail);
    setEditPassword(userPassword);
  }, [userName, userPhoto, userHandle, userEmail, userPassword, currentScreen]);

  useEffect(() => {
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setPwaPrompt(e);
    };
    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches || (window.navigator as any).standalone;
    if (isStandalone) {
      setPwaInstalled(true);
    }

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  // Navigation Helpers
  const navigateTo = (screen: SettingsScreen) => {
    setScreenHistory(prev => [...prev, currentScreen]);
    setCurrentScreen(screen);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const navigateBack = () => {
    if (screenHistory.length > 0) {
      const prev = screenHistory[screenHistory.length - 1];
      setScreenHistory(prev => prev.slice(0, prev.length - 1));
      setCurrentScreen(prev);
    } else {
      setCurrentScreen('main');
    }
  };

  const handleSaveAccountInfo = (e: React.FormEvent) => {
    e.preventDefault();
    let formattedHandle = editHandle.trim();
    if (formattedHandle && !formattedHandle.startsWith('@')) {
      formattedHandle = `@${formattedHandle}`;
    }
    
    setUserName(editName.trim() || 'Nando');
    setUserPhoto(editPhoto.trim());
    setUserHandle(formattedHandle || '@nando_mbc');
    setUserEmail(editEmail.trim());
    
    localStorage.setItem('mbc_userName', editName.trim() || 'Nando');
    localStorage.setItem('mbc_userPhoto', editPhoto.trim());
    localStorage.setItem('mbc_userHandle', formattedHandle || '@nando_mbc');
    localStorage.setItem('mbc_userEmail', editEmail.trim());
    
    addXp(30);
    setSaveFeedback('Informações da conta atualizadas com sucesso!');
    setTimeout(() => setSaveFeedback(null), 3000);
  };

  const handleSavePassword = (e: React.FormEvent) => {
    e.preventDefault();
    setUserPassword(editPassword);
    localStorage.setItem('mbc_userPassword', editPassword);
    
    addXp(20);
    setSaveFeedback('Sua senha de segurança foi alterada com sucesso!');
    setTimeout(() => setSaveFeedback(null), 3000);
  };

  const handleDownloadData = () => {
    try {
      const storageData: Record<string, any> = {};
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key) {
          const raw = localStorage.getItem(key);
          if (raw !== null) {
            try {
              storageData[key] = JSON.parse(raw);
            } catch {
              storageData[key] = raw;
            }
          }
        }
      }
      
      const backupObj = {
        _meta: {
          appName: 'Planner Extraordinário',
          exportedAt: new Date().toISOString(),
          version: '1.0',
          totalKeys: Object.keys(storageData).length,
          userHandle: localStorage.getItem('mbc_userHandle') || '@usuario'
        },
        data: storageData
      };
      
      const jsonString = JSON.stringify(backupObj, null, 2);
      const blob = new Blob([jsonString], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      const dateStr = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
      a.download = `planner_backup_${dateStr}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      
      addXp(15);
      alert(`✅ Exportação local concluída com sucesso!\n\nArquivo JSON baixado contendo ${Object.keys(storageData).length} blocos de dados (metas, tarefas, finanças, rotinas, anotações, diário e hábitos).`);
    } catch (err) {
      alert('Erro ao exportar dados.');
    }
  };

  const handleUploadData = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const content = event.target?.result as string;
        const parsed = JSON.parse(content);
        if (typeof parsed !== 'object' || parsed === null) {
          throw new Error('Arquivo de backup inválido');
        }

        const exportData = (parsed._meta && parsed.data && typeof parsed.data === 'object') ? parsed.data : parsed;

        let keysRestored = 0;
        Object.entries(exportData).forEach(([key, val]) => {
          if (key === '_meta') return;
          if (typeof val === 'string') {
            localStorage.setItem(key, val);
            keysRestored++;
          } else if (val !== null && val !== undefined) {
            localStorage.setItem(key, JSON.stringify(val));
            keysRestored++;
          }
        });

        localStorage.setItem('mbc_last_local_write', new Date().toISOString());
        addXp(30);
        alert(`✅ Backup restaurado com sucesso!\n\n${keysRestored} blocos de dados carregados. O Planner será recarregado agora.`);
        window.location.reload();
      } catch (err) {
        alert('Erro ao carregar o arquivo de backup. Certifique-se de escolher um arquivo .json de backup válido.');
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  const handleSaveSupabaseConfig = async (e: React.FormEvent) => {
    e.preventDefault();
    setSupabaseConfig(supabaseUrl, supabaseAnonKey);

    setSupabaseFeedback('Testando conexão com o Supabase...');
    const result = await testSupabaseConnection();
    if (result.ok) {
      setSupabaseFeedback(`✅ ${result.message}`);
    } else {
      setSupabaseFeedback(`⚠️ ${result.message}`);
    }
  };

  const handleCustomSyncConnect = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!customSyncInput.trim()) return;
    setSyncConnecting(true);
    setSyncFeedback(null);
    try {
      await connectSyncKey(customSyncInput.trim());
      setSyncFeedback('Conectado à chave com sucesso! Canal sincronizado.');
      setCustomSyncInput('');
      addXp(50);
    } catch (err) {
      setSyncFeedback('Erro ao conectar chave.');
    } finally {
      setSyncConnecting(false);
      setTimeout(() => setSyncFeedback(null), 3000);
    }
  };

  const handleResetSyncDefault = async () => {
    if (confirm('Deseja realmente voltar para a sincronização padrão (USUARIO_UNICO)? Seus dados locais serão mesclados.')) {
      setSyncConnecting(true);
      await disconnectSync();
      setSyncConnecting(false);
      setSyncFeedback('Restaurado para perfil padrão com sucesso!');
      setTimeout(() => setSyncFeedback(null), 3000);
    }
  };

  const handleDeactivate = () => {
    if (confirm('Tem certeza de que deseja desativar temporariamente a sua conta? Você poderá reativá-la a qualquer momento ao retornar.')) {
      setAccountDeactivated(true);
      localStorage.setItem('mbc_accountDeactivated', 'true');
    }
  };

  const handleLogout = async () => {
    if (confirm('Deseja realmente sair (Log out)? A sessão deste dispositivo será encerrada por segurança.')) {
      try {
        await disconnectSync();
      } catch (e) {
        console.error('Error disconnecting sync:', e);
      }
      localStorage.removeItem('mbc_auth_user');
      sessionStorage.removeItem('mbc_auth_user');
      localStorage.removeItem('mbc_sync_key');
      if (onLogout) {
        onLogout();
      } else {
        localStorage.clear();
        window.location.reload();
      }
    }
  };

  const handleInstallApp = async () => {
    if (pwaPrompt) {
      pwaPrompt.prompt();
      const { outcome } = await pwaPrompt.userChoice;
      if (outcome === 'accepted') {
        setPwaInstalled(true);
        setPwaPrompt(null);
        addXp(100);
      }
    } else {
      alert('Se o instalador automático não iniciar, você pode fixar este aplicativo clicando no ícone de instalação na barra de endereços do seu navegador ou adicionando-o à tela inicial.');
    }
  };

  // Search filter implementation
  const menuItems = [
    {
      id: 'sua_conta',
      title: 'Sua conta',
      desc: 'Veja informações sobre sua conta, baixe um arquivo com seus dados ou saiba mais sobre as opções de desativação de conta.',
      icon: User,
      screen: 'sua_conta' as SettingsScreen
    },
    {
      id: 'seguranca',
      title: 'Segurança e acesso à conta',
      desc: 'Gerencie a segurança da sua conta, monitore chaves de sincronização em nuvem e gerencie backups automatizados.',
      icon: Lock,
      screen: 'seguranca' as SettingsScreen
    },
    {
      id: 'dispositivos_conectados',
      title: 'Dispositivos conectados',
      desc: 'Veja e gerencie celulares, computadores e navegadores em que sua conta está ativa.',
      icon: Laptop,
      screen: 'dispositivos_conectados' as SettingsScreen
    },
    {
      id: 'notificacoes',
      title: 'Notificações',
      desc: 'Selecione os tipos de notificação que você deseja receber sobre atividades, metas e lembretes de rotinas.',
      icon: Bell,
      screen: 'notificacoes' as SettingsScreen
    },
    {
      id: 'esquema_cores',
      title: 'Esquema de cores e personalização',
      desc: 'Personalize a cor de destaque do aplicativo (Padrão, Azul, Verde, Laranja, Vermelho, Rosa ou Cor Personalizada).',
      icon: Palette,
      onClick: () => setIsColorSchemeModalOpen(true)
    },
    {
      id: 'exibicao',
      title: 'Acessibilidade, exibição e PWA',
      desc: 'Gerencie tela cheia, navbar mobile (fixa ou flexível), animações e exibição geral do Planner.',
      icon: Maximize,
      screen: 'exibicao' as SettingsScreen
    }
  ];

  const filteredMenuItems = menuItems.filter(item => 
    item.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
    item.desc.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="w-full min-h-[600px] bg-zinc-900/30 backdrop-blur-md text-white font-sans select-none relative pb-10 rounded-2xl overflow-hidden shadow-2xl">
      
      {/* ANIMATED ROUTER WRAPPER */}
      <AnimatePresence mode="wait">
        
        {/* VIEW 1: MAIN SETTINGS MENU */}
        {currentScreen === 'main' && (
          <motion.div
            key="main-screen"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.25 }}
            className="flex flex-col h-full"
          >
            {/* Header */}
            <div className="p-4 border-b border-zinc-900 flex items-center justify-between">
              <div>
                <h2 className="text-base font-black text-white tracking-tight">Configurações</h2>
                <p className="text-[11px] text-zinc-500 font-mono mt-0.5">{userHandle}</p>
              </div>
              <img 
                src={userPhoto} 
                alt="Profile" 
                className="h-9 w-9 rounded-xl object-cover border border-zinc-800"
                referrerPolicy="no-referrer"
              />
            </div>

            {/* Quick Search */}
            <div className="px-4 py-3 relative">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Buscar configuração"
                className="w-full bg-[#16161a] border border-zinc-900/80 rounded-full py-2.5 pl-11 pr-4 text-xs text-zinc-300 placeholder-zinc-500 focus:outline-none focus:border-orange-500/40 focus:bg-[#1c1c22] transition-all font-mono"
              />
              <Search className="h-4.5 w-4.5 text-zinc-500 absolute left-8 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>

            {/* List options */}
            <div className="divide-y divide-zinc-900 px-1">
              {filteredMenuItems.map((item) => {
                const IconComp = item.icon;
                return (
                  <div
                    key={item.id}
                    onClick={() => {
                      if ('onClick' in item && typeof item.onClick === 'function') {
                        item.onClick();
                      } else if ('screen' in item && item.screen) {
                        navigateTo(item.screen as SettingsScreen);
                      }
                    }}
                    className="flex items-start gap-4 p-4 hover:bg-zinc-950/85 active:bg-zinc-900/60 cursor-pointer transition-colors group"
                  >
                    <div className="p-2 bg-zinc-900 rounded-xl text-zinc-400 group-hover:text-orange-500 transition-colors shrink-0">
                      <IconComp className="h-4.5 w-4.5" />
                    </div>
                    <div className="flex-1 space-y-0.5">
                      <h4 className="text-xs font-bold text-zinc-100 group-hover:text-white transition-colors">{item.title}</h4>
                      <p className="text-[10px] text-zinc-500 leading-normal font-mono">{item.desc}</p>
                    </div>
                    <ChevronRight className="h-4 w-4 text-zinc-600 mt-2 shrink-0 group-hover:translate-x-0.5 transition-transform" />
                  </div>
                );
              })}

              {/* Quick standalone log out at bottom */}
              <div
                onClick={handleLogout}
                className="flex items-start gap-4 p-4 hover:bg-red-950/10 active:bg-red-950/20 cursor-pointer transition-colors group"
              >
                <div className="p-2 bg-red-950/10 rounded-xl text-red-500 shrink-0">
                  <LogOut className="h-4.5 w-4.5" />
                </div>
                <div className="flex-1 space-y-0.5">
                  <h4 className="text-xs font-bold text-red-400">Sair da conta</h4>
                  <p className="text-[10px] text-zinc-650 leading-normal font-mono">Desconecta seu usuário local e limpa os rascunhos de segurança.</p>
                </div>
                <ChevronRight className="h-4 w-4 text-zinc-750 mt-2 shrink-0" />
              </div>
            </div>

            {filteredMenuItems.length === 0 && (
              <div className="py-12 text-center text-zinc-500 text-xs font-mono">
                Nenhuma configuração encontrada para "{searchQuery}"
              </div>
            )}
          </motion.div>
        )}

        {/* VIEW 2: SUA CONTA (Sub-menu) */}
        {currentScreen === 'sua_conta' && (
          <motion.div
            key="sua-conta-screen"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.25 }}
          >
            {/* Nav Header */}
            <div className="p-4 border-b border-zinc-900 flex items-center gap-3">
              <button 
                onClick={navigateBack}
                className="p-1.5 hover:bg-zinc-900 rounded-xl text-zinc-400 hover:text-white transition-colors"
              >
                <ArrowLeft className="h-4.5 w-4.5" />
              </button>
              <div>
                <h3 className="text-xs font-black tracking-wider uppercase font-mono text-zinc-400">Sua conta</h3>
                <p className="text-[10px] text-zinc-500 font-mono">{userHandle}</p>
              </div>
            </div>

            <div className="p-4 border-b border-zinc-900/60">
              <p className="text-[11px] text-zinc-400 leading-relaxed font-mono">
                Veja informações sobre sua conta, baixe um arquivo com seus dados ou saiba mais sobre as opções de desativação de conta.
              </p>
            </div>

            {/* Account options list */}
            <div className="divide-y divide-zinc-900 px-1">
              {/* Account Info */}
              <div 
                onClick={() => navigateTo('informacoes_conta')}
                className="flex items-start gap-4 p-4 hover:bg-zinc-950 cursor-pointer transition-colors group"
              >
                <User className="h-4.5 w-4.5 text-zinc-500 mt-1 shrink-0" />
                <div className="flex-1 space-y-0.5">
                  <h4 className="text-xs font-bold text-zinc-200">Informações da conta</h4>
                  <p className="text-[10px] text-zinc-500 font-mono">Veja as informações da sua conta, como e-mail e nome de usuário.</p>
                </div>
                <ChevronRight className="h-4 w-4 text-zinc-600 mt-1.5" />
              </div>

              {/* Password Change */}
              <div 
                onClick={() => navigateTo('alterar_senha')}
                className="flex items-start gap-4 p-4 hover:bg-zinc-950 cursor-pointer transition-colors group"
              >
                <Lock className="h-4.5 w-4.5 text-zinc-500 mt-1 shrink-0" />
                <div className="flex-1 space-y-0.5">
                  <h4 className="text-xs font-bold text-zinc-200">Alterar senha da conta do usuário</h4>
                  <p className="text-[10px] text-zinc-500 font-mono">Altere a senha de autenticação e identificação do seu perfil.</p>
                </div>
                <ChevronRight className="h-4 w-4 text-zinc-600 mt-1.5" />
              </div>

              {/* Dispositivos Conectados Shortcut */}
              <div 
                onClick={() => navigateTo('dispositivos_conectados')}
                className="flex items-start gap-4 p-4 hover:bg-zinc-950 cursor-pointer transition-colors group"
              >
                <Laptop className="h-4.5 w-4.5 text-emerald-400 mt-1 shrink-0" />
                <div className="flex-1 space-y-0.5">
                  <h4 className="text-xs font-bold text-zinc-200">Dispositivos conectados</h4>
                  <p className="text-[10px] text-zinc-500 font-mono">Veja em quais aparelhos ou navegadores sua conta está conectada.</p>
                </div>
                <ChevronRight className="h-4 w-4 text-zinc-600 mt-1.5" />
              </div>

              {/* Download state backup */}
              <div 
                onClick={handleDownloadData}
                className="flex items-start gap-4 p-4 hover:bg-zinc-950 cursor-pointer transition-colors group"
              >
                <Download className="h-4.5 w-4.5 text-zinc-500 mt-1 shrink-0" />
                <div className="flex-1 space-y-0.5">
                  <h4 className="text-xs font-bold text-zinc-200">Exportar backup dos dados (Baixar .JSON)</h4>
                  <p className="text-[10px] text-zinc-500 font-mono">Baixe um arquivo JSON com todas as suas metas, tarefas, hábitos, finanças e anotações.</p>
                </div>
                <ChevronRight className="h-4 w-4 text-zinc-600 mt-1.5" />
              </div>

              {/* Upload / Restore backup */}
              <label 
                className="flex items-start gap-4 p-4 hover:bg-zinc-950 cursor-pointer transition-colors group border-t border-zinc-900/40"
              >
                <Upload className="h-4.5 w-4.5 text-orange-500 mt-1 shrink-0" />
                <div className="flex-1 space-y-0.5">
                  <h4 className="text-xs font-bold text-orange-400">Restaurar backup existente (Upload .JSON)</h4>
                  <p className="text-[10px] text-zinc-500 font-mono">Selecione um arquivo de backup para restaurar instantaneamente todos os seus dados sem perdas.</p>
                </div>
                <input 
                  type="file" 
                  accept=".json,application/json" 
                  onChange={handleUploadData} 
                  className="hidden" 
                />
                <ChevronRight className="h-4 w-4 text-zinc-600 mt-1.5" />
              </label>

              {/* Account Deactivate */}
              <div 
                onClick={() => navigateTo('desativar_conta')}
                className="flex items-start gap-4 p-4 hover:bg-red-950/10 cursor-pointer transition-colors group"
              >
                <Trash2 className="h-4.5 w-4.5 text-red-500 mt-1 shrink-0" />
                <div className="flex-1 space-y-0.5">
                  <h4 className="text-xs font-bold text-red-400">Desativar sua conta</h4>
                  <p className="text-[10px] text-zinc-500 font-mono">Descubra como desativar sua conta temporariamente.</p>
                </div>
                <ChevronRight className="h-4 w-4 text-zinc-700 mt-1.5" />
              </div>

              {/* Logout Option in Sua Conta */}
              <div 
                onClick={handleLogout}
                className="flex items-start gap-4 p-4 hover:bg-red-950/10 active:bg-red-950/20 cursor-pointer transition-colors group"
              >
                <LogOut className="h-4.5 w-4.5 text-red-500 mt-1 shrink-0" />
                <div className="flex-1 space-y-0.5">
                  <h4 className="text-xs font-bold text-red-400">Sair da conta (Logout)</h4>
                  <p className="text-[10px] text-zinc-500 font-mono">Encerra a sessão atual e desconecta deste dispositivo.</p>
                </div>
                <ChevronRight className="h-4 w-4 text-zinc-700 mt-1.5" />
              </div>
            </div>
          </motion.div>
        )}

        {/* VIEW 3: INFORMAÇÕES DA CONTA (FORM) */}
        {currentScreen === 'informacoes_conta' && (
          <motion.div
            key="info-conta-screen"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.25 }}
          >
            {/* Header */}
            <div className="p-4 border-b border-zinc-900 flex items-center gap-3">
              <button onClick={navigateBack} className="p-1.5 hover:bg-zinc-900 rounded-xl text-zinc-400">
                <ArrowLeft className="h-4.5 w-4.5" />
              </button>
              <h3 className="text-xs font-black tracking-wider uppercase font-mono text-zinc-300">Informações da Conta</h3>
            </div>

            {saveFeedback && (
              <div className="m-4 p-3 bg-green-500/10 border border-green-500/20 text-green-400 text-[10px] font-mono rounded-xl flex items-center gap-2">
                <Check className="h-4 w-4" />
                <span>{saveFeedback}</span>
              </div>
            )}

            <form onSubmit={handleSaveAccountInfo} className="p-4 space-y-5">
              {/* Google Integration Connection */}
              <div className="p-4 bg-zinc-950 border border-zinc-900 rounded-2xl space-y-3">
                <span className="text-[10px] text-zinc-500 font-mono font-bold uppercase tracking-wider block">Integração Google</span>
                {googleUser ? (
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      {googleUser.picture && (
                        <img 
                          src={googleUser.picture} 
                          alt={googleUser.name} 
                          className="h-8 w-8 rounded-xl object-cover border border-zinc-800"
                          referrerPolicy="no-referrer"
                        />
                      )}
                      <div>
                        <p className="text-xs font-bold text-white leading-none">{googleUser.name}</p>
                        <p className="text-[10px] text-zinc-500 font-mono mt-1">{googleUser.email}</p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={handleGoogleLogout}
                      className="px-2.5 py-1.5 bg-red-950/20 hover:bg-red-950/40 text-red-400 text-[10px] font-mono font-bold uppercase tracking-wider rounded-lg border border-red-900/30 transition-all cursor-pointer"
                    >
                      Desconectar
                    </button>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <p className="text-[10px] text-zinc-500 leading-normal font-mono">
                      Conecte sua conta do Google para preencher automaticamente seu nome, e-mail e imagem de perfil (sem alterar seus campos caso já estejam preenchidos), além de liberar o uso do Google Agenda.
                    </p>
                    <button
                      type="button"
                      onClick={handleGoogleLogin}
                      className="w-full py-2 bg-zinc-900 hover:bg-zinc-850 text-white text-xs font-bold font-mono uppercase tracking-wider rounded-xl border border-zinc-800 flex items-center justify-center gap-2 transition-all cursor-pointer"
                    >
                      <LogIn className="h-4 w-4 text-orange-500" />
                      Conectar Google Agenda
                    </button>
                  </div>
                )}
              </div>

              {/* Profile Photo Customizer */}
              <div className="p-4 bg-zinc-950 border border-zinc-900 rounded-2xl space-y-4">
                <span className="text-[10px] text-zinc-500 font-mono font-bold uppercase tracking-wider block">Foto de perfil</span>
                <div className="flex items-center gap-4">
                  <img 
                    src={editPhoto} 
                    alt="Preview" 
                    className="h-14 w-14 rounded-2xl object-cover border border-zinc-800"
                    referrerPolicy="no-referrer"
                  />
                  <div className="flex-1 space-y-2">
                    <input
                      type="url"
                      value={editPhoto}
                      onChange={(e) => setEditPhoto(e.target.value)}
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
                                    setEditPhoto(reader.result);
                                  }
                                };
                                reader.readAsDataURL(file);
                              }
                            }
                          }
                        }
                      }}
                      placeholder="URL ou Cole uma imagem (Ctrl + V)..."
                      className="w-full bg-[#16161a] border border-zinc-900 rounded-xl px-3 py-2 text-[11px] text-zinc-200 focus:outline-none focus:border-orange-500/40 font-mono"
                    />
                    <div className="flex items-center gap-3">
                      <button
                        type="button"
                        onClick={() => setShowAvatarDropdown(!showAvatarDropdown)}
                        className="text-[9px] font-mono font-bold text-orange-500 hover:underline"
                      >
                        {showAvatarDropdown ? 'Fechar presets' : 'Escolher presets'}
                      </button>
                      <span className="text-zinc-800 text-[9px]">•</span>
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        id="profile-avatar-upload"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) {
                            const reader = new FileReader();
                            reader.onloadend = () => {
                              if (typeof reader.result === 'string') {
                                setEditPhoto(reader.result);
                              }
                            };
                            reader.readAsDataURL(file);
                          }
                        }}
                      />
                      <button
                        type="button"
                        onClick={() => document.getElementById('profile-avatar-upload')?.click()}
                        className="text-[9px] font-mono font-bold text-zinc-400 hover:text-white flex items-center gap-1.5 hover:underline"
                      >
                        <Upload className="h-3 w-3 text-orange-500" />
                        <span>Carregar Arquivo</span>
                      </button>
                      <span className="text-zinc-800 text-[9px]">•</span>
                      <button
                        type="button"
                        onClick={async () => {
                          try {
                            if (navigator.clipboard && navigator.clipboard.read) {
                              const items = await navigator.clipboard.read();
                              for (const item of items) {
                                const imageType = item.types.find(type => type.startsWith('image/'));
                                if (imageType) {
                                  const blob = await item.getType(imageType);
                                  const reader = new FileReader();
                                  reader.onloadend = () => {
                                    if (typeof reader.result === 'string') {
                                      setEditPhoto(reader.result);
                                    }
                                  };
                                  reader.readAsDataURL(blob);
                                  return;
                                }
                              }
                            }
                            if (navigator.clipboard && navigator.clipboard.readText) {
                              const text = await navigator.clipboard.readText();
                              if (text && (text.startsWith('http') || text.startsWith('data:image/'))) {
                                setEditPhoto(text.trim());
                              }
                            }
                          } catch (err) {
                            console.error('Clipboard paste error:', err);
                          }
                        }}
                        className="text-[9px] font-mono font-bold text-amber-400 hover:text-amber-300 flex items-center gap-1.5 hover:underline cursor-pointer"
                        title="Colar mídia da área de transferência"
                      >
                        <Clipboard className="h-3 w-3 text-amber-400" />
                        <span>Colar da Área de Transferência</span>
                      </button>
                    </div>
                  </div>
                </div>

                {showAvatarDropdown && (
                  <div className="grid grid-cols-6 gap-2 p-2 bg-zinc-900/60 rounded-xl">
                    {AVATAR_PRESETS.map((preset, i) => (
                      <button
                        key={i}
                        type="button"
                        onClick={() => {
                          setEditPhoto(preset);
                          setShowAvatarDropdown(false);
                        }}
                        className="relative aspect-square rounded-lg overflow-hidden border border-zinc-800 hover:border-orange-500"
                      >
                        <img src={preset} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Nome */}
              <div className="space-y-1.5">
                <label className="text-[10px] text-zinc-500 font-mono font-bold uppercase tracking-wider block">Nome</label>
                <input
                  type="text"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="w-full bg-zinc-950 border border-zinc-900 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-orange-500/40"
                  required
                />
              </div>

              {/* Nome de Usuário */}
              <div className="space-y-1.5">
                <label className="text-[10px] text-zinc-500 font-mono font-bold uppercase tracking-wider block">Nome de Usuário (@handle)</label>
                <input
                  type="text"
                  value={editHandle}
                  onChange={(e) => setEditHandle(e.target.value)}
                  className="w-full bg-zinc-950 border border-zinc-900 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-orange-500/40 font-mono"
                  required
                />
              </div>

              {/* Email */}
              <div className="space-y-1.5">
                <label className="text-[10px] text-zinc-500 font-mono font-bold uppercase tracking-wider block">E-mail</label>
                <input
                  type="email"
                  value={editEmail}
                  onChange={(e) => setEditEmail(e.target.value)}
                  className="w-full bg-zinc-950 border border-zinc-900 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-orange-500/40"
                  required
                />
              </div>

              <div className="pt-2 space-y-2">
                <button
                  type="submit"
                  className="w-full py-2.5 bg-orange-500 hover:bg-orange-600 font-bold text-xs uppercase tracking-wider rounded-xl transition-all cursor-pointer"
                >
                  Salvar Informações
                </button>

                <button
                  type="button"
                  onClick={handleLogout}
                  className="w-full py-2.5 bg-red-950/20 hover:bg-red-950/40 border border-red-900/30 text-red-400 font-bold text-xs font-mono uppercase tracking-wider rounded-xl flex items-center justify-center gap-2 transition-all cursor-pointer"
                >
                  <LogOut className="h-4 w-4 text-red-500" />
                  <span>Sair da Conta (Logout)</span>
                </button>
              </div>
            </form>
          </motion.div>
        )}

        {/* VIEW 4: ALTERAR SENHA */}
        {currentScreen === 'alterar_senha' && (
          <motion.div
            key="alterar-senha-screen"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.25 }}
          >
            {/* Header */}
            <div className="p-4 border-b border-zinc-900 flex items-center gap-3">
              <button onClick={navigateBack} className="p-1.5 hover:bg-zinc-900 rounded-xl text-zinc-400">
                <ArrowLeft className="h-4.5 w-4.5" />
              </button>
              <h3 className="text-xs font-black tracking-wider uppercase font-mono text-zinc-300">Alterar Senha do Usuário</h3>
            </div>

            {saveFeedback && (
              <div className="m-4 p-3 bg-green-500/10 border border-green-500/20 text-green-400 text-[10px] font-mono rounded-xl flex items-center gap-2">
                <Check className="h-4 w-4" />
                <span>{saveFeedback}</span>
              </div>
            )}

            <form onSubmit={handleSavePassword} className="p-4 space-y-5">
              <div className="p-4 bg-zinc-950 border border-zinc-900 rounded-2xl">
                <p className="text-[10px] text-zinc-400 leading-normal font-sans">
                  Sua <strong className="text-white">Senha de Usuário</strong> é utilizada para autenticar seu perfil e proteger suas configurações pessoais. Ela é totalmente independente da <strong className="text-orange-400">Senha de Bloqueio do App</strong>.
                </p>
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] text-zinc-500 font-mono font-bold uppercase tracking-wider block">Nova Senha da Conta</label>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    value={editPassword}
                    onChange={(e) => setEditPassword(e.target.value)}
                    placeholder="Defina a nova senha do usuário"
                    className="w-full bg-zinc-950 border border-zinc-900 rounded-xl pl-3.5 pr-10 py-2.5 text-xs text-white focus:outline-none focus:border-orange-500/40"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-600 hover:text-zinc-400"
                  >
                    {showPassword ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                  </button>
                </div>
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  className="w-full py-2.5 bg-orange-500 hover:bg-orange-600 font-bold text-xs uppercase tracking-wider rounded-xl transition-all"
                >
                  Salvar Senha do Usuário
                </button>
              </div>
            </form>
          </motion.div>
        )}

        {/* VIEW 5: DESATIVAR CONTA */}
        {currentScreen === 'desativar_conta' && (
          <motion.div
            key="desativar-conta-screen"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.25 }}
            className="p-4 space-y-6"
          >
            {/* Header */}
            <div className="flex items-center gap-3 border-b border-zinc-900 pb-4">
              <button onClick={navigateBack} className="p-1.5 hover:bg-zinc-900 rounded-xl text-zinc-400">
                <ArrowLeft className="h-4.5 w-4.5" />
              </button>
              <h3 className="text-xs font-black tracking-wider uppercase font-mono text-zinc-300">Desativar Conta</h3>
            </div>

            <div className="flex items-center gap-3 p-4 bg-red-950/20 border border-red-900/30 rounded-2xl">
              <AlertTriangle className="h-5 w-5 text-red-500 shrink-0" />
              <span className="text-[11px] text-zinc-300 font-mono leading-relaxed">
                Atenção: Ao desativar sua conta, seu acesso ao Planner será congelado. Todo o seu progresso, hábitos e dados serão mantidos intactos na nuvem para quando você retornar.
              </span>
            </div>

            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <div className="h-2 w-2 rounded-full bg-zinc-500 mt-1.5 shrink-0" />
                <p className="text-[11px] text-zinc-400 leading-normal font-mono">Isso não apagará seu histórico de forma permanente, apenas ocultará do seu monitoramento ativo temporariamente.</p>
              </div>
              <div className="flex items-start gap-3">
                <div className="h-2 w-2 rounded-full bg-zinc-500 mt-1.5 shrink-0" />
                <p className="text-[11px] text-zinc-400 leading-normal font-mono">Você poderá reativar seu perfil instantaneamente clicando em "Reativar Minha Conta" na página inicial do app.</p>
              </div>
            </div>

            <div className="pt-6 border-t border-zinc-900">
              <button
                type="button"
                onClick={handleDeactivate}
                className="w-full py-3 bg-red-600 hover:bg-red-700 font-bold text-xs uppercase tracking-wider rounded-xl transition-colors"
              >
                Sim, Desativar Minha Conta
              </button>
            </div>
          </motion.div>
        )}

        {/* VIEW 6: SEGURANÇA E ACESSO À CONTA (Supabase Sync) */}
        {currentScreen === 'seguranca' && (
          <motion.div
            key="seguranca-screen"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.25 }}
            className="p-4 space-y-6"
          >
            {/* Header */}
            <div className="flex items-center gap-3 border-b border-zinc-900 pb-4">
              <button onClick={navigateBack} className="p-1.5 hover:bg-zinc-900 rounded-xl text-zinc-400">
                <ArrowLeft className="h-4.5 w-4.5" />
              </button>
              <h3 className="text-xs font-black tracking-wider uppercase font-mono text-zinc-300">Segurança e Sincronização</h3>
            </div>

            {syncFeedback && (
              <div className="p-3 bg-orange-500/10 border border-orange-500/20 text-orange-400 text-[10px] font-mono rounded-xl">
                {syncFeedback}
              </div>
            )}

            {/* Sync State Card */}
            <div className="p-4 bg-[#111115] border border-zinc-900 rounded-2xl space-y-3.5">
              <span className="text-[9px] text-zinc-500 font-mono font-bold uppercase block tracking-widest">Status da Sincronização</span>
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-xs font-bold font-mono">{syncKey}</h4>
                  <p className="text-[9px] text-zinc-500 font-mono">
                    {syncKey === 'USUARIO_UNICO' ? 'Código de sync local' : 'Perfil sincronizado em nuvem'}
                  </p>
                </div>
                <div className={`px-2 py-1 rounded border text-[9px] font-mono font-bold uppercase flex items-center gap-1 ${
                  syncStatus === 'synced'
                    ? 'bg-green-500/10 border-green-500/20 text-green-400'
                    : syncStatus === 'error'
                      ? 'bg-red-500/10 border-red-500/20 text-red-400'
                      : 'bg-amber-500/10 border-amber-500/20 text-amber-400 animate-pulse'
                }`}>
                  <Cloud className="h-3 w-3" />
                  <span>{syncStatus === 'synced' ? 'Ativo' : syncStatus === 'error' ? 'Erro' : 'Sincronizando'}</span>
                </div>
              </div>
            </div>

            {/* Change Sync Key Form */}
            <form onSubmit={handleCustomSyncConnect} className="space-y-3.5">
              <div className="space-y-1">
                <label className="text-[10px] text-zinc-500 font-mono font-bold uppercase block">Chave de Sincronização Personalizada</label>
                <input
                  type="text"
                  value={customSyncInput}
                  onChange={(e) => setCustomSyncInput(e.target.value)}
                  placeholder="Insira uma chave única (ex: seu_nome_2026)"
                  className="w-full bg-zinc-950 border border-zinc-900 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-orange-500/40 font-mono"
                />
              </div>
              <button
                type="submit"
                disabled={syncConnecting || !customSyncInput.trim()}
                className="w-full py-2.5 bg-zinc-900 hover:bg-zinc-850 border border-zinc-800 font-bold text-xs text-orange-500 uppercase tracking-wider rounded-xl transition-all"
              >
                {syncConnecting ? 'Conectando à Nuvem...' : 'Conectar Chave Cloud'}
              </button>
            </form>

            {syncKey !== 'USUARIO_UNICO' && (
              <div className="pt-2">
                <button
                  type="button"
                  onClick={handleResetSyncDefault}
                  className="w-full py-2 bg-red-950/20 hover:bg-red-950/40 border border-red-900/40 font-mono font-bold text-[10px] uppercase text-red-400 rounded-xl transition-all"
                >
                  Restaurar chave padrão (USUARIO_UNICO)
                </button>
              </div>
            )}

            {/* Dispositivos Conectados Shortcut in Seguridad */}
            <div className="p-4 bg-[#111115] border border-zinc-900 rounded-2xl space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <Laptop className="h-4 w-4 text-emerald-400" />
                  <div>
                    <h5 className="text-xs font-bold text-zinc-200">Dispositivos Conectados</h5>
                    <p className="text-[9px] text-zinc-500 font-mono">
                      {connectedDevices.length} aparelho(s) ativo(s) na conta
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => navigateTo('dispositivos_conectados')}
                  className="px-3 py-1.5 bg-zinc-900 hover:bg-zinc-850 border border-zinc-800 text-emerald-400 font-bold text-[10px] uppercase rounded-xl transition-all"
                >
                  Gerenciar
                </button>
              </div>
            </div>

            {/* IndexedDB Mutation Queue Card */}
            <div className="p-4 bg-[#111115] border border-zinc-900 rounded-2xl space-y-3.5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 bg-blue-500/10 border border-blue-500/20 rounded-xl">
                    <Database className="h-4 w-4 text-blue-400" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h5 className="text-xs font-bold text-zinc-200">Fila de Mutação Offline (IndexedDB)</h5>
                      <span className={`px-2 py-0.5 rounded-full text-[9px] font-mono font-bold uppercase border ${
                        queueStatus.pendingCount === 0
                          ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400'
                          : 'bg-amber-500/10 border-amber-500/20 text-amber-400'
                      }`}>
                        {queueStatus.pendingCount === 0 ? 'Fila Vazia' : `${queueStatus.pendingCount} pendente(s)`}
                      </span>
                    </div>
                    <p className="text-[10px] text-zinc-500 mt-0.5">
                      Garante persistência total contra quedas de rede ao editar checklists, tarefas, metas e finanças.
                    </p>
                  </div>
                </div>
              </div>

              {queueFeedback && (
                <div className="p-2.5 bg-blue-500/10 border border-blue-500/20 text-blue-400 text-[10px] font-mono rounded-xl">
                  {queueFeedback}
                </div>
              )}

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={handleFlushQueue}
                  disabled={queueFlushing || queueStatus.isProcessing}
                  className="flex-1 py-2 bg-zinc-900 hover:bg-zinc-850 border border-zinc-800 text-blue-400 font-bold text-[10px] font-mono uppercase rounded-xl transition-all flex items-center justify-center gap-1.5 disabled:opacity-50"
                >
                  <RefreshCw className={`h-3 w-3 ${queueFlushing || queueStatus.isProcessing ? 'animate-spin' : ''}`} />
                  <span>{queueFlushing || queueStatus.isProcessing ? 'Processando Fila...' : 'Sincronizar Fila Agora'}</span>
                </button>
              </div>
            </div>

            {/* --- APP LOCK CONFIGURATION SECTION --- */}
            <div className="border-t border-zinc-900/80 my-5 pt-5 space-y-4">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-gradient-to-br from-orange-500/20 via-amber-500/10 to-transparent rounded-xl border border-orange-500/30 flex items-center justify-center shadow-[0_0_15px_rgba(249,115,22,0.15)] flex-shrink-0">
                  <Lock className="h-5 w-5 text-orange-400 stroke-[2.2]" />
                </div>
                <div>
                  <h4 className="text-xs font-black uppercase tracking-wider text-zinc-200 font-sans flex items-center gap-2">
                    <span>Bloqueio do App</span>
                    <span className="text-[9px] font-mono px-2 py-0.5 rounded-full bg-orange-500/10 text-orange-400 border border-orange-500/20">PIN / TELA DE BLOQUEIO</span>
                  </h4>
                  <p className="text-[10px] text-zinc-500 font-sans mt-0.5">
                    Configure uma <strong className="text-zinc-300">Senha de Bloqueio do App</strong> para trancar a tela do Planner quando estiver inativo.
                  </p>
                </div>
              </div>

              {/* Toggle Bloqueio */}
              <div className="flex items-center justify-between p-4 bg-[#111115] border border-zinc-900 rounded-2xl">
                <div>
                  <h5 className="text-xs font-bold text-zinc-200">Ativar Bloqueio por Senha do App</h5>
                  <p className="text-[9px] text-zinc-500 font-mono mt-0.5">
                    {appLockPassword ? 'Bloqueio do app configurado.' : 'Defina uma senha de bloqueio primeiro.'}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    if (!appLockPassword) {
                      setShowLockPasswordForm(true);
                      setLockError('Você precisa cadastrar uma senha de bloqueio primeiro!');
                    } else {
                      setAppLockEnabled(!appLockEnabled);
                      setLockSuccess(appLockEnabled ? 'Bloqueio desativado!' : 'Bloqueio ativado!');
                      setTimeout(() => setLockSuccess(''), 3000);
                    }
                  }}
                  className={`w-9 h-5 rounded-full p-0.5 transition-all ${appLockEnabled ? 'bg-orange-500/40' : 'bg-zinc-800'}`}
                >
                  <div className={`w-4 h-4 rounded-full transition-all ${appLockEnabled ? 'translate-x-4 bg-orange-500 shadow-[0_0_6px_#f97316]' : 'translate-x-0 bg-zinc-500'}`} />
                </button>
              </div>

              {/* Toggle Impressão Digital / Biometria */}
              <div className={`flex items-center justify-between p-4 bg-[#111115] border border-zinc-900 rounded-2xl transition-all ${
                !appLockPassword ? 'opacity-65' : ''
              }`}>
                <div className="flex items-start gap-3">
                  <div className={`p-2 rounded-xl border mt-0.5 ${
                    appLockBiometricEnabled && appLockPassword
                      ? 'bg-orange-500/10 border-orange-500/30 text-orange-400'
                      : 'bg-zinc-900 border-zinc-800 text-zinc-500'
                  }`}>
                    <Fingerprint className="h-4 w-4 stroke-[2]" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <h5 className="text-xs font-bold text-zinc-200">Bloqueio por Impressão Digital</h5>
                      {!appLockPassword ? (
                        <span className="text-[9px] font-mono px-2 py-0.5 rounded-full bg-zinc-800 text-zinc-400 border border-zinc-700 font-semibold">
                          Requer Senha Definitiva
                        </span>
                      ) : (
                        <span className="text-[9px] font-mono px-2 py-0.5 rounded-full bg-orange-500/10 text-orange-400 border border-orange-500/20 font-semibold">
                          {appLockBiometricEnabled ? 'Ativado' : 'Disponível'}
                        </span>
                      )}
                    </div>
                    <p className="text-[9px] text-zinc-500 font-mono mt-0.5">
                      {!appLockPassword
                        ? 'Defina uma senha de bloqueio primeiro para habilitar a impressão digital.'
                        : appLockBiometricEnabled
                        ? 'Entrada por biometria / impressão digital ativada.'
                        : 'Ative para desbloquear o Life Organizer usando a digital do seu dispositivo.'}
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  disabled={!appLockPassword || isBiometricVerifying}
                  onClick={async () => {
                    if (!appLockPassword) {
                      setLockError('Defina uma senha de bloqueio primeiro para ativar a biometria!');
                      return;
                    }
                    
                    const nextState = !appLockBiometricEnabled;
                    if (setAppLockBiometricEnabled) setAppLockBiometricEnabled(nextState);
                    localStorage.setItem('mbc_app_lock_biometric_enabled', String(nextState));

                    if (nextState) {
                      setIsBiometricVerifying(true);
                      setLockError('');
                      setLockSuccess('Bloqueio por impressão digital ativado!');
                      try {
                        await verifyBiometric(userName);
                      } catch (err) {
                        // ignore error so setting remains enabled
                      } finally {
                        setIsBiometricVerifying(false);
                        setTimeout(() => setLockSuccess(''), 3000);
                      }
                    } else {
                      setLockSuccess('Bloqueio por impressão digital desativado.');
                      setTimeout(() => setLockSuccess(''), 3000);
                    }
                  }}
                  className={`w-9 h-5 rounded-full p-0.5 transition-all ${
                    appLockBiometricEnabled && appLockPassword ? 'bg-orange-500/40' : 'bg-zinc-800'
                  } ${!appLockPassword ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
                >
                  <div className={`w-4 h-4 rounded-full transition-all ${
                    appLockBiometricEnabled && appLockPassword ? 'translate-x-4 bg-orange-500 shadow-[0_0_6px_#f97316]' : 'translate-x-0 bg-zinc-500'
                  }`} />
                </button>
              </div>

              {/* Status Feedbacks */}
              {lockError && (
                <div className="p-3 bg-red-500/10 border border-red-500/20 text-red-400 text-[10px] font-mono rounded-xl">
                  ⚠️ {lockError}
                </div>
              )}

              {lockSuccess && (
                <div className="p-3 bg-green-500/10 border border-green-500/20 text-green-400 text-[10px] font-mono rounded-xl">
                  ✓ {lockSuccess}
                </div>
              )}

              {/* Tempo de Inatividade Personalizado (1 a 30 minutos) */}
              {appLockEnabled && (
                <div className="space-y-3 bg-zinc-950/80 p-4 border border-zinc-900 rounded-2xl">
                  <div className="flex items-center justify-between">
                    <div>
                      <label className="text-[10px] text-zinc-400 font-sans font-bold uppercase tracking-wider block">
                        Intervalo de Inatividade (Bloqueio)
                      </label>
                      <p className="text-[9px] text-zinc-500 font-mono mt-0.5">
                        Defina de 1 a 30 minutos antes do app trancar.
                      </p>
                    </div>
                    <span className="text-xs font-mono font-black text-orange-400 bg-orange-500/10 border border-orange-500/20 px-2.5 py-1 rounded-lg">
                      {appLockTimeout === -1 ? 'Sempre Logado' : `${appLockTimeout} min`}
                    </span>
                  </div>

                  <div className="flex items-center gap-3 pt-1">
                    <input
                      type="range"
                      min={1}
                      max={30}
                      value={appLockTimeout === -1 ? 5 : appLockTimeout}
                      onChange={(e) => {
                        const val = parseInt(e.target.value, 10);
                        setAppLockTimeout(val);
                        setLockSuccess(`Inatividade definida para ${val} minuto(s)!`);
                        setTimeout(() => setLockSuccess(''), 3000);
                      }}
                      className="flex-1 accent-orange-500 cursor-pointer h-1.5 bg-zinc-800 rounded-lg"
                    />
                    <div className="flex items-center gap-1 shrink-0">
                      <input
                        type="number"
                        min={1}
                        max={30}
                        value={appLockTimeout === -1 ? '' : appLockTimeout}
                        onChange={(e) => {
                          let val = parseInt(e.target.value, 10);
                          if (isNaN(val)) return;
                          if (val < 1) val = 1;
                          if (val > 30) val = 30;
                          setAppLockTimeout(val);
                          setLockSuccess(`Inatividade definida para ${val} minuto(s)!`);
                          setTimeout(() => setLockSuccess(''), 3000);
                        }}
                        placeholder="1-30"
                        className="w-14 bg-zinc-900 border border-zinc-800 rounded-lg px-2 py-1 text-xs text-center text-white font-mono font-bold focus:outline-none focus:border-orange-500/50"
                      />
                      <span className="text-[10px] text-zinc-500 font-mono font-bold">min</span>
                    </div>
                  </div>

                  {/* Preset quick buttons */}
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {[1, 2, 5, 10, 15, 30].map((mins) => (
                      <button
                        key={mins}
                        type="button"
                        onClick={() => {
                          setAppLockTimeout(mins);
                          setLockSuccess(`Inatividade definida para ${mins} min!`);
                          setTimeout(() => setLockSuccess(''), 3000);
                        }}
                        className={`px-2.5 py-1 text-[9px] font-mono rounded-lg border transition-all ${
                          appLockTimeout === mins
                            ? 'bg-orange-500/20 border-orange-500/50 text-orange-400 font-bold shadow-[0_0_8px_rgba(249,115,22,0.2)]'
                            : 'bg-zinc-900 border-zinc-850 text-zinc-400 hover:text-zinc-200'
                        }`}
                      >
                        {mins} min
                      </button>
                    ))}
                    <button
                      type="button"
                      onClick={() => {
                        setAppLockTimeout(-1);
                        setLockSuccess('Modo Sempre Logado ativado (sem auto-bloqueio)!');
                        setTimeout(() => setLockSuccess(''), 3000);
                      }}
                      className={`px-2.5 py-1 text-[9px] font-mono rounded-lg border transition-all ${
                        appLockTimeout === -1
                          ? 'bg-purple-500/20 border-purple-500/50 text-purple-400 font-bold'
                          : 'bg-zinc-900 border-zinc-850 text-zinc-400 hover:text-zinc-200'
                      }`}
                    >
                      Sempre Logado
                    </button>
                  </div>
                </div>
              )}

              {/* Button to setup or change lock password */}
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setShowLockPasswordForm(!showLockPasswordForm);
                    setLockError('');
                    setLockSuccess('');
                  }}
                  className="flex-1 py-2 bg-zinc-900 hover:bg-zinc-850 border border-zinc-800 font-bold text-xs text-zinc-400 hover:text-white uppercase tracking-wider rounded-xl transition-all"
                >
                  {appLockPassword ? 'Alterar Senha de Bloqueio' : 'Criar Senha de Bloqueio'}
                </button>

                {appLockEnabled && appLockPassword && (
                  <button
                    type="button"
                    onClick={() => setIsAppLocked(true)}
                    className="py-2 px-4 bg-red-950/20 hover:bg-red-950/40 border border-red-900/30 text-red-400 font-bold text-xs uppercase tracking-wider rounded-xl transition-all"
                  >
                    Bloquear Agora
                  </button>
                )}
              </div>

              {/* Expanded Password Setting Form */}
              <AnimatePresence>
                {showLockPasswordForm && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.2 }}
                    className="p-4 bg-zinc-950/80 border border-zinc-900 rounded-2xl space-y-4 overflow-hidden"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] text-zinc-400 font-bold uppercase tracking-wider">Configurar Senha de Bloqueio do App</span>
                      <button 
                        type="button"
                        onClick={() => setShowLockPasswordForm(false)} 
                        className="text-zinc-500 hover:text-zinc-300"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>

                    <div className="space-y-3">
                      <div className="space-y-1">
                        <label className="text-[9px] text-zinc-500 font-sans font-bold uppercase block">Nova Senha de Bloqueio do App</label>
                        <input
                          type="password"
                          value={newLockPassword}
                          onChange={(e) => setNewLockPassword(e.target.value)}
                          placeholder="Digite o PIN/Senha da tela de bloqueio"
                          className="w-full bg-zinc-950 border border-zinc-900 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-orange-500/40 font-mono tracking-widest font-bold"
                        />
                      </div>
                      
                      <div className="space-y-1">
                        <label className="text-[9px] text-zinc-500 font-sans font-bold uppercase block">Confirmar Senha de Bloqueio</label>
                        <input
                          type="password"
                          value={confirmLockPassword}
                          onChange={(e) => setConfirmLockPassword(e.target.value)}
                          placeholder="Repita a nova senha de bloqueio"
                          className="w-full bg-zinc-950 border border-zinc-900 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-orange-500/40 font-mono tracking-widest font-bold"
                        />
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => {
                        if (!newLockPassword) {
                          setLockError('A senha de bloqueio não pode ser vazia!');
                          return;
                        }
                        if (newLockPassword !== confirmLockPassword) {
                          setLockError('As senhas de bloqueio não coincidem!');
                          return;
                        }
                        setAppLockPassword(newLockPassword);
                        setAppLockEnabled(true);
                        setNewLockPassword('');
                        setConfirmLockPassword('');
                        setLockError('');
                        setShowLockPasswordForm(false);
                        setLockSuccess('Senha de bloqueio do app salva e ativa!');
                        setTimeout(() => setLockSuccess(''), 3000);
                      }}
                      className="w-full py-2 bg-emerald-500 hover:bg-emerald-600 text-zinc-950 font-black text-xs uppercase tracking-widest rounded-xl transition-all shadow-md"
                    >
                      Salvar Senha de Bloqueio do App
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Custom Lock Screen Wallpapers (Desktop & Mobile) */}
              <div className="pt-4 border-t border-zinc-900 space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="text-xs font-bold text-zinc-200 flex items-center gap-1.5">
                      <ImageIcon className="h-4 w-4 text-orange-400" />
                      Wallpaper da Tela de Bloqueio
                    </h4>
                    <p className="text-[10px] text-zinc-500 font-mono">Personalize a imagem de fundo para Desktop e Mobile</p>
                  </div>
                  {appLockEnabled && (
                    <button
                      type="button"
                      onClick={() => setIsAppLocked(true)}
                      className="px-2.5 py-1 bg-orange-500/10 hover:bg-orange-500/20 border border-orange-500/30 text-orange-400 font-mono font-bold text-[9px] rounded-lg transition-all flex items-center gap-1"
                      title="Testar como fica a tela de bloqueio"
                    >
                      <Eye className="w-3 h-3" />
                      <span>Testar Tela</span>
                    </button>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Desktop Wallpaper Card */}
                  <div className="p-3.5 bg-zinc-950 border border-zinc-900 rounded-xl space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5">
                        <Monitor className="h-3.5 w-3.5 text-orange-400" />
                        <span className="text-xs font-bold text-zinc-200">Desktop (Horizontal 16:9)</span>
                      </div>
                      {lockScreenDesktopImage && (
                        <button
                          type="button"
                          onClick={() => {
                            if (setLockScreenDesktopImage) setLockScreenDesktopImage('');
                            setLockSuccess('Wallpaper de desktop restaurado para o padrão!');
                            setTimeout(() => setLockSuccess(''), 3000);
                          }}
                          className="text-[9px] text-red-400 hover:text-red-300 font-mono flex items-center gap-1"
                        >
                          <Trash2 className="w-3 h-3" />
                          <span>Restaurar</span>
                        </button>
                      )}
                    </div>

                    {/* Preview Desktop */}
                    <div className="relative aspect-video w-full rounded-lg overflow-hidden border border-zinc-800 bg-zinc-900 flex items-center justify-center">
                      <img 
                        src={lockScreenDesktopImage || defaultLockBg || '/assets/1271888.jpg'} 
                        alt="Desktop Lock Screen Preview"
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          (e.target as HTMLImageElement).src = defaultLockBg || '/assets/1271888.jpg';
                        }}
                      />
                      <div className="absolute inset-0 bg-black/40 flex items-center justify-center pointer-events-none">
                        <div className="p-2 bg-black/60 rounded-full border border-white/20">
                          <Lock className="w-4 h-4 text-orange-400" />
                        </div>
                      </div>
                    </div>

                    {/* Actions Desktop */}
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <label className="flex-1 cursor-pointer">
                          <input 
                            type="file" 
                            accept="image/*" 
                            className="hidden" 
                            onChange={(e) => {
                              const file = e.target.files?.[0];
                              if (file && setLockScreenDesktopImage) {
                                const reader = new FileReader();
                                reader.onload = (ev) => {
                                  const result = ev.target?.result as string;
                                  if (result) {
                                    const img = new Image();
                                    img.onload = () => {
                                      const canvas = document.createElement('canvas');
                                      const maxDim = 1920;
                                      let w = img.width;
                                      let h = img.height;
                                      if (w > maxDim || h > maxDim) {
                                        if (w > h) {
                                          h = Math.round((h * maxDim) / w);
                                          w = maxDim;
                                        } else {
                                          w = Math.round((w * maxDim) / h);
                                          h = maxDim;
                                        }
                                      }
                                      canvas.width = w;
                                      canvas.height = h;
                                      const ctx = canvas.getContext('2d');
                                      if (ctx) {
                                        ctx.drawImage(img, 0, 0, w, h);
                                        const optimized = canvas.toDataURL('image/jpeg', 0.85);
                                        setLockScreenDesktopImage(optimized);
                                      } else {
                                        setLockScreenDesktopImage(result);
                                      }
                                      addXp(25);
                                      setLockSuccess('Wallpaper de bloqueio Desktop atualizado!');
                                      setTimeout(() => setLockSuccess(''), 3000);
                                    };
                                    img.src = result;
                                  }
                                };
                                reader.readAsDataURL(file);
                              }
                            }}
                          />
                          <div className="w-full py-2 bg-orange-500/10 hover:bg-orange-500/20 border border-orange-500/30 text-orange-400 font-mono font-bold text-[10px] rounded-lg flex items-center justify-center gap-1.5 transition-all text-center">
                            <Upload className="w-3.5 h-3.5" />
                            <span>Upload Desktop</span>
                          </div>
                        </label>

                        <button
                          type="button"
                          onClick={async () => {
                            try {
                              if (navigator.clipboard && navigator.clipboard.read) {
                                const items = await navigator.clipboard.read();
                                for (const item of items) {
                                  const imageType = item.types.find(t => t.startsWith('image/'));
                                  if (imageType) {
                                    const blob = await item.getType(imageType);
                                    const reader = new FileReader();
                                    reader.onload = (ev) => {
                                      const res = ev.target?.result as string;
                                      if (res && setLockScreenDesktopImage) {
                                        setLockScreenDesktopImage(res);
                                        addXp(25);
                                        setLockSuccess('Imagem Desktop colada da área de transferência!');
                                        setTimeout(() => setLockSuccess(''), 3000);
                                      }
                                    };
                                    reader.readAsDataURL(blob);
                                    return;
                                  }
                                }
                              }
                              if (navigator.clipboard && navigator.clipboard.readText) {
                                const text = await navigator.clipboard.readText();
                                if (text && (text.startsWith('http') || text.startsWith('data:image/')) && setLockScreenDesktopImage) {
                                  setLockScreenDesktopImage(text.trim());
                                  addXp(25);
                                  setLockSuccess('Link da imagem Desktop colado com sucesso!');
                                  setTimeout(() => setLockSuccess(''), 3000);
                                }
                              }
                            } catch (err) {
                              console.error('Clipboard error:', err);
                            }
                          }}
                          className="px-3 py-2 bg-zinc-850 hover:bg-zinc-800 border border-zinc-750 text-zinc-300 font-mono font-bold text-[10px] rounded-lg flex items-center gap-1 transition-all"
                          title="Colar imagem ou URL da área de transferência"
                        >
                          <Clipboard className="w-3.5 h-3.5" />
                          <span>Colar</span>
                        </button>
                      </div>

                      <input 
                        type="text" 
                        value={lockScreenDesktopImage} 
                        onChange={(e) => setLockScreenDesktopImage && setLockScreenDesktopImage(e.target.value)}
                        placeholder="Ou URL da imagem desktop (https://...)" 
                        className="w-full bg-zinc-950 border border-zinc-850 rounded-lg px-2.5 py-1.5 text-[10px] text-zinc-200 placeholder-zinc-600 focus:outline-none focus:border-orange-500/40 font-mono"
                      />
                    </div>
                  </div>

                  {/* Mobile Wallpaper Card */}
                  <div className="p-3.5 bg-zinc-950 border border-zinc-900 rounded-xl space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5">
                        <Smartphone className="h-3.5 w-3.5 text-orange-400" />
                        <span className="text-xs font-bold text-zinc-200">Mobile (Vertical 9:16)</span>
                      </div>
                      {lockScreenMobileImage && (
                        <button
                          type="button"
                          onClick={() => {
                            if (setLockScreenMobileImage) setLockScreenMobileImage('');
                            setLockSuccess('Wallpaper mobile restaurado para o padrão!');
                            setTimeout(() => setLockSuccess(''), 3000);
                          }}
                          className="text-[9px] text-red-400 hover:text-red-300 font-mono flex items-center gap-1"
                        >
                          <Trash2 className="w-3 h-3" />
                          <span>Restaurar</span>
                        </button>
                      )}
                    </div>

                    {/* Preview Mobile */}
                    <div className="relative aspect-video w-full rounded-lg overflow-hidden border border-zinc-800 bg-zinc-900 flex items-center justify-center">
                      <img 
                        src={lockScreenMobileImage || lockScreenDesktopImage || defaultLockBg || '/assets/1271888.jpg'} 
                        alt="Mobile Lock Screen Preview"
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          (e.target as HTMLImageElement).src = defaultLockBg || '/assets/1271888.jpg';
                        }}
                      />
                      <div className="absolute inset-0 bg-black/40 flex items-center justify-center pointer-events-none">
                        <div className="p-2 bg-black/60 rounded-full border border-white/20">
                          <Lock className="w-4 h-4 text-orange-400" />
                        </div>
                      </div>
                    </div>

                    {/* Actions Mobile */}
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <label className="flex-1 cursor-pointer">
                          <input 
                            type="file" 
                            accept="image/*" 
                            className="hidden" 
                            onChange={(e) => {
                              const file = e.target.files?.[0];
                              if (file && setLockScreenMobileImage) {
                                const reader = new FileReader();
                                reader.onload = (ev) => {
                                  const result = ev.target?.result as string;
                                  if (result) {
                                    const img = new Image();
                                    img.onload = () => {
                                      const canvas = document.createElement('canvas');
                                      const maxDim = 1920;
                                      let w = img.width;
                                      let h = img.height;
                                      if (w > maxDim || h > maxDim) {
                                        if (w > h) {
                                          h = Math.round((h * maxDim) / w);
                                          w = maxDim;
                                        } else {
                                          w = Math.round((w * maxDim) / h);
                                          h = maxDim;
                                        }
                                      }
                                      canvas.width = w;
                                      canvas.height = h;
                                      const ctx = canvas.getContext('2d');
                                      if (ctx) {
                                        ctx.drawImage(img, 0, 0, w, h);
                                        const optimized = canvas.toDataURL('image/jpeg', 0.85);
                                        setLockScreenMobileImage(optimized);
                                      } else {
                                        setLockScreenMobileImage(result);
                                      }
                                      addXp(25);
                                      setLockSuccess('Wallpaper de bloqueio Mobile atualizado!');
                                      setTimeout(() => setLockSuccess(''), 3000);
                                    };
                                    img.src = result;
                                  }
                                };
                                reader.readAsDataURL(file);
                              }
                            }}
                          />
                          <div className="w-full py-2 bg-orange-500/10 hover:bg-orange-500/20 border border-orange-500/30 text-orange-400 font-mono font-bold text-[10px] rounded-lg flex items-center justify-center gap-1.5 transition-all text-center">
                            <Upload className="w-3.5 h-3.5" />
                            <span>Upload Mobile</span>
                          </div>
                        </label>

                        <button
                          type="button"
                          onClick={async () => {
                            try {
                              if (navigator.clipboard && navigator.clipboard.read) {
                                const items = await navigator.clipboard.read();
                                for (const item of items) {
                                  const imageType = item.types.find(t => t.startsWith('image/'));
                                  if (imageType) {
                                    const blob = await item.getType(imageType);
                                    const reader = new FileReader();
                                    reader.onload = (ev) => {
                                      const res = ev.target?.result as string;
                                      if (res && setLockScreenMobileImage) {
                                        setLockScreenMobileImage(res);
                                        addXp(25);
                                        setLockSuccess('Imagem Mobile colada da área de transferência!');
                                        setTimeout(() => setLockSuccess(''), 3000);
                                      }
                                    };
                                    reader.readAsDataURL(blob);
                                    return;
                                  }
                                }
                              }
                              if (navigator.clipboard && navigator.clipboard.readText) {
                                const text = await navigator.clipboard.readText();
                                if (text && (text.startsWith('http') || text.startsWith('data:image/')) && setLockScreenMobileImage) {
                                  setLockScreenMobileImage(text.trim());
                                  addXp(25);
                                  setLockSuccess('Link da imagem Mobile colado com sucesso!');
                                  setTimeout(() => setLockSuccess(''), 3000);
                                }
                              }
                            } catch (err) {
                              console.error('Clipboard error:', err);
                            }
                          }}
                          className="px-3 py-2 bg-zinc-850 hover:bg-zinc-800 border border-zinc-750 text-zinc-300 font-mono font-bold text-[10px] rounded-lg flex items-center gap-1 transition-all"
                          title="Colar imagem ou URL da área de transferência"
                        >
                          <Clipboard className="w-3.5 h-3.5" />
                          <span>Colar</span>
                        </button>
                      </div>

                      <input 
                        type="text" 
                        value={lockScreenMobileImage} 
                        onChange={(e) => setLockScreenMobileImage && setLockScreenMobileImage(e.target.value)}
                        placeholder="Ou URL da imagem mobile (https://...)" 
                        className="w-full bg-zinc-950 border border-zinc-850 rounded-lg px-2.5 py-1.5 text-[10px] text-zinc-200 placeholder-zinc-600 focus:outline-none focus:border-orange-500/40 font-mono"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {/* VIEW 7: NOTIFICAÇÕES (Em Breve) */}
        {currentScreen === 'notificacoes' && (
          <motion.div
            key="notificacoes-screen"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.25 }}
            className="p-4 space-y-6"
          >
            {/* Header */}
            <div className="flex items-center gap-3 border-b border-zinc-900 pb-4">
              <button onClick={navigateBack} className="p-1.5 hover:bg-zinc-900 rounded-xl text-zinc-400">
                <ArrowLeft className="h-4.5 w-4.5" />
              </button>
              <div>
                <h3 className="text-xs font-black tracking-wider uppercase font-mono text-zinc-300">Ajustes de Alerta</h3>
                <p className="text-[9px] text-zinc-500 font-mono uppercase tracking-wider">Lembretes de performance</p>
              </div>
            </div>

            {/* Switch items */}
            <div className="space-y-4">
              {/* New Web Push & Server Background Notification Diagnostic Center */}
              <NotificationSettings syncKey={syncKey} />

              {/* Meu Dia Reminder */}
              <div className="p-4 bg-zinc-950 border border-zinc-900 rounded-2xl space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="text-xs font-bold text-zinc-200 flex items-center gap-2">
                      <Bell className="h-3.5 w-3.5 text-orange-500" />
                      Lembrete de Meu Dia
                    </h4>
                    <p className="text-[9px] text-zinc-500 font-mono mt-0.5">
                      Alerta diário para diário pessoal, orações, checklist e hábitos.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      const next = !dailyWorkspaceNotifEnabled;
                      setDailyWorkspaceNotifEnabled(next);
                      localStorage.setItem('mbc_daily_workspace_notif_enabled', String(next));
                    }}
                    className={`w-9 h-5 rounded-full p-0.5 transition-all ${dailyWorkspaceNotifEnabled ? 'bg-orange-500/40' : 'bg-zinc-800'}`}
                  >
                    <div className={`w-4 h-4 rounded-full transition-all ${dailyWorkspaceNotifEnabled ? 'translate-x-4 bg-orange-400' : 'translate-x-0 bg-zinc-500'}`} />
                  </button>
                </div>

                {dailyWorkspaceNotifEnabled && (
                  <div className="pt-2.5 flex items-center justify-between border-t border-zinc-900/80">
                    <span className="text-[10px] text-zinc-400 font-bold uppercase font-mono">
                      Horário do Lembrete
                    </span>
                    <input
                      type="time"
                      value={dailyWorkspaceReminderTime}
                      onChange={(e) => {
                        const val = e.target.value;
                        setDailyWorkspaceReminderTime(val);
                        localStorage.setItem('mbc_daily_workspace_reminder_time', val);
                        if (val && typeof Notification !== 'undefined' && Notification.permission === 'default') {
                          Notification.requestPermission().catch(() => {});
                        }
                      }}
                      className="bg-zinc-900 border border-zinc-800 rounded-xl px-3 py-1.5 text-xs text-white font-mono focus:outline-none focus:border-orange-500/50"
                    />
                  </div>
                )}
              </div>

              {/* Lembretes de Reviews Periódicas (Semanal & Mensal) */}
              <div className="p-4 bg-zinc-950 border border-orange-500/30 rounded-2xl space-y-4">
                <div className="flex items-center justify-between border-b border-zinc-900 pb-3">
                  <div>
                    <h4 className="text-xs font-bold text-orange-400 flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-orange-400" />
                      Lembretes de Review (Semanal & Mensal)
                    </h4>
                    <p className="text-[9px] text-zinc-400 font-mono mt-0.5">
                      Defina os dias da semana e do mês para fechar seus ciclos de avaliação e aprendizado.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setReminderModalTab('all');
                      setIsReviewReminderModalOpen(true);
                    }}
                    className="px-3 py-1.5 bg-orange-500/10 hover:bg-orange-500/20 text-orange-400 border border-orange-500/30 rounded-xl text-[10px] font-mono font-bold transition-all flex items-center gap-1.5 cursor-pointer"
                  >
                    <Sliders className="h-3 w-3" />
                    Personalizar
                  </button>
                </div>

                {/* Sub-item: Review Semanal */}
                <div className="p-3.5 bg-zinc-900/40 border border-zinc-850 rounded-xl space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-xs font-bold text-zinc-200 block">
                        Review Semanal
                      </span>
                      <span className="text-[10px] text-zinc-500 font-mono">
                        Lembrar toda {getWeeklyReviewDayLabel(reviewReminders.weekly.dayOfWeek)} às {reviewReminders.weekly.time}
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        const updated: ReviewRemindersSettings = {
                          ...reviewReminders,
                          weekly: { ...reviewReminders.weekly, enabled: !reviewReminders.weekly.enabled }
                        };
                        setReviewReminders(updated);
                        saveReviewRemindersSettings(updated);
                      }}
                      className={`w-9 h-5 rounded-full p-0.5 transition-all cursor-pointer ${reviewReminders.weekly.enabled ? 'bg-orange-500' : 'bg-zinc-800'}`}
                    >
                      <div className={`w-4 h-4 rounded-full bg-white transition-all ${reviewReminders.weekly.enabled ? 'translate-x-4' : 'translate-x-0'}`} />
                    </button>
                  </div>

                  {reviewReminders.weekly.enabled && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-2 border-t border-zinc-800/80">
                      <div>
                        <label className="text-[9px] text-zinc-400 font-mono uppercase block mb-1">
                          Dia da Semana:
                        </label>
                        <select
                          value={reviewReminders.weekly.dayOfWeek}
                          onChange={(e) => {
                            const val = parseInt(e.target.value, 10);
                            const updated: ReviewRemindersSettings = {
                              ...reviewReminders,
                              weekly: { ...reviewReminders.weekly, dayOfWeek: val }
                            };
                            setReviewReminders(updated);
                            saveReviewRemindersSettings(updated);
                          }}
                          className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-2.5 py-1.5 text-xs text-white font-mono focus:outline-none focus:border-orange-500"
                        >
                          <option value={0}>Domingo (Fechamento da semana)</option>
                          <option value={6}>Sábado (Balanço de fim de semana)</option>
                          <option value={1}>Segunda-feira (Primeiro dia da próxima semana)</option>
                          <option value={5}>Sexta-feira (Encerramento dos dias úteis)</option>
                          <option value={4}>Quinta-feira</option>
                          <option value={3}>Quarta-feira</option>
                          <option value={2}>Terça-feira</option>
                        </select>
                      </div>

                      <div>
                        <label className="text-[9px] text-zinc-400 font-mono uppercase block mb-1">
                          Horário:
                        </label>
                        <input
                          type="time"
                          value={reviewReminders.weekly.time}
                          onChange={(e) => {
                            const val = e.target.value;
                            const updated: ReviewRemindersSettings = {
                              ...reviewReminders,
                              weekly: { ...reviewReminders.weekly, time: val }
                            };
                            setReviewReminders(updated);
                            saveReviewRemindersSettings(updated);
                          }}
                          className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-2.5 py-1.5 text-xs text-white font-mono focus:outline-none focus:border-orange-500"
                        />
                      </div>
                    </div>
                  )}
                </div>

                {/* Sub-item: Review Mensal */}
                <div className="p-3.5 bg-zinc-900/40 border border-zinc-850 rounded-xl space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-xs font-bold text-zinc-200 block">
                        Review Mensal
                      </span>
                      <span className="text-[10px] text-zinc-500 font-mono">
                        Lembrar no {getMonthlyReviewTimingLabel(reviewReminders.monthly)} às {reviewReminders.monthly.time}
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        const updated: ReviewRemindersSettings = {
                          ...reviewReminders,
                          monthly: { ...reviewReminders.monthly, enabled: !reviewReminders.monthly.enabled }
                        };
                        setReviewReminders(updated);
                        saveReviewRemindersSettings(updated);
                      }}
                      className={`w-9 h-5 rounded-full p-0.5 transition-all cursor-pointer ${reviewReminders.monthly.enabled ? 'bg-orange-500' : 'bg-zinc-800'}`}
                    >
                      <div className={`w-4 h-4 rounded-full bg-white transition-all ${reviewReminders.monthly.enabled ? 'translate-x-4' : 'translate-x-0'}`} />
                    </button>
                  </div>

                  {reviewReminders.monthly.enabled && (
                    <div className="space-y-2 pt-2 border-t border-zinc-800/80">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        <div>
                          <label className="text-[9px] text-zinc-400 font-mono uppercase block mb-1">
                            Regra do Mês:
                          </label>
                          <select
                            value={reviewReminders.monthly.timingType}
                            onChange={(e) => {
                              const val = e.target.value as any;
                              const updated: ReviewRemindersSettings = {
                                ...reviewReminders,
                                monthly: { ...reviewReminders.monthly, timingType: val }
                              };
                              setReviewReminders(updated);
                              saveReviewRemindersSettings(updated);
                            }}
                            className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-2.5 py-1.5 text-xs text-white font-mono focus:outline-none focus:border-orange-500"
                          >
                            <option value="last_day">Último dia do mês atual (ex: 28, 30, 31)</option>
                            <option value="first_day_next">Primeiro dia do próximo mês (dia 1º)</option>
                            <option value="specific_day">Dia fixo específico</option>
                          </select>
                        </div>

                        <div>
                          <label className="text-[9px] text-zinc-400 font-mono uppercase block mb-1">
                            Horário:
                          </label>
                          <input
                            type="time"
                            value={reviewReminders.monthly.time}
                            onChange={(e) => {
                              const val = e.target.value;
                              const updated: ReviewRemindersSettings = {
                                ...reviewReminders,
                                monthly: { ...reviewReminders.monthly, time: val }
                              };
                              setReviewReminders(updated);
                              saveReviewRemindersSettings(updated);
                            }}
                            className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-2.5 py-1.5 text-xs text-white font-mono focus:outline-none focus:border-orange-500"
                          />
                        </div>
                      </div>

                      {reviewReminders.monthly.timingType === 'specific_day' && (
                        <div className="pt-1 flex items-center justify-between gap-3 bg-zinc-950/60 p-2.5 rounded-lg border border-zinc-850">
                          <span className="text-[10px] text-zinc-400 font-mono">
                            Número do Dia do Mês:
                          </span>
                          <div className="flex items-center gap-2">
                            <input
                              type="number"
                              min="1"
                              max="31"
                              value={reviewReminders.monthly.dayOfMonth}
                              onChange={(e) => {
                                const val = Math.max(1, Math.min(31, parseInt(e.target.value, 10) || 30));
                                const updated: ReviewRemindersSettings = {
                                  ...reviewReminders,
                                  monthly: { ...reviewReminders.monthly, dayOfMonth: val }
                                };
                                setReviewReminders(updated);
                                saveReviewRemindersSettings(updated);
                              }}
                              className="w-16 bg-zinc-900 border border-zinc-750 text-white font-mono text-xs px-2 py-1 rounded text-center"
                            />
                            <span className="text-[10px] text-zinc-500 font-mono">(ex: dia 30, dia 28)</span>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>

              {/* Habits alert */}
              <div className="flex items-center justify-between p-4 bg-zinc-950 border border-zinc-900 rounded-2xl">
                <div>
                  <h4 className="text-xs font-bold text-zinc-200">Alertas Diários de Hábitos</h4>
                  <p className="text-[9px] text-zinc-500 font-mono mt-0.5">Disparar notificação silenciosa às 08:00.</p>
                </div>
                <button
                  type="button"
                  onClick={() => setNotifDaily(!notifDaily)}
                  className={`w-9 h-5 rounded-full p-0.5 transition-all ${notifDaily ? 'bg-orange-500/40' : 'bg-zinc-800'}`}
                >
                  <div className={`w-4 h-4 rounded-full bg-white transition-all ${notifDaily ? 'translate-x-4 bg-orange-400' : 'translate-x-0 bg-zinc-500'}`} />
                </button>
              </div>

              {/* Finance Alert */}
              <div className="flex items-center justify-between p-4 bg-zinc-950 border border-zinc-900 rounded-2xl">
                <div>
                  <h4 className="text-xs font-bold text-zinc-200">Notificação de Orçamento</h4>
                  <p className="text-[9px] text-zinc-500 font-mono mt-0.5">Notificar caso ultrapasse o limite definido.</p>
                </div>
                <button
                  type="button"
                  onClick={() => setNotifFinances(!notifFinances)}
                  className={`w-9 h-5 rounded-full p-0.5 transition-all ${notifFinances ? 'bg-orange-500/40' : 'bg-zinc-800'}`}
                >
                  <div className={`w-4 h-4 rounded-full bg-white transition-all ${notifFinances ? 'translate-x-4 bg-orange-400' : 'translate-x-0 bg-zinc-500'}`} />
                </button>
              </div>

              {/* Sync check */}
              <div className="flex items-center justify-between p-4 bg-zinc-950 border border-zinc-900 rounded-2xl">
                <div>
                  <h4 className="text-xs font-bold text-zinc-200">Confirmação de Sync</h4>
                  <p className="text-[9px] text-zinc-500 font-mono mt-0.5">Emitir aviso quando dados forem salvos.</p>
                </div>
                <button
                  type="button"
                  onClick={() => setNotifRoutine(!notifRoutine)}
                  className={`w-9 h-5 rounded-full p-0.5 transition-all ${notifRoutine ? 'bg-orange-500/40' : 'bg-zinc-800'}`}
                >
                  <div className={`w-4 h-4 rounded-full bg-white transition-all ${notifRoutine ? 'translate-x-4 bg-orange-400' : 'translate-x-0 bg-zinc-500'}`} />
                </button>
              </div>
            </div>

            <div className="p-3 bg-zinc-950 border border-zinc-900 rounded-xl text-[9px] text-zinc-500 font-mono leading-normal">
              Nota: Os interruptores salvam suas preferências localmente. As notificações push nativas integradas à rotina serão liberadas na próxima atualização automática do sistema.
            </div>
          </motion.div>
        )}

        {/* VIEW 8: ACESSIBILIDADE, EXIBIÇÃO E IDIOMAS */}
        {currentScreen === 'exibicao' && (
          <motion.div
            key="exibicao-screen"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.25 }}
            className="p-4 space-y-6"
          >
            {/* Header */}
            <div className="flex items-center gap-3 border-b border-zinc-900 pb-4">
              <button onClick={navigateBack} className="p-1.5 hover:bg-zinc-900 rounded-xl text-zinc-400">
                <ArrowLeft className="h-4.5 w-4.5" />
              </button>
              <h3 className="text-xs font-black tracking-wider uppercase font-mono text-zinc-300">Exibição e Preferências de Edição</h3>
            </div>

            {/* Modo de Edição Livre */}
            <div className="p-4 bg-zinc-950 border border-zinc-900 rounded-2xl flex items-center justify-between">
              <div className="space-y-0.5 flex-1 pr-4">
                <div className="flex items-center gap-2">
                  <h4 className="text-xs font-bold text-zinc-200">Modo de Edição Livre (Tempo Real)</h4>
                  {freeEditMode && (
                    <span className="text-[8px] font-bold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-full font-mono uppercase">
                      Ativo
                    </span>
                  )}
                </div>
                <p className="text-[10px] text-zinc-500 font-mono leading-normal">
                  Salva as alterações automaticamente em tempo real sem a necessidade de clicar no botão Salvar.
                </p>
              </div>
              <button
                type="button"
                onClick={() => {
                  const updated = !freeEditMode;
                  if (setFreeEditMode) setFreeEditMode(updated);
                  localStorage.setItem('mbc_freeEditMode', String(updated));
                  addXp(10);
                }}
                className={`px-3 py-1.5 rounded-lg text-[9px] font-mono font-bold uppercase transition-all ${
                  freeEditMode 
                    ? 'bg-orange-500/15 text-orange-400 border border-orange-500/20' 
                    : 'bg-zinc-900 border border-zinc-800 text-zinc-500'
                }`}
              >
                {freeEditMode ? 'Ativo' : 'Inativo (Padrão)'}
              </button>
            </div>

            {/* Modo Padrão do Kanban (Projetos) */}
            <div className="p-4 bg-zinc-950 border border-zinc-900 rounded-2xl space-y-3">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <div className="flex items-center gap-2">
                    <h4 className="text-xs font-bold text-zinc-200">Modo Padrão do Kanban (Projetos)</h4>
                    <span className="text-[8px] font-bold text-orange-400 bg-orange-500/10 border border-orange-500/20 px-2 py-0.5 rounded-full font-mono uppercase">
                      {kanbanDefaultStyle === 'simplificado' ? 'Simplificado' : 'Padrão'}
                    </span>
                  </div>
                  <p className="text-[10px] text-zinc-500 font-mono leading-normal">
                    Escolha se o quadro Kanban dos projetos deve abrir por padrão no modelo padrão ou simplificado.
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 pt-1">
                <button
                  type="button"
                  onClick={() => handleSetKanbanDefaultStyle('padrao')}
                  className={`flex items-center justify-center gap-2 py-3 px-4 rounded-xl text-xs font-bold font-mono transition-all cursor-pointer ${
                    kanbanDefaultStyle === 'padrao'
                      ? 'bg-orange-500/15 text-orange-400 border border-orange-500/30 shadow-[0_0_15px_rgba(249,115,22,0.15)]'
                      : 'bg-zinc-900/60 border border-zinc-800/80 text-zinc-400 hover:text-zinc-200 hover:border-zinc-700'
                  }`}
                >
                  <FolderKanban className="w-4 h-4" />
                  <span>Padrão</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleSetKanbanDefaultStyle('simplificado')}
                  className={`flex items-center justify-center gap-2 py-3 px-4 rounded-xl text-xs font-bold font-mono transition-all cursor-pointer ${
                    kanbanDefaultStyle === 'simplificado'
                      ? 'bg-orange-500/15 text-orange-400 border border-orange-500/30 shadow-[0_0_15px_rgba(249,115,22,0.15)]'
                      : 'bg-zinc-900/60 border border-zinc-800/80 text-zinc-400 hover:text-zinc-200 hover:border-zinc-700'
                  }`}
                >
                  <Sliders className="w-4 h-4" />
                  <span>Simplificado</span>
                </button>
              </div>

              <p className="text-[11px] text-zinc-500 font-mono">
                {kanbanDefaultStyle === 'simplificado'
                  ? '• Modo Simplificado: visual minimalista com cartões compactos e foco na leitura rápida.'
                  : '• Modo Padrão: exibe detalhes completos, badges, contadores de tarefas e ferramentas estendidas.'}
              </p>
            </div>

            {/* Toggle Fullscreen behavior */}
            <div className="p-4 bg-zinc-950 border border-zinc-900 rounded-2xl flex items-center justify-between">
              <div className="space-y-0.5 flex-1 pr-4">
                <h4 className="text-xs font-bold text-zinc-200">Tela cheia automática</h4>
                <p className="text-[10px] text-zinc-500 font-mono leading-normal">Habilitar tela cheia automaticamente nas interações com o Planner.</p>
              </div>
              <button
                type="button"
                onClick={() => {
                  const updated = !autoFullscreen;
                  setAutoFullscreen(updated);
                  localStorage.setItem('mbc_autoFullscreen', String(updated));
                  if (updated && !document.fullscreenElement) {
                    try {
                      const docEl = document.documentElement as any;
                      if (docEl.requestFullscreen) {
                        docEl.requestFullscreen();
                      } else if (docEl.webkitRequestFullscreen) {
                        docEl.webkitRequestFullscreen();
                      } else if (docEl.msRequestFullscreen) {
                        docEl.msRequestFullscreen();
                      }
                      localStorage.setItem('mbc_fullscreen', 'true');
                    } catch (e) {
                      console.error('Falha ao acionar tela cheia:', e);
                    }
                  }
                  addXp(10);
                }}
                className={`px-3 py-1.5 rounded-lg text-[9px] font-mono font-bold uppercase transition-all ${
                  autoFullscreen 
                    ? 'bg-orange-500/15 text-orange-400 border border-orange-500/20' 
                    : 'bg-zinc-900 border border-zinc-800 text-zinc-500'
                }`}
              >
                {autoFullscreen ? 'Ativo' : 'Inativo'}
              </button>
            </div>

            {/* Toggle Date Selector in Missões Diárias */}
            <div className="p-4 bg-zinc-950 border border-zinc-900 rounded-2xl flex items-center justify-between">
              <div className="space-y-0.5 flex-1 pr-4">
                <h4 className="text-xs font-bold text-zinc-200">Navegador e Seletor de Datas (Missões Diárias)</h4>
                <p className="text-[10px] text-zinc-500 font-mono leading-normal">Exibir o seletor/navegador de datas no topo do Checklist de Missões Diárias.</p>
              </div>
              <button
                type="button"
                onClick={() => {
                  if (setShowDateSelector) {
                    const updated = !showDateSelector;
                    setShowDateSelector(updated);
                    localStorage.setItem('mbc_show_checklist_date_selector', String(updated));
                    addXp(10);
                  }
                }}
                className={`px-3 py-1.5 rounded-lg text-[9px] font-mono font-bold uppercase transition-all ${
                  showDateSelector 
                    ? 'bg-orange-500/15 text-orange-400 border border-orange-500/20' 
                    : 'bg-zinc-900 border border-zinc-800 text-zinc-500'
                }`}
              >
                {showDateSelector ? 'Habilitado' : 'Desabilitado'}
              </button>
            </div>

            {/* Toggle Card Glow Effect */}
            <div className="p-4 bg-zinc-950 border border-zinc-900 rounded-2xl flex items-center justify-between">
              <div className="space-y-0.5 flex-1 pr-4">
                <div className="flex items-center gap-2">
                  <h4 className="text-xs font-bold text-zinc-200">Efeito Glow nos Cards</h4>
                  {cardGlowEnabled && (
                    <span className="text-[8px] font-bold text-cyan-400 bg-cyan-500/10 border border-cyan-500/20 px-2 py-0.5 rounded-full font-mono uppercase">
                      Ativo
                    </span>
                  )}
                </div>
                <p className="text-[10px] text-zinc-500 font-mono leading-normal">
                  Iluminação sutil e brilho estético nos cards e métricas principais do sistema (como no consumo de água).
                </p>
              </div>
              <button
                type="button"
                onClick={() => {
                  if (setCardGlowEnabled) {
                    const updated = !cardGlowEnabled;
                    setCardGlowEnabled(updated);
                    localStorage.setItem('mbc_card_glow_enabled', String(updated));
                    addXp(10);
                  }
                }}
                className={`px-3 py-1.5 rounded-lg text-[9px] font-mono font-bold uppercase transition-all ${
                  cardGlowEnabled 
                    ? 'bg-orange-500/15 text-orange-400 border border-orange-500/20' 
                    : 'bg-zinc-900 border border-zinc-800 text-zinc-500'
                }`}
              >
                {cardGlowEnabled ? 'Habilitado' : 'Desabilitado'}
              </button>
            </div>

            {/* Toggle Mobile Lateral Slide Animation */}
            <div className="p-4 bg-zinc-950 border border-zinc-900 rounded-2xl flex items-center justify-between">
              <div className="space-y-0.5 flex-1 pr-4">
                <div className="flex items-center gap-2">
                  <h4 className="text-xs font-bold text-zinc-200">Transição Lateral de Abas (Mobile)</h4>
                  {mobileSlideTransition && (
                    <span className="text-[8px] font-bold text-orange-400 bg-orange-500/10 border border-orange-500/20 px-2 py-0.5 rounded-full font-mono uppercase">
                      Suave
                    </span>
                  )}
                </div>
                <p className="text-[10px] text-zinc-500 font-mono leading-normal">
                  Animação fluida de deslize lateral ao alternar entre Agenda, Home, Tarefas e Notas no celular.
                </p>
              </div>
              <button
                type="button"
                onClick={() => {
                  if (setMobileSlideTransition) {
                    const updated = !mobileSlideTransition;
                    setMobileSlideTransition(updated);
                    localStorage.setItem('mbc_mobile_slide_transition', String(updated));
                    addXp(10);
                  }
                }}
                className={`px-3 py-1.5 rounded-lg text-[9px] font-mono font-bold uppercase transition-all ${
                  mobileSlideTransition 
                    ? 'bg-orange-500/15 text-orange-400 border border-orange-500/20' 
                    : 'bg-zinc-900 border border-zinc-800 text-zinc-500'
                }`}
              >
                {mobileSlideTransition ? 'Habilitado' : 'Desabilitado'}
              </button>
            </div>

            {/* EXIBIÇÃO: BARRA DE NAVEGAÇÃO (Comportamento Fixa/Flexível & Formato Reta/Oval) */}
            <div className="p-5 bg-zinc-950 border border-zinc-900 rounded-2xl space-y-5">
              {/* Header */}
              <div className="space-y-1">
                <span className="text-[10px] font-mono font-bold tracking-widest text-[#f04444] uppercase">
                  Exibição
                </span>
                <h4 className="text-sm font-black text-white tracking-wide uppercase">
                  Barra de Navegação
                </h4>
                <p className="text-xs text-zinc-400 font-sans">
                  Comportamento e formato da barra inferior de navegação.
                </p>
              </div>

              {/* Seletor 1: Comportamento (Fixa vs Flexível) */}
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  {/* FIXA */}
                  <button
                    type="button"
                    onClick={() => {
                      if (setMobileNavbarMode) {
                        setMobileNavbarMode('fixed');
                        localStorage.setItem('mbc_mobile_navbar_mode', 'fixed');
                        addXp(10);
                      }
                    }}
                    className={`flex flex-col items-center justify-center gap-2 py-4 rounded-2xl transition-all cursor-pointer font-mono font-bold text-xs uppercase tracking-wider ${
                      mobileNavbarMode === 'fixed'
                        ? 'bg-[#f04444] text-white shadow-[0_0_20px_rgba(240,68,68,0.35)]'
                        : 'bg-zinc-900/60 border border-zinc-800/80 text-zinc-400 hover:text-zinc-200 hover:border-zinc-700'
                    }`}
                  >
                    <Lock className="w-5 h-5 mb-0.5" />
                    <span>Fixa</span>
                  </button>

                  {/* FLEXÍVEL */}
                  <button
                    type="button"
                    onClick={() => {
                      if (setMobileNavbarMode) {
                        setMobileNavbarMode('flexible');
                        localStorage.setItem('mbc_mobile_navbar_mode', 'flexible');
                        addXp(10);
                      }
                    }}
                    className={`flex flex-col items-center justify-center gap-2 py-4 rounded-2xl transition-all cursor-pointer font-mono font-bold text-xs uppercase tracking-wider ${
                      mobileNavbarMode === 'flexible'
                        ? 'bg-[#f04444] text-white shadow-[0_0_20px_rgba(240,68,68,0.35)]'
                        : 'bg-zinc-900/60 border border-zinc-800/80 text-zinc-400 hover:text-zinc-200 hover:border-zinc-700'
                    }`}
                  >
                    <ArrowUpDown className="w-5 h-5 mb-0.5" />
                    <span>Flexível</span>
                  </button>
                </div>

                <p className="text-xs text-zinc-400 font-sans">
                  {mobileNavbarMode === 'flexible'
                    ? 'A navbar recolhe ao deslizar para baixo e volta ao deslizar para cima.'
                    : 'A barra de navegação permanece sempre fixa e visível na parte inferior da tela.'}
                </p>
              </div>

              {/* Seletor 2: Formato da Barra (Reta vs Oval) */}
              <div className="pt-4 border-t border-zinc-900/80 space-y-3">
                <div>
                  <h5 className="text-xs font-bold text-white tracking-wide uppercase font-mono">
                    Formato da Barra
                  </h5>
                  <p className="text-[11px] text-zinc-400 font-sans">
                    Visual da barra inferior: clássica (reta) ou curva neon.
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  {/* RETA */}
                  <button
                    type="button"
                    onClick={() => {
                      setCurrentNavbarShape('reta');
                      if (setMobileNavbarShape) {
                        setMobileNavbarShape('reta');
                      }
                      localStorage.setItem('mbc_mobile_navbar_shape', 'reta');
                      addXp(10);
                    }}
                    className={`flex flex-col items-center justify-center gap-2 py-4 rounded-2xl transition-all cursor-pointer font-mono font-bold text-xs uppercase tracking-wider ${
                      currentNavbarShape === 'reta'
                        ? 'bg-[#f04444] text-white shadow-[0_0_20px_rgba(240,68,68,0.35)]'
                        : 'bg-zinc-900/60 border border-zinc-800/80 text-zinc-400 hover:text-zinc-200 hover:border-zinc-700'
                    }`}
                  >
                    <div className="w-5 h-5 flex flex-col justify-center items-center gap-1">
                      <div className="w-4 h-0.5 bg-current rounded-full" />
                      <div className="w-4 h-0.5 bg-current rounded-full" />
                      <div className="w-4 h-0.5 bg-current rounded-full" />
                    </div>
                    <span>Reta</span>
                  </button>

                  {/* OVAL */}
                  <button
                    type="button"
                    onClick={() => {
                      setCurrentNavbarShape('oval');
                      if (setMobileNavbarShape) {
                        setMobileNavbarShape('oval');
                      }
                      localStorage.setItem('mbc_mobile_navbar_shape', 'oval');
                      addXp(10);
                    }}
                    className={`flex flex-col items-center justify-center gap-2 py-4 rounded-2xl transition-all cursor-pointer font-mono font-bold text-xs uppercase tracking-wider ${
                      currentNavbarShape === 'oval'
                        ? 'bg-[#f04444] text-white shadow-[0_0_20px_rgba(240,68,68,0.35)]'
                        : 'bg-zinc-900/60 border border-zinc-800/80 text-zinc-400 hover:text-zinc-200 hover:border-zinc-700'
                    }`}
                  >
                    <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                      <path d="M 4 14 C 8 8, 16 8, 20 14" />
                    </svg>
                    <span>Oval</span>
                  </button>
                </div>

                <p className="text-xs text-zinc-400 font-sans">
                  {currentNavbarShape === 'reta'
                    ? 'Barra clássica reta, como no layout original.'
                    : 'Barra flutuante moderna curva neon com bordas arredondadas.'}
                </p>
              </div>
            </div>

            {/* Tema do Sistema: Modo Claro vs Modo Escuro */}
            <div className="p-5 bg-zinc-950 border border-zinc-900 rounded-2xl space-y-4">
              <div className="flex items-center justify-between border-b border-zinc-900/80 pb-3">
                <div className="space-y-0.5">
                  <div className="flex items-center gap-2">
                    <Sun className="w-4 h-4 text-amber-400" />
                    <h4 className="text-xs font-bold text-zinc-100">Tema do Sistema: Modo Claro vs Modo Escuro</h4>
                    <span className="text-[8px] font-bold text-amber-400 bg-amber-500/10 border border-amber-500/20 px-2 py-0.5 rounded-full font-mono uppercase">
                      Visual
                    </span>
                  </div>
                  <p className="text-[10px] text-zinc-400 font-mono leading-normal">
                    Alterne entre a estética arquitetural clara inspirada em estúdio minimalista ou a experiência noturna cinemática.
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* 1. MODO CLARO ARQUITETURAL */}
                <button
                  type="button"
                  onClick={() => {
                    if (setThemeMode) {
                      setThemeMode('light');
                    }
                    localStorage.setItem('mbc_theme_mode', 'light');
                    document.documentElement.classList.add('light-mode');
                    document.documentElement.classList.remove('dark');
                    document.body.classList.add('light-mode');
                    addXp(15);
                  }}
                  className={`relative p-3.5 rounded-2xl border text-left transition-all cursor-pointer flex flex-col justify-between overflow-hidden group ${
                    themeMode === 'light'
                      ? 'bg-amber-500/10 border-amber-500/80 shadow-[0_0_25px_rgba(245,158,11,0.2)]'
                      : 'bg-zinc-950/60 border-zinc-850 hover:border-zinc-700 hover:bg-zinc-900/40'
                  }`}
                >
                  {/* Miniature preview for Light Mode */}
                  <div className="w-full h-12 rounded-lg bg-[#f8f8f6] border border-zinc-300 relative overflow-hidden mb-2.5 flex items-center justify-center p-2 shadow-inner">
                    <div 
                      className="absolute inset-0 opacity-70"
                      style={{
                        backgroundImage: 'radial-gradient(circle, rgba(0,0,0,0.12) 1px, transparent 1px)',
                        backgroundSize: '10px 10px',
                        WebkitMaskImage: 'radial-gradient(ellipse 60% 50% at 50% 50%, black 20%, transparent 80%)'
                      }}
                    />
                    <div className="relative z-10 px-3 py-1 rounded-md bg-white border border-black/10 shadow-sm flex items-center gap-1.5">
                      <div className="w-2 h-2 rounded-full bg-amber-500" />
                      <span className="text-[9px] font-mono text-zinc-800 font-bold">Studio Marfim</span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <div className="flex items-center gap-1.5">
                        <h5 className="text-xs font-bold text-white">Modo Claro (Arquiteto)</h5>
                        <span className="text-[8px] font-mono px-1.5 py-0.2 rounded bg-amber-500/15 text-amber-400 border border-amber-500/30 font-bold">
                          Design Referência
                        </span>
                      </div>
                      <p className="text-[9.5px] text-zinc-400 font-mono mt-0.5">
                        Canvas marfim suave (#F8F8F6), cartões brancos, micro-trama de 32px e estética de museu.
                      </p>
                    </div>
                    <div className={`w-5 h-5 rounded-full flex items-center justify-center shrink-0 border ml-2 ${
                      themeMode === 'light'
                        ? 'bg-amber-500 border-amber-400 text-zinc-950 shadow-sm'
                        : 'border-zinc-700 bg-zinc-900/40 text-transparent'
                    }`}>
                      <Check className="w-3 h-3 stroke-[3]" />
                    </div>
                  </div>
                </button>

                {/* 2. MODO ESCURO CINEMÁTICO */}
                <button
                  type="button"
                  onClick={() => {
                    if (setThemeMode) {
                      setThemeMode('dark');
                    }
                    localStorage.setItem('mbc_theme_mode', 'dark');
                    document.documentElement.classList.remove('light-mode');
                    document.documentElement.classList.add('dark');
                    document.body.classList.remove('light-mode');
                    addXp(15);
                  }}
                  className={`relative p-3.5 rounded-2xl border text-left transition-all cursor-pointer flex flex-col justify-between overflow-hidden group ${
                    themeMode === 'dark'
                      ? 'bg-zinc-900/90 border-orange-500/80 shadow-[0_0_25px_rgba(249,115,22,0.18)]'
                      : 'bg-zinc-950/60 border-zinc-850 hover:border-zinc-700 hover:bg-zinc-900/40'
                  }`}
                >
                  {/* Miniature preview for Dark Mode */}
                  <div className="w-full h-12 rounded-lg bg-[#040405] border border-zinc-800 relative overflow-hidden mb-2.5 flex items-center justify-center p-2">
                    <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_60%_at_50%_-10%,rgba(249,115,22,0.45),transparent_70%)]" />
                    <div 
                      className="absolute inset-0 opacity-40"
                      style={{
                        backgroundImage: 'radial-gradient(circle, rgba(255,255,255,0.2) 1px, transparent 1px)',
                        backgroundSize: '8px 8px',
                        WebkitMaskImage: 'radial-gradient(ellipse 60% 50% at 50% 50%, black 20%, transparent 80%)'
                      }}
                    />
                    <div className="relative z-10 px-3 py-1 rounded-md bg-zinc-900/90 border border-zinc-700 flex items-center gap-1.5">
                      <div className="w-2 h-2 rounded-full bg-orange-500" />
                      <span className="text-[9px] font-mono text-zinc-300 font-bold">Obsidian Zênite</span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <div className="flex items-center gap-1.5">
                        <h5 className="text-xs font-bold text-white">Modo Escuro (Cinemático)</h5>
                        <span className="text-[8px] font-mono px-1.5 py-0.2 rounded bg-zinc-800 text-zinc-400 border border-zinc-700 font-bold">
                          Original
                        </span>
                      </div>
                      <p className="text-[9.5px] text-zinc-400 font-mono mt-0.5">
                        Luz de estúdio cenográfica, contraste preto puro obsidian e suporte a painel AMOLED.
                      </p>
                    </div>
                    <div className={`w-5 h-5 rounded-full flex items-center justify-center shrink-0 border ml-2 ${
                      themeMode === 'dark'
                        ? 'bg-orange-500 border-orange-400 text-white shadow-sm'
                        : 'border-zinc-700 bg-zinc-900/40 text-transparent'
                    }`}>
                      <Check className="w-3 h-3 stroke-[3]" />
                    </div>
                  </div>
                </button>
              </div>
            </div>

            {/* Atmosfera de Fundo & Iluminação Cinemática */}
            <div className="p-5 bg-zinc-950 border border-zinc-900 rounded-2xl space-y-4">
              <div className="flex items-center justify-between border-b border-zinc-900/80 pb-3">
                <div className="space-y-0.5">
                  <div className="flex items-center gap-2">
                    <Layers className="w-4 h-4 text-orange-400" />
                    <h4 className="text-xs font-bold text-zinc-100">Atmosfera de Fundo & Iluminação Cinemática</h4>
                    <span className="text-[8px] font-bold text-orange-400 bg-orange-500/10 border border-orange-500/20 px-2 py-0.5 rounded-full font-mono uppercase">
                      Premium
                    </span>
                  </div>
                  <p className="text-[10px] text-zinc-400 font-mono leading-normal">
                    Luz cenográfica de zênite, micro-trama arquitetural mascarada com decaimento suave e subtons profundos que acompanham cada aba.
                  </p>
                </div>
              </div>

              {/* 4 Modos de Atmosfera */}
              <div className="space-y-2">
                <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider font-mono block">
                  Modo de Iluminação
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {/* 1. CINEMÁTICO DE LUXO */}
                  <button
                    type="button"
                    onClick={() => handleSelectBackgroundAtmosphere('cinematic')}
                    className={`relative p-3.5 rounded-2xl border text-left transition-all cursor-pointer flex flex-col justify-between overflow-hidden group ${
                      backgroundAtmosphere === 'cinematic'
                        ? 'bg-zinc-900/90 border-orange-500/80 shadow-[0_0_25px_rgba(249,115,22,0.18)]'
                        : 'bg-zinc-950/60 border-zinc-850 hover:border-zinc-700 hover:bg-zinc-900/40'
                    }`}
                  >
                    {/* Visual miniature preview */}
                    <div className="w-full h-10 rounded-lg bg-[#040405] border border-zinc-800 relative overflow-hidden mb-2.5 flex items-center justify-center">
                      <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_60%_at_50%_-10%,rgba(249,115,22,0.45),transparent_70%)]" />
                      <div 
                        className="absolute inset-0 opacity-40" 
                        style={{
                          backgroundImage: 'radial-gradient(circle, rgba(255,255,255,0.2) 1px, transparent 1px)',
                          backgroundSize: '8px 8px',
                          WebkitMaskImage: 'radial-gradient(ellipse 60% 50% at 50% 50%, black 20%, transparent 80%)'
                        }} 
                      />
                      <span className="text-[9px] font-mono text-zinc-400 font-bold relative z-10">Zênite + Grid</span>
                    </div>

                    <div className="flex items-center justify-between">
                      <div>
                        <div className="flex items-center gap-1.5">
                          <h5 className="text-xs font-bold text-white">Cinemático de Luxo</h5>
                          <span className="text-[8px] font-mono px-1.5 py-0.2 rounded bg-orange-500/10 text-orange-400 border border-orange-500/20 font-bold">
                            Recomendado
                          </span>
                        </div>
                        <p className="text-[9.5px] text-zinc-400 font-mono mt-0.5">
                          Luz de estúdio, micro-trama técnica e subtons líquidos por aba.
                        </p>
                      </div>
                      <div className={`w-5 h-5 rounded-full flex items-center justify-center shrink-0 border ml-2 ${
                        backgroundAtmosphere === 'cinematic' 
                          ? 'bg-orange-500 border-orange-400 text-white shadow-sm' 
                          : 'border-zinc-700 bg-zinc-900/40 text-transparent'
                      }`}>
                        <Check className="w-3 h-3 stroke-[3]" />
                      </div>
                    </div>
                  </button>

                  {/* 2. ESTÚDIO SUAVE */}
                  <button
                    type="button"
                    onClick={() => handleSelectBackgroundAtmosphere('studio')}
                    className={`relative p-3.5 rounded-2xl border text-left transition-all cursor-pointer flex flex-col justify-between overflow-hidden group ${
                      backgroundAtmosphere === 'studio'
                        ? 'bg-zinc-900/90 border-orange-500/80 shadow-[0_0_25px_rgba(249,115,22,0.18)]'
                        : 'bg-zinc-950/60 border-zinc-850 hover:border-zinc-700 hover:bg-zinc-900/40'
                    }`}
                  >
                    {/* Visual miniature preview */}
                    <div className="w-full h-10 rounded-lg bg-[#040405] border border-zinc-800 relative overflow-hidden mb-2.5 flex items-center justify-center">
                      <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_60%_at_50%_-10%,rgba(16,185,129,0.4),transparent_70%)]" />
                      <span className="text-[9px] font-mono text-zinc-400 font-bold relative z-10">Luz Suave</span>
                    </div>

                    <div className="flex items-center justify-between">
                      <div>
                        <h5 className="text-xs font-bold text-white">Estúdio Suave</h5>
                        <p className="text-[9.5px] text-zinc-400 font-mono mt-0.5">
                          Iluminação cenográfica de museu com transição por aba, sem o micro-grid.
                        </p>
                      </div>
                      <div className={`w-5 h-5 rounded-full flex items-center justify-center shrink-0 border ml-2 ${
                        backgroundAtmosphere === 'studio' 
                          ? 'bg-orange-500 border-orange-400 text-white shadow-sm' 
                          : 'border-zinc-700 bg-zinc-900/40 text-transparent'
                      }`}>
                        <Check className="w-3 h-3 stroke-[3]" />
                      </div>
                    </div>
                  </button>

                  {/* 3. MINIMALISTA PURO */}
                  <button
                    type="button"
                    onClick={() => handleSelectBackgroundAtmosphere('minimalista')}
                    className={`relative p-3.5 rounded-2xl border text-left transition-all cursor-pointer flex flex-col justify-between overflow-hidden group ${
                      backgroundAtmosphere === 'minimalista'
                        ? 'bg-zinc-900/90 border-orange-500/80 shadow-[0_0_25px_rgba(249,115,22,0.18)]'
                        : 'bg-zinc-950/60 border-zinc-850 hover:border-zinc-700 hover:bg-zinc-900/40'
                    }`}
                  >
                    {/* Visual miniature preview */}
                    <div className="w-full h-10 rounded-lg bg-[#08080a] border border-zinc-800 relative overflow-hidden mb-2.5 flex items-center justify-center">
                      <span className="text-[9px] font-mono text-zinc-500 font-bold">Grafite Neutro</span>
                    </div>

                    <div className="flex items-center justify-between">
                      <div>
                        <h5 className="text-xs font-bold text-white">Minimalista Puro</h5>
                        <p className="text-[9.5px] text-zinc-400 font-mono mt-0.5">
                          Tonalidade escura grafite contínua, sem gradientes coloridos ou texturas.
                        </p>
                      </div>
                      <div className={`w-5 h-5 rounded-full flex items-center justify-center shrink-0 border ml-2 ${
                        backgroundAtmosphere === 'minimalista' 
                          ? 'bg-orange-500 border-orange-400 text-white shadow-sm' 
                          : 'border-zinc-700 bg-zinc-900/40 text-transparent'
                      }`}>
                        <Check className="w-3 h-3 stroke-[3]" />
                      </div>
                    </div>
                  </button>

                  {/* 4. PRETO AMOLED */}
                  <button
                    type="button"
                    onClick={() => handleSelectBackgroundAtmosphere('amoled')}
                    className={`relative p-3.5 rounded-2xl border text-left transition-all cursor-pointer flex flex-col justify-between overflow-hidden group ${
                      backgroundAtmosphere === 'amoled'
                        ? 'bg-zinc-900/90 border-orange-500/80 shadow-[0_0_25px_rgba(249,115,22,0.18)]'
                        : 'bg-zinc-950/60 border-zinc-850 hover:border-zinc-700 hover:bg-zinc-900/40'
                    }`}
                  >
                    {/* Visual miniature preview */}
                    <div className="w-full h-10 rounded-lg bg-black border border-zinc-850 relative overflow-hidden mb-2.5 flex items-center justify-center">
                      <span className="text-[9px] font-mono text-zinc-600 font-bold">#000000 Puro</span>
                    </div>

                    <div className="flex items-center justify-between">
                      <div>
                        <h5 className="text-xs font-bold text-white">Preto AMOLED</h5>
                        <p className="text-[9.5px] text-zinc-400 font-mono mt-0.5">
                          Preto absoluto #000000 (desliga pixels em telas OLED para máxima economia de energia).
                        </p>
                      </div>
                      <div className={`w-5 h-5 rounded-full flex items-center justify-center shrink-0 border ml-2 ${
                        backgroundAtmosphere === 'amoled' 
                          ? 'bg-orange-500 border-orange-400 text-white shadow-sm' 
                          : 'border-zinc-700 bg-zinc-900/40 text-transparent'
                      }`}>
                        <Check className="w-3 h-3 stroke-[3]" />
                      </div>
                    </div>
                  </button>
                </div>
              </div>

              {/* Controles de Ajuste Fino (quando não for AMOLED) */}
              {backgroundAtmosphere !== 'amoled' && (
                <div className="pt-3 border-t border-zinc-900/80 space-y-4">
                  {/* Intensidade da Luz Cenográfica */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider font-mono">
                        Intensidade da Luz Cenográfica
                      </span>
                      <span className="text-[9px] font-mono text-orange-400">
                        {backgroundIntensity === 'discrete' ? 'Discreta (55%)' : backgroundIntensity === 'vibrant' ? 'Vibrante (150%)' : 'Sutil (100% - Padrão de Luxo)'}
                      </span>
                    </div>

                    <div className="grid grid-cols-3 gap-2">
                      <button
                        type="button"
                        onClick={() => handleSelectBackgroundIntensity('discrete')}
                        className={`py-2 px-3 rounded-xl text-center text-[10px] font-mono font-bold transition-all cursor-pointer ${
                          backgroundIntensity === 'discrete'
                            ? 'bg-orange-500/20 text-orange-400 border border-orange-500/40 shadow-sm'
                            : 'bg-zinc-900/60 border border-zinc-850 text-zinc-400 hover:text-white'
                        }`}
                      >
                        Discreta
                      </button>
                      <button
                        type="button"
                        onClick={() => handleSelectBackgroundIntensity('subtle')}
                        className={`py-2 px-3 rounded-xl text-center text-[10px] font-mono font-bold transition-all cursor-pointer ${
                          backgroundIntensity === 'subtle'
                            ? 'bg-orange-500/20 text-orange-400 border border-orange-500/40 shadow-sm'
                            : 'bg-zinc-900/60 border border-zinc-850 text-zinc-400 hover:text-white'
                        }`}
                      >
                        Sutil (Padrão)
                      </button>
                      <button
                        type="button"
                        onClick={() => handleSelectBackgroundIntensity('vibrant')}
                        className={`py-2 px-3 rounded-xl text-center text-[10px] font-mono font-bold transition-all cursor-pointer ${
                          backgroundIntensity === 'vibrant'
                            ? 'bg-orange-500/20 text-orange-400 border border-orange-500/40 shadow-sm'
                            : 'bg-zinc-900/60 border border-zinc-850 text-zinc-400 hover:text-white'
                        }`}
                      >
                        Vibrante
                      </button>
                    </div>
                  </div>

                  {/* Alternador do Micro-Grid (disponível no modo Cinemático) */}
                  {backgroundAtmosphere === 'cinematic' && (
                    <div className="flex items-center justify-between p-3.5 bg-zinc-900/40 border border-zinc-850 rounded-xl">
                      <div className="space-y-0.5">
                        <div className="flex items-center gap-2">
                          <Grid className="w-3.5 h-3.5 text-zinc-400" />
                          <h6 className="text-xs font-bold text-zinc-200">Micro-Trama Arquitetural Mascarada</h6>
                        </div>
                        <p className="text-[9.5px] text-zinc-400 font-mono">
                          Malha de micropontos com máscara radial que se dissolve suavemente nas bordas.
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleToggleBackgroundGrid(!backgroundGridEnabled)}
                        className={`w-9 h-5 rounded-full p-0.5 transition-all cursor-pointer shrink-0 ml-3 ${
                          backgroundGridEnabled ? 'bg-orange-500/40' : 'bg-zinc-800'
                        }`}
                      >
                        <div className={`w-4 h-4 rounded-full transition-all ${
                          backgroundGridEnabled ? 'translate-x-4 bg-orange-400' : 'translate-x-0 bg-zinc-500'
                        }`} />
                      </button>
                    </div>
                  )}

                  {/* Animações Suaves do Fundo */}
                  <div className="flex items-center justify-between p-3.5 bg-zinc-900/40 border border-zinc-850 rounded-xl">
                    <div className="space-y-0.5">
                      <div className="flex items-center gap-2">
                        <Sparkles className="w-3.5 h-3.5 text-orange-400" />
                        <h6 className="text-xs font-bold text-zinc-200">Animações Dinâmicas Suaves</h6>
                        <span className="text-[8px] font-mono px-1.5 py-0.2 rounded bg-orange-500/10 text-orange-400 border border-orange-500/20 font-bold uppercase">
                          Fluida
                        </span>
                      </div>
                      <p className="text-[9.5px] text-zinc-400 font-mono">
                        Respiração orgânica do zênite (14s), orbs em deriva suave e varredura de horizonte nos cartões.
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleToggleBackgroundAnimated(!backgroundAnimated)}
                      className={`w-9 h-5 rounded-full p-0.5 transition-all cursor-pointer shrink-0 ml-3 ${
                        backgroundAnimated ? 'bg-orange-500/40' : 'bg-zinc-800'
                      }`}
                    >
                      <div className={`w-4 h-4 rounded-full transition-all ${
                        backgroundAnimated ? 'translate-x-4 bg-orange-400' : 'translate-x-0 bg-zinc-500'
                      }`} />
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Esquema de Cores e Personalização */}
            <div className="p-4 bg-zinc-950 border border-zinc-900 rounded-2xl flex items-center justify-between">
              <div className="space-y-0.5 flex-1 pr-4">
                <div className="flex items-center gap-2">
                  <h4 className="text-xs font-bold text-zinc-200">Esquema de Cores e Personalização</h4>
                  <span className="text-[8px] font-bold text-orange-400 bg-orange-500/10 border border-orange-500/20 px-2 py-0.5 rounded-full font-mono uppercase">
                    Personalizar
                  </span>
                </div>
                <p className="text-[10px] text-zinc-500 font-mono leading-normal">
                  Escolha a cor de destaque do aplicativo (Laranja, Azul, Verde, Rosa, Vermelho ou Personalizada).
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsColorSchemeModalOpen(true)}
                className="px-3.5 py-2 bg-orange-500 text-white font-mono font-bold text-[9px] rounded-xl tracking-wider uppercase hover:bg-orange-600 transition-all flex items-center gap-1.5 shadow-md shrink-0"
              >
                <Palette className="w-3.5 h-3.5" />
                Personalizar
              </button>
            </div>

            {/* Personalização da Tela de Carregamento & Splash (Sincronizada na Nuvem) */}
            <div className="p-5 bg-zinc-950 border border-zinc-900 rounded-2xl space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-zinc-900/80 pb-3">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-orange-400" />
                    <h4 className="text-xs font-bold text-zinc-100">Tela de Carregamento & Splash</h4>
                    <span className="text-[8px] font-bold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-full font-mono uppercase">
                      Nuvem Ativa
                    </span>
                  </div>
                  <p className="text-[10px] text-zinc-400 font-mono leading-relaxed max-w-xl">
                    Defina imagens personalizadas para o splash de carregamento do app (vertical para celular e horizontal para computador). A tela exibe apenas a sua imagem em tela cheia com a barra de sincronização na parte inferior.
                  </p>
                </div>
                {onPreviewLoadingScreen && (
                  <button
                    type="button"
                    onClick={() => {
                      addXp(10);
                      onPreviewLoadingScreen();
                    }}
                    className="self-start sm:self-auto px-3.5 py-2 bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-orange-400 font-mono font-bold text-[10px] rounded-xl tracking-wider uppercase transition-all flex items-center gap-1.5 shrink-0"
                  >
                    <Play className="w-3.5 h-3.5 fill-current" />
                    Testar Tela
                  </button>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* 1. Imagem Vertical (Mobile / 9:16) */}
                <div className="p-4 bg-zinc-900/40 border border-zinc-800/80 rounded-xl space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Smartphone className="w-4 h-4 text-orange-400" />
                      <span className="text-xs font-bold text-zinc-200">Formato Vertical (Mobile)</span>
                    </div>
                    <span className="text-[9px] font-mono text-zinc-500 uppercase tracking-wider">9:16 / Celular</span>
                  </div>

                  {/* Thumbnail Preview */}
                  <div className="relative aspect-[9/14] max-h-48 w-full bg-zinc-950 rounded-lg overflow-hidden border border-zinc-800 flex items-center justify-center group">
                    {loadingScreenVerticalImage ? (
                      <img 
                        src={loadingScreenVerticalImage} 
                        alt="Splash Vertical" 
                        className="w-full h-full object-cover"
                        referrerPolicy="no-referrer"
                      />
                    ) : (
                      <div className="flex flex-col items-center justify-center p-3 text-center text-zinc-600 gap-1.5">
                        <ImageIcon className="w-6 h-6 stroke-[1.5]" />
                        <span className="text-[10px] font-mono">Imagem Padrão do Sistema</span>
                      </div>
                    )}
                    <div className="absolute inset-x-0 bottom-0 p-2 bg-gradient-to-t from-black/80 to-transparent flex items-center justify-between text-[9px] font-mono text-zinc-300">
                      <span className="truncate">{loadingScreenVerticalImage ? 'Personalizada' : 'Padrão'}</span>
                      {loadingScreenVerticalImage && setLoadingScreenVerticalImage && (
                        <button
                          type="button"
                          onClick={() => {
                            setLoadingScreenVerticalImage('');
                            addXp(5);
                          }}
                          className="text-red-400 hover:text-red-300 font-bold flex items-center gap-1"
                          title="Restaurar padrão"
                        >
                          <Trash2 className="w-3 h-3" />
                          <span>Remover</span>
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Actions: Upload & Paste */}
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <label className="flex-1 cursor-pointer">
                        <input 
                          type="file" 
                          accept="image/*" 
                          className="hidden" 
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file && setLoadingScreenVerticalImage) {
                              const reader = new FileReader();
                              reader.onload = (ev) => {
                                const result = ev.target?.result as string;
                                if (result) {
                                  const img = new Image();
                                  img.onload = () => {
                                    const canvas = document.createElement('canvas');
                                    const maxDim = 1920;
                                    let w = img.width;
                                    let h = img.height;
                                    if (w > maxDim || h > maxDim) {
                                      if (w > h) {
                                        h = Math.round((h * maxDim) / w);
                                        w = maxDim;
                                      } else {
                                        w = Math.round((w * maxDim) / h);
                                        h = maxDim;
                                      }
                                    }
                                    canvas.width = w;
                                    canvas.height = h;
                                    const ctx = canvas.getContext('2d');
                                    if (ctx) {
                                      ctx.drawImage(img, 0, 0, w, h);
                                      const optimized = canvas.toDataURL('image/jpeg', 0.85);
                                      setLoadingScreenVerticalImage(optimized);
                                    } else {
                                      setLoadingScreenVerticalImage(result);
                                    }
                                    addXp(25);
                                    setSaveFeedback('Imagem vertical de carregamento atualizada e sincronizada!');
                                    setTimeout(() => setSaveFeedback(null), 3000);
                                  };
                                  img.src = result;
                                }
                              };
                              reader.readAsDataURL(file);
                            }
                          }}
                        />
                        <div className="w-full py-2 bg-orange-500/10 hover:bg-orange-500/20 border border-orange-500/30 text-orange-400 font-mono font-bold text-[10px] rounded-lg flex items-center justify-center gap-1.5 transition-all text-center">
                          <Upload className="w-3.5 h-3.5" />
                          <span>Fazer Upload</span>
                        </div>
                      </label>
                      <button
                        type="button"
                        onClick={async () => {
                          try {
                            if (navigator.clipboard && navigator.clipboard.read) {
                              const items = await navigator.clipboard.read();
                              for (const item of items) {
                                const imageType = item.types.find(t => t.startsWith('image/'));
                                if (imageType) {
                                  const blob = await item.getType(imageType);
                                  const reader = new FileReader();
                                  reader.onload = (ev) => {
                                    const res = ev.target?.result as string;
                                    if (res && setLoadingScreenVerticalImage) {
                                      setLoadingScreenVerticalImage(res);
                                      addXp(25);
                                      setSaveFeedback('Imagem vertical colada da área de transferência!');
                                      setTimeout(() => setSaveFeedback(null), 3000);
                                    }
                                  };
                                  reader.readAsDataURL(blob);
                                  return;
                                }
                              }
                            }
                            if (navigator.clipboard && navigator.clipboard.readText) {
                              const text = await navigator.clipboard.readText();
                              if (text && (text.startsWith('http') || text.startsWith('data:image/')) && setLoadingScreenVerticalImage) {
                                setLoadingScreenVerticalImage(text.trim());
                                addXp(25);
                                setSaveFeedback('Link de imagem vertical colado com sucesso!');
                                setTimeout(() => setSaveFeedback(null), 3000);
                              }
                            }
                          } catch (err) {
                            console.error('Clipboard error:', err);
                          }
                        }}
                        className="px-3 py-2 bg-zinc-800/80 hover:bg-zinc-700/80 border border-zinc-700/60 text-zinc-300 font-mono font-bold text-[10px] rounded-lg flex items-center gap-1 transition-all"
                        title="Colar da área de transferência"
                      >
                        <Clipboard className="w-3.5 h-3.5" />
                        <span>Colar</span>
                      </button>
                    </div>

                    {/* URL Input */}
                    <div className="relative">
                      <input 
                        type="text" 
                        value={loadingScreenVerticalImage} 
                        onChange={(e) => setLoadingScreenVerticalImage && setLoadingScreenVerticalImage(e.target.value)}
                        placeholder="Ou insira a URL da imagem (https://...)" 
                        className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-2.5 py-1.5 text-[10px] text-zinc-200 placeholder-zinc-600 focus:outline-none focus:border-orange-500/40 font-mono"
                      />
                    </div>
                  </div>
                </div>

                {/* 2. Imagem Horizontal (Desktop / 16:9) */}
                <div className="p-4 bg-zinc-900/40 border border-zinc-800/80 rounded-xl space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Monitor className="w-4 h-4 text-orange-400" />
                      <span className="text-xs font-bold text-zinc-200">Formato Horizontal (Desktop)</span>
                    </div>
                    <span className="text-[9px] font-mono text-zinc-500 uppercase tracking-wider">16:9 / Monitor</span>
                  </div>

                  {/* Thumbnail Preview */}
                  <div className="relative aspect-[16/10] max-h-48 w-full bg-zinc-950 rounded-lg overflow-hidden border border-zinc-800 flex items-center justify-center group">
                    {loadingScreenHorizontalImage ? (
                      <img 
                        src={loadingScreenHorizontalImage} 
                        alt="Splash Horizontal" 
                        className="w-full h-full object-cover"
                        referrerPolicy="no-referrer"
                      />
                    ) : (
                      <div className="flex flex-col items-center justify-center p-3 text-center text-zinc-600 gap-1.5">
                        <ImageIcon className="w-6 h-6 stroke-[1.5]" />
                        <span className="text-[10px] font-mono">Imagem Padrão do Sistema</span>
                      </div>
                    )}
                    <div className="absolute inset-x-0 bottom-0 p-2 bg-gradient-to-t from-black/80 to-transparent flex items-center justify-between text-[9px] font-mono text-zinc-300">
                      <span className="truncate">{loadingScreenHorizontalImage ? 'Personalizada' : 'Padrão'}</span>
                      {loadingScreenHorizontalImage && setLoadingScreenHorizontalImage && (
                        <button
                          type="button"
                          onClick={() => {
                            setLoadingScreenHorizontalImage('');
                            addXp(5);
                          }}
                          className="text-red-400 hover:text-red-300 font-bold flex items-center gap-1"
                          title="Restaurar padrão"
                        >
                          <Trash2 className="w-3 h-3" />
                          <span>Remover</span>
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Actions: Upload & Paste */}
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <label className="flex-1 cursor-pointer">
                        <input 
                          type="file" 
                          accept="image/*" 
                          className="hidden" 
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file && setLoadingScreenHorizontalImage) {
                              const reader = new FileReader();
                              reader.onload = (ev) => {
                                const result = ev.target?.result as string;
                                if (result) {
                                  const img = new Image();
                                  img.onload = () => {
                                    const canvas = document.createElement('canvas');
                                    const maxDim = 1920;
                                    let w = img.width;
                                    let h = img.height;
                                    if (w > maxDim || h > maxDim) {
                                      if (w > h) {
                                        h = Math.round((h * maxDim) / w);
                                        w = maxDim;
                                      } else {
                                        w = Math.round((w * maxDim) / h);
                                        h = maxDim;
                                      }
                                    }
                                    canvas.width = w;
                                    canvas.height = h;
                                    const ctx = canvas.getContext('2d');
                                    if (ctx) {
                                      ctx.drawImage(img, 0, 0, w, h);
                                      const optimized = canvas.toDataURL('image/jpeg', 0.85);
                                      setLoadingScreenHorizontalImage(optimized);
                                    } else {
                                      setLoadingScreenHorizontalImage(result);
                                    }
                                    addXp(25);
                                    setSaveFeedback('Imagem horizontal de carregamento atualizada e sincronizada!');
                                    setTimeout(() => setSaveFeedback(null), 3000);
                                  };
                                  img.src = result;
                                }
                              };
                              reader.readAsDataURL(file);
                            }
                          }}
                        />
                        <div className="w-full py-2 bg-orange-500/10 hover:bg-orange-500/20 border border-orange-500/30 text-orange-400 font-mono font-bold text-[10px] rounded-lg flex items-center justify-center gap-1.5 transition-all text-center">
                          <Upload className="w-3.5 h-3.5" />
                          <span>Fazer Upload</span>
                        </div>
                      </label>
                      <button
                        type="button"
                        onClick={async () => {
                          try {
                            if (navigator.clipboard && navigator.clipboard.read) {
                              const items = await navigator.clipboard.read();
                              for (const item of items) {
                                const imageType = item.types.find(t => t.startsWith('image/'));
                                if (imageType) {
                                  const blob = await item.getType(imageType);
                                  const reader = new FileReader();
                                  reader.onload = (ev) => {
                                    const res = ev.target?.result as string;
                                    if (res && setLoadingScreenHorizontalImage) {
                                      setLoadingScreenHorizontalImage(res);
                                      addXp(25);
                                      setSaveFeedback('Imagem horizontal colada da área de transferência!');
                                      setTimeout(() => setSaveFeedback(null), 3000);
                                    }
                                  };
                                  reader.readAsDataURL(blob);
                                  return;
                                }
                              }
                            }
                            if (navigator.clipboard && navigator.clipboard.readText) {
                              const text = await navigator.clipboard.readText();
                              if (text && (text.startsWith('http') || text.startsWith('data:image/')) && setLoadingScreenHorizontalImage) {
                                setLoadingScreenHorizontalImage(text.trim());
                                addXp(25);
                                setSaveFeedback('Link de imagem horizontal colado com sucesso!');
                                setTimeout(() => setSaveFeedback(null), 3000);
                              }
                            }
                          } catch (err) {
                            console.error('Clipboard error:', err);
                          }
                        }}
                        className="px-3 py-2 bg-zinc-800/80 hover:bg-zinc-700/80 border border-zinc-700/60 text-zinc-300 font-mono font-bold text-[10px] rounded-lg flex items-center gap-1 transition-all"
                        title="Colar da área de transferência"
                      >
                        <Clipboard className="w-3.5 h-3.5" />
                        <span>Colar</span>
                      </button>
                    </div>

                    {/* URL Input */}
                    <div className="relative">
                      <input 
                        type="text" 
                        value={loadingScreenHorizontalImage} 
                        onChange={(e) => setLoadingScreenHorizontalImage && setLoadingScreenHorizontalImage(e.target.value)}
                        placeholder="Ou insira a URL da imagem (https://...)" 
                        className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-2.5 py-1.5 text-[10px] text-zinc-200 placeholder-zinc-600 focus:outline-none focus:border-orange-500/40 font-mono"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Install native app */}
            <div className="p-4 bg-zinc-950 border border-zinc-900 rounded-2xl flex items-center justify-between gap-3">
              <div className="w-10 h-10 rounded-xl border border-orange-500/30 bg-black overflow-hidden flex-shrink-0 flex items-center justify-center p-0.5 shadow-[0_0_12px_rgba(249,115,22,0.2)]">
                <img src="/icon-192.png" alt="L Logo" className="w-full h-full object-contain rounded-lg" referrerPolicy="no-referrer" />
              </div>
              <div className="space-y-0.5 flex-1 pr-2">
                <h4 className="text-xs font-bold text-zinc-200">Instalar Aplicativo (PWA)</h4>
                <p className="text-[10px] text-zinc-500 font-mono leading-normal">Adicione à tela inicial com o ícone oficial estilizado.</p>
              </div>
              <button
                type="button"
                onClick={handleInstallApp}
                disabled={pwaInstalled}
                className="px-3.5 py-1.5 bg-orange-500 hover:bg-orange-600 text-white font-bold text-[9px] rounded-lg tracking-wider disabled:opacity-40 uppercase transition-all"
              >
                {pwaInstalled ? 'Instalado ✓' : 'Instalar'}
              </button>
            </div>

            {/* Language Selector */}
            <div className="p-4 bg-zinc-950 border border-zinc-900 rounded-2xl flex items-center justify-between">
              <div className="space-y-0.5 flex-1 pr-4">
                <h4 className="text-xs font-bold text-zinc-200">Idioma do Sistema / Language</h4>
                <p className="text-[10px] text-zinc-500 font-mono leading-normal">Selecione o idioma de preferência para a interface.</p>
              </div>
              <select
                value={selectedLanguage}
                onChange={(e) => {
                  const lang = e.target.value;
                  setSelectedLanguage(lang);
                  localStorage.setItem('mbc_language', lang);
                  addXp(15);
                }}
                className="bg-zinc-900 border border-zinc-800 text-zinc-300 rounded-lg px-3 py-1.5 text-xs font-bold focus:outline-none cursor-pointer transition-all"
              >
                <option value="pt">Português (BR)</option>
                <option value="en">English (US)</option>
              </select>
            </div>
          </motion.div>
        )}

        {/* VIEW: DISPOSITIVOS CONECTADOS (Imagens fixadas) */}
        {currentScreen === 'dispositivos_conectados' && (
          <motion.div
            key="dispositivos-conectados-screen"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.25 }}
            className="p-4 space-y-5"
          >
            {/* Header */}
            <div className="flex items-center gap-3 border-b border-zinc-900 pb-4">
              <button onClick={navigateBack} className="p-1.5 hover:bg-zinc-900 rounded-xl text-zinc-400 hover:text-white transition-colors">
                <ArrowLeft className="h-4.5 w-4.5" />
              </button>
              <div>
                <h3 className="text-xs font-black tracking-wider uppercase font-mono text-zinc-200">Dispositivos conectados</h3>
                <p className="text-[9px] text-zinc-500 font-mono">Gerenciamento de aparelhos da conta</p>
              </div>
            </div>

            {/* Top Emerald Graphic Banner matching Image 1 */}
            <div className="p-5 bg-gradient-to-br from-emerald-950/40 via-zinc-950 to-emerald-950/20 border border-emerald-500/20 rounded-2xl relative overflow-hidden space-y-4">
              <div className="absolute right-3 top-3 opacity-15 text-emerald-400 pointer-events-none">
                <Laptop className="w-24 h-24" />
              </div>

              <div className="flex items-center gap-3">
                <div className="p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-2xl text-emerald-400 shadow-[0_0_12px_rgba(16,185,129,0.2)]">
                  <Smartphone className="h-6 w-6" />
                </div>
                <div>
                  <h4 className="text-xs font-black text-white uppercase tracking-wider">Conectar Novos Aparelhos</h4>
                  <p className="text-[10px] text-zinc-400 font-sans leading-relaxed mt-0.5">
                    Você pode conectar mais celulares ou computadores a essa conta para sincronizar todos os seus dados em tempo real.
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setShowConnectDeviceModal(true)}
                className="w-full py-2.5 bg-emerald-500 hover:bg-emerald-400 text-zinc-950 font-black text-xs uppercase tracking-wider rounded-xl transition-all shadow-lg shadow-emerald-500/20 flex items-center justify-center gap-2"
              >
                <QrCode className="h-4 w-4" />
                Conectar dispositivo
              </button>
            </div>

            {/* STATUS DO DISPOSITIVO section */}
            <div className="space-y-3 pt-2">
              <div>
                <span className="text-[10px] text-zinc-500 font-mono font-bold uppercase tracking-widest block">
                  STATUS DO DISPOSITIVO
                </span>
                <p className="text-[10px] text-zinc-400 font-sans mt-0.5">
                  Toque em um dispositivo para definir um novo nome ou desconectá-lo.
                </p>
              </div>

              <div className="space-y-2">
                {connectedDevices.map((dev) => {
                  const isCurrent = dev.isCurrent;
                  return (
                    <div
                      key={dev.id}
                      onClick={() => {
                        setEditingDevice(dev);
                        setEditDeviceCustomName(dev.customName || dev.name);
                      }}
                      className={`p-4 bg-[#111115] hover:bg-zinc-900/80 border rounded-2xl cursor-pointer transition-all flex items-center justify-between group ${
                        isCurrent ? 'border-emerald-500/40 shadow-[0_0_12px_rgba(16,185,129,0.08)]' : 'border-zinc-900 hover:border-zinc-800'
                      }`}
                    >
                      <div className="flex items-center gap-3.5">
                        <div className={`p-2.5 rounded-xl border ${
                          isCurrent ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400' : 'bg-zinc-900 border-zinc-800 text-zinc-400'
                        }`}>
                          {dev.deviceType === 'mobile' ? <Smartphone className="h-5 w-5" /> : <Laptop className="h-5 w-5" />}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <h5 className="text-xs font-bold text-zinc-200 group-hover:text-white transition-colors">
                              {dev.customName || dev.name}
                            </h5>
                            {isCurrent && (
                              <span className="text-[8px] font-mono font-bold uppercase bg-emerald-500/20 text-emerald-400 px-2 py-0.5 rounded-md border border-emerald-500/30">
                                SESSÃO ATUAL
                              </span>
                            )}
                          </div>
                          <p className="text-[10px] text-zinc-500 font-mono mt-0.5">
                            {isCurrent ? 'Ativo agora nesta janela' : `Última sessão ativa ${dev.lastActive}`}
                          </p>
                        </div>
                      </div>
                      <ChevronRight className="h-4 w-4 text-zinc-600 group-hover:text-zinc-300 transition-colors" />
                    </div>
                  );
                })}
              </div>
            </div>

            {/* End to End Encryption footer note */}
            <div className="p-4 bg-zinc-950/80 border border-zinc-900 rounded-2xl flex items-start gap-3">
              <ShieldCheck className="h-4 w-4 text-emerald-400 shrink-0 mt-0.5" />
              <p className="text-[10px] text-zinc-400 font-sans leading-relaxed">
                🔒 Suas informações pessoais e dados do planner são protegidos com criptografia de ponta a ponta em todos os seus dispositivos.
              </p>
            </div>
          </motion.div>
        )}

      </AnimatePresence>

      {/* Modal: Editar Dispositivo (Image 2) */}
      <AnimatePresence>
        {editingDevice && (
          <div 
            onClick={() => setEditingDevice(null)}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm cursor-pointer"
          >
            <motion.div
              onClick={(e) => e.stopPropagation()}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="cursor-default bg-zinc-950 border border-zinc-800 rounded-2xl p-6 max-w-md w-full space-y-5 text-left shadow-2xl relative"
            >
              {/* Header */}
              <div className="flex items-center justify-between border-b border-zinc-900 pb-3">
                <button
                  type="button"
                  onClick={() => setEditingDevice(null)}
                  className="p-1 text-zinc-400 hover:text-white rounded-lg hover:bg-zinc-900 transition-colors"
                >
                  <ArrowLeft className="h-4.5 w-4.5" />
                </button>
                <h3 className="text-xs font-black uppercase tracking-wider text-zinc-200">Editar dispositivo</h3>
                <button
                  type="button"
                  onClick={() => setEditingDevice(null)}
                  className="text-zinc-500 hover:text-white p-1"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              {/* Central Large Icon */}
              <div className="flex flex-col items-center justify-center py-3">
                <div className="w-16 h-16 rounded-3xl bg-zinc-900 border border-zinc-800 flex items-center justify-center text-emerald-400 shadow-xl mb-3">
                  {editingDevice.deviceType === 'mobile' ? <Smartphone className="h-8 w-8" /> : <Laptop className="h-8 w-8" />}
                </div>
                <h4 className="text-sm font-bold text-white text-center">
                  {editingDevice.customName || editingDevice.name}
                </h4>
                <p className="text-[10px] text-zinc-500 font-mono mt-0.5">Nome do dispositivo</p>
              </div>

              {/* Edit Device Name Input */}
              <div className="space-y-1">
                <label className="text-[9px] text-zinc-500 font-mono font-bold uppercase block">Renomear Dispositivo</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={editDeviceCustomName}
                    onChange={(e) => setEditDeviceCustomName(e.target.value)}
                    placeholder="Nome personalizado do aparelho"
                    className="flex-1 bg-zinc-900 border border-zinc-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500/50 font-sans"
                  />
                  <button
                    type="button"
                    onClick={async () => {
                      if (!editingDevice) return;
                      const updated = await updateConnectedDevice(editingDevice.id, { customName: editDeviceCustomName });
                      setConnectedDevices(updated);
                      setEditingDevice(prev => prev ? { ...prev, customName: editDeviceCustomName } : null);
                    }}
                    className="px-3 py-2 bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-400 font-bold text-xs rounded-xl border border-emerald-500/30 transition-all"
                  >
                    Salvar
                  </button>
                </div>
              </div>

              {/* Detail Info Rows */}
              <div className="space-y-2.5 pt-1">
                <div className="flex items-center gap-3 p-3 bg-zinc-900/60 border border-zinc-900 rounded-xl">
                  <Clock className="h-4 w-4 text-zinc-500 shrink-0" />
                  <span className="text-xs text-zinc-300 font-mono">
                    Última sessão ativa {formatLastActiveTime(editingDevice.lastActiveTimestamp || editingDevice.lastActive, editingDevice.isCurrent)}
                  </span>
                </div>

                <div className="flex items-center gap-3 p-3 bg-zinc-900/60 border border-zinc-900 rounded-xl">
                  <Globe className="h-4 w-4 text-zinc-500 shrink-0" />
                  <span className="text-xs text-zinc-300 font-mono">
                    {editingDevice.browser} ({editingDevice.os})
                  </span>
                </div>

                <div className="flex items-center gap-3 p-3 bg-zinc-900/60 border border-zinc-900 rounded-xl">
                  <ShieldCheck className="h-4 w-4 text-emerald-400 shrink-0" />
                  <span className="text-xs text-emerald-400 font-mono">
                    Criptografia de ponta a ponta ativa
                  </span>
                </div>
              </div>

              {/* Disconnect Red Button */}
              <button
                type="button"
                onClick={async () => {
                  if (!editingDevice) return;
                  const updated = await removeConnectedDevice(editingDevice.id);
                  setConnectedDevices(updated);
                  setEditingDevice(null);
                }}
                className="w-full py-2.5 bg-red-950/20 hover:bg-red-950/40 border border-red-900/40 text-red-400 font-bold text-xs uppercase tracking-wider rounded-xl transition-all"
              >
                Desconectar dispositivo
              </button>

              <p className="text-[10px] text-zinc-500 font-sans text-center leading-relaxed">
                Se você não reconhece esse dispositivo ou não tem mais acesso a ele, desconecte o dispositivo da sua conta.
              </p>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Modal: Conectar Dispositivo (QR Code com duração de 5 minutos & Código do Aparelho) */}
      <AnimatePresence>
        {showConnectDeviceModal && (
          <div 
            onClick={() => setShowConnectDeviceModal(false)}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md cursor-pointer"
          >
            <motion.div
              onClick={(e) => e.stopPropagation()}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="cursor-default bg-zinc-950 border border-emerald-500/30 rounded-3xl p-5 sm:p-6 max-w-md w-full space-y-4 text-center shadow-2xl relative"
            >
              {/* Header */}
              <div className="flex items-center justify-between border-b border-zinc-900 pb-3">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                    <QrCode className="h-4 w-4" />
                  </div>
                  <div className="text-left">
                    <h3 className="text-xs font-black uppercase tracking-wider text-white">Conectar Novo Aparelho</h3>
                    <p className="text-[10px] text-zinc-500 font-mono">Sincronização em tempo real</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setShowConnectDeviceModal(false)}
                  className="text-zinc-500 hover:text-white p-1.5 rounded-lg hover:bg-zinc-900 transition-colors cursor-pointer"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              {/* Tabs Switcher: Escanear QR Code vs Digitar Código */}
              <div className="grid grid-cols-2 gap-1 p-1 bg-zinc-900/80 rounded-xl border border-zinc-800/80">
                <button
                  type="button"
                  onClick={() => setConnectDeviceTab('qrcode')}
                  className={`py-1.5 px-3 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
                    connectDeviceTab === 'qrcode'
                      ? 'bg-emerald-500 text-zinc-950 shadow-md font-black'
                      : 'text-zinc-400 hover:text-white'
                  }`}
                >
                  <QrCode className="h-3.5 w-3.5" />
                  QR Code
                </button>
                <button
                  type="button"
                  onClick={() => setConnectDeviceTab('codigo')}
                  className={`py-1.5 px-3 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
                    connectDeviceTab === 'codigo'
                      ? 'bg-emerald-500 text-zinc-950 shadow-md font-black'
                      : 'text-zinc-400 hover:text-white'
                  }`}
                >
                  <Smartphone className="h-3.5 w-3.5" />
                  Código Numérico
                </button>
              </div>

              {/* Feedback messages */}
              {manualCodeFeedback && (
                <div className={`p-3 rounded-xl text-xs font-medium flex items-center gap-2 text-left ${
                  manualCodeFeedback.type === 'success'
                    ? 'bg-emerald-500/10 border border-emerald-500/30 text-emerald-300'
                    : 'bg-red-500/10 border border-red-500/30 text-red-300'
                }`}>
                  {manualCodeFeedback.type === 'success' ? (
                    <CheckCircle className="h-4 w-4 shrink-0 text-emerald-400" />
                  ) : (
                    <AlertTriangle className="h-4 w-4 shrink-0 text-red-400" />
                  )}
                  <span>{manualCodeFeedback.message}</span>
                </div>
              )}

              {/* TAB 1: QR CODE COM DURAÇÃO DE 5 MINUTOS */}
              {connectDeviceTab === 'qrcode' && (
                <div className="space-y-3.5 pt-1">
                  <div className="relative mx-auto w-[220px] h-[220px] bg-white rounded-2xl p-3 shadow-2xl flex items-center justify-center overflow-hidden border-2 border-emerald-500/40">
                    {connectQrLoading ? (
                      <div className="flex flex-col items-center justify-center gap-2 text-zinc-700">
                        <RefreshCw className="h-8 w-8 animate-spin text-emerald-600" />
                        <span className="text-[11px] font-mono font-bold text-zinc-600">Gerando QR Code...</span>
                      </div>
                    ) : connectQrDataUrl && connectQrCountdown > 0 ? (
                      <div className="relative group">
                        <img 
                          src={connectQrDataUrl} 
                          alt="QR Code de Conexão de Novo Aparelho" 
                          className="w-full h-full object-contain"
                        />
                        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                          <div className="w-9 h-9 bg-zinc-950 border border-emerald-400/40 rounded-xl flex items-center justify-center shadow-lg">
                            <Smartphone className="w-5 h-5 text-emerald-400" />
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="flex flex-col items-center justify-center p-3 text-center space-y-2">
                        <AlertTriangle className="h-8 w-8 text-amber-500" />
                        <p className="text-[11px] font-bold text-zinc-800">QR Code expirado</p>
                        <p className="text-[9px] text-zinc-500">A duração de 5 minutos encerrou.</p>
                        <button
                          type="button"
                          onClick={generateNewDeviceQr}
                          className="px-3 py-1.5 bg-emerald-500 text-zinc-950 font-bold text-xs rounded-xl shadow cursor-pointer hover:bg-emerald-400"
                        >
                          Gerar Novo Código
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Informações da Sessão e Código PIN */}
                  {connectQrSession && (
                    <div className="space-y-1.5 bg-zinc-900/60 p-3 rounded-2xl border border-zinc-800/80">
                      <div className="flex items-center justify-between text-[10px] font-mono text-zinc-400">
                        <span className="font-bold uppercase">Código de Conexão:</span>
                        <div className="flex items-center gap-1.5 font-black text-xs text-emerald-400">
                          <Clock className="h-3.5 w-3.5 text-emerald-400" />
                          <span>
                            {Math.floor(connectQrCountdown / 60)}:{(connectQrCountdown % 60).toString().padStart(2, '0')} min
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center justify-center gap-3 pt-1">
                        <span className="text-2xl font-black font-mono tracking-widest text-emerald-400 bg-zinc-950 px-4 py-1.5 rounded-xl border border-emerald-500/30 shadow-inner">
                          {connectQrSession.pinCode ? `${connectQrSession.pinCode.slice(0, 3)} - ${connectQrSession.pinCode.slice(3)}` : '------'}
                        </span>
                        <button
                          type="button"
                          title="Gerar outro QR Code"
                          onClick={generateNewDeviceQr}
                          disabled={connectQrLoading}
                          className="p-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded-xl transition-all"
                        >
                          <RefreshCw className={`h-4 w-4 ${connectQrLoading ? 'animate-spin' : ''}`} />
                        </button>
                      </div>
                    </div>
                  )}

                  <p className="text-[11px] text-zinc-400 leading-relaxed font-sans">
                    Aponte a câmera do seu outro aparelho para escanear o QR Code ou acesse este site no novo dispositivo e digite o código acima.
                  </p>
                </div>
              )}

              {/* TAB 2: DIGITAR CÓDIGO DO OUTRO APARELHO */}
              {connectDeviceTab === 'codigo' && (
                <div className="space-y-4 pt-1">
                  <div className="space-y-3 bg-zinc-900/60 p-4 rounded-2xl border border-zinc-800 text-left">
                    <label className="block text-xs font-bold text-zinc-200">
                      Código do Outro Aparelho (6 dígitos ou PLN-...):
                    </label>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={manualCodeInput}
                        onChange={(e) => setManualCodeInput(e.target.value)}
                        placeholder="Ex: 482 910"
                        maxLength={12}
                        className="flex-1 bg-zinc-950 border border-zinc-800 focus:border-emerald-500 rounded-xl px-3 py-2 text-sm text-white placeholder-zinc-600 focus:outline-none font-mono tracking-wider uppercase text-center"
                      />
                      <button
                        type="button"
                        disabled={manualCodeAuthorizing || !manualCodeInput.trim()}
                        onClick={async () => {
                          const pinVal = manualCodeInput.trim();
                          if (!pinVal) return;
                          setManualCodeAuthorizing(true);
                          setManualCodeFeedback(null);
                          try {
                            const authRes = await authorizeQrLoginSession(pinVal, {
                              email: userEmail || 'usuario@lifeorganizer.app',
                              username: userHandle.replace(/^@/, '') || 'usuario',
                              name: userName || 'Usuário',
                              syncKey: syncKey || 'MBC-LOCAL',
                              provider: 'email'
                            });

                            if (authRes.ok) {
                              const nowTs = Date.now();
                              const newDev: ConnectedDevice = {
                                id: `dev-qr-${nowTs}`,
                                name: 'Novo Aparelho Autorizado',
                                browser: 'Web / Mobile',
                                os: 'Dispositivo Conectado',
                                isCurrent: false,
                                lastActiveTimestamp: nowTs,
                                lastActive: formatLastActiveTime(nowTs, false),
                                ip: '189.28.102.89',
                                deviceType: 'mobile'
                              };
                              const accKey = getAccountKey();
                              const currentDevs = await fetchAccountDevices();
                              const newList = [newDev, ...currentDevs.filter(d => d.id !== newDev.id)];
                              await saveAccountDevices(accKey, newList);
                              setConnectedDevices(newList);
                              setManualCodeFeedback({ type: 'success', message: 'Aparelho autorizado e conectado com sucesso!' });
                              setManualCodeInput('');
                              setTimeout(() => {
                                setShowConnectDeviceModal(false);
                              }, 2000);
                            } else {
                              setManualCodeFeedback({ type: 'error', message: authRes.message });
                            }
                          } catch (err: any) {
                            setManualCodeFeedback({ type: 'error', message: err?.message || 'Erro ao conectar aparelho.' });
                          } finally {
                            setManualCodeAuthorizing(false);
                          }
                        }}
                        className="py-2 px-4 bg-emerald-500 hover:bg-emerald-400 disabled:opacity-50 text-zinc-950 text-xs font-black uppercase tracking-wider rounded-xl transition-all shadow-md shrink-0 flex items-center gap-1.5"
                      >
                        {manualCodeAuthorizing ? <RefreshCw className="h-3.5 w-3.5 animate-spin" /> : <CheckCircle className="h-3.5 w-3.5" />}
                        Autorizar
                      </button>
                    </div>
                    <p className="text-[10px] text-zinc-400 leading-relaxed">
                      Se você abriu a tela de login QR Code em outro celular ou navegador, digite os 6 dígitos exibidos lá para vinculá-lo instantaneamente a esta conta.
                    </p>
                  </div>

                  <div className="p-3 bg-zinc-900/40 rounded-xl border border-zinc-800/80 text-left flex items-start gap-2.5">
                    <ShieldCheck className="h-4 w-4 text-emerald-400 shrink-0 mt-0.5" />
                    <p className="text-[10px] text-zinc-400 leading-relaxed">
                      Ambos os dispositivos compartilham a mesma chave de criptografia de ponta a ponta e sincronizam alterações sem fio.
                    </p>
                  </div>
                </div>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Color Scheme Modal */}
      <ColorSchemeModal
        isOpen={isColorSchemeModalOpen}
        onClose={() => setIsColorSchemeModalOpen(false)}
        activePresetId={activeThemePreset}
        customHex={customThemeHex}
        onSelectPreset={(presetId, hex) => {
          if (setActiveThemePreset) setActiveThemePreset(presetId);
          localStorage.setItem('mbc_theme_preset', presetId);
          if (hex && setCustomThemeHex) {
            setCustomThemeHex(hex);
            localStorage.setItem('mbc_custom_theme_hex', hex);
          }
          addXp(15);
        }}
      />

      {/* Review Reminder Modal */}
      <ReviewReminderModal
        isOpen={isReviewReminderModalOpen}
        onClose={() => setIsReviewReminderModalOpen(false)}
        initialTab={reminderModalTab}
      />

    </div>
  );
}
