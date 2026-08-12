import test from 'node:test';
import assert from 'node:assert/strict';
import { parseGuatemalaDateTime, toGuatemalaDateTimeLocalValue } from '../src/lib/date-time';

test('interpreta datetime-local como hora de Guatemala', () => {
  const date = parseGuatemalaDateTime('2026-08-20T19:30');
  assert.equal(date.toISOString(), '2026-08-21T01:30:00.000Z');
});

test('conserva el instante al editarlo en hora de Guatemala', () => {
  assert.equal(
    toGuatemalaDateTimeLocalValue('2026-08-21T01:30:00.000Z'),
    '2026-08-20T19:30'
  );
});

test('respeta fechas que ya incluyen zona horaria', () => {
  assert.equal(
    parseGuatemalaDateTime('2026-08-20T19:30:00-06:00').toISOString(),
    '2026-08-21T01:30:00.000Z'
  );
});
