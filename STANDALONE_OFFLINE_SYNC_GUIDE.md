# Guia de Referência Standalone: Arquitetura PWA Offline-First & Sincronização na Reconexão

Este documento é um **guia técnico standalone e completo**, extraído diretamente da implementação em produção deste aplicativo. Ele foi estruturado para ser utilizado como especificação e código de referência para qualquer outro projeto que necessite de:
1. **Modo Offline 100% Funcional (PWA)**: Carregamento instantâneo e uso ininterrupto mesmo em modo avião ou sem qualquer rede (Wi-Fi/dados móveis).
2. **Fila de Mutações com Persistência Local (IndexedDB + LocalStorage)**: Gravação e manipulação imediata de dados no cliente sem perda de informações.
3. **Mecanismo de Reconexão e Sincronização Automática**: Detecção de rede, coalescência/deduplicação de alterações e flush resiliente contra o banco de dados/servidor remoto.
4. **Prevenção de Ecos e Loops Infinitos**: Identificação de dispositivo (`originDeviceId`), serialização determinística (`safeStringify`) e Last-Write-Wins (LWW).
5. **Sincronização em Tempo Real Cross-Tab e Multi-Device**: Atualizações em <5ms entre abas locais via `BroadcastChannel` e em <100ms entre múltiplos aparelhos via Realtime.

---

## 1. Visão Geral da Arquitetura do Sistema

```
+-----------------------------------------------------------------------------------+
|                                 NAVEGADOR / PWA                                   |
|                                                                                   |
|  +-----------------------------------------------------------------------------+  |
|  |                             REACT UI & HOOKS                                |  |
|  |  - Estado Local Reativo (useState / useRef)                                 |  |
|  |  - Componente OfflineNotificationBanner (Status de Rede & Mutações)         |  |
|  |  - useOnlineStatus & Listeners ('online', 'offline', 'focus')               |  |
|  +-------------------------------------+---------------------------------------+  |
|                                        |                                          |
|            (1. Escrita Local Instantânea e Enfileiramento de Mutação)             |
|                                        v                                          |
|  +-----------------------------------------------------------------------------+  |
|  |                     CAMADA DE PERSISTÊNCIA OFFLINE                          |  |
|  |                                                                             |  |
|  |  [LocalStorage]                [IndexedDB (mbc_offline_sync_db)]           |  |
|  |  * Hidratação síncrona <1ms    * STORE 'mutation_queue' (FIFO ordenado)     |  |
|  |  * Chaves críticas de sessão   * STORE 'offline_snapshots' (Full state)     |  |
|  +-------------------------------------+---------------------------------------+  |
|                                        |                                          |
|                      (2. Service Worker & Cache Layer)                            |
|                                        v                                          |
|  +-----------------------------------------------------------------------------+  |
|  |                         SERVICE WORKER (sw.js)                              |  |
|  |  - Pre-cache de App Shell (/index.html, manifest, icons, core scripts)      |  |
|  |  - Cache-First para assets versionados (/assets/* com hash do Vite)         |  |
|  |  - Stale-While-Revalidate / Fallback /index.html para requisições de navega|  |
|  |  - Background Worker para alarmes e notificações locais (IndexedDB próprio) |  |
|  +-------------------------------------+---------------------------------------+  |
|                                        |                                          |
|             (3. Reconexão: Detecção 'online' & Flush Coalescente)                |
|                                        v                                          |
|  +-----------------------------------------------------------------------------+  |
|  |                  MOTOR DE SINCRONIZAÇÃO (indexedDbQueue.ts)                 |  |
|  |  - Agrupa mutações pendentes por syncKey (deduplicação)                     |  |
|  |  - Envia apenas o snapshot mais recente de cada chave                        |  |
|  |  - Injeta _originDeviceId para evitar eco na própria máquina                |  |
|  |  - Retentativas com controle de status (pending -> processing -> synced)    |  |
|  +--------------------+-------------------------------+------------------------+  |
+-----------------------|-------------------------------|---------------------------+
                        |                               |
       (BroadcastChannel Cross-Tab <5ms)   (Chamadas HTTPS / Upsert)
                        |                               |
                        v                               v
             +--------------------+          +---------------------+
             |  Outras Abas do    |          |  Servidor Remoto /  |
             |  Mesmo Dispositivo |          |  Supabase / API DB  |
             +--------------------+          +----------+----------+
                                                        |
                                            (Realtime WebSocket <100ms)
                                                        |
                                                        v
                                             +---------------------+
                                             |  Outros Dispositivos|
                                             |  (Celular / Tablet) |
                                             +---------------------+
```

