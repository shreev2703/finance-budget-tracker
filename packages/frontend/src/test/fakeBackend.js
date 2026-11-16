// A small in-memory stand-in for the LedgerLogic API, used by the UI tests in place of `fetch`.
// It answers the same URLs with the same JSON shapes as packages/backend, seeded with the
// demo account's numbers, so the real api.js, pages, and components run unchanged.
import { vi } from "vitest";

export const DEMO = {
  email: "demo@ledgerlogic.app",
  password: "demo-password",
  name: "Demo Student",
};
const TOKEN = "test-token";
const WARNING_THRESHOLD = 0.8;

const thisMonth = () => new Date().toLocaleDateString("en-CA").slice(0, 7);

function seed() {
  const period = thisMonth();
  const categories = [
    { id: 1, name: "Part-time Job", type: "INCOME" },
    { id: 2, name: "Allowance", type: "INCOME" },
    { id: 3, name: "Groceries", type: "EXPENSE" },
    { id: 4, name: "Dining Out", type: "EXPENSE" },
    { id: 5, name: "Transportation", type: "EXPENSE" },
    { id: 6, name: "Entertainment", type: "EXPENSE" },
    { id: 7, name: "Textbooks & Supplies", type: "EXPENSE" },
  ];
  const budgets = [
    { id: 1, categoryId: 3, limitCents: 20000 },
    { id: 2, categoryId: 4, limitCents: 10000 },
    { id: 3, categoryId: 5, limitCents: 6000 },
    { id: 4, categoryId: 6, limitCents: 5000 },
  ];
  const rows = [
    [2, "INCOME", 40000, "Monthly allowance"],
    [1, "INCOME", 32000, "Campus library paycheck"],
    [3, "EXPENSE", 4275, "Trader Joe's"],
    [5, "EXPENSE", 2500, "Bus pass top-up"],
    [4, "EXPENSE", 1450, "Pizza with roommates"],
    [7, "EXPENSE", 6899, "Used CSC 3100 textbook"],
    [4, "EXPENSE", 6850, "Birthday dinner"],
    [6, "EXPENSE", 1599, "Streaming subscription"],
    [3, "EXPENSE", 3810, "Weekly groceries"],
  ];
  const transactions = rows.map(([categoryId, type, amountCents, note], i) => ({
    id: i + 1,
    categoryId,
    type,
    amountCents,
    date: `${period}-01`,
    note,
  }));
  return { period, categories, budgets, transactions, nextId: rows.length + 1 };
}

const json = (status, body) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });

/** Replaces global fetch with the fake API. Returns its data so tests can check what was saved. */
export function installFakeBackend() {
  const db = seed();
  const categoryName = (id) => db.categories.find((c) => c.id === id)?.name;
  const withName = (t) => ({ ...t, categoryName: categoryName(t.categoryId) });
  const inMonth = () =>
    db.transactions.filter((t) => t.date.startsWith(db.period));
  const spentIn = (categoryId) =>
    inMonth()
      .filter((t) => t.type === "EXPENSE" && t.categoryId === categoryId)
      .reduce((sum, t) => sum + t.amountCents, 0);

  const routes = {
    "POST /api/auth/login": ({ body }) =>
      body.email === DEMO.email && body.password === DEMO.password
        ? json(200, { token: TOKEN, user: { id: 1, email: DEMO.email, name: DEMO.name } })
        : json(401, { error: "Incorrect email or password." }),

    "GET /api/auth/me": () => json(200, { id: 1, email: DEMO.email, name: DEMO.name }),

    "GET /api/budgets/summary": () => {
      const total = (type) =>
        inMonth()
          .filter((t) => t.type === type)
          .reduce((sum, t) => sum + t.amountCents, 0);
      const incomeCents = total("INCOME");
      const expenseCents = total("EXPENSE");
      const budgets = db.budgets.map((b) => {
        const spentCents = spentIn(b.categoryId);
        return {
          id: b.id,
          categoryId: b.categoryId,
          categoryName: categoryName(b.categoryId),
          limitCents: b.limitCents,
          spentCents,
          remainingCents: b.limitCents - spentCents,
          percentUsed: Math.round((spentCents / b.limitCents) * 100),
          status:
            spentCents > b.limitCents
              ? "over"
              : spentCents >= b.limitCents * WARNING_THRESHOLD
                ? "warning"
                : "ok",
        };
      });
      return json(200, {
        period: db.period,
        totals: { incomeCents, expenseCents, balanceCents: incomeCents - expenseCents },
        budgets,
      });
    },

    "GET /api/reports/spending-by-category": () => {
      const categories = db.categories
        .filter((c) => c.type === "EXPENSE")
        .map((c) => ({ categoryId: c.id, categoryName: c.name, spentCents: spentIn(c.id) }))
        .filter((c) => c.spentCents > 0)
        .sort((a, b) => b.spentCents - a.spentCents);
      const totalCents = categories.reduce((sum, c) => sum + c.spentCents, 0);
      return json(200, {
        period: db.period,
        totalCents,
        categories: categories.map((c) => ({
          ...c,
          percent: Math.round((c.spentCents / totalCents) * 100),
        })),
      });
    },

    "GET /api/categories": () =>
      json(
        200,
        db.categories.map((c) => {
          const budget = db.budgets.find((b) => b.categoryId === c.id);
          return { ...c, budgetId: budget?.id ?? null, limitCents: budget?.limitCents ?? null };
        }),
      ),

    "GET /api/transactions": ({ url }) => {
      const limit = Number(url.searchParams.get("limit")) || 50;
      const newestFirst = [...db.transactions].sort(
        (a, b) => b.date.localeCompare(a.date) || b.id - a.id,
      );
      return json(200, newestFirst.slice(0, limit).map(withName));
    },

    // The same rules the real API applies (packages/backend/src/domain/transaction.js).
    "POST /api/transactions": ({ body }) => {
      const errors = [];
      if (!(body.amount > 0)) errors.push("amount must be a positive number");
      const category = db.categories.find((c) => c.id === body.categoryId);
      if (!category) errors.push("categoryId must be one of your categories");
      else if (category.type !== body.type) {
        errors.push(`category "${category.name}" is not ${body.type}`);
      }
      if (errors.length) {
        return json(400, { error: "Invalid transaction", details: errors });
      }
      const saved = {
        id: db.nextId++,
        categoryId: body.categoryId,
        type: body.type,
        amountCents: Math.round(body.amount * 100),
        date: body.date,
        note: (body.note ?? "").trim(),
      };
      db.transactions.push(saved);
      return json(201, withName(saved));
    },
  };

  vi.spyOn(globalThis, "fetch").mockImplementation(async (input, init = {}) => {
    const url = new URL(input, "http://localhost");
    const method = init.method ?? "GET";
    const route = routes[`${method} ${url.pathname}`];
    if (!route) return json(404, { error: `No route for ${method} ${url.pathname}` });
    const isPublic = url.pathname.startsWith("/api/auth/login");
    if (!isPublic && init.headers?.Authorization !== `Bearer ${TOKEN}`) {
      return json(401, { error: "Please log in to continue." });
    }
    return route({ url, body: init.body ? JSON.parse(init.body) : {} });
  });

  return db;
}
