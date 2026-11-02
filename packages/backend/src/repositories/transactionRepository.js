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
  const update = db.prepare(`
    UPDATE transactions
       SET category_id = ?, type = ?, amount_cents = ?, date = ?, note = ?
     WHERE id = ? AND user_id = ?`);
  const remove = db.prepare(
    'DELETE FROM transactions WHERE id = ? AND user_id = ?',
  );
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
    /** Returns the updated transaction, or undefined if the user has no transaction with this id. */
    update(id, userId, { categoryId, type, amountCents, date, note }) {
      const { changes } = update.run(
        categoryId,
        type,
        amountCents,
        date,
        note,
        id,
        userId,
      );
      return changes ? findById.get(id) : undefined;
    },
    /** Returns true if a transaction was deleted. */
    remove: (id, userId) => remove.run(id, userId).changes > 0,
    totalsForPeriod: (userId, period) => totalsForPeriod.all(userId, period),
    spentByCategory: (userId, period) => spentByCategory.all(userId, period),
  };
}
