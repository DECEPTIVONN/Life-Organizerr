import { saveToSupabase } from './supabase';

export interface MutationRecord {
  id: string;
  syncKey: string;
  payload: any;
  type: string;
  description?: string;
  createdAt: number;
  status: 'pending' | 'processing' | 'synced' | 'failed';
  retryCount: number;
  lastError?: string;
  syncedAt?: number;
}

export interface QueueStatus {
  pendingCount: number;
  isProcessing: boolean;
  lastSyncAttempt?: number;
  lastSuccessfulSync?: number;
  isOnline: boolean;
}

const DB_NAME = 'mbc_offline_sync_db';
const DB_VERSION = 1;
const STORE_MUTATIONS = 'mutation_queue';
const STORE_SNAPSHOTS = 'offline_snapshots';

let dbInstance: IDBDatabase | null = null;
let isProcessingQueue = false;
const listeners = new Set<(status: QueueStatus) => void>();

/**
 * Initialize IndexedDB with necessary ObjectStores and Indexes
 */
export function openIndexedDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof window === 'undefined' || !window.indexedDB) {
      return reject(new Error('IndexedDB não suportado neste ambiente'));
    }

    if (dbInstance) {
      return resolve(dbInstance);
    }

    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = (event: IDBVersionChangeEvent) => {
      const db = (event.target as IDBOpenDBRequest).result;

      // 1. Mutations Store
      if (!db.objectStoreNames.contains(STORE_MUTATIONS)) {
        const mutationStore = db.createObjectStore(STORE_MUTATIONS, { keyPath: 'id' });
        mutationStore.createIndex('status', 'status', { unique: false });
        mutationStore.createIndex('createdAt', 'createdAt', { unique: false });
        mutationStore.createIndex('syncKey', 'syncKey', { unique: false });
        mutationStore.createIndex('retryCount', 'retryCount', { unique: false });
      }

      // 2. Offline Snapshots Store
      if (!db.objectStoreNames.contains(STORE_SNAPSHOTS)) {
        db.createObjectStore(STORE_SNAPSHOTS, { keyPath: 'key' });
      }
    };

    request.onsuccess = (event: Event) => {
      dbInstance = (event.target as IDBOpenDBRequest).result;
      
      dbInstance.onclose = () => {
        dbInstance = null;
      };

      resolve(dbInstance);
    };

    request.onerror = (event: Event) => {
      console.error('IndexedDB open error:', (event.target as IDBOpenDBRequest).error);
      reject((event.target as IDBOpenDBRequest).error);
    };
  });
}

/**
 * Enqueue a mutation into IndexedDB.
 * If online, immediately attempts to process the queue.
 */
