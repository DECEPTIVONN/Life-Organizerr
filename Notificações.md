# Plano de Implementação: Notificações Confiáveis em Segundo Plano (TRONUS)

> Objetivo: notificações chegando com o navegador e o site **fechados**, em Android, iOS e Windows, sem depender de nada que rode no cliente enquanto o app está fechado.

---

## 1. Princípio central

**Quem dispara o alarme é o servidor, não o cliente.**

Nenhum navegador mantém JavaScript rodando com o app fechado. O único canal que acorda o dispositivo é o **Web Push** (servidor → serviço push do navegador → Service Worker → `showNotification`). Portanto:

| Camada | Papel no novo desenho |
|---|---|
| **C – Web Push (servidor)** | **Fonte primária e confiável** de toda notificação em segundo plano |
| **B – Service Worker local** | Apenas **reforço oportunista** (quando o SW estiver vivo) e exibição do push recebido. Nunca confiar nele sozinho |
| **A – Foreground (aba aberta)** | UI, som e alertas visuais. Deduplica com o push via `tag` |

### Limites honestos (devem constar na UX)

- **iOS**: só funciona com o PWA **adicionado à Tela de Início** (iOS/iPadOS ≥ 16.4) e permissão pedida por **clique do usuário**.
- **Windows**: Chrome/Edge só recebem push com o navegador fechado se o processo em segundo plano estiver ativo (Chrome: *Configurações → Sistema → "Continuar executando aplicativos em segundo plano..."*; Edge: equivalente). Instalar como PWA ajuda. Sem isso, o push chega ao abrir o navegador.
- **Android**: funciona bem via FCM (Chrome). Economia de bateria agressiva (Xiaomi, Samsung, etc.) pode atrasar; orientar o usuário a remover restrição de bateria do app instalado.
- **Som**: em background o som é do **canal de notificação do sistema**. Não tentar tocar áudio pelo SW.
- **Hospedagem**: o worker precisa de processo Node **persistente** + **disco persistente**. Serverless (Vercel/Netlify Functions) não serve para o `setInterval`; se for o caso, usar cron externo (ver seção 12).

---

## 2. Diagnóstico dos problemas atuais → solução

| # | Problema | Solução neste plano |
|---|---|---|
| 1 | `setInterval` do SW morre após ~30 s | Seção 6: SW passa a ser só receptor de push; loop local vira apenas best-effort |
| 2 | `TimestampTrigger` experimental | Seção 6.3: manter só como bônus com detecção de feature, sem depender dele |
| 3 | Dados em RAM (`Map`) somem no restart | Seção 4: persistência em SQLite |
| 4 | Fuso horário do servidor (UTC) | Seção 5: sempre `fireAt` em UTC absoluto + `timezone` IANA para recorrências |
| 5 | Particularidades iOS | Seção 8: fluxo de onboarding e detecção standalone |
| 6 | Áudio em background | Seção 9: vibração/`requireInteraction`/som do sistema |
| 7 | Cancelamento/edição não propagados | Seção 7: sync idempotente e cancelamento imediato |

---

## 3. Arquitetura alvo

```
┌────────────────────────── CLIENTE (PWA) ──────────────────────────┐
│ Módulos (Checklist, Rotina, Reminders, Agenda, Notas, Meu Dia,     │
│ Revisões) ──► alarmBuilder ──► ScheduledAlarm[] (fireAt UTC)       │
│                                   │                                │
│                       alarmSync (debounce, diff, retry, IndexedDB) │
│                                   │ POST /api/push/sync-alarms     │
└───────────────────────────────────┼────────────────────────────────┘
                                    ▼
┌──────────────────────────── SERVIDOR ──────────────────────────────┐
│ SQLite: subscriptions · alarms · deliveries                        │
│ Scheduler (próximo vencimento, não polling cego)                   │
│   └─ web-push.sendNotification(urgency:'high', TTL, topic)         │
│ Limpeza: 404/410 → remove subscription                             │
└───────────────────────────────────┼────────────────────────────────┘
                                    ▼
        FCM (Android/Chrome) · WNS/Mozilla/Edge · APNs (Safari)
                                    ▼
┌────────────── Service Worker (push event) ─────────────────────────┐
│ showNotification(tag, actions, vibrate, data.url)                  │
│ notificationclick → abre/foca rota correta                         │
└────────────────────────────────────────────────────────────────────┘
```

