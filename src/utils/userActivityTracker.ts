/**
 * Tracks user activity timestamps to automatically detect bed time from the previous night.
 * Requirement: If the user leaves "Deitou (ontem)" blank, the last access to the site on
 * the previous day (only after 18:00) should be considered and pre-filled.
 */

const STORAGE_KEY_MAP = 'mbc_last_access_by_date';

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

    // Only record accesses after 18:00 (18:00 - 23:59)
    if (hour >= 18) {
      const dateStr = formatLocalDate(now);
      const timeStr = formatLocalTime(now);

      // Save individual key for fast lookup
      localStorage.setItem(`mbc_last_access_after_18_${dateStr}`, timeStr);

      // Also maintain consolidated map
      const raw = localStorage.getItem(STORAGE_KEY_MAP);
      const map: Record<string, string> = raw ? JSON.parse(raw) : {};
      map[dateStr] = timeStr;

      // Keep only the last 30 days in the map to save storage
      const keys = Object.keys(map).sort();
      if (keys.length > 30) {
        keys.slice(0, keys.length - 30).forEach((k) => delete map[k]);
      }

      localStorage.setItem(STORAGE_KEY_MAP, JSON.stringify(map));
    }
  } catch (e) {
    // Non-blocking localStorage error
  }
}

/**
 * Returns the last recorded access time on the day before targetDateStr, strictly after 18:00.
 * If targetDateStr is omitted, today is used.
 */
export function getLastAccessAfter18ForYesterday(targetDateStr?: string): string | null {
  if (typeof window === 'undefined') return null;

  try {
    let baseDate: Date;
    if (targetDateStr && targetDateStr.includes('-')) {
      const [y, m, d] = targetDateStr.split('-').map(Number);
      baseDate = new Date(y, m - 1, d, 12, 0, 0);
    } else {
      baseDate = new Date();
    }

    // Subtract 1 day to find yesterday
    baseDate.setDate(baseDate.getDate() - 1);
    const yesterdayStr = formatLocalDate(baseDate);

    // 1. Try direct key
    const directTime = localStorage.getItem(`mbc_last_access_after_18_${yesterdayStr}`);
    if (directTime && directTime.includes(':')) {
      const [hStr] = directTime.split(':');
      const h = parseInt(hStr, 10);
      if (h >= 18) return directTime;
    }

    // 2. Try map fallback
    const raw = localStorage.getItem(STORAGE_KEY_MAP);
    if (raw) {
      const map = JSON.parse(raw);
      const time = map[yesterdayStr];
      if (time && time.includes(':')) {
        const [hStr] = time.split(':');
        const h = parseInt(hStr, 10);
        if (h >= 18) return time;
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
