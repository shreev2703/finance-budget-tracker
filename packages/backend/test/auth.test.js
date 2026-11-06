import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import jwt from 'jsonwebtoken';
import { openDatabase } from '../src/db/connection.js';
import { createApp } from '../src/app.js';
import {
  DEMO_USER_EMAIL,
  DEMO_USER_PASSWORD,
  refreshDemoMonth,
} from '../src/db/seed-data.js';
import { currentPeriod } from '../src/domain/period.js';

const SECRET = 'test-secret';
let db;
let server;
let base;

before(async () => {
  db = openDatabase(':memory:');
  const app = createApp(db, { tokenSecret: SECRET });
  await new Promise((resolve) => {
    server = app.listen(0, resolve);
  });
  base = `http://localhost:${server.address().port}/api`;
});

after(() => server.close());

const send = (method, path, body, token) =>
  fetch(base + path, {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
  });

const register = (email, password = 'correct-horse', name = 'Test Student') =>
  send('POST', '/auth/register', { email, password, name });

const login = (email, password) =>
  send('POST', '/auth/login', { email, password });

const demoToken = async () =>
  (await (await login(DEMO_USER_EMAIL, DEMO_USER_PASSWORD)).json()).token;

test('register creates a user and returns a working token (201)', async () => {
  const res = await register('new@student.edu');
  assert.equal(res.status, 201);
  const { token, user } = await res.json();
  assert.equal(user.email, 'new@student.edu');
  assert.equal(user.name, 'Test Student');
  assert.ok(!('passwordHash' in user));

  const me = await send('GET', '/auth/me', undefined, token);
  assert.equal(me.status, 200);
  assert.equal((await me.json()).email, 'new@student.edu');
});

test('register stores a bcrypt hash, never the password', async () => {
  await register('hash@student.edu', 'plain-text-pass');
  const { password_hash: hash } = db
    .prepare('SELECT password_hash FROM users WHERE email = ?')
    .get('hash@student.edu');
  assert.match(hash, /^\$2[aby]\$10\$/);
  assert.ok(!hash.includes('plain-text-pass'));
});

test('register gives a new account its starting categories and no data', async () => {
  const { token } = await (await register('fresh@student.edu')).json();
  const categories = await (
    await send('GET', '/categories', undefined, token)
  ).json();
  assert.equal(categories.length, 7);
  assert.ok(categories.some((c) => c.type === 'INCOME'));
  const transactions = await (
    await send('GET', '/transactions', undefined, token)
  ).json();
  assert.deepEqual(transactions, []);
});

test('register rejects bad input with 400 and reasons', async () => {
  const res = await send('POST', '/auth/register', {
    email: 'not-an-email',
    password: 'short',
    name: ' ',
  });
  assert.equal(res.status, 400);
  assert.equal((await res.json()).details.length, 3);

  const tooLong = await register('long@student.edu', 'x'.repeat(73));
  assert.equal(tooLong.status, 400);
  assert.equal((await send('POST', '/auth/register')).status, 400);
});

test('register rejects an email already in use, ignoring case (409)', async () => {
  await register('taken@student.edu');
  const res = await register('Taken@Student.edu');
  assert.equal(res.status, 409);
});

test('login returns a token for the right password (200)', async () => {
  await register('login@student.edu', 'right-password');
  const res = await login('LOGIN@student.edu', 'right-password');
  assert.equal(res.status, 200);
  const { token, user } = await res.json();
  assert.equal(user.email, 'login@student.edu');
  assert.equal(
    (await send('GET', '/transactions', undefined, token)).status,
    200,
  );
});

test('login gives the same 401 for a wrong password and an unknown email', async () => {
  await register('wrong@student.edu', 'right-password');
  const wrong = await login('wrong@student.edu', 'wrong-password');
  const unknown = await login('nobody@student.edu', 'wrong-password');
  assert.equal(wrong.status, 401);
  assert.equal(unknown.status, 401);
  assert.deepEqual(await wrong.json(), await unknown.json());
  assert.equal((await send('POST', '/auth/login')).status, 401);
});

test('the seeded demo user can log in', async () => {
  assert.ok(await demoToken());
});

test('every data route returns 401 without a token', async () => {
  const routes = [
    ['GET', '/auth/me'],
    ['GET', '/transactions'],
    ['POST', '/transactions'],
    ['PUT', '/transactions/1'],
    ['DELETE', '/transactions/1'],
    ['GET', '/budgets/summary'],
    ['POST', '/budgets'],
    ['PUT', '/budgets/1'],
    ['GET', '/categories'],
    ['POST', '/categories'],
    ['PUT', '/categories/1'],
    ['DELETE', '/categories/1'],
  ];
  for (const [method, path] of routes) {
    const res = await send(method, path);
    assert.equal(res.status, 401, `${method} ${path}`);
    assert.equal(res.headers.get('www-authenticate'), 'Bearer');
  }
});

