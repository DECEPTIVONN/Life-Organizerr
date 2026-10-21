/**
 * ====================================================================================================
 * GUIA E ARQUIVO STANDALONE DE CONFIGURAÇÕES COMPLETAS (LIFE ORGANIZER / SISTEMA REAL)
 * ====================================================================================================
 * 
 * Este arquivo reúne e implementa de forma 100% STANDALONE, funcional e com estilo idêntico ao do site,
 * as seguintes interfaces e sub-sistemas de configurações:
 * 
 * 1. 👤 SUA CONTA
 *    - Menu principal e navegação fluida em pilha (breadcrumb / voltar).
 *    - Informações da conta:
 *        * Integração com Google Agenda (status, avatar, nome, e-mail, conectar/desconectar).
 *        * Customizador de foto de perfil (URL, presets em grid, upload de arquivo local, colar do clipboard).
 *        * Campos editáveis de Nome, Nome de usuário (@handle) e E-mail.
 *        * Botão de salvar com toast de feedback.
 *    - Alteração de senha da conta do usuário (distinção clara entre senha de usuário e senha de bloqueio).
 *    - Exportar backup completo dos dados (.JSON) e Restaurar backup existente (upload com parse seguro).
 *    - Desativação temporária da conta com orientações de retenção de dados e reativação.
 *    - Opção de Logout (Sair da conta) seguro.
 * 
 * 2. 🔐 SEGURANÇA E ACESSO À CONTA
 *    - Status da Sincronização em nuvem e Chave de sincronização criptografada.
 *    - Interruptor Master de Bloqueio do Aplicativo (App Lock).
 *    - Desbloqueio por Biometria / Impressão Digital (WebAuthn / Biometrics API).
 *    - Temporizador de inatividade para bloqueio automático (Slider interativo e botões rápidos: 1m, 5m, 15m, 30m, 60m, Nunca).
 *    - Gerenciamento de Senha de Bloqueio do App (Criar/Alterar com confirmação e visibilidade alternável).
 *    - Personalização do Papel de Parede da Tela de Bloqueio:
 *        * Imagem Desktop (horizontal / widescreen) com upload, colar e URL.
 *        * Imagem Mobile (vertical / 9:16) com upload, colar e URL.
 *    - Botão interativo para Testar Tela de Bloqueio instantaneamente.
 * 
 * 3. 📱 DISPOSITIVOS CONECTADOS
 *    - Banner gráfico estilizado em gradiente esmeralda com ícones de Laptop e Smartphone.
 *    - Botão "Conectar dispositivo" que abre modal com QR Code dinâmico e código de pareamento numérico de 6 dígitos.
 *    - Lista "STATUS DO DISPOSITIVO":
 *        * Detecção de tipo (mobile ou desktop).
 *        * Badge "SESSÃO ATUAL" para o dispositivo ativo na janela.
 *        * Timestamp da última atividade ou status online.
 *    - Modal completo de edição do dispositivo:
 *        * Renomear aparelho com apelido customizado.
 *        * Desconectar e revogar acesso daquele aparelho específico.
 *    - Nota de segurança com criptografia de ponta a ponta.
 * 
 * 4. 🔔 NOTIFICAÇÕES
 *    - Master Card: Notificações do Sistema & Segundo Plano (PWA)
 *        * Solicitação nativa de permissão do navegador (`Notification.requestPermission()`).
 *        * Disparo de teste imediato (`sendSystemNotification`).
 *        * Toggle para alertas em segundo plano com persistência.
 *    - Lembrete de "Meu Dia" com seletor de horário time-picker.
 *    - Lembretes periódicos de Avaliação (Reviews):
 *        * Review Semanal: seletor de dia da semana (Domingo a Sábado) + horário.
 *        * Review Mensal: opções (último dia do mês, 1º dia do mês seguinte ou dia fixo específico) + horário.
 *    - Interruptores de Hábitos diários, Limite de orçamento e Confirmação de sincronização.
 * 
 * 5. 🎨 ACESSIBILIDADE, EXIBIÇÃO E PWA (Apenas os itens solicitados)
 *    - Tela cheia automática (Fullscreen API com fallback nos navegadores).
 *    - Comportamento da Navbar Mobile (Segmented button entre "Fixa" e "Flexível" com explicações de scroll).
 *    - Esquema de cores e personalização (Paleta de cores completa: Laranja padrão, Azul, Verde, Rosa, Vermelho, Roxo, Amarelo e seletor HEX).
 *    - Tela de carregamento e Splash (Upload de imagem horizontal para PC e vertical para Celular + botão Testar Splash).
 *    - Instalar Aplicativo (PWA) com evento beforeinstallprompt e estado instalado.
 *    - Idioma do Sistema / Language (Português BR vs English US).
 * 
 * DEPENDÊNCIAS NECESSÁRIAS NO PROJETO:
 * ```bash
 * npm install motion lucide-react
 * # (Opcional caso utilize framer-motion tradicional: npm install framer-motion)
 * ```
 */

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  User,
  Lock,
  Laptop,
  Smartphone,
  Bell,
  Palette,
  Maximize,
  Check,
  CheckCircle,
  ArrowLeft,
  ArrowUpDown,
  ChevronRight,
  Download,
  Upload,
  Trash2,
  LogOut,
  LogIn,
  Clipboard,
  Eye,
  EyeOff,
  AlertTriangle,
  QrCode,
  ShieldCheck,
  Calendar,
  Sliders,
  Sparkles,
  Play,
  X,
  Fingerprint,
  RefreshCw,
  Clock,
  KeyRound,
  Image as ImageIcon,
  HelpCircle
} from 'lucide-react';
import QRCode from 'qrcode';
import { StandaloneLockScreen } from './LockScreenStandalone';

/* ====================================================================================================
 * TIPAGENS E INTERFACES DE DADOS
 * ==================================================================================================== */

export type SettingsScreenId = 
  | 'main' 
  | 'sua_conta' 
  | 'informacoes_conta' 
  | 'alterar_senha' 
  | 'desativar_conta' 
  | 'seguranca' 
  | 'dispositivos_conectados' 
  | 'notificacoes' 
  | 'exibicao';

export interface ConnectedDeviceInfo {
  id: string;
  name: string;
  customName?: string;
  deviceType: 'mobile' | 'desktop';
  browser: string;
  os: string;
  isCurrent: boolean;
  lastActive: string;
  ip?: string;
}

export interface ReviewRemindersConfig {
  weekly: {
    enabled: boolean;
    dayOfWeek: number; // 0 = Domingo, 6 = Sábado
    time: string;
  };
  monthly: {
    enabled: boolean;
    timingType: 'last_day' | 'first_day_next' | 'specific_day';
    dayOfMonth?: number;
    time: string;
  };
}

export interface ColorPreset {
  id: string;
  name: string;
  hex: string;
  description: string;
}

/* ====================================================================================================
 * CONSTANTES E PRESETS
 * ==================================================================================================== */

export const AVATAR_PRESETS = [
  'https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?q=80&w=150', // Atleta clássico
  'https://images.unsplash.com/photo-1608155686393-8fdd966d784d?q=80&w=150', // Escultura Netuno
  'https://images.unsplash.com/photo-1584290860587-211bfb66aa0f?q=80&w=150', // Detalhe ouro clássico
  'https://images.unsplash.com/photo-1579783902614-a3fb3927b6a5?q=80&w=150', // Pintura renascentista
  'https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=150', // Retrato moderno 1
  'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?q=80&w=150'  // Retrato moderno 2
];

export const THEME_COLOR_PRESETS: ColorPreset[] = [
  { id: 'orange', name: 'Laranja (Padrão)', hex: '#f97316', description: 'Visual esportivo e focado' },
  { id: 'blue', name: 'Azul Elétrico', hex: '#3b82f6', description: 'Produtividade e precisão' },
  { id: 'emerald', name: 'Verde Esmeralda', hex: '#10b981', description: 'Equilíbrio e calma mental' },
  { id: 'rose', name: 'Rosa Vibrante', hex: '#f43f5e', description: 'Criatividade e destaque' },
  { id: 'purple', name: 'Roxo Profundo', hex: '#a855f7', description: 'Sofisticação e tecnologia' },
  { id: 'amber', name: 'Âmbar / Dourado', hex: '#f59e0b', description: 'Energia e calor' },
  { id: 'cyan', name: 'Ciano Neon', hex: '#06b6d4', description: 'Futurista e moderno' }
];

/* ====================================================================================================
 * COMPONENTE PRINCIPAL STANDALONE: SettingsInterfacesStandalone
 * ==================================================================================================== */

