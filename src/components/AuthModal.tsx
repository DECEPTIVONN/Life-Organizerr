import React, { useState, useEffect } from 'react';
import QRCode from 'qrcode';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Mail, 
  Lock, 
  ArrowLeft, 
  ShieldCheck, 
  AlertCircle, 
  Loader2, 
  CheckCircle2, 
  Check,
  Link2,
  QrCode,
  Smartphone,
  RefreshCw,
  Clock,
  User,
  UserPlus,
  Eye,
  EyeOff,
  Sparkles,
  KeyRound,
  X,
  FlaskConical
} from 'lucide-react';
import { 
  registerWithEmail, 
  loginWithEmailOrUsername, 
  loginWithGoogleProfile, 
  loginWithTestAccount,
  isUsernameAvailable, 
  recoverAccountByEmail,
  createQrLoginSession,
  checkQrLoginSessionStatus,
  QrLoginSession,
  AuthUser 
} from '../lib/auth';
import { saveGoogleOAuthTokens } from '../utils/googleToken';

interface AuthModalProps {
  isOpen: boolean;
  onSuccess: (user: AuthUser, rememberMe: boolean) => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({ isOpen, onSuccess }) => {
  // Mode is 'welcome', 'login', 'signup', 'forgot', or 'qrcode'
  const [mode, setMode] = useState<'welcome' | 'login' | 'signup' | 'forgot' | 'qrcode'>('welcome');
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);

  // Account recovery states
  const [recoveryEmail, setRecoveryEmail] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [foundAccount, setFoundAccount] = useState<{ username: string; syncKey: string; user?: AuthUser } | null>(null);
  const [recoverySuccessMsg, setRecoverySuccessMsg] = useState<string | null>(null);

  // QR Code Login states
  const [qrSession, setQrSession] = useState<QrLoginSession | null>(null);
  const [qrDataUrl, setQrDataUrl] = useState<string>('');
  const [qrTimer, setQrTimer] = useState<number>(300); // 5 minutes (300 seconds)

  // Link existing account states
  const [linkSyncKeyInput, setLinkSyncKeyInput] = useState('');
  const [showLinkSection, setShowLinkSection] = useState(false);

  // Legal Modal states (Terms & Privacy)
  const [activeLegalModal, setActiveLegalModal] = useState<'terms' | 'privacy' | null>(null);

  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [usernameStatus, setUsernameStatus] = useState<'idle' | 'checking' | 'available' | 'taken'>('idle');

