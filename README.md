# LedgerLogic (finance-budget-tracker)

A budget tracker for college students: log income and expenses, see your balance, and get warned before you blow a category budget.

Project SRD: https://docs.google.com/document/d/1Lc2qm145vXdAHm76jv-lCK-DichXJx5tS8it1oxZaaQ/edit?usp=sharing

## Getting started

Requires Node.js 22.13 or newer.

```bash
npm install     # installs every workspace from the root
npm run dev     # API on http://localhost:3001/api (restarts on file changes)
npm test        # backend API tests
npm run lint
npm run seed    # reset the local database to demo data
```

The first start creates `packages/backend/data/ledger.db` and seeds a demo student with categories, budgets, and this month's transactions. Stop the server before running `npm run seed`.

## Layout

```
packages/
  backend/    Express REST API + SQLite
    src/
      db/            schema.sql, connection, seed data
      repositories/  all SQL queries
      services/      validation and business logic
      domain/        budget rules (remaining, 80% warning, over limit)
      routes/        HTTP endpoints
      middleware/    demo user, error handling
    test/            API tests (node --test)
  frontend/   React SPA
```

## API

| Method | Path                                  | Description                                                                                                 |
| ------ | ------------------------------------- | ----------------------------------------------------------------------------------------------------------- |
| GET    | `/api/transactions?limit=50`          | Transactions, newest first                                                                                  |
| POST   | `/api/transactions`                   | Create `{ amount, type, categoryId, date, note }` (`type` is `INCOME` or `EXPENSE`, `date` is `YYYY-MM-DD`) |
| GET    | `/api/budgets/summary?period=YYYY-MM` | Monthly totals + per-category budget status (defaults to the current month)                                 |
| GET    | `/api/categories`                     | The user's income and expense categories                                                                    |

Authentication (US-07) is not built yet: every request acts as the seeded demo user.
