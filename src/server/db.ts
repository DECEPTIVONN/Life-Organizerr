import fs from "fs";
import path from "path";
import crypto from "crypto";
import webpush from "web-push";

// Persistent Data Directory
const DATA_DIR = process.env.DATA_DIR || path.join(process.cwd(), "data");

if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

// -------------------------------------------------------------
// 1. Persistent VAPID Key Management
// -------------------------------------------------------------
const VAPID_FILE = path.join(DATA_DIR, "vapid.json");

export interface VapidDetails {
  publicKey: string;
  privateKey: string;
  subject: string;
}

let cachedVapid: VapidDetails | null = null;

export function getVapidDetails(): VapidDetails {
  if (cachedVapid) return cachedVapid;

  const envPublic = process.env.VAPID_PUBLIC_KEY;
  const envPrivate = process.env.VAPID_PRIVATE_KEY;
  const subject = process.env.VAPID_SUBJECT || "mailto:admin@tronusplanner.app";

  if (envPublic && envPrivate) {
    cachedVapid = { publicKey: envPublic, privateKey: envPrivate, subject };
    webpush.setVapidDetails(subject, envPublic, envPrivate);
    return cachedVapid;
  }

  // Check persistent file
  if (fs.existsSync(VAPID_FILE)) {
    try {
      const data = JSON.parse(fs.readFileSync(VAPID_FILE, "utf-8"));
      if (data.publicKey && data.privateKey) {
        cachedVapid = {
          publicKey: data.publicKey,
          privateKey: data.privateKey,
          subject: data.subject || subject
        };
        webpush.setVapidDetails(cachedVapid.subject, cachedVapid.publicKey, cachedVapid.privateKey);
        console.log("[Web Push DB] Loaded persistent VAPID keys from disk.");
        return cachedVapid;
      }
    } catch (err) {
      console.error("[Web Push DB] Error reading vapid.json, will regenerate:", err);
    }
  }

  // Generate once and persist to disk
  const generated = webpush.generateVAPIDKeys();
  const details: VapidDetails = {
    publicKey: generated.publicKey,
    privateKey: generated.privateKey,
    subject
  };

  try {
    fs.writeFileSync(VAPID_FILE, JSON.stringify(details, null, 2), "utf-8");
    console.log("[Web Push DB] Generated and saved persistent VAPID keys to disk.");
  } catch (err) {
    console.error("[Web Push DB] Could not write vapid.json:", err);
  }

  cachedVapid = details;
  webpush.setVapidDetails(subject, details.publicKey, details.privateKey);
  return cachedVapid;
}

// -------------------------------------------------------------
// 2. Data Types conforming to Notificações.md
// -------------------------------------------------------------
export interface PushSubscriptionRecord {
  id: string; // sha256 hash of endpoint
  sync_key: string;
  endpoint: string;
  p256dh: string;
  auth: string;
  timezone: string;
  platform: string; // 'android' | 'ios' | 'windows' | 'other'
  user_agent?: string;
  created_at: number;
  last_seen_at: number;
  last_success_at: number | null;
  fail_count: number;
}

export type AlarmKind =
  | "task"
  | "routine"
  | "pomodoro"
  | "timer"
  | "reminder"
  | "calendar"
  | "note"
  | "myday"
  | "review";

export type AlarmStatus = "pending" | "sent" | "cancelled";

export interface ScheduledAlarmRecord {
  id: string; // client stable id
  sync_key: string;
  fire_at: number; // epoch ms UTC of next occurrence
  title: string;
  body: string;
  kind: AlarmKind;
  url: string;
  tag: string;
  recurrence?: string | null; // JSON string: { freq, byDay, time, until }
  timezone: string;
  payload?: string | null;
  version: number;
  status: AlarmStatus;
  created_at: number;
  updated_at: number;
}

export interface DeliveryRecord {
  alarm_id: string;
  sync_key: string;
  fire_at: number;
  sub_id: string;
  sent_at: number;
  http_status: number;
}

