const BACKEND_URL = import.meta.env.VITE_BACKEND_URL ?? 'http://localhost:8080';

export async function scheduleRequest(text: string, accessToken: string): Promise<string> {
  const res = await fetch(`${BACKEND_URL}/schedule`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ text, access_token: accessToken }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: 'Unknown error' }));
    throw new Error((err as { error: string }).error ?? 'Request failed');
  }
  const data = await res.json() as { message: string };
  return data.message;
}

export async function fetchEvents(accessToken: string): Promise<string> {
  const res = await fetch(`${BACKEND_URL}/events`, {
    headers: { 'X-Google-Access-Token': accessToken },
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: 'Unknown error' }));
    throw new Error((err as { error: string }).error ?? 'Failed to load events');
  }
  const data = await res.json() as { message: string };
  return data.message;
}
