
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/session';
import { hasPermission } from '@/lib/permissions';
import {
  sendAttendanceRegisteredEmail,
  sendEmailBatch,
} from '@/lib/mailer';

type AttendanceStatus = 'PRESENTE' | 'AUSENTE' | 'EXCUSADO';

export async function GET(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const currentUser = await getCurrentUser();

    if (!currentUser) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
    }

    const canView =
      hasPermission(currentUser.permissions, 'attendance.view') ||
      hasPermission(currentUser.permissions, 'attendance.view.own');

    if (!canView) {
      return NextResponse.json(
        { error: 'Sin permisos para ver asistencia' },
        { status: 403 }
      );
    }

    const activityId = params.id;

    const activity = await prisma.activity.findUnique({
      where: { id: activityId },
      select: {
        id: true,
        title: true,
        activityDate: true,
        location: true,
        assignedUsers: {
          include: {
            user: {
              select: {
                id: true,
                fullName: true,
                email: true,
              },
            },
          },
          orderBy: {
            user: {
              fullName: 'asc',
            },
          },
        },
      },
    });

    if (!activity) {
      return NextResponse.json(
        { error: 'Actividad no encontrada' },
        { status: 404 }
      );
    }

    const attendance = await prisma.attendance.findMany({
      where: { activityId },
      select: {
        id: true,
        userId: true,
        status: true,
        notes: true,
      },
    });

    const approvedExcuses = await prisma.excuse.findMany({
      where: {
        activityId,
        status: 'APROBADA',
      },
      select: {
        userId: true,
      },
    });

    const attendanceByUser = new Map(
      attendance.map((item) => [item.userId, item])
    );

    const excusedUserIds = new Set(approvedExcuses.map((item) => item.userId));

    const users = activity.assignedUsers.map((assignment) => {
      const existingAttendance = attendanceByUser.get(assignment.user.id);
      const hasApprovedExcuse = excusedUserIds.has(assignment.user.id);

      return {
        user: assignment.user,
        attendanceId: existingAttendance?.id ?? null,
        status:
          existingAttendance?.status ??
          (hasApprovedExcuse ? 'EXCUSADO' : 'AUSENTE'),
        notes: existingAttendance?.notes ?? '',
        hasApprovedExcuse,
      };
    });

    return NextResponse.json({
      data: {
        activity: {
          id: activity.id,
          title: activity.title,
          activityDate: activity.activityDate,
          location: activity.location,
        },
        users,
      },
    });
  } catch (error) {
    console.error('GET /api/activities/[id]/attendance error:', error);

    return NextResponse.json(
      {
        error: 'Error cargando asistencia',
        details: String(error),
      },
      { status: 500 }
    );
  }
}

export async function POST(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const currentUser = await getCurrentUser();

    if (!currentUser) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
    }

    const canCreate = hasPermission(currentUser.permissions, 'attendance.create');
    const canUpdate = hasPermission(currentUser.permissions, 'attendance.update');

    if (!canCreate && !canUpdate) {
      return NextResponse.json(
        { error: 'No tienes permiso para pasar asistencia' },
        { status: 403 }
      );
    }

    const activityId = params.id;
    const body = await req.json();

    const records = body.records as Array<{
      userId: string;
      status?: AttendanceStatus;
      notes?: string;
    }>;

    if (!Array.isArray(records)) {
      return NextResponse.json(
        { error: 'records debe ser un arreglo' },
        { status: 400 }
      );
    }

    const assignedUsers = await prisma.activityAssignment.findMany({
      where: {
        activityId,
      },
      select: {
        userId: true,
      },
    });

    const assignedUserIds = assignedUsers.map((item) => item.userId);

    const approvedExcuses = await prisma.excuse.findMany({
      where: {
        activityId,
        status: 'APROBADA',
      },
      select: {
        userId: true,
      },
    });

    const excusedUserIds = new Set(approvedExcuses.map((item) => item.userId));

    const recordsByUser = new Map(records.map((item) => [item.userId, item]));

    await prisma.$transaction(async (tx) => {
      for (const userId of assignedUserIds) {
        const record = recordsByUser.get(userId);

        const status: AttendanceStatus = excusedUserIds.has(userId)
          ? 'EXCUSADO'
          : record?.status ?? 'AUSENTE';

        await tx.attendance.upsert({
          where: {
            userId_activityId: {
              userId,
              activityId,
            },
          },
          create: {
            userId,
            activityId,
            status,
            notes: record?.notes ?? '',
            registeredById: currentUser.id,
          },
          update: {
            status,
            notes: record?.notes ?? '',
            registeredById: currentUser.id,
          },
        });
      }
    });

    const activity = await prisma.activity.findUnique({
      where: { id: activityId },
      select: {
        title: true,
        activityDate: true,
        location: true,
      },
    });

    const usersToNotify = await prisma.user.findMany({
      where: {
        id: {
          in: assignedUserIds,
        },
        isActive: true,
      },
      select: {
        id: true,
        fullName: true,
        email: true,
      },
    });

    if (activity) {
      await sendEmailBatch({
  items: usersToNotify,
  batchSize: 8,
  delayMs: 1500,
  send: async (user) => {
    const record = recordsByUser.get(user.id);

    const status: AttendanceStatus = excusedUserIds.has(user.id)
      ? 'EXCUSADO'
      : record?.status ?? 'AUSENTE';

    await sendAttendanceRegisteredEmail({
      to: user.email,
      fullName: user.fullName,
      activityTitle: activity.title,
      activityDate: new Date(activity.activityDate),
      location: activity.location,
      status,
      notes: record?.notes ?? '',
    });
  },
  onError: (user, mailError) => {
    console.error(
      `Error enviando correo de asistencia a ${user.email}:`,
      mailError
    );
  },
});
    }

    return NextResponse.json({
      message: 'Asistencia guardada correctamente',
    });
  } catch (error) {
    console.error('POST /api/activities/[id]/attendance error:', error);

    return NextResponse.json(
      {
        error: 'Error guardando asistencia',
        details: String(error),
      },
      { status: 500 }
    );
  }
}
