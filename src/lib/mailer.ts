import nodemailer from 'nodemailer';

const smtpHost = process.env.SMTP_HOST;
const smtpPort = Number(process.env.SMTP_PORT ?? 587);
const smtpUser = process.env.SMTP_USER;
const smtpPass = process.env.SMTP_PASS;
const smtpFrom = process.env.SMTP_FROM;

function getTransporter() {
  if (!smtpHost || !smtpUser || !smtpPass || !smtpFrom) {
    throw new Error(
      'Faltan variables SMTP en .env: SMTP_HOST, SMTP_USER, SMTP_PASS, SMTP_FROM'
    );
  }

  return nodemailer.createTransport({
    host: smtpHost,
    port: smtpPort,
    secure: smtpPort === 465,
    auth: {
      user: smtpUser,
      pass: smtpPass,
    },
  });
}

type PaymentEmailParams = {
  to: string;
  fullName: string;
  obligationTitle: string;
  amountPaid: number;
  paymentMethod?: string | null;
  receiptUrl?: string | null;
  paymentDate: Date;
  remainingBalance: number;
  obligationStatus: 'PENDIENTE' | 'PARCIAL' | 'PAGADO';
};

function getFriendlyObligationStatus(
  status: 'PENDIENTE' | 'PARCIAL' | 'PAGADO'
) {
  switch (status) {
    case 'PAGADO':
      return 'Pagado completamente';
    case 'PARCIAL':
      return 'Pago parcial';
    default:
      return 'Pendiente';
  }
}

export async function sendPaymentReceiptEmail(params: PaymentEmailParams) {
  const transporter = getTransporter();

  const appBaseUrl = process.env.APP_BASE_URL ?? 'http://localhost:3000';
  const receiptLink = params.receiptUrl
    ? `${appBaseUrl}${params.receiptUrl}`
    : null;

  const formattedAmount = `Q ${params.amountPaid.toFixed(2)}`;
  const formattedBalance = `Q ${params.remainingBalance.toFixed(2)}`;
  const formattedDate = params.paymentDate.toLocaleString('es-GT');
  const friendlyStatus = getFriendlyObligationStatus(params.obligationStatus);

  const statusMessage =
    params.obligationStatus === 'PAGADO'
      ? `<p style="color:#166534;"><strong>Tu obligación ha sido pagada completamente.</strong></p>`
      : `<p style="color:#92400e;"><strong>Tu obligación aún tiene saldo pendiente.</strong></p>`;

  await transporter.sendMail({
    from: smtpFrom,
    to: params.to,
    subject: 'Recibo de pago - Sistema de Tesorería',
    html: `
      <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #111827;">
        <h2>Pago registrado correctamente</h2>

        <p>Hola <strong>${params.fullName}</strong>,</p>

        <p>Se ha registrado un pago en el sistema de tesorería.</p>

        <ul>
          <li><strong>Obligación:</strong> ${params.obligationTitle}</li>
          <li><strong>Monto pagado:</strong> ${formattedAmount}</li>
          <li><strong>Saldo restante:</strong> ${formattedBalance}</li>
          <li><strong>Estado actual:</strong> ${friendlyStatus}</li>
          <li><strong>Método de pago:</strong> ${params.paymentMethod ?? 'No especificado'}</li>
          <li><strong>Fecha:</strong> ${formattedDate}</li>
        </ul>

        ${statusMessage}

        ${
          receiptLink
            ? `<p>
                Puedes ver tu recibo aquí:<br />
                <a href="${receiptLink}" target="_blank" rel="noreferrer">${receiptLink}</a>
              </p>`
            : ''
        }

        <p>Saludos,<br />Sistema de Tesorería</p>
      </div>
    `,
  });
}

type ObligationAssignedEmailParams = {
  to: string;
  fullName: string;
  obligationTitle: string;
  description?: string | null;
  amount: number;
  dueDate: Date;
};

export async function sendObligationAssignedEmail(
  params: ObligationAssignedEmailParams
) {
  const transporter = getTransporter();

  const formattedAmount = `Q ${params.amount.toFixed(2)}`;
  const formattedDueDate = params.dueDate.toLocaleDateString('es-GT');

  await transporter.sendMail({
    from: smtpFrom,
    to: params.to,
    subject: 'Nueva obligación asignada - Sistema de Tesorería',
    html: `
      <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #111827;">
        <h2>Nueva obligación asignada</h2>

        <p>Hola <strong>${params.fullName}</strong>,</p>

        <p>Se te ha asignado una nueva obligación en el sistema de tesorería.</p>

        <ul>
          <li><strong>Obligación:</strong> ${params.obligationTitle}</li>
          <li><strong>Descripción:</strong> ${params.description ?? 'Sin descripción'}</li>
          <li><strong>Monto:</strong> ${formattedAmount}</li>
          <li><strong>Fecha límite:</strong> ${formattedDueDate}</li>
        </ul>

        <p>Por favor revisa tu panel de tesorería para más detalles.</p>

        <p>Saludos,<br />Sistema de Tesorería</p>
      </div>
    `,
  });
}

