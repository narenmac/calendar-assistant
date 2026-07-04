import { useState, useCallback, useEffect } from 'react';
import { UserInfo } from '../types';

export function useGoogleAuth() {
  // access_token lives only in React state — never written to storage
  const [accessToken, setAccessToken] = useState<string | null>(null);
  // userInfo (non-sensitive) is cached in sessionStorage to avoid sign-in flicker on refresh
  const [userInfo, setUserInfo] = useState<UserInfo | null>(() => {
    try {
      const cached = sessionStorage.getItem('userInfo');
      return cached ? (JSON.parse(cached) as UserInfo) : null;
    } catch {
      return null;
    }
  });
  const [autoSigningIn, setAutoSigningIn] = useState(true);

  const applyToken = useCallback(async (token: string) => {
    setAccessToken(token);
    try {
      const res = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
        headers: { Authorization: `Bearer ${token}` },
      });
      const user = await res.json() as { name: string; email: string };
      const info: UserInfo = { name: user.name, email: user.email };
      setUserInfo(info);
      sessionStorage.setItem('userInfo', JSON.stringify(info));
    } catch {
      setUserInfo({ name: 'User', email: '' });
    }
  }, []);

  // On mount: attempt silent re-auth so refresh doesn't require clicking sign-in again
  useEffect(() => {
    const trySilent = () => {
      try {
        const client = google.accounts.oauth2.initTokenClient({
          client_id: import.meta.env.VITE_GOOGLE_CLIENT_ID as string,
          scope: 'https://www.googleapis.com/auth/calendar.events',
          callback: async (response) => {
            setAutoSigningIn(false);
            if (response.error || !response.access_token) return;
            await applyToken(response.access_token);
          },
          error_callback: () => {
            setAutoSigningIn(false);
          },
        });
        client.requestAccessToken({ prompt: 'none' });
      } catch {
        setAutoSigningIn(false);
      }
    };

    const win = window as Window & { google?: typeof google };
    if (win.google?.accounts?.oauth2) {
      trySilent();
    } else {
      // GIS script hasn't loaded yet — poll briefly
      const interval = setInterval(() => {
        if (win.google?.accounts?.oauth2) {
          clearInterval(interval);
          clearTimeout(timeout);
          trySilent();
        }
      }, 100);
      const timeout = setTimeout(() => {
        clearInterval(interval);
        setAutoSigningIn(false);
      }, 3000);
    }
  }, [applyToken]);

  const signIn = useCallback(() => {
    const client = google.accounts.oauth2.initTokenClient({
      client_id: import.meta.env.VITE_GOOGLE_CLIENT_ID as string,
      scope: 'https://www.googleapis.com/auth/calendar.events',
      callback: async (response) => {
        if (response.access_token) {
          await applyToken(response.access_token);
        }
      },
    });
    client.requestAccessToken();
  }, [applyToken]);

  const signOut = useCallback(() => {
    if (accessToken) {
      google.accounts.oauth2.revoke(accessToken, () => {
        setAccessToken(null);
        setUserInfo(null);
        sessionStorage.removeItem('userInfo');
      });
    }
  }, [accessToken]);

  return { accessToken, userInfo, signIn, signOut, autoSigningIn };
}