interface DatabaseState {
  subscriptions: Record<string, PushSubscriptionRecord>; // endpoint -> record
  alarms: Record<string, ScheduledAlarmRecord>; // `${sync_key}:${id}` -> record
  deliveries: Record<string, DeliveryRecord>; // `${alarm_id}:${sync_key}:${fire_at}:${sub_id}` -> record
}

// -------------------------------------------------------------
// 3. Database Engine with Atomic Disk Persistence
// -------------------------------------------------------------
const DB_FILE = path.join(DATA_DIR, "tronus_notifications.json");

let state: DatabaseState = {
  subscriptions: {},
  alarms: {},
  deliveries: {}
};

let saveDebounceTimer: NodeJS.Timeout | null = null;

function loadFromDisk() {
  if (fs.existsSync(DB_FILE)) {
    try {
      const raw = fs.readFileSync(DB_FILE, "utf-8");
      const parsed = JSON.parse(raw);
      state = {
        subscriptions: parsed.subscriptions || {},
        alarms: parsed.alarms || {},
        deliveries: parsed.deliveries || {}
      };
      console.log(
        `[Web Push DB] Loaded ${Object.keys(state.subscriptions).length} subscriptions and ${
          Object.keys(state.alarms).length
        } alarms from disk.`
      );
    } catch (err) {
      console.error("[Web Push DB] Failed to parse database file, starting clean:", err);
    }
  }
}

function flushToDiskSync() {
  try {
    const tempFile = `${DB_FILE}.tmp.${Date.now()}`;
    fs.writeFileSync(tempFile, JSON.stringify(state, null, 2), "utf-8");
    fs.renameSync(tempFile, DB_FILE);
  } catch (err) {
    console.error("[Web Push DB] Error writing to disk:", err);
  }
}

function scheduleSave() {
  if (saveDebounceTimer) return;
  saveDebounceTimer = setTimeout(() => {
    saveDebounceTimer = null;
    flushToDiskSync();
  }, 100);
}

// Initialize on boot
loadFromDisk();
getVapidDetails();

export function hashEndpoint(endpoint: string): string {
  return crypto.createHash("sha256").update(endpoint).digest("hex").slice(0, 32);
}

// -------------------------------------------------------------
// 4. Subscriptions API
// -------------------------------------------------------------
export function upsertSubscription(data: {
  sync_key: string;
  endpoint: string;
  p256dh: string;
  auth: string;
  timezone?: string;
  platform?: string;
  user_agent?: string;
}): PushSubscriptionRecord {
  const syncKey = (data.sync_key || "GUEST").trim().toUpperCase();
  const endpoint = data.endpoint.trim();
  const id = hashEndpoint(endpoint);
  const now = Date.now();

  const existing = state.subscriptions[endpoint];

  const record: PushSubscriptionRecord = {
    id,
    sync_key: syncKey,
    endpoint,
    p256dh: data.p256dh,
    auth: data.auth,
    timezone: data.timezone || existing?.timezone || "America/Sao_Paulo",
    platform: data.platform || existing?.platform || "other",
    user_agent: data.user_agent || existing?.user_agent,
    created_at: existing ? existing.created_at : now,
    last_seen_at: now,
    last_success_at: existing?.last_success_at || null,
    fail_count: 0 // Reset fail count on successful contact/refresh
  };

  state.subscriptions[endpoint] = record;
  scheduleSave();
  return record;
}

export function removeSubscription(endpoint: string): boolean {
  if (state.subscriptions[endpoint]) {
    delete state.subscriptions[endpoint];
    scheduleSave();
    return true;
  }
  return false;
}

export function getSubscriptionsBySyncKey(syncKey: string): PushSubscriptionRecord[] {
  const key = (syncKey || "GUEST").trim().toUpperCase();
  return Object.values(state.subscriptions).filter((s) => s.sync_key === key);
}

export function getAllSubscriptions(): PushSubscriptionRecord[] {
  return Object.values(state.subscriptions);
}

