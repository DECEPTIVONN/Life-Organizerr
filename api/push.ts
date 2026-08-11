import express from "express";
import webpush from "web-push";

// VAPID keys setup
let vapidPublicKey = process.env.VAPID_PUBLIC_KEY || "";
let vapidPrivateKey = process.env.VAPID_PRIVATE_KEY || "";
const vapidSubject = process.env.VAPID_SUBJECT || "mailto:admin@tronusplanner.app";

if (!vapidPublicKey || !vapidPrivateKey) {
  // Deterministic fallback VAPID keypair if env vars are missing
  const keys = webpush.generateVAPIDKeys();
  vapidPublicKey = keys.publicKey;
  vapidPrivateKey = keys.privateKey;
  console.log("[Web Push] Generated VAPID Keys dynamically.");
}

try {
  webpush.setVapidDetails(vapidSubject, vapidPublicKey, vapidPrivateKey);
} catch (err) {
  console.error("[Web Push] Error setting VAPID details:", err);
}

export interface PushSubscriptionItem {
  syncKey: string;
  subscription: webpush.PushSubscription;
  updatedAt: string;
}

export interface ScheduledServerAlarm {
  id: string;
  title: string;
  body: string;
  scheduledTime?: string;
  scheduledDate?: string;
  dayOfWeek?: number;
  isEveryDay?: boolean;
  targetTimestamp?: number;
}

// In-memory persistent stores for subscriptions and user scheduled alarms
const subscriptionsMap = new Map<string, webpush.PushSubscription[]>(); // syncKey -> array of subscriptions
const userAlarmsMap = new Map<string, ScheduledServerAlarm[]>(); // syncKey -> array of alarms
const serverNotifiedLog = new Set<string>(); // deduplication log key -> boolean

export const pushRouter = express.Router();

// 1. Get VAPID Public Key
pushRouter.get("/vapid-public-key", (req, res) => {
  res.json({ publicKey: vapidPublicKey });
});

// 2. Subscribe endpoint
pushRouter.post("/subscribe", (req, res) => {
  const { syncKey, subscription } = req.body || {};
  if (!subscription || !subscription.endpoint) {
    return res.status(400).json({ error: "Subscription object with endpoint is required." });
  }

  const key = (syncKey || "GUEST").trim().toUpperCase();
  const existing = subscriptionsMap.get(key) || [];

  // Deduplicate by endpoint
  const filtered = existing.filter((sub) => sub.endpoint !== subscription.endpoint);
  filtered.push(subscription);

  subscriptionsMap.set(key, filtered);
  console.log(`[Web Push] Device subscribed for syncKey: ${key} (Total subscriptions: ${filtered.length})`);

  res.json({ success: true, totalSubscriptions: filtered.length });
});

// 3. Unsubscribe endpoint
pushRouter.post("/unsubscribe", (req, res) => {
  const { syncKey, endpoint } = req.body || {};
  if (!endpoint) {
    return res.status(400).json({ error: "Endpoint is required." });
  }

  const key = (syncKey || "GUEST").trim().toUpperCase();
  const existing = subscriptionsMap.get(key) || [];
  const filtered = existing.filter((sub) => sub.endpoint !== endpoint);

  subscriptionsMap.set(key, filtered);
  res.json({ success: true, remainingSubscriptions: filtered.length });
});

// 4. Direct Push Notification trigger endpoint
pushRouter.post("/send", async (req, res) => {
  const { syncKey, title, body, icon, url, tag } = req.body || {};
  const key = (syncKey || "GUEST").trim().toUpperCase();
  const subs = subscriptionsMap.get(key) || [];

  if (subs.length === 0) {
    return res.status(404).json({ error: "No active push subscriptions found for this syncKey." });
  }

  const payload = JSON.stringify({
    title: title || "TRONUS Planner",
    body: body || "Você tem um novo lembrete!",
    icon: icon || "/icon-192.png",
    url: url || "/",
    tag: tag || `push-${Date.now()}`
  });

  let sentCount = 0;
  const expiredEndpoints: string[] = [];

  for (const sub of subs) {
    try {
      await webpush.sendNotification(sub, payload);
      sentCount++;
    } catch (err: any) {
      console.error("[Web Push] Send error:", err.statusCode || err.message);
      if (err.statusCode === 404 || err.statusCode === 410) {
        expiredEndpoints.push(sub.endpoint);
      }
    }
  }

  // Clean up expired subscriptions
  if (expiredEndpoints.length > 0) {
    const remaining = subs.filter((s) => !expiredEndpoints.includes(s.endpoint));
    subscriptionsMap.set(key, remaining);
  }

  res.json({ success: true, sentCount, totalSubscriptions: subs.length });
});

