import test from 'node:test';
import assert from 'node:assert/strict';
import { hasAnyPermission, hasPermission } from '../src/lib/permissions';

test('hasPermission exige una coincidencia exacta', () => {
  assert.equal(hasPermission(['payments.view.own'], 'payments.view.own'), true);
  assert.equal(hasPermission(['payments.view.own'], 'payments.view'), false);
});

test('hasAnyPermission acepta al menos un permiso', () => {
  assert.equal(hasAnyPermission(['excuses.create'], ['excuses.view', 'excuses.create']), true);
  assert.equal(hasAnyPermission([], ['excuses.view']), false);
});
