import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  amountError,
  typeError,
  dateError,
  categoryError,
  cleanNote,
  validateTransaction,
  MAX_NOTE_LENGTH,
} from '../src/domain/transaction.js';

const groceries = { id: 3, name: 'Groceries', type: 'EXPENSE' };
const findCategory = (id) => (id === 3 ? groceries : undefined);

test('amountError accepts positive amounts and rejects bad ones', () => {
  assert.equal(amountError(12.5), null);
  assert.equal(amountError(0), 'amount must be a positive number');
  assert.equal(amountError(-5), 'amount must be a positive number');
  assert.equal(amountError(NaN), 'amount must be a positive number');
  assert.equal(amountError(0.001), 'amount must be a positive number'); // rounds to 0 cents
  assert.equal(amountError(1_000_001), 'amount is too large');
});

test('typeError only allows INCOME or EXPENSE', () => {
  assert.equal(typeError('INCOME'), null);
  assert.equal(typeError('EXPENSE'), null);
  assert.equal(typeError('expense'), 'type must be INCOME or EXPENSE');
  assert.equal(typeError(undefined), 'type must be INCOME or EXPENSE');
});

test('dateError requires a real YYYY-MM-DD date', () => {
  assert.equal(dateError('2026-10-23'), null);
  assert.equal(dateError('10/23/2026'), 'date must be YYYY-MM-DD');
  assert.equal(dateError('2026-13-45'), 'date must be YYYY-MM-DD');
  assert.equal(dateError(undefined), 'date must be YYYY-MM-DD');
});

test('categoryError checks ownership and that the type matches', () => {
  assert.equal(categoryError(groceries, 'EXPENSE'), null);
  assert.equal(
    categoryError(undefined, 'EXPENSE'),
    'categoryId must be one of your categories',
  );
  assert.equal(
    categoryError(groceries, 'INCOME'),
    'category "Groceries" is not INCOME',
  );
});

test('cleanNote trims and caps the note length', () => {
  assert.equal(cleanNote('  coffee  '), 'coffee');
  assert.equal(cleanNote(undefined), '');
  assert.equal(cleanNote('x'.repeat(500)).length, MAX_NOTE_LENGTH);
});

test('validateTransaction returns cleaned values when everything is valid', () => {
  const { errors, transaction } = validateTransaction(
    {
      amount: '24.50',
      type: 'EXPENSE',
      categoryId: '3',
      date: '2026-10-23',
      note: ' tacos ',
    },
    findCategory,
  );
  assert.deepEqual(errors, []);
  assert.deepEqual(transaction, {
    categoryId: 3,
    type: 'EXPENSE',
    amountCents: 2450,
    date: '2026-10-23',
    note: 'tacos',
  });
});

test('validateTransaction reports every problem at once, in order', () => {
  const { errors } = validateTransaction(
    { amount: -5, type: 'EXPENSE', categoryId: 9999, date: 'soon' },
    findCategory,
  );
  assert.deepEqual(errors, [
    'amount must be a positive number',
    'date must be YYYY-MM-DD',
    'categoryId must be one of your categories',
  ]);
});
