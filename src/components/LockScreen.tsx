import React, { useState, useEffect } from 'react';
import { Eye, EyeOff, ShieldAlert, X, Info, Lock, ShieldCheck, KeyRound, Fingerprint, Loader2, RefreshCw } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { verifyBiometric } from '../utils/biometricAuth';
import defaultLockBg from '../assets/images/1271888.jpg';

interface LockScreenProps {
  userName: string;
  userPhoto: string;
  correctPassword?: string;
  onUnlock: () => void;
  appLockBiometricEnabled?: boolean;
  lockScreenDesktopImage?: string;
  lockScreenMobileImage?: string;
}

export default function LockScreen({
  userName,
  userPhoto,
  correctPassword = '',
  onUnlock,
  appLockBiometricEnabled = false,
  lockScreenDesktopImage = '',
  lockScreenMobileImage = ''
}: LockScreenProps) {
  const [passwordInput, setPasswordInput] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [showForgotHelp, setShowForgotHelp] = useState(false);
  const [shakeTrigger, setShakeTrigger] = useState(false);
  const [isBiometricAuthenticating, setIsBiometricAuthenticating] = useState(false);
  const [hasTriggeredBiometric, setHasTriggeredBiometric] = useState(false);
  const [biometricFailedAttempts, setBiometricFailedAttempts] = useState(0);

  // Default fallback wallpaper
  const desktopBg = lockScreenDesktopImage || defaultLockBg || '/assets/1271888.jpg';
  const mobileBg = lockScreenMobileImage || lockScreenDesktopImage || defaultLockBg || '/assets/1271888.jpg';

  // If biometric is enabled and attempts < 3, only show biometric digital option
  const isBiometricOnlyMode = appLockBiometricEnabled && biometricFailedAttempts < 3;

  const handleUnlock = () => {
    if (passwordInput === correctPassword) {
      onUnlock();
    } else {
      setErrorMsg('Senha incorreta! Tente novamente.');
      setShakeTrigger(true);
      setTimeout(() => setShakeTrigger(false), 500);
      
      // Simple tactile feedback vibration on mobile devices
      if (navigator.vibrate) {
        navigator.vibrate([100, 50, 100]);
      }
    }
  };

  const handleBiometricUnlock = async () => {
    setIsBiometricAuthenticating(true);
    setErrorMsg('');
    try {
      const res = await verifyBiometric(userName);
      if (res.success) {
        onUnlock();
      } else {
        const nextAttempts = biometricFailedAttempts + 1;
        setBiometricFailedAttempts(nextAttempts);
        setShakeTrigger(true);
        setTimeout(() => setShakeTrigger(false), 500);

        if (navigator.vibrate) {
          navigator.vibrate([100, 50, 100]);
        }

        if (nextAttempts >= 3) {
          setErrorMsg('Limite de 3 tentativas com digital atingido. Digite sua senha de bloqueio.');
        } else {
          setErrorMsg(res.error || `Digital não reconhecida. Tentativa ${nextAttempts} de 3.`);
        }
      }
    } catch (err) {
      const nextAttempts = biometricFailedAttempts + 1;
      setBiometricFailedAttempts(nextAttempts);
      setShakeTrigger(true);
      setTimeout(() => setShakeTrigger(false), 500);

      if (nextAttempts >= 3) {
        setErrorMsg('Tentativas de digital esgotadas (3/3). Digite sua senha.');
      } else {
        setErrorMsg(`Erro na leitura da digital (Tentativa ${nextAttempts}/3).`);
      }
    } finally {
      setIsBiometricAuthenticating(false);
    }
  };

  useEffect(() => {
    if (appLockBiometricEnabled && !hasTriggeredBiometric && biometricFailedAttempts < 3) {
      setHasTriggeredBiometric(true);
      // Small timeout to allow component layout mount
      const timer = setTimeout(() => {
        handleBiometricUnlock();
      }, 400);
      return () => clearTimeout(timer);
    }
  }, [appLockBiometricEnabled, hasTriggeredBiometric, biometricFailedAttempts]);

  const handleResetPasswordWithDataLossWarning = () => {
    if (confirm("⚠️ ATENÇÃO: Limpar a senha local irá remover as configurações de segurança atuais. Caso não possua uma Chave de Sincronização Cloud ativa, seus dados locais também podem ser redefinidos. Deseja continuar?")) {
      // Clear password and lock settings in localStorage
      localStorage.removeItem('mbc_app_lock_enabled');
      localStorage.removeItem('mbc_app_lock_password');
      localStorage.removeItem('mbc_app_lock_timeout');
      localStorage.removeItem('mbc_app_lock_biometric_enabled');
      
      // Reload app to apply
      window.location.reload();
    }
  };

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center select-none overflow-hidden text-zinc-300 font-sans">
      
      {/* Background Layer (Desktop Screen: desktopBg) */}
      <div 
        className="hidden md:block absolute inset-0 bg-cover bg-center transition-transform duration-[15000ms] ease-out scale-105"
        style={{
          backgroundImage: `linear-gradient(to bottom, rgba(4, 4, 5, 0.72) 0%, rgba(4, 4, 5, 0.90) 100%), url('${desktopBg}')`,
          backgroundSize: 'cover',
          backgroundPosition: 'center'
        }}
      />

      {/* Background Layer (Mobile Screen: mobileBg) */}
      <div 
        className="block md:hidden absolute inset-0 bg-cover bg-center transition-transform duration-[15000ms] ease-out scale-105"
        style={{
          backgroundImage: `linear-gradient(to bottom, rgba(4, 4, 5, 0.72) 0%, rgba(4, 4, 5, 0.90) 100%), url('${mobileBg}')`,
          backgroundSize: 'cover',
          backgroundPosition: 'center'
        }}
      />

      {/* Decorative Grid Mesh overlay to enhance premium technical aesthetic */}
      <div className="absolute inset-0 bg-[radial-gradient(#ffffff02_1px,transparent_1px)] [background-size:20px_20px] pointer-events-none opacity-60" />

      {/* Futuristic Ambient Glow Rings */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-purple-600/10 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-1/4 left-1/2 -translate-x-1/2 translate-y-1/2 w-[600px] h-[600px] bg-orange-600/5 rounded-full blur-[150px] pointer-events-none" />

      {/* Soft Premium Lateral Details */}
      <div className="absolute left-8 top-12 bottom-12 w-[1px] bg-gradient-to-b from-transparent via-zinc-800/30 to-transparent hidden md:flex flex-col justify-between items-center py-12 pointer-events-none">
        <span className="text-[8px] text-zinc-600 tracking-[0.3em] font-mono select-none [writing-mode:vertical-lr] uppercase opacity-70">SECURE SHELL</span>
        <div className="w-1 h-1 rounded-full bg-purple-500/40" />
        <span className="text-[8px] text-zinc-600 tracking-[0.3em] font-mono select-none [writing-mode:vertical-lr] uppercase opacity-70">BLOCK ACTIVE</span>
      </div>

      <div className="absolute right-8 top-12 bottom-12 w-[1px] bg-gradient-to-b from-transparent via-zinc-800/30 to-transparent hidden md:flex flex-col justify-between items-center py-12 pointer-events-none">
        <span className="text-[8px] text-zinc-600 tracking-[0.3em] font-mono select-none [writing-mode:vertical-lr] uppercase opacity-70">DATA SHIELDED</span>
        <div className="w-1 h-1 rounded-full bg-orange-500/40" />
        <span className="text-[8px] text-zinc-600 tracking-[0.3em] font-mono select-none [writing-mode:vertical-lr] uppercase opacity-70">v1.2.0-SEC</span>
      </div>

      {/* Main Locking Panel Container */}
      <motion.div 
        animate={shakeTrigger ? { x: [-10, 10, -10, 10, -5, 5, 0] } : {}}
        transition={{ duration: 0.5 }}
        className="relative z-10 w-full max-w-md px-6 sm:px-8 py-10 sm:py-12 text-center flex flex-col justify-center items-center"
      >
        {/* Subtle holographic watermark background matching premium design */}
        <div className="absolute inset-0 flex items-center justify-center opacity-5 pointer-events-none">
          <Lock className="w-80 h-80 stroke-[0.5]" style={{ color: 'var(--color-orange-500, #f97316)' }} />
        </div>

        {/* Security Lock Badge Indicator */}
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 bg-zinc-950/80 border border-zinc-800/80 rounded-full mb-6 shadow-lg backdrop-blur-md">
          {isBiometricOnlyMode ? (
            <Fingerprint className="h-3.5 w-3.5" style={{ color: 'var(--color-orange-400, #fb923c)' }} />
          ) : (
            <ShieldCheck className="h-3.5 w-3.5" style={{ color: 'var(--color-orange-400, #fb923c)' }} />
          )}
          <span className="text-[10px] font-mono font-bold tracking-widest text-zinc-300 uppercase">
            {isBiometricOnlyMode ? 'DESBLOQUEIO POR BIOMETRIA' : 'TELA DE BLOQUEIO ATIVA'}
          </span>
        </div>

        {/* User profile picture framed with a sleek double border and state glow */}
        <div className="relative w-28 h-28 mb-5 group cursor-pointer">
          {/* Animated Neon glowing aura */}
          <div 
            className="absolute -inset-1.5 rounded-full blur-md opacity-75 group-hover:opacity-100 transition duration-1000 group-hover:duration-200 animate-spin-slow" 
            style={{ 
              background: 'linear-gradient(to top right, var(--color-orange-600, #ea580c), var(--color-orange-400, #fb923c))',
              animationDuration: '8s' 
            }} 
          />
          
          {/* Deep dark backing */}
          <div className="absolute inset-0.5 bg-[#0a0a0d] rounded-full z-10" />

          <img
            src={userPhoto || "https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?q=80&w=150"}
            alt="Profile Avatar"
            onError={(e) => {
              (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?q=80&w=150';
            }}
            referrerPolicy="no-referrer"
            className="w-28 h-28 rounded-full border border-zinc-800/80 object-cover shadow-2xl relative z-20 p-1 bg-[#0a0a0d] transition-transform duration-500 group-hover:scale-[1.04]"
          />
        </div>

        {/* Heading Username - Styled with spacious tracking and high contrast */}
        <h2 className="text-2xl font-black text-white tracking-[0.2em] uppercase font-sans mb-2 drop-shadow-lg select-none">
          {userName}
        </h2>

        {/* Locking description */}
        <p className="text-[11px] text-zinc-400/90 max-w-xs mx-auto leading-relaxed mb-6 select-none">
          {isBiometricOnlyMode ? (
            <>
              Entrada preferencial com <span className="font-bold" style={{ color: 'var(--color-orange-400, #fb923c)' }}>Impressão Digital</span>. Toque no sensor biométrico para desbloquear.
            </>
          ) : biometricFailedAttempts >= 3 ? (
            <>
              <span className="text-amber-400 font-bold">3 tentativas com digital esgotadas.</span> Digite sua <span className="text-zinc-200 font-bold">Senha de Bloqueio</span> para continuar.
            </>
          ) : (
            <>
              O bloqueio do app está ativado. Digite sua <span className="text-zinc-200 font-bold">Senha de Bloqueio do App</span> para acessar o <span className="font-black tracking-widest font-mono" style={{ color: 'var(--color-orange-500, #f97316)' }}>PLANNER</span>.
            </>
          )}
        </p>

        {/* ==================================================================== */}
        {/* MODE A: EXCLUSIVE FINGERPRINT OPTION (Only biometric until 3 failed) */}
        {/* ==================================================================== */}
        {isBiometricOnlyMode ? (
          <div className="w-full max-w-[320px] space-y-4">
            <button
              type="button"
              onClick={handleBiometricUnlock}
              disabled={isBiometricAuthenticating}
              className="w-full group relative overflow-hidden bg-zinc-950/80 hover:bg-zinc-900/90 border border-zinc-850 hover:border-zinc-700/80 text-white rounded-3xl p-6 flex flex-col items-center justify-center gap-4 transition-all duration-300 shadow-2xl backdrop-blur-md active:scale-[0.98] cursor-pointer"
            >
              {/* Central Biometric Sensor Circle (Follows user chosen theme) */}
              <div className="relative">
                {/* Glowing ring animation behind the fingerprint */}
                <div 
                  className="absolute -inset-1.5 rounded-full blur-md opacity-60 group-hover:opacity-100 group-hover:scale-110 transition-all duration-300"
                  style={{
                    backgroundColor: 'var(--color-orange-500, #f97316)',
                    opacity: 0.35
                  }}
                />
                
                <div 
                  className="relative w-20 h-20 rounded-full flex items-center justify-center text-white group-hover:scale-105 transition-transform duration-300"
                  style={{
                    background: 'linear-gradient(135deg, var(--color-orange-500, #f97316) 0%, var(--color-orange-400, #fb923c) 100%)',
                    borderColor: 'var(--color-orange-300, #fdba74)',
                    borderWidth: '2px',
                    borderStyle: 'solid',
                    boxShadow: '0 0 25px var(--accent-glow, rgba(249,115,22,0.45))'
                  }}
                >
                  {isBiometricAuthenticating ? (
                    <Loader2 className="h-9 w-9 animate-spin text-white" />
                  ) : (
                    <Fingerprint className="h-10 w-10 text-white stroke-[2.2] animate-pulse" />
                  )}
                </div>
              </div>

              {/* Action Text */}
              <div className="text-center space-y-1">
                <span className="uppercase tracking-[0.18em] font-sans text-xs font-black text-zinc-100 block">
                  {isBiometricAuthenticating ? 'Lendo Digital...' : 'Desbloquear com Digital'}
                </span>
                <span className="text-[10px] text-zinc-400 font-mono block">
                  Toque no sensor para autenticar
                </span>
              </div>
            </button>

            {/* Failed attempts status counter */}
            {biometricFailedAttempts > 0 && (
              <div className="flex items-center justify-center gap-2">
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-400 text-[10px] font-mono font-bold">
                  <span>Tentativa {biometricFailedAttempts} de 3</span>
                </div>
              </div>
            )}

            {/* Error Message */}
            <AnimatePresence>
              {errorMsg && (
                <motion.p 
                  initial={{ opacity: 0, y: -8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  className="text-[10px] text-red-400 font-bold font-mono tracking-wider text-center bg-red-950/30 py-2 px-3 rounded-xl border border-red-900/30"
                >
                  ⚠️ {errorMsg}
                </motion.p>
              )}
            </AnimatePresence>
          </div>
        ) : (
          /* ==================================================================== */
          /* MODE B: PASSWORD INPUT (Current screen fallback after 3 fails or if no bio) */
          /* ==================================================================== */
          <div className="w-full max-w-[320px] space-y-4">
            
            {/* If biometric is enabled and user failed 3 times, show quick retry option */}
            {appLockBiometricEnabled && (
              <div className="flex justify-center mb-1">
                <button
                  type="button"
                  onClick={() => {
                    setBiometricFailedAttempts(0);
                    setErrorMsg('');
                    handleBiometricUnlock();
                  }}
                  className="inline-flex items-center gap-2 text-[10px] font-mono font-bold px-3 py-1.5 rounded-full border transition-all cursor-pointer"
                  style={{
                    color: 'var(--color-orange-400, #fb923c)',
                    backgroundColor: 'var(--accent-glow-subtle, rgba(249,115,22,0.12))',
                    borderColor: 'var(--color-orange-500, #f97316)',
                    borderWidth: '1px'
                  }}
                >
                  <RefreshCw className="h-3 w-3" />
                  <span>Tentar biometria novamente</span>
                </button>
              </div>
            )}

            {/* Password Input */}
            <div className="relative group">
              {/* Input background glow and dynamic border colors on hover/focus */}
              <div className="absolute -inset-0.5 bg-gradient-to-r from-orange-500/10 via-purple-600/10 to-amber-500/10 rounded-2xl blur opacity-60 group-focus-within:opacity-100 transition duration-500" />
              
              {/* Premium key icon on the left */}
              <div 
                className="absolute left-3.5 top-1/2 -translate-y-1/2 p-1 rounded-lg border transition-all duration-300 z-20 pointer-events-none flex items-center justify-center"
                style={{
                  color: 'var(--color-orange-400, #fb923c)',
                  backgroundColor: 'var(--accent-glow-subtle, rgba(249,115,22,0.12))',
                  borderColor: 'var(--color-orange-500, #f97316)'
                }}
              >
                <KeyRound className="h-3.5 w-3.5 stroke-[2]" />
              </div>

              <input
                type={showPassword ? "text" : "password"}
                value={passwordInput}
                onChange={(e) => {
                  setPasswordInput(e.target.value);
                  setErrorMsg('');
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleUnlock();
                }}
                placeholder="••••••••"
                className="relative w-full bg-zinc-950/60 hover:bg-zinc-950/80 focus:bg-black/90 border border-zinc-900 focus:border-zinc-700 rounded-2xl pl-12 pr-14 py-4 text-xs text-center text-white placeholder-zinc-700 focus:outline-none transition-all duration-300 font-mono tracking-[0.6em] font-black shadow-2xl"
                autoFocus={true}
              />
              
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-4.5 top-1/2 -translate-y-1/2 text-zinc-600 hover:text-zinc-300 transition-colors p-1.5 z-20"
              >
                {showPassword ? <EyeOff className="h-4.5 w-4.5" /> : <Eye className="h-4.5 w-4.5" />}
              </button>
            </div>

            {/* Error Message */}
            <AnimatePresence>
              {errorMsg && (
                <motion.p 
                  initial={{ opacity: 0, y: -8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  className="text-[10px] text-red-400 font-bold font-mono tracking-wider text-center bg-red-950/20 py-1.5 px-3 rounded-lg border border-red-900/20"
                >
                  ⚠️ {errorMsg}
                </motion.p>
              )}
            </AnimatePresence>

            {/* Unlock Action Button */}
            <button
              onClick={handleUnlock}
              className="w-full text-xs font-black rounded-2xl py-4 transition-all duration-300 font-sans uppercase tracking-[0.18em] cursor-pointer text-white active:scale-[0.98]"
              style={{
                background: 'linear-gradient(135deg, var(--color-orange-500, #f97316) 0%, var(--color-orange-400, #fb923c) 100%)',
                boxShadow: '0 4px 24px var(--accent-glow, rgba(249,115,22,0.3))'
              }}
            >
              Entrar com Senha
            </button>
          </div>
        )}

        {/* Forgot password link */}
        <div className="mt-10 space-y-2.5">
          <button
            onClick={() => setShowForgotHelp(true)}
            className="text-[10px] text-zinc-500 hover:text-orange-400 font-bold uppercase tracking-[0.15em] font-sans transition-colors cursor-pointer"
          >
            Esqueceu a senha?
          </button>
          <p className="text-[9px] text-zinc-600 max-w-[280px] mx-auto leading-relaxed select-none">
            Seus dados locais de performance permanecem armazenados de forma blindada neste dispositivo.
          </p>
        </div>
      </motion.div>

      {/* --- FORGOT PASSWORD HELP PANEL MODAL --- */}
      <AnimatePresence>
        {showForgotHelp && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md">
            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: 15 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 15 }}
              transition={{ duration: 0.25, ease: 'easeOut' }}
              className="w-full max-w-sm bg-[#09090c] border border-zinc-850/80 rounded-3xl overflow-hidden shadow-2xl text-left"
            >
              <div className="p-6 space-y-4">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 bg-orange-500/10 rounded-xl text-orange-400">
                    <ShieldAlert className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="text-xs font-black text-white uppercase tracking-wider">Recuperar Acesso</h3>
                    <p className="text-[10px] text-zinc-500 font-mono">Informações de segurança local</p>
                  </div>
                </div>

                <div className="space-y-3 text-xs text-zinc-400 leading-relaxed font-sans">
                  <p>
                    Por motivos de <span className="text-zinc-200 font-semibold">segurança e privacidade local</span>, as senhas de bloqueio são salvas e processadas exclusivamente neste navegador.
                  </p>
                  <p>
                    Se você possui a <span className="text-emerald-400 font-bold">Sincronização Cloud</span> (Supabase) ativa neste dispositivo, você pode resetar o app localmente com total tranquilidade. Todo o seu progresso será restaurado automaticamente assim que se conectar à sua chave novamente.
                  </p>
                  <p className="text-[10px] bg-zinc-900/60 p-3 rounded-xl border border-zinc-900 text-zinc-500 flex gap-2">
                    <Info className="h-4 w-4 text-orange-400 shrink-0 mt-0.5" />
                    <span>Limpando a senha, o Planner voltará ao estado original. Seus dados na nuvem permanecem seguros.</span>
                  </p>
                </div>
              </div>

              <div className="px-6 py-4 bg-zinc-900/40 border-t border-zinc-900 flex justify-end gap-2.5">
                <button
                  onClick={() => setShowForgotHelp(false)}
                  className="px-4 py-2 bg-zinc-900 hover:bg-zinc-850 text-zinc-400 hover:text-white text-[10px] font-bold uppercase tracking-wider rounded-xl transition-colors"
                >
                  Voltar
                </button>
                <button
                  onClick={handleResetPasswordWithDataLossWarning}
                  className="px-4 py-2 bg-red-650 hover:bg-red-600 text-white text-[10px] font-black uppercase tracking-wider rounded-xl transition-all shadow-md shadow-red-550/10"
                >
                  Limpar Senha Local
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