export function updateSubscriptionStatus(endpoint: string, success: boolean, statusCode?: number) {
  const sub = state.subscriptions[endpoint];
  if (!sub) return;

  if (success) {
    sub.last_success_at = Date.now();
    sub.fail_count = 0;
  } else {
    sub.fail_count = (sub.fail_count || 0) + 1;
    // Section 6.1: 404/410 => remove immediately; or remove after >= 5 fails
    if (statusCode === 404 || statusCode === 410 || sub.fail_count >= 5) {
      console.log(`[Web Push DB] Removing dead subscription ${sub.id} (HTTP ${statusCode}, fail_count: ${sub.fail_count})`);
      delete state.subscriptions[endpoint];
    }
  }
  scheduleSave();
}

// -------------------------------------------------------------
// 5. Alarms API
// -------------------------------------------------------------
export function replaceAlarms(syncKey: string, alarms: Partial<ScheduledAlarmRecord>[]): ScheduledAlarmRecord[] {
  const key = (syncKey || "GUEST").trim().toUpperCase();
  const now = Date.now();

  // Cancel all current pending alarms for this syncKey
  for (const alarmKey of Object.keys(state.alarms)) {
    if (alarmKey.startsWith(`${key}:`)) {
      if (state.alarms[alarmKey].status === "pending") {
        delete state.alarms[alarmKey];
      }
    }
  }

  const result: ScheduledAlarmRecord[] = [];

  for (const item of alarms) {
    if (!item.id || !item.fire_at) continue;

    const alarmRecord: ScheduledAlarmRecord = {
      id: String(item.id),
      sync_key: key,
      fire_at: Number(item.fire_at),
      title: item.title || "TRONUS",
      body: item.body || "Lembrete agendado",
      kind: item.kind || "reminder",
      url: item.url || "/",
      tag: item.tag || `alarm-${item.id}`,
      recurrence: item.recurrence || null,
      timezone: item.timezone || "America/Sao_Paulo",
      payload: item.payload || null,
      version: item.version || 1,
      status: "pending",
      created_at: now,
      updated_at: now
    };

    const compositeKey = `${key}:${alarmRecord.id}`;
    state.alarms[compositeKey] = alarmRecord;
    result.push(alarmRecord);
  }

  scheduleSave();
  return result;
}

export function patchAlarms(
  syncKey: string,
  upsertAlarms: Partial<ScheduledAlarmRecord>[] = [],
  removeIds: string[] = []
): { upserted: number; removed: number } {
  const key = (syncKey || "GUEST").trim().toUpperCase();
  const now = Date.now();
  let removedCount = 0;
  let upsertedCount = 0;

  for (const id of removeIds) {
    const compositeKey = `${key}:${id}`;
    if (state.alarms[compositeKey]) {
      state.alarms[compositeKey].status = "cancelled";
      state.alarms[compositeKey].updated_at = now;
      delete state.alarms[compositeKey];
      removedCount++;
    }
  }

  for (const item of upsertAlarms) {
    if (!item.id || !item.fire_at) continue;
    const compositeKey = `${key}:${item.id}`;
    const existing = state.alarms[compositeKey];

    const record: ScheduledAlarmRecord = {
      id: String(item.id),
      sync_key: key,
      fire_at: Number(item.fire_at),
      title: item.title || existing?.title || "TRONUS",
      body: item.body || existing?.body || "Lembrete",
      kind: item.kind || existing?.kind || "reminder",
      url: item.url || existing?.url || "/",
      tag: item.tag || existing?.tag || `alarm-${item.id}`,
      recurrence: item.recurrence !== undefined ? item.recurrence : existing?.recurrence || null,
      timezone: item.timezone || existing?.timezone || "America/Sao_Paulo",
      payload: item.payload !== undefined ? item.payload : existing?.payload || null,
      version: (existing?.version || 0) + 1,
      status: "pending",
      created_at: existing ? existing.created_at : now,
      updated_at: now
    };

    state.alarms[compositeKey] = record;
    upsertedCount++;
  }

  scheduleSave();
  return { upserted: upsertedCount, removed: removedCount };
}

