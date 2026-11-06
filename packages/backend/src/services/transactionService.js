import { HttpError } from '../middleware/errorHandler.js';
import { dateError, validateTransaction } from '../domain/transaction.js';

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

  /** US-06: checks the optional filters. Blank values mean "no filter". */
  function cleanFilters(userId, { categoryId, from, to }) {
    const filters = {
      categoryId: categoryId ? Number(categoryId) : undefined,
      from: from || undefined,
      to: to || undefined,
    };
    const errors = [];
    if (categoryId && !categories.findForUser(filters.categoryId, userId)) {
      errors.push('categoryId must be one of your categories');
    }
    if (filters.from && dateError(filters.from)) {
      errors.push('from must be YYYY-MM-DD');
    }
    if (filters.to && dateError(filters.to)) {
      errors.push('to must be YYYY-MM-DD');
    }
    if (!errors.length && filters.from > filters.to) {
      errors.push('The From date must not be after the To date.');
    }
    if (errors.length) throw new HttpError(400, 'Invalid filter', errors);
    return filters;
  }

  return {
    list: (userId, limit, filters = {}) =>
      transactions.listForUser(userId, limit, cleanFilters(userId, filters)),

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
