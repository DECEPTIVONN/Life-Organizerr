import React, { useState, useEffect } from 'react';
import { requestNotificationPermission, sendSystemNotification } from '../lib/notificationHelper';
import { 
  User, 
  Lock, 
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
  Fingerprint
} from 'lucide-react';
import { isPlatformAuthenticatorAvailable, verifyBiometric } from '../utils/biometricAuth';
import ColorSchemeModal from './ColorSchemeModal';
import { THEME_PRESETS, applyThemeColor } from '../utils/themeColors';
import { motion, AnimatePresence } from 'motion/react';
import { setSupabaseConfig, testSupabaseConnection } from '../lib/supabase';
import { authorizeQrLoginSession } from '../lib/auth';
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

  // Theme Color Customization
  activeThemePreset?: string;
  setActiveThemePreset?: (preset: string) => void;
  customThemeHex?: string;
  setCustomThemeHex?: (hex: string) => void;
  
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
  setCustomThemeHex
}: SettingsViewProps) {
  
  // Theme Color Scheme Modal State
  const [isColorSchemeModalOpen, setIsColorSchemeModalOpen] = useState(false);

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

  // Supabase states
  const [supabaseUrl, setSupabaseUrl] = useState(() => localStorage.getItem('mbc_supabase_url') || '');
  const [supabaseAnonKey, setSupabaseAnonKey] = useState(() => localStorage.getItem('mbc_supabase_anon_key') || '');
  const [supabaseFeedback, setSupabaseFeedback] = useState<string | null>(null);
  const [showSupabaseModal, setShowSupabaseModal] = useState(false);

  // Notification toggles
  const [notifDaily, setNotifDaily] = useState(true);
  const [notifFinances, setNotifFinances] = useState(false);
  const [notifRoutine, setNotifRoutine] = useState(true);
  const [notifBackground, setNotifBackground] = useState(() => {
    return localStorage.getItem('mbc_background_notifications_enabled') !== 'false';
  });
  const [dailyWorkspaceNotifEnabled, setDailyWorkspaceNotifEnabled] = useState(() => {
    return localStorage.getItem('mbc_daily_workspace_notif_enabled') !== 'false';
  });
  const [dailyWorkspaceReminderTime, setDailyWorkspaceReminderTime] = useState(() => {
    return localStorage.getItem('mbc_daily_workspace_reminder_time') || '21:00';
  });

  // Install trigger (PWA)
  const [pwaPrompt, setPwaPrompt] = useState<any>(null);
  const [pwaInstalled, setPwaInstalled] = useState(false);

  // Language state
  const [selectedLanguage, setSelectedLanguage] = useState(() => {
    return localStorage.getItem('mbc_language') || 'pt';
  });

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
      desc: 'Gerencie o comportamento de tela cheia automática, instalação nativa PWA e exibição geral do Planner.',
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

        {/* VIEW 6: SEGURANÇA E ACESSO À CONTA (Firebase Sync) */}
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
                        : 'Ative para desbloquear o Planner usando a digital do seu dispositivo.'}
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
              {/* System & Background PWA Notifications Master Card */}
              <div className="p-4 bg-orange-950/20 border border-orange-500/30 rounded-2xl space-y-3">
                <div className="flex items-start justify-between">
                  <div>
                    <h4 className="text-xs font-bold text-orange-400 flex items-center gap-1.5">
                      <Bell className="h-4 w-4 text-orange-400 animate-pulse" />
                      Notificações do Sistema & Segundo Plano (PWA)
                    </h4>
                    <p className="text-[10px] text-zinc-400 mt-1 leading-relaxed">
                      Permite que os alarmes, timers e lembretes do TRONUS apareçam diretamente na central do sistema operacional (Windows, Android, iOS, macOS), mesmo com a aba ou o navegador fechados.
                    </p>
                  </div>
                </div>

                <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-orange-500/20">
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={async () => {
                        const granted = await requestNotificationPermission();
                        if (granted) {
                          sendSystemNotification('Notificações Ativas!', {
                            body: 'O TRONUS enviará seus alertas e alarmes em segundo plano.',
                            tag: 'tronus-perm-test'
                          });
                        } else {
                          alert('Permissão de notificação negada ou bloqueada no navegador. Habilite nas configurações do seu navegador ou sistema operacional.');
                        }
                      }}
                      className="px-3.5 py-1.5 bg-orange-500 hover:bg-orange-600 text-black text-xs font-bold rounded-xl transition-all shadow-md flex items-center gap-1.5 cursor-pointer"
                    >
                      <CheckCircle className="h-3.5 w-3.5" />
                      Ativar Notificações
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        sendSystemNotification('⏰ Teste de Alarme TRONUS', {
                          body: 'Notificação do sistema funcionando em segundo plano!',
                          tag: 'test-alarm-pwa'
                        });
                      }}
                      className="px-3.5 py-1.5 bg-zinc-900 hover:bg-zinc-800 text-zinc-300 border border-zinc-700 text-xs font-semibold rounded-xl transition-all cursor-pointer"
                    >
                      ⚡ Testar Disparo
                    </button>
                  </div>

                  {/* Toggle para disparo em segundo plano */}
                  <div className="flex items-center gap-3">
                    <span className="text-[10px] font-mono font-bold text-orange-300 uppercase">
                      Alertas em Segundo Plano ({notifBackground ? 'Ativado' : 'Desativado'})
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        const next = !notifBackground;
                        setNotifBackground(next);
                        localStorage.setItem('mbc_background_notifications_enabled', String(next));
                        window.dispatchEvent(new Event('storage'));
                      }}
                      className={`w-9 h-5 rounded-full p-0.5 transition-all cursor-pointer ${notifBackground ? 'bg-orange-500' : 'bg-zinc-800'}`}
                    >
                      <div className={`w-4 h-4 rounded-full bg-white transition-all ${notifBackground ? 'translate-x-4' : 'translate-x-0 bg-zinc-500'}`} />
                    </button>
                  </div>
                </div>
              </div>

              {/* Espaço Diário & Fé Reminder */}
              <div className="p-4 bg-zinc-950 border border-zinc-900 rounded-2xl space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="text-xs font-bold text-zinc-200 flex items-center gap-2">
                      <Bell className="h-3.5 w-3.5 text-orange-500" />
                      Lembrete de Espaço Diário & Fé
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

            {/* Install native app */}
            <div className="p-4 bg-zinc-950 border border-zinc-900 rounded-2xl flex items-center justify-between">
              <div className="space-y-0.5 flex-1 pr-4">
                <h4 className="text-xs font-bold text-zinc-200">Instalar Aplicativo (PWA)</h4>
                <p className="text-[10px] text-zinc-500 font-mono leading-normal">Adicione este Planner como aplicativo autônomo e offline.</p>
              </div>
              <button
                type="button"
                onClick={handleInstallApp}
                disabled={pwaInstalled}
                className="px-3.5 py-1.5 bg-orange-500 text-white font-bold text-[9px] rounded-lg tracking-wider disabled:opacity-40 uppercase"
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

      {/* Modal: Conectar Dispositivo (QR Code / Pareamento Real) */}
      <AnimatePresence>
        {showConnectDeviceModal && (
          <div 
            onClick={() => setShowConnectDeviceModal(false)}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm cursor-pointer"
          >
            <motion.div
              onClick={(e) => e.stopPropagation()}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="cursor-default bg-zinc-950 border border-emerald-500/30 rounded-2xl p-5 max-w-sm w-full space-y-4 text-center shadow-2xl relative"
            >
              <div className="flex items-center justify-between border-b border-zinc-900 pb-3">
                <div className="flex items-center gap-2">
                  <QrCode className="h-4.5 w-4.5 text-emerald-400" />
                  <h3 className="text-xs font-black uppercase tracking-wider text-white">Conectar Novo Dispositivo</h3>
                </div>
                <button
                  type="button"
                  onClick={() => setShowConnectDeviceModal(false)}
                  className="text-zinc-500 hover:text-white p-1 transition-colors"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              {/* Authorize Pin Form */}
              <div className="space-y-3 bg-zinc-900/60 p-3.5 rounded-2xl border border-zinc-800 text-left">
                <label className="block text-[11px] font-bold text-zinc-200">
                  Digitar Código do Outro Aparelho (6 dígitos ou PLN-...):
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="Ex: 482910"
                    id="qrPinInput"
                    className="flex-1 bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-emerald-500 font-mono tracking-wider uppercase"
                  />
                  <button
                    type="button"
                    onClick={async () => {
                      const inputEl = document.getElementById('qrPinInput') as HTMLInputElement;
                      const pinVal = inputEl?.value.trim();
                      if (!pinVal) return;

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
                          name: 'Novo Aparelho Conectado',
                          browser: 'Web Browser',
                          os: 'Mobile/PC',
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
                        alert('✅ Sessão de login e aparelho autorizados com sucesso!');
                        setShowConnectDeviceModal(false);
                      } else {
                        alert(`⚠️ ${authRes.message}`);
                      }
                    }}
                    className="py-2 px-3 bg-emerald-500 hover:bg-emerald-400 text-zinc-950 text-xs font-bold rounded-xl transition-all shadow-md shrink-0"
                  >
                    Autorizar
                  </button>
                </div>
                <p className="text-[10px] text-zinc-400 leading-relaxed">
                  Digite o código de 6 dígitos mostrado na tela de login QR Code do outro celular ou computador para autorizá-lo imediatamente.
                </p>
              </div>

              <div className="relative my-2">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-zinc-800" />
                </div>
                <div className="relative flex justify-center text-[9px] uppercase font-bold tracking-wider">
                  <span className="px-2 bg-zinc-950 text-zinc-500">ou simular aparelho de teste</span>
                </div>
              </div>

              {/* Action to test adding a connected device */}
              <button
                type="button"
                onClick={async () => {
                  const nowTs = Date.now();
                  const newDev: ConnectedDevice = {
                    id: `dev-test-${nowTs}`,
                    name: 'Safari (iPhone 15 Pro)',
                    browser: 'Apple Safari',
                    os: 'iOS 17.5',
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
                  setShowConnectDeviceModal(false);
                }}
                className="w-full py-2 bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-zinc-300 font-bold text-xs rounded-xl transition-all"
              >
                Simular Novo Aparelho
              </button>
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

    </div>
  );
}
