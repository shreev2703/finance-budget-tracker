import { remaining, budgetStatus } from '../domain/budget.js';

/** Builds the dashboard summary: income/expense totals (US-04) + per-category budgets (US-08, US-09). */
export function createBudgetService({ transactions, budgets }) {
  return {
    summary(userId, period) {
      const totals = { incomeCents: 0, expenseCents: 0 };
      for (const row of transactions.totalsForPeriod(userId, period)) {
        if (row.type === 'INCOME') totals.incomeCents = row.totalCents;
        else totals.expenseCents = row.totalCents;
      }
      totals.balanceCents = totals.incomeCents - totals.expenseCents;

      const spent = new Map(
        transactions
          .spentByCategory(userId, period)
          .map((r) => [r.categoryId, r.spentCents]),
      );
      const items = budgets.listForPeriod(userId, period).map((b) => {
        const spentCents = spent.get(b.categoryId) ?? 0;
        return {
          id: b.id,
          categoryId: b.categoryId,
          categoryName: b.categoryName,
          limitCents: b.limitCents,
          spentCents,
          remainingCents: remaining(b.limitCents, spentCents),
          percentUsed: Math.round((spentCents / b.limitCents) * 100),
          status: budgetStatus(b.limitCents, spentCents),
        };
      });

      return { period, totals, budgets: items };
    },
  };
}
