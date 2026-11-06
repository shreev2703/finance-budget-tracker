import { useEffect, useState } from "react";
import { api, errorMessages } from "../api";
import { Button } from "../components/Button.jsx";
import { Shell } from "../components/Shell.jsx";
import { TransactionList } from "../components/TransactionList.jsx";
import { formatPeriod, todayIso } from "../format.js";
import { PAGES } from "./pages.js";

const NO_FILTERS = { categoryId: "", from: "", to: "" };
const MAX_TRANSACTIONS = 200;

export function Transactions({ go }) {
  const [transactions, setTransactions] = useState([]);
  const [categories, setCategories] = useState([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [reloadKey, setReloadKey] = useState(0);
  const [filters, setFilters] = useState(NO_FILTERS);
  const filtering = Object.values(filters).some(Boolean);

  const setFilter = (name) => (event) =>
    setFilters({ ...filters, [name]: event.target.value });

  // Re-runs the load below after a row is edited or deleted.
  const refresh = () => setReloadKey((key) => key + 1);

  useEffect(() => {
    let active = true;

    Promise.all([
      api.getTransactions(MAX_TRANSACTIONS, filters),
      api.getCategories(),
    ])
      .then(([nextTransactions, nextCategories]) => {
        if (!active) return;
        setTransactions(nextTransactions);
        setCategories(nextCategories);
        setError("");
      })
      .catch((nextError) => {
        if (!active) return;
        setTransactions([]);
        setError(
          nextError.status === 400
            ? errorMessages(nextError).join(" ")
            : "We could not load your transactions. Please try again.",
        );
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [reloadKey, filters]);

  return (
    <Shell page={PAGES.DASHBOARD} go={go}>
      <div className="dashboard">
        <div className="title">
          <p>Overview · {formatPeriod(todayIso().slice(0, 7))}</p>
          <h1>All transactions</h1>
          <span>Review your complete recent account activity.</span>
        </div>

        <div className="section-row">
          <h2>Transactions</h2>

          <Button className="small" onClick={() => go(PAGES.DASHBOARD)}>
            ← Back to dashboard
          </Button>
        </div>

        <div className="filters">
          <label>
            Category
            <select value={filters.categoryId} onChange={setFilter("categoryId")}>
              <option value="">All categories</option>
              {categories.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
            </select>
          </label>

          <label>
            From
            <input type="date" value={filters.from} onChange={setFilter("from")} />
          </label>

          <label>
            To
            <input type="date" value={filters.to} onChange={setFilter("to")} />
          </label>

          <Button
            className="small outline"
            disabled={!filtering}
            onClick={() => setFilters(NO_FILTERS)}
          >
            Clear
          </Button>
        </div>

        <TransactionList
          transactions={transactions}
          categories={categories}
          onChanged={refresh}
        >
          {error && <p className="dashboard-state error">{error}</p>}
          {!error && loading && (
            <p className="dashboard-state">Loading transactions…</p>
          )}
          {!error && !loading && transactions.length === 0 && (
            <p className="dashboard-state">
              {filtering ? "No transactions match these filters." : "No transactions yet."}
            </p>
          )}
        </TransactionList>
      </div>
    </Shell>
  );
}
