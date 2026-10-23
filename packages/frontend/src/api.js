// API client for the LedgerLogic backend. Every call goes through /api (proxied to port 3001 by Vite).
// Money comes back from the API in cents; use centsToDollars() to display it.

export class ApiError extends Error {
  constructor(status, message, details = []) {
    super(message);
    this.status = status;
    this.details = details; // list of validation problems from a 400 response
  }
}

async function request(path, { method = 'GET', body } = {}) {
  const res = await fetch(`/api${path}`, {
    method,
    headers: body ? { 'Content-Type': 'application/json' } : undefined,
    body: body ? JSON.stringify(body) : undefined,
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new ApiError(
      res.status,
      data.error ?? `Request failed (${res.status})`,
      data.details,
    );
  }
  return data;
}

export const centsToDollars = (cents) => cents / 100;

export const api = {
  /** Monthly totals + every budget's spent / remaining / status ('ok' | 'warning' | 'over'). */
  getSummary: (period) =>
    request(`/budgets/summary${period ? `?period=${period}` : ''}`),

  /** Transactions, newest first. */
  getTransactions: (limit = 50) => request(`/transactions?limit=${limit}`),

  /** Income and expense categories, each with its budgetId and limitCents for this month. */
  getCategories: () => request('/categories'),

  /** { amount (dollars), type: 'INCOME' | 'EXPENSE', categoryId, date: 'YYYY-MM-DD', note } */
  addTransaction: (transaction) =>
    request('/transactions', { method: 'POST', body: transaction }),

  /** { categoryId, limit (dollars), period?: 'YYYY-MM' } */
  createBudget: (budget) =>
    request('/budgets', { method: 'POST', body: budget }),

  /** Change an existing budget's monthly limit (dollars). */
  updateBudget: (budgetId, limit) =>
    request(`/budgets/${budgetId}`, { method: 'PUT', body: { limit } }),
};
