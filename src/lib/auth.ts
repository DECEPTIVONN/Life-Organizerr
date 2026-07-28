import { loadFromSupabase, saveToSupabase } from './supabase';

export interface AuthUser {
  email: string;
  username: string;
  name: string;
  syncKey: string;
  photo?: string;
  provider: 'email' | 'google' | 'qr';
}

export interface QrLoginSession {
  sessionId: string;
  pinCode: string;
  status: 'pending' | 'authorized' | 'expired' | 'rejected';
  createdAt: number;
  expiresAt: number;
  user?: AuthUser;
  authorizedAt?: string;
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
 * Dual persistence helper: Saves to both Supabase and LocalStorage
 */
export async function saveAuthRecord(key: string, payload: any): Promise<boolean> {
  // 1. Always persist to localStorage for instant local access and offline reliability
  try {
    localStorage.setItem(`mbc_auth:${key}`, JSON.stringify({ data: payload, updated_at: new Date().toISOString() }));
    
    // Maintain secondary fast-lookup dictionary for accounts
    if (key.startsWith('auth_account:')) {
      const emailKey = key.replace('auth_account:', '').toLowerCase().trim();
      const registryRaw = localStorage.getItem('mbc_registered_accounts_dict') || '{}';
      const dict = JSON.parse(registryRaw);
      dict[emailKey] = payload;
      localStorage.setItem('mbc_registered_accounts_dict', JSON.stringify(dict));
    }

    if (key.startsWith('auth_username:')) {
      const userKey = key.replace('auth_username:', '').toLowerCase().trim();
      const userDictRaw = localStorage.getItem('mbc_registered_usernames_dict') || '{}';
      const dict = JSON.parse(userDictRaw);
      dict[userKey] = payload;
      localStorage.setItem('mbc_registered_usernames_dict', JSON.stringify(dict));
    }
  } catch (err) {
    console.warn('LocalStorage auth save warning:', err);
  }

  // 2. Persist to Supabase if available
  const supaSuccess = await saveToSupabase(key, payload);
  return supaSuccess || true; // Returns true because local save succeeded
}

/**
 * Dual persistence helper: Loads from Supabase or LocalStorage fallback
 */
export async function loadAuthRecord(key: string): Promise<any | null> {
  // 1. Try Supabase
  const supaRecord = await loadFromSupabase(key);
  if (supaRecord && supaRecord.data) {
    try {
      localStorage.setItem(`mbc_auth:${key}`, JSON.stringify({ data: supaRecord.data, updated_at: supaRecord.updated_at }));
    } catch (e) {}
    return supaRecord.data;
  }

  // 2. LocalStorage direct key
  try {
    const localItem = localStorage.getItem(`mbc_auth:${key}`);
    if (localItem) {
      const parsed = JSON.parse(localItem);
      if (parsed && parsed.data) return parsed.data;
    }
  } catch (e) {}

  // 3. LocalStorage registry dictionary fallback
  if (key.startsWith('auth_account:')) {
    try {
      const emailKey = key.replace('auth_account:', '').toLowerCase().trim();
      const registryRaw = localStorage.getItem('mbc_registered_accounts_dict');
      if (registryRaw) {
        const dict = JSON.parse(registryRaw);
        if (dict && dict[emailKey]) return dict[emailKey];
      }
    } catch (e) {}
  }

  if (key.startsWith('auth_username:')) {
    try {
      const userKey = key.replace('auth_username:', '').toLowerCase().trim();
      const userDictRaw = localStorage.getItem('mbc_registered_usernames_dict');
      if (userDictRaw) {
        const dict = JSON.parse(userDictRaw);
        if (dict && dict[userKey]) return dict[userKey];
      }
    } catch (e) {}
  }

  return null;
}

/**
 * Checks if a username is already registered.
 */
export async function isUsernameAvailable(username: string): Promise<boolean> {
  const cleanUser = cleanString(username).replace(/^@/, '');
  if (!cleanUser) return false;

  const key = `auth_username:${cleanUser}`;
  const record = await loadAuthRecord(key);
  return !record || !record.email;
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

  // 1. Check if username is taken
  const available = await isUsernameAvailable(cleanUser);
  if (!available) {
    return { ok: false, message: 'Este nome de usuário já está em uso. Por favor, escolha outro.' };
  }

  // 2. Check if email is already registered
  const emailRecordKey = `auth_account:${cleanEmail}`;
  const existingEmailAcc = await loadAuthRecord(emailRecordKey);
  if (existingEmailAcc && existingEmailAcc.email) {
    return { ok: false, message: 'Este e-mail já possui uma conta. Faça login para continuar.' };
  }

  // 3. Generate unique syncKey bound to this user
  const passwordHash = await hashPassword(pass.trim());
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

  // 4. Save to both Supabase & LocalStorage
  await saveAuthRecord(emailRecordKey, userRecord);
  await saveAuthRecord(`auth_username:${cleanUser}`, { email: cleanEmail });

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
 * Logs in with email or username or sync key and password.
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

  // Check if identifier is a Sync Key (MBC-...)
  if (cleanId.toUpperCase().startsWith('MBC-')) {
    const registryRaw = localStorage.getItem('mbc_registered_accounts_dict') || '{}';
    const dict = JSON.parse(registryRaw);
    const foundBySync = Object.values(dict).find((acc: any) => acc.syncKey?.toUpperCase() === cleanId.toUpperCase()) as any;
    if (foundBySync) {
      targetEmail = foundBySync.email;
    }
  }

  // If identifier is not an email, try resolving username -> email
  if (!targetEmail.includes('@')) {
    const userMapKey = `auth_username:${cleanId}`;
    const userMap = await loadAuthRecord(userMapKey);
    if (userMap && userMap.email) {
      targetEmail = userMap.email;
    } else {
      // Direct search in accounts dictionary for username
      const registryRaw = localStorage.getItem('mbc_registered_accounts_dict') || '{}';
      const dict = JSON.parse(registryRaw);
      const foundAcc = Object.values(dict).find((acc: any) => acc.username?.toLowerCase() === cleanId) as any;
      if (foundAcc && foundAcc.email) {
        targetEmail = foundAcc.email;
      }
    }
  }

  // Load account by email
  let accRecord = await loadAuthRecord(`auth_account:${targetEmail}`);

  // Fallback: check if matches local user profile
  if (!accRecord) {
    const localUserEmail = localStorage.getItem('mbc_userEmail')?.toLowerCase().trim();
    const localUserHandle = localStorage.getItem('mbc_userHandle')?.replace(/^@/, '').toLowerCase().trim();
    if (localUserEmail === targetEmail || localUserHandle === cleanId) {
      const inputHash = await hashPassword(pass.trim());
      accRecord = {
        email: localUserEmail || targetEmail,
        username: localUserHandle || cleanId || 'usuario',
        name: localStorage.getItem('mbc_userName') || 'Usuário',
        passwordHash: inputHash,
        syncKey: localStorage.getItem('mbc_sync_key') || `MBC-${cleanId.toUpperCase()}-LOCAL`,
        provider: 'email'
      };
      await saveAuthRecord(`auth_account:${accRecord.email}`, accRecord);
      await saveAuthRecord(`auth_username:${accRecord.username}`, { email: accRecord.email });
    }
  }

  if (!accRecord) {
    return { ok: false, message: 'Conta não encontrada. Verifique os dados ou recupere a senha.' };
  }

  const inputHash = await hashPassword(pass.trim());

  // Auto-set password hash if missing on account record (e.g., initial local creation)
  if (!accRecord.passwordHash) {
    accRecord.passwordHash = inputHash;
    await saveAuthRecord(`auth_account:${targetEmail}`, accRecord);
  } else if (accRecord.passwordHash !== inputHash) {
    return { ok: false, message: 'Senha incorreta. Tente novamente.' };
  }

  const authUser: AuthUser = {
    email: accRecord.email,
    username: accRecord.username || accRecord.email.split('@')[0],
    name: accRecord.name || accRecord.username,
    syncKey: accRecord.syncKey,
    photo: accRecord.photo,
    provider: 'email'
  };

  return { ok: true, user: authUser };
}

/**
 * Handles login / signup with Google Account
 */
export async function loginWithGoogleProfile(
  profile: { email: string; name?: string; picture?: string },
  existingSyncKeyOrUser?: string
): Promise<{ ok: boolean; user?: AuthUser; message?: string }> {
  if (!profile || !profile.email) {
    return { ok: false, message: 'Perfil do Google inválido.' };
  }

  const cleanEmail = cleanString(profile.email);
  const emailRecordKey = `auth_account:${cleanEmail}`;
  const existingAcc = await loadAuthRecord(emailRecordKey);

  let syncKey: string = '';
  let username: string = '';

  const rawKeyOrUser = existingSyncKeyOrUser ? cleanString(existingSyncKeyOrUser).replace(/^@/, '') : '';

  if (rawKeyOrUser) {
    if (rawKeyOrUser.toUpperCase().startsWith('MBC-')) {
      syncKey = rawKeyOrUser.toUpperCase();
      username = cleanEmail.split('@')[0].replace(/[^a-z0-9_]/g, '');
    } else {
      const userMapKey = `auth_username:${rawKeyOrUser}`;
      const userMap = await loadAuthRecord(userMapKey);
      if (userMap && userMap.email) {
        const linkedAcc = await loadAuthRecord(`auth_account:${userMap.email}`);
        if (linkedAcc && linkedAcc.syncKey) {
          syncKey = linkedAcc.syncKey;
          username = linkedAcc.username || rawKeyOrUser;
        }
      }
    }
  }

  if (!syncKey && existingAcc && existingAcc.syncKey) {
    syncKey = existingAcc.syncKey;
    username = existingAcc.username || cleanEmail.split('@')[0];
  }

  if (!syncKey) {
    username = cleanEmail.split('@')[0].replace(/[^a-z0-9_]/g, '');
    syncKey = `MBC-GOOG-${username.toUpperCase()}-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
  }

  const userRecord = {
    email: cleanEmail,
    username,
    name: profile.name || username,
    photo: profile.picture,
    syncKey,
    passwordHash: existingAcc?.passwordHash,
    provider: 'google',
    updatedAt: new Date().toISOString()
  };

  await saveAuthRecord(emailRecordKey, userRecord);
  await saveAuthRecord(`auth_username:${username}`, { email: cleanEmail });

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

/**
 * Recovers account information or resets password using registered email.
 */
export async function recoverAccountByEmail(
  email: string,
  newPassword?: string
): Promise<{ ok: boolean; user?: AuthUser; username?: string; syncKey?: string; message?: string }> {
  const cleanEmail = cleanString(email);
  if (!cleanEmail || !cleanEmail.includes('@')) {
    return { ok: false, message: 'Por favor, insira um e-mail válido.' };
  }

  const emailRecordKey = `auth_account:${cleanEmail}`;
  let accRecord = await loadAuthRecord(emailRecordKey);

  // Fallback: Check local profile if matching email
  if (!accRecord) {
    const localEmail = localStorage.getItem('mbc_userEmail')?.toLowerCase().trim();
    if (localEmail === cleanEmail) {
      accRecord = {
        email: cleanEmail,
        username: localStorage.getItem('mbc_userHandle')?.replace(/^@/, '') || cleanEmail.split('@')[0],
        name: localStorage.getItem('mbc_userName') || 'Usuário',
        syncKey: localStorage.getItem('mbc_sync_key') || `MBC-${cleanEmail.split('@')[0].toUpperCase()}-RECOVER`,
        provider: 'email'
      };
    }
  }

  if (!accRecord) {
    return { 
      ok: false, 
      message: 'Nenhuma conta foi encontrada com este e-mail. Se desejar, crie uma nova conta ou entre com o Google.' 
    };
  }

  // If a new password is provided, reset it
  if (newPassword && newPassword.trim()) {
    if (newPassword.trim().length < 6) {
      return { ok: false, message: 'A nova senha deve ter pelo menos 6 caracteres.' };
    }
    const passwordHash = await hashPassword(newPassword.trim());
    accRecord.passwordHash = passwordHash;
    await saveAuthRecord(emailRecordKey, accRecord);
    await saveAuthRecord(`auth_username:${accRecord.username}`, { email: cleanEmail });
  }

  const authUser: AuthUser = {
    email: accRecord.email,
    username: accRecord.username || accRecord.email.split('@')[0],
    name: accRecord.name || accRecord.username,
    syncKey: accRecord.syncKey,
    photo: accRecord.photo,
    provider: accRecord.provider || 'email'
  };

  return {
    ok: true,
    user: authUser,
    username: authUser.username,
    syncKey: authUser.syncKey,
    message: newPassword && newPassword.trim() ? 'Senha redefinida e conta pronta para uso!' : 'Conta localizada com sucesso!'
  };
}

/* =========================================================================
   QR CODE LOGIN AUTHENTICATION SERVICES
   ========================================================================= */

/**
 * Generates a new 5-minute QR Code Login session
 */
export async function createQrLoginSession(): Promise<QrLoginSession> {
  const randNum = Math.floor(100000 + Math.random() * 900000).toString(); // 6-digit PIN
  const sessionRand = Math.random().toString(36).substring(2, 10).toUpperCase();
  const sessionId = `QR-LOG-${sessionRand}-${Date.now().toString(36).toUpperCase()}`;
  const now = Date.now();
  const expiresAt = now + 5 * 60 * 1000; // 5 Minutes (300,000 ms)

  const session: QrLoginSession = {
    sessionId,
    pinCode: randNum,
    status: 'pending',
    createdAt: now,
    expiresAt
  };

  // Persist session
  await saveAuthRecord(`qr_session:${sessionId}`, session);
  await saveAuthRecord(`qr_pin:${randNum}`, { sessionId, expiresAt });

  return session;
}

/**
 * Checks status of an active QR Login session
 */
export async function checkQrLoginSessionStatus(sessionId: string): Promise<QrLoginSession | null> {
  if (!sessionId) return null;
  const record = await loadAuthRecord(`qr_session:${sessionId}`);
  if (!record) return null;

  // Check expiration
  if (record.status === 'pending' && Date.now() > record.expiresAt) {
    record.status = 'expired';
    await saveAuthRecord(`qr_session:${sessionId}`, record);
  }

  return record;
}

/**
 * Authorizes a QR Login session using logged in user profile
 */
export async function authorizeQrLoginSession(
  sessionIdOrPin: string,
  user: AuthUser
): Promise<{ ok: boolean; message: string; sessionId?: string }> {
  if (!sessionIdOrPin || !user) {
    return { ok: false, message: 'Sessão ou usuário inválido.' };
  }

  let targetSessionId = sessionIdOrPin.trim();

  // If input is a 6-digit PIN code, resolve to sessionId
  if (/^\d{6}$/.test(targetSessionId) || targetSessionId.startsWith('PLN-') || targetSessionId.length <= 10) {
    const rawPin = targetSessionId.replace(/\D/g, '');
    const pinMap = await loadAuthRecord(`qr_pin:${rawPin}`);
    if (pinMap && pinMap.sessionId) {
      targetSessionId = pinMap.sessionId;
    }
  }

  const session = await loadAuthRecord(`qr_session:${targetSessionId}`);
  if (!session) {
    return { ok: false, message: 'Código QR ou sessão de login não encontrada.' };
  }

  if (Date.now() > session.expiresAt) {
    session.status = 'expired';
    await saveAuthRecord(`qr_session:${targetSessionId}`, session);
    return { ok: false, message: 'Este código QR expirou (válido por 5 minutos). Gere um novo na tela de login.' };
  }

  // Update session to authorized
  session.status = 'authorized';
  session.user = user;
  session.authorizedAt = new Date().toISOString();

  await saveAuthRecord(`qr_session:${targetSessionId}`, session);

  return { ok: true, message: 'Aparelho e sessão QR Code autorizados com sucesso!', sessionId: targetSessionId };
}

