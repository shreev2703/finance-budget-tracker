export function createBudgetRepository(db) {
  const columns = `b.id,b.period,b.limit_amount_cents AS "limitCents",c.id AS "categoryId",c.name AS "categoryName"`;
  return {
    async listForPeriod(userId,period) { const { rows } = await db.query(`SELECT ${columns} FROM budgets b JOIN categories c ON c.id=b.category_id WHERE b.user_id=$1 AND b.period=$2 ORDER BY c.name`, [userId,period]); return rows; },
    async findForUser(id,userId) { const { rows } = await db.query(`SELECT ${columns} FROM budgets b JOIN categories c ON c.id=b.category_id WHERE b.id=$1 AND b.user_id=$2`, [id,userId]); return rows[0]; },
    async findForCategory(userId,categoryId,period) { const { rows } = await db.query(`SELECT ${columns} FROM budgets b JOIN categories c ON c.id=b.category_id WHERE b.user_id=$1 AND b.category_id=$2 AND b.period=$3`, [userId,categoryId,period]); return rows[0]; },
    async create({userId,categoryId,period,limitCents}) { const { rows } = await db.query('INSERT INTO budgets(user_id,category_id,period,limit_amount_cents) VALUES($1,$2,$3,$4) RETURNING id', [userId,categoryId,period,limitCents]); return this.findForUser(rows[0].id,userId); },
    async updateLimit(id,userId,limitCents) { await db.query('UPDATE budgets SET limit_amount_cents=$1 WHERE id=$2 AND user_id=$3', [limitCents,id,userId]); return this.findForUser(id,userId); },
  };
}