---

## 2. Como Funciona o Modo Offline (PWA sem Internet)

### 2.1. O Ciclo de Vida do Service Worker (`public/sw.js`)

O Service Worker atua como um servidor proxy programável dentro do navegador do usuário. Quando o dispositivo perde a conexão com a internet, o Service Worker intercepta todas as requisições HTTP e serve os arquivos a partir do Cache Storage do navegador.

#### Estratégias de Cache Implementadas:
1. **Pre-Cache do App Shell no `install`**:
   O aplicativo faz download e armazena previamente a casca principal (`/index.html`, `/manifest.json`, favicons, ícones de splash e SVGs essenciais).
2. **Cache-First para Fingerprinted Assets (`/assets/*`)**:
   Como o Vite gera hashes únicos nos nomes dos arquivos gerados (`index-CMniWEBS.js`, `index-da-j-zP2.css`), esses arquivos são imutáveis. O Service Worker sempre busca primeiro no cache. Se existir, o carregamento é instantâneo (0ms de latência de rede).
3. **Navegação com Fallback para SPA (`mode === 'navigate'`)**:
   Se o usuário recarregar a página ou navegar para qualquer rota enquanto estiver desconectado, a requisição de rede falha, e o Service Worker imediatamente retorna o `/index.html` em cache, permitindo que o React Router ou o estado de navegação assuma sem tela de erro ("dinossauro" do Chrome).

#### Exemplo Real de Implementação do `public/sw.js`:
```javascript
const CACHE_NAME = 'life-organizer-pwa-v8';
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/favicon.ico',
  '/icon.svg',
  '/favicon-32x32.png',
  '/favicon-16x16.png',
  '/apple-touch-icon.png',
  '/icon-192.png',
  '/icon-512.png',
  '/maskable-icon-512.png',
  '/manifest.json'
];

// Instalação: baixa e armazena os ativos essenciais
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(STATIC_ASSETS))
  );
  self.skipWaiting();
});

// Ativação: remove caches antigos de versões anteriores e assume o controle dos clientes
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME) return caches.delete(key);
        })
      )
    ).then(() => self.clients.claim())
  );
});

// Interceptação de requisições de rede (Fetch Handler Offline)
self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;
  if (!event.request.url.startsWith('http')) return;

  // 1. Requisição de Navegação de Página (SPA)
  if (event.request.mode === 'navigate') {
    event.respondWith(
      fetch(event.request)
        .then((networkResponse) => {
          if (networkResponse && networkResponse.status === 200) {
            const copy = networkResponse.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(event.request, copy));
          }
          return networkResponse;
        })
        .catch(() => {
          // Fallback offline garantido: devolve o index.html em cache
          return caches.match('/index.html').then((cached) => cached || caches.match(event.request));
        })
    );
    return;
  }

  // 2. Requisição de Assets Imutáveis (/assets/) -> Cache-First
  if (event.request.url.includes('/assets/')) {
    event.respondWith(
      caches.match(event.request).then((cachedResponse) => {
        if (cachedResponse) return cachedResponse;
        return fetch(event.request).then((networkResponse) => {
          if (networkResponse && networkResponse.status === 200) {
            const copy = networkResponse.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(event.request, copy));
          }
          return networkResponse;
        });
      })
    );
    return;
  }

  // 3. Demais requisições GET -> Network com Cache Fallback
  event.respondWith(
    fetch(event.request)
      .then((networkResponse) => {
        if (networkResponse && networkResponse.status === 200) {
          const copy = networkResponse.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(event.request, copy));
        }
        return networkResponse;
      })
      .catch(() => caches.match(event.request))
  );
});
```