type ExcuseReviewedEmailParams = {
  to: string;
  fullName: string;
  activityTitle: string;
  activityDate: Date;
  reason: string;
  status: 'APROBADA' | 'RECHAZADA';
};

export async function sendExcuseReviewedEmail(
  params: ExcuseReviewedEmailParams
) {
  const transporter = getTransporter();

  const formattedDate = params.activityDate.toLocaleString('es-GT');

  const statusText =
    params.status === 'APROBADA' ? 'Aprobada' : 'Rechazada';

  const statusColor =
    params.status === 'APROBADA' ? '#166534' : '#991b1b';

  const statusMessage =
    params.status === 'APROBADA'
      ? 'Tu excusa fue aprobada por administración.'
      : 'Tu excusa fue rechazada por administración.';

  await transporter.sendMail({
    from: smtpFrom,
    to: params.to,
    subject: `Excusa ${statusText.toLowerCase()} - Sistema de Tesorería`,
    html: `
      <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #111827;">
        <h2>Actualización de excusa</h2>

        <p>Hola <strong>${params.fullName}</strong>,</p>

        <p style="color:${statusColor};"><strong>${statusMessage}</strong></p>

        <ul>
          <li><strong>Actividad:</strong> ${params.activityTitle}</li>
          <li><strong>Fecha de actividad:</strong> ${formattedDate}</li>
          <li><strong>Estado:</strong> ${statusText}</li>
          <li><strong>Justificación enviada:</strong> ${params.reason}</li>
        </ul>

        <p>Si tienes dudas, puedes comunicarte con la administración.</p>

        <p>Saludos,<br />Sistema de Tesorería</p>
      </div>
    `,
  });
}
type ActivityAssignedEmailParams = {
  to: string;
  fullName: string;
  activityTitle: string;
  description?: string | null;
  activityDate: Date;
  location?: string | null;
};

export async function sendActivityAssignedEmail(
  params: ActivityAssignedEmailParams
) {
  const transporter = getTransporter();

  const formattedDate = params.activityDate.toLocaleString('es-GT');

  await transporter.sendMail({
    from: smtpFrom,
    to: params.to,
    subject: 'Nueva actividad asignada - Sistema de Hermandad',
    html: `
      <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #111827;">
        <h2>Nueva actividad asignada</h2>

        <p>Hola <strong>${params.fullName}</strong>,</p>

        <p>Se te ha asignado una nueva actividad dentro del sistema de la hermandad.</p>

        <ul>
          <li><strong>Actividad:</strong> ${params.activityTitle}</li>
          <li><strong>Descripción:</strong> ${params.description ?? 'Sin descripción'}</li>
          <li><strong>Fecha y hora:</strong> ${formattedDate}</li>
          <li><strong>Ubicación:</strong> ${params.location ?? 'Sin ubicación definida'}</li>
        </ul>

        <p>Por favor revisa tu panel para más detalles.</p>

        <p>Saludos,<br />Sistema de Hermandad</p>
      </div>
    `,
  });
}
type AttendanceRegisteredEmailParams = {
  to: string;
  fullName: string;
  activityTitle: string;
  activityDate: Date;
  location?: string | null;
  status: 'PRESENTE' | 'AUSENTE' | 'EXCUSADO';
  notes?: string | null;
};

export async function sendAttendanceRegisteredEmail(
  params: AttendanceRegisteredEmailParams
) {
  const transporter = getTransporter();

  const formattedDate = params.activityDate.toLocaleString('es-GT');

  const friendlyStatus =
    params.status === 'PRESENTE'
      ? 'Asistió'
      : params.status === 'AUSENTE'
        ? 'No asistió'
        : 'Excusado';

  await transporter.sendMail({
    from: smtpFrom,
    to: params.to,
    subject: 'Registro de asistencia - Sistema de Hermandad',
    html: `
      <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #111827;">
        <h2>Registro de asistencia</h2>

        <p>Hola <strong>${params.fullName}</strong>,</p>

        <p>Se ha registrado tu asistencia para una actividad.</p>

        <ul>
          <li><strong>Actividad:</strong> ${params.activityTitle}</li>
          <li><strong>Fecha y hora:</strong> ${formattedDate}</li>
          <li><strong>Ubicación:</strong> ${params.location ?? 'Sin ubicación definida'}</li>
          <li><strong>Estado:</strong> ${friendlyStatus}</li>
          <li><strong>Notas:</strong> ${params.notes || 'Sin notas'}</li>
        </ul>

        <p>Saludos,<br />Sistema de Hermandad</p>
      </div>
    `,
  });
}