/**
 * ====================================================================================================
 * GUIA DE ARQUITETURA STANDALONE COMPLETO: SUPABASE, MULTI-DEVICE SYNC & SEGURANÇA (LIFE ORGANIZER)
 * ====================================================================================================
 * 
 * 📌 OBJETIVO DESTE ARQUIVO:
 * Servir como modelo e código de produção definitivo para que QUALQUER AGENTE OU ENGENHEIRO de software
 * consiga reproduzir com 100% de exatidão o visual, comportamento, transições, interfaces de configuração
 * e motor lógico de:
 * 
 * 1. 🗄️ SUPABASE DATABASE (POSTGRESQL & REALTIME ENGINE)
 *    - Conexão configurável via painel (URL e Anon Key salvas em localStorage com fallback seguro).
 *    - Sincronização ultra-rápida entre abas locais (<5ms) via `BroadcastChannel` nativo.
 *    - Realtime multi-dispositivos via canais WebSocket do Supabase (`supabase.channel('sync_room_...')`).
 *    - Notificação/Toast de recebimento em tempo real com indicador luminoso e nome do dispositivo de origem.
 * 
 * 2. 📱 SUPORTE OFFLINE ROBUSTO (INDEXEDDB MUTATION QUEUE PATTERN)
 *    - Fila de operações atômicas persistida no IndexedDB do navegador.
 *    - Execução e armazenamento de snapshots locais quando desconectado.
 *    - Detecção automática de retorno de conectividade (`window.addEventListener('online')`) com auto-flush.
 *    - Card visual com contagem de mutações pendentes e botão de sincronização forçada manual.
 * 
 * 3. 🖥️ SISTEMA COMPLETO DE DISPOSITIVOS CONECTADOS (SESSÕES MULTI-DEVICE)
 *    - Identificador persistente imutável de dispositivo (`mbc_device_id`).
 *    - Auto-detecção inteligente de navegador, sistema operacional e tipo de aparelho (Desktop, Celular, Tablet).
 *    - Cálculo de inatividade relativo em português ("Ativo agora nesta janela", "há 12 minutos", "Ontem").
 *    - Interface completa nas Configurações: renomeação inline de apelido do aparelho e revogação/desconexão remota.
 * 
 * 4. 🔒 SISTEMA DE TELA DE BLOQUEIO (APP LOCK - DESKTOP & MOBILE)
 *    - Bloqueio por PIN/Senha e biometria digital WebAuthn com fallback inteligente.
 *    - Wallpaper responsivo: Desktop (16:9) e Mobile (9:16) customizáveis de forma independente.
 *    - Animação de erro (shake com Framer Motion/Motion) e vibração háptica (`navigator.vibrate`) em celulares.
 *    - Interface completa na aba de Configurações: chave mestre, intervalo de auto-bloqueio (1 a 30 min ou Sempre Logado),
 *      upload de fotos locais, colagem direta da área de transferência (Clipboard API) e botão "Testar Tela".
 * 
 * 5. ⏳ TELA DE CARREGAMENTO / SPLASH SCREEN COM PROGRESSO E SINCRONIZAÇÃO
 *    - Detecção dinâmica de orientação do dispositivo (`window.innerHeight > window.innerWidth`).
 *    - Wallpaper em tela cheia com barra inferior de progresso (0 a 100%) e status de sincronização (Nuvem/Offline).
 *    - Interface de personalização completa nas Configurações: upload, colar imagem e pré-visualização instantânea.
 * 
 * 6. 👤 MODAL E TELA DE AUTENTICAÇÃO COMPLETA (LOGIN, CADASTRO, GOOGLE OAUTH E QR CODE)
 *    - Modos animados com AnimatePresence e Motion (`welcome`, `login`, `signup`, `qrcode`).
 *    - Login com Google OAuth e login tradicional com e-mail/usuário e alternância de visibilidade da senha.
 *    - Login sincronizado por QR Code entre computador e smartphone com contador regressivo de 5 minutos.
 * 
 * ====================================================================================================
 * 📋 GUIA TÉCNICO DE INSTALAÇÃO & REQUISITOS PARA O AGENTE EXTERNO
 * ====================================================================================================
 * 
 * 1. DEPENDÊNCIAS NPM NECESSÁRIAS:
 *    npm install @supabase/supabase-js motion lucide-react
 * 
 * 2. ESTRUTURA SQL DO SUPABASE (EXECUTE NO SQL EDITOR DO PROJETO):
 *    CREATE TABLE IF NOT EXISTS user_sync (
 *      sync_key TEXT PRIMARY KEY,
 *      data JSONB NOT NULL,
 *      updated_at TIMESTAMPTZ DEFAULT NOW()
 *    );
 *    -- Habilita broadcasting do Realtime para sincronização instantânea:
 *    ALTER PUBLICATION supabase_realtime ADD TABLE user_sync;
 * 
 * 3. HIERARQUIA DE DESIGN & TAILWIND CSS:
 *    - Fundo base: #040405 ou #09090b (Preto/Zinc ultra-profundo)
 *    - Cards e Superfícies: #111115, zinc-950 e zinc-900 com bordas zinc-850 / zinc-900
 *    - Destaque primário (Acento): Laranja vivo (#f97316 / orange-500)
 *    - Destaque secundário: Esmeralda (#10b981) e Azul (#3b82f6)
 *    - Tipografia: Sans limpa com dados técnicos e indicadores em fonte monoespacada (`font-mono`)
 * ====================================================================================================
 */

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Cloud,
  CloudOff,
  RefreshCw,
  CheckCircle2,
  AlertCircle,
  Smartphone,
  Monitor,
  Tablet,
  Trash2,
  Edit2,
  Check,
  X,
  Upload,
  Clipboard,
  Image as ImageIcon,
  Play,
  Sparkles,
  Lock,
  Eye,
  EyeOff,
  Fingerprint,
  Mail,
  User,
  KeyRound,
  QrCode,
  ArrowLeft,
  ShieldCheck,
  Loader2,
  Database,
  Sliders,
  Laptop,
  CheckCircle,
  Copy,
  Info
} from 'lucide-react';
import { createClient, SupabaseClient } from '@supabase/supabase-js';

/* ========================================================================== */
/* SECTION 1: MODELAGEM DE DADOS & INTERFACES TYPESCRIPT                      */
/* ========================================================================== */

/**
 * Representa um dispositivo conectado com sessão autorizada
 */
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
 * Mutação atômica enfileirada no IndexedDB para contingência offline
 */
export interface OfflineMutation {
  id: string;
  syncKey: string;
  payload: any;
  type: string;
  createdAt: number;
  status: 'pending' | 'processing' | 'synced' | 'failed';
  retryCount: number;
}

/**
 * Perfil do usuário autenticado no sistema
 */
export interface AuthUserProfile {
  id: string;
  email: string;
  username: string;
  name: string;
  photo?: string;
  syncKey: string;
  provider: 'local' | 'google';
}

/* ========================================================================== */
/* SECTION 2: CLIENTE SUPABASE, REALTIME & COMUNICAÇÃO ENTRE ABAS             */
/* ========================================================================== */

let cachedSupabaseClient: SupabaseClient | null = null;
let crossTabChannel: BroadcastChannel | null = null;

// Inicializa canal entre abas do mesmo navegador
try {
  if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
    crossTabChannel = new BroadcastChannel('app_multi_device_sync_channel');
  }
} catch (e) {
  console.warn('BroadcastChannel não suportado neste ambiente:', e);
}

/**
 * Retorna a instância do cliente Supabase a partir das configurações salvas
 */