### 2.2. Web App Manifest (`public/manifest.json`)
Para que o navegador permita a instalação como aplicativo na tela inicial do celular ou desktop:
```json
{
  "id": "/",
  "name": "MBCplanner - Life Organizer",
  "short_name": "MBCplanner",
  "description": "Seu organizador de vida completo, offline-first e alta produtividade.",
  "start_url": "/",
  "scope": "/",
  "display": "standalone",
  "background_color": "#09090b",
  "theme_color": "#18181b",
  "orientation": "portrait-primary",
  "icons": [
    {
      "src": "/icon-192.png",
      "sizes": "192x192",
      "type": "image/png",
      "purpose": "any"
    },
    {
      "src": "/icon-512.png",
      "sizes": "512x512",
      "type": "image/png",
      "purpose": "any"
    },
    {
      "src": "/maskable-icon-512.png",
      "sizes": "512x512",
      "type": "image/png",
      "purpose": "maskable"
    }
  ]
}
```

---

## 3. Arquitetura de Dados de Dupla Camada (LocalStorage + IndexedDB)

Muitos aplicativos cometem o erro de depender apenas de chamadas de rede ou apenas de LocalStorage (que tem limite rígido de ~5MB e pode travar a thread principal em dados volumosos).

Nossa arquitetura utiliza **dois níveis de armazenamento local**:
1. **Camada 1: LocalStorage para Inicialização Síncrona Imediata (<1ms)**
   - O React monta seu estado inicial diretamente do `localStorage.getItem(...)`.
   - Isso elimina qualquer tela preta ou "flicker" de carregamento: os dados aparecem instantaneamente no primeiro milissegundo de renderização.
2. **Camada 2: IndexedDB para Fila de Mutações Assíncronas e Snapshots Robustos**
   - Suporta centenas de megabytes.
   - Permite transações atômicas ACID (`readwrite`).
   - Garante que mesmo que o usuário feche a aba, desligue o celular ou fique sem bateria enquanto offline, todas as alterações pendentes permaneçam salvas de forma segura.

---

## 4. O Sistema de Fila de Mutações Offline (`indexedDbQueue.ts`)

Quando o usuário realiza qualquer alteração offline (cria uma tarefa, marca um hábito, adiciona uma transação financeira ou altera notas), a aplicação:
1. Atualiza o estado visual do React instantaneamente (Optimistic UI).
2. Salva a cópia síncrona no LocalStorage.
3. Chama `enqueueMutation(...)`, que insere um registro na tabela `mutation_queue` do IndexedDB com status `'pending'`.
4. Salva o snapshot completo na tabela `offline_snapshots`.

### 4.1. Estrutura de Tipos TypeScript
```typescript
export interface MutationRecord {
  id: string;               // Ex: mut_1792552348_ab12cd
  syncKey: string;          // Identificador da conta/tenant ou chave de sincronização
  payload: any;             // Dados da mutação ou estado a ser persistido
  type: string;             // Ex: 'full_state_sync', 'task_created', etc.
  description?: string;
  createdAt: number;        // Timestamp Epoch (ms) para ordenação FIFO
  status: 'pending' | 'processing' | 'synced' | 'failed';
  retryCount: number;       // Número de tentativas de sincronização
  lastError?: string;       // Mensagem amigável de erro se falhar
  syncedAt?: number;        // Timestamp de quando foi aceito pelo servidor
}

export interface QueueStatus {
  pendingCount: number;     // Quantidade de alterações aguardando envio
  isProcessing: boolean;    // Se há um envio em andamento
  lastSyncAttempt?: number;
  lastSuccessfulSync?: number;
  isOnline: boolean;        // Status de conexão atual
}
```

