import { z } from 'zod';
import { parseGuatemalaDateTime } from './date-time';

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
});

export const userSchema = z.object({
  fullName: z.string().trim().min(1, 'El nombre es obligatorio').max(120),
  username: z.string().trim().min(3, 'El usuario debe tener al menos 3 caracteres').max(50).regex(/^[a-zA-Z0-9_.-]+$/, 'El usuario contiene caracteres inválidos'),
  email: z.string().email('Correo inválido'),
  password: z.string().min(8, 'La contraseña debe tener al menos 8 caracteres').max(128),
  roleCode: z.enum([
    'SUPERADMIN',
    'ADMIN_GENERAL',
    'JUNTA',
    'TESORERIA',
    'SECRETARIA',
    'COLABORADOR',
  ]),
});

export const activitySchema = z.object({
  title: z.string().trim().min(3).max(150),
  description: z.string().trim().max(2000).optional(),
  activityDate: z.string().refine((value) => {
    try { parseGuatemalaDateTime(value); return true; } catch { return false; }
  }, 'Fecha inválida'),
  location: z.string().trim().max(250).optional(),
  createdById: z.string().uuid(),
});

export const attendanceSchema = z.object({
  activityId: z.string().uuid(),
  userId: z.string().uuid(),
  status: z.enum(['PRESENTE', 'AUSENTE', 'EXCUSADO']),
  registeredById: z.string().uuid(),
  notes: z.string().trim().max(1000).optional(),
});

export const obligationSchema = z.object({
  title: z.string().trim().min(3).max(150),
  description: z.string().trim().max(2000).optional(),
  amount: z.number().finite().positive().max(99999999.99),
  dueDate: z.string().refine((value) => !Number.isNaN(Date.parse(value)), 'Fecha inválida'),
  createdById: z.string().uuid(),
  userIds: z.array(z.string().uuid()).default([]),
});

export const paymentSchema = z.object({
  userObligationId: z.string().uuid(),
  amountPaid: z.number().finite().positive().max(99999999.99),
  paymentMethod: z.string().trim().max(100).optional(),
  registeredById: z.string().uuid(),
  notes: z.string().trim().max(1000).optional(),
});

export const excuseSchema = z.object({
  activityId: z.string().uuid(),
  userId: z.string().uuid(),
  reason: z.string().trim().min(5).max(2000),
});
