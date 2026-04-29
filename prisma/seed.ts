import { PrismaClient, SystemRoleCode, PermissionModule } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

const permissions = [
  ['users.view', PermissionModule.USERS, 'view'],
  ['users.create', PermissionModule.USERS, 'create'],
  ['users.update', PermissionModule.USERS, 'update'],
  ['users.delete', PermissionModule.USERS, 'delete'],
  ['users.activate', PermissionModule.USERS, 'activate'],
  ['users.deactivate', PermissionModule.USERS, 'deactivate'],

  ['dashboard.view', PermissionModule.DASHBOARD, 'view'],
  ['dashboard.view.own', PermissionModule.DASHBOARD, 'view.own'],

  ['activities.view', PermissionModule.ACTIVITIES, 'view'],
  ['activities.view.own', PermissionModule.ACTIVITIES, 'view.own'],
  ['activities.create', PermissionModule.ACTIVITIES, 'create'],
  ['activities.update', PermissionModule.ACTIVITIES, 'update'],
  ['activities.delete', PermissionModule.ACTIVITIES, 'delete'],
  ['activities.assign', PermissionModule.ACTIVITIES, 'assign'],

  ['attendance.view', PermissionModule.ATTENDANCE, 'view'],
  ['attendance.view.own', PermissionModule.ATTENDANCE, 'view.own'],
  ['attendance.create', PermissionModule.ATTENDANCE, 'create'],
  ['attendance.update', PermissionModule.ATTENDANCE, 'update'],
  ['attendance.cancel', PermissionModule.ATTENDANCE, 'cancel'],

  ['excuses.view', PermissionModule.EXCUSES, 'view'],
  ['excuses.view.own', PermissionModule.EXCUSES, 'view.own'],
  ['excuses.create', PermissionModule.EXCUSES, 'create'],
  ['excuses.review', PermissionModule.EXCUSES, 'review'],
  ['excuses.update', PermissionModule.EXCUSES, 'update'],
  ['excuses.delete', PermissionModule.EXCUSES, 'delete'],

  ['treasury.view', PermissionModule.TREASURY, 'view'],
  ['treasury.view.own', PermissionModule.TREASURY, 'view.own'],

  ['obligations.create', PermissionModule.OBLIGATIONS, 'create'],
  ['obligations.update', PermissionModule.OBLIGATIONS, 'update'],
  ['obligations.delete', PermissionModule.OBLIGATIONS, 'delete'],
  ['obligations.assign', PermissionModule.OBLIGATIONS, 'assign'],
  ['obligations.change_status', PermissionModule.OBLIGATIONS, 'change_status'],

  ['payments.view', PermissionModule.PAYMENTS, 'view'],
  ['payments.view.own', PermissionModule.PAYMENTS, 'view.own'],
  ['payments.create', PermissionModule.PAYMENTS, 'create'],
  ['payments.update', PermissionModule.PAYMENTS, 'update'],
  ['payments.delete', PermissionModule.PAYMENTS, 'delete'],
  ['payments.receipt.generate', PermissionModule.PAYMENTS, 'receipt.generate'],

  ['reports.view', PermissionModule.REPORTS, 'view'],
  ['reports.export', PermissionModule.REPORTS, 'export'],

  ['settings.view', PermissionModule.SETTINGS, 'view'],
  ['settings.update', PermissionModule.SETTINGS, 'update'],
] as const;

const roleDefinitions = [
  {
    code: SystemRoleCode.SUPERADMIN,
    name: 'Superadministrador',
    permissions: permissions.map(([code]) => code),
  },
  {
    code: SystemRoleCode.ADMIN_GENERAL,
    name: 'Administrador general',
    permissions: permissions.map(([code]) => code),
  },
  {
    code: SystemRoleCode.TESORERIA,
    name: 'Tesorería',
    permissions: [
      'dashboard.view',
      'activities.view',
      'treasury.view',
      'obligations.create',
      'obligations.update',
      'obligations.delete',
      'obligations.assign',
      'obligations.change_status',
      'payments.view',
      'payments.create',
      'payments.update',
      'payments.delete',
      'payments.receipt.generate',
      'reports.view',
      'reports.export',
    ],
  },
  {
    code: SystemRoleCode.SECRETARIA,
    name: 'Secretaría',
    permissions: [
      'dashboard.view',
      'users.view',
      'activities.view',
      'activities.create',
      'activities.update',
      'activities.delete',
      'activities.assign',
      'attendance.view',
      'attendance.create',
      'attendance.update',
      'attendance.cancel',
      'excuses.view',
      'excuses.review',
      'excuses.update',
      'excuses.delete',
      'reports.view',
    ],
  },
  {
    code: SystemRoleCode.COLABORADOR,
    name: 'Colaborador',
    permissions: [
      'dashboard.view.own',
      'activities.view.own',
      'attendance.view.own',
      'excuses.view.own',
      'excuses.create',
      'treasury.view.own',
      'payments.view.own',
    ],
  },
];

async function main() {
  for (const [code, module, action] of permissions) {
    await prisma.permission.upsert({
      where: { code },
      update: {},
      create: {
        code,
        module,
        action,
        description: code,
      },
    });
  }

  for (const roleDef of roleDefinitions) {
    const role = await prisma.role.upsert({
      where: { code: roleDef.code },
      update: {
        name: roleDef.name,
        isActive: true,
      },
      create: {
        code: roleDef.code,
        name: roleDef.name,
        description: roleDef.name,
        isSystem: true,
        isActive: true,
      },
    });

    for (const permissionCode of roleDef.permissions) {
      const permission = await prisma.permission.findUnique({
        where: { code: permissionCode },
      });

      if (!permission) continue;

      await prisma.rolePermission.upsert({
        where: {
          roleId_permissionId: {
            roleId: role.id,
            permissionId: permission.id,
          },
        },
        update: {},
        create: {
          roleId: role.id,
          permissionId: permission.id,
        },
      });
    }
  }

  const superAdminRole = await prisma.role.findUnique({
    where: { code: SystemRoleCode.SUPERADMIN },
  });

  const colaboradorRole = await prisma.role.findUnique({
    where: { code: SystemRoleCode.COLABORADOR },
  });

  if (!superAdminRole || !colaboradorRole) {
    throw new Error('No se pudieron crear los roles base');
  }

  const passwordHash = await bcrypt.hash('123456', 10);

  await prisma.user.upsert({
    where: { email: 'admin@tesoreria.com' },
    update: {},
    create: {
      fullName: 'Administrador Principal',
      email: 'admin@tesoreria.com',
      passwordHash,
      roleId: superAdminRole.id,
    },
  });

  await prisma.user.upsert({
    where: { email: 'colaborador@tesoreria.com' },
    update: {},
    create: {
      fullName: 'Usuario Colaborador',
      email: 'colaborador@tesoreria.com',
      passwordHash,
      roleId: colaboradorRole.id,
    },
  });

  console.log('Seed ejecutado correctamente');
  console.log('Admin: admin@tesoreria.com / 123456');
  console.log('Colaborador: colaborador@tesoreria.com / 123456');
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });