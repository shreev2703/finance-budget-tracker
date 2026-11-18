// System tests for bank connections (#94). A fake Plaid client stands in for the real
// one, so these never call Plaid; the routes, service, encryption, and Postgres are real.
import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { createTestDb } from './helpers/testDb.js';
import { createApp } from '../src/app.js';
import { currentPeriod } from '../src/domain/period.js';

const ACCESS_TOKEN = 'access-sandbox-very-secret-token';
const day = (d) => `${currentPeriod()}-0${d}`;

const PAGE_1 = [
  { transaction_id: 'tx-groceries', amount: 42.1, date: day(2), merchant_name: 'Safeway', pending: false, personal_finance_category: { primary: 'FOOD_AND_DRINK', detailed: 'FOOD_AND_DRINK_GROCERIES' } },
  { transaction_id: 'tx-coffee', amount: 4.5, date: day(2), merchant_name: 'Campus Coffee', pending: false, personal_finance_category: { primary: 'FOOD_AND_DRINK', detailed: 'FOOD_AND_DRINK_COFFEE' } },
  { transaction_id: 'tx-pending', amount: 60, date: day(3), name: 'Pending charge', pending: true, personal_finance_category: { primary: 'GENERAL_MERCHANDISE' } },
];
const PAGE_2 = [
  { transaction_id: 'tx-uber', amount: 15, date: day(3), merchant_name: 'Uber', pending: false, personal_finance_category: { primary: 'TRANSPORTATION', detailed: 'TRANSPORTATION_TAXIS_AND_RIDE_SHARES' } },
  { transaction_id: 'tx-paycheck', amount: -500, date: day(1), name: 'Campus Payroll', pending: false, personal_finance_category: { primary: 'INCOME', detailed: 'INCOME_WAGES' } },
  { transaction_id: 'tx-online', amount: 9.99, date: day(4), merchant_name: 'Online Store', pending: false, personal_finance_category: { primary: 'GENERAL_MERCHANDISE', detailed: 'GENERAL_MERCHANDISE_ONLINE_MARKETPLACES' } },
];

/** Behaves like Plaid's sandbox: two pages of transactions, then nothing new. */
function fakePlaid() {
  const calls = [];
  return {
    calls,
    async createLinkToken(userId) {
      calls.push(['link', userId]);
      return `link-sandbox-${userId}`;
    },
    async exchangePublicToken(publicToken) {
      calls.push(['exchange', publicToken]);
      if (publicToken === 'bad-token') {
        throw Object.assign(new Error('invalid'), { body: { error_code: 'INVALID_PUBLIC_TOKEN', access_token: ACCESS_TOKEN } });
      }
      return { accessToken: ACCESS_TOKEN, itemId: 'item-1' };
    },
    async syncTransactions(accessToken, cursor) {
      calls.push(['sync', accessToken, cursor]);
      if (!cursor) return { added: PAGE_1, nextCursor: 'c1', hasMore: true };
      if (cursor === 'c1') return { added: PAGE_2, nextCursor: 'c2', hasMore: false };
      return { added: [], nextCursor: cursor, hasMore: false };
    },
  };
}

let db;
let plaid;
const servers = [];

async function start(options) {
  const app = createApp(db, { tokenSecret: 'test-secret', ...options });
  const server = await new Promise((resolve) => {
    const s = app.listen(0, () => resolve(s));
  });
  servers.push(server);
  const base = `http://localhost:${server.address().port}/api`;
  const send = (method, path, body, token) =>
    fetch(base + path, {
      method,
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: body ? JSON.stringify(body) : undefined,
    });
  const signUp = async (email) =>
    (await (await send('POST', '/auth/register', { email, password: 'correct-horse', name: 'Student' })).json()).token;
  return { send, signUp };
}

let withPlaid;
let withoutPlaid;

before(async () => {
  db = await createTestDb();
  plaid = fakePlaid();
  withPlaid = await start({ plaid });
  withoutPlaid = await start({});
});

after(async () => {
  await Promise.all(servers.map((s) => new Promise((resolve) => s.close(resolve))));
  await db.end();
});

test('without Plaid keys, bank connections report disabled and the other routes are 404', async () => {
  const { send, signUp } = withoutPlaid;
  const token = await signUp('noplaid@student.edu');
  assert.deepEqual(await (await send('GET', '/plaid/status', undefined, token)).json(), {
    enabled: false,
    connected: false,
  });
  for (const path of ['/plaid/link-token', '/plaid/connect', '/plaid/sync']) {
    assert.equal((await send('POST', path, {}, token)).status, 404, path);
  }
});

test('bank routes need a login (401)', async () => {
  const { send } = withPlaid;
  for (const [method, path] of [['GET', '/plaid/status'], ['POST', '/plaid/link-token'], ['POST', '/plaid/connect'], ['POST', '/plaid/sync']]) {
    assert.equal((await send(method, path)).status, 401, path);
  }
});

