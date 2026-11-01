// System Notification & Background Alarm Manager for Life Organizer PWA
import { buildAllAlarms } from './alarmBuilder';
import { debouncedSyncAlarms, immediateCancelAlarm } from './alarmSync';

export async function requestNotificationPermission(): Promise<boolean> {
  if (typeof window === 'undefined' || !('Notification' in window)) {
    return false;
  }
  if (Notification.permission === 'granted') {
    return true;
  }
  if (Notification.permission !== 'denied') {
    const permission = await Notification.requestPermission();
    return permission === 'granted';
  }
  return false;
}

export async function sendSystemNotification(
  title: string,
  options?: NotificationOptions & { body?: string; tag?: string }
): Promise<boolean> {
  if (typeof window === 'undefined' || !('Notification' in window)) {
    return false;
  }

  const granted = await requestNotificationPermission();
  if (!granted) return false;

  // Always brand the notification with Life Organizer
  const resolvedTitle = title.includes('Life Organizer') ? title : `Life Organizer • ${title}`;

  const defaultOptions: NotificationOptions & { vibrate?: number[]; renotify?: boolean } = {
    icon: '/icon-192.png',
    badge: '/favicon-32x32.png',
    vibrate: [300, 100, 300, 100, 300],
    requireInteraction: true,
    renotify: true,
    ...options
  };

  try {
    if ('serviceWorker' in navigator) {
      const registration = await navigator.serviceWorker.ready;
      if (registration && registration.showNotification) {
        await registration.showNotification(resolvedTitle, defaultOptions);
        return true;
      }
    }
  } catch (err) {
    console.warn('SW showNotification fallback:', err);
  }

  // Fallback to standard window Notification
  try {
    const notif = new Notification(resolvedTitle, defaultOptions);
    notif.onclick = () => {
      try {
        window.focus();
        const customData = (options as any)?.data;
        if (customData?.openReview) {
          window.dispatchEvent(new CustomEvent('mbc_navigate_review', { detail: { type: customData.openReview } }));
        }
      } catch {}
    };
    return true;
  } catch (err) {
    console.error('Window Notification error:', err);
    return false;
  }
}

export interface ScheduledAlarmItem {
  id: string;
  title: string;
  body?: string;
  targetTimestamp?: number;
  scheduledDate?: string;
  scheduledTime?: string;
  dayOfWeek?: number;
  isEveryDay?: boolean;
}

function computeTargetTimestamp(scheduledTime?: string, scheduledDate?: string, dayOfWeek?: number): number | undefined {
  if (!scheduledTime || !scheduledTime.includes(':')) return undefined;
  const [hStr, mStr] = scheduledTime.split(':');
  const h = parseInt(hStr, 10);
  const m = parseInt(mStr, 10);
  if (isNaN(h) || isNaN(m)) return undefined;

  const now = new Date();
  let target: Date;

  if (scheduledDate && scheduledDate.includes('-')) {
    const [y, mon, d] = scheduledDate.split('-').map(Number);
    if (y && mon && d) {
      target = new Date(y, mon - 1, d, h, m, 0, 0);
    } else {
      target = new Date(now.getFullYear(), now.getMonth(), now.getDate(), h, m, 0, 0);
    }
  } else if (dayOfWeek !== undefined && dayOfWeek !== null && dayOfWeek >= 0) {
    const currentDay = now.getDay();
    const targetDay = dayOfWeek % 7;
    let daysAhead = (targetDay - currentDay + 7) % 7;
    target = new Date(now.getFullYear(), now.getMonth(), now.getDate() + daysAhead, h, m, 0, 0);
    if (daysAhead === 0 && target.getTime() <= now.getTime()) {
      target.setDate(target.getDate() + 7);
    }
  } else {
    target = new Date(now.getFullYear(), now.getMonth(), now.getDate(), h, m, 0, 0);
    if (target.getTime() <= now.getTime()) {
      target.setDate(target.getDate() + 1);
    }
  }

  return target.getTime();
}

