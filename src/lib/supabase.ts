import { createClient, SupabaseClient } from '@supabase/supabase-js';

let cachedClient: SupabaseClient | null = null;
let cachedUrl = '';
let cachedKey = '';

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

export async function saveToSupabase(syncKey: string, payload: any): Promise<boolean> {
  const client = getSupabaseClient();
  if (!client) return false;

  try {
    const { error } = await client
      .from('user_sync')
      .upsert({
        sync_key: syncKey,
        data: payload,
        updated_at: new Date().toISOString()
      }, { onConflict: 'sync_key' });

    if (error) {
      console.error('Supabase save error:', error);
      return false;
    }
    return true;
  } catch (err) {
    console.error('Supabase save exception:', err);
    return false;
  }
}

export async function loadFromSupabase(syncKey: string): Promise<any | null> {
  const client = getSupabaseClient();
  if (!client) return null;

  try {
    const { data, error } = await client
      .from('user_sync')
      .select('data, updated_at')
      .eq('sync_key', syncKey)
      .maybeSingle();

    if (error) {
      console.warn('Supabase load query error:', error);
      return null;
    }
    return data;
  } catch (err) {
    console.error('Supabase load exception:', err);
    return null;
  }
}

export async function loadMetadataFromSupabase(syncKey: string): Promise<{ updated_at?: string } | null> {
  const client = getSupabaseClient();
  if (!client) return null;

  try {
    const { data, error } = await client
      .from('user_sync')
      .select('updated_at')
      .eq('sync_key', syncKey)
      .maybeSingle();

    if (error) {
      console.warn('Supabase load metadata error:', error);
      return null;
    }
    return data;
  } catch (err) {
    console.error('Supabase load metadata exception:', err);
    return null;
  }
}


