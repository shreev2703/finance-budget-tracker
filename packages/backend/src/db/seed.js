// `npm run seed`: wipe the local database and re-seed demo data.
import { rmSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { openDatabase } from './connection.js';

const dbPath =
  process.env.DB_PATH ??
  join(
    dirname(fileURLToPath(import.meta.url)),
    '..',
    '..',
    'data',
    'ledger.db',
  );

rmSync(dbPath, { force: true });
const db = openDatabase(dbPath);
const { count } = db
  .prepare('SELECT COUNT(*) AS count FROM transactions')
  .get();
console.log(`Seeded ${dbPath} with ${count} demo transactions.`);
db.close();
