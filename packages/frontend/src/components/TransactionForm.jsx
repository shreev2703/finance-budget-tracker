import { useState } from "react";
import { api, centsToDollars, errorMessages } from "../api";
import { Button } from "./Button.jsx";
import { FormErrors } from "./FormErrors.jsx";
import { Modal } from "./Modal.jsx";
import { todayIso } from "../format.js";

/**
 * US-01 log an expense, US-02 record income, US-03 edit a transaction.
 * Pass `transaction` to edit it; leave it out to add a new one.
 */
export function TransactionForm({ categories, transaction, onClose, onSaved }) {
  const isEdit = Boolean(transaction);
  const [type, setType] = useState(transaction?.type ?? "EXPENSE");
  const [amount, setAmount] = useState(
    isEdit ? String(centsToDollars(transaction.amountCents)) : "",
  );
  const [categoryId, setCategoryId] = useState(
    isEdit ? String(transaction.categoryId) : "",
  );
  const [date, setDate] = useState(transaction?.date ?? todayIso());
  const [note, setNote] = useState(transaction?.note ?? "");
  const [errors, setErrors] = useState([]);
  const [saving, setSaving] = useState(false);

  const options = categories.filter((category) => category.type === type);

  function chooseType(nextType) {
    setType(nextType);
    setCategoryId("");
  }

  async function handleSave() {
    setSaving(true);
    setErrors([]);
    const fields = {
      type,
      amount: Number(amount),
      categoryId: Number(categoryId),
      date,
      note,
    };
    try {
      if (isEdit) {
        await api.updateTransaction(transaction.id, fields);
      } else {
        await api.addTransaction(fields);
      }
      await onSaved();
    } catch (error) {
      setErrors(errorMessages(error));
      setSaving(false);
    }
  }

  const saveLabel = isEdit
    ? "Save changes"
    : type === "EXPENSE"
      ? "Add expense"
      : "Add income";

  return (
    <Modal>
      <button className="close" onClick={onClose}>
        ×
      </button>

      <h2>{isEdit ? "Edit transaction" : "Add transaction"}</h2>

      <div className="type-toggle" role="radiogroup" aria-label="Transaction type">
        {["EXPENSE", "INCOME"].map((option) => (
          <Button
            key={option}
            role="radio"
            aria-checked={type === option}
            className={type === option ? "small" : "small outline"}
            onClick={() => chooseType(option)}
          >
            {option === "EXPENSE" ? "Expense" : "Income"}
          </Button>
        ))}
      </div>

      <label>
        Amount ($)
        <input
          type="number"
          min="0.01"
          step="0.01"
          value={amount}
          onChange={(event) => setAmount(event.target.value)}
          placeholder="0.00"
        />
      </label>

      <label>
        Category
        <select
          value={categoryId}
          onChange={(event) => setCategoryId(event.target.value)}
        >
          <option value="" disabled>
            Choose…
          </option>
          {options.map((category) => (
            <option key={category.id} value={category.id}>
              {category.name}
            </option>
          ))}
        </select>
      </label>

      <label>
        Date
        <input
          type="date"
          value={date}
          onChange={(event) => setDate(event.target.value)}
        />
      </label>

      <label>
        Note
        <input
          value={note}
          maxLength={200}
          onChange={(event) => setNote(event.target.value)}
          placeholder="Example: Coffee before class"
        />
      </label>

      <FormErrors errors={errors} />

      <div className="modal-actions">
        <Button className="outline" onClick={onClose}>
          Cancel
        </Button>

        <Button onClick={handleSave} disabled={saving}>
          {saving ? "Saving…" : saveLabel}
        </Button>
      </div>
    </Modal>
  );
}
