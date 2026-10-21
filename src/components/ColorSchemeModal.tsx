import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Check, Palette, ArrowLeft } from 'lucide-react';
import {
  THEME_PRESETS,
  hexToRgb,
  rgbToHex,
  rgbToHsv,
  hsvToRgb,
  applyThemeColor,
  applyDarkBackgroundStyle,
} from '../utils/themeColors';

interface ColorSchemeModalProps {
  isOpen: boolean;
  onClose: () => void;
  activePresetId: string;
  customHex: string;
  onSelectPreset: (presetId: string, hex?: string) => void;
}

export default function ColorSchemeModal({
  isOpen,
  onClose,
  activePresetId,
  customHex,
  onSelectPreset,
}: ColorSchemeModalProps) {
  // Modal internal view state: 'presets' | 'custom_2d' | 'custom_wheel'
  const [viewMode, setViewMode] = useState<'presets' | 'custom_2d' | 'custom_wheel'>('presets');

  // Working color state for custom pickers
  const [tempRgb, setTempRgb] = useState<{ r: number; g: number; b: number }>(() => hexToRgb(customHex || '#3396f3'));
  const [tempHue, setTempHue] = useState<number>(207); // default blue hue
  const [tempSat, setTempSat] = useState<number>(85);
  const [tempVal, setTempVal] = useState<number>(95);
  const [brightness, setBrightness] = useState<number>(100); // 0 to 200%
  const [colorFormat, setColorFormat] = useState<'RGB' | 'HEX' | 'HSL'>('RGB');
  const [darkBackgroundStyle, setDarkBackgroundStyle] = useState<'padrao' | 'amoled'>(() => {
    return (typeof window !== 'undefined' ? (localStorage.getItem('mbc_dark_background_style') as 'padrao' | 'amoled') : 'padrao') || 'padrao';
  });

  // Canvas 2D drag ref & Wheel ref
  const pickerCanvasRef = useRef<HTMLDivElement>(null);
  const wheelContainerRef = useRef<HTMLDivElement>(null);

  const isDragging2D = useRef(false);
  const isDraggingHue = useRef(false);
  const isDraggingWheel = useRef(false);

  // Sync temp color when modal opens or customHex changes
  useEffect(() => {
    if (isOpen) {
      const rgb = hexToRgb(customHex || '#3396f3');
      setTempRgb(rgb);
      const hsv = rgbToHsv(rgb.r, rgb.g, rgb.b);
      setTempHue(hsv.h);
      setTempSat(hsv.s);
      setTempVal(hsv.v);
      setBrightness(100);
    }
  }, [isOpen, customHex]);

  // Global mouseup/touchend cleanup for smooth dragging
  useEffect(() => {
    const handleGlobalPointerUp = () => {
      isDragging2D.current = false;
      isDraggingHue.current = false;
      isDraggingWheel.current = false;
    };

    window.addEventListener('mouseup', handleGlobalPointerUp);
    window.addEventListener('touchend', handleGlobalPointerUp);
    return () => {
      window.removeEventListener('mouseup', handleGlobalPointerUp);
      window.removeEventListener('touchend', handleGlobalPointerUp);
    };
  }, []);

  if (!isOpen) return null;

  // Derive current temp hex and rgb with brightness applied
  const getAdjustedRgb = () => {
    if (brightness === 100) return tempRgb;
    const factor = brightness / 100;
    return {
      r: Math.min(255, Math.max(0, Math.round(tempRgb.r * factor))),
      g: Math.min(255, Math.max(0, Math.round(tempRgb.g * factor))),
      b: Math.min(255, Math.max(0, Math.round(tempRgb.b * factor))),
    };
  };

  const adjustedRgb = getAdjustedRgb();
  const currentTempHex = rgbToHex(adjustedRgb.r, adjustedRgb.g, adjustedRgb.b);

  // Handle 2D picker click/drag
  const handle2DPickerMove = (e: React.MouseEvent | React.TouchEvent | MouseEvent | TouchEvent) => {
    if (!pickerCanvasRef.current) return;
    const rect = pickerCanvasRef.current.getBoundingClientRect();
    const clientX = 'touches' in e ? e.touches[0].clientX : (e as MouseEvent).clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : (e as MouseEvent).clientY;

    const x = Math.max(0, Math.min(rect.width, clientX - rect.left));
    const y = Math.max(0, Math.min(rect.height, clientY - rect.top));

    const s = Math.round((x / rect.width) * 100);
    const v = Math.round((1 - y / rect.height) * 100);

    setTempSat(s);
    setTempVal(v);
    const newRgb = hsvToRgb(tempHue, s, v);
    setTempRgb(newRgb);
  };

  const handleHueSliderMove = (e: React.MouseEvent | React.TouchEvent | MouseEvent | TouchEvent) => {
    const target = e.currentTarget as HTMLElement;
    if (!target) return;
    const rect = target.getBoundingClientRect();
    const clientX = 'touches' in e ? e.touches[0].clientX : (e as MouseEvent).clientX;
    const x = Math.max(0, Math.min(rect.width, clientX - rect.left));
    const newHue = Math.round((x / rect.width) * 360);
    setTempHue(newHue);
    const newRgb = hsvToRgb(newHue, tempSat, tempVal);
    setTempRgb(newRgb);
  };

  // Handle Wheel Continuous Mouse/Touch Dragging
  const handleWheelMove = (e: React.MouseEvent | React.TouchEvent | MouseEvent | TouchEvent) => {
    if (!wheelContainerRef.current) return;
    const rect = wheelContainerRef.current.getBoundingClientRect();
    const clientX = 'touches' in e ? e.touches[0].clientX : (e as MouseEvent).clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : (e as MouseEvent).clientY;

    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;

    const dx = clientX - centerX;
    const dy = clientY - centerY;

    let angleDeg = (Math.atan2(dy, dx) * 180) / Math.PI + 90;
    if (angleDeg < 0) angleDeg += 360;

    const dist = Math.sqrt(dx * dx + dy * dy);
    const maxRadius = rect.width / 2;
    const sat = Math.min(100, Math.max(10, Math.round((dist / maxRadius) * 100)));
    const val = tempVal > 0 ? tempVal : 95;

    const h = Math.round(angleDeg);
    setTempHue(h);
    setTempSat(sat);
    setTempVal(val);
    const newRgb = hsvToRgb(h, sat, val);
    setTempRgb(newRgb);
  };

  // Generate Spiral Wheel Dots
  const generateSpiralDots = () => {
    const dots = [];
    const rings = 9;
    for (let r = 1; r <= rings; r++) {
      const count = r * 8;
      const baseRadiusMobile = r * 11.5;
      const baseRadiusDesktop = r * 16;
      const sat = Math.min(100, 15 + r * 9.5);
      const val = Math.max(40, 100 - (r > 6 ? (r - 6) * 12 : 0));
      for (let i = 0; i < count; i++) {
        const angle = (i / count) * 2 * Math.PI - Math.PI / 2;
        const hue = (i / count) * 360;
        const xMobile = Math.cos(angle) * baseRadiusMobile;
        const yMobile = Math.sin(angle) * baseRadiusMobile;
        const xDesktop = Math.cos(angle) * baseRadiusDesktop;
        const yDesktop = Math.sin(angle) * baseRadiusDesktop;

        const rgb = hsvToRgb(hue, sat, val);
        const hex = rgbToHex(rgb.r, rgb.g, rgb.b);
        dots.push({ xMobile, yMobile, xDesktop, yDesktop, hue, sat, val, hex, rgb });
      }
    }
    return dots;
  };

  const spiralDots = generateSpiralDots();

  const handleApplyCustomColor = () => {
    onSelectPreset('custom', currentTempHex);
    applyThemeColor(currentTempHex);
    onClose();
  };

  return (
    <AnimatePresence>
      <div 
        onClick={onClose}
        className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 md:p-6 lg:p-10 bg-black/80 backdrop-blur-md cursor-pointer overflow-y-auto"
      >
        <motion.div
          onClick={(e) => e.stopPropagation()}
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 15 }}
          transition={{ duration: 0.25, ease: 'easeOut' }}
          className="w-full max-w-md md:max-w-4xl lg:max-w-5xl xl:max-w-6xl bg-[#121216] border border-zinc-800 rounded-3xl overflow-hidden shadow-2xl text-white font-sans relative transition-all duration-300 flex flex-col cursor-default shrink-0 my-auto"
        >
          {/* HEADER (No "Voltar" or "Escolha a cor" text) */}
          <div className="px-6 pt-5 pb-4 flex items-center justify-between border-b border-zinc-800/80">
            <div className="flex items-center gap-3">
              {viewMode !== 'presets' && (
                <button
                  type="button"
                  onClick={() => setViewMode('presets')}
                  className="p-1.5 rounded-xl bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-white hover:bg-zinc-800 transition-all"
                >
                  <ArrowLeft className="w-4 h-4" />
                </button>
              )}
              <h2 className="text-base md:text-lg font-mono font-bold tracking-tight text-zinc-100">
                {viewMode === 'presets' ? 'Esquema de cores' : 'Cor personalizada'}
              </h2>
            </div>
            <button
              onClick={onClose}
              className="p-2 rounded-full bg-zinc-900 hover:bg-zinc-800 text-zinc-400 hover:text-white transition-all"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* MODE 1: PRESETS GRID */}
          {viewMode === 'presets' && (
            <div className="p-5 md:p-8 space-y-6 max-h-[80vh] md:max-h-[75vh] overflow-y-auto no-scrollbar">
              {/* TOP CUSTOM COLOR CARD */}
              <button
                type="button"
                onClick={() => setViewMode('custom_2d')}
                className={`w-full p-4 md:p-5 rounded-2xl border transition-all text-left flex items-center gap-5 group ${
                  activePresetId === 'custom'
                    ? 'bg-zinc-900 border-purple-500/60 shadow-[0_0_20px_rgba(168,85,247,0.2)]'
                    : 'bg-zinc-900/60 border-zinc-800 hover:border-zinc-700 hover:bg-zinc-900'
                }`}
              >
                <div className="w-12 h-12 md:w-14 md:h-14 rounded-2xl bg-gradient-to-tr from-amber-500 via-emerald-500 to-indigo-500 flex items-center justify-center shrink-0 shadow-lg relative group-hover:scale-105 transition-transform">
                  <Palette className="w-6 h-6 md:w-7 md:h-7 text-white drop-shadow-md" />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="text-sm md:text-base font-bold text-zinc-100 font-mono flex items-center gap-2">
                    Cor personalizada
                    {activePresetId === 'custom' && (
                      <span className="text-[9px] px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-300 border border-purple-500/30 uppercase font-mono">
                        Ativa
                      </span>
                    )}
                  </h3>
                  <p className="text-xs md:text-sm text-zinc-400 font-mono mt-0.5">
                    Crie seu próprio esquema de cores
                  </p>
                </div>
              </button>

              {/* SEÇÃO: ESTILO PRETO (PADRÃO ATUAL VS AMOLED) */}
              <div className="p-4 md:p-5 bg-zinc-950/80 rounded-2xl border border-zinc-800/80 space-y-3">
                <div>
                  <h4 className="text-xs md:text-sm font-bold text-zinc-100 font-mono flex items-center gap-2">
                    Estilo de Fundo Preto
                  </h4>
                  <p className="text-[11px] md:text-xs text-zinc-400 font-mono mt-0.5">
                    Selecione entre o fundo escuro padrão e o preto puro AMOLED (0% de luz para economia de bateria).
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                  {/* PRETO PADRÃO */}
                  <button
                    type="button"
                    onClick={() => {
                      setDarkBackgroundStyle('padrao');
                      applyDarkBackgroundStyle('padrao');
                    }}
                    className={`p-3.5 rounded-xl border transition-all text-left flex items-center gap-3 cursor-pointer ${
                      darkBackgroundStyle === 'padrao'
                        ? 'bg-zinc-900 border-orange-500/80 shadow-[0_0_14px_rgba(249,115,22,0.25)]'
                        : 'bg-zinc-900/40 border-zinc-800 hover:border-zinc-700'
                    }`}
                  >
                    <div className="w-8 h-8 rounded-lg bg-[#040405] border border-zinc-700 shrink-0 flex items-center justify-center">
                      {darkBackgroundStyle === 'padrao' && (
                        <Check className="w-4 h-4 text-orange-400 stroke-[3]" />
                      )}
                    </div>
                    <div>
                      <span className="text-xs font-bold font-mono text-zinc-200 block">
                        Preto Padrão
                      </span>
                      <span className="text-[10px] text-zinc-500 font-mono">
                        Atual (Tons de Obsidiana)
                      </span>
                    </div>
                  </button>

                  {/* PRETO AMOLED */}
                  <button
                    type="button"
                    onClick={() => {
                      setDarkBackgroundStyle('amoled');
                      applyDarkBackgroundStyle('amoled');
                    }}
                    className={`p-3.5 rounded-xl border transition-all text-left flex items-center gap-3 cursor-pointer ${
                      darkBackgroundStyle === 'amoled'
                        ? 'bg-zinc-900 border-orange-500/80 shadow-[0_0_14px_rgba(249,115,22,0.25)]'
                        : 'bg-zinc-900/40 border-zinc-800 hover:border-zinc-700'
                    }`}
                  >
                    <div className="w-8 h-8 rounded-lg bg-black border border-zinc-600 shrink-0 flex items-center justify-center shadow-inner">
                      {darkBackgroundStyle === 'amoled' && (
                        <Check className="w-4 h-4 text-orange-400 stroke-[3]" />
                      )}
                    </div>
                    <div>
                      <span className="text-xs font-bold font-mono text-zinc-200 block">
                        Preto AMOLED
                      </span>
                      <span className="text-[10px] text-zinc-500 font-mono">
                        Preto Puro #000000 (OLED)
                      </span>
                    </div>
                  </button>
                </div>
              </div>

              {/* GRID OF PRESET THEMES */}
              <div className="space-y-2">
                <span className="text-xs font-mono font-bold text-zinc-400 uppercase tracking-wider block">
                  Cores de Destaque
                </span>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 md:gap-4 pt-1">
                {THEME_PRESETS.map((preset) => {
                  const isSelected = activePresetId === preset.id;
                  return (
                    <button
                      key={preset.id}
                      type="button"
                      onClick={() => {
                        onSelectPreset(preset.id);
                        applyThemeColor(preset.primaryHex);
                        if (preset.id === 'preto-amoled') {
                          setDarkBackgroundStyle('amoled');
                          applyDarkBackgroundStyle('amoled');
                        } else if (preset.id === 'preto-padrao') {
                          setDarkBackgroundStyle('padrao');
                          applyDarkBackgroundStyle('padrao');
                        }
                      }}
                      className={`p-3.5 md:p-4 rounded-2xl border transition-all flex items-center gap-3 text-left relative overflow-hidden group ${
                        isSelected
                          ? 'bg-zinc-900 border-purple-500/80 shadow-[0_0_16px_rgba(168,85,247,0.25)]'
                          : 'bg-zinc-900/50 border-zinc-800/80 hover:border-zinc-700 hover:bg-zinc-900'
                      }`}
                    >
                      {/* COLOR PREVIEW BADGE */}
                      <div
                        className={`w-10 h-10 md:w-11 md:h-11 rounded-2xl shrink-0 flex items-center justify-center relative shadow-md ${
                          preset.previewGradient ? `bg-gradient-to-tr ${preset.previewGradient}` : ''
                        }`}
                        style={{
                          backgroundColor: preset.previewGradient ? undefined : preset.primaryHex,
                          boxShadow: `0 0 12px ${preset.glowColor}`,
                        }}
                      >
                        {isSelected && (
                          <Check className="w-5 h-5 text-white stroke-[3] drop-shadow" />
                        )}
                      </div>

                      {/* PRESET NAME */}
                      <span className="text-xs md:text-sm font-bold font-mono text-zinc-200 tracking-wide group-hover:text-white">
                        {preset.name}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        )}

          {/* MODE 2: CUSTOM COLOR PICKER 2D CANVAS */}
          {viewMode === 'custom_2d' && (
            <div className="p-5 md:p-8 space-y-6 max-h-[85vh] md:max-h-[75vh] overflow-y-auto no-scrollbar">
              {/* TAB TOGGLE BETWEEN 2D CANVAS & SPIRAL WHEEL */}
              <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
                <span className="text-xs font-mono font-bold text-zinc-400 uppercase">
                  Modo de Seleção
                </span>
                <div className="flex items-center gap-1 bg-zinc-950 p-1 rounded-xl border border-zinc-800">
                  <button
                    onClick={() => setViewMode('custom_2d')}
                    className="px-3.5 py-1.5 rounded-lg text-[10px] md:text-xs font-mono font-bold uppercase transition-all bg-orange-500 text-white shadow-sm"
                  >
                    Gradiente 2D
                  </button>
                  <button
                    onClick={() => setViewMode('custom_wheel')}
                    className="px-3.5 py-1.5 rounded-lg text-[10px] md:text-xs font-mono font-bold uppercase transition-all text-zinc-400 hover:text-white"
                  >
                    Roda / Matriz
                  </button>
                </div>
              </div>

              {/* DESKTOP 2-COLUMN LAYOUT */}
              <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-start">
                {/* 2D SATURATION / LIGHTNESS BOX */}
                <div className="md:col-span-7 lg:col-span-8">
                  <div
                    ref={pickerCanvasRef}
                    onMouseDown={(e) => {
                      isDragging2D.current = true;
                      handle2DPickerMove(e);
                    }}
                    onMouseMove={(e) => {
                      if (isDragging2D.current) handle2DPickerMove(e);
                    }}
                    onTouchStart={(e) => {
                      isDragging2D.current = true;
                      handle2DPickerMove(e);
                    }}
                    onTouchMove={(e) => {
                      if (isDragging2D.current) handle2DPickerMove(e);
                    }}
                    className="w-full h-56 md:h-80 rounded-2xl relative cursor-crosshair overflow-hidden shadow-inner touch-none border border-zinc-800"
                    style={{
                      backgroundColor: `hsl(${tempHue}, 100%, 50%)`,
                      backgroundImage: `
                        linear-gradient(to top, #000, transparent),
                        linear-gradient(to right, #fff, transparent)
                      `,
                    }}
                  >
                    {/* DRAGGABLE HANDLE RING */}
                    <div
                      className="w-6 h-6 rounded-full border-2 border-white shadow-lg absolute -translate-x-1/2 -translate-y-1/2 pointer-events-none"
                      style={{
                        left: `${tempSat}%`,
                        top: `${100 - tempVal}%`,
                        backgroundColor: currentTempHex,
                        boxShadow: '0 0 10px rgba(0,0,0,0.8), inset 0 0 4px rgba(255,255,255,0.8)',
                      }}
                    />
                  </div>
                </div>

                {/* CONTROLS COLUMN (SLIDERS, PREVIEW & NUMERIC INPUTS) */}
                <div className="md:col-span-5 lg:col-span-4 space-y-5 bg-zinc-950/40 p-4 md:p-5 rounded-2xl border border-zinc-800/80">
                  {/* COLOR BADGE + HUE RAINBOW SLIDER */}
                  <div className="space-y-3">
                    <span className="text-[10px] font-mono text-zinc-400 font-bold uppercase">Espectro de Matiz</span>
                    <div className="flex items-center gap-4">
                      {/* CIRCULAR PREVIEW BADGE */}
                      <div
                        className="w-12 h-12 md:w-14 md:h-14 rounded-full border-2 border-white/20 shrink-0 shadow-lg"
                        style={{
                          backgroundColor: currentTempHex,
                          boxShadow: `0 0 16px ${currentTempHex}66`,
                        }}
                      />

                      {/* HUE RAINBOW SPECTRUM SLIDER */}
                      <div
                        onMouseDown={(e) => {
                          isDraggingHue.current = true;
                          handleHueSliderMove(e);
                        }}
                        onMouseMove={(e) => {
                          if (isDraggingHue.current) handleHueSliderMove(e);
                        }}
                        onTouchStart={(e) => {
                          isDraggingHue.current = true;
                          handleHueSliderMove(e);
                        }}
                        onTouchMove={(e) => {
                          if (isDraggingHue.current) handleHueSliderMove(e);
                        }}
                        className="flex-1 h-5 md:h-6 rounded-full relative cursor-pointer border border-zinc-800 touch-none shadow-inner"
                        style={{
                          background:
                            'linear-gradient(to right, #ff0000 0%, #ffff00 17%, #00ff00 33%, #00ffff 50%, #0000ff 67%, #ff00ff 83%, #ff0000 100%)',
                        }}
                      >
                        <div
                          className="w-6 h-6 md:w-7 md:h-7 rounded-full border-2 border-white bg-zinc-900 shadow-md absolute top-1/2 -translate-y-1/2 -translate-x-1/2 pointer-events-none"
                          style={{
                            left: `${(tempHue / 360) * 100}%`,
                            backgroundColor: `hsl(${tempHue}, 100%, 50%)`,
                          }}
                        />
                      </div>
                    </div>
                  </div>

                  {/* FORMAT SELECTOR & NUMERIC INPUTS */}
                  <div className="pt-2 border-t border-zinc-800/80 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-mono text-zinc-400 font-bold uppercase">Código da Cor</span>
                      <select
                        value={colorFormat}
                        onChange={(e) => setColorFormat(e.target.value as any)}
                        className="bg-zinc-950 border border-zinc-800 rounded-xl px-2.5 py-1 text-xs font-mono font-bold text-zinc-300 focus:outline-none focus:border-orange-500"
                      >
                        <option value="RGB">RGB</option>
                        <option value="HEX">HEX</option>
                      </select>
                    </div>

                    {colorFormat === 'RGB' ? (
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-1 flex-1">
                          <span className="text-[10px] font-mono text-zinc-500 font-bold">R</span>
                          <input
                            type="number"
                            min="0"
                            max="255"
                            value={tempRgb.r}
                            onChange={(e) => {
                              const val = Math.max(0, Math.min(255, parseInt(e.target.value) || 0));
                              const newRgb = { ...tempRgb, r: val };
                              setTempRgb(newRgb);
                              const hsv = rgbToHsv(val, tempRgb.g, tempRgb.b);
                              setTempHue(hsv.h); setTempSat(hsv.s); setTempVal(hsv.v);
                            }}
                            className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-1.5 py-1 text-xs text-center font-mono font-bold text-white focus:outline-none focus:border-orange-500"
                          />
                        </div>
                        <div className="flex items-center gap-1 flex-1">
                          <span className="text-[10px] font-mono text-zinc-500 font-bold">G</span>
                          <input
                            type="number"
                            min="0"
                            max="255"
                            value={tempRgb.g}
                            onChange={(e) => {
                              const val = Math.max(0, Math.min(255, parseInt(e.target.value) || 0));
                              const newRgb = { ...tempRgb, g: val };
                              setTempRgb(newRgb);
                              const hsv = rgbToHsv(tempRgb.r, val, tempRgb.b);
                              setTempHue(hsv.h); setTempSat(hsv.s); setTempVal(hsv.v);
                            }}
                            className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-1.5 py-1 text-xs text-center font-mono font-bold text-white focus:outline-none focus:border-orange-500"
                          />
                        </div>
                        <div className="flex items-center gap-1 flex-1">
                          <span className="text-[10px] font-mono text-zinc-500 font-bold">B</span>
                          <input
                            type="number"
                            min="0"
                            max="255"
                            value={tempRgb.b}
                            onChange={(e) => {
                              const val = Math.max(0, Math.min(255, parseInt(e.target.value) || 0));
                              const newRgb = { ...tempRgb, b: val };
                              setTempRgb(newRgb);
                              const hsv = rgbToHsv(tempRgb.r, tempRgb.g, val);
                              setTempHue(hsv.h); setTempSat(hsv.s); setTempVal(hsv.v);
                            }}
                            className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-1.5 py-1 text-xs text-center font-mono font-bold text-white focus:outline-none focus:border-orange-500"
                          />
                        </div>
                      </div>
                    ) : (
                      <input
                        type="text"
                        value={currentTempHex}
                        onChange={(e) => {
                          const val = e.target.value;
                          if (/^#[0-9A-Fa-f]{6}$/.test(val)) {
                            const rgb = hexToRgb(val);
                            setTempRgb(rgb);
                            const hsv = rgbToHsv(rgb.r, rgb.g, rgb.b);
                            setTempHue(hsv.h); setTempSat(hsv.s); setTempVal(hsv.v);
                          }
                        }}
                        className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-2 py-1.5 text-xs text-center font-mono font-bold text-white uppercase focus:outline-none focus:border-orange-500"
                      />
                    )}
                  </div>
                </div>
              </div>

              {/* BOTTOM ACTIONS */}
              <div className="pt-3 flex items-center justify-end gap-3 border-t border-zinc-800/80">
                <button
                  type="button"
                  onClick={() => setViewMode('presets')}
                  className="px-4 py-2 rounded-xl text-xs font-mono font-bold text-zinc-400 hover:text-white transition-all uppercase"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={handleApplyCustomColor}
                  className="px-5 py-2 rounded-xl text-xs font-mono font-bold text-white bg-orange-500 hover:bg-orange-600 transition-all uppercase shadow-md"
                >
                  Selecione
                </button>
              </div>
            </div>
          )}

          {/* MODE 3: SPIRAL COLOR WHEEL & BRIGHTNESS VARIATION */}
          {viewMode === 'custom_wheel' && (
            <div className="p-5 md:p-8 space-y-6 max-h-[85vh] md:max-h-[75vh] overflow-y-auto no-scrollbar">
              {/* TAB TOGGLE BETWEEN 2D CANVAS & SPIRAL WHEEL */}
              <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
                <span className="text-xs font-mono font-bold text-zinc-400 uppercase">
                  Modo de Seleção
                </span>
                <div className="flex items-center gap-1 bg-zinc-950 p-1 rounded-xl border border-zinc-800">
                  <button
                    onClick={() => setViewMode('custom_2d')}
                    className="px-3.5 py-1.5 rounded-lg text-[10px] md:text-xs font-mono font-bold uppercase transition-all text-zinc-400 hover:text-white"
                  >
                    Gradiente 2D
                  </button>
                  <button
                    onClick={() => setViewMode('custom_wheel')}
                    className="px-3.5 py-1.5 rounded-lg text-[10px] md:text-xs font-mono font-bold uppercase transition-all bg-orange-500 text-white shadow-sm"
                  >
                    Roda / Matriz
                  </button>
                </div>
              </div>

              {/* DESKTOP 2-COLUMN LAYOUT */}
              <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
                {/* SPIRAL COLOR WHEEL CONTAINER WITH DRAG / TOUCH INTERACTION */}
                <div className="md:col-span-7 lg:col-span-8 flex justify-center">
                  <div
                    ref={wheelContainerRef}
                    onMouseDown={(e) => {
                      isDraggingWheel.current = true;
                      handleWheelMove(e);
                    }}
                    onMouseMove={(e) => {
                      if (isDraggingWheel.current) handleWheelMove(e);
                    }}
                    onTouchStart={(e) => {
                      isDraggingWheel.current = true;
                      handleWheelMove(e);
                    }}
                    onTouchMove={(e) => {
                      if (isDraggingWheel.current) handleWheelMove(e);
                    }}
                    className="w-full h-64 md:h-96 flex items-center justify-center relative bg-zinc-950/40 rounded-2xl border border-zinc-800/60 overflow-hidden py-4 cursor-crosshair touch-none select-none"
                  >
                    {/* Mobile Wheel Frame */}
                    <div className="md:hidden relative w-56 h-56 flex items-center justify-center">
                      {/* Center Dot Badge */}
                      <div
                        className="w-6 h-6 rounded-full border border-white/40 z-10 shadow-md transition-colors"
                        style={{ backgroundColor: currentTempHex }}
                      />

                      {/* Radiating Spiral Dots */}
                      {spiralDots.map((dot, idx) => {
                        const isSelected =
                          Math.abs(dot.rgb.r - tempRgb.r) < 8 &&
                          Math.abs(dot.rgb.g - tempRgb.g) < 8 &&
                          Math.abs(dot.rgb.b - tempRgb.b) < 8;

                        return (
                          <div
                            key={idx}
                            style={{
                              transform: `translate(${dot.xMobile}px, ${dot.yMobile}px)`,
                              backgroundColor: dot.hex,
                            }}
                            className={`absolute w-3.5 h-3.5 rounded-full pointer-events-none transition-transform shadow-sm ${
                              isSelected ? 'ring-2 ring-white scale-150 z-20 shadow-md' : 'opacity-90'
                            }`}
                          />
                        );
                      })}
                    </div>

                    {/* Expanded Desktop Wheel Frame */}
                    <div className="hidden md:flex relative w-80 h-80 items-center justify-center">
                      {/* Center Dot Badge */}
                      <div
                        className="w-8 h-8 rounded-full border-2 border-white/40 z-10 shadow-lg transition-colors"
                        style={{ backgroundColor: currentTempHex }}
                      />

                      {/* Radiating Spiral Dots Desktop */}
                      {spiralDots.map((dot, idx) => {
                        const isSelected =
                          Math.abs(dot.rgb.r - tempRgb.r) < 8 &&
                          Math.abs(dot.rgb.g - tempRgb.g) < 8 &&
                          Math.abs(dot.rgb.b - tempRgb.b) < 8;

                        return (
                          <div
                            key={idx}
                            style={{
                              transform: `translate(${dot.xDesktop}px, ${dot.yDesktop}px)`,
                              backgroundColor: dot.hex,
                            }}
                            className={`absolute w-4 h-4 rounded-full pointer-events-none transition-transform shadow-sm ${
                              isSelected ? 'ring-2 ring-white scale-150 z-20 shadow-md' : 'opacity-90'
                            }`}
                          />
                        );
                      })}
                    </div>
                  </div>
                </div>

                {/* RIGHT COLUMN: PREVIEW & BRIGHTNESS CONTROLS */}
                <div className="md:col-span-5 lg:col-span-4 space-y-6 bg-zinc-950/40 p-5 rounded-2xl border border-zinc-800/80">
                  <div className="flex items-center gap-4">
                    <div
                      className="w-14 h-14 rounded-2xl border-2 border-white/20 shrink-0 shadow-lg"
                      style={{
                        backgroundColor: currentTempHex,
                        boxShadow: `0 0 20px ${currentTempHex}80`,
                      }}
                    />
                    <div>
                      <span className="text-[10px] font-mono text-zinc-400 font-bold uppercase block">Cor Selecionada</span>
                      <span className="text-sm md:text-base font-mono font-bold text-white uppercase tracking-wider">{currentTempHex}</span>
                    </div>
                  </div>

                  {/* BRIGHTNESS / VARIATION SLIDER */}
                  <div className="space-y-2 pt-2 border-t border-zinc-800/80">
                    <div className="flex items-center justify-between text-[10px] md:text-xs font-mono font-bold text-zinc-400 uppercase">
                      <span>Mais escuro</span>
                      <span className="text-zinc-200">Variação de Brilho</span>
                      <span>Mais claro</span>
                    </div>
                    <div className="relative flex items-center">
                      <input
                        type="range"
                        min="30"
                        max="170"
                        value={brightness}
                        onChange={(e) => setBrightness(parseInt(e.target.value))}
                        className="w-full h-2.5 rounded-lg appearance-none cursor-pointer accent-orange-500 bg-gradient-to-r from-black via-orange-500 to-white"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* BOTTOM ACTIONS */}
              <div className="pt-3 flex items-center justify-end gap-3 border-t border-zinc-800/80">
                <button
                  type="button"
                  onClick={() => setViewMode('presets')}
                  className="px-4 py-2 rounded-xl text-xs font-mono font-bold text-zinc-400 hover:text-white transition-all uppercase tracking-wider"
                >
                  CANCELAR
                </button>
                <button
                  type="button"
                  onClick={handleApplyCustomColor}
                  className="px-5 py-2 rounded-xl text-xs font-mono font-bold text-white bg-orange-500 hover:bg-orange-600 transition-all uppercase tracking-wider shadow-md"
                >
                  ACEITAR
                </button>
              </div>
            </div>
          )}
        </motion.div>
      </div>
    </AnimatePresence>
  );
}

