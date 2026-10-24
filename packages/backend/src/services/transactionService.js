import { HttpError } from '../middleware/errorHandler.js';
import { validateTransaction } from '../domain/transaction.js';

/** Validates and records transactions (US-01 log expense, US-02 record income). */
export function createTransactionService({ transactions, categories }) {
  return {
    list: (userId, limit) => transactions.listForUser(userId, limit),

    create(userId, input) {
      const { errors, transaction } = validateTransaction(input, (id) =>
        categories.findForUser(id, userId),
      );
      if (errors.length) {
        throw new HttpError(400, 'Invalid transaction', errors);
      }
      return transactions.create({ userId, ...transaction });
    },
  };
}
