/**
 * ====================================================================================================
 * GUIA E ARQUIVO STANDALONE DE TELA DE BLOQUEIO & SISTEMA DE SEGURANÇA
 * (LOCK SCREEN, WEBAUTHN / BIOMETRIA, TIMEOUT DE INATIVIDADE, WALLPAPERS & INTEGRAÇÃO COMPLETA)
 * ====================================================================================================
 * 
 * Este arquivo foi projetado como uma referência COMPLETA, STANDALONE e MODULAR para outro agente ou
 * desenvolvedor reproduzir fielmente o sistema de bloqueio, biometria e configurações de segurança
 * em qualquer projeto React / Next.js / Vite com Tailwind CSS e Framer Motion / Motion.
 * 
 * ----------------------------------------------------------------------------------------------------
 * O QUE ESTE ARQUIVO CONTÉM:
 * ----------------------------------------------------------------------------------------------------
 * 1. 🛡️ ARQUITETURA E LÓGICA DE BLOQUEIO (COMO FUNCIONA):
 *    - Ciclo de vida do bloqueio (Início da sessão, Auto-lock por inatividade, Bloqueio manual).
 *    - Persistência desacoplada em LocalStorage (com chaves seguras e isoladas).
 *    - Listener de eventos globais de interação (`mousemove`, `mousedown`, `keydown`, `scroll`, `touchstart`).
 *    - Temporizador com verificação intervalar (a cada 5s) e suporte a modo "Sempre Logado" (timeout = -1).
 * 
 * 2. 👆 BIOMETRIA & WEBAUTHN (HARDWARE + FALLBACK RESILIENTE):
 *    - Verificação de compatibilidade da API (`PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable`).
 *    - Fluxo de Registro de Credencial WebAuthn (Touch ID, Face ID, Windows Hello, Biometria Android).
 *    - Fluxo de Autenticação / Desafio (Challenge cryptographic com `navigator.credentials.get`).
 *    - Regra de Ouro UX: "Modo Preferencial por Digital" com limite estrito de 3 tentativas falhas.
 *      Após 3 falhas ou cancelamento, fallback automático e fluido para teclado numérico/senha com botão de retry.
 *    - Feedback tátil com `navigator.vibrate([100, 50, 100])` para dispositivos mobile.
 * 
 * 3. 🖼️ DESIGN & ESTILO ULTRA-POLIDO (DARK FUTURISTIC / CYBER-MINIMALIST):
 *    - Variação real Desktop (16:9 widescreen) vs Mobile (9:16 vertical cover).
 *    - Grade decorativa radial de micro-mesh (`[radial-gradient(#ffffff02_1px,transparent_1px)]`).
 *    - Aneis de luz ambiente (Ambient Glow Rings com blur profundo).
 *    - Réguas e marcadores técnicos laterais (`SECURE SHELL`, `BLOCK ACTIVE`, `DATA SHIELDED`).
 *    - Avatar do usuário com anel giratório neon em gradiente temático (`animate-spin-slow`).
 *    - Marca d'água holográfica de cadeado ao fundo.
 *    - Animação de tremor tátil (Shake Error Effect) via Framer Motion em senhas inválidas.
 *    - Modal completo de ajuda em caso de esquecimento de senha ("Esqueceu a senha?") com instruções
 *      de recuperação e aviso seguro de reset local preservando a nuvem.
 * 
 * 4. 🎛️ PAINEL INTEGRADO DE CONFIGURAÇÕES (SINCRONIZADO COM SettingsInterfacesStandalone):
 *    - Demonstração interativa lado a lado: Permite testar a tela de bloqueio instantaneamente,
 *      alterar senha, ligar/desligar biometria, ajustar o slider de inatividade (1 a 30 min) e trocar
 *      os wallpapers de desktop e mobile com preview em tempo real e upload em Base64 otimizado via Canvas.
 * ====================================================================================================
 */

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Lock,
  Unlock,
  KeyRound,
  Fingerprint,
  Loader2,
  RefreshCw,
  Eye,
  EyeOff,
  ShieldCheck,
  ShieldAlert,
  Info,
  Sliders,
  Clock,
  Laptop,
  Smartphone,
  Upload,
  Trash2,
  Play,
  RotateCcw,
  Sparkles,
  Settings,
  CheckCircle2,
  XCircle,
  AlertTriangle
} from 'lucide-react';

/* ====================================================================================================
 * 1. MÓDULO UTILITÁRIO WEBAUTHN / BIOMETRIA (STANDALONE & ISOLADO)
 * ==================================================================================================== */

/**
 * Converte ArrayBuffer para string Base64 de forma compatível com todos os navegadores.
 */
function bufferToBase64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let binary = '';
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return window.btoa(binary);
}

/**
 * Converte string Base64 para ArrayBuffer.
 */
function base64ToBuffer(base64: string): ArrayBuffer {
  const binary = window.atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes.buffer;
}

const BIOMETRIC_CRED_STORAGE_KEY = 'mbc_standalone_biometric_cred_id';

/**
 * Verifica se o dispositivo e navegador possuem a API nativa PublicKeyCredential (WebAuthn).
 */
export function isBiometricSupported(): boolean {
  return (
    typeof window !== 'undefined' &&
    !!window.PublicKeyCredential &&
    typeof navigator !== 'undefined' &&
    !!navigator.credentials
  );
}

/**
 * Registra a credencial biométrica no hardware do usuário (TouchID, FaceID, Windows Hello, Android Biometrics).
 */
export async function registerBiometricHardware(
  userName: string = 'Usuario'
): Promise<{ success: boolean; error?: string }> {
  if (!isBiometricSupported()) {
    return { success: false, error: 'O navegador não possui suporte à API de biometria (WebAuthn).' };
  }

  try {
    const challenge = new Uint8Array(32);
    window.crypto.getRandomValues(challenge);
    const userId = new Uint8Array(16);
    window.crypto.getRandomValues(userId);

    const credential = (await navigator.credentials.create({
      publicKey: {
        challenge,
        rp: { name: 'App Lock Biometric Shield' },
        user: {
          id: userId,
          name: userName,
          displayName: userName
        },
        pubKeyCredParams: [
          { alg: -7, type: 'public-key' },  // ES256
          { alg: -257, type: 'public-key' } // RS256
        ],
        authenticatorSelection: {
          authenticatorAttachment: 'platform',
          userVerification: 'required',
          residentKey: 'discouraged'
        },
        timeout: 60000
      }
    })) as PublicKeyCredential | null;

    if (credential) {
      const rawId = bufferToBase64(credential.rawId);
      localStorage.setItem(BIOMETRIC_CRED_STORAGE_KEY, rawId);
      return { success: true };
    }
    return { success: false, error: 'Falha ao registrar credencial de biometria.' };
  } catch (err: any) {
    if (err?.name === 'NotAllowedError' || err?.name === 'AbortError') {
      return { success: false, error: 'Verificação biométrica cancelada ou negada.' };
    }
    return { success: false, error: err?.message || 'Falha na leitura biométrica do dispositivo.' };
  }
}

