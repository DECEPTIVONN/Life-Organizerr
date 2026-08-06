// Service Worker for TRONUS Planner PWA (Offline & Background Notification/Alarm Support)
const CACHE_NAME = 'tronus-planner-pwa-v5';
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/favicon.ico',
  '/favicon-32x32.png',
  '/favicon-16x16.png',
  '/apple-touch-icon.png',
  '/icon-192.png',
  '/icon-512.png',
  '/manifest.json',
  '/assets/tronus_icon.jpg'
];

// --- IndexedDB Persistent Alarm Store for SW Background Worker ---
const DB_NAME = 'tronus_sw_alarms_db';
const DB_VERSION = 1;
const STORE_ALARMS = 'scheduled_alarms';
const STORE_LOG = 'notified_log';

function openAlarmsDB() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onupgradeneeded = (event) => {
      const db = event.target.result;
      if (!db.objectStoreNames.contains(STORE_ALARMS)) {
        db.createObjectStore(STORE_ALARMS, { keyPath: 'id' });
      }
      if (!db.objectStoreNames.contains(STORE_LOG)) {
        db.createObjectStore(STORE_LOG, { keyPath: 'key' });
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

async function saveAlarmsToDB(alarms) {
  try {
    const db = await openAlarmsDB();
    const tx = db.transaction(STORE_ALARMS, 'readwrite');
    const store = tx.objectStore(STORE_ALARMS);
    store.clear();
    for (const alarm of alarms) {
      if (alarm && alarm.id) {
        store.put(alarm);
      }
    }
  } catch (e) {
    console.error('[TRONUS SW] saveAlarmsToDB error:', e);
  }
}

async function getAlarmsFromDB() {
  try {
    const db = await openAlarmsDB();
    return new Promise((resolve) => {
      const tx = db.transaction(STORE_ALARMS, 'readonly');
      const store = tx.objectStore(STORE_ALARMS);
      const req = store.getAll();
      req.onsuccess = () => resolve(req.result || []);
      req.onerror = () => resolve([]);
    });
  } catch (e) {
    return [];
  }
}

async function isAlreadyNotified(key) {
  try {
    const db = await openAlarmsDB();
    return new Promise((resolve) => {
      const tx = db.transaction(STORE_LOG, 'readonly');
      const store = tx.objectStore(STORE_LOG);
      const req = store.get(key);
      req.onsuccess = () => resolve(!!req.result);
      req.onerror = () => resolve(false);
    });
  } catch (e) {
    return false;
  }
}

async function markAsNotified(key) {
  try {
    const db = await openAlarmsDB();
    const tx = db.transaction(STORE_LOG, 'readwrite');
    const store = tx.objectStore(STORE_LOG);
    store.put({ key, timestamp: Date.now() });
  } catch (e) {
    console.error('[TRONUS SW] markAsNotified error:', e);
  }
}

// --- Background Alarm Checking Loop ---
async function checkScheduledAlarms() {
  if (!self.registration || !self.registration.showNotification) return;

  const alarms = await getAlarmsFromDB();
  if (!alarms || alarms.length === 0) return;

  const nowMs = Date.now();
  const dNow = new Date();
  const pad = (n) => String(n).padStart(2, '0');
  const todayStr = `${dNow.getFullYear()}-${pad(dNow.getMonth() + 1)}-${pad(dNow.getDate())}`;
  const currentHHMM = `${pad(dNow.getHours())}:${pad(dNow.getMinutes())}`;
  const dayOfWeek = dNow.getDay(); // 0 = Dom, 1 = Seg, ...

  for (const item of alarms) {
    if (!item) continue;

    // Case 1: Exact timestamp triggers (Timer, Pomodoro, Cronometer targetTs)
    if (item.targetTimestamp) {
      if (nowMs >= item.targetTimestamp) {
        const notifKey = `ts-${item.id}-${item.targetTimestamp}`;
        if (!(await isAlreadyNotified(notifKey))) {
          await markAsNotified(notifKey);
          await self.registration.showNotification(item.title || 'TRONUS Planner', {
            body: item.body || 'Seu alarme/timer atingiu o tempo planejado!',
            icon: '/icon-192.png',
            badge: '/favicon-32x32.png',
            vibrate: [300, 100, 300, 100, 300],
            requireInteraction: true,
            renotify: true,
            tag: String(item.id),
            data: { url: '/' }
          });
        }
      }
    } 
    // Case 2: Scheduled Time triggers (HH:MM format)
    else if (item.scheduledTime) {
      if (item.scheduledTime === currentHHMM) {
        let shouldTrigger = true;

        if (item.scheduledDate && item.scheduledDate !== todayStr) {
          shouldTrigger = false;
        }

        if (item.dayOfWeek !== undefined && item.dayOfWeek !== dayOfWeek && !item.isEveryDay) {
          shouldTrigger = false;
        }

        if (shouldTrigger) {
          const notifKey = `time-${item.id}-${todayStr}-${currentHHMM}`;
          if (!(await isAlreadyNotified(notifKey))) {
            await markAsNotified(notifKey);
            await self.registration.showNotification(item.title || 'TRONUS Planner', {
              body: item.body || `Lembrete agendado para as ${item.scheduledTime}`,
              icon: '/icon-192.png',
              badge: '/favicon-32x32.png',
              vibrate: [300, 100, 300, 100, 300],
              requireInteraction: true,
              renotify: true,
              tag: String(item.id),
              data: { url: '/' }
            });
          }
        }
      }
    }
  }
}

// Check background alarms every 15 seconds
setInterval(() => {
  checkScheduledAlarms();
}, 15000);

// Service Worker Lifecycle
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(STATIC_ASSETS).catch((err) => {
        console.warn('[TRONUS SW] Pre-cache warning:', err);
      });
    })
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    Promise.all([
      caches.keys().then((cacheNames) => {
        return Promise.all(
          cacheNames.map((cacheName) => {
            if (cacheName !== CACHE_NAME) {
              return caches.delete(cacheName);
            }
          })
        );
      }),
      self.clients.claim()
    ]).then(() => {
      checkScheduledAlarms();
    })
  );
});

