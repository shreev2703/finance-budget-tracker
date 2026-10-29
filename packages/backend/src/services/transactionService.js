import { HttpError } from '../middleware/errorHandler.js';
import { validateTransaction } from '../domain/transaction.js';

/**
 * Validates and records transactions (US-01 log expense, US-02 record income,
 * US-03 edit and delete).
 */
export function createTransactionService({ transactions, categories }) {
  function validOrThrow(userId, input) {
    const { errors, transaction } = validateTransaction(input, (id) =>
      categories.findForUser(id, userId),
    );
    if (errors.length) {
      throw new HttpError(400, 'Invalid transaction', errors);
    }
    return transaction;
  }

  return {
    list: (userId, limit) => transactions.listForUser(userId, limit),

    create(userId, input) {
      return transactions.create({ userId, ...validOrThrow(userId, input) });
    },

    update(userId, id, input) {
      const updated = transactions.update(
        Number(id),
        userId,
        validOrThrow(userId, input),
      );
      if (!updated) throw new HttpError(404, 'Transaction not found');
      return updated;
    },

    remove(userId, id) {
      if (!transactions.remove(Number(id), userId)) {
        throw new HttpError(404, 'Transaction not found');
      }
    },
  };
}
