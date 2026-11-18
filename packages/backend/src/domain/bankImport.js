/** Rules for turning a bank transaction from Plaid into a LedgerLogic transaction (#94). */
import { MAX_NOTE_LENGTH } from './transaction.js';

export const OTHER_EXPENSE = 'Other';
export const OTHER_INCOME = 'Other income';

// Plaid's personal_finance_category: detailed values first, then primary ones.
const EXPENSE_CATEGORY = {
  FOOD_AND_DRINK_GROCERIES: 'Groceries',
  FOOD_AND_DRINK: 'Dining Out',
  TRANSPORTATION: 'Transportation',
  TRAVEL: 'Transportation',
  ENTERTAINMENT: 'Entertainment',
  GENERAL_MERCHANDISE_BOOKSTORES_AND_NEWSSTANDS: 'Textbooks & Supplies',
  GENERAL_MERCHANDISE_OFFICE_SUPPLIES: 'Textbooks & Supplies',
};

/** The expense category name for a Plaid transaction, or OTHER_EXPENSE. */
export function expenseCategoryFor(plaidTx) {
  const pfc = plaidTx.personal_finance_category ?? {};
  return (
    EXPENSE_CATEGORY[pfc.detailed] ??
    EXPENSE_CATEGORY[pfc.primary] ??
    OTHER_EXPENSE
  );
}

/**
 * The LedgerLogic transaction for a Plaid one, or null to skip it.
 * Plaid amounts are positive for money leaving the account and negative for money
 * coming in. Pending transactions are skipped until they post, so nothing is counted twice.
 */
export function toLedgerTransaction(plaidTx) {
  if (plaidTx.pending) return null;
  const cents = Math.round(Number(plaidTx.amount) * 100);
  if (!Number.isFinite(cents) || cents === 0) return null;
  const isIncome = cents < 0;
  return {
    plaidTransactionId: plaidTx.transaction_id,
    type: isIncome ? 'INCOME' : 'EXPENSE',
    amountCents: Math.abs(cents),
    date: plaidTx.date,
    note: String(plaidTx.merchant_name || plaidTx.name || 'Bank transaction')
      .trim()
      .slice(0, MAX_NOTE_LENGTH),
    categoryName: isIncome ? OTHER_INCOME : expenseCategoryFor(plaidTx),
  };
}
