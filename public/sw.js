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
    const nowMs = Date.now();

    for (const alarm of alarms) {
      if (alarm && alarm.id) {
        store.put(alarm);

        // Schedule OS-native TimestampTrigger if supported by browser/device
        if (alarm.targetTimestamp && alarm.targetTimestamp > nowMs && self.registration && self.Notification && 'showTrigger' in self.Notification.prototype && self.TimestampTrigger) {
          try {
            self.registration.showNotification(alarm.title || 'TRONUS Planner', {
              body: alarm.body || 'Lembrete agendado',
              icon: '/icon-192.png',
              badge: '/favicon-32x32.png',
              vibrate: [300, 100, 300, 100, 300],
              requireInteraction: true,
              renotify: true,
              tag: String(alarm.id),
              showTrigger: new self.TimestampTrigger(alarm.targetTimestamp),
              data: { url: '/' }
            }).catch(() => {});
          } catch (e) {}
        }
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

function normalizeDateStr(dateStr) {
  if (!dateStr || typeof dateStr !== 'string') return '';
  const clean = dateStr.trim();
  if (clean.includes('/')) {
    const parts = clean.split('/');
    if (parts.length === 3) {
      return `${parts[2]}-${parts[1].padStart(2, '0')}-${parts[0].padStart(2, '0')}`;
    }
  }
  if (clean.includes('T')) {
    return clean.split('T')[0];
  }
  return clean;
}

function timeToMinutes(tStr) {
  if (!tStr || typeof tStr !== 'string' || !tStr.includes(':')) return -1;
  const parts = tStr.split(':');
  const h = parseInt(parts[0], 10);
  const m = parseInt(parts[1], 10);
  if (isNaN(h) || isNaN(m)) return -1;
  return h * 60 + m;
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
  const currentMinutesTotal = dNow.getHours() * 60 + dNow.getMinutes();
  const dayOfWeek = dNow.getDay(); // 0 = Dom, 1 = Seg, ...

  for (const item of alarms) {
    if (!item) continue;

    // Case 1: Target Timestamp triggers (Exact targetTs or calculated time)
    if (item.targetTimestamp) {
      const diffMs = nowMs - item.targetTimestamp;
      // Trigger if current time reached targetTimestamp and within 10 minutes catchup window
      if (diffMs >= 0 && diffMs <= 10 * 60 * 1000) {
        const notifKey = `ts-${item.id}-${item.targetTimestamp}`;
        if (!(await isAlreadyNotified(notifKey))) {
          await markAsNotified(notifKey);
          await self.registration.showNotification(item.title || 'TRONUS Planner', {
            body: item.body || 'Seu alarme/lembrete atingiu o horário agendado!',
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
      const itemMinutes = timeToMinutes(item.scheduledTime);
      if (itemMinutes >= 0) {
        const diffMinutes = currentMinutesTotal - itemMinutes;
        // Trigger if current time is within 0 to 10 minutes catchup window
        if (diffMinutes >= 0 && diffMinutes <= 10) {
          let shouldTrigger = true;

          if (item.scheduledDate) {
            const normDate = normalizeDateStr(item.scheduledDate);
            if (normDate && normDate !== todayStr) {
              shouldTrigger = false;
            }
          }

          if (item.dayOfWeek !== undefined && item.dayOfWeek !== null && item.dayOfWeek >= 0 && !item.isEveryDay) {
            if (item.dayOfWeek !== dayOfWeek) {
              shouldTrigger = false;
            }
          }

          if (shouldTrigger) {
            const notifKey = `time-${item.id}-${todayStr}-${item.scheduledTime}`;
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

// Web Push Event Handler (Server Push Notifications for Background Delivery)
self.addEventListener('push', (event) => {
  let data = {
    title: 'TRONUS Planner',
    body: 'Você tem um novo lembrete agendado!'
  };

  if (event.data) {
    try {
      data = event.data.json();
    } catch (e) {
      data = {
        title: 'TRONUS Planner',
        body: event.data.text()
      };
    }
  }

  const title = data.title || 'TRONUS Planner';
  const options = {
    body: data.body || 'Você possui um novo lembrete!',
    icon: data.icon || '/icon-192.png',
    badge: '/favicon-32x32.png',
    vibrate: [300, 100, 300, 100, 300],
    requireInteraction: true,
    renotify: true,
    tag: data.tag || 'web-push-reminder',
    data: { url: data.url || '/' }
  };

  event.waitUntil(
    self.registration.showNotification(title, options)
  );
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
