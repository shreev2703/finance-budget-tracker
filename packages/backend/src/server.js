import { openDatabase } from './db/connection.js';
import { createApp } from './app.js';

// API_PORT rather than PORT, so a PORT meant for the frontend dev server can't collide with it.
const port = Number(process.env.API_PORT) || 3001;
const app = createApp(openDatabase());

app.listen(port, () => {
  console.log(`LedgerLogic API listening on http://localhost:${port}/api`);
});
