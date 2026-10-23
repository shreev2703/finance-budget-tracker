import { useCallback, useEffect, useState } from 'react';
import { api, centsToDollars } from './api.js';

// Bar colors for budgeted categories, assigned in order.
const CATEGORY_COLORS = ['#1c9457', '#d69b0c', '#d66b38', '#15916c', '#d28d07', '#35a076'];

/**
 * Loads the user's categories and this month's budget summary from the API.
 * `budgetCategories` is the list the dashboard's category cards show:
 * expense categories that have a monthly limit, with how much has been spent.
 * Call `refresh()` after any change so every screen shows the new numbers.
 */
export function useLedgerData() {
  const [data, setData] = useState({
    categories: [],
    budgetCategories: [],
    summary: null,
    loading: true,
    error: null,
  });

  const refresh = useCallback(async () => {
    try {
      const [categories, summary] = await Promise.all([
        api.getCategories(),
        api.getSummary(),
      ]);
      const budgetsByCategory = new Map(
        summary.budgets.map((budget) => [budget.categoryId, budget]),
      );
      const budgetCategories = categories
        .filter((category) => category.type === 'EXPENSE' && category.budgetId)
        .map((category, index) => {
          const budget = budgetsByCategory.get(category.id);
          return {
            id: category.id,
            budgetId: category.budgetId,
            name: category.name,
            budget: centsToDollars(category.limitCents),
            spent: centsToDollars(budget?.spentCents ?? 0),
            status: budget?.status ?? 'ok',
            color: CATEGORY_COLORS[index % CATEGORY_COLORS.length],
          };
        });
      setData({ categories, budgetCategories, summary, loading: false, error: null });
    } catch (error) {
      setData((current) => ({ ...current, loading: false, error: error.message }));
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return { ...data, refresh };
}
