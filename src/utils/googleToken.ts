export async function refreshGoogleAccessToken(): Promise<string | null> {
  const refreshToken = localStorage.getItem('google_calendar_refresh_token');
  if (!refreshToken) return null;

  try {
    const res = await fetch('/api/auth/google/refresh', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refresh_token: refreshToken })
    });

    if (!res.ok) {
      console.warn('[Google Auth] Refresh token request failed with status:', res.status);
      return localStorage.getItem('google_calendar_token');
    }

    const data = await res.json();
    if (data.access_token) {
      localStorage.setItem('google_calendar_token', data.access_token);
      const expiresIn = data.expires_in || 3600;
      const expiresAt = Date.now() + expiresIn * 1000;
      localStorage.setItem('google_calendar_token_expires_at', expiresAt.toString());

      if (data.refresh_token) {
        localStorage.setItem('google_calendar_refresh_token', data.refresh_token);
      }
      window.dispatchEvent(new Event('storage'));
      return data.access_token;
    }
  } catch (err) {
    console.error('[Google Auth] Error refreshing access token:', err);
  }
  return localStorage.getItem('google_calendar_token');
}

export async function getValidGoogleAccessToken(): Promise<string | null> {
  const token = localStorage.getItem('google_calendar_token');
  const expiresAtStr = localStorage.getItem('google_calendar_token_expires_at');
  const refreshToken = localStorage.getItem('google_calendar_refresh_token');

  if (!token && !refreshToken) {
    return null;
  }

  // Check if current access token is valid (with a 2-minute safety buffer)
  if (token && expiresAtStr) {
    const expiresAt = parseInt(expiresAtStr, 10);
    if (!isNaN(expiresAt) && Date.now() < expiresAt - 120000) {
      return token;
    }
  }

  // Token is expired, about to expire, or expiresAt not set -> refresh using refresh_token
  if (refreshToken) {
    const newToken = await refreshGoogleAccessToken();
    if (newToken) return newToken;
  }

  return token || null;
}

export function saveGoogleOAuthTokens(tokens: any, profile?: any) {
  if (tokens?.access_token) {
    localStorage.setItem('google_calendar_token', tokens.access_token);
    const expiresIn = tokens.expires_in || 3600;
    const expiresAt = Date.now() + expiresIn * 1000;
    localStorage.setItem('google_calendar_token_expires_at', expiresAt.toString());
  }
  if (tokens?.refresh_token) {
    localStorage.setItem('google_calendar_refresh_token', tokens.refresh_token);
  }
  if (profile) {
    localStorage.setItem('google_calendar_user', JSON.stringify(profile));
  }
  window.dispatchEvent(new Event('storage'));
}

export function clearGoogleOAuthSession() {
  localStorage.removeItem('google_calendar_token');
  localStorage.removeItem('google_calendar_token_expires_at');
  localStorage.removeItem('google_calendar_refresh_token');
  localStorage.removeItem('google_calendar_user');
  window.dispatchEvent(new Event('storage'));
}

