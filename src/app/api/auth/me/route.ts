import { NextResponse } from 'next/server';
import { getCurrentUser } from '../../../../lib/session';

export async function GET() {
  try {
    const user = await getCurrentUser({ allowPasswordChange: true });

    if (!user) {
      return NextResponse.json(
        { error: 'No autenticado' },
        { status: 401 }
      );
    }

    return NextResponse.json({ user });
  } catch (error) {
    console.error('GET /api/auth/me error:', error);

    return NextResponse.json(
      { error: 'Error obteniendo sesión' },
      { status: 500 }
    );
  }
}

export const dynamic = 'force-dynamic';
