import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { hashPassword } from '@/lib/auth';
import { sendTemporaryPasswordEmail } from '@/lib/mailer';

function generateTemporaryPassword() {
  const random = Math.floor(100000 + Math.random() * 900000);
  return `Hmdad-${random}`;
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const email = String(body.email ?? '').trim().toLowerCase();

    if (!email) {
      return NextResponse.json(
        { error: 'El correo es obligatorio' },
        { status: 400 }
      );
    }

    const user = await prisma.user.findFirst({
      where: {
        email: {
          equals: email,
          mode: 'insensitive',
        },
        isActive: true,
      },
    });

    if (!user) {
      return NextResponse.json(
        { error: 'No existe un usuario activo con ese correo' },
        { status: 404 }
      );
    }

    const temporaryPassword = generateTemporaryPassword();
    const passwordHash = await hashPassword(temporaryPassword);

    await prisma.user.update({
      where: { id: user.id },
      data: {
        passwordHash,
        mustChangePassword: true,
      },
    });

    await sendTemporaryPasswordEmail({
      to: user.email,
      fullName: user.fullName,
      username: user.username,
      temporaryPassword,
    });

    return NextResponse.json({
      message: 'Se ha enviado una contraseña temporal a tu correo.',
    });
  } catch (error) {
    console.error('POST /api/auth/forgot-password error:', error);

    return NextResponse.json(
      { error: 'Error restableciendo contraseña', details: String(error) },
      { status: 500 }
    );
  }
}