export function createUserRepository(db) {
  const findByEmail = db.prepare(
    'SELECT id, email, password_hash AS passwordHash, name FROM users WHERE email = ?',
  );
  const findById = db.prepare('SELECT id, email, name FROM users WHERE id = ?');
  const insertUser = db.prepare(
    'INSERT INTO users (email, password_hash, name) VALUES (?, ?, ?)',
  );
  const insertCategory = db.prepare(
    'INSERT INTO categories (user_id, name, type) VALUES (?, ?, ?)',
  );

  return {
    findByEmail: (email) => findByEmail.get(email),
    findById: (id) => findById.get(id),
    /** Creates the user and their starting categories together, or neither. Never returns the hash. */
    create({ email, passwordHash, name }, categories) {
      db.exec('BEGIN');
      try {
        const id = Number(
          insertUser.run(email, passwordHash, name).lastInsertRowid,
        );
        for (const [categoryName, type] of categories) {
          insertCategory.run(id, categoryName, type);
        }
        db.exec('COMMIT');
        return findById.get(id);
      } catch (error) {
        db.exec('ROLLBACK');
        throw error;
      }
    },
  };
}
