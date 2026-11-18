/** Bank connections (Plaid) and the transactions imported from them (#94). */
export function createBankRepository(db) {
  return {
    async findConnection(userId) {
      const { rows } = await db.query(
        'SELECT item_id AS "itemId", access_token_enc AS "accessTokenEnc", sync_cursor AS "cursor" FROM bank_connections WHERE user_id=$1',
        [userId],
      );
      return rows[0];
    },

    /** One connection per user: connecting again replaces the old one and restarts the sync. */
    async saveConnection(userId, itemId, accessTokenEnc) {
      await db.query(
        `INSERT INTO bank_connections (user_id, item_id, access_token_enc, sync_cursor) VALUES ($1, $2, $3, NULL)
         ON CONFLICT (user_id) DO UPDATE SET item_id=EXCLUDED.item_id, access_token_enc=EXCLUDED.access_token_enc, sync_cursor=NULL`,
        [userId, itemId, accessTokenEnc],
      );
    },

    async saveCursor(userId, cursor) {
      await db.query('UPDATE bank_connections SET sync_cursor=$1 WHERE user_id=$2', [cursor, userId]);
    },

    /** Saves an imported transaction once: a second import of the same bank transaction is skipped. */
    async insertImported(userId, categoryId, tx) {
      const { rowCount } = await db.query(
        `INSERT INTO transactions (user_id, category_id, type, amount_cents, date, note, plaid_transaction_id)
         VALUES ($1, $2, $3, $4, $5, $6, $7) ON CONFLICT (user_id, plaid_transaction_id) DO NOTHING`,
        [userId, categoryId, tx.type, tx.amountCents, tx.date, tx.note, tx.plaidTransactionId],
      );
      return rowCount > 0;
    },
  };
}
