import React, { useState, useEffect, useRef } from 'react';
import { 
  Bell, 
  Clock, 
  Timer, 
  Plus, 
  Play, 
  Pause, 
  RotateCcw, 
  Check, 
  Trash2, 
  Volume2, 
  VolumeX, 
  Sparkles, 
  Zap, 
  Tag, 
  AlertCircle,
  X,
  CheckCircle2,
  Calendar,
  Layers,
  ChevronRight,
  Flame,
  BellRing
} from 'lucide-react';
import { QuickReminder } from '../types';

interface RemindersViewProps {
  reminders: QuickReminder[];
  setReminders: React.Dispatch<React.SetStateAction<QuickReminder[]>>;
  addXp: (amount: number) => void;
  openNewModalDirectly?: boolean;
  onModalClosed?: () => void;
}

// Audio synth chime generator for browser alert
export const playReminderChime = () => {
  try {
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContextClass) return;
    const ctx = new AudioContextClass();
    
    // Play a sequence of 3 harmonious tones (A5, C#6, E6)
    const tones = [880, 1108.73, 1318.51];
    tones.forEach((freq, idx) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      
      const startTime = ctx.currentTime + idx * 0.15;
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, startTime);
      
      gain.gain.setValueAtTime(0.25, startTime);
      gain.gain.exponentialRampToValueAtTime(0.001, startTime + 0.4);
      
      osc.connect(gain);
      gain.connect(ctx.destination);
      
      osc.start(startTime);
      osc.stop(startTime + 0.4);
    });
  } catch (err) {
    console.error('Failed to play chime:', err);
  }
};

