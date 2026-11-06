// API client for the LedgerLogic backend. Every call goes through /api (proxied to port 3001 by Vite).
// Money comes back from the API in cents; use centsToDollars() to display it.
// Run with VITE_DEMO=1 to use browser-only demo data instead of the backend.
import { ApiError, errorMessages } from "./apiError.js";
import { demoApi } from "./demoApi.js";
import { clearToken, getToken, setToken } from "./token.js";

export { ApiError, errorMessages };

const isDemo = import.meta.env.VITE_DEMO === "1";

export const centsToDollars = (cents) => cents / 100;

let onUnauthorized = () => {};

/** Called when the API rejects the stored token, so the app can return to the login page. */
export function setUnauthorizedHandler(handler) {
  onUnauthorized = handler;
}

async function request(path, { method = "GET", body } = {}) {
  const token = getToken();
  const headers = {};
  if (body) headers["Content-Type"] = "application/json";
  if (token) headers.Authorization = `Bearer ${token}`;

  const res = await fetch(`/api${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    if (res.status === 401 && token) {
      clearToken();
      onUnauthorized();
    }
    throw new ApiError(
      res.status,
      data.error ?? `Request failed (${res.status})`,
      data.details,
    );
  }
  return data;
}

// Sign-up and login return { token, user }: keep the token and hand back the user.
const startSession = ({ token, user }) => {
  setToken(token);
  return user;
};

const httpApi = {
  /** { name, email, password } */
  register: (account) =>
    request("/auth/register", { method: "POST", body: account }).then(
      startSession,
    ),

  /** { email, password } */
  login: (credentials) =>
    request("/auth/login", { method: "POST", body: credentials }).then(
      startSession,
    ),

  /** The logged-in user, from the stored token. */
  me: () => request("/auth/me"),

  /** Monthly totals + every budget's spent / remaining / status ('ok' | 'warning' | 'over'). */
  getSummary: (period) =>
    request(`/budgets/summary${period ? `?period=${period}` : ""}`),

  /** Transactions, newest first. Optional filters: { categoryId, from, to } (blank means no filter). */
  getTransactions: (limit = 50, filters = {}) =>
    request(`/transactions?${new URLSearchParams({ limit, ...filters })}`),

  /** { period, totalCents, categories: [{ categoryId, categoryName, spentCents, percent }] }, largest first. */
  getSpendingByCategory: (period) =>
    request(
      `/reports/spending-by-category${period ? `?period=${period}` : ""}`,
    ),

  /** Income and expense categories, each with its budgetId and limitCents for this month. */
  getCategories: () => request("/categories"),

  /** { amount (dollars), type: 'INCOME' | 'EXPENSE', categoryId, date: 'YYYY-MM-DD', note } */
  addTransaction: (transaction) =>
    request("/transactions", { method: "POST", body: transaction }),

  /** Same fields as addTransaction. */
  updateTransaction: (transactionId, transaction) =>
    request(`/transactions/${transactionId}`, {
      method: "PUT",
      body: transaction,
    }),

  deleteTransaction: (transactionId) =>
    request(`/transactions/${transactionId}`, { method: "DELETE" }),

  /** { categoryId, limit (dollars), period?: 'YYYY-MM' } */
  createBudget: (budget) =>
    request("/budgets", { method: "POST", body: budget }),

  /** Change an existing budget's monthly limit (dollars). */
  updateBudget: (budgetId, limit) =>
    request(`/budgets/${budgetId}`, { method: "PUT", body: { limit } }),

  /** { name, type?: 'EXPENSE' | 'INCOME' } (defaults to EXPENSE) */
  createCategory: (category) =>
    request("/categories", { method: "POST", body: category }),

  renameCategory: (categoryId, name) =>
    request(`/categories/${categoryId}`, { method: "PUT", body: { name } }),

  /** Fails with 409 if the category still has transactions. */
  deleteCategory: (categoryId) =>
    request(`/categories/${categoryId}`, { method: "DELETE" }),
};

export const api = isDemo ? demoApi : httpApi;
