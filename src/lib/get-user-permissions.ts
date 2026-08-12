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

  const permissionSet = new Set(rolePermissions);
  for (const override of user.userPermissions) {
    if (override.granted) permissionSet.add(override.permission.code);
    else permissionSet.delete(override.permission.code);
  }

  return {
    ...user,
    permissions: [...permissionSet],
  };
}
