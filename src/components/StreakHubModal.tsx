import React, { useState, useEffect } from 'react';
import { 
  Flame, 
  ShieldAlert, 
  ShieldCheck, 
  RotateCcw, 
  Zap, 
  Plus, 
  CheckCircle2, 
  X, 
  Award, 
  CheckSquare, 
  Clock, 
  BookOpen, 
  Calendar, 
  Sparkles,
  Info,
  ChevronRight,
  Trophy,
  Share2,
  Copy,
  Check,
  Grid,
  Gift,
  Lock
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  StreakHubData, 
  loadStreakHubData, 
  saveStreakHubData, 
  getFlameTier, 
  CategoryStreak,
  STREAK_MILESTONES,
  StreakMilestone,
  generateLast28DaysHeatmap,
  HeatmapDay
} from '../utils/streakStore';

interface StreakHubModalProps {
  isOpen: boolean;
  onClose: () => void;
  masterStreak: number;
  onUpdateMasterStreak?: (newStreak: number) => void;
  onNavigateToTab?: (tabId: string) => void;
  xpTotal?: number;
  addXp?: (amount: number) => void;
}

export const StreakHubModal: React.FC<StreakHubModalProps> = ({
  isOpen,
  onClose,
  masterStreak,
  onUpdateMasterStreak,
  onNavigateToTab,
  xpTotal = 0,
  addXp
}) => {
  const [data, setData] = useState<StreakHubData>(loadStreakHubData());
  const [showFreezeInfo, setShowFreezeInfo] = useState(false);
  const [recoveryFeedback, setRecoveryFeedback] = useState<string | null>(null);
  const [showShareCard, setShowShareCard] = useState(false);
  const [copiedText, setCopiedText] = useState(false);
  const [selectedHeatmapDay, setSelectedHeatmapDay] = useState<HeatmapDay | null>(null);

  const [showCelebration, setShowCelebration] = useState(false);

  useEffect(() => {
    if (isOpen) {
      const currentData = loadStreakHubData();
      // Synchronize master streak if passed from props
      if (masterStreak !== currentData.masterStreak) {
        currentData.masterStreak = masterStreak;
        if (masterStreak > currentData.bestMasterStreak) {
          currentData.bestMasterStreak = masterStreak;
        }
      }
      setData(currentData);
    }
  }, [isOpen, masterStreak]);

  if (!isOpen) return null;

  const flameTier = getFlameTier(data.masterStreak);
  const heatmapDays = generateLast28DaysHeatmap(data.masterStreak);

  // Check if streak is at risk today
  const isStreakAtRisk = (Object.values(data.categoryStreaks) as CategoryStreak[]).every(cat => !cat.completedToday);

  const triggerCelebration = () => {
    setShowCelebration(true);
    setTimeout(() => setShowCelebration(false), 3000);
  };

  // Buy or Add Streak Freeze Shield with XP
  const handleBuyFreeze = () => {
    if (data.streakFreezes >= data.maxFreezes) return;
    const cost = 100; // 100 XP to buy a freeze shield
    if (xpTotal < cost) {
      setRecoveryFeedback('XP insuficiente para comprar um Congelamento (Necessário: 100 XP)');
      setTimeout(() => setRecoveryFeedback(null), 3000);
      return;
    }

    if (addXp) {
      addXp(-cost);
    }

    const updated: StreakHubData = {
      ...data,
      streakFreezes: data.streakFreezes + 1
    };
    setData(updated);
    saveStreakHubData(updated);
    setRecoveryFeedback('🛡️ Congelador de Ofensiva ativado com sucesso! (-100 XP)');
    setTimeout(() => setRecoveryFeedback(null), 3000);
  };

  // Trigger Streak Recovery Challenge
  const handleActivateRecovery = () => {
    const updated: StreakHubData = {
      ...data,
      masterStreak: Math.max(1, data.masterStreak + 1),
      recoveryAvailable: false,
      recoveryUsedDate: new Date().toISOString().split('T')[0]
    };
    setData(updated);
    saveStreakHubData(updated);
    if (onUpdateMasterStreak) {
      onUpdateMasterStreak(updated.masterStreak);
    }
    setRecoveryFeedback('🔥 Resgate Concluído! Sua ofensiva foi recuperada com sucesso!');
    setTimeout(() => setRecoveryFeedback(null), 3500);
  };

  // Claim Milestone Reward (Suggestion 3)
  const handleClaimMilestone = (m: StreakMilestone) => {
    if (data.claimedMilestones?.includes(m.id)) return;
    if (data.masterStreak < m.daysRequired) return;

    if (addXp) {
      addXp(m.xpReward);
    }

    const claimed = [...(data.claimedMilestones || []), m.id];
    const updated: StreakHubData = {
      ...data,
      claimedMilestones: claimed
    };
    setData(updated);
    saveStreakHubData(updated);
    triggerCelebration();
    setRecoveryFeedback(`🎉 Recompensa de Marco Resgatada! +${m.xpReward} XP adicionados!`);
    setTimeout(() => setRecoveryFeedback(null), 3500);
  };

  // Claim Weekly Quest Reward (Suggestion 5)
  const handleClaimWeeklyQuest = () => {
    if (data.weeklyQuest.claimed) return;
    if (data.weeklyQuest.currentCount < data.weeklyQuest.targetCount) return;

    if (addXp) {
      addXp(data.weeklyQuest.xpReward);
    }

    const updated: StreakHubData = {
      ...data,
      streakFreezes: Math.min(data.maxFreezes, data.streakFreezes + data.weeklyQuest.freezeReward),
      weeklyQuest: {
        ...data.weeklyQuest,
        claimed: true
      }
    };
    setData(updated);
    saveStreakHubData(updated);
    triggerCelebration();
    setRecoveryFeedback(`🏆 Desafio Semanal Concluído! +${data.weeklyQuest.xpReward} XP e +${data.weeklyQuest.freezeReward} Escudo!`);
    setTimeout(() => setRecoveryFeedback(null), 3500);
  };

  // Toggle Category Streak completion state
  const handleToggleCategory = (catId: 'checklist' | 'habits' | 'reading' | 'journal') => {
    const cat = data.categoryStreaks[catId];
    const newCompleted = !cat.completedToday;
    const newStreak = newCompleted ? cat.currentStreak + 1 : Math.max(0, cat.currentStreak - 1);
    const newBest = Math.max(newStreak, cat.bestStreak);

    const updated: StreakHubData = {
      ...data,
      categoryStreaks: {
        ...data.categoryStreaks,
        [catId]: {
          ...cat,
          completedToday: newCompleted,
          currentStreak: newStreak,
          bestStreak: newBest
        }
      }
    };
    setData(updated);
    saveStreakHubData(updated);
  };

  // Copy Shareable Card text (Suggestion 4)
  const handleCopyShareCard = () => {
    const shareText = `🔥 OFENSIVA DIÁRIA: ${data.masterStreak} Dias Seguidos!\n` +
      `⚡ Nível: ${flameTier.tier} (${flameTier.multiplier})\n` +
      `🏆 Maior Recorde: ${data.bestMasterStreak} Dias\n` +
      `📍 Organizado com o Planner Pessoal & Foco Central. Mantenha a constância! 💪`;

    navigator.clipboard.writeText(shareText);
    setCopiedText(true);
    setTimeout(() => setCopiedText(false), 2500);
  };

  const categoryIcons = {
    checklist: CheckSquare,
    habits: Clock,
    reading: BookOpen,
    journal: Calendar
  };

  // Heatmap intensity background colors
  const getIntensityColor = (intensity: number) => {
    switch (intensity) {
      case 4: return 'bg-orange-500 border-orange-400 shadow-[0_0_8px_rgba(249,115,22,0.5)]';
      case 3: return 'bg-amber-500/80 border-amber-400';
      case 2: return 'bg-amber-600/50 border-amber-500/30';
      case 1: return 'bg-zinc-800 border-zinc-700';
      default: return 'bg-zinc-900/60 border-zinc-800/60';
    }
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[100] flex items-center justify-center p-3 sm:p-5 bg-black/80 backdrop-blur-md">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 15 }}
          className="relative w-full max-w-2xl bg-[#09090b] border border-zinc-800 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
        >
          {/* Celebration VFX Overlay (Suggestion 6) */}
          <AnimatePresence>
            {showCelebration && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="absolute inset-0 z-50 pointer-events-none flex items-center justify-center overflow-hidden bg-black/40 backdrop-blur-[2px]"
              >
                <div className="relative flex flex-col items-center justify-center">
                  <motion.div
                    initial={{ scale: 0.2, rotate: -20 }}
                    animate={{ scale: [0.2, 1.2, 1], rotate: [ -20, 10, 0] }}
                    className="p-6 rounded-full bg-gradient-to-r from-amber-500 via-orange-500 to-amber-400 shadow-[0_0_50px_rgba(249,115,22,0.8)] text-white"
                  >
                    <Trophy className="h-16 w-16 animate-bounce" />
                  </motion.div>
                  <motion.div
                    initial={{ y: 20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    className="mt-4 px-6 py-2 rounded-2xl bg-zinc-950 border border-orange-500/50 text-amber-300 font-black text-xl font-mono shadow-2xl tracking-wider text-center"
                  >
                    🎉 RECOMPENSA DE OFENSIVA RESGATADA!
                  </motion.div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Header Bar */}
          <div className="flex items-center justify-between p-5 border-b border-zinc-800/80 bg-zinc-950/60">
            <div className="flex items-center gap-3">
              <div className={`p-2.5 rounded-2xl border ${flameTier.badgeColor} ${flameTier.glow} flex items-center justify-center`}>
                <Flame className={`h-6 w-6 ${flameTier.iconColor} animate-pulse`} />
              </div>
              <div>
                <h2 className="text-base font-black text-white uppercase tracking-wider flex items-center gap-2">
                  Central de Ofensivas <Sparkles className="h-4 w-4 text-orange-400" />
                </h2>
                <p className="text-xs text-zinc-400 font-mono">
                  Sua constância diária, proteções e streaks por categoria
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-zinc-800 text-zinc-400 hover:text-white rounded-xl transition-colors"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Feedback Banner */}
          {recoveryFeedback && (
            <div className="bg-orange-500/20 border-b border-orange-500/30 px-5 py-2.5 text-xs text-orange-300 font-bold flex items-center gap-2">
              <Zap className="h-4 w-4 text-orange-400 animate-bounce" />
              {recoveryFeedback}
            </div>
          )}

          {/* Scrollable Content */}
          <div className="flex-1 overflow-y-auto p-5 space-y-6">

            {/* SUGGESTION 6: STREAK LOSS RISK ALERT BANNER */}
            {isStreakAtRisk && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-gradient-to-r from-red-950/80 via-rose-950/60 to-zinc-900 border border-red-500/40 rounded-2xl p-4 flex flex-col sm:flex-row items-center justify-between gap-3 shadow-lg shadow-red-950/40"
              >
                <div className="flex items-center gap-3 text-center sm:text-left">
                  <div className="p-2.5 bg-red-500/20 border border-red-500/40 text-red-400 rounded-xl animate-bounce shrink-0">
                    <ShieldAlert className="h-6 w-6" />
                  </div>
                  <div>
                    <h4 className="text-xs font-black text-red-300 uppercase font-mono tracking-wider">
                      ⚠️ Sua chama precisa de combustível hoje!
                    </h4>
                    <p className="text-[11px] text-zinc-300">
                      Nenhuma atividade foi marcada hoje. Complete ao menos 1 tarefa para não depender dos escudos de congelamento!
                    </p>
                  </div>
                </div>

                {onNavigateToTab && (
                  <button
                    onClick={() => {
                      onClose();
                      onNavigateToTab('checklist');
                    }}
                    className="px-4 py-2 bg-gradient-to-r from-red-500 to-rose-600 hover:from-red-600 hover:to-rose-700 text-white font-bold text-xs rounded-xl shadow-md transition-all shrink-0 font-mono"
                  >
                    Ir para Checklist 🔥
                  </button>
                )}
              </motion.div>
            )}

            {/* Master Flame Hero Card */}
            <div className="relative overflow-hidden rounded-2xl border border-zinc-800 bg-gradient-to-br from-zinc-900/90 via-zinc-950 to-black p-5 shadow-inner">
              <div className="absolute top-0 right-0 w-48 h-48 bg-orange-500/10 rounded-full blur-3xl pointer-events-none" />
              
              <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="flex items-center gap-4 text-center sm:text-left">
                  <div className={`h-20 w-20 rounded-2xl bg-gradient-to-tr ${flameTier.flameGradient} p-0.5 shadow-lg flex items-center justify-center shrink-0`}>
                    <div className="w-full h-full bg-zinc-950 rounded-[14px] flex flex-col items-center justify-center">
                      <Flame className={`h-8 w-8 ${flameTier.iconColor}`} />
                      <span className="text-[10px] font-black text-zinc-400 uppercase font-mono">Nível</span>
                    </div>
                  </div>
                  <div>
                    <div className="flex items-center justify-center sm:justify-start gap-2 mb-1">
                      <span className={`text-xs font-bold px-2.5 py-0.5 rounded-full border ${flameTier.badgeColor}`}>
                        {flameTier.tier}
                      </span>
                      <span className="text-xs font-mono font-bold text-amber-400 bg-amber-500/10 border border-amber-500/20 px-2 py-0.5 rounded-full">
                        {flameTier.multiplier}
                      </span>
                    </div>
                    <div className="text-3xl font-black text-white font-mono flex items-baseline gap-1">
                      {data.masterStreak} <span className="text-sm font-sans font-bold text-zinc-400">dias seguidos</span>
                    </div>
                    <div className="text-[11px] text-zinc-500 font-mono mt-0.5">
                      Recorde Histórico Master: <strong className="text-zinc-300">{data.bestMasterStreak} dias</strong>
                    </div>
                  </div>
                </div>

                <div className="flex flex-col items-end gap-2 w-full sm:w-auto">
                  <button
                    onClick={() => setShowShareCard(!showShareCard)}
                    className="px-3 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-white text-xs font-bold rounded-xl border border-zinc-700 flex items-center gap-1.5 transition-colors shadow-sm"
                  >
                    <Share2 className="h-3.5 w-3.5 text-orange-400" />
                    {showShareCard ? 'Ocultar Card' : '🎴 Card Compartilhável'}
                  </button>
                  <button
                    onClick={() => setShowFreezeInfo(!showFreezeInfo)}
                    className="text-[11px] text-zinc-400 hover:text-white flex items-center gap-1 transition-colors"
                  >
                    <Info className="h-3.5 w-3.5 text-orange-400" />
                    Como funciona a proteção?
                  </button>
                </div>
              </div>

              {/* Shareable Card Banner Preview (Suggestion 4) */}
              {showShareCard && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mt-4 p-5 rounded-2xl bg-gradient-to-r from-orange-950/80 via-zinc-950 to-zinc-900 border border-orange-500/30 flex flex-col sm:flex-row items-center justify-between gap-4 shadow-xl"
                >
                  <div className="space-y-1.5 text-center sm:text-left">
                    <div className="flex items-center justify-center sm:justify-start gap-2">
                      <Flame className="h-5 w-5 text-orange-500 animate-pulse" />
                      <span className="text-xs font-bold text-orange-300 uppercase font-mono tracking-wider">
                        Constância em Foco • Banner do Dia
                      </span>
                    </div>
                    <h3 className="text-lg font-black text-white font-mono">
                      🔥 {data.masterStreak} DIAS EM COMBO ININTERRUPTO
                    </h3>
                    <p className="text-xs text-zinc-400">
                      Nível: <strong className="text-amber-400">{flameTier.tier}</strong> • Maior Sequência: <strong className="text-white">{data.bestMasterStreak} dias</strong>
                    </p>
                  </div>

                  <button
                    onClick={handleCopyShareCard}
                    className="px-4 py-2 bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white font-bold text-xs rounded-xl flex items-center gap-2 shadow-lg shadow-orange-500/20 transition-all shrink-0"
                  >
                    {copiedText ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                    {copiedText ? 'Copiado!' : 'Copiar Texto'}
                  </button>
                </motion.div>
              )}

              {/* Info Expandable box */}
              {showFreezeInfo && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  className="mt-4 pt-4 border-t border-zinc-800 text-xs text-zinc-400 space-y-2 leading-relaxed"
                >
                  <p>
                    <strong className="text-orange-400">🛡️ Congelamento de Ofensiva (Streak Freeze):</strong> Se você pular um dia sem registrar tarefas, um escudo de congelamento é consumido automaticamente salvando sua sequência.
                  </p>
                  <p>
                    <strong className="text-orange-400">🔥 Resgate de Ofensiva:</strong> Se você não possuía escudos e perdeu o streak ontem, você pode resgatá-lo hoje completando um desafio de alta produtividade.
                  </p>
                </motion.div>
              )}
            </div>

            {/* SUGGESTION 5: SECTION - WEEKLY STREAK QUEST */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-bold text-zinc-300 uppercase tracking-wider flex items-center gap-2 font-mono">
                  <Zap className="h-4 w-4 text-amber-400" /> Sugestão 5: Desafio da Semana
                </h3>
                <span className="text-[10px] font-mono text-orange-400 font-bold bg-orange-500/10 border border-orange-500/20 px-2 py-0.5 rounded-full">
                  Expira em {data.weeklyQuest.expiresInDays} dias
                </span>
              </div>

              <div className="bg-gradient-to-r from-amber-950/40 via-zinc-950 to-zinc-900 border border-amber-500/30 rounded-2xl p-4 space-y-3 shadow-md">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="p-3 bg-amber-500/10 border border-amber-500/30 text-amber-400 rounded-xl shrink-0">
                      <Trophy className="h-6 w-6 animate-pulse" />
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-white flex items-center gap-2">
                        {data.weeklyQuest.title}
                      </h4>
                      <p className="text-[11px] text-zinc-400">{data.weeklyQuest.description}</p>
                    </div>
                  </div>
                </div>

                {/* Progress bar */}
                <div className="space-y-1.5">
                  <div className="flex justify-between text-[10px] font-mono font-bold">
                    <span className="text-zinc-400">Progresso Semanal</span>
                    <span className="text-amber-400">
                      {data.weeklyQuest.currentCount} / {data.weeklyQuest.targetCount} dias
                    </span>
                  </div>
                  <div className="w-full h-2.5 bg-zinc-800 rounded-full overflow-hidden border border-zinc-700/60 p-0.5">
                    <div
                      className="h-full bg-gradient-to-r from-amber-500 to-orange-500 rounded-full transition-all duration-500"
                      style={{ width: `${Math.min(100, (data.weeklyQuest.currentCount / data.weeklyQuest.targetCount) * 100)}%` }}
                    />
                  </div>
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-zinc-800/80">
                  <div className="flex items-center gap-2 text-[10px] font-mono font-bold text-amber-400">
                    <span className="flex items-center gap-1"><Gift className="h-3 w-3" /> +{data.weeklyQuest.xpReward} XP</span>
                    <span className="text-zinc-600">•</span>
                    <span className="flex items-center gap-1"><ShieldCheck className="h-3 w-3 text-emerald-400" /> +{data.weeklyQuest.freezeReward} Escudo</span>
                  </div>

                  {data.weeklyQuest.claimed ? (
                    <span className="px-3 py-1 bg-zinc-800 text-zinc-400 text-[10px] font-bold rounded-lg flex items-center gap-1 font-mono">
                      <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" /> Recompensa Concluída
                    </span>
                  ) : data.weeklyQuest.currentCount >= data.weeklyQuest.targetCount ? (
                    <button
                      onClick={handleClaimWeeklyQuest}
                      className="px-4 py-1.5 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white text-[11px] font-bold rounded-xl shadow-lg shadow-orange-500/20 transition-all animate-bounce"
                    >
                      Resgatar +{data.weeklyQuest.xpReward} XP & Escudo
                    </button>
                  ) : (
                    <span className="px-3 py-1 bg-zinc-900 text-zinc-500 text-[10px] font-bold rounded-lg flex items-center gap-1 font-mono">
                      <Lock className="h-3.5 w-3.5" /> Em andamento
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* SUGGESTION 4: SECTION - ACTIVITY HEATMAP GRID (28 DAYS) */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-bold text-zinc-300 uppercase tracking-wider flex items-center gap-2 font-mono">
                  <Grid className="h-4 w-4 text-orange-400" /> Sugestão 4: Mapa de Calor de Atividade (Últimos 28 Dias)
                </h3>
                <span className="text-[10px] text-zinc-500 font-mono">4 Semanas</span>
              </div>

              <div className="bg-zinc-900/60 border border-zinc-800/80 rounded-2xl p-4 space-y-3">
                {/* 28 Days Grid */}
                <div className="grid grid-cols-7 gap-1.5 sm:gap-2">
                  {heatmapDays.map((day, idx) => (
                    <button
                      key={idx}
                      onClick={() => setSelectedHeatmapDay(day)}
                      className={`h-9 rounded-lg border transition-all flex flex-col items-center justify-center p-1 ${getIntensityColor(day.intensity)} ${
                        selectedHeatmapDay?.dateStr === day.dateStr ? 'ring-2 ring-orange-400' : ''
                      }`}
                      title={`${day.dateStr}: ${day.tasksDone} atividades concluídas`}
                    >
                      <span className="text-[9px] font-bold text-zinc-300 font-mono">{day.dayNum}</span>
                      <span className="text-[7px] text-zinc-400 uppercase font-mono">{day.weekday}</span>
                    </button>
                  ))}
                </div>

                {/* Heatmap Legend & Selected Details */}
                <div className="flex flex-col sm:flex-row items-center justify-between pt-2 border-t border-zinc-800/60 gap-2 text-[10px] font-mono text-zinc-400">
                  <div className="flex items-center gap-1.5">
                    <span>Atividade:</span>
                    <span className="w-2.5 h-2.5 rounded bg-zinc-900 border border-zinc-800" title="Vazio" />
                    <span className="w-2.5 h-2.5 rounded bg-zinc-800 border border-zinc-700" title="Baixo" />
                    <span className="w-2.5 h-2.5 rounded bg-amber-600/50 border border-amber-500/30" title="Médio" />
                    <span className="w-2.5 h-2.5 rounded bg-amber-500/80 border border-amber-400" title="Alto" />
                    <span className="w-2.5 h-2.5 rounded bg-orange-500 border border-orange-400" title="Máximo" />
                  </div>

                  {selectedHeatmapDay ? (
                    <div className="text-orange-400 font-bold">
                      📅 {selectedHeatmapDay.dateStr}: {selectedHeatmapDay.tasksDone} ações concluídas
                    </div>
                  ) : (
                    <div className="text-zinc-500">
                      Clique num quadrado para ver o dia
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* SUGGESTION 3: SECTION - MILESTONES & XP REWARDS */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-bold text-zinc-300 uppercase tracking-wider flex items-center gap-2 font-mono">
                  <Trophy className="h-4 w-4 text-amber-400" /> Sugestão 3: Recompensas de Marcos & Badges
                </h3>
                <span className="text-[10px] text-zinc-500 font-mono">
                  {data.claimedMilestones?.length || 0} / {STREAK_MILESTONES.length} Resgatados
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {STREAK_MILESTONES.map((m) => {
                  const isUnlocked = data.masterStreak >= m.daysRequired;
                  const isClaimed = data.claimedMilestones?.includes(m.id);

                  return (
                    <div
                      key={m.id}
                      className={`border rounded-2xl p-4 flex flex-col justify-between space-y-3 transition-all ${
                        isClaimed
                          ? 'bg-zinc-950/40 border-zinc-800/50 opacity-70'
                          : isUnlocked
                          ? 'bg-gradient-to-br from-amber-950/30 to-zinc-900 border-amber-500/40 shadow-md'
                          : 'bg-zinc-900/40 border-zinc-800/80'
                      }`}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-3">
                          <div className={`p-2.5 rounded-xl border text-sm font-bold font-mono ${
                            isClaimed
                              ? 'bg-zinc-800 border-zinc-700 text-zinc-400'
                              : isUnlocked
                              ? 'bg-amber-500/10 border-amber-500/30 text-amber-300'
                              : 'bg-zinc-900 border-zinc-800 text-zinc-500'
                          }`}>
                            {m.badge}
                          </div>
                          <div>
                            <h4 className="text-xs font-bold text-white flex items-center gap-1.5">
                              {m.title}
                            </h4>
                            <p className="text-[10px] text-zinc-400">{m.description}</p>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center justify-between pt-2 border-t border-zinc-800/60">
                        <span className="text-[10px] font-mono font-bold text-amber-400 flex items-center gap-1">
                          <Gift className="h-3 w-3" /> +{m.xpReward} XP
                        </span>

                        {isClaimed ? (
                          <span className="px-2.5 py-1 bg-zinc-800 text-zinc-400 text-[10px] font-bold rounded-lg flex items-center gap-1 font-mono">
                            <CheckCircle2 className="h-3 w-3 text-emerald-400" /> Resgatado
                          </span>
                        ) : isUnlocked ? (
                          <button
                            onClick={() => handleClaimMilestone(m)}
                            className="px-3 py-1 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white text-[10px] font-bold rounded-lg shadow-md transition-all animate-pulse"
                          >
                            Resgatar +XP
                          </button>
                        ) : (
                          <span className="px-2.5 py-1 bg-zinc-900 text-zinc-500 text-[10px] font-bold rounded-lg flex items-center gap-1 font-mono">
                            <Lock className="h-3 w-3" /> Faltam {m.daysRequired - data.masterStreak}d
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* SUGGESTION 1: SECTION 1 - STREAK FREEZE & RECOVERY SYSTEM */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-bold text-zinc-300 uppercase tracking-wider flex items-center gap-2 font-mono">
                  <ShieldCheck className="h-4 w-4 text-emerald-400" /> Sugestão 1: Proteção & Resgate de Ofensiva
                </h3>
                <span className="text-[10px] text-zinc-500 font-mono">
                  {data.streakFreezes} / {data.maxFreezes} Escudos
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* Shield Card */}
                <div className="bg-zinc-900/60 border border-zinc-800 rounded-2xl p-4 flex flex-col justify-between space-y-3">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-2.5">
                      <div className="p-2 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-xl">
                        <ShieldCheck className="h-5 w-5" />
                      </div>
                      <div>
                        <div className="text-xs font-bold text-white">Escudos de Congelamento</div>
                        <div className="text-[10px] text-zinc-400 font-mono">Protege seu dia ausente</div>
                      </div>
                    </div>
                    <span className="text-sm font-black text-emerald-400 font-mono">
                      {data.streakFreezes} indisponível(is)
                    </span>
                  </div>

                  <div className="flex items-center justify-between pt-2 border-t border-zinc-800/80">
                    <span className="text-[10px] text-zinc-400">Custo: 100 XP por escudo</span>
                    <button
                      onClick={handleBuyFreeze}
                      disabled={data.streakFreezes >= data.maxFreezes}
                      className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-40 disabled:hover:bg-emerald-600 text-white text-[11px] font-bold rounded-lg transition-colors flex items-center gap-1"
                    >
                      <Plus className="h-3.5 w-3.5" /> Adquirir (+1)
                    </button>
                  </div>
                </div>

                {/* Recovery Challenge Card */}
                <div className="bg-zinc-900/60 border border-zinc-800 rounded-2xl p-4 flex flex-col justify-between space-y-3">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-2.5">
                      <div className="p-2 bg-amber-500/10 border border-amber-500/20 text-amber-400 rounded-xl">
                        <RotateCcw className="h-5 w-5" />
                      </div>
                      <div>
                        <div className="text-xs font-bold text-white">Resgate de Streak Perdido</div>
                        <div className="text-[10px] text-zinc-400 font-mono">Recupere a chama quebrada</div>
                      </div>
                    </div>
                  </div>

                  <div className="pt-2 border-t border-zinc-800/80 flex items-center justify-between">
                    <span className="text-[10px] text-zinc-400">
                      {data.recoveryAvailable ? 'Desafio ativo hoje!' : 'Disponível após quebra'}
                    </span>
                    <button
                      onClick={handleActivateRecovery}
                      className="px-3 py-1.5 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white text-[11px] font-bold rounded-lg transition-colors flex items-center gap-1 shadow-md shadow-orange-500/20"
                    >
                      <Zap className="h-3.5 w-3.5" /> Fazer Resgate
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* SUGGESTION 2: SECTION 2 - CATEGORY STREAKS */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-bold text-zinc-300 uppercase tracking-wider flex items-center gap-2 font-mono">
                  <Award className="h-4 w-4 text-orange-400" /> Sugestão 2: Streaks Específicos por Módulo
                </h3>
                <span className="text-[10px] text-zinc-500 font-mono">4 Categorias Ativas</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {(Object.values(data.categoryStreaks) as CategoryStreak[]).map((cat) => {
                  const IconComp = categoryIcons[cat.id] || CheckSquare;
                  return (
                    <div
                      key={cat.id}
                      className="bg-zinc-900/60 border border-zinc-800/80 hover:border-zinc-700 rounded-2xl p-4 transition-all flex flex-col justify-between space-y-3"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-3">
                          <div className={`p-2.5 rounded-xl bg-gradient-to-tr ${cat.color} text-white shadow-md`}>
                            <IconComp className="h-5 w-5" />
                          </div>
                          <div>
                            <h4 className="text-xs font-bold text-white">{cat.name}</h4>
                            <p className="text-[10px] text-zinc-400 line-clamp-1">{cat.description}</p>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center justify-between pt-2 border-t border-zinc-800/60">
                        <div className="flex items-center gap-1.5">
                          <Flame className="h-4 w-4 text-orange-500" />
                          <span className="text-sm font-black text-white font-mono">{cat.currentStreak}d</span>
                          <span className="text-[10px] text-zinc-500 font-mono">(Max: {cat.bestStreak}d)</span>
                        </div>

                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => handleToggleCategory(cat.id)}
                            className={`px-2.5 py-1 text-[10px] font-bold rounded-lg border transition-all flex items-center gap-1 ${
                              cat.completedToday
                                ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
                                : 'bg-zinc-800/80 border-zinc-700 text-zinc-400 hover:text-white'
                            }`}
                          >
                            <CheckCircle2 className="h-3 w-3" />
                            {cat.completedToday ? 'Concluído' : 'Marcar Hoje'}
                          </button>

                          {onNavigateToTab && (
                            <button
                              onClick={() => {
                                onClose();
                                if (cat.id === 'checklist') onNavigateToTab('checklist');
                                else if (cat.id === 'habits') onNavigateToTab('rotina');
                                else if (cat.id === 'reading') onNavigateToTab('checklist');
                                else if (cat.id === 'journal') onNavigateToTab('calendario');
                              }}
                              className="p-1.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 hover:text-white rounded-lg transition-colors"
                              title="Abrir Módulo"
                            >
                              <ChevronRight className="h-3.5 w-3.5" />
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

          </div>

          {/* Footer Bar */}
          <div className="p-4 border-t border-zinc-800 bg-zinc-950/80 flex items-center justify-between">
            <span className="text-[11px] text-zinc-500 font-mono">
              ⚡ Ofensiva ativa gera bônus constante de XP diário
            </span>
            <button
              onClick={onClose}
              className="px-5 py-2 bg-orange-500 hover:bg-orange-600 text-white font-bold text-xs rounded-xl shadow-lg shadow-orange-500/20 transition-all"
            >
              Concluído
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

export default StreakHubModal;
