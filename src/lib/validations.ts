import { z } from 'zod';

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
});

export const userSchema = z.object({
  fullName: z.string().min(1, 'El nombre es obligatorio'),
  username: z.string().min(3, 'El usuario debe tener al menos 3 caracteres'),
  email: z.string().email('Correo inválido'),
  password: z.string().min(6, 'La contraseña debe tener al menos 6 caracteres'),
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
  title: z.string().min(3),
  description: z.string().optional(),
  activityDate: z.string(),
  location: z.string().optional(),
  createdById: z.string().uuid(),
});

export const attendanceSchema = z.object({
  activityId: z.string().uuid(),
  userId: z.string().uuid(),
  status: z.enum(['PRESENTE', 'AUSENTE', 'EXCUSADO']),
  registeredById: z.string().uuid(),
  notes: z.string().optional(),
});

export const obligationSchema = z.object({
  title: z.string().min(3),
  description: z.string().optional(),
  amount: z.number().positive(),
  dueDate: z.string(),
  createdById: z.string().uuid(),
  userIds: z.array(z.string().uuid()).default([]),
});

export const paymentSchema = z.object({
  userObligationId: z.string().uuid(),
  amountPaid: z.number().positive(),
  paymentMethod: z.string().optional(),
  registeredById: z.string().uuid(),
  notes: z.string().optional(),
});

export const excuseSchema = z.object({
  activityId: z.string().uuid(),
  userId: z.string().uuid(),
  reason: z.string().min(5),
});