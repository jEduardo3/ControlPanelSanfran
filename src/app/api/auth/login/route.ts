import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { comparePassword, signToken } from '@/lib/auth';
import { getSessionCookieName } from '@/lib/session';

export async function POST(req: Request) {
  try {
    const body = await req.json();

    const identifier = String(body.identifier ?? '').trim();
    const password = String(body.password ?? '');

    if (!identifier || !password) {
      return NextResponse.json(
        { error: 'Usuario y contraseña son obligatorios' },
        { status: 400 }
      );
    }

    const user = await prisma.user.findFirst({
      where: {
        isActive: true,
        OR: [
          {
            username: {
              equals: identifier,
              mode: 'insensitive',
            },
          },
          {
            email: {
              equals: identifier,
              mode: 'insensitive',
            },
          },
        ],
      },
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

    if (!user) {
      return NextResponse.json(
        { error: 'Usuario no encontrado o inactivo' },
        { status: 401 }
      );
    }

    const validPassword = await comparePassword(password, user.passwordHash);

    if (!validPassword) {
      return NextResponse.json(
        { error: 'Credenciales inválidas' },
        { status: 401 }
      );
    }

    const permissionsFromRole =
      user.role?.rolePermissions.map((rp) => rp.permission.code) ?? [];

    const permissionsFromUser = user.userPermissions
      .filter((up) => up.granted)
      .map((up) => up.permission.code);

    const permissions = Array.from(
      new Set([...permissionsFromRole, ...permissionsFromUser])
    );

   const token = await signToken({
  id: user.id,
  email: user.email,
  fullName: user.fullName,
  roleCode: user.role?.code ?? null,
  roleName: user.role?.name ?? null,
  permissions,
  mustChangePassword: user.mustChangePassword,
});

    const response = NextResponse.json({
      message: 'Sesión iniciada correctamente',
      user: {
        id: user.id,
        email: user.email,
        username: user.username,
        fullName: user.fullName,
        roleCode: user.role?.code ?? null,
        roleName: user.role?.name ?? null,
        permissions,
        mustChangePassword: user.mustChangePassword,
      },
    });

    response.cookies.set(getSessionCookieName(), token, {
      httpOnly: true,
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
      path: '/',
      maxAge: 60 * 60 * 8,
    });

    return response;
  } catch (error) {
    console.error('POST /api/auth/login error:', error);

    return NextResponse.json(
      { error: 'Error interno', details: String(error) },
      { status: 500 }
    );
  }
}