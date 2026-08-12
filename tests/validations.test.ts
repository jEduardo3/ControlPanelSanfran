import test from 'node:test';
import assert from 'node:assert/strict';
import { obligationSchema, paymentSchema, userSchema } from '../src/lib/validations';

test('rechaza montos no finitos y pagos negativos', () => {
  assert.equal(paymentSchema.safeParse({
    userObligationId: crypto.randomUUID(), amountPaid: Number.POSITIVE_INFINITY,
    registeredById: crypto.randomUUID(),
  }).success, false);
  assert.equal(paymentSchema.safeParse({
    userObligationId: crypto.randomUUID(), amountPaid: -1,
    registeredById: crypto.randomUUID(),
  }).success, false);
});

test('rechaza fechas inválidas en obligaciones', () => {
  assert.equal(obligationSchema.safeParse({
    title: 'Cuota mensual', amount: 25, dueDate: 'fecha-invalida',
    createdById: crypto.randomUUID(), userIds: [],
  }).success, false);
});

test('exige contraseñas y usuarios adecuados', () => {
  assert.equal(userSchema.safeParse({
    fullName: 'Prueba', username: 'usuario válido', email: 'a@example.com',
    password: '12345678', roleCode: 'COLABORADOR',
  }).success, false);
});