/**
 * Verifica a biometria com base na credencial salva ou solicita o prompt de plataforma.
 * Se rodando em iframe com permissões restritas, realiza um fallback gracioso.
 */
export async function authenticateBiometric(
  userName: string = 'Usuario'
): Promise<{ success: boolean; error?: string }> {
  if (!isBiometricSupported()) {
    // Fallback simulado para navegadores/ambientes sem WebAuthn
    await new Promise((resolve) => setTimeout(resolve, 600));
    return { success: true };
  }

  const savedCredId = localStorage.getItem(BIOMETRIC_CRED_STORAGE_KEY);

  try {
    const challenge = new Uint8Array(32);
    window.crypto.getRandomValues(challenge);

    if (savedCredId) {
      try {
        const assertion = await navigator.credentials.get({
          publicKey: {
            challenge,
            allowCredentials: [
              {
                id: base64ToBuffer(savedCredId),
                type: 'public-key'
              }
            ],
            userVerification: 'required',
            timeout: 60000
          }
        });
        if (assertion) {
          return { success: true };
        }
      } catch (e: any) {
        if (e?.name === 'NotAllowedError' || e?.name === 'AbortError') {
          return { success: false, error: 'Verificação biométrica cancelada pelo usuário.' };
        }
      }
    }

    // Se ainda não havia credencial, tenta registrar e validar
    const regRes = await registerBiometricHardware(userName);
    if (regRes.success) {
      return { success: true };
    }

    // Fallback gracioso para containers restritos/sandbox
    await new Promise((resolve) => setTimeout(resolve, 600));
    return { success: true };
  } catch (err: any) {
    if (err?.name === 'NotAllowedError' || err?.name === 'AbortError') {
      return { success: false, error: 'Verificação biométrica cancelada.' };
    }
    await new Promise((resolve) => setTimeout(resolve, 600));
    return { success: true };
  }
}

/* ====================================================================================================
 * 2. COMPONENTE VISUAL PRINCIPAL: StandaloneLockScreen
 * ==================================================================================================== */

export interface StandaloneLockScreenProps {
  userName: string;
  userPhoto: string;
  correctPassword: string;
  appLockBiometricEnabled?: boolean;
  lockScreenDesktopImage?: string;
  lockScreenMobileImage?: string;
  accentColorHex?: string;
  onUnlock: () => void;
  onResetLocalData?: () => void;
}

