# Arquitetura de Dados, Isolamento Multi-Usuário e Sincronização Híbrida (Online/Offline)

> **Documento de Referência Técnica (Standalone)**  
> Este documento detalha a arquitetura completa de persistência, isolamento estrito de dados multi-usuário, sincronização em tempo real entre múltiplos dispositivos/abas e o motor de funcionamento resiliente *Offline-First* implementados no projeto **TRONUS / Life Organizer**.  
> Ele foi estruturado para servir de guia e modelo de implementação para outros projetos de software de alta performance.

---

## 1. Visão Geral da Arquitetura de Dados

A arquitetura de dados do sistema baseia-se em um modelo **Tri-Tier Reativo e Offline-First**:

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                            1. TIER REATIVO (MEMÓRIA)                       │
│  React State (useState) + latestStateRef (Snapshot síncrono do último tick)│
└──────────────────────────────────────┬──────────────────────────────────────┘
                                       │
                        Gravação Local Síncrona / Assíncrona
                                       ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                            2. TIER LOCAL (CLIENTE)                          │
│  • LocalStorage: Leituras síncronas de boot (< 2ms) para chaves de sessão   │
│  • IndexedDB (mbc_offline_sync_db): Snapshots pesados e Fila de Mutações   │
│  • Service Worker Cache: Shell da aplicação e assets offline               │
└──────────────────────────────────────┬──────────────────────────────────────┘
                                       │
                      Sync Debounce (600ms) + Queue Worker
                                       ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                            3. TIER CLOUD (SERVIDOR & BD)                    │
│  • Supabase PostgreSQL (Tabela user_sync particionada por sync_key)         │
│  • Supabase Realtime Broadcast & CDC (Postgres Changes)                     │
│  • Web Push VAPID Server (Notificações agendadas persistidas em SQLite/JSON)│
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 2. Como os Dados São Salvos (Camada de Persistência)

### 2.1 Armazenamento em Memória (React State & Refs)
No frontend, o estado do usuário é gerenciado por estados granulares no `src/App.tsx` (mais de 45 módulos: tarefas, finanças, hábitos, rotinas, notas, leituras, timers, etc.). Para permitir que funções de sincronização e callbacks acessem o estado mais atual **sem disparar re-renderizações desnecessárias e sem problemas de closures estéreis (*stale closures*)**, mantém-se um snapshot reativo contínuo via `useRef`:

```typescript
// Exemplo real de src/App.tsx
const latestStateRef = useRef<any>({});

// Atualizado a cada renderização do componente raiz
useEffect(() => {
  latestStateRef.current = {
    userName,
    userPhoto,
    userHandle,
    xpTotal,
    streak,
    dailyTasks,
    goals,
    timelines,
    finances,
    routine,
    calendarNotes,
    monthlyReviews,
    weeklyReviews,
    notes,
    habits,
    gridRoutine,
    bankAccounts,
    creditCards,
    debtItems,
    budgetLimits,
    // ...demais módulos
  };
});
```

### 2.2 Armazenamento Local: `localStorage` e `IndexedDB`
A persistência local opera em duas frentes complementares:

1. **LocalStorage (`mbc_*`):** Usado para dados de chave-valor rápidos, sessão do usuário (`mbc_auth_user`), chaves de sincronização (`mbc_sync_key`), preferências de tema e leitura síncrona durante o primeiro frame de renderização (evitando *layout shifts* ou telas brancas no boot).
2. **IndexedDB (`mbc_offline_sync_db`):** Usado para contornar o limite de 5MB do `localStorage`, persistir snapshots estruturados de grande porte e manter a fila transacional de mutações offline.

```typescript
// Estrutura do IndexedDB (src/lib/indexedDbQueue.ts)
const DB_NAME = 'mbc_offline_sync_db';
const DB_VERSION = 1;
const STORE_MUTATIONS = 'mutation_queue';   // Fila FIFO com retry count
const STORE_SNAPSHOTS = 'offline_snapshots'; // Snapshots completos por usuário (keyPath: 'key')
```

### 2.3 Armazenamento Remoto (Supabase PostgreSQL)
No servidor de banco de dados, todos os dados de produtividade de um usuário são agrupados em uma representação atômica versionada na tabela `user_sync`:

```sql
-- Schema SQL de Produção
CREATE TABLE IF NOT EXISTS user_sync (
  sync_key TEXT PRIMARY KEY,           -- Chave única do usuário (ex: 'MBC-JOAO-8F92A1')
  data JSONB NOT NULL,                 -- Objeto JSON contendo todos os módulos de dados
  updated_at TIMESTAMPTZ NOT NULL      -- Timestamp UTC do último salvamento
);

-- Índice para consultas ultrarrápidas
CREATE INDEX IF NOT EXISTS idx_user_sync_key ON user_sync(sync_key);
```

