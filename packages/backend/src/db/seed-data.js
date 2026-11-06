import bcrypt from 'bcrypt';
import { DEFAULT_CATEGORIES } from '../domain/category.js';
import { BCRYPT_ROUNDS } from '../domain/user.js';

export const DEMO_USER_EMAIL = 'demo@ledgerlogic.app';
export const DEMO_USER_PASSWORD = 'demo-password';

export const hashDemoPassword = () =>
  bcrypt.hashSync(DEMO_USER_PASSWORD, BCRYPT_ROUNDS);

/** YYYY-MM-DD for a day in the current month, so the demo always has fresh data. */
function dayThisMonth(day, now = new Date()) {
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, '0');
  const lastDay = new Date(y, now.getMonth() + 1, 0).getDate();
  return `${y}-${m}-${String(Math.min(day, lastDay, now.getDate())).padStart(2, '0')}`;
}

export function currentPeriod(now = new Date()) {
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
}

/** This month's budgets and transactions for the demo user. Skips any category they removed. */
function seedDemoMonth(db, userId) {
  const cat = Object.fromEntries(
    db
      .prepare('SELECT name, id FROM categories WHERE user_id = ?')
      .all(userId)
      .map(({ name, id }) => [name, id]),
  );

  const period = currentPeriod();
  const insertBudget = db.prepare(
    'INSERT INTO budgets (user_id, category_id, period, limit_amount_cents) VALUES (?, ?, ?, ?)',
  );
  const budgets = [
    ['Groceries', 20000],
    ['Dining Out', 10000],
    ['Transportation', 6000],
    ['Entertainment', 5000],
  ];
  for (const [name, cents] of budgets) {
    if (cat[name]) insertBudget.run(userId, cat[name], period, cents);
  }

  const insertTx = db.prepare(
    'INSERT INTO transactions (user_id, category_id, type, amount_cents, date, note) VALUES (?, ?, ?, ?, ?, ?)',
  );
  const txs = [
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
  for (const [name, type, cents, day, note] of txs) {
    if (cat[name]) {
      insertTx.run(userId, cat[name], type, cents, dayThisMonth(day), note);
    }
  }
}

/** Inserts the demo user, categories, budgets and transactions. */
export function seed(db) {
  const userId = Number(
    db
      .prepare(
        'INSERT INTO users (email, password_hash, name) VALUES (?, ?, ?)',
      )
      .run(DEMO_USER_EMAIL, hashDemoPassword(), 'Demo Student')
      .lastInsertRowid,
  );

  const insertCategory = db.prepare(
    'INSERT INTO categories (user_id, name, type) VALUES (?, ?, ?)',
  );
  for (const [name, type] of DEFAULT_CATEGORIES) {
    insertCategory.run(userId, name, type);
  }

  seedDemoMonth(db, userId);
  return userId;
}

/** Budgets are per month, so a new month would show the demo account as empty. Real accounts are untouched. */
export function refreshDemoMonth(db) {
  const demo = db
    .prepare('SELECT id FROM users WHERE email = ?')
    .get(DEMO_USER_EMAIL);
  if (!demo) return;
  const { count } = db
    .prepare(
      `SELECT (SELECT COUNT(*) FROM budgets WHERE user_id = ?1 AND period = ?2)
            + (SELECT COUNT(*) FROM transactions WHERE user_id = ?1 AND substr(date, 1, 7) = ?2) AS count`,
    )
    .get(demo.id, currentPeriod());
  if (count === 0) seedDemoMonth(db, demo.id);
}
