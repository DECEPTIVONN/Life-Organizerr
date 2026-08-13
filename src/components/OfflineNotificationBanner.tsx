import React, { useState, useEffect } from 'react';
import { Wifi, WifiOff, X, CheckCircle2, Database, RefreshCw } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { subscribeToMutationQueue, QueueStatus, processMutationQueue } from '../lib/indexedDbQueue';

export const OfflineNotificationBanner: React.FC = () => {
  const [isOnline, setIsOnline] = useState<boolean>(() => {
    return typeof navigator !== 'undefined' ? navigator.onLine : true;
  });
  const [wasOffline, setWasOffline] = useState<boolean>(false);
  const [showReconnected, setShowReconnected] = useState<boolean>(false);
  const [userDismissedOffline, setUserDismissedOffline] = useState<boolean>(false);
  const [queueStatus, setQueueStatus] = useState<QueueStatus>({
    pendingCount: 0,
    isProcessing: false,
    isOnline: true
  });

  useEffect(() => {
    const unsubscribe = subscribeToMutationQueue((status) => {
      setQueueStatus(status);
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    const handleOffline = () => {
      setIsOnline(false);
      setWasOffline(true);
      setShowReconnected(false);
      setUserDismissedOffline(false);
    };

    const handleOnline = () => {
      setIsOnline(true);
      processMutationQueue();
      if (wasOffline) {
        setShowReconnected(true);
        const timer = setTimeout(() => {
          setShowReconnected(false);
          setWasOffline(false);
        }, 5000);
        return () => clearTimeout(timer);
      }
    };

    window.addEventListener('offline', handleOffline);
    window.addEventListener('online', handleOnline);

    return () => {
      window.removeEventListener('offline', handleOffline);
      window.removeEventListener('online', handleOnline);
    };
  }, [wasOffline]);

  return (
    <AnimatePresence>
      {/* 1. Offline Banner with IndexedDB Mutation Queue Info */}
      {!isOnline && !userDismissedOffline && (
        <motion.div
          key="offline-banner"
          initial={{ opacity: 0, y: -50, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -20, scale: 0.95 }}
          transition={{ type: 'spring', damping: 25, stiffness: 350 }}
          className="fixed top-4 left-1/2 -translate-x-1/2 z-[9999] w-[92%] max-w-lg bg-zinc-950/95 border border-amber-500/40 text-amber-100 shadow-2xl shadow-amber-500/10 rounded-2xl p-3.5 backdrop-blur-md flex items-center justify-between gap-3"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center shrink-0">
              <WifiOff className="h-5 w-5 text-amber-400 stroke-[2.5] animate-pulse" />
            </div>
            <div className="flex flex-col">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-white tracking-wide">Você está offline</span>
                <span className="px-2 py-0.5 rounded-full text-[9px] font-extrabold uppercase bg-amber-500/20 text-amber-300 border border-amber-500/30 font-mono flex items-center gap-1">
                  <Database className="h-2.5 w-2.5" />
                  IndexedDB Ativo
                </span>
              </div>
              <p className="text-[11px] text-zinc-300 leading-tight mt-0.5">
                {queueStatus.pendingCount > 0
                  ? `${queueStatus.pendingCount} ${queueStatus.pendingCount === 1 ? 'alteração retida' : 'alterações retidas'} na fila local. Sincronização automática quando a rede voltar.`
                  : 'O app continua funcionando normalmente. Suas edições são salvas com segurança no IndexedDB.'}
              </p>
            </div>
          </div>

          <button
            onClick={() => setUserDismissedOffline(true)}
            className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-900 border border-transparent hover:border-zinc-800 transition-colors shrink-0"
            title="Fechar aviso"
          >
            <X className="h-4 w-4" />
          </button>
        </motion.div>
      )}

      {/* 2. Reconnected Message Toast with Auto-sync Confirmation */}
      {isOnline && showReconnected && (
        <motion.div
          key="reconnected-banner"
          initial={{ opacity: 0, y: -50, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -20, scale: 0.95 }}
          transition={{ type: 'spring', damping: 25, stiffness: 350 }}
          className="fixed top-4 left-1/2 -translate-x-1/2 z-[9999] w-[92%] max-w-lg bg-zinc-950/95 border border-emerald-500/40 text-emerald-100 shadow-2xl shadow-emerald-500/10 rounded-2xl p-3.5 backdrop-blur-md flex items-center justify-between gap-3"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center shrink-0">
              {queueStatus.isProcessing ? (
                <RefreshCw className="h-5 w-5 text-emerald-400 stroke-[2.5] animate-spin" />
              ) : (
                <Wifi className="h-5 w-5 text-emerald-400 stroke-[2.5]" />
              )}
            </div>
            <div className="flex flex-col">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-white tracking-wide flex items-center gap-1.5">
                  <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" />
                  Conexão Reestabelecida!
                </span>
                <span className="px-2 py-0.5 rounded-full text-[9px] font-extrabold uppercase bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 font-mono">
                  {queueStatus.isProcessing ? 'Sincronizando' : 'Online'}
                </span>
              </div>
              <p className="text-[11px] text-zinc-300 leading-tight mt-0.5">
                {queueStatus.isProcessing
                  ? 'Processando fila de mutações do IndexedDB...'
                  : 'Fila do IndexedDB sincronizada com a nuvem com sucesso!'}
              </p>
            </div>
          </div>

          <button
            onClick={() => setShowReconnected(false)}
            className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-900 border border-transparent hover:border-zinc-800 transition-colors shrink-0"
            title="Fechar aviso"
          >
            <X className="h-4 w-4" />
          </button>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