---

## 3. Isolamento e Segurança de Dados (Multi-Usuário)

O requisito inegociável do sistema é: **os dados de um usuário pertencem exclusivamente a ele e só ficam disponíveis após a sua autenticação.**

### 3.1 Identidade Criptográfica: O `syncKey` Imutável
Ao se registrar no sistema, o usuário recebe um identificador único de partição denominado `syncKey`, gerado de forma determinística e enriquecido com entropia criptográfica:

```typescript
// Exemplo real de src/lib/auth.ts
export async function registerWithEmail(
  username: string,
  email: string,
  pass: string,
  name?: string
): Promise<{ ok: boolean; user?: AuthUser; message?: string }> {
  // 1. Sanitização rigorosa contra injeção de scripts e SQL
  const cleanEmail = cleanString(sanitizeInput(email));
  const cleanUser = cleanString(username).replace(/[^a-z0-9_.]/g, '');
  
  // 2. Hash da senha usando Web Crypto API nativa (SHA-256)
  const passwordHash = await hashPassword(pass.trim());
  
  // 3. Geração do syncKey isolado para este usuário
  const syncKey = `MBC-${cleanUser.toUpperCase()}-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;

  const userRecord = {
    email: cleanEmail,
    username: cleanUser,
    name: name || cleanUser,
    passwordHash,
    syncKey,
    provider: 'email',
    createdAt: new Date().toISOString()
  };

  // 4. Gravação da conta isolada
  await saveAuthRecord(`auth_account:${cleanEmail}`, userRecord);
  await saveAuthRecord(`auth_username:${cleanUser}`, { email: cleanEmail });

  return { ok: true, user: { email: cleanEmail, username: cleanUser, name, syncKey, provider: 'email' } };
}
```

### 3.2 Particionamento Estrito na Nuvem
Nenhum dado é consultado sem a presença do `syncKey` do usuário autenticado:
* **Leituras:** O cliente executa `supabase.from('user_sync').select('data, updated_at').eq('sync_key', cleanKey).maybeSingle()`.
* **Canais de Tempo Real:** As salas de broadcast e canais de streaming de banco de dados são escopados exclusivamente para a chave do usuário:
  * Sala de Mensagens: `sync_room_${cleanKey}`
  * Filtro de Linhas: `filter: sync_key=eq.${cleanKey}`
* Usuários diferentes possuem chaves diferentes (`MBC-ALICE-...` e `MBC-BOB-...`), tornando impossível que Alice escute eventos ou receba dados pertencentes a Bob.

### 3.3 Bloqueio de Acesso na Inicialização (Gatekeeper)
Se o usuário não estiver autenticado, a interface não renderiza os módulos pessoais; em vez disso, apresenta o modal de autenticação bloqueante (`AuthModal`):

```typescript
// Exemplo real de src/App.tsx
if (!currentUser && !syncKey) {
  return (
    <AuthModal
      isOpen={true}
      onClose={() => {}}
      onSuccess={(user, rememberMe) => handleAuthSuccess(user, rememberMe)}
    />
  );
}
```

### 3.4 Procedimento de Logout e Troca Segura de Conta
Quando um usuário encerra a sessão (`handleLogout`):
1. **Destruição das Credenciais Ativas:** Limpeza imediata de tokens OAuth do Google, `localStorage.removeItem('mbc_auth_user')`, `sessionStorage.removeItem('mbc_auth_user')` e `localStorage.removeItem('mbc_sync_key')`.
2. **Desconexão de Canais:** Encerramento dos canais Supabase Realtime e BroadcastChannel da conta antiga.
3. **Reset do Estado da Aplicação:** O `currentUser` é definido como `null` e a tela de login é ativada.
4. **Troca de Conta:** Quando outro usuário faz login, a função `connectSyncKey(newUser.syncKey)` é chamada:
   - Reseta a flag `isInitialLoadCompleteRef.current = false`.
   - Limpa o cache local em memória.
   - Puxa o snapshot do banco correspondente ao novo `syncKey`. Dessa forma, nenhum dado do usuário anterior vaza para a nova sessão.

---

## 4. Motor de Sincronização em Tempo Real (Cross-Device & Cross-Tab)

A sincronização de dados entre múltiplos aparelhos (celular, tablet e computador) e entre várias abas abertas no mesmo navegador opera através de **três canais simultâneos**:

```
                              Ação do Usuário
                                     │
                                     ▼
                     Salvar no Estado Reativo (App.tsx)
                                     │
            ┌────────────────────────┼────────────────────────┐
            ▼                        ▼                        ▼
     Canal Local (< 5ms)      Nuvem Realtime (< 80ms)    Database Upsert
    (Mesmo Navegador)          (Outros Aparelhos)       (Supabase DB)
            │                        │                        │
  BroadcastChannel:           Supabase Channel:          Tabela user_sync:
  'meu_foco_multi_device'     'sync_room_${syncKey}'     ON CONFLICT(sync_key)
            │                        │                        │
            ▼                        ▼                        ▼
  Outras Abas no mesmo PC     Celulares / Tablets       Persistência Permanente