export default function RemindersView({
  reminders,
  setReminders,
  addXp,
  openNewModalDirectly = false,
  onModalClosed
}: RemindersViewProps) {
  // Navigation & Filter states
  const [filterMode, setFilterMode] = useState<'all' | 'active' | 'completed'>('active');
  const [isModalOpen, setIsModalOpen] = useState(openNewModalDirectly);

  // Form states
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [mode, setMode] = useState<'timer' | 'cronometer'>(() => {
    const saved = localStorage.getItem('mbc_reminder_initial_mode');
    if (saved === 'cronometer' || saved === 'timer') return saved;
    return 'timer';
  });

  useEffect(() => {
    const syncInitialMode = () => {
      const saved = localStorage.getItem('mbc_reminder_initial_mode');
      if (saved === 'cronometer' || saved === 'timer') {
        setMode(saved);
      }
    };
    syncInitialMode();
    window.addEventListener('storage', syncInitialMode);
    return () => window.removeEventListener('storage', syncInitialMode);
  }, []);
  
  // Timer mode inputs
  const [timerMinutes, setTimerMinutes] = useState<number>(5);
  const [timerHours, setTimerHours] = useState<number>(0);
  const [timerSeconds, setTimerSeconds] = useState<number>(0);
  
  // Cronometer / Schedule mode inputs
  const [scheduledDate, setScheduledDate] = useState<string>(() => {
    const today = new Date();
    return today.toISOString().split('T')[0];
  });
  const [scheduledTime, setScheduledTime] = useState<string>('12:00');
  const [recurrence, setRecurrence] = useState<'none' | 'daily' | 'workdays' | 'weekly'>('none');

  // Common inputs
  const [category, setCategory] = useState<'Foco' | 'Saúde' | 'Trabalho' | 'Estudo' | 'Pessoal'>('Foco');
  const [priority, setPriority] = useState<'baixa' | 'media' | 'alta'>('media');
  const [soundEnabled, setSoundEnabled] = useState(true);

  // Triggered alarm popup state
  const [activeAlarm, setActiveAlarm] = useState<QuickReminder | null>(null);

  // Open modal if prop changes
  useEffect(() => {
    if (openNewModalDirectly) {
      setIsModalOpen(true);
    }
  }, [openNewModalDirectly]);

  // Request browser notification permissions on mount
  useEffect(() => {
    if (typeof Notification !== 'undefined' && Notification.permission === 'default') {
      Notification.requestPermission();
    }
  }, []);

  // Tick interval for updating active timers & checking trigger conditions
  const [, setTick] = useState(0);
  useEffect(() => {
    const interval = setInterval(() => {
      setTick(prev => prev + 1);
      
      const now = Date.now();
      const todayStr = new Date().toISOString().split('T')[0];
      const currentHHMM = new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });

      setReminders(prevReminders => {
        let hasChanges = false;
        const updated = prevReminders.map(r => {
          if (r.status !== 'active' || r.paused) return r;

          // Check timer or cronometer mode completion via targetTimestamp
          if ((r.mode === 'timer' || r.mode === 'cronometer') && r.targetTimestamp) {
            if (now >= r.targetTimestamp) {
              hasChanges = true;
              // Trigger alarm
              if (r.soundEnabled) playReminderChime();
              if (typeof Notification !== 'undefined' && Notification.permission === 'granted') {
                new Notification(`⏰ Lembrete: ${r.title}`, {
                  body: r.description || `Tempo atingido! ${r.category ? `[${r.category}]` : ''}`,
                  icon: '/icon.png'
                });
              }
              setActiveAlarm(r);
              return {
                ...r,
                status: 'triggered' as const,
                triggeredAt: new Date().toLocaleTimeString('pt-BR')
              };
            }
          }

          // Check scheduled cronometer / schedule mode completion
          if (r.mode === 'cronometer' && r.scheduledDate && r.scheduledTime) {
            const fullScheduledTs = new Date(`${r.scheduledDate}T${r.scheduledTime}:00`).getTime();
            if (now >= fullScheduledTs) {
              hasChanges = true;
              if (r.soundEnabled) playReminderChime();
              if (typeof Notification !== 'undefined' && Notification.permission === 'granted') {
                new Notification(`⏰ Horário Chegado: ${r.title}`, {
                  body: r.description || `Hora agendada (${r.scheduledTime}) atingida!`,
                  icon: '/icon.png'
                });
              }
              setActiveAlarm(r);
              return {
                ...r,
                status: 'triggered' as const,
                triggeredAt: new Date().toLocaleTimeString('pt-BR')
              };
            }
          }

          return r;
        });

        return hasChanges ? updated : prevReminders;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [setReminders]);

  // Create new Reminder
  const handleCreateReminder = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    const nowMs = Date.now();
    let totalSecs = 0;
    let targetTs: number | undefined = undefined;

    if (mode === 'timer') {
      totalSecs = (timerHours * 3600) + (timerMinutes * 60) + timerSeconds;
      if (totalSecs <= 0) totalSecs = 300; // default 5 min if 0
      targetTs = nowMs + (totalSecs * 1000);
    }

    const newReminder: QuickReminder = {
      id: 'rem-' + Math.random().toString(36).substring(2, 9),
      title: title.trim(),
      description: description.trim() || undefined,
      mode,
      durationSeconds: mode === 'timer' ? totalSecs : undefined,
      targetTimestamp: targetTs,
      paused: false,
      scheduledDate: mode === 'cronometer' ? scheduledDate : undefined,
      scheduledTime: mode === 'cronometer' ? scheduledTime : undefined,
      recurrence: mode === 'cronometer' ? recurrence : undefined,
      category,
      priority,
      soundEnabled,
      status: 'active',
      createdAt: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
    };

    setReminders(prev => [newReminder, ...prev]);
    addXp(15);

    // Immediate Web Browser Notification on Creation
    if (typeof Notification !== 'undefined') {
      if (Notification.permission === 'granted') {
        const modeLabel = mode === 'timer' ? '⏱️ Timer Iniciado' : mode === 'cronometer' ? '⏰ Alerta de Cronômetro' : '🔔 Lembrete Criado';
        const formattedTarget = targetTs ? new Date(targetTs).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }) : scheduledTime || 'Ativo';
        new Notification(`${modeLabel}: ${title.trim()}`, {
          body: mode === 'timer'
            ? `Contagem regressiva iniciada. Notificação agendada para as ${formattedTarget}.`
            : `Lembrete/alerta ativo em segundo plano (${formattedTarget}).`,
          icon: '/icon.png'
        });
      } else if (Notification.permission !== 'denied') {
        Notification.requestPermission();
      }
    }

    // Reset form
    setTitle('');
    setDescription('');
    setTimerMinutes(5);
    setTimerHours(0);
    setTimerSeconds(0);
    setIsModalOpen(false);
    if (onModalClosed) onModalClosed();
  };

  // Preset timer loader
  const handleApplyPresetMinutes = (mins: number) => {
    setTimerHours(Math.floor(mins / 60));
    setTimerMinutes(mins % 60);
    setTimerSeconds(0);
  };

  // Pause / Resume Timer
  const handleTogglePause = (id: string) => {
    const nowMs = Date.now();
    setReminders(prev => prev.map(r => {
      if (r.id !== id || r.mode !== 'timer') return r;

      if (!r.paused && r.targetTimestamp) {
        // Pausing: calculate remaining seconds
        const remSecs = Math.max(0, Math.ceil((r.targetTimestamp - nowMs) / 1000));
        return {
          ...r,
          paused: true,
          remainingSecondsWhenPaused: remSecs
        };
      } else if (r.paused && r.remainingSecondsWhenPaused !== undefined) {
        // Resuming: recalculate target timestamp
        return {
          ...r,
          paused: false,
          targetTimestamp: nowMs + (r.remainingSecondsWhenPaused * 1000),
          remainingSecondsWhenPaused: undefined
        };
      }
      return r;
    }));
  };

  // Add 5 minutes (+300s) to timer
  const handleAddFiveMinutes = (id: string) => {
    setReminders(prev => prev.map(r => {
      if (r.id !== id || r.mode !== 'timer') return r;
      if (r.paused && r.remainingSecondsWhenPaused !== undefined) {
        return { ...r, remainingSecondsWhenPaused: r.remainingSecondsWhenPaused + 300 };
      }
      if (r.targetTimestamp) {
        return { ...r, targetTimestamp: r.targetTimestamp + 300000 };
      }
      return r;
    }));
  };

  // Reset Timer to original duration
  const handleResetTimer = (id: string) => {
    const nowMs = Date.now();
    setReminders(prev => prev.map(r => {
      if (r.id !== id || r.mode !== 'timer' || !r.durationSeconds) return r;
      return {
        ...r,
        status: 'active',
        paused: false,
        remainingSecondsWhenPaused: undefined,
        targetTimestamp: nowMs + (r.durationSeconds * 1000)
      };
    }));
  };

  // Mark as completed
  const handleCompleteReminder = (id: string) => {
    setReminders(prev => prev.map(r => r.id === id ? { ...r, status: 'completed' as const } : r));
    addXp(10);
    if (activeAlarm?.id === id) setActiveAlarm(null);
  };

  // Delete reminder
  const handleDeleteReminder = (id: string) => {
    setReminders(prev => prev.filter(r => r.id !== id));
    if (activeAlarm?.id === id) setActiveAlarm(null);
  };

  // Snooze alarm (+5 min)
  const handleSnoozeAlarm = (id: string) => {
    const nowMs = Date.now();
    setReminders(prev => prev.map(r => {
      if (r.id !== id) return r;
      return {
        ...r,
        status: 'active',
        paused: false,
        remainingSecondsWhenPaused: undefined,
        targetTimestamp: nowMs + 300000 // +5 minutes
      };
    }));
    setActiveAlarm(null);
  };

  // Quick 1-click timer creation helper
  const handleQuickTimer = (titleName: string, mins: number) => {
    const nowMs = Date.now();
    const durationSecs = mins * 60;
    const newRem: QuickReminder = {
      id: 'rem-' + Math.random().toString(36).substring(2, 9),
      title: titleName,
      mode: 'timer',
      durationSeconds: durationSecs,
      targetTimestamp: nowMs + (durationSecs * 1000),
      paused: false,
      category: 'Foco',
      priority: 'media',
      soundEnabled: true,
      status: 'active',
      createdAt: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
    };
    setReminders(prev => [newRem, ...prev]);
    addXp(15);
  };

  // Helper to format remaining time
  const getTimerRemainingText = (r: QuickReminder) => {
    if (r.status === 'completed') return 'Concluído';
    if (r.status === 'triggered') return '⏰ ALARME DISPARADO!';
    
    if (r.targetTimestamp || r.mode === 'timer') {
      let secsLeft = 0;
      if (r.paused && r.remainingSecondsWhenPaused !== undefined) {
        secsLeft = r.remainingSecondsWhenPaused;
      } else if (r.targetTimestamp) {
        secsLeft = Math.max(0, Math.ceil((r.targetTimestamp - Date.now()) / 1000));
      }

      const h = Math.floor(secsLeft / 3600);
      const m = Math.floor((secsLeft % 3600) / 60);
      const s = secsLeft % 60;

      if (h > 0) {
        return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
      }
      return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
    } else {
      if (!r.scheduledDate || !r.scheduledTime) return 'Horário definido';
      const target = new Date(`${r.scheduledDate}T${r.scheduledTime}:00`).getTime();
      const diffMs = target - Date.now();
      if (diffMs <= 0) return 'Horário atingido';

      const diffMins = Math.floor(diffMs / 60000);
      const diffHours = Math.floor(diffMins / 60);
      const remMins = diffMins % 60;

      if (diffHours > 24) {
        return `Em ${Math.floor(diffHours / 24)} dias (${r.scheduledTime})`;
      } else if (diffHours > 0) {
        return `Faltam ${diffHours}h ${remMins}m (${r.scheduledTime})`;
      } else {
        return `Faltam ${remMins} min (${r.scheduledTime})`;
      }
    }
  };

  // Filtered list
  const filteredReminders = reminders.filter(r => {
    if (filterMode === 'active') return r.status === 'active' || r.status === 'triggered';
    if (filterMode === 'completed') return r.status === 'completed';
    return true;
  });

  const activeCount = reminders.filter(r => r.status === 'active' || r.status === 'triggered').length;
  const completedCount = reminders.filter(r => r.status === 'completed').length;

  return (
    <div className="max-w-6xl mx-auto space-y-6 pb-24 pt-2 px-3 sm:px-6">
      
      {/* 1. TOP HERO HEADER */}
      <div className="bg-gradient-to-r from-zinc-900/90 via-zinc-900/60 to-black/80 border border-zinc-800/80 rounded-3xl p-5 sm:p-7 relative overflow-hidden backdrop-blur-md shadow-2xl">
        <div className="absolute top-0 right-0 w-80 h-80 bg-orange-500/10 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20" />
        <div className="absolute bottom-0 left-1/3 w-60 h-60 bg-amber-500/5 rounded-full blur-2xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-orange-500/10 border border-orange-500/20 text-orange-400 text-xs font-mono font-extrabold uppercase tracking-widest">
              <Bell className="h-3.5 w-3.5 text-orange-500 animate-pulse" />
              <span>Notificações & Foco</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight flex items-center gap-3">
              Central de Lembretes Rápido
            </h1>
            <p className="text-xs sm:text-sm text-zinc-400 max-w-xl">
              Configure alertas por <strong className="text-orange-400 font-semibold">Timer (contagem regressiva)</strong> ou <strong className="text-amber-400 font-semibold">Cronômetro / Horário Programado</strong>. Receba sinal sonoro e notificações no navegador.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={() => setIsModalOpen(true)}
              className="px-5 py-3 rounded-2xl bg-gradient-to-r from-orange-600 to-amber-500 text-white font-extrabold text-xs uppercase tracking-wider shadow-[0_0_20px_rgba(249,115,22,0.35)] hover:shadow-[0_0_25px_rgba(249,115,22,0.5)] hover:scale-[1.02] active:scale-95 transition-all flex items-center gap-2.5 cursor-pointer"
            >
              <Plus className="h-4 w-4" />
              <span>Novo Lembrete</span>
            </button>
          </div>
        </div>

        {/* Quick Presets Bar */}
        <div className="mt-6 pt-5 border-t border-zinc-800/80 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-xs text-zinc-400 font-mono font-bold uppercase tracking-wider">
            <Zap className="h-3.5 w-3.5 text-amber-400" />
            <span>Timers Rápido 1-Clique:</span>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {[
              { label: '+5 min Água', mins: 5, icon: '💧' },
              { label: '+15 min Foco', mins: 15, icon: '⚡' },
              { label: '+25 min Pomodoro', mins: 25, icon: '🎯' },
              { label: '+45 min Estudo', mins: 45, icon: '📖' },
              { label: '+1h Reunião', mins: 60, icon: '💼' }
            ].map((p, idx) => (
              <button
                key={idx}
                onClick={() => handleQuickTimer(p.label, p.mins)}
                className="px-3 py-1.5 rounded-xl bg-zinc-800/60 hover:bg-zinc-800 border border-zinc-700/50 hover:border-orange-500/50 text-zinc-300 hover:text-white text-xs font-semibold transition-all flex items-center gap-1.5 active:scale-95 cursor-pointer"
              >
                <span>{p.icon}</span>
                <span>{p.label}</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* 2. STATS & FILTER TABS */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-zinc-900/60 border border-zinc-800/70 rounded-2xl p-3 backdrop-blur-md">
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <button
            onClick={() => setFilterMode('active')}
            className={`flex-1 sm:flex-none px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 ${
              filterMode === 'active'
                ? 'bg-orange-500 text-white shadow-lg shadow-orange-500/20'
                : 'text-zinc-400 hover:text-white hover:bg-zinc-800/50'
            }`}
          >
            <Clock className="h-3.5 w-3.5" />
            <span>Ativos & Foco ({activeCount})</span>
          </button>

          <button
            onClick={() => setFilterMode('completed')}
            className={`flex-1 sm:flex-none px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 ${
              filterMode === 'completed'
                ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-500/20'
                : 'text-zinc-400 hover:text-white hover:bg-zinc-800/50'
            }`}
          >
            <CheckCircle2 className="h-3.5 w-3.5" />
            <span>Concluídos ({completedCount})</span>
          </button>

          <button
            onClick={() => setFilterMode('all')}
            className={`flex-1 sm:flex-none px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 ${
              filterMode === 'all'
                ? 'bg-zinc-800 text-white border border-zinc-700'
                : 'text-zinc-400 hover:text-white hover:bg-zinc-800/50'
            }`}
          >
            <Layers className="h-3.5 w-3.5" />
            <span>Todos ({reminders.length})</span>
          </button>
        </div>

        <div className="text-xs text-zinc-400 font-mono flex items-center gap-3">
          <button
            type="button"
            onClick={playReminderChime}
            className="flex items-center gap-1.5 text-amber-400 hover:text-amber-300 font-bold bg-amber-500/10 hover:bg-amber-500/20 px-2.5 py-1 rounded-lg border border-amber-500/20 transition-all cursor-pointer"
            title="Testar sinal sonoro de notificação"
          >
            <Volume2 className="h-3.5 w-3.5 text-amber-400 animate-pulse" />
            <span>Testar Som</span>
          </button>
          <span className="text-zinc-600">|</span>
          <span className="flex items-center gap-1 text-emerald-400 font-bold">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            Tempo Real Ativo
          </span>
        </div>
      </div>

      {/* 2.5 PREMIUM LIVE NOTIFICATION & TRACKING HUD CARD (When timers are running) */}
      {reminders.some(r => r.status === 'active') && (
        <div className="bg-gradient-to-br from-zinc-950 via-zinc-900 to-black border-2 border-orange-500/40 rounded-3xl p-5 shadow-[0_0_35px_rgba(249,115,22,0.15)] relative overflow-hidden space-y-4">
          <div className="absolute top-0 right-0 w-64 h-64 bg-orange-500/10 rounded-full blur-3xl pointer-events-none" />
          
          {/* Header */}
          <div className="flex items-center justify-between border-b border-zinc-800/80 pb-3">
            <div className="flex items-center gap-2.5">
              <div className="relative">
                <span className="w-3 h-3 rounded-full bg-orange-500 block animate-ping absolute inset-0 opacity-75" />
                <span className="w-3 h-3 rounded-full bg-orange-500 block relative" />
              </div>
              <h2 className="text-xs font-mono font-black text-orange-400 uppercase tracking-widest flex items-center gap-2">
                <Timer className="h-4 w-4" />
                Acompanhamento de Tempo em Tempo Real
              </h2>
            </div>
            <span className="text-[10px] text-zinc-400 font-mono">
              {reminders.filter(r => r.status === 'active').length} Lembretes Ativos
            </span>
          </div>

          {/* Active Timers Carousel / List */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {reminders.filter(r => r.status === 'active').map(r => {
              const remainingText = getTimerRemainingText(r);
              let progressPct = 100;
              let secsLeft = 0;
              if (r.mode === 'timer' && r.durationSeconds && r.durationSeconds > 0) {
                if (r.paused && r.remainingSecondsWhenPaused !== undefined) {
                  secsLeft = r.remainingSecondsWhenPaused;
                } else if (r.targetTimestamp) {
                  secsLeft = Math.max(0, Math.ceil((r.targetTimestamp - Date.now()) / 1000));
                }
                progressPct = Math.min(100, Math.max(0, (secsLeft / r.durationSeconds) * 100));
              }

              return (
                <div 
                  key={r.id}
                  className="bg-zinc-900/90 border border-zinc-800 rounded-2xl p-4 flex flex-col justify-between space-y-3 relative group hover:border-orange-500/60 transition-all shadow-md"
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs font-extrabold text-white truncate max-w-[180px]">
                      {r.title}
                    </span>
                    <span className={`text-[9px] font-mono font-bold px-2 py-0.5 rounded-full uppercase ${
                      r.paused 
                        ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30' 
                        : 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                    }`}>
                      {r.paused ? 'Pausado' : 'Em Execução'}
                    </span>
                  </div>

                  {/* Circular & Linear Progress Bar with Clock */}
                  <div className="flex items-center gap-3 bg-black/60 p-3 rounded-xl border border-zinc-800/80">
                    {/* Radial Ring */}
                    <div className="relative w-11 h-11 flex-shrink-0 flex items-center justify-center">
                      <svg className="w-full h-full -rotate-90">
                        <circle
                          cx="22"
                          cy="22"
                          r="18"
                          stroke="rgba(255,255,255,0.1)"
                          strokeWidth="3.5"
                          fill="none"
                        />
                        <circle
                          cx="22"
                          cy="22"
                          r="18"
                          stroke={r.paused ? "#f59e0b" : "var(--color-orange-500, #f97316)"}
                          strokeWidth="3.5"
                          fill="none"
                          strokeDasharray="113"
                          strokeDashoffset={113 - (113 * progressPct) / 100}
                          strokeLinecap="round"
                          className="transition-all duration-1000"
                        />
                      </svg>
                      <Timer className={`h-4 w-4 absolute ${!r.paused ? 'text-orange-400 animate-pulse' : 'text-amber-400'}`} />
                    </div>

                    <div className="space-y-0.5">
                      <div className="text-lg font-mono font-black text-white tracking-wider">
                        {remainingText}
                      </div>
                      <div className="text-[10px] text-zinc-400 font-mono">
                        {r.mode === 'timer' ? 'Contagem regressiva' : `Notificação ${r.scheduledTime || ''}`}
                      </div>
                    </div>
                  </div>

                  {/* Actions Bar */}
                  <div className="flex items-center justify-between gap-1.5 pt-1">
                    {r.mode === 'timer' && (
                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => handleTogglePause(r.id)}
                          className="p-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-white transition-colors cursor-pointer"
                          title={r.paused ? 'Continuar' : 'Pausar'}
                        >
                          {r.paused ? <Play className="h-3.5 w-3.5 text-emerald-400" /> : <Pause className="h-3.5 w-3.5 text-amber-400" />}
                        </button>

                        <button
                          type="button"
                          onClick={() => handleAddFiveMinutes(r.id)}
                          className="px-2 py-1 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-orange-400 text-[10px] font-mono font-bold transition-colors cursor-pointer"
                          title="+5 Minutos"
                        >
                          +5m
                        </button>
                      </div>
                    )}

                    <button
                      type="button"
                      onClick={() => handleCompleteReminder(r.id)}
                      className="ml-auto px-2.5 py-1 rounded-lg bg-emerald-500/20 hover:bg-emerald-500/30 border border-emerald-500/30 text-emerald-400 text-[11px] font-bold transition-colors flex items-center gap-1 cursor-pointer"
                    >
                      <Check className="h-3 w-3" />
                      <span>Concluir</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* 3. REMINDERS GRID */}
      {filteredReminders.length === 0 ? (
        <div className="bg-zinc-900/40 border border-zinc-800/60 rounded-3xl p-12 text-center space-y-4">
          <div className="w-16 h-16 rounded-3xl bg-zinc-800/80 border border-zinc-700/60 flex items-center justify-center mx-auto text-zinc-500">
            <Timer className="h-8 w-8 text-orange-500/60" />
          </div>
          <div className="space-y-1">
            <h3 className="text-base font-bold text-white">Nenhum lembrete nesta visualização</h3>
            <p className="text-xs text-zinc-400 max-w-md mx-auto">
              Crie um novo timer regressivo ou agende um horário para ser notificado de reuniões, água ou pausas de foco.
            </p>
          </div>
          <button
            onClick={() => setIsModalOpen(true)}
            className="px-4 py-2 rounded-xl bg-orange-500 hover:bg-orange-600 text-white font-bold text-xs inline-flex items-center gap-2 transition-all cursor-pointer"
          >
            <Plus className="h-4 w-4" />
            <span>Criar Primeiro Lembrete</span>
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredReminders.map(rem => {
            const isTriggered = rem.status === 'triggered';
            const isCompleted = rem.status === 'completed';
            const remainingText = getTimerRemainingText(rem);

            // Compute timer progress percentage
            let progressPct = 100;
            if (rem.mode === 'timer' && rem.durationSeconds && rem.durationSeconds > 0) {
              let secsLeft = rem.durationSeconds;
              if (rem.paused && rem.remainingSecondsWhenPaused !== undefined) {
                secsLeft = rem.remainingSecondsWhenPaused;
              } else if (rem.targetTimestamp) {
                secsLeft = Math.max(0, Math.ceil((rem.targetTimestamp - Date.now()) / 1000));
              }
              progressPct = Math.min(100, Math.max(0, (secsLeft / rem.durationSeconds) * 100));
            }

            return (
              <div
                key={rem.id}
                className={`group relative rounded-3xl p-5 border transition-all duration-300 flex flex-col justify-between space-y-4 overflow-hidden ${
                  isTriggered
                    ? 'bg-gradient-to-br from-red-950/80 via-zinc-900 to-black border-red-500/80 shadow-[0_0_30px_rgba(239,68,68,0.3)] animate-pulse'
                    : isCompleted
                    ? 'bg-zinc-900/30 border-zinc-800/60 opacity-60'
                    : rem.paused
                    ? 'bg-zinc-900/60 border-amber-500/40'
                    : 'bg-zinc-900/70 hover:bg-zinc-900/90 border-zinc-800/80 hover:border-orange-500/50 shadow-lg'
                }`}
              >
                {/* Background progress fill for timer */}
                {!isCompleted && rem.mode === 'timer' && (
                  <div
                    className="absolute top-0 left-0 bottom-0 bg-orange-500/5 transition-all duration-1000 pointer-events-none"
                    style={{ width: `${progressPct}%` }}
                  />
                )}

                {/* Top Row: Category Pill & Priority Badge */}
                <div className="relative z-10 flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-mono font-black uppercase tracking-wider border ${
                      rem.mode === 'timer'
                        ? 'bg-orange-500/10 border-orange-500/20 text-orange-400'
                        : 'bg-amber-500/10 border-amber-500/20 text-amber-400'
                    }`}>
                      {rem.mode === 'timer' ? '⏱ Timer' : '⏰ Agendado'}
                    </span>

                    {rem.category && (
                      <span className="px-2 py-0.5 rounded-full bg-zinc-800 border border-zinc-700/60 text-zinc-300 text-[10px] font-medium">
                        {rem.category}
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-2">
                    {rem.priority === 'alta' && (
                      <span className="px-2 py-0.5 rounded-md bg-red-500/20 border border-red-500/40 text-red-400 text-[9px] font-bold uppercase tracking-wider">
                        Alta
                      </span>
                    )}
                    <button
                      onClick={() => handleDeleteReminder(rem.id)}
                      className="text-zinc-500 hover:text-red-400 p-1 rounded-lg hover:bg-zinc-800 transition-colors"
                      title="Excluir lembrete"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>

                {/* Middle: Title & Main Display */}
                <div className="relative z-10 space-y-2">
                  <h3 className={`text-base font-black tracking-tight leading-snug ${
                    isCompleted ? 'line-through text-zinc-500' : 'text-white'
                  }`}>
                    {rem.title}
                  </h3>
                  {rem.description && (
                    <p className="text-xs text-zinc-400 line-clamp-2">{rem.description}</p>
                  )}

                  {/* Remaining Time / Countdown Display */}
                  <div className="pt-2">
                    <div className={`p-3 rounded-2xl border flex items-center justify-between font-mono ${
                      isTriggered
                        ? 'bg-red-500/20 border-red-500/40 text-red-300'
                        : rem.paused
                        ? 'bg-amber-500/10 border-amber-500/20 text-amber-400'
                        : 'bg-black/50 border-zinc-800 text-orange-400'
                    }`}>
                      <div className="flex items-center gap-2">
                        {rem.mode === 'timer' ? (
                          <Timer className={`h-4 w-4 ${!rem.paused && !isCompleted ? 'animate-spin' : ''}`} />
                        ) : (
                          <Clock className="h-4 w-4" />
                        )}
                        <span className="text-sm font-extrabold tracking-wider">{remainingText}</span>
                      </div>

                      {rem.paused && (
                        <span className="text-[9px] font-bold bg-amber-500/20 text-amber-300 px-2 py-0.5 rounded-full uppercase">
                          Pausado
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Bottom Action Controls */}
                <div className="relative z-10 pt-2 border-t border-zinc-800/60 flex items-center justify-between gap-2">
                  {rem.mode === 'timer' && !isCompleted && !isTriggered && (
                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => handleTogglePause(rem.id)}
                        className="px-2.5 py-1.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-white text-xs font-bold transition-all flex items-center gap-1 cursor-pointer"
                        title={rem.paused ? 'Continuar' : 'Pausar'}
                      >
                        {rem.paused ? <Play className="h-3 w-3 text-emerald-400 fill-emerald-400" /> : <Pause className="h-3 w-3 text-amber-400 fill-amber-400" />}
                        <span>{rem.paused ? 'Voltar' : 'Pausar'}</span>
                      </button>

                      <button
                        onClick={() => handleAddFiveMinutes(rem.id)}
                        className="px-2.5 py-1.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-orange-400 text-xs font-mono font-bold transition-all cursor-pointer"
                        title="Adicionar +5 minutos"
                      >
                        +5m
                      </button>

                      <button
                        onClick={() => handleResetTimer(rem.id)}
                        className="p-1.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-400 hover:text-white transition-all cursor-pointer"
                        title="Reiniciar Timer"
                      >
                        <RotateCcw className="h-3 w-3" />
                      </button>
                    </div>
                  )}

                  {!isCompleted && (
                    <button
                      onClick={() => handleCompleteReminder(rem.id)}
                      className="ml-auto px-3 py-1.5 rounded-xl bg-emerald-600/20 hover:bg-emerald-600 border border-emerald-500/30 text-emerald-400 hover:text-white text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer"
                    >
                      <Check className="h-3.5 w-3.5" />
                      <span>Concluir (+10 XP)</span>
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* 4. CREATION MODAL */}
      {isModalOpen && (
        <div 
          onClick={() => {
            setIsModalOpen(false);
            if (onModalClosed) onModalClosed();
          }}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200 cursor-pointer"
        >
          <div 
            onClick={(e) => e.stopPropagation()}
            className="cursor-default bg-zinc-900 border border-zinc-800 rounded-3xl w-full max-w-lg p-6 space-y-6 shadow-2xl relative overflow-hidden"
          >
            <div className="flex items-center justify-between border-b border-zinc-800 pb-4">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-2xl bg-orange-500/10 border border-orange-500/20 text-orange-400">
                  <Bell className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-base font-black text-white">Criar Lembrete Rápido</h3>
                  <p className="text-xs text-zinc-400">Configure notificação por timer ou horário agendado</p>
                </div>
              </div>
              <button
                onClick={() => {
                  setIsModalOpen(false);
                  if (onModalClosed) onModalClosed();
                }}
                className="p-2 rounded-xl bg-zinc-800 text-zinc-400 hover:text-white hover:bg-zinc-700 transition-colors"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleCreateReminder} className="space-y-4">
              {/* Title */}
              <div>
                <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider block mb-1">
                  Título do Lembrete *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Beber 500ml de água, Alinhamento de equipe, Pausa de olhos..."
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3.5 py-2.5 text-sm text-white placeholder-zinc-600 focus:outline-none focus:border-orange-500"
                />
              </div>

              {/* Mode Switch: Timer vs Cronometer */}
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider block mb-1">
                  Modo de Notificação
                </label>
                <div className="grid grid-cols-2 gap-2 bg-zinc-950 p-1 rounded-2xl border border-zinc-800">
                  <button
                    type="button"
                    onClick={() => setMode('timer')}
                    className={`py-2.5 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 ${
                      mode === 'timer'
                        ? 'bg-gradient-to-r from-orange-600 to-orange-500 text-white shadow-md'
                        : 'text-zinc-400 hover:text-white'
                    }`}
                  >
                    <Timer className="h-4 w-4" />
                    <span>Timer Regressivo</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setMode('cronometer')}
                    className={`py-2.5 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 ${
                      mode === 'cronometer'
                        ? 'bg-gradient-to-r from-amber-600 to-amber-500 text-white shadow-md'
                        : 'text-zinc-400 hover:text-white'
                    }`}
                  >
                    <Clock className="h-4 w-4" />
                    <span>Horário Agendado</span>
                  </button>
                </div>
              </div>

              {/* MODE DETAILS: Timer */}
              {mode === 'timer' ? (
                <div className="p-4 rounded-2xl bg-zinc-950 border border-zinc-800 space-y-3">
                  <div className="flex items-center justify-between">
                    <label className="text-[10px] font-mono font-bold text-orange-400 uppercase tracking-wider">
                      Presets Rápidos
                    </label>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {[1, 3, 5, 10, 15, 25, 30, 45, 60].map((m) => (
                      <button
                        key={m}
                        type="button"
                        onClick={() => handleApplyPresetMinutes(m)}
                        className={`px-3 py-1.5 rounded-xl text-xs font-mono font-bold border transition-all ${
                          timerMinutes === m && timerHours === 0
                            ? 'bg-orange-500 text-white border-orange-400 shadow-md shadow-orange-500/20'
                            : 'bg-zinc-900 border-zinc-800 text-zinc-300 hover:border-zinc-700'
                        }`}
                      >
                        {m}m
                      </button>
                    ))}
                  </div>

                  <div className="pt-2 border-t border-zinc-900 grid grid-cols-3 gap-2 text-center">
                    <div>
                      <span className="text-[9px] text-zinc-500 font-mono block mb-1">Horas</span>
                      <input
                        type="number"
                        min="0"
                        max="23"
                        value={timerHours}
                        onChange={(e) => setTimerHours(Math.max(0, parseInt(e.target.value) || 0))}
                        className="w-full bg-zinc-900 border border-zinc-800 rounded-xl py-2 text-center text-sm font-mono font-bold text-white focus:outline-none focus:border-orange-500"
                      />
                    </div>
                    <div>
                      <span className="text-[9px] text-zinc-500 font-mono block mb-1">Minutos</span>
                      <input
                        type="number"
                        min="0"
                        max="59"
                        value={timerMinutes}
                        onChange={(e) => setTimerMinutes(Math.max(0, parseInt(e.target.value) || 0))}
                        className="w-full bg-zinc-900 border border-zinc-800 rounded-xl py-2 text-center text-sm font-mono font-bold text-white focus:outline-none focus:border-orange-500"
                      />
                    </div>
                    <div>
                      <span className="text-[9px] text-zinc-500 font-mono block mb-1">Segundos</span>
                      <input
                        type="number"
                        min="0"
                        max="59"
                        value={timerSeconds}
                        onChange={(e) => setTimerSeconds(Math.max(0, parseInt(e.target.value) || 0))}
                        className="w-full bg-zinc-900 border border-zinc-800 rounded-xl py-2 text-center text-sm font-mono font-bold text-white focus:outline-none focus:border-orange-500"
                      />
                    </div>
                  </div>
                </div>
              ) : (
                /* MODE DETAILS: Cronometer / Scheduled */
                <div className="p-4 rounded-2xl bg-zinc-950 border border-zinc-800 space-y-3">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider block mb-1">
                        Data *
                      </label>
                      <input
                        type="date"
                        required
                        value={scheduledDate}
                        onChange={(e) => setScheduledDate(e.target.value)}
                        className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-3 py-2 text-xs font-mono text-white focus:outline-none focus:border-amber-500"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider block mb-1">
                        Horário Exato *
                      </label>
                      <input
                        type="time"
                        required
                        value={scheduledTime}
                        onChange={(e) => setScheduledTime(e.target.value)}
                        className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-3 py-2 text-xs font-mono text-white focus:outline-none focus:border-amber-500"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Category & Priority */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider block mb-1">
                    Categoria
                  </label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value as any)}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-orange-500"
                  >
                    <option value="Foco">⚡ Foco / Estudo</option>
                    <option value="Saúde">💧 Saúde / Água</option>
                    <option value="Trabalho">💼 Trabalho / Reunião</option>
                    <option value="Estudo">📖 Leitura / Cursos</option>
                    <option value="Pessoal">🎯 Pessoal / Hábitos</option>
                  </select>
                </div>

                <div>
                  <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider block mb-1">
                    Prioridade
                  </label>
                  <select
                    value={priority}
                    onChange={(e) => setPriority(e.target.value as any)}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-orange-500"
                  >
                    <option value="baixa">Baixa</option>
                    <option value="media">Média</option>
                    <option value="alta">Alta 🔥</option>
                  </select>
                </div>
              </div>

              {/* Description */}
              <div>
                <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider block mb-1">
                  Detalhes / Anotação (Opcional)
                </label>
                <textarea
                  rows={2}
                  placeholder="Instruções adicionais ou links..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3.5 py-2 text-xs text-white placeholder-zinc-600 focus:outline-none focus:border-orange-500 resize-none"
                />
              </div>

              {/* Modal Actions */}
              <div className="pt-3 border-t border-zinc-800 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setIsModalOpen(false);
                    if (onModalClosed) onModalClosed();
                  }}
                  className="px-4 py-2.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs font-bold transition-colors cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-orange-600 to-amber-500 text-white font-extrabold text-xs uppercase tracking-wider shadow-lg shadow-orange-500/25 hover:scale-[1.02] transition-all cursor-pointer flex items-center gap-2"
                >
                  <BellRing className="h-4 w-4" />
                  <span>Ativar Lembrete (+15 XP)</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 5. TRIGGERED ALARM POPUP OVERLAY */}
      {activeAlarm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-lg animate-in zoom-in-95 duration-200">
          <div className="bg-gradient-to-b from-red-950 via-zinc-900 to-black border-2 border-red-500 rounded-3xl w-full max-w-md p-6 text-center space-y-6 shadow-[0_0_50px_rgba(239,68,68,0.5)] relative overflow-hidden">
            <div className="absolute top-0 right-0 left-0 h-1 bg-gradient-to-r from-red-500 via-orange-500 to-amber-500 animate-pulse" />

            <div className="w-20 h-20 rounded-full bg-red-500/20 border-2 border-red-500/50 flex items-center justify-center mx-auto text-red-400 animate-bounce">
              <Bell className="h-10 w-10 text-red-500" />
            </div>

            <div className="space-y-2">
              <span className="px-3 py-1 rounded-full bg-red-500/20 border border-red-500/40 text-red-400 text-xs font-mono font-extrabold uppercase tracking-widest">
                ⏰ Hora do Lembrete!
              </span>
              <h2 className="text-xl font-black text-white">{activeAlarm.title}</h2>
              {activeAlarm.description && (
                <p className="text-xs text-zinc-300 bg-zinc-950/60 p-3 rounded-xl border border-zinc-800">
                  {activeAlarm.description}
                </p>
              )}
            </div>

            <div className="grid grid-cols-2 gap-3 pt-2">
              <button
                onClick={() => handleSnoozeAlarm(activeAlarm.id)}
                className="py-3 px-4 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-amber-400 font-bold text-xs uppercase tracking-wider border border-amber-500/30 transition-all cursor-pointer flex items-center justify-center gap-2"
              >
                <Clock className="h-4 w-4" />
                <span>Adiar +5 min</span>
              </button>

              <button
                onClick={() => handleCompleteReminder(activeAlarm.id)}
                className="py-3 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold text-xs uppercase tracking-wider shadow-lg shadow-emerald-600/30 transition-all cursor-pointer flex items-center justify-center gap-2"
              >
                <Check className="h-4 w-4" />
                <span>Concluir</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
