import { formatTransactionDate, money } from "../format.js";
import { Button } from "./Button.jsx";

/**
 * One line in a transaction list: note (or category) and date, category, signed amount.
 * Pass `onEdit` and `onDelete` to show the row's Edit and Delete buttons (US-03).
 */
export function TransactionRow({ transaction, onEdit, onDelete }) {
  const isIncome = transaction.type === "INCOME";
  const editable = Boolean(onEdit && onDelete);
  return (
    <div className={editable ? "editable" : undefined}>
      <span>◉</span>
      <b>{transaction.note || transaction.categoryName} · {formatTransactionDate(transaction.date)}</b>
      <small>{transaction.categoryName}</small>

      <strong className={isIncome ? "income" : ""}>
        {isIncome ? "+" : "−"}{money(transaction.amountCents)}
      </strong>

      {editable && (
        <span className="row-tools">
          <Button className="small outline" onClick={() => onEdit(transaction)}>
            Edit
          </Button>
          <Button className="small outline" onClick={() => onDelete(transaction)}>
            Delete
          </Button>
        </span>
      )}
    </div>
  );
}