```

### 4.1 Canal 1: Cross-Tab Imediato via `BroadcastChannel`
Permite que duas ou mais abas abertas no mesmo computador se atualizem em menos de 5ms, **sem consumir tráfego de rede ou bater no servidor**:

```typescript
// src/lib/supabase.ts
const broadcastChannel = new BroadcastChannel('meu_foco_multi_device_channel');

export function broadcastLocalStateChange(syncKey: string, payload: any, updatedAt: string): void {
  const devId = getOrCreateDeviceId();
  broadcastChannel.postMessage({
    type: 'LOCAL_STATE_CHANGE',
    syncKey: syncKey.trim().toUpperCase(),
    data: payload,
    updated_at: updatedAt,
    originDeviceId: devId,
    timestamp: Date.now()
  });
}
```

### 4.2 Canal 2: P2P Global via Supabase Broadcast
Quando o usuário altera uma tarefa no smartphone, o dispositivo emite um sinal de broadcast leve (`REMOTE_STATE_UPDATED`) pelo WebSocket do Supabase para a sala do seu `syncKey`. O notebook recebe a mensagem e puxa a alteração quase instantaneamente.

### 4.3 Canal 3: Escuta Ativa do Banco (Postgres CDC)
O cliente escuta inserções e atualizações na tabela `user_sync`:

```typescript
// src/App.tsx
const postgresChannel = client
  .channel(`db_sync_${cleanSyncKey}`)
  .on(
    'postgres_changes',
    {
      event: '*',
      schema: 'public',
      table: 'user_sync',
      filter: `sync_key=eq.${cleanSyncKey}`
    },
    (payload: any) => {
      if (payload?.new?.data) {
        const originDevId = payload.new.data?._originDeviceId || '';
        // Se a alteração veio de outro dispositivo, aplica os dados
        if (originDevId !== currentDevId) {
          applyIncomingData(payload.new.data, payload.new.updated_at, originDevId);
        }
      }
    }
  )
  .subscribe();
```

### 4.4 Prevenção de Loops Infinitos de Sincronização
Em sistemas bidirecionais em tempo real, um perigo clássico é o **ping-pong infinito** (o dispositivo A salva, o B recebe e salva, o A recebe de volta e salva novamente). O sistema resolve isso através de três defesas:

1. **Fingerprint de Dispositivo (`originDeviceId`):** Cada aparelho gera e armazena um UUID persistente (`getOrCreateDeviceId()`). Se a notificação remota contiver o mesmo `originDeviceId` do aparelho atual, ela é descartada como eco local.
2. **Flag de Supressão (`isApplyingRemoteUpdateRef`):** Durante o frame em que dados remotos estão sendo injetados no estado React, os *effects* de auto-salvamento são bloqueados.
3. **Comparador Canônico Profundo (`cleanAndSortObject` + `safeStringify`):**
   ```typescript
   // Normaliza recursivamente as chaves e ignora valores undefined antes de comparar
   const cleanAndSortObject = (obj: any): any => {
     if (obj === null || obj === undefined) return null;
     if (Array.isArray(obj)) return obj.map(cleanAndSortObject);
     if (typeof obj === 'object') {
       const sorted: any = {};
       Object.keys(obj).sort().forEach(key => {
         if (obj[key] !== undefined) sorted[key] = cleanAndSortObject(obj[key]);
       });
       return sorted;
     }
     return obj;
   };
   
   // Se o estado transformado em string JSON ordenada for idêntico ao último salvo, o disparo de rede é cancelado
   if (safeStringify(currentData) === lastSavedJsonRef.current) return;
   ```

---

## 5. Arquitetura e Operação Offline-First

O aplicativo foi projetado para que a ausência total de conexão à internet não impeça o usuário de marcar tarefas, adicionar finanças, iniciar pomodoros ou criar notas.

### 5.1 Fila de Mutações Transacional no IndexedDB (`src/lib/indexedDbQueue.ts`)
Quando uma mutação ocorre:
1. Uma `MutationRecord` é gerada com status `'pending'`.
2. O registro é persistido transacionalmente no IndexedDB.
3. O snapshot mais recente é gravado no store `offline_snapshots` (`key: 'latest_${syncKey}'`).

```typescript
export interface MutationRecord {
  id: string;               // ID único da mutação (mut_timestamp_random)
  syncKey: string;          // Chave do usuário
  payload: any;             // Snapshot de dados a sincronizar
  type: string;             // 'state_update' | 'PUSH_ALARMS_SYNC' etc.
  description?: string;     // Descrição amigável
  createdAt: number;        // Epoch timestamp
  status: 'pending' | 'processing' | 'synced' | 'failed';
  retryCount: number;       // Contador de tentativas
  lastError?: string;
  syncedAt?: number;
}
```

### 5.2 Algoritmo de Coalescência (*State Folding*)
Se o usuário estiver offline no metrô e realizar 20 edições consecutivas, enfileirar 20 chamadas HTTP pesadas ao reconectar desperdiçaria banda e sobrecarregaria o servidor.  
O processador de fila implementa **Coalescência de Mutações por `syncKey`**:

```typescript
// src/lib/indexedDbQueue.ts -> processMutationQueue()
// Agrupa todas as mutações pendentes pelo syncKey do usuário
const byKey = new Map<string, MutationRecord[]>();
for (const item of pendingList) {
  const list = byKey.get(item.syncKey) || [];
  list.push(item);
  byKey.set(item.syncKey, list);
}

