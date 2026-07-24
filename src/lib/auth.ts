import { loadFromSupabase, saveToSupabase } from './supabase';

export interface AuthUser {
  email: string;
  username: string;
  name: string;
  syncKey: string;
  photo?: string;
  provider: 'email' | 'google';
}

async function hashPassword(password: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(password);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

function cleanString(str: string): string {
  return str.trim().toLowerCase();
}

/**
  Checks if a username is already registered.
 */
export async function isUsernameAvailable(username: string): Promise<boolean> {
  const cleanUser = cleanString(username).replace(/^@/, '');
  if (!cleanUser) return false;

  const key = `auth_username:${cleanUser}`;
  const record = await loadFromSupabase(key);
  return !record || !record.data || !record.data.email;
}

/**
 * Registers a new user with username, email, and password.
 */
export async function registerWithEmail(
  username: string,
  email: string,
  pass: string,
  name?: string
): Promise<{ ok: boolean; user?: AuthUser; message?: string }> {
  const cleanEmail = cleanString(email);
  const rawUsername = username.trim().replace(/^@/, '');
  const cleanUser = cleanString(rawUsername);

  if (!cleanUser || cleanUser.length < 3) {
    return { ok: false, message: 'O nome de usuário deve ter pelo menos 3 caracteres.' };
  }
  if (!cleanEmail || !cleanEmail.includes('@')) {
    return { ok: false, message: 'Por favor, insira um e-mail válido.' };
  }
  if (!pass || pass.length < 6) {
    return { ok: false, message: 'A senha deve ter pelo menos 6 caracteres.' };
  }

  // 1. Check if username is already taken
  const available = await isUsernameAvailable(cleanUser);
  if (!available) {
    return { ok: false, message: 'Este nome de usuário já está em uso. Por favor, escolha outro.' };
  }

  // 2. Check if email is already registered
  const emailRecordKey = `auth_account:${cleanEmail}`;
  const existingEmailAcc = await loadFromSupabase(emailRecordKey);
  if (existingEmailAcc && existingEmailAcc.data && existingEmailAcc.data.email) {
    return { ok: false, message: 'Este e-mail já possui uma conta. Faça login para continuar.' };
  }

  // 3. Generate unique syncKey bound to this user
  const passwordHash = await hashPassword(pass);
  const syncKey = `MBC-${cleanUser.toUpperCase()}-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
  const displayName = name || rawUsername;

  const userRecord = {
    email: cleanEmail,
    username: cleanUser,
    name: displayName,
    passwordHash,
    syncKey,
    provider: 'email',
    createdAt: new Date().toISOString()
  };

  // 4. Save to Supabase user_sync table
  const accSaved = await saveToSupabase(emailRecordKey, userRecord);
  const userMapSaved = await saveToSupabase(`auth_username:${cleanUser}`, { email: cleanEmail });

  if (!accSaved || !userMapSaved) {
    return { ok: false, message: 'Erro ao salvar conta no banco de dados. Verifique sua conexão.' };
  }

  const authUser: AuthUser = {
    email: cleanEmail,
    username: cleanUser,
    name: displayName,
    syncKey,
    provider: 'email'
  };

  return { ok: true, user: authUser };
}

/**
 * Logs in with email or username and password.
 */
export async function loginWithEmailOrUsername(
  identifier: string,
  pass: string
): Promise<{ ok: boolean; user?: AuthUser; message?: string }> {
  const cleanId = cleanString(identifier).replace(/^@/, '');
  if (!cleanId || !pass) {
    return { ok: false, message: 'Preencha o e-mail/usuário e a senha.' };
  }

  let targetEmail = cleanId;

  // If identifier is not an email, try resolving username -> email
  if (!cleanId.includes('@')) {
    const userMapKey = `auth_username:${cleanId}`;
    const userMap = await loadFromSupabase(userMapKey);
    if (!userMap || !userMap.data || !userMap.data.email) {
      return { ok: false, message: 'Usuário ou e-mail não encontrado.' };
    }
    targetEmail = userMap.data.email;
  }

  // Load account by email
  const accRecord = await loadFromSupabase(`auth_account:${targetEmail}`);
  if (!accRecord || !accRecord.data || !accRecord.data.passwordHash) {
    return { ok: false, message: 'Conta não encontrada ou sem senha cadastrada.' };
  }

  const inputHash = await hashPassword(pass);
  if (accRecord.data.passwordHash !== inputHash) {
    return { ok: false, message: 'Senha incorreta. Tente novamente.' };
  }

  const authUser: AuthUser = {
    email: accRecord.data.email,
    username: accRecord.data.username || accRecord.data.email.split('@')[0],
    name: accRecord.data.name || accRecord.data.username,
    syncKey: accRecord.data.syncKey,
    photo: accRecord.data.photo,
    provider: 'email'
  };

  return { ok: true, user: authUser };
}

/**
 * Handles login / signup with Google Account.
 */
export async function loginWithGoogleProfile(
  profile: { email: string; name?: string; picture?: string }
): Promise<{ ok: boolean; user?: AuthUser; message?: string }> {
  if (!profile || !profile.email) {
    return { ok: false, message: 'Perfil do Google inválido.' };
  }

  const cleanEmail = cleanString(profile.email);
  const emailRecordKey = `auth_account:${cleanEmail}`;
  const existingAcc = await loadFromSupabase(emailRecordKey);

  let syncKey: string;
  let username: string;

  if (existingAcc && existingAcc.data && existingAcc.data.syncKey) {
    syncKey = existingAcc.data.syncKey;
    username = existingAcc.data.username || cleanEmail.split('@')[0];
  } else {
    // New Google user, generate unique syncKey
    username = cleanEmail.split('@')[0].replace(/[^a-z0-9]/g, '');
    syncKey = `MBC-GOOG-${username.toUpperCase()}-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;

    const userRecord = {
      email: cleanEmail,
      username,
      name: profile.name || username,
      photo: profile.picture,
      syncKey,
      provider: 'google',
      createdAt: new Date().toISOString()
    };

    await saveToSupabase(emailRecordKey, userRecord);
    await saveToSupabase(`auth_username:${username}`, { email: cleanEmail });
  }

  const authUser: AuthUser = {
    email: cleanEmail,
    username,
    name: profile.name || username,
    photo: profile.picture,
    syncKey,
    provider: 'google'
  };

  return { ok: true, user: authUser };
}
