/** Repository pattern: all SQL for transactions lives here. */
export function createTransactionRepository(db) {
  const list = db.prepare(`
    SELECT t.id, t.type, t.amount_cents AS amountCents, t.date, t.note,
           c.id AS categoryId, c.name AS categoryName
      FROM transactions t
      JOIN categories c ON c.id = t.category_id
     WHERE t.user_id = ?
     ORDER BY t.date DESC, t.id DESC
     LIMIT ?`);
  const findById = db.prepare(`
    SELECT t.id, t.type, t.amount_cents AS amountCents, t.date, t.note,
           c.id AS categoryId, c.name AS categoryName
      FROM transactions t
      JOIN categories c ON c.id = t.category_id
     WHERE t.id = ?`);
  const insert = db.prepare(`
    INSERT INTO transactions (user_id, category_id, type, amount_cents, date, note)
    VALUES (?, ?, ?, ?, ?, ?)`);
  const totalsForPeriod = db.prepare(`
    SELECT type, SUM(amount_cents) AS totalCents
      FROM transactions
     WHERE user_id = ? AND substr(date, 1, 7) = ?
     GROUP BY type`);
  const spentByCategory = db.prepare(`
    SELECT category_id AS categoryId, SUM(amount_cents) AS spentCents
      FROM transactions
     WHERE user_id = ? AND type = 'EXPENSE' AND substr(date, 1, 7) = ?
     GROUP BY category_id`);

  return {
    listForUser: (userId, limit = 50) => list.all(userId, limit),
    create({ userId, categoryId, type, amountCents, date, note }) {
      const { lastInsertRowid } = insert.run(
        userId,
        categoryId,
        type,
        amountCents,
        date,
        note,
      );
      return findById.get(Number(lastInsertRowid));
    },
    totalsForPeriod: (userId, period) => totalsForPeriod.all(userId, period),
    spentByCategory: (userId, period) => spentByCategory.all(userId, period),
  };
}
