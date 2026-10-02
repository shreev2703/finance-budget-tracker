# Design patterns in LedgerLogic (TE4)

Each pattern below is one we actually use, with the file where it appears. Backend paths are relative to `packages/backend/src/`.

## 1. Layered architecture (MVC-style)

**Where:** `routes/` → `services/` → `repositories/` → `db/` (see [architecture.md](architecture.md)).

**How:** routes act as controllers (HTTP in, JSON out), services hold the business logic, and repositories own the data access. React is the view. Each layer depends only on the one below it.

**Why:** we can test the API end to end against an in-memory database, and changing a SQL query never touches a route.

## 2. Repository

**Where:** `repositories/transactionRepository.js:2`, `repositories/budgetRepository.js:1`, `repositories/categoryRepository.js:1`.

**How:** each repository is created with the database handle and returns a small object of methods, such as `listForUser`, `create`, `totalsForPeriod` and `spentByCategory`. All SQL statements are prepared inside the repository. Services call these methods and never see SQL.

```js
// services/budgetService.js
transactions.totalsForPeriod(userId, period); // no SQL here
```

**Why:** the schema can change, or SQLite can be swapped for MySQL, by editing one folder. It also guards against SQL injection, since every query uses `?` placeholders in one place.

## 3. Chain of responsibility (Express middleware)

**Where:** `app.js:18-32`, `middleware/demoUser.js:7`, `middleware/errorHandler.js:9` and `:15`.

**How:** every request passes along a chain: `express.json()` → `demoUser` → `apiRouter` → `notFound` → `errorHandler`. Each handler either deals with the request or calls `next()` to pass it on. Errors skip ahead to `errorHandler`, which Express recognizes by its four-argument signature.

```js
app.use(express.json());
app.use('/api', demoUser(db));   // sets req.userId, then next()
app.use('/api', apiRouter(...));
app.use(notFound);               // nothing matched
app.use(errorHandler);           // HttpError → 4xx JSON, anything else → 500
```

**Why:** cross-cutting concerns such as identifying the user and formatting errors live in one place. When real login (US-07) arrives, `demoUser` is replaced by an auth middleware and no route changes.

## 4. Dependency injection / factory functions

**Where:** `app.js:12` (`createApp(db)`), `services/transactionService.js:6`, `services/budgetService.js:4`.

**How:** nothing creates its own dependencies. `createApp` builds the repositories and passes them into the services; the services are passed into the router. Each `create…` function is a factory that returns an object closed over its dependencies.

**Why:** the tests call `createApp(openDatabase(':memory:'))` and get a fully working app with a throwaway database (`test/api.test.js`).

## 5. Custom error type (exceptions as control flow for HTTP errors)

**Where:** `middleware/errorHandler.js:1` (`HttpError`), thrown at `services/transactionService.js:43` and `routes/api.js:29`.

**How:** a service throws `new HttpError(400, 'Invalid transaction', errors)`. Express 5 forwards the thrown error to `errorHandler`, which turns it into `{ error, details }` with the right status code.

**Why:** validation code stays linear ("check, push error, throw once"), and every error response has the same shape for the frontend.

## 6. Observer (React state)

**Where:** frontend, per the component plan in #26: `DashboardPage` owns the transactions and the budget summary in state, and `BudgetSummary` and `TransactionList` receive them as props.

**How:** React re-renders every component that reads a piece of state when that state changes. After `AddTransactionForm` saves, `DashboardPage` re-fetches and updates its state, and the list and the budget bars "observe" the change and redraw themselves.

**Why:** no component has to manually tell the others to refresh, so adding a transaction automatically updates the totals, the bars and the list.

> File and line references for the frontend will be added once the demo UI (#21) is merged.