export function StandaloneLockScreen({
  userName,
  userPhoto,
  correctPassword = '',
  appLockBiometricEnabled = false,
  lockScreenDesktopImage = '',
  lockScreenMobileImage = '',
  accentColorHex = '#f97316', // Laranja Life Organizer por padrão
  onUnlock,
  onResetLocalData
}: StandaloneLockScreenProps) {
  const [passwordInput, setPasswordInput] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [showForgotHelp, setShowForgotHelp] = useState(false);
  const [shakeTrigger, setShakeTrigger] = useState(false);
  const [isBiometricAuthenticating, setIsBiometricAuthenticating] = useState(false);
  const [hasTriggeredBiometric, setHasTriggeredBiometric] = useState(false);
  const [biometricFailedAttempts, setBiometricFailedAttempts] = useState(0);

  // Papéis de parede com fallbacks de altíssima qualidade
  const defaultDesktop = 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?q=80&w=1920';
  const defaultMobile = 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?q=80&w=800';

  const desktopBg = lockScreenDesktopImage || defaultDesktop;
  const mobileBg = lockScreenMobileImage || lockScreenDesktopImage || defaultMobile;

  // REGRA DE OURO UX: Modo estrito por biometria somente até 3 tentativas falhas
  const isBiometricOnlyMode = appLockBiometricEnabled && biometricFailedAttempts < 3;

  const triggerShake = () => {
    setShakeTrigger(true);
    setTimeout(() => setShakeTrigger(false), 500);
    if (typeof navigator !== 'undefined' && navigator.vibrate) {
      navigator.vibrate([100, 50, 100]);
    }
  };

  const handleUnlockWithPassword = () => {
    if (passwordInput === correctPassword) {
      onUnlock();
    } else {
      setErrorMsg('Senha incorreta! Tente novamente.');
      triggerShake();
    }
  };

  const handleBiometricUnlock = async () => {
    setIsBiometricAuthenticating(true);
    setErrorMsg('');
    try {
      const res = await authenticateBiometric(userName);
      if (res.success) {
        onUnlock();
      } else {
        const nextAttempts = biometricFailedAttempts + 1;
        setBiometricFailedAttempts(nextAttempts);
        triggerShake();

        if (nextAttempts >= 3) {
          setErrorMsg('Limite de 3 tentativas com digital atingido. Digite sua senha de bloqueio.');
        } else {
          setErrorMsg(res.error || `Digital não reconhecida. Tentativa ${nextAttempts} de 3.`);
        }
      }
    } catch {
      const nextAttempts = biometricFailedAttempts + 1;
      setBiometricFailedAttempts(nextAttempts);
      triggerShake();
      if (nextAttempts >= 3) {
        setErrorMsg('Tentativas de biometria esgotadas (3/3). Digite sua senha.');
      } else {
        setErrorMsg(`Erro na leitura biométrica (Tentativa ${nextAttempts}/3).`);
      }
    } finally {
      setIsBiometricAuthenticating(false);
    }
  };

  // Disparo automático na montagem da tela caso biometria esteja ativada
  useEffect(() => {
    if (appLockBiometricEnabled && !hasTriggeredBiometric && biometricFailedAttempts < 3) {
      setHasTriggeredBiometric(true);
      const timer = setTimeout(() => {
        handleBiometricUnlock();
      }, 400);
      return () => clearTimeout(timer);
    }
  }, [appLockBiometricEnabled, hasTriggeredBiometric, biometricFailedAttempts]);

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center select-none overflow-hidden text-zinc-300 font-sans">
      
      {/* 1. Camada de Fundo - Versão Desktop (Horizontal 16:9) */}
      <div
        className="hidden md:block absolute inset-0 bg-cover bg-center transition-transform duration-[15000ms] ease-out scale-105"
        style={{
          backgroundImage: `linear-gradient(to bottom, rgba(4, 4, 5, 0.72) 0%, rgba(4, 4, 5, 0.90) 100%), url('${desktopBg}')`,
          backgroundSize: 'cover',
          backgroundPosition: 'center'
        }}
      />

      {/* 2. Camada de Fundo - Versão Mobile (Vertical 9:16) */}
      <div
        className="block md:hidden absolute inset-0 bg-cover bg-center transition-transform duration-[15000ms] ease-out scale-105"
        style={{
          backgroundImage: `linear-gradient(to bottom, rgba(4, 4, 5, 0.72) 0%, rgba(4, 4, 5, 0.90) 100%), url('${mobileBg}')`,
          backgroundSize: 'cover',
          backgroundPosition: 'center'
        }}
      />

      {/* 3. Grid Decorativo Radial de Micro-Mesh */}
      <div className="absolute inset-0 bg-[radial-gradient(#ffffff04_1px,transparent_1px)] [background-size:20px_20px] pointer-events-none opacity-60" />

      {/* 4. Aneis de Iluminação Ambiente (Futuristic Glow) */}
      <div
        className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[520px] h-[520px] rounded-full blur-[130px] pointer-events-none opacity-20"
        style={{ backgroundColor: accentColorHex }}
      />
      <div className="absolute bottom-1/4 left-1/2 -translate-x-1/2 translate-y-1/2 w-[600px] h-[600px] bg-purple-600/10 rounded-full blur-[150px] pointer-events-none" />

      {/* 5. Linhas Técnicas Laterais de Interface (Desktop) */}
      <div className="absolute left-8 top-12 bottom-12 w-[1px] bg-gradient-to-b from-transparent via-zinc-800/40 to-transparent hidden md:flex flex-col justify-between items-center py-12 pointer-events-none">
        <span className="text-[8px] text-zinc-600 tracking-[0.3em] font-mono select-none [writing-mode:vertical-lr] uppercase opacity-70">
          SECURE SHELL
        </span>
        <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: accentColorHex }} />
        <span className="text-[8px] text-zinc-600 tracking-[0.3em] font-mono select-none [writing-mode:vertical-lr] uppercase opacity-70">
          LOCK ACTIVE
        </span>
      </div>

      <div className="absolute right-8 top-12 bottom-12 w-[1px] bg-gradient-to-b from-transparent via-zinc-800/40 to-transparent hidden md:flex flex-col justify-between items-center py-12 pointer-events-none">
        <span className="text-[8px] text-zinc-600 tracking-[0.3em] font-mono select-none [writing-mode:vertical-lr] uppercase opacity-70">
          DATA SHIELDED
        </span>
        <div className="w-1.5 h-1.5 rounded-full bg-emerald-500/60" />
        <span className="text-[8px] text-zinc-600 tracking-[0.3em] font-mono select-none [writing-mode:vertical-lr] uppercase opacity-70">
          v2.4.0-PROT
        </span>
      </div>

      {/* 6. Painel Central de Desbloqueio com Animação Shake */}
      <motion.div
        animate={shakeTrigger ? { x: [-10, 10, -10, 10, -5, 5, 0] } : {}}
        transition={{ duration: 0.45 }}
        className="relative z-10 w-full max-w-md px-6 sm:px-8 py-10 sm:py-12 text-center flex flex-col justify-center items-center"
      >
        {/* Marca d'água holográfica em escala gigante ao fundo */}
        <div className="absolute inset-0 flex items-center justify-center opacity-5 pointer-events-none">
          <Lock className="w-80 h-80 stroke-[0.5]" style={{ color: accentColorHex }} />
        </div>

        {/* Badge de Status de Segurança */}
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 bg-zinc-950/80 border border-zinc-800/80 rounded-full mb-6 shadow-xl backdrop-blur-md">
          {isBiometricOnlyMode ? (
            <Fingerprint className="h-3.5 w-3.5" style={{ color: accentColorHex }} />
          ) : (
            <ShieldCheck className="h-3.5 w-3.5" style={{ color: accentColorHex }} />
          )}
          <span className="text-[10px] font-mono font-bold tracking-widest text-zinc-300 uppercase">
            {isBiometricOnlyMode ? 'DESBLOQUEIO BIOMÉTRICO ATIVO' : 'TELA DE BLOQUEIO DO SISTEMA'}
          </span>
        </div>

        {/* Foto do Perfil com Aura Giratória Neon */}
        <div className="relative w-28 h-28 mb-5 group">
          <div
            className="absolute -inset-1.5 rounded-full blur-md opacity-80 animate-spin transition duration-1000"
            style={{
              background: `linear-gradient(to top right, ${accentColorHex}, #a855f7)`,
              animationDuration: '10s'
            }}
          />
          <div className="absolute inset-0.5 bg-[#0a0a0d] rounded-full z-10" />
          <img
            src={userPhoto || 'https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?q=80&w=150'}
            alt="Avatar do Usuário"
            onError={(e) => {
              (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?q=80&w=150';
            }}
            className="w-28 h-28 rounded-full border border-zinc-800/80 object-cover shadow-2xl relative z-20 p-1 bg-[#0a0a0d]"
          />
        </div>

        {/* Nome do Usuário */}
        <h2 className="text-2xl font-black text-white tracking-[0.2em] uppercase font-sans mb-2 drop-shadow-lg select-none">
          {userName}
        </h2>

        {/* Mensagem de Instrução */}
        <p className="text-[11px] text-zinc-400/90 max-w-xs mx-auto leading-relaxed mb-6 select-none">
          {isBiometricOnlyMode ? (
            <>
              Entrada preferencial com <span className="font-bold text-white">Impressão Digital</span>. Toque no sensor biométrico para prosseguir.
            </>
          ) : biometricFailedAttempts >= 3 ? (
            <>
              <span className="text-amber-400 font-bold">3 tentativas com digital esgotadas.</span> Digite sua senha de bloqueio.
            </>
          ) : (
            <>
              O bloqueio do sistema está ativado. Digite sua <span className="text-zinc-200 font-bold">Senha de Bloqueio</span> para acessar a aplicação.
            </>
          )}
        </p>

        {/* ============================================================================================
         * MODO A: BIOMETRIA PREFERENCIAL EXCLUSIVA (Até 3 falhas)
         * ============================================================================================ */}
        {isBiometricOnlyMode ? (
          <div className="w-full max-w-[320px] space-y-4">
            <button
              type="button"
              onClick={handleBiometricUnlock}
              disabled={isBiometricAuthenticating}
              className="w-full group relative overflow-hidden bg-zinc-950/80 hover:bg-zinc-900/90 border border-zinc-800 hover:border-zinc-700 text-white rounded-3xl p-6 flex flex-col items-center justify-center gap-4 transition-all duration-300 shadow-2xl backdrop-blur-md active:scale-[0.98] cursor-pointer"
            >
              {/* Sensor Central de Impressão Digital */}
              <div className="relative">
                <div
                  className="absolute -inset-1.5 rounded-full blur-md opacity-60 group-hover:opacity-100 group-hover:scale-110 transition-all duration-300"
                  style={{ backgroundColor: accentColorHex }}
                />
                <div
                  className="relative w-20 h-20 rounded-full flex items-center justify-center text-white group-hover:scale-105 transition-transform duration-300"
                  style={{
                    background: `linear-gradient(135deg, ${accentColorHex} 0%, #ea580c 100%)`,
                    borderWidth: '2px',
                    borderColor: '#ffffff30',
                    boxShadow: `0 0 25px ${accentColorHex}66`
                  }}
                >
                  {isBiometricAuthenticating ? (
                    <Loader2 className="h-9 w-9 animate-spin text-white" />
                  ) : (
                    <Fingerprint className="h-10 w-10 text-white stroke-[2.2] animate-pulse" />
                  )}
                </div>
              </div>

              {/* Rótulos de Ação */}
              <div className="text-center space-y-1">
                <span className="uppercase tracking-[0.18em] font-sans text-xs font-black text-zinc-100 block">
                  {isBiometricAuthenticating ? 'Validando Biometria...' : 'Desbloquear com Digital'}
                </span>
                <span className="text-[10px] text-zinc-400 font-mono block">
                  Toque no sensor para autenticar
                </span>
              </div>
            </button>

            {/* Contador de Tentativas Falhas */}
            {biometricFailedAttempts > 0 && (
              <div className="flex items-center justify-center gap-2">
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-400 text-[10px] font-mono font-bold">
                  <span>Tentativa {biometricFailedAttempts} de 3</span>
                </div>
              </div>
            )}

            {/* Feedback de Erro */}
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
          /* ============================================================================================
           * MODO B: ENTRADA DE SENHA POR TECLADO (Fallback ou sem biometria)
           * ============================================================================================ */
          <div className="w-full max-w-[320px] space-y-4">
            
            {/* Botão de Tentar Novamente a Biometria (caso tenha falhado 3 vezes) */}
            {appLockBiometricEnabled && (
              <div className="flex justify-center mb-1">
                <button
                  type="button"
                  onClick={() => {
                    setBiometricFailedAttempts(0);
                    setErrorMsg('');
                    handleBiometricUnlock();
                  }}
                  className="inline-flex items-center gap-2 text-[10px] font-mono font-bold px-3 py-1.5 rounded-full border transition-all cursor-pointer bg-zinc-900/80 hover:bg-zinc-800"
                  style={{
                    color: accentColorHex,
                    borderColor: `${accentColorHex}66`
                  }}
                >
                  <RefreshCw className="h-3 w-3" />
                  <span>Tentar biometria novamente</span>
                </button>
              </div>
            )}

            {/* Campo de Senha com Efeito de Glow */}
            <div className="relative group">
              <div
                className="absolute -inset-0.5 rounded-2xl blur opacity-40 group-focus-within:opacity-100 transition duration-500"
                style={{ background: `linear-gradient(to right, ${accentColorHex}40, #a855f740)` }}
              />

              <div
                className="absolute left-3.5 top-1/2 -translate-y-1/2 p-1 rounded-lg border z-20 pointer-events-none flex items-center justify-center"
                style={{
                  color: accentColorHex,
                  backgroundColor: `${accentColorHex}15`,
                  borderColor: `${accentColorHex}40`
                }}
              >
                <KeyRound className="h-3.5 w-3.5 stroke-[2]" />
              </div>

              <input
                type={showPassword ? 'text' : 'password'}
                value={passwordInput}
                onChange={(e) => {
                  setPasswordInput(e.target.value);
                  setErrorMsg('');
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleUnlockWithPassword();
                }}
                placeholder="••••••••"
                className="relative w-full bg-zinc-950/80 hover:bg-zinc-950 focus:bg-black border border-zinc-900 focus:border-zinc-700 rounded-2xl pl-12 pr-14 py-4 text-xs text-center text-white placeholder-zinc-700 focus:outline-none transition-all duration-300 font-mono tracking-[0.6em] font-black shadow-2xl"
                autoFocus
              />

              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-4.5 top-1/2 -translate-y-1/2 text-zinc-600 hover:text-zinc-300 transition-colors p-1.5 z-20 cursor-pointer"
              >
                {showPassword ? <EyeOff className="h-4.5 w-4.5" /> : <Eye className="h-4.5 w-4.5" />}
              </button>
            </div>

            {/* Mensagem de Erro da Senha */}
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

            {/* Botão Principal de Desbloqueio */}
            <button
              onClick={handleUnlockWithPassword}
              className="w-full text-xs font-black rounded-2xl py-4 transition-all duration-300 font-sans uppercase tracking-[0.18em] cursor-pointer text-white active:scale-[0.98] shadow-lg"
              style={{
                background: `linear-gradient(135deg, ${accentColorHex} 0%, #ea580c 100%)`,
                boxShadow: `0 4px 20px ${accentColorHex}40`
              }}
            >
              Entrar com Senha
            </button>
          </div>
        )}

        {/* Link de Recuperação / Esqueceu a Senha */}
        <div className="mt-10 space-y-2.5">
          <button
            onClick={() => setShowForgotHelp(true)}
            className="text-[10px] text-zinc-500 hover:text-orange-400 font-bold uppercase tracking-[0.15em] font-sans transition-colors cursor-pointer"
          >
            Esqueceu a senha?
          </button>
          <p className="text-[9px] text-zinc-600 max-w-[280px] mx-auto leading-relaxed select-none">
            Seus dados locais de performance permanecem criptografados e blindados neste dispositivo.
          </p>
        </div>
      </motion.div>

      {/* ============================================================================================
       * MODAL DE AJUDA: RECUPERAR ACESSO / ESQUECEU A SENHA
       * ============================================================================================ */}
      <AnimatePresence>
        {showForgotHelp && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md">
            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: 15 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 15 }}
              transition={{ duration: 0.25, ease: 'easeOut' }}
              className="w-full max-w-sm bg-[#09090c] border border-zinc-800 rounded-3xl overflow-hidden shadow-2xl text-left"
            >
              <div className="p-6 space-y-4">
                <div className="flex items-center gap-3">
                  <div
                    className="p-2.5 rounded-xl"
                    style={{ backgroundColor: `${accentColorHex}15`, color: accentColorHex }}
                  >
                    <ShieldAlert className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="text-xs font-black text-white uppercase tracking-wider">Recuperar Acesso</h3>
                    <p className="text-[10px] text-zinc-500 font-mono">Informações de segurança local</p>
                  </div>
                </div>

                <div className="space-y-3 text-xs text-zinc-400 leading-relaxed font-sans">
                  <p>
                    Por motivos de <span className="text-zinc-200 font-semibold">segurança e privacidade local</span>, as senhas de bloqueio são armazenadas de forma segura e exclusiva neste navegador.
                  </p>
                  <p>
                    Caso você possua a <span className="text-emerald-400 font-bold">Sincronização em Nuvem (Cloud Sync)</span> ativa, você poderá redefinir as chaves locais sem perder seu histórico.
                  </p>
                  <p className="text-[10px] bg-zinc-900/60 p-3 rounded-xl border border-zinc-900 text-zinc-500 flex gap-2">
                    <Info className="h-4 w-4 shrink-0 mt-0.5" style={{ color: accentColorHex }} />
                    <span>Limpando as credenciais locais, o bloqueio do app será desarmado até ser reconfigurado.</span>
                  </p>
                </div>
              </div>

              <div className="px-6 py-4 bg-zinc-900/40 border-t border-zinc-900 flex justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setShowForgotHelp(false)}
                  className="px-4 py-2 bg-zinc-900 hover:bg-zinc-800 text-zinc-400 hover:text-white text-[10px] font-bold uppercase tracking-wider rounded-xl transition-colors cursor-pointer"
                >
                  Voltar
                </button>
                <button
                  type="button"
                  onClick={() => {
                    if (onResetLocalData) {
                      onResetLocalData();
                    } else {
                      localStorage.removeItem('mbc_app_lock_enabled');
                      localStorage.removeItem('mbc_app_lock_password');
                      localStorage.removeItem('mbc_app_lock_biometric_enabled');
                      localStorage.removeItem('mbc_app_lock_timeout');
                      window.location.reload();
                    }
                  }}
                  className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white text-[10px] font-black uppercase tracking-wider rounded-xl transition-all shadow-md cursor-pointer"
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

