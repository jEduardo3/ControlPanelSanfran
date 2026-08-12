import { cookies } from 'next/headers';
import { verifyToken, type SessionUser } from './auth';
import { getUserWithPermissions } from './get-user-permissions';

const COOKIE_NAME = 'tesoreria_token';

export function getSessionCookieName() {
  return COOKIE_NAME;
}

export async function getCurrentUser(options?: {
  allowPasswordChange?: boolean;
}): Promise<SessionUser | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(COOKIE_NAME)?.value;

  if (!token) return null;

  const tokenUser = verifyToken(token);
  if (!tokenUser) return null;

  const user = await getUserWithPermissions(tokenUser.id);
  if (!user || !user.isActive || user.sessionVersion !== tokenUser.sessionVersion) {
    return null;
  }

  const sessionUser = {
    id: user.id,
    email: user.email,
    username: user.username,
    fullName: user.fullName,
    roleCode: user.role?.code ?? null,
    roleName: user.role?.name ?? null,
    permissions: user.permissions,
    mustChangePassword: user.mustChangePassword,
    sessionVersion: user.sessionVersion,
  };

  if (sessionUser.mustChangePassword && !options?.allowPasswordChange) {
    return null;
  }

  return sessionUser;
}