  // Initialize and handle QR Code Login session
  const startQrLogin = async () => {
    setMode('qrcode');
    setErrorMsg(null);
    setLoading(true);
    try {
      const session = await createQrLoginSession();
      setQrSession(session);
      setQrTimer(300);

      const qrPayload = `${window.location.origin}/?qr_session=${session.sessionId}`;
      const url = await QRCode.toDataURL(qrPayload, {
        width: 260,
        margin: 2,
        color: {
          dark: '#09090b',
          light: '#ffffff'
        }
      });
      setQrDataUrl(url);
    } catch (err) {
      console.error("Error generating QR Code:", err);
      setErrorMsg('Não foi possível gerar o código QR. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  // QR Timer Countdown & Live Status Polling Effect
  useEffect(() => {
    if (mode !== 'qrcode' || !qrSession) return;

    const timerInterval = setInterval(() => {
      setQrTimer((prev) => {
        if (prev <= 1) {
          clearInterval(timerInterval);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    const pollInterval = setInterval(async () => {
      if (qrSession?.sessionId) {
        const updated = await checkQrLoginSessionStatus(qrSession.sessionId);
        if (updated) {
          if (updated.status === 'authorized' && updated.user) {
            clearInterval(pollInterval);
            clearInterval(timerInterval);
            onSuccess(updated.user, rememberMe);
          } else if (updated.status === 'expired') {
            clearInterval(pollInterval);
          }
        }
      }
    }, 1500);

    return () => {
      clearInterval(timerInterval);
      clearInterval(pollInterval);
    };
  }, [mode, qrSession, onSuccess, rememberMe]);

  if (!isOpen) return null;

  // Format MM:SS for countdown timer
  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60).toString().padStart(2, '0');
    const s = (secs % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  // Handle live username uniqueness check when typing in signup mode
  const handleUsernameChange = async (val: string) => {
    const raw = val.replace(/^@/, '');
    setUsername(raw);
    setErrorMsg(null);

    if (mode === 'signup') {
      if (raw.trim().length >= 3) {
        setUsernameStatus('checking');
        const avail = await isUsernameAvailable(raw);
        setUsernameStatus(avail ? 'available' : 'taken');
      } else {
        setUsernameStatus('idle');
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setLoading(true);

    try {
      if (mode === 'signup') {
        if (!username.trim() || !email.trim() || !password.trim()) {
          setErrorMsg('Por favor, preencha todos os campos.');
          setLoading(false);
          return;
        }

        const res = await registerWithEmail(username, email, password);
        if (!res.ok || !res.user) {
          setErrorMsg(res.message || 'Erro ao criar conta.');
        } else {
          onSuccess(res.user, rememberMe);
        }
      } else if (mode === 'login') {
        if (!email.trim() || !password.trim()) {
          setErrorMsg('Por favor, preencha seu e-mail/usuário e senha.');
          setLoading(false);
          return;
        }

        const res = await loginWithEmailOrUsername(email, password);
        if (!res.ok || !res.user) {
          setErrorMsg(res.message || 'Erro ao fazer login.');
        } else {
          onSuccess(res.user, rememberMe);
        }
      }
    } catch (err: any) {
      setErrorMsg('Ocorreu um erro ao processar. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  const handleRecoverSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setRecoverySuccessMsg(null);
    setLoading(true);

    try {
      const res = await recoverAccountByEmail(recoveryEmail, newPassword);
      if (!res.ok) {
        setErrorMsg(res.message || 'Erro ao localizar conta.');
        setFoundAccount(null);
      } else {
        setFoundAccount({
          username: res.username || '',
          syncKey: res.syncKey || '',
          user: res.user
        });
        setRecoverySuccessMsg(res.message || 'Conta localizada com sucesso!');

        if (newPassword.trim() && res.user) {
          onSuccess(res.user, rememberMe);
        }
      }
    } catch (err) {
      setErrorMsg('Erro ao tentar recuperar conta.');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async (overrideLinkKey?: string) => {
    setErrorMsg(null);
    setLoading(true);

    try {
      const redirectUri = `${window.location.origin}/auth/callback`;
      const res = await fetch(`/api/auth/google/url?redirect_uri=${encodeURIComponent(redirectUri)}&scope=calendar`);
      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        throw new Error(data.error || 'Não foi possível gerar URL do Google OAuth.');
      }

      const { url } = data;
      if (!url) {
        throw new Error('URL de autenticação do Google não recebida.');
      }

      const handleMessage = async (event: MessageEvent) => {
        const origin = event.origin;
        if (event.origin !== window.location.origin && !origin.endsWith('.run.app') && !origin.includes('localhost')) {
          return;
        }

        if (event.data?.type === 'GOOGLE_OAUTH_SUCCESS' && event.data?.profile) {
          window.removeEventListener('message', handleMessage);
          const profile = event.data.profile;
          const tokens = event.data.tokens;

          saveGoogleOAuthTokens(tokens, profile);

          const localKey = localStorage.getItem('mbc_sync_key');
          const validLocalKey = (localKey && localKey !== 'USUARIO_UNICO' && localKey.trim()) ? localKey.trim() : undefined;
          const keyToLink = (typeof overrideLinkKey === 'string' && overrideLinkKey.trim())
            ? overrideLinkKey.trim()
            : (linkSyncKeyInput.trim() || validLocalKey);

          const loginRes = await loginWithGoogleProfile(
            {
              email: profile.email,
              name: profile.name,
              picture: profile.picture
            },
            keyToLink
          );

          if (loginRes.ok && loginRes.user) {
            onSuccess(loginRes.user, rememberMe);
          } else {
            setErrorMsg(loginRes.message || 'Erro ao autenticar com Google.');
          }
          setLoading(false);
        } else if (event.data?.type === 'GOOGLE_OAUTH_FAILURE') {
          window.removeEventListener('message', handleMessage);
          const errDetail = event.data?.error ? `: ${event.data.error}` : '';
          setErrorMsg(`Falha no login com Google${errDetail}. Verifique as URIs de redirecionamento autorizadas.`);
          setLoading(false);
        }
      };

      window.addEventListener('message', handleMessage);

      const width = 550;
      const height = 650;
      const left = window.screen.width / 2 - width / 2;
      const top = window.screen.height / 2 - height / 2;

      const popup = window.open(
        url,
        'google_auth_popup',
        `width=${width},height=${height},top=${top},left=${left},status=no,toolbar=no,menubar=no`
      );

      if (!popup) {
        window.location.href = url;
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Erro ao conectar com Google.');
      setLoading(false);
    }
  };

  const handleTestAccountLogin = async () => {
    setErrorMsg(null);
    setLoading(true);
    try {
      const res = await loginWithTestAccount();
      if (res.ok && res.user) {
        onSuccess(res.user, rememberMe);
      }
    } catch (err: any) {
      setErrorMsg('Erro ao entrar na conta teste.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[9999] w-full h-full flex flex-col justify-between bg-[#000000] overflow-y-auto no-scrollbar select-none text-white font-sans">
      {/* Curved Perspective Horizon Grid Background (Faithful to the Grok aesthetic) */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden z-0 flex items-center justify-center">
        {/* Subtle Dark Radial Atmosphere Glow */}
        <div className="absolute top-[38%] left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] sm:w-[900px] h-[340px] bg-gradient-to-b from-zinc-800/10 via-zinc-900/5 to-transparent rounded-full blur-3xl pointer-events-none" />

        {/* Dynamic Curved Wireframe Mesh SVG */}
        <div className="absolute top-[32%] sm:top-[30%] left-1/2 -translate-x-1/2 -translate-y-1/2 w-[1200px] sm:w-[1400px] h-[480px] pointer-events-none opacity-40">
          <svg viewBox="0 0 1400 480" className="w-full h-full" fill="none" preserveAspectRatio="none">
            <defs>
              <linearGradient id="horizonLineGlow" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#ffffff" stopOpacity="0" />
                <stop offset="25%" stopColor="#ffffff" stopOpacity="0.35" />
                <stop offset="50%" stopColor="#ffffff" stopOpacity="0.8" />
                <stop offset="75%" stopColor="#ffffff" stopOpacity="0.35" />
                <stop offset="100%" stopColor="#ffffff" stopOpacity="0" />
              </linearGradient>

              <linearGradient id="gridFadeY" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="#ffffff" stopOpacity="0.4" />
                <stop offset="35%" stopColor="#ffffff" stopOpacity="0.12" />
                <stop offset="100%" stopColor="#ffffff" stopOpacity="0.0" />
              </linearGradient>
            </defs>

            {/* Primary Curved Glowing Horizon Edge */}
            <path
              d="M -100 240 Q 700 130 1500 240"
              stroke="url(#horizonLineGlow)"
              strokeWidth="1.6"
              fill="none"
            />

            {/* Secondary Curved Rings (Perspective Compression) */}
            <path d="M -80 255 Q 700 155 1480 255" stroke="url(#gridFadeY)" strokeWidth="0.8" />
            <path d="M -60 274 Q 700 185 1460 274" stroke="url(#gridFadeY)" strokeWidth="0.75" />
            <path d="M -40 298 Q 700 220 1440 298" stroke="url(#gridFadeY)" strokeWidth="0.7" />
            <path d="M -20 327 Q 700 260 1420 327" stroke="url(#gridFadeY)" strokeWidth="0.65" />
            <path d="M 0 362 Q 700 305 1400 362" stroke="url(#gridFadeY)" strokeWidth="0.6" />
            <path d="M 20 405 Q 700 358 1380 405" stroke="url(#gridFadeY)" strokeWidth="0.55" />
            <path d="M 40 455 Q 700 418 1360 455" stroke="url(#gridFadeY)" strokeWidth="0.5" />

            {/* Perspective Longitude Lines Radiating Outward */}
            {Array.from({ length: 41 }).map((_, i) => {
              const xStart = 700 + (i - 20) * 32;
              const xEnd = 700 + (i - 20) * 68;
              return (
                <path
                  key={i}
                  d={`M ${xStart} 160 L ${xEnd} 480`}
                  stroke="url(#gridFadeY)"
                  strokeWidth="0.6"
                  opacity={1 - Math.abs(i - 20) * 0.035}
                />
              );
            })}
          </svg>
        </div>

        {/* Top subtle fade gradient */}
        <div className="absolute top-0 inset-x-0 h-40 bg-gradient-to-b from-black via-black/80 to-transparent pointer-events-none" />
        {/* Bottom smooth fade gradient */}
        <div className="absolute bottom-0 inset-x-0 h-64 bg-gradient-to-t from-black via-black/95 to-transparent pointer-events-none" />
      </div>

      {/* Main Content Area */}
      <div className="relative z-10 w-full flex-1 flex flex-col justify-between px-6 py-10 sm:py-14 max-w-lg mx-auto">
        {/* Top Header / Branding */}
        <div className="pt-8 sm:pt-14 pb-4 flex flex-col items-center text-center">
          <motion.div
            initial={{ opacity: 0, y: -12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
            className="flex flex-col items-center"
          >
            {/* Minimalist Bold Brand Title matching the Grok style */}
            <h1 className="text-4xl sm:text-5xl font-bold tracking-tight text-white font-sans drop-shadow-sm">
              Life Organizer
            </h1>

            {/* Subtitle in clean monospace / refined typography */}
            <p className="text-sm sm:text-[15px] text-zinc-400 font-mono tracking-wider mt-3 font-normal">
              Entenda sua jornada
            </p>
          </motion.div>
        </div>

        {/* Dynamic Views: Welcome (3 Pills), Login, Signup, QR Code, Recovery */}
        <div className="w-full my-auto py-4 flex flex-col items-center justify-center">
          <AnimatePresence mode="wait">
            {/* VIEW 1: WELCOME SCREEN (Sleek 3 Pills like in screenshot) */}
            {mode === 'welcome' && (
              <motion.div
                key="welcome-view"
                initial={{ opacity: 0, y: 14 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -14 }}
                transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
                className="w-full flex flex-col items-center gap-3.5 max-w-sm mx-auto"
              >
                {/* Error Banner if any */}
                {errorMsg && (
                  <div className="w-full mb-2 p-3 bg-red-950/70 border border-red-900/60 rounded-2xl flex items-center gap-2.5 text-red-200 text-xs animate-in fade-in">
                    <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
                    <span className="text-left leading-tight">{errorMsg}</span>
                  </div>
                )}

                {/* PILL 1: Continuar com Google */}
                <button
                  type="button"
                  id="btn-login-google"
                  onClick={() => handleGoogleLogin()}
                  disabled={loading}
                  className="w-full h-13 sm:h-14 bg-[#18181c]/90 hover:bg-[#222228] active:bg-[#121215] border border-[#2b2b36] hover:border-[#3f3f4e] rounded-full text-white font-medium text-[15px] sm:text-base flex items-center justify-center gap-3 transition-all duration-200 shadow-sm active:scale-[0.985] cursor-pointer"
                >
                  {/* Clean Google 'G' Icon */}
                  <svg className="w-4.5 h-4.5 shrink-0" viewBox="0 0 24 24">
                    <path
                      fill="#EA4335"
                      d="M12 5c1.6 0 3 .6 4.1 1.6l3.1-3.1C17.3 1.7 14.8 1 12 1 7.5 1 3.7 3.6 1.9 7.3l3.7 2.9C6.5 7.2 9 5 12 5z"
                    />
                    <path
                      fill="#4285F4"
                      d="M23.5 12.3c0-.8-.1-1.6-.2-2.3H12v4.5h6.5c-.3 1.5-1.1 2.8-2.4 3.7l3.7 2.9c2.2-2 3.7-5 3.7-8.8z"
                    />
                    <path
                      fill="#FBBC05"
                      d="M5.6 14.8c-.2-.7-.4-1.5-.4-2.3s.2-1.6.4-2.3L1.9 7.3C.7 9.7 0 12 0 14.5s.7 4.8 1.9 7.2l3.7-2.9z"
                    />
                    <path
                      fill="#34A853"
                      d="M12 23c3.2 0 6-1.1 8-3l-3.7-2.9c-1.1.7-2.5 1.2-4.3 1.2-3 0-5.5-2.2-6.4-5.2L1.9 16C3.7 19.7 7.5 23 12 23z"
                    />
                  </svg>
                  <span className="font-normal text-zinc-100">Continuar com Google</span>
                </button>

                {/* PILL 2: Continuar com e-mail */}
                <button
                  type="button"
                  id="btn-login-email"
                  onClick={() => {
                    setMode('login');
                    setErrorMsg(null);
                  }}
                  className="w-full h-13 sm:h-14 bg-[#18181c]/90 hover:bg-[#222228] active:bg-[#121215] border border-[#2b2b36] hover:border-[#3f3f4e] rounded-full text-white font-medium text-[15px] sm:text-base flex items-center justify-center gap-3 transition-all duration-200 shadow-sm active:scale-[0.985] cursor-pointer"
                >
                  <span className="text-base font-bold text-zinc-200 font-mono">@</span>
                  <span className="font-normal text-zinc-100">Continuar com e-mail</span>
                </button>

                {/* PILL 3: Criar conta (Substitui Continuar com X conforme pedido) */}
                <button
                  type="button"
                  id="btn-signup-action"
                  onClick={() => {
                    setMode('signup');
                    setErrorMsg(null);
                  }}
                  className="w-full h-13 sm:h-14 bg-[#18181c]/90 hover:bg-[#222228] active:bg-[#121215] border border-[#2b2b36] hover:border-[#3f3f4e] rounded-full text-white font-medium text-[15px] sm:text-base flex items-center justify-center gap-3 transition-all duration-200 shadow-sm active:scale-[0.985] cursor-pointer"
                >
                  <UserPlus className="w-4.5 h-4.5 text-zinc-300 stroke-[1.75]" />
                  <span className="font-normal text-zinc-100">Criar conta</span>
                </button>

                {/* PILL 4: Entrar com Conta Teste */}
                <button
                  type="button"
                  id="btn-login-test"
                  onClick={handleTestAccountLogin}
                  disabled={loading}
                  className="w-full h-12 sm:h-13 bg-[#111115]/90 hover:bg-[#1a1a20] active:bg-[#0d0d10] border border-dashed border-zinc-700/80 hover:border-zinc-500 rounded-full text-zinc-200 font-medium text-sm sm:text-[15px] flex items-center justify-center gap-2.5 transition-all duration-200 active:scale-[0.985] cursor-pointer disabled:opacity-50"
                >
                  <FlaskConical className="w-4 h-4 text-amber-400 shrink-0" />
                  <span className="font-normal">Entrar com Conta Teste</span>
                </button>

                {/* Subtle secondary utilities: QR Code & Account Sync */}
                <div className="w-full pt-4 flex items-center justify-center gap-4 text-xs text-zinc-500 font-medium">
                  <button
                    type="button"
                    id="btn-qr-login"
                    onClick={startQrLogin}
                    className="flex items-center gap-1.5 hover:text-zinc-300 transition-colors py-1 px-2 rounded-lg"
                  >
                    <QrCode className="w-3.5 h-3.5 text-zinc-400" />
                    <span>Entrar por QR Code</span>
                  </button>

                  <span className="text-zinc-700">•</span>

                  <button
                    type="button"
                    id="btn-link-sync-toggle"
                    onClick={() => setShowLinkSection(!showLinkSection)}
                    className="flex items-center gap-1.5 hover:text-zinc-300 transition-colors py-1 px-2 rounded-lg"
                  >
                    <Link2 className="w-3.5 h-3.5 text-zinc-400" />
                    <span>Vincular Chave</span>
                  </button>
                </div>

                {/* Collapsible Sync Key Linking Drawer */}
                {showLinkSection && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="w-full mt-2 p-3.5 bg-[#121216]/90 border border-zinc-800 rounded-2xl space-y-2 text-left"
                  >
                    <label className="block text-[11px] font-medium text-zinc-400">
                      Chave de Sincronização ou Usuário:
                    </label>
                    <input
                      type="text"
                      value={linkSyncKeyInput}
                      onChange={(e) => setLinkSyncKeyInput(e.target.value)}
                      placeholder="Ex: @usuario ou MBC-..."
                      className="w-full px-3 py-2 bg-[#09090b] border border-zinc-700/80 rounded-xl text-xs text-white placeholder-zinc-600 focus:outline-none focus:border-zinc-500"
                    />
                    <p className="text-[10px] text-zinc-500 leading-tight">
                      Ao entrar com o Google, os dados associados a esta chave serão conectados à sua conta.
                    </p>
                  </motion.div>
                )}
              </motion.div>
            )}

            {/* VIEW 2: LOGIN COM E-MAIL */}
            {mode === 'login' && (
              <motion.div
                key="login-view"
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.98 }}
                transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
                className="w-full max-w-sm mx-auto bg-[#121216]/90 border border-zinc-800/80 rounded-3xl p-6 shadow-2xl backdrop-blur-xl"
              >
                {/* Back button & Title */}
                <div className="flex items-center justify-between mb-5">
                  <button
                    type="button"
                    onClick={() => {
                      setMode('welcome');
                      setErrorMsg(null);
                    }}
                    className="flex items-center gap-1.5 text-xs text-zinc-400 hover:text-white transition-colors"
                  >
                    <ArrowLeft className="w-4 h-4" />
                    <span>Voltar</span>
                  </button>

                  <span className="text-xs font-semibold text-zinc-300 font-mono">
                    Entrar
                  </span>
                </div>

                {/* Error Banner */}
                {errorMsg && (
                  <div className="mb-4 p-3 bg-red-950/70 border border-red-900/60 rounded-2xl flex items-center gap-2 text-red-200 text-xs">
                    <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
                    <span className="leading-tight">{errorMsg}</span>
                  </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-3.5">
                  {/* Email / Username field */}
                  <div>
                    <label className="block text-xs text-zinc-400 font-medium mb-1.5">
                      E-mail ou Usuário
                    </label>
                    <div className="relative">
                      <Mail className="w-4 h-4 text-zinc-500 absolute left-3.5 top-3.5" />
                      <input
                        type="text"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="seu@email.com ou @usuario"
                        autoCapitalize="none"
                        autoCorrect="off"
                        className="w-full pl-10 pr-3.5 py-3 bg-[#09090b] border border-zinc-800 rounded-2xl text-xs sm:text-sm text-white placeholder-zinc-600 focus:outline-none focus:border-zinc-500 transition-colors"
                        required
                      />
                    </div>
                  </div>

                  {/* Password field */}
                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <label className="block text-xs text-zinc-400 font-medium">
                        Senha
                      </label>
                      <button
                        type="button"
                        onClick={() => {
                          setMode('forgot');
                          setErrorMsg(null);
                          setRecoveryEmail(email && email.includes('@') ? email : '');
                        }}
                        className="text-[11px] text-zinc-400 hover:text-white transition-colors"
                      >
                        Esqueceu?
                      </button>
                    </div>
                    <div className="relative">
                      <Lock className="w-4 h-4 text-zinc-500 absolute left-3.5 top-3.5" />
                      <input
                        type={showPassword ? 'text' : 'password'}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="••••••••"
                        className="w-full pl-10 pr-10 py-3 bg-[#09090b] border border-zinc-800 rounded-2xl text-xs sm:text-sm text-white placeholder-zinc-600 focus:outline-none focus:border-zinc-500 transition-colors"
                        required
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3.5 top-3.5 text-zinc-500 hover:text-zinc-300 transition-colors"
                      >
                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  {/* Remember Me toggle */}
                  <div
                    onClick={() => setRememberMe(!rememberMe)}
                    className="flex items-center gap-2.5 py-1 text-xs text-zinc-400 hover:text-zinc-300 cursor-pointer select-none"
                  >
                    <div
                      className={`w-4 h-4 rounded-md flex items-center justify-center transition-all ${
                        rememberMe ? 'bg-white text-black' : 'border border-zinc-700 bg-[#09090b]'
                      }`}
                    >
                      {rememberMe && <Check className="w-3 h-3 stroke-[3]" />}
                    </div>
                    <span>Manter conectado</span>
                  </div>

                  {/* Submit Button */}
                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full h-12 mt-2 bg-white hover:bg-zinc-200 active:bg-zinc-300 text-black font-semibold text-sm rounded-full flex items-center justify-center gap-2 transition-all shadow-md active:scale-[0.985] disabled:opacity-50 cursor-pointer"
                  >
                    {loading ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <span>Entrar</span>
                    )}
                  </button>
                </form>

                {/* Switch to Signup & Test Account */}
                <div className="mt-5 space-y-3 text-center text-xs text-zinc-500">
                  <div>
                    <span>Não tem uma conta? </span>
                    <button
                      type="button"
                      onClick={() => {
                        setMode('signup');
                        setErrorMsg(null);
                      }}
                      className="text-white hover:underline font-medium"
                    >
                      Criar conta
                    </button>
                  </div>
                  <div className="pt-2 border-t border-zinc-800/80">
                    <button
                      type="button"
                      id="btn-login-test-inline"
                      onClick={handleTestAccountLogin}
                      disabled={loading}
                      className="inline-flex items-center justify-center gap-1.5 text-amber-400 hover:text-amber-300 font-medium transition-colors cursor-pointer disabled:opacity-50"
                    >
                      <FlaskConical className="w-3.5 h-3.5" />
                      <span>Entrar com Conta Teste</span>
                    </button>
                  </div>
                </div>
              </motion.div>
            )}

            {/* VIEW 3: CRIAR CONTA (SIGNUP) */}
            {mode === 'signup' && (
              <motion.div
                key="signup-view"
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.98 }}
                transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
                className="w-full max-w-sm mx-auto bg-[#121216]/90 border border-zinc-800/80 rounded-3xl p-6 shadow-2xl backdrop-blur-xl"
              >
                {/* Back button & Title */}
                <div className="flex items-center justify-between mb-5">
                  <button
                    type="button"
                    onClick={() => {
                      setMode('welcome');
                      setErrorMsg(null);
                    }}
                    className="flex items-center gap-1.5 text-xs text-zinc-400 hover:text-white transition-colors"
                  >
                    <ArrowLeft className="w-4 h-4" />
                    <span>Voltar</span>
                  </button>

                  <span className="text-xs font-semibold text-zinc-300 font-mono">
                    Criar Conta
                  </span>
                </div>

                {/* Error Banner */}
                {errorMsg && (
                  <div className="mb-4 p-3 bg-red-950/70 border border-red-900/60 rounded-2xl flex items-center gap-2 text-red-200 text-xs">
                    <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
                    <span className="leading-tight">{errorMsg}</span>
                  </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-3.5">
                  {/* Username Field with Live Availability */}
                  <div>
                    <label className="block text-xs text-zinc-400 font-medium mb-1.5">
                      Nome de usuário
                    </label>
                    <div className="relative">
                      <User className="w-4 h-4 text-zinc-500 absolute left-3.5 top-3.5" />
                      <input
                        type="text"
                        value={username}
                        onChange={(e) => handleUsernameChange(e.target.value)}
                        placeholder="ex: nando"
                        autoCapitalize="none"
                        autoCorrect="off"
                        className={`w-full pl-10 pr-10 py-3 bg-[#09090b] border rounded-2xl text-xs sm:text-sm text-white placeholder-zinc-600 focus:outline-none transition-colors ${
                          usernameStatus === 'taken'
                            ? 'border-red-500/80'
                            : usernameStatus === 'available'
                            ? 'border-emerald-500/80'
                            : 'border-zinc-800 focus:border-zinc-500'
                        }`}
                        required
                      />
                      <div className="absolute right-3.5 top-3.5 flex items-center">
                        {usernameStatus === 'checking' && (
                          <Loader2 className="w-4 h-4 text-zinc-400 animate-spin" />
                        )}
                        {usernameStatus === 'available' && (
                          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                        )}
                        {usernameStatus === 'taken' && (
                          <AlertCircle className="w-4 h-4 text-red-400" />
                        )}
                      </div>
                    </div>
                    {usernameStatus === 'taken' && (
                      <p className="text-[10px] text-red-400 mt-1 pl-1">
                        Nome de usuário indisponível.
                      </p>
                    )}
                  </div>

                  {/* Email Field */}
                  <div>
                    <label className="block text-xs text-zinc-400 font-medium mb-1.5">
                      E-mail
                    </label>
                    <div className="relative">
                      <Mail className="w-4 h-4 text-zinc-500 absolute left-3.5 top-3.5" />
                      <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="seu@email.com"
                        autoCapitalize="none"
                        autoCorrect="off"
                        className="w-full pl-10 pr-3.5 py-3 bg-[#09090b] border border-zinc-800 rounded-2xl text-xs sm:text-sm text-white placeholder-zinc-600 focus:outline-none focus:border-zinc-500 transition-colors"
                        required
                      />
                    </div>
                  </div>

                  {/* Password Field */}
                  <div>
                    <label className="block text-xs text-zinc-400 font-medium mb-1.5">
                      Senha
                    </label>
                    <div className="relative">
                      <Lock className="w-4 h-4 text-zinc-500 absolute left-3.5 top-3.5" />
                      <input
                        type={showPassword ? 'text' : 'password'}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="Mínimo 6 caracteres"
                        className="w-full pl-10 pr-10 py-3 bg-[#09090b] border border-zinc-800 rounded-2xl text-xs sm:text-sm text-white placeholder-zinc-600 focus:outline-none focus:border-zinc-500 transition-colors"
                        required
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3.5 top-3.5 text-zinc-500 hover:text-zinc-300 transition-colors"
                      >
                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  {/* Remember Me toggle */}
                  <div
                    onClick={() => setRememberMe(!rememberMe)}
                    className="flex items-center gap-2.5 py-1 text-xs text-zinc-400 hover:text-zinc-300 cursor-pointer select-none"
                  >
                    <div
                      className={`w-4 h-4 rounded-md flex items-center justify-center transition-all ${
                        rememberMe ? 'bg-white text-black' : 'border border-zinc-700 bg-[#09090b]'
                      }`}
                    >
                      {rememberMe && <Check className="w-3 h-3 stroke-[3]" />}
                    </div>
                    <span>Manter conectado</span>
                  </div>

                  {/* Submit Button */}
                  <button
                    type="submit"
                    disabled={loading || usernameStatus === 'taken'}
                    className="w-full h-12 mt-2 bg-white hover:bg-zinc-200 active:bg-zinc-300 text-black font-semibold text-sm rounded-full flex items-center justify-center gap-2 transition-all shadow-md active:scale-[0.985] disabled:opacity-50 cursor-pointer"
                  >
                    {loading ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <span>Criar Conta e Começar</span>
                    )}
                  </button>
                </form>

                {/* Switch to Login */}
                <div className="mt-5 text-center text-xs text-zinc-500">
                  <span>Já possui uma conta? </span>
                  <button
                    type="button"
                    onClick={() => {
                      setMode('login');
                      setErrorMsg(null);
                    }}
                    className="text-white hover:underline font-medium"
                  >
                    Entrar
                  </button>
                </div>
              </motion.div>
            )}

            {/* VIEW 4: QR CODE LOGIN */}
            {mode === 'qrcode' && (
              <motion.div
                key="qrcode-view"
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.98 }}
                transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
                className="w-full max-w-sm mx-auto bg-[#121216]/90 border border-zinc-800/80 rounded-3xl p-6 shadow-2xl backdrop-blur-xl text-center space-y-4"
              >
                {/* Top header */}
                <div className="flex items-center justify-between">
                  <button
                    type="button"
                    onClick={() => {
                      setMode('welcome');
                      setErrorMsg(null);
                    }}
                    className="flex items-center gap-1.5 text-xs text-zinc-400 hover:text-white transition-colors"
                  >
                    <ArrowLeft className="w-4 h-4" />
                    <span>Voltar</span>
                  </button>

                  <div className="flex items-center gap-1.5 px-2.5 py-1 bg-zinc-900 border border-zinc-800 rounded-full text-[11px] font-mono text-zinc-300">
                    <Clock className="w-3 h-3 text-zinc-400" />
                    <span>{formatTime(qrTimer)}</span>
                  </div>
                </div>

                <div className="space-y-1">
                  <h3 className="text-sm font-semibold text-white">
                    Escaneie para entrar
                  </h3>
                  <p className="text-xs text-zinc-400">
                    Aponte a câmera ou use o Life Organizer conectado no seu celular.
                  </p>
                </div>

                {/* QR Code Container */}
                <div className="relative mx-auto w-48 h-48 bg-white p-2.5 rounded-2xl shadow-xl flex items-center justify-center border border-zinc-800">
                  {loading ? (
                    <Loader2 className="w-7 h-7 text-zinc-700 animate-spin" />
                  ) : qrDataUrl ? (
                    <div className="relative w-full h-full flex items-center justify-center">
                      <img src={qrDataUrl} alt="QR Code Login" className="w-full h-full object-contain rounded-lg" />
                      {qrTimer === 0 && (
                        <div className="absolute inset-0 bg-black/85 rounded-lg flex flex-col items-center justify-center p-3 text-center">
                          <AlertCircle className="w-7 h-7 text-amber-400 mb-1" />
                          <span className="text-xs font-medium text-white mb-2">Expirado</span>
                          <button
                            type="button"
                            onClick={startQrLogin}
                            className="py-1 px-3 bg-white text-black text-xs font-semibold rounded-full"
                          >
                            Renovar
                          </button>
                        </div>
                      )}
                    </div>
                  ) : null}
                </div>

                {/* PIN Code Alternative */}
                {qrSession && (
                  <div className="bg-[#09090b] p-2.5 rounded-2xl border border-zinc-800/80 flex items-center justify-between px-3.5">
                    <span className="text-xs text-zinc-400">Código de Pareamento:</span>
                    <span className="text-xs font-mono font-bold text-white bg-zinc-900 px-2 py-0.5 rounded-lg border border-zinc-700">
                      PLN-{qrSession.pinCode}
                    </span>
                  </div>
                )}
              </motion.div>
            )}

            {/* VIEW 5: RECUPERAÇÃO DE CONTA */}
            {mode === 'forgot' && (
              <motion.div
                key="forgot-view"
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.98 }}
                transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
                className="w-full max-w-sm mx-auto bg-[#121216]/90 border border-zinc-800/80 rounded-3xl p-6 shadow-2xl backdrop-blur-xl"
              >
                {/* Back button */}
                <div className="flex items-center justify-between mb-5">
                  <button
                    type="button"
                    onClick={() => {
                      setMode('login');
                      setErrorMsg(null);
                    }}
                    className="flex items-center gap-1.5 text-xs text-zinc-400 hover:text-white transition-colors"
                  >
                    <ArrowLeft className="w-4 h-4" />
                    <span>Voltar</span>
                  </button>

                  <span className="text-xs font-semibold text-zinc-300 font-mono">
                    Recuperar
                  </span>
                </div>

                {errorMsg && (
                  <div className="mb-4 p-3 bg-red-950/70 border border-red-900/60 rounded-2xl flex items-center gap-2 text-red-200 text-xs">
                    <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
                    <span className="leading-tight">{errorMsg}</span>
                  </div>
                )}

                {recoverySuccessMsg && (
                  <div className="mb-4 p-3 bg-emerald-950/70 border border-emerald-900/60 rounded-2xl flex items-center gap-2 text-emerald-200 text-xs">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span className="leading-tight">{recoverySuccessMsg}</span>
                  </div>
                )}

                <form onSubmit={handleRecoverSubmit} className="space-y-3.5">
                  <div>
                    <label className="block text-xs text-zinc-400 font-medium mb-1.5">
                      E-mail cadastrado
                    </label>
                    <div className="relative">
                      <Mail className="w-4 h-4 text-zinc-500 absolute left-3.5 top-3.5" />
                      <input
                        type="email"
                        value={recoveryEmail}
                        onChange={(e) => setRecoveryEmail(e.target.value)}
                        placeholder="seu@email.com"
                        className="w-full pl-10 pr-3.5 py-3 bg-[#09090b] border border-zinc-800 rounded-2xl text-xs sm:text-sm text-white placeholder-zinc-600 focus:outline-none focus:border-zinc-500 transition-colors"
                        required
                      />
                    </div>
                  </div>

                  {foundAccount && (
                    <div className="space-y-2.5 bg-[#09090b] border border-zinc-800 rounded-2xl p-3.5 text-left animate-in fade-in">
                      <div className="text-[11px] text-zinc-400">Conta localizada:</div>
                      <div className="text-xs font-bold text-white">@{foundAccount.username}</div>
                      <div>
                        <label className="block text-[11px] text-zinc-400 mb-1">Nova Senha:</label>
                        <input
                          type="password"
                          value={newPassword}
                          onChange={(e) => setNewPassword(e.target.value)}
                          placeholder="Mínimo 6 caracteres"
                          className="w-full px-3 py-2 bg-[#121216] border border-zinc-700 rounded-xl text-xs text-white placeholder-zinc-600 focus:outline-none focus:border-zinc-500"
                        />
                      </div>
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full h-12 mt-2 bg-white hover:bg-zinc-200 active:bg-zinc-300 text-black font-semibold text-sm rounded-full flex items-center justify-center gap-2 transition-all shadow-md active:scale-[0.985] disabled:opacity-50 cursor-pointer"
                  >
                    {loading ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <span>{foundAccount ? 'Redefinir e Entrar' : 'Localizar Conta'}</span>
                    )}
                  </button>
                </form>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Footer Legal notice (Faithful to Grok image) */}
        <div className="pt-6 pb-2 text-center">
          <p className="text-xs text-zinc-500 leading-relaxed max-w-xs mx-auto">
            Ao continuar, você concorda com os{' '}
            <button
              type="button"
              onClick={() => setActiveLegalModal('terms')}
              className="text-zinc-400 hover:text-zinc-200 underline underline-offset-2 transition-colors cursor-pointer"
            >
              Termos
            </button>{' '}
            e com a{' '}
            <button
              type="button"
              onClick={() => setActiveLegalModal('privacy')}
              className="text-zinc-400 hover:text-zinc-200 underline underline-offset-2 transition-colors cursor-pointer"
            >
              Política de privacidade
            </button>
          </p>
        </div>
      </div>

      {/* Interactive Terms / Privacy Modal Dialog */}
      <AnimatePresence>
        {activeLegalModal && (
          <div className="fixed inset-0 z-[10000] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setActiveLegalModal(null)}
              className="fixed inset-0 bg-black/80 backdrop-blur-sm"
            />

            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              className="relative z-10 w-full max-w-md bg-[#121216] border border-zinc-800 rounded-3xl p-6 shadow-2xl text-left"
            >
              <div className="flex items-center justify-between pb-3 border-b border-zinc-800">
                <h3 className="text-sm font-bold text-white">
                  {activeLegalModal === 'terms' ? 'Termos de Uso' : 'Política de Privacidade'}
                </h3>
                <button
                  onClick={() => setActiveLegalModal(null)}
                  className="text-zinc-500 hover:text-white p-1 rounded-lg transition-colors cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="py-4 text-xs text-zinc-300 space-y-3 max-h-[60vh] overflow-y-auto no-scrollbar leading-relaxed">
                {activeLegalModal === 'terms' ? (
                  <>
                    <p>
                      Bem-vindo ao Life Organizer. Ao acessar ou utilizar nossa plataforma, você concorda em cumprir estes Termos de Uso.
                    </p>
                    <p className="font-semibold text-white">1. Uso da Conta</p>
                    <p>
                      Você é responsável por manter a confidencialidade dos dados de acesso à sua conta e por todas as atividades realizadas nela.
                    </p>
                    <p className="font-semibold text-white">2. Sincronização e Segurança</p>
                    <p>
                      Seus dados de tarefas, hábitos e finanças são criptografados e sincronizados de maneira segura entre seus dispositivos autorizados.
                    </p>
                  </>
                ) : (
                  <>
                    <p>
                      Sua privacidade e a proteção de seus dados pessoais são prioridades absolutas no Life Organizer.
                    </p>
                    <p className="font-semibold text-white">1. Coleta de Informações</p>
                    <p>
                      Armazenamos exclusivamente as informações estritamente necessárias para a gestão do seu planejamento pessoal, rotinas e metas.
                    </p>
                    <p className="font-semibold text-white">2. Sem Venda de Dados</p>
                    <p>
                      Nunca comercializamos nem compartilhamos seus dados ou hábitos com terceiros para fins de publicidade.
                    </p>
                  </>
                )}
              </div>

              <div className="pt-3 border-t border-zinc-800 text-right">
                <button
                  onClick={() => setActiveLegalModal(null)}
                  className="px-4 py-2 bg-white text-black text-xs font-semibold rounded-full hover:bg-zinc-200 transition-colors cursor-pointer"
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
};

