import bcrypt from 'bcrypt';
import { DEFAULT_CATEGORIES } from '../domain/category.js';
import { currentPeriod } from '../domain/period.js';
import { BCRYPT_ROUNDS } from '../domain/user.js';

export const DEMO_USER_EMAIL = 'demo@ledgerlogic.app';
export const DEMO_USER_PASSWORD = 'demo-password';

export const hashDemoPassword = () =>
  bcrypt.hashSync(DEMO_USER_PASSWORD, BCRYPT_ROUNDS);

const DEMO_BUDGETS = [
  ['Groceries', 20000],
  ['Dining Out', 10000],
  ['Transportation', 6000],
  ['Entertainment', 5000],
];

// [category, type, cents, day of the month, note]
const DEMO_TRANSACTIONS = [
  ['Allowance', 'INCOME', 40000, 1, 'Monthly allowance'],
  ['Part-time Job', 'INCOME', 32000, 1, 'Campus library paycheck'],
  ['Groceries', 'EXPENSE', 4275, 2, "Trader Joe's"],
  ['Transportation', 'EXPENSE', 2500, 2, 'Bus pass top-up'],
  ['Dining Out', 'EXPENSE', 1450, 2, 'Pizza with roommates'],
  ['Textbooks & Supplies', 'EXPENSE', 6899, 3, 'Used CSC 3100 textbook'],
  ['Dining Out', 'EXPENSE', 6850, 4, 'Birthday dinner'],
  ['Entertainment', 'EXPENSE', 1599, 4, 'Streaming subscription'],
  ['Groceries', 'EXPENSE', 3810, 5, 'Weekly groceries'],
];

/** YYYY-MM-DD for a day in the current month, never later than today. */
function dayThisMonth(day, now = new Date()) {
  const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
  const d = Math.min(day, lastDay, now.getDate());
  return `${currentPeriod(now)}-${String(d).padStart(2, '0')}`;
}

/** Runs fn inside one transaction on a single pooled client. */
async function inTransaction(db, fn) {
  const client = await db.connect();
  try {
    await client.query('BEGIN');
    const result = await fn(client);
    await client.query('COMMIT');
    return result;
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}

/** This month's budgets and transactions for the demo user. Skips any category they removed. */
async function seedDemoMonth(client, userId) {
  const { rows } = await client.query(
    'SELECT name, id FROM categories WHERE user_id = $1',
    [userId],
  );
  const cat = Object.fromEntries(rows.map(({ name, id }) => [name, id]));
  const period = currentPeriod();

  for (const [name, cents] of DEMO_BUDGETS) {
    if (!cat[name]) continue;
    await client.query(
      `INSERT INTO budgets (user_id, category_id, period, limit_amount_cents)
       VALUES ($1, $2, $3, $4)
       ON CONFLICT (user_id, category_id, period) DO NOTHING`,
      [userId, cat[name], period, cents],
    );
  }
  for (const [name, type, cents, day, note] of DEMO_TRANSACTIONS) {
    if (!cat[name]) continue;
    await client.query(
      'INSERT INTO transactions (user_id, category_id, type, amount_cents, date, note) VALUES ($1, $2, $3, $4, $5, $6)',
      [userId, cat[name], type, cents, dayThisMonth(day), note],
    );
  }
}

async function demoUserId(client) {
  const { rows } = await client.query('SELECT id FROM users WHERE email = $1', [
    DEMO_USER_EMAIL,
  ]);
  return rows[0]?.id;
}

async function hasDataThisMonth(client, userId) {
  const { rows } = await client.query(
    `SELECT (SELECT COUNT(*) FROM budgets WHERE user_id = $1 AND period = $2)
          + (SELECT COUNT(*) FROM transactions WHERE user_id = $1 AND to_char(date, 'YYYY-MM') = $2) AS count`,
    [userId, currentPeriod()],
  );
  return Number(rows[0].count) > 0;
}

/**
 * Creates the demo account with its starting categories and this month's data.
 * Safe to run more than once: it never deletes rows or duplicates the month.
 */
export function seedDemoAccount(db) {
  return inTransaction(db, async (client) => {
    let userId = await demoUserId(client);
    if (!userId) {
      const { rows } = await client.query(
        'INSERT INTO users (email, password_hash, name) VALUES ($1, $2, $3) RETURNING id',
        [DEMO_USER_EMAIL, hashDemoPassword(), 'Demo Student'],
      );
      userId = rows[0].id;
      for (const [name, type] of DEFAULT_CATEGORIES) {
        await client.query(
          'INSERT INTO categories (user_id, name, type) VALUES ($1, $2, $3)',
          [userId, name, type],
        );
      }
    }
    if (!(await hasDataThisMonth(client, userId))) {
      await seedDemoMonth(client, userId);
    }
    return userId;
  });
}

/**
 * Deletes the demo account and everything it owns, then seeds it again, so a
 * demo starts from the numbers in DEMO.md. Never touches any other account.
 */
export async function resetDemoAccount(db) {
  await db.query('DELETE FROM users WHERE email = $1', [DEMO_USER_EMAIL]);
  return seedDemoAccount(db);
}

/** Budgets are per month, so a new month would show the demo account as empty. Real accounts are untouched. */
export function refreshDemoMonth(db) {
  return inTransaction(db, async (client) => {
    const userId = await demoUserId(client);
    if (userId && !(await hasDataThisMonth(client, userId))) {
      await seedDemoMonth(client, userId);
    }
  });
}
