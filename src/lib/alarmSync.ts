import { ClientScheduledAlarm, getUserTimezone } from './alarmBuilder';
import { enqueueMutation } from './indexedDbQueue';

let syncDebounceTimer: NodeJS.Timeout | null = null;
let lastSyncedSignature = '';

export function getPlatformType(): 'android' | 'ios' | 'windows' | 'other' {
  if (typeof window === 'undefined' || !navigator) return 'other';
  const ua = navigator.userAgent.toLowerCase();
  if (/iphone|ipad|ipod/.test(ua)) return 'ios';
  if (/android/.test(ua)) return 'android';
  if (/windows/.test(ua)) return 'windows';
  return 'other';
}

export function isIosStandalone(): boolean {
  if (typeof window === 'undefined') return false;
  const isIOS = /iphone|ipad|ipod/.test(navigator.userAgent.toLowerCase());
  const isStandalone =
    (window.navigator as any).standalone === true ||
    window.matchMedia('(display-mode: standalone)').matches;
  return isIOS && isStandalone;
}

export async function requestNotificationPermission(): Promise<NotificationPermission> {
  if (typeof window === 'undefined' || !('Notification' in window)) {
    return 'denied';
  }
  if (Notification.permission === 'granted') {
    return 'granted';
  }
  if (Notification.permission !== 'denied') {
    return await Notification.requestPermission();
  }
  return Notification.permission;
}

function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

export async function getOrRegisterPushSubscription(): Promise<PushSubscription | null> {
  if (
    typeof window === 'undefined' ||
    !('serviceWorker' in navigator) ||
    !('PushManager' in window)
  ) {
    return null;
  }

  if (Notification.permission !== 'granted') {
    return null;
  }

  try {
    const registration = await navigator.serviceWorker.ready;
    let subscription = await registration.pushManager.getSubscription();

    if (!subscription) {
      const res = await fetch('/api/push/vapid-public-key');
      if (!res.ok) return null;
      const { publicKey } = await res.json();
      if (!publicKey) return null;

      const convertedVapidKey = urlBase64ToUint8Array(publicKey);
      subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: convertedVapidKey
      });
    }

    return subscription;
  } catch (err) {
    console.warn('[TRONUS Push] Subscription registration error:', err);
    return null;
  }
}

/**
 * Sends a full or patched alarm synchronization to the server.
 */
export async function syncAlarmsToServer(
  alarms: ClientScheduledAlarm[],
  syncKey: string = 'GUEST',
  mode: 'replace' | 'patch' = 'replace',
  removeIds: string[] = []
): Promise<boolean> {
  const key = (syncKey || 'GUEST').trim().toUpperCase();
  const timezone = getUserTimezone();
  const platform = getPlatformType();

  // Also post to local Service Worker as opportunistic reinforcement
  try {
    if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
      const swAlarms = alarms.map((a) => ({
        id: a.id,
        title: a.title,
        body: a.body,
        targetTimestamp: a.fireAt,
        url: a.url,
        kind: a.kind
      }));

      const postMsg = (worker: ServiceWorker | null) => {
        if (worker) {
          worker.postMessage({
            type: 'SYNC_SCHEDULED_ALARMS',
            payload: swAlarms
          });
        }
      };

      if (navigator.serviceWorker.controller) {
        postMsg(navigator.serviceWorker.controller);
      } else {
        navigator.serviceWorker.ready.then((reg) => postMsg(reg.active));
      }
    }
  } catch (e) {
    // Non-blocking
  }

  try {
    const subscription = await getOrRegisterPushSubscription();

    const payload = {
      syncKey: key,
      mode,
      timezone,
      platform,
      subscription: subscription ? subscription.toJSON() : undefined,
      alarms,
      removeIds
    };

    const res = await fetch('/api/push/sync-alarms', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    if (!res.ok) {
      throw new Error(`Server returned HTTP ${res.status}`);
    }

    return true;
  } catch (err) {
    console.warn('[TRONUS AlarmSync] Failed to sync alarms with server, enqueuing offline retry:', err);
    // Enqueue for background retry via indexedDbQueue
    try {
      await enqueueMutation({
        syncKey: key,
        type: 'PUSH_ALARMS_SYNC',
        description: 'Sincronização de alarmes push offline',
        payload: {
          alarmsCount: alarms.length,
          timestamp: Date.now()
        }
      });
    } catch {}
    return false;
  }
}