---

## 4. Persistência no servidor (Fase 1)

**Escolha:** SQLite com `better-sqlite3` (síncrono, simples, sem serviço extra). Alternativa: Drizzle ORM sobre o mesmo SQLite. Arquivo em volume persistente (ex.: `DATA_DIR=/data/tronus.db`).

### 4.1 Esquema

```sql
CREATE TABLE subscriptions (
  id            TEXT PRIMARY KEY,         -- hash(endpoint)
  sync_key      TEXT NOT NULL,
  endpoint      TEXT NOT NULL UNIQUE,
  p256dh        TEXT NOT NULL,
  auth          TEXT NOT NULL,
  timezone      TEXT NOT NULL,            -- IANA, ex.: America/Sao_Paulo
  platform      TEXT,                     -- android | ios | windows | other
  user_agent    TEXT,
  created_at    INTEGER NOT NULL,
  last_seen_at  INTEGER NOT NULL,
  last_success_at INTEGER,
  fail_count    INTEGER NOT NULL DEFAULT 0
);
CREATE INDEX idx_sub_sync ON subscriptions(sync_key);

CREATE TABLE alarms (
  id            TEXT NOT NULL,            -- id estável gerado pelo cliente
  sync_key      TEXT NOT NULL,
  fire_at       INTEGER NOT NULL,         -- epoch ms UTC da PRÓXIMA ocorrência
  title         TEXT NOT NULL,
  body          TEXT,
  kind          TEXT NOT NULL,            -- task|routine|pomodoro|timer|reminder|calendar|note|myday|review
  url           TEXT NOT NULL,            -- rota para abrir
  tag           TEXT NOT NULL,            -- estável por alarme (anti-duplicação)
  recurrence    TEXT,                     -- JSON: {freq, byDay[], time:"HH:mm", until?}
  timezone      TEXT NOT NULL,
  payload       TEXT,                     -- JSON extra (actions, etc.)
  version       INTEGER NOT NULL DEFAULT 1,
  status        TEXT NOT NULL DEFAULT 'pending', -- pending|sent|cancelled
  created_at    INTEGER NOT NULL,
  updated_at    INTEGER NOT NULL,
  PRIMARY KEY (sync_key, id)
);
CREATE INDEX idx_alarms_due ON alarms(status, fire_at);

CREATE TABLE deliveries (                 -- idempotência + diagnóstico
  alarm_id TEXT, sync_key TEXT, fire_at INTEGER,
  sub_id TEXT, sent_at INTEGER, http_status INTEGER,
  PRIMARY KEY (alarm_id, sync_key, fire_at, sub_id)
);
```

### 4.2 Regras
- Migração automática na inicialização (`CREATE TABLE IF NOT EXISTS`).
- Backup: o arquivo SQLite fica no volume; habilitar `PRAGMA journal_mode=WAL`.
- Chaves VAPID **persistidas** (env `VAPID_PUBLIC_KEY`, `VAPID_PRIVATE_KEY`, `VAPID_SUBJECT=mailto:...`). **Nunca gerar dinamicamente a cada boot**: isso invalida todas as subscrições existentes. Se ausentes, gerar uma vez e gravar em `DATA_DIR/vapid.json`.
- Substituir os `Map` de `/api/push.ts` por um módulo `src/server/db.ts` com funções: `upsertSubscription`, `removeSubscription`, `replaceAlarms(syncKey, alarms)`, `cancelAlarm`, `getDueAlarms(now)`, `markSent`.

---

## 5. Fuso horário e cálculo de horários (Fase 2)

**Regra de ouro:** o servidor nunca interpreta "08:00" por conta própria sem fuso. Ele trabalha com `fire_at` em UTC e usa o `timezone` apenas para calcular a **próxima** ocorrência de recorrências.

