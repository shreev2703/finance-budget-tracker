const SELECT_TRANSACTION = `t.id,t.type,t.amount_cents AS "amountCents",t.date::text AS date,t.note,c.id AS "categoryId",c.name AS "categoryName"`;

export function createTransactionRepository(db) {
  return {
    async listForUser(userId, limit = 50, { categoryId, from, to } = {}) {
      const { rows } = await db.query(`SELECT ${SELECT_TRANSACTION} FROM transactions t JOIN categories c ON c.id=t.category_id WHERE t.user_id=$1 AND ($2::integer IS NULL OR t.category_id=$2) AND ($3::date IS NULL OR t.date >= $3) AND ($4::date IS NULL OR t.date <= $4) ORDER BY t.date DESC,t.id DESC LIMIT $5`, [userId,categoryId ?? null,from ?? null,to ?? null,limit]);
      return rows;
    },
    async create({ userId,categoryId,type,amountCents,date,note }) {
      const { rows } = await db.query('INSERT INTO transactions(user_id,category_id,type,amount_cents,date,note) VALUES($1,$2,$3,$4,$5,$6) RETURNING id', [userId,categoryId,type,amountCents,date,note]);
      const result = await db.query(`SELECT ${SELECT_TRANSACTION} FROM transactions t JOIN categories c ON c.id=t.category_id WHERE t.id=$1`, [rows[0].id]);
      return result.rows[0];
    },
    async update(id,userId,{categoryId,type,amountCents,date,note}) {
      const { rowCount } = await db.query('UPDATE transactions SET category_id=$1,type=$2,amount_cents=$3,date=$4,note=$5 WHERE id=$6 AND user_id=$7', [categoryId,type,amountCents,date,note,id,userId]);
      if (!rowCount) return undefined;
      const result = await db.query(`SELECT ${SELECT_TRANSACTION} FROM transactions t JOIN categories c ON c.id=t.category_id WHERE t.id=$1`, [id]);
      return result.rows[0];
    },
    async remove(id,userId) { const { rowCount } = await db.query('DELETE FROM transactions WHERE id=$1 AND user_id=$2', [id,userId]); return rowCount > 0; },
    async totalsForPeriod(userId,period) {
      const { rows } = await db.query(`SELECT type,SUM(amount_cents)::integer AS "totalCents" FROM transactions WHERE user_id=$1 AND to_char(date,'YYYY-MM')=$2 GROUP BY type`, [userId,period]);
      return rows;
    },
    async spentByCategory(userId,period) {
      const { rows } = await db.query(`SELECT category_id AS "categoryId",SUM(amount_cents)::integer AS "spentCents" FROM transactions WHERE user_id=$1 AND type='EXPENSE' AND to_char(date,'YYYY-MM')=$2 GROUP BY category_id`, [userId,period]);
      return rows;
    },
    async spendingByCategory(userId,period) {
      const { rows } = await db.query(`SELECT c.id AS "categoryId",c.name AS "categoryName",SUM(t.amount_cents)::integer AS "spentCents" FROM transactions t JOIN categories c ON c.id=t.category_id WHERE t.user_id=$1 AND t.type='EXPENSE' AND to_char(t.date,'YYYY-MM')=$2 GROUP BY c.id ORDER BY "spentCents" DESC,c.name`, [userId,period]);
      return rows;
    },
  };
}
