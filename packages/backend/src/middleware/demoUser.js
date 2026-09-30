import { DEMO_USER_EMAIL } from '../db/seed-data.js';

/**
 * DEMO ONLY: real auth (US-07) is not built yet, so every request acts as the seeded user.
 * Replace with session/JWT middleware that sets req.userId after login.
 */
export function demoUser(db) {
  const findUser = db.prepare('SELECT id FROM users WHERE email = ?');
  return (req, res, next) => {
    req.userId = findUser.get(DEMO_USER_EMAIL)?.id;
    next();
  };
}
