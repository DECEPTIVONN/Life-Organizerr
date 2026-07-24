import React, { useState } from 'react';
import { 
  Zap, 
  User, 
  Mail, 
  Lock, 
  ArrowRight, 
  ArrowLeft, 
  ShieldCheck, 
  AlertCircle, 
  Loader2, 
  CheckCircle2, 
  Check,
  CheckSquare,
  BookOpen,
  Coins,
  Flame,
  Compass
} from 'lucide-react';
import { 
  registerWithEmail, 
  loginWithEmailOrUsername, 
  loginWithGoogleProfile, 
  isUsernameAvailable, 
  AuthUser 
} from '../lib/auth';

interface AuthModalProps {
  isOpen: boolean;
  onSuccess: (user: AuthUser, rememberMe: boolean) => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({ isOpen, onSuccess }) => {
  // Initial mode is 'welcome', giving user choice to 'login' or 'signup'
  const [mode, setMode] = useState<'welcome' | 'login' | 'signup'>('welcome');
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(true);

  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [usernameStatus, setUsernameStatus] = useState<'idle' | 'checking' | 'available' | 'taken'>('idle');

  if (!isOpen) return null;

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

  const handleGoogleLogin = async () => {
    setErrorMsg(null);
    setLoading(true);

    try {
      const redirectUri = `${window.location.origin}/auth/callback`;
      const res = await fetch(`/api/auth/google/url?redirect_uri=${encodeURIComponent(redirectUri)}`);
      
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || 'Não foi possível gerar URL do Google OAuth.');
      }

      const { url } = await res.json();
      
      const popup = window.open(
        url,
        'google_auth_popup',
        'width=500,height=600,status=no,toolbar=no,menubar=no'
      );

      if (!popup) {
        setErrorMsg('Pop-up bloqueado pelo navegador. Por favor, permita pop-ups.');
        setLoading(false);
        return;
      }

      const handleMessage = async (event: MessageEvent) => {
        if (event.data?.type === 'GOOGLE_OAUTH_SUCCESS' && event.data?.profile) {
          window.removeEventListener('message', handleMessage);
          const profile = event.data.profile;

          const loginRes = await loginWithGoogleProfile({
            email: profile.email,
            name: profile.name,
            picture: profile.picture
          });

          if (loginRes.ok && loginRes.user) {
            onSuccess(loginRes.user, rememberMe);
          } else {
            setErrorMsg(loginRes.message || 'Erro ao autenticar com Google.');
          }
          setLoading(false);
        } else if (event.data?.type === 'GOOGLE_OAUTH_FAILURE') {
          window.removeEventListener('message', handleMessage);
          setErrorMsg('Falha no login com Google.');
          setLoading(false);
        }
      };

      window.addEventListener('message', handleMessage);
    } catch (err: any) {
      setErrorMsg(err.message || 'Erro ao conectar com Google.');
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[9999] h-screen w-screen flex items-center justify-center p-3 sm:p-4 bg-black overflow-hidden select-none">
      {/* Background Video */}
      <video
        autoPlay
        loop
        muted
        playsInline
        className="absolute inset-0 w-full h-full object-cover z-0 pointer-events-none opacity-60 scale-105"
      >
        <source
          src="https://www.callofduty.com/cod/cdn/bo7/BO7_IGS_CODHQ_BaseKA_1696x1056_02sk_CLEAN_Compressed.mp4"
          type="video/mp4"
        />
      </video>

      {/* Dark overlay gradient for readability */}
      <div className="absolute inset-0 bg-gradient-to-b from-black/80 via-black/65 to-black/95 pointer-events-none z-0" />

      <div className="w-full max-w-md bg-zinc-950/90 border border-zinc-800/80 rounded-3xl p-5 sm:p-7 shadow-2xl relative flex flex-col justify-between z-10 backdrop-blur-xl max-h-[94vh] overflow-y-auto no-scrollbar">
        {/* Glow ambient decoration */}
        <div className="absolute -top-24 -left-24 w-52 h-52 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -right-24 w-52 h-52 bg-orange-600/10 rounded-full blur-3xl pointer-events-none" />

        <div>
          {/* Header & Logo */}
          <div className="flex flex-col items-center text-center mb-6">
            <div className="w-14 h-14 bg-gradient-to-tr from-amber-600 to-orange-500 rounded-2xl flex items-center justify-center shadow-lg shadow-orange-500/25 mb-3 border border-amber-400/20">
              <Zap className="w-7 h-7 text-white fill-white stroke-[1.5]" />
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white font-sans">
              Life Organizer
            </h1>
            <p className="text-xs sm:text-sm text-zinc-400 mt-1 font-medium">
              Organize sua vida!
            </p>
          </div>

          {/* Mode Welcome Screen */}
          {mode === 'welcome' && (
            <div className="space-y-4 animate-in fade-in zoom-in-95 duration-200">
              <div className="p-4 bg-zinc-900/60 border border-zinc-800 rounded-2xl text-center">
                <p className="text-xs text-zinc-300 leading-relaxed">
                  Acesse sua conta ou crie um novo cadastro para sincronizar suas tarefas, finanças e rotina em todos os seus dispositivos.
                </p>
              </div>

              {/* Action Buttons */}
              <div className="space-y-3 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setMode('login');
                    setErrorMsg(null);
                  }}
                  className="w-full py-3.5 px-4 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-zinc-950 font-bold text-xs sm:text-sm rounded-xl shadow-lg shadow-amber-500/20 flex items-center justify-center gap-2 transition-all group"
                >
                  <span>Entrar na minha Conta</span>
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setMode('signup');
                    setErrorMsg(null);
                  }}
                  className="w-full py-3 px-4 bg-zinc-900 hover:bg-zinc-800/90 border border-zinc-800 text-xs sm:text-sm font-semibold text-white rounded-xl flex items-center justify-center gap-2 transition-all"
                >
                  <span>Criar Nova Conta</span>
                </button>

                <div className="relative my-4">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-zinc-800" />
                  </div>
                  <div className="relative flex justify-center text-[10px] uppercase font-bold tracking-wider">
                    <span className="px-3 bg-zinc-950 text-zinc-500">ou</span>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleGoogleLogin}
                  disabled={loading}
                  className="w-full py-3 px-4 bg-zinc-900/90 hover:bg-zinc-800 border border-zinc-800 text-xs font-semibold text-zinc-200 rounded-xl flex items-center justify-center gap-2.5 transition-all disabled:opacity-50"
                >
                  <svg className="w-4 h-4" viewBox="0 0 24 24">
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
                  <span>Continuar com o Google</span>
                </button>
              </div>
            </div>
          )}

          {/* Mode Form (Login or Signup) */}
          {(mode === 'login' || mode === 'signup') && (
            <div className="animate-in fade-in slide-in-from-bottom-2 duration-200">
              {/* Back to welcome button & tab selector */}
              <div className="flex items-center justify-between mb-5">
                <button
                  type="button"
                  onClick={() => {
                    setMode('welcome');
                    setErrorMsg(null);
                  }}
                  className="flex items-center gap-1.5 text-xs text-zinc-400 hover:text-white transition-colors"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  <span>Voltar</span>
                </button>

                <div className="flex p-0.5 bg-zinc-900 border border-zinc-800 rounded-lg">
                  <button
                    type="button"
                    onClick={() => {
                      setMode('login');
                      setErrorMsg(null);
                    }}
                    className={`px-3 py-1 text-[11px] font-semibold rounded-md transition-all ${
                      mode === 'login'
                        ? 'bg-amber-500 text-zinc-950 font-bold'
                        : 'text-zinc-400 hover:text-white'
                    }`}
                  >
                    Entrar
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setMode('signup');
                      setErrorMsg(null);
                    }}
                    className={`px-3 py-1 text-[11px] font-semibold rounded-md transition-all ${
                      mode === 'signup'
                        ? 'bg-amber-500 text-zinc-950 font-bold'
                        : 'text-zinc-400 hover:text-white'
                    }`}
                  >
                    Criar Conta
                  </button>
                </div>
              </div>

              {/* Error Alert Box */}
              {errorMsg && (
                <div className="mb-4 p-3 bg-red-950/60 border border-red-800/80 rounded-xl flex items-start gap-2.5 text-red-200 text-xs animate-in slide-in-from-top-1">
                  <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
                  <span className="leading-tight">{errorMsg}</span>
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-3.5">
                {/* Username Field (Only in Signup Mode) */}
                {mode === 'signup' && (
                  <div>
                    <label className="block text-xs font-medium text-zinc-300 mb-1">
                      Nome de usuário <span className="text-amber-500">*</span>
                    </label>
                    <div className="relative">
                      <User className="w-4 h-4 text-zinc-500 absolute left-3 top-3" />
                      <input
                        type="text"
                        value={username}
                        onChange={(e) => handleUsernameChange(e.target.value)}
                        placeholder="ex: usuario"
                        className={`w-full pl-9 pr-10 py-2.5 bg-zinc-900/90 border rounded-xl text-xs text-white placeholder-zinc-500 focus:outline-none transition-all ${
                          usernameStatus === 'taken'
                            ? 'border-red-500/80 focus:border-red-500'
                            : usernameStatus === 'available'
                            ? 'border-emerald-500/80 focus:border-emerald-500'
                            : 'border-zinc-800 focus:border-amber-500'
                        }`}
                        required
                      />
                      <div className="absolute right-3 top-3 flex items-center">
                        {usernameStatus === 'checking' && (
                          <Loader2 className="w-4 h-4 text-amber-500 animate-spin" />
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
                      <p className="text-[11px] text-red-400 mt-1">
                        Este nome de usuário já está em uso. Escolha outro.
                      </p>
                    )}
                    {usernameStatus === 'available' && (
                      <p className="text-[11px] text-emerald-400 mt-1">
                        Nome de usuário disponível!
                      </p>
                    )}
                  </div>
                )}

                {/* Email / Identifier Field */}
                <div>
                  <label className="block text-xs font-medium text-zinc-300 mb-1">
                    {mode === 'signup' ? 'E-mail' : 'E-mail ou Nome de usuário'} <span className="text-amber-500">*</span>
                  </label>
                  <div className="relative">
                    <Mail className="w-4 h-4 text-zinc-500 absolute left-3 top-3" />
                    <input
                      type={mode === 'signup' ? 'email' : 'text'}
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder={mode === 'signup' ? 'seu@email.com' : 'seu@email.com ou @usuario'}
                      className="w-full pl-9 pr-3 py-2.5 bg-zinc-900/90 border border-zinc-800 rounded-xl text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-amber-500 transition-all"
                      required
                    />
                  </div>
                </div>

                {/* Password Field */}
                <div>
                  <label className="block text-xs font-medium text-zinc-300 mb-1">
                    Senha <span className="text-amber-500">*</span>
                  </label>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-zinc-500 absolute left-3 top-3" />
                    <input
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full pl-9 pr-3 py-2.5 bg-zinc-900/90 border border-zinc-800 rounded-xl text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-amber-500 transition-all"
                      required
                    />
                  </div>
                </div>

                {/* Enhanced "Manter conectado" Custom Checkbox */}
                <div className="pt-1">
                  <div 
                    onClick={() => setRememberMe(!rememberMe)}
                    className={`p-3 rounded-xl border transition-all cursor-pointer flex items-center justify-between select-none ${
                      rememberMe 
                        ? 'bg-amber-500/10 border-amber-500/40 text-white' 
                        : 'bg-zinc-900/50 border-zinc-800/80 text-zinc-400 hover:border-zinc-700'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`w-5 h-5 rounded-md flex items-center justify-center transition-all ${
                        rememberMe 
                          ? 'bg-amber-500 text-zinc-950 shadow-sm shadow-amber-500/40' 
                          : 'bg-zinc-800 border border-zinc-700 text-transparent'
                      }`}>
                        <Check className="w-3.5 h-3.5 stroke-[3]" />
                      </div>
                      <div className="flex flex-col">
                        <span className="text-xs font-semibold leading-tight">
                          Manter conectado
                        </span>
                        <span className="text-[10px] text-zinc-400 mt-0.5">
                          Sua sessão continuará ativa neste navegador
                        </span>
                      </div>
                    </div>

                    <ShieldCheck className={`w-4 h-4 shrink-0 transition-colors ${rememberMe ? 'text-amber-400' : 'text-zinc-600'}`} />
                  </div>
                </div>

                {/* Submit Action Button */}
                <button
                  type="submit"
                  disabled={loading || (mode === 'signup' && usernameStatus === 'taken')}
                  className="w-full py-3 px-4 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-zinc-950 font-bold text-xs rounded-xl shadow-lg shadow-amber-500/20 flex items-center justify-center gap-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed mt-2"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Processando...</span>
                    </>
                  ) : (
                    <>
                      <span>{mode === 'signup' ? 'Criar Conta e Entrar' : 'Entrar no Life Organizer'}</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </form>

              {/* Divider & Google Login */}
              <div className="relative my-4">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-zinc-800" />
                </div>
                <div className="relative flex justify-center text-[10px]">
                  <span className="px-3 bg-zinc-950 text-zinc-500">ou com</span>
                </div>
              </div>

              <button
                type="button"
                onClick={handleGoogleLogin}
                disabled={loading}
                className="w-full py-2.5 px-4 bg-zinc-900 hover:bg-zinc-800/80 border border-zinc-800 text-xs font-semibold text-zinc-200 rounded-xl flex items-center justify-center gap-2.5 transition-all disabled:opacity-50"
              >
                <svg className="w-4 h-4" viewBox="0 0 24 24">
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
                <span>Entrar com o Google</span>
              </button>
            </div>
          )}
        </div>

        {/* Bottom Section: 5 PILARES TE ESPERANDO (as requested in screenshot) */}
        <div className="mt-8 pt-6 border-t border-zinc-900/90 text-center">
          <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-3">
            5 PILARES TE ESPERANDO
          </p>

          <div className="flex items-center justify-center gap-2.5 sm:gap-3">
            <div title="Tarefas & Checklist" className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-zinc-900 border border-zinc-800/80 flex items-center justify-center text-zinc-400 hover:text-amber-400 hover:border-amber-500/40 hover:bg-zinc-850 transition-all cursor-default group">
              <CheckSquare className="w-4 h-4 sm:w-4 sm:h-4 group-hover:scale-110 transition-transform" />
            </div>

            <div title="Livros & Estudos" className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-zinc-900 border border-zinc-800/80 flex items-center justify-center text-zinc-400 hover:text-amber-400 hover:border-amber-500/40 hover:bg-zinc-850 transition-all cursor-default group">
              <BookOpen className="w-4 h-4 sm:w-4 sm:h-4 group-hover:scale-110 transition-transform" />
            </div>

            <div title="Finanças & Orçamento" className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-zinc-900 border border-zinc-800/80 flex items-center justify-center text-zinc-400 hover:text-amber-400 hover:border-amber-500/40 hover:bg-zinc-850 transition-all cursor-default group">
              <Coins className="w-4 h-4 sm:w-4 sm:h-4 group-hover:scale-110 transition-transform" />
            </div>

            <div title="Hábitos & Rotina" className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-zinc-900 border border-zinc-800/80 flex items-center justify-center text-zinc-400 hover:text-amber-400 hover:border-amber-500/40 hover:bg-zinc-850 transition-all cursor-default group">
              <Flame className="w-4 h-4 sm:w-4 sm:h-4 group-hover:scale-110 transition-transform" />
            </div>

            <div title="Metas & Visão" className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-zinc-900 border border-zinc-800/80 flex items-center justify-center text-zinc-400 hover:text-amber-400 hover:border-amber-500/40 hover:bg-zinc-850 transition-all cursor-default group">
              <Compass className="w-4 h-4 sm:w-4 sm:h-4 group-hover:scale-110 transition-transform" />
            </div>
          </div>

          <p className="text-[10px] text-zinc-600 mt-4 leading-tight">
            Ao entrar, você concorda com os Termos de Uso e a Política de Privacidade.
          </p>
        </div>
      </div>
    </div>
  );
};
