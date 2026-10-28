/** Budget domain rules (UML: Budget.remaining(), Budget.isOverLimit(), Budget.setLimit(); US-08, US-09). */
export const WARNING_THRESHOLD = 0.8;
export const MAX_LIMIT_DOLLARS = 1_000_000;

const PERIOD_PATTERN = /^\d{4}-(0[1-9]|1[0-2])$/;

export function remaining(limitCents, spentCents) {
  return limitCents - spentCents;
}

export function isOverLimit(limitCents, spentCents) {
  return spentCents > limitCents;
}

/** 'ok' | 'warning' (>= 80% used, US-09) | 'over' */
export function budgetStatus(limitCents, spentCents) {
  if (isOverLimit(limitCents, spentCents)) return 'over';
  if (spentCents >= limitCents * WARNING_THRESHOLD) return 'warning';
  return 'ok';
}

export function limitToCents(limitDollars) {
  return Math.round(limitDollars * 100);
}

export function limitError(limit) {
  if (!Number.isFinite(limit) || limitToCents(limit) <= 0) {
    return 'limit must be a positive number';
  }
  if (limit > MAX_LIMIT_DOLLARS) return 'limit is too large';
  return null;
}

export function periodError(period) {
  return typeof period === 'string' && PERIOD_PATTERN.test(period)
    ? null
    : 'period must be YYYY-MM';
}

/** Budgets only make sense for the user's own expense categories. */
export function budgetCategoryError(category) {
  if (!category) return 'categoryId must be one of your categories';
  if (category.type !== 'EXPENSE') {
    return `category "${category.name}" is not an expense category`;
  }
  return null;
}
