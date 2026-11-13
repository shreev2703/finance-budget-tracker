// `npm run seed`: safely add demo data to Supabase without deleting existing rows.
import { openDatabase } from './connection.js';
import { DEFAULT_CATEGORIES } from '../domain/category.js';
import { DEMO_USER_EMAIL, DEMO_USER_PASSWORD, hashDemoPassword, currentPeriod } from './seed-data.js';

const db = openDatabase();
const client = await db.connect();
try {
  await client.query('BEGIN');
  let { rows } = await client.query('SELECT id FROM users WHERE email=$1', [DEMO_USER_EMAIL]);
  let userId = rows[0]?.id;
  if (!userId) {
    ({ rows } = await client.query('INSERT INTO users(email,password_hash,name) VALUES($1,$2,$3) RETURNING id', [DEMO_USER_EMAIL,hashDemoPassword(),'Demo Student']));
    userId = rows[0].id;
  }
  const ids = {};
  for (const [name,type] of DEFAULT_CATEGORIES) {
    ({ rows } = await client.query('INSERT INTO categories(user_id,name,type) VALUES($1,$2,$3) ON CONFLICT(user_id,name) DO UPDATE SET type=EXCLUDED.type RETURNING id', [userId,name,type]));
    ids[name] = rows[0].id;
  }
  const period = currentPeriod();
  const budgets = [['Groceries',20000],['Dining Out',10000],['Transportation',6000],['Entertainment',5000]];
  for (const [name,cents] of budgets) {
    await client.query('INSERT INTO budgets(user_id,category_id,period,limit_amount_cents) VALUES($1,$2,$3,$4) ON CONFLICT(user_id,category_id,period) DO NOTHING', [userId,ids[name],period,cents]);
  }
  const txs = [['Allowance','INCOME',40000,1,'Monthly allowance'],['Part-time Job','INCOME',32000,1,'Campus library paycheck'],['Groceries','EXPENSE',4275,2,"Trader Joe's"],['Transportation','EXPENSE',2500,2,'Bus pass top-up'],['Dining Out','EXPENSE',1450,2,'Pizza with roommates'],['Textbooks & Supplies','EXPENSE',6899,3,'Used CSC 3100 textbook'],['Dining Out','EXPENSE',6850,4,'Birthday dinner'],['Entertainment','EXPENSE',1599,4,'Streaming subscription'],['Groceries','EXPENSE',3810,5,'Weekly groceries']];
  for (const [name,type,cents,day,note] of txs) {
    const date = `${period}-${String(Math.min(day,new Date().getDate())).padStart(2,'0')}`;
    await client.query('INSERT INTO transactions(user_id,category_id,type,amount_cents,date,note) SELECT $1,$2,$3,$4,$5,$6 WHERE NOT EXISTS(SELECT 1 FROM transactions WHERE user_id=$1 AND note=$6 AND date=$5)', [userId,ids[name],type,cents,date,note]);
  }
  await client.query('COMMIT');
  console.log(`Seeded Supabase demo account ${DEMO_USER_EMAIL} (${DEMO_USER_PASSWORD}).`);
} catch (error) {
  await client.query('ROLLBACK');
  throw error;
} finally {
  client.release();
  await db.end();
}
