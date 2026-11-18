# Testing LedgerLogic

How the automated tests are organised, how to run them, and the TDD work for TE7.

## Quick start

```bash
npm install   # from the repo root, installs every workspace
npm test      # runs every test: backend unit + system, then frontend UI
```

No database setup is needed. `npm test` never connects to the team's Supabase project.

| Command | What it runs |
|---|---|
| `npm test` (root) | `npm test -w backend && npm test -w frontend` |
| `npm test -w backend` | Every `packages/backend/test/**/*.test.js` file with Node's built-in test runner |
| `npm test -w frontend` | Every `packages/frontend/src/**/*.test.{js,jsx}` file with Vitest (jsdom) |
| `npm run lint` | ESLint (backend) and oxlint (frontend) |

CI (`.github/workflows/ci.yml`) runs lint, the backend tests on a real Postgres 16 server, then every test the way a laptop runs them (backend on PGlite, plus the UI tests), then the frontend build, on every pull request and every push to `main`.

## Tools

| Level | Tool | Why |
|---|---|---|
| Unit | [`node:test`](https://nodejs.org/api/test.html) + `node:assert/strict` | Built into Node 22, so nothing extra to install |
| System | `node:test` + the real Express app on a random port + `fetch`, against Postgres | Exercises route → middleware → service → repository → database exactly as the website does |
| UI | Vitest + React Testing Library + `@testing-library/user-event` (jsdom) | Render the whole app and act like a user: labels, buttons, visible text |
| Test database | [PGlite](https://pglite.dev) (default) or any Postgres via `TEST_DATABASE_URL` | Real Postgres behaviour without needing a server |

## The test database

`packages/backend/test/helpers/testDb.js` gives every test file its own fresh database, with `schema.sql` applied and the demo account seeded (`demo@ledgerlogic.app` / `demo-password`, 7 starting categories, 4 budgets, 9 transactions in the current month).

- **Default:** PGlite, which is real Postgres compiled to WebAssembly and running in memory. Each file gets a new instance, so test files can't affect each other, and nothing is left behind.
- **`TEST_DATABASE_URL` set:** each test file creates its own temporary schema on that server and drops it when finished. CI uses this with a `postgres:16` service container. Locally:

  ```bash
  TEST_DATABASE_URL=postgresql://user:pass@localhost:5432/ledger_test npm test
  ```

  Never point it at the app's database (`DATABASE_URL`).

The UI tests need no backend: `src/test/fakeBackend.js` replaces `fetch` with an in-memory copy of the API (same URLs and JSON, seeded with the demo account), so the real `api.js`, pages, and components run unchanged.

Environment variables used by the tests: only `TEST_DATABASE_URL` (optional). The tests pass their own JWT secret (`test-secret`), so `TOKEN_SECRET` isn't needed. No external services are called.

## Test levels

### Unit tests: one function, no database, no HTTP

| File | Unit under test | What it checks |
|---|---|---|
| `test/transaction.test.js` | `src/domain/transaction.js` | Amount limits and rounding to cents, `INCOME`/`EXPENSE` only, real calendar dates (TDD below), category ownership and type, note trimming, every error reported at once |
| `test/budget.test.js` | `src/domain/budget.js` | The 80% warning boundary (79.99% ok, exactly 80% warning, exactly 100% still warning, one cent over is over), negative remaining, limit and period rules, budgets only on expense categories |
| `test/period.test.js` | `src/domain/period.js` | `YYYY-MM` formatting and the Dec 31 → Jan 1 rollover, using fixed dates |
| `test/bankImport.test.js` | `src/domain/bankImport.js`, `createTokenBox` | Plaid amounts to expense or income, pending skipped, Plaid categories mapped to ours, and the token encryption refusing a wrong key or a tampered token |
| `test/id.test.js` | `src/domain/id.js` | Which URL/body values can be a Postgres `INTEGER` id (`abc`, `1.5`, `-1`, too-large values are rejected) |

All unit-test files are in `packages/backend/`.

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

`test/account.test.js` covers account management (#95): changing the password (the old one stops working; a wrong current password, a short new one, or the same one is refused) and deleting an account (needs the password, removes every category and transaction, the token stops working, other accounts are untouched).

`test/plaid.test.js` covers bank connections (#94) with a fake Plaid client, so it never calls Plaid: disabled without keys, login required, the access token stored encrypted (never plain text), posted transactions imported into the right categories with pending ones skipped, no duplicates on a second import, a failed Plaid call is a plain 502 that leaks nothing, and one user's bank data is invisible to others.

`test/rls.test.js` checks the database itself: a role like Supabase's public `anon`, given full table permissions, still sees no rows and can't insert any, because of the row level security in `schema.sql`.

### UI tests: what a user sees and does

These render the whole `<App />` in jsdom and use it the way a student would: typing into labelled fields and clicking buttons by their text. They check only what is on screen (and, at the end, what the fake API saved), never component state.

**User story US-01, log an expense** (`packages/frontend/src/test/logExpense.test.jsx`):
1. `a student logs in, adds an expense, and sees it in the list, the totals, and the budget`: log in, click **+ Add transaction**, enter $85, choose Groceries, add a note, click **Add expense**. The new transaction appears, "$446.17 left" becomes "$361.17 left", and the Groceries card goes from "On track" to "$165.85 of $200.00" and **Near limit** (US-09).
2. `an expense without an amount shows a plain-language error and nothing is saved`: the error "amount must be a positive number" appears, the form stays open, the totals don't change, and nothing new is saved.
3. `an expense can only use an expense category`: Expense shows Groceries but not Allowance, and switching to Income swaps them (US-02).

**User story US-07, log in** (`packages/frontend/src/test/login.test.jsx`):
1. `a wrong password shows an error and keeps the budget hidden`: "Incorrect email or password." appears, the dashboard does not, and the password box is cleared.
2. `the right password opens the dashboard, and a refresh stays logged in`: after logging in, the app is rendered again from scratch (a page refresh) and still shows the dashboard.

**Account management** (`packages/frontend/src/test/account.test.jsx`, US-07):
1. `a wrong current password is refused; the right one changes the password`: the error shows and the user stays logged in; then the change succeeds.
2. `deleting the account asks for confirmation, then returns to the login page`.
3. `cancelling the confirmation keeps the account`.

**Connect a bank** (`packages/frontend/src/test/bankConnect.test.jsx`, US-10): `react-plaid-link` is replaced by a stand-in where the student signs in at once.
1. `connecting imports the bank’s purchases into the dashboard`: click Connect bank, see "Imported 1 transaction from your bank.", the totals and the Groceries card change, and a second import adds nothing.
2. `the Connect bank button is hidden when the server has no bank connections`.

`src/test/setup.js` logs out and clears browser storage after each test, so the tests don't depend on each other. They passed three runs in a row with no warnings.

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

- **UI tests use a fake API**, not the real backend. The system tests cover the real API, but nothing yet runs the real website against the real API together.
- **No browser end-to-end tests.** Next step: Playwright running sign-in → add expense → see the 80% warning against `npm run dev`.
- **PGlite is a single connection**, so truly concurrent requests are serialized. The CI run on a real Postgres server covers the pooled case.
- **Time-dependent code** (the current month) uses today's date in system tests, and the unit tests pass fixed dates. A test that runs exactly at midnight on the last day of a month could in theory see two different months.
- **No load or performance tests.** The SRD's "under 500 ms" target is checked by hand.
- **Bank import (Plaid, #94)** is tested with a fake Plaid client and a stand-in for Plaid Link. Nothing in CI calls Plaid; the real sandbox is checked by hand with `user_good` / `pass_good`.