// 5. Sync User Alarms for Server-Side Scheduled Dispatch
pushRouter.post("/sync-alarms", (req, res) => {
  const { syncKey, alarms, subscription } = req.body || {};
  const key = (syncKey || "GUEST").trim().toUpperCase();

  if (subscription && subscription.endpoint) {
    const existing = subscriptionsMap.get(key) || [];
    const filtered = existing.filter((sub) => sub.endpoint !== subscription.endpoint);
    filtered.push(subscription);
    subscriptionsMap.set(key, filtered);
  }

  if (Array.isArray(alarms)) {
    userAlarmsMap.set(key, alarms);
    console.log(`[Web Push] Synced ${alarms.length} server alarms for syncKey: ${key}`);
  }

  res.json({ success: true, count: userAlarmsMap.get(key)?.length || 0 });
});

// --- Server-Side Background Push Alarm Worker ---
export function startServerPushAlarmWorker() {
  setInterval(async () => {
    try {
      const now = new Date();
      const pad = (n: number) => String(n).padStart(2, "0");
      const todayStr = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;
      const currentMinutesTotal = now.getHours() * 60 + now.getMinutes();
      const currentDayOfWeek = now.getDay();
      const nowMs = now.getTime();

      for (const [syncKey, alarms] of userAlarmsMap.entries()) {
        const subs = subscriptionsMap.get(syncKey);
        if (!subs || subs.length === 0) continue;

        for (const alarm of alarms) {
          if (!alarm) continue;

          let isDue = false;
          let notifKey = "";

          // Check Target Timestamp
          if (alarm.targetTimestamp) {
            const diffMs = nowMs - alarm.targetTimestamp;
            if (diffMs >= 0 && diffMs <= 10 * 60 * 1000) {
              isDue = true;
              notifKey = `server-ts-${syncKey}-${alarm.id}-${alarm.targetTimestamp}`;
            }
          }
          // Check HH:MM Time
          else if (alarm.scheduledTime && alarm.scheduledTime.includes(":")) {
            const [hStr, mStr] = alarm.scheduledTime.split(":");
            const alarmMinutes = parseInt(hStr, 10) * 60 + parseInt(mStr, 10);
            const diffMinutes = currentMinutesTotal - alarmMinutes;

            if (diffMinutes >= 0 && diffMinutes <= 10) {
              let shouldMatch = true;

              if (alarm.scheduledDate && alarm.scheduledDate !== todayStr) {
                shouldMatch = false;
              }

              if (alarm.dayOfWeek !== undefined && alarm.dayOfWeek !== null && alarm.dayOfWeek >= 0 && !alarm.isEveryDay) {
                if (alarm.dayOfWeek !== currentDayOfWeek) {
                  shouldMatch = false;
                }
              }

              if (shouldMatch) {
                isDue = true;
                notifKey = `server-time-${syncKey}-${alarm.id}-${todayStr}-${alarm.scheduledTime}`;
              }
            }
          }

          if (isDue && notifKey && !serverNotifiedLog.has(notifKey)) {
            serverNotifiedLog.add(notifKey);

            // Limit log size memory footprint
            if (serverNotifiedLog.size > 5000) {
              const items = Array.from(serverNotifiedLog);
              items.slice(0, 1000).forEach((k) => serverNotifiedLog.delete(k));
            }

            const payload = JSON.stringify({
              title: alarm.title || "TRONUS Planner",
              body: alarm.body || `Lembrete agendado para as ${alarm.scheduledTime || "agora"}`,
              icon: "/icon-192.png",
              url: "/",
              tag: `alarm-${alarm.id}`
            });

            const expiredEndpoints: string[] = [];
            for (const sub of subs) {
              try {
                await webpush.sendNotification(sub, payload);
                console.log(`[Web Push Worker] Sent background push notification for ${syncKey}: ${alarm.title}`);
              } catch (err: any) {
                if (err.statusCode === 404 || err.statusCode === 410) {
                  expiredEndpoints.push(sub.endpoint);
                }
              }
            }

            if (expiredEndpoints.length > 0) {
              const remaining = subs.filter((s) => !expiredEndpoints.includes(s.endpoint));
              subscriptionsMap.set(syncKey, remaining);
            }
          }
        }
      }
    } catch (err) {
      console.error("[Web Push Worker] Interval error:", err);
    }
  }, 30000); // Check every 30 seconds
}
