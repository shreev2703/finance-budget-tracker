import { scryptSync, randomBytes } from 'node:crypto';

export const DEMO_USER_EMAIL = 'demo@ledgerlogic.app';

function hashPassword(password) {
  const salt = randomBytes(16).toString('hex');
  return `scrypt:${salt}:${scryptSync(password, salt, 32).toString('hex')}`;
}

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

/** Inserts the demo user, categories, budgets and transactions. */
export function seed(db) {
  const userId = Number(
    db
      .prepare(
        'INSERT INTO users (email, password_hash, name) VALUES (?, ?, ?)',
      )
      .run(DEMO_USER_EMAIL, hashPassword('demo-password'), 'Demo Student')
      .lastInsertRowid,
  );

  const categories = [
    ['Part-time Job', 'INCOME'],
    ['Allowance', 'INCOME'],
    ['Groceries', 'EXPENSE'],
    ['Dining Out', 'EXPENSE'],
    ['Transportation', 'EXPENSE'],
    ['Entertainment', 'EXPENSE'],
    ['Textbooks & Supplies', 'EXPENSE'],
  ];
  const insertCategory = db.prepare(
    'INSERT INTO categories (user_id, name, type) VALUES (?, ?, ?)',
  );
  const cat = {};
  for (const [name, type] of categories) {
    cat[name] = Number(insertCategory.run(userId, name, type).lastInsertRowid);
  }

  const period = currentPeriod();
  const insertBudget = db.prepare(
    'INSERT INTO budgets (user_id, category_id, period, limit_amount_cents) VALUES (?, ?, ?, ?)',
  );
  insertBudget.run(userId, cat['Groceries'], period, 20000);
  insertBudget.run(userId, cat['Dining Out'], period, 10000);
  insertBudget.run(userId, cat['Transportation'], period, 6000);
  insertBudget.run(userId, cat['Entertainment'], period, 5000);

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
    insertTx.run(userId, cat[name], type, cents, dayThisMonth(day), note);
  }
  return userId;
}