test('connecting a bank stores the access token encrypted, never in plain text', async () => {
  const { send, signUp } = withPlaid;
  const token = await signUp('connect@student.edu');
  assert.equal((await (await send('GET', '/plaid/status', undefined, token)).json()).connected, false);

  const link = await (await send('POST', '/plaid/link-token', {}, token)).json();
  assert.match(link.linkToken, /^link-sandbox-\d+$/);

  const res = await send('POST', '/plaid/connect', { publicToken: 'public-sandbox-ok' }, token);
  assert.equal(res.status, 200);
  assert.equal((await (await send('GET', '/plaid/status', undefined, token)).json()).connected, true);

  const { rows } = await db.query('SELECT access_token_enc FROM bank_connections');
  assert.ok(rows.length >= 1);
  for (const { access_token_enc: stored } of rows) {
    assert.ok(!stored.includes(ACCESS_TOKEN), 'the access token must not be stored as plain text');
    assert.match(stored, /^v1:/);
  }
});

test('sync imports posted transactions into the right categories and skips pending ones', async () => {
  const { send, signUp } = withPlaid;
  const token = await signUp('sync@student.edu');
  await send('POST', '/plaid/connect', { publicToken: 'public-sandbox-ok' }, token);

  const res = await send('POST', '/plaid/sync', {}, token);
  assert.equal(res.status, 200);
  assert.deepEqual(await res.json(), { imported: 5, skipped: 1 });

  const imported = await (await send('GET', '/transactions', undefined, token)).json();
  const byNote = Object.fromEntries(imported.map((t) => [t.note, t]));
  assert.equal(byNote.Safeway.categoryName, 'Groceries');
  assert.equal(byNote.Safeway.amountCents, 4210);
  assert.equal(byNote['Campus Coffee'].categoryName, 'Dining Out');
  assert.equal(byNote.Uber.categoryName, 'Transportation');
  assert.equal(byNote['Online Store'].categoryName, 'Other');
  assert.equal(byNote['Campus Payroll'].type, 'INCOME');
  assert.equal(byNote['Campus Payroll'].categoryName, 'Other income');
  assert.equal(byNote['Pending charge'], undefined);

  const summary = await (await send('GET', '/budgets/summary', undefined, token)).json();
  assert.equal(summary.totals.incomeCents, 50000);
  assert.equal(summary.totals.expenseCents, 4210 + 450 + 1500 + 999);
});

test('importing again never adds duplicates, even if the bank sends the same transactions', async () => {
  const { send, signUp } = withPlaid;
  const token = await signUp('again@student.edu');
  await send('POST', '/plaid/connect', { publicToken: 'public-sandbox-ok' }, token);
  await send('POST', '/plaid/sync', {}, token);

  // The saved cursor means Plaid has nothing new.
  assert.deepEqual(await (await send('POST', '/plaid/sync', {}, token)).json(), { imported: 0, skipped: 0 });

  // Reconnecting restarts the sync from the beginning; the same 5 are skipped, not added again.
  await send('POST', '/plaid/connect', { publicToken: 'public-sandbox-ok' }, token);
  assert.deepEqual(await (await send('POST', '/plaid/sync', {}, token)).json(), { imported: 0, skipped: 6 });
  assert.equal((await (await send('GET', '/transactions', undefined, token)).json()).length, 5);
});

test('sync before connecting is a 404, and a failed Plaid call is a plain 502 that leaks nothing', async () => {
  const { send, signUp } = withPlaid;
  const token = await signUp('errors@student.edu');
  assert.equal((await send('POST', '/plaid/sync', {}, token)).status, 404);
  assert.equal((await send('POST', '/plaid/connect', {}, token)).status, 400);

  const res = await send('POST', '/plaid/connect', { publicToken: 'bad-token' }, token);
  assert.equal(res.status, 502);
  const text = await res.text();
  assert.ok(!text.includes(ACCESS_TOKEN));
  assert.ok(!text.includes('INVALID_PUBLIC_TOKEN'));
  assert.equal((await (await send('GET', '/plaid/status', undefined, token)).json()).connected, false);
});

test('one user’s bank connection and imports stay invisible to everyone else', async () => {
  const { send, signUp } = withPlaid;
  const owner = await signUp('owner@student.edu');
  await send('POST', '/plaid/connect', { publicToken: 'public-sandbox-ok' }, owner);
  await send('POST', '/plaid/sync', {}, owner);

  const other = await signUp('neighbor@student.edu');
  assert.equal((await (await send('GET', '/plaid/status', undefined, other)).json()).connected, false);
  assert.equal((await send('POST', '/plaid/sync', {}, other)).status, 404);
  assert.deepEqual(await (await send('GET', '/transactions', undefined, other)).json(), []);
});
