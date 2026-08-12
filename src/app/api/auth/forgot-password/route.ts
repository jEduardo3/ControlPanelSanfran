import { NextResponse } from 'next/server';
import { prisma } from '../../../../lib/prisma';
import { hashPassword } from '../../../../lib/auth';
import { sendTemporaryPasswordEmail } from '../../../../lib/mailer';
import { randomInt } from 'crypto';
import { consumeRateLimit, requestIp } from '../../../../lib/rate-limit';

function generateTemporaryPassword() {
  const random = randomInt(100000, 1000000);
  return `Hmdad-${random}`;
}

export async function POST(req: Request) {
  try {
    if (!consumeRateLimit(`password-reset:${requestIp(req)}`, 5, 60 * 60 * 1000)) {
      return NextResponse.json(
        { error: 'Demasiadas solicitudes. Intenta nuevamente más tarde.' },
        { status: 429 }
      );
    }
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

    const genericResponse = NextResponse.json({
      message: 'Si existe una cuenta activa, recibirá instrucciones por correo.',
    });
    if (!user) return genericResponse;

    if (
      user.passwordResetAt &&
      Date.now() - user.passwordResetAt.getTime() < 15 * 60 * 1000
    ) {
      return genericResponse;
    }

    const temporaryPassword = generateTemporaryPassword();
    const passwordHash = await hashPassword(temporaryPassword);

    await sendTemporaryPasswordEmail({
      to: user.email,
      fullName: user.fullName,
      username: user.username,
      temporaryPassword,
    });

    await prisma.user.update({
      where: { id: user.id },
      data: {
        passwordHash,
        mustChangePassword: true,
        passwordResetAt: new Date(),
        sessionVersion: { increment: 1 },
      },
    });

    return NextResponse.json({
      message: 'Si existe una cuenta activa, recibirá instrucciones por correo.',
    });
  } catch (error) {
    console.error('POST /api/auth/forgot-password error:', error);

    return NextResponse.json(
      { error: 'Error restableciendo contraseña' },
      { status: 500 }
    );
  }
}
