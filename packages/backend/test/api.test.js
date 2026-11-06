import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { openDatabase } from '../src/db/connection.js';
import { createApp } from '../src/app.js';
import { DEMO_USER_EMAIL, DEMO_USER_PASSWORD } from '../src/db/seed-data.js';
import { currentPeriod } from '../src/domain/period.js';

let server;
let base;
let token;

before(async () => {
  const app = createApp(openDatabase(':memory:'), {
    tokenSecret: 'test-secret',
  });
  await new Promise((resolve) => {
    server = app.listen(0, resolve);
  });
  base = `http://localhost:${server.address().port}/api`;
  const res = await fetch(`${base}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: DEMO_USER_EMAIL,
      password: DEMO_USER_PASSWORD,
    }),
  });
  ({ token } = await res.json());
});

after(() => server.close());

const authed = (path, { headers, ...init } = {}) =>
  fetch(base + path, {
    ...init,
    headers: { ...headers, Authorization: `Bearer ${token}` },
  });
const getJson = async (path) => (await authed(path)).json();
const post = (path, body) =>
  authed(path, {
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
  const res = await authed('/budgets/summary?period=october');
  assert.equal(res.status, 400);
});

const put = (path, body) =>
  authed(path, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });

const categoryNamed = async (name) =>
  (await getJson('/categories')).find((c) => c.name === name);

test('GET /categories includes each category’s monthly limit', async () => {
  const dining = await categoryNamed('Dining Out');
  assert.equal(dining.limitCents, 10000);
  assert.ok(Number.isInteger(dining.budgetId));
  const textbooks = await categoryNamed('Textbooks & Supplies');
  assert.equal(textbooks.limitCents, null);
});

test('POST /budgets sets a limit and it shows in the summary', async () => {
  const textbooks = await categoryNamed('Textbooks & Supplies');
  const res = await post('/budgets', { categoryId: textbooks.id, limit: 150 });
  assert.equal(res.status, 201);
  const budget = await res.json();
  assert.equal(budget.limitCents, 15000);
  assert.equal(budget.period, currentPeriod());

  const summary = await getJson('/budgets/summary');
  const row = summary.budgets.find((b) => b.categoryId === textbooks.id);
  assert.equal(row.limitCents, 15000);
});

test('POST /budgets rejects a second budget for the same month (409)', async () => {
  const dining = await categoryNamed('Dining Out');
  const res = await post('/budgets', { categoryId: dining.id, limit: 50 });
  assert.equal(res.status, 409);
});

test('POST /budgets rejects bad input and income categories (400)', async () => {
  const income = (await getJson('/categories')).find(
    (c) => c.type === 'INCOME',
  );
  const res = await post('/budgets', {
    categoryId: income.id,
    limit: -1,
    period: '2026-13',
  });
  assert.equal(res.status, 400);
  const body = await res.json();
  assert.deepEqual(body.details, [
    `category "${income.name}" is not an expense category`,
    'limit must be a positive number',
    'period must be YYYY-MM',
  ]);
});

test('PUT /budgets/:id changes the limit and the status updates', async () => {
  const dining = await categoryNamed('Dining Out');
  const res = await put(`/budgets/${dining.budgetId}`, { limit: 500 });
  assert.equal(res.status, 200);
  assert.equal((await res.json()).limitCents, 50000);

  const summary = await getJson('/budgets/summary');
  const row = summary.budgets.find((b) => b.categoryId === dining.id);
  assert.equal(row.status, 'ok');
});

test('PUT /budgets/:id returns 404 for an unknown budget and 400 for a bad limit', async () => {
  assert.equal((await put('/budgets/99999', { limit: 10 })).status, 404);
  const dining = await categoryNamed('Dining Out');
  assert.equal(
    (await put(`/budgets/${dining.budgetId}`, { limit: 0 })).status,
    400,
  );
});

const del = (path) => authed(path, { method: 'DELETE' });

test('POST /categories creates an expense category (and rejects duplicates)', async () => {
  const res = await post('/categories', { name: '  Coffee  ' });
  assert.equal(res.status, 201);
  const coffee = await res.json();
  assert.equal(coffee.name, 'Coffee');
  assert.equal(coffee.type, 'EXPENSE');

  assert.equal((await post('/categories', { name: 'coffee' })).status, 409);
  const bad = await post('/categories', { name: '   ' });
  assert.equal(bad.status, 400);
  assert.deepEqual((await bad.json()).details, ['name is required']);
});

test('PUT /categories/:id renames a category', async () => {
  const coffee = await categoryNamed('Coffee');
  const res = await put(`/categories/${coffee.id}`, {
    name: 'Coffee & Snacks',
  });
  assert.equal(res.status, 200);
  assert.equal((await res.json()).name, 'Coffee & Snacks');
  assert.equal((await put('/categories/99999', { name: 'x' })).status, 404);
});

test('DELETE /categories/:id removes an unused category and its budget', async () => {
  const snacks = await categoryNamed('Coffee & Snacks');
  await post('/budgets', { categoryId: snacks.id, limit: 40 });
  assert.equal((await del(`/categories/${snacks.id}`)).status, 204);
  assert.equal(await categoryNamed('Coffee & Snacks'), undefined);
});

test('DELETE /categories/:id refuses a category that has transactions (409)', async () => {
  const groceries = await categoryNamed('Groceries');
  assert.equal((await del(`/categories/${groceries.id}`)).status, 409);
});

const transactionWithNote = async (note) =>
  (await getJson('/transactions?limit=200')).find((t) => t.note === note);

test('PUT /transactions/:id edits a transaction and the summary follows', async () => {
  const pizza = await transactionWithNote('Pizza with roommates');
  const groceries = await categoryNamed('Groceries');
  const before = await getJson(
    `/budgets/summary?period=${pizza.date.slice(0, 7)}`,
  );

  const res = await put(`/transactions/${pizza.id}`, {
    amount: 20,
    type: 'EXPENSE',
    categoryId: groceries.id,
    date: pizza.date,
    note: '  Pizza ingredients  ',
  });
  assert.equal(res.status, 200);
  const edited = await res.json();
  assert.equal(edited.id, pizza.id);
  assert.equal(edited.amountCents, 2000);
  assert.equal(edited.categoryName, 'Groceries');
  assert.equal(edited.note, 'Pizza ingredients');

  const after = await getJson(
    `/budgets/summary?period=${pizza.date.slice(0, 7)}`,
  );
  assert.equal(
    after.totals.expenseCents,
    before.totals.expenseCents - pizza.amountCents + 2000,
  );
});

test('PUT /transactions/:id rejects an invalid edit (400) and leaves it unchanged', async () => {
  const groceriesRun = await transactionWithNote('Weekly groceries');
  const res = await put(`/transactions/${groceriesRun.id}`, {
    amount: 0,
    type: 'EXPENSE',
    categoryId: groceriesRun.categoryId,
    date: 'tomorrow',
  });
  assert.equal(res.status, 400);
  assert.deepEqual((await res.json()).details, [
    'amount must be a positive number',
    'date must be YYYY-MM-DD',
  ]);
  assert.deepEqual(await transactionWithNote('Weekly groceries'), groceriesRun);
});

test('DELETE /transactions/:id deletes a transaction', async () => {
  const subscription = await transactionWithNote('Streaming subscription');
  const res = await del(`/transactions/${subscription.id}`);
  assert.equal(res.status, 204);
  assert.equal(await transactionWithNote('Streaming subscription'), undefined);
});

test('PUT and DELETE /transactions/:id return 404 for an unknown id', async () => {
  const groceries = await categoryNamed('Groceries');
  const valid = {
    amount: 5,
    type: 'EXPENSE',
    categoryId: groceries.id,
    date: '2026-10-01',
  };
  assert.equal((await put('/transactions/99999', valid)).status, 404);
  assert.equal((await del('/transactions/99999')).status, 404);
  assert.equal((await del('/transactions/not-a-number')).status, 404);
});

test('GET /transactions filters by category, date range, and both', async () => {
  const categories = await getJson('/categories');
  const groceries = categories.find((c) => c.name === 'Part-time Job');
  const all = await getJson('/transactions?limit=200');

  const byCategory = await getJson(`/transactions?categoryId=${groceries.id}`);
  assert.ok(byCategory.length > 0);
  assert.ok(byCategory.every((t) => t.categoryId === groceries.id));

  const day = all[all.length - 1].date;
  const byDate = await getJson(`/transactions?from=${day}&to=${day}`);
  assert.ok(byDate.length > 0);
  assert.ok(byDate.every((t) => t.date === day));
  assert.ok(
    (await getJson(`/transactions?from=2099-01-01`)).length === 0,
    'nothing is after 2099',
  );

  const both = await getJson(
    `/transactions?categoryId=${groceries.id}&from=${day}&to=${day}`,
  );
  assert.ok(both.every((t) => t.categoryId === groceries.id && t.date === day));

  // Blank filters mean no filter.
  const blank = await getJson('/transactions?limit=200&categoryId=&from=&to=');
  assert.equal(blank.length, all.length);
});

test('GET /transactions rejects a bad date, an unknown category, and a reversed range', async () => {
  for (const query of [
    'from=soon',
    'to=2026-13-99',
    'categoryId=99999',
    'from=2026-02-01&to=2026-01-01',
  ]) {
    const res = await authed(`/transactions?${query}`);
    assert.equal(res.status, 400, query);
  }
});

test('GET /reports/spending-by-category totals this month, largest first', async () => {
  const report = await getJson('/reports/spending-by-category');
  const summary = await getJson('/budgets/summary');
  assert.equal(report.period, currentPeriod());
  assert.equal(report.totalCents, summary.totals.expenseCents);
  const spent = report.categories.map((c) => c.spentCents);
  assert.deepEqual(
    spent,
    [...spent].sort((a, b) => b - a),
  );
  assert.equal(
    spent.reduce((sum, cents) => sum + cents, 0),
    report.totalCents,
  );
});

test('GET /reports/spending-by-category handles an empty month and a bad period', async () => {
  const report = await getJson('/reports/spending-by-category?period=2001-01');
  assert.deepEqual(report, { period: '2001-01', totalCents: 0, categories: [] });
  const res = await authed('/reports/spending-by-category?period=january');
  assert.equal(res.status, 400);
});