test('health stays public', async () => {
  assert.equal((await send('GET', '/health')).status, 200);
});

test('bad tokens get 401: garbage, wrong secret, expired, unknown user, wrong scheme', async () => {
  const { id } = db
    .prepare('SELECT id FROM users WHERE email = ?')
    .get(DEMO_USER_EMAIL);
  const sub = String(id);
  const bad = [
    'garbage',
    jwt.sign({ sub }, 'some-other-secret'),
    jwt.sign({ sub }, SECRET, { expiresIn: -10 }),
    jwt.sign({ sub: '999999' }, SECRET),
    jwt.sign({ sub }, '', { algorithm: 'none' }),
  ];
  for (const token of bad) {
    const res = await send('GET', '/transactions', undefined, token);
    assert.equal(res.status, 401, token);
  }
  const res = await fetch(`${base}/transactions`, {
    headers: { Authorization: `Basic ${await demoToken()}` },
  });
  assert.equal(res.status, 401);
});

test('a user cannot see or change another user’s data', async () => {
  const demo = await demoToken();
  const other = (await (await register('other@student.edu')).json()).token;

  const demoTx = (
    await (await send('GET', '/transactions', undefined, demo)).json()
  )[0];
  const demoCategories = await (
    await send('GET', '/categories', undefined, demo)
  ).json();
  const groceries = demoCategories.find((c) => c.name === 'Groceries');

  const seen = await (
    await send('GET', '/transactions', undefined, other)
  ).json();
  assert.deepEqual(seen, []);
  const summary = await (
    await send('GET', '/budgets/summary', undefined, other)
  ).json();
  assert.equal(summary.period, currentPeriod());
  assert.equal(summary.totals.incomeCents, 0);
  assert.deepEqual(summary.budgets, []);

  const ownCategories = await (
    await send('GET', '/categories', undefined, other)
  ).json();
  const edit = {
    amount: 1,
    type: demoTx.type,
    categoryId: demoTx.categoryId,
    date: demoTx.date,
  };
  const attempts = [
    [
      'PUT',
      `/transactions/${demoTx.id}`,
      {
        ...edit,
        categoryId: ownCategories.find((c) => c.type === demoTx.type).id,
      },
    ],
    ['DELETE', `/transactions/${demoTx.id}`],
    ['PUT', `/categories/${groceries.id}`, { name: 'Hacked' }],
    ['DELETE', `/categories/${groceries.id}`],
    ['PUT', `/budgets/${groceries.budgetId}`, { limit: 1 }],
  ];
  for (const [method, path, body] of attempts) {
    const res = await send(method, path, body, other);
    assert.equal(res.status, 404, `${method} ${path}`);
  }

  const posted = await send('POST', '/transactions', edit, other);
  assert.equal(posted.status, 400); // the demo user's category isn't theirs

  const after = await (
    await send('GET', '/transactions', undefined, demo)
  ).json();
  assert.deepEqual(after[0], demoTx);
});

test('reports and filters only include the logged-in user', async () => {
  const demo = await demoToken();
  const other = (await (await register('reports@student.edu')).json()).token;
  const demoCategories = await (
    await send('GET', '/categories', undefined, demo)
  ).json();

  const report = await (
    await send('GET', '/reports/spending-by-category', undefined, other)
  ).json();
  assert.equal(report.totalCents, 0);
  assert.deepEqual(report.categories, []);

  const res = await send(
    'GET',
    `/transactions?categoryId=${demoCategories[0].id}`,
    undefined,
    other,
  );
  assert.equal(res.status, 400);

  const anonymous = await send('GET', '/reports/spending-by-category');
  assert.equal(anonymous.status, 401);
});

test('the demo account gets fresh data when a new month starts', () => {
  const fresh = openDatabase(':memory:');
  const count = () =>
    fresh
      .prepare(
        'SELECT (SELECT COUNT(*) FROM budgets) + (SELECT COUNT(*) FROM transactions) AS n',
      )
      .get().n;
  const seeded = count();
  refreshDemoMonth(fresh);
  assert.equal(count(), seeded); // this month already has data, so nothing is added

  fresh.exec(
    "UPDATE budgets SET period = '2020-01'; UPDATE transactions SET date = '2020-01-15'",
  );
  refreshDemoMonth(fresh);
  assert.equal(count(), seeded * 2);
  fresh.close();
});
