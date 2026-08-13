import { NextResponse } from 'next/server';
import { prisma } from '../../../../lib/prisma';
import { getCurrentUser } from '../../../../lib/session';
import { hasPermission } from '../../../../lib/permissions';

type AttendanceStatus = 'PRESENTE' | 'AUSENTE' | 'EXCUSADO';

export async function GET(req: Request) {
  try {
    const currentUser = await getCurrentUser();

    if (!currentUser) {
      return NextResponse.json(
        { error: 'No autenticado' },
        { status: 401 }
      );
    }

    const canViewAll = hasPermission(
      currentUser.permissions,
      'attendance.view'
    );

    const canViewOwn = hasPermission(
      currentUser.permissions,
      'attendance.view.own'
    );

    if (!canViewAll && !canViewOwn) {
      return NextResponse.json(
        { error: 'Sin permisos para ver asistencia' },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(req.url);
    const requestedUserId = searchParams.get('userId');

    const whereClause: {
      userId?: string;
      activity: { attendanceFinalized: boolean };
    } = { activity: { attendanceFinalized: true } };

    if (canViewAll) {
      if (requestedUserId) {
        whereClause.userId = requestedUserId;
      }
    } else {
      whereClause.userId = currentUser.id;
    }

    const attendance = await prisma.attendance.findMany({
      where: whereClause,
      orderBy: {
        registeredAt: 'desc',
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
      },
    });

    const summary = attendance.reduce(
      (acc, item) => {
        acc.total += 1;

        if (item.status === 'PRESENTE') acc.presentes += 1;
        if (item.status === 'AUSENTE') acc.ausentes += 1;
        if (item.status === 'EXCUSADO') acc.excusados += 1;

        return acc;
      },
      {
        total: 0,
        presentes: 0,
        ausentes: 0,
        excusados: 0,
      }
    );

    const percentage =
      summary.total > 0
        ? Number(((summary.presentes / summary.total) * 100).toFixed(2))
        : 0;

    return NextResponse.json({
      data: attendance,
      summary: {
        ...summary,
        percentage,
      },
    });
  } catch (error) {
    console.error('GET attendance error:', error);

    return NextResponse.json(
      {
        error: 'Error obteniendo asistencia'
      },
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

    if (
      !hasPermission(currentUser.permissions, 'attendance.create')
    ) {
      return NextResponse.json(
        { error: 'Sin permiso para registrar asistencia' },
        { status: 403 }
      );
    }

    const body = await req.json();

    const {
      userId,
      activityId,
      status,
      notes,
    }: {
      userId?: string;
      activityId?: string;
      status?: AttendanceStatus;
      notes?: string;
    } = body;

    if (!userId || !activityId || !status) {
      return NextResponse.json(
        { error: 'Faltan campos obligatorios' },
        { status: 400 }
      );
    }

    const validStatuses: AttendanceStatus[] = [
      'PRESENTE',
      'AUSENTE',
      'EXCUSADO',
    ];

    if (!validStatuses.includes(status)) {
      return NextResponse.json(
        { error: 'Estado de asistencia no válido' },
        { status: 400 }
      );
    }

    const existing = await prisma.attendance.findFirst({
      where: {
        userId,
        activityId,
      },
    });

    if (existing) {
      return NextResponse.json(
        {
          error:
            'Ya existe asistencia registrada para este usuario en esta actividad',
        },
        { status: 409 }
      );
    }

    const attendance = await prisma.attendance.create({
      data: {
        userId,
        activityId,
        status,
        notes: notes ?? '',
        registeredById: currentUser.id,
      },
      include: {
        user: {
          select: {
            fullName: true,
          },
        },
        activity: {
          select: {
            title: true,
          },
        },
      },
    });

    return NextResponse.json(
      {
        message: 'Asistencia registrada correctamente',
        data: attendance,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('POST attendance error:', error);

    return NextResponse.json(
      {
        error: 'Error registrando asistencia'
      },
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

    if (
      !hasPermission(currentUser.permissions, 'attendance.update')
    ) {
      return NextResponse.json(
        { error: 'Sin permiso para editar asistencia' },
        { status: 403 }
      );
    }

    const body = await req.json();

    const {
      id,
      status,
      notes,
    }: {
      id?: string;
      status?: AttendanceStatus;
      notes?: string;
    } = body;

    if (!id || !status) {
      return NextResponse.json(
        { error: 'id y status son obligatorios' },
        { status: 400 }
      );
    }

    const validStatuses: AttendanceStatus[] = [
      'PRESENTE',
      'AUSENTE',
      'EXCUSADO',
    ];

    if (!validStatuses.includes(status)) {
      return NextResponse.json(
        { error: 'Estado de asistencia no válido' },
        { status: 400 }
      );
    }

    const existing = await prisma.attendance.findUnique({
      where: { id },
    });

    if (!existing) {
      return NextResponse.json(
        { error: 'Registro de asistencia no encontrado' },
        { status: 404 }
      );
    }

    const updated = await prisma.attendance.update({
      where: { id },
      data: {
        status,
        notes: notes ?? '',
        registeredById: currentUser.id,
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
      },
    });

    return NextResponse.json({
      message: 'Asistencia actualizada correctamente',
      data: updated,
    });
  } catch (error) {
    console.error('PATCH attendance error:', error);

    return NextResponse.json(
      {
        error: 'Error actualizando asistencia'
      },
      { status: 500 }
    );
  }
}

export async function DELETE(req: Request) {
  try {
    const currentUser = await getCurrentUser();

    if (!currentUser) {
      return NextResponse.json(
        { error: 'No autenticado' },
        { status: 401 }
      );
    }

    if (
      !hasPermission(currentUser.permissions, 'attendance.cancel')
    ) {
      return NextResponse.json(
        { error: 'Sin permiso para eliminar asistencia' },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        { error: 'El id de asistencia es obligatorio' },
        { status: 400 }
      );
    }

    const existing = await prisma.attendance.findUnique({
      where: { id },
    });

    if (!existing) {
      return NextResponse.json(
        { error: 'Registro de asistencia no encontrado' },
        { status: 404 }
      );
    }

    await prisma.attendance.delete({
      where: { id },
    });

    return NextResponse.json({
      message: 'Asistencia eliminada correctamente',
    });
  } catch (error) {
    console.error('DELETE attendance error:', error);

    return NextResponse.json(
      {
        error: 'Error eliminando asistencia'
      },
      { status: 500 }
    );
  }
}

export const dynamic = 'force-dynamic';
