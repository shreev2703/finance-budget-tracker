// Frontend-only demo data. This has the same public API as the former HTTP
// client, so the rest of the UI works without the backend.
const STORAGE_KEY = "ledgerlogic-demo-data-v1";

export class ApiError extends Error {
  constructor(status, message, details = []) {
    super(message);
    this.status = status;
    this.details = details; // list of validation problems from a 400 response
  }
}

export const centsToDollars = (cents) => cents / 100;

export function errorMessages(error) {
  return error.details?.length ? error.details : [error.message];
}

const currentPeriod = () => new Date().toISOString().slice(0, 7);

const dateThisMonth = (day) => {
  const today = new Date();
  const lastDay = new Date(
    today.getFullYear(),
    today.getMonth() + 1,
    0,
  ).getDate();

  return `${currentPeriod()}-${String(Math.min(day, lastDay)).padStart(2, "0")}`;
};

function initialData() {
  return {
    nextCategoryId: 8,
    nextBudgetId: 5,
    nextTransactionId: 10,

    categories: [
      { id: 1, name: "Part-time Job", type: "INCOME" },
      { id: 2, name: "Allowance", type: "INCOME" },
      { id: 3, name: "Groceries", type: "EXPENSE" },
      { id: 4, name: "Dining Out", type: "EXPENSE" },
      { id: 5, name: "Transportation", type: "EXPENSE" },
      { id: 6, name: "Entertainment", type: "EXPENSE" },
      { id: 7, name: "Textbooks & Supplies", type: "EXPENSE" },
    ],

    budgets: [
      { id: 1, categoryId: 3, period: currentPeriod(), limitCents: 20000 },
      { id: 2, categoryId: 4, period: currentPeriod(), limitCents: 10000 },
      { id: 3, categoryId: 5, period: currentPeriod(), limitCents: 6000 },
      { id: 4, categoryId: 6, period: currentPeriod(), limitCents: 5000 },
    ],

    transactions: [
      {
        id: 1,
        categoryId: 2,
        type: "INCOME",
        amountCents: 40000,
        date: dateThisMonth(1),
        note: "Monthly allowance",
      },
      {
        id: 2,
        categoryId: 1,
        type: "INCOME",
        amountCents: 32000,
        date: dateThisMonth(1),
        note: "Campus library paycheck",
      },
      {
        id: 3,
        categoryId: 3,
        type: "EXPENSE",
        amountCents: 4275,
        date: dateThisMonth(2),
        note: "Trader Joe's",
      },
      {
        id: 4,
        categoryId: 5,
        type: "EXPENSE",
        amountCents: 2500,
        date: dateThisMonth(2),
        note: "Bus pass top-up",
      },
      {
        id: 5,
        categoryId: 4,
        type: "EXPENSE",
        amountCents: 1450,
        date: dateThisMonth(2),
        note: "Pizza with roommates",
      },
      {
        id: 6,
        categoryId: 7,
        type: "EXPENSE",
        amountCents: 6899,
        date: dateThisMonth(3),
        note: "Used CSC 3100 textbook",
      },
      {
        id: 7,
        categoryId: 4,
        type: "EXPENSE",
        amountCents: 6850,
        date: dateThisMonth(4),
        note: "Birthday dinner",
      },
      {
        id: 8,
        categoryId: 6,
        type: "EXPENSE",
        amountCents: 1599,
        date: dateThisMonth(4),
        note: "Streaming subscription",
      },
      {
        id: 9,
        categoryId: 3,
        type: "EXPENSE",
        amountCents: 3810,
        date: dateThisMonth(5),
        note: "Weekly groceries",
      },
    ],
  };
}

function readData() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    return saved ? JSON.parse(saved) : initialData();
  } catch {
    return initialData();
  }
}

function writeData(data) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

function categoryFor(data, id) {
  return data.categories.find((category) => category.id === Number(id));
}

function transactionsForDisplay(data, limit) {
  const rows = data.transactions
    .map((transaction) => ({
      ...transaction,
      categoryName:
        categoryFor(data, transaction.categoryId)?.name ?? "Uncategorized",
    }))
    .sort((a, b) => b.date.localeCompare(a.date) || b.id - a.id);

  return limit ? rows.slice(0, limit) : rows;
}

function budgetStatus(limitCents, spentCents) {
  if (spentCents > limitCents) return "over";
  if (spentCents >= limitCents * 0.8) return "warning";
  return "ok";
}

function makeSummary(data, period = currentPeriod()) {
  const periodTransactions = data.transactions.filter((transaction) =>
    transaction.date.startsWith(period),
  );

  const incomeCents = periodTransactions
    .filter((transaction) => transaction.type === "INCOME")
    .reduce((total, transaction) => total + transaction.amountCents, 0);

  const expenseCents = periodTransactions
    .filter((transaction) => transaction.type === "EXPENSE")
    .reduce((total, transaction) => total + transaction.amountCents, 0);

  const budgets = data.budgets
    .filter((budget) => budget.period === period)
    .map((budget) => {
      const spentCents = periodTransactions
        .filter(
          (transaction) =>
            transaction.type === "EXPENSE" &&
            transaction.categoryId === budget.categoryId,
        )
        .reduce((total, transaction) => total + transaction.amountCents, 0);

      const category = categoryFor(data, budget.categoryId);
      const remainingCents = budget.limitCents - spentCents;

      return {
        ...budget,
        categoryName: category?.name ?? "Uncategorized",
        spentCents,
        remainingCents,
        percentUsed: Math.round((spentCents / budget.limitCents) * 100),
        status: budgetStatus(budget.limitCents, spentCents),
      };
    });

  return {
    period,
    totals: {
      incomeCents,
      expenseCents,
      balanceCents: incomeCents - expenseCents,
    },
    budgets,
  };
}