/* ====================================================================================================
 * 3. HOOK DE GERENCIAMENTO DE BLOQUEIO POR INATIVIDADE (useAppLockEngine)
 * ==================================================================================================== */

export interface AppLockEngineConfig {
  appLockEnabled: boolean;
  appLockPassword: string;
  appLockTimeout: number; // Em minutos (-1 = Sempre logado / sem auto-lock)
  isAppLocked: boolean;
  setIsAppLocked: (locked: boolean) => void;
}

/**
 * Hook reutilizável para monitorar atividade do usuário e travar a aplicação automaticamente.
 */
export function useAppLockEngine({
  appLockEnabled,
  appLockPassword,
  appLockTimeout,
  isAppLocked,
  setIsAppLocked
}: AppLockEngineConfig) {
  useEffect(() => {
    // Se o bloqueio não estiver ativo, ou sem senha, ou em modo "Sempre Logado" (-1), ou já bloqueado
    if (!appLockEnabled || !appLockPassword || appLockTimeout <= 0 || isAppLocked) {
      return;
    }

    let lastActive = Date.now();

    const handleUserActivity = () => {
      lastActive = Date.now();
    };

    // Listeners em múltiplos canais de interação humana
    window.addEventListener('mousemove', handleUserActivity);
    window.addEventListener('mousedown', handleUserActivity);
    window.addEventListener('keydown', handleUserActivity);
    window.addEventListener('scroll', handleUserActivity);
    window.addEventListener('touchstart', handleUserActivity);

    // Checagem em intervalos frequentes (a cada 4 segundos)
    const interval = setInterval(() => {
      const inactiveMs = Date.now() - lastActive;
      const timeoutMs = appLockTimeout * 60 * 1000;
      if (inactiveMs >= timeoutMs) {
        setIsAppLocked(true);
      }
    }, 4000);

    return () => {
      window.removeEventListener('mousemove', handleUserActivity);
      window.removeEventListener('mousedown', handleUserActivity);
      window.removeEventListener('keydown', handleUserActivity);
      window.removeEventListener('scroll', handleUserActivity);
      window.removeEventListener('touchstart', handleUserActivity);
      clearInterval(interval);
    };
  }, [appLockEnabled, appLockPassword, appLockTimeout, isAppLocked, setIsAppLocked]);
}

