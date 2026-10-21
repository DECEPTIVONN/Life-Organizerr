/**
 * ============================================================================
 * SETTINGS STANDALONE (ARQUIVO DE REFERÊNCIA AUTÔNOMO)
 * ============================================================================
 * 
 * NOTA DE ARQUITETURA:
 * Este componente é um arquivo de especificação e referência autônomo criado para
 * consumo por outro agente em outro projeto.
 * 
 * - NÃO possui qualquer impacto ou acoplamento no fluxo ativo desta aplicação.
 * - Não é importado pelo App.tsx ou pela navegação principal deste site.
 * - Pode ser exportado, copiado ou consumido de forma isolada em outros projetos.
 * - Inclui sistema visual completo (HUD, Tailwind, Glassmorphism, Cores & Temas),
 *   segurança, notificações, placeholders de nuvem e documentação da stack utilizada.
 * ============================================================================
 */

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
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
  Fingerprint,
  Clipboard,
  Database,
  Play,
  Copy,
  Layers,
  Flame,
  Info,
  Cpu,
  Code,
  Terminal,
  Server
} from 'lucide-react';
import { requestNotificationPermission, sendSystemNotification } from '../lib/notificationHelper';
import { isPlatformAuthenticatorAvailable, verifyBiometric } from '../utils/biometricAuth';
import { ReviewReminderModal } from './ReviewReminderModal';
import { 
  getReviewRemindersSettings, 
  getWeeklyReviewDayLabel, 
  getMonthlyReviewTimingLabel, 
  ReviewRemindersSettings 
} from '../utils/reviewReminderUtils';
import ColorSchemeModal from './ColorSchemeModal';
import { THEME_PRESETS, applyThemeColor, hexToRgb } from '../utils/themeColors';
import defaultLockBg from '../assets/images/1271888.jpg';

export type SettingsStandaloneScreen = 
  | 'main' 
  | 'sua_conta' 
  | 'informacoes_conta' 
  | 'alterar_senha' 
  | 'desativar_conta' 
  | 'seguranca' 
  | 'dispositivos_conectados'
  | 'notificacoes' 
  | 'exibicao'
  | 'banco_dados_nuvem'
  | 'stack_info';

export interface ConnectedDeviceItem {
  id: string;
  name: string;
  browser: string;
  os: string;
  isCurrent: boolean;
  lastActiveTimestamp: number;
  lastActive: string;
  ip: string;
  deviceType: 'desktop' | 'mobile' | 'tablet';
}

export interface SettingsStandaloneProps {
  // User Profile
  initialUserName?: string;
  initialUserPhoto?: string;
  initialUserHandle?: string;
  initialUserEmail?: string;
  initialUserBio?: string;
  onProfileUpdate?: (profile: { name: string; photo: string; handle: string; email: string; bio: string }) => void;

  // Appearance & Personalization
  initialThemePreset?: string;
  initialCustomHex?: string;
  initialCardGlow?: boolean;
  initialMobileSlideTransition?: boolean;
  initialMobileNavbarMode?: 'fixed' | 'flexible';
  initialAutoFullscreen?: boolean;
  initialShowDateSelector?: boolean;
  onThemeUpdate?: (theme: { preset: string; customHex: string; cardGlow: boolean }) => void;

  // App Lock & Security
  initialAppLockEnabled?: boolean;
  initialAppLockPassword?: string;
  initialAppLockTimeout?: number;
  initialAppLockBiometric?: boolean;
  onLockUpdate?: (lock: { enabled: boolean; timeout: number; biometric: boolean }) => void;

  // Navigation callbacks
  onBackToApp?: () => void;
  onLogout?: () => void;
}

const AVATAR_PRESETS = [
  'https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?q=80&w=150',
  'https://images.unsplash.com/photo-1608155686393-8fdd966d784d?q=80&w=150',
  'https://images.unsplash.com/photo-1584290860587-211bfb66aa0f?q=80&w=150',
  'https://images.unsplash.com/photo-1579783902614-a3fb3927b6a5?q=80&w=150',
  'https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=150',
  'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?q=80&w=150'
];