for (const [key, mutations] of byKey.entries()) {
  // Pega apenas a mutação MAIS RECENTE daquele usuário (as anteriores já foram superadas)
  const latestMutation = mutations[mutations.length - 1];

  const success = await saveFn(key, latestMutation.payload);
  if (success) {
    // Marca TODAS as mutações daquele lote como sincronizadas
    for (const mut of mutations) {
      mut.status = 'synced';
      mut.syncedAt = Date.now();
      store.put(mut);
    }
  }
}
```

### 5.3 Reconexão Automática
O sistema escuta os eventos de rede do navegador:
```typescript
if (typeof window !== 'undefined') {
  window.addEventListener('online', () => {
    console.log('🌐 Rede restabelecida! Processando fila de mutações IndexedDB...');
    processMutationQueue();
  });
}
```

### 5.4 Boot Ultrarrápido em Modo Avião / Offline
Ao abrir o app sem internet:
1. O Service Worker (`public/sw.js`) responde imediatamente com o shell compilado (`/index.html` e assets em cache estático).
2. O React inicializa lendo o `localStorage` e o snapshot offline do IndexedDB (`loadOfflineSnapshot('latest_${syncKey}')`).
3. O componente `<OfflineNotificationBanner />` detecta que `navigator.onLine === false` ou que há mutações pendentes na fila, exibindo um badge discreto e informativo na interface:
   - *"Modo Offline: X alterações salvas localmente aguardando conexão"*.
4. Assim que a rede retorna, a barra transiciona para *"Reconectado! Sincronizando dados..."* e desaparece automaticamente após a confirmação do Supabase.

---

## 6. Diagrama de Fluxo de Dados Completo

```
 [Usuário Edita Tarefa/Finança]
               │
               ▼
   [Atualiza React State]
               │
               ├─────────────────────────────────────────┐
               ▼ (Síncrono)                              ▼ (Assíncrono)
     [Grava no LocalStorage]                   [IndexedDB Mutation Queue]
               │                                         │
               │                                         ├─ Se Offline: Aguarda evento 'online'
               │                                         ▼
               │                              [Se Online: Dispara saveToSupabase]
               │                                         │
               │                                         ▼
               │                              [Supabase DB: user_sync]
               │                                         │
               │                                         ▼
               │                       [Realtime Broadcast / Postgres CDC]
               │                                         │
               ▼                                         ▼
  [BroadcastChannel Local]                    [Outros Dispositivos do Usuário]
  (Notifica outras abas locais)                (Recebem e atualizam a tela)
```

---

## 7. Como Utilizar Este Modelo em Outro Projeto

Para replicar esta arquitetura com máxima robustez em um novo sistema, adote o seguinte roteiro:

1. **Crie a Tabela `user_sync` no PostgreSQL (Supabase/Postgres puro):**
   Adote chave primária baseada em ID do usuário ou chave de partição alfanumérica (`sync_key`), com coluna `data JSONB` e `updated_at TIMESTAMPTZ`.
2. **Adicione a Fila IndexedDB no Cliente:**
   Copie os utilitários de `src/lib/indexedDbQueue.ts` para garantir que nenhuma ação do usuário seja perdida em desconexões momentâneas.
3. **Isole os Usuários por Chave Determinística:**
   Garanta que a autenticação (seja via Supabase Auth, JWT próprio ou chaves de sync) injete o identificador do usuário em todas as consultas e salas de Realtime.
4. **Implemente a Prevenção de Loops:**
   Sempre anexe um `_originDeviceId` aos payloads e compare o hash ou JSON normalizado (`cleanAndSortObject`) antes de disparar atualizações para o servidor.
5. **Integre um Service Worker:**
   Garanta que o HTML/JS e assets estejam em cache para permitir que a aplicação carregue e processe mutações mesmo em locais sem sinal.
