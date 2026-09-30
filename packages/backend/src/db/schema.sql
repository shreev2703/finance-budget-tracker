-- LedgerLogic schema (TE3). Mirrors the UML class diagram in docs/uml/class-diagram.md.
-- Written for SQLite (demo); every table/column maps 1:1 to MySQL for production.
-- Money is stored as integer cents to avoid floating-point rounding.

CREATE TABLE IF NOT EXISTS users (
  id            INTEGER PRIMARY KEY AUTOINCREMENT,
  email         TEXT    NOT NULL UNIQUE,
  password_hash TEXT    NOT NULL,
  name          TEXT    NOT NULL,
  created_at    TEXT    NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS categories (
  id      INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name    TEXT    NOT NULL,
  type    TEXT    NOT NULL CHECK (type IN ('INCOME', 'EXPENSE')),
  UNIQUE (user_id, name)
);

CREATE TABLE IF NOT EXISTS transactions (
  id           INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id      INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  category_id  INTEGER NOT NULL REFERENCES categories(id),
  type         TEXT    NOT NULL CHECK (type IN ('INCOME', 'EXPENSE')),
  amount_cents INTEGER NOT NULL CHECK (amount_cents > 0),
  date         TEXT    NOT NULL, -- YYYY-MM-DD
  note         TEXT    NOT NULL DEFAULT '',
  created_at   TEXT    NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_transactions_user_date ON transactions (user_id, date);

CREATE TABLE IF NOT EXISTS budgets (
  id                 INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id            INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  category_id        INTEGER NOT NULL REFERENCES categories(id),
  period             TEXT    NOT NULL, -- YYYY-MM
  limit_amount_cents INTEGER NOT NULL CHECK (limit_amount_cents > 0),
  UNIQUE (user_id, category_id, period)
);
