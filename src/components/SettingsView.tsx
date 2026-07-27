import React, { useState, useEffect } from 'react';
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
  CheckCircle2
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { setSupabaseConfig, testSupabaseConnection } from '../lib/supabase';
import { saveGoogleOAuthTokens, clearGoogleOAuthSession, refreshGoogleAccessToken } from '../utils/googleToken';

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
  
  // Fullscreen
  autoFullscreen: boolean;
  setAutoFullscreen: (auto: boolean) => void;
  
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

export interface ConnectedDevice {
  id: string;
  name: string;
  customName?: string;
  browser: string;
  os: string;
  isCurrent: boolean;
  lastActive: string;
  ip?: string;
  deviceType: 'desktop' | 'mobile' | 'tablet';
}

const detectDeviceDetails = () => {
  if (typeof navigator === 'undefined') {
    return { browser: 'Microsoft Edge', os: 'Windows', fullName: 'Microsoft Edge (Windows)' };
  }
  const ua = navigator.userAgent;
  let browser = 'Microsoft Edge';
  let os = 'Windows';

  if (ua.includes('Edg/')) browser = 'Microsoft Edge';
  else if (ua.includes('Chrome/')) browser = 'Google Chrome';
  else if (ua.includes('Safari/') && !ua.includes('Chrome')) browser = 'Apple Safari';
  else if (ua.includes('Firefox/')) browser = 'Mozilla Firefox';
  else if (ua.includes('OPR/') || ua.includes('Opera/')) browser = 'Opera';

  if (ua.includes('Windows')) os = 'Windows';
  else if (ua.includes('Mac OS')) os = 'macOS';
  else if (ua.includes('Android')) os = 'Android';
  else if (ua.includes('iPhone') || ua.includes('iPad')) os = 'iOS';
  else if (ua.includes('Linux')) os = 'Linux';

  return { browser, os, fullName: `${browser} (${os})` };
};

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
  autoFullscreen,
  setAutoFullscreen,
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
  setIsAppLocked
}: SettingsViewProps) {
  
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

    const { browser, os, fullName } = detectDeviceDetails();
    const now = new Date();
    const pad = (n: number) => String(n).padStart(2, '0');
    const timeStr = `${pad(now.getHours())}:${pad(now.getMinutes())}`;

    return [
      {
        id: 'dev-curr-session',
        name: fullName,
        browser,
        os,
        isCurrent: true,
        lastActive: `hoje às ${timeStr}`,
        ip: '189.28.102.44',
        deviceType: os === 'Android' || os === 'iOS' ? 'mobile' : 'desktop'
      }
    ];
  });

  const [editingDevice, setEditingDevice] = useState<ConnectedDevice | null>(null);
  const [showConnectDeviceModal, setShowConnectDeviceModal] = useState(false);
  const [editDeviceCustomName, setEditDeviceCustomName] = useState('');

  useEffect(() => {
    localStorage.setItem('mbc_connected_devices', JSON.stringify(connectedDevices));
  }, [connectedDevices]);
  const [googleToken, setGoogleToken] = useState<string | null>(() => {
    return localStorage.getItem('google_calendar_token');
  });

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
  };

  useEffect(() => {
    const handleOAuthMessageInSettings = (event: MessageEvent) => {
      const origin = event.origin;
      if (!origin.endsWith('.run.app') && !origin.includes('localhost')) {
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
      const data: Record<string, string | null> = {};
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key) {
          data[key] = localStorage.getItem(key);
        }
      }
      
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `planner_backup_${new Date().toISOString().slice(0,10)}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      
      addXp(15);
      alert('Arquivo de backup baixado com sucesso! Contém todas as suas metas, hábitos, finanças, rotinas e anotações.');
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
          throw new Error('Arquivo inválido');
        }

        let keysRestored = 0;
        Object.entries(parsed).forEach(([key, val]) => {
          if (typeof val === 'string') {
            localStorage.setItem(key, val);
            keysRestored++;
          } else if (val !== null) {
            localStorage.setItem(key, JSON.stringify(val));
            keysRestored++;
          }
        });

        localStorage.setItem('mbc_last_local_write', new Date().toISOString());
        addXp(30);
        alert(`Backup restaurado com sucesso! (${keysRestored} chaves carregadas). Recarregando o Planner...`);
        window.location.reload();
      } catch (err) {
        alert('Erro ao carregar o arquivo de backup. Certifique-se de escolher um arquivo .json de backup válido.');
      }
    };
    reader.readAsText(file);
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
                    onClick={() => navigateTo(item.screen)}
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
                {syncConnecting ? 'Conectando ao Supabase...' : 'Conectar Chave Cloud'}
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

            {/* --- SUPABASE DATABASE INTEGRATION SECTION --- */}
            <div className="border-t border-zinc-900/80 my-5 pt-5 space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Cloud className="h-4 w-4 text-emerald-400 shadow-[0_0_8px_#10b981]" />
                  <h4 className="text-xs font-black uppercase tracking-wider text-zinc-300 font-sans">Banco de Dados Supabase</h4>
                </div>
                <button
                  type="button"
                  onClick={() => setShowSupabaseModal(true)}
                  className="text-[10px] font-mono text-emerald-400 hover:underline flex items-center gap-1"
                >
                  <HelpCircle className="h-3 w-3" /> Script SQL
                </button>
              </div>

              <p className="text-[10px] text-zinc-500 font-sans leading-relaxed">
                Conecte seu próprio banco PostgreSQL no Supabase para sincronização em nuvem ilimitada e sem restrições de cota diária.
              </p>

              {supabaseFeedback && (
                <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[10px] font-mono rounded-xl">
                  {supabaseFeedback}
                </div>
              )}

              <form onSubmit={handleSaveSupabaseConfig} className="space-y-3">
                <div className="space-y-1">
                  <label className="text-[10px] text-zinc-500 font-mono font-bold uppercase block">Supabase Project URL</label>
                  <input
                    type="text"
                    value={supabaseUrl}
                    onChange={(e) => setSupabaseUrl(e.target.value)}
                    placeholder="https://xyzcompany.supabase.co"
                    className="w-full bg-zinc-950 border border-zinc-900 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-emerald-500/40 font-mono"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] text-zinc-500 font-mono font-bold uppercase block">Supabase Anon Key</label>
                  <input
                    type="password"
                    value={supabaseAnonKey}
                    onChange={(e) => setSupabaseAnonKey(e.target.value)}
                    placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6..."
                    className="w-full bg-zinc-950 border border-zinc-900 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-emerald-500/40 font-mono"
                  />
                </div>

                <button
                  type="submit"
                  className="w-full py-2.5 bg-emerald-950/40 hover:bg-emerald-900/60 border border-emerald-800/50 font-bold text-xs text-emerald-400 uppercase tracking-wider rounded-xl transition-all shadow-lg shadow-emerald-950/30"
                >
                  Salvar Conexão Supabase
                </button>
              </form>
            </div>

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
              <div className="flex items-center gap-2">
                <Lock className="h-4 w-4 text-orange-500 shadow-[0_0_8px_#f97316]" />
                <h4 className="text-xs font-black uppercase tracking-wider text-zinc-300 font-sans">Bloqueio do App (PIN / Tela de Bloqueio)</h4>
              </div>
              <p className="text-[10px] text-zinc-500 font-sans leading-relaxed">
                Configure uma <strong className="text-zinc-300">Senha de Bloqueio do App</strong> para trancar a tela do Planner quando estiver inativo. Esta senha é separada da sua senha de login do usuário.
              </p>

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
              <h3 className="text-xs font-black tracking-wider uppercase font-mono text-zinc-300">Exibição e PWA</h3>
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
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-zinc-950 border border-zinc-800 rounded-2xl p-6 max-w-md w-full space-y-5 text-left shadow-2xl relative"
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
                    onClick={() => {
                      setConnectedDevices(prev => prev.map(d => d.id === editingDevice.id ? { ...d, customName: editDeviceCustomName } : d));
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
                    Última sessão ativa {editingDevice.lastActive}
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
                onClick={() => {
                  setConnectedDevices(prev => prev.filter(d => d.id !== editingDevice.id));
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

      {/* Modal: Conectar Dispositivo (QR Code / Test Device) */}
      <AnimatePresence>
        {showConnectDeviceModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-zinc-950 border border-emerald-500/20 rounded-2xl p-6 max-w-sm w-full space-y-5 text-center shadow-2xl relative"
            >
              <div className="flex items-center justify-between border-b border-zinc-900 pb-3">
                <h3 className="text-xs font-black uppercase tracking-wider text-emerald-400">Conectar Novo Dispositivo</h3>
                <button
                  type="button"
                  onClick={() => setShowConnectDeviceModal(false)}
                  className="text-zinc-500 hover:text-white p-1"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              {/* Simulated QR Code box */}
              <div className="p-4 bg-white rounded-2xl mx-auto w-44 h-44 flex flex-col items-center justify-center shadow-inner relative group border-4 border-emerald-500/20">
                <QrCode className="w-32 h-32 text-zinc-950" />
                <span className="text-[8px] font-mono font-bold text-zinc-600 mt-1">Sincronização QR Code</span>
              </div>

              <div className="space-y-1">
                <span className="text-[9px] font-mono text-zinc-500 uppercase tracking-wider block">Código de Pareamento</span>
                <span className="text-base font-mono font-black text-emerald-400 tracking-widest bg-emerald-500/10 border border-emerald-500/20 px-3 py-1.5 rounded-xl inline-block">
                  PLN-9482-SYNC
                </span>
              </div>

              <div className="text-[10px] text-zinc-400 space-y-1 text-left bg-zinc-900/60 p-3 rounded-xl border border-zinc-900">
                <p>1. Acesse o Planner TRONUS em outro celular ou PC.</p>
                <p>2. Vá em Configurações &gt; Dispositivos Conectados.</p>
                <p>3. Aponte a câmera ou insira o código acima.</p>
              </div>

              {/* Action to test adding a connected device */}
              <button
                type="button"
                onClick={() => {
                  const newDev: ConnectedDevice = {
                    id: `dev-test-${Date.now()}`,
                    name: 'Safari (iPhone 15 Pro)',
                    browser: 'Apple Safari',
                    os: 'iOS 17.5',
                    isCurrent: false,
                    lastActive: 'hoje às ' + new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                    ip: '189.28.102.89',
                    deviceType: 'mobile'
                  };
                  setConnectedDevices(prev => [...prev, newDev]);
                  setShowConnectDeviceModal(false);
                }}
                className="w-full py-2.5 bg-emerald-500 hover:bg-emerald-400 text-zinc-950 font-black text-xs uppercase tracking-wider rounded-xl transition-all shadow-md"
              >
                Simular Conexão de Novo Aparelho
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Supabase SQL Setup Modal */}
      <AnimatePresence>
        {showSupabaseModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-zinc-950 border border-emerald-500/20 rounded-2xl p-6 max-w-lg w-full space-y-4 text-left shadow-2xl"
            >
              <div className="flex items-center justify-between border-b border-zinc-900 pb-3">
                <div className="flex items-center gap-2">
                  <Cloud className="h-5 w-5 text-emerald-400" />
                  <h3 className="text-sm font-black text-white uppercase tracking-wider">Como Configurar a Tabela no Supabase</h3>
                </div>
                <button
                  type="button"
                  onClick={() => setShowSupabaseModal(false)}
                  className="text-zinc-500 hover:text-white p-1 transition-colors"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              <div className="space-y-3 text-xs text-zinc-300">
                <p>
                  1. Acesse seu painel no Supabase (<a href="https://supabase.com" target="_blank" rel="noreferrer" className="text-emerald-400 underline">supabase.com</a>).
                </p>
                <p>
                  2. Abra o <strong>SQL Editor</strong> no menu lateral e execute o comando abaixo para criar a tabela de sincronização:
                </p>

                <div className="p-3 bg-zinc-900 border border-zinc-800 rounded-xl font-mono text-[11px] text-emerald-300 overflow-x-auto select-all">
                  <pre>{`-- 1. Criar a tabela se não existir
create table if not exists public.user_sync (
  sync_key text primary key,
  data jsonb not null,
  updated_at timestamp with time zone default now()
);

-- 2. Conceder permissões de acesso às funções API do Supabase (anon)
grant all on table public.user_sync to anon;
grant all on table public.user_sync to authenticated;

-- 3. Habilitar a RLS (Row Level Security)
alter table public.user_sync enable row level security;

-- 4. Limpar políticas antigas se existirem
drop policy if exists "Permitir leitura e escrita por sync_key" on public.user_sync;
drop policy if exists "Acesso público por chave" on public.user_sync;

-- 5. Criar política de segurança permitindo acesso via chave pública (anon)
create policy "Permitir leitura e escrita por sync_key"
  on public.user_sync
  for all
  to public
  using (true)
  with check (true);

-- 6. Habilitar sincronização em tempo real (Realtime)
alter publication supabase_realtime add table public.user_sync;`}</pre>
                </div>

                <p className="text-[10px] text-zinc-500">
                  3. Copie a sua <strong>Project URL</strong> e <strong>anon / public key</strong> em <em>Project Settings &gt; API</em> e cole nos campos do Planner.
                </p>
              </div>

              <div className="flex justify-end pt-2">
                <button
                  type="button"
                  onClick={() => setShowSupabaseModal(false)}
                  className="px-5 py-2 rounded-xl text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-500 transition-all shadow-lg shadow-emerald-600/20"
                >
                  Entendi
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}