### 4.2. Inicialização do Banco IndexedDB
```typescript
const DB_NAME = 'mbc_offline_sync_db';
const DB_VERSION = 1;
const STORE_MUTATIONS = 'mutation_queue';
const STORE_SNAPSHOTS = 'offline_snapshots';

let dbInstance: IDBDatabase | null = null;

export function openIndexedDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof window === 'undefined' || !window.indexedDB) {
      return reject(new Error('IndexedDB não suportado no ambiente'));
    }

    if (dbInstance) {
      return resolve(dbInstance);
    }

    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = (event: IDBVersionChangeEvent) => {
      const db = (event.target as IDBOpenDBRequest).result;

      // 1. Tabela da Fila de Mutações
      if (!db.objectStoreNames.contains(STORE_MUTATIONS)) {
        const store = db.createObjectStore(STORE_MUTATIONS, { keyPath: 'id' });
        store.createIndex('status', 'status', { unique: false });
        store.createIndex('createdAt', 'createdAt', { unique: false });
        store.createIndex('syncKey', 'syncKey', { unique: false });
      }

      // 2. Tabela de Snapshots Completos
      if (!db.objectStoreNames.contains(STORE_SNAPSHOTS)) {
        db.createObjectStore(STORE_SNAPSHOTS, { keyPath: 'key' });
      }
    };

    request.onsuccess = (event: Event) => {
      dbInstance = (event.target as IDBOpenDBRequest).result;
      dbInstance.onclose = () => { dbInstance = null; };
      resolve(dbInstance);
    };

    request.onerror = (event: Event) => {
      reject((event.target as IDBOpenDBRequest).error);
    };
  });
}
```

### 4.3. Enfileiramento de Mutação (`enqueueMutation`)
```typescript
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
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction([STORE_MUTATIONS, STORE_SNAPSHOTS], 'readwrite');
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);

      // Salva na fila
      tx.objectStore(STORE_MUTATIONS).put(mutation);

      // Salva snapshot offline do estado atual
      tx.objectStore(STORE_SNAPSHOTS).put({
        key: `latest_${options.syncKey}`,
        data: options.payload,
        updatedAt: new Date().toISOString()
      });
    });

    notifyQueueListeners();

    // Se estiver online, tenta enviar imediatamente em segundo plano
    if (typeof navigator !== 'undefined' && navigator.onLine) {
      processMutationQueue();
    }
  } catch (err) {
    console.warn('Erro ao enfileirar no IndexedDB, salvando backup em localStorage:', err);
    try {
      localStorage.setItem('mbc_offline_pending_backup', JSON.stringify({ mutation, timestamp: Date.now() }));
    } catch (e) {}
  }

  return mutationId;
}
```

---

## 5. Como Funciona o Sistema de Reconexão e Sincronização

### 5.1. Gatilhos de Detecção de Rede
A reconexão não depende de uma única verificação passiva. Ela escuta múltiplos eventos do ciclo de vida da janela e do navegador:
1. `window.addEventListener('online', ...)`: Dispara imediatamente no instante em que o sistema operacional restabelece conexão Wi-Fi ou dados móveis.
2. `window.addEventListener('focus', ...)`: Quando o usuário reabre o app ou volta para a aba.
3. `document.addEventListener('visibilitychange', ...)`: Quando o app volta ao primeiro plano no celular.
4. `pointerdown` (Throttled): Se o usuário tocar na tela após um período inativo, o app verifica silenciosamente se há mutações pendentes para descarregar.

### 5.2. Algoritmo de Processamento da Fila com Coalescência / Deduplicação (`processMutationQueue`)

Se o usuário fez 10 alterações offline no checklist durante 1 hora sem internet, não faz sentido enviar 10 requisições HTTP individuais ao servidor.

**A técnica de Coalescência de Mutações**:
- Agrupa todas as mutações pendentes pela mesma chave (`syncKey`).
- Localiza a mutação mais recente (`latestMutation = mutations[mutations.length - 1]`).
- Executa um **único upsert** com os dados finais consolidados.
- Marca todas as 10 mutações como `'synced'` de uma só vez na mesma transação IndexedDB.
- Economiza 90% do consumo de dados móveis e evita conflitos intermediários no servidor.

