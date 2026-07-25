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
      return null;
    }

    const data = await res.json();
    if (data.access_token) {
      localStorage.setItem('google_calendar_token', data.access_token);
      if (data.refresh_token) {
        localStorage.setItem('google_calendar_refresh_token', data.refresh_token);
      }
      window.dispatchEvent(new Event('storage'));
      return data.access_token;
    }
  } catch (err) {
    console.error('[Google Auth] Error refreshing access token:', err);
  }
  return null;
}

export function saveGoogleOAuthTokens(tokens: any, profile?: any) {
  if (tokens?.access_token) {
    localStorage.setItem('google_calendar_token', tokens.access_token);
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
  localStorage.removeItem('google_calendar_refresh_token');
  localStorage.removeItem('google_calendar_user');
  window.dispatchEvent(new Event('storage'));
}
