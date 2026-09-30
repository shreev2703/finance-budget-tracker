import { HttpError } from '../middleware/errorHandler.js';

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

/** Validates and records transactions (US-01 log expense, US-02 record income). */
export function createTransactionService({ transactions, categories }) {
  return {
    list: (userId, limit) => transactions.listForUser(userId, limit),

    create(userId, input) {
      const errors = [];
      const amount = Number(input?.amount);
      const amountCents = Math.round(amount * 100);
      if (!Number.isFinite(amount) || amountCents <= 0)
        errors.push('amount must be a positive number');
      if (amount > 1_000_000) errors.push('amount is too large');

      const type = input?.type;
      if (type !== 'INCOME' && type !== 'EXPENSE')
        errors.push('type must be INCOME or EXPENSE');

      const date = input?.date;
      if (
        typeof date !== 'string' ||
        !DATE_RE.test(date) ||
        Number.isNaN(Date.parse(date))
      ) {
        errors.push('date must be YYYY-MM-DD');
      }

      const note =
        typeof input?.note === 'string' ? input.note.trim().slice(0, 200) : '';

      const categoryId = Number(input?.categoryId);
      const category = Number.isInteger(categoryId)
        ? categories.findForUser(categoryId, userId)
        : undefined;
      if (!category) errors.push('categoryId must be one of your categories');
      else if (type && category.type !== type)
        errors.push(`category "${category.name}" is not ${type}`);

      if (errors.length)
        throw new HttpError(400, 'Invalid transaction', errors);
      return transactions.create({
        userId,
        categoryId,
        type,
        amountCents,
        date,
        note,
      });
    },
  };
}
