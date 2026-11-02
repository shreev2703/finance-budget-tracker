# LedgerLogic (finance-budget-tracker)

A budget tracker for college students: log income and expenses, see your balance, and get warned before you blow a category budget.

Project SRD: https://docs.google.com/document/d/1Lc2qm145vXdAHm76jv-lCK-DichXJx5tS8it1oxZaaQ/edit?usp=sharing

## Course documents

| Assignment                                                | Document                                                                                                 |
| --------------------------------------------------------- | -------------------------------------------------------------------------------------------------------- |
| TE3: UML class diagram                                    | [docs/te3/TE3-UML-Class-Diagram.pdf](docs/te3/TE3-UML-Class-Diagram.pdf)                                 |
| TE4: Design and architectural patterns                    | [docs/te4/TE4-Design-and-Architectural-Patterns.pdf](docs/te4/TE4-Design-and-Architectural-Patterns.pdf) |
| Software Requirements Specification (PDF copy of the SRD) | [docs/srd/LedgerLogic-SRD.pdf](docs/srd/LedgerLogic-SRD.pdf)                                             |

Each assignment folder holds one PDF with all of its diagrams. The editable diagram sources (Mermaid + PNG + HTML) are in [docs/diagram-sources/](docs/diagram-sources/).

## Getting started

Requires Node.js 22.13 or newer.

```bash
npm install     # installs every workspace from the root
npm run dev     # starts the API (http://localhost:3001/api) and the website (http://localhost:5173) together
npm test        # backend tests
npm run lint
npm run seed    # reset the local database to demo data
```

Open http://localhost:5173. The website calls `/api/...`, and Vite forwards those requests to the API on port 3001. To run one side only: `npm run dev:api` or `npm run dev:web`.

The first start creates `packages/backend/data/ledger.db` and seeds a demo student with categories, budgets, and this month's transactions. Stop the server before running `npm run seed`.

In the frontend, call the API through `packages/frontend/src/api.js` (`api.getSummary()`, `api.getTransactions()`, `api.getCategories()`, `api.addTransaction()`, `api.createBudget()`, `api.updateBudget()`). Failed requests throw an `ApiError` with `status` and a `details` list of validation problems.

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
| PUT    | `/api/transactions/:id`               | Edit a transaction; same body and rules as POST (404 if it isn't yours)                                     |
| DELETE | `/api/transactions/:id`               | Delete a transaction (404 if it isn't yours)                                                                |
| GET    | `/api/budgets/summary?period=YYYY-MM` | Monthly totals + per-category budget status (defaults to the current month)                                 |
| GET    | `/api/categories`                     | The user's income and expense categories, each with `budgetId` and `limitCents` for this month (or `null`)  |
| POST   | `/api/budgets`                        | Set a monthly limit `{ categoryId, limit, period? }` for an expense category (409 if one already exists)    |
| PUT    | `/api/budgets/:id`                    | Change a budget's limit `{ limit }`                                                                         |

Authentication (US-07) is not built yet: every request acts as the seeded demo user.
