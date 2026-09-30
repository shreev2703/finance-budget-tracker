export function createBudgetRepository(db) {
  const listForPeriod = db.prepare(`
    SELECT b.id, b.period, b.limit_amount_cents AS limitCents,
           c.id AS categoryId, c.name AS categoryName
      FROM budgets b
      JOIN categories c ON c.id = b.category_id
     WHERE b.user_id = ? AND b.period = ?
     ORDER BY c.name`);

  return {
    listForPeriod: (userId, period) => listForPeriod.all(userId, period),
  };
}