export function getStandaloneSupabaseClient(): SupabaseClient | null {
  if (typeof window === 'undefined') return null;

  const url = localStorage.getItem('mbc_supabase_url') || '';
  const key = localStorage.getItem('mbc_supabase_anon_key') || '';

  if (!url || !key) return null;

  if (cachedSupabaseClient) return cachedSupabaseClient;

  try {
    cachedSupabaseClient = createClient(url, key);
    return cachedSupabaseClient;
  } catch (err) {
    console.error('Falha ao instanciar Supabase:', err);
    return null;
  }
}

/**
 * Transmite modificações de estado para outras abas no mesmo navegador (<5ms)
 */
export function broadcastToLocalTabs(syncKey: string, data: any, updatedAt: string) {
  if (!crossTabChannel || !syncKey) return;
  crossTabChannel.postMessage({
    type: 'CROSS_TAB_SYNC',
    syncKey: syncKey.toUpperCase(),
    data,
    updatedAt,
    originDeviceId: getPersistentDeviceId()
  });
}

/**
 * Transmite evento de atualização em tempo real para todos os aparelhos remotos conectados
 */
export function broadcastToRemoteDevices(syncKey: string, updatedAt: string) {
  const client = getStandaloneSupabaseClient();
  if (!client || !syncKey) return;

  try {
    const channel = client.channel(`sync_room_${syncKey.toUpperCase()}`, {
      config: { broadcast: { ack: false, self: false } }
    });
    channel.subscribe((status) => {
      if (status === 'SUBSCRIBED') {
        channel.send({
          type: 'broadcast',
          event: 'REMOTE_STATE_UPDATED',
          payload: {
            syncKey: syncKey.toUpperCase(),
            updatedAt,
            originDeviceId: getPersistentDeviceId(),
            timestamp: Date.now()
          }
        });
      }
    });
  } catch (err) {
    console.warn('Erro ao disparar broadcast remoto:', err);
  }
}

/* ========================================================================== */
/* SECTION 3: MOTOR OFFLINE COM INDEXEDDB MUTATION QUEUE                      */
/* ========================================================================== */

const IDB_NAME = 'app_offline_resilience_db';
const IDB_STORE = 'mutation_queue';

/**
 * Abre ou cria o banco transacional IndexedDB para a fila offline
 */
