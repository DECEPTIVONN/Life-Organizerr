// System Notification & Background Alarm Manager for TRONUS Planner PWA

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
        await registration.showNotification(title, defaultOptions);
        return true;
      }
    }
  } catch (err) {
    console.warn('SW showNotification fallback:', err);
  }

  // Fallback to standard window Notification
  try {
    new Notification(title, defaultOptions);
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
}) {
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
          scheduledTime: r.scheduledTime
        });
      }
    });
  }

  // 2. Daily Tasks (Checklist Inegociável)
  if (isBgEnabled && payload.dailyTasks) {
    payload.dailyTasks.forEach((t) => {
      if (!t.reminderTime || t.completed) return;
      alarms.push({
        id: `task-${t.id}`,
        title: `Lembrete de Tarefa: ${t.text}`,
        body: `Horário: ${t.reminderTime} | Pilar: ${t.category || 'Geral'}`,
        scheduledTime: t.reminderTime,
        scheduledDate: t.isRecurring === false ? t.createdDate : undefined
      });
    });
  }

  // 3. Routine Items & Grid Routine (Blocos de Rotina Diária)
  if (isBgEnabled) {
    if (payload.routine && Array.isArray(payload.routine)) {
      payload.routine.forEach((item) => {
        const timeToRemind = item.reminderTime || item.time;
        if (!timeToRemind) return;
        alarms.push({
          id: `routine-${item.id}`,
          title: `Lembrete de Rotina: ${item.task || item.text}`,
          body: `Horário planejado: ${item.time || timeToRemind} | Rotina Diária`,
          scheduledTime: timeToRemind,
          dayOfWeek: item.dayOfWeek,
          isEveryDay: item.isEveryDay ?? (item.dayOfWeek === undefined || item.dayOfWeek === -1 || item.dayOfWeek < 0)
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
          alarms.push({
            id: `grid-routine-${key}`,
            title: `Rotina Diária: ${val.text}`,
            body: `Horário: ${timeStr} | Bloco de Rotina`,
            scheduledTime: timeStr,
            dayOfWeek: dayOfWeek,
            isEveryDay: dayOfWeek === undefined || dayOfWeek < 0
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
        scheduledTime: n.reminderTime
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
        scheduledTime: cn.reminderTime
      });
    });
  }

  // 6. Espaço Diário & Fé
  if (isBgEnabled && payload.dailySpaceEnabled !== false && payload.dailySpaceTime) {
    alarms.push({
      id: 'daily-space-reminder',
      title: 'Espaço Diário & Fé',
      body: 'Hora de registrar suas reflexões do dia, checklist, orações e hábitos!',
      scheduledTime: payload.dailySpaceTime
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
}
