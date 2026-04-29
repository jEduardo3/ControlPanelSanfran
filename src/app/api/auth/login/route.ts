import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { comparePassword, signToken } from '@/lib/auth';
import { loginSchema } from '@/lib/validations';
import { getSessionCookieName } from '@/lib/session';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const parsed = loginSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Datos inválidos', details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const user = await prisma.user.findUnique({
      where: { email: parsed.data.email },
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

    if (!user || !user.isActive) {
      return NextResponse.json(
        { error: 'Usuario no encontrado o inactivo' },
        { status: 404 }
      );
    }

    const isValid = await comparePassword(parsed.data.password, user.passwordHash);

    if (!isValid) {
      return NextResponse.json(
        { error: 'Contraseña incorrecta' },
        { status: 401 }
      );
    }

    const rolePermissions =
      user.role?.rolePermissions.map((rp) => rp.permission.code) ?? [];

    const directPermissions =
      user.userPermissions
        .filter((up) => up.granted)
        .map((up) => up.permission.code) ?? [];

    const permissions = [...new Set([...rolePermissions, ...directPermissions])];

    const token = signToken({
      id: user.id,
      email: user.email,
      fullName: user.fullName,
      roleCode: user.role?.code ?? null,
      roleName: user.role?.name ?? null,
      permissions,
    });

    const response = NextResponse.json({
      message: 'Login correcto',
      user: {
        id: user.id,
        fullName: user.fullName,
        email: user.email,
        roleCode: user.role?.code ?? null,
        roleName: user.role?.name ?? null,
        permissions,
      },
    });

    response.cookies.set({
      name: getSessionCookieName(),
      value: token,
      httpOnly: true,
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
      path: '/',
      maxAge: 60 * 60 * 8,
    });

    console.log('Login correcto para:', user.email);
    console.log('Cookie seteada:', getSessionCookieName());

    return response;
  } catch (error) {
    console.error('POST /api/auth/login error:', error);
    return NextResponse.json(
      { error: 'Error interno', details: String(error) },
      { status: 500 }
    );
  }
}