/**
 * Debounced sync helper to prevent flooding on rapid edits.
 */
export function debouncedSyncAlarms(
  alarms: ClientScheduledAlarm[],
  syncKey: string = 'GUEST',
  delayMs: number = 500
) {
  const signature = JSON.stringify(alarms.map((a) => `${a.id}:${a.fireAt}`));
  if (signature === lastSyncedSignature) return;

  if (syncDebounceTimer) {
    clearTimeout(syncDebounceTimer);
  }

  syncDebounceTimer = setTimeout(async () => {
    syncDebounceTimer = null;
    const success = await syncAlarmsToServer(alarms, syncKey, 'replace');
    if (success) {
      lastSyncedSignature = signature;
    }
  }, delayMs);
}

/**
 * Fast-path immediate cancellation of an alarm on the server (e.g. task completed, timer stopped)
 */
export async function immediateCancelAlarm(alarmId: string, syncKey: string = 'GUEST'): Promise<boolean> {
  try {
    const res = await fetch('/api/push/complete', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ alarmId, syncKey })
    });
    return res.ok;
  } catch {
    return false;
  }
}

/**
 * Sends a direct test push notification immediately.
 */
export async function sendImmediateTestPush(syncKey: string = 'GUEST'): Promise<{ success: boolean; message: string }> {
  try {
    const sub = await getOrRegisterPushSubscription();
    if (!sub) {
      return {
        success: false,
        message: 'Nenhuma inscrição push ativa. Ative as notificações antes de testar.'
      };
    }

    const res = await fetch('/api/push/send', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        syncKey,
        title: 'TRONUS • Notificação de Teste',
        body: 'O Web Push está funcionando perfeitamente em segundo plano!',
        url: '/'
      })
    });

    const data = await res.json();
    if (res.ok && data.success) {
      return { success: true, message: `Notificação enviada com sucesso para ${data.sentCount} dispositivo(s)!` };
    }
    return { success: false, message: data.error || 'Erro ao enviar notificação de teste.' };
  } catch (err: any) {
    return { success: false, message: err.message || 'Erro de conexão com o servidor.' };
  }
}

/**
 * Schedules a test alarm for 1 minute from now to test server delivery with app closed.
 */
export async function scheduleTestAlarmInOneMinute(syncKey: string = 'GUEST'): Promise<{ success: boolean; message: string }> {
  try {
    const oneMinuteFromNow = Date.now() + 60 * 1000;
    const testAlarm: ClientScheduledAlarm = {
      id: `test-delayed-${Date.now()}`,
      fireAt: oneMinuteFromNow,
      title: 'TRONUS • Teste Agendado Concluído!',
      body: 'Este alarme foi disparado pelo servidor com o aplicativo em segundo plano.',
      kind: 'reminder',
      url: '/',
      tag: 'test-delayed',
      timezone: getUserTimezone()
    };

    const success = await syncAlarmsToServer([testAlarm], syncKey, 'patch');
    if (success) {
      return {
        success: true,
        message: 'Alarme de teste agendado para daqui a 1 minuto! Você pode fechar o app ou bloquear a tela agora.'
      };
    }
    return { success: false, message: 'Falha ao agendar teste no servidor.' };
  } catch (err: any) {
    return { success: false, message: err.message || 'Erro de rede ao agendar teste.' };
  }
}

/**
 * Diagnostics status fetcher
 */
export async function fetchPushDiagnostics(syncKey: string = 'GUEST') {
  try {
    const res = await fetch(`/api/push/status?syncKey=${encodeURIComponent(syncKey)}`);
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  }
}
