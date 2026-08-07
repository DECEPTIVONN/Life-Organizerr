import React, { useState, useEffect } from 'react';
import { Eye, EyeOff, ShieldAlert, X, Info, Lock, ShieldCheck, KeyRound, Fingerprint, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { verifyBiometric } from '../utils/biometricAuth';

interface LockScreenProps {
  userName: string;
  userPhoto: string;
  correctPassword?: string;
  onUnlock: () => void;
  appLockBiometricEnabled?: boolean;
}

export default function LockScreen({
  userName,
  userPhoto,
  correctPassword = '',
  onUnlock,
  appLockBiometricEnabled = false
}: LockScreenProps) {
  const [passwordInput, setPasswordInput] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [showForgotHelp, setShowForgotHelp] = useState(false);
  const [shakeTrigger, setShakeTrigger] = useState(false);
  const [isBiometricAuthenticating, setIsBiometricAuthenticating] = useState(false);
  const [hasTriggeredBiometric, setHasTriggeredBiometric] = useState(false);

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
      } else if (res.error) {
        setErrorMsg(res.error);
      }
    } catch (err) {
      setErrorMsg('Erro na leitura da digital. Digite sua senha.');
    } finally {
      setIsBiometricAuthenticating(false);
    }
  };

  useEffect(() => {
    if (appLockBiometricEnabled && !hasTriggeredBiometric) {
      setHasTriggeredBiometric(true);
      // Small timeout to allow component layout mount
      const timer = setTimeout(() => {
        handleBiometricUnlock();
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [appLockBiometricEnabled, hasTriggeredBiometric]);

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
      
      {/* Background Layer with User Image Background, Blended Gradient and Intense Blur */}
      <div 
        className="absolute inset-0 bg-cover bg-center transition-transform duration-[15000ms] ease-out scale-105"
        style={{
          backgroundImage: `linear-gradient(to bottom, rgba(4, 4, 5, 0.7) 0%, rgba(4, 4, 5, 0.9) 100%), url('/src/assets/images/1271888.jpg')`,
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
        className="relative z-10 w-full max-w-md px-8 py-12 text-center flex flex-col justify-center items-center"
      >
        {/* Subtle holographic watermark background matching premium design */}
        <div className="absolute inset-0 flex items-center justify-center opacity-5 pointer-events-none">
          <Lock className="w-80 h-80 text-orange-500 stroke-[0.5]" />
        </div>

        {/* Security Shield Lock Badge Indicator */}
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 bg-zinc-950/80 border border-orange-500/30 rounded-full mb-6 shadow-[0_0_20px_rgba(249,115,22,0.15)] backdrop-blur-md">
          <ShieldCheck className="h-4 w-4 text-orange-400" />
          <span className="text-[10px] font-mono font-bold tracking-widest text-orange-400 uppercase">TELA DE BLOQUEIO ATIVA</span>
        </div>

        {/* User profile picture framed with a sleek double border and state glow */}
        <div className="relative w-28 h-28 mb-6 group cursor-pointer">
          {/* Animated Neon glowing aura */}
          <div className="absolute -inset-1.5 bg-gradient-to-tr from-purple-600 via-pink-500 to-orange-500 rounded-full blur-md opacity-75 group-hover:opacity-100 transition duration-1000 group-hover:duration-200 animate-spin-slow" style={{ animationDuration: '8s' }} />
          
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

        {/* Locking description inspired by premium dashboard interfaces */}
        <p className="text-[11px] text-zinc-400/90 max-w-xs mx-auto leading-relaxed mb-8 select-none">
          {appLockBiometricEnabled ? (
            <>
              Desbloqueio por digital ativado. Toque na <span className="text-orange-400 font-bold">Impressão Digital</span> ou digite sua senha.
            </>
          ) : (
            <>
              O bloqueio do app está ativado. Digite sua <span className="text-zinc-200 font-bold">Senha de Bloqueio do App</span> para acessar o <span className="text-orange-500 font-black tracking-widest font-mono">PLANNER</span>.
            </>
          )}
        </p>

        {/* Password & Biometric unlock controls */}
        <div className="w-full max-w-[320px] space-y-4">
          
          {/* PRIMARY OPTION: Fingerprint Unlock Button (when biometric is enabled) */}
          {appLockBiometricEnabled && (
            <div className="space-y-3">
              <button
                type="button"
                onClick={handleBiometricUnlock}
                disabled={isBiometricAuthenticating}
                className="w-full bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-400 hover:to-amber-400 text-white font-black text-xs py-4 rounded-2xl flex items-center justify-center gap-3 transition-all duration-300 shadow-[0_4px_25px_rgba(249,115,22,0.35)] hover:shadow-[0_6px_35px_rgba(249,115,22,0.5)] active:scale-[0.98] cursor-pointer"
              >
                {isBiometricAuthenticating ? (
                  <Loader2 className="h-5 w-5 animate-spin text-white" />
                ) : (
                  <Fingerprint className="h-6 w-6 text-white stroke-[2.2]" />
                )}
                <span className="uppercase tracking-[0.18em] font-sans text-xs">
                  {isBiometricAuthenticating ? 'Lendo Digital...' : 'Desbloquear com Digital'}
                </span>
              </button>

              <div className="flex items-center gap-3 py-1">
                <div className="h-[1px] flex-1 bg-zinc-800/80" />
                <span className="text-[10px] font-mono text-zinc-500 uppercase tracking-widest">Ou use a senha</span>
                <div className="h-[1px] flex-1 bg-zinc-800/80" />
              </div>
            </div>
          )}

          {/* SECONDARY / DEFAULT OPTION: Password Input */}
          <div className="relative group">
            {/* Input background glow and dynamic border colors on hover/focus */}
            <div className="absolute -inset-0.5 bg-gradient-to-r from-orange-500/10 via-purple-600/10 to-amber-500/10 rounded-2xl blur opacity-60 group-focus-within:opacity-100 transition duration-500" />
            
            {/* Premium key icon on the left */}
            <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-orange-400 p-1 bg-orange-500/10 rounded-lg border border-orange-500/20 group-focus-within:border-orange-500/40 group-focus-within:bg-orange-500/20 transition-all duration-300 z-20 pointer-events-none flex items-center justify-center">
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
              className="relative w-full bg-zinc-950/60 hover:bg-zinc-950/80 focus:bg-black/90 border border-zinc-900 focus:border-orange-500/40 rounded-2xl pl-12 pr-14 py-4 text-xs text-center text-white placeholder-zinc-700 focus:outline-none transition-all duration-300 font-mono tracking-[0.6em] font-black shadow-2xl"
              autoFocus={!appLockBiometricEnabled}
            />
            
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-4.5 top-1/2 -translate-y-1/2 text-zinc-600 hover:text-zinc-300 transition-colors p-1.5 z-20"
            >
              {showPassword ? <EyeOff className="h-4.5 w-4.5" /> : <Eye className="h-4.5 w-4.5" />}
            </button>
          </div>

          {/* Correct/Incorrect password error messages */}
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
            className={`w-full text-xs font-bold rounded-2xl transition-all duration-300 font-sans uppercase tracking-[0.18em] cursor-pointer ${
              appLockBiometricEnabled
                ? 'bg-zinc-900 hover:bg-zinc-850 text-zinc-300 py-3.5 border border-zinc-800 hover:border-zinc-700'
                : 'bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-400 hover:to-amber-400 text-white font-black py-4 shadow-[0_4px_24px_rgba(249,115,22,0.25)] hover:shadow-[0_4px_30px_rgba(249,115,22,0.45)]'
            }`}
          >
            Entrar com Senha
          </button>
        </div>

        {/* Forgot password link */}
        <div className="mt-12 space-y-3">
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
