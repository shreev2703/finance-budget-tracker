// `npm run seed`: add the demo account and this month's demo data. Never deletes existing rows.
import { openDatabase } from './connection.js';
import {
  DEMO_USER_EMAIL,
  DEMO_USER_PASSWORD,
  seedDemoAccount,
} from './seed-data.js';

const db = openDatabase();
try {
  await seedDemoAccount(db);
  console.log(`Seeded demo account ${DEMO_USER_EMAIL} (${DEMO_USER_PASSWORD}).`);
} finally {
  await db.end();
}
