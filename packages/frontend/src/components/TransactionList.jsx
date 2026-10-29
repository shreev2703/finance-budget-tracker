import { useState } from "react";
import { api, errorMessages } from "../api";
import { FormErrors } from "./FormErrors.jsx";
import { TransactionForm } from "./TransactionForm.jsx";
import { TransactionRow } from "./TransactionRow.jsx";

/**
 * US-03: a transaction list whose rows can be edited and deleted.
 * `children` (loading / empty / error messages) render above the rows;
 * `onChanged` reloads the page's data after an edit or delete.
 */
export function TransactionList({
  transactions,
  categories,
  onChanged,
  children,
}) {
  const [editing, setEditing] = useState(null);
  const [errors, setErrors] = useState([]);

  async function remove(transaction) {
    const label = transaction.note || transaction.categoryName;
    if (!window.confirm(`Delete "${label}"?`)) return;
    setErrors([]);
    try {
      await api.deleteTransaction(transaction.id);
      await onChanged();
    } catch (error) {
      setErrors(errorMessages(error));
    }
  }

  return (
    <>
      <FormErrors errors={errors} />

      <section className="table">
        {children}
        {transactions.map((transaction) => (
          <TransactionRow
            key={transaction.id}
            transaction={transaction}
            onEdit={setEditing}
            onDelete={remove}
          />
        ))}
      </section>

      {editing && (
        <TransactionForm
          categories={categories}
          transaction={editing}
          onClose={() => setEditing(null)}
          onSaved={async () => {
            setEditing(null);
            await onChanged();
          }}
        />
      )}
    </>
  );
}
