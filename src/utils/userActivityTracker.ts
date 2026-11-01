/**
 * Tracks user activity timestamps to automatically detect sleep routines:
 * 1. Bed time ("Deitou ontem"): Last access in the continuous window from 18:00 (previous day)
 *    until 03:00 (dawn of the target day).
 * 2. Wake-up time ("Acordou hoje"): First access in the morning window from 05:00 until 11:00
 *    of the target day.
 */

const STORAGE_KEY_MAP = 'mbc_last_access_by_date';
const STORAGE_SLEEP_MAP = 'mbc_sleep_tracker_map';

interface DaySleepActivity {
  lastNight?: string;    // HH:mm between 18:00 and 23:59
  lastDawn?: string;     // HH:mm between 00:00 and 02:59
  firstMorning?: string; // HH:mm between 05:00 and 10:59
}

function formatLocalDate(d: Date): string {
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

function formatLocalTime(d: Date): string {
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export function recordUserAccess(): void {
  if (typeof window === 'undefined') return;

  try {
    const now = new Date();
    const hour = now.getHours();
    const dateStr = formatLocalDate(now);
    const timeStr = formatLocalTime(now);

    // Retrieve sleep activity map
    const rawSleep = localStorage.getItem(STORAGE_SLEEP_MAP);
    const sleepMap: Record<string, DaySleepActivity> = rawSleep ? JSON.parse(rawSleep) : {};
    if (!sleepMap[dateStr]) {
      sleepMap[dateStr] = {};
    }

    let modified = false;

    // 1. Bedtime Detection Window:
    // A) Night access: 18:00 - 23:59
    if (hour >= 18) {
      sleepMap[dateStr].lastNight = timeStr;
      localStorage.setItem(`mbc_last_access_night_${dateStr}`, timeStr);
      localStorage.setItem(`mbc_last_access_after_18_${dateStr}`, timeStr); // legacy compatibility

      // Legacy map compatibility
      const rawLegacy = localStorage.getItem(STORAGE_KEY_MAP);
      const legacyMap: Record<string, string> = rawLegacy ? JSON.parse(rawLegacy) : {};
      legacyMap[dateStr] = timeStr;
      localStorage.setItem(STORAGE_KEY_MAP, JSON.stringify(legacyMap));

      modified = true;
    }

    // B) Dawn access: 00:00 - 02:59 (up until 03:00)
    if (hour < 3) {
      sleepMap[dateStr].lastDawn = timeStr;
      localStorage.setItem(`mbc_last_access_dawn_${dateStr}`, timeStr);
      modified = true;
    }

    // 2. Wake-up Detection Window: 05:00 - 10:59 (5hrs da manhã até 11hrs)
    if (hour >= 5 && hour < 11) {
      // First access of the morning
      if (!sleepMap[dateStr].firstMorning) {
        sleepMap[dateStr].firstMorning = timeStr;
        localStorage.setItem(`mbc_first_access_morning_${dateStr}`, timeStr);
        modified = true;
      }
    }

    if (modified) {
      // Keep up to 60 days of activity
      const keys = Object.keys(sleepMap).sort();
      if (keys.length > 60) {
        keys.slice(0, keys.length - 60).forEach((k) => delete sleepMap[k]);
      }
      localStorage.setItem(STORAGE_SLEEP_MAP, JSON.stringify(sleepMap));
    }
  } catch (e) {
    // Non-blocking localStorage error
  }
}

/**
 * Returns the automatically inferred bedtime ("deitou ontem") for targetDateStr:
 * Considers user activity from 18:00 of the previous day until 03:00 (dawn) of targetDateStr.
 * If targetDateStr had activity during dawn (< 03:00), that latest dawn access is returned.
 * Otherwise, the latest activity from yesterday after 18:00 is returned.
 */
export function getAutoBedTimeForDate(targetDateStr?: string): string | null {
  if (typeof window === 'undefined') return null;

  try {
    let baseDate: Date;
    if (targetDateStr && targetDateStr.includes('-')) {
      const [y, m, d] = targetDateStr.split('-').map(Number);
      baseDate = new Date(y, m - 1, d, 12, 0, 0);
    } else {
      baseDate = new Date();
    }

    const todayStr = formatLocalDate(baseDate);

    // Subtract 1 day to find yesterday
    const prevDate = new Date(baseDate.getTime());
    prevDate.setDate(prevDate.getDate() - 1);
    const yesterdayStr = formatLocalDate(prevDate);

    // 1. First priority: Check if user accessed the app during dawn of the target day (00:00 - 02:59)
    const directDawn = localStorage.getItem(`mbc_last_access_dawn_${todayStr}`);
    if (directDawn && directDawn.includes(':')) {
      const [hStr] = directDawn.split(':');
      const h = parseInt(hStr, 10);
      if (h < 3) return directDawn;
    }

    // 2. Second priority: Check if user accessed the app yesterday evening (18:00 - 23:59)
    const directNight = localStorage.getItem(`mbc_last_access_night_${yesterdayStr}`) ||
                        localStorage.getItem(`mbc_last_access_after_18_${yesterdayStr}`);
    if (directNight && directNight.includes(':')) {
      const [hStr] = directNight.split(':');
      const h = parseInt(hStr, 10);
      if (h >= 18) return directNight;
    }

    // 3. Fallback: Check consolidated sleep map
    const rawSleep = localStorage.getItem(STORAGE_SLEEP_MAP);
    if (rawSleep) {
      const sleepMap: Record<string, DaySleepActivity> = JSON.parse(rawSleep);
      // Dawn of target day
      if (sleepMap[todayStr]?.lastDawn) {
        const [hStr] = sleepMap[todayStr].lastDawn!.split(':');
        if (parseInt(hStr, 10) < 3) return sleepMap[todayStr].lastDawn!;
      }
      // Night of yesterday
      if (sleepMap[yesterdayStr]?.lastNight) {
        const [hStr] = sleepMap[yesterdayStr].lastNight!.split(':');
        if (parseInt(hStr, 10) >= 18) return sleepMap[yesterdayStr].lastNight!;
      }
    }

    // 4. Legacy map fallback
    const rawLegacy = localStorage.getItem(STORAGE_KEY_MAP);
    if (rawLegacy) {
      const legacyMap = JSON.parse(rawLegacy);
      const legacyTime = legacyMap[yesterdayStr];
      if (legacyTime && legacyTime.includes(':')) {
        const [hStr] = legacyTime.split(':');
        if (parseInt(hStr, 10) >= 18) return legacyTime;
      }
    }
  } catch (e) {
    // Non-blocking
  }

  return null;
}

/**
 * Legacy alias for backwards compatibility
 */
export function getLastAccessAfter18ForYesterday(targetDateStr?: string): string | null {
  return getAutoBedTimeForDate(targetDateStr);
}

/**
 * Returns the automatically inferred wake-up time ("acordou hoje") for targetDateStr:
 * Considers first recorded access between 05:00 and 11:00 (morning).
 */
export function getAutoWakeTimeForDate(targetDateStr?: string): string | null {
  if (typeof window === 'undefined') return null;

  try {
    let baseDate: Date;
    if (targetDateStr && targetDateStr.includes('-')) {
      const [y, m, d] = targetDateStr.split('-').map(Number);
      baseDate = new Date(y, m - 1, d, 12, 0, 0);
    } else {
      baseDate = new Date();
    }

    const dateStr = formatLocalDate(baseDate);

    // 1. Direct storage check
    const directMorning = localStorage.getItem(`mbc_first_access_morning_${dateStr}`);
    if (directMorning && directMorning.includes(':')) {
      const [hStr] = directMorning.split(':');
      const h = parseInt(hStr, 10);
      if (h >= 5 && h < 11) return directMorning;
    }

    // 2. Sleep map check
    const rawSleep = localStorage.getItem(STORAGE_SLEEP_MAP);
    if (rawSleep) {
      const sleepMap: Record<string, DaySleepActivity> = JSON.parse(rawSleep);
      const morningTime = sleepMap[dateStr]?.firstMorning;
      if (morningTime && morningTime.includes(':')) {
        const [hStr] = morningTime.split(':');
        const h = parseInt(hStr, 10);
        if (h >= 5 && h < 11) return morningTime;
      }
    }

    // 3. If target date is today and user is currently in the 05:00 - 11:00 window, record and return right now
    const now = new Date();
    if (formatLocalDate(now) === dateStr) {
      const h = now.getHours();
      if (h >= 5 && h < 11) {
        const timeNow = formatLocalTime(now);
        localStorage.setItem(`mbc_first_access_morning_${dateStr}`, timeNow);
        return timeNow;
      }
    }
  } catch (e) {
    // Non-blocking
  }

  return null;
}

let isTrackerInitialized = false;

export function initUserActivityTracker(): void {
  if (typeof window === 'undefined' || isTrackerInitialized) return;
  isTrackerInitialized = true;

  // Record initial load
  recordUserAccess();

  // Throttled tracking on user interaction
  let lastRecorded = 0;
  const handleActivity = () => {
    const now = Date.now();
    if (now - lastRecorded > 30000) { // every 30s at most
      lastRecorded = now;
      recordUserAccess();
    }
  };

  window.addEventListener('pointerdown', handleActivity, { passive: true });
  window.addEventListener('keydown', handleActivity, { passive: true });
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible') {
      recordUserAccess();
    }
  });

  // Keep alive interval while active tab
  setInterval(() => {
    if (document.visibilityState === 'visible') {
      recordUserAccess();
    }
  }, 60000); // Check every minute
}
