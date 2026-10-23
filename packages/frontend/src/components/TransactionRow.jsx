import { formatTransactionDate, money } from "../format.js";

/** One line in a transaction list: note (or category) and date, category, signed amount. */
export function TransactionRow({ transaction }) {
  const isIncome = transaction.type === "INCOME";
  return (
    <div>
      <span>◉</span>
      <b>{transaction.note || transaction.categoryName} · {formatTransactionDate(transaction.date)}</b>
      <small>{transaction.categoryName}</small>

      <strong className={isIncome ? "income" : ""}>
        {isIncome ? "+" : "−"}{money(transaction.amountCents)}
      </strong>
    </div>
  );
}
