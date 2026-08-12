import { NextResponse } from 'next/server';
import { prisma } from '../../../lib/prisma';
import { hashPassword } from '../../../lib/auth';
import { userSchema } from '../../../lib/validations';
import { getCurrentUser } from '../../../lib/session';
import { hasPermission } from '../../../lib/permissions';
import { sendUserCredentialsEmail } from '../../../lib/mailer';

const ROLE_LEVEL: Record<string, number> = {
  COLABORADOR: 0,
  SECRETARIA: 1,
  TESORERIA: 1,
  JUNTA: 2,
  ADMIN_GENERAL: 3,
  SUPERADMIN: 4,
};

function canManageRole(actorRole: string | null, targetRole: string) {
  if (!actorRole) return false;
  if (actorRole === 'SUPERADMIN') return true;
  return (ROLE_LEVEL[actorRole] ?? -1) > (ROLE_LEVEL[targetRole] ?? 99);
}
export async function GET(req: Request) {
  try {
    const currentUser = await getCurrentUser();

    if (!currentUser) {
      return NextResponse.json(
        { error: 'No autenticado' },
        { status: 401 }
      );
    }

    const scope = new URL(req.url).searchParams.get('scope');
    const canViewUsers = hasPermission(currentUser.permissions, 'users.view');
    const canListObligationAssignees =
      scope === 'obligation-assignees' &&
      hasPermission(currentUser.permissions, 'obligations.assign');

    if (!canViewUsers && !canListObligationAssignees) {
      return NextResponse.json(
        { error: 'Sin permisos para ver usuarios' },
        { status: 403 }
      );
    }

    const users = await prisma.user.findMany({
      where: canListObligationAssignees ? { isActive: true } : undefined,
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        fullName: true,
        email: true,
        ...(canViewUsers
          ? {
              isActive: true,
              createdAt: true,
              role: { select: { code: true, name: true } },
            }
          : {}),
      },
    });

    return NextResponse.json({ data: users });
  } catch (error) {
    console.error('GET /api/users error:', error);
    return NextResponse.json(
      { error: 'Error obteniendo usuarios' },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  try {
    const currentUser = await getCurrentUser();

    if (!currentUser) {
      return NextResponse.json(
        { error: 'No autenticado' },
        { status: 401 }
      );
    }

    if (!hasPermission(currentUser.permissions, 'users.create')) {
      return NextResponse.json(
        { error: 'No tienes permiso para crear usuarios' },
        { status: 403 }
      );
    }

    const body = await req.json();
    const parsed = userSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Datos inválidos', details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const existing = await prisma.user.findFirst({
      where: {
        OR: [
          { email: { equals: parsed.data.email.trim(), mode: 'insensitive' } },
          { username: { equals: parsed.data.username.trim(), mode: 'insensitive' } },
        ],
      },
    });

    if (existing) {
      return NextResponse.json(
        { error: 'El correo o nombre de usuario ya existe' },
        { status: 409 }
      );
    }

    const role = await prisma.role.findUnique({
      where: { code: parsed.data.roleCode },
    });

    if (!role) {
      return NextResponse.json(
        { error: 'Rol no encontrado' },
        { status: 404 }
      );
    }

    if (!canManageRole(currentUser.roleCode, role.code)) {
      return NextResponse.json(
        { error: 'No puedes asignar un rol igual o superior al tuyo' },
        { status: 403 }
      );
    }

    const passwordHash = await hashPassword(parsed.data.password);

const user = await prisma.user.create({
  data: {
    fullName: parsed.data.fullName,
    username: parsed.data.username.trim(),
    email: parsed.data.email.trim(),
    passwordHash,
    mustChangePassword: true,
    role: {
      connect: { id: role.id },
    },
  },
  select: {
    id: true,
    fullName: true,
    username: true,
    email: true,
    isActive: true,
    mustChangePassword: true,
    role: {
      select: {
        code: true,
        name: true,
      },
    },
  },
});

try {
  await sendUserCredentialsEmail({
    to: user.email,
    fullName: user.fullName,
    username: user.username,
    password: parsed.data.password,
  });
} catch (mailError) {
  console.error(
    'Error enviando credenciales:',
    mailError
  );
}

return NextResponse.json(
  { message: 'Usuario creado', data: user },
  { status: 201 }
);
  } catch (error) {
    console.error('POST /api/users error:', error);
    return NextResponse.json(
      { error: 'Error interno' },
      { status: 500 }
    );
  }
}

