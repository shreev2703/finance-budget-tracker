// Row level security (schema.sql): Supabase's public Data API connects as roles like "anon".
// Even with full table permissions, such a role must see no rows and add none. The backend
// connects as the tables' owner, so every other test file shows it still works normally.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createTestDb } from './helpers/testDb.js';

test('a non-owner role like Supabase "anon" can neither read nor write any table', async () => {
  const db = await createTestDb();
  const client = await db.connect();
  const role = `anon_like_${process.pid}`;
  try {
    await client.query('BEGIN');
    const { rows } = await client.query(
      'SELECT current_schema() AS schema, (SELECT COUNT(*) FROM users)::integer AS owner_sees',
    );
    const [{ schema, owner_sees: ownerSees }] = rows;
    assert.ok(ownerSees > 0, 'the owner sees the seeded demo user');

    // CREATE ROLE is rolled back with the transaction, so nothing is left behind.
    await client.query(`CREATE ROLE ${role} NOLOGIN`);
    await client.query(`GRANT USAGE ON SCHEMA ${schema} TO ${role}`);
    await client.query(`GRANT ALL ON ALL TABLES IN SCHEMA ${schema} TO ${role}`);
    await client.query(`SET LOCAL ROLE ${role}`);

    for (const table of ['users', 'categories', 'transactions', 'budgets']) {
      const result = await client.query(
        `SELECT COUNT(*)::integer AS n FROM ${table}`,
      );
      assert.equal(result.rows[0].n, 0, `${table} must look empty`);
    }

    await client.query('SAVEPOINT before_insert');
    await assert.rejects(
      client.query(
        "INSERT INTO users (email, password_hash, name) VALUES ('x@y.z', 'x', 'X')",
      ),
      /row-level security/,
    );
    await client.query('ROLLBACK TO SAVEPOINT before_insert');
  } finally {
    await client.query('ROLLBACK');
    client.release();
    await db.end();
  }
});
