import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { getOrCreateDeviceId } from './devices';

let cachedClient: SupabaseClient | null = null;
let cachedUrl = '';
let cachedKey = '';

// Cross-tab broadcast channel for instant (<5ms) sync across multiple tabs/windows on the same device
let broadcastChannel: BroadcastChannel | null = null;
try {
  if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
    broadcastChannel = new BroadcastChannel('meu_foco_multi_device_channel');
  }
} catch (e) {
  console.warn('BroadcastChannel initialization error:', e);
}

export function broadcastLocalStateChange(syncKey: string, payload: any, updatedAt: string): void {
  try {
    if (broadcastChannel && syncKey) {
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
  } catch (e) {}
}

export function subscribeToCrossTabSync(
  syncKey: string,
  onUpdate: (data: any, updatedAt: string, originDeviceId?: string) => void
): () => void {
  if (!broadcastChannel || !syncKey) return () => {};

  const cleanKey = syncKey.trim().toUpperCase();
  const currentDevId = getOrCreateDeviceId();

  const handleMessage = (event: MessageEvent) => {
    try {
      const msg = event.data;
      if (
        msg &&
        msg.type === 'LOCAL_STATE_CHANGE' &&
        msg.syncKey === cleanKey &&
        msg.data
      ) {
        onUpdate(msg.data, msg.updated_at || new Date().toISOString(), msg.originDeviceId || currentDevId);
      }
    } catch (err) {
      console.warn('Error handling cross-tab sync message:', err);
    }
  };

  broadcastChannel.addEventListener('message', handleMessage);
  return () => {
    if (broadcastChannel) {
      broadcastChannel.removeEventListener('message', handleMessage);
    }
  };
}

export function getSupabaseConfig(): { url: string; key: string } {
  const metaEnv = (import.meta as any).env || {};
  const url = metaEnv.VITE_SUPABASE_URL || localStorage.getItem('mbc_supabase_url') || '';
  const key = metaEnv.VITE_SUPABASE_ANON_KEY || localStorage.getItem('mbc_supabase_anon_key') || '';
  return { url: url.trim(), key: key.trim() };
}

export function setSupabaseConfig(url: string, key: string): void {
  if (url) localStorage.setItem('mbc_supabase_url', url.trim());
  else localStorage.removeItem('mbc_supabase_url');

  if (key) localStorage.setItem('mbc_supabase_anon_key', key.trim());
  else localStorage.removeItem('mbc_supabase_anon_key');

  cachedClient = null;
  cachedUrl = '';
  cachedKey = '';
}

export function getSupabaseClient(): SupabaseClient | null {
  const { url, key } = getSupabaseConfig();
  if (!url || !key) return null;

  if (cachedClient && cachedUrl === url && cachedKey === key) {
    return cachedClient;
  }

  try {
    cachedClient = createClient(url, key);
    cachedUrl = url;
    cachedKey = key;
    return cachedClient;
  } catch (err) {
    console.error('Failed to initialize Supabase client:', err);
    return null;
  }
}

export async function testSupabaseConnection(): Promise<{ ok: boolean; message: string }> {
  const { url, key } = getSupabaseConfig();
  if (!url || !key) {
    return { ok: false, message: 'URL e Anon Key do Supabase não configuradas.' };
  }

  const client = getSupabaseClient();
  if (!client) {
    return { ok: false, message: 'Falha ao criar cliente do Supabase.' };
  }

  try {
    const { error } = await client
      .from('user_sync')
      .select('sync_key')
      .limit(1);

    if (error) {
      if (error.code === 'PGRST301' || error.message?.includes('JWT') || error.code === '401' || (error as any).status === 401) {
        return { ok: false, message: 'Erro 401 (Não Autorizado): A chave Anon / Public Key do Supabase é inválida. Copie a chave anon/public de Project Settings > API.' };
      }
      if (error.code === '42P01' || error.message?.includes('does not exist') || error.message?.includes('not found')) {
        return { ok: false, message: 'A tabela "user_sync" não existe. Acesse o SQL Editor no Supabase e execute o script fornecido no botão "Script SQL".' };
      }
      return { ok: false, message: `Erro no Supabase: ${error.message}` };
    }

    return { ok: true, message: 'Conexão com o Supabase validada e pronta para uso!' };
  } catch (err: any) {
    return { ok: false, message: `Erro ao conectar: ${err?.message || String(err)}` };
  }
}

export async function saveToSupabase(syncKey: string, payload: any, originDeviceId?: string): Promise<boolean> {
  let supabaseSuccess = false;
  const nowIso = new Date().toISOString();
  const cleanKey = syncKey.trim().toUpperCase();
  const devId = originDeviceId || getOrCreateDeviceId();

  const client = getSupabaseClient();
  if (client && cleanKey) {
    try {
      const payloadWithMeta = typeof payload === 'object' && payload !== null
        ? { ...payload, _originDeviceId: devId }
        : payload;

      const { error } = await client
        .from('user_sync')
        .upsert({
          sync_key: cleanKey,
          data: payloadWithMeta,
          updated_at: nowIso
        }, { onConflict: 'sync_key' });

      if (error) {
        console.error('Supabase save error:', error);
      } else {
        supabaseSuccess = true;
      }
    } catch (err) {
      console.error('Supabase save exception:', err);
    }
  }

  // Broadcast instant update to all other open tabs/windows on this client
  broadcastLocalStateChange(cleanKey, payload, nowIso);

  return supabaseSuccess;
}

export async function loadFromSupabase(syncKey: string): Promise<any | null> {
  if (!syncKey) return null;
  const cleanKey = syncKey.trim().toUpperCase();

  const client = getSupabaseClient();
  if (client) {
    try {
      const { data, error } = await client
        .from('user_sync')
        .select('data, updated_at')
        .eq('sync_key', cleanKey)
        .maybeSingle();

      if (!error && data) {
        const supabaseOriginDeviceId = data.data?._originDeviceId || '';
        return {
          data: data.data,
          updated_at: data.updated_at || '',
          originDeviceId: supabaseOriginDeviceId
        };
      }
    } catch (err) {
      console.warn('Supabase load warning:', err);
    }
  }

  return null;
}

export async function loadMetadataFromSupabase(syncKey: string): Promise<{ updated_at?: string; originDeviceId?: string } | null> {
  if (!syncKey) return null;
  const cleanKey = syncKey.trim().toUpperCase();

  const client = getSupabaseClient();
  if (client) {
    try {
      const { data } = await client
        .from('user_sync')
        .select('updated_at')
        .eq('sync_key', cleanKey)
        .maybeSingle();

      if (data?.updated_at) {
        return { updated_at: data.updated_at };
      }
    } catch (e) {}
  }

  return null;
}
