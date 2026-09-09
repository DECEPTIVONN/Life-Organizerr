import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  X, 
  Bell, 
  Calendar, 
  Clock, 
  CheckCircle2, 
  Sparkles, 
  Sliders, 
  Zap, 
  ChevronRight,
  Info
} from 'lucide-react';
import { 
  ReviewRemindersSettings, 
  getReviewRemindersSettings, 
  saveReviewRemindersSettings,
  WEEK_DAYS_OPTIONS,
  MONTH_TIMING_OPTIONS,
  MonthlyReviewTimingType,
  getWeeklyReviewDayLabel,
  getMonthlyReviewTimingLabel
} from '../utils/reviewReminderUtils';
import { sendSystemNotification, requestNotificationPermission } from '../lib/notificationHelper';

interface ReviewReminderModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialTab?: 'weekly' | 'monthly' | 'all';
}

export const ReviewReminderModal: React.FC<ReviewReminderModalProps> = ({
  isOpen,
  onClose,
  initialTab = 'all'
}) => {
  const [settings, setSettings] = useState<ReviewRemindersSettings>(() => getReviewRemindersSettings());
  const [activeSubTab, setActiveSubTab] = useState<'weekly' | 'monthly'>(
    initialTab === 'monthly' ? 'monthly' : 'weekly'
  );
  const [savedStatus, setSavedStatus] = useState<boolean>(false);
  const [testStatus, setTestStatus] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      setSettings(getReviewRemindersSettings());
      setSavedStatus(false);
      setTestStatus(null);
      if (initialTab === 'monthly' || initialTab === 'weekly') {
        setActiveSubTab(initialTab);
      }
    }
  }, [isOpen, initialTab]);

  if (!isOpen) return null;

  const handleSave = () => {
    saveReviewRemindersSettings(settings);
    setSavedStatus(true);
    setTimeout(() => {
      setSavedStatus(false);
      onClose();
    }, 900);
  };

  const handleTestNotification = async (type: 'weekly' | 'monthly') => {
    setTestStatus('Disparando teste...');
    const granted = await requestNotificationPermission();
    if (granted) {
      if (type === 'weekly') {
        sendSystemNotification('⏰ Teste: Review Semanal TRONUS', {
          body: `Lembrete agendado para toda ${getWeeklyReviewDayLabel(settings.weekly.dayOfWeek)} às ${settings.weekly.time}. Momento de avaliar sua semana!`,
          tag: 'test-weekly-review-reminder'
        });
      } else {
        sendSystemNotification('🌟 Teste: Review Mensal TRONUS', {
          body: `Lembrete agendado para ${getMonthlyReviewTimingLabel(settings.monthly)} às ${settings.monthly.time}. Fechamento de ciclo e aprendizados!`,
          tag: 'test-monthly-review-reminder'
        });
      }
      setTestStatus('Alerta enviado com sucesso!');
      setTimeout(() => setTestStatus(null), 3500);
    } else {
      setTestStatus('Permissão negada no navegador. Ative as notificações.');
      setTimeout(() => setTestStatus(null), 4500);
    }
  };

  return (
    <AnimatePresence>
      <div 
        id="review-reminder-modal-overlay"
        onClick={onClose}
        className="fixed inset-0 z-50 bg-[#050508]/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-4 md:p-6 overflow-y-auto cursor-pointer"
      >
        <motion.div
          id="review-reminder-modal-container"
          onClick={(e) => e.stopPropagation()}
          initial={{ scale: 0.94, opacity: 0, y: 16 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.94, opacity: 0, y: 16 }}
          transition={{ type: 'spring', damping: 26, stiffness: 320 }}
          className="cursor-default bg-[#0b0b0e] border border-orange-500/30 rounded-3xl w-full max-w-xl flex flex-col overflow-hidden shadow-2xl shadow-orange-500/10 my-auto"
        >
          {/* Header */}
          <div className="flex items-center justify-between px-5 sm:px-6 py-4 border-b border-zinc-850 bg-[#0e0e13]/90 backdrop-blur-sm">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-orange-500/10 border border-orange-500/25 rounded-2xl text-orange-400 shrink-0">
                <Bell className="h-5 w-5 animate-pulse" />
              </div>
              <div>
                <h3 className="text-sm sm:text-base font-black text-white uppercase tracking-wider font-mono flex items-center gap-2">
                  Lembretes de Review
                  <span className="text-[10px] text-orange-400 bg-orange-500/10 border border-orange-500/20 px-2 py-0.5 rounded-full font-bold">
                    Ciclos
                  </span>
                </h3>
                <p className="text-[11px] text-zinc-400">
                  Defina os dias e horários para ser lembrado de preencher suas reviews.
                </p>
              </div>
            </div>

            <button
              id="close-review-reminder-modal-btn"
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-xl text-zinc-400 hover:text-white hover:bg-zinc-850 transition-colors cursor-pointer"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Tab Selector */}
          <div className="px-5 sm:px-6 pt-4 pb-2 bg-[#0b0b0e]">
            <nav className="internal-nav mb-2" aria-label="Navegação de Configuração de Lembretes">
              <button
                type="button"
                id="tab-btn-weekly-reminder"
                onClick={() => setActiveSubTab('weekly')}
                className={`internal-nav-btn ${activeSubTab === 'weekly' ? 'active' : ''}`}
              >
                Review Semanal
              </button>
              <button
                type="button"
                id="tab-btn-monthly-reminder"
                onClick={() => setActiveSubTab('monthly')}
                className={`internal-nav-btn ${activeSubTab === 'monthly' ? 'active' : ''}`}
              >
                Review Mensal
              </button>
            </nav>
          </div>

          {/* Body Content */}
          <div className="px-5 sm:px-6 py-4 space-y-5 max-h-[68vh] overflow-y-auto custom-scrollbar">
            {activeSubTab === 'weekly' ? (
              /* ================= REVIEW SEMANAL ================= */
              <div className="space-y-4">
                {/* Active Toggle */}
                <div className="flex items-center justify-between p-4 bg-zinc-950/70 border border-zinc-850 rounded-2xl">
                  <div>
                    <h4 className="text-xs font-bold text-zinc-200 flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-orange-400" />
                      Lembrete Semanal Ativo
                    </h4>
                    <p className="text-[10px] text-zinc-500 font-mono mt-0.5">
                      Notifica no dia programado para consolidar vitórias e metas.
                    </p>
                  </div>
                  <button
                    type="button"
                    id="toggle-weekly-reminder-btn"
                    onClick={() => setSettings(prev => ({
                      ...prev,
                      weekly: { ...prev.weekly, enabled: !prev.weekly.enabled }
                    }))}
                    className={`w-10 h-6 rounded-full p-0.5 transition-all cursor-pointer ${settings.weekly.enabled ? 'bg-orange-500' : 'bg-zinc-800'}`}
                  >
                    <div className={`w-5 h-5 rounded-full bg-white transition-all shadow-sm ${settings.weekly.enabled ? 'translate-x-4' : 'translate-x-0'}`} />
                  </button>
                </div>

                {/* Day Selection */}
                <div className="p-4 bg-zinc-950/70 border border-zinc-850 rounded-2xl space-y-3">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-zinc-200 uppercase tracking-wider font-mono flex items-center gap-2">
                      <Sparkles className="h-3.5 w-3.5 text-orange-400" />
                      Dia da Semana para Lembrar
                    </label>
                    <span className="text-[10px] text-orange-400 font-mono font-bold">
                      {getWeeklyReviewDayLabel(settings.weekly.dayOfWeek)}
                    </span>
                  </div>

                  {/* Quick option cards */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {WEEK_DAYS_OPTIONS.map(opt => {
                      const isSelected = settings.weekly.dayOfWeek === opt.value;
                      return (
                        <button
                          key={opt.value}
                          type="button"
                          id={`weekly-day-opt-${opt.value}`}
                          onClick={() => setSettings(prev => ({
                            ...prev,
                            weekly: { ...prev.weekly, dayOfWeek: opt.value }
                          }))}
                          className={`p-3 rounded-xl border text-left transition-all cursor-pointer flex flex-col justify-between ${
                            isSelected
                              ? 'bg-orange-500/15 border-orange-500 text-white shadow-[0_0_12px_rgba(249,115,22,0.2)]'
                              : 'bg-zinc-900/40 border-zinc-850 text-zinc-400 hover:text-zinc-200 hover:border-zinc-700'
                          }`}
                        >
                          <div className="flex items-center justify-between w-full">
                            <span className="text-xs font-bold">{opt.label}</span>
                            {isSelected && <CheckCircle2 className="h-3.5 w-3.5 text-orange-400 shrink-0" />}
                          </div>
                          <span className="text-[9px] text-zinc-500 font-mono mt-1 leading-tight">
                            {opt.description}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Time Selection */}
                <div className="p-4 bg-zinc-950/70 border border-zinc-850 rounded-2xl flex items-center justify-between">
                  <div>
                    <label className="text-xs font-bold text-zinc-200 uppercase tracking-wider font-mono flex items-center gap-2">
                      <Clock className="h-3.5 w-3.5 text-orange-400" />
                      Horário do Lembrete
                    </label>
                    <p className="text-[10px] text-zinc-500 font-mono mt-0.5">
                      Horário local do disparo da notificação.
                    </p>
                  </div>

                  <input
                    type="time"
                    id="weekly-reminder-time-input"
                    value={settings.weekly.time}
                    onChange={(e) => {
                      const val = e.target.value;
                      setSettings(prev => ({
                        ...prev,
                        weekly: { ...prev.weekly, time: val }
                      }));
                    }}
                    className="bg-zinc-900 border border-zinc-750 text-white font-mono text-sm px-3.5 py-2 rounded-xl focus:outline-none focus:border-orange-500"
                  />
                </div>
              </div>
            ) : (
              /* ================= REVIEW MENSAL ================= */
              <div className="space-y-4">
                {/* Active Toggle */}
                <div className="flex items-center justify-between p-4 bg-zinc-950/70 border border-zinc-850 rounded-2xl">
                  <div>
                    <h4 className="text-xs font-bold text-zinc-200 flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-orange-400" />
                      Lembrete Mensal Ativo
                    </h4>
                    <p className="text-[10px] text-zinc-500 font-mono mt-0.5">
                      Notifica no encerramento ou virada do mês para balanço completo.
                    </p>
                  </div>
                  <button
                    type="button"
                    id="toggle-monthly-reminder-btn"
                    onClick={() => setSettings(prev => ({
                      ...prev,
                      monthly: { ...prev.monthly, enabled: !prev.monthly.enabled }
                    }))}
                    className={`w-10 h-6 rounded-full p-0.5 transition-all cursor-pointer ${settings.monthly.enabled ? 'bg-orange-500' : 'bg-zinc-800'}`}
                  >
                    <div className={`w-5 h-5 rounded-full bg-white transition-all shadow-sm ${settings.monthly.enabled ? 'translate-x-4' : 'translate-x-0'}`} />
                  </button>
                </div>

                {/* Timing Rule Selection */}
                <div className="p-4 bg-zinc-950/70 border border-zinc-850 rounded-2xl space-y-3">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-zinc-200 uppercase tracking-wider font-mono flex items-center gap-2">
                      <Sliders className="h-3.5 w-3.5 text-orange-400" />
                      Quando Lembrar no Mês
                    </label>
                    <span className="text-[10px] text-orange-400 font-mono font-bold">
                      {getMonthlyReviewTimingLabel(settings.monthly)}
                    </span>
                  </div>

                  <div className="space-y-2">
                    {MONTH_TIMING_OPTIONS.map(opt => {
                      const isSelected = settings.monthly.timingType === opt.value;
                      return (
                        <button
                          key={opt.value}
                          type="button"
                          id={`monthly-timing-opt-${opt.value}`}
                          onClick={() => setSettings(prev => ({
                            ...prev,
                            monthly: { ...prev.monthly, timingType: opt.value }
                          }))}
                          className={`p-3.5 w-full rounded-xl border text-left transition-all cursor-pointer flex items-center justify-between gap-3 ${
                            isSelected
                              ? 'bg-orange-500/15 border-orange-500 text-white shadow-[0_0_12px_rgba(249,115,22,0.2)]'
                              : 'bg-zinc-900/40 border-zinc-850 text-zinc-400 hover:text-zinc-200 hover:border-zinc-700'
                          }`}
                        >
                          <div>
                            <span className="text-xs font-bold block">{opt.label}</span>
                            <span className="text-[10px] text-zinc-500 font-mono mt-0.5 block">
                              {opt.description}
                            </span>
                          </div>
                          {isSelected && <CheckCircle2 className="h-4 w-4 text-orange-400 shrink-0" />}
                        </button>
                      );
                    })}
                  </div>

                  {/* If specific day chosen */}
                  {settings.monthly.timingType === 'specific_day' && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      className="pt-3 border-t border-zinc-850 space-y-2"
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] text-zinc-400 font-mono uppercase font-bold">
                          Número do Dia (1 a 31):
                        </span>
                        <span className="text-xs font-bold text-orange-400 font-mono">
                          Dia {settings.monthly.dayOfMonth}
                        </span>
                      </div>

                      <div className="flex items-center gap-3">
                        <input
                          type="range"
                          min="1"
                          max="31"
                          id="monthly-day-slider"
                          value={settings.monthly.dayOfMonth}
                          onChange={(e) => {
                            const val = parseInt(e.target.value, 10) || 30;
                            setSettings(prev => ({
                              ...prev,
                              monthly: { ...prev.monthly, dayOfMonth: val }
                            }));
                          }}
                          className="w-full accent-orange-500 cursor-pointer"
                        />
                        <div className="flex items-center gap-1">
                          {[28, 30, 31].map(quickDay => (
                            <button
                              key={quickDay}
                              type="button"
                              onClick={() => setSettings(prev => ({
                                ...prev,
                                monthly: { ...prev.monthly, dayOfMonth: quickDay }
                              }))}
                              className={`px-2 py-1 text-[10px] font-mono font-bold rounded-lg border cursor-pointer ${
                                settings.monthly.dayOfMonth === quickDay
                                  ? 'bg-orange-500 text-white border-orange-400'
                                  : 'bg-zinc-900 text-zinc-400 border-zinc-800 hover:text-white'
                              }`}
                            >
                              {quickDay}
                            </button>
                          ))}
                        </div>
                      </div>
                    </motion.div>
                  )}
                </div>

                {/* Time Selection */}
                <div className="p-4 bg-zinc-950/70 border border-zinc-850 rounded-2xl flex items-center justify-between">
                  <div>
                    <label className="text-xs font-bold text-zinc-200 uppercase tracking-wider font-mono flex items-center gap-2">
                      <Clock className="h-3.5 w-3.5 text-orange-400" />
                      Horário do Lembrete
                    </label>
                    <p className="text-[10px] text-zinc-500 font-mono mt-0.5">
                      Horário local do disparo da notificação.
                    </p>
                  </div>

                  <input
                    type="time"
                    id="monthly-reminder-time-input"
                    value={settings.monthly.time}
                    onChange={(e) => {
                      const val = e.target.value;
                      setSettings(prev => ({
                        ...prev,
                        monthly: { ...prev.monthly, time: val }
                      }));
                    }}
                    className="bg-zinc-900 border border-zinc-750 text-white font-mono text-sm px-3.5 py-2 rounded-xl focus:outline-none focus:border-orange-500"
                  />
                </div>
              </div>
            )}

            {/* Test alert feedback */}
            {testStatus && (
              <motion.div 
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                className="p-3 bg-orange-500/10 border border-orange-500/30 rounded-xl text-xs text-orange-300 font-mono flex items-center gap-2"
              >
                <Info className="h-4 w-4 shrink-0 text-orange-400" />
                {testStatus}
              </motion.div>
            )}
          </div>

          {/* Footer Actions */}
          <div className="px-5 sm:px-6 py-4 border-t border-zinc-850 bg-[#0e0e13]/90 flex flex-wrap items-center justify-between gap-3">
            <button
              type="button"
              id="test-review-reminder-btn"
              onClick={() => handleTestNotification(activeSubTab)}
              className="px-3.5 py-2 bg-zinc-900 hover:bg-zinc-850 text-zinc-300 border border-zinc-750 text-xs font-bold rounded-xl transition-all flex items-center gap-1.5 cursor-pointer"
            >
              <Zap className="h-3.5 w-3.5 text-orange-400" />
              Testar Disparo Agora
            </button>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-zinc-400 hover:text-white text-xs font-bold rounded-xl transition-colors cursor-pointer"
              >
                Cancelar
              </button>

              <button
                type="button"
                id="save-review-reminders-btn"
                onClick={handleSave}
                className="px-5 py-2 bg-orange-500 hover:bg-orange-600 text-white text-xs font-bold rounded-xl transition-all shadow-md flex items-center gap-1.5 cursor-pointer"
              >
                {savedStatus ? (
                  <>
                    <CheckCircle2 className="h-4 w-4 text-white" />
                    Salvo!
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="h-3.5 w-3.5 text-white" />
                    Salvar Lembretes
                  </>
                )}
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
