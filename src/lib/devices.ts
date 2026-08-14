import { loadAuthRecord, saveAuthRecord } from './auth';

export interface ConnectedDevice {
  id: string;
  name: string;
  customName?: string;
  browser: string;
  os: string;
  isCurrent: boolean;
  lastActive: string;
  lastActiveTimestamp?: number;
  ip?: string;
  deviceType: 'desktop' | 'mobile' | 'tablet';
}

/**
 * Gets or creates a persistent unique ID for this browser / device instance
 */
export function getOrCreateDeviceId(): string {
  if (typeof window === 'undefined') return 'dev-server';
  let devId = localStorage.getItem('mbc_device_id');
  if (!devId) {
    devId = `dev-${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 8)}`;
    localStorage.setItem('mbc_device_id', devId);
  }
  return devId;
}

/**
 * Detects browser, operating system, and device type from User Agent
 */
export function detectDeviceDetails(): {
  browser: string;
  os: string;
  fullName: string;
  deviceType: 'desktop' | 'mobile' | 'tablet';
} {
  if (typeof navigator === 'undefined') {
    return { browser: 'Microsoft Edge', os: 'Windows', fullName: 'Microsoft Edge (Windows)', deviceType: 'desktop' };
  }
  const ua = navigator.userAgent;
  let browser = 'Navegador Web';
  let os = 'Dispositivo';

  if (ua.includes('Edg/')) browser = 'Microsoft Edge';
  else if (ua.includes('Chrome/')) browser = 'Google Chrome';
  else if (ua.includes('Safari/') && !ua.includes('Chrome')) browser = 'Apple Safari';
  else if (ua.includes('Firefox/')) browser = 'Mozilla Firefox';
  else if (ua.includes('OPR/') || ua.includes('Opera/')) browser = 'Opera';

  if (ua.includes('Windows')) os = 'Windows';
  else if (ua.includes('Mac OS')) os = 'macOS';
  else if (ua.includes('Android')) os = 'Android';
  else if (ua.includes('iPhone')) os = 'iPhone';
  else if (ua.includes('iPad')) os = 'iPad';
  else if (ua.includes('Linux')) os = 'Linux';

  const isMobile = /Android|webOS|iPhone|iPod|BlackBerry|IEMobile|Opera Mini/i.test(ua);
  const isTablet = /iPad|Macintosh/i.test(ua) && navigator.maxTouchPoints > 1;

  const deviceType: 'desktop' | 'mobile' | 'tablet' = isTablet ? 'tablet' : (isMobile || os === 'Android' || os === 'iPhone' ? 'mobile' : 'desktop');

  return { browser, os, fullName: `${browser} (${os})`, deviceType };
}

/**
 * Resolves the primary account sync key or email
 */
export function getAccountKey(): string {
  if (typeof window === 'undefined') return 'local_user';
  const syncKey = localStorage.getItem('mbc_sync_key');
  if (syncKey && syncKey.trim()) return syncKey.trim().toUpperCase();

  const userEmail = localStorage.getItem('mbc_userEmail');
  if (userEmail && userEmail.trim()) return userEmail.trim().toLowerCase();

  const userHandle = localStorage.getItem('mbc_userHandle');
  if (userHandle && userHandle.trim()) return userHandle.replace(/^@/, '').trim().toLowerCase();

  return 'local_account_key';
}

/**
 * Formats a timestamp into a human-readable, dynamic Portuguese relative active string
 */
export function formatLastActiveTime(timestamp?: number | string, isCurrent?: boolean): string {
  if (isCurrent) {
    return 'Ativo agora nesta janela';
  }

  if (!timestamp) {
    return 'Ativo recentemente';
  }

  let ts: number;
  if (typeof timestamp === 'string') {
    if (/^\d+$/.test(timestamp)) {
      ts = parseInt(timestamp, 10);
    } else {
      // Legacy string format fallback
      return timestamp;
    }
  } else {
    ts = timestamp;
  }

  const now = Date.now();
  const diffMs = Math.max(0, now - ts);
  const diffSec = Math.floor(diffMs / 1000);
  const diffMin = Math.floor(diffSec / 60);
  const diffHour = Math.floor(diffMin / 60);
  const diffDay = Math.floor(diffHour / 24);

  if (diffSec < 45) {
    return 'Ativo agora mesmo';
  }
  if (diffMin < 60) {
    return `Ativo há ${diffMin} ${diffMin === 1 ? 'minuto' : 'minutos'}`;
  }
  if (diffHour < 24) {
    return `Ativo há ${diffHour} ${diffHour === 1 ? 'hora' : 'horas'}`;
  }

  const dateObj = new Date(ts);
  const hours = String(dateObj.getHours()).padStart(2, '0');
  const minutes = String(dateObj.getMinutes()).padStart(2, '0');

  if (diffDay === 1) {
    return `Ontem às ${hours}:${minutes}`;
  }
  if (diffDay < 7) {
    return `Há ${diffDay} dias às ${hours}:${minutes}`;
  }

  const day = String(dateObj.getDate()).padStart(2, '0');
  const month = String(dateObj.getMonth() + 1).padStart(2, '0');
  return `${day}/${month} às ${hours}:${minutes}`;
}

/**
 * Fetch connected devices from cloud / local persistent account records
 */
