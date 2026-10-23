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

  return {
    listForUser: (userId, period) => list.all(period, userId),
    findForUser: (id, userId) => findForUser.get(id, userId),
  };
}