const delay = (value) => Promise.resolve(value);

export const api = {
  getSummary: (period) => delay(makeSummary(readData(), period)),

  getTransactions: (limit = 50) =>
    delay(transactionsForDisplay(readData(), limit)),

  getCategories: () =>
    delay(readData().categories.map((category) => ({ ...category }))),

  addTransaction: ({ amount, type, categoryId, date, note }) => {
    const data = readData();
    const category = categoryFor(data, categoryId);
    const errors = [];

    if (!category || category.type !== type) {
      errors.push("Choose a valid category.");
    }

    if (!Number.isFinite(amount) || amount <= 0) {
      errors.push("Enter an amount greater than 0.");
    }

    if (!/^\d{4}-\d{2}-\d{2}$/.test(date ?? "")) {
      errors.push("Choose a valid date.");
    }

    if (errors.length) {
      return Promise.reject(
        new ApiError(400, "Invalid transaction", errors),
      );
    }

    const transaction = {
      id: data.nextTransactionId++,
      categoryId: Number(categoryId),
      type,
      amountCents: Math.round(amount * 100),
      date,
      note: String(note ?? "").trim(),
    };

    data.transactions.push(transaction);
    writeData(data);

    return delay({ ...transaction });
  },

  createCategory: ({ name, type = "EXPENSE" }) => {
    const data = readData();
    const cleanName = String(name ?? "").trim();

    if (!cleanName) {
      return Promise.reject(
        new ApiError(400, "Invalid category", ["Enter a category name."]),
      );
    }

    if (
      data.categories.some(
        (category) =>
          category.name.toLowerCase() === cleanName.toLowerCase(),
      )
    ) {
      return Promise.reject(
        new ApiError(
          409,
          `You already have a category named "${cleanName}"`,
        ),
      );
    }

    const category = {
      id: data.nextCategoryId++,
      name: cleanName,
      type,
    };

    data.categories.push(category);
    writeData(data);

    return delay({ ...category });
  },

  createBudget: ({
    categoryId,
    limit,
    period = currentPeriod(),
  }) => {
    const data = readData();
    const category = categoryFor(data, categoryId);

    if (!category || category.type !== "EXPENSE") {
      return Promise.reject(
        new ApiError(400, "Invalid budget", [
          "Choose an expense category.",
        ]),
      );
    }

    if (!Number.isFinite(Number(limit)) || Number(limit) <= 0) {
      return Promise.reject(
        new ApiError(400, "Invalid budget", [
          "Enter a monthly limit greater than 0.",
        ]),
      );
    }

    if (
      data.budgets.some(
        (budget) =>
          budget.categoryId === Number(categoryId) &&
          budget.period === period,
      )
    ) {
      return Promise.reject(
        new ApiError(
          409,
          "A budget already exists for this category and month.",
        ),
      );
    }

    const budget = {
      id: data.nextBudgetId++,
      categoryId: Number(categoryId),
      period,
      limitCents: Math.round(Number(limit) * 100),
    };

    data.budgets.push(budget);
    writeData(data);

    return delay({ ...budget });
  },

  updateBudget: (budgetId, limit) => {
    const data = readData();
    const budget = data.budgets.find(
      (item) => item.id === Number(budgetId),
    );

    if (!budget) {
      return Promise.reject(new ApiError(404, "Budget not found"));
    }

    if (!Number.isFinite(Number(limit)) || Number(limit) <= 0) {
      return Promise.reject(
        new ApiError(400, "Invalid budget", [
          "Enter a monthly limit greater than 0.",
        ]),
      );
    }

    budget.limitCents = Math.round(Number(limit) * 100);
    writeData(data);

    return delay({ ...budget });
  },

  renameCategory: (categoryId, name) => {
    const data = readData();
    const category = categoryFor(data, categoryId);
    const cleanName = String(name ?? "").trim();

    if (!category) {
      return Promise.reject(new ApiError(404, "Category not found"));
    }

    if (!cleanName) {
      return Promise.reject(
        new ApiError(400, "Invalid category", ["Enter a category name."]),
      );
    }

    if (
      data.categories.some(
        (item) =>
          item.id !== category.id &&
          item.name.toLowerCase() === cleanName.toLowerCase(),
      )
    ) {
      return Promise.reject(
        new ApiError(
          409,
          `You already have a category named "${cleanName}"`,
        ),
      );
    }

    category.name = cleanName;
    writeData(data);

    return delay({ ...category });
  },

  deleteCategory: (categoryId) => {
    const data = readData();
    const id = Number(categoryId);
    const category = categoryFor(data, id);

    if (!category) {
      return Promise.reject(new ApiError(404, "Category not found"));
    }

    if (
      data.transactions.some(
        (transaction) => transaction.categoryId === id,
      )
    ) {
      return Promise.reject(
        new ApiError(
          409,
          `"${category.name}" has transactions, so it can't be deleted`,
        ),
      );
    }

    data.categories = data.categories.filter((item) => item.id !== id);
    data.budgets = data.budgets.filter(
      (budget) => budget.categoryId !== id,
    );

    writeData(data);

    return delay();
  },
};

// Optional: call this from DevTools if you ever want fresh sample data again.
export function resetDemoData() {
  localStorage.removeItem(STORAGE_KEY);
}