#### Código Real do Processador:
```typescript
let isProcessingQueue = false;

export async function processMutationQueue(
  customSaveFn?: (syncKey: string, payload: any) => Promise<boolean>
): Promise<{ processed: number; failed: number }> {
  // Evita concorrência: nunca processa duas vezes ao mesmo tempo
  if (isProcessingQueue) {
    return { processed: 0, failed: 0 };
  }

  // Se estiver sem internet, encerra e mantém itens como 'pending'
  if (typeof navigator !== 'undefined' && !navigator.onLine) {
    notifyQueueListeners();
    return { processed: 0, failed: 0 };
  }

  isProcessingQueue = true;
  notifyQueueListeners();

  let processed = 0;
  let failed = 0;

  try {
    const saveFn = customSaveFn || saveToRemoteServer;
    const pendingList = await getPendingMutations();

    if (pendingList.length === 0) {
      isProcessingQueue = false;
      notifyQueueListeners();
      return { processed: 0, failed: 0 };
    }

    const db = await openIndexedDB();

    // 1. Agrupa por chave de sincronização (Coalescência)
    const byKey = new Map<string, MutationRecord[]>();
    for (const item of pendingList) {
      const list = byKey.get(item.syncKey) || [];
      list.push(item);
      byKey.set(item.syncKey, list);
    }

    // 2. Processa cada grupo enviando apenas a mutação final mais recente
    for (const [key, mutations] of byKey.entries()) {
      const latestMutation = mutations[mutations.length - 1];

      try {
        const success = await saveFn(key, latestMutation.payload);

        const tx = db.transaction([STORE_MUTATIONS], 'readwrite');
        const store = tx.objectStore(STORE_MUTATIONS);

        if (success) {
          // Marca todas as mutações do grupo como 'synced'
          for (const mut of mutations) {
            mut.status = 'synced';
            mut.syncedAt = Date.now();
            store.put(mut);
            processed++;
          }
          localStorage.setItem('mbc_last_queue_flush_time', new Date().toISOString());
        } else {
          // Marca como falha e incrementa contador de retentativa
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
        console.error('Erro ao enviar lote de mutações para key:', key, err);
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

    // 3. Limpeza automática: descarta mutações sincronizadas há mais de 48h
    cleanupOldMutations(db);
  } finally {
    isProcessingQueue = false;
    notifyQueueListeners();
  }

  return { processed, failed };
}

// Limpeza de histórico para manter o navegador leve
async function cleanupOldMutations(db: IDBDatabase) {
  try {
    const twoDaysAgo = Date.now() - 48 * 60 * 60 * 1000;
    const tx = db.transaction([STORE_MUTATIONS], 'readwrite');
    const store = tx.objectStore(STORE_MUTATIONS);
    const req = store.getAll();

    req.onsuccess = () => {
      const records: MutationRecord[] = req.result || [];
      for (const r of records) {
        if (r.status === 'synced' && r.syncedAt && r.syncedAt < twoDaysAgo) {
          store.delete(r.id);
        }
      }
    };
  } catch (e) {}
}
```

---

## 6. Prevenção de Conflitos, Ecos e Loops Infinitos

Um dos maiores desafios em sistemas offline-first com sincronização em nuvem é o **efeito ping-pong**:
- Aparelho A salva dados no servidor.
- O servidor dispara um evento Realtime de volta para o Aparelho A.
- O Aparelho A interpreta isso como "novos dados" e tenta salvar de novo, gerando um loop infinito de consumo de rede.

Nossa solução resolve isso com quatro travas de segurança:

### 6.1. Device Fingerprinting (`getOrCreateDeviceId`)
Cada navegador/instalação gera e armazena um UUID único no localStorage:
```typescript
export function getOrCreateDeviceId(): string {
  let id = localStorage.getItem('mbc_device_id');
  if (!id) {
    id = 'dev_' + Math.random().toString(36).substring(2, 11) + '_' + Date.now();
    localStorage.setItem('mbc_device_id', id);
  }
  return id;
}
```
Ao salvar no banco, o payload recebe `_originDeviceId: currentDevId`.
Quando o cliente recebe um evento remoto, ele verifica:
```typescript
if (originDeviceId === currentDevId) {
  // Ignora: foi este próprio aparelho que enviou essa alteração
  return;
}
```

