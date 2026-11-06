# LedgerLogic demo

A walkthrough of about 2.5 minutes. Each step has a backup screenshot in [docs/demo/](docs/demo/) in case the live demo fails.

## Before you present

Run these on the presenting laptop. Node.js 22.13 or newer is required.

```bash
git checkout main
git pull
npm install
npm run seed
npm run dev
```

Then open the address Vite prints, usually http://localhost:5173. Stop the server before running `npm run seed` again.

`npm run seed` resets the database, so run it right before presenting to make the numbers match the steps below.

**Demo login:** `demo@ledgerlogic.app` / `demo-password`

## Steps

| # | Do this | Point out | Backup |
| --- | --- | --- | --- |
| 1 | Open the app | Data routes need a login | [Login](docs/demo/1-login.png) |
| 2 | Log in with the demo account | Income is $720.00, spent is $273.83, and the chart shows where it went | [Dashboard](docs/demo/2-dashboard.png) |
| 3 | Click **+ Add transaction**: Expense, Groceries, $85, today | The form saves through the API | [Add expense](docs/demo/3-add-expense.png) |
| 4 | Click **Add expense** | Totals, the chart, and the list update right away. Groceries goes from $80.85 to $165.85 of $200 and shows **Near limit** (83%) | [Warning](docs/demo/4-budget-warning.png) |
| 5 | Click **Edit** on Groceries and change the limit to $300 | The warning clears | [Edit limit](docs/demo/5-edit-limit.png) |
| 6 | Click **View all transactions** and filter by Groceries | Filters by category and date range | [Filter](docs/demo/6-filter-transactions.png) |
| 7 | Refresh the page | You stay logged in, because the token is saved in the browser | |
| 8 | Click **Log Out**, then log in with a wrong password | Same error for a wrong password or an unknown email | [Bad token](docs/demo/7-bad-token-returns-to-login.png) |

## If something goes wrong

- **Blank data or an error on the dashboard:** check that the terminal shows `LedgerLogic API listening`. Restart `npm run dev`.
- **Numbers don't match:** stop the server, run `npm run seed`, and start it again.
- **Logged out after a restart:** expected unless `TOKEN_SECRET` is set in `packages/backend/.env`. Log in again.
- **Port 5173 is taken:** Vite picks the next free port. Use the address it prints.
- **The backend won't start at all:** run the website alone with browser-only sample data: `VITE_DEMO=1 npm run dev:web` (Windows cmd: `set VITE_DEMO=1&& npm run dev:web`). Any login works in this mode, so say it isn't using the real API.
- **Nothing works:** use the backup screenshots.