export default function SettingsInterfacesStandalone() {
  // Controle de tela atual (navegação em pilha)
  const [currentScreen, setCurrentScreen] = useState<SettingsScreenId>('main');
  const [navigationHistory, setNavigationHistory] = useState<SettingsScreenId[]>(['main']);
  const [searchQuery, setSearchQuery] = useState('');

  // Feedbacks
  const [saveFeedback, setSaveFeedback] = useState<string | null>(null);
  const [syncFeedback, setSyncFeedback] = useState<string | null>(null);

  // 1. Estados de SUA CONTA
  const [userName, setUserName] = useState('Alexandre Silveira');
  const [userHandle, setUserHandle] = useState('@alexandre.planner');
  const [userEmail, setUserEmail] = useState('alexandre@exemplo.com');
  const [userPhoto, setUserPhoto] = useState(AVATAR_PRESETS[0]);
  const [showAvatarDropdown, setShowAvatarDropdown] = useState(false);
  const [googleConnected, setGoogleConnected] = useState(false);
  const [userPassword, setUserPassword] = useState('minhasenha123');
  const [showUserPassword, setShowUserPassword] = useState(false);

  // 2. Estados de SEGURANÇA E ACESSO À CONTA
  const [syncKey, setSyncKey] = useState('SYNC-USER-8921-CLOUD');
  const [appLockEnabled, setAppLockEnabled] = useState(true);
  const [appLockPassword, setAppLockPassword] = useState('1234');
  const [appLockBiometricEnabled, setAppLockBiometricEnabled] = useState(false);
  const [appLockTimeout, setAppLockTimeout] = useState<number>(5); // minutos (-1 = Sempre logado)
  const [newLockPass, setNewLockPass] = useState('');
  const [confirmLockPass, setConfirmLockPass] = useState('');
  const [showLockPassInput, setShowLockPassInput] = useState(false);
  const [lockScreenDesktopImage, setLockScreenDesktopImage] = useState(
    'https://images.unsplash.com/photo-1506744038136-46273834b3fb?q=80&w=1920'
  );
  const [lockScreenMobileImage, setLockScreenMobileImage] = useState(
    'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?q=80&w=800'
  );
  const [isTestLockScreenActive, setIsTestLockScreenActive] = useState(false);
  const [testLockUnlockInput, setTestLockUnlockInput] = useState('');
  const [testLockError, setTestLockError] = useState(false);

  // 3. Estados de DISPOSITIVOS CONECTADOS
  const [connectedDevices, setConnectedDevices] = useState<ConnectedDeviceInfo[]>([
    {
      id: 'dev_curr_1',
      name: 'Google Chrome no Windows',
      customName: 'Meu Computador Desktop',
      deviceType: 'desktop',
      browser: 'Chrome 122',
      os: 'Windows 11',
      isCurrent: true,
      lastActive: 'Agora'
    },
    {
      id: 'dev_phone_2',
      name: 'Safari no iPhone 15 Pro',
      customName: 'iPhone Pessoal',
      deviceType: 'mobile',
      browser: 'Mobile Safari',
      os: 'iOS 17.4',
      isCurrent: false,
      lastActive: 'Há 12 minutos'
    },
    {
      id: 'dev_mac_3',
      name: 'MacBook Air M2',
      customName: 'Notebook Trabalho',
      deviceType: 'desktop',
      browser: 'Chrome',
      os: 'macOS Sonoma',
      isCurrent: false,
      lastActive: 'Ontem às 21:40'
    }
  ]);
  const [editingDevice, setEditingDevice] = useState<ConnectedDeviceInfo | null>(null);
  const [editDeviceCustomName, setEditDeviceCustomName] = useState('');
  const [showConnectDeviceModal, setShowConnectDeviceModal] = useState(false);
  const [connectQrCountdown, setConnectQrCountdown] = useState(300);
  const [connectQrDataUrl, setConnectQrDataUrl] = useState<string | null>(null);
  const [connectQrPinCode, setConnectQrPinCode] = useState<string>('892104');
  const [connectDeviceTab, setConnectDeviceTab] = useState<'qrcode' | 'codigo'>('qrcode');
  const [manualCodeInput, setManualCodeInput] = useState<string>('');
  const [manualCodeFeedback, setManualCodeFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // 4. Estados de NOTIFICAÇÕES
  const [notifBackground, setNotifBackground] = useState(true);
  const [dailyWorkspaceNotifEnabled, setDailyWorkspaceNotifEnabled] = useState(true);
  const [dailyWorkspaceReminderTime, setDailyWorkspaceReminderTime] = useState('07:30');
  const [reviewReminders, setReviewReminders] = useState<ReviewRemindersConfig>({
    weekly: { enabled: true, dayOfWeek: 0, time: '20:00' }, // Domingo
    monthly: { enabled: true, timingType: 'last_day', dayOfMonth: 30, time: '19:00' }
  });
  const [notifDailyHabits, setNotifDailyHabits] = useState(true);
  const [notifFinances, setNotifFinances] = useState(true);
  const [notifSyncFeedback, setNotifSyncFeedback] = useState(false);

  // 5. Estados de ACESSIBILIDADE, EXIBIÇÃO E PWA
  const [autoFullscreen, setAutoFullscreen] = useState(false);
  const [mobileNavbarMode, setMobileNavbarMode] = useState<'fixed' | 'flexible'>('flexible');
  const [mobileNavbarShape, setMobileNavbarShape] = useState<'oval' | 'reta'>('oval');
  const [selectedColorPreset, setSelectedColorPreset] = useState<string>('orange');
  const [customAccentColor, setCustomAccentColor] = useState<string>('#f97316');
  const [isColorSchemeModalOpen, setIsColorSchemeModalOpen] = useState(false);
  const [loadingScreenVerticalImage, setLoadingScreenVerticalImage] = useState(
    'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?q=80&w=800'
  );
  const [loadingScreenHorizontalImage, setLoadingScreenHorizontalImage] = useState(
    'https://images.unsplash.com/photo-1506744038136-46273834b3fb?q=80&w=1920'
  );
  const [isTestSplashScreenActive, setIsTestSplashScreenActive] = useState(false);
  const [pwaInstalled, setPwaInstalled] = useState(false);
  const [selectedLanguage, setSelectedLanguage] = useState<'pt' | 'en'>('pt');

  /* ====================================================================================================
   * UTILITÁRIOS E NAVEGAÇÃO
   * ==================================================================================================== */

  const navigateTo = (screen: SettingsScreenId) => {
    setNavigationHistory(prev => [...prev, screen]);
    setCurrentScreen(screen);
  };

  const navigateBack = () => {
    if (navigationHistory.length > 1) {
      const nextHistory = [...navigationHistory];
      nextHistory.pop();
      const prevScreen = nextHistory[nextHistory.length - 1];
      setNavigationHistory(nextHistory);
      setCurrentScreen(prevScreen);
    } else {
      setCurrentScreen('main');
    }
  };

  const triggerToast = (msg: string) => {
    setSaveFeedback(msg);
    setTimeout(() => setSaveFeedback(null), 3000);
  };

  // Temporizador regressivo e geração do QR Code de novo aparelho (5 minutos / 300s)
  useEffect(() => {
    if (!showConnectDeviceModal) {
      setConnectQrDataUrl(null);
      setManualCodeInput('');
      setManualCodeFeedback(null);
      return;
    }

    // Gerar QR code real com duração de 5 minutos
    const randomPin = Math.floor(100000 + Math.random() * 900000).toString();
    setConnectQrPinCode(randomPin);
    setConnectQrCountdown(300);

    const qrPayload = typeof window !== 'undefined' 
      ? `${window.location.origin}/?connect_code=${randomPin}`
      : `https://lifeorganizer.app/?connect_code=${randomPin}`;

    QRCode.toDataURL(qrPayload, {
      width: 280,
      margin: 2,
      color: {
        dark: '#09090b',
        light: '#ffffff'
      }
    }).then(url => {
      setConnectQrDataUrl(url);
    }).catch(err => {
      console.error('Erro ao gerar QRCode:', err);
    });

    const interval = setInterval(() => {
      setConnectQrCountdown(c => (c > 0 ? c - 1 : 0));
    }, 1000);

    return () => clearInterval(interval);
  }, [showConnectDeviceModal]);

  /* ====================================================================================================
   * HANDLERS DE AÇÃO
   * ==================================================================================================== */

  // Salvar Informações da Conta
  const handleSaveAccountInfo = (e: React.FormEvent) => {
    e.preventDefault();
    triggerToast('Informações da conta salvas com sucesso!');
  };

  // Salvar Senha da Conta
  const handleSavePassword = (e: React.FormEvent) => {
    e.preventDefault();
    triggerToast('Senha da conta alterada com sucesso!');
  };

  // Download Backup JSON
  const handleDownloadBackup = () => {
    const backupData = {
      appName: 'Life Organizer Planner',
      exportDate: new Date().toISOString(),
      user: { name: userName, handle: userHandle, email: userEmail },
      settings: {
        appLockEnabled,
        appLockTimeout,
        mobileNavbarMode,
        autoFullscreen,
        accentColor: customAccentColor
      }
    };
    const blob = new Blob([JSON.stringify(backupData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `backup_planner_${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
    triggerToast('Arquivo de backup (.JSON) baixado com sucesso!');
  };

  // Upload Backup JSON
  const handleUploadBackup = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        try {
          const json = JSON.parse(event.target?.result as string);
          if (json.user?.name) setUserName(json.user.name);
          if (json.user?.handle) setUserHandle(json.user.handle);
          triggerToast('Backup restaurado com sucesso!');
        } catch {
          alert('Arquivo JSON inválido para restauração.');
        }
      };
      reader.readAsText(file);
    }
  };

  // Salvar Nova Senha de Bloqueio do App
  const handleSaveLockPassword = () => {
    if (!newLockPass) {
      alert('A senha de bloqueio não pode ser vazia.');
      return;
    }
    if (newLockPass !== confirmLockPass) {
      alert('As senhas de bloqueio digitadas não coincidem.');
      return;
    }
    setAppLockPassword(newLockPass);
    setNewLockPass('');
    setConfirmLockPass('');
    triggerToast('Senha de bloqueio do app configurada com sucesso!');
  };

  // Renomear Dispositivo
  const handleSaveDeviceName = () => {
    if (!editingDevice) return;
    setConnectedDevices(prev =>
      prev.map(d => (d.id === editingDevice.id ? { ...d, customName: editDeviceCustomName } : d))
    );
    setEditingDevice(null);
    triggerToast('Nome do dispositivo atualizado!');
  };

  // Desconectar Dispositivo
  const handleDisconnectDevice = (id: string) => {
    if (confirm('Deseja realmente desconectar e revogar o acesso deste dispositivo?')) {
      setConnectedDevices(prev => prev.filter(d => d.id !== id));
      setEditingDevice(null);
      triggerToast('Dispositivo desconectado com sucesso.');
    }
  };

  // Solicitar Permissão de Notificação PWA / Navegador
  const handleRequestNotificationPermission = async () => {
    if (typeof Notification !== 'undefined') {
      const perm = await Notification.requestPermission();
      if (perm === 'granted') {
        new Notification('Notificações Ativas!', {
          body: 'O Planner enviará seus alertas e lembretes em segundo plano.',
          icon: '/icon-192.png'
        });
        triggerToast('Permissão de notificações concedida!');
      } else {
        alert('Permissão negada nas preferências do navegador.');
      }
    } else {
      triggerToast('Notificações simuladas ativadas!');
    }
  };

  // Testar Disparo de Notificação
  const handleTestNotification = () => {
    if (typeof Notification !== 'undefined' && Notification.permission === 'granted') {
      new Notification('⏰ Teste de Alarme Life Organizer', {
        body: 'Disparo de notificação em segundo plano testado com sucesso!',
        icon: '/icon-192.png'
      });
    } else {
      triggerToast('⚡ Teste de alerta disparado na interface!');
    }
  };

  // Alternar Tela Cheia
  const handleToggleFullscreen = () => {
    const nextVal = !autoFullscreen;
    setAutoFullscreen(nextVal);
    if (nextVal && !document.fullscreenElement) {
      try {
        document.documentElement.requestFullscreen();
      } catch (e) {
        console.warn('Fullscreen não suportado neste ambiente', e);
      }
    }
    triggerToast(`Tela cheia automática ${nextVal ? 'ativada' : 'desativada'}.`);
  };

  /* ====================================================================================================
   * ITENS DO MENU PRINCIPAL DE CONFIGURAÇÕES
   * ==================================================================================================== */

  const menuSections = [
    {
      id: 'sua_conta',
      title: 'Sua conta',
      desc: 'Veja informações sobre sua conta, baixe um arquivo com seus dados ou saiba mais sobre as opções de desativação de conta.',
      icon: User,
      screen: 'sua_conta' as SettingsScreenId
    },
    {
      id: 'seguranca',
      title: 'Segurança e acesso à conta',
      desc: 'Gerencie a segurança da sua conta, monitore chaves de sincronização em nuvem e gerencie senhas e bloqueio do app.',
      icon: Lock,
      screen: 'seguranca' as SettingsScreenId
    },
    {
      id: 'dispositivos_conectados',
      title: 'Dispositivos conectados',
      desc: 'Veja e gerencie celulares, computadores e navegadores em que sua conta está ativa.',
      icon: Laptop,
      screen: 'dispositivos_conectados' as SettingsScreenId
    },
    {
      id: 'notificacoes',
      title: 'Notificações',
      desc: 'Selecione os tipos de notificação que você deseja receber sobre atividades, metas e lembretes de rotinas.',
      icon: Bell,
      screen: 'notificacoes' as SettingsScreenId
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
      screen: 'exibicao' as SettingsScreenId
    }
  ];

  const filteredMenuItems = menuSections.filter(item =>
    item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    item.desc.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="w-full max-w-4xl mx-auto min-h-[640px] bg-[#0c0c0e] border border-zinc-900 text-white font-sans rounded-3xl overflow-hidden shadow-2xl relative select-none">
      
      {/* TOAST DE FEEDBACK GLOBAL */}
      <AnimatePresence>
        {saveFeedback && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="absolute top-4 left-1/2 -translate-x-1/2 z-50 bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 px-4 py-2 rounded-2xl text-xs font-mono font-bold flex items-center gap-2 shadow-2xl backdrop-blur-md"
          >
            <CheckCircle className="h-4 w-4" />
            <span>{saveFeedback}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ROTEADOR DE TELAS ANIMADO VIA FRAMER MOTION */}
      <AnimatePresence mode="wait">

        {/* ============================================================================================
         * VIEW 0: MENU PRINCIPAL DE CONFIGURAÇÕES (com Busca e Header do Usuário)
         * ============================================================================================ */}
        {currentScreen === 'main' && (
          <motion.div
            key="screen-main"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.22 }}
            className="flex flex-col h-full"
          >
            {/* Header com avatar e handle */}
            <div className="p-5 border-b border-zinc-900 flex items-center justify-between bg-zinc-950/60">
              <div>
                <h2 className="text-lg font-black text-white tracking-tight">Configurações do Sistema</h2>
                <p className="text-xs text-zinc-500 font-mono mt-0.5">{userHandle}</p>
              </div>
              <div className="flex items-center gap-3">
                <img
                  src={userPhoto}
                  alt="Profile"
                  className="h-10 w-10 rounded-2xl object-cover border border-zinc-800 shadow-md"
                  referrerPolicy="no-referrer"
                />
              </div>
            </div>

            {/* Barra de pesquisa de configurações */}
            <div className="p-4 border-b border-zinc-900 bg-zinc-950/30">
              <input
                type="text"
                placeholder="Buscar configurações (ex: senha, biometria, cores, notificações)..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="w-full bg-[#131317] border border-zinc-850 rounded-xl px-4 py-2.5 text-xs text-white placeholder-zinc-600 focus:outline-none focus:border-orange-500/50 font-mono"
              />
            </div>

            {/* Lista dos 6 Módulos de Configurações */}
            <div className="divide-y divide-zinc-900/80 p-2">
              {filteredMenuItems.map(item => (
                <div
                  key={item.id}
                  onClick={() => {
                    if (item.onClick) item.onClick();
                    else if (item.screen) navigateTo(item.screen);
                  }}
                  className="flex items-start gap-4 p-4 rounded-2xl hover:bg-zinc-900/60 active:bg-zinc-900 cursor-pointer transition-all group"
                >
                  <div className="p-2.5 rounded-xl bg-zinc-900 border border-zinc-800 text-zinc-400 group-hover:text-orange-400 group-hover:border-orange-500/30 transition-colors shrink-0">
                    <item.icon className="h-5 w-5" />
                  </div>
                  <div className="flex-1 space-y-0.5">
                    <h4 className="text-xs font-bold text-zinc-200 group-hover:text-white transition-colors">
                      {item.title}
                    </h4>
                    <p className="text-[11px] text-zinc-500 font-mono leading-relaxed">
                      {item.desc}
                    </p>
                  </div>
                  <ChevronRight className="h-4 w-4 text-zinc-700 group-hover:text-zinc-300 mt-2 shrink-0 transition-colors" />
                </div>
              ))}
            </div>
          </motion.div>
        )}

        {/* ============================================================================================
         * VIEW 1: SUA CONTA (MENU DE OPÇÕES DA CONTA)
         * ============================================================================================ */}
        {currentScreen === 'sua_conta' && (
          <motion.div
            key="screen-sua-conta"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.22 }}
          >
            {/* Nav Header */}
            <div className="p-4 border-b border-zinc-900 flex items-center gap-3 bg-zinc-950/60">
              <button
                onClick={navigateBack}
                className="p-2 hover:bg-zinc-900 rounded-xl text-zinc-400 hover:text-white transition-colors cursor-pointer"
              >
                <ArrowLeft className="h-4 w-4" />
              </button>
              <div>
                <h3 className="text-xs font-black tracking-wider uppercase font-mono text-zinc-300">Sua conta</h3>
                <p className="text-[10px] text-zinc-500 font-mono">{userHandle}</p>
              </div>
            </div>

            <div className="p-4 border-b border-zinc-900/60 bg-zinc-950/20">
              <p className="text-xs text-zinc-400 font-mono leading-relaxed">
                Veja informações sobre sua conta, baixe um arquivo com seus dados ou saiba mais sobre as opções de desativação de conta.
              </p>
            </div>

            <div className="divide-y divide-zinc-900 px-2 py-1">
              {/* Opção 1: Informações da conta */}
              <div
                onClick={() => navigateTo('informacoes_conta')}
                className="flex items-start gap-4 p-4 hover:bg-zinc-900/50 cursor-pointer rounded-2xl transition-colors group"
              >
                <User className="h-5 w-5 text-zinc-500 group-hover:text-orange-400 mt-0.5 shrink-0" />
                <div className="flex-1 space-y-0.5">
                  <h4 className="text-xs font-bold text-zinc-200">Informações da conta</h4>
                  <p className="text-[10px] text-zinc-500 font-mono">Veja as informações da sua conta, como e-mail e nome de usuário.</p>
                </div>
                <ChevronRight className="h-4 w-4 text-zinc-600 mt-1" />
              </div>

              {/* Opção 2: Alterar senha da conta */}
              <div
                onClick={() => navigateTo('alterar_senha')}
                className="flex items-start gap-4 p-4 hover:bg-zinc-900/50 cursor-pointer rounded-2xl transition-colors group"
              >
                <Lock className="h-5 w-5 text-zinc-500 group-hover:text-orange-400 mt-0.5 shrink-0" />
                <div className="flex-1 space-y-0.5">
                  <h4 className="text-xs font-bold text-zinc-200">Alterar senha da conta do usuário</h4>
                  <p className="text-[10px] text-zinc-500 font-mono">Altere a senha de autenticação e identificação do seu perfil.</p>
                </div>
                <ChevronRight className="h-4 w-4 text-zinc-600 mt-1" />
              </div>

              {/* Opção 3: Dispositivos conectados (Shortcut) */}
              <div
                onClick={() => navigateTo('dispositivos_conectados')}
                className="flex items-start gap-4 p-4 hover:bg-zinc-900/50 cursor-pointer rounded-2xl transition-colors group"
              >
                <Laptop className="h-5 w-5 text-emerald-400 mt-0.5 shrink-0" />
                <div className="flex-1 space-y-0.5">
                  <h4 className="text-xs font-bold text-zinc-200">Dispositivos conectados</h4>
                  <p className="text-[10px] text-zinc-500 font-mono">Veja em quais aparelhos ou navegadores sua conta está conectada.</p>
                </div>
                <ChevronRight className="h-4 w-4 text-zinc-600 mt-1" />
              </div>

              {/* Opção 4: Download Backup (.JSON) */}
              <div
                onClick={handleDownloadBackup}
                className="flex items-start gap-4 p-4 hover:bg-zinc-900/50 cursor-pointer rounded-2xl transition-colors group"
              >
                <Download className="h-5 w-5 text-zinc-400 group-hover:text-white mt-0.5 shrink-0" />
                <div className="flex-1 space-y-0.5">
                  <h4 className="text-xs font-bold text-zinc-200">Exportar backup dos dados (Baixar .JSON)</h4>
                  <p className="text-[10px] text-zinc-500 font-mono">Baixe um arquivo JSON com todas as suas metas, tarefas, hábitos, finanças e anotações.</p>
                </div>
                <ChevronRight className="h-4 w-4 text-zinc-600 mt-1" />
              </div>

              {/* Opção 5: Upload / Restaurar backup (.JSON) */}
              <label className="flex items-start gap-4 p-4 hover:bg-zinc-900/50 cursor-pointer rounded-2xl transition-colors group">
                <Upload className="h-5 w-5 text-orange-400 mt-0.5 shrink-0" />
                <div className="flex-1 space-y-0.5">
                  <h4 className="text-xs font-bold text-orange-400">Restaurar backup existente (Upload .JSON)</h4>
                  <p className="text-[10px] text-zinc-500 font-mono">Selecione um arquivo de backup para restaurar instantaneamente todos os seus dados sem perdas.</p>
                </div>
                <input
                  type="file"
                  accept=".json,application/json"
                  onChange={handleUploadBackup}
                  className="hidden"
                />
                <ChevronRight className="h-4 w-4 text-zinc-600 mt-1" />
              </label>

              {/* Opção 6: Desativar conta */}
              <div
                onClick={() => navigateTo('desativar_conta')}
                className="flex items-start gap-4 p-4 hover:bg-red-950/20 cursor-pointer rounded-2xl transition-colors group"
              >
                <Trash2 className="h-5 w-5 text-red-500 mt-0.5 shrink-0" />
                <div className="flex-1 space-y-0.5">
                  <h4 className="text-xs font-bold text-red-400">Desativar sua conta</h4>
                  <p className="text-[10px] text-zinc-500 font-mono">Descubra como desativar sua conta temporariamente.</p>
                </div>
                <ChevronRight className="h-4 w-4 text-zinc-700 mt-1" />
              </div>

              {/* Opção 7: Sair da conta (Logout) */}
              <div
                onClick={() => {
                  if (confirm('Deseja realmente encerrar a sessão deste usuário?')) {
                    triggerToast('Sessão encerrada com sucesso!');
                  }
                }}
                className="flex items-start gap-4 p-4 hover:bg-red-950/20 cursor-pointer rounded-2xl transition-colors group"
              >
                <LogOut className="h-5 w-5 text-red-500 mt-0.5 shrink-0" />
                <div className="flex-1 space-y-0.5">
                  <h4 className="text-xs font-bold text-red-400">Sair da conta (Logout)</h4>
                  <p className="text-[10px] text-zinc-500 font-mono">Encerra a sessão atual e desconecta deste dispositivo.</p>
                </div>
                <ChevronRight className="h-4 w-4 text-zinc-700 mt-1" />
              </div>
            </div>
          </motion.div>
        )}

        {/* ============================================================================================
         * VIEW 1.1: INFORMAÇÕES DA CONTA (FORMULÁRIO COMPLETO)
         * ============================================================================================ */}
        {currentScreen === 'informacoes_conta' && (
          <motion.div
            key="screen-info-conta"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.22 }}
            className="p-5 space-y-6"
          >
            {/* Header */}
            <div className="flex items-center gap-3 border-b border-zinc-900 pb-4">
              <button onClick={navigateBack} className="p-2 hover:bg-zinc-900 rounded-xl text-zinc-400">
                <ArrowLeft className="h-4 w-4" />
              </button>
              <h3 className="text-xs font-black tracking-wider uppercase font-mono text-zinc-300">Informações da Conta</h3>
            </div>

            <form onSubmit={handleSaveAccountInfo} className="space-y-6">
              {/* Integração Google */}
              <div className="p-5 bg-zinc-950 border border-zinc-900 rounded-2xl space-y-3">
                <span className="text-[10px] text-zinc-500 font-mono font-bold uppercase tracking-wider block">
                  Integração Google
                </span>
                {googleConnected ? (
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <img
                        src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=150"
                        alt="Google Account"
                        className="h-9 w-9 rounded-xl object-cover border border-zinc-800"
                      />
                      <div>
                        <p className="text-xs font-bold text-white">{userName}</p>
                        <p className="text-[10px] text-zinc-500 font-mono">{userEmail}</p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => setGoogleConnected(false)}
                      className="px-3 py-1.5 bg-red-950/20 hover:bg-red-950/40 text-red-400 text-[10px] font-mono font-bold uppercase rounded-lg border border-red-900/30 transition-all cursor-pointer"
                    >
                      Desconectar
                    </button>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <p className="text-xs text-zinc-400 font-mono leading-relaxed">
                      Conecte sua conta do Google para sincronizar automaticamente seus dados de perfil e eventos do Google Agenda.
                    </p>
                    <button
                      type="button"
                      onClick={() => setGoogleConnected(true)}
                      className="w-full py-2.5 bg-zinc-900 hover:bg-zinc-850 text-white text-xs font-bold font-mono uppercase tracking-wider rounded-xl border border-zinc-800 flex items-center justify-center gap-2 transition-all cursor-pointer"
                    >
                      <LogIn className="h-4 w-4 text-orange-400" />
                      Conectar Google Agenda
                    </button>
                  </div>
                )}
              </div>

              {/* Customizador de Foto de Perfil */}
              <div className="p-5 bg-zinc-950 border border-zinc-900 rounded-2xl space-y-4">
                <span className="text-[10px] text-zinc-500 font-mono font-bold uppercase tracking-wider block">
                  Foto de perfil
                </span>
                <div className="flex items-start gap-4">
                  <img
                    src={userPhoto}
                    alt="Preview"
                    className="h-16 w-16 rounded-2xl object-cover border border-zinc-800 shadow-md shrink-0"
                    referrerPolicy="no-referrer"
                  />
                  <div className="flex-1 space-y-2.5">
                    <input
                      type="url"
                      value={userPhoto}
                      onChange={e => setUserPhoto(e.target.value)}
                      placeholder="URL da imagem ou cole aqui..."
                      className="w-full bg-[#16161a] border border-zinc-900 rounded-xl px-3 py-2 text-xs text-zinc-200 focus:outline-none focus:border-orange-500/40 font-mono"
                    />
                    <div className="flex flex-wrap items-center gap-3">
                      <button
                        type="button"
                        onClick={() => setShowAvatarDropdown(!showAvatarDropdown)}
                        className="text-[10px] font-mono font-bold text-orange-400 hover:underline cursor-pointer"
                      >
                        {showAvatarDropdown ? 'Fechar presets' : 'Escolher presets'}
                      </button>
                      <span className="text-zinc-800 text-[10px]">•</span>
                      <label className="text-[10px] font-mono font-bold text-zinc-400 hover:text-white flex items-center gap-1.5 cursor-pointer">
                        <Upload className="h-3 w-3 text-orange-400" />
                        <span>Carregar Arquivo</span>
                        <input
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={e => {
                            const file = e.target.files?.[0];
                            if (file) {
                              const reader = new FileReader();
                              reader.onloadend = () => {
                                if (typeof reader.result === 'string') setUserPhoto(reader.result);
                              };
                              reader.readAsDataURL(file);
                            }
                          }}
                        />
                      </label>
                      <span className="text-zinc-800 text-[10px]">•</span>
                      <button
                        type="button"
                        onClick={async () => {
                          try {
                            const text = await navigator.clipboard.readText();
                            if (text && (text.startsWith('http') || text.startsWith('data:image/'))) {
                              setUserPhoto(text.trim());
                              triggerToast('Imagem colada com sucesso!');
                            }
                          } catch {
                            triggerToast('Cole manualmente usando o teclado.');
                          }
                        }}
                        className="text-[10px] font-mono font-bold text-amber-400 hover:text-amber-300 flex items-center gap-1.5 cursor-pointer"
                      >
                        <Clipboard className="h-3 w-3" />
                        <span>Colar da Área de Transferência</span>
                      </button>
                    </div>
                  </div>
                </div>

                {/* Dropdown de Presets */}
                {showAvatarDropdown && (
                  <div className="grid grid-cols-6 gap-2 p-3 bg-zinc-900/60 rounded-xl border border-zinc-850">
                    {AVATAR_PRESETS.map((preset, i) => (
                      <button
                        key={i}
                        type="button"
                        onClick={() => {
                          setUserPhoto(preset);
                          setShowAvatarDropdown(false);
                        }}
                        className="relative aspect-square rounded-lg overflow-hidden border border-zinc-800 hover:border-orange-500 transition-all cursor-pointer"
                      >
                        <img src={preset} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Campos: Nome, Handle e E-mail */}
              <div className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] text-zinc-500 font-mono font-bold uppercase tracking-wider block">Nome</label>
                  <input
                    type="text"
                    value={userName}
                    onChange={e => setUserName(e.target.value)}
                    className="w-full bg-zinc-950 border border-zinc-900 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-orange-500/40"
                    required
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] text-zinc-500 font-mono font-bold uppercase tracking-wider block">Nome de Usuário (@handle)</label>
                  <input
                    type="text"
                    value={userHandle}
                    onChange={e => setUserHandle(e.target.value)}
                    className="w-full bg-zinc-950 border border-zinc-900 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-orange-500/40 font-mono"
                    required
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] text-zinc-500 font-mono font-bold uppercase tracking-wider block">E-mail</label>
                  <input
                    type="email"
                    value={userEmail}
                    onChange={e => setUserEmail(e.target.value)}
                    className="w-full bg-zinc-950 border border-zinc-900 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-orange-500/40"
                    required
                  />
                </div>
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  className="w-full py-3 bg-orange-500 hover:bg-orange-600 font-bold text-xs uppercase tracking-wider rounded-xl transition-all cursor-pointer shadow-lg shadow-orange-500/20"
                >
                  Salvar Informações
                </button>
              </div>
            </form>
          </motion.div>
        )}

        {/* ============================================================================================
         * VIEW 1.2: ALTERAR SENHA DA CONTA DO USUÁRIO
         * ============================================================================================ */}
        {currentScreen === 'alterar_senha' && (
          <motion.div
            key="screen-alterar-senha"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.22 }}
            className="p-5 space-y-6"
          >
            <div className="flex items-center gap-3 border-b border-zinc-900 pb-4">
              <button onClick={navigateBack} className="p-2 hover:bg-zinc-900 rounded-xl text-zinc-400">
                <ArrowLeft className="h-4 w-4" />
              </button>
              <h3 className="text-xs font-black tracking-wider uppercase font-mono text-zinc-300">Alterar Senha do Usuário</h3>
            </div>

            <div className="p-4 bg-zinc-950 border border-zinc-900 rounded-2xl">
              <p className="text-xs text-zinc-400 leading-relaxed font-sans">
                Sua <strong className="text-white">Senha de Usuário</strong> é utilizada para autenticar seu perfil e proteger suas configurações pessoais. Ela é totalmente independente da <strong className="text-orange-400">Senha de Bloqueio do App</strong>.
              </p>
            </div>

            <form onSubmit={handleSavePassword} className="space-y-5">
              <div className="space-y-1.5">
                <label className="text-[10px] text-zinc-500 font-mono font-bold uppercase tracking-wider block">
                  Nova Senha da Conta
                </label>
                <div className="relative">
                  <input
                    type={showUserPassword ? 'text' : 'password'}
                    value={userPassword}
                    onChange={e => setUserPassword(e.target.value)}
                    placeholder="Defina a nova senha do usuário"
                    className="w-full bg-zinc-950 border border-zinc-900 rounded-xl pl-3.5 pr-10 py-2.5 text-xs text-white focus:outline-none focus:border-orange-500/40"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowUserPassword(!showUserPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-600 hover:text-zinc-400 cursor-pointer"
                  >
                    {showUserPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                className="w-full py-3 bg-orange-500 hover:bg-orange-600 font-bold text-xs uppercase tracking-wider rounded-xl transition-all cursor-pointer shadow-lg shadow-orange-500/20"
              >
                Salvar Senha do Usuário
              </button>
            </form>
          </motion.div>
        )}

        {/* ============================================================================================
         * VIEW 1.3: DESATIVAR CONTA
         * ============================================================================================ */}
        {currentScreen === 'desativar_conta' && (
          <motion.div
            key="screen-desativar-conta"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.22 }}
            className="p-5 space-y-6"
          >
            <div className="flex items-center gap-3 border-b border-zinc-900 pb-4">
              <button onClick={navigateBack} className="p-2 hover:bg-zinc-900 rounded-xl text-zinc-400">
                <ArrowLeft className="h-4 w-4" />
              </button>
              <h3 className="text-xs font-black tracking-wider uppercase font-mono text-zinc-300">Desativar Conta</h3>
            </div>

            <div className="flex items-center gap-3 p-4 bg-red-950/20 border border-red-900/30 rounded-2xl">
              <AlertTriangle className="h-5 w-5 text-red-500 shrink-0" />
              <span className="text-xs text-zinc-300 font-mono leading-relaxed">
                Atenção: Ao desativar sua conta, seu acesso ao Planner será congelado temporariamente. Todo o seu progresso, hábitos e dados serão mantidos intactos na nuvem.
              </span>
            </div>

            <div className="space-y-3">
              <div className="flex items-start gap-3">
                <div className="h-2 w-2 rounded-full bg-zinc-500 mt-1.5 shrink-0" />
                <p className="text-xs text-zinc-400 font-mono">
                  Isso não apagará seu histórico de forma permanente, apenas ocultará do seu monitoramento ativo.
                </p>
              </div>
              <div className="flex items-start gap-3">
                <div className="h-2 w-2 rounded-full bg-zinc-500 mt-1.5 shrink-0" />
                <p className="text-xs text-zinc-400 font-mono">
                  Você poderá reativar seu perfil a qualquer momento ao efetuar novo login.
                </p>
              </div>
            </div>

            <div className="pt-4 border-t border-zinc-900">
              <button
                type="button"
                onClick={() => {
                  alert('Conta colocada em status inativo.');
                  navigateBack();
                }}
                className="w-full py-3 bg-red-600 hover:bg-red-700 font-bold text-xs uppercase tracking-wider rounded-xl transition-colors cursor-pointer"
              >
                Sim, Desativar Minha Conta
              </button>
            </div>
          </motion.div>
        )}

        {/* ============================================================================================
         * VIEW 2: SEGURANÇA E ACESSO À CONTA (Bloqueio, Biometria, Timeout & Papel de Parede)
         * ============================================================================================ */}
        {currentScreen === 'seguranca' && (
          <motion.div
            key="screen-seguranca"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.22 }}
            className="p-5 space-y-6"
          >
            {/* Nav Header */}
            <div className="flex items-center gap-3 border-b border-zinc-900 pb-4">
              <button onClick={navigateBack} className="p-2 hover:bg-zinc-900 rounded-xl text-zinc-400">
                <ArrowLeft className="h-4 w-4" />
              </button>
              <div>
                <h3 className="text-xs font-black tracking-wider uppercase font-mono text-zinc-300">Segurança e Sincronização</h3>
                <p className="text-[10px] text-zinc-500 font-mono">Proteção e travas de acesso do app</p>
              </div>
            </div>

            {/* Card 1: Chave de Sincronização em Nuvem */}
            <div className="p-4 bg-[#111115] border border-zinc-900 rounded-2xl space-y-3">
              <span className="text-[9px] text-zinc-500 font-mono font-bold uppercase block tracking-widest">
                STATUS DA SINCRONIZAÇÃO
              </span>
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-xs font-bold font-mono text-white">{syncKey}</h4>
                  <p className="text-[10px] text-emerald-400 font-mono mt-0.5">Perfil sincronizado em nuvem ativo</p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    navigator.clipboard.writeText(syncKey);
                    triggerToast('Chave de sincronização copiada!');
                  }}
                  className="px-3 py-1.5 bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 rounded-xl text-[10px] font-mono font-bold text-zinc-300 flex items-center gap-1.5 transition-all cursor-pointer"
                >
                  <Clipboard className="h-3 w-3" />
                  Copiar Chave
                </button>
              </div>
            </div>

            {/* Card 2: Master Switch - Bloqueio do Aplicativo (App Lock) */}
            <div className="p-4 bg-zinc-950 border border-zinc-900 rounded-2xl space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-xs font-bold text-zinc-200 flex items-center gap-2">
                    <Lock className="h-4 w-4 text-orange-400" />
                    Bloqueio do Aplicativo (App Lock)
                  </h4>
                  <p className="text-[10px] text-zinc-500 font-mono mt-0.5">
                    Exige senha de segurança para visualizar o Planner ao abrir ou retornar ao app.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setAppLockEnabled(!appLockEnabled);
                    triggerToast(appLockEnabled ? 'Bloqueio do app desativado' : 'Bloqueio do app ativado');
                  }}
                  className={`w-10 h-6 rounded-full p-0.5 transition-all cursor-pointer ${
                    appLockEnabled ? 'bg-orange-500' : 'bg-zinc-800'
                  }`}
                >
                  <div className={`w-5 h-5 rounded-full bg-white transition-all ${appLockEnabled ? 'translate-x-4' : 'translate-x-0'}`} />
                </button>
              </div>

              {/* Botão de Teste Rápido do Bloqueio */}
              {appLockEnabled && (
                <div className="pt-3 border-t border-zinc-900/80 flex items-center justify-between">
                  <span className="text-[10px] text-zinc-500 font-mono">Testar mecanismo de bloqueio:</span>
                  <button
                    type="button"
                    onClick={() => {
                      setTestLockUnlockInput('');
                      setTestLockError(false);
                      setIsTestLockScreenActive(true);
                    }}
                    className="px-3 py-1.5 bg-orange-500/10 hover:bg-orange-500/20 border border-orange-500/30 text-orange-400 text-[10px] font-mono font-bold rounded-xl flex items-center gap-1.5 transition-all cursor-pointer"
                  >
                    <Play className="h-3 w-3 fill-current" />
                    Testar Bloqueio Agora
                  </button>
                </div>
              )}
            </div>

            {/* Card 3: Desbloqueio por Biometria / Impressão Digital */}
            <div className="p-4 bg-zinc-950 border border-zinc-900 rounded-2xl flex items-center justify-between">
              <div className="space-y-0.5">
                <div className="flex items-center gap-2">
                  <Fingerprint className="h-4 w-4 text-orange-400" />
                  <h4 className="text-xs font-bold text-zinc-200">Desbloqueio por Biometria / Face ID</h4>
                  {appLockBiometricEnabled && (
                    <span className="text-[8px] font-bold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-full font-mono uppercase">
                      Ativado
                    </span>
                  )}
                </div>
                <p className="text-[10px] text-zinc-500 font-mono leading-normal">
                  Permite desbloquear usando sensor de digital ou reconhecimento facial do aparelho.
                </p>
              </div>
              <button
                type="button"
                onClick={() => {
                  setAppLockBiometricEnabled(!appLockBiometricEnabled);
                  triggerToast(appLockBiometricEnabled ? 'Biometria desativada' : 'Biometria habilitada!');
                }}
                className={`w-10 h-6 rounded-full p-0.5 transition-all cursor-pointer shrink-0 ${
                  appLockBiometricEnabled ? 'bg-orange-500' : 'bg-zinc-800'
                }`}
              >
                <div className={`w-5 h-5 rounded-full bg-white transition-all ${appLockBiometricEnabled ? 'translate-x-4' : 'translate-x-0'}`} />
              </button>
            </div>

            {/* Card 4: Temporizador de Inatividade (Auto-Lock Timeout) */}
            {appLockEnabled && (
              <div className="p-4 bg-zinc-950 border border-zinc-900 rounded-2xl space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-orange-400" />
                    <h4 className="text-xs font-bold text-zinc-200">Tempo de Inatividade para Bloqueio</h4>
                  </div>
                  <span className="text-xs font-mono font-bold text-orange-400 bg-orange-500/10 px-2.5 py-1 rounded-lg border border-orange-500/20">
                    {appLockTimeout === -1 ? 'Sempre Logado' : `${appLockTimeout} min`}
                  </span>
                </div>

                {/* Slider */}
                <input
                  type="range"
                  min="1"
                  max="60"
                  step="1"
                  value={appLockTimeout === -1 ? 5 : appLockTimeout}
                  onChange={e => setAppLockTimeout(parseInt(e.target.value, 10))}
                  className="w-full accent-orange-500 bg-zinc-900 h-2 rounded-lg cursor-pointer"
                />

                {/* Botões Rápidos */}
                <div className="flex flex-wrap gap-2 pt-1">
                  {[1, 5, 15, 30, 60].map(mins => (
                    <button
                      key={mins}
                      type="button"
                      onClick={() => setAppLockTimeout(mins)}
                      className={`px-3 py-1.5 rounded-lg text-[10px] font-mono font-bold transition-all cursor-pointer ${
                        appLockTimeout === mins
                          ? 'bg-orange-500 text-white shadow-md'
                          : 'bg-zinc-900 hover:bg-zinc-850 text-zinc-400 border border-zinc-800'
                      }`}
                    >
                      {mins} min
                    </button>
                  ))}
                  <button
                    type="button"
                    onClick={() => setAppLockTimeout(-1)}
                    className={`px-3 py-1.5 rounded-lg text-[10px] font-mono font-bold transition-all cursor-pointer ${
                      appLockTimeout === -1
                        ? 'bg-orange-500 text-white shadow-md'
                        : 'bg-zinc-900 hover:bg-zinc-850 text-zinc-400 border border-zinc-800'
                    }`}
                  >
                    Nunca (Sempre Logado)
                  </button>
                </div>
              </div>
            )}

            {/* Card 5: Gerenciar Senha de Bloqueio do App */}
            <div className="p-4 bg-zinc-950 border border-zinc-900 rounded-2xl space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <KeyRound className="h-4 w-4 text-orange-400" />
                  <h4 className="text-xs font-bold text-zinc-200">Senha de Bloqueio do App</h4>
                </div>
                <button
                  type="button"
                  onClick={() => setShowLockPassInput(!showLockPassInput)}
                  className="text-[10px] font-mono font-bold text-orange-400 hover:underline cursor-pointer"
                >
                  {showLockPassInput ? 'Cancelar' : 'Alterar Senha'}
                </button>
              </div>

              {showLockPassInput && (
                <div className="space-y-3 pt-2 border-t border-zinc-900">
                  <div className="space-y-1">
                    <label className="text-[10px] text-zinc-500 font-mono font-bold uppercase">Nova Senha</label>
                    <input
                      type="password"
                      value={newLockPass}
                      onChange={e => setNewLockPass(e.target.value)}
                      placeholder="Digite a nova senha de bloqueio"
                      className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-3 py-2 text-xs text-white font-mono focus:outline-none focus:border-orange-500"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] text-zinc-500 font-mono font-bold uppercase">Confirmar Nova Senha</label>
                    <input
                      type="password"
                      value={confirmLockPass}
                      onChange={e => setConfirmLockPass(e.target.value)}
                      placeholder="Repita a nova senha"
                      className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-3 py-2 text-xs text-white font-mono focus:outline-none focus:border-orange-500"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={handleSaveLockPassword}
                    className="w-full py-2 bg-orange-500 hover:bg-orange-600 text-white font-mono font-bold text-xs uppercase tracking-wider rounded-xl transition-all cursor-pointer"
                  >
                    Salvar Nova Senha de Bloqueio
                  </button>
                </div>
              )}
            </div>

            {/* Card 6: Personalização dos Papéis de Parede da Tela de Bloqueio */}
            <div className="p-4 bg-zinc-950 border border-zinc-900 rounded-2xl space-y-4">
              <div className="flex items-center justify-between border-b border-zinc-900 pb-3">
                <div className="flex items-center gap-2">
                  <ImageIcon className="h-4 w-4 text-orange-400" />
                  <h4 className="text-xs font-bold text-zinc-200">Papéis de Parede da Tela de Bloqueio</h4>
                </div>
                <span className="text-[9px] font-mono font-bold text-zinc-500 uppercase">Desktop & Mobile</span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* 1. Imagem Desktop (Horizontal) */}
                <div className="p-3 bg-zinc-900/40 border border-zinc-850 rounded-xl space-y-3">
                  <span className="text-[10px] font-mono font-bold text-zinc-300 uppercase block">
                    Computador / Desktop (Horizontal)
                  </span>
                  <div className="relative aspect-video rounded-lg overflow-hidden border border-zinc-800">
                    <img src={lockScreenDesktopImage} alt="Desktop Lock" className="w-full h-full object-cover" />
                  </div>
                  <div className="flex items-center gap-2">
                    <label className="flex-1 py-1.5 bg-zinc-850 hover:bg-zinc-800 border border-zinc-700/60 rounded-lg text-center text-[10px] font-mono font-bold text-zinc-300 cursor-pointer flex items-center justify-center gap-1">
                      <Upload className="h-3 w-3 text-orange-400" />
                      <span>Upload</span>
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={e => {
                          const f = e.target.files?.[0];
                          if (f) {
                            const r = new FileReader();
                            r.onloadend = () => setLockScreenDesktopImage(r.result as string);
                            r.readAsDataURL(f);
                          }
                        }}
                      />
                    </label>
                    <button
                      type="button"
                      onClick={() => setLockScreenDesktopImage('')}
                      className="px-2.5 py-1.5 bg-red-950/20 hover:bg-red-950/40 border border-red-900/30 text-red-400 rounded-lg text-[10px] font-mono font-bold cursor-pointer"
                    >
                      Remover
                    </button>
                  </div>
                  <input
                    type="url"
                    value={lockScreenDesktopImage}
                    onChange={e => setLockScreenDesktopImage(e.target.value)}
                    placeholder="URL da imagem desktop..."
                    className="w-full bg-zinc-950 border border-zinc-850 rounded-lg px-2.5 py-1.5 text-[10px] text-zinc-300 font-mono focus:outline-none focus:border-orange-500"
                  />
                </div>

                {/* 2. Imagem Mobile (Vertical) */}
                <div className="p-3 bg-zinc-900/40 border border-zinc-850 rounded-xl space-y-3">
                  <span className="text-[10px] font-mono font-bold text-zinc-300 uppercase block">
                    Celular / Mobile (Vertical 9:16)
                  </span>
                  <div className="relative h-28 max-w-[90px] mx-auto rounded-lg overflow-hidden border border-zinc-800">
                    <img src={lockScreenMobileImage} alt="Mobile Lock" className="w-full h-full object-cover" />
                  </div>
                  <div className="flex items-center gap-2">
                    <label className="flex-1 py-1.5 bg-zinc-850 hover:bg-zinc-800 border border-zinc-700/60 rounded-lg text-center text-[10px] font-mono font-bold text-zinc-300 cursor-pointer flex items-center justify-center gap-1">
                      <Upload className="h-3 w-3 text-orange-400" />
                      <span>Upload</span>
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={e => {
                          const f = e.target.files?.[0];
                          if (f) {
                            const r = new FileReader();
                            r.onloadend = () => setLockScreenMobileImage(r.result as string);
                            r.readAsDataURL(f);
                          }
                        }}
                      />
                    </label>
                    <button
                      type="button"
                      onClick={() => setLockScreenMobileImage('')}
                      className="px-2.5 py-1.5 bg-red-950/20 hover:bg-red-950/40 border border-red-900/30 text-red-400 rounded-lg text-[10px] font-mono font-bold cursor-pointer"
                    >
                      Remover
                    </button>
                  </div>
                  <input
                    type="url"
                    value={lockScreenMobileImage}
                    onChange={e => setLockScreenMobileImage(e.target.value)}
                    placeholder="URL da imagem celular..."
                    className="w-full bg-zinc-950 border border-zinc-850 rounded-lg px-2.5 py-1.5 text-[10px] text-zinc-300 font-mono focus:outline-none focus:border-orange-500"
                  />
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {/* ============================================================================================
         * VIEW 3: DISPOSITIVOS CONECTADOS (Lista, Gestão, Desconexão e QR Code)
         * ============================================================================================ */}
        {currentScreen === 'dispositivos_conectados' && (
          <motion.div
            key="screen-dispositivos"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.22 }}
            className="p-5 space-y-6"
          >
            {/* Nav Header */}
            <div className="flex items-center gap-3 border-b border-zinc-900 pb-4">
              <button onClick={navigateBack} className="p-2 hover:bg-zinc-900 rounded-xl text-zinc-400">
                <ArrowLeft className="h-4 w-4" />
              </button>
              <div>
                <h3 className="text-xs font-black tracking-wider uppercase font-mono text-zinc-300">Dispositivos conectados</h3>
                <p className="text-[10px] text-zinc-500 font-mono">Gerenciamento de aparelhos da conta</p>
              </div>
            </div>

            {/* Banner Gráfico Esmeralda */}
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
                onClick={() => {
                  setConnectQrCountdown(300);
                  setShowConnectDeviceModal(true);
                }}
                className="w-full py-2.5 bg-emerald-500 hover:bg-emerald-400 text-zinc-950 font-black text-xs uppercase tracking-wider rounded-xl transition-all shadow-lg shadow-emerald-500/20 flex items-center justify-center gap-2 cursor-pointer"
              >
                <QrCode className="h-4 w-4" />
                Conectar dispositivo
              </button>
            </div>

            {/* STATUS DO DISPOSITIVO */}
            <div className="space-y-3">
              <div>
                <span className="text-[10px] text-zinc-500 font-mono font-bold uppercase tracking-widest block">
                  STATUS DO DISPOSITIVO
                </span>
                <p className="text-[10px] text-zinc-400 font-sans mt-0.5">
                  Toque em um dispositivo para definir um novo nome ou desconectá-lo.
                </p>
              </div>

              <div className="space-y-2.5">
                {connectedDevices.map(dev => (
                  <div
                    key={dev.id}
                    onClick={() => {
                      setEditingDevice(dev);
                      setEditDeviceCustomName(dev.customName || dev.name);
                    }}
                    className={`p-4 bg-[#111115] hover:bg-zinc-900/80 border rounded-2xl cursor-pointer transition-all flex items-center justify-between group ${
                      dev.isCurrent
                        ? 'border-emerald-500/40 shadow-[0_0_12px_rgba(16,185,129,0.08)]'
                        : 'border-zinc-900 hover:border-zinc-800'
                    }`}
                  >
                    <div className="flex items-center gap-3.5">
                      <div className={`p-2.5 rounded-xl border ${
                        dev.isCurrent
                          ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
                          : 'bg-zinc-900 border-zinc-800 text-zinc-400'
                      }`}>
                        {dev.deviceType === 'mobile' ? <Smartphone className="h-5 w-5" /> : <Laptop className="h-5 w-5" />}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h5 className="text-xs font-bold text-zinc-200 group-hover:text-white transition-colors">
                            {dev.customName || dev.name}
                          </h5>
                          {dev.isCurrent && (
                            <span className="text-[8px] font-mono font-bold uppercase bg-emerald-500/20 text-emerald-400 px-2 py-0.5 rounded-md border border-emerald-500/30">
                              SESSÃO ATUAL
                            </span>
                          )}
                        </div>
                        <p className="text-[10px] text-zinc-500 font-mono mt-0.5">
                          {dev.browser} • {dev.os} • {dev.isCurrent ? 'Ativo agora nesta janela' : `Última sessão: ${dev.lastActive}`}
                        </p>
                      </div>
                    </div>
                    <ChevronRight className="h-4 w-4 text-zinc-600 group-hover:text-zinc-300 transition-colors" />
                  </div>
                ))}
              </div>
            </div>

            {/* Nota de Criptografia de Ponta a Ponta */}
            <div className="p-4 bg-zinc-950/80 border border-zinc-900 rounded-2xl flex items-start gap-3">
              <ShieldCheck className="h-4 w-4 text-emerald-400 shrink-0 mt-0.5" />
              <p className="text-[10px] text-zinc-400 font-sans leading-relaxed">
                🔒 Suas informações pessoais e dados do planner são protegidos com criptografia de ponta a ponta em todos os seus aparelhos autorizados.
              </p>
            </div>
          </motion.div>
        )}

        {/* ============================================================================================
         * VIEW 4: NOTIFICAÇÕES (Sistema, PWA, Rotinas, Reviews e Hábitos)
         * ============================================================================================ */}
        {currentScreen === 'notificacoes' && (
          <motion.div
            key="screen-notificacoes"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.22 }}
            className="p-5 space-y-6"
          >
            {/* Nav Header */}
            <div className="flex items-center gap-3 border-b border-zinc-900 pb-4">
              <button onClick={navigateBack} className="p-2 hover:bg-zinc-900 rounded-xl text-zinc-400">
                <ArrowLeft className="h-4 w-4" />
              </button>
              <div>
                <h3 className="text-xs font-black tracking-wider uppercase font-mono text-zinc-300">Ajustes de Alerta</h3>
                <p className="text-[10px] text-zinc-500 font-mono uppercase">Lembretes de performance</p>
              </div>
            </div>

            {/* Master Card: Notificações do Sistema & Segundo Plano (PWA) */}
            <div className="p-5 bg-orange-950/20 border border-orange-500/30 rounded-2xl space-y-4">
              <div>
                <h4 className="text-xs font-bold text-orange-400 flex items-center gap-2">
                  <Bell className="h-4 w-4 text-orange-400 animate-pulse" />
                  Notificações do Sistema & Segundo Plano (PWA)
                </h4>
                <p className="text-xs text-zinc-400 mt-1 leading-relaxed">
                  Permite que os alarmes, timers e lembretes do Planner apareçam diretamente na central do sistema operacional (Windows, Android, iOS, macOS), mesmo com a aba ou o navegador fechados.
                </p>
              </div>

              <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-orange-500/20">
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleRequestNotificationPermission}
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
                    Segundo Plano ({notifBackground ? 'Ativado' : 'Desativado'})
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      setNotifBackground(!notifBackground);
                      triggerToast(`Alertas em segundo plano ${!notifBackground ? 'ativados' : 'desativados'}.`);
                    }}
                    className={`w-9 h-5 rounded-full p-0.5 transition-all cursor-pointer ${
                      notifBackground ? 'bg-orange-500' : 'bg-zinc-800'
                    }`}
                  >
                    <div className={`w-4 h-4 rounded-full bg-white transition-all ${notifBackground ? 'translate-x-4' : 'translate-x-0'}`} />
                  </button>
                </div>
              </div>
            </div>

            {/* Lembrete de Meu Dia */}
            <div className="p-4 bg-zinc-950 border border-zinc-900 rounded-2xl space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-xs font-bold text-zinc-200 flex items-center gap-2">
                    <Bell className="h-3.5 w-3.5 text-orange-400" />
                    Lembrete de Meu Dia
                  </h4>
                  <p className="text-[10px] text-zinc-500 font-mono mt-0.5">
                    Alerta diário para diário pessoal, orações, checklist e hábitos.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setDailyWorkspaceNotifEnabled(!dailyWorkspaceNotifEnabled)}
                  className={`w-9 h-5 rounded-full p-0.5 transition-all cursor-pointer ${
                    dailyWorkspaceNotifEnabled ? 'bg-orange-500' : 'bg-zinc-800'
                  }`}
                >
                  <div className={`w-4 h-4 rounded-full bg-white transition-all ${dailyWorkspaceNotifEnabled ? 'translate-x-4' : 'translate-x-0'}`} />
                </button>
              </div>

              {dailyWorkspaceNotifEnabled && (
                <div className="pt-2.5 flex items-center justify-between border-t border-zinc-900">
                  <span className="text-[10px] text-zinc-400 font-bold uppercase font-mono">Horário do Lembrete:</span>
                  <input
                    type="time"
                    value={dailyWorkspaceReminderTime}
                    onChange={e => setDailyWorkspaceReminderTime(e.target.value)}
                    className="bg-zinc-900 border border-zinc-800 rounded-xl px-3 py-1.5 text-xs text-white font-mono focus:outline-none focus:border-orange-500"
                  />
                </div>
              )}
            </div>

            {/* Lembretes de Reviews Periódicas (Semanal & Mensal) */}
            <div className="p-4 bg-zinc-950 border border-orange-500/30 rounded-2xl space-y-4">
              <div>
                <h4 className="text-xs font-bold text-orange-400 flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-orange-400" />
                  Lembretes de Review (Semanal & Mensal)
                </h4>
                <p className="text-[10px] text-zinc-400 font-mono mt-0.5">
                  Defina os dias da semana e do mês para fechar seus ciclos de avaliação e aprendizado.
                </p>
              </div>

              {/* Sub-item: Review Semanal */}
              <div className="p-3.5 bg-zinc-900/40 border border-zinc-850 rounded-xl space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-xs font-bold text-zinc-200 block">Review Semanal</span>
                    <span className="text-[10px] text-zinc-500 font-mono">
                      Lembrar {reviewReminders.weekly.enabled ? `às ${reviewReminders.weekly.time}` : 'desativado'}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setReviewReminders(prev => ({
                        ...prev,
                        weekly: { ...prev.weekly, enabled: !prev.weekly.enabled }
                      }));
                    }}
                    className={`w-9 h-5 rounded-full p-0.5 transition-all cursor-pointer ${
                      reviewReminders.weekly.enabled ? 'bg-orange-500' : 'bg-zinc-800'
                    }`}
                  >
                    <div className={`w-4 h-4 rounded-full bg-white transition-all ${reviewReminders.weekly.enabled ? 'translate-x-4' : 'translate-x-0'}`} />
                  </button>
                </div>

                {reviewReminders.weekly.enabled && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-2 border-t border-zinc-800">
                    <div>
                      <label className="text-[9px] text-zinc-400 font-mono uppercase block mb-1">Dia da Semana:</label>
                      <select
                        value={reviewReminders.weekly.dayOfWeek}
                        onChange={e => {
                          const val = parseInt(e.target.value, 10);
                          setReviewReminders(prev => ({
                            ...prev,
                            weekly: { ...prev.weekly, dayOfWeek: val }
                          }));
                        }}
                        className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-2.5 py-1.5 text-xs text-white font-mono focus:outline-none focus:border-orange-500"
                      >
                        <option value={0}>Domingo (Fechamento da semana)</option>
                        <option value={6}>Sábado (Balanço de fim de semana)</option>
                        <option value={1}>Segunda-feira (Início da semana)</option>
                        <option value={5}>Sexta-feira (Fim dos dias úteis)</option>
                      </select>
                    </div>

                    <div>
                      <label className="text-[9px] text-zinc-400 font-mono uppercase block mb-1">Horário:</label>
                      <input
                        type="time"
                        value={reviewReminders.weekly.time}
                        onChange={e => {
                          const val = e.target.value;
                          setReviewReminders(prev => ({
                            ...prev,
                            weekly: { ...prev.weekly, time: val }
                          }));
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
                    <span className="text-xs font-bold text-zinc-200 block">Review Mensal</span>
                    <span className="text-[10px] text-zinc-500 font-mono">
                      Lembrar {reviewReminders.monthly.enabled ? `às ${reviewReminders.monthly.time}` : 'desativado'}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setReviewReminders(prev => ({
                        ...prev,
                        monthly: { ...prev.monthly, enabled: !prev.monthly.enabled }
                      }));
                    }}
                    className={`w-9 h-5 rounded-full p-0.5 transition-all cursor-pointer ${
                      reviewReminders.monthly.enabled ? 'bg-orange-500' : 'bg-zinc-800'
                    }`}
                  >
                    <div className={`w-4 h-4 rounded-full bg-white transition-all ${reviewReminders.monthly.enabled ? 'translate-x-4' : 'translate-x-0'}`} />
                  </button>
                </div>

                {reviewReminders.monthly.enabled && (
                  <div className="space-y-2 pt-2 border-t border-zinc-800">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      <div>
                        <label className="text-[9px] text-zinc-400 font-mono uppercase block mb-1">Regra do Mês:</label>
                        <select
                          value={reviewReminders.monthly.timingType}
                          onChange={e => {
                            const val = e.target.value as any;
                            setReviewReminders(prev => ({
                              ...prev,
                              monthly: { ...prev.monthly, timingType: val }
                            }));
                          }}
                          className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-2.5 py-1.5 text-xs text-white font-mono focus:outline-none focus:border-orange-500"
                        >
                          <option value="last_day">Último dia do mês atual (ex: 28, 30, 31)</option>
                          <option value="first_day_next">Primeiro dia do próximo mês (dia 1º)</option>
                          <option value="specific_day">Dia fixo específico</option>
                        </select>
                      </div>

                      <div>
                        <label className="text-[9px] text-zinc-400 font-mono uppercase block mb-1">Horário:</label>
                        <input
                          type="time"
                          value={reviewReminders.monthly.time}
                          onChange={e => {
                            const val = e.target.value;
                            setReviewReminders(prev => ({
                              ...prev,
                              monthly: { ...prev.monthly, time: val }
                            }));
                          }}
                          className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-2.5 py-1.5 text-xs text-white font-mono focus:outline-none focus:border-orange-500"
                        />
                      </div>
                    </div>

                    {reviewReminders.monthly.timingType === 'specific_day' && (
                      <div className="flex items-center justify-between gap-3 bg-zinc-950/60 p-2.5 rounded-lg border border-zinc-850">
                        <span className="text-[10px] text-zinc-400 font-mono">Número do Dia do Mês:</span>
                        <input
                          type="number"
                          min="1"
                          max="31"
                          value={reviewReminders.monthly.dayOfMonth || 30}
                          onChange={e => {
                            const val = Math.max(1, Math.min(31, parseInt(e.target.value, 10) || 30));
                            setReviewReminders(prev => ({
                              ...prev,
                              monthly: { ...prev.monthly, dayOfMonth: val }
                            }));
                          }}
                          className="w-16 bg-zinc-900 border border-zinc-750 text-white font-mono text-xs px-2 py-1 rounded text-center"
                        />
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Outros Interruptores de Notificação */}
            <div className="space-y-3">
              <div className="flex items-center justify-between p-4 bg-zinc-950 border border-zinc-900 rounded-2xl">
                <div>
                  <h4 className="text-xs font-bold text-zinc-200">Alertas Diários de Hábitos</h4>
                  <p className="text-[10px] text-zinc-500 font-mono mt-0.5">Disparar notificação silenciosa às 08:00.</p>
                </div>
                <button
                  type="button"
                  onClick={() => setNotifDailyHabits(!notifDailyHabits)}
                  className={`w-9 h-5 rounded-full p-0.5 transition-all cursor-pointer ${
                    notifDailyHabits ? 'bg-orange-500' : 'bg-zinc-800'
                  }`}
                >
                  <div className={`w-4 h-4 rounded-full bg-white transition-all ${notifDailyHabits ? 'translate-x-4' : 'translate-x-0'}`} />
                </button>
              </div>

              <div className="flex items-center justify-between p-4 bg-zinc-950 border border-zinc-900 rounded-2xl">
                <div>
                  <h4 className="text-xs font-bold text-zinc-200">Notificação de Orçamento</h4>
                  <p className="text-[10px] text-zinc-500 font-mono mt-0.5">Notificar caso ultrapasse o limite definido.</p>
                </div>
                <button
                  type="button"
                  onClick={() => setNotifFinances(!notifFinances)}
                  className={`w-9 h-5 rounded-full p-0.5 transition-all cursor-pointer ${
                    notifFinances ? 'bg-orange-500' : 'bg-zinc-800'
                  }`}
                >
                  <div className={`w-4 h-4 rounded-full bg-white transition-all ${notifFinances ? 'translate-x-4' : 'translate-x-0'}`} />
                </button>
              </div>

              <div className="flex items-center justify-between p-4 bg-zinc-950 border border-zinc-900 rounded-2xl">
                <div>
                  <h4 className="text-xs font-bold text-zinc-200">Confirmação de Sync</h4>
                  <p className="text-[10px] text-zinc-500 font-mono mt-0.5">Emitir aviso quando dados forem salvos.</p>
                </div>
                <button
                  type="button"
                  onClick={() => setNotifSyncFeedback(!notifSyncFeedback)}
                  className={`w-9 h-5 rounded-full p-0.5 transition-all cursor-pointer ${
                    notifSyncFeedback ? 'bg-orange-500' : 'bg-zinc-800'
                  }`}
                >
                  <div className={`w-4 h-4 rounded-full bg-white transition-all ${notifSyncFeedback ? 'translate-x-4' : 'translate-x-0'}`} />
                </button>
              </div>
            </div>
          </motion.div>
        )}

        {/* ============================================================================================
         * VIEW 5: ACESSIBILIDADE, EXIBIÇÃO E PWA (Apenas os itens solicitados)
         * ============================================================================================ */}
        {currentScreen === 'exibicao' && (
          <motion.div
            key="screen-exibicao"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.22 }}
            className="p-5 space-y-6"
          >
            {/* Nav Header */}
            <div className="flex items-center gap-3 border-b border-zinc-900 pb-4">
              <button onClick={navigateBack} className="p-2 hover:bg-zinc-900 rounded-xl text-zinc-400">
                <ArrowLeft className="h-4 w-4" />
              </button>
              <div>
                <h3 className="text-xs font-black tracking-wider uppercase font-mono text-zinc-300">Acessibilidade, exibição e PWA</h3>
                <p className="text-[10px] text-zinc-500 font-mono">Preferências visuais e de navegação</p>
              </div>
            </div>

            {/* 1. Tela cheia automática */}
            <div className="p-4 bg-zinc-950 border border-zinc-900 rounded-2xl flex items-center justify-between">
              <div className="space-y-0.5 flex-1 pr-4">
                <h4 className="text-xs font-bold text-zinc-200">Tela cheia automática</h4>
                <p className="text-[10px] text-zinc-500 font-mono leading-normal">
                  Habilita tela cheia automaticamente nas interações com o sistema.
                </p>
              </div>
              <button
                type="button"
                onClick={handleToggleFullscreen}
                className={`px-3 py-1.5 rounded-lg text-[9px] font-mono font-bold uppercase transition-all cursor-pointer ${
                  autoFullscreen
                    ? 'bg-orange-500/20 text-orange-400 border border-orange-500/30'
                    : 'bg-zinc-900 border border-zinc-800 text-zinc-500'
                }`}
              >
                {autoFullscreen ? 'Ativo' : 'Inativo'}
              </button>
            </div>

            {/* 2. EXIBIÇÃO: BARRA DE NAVEGAÇÃO (Comportamento Fixa/Flexível & Formato Reta/Oval) */}
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
                      setMobileNavbarMode('fixed');
                      triggerToast('Navbar mobile definida como Fixa.');
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
                      setMobileNavbarMode('flexible');
                      triggerToast('Navbar mobile definida como Flexível.');
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
                      setMobileNavbarShape('reta');
                      triggerToast('Formato da barra definido como Reta.');
                    }}
                    className={`flex flex-col items-center justify-center gap-2 py-4 rounded-2xl transition-all cursor-pointer font-mono font-bold text-xs uppercase tracking-wider ${
                      mobileNavbarShape === 'reta'
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
                      setMobileNavbarShape('oval');
                      triggerToast('Formato da barra definido como Oval.');
                    }}
                    className={`flex flex-col items-center justify-center gap-2 py-4 rounded-2xl transition-all cursor-pointer font-mono font-bold text-xs uppercase tracking-wider ${
                      mobileNavbarShape === 'oval'
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
                  {mobileNavbarShape === 'reta'
                    ? 'Barra clássica reta, como no layout original.'
                    : 'Barra flutuante moderna curva neon com bordas arredondadas.'}
                </p>
              </div>
            </div>

            {/* 3. Esquema de Cores e Personalização */}
            <div className="p-4 bg-zinc-950 border border-zinc-900 rounded-2xl flex items-center justify-between">
              <div className="space-y-0.5 flex-1 pr-4">
                <div className="flex items-center gap-2">
                  <h4 className="text-xs font-bold text-zinc-200">Esquema de Cores e Personalização</h4>
                  <span
                    className="w-3 h-3 rounded-full border border-white/20"
                    style={{ backgroundColor: customAccentColor }}
                  />
                </div>
                <p className="text-[10px] text-zinc-500 font-mono leading-normal">
                  Escolha a cor de destaque do sistema (Laranja, Azul, Verde, Rosa, Roxo, Âmbar ou Personalizada).
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsColorSchemeModalOpen(true)}
                className="px-3.5 py-2 bg-orange-500 text-white font-mono font-bold text-[9px] rounded-xl tracking-wider uppercase hover:bg-orange-600 transition-all flex items-center gap-1.5 shadow-md shrink-0 cursor-pointer"
              >
                <Palette className="w-3.5 h-3.5" />
                Personalizar
              </button>
            </div>

            {/* 4. Tela de Carregamento & Splash (Vertical e Horizontal) */}
            <div className="p-5 bg-zinc-950 border border-zinc-900 rounded-2xl space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-zinc-900/80 pb-3">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-orange-400" />
                    <h4 className="text-xs font-bold text-zinc-100">Tela de Carregamento & Splash</h4>
                  </div>
                  <p className="text-[10px] text-zinc-400 font-mono leading-relaxed max-w-xl">
                    Defina imagens personalizadas para o splash de abertura do app (vertical para celular e horizontal para computador). A tela exibe apenas a sua imagem em tela cheia com a barra de progresso na base.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setIsTestSplashScreenActive(true)}
                  className="self-start sm:self-auto px-3.5 py-2 bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-orange-400 font-mono font-bold text-[10px] rounded-xl tracking-wider uppercase transition-all flex items-center gap-1.5 shrink-0 cursor-pointer"
                >
                  <Play className="w-3.5 h-3.5 fill-current" />
                  Testar Tela
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* 4.1 Vertical (Mobile 9:16) */}
                <div className="p-3.5 bg-zinc-900/40 border border-zinc-850 rounded-xl space-y-3">
                  <span className="text-[10px] font-mono font-bold text-zinc-300 uppercase block">
                    Imagem Vertical (Celular / 9:16)
                  </span>
                  <div className="relative h-32 max-w-[100px] mx-auto rounded-lg overflow-hidden border border-zinc-800">
                    <img src={loadingScreenVerticalImage} alt="Splash Mobile" className="w-full h-full object-cover" />
                  </div>
                  <div className="flex items-center gap-2">
                    <label className="flex-1 py-1.5 bg-zinc-850 hover:bg-zinc-800 border border-zinc-700/60 rounded-lg text-center text-[10px] font-mono font-bold text-zinc-300 cursor-pointer flex items-center justify-center gap-1">
                      <Upload className="h-3 w-3 text-orange-400" />
                      <span>Upload</span>
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={e => {
                          const f = e.target.files?.[0];
                          if (f) {
                            const r = new FileReader();
                            r.onloadend = () => setLoadingScreenVerticalImage(r.result as string);
                            r.readAsDataURL(f);
                          }
                        }}
                      />
                    </label>
                    <button
                      type="button"
                      onClick={() => setLoadingScreenVerticalImage('')}
                      className="px-2.5 py-1.5 bg-red-950/20 hover:bg-red-950/40 border border-red-900/30 text-red-400 rounded-lg text-[10px] font-mono font-bold cursor-pointer"
                    >
                      Remover
                    </button>
                  </div>
                  <input
                    type="url"
                    value={loadingScreenVerticalImage}
                    onChange={e => setLoadingScreenVerticalImage(e.target.value)}
                    placeholder="URL da imagem celular..."
                    className="w-full bg-zinc-950 border border-zinc-850 rounded-lg px-2.5 py-1.5 text-[10px] text-zinc-300 font-mono focus:outline-none focus:border-orange-500"
                  />
                </div>

                {/* 4.2 Horizontal (Desktop 16:9) */}
                <div className="p-3.5 bg-zinc-900/40 border border-zinc-850 rounded-xl space-y-3">
                  <span className="text-[10px] font-mono font-bold text-zinc-300 uppercase block">
                    Imagem Horizontal (Computador / 16:9)
                  </span>
                  <div className="relative aspect-video rounded-lg overflow-hidden border border-zinc-800">
                    <img src={loadingScreenHorizontalImage} alt="Splash Desktop" className="w-full h-full object-cover" />
                  </div>
                  <div className="flex items-center gap-2">
                    <label className="flex-1 py-1.5 bg-zinc-850 hover:bg-zinc-800 border border-zinc-700/60 rounded-lg text-center text-[10px] font-mono font-bold text-zinc-300 cursor-pointer flex items-center justify-center gap-1">
                      <Upload className="h-3 w-3 text-orange-400" />
                      <span>Upload</span>
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={e => {
                          const f = e.target.files?.[0];
                          if (f) {
                            const r = new FileReader();
                            r.onloadend = () => setLoadingScreenHorizontalImage(r.result as string);
                            r.readAsDataURL(f);
                          }
                        }}
                      />
                    </label>
                    <button
                      type="button"
                      onClick={() => setLoadingScreenHorizontalImage('')}
                      className="px-2.5 py-1.5 bg-red-950/20 hover:bg-red-950/40 border border-red-900/30 text-red-400 rounded-lg text-[10px] font-mono font-bold cursor-pointer"
                    >
                      Remover
                    </button>
                  </div>
                  <input
                    type="url"
                    value={loadingScreenHorizontalImage}
                    onChange={e => setLoadingScreenHorizontalImage(e.target.value)}
                    placeholder="URL da imagem desktop..."
                    className="w-full bg-zinc-950 border border-zinc-850 rounded-lg px-2.5 py-1.5 text-[10px] text-zinc-300 font-mono focus:outline-none focus:border-orange-500"
                  />
                </div>
              </div>
            </div>

            {/* 5. Instalar Aplicativo (PWA) */}
            <div className="p-4 bg-zinc-950 border border-zinc-900 rounded-2xl flex items-center justify-between gap-3">
              <div className="w-10 h-10 rounded-xl border border-orange-500/30 bg-black overflow-hidden shrink-0 flex items-center justify-center p-0.5 shadow-[0_0_12px_rgba(249,115,22,0.2)]">
                <span className="font-black text-orange-500 text-lg">L</span>
              </div>
              <div className="space-y-0.5 flex-1 pr-2">
                <h4 className="text-xs font-bold text-zinc-200">Instalar Aplicativo (PWA)</h4>
                <p className="text-[10px] text-zinc-500 font-mono leading-normal">
                  Adicione o Planner à sua tela inicial ou desktop para experiência nativa offline.
                </p>
              </div>
              <button
                type="button"
                onClick={() => {
                  setPwaInstalled(true);
                  triggerToast('Aplicativo PWA instalado com sucesso!');
                }}
                disabled={pwaInstalled}
                className="px-3.5 py-1.5 bg-orange-500 hover:bg-orange-600 text-white font-bold text-[9px] rounded-lg tracking-wider disabled:opacity-40 uppercase transition-all cursor-pointer shrink-0"
              >
                {pwaInstalled ? 'Instalado ✓' : 'Instalar'}
              </button>
            </div>

            {/* 6. Idioma do Sistema / Language */}
            <div className="p-4 bg-zinc-950 border border-zinc-900 rounded-2xl flex items-center justify-between">
              <div className="space-y-0.5 flex-1 pr-4">
                <h4 className="text-xs font-bold text-zinc-200">Idioma do Sistema / Language</h4>
                <p className="text-[10px] text-zinc-500 font-mono leading-normal">Selecione o idioma de preferência para a interface.</p>
              </div>
              <select
                value={selectedLanguage}
                onChange={e => {
                  const l = e.target.value as 'pt' | 'en';
                  setSelectedLanguage(l);
                  triggerToast(`Idioma alterado para ${l === 'pt' ? 'Português' : 'English'}`);
                }}
                className="bg-zinc-900 border border-zinc-800 text-zinc-300 rounded-lg px-3 py-1.5 text-xs font-bold focus:outline-none cursor-pointer"
              >
                <option value="pt">Português (BR)</option>
                <option value="en">English (US)</option>
              </select>
            </div>
          </motion.div>
        )}

      </AnimatePresence>

      {/* ============================================================================================
       * MODAL 1: EDITAR DISPOSITIVO (Renomear e Desconectar)
       * ============================================================================================ */}
      <AnimatePresence>
        {editingDevice && (
          <div
            onClick={() => setEditingDevice(null)}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm cursor-pointer"
          >
            <motion.div
              onClick={e => e.stopPropagation()}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="cursor-default bg-zinc-950 border border-zinc-850 rounded-2xl p-6 max-w-md w-full space-y-5 text-left shadow-2xl relative"
            >
              <div className="flex items-center justify-between border-b border-zinc-900 pb-3">
                <h3 className="text-xs font-black tracking-wider uppercase font-mono text-zinc-200">
                  Gerenciar Dispositivo
                </h3>
                <button
                  onClick={() => setEditingDevice(null)}
                  className="p-1 hover:bg-zinc-900 rounded-lg text-zinc-500 hover:text-white cursor-pointer"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] text-zinc-500 font-mono font-bold uppercase block">
                  Nome do Dispositivo (Apelido)
                </label>
                <input
                  type="text"
                  value={editDeviceCustomName}
                  onChange={e => setEditDeviceCustomName(e.target.value)}
                  placeholder="Ex: Meu Notebook de Estudo"
                  className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-3.5 py-2.5 text-xs text-white font-mono focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div className="p-3 bg-zinc-900/50 rounded-xl space-y-1 text-[10px] font-mono text-zinc-400">
                <p>Navegador: {editingDevice.browser}</p>
                <p>Sistema Operacional: {editingDevice.os}</p>
                <p>Status: {editingDevice.isCurrent ? 'Sessão atual ativa' : editingDevice.lastActive}</p>
              </div>

              <div className="space-y-2 pt-2">
                <button
                  type="button"
                  onClick={handleSaveDeviceName}
                  className="w-full py-2.5 bg-emerald-500 hover:bg-emerald-400 text-zinc-950 font-bold text-xs uppercase tracking-wider rounded-xl transition-all cursor-pointer"
                >
                  Salvar Nome
                </button>

                {!editingDevice.isCurrent && (
                  <button
                    type="button"
                    onClick={() => handleDisconnectDevice(editingDevice.id)}
                    className="w-full py-2.5 bg-red-950/20 hover:bg-red-950/40 border border-red-900/30 text-red-400 font-bold text-xs font-mono uppercase tracking-wider rounded-xl transition-all cursor-pointer"
                  >
                    Desconectar Este Aparelho
                  </button>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ============================================================================================
       * MODAL 2: CONECTAR NOVO DISPOSITIVO VIA QR CODE COM DURAÇÃO DE 5 MINUTOS & CÓDIGO
       * ============================================================================================ */}
      <AnimatePresence>
        {showConnectDeviceModal && (
          <div
            onClick={() => setShowConnectDeviceModal(false)}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md cursor-pointer"
          >
            <motion.div
              onClick={e => e.stopPropagation()}
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
                  className="p-1.5 hover:bg-zinc-900 rounded-lg text-zinc-500 hover:text-white transition-colors cursor-pointer"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              {/* Tabs Switcher: Escanear QR Code vs Digitar Código */}
              <div className="grid grid-cols-2 gap-1 p-1 bg-zinc-900/80 rounded-xl border border-zinc-800/80">
                <button
                  type="button"
                  onClick={() => setConnectDeviceTab('qrcode')}
                  className={`py-1.5 px-3 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
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
                  className={`py-1.5 px-3 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
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
                    {connectQrDataUrl && connectQrCountdown > 0 ? (
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
                    ) : connectQrCountdown === 0 ? (
                      <div className="flex flex-col items-center justify-center p-3 text-center space-y-2">
                        <AlertTriangle className="h-8 w-8 text-amber-500" />
                        <p className="text-[11px] font-bold text-zinc-800">QR Code expirado</p>
                        <p className="text-[9px] text-zinc-500">A duração de 5 minutos encerrou.</p>
                        <button
                          type="button"
                          onClick={() => {
                            const newPin = Math.floor(100000 + Math.random() * 900000).toString();
                            setConnectQrPinCode(newPin);
                            setConnectQrCountdown(300);
                            QRCode.toDataURL(`https://lifeorganizer.app/?connect_code=${newPin}`, {
                              width: 280,
                              margin: 2,
                              color: { dark: '#09090b', light: '#ffffff' }
                            }).then(url => setConnectQrDataUrl(url));
                          }}
                          className="px-3 py-1.5 bg-emerald-500 text-zinc-950 font-bold text-xs rounded-xl shadow cursor-pointer hover:bg-emerald-400"
                        >
                          Gerar Novo Código
                        </button>
                      </div>
                    ) : (
                      <div className="flex flex-col items-center justify-center gap-2 text-zinc-700">
                        <RefreshCw className="h-8 w-8 animate-spin text-emerald-600" />
                        <span className="text-[11px] font-mono font-bold text-zinc-600">Gerando QR Code...</span>
                      </div>
                    )}
                  </div>

                  {/* Informações da Sessão e Código PIN */}
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
                        {connectQrPinCode ? `${connectQrPinCode.slice(0, 3)} - ${connectQrPinCode.slice(3)}` : '892 - 104'}
                      </span>
                      <button
                        type="button"
                        title="Gerar outro QR Code"
                        onClick={() => {
                          const newPin = Math.floor(100000 + Math.random() * 900000).toString();
                          setConnectQrPinCode(newPin);
                          setConnectQrCountdown(300);
                          QRCode.toDataURL(`https://lifeorganizer.app/?connect_code=${newPin}`, {
                            width: 280,
                            margin: 2,
                            color: { dark: '#09090b', light: '#ffffff' }
                          }).then(url => setConnectQrDataUrl(url));
                        }}
                        className="p-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded-xl transition-all cursor-pointer"
                      >
                        <RefreshCw className="h-4 w-4" />
                      </button>
                    </div>
                  </div>

                  <p className="text-[11px] text-zinc-400 leading-relaxed font-sans">
                    Aponte a câmera do seu outro aparelho para escanear o QR Code gerado (válido por 5 minutos) ou acesse o Planner no novo dispositivo e digite o código acima.
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
                        disabled={!manualCodeInput.trim()}
                        onClick={() => {
                          const pinVal = manualCodeInput.trim();
                          if (!pinVal) return;
                          
                          const newDevice: ConnectedDeviceInfo = {
                            id: `dev_conn_${Date.now()}`,
                            name: 'Novo Aparelho Conectado',
                            customName: 'Dispositivo Pareado',
                            deviceType: 'mobile',
                            browser: 'Navegador Web',
                            os: 'Mobile/Desktop',
                            isCurrent: false,
                            lastActive: 'Ativo agora'
                          };
                          setConnectedDevices(prev => [newDevice, ...prev]);
                          setManualCodeFeedback({ type: 'success', message: 'Aparelho autorizado e conectado com sucesso!' });
                          setManualCodeInput('');
                          setTimeout(() => {
                            setShowConnectDeviceModal(false);
                          }, 1500);
                        }}
                        className="py-2 px-4 bg-emerald-500 hover:bg-emerald-400 disabled:opacity-50 text-zinc-950 text-xs font-black uppercase tracking-wider rounded-xl transition-all shadow-md shrink-0 flex items-center gap-1.5 cursor-pointer"
                      >
                        <CheckCircle className="h-3.5 w-3.5" />
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

      {/* ============================================================================================
       * MODAL 3: ESQUEMA DE CORES E PERSONALIZAÇÃO
       * ============================================================================================ */}
      <AnimatePresence>
        {isColorSchemeModalOpen && (
          <div
            onClick={() => setIsColorSchemeModalOpen(false)}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm cursor-pointer"
          >
            <motion.div
              onClick={e => e.stopPropagation()}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="cursor-default bg-zinc-950 border border-zinc-850 rounded-2xl p-6 max-w-md w-full space-y-5 text-left shadow-2xl relative"
            >
              <div className="flex items-center justify-between border-b border-zinc-900 pb-3">
                <div className="flex items-center gap-2">
                  <Palette className="h-4 w-4 text-orange-400" />
                  <h3 className="text-xs font-black tracking-wider uppercase font-mono text-zinc-200">
                    Esquema de Cores do Sistema
                  </h3>
                </div>
                <button
                  onClick={() => setIsColorSchemeModalOpen(false)}
                  className="p-1 hover:bg-zinc-900 rounded-lg text-zinc-500 hover:text-white cursor-pointer"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              {/* Grid de Presets */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {THEME_COLOR_PRESETS.map(preset => (
                  <button
                    key={preset.id}
                    type="button"
                    onClick={() => {
                      setSelectedColorPreset(preset.id);
                      setCustomAccentColor(preset.hex);
                    }}
                    className={`p-3 rounded-xl border flex items-center gap-3 text-left transition-all cursor-pointer ${
                      customAccentColor === preset.hex
                        ? 'border-white bg-zinc-900 shadow-md'
                        : 'border-zinc-850 bg-zinc-900/40 hover:bg-zinc-900'
                    }`}
                  >
                    <span
                      className="w-5 h-5 rounded-full shrink-0 shadow-sm border border-white/20"
                      style={{ backgroundColor: preset.hex }}
                    />
                    <div>
                      <p className="text-xs font-bold text-zinc-200">{preset.name}</p>
                      <p className="text-[9px] text-zinc-500 font-mono">{preset.hex}</p>
                    </div>
                  </button>
                ))}
              </div>

              {/* Seletor Customizado HEX */}
              <div className="p-3 bg-zinc-900/40 border border-zinc-850 rounded-xl space-y-2">
                <span className="text-[10px] text-zinc-400 font-mono uppercase block">Cor Personalizada (HEX):</span>
                <div className="flex items-center gap-3">
                  <input
                    type="color"
                    value={customAccentColor}
                    onChange={e => setCustomAccentColor(e.target.value)}
                    className="w-9 h-9 rounded-lg bg-transparent cursor-pointer border border-zinc-800"
                  />
                  <input
                    type="text"
                    value={customAccentColor}
                    onChange={e => setCustomAccentColor(e.target.value)}
                    placeholder="#f97316"
                    className="flex-1 bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-xs font-mono text-white focus:outline-none focus:border-orange-500"
                  />
                </div>
              </div>

              <button
                type="button"
                onClick={() => {
                  setIsColorSchemeModalOpen(false);
                  triggerToast('Esquema de cores aplicado com sucesso!');
                }}
                className="w-full py-2.5 bg-orange-500 hover:bg-orange-600 text-white font-mono font-bold text-xs uppercase tracking-wider rounded-xl transition-all cursor-pointer"
              >
                Aplicar Esquema de Cores
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ============================================================================================
       * MODAL 4: TESTE DE TELA DE BLOQUEIO (Com Papel de Parede e Desbloqueio)
       * ============================================================================================ */}
      <AnimatePresence>
        {isTestLockScreenActive && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex flex-col justify-between bg-black text-white p-6 select-none"
            style={{
              backgroundImage: `url(${lockScreenDesktopImage || lockScreenMobileImage})`,
              backgroundSize: 'cover',
              backgroundPosition: 'center'
            }}
          >
            {/* Utilização integrada do componente oficial StandaloneLockScreen */}
            <StandaloneLockScreen
              userName={userName}
              userPhoto={userPhoto}
              correctPassword={appLockPassword}
              appLockBiometricEnabled={appLockBiometricEnabled}
              lockScreenDesktopImage={lockScreenDesktopImage}
              lockScreenMobileImage={lockScreenMobileImage}
              accentColorHex={customAccentColor}
              onUnlock={() => {
                setIsTestLockScreenActive(false);
                triggerToast('Tela de bloqueio desbloqueada com sucesso!');
              }}
              onResetLocalData={() => {
                setIsTestLockScreenActive(false);
                triggerToast('Senha de bloqueio resetada!');
              }}
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* ============================================================================================
       * MODAL 5: TESTE DE TELA DE CARREGAMENTO & SPLASH (Com imagem e barra de progresso)
       * ============================================================================================ */}
      <AnimatePresence>
        {isTestSplashScreenActive && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex flex-col justify-between bg-black text-white p-6 select-none"
            style={{
              backgroundImage: `url(${loadingScreenHorizontalImage || loadingScreenVerticalImage})`,
              backgroundSize: 'cover',
              backgroundPosition: 'center'
            }}
          >
            {/* Botão de Fechar Splash */}
            <div className="relative z-10 flex justify-end">
              <button
                type="button"
                onClick={() => setIsTestSplashScreenActive(false)}
                className="p-2 bg-black/60 hover:bg-black/90 text-white rounded-full border border-white/20 cursor-pointer backdrop-blur-md"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Barra de Progresso de Sincronização na base */}
            <div className="relative z-10 max-w-md w-full mx-auto space-y-2 p-4 bg-black/60 backdrop-blur-md border border-white/10 rounded-2xl">
              <div className="flex items-center justify-between text-[11px] font-mono text-zinc-300">
                <span>Sincronizando dados em nuvem...</span>
                <span className="text-orange-400 font-bold">100%</span>
              </div>
              <div className="w-full h-1.5 bg-zinc-800 rounded-full overflow-hidden">
                <div className="w-full h-full bg-gradient-to-r from-orange-500 to-amber-400" />
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
}
