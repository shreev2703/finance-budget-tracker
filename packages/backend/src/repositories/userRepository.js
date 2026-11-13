export function createUserRepository(db) {
  return {
    async findByEmail(email) {
      const { rows } = await db.query('SELECT id,email,password_hash AS "passwordHash",name FROM users WHERE email=$1', [email]);
      return rows[0];
    },
    async findById(id) {
      const { rows } = await db.query('SELECT id,email,name FROM users WHERE id=$1', [id]);
      return rows[0];
    },
    /** Creates the user and starting categories atomically. */
    async create({ email, passwordHash, name }, categories) {
      const client = await db.connect();
      try {
        await client.query('BEGIN');
        const { rows } = await client.query('INSERT INTO users(email,password_hash,name) VALUES($1,$2,$3) RETURNING id', [email,passwordHash,name]);
        const id = rows[0].id;
        for (const [categoryName,type] of categories) {
          await client.query('INSERT INTO categories(user_id,name,type) VALUES($1,$2,$3)', [id,categoryName,type]);
        }
        await client.query('COMMIT');
        return this.findById(id);
      } catch (error) {
        await client.query('ROLLBACK');
        throw error;
      } finally {
        client.release();
      }
    },
  };
}