export function cancelAlarm(syncKey: string, id: string): boolean {
  const key = (syncKey || "GUEST").trim().toUpperCase();
  const compositeKey = `${key}:${id}`;
  if (state.alarms[compositeKey]) {
    delete state.alarms[compositeKey];
    scheduleSave();
    return true;
  }
  return false;
}

export function completeAlarm(alarmId: string): boolean {
  let found = false;
  for (const key of Object.keys(state.alarms)) {
    if (state.alarms[key].id === alarmId || key.endsWith(`:${alarmId}`)) {
      delete state.alarms[key];
      found = true;
    }
  }
  if (found) scheduleSave();
  return found;
}

export function snoozeAlarm(alarmId: string, minutes: number = 10): boolean {
  const snoozeMs = minutes * 60 * 1000;
  const now = Date.now();
  let found = false;

  for (const key of Object.keys(state.alarms)) {
    if (state.alarms[key].id === alarmId || key.endsWith(`:${alarmId}`)) {
      state.alarms[key].fire_at = now + snoozeMs;
      state.alarms[key].status = "pending";
      state.alarms[key].updated_at = now;
      found = true;
    }
  }

  if (found) scheduleSave();
  return found;
}

export function getDueAlarms(nowMs: number = Date.now()): ScheduledAlarmRecord[] {
  return Object.values(state.alarms).filter(
    (a) => a.status === "pending" && a.fire_at <= nowMs
  );
}

export function nextDueAt(): number | null {
  const pending = Object.values(state.alarms).filter((a) => a.status === "pending");
  if (pending.length === 0) return null;
  return Math.min(...pending.map((a) => a.fire_at));
}

export function markAlarmSent(syncKey: string, id: string, nextFireAt?: number) {
  const compositeKey = `${syncKey}:${id}`;
  const alarm = state.alarms[compositeKey];
  if (!alarm) return;

  if (nextFireAt && nextFireAt > Date.now()) {
    alarm.fire_at = nextFireAt;
    alarm.status = "pending";
    alarm.updated_at = Date.now();
  } else {
    alarm.status = "sent";
    alarm.updated_at = Date.now();
    delete state.alarms[compositeKey]; // Finished single-fire alarm
  }
  scheduleSave();
}

// -------------------------------------------------------------
// 6. Deliveries API (Idempotency and Audit Log)
// -------------------------------------------------------------
export function isDelivered(alarmId: string, syncKey: string, fireAt: number, subId: string): boolean {
  const key = `${alarmId}:${syncKey}:${fireAt}:${subId}`;
  return !!state.deliveries[key];
}

export function recordDelivery(delivery: DeliveryRecord) {
  const key = `${delivery.alarm_id}:${delivery.sync_key}:${delivery.fire_at}:${delivery.sub_id}`;
  state.deliveries[key] = delivery;

  // Prune deliveries log if it exceeds 5000 items
  const entries = Object.keys(state.deliveries);
  if (entries.length > 5000) {
    entries.slice(0, 1000).forEach((k) => delete state.deliveries[k]);
  }

  scheduleSave();
}

// -------------------------------------------------------------
// 7. Status & Diagnostics API
// -------------------------------------------------------------
export function getStats(syncKey: string) {
  const key = (syncKey || "GUEST").trim().toUpperCase();
  const userSubs = getSubscriptionsBySyncKey(key);
  const userAlarms = Object.values(state.alarms).filter(
    (a) => a.sync_key === key && a.status === "pending"
  );
  const nextFire = userAlarms.length > 0 ? Math.min(...userAlarms.map((a) => a.fire_at)) : null;

  return {
    syncKey: key,
    subscriptionsCount: userSubs.length,
    subscriptions: userSubs.map((s) => ({
      id: s.id,
      platform: s.platform,
      timezone: s.timezone,
      lastSeenAt: s.last_seen_at,
      lastSuccessAt: s.last_success_at,
      failCount: s.fail_count
    })),
    pendingAlarmsCount: userAlarms.length,
    nextFireAt: nextFire,
    serverTimeUtc: Date.now()
  };
}
