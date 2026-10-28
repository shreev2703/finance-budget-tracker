import { useEffect, useState } from "react";
import { api, centsToDollars } from "../api";
import { AddTransaction } from "../components/AddTransaction.jsx";
import { Button } from "../components/Button.jsx";
import { EditCategory } from "../components/EditCategory.jsx";
import { Shell } from "../components/Shell.jsx";
import { TransactionRow } from "../components/TransactionRow.jsx";
import { formatPeriod, money } from "../format.js";

export function Dashboard({ go }) {
  const [summary, setSummary] = useState(null);
  const [transactions, setTransactions] = useState([]);
  const [categories, setCategories] = useState([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [reloadKey, setReloadKey] = useState(0);
  const [editingCategory, setEditingCategory] = useState(null);
  const [addingTransaction, setAddingTransaction] = useState(false);

  // Re-runs the load below so totals, bars, and the list show a change right away.
  const refresh = () => setReloadKey((key) => key + 1);

  useEffect(() => {
    let active = true;

    Promise.all([api.getSummary(), api.getTransactions(4), api.getCategories()])
      .then(([nextSummary, nextTransactions, nextCategories]) => {
        if (!active) return;
        setSummary(nextSummary);
        setTransactions(nextTransactions);
        setCategories(nextCategories);
      })
      .catch(() => {
        if (active) setError("We could not load your budget data. Please try again.");
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [reloadKey]);

  const totals = summary?.totals;

  return (
    <Shell page="dashboard" go={go}>
      <div className="dashboard">
        <div className="title">
          <p>Overview{summary ? ` · ${formatPeriod(summary.period)}` : ""}</p>
          <h1>Welcome back, Mustang!</h1>
          <span>Here’s your financial snapshot for the month.</span>
        </div>

        {error ? (
          <p className="dashboard-state error">{error}</p>
        ) : loading ? (
          <p className="dashboard-state">Loading your budget data…</p>
        ) : (
          <>
        <div className="stat-grid">
          <article>
            <small>Monthly budget</small>
            <h2>{money(totals.incomeCents)}</h2>
            <p>
              {money(totals.expenseCents)} spent <b>{money(totals.balanceCents)} left</b>
            </p>
          </article>
        </div>

        <div className="section-row">
          <div>
            <h2>Category Allocation Breakdown</h2>
            <p>Live spending and limits for this month.</p>
          </div>

          <div className="row-actions">
            <Button
              className="small outline"
              onClick={() => setAddingTransaction(true)}
            >
              + Add transaction
            </Button>

            <Button className="small" onClick={() => go("category")}>
              + Create category
            </Button>
          </div>
        </div>

        <div className="category-grid">
          {summary.budgets.map((category) => {
            const color =
              category.status === "over"
                ? "#cf4f48"
                : category.status === "warning"
                  ? "#d69b0c"
                  : "#1c9457";

            return (
    <article
      key={category.id}
      className={`budget-card ${category.status}`}
      style={{
        borderColor: category.status === "over" ? "#d4564f" : category.status === "warning" ? "#e0ad31" : undefined,
        background: category.status === "over" ? "#fff8f7" : category.status === "warning" ? "#fffdf6" : undefined,
      }}
    >
      <div>
        <b>{category.categoryName}</b>
        <span className="card-tools">
          <small>{category.status === "over" ? "Over budget" : category.status === "warning" ? "Near limit" : "On track"}</small>
          <Button
            className="small outline"
            onClick={() =>
              setEditingCategory({
                id: category.categoryId,
                budgetId: category.id,
                name: category.categoryName,
                budget: centsToDollars(category.limitCents),
              })
            }
          >
            Edit
          </Button>
        </span>
      </div>

      <span>
        {money(category.spentCents)} of {money(category.limitCents)}
      </span>

      <i>
        <em
          style={{
            width: `${Math.min(
              (category.spentCents / category.limitCents) * 100,
              100
            )}%`,
            background: color,
          }}
          className={`budget-fill ${category.status}`}
        />
      </i>

      <small>
        {category.remainingCents >= 0
          ? `${money(category.remainingCents)} remaining`
          : `${money(Math.abs(category.remainingCents))} over budget`}
      </small>
    </article>
            );
          })}
 </div>

        {summary.budgets.length === 0 && (
          <p className="dashboard-state">No category budgets have been set for this month.</p>
        )}

        {editingCategory && (
          <EditCategory
            category={editingCategory}
            onClose={() => setEditingCategory(null)}
            onSave={async (updatedCategory) => {
              if (updatedCategory.name !== editingCategory.name) {
                await api.renameCategory(updatedCategory.id, updatedCategory.name);
              }
              if (updatedCategory.budget !== editingCategory.budget) {
                await api.updateBudget(updatedCategory.budgetId, updatedCategory.budget);
              }
              setEditingCategory(null);
              refresh();
            }}
            onDelete={async (id) => {
              await api.deleteCategory(id);
              setEditingCategory(null);
              refresh();
            }}
          />
        )}

        {addingTransaction && (
          <AddTransaction
            categories={categories}
            onClose={() => setAddingTransaction(false)}
            onAdded={() => {
              setAddingTransaction(false);
              refresh();
            }}
          />
        )}

 <div className="section-row">
  <div>
    <h2>Recent Transactions</h2>
    <p>Stay on top of your latest activity.</p>
  </div>

  <Button
    className="small outline"
    onClick={() => go("transactions")}
  >
    View all transactions
  </Button>
 </div>
        <section className="table">
          {transactions.map((transaction) => (
            <TransactionRow key={transaction.id} transaction={transaction} />
          ))}
        </section>
        {transactions.length === 0 && (
          <p className="dashboard-state">No transactions yet.</p>
        )}
        </>
        )}
      </div>
    </Shell>
  );
}
