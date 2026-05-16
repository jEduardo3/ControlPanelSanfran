import { NextResponse } from 'next/server';
import { PDFDocument, StandardFonts, rgb } from 'pdf-lib';
import { prisma } from '../../../../../lib/prisma';
import { getCurrentUser } from '../../../../../lib/session';
import { hasPermission } from '../../../../../lib/permissions';

export const runtime = 'nodejs';

type Params = {
  params: {
    id: string;
  };
};

export async function GET(_: Request, { params }: Params) {
  try {
    const currentUser = await getCurrentUser();

    if (!currentUser) {
      return NextResponse.json(
        { error: 'No autenticado' },
        { status: 401 }
      );
    }

    const canViewAll = hasPermission(currentUser.permissions, 'payments.view');
    const canViewOwn = hasPermission(currentUser.permissions, 'payments.view.own');

    if (!canViewAll && !canViewOwn) {
      return NextResponse.json(
        { error: 'Sin permisos para ver recibos' },
        { status: 403 }
      );
    }

    const payment = await prisma.payment.findUnique({
      where: { id: params.id },
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
                title: true,
                description: true,
                amount: true,
                dueDate: true,
              },
            },
          },
        },
      },
    });

    if (!payment) {
      return NextResponse.json(
        { error: 'Pago no encontrado' },
        { status: 404 }
      );
    }

    if (canViewOwn && !canViewAll && payment.userObligation.user.id !== currentUser.id) {
      return NextResponse.json(
        { error: 'No autorizado para este recibo' },
        { status: 403 }
      );
    }

    const assignedAmount = Number(payment.userObligation.assignedAmount);
    const currentBalance = Number(payment.userObligation.balance);
    const amountPaid = Number(payment.amountPaid);
    const previousBalance = currentBalance + amountPaid;
    const paymentType = currentBalance === 0 ? 'Pago total' : 'Abono parcial';

    const pdfDoc = await PDFDocument.create();
    const page = pdfDoc.addPage([612, 792]);
    const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
    const bold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

    const { width, height } = page.getSize();

    page.drawRectangle({
      x: 30,
      y: height - 80,
      width: width - 60,
      height: 40,
      color: rgb(0.12, 0.2, 0.42),
    });

    page.drawText('RECIBO DE PAGO', {
      x: 220,
      y: height - 55,
      size: 18,
      font: bold,
      color: rgb(1, 1, 1),
    });

    let y = height - 120;

    function drawLine(label: string, value: string) {
      page.drawText(`${label}:`, {
        x: 50,
        y,
        size: 11,
        font: bold,
        color: rgb(0, 0, 0),
      });

      page.drawText(value, {
        x: 180,
        y,
        size: 11,
        font,
        color: rgb(0, 0, 0),
      });

      y -= 24;
    }

    const receiptNumber = `R-${new Date(payment.paymentDate).getFullYear()}-${payment.id.slice(0, 8).toUpperCase()}`;

    drawLine('Hermandad', 'Hermandad de Jesus Nazareno del Perdon');
    drawLine('Ubicacion', 'Antigua Guatemala');
    drawLine('Numero de recibo', receiptNumber);
    drawLine('Fecha de pago', new Date(payment.paymentDate).toLocaleString('es-GT'));
    drawLine('Tipo', paymentType);
    drawLine('Colaborador', payment.userObligation.user.fullName);
    drawLine('Correo', payment.userObligation.user.email);
    drawLine('Concepto', payment.userObligation.obligation.title);
    drawLine('Monto original', `Q ${assignedAmount.toFixed(2)}`);
    drawLine('Saldo anterior', `Q ${previousBalance.toFixed(2)}`);
    drawLine('Monto abonado', `Q ${amountPaid.toFixed(2)}`);
    drawLine('Saldo restante', `Q ${currentBalance.toFixed(2)}`);
    drawLine('Estado actual', payment.userObligation.status);
    drawLine('Metodo de pago', payment.paymentMethod ?? 'No especificado');
    drawLine('Registrado por', payment.registeredBy.fullName);
    drawLine('Fecha limite', new Date(payment.userObligation.obligation.dueDate).toLocaleDateString('es-GT'));

    if (payment.notes) {
      y -= 10;
      page.drawText('Observaciones:', {
        x: 50,
        y,
        size: 11,
        font: bold,
      });

      y -= 20;
      page.drawText(payment.notes, {
        x: 50,
        y,
        size: 11,
        font,
        maxWidth: 500,
        lineHeight: 14,
      });
      y -= 40;
    }

    y -= 10;
    page.drawLine({
      start: { x: 50, y },
      end: { x: 260, y },
      thickness: 1,
      color: rgb(0, 0, 0),
    });

    y -= 18;
    page.drawText('Recibo generado por el sistema de tesoreria', {
      x: 50,
      y,
      size: 10,
      font,
    });

    const pdfBytes = await pdfDoc.save();

    return new NextResponse(Buffer.from(pdfBytes), {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `inline; filename="recibo-${receiptNumber}.pdf"`,
      },
    });
  } catch (error) {
    console.error('GET /api/payments/[id]/receipt error:', error);
    return NextResponse.json(
      { error: 'Error generando recibo', details: String(error) },
      { status: 500 }
    );
  }
}