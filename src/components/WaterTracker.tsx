import React, { useState } from 'react';
import { 
  Droplets, 
  Plus, 
  Minus, 
  RotateCcw, 
  Trophy, 
  Sparkles, 
  CheckCircle2, 
  Zap,
  SlidersHorizontal,
  Edit3,
  Check,
  GlassWater
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface WaterTrackerProps {
  waterLiters: number;
  onChange: (val: number) => void;
  targetLiters?: number;
  onAddXp?: (amount: number) => void;
}

export default function WaterTracker({
  waterLiters,
  onChange,
  targetLiters = 3.0,
  onAddXp
}: WaterTrackerProps) {
  const [isEditingCustom, setIsEditingCustom] = useState(false);
  const [customInputValue, setCustomInputValue] = useState(waterLiters.toFixed(2));
  const [selectedPresetGoal, setSelectedPresetGoal] = useState<number>(targetLiters);

  const currentLiters = Math.max(0, parseFloat((waterLiters || 0).toFixed(2)));
  const percentage = Math.min(150, Math.round((currentLiters / selectedPresetGoal) * 100));
  const isGoalReached = currentLiters >= selectedPresetGoal;

  const handleAdd = (amount: number) => {
    const nextVal = Math.max(0, Math.min(10, parseFloat((currentLiters + amount).toFixed(2))));
    onChange(nextVal);
    if (amount > 0 && onAddXp) {
      onAddXp(Math.max(1, Math.round(amount * 4)));
    }
  };

  const handleDirectSet = (val: number) => {
    const clean = Math.max(0, Math.min(10, parseFloat(val.toFixed(2))));
    onChange(clean);
  };

  const handleCustomInputSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const parsed = parseFloat(customInputValue.replace(',', '.'));
    if (!isNaN(parsed) && parsed >= 0) {
      handleDirectSet(parsed);
    }
    setIsEditingCustom(false);
  };

  // Status message according to progress
  const getStatusText = () => {
    if (currentLiters === 0) return { text: 'Inicie sua hidratação hoje', color: 'text-zinc-500', badge: '0%' };
    if (percentage < 40) return { text: 'Início de hidratação — continue bebendo água', color: 'text-cyan-400', badge: `${percentage}%` };
    if (percentage < 75) return { text: 'Excelente ritmo de hidratação celular', color: 'text-blue-400', badge: `${percentage}%` };
    if (percentage < 100) return { text: 'Quase lá! Falta pouco para atingir sua meta', color: 'text-sky-300', badge: `${percentage}%` };
    return { text: 'Meta diária de hidratação concluída! 🏆', color: 'text-emerald-400', badge: `${percentage}%` };
  };

  const status = getStatusText();

  // 12 cups representing 250ml each (up to 3L standard)
  const totalCups = 12;
  const filledCupsCount = Math.min(totalCups, Math.floor((currentLiters / 0.25) + 0.05));

  return (
    <div className="bg-[#09090d] border border-cyan-500/20 rounded-2xl p-4 sm:p-5 space-y-4 shadow-[0_4px_24px_rgba(6,182,212,0.06)] relative overflow-hidden transition-all">
      {/* Subtle background glow */}
      <div className="absolute -top-16 -right-16 w-36 h-36 bg-cyan-500/10 rounded-full blur-2xl pointer-events-none" />
      <div className="absolute -bottom-16 -left-16 w-36 h-36 bg-blue-600/10 rounded-full blur-2xl pointer-events-none" />

      {/* Header: Title & Numeric Metrics */}
      <div className="flex items-center justify-between border-b border-zinc-850/80 pb-3">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center shadow-[0_0_12px_rgba(6,182,212,0.25)]">
            <Droplets className="w-4 h-4 text-cyan-400 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h4 className="text-xs font-black text-white uppercase tracking-wider font-mono">Consumo de Água</h4>
              {isGoalReached && (
                <span className="flex items-center gap-1 text-[9px] font-mono font-black px-1.5 py-0.5 rounded-full bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 animate-pulse">
                  <Trophy className="w-2.5 h-2.5" /> META
                </span>
              )}
            </div>
            <p className="text-[10px] text-zinc-400 font-medium">{status.text}</p>
          </div>
        </div>

        {/* Current / Target Liter Counter */}
        <div className="text-right">
          <div className="flex items-baseline justify-end gap-1 font-mono">
            <span className="text-lg font-black text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-400">
              {currentLiters.toFixed(2)}
            </span>
            <span className="text-[10px] font-bold text-zinc-500 uppercase">/ {selectedPresetGoal.toFixed(1)} L</span>
          </div>
          <span className="text-[9px] font-mono font-bold text-cyan-400 bg-cyan-500/10 px-2 py-0.5 rounded border border-cyan-500/20">
            {percentage}%
          </span>
        </div>
      </div>

      {/* Interactive Cyber Fluid Progress Bar */}
      <div className="space-y-1.5">
        <div className="relative h-3 w-full bg-zinc-950 rounded-full border border-zinc-800/90 overflow-hidden p-0.5">
          <motion.div 
            className={`h-full rounded-full transition-all duration-300 ${
              isGoalReached 
                ? 'bg-gradient-to-r from-cyan-400 via-sky-400 to-emerald-400 shadow-[0_0_12px_rgba(52,211,153,0.5)]' 
                : 'bg-gradient-to-r from-cyan-500 via-blue-500 to-indigo-500 shadow-[0_0_12px_rgba(6,182,212,0.4)]'
            }`}
            style={{ width: `${Math.min(100, percentage)}%` }}
            initial={false}
            animate={{ width: `${Math.min(100, percentage)}%` }}
          />
          {/* 100% Goal Marker indicator */}
          <div 
            className="absolute top-0 bottom-0 w-0.5 bg-white/70 shadow-[0_0_4px_#ffffff] pointer-events-none"
            style={{ left: '100%' }}
            title="Meta 100%"
          />
        </div>

        <div className="flex items-center justify-between text-[9px] font-mono text-zinc-500 px-0.5">
          <span>0.0 L</span>
          <div className="flex items-center gap-1">
            <span>Meta:</span>
            <select
              value={selectedPresetGoal}
              onChange={(e) => setSelectedPresetGoal(parseFloat(e.target.value))}
              className="bg-zinc-900 border border-zinc-800 rounded px-1.5 py-0.5 text-cyan-400 font-bold outline-none cursor-pointer hover:border-cyan-500/40"
            >
              <option value="2.0">2.0 L</option>
              <option value="2.5">2.5 L</option>
              <option value="3.0">3.0 L (Recomendado)</option>
              <option value="3.5">3.5 L</option>
              <option value="4.0">4.0 L</option>
            </select>
          </div>
          <span>5.0 L</span>
        </div>
      </div>

      {/* Visual Cup Slots (Copos do Dia de 250ml) */}
      <div className="space-y-1.5 bg-zinc-950/70 border border-zinc-900 rounded-xl p-3">
        <div className="flex items-center justify-between">
          <span className="text-[10px] font-mono font-bold text-zinc-400 flex items-center gap-1.5">
            <GlassWater className="w-3.5 h-3.5 text-cyan-400" />
            <span>COPOS REGISTRADOS (250ml cada)</span>
          </span>
          <span className="text-[9px] font-mono text-cyan-400 font-bold">
            {filledCupsCount} de {totalCups} copos
          </span>
        </div>

        {/* 12 interactive clickable cups */}
        <div className="grid grid-cols-6 sm:grid-cols-12 gap-1.5 pt-1">
          {Array.from({ length: totalCups }).map((_, idx) => {
            const isFilled = idx < filledCupsCount;
            const cupVolume = parseFloat(((idx + 1) * 0.25).toFixed(2));
            return (
              <button
                key={idx}
                type="button"
                onClick={() => handleDirectSet(cupVolume)}
                className={`group relative h-9 rounded-lg border flex flex-col items-center justify-center transition-all active:scale-90 ${
                  isFilled 
                    ? 'bg-gradient-to-t from-cyan-600/30 to-blue-500/20 border-cyan-500/60 text-cyan-300 shadow-[0_0_8px_rgba(6,182,212,0.25)]' 
                    : 'bg-zinc-900/60 border-zinc-800/80 text-zinc-600 hover:border-zinc-700 hover:text-zinc-400'
                }`}
                title={`Definir para ${cupVolume.toFixed(2)}L (${(idx + 1) * 250}ml)`}
              >
                <Droplets className={`w-3.5 h-3.5 transition-transform group-hover:scale-110 ${isFilled ? 'text-cyan-400 drop-shadow-[0_0_4px_rgba(6,182,212,0.8)]' : 'text-zinc-600'}`} />
                <span className="text-[7.5px] font-mono font-bold mt-0.5">
                  {idx + 1}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Quick Action Dose Buttons */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
        <button
          type="button"
          onClick={() => handleAdd(-0.25)}
          disabled={currentLiters <= 0}
          className="p-2.5 bg-zinc-950 hover:bg-zinc-900 border border-zinc-850 disabled:opacity-40 disabled:pointer-events-none rounded-xl flex items-center justify-center gap-1.5 text-xs text-zinc-400 hover:text-white font-mono font-bold transition-all active:scale-95"
          title="Desfazer / Remover 250ml"
        >
          <Minus className="w-3.5 h-3.5 text-rose-400" />
          <span>250ml</span>
        </button>

        <button
          type="button"
          onClick={() => handleAdd(0.20)}
          className="p-2.5 bg-zinc-900/80 hover:bg-cyan-950/40 border border-zinc-800 hover:border-cyan-500/40 rounded-xl flex items-center justify-center gap-1.5 text-xs text-cyan-400 hover:text-cyan-300 font-mono font-bold transition-all active:scale-95 shadow-[0_0_8px_rgba(6,182,212,0.1)]"
          title="Adicionar copo pequeno de 200ml"
        >
          <Plus className="w-3.5 h-3.5 text-cyan-400" />
          <span>200ml</span>
        </button>

        <button
          type="button"
          onClick={() => handleAdd(0.25)}
          className="p-2.5 bg-cyan-500/10 hover:bg-cyan-500/20 border border-cyan-500/30 hover:border-cyan-500/50 rounded-xl flex items-center justify-center gap-1.5 text-xs text-cyan-300 font-mono font-black transition-all active:scale-95 shadow-[0_0_12px_rgba(6,182,212,0.15)]"
          title="Adicionar copo padrão de 250ml"
        >
          <Plus className="w-3.5 h-3.5 text-cyan-400" />
          <span>250ml</span>
        </button>

        <button
          type="button"
          onClick={() => handleAdd(0.50)}
          className="p-2.5 bg-blue-500/10 hover:bg-blue-500/20 border border-blue-500/30 hover:border-blue-500/50 rounded-xl flex items-center justify-center gap-1.5 text-xs text-blue-300 font-mono font-black transition-all active:scale-95 shadow-[0_0_12px_rgba(59,130,246,0.15)]"
          title="Adicionar garrafinha de 500ml"
        >
          <Plus className="w-3.5 h-3.5 text-blue-400" />
          <span>500ml</span>
        </button>

        <button
          type="button"
          onClick={() => handleAdd(1.00)}
          className="p-2.5 bg-indigo-500/10 hover:bg-indigo-500/20 border border-indigo-500/30 hover:border-indigo-500/50 rounded-xl flex items-center justify-center gap-1.5 text-xs text-indigo-300 font-mono font-black transition-all active:scale-95 col-span-2 sm:col-span-1 shadow-[0_0_12px_rgba(99,102,241,0.15)]"
          title="Adicionar garrafa / jarra de 1.0 Litro"
        >
          <Plus className="w-3.5 h-3.5 text-indigo-400" />
          <span>1.0 L</span>
        </button>
      </div>

      {/* Slider & Direct Numerical Input */}
      <div className="pt-1 border-t border-zinc-850/60 flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="flex-1 w-full flex items-center gap-3">
          <SlidersHorizontal className="w-3.5 h-3.5 text-zinc-500 shrink-0" />
          
          <div className="relative flex-1 w-full bg-zinc-950/80 rounded-full h-3 p-0.5 border border-zinc-800/80 shadow-inner group">
            {/* Filled bar in identical style to the top progress bar */}
            <div className="h-full rounded-full overflow-hidden w-full relative pointer-events-none">
              <div
                className={`h-full rounded-full transition-all duration-150 ${
                  currentLiters >= targetLiters && targetLiters > 0
                    ? 'bg-gradient-to-r from-cyan-400 via-sky-400 to-emerald-400 shadow-[0_0_12px_rgba(52,211,153,0.5)]'
                    : 'bg-gradient-to-r from-cyan-500 via-blue-500 to-indigo-500 shadow-[0_0_12px_rgba(6,182,212,0.4)]'
                }`}
                style={{ width: `${Math.min(100, Math.max(0, (currentLiters / 5.0) * 100))}%` }}
              />
            </div>

            {/* Glowing Handle / Thumb Indicator */}
            <div 
              className="absolute top-1/2 -translate-y-1/2 -ml-1.5 w-3 h-3 rounded-full bg-white border border-cyan-400 shadow-[0_0_8px_rgba(6,182,212,0.9)] pointer-events-none transition-transform group-hover:scale-125 z-10"
              style={{ left: `${Math.min(99, Math.max(1, (currentLiters / 5.0) * 100))}%` }}
            />

            {/* Native slider on top (transparent) for smooth dragging, clicking, touch & accessibility */}
            <input
              type="range"
              min="0"
              max="5"
              step="0.05"
              value={currentLiters}
              onChange={(e) => handleDirectSet(parseFloat(e.target.value))}
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-20"
              title={`Ajustar valor exato: ${currentLiters.toFixed(2)} L`}
            />
          </div>
        </div>

        {/* Custom Edit / Reset Controls */}
        <div className="flex items-center gap-2 shrink-0 self-end sm:self-auto">
          {isEditingCustom ? (
            <form onSubmit={handleCustomInputSubmit} className="flex items-center gap-1.5">
              <input
                type="number"
                step="0.01"
                min="0"
                max="15"
                value={customInputValue}
                onChange={(e) => setCustomInputValue(e.target.value)}
                autoFocus
                className="w-16 bg-zinc-950 border border-cyan-500/50 rounded-lg px-2 py-1 text-xs text-cyan-300 font-mono font-bold focus:outline-none focus:ring-1 focus:ring-cyan-400 shadow-[0_0_8px_rgba(6,182,212,0.2)]"
              />
              <span className="text-[10px] text-zinc-400 font-mono">L</span>
              <button
                type="submit"
                className="p-1 bg-cyan-500 text-black rounded-lg hover:bg-cyan-400 transition-colors"
                title="Confirmar"
              >
                <Check className="w-3.5 h-3.5 stroke-[3]" />
              </button>
              <button
                type="button"
                onClick={() => setIsEditingCustom(false)}
                className="p-1 text-zinc-500 hover:text-white rounded-lg transition-colors"
                title="Cancelar"
              >
                ✕
              </button>
            </form>
          ) : (
            <button
              type="button"
              onClick={() => {
                setCustomInputValue(currentLiters.toFixed(2));
                setIsEditingCustom(true);
              }}
              className="px-2.5 py-1.5 rounded-lg bg-zinc-950 hover:bg-zinc-900 border border-zinc-800 hover:border-cyan-500/40 text-zinc-400 hover:text-cyan-300 text-[10px] font-mono flex items-center gap-1.5 transition-colors shadow-sm"
              title="Digitar valor exato"
            >
              <Edit3 className="w-3 h-3 text-cyan-400" />
              <span>Digitar exato</span>
            </button>
          )}

          {currentLiters > 0 && (
            <button
              type="button"
              onClick={() => handleDirectSet(0)}
              className="p-1.5 text-zinc-500 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg border border-transparent hover:border-rose-500/20 text-xs transition-colors"
              title="Zerar registro de água"
            >
              <RotateCcw className="w-3 h-3" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