### 6.2. Trava de Execução Remota (`isApplyingRemoteUpdateRef`)
Enquanto o React está hidratando dados recebidos do servidor remoto, uma referência mutável `isApplyingRemoteUpdateRef.current = true` é ativada. O efeito de auto-save (`useEffect` do React) checa essa flag e é cancelado, impedindo que o estado recém-recebido seja re-enviado.

### 6.3. Serialização Canônica Determinística (`safeStringify`)
Em JavaScript, `{ a: 1, b: 2 }` e `{ b: 2, a: 1 }` geram strings diferentes com `JSON.stringify`.
A função `cleanAndSortObject` ordena recursivamente todas as chaves do objeto antes de serializar:
```typescript
const cleanAndSortObject = (obj: any): any => {
  if (obj === null || obj === undefined) return null;
  if (Array.isArray(obj)) return obj.map(cleanAndSortObject);
  if (typeof obj === 'object') {
    const sortedObj: any = {};
    for (const key of Object.keys(obj).sort()) {
      if (obj[key] !== undefined) {
        sortedObj[key] = cleanAndSortObject(obj[key]);
      }
    }
    return sortedObj;
  }
  return obj;
};

export const safeStringify = (obj: any): string => {
  return JSON.stringify(cleanAndSortObject(obj));
};
```
Se `safeStringify(currentData) === lastSyncedStateRef.current`, o auto-save sabe com 100% de certeza que não houve alteração real e não faz nenhuma requisição.

---

## 7. Sincronização em Tempo Real (Cross-Tab & Multi-Dispositivo)

### 7.1. Cross-Tab Sync Instantâneo (<5ms) via `BroadcastChannel`
Se o usuário abrir o app em 2 abas do mesmo computador ou celular:
```typescript
const channel = new BroadcastChannel('meu_foco_multi_device_channel');

// Quando uma aba altera qualquer dado:
channel.postMessage({
  type: 'LOCAL_STATE_CHANGE',
  syncKey,
  data: payload,
  updated_at: new Date().toISOString(),
  originDeviceId: getOrCreateDeviceId()
});

// A outra aba escuta e atualiza a tela sem precisar chamar a internet:
channel.addEventListener('message', (event) => {
  if (event.data?.type === 'LOCAL_STATE_CHANGE' && event.data.syncKey === currentSyncKey) {
    applyIncomingData(event.data.data);
  }
});
```

### 7.2. Multi-Device Sync Instantâneo (<100ms) via Supabase Realtime
Para conectar dispositivos diferentes (ex: o usuário marcou uma tarefa no iPhone e a tela do computador atualiza na hora):
```typescript
const client = getSupabaseClient();
const postgresChannel = client
  .channel(`realtime_user_sync_${syncKey}`)
  .on(
    'postgres_changes',
    {
      event: '*',
      schema: 'public',
      table: 'user_sync',
      filter: `sync_key=eq.${syncKey}`
    },
    (payload) => {
      if (payload?.new?.data) {
        const originDev = payload.new.data._originDeviceId;
        if (originDev !== currentDevId) {
          applyIncomingData(payload.new.data, payload.new.updated_at, originDev);
        }
      }
    }
  )
  .subscribe();
```

---

## 8. Interface de Feedback do Usuário (`OfflineNotificationBanner.tsx`)

O usuário nunca deve ficar em dúvida sobre o status da sua conexão ou se seus dados foram salvos. O banner visual fornece status claro, contagem de itens pendentes e botão de sincronização manual.