### 5.1 Cliente
- Capturar `Intl.DateTimeFormat().resolvedOptions().timeZone` e enviar em toda subscrição/sync.
- `alarmBuilder.ts` converte cada módulo em `ScheduledAlarm` com `fireAt` (epoch ms) da próxima ocorrência. Para recorrentes, gerar também uma **janela de materialização** (ex.: próximas 14 ocorrências) para o servidor não depender do cliente online para continuar disparando.

### 5.2 Servidor
- Biblioteca: `luxon` (ou `date-fns-tz`) para `nextOccurrence(recurrence, timezone, after)`.
- Após enviar uma ocorrência recorrente, calcular a próxima e atualizar `fire_at` (status volta a `pending`). Alarmes únicos vão para `sent`.
- Lida com horário de verão e meses curtos corretamente via a biblioteca (nada de somar 24 h fixas).

### 5.3 Mapeamento por módulo

| Módulo | Origem | `fireAt` | `url` | `tag` |
|---|---|---|---|---|
| Checklist | `reminderTime` + data | hoje HH:mm (ou amanhã se passou) | `/#/checklist?task=ID` | `task-ID-YYYYMMDD` |
| Rotina | `dayOfWeek` + hora | próxima ocorrência semanal | `/#/rotina` | `routine-ID-YYYYMMDD` |
| Pomodoro | fim da fase atual | `Date.now() + restante` | `/#/lembretes?tab=pomodoro` | `pomodoro` (único) |
| Timer | fim do timer | `Date.now() + restante` | `/#/lembretes?tab=timer&id=ID` | `timer-ID` |
| Lembrete pontual | data/hora + recorrência | conforme | `/#/lembretes?id=ID` | `reminder-ID-...` |
| Agenda | compromisso | `start - antecedência` | `/#/agenda?date=...` | `cal-ID` |
| Notas | alerta fixado/recorrente | conforme | `/#/notas?id=ID` | `note-ID-...` |
| Meu Dia | diário 21:00 | próximo 21:00 no fuso | `/#/meu-dia` | `myday-YYYYMMDD` |
| Revisões | domingo / fim de mês | próxima data | `/#/revisao?tipo=semanal\|mensal` | `review-semanal-YYYYWW` |

> Ajustar as rotas acima ao roteamento real do app (hash vs. path). O importante é que `data.url` seja suficiente para o clique abrir a tela exata.

---

## 6. Scheduler do servidor e Service Worker (Fase 3)

### 6.1 Scheduler no servidor
Substituir o `setInterval(30s)` cego por um scheduler que dorme até o próximo vencimento:

```ts
// src/server/scheduler.ts (esboço)
let timer: NodeJS.Timeout | null = null;

export function rearm() {
  if (timer) clearTimeout(timer);
  const next = db.nextDueAt();                    // MIN(fire_at) WHERE status='pending'
  const MAX = 30_000;                             // teto de segurança (relógio, edições)
  const delay = Math.min(Math.max((next ?? Date.now() + MAX) - Date.now(), 0), MAX);
  timer = setTimeout(tick, delay);
}

async function tick() {
  const due = db.getDueAlarms(Date.now());        // fire_at <= now, pending
  await Promise.allSettled(due.map(deliver));
  rearm();
}
```

- Chamar `rearm()` sempre que `sync-alarms` alterar a tabela.
- **Recuperação após restart/downtime:** no boot, processar alarmes com `fire_at` no passado dentro de uma **janela de tolerância** (ex.: 15 min → ainda envia; mais antigo → descarta ou envia como "perdido" conforme o `kind`). Pomodoro/timer vencidos há muito tempo são descartados.
- **Idempotência:** inserir em `deliveries` antes de enviar; se já existir, não reenviar.
- **Envio** com `web-push`:

