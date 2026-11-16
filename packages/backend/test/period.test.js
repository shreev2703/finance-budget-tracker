// Unit tests for src/domain/period.js. Fixed dates, so they never depend on today.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { currentPeriod } from '../src/domain/period.js';

test('currentPeriod formats a date as YYYY-MM with a zero-padded month', () => {
  assert.equal(currentPeriod(new Date(2026, 0, 15)), '2026-01');
  assert.equal(currentPeriod(new Date(2026, 10, 16)), '2026-11');
});

test('currentPeriod changes exactly at midnight when the month and year roll over', () => {
  assert.equal(currentPeriod(new Date(2026, 11, 31, 23, 59, 59)), '2026-12');
  assert.equal(currentPeriod(new Date(2027, 0, 1, 0, 0, 0)), '2027-01');
});

test('currentPeriod defaults to the current month', () => {
  const now = new Date();
  const expected = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  assert.equal(currentPeriod(), expected);
});
