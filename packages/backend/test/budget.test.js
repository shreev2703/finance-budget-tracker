// Unit tests for the budget rules in src/domain/budget.js (US-08, US-09). No database.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  budgetCategoryError,
  budgetStatus,
  isOverLimit,
  limitError,
  limitToCents,
  MAX_LIMIT_DOLLARS,
  periodError,
  remaining,
} from '../src/domain/budget.js';

const LIMIT = 10000; // $100.00

test('budgetStatus is ok below 80% of the limit', () => {
  assert.equal(budgetStatus(LIMIT, 0), 'ok');
  assert.equal(budgetStatus(LIMIT, 7999), 'ok'); // 79.99%
});

test('budgetStatus warns from exactly 80% up to and including 100% (US-09)', () => {
  assert.equal(budgetStatus(LIMIT, 8000), 'warning'); // exactly 80%
  assert.equal(budgetStatus(LIMIT, 9999), 'warning');
  assert.equal(budgetStatus(LIMIT, 10000), 'warning'); // spent the limit exactly: not over yet
});

test('budgetStatus is over once spending passes the limit by even a cent', () => {
  assert.equal(budgetStatus(LIMIT, 10001), 'over');
  assert.equal(isOverLimit(LIMIT, 10001), true);
  assert.equal(isOverLimit(LIMIT, 10000), false);
});

test('remaining goes negative when over budget', () => {
  assert.equal(remaining(LIMIT, 2500), 7500);
  assert.equal(remaining(LIMIT, 18500), -8500);
});

test('limitError accepts positive dollar limits up to the maximum', () => {
  assert.equal(limitError(0.01), null);
  assert.equal(limitError(250), null);
  assert.equal(limitError(MAX_LIMIT_DOLLARS), null);
  assert.equal(limitToCents(19.99), 1999); // no floating-point drift
});

test('limitError rejects zero, negative, non-numbers, sub-cent, and too large', () => {
  for (const bad of [0, -5, NaN, Infinity, 0.004]) {
    assert.equal(limitError(bad), 'limit must be a positive number', String(bad));
  }
  assert.equal(limitError(MAX_LIMIT_DOLLARS + 1), 'limit is too large');
});

test('periodError only accepts YYYY-MM with a real month', () => {
  assert.equal(periodError('2026-11'), null);
  for (const bad of ['2026-13', '2026-00', '2026-1', '11-2026', 202611, undefined]) {
    assert.equal(periodError(bad), 'period must be YYYY-MM', String(bad));
  }
});

test('budgetCategoryError only allows the user’s own expense categories (US-08)', () => {
  assert.equal(budgetCategoryError({ name: 'Groceries', type: 'EXPENSE' }), null);
  assert.equal(
    budgetCategoryError({ name: 'Allowance', type: 'INCOME' }),
    'category "Allowance" is not an expense category',
  );
  assert.equal(
    budgetCategoryError(undefined),
    'categoryId must be one of your categories',
  );
});
