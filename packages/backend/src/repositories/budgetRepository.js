export function createBudgetRepository(db) {
  const columns = `
    SELECT b.id, b.period, b.limit_amount_cents AS limitCents,
           c.id AS categoryId, c.name AS categoryName
      FROM budgets b
      JOIN categories c ON c.id = b.category_id`;

  const listForPeriod = db.prepare(`${columns}
     WHERE b.user_id = ? AND b.period = ?
     ORDER BY c.name`);
  const findForUser = db.prepare(`${columns}
     WHERE b.id = ? AND b.user_id = ?`);
  const findForCategory = db.prepare(`${columns}
     WHERE b.user_id = ? AND b.category_id = ? AND b.period = ?`);
  const insert = db.prepare(`
    INSERT INTO budgets (user_id, category_id, period, limit_amount_cents)
    VALUES (?, ?, ?, ?)`);
  const updateLimit = db.prepare(
    'UPDATE budgets SET limit_amount_cents = ? WHERE id = ? AND user_id = ?',
  );

  return {
    listForPeriod: (userId, period) => listForPeriod.all(userId, period),
    findForUser: (id, userId) => findForUser.get(id, userId),
    findForCategory: (userId, categoryId, period) =>
      findForCategory.get(userId, categoryId, period),
    create({ userId, categoryId, period, limitCents }) {
      const { lastInsertRowid } = insert.run(
        userId,
        categoryId,
        period,
        limitCents,
      );
      return findForUser.get(Number(lastInsertRowid), userId);
    },
    updateLimit(id, userId, limitCents) {
      updateLimit.run(limitCents, id, userId);
      return findForUser.get(id, userId);
    },
  };
}
