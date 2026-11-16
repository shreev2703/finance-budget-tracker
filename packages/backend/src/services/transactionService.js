import { HttpError } from '../middleware/errorHandler.js';
import { dateError, validateTransaction } from '../domain/transaction.js';
import { parseId } from '../domain/id.js';

/**
 * Validates and records transactions (US-01 log expense, US-02 record income,
 * US-03 edit and delete).
 */
export function createTransactionService({ transactions, categories }) {
  async function validOrThrow(userId, input) {
    const id = parseId(input?.categoryId);
    const category = id ? await categories.findForUser(id, userId) : undefined;
    const { errors, transaction } = validateTransaction(input, (categoryId) => categoryId === id ? category : undefined);
    if (errors.length) {
      throw new HttpError(400, 'Invalid transaction', errors);
    }
    return transaction;
  }

  /** US-06: checks the optional filters. Blank values mean "no filter". */
  async function cleanFilters(userId, { categoryId, from, to }) {
    const filters = {
      categoryId: categoryId ? parseId(categoryId) : undefined,
      from: from || undefined,
      to: to || undefined,
    };
    const errors = [];
    if (
      categoryId &&
      !(filters.categoryId &&
        (await categories.findForUser(filters.categoryId, userId)))
    ) {
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
    async list(userId, limit, filters = {}) {
      return transactions.listForUser(userId, limit, await cleanFilters(userId, filters));
    },

    async create(userId, input) {
      return transactions.create({ userId, ...await validOrThrow(userId, input) });
    },

    async update(userId, id, input) {
      const updated = await transactions.update(
        Number(id),
        userId,
        await validOrThrow(userId, input),
      );
      if (!updated) throw new HttpError(404, 'Transaction not found');
      return updated;
    },

    async remove(userId, id) {
      if (!await transactions.remove(Number(id), userId)) {
        throw new HttpError(404, 'Transaction not found');
      }
    },
  };
}
