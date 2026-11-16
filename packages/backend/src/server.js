import { openDatabase } from './db/connection.js';
import { createApp } from './app.js';
import { loadTokenSecret } from './config.js';
import { refreshDemoMonth } from './db/seed-data.js';

// API_PORT rather than PORT, so a PORT meant for the frontend dev server can't collide with it.
const port = Number(process.env.API_PORT) || 3001;
const db = openDatabase();
const app = createApp(db, { tokenSecret: loadTokenSecret() });

// Give the demo account (if it was seeded) this month's data, so the demo dashboard is never empty.
refreshDemoMonth(db).catch((error) =>
  console.error('Could not refresh the demo month:', error.message),
);

const server = app.listen(port, () => {
  console.log(`LedgerLogic API listening on http://localhost:${port}/api`);
});

process.on('SIGTERM', () => server.close());
process.on('SIGINT', () => server.close());
