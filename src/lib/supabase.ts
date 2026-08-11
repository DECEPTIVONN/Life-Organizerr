import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { db } from '../firebase';
import { doc, getDoc, setDoc, onSnapshot } from 'firebase/firestore';

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
  let firestoreSuccess = false;
  let supabaseSuccess = false;

  // 1. Dual Cloud Sync Target 1: Firebase Firestore
  try {
    if (db && syncKey) {
      const cleanKey = syncKey.trim().toUpperCase();
      const docRef = doc(db, "sync_profiles", cleanKey);
      await setDoc(docRef, {
        syncKey: cleanKey,
        data: payload,
        updated_at: new Date().toISOString()
      }, { merge: true });
      firestoreSuccess = true;
    }
  } catch (err) {
    console.warn('Firestore sync save warning:', err);
  }

  // 2. Dual Cloud Sync Target 2: Supabase
  const client = getSupabaseClient();
  if (client && syncKey) {
    try {
      const { error } = await client
        .from('user_sync')
        .upsert({
          sync_key: syncKey.trim(),
          data: payload,
          updated_at: new Date().toISOString()
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

  return firestoreSuccess || supabaseSuccess;
}

export async function loadFromSupabase(syncKey: string): Promise<any | null> {
  if (!syncKey) return null;
  const cleanKey = syncKey.trim();

  let firestoreData: any = null;
  let firestoreUpdatedAt = '';

  // 1. Try loading from Firebase Firestore
  try {
    if (db) {
      const docRef = doc(db, "sync_profiles", cleanKey.toUpperCase());
      const docSnap = await getDoc(docRef);
      if (docSnap.exists() && docSnap.data()?.data) {
        firestoreData = docSnap.data().data;
        firestoreUpdatedAt = docSnap.data().updated_at || '';
      }
    }
  } catch (err) {
    console.warn('Firestore load warning:', err);
  }

  // 2. Try loading from Supabase
  let supabaseData: any = null;
  let supabaseUpdatedAt = '';

  const client = getSupabaseClient();
  if (client) {
    try {
      const { data, error } = await client
        .from('user_sync')
        .select('data, updated_at')
        .eq('sync_key', cleanKey)
        .maybeSingle();

      if (!error && data) {
        supabaseData = data.data;
        supabaseUpdatedAt = data.updated_at || '';
      }
    } catch (err) {
      console.warn('Supabase load warning:', err);
    }
  }

  if (firestoreData && supabaseData) {
    const fsTime = new Date(firestoreUpdatedAt).getTime() || 0;
    const sbTime = new Date(supabaseUpdatedAt).getTime() || 0;
    if (fsTime >= sbTime) {
      return { data: firestoreData, updated_at: firestoreUpdatedAt };
    } else {
      return { data: supabaseData, updated_at: supabaseUpdatedAt };
    }
  }

  if (firestoreData) {
    return { data: firestoreData, updated_at: firestoreUpdatedAt };
  }

  if (supabaseData) {
    return { data: supabaseData, updated_at: supabaseUpdatedAt };
  }

  return null;
}

export async function loadMetadataFromSupabase(syncKey: string): Promise<{ updated_at?: string } | null> {
  if (!syncKey) return null;
  const cleanKey = syncKey.trim();

  let fsTime = 0;
  let fsIso = '';
  try {
    if (db) {
      const docRef = doc(db, "sync_profiles", cleanKey.toUpperCase());
      const docSnap = await getDoc(docRef);
      if (docSnap.exists() && docSnap.data()?.updated_at) {
        fsIso = docSnap.data().updated_at;
        fsTime = new Date(fsIso).getTime() || 0;
      }
    }
  } catch (e) {}

  let sbTime = 0;
  let sbIso = '';
  const client = getSupabaseClient();
  if (client) {
    try {
      const { data } = await client
        .from('user_sync')
        .select('updated_at')
        .eq('sync_key', cleanKey)
        .maybeSingle();

      if (data?.updated_at) {
        sbIso = data.updated_at;
        sbTime = new Date(sbIso).getTime() || 0;
      }
    } catch (e) {}
  }

  if (fsTime >= sbTime && fsIso) {
    return { updated_at: fsIso };
  } else if (sbIso) {
    return { updated_at: sbIso };
  }

  return null;
}

export function subscribeToFirestoreSync(syncKey: string, onUpdate: (data: any, updatedAt: string) => void): () => void {
  if (!db || !syncKey) return () => {};

  try {
    const cleanKey = syncKey.trim().toUpperCase();
    const docRef = doc(db, "sync_profiles", cleanKey);
    return onSnapshot(docRef, (docSnap) => {
      if (docSnap.exists() && docSnap.data()?.data) {
        const payload = docSnap.data().data;
        const updatedAt = docSnap.data().updated_at || '';
        onUpdate(payload, updatedAt);
      }
    }, (err) => {
      console.warn('Firestore onSnapshot error:', err);
    });
  } catch (err) {
    console.warn('Firestore subscribe error:', err);
    return () => {};
  }
}