```tsx
import React, { useEffect, useState } from 'react';
import { WifiOff, RefreshCw, CheckCircle2, CloudUpload } from 'lucide-react';
import { getQueueStatus, processMutationQueue, subscribeToMutationQueue, QueueStatus } from '../lib/indexedDbQueue';

export const OfflineNotificationBanner: React.FC = () => {
  const [status, setStatus] = useState<QueueStatus>({
    pendingCount: 0,
    isProcessing: false,
    isOnline: typeof navigator !== 'undefined' ? navigator.onLine : true
  });
  const [isManualSyncing, setIsManualSyncing] = useState(false);

  useEffect(() => {
    // Inscreve-se nas mudanças da fila do IndexedDB
    const unsubscribe = subscribeToMutationQueue((newStatus) => {
      setStatus(newStatus);
    });

    const handleOnline = () => setStatus(s => ({ ...s, isOnline: true }));
    const handleOffline = () => setStatus(s => ({ ...s, isOnline: false }));

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      unsubscribe();
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const handleManualSync = async () => {
    if (!status.isOnline || isManualSyncing) return;
    setIsManualSyncing(true);
    try {
      await processMutationQueue();
    } finally {
      setIsManualSyncing(false);
    }
  };

  // Se estiver online e sem nenhuma pendência, oculta o banner
  if (status.isOnline && status.pendingCount === 0 && !status.isProcessing && !isManualSyncing) {
    return null;
  }

  return (
    <div className="fixed bottom-4 right-4 z-50 max-w-sm rounded-xl border border-amber-500/30 bg-zinc-900/95 p-3.5 text-xs text-white shadow-2xl backdrop-blur-md transition-all">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          {!status.isOnline ? (
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-amber-500/20 text-amber-400">
              <WifiOff className="h-4 w-4" />
            </div>
          ) : (
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-500/20 text-emerald-400">
              <CloudUpload className="h-4 w-4 animate-bounce" />
            </div>
          )}

          <div>
            <p className="font-semibold text-zinc-100">
              {!status.isOnline ? 'Modo Offline Ativo' : 'Sincronizando Alterações...'}
            </p>
            <p className="text-[11px] text-zinc-400">
              {!status.isOnline
                ? `${status.pendingCount} alteração(ões) salva(s) localmente`
                : `${status.pendingCount} pendente(s) enviando para a nuvem`}
            </p>
          </div>
        </div>

        {status.isOnline && status.pendingCount > 0 && (
          <button
            onClick={handleManualSync}
            disabled={status.isProcessing || isManualSyncing}
            className="flex items-center gap-1 rounded-lg bg-amber-500/20 px-2.5 py-1.5 font-medium text-amber-300 hover:bg-amber-500/30 transition disabled:opacity-50"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${status.isProcessing || isManualSyncing ? 'animate-spin' : ''}`} />
            Sincronizar
          </button>
        )}
      </div>
    </div>
  );
};
```

---

## 9. Checklist para Implementar em Outro Projeto

Ao replicar esta arquitetura no seu próximo projeto, siga estes passos:

- [ ] **1. Service Worker & PWA**:
  - Adicione `manifest.json` com `display: standalone` e ícones `any` e `maskable` de 192px e 512px.
  - Implemente o `sw.js` com interceptação de requisições de navegação (fallback `/index.html`) e cache de assets imutáveis.
  - Registre o service worker no `main.tsx` ou `index.html`.
- [ ] **2. Fila IndexedDB**:
  - Copie o arquivo `indexedDbQueue.ts` definindo os object stores `mutation_queue` e `offline_snapshots`.
  - Conecte o evento global `window.addEventListener('online', () => processMutationQueue())`.
- [ ] **3. Identificação de Dispositivo**:
  - Gere um `deviceId` persistente no `localStorage` e anexe `_originDeviceId` em cada mutação salva.
- [ ] **4. Prevenção de Ecos no React**:
  - Use `isApplyingRemoteUpdateRef` para não disparar auto-save quando estiver hidratando dados vindos do servidor.
  - Use `safeStringify` para comparar o estado anterior com o novo estado antes de invocar o salvamento.
- [ ] **5. Interface Reativa**:
  - Adicione o componente `OfflineNotificationBanner` no topo ou rodapé do layout raiz do aplicativo para total transparência com o usuário.
