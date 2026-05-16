import { prisma } from './prisma';
export async function getUserWithPermissions(userId: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: {
      role: {
        include: {
          rolePermissions: {
            include: {
              permission: true,
            },
          },
        },
      },
      userPermissions: {
        include: {
          permission: true,
        },
      },
    },
  });

  if (!user) return null;

  const rolePermissions =
    user.role?.rolePermissions.map((rp) => rp.permission.code) ?? [];

  const directPermissions =
    user.userPermissions
      .filter((up) => up.granted)
      .map((up) => up.permission.code) ?? [];

  return {
    ...user,
    permissions: [...new Set([...rolePermissions, ...directPermissions])],
  };
}