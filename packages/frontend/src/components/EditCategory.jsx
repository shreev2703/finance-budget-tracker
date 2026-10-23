import { CategoryForm } from "./CategoryForm.jsx";

export function EditCategory({ category, onClose, onSave, onDelete }) {
  async function remove() {
    if (window.confirm(`Delete "${category.name}"?`)) {
      await onDelete(category.id);
    }
  }

  return (
    <CategoryForm
      title="Edit category"
      initialName={category.name}
      initialBudget={category.budget}
      submitLabel="Save changes"
      onSubmit={(changes) => onSave({ ...category, ...changes })}
      secondaryLabel="Delete category"
      onSecondary={remove}
      onClose={onClose}
    />
  );
}
