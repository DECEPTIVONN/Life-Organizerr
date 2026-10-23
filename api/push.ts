import express from "express";
import rateLimit from "express-rate-limit";
import { z } from "zod";
import webpush from "web-push";
import {
  getVapidDetails,
  upsertSubscription,
  removeSubscription,
  replaceAlarms,
  patchAlarms,
  cancelAlarm,
  completeAlarm,
  snoozeAlarm,
  getSubscriptionsBySyncKey,
  getStats,
  ScheduledAlarmRecord
} from "../src/server/db";
import { rearm } from "../src/server/scheduler";

export const pushRouter = express.Router();

// Ensure JSON parsing with up to 256kb payload
pushRouter.use(express.json({ limit: "256kb" }));

// Rate limiter for push endpoints: max 120 requests per minute
const pushLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 120,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Too many push notification requests, please try again later." }
});

pushRouter.use(pushLimiter);

// -------------------------------------------------------------
// Validation Schemas
// -------------------------------------------------------------
const SubscribeSchema = z.object({
  syncKey: z.string().optional().default("GUEST"),
  subscription: z.object({
    endpoint: z.string().url(),
    keys: z.object({
      p256dh: z.string(),
      auth: z.string()
    })
  }),
  timezone: z.string().optional(),
  platform: z.enum(["android", "ios", "windows", "other"]).optional().default("other")
});

const SyncAlarmsSchema = z.object({
  syncKey: z.string().optional().default("GUEST"),
  mode: z.enum(["replace", "patch"]).optional().default("replace"),
  timezone: z.string().optional(),
  platform: z.string().optional(),
  subscription: z
    .object({
      endpoint: z.string().url(),
      keys: z.object({
        p256dh: z.string(),
        auth: z.string()
      })
    })
    .optional(),
  alarms: z
    .array(
      z.object({
        id: z.string(),
        fireAt: z.number(),
        title: z.string(),
        body: z.string().optional(),
        kind: z
          .enum([
            "task",
            "routine",
            "pomodoro",
            "timer",
            "reminder",
            "calendar",
            "note",
            "myday",
            "review"
          ])
          .optional()
          .default("reminder"),
        url: z.string().optional().default("/"),
        tag: z.string().optional(),
        recurrence: z.string().nullable().optional(),
        timezone: z.string().optional(),
        payload: z.string().nullable().optional(),
        version: z.number().optional()
      })
    )
    .optional()
    .default([]),
  removeIds: z.array(z.string()).optional().default([])
});

const SendTestSchema = z.object({
  syncKey: z.string().optional().default("GUEST"),
  title: z.string().optional().default("TRONUS Planner"),
  body: z.string().optional().default("Teste de notificação com o app fechado!"),
  url: z.string().optional().default("/"),
  tag: z.string().optional()
});

// -------------------------------------------------------------
// Endpoints
// -------------------------------------------------------------

// 1. GET /api/push/vapid-public-key
pushRouter.get("/vapid-public-key", (_req, res) => {
  const details = getVapidDetails();
  res.json({ publicKey: details.publicKey });
});

// 2. POST /api/push/subscribe
pushRouter.post("/subscribe", (req, res) => {
  const parseResult = SubscribeSchema.safeParse(req.body);
  if (!parseResult.success) {
    return res.status(400).json({ error: "Invalid subscription payload", details: parseResult.error.format() });
  }

  const { syncKey, subscription, timezone, platform } = parseResult.data;
  const userAgent = req.headers["user-agent"] || "";

  const record = upsertSubscription({
    sync_key: syncKey,
    endpoint: subscription.endpoint,
    p256dh: subscription.keys.p256dh,
    auth: subscription.keys.auth,
    timezone,
    platform,
    user_agent: userAgent
  });

  res.json({
    success: true,
    subscriptionId: record.id,
    syncKey: record.sync_key,
    platform: record.platform
  });
});

// 3. DELETE /api/push/subscription
pushRouter.delete("/subscription", (req, res) => {
  const endpoint = req.body?.endpoint || req.query?.endpoint;
  if (!endpoint || typeof endpoint !== "string") {
    return res.status(400).json({ error: "Endpoint parameter is required." });
  }

  const removed = removeSubscription(endpoint);
  res.json({ success: removed });
});