// Communication with Main App Thread
self.addEventListener('message', (event) => {
  if (!event.data) return;

  if (event.data.type === 'SYNC_SCHEDULED_ALARMS') {
    const alarms = event.data.payload || [];
    saveAlarmsToDB(alarms).then(() => {
      checkScheduledAlarms();
    });
  } else if (event.data.type === 'SHOW_NOTIFICATION') {
    const { title, options } = event.data;
    if (self.registration && self.registration.showNotification) {
      self.registration.showNotification(title, {
        icon: '/icon-192.png',
        badge: '/favicon-32x32.png',
        vibrate: [300, 100, 300, 100, 300],
        requireInteraction: true,
        renotify: true,
        ...options
      });
    }
  }
});

// Handle Background Notification Clicks (Focus/Open App)
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const urlToOpen = event.notification.data?.url || '/';

  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      for (const client of clientList) {
        if (client.url && 'focus' in client) {
          return client.focus();
        }
      }
      if (self.clients.openWindow) {
        return self.clients.openWindow(urlToOpen);
      }
    })
  );
});

// Background Sync / Periodic Sync event triggers
self.addEventListener('periodicsync', (event) => {
  if (event.tag === 'check-tronus-alarms') {
    event.waitUntil(checkScheduledAlarms());
  }
});

self.addEventListener('sync', (event) => {
  if (event.tag === 'check-tronus-alarms') {
    event.waitUntil(checkScheduledAlarms());
  }
});

// Offline Fetch Handler (SPA & Cache Strategy)
self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;
  if (!event.request.url.startsWith('http')) return;

  if (event.request.mode === 'navigate') {
    event.respondWith(
      fetch(event.request)
        .then((networkResponse) => {
          if (networkResponse && networkResponse.status === 200) {
            const responseToCache = networkResponse.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(event.request, responseToCache));
          }
          return networkResponse;
        })
        .catch(() => {
          return caches.match('/index.html').then((cached) => cached || caches.match(event.request));
        })
    );
    return;
  }

  event.respondWith(
    fetch(event.request)
      .then((networkResponse) => {
        if (networkResponse && networkResponse.status === 200) {
          const responseToCache = networkResponse.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(event.request, responseToCache));
        }
        return networkResponse;
      })
      .catch(() => {
        return caches.match(event.request).then((cachedResponse) => {
          if (cachedResponse) {
            return cachedResponse;
          }
          if (event.request.headers.get('accept')?.includes('text/html')) {
            return caches.match('/index.html');
          }
        });
      })
  );
});
