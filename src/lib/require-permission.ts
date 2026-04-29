import { hasPermission } from './permissions';

export function requirePermission(
  userPermissions: string[],
  permission: string
) {
  if (!hasPermission(userPermissions, permission)) {
    throw new Error('NO_AUTHORIZED');
  }
}