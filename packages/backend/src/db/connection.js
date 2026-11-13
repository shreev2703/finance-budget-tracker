import pg from 'pg';

const { Pool } = pg;

/** Creates a PostgreSQL pool for a Supabase project. */
export function openDatabase(connectionString = process.env.DATABASE_URL) {
  if (!connectionString) {
    throw new Error('DATABASE_URL is required. Configure your Supabase PostgreSQL connection string.');
  }
  return new Pool({
    connectionString,
    ssl: process.env.DB_SSL === 'disable' ? false : { rejectUnauthorized: false },
    max: Number(process.env.DB_POOL_MAX) || 10,
  });
}
