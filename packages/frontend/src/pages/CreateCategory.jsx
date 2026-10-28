import { api } from "../api";
import { CategoryForm } from "../components/CategoryForm.jsx";

export function CreateCategory({ go }) {
  async function create({ name, budget }) {
    const category = await api.createCategory({ name });
    await api.createBudget({ categoryId: category.id, limit: budget });
    go("dashboard");
  }

  return (
    <CategoryForm
      title="Create category"
      submitLabel="Create category"
      onSubmit={create}
      secondaryLabel="Cancel"
      onSecondary={() => go("dashboard")}
      onClose={() => go("dashboard")}
    />
  );
}
