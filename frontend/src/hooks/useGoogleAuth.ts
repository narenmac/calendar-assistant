import { useState, useCallback } from 'react';
import { UserInfo } from '../types';

export function useGoogleAuth() {
  // access_token lives only in React state — never written to localStorage or sessionStorage
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [userInfo, setUserInfo] = useState<UserInfo | null>(null);

  const signIn = useCallback(() => {
    const client = google.accounts.oauth2.initTokenClient({
      client_id: import.meta.env.VITE_GOOGLE_CLIENT_ID as string,
      scope: 'https://www.googleapis.com/auth/calendar.events',
      callback: async (response) => {
        const token = response.access_token;
        setAccessToken(token);

        // Fetch the user's display name from Google's userinfo endpoint
        try {
          const res = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
            headers: { Authorization: `Bearer ${token}` },
          });
          const user = await res.json() as { name: string; email: string };
          setUserInfo({ name: user.name, email: user.email });
        } catch {
          setUserInfo({ name: 'User', email: '' });
        }
      },
    });
    client.requestAccessToken();
  }, []);

  const signOut = useCallback(() => {
    if (accessToken) {
      google.accounts.oauth2.revoke(accessToken, () => {
        setAccessToken(null);
        setUserInfo(null);
      });
    }
  }, [accessToken]);

  return { accessToken, userInfo, signIn, signOut };
}