export async function enqueueMutation(options: {
  syncKey: string;
  payload: any;
  type?: string;
  description?: string;
}): Promise<string> {
  const mutationId = `mut_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
  const mutation: MutationRecord = {
    id: mutationId,
    syncKey: options.syncKey,
    payload: options.payload,
    type: options.type || 'state_update',
    description: options.description || 'Atualização de dados da aplicação',
    createdAt: Date.now(),
    status: 'pending',
    retryCount: 0
  };

  try {
    const db = await openIndexedDB();
    
    // Save to mutation queue & snapshot store inside a transaction
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction([STORE_MUTATIONS, STORE_SNAPSHOTS], 'readwrite');
      
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
      tx.onabort = () => reject(new Error('Transaction aborted'));

      const mutationStore = tx.objectStore(STORE_MUTATIONS);
      mutationStore.put(mutation);

      const snapshotStore = tx.objectStore(STORE_SNAPSHOTS);
      snapshotStore.put({
        key: `latest_${options.syncKey}`,
        data: options.payload,
        updatedAt: new Date().toISOString()
      });
    });

    notifyQueueListeners();

    // Trigger background process if online
    if (typeof navigator !== 'undefined' && navigator.onLine) {
      processMutationQueue();
    }
  } catch (err) {
    console.warn('Failed to enqueue mutation into IndexedDB, falling back:', err);
    // Fallback in case IndexedDB is restricted (e.g., incognito storage failure)
    try {
      localStorage.setItem('mbc_offline_pending_backup', JSON.stringify({
        mutation,
        timestamp: Date.now()
      }));
    } catch (e) {
      // Ignore localStorage errors
    }
  }

  return mutationId;
}

/**
 * Save full offline snapshot directly to IndexedDB
 */
export async function saveOfflineSnapshot(key: string, data: any): Promise<void> {
  try {
    const db = await openIndexedDB();
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction([STORE_SNAPSHOTS], 'readwrite');
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
      const store = tx.objectStore(STORE_SNAPSHOTS);
      store.put({
        key,
        data,
        updatedAt: new Date().toISOString()
      });
    });
  } catch (err) {
    console.warn('Could not save snapshot to IndexedDB:', err);
  }
}

/**
 * Load offline snapshot from IndexedDB
 */
export async function loadOfflineSnapshot(key: string): Promise<any | null> {
  try {
    const db = await openIndexedDB();
    return new Promise((resolve) => {
      const tx = db.transaction([STORE_SNAPSHOTS], 'readonly');
      const store = tx.objectStore(STORE_SNAPSHOTS);
      const request = store.get(key);
      request.onsuccess = () => {
        resolve(request.result?.data || null);
      };
      request.onerror = () => {
        resolve(null);
      };
    });
  } catch (err) {
    return null;
  }
}

/**
 * Get all pending/failed mutations awaiting synchronization
 */
export async function getPendingMutations(): Promise<MutationRecord[]> {
  try {
    const db = await openIndexedDB();
    return new Promise((resolve) => {
      const tx = db.transaction([STORE_MUTATIONS], 'readonly');
      const store = tx.objectStore(STORE_MUTATIONS);
      const request = store.getAll();

      request.onsuccess = () => {
        const records: MutationRecord[] = request.result || [];
        const pending = records
          .filter(r => r.status === 'pending' || (r.status === 'failed' && r.retryCount < 15))
          .sort((a, b) => a.createdAt - b.createdAt);
        resolve(pending);
      };

      request.onerror = () => resolve([]);
    });
  } catch (err) {
    return [];
  }
}

/**
 * Get count of pending items
 */
export async function getPendingMutationsCount(): Promise<number> {
  const pending = await getPendingMutations();
  return pending.length;
}

/**
 * Get all mutations (for debugging / history inspection)
 */
export async function getAllMutations(): Promise<MutationRecord[]> {
  try {
    const db = await openIndexedDB();
    return new Promise((resolve) => {
      const tx = db.transaction([STORE_MUTATIONS], 'readonly');
      const store = tx.objectStore(STORE_MUTATIONS);
      const request = store.getAll();

      request.onsuccess = () => {
        const records: MutationRecord[] = request.result || [];
        resolve(records.sort((a, b) => b.createdAt - a.createdAt));
      };

      request.onerror = () => resolve([]);
    });
  } catch (err) {
    return [];
  }
}

/**
 * Process the mutation queue in FIFO order with deduplication / coalescing
 */
export async function processMutationQueue(
  customSaveFn?: (syncKey: string, payload: any) => Promise<boolean>
): Promise<{ processed: number; failed: number }> {
  if (isProcessingQueue) {
    return { processed: 0, failed: 0 };
  }

  if (typeof navigator !== 'undefined' && !navigator.onLine) {
    notifyQueueListeners();
    return { processed: 0, failed: 0 };
  }

  isProcessingQueue = true;
  notifyQueueListeners();

  let processed = 0;
  let failed = 0;

  try {
    const saveFn = customSaveFn || saveToSupabase;
    const pendingList = await getPendingMutations();

    if (pendingList.length === 0) {
      isProcessingQueue = false;
      notifyQueueListeners();
      return { processed: 0, failed: 0 };
    }

    const db = await openIndexedDB();

    // Group pending mutations by syncKey to coalesce state snapshots
    const byKey = new Map<string, MutationRecord[]>();
    for (const item of pendingList) {
      const list = byKey.get(item.syncKey) || [];
      list.push(item);
      byKey.set(item.syncKey, list);
    }

    for (const [key, mutations] of byKey.entries()) {
      // Pick the latest mutation payload for this syncKey to avoid redundant intermediate pushes
      const latestMutation = mutations[mutations.length - 1];

      try {
        const success = await saveFn(key, latestMutation.payload);

        const tx = db.transaction([STORE_MUTATIONS], 'readwrite');
        const store = tx.objectStore(STORE_MUTATIONS);

        if (success) {
          // Mark all processed mutations for this syncKey as synced
          for (const mut of mutations) {
            mut.status = 'synced';
            mut.syncedAt = Date.now();
            store.put(mut);
            processed++;
          }
          localStorage.setItem('mbc_last_queue_flush_time', new Date().toISOString());
        } else {
          // Mark as failed and increment retryCount
          for (const mut of mutations) {
            mut.status = 'failed';
            mut.retryCount = (mut.retryCount || 0) + 1;
            mut.lastError = 'Falha de comunicação com servidor ou rede instável';
            store.put(mut);
            failed++;
          }
        }

        await new Promise<void>((resolve) => {
          tx.oncomplete = () => resolve();
          tx.onerror = () => resolve();
        });
      } catch (err: any) {
        console.error('Error processing mutation batch for syncKey:', key, err);
        const tx = db.transaction([STORE_MUTATIONS], 'readwrite');
        const store = tx.objectStore(STORE_MUTATIONS);

        for (const mut of mutations) {
          mut.status = 'failed';
          mut.retryCount = (mut.retryCount || 0) + 1;
          mut.lastError = err?.message || String(err);
          store.put(mut);
          failed++;
        }

        await new Promise<void>((resolve) => {
          tx.oncomplete = () => resolve();
          tx.onerror = () => resolve();
        });
      }
    }

    // Cleanup old synced items (older than 2 days)
    cleanupOldMutations(db);
  } catch (err) {
    console.error('Failed to execute processMutationQueue:', err);
  } finally {
    isProcessingQueue = false;
    notifyQueueListeners();
  }

  return { processed, failed };
}

/**
 * Remove synced records older than 48 hours to conserve client storage
 */
async function cleanupOldMutations(db: IDBDatabase) {
  try {
    const twoDaysAgo = Date.now() - 48 * 60 * 60 * 1000;
    const tx = db.transaction([STORE_MUTATIONS], 'readwrite');
    const store = tx.objectStore(STORE_MUTATIONS);
    const request = store.getAll();

    request.onsuccess = () => {
      const records: MutationRecord[] = request.result || [];
      for (const r of records) {
        if (r.status === 'synced' && r.syncedAt && r.syncedAt < twoDaysAgo) {
          store.delete(r.id);
        }
      }
    };
  } catch (e) {
    // Non-fatal cleanup
  }
}

/**
 * Clear all records from IndexedDB mutation queue
 */
export async function clearAllMutations(): Promise<void> {
  try {
    const db = await openIndexedDB();
    const tx = db.transaction([STORE_MUTATIONS], 'readwrite');
    const store = tx.objectStore(STORE_MUTATIONS);
    store.clear();
    await new Promise<void>((resolve) => {
      tx.oncomplete = () => resolve();
      tx.onerror = () => resolve();
    });
    notifyQueueListeners();
  } catch (err) {
    console.error('Error clearing mutations:', err);
  }
}

/**
 * Subscribe to queue status changes
 */
export function subscribeToMutationQueue(listener: (status: QueueStatus) => void): () => void {
  listeners.add(listener);
  // Send current status immediately
  getQueueStatus().then(listener);

  return () => {
    listeners.delete(listener);
  };
}

/**
 * Get current snapshot of queue status
 */
export async function getQueueStatus(): Promise<QueueStatus> {
  const pendingCount = await getPendingMutationsCount();
  const isOnline = typeof navigator !== 'undefined' ? navigator.onLine : true;
  const lastFlush = localStorage.getItem('mbc_last_queue_flush_time');

  return {
    pendingCount,
    isProcessing: isProcessingQueue,
    lastSuccessfulSync: lastFlush ? new Date(lastFlush).getTime() : undefined,
    isOnline
  };
}

async function notifyQueueListeners() {
  if (listeners.size === 0) return;
  const status = await getQueueStatus();
  for (const listener of listeners) {
    try {
      listener(status);
    } catch (e) {
      console.error('Error in queue listener:', e);
    }
  }
}

// Global window event triggers
if (typeof window !== 'undefined') {
  window.addEventListener('online', () => {
    console.log('🌐 Rede restabelecida! Processando fila de mutações IndexedDB...');
    processMutationQueue();
  });
}
