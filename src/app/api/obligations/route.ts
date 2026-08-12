import { NextResponse } from 'next/server';
import { prisma } from '../../../lib/prisma';
import { obligationSchema } from '../../../lib/validations';
import { getCurrentUser } from '../../../lib/session';
import { hasPermission } from '../../../lib/permissions';
import { sendObligationAssignedEmail } from '../../../lib/mailer';

type ObligationStatus = 'PENDIENTE' | 'PARCIAL' | 'PAGADO' | 'VENCIDO';

function calculateStatus(
  balance: number,
  assignedAmount: number,
  dueDate: Date
): ObligationStatus {
  if (balance <= 0) return 'PAGADO';
  if (dueDate.getTime() < Date.now()) return 'VENCIDO';
  if (balance < assignedAmount) return 'PARCIAL';
  return 'PENDIENTE';
}

export async function GET() {
  try {
    const currentUser = await getCurrentUser();

    if (!currentUser) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
    }

    const canViewAll = hasPermission(currentUser.permissions, 'treasury.view');
    const canViewOwn = hasPermission(
      currentUser.permissions,
      'treasury.view.own'
    );

    if (!canViewAll && !canViewOwn) {
      return NextResponse.json(
        { error: 'Sin permisos para ver tesorería' },
        { status: 403 }
      );
    }
    await prisma.userObligation.updateMany({
      where: {
        balance: { gt: 0 },
        status: { in: ['PENDIENTE', 'PARCIAL'] },
        obligation: { dueDate: { lt: new Date() } },
      },
      data: { status: 'VENCIDO' },
    });

    const obligations = await prisma.userObligation.findMany({
      orderBy: { assignedAt: 'desc' },
      include: {
        user: {
          select: {
            id: true,
            fullName: true,
            email: true,
          },
        },
        obligation: {
          select: {
            id: true,
            title: true,
            description: true,
            amount: true,
            dueDate: true,
            isActive: true,
          },
        },
      },
      ...(canViewOwn && !canViewAll
        ? {
            where: {
              userId: currentUser.id,
            },
          }
        : {}),
    });

    return NextResponse.json({ data: obligations });
  } catch (error) {
    console.error('GET /api/obligations error:', error);
    return NextResponse.json(
      { error: 'Error obteniendo obligaciones' },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  try {
    const currentUser = await getCurrentUser();

    if (!currentUser) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
    }

    if (!hasPermission(currentUser.permissions, 'obligations.create')) {
      return NextResponse.json(
        { error: 'No tienes permiso para crear obligaciones' },
        { status: 403 }
      );
    }

    const body = await req.json();

    if (
      Array.isArray(body.userIds) &&
      body.userIds.length > 0 &&
      !hasPermission(currentUser.permissions, 'obligations.assign')
    ) {
      return NextResponse.json(
        { error: 'No tienes permiso para asignar obligaciones' },
        { status: 403 }
      );
    }

    const parsed = obligationSchema.safeParse({
      ...body,
      createdById: currentUser.id,
    });

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Datos inválidos', details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const userIds = [...new Set(parsed.data.userIds)];
    const assignedUsers = await prisma.user.findMany({
      where: { id: { in: userIds }, isActive: true },
      select: { id: true, fullName: true, email: true },
    });
    if (assignedUsers.length !== userIds.length) {
      return NextResponse.json(
        { error: 'Uno o más usuarios asignados no existen o están inactivos' },
        { status: 400 }
      );
    }

    const createdObligation = await prisma.$transaction(async (tx) => {
      const obligation = await tx.financialObligation.create({
        data: {
          title: parsed.data.title,
          description: parsed.data.description,
          amount: parsed.data.amount,
          dueDate: new Date(parsed.data.dueDate),
          createdById: currentUser.id,
        },
      });
      if (userIds.length > 0) {
        await tx.userObligation.createMany({
          data: userIds.map((userId) => ({
            obligationId: obligation.id,
            userId,
            assignedAmount: parsed.data.amount,
            balance: parsed.data.amount,
            status: 'PENDIENTE',
          })),
        });
      }
      return obligation;
    });

    for (const user of assignedUsers) {
      try {
        await sendObligationAssignedEmail({
          to: user.email,
          fullName: user.fullName,
          obligationTitle: createdObligation.title,
          description: createdObligation.description,
          amount: Number(createdObligation.amount),
          dueDate: new Date(createdObligation.dueDate),
        });
      } catch (mailError) {
        console.error(
          `Error enviando correo de obligación a ${user.email}:`,
          mailError
        );
      }
    }

    return NextResponse.json(
      { message: 'Obligación creada correctamente' },
      { status: 201 }
    );
  } catch (error) {
    console.error('POST /api/obligations error:', error);
    return NextResponse.json(
      { error: 'Error interno' },
      { status: 500 }
    );
  }
}