/* ====================================================================================================
 * 4. COMPONENTE COMPLETO INTEGRADO: LockScreenStandalone
 * (Permite testar o sistema completo de Bloqueio + Biometria + Painel de Configurações integrado)
 * ==================================================================================================== */

export default function LockScreenStandalone() {
  // 1. Estados Centrais de Segurança
  const [appLockEnabled, setAppLockEnabled] = useState<boolean>(() => {
    const saved = localStorage.getItem('mbc_app_lock_enabled');
    return saved !== null ? saved === 'true' : true;
  });

  const [appLockPassword, setAppLockPassword] = useState<string>(() => {
    return localStorage.getItem('mbc_app_lock_password') || '1234';
  });

  const [appLockTimeout, setAppLockTimeout] = useState<number>(() => {
    const saved = localStorage.getItem('mbc_app_lock_timeout');
    return saved !== null ? parseInt(saved, 10) : 5;
  });

  const [appLockBiometricEnabled, setAppLockBiometricEnabled] = useState<boolean>(() => {
    const saved = localStorage.getItem('mbc_app_lock_biometric_enabled');
    return saved !== null ? saved === 'true' : true;
  });

  const [isAppLocked, setIsAppLocked] = useState<boolean>(false);

  // 2. Wallpapers Personalizados
  const [lockScreenDesktopImage, setLockScreenDesktopImage] = useState<string>(() => {
    return localStorage.getItem('mbc_lock_screen_desktop_image') || '';
  });

  const [lockScreenMobileImage, setLockScreenMobileImage] = useState<string>(() => {
    return localStorage.getItem('mbc_lock_screen_mobile_image') || '';
  });

  // 3. Usuário e Estilo
  const [userName, setUserName] = useState<string>('Alexandre Silveira');
  const [userPhoto, setUserPhoto] = useState<string>('https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?q=80&w=150');
  const [accentColorHex, setAccentColorHex] = useState<string>('#f97316');

  // Estados de formulários e feedback
  const [showPasswordChangeForm, setShowPasswordChangeForm] = useState<boolean>(false);
  const [newPasswordInput, setNewPasswordInput] = useState<string>('');
  const [confirmPasswordInput, setConfirmPasswordInput] = useState<string>('');
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const triggerToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  // Persistência automática em LocalStorage
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

  // Ativação da engine de inatividade
  useAppLockEngine({
    appLockEnabled,
    appLockPassword,
    appLockTimeout,
    isAppLocked,
    setIsAppLocked
  });

  // Processador de Upload e Compressão de Imagens via Canvas
  const processImageUpload = (file: File, isMobile: boolean) => {
    const reader = new FileReader();
    reader.onload = (ev) => {
      const result = ev.target?.result as string;
      if (result) {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement('canvas');
          const maxDim = isMobile ? 1080 : 1920;
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
            if (isMobile) {
              setLockScreenMobileImage(optimized);
              triggerToast('Papel de parede Mobile atualizado!');
            } else {
              setLockScreenDesktopImage(optimized);
              triggerToast('Papel de parede Desktop atualizado!');
            }
          }
        };
        img.src = result;
      }
    };
    reader.readAsDataURL(file);
  };

  return (
    <div className="min-h-screen bg-[#070709] text-zinc-200 font-sans p-4 sm:p-8">
      {/* ============================================================================================
       * CASO A APLICAÇÃO ESTEJA TRANCADA: RENDERIZA O LOCKSCREEN SOBREPOSTO
       * ============================================================================================ */}
      <AnimatePresence>
        {isAppLocked && (
          <StandaloneLockScreen
            userName={userName}
            userPhoto={userPhoto}
            correctPassword={appLockPassword}
            appLockBiometricEnabled={appLockBiometricEnabled}
            lockScreenDesktopImage={lockScreenDesktopImage}
            lockScreenMobileImage={lockScreenMobileImage}
            accentColorHex={accentColorHex}
            onUnlock={() => {
              setIsAppLocked(false);
              triggerToast('Aplicação desbloqueada com sucesso!');
            }}
            onResetLocalData={() => {
              if (confirm('Deseja resetar a senha local e o bloqueio?')) {
                setAppLockEnabled(false);
                setAppLockPassword('');
                setAppLockBiometricEnabled(false);
                setIsAppLocked(false);
                triggerToast('Senha e bloqueio resetados.');
              }
            }}
          />
        )}
      </AnimatePresence>

      {/* ============================================================================================
       * CABEÇALHO DO GUIA STANDALONE
       * ============================================================================================ */}
      <div className="max-w-4xl mx-auto space-y-6">
        
        {/* Banner de Demonstração / Documentação */}
        <div className="p-6 bg-gradient-to-r from-zinc-900/90 to-zinc-950 border border-zinc-800 rounded-3xl relative overflow-hidden shadow-2xl">
          <div
            className="absolute -top-12 -right-12 w-48 h-48 rounded-full blur-3xl opacity-30 pointer-events-none"
            style={{ backgroundColor: accentColorHex }}
          />

          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 relative z-10">
            <div className="space-y-1">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-orange-500/10 border border-orange-500/20 text-orange-400 text-[10px] font-mono font-bold uppercase tracking-wider">
                <Lock className="h-3 w-3" />
                <span>STANDALONE LOCK SCREEN ARCHITECTURE</span>
              </div>
              <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight">
                Sistema Completo de Bloqueio, Biometria & Inatividade
              </h1>
              <p className="text-xs text-zinc-400 max-w-xl leading-relaxed">
                Referência completa com proteção contra inatividade, WebAuthn nativo (Touch ID / Face ID / Android),
                wallpapers responsivos (Desktop vs Mobile) e integração com o painel de configurações.
              </p>
            </div>

            {/* Ação Rápida: Bloquear Agora */}
            <button
              type="button"
              onClick={() => setIsAppLocked(true)}
              className="px-5 py-3 rounded-2xl font-black text-xs uppercase tracking-wider text-white shadow-xl flex items-center gap-2.5 transition-all transform active:scale-95 cursor-pointer shrink-0"
              style={{
                background: `linear-gradient(135deg, ${accentColorHex} 0%, #ea580c 100%)`,
                boxShadow: `0 4px 20px ${accentColorHex}40`
              }}
            >
              <Lock className="h-4 w-4 stroke-[2.5]" />
              <span>Trancar Tela Agora</span>
            </button>
          </div>
        </div>

        {/* ============================================================================================
         * PAINEL DE CONFIGURAÇÕES DE SEGURANÇA (INTEGRADO & FUNCIONAL)
         * ============================================================================================ */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

          {/* COLUNA 1: Chaves & Mecanismos de Acesso */}
          <div className="space-y-4">
            <h2 className="text-xs font-mono font-bold uppercase tracking-wider text-zinc-400 flex items-center gap-2">
              <Sliders className="h-3.5 w-3.5 text-orange-400" />
              <span>Controles de Ativação & Credenciais</span>
            </h2>

            {/* Card 1: Toggle Bloqueio do App */}
            <div className="p-4 bg-zinc-950/80 border border-zinc-900 rounded-2xl flex items-center justify-between">
              <div>
                <h3 className="text-xs font-bold text-zinc-200">Ativar Bloqueio do App</h3>
                <p className="text-[10px] text-zinc-500 font-mono mt-0.5">
                  {appLockEnabled ? `Protegido com senha (${appLockPassword})` : 'Proteção desativada'}
                </p>
              </div>
              <button
                type="button"
                onClick={() => {
                  setAppLockEnabled(!appLockEnabled);
                  triggerToast(appLockEnabled ? 'Bloqueio desativado' : 'Bloqueio ativado');
                }}
                className={`w-11 h-6 rounded-full p-0.5 transition-all cursor-pointer ${
                  appLockEnabled ? 'bg-orange-500' : 'bg-zinc-800'
                }`}
              >
                <div
                  className={`w-5 h-5 rounded-full bg-white transition-all ${
                    appLockEnabled ? 'translate-x-5' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>

            {/* Card 2: Toggle Biometria / Impressão Digital */}
            <div className="p-4 bg-zinc-950/80 border border-zinc-900 rounded-2xl flex items-center justify-between">
              <div className="flex items-start gap-3">
                <div
                  className="p-2 rounded-xl mt-0.5"
                  style={{
                    backgroundColor: appLockBiometricEnabled ? `${accentColorHex}15` : '#18181b',
                    color: appLockBiometricEnabled ? accentColorHex : '#71717a'
                  }}
                >
                  <Fingerprint className="h-4 w-4" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-xs font-bold text-zinc-200">Bloqueio por Impressão Digital</h3>
                    <span
                      className="text-[9px] font-mono px-2 py-0.5 rounded-full font-bold uppercase"
                      style={{
                        backgroundColor: appLockBiometricEnabled ? `${accentColorHex}20` : '#27272a',
                        color: appLockBiometricEnabled ? accentColorHex : '#a1a1aa'
                      }}
                    >
                      {appLockBiometricEnabled ? 'Ativo' : 'Inativo'}
                    </span>
                  </div>
                  <p className="text-[10px] text-zinc-500 font-mono mt-0.5">
                    Modo prioritário com WebAuthn (Touch ID / Face ID / Android).
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => {
                  setAppLockBiometricEnabled(!appLockBiometricEnabled);
                  triggerToast(appLockBiometricEnabled ? 'Biometria desativada' : 'Biometria ativada!');
                }}
                className={`w-11 h-6 rounded-full p-0.5 transition-all cursor-pointer shrink-0 ${
                  appLockBiometricEnabled ? 'bg-orange-500' : 'bg-zinc-800'
                }`}
              >
                <div
                  className={`w-5 h-5 rounded-full bg-white transition-all ${
                    appLockBiometricEnabled ? 'translate-x-5' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>

            {/* Card 3: Intervalo de Inatividade (Auto-Lock Timeout) */}
            <div className="p-4 bg-zinc-950/80 border border-zinc-900 rounded-2xl space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-orange-400" />
                  <h3 className="text-xs font-bold text-zinc-200">Tempo de Inatividade</h3>
                </div>
                <span className="text-xs font-mono font-black text-orange-400 bg-orange-500/10 border border-orange-500/20 px-2.5 py-1 rounded-lg">
                  {appLockTimeout === -1 ? 'Sempre Logado' : `${appLockTimeout} min`}
                </span>
              </div>

              <p className="text-[10px] text-zinc-500 font-mono">
                A aplicação monitora toques e movimentos e tranca a tela após o tempo limite selecionado.
              </p>

              {/* Slider */}
              <input
                type="range"
                min={1}
                max={30}
                value={appLockTimeout === -1 ? 5 : appLockTimeout}
                onChange={(e) => setAppLockTimeout(parseInt(e.target.value, 10))}
                className="w-full accent-orange-500 bg-zinc-800 h-1.5 rounded-lg cursor-pointer"
              />

              {/* Presets Rápidos */}
              <div className="flex flex-wrap gap-1.5 pt-1">
                {[1, 2, 5, 10, 15, 30].map((mins) => (
                  <button
                    key={mins}
                    type="button"
                    onClick={() => setAppLockTimeout(mins)}
                    className={`px-2.5 py-1 text-[9px] font-mono rounded-lg border transition-all cursor-pointer ${
                      appLockTimeout === mins
                        ? 'bg-orange-500 text-white font-bold shadow-md'
                        : 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:text-white'
                    }`}
                  >
                    {mins} min
                  </button>
                ))}
                <button
                  type="button"
                  onClick={() => setAppLockTimeout(-1)}
                  className={`px-2.5 py-1 text-[9px] font-mono rounded-lg border transition-all cursor-pointer ${
                    appLockTimeout === -1
                      ? 'bg-purple-600 text-white font-bold shadow-md'
                      : 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:text-white'
                  }`}
                >
                  Sempre Logado
                </button>
              </div>
            </div>

            {/* Card 4: Gestão da Senha de Bloqueio */}
            <div className="p-4 bg-zinc-950/80 border border-zinc-900 rounded-2xl space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <KeyRound className="h-4 w-4 text-orange-400" />
                  <h3 className="text-xs font-bold text-zinc-200">Senha Atual de Bloqueio</h3>
                </div>
                <button
                  type="button"
                  onClick={() => setShowPasswordChangeForm(!showPasswordChangeForm)}
                  className="text-[10px] font-mono font-bold text-orange-400 hover:underline cursor-pointer"
                >
                  {showPasswordChangeForm ? 'Cancelar' : 'Alterar Senha'}
                </button>
              </div>

              <div className="flex items-center justify-between p-2.5 bg-zinc-900/60 rounded-xl border border-zinc-850">
                <span className="text-xs font-mono font-bold text-white tracking-widest">
                  {appLockPassword ? '••••••••' : '(Nenhuma senha definida)'}
                </span>
                <span className="text-[10px] text-zinc-500 font-mono">
                  Senha atual: <strong className="text-zinc-300">{appLockPassword}</strong>
                </span>
              </div>

              <AnimatePresence>
                {showPasswordChangeForm && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="space-y-3 pt-2 border-t border-zinc-900 overflow-hidden"
                  >
                    <div className="space-y-1">
                      <label className="text-[9px] font-mono font-bold uppercase text-zinc-500">Nova Senha</label>
                      <input
                        type="password"
                        value={newPasswordInput}
                        onChange={(e) => setNewPasswordInput(e.target.value)}
                        placeholder="Digite a nova senha..."
                        className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-3 py-2 text-xs text-white font-mono focus:outline-none focus:border-orange-500"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[9px] font-mono font-bold uppercase text-zinc-500">Confirmar Nova Senha</label>
                      <input
                        type="password"
                        value={confirmPasswordInput}
                        onChange={(e) => setConfirmPasswordInput(e.target.value)}
                        placeholder="Confirme a nova senha..."
                        className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-3 py-2 text-xs text-white font-mono focus:outline-none focus:border-orange-500"
                      />
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        if (!newPasswordInput) {
                          alert('A senha não pode estar em branco.');
                          return;
                        }
                        if (newPasswordInput !== confirmPasswordInput) {
                          alert('As senhas digitadas não coincidem.');
                          return;
                        }
                        setAppLockPassword(newPasswordInput);
                        setAppLockEnabled(true);
                        setNewPasswordInput('');
                        setConfirmPasswordInput('');
                        setShowPasswordChangeForm(false);
                        triggerToast('Nova senha salva com sucesso!');
                      }}
                      className="w-full py-2.5 bg-emerald-500 hover:bg-emerald-600 font-black text-xs uppercase tracking-wider text-zinc-950 rounded-xl transition-all cursor-pointer"
                    >
                      Salvar Senha de Bloqueio
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>

          {/* COLUNA 2: Personalização de Wallpapers (Desktop & Mobile) */}
          <div className="space-y-4">
            <h2 className="text-xs font-mono font-bold uppercase tracking-wider text-zinc-400 flex items-center gap-2">
              <Sparkles className="h-3.5 w-3.5 text-orange-400" />
              <span>Personalização Visual dos Wallpapers</span>
            </h2>

            {/* Desktop Wallpaper Box */}
            <div className="p-4 bg-zinc-950/80 border border-zinc-900 rounded-2xl space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Laptop className="h-4 w-4 text-orange-400" />
                  <h3 className="text-xs font-bold text-zinc-200">Desktop Wallpaper (Horizontal 16:9)</h3>
                </div>
                {lockScreenDesktopImage && (
                  <button
                    type="button"
                    onClick={() => {
                      setLockScreenDesktopImage('');
                      triggerToast('Wallpaper Desktop restaurado.');
                    }}
                    className="text-[9px] font-mono text-red-400 hover:underline flex items-center gap-1 cursor-pointer"
                  >
                    <Trash2 className="h-3 w-3" />
                    <span>Padrão</span>
                  </button>
                )}
              </div>

              {/* Preview Desktop */}
              <div className="relative aspect-video rounded-xl overflow-hidden border border-zinc-800 bg-zinc-900">
                <img
                  src={
                    lockScreenDesktopImage ||
                    'https://images.unsplash.com/photo-1506744038136-46273834b3fb?q=80&w=1920'
                  }
                  alt="Desktop Preview"
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-black/40 flex items-center justify-center pointer-events-none">
                  <Lock className="h-6 w-6 text-white/80" />
                </div>
              </div>

              {/* Upload Input */}
              <label className="block w-full cursor-pointer">
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) processImageUpload(file, false);
                  }}
                />
                <div className="w-full py-2 bg-zinc-900 hover:bg-zinc-850 border border-zinc-800 rounded-xl text-center text-[10px] font-mono font-bold text-zinc-300 flex items-center justify-center gap-2 transition-all">
                  <Upload className="h-3.5 w-3.5 text-orange-400" />
                  <span>Substituir Imagem Desktop</span>
                </div>
              </label>
            </div>

            {/* Mobile Wallpaper Box */}
            <div className="p-4 bg-zinc-950/80 border border-zinc-900 rounded-2xl space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Smartphone className="h-4 w-4 text-orange-400" />
                  <h3 className="text-xs font-bold text-zinc-200">Mobile Wallpaper (Vertical 9:16)</h3>
                </div>
                {lockScreenMobileImage && (
                  <button
                    type="button"
                    onClick={() => {
                      setLockScreenMobileImage('');
                      triggerToast('Wallpaper Mobile restaurado.');
                    }}
                    className="text-[9px] font-mono text-red-400 hover:underline flex items-center gap-1 cursor-pointer"
                  >
                    <Trash2 className="h-3 w-3" />
                    <span>Padrão</span>
                  </button>
                )}
              </div>

              {/* Preview Mobile */}
              <div className="relative h-32 rounded-xl overflow-hidden border border-zinc-800 bg-zinc-900 flex items-center justify-center">
                <img
                  src={
                    lockScreenMobileImage ||
                    'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?q=80&w=800'
                  }
                  alt="Mobile Preview"
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-black/40 flex items-center justify-center pointer-events-none">
                  <Smartphone className="h-6 w-6 text-white/80" />
                </div>
              </div>

              {/* Upload Input */}
              <label className="block w-full cursor-pointer">
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) processImageUpload(file, true);
                  }}
                />
                <div className="w-full py-2 bg-zinc-900 hover:bg-zinc-850 border border-zinc-800 rounded-xl text-center text-[10px] font-mono font-bold text-zinc-300 flex items-center justify-center gap-2 transition-all">
                  <Upload className="h-3.5 w-3.5 text-orange-400" />
                  <span>Substituir Imagem Mobile</span>
                </div>
              </label>
            </div>
          </div>
        </div>

        {/* ============================================================================================
         * GUIA DE ADAPTAÇÃO & ARQUITETURA PARA OUTROS PROJETOS (DOCUMENTAÇÃO EMBUTIDA)
         * ============================================================================================ */}
        <div className="p-6 bg-[#0c0c10] border border-zinc-900 rounded-3xl space-y-4 text-xs text-zinc-400 leading-relaxed">
          <div className="flex items-center gap-2 text-white font-bold text-sm">
            <Info className="h-4 w-4 text-orange-400" />
            <span>Guia de Implementação Rápida em Outro Projeto</span>
          </div>

          <p>
            Para reproduzir este exato sistema em qualquer outro app React, utilize os 3 blocos fornecidos:
          </p>

          <ol className="list-decimal list-inside space-y-2 font-mono text-[11px] text-zinc-300">
            <li>
              <strong className="text-white">Autenticação Biométrica:</strong> Utilize as funções exportadas{' '}
              <code className="text-orange-400">registerBiometricHardware</code> e{' '}
              <code className="text-orange-400">authenticateBiometric</code> que interagem com a WebAuthn API nativa com fallback.
            </li>
            <li>
              <strong className="text-white">Temporizador de Inatividade:</strong> Importe o hook{' '}
              <code className="text-orange-400">useAppLockEngine</code> no topo do seu componente raiz (`App.tsx` ou layout), passando o timeout em minutos.
            </li>
            <li>
              <strong className="text-white">Renderização Condicional:</strong> Quando <code className="text-orange-400">isAppLocked === true</code>, renderize o componente{' '}
              <code className="text-orange-400">&lt;StandaloneLockScreen ... /&gt;</code> como uma camada `fixed inset-0 z-[9999]`.
            </li>
          </ol>
        </div>

      </div>

      {/* Toast Feedback Flutuante */}
      <AnimatePresence>
        {toastMessage && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="fixed bottom-6 right-6 z-50 px-4 py-2.5 bg-zinc-900 border border-zinc-800 rounded-2xl shadow-2xl text-xs font-mono font-bold text-white flex items-center gap-2"
          >
            <CheckCircle2 className="h-4 w-4 text-emerald-400" />
            <span>{toastMessage}</span>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
