export class ApiError extends Error {
  constructor(status, message, details = []) {
    super(message);
    this.status = status;
    this.details = details;
  }
}

async function request(path, { method = "GET", body } = {}) {
  const response = await fetch(`/api${path}`, {
    method,
    headers: body ? { "Content-Type": "application/json" } : undefined,
    body: body ? JSON.stringify(body) : undefined,
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new ApiError(
      response.status,
      data.error ?? `Request failed (${response.status})`,
      data.details,
    );
  }

  return data;
}

export const centsToDollars = (cents) => cents / 100;

export const api = {
  getSummary: (period) =>
    request(`/budgets/summary${period ? `?period=${period}` : ""}`),

  getTransactions: (limit = 50) =>
    request(`/transactions?limit=${limit}`),
};