
import { NextResponse } from 'next/server';
import { prisma } from '../../../../../lib/prisma';
import { getCurrentUser } from '../../../../../lib/session';
import { hasPermission } from '../../../../../lib/permissions';
import {
  sendAttendanceRegisteredEmail,
  sendEmailBatch,
} from '../../../../../lib/mailer';

type AttendanceStatus = 'PRESENTE' | 'AUSENTE' | 'EXCUSADO';
type SubmittedStatus = AttendanceStatus | 'PENDIENTE';

export async function GET(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const currentUser = await getCurrentUser();

    if (!currentUser) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
    }

    const canViewAll = hasPermission(currentUser.permissions, 'attendance.view');
    const canViewOwn = hasPermission(currentUser.permissions, 'attendance.view.own');
    const canView = canViewAll || canViewOwn;

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
        attendanceFinalized: true,
        attendanceUpdatedAt: true,
        attendanceUpdatedBy: {
          select: { fullName: true },
        },
        assignedUsers: {
          where: canViewAll ? undefined : { userId: currentUser.id },
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
    if (!canViewAll && activity.assignedUsers.length === 0) {
      return NextResponse.json(
        { error: 'No estás asignado a esta actividad' },
        { status: 403 }
      );
    }

    const attendance = await prisma.attendance.findMany({
      where: {
        activityId,
        ...(canViewAll ? {} : { userId: currentUser.id }),
      },
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
        ...(canViewAll ? {} : { userId: currentUser.id }),
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
          (hasApprovedExcuse ? 'EXCUSADO' : 'PENDIENTE'),
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
          attendanceFinalized: activity.attendanceFinalized,
          attendanceUpdatedAt: activity.attendanceUpdatedAt,
          attendanceUpdatedBy: activity.attendanceUpdatedBy,
        },
        users,
        permissions: {
          canUpdate: hasPermission(currentUser.permissions, 'attendance.update'),
        },
      },
    });
  } catch (error) {
    console.error('GET /api/activities/[id]/attendance error:', error);

    return NextResponse.json(
      {
        error: 'Error cargando asistencia'
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
    const action = body.action as 'draft' | 'finalize' | 'correction';

    const records = body.records as Array<{
      userId: string;
      status?: SubmittedStatus;
      notes?: string;
    }>;

    if (!Array.isArray(records) || !['draft', 'finalize', 'correction'].includes(action)) {
      return NextResponse.json(
        { error: 'records debe ser un arreglo' },
        { status: 400 }
      );
    }

    const activityState = await prisma.activity.findUnique({
      where: { id: activityId },
      select: { attendanceFinalized: true },
    });

    if (!activityState) {
      return NextResponse.json({ error: 'Actividad no encontrada' }, { status: 404 });
    }

    if (activityState.attendanceFinalized && !canUpdate) {
      return NextResponse.json(
        { error: 'La asistencia está finalizada y requiere permiso de edición' },
        { status: 403 }
      );
    }

    const validStatuses: SubmittedStatus[] = [
      'PENDIENTE',
      'PRESENTE',
      'AUSENTE',
      'EXCUSADO',
    ];

    if (records.some((record) => !record.userId || !record.status || !validStatuses.includes(record.status))) {
      return NextResponse.json(
        { error: 'Hay registros de asistencia inválidos' },
        { status: 400 }
      );
    }

    if (activityState.attendanceFinalized && action !== 'correction') {
      return NextResponse.json(
        { error: 'Usa Guardar correcciones para modificar una asistencia finalizada' },
        { status: 400 }
      );
    }

    if (!activityState.attendanceFinalized && action === 'correction') {
      return NextResponse.json(
        { error: 'La asistencia todavía no ha sido finalizada' },
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

    const pendingUserIds = assignedUserIds.filter((userId) => {
      const record = recordsByUser.get(userId);
      return !excusedUserIds.has(userId) && (!record || record.status === 'PENDIENTE');
    });

    if ((action === 'finalize' || action === 'correction') && pendingUserIds.length > 0) {
      return NextResponse.json(
        { error: `Aún hay ${pendingUserIds.length} colaborador(es) pendientes` },
        { status: 400 }
      );
    }

    await prisma.$transaction(async (tx) => {
      for (const userId of assignedUserIds) {
        const record = recordsByUser.get(userId);

        if (!excusedUserIds.has(userId) && (!record || record.status === 'PENDIENTE')) {
          await tx.attendance.deleteMany({ where: { userId, activityId } });
          continue;
        }

        const status: AttendanceStatus = excusedUserIds.has(userId)
          ? 'EXCUSADO'
          : record!.status as AttendanceStatus;

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

      await tx.activity.update({
        where: { id: activityId },
        data: {
          attendanceFinalized: action !== 'draft',
          attendanceUpdatedAt: new Date(),
          attendanceUpdatedById: currentUser.id,
        },
      });
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

    if (activity && action === 'finalize') {
      await sendEmailBatch({
  items: usersToNotify,
  batchSize: 8,
  delayMs: 1500,
  send: async (user) => {
    const record = recordsByUser.get(user.id);

    const status: AttendanceStatus = excusedUserIds.has(user.id)
      ? 'EXCUSADO'
      : record!.status as AttendanceStatus;

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
      message:
        action === 'draft'
          ? 'Borrador guardado correctamente'
          : action === 'correction'
            ? 'Correcciones guardadas correctamente'
            : 'Asistencia finalizada correctamente',
    });
  } catch (error) {
    console.error('POST /api/activities/[id]/attendance error:', error);

    return NextResponse.json(
      {
        error: 'Error guardando asistencia'
      },
      { status: 500 }
    );
  }
}

export const dynamic = 'force-dynamic';