```ts
await webpush.sendNotification(subscription, JSON.stringify(payload), {
  TTL: 60 * 60,            // 1 h: se o aparelho estiver offline, entrega ao voltar
  urgency: 'high',         // acorda aparelhos em economia de energia (Android)
  topic: alarm.tag.slice(0, 32), // colapsa duplicatas no serviço push
});
```
- **Tratamento de erro:** `404`/`410` → remover subscrição. `429`/`5xx` → retry com backoff exponencial (3 tentativas). Outros → incrementar `fail_count`; remover após N falhas consecutivas (ex.: 5).
- Fan-out: enviar para **todas** as subscrições do `sync_key` (celular + PC), cada uma com sua entrega.

### 6.2 Service Worker (`public/sw.js`) – receptor de push
- **Remover** o `setInterval(checkScheduledAlarms, 15000)` como mecanismo principal. Pode permanecer como reforço, mas sem ser requisito.
- Manter o handler `push` **sempre exibindo uma notificação** (`userVisibleOnly: true`; no iOS, push sem notificação visível causa revogação da assinatura).

```js
self.addEventListener('push', (event) => {
  const data = event.data ? event.data.json() : {};
  const title = data.title || 'TRONUS';
  const options = {
    body: data.body,
    icon: '/icons/icon-192.png',
    badge: '/icons/badge-72.png',
    tag: data.tag,                       // mesma tag => substitui, não duplica
    renotify: true,                      // vibra/soa de novo se substituir
    requireInteraction: data.kind === 'timer' || data.kind === 'pomodoro',
    vibrate: data.vibrate || [200, 100, 200, 100, 400],
    timestamp: data.fireAt,
    data: { url: data.url || '/', alarmId: data.id, kind: data.kind },
    actions: data.actions || [],         // ver 6.4
  };
  event.waitUntil(self.registration.showNotification(title, options));
});
```

### 6.3 `TimestampTrigger`
- Usar apenas com detecção: `if ('showTrigger' in Notification.prototype)`. Tratar como **bônus** no Chromium com flag ligada; nunca como caminho principal. Como o push do servidor e o trigger usam a mesma `tag`, não geram duplicata.

### 6.4 Ações e clique

```js
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const { url, alarmId } = event.notification.data || {};
  const action = event.action;

  if (action === 'snooze') {
    event.waitUntil(fetch('/api/push/snooze', { method: 'POST',
      headers: {'Content-Type':'application/json'},
      body: JSON.stringify({ alarmId, minutes: 10 }) }));
    return;
  }
  if (action === 'done') {
    event.waitUntil(fetch('/api/push/complete', { method: 'POST',
      headers: {'Content-Type':'application/json'},
      body: JSON.stringify({ alarmId }) }));
    return;
  }

  event.waitUntil((async () => {
    const all = await clients.matchAll({ type: 'window', includeUncontrolled: true });
    for (const c of all) {
      if ('focus' in c) { await c.focus(); c.postMessage({ type: 'NAVIGATE', url }); return; }
    }
    await clients.openWindow(url);
  })());
});
```

Ações sugeridas por tipo:
- Tarefa/Lembrete: `✅ Concluir`, `⏰ Adiar 10 min`
- Pomodoro/Timer: `▶️ Abrir`, `⏰ +5 min`
- Meu Dia/Revisão: `📝 Abrir`

> `snooze`/`complete` por `fetch` no SW exigem `syncKey` acessível: guardar em IndexedDB do SW (já existe `tronus_sw_alarms_db`) ou incluir um token assinado no `data` do payload.

### 6.5 Mudança de assinatura
- Tratar o evento `pushsubscriptionchange`: re-assinar com a mesma chave VAPID e chamar `POST /api/push/subscribe`.

---

## 7. Sincronização bidirecional e cancelamento (Fase 4)

### 7.1 Contrato de sync
`POST /api/push/sync-alarms`
```json
{
  "syncKey": "…",
  "subscription": { "endpoint": "…", "keys": { "p256dh": "…", "auth": "…" } },
  "timezone": "America/Sao_Paulo",
  "platform": "ios",
  "alarms": [ { "id": "…", "fireAt": 1790000000000, "title": "…", "url": "…", "tag": "…", "kind": "task", "recurrence": null } ],
  "mode": "replace"
}
```
- `mode: "replace"` (padrão): o servidor **substitui** todos os alarmes `pending` do `sync_key` pelo conjunto recebido (em transação). Isso resolve exclusões e edições automaticamente, pois o que não está na lista deixa de existir.
- `mode: "patch"` para operações pontuais: `{ upsert: [...], remove: [ids] }`.
- Autenticação leve: `syncKey` longo e aleatório (≥ 128 bits) funciona como segredo; validar tamanho/formato e aplicar rate limit (`express-rate-limit`).

