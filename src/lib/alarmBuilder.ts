import { DateTime } from 'luxon';

export interface ClientScheduledAlarm {
  id: string;
  fireAt: number; // UTC epoch ms
  title: string;
  body?: string;
  kind: 'task' | 'routine' | 'pomodoro' | 'timer' | 'reminder' | 'calendar' | 'note' | 'myday' | 'review';
  url: string;
  tag: string;
  recurrence?: string | null;
  timezone: string;
  version?: number;
}

export function getUserTimezone(): string {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone || 'America/Sao_Paulo';
  } catch {
    return 'America/Sao_Paulo';
  }
}

/**
 * Computes next UTC epoch timestamp for a given HH:MM time, optional YYYY-MM-DD date or dayOfWeek.
 */
export function computeNextFireAt(
  timeStr: string,
  dateStr?: string,
  dayOfWeek?: number,
  timeZone?: string
): number | null {
  if (!timeStr || !timeStr.includes(':')) return null;
  const [hStr, mStr] = timeStr.split(':');
  const h = parseInt(hStr, 10);
  const m = parseInt(mStr, 10);
  if (isNaN(h) || isNaN(m)) return null;

  const tz = timeZone || getUserTimezone();
  const now = DateTime.now().setZone(tz);

  if (dateStr && dateStr.includes('-')) {
    const [y, mon, d] = dateStr.split('-').map(Number);
    if (y && mon && d) {
      let target = DateTime.fromObject({ year: y, month: mon, day: d, hour: h, minute: m, second: 0, millisecond: 0 }, { zone: tz });
      return target.toMillis();
    }
  }

  if (dayOfWeek !== undefined && dayOfWeek !== null && dayOfWeek >= 0) {
    // 0 = Sunday, 1 = Monday ... 6 = Saturday in JS
    // Luxon: 1 = Monday ... 7 = Sunday
    const luxonTargetWeekday = dayOfWeek === 0 ? 7 : dayOfWeek;
    let target = now.set({ hour: h, minute: m, second: 0, millisecond: 0 });
    
    let daysToAdd = (luxonTargetWeekday - target.weekday + 7) % 7;
    if (daysToAdd === 0 && target.toMillis() <= now.toMillis()) {
      daysToAdd = 7;
    }
    target = target.plus({ days: daysToAdd });
    return target.toMillis();
  }

  // Daily occurrence: today or tomorrow
  let target = now.set({ hour: h, minute: m, second: 0, millisecond: 0 });
  if (target.toMillis() <= now.toMillis()) {
    target = target.plus({ days: 1 });
  }

  return target.toMillis();
}

/**
 * Builds the complete list of scheduled alarms across all application modules.
 */
