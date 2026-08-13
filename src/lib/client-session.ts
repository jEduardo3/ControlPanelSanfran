'use client';

type SessionResult = {
  ok: boolean;
  user: unknown | null;
};

let pendingSession: Promise<SessionResult> | null = null;
let cachedSession: SessionResult | null = null;
let cacheExpiresAt = 0;

export function clearClientSession() {
  pendingSession = null;
  cachedSession = null;
  cacheExpiresAt = 0;
}

export async function fetchCurrentSession<T>(): Promise<{
  ok: boolean;
  user: T | null;
}> {
  if (cachedSession && Date.now() < cacheExpiresAt) {
    return cachedSession as { ok: boolean; user: T | null };
  }

  if (!pendingSession) {
    pendingSession = fetch('/api/auth/me', {
      credentials: 'include',
      cache: 'no-store',
    })
      .then(async (response) => {
        if (!response.ok) return { ok: false, user: null };
        const data = await response.json();
        return { ok: true, user: data.user ?? null };
      })
      .then((result) => {
        cachedSession = result;
        cacheExpiresAt = Date.now() + 5_000;
        return result;
      })
      .finally(() => {
        pendingSession = null;
      });
  }

  return pendingSession as Promise<{ ok: boolean; user: T | null }>;
}
