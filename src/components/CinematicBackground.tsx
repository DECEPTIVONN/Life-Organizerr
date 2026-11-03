import React, { useMemo } from 'react';
import { motion } from 'motion/react';

export type BackgroundAtmosphereMode = 'cinematic' | 'studio' | 'minimalista' | 'amoled';
export type BackgroundAtmosphereIntensity = 'subtle' | 'vibrant' | 'discrete';

interface CinematicBackgroundProps {
  activeTab: string;
  mode?: BackgroundAtmosphereMode;
  intensity?: BackgroundAtmosphereIntensity;
  gridEnabled?: boolean;
  animated?: boolean;
  themeMode?: 'dark' | 'light';
}

// Sophisticated quiet-luxury palettes: velvety, restrained, and deeply elegant
const TAB_PALETTES: Record<string, { 
  core: string; 
  halo: string; 
  accent: string;
  orb1: string;
  orb2: string;
  lightCore: string;
  lightHalo: string;
}> = {
  dashboard: {
    core: 'rgba(234, 88, 12, 0.12)', // Warm Bronze Noir
    halo: 'rgba(217, 119, 6, 0.07)',
    accent: 'rgba(251, 146, 60, 0.04)',
    orb1: 'rgba(249, 115, 22, 0.08)',
    orb2: 'rgba(217, 119, 6, 0.05)',
    lightCore: 'rgba(234, 88, 12, 0.05)',
    lightHalo: 'rgba(249, 115, 22, 0.025)',
  },
  checklist: {
    core: 'rgba(249, 115, 22, 0.12)', // Focus Amber
    halo: 'rgba(245, 158, 11, 0.07)',
    accent: 'rgba(253, 186, 116, 0.04)',
    orb1: 'rgba(234, 88, 12, 0.08)',
    orb2: 'rgba(245, 158, 11, 0.05)',
    lightCore: 'rgba(249, 115, 22, 0.05)',
    lightHalo: 'rgba(245, 158, 11, 0.025)',
  },
  rotina: {
    core: 'rgba(234, 88, 12, 0.13)', // Warm Bronze
    halo: 'rgba(180, 83, 9, 0.07)',
    accent: 'rgba(249, 115, 22, 0.04)',
    orb1: 'rgba(234, 88, 12, 0.08)',
    orb2: 'rgba(180, 83, 9, 0.05)',
    lightCore: 'rgba(234, 88, 12, 0.05)',
    lightHalo: 'rgba(180, 83, 9, 0.025)',
  },
  habitos: {
    core: 'rgba(249, 115, 22, 0.13)', // Molten Copper
    halo: 'rgba(217, 119, 6, 0.07)',
    accent: 'rgba(234, 88, 12, 0.04)',
    orb1: 'rgba(249, 115, 22, 0.08)',
    orb2: 'rgba(234, 88, 12, 0.05)',
    lightCore: 'rgba(249, 115, 22, 0.05)',
    lightHalo: 'rgba(217, 119, 6, 0.025)',
  },
  metas: {
    core: 'rgba(99, 102, 241, 0.12)', // Sapphire Noir & Horizon Indigo
    halo: 'rgba(139, 92, 246, 0.07)',
    accent: 'rgba(217, 119, 6, 0.04)',
    orb1: 'rgba(99, 102, 241, 0.08)',
    orb2: 'rgba(139, 92, 246, 0.05)',
    lightCore: 'rgba(99, 102, 241, 0.045)',
    lightHalo: 'rgba(139, 92, 246, 0.02)',
  },
  financas: {
    core: 'rgba(16, 185, 129, 0.12)', // Emerald Noir / Platinum
    halo: 'rgba(13, 148, 136, 0.07)',
    accent: 'rgba(52, 211, 153, 0.04)',
    orb1: 'rgba(16, 185, 129, 0.08)',
    orb2: 'rgba(13, 148, 136, 0.05)',
    lightCore: 'rgba(16, 185, 129, 0.045)',
    lightHalo: 'rgba(13, 148, 136, 0.02)',
  },
  calendario: {
    core: 'rgba(168, 85, 247, 0.11)', // Royal Amethyst
    halo: 'rgba(99, 102, 241, 0.06)',
    accent: 'rgba(217, 119, 6, 0.04)',
    orb1: 'rgba(168, 85, 247, 0.08)',
    orb2: 'rgba(99, 102, 241, 0.05)',
    lightCore: 'rgba(168, 85, 247, 0.045)',
    lightHalo: 'rgba(99, 102, 241, 0.02)',
  },
  anuais: {
    core: 'rgba(217, 119, 6, 0.13)', // Archival Titanium Gold
    halo: 'rgba(161, 161, 170, 0.06)',
    accent: 'rgba(245, 158, 11, 0.04)',
    orb1: 'rgba(217, 119, 6, 0.08)',
    orb2: 'rgba(161, 161, 170, 0.05)',
    lightCore: 'rgba(217, 119, 6, 0.05)',
    lightHalo: 'rgba(161, 161, 170, 0.02)',
  },
  projetos: {
    core: 'rgba(37, 99, 235, 0.12)', // Architectural Cobalt
    halo: 'rgba(59, 130, 246, 0.07)',
    accent: 'rgba(96, 165, 250, 0.04)',
    orb1: 'rgba(37, 99, 235, 0.08)',
    orb2: 'rgba(59, 130, 246, 0.05)',
    lightCore: 'rgba(37, 99, 235, 0.045)',
    lightHalo: 'rgba(59, 130, 246, 0.02)',
  },
  notas: {
    core: 'rgba(245, 158, 11, 0.12)', // Parchment Noir
    halo: 'rgba(217, 119, 6, 0.06)',
    accent: 'rgba(251, 191, 36, 0.04)',
    orb1: 'rgba(245, 158, 11, 0.08)',
    orb2: 'rgba(217, 119, 6, 0.05)',
    lightCore: 'rgba(245, 158, 11, 0.045)',
    lightHalo: 'rgba(217, 119, 6, 0.02)',
  },
  documentos: {
    core: 'rgba(161, 161, 170, 0.10)', // Platinum / Monolith
    halo: 'rgba(113, 113, 122, 0.06)',
    accent: 'rgba(212, 212, 216, 0.035)',
    orb1: 'rgba(161, 161, 170, 0.07)',
    orb2: 'rgba(113, 113, 122, 0.045)',
    lightCore: 'rgba(161, 161, 170, 0.04)',
    lightHalo: 'rgba(113, 113, 122, 0.02)',
  },
  agentes: {
    core: 'rgba(14, 165, 233, 0.12)', // Intelligence Cyan
    halo: 'rgba(20, 184, 166, 0.07)',
    accent: 'rgba(56, 189, 248, 0.04)',
    orb1: 'rgba(14, 165, 233, 0.08)',
    orb2: 'rgba(20, 184, 166, 0.05)',
    lightCore: 'rgba(14, 165, 233, 0.045)',
    lightHalo: 'rgba(20, 184, 166, 0.02)',
  },
  configuracoes: {
    core: 'rgba(113, 113, 122, 0.10)', // Titanium Minimalist
    halo: 'rgba(82, 82, 91, 0.05)',
    accent: 'rgba(161, 161, 170, 0.035)',
    orb1: 'rgba(113, 113, 122, 0.07)',
    orb2: 'rgba(82, 82, 91, 0.045)',
    lightCore: 'rgba(113, 113, 122, 0.04)',
    lightHalo: 'rgba(82, 82, 91, 0.02)',
  },
};

