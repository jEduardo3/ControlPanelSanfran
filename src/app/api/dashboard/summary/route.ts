import { NextResponse } from 'next/server';
import { prisma } from '../../../../lib/prisma';
import { getCurrentUser } from '../../../../lib/session';
import { hasPermission } from '../../../../lib/permissions';

export async function GET() {
  try {
    const currentUser = await getCurrentUser();

    if (!currentUser) {
      return NextResponse.json(
        { error: 'No autenticado' },
        { status: 401 }
      );
    }

    const canViewAll = hasPermission(currentUser.permissions, 'dashboard.view');
    const canViewOwn = hasPermission(currentUser.permissions, 'dashboard.view.own');

    if (!canViewAll && !canViewOwn) {
      return NextResponse.json(
        { error: 'Sin permisos para ver dashboard' },
        { status: 403 }
      );
    }

    const isOwnOnly = canViewOwn && !canViewAll;

    const now = new Date();
    const next7Days = new Date();
    next7Days.setDate(now.getDate() + 7);

    const [
      activeUsers,
      activitiesCount,
      pendingExcusesCount,
      paymentsCount,
      payments,
      obligationsPendingCount,
      obligationsPartialCount,
      obligationsPaidCount,
      recentPayments,
      recentExcuses,
      recentActivities,
      nearDueObligations,
      attendanceRecords,
    ] = await Promise.all([
      prisma.user.count({
        where: {
          isActive: true,
        },
      }),

      prisma.activity.count(),

      prisma.excuse.count({
        where: isOwnOnly
          ? { userId: currentUser.id, status: 'PENDIENTE' }
          : { status: 'PENDIENTE' },
      }),

      prisma.payment.count({
        where: isOwnOnly
          ? {
              userObligation: {
                userId: currentUser.id,
              },
            }
          : {},
      }),

      prisma.payment.findMany({
        where: isOwnOnly
          ? {
              userObligation: {
                userId: currentUser.id,
              },
            }
          : {},
        select: {
          amountPaid: true,
        },
      }),

      prisma.userObligation.count({
        where: isOwnOnly
          ? { userId: currentUser.id, status: 'PENDIENTE' }
          : { status: 'PENDIENTE' },
      }),

      prisma.userObligation.count({
        where: isOwnOnly
          ? { userId: currentUser.id, status: 'PARCIAL' }
          : { status: 'PARCIAL' },
      }),

      prisma.userObligation.count({
        where: isOwnOnly
          ? { userId: currentUser.id, status: 'PAGADO' }
          : { status: 'PAGADO' },
      }),

      prisma.payment.findMany({
        where: isOwnOnly
          ? {
              userObligation: {
                userId: currentUser.id,
              },
            }
          : {},
        orderBy: { paymentDate: 'desc' },
        take: 5,
        include: {
          userObligation: {
            include: {
              user: {
                select: {
                  fullName: true,
                },
              },
              obligation: {
                select: {
                  title: true,
                },
              },
            },
          },
        },
      }),

      prisma.excuse.findMany({
        where: isOwnOnly
          ? { userId: currentUser.id }
          : {},
        orderBy: { createdAt: 'desc' },
        take: 5,
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
      }),

      prisma.activity.findMany({
        orderBy: { activityDate: 'desc' },
        take: 5,
        select: {
          title: true,
          activityDate: true,
          location: true,
        },
      }),

      prisma.userObligation.findMany({
        where: isOwnOnly
          ? {
              userId: currentUser.id,
              status: {
                in: ['PENDIENTE', 'PARCIAL'],
              },
              obligation: {
                dueDate: {
                  lte: next7Days,
                },
              },
            }
          : {
              status: {
                in: ['PENDIENTE', 'PARCIAL'],
              },
              obligation: {
                dueDate: {
                  lte: next7Days,
                },
              },
            },
        take: 5,
        orderBy: {
          obligation: {
            dueDate: 'asc',
          },
        },
        include: {
          user: {
            select: {
              fullName: true,
            },
          },
          obligation: {
            select: {
              title: true,
              dueDate: true,
            },
          },
        },
      }),

      prisma.attendance.findMany({
        where: isOwnOnly ? { userId: currentUser.id } : {},
        select: {
          status: true,
        },
      }),
    ]);

    const totalCollected = payments.reduce(
      (acc, item) => acc + Number(item.amountPaid),
      0
    );

    const attendanceSummary = attendanceRecords.reduce(
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
            ((attendanceSummary.presentes / attendanceSummary.total) * 100).toFixed(2)
          )
        : 0;

    return NextResponse.json({
      data: {
        cards: {
          activeUsers,
          activitiesCount,
          obligationsPendingCount,
          totalCollected: Number(totalCollected.toFixed(2)),
        },
        operations: {
          paymentsCount,
          pendingExcusesCount,
          obligationsPartialCount,
          obligationsPaidCount,
          attendancePercentage,
          attendanceSummary,
        },
        alerts: {
          nearDueObligations,
          pendingExcusesCount,
        },
        recent: {
          payments: recentPayments,
          excuses: recentExcuses,
          activities: recentActivities,
        },
      },
    });
  } catch (error) {
    console.error('GET /api/dashboard/summary error:', error);
    return NextResponse.json(
      { error: 'Error obteniendo dashboard', details: String(error) },
      { status: 500 }
    );
  }
}