export function buildAllAlarms(payload: {
  reminders?: any[];
  dailyTasks?: any[];
  routine?: any[];
  gridRoutine?: Record<string, any>;
  notes?: any[];
  calendarNotes?: any[];
  dailySpaceEnabled?: boolean;
  dailySpaceTime?: string;
  weeklyReviewEnabled?: boolean;
  monthlyReviewEnabled?: boolean;
}): ClientScheduledAlarm[] {
  const alarms: ClientScheduledAlarm[] = [];
  const tz = getUserTimezone();
  const now = DateTime.now().setZone(tz);
  const todayStr = now.toFormat('yyyy-MM-dd');

  // 1. Reminders Module (Pomodoro, Countdowns, Specific Reminders)
  if (payload.reminders && Array.isArray(payload.reminders)) {
    payload.reminders.forEach((r) => {
      if (r.status !== 'active' || r.paused) return;

      // Active Pomodoro or Running Timer
      if (r.targetTimestamp && r.targetTimestamp > Date.now()) {
        const isPomo = r.mode === 'pomodoro';
        const isTimer = r.mode === 'timer';
        const kind = isPomo ? 'pomodoro' : isTimer ? 'timer' : 'reminder';
        const tag = isPomo ? 'pomodoro' : `timer-${r.id}`;
        const url = isPomo ? '/#lembretes?tab=pomodoro' : `/#lembretes?tab=timer&id=${r.id}`;

        alarms.push({
          id: String(r.id),
          fireAt: r.targetTimestamp,
          title: isPomo ? `🍅 Pomodoro: ${r.title}` : `⏱️ Timer: ${r.title}`,
          body: r.description || (isPomo ? 'Ciclo de foco concluído!' : 'Tempo esgotado!'),
          kind,
          url,
          tag,
          timezone: tz
        });

        // Pomodoro Phase End Alarm
        if (isPomo && r.pomodoroPhaseEndTimestamp && r.pomodoroPhaseEndTimestamp > Date.now()) {
          const isFocus = r.pomodoroCurrentPhase === 'focus';
          alarms.push({
            id: `${r.id}-phase`,
            fireAt: r.pomodoroPhaseEndTimestamp,
            title: isFocus ? `☕ Hora da Pausa! • ${r.title}` : `⚡ Fim da Pausa! Volte ao Foco • ${r.title}`,
            body: isFocus ? 'Você completou seu bloco de trabalho. Descanse um pouco!' : 'Descanso finalizado. Vamos para o próximo ciclo!',
            kind: 'pomodoro',
            url: '/#lembretes?tab=pomodoro',
            tag: 'pomodoro-phase',
            timezone: tz
          });
        }
      } else if (r.scheduledTime) {
        // Scheduled point-in-time reminder
        const fireAt = computeNextFireAt(r.scheduledTime, r.scheduledDate, undefined, tz);
        if (fireAt && fireAt > Date.now()) {
          alarms.push({
            id: `reminder-${r.id}`,
            fireAt,
            title: `⏰ Lembrete: ${r.title}`,
            body: r.description || `Lembrete agendado para as ${r.scheduledTime}`,
            kind: 'reminder',
            url: `/#lembretes?id=${r.id}`,
            tag: `reminder-${r.id}`,
            recurrence: r.recurrence ? JSON.stringify({ freq: r.recurrence, time: r.scheduledTime }) : null,
            timezone: tz
          });
        }
      }
    });
  }

  // 2. Checklist Diário (Daily Tasks)
  if (payload.dailyTasks && Array.isArray(payload.dailyTasks)) {
    payload.dailyTasks.forEach((t) => {
      if (t.completed || !t.reminderTime) return;

      const dateForTask = t.isRecurring === false ? t.createdDate : undefined;
      const fireAt = computeNextFireAt(t.reminderTime, dateForTask, undefined, tz);

      if (fireAt && fireAt > Date.now()) {
        const dateTag = dateForTask || todayStr;
        alarms.push({
          id: `task-${t.id}`,
          fireAt,
          title: `Lembrete de Tarefa: ${t.text}`,
          body: `Horário: ${t.reminderTime} | Pilar: ${t.category || 'Geral'}`,
          kind: 'task',
          url: `/#checklist?taskId=${t.id}`,
          tag: `task-${t.id}-${dateTag}`,
          recurrence: t.isRecurring !== false ? JSON.stringify({ freq: 'daily', time: t.reminderTime }) : null,
          timezone: tz
        });
      }
    });
  }

  // 3. Rotina Diária & Grid Routine
  if (payload.routine && Array.isArray(payload.routine)) {
    payload.routine.forEach((item) => {
      const timeToRemind = item.reminderTime || item.time;
      if (!timeToRemind) return;

      const isEvDay = item.isEveryDay ?? (item.dayOfWeek === undefined || item.dayOfWeek === -1 || item.dayOfWeek < 0);
      const fireAt = computeNextFireAt(timeToRemind, undefined, isEvDay ? undefined : item.dayOfWeek, tz);

      if (fireAt && fireAt > Date.now()) {
        alarms.push({
          id: `routine-${item.id}`,
          fireAt,
          title: `Rotina: ${item.task || item.text}`,
          body: `Horário planejado: ${timeToRemind} | Bloco de Rotina`,
          kind: 'routine',
          url: '/#rotina',
          tag: `routine-${item.id}-${todayStr}`,
          recurrence: isEvDay
            ? JSON.stringify({ freq: 'daily', time: timeToRemind })
            : JSON.stringify({ freq: 'weekly', byDay: [item.dayOfWeek], time: timeToRemind }),
          timezone: tz
        });
      }
    });
  }

  if (payload.gridRoutine && typeof payload.gridRoutine === 'object') {
    Object.entries(payload.gridRoutine).forEach(([key, val]: [string, any]) => {
      if (!val || typeof val !== 'object' || !val.text) return;
      const timeStr = val.startTime || val.reminderTime || val.time;
      if (!timeStr) return;

      const parts = key.split('-');
      let dayOfWeek: number | undefined = undefined;
      if (parts.length >= 2) {
        const parsed = parseInt(parts[0], 10);
        if (!isNaN(parsed)) dayOfWeek = parsed;
      }

      const isEvDay = dayOfWeek === undefined || dayOfWeek < 0;
      const fireAt = computeNextFireAt(timeStr, undefined, isEvDay ? undefined : dayOfWeek, tz);

      if (fireAt && fireAt > Date.now()) {
        alarms.push({
          id: `grid-${key}`,
          fireAt,
          title: `Rotina: ${val.text}`,
          body: `Horário planejado: ${timeStr} | Bloco Semanal`,
          kind: 'routine',
          url: '/#rotina',
          tag: `grid-${key}-${todayStr}`,
          recurrence: isEvDay
            ? JSON.stringify({ freq: 'daily', time: timeStr })
            : JSON.stringify({ freq: 'weekly', byDay: [dayOfWeek], time: timeStr }),
          timezone: tz
        });
      }
    });
  }

  // 4. Standalone Notes
  if (payload.notes && Array.isArray(payload.notes)) {
    payload.notes.forEach((n) => {
      if (!n.reminderTime || n.archived) return;

      const fireAt = computeNextFireAt(n.reminderTime, n.reminderDate, undefined, tz);
      if (fireAt && fireAt > Date.now()) {
        alarms.push({
          id: `note-${n.id}`,
          fireAt,
          title: `Nota: ${n.title || 'Lembrete de Nota'}`,
          body: n.content ? n.content.slice(0, 100) : 'Lembrete de anotação rápida',
          kind: 'note',
          url: `/#notas?id=${n.id}`,
          tag: `note-${n.id}`,
          recurrence: n.reminderRecurrence && n.reminderRecurrence !== 'none'
            ? JSON.stringify({ freq: n.reminderRecurrence, time: n.reminderTime })
            : null,
          timezone: tz
        });
      }
    });
  }

  // 5. Calendar Notes
  if (payload.calendarNotes && Array.isArray(payload.calendarNotes)) {
    payload.calendarNotes.forEach((cn) => {
      if (!cn.reminderTime) return;

      const fireAt = computeNextFireAt(cn.reminderTime, cn.date, undefined, tz);
      if (fireAt && fireAt > Date.now()) {
        alarms.push({
          id: `cal-${cn.id}`,
          fireAt,
          title: `Agenda: ${cn.title}`,
          body: cn.content ? cn.content.slice(0, 100) : `Compromisso na data ${cn.date}`,
          kind: 'calendar',
          url: `/#agenda?date=${cn.date}`,
          tag: `cal-${cn.id}`,
          timezone: tz
        });
      }
    });
  }

  // 6. Meu Dia (Daily Workspace Reminder)
  if (payload.dailySpaceEnabled !== false && payload.dailySpaceTime) {
    const fireAt = computeNextFireAt(payload.dailySpaceTime, undefined, undefined, tz);
    if (fireAt && fireAt > Date.now()) {
      alarms.push({
        id: 'myday-daily',
        fireAt,
        title: 'Meu Dia • TRONUS',
        body: 'Hora de registrar suas reflexões do dia, checklist, orações e hábitos!',
        kind: 'myday',
        url: '/#meu-dia',
        tag: `myday-${todayStr}`,
        recurrence: JSON.stringify({ freq: 'daily', time: payload.dailySpaceTime }),
        timezone: tz
      });
    }
  }

  // 7. Weekly & Monthly Review Reminders
  if (payload.weeklyReviewEnabled !== false) {
    // Sundays at 18:00
    const weeklyFireAt = computeNextFireAt('18:00', undefined, 0, tz); // 0 = Sunday
    if (weeklyFireAt && weeklyFireAt > Date.now()) {
      alarms.push({
        id: 'review-weekly',
        fireAt: weeklyFireAt,
        title: 'Revisão Semanal • TRONUS',
        body: 'Fechamento de ciclo semanal! Revise seus objetivos e planeje a próxima semana.',
        kind: 'review',
        url: '/#revisoes',
        tag: `review-weekly-${now.weekNumber}`,
        recurrence: JSON.stringify({ freq: 'weekly', byDay: [0], time: '18:00' }),
        timezone: tz
      });
    }
  }

  return alarms;
}
