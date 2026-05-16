import { NextResponse } from 'next/server';
import { prisma } from '../../../../lib/prisma';
import { getCurrentUser } from '../../../../lib/session';
import { hasPermission } from '../../../../lib/permissions';
import { sendExcuseReviewedEmail } from '../../../../lib/mailer';

type ReviewStatus = 'APROBADA' | 'RECHAZADA';

export async function PATCH(req: Request) {
  try {
    const currentUser = await getCurrentUser();

    if (!currentUser) {
      return NextResponse.json(
        { error: 'No autenticado' },
        { status: 401 }
      );
    }

    if (!hasPermission(currentUser.permissions, 'excuses.review')) {
      return NextResponse.json(
        { error: 'No tienes permiso para revisar excusas' },
        { status: 403 }
      );
    }

    const body = await req.json();

    const { excuseId, status } = body as {
      excuseId?: string;
      status?: ReviewStatus;
    };

    if (!excuseId || !status) {
      return NextResponse.json(
        { error: 'excuseId y status son obligatorios' },
        { status: 400 }
      );
    }

    const validStatuses: ReviewStatus[] = ['APROBADA', 'RECHAZADA'];

    if (!validStatuses.includes(status)) {
      return NextResponse.json(
        { error: 'Estado inválido para revisión' },
        { status: 400 }
      );
    }

    const existing = await prisma.excuse.findUnique({
      where: { id: excuseId },
      include: {
        user: {
          select: {
            id: true,
            fullName: true,
            email: true,
          },
        },
        activity: {
          select: {
            id: true,
            title: true,
            activityDate: true,
          },
        },
      },
    });

    if (!existing) {
      return NextResponse.json(
        { error: 'Excusa no encontrada' },
        { status: 404 }
      );
    }

    const updated = await prisma.excuse.update({
      where: { id: excuseId },
      data: {
        status,
        reviewedById: currentUser.id,
        reviewedAt: new Date(),
      },
      include: {
        user: {
          select: {
            id: true,
            fullName: true,
            email: true,
          },
        },
        activity: {
          select: {
            id: true,
            title: true,
            activityDate: true,
          },
        },
        reviewedBy: {
          select: {
            id: true,
            fullName: true,
            email: true,
          },
        },
      },
    });

    try {
      await sendExcuseReviewedEmail({
        to: updated.user.email,
        fullName: updated.user.fullName,
        activityTitle: updated.activity.title,
        activityDate: new Date(updated.activity.activityDate),
        reason: existing.reason,
        status,
      });
    } catch (mailError) {
      console.error(
        `Error enviando correo de resolución de excusa a ${updated.user.email}:`,
        mailError
      );
    }

    return NextResponse.json({
      message:
        status === 'APROBADA'
          ? 'Excusa aprobada correctamente'
          : 'Excusa rechazada correctamente',
      data: updated,
    });
  } catch (error) {
    console.error('PATCH /api/excuses/review error:', error);

    return NextResponse.json(
      {
        error: 'Error revisando excusa',
        details: String(error),
      },
      { status: 500 }
    );
  }
}