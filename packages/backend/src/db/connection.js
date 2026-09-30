import { DatabaseSync } from 'node:sqlite';
import { readFileSync, mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { seed } from './seed-data.js';

const here = dirname(fileURLToPath(import.meta.url));
const DEFAULT_PATH = join(here, '..', '..', 'data', 'ledger.db');

/**
 * Opens (and if needed creates + seeds) the database.
 * Pass ':memory:' for tests.
 */
export function openDatabase(path = process.env.DB_PATH ?? DEFAULT_PATH) {
  if (path !== ':memory:') mkdirSync(dirname(path), { recursive: true });
  const db = new DatabaseSync(path);
  db.exec('PRAGMA foreign_keys = ON;');
  db.exec(readFileSync(join(here, 'schema.sql'), 'utf8'));

  const { count } = db.prepare('SELECT COUNT(*) AS count FROM users').get();
  if (count === 0) seed(db);
  return db;
}
