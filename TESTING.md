# Testing LedgerLogic

How the automated tests are organised, how to run them, and the TDD work for TE7.

## Quick start

```bash
npm install   # from the repo root, installs every workspace
npm test      # runs the backend tests (unit + system)
```

No database setup is needed. `npm test` never connects to the team's Supabase project.

| Command | What it runs |
|---|---|
| `npm test` (root) | `npm test -w backend` |
| `npm test -w backend` | Every `packages/backend/test/**/*.test.js` file with Node's built-in test runner |
| `npm test -w frontend` | UI tests. Added in #91; until then the frontend has no `test` script |
| `npm run lint` | ESLint (backend) and oxlint (frontend) |

CI (`.github/workflows/ci.yml`) runs lint, the backend tests twice (once on a real Postgres 16 server and once on PGlite), and the frontend build on every pull request and every push to `main`.

## Tools

| Level | Tool | Why |
|---|---|---|
| Unit | [`node:test`](https://nodejs.org/api/test.html) + `node:assert/strict` | Built into Node 22, so nothing extra to install |
| System | `node:test` + the real Express app on a random port + `fetch`, against Postgres | Exercises route → middleware → service → repository → database exactly as the website does |
| UI | Vitest + React Testing Library + `@testing-library/user-event` (jsdom) | Component-level tests that act like a user: labels, buttons, visible text (#91) |
| Test database | [PGlite](https://pglite.dev) (default) or any Postgres via `TEST_DATABASE_URL` | Real Postgres behaviour without needing a server |

## The test database

`packages/backend/test/helpers/testDb.js` gives every test file its own fresh database, with `schema.sql` applied and the demo account seeded (`demo@ledgerlogic.app` / `demo-password`, 7 starting categories, 4 budgets, 9 transactions in the current month).

- **Default:** PGlite, which is real Postgres compiled to WebAssembly and running in memory. Each file gets a new instance, so test files can't affect each other, and nothing is left behind.
- **`TEST_DATABASE_URL` set:** each test file creates its own temporary schema on that server and drops it when finished. CI uses this with a `postgres:16` service container. Locally:

  ```bash
  TEST_DATABASE_URL=postgresql://user:pass@localhost:5432/ledger_test npm test
  ```

  Never point it at the app's database (`DATABASE_URL`).

Environment variables used by the tests: only `TEST_DATABASE_URL` (optional). The tests pass their own JWT secret (`test-secret`), so `TOKEN_SECRET` isn't needed. No external services are called.

## Test levels

### Unit tests: one function, no database, no HTTP

| File | Unit under test | What it checks |
|---|---|---|
| `test/transaction.test.js` | `src/domain/transaction.js` | Amount limits and rounding to cents, `INCOME`/`EXPENSE` only, real calendar dates (TDD below), category ownership and type, note trimming, every error reported at once |
| `test/budget.test.js` | `src/domain/budget.js` | The 80% warning boundary (79.99% ok, exactly 80% warning, exactly 100% still warning, one cent over is over), negative remaining, limit and period rules, budgets only on expense categories |
| `test/period.test.js` | `src/domain/period.js` | `YYYY-MM` formatting and the Dec 31 → Jan 1 rollover, using fixed dates |
| `test/id.test.js` | `src/domain/id.js` | Which URL/body values can be a Postgres `INTEGER` id (`abc`, `1.5`, `-1`, too-large values are rejected) |

### System tests: the whole backend working together

These start the real Express app (`createApp`) on a random port with a test database and call it over HTTP, so each request goes through the auth middleware, the route, the service, the repository, and Postgres.

`test/api.test.js` covers transactions, budgets, categories, filters, and reports. Examples:
- **Create and read back:** `POST /transactions creates an expense and updates the summary` creates an expense, then checks it appears in `GET /transactions` and changes the totals in `GET /budgets/summary`.
- **Invalid request:** `POST /transactions rejects invalid input with 400 and reasons` checks the status, the error list, and that nothing was stored.
- **Edit and follow-through:** `PUT /transactions/:id edits a transaction and the summary follows`.
- **Bad ids:** `ids that cannot be a database id are rejected with 400, not a 500`.

`test/auth.test.js` covers sign-up, sign-in, tokens, and access control (TE6). Examples:
- **Permissions:** `a user cannot see or change another user’s data` shows another user gets 404 on every edit and delete of the demo user's records, and the demo data is unchanged afterwards.
- **Not logged in:** `every data route returns 401 without a token`.
- **Bad tokens:** garbage, wrong secret, expired, deleted user, and `alg: none` tokens are all rejected.
- **Passwords:** `register stores a bcrypt hash, never the password` reads the row straight from the database.

### UI tests: what a user sees and does

Tracked in #91 (Juan F.). Plan: user story **US-01, log an expense**, with `api.js` mocked and the date frozen:
1. Fill in the Add transaction form, submit, and see the new transaction and the updated totals.
2. Submit without an amount, see the plain-language error, and nothing is saved.
3. (Bonus, US-07) A wrong password on the login page shows "Incorrect email or password."

This section will list the test files once #91 is merged.

## TDD: a transaction date must be a real calendar day (#88)

**Requirement (FR-01, US-01):** a transaction's date must be a day that exists. `2026-02-30` and `2026-04-31` must be rejected with a clear 400 error, and Feb 29 is only allowed in leap years.

**Why this was a real bug:** `dateError` used `Date.parse`, which quietly rolls `2026-02-30` over to March 2, so the date passed validation. With SQLite the bad text was stored as-is. After the switch to Supabase, Postgres rejects it, so the API answered with a **500** (`date/time field value out of range: "2026-02-30"`).

**1. Red** (commit [`9439a98`](https://github.com/shreev2703/finance-budget-tracker/commit/9439a98)). Tests only, no production code:

```js
// test/transaction.test.js (unit)
test('dateError rejects days that do not exist in that month', () => {
  for (const impossible of ['2026-02-30', '2026-02-31', '2026-04-31', '2025-02-29']) {
    assert.equal(dateError(impossible), 'date must be YYYY-MM-DD', impossible);
  }
});

// test/api.test.js (system)
test('POST /transactions rejects a day that does not exist (400, not 500) and saves nothing', ...);
```

Output (`npm test`):

```
✖ POST /transactions rejects a day that does not exist (400, not 500) and saves nothing
  AssertionError [ERR_ASSERTION]: Expected values to be strictly equal:
  500 !== 400
✖ dateError rejects days that do not exist in that month
  AssertionError [ERR_ASSERTION]: 2026-02-30
    actual: null,
    expected: 'date must be YYYY-MM-DD'
ℹ tests 52
ℹ pass 50
ℹ fail 2
```

A companion test, `dateError accepts the last day of every month, and Feb 29 in leap years`, already passed. It guards against a fix that is too strict.

**2. Green** (commit [`697cd77`](https://github.com/shreev2703/finance-budget-tracker/commit/697cd77)). The smallest change: also require the date to come back unchanged after parsing.

```js
!Number.isNaN(Date.parse(date)) &&
new Date(date).toISOString().slice(0, 10) === date;
```

Result: 52 / 52 pass.

**3. Refactor** (commit [`f8253ee`](https://github.com/shreev2703/finance-budget-tracker/commit/f8253ee)). The Green fix parsed the same string twice. It was replaced with one named helper, `isCalendarDate`, that reads the year, month, and day from the regex and checks that `Date.UTC` gives the same day back. `dateError` now just calls it. Result: still 52 / 52 pass, and lint is clean. The transaction filters (`?from=`, `?to=`) use `dateError` too, so they got the fix for free.

## Known limitations and future tests

- **UI tests** are not merged yet (#91). Until then `npm test` covers the backend only.
- **No browser end-to-end tests.** Next step: Playwright running sign-in → add expense → see the 80% warning against `npm run dev`.
- **PGlite is a single connection**, so truly concurrent requests are serialized. The CI run on a real Postgres server covers the pooled case.
- **Time-dependent code** (the current month) uses today's date in system tests, and the unit tests pass fixed dates. A test that runs exactly at midnight on the last day of a month could in theory see two different months.
- **No load or performance tests.** The SRD's "under 500 ms" target is checked by hand.
- **Bank import (Plaid, #94)**, if built, needs tests with a mocked Plaid client so CI never calls Plaid.