// 4. POST /api/push/sync-alarms
pushRouter.post("/sync-alarms", (req, res) => {
  const parseResult = SyncAlarmsSchema.safeParse(req.body);
  if (!parseResult.success) {
    return res.status(400).json({ error: "Invalid sync payload", details: parseResult.error.format() });
  }

  const { syncKey, mode, timezone, platform, subscription, alarms, removeIds } = parseResult.data;

  // If subscription is provided in the sync payload, update it automatically
  if (subscription) {
    upsertSubscription({
      sync_key: syncKey,
      endpoint: subscription.endpoint,
      p256dh: subscription.keys.p256dh,
      auth: subscription.keys.auth,
      timezone,
      platform,
      user_agent: req.headers["user-agent"]
    });
  }

  let totalActive = 0;

  if (mode === "replace") {
    const formattedAlarms: Partial<ScheduledAlarmRecord>[] = alarms.map((a) => ({
      id: a.id,
      fire_at: a.fireAt,
      title: a.title,
      body: a.body || "",
      kind: a.kind,
      url: a.url,
      tag: a.tag || `alarm-${a.id}`,
      recurrence: a.recurrence,
      timezone: a.timezone || timezone || "America/Sao_Paulo",
      payload: a.payload,
      version: a.version || 1
    }));

    const result = replaceAlarms(syncKey, formattedAlarms);
    totalActive = result.length;
  } else {
    // Mode patch
    const formattedAlarms: Partial<ScheduledAlarmRecord>[] = alarms.map((a) => ({
      id: a.id,
      fire_at: a.fireAt,
      title: a.title,
      body: a.body || "",
      kind: a.kind,
      url: a.url,
      tag: a.tag || `alarm-${a.id}`,
      recurrence: a.recurrence,
      timezone: a.timezone || timezone || "America/Sao_Paulo",
      payload: a.payload,
      version: a.version || 1
    }));

    patchAlarms(syncKey, formattedAlarms, removeIds);
  }

  // Wake the scheduler immediately so newly created or moved alarms are timed accurately
  rearm();

  const stats = getStats(syncKey);
  res.json({
    success: true,
    mode,
    activeAlarms: stats.pendingAlarmsCount,
    nextFireAt: stats.nextFireAt
  });
});

// 5. POST /api/push/send (Immediate test push)
pushRouter.post("/send", async (req, res) => {
  const parseResult = SendTestSchema.safeParse(req.body);
  if (!parseResult.success) {
    return res.status(400).json({ error: "Invalid test payload", details: parseResult.error.format() });
  }

  const { syncKey, title, body, url, tag } = parseResult.data;
  const subs = getSubscriptionsBySyncKey(syncKey);

  if (subs.length === 0) {
    return res.status(404).json({
      error: "No registered push subscriptions found for this syncKey. Please activate notifications on this device first."
    });
  }

  const payload = JSON.stringify({
    title,
    body,
    icon: "/icon-192.png",
    badge: "/favicon-32x32.png",
    url,
    tag: tag || `test-${Date.now()}`,
    fireAt: Date.now(),
    vibrate: [200, 100, 200, 100, 400],
    actions: [{ action: "open", title: "Abrir App" }]
  });

  let sentCount = 0;
  for (const sub of subs) {
    try {
      await webpush.sendNotification(
        {
          endpoint: sub.endpoint,
          keys: { p256dh: sub.p256dh, auth: sub.auth }
        },
        payload,
        {
          TTL: 60,
          urgency: "high"
        }
      );
      sentCount++;
    } catch (err: any) {
      console.error("[Web Push Test] Error:", err.statusCode || err.message);
    }
  }

  res.json({ success: true, sentCount, totalSubscriptions: subs.length });
});

// 6. POST /api/push/snooze (Notification Action handler)
pushRouter.post("/snooze", (req, res) => {
  const { alarmId, minutes } = req.body || {};
  if (!alarmId) {
    return res.status(400).json({ error: "alarmId is required." });
  }

  const snoozeMins = parseInt(minutes, 10) || 10;
  const snoozed = snoozeAlarm(String(alarmId), snoozeMins);
  if (snoozed) rearm();

  res.json({ success: snoozed, snoozedMinutes: snoozeMins });
});

// 7. POST /api/push/complete (Notification Action handler)
pushRouter.post("/complete", (req, res) => {
  const { alarmId, syncKey } = req.body || {};
  if (!alarmId) {
    return res.status(400).json({ error: "alarmId is required." });
  }

  if (syncKey) {
    cancelAlarm(syncKey, String(alarmId));
  } else {
    completeAlarm(String(alarmId));
  }
  rearm();

  res.json({ success: true });
});

// 8. GET /api/push/status (Diagnostics endpoint conforming to Section 10)
pushRouter.get("/status", (req, res) => {
  const syncKey = (req.query.syncKey as string) || "GUEST";
  const stats = getStats(syncKey);
  res.json(stats);
});
