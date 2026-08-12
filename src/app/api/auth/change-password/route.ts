import { NextResponse } from 'next/server';
import { prisma } from '../../../../lib/prisma';
import { comparePassword, hashPassword } from '../../../../lib/auth';
import { getCurrentUser, getSessionCookieName } from '../../../../lib/session';

export async function POST(req: Request) {
  try {
    const currentUser = await getCurrentUser({ allowPasswordChange: true });

    if (!currentUser) {
      return NextResponse.json(
        { error: 'No autenticado' },
        { status: 401 }
      );
    }

    const body = await req.json();

    const currentPassword = String(body.currentPassword ?? '');
    const newPassword = String(body.newPassword ?? '');
    const confirmPassword = String(body.confirmPassword ?? '');

    if (!currentPassword || !newPassword || !confirmPassword) {
      return NextResponse.json(
        { error: 'Todos los campos son obligatorios' },
        { status: 400 }
      );
    }

    if (newPassword.length < 8) {
      return NextResponse.json(
        { error: 'La nueva contraseña debe tener al menos 8 caracteres' },
        { status: 400 }
      );
    }

    if (newPassword !== confirmPassword) {
      return NextResponse.json(
        { error: 'Las contraseñas no coinciden' },
        { status: 400 }
      );
    }

    const user = await prisma.user.findUnique({
      where: { id: currentUser.id },
    });

    if (!user || !user.isActive) {
      return NextResponse.json(
        { error: 'Usuario no encontrado o inactivo' },
        { status: 404 }
      );
    }

    const validPassword = await comparePassword(
      currentPassword,
      user.passwordHash
    );

    if (!validPassword) {
      return NextResponse.json(
        { error: 'La contraseña actual no es correcta' },
        { status: 401 }
      );
    }

    const passwordHash = await hashPassword(newPassword);

    await prisma.user.update({
      where: { id: user.id },
      data: {
        passwordHash,
        mustChangePassword: false,
        sessionVersion: { increment: 1 },
      },
    });

    const response = NextResponse.json({
      message: 'Contraseña actualizada correctamente',
    });
    response.cookies.set(getSessionCookieName(), '', {
      httpOnly: true,
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
      path: '/',
      maxAge: 0,
    });
    return response;
  } catch (error) {
    console.error('POST /api/auth/change-password error:', error);

    return NextResponse.json(
      { error: 'Error cambiando contraseña' },
      { status: 500 }
    );
  }
}

export const dynamic = 'force-dynamic';
