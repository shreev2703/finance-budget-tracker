/** Budget domain rules (UML: Budget.remaining(), Budget.isOverLimit(); US-08, US-09). */
export const WARNING_THRESHOLD = 0.8;

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
