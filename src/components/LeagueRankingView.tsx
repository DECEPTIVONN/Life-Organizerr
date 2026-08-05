// src/components/LeagueRankingView.tsx

import React, { useState, useEffect } from 'react';
import { 
  X, 
  Clock, 
  Sparkles, 
  ChevronUp, 
  ChevronDown, 
  Lock, 
  Info,
  Crown,
  Medal,
  Award,
  Gem,
  Flame,
  Check,
  Trophy,
  TrendingUp
} from 'lucide-react';
import { motion } from 'motion/react';
import { 
  LEAGUES, 
  League, 
  LeagueParticipant, 
  UserLeagueState, 
  loadLeagueState, 
  getLeagueParticipants,
  advanceLeagueCycle,
  saveLeagueState
} from '../utils/leagueStore';

interface LeagueRankingViewProps {
  xpTotal: number;
  level: number;
  userName?: string;
  addXp?: (amount: number, reason: string) => void;
  onClose?: () => void;
}

export const LeagueRankingView: React.FC<LeagueRankingViewProps> = ({
  xpTotal,
  level,
  userName = 'GABRIEL GS',
  addXp,
  onClose
}) => {
  const [activeTab, setActiveTab] = useState<'weekly' | 'monthly'>('weekly');
  const [leagueState, setLeagueState] = useState<UserLeagueState>(loadLeagueState);
  const [showInfo, setShowInfo] = useState(false);
  const [cycleToast, setCycleToast] = useState<{ message: string; type: 'success' | 'warning' | 'info' } | null>(null);

  // Load state and auto-check cycle completion
  useEffect(() => {
    const currentState = loadLeagueState();
    const today = new Date();
    const nowStr = today.toISOString().split('T')[0];

    // Calculate days passed since weekly cycle start
    const weeklyStart = new Date(currentState.weeklyCycleStartDate || nowStr);
    const diffWeeklyMs = today.getTime() - weeklyStart.getTime();
    const diffWeeklyDays = Math.floor(diffWeeklyMs / (1000 * 60 * 60 * 24));

    // Calculate if monthly cycle rolled over
    const monthlyStart = new Date(currentState.monthlyCycleStartDate || nowStr);
    const isNewMonth = today.getMonth() !== monthlyStart.getMonth() || today.getFullYear() !== monthlyStart.getFullYear();

    let updatedState = { ...currentState };
    let toastInfo: { message: string; type: 'success' | 'warning' | 'info' } | null = null;

    // Check Weekly Auto-Transition (Every 7 days)
    if (diffWeeklyDays >= 7) {
      const userWeeklyXP = Math.max(currentState.userWeeklyXP, Math.round((xpTotal % 500) + 40));
      const { newState, result, newLeague } = advanceLeagueCycle(
        updatedState,
        'weekly',
        userWeeklyXP,
        level,
        userName
      );
      updatedState = newState;

      if (result === 'promoted') {
        toastInfo = {
          message: `🎉 CICLO SEMANAL CONCLUÍDO! Você ficou no Top 2 e AVANÇOU para a ${newLeague.divisionName}! (+100 XP)`,
          type: 'success'
        };
        if (addXp) addXp(100, `Promoção na ${newLeague.divisionName}`);
      } else if (result === 'relegated') {
        toastInfo = {
          message: `⚠️ CICLO SEMANAL CONCLUÍDO! Você ficou no Z-2 e retornou para a ${newLeague.divisionName}.`,
          type: 'warning'
        };
      } else {
        toastInfo = {
          message: `🛡️ CICLO SEMANAL CONCLUÍDO! Você manteve a posição na ${newLeague.divisionName}. (+25 XP)`,
          type: 'info'
        };
        if (addXp) addXp(25, `Manutenção na ${newLeague.divisionName}`);
      }
    }

    // Check Monthly Auto-Transition
    if (isNewMonth) {
      const userMonthlyXP = Math.max(currentState.userMonthlyXP, Math.round((xpTotal % 2000) + 150));
      const { newState, result, newLeague } = advanceLeagueCycle(
        updatedState,
        'monthly',
        userMonthlyXP,
        level,
        userName
      );
      updatedState = newState;

      if (!toastInfo) {
        if (result === 'promoted') {
          toastInfo = {
            message: `👑 NOVO MÊS! Você ficou no Top 2 da Liga Mensal e AVANÇOU para a ${newLeague.divisionName}!`,
            type: 'success'
          };
        } else if (result === 'relegated') {
          toastInfo = {
            message: `⚠️ NOVO MÊS! Você caiu para a ${newLeague.divisionName} na Liga Mensal.`,
            type: 'warning'
          };
        }
      }
    }

    // Sync current XP to state if higher
    updatedState.userWeeklyXP = Math.max(updatedState.userWeeklyXP, Math.round((xpTotal % 500) + 40));
    updatedState.userMonthlyXP = Math.max(updatedState.userMonthlyXP, Math.round((xpTotal % 2000) + 150));
    saveLeagueState(updatedState);
    setLeagueState(updatedState);

    if (toastInfo) {
      setCycleToast(toastInfo);
      setTimeout(() => setCycleToast(null), 8000);
    }
  }, [xpTotal, level, userName, addXp]);

  const isWeekly = activeTab === 'weekly';
  const currentLeagueIndex = isWeekly ? leagueState.weeklyLeagueIndex : leagueState.monthlyLeagueIndex;
  const currentLeague = LEAGUES[currentLeagueIndex] || LEAGUES[0];

  // User XP for current cycle
  const userXP = isWeekly 
    ? Math.max(leagueState.userWeeklyXP, Math.round((xpTotal % 500) + 40))
    : Math.max(leagueState.userMonthlyXP, Math.round((xpTotal % 2000) + 150));

  // Get current participants
  const participants = getLeagueParticipants(activeTab, currentLeagueIndex, userXP, level, userName);

  // Time remaining calculation
  const getDaysRemaining = () => {
    const today = new Date();
    if (isWeekly) {
      const dayOfWeek = today.getDay(); // 0 = Sun
      const daysLeft = dayOfWeek === 0 ? 1 : 7 - dayOfWeek;
      return `${daysLeft} DIAS RESTANTES`;
    } else {
      const lastDay = new Date(today.getFullYear(), today.getMonth() + 1, 0).getDate();
      const daysLeft = lastDay - today.getDate();
      return `${daysLeft} DIAS RESTANTES`;
    }
  };

  // Helper to render League Icon dynamically inside roadmap nodes
  const renderLeagueIcon = (iconType: League['badgeIcon'], className = 'h-5 w-5') => {
    switch (iconType) {
      case 'trophy': return <Trophy className={className} />;
      case 'medal': return <Medal className={className} />;
      case 'award': return <Award className={className} />;
      case 'gem': return <Gem className={className} />;
      case 'flame': return <Flame className={className} />;
      case 'crown': return <Crown className={className} />;
      default: return <Trophy className={className} />;
    }
  };

  return (
    <div className="w-full min-h-[calc(100vh-60px)] bg-[#07050e] text-white p-2 sm:p-4 lg:p-6 custom-scrollbar">
      <div className="w-full max-w-full space-y-4 sm:space-y-5">
        
        {/* 1. Full-Width Top Navigation Header */}
        <div className="w-full bg-[#0c0a15] border border-zinc-800/80 rounded-2xl p-2 sm:p-2.5 flex items-center justify-between gap-3 shadow-lg">
          <div className="flex-1 bg-zinc-950/80 p-1 rounded-xl border border-zinc-800/80 flex items-center gap-1">
            <button
              onClick={() => setActiveTab('weekly')}
              className={`flex-1 py-2.5 px-4 rounded-lg text-xs font-black font-mono uppercase tracking-wider transition-all flex items-center justify-center cursor-pointer ${
                isWeekly
                  ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-md shadow-purple-500/20 border border-purple-400/30'
                  : 'text-zinc-400 hover:text-white hover:bg-zinc-900/60'
              }`}
            >
              <span>LIGA SEMANAL</span>
            </button>

            <button
              onClick={() => setActiveTab('monthly')}
              className={`flex-1 py-2.5 px-4 rounded-lg text-xs font-black font-mono uppercase tracking-wider transition-all flex items-center justify-center cursor-pointer ${
                !isWeekly
                  ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-md shadow-purple-500/20 border border-purple-400/30'
                  : 'text-zinc-400 hover:text-white hover:bg-zinc-900/60'
              }`}
            >
              <span>LIGA MENSAL</span>
            </button>
          </div>

          {onClose && (
            <button
              onClick={onClose}
              className="p-2.5 rounded-xl bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-zinc-400 hover:text-white transition-all cursor-pointer shrink-0 shadow-md active:scale-95"
              title="Fechar e retornar"
            >
              <X className="h-5 w-5" />
            </button>
          )}
        </div>

        {/* Cycle Toast */}
        {cycleToast && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className={`p-4 rounded-2xl border text-xs sm:text-sm font-bold flex items-center gap-3 shadow-lg ${
              cycleToast.type === 'success'
                ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
                : cycleToast.type === 'warning'
                ? 'bg-rose-500/10 border-rose-500/30 text-rose-300'
                : 'bg-blue-500/10 border-blue-500/30 text-blue-300'
            }`}
          >
            <Sparkles className="h-5 w-5 shrink-0" />
            <span>{cycleToast.message}</span>
          </motion.div>
        )}

        {/* 2. Full-Width Hero Division Banner (No icon in front of division name) */}
        <div className="relative w-full p-5 sm:p-7 rounded-2xl bg-gradient-to-r from-[#100d20] via-[#0c0a16] to-[#120f24] border border-zinc-800/80 shadow-xl overflow-hidden flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div 
            className="absolute inset-0 opacity-15 pointer-events-none transition-all duration-500" 
            style={{ backgroundColor: currentLeague.glowColor }} 
          />

          <div className="relative z-10 flex items-center gap-3.5">
            <div>
              <h2 className="text-xl sm:text-2xl lg:text-3xl font-black uppercase font-serif tracking-wide text-white">
                {currentLeague.divisionName}
              </h2>
              <p className="text-[11px] text-purple-400 font-extrabold font-mono tracking-widest uppercase mt-0.5">
                {isWeekly ? 'LIGA SEMANAL ATIVA' : 'LIGA MENSAL ATIVA'}
              </p>
            </div>
          </div>

          <div className="relative z-10 px-4 py-2 rounded-xl bg-zinc-950/90 border border-zinc-800 text-xs font-black font-mono text-zinc-300 flex items-center gap-2 shadow-inner">
            <Clock className="h-4 w-4 text-purple-400" />
            <span>{getDaysRemaining()}</span>
          </div>
        </div>

        {/* 3. Full-Width Stepper Roadmap */}
        <div className="w-full p-6 sm:p-8 rounded-2xl bg-[#0c0a15] border border-zinc-800/80 shadow-xl relative overflow-hidden">
          <div className="relative flex items-center justify-between w-full max-w-5xl mx-auto px-4 sm:px-8">
            
            {/* Connecting line behind icons */}
            <div className="absolute top-1/2 left-8 right-8 h-0.5 bg-zinc-800/90 -translate-y-1/2 -z-0" />

            {LEAGUES.map((l, index) => {
              const isCurrent = index === currentLeagueIndex;
              const isUnlocked = index <= currentLeagueIndex;

              return (
                <div key={l.id} className="relative z-10 flex flex-col items-center group">
                  <div className="relative mb-2">
                    <div
                      className={`w-12 h-12 rounded-full flex items-center justify-center transition-all duration-300 ${
                        isCurrent
                          ? 'bg-[#1e1738] border-2 border-purple-400 shadow-[0_0_20px_rgba(168,85,247,0.5)] scale-110 ring-4 ring-purple-500/20 text-purple-300'
                          : isUnlocked
                          ? 'bg-zinc-900 border border-emerald-500/50 text-emerald-400'
                          : 'bg-zinc-950 border border-zinc-800 text-zinc-600 opacity-60'
                      }`}
                    >
                      {isUnlocked && !isCurrent ? (
                        <div className="relative">
                          {renderLeagueIcon(l.badgeIcon, 'h-5 w-5 text-emerald-400')}
                          <div className="absolute -bottom-1 -right-1 bg-emerald-500 text-black p-0.5 rounded-full">
                            <Check className="h-2.5 w-2.5 stroke-[3]" />
                          </div>
                        </div>
                      ) : (
                        renderLeagueIcon(l.badgeIcon, `h-5 w-5 ${isCurrent ? l.color : 'text-zinc-600'}`)
                      )}
                    </div>

                    {!isUnlocked && (
                      <div className="absolute -bottom-1 -right-1 bg-zinc-900 p-1 rounded-full border border-zinc-800 shadow">
                        <Lock className="h-3 w-3 text-zinc-500" />
                      </div>
                    )}
                  </div>

                  <span
                    className={`text-[11px] font-black uppercase font-mono tracking-wider ${
                      isCurrent ? l.color : isUnlocked ? 'text-zinc-300' : 'text-zinc-600'
                    }`}
                  >
                    {l.name}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* 4. Full-Width Leaderboard Cards (No icons in front of names) */}
        <div className="w-full space-y-2.5">
          {participants.map((participant, index) => {
            const rank = participant.rank || index + 1;

            return (
              <React.Fragment key={participant.id}>
                
                {/* Promotion Zone Divider Line */}
                {rank === 3 && (
                  <div className="py-2.5 my-3 flex items-center justify-center gap-3 text-xs font-black font-mono text-emerald-400 uppercase tracking-widest border-y border-emerald-500/20 bg-emerald-500/5 rounded-2xl">
                    <ChevronUp className="h-4 w-4 text-emerald-400 animate-bounce" />
                    <span>↑ ZONA DE PROMOÇÃO (TOP 3)</span>
                  </div>
                )}

                {/* Relegation Zone Divider Line */}
                {rank === 4 && (
                  <div className="py-2.5 my-3 flex items-center justify-center gap-3 text-xs font-black font-mono text-rose-400 uppercase tracking-widest border-y border-rose-500/20 bg-rose-500/5 rounded-2xl">
                    <ChevronDown className="h-4 w-4 text-rose-400 animate-bounce" />
                    <span>↓ ZONA DE REBAIXAMENTO</span>
                  </div>
                )}

                {/* Full-width Participant Card */}
                <motion.div
                  layout
                  initial={{ opacity: 0, y: 5 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`w-full p-4 sm:p-5 rounded-2xl border transition-all flex items-center justify-between gap-4 shadow-md ${
                    participant.isUser
                      ? 'bg-[#18122c] border-purple-500/60 shadow-[0_0_25px_rgba(168,85,247,0.2)] ring-1 ring-purple-500/40'
                      : 'bg-[#0c0a15] border-zinc-800/80 hover:border-zinc-700/80'
                  }`}
                >
                  <div className="flex items-center gap-3.5 min-w-0">
                    
                    {/* Rank Circle Badge */}
                    {rank === 1 ? (
                      <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-[#facc15] text-slate-950 font-black text-sm flex items-center justify-center shrink-0 shadow-[0_0_12px_rgba(250,204,21,0.5)]">
                        1
                      </div>
                    ) : rank === 2 ? (
                      <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-[#e2e8f0] text-slate-900 font-black text-sm flex items-center justify-center shrink-0 shadow-[0_0_10px_rgba(226,232,240,0.3)]">
                        2
                      </div>
                    ) : rank === 3 ? (
                      <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-[#f97316] text-slate-950 font-black text-sm flex items-center justify-center shrink-0 shadow-[0_0_10px_rgba(249,115,22,0.4)]">
                        3
                      </div>
                    ) : (
                      <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-zinc-900 text-zinc-300 font-bold text-sm border border-zinc-700 flex items-center justify-center shrink-0">
                        {rank}
                      </div>
                    )}

                    {/* Avatar Circle with initials */}
                    <div className="w-10 h-10 rounded-full bg-purple-600/20 border border-purple-500/40 text-purple-300 flex items-center justify-center shrink-0 shadow-inner">
                      <span className="text-sm font-black font-mono uppercase">
                        {participant.name.substring(0, 2)}
                      </span>
                    </div>

                    {/* Clean Name & Subtitle without icons */}
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <h4 className="text-sm sm:text-base font-black text-white truncate font-sans">
                          {participant.name}
                        </h4>
                        {participant.countryFlag && (
                          <span className="text-xs shrink-0 font-mono text-zinc-500 font-bold uppercase">
                            {participant.countryFlag}
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-zinc-400 font-mono truncate mt-0.5 font-bold uppercase">
                        {participant.subtitle}
                      </p>
                    </div>
                  </div>

                  {/* XP Score Badge */}
                  <div className="text-right shrink-0">
                    <span className="text-sm sm:text-base font-black font-mono text-purple-300 px-4 py-2 rounded-xl bg-zinc-950/90 border border-zinc-800/80 shadow-inner">
                      {participant.xp} XP
                    </span>
                  </div>
                </motion.div>
              </React.Fragment>
            );
          })}
        </div>

        {/* 5. Bottom Controls & Info Section */}
        <div className="w-full bg-[#0c0a15] border border-zinc-800/80 rounded-2xl p-4 sm:p-5 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2 text-xs font-bold text-zinc-400">
            <TrendingUp className="h-4 w-4 text-emerald-400" />
            <span>Classificação atualizada em tempo real conforme você cumpre tarefas</span>
          </div>

          <button
            onClick={() => setShowInfo(!showInfo)}
            className="text-xs font-bold text-zinc-400 hover:text-purple-300 transition-colors flex items-center gap-2 cursor-pointer"
          >
            <Info className="h-4 w-4 text-purple-400" />
            <span>{showInfo ? 'Ocultar Explicação dos Oponentes' : 'Entenda quem são seus Oponentes e Regras'}</span>
          </button>
        </div>

        {/* Explanatory Modal/Accordion */}
        {showInfo && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            className="w-full p-6 rounded-2xl bg-[#0c0a15] border border-zinc-800/80 text-xs text-zinc-300 space-y-3 leading-relaxed font-sans"
          >
            <h4 className="text-sm font-black text-white font-mono uppercase tracking-wider text-purple-300">
              REGRAS DAS LIGAS MBC & OPONENTES
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
              <div className="space-y-2">
                <p><strong className="text-emerald-400">🟢 Promoção (Top 3):</strong> Os 3 primeiros colocados avançam para a próxima divisão ao término do ciclo.</p>
                <p><strong className="text-amber-400">🟡 Manutenção:</strong> Permanece na divisão atual.</p>
                <p><strong className="text-rose-400">🔴 Rebaixamento (Últimos colocados):</strong> Caem para a divisão anterior.</p>
              </div>
              <div className="space-y-1.5 bg-zinc-950/80 p-3 rounded-xl border border-zinc-800/80">
                <strong className="text-purple-300 font-mono uppercase">COMO O XP É GERADO:</strong>
                <p className="text-[11px] text-zinc-400">
                  - <strong>Seu XP:</strong> É calculated em tempo real com base no cumprimento das suas tarefas e hábitos diários.<br/>
                  - <strong>Prime:</strong> Representa sua melhor versão teórica (se você fizesse ainda mais do que o previsto).<br/>
                  - <strong>Alfredo:</strong> Cumpre 100% de todas as tarefas.<br/>
                  - <strong>Alberto:</strong> Disciplinado na maioria dos dias, buscando evolução.<br/>
                  - <strong>Beto:</strong> Indisciplinado, a versão que você precisa superar.
                </p>
              </div>
            </div>
          </motion.div>
        )}

      </div>
    </div>
  );
};
