export function createCategoryRepository(db) {
  // Each category with its budget for the given month (null when there isn't one).
  const list = db.prepare(`
    SELECT c.id, c.name, c.type,
           b.id AS budgetId, b.limit_amount_cents AS limitCents
      FROM categories c
      LEFT JOIN budgets b ON b.category_id = c.id AND b.period = ?
     WHERE c.user_id = ?
     ORDER BY c.type DESC, c.name`);
  const findForUser = db.prepare(
    'SELECT id, name, type FROM categories WHERE id = ? AND user_id = ?',
  );
  const findByName = db.prepare(
    'SELECT id, name, type FROM categories WHERE user_id = ? AND name = ? COLLATE NOCASE',
  );
  const insert = db.prepare(
    'INSERT INTO categories (user_id, name, type) VALUES (?, ?, ?)',
  );
  const rename = db.prepare(
    'UPDATE categories SET name = ? WHERE id = ? AND user_id = ?',
  );
  const countTransactions = db.prepare(
    'SELECT COUNT(*) AS count FROM transactions WHERE category_id = ? AND user_id = ?',
  );
  const deleteBudgets = db.prepare(
    'DELETE FROM budgets WHERE category_id = ? AND user_id = ?',
  );
  const deleteCategory = db.prepare(
    'DELETE FROM categories WHERE id = ? AND user_id = ?',
  );

  return {
    listForUser: (userId, period) => list.all(period, userId),
    findForUser: (id, userId) => findForUser.get(id, userId),
    findByName: (userId, name) => findByName.get(userId, name),
    create(userId, name, type) {
      const { lastInsertRowid } = insert.run(userId, name, type);
      return findForUser.get(Number(lastInsertRowid), userId);
    },
    rename(id, userId, name) {
      rename.run(name, id, userId);
      return findForUser.get(id, userId);
    },
    transactionCount: (id, userId) => countTransactions.get(id, userId).count,
    /** Deletes the category and its budgets. */
    remove(id, userId) {
      deleteBudgets.run(id, userId);
      deleteCategory.run(id, userId);
    },
  };
}
