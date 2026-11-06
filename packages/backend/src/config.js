import { randomBytes } from 'node:crypto';

/** The JWT signing key. Never hard-coded: from TOKEN_SECRET, or random per run during development. */
export function loadTokenSecret(env = process.env) {
  if (env.TOKEN_SECRET) return env.TOKEN_SECRET;
  if (env.NODE_ENV === 'production') {
    throw new Error('TOKEN_SECRET must be set in production');
  }
  console.warn(
    'TOKEN_SECRET is not set, so using a random one: restarting the API logs everyone out. See packages/backend/.env.example.',
  );
  return randomBytes(32).toString('hex');
}
