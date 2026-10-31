import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { Cloud, CheckCircle2, RefreshCw, AlertCircle } from 'lucide-react';

interface AppLoadingScreenProps {
  userName?: string;
  userPhoto?: string;
  loadingScreenVerticalImage?: string;
  loadingScreenHorizontalImage?: string;
  syncStatus?: 'idle' | 'syncing' | 'synced' | 'error';
  isUnlockFlow?: boolean;
  onComplete: () => void;
  minDurationMs?: number;
}

export default function AppLoadingScreen({
  loadingScreenVerticalImage,
  loadingScreenHorizontalImage,
  syncStatus = 'synced',
  isUnlockFlow = false,
  onComplete,
  minDurationMs = 1400,
}: AppLoadingScreenProps) {
  const [progress, setProgress] = useState(0);
  const [isPortrait, setIsPortrait] = useState(() => {
    if (typeof window === 'undefined') return false;
    return window.innerHeight > window.innerWidth;
  });

  // Track orientation changes in real time
  useEffect(() => {
    const checkOrientation = () => {
      setIsPortrait(window.innerHeight > window.innerWidth);
    };

    window.addEventListener('resize', checkOrientation);
    window.addEventListener('orientationchange', checkOrientation);
    return () => {
      window.removeEventListener('resize', checkOrientation);
      window.removeEventListener('orientationchange', checkOrientation);
    };
  }, []);

  // Smooth progress animation & sync countdown
  useEffect(() => {
    const startTime = Date.now();
    const intervalTime = 50;
    const totalSteps = Math.max(10, Math.floor(minDurationMs / intervalTime));
    let currentStep = 0;

    const timer = setInterval(() => {
      currentStep++;
      const rawProgress = Math.min(100, Math.round((currentStep / totalSteps) * 100));
      setProgress(rawProgress);

      if (rawProgress >= 100) {
        clearInterval(timer);
        const elapsed = Date.now() - startTime;
        const remaining = Math.max(40, minDurationMs - elapsed);
        setTimeout(() => {
          onComplete();
        }, remaining);
      }
    }, intervalTime);

    return () => clearInterval(timer);
  }, [minDurationMs, onComplete]);

  // Determine active background image based on format/orientation
  const activeBgImage = isPortrait
    ? (loadingScreenVerticalImage || loadingScreenHorizontalImage || '/src/assets/images/classical_light_engraving_1784335041654.jpg')
    : (loadingScreenHorizontalImage || loadingScreenVerticalImage || '/src/assets/images/1271888.jpg');

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0, scale: 0.99, filter: 'blur(6px)' }}
      transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
      className="fixed inset-0 z-[10000] flex flex-col justify-end select-none overflow-hidden bg-[#040405] text-zinc-300 font-sans"
    >
      {/* Fullscreen Background Image */}
      {activeBgImage ? (
        <div
          className="absolute inset-0 bg-cover bg-center transition-all duration-700 ease-out"
          style={{
            backgroundImage: `url("${activeBgImage}")`,
            backgroundPosition: 'center center',
            backgroundSize: 'cover',
          }}
        />
      ) : (
        <div className="absolute inset-0 bg-gradient-to-br from-zinc-950 via-[#0c0c0e] to-black" />
      )}

      {/* Subtle bottom gradient to ensure 100% legibility for the sync bar */}
      <div className="absolute inset-x-0 bottom-0 h-48 bg-gradient-to-t from-black/90 via-black/50 to-transparent pointer-events-none" />

      {/* Bottom Synchronization Bar (Edge-to-edge horizontally on desktop) */}
      <div className="relative z-10 w-full mx-auto pb-6 sm:pb-8 md:pb-6 space-y-2.5">
        {/* Status Line */}
        <div className="w-full flex items-center justify-between text-[11px] md:text-xs font-mono tracking-tight text-zinc-300 px-4 sm:px-6 md:px-8 lg:px-10 drop-shadow-md">
          <span className="flex items-center gap-2">
            {progress >= 100 ? (
              <>
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                <span className="text-zinc-200 font-semibold">Sincronizado</span>
              </>
            ) : syncStatus === 'error' ? (
              <>
                <AlertCircle className="w-4 h-4 text-amber-400" />
                <span className="text-zinc-200">Sincronizando offline...</span>
              </>
            ) : (
              <>
                <Cloud className="w-4 h-4 animate-pulse" style={{ color: 'var(--color-orange-400, #fb923c)' }} />
                <span className="text-zinc-200">
                  {isUnlockFlow ? 'Validando e sincronizando dados...' : 'Sincronizando dados...'}
                </span>
              </>
            )}
          </span>

          <span 
            className="font-bold font-mono bg-black/60 px-2.5 py-1 rounded-md border border-white/10 backdrop-blur-sm shadow-sm"
            style={{ color: 'var(--color-orange-400, #fb923c)' }}
          >
            {progress}%
          </span>
        </div>

        {/* Progress Track (Ponta a ponta de ponta horizontal completa no Desktop) */}
        <div className="h-1.5 md:h-2 w-full bg-black/80 backdrop-blur-md overflow-hidden border-y border-white/10 md:border-x-0 shadow-lg shadow-black/60 px-0">
          <motion.div
            className="h-full relative"
            style={{ 
              width: `${progress}%`,
              background: 'linear-gradient(90deg, var(--color-orange-600, #ea580c) 0%, var(--color-orange-400, #fb923c) 50%, var(--color-orange-500, #f97316) 100%)',
              boxShadow: '0 0 16px var(--accent-glow, rgba(249, 115, 22, 0.6))'
            }}
            transition={{ ease: 'easeOut', duration: 0.08 }}
          >
            {/* Shimmer light effect */}
            <div className="absolute inset-0 bg-white/25 animate-pulse" />
          </motion.div>
        </div>
      </div>
    </motion.div>
  );
}
