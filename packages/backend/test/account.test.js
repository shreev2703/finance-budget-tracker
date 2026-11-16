// System tests for account management (#95, US-07): change password and delete account.
import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { createTestDb } from './helpers/testDb.js';
import { createApp } from '../src/app.js';
import { DEMO_USER_EMAIL, DEMO_USER_PASSWORD } from '../src/db/seed-data.js';

let db;
let server;
let base;

before(async () => {
  db = await createTestDb();
  const app = createApp(db, { tokenSecret: 'test-secret' });
  await new Promise((resolve) => {
    server = app.listen(0, resolve);
  });
  base = `http://localhost:${server.address().port}/api`;
});

after(async () => {
  await new Promise((resolve) => server.close(resolve));
  await db.end();
});

const send = (method, path, body, token) =>
  fetch(base + path, {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
  });

const signUp = async (email, password = 'first-password') =>
  (await (await send('POST', '/auth/register', { email, password, name: 'Student' })).json())
    .token;

const logIn = (email, password) => send('POST', '/auth/login', { email, password });

test('PUT /auth/password changes the password: the old one stops working, the new one works', async () => {
  const token = await signUp('change@student.edu');
  const res = await send(
    'PUT',
    '/auth/password',
    { currentPassword: 'first-password', newPassword: 'second-password' },
    token,
  );
  assert.equal(res.status, 204);
  assert.equal((await logIn('change@student.edu', 'first-password')).status, 401);
  assert.equal((await logIn('change@student.edu', 'second-password')).status, 200);
});

test('PUT /auth/password needs the right current password and a valid new one (400)', async () => {
  const token = await signUp('strict@student.edu');
  const wrong = await send(
    'PUT',
    '/auth/password',
    { currentPassword: 'not-it', newPassword: 'second-password' },
    token,
  );
  assert.equal(wrong.status, 400); // 400, not 401, so the website does not log the user out
  assert.equal((await wrong.json()).error, 'Current password is incorrect.');

  const short = await send(
    'PUT',
    '/auth/password',
    { currentPassword: 'first-password', newPassword: 'short' },
    token,
  );
  assert.equal(short.status, 400);
  assert.deepEqual((await short.json()).details, ['Password must be at least 8 characters.']);

  const same = await send(
    'PUT',
    '/auth/password',
    { currentPassword: 'first-password', newPassword: 'first-password' },
    token,
  );
  assert.equal(same.status, 400);

  // None of those changed anything.
  assert.equal((await logIn('strict@student.edu', 'first-password')).status, 200);
});

test('DELETE /auth/me removes the account and all its data, and the token stops working', async () => {
  const token = await signUp('leaving@student.edu');
  const [category] = await (await send('GET', '/categories', undefined, token)).json();
  await send(
    'POST',
    '/transactions',
    { amount: 4, type: category.type, categoryId: category.id, date: '2026-11-02' },
    token,
  );

  assert.equal((await send('DELETE', '/auth/me', { password: 'wrong' }, token)).status, 400);
  assert.equal((await send('GET', '/transactions', undefined, token)).status, 200);

  const res = await send('DELETE', '/auth/me', { password: 'first-password' }, token);
  assert.equal(res.status, 204);
  assert.equal((await send('GET', '/transactions', undefined, token)).status, 401);
  assert.equal((await logIn('leaving@student.edu', 'first-password')).status, 401);

  const { rows } = await db.query(
    `SELECT (SELECT COUNT(*) FROM users WHERE email = $1)
          + (SELECT COUNT(*) FROM categories c LEFT JOIN users u ON u.id = c.user_id WHERE u.id IS NULL)
          + (SELECT COUNT(*) FROM transactions t LEFT JOIN users u ON u.id = t.user_id WHERE u.id IS NULL) AS n`,
    ['leaving@student.edu'],
  );
  assert.equal(Number(rows[0].n), 0, 'no user, and no categories or transactions left behind');
});

test('deleting one account leaves other accounts alone', async () => {
  const token = await signUp('solo@student.edu');
  await send('DELETE', '/auth/me', { password: 'first-password' }, token);
  assert.equal((await logIn(DEMO_USER_EMAIL, DEMO_USER_PASSWORD)).status, 200);
});

test('both account routes need a token (401)', async () => {
  assert.equal((await send('PUT', '/auth/password', {})).status, 401);
  assert.equal((await send('DELETE', '/auth/me', {})).status, 401);
});
