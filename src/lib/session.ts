import { cookies } from 'next/headers';
import { verifyToken, type SessionUser } from '@/lib/auth';

const COOKIE_NAME = 'tesoreria_token';

export function getSessionCookieName() {
  return COOKIE_NAME;
}

export async function getCurrentUser(): Promise<SessionUser | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(COOKIE_NAME)?.value;

  if (!token) return null;

  return verifyToken(token);
}