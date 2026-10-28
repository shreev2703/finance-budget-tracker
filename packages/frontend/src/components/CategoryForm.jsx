import { useState } from "react";
import { errorMessages } from "../api";
import { validateCategory } from "../validation.js";
import { Button } from "./Button.jsx";
import { FormErrors } from "./FormErrors.jsx";
import { Modal } from "./Modal.jsx";

/**
 * Name + monthly limit form shared by Create and Edit Category.
 * `onSubmit` gets the cleaned { name, budget }; if it (or `onSecondary`)
 * throws, the API's error messages are shown in the form.
 */
export function CategoryForm({
  title,
  initialName = "",
  initialBudget = "",
  submitLabel,
  onSubmit,
  secondaryLabel,
  onSecondary,
  onClose,
}) {
  const [name, setName] = useState(initialName);
  const [budget, setBudget] = useState(initialBudget);
  const [errors, setErrors] = useState([]);

  async function attempt(action) {
    try {
      await action();
    } catch (error) {
      setErrors(errorMessages(error));
    }
  }

  function handleSubmit() {
    const error = validateCategory({ name, budget });
    if (error) {
      setErrors([error]);
      return;
    }
    attempt(() => onSubmit({ name: name.trim(), budget: Number(budget) }));
  }

  return (
    <Modal>
      <button className="close" onClick={onClose}>
        ×
      </button>

      <h2>{title}</h2>

      <label>
        Category name
        <input
          value={name}
          onChange={(event) => setName(event.target.value)}
          placeholder="Example: Textbooks"
        />
      </label>

      <label>
        Monthly budget limit
        <input
          type="number"
          min="1"
          value={budget}
          onChange={(event) => setBudget(event.target.value)}
          placeholder="100"
        />
      </label>

      <FormErrors errors={errors} />

      <div className="modal-actions">
        <Button className="outline" onClick={() => attempt(onSecondary)}>
          {secondaryLabel}
        </Button>

        <Button onClick={handleSubmit}>{submitLabel}</Button>
      </div>
    </Modal>
  );
}