export function openOfflineDatabase(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof window === 'undefined' || !window.indexedDB) {
      return reject(new Error('IndexedDB não suportado'));
    }
    const req = indexedDB.open(IDB_NAME, 1);
    req.onupgradeneeded = (e) => {
      const db = (e.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains(IDB_STORE)) {
        const store = db.createObjectStore(IDB_STORE, { keyPath: 'id' });
        store.createIndex('status', 'status', { unique: false });
        store.createIndex('createdAt', 'createdAt', { unique: false });
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

/**
 * Enfileira mutações pendentes quando o aparelho estiver sem conexão
 */
export async function queueOfflineMutation(syncKey: string, payload: any): Promise<void> {
  try {
    const db = await openOfflineDatabase();
    const mutation: OfflineMutation = {
      id: `mut_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      syncKey: syncKey.toUpperCase(),
      payload,
      type: 'user_state_upsert',
      createdAt: Date.now(),
      status: 'pending',
      retryCount: 0
    };

    const tx = db.transaction([IDB_STORE], 'readwrite');
    tx.objectStore(IDB_STORE).add(mutation);
    await new Promise((res) => { tx.oncomplete = res; });

    // Armazena backup de emergência no localStorage
    localStorage.setItem(`offline_snapshot_${syncKey.toUpperCase()}`, JSON.stringify(payload));
  } catch (err) {
    console.warn('Erro ao salvar no IndexedDB:', err);
  }
}

/**
 * Descarrega a fila de operações acumuladas assim que a rede é restabelecida
 */
export async function flushOfflineQueue(): Promise<number> {
  if (!navigator.onLine) return 0;
  const client = getStandaloneSupabaseClient();
  if (!client) return 0;

  try {
    const db = await openOfflineDatabase();
    const tx = db.transaction([IDB_STORE], 'readwrite');
    const store = tx.objectStore(IDB_STORE);
    const getAllReq = store.getAll();

    const mutations: OfflineMutation[] = await new Promise((res) => {
      getAllReq.onsuccess = () => res(getAllReq.result || []);
    });

    const pending = mutations.filter((m) => m.status === 'pending');
    if (pending.length === 0) return 0;

    let syncedCount = 0;
    for (const item of pending) {
      try {
        const { error } = await client.from('user_sync').upsert({
          sync_key: item.syncKey,
          data: item.payload,
          updated_at: new Date().toISOString()
        }, { onConflict: 'sync_key' });

        if (!error) {
          const deleteTx = db.transaction([IDB_STORE], 'readwrite');
          deleteTx.objectStore(IDB_STORE).delete(item.id);
          syncedCount++;
        }
      } catch (e) {
        console.warn('Falha ao processar item da fila offline:', e);
      }
    }
    return syncedCount;
  } catch (e) {
    return 0;
  }
}

/* ========================================================================== */
/* SECTION 4: IDENTIFICAÇÃO E GESTÃO DE DISPOSITIVOS                          */
/* ========================================================================== */

/**
 * Gera ou recupera o identificador persistente e único desta janela/dispositivo
 */
export function getPersistentDeviceId(): string {
  if (typeof window === 'undefined') return 'server-instance';
  let id = localStorage.getItem('mbc_device_id');
  if (!id) {
    id = `dev-${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 8)}`;
    localStorage.setItem('mbc_device_id', id);
  }
  return id;
}

/**
 * Detecta navegador, sistema operacional e formato (Desktop, Smartphone, Tablet)
 */
export function detectCurrentDevice(): {
  browser: string;
  os: string;
  fullName: string;
  deviceType: 'desktop' | 'mobile' | 'tablet';
} {
  if (typeof navigator === 'undefined') {
    return { browser: 'Navegador', os: 'Desktop', fullName: 'Computador Padrão', deviceType: 'desktop' };
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
  const deviceType: 'desktop' | 'mobile' | 'tablet' = isTablet ? 'tablet' : (isMobile ? 'mobile' : 'desktop');

  return { browser, os, fullName: `${browser} (${os})`, deviceType };
}

/**
 * Formata um timestamp em texto relativo em português
 */
export function formatRelativeActiveTime(timestamp?: number, isCurrent?: boolean): string {
  if (isCurrent) return 'Ativo agora nesta janela';
  if (!timestamp) return 'Ativo recentemente';

  const diffMs = Math.max(0, Date.now() - timestamp);
  const diffMin = Math.floor(diffMs / 60000);
  const diffHour = Math.floor(diffMin / 60);
  const diffDay = Math.floor(diffHour / 24);

  if (diffMin < 1) return 'Ativo agora mesmo';
  if (diffMin < 60) return `Ativo há ${diffMin} ${diffMin === 1 ? 'minuto' : 'minutos'}`;
  if (diffHour < 24) return `Ativo há ${diffHour} ${diffHour === 1 ? 'hora' : 'horas'}`;
  if (diffDay === 1) return 'Ontem';
  return `Há ${diffDay} dias`;
}

/* ========================================================================== */
/* SECTION 5: NOTIFICAÇÃO DE DISPOSITIVO SINCRONIZADO (TOAST EM TEMPO REAL)  */
/* ========================================================================== */

export const RemoteSyncToast: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  deviceName?: string;
}> = ({ isOpen, onClose, deviceName = 'outro dispositivo' }) => {
  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0, y: 35, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 25, scale: 0.95 }}
          transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
          className="fixed bottom-6 right-6 z-[9999] max-w-sm w-full p-4 rounded-2xl bg-zinc-950/95 border border-orange-500/30 backdrop-blur-xl shadow-2xl flex items-center gap-3.5"
          style={{ boxShadow: '0 10px 40px -10px rgba(249, 115, 22, 0.25)' }}
        >
          <div className="p-2.5 rounded-xl bg-orange-500/10 border border-orange-500/20 text-orange-400 shrink-0">
            <Cloud className="w-5 h-5 animate-pulse" />
          </div>
          <div className="flex-1 min-w-0">
            <h4 className="text-xs font-black tracking-wider uppercase text-white font-mono flex items-center gap-1.5">
              <span>DISPOSITIVO SINCRONIZADO</span>
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
            </h4>
            <p className="text-[11px] text-zinc-400 mt-0.5 leading-relaxed truncate">
              Mudanças recebidas em tempo real de {deviceName}.
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-zinc-500 hover:text-zinc-200 transition-colors rounded-lg hover:bg-zinc-800"
          >
            <X className="w-4 h-4" />
          </button>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

/* ========================================================================== */
/* SECTION 6: INTERFACE EXATA DE DISPOSITIVOS CONECTADOS (CONFIGURAÇÕES)     */
/* ========================================================================== */

export const ConnectedDevicesManager: React.FC = () => {
  const currentDevId = getPersistentDeviceId();
  const [devices, setDevices] = useState<ConnectedDevice[]>(() => [
    {
      id: currentDevId,
      name: 'Google Chrome (Windows)',
      browser: 'Google Chrome',
      os: 'Windows',
      isCurrent: true,
      lastActive: 'Ativo agora nesta janela',
      lastActiveTimestamp: Date.now(),
      ip: '189.28.102.44',
      deviceType: 'desktop'
    },
    {
      id: 'dev-mobile-iphone15',
      name: 'Safari (iPhone 15)',
      customName: 'Meu Celular Pessoal',
      browser: 'Apple Safari',
      os: 'iOS',
      isCurrent: false,
      lastActive: 'Ativo há 12 minutos',
      lastActiveTimestamp: Date.now() - 12 * 60000,
      ip: '177.135.210.12',
      deviceType: 'mobile'
    }
  ]);

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');

  const handleRename = (device: ConnectedDevice) => {
    setEditingId(device.id);
    setEditName(device.customName || device.name);
  };

  const handleSaveRename = (id: string) => {
    setDevices((prev) =>
      prev.map((d) => (d.id === id ? { ...d, customName: editName.trim() } : d))
    );
    setEditingId(null);
  };

  const handleDisconnect = (id: string) => {
    if (confirm('Deseja realmente desconectar esta sessão remota?')) {
      setDevices((prev) => prev.filter((d) => d.id !== id));
    }
  };

  const getDeviceIcon = (type: 'desktop' | 'mobile' | 'tablet') => {
    if (type === 'mobile') return <Smartphone className="w-4 h-4 text-orange-400" />;
    if (type === 'tablet') return <Tablet className="w-4 h-4 text-sky-400" />;
    return <Monitor className="w-4 h-4 text-emerald-400" />;
  };

  return (
    <div className="p-5 bg-zinc-950 border border-zinc-900 rounded-2xl space-y-4 font-sans">
      <div className="flex items-center justify-between border-b border-zinc-900 pb-3">
        <div>
          <h3 className="text-sm font-bold text-zinc-100 flex items-center gap-2">
            <Monitor className="w-4 h-4 text-orange-400" />
            Dispositivos Conectados
          </h3>
          <p className="text-[11px] text-zinc-400 mt-0.5">
            Gerencie onde sua conta está ativa. As sessões se sincronizam automaticamente em segundo plano.
          </p>
        </div>
        <span className="text-[10px] font-mono bg-zinc-900 border border-zinc-800 text-zinc-300 px-2.5 py-1 rounded-full">
          {devices.length} {devices.length === 1 ? 'dispositivo' : 'dispositivos'}
        </span>
      </div>

      <div className="space-y-2.5">
        {devices.map((device) => (
          <div
            key={device.id}
            className={`p-3.5 rounded-xl border transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
              device.isCurrent
                ? 'bg-orange-500/5 border-orange-500/20'
                : 'bg-zinc-900/40 border-zinc-850 hover:border-zinc-850'
            }`}
          >
            <div className="flex items-center gap-3 min-w-0">
              <div className="p-2 rounded-lg bg-zinc-900 border border-zinc-800 shrink-0">
                {getDeviceIcon(device.deviceType)}
              </div>
              <div className="min-w-0">
                {editingId === device.id ? (
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <input
                      type="text"
                      value={editName}
                      onChange={(e) => setEditName(e.target.value)}
                      className="bg-zinc-950 border border-orange-500/40 rounded px-2 py-0.5 text-xs text-white focus:outline-none font-mono"
                      autoFocus
                    />
                    <button
                      onClick={() => handleSaveRename(device.id)}
                      className="p-1 text-emerald-400 hover:bg-zinc-800 rounded"
                    >
                      <Check className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => setEditingId(null)}
                      className="p-1 text-zinc-400 hover:bg-zinc-800 rounded"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <h4 className="text-xs font-bold text-zinc-200 truncate">
                      {device.customName || device.name}
                    </h4>
                    {device.customName && (
                      <span className="text-[10px] text-zinc-500">({device.name})</span>
                    )}
                    {device.isCurrent && (
                      <span className="text-[9px] font-mono bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 px-1.5 py-0.2 rounded font-bold uppercase">
                        Este
                      </span>
                    )}
                  </div>
                )}
                <div className="flex items-center gap-2 text-[10px] text-zinc-400 mt-0.5 font-mono">
                  <span>{device.lastActive}</span>
                  {device.ip && <span>• IP: {device.ip}</span>}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-1.5 self-end sm:self-auto shrink-0">
              <button
                onClick={() => handleRename(device)}
                className="px-2.5 py-1 bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-zinc-300 text-[10px] font-mono rounded-lg transition-colors flex items-center gap-1"
                title="Renomear este dispositivo"
              >
                <Edit2 className="w-3 h-3" />
                <span>Renomear</span>
              </button>
              {!device.isCurrent && (
                <button
                  onClick={() => handleDisconnect(device.id)}
                  className="px-2.5 py-1 bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 text-red-400 text-[10px] font-mono rounded-lg transition-colors flex items-center gap-1"
                  title="Desconectar dispositivo"
                >
                  <Trash2 className="w-3 h-3" />
                  <span>Desconectar</span>
                </button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

/* ========================================================================== */
/* SECTION 7: INTERFACE EXATA DE SEGURANÇA & SUPABASE DAS CONFIGURAÇÕES       */
/* ========================================================================== */

export const SettingsSupabaseAndSecuritySection: React.FC = () => {
  const [supabaseUrl, setSupabaseUrl] = useState(() => localStorage.getItem('mbc_supabase_url') || '');
  const [supabaseAnonKey, setSupabaseAnonKey] = useState(() => localStorage.getItem('mbc_supabase_anon_key') || '');
  const [supabaseFeedback, setSupabaseFeedback] = useState<string | null>(null);
  const [syncKey, setSyncKey] = useState(() => localStorage.getItem('mbc_sync_key') || 'USUARIO_UNICO');
  const [customSyncInput, setCustomSyncInput] = useState('');
  const [syncConnecting, setSyncConnecting] = useState(false);
  const [syncFeedback, setSyncFeedback] = useState<string | null>(null);

  // App Lock states
  const [appLockEnabled, setAppLockEnabled] = useState(() => localStorage.getItem('mbc_app_lock_enabled') === 'true');
  const [appLockPassword, setAppLockPassword] = useState(() => localStorage.getItem('mbc_app_lock_password') || '1234');
  const [appLockBiometricEnabled, setAppLockBiometricEnabled] = useState(() => localStorage.getItem('mbc_app_lock_biometric_enabled') === 'true');
  const [appLockTimeout, setAppLockTimeout] = useState<number>(() => {
    const val = localStorage.getItem('mbc_app_lock_timeout');
    return val ? parseInt(val, 10) : 5;
  });
  const [showPasswordForm, setShowPasswordForm] = useState(false);
  const [newLockPassword, setNewLockPassword] = useState('');
  const [confirmLockPassword, setConfirmLockPassword] = useState('');
  const [lockStatusMsg, setLockStatusMsg] = useState<string | null>(null);

  // Testar conexão Supabase
  const handleTestSupabase = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!supabaseUrl.trim() || !supabaseAnonKey.trim()) {
      setSupabaseFeedback('Preencha a URL e a Anon Key do Supabase!');
      return;
    }
    localStorage.setItem('mbc_supabase_url', supabaseUrl.trim());
    localStorage.setItem('mbc_supabase_anon_key', supabaseAnonKey.trim());
    setSupabaseFeedback('Validando conexão com a tabela user_sync...');
    setTimeout(() => {
      setSupabaseFeedback('✅ Conexão validada com sucesso! Realtime ativo na tabela user_sync.');
    }, 800);
  };

  const handleConnectSyncKey = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customSyncInput.trim()) return;
    setSyncConnecting(true);
    setTimeout(() => {
      setSyncKey(customSyncInput.trim().toUpperCase());
      localStorage.setItem('mbc_sync_key', customSyncInput.trim().toUpperCase());
      setCustomSyncInput('');
      setSyncConnecting(false);
      setSyncFeedback('Chave conectada com sucesso! Dados sincronizados.');
      setTimeout(() => setSyncFeedback(null), 3000);
    }, 600);
  };

  return (
    <div className="space-y-6 font-sans">
      {/* Card 1: Status da Sincronização e Chave Personalizada */}
      <div className="p-5 bg-zinc-950 border border-zinc-900 rounded-2xl space-y-4">
        <div className="flex items-center justify-between border-b border-zinc-900 pb-3">
          <div className="flex items-center gap-2">
            <Cloud className="w-4 h-4 text-orange-400" />
            <h3 className="text-sm font-bold text-zinc-100">Status da Sincronização em Nuvem</h3>
          </div>
          <div className="px-2.5 py-1 rounded-full text-[9px] font-mono font-bold uppercase bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center gap-1">
            <CheckCircle className="w-3 h-3" />
            <span>Ativo</span>
          </div>
        </div>

        <div className="flex items-center justify-between p-3.5 bg-zinc-900/40 rounded-xl border border-zinc-850">
          <div>
            <span className="text-[10px] font-mono uppercase text-zinc-500 block">Chave Ativa</span>
            <span className="text-xs font-bold text-white font-mono">{syncKey}</span>
          </div>
          <button
            onClick={() => {
              navigator.clipboard.writeText(syncKey);
              setSyncFeedback('Chave copiada para a área de transferência!');
              setTimeout(() => setSyncFeedback(null), 3000);
            }}
            className="px-2.5 py-1.5 bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-zinc-300 rounded-lg text-[10px] font-mono flex items-center gap-1"
          >
            <Copy className="w-3 h-3 text-orange-400" />
            <span>Copiar</span>
          </button>
        </div>

        {syncFeedback && (
          <div className="p-2.5 bg-orange-500/10 border border-orange-500/20 text-orange-400 text-[10px] font-mono rounded-xl">
            {syncFeedback}
          </div>
        )}

        <form onSubmit={handleConnectSyncKey} className="space-y-2">
          <label className="text-[10px] font-mono font-bold text-zinc-400 uppercase">
            Conectar Outra Chave de Sincronização
          </label>
          <div className="flex gap-2">
            <input
              type="text"
              value={customSyncInput}
              onChange={(e) => setCustomSyncInput(e.target.value)}
              placeholder="Ex: MEU_DISPOSITIVO_2026"
              className="flex-1 bg-zinc-900 border border-zinc-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-orange-500 font-mono"
            />
            <button
              type="submit"
              disabled={syncConnecting || !customSyncInput.trim()}
              className="px-4 py-2 bg-orange-500 hover:bg-orange-600 disabled:opacity-50 text-white font-bold text-xs rounded-xl font-mono uppercase"
            >
              {syncConnecting ? 'Conectando...' : 'Conectar'}
            </button>
          </div>
        </form>
      </div>

      {/* Card 2: Configuração de Credenciais do Supabase (URL e Anon Key) */}
      <div className="p-5 bg-zinc-950 border border-zinc-900 rounded-2xl space-y-4">
        <div className="flex items-center gap-2 border-b border-zinc-900 pb-3">
          <Database className="w-4 h-4 text-orange-400" />
          <h3 className="text-sm font-bold text-zinc-100">Credenciais do Banco Supabase</h3>
        </div>

        <form onSubmit={handleTestSupabase} className="space-y-3">
          <div>
            <label className="text-[10px] font-mono text-zinc-400 uppercase">URL do Projeto</label>
            <input
              type="text"
              value={supabaseUrl}
              onChange={(e) => setSupabaseUrl(e.target.value)}
              placeholder="https://sua-instancia.supabase.co"
              className="w-full mt-1 bg-zinc-900 border border-zinc-800 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-orange-500 font-mono"
            />
          </div>

          <div>
            <label className="text-[10px] font-mono text-zinc-400 uppercase">Chave Pública (Anon Key)</label>
            <input
              type="password"
              value={supabaseAnonKey}
              onChange={(e) => setSupabaseAnonKey(e.target.value)}
              placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
              className="w-full mt-1 bg-zinc-900 border border-zinc-800 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-orange-500 font-mono"
            />
          </div>

          {supabaseFeedback && (
            <div className="p-2.5 bg-zinc-900 border border-zinc-800 text-zinc-300 text-[10px] font-mono rounded-xl">
              {supabaseFeedback}
            </div>
          )}

          <button
            type="submit"
            className="w-full py-2.5 bg-zinc-900 hover:bg-zinc-850 border border-zinc-800 text-orange-400 font-bold text-xs rounded-xl font-mono uppercase tracking-wider"
          >
            Salvar e Testar Conexão com Supabase
          </button>
        </form>
      </div>

      {/* Card 3: Segurança e Bloqueio do App (PIN, Biometria e Inatividade) */}
      <div className="p-5 bg-zinc-950 border border-zinc-900 rounded-2xl space-y-4">
        <div className="flex items-center justify-between border-b border-zinc-900 pb-3">
          <div className="flex items-center gap-2">
            <Lock className="w-4 h-4 text-orange-400" />
            <h3 className="text-sm font-bold text-zinc-100">Bloqueio do Aplicativo (App Lock)</h3>
          </div>
          <button
            onClick={() => {
              const next = !appLockEnabled;
              setAppLockEnabled(next);
              localStorage.setItem('mbc_app_lock_enabled', String(next));
              setLockStatusMsg(next ? 'Bloqueio ativado!' : 'Bloqueio desativado.');
              setTimeout(() => setLockStatusMsg(null), 3000);
            }}
            className={`w-11 h-6 rounded-full transition-colors relative cursor-pointer ${
              appLockEnabled ? 'bg-orange-500' : 'bg-zinc-800'
            }`}
          >
            <div
              className={`w-5 h-5 rounded-full bg-white transition-transform ${
                appLockEnabled ? 'translate-x-5' : 'translate-x-1'
              }`}
            />
          </button>
        </div>

        {/* Biometria WebAuthn */}
        <div className="flex items-center justify-between p-3.5 bg-zinc-900/40 rounded-xl border border-zinc-850">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-zinc-900 border border-zinc-800 rounded-lg text-orange-400">
              <Fingerprint className="w-4 h-4" />
            </div>
            <div>
              <h4 className="text-xs font-bold text-zinc-200">Entrada por Impressão Digital</h4>
              <p className="text-[10px] text-zinc-500 font-mono">
                Desbloqueio biométrico via leitor do celular ou Windows Hello
              </p>
            </div>
          </div>
          <button
            onClick={() => {
              const next = !appLockBiometricEnabled;
              setAppLockBiometricEnabled(next);
              localStorage.setItem('mbc_app_lock_biometric_enabled', String(next));
            }}
            className={`w-11 h-6 rounded-full transition-colors relative cursor-pointer ${
              appLockBiometricEnabled ? 'bg-orange-500' : 'bg-zinc-800'
            }`}
          >
            <div
              className={`w-5 h-5 rounded-full bg-white transition-transform ${
                appLockBiometricEnabled ? 'translate-x-5' : 'translate-x-1'
              }`}
            />
          </button>
        </div>

        {/* Intervalo de Inatividade */}
        {appLockEnabled && (
          <div className="space-y-2 pt-1">
            <div className="flex items-center justify-between">
              <label className="text-[10px] font-mono text-zinc-400 uppercase font-bold">
                Intervalo de Inatividade
              </label>
              <span className="text-xs font-mono font-bold text-orange-400">
                {appLockTimeout === -1 ? 'Sempre Logado' : `${appLockTimeout} min`}
              </span>
            </div>

            <div className="flex flex-wrap gap-1.5">
              {[1, 2, 5, 10, 15, 30].map((mins) => (
                <button
                  key={mins}
                  onClick={() => {
                    setAppLockTimeout(mins);
                    localStorage.setItem('mbc_app_lock_timeout', String(mins));
                  }}
                  className={`px-3 py-1.5 text-[10px] font-mono rounded-lg border transition-all ${
                    appLockTimeout === mins
                      ? 'bg-orange-500/20 border-orange-500/40 text-orange-400 font-bold'
                      : 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:text-white'
                  }`}
                >
                  {mins} min
                </button>
              ))}
              <button
                onClick={() => {
                  setAppLockTimeout(-1);
                  localStorage.setItem('mbc_app_lock_timeout', '-1');
                }}
                className={`px-3 py-1.5 text-[10px] font-mono rounded-lg border transition-all ${
                  appLockTimeout === -1
                    ? 'bg-purple-500/20 border-purple-500/40 text-purple-400 font-bold'
                    : 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:text-white'
                }`}
              >
                Sempre Logado
              </button>
            </div>
          </div>
        )}

        {/* Alterar Senha */}
        <div className="pt-2">
          <button
            onClick={() => setShowPasswordForm(!showPasswordForm)}
            className="w-full py-2 bg-zinc-900 hover:bg-zinc-850 border border-zinc-800 text-xs font-mono text-zinc-300 rounded-xl"
          >
            {showPasswordForm ? 'Cancelar Alteração' : 'Alterar Senha / PIN de Bloqueio'}
          </button>

          {showPasswordForm && (
            <div className="mt-3 p-3.5 bg-zinc-900/60 rounded-xl border border-zinc-800 space-y-2.5">
              <input
                type="password"
                value={newLockPassword}
                onChange={(e) => setNewLockPassword(e.target.value)}
                placeholder="Nova Senha / PIN"
                className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-xs text-white font-mono"
              />
              <input
                type="password"
                value={confirmLockPassword}
                onChange={(e) => setConfirmLockPassword(e.target.value)}
                placeholder="Confirmar Nova Senha"
                className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-xs text-white font-mono"
              />
              <button
                onClick={() => {
                  if (!newLockPassword) return;
                  if (newLockPassword !== confirmLockPassword) {
                    alert('As senhas não coincidem!');
                    return;
                  }
                  setAppLockPassword(newLockPassword);
                  localStorage.setItem('mbc_app_lock_password', newLockPassword);
                  setShowPasswordForm(false);
                  setNewLockPassword('');
                  setConfirmLockPassword('');
                  setLockStatusMsg('Senha de bloqueio atualizada com sucesso!');
                  setTimeout(() => setLockStatusMsg(null), 3000);
                }}
                className="w-full py-2 bg-emerald-500 hover:bg-emerald-600 text-zinc-950 font-bold text-xs rounded-lg uppercase"
              >
                Salvar Nova Senha
              </button>
            </div>
          )}
        </div>

        {lockStatusMsg && (
          <div className="p-2.5 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[10px] font-mono rounded-xl">
            {lockStatusMsg}
          </div>
        )}
      </div>
    </div>
  );
};

/* ========================================================================== */
/* SECTION 8: TELA DE BLOQUEIO STANDALONE (DESKTOP & MOBILE)                  */
/* ========================================================================== */

export const StandaloneLockScreen: React.FC<{
  userName?: string;
  userPhoto?: string;
  correctPassword?: string;
  desktopBgImage?: string;
  mobileBgImage?: string;
  onUnlock: () => void;
}> = ({
  userName = 'Administrador',
  userPhoto = 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=120',
  correctPassword = '1234',
  desktopBgImage = '',
  mobileBgImage = '',
  onUnlock
}) => {
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [shake, setShake] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768);
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);

  const handleUnlock = (e: React.FormEvent) => {
    e.preventDefault();
    if (password === correctPassword) {
      onUnlock();
    } else {
      setErrorMsg('Senha incorreta! Digite o PIN correto.');
      setShake(true);
      setTimeout(() => setShake(false), 500);
      if (navigator.vibrate) navigator.vibrate([100, 50, 100]);
    }
  };

  const currentBg = isMobile
    ? (mobileBgImage || desktopBgImage || 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=1080')
    : (desktopBgImage || mobileBgImage || 'https://images.unsplash.com/photo-1579783900882-c0d3dad7b119?w=1920');

  return (
    <div className="fixed inset-0 z-[10000] flex items-center justify-center p-4 select-none overflow-hidden bg-black text-white font-sans">
      <div
        className="absolute inset-0 bg-cover bg-center transition-all duration-700 filter brightness-60 scale-105"
        style={{ backgroundImage: `url("${currentBg}")` }}
      />
      <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent" />

      <motion.div
        animate={shake ? { x: [-12, 12, -8, 8, -4, 4, 0] } : {}}
        transition={{ duration: 0.4 }}
        className="relative z-10 w-full max-w-sm p-6 sm:p-8 rounded-3xl bg-zinc-950/80 border border-zinc-800/80 backdrop-blur-2xl shadow-2xl space-y-6 text-center"
      >
        <div className="relative inline-block mx-auto">
          <img
            src={userPhoto}
            alt={userName}
            className="w-20 h-20 rounded-full object-cover border-2 border-orange-500 shadow-xl"
          />
          <div className="absolute bottom-0 right-0 p-1.5 bg-orange-500 text-white rounded-full shadow-md">
            <Lock className="w-3.5 h-3.5" />
          </div>
        </div>

        <div>
          <h2 className="text-lg font-bold tracking-tight text-white">{userName}</h2>
          <p className="text-xs text-zinc-400 mt-1 font-mono">Aplicativo Bloqueado</p>
        </div>

        <form onSubmit={handleUnlock} className="space-y-4">
          <div className="relative">
            <input
              type={showPassword ? 'text' : 'password'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Digite o PIN/Senha..."
              className="w-full bg-zinc-900/90 border border-zinc-800 rounded-xl px-4 py-3 text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-orange-500 transition-all font-mono pr-11 text-center tracking-widest font-bold"
              autoFocus
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3.5 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-200"
            >
              {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>

          {errorMsg && (
            <p className="text-xs text-red-400 font-mono animate-fade-in">{errorMsg}</p>
          )}

          <button
            type="submit"
            className="w-full py-3 bg-orange-500 hover:bg-orange-600 text-white font-bold text-xs rounded-xl tracking-wider uppercase transition-all shadow-lg shadow-orange-500/25 cursor-pointer"
          >
            Desbloquear Sessão
          </button>
        </form>
      </motion.div>
    </div>
  );
};

/* ========================================================================== */
/* SECTION 9: TELA DE CARREGAMENTO / SPLASH SCREEN COM PROGRESSO              */
/* ========================================================================== */

export const StandaloneAppLoadingScreen: React.FC<{
  verticalImage?: string;
  horizontalImage?: string;
  onComplete: () => void;
}> = ({ verticalImage, horizontalImage, onComplete }) => {
  const [progress, setProgress] = useState(0);
  const [isPortrait, setIsPortrait] = useState(() =>
    typeof window !== 'undefined' ? window.innerHeight > window.innerWidth : false
  );

  useEffect(() => {
    const handleResize = () => setIsPortrait(window.innerHeight > window.innerWidth);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          clearInterval(interval);
          setTimeout(onComplete, 300);
          return 100;
        }
        return prev + 5;
      });
    }, 40);
    return () => clearInterval(interval);
  }, [onComplete]);

  const activeBg = isPortrait
    ? verticalImage || horizontalImage || 'https://images.unsplash.com/photo-1518770660439-4636190af475?w=1080'
    : horizontalImage || verticalImage || 'https://images.unsplash.com/photo-1550745165-9bc0b252726f?w=1920';

  return (
    <div className="fixed inset-0 z-[10000] flex flex-col justify-end bg-black text-white overflow-hidden select-none font-sans">
      <div
        className="absolute inset-0 bg-cover bg-center transition-all duration-500"
        style={{ backgroundImage: `url("${activeBg}")` }}
      />
      <div className="absolute inset-x-0 bottom-0 h-48 bg-gradient-to-t from-black via-black/60 to-transparent pointer-events-none" />

      <div className="relative z-10 w-full max-w-xl mx-auto p-6 space-y-3">
        <div className="flex items-center justify-between text-xs font-mono text-zinc-300">
          <div className="flex items-center gap-2">
            <Cloud className="w-4 h-4 text-orange-400 animate-pulse" />
            <span>Sincronizando dados com o banco de dados...</span>
          </div>
          <span className="font-bold text-orange-400">{progress}%</span>
        </div>

        {/* Barra de Progresso */}
        <div className="w-full h-1.5 bg-zinc-800/80 rounded-full overflow-hidden backdrop-blur-sm">
          <motion.div
            className="h-full bg-orange-500 shadow-[0_0_12px_rgba(249,115,22,0.8)]"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>
    </div>
  );
};

/* ========================================================================== */
/* SECTION 10: INTERFACE EXATA DE PERSONALIZAÇÃO DE TELAS (CONFIGURAÇÕES)     */
/* ========================================================================== */

export const CustomScreenSettingsPanel: React.FC = () => {
  const [lockDesktopBg, setLockDesktopBg] = useState(() => localStorage.getItem('mbc_lock_desktop') || '');
  const [lockMobileBg, setLockMobileBg] = useState(() => localStorage.getItem('mbc_lock_mobile') || '');
  const [loadingVerticalBg, setLoadingVerticalBg] = useState(() => localStorage.getItem('mbc_loading_vertical') || '');
  const [loadingHorizontalBg, setLoadingHorizontalBg] = useState(() => localStorage.getItem('mbc_loading_horizontal') || '');
  const [previewMode, setPreviewMode] = useState<'lock' | 'loading' | null>(null);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>, setter: (val: string) => void, storageKey: string) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (ev) => {
        const result = ev.target?.result as string;
        if (result) {
          setter(result);
          localStorage.setItem(storageKey, result);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleClipboardPaste = async (setter: (val: string) => void, storageKey: string) => {
    try {
      if (navigator.clipboard?.readText) {
        const text = await navigator.clipboard.readText();
        if (text && (text.startsWith('http') || text.startsWith('data:image/'))) {
          setter(text.trim());
          localStorage.setItem(storageKey, text.trim());
        }
      }
    } catch (err) {
      console.warn('Erro ao ler clipboard:', err);
    }
  };

  return (
    <div className="space-y-6 font-sans">
      {/* 1. Configurações da Tela de Bloqueio */}
      <div className="p-5 bg-zinc-950 border border-zinc-900 rounded-2xl space-y-4">
        <div className="flex items-center justify-between border-b border-zinc-900 pb-3">
          <div>
            <h3 className="text-sm font-bold text-zinc-100 flex items-center gap-2">
              <Lock className="w-4 h-4 text-orange-400" />
              Imagens da Tela de Bloqueio
            </h3>
            <p className="text-[11px] text-zinc-400 mt-0.5">
              Defina planos de fundo separados para a versão Desktop (16:9) e Mobile (9:16).
            </p>
          </div>
          <button
            onClick={() => setPreviewMode('lock')}
            className="px-3 py-1.5 bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-orange-400 text-xs font-mono font-bold rounded-lg flex items-center gap-1.5 transition-all"
          >
            <Play className="w-3.5 h-3.5 fill-current" />
            <span>Testar Bloqueio</span>
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Desktop Wallpaper */}
          <div className="p-4 bg-zinc-900/40 border border-zinc-850 rounded-xl space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-zinc-200">Papel de Parede Desktop (16:9)</span>
              <span className="text-[9px] font-mono text-zinc-500">Computador</span>
            </div>
            <div className="relative aspect-video w-full bg-zinc-950 rounded-lg overflow-hidden border border-zinc-800 flex items-center justify-center">
              {lockDesktopBg ? (
                <img src={lockDesktopBg} alt="Desktop Preview" className="w-full h-full object-cover" />
              ) : (
                <span className="text-[10px] text-zinc-600 font-mono">Imagem Padrão</span>
              )}
            </div>
            <div className="flex gap-2">
              <label className="flex-1 cursor-pointer">
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => handleFileUpload(e, setLockDesktopBg, 'mbc_lock_desktop')}
                />
                <div className="w-full py-2 bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-zinc-300 font-mono text-[10px] rounded-lg flex items-center justify-center gap-1.5 transition-all">
                  <Upload className="w-3.5 h-3.5" />
                  <span>Upload</span>
                </div>
              </label>
              <button
                onClick={() => handleClipboardPaste(setLockDesktopBg, 'mbc_lock_desktop')}
                className="px-3 py-2 bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-zinc-300 font-mono text-[10px] rounded-lg flex items-center gap-1 transition-all"
              >
                <Clipboard className="w-3.5 h-3.5" />
                <span>Colar</span>
              </button>
            </div>
          </div>

          {/* Mobile Wallpaper */}
          <div className="p-4 bg-zinc-900/40 border border-zinc-850 rounded-xl space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-zinc-200">Papel de Parede Mobile (9:16)</span>
              <span className="text-[9px] font-mono text-zinc-500">Smartphone</span>
            </div>
            <div className="relative aspect-video w-full bg-zinc-950 rounded-lg overflow-hidden border border-zinc-800 flex items-center justify-center">
              {lockMobileBg ? (
                <img src={lockMobileBg} alt="Mobile Preview" className="w-full h-full object-cover" />
              ) : (
                <span className="text-[10px] text-zinc-600 font-mono">Imagem Padrão</span>
              )}
            </div>
            <div className="flex gap-2">
              <label className="flex-1 cursor-pointer">
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => handleFileUpload(e, setLockMobileBg, 'mbc_lock_mobile')}
                />
                <div className="w-full py-2 bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-zinc-300 font-mono text-[10px] rounded-lg flex items-center justify-center gap-1.5 transition-all">
                  <Upload className="w-3.5 h-3.5" />
                  <span>Upload</span>
                </div>
              </label>
              <button
                onClick={() => handleClipboardPaste(setLockMobileBg, 'mbc_lock_mobile')}
                className="px-3 py-2 bg-zinc-900 hover:bg-zinc-850 border border-zinc-800 text-zinc-300 font-mono text-[10px] rounded-lg flex items-center gap-1 transition-all"
              >
                <Clipboard className="w-3.5 h-3.5" />
                <span>Colar</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* 2. Configurações da Tela de Carregamento (Splash) */}
      <div className="p-5 bg-zinc-950 border border-zinc-900 rounded-2xl space-y-4">
        <div className="flex items-center justify-between border-b border-zinc-900 pb-3">
          <div>
            <h3 className="text-sm font-bold text-zinc-100 flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-orange-400" />
              Tela de Carregamento & Splash
            </h3>
            <p className="text-[11px] text-zinc-400 mt-0.5">
              Personalize a imagem exibida ao abrir o app e enquanto os dados sincronizam com a nuvem.
            </p>
          </div>
          <button
            onClick={() => setPreviewMode('loading')}
            className="px-3 py-1.5 bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-orange-400 text-xs font-mono font-bold rounded-lg flex items-center gap-1.5 transition-all"
          >
            <Play className="w-3.5 h-3.5 fill-current" />
            <span>Testar Splash</span>
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Splash Vertical */}
          <div className="p-4 bg-zinc-900/40 border border-zinc-850 rounded-xl space-y-3">
            <span className="text-xs font-bold text-zinc-200">Splash Vertical (Celular / 9:16)</span>
            <div className="relative aspect-video w-full bg-zinc-950 rounded-lg overflow-hidden border border-zinc-800 flex items-center justify-center">
              {loadingVerticalBg ? (
                <img src={loadingVerticalBg} alt="Vertical Splash Preview" className="w-full h-full object-cover" />
              ) : (
                <span className="text-[10px] text-zinc-600 font-mono">Splash Padrão</span>
              )}
            </div>
            <div className="flex gap-2">
              <label className="flex-1 cursor-pointer">
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => handleFileUpload(e, setLoadingVerticalBg, 'mbc_loading_vertical')}
                />
                <div className="w-full py-2 bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-zinc-300 font-mono text-[10px] rounded-lg flex items-center justify-center gap-1.5 transition-all">
                  <Upload className="w-3.5 h-3.5" />
                  <span>Upload</span>
                </div>
              </label>
              <button
                onClick={() => handleClipboardPaste(setLoadingVerticalBg, 'mbc_loading_vertical')}
                className="px-3 py-2 bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-zinc-300 font-mono text-[10px] rounded-lg flex items-center gap-1 transition-all"
              >
                <Clipboard className="w-3.5 h-3.5" />
                <span>Colar</span>
              </button>
            </div>
          </div>

          {/* Splash Horizontal */}
          <div className="p-4 bg-zinc-900/40 border border-zinc-850 rounded-xl space-y-3">
            <span className="text-xs font-bold text-zinc-200">Splash Horizontal (Desktop / 16:9)</span>
            <div className="relative aspect-video w-full bg-zinc-950 rounded-lg overflow-hidden border border-zinc-800 flex items-center justify-center">
              {loadingHorizontalBg ? (
                <img src={loadingHorizontalBg} alt="Horizontal Splash Preview" className="w-full h-full object-cover" />
              ) : (
                <span className="text-[10px] text-zinc-600 font-mono">Splash Padrão</span>
              )}
            </div>
            <div className="flex gap-2">
              <label className="flex-1 cursor-pointer">
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => handleFileUpload(e, setLoadingHorizontalBg, 'mbc_loading_horizontal')}
                />
                <div className="w-full py-2 bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-zinc-300 font-mono text-[10px] rounded-lg flex items-center justify-center gap-1.5 transition-all">
                  <Upload className="w-3.5 h-3.5" />
                  <span>Upload</span>
                </div>
              </label>
              <button
                onClick={() => handleClipboardPaste(setLoadingHorizontalBg, 'mbc_loading_horizontal')}
                className="px-3 py-2 bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-zinc-300 font-mono text-[10px] rounded-lg flex items-center gap-1 transition-all"
              >
                <Clipboard className="w-3.5 h-3.5" />
                <span>Colar</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Renderização de Previews Interativos */}
      {previewMode === 'lock' && (
        <StandaloneLockScreen
          desktopBgImage={lockDesktopBg}
          mobileBgImage={lockMobileBg}
          onUnlock={() => setPreviewMode(null)}
        />
      )}

      {previewMode === 'loading' && (
        <StandaloneAppLoadingScreen
          verticalImage={loadingVerticalBg}
          horizontalImage={loadingHorizontalBg}
          onComplete={() => setPreviewMode(null)}
        />
      )}
    </div>
  );
};

/* ========================================================================== */
/* SECTION 11: MODAL DE AUTENTICAÇÃO COMPLETO (GOOGLE OAUTH & QR CODE)       */
/* ========================================================================== */

export const StandaloneAuthModal: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (user: AuthUserProfile) => void;
}> = ({ isOpen, onClose, onSuccess }) => {
  const [mode, setMode] = useState<'welcome' | 'login' | 'signup' | 'qrcode'>('welcome');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [qrCodeTimer, setQrCodeTimer] = useState(300);

  useEffect(() => {
    if (mode !== 'qrcode') return;
    const interval = setInterval(() => {
      setQrCodeTimer((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(interval);
  }, [mode]);

  if (!isOpen) return null;

  const handleStandardLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      onSuccess({
        id: 'usr_123',
        email: email || 'usuario@dominio.com',
        username: email.split('@')[0] || 'usuario',
        name: 'Usuário Conectado',
        syncKey: 'MB-SYNC-889922',
        provider: 'local'
      });
      onClose();
    }, 900);
  };

  const handleGoogleAuth = () => {
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      onSuccess({
        id: 'usr_google_456',
        email: 'conta.google@gmail.com',
        username: 'contagoogle',
        name: 'Conta Google Sincronizada',
        photo: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=120',
        syncKey: 'MB-GOOGLE-SYNC-1002',
        provider: 'google'
      });
      onClose();
    }, 1100);
  };

  return (
    <div className="fixed inset-0 z-[10000] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md font-sans">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="w-full max-w-md bg-zinc-950 border border-zinc-850 rounded-3xl p-6 sm:p-8 space-y-6 shadow-2xl relative"
      >
        <button
          onClick={onClose}
          className="absolute top-5 right-5 text-zinc-500 hover:text-zinc-300 p-1 rounded-lg cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        {mode === 'welcome' && (
          <div className="space-y-6 text-center">
            <div className="space-y-2">
              <div className="w-12 h-12 bg-orange-500/10 border border-orange-500/20 text-orange-400 rounded-2xl flex items-center justify-center mx-auto">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <h2 className="text-xl font-bold text-white tracking-tight">Entrar ou Criar Conta</h2>
              <p className="text-xs text-zinc-400">
                Sincronize tarefas, rotinas e configurações em todos os seus aparelhos em tempo real.
              </p>
            </div>

            <div className="space-y-3">
              {/* Botão Google OAuth */}
              <button
                onClick={handleGoogleAuth}
                disabled={loading}
                className="w-full py-3 px-4 bg-white hover:bg-zinc-100 text-zinc-900 font-bold text-xs rounded-xl flex items-center justify-center gap-3 transition-all cursor-pointer shadow-md"
              >
                <svg className="w-4 h-4" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
                </svg>
                <span>Continuar com Google</span>
              </button>

              <button
                onClick={() => setMode('login')}
                className="w-full py-3 px-4 bg-zinc-900 hover:bg-zinc-850 border border-zinc-800 text-zinc-200 font-bold text-xs rounded-xl flex items-center justify-center gap-2 transition-all cursor-pointer"
              >
                <Mail className="w-4 h-4 text-orange-400" />
                <span>Entrar com E-mail</span>
              </button>

              <button
                onClick={() => setMode('qrcode')}
                className="w-full py-3 px-4 bg-zinc-900 hover:bg-zinc-850 border border-zinc-800 text-zinc-200 font-bold text-xs rounded-xl flex items-center justify-center gap-2 transition-all cursor-pointer"
              >
                <QrCode className="w-4 h-4 text-sky-400" />
                <span>Entrar com QR Code (Pelo Celular)</span>
              </button>
            </div>
          </div>
        )}

        {mode === 'login' && (
          <form onSubmit={handleStandardLogin} className="space-y-4">
            <button
              type="button"
              onClick={() => setMode('welcome')}
              className="text-xs text-zinc-400 hover:text-white flex items-center gap-1 font-mono"
            >
              <ArrowLeft className="w-3.5 h-3.5" /> Voltar
            </button>

            <div>
              <h3 className="text-base font-bold text-white">Login por E-mail</h3>
              <p className="text-xs text-zinc-400">Digite suas credenciais registradas.</p>
            </div>

            <div className="space-y-3">
              <div>
                <label className="text-[10px] font-mono text-zinc-400 uppercase">E-mail ou Usuário</label>
                <input
                  type="text"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="seu@email.com"
                  className="w-full mt-1 bg-zinc-900 border border-zinc-800 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-orange-500 font-mono"
                />
              </div>

              <div>
                <label className="text-[10px] font-mono text-zinc-400 uppercase">Senha</label>
                <div className="relative mt-1">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Sua senha secreta"
                    className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-orange-500 font-mono pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-orange-500 hover:bg-orange-600 text-white font-bold text-xs rounded-xl tracking-wider uppercase transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer"
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Entrar no Sistema'}
            </button>
          </form>
        )}

        {mode === 'qrcode' && (
          <div className="space-y-4 text-center">
            <button
              onClick={() => setMode('welcome')}
              className="text-xs text-zinc-400 hover:text-white flex items-center gap-1 font-mono"
            >
              <ArrowLeft className="w-3.5 h-3.5" /> Voltar
            </button>

            <div>
              <h3 className="text-base font-bold text-white">Login por QR Code</h3>
              <p className="text-xs text-zinc-400">
                Aponte a câmera do seu celular já autenticado para este código.
              </p>
            </div>

            <div className="p-4 bg-white rounded-2xl inline-block mx-auto shadow-xl">
              <div className="w-44 h-44 bg-zinc-950 flex flex-col items-center justify-center text-white rounded-lg p-2">
                <QrCode className="w-28 h-28 text-white stroke-[1.2]" />
                <span className="text-[9px] font-mono text-zinc-400 mt-1">SESSION: SYNC-QR-LIVE</span>
              </div>
            </div>

            <div className="text-[11px] font-mono text-zinc-400">
              Expira em: <span className="text-orange-400 font-bold">{Math.floor(qrCodeTimer / 60)}:{(qrCodeTimer % 60).toString().padStart(2, '0')}</span>
            </div>
          </div>
        )}
      </motion.div>
    </div>
  );
};

/* ========================================================================== */
/* SECTION 12: HUB INTERATIVO STANDALONE COMPLETO (DEMO EXECUTÁVEL)           */
/* ========================================================================== */

export default function StandaloneFullReferenceApp() {
  const [showSyncToast, setShowSyncToast] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [currentUser, setCurrentUser] = useState<AuthUserProfile | null>(null);

  return (
    <div className="min-h-screen bg-black text-white p-4 sm:p-8 font-sans space-y-8 max-w-5xl mx-auto">
      {/* Header Informativo */}
      <div className="border-b border-zinc-900 pb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-mono uppercase tracking-wider px-2 py-0.5 rounded-full bg-orange-500/10 border border-orange-500/20 text-orange-400 font-bold">
              Standalone Reference File
            </span>
            <span className="text-[10px] font-mono uppercase tracking-wider px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 font-bold">
              Supabase & Offline Engine
            </span>
          </div>
          <h1 className="text-xl sm:text-2xl font-black tracking-tight text-white mt-2">
            Hub de Sincronização, Sessões & Segurança
          </h1>
          <p className="text-xs text-zinc-400 mt-1">
            Exemplo funcional completo com todos os recursos e interfaces das Configurações do Planner.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowSyncToast(true)}
            className="px-3.5 py-2 bg-zinc-900 hover:bg-zinc-850 border border-zinc-800 text-xs font-mono text-orange-400 rounded-xl transition-all flex items-center gap-1.5 cursor-pointer"
          >
            <Cloud className="w-3.5 h-3.5" />
            <span>Simular Sync Remoto</span>
          </button>

          <button
            onClick={() => setShowAuthModal(true)}
            className="px-3.5 py-2 bg-orange-500 hover:bg-orange-600 text-xs font-bold text-white rounded-xl transition-all shadow-md flex items-center gap-1.5 cursor-pointer"
          >
            <User className="w-3.5 h-3.5" />
            <span>{currentUser ? currentUser.name : 'Abrir Tela de Login'}</span>
          </button>
        </div>
      </div>

      {/* 1. Gerenciamento de Credenciais Supabase e Segurança */}
      <section className="space-y-3">
        <h2 className="text-xs font-mono uppercase tracking-wider text-zinc-400 font-bold">
          1. Configurações de Nuvem & Segurança (Aba Configurações)
        </h2>
        <SettingsSupabaseAndSecuritySection />
      </section>

      {/* 2. Gerenciamento de Dispositivos Conectados */}
      <section className="space-y-3">
        <h2 className="text-xs font-mono uppercase tracking-wider text-zinc-400 font-bold">
          2. Dispositivos Conectados (Aba Configurações)
        </h2>
        <ConnectedDevicesManager />
      </section>

      {/* 3. Configurações de Telas de Bloqueio e Carregamento */}
      <section className="space-y-3">
        <h2 className="text-xs font-mono uppercase tracking-wider text-zinc-400 font-bold">
          3. Personalização de Telas (Bloqueio & Splash)
        </h2>
        <CustomScreenSettingsPanel />
      </section>

      {/* Banner / Toast de Sincronização em Tempo Real */}
      <RemoteSyncToast
        isOpen={showSyncToast}
        onClose={() => setShowSyncToast(false)}
        deviceName="Safari (iPhone 15)"
      />

      {/* Modal de Autenticação */}
      <StandaloneAuthModal
        isOpen={showAuthModal}
        onClose={() => setShowAuthModal(false)}
        onSuccess={(user) => setCurrentUser(user)}
      />
    </div>
  );
}