export async function PATCH(req: Request) {
  try {
    const currentUser = await getCurrentUser();

    if (!currentUser) {
      return NextResponse.json(
        { error: 'No autenticado' },
        { status: 401 }
      );
    }

    if (!hasPermission(currentUser.permissions, 'users.update')) {
      return NextResponse.json(
        { error: 'No tienes permiso para editar usuarios' },
        { status: 403 }
      );
    }

    const body = await req.json();
    const { id, fullName, email, roleCode } = body;

    if (!id || !fullName || !email || !roleCode) {
      return NextResponse.json(
        { error: 'Faltan campos obligatorios para editar' },
        { status: 400 }
      );
    }

    const existingUser = await prisma.user.findUnique({
      where: { id },
      include: { role: true },
    });

    if (!existingUser) {
      return NextResponse.json(
        { error: 'Usuario no encontrado' },
        { status: 404 }
      );
    }

    const emailInUse = await prisma.user.findFirst({
      where: {
        email,
        NOT: {
          id,
        },
      },
    });

    if (emailInUse) {
      return NextResponse.json(
        { error: 'El correo ya está en uso por otro usuario' },
        { status: 409 }
      );
    }

    const role = await prisma.role.findUnique({
      where: { code: roleCode },
    });

    if (!role) {
      return NextResponse.json(
        { error: 'Rol no encontrado' },
        { status: 404 }
      );
    }

    if (
      !existingUser.role ||
      !canManageRole(currentUser.roleCode, existingUser.role.code) ||
      !canManageRole(currentUser.roleCode, role.code)
    ) {
      return NextResponse.json(
        { error: 'No puedes administrar ese usuario o asignarle ese rol' },
        { status: 403 }
      );
    }
    if (id === currentUser.id && existingUser.role.code !== role.code) {
      return NextResponse.json(
        { error: 'No puedes cambiar tu propio rol' },
        { status: 409 }
      );
    }
    if (existingUser.role.code === 'SUPERADMIN' && role.code !== 'SUPERADMIN') {
      const activeSuperadmins = await prisma.user.count({
        where: { isActive: true, role: { code: 'SUPERADMIN' } },
      });
      if (activeSuperadmins <= 1) {
        return NextResponse.json(
          { error: 'Debe existir al menos un superadministrador activo' },
          { status: 409 }
        );
      }
    }

    const updatedUser = await prisma.user.update({
      where: { id },
      data: {
        fullName,
        email,
         role: {
           connect: { id: role.id },
         },
         sessionVersion: { increment: 1 },
      },
      select: {
        id: true,
        fullName: true,
        email: true,
        isActive: true,
        role: {
          select: {
            code: true,
            name: true,
          },
        },
      },
    });

    return NextResponse.json({
      message: 'Usuario actualizado correctamente',
      data: updatedUser,
    });
  } catch (error) {
    console.error('PATCH /api/users error:', error);
    return NextResponse.json(
      { error: 'Error actualizando usuario' },
      { status: 500 }
    );
  }
}

export async function PUT(req: Request) {
  try {
    const currentUser = await getCurrentUser();

    if (!currentUser) {
      return NextResponse.json(
        { error: 'No autenticado' },
        { status: 401 }
      );
    }

    const canActivate = hasPermission(currentUser.permissions, 'users.activate');
    const canDeactivate = hasPermission(currentUser.permissions, 'users.deactivate');

    if (!canActivate && !canDeactivate) {
      return NextResponse.json(
        { error: 'No tienes permiso para cambiar el estado de usuarios' },
        { status: 403 }
      );
    }

    const body = await req.json();
    const { id, isActive } = body as { id?: string; isActive?: boolean };

    if (!id || typeof isActive !== 'boolean') {
      return NextResponse.json(
        { error: 'id e isActive son obligatorios' },
        { status: 400 }
      );
    }

    if (isActive && !canActivate) {
      return NextResponse.json(
        { error: 'No tienes permiso para activar usuarios' },
        { status: 403 }
      );
    }

    if (!isActive && !canDeactivate) {
      return NextResponse.json(
        { error: 'No tienes permiso para desactivar usuarios' },
        { status: 403 }
      );
    }

    const existingUser = await prisma.user.findUnique({
      where: { id },
      include: { role: true },
    });

    if (!existingUser) {
      return NextResponse.json(
        { error: 'Usuario no encontrado' },
        { status: 404 }
      );
    }

    if (id === currentUser.id && !isActive) {
      return NextResponse.json(
        { error: 'No puedes desactivar tu propia cuenta' },
        { status: 409 }
      );
    }

    if (!existingUser.role || !canManageRole(currentUser.roleCode, existingUser.role.code)) {
      return NextResponse.json(
        { error: 'No puedes cambiar el estado de ese usuario' },
        { status: 403 }
      );
    }
    if (!isActive && existingUser.role.code === 'SUPERADMIN') {
      const activeSuperadmins = await prisma.user.count({
        where: { isActive: true, role: { code: 'SUPERADMIN' } },
      });
      if (activeSuperadmins <= 1) {
        return NextResponse.json(
          { error: 'Debe existir al menos un superadministrador activo' },
          { status: 409 }
        );
      }
    }

    const updatedUser = await prisma.user.update({
      where: { id },
      data: { isActive, sessionVersion: { increment: 1 } },
      select: {
        id: true,
        fullName: true,
        email: true,
        isActive: true,
        role: {
          select: {
            code: true,
            name: true,
          },
        },
      },
    });

    return NextResponse.json({
      message: isActive
        ? 'Usuario activado correctamente'
        : 'Usuario desactivado correctamente',
      data: updatedUser,
    });
  } catch (error) {
    console.error('PUT /api/users error:', error);
    return NextResponse.json(
      { error: 'Error actualizando estado del usuario' },
      { status: 500 }
    );
  }
  
}

export const dynamic = 'force-dynamic';
