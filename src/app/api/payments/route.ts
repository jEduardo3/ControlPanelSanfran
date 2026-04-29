import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { paymentSchema } from '@/lib/validations';
import { getCurrentUser } from '@/lib/session';
import { hasPermission } from '@/lib/permissions';
import { sendPaymentReceiptEmail } from '@/lib/mailer';

type ObligationStatus = 'PENDIENTE' | 'PARCIAL' | 'PAGADO';

function calculateStatus(
  balance: number,
  assignedAmount: number
): ObligationStatus {
  if (balance <= 0) return 'PAGADO';
  if (balance < assignedAmount) return 'PARCIAL';
  return 'PENDIENTE';
}

async function recalculateUserObligation(tx: any, userObligationId: string) {
  const userObligation = await tx.userObligation.findUnique({
    where: { id: userObligationId },
    include: {
      payments: {
        select: {
          amountPaid: true,
        },
      },
    },
  });

  if (!userObligation) {
    throw new Error('Obligación del usuario no encontrada para recalcular');
  }

  const assignedAmount = Number(userObligation.assignedAmount);
  const totalPaid = userObligation.payments.reduce(
    (acc: number, payment: { amountPaid: number }) =>
      acc + Number(payment.amountPaid),
    0
  );

  const newBalance = Math.max(assignedAmount - totalPaid, 0);
  const newStatus = calculateStatus(newBalance, assignedAmount);

  const updated = await tx.userObligation.update({
    where: { id: userObligationId },
    data: {
      balance: newBalance,
      status: newStatus,
    },
  });

  return updated;
}