export async function PATCH(req: Request) {
  try {
    const currentUser = await getCurrentUser();

    if (!currentUser) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
    }

    if (!hasPermission(currentUser.permissions, 'obligations.update')) {
      return NextResponse.json(
        { error: 'No tienes permiso para editar obligaciones' },
        { status: 403 }
      );
    }

    const body = await req.json();
    const { obligationId, title, description, amount, dueDate } = body as {
      obligationId?: string;
      title?: string;
      description?: string;
      amount?: number;
      dueDate?: string;
    };

    if (!obligationId || !title || typeof amount !== 'number' || !dueDate) {
      return NextResponse.json(
        { error: 'Faltan campos obligatorios para editar la obligación' },
        { status: 400 }
      );
    }

    const existingObligation = await prisma.financialObligation.findUnique({
      where: { id: obligationId },
      include: {
        userObligations: {
          include: {
            payments: {
              select: {
                amountPaid: true,
              },
            },
          },
        },
      },
    });

    if (!existingObligation) {
      return NextResponse.json(
        { error: 'Obligación no encontrada' },
        { status: 404 }
      );
    }

    await prisma.$transaction(async (tx) => {
      await tx.financialObligation.update({
        where: { id: obligationId },
        data: {
          title,
          description: description ?? '',
          amount,
          dueDate: new Date(dueDate),
        },
      });

      for (const userObligation of existingObligation.userObligations) {
        const totalPaid = userObligation.payments.reduce(
          (acc, payment) => acc + Number(payment.amountPaid),
          0
        );

        const newBalance = Math.max(amount - totalPaid, 0);
        const newStatus = calculateStatus(newBalance, amount, new Date(dueDate));

        await tx.userObligation.update({
          where: { id: userObligation.id },
          data: {
            assignedAmount: amount,
            balance: newBalance,
            status: newStatus,
          },
        });
      }
    });

    return NextResponse.json({
      message: 'Obligación actualizada correctamente',
    });
  } catch (error) {
    console.error('PATCH /api/obligations error:', error);
    return NextResponse.json(
      { error: 'Error actualizando obligación' },
      { status: 500 }
    );
  }
}

export async function DELETE(req: Request) {
  try {
    const currentUser = await getCurrentUser();

    if (!currentUser) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
    }

    if (!hasPermission(currentUser.permissions, 'obligations.delete')) {
      return NextResponse.json(
        { error: 'No tienes permiso para eliminar obligaciones' },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(req.url);
    const obligationId = searchParams.get('id');

    if (!obligationId) {
      return NextResponse.json(
        { error: 'El id de la obligación es obligatorio' },
        { status: 400 }
      );
    }

    const existingObligation = await prisma.financialObligation.findUnique({
      where: { id: obligationId },
      include: {
        userObligations: {
          include: {
            payments: {
              select: { id: true },
            },
          },
        },
      },
    });

    if (!existingObligation) {
      return NextResponse.json(
        { error: 'Obligación no encontrada' },
        { status: 404 }
      );
    }

    const hasPayments = existingObligation.userObligations.some(
      (uo) => uo.payments.length > 0
    );

    if (hasPayments) {
      return NextResponse.json(
        {
          error:
            'No se puede eliminar la obligación porque ya tiene pagos registrados.',
        },
        { status: 409 }
      );
    }

    await prisma.$transaction(async (tx) => {
      await tx.userObligation.deleteMany({
        where: { obligationId },
      });

      await tx.financialObligation.delete({
        where: { id: obligationId },
      });
    });

    return NextResponse.json({
      message: 'Obligación eliminada correctamente',
    });
  } catch (error) {
    console.error('DELETE /api/obligations error:', error);
    return NextResponse.json(
      { error: 'Error eliminando obligación' },
      { status: 500 }
    );
  }
}

export const dynamic = 'force-dynamic';
