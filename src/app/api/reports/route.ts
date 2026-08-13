import { NextResponse } from 'next/server';
import { prisma } from '../../../lib/prisma';
import { getCurrentUser } from '../../../lib/session';
import { hasPermission } from '../../../lib/permissions';
export async function GET(req: Request) {
  try {
    const currentUser = await getCurrentUser();

    if (!currentUser) {
      return NextResponse.json(
        { error: 'No autenticado' },
        { status: 401 }
      );
    }

    if (!hasPermission(currentUser.permissions, 'reports.view')) {
      return NextResponse.json(
        { error: 'Sin permisos para ver reportes' },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(req.url);
    const selectedUserId = searchParams.get('userId');
    const format = searchParams.get('format');
    if (format === 'csv' && !hasPermission(currentUser.permissions, 'reports.export')) {
      return NextResponse.json({ error: 'Sin permisos para exportar reportes' }, { status: 403 });
    }

    const userFilter = selectedUserId ? { id: selectedUserId } : {};
    const attendanceFilter = {
      ...(selectedUserId ? { userId: selectedUserId } : {}),
      activity: { attendanceFinalized: true },
    };
    const excusesFilter = selectedUserId ? { userId: selectedUserId } : {};
    const obligationsFilter = selectedUserId ? { userId: selectedUserId } : {};
    const paymentsFilter = selectedUserId
      ? {
          userObligation: {
            userId: selectedUserId,
          },
        }
      : {};
    await prisma.userObligation.updateMany({
      where: {
        balance: { gt: 0 },
        status: { in: ['PENDIENTE', 'PARCIAL'] },
        obligation: { dueDate: { lt: new Date() } },
      },
      data: { status: 'VENCIDO' },
    });

    const [
      selectedUser,
      usersCount,
      activitiesCount,
      excusesCount,
      pendingExcusesCount,
      obligationsCount,
      pendingObligationsCount,
      partialObligationsCount,
      paidObligationsCount,
      overdueObligationsCount,
      paymentsCount,
      payments,
      attendance,
    ] = await Promise.all([
      selectedUserId
        ? prisma.user.findUnique({
            where: { id: selectedUserId },
            select: {
              id: true,
              fullName: true,
              email: true,
              role: {
                select: {
                  name: true,
                  code: true,
                },
              },
            },
          })
        : Promise.resolve(null),

      prisma.user.count({
        where: userFilter,
      }),

      prisma.activity.count(),

      prisma.excuse.count({
        where: excusesFilter,
      }),

      prisma.excuse.count({
        where: {
          ...excusesFilter,
          status: 'PENDIENTE',
        },
      }),

      prisma.userObligation.count({
        where: obligationsFilter,
      }),

      prisma.userObligation.count({
        where: {
          ...obligationsFilter,
          status: 'PENDIENTE',
        },
      }),

      prisma.userObligation.count({
        where: {
          ...obligationsFilter,
          status: 'PARCIAL',
        },
      }),

      prisma.userObligation.count({
        where: {
          ...obligationsFilter,
          status: 'PAGADO',
        },
      }),

      prisma.userObligation.count({
        where: {
          ...obligationsFilter,
          status: 'VENCIDO',
        },
      }),

      prisma.payment.count({
        where: paymentsFilter,
      }),

      prisma.payment.findMany({
        where: paymentsFilter,
        select: {
          amountPaid: true,
        },
      }),

      prisma.attendance.findMany({
        where: attendanceFilter,
        select: {
          status: true,
        },
      }),
    ]);

    const totalCollected = payments.reduce(
      (acc, item) => acc + Number(item.amountPaid),
      0
    );

    const attendanceSummary = attendance.reduce(
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

    const attendancePercentage =
      attendanceSummary.total > 0
        ? Number(
            (
              (attendanceSummary.presentes / attendanceSummary.total) *
              100
            ).toFixed(2)
          )
        : 0;

    if (format === 'csv') {
      const rows = [
        ['Métrica', 'Valor'],
        ['Usuario', selectedUser?.fullName ?? 'Todos'],
        ['Usuarios', usersCount],
        ['Actividades', activitiesCount],
        ['Asistencias', attendanceSummary.total],
        ['Presentes', attendanceSummary.presentes],
        ['Ausentes', attendanceSummary.ausentes],
        ['Excusados', attendanceSummary.excusados],
        ['Porcentaje de asistencia', attendancePercentage],
        ['Excusas pendientes', pendingExcusesCount],
        ['Obligaciones pendientes', pendingObligationsCount],
        ['Obligaciones parciales', partialObligationsCount],
        ['Obligaciones pagadas', paidObligationsCount],
        ['Obligaciones vencidas', overdueObligationsCount],
        ['Pagos registrados', paymentsCount],
        ['Total recaudado', totalCollected.toFixed(2)],
      ];
      const csv = rows
        .map((row) => row.map((value) => `"${String(value).replaceAll('"', '""')}"`).join(','))
        .join('\r\n');
      return new NextResponse(`\uFEFF${csv}`, {
        headers: {
          'Content-Type': 'text/csv; charset=utf-8',
          'Content-Disposition': 'attachment; filename="reporte-tesoreria.csv"',
        },
      });
    }

    return NextResponse.json({
      data: {
        selectedUser,
        users: {
          total: usersCount,
        },
        activities: {
          total: activitiesCount,
        },
        attendance: {
          ...attendanceSummary,
          percentage: attendancePercentage,
        },
        excuses: {
          total: excusesCount,
          pending: pendingExcusesCount,
        },
        obligations: {
          total: obligationsCount,
          pending: pendingObligationsCount,
          partial: partialObligationsCount,
          paid: paidObligationsCount,
          overdue: overdueObligationsCount,
        },
        payments: {
          total: paymentsCount,
          totalCollected: Number(totalCollected.toFixed(2)),
        },
      },
    });
  } catch (error) {
    console.error('GET /api/reports error:', error);
    return NextResponse.json(
      { error: 'Error obteniendo reportes' },
      { status: 500 }
    );
  }
}

export const dynamic = 'force-dynamic';