export async function GET() {
  try {
    const currentUser = await getCurrentUser();

    if (!currentUser) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
    }

    const canViewAll = hasPermission(currentUser.permissions, 'payments.view');
    const canViewOwn = hasPermission(
      currentUser.permissions,
      'payments.view.own'
    );

    if (!canViewAll && !canViewOwn) {
      return NextResponse.json(
        { error: 'Sin permisos para ver pagos' },
        { status: 403 }
      );
    }

    const payments = await prisma.payment.findMany({
      orderBy: { paymentDate: 'desc' },
      include: {
        registeredBy: {
          select: {
            fullName: true,
          },
        },
        userObligation: {
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
                amount: true,
                dueDate: true,
              },
            },
          },
        },
      },
      ...(canViewOwn && !canViewAll
        ? {
            where: {
              userObligation: {
                userId: currentUser.id,
              },
            },
          }
        : {}),
    });

    return NextResponse.json({ data: payments });
  } catch (error) {
    console.error('GET /api/payments error:', error);
    return NextResponse.json(
      { error: 'Error obteniendo pagos', details: String(error) },
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

    if (!hasPermission(currentUser.permissions, 'payments.create')) {
      return NextResponse.json(
        { error: 'No tienes permiso para registrar pagos' },
        { status: 403 }
      );
    }

    const body = await req.json();

    const parsed = paymentSchema.safeParse({
      ...body,
      registeredById: currentUser.id,
    });

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Datos inválidos', details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const obligation = await prisma.userObligation.findUnique({
      where: { id: parsed.data.userObligationId },
      include: {
        user: {
          select: {
            fullName: true,
            email: true,
          },
        },
        obligation: {
          select: {
            title: true,
          },
        },
      },
    });

    if (!obligation) {
      return NextResponse.json(
        { error: 'Obligación del usuario no encontrada' },
        { status: 404 }
      );
    }

    const currentBalance = Number(obligation.balance);
    const amountPaid = Number(parsed.data.amountPaid);

    if (amountPaid <= 0) {
      return NextResponse.json(
        { error: 'El monto pagado debe ser mayor que cero' },
        { status: 400 }
      );
    }

    if (amountPaid > currentBalance) {
      return NextResponse.json(
        { error: 'El pago no puede ser mayor al saldo pendiente' },
        { status: 400 }
      );
    }

    const result = await prisma.$transaction(async (tx) => {
      const payment = await tx.payment.create({
        data: {
          userObligationId: parsed.data.userObligationId,
          amountPaid: parsed.data.amountPaid,
          paymentMethod: parsed.data.paymentMethod,
          registeredById: currentUser.id,
          notes: parsed.data.notes,
        },
      });

      const updatedUserObligation = await recalculateUserObligation(
        tx,
        parsed.data.userObligationId
      );

      const receiptUrl = `/api/payments/${payment.id}/receipt`;

      const updatedPayment = await tx.payment.update({
        where: { id: payment.id },
        data: { receiptUrl },
      });

      return {
        payment: updatedPayment,
        updatedUserObligation,
      };
    });

    try {
      await sendPaymentReceiptEmail({
        to: obligation.user.email,
        fullName: obligation.user.fullName,
        obligationTitle: obligation.obligation.title,
        amountPaid: Number(parsed.data.amountPaid),
        paymentMethod: parsed.data.paymentMethod,
        receiptUrl: result.payment.receiptUrl,
        paymentDate: new Date(result.payment.paymentDate),
        remainingBalance: Number(result.updatedUserObligation.balance),
        obligationStatus: result.updatedUserObligation.status as ObligationStatus,
      });
    } catch (mailError) {
      console.error('Error enviando correo de pago:', mailError);
    }

    return NextResponse.json(
      {
        message: 'Pago registrado correctamente',
        data: result,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('POST /api/payments error:', error);
    return NextResponse.json(
      { error: 'Error interno', details: String(error) },
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

    if (!hasPermission(currentUser.permissions, 'payments.update')) {
      return NextResponse.json(
        { error: 'No tienes permiso para editar pagos' },
        { status: 403 }
      );
    }

    const body = await req.json();
    const { id, amountPaid, paymentMethod, notes } = body as {
      id?: string;
      amountPaid?: number;
      paymentMethod?: string;
      notes?: string;
    };

    if (!id || typeof amountPaid !== 'number') {
      return NextResponse.json(
        { error: 'id y amountPaid son obligatorios' },
        { status: 400 }
      );
    }

    const existingPayment = await prisma.payment.findUnique({
      where: { id },
      include: {
        userObligation: true,
      },
    });

    if (!existingPayment) {
      return NextResponse.json(
        { error: 'Pago no encontrado' },
        { status: 404 }
      );
    }

    if (amountPaid <= 0) {
      return NextResponse.json(
        { error: 'El monto pagado debe ser mayor que cero' },
        { status: 400 }
      );
    }

    const allOtherPayments = await prisma.payment.findMany({
      where: {
        userObligationId: existingPayment.userObligationId,
        NOT: { id },
      },
      select: {
        amountPaid: true,
      },
    });

    const otherPaymentsTotal = allOtherPayments.reduce(
      (acc, payment) => acc + Number(payment.amountPaid),
      0
    );

    const assignedAmount = Number(existingPayment.userObligation.assignedAmount);

    if (otherPaymentsTotal + amountPaid > assignedAmount) {
      return NextResponse.json(
        {
          error: 'El total de pagos supera el monto asignado de la obligación',
        },
        { status: 400 }
      );
    }

    await prisma.$transaction(async (tx) => {
      await tx.payment.update({
        where: { id },
        data: {
          amountPaid,
          paymentMethod: paymentMethod ?? existingPayment.paymentMethod,
          notes: notes ?? '',
        },
      });

      await recalculateUserObligation(tx, existingPayment.userObligationId);
    });

    return NextResponse.json({
      message: 'Pago actualizado correctamente',
    });
  } catch (error) {
    console.error('PATCH /api/payments error:', error);
    return NextResponse.json(
      { error: 'Error actualizando pago', details: String(error) },
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

    if (!hasPermission(currentUser.permissions, 'payments.delete')) {
      return NextResponse.json(
        { error: 'No tienes permiso para eliminar pagos' },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        { error: 'El id del pago es obligatorio' },
        { status: 400 }
      );
    }

    const existingPayment = await prisma.payment.findUnique({
      where: { id },
    });

    if (!existingPayment) {
      return NextResponse.json(
        { error: 'Pago no encontrado' },
        { status: 404 }
      );
    }

    await prisma.$transaction(async (tx) => {
      await tx.payment.delete({
        where: { id },
      });

      await recalculateUserObligation(tx, existingPayment.userObligationId);
    });

    return NextResponse.json({
      message: 'Pago eliminado correctamente',
    });
  } catch (error) {
    console.error('DELETE /api/payments error:', error);
    return NextResponse.json(
      { error: 'Error eliminando pago', details: String(error) },
      { status: 500 }
    );
  }
}