import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { openDatabase } from '../src/db/connection.js';
import { createApp } from '../src/app.js';
import { currentPeriod } from '../src/db/seed-data.js';

let server;
let base;

before(async () => {
  const app = createApp(openDatabase(':memory:'));
  await new Promise((resolve) => {
    server = app.listen(0, resolve);
  });
  base = `http://localhost:${server.address().port}/api`;
});

after(() => server.close());

const getJson = async (path) => (await fetch(base + path)).json();
const post = (path, body) =>
  fetch(base + path, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });

test('GET /transactions returns seeded transactions, newest first', async () => {
  const txs = await getJson('/transactions');
  assert.equal(txs.length, 9);
  const dates = txs.map((t) => t.date);
  assert.deepEqual(dates, [...dates].sort().reverse());
});

test('GET /budgets/summary returns totals and budget statuses', async () => {
  const summary = await getJson('/budgets/summary');
  assert.equal(summary.period, currentPeriod());
  assert.equal(summary.totals.incomeCents, 72000);
  assert.equal(
    summary.totals.balanceCents,
    72000 - summary.totals.expenseCents,
  );
  const dining = summary.budgets.find((b) => b.categoryName === 'Dining Out');
  assert.equal(dining.spentCents, 8300);
  assert.equal(dining.status, 'warning'); // 83% of $100
});

test('POST /transactions creates an expense and updates the summary', async () => {
  const categories = await getJson('/categories');
  const dining = categories.find((c) => c.name === 'Dining Out');
  const today = new Date().toISOString().slice(0, 10);
  const period = today.slice(0, 7);

  const res = await post('/transactions', {
    amount: 25.5,
    type: 'EXPENSE',
    categoryId: dining.id,
    date: today,
    note: 'Late-night tacos',
  });
  assert.equal(res.status, 201);
  const created = await res.json();
  assert.equal(created.amountCents, 2550);
  assert.equal(created.categoryName, 'Dining Out');

  const summary = await getJson(`/budgets/summary?period=${period}`);
  const budget = summary.budgets.find((b) => b.categoryName === 'Dining Out');
  if (period === currentPeriod()) assert.equal(budget.status, 'over');
});

test('POST /transactions rejects invalid input with 400 and reasons', async () => {
  const res = await post('/transactions', {
    amount: -5,
    type: 'EXPENSE',
    categoryId: 9999,
    date: 'soon',
  });
  assert.equal(res.status, 400);
  const body = await res.json();
  assert.ok(body.details.length >= 3);
});

test('POST /transactions rejects a category of the wrong type', async () => {
  const categories = await getJson('/categories');
  const income = categories.find((c) => c.type === 'INCOME');
  const res = await post('/transactions', {
    amount: 10,
    type: 'EXPENSE',
    categoryId: income.id,
    date: '2026-10-01',
  });
  assert.equal(res.status, 400);
});

test('GET /budgets/summary rejects a malformed period', async () => {
  const res = await fetch(`${base}/budgets/summary?period=october`);
  assert.equal(res.status, 400);
});