const INTENSITY_MULTIPLIER: Record<BackgroundAtmosphereIntensity, number> = {
  subtle: 1.0,
  vibrant: 1.35,
  discrete: 0.65,
};

export const CinematicBackground: React.FC<CinematicBackgroundProps> = ({
  activeTab,
  mode = 'cinematic',
  intensity = 'subtle',
  gridEnabled = true,
  animated = true,
  themeMode = 'dark',
}) => {
  const isLight = themeMode === 'light';

  // AMOLED mode: pure zero-light black for maximum battery saving (only in dark mode)
  if (!isLight && mode === 'amoled') {
    return (
      <div 
        aria-hidden="true" 
        className="fixed inset-0 pointer-events-none z-0 bg-black transition-colors duration-700" 
      />
    );
  }

  const multiplier = INTENSITY_MULTIPLIER[intensity] ?? 1.0;
  const isMinimal = mode === 'minimalista';
  const showGrid = (mode === 'cinematic') && gridEnabled;

  // Active palette with fallback
  const palette = useMemo(() => {
    return TAB_PALETTES[activeTab] || TAB_PALETTES.dashboard;
  }, [activeTab]);

  const activeCore = isLight ? palette.lightCore : palette.core;
  const activeHalo = isLight ? palette.lightHalo : palette.halo;

  return (
    <div
      aria-hidden="true"
      className="fixed inset-0 pointer-events-none z-0 overflow-hidden select-none transition-colors duration-1000"
      style={{
        backgroundColor: isLight ? '#f8f8f6' : '#040405',
      }}
    >
      {/* 1. CAMPO DE FUNDO FLUIDO E ORGÂNICO (Liquid Atmospheric Field / Zenith Wash) */}
      {!isMinimal && (
        <motion.div
          key={`ambient-bloom-${activeTab}-${themeMode}`}
          initial={{ opacity: 0.5 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1] }}
          className="absolute inset-0 overflow-hidden pointer-events-none"
        >
          {/* ONDA A: AURORA ZÊNITE LÍQUIDA (Amorphous Morphing Light Field) */}
          <div
            className={`absolute -top-32 left-1/2 w-[140vw] max-w-[1500px] h-[520px] blur-[140px] pointer-events-none ${
              animated ? 'animate-fluid-aurora' : '-translate-x-1/2'
            }`}
            style={{
              background: `radial-gradient(ellipse 65% 50% at 50% 35%, ${activeCore} 0%, ${activeHalo} 55%, transparent 80%)`,
              opacity: isLight ? multiplier * 0.9 : multiplier,
              transition: 'background 1.1s cubic-bezier(0.16, 1, 0.3, 1)',
            }}
          />

          {/* ONDA B: DERIVA DE LUZ SECUNDÁRIA (Fluid Ambient Diffuser) */}
          <div
            className={`absolute top-0 right-[15%] w-[650px] h-[450px] blur-[150px] pointer-events-none ${
              animated ? 'animate-fluid-drift' : ''
            }`}
            style={{
              background: isLight 
                ? `radial-gradient(circle, rgba(251, 146, 60, 0.035) 0%, rgba(245, 158, 11, 0.015) 50%, transparent 75%)`
                : `radial-gradient(circle, ${palette.orb1} 0%, ${palette.accent} 50%, transparent 75%)`,
              opacity: multiplier * 0.85,
              transition: 'background 1.1s cubic-bezier(0.16, 1, 0.3, 1)',
            }}
          />

          {/* ONDA C: ECO PROFUNDO INFERIOR (Velvety Lower Fill) */}
          <div
            className="absolute -bottom-36 left-[8%] w-[600px] h-[450px] blur-[160px] pointer-events-none opacity-70"
            style={{
              background: isLight 
                ? `radial-gradient(circle, rgba(217, 119, 6, 0.02) 0%, transparent 70%)`
                : `radial-gradient(circle, ${palette.orb2} 0%, transparent 70%)`,
              opacity: multiplier * 0.7,
              transition: 'background 1.1s cubic-bezier(0.16, 1, 0.3, 1)',
            }}
          />
        </motion.div>
      )}

      {/* 2. VINHETA PERIMÉTRICA DE ESTÚDIO (Studio Perimeter Falloff) */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: isLight
            ? 'radial-gradient(ellipse 95% 85% at 50% 20%, transparent 50%, rgba(235, 233, 227, 0.35) 80%, #f4f3ef 100%)'
            : 'radial-gradient(ellipse 95% 85% at 50% 20%, transparent 40%, rgba(4, 4, 6, 0.70) 78%, #040405 100%)',
        }}
      />

      {/* 3. 📐 MICRO-TRAMA ARQUITETURAL MASCARADA (Architectural Precision Grid - Reference Image 1) */}
      {showGrid && (
        <div
          className="absolute inset-0 transition-opacity duration-700 pointer-events-none"
          style={{
            backgroundImage: isLight
              ? `radial-gradient(circle, rgba(0, 0, 0, 0.065) 1px, transparent 1px)`
              : `radial-gradient(circle, rgba(255, 255, 255, 0.07) 1px, transparent 1px)`,
            backgroundSize: '32px 32px',
            backgroundPosition: 'center top',
            opacity: multiplier > 1 ? 0.95 : multiplier < 1 ? 0.45 : 0.75,
            WebkitMaskImage: 'radial-gradient(ellipse 70% 60% at 50% 32%, black 20%, transparent 80%)',
            maskImage: 'radial-gradient(ellipse 70% 60% at 50% 32%, black 20%, transparent 80%)',
          }}
        />
      )}

      {/* 4. 🎞️ MICRO-GRANULAÇÃO ANALÓGICA ULTRA-SUTIL (Organic Film Grain) */}
      {!isMinimal && (
        <div
          className={`absolute inset-0 pointer-events-none ${
            isLight ? 'opacity-[0.012] mix-blend-multiply' : 'opacity-[0.016] mix-blend-overlay'
          }`}
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")`,
            backgroundRepeat: 'repeat',
          }}
        />
      )}

      {/* 5. LINHA DE HORIZONTE SUPERIOR COM VARREDURA ESPECULAR SUAVE (Horizon Shimmer) */}
      <div className="absolute top-0 left-0 right-0 h-[1px] overflow-hidden pointer-events-none">
        <div
          className="w-full h-full opacity-35 transition-all duration-1000"
          style={{
            background: isLight
              ? `linear-gradient(90deg, transparent 0%, rgba(217, 119, 6, 0.20) 50%, transparent 100%)`
              : `linear-gradient(90deg, transparent 0%, ${palette.core.replace(/0\.\d+\)/, '0.40)')} 50%, transparent 100%)`,
          }}
        />
        {animated && !isMinimal && (
          <div
            className="absolute top-0 left-0 w-1/3 h-full animate-horizon-shimmer pointer-events-none"
            style={{
              background: isLight
                ? 'linear-gradient(90deg, transparent 0%, rgba(249, 115, 22, 0.25) 50%, transparent 100%)'
                : 'linear-gradient(90deg, transparent 0%, rgba(255, 255, 255, 0.35) 50%, transparent 100%)',
            }}
          />
        )}
      </div>
    </div>
  );
};
