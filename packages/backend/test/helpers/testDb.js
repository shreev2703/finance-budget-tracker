// A fresh, seeded Postgres database for each test file.
//
// - TEST_DATABASE_URL set (CI, or a local Postgres): each test file gets its own
//   schema on that server, dropped when the file finishes.
// - Not set: PGlite, a real Postgres compiled to WebAssembly that runs in memory,
//   so `npm test` needs no setup. Never point TEST_DATABASE_URL at the app's database.
import { readFileSync } from 'node:fs';
import { randomUUID } from 'node:crypto';
import pg from 'pg';
import { PGlite } from '@electric-sql/pglite';
import { seedDemoAccount } from '../../src/db/seed-data.js';

const SCHEMA_SQL = readFileSync(
  new URL('../../src/db/schema.sql', import.meta.url),
  'utf8',
);

/**
 * Wraps PGlite in the subset of the pg.Pool API the app uses: query, connect, end.
 * PGlite has a single connection, so a client from connect() holds it until
 * release(), and other queries wait. That keeps transactions from interleaving.
 */
function pgliteAsPool(pglite) {
  let tail = Promise.resolve();
  const acquire = () => {
    let release;
    const held = new Promise((resolve) => {
      release = resolve;
    });
    const ready = tail;
    tail = tail.then(() => held);
    return ready.then(() => release);
  };
  const run = async (text, params) => {
    const result = await pglite.query(text, params);
    return { rows: result.rows, rowCount: result.affectedRows ?? 0 };
  };
  return {
    async query(text, params) {
      const release = await acquire();
      try {
        return await run(text, params);
      } finally {
        release();
      }
    },
    async connect() {
      const release = await acquire();
      return { query: run, release };
    },
    end: () => pglite.close(),
  };
}

async function pgliteDb() {
  const pglite = new PGlite();
  await pglite.exec(SCHEMA_SQL);
  return pgliteAsPool(pglite);
}

async function serverDb(connectionString) {
  const schema = `test_${randomUUID().replaceAll('-', '')}`;
  const admin = new pg.Client({ connectionString });
  await admin.connect();
  await admin.query(`CREATE SCHEMA ${schema}`);
  await admin.end();

  const pool = new pg.Pool({
    connectionString,
    options: `-c search_path=${schema}`,
    max: 5,
  });
  await pool.query(SCHEMA_SQL);
  const end = pool.end.bind(pool);
  pool.end = async () => {
    await pool.query(`DROP SCHEMA ${schema} CASCADE`);
    await end();
  };
  return pool;
}

/** Creates the tables and the demo account. Call db.end() when the test file is done. */
export async function createTestDb() {
  const url = process.env.TEST_DATABASE_URL;
  const db = url ? await serverDb(url) : await pgliteDb();
  await seedDemoAccount(db);
  return db;
}
