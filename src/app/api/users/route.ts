import { NextResponse } from 'next/server';
import { prisma } from '../../../lib/prisma';
import { hashPassword } from '../../../lib/auth';
import { userSchema } from '../../../lib/validations';
import { getCurrentUser } from '../../../lib/session';
import { hasPermission } from '../../../lib/permissions';
import { sendUserCredentialsEmail } from '../../../lib/mailer';
export async function GET() {
  try {
    const currentUser = await getCurrentUser();

    if (!currentUser) {
      return NextResponse.json(
        { error: 'No autenticado' },
        { status: 401 }
      );
    }

    if (!hasPermission(currentUser.permissions, 'users.view')) {
      return NextResponse.json(
        { error: 'Sin permisos para ver usuarios' },
        { status: 403 }
      );
    }

    const users = await prisma.user.findMany({
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        fullName: true,
        email: true,
        isActive: true,
        createdAt: true,
        role: {
          select: {
            code: true,
            name: true,
          },
        },
      },
    });

    return NextResponse.json({ data: users });
  } catch (error) {
    console.error('GET /api/users error:', error);
    return NextResponse.json(
      { error: 'Error obteniendo usuarios', details: String(error) },
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

    const existing = await prisma.user.findUnique({
      where: { email: parsed.data.email },
    });

    if (existing) {
      return NextResponse.json(
        { error: 'El correo ya existe' },
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
      { error: 'Error interno', details: String(error) },
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

    const updatedUser = await prisma.user.update({
      where: { id },
      data: {
        fullName,
        email,
        role: {
          connect: { id: role.id },
        },
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
      { error: 'Error actualizando usuario', details: String(error) },
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
    });

    if (!existingUser) {
      return NextResponse.json(
        { error: 'Usuario no encontrado' },
        { status: 404 }
      );
    }

    const updatedUser = await prisma.user.update({
      where: { id },
      data: { isActive },
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
      { error: 'Error actualizando estado del usuario', details: String(error) },
      { status: 500 }
    );
  }
  
}