### 7.2 Gatilhos de sync no cliente (`alarmSync.ts`)
Disparar (com debounce de ~500 ms) quando:
- tarefa concluída/reaberta/editada/excluída;
- timer ou Pomodoro iniciado, pausado, retomado, resetado (recalcular `fireAt`);
- rotina, nota, agenda ou lembrete criado/alterado/excluído;
- app volta ao foreground (`visibilitychange`);
- reconexão (`online`) e login/mudança de `syncKey`;
- permissão de notificação concedida ou subscrição renovada.

Pomodoro/Timer: ao **iniciar** → registrar alarme com `fireAt = now + restante`; ao **pausar/resetar** → `remove` imediato; ao **retomar** → novo `fireAt`.

### 7.3 Resiliência offline
- Se o POST falhar, enfileirar na fila existente (`indexedDbQueue`) com retry exponencial e reenvio no `online`/`visibilitychange`.
- Versão (`version`) por alarme para ignorar sync fora de ordem (last-write-wins por `updated_at`).

### 7.4 Dedupe foreground × push
- Se a aba estiver aberta e visível, o app dispara alerta visual/sonoro local e **fecha** a notificação do SW equivalente (`registration.getNotifications({ tag })` → `close()`), ou suprime o push via `clients.matchAll` + `visibilityState === 'visible'` no handler `push` (mostrando apenas um toast in-app por `postMessage`). Escolher **uma** abordagem e padronizar; recomendado: no `push`, se houver janela visível, repassar por `postMessage` e **ainda assim** mostrar a notificação em iOS (exigência de `userVisibleOnly`).

---

## 8. Plataformas específicas (Fase 5)

### 8.1 iOS / iPadOS
- Detectar: `isIOS && !navigator.standalone && !matchMedia('(display-mode: standalone)').matches` → exibir **tela de instruções**: *Compartilhar → Adicionar à Tela de Início → abrir pelo ícone*.
- `Notification.requestPermission()` **somente dentro de handler de clique** (botão "Ativar notificações").
- `manifest.webmanifest` com `display: "standalone"`, `start_url`, ícones 180/192/512 e `<link rel="apple-touch-icon">`.
- Após permissão: `registration.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey })`.
- Sem som customizado; vibração não é controlável.
- Limite: Safari pode descartar assinaturas de PWAs inativos por muito tempo; mitigar com `last_seen_at` e reassinatura ao abrir.

### 8.2 Android (Chrome / PWA instalado)
- Incentivar **instalar o PWA** (`beforeinstallprompt`) para maior prioridade e canal de notificação próprio.
- Exibir dica: *Configurações do Android → Apps → TRONUS → Bateria → Sem restrições* (fabricantes agressivos).
- `urgency: 'high'` e `badge` monocromático (72×72) para a barra de status.

### 8.3 Windows (Chrome / Edge)
- Instalar como PWA e orientar a manter "executar em segundo plano" ligado.
- Verificar Windows *Foco/Não Perturbe* (bloqueia banners); mencionar no diagnóstico.

---

## 9. Som, vibração e prioridade

- Em background, o som vem do **sistema** (canal de notificação). Documentar para o usuário.
- `vibrate` apenas em Android; `requireInteraction: true` para timers/Pomodoro (permanece até interação no desktop).
- **Foreground:** manter `new Audio('/alarm-bell.mp3')` / Web Audio. Desbloquear áudio no primeiro gesto do usuário (criar/resumir `AudioContext` no clique de "Ativar notificações").
- Não prometer toque contínuo em background (impossível via Web Push).

---

