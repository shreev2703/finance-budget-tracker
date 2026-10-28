/** Transaction domain rules (UML: Transaction.validate(); US-01, US-02). */
export const TRANSACTION_TYPES = ['INCOME', 'EXPENSE'];
export const MAX_AMOUNT_DOLLARS = 1_000_000;
export const MAX_NOTE_LENGTH = 200;

const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

export function toCents(dollars) {
  return Math.round(dollars * 100);
}

export function amountError(amount) {
  if (!Number.isFinite(amount) || toCents(amount) <= 0) {
    return 'amount must be a positive number';
  }
  if (amount > MAX_AMOUNT_DOLLARS) return 'amount is too large';
  return null;
}

export function typeError(type) {
  return TRANSACTION_TYPES.includes(type)
    ? null
    : 'type must be INCOME or EXPENSE';
}

export function dateError(date) {
  const isValid =
    typeof date === 'string' &&
    DATE_PATTERN.test(date) &&
    !Number.isNaN(Date.parse(date));
  return isValid ? null : 'date must be YYYY-MM-DD';
}

export function categoryError(category, type) {
  if (!category) return 'categoryId must be one of your categories';
  if (type && category.type !== type) {
    return `category "${category.name}" is not ${type}`;
  }
  return null;
}

export function cleanNote(note) {
  return typeof note === 'string' ? note.trim().slice(0, MAX_NOTE_LENGTH) : '';
}

/**
 * Checks a new transaction against every rule.
 * `findCategory(id)` returns the user's category or undefined.
 * Returns the list of problems (empty when valid) and the cleaned values to save.
 */
export function validateTransaction(input, findCategory) {
  const amount = Number(input?.amount);
  const type = input?.type;
  const date = input?.date;
  const categoryId = Number(input?.categoryId);
  const category = Number.isInteger(categoryId)
    ? findCategory(categoryId)
    : undefined;

  const errors = [
    amountError(amount),
    typeError(type),
    dateError(date),
    categoryError(category, type),
  ].filter(Boolean);

  return {
    errors,
    transaction: {
      categoryId,
      type,
      amountCents: toCents(amount),
      date,
      note: cleanNote(input?.note),
    },
  };
}
