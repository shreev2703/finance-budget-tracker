export function createCategoryRepository(db) {
  return {
    async listForUser(userId, period) {
      const { rows } = await db.query(`SELECT c.id,c.name,c.type,b.id AS "budgetId",b.limit_amount_cents AS "limitCents" FROM categories c LEFT JOIN budgets b ON b.category_id=c.id AND b.period=$2 WHERE c.user_id=$1 ORDER BY c.type DESC,c.name`, [userId, period]);
      return rows;
    },
    async findForUser(id, userId) { const { rows } = await db.query('SELECT id,name,type FROM categories WHERE id=$1 AND user_id=$2', [id,userId]); return rows[0]; },
    async findByName(userId, name) { const { rows } = await db.query('SELECT id,name,type FROM categories WHERE user_id=$1 AND lower(name)=lower($2)', [userId,name]); return rows[0]; },
    async create(userId,name,type) { const { rows } = await db.query('INSERT INTO categories(user_id,name,type) VALUES($1,$2,$3) RETURNING id,name,type', [userId,name,type]); return rows[0]; },
    async rename(id,userId,name) { await db.query('UPDATE categories SET name=$1 WHERE id=$2 AND user_id=$3', [name,id,userId]); return this.findForUser(id,userId); },
    async transactionCount(id,userId) { const { rows } = await db.query('SELECT COUNT(*)::integer AS count FROM transactions WHERE category_id=$1 AND user_id=$2', [id,userId]); return rows[0].count; },
    async remove(id,userId) { await db.query('DELETE FROM budgets WHERE category_id=$1 AND user_id=$2', [id,userId]); await db.query('DELETE FROM categories WHERE id=$1 AND user_id=$2', [id,userId]); },
  };
}