export async function syncAlarmsToServiceWorker(payload: {
  reminders?: any[];
  dailyTasks?: any[];
  routine?: any[];
  gridRoutine?: Record<string, any>;
  notes?: any[];
  calendarNotes?: any[];
  dailySpaceEnabled?: boolean;
  dailySpaceTime?: string;
  backgroundEnabled?: boolean;
}, syncKey?: string) {
  if (typeof window === 'undefined' || !('serviceWorker' in navigator)) return;

  const alarms: ScheduledAlarmItem[] = [];

  const isBgEnabled = payload.backgroundEnabled !== false;

  // 1. Reminders (Pomodoro, Timer, Cronometer, Schedule)
  if (isBgEnabled && payload.reminders) {
    payload.reminders.forEach((r) => {
      if (r.status !== 'active' || r.paused) return;

      if (r.targetTimestamp) {
        const modeLabel = r.mode === 'pomodoro' ? '🍅' : r.mode === 'timer' ? '⏱️' : '⏰';
        alarms.push({
          id: r.id,
          title: `${modeLabel} ${r.title}`,
          body: r.description || `Timer/Alerta concluído! [${r.category || 'Geral'}]`,
          targetTimestamp: r.targetTimestamp
        });

        if (r.mode === 'pomodoro' && r.pomodoroPhaseEndTimestamp) {
          alarms.push({
            id: `${r.id}-pomo-phase`,
            title: r.pomodoroCurrentPhase === 'focus' ? `☕ Hora da Pausa! - ${r.title}` : `⚡ Fim da Pausa! - ${r.title}`,
            body: r.pomodoroCurrentPhase === 'focus' ? 'Ciclo de foco concluído! Hora de descansar.' : 'Fim do descanso! Volte ao foco.',
            targetTimestamp: r.pomodoroPhaseEndTimestamp
          });
        }
      } else if (r.scheduledTime) {
        alarms.push({
          id: r.id,
          title: `⏰ ${r.title}`,
          body: r.description || `Lembrete agendado para as ${r.scheduledTime}`,
          scheduledDate: r.scheduledDate,
          scheduledTime: r.scheduledTime,
          targetTimestamp: computeTargetTimestamp(r.scheduledTime, r.scheduledDate)
        });
      }
    });
  }

  // 2. Daily Tasks (Checklist Inegociável)
  if (isBgEnabled && payload.dailyTasks) {
    payload.dailyTasks.forEach((t) => {
      if (!t.reminderTime || t.completed) return;
      const dateForTask = t.isRecurring === false ? t.createdDate : undefined;
      alarms.push({
        id: `task-${t.id}`,
        title: `Lembrete de Tarefa: ${t.text}`,
        body: `Horário: ${t.reminderTime} | Pilar: ${t.category || 'Geral'}`,
        scheduledTime: t.reminderTime,
        scheduledDate: dateForTask,
        targetTimestamp: computeTargetTimestamp(t.reminderTime, dateForTask)
      });
    });
  }

  // 3. Routine Items & Grid Routine (Blocos de Rotina Diária)
  if (isBgEnabled) {
    if (payload.routine && Array.isArray(payload.routine)) {
      payload.routine.forEach((item) => {
        const timeToRemind = item.reminderTime || item.time;
        if (!timeToRemind) return;
        const isEvDay = item.isEveryDay ?? (item.dayOfWeek === undefined || item.dayOfWeek === -1 || item.dayOfWeek < 0);
        alarms.push({
          id: `routine-${item.id}`,
          title: `Lembrete de Rotina: ${item.task || item.text}`,
          body: `Horário planejado: ${item.time || timeToRemind} | Rotina Diária`,
          scheduledTime: timeToRemind,
          dayOfWeek: item.dayOfWeek,
          isEveryDay: isEvDay,
          targetTimestamp: computeTargetTimestamp(timeToRemind, undefined, isEvDay ? undefined : item.dayOfWeek)
        });
      });
    }

    if (payload.gridRoutine && typeof payload.gridRoutine === 'object') {
      Object.entries(payload.gridRoutine).forEach(([key, val]: [string, any]) => {
        if (!val || typeof val !== 'object' || !val.text) return;
        const timeStr = val.startTime || val.reminderTime || val.time;
        const parts = key.split('-');
        let dayOfWeek: number | undefined = undefined;
        if (parts.length >= 2) {
          const parsedDay = parseInt(parts[0], 10);
          if (!isNaN(parsedDay)) dayOfWeek = parsedDay;
        }
        if (timeStr) {
          const isEvDay = dayOfWeek === undefined || dayOfWeek < 0;
          alarms.push({
            id: `grid-routine-${key}`,
            title: `Rotina Diária: ${val.text}`,
            body: `Horário: ${timeStr} | Bloco de Rotina`,
            scheduledTime: timeStr,
            dayOfWeek: dayOfWeek,
            isEveryDay: isEvDay,
            targetTimestamp: computeTargetTimestamp(timeStr, undefined, isEvDay ? undefined : dayOfWeek)
          });
        }
      });
    }
  }

  // 4. Standalone Notes
  if (isBgEnabled && payload.notes) {
    payload.notes.forEach((n) => {
      if (!n.reminderTime || n.archived) return;
      alarms.push({
        id: `note-${n.id}`,
        title: `Lembrete de Nota: ${n.title}`,
        body: n.content ? n.content.substring(0, 100) : 'Lembrete de anotação',
        scheduledDate: n.reminderDate,
        scheduledTime: n.reminderTime,
        targetTimestamp: computeTargetTimestamp(n.reminderTime, n.reminderDate)
      });
    });
  }

  // 5. Calendar Notes
  if (isBgEnabled && payload.calendarNotes) {
    payload.calendarNotes.forEach((cn) => {
      if (!cn.reminderTime) return;
      alarms.push({
        id: `calnote-${cn.id}`,
        title: `Lembrete de Anotação: ${cn.title}`,
        body: cn.content ? cn.content.substring(0, 100) : 'Lembrete da Agenda',
        scheduledDate: cn.date,
        scheduledTime: cn.reminderTime,
        targetTimestamp: computeTargetTimestamp(cn.reminderTime, cn.date)
      });
    });
  }

  // 6. Meu Dia
  if (isBgEnabled && payload.dailySpaceEnabled !== false && payload.dailySpaceTime) {
    alarms.push({
      id: 'daily-space-reminder',
      title: 'Meu Dia',
      body: 'Hora de registrar suas reflexões do dia, checklist, orações e hábitos!',
      scheduledTime: payload.dailySpaceTime,
      targetTimestamp: computeTargetTimestamp(payload.dailySpaceTime)
    });
  }

  try {
    const postToWorker = (worker: ServiceWorker | null) => {
      if (worker) {
        worker.postMessage({
          type: 'SYNC_SCHEDULED_ALARMS',
          payload: alarms
        });
      }
    };

    if (navigator.serviceWorker.controller) {
      postToWorker(navigator.serviceWorker.controller);
    } else {
      navigator.serviceWorker.ready.then((registration) => {
        if (registration.active) {
          postToWorker(registration.active);
        }
      });
    }
  } catch (err) {
    console.error('[TRONUS] Failed to sync alarms to SW:', err);
  }

  // 2. Dispatch UTC-precise alarms to the server push scheduler
  try {
    const effectiveSyncKey = (typeof localStorage !== 'undefined' ? localStorage.getItem('mbc_sync_key') : undefined) || syncKey || 'GUEST';
    const serverAlarms = buildAllAlarms({
      reminders: payload.reminders,
      dailyTasks: payload.dailyTasks,
      routine: payload.routine,
      gridRoutine: payload.gridRoutine,
      notes: payload.notes,
      calendarNotes: payload.calendarNotes,
      dailySpaceEnabled: payload.dailySpaceEnabled,
      dailySpaceTime: payload.dailySpaceTime
    });

    debouncedSyncAlarms(serverAlarms, effectiveSyncKey);
  } catch (err) {
    console.warn('[TRONUS] Server Web Push sync warning:', err);
  }
}

function urlBase64ToUint8Array(base64String: string) {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

export async function registerWebPushSubscription(syncKey?: string): Promise<PushSubscription | null> {
  if (typeof window === 'undefined' || !('serviceWorker' in navigator) || !('PushManager' in window)) {
    return null;
  }

  const permission = await requestNotificationPermission();
  if (!permission) return null;

  try {
    const registration = await navigator.serviceWorker.ready;

    const vapidRes = await fetch('/api/push/vapid-public-key');
    if (!vapidRes.ok) return null;
    const { publicKey } = await vapidRes.json();
    if (!publicKey) return null;

    let subscription = await registration.pushManager.getSubscription();
    if (!subscription) {
      const convertedKey = urlBase64ToUint8Array(publicKey);
      subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: convertedKey
      });
    }

    if (subscription) {
      await fetch('/api/push/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          syncKey: syncKey || (typeof localStorage !== 'undefined' ? localStorage.getItem('mbc_sync_key') : undefined) || 'GUEST',
          subscription: subscription.toJSON()
        })
      });
    }

    return subscription;
  } catch (err) {
    console.warn('Failed to subscribe to Web Push:', err);
    return null;
  }
}
