export function createCategoryRepository(db) {
  const list = db.prepare(
    'SELECT id, name, type FROM categories WHERE user_id = ? ORDER BY type DESC, name',
  );
  const findForUser = db.prepare(
    'SELECT id, name, type FROM categories WHERE id = ? AND user_id = ?',
  );

  return {
    listForUser: (userId) => list.all(userId),
    findForUser: (id, userId) => findForUser.get(id, userId),
  };
}