## 10. UX e diagnóstico no app (Fase 6)

Criar **Configurações → Notificações** (`NotificationSettings.tsx`) com:

| Item | Fonte | Estados |
|---|---|---|
| Permissão | `Notification.permission` | Concedida · Negada · Não solicitada |
| Suporte do navegador | `'serviceWorker' in navigator && 'PushManager' in window` | Suportado · Não suportado |
| Modo instalado (iOS) | `display-mode: standalone` | Instalado · Pendente |
| Service Worker | `navigator.serviceWorker.ready` | Ativo · Inativo |
| Subscrição Push | `pushManager.getSubscription()` + `GET /api/push/status` | Conectado · Desconectado |
| Fuso horário | IANA detectado vs. salvo no servidor | OK · Divergente |
| Alarmes agendados no servidor | `GET /api/push/status` | Contagem + próximo disparo |
| Último envio com sucesso | `last_success_at` | Data/hora |

Ações:
- **Ativar notificações** (gesto do usuário; trata `denied` com instruções de como reabilitar nas configurações do navegador/SO).
- **Enviar notificação de teste** → `POST /api/push/send` (imediata) e **teste agendado** (+1 min) para validar o scheduler de ponta a ponta com o app fechado.
- **Reparar conexão**: apaga subscrição local, re-assina, re-sincroniza alarmes.
- **Desativar**: `unsubscribe()` + `DELETE /api/push/subscription`.
- Bloco condicional de instruções por plataforma (iOS / Android / Windows) conforme seção 8.

`GET /api/push/status?syncKey=...` retorna: subscrições (plataforma, `last_success_at`, `fail_count`), nº de alarmes pendentes, próximo `fire_at`.

---

## 11. Endpoints (resumo final)

| Método | Rota | Função |
|---|---|---|
| GET | `/api/push/vapid-public-key` | Chave pública (estável) |
| POST | `/api/push/subscribe` | Registra/atualiza subscrição + timezone + plataforma |
| DELETE | `/api/push/subscription` | Remove subscrição |
| POST | `/api/push/sync-alarms` | `replace` ou `patch` de alarmes |
| POST | `/api/push/send` | Notificação imediata (teste) |
| POST | `/api/push/snooze` | Adia alarme (ação da notificação) |
| POST | `/api/push/complete` | Marca concluído/cancela alarme |
| GET | `/api/push/status` | Diagnóstico |
| GET | `/api/health` | Saúde + último tick do scheduler |

Segurança: validar corpo (zod), limitar tamanho (`express.json({limit:'256kb'})`), rate limit por IP/`syncKey`, CORS restrito à origem do app, HTTPS obrigatório (requisito do Web Push).

---

## 12. Alternativa se a hospedagem não mantiver processo persistente

Se o deploy for serverless ou o processo "dormir" (planos gratuitos que suspendem por inatividade):
1. Usar **cron externo** (Cloudflare Cron Triggers, GitHub Actions a cada 5 min, cron-job.org, Supabase `pg_cron`) chamando `POST /api/push/tick` com token secreto. Precisão: granularidade do cron (≥ 1 min; 5 min em alguns planos).
2. Banco gerenciado (**Supabase Postgres**, já usado no projeto) em vez de SQLite, mesmo esquema da seção 4.
3. Para precisão de segundos (Pomodoro/timer curto), é obrigatório processo persistente; documentar a limitação.

---

## 13. Plano de execução por fases