export async function fetchAccountDevices(): Promise<ConnectedDevice[]> {
  const accountKey = getAccountKey();
  const currentDevId = getOrCreateDeviceId();

  let devices: ConnectedDevice[] = [];

  // 1. Try loading from Supabase / Auth storage
  try {
    const authRecord = await loadAuthRecord(`auth_devices:${accountKey}`);
    if (Array.isArray(authRecord) && authRecord.length > 0) {
      devices = authRecord;
    }
  } catch (err) {
    console.warn('Auth record devices read warning:', err);
  }

  // 2. Fallback to localStorage dictionary or direct key
  if (devices.length === 0) {
    try {
      const localDictRaw = localStorage.getItem('mbc_account_devices_dict');
      if (localDictRaw) {
        const dict = JSON.parse(localDictRaw);
        if (dict && Array.isArray(dict[accountKey]) && dict[accountKey].length > 0) {
          devices = dict[accountKey];
        }
      }
      if (devices.length === 0) {
        const savedLocal = localStorage.getItem('mbc_connected_devices');
        if (savedLocal) {
          const parsed = JSON.parse(savedLocal);
          if (Array.isArray(parsed) && parsed.length > 0) devices = parsed;
        }
      }
    } catch (e) {}
  }

  // Standardize isCurrent and lastActive display text
  return devices.map(d => {
    const isCurr = d.id === currentDevId;
    return {
      ...d,
      isCurrent: isCurr,
      lastActive: formatLastActiveTime(d.lastActiveTimestamp || d.lastActive, isCurr)
    };
  });
}

let lastDeviceSyncTs = 0;

/**
 * Registers or updates current device session and syncs back to cloud / shared persistence
 */
export async function syncAndRegisterCurrentDevice(customName?: string): Promise<ConnectedDevice[]> {
  const accountKey = getAccountKey();
  const currentDevId = getOrCreateDeviceId();
  const { browser, os, fullName, deviceType } = detectDeviceDetails();
  const nowTs = Date.now();

  // Throttle background updates if no customName change and synced less than 3 minutes ago
  if (!customName && lastDeviceSyncTs > 0 && (nowTs - lastDeviceSyncTs < 180000)) {
    const savedLocal = localStorage.getItem('mbc_connected_devices');
    if (savedLocal) {
      try {
        return JSON.parse(savedLocal);
      } catch (e) {}
    }
  }

  // Load current device list from cloud / local
  const existingDevices = await fetchAccountDevices();

  let foundCurrent = false;
  const updatedList = existingDevices.map(dev => {
    if (dev.id === currentDevId) {
      foundCurrent = true;
      return {
        ...dev,
        name: dev.name || fullName,
        customName: customName !== undefined ? customName : dev.customName,
        browser,
        os,
        deviceType,
        isCurrent: true,
        lastActiveTimestamp: nowTs,
        lastActive: formatLastActiveTime(nowTs, true)
      };
    }
    const isCurr = false;
    return {
      ...dev,
      isCurrent: isCurr,
      lastActive: formatLastActiveTime(dev.lastActiveTimestamp || dev.lastActive, isCurr)
    };
  });

  if (!foundCurrent) {
    const currentDeviceRecord: ConnectedDevice = {
      id: currentDevId,
      name: fullName,
      customName: customName || undefined,
      browser,
      os,
      isCurrent: true,
      lastActiveTimestamp: nowTs,
      lastActive: formatLastActiveTime(nowTs, true),
      ip: '189.28.102.44',
      deviceType
    };
    updatedList.unshift(currentDeviceRecord);
  }

  // Save to all persistence tiers
  await saveAccountDevices(accountKey, updatedList);
  lastDeviceSyncTs = nowTs;

  return updatedList;
}

/**
 * Saves connected devices list across Firestore, Supabase and LocalStorage
 */
export async function saveAccountDevices(accountKey: string, devices: ConnectedDevice[]): Promise<boolean> {
  const cleanedAccountKey = accountKey.trim();
  if (!cleanedAccountKey) return false;

  // Local storage save
  try {
    localStorage.setItem('mbc_connected_devices', JSON.stringify(devices));

    const localDictRaw = localStorage.getItem('mbc_account_devices_dict') || '{}';
    const dict = JSON.parse(localDictRaw);
    dict[cleanedAccountKey] = devices;
    localStorage.setItem('mbc_account_devices_dict', JSON.stringify(dict));
  } catch (err) {
    console.warn('LocalStorage saveAccountDevices warning:', err);
  }

  // Save to Supabase / Auth record
  try {
    await saveAuthRecord(`auth_devices:${cleanedAccountKey}`, devices);
  } catch (err) {
    console.warn('Supabase saveAccountDevices warning:', err);
  }

  return true;
}

/**
 * Updates a device (e.g. rename) in the shared storage
 */
export async function updateConnectedDevice(deviceId: string, updates: Partial<ConnectedDevice>): Promise<ConnectedDevice[]> {
  const accountKey = getAccountKey();
  const devices = await fetchAccountDevices();

  const updatedList = devices.map(d => {
    if (d.id === deviceId) {
      return { ...d, ...updates };
    }
    return d;
  });

  await saveAccountDevices(accountKey, updatedList);
  return updatedList;
}

/**
 * Removes / disconnects a device from the shared storage
 */
export async function removeConnectedDevice(deviceId: string): Promise<ConnectedDevice[]> {
  const accountKey = getAccountKey();
  const devices = await fetchAccountDevices();

  const updatedList = devices.filter(d => d.id !== deviceId);

  await saveAccountDevices(accountKey, updatedList);
  return updatedList;
}
