import { HttpError } from '../middleware/errorHandler.js';
import {
  remaining,
  budgetStatus,
  limitToCents,
  limitError,
  periodError,
  budgetCategoryError,
} from '../domain/budget.js';

/**
 * Dashboard summary: income/expense totals (US-04) + per-category budgets (US-08, US-09).
 * Setting and editing a category's monthly limit (US-08).
 */
export function createBudgetService({ transactions, budgets, categories }) {
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

    /** Sets a monthly limit for one expense category. One budget per category per month. */
    create(userId, { categoryId, limit, period }) {
      const id = Number(categoryId);
      const category = Number.isInteger(id)
        ? categories.findForUser(id, userId)
        : undefined;
      const amount = Number(limit);
      const errors = [
        budgetCategoryError(category),
        limitError(amount),
        periodError(period),
      ].filter(Boolean);
      if (errors.length) throw new HttpError(400, 'Invalid budget', errors);

      const existing = budgets.findForCategory(userId, id, period);
      if (existing) {
        throw new HttpError(
          409,
          'A budget already exists for this category and month',
          [`use PUT /api/budgets/${existing.id} to change it`],
        );
      }
      return budgets.create({
        userId,
        categoryId: id,
        period,
        limitCents: limitToCents(amount),
      });
    },

    /** Changes the monthly limit of one of the user's budgets. */
    updateLimit(userId, budgetId, { limit }) {
      const budget = budgets.findForUser(Number(budgetId), userId);
      if (!budget) throw new HttpError(404, 'Budget not found');

      const amount = Number(limit);
      const error = limitError(amount);
      if (error) throw new HttpError(400, 'Invalid budget', [error]);

      return budgets.updateLimit(budget.id, userId, limitToCents(amount));
    },
  };
}