const WALLPAPER_PRESETS = [
  { name: 'Cyber Minimal', url: defaultLockBg || '/assets/1271888.jpg' },
  { name: 'Dark Nebula', url: 'https://images.unsplash.com/photo-1506703719100-a0f3a48c0f86?q=80&w=1200' },
  { name: 'Onyx Geometric', url: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=1200' },
  { name: 'Deep Space Horizon', url: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?q=80&w=1200' }
];

export default function SettingsStandalone({
  initialUserName = 'Administrador',
  initialUserPhoto = 'https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?q=80&w=150',
  initialUserHandle = 'admin_life',
  initialUserEmail = 'usuario@lifeorganizer.app',
  initialUserBio = 'Foco em alta performance, consistência diária e evolução contínua.',
  initialThemePreset = 'default',
  initialCustomHex = '#f97316',
  initialCardGlow = true,
  initialMobileSlideTransition = true,
  initialMobileNavbarMode = 'fixed',
  initialAutoFullscreen = false,
  initialShowDateSelector = true,
  initialAppLockEnabled = false,
  initialAppLockPassword = '',
  initialAppLockTimeout = 300,
  initialAppLockBiometric = false,
  onProfileUpdate,
  onThemeUpdate,
  onLockUpdate,
  onBackToApp,
  onLogout
}: SettingsStandaloneProps) {

  // Navigation Stack State
  const [currentScreen, setCurrentScreen] = useState<SettingsStandaloneScreen>('main');
  const [screenHistory, setScreenHistory] = useState<SettingsStandaloneScreen[]>([]);
  const [searchQuery, setSearchQuery] = useState('');

  const navigateTo = (screen: SettingsStandaloneScreen) => {
    setScreenHistory((prev) => [...prev, currentScreen]);
    setCurrentScreen(screen);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleBack = () => {
    if (screenHistory.length > 0) {
      const prevScreen = screenHistory[screenHistory.length - 1];
      setScreenHistory((prev) => prev.slice(0, prev.length - 1));
      setCurrentScreen(prevScreen);
    } else {
      if (onBackToApp) onBackToApp();
      else setCurrentScreen('main');
    }
  };

  // 1. User Profile State
  const [userName, setUserName] = useState<string>(() => localStorage.getItem('mbc_user_name') || initialUserName);
  const [userPhoto, setUserPhoto] = useState<string>(() => localStorage.getItem('mbc_user_photo') || initialUserPhoto);
  const [userHandle, setUserHandle] = useState<string>(() => localStorage.getItem('mbc_user_handle') || initialUserHandle);
  const [userEmail, setUserEmail] = useState<string>(() => localStorage.getItem('mbc_user_email') || initialUserEmail);
  const [userBio, setUserBio] = useState<string>(() => localStorage.getItem('mbc_user_bio') || initialUserBio);
  const [userPassword, setUserPassword] = useState<string>(() => localStorage.getItem('mbc_user_password') || '••••••••');
  
  const [editName, setEditName] = useState(userName);
  const [editPhoto, setEditPhoto] = useState(userPhoto);
  const [editHandle, setEditHandle] = useState(userHandle);
  const [editEmail, setEditEmail] = useState(userEmail);
  const [editBio, setEditBio] = useState(userBio);
  
  // Password change form
  const [currPassInput, setCurrPassInput] = useState('');
  const [newPassInput, setNewPassInput] = useState('');
  const [confirmPassInput, setConfirmPassInput] = useState('');
  const [showCurrPass, setShowCurrPass] = useState(false);
  const [showNewPass, setShowNewPass] = useState(false);
  const [passFeedback, setPassFeedback] = useState<{ type: 'success' | 'error'; msg: string } | null>(null);

  // 2. Appearance & Theme Color State
  const [activeThemePreset, setActiveThemePreset] = useState<string>(() => localStorage.getItem('mbc_theme_preset') || initialThemePreset);
  const [customThemeHex, setCustomThemeHex] = useState<string>(() => localStorage.getItem('mbc_theme_custom_hex') || initialCustomHex);
  const [cardGlowEnabled, setCardGlowEnabled] = useState<boolean>(() => localStorage.getItem('mbc_card_glow_enabled') !== 'false');
  const [mobileSlideTransition, setMobileSlideTransition] = useState<boolean>(() => localStorage.getItem('mbc_mobile_slide_transition') !== 'false');
  const [mobileNavbarMode, setMobileNavbarMode] = useState<'fixed' | 'flexible'>(() => (localStorage.getItem('mbc_mobile_navbar_mode') as 'fixed' | 'flexible') || initialMobileNavbarMode);
  const [autoFullscreen, setAutoFullscreen] = useState<boolean>(() => localStorage.getItem('mbc_auto_fullscreen') === 'true');
  const [showDateSelector, setShowDateSelector] = useState<boolean>(() => localStorage.getItem('mbc_show_date_selector') !== 'false');
  
  // Wallpapers
  const [lockScreenDesktopImage, setLockScreenDesktopImage] = useState<string>(() => localStorage.getItem('mbc_lock_bg_desktop') || '');
  const [lockScreenMobileImage, setLockScreenMobileImage] = useState<string>(() => localStorage.getItem('mbc_lock_bg_mobile') || '');
  const [loadingScreenVerticalImage, setLoadingScreenVerticalImage] = useState<string>(() => localStorage.getItem('mbc_splash_bg_vertical') || '');
  const [loadingScreenHorizontalImage, setLoadingScreenHorizontalImage] = useState<string>(() => localStorage.getItem('mbc_splash_bg_horizontal') || '');

  // Color modal
  const [isColorSchemeModalOpen, setIsColorSchemeModalOpen] = useState(false);

  // Apply theme on preset or hex change
  const handleSelectThemePreset = (presetId: string, hex?: string) => {
    setActiveThemePreset(presetId);
    localStorage.setItem('mbc_theme_preset', presetId);
    
    if (presetId === 'custom' && hex) {
      setCustomThemeHex(hex);
      localStorage.setItem('mbc_theme_custom_hex', hex);
      applyThemeColor(hex);
    } else {
      const preset = THEME_PRESETS.find((p) => p.id === presetId);
      if (preset) {
        applyThemeColor(preset.primaryHex);
      }
    }

    if (onThemeUpdate) {
      onThemeUpdate({
        preset: presetId,
        customHex: hex || customThemeHex,
        cardGlow: cardGlowEnabled
      });
    }
  };

  // 3. Security & App Lock State
  const [appLockEnabled, setAppLockEnabled] = useState<boolean>(() => localStorage.getItem('mbc_app_lock_enabled') === 'true');
  const [appLockPassword, setAppLockPassword] = useState<string>(() => localStorage.getItem('mbc_app_lock_password') || initialAppLockPassword);
  const [appLockTimeout, setAppLockTimeout] = useState<number>(() => {
    const saved = localStorage.getItem('mbc_app_lock_timeout');
    return saved !== null ? parseInt(saved, 10) : initialAppLockTimeout;
  });
  const [appLockBiometricEnabled, setAppLockBiometricEnabled] = useState<boolean>(() => localStorage.getItem('mbc_app_lock_biometric_enabled') === 'true');
  const [isBiometricSupported, setIsBiometricSupported] = useState(false);
  const [isBiometricVerifying, setIsBiometricVerifying] = useState(false);

  // Check biometric support
  useEffect(() => {
    isPlatformAuthenticatorAvailable().then((supported) => {
      setIsBiometricSupported(supported);
    });
  }, []);

  // Lock password setup form
  const [showLockPasswordModal, setShowLockPasswordModal] = useState(false);
  const [newLockPassInput, setNewLockPassInput] = useState('');
  const [confirmLockPassInput, setConfirmLockPassInput] = useState('');
  const [lockPassFeedback, setLockPassFeedback] = useState<string | null>(null);

  // 4. Notifications & Alerts State
  const [backgroundNotificationsEnabled, setBackgroundNotificationsEnabled] = useState<boolean>(() => localStorage.getItem('mbc_background_notifications_enabled') !== 'false');
  const [dailyWorkspaceNotifEnabled, setDailyWorkspaceNotifEnabled] = useState<boolean>(() => localStorage.getItem('mbc_daily_workspace_notif_enabled') !== 'false');
  const [dailyWorkspaceTime, setDailyWorkspaceTime] = useState<string>(() => localStorage.getItem('mbc_daily_workspace_reminder_time') || '21:00');
  const [reviewReminderModalOpen, setReviewReminderModalOpen] = useState(false);
  const [reviewModalInitialTab, setReviewModalInitialTab] = useState<'weekly' | 'monthly' | 'all'>('all');
  const [reviewSettings, setReviewSettings] = useState<ReviewRemindersSettings>(() => getReviewRemindersSettings());

  // 5. Database & Cloud Sync (PLACEHOLDER MODE)
  const [cloudProvider, setCloudProvider] = useState<'supabase' | 'firebase' | 'cloudsql'>('supabase');
  const [placeholderSyncKey, setPlaceholderSyncKey] = useState<string>(() => localStorage.getItem('mbc_placeholder_sync_key') || 'life-org-live-89f41a');
  const [placeholderProjectUrl, setPlaceholderProjectUrl] = useState<string>('https://life-organizer-project.supabase.co');
  const [isSimulatingSync, setIsSimulatingSync] = useState(false);
  const [cloudToast, setCloudToast] = useState<{ message: string; type: 'info' | 'success' | 'warning' } | null>(null);

  // 6. Connected Devices State
  const [connectedDevices, setConnectedDevices] = useState<ConnectedDeviceItem[]>([
    {
      id: 'dev-curr-session',
      name: 'Navegador Web (Sessão Atual)',
      browser: 'Chrome 122.0',
      os: 'Windows 11 64-bit',
      isCurrent: true,
      lastActiveTimestamp: Date.now(),
      lastActive: 'Ativo agora',
      ip: '189.28.102.44',
      deviceType: 'desktop'
    },
    {
      id: 'dev-mobile-pwa',
      name: 'Life Organizer Mobile PWA',
      browser: 'Safari PWA',
      os: 'iOS 17.4 (iPhone)',
      isCurrent: false,
      lastActiveTimestamp: Date.now() - 3600000 * 2,
      lastActive: 'Há 2 horas',
      ip: '177.142.19.82',
      deviceType: 'mobile'
    }
  ]);

  // General Toast / Feedback
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  // Save profile changes
  const handleSaveProfile = () => {
    setUserName(editName);
    setUserPhoto(editPhoto);
    setUserHandle(editHandle);
    setUserEmail(editEmail);
    setUserBio(editBio);

    localStorage.setItem('mbc_user_name', editName);
    localStorage.setItem('mbc_user_photo', editPhoto);
    localStorage.setItem('mbc_user_handle', editHandle);
    localStorage.setItem('mbc_user_email', editEmail);
    localStorage.setItem('mbc_user_bio', editBio);

    if (onProfileUpdate) {
      onProfileUpdate({
        name: editName,
        photo: editPhoto,
        handle: editHandle,
        email: editEmail,
        bio: editBio
      });
    }

    showToast('Perfil atualizado com sucesso!');
    handleBack();
  };

  // Change password
  const handleChangePassword = () => {
    if (newPassInput.length < 4) {
      setPassFeedback({ type: 'error', msg: 'A nova senha deve ter no mínimo 4 caracteres.' });
      return;
    }
    if (newPassInput !== confirmPassInput) {
      setPassFeedback({ type: 'error', msg: 'As senhas não coincidem.' });
      return;
    }

    setUserPassword(newPassInput);
    localStorage.setItem('mbc_user_password', newPassInput);
    setCurrPassInput('');
    setNewPassInput('');
    setConfirmPassInput('');
    setPassFeedback({ type: 'success', msg: 'Senha alterada com sucesso!' });
    showToast('Senha da conta alterada com sucesso!');
  };

  // Save lock password
  const handleSaveLockPassword = () => {
    if (newLockPassInput.length < 4) {
      setLockPassFeedback('A senha de bloqueio deve possuir ao menos 4 dígitos.');
      return;
    }
    if (newLockPassInput !== confirmLockPassInput) {
      setLockPassFeedback('As senhas de bloqueio não coincidem.');
      return;
    }

    setAppLockPassword(newLockPassInput);
    localStorage.setItem('mbc_app_lock_password', newLockPassInput);
    setShowLockPasswordModal(false);
    setNewLockPassInput('');
    setConfirmLockPassInput('');
    setLockPassFeedback(null);
    showToast('Senha de bloqueio definida com sucesso!');

    if (onLockUpdate) {
      onLockUpdate({
        enabled: appLockEnabled,
        timeout: appLockTimeout,
        biometric: appLockBiometricEnabled
      });
    }
  };

  // Test System Notification
  const handleTestNotification = async () => {
    const granted = await requestNotificationPermission();
    if (granted) {
      sendSystemNotification('⏰ Teste de Alarme Life Organizer', {
        body: 'Notificação do sistema funcionando perfeitamente em segundo plano!',
        tag: 'test-alarm-life-organizer'
      });
      showToast('Notificação de teste disparada!');
    } else {
      alert('Permissão de notificação negada no navegador. Habilite nas configurações do seu sistema/navegador.');
    }
  };

  // Export JSON Backup
  const handleExportBackup = () => {
    const backupData = {
      version: '1.2.0-SEC',
      exportDate: new Date().toISOString(),
      user: { name: userName, photo: userPhoto, handle: userHandle, email: userEmail, bio: userBio },
      theme: { preset: activeThemePreset, customHex: customThemeHex, cardGlow: cardGlowEnabled },
      security: { appLockEnabled, appLockTimeout, appLockBiometricEnabled },
      wallpapers: { lockScreenDesktopImage, lockScreenMobileImage, loadingScreenVerticalImage, loadingScreenHorizontalImage },
      notifications: { backgroundNotificationsEnabled, dailyWorkspaceNotifEnabled, dailyWorkspaceTime }
    };

    const blob = new Blob([JSON.stringify(backupData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `life_organizer_backup_${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
    showToast('Backup exportado com sucesso!');
  };

  // Import JSON Backup
  const handleImportBackup = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const json = JSON.parse(event.target?.result as string);
        if (json.user) {
          if (json.user.name) { setUserName(json.user.name); localStorage.setItem('mbc_user_name', json.user.name); }
          if (json.user.photo) { setUserPhoto(json.user.photo); localStorage.setItem('mbc_user_photo', json.user.photo); }
          if (json.user.handle) { setUserHandle(json.user.handle); localStorage.setItem('mbc_user_handle', json.user.handle); }
          if (json.user.email) { setUserEmail(json.user.email); localStorage.setItem('mbc_user_email', json.user.email); }
        }
        if (json.theme) {
          if (json.theme.preset) { setActiveThemePreset(json.theme.preset); localStorage.setItem('mbc_theme_preset', json.theme.preset); }
          if (json.theme.customHex) { setCustomThemeHex(json.theme.customHex); localStorage.setItem('mbc_theme_custom_hex', json.theme.customHex); }
        }
        showToast('Configurações importadas com sucesso!');
      } catch (err) {
        alert('Arquivo de backup inválido.');
      }
    };
    reader.readAsText(file);
  };

  // Placeholder Cloud Sync Simulation
  const handleSimulateCloudConnect = () => {
    setIsSimulatingSync(true);
    setCloudToast(null);

    setTimeout(() => {
      setIsSimulatingSync(false);
      setCloudToast({
        type: 'info',
        message: 'Modo Placeholder Ativo: A sincronização em nuvem está desvinculada neste componente standalone. Seus dados operam com segurança 100% local (IndexedDB & LocalStorage).'
      });
    }, 900);
  };

  // Filter main menu options when searching
  const menuCategories = [
    {
      id: 'informacoes_conta',
      title: 'Perfil & Dados da Conta',
      desc: 'Nome, avatar, usuário, bio e credenciais de login',
      icon: User,
      screen: 'informacoes_conta' as SettingsStandaloneScreen,
      badge: userName,
      keywords: ['perfil', 'usuario', 'nome', 'avatar', 'foto', 'email', 'conta']
    },
    {
      id: 'exibicao',
      title: 'Sistema de Cores & Personalização',
      desc: 'Paletas neon, seletor de cores, papel de parede e transições',
      icon: Palette,
      screen: 'exibicao' as SettingsStandaloneScreen,
      badge: THEME_PRESETS.find(p => p.id === activeThemePreset)?.name || 'Customizado',
      keywords: ['cor', 'tema', 'personalizacao', 'wallpaper', 'neon', 'estilo', 'exibicao']
    },
    {
      id: 'seguranca',
      title: 'Segurança & Bloqueio do App',
      desc: 'PIN de acesso, biometria digital e tempo de bloqueio automático',
      icon: ShieldCheck,
      screen: 'seguranca' as SettingsStandaloneScreen,
      badge: appLockEnabled ? 'Bloqueio Ativo' : 'Desativado',
      keywords: ['seguranca', 'senha', 'pin', 'biometria', 'digital', 'bloqueio', 'privacidade']
    },
    {
      id: 'notificacoes',
      title: 'Notificações & Lembretes PWA',
      desc: 'Alertas de rotina, segundo plano, ciclos semanal e mensal',
      icon: Bell,
      screen: 'notificacoes' as SettingsStandaloneScreen,
      badge: backgroundNotificationsEnabled ? 'Ativadas' : 'Silenciadas',
      keywords: ['notificacoes', 'alarme', 'segundo plano', 'pwa', 'lembrete', 'review']
    },
    {
      id: 'banco_dados_nuvem',
      title: 'Banco de Dados & Nuvem (Placeholder)',
      desc: 'Conexão Supabase / Firebase / Cloud SQL em modo simulado',
      icon: Database,
      screen: 'banco_dados_nuvem' as SettingsStandaloneScreen,
      badge: 'Local Seguro',
      keywords: ['nuvem', 'banco de dados', 'supabase', 'firebase', 'sincronizacao', 'cloud', 'backup']
    },
    {
      id: 'dispositivos_conectados',
      title: 'Dispositivos Conectados',
      desc: 'Sessões ativas no navegador e dispositivos móveis vinculados',
      icon: Laptop,
      screen: 'dispositivos_conectados' as SettingsStandaloneScreen,
      badge: `${connectedDevices.length} ativos`,
      keywords: ['dispositivos', 'sessoes', 'aparelhos', 'computador', 'celular', 'login']
    },
    {
      id: 'stack_info',
      title: 'Tecnologias & Arquitetura (Stack)',
      desc: 'Detalhes completos da stack técnica: React 19, TypeScript 5.8, Vite 6, Tailwind CSS v4, Motion e PWA',
      icon: Cpu,
      screen: 'stack_info' as SettingsStandaloneScreen,
      badge: 'React 19 • TS 5.8 • Vite 6',
      keywords: ['stack', 'tecnologia', 'react', 'typescript', 'vite', 'tailwind', 'motion', 'pwa', 'capacitor', 'backend', 'node', 'arquitetura', 'versao']
    }
  ];

  const filteredCategories = menuCategories.filter(cat => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      cat.title.toLowerCase().includes(q) ||
      cat.desc.toLowerCase().includes(q) ||
      cat.keywords.some(k => k.includes(q))
    );
  });

  return (
    <div className="min-h-screen bg-[#040405] text-zinc-300 font-sans antialiased pb-20 selection:bg-orange-500/30 selection:text-orange-200">
      
      {/* Dynamic Background Glow */}
      <div 
        className="fixed top-0 left-1/2 -translate-x-1/2 w-full max-w-7xl h-[450px] pointer-events-none opacity-20 blur-[140px] transition-colors duration-700"
        style={{
          background: `radial-gradient(circle, var(--color-orange-500, #f97316) 0%, transparent 70%)`
        }}
      />

      {/* Main Container */}
      <div className="relative max-w-4xl mx-auto px-4 sm:px-6 pt-6 sm:pt-8 space-y-6">

        {/* Global Toast Alert */}
        <AnimatePresence>
          {toastMessage && (
            <motion.div
              initial={{ opacity: 0, y: -20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -20, scale: 0.95 }}
              className="fixed top-5 right-5 z-50 flex items-center gap-2.5 px-4 py-3 bg-[#0c0c10] border border-orange-500/40 rounded-2xl shadow-[0_0_25px_rgba(249,115,22,0.25)] text-xs font-mono text-zinc-200 backdrop-blur-md"
            >
              <CheckCircle2 className="h-4 w-4 text-orange-400 shrink-0" />
              <span>{toastMessage}</span>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Top Header Navigation */}
        <div className="flex items-center justify-between border-b border-zinc-900 pb-5">
          <div className="flex items-center gap-3">
            {currentScreen !== 'main' ? (
              <button
                type="button"
                onClick={handleBack}
                className="p-2.5 bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 hover:border-zinc-700 text-zinc-300 hover:text-white rounded-xl transition-all cursor-pointer flex items-center justify-center group"
                title="Voltar"
              >
                <ArrowLeft className="h-4 w-4 group-hover:-translate-x-0.5 transition-transform" />
              </button>
            ) : onBackToApp ? (
              <button
                type="button"
                onClick={onBackToApp}
                className="p-2.5 bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 hover:border-zinc-700 text-zinc-300 hover:text-white rounded-xl transition-all cursor-pointer flex items-center justify-center group"
                title="Voltar ao App"
              >
                <ArrowLeft className="h-4 w-4 group-hover:-translate-x-0.5 transition-transform" />
              </button>
            ) : null}

            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-mono font-bold uppercase tracking-widest text-orange-400 bg-orange-500/10 px-2 py-0.5 rounded-full border border-orange-500/20">
                  LIFE ORGANIZER • STANDALONE
                </span>
                <span className="text-[9px] font-mono text-zinc-500 hidden sm:inline">v1.2.0-SEC</span>
              </div>
              <h1 className="text-xl sm:text-2xl font-black text-white tracking-wider uppercase font-mono mt-0.5">
                {currentScreen === 'main' && 'Configurações'}
                {currentScreen === 'informacoes_conta' && 'Perfil & Informações'}
                {currentScreen === 'alterar_senha' && 'Alterar Senha'}
                {currentScreen === 'exibicao' && 'Sistema de Cores & Aparência'}
                {currentScreen === 'seguranca' && 'Segurança & Bloqueio Local'}
                {currentScreen === 'notificacoes' && 'Notificações & Lembretes'}
                {currentScreen === 'banco_dados_nuvem' && 'Banco de Dados & Nuvem (Placeholder)'}
                {currentScreen === 'dispositivos_conectados' && 'Dispositivos Conectados'}
                {currentScreen === 'stack_info' && 'Tecnologias & Arquitetura (Stack)'}
              </h1>
            </div>
          </div>

          {/* Quick Header Badge */}
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleExportBackup}
              className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 bg-zinc-900/80 hover:bg-zinc-800 border border-zinc-800 hover:border-zinc-700 text-zinc-300 text-xs font-mono font-semibold rounded-xl transition-all cursor-pointer"
              title="Exportar Backup JSON"
            >
              <Download className="h-3.5 w-3.5 text-orange-400" />
              <span>Backup</span>
            </button>
          </div>
        </div>

        {/* ===================================================================== */}
        {/* SCREEN 1: MAIN SETTINGS HUB                                           */}
        {/* ===================================================================== */}
        {currentScreen === 'main' && (
          <div className="space-y-6">

            {/* User Quick Summary Card */}
            <div className="p-4 sm:p-5 bg-[#0a0a0e]/90 border border-zinc-850 hover:border-orange-500/30 rounded-3xl shadow-xl backdrop-blur-md flex flex-col sm:flex-row items-center justify-between gap-4 transition-all">
              <div className="flex items-center gap-4 text-center sm:text-left w-full sm:w-auto">
                <div className="relative w-16 h-16 shrink-0 mx-auto sm:mx-0">
                  <div 
                    className="absolute -inset-1 rounded-full blur-sm opacity-70"
                    style={{ backgroundColor: 'var(--color-orange-500, #f97316)' }}
                  />
                  <img
                    src={userPhoto}
                    alt={userName}
                    className="w-16 h-16 rounded-full border border-zinc-700 object-cover relative z-10 p-0.5 bg-[#0a0a0d]"
                  />
                </div>
                <div>
                  <div className="flex items-center justify-center sm:justify-start gap-2">
                    <h2 className="text-base sm:text-lg font-black text-white uppercase tracking-wider">{userName}</h2>
                    <span className="text-[10px] font-mono text-orange-400 bg-orange-500/10 px-2 py-0.5 rounded-full border border-orange-500/20 font-bold">
                      PRO
                    </span>
                  </div>
                  <p className="text-xs text-zinc-400 font-mono mt-0.5">@{userHandle}</p>
                  <p className="text-[11px] text-zinc-500 mt-1 line-clamp-1 max-w-md">{userBio}</p>
                </div>
              </div>

              <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
                <button
                  type="button"
                  onClick={() => navigateTo('informacoes_conta')}
                  className="w-full sm:w-auto px-4 py-2 bg-orange-500 hover:bg-orange-600 text-black text-xs font-bold uppercase tracking-wider rounded-xl transition-all shadow-md flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <Edit2 className="h-3.5 w-3.5" />
                  <span>Editar Perfil</span>
                </button>
              </div>
            </div>

            {/* Search Filter */}
            <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-500" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Buscar ajuste (cores, biometria, notificações, backup, nuvem...)"
                className="w-full bg-[#09090d] border border-zinc-850 focus:border-orange-500/60 rounded-2xl pl-11 pr-4 py-3 text-xs text-zinc-200 placeholder-zinc-600 focus:outline-none transition-all shadow-inner font-mono"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-300"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>

            {/* Menu Tiles Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              {filteredCategories.map((item) => {
                const IconComponent = item.icon;
                return (
                  <div
                    key={item.id}
                    onClick={() => navigateTo(item.screen)}
                    className="p-4 sm:p-5 bg-[#09090d]/80 hover:bg-[#0e0e14] border border-zinc-850 hover:border-orange-500/40 rounded-3xl transition-all duration-200 cursor-pointer group flex items-start justify-between gap-3 shadow-lg"
                  >
                    <div className="flex items-start gap-3.5">
                      <div className="p-3 bg-zinc-900 border border-zinc-800 rounded-2xl text-orange-400 group-hover:scale-105 group-hover:text-orange-300 transition-all shrink-0">
                        <IconComponent className="h-5 w-5" />
                      </div>
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <h3 className="text-xs sm:text-sm font-bold text-white tracking-wide group-hover:text-orange-400 transition-colors">
                            {item.title}
                          </h3>
                        </div>
                        <p className="text-[11px] text-zinc-400 leading-snug line-clamp-2">
                          {item.desc}
                        </p>
                        {item.badge && (
                          <div className="pt-1.5">
                            <span className="text-[9px] font-mono px-2 py-0.5 rounded-full bg-zinc-900 border border-zinc-800 text-zinc-400 group-hover:border-orange-500/30 group-hover:text-orange-300 transition-colors">
                              {item.badge}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>

                    <ChevronRight className="h-4 w-4 text-zinc-600 group-hover:text-orange-400 group-hover:translate-x-1 transition-all shrink-0 mt-1" />
                  </div>
                );
              })}
            </div>

            {/* Quick Backup & Restore Bar */}
            <div className="p-5 bg-zinc-950/60 border border-zinc-900 rounded-3xl flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-orange-500/10 rounded-2xl text-orange-400 shrink-0">
                  <Database className="h-5 w-5" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-zinc-200">Armazenamento Local & Portabilidade</h4>
                  <p className="text-[11px] text-zinc-500">Seus dados e preferências residem localmente com total soberania.</p>
                </div>
              </div>

              <div className="flex items-center gap-2.5 w-full sm:w-auto">
                <button
                  type="button"
                  onClick={handleExportBackup}
                  className="flex-1 sm:flex-initial px-3.5 py-2 bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 hover:border-zinc-700 text-zinc-300 text-xs font-mono font-bold rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <Download className="h-3.5 w-3.5 text-orange-400" />
                  <span>Exportar JSON</span>
                </button>

                <label className="flex-1 sm:flex-initial px-3.5 py-2 bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 hover:border-zinc-700 text-zinc-300 text-xs font-mono font-bold rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer">
                  <Upload className="h-3.5 w-3.5 text-orange-400" />
                  <span>Importar JSON</span>
                  <input
                    type="file"
                    accept=".json"
                    onChange={handleImportBackup}
                    className="hidden"
                  />
                </label>
              </div>
            </div>

            {/* Tech Stack Banner */}
            <div 
              onClick={() => navigateTo('stack_info')}
              className="p-5 bg-gradient-to-r from-zinc-950 via-[#0a0a0f] to-zinc-950 border border-zinc-850 hover:border-orange-500/40 rounded-3xl cursor-pointer transition-all duration-300 group shadow-lg flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
            >
              <div className="flex items-center gap-3.5">
                <div className="p-3 bg-orange-500/10 border border-orange-500/20 rounded-2xl text-orange-400 group-hover:scale-105 transition-transform shrink-0">
                  <Cpu className="h-5 w-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <h4 className="text-xs font-bold text-white group-hover:text-orange-300 transition-colors uppercase tracking-wider font-mono">
                      Stack Tecnológica Utilizada
                    </h4>
                    <span className="text-[9px] font-mono px-2 py-0.5 rounded-full bg-orange-500/15 text-orange-400 border border-orange-500/30 font-bold">
                      VER DETALHES
                    </span>
                  </div>
                  <p className="text-[11px] text-zinc-400 mt-0.5">
                    React 19 • TypeScript 5.8 • Vite 6 • Tailwind CSS v4 • Motion 12 • PWA • Capacitor 8
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-1 text-xs font-mono text-orange-400 font-bold self-end sm:self-center shrink-0 group-hover:translate-x-1 transition-transform">
                <span>Explorar Stack</span>
                <ChevronRight className="h-4 w-4" />
              </div>
            </div>

            {/* Logout Action */}
            {onLogout && (
              <div className="pt-2 flex justify-center">
                <button
                  type="button"
                  onClick={onLogout}
                  className="px-5 py-2.5 text-xs font-mono font-bold text-red-400 hover:text-red-300 hover:bg-red-950/20 border border-red-900/30 rounded-2xl transition-all flex items-center gap-2 cursor-pointer"
                >
                  <LogOut className="h-4 w-4" />
                  <span>Encerrar Sessão Local</span>
                </button>
              </div>
            )}

          </div>
        )}

        {/* ===================================================================== */}
        {/* SCREEN 2: PROFILE & ACCOUNT INFORMATION                               */}
        {/* ===================================================================== */}
        {currentScreen === 'informacoes_conta' && (
          <div className="p-6 bg-[#0a0a0e] border border-zinc-850 rounded-3xl space-y-6">
            
            {/* Avatar Preview & Presets */}
            <div className="flex flex-col sm:flex-row items-center gap-6 pb-6 border-b border-zinc-900">
              <div className="relative w-24 h-24 shrink-0">
                <img
                  src={editPhoto}
                  alt={editName}
                  className="w-24 h-24 rounded-full border-2 border-orange-500/50 object-cover p-1 bg-black shadow-lg"
                />
              </div>

              <div className="space-y-3 w-full">
                <div>
                  <h4 className="text-xs font-black uppercase font-mono text-zinc-200">Avatar do Perfil</h4>
                  <p className="text-[11px] text-zinc-500">Escolha uma imagem de destaque ou cole uma URL customizada.</p>
                </div>

                <div className="flex flex-wrap gap-2">
                  {AVATAR_PRESETS.map((presetUrl, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => setEditPhoto(presetUrl)}
                      className={`w-10 h-10 rounded-full overflow-hidden border-2 transition-all cursor-pointer ${
                        editPhoto === presetUrl ? 'border-orange-500 scale-105 ring-2 ring-orange-500/40' : 'border-zinc-800 opacity-60 hover:opacity-100'
                      }`}
                    >
                      <img src={presetUrl} alt={`Avatar ${idx}`} className="w-full h-full object-cover" />
                    </button>
                  ))}
                </div>

                <input
                  type="text"
                  value={editPhoto}
                  onChange={(e) => setEditPhoto(e.target.value)}
                  placeholder="URL direta da imagem (https://...)"
                  className="w-full bg-zinc-950 border border-zinc-800 focus:border-orange-500/50 rounded-xl px-3 py-2 text-xs text-zinc-300 font-mono focus:outline-none"
                />
              </div>
            </div>

            {/* Profile Fields */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-mono font-bold text-zinc-400 uppercase">Nome de Exibição</label>
                <input
                  type="text"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="w-full bg-zinc-950 border border-zinc-800 focus:border-orange-500 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none font-mono"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-mono font-bold text-zinc-400 uppercase">Nome de Usuário (@handle)</label>
                <input
                  type="text"
                  value={editHandle}
                  onChange={(e) => setEditHandle(e.target.value)}
                  className="w-full bg-zinc-950 border border-zinc-800 focus:border-orange-500 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none font-mono"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-mono font-bold text-zinc-400 uppercase">Email de Contato</label>
                <input
                  type="email"
                  value={editEmail}
                  onChange={(e) => setEditEmail(e.target.value)}
                  className="w-full bg-zinc-950 border border-zinc-800 focus:border-orange-500 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none font-mono"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-mono font-bold text-zinc-400 uppercase">Senha da Conta</label>
                <div className="flex gap-2">
                  <input
                    type="password"
                    disabled
                    value={userPassword}
                    className="w-full bg-zinc-950/60 border border-zinc-900 rounded-xl px-3.5 py-2.5 text-xs text-zinc-500 font-mono"
                  />
                  <button
                    type="button"
                    onClick={() => navigateTo('alterar_senha')}
                    className="px-3.5 py-2 bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-xs font-mono font-bold rounded-xl text-zinc-300 hover:text-white shrink-0 cursor-pointer"
                  >
                    Alterar
                  </button>
                </div>
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-mono font-bold text-zinc-400 uppercase">Biografia / Resumo Pessoal</label>
              <textarea
                value={editBio}
                onChange={(e) => setEditBio(e.target.value)}
                rows={3}
                className="w-full bg-zinc-950 border border-zinc-800 focus:border-orange-500 rounded-xl p-3 text-xs text-zinc-300 focus:outline-none font-sans resize-none"
              />
            </div>

            {/* Actions */}
            <div className="pt-4 border-t border-zinc-900 flex justify-end gap-3">
              <button
                type="button"
                onClick={handleBack}
                className="px-4 py-2 bg-zinc-900 hover:bg-zinc-800 text-zinc-400 hover:text-white text-xs font-mono font-bold uppercase rounded-xl transition-all cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleSaveProfile}
                className="px-5 py-2 bg-orange-500 hover:bg-orange-600 text-black text-xs font-mono font-black uppercase rounded-xl transition-all shadow-md cursor-pointer"
              >
                Salvar Alterações
              </button>
            </div>

          </div>
        )}

        {/* ===================================================================== */}
        {/* SCREEN 3: CHANGE ACCOUNT PASSWORD                                     */}
        {/* ===================================================================== */}
        {currentScreen === 'alterar_senha' && (
          <div className="p-6 bg-[#0a0a0e] border border-zinc-850 rounded-3xl max-w-md mx-auto space-y-5">
            <div className="space-y-1 text-center">
              <h3 className="text-sm font-black text-white uppercase font-mono tracking-wider">Alterar Senha da Conta</h3>
              <p className="text-[11px] text-zinc-500">Defina uma senha forte para proteção do seu perfil local.</p>
            </div>

            {passFeedback && (
              <div className={`p-3 rounded-xl border text-xs font-mono ${
                passFeedback.type === 'success' ? 'bg-emerald-950/30 border-emerald-800/40 text-emerald-400' : 'bg-red-950/30 border-red-800/40 text-red-400'
              }`}>
                {passFeedback.msg}
              </div>
            )}

            <div className="space-y-3.5">
              <div className="space-y-1">
                <label className="text-xs font-mono font-bold text-zinc-400">Senha Atual</label>
                <div className="relative">
                  <input
                    type={showCurrPass ? 'text' : 'password'}
                    value={currPassInput}
                    onChange={(e) => setCurrPassInput(e.target.value)}
                    placeholder="••••••••"
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3.5 py-2.5 text-xs text-white font-mono focus:border-orange-500 focus:outline-none"
                  />
                  <button
                    type="button"
                    onClick={() => setShowCurrPass(!showCurrPass)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-300"
                  >
                    {showCurrPass ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-mono font-bold text-zinc-400">Nova Senha</label>
                <div className="relative">
                  <input
                    type={showNewPass ? 'text' : 'password'}
                    value={newPassInput}
                    onChange={(e) => setNewPassInput(e.target.value)}
                    placeholder="Mínimo 4 caracteres"
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3.5 py-2.5 text-xs text-white font-mono focus:border-orange-500 focus:outline-none"
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewPass(!showNewPass)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-300"
                  >
                    {showNewPass ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-mono font-bold text-zinc-400">Confirmar Nova Senha</label>
                <input
                  type="password"
                  value={confirmPassInput}
                  onChange={(e) => setConfirmPassInput(e.target.value)}
                  placeholder="Repita a nova senha"
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3.5 py-2.5 text-xs text-white font-mono focus:border-orange-500 focus:outline-none"
                />
              </div>
            </div>

            <div className="pt-3 flex justify-end gap-3">
              <button
                type="button"
                onClick={handleBack}
                className="px-4 py-2 bg-zinc-900 hover:bg-zinc-800 text-zinc-400 text-xs font-mono font-bold uppercase rounded-xl transition-all"
              >
                Voltar
              </button>
              <button
                type="button"
                onClick={handleChangePassword}
                className="px-5 py-2 bg-orange-500 hover:bg-orange-600 text-black text-xs font-mono font-black uppercase rounded-xl transition-all shadow-md"
              >
                Salvar Senha
              </button>
            </div>
          </div>
        )}

        {/* ===================================================================== */}
        {/* SCREEN 4: APPEARANCE & COLOR SYSTEM                                   */}
        {/* ===================================================================== */}
        {currentScreen === 'exibicao' && (
          <div className="space-y-6">

            {/* Palette Selection Master Card */}
            <div className="p-6 bg-[#0a0a0e] border border-zinc-850 rounded-3xl space-y-5">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-xs font-black uppercase font-mono tracking-wider text-orange-400">
                    Paleta de Cores & Destaque Neon
                  </h3>
                  <p className="text-[11px] text-zinc-500">
                    Selecione a identidade visual do app ou crie uma cor exclusiva.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => setIsColorSchemeModalOpen(true)}
                  className="px-3.5 py-1.5 bg-orange-500/15 hover:bg-orange-500/25 border border-orange-500/30 text-orange-400 text-xs font-mono font-bold rounded-xl transition-all flex items-center gap-1.5 cursor-pointer"
                >
                  <Palette className="h-3.5 w-3.5" />
                  <span>Seletor Avançado</span>
                </button>
              </div>

              {/* Theme Presets Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {THEME_PRESETS.map((preset) => {
                  const isSelected = activeThemePreset === preset.id;
                  return (
                    <button
                      key={preset.id}
                      type="button"
                      onClick={() => handleSelectThemePreset(preset.id)}
                      className={`p-3 rounded-2xl border text-left transition-all duration-200 cursor-pointer relative overflow-hidden group ${
                        isSelected
                          ? 'border-orange-500 bg-orange-500/10 shadow-[0_0_20px_rgba(249,115,22,0.15)]'
                          : 'border-zinc-850 bg-zinc-950/60 hover:border-zinc-700'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <div
                          className="w-5 h-5 rounded-full border border-black/40 shadow-sm"
                          style={{ backgroundColor: preset.primaryHex }}
                        />
                        {isSelected && (
                          <CheckCircle2 className="h-4 w-4 text-orange-400" />
                        )}
                      </div>
                      <span className="text-xs font-bold text-white font-mono block">{preset.name}</span>
                      <span className="text-[10px] text-zinc-500 font-mono block">{preset.primaryHex}</span>
                    </button>
                  );
                })}
              </div>

              {/* Custom Hex Trigger */}
              <div className="flex items-center justify-between p-3.5 bg-zinc-950/60 border border-zinc-900 rounded-2xl">
                <div className="flex items-center gap-3">
                  <div
                    className="w-7 h-7 rounded-xl border border-zinc-700 shadow-inner"
                    style={{ backgroundColor: customThemeHex }}
                  />
                  <div>
                    <h4 className="text-xs font-bold text-zinc-200">Tom Personalizado Ativo</h4>
                    <span className="text-[10px] text-zinc-500 font-mono uppercase">{customThemeHex}</span>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setIsColorSchemeModalOpen(true)}
                  className="px-3 py-1.5 bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-xs font-mono font-semibold rounded-xl text-zinc-300 hover:text-white transition-all cursor-pointer"
                >
                  Editar Tom
                </button>
              </div>
            </div>

            {/* Display & Interface Options */}
            <div className="p-6 bg-[#0a0a0e] border border-zinc-850 rounded-3xl space-y-4">
              <h3 className="text-xs font-black uppercase font-mono tracking-wider text-orange-400">
                Opções de Interface & Transições
              </h3>

              <div className="divide-y divide-zinc-900">
                
                {/* Card Glow Effect */}
                <div className="py-3.5 flex items-center justify-between gap-4">
                  <div>
                    <h4 className="text-xs font-bold text-zinc-200">Efeito Glow Neon nos Cartões</h4>
                    <p className="text-[11px] text-zinc-500">Aplica um reflexo dinâmico de luz nas bordas dos painéis e blocos.</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      const next = !cardGlowEnabled;
                      setCardGlowEnabled(next);
                      localStorage.setItem('mbc_card_glow_enabled', String(next));
                    }}
                    className={`w-12 h-6 rounded-full transition-colors relative cursor-pointer ${
                      cardGlowEnabled ? 'bg-orange-500' : 'bg-zinc-800'
                    }`}
                  >
                    <div className={`w-5 h-5 rounded-full bg-white transition-transform ${
                      cardGlowEnabled ? 'translate-x-6' : 'translate-x-1'
                    }`} />
                  </button>
                </div>

                {/* Mobile Slide Transitions */}
                <div className="py-3.5 flex items-center justify-between gap-4">
                  <div>
                    <h4 className="text-xs font-bold text-zinc-200">Transição por Deslize no Mobile</h4>
                    <p className="text-[11px] text-zinc-500">Animações suaves de slide horizontal ao navegar entre abas em celulares.</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      const next = !mobileSlideTransition;
                      setMobileSlideTransition(next);
                      localStorage.setItem('mbc_mobile_slide_transition', String(next));
                    }}
                    className={`w-12 h-6 rounded-full transition-colors relative cursor-pointer ${
                      mobileSlideTransition ? 'bg-orange-500' : 'bg-zinc-800'
                    }`}
                  >
                    <div className={`w-5 h-5 rounded-full bg-white transition-transform ${
                      mobileSlideTransition ? 'translate-x-6' : 'translate-x-1'
                    }`} />
                  </button>
                </div>

                {/* Mobile Navbar Mode */}
                <div className="py-3.5 flex items-center justify-between gap-4">
                  <div>
                    <h4 className="text-xs font-bold text-zinc-200">Disposição da Barra de Navegação (Mobile)</h4>
                    <p className="text-[11px] text-zinc-500">Escolha entre barra fixa tradicional no rodapé ou formato flutuante.</p>
                  </div>
                  <div className="flex bg-zinc-950 p-1 rounded-xl border border-zinc-800">
                    <button
                      type="button"
                      onClick={() => {
                        setMobileNavbarMode('fixed');
                        localStorage.setItem('mbc_mobile_navbar_mode', 'fixed');
                      }}
                      className={`px-3 py-1 text-xs font-mono font-bold rounded-lg transition-all ${
                        mobileNavbarMode === 'fixed' ? 'bg-orange-500 text-black shadow-sm' : 'text-zinc-500 hover:text-zinc-300'
                      }`}
                    >
                      Fixa
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setMobileNavbarMode('flexible');
                        localStorage.setItem('mbc_mobile_navbar_mode', 'flexible');
                      }}
                      className={`px-3 py-1 text-xs font-mono font-bold rounded-lg transition-all ${
                        mobileNavbarMode === 'flexible' ? 'bg-orange-500 text-black shadow-sm' : 'text-zinc-500 hover:text-zinc-300'
                      }`}
                    >
                      Flutuante
                    </button>
                  </div>
                </div>

                {/* Auto Fullscreen */}
                <div className="py-3.5 flex items-center justify-between gap-4">
                  <div>
                    <h4 className="text-xs font-bold text-zinc-200">Modo Tela Cheia Automático</h4>
                    <p className="text-[11px] text-zinc-500">Solicita imersão em tela cheia ao iniciar a sessão.</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      const next = !autoFullscreen;
                      setAutoFullscreen(next);
                      localStorage.setItem('mbc_auto_fullscreen', String(next));
                    }}
                    className={`w-12 h-6 rounded-full transition-colors relative cursor-pointer ${
                      autoFullscreen ? 'bg-orange-500' : 'bg-zinc-800'
                    }`}
                  >
                    <div className={`w-5 h-5 rounded-full bg-white transition-transform ${
                      autoFullscreen ? 'translate-x-6' : 'translate-x-1'
                    }`} />
                  </button>
                </div>

              </div>
            </div>

            {/* Custom Wallpapers for Lock Screen & Splash */}
            <div className="p-6 bg-[#0a0a0e] border border-zinc-850 rounded-3xl space-y-4">
              <h3 className="text-xs font-black uppercase font-mono tracking-wider text-orange-400">
                Personalização de Papel de Parede (Tela de Bloqueio)
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-xs font-mono font-bold text-zinc-400">Wallpaper Desktop (Horizontal)</label>
                  <input
                    type="text"
                    value={lockScreenDesktopImage}
                    onChange={(e) => {
                      setLockScreenDesktopImage(e.target.value);
                      localStorage.setItem('mbc_lock_bg_desktop', e.target.value);
                    }}
                    placeholder="URL da imagem desktop..."
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-xs text-white font-mono focus:border-orange-500 focus:outline-none"
                  />
                  {lockScreenDesktopImage && (
                    <div className="h-28 rounded-xl overflow-hidden border border-zinc-800">
                      <img src={lockScreenDesktopImage} alt="Lock Desktop Preview" className="w-full h-full object-cover" />
                    </div>
                  )}
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-mono font-bold text-zinc-400">Wallpaper Mobile (Vertical)</label>
                  <input
                    type="text"
                    value={lockScreenMobileImage}
                    onChange={(e) => {
                      setLockScreenMobileImage(e.target.value);
                      localStorage.setItem('mbc_lock_bg_mobile', e.target.value);
                    }}
                    placeholder="URL da imagem mobile..."
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-xs text-white font-mono focus:border-orange-500 focus:outline-none"
                  />
                  {lockScreenMobileImage && (
                    <div className="h-28 rounded-xl overflow-hidden border border-zinc-800">
                      <img src={lockScreenMobileImage} alt="Lock Mobile Preview" className="w-full h-full object-cover" />
                    </div>
                  )}
                </div>
              </div>
            </div>

          </div>
        )}

        {/* ===================================================================== */}
        {/* SCREEN 5: APP LOCK & LOCAL SECURITY                                   */}
        {/* ===================================================================== */}
        {currentScreen === 'seguranca' && (
          <div className="p-6 bg-[#0a0a0e] border border-zinc-850 rounded-3xl space-y-6">
            
            <div className="flex items-start justify-between pb-5 border-b border-zinc-900">
              <div>
                <h3 className="text-xs font-black uppercase font-mono tracking-wider text-orange-400">
                  Bloqueio do Aplicativo
                </h3>
                <p className="text-[11px] text-zinc-500">
                  Proteja seus dados com PIN local e autenticação por biometria (impressão digital).
                </p>
              </div>

              <button
                type="button"
                onClick={() => {
                  if (!appLockPassword && !appLockEnabled) {
                    setShowLockPasswordModal(true);
                    return;
                  }
                  const next = !appLockEnabled;
                  setAppLockEnabled(next);
                  localStorage.setItem('mbc_app_lock_enabled', String(next));
                  if (onLockUpdate) {
                    onLockUpdate({ enabled: next, timeout: appLockTimeout, biometric: appLockBiometricEnabled });
                  }
                }}
                className={`w-12 h-6 rounded-full transition-colors relative cursor-pointer shrink-0 ${
                  appLockEnabled ? 'bg-orange-500' : 'bg-zinc-800'
                }`}
              >
                <div className={`w-5 h-5 rounded-full bg-white transition-transform ${
                  appLockEnabled ? 'translate-x-6' : 'translate-x-1'
                }`} />
              </button>
            </div>

            {/* Lock Details Config */}
            <div className="space-y-4">
              
              {/* PIN / Password configuration */}
              <div className="p-4 bg-zinc-950/60 border border-zinc-900 rounded-2xl flex items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 bg-orange-500/10 rounded-xl text-orange-400">
                    <Lock className="h-4 w-4" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-zinc-200">Senha / PIN de Acesso</h4>
                    <p className="text-[10px] text-zinc-500 font-mono">
                      {appLockPassword ? 'Senha configurada localmente' : 'Nenhuma senha definida'}
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setShowLockPasswordModal(true)}
                  className="px-3.5 py-1.5 bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-xs font-mono font-bold rounded-xl text-zinc-200 hover:text-white transition-all cursor-pointer"
                >
                  {appLockPassword ? 'Alterar PIN' : 'Definir PIN'}
                </button>
              </div>

              {/* Biometric / Fingerprint */}
              <div className="p-4 bg-zinc-950/60 border border-zinc-900 rounded-2xl flex items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 bg-orange-500/10 rounded-xl text-orange-400">
                    <Fingerprint className="h-4 w-4" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="text-xs font-bold text-zinc-200">Desbloqueio por Impressão Digital</h4>
                      <span className="text-[9px] font-mono px-2 py-0.5 rounded-full bg-orange-500/10 text-orange-400 border border-orange-500/20 font-bold">
                        WebAuthn
                      </span>
                    </div>
                    <p className="text-[10px] text-zinc-500 font-mono mt-0.5">
                      {appLockBiometricEnabled ? 'Ativado para o Life Organizer' : 'Toque para autenticar com a digital do dispositivo'}
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={async () => {
                    if (!appLockPassword) {
                      alert('Defina uma senha de bloqueio primeiro antes de ativar a biometria!');
                      return;
                    }
                    const next = !appLockBiometricEnabled;
                    setAppLockBiometricEnabled(next);
                    localStorage.setItem('mbc_app_lock_biometric_enabled', String(next));
                    if (next) {
                      try {
                        await verifyBiometric(userName);
                        showToast('Biometria registrada com sucesso!');
                      } catch (e) {}
                    }
                  }}
                  className={`w-12 h-6 rounded-full transition-colors relative cursor-pointer shrink-0 ${
                    appLockBiometricEnabled ? 'bg-orange-500' : 'bg-zinc-800'
                  }`}
                >
                  <div className={`w-5 h-5 rounded-full bg-white transition-transform ${
                    appLockBiometricEnabled ? 'translate-x-6' : 'translate-x-1'
                  }`} />
                </button>
              </div>

              {/* Auto Lock Timeout */}
              <div className="p-4 bg-zinc-950/60 border border-zinc-900 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 bg-orange-500/10 rounded-xl text-orange-400">
                    <Clock className="h-4 w-4" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-zinc-200">Tempo de Bloqueio Automático</h4>
                    <p className="text-[10px] text-zinc-500 font-mono">Bloquear após inatividade ou aba fechada.</p>
                  </div>
                </div>

                <select
                  value={appLockTimeout}
                  onChange={(e) => {
                    const val = parseInt(e.target.value, 10);
                    setAppLockTimeout(val);
                    localStorage.setItem('mbc_app_lock_timeout', String(val));
                  }}
                  className="bg-zinc-900 border border-zinc-800 rounded-xl px-3 py-1.5 text-xs text-zinc-200 font-mono focus:border-orange-500 focus:outline-none cursor-pointer"
                >
                  <option value={0}>Imediato (ao sair da aba)</option>
                  <option value={60}>1 minuto</option>
                  <option value={300}>5 minutos</option>
                  <option value={900}>15 minutos</option>
                  <option value={1800}>30 minutos</option>
                  <option value={-1}>Desativado (somente manual)</option>
                </select>
              </div>

            </div>

            {/* Set Lock Password Modal */}
            <AnimatePresence>
              {showLockPasswordModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
                  <motion.div
                    initial={{ scale: 0.95, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0.95, opacity: 0 }}
                    className="w-full max-w-sm bg-[#0a0a0d] border border-zinc-800 rounded-3xl p-6 space-y-4 shadow-2xl"
                  >
                    <div className="flex items-center justify-between border-b border-zinc-900 pb-3">
                      <h4 className="text-xs font-black uppercase font-mono text-zinc-200">Definir Senha de Bloqueio</h4>
                      <button onClick={() => setShowLockPasswordModal(false)} className="text-zinc-500 hover:text-white">
                        <X className="h-4 w-4" />
                      </button>
                    </div>

                    {lockPassFeedback && (
                      <p className="text-xs text-red-400 font-mono bg-red-950/30 p-2.5 rounded-xl border border-red-900/30">
                        {lockPassFeedback}
                      </p>
                    )}

                    <div className="space-y-3">
                      <div className="space-y-1">
                        <label className="text-xs font-mono font-bold text-zinc-400">Nova Senha / PIN</label>
                        <input
                          type="password"
                          value={newLockPassInput}
                          onChange={(e) => setNewLockPassInput(e.target.value)}
                          placeholder="Mínimo 4 dígitos"
                          className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-xs text-white font-mono focus:border-orange-500 focus:outline-none"
                        />
                      </div>

                      <div className="space-y-1">
                        <label className="text-xs font-mono font-bold text-zinc-400">Confirmar Senha</label>
                        <input
                          type="password"
                          value={confirmLockPassInput}
                          onChange={(e) => setConfirmLockPassInput(e.target.value)}
                          placeholder="Repita a senha"
                          className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-xs text-white font-mono focus:border-orange-500 focus:outline-none"
                        />
                      </div>
                    </div>

                    <div className="pt-2 flex justify-end gap-2.5">
                      <button
                        type="button"
                        onClick={() => setShowLockPasswordModal(false)}
                        className="px-3.5 py-1.5 bg-zinc-900 hover:bg-zinc-800 text-zinc-400 text-xs font-mono rounded-xl"
                      >
                        Cancelar
                      </button>
                      <button
                        type="button"
                        onClick={handleSaveLockPassword}
                        className="px-4 py-1.5 bg-orange-500 hover:bg-orange-600 text-black text-xs font-mono font-black rounded-xl shadow-md"
                      >
                        Salvar PIN
                      </button>
                    </div>
                  </motion.div>
                </div>
              )}
            </AnimatePresence>

          </div>
        )}

        {/* ===================================================================== */}
        {/* SCREEN 6: NOTIFICATIONS & REMINDERS                                   */}
        {/* ===================================================================== */}
        {currentScreen === 'notificacoes' && (
          <div className="space-y-6">

            {/* Master Card: PWA & System Notifications */}
            <div className="p-6 bg-orange-950/20 border border-orange-500/30 rounded-3xl space-y-4">
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="text-xs font-bold text-orange-400 flex items-center gap-2">
                    <Bell className="h-4 w-4 text-orange-400 animate-pulse" />
                    Notificações do Sistema & Segundo Plano (PWA)
                  </h3>
                  <p className="text-[11px] text-zinc-400 mt-1 leading-relaxed">
                    Permite que os alarmes, timers e lembretes do Life Organizer apareçam diretamente na central de notificações do sistema operacional (Windows, Android, iOS, macOS), mesmo com a aba fechada.
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
                          body: 'O Life Organizer enviará seus alertas e alarmes em segundo plano.',
                          tag: 'life-organizer-perm-test'
                        });
                        showToast('Notificações ativadas no sistema!');
                      } else {
                        alert('Permissão de notificação negada ou bloqueada no navegador.');
                      }
                    }}
                    className="px-3.5 py-1.5 bg-orange-500 hover:bg-orange-600 text-black text-xs font-bold rounded-xl transition-all shadow-md flex items-center gap-1.5 cursor-pointer"
                  >
                    <CheckCircle className="h-3.5 w-3.5" />
                    Ativar Notificações
                  </button>

                  <button
                    type="button"
                    onClick={handleTestNotification}
                    className="px-3.5 py-1.5 bg-zinc-900 hover:bg-zinc-800 text-zinc-300 border border-zinc-700 text-xs font-semibold rounded-xl transition-all cursor-pointer"
                  >
                    ⚡ Testar Disparo
                  </button>
                </div>

                <div className="flex items-center gap-3">
                  <span className="text-[10px] font-mono font-bold text-orange-300 uppercase">
                    Segundo Plano ({backgroundNotificationsEnabled ? 'Ativado' : 'Desativado'})
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      const next = !backgroundNotificationsEnabled;
                      setBackgroundNotificationsEnabled(next);
                      localStorage.setItem('mbc_background_notifications_enabled', String(next));
                    }}
                    className={`w-12 h-6 rounded-full transition-colors relative cursor-pointer ${
                      backgroundNotificationsEnabled ? 'bg-orange-500' : 'bg-zinc-800'
                    }`}
                  >
                    <div className={`w-5 h-5 rounded-full bg-white transition-transform ${
                      backgroundNotificationsEnabled ? 'translate-x-6' : 'translate-x-1'
                    }`} />
                  </button>
                </div>
              </div>
            </div>

            {/* Cycles: Weekly and Monthly Review Reminders */}
            <div className="p-6 bg-[#0a0a0e] border border-zinc-850 rounded-3xl space-y-4">
              <h3 className="text-xs font-black uppercase font-mono tracking-wider text-orange-400">
                Ciclos de Avaliação (Reviews)
              </h3>

              <div className="divide-y divide-zinc-900">
                {/* Weekly Review */}
                <div className="py-3.5 flex items-center justify-between gap-4">
                  <div>
                    <h4 className="text-xs font-bold text-zinc-200">Ciclo Semanal</h4>
                    <p className="text-[11px] text-zinc-500 font-mono mt-0.5">
                      Toda {getWeeklyReviewDayLabel(reviewSettings.weekly.dayOfWeek)} às {reviewSettings.weekly.time}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setReviewModalInitialTab('weekly');
                      setReviewReminderModalOpen(true);
                    }}
                    className="px-3 py-1.5 bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-xs font-mono font-bold rounded-xl text-zinc-300 hover:text-white transition-all cursor-pointer"
                  >
                    Configurar Dia
                  </button>
                </div>

                {/* Monthly Review */}
                <div className="py-3.5 flex items-center justify-between gap-4">
                  <div>
                    <h4 className="text-xs font-bold text-zinc-200">Ciclo Mensal</h4>
                    <p className="text-[11px] text-zinc-500 font-mono mt-0.5">
                      {getMonthlyReviewTimingLabel(reviewSettings.monthly)} às {reviewSettings.monthly.time}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setReviewModalInitialTab('monthly');
                      setReviewReminderModalOpen(true);
                    }}
                    className="px-3 py-1.5 bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-xs font-mono font-bold rounded-xl text-zinc-300 hover:text-white transition-all cursor-pointer"
                  >
                    Configurar Momento
                  </button>
                </div>

                {/* Daily Workspace Reminder */}
                <div className="py-3.5 flex items-center justify-between gap-4">
                  <div>
                    <h4 className="text-xs font-bold text-zinc-200">Lembrete do Espaço Diário ("Meu Dia")</h4>
                    <p className="text-[11px] text-zinc-500">Notificação noturna para registro de gratidão, reflexão e saúde.</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <input
                      type="time"
                      value={dailyWorkspaceTime}
                      onChange={(e) => {
                        setDailyWorkspaceTime(e.target.value);
                        localStorage.setItem('mbc_daily_workspace_reminder_time', e.target.value);
                      }}
                      className="bg-zinc-900 border border-zinc-800 rounded-xl px-2.5 py-1 text-xs text-zinc-300 font-mono focus:outline-none"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        const next = !dailyWorkspaceNotifEnabled;
                        setDailyWorkspaceNotifEnabled(next);
                        localStorage.setItem('mbc_daily_workspace_notif_enabled', String(next));
                      }}
                      className={`w-11 h-5 rounded-full transition-colors relative cursor-pointer ${
                        dailyWorkspaceNotifEnabled ? 'bg-orange-500' : 'bg-zinc-800'
                      }`}
                    >
                      <div className={`w-4 h-4 rounded-full bg-white transition-transform ${
                        dailyWorkspaceNotifEnabled ? 'translate-x-6' : 'translate-x-1'
                      }`} />
                    </button>
                  </div>
                </div>

              </div>
            </div>

          </div>
        )}

        {/* ===================================================================== */}
        {/* SCREEN 7: DATABASE & CLOUD SYNC (PLACEHOLDER MODE)                    */}
        {/* ===================================================================== */}
        {currentScreen === 'banco_dados_nuvem' && (
          <div className="space-y-6">

            {/* Placeholder Status Banner */}
            <div className="p-6 bg-[#0a0a0e] border border-orange-500/30 rounded-3xl space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-3 bg-orange-500/10 border border-orange-500/30 rounded-2xl text-orange-400">
                    <Cloud className="h-6 w-6" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-sm font-bold text-white font-mono uppercase">
                        Sincronização em Nuvem (Modo Placeholder)
                      </h3>
                      <span className="text-[9px] font-mono px-2 py-0.5 rounded-full bg-orange-500/15 text-orange-400 border border-orange-500/30 font-bold uppercase">
                        Local Soberano
                      </span>
                    </div>
                    <p className="text-xs text-zinc-400 mt-0.5">
                      Este módulo standalone está configurado para operar com armazenamento 100% local e seguro. As chamadas de nuvem estão simuladas em placeholder.
                    </p>
                  </div>
                </div>
              </div>

              {cloudToast && (
                <div className="p-3 bg-zinc-950 border border-orange-500/30 rounded-2xl text-xs text-orange-300 font-mono leading-relaxed">
                  ℹ️ {cloudToast.message}
                </div>
              )}

              {/* Provider Selection (Visual Placeholder) */}
              <div className="pt-2 space-y-2">
                <label className="text-xs font-mono font-bold text-zinc-400 uppercase">Provedor de Nuvem Simulado</label>
                <div className="grid grid-cols-3 gap-2.5">
                  {[
                    { id: 'supabase', name: 'Supabase (PostgreSQL)' },
                    { id: 'firebase', name: 'Firebase Firestore' },
                    { id: 'cloudsql', name: 'Google Cloud SQL' }
                  ].map((prov) => (
                    <button
                      key={prov.id}
                      type="button"
                      onClick={() => setCloudProvider(prov.id as any)}
                      className={`p-3 rounded-2xl border text-xs font-mono font-bold transition-all text-center ${
                        cloudProvider === prov.id
                          ? 'border-orange-500 bg-orange-500/10 text-orange-300 shadow-sm'
                          : 'border-zinc-800 bg-zinc-950/60 text-zinc-400 hover:border-zinc-700'
                      }`}
                    >
                      {prov.name}
                    </button>
                  ))}
                </div>
              </div>

              {/* Simulated Cloud Credentials Fields */}
              <div className="space-y-3 pt-2">
                <div className="space-y-1">
                  <label className="text-xs font-mono font-bold text-zinc-400">URL do Projeto / Endpoint</label>
                  <input
                    type="text"
                    value={placeholderProjectUrl}
                    onChange={(e) => setPlaceholderProjectUrl(e.target.value)}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-xs text-zinc-300 font-mono focus:outline-none"
                    placeholder="https://sua-instancia.supabase.co"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-mono font-bold text-zinc-400">Chave de Sincronização (Placeholder Key)</label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={placeholderSyncKey}
                      onChange={(e) => {
                        setPlaceholderSyncKey(e.target.value);
                        localStorage.setItem('mbc_placeholder_sync_key', e.target.value);
                      }}
                      className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-xs text-zinc-300 font-mono focus:outline-none"
                      placeholder="Chave alfanumérica..."
                    />
                    <button
                      type="button"
                      onClick={() => {
                        const rand = 'life-org-' + Math.random().toString(36).substring(2, 9);
                        setPlaceholderSyncKey(rand);
                        localStorage.setItem('mbc_placeholder_sync_key', rand);
                        showToast('Nova chave placeholder gerada!');
                      }}
                      className="px-3 py-2 bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-xs font-mono font-semibold rounded-xl text-zinc-300 shrink-0 cursor-pointer"
                    >
                      Gerar
                    </button>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="pt-3 flex flex-wrap gap-2.5">
                <button
                  type="button"
                  disabled={isSimulatingSync}
                  onClick={handleSimulateCloudConnect}
                  className="px-4 py-2 bg-orange-500 hover:bg-orange-600 disabled:opacity-50 text-black text-xs font-mono font-bold rounded-xl transition-all shadow-md flex items-center gap-1.5 cursor-pointer"
                >
                  <RefreshCw className={`h-3.5 w-3.5 ${isSimulatingSync ? 'animate-spin' : ''}`} />
                  <span>{isSimulatingSync ? 'Testando Conexão...' : 'Testar Conexão (Simulado)'}</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    navigator.clipboard.writeText(placeholderSyncKey);
                    showToast('Chave de sincronização copiada!');
                  }}
                  className="px-3.5 py-2 bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-zinc-300 text-xs font-mono rounded-xl flex items-center gap-1.5 cursor-pointer"
                >
                  <Copy className="h-3.5 w-3.5 text-orange-400" />
                  <span>Copiar Chave</span>
                </button>
              </div>

            </div>

            {/* Offline Mutation Queue Card */}
            <div className="p-5 bg-zinc-950/60 border border-zinc-900 rounded-3xl flex items-center justify-between">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <h4 className="text-xs font-bold text-zinc-200">Fila de Mutações Offline</h4>
                  <span className="text-[9px] font-mono px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-bold">
                    0 Pendências
                  </span>
                </div>
                <p className="text-[11px] text-zinc-500 font-mono">
                  Todas as alterações locais estão consolidadas no dispositivo.
                </p>
              </div>

              <button
                type="button"
                onClick={() => showToast('Fila vazia. Todas as gravações locais foram gravadas!')}
                className="px-3.5 py-1.5 bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-xs font-mono text-zinc-300 rounded-xl cursor-pointer"
              >
                Limpar Fila
              </button>
            </div>

          </div>
        )}

        {/* ===================================================================== */}
        {/* SCREEN 8: CONNECTED DEVICES                                           */}
        {/* ===================================================================== */}
        {currentScreen === 'dispositivos_conectados' && (
          <div className="p-6 bg-[#0a0a0e] border border-zinc-850 rounded-3xl space-y-5">
            <div>
              <h3 className="text-xs font-black uppercase font-mono tracking-wider text-orange-400">
                Sessões & Dispositivos Ativos
              </h3>
              <p className="text-[11px] text-zinc-500">
                Gerencie os dispositivos autorizados a acessar sua conta local.
              </p>
            </div>

            <div className="space-y-3">
              {connectedDevices.map((dev) => (
                <div
                  key={dev.id}
                  className="p-4 bg-zinc-950/60 border border-zinc-900 rounded-2xl flex items-center justify-between gap-4"
                >
                  <div className="flex items-center gap-3.5">
                    <div className="p-2.5 bg-zinc-900 border border-zinc-800 rounded-xl text-orange-400">
                      {dev.deviceType === 'mobile' ? <Smartphone className="h-4 w-4" /> : <Laptop className="h-4 w-4" />}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="text-xs font-bold text-white">{dev.name}</h4>
                        {dev.isCurrent && (
                          <span className="text-[9px] font-mono px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-bold">
                            Este Dispositivo
                          </span>
                        )}
                      </div>
                      <p className="text-[10px] text-zinc-500 font-mono mt-0.5">
                        {dev.os} • {dev.browser} • IP: {dev.ip}
                      </p>
                    </div>
                  </div>

                  {!dev.isCurrent && (
                    <button
                      type="button"
                      onClick={() => {
                        setConnectedDevices(prev => prev.filter(d => d.id !== dev.id));
                        showToast('Dispositivo desconectado!');
                      }}
                      className="p-2 text-zinc-500 hover:text-red-400 rounded-xl hover:bg-zinc-900 transition-colors"
                      title="Desconectar"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ===================================================================== */}
        {/* SCREEN 9: TECH STACK & ARCHITECTURE                                   */}
        {/* ===================================================================== */}
        {currentScreen === 'stack_info' && (
          <div className="space-y-6">

            {/* Overview Hero Card */}
            <div className="p-6 bg-[#0a0a0e] border border-orange-500/30 rounded-3xl space-y-4 shadow-xl">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div className="flex items-center gap-3.5">
                  <div className="p-3.5 bg-orange-500/10 border border-orange-500/30 rounded-2xl text-orange-400">
                    <Cpu className="h-6 w-6" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="text-sm font-black text-white uppercase font-mono tracking-wider">
                        Stack Tecnológica & Arquitetura
                      </h3>
                      <span className="text-[9px] font-mono px-2 py-0.5 rounded-full bg-orange-500/15 text-orange-400 border border-orange-500/30 font-bold uppercase">
                        PROD READY
                      </span>
                    </div>
                    <p className="text-xs text-zinc-400 mt-1 leading-relaxed">
                      Construído com as mais recentes especificações da web moderna: React 19, TypeScript estrito, compilação instantânea com Vite 6, motor atômico Tailwind CSS v4 e suporte nativo a PWA e Capacitor.
                    </p>
                  </div>
                </div>
              </div>

              {/* Quick Metrics Bar */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 pt-3 border-t border-zinc-900">
                <div className="p-3 bg-zinc-950/70 border border-zinc-900 rounded-2xl">
                  <span className="text-[10px] text-zinc-500 font-mono block uppercase">Frontend Core</span>
                  <span className="text-xs font-black text-white font-mono">React 19 + TS 5.8</span>
                </div>
                <div className="p-3 bg-zinc-950/70 border border-zinc-900 rounded-2xl">
                  <span className="text-[10px] text-zinc-500 font-mono block uppercase">Build Pipeline</span>
                  <span className="text-xs font-black text-white font-mono">Vite 6 + Esbuild</span>
                </div>
                <div className="p-3 bg-zinc-950/70 border border-zinc-900 rounded-2xl">
                  <span className="text-[10px] text-zinc-500 font-mono block uppercase">Design Engine</span>
                  <span className="text-xs font-black text-white font-mono">Tailwind v4 + Motion</span>
                </div>
                <div className="p-3 bg-zinc-950/70 border border-zinc-900 rounded-2xl">
                  <span className="text-[10px] text-zinc-500 font-mono block uppercase">Runtime & Storage</span>
                  <span className="text-xs font-black text-white font-mono">PWA + IndexedDB</span>
                </div>
              </div>
            </div>

            {/* Detailed Layers Grid */}
            <div className="grid grid-cols-1 gap-4">

              {/* Layer 1: Core Framework & Linguagem */}
              <div className="p-5 bg-[#0a0a0e] border border-zinc-850 rounded-3xl space-y-3">
                <div className="flex items-center gap-2.5 text-orange-400">
                  <Code className="h-4 w-4" />
                  <h4 className="text-xs font-bold uppercase tracking-wider font-mono text-white">
                    1. Core Framework & Linguagem
                  </h4>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="p-3.5 bg-zinc-950/60 border border-zinc-900 rounded-2xl space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-zinc-200">React</span>
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-zinc-900 text-orange-400 border border-zinc-800 font-bold">v19.0.1</span>
                    </div>
                    <p className="text-[11px] text-zinc-400 leading-snug">
                      Arquitetura moderna com Actions, use hook, concorrência nativa e otimizações de reconciliação.
                    </p>
                  </div>

                  <div className="p-3.5 bg-zinc-950/60 border border-zinc-900 rounded-2xl space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-zinc-200">TypeScript</span>
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-zinc-900 text-orange-400 border border-zinc-800 font-bold">v5.8.2</span>
                    </div>
                    <p className="text-[11px] text-zinc-400 leading-snug">
                      Tipagem estática ponta a ponta (`strict: true`), interfaces desacopladas e contratos seguros de dados.
                    </p>
                  </div>

                  <div className="p-3.5 bg-zinc-950/60 border border-zinc-900 rounded-2xl space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-zinc-200">Vite & Esbuild</span>
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-zinc-900 text-orange-400 border border-zinc-800 font-bold">v6.2.3</span>
                    </div>
                    <p className="text-[11px] text-zinc-400 leading-snug">
                      Bundler ESM ultra-rápido, Hot Module Replacement instantâneo e compilação de produção otimizada.
                    </p>
                  </div>
                </div>
              </div>

              {/* Layer 2: Estilização, Animações & HUD UI */}
              <div className="p-5 bg-[#0a0a0e] border border-zinc-850 rounded-3xl space-y-3">
                <div className="flex items-center gap-2.5 text-orange-400">
                  <Palette className="h-4 w-4" />
                  <h4 className="text-xs font-bold uppercase tracking-wider font-mono text-white">
                    2. Estilização, Animações & HUD UI
                  </h4>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="p-3.5 bg-zinc-950/60 border border-zinc-900 rounded-2xl space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-zinc-200">Tailwind CSS v4</span>
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-zinc-900 text-orange-400 border border-zinc-800 font-bold">v4.1.14</span>
                    </div>
                    <p className="text-[11px] text-zinc-400 leading-snug">
                      Nova arquitetura via `@tailwindcss/vite`, sem arquivos de configuração JS legados e CSS variables dinâmicas.
                    </p>
                  </div>

                  <div className="p-3.5 bg-zinc-950/60 border border-zinc-900 rounded-2xl space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-zinc-200">Motion (Framer)</span>
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-zinc-900 text-orange-400 border border-zinc-800 font-bold">v12.23.24</span>
                    </div>
                    <p className="text-[11px] text-zinc-400 leading-snug">
                      Física de animação real, gestos de swipe mobile em abas e transições com AnimatePresence.
                    </p>
                  </div>

                  <div className="p-3.5 bg-zinc-950/60 border border-zinc-900 rounded-2xl space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-zinc-200">Lucide React</span>
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-zinc-900 text-orange-400 border border-zinc-800 font-bold">v0.546.0</span>
                    </div>
                    <p className="text-[11px] text-zinc-400 leading-snug">
                      Biblioteca consistente de ícones vetoriais otimizados para HUD cyberpunk e dashboards escuros.
                    </p>
                  </div>
                </div>
              </div>

              {/* Layer 3: Armazenamento Local, Fila Offline & Segurança */}
              <div className="p-5 bg-[#0a0a0e] border border-zinc-850 rounded-3xl space-y-3">
                <div className="flex items-center gap-2.5 text-orange-400">
                  <ShieldCheck className="h-4 w-4" />
                  <h4 className="text-xs font-bold uppercase tracking-wider font-mono text-white">
                    3. Persistência Offline, Criptografia & Biometria
                  </h4>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="p-3.5 bg-zinc-950/60 border border-zinc-900 rounded-2xl space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-zinc-200">IndexedDB & Queue</span>
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-zinc-900 text-orange-400 border border-zinc-800 font-bold">Offline-First</span>
                    </div>
                    <p className="text-[11px] text-zinc-400 leading-snug">
                      Fila transacional assíncrona para gravações locais sem perdas de dados e sincronização posterior.
                    </p>
                  </div>

                  <div className="p-3.5 bg-zinc-950/60 border border-zinc-900 rounded-2xl space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-zinc-200">WebAuthn API</span>
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-zinc-900 text-orange-400 border border-zinc-800 font-bold">Biometria</span>
                    </div>
                    <p className="text-[11px] text-zinc-400 leading-snug">
                      Desbloqueio com impressão digital, Touch ID ou Windows Hello via hardware platform authenticator.
                    </p>
                  </div>

                  <div className="p-3.5 bg-zinc-950/60 border border-zinc-900 rounded-2xl space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-zinc-200">Web Crypto API</span>
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-zinc-900 text-orange-400 border border-zinc-800 font-bold">SHA-256</span>
                    </div>
                    <p className="text-[11px] text-zinc-400 leading-snug">
                      Criptografia nativa no navegador para geração de hashes, desafios e blindagem de senhas locais.
                    </p>
                  </div>
                </div>
              </div>

              {/* Layer 4: Mobile, PWA & Servidor Backend */}
              <div className="p-5 bg-[#0a0a0e] border border-zinc-850 rounded-3xl space-y-3">
                <div className="flex items-center gap-2.5 text-orange-400">
                  <Smartphone className="h-4 w-4" />
                  <h4 className="text-xs font-bold uppercase tracking-wider font-mono text-white">
                    4. Mobile, PWA & Servidor Node.js
                  </h4>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="p-3.5 bg-zinc-950/60 border border-zinc-900 rounded-2xl space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-zinc-200">PWA & Service Worker</span>
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-zinc-900 text-orange-400 border border-zinc-800 font-bold">v7 Cache</span>
                    </div>
                    <p className="text-[11px] text-zinc-400 leading-snug">
                      Instalação como aplicativo nativo, alarmes em segundo plano via TimestampTrigger e push.
                    </p>
                  </div>

                  <div className="p-3.5 bg-zinc-950/60 border border-zinc-900 rounded-2xl space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-zinc-200">Capacitor Android</span>
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-zinc-900 text-orange-400 border border-zinc-800 font-bold">v8.5.0</span>
                    </div>
                    <p className="text-[11px] text-zinc-400 leading-snug">
                      Build bridge nativa para compilação Android APK/Bundle através do `@capacitor/android`.
                    </p>
                  </div>

                  <div className="p-3.5 bg-zinc-950/60 border border-zinc-900 rounded-2xl space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-zinc-200">Node.js + Express</span>
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-zinc-900 text-orange-400 border border-zinc-800 font-bold">TSX + 4.21</span>
                    </div>
                    <p className="text-[11px] text-zinc-400 leading-snug">
                      Servidor de desenvolvimento e produção com compressão gzip, rotas de push e proxy.
                    </p>
                  </div>
                </div>
              </div>

              {/* Layer 5: Nuvem & Inteligência Artificial (Preparado / Placeholder) */}
              <div className="p-5 bg-[#0a0a0e] border border-zinc-850 rounded-3xl space-y-3">
                <div className="flex items-center gap-2.5 text-orange-400">
                  <Cloud className="h-4 w-4" />
                  <h4 className="text-xs font-bold uppercase tracking-wider font-mono text-white">
                    5. Nuvem & Inteligência Artificial (Módulos Integrados / Placeholder)
                  </h4>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="p-3.5 bg-zinc-950/60 border border-zinc-900 rounded-2xl space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-zinc-200">Google GenAI SDK</span>
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-zinc-900 text-orange-400 border border-zinc-800 font-bold">v2.4.0</span>
                    </div>
                    <p className="text-[11px] text-zinc-400 leading-snug">
                      Integração oficial com a família de modelos Gemini para funcionalidades inteligentes no servidor.
                    </p>
                  </div>

                  <div className="p-3.5 bg-zinc-950/60 border border-zinc-900 rounded-2xl space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-zinc-200">Supabase JS</span>
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-zinc-900 text-orange-400 border border-zinc-800 font-bold">v2.110.8</span>
                    </div>
                    <p className="text-[11px] text-zinc-400 leading-snug">
                      Cliente para PostgreSQL e Realtime (neste componente standalone, executado em modo simulado).
                    </p>
                  </div>

                  <div className="p-3.5 bg-zinc-950/60 border border-zinc-900 rounded-2xl space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-zinc-200">Web Push</span>
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-zinc-900 text-orange-400 border border-zinc-800 font-bold">v3.6.7</span>
                    </div>
                    <p className="text-[11px] text-zinc-400 leading-snug">
                      Envio padronizado de payloads encriptados com VAPID para notificações em background.
                    </p>
                  </div>
                </div>
              </div>

            </div>

          </div>
        )}

      </div>

      {/* Global Color Scheme Picker Modal */}
      <ColorSchemeModal
        isOpen={isColorSchemeModalOpen}
        onClose={() => setIsColorSchemeModalOpen(false)}
        activePresetId={activeThemePreset}
        customHex={customThemeHex}
        onSelectPreset={(presetId, hex) => {
          handleSelectThemePreset(presetId, hex);
        }}
      />

      {/* Review Reminder Configuration Modal */}
      <ReviewReminderModal
        isOpen={reviewReminderModalOpen}
        onClose={() => {
          setReviewReminderModalOpen(false);
          setReviewSettings(getReviewRemindersSettings());
        }}
        initialTab={reviewModalInitialTab}
      />

    </div>
  );
}

export { SettingsStandalone };
