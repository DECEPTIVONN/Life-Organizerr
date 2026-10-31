import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Bot, Sparkles, X, ArrowRight, MessageSquare, Bell, CheckCircle2 } from 'lucide-react';

export interface NotchNotification {
  id: string;
  type: 'agent' | 'reminder' | 'system';
  title?: string;
  message: string; // Formatted as "Agent: (resposta)"
  conversationId?: string;
  timestamp: number;
  durationMs?: number; // auto-dismiss time
}

interface DynamicNotchProps {
  currentNotification: NotchNotification | null;
  onDismiss: (id: string) => void;
  onOpenConversation?: (conversationId?: string) => void;
}

export const DynamicNotch: React.FC<DynamicNotchProps> = ({
  currentNotification,
  onDismiss,
  onOpenConversation,
}) => {
  const [isExpanded, setIsExpanded] = useState<boolean>(false);
  const [touchStartX, setTouchStartX] = useState<number | null>(null);

  useEffect(() => {
    if (currentNotification) {
      setIsExpanded(true);
      const timer = setTimeout(() => {
        onDismiss(currentNotification.id);
      }, currentNotification.durationMs || 14000);
      return () => clearTimeout(timer);
    } else {
      setIsExpanded(false);
    }
  }, [currentNotification, onDismiss]);

  const handleTouchStart = (e: React.TouchEvent) => {
    setTouchStartX(e.touches[0].clientX);
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStartX === null || !currentNotification) return;
    const touchEndX = e.changedTouches[0].clientX;
    const diff = touchEndX - touchStartX;
    // Swipe right to dismiss (> 60px)
    if (diff > 60) {
      onDismiss(currentNotification.id);
    }
    setTouchStartX(null);
  };

  return (
    <div className="fixed top-2 left-1/2 -translate-x-1/2 z-[10000] pointer-events-none flex flex-col items-center">
      <AnimatePresence>
        {currentNotification && (
          <motion.div
            key={currentNotification.id}
            initial={{ scale: 0.7, y: -40, opacity: 0 }}
            animate={{ scale: 1, y: 0, opacity: 1 }}
            exit={{ scale: 0.8, y: -30, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 420, damping: 28 }}
            onTouchStart={handleTouchStart}
            onTouchEnd={handleTouchEnd}
            className="pointer-events-auto w-[92vw] max-w-md sm:max-w-lg bg-zinc-950/95 border border-orange-500/30 rounded-3xl shadow-[0_12px_40px_rgba(0,0,0,0.8),0_0_24px_rgba(249,115,22,0.18)] backdrop-blur-xl p-3.5 sm:p-4 text-white select-none overflow-hidden"
          >
            {/* Top Bar of the Island */}
            <div className="flex items-center justify-between gap-2.5 pb-2 border-b border-zinc-800/60">
              <div className="flex items-center gap-2 min-w-0">
                <div className="w-7 h-7 rounded-full bg-gradient-to-tr from-orange-500 to-amber-400 p-[1px] shrink-0 shadow-md shadow-orange-500/30">
                  <div className="w-full h-full bg-zinc-950 rounded-full flex items-center justify-center">
                    <Sparkles className="h-3.5 w-3.5 text-orange-400 animate-pulse" />
                  </div>
                </div>
                <div className="flex items-center gap-1.5 truncate">
                  <span className="text-xs font-bold tracking-tight text-white">Entalhe Inteligente</span>
                  <span className="text-[10px] font-mono font-medium px-1.5 py-0.5 rounded-full bg-orange-500/15 text-orange-400 border border-orange-500/30">
                    Prompt Automático
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-1 shrink-0">
                <button
                  type="button"
                  onClick={() => onDismiss(currentNotification.id)}
                  className="p-1 rounded-full text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors cursor-pointer"
                  title="Fechar (ou deslize para a direita no mobile)"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            </div>

            {/* Notification Content Body: "Agent: (resposta)" */}
            <div className="mt-2.5 space-y-2">
              <div className="text-xs sm:text-sm text-zinc-100 font-sans leading-relaxed break-words max-h-36 overflow-y-auto pr-1 select-text scrollbar-thin scrollbar-thumb-zinc-700">
                <span className="font-extrabold text-orange-400 mr-1.5">Agent:</span>
                <span>{currentNotification.message.replace(/^Agent:\s*/i, '')}</span>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-between pt-2 border-t border-zinc-800/40 text-[11px]">
                <span className="text-[10px] text-zinc-500 font-mono hidden sm:inline">
                  Deslize para a direita para dispensar
                </span>
                
                <div className="flex items-center gap-2 ml-auto">
                  <button
                    type="button"
                    onClick={() => {
                      if (onOpenConversation) {
                        onOpenConversation(currentNotification.conversationId);
                      }
                      onDismiss(currentNotification.id);
                    }}
                    className="px-3 py-1.5 rounded-xl bg-orange-500 hover:bg-orange-600 text-white font-semibold flex items-center gap-1.5 transition-all shadow-sm shadow-orange-500/30 cursor-pointer active:scale-95"
                  >
                    <MessageSquare className="h-3 w-3" />
                    <span>Ver na aba Agentes</span>
                    <ArrowRight className="h-3 w-3" />
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
