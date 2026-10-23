import webpush from "web-push";
import { DateTime } from "luxon";
import {
  getDueAlarms,
  nextDueAt,
  getSubscriptionsBySyncKey,
  markAlarmSent,
  isDelivered,
  recordDelivery,
  updateSubscriptionStatus,
  ScheduledAlarmRecord,
  PushSubscriptionRecord
} from "./db";

let timer: NodeJS.Timeout | null = null;
let lastTickAt = Date.now();
let tickCount = 0;
let lastProcessedCount = 0;

const PUSH_TOLERANCE_MS = (parseInt(process.env.PUSH_TOLERANCE_MINUTES || "15", 10)) * 60 * 1000;
const MAX_DELAY_MS = 30_000; // 30s ceiling for clock shifts and manual edits

export function rearm() {
  if (timer) {
    clearTimeout(timer);
    timer = null;
  }

  const next = nextDueAt();
  const now = Date.now();
  let delay = MAX_DELAY_MS;

  if (next !== null) {
    const timeUntilNext = next - now;
    delay = Math.min(Math.max(timeUntilNext, 0), MAX_DELAY_MS);
  }

  timer = setTimeout(tick, delay);
}

function calculateNextRecurrence(
  recurrenceJson: string | null | undefined,
  currentFireAt: number,
  timeZone: string
): number | null {
  if (!recurrenceJson) return null;
  try {
    const parsed = JSON.parse(recurrenceJson);
    const { freq, byDay, time, until } = parsed;
    // freq: 'daily' | 'weekly' | 'weekdays' | 'monthly'
    const tz = timeZone || "America/Sao_Paulo";
    let dt = DateTime.fromMillis(currentFireAt, { zone: tz });

    if (freq === "daily") {
      dt = dt.plus({ days: 1 });
    } else if (freq === "weekdays") {
      do {
        dt = dt.plus({ days: 1 });
      } while (dt.weekday === 6 || dt.weekday === 7);
    } else if (freq === "weekly") {
      if (Array.isArray(byDay) && byDay.length > 0) {
        // byDay elements: 0=Sun, 1=Mon, ..., 6=Sat or 1=Mon..7=Sun
        // Advance day by day until matching
        let attempts = 0;
        let matched = false;
        while (attempts < 7) {
          dt = dt.plus({ days: 1 });
          attempts++;
          const luxonWeekday = dt.weekday; // 1=Mon ... 7=Sun
          const jsDay = luxonWeekday === 7 ? 0 : luxonWeekday;
          if (byDay.includes(jsDay) || byDay.includes(luxonWeekday)) {
            matched = true;
            break;
          }
        }
        if (!matched) dt = dt.plus({ weeks: 1 });
      } else {
        dt = dt.plus({ weeks: 1 });
      }
    } else if (freq === "monthly") {
      dt = dt.plus({ months: 1 });
    } else {
      return null;
    }

    if (time && time.includes(":")) {
      const [h, m] = time.split(":").map(Number);
      if (!isNaN(h) && !isNaN(m)) {
        dt = dt.set({ hour: h, minute: m, second: 0, millisecond: 0 });
      }
    }

    if (until && dt.toMillis() > new Date(until).getTime()) {
      return null;
    }

    return dt.toMillis();
  } catch (err) {
    console.error("[Scheduler] Error calculating recurrence:", err);
    return null;
  }
}

