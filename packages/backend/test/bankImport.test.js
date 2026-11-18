// Unit tests for turning Plaid transactions into LedgerLogic ones, and for the token encryption.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  expenseCategoryFor,
  OTHER_EXPENSE,
  OTHER_INCOME,
  toLedgerTransaction,
} from '../src/domain/bankImport.js';
import { createTokenBox } from '../src/services/plaidService.js';

const tx = (fields) => ({
  transaction_id: 'tx-1',
  amount: 12.34,
  date: '2026-11-02',
  name: 'CARD PURCHASE 1234',
  pending: false,
  ...fields,
});

test('a positive Plaid amount is an expense; a negative one is income', () => {
  assert.deepEqual(toLedgerTransaction(tx({ amount: 12.34 })), {
    plaidTransactionId: 'tx-1',
    type: 'EXPENSE',
    amountCents: 1234,
    date: '2026-11-02',
    note: 'CARD PURCHASE 1234',
    categoryName: OTHER_EXPENSE,
  });
  const income = toLedgerTransaction(tx({ amount: -500 }));
  assert.equal(income.type, 'INCOME');
  assert.equal(income.amountCents, 50000);
  assert.equal(income.categoryName, OTHER_INCOME);
});

test('pending and zero-amount transactions are skipped', () => {
  assert.equal(toLedgerTransaction(tx({ pending: true })), null);
  assert.equal(toLedgerTransaction(tx({ amount: 0 })), null);
});

test('the merchant name is preferred for the note, and long notes are cut to 200 characters', () => {
  assert.equal(toLedgerTransaction(tx({ merchant_name: 'Safeway' })).note, 'Safeway');
  assert.equal(toLedgerTransaction(tx({ name: 'x'.repeat(250) })).note.length, 200);
});

test('Plaid categories map to our expense categories, detailed before primary', () => {
  const pfc = (primary, detailed) => ({ personal_finance_category: { primary, detailed } });
  assert.equal(expenseCategoryFor(pfc('FOOD_AND_DRINK', 'FOOD_AND_DRINK_GROCERIES')), 'Groceries');
  assert.equal(expenseCategoryFor(pfc('FOOD_AND_DRINK', 'FOOD_AND_DRINK_RESTAURANT')), 'Dining Out');
  assert.equal(expenseCategoryFor(pfc('TRANSPORTATION', 'TRANSPORTATION_GAS')), 'Transportation');
  assert.equal(expenseCategoryFor(pfc('ENTERTAINMENT', 'ENTERTAINMENT_MUSIC')), 'Entertainment');
  assert.equal(expenseCategoryFor(pfc('GENERAL_MERCHANDISE', 'GENERAL_MERCHANDISE_BOOKSTORES_AND_NEWSSTANDS')), 'Textbooks & Supplies');
  assert.equal(expenseCategoryFor(pfc('RENT_AND_UTILITIES', 'RENT_AND_UTILITIES_RENT')), OTHER_EXPENSE);
  assert.equal(expenseCategoryFor({}), OTHER_EXPENSE);
});

test('the token box encrypts, decrypts, and refuses a different key or a tampered token', () => {
  const box = createTokenBox('key-one');
  const sealed = box.seal('access-sandbox-abc');
  assert.notEqual(sealed, box.seal('access-sandbox-abc')); // a fresh IV every time
  assert.ok(!sealed.includes('access-sandbox-abc'));
  assert.equal(box.open(sealed), 'access-sandbox-abc');
  assert.throws(() => createTokenBox('key-two').open(sealed));
  const [v, iv, tag, data] = sealed.split(':');
  const flipped = Buffer.from(data, 'base64');
  flipped[0] ^= 1;
  assert.throws(() => box.open([v, iv, tag, flipped.toString('base64')].join(':')));
});
