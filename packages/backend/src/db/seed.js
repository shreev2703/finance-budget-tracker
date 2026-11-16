// `npm run seed`: add the demo account and this month's demo data. Never deletes existing rows.
// `npm run seed -- --reset-demo`: delete and re-create only the demo account, for a clean demo.
import { openDatabase } from './connection.js';
import {
  DEMO_USER_EMAIL,
  DEMO_USER_PASSWORD,
  resetDemoAccount,
  seedDemoAccount,
} from './seed-data.js';

const reset = process.argv.includes('--reset-demo');
const db = openDatabase();
try {
  await (reset ? resetDemoAccount(db) : seedDemoAccount(db));
  console.log(
    `${reset ? 'Reset' : 'Seeded'} demo account ${DEMO_USER_EMAIL} (${DEMO_USER_PASSWORD}).`,
  );
} finally {
  await db.end();
}