async function deliverAlarm(alarm: ScheduledAlarmRecord, now: number) {
  const syncKey = alarm.sync_key;
  const subs = getSubscriptionsBySyncKey(syncKey);

  // Check tolerance window for stale alarms
  const elapsedSinceDue = now - alarm.fire_at;
  if (elapsedSinceDue > PUSH_TOLERANCE_MS) {
    console.log(
      `[Scheduler] Discarding stale alarm ${alarm.id} (${alarm.title}) - expired ${Math.round(
        elapsedSinceDue / 60000
      )} min ago`
    );
    markAlarmSent(syncKey, alarm.id);
    return;
  }

  // Calculate next occurrence if recurring
  const nextOccurrence = calculateNextRecurrence(alarm.recurrence, alarm.fire_at, alarm.timezone);

  if (!subs || subs.length === 0) {
    // If no active subscriptions, mark sent or advance recurrence so we don't spin indefinitely
    markAlarmSent(syncKey, alarm.id, nextOccurrence || undefined);
    return;
  }

  // Construct standardized payload conforming to Notificações.md
  let actions: { action: string; title: string }[] = [];
  if (alarm.kind === "task" || alarm.kind === "reminder") {
    actions = [
      { action: "done", title: "✅ Concluir" },
      { action: "snooze", title: "⏰ Adiar 10 min" }
    ];
  } else if (alarm.kind === "pomodoro" || alarm.kind === "timer") {
    actions = [
      { action: "open", title: "▶️ Abrir" },
      { action: "snooze", title: "⏰ +5 min" }
    ];
  } else {
    actions = [{ action: "open", title: "📝 Abrir" }];
  }

  const payloadString = JSON.stringify({
    id: alarm.id,
    title: alarm.title || "TRONUS",
    body: alarm.body || "Lembrete do TRONUS",
    tag: alarm.tag || `alarm-${alarm.id}`,
    kind: alarm.kind,
    url: alarm.url || "/",
    fireAt: alarm.fire_at,
    vibrate: [200, 100, 200, 100, 400],
    actions
  });

  const sendPromises = subs.map(async (sub: PushSubscriptionRecord) => {
    // Check idempotency
    if (isDelivered(alarm.id, syncKey, alarm.fire_at, sub.id)) {
      return;
    }

    const pushSub = {
      endpoint: sub.endpoint,
      keys: {
        p256dh: sub.p256dh,
        auth: sub.auth
      }
    };

    // Retry with exponential backoff up to 3 attempts
    let attempt = 0;
    const maxAttempts = 3;
    let success = false;
    let lastStatusCode = 200;

    while (attempt < maxAttempts && !success) {
      attempt++;
      try {
        await webpush.sendNotification(pushSub, payloadString, {
          TTL: 60 * 60, // 1 hour TTL: if device is offline, delivers on reconnect
          urgency: "high", // Wakes Android in battery saver
          topic: alarm.tag.slice(0, 32) // Collapses duplicates on FCM/APNs
        });
        success = true;
        updateSubscriptionStatus(sub.endpoint, true);
        recordDelivery({
          alarm_id: alarm.id,
          sync_key: syncKey,
          fire_at: alarm.fire_at,
          sub_id: sub.id,
          sent_at: Date.now(),
          http_status: 200
        });
        console.log(`[Scheduler] Web Push delivered to ${sub.platform} (${sub.id.slice(0, 8)}): "${alarm.title}"`);
      } catch (err: any) {
        lastStatusCode = err.statusCode || 500;
        console.warn(
          `[Scheduler] Delivery attempt ${attempt} failed for ${sub.id.slice(0, 8)}: HTTP ${lastStatusCode} - ${
            err.message
          }`
        );

        if (lastStatusCode === 404 || lastStatusCode === 410) {
          // Immediately dead endpoint (uninstalled or permission revoked)
          updateSubscriptionStatus(sub.endpoint, false, lastStatusCode);
          break;
        }

        if (attempt < maxAttempts) {
          await new Promise((r) => setTimeout(r, Math.pow(2, attempt) * 500));
        } else {
          updateSubscriptionStatus(sub.endpoint, false, lastStatusCode);
        }
      }
    }
  });

  await Promise.allSettled(sendPromises);

  // Transition state: mark sent or set up next recurring occurrence
  markAlarmSent(syncKey, alarm.id, nextOccurrence || undefined);
}

async function tick() {
  lastTickAt = Date.now();
  tickCount++;

  try {
    const due = getDueAlarms(lastTickAt);
    lastProcessedCount = due.length;

    if (due.length > 0) {
      console.log(`[Scheduler] Tick #${tickCount} found ${due.length} due alarms to dispatch.`);
      // Process due alarms
      for (const alarm of due) {
        try {
          await deliverAlarm(alarm, lastTickAt);
        } catch (err) {
          console.error(`[Scheduler] Error delivering alarm ${alarm.id}:`, err);
        }
      }
    }
  } catch (err) {
    console.error("[Scheduler] Error in tick loop:", err);
  } finally {
    rearm();
  }
}

export function startScheduler() {
  console.log("[Scheduler] Starting precision push alarm scheduler...");
  rearm();
}

export function getSchedulerHealth() {
  return {
    status: "running",
    lastTickAt,
    secondsSinceLastTick: Math.round((Date.now() - lastTickAt) / 1000),
    totalTicks: tickCount,
    lastProcessedCount,
    nextDueAt: nextDueAt()
  };
}
