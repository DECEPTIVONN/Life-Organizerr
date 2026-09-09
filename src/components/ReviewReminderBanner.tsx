import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Sparkles, Calendar, ArrowRight, X, Bell, CheckCircle2 } from 'lucide-react';
import { 
  getReviewRemindersSettings, 
  isTodayWeeklyReviewDay, 
  isTodayMonthlyReviewDay,
  getTargetReviewMonthAndYear,
  hasCompletedWeeklyReview, 
  hasCompletedMonthlyReview,
  getWeeklyReviewDayLabel,
  getMonthlyReviewTimingLabel,
  ReviewRemindersSettings
} from '../utils/reviewReminderUtils';
import { WeeklyReview, MonthlyReview } from '../types';

interface ReviewReminderBannerProps {
  weeklyReviews: WeeklyReview[];
  monthlyReviews: MonthlyReview[];
  onOpenWeeklyReview: () => void;
  onOpenMonthlyReview: () => void;
  onConfigureReminders: (tab: 'weekly' | 'monthly') => void;
}

export const ReviewReminderBanner: React.FC<ReviewReminderBannerProps> = ({
  weeklyReviews,
  monthlyReviews,
  onOpenWeeklyReview,
  onOpenMonthlyReview,
  onConfigureReminders,
}) => {
  const [settings, setSettings] = useState<ReviewRemindersSettings>(() => getReviewRemindersSettings());
  const [dismissedWeekly, setDismissedWeekly] = useState(false);
  const [dismissedMonthly, setDismissedMonthly] = useState(false);

  useEffect(() => {
    const handler = () => {
      setSettings(getReviewRemindersSettings());
    };
    window.addEventListener('mbc_review_reminders_changed', handler);
    window.addEventListener('storage', handler);
    return () => {
      window.removeEventListener('mbc_review_reminders_changed', handler);
      window.removeEventListener('storage', handler);
    };
  }, []);

  const now = new Date();
  const todayDateStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;

  const isWeeklyDay = isTodayWeeklyReviewDay(settings, now);
  const isWeeklyDone = hasCompletedWeeklyReview(weeklyReviews);
  const showWeekly = isWeeklyDay && !isWeeklyDone && !dismissedWeekly;

  const isMonthlyDay = isTodayMonthlyReviewDay(settings, now);
  const targetMonth = getTargetReviewMonthAndYear(settings, now);
  const isMonthlyDone = hasCompletedMonthlyReview(monthlyReviews, targetMonth.month, targetMonth.year);
  const showMonthly = isMonthlyDay && !isMonthlyDone && !dismissedMonthly;

  if (!showWeekly && !showMonthly) return null;

  return (
    <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 pt-4 pb-2 space-y-2">
      {/* Weekly Review Banner */}
      <AnimatePresence>
        {showWeekly && (
          <motion.div
            initial={{ opacity: 0, y: -12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            className="p-3.5 sm:p-4 bg-[#0c0c10]/95 border border-orange-500/40 rounded-2xl shadow-[0_0_20px_rgba(249,115,22,0.15)] backdrop-blur-md flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 relative overflow-hidden"
          >
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-orange-500/15 border border-orange-500/30 rounded-xl text-orange-400 shrink-0 animate-pulse">
                <Calendar className="h-4.5 w-4.5" />
              </div>
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-[9px] font-mono font-black uppercase tracking-wider text-orange-400 bg-orange-500/10 px-2 py-0.5 rounded-full border border-orange-500/20">
                    Ciclo Semanal • Hoje ({getWeeklyReviewDayLabel(settings.weekly.dayOfWeek)})
                  </span>
                  <span className="text-xs font-black text-white font-mono">
                    Hora da Review Semanal!
                  </span>
                </div>
                <p className="text-[11px] text-zinc-400 mt-0.5 leading-snug">
                  Hoje é o seu dia definido para fechar a semana. Registre conquistas, desafios e direcione seu próximo ciclo.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 self-end sm:self-center shrink-0 w-full sm:w-auto justify-end">
              <button
                type="button"
                onClick={() => onConfigureReminders('weekly')}
                className="px-2.5 py-1.5 text-zinc-400 hover:text-zinc-200 text-[11px] font-mono rounded-lg hover:bg-zinc-900 border border-transparent hover:border-zinc-800 transition-all flex items-center gap-1 cursor-pointer"
                title="Mudar o dia do lembrete da Review Semanal"
              >
                <Bell className="h-3 w-3 text-orange-400" />
                <span>Alterar Dia</span>
              </button>

              <button
                type="button"
                onClick={onOpenWeeklyReview}
                className="px-3.5 py-1.5 bg-orange-500 hover:bg-orange-600 text-white text-xs font-bold font-mono rounded-xl transition-all shadow-md flex items-center gap-1.5 cursor-pointer"
              >
                <span>Preencher Agora</span>
                <ArrowRight className="h-3.5 w-3.5" />
              </button>

              <button
                type="button"
                onClick={() => setDismissedWeekly(true)}
                className="p-1.5 text-zinc-500 hover:text-zinc-300 rounded-lg hover:bg-zinc-900 transition-colors cursor-pointer"
                title="Fechar por agora"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Monthly Review Banner */}
      <AnimatePresence>
        {showMonthly && (
          <motion.div
            initial={{ opacity: 0, y: -12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            className="p-3.5 sm:p-4 bg-[#0c0c10]/95 border border-orange-500/40 rounded-2xl shadow-[0_0_20px_rgba(249,115,22,0.15)] backdrop-blur-md flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 relative overflow-hidden"
          >
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-orange-500/15 border border-orange-500/30 rounded-xl text-orange-400 shrink-0 animate-pulse">
                <Sparkles className="h-4.5 w-4.5" />
              </div>
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-[9px] font-mono font-black uppercase tracking-wider text-orange-400 bg-orange-500/10 px-2 py-0.5 rounded-full border border-orange-500/20">
                    Ciclo Mensal • Hoje ({getMonthlyReviewTimingLabel(settings.monthly)})
                  </span>
                  <span className="text-xs font-black text-white font-mono">
                    Hora da Review Mensal!
                  </span>
                </div>
                <p className="text-[11px] text-zinc-400 mt-0.5 leading-snug">
                  Seu dia programado de fechamento de mês. Consolide momentos marcantes, métricas e lições aprendidas.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 self-end sm:self-center shrink-0 w-full sm:w-auto justify-end">
              <button
                type="button"
                onClick={() => onConfigureReminders('monthly')}
                className="px-2.5 py-1.5 text-zinc-400 hover:text-zinc-200 text-[11px] font-mono rounded-lg hover:bg-zinc-900 border border-transparent hover:border-zinc-800 transition-all flex items-center gap-1 cursor-pointer"
                title="Mudar o dia do lembrete da Review Mensal"
              >
                <Bell className="h-3 w-3 text-orange-400" />
                <span>Alterar Dia</span>
              </button>

              <button
                type="button"
                onClick={onOpenMonthlyReview}
                className="px-3.5 py-1.5 bg-orange-500 hover:bg-orange-600 text-white text-xs font-bold font-mono rounded-xl transition-all shadow-md flex items-center gap-1.5 cursor-pointer"
              >
                <span>Preencher Agora</span>
                <ArrowRight className="h-3.5 w-3.5" />
              </button>

              <button
                type="button"
                onClick={() => setDismissedMonthly(true)}
                className="p-1.5 text-zinc-500 hover:text-zinc-300 rounded-lg hover:bg-zinc-900 transition-colors cursor-pointer"
                title="Fechar por agora"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