| Fase | Entregas | Critério de aceite |
|---|---|---|
| **1. Persistência** | SQLite, VAPID fixas, migrações, substituir `Map` | Reiniciar o servidor mantém subscrições e alarmes |
| **2. Tempo/Fuso** | `fireAt` UTC, `luxon`, `nextOccurrence`, janela de materialização | Alarme "08:00" dispara às 08:00 de Brasília com servidor em UTC |
| **3. Scheduler + SW** | Scheduler por vencimento, TTL/urgency/topic, idempotência, limpeza 404/410, novo `push`/`notificationclick` | Push chega com app e navegador fechados (Android e Windows) |
| **4. Sync** | `alarmBuilder`, `alarmSync`, modo `replace`/`patch`, fila offline, cancelamento imediato | Concluir tarefa/pausar Pomodoro cancela o push em < 2 s |
| **5. iOS/Android/Windows** | Onboarding, detecção standalone, dicas de bateria | Push chega no iPhone com PWA instalado e tela bloqueada |
| **6. UX/Diagnóstico** | Painel, teste imediato e agendado, reparar conexão | Usuário diagnostica sozinho qualquer falha |
| **7. Ações e rotas** | `actions`, snooze/complete, `data.url`, dedupe foreground | Clique abre a tela exata; sem notificações duplicadas |
| **8. Testes e observabilidade** | Testes e logs (seção 14) | Suíte verde; métricas de entrega visíveis |

Ordem recomendada: 1 → 2 → 3 (já resolve o núcleo) → 4 → 5 → 6 → 7 → 8.

---

## 14. Testes e observabilidade

**Automatizados (Vitest):**
- `nextOccurrence`: diário, semanal por `byDay`, fim de mês, virada de horário de verão, fusos distintos.
- `replaceAlarms`: remoção de alarmes ausentes, idempotência, versão.
- Scheduler: dispara uma vez (`deliveries`), recupera após "restart simulado", respeita janela de tolerância.
- Tratamento de `410`: subscrição removida (mock de `web-push`).

**Manuais (checklist de aceite):**
- [ ] Android Chrome (PWA instalado): app fechado, tela bloqueada, push chega no horário.
- [ ] Android com economia de bateria ativa: atraso aceitável documentado.
- [ ] iPhone (PWA na Tela de Início): tela bloqueada, push chega; clique abre rota correta.
- [ ] Windows Chrome e Edge: navegador fechado com "executar em segundo plano" ligado.
- [ ] Reiniciar o servidor com alarmes pendentes: continuam disparando.
- [ ] Servidor em UTC e usuário em `America/Sao_Paulo`: horário correto.
- [ ] Concluir tarefa 1 min antes: não notifica.
- [ ] Pausar Pomodoro: não notifica; retomar: notifica no novo horário.
- [ ] Dois dispositivos: ambos recebem, sem duplicata no mesmo aparelho.

**Logs/métricas:** registrar por envio (`alarm_id`, `sub_id`, `http_status`, latência `sent_at - fire_at`), contador de remoções 404/410 e último tick do scheduler em `/api/health`.

---

## 15. Variáveis de ambiente

```
VAPID_PUBLIC_KEY=...
VAPID_PRIVATE_KEY=...
VAPID_SUBJECT=mailto:contato@seudominio.com
DATA_DIR=/data
PUSH_TOLERANCE_MINUTES=15
PUSH_MAX_FAILS=5
TICK_TOKEN=...            # só se usar cron externo
ALLOWED_ORIGIN=https://seudominio.com
```

Dependências novas: `better-sqlite3`, `luxon`, `zod`, `express-rate-limit` (já existente: `web-push`).

---

## 16. Riscos e mitigação

| Risco | Mitigação |
|---|---|
| Trocar chaves VAPID invalida subscrições | Persistir chaves; nunca regenerar |
| Hospedagem sem disco persistente | Usar Supabase Postgres (seção 12) |
| Usuário nega permissão | Painel com instruções de reativação |
| iOS sem PWA instalado | Bloquear botão com tutorial e detecção |
| Fabricantes Android matam processos | Orientação de bateria + `urgency: high` |
| Push silencioso revogado no iOS | `push` sempre mostra notificação |
| Spam/abuso da API | Rate limit, validação, `syncKey` forte |
| Duplicatas | `tag` estável + `topic` + `deliveries` + dedupe foreground |

---

## 17. Resultado esperado

Com este plano, o servidor passa a ser a fonte única da verdade dos horários (persistente, em UTC), o Web Push entrega com o app e o navegador fechados nos três sistemas (respeitando os limites de cada plataforma), cancelamentos se propagam imediatamente, e o usuário tem um painel para diagnosticar e testar tudo de ponta a ponta.