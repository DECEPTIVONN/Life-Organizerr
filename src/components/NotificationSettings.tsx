import React, { useState, useEffect } from 'react';
import {
  Bell,
  BellOff,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  Send,
  Clock,
  Smartphone,
  ShieldCheck,
  Info,
  ExternalLink
} from 'lucide-react';
import {
  getPlatformType,
  isIosStandalone,
  requestNotificationPermission,
  getOrRegisterPushSubscription,
  sendImmediateTestPush,
  scheduleTestAlarmInOneMinute,
  fetchPushDiagnostics
} from '../lib/alarmSync';
import { getUserTimezone } from '../lib/alarmBuilder';

interface NotificationSettingsProps {
  syncKey?: string;
  onAlarmsSyncRequest?: () => void;
}

export const NotificationSettings: React.FC<NotificationSettingsProps> = ({
  syncKey = 'GUEST',
  onAlarmsSyncRequest
}) => {
  const [permission, setPermission] = useState<NotificationPermission>('default');
  const [hasPushSupport, setHasPushSupport] = useState<boolean>(true);
  const [isStandalone, setIsStandalone] = useState<boolean>(false);
  const [swActive, setSwActive] = useState<boolean>(false);
  const [isSubscribed, setIsSubscribed] = useState<boolean>(false);
  const [diagnostics, setDiagnostics] = useState<any>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error' | 'info'; text: string } | null>(null);

  const platform = getPlatformType();
  const timezone = getUserTimezone();

  const loadStatus = async () => {
    if (typeof window === 'undefined') return;

    const pushSupported = 'serviceWorker' in navigator && 'PushManager' in window && 'Notification' in window;
    setHasPushSupport(pushSupported);

    if ('Notification' in window) {
      setPermission(Notification.permission);
    }

    setIsStandalone(isIosStandalone());

    if ('serviceWorker' in navigator) {
      const reg = await navigator.serviceWorker.getRegistration();
      setSwActive(!!reg?.active);

      if (reg) {
        const sub = await reg.pushManager.getSubscription();
        setIsSubscribed(!!sub);
      }
    }

    const diag = await fetchPushDiagnostics(syncKey);
    setDiagnostics(diag);
  };

  useEffect(() => {
    loadStatus();
  }, [syncKey]);

  const handleEnableNotifications = async () => {
    setLoading(true);
    setFeedback(null);
    try {
      const perm = await requestNotificationPermission();
      setPermission(perm);

      if (perm === 'granted') {
        const sub = await getOrRegisterPushSubscription();
        setIsSubscribed(!!sub);

        if (sub) {
          // Trigger immediate sync of all current alarms
          if (onAlarmsSyncRequest) onAlarmsSyncRequest();
          setFeedback({
            type: 'success',
            text: 'Notificações ativadas com sucesso! Seu dispositivo está registrado no servidor.'
          });
        } else {
          setFeedback({
            type: 'error',
            text: 'Permissão concedida, mas não foi possível registrar a assinatura Push. Verifique a conexão.'
          });
        }
      } else if (perm === 'denied') {
        setFeedback({
          type: 'error',
          text: 'As notificações foram bloqueadas no navegador. Para reativar, clique no cadeado da barra de endereço e permita notificações.'
        });
      }
    } catch (err: any) {
      setFeedback({ type: 'error', text: err.message || 'Erro ao ativar notificações.' });
    } finally {
      setLoading(false);
      loadStatus();
    }
  };

  const handleSendTestPush = async () => {
    setLoading(true);
    setFeedback(null);
    try {
      const res = await sendImmediateTestPush(syncKey);
      setFeedback({
        type: res.success ? 'success' : 'error',
        text: res.message
      });
    } catch (err: any) {
      setFeedback({ type: 'error', text: err.message || 'Falha ao enviar notificação de teste.' });
    } finally {
      setLoading(false);
      loadStatus();
    }
  };

  const handleScheduleTestAlarm = async () => {
    setLoading(true);
    setFeedback(null);
    try {
      const res = await scheduleTestAlarmInOneMinute(syncKey);
      setFeedback({
        type: res.success ? 'success' : 'error',
        text: res.message
      });
    } catch (err: any) {
      setFeedback({ type: 'error', text: err.message || 'Falha ao agendar alarme de teste.' });
    } finally {
      setLoading(false);
      loadStatus();
    }
  };

  const handleRepairConnection = async () => {
    setLoading(true);
    setFeedback(null);
    try {
      if ('serviceWorker' in navigator) {
        const reg = await navigator.serviceWorker.ready;
        const sub = await reg.pushManager.getSubscription();
        if (sub) {
          await sub.unsubscribe().catch(() => {});
        }
      }

      const newSub = await getOrRegisterPushSubscription();
      setIsSubscribed(!!newSub);

      if (onAlarmsSyncRequest) onAlarmsSyncRequest();

      setFeedback({
        type: 'success',
        text: 'Conexão reparada e subscrição renovada com o servidor!'
      });
    } catch (err: any) {
      setFeedback({ type: 'error', text: 'Erro ao reparar conexão: ' + err.message });
    } finally {
      setLoading(false);
      loadStatus();
    }
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 text-slate-100 shadow-xl space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-800 pb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
            <Bell className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              Central de Notificações em Segundo Plano
              <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-medium">
                VAPID Push
              </span>
            </h3>
            <p className="text-xs text-slate-400">
              Notificações que chegam mesmo com o navegador e o celular fechados ou bloqueados.
            </p>
          </div>
        </div>

        <button
          onClick={loadStatus}
          disabled={loading}
          title="Atualizar diagnóstico"
          className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {/* Feedback banner */}
      {feedback && (
        <div
          className={`p-3.5 rounded-xl text-xs flex items-start gap-2.5 border ${
            feedback.type === 'success'
              ? 'bg-emerald-950/40 border-emerald-800/60 text-emerald-300'
              : feedback.type === 'error'
              ? 'bg-rose-950/40 border-rose-800/60 text-rose-300'
              : 'bg-blue-950/40 border-blue-800/60 text-blue-300'
          }`}
        >
          {feedback.type === 'success' ? (
            <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400 mt-0.5" />
          ) : (
            <AlertTriangle className="w-4 h-4 shrink-0 text-rose-400 mt-0.5" />
          )}
          <div className="flex-1 leading-relaxed">{feedback.text}</div>
        </div>
      )}

      {/* Diagnostics Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {/* Permission */}
        <div className="bg-slate-950/60 border border-slate-800/80 rounded-xl p-3">
          <span className="text-[11px] text-slate-400 block mb-1">Permissão do Sistema</span>
          <div className="flex items-center gap-1.5">
            {permission === 'granted' ? (
              <span className="text-xs font-semibold text-emerald-400 flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5" /> Concedida
              </span>
            ) : permission === 'denied' ? (
              <span className="text-xs font-semibold text-rose-400 flex items-center gap-1">
                <AlertTriangle className="w-3.5 h-3.5" /> Bloqueada
              </span>
            ) : (
              <span className="text-xs font-semibold text-amber-400 flex items-center gap-1">
                Pendente
              </span>
            )}
          </div>
        </div>

        {/* Web Push Subscription */}
        <div className="bg-slate-950/60 border border-slate-800/80 rounded-xl p-3">
          <span className="text-[11px] text-slate-400 block mb-1">Inscrição Push (Servidor)</span>
          <div className="flex items-center gap-1.5">
            {isSubscribed ? (
              <span className="text-xs font-semibold text-emerald-400 flex items-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5" /> Conectado
              </span>
            ) : (
              <span className="text-xs font-semibold text-slate-400 flex items-center gap-1">
                Desconectado
              </span>
            )}
          </div>
        </div>

        {/* Timezone */}
        <div className="bg-slate-950/60 border border-slate-800/80 rounded-xl p-3">
          <span className="text-[11px] text-slate-400 block mb-1">Fuso Horário IANA</span>
          <span className="text-xs font-medium text-slate-200 truncate block" title={timezone}>
            {timezone}
          </span>
        </div>

        {/* Pending Alarms in Server */}
        <div className="bg-slate-950/60 border border-slate-800/80 rounded-xl p-3">
          <span className="text-[11px] text-slate-400 block mb-1">Alarmes no Servidor</span>
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-amber-400">
              {diagnostics?.pendingAlarmsCount ?? 0} agendado(s)
            </span>
            {diagnostics?.nextFireAt && (
              <span className="text-[10px] text-slate-400" title="Próximo disparo">
                {new Date(diagnostics.nextFireAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Primary Actions */}
      <div className="flex flex-wrap items-center gap-3">
        {permission !== 'granted' || !isSubscribed ? (
          <button
            onClick={handleEnableNotifications}
            disabled={loading || !hasPushSupport}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-semibold text-xs shadow-lg shadow-amber-500/20 transition-all cursor-pointer"
          >
            <Bell className="w-4 h-4" />
            Ativar Notificações no Aparelho
          </button>
        ) : (
          <>
            <button
              onClick={handleSendTestPush}
              disabled={loading}
              className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white text-xs font-medium border border-slate-700 transition-colors"
            >
              <Send className="w-3.5 h-3.5 text-amber-400" />
              Enviar Teste Imediato
            </button>

            <button
              onClick={handleScheduleTestAlarm}
              disabled={loading}
              className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white text-xs font-medium border border-slate-700 transition-colors"
            >
              <Clock className="w-3.5 h-3.5 text-amber-400" />
              Testar Alarme Agendado (+1 min)
            </button>

            <button
              onClick={handleRepairConnection}
              disabled={loading}
              className="flex items-center gap-2 px-3 py-2 rounded-xl bg-slate-800/60 hover:bg-slate-700/60 text-slate-400 hover:text-slate-200 text-xs font-medium border border-slate-800 transition-colors ml-auto"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              Reparar Conexão
            </button>
          </>
        )}
      </div>

      {/* Platform Instructions (conforming to Section 8 of Notificações.md) */}
      <div className="border-t border-slate-800/80 pt-4 space-y-3">
        {platform === 'ios' && (
          <div className="p-3.5 rounded-xl bg-blue-950/20 border border-blue-800/40 flex items-start gap-3">
            <Smartphone className="w-4 h-4 text-blue-400 shrink-0 mt-0.5" />
            <div className="text-xs text-slate-300 space-y-1">
              <p className="font-semibold text-blue-200">Requisito para iPhone / iPad (iOS 16.4+):</p>
              <p className="text-slate-400">
                O iOS só permite notificações com o site fechado se ele estiver instalado como app: toque em{' '}
                <strong className="text-white">Compartilhar</strong> no Safari e selecione{' '}
                <strong className="text-white">"Adicionar à Tela de Início"</strong>. Abra o app pelo ícone criado antes de ativar as notificações.
              </p>
            </div>
          </div>
        )}

        {platform === 'android' && (
          <div className="p-3.5 rounded-xl bg-amber-950/20 border border-amber-800/40 flex items-start gap-3">
            <Smartphone className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
            <div className="text-xs text-slate-300 space-y-1">
              <p className="font-semibold text-amber-200">Dica para Android (Xiaomi, Samsung, Motorola):</p>
              <p className="text-slate-400">
                Para evitar que a economia de bateria do fabricante atrase alarmes: abra as configurações do aparelho, vá em{' '}
                <strong className="text-white">Aplicativos → TRONUS → Bateria</strong> e selecione{' '}
                <strong className="text-white">"Sem restrições"</strong>.
              </p>
            </div>
          </div>
        )}

        {platform === 'windows' && (
          <div className="p-3.5 rounded-xl bg-slate-950/40 border border-slate-800/80 flex items-start gap-3">
            <Info className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
            <div className="text-xs text-slate-300 space-y-1">
              <p className="font-semibold text-slate-200">Dica para Windows (Chrome / Edge):</p>
              <p className="text-slate-400">
                Certifique-se de que a opção <strong className="text-white">"Continuar executando aplicativos em segundo plano"</strong> está ativa nas configurações do navegador para receber avisos mesmo sem nenhuma janela aberta.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
