import { useEffect, useState } from "react";
import { api } from "../api";
import { Button } from "../components/Button.jsx";
import { Shell } from "../components/Shell.jsx";
import { TransactionList } from "../components/TransactionList.jsx";

export function Transactions({ go }) {
  const [transactions, setTransactions] = useState([]);
  const [categories, setCategories] = useState([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [reloadKey, setReloadKey] = useState(0);

  // Re-runs the load below after a row is edited or deleted.
  const refresh = () => setReloadKey((key) => key + 1);

  useEffect(() => {
    Promise.all([api.getTransactions(), api.getCategories()])
      .then(([nextTransactions, nextCategories]) => {
        setTransactions(nextTransactions);
        setCategories(nextCategories);
      })
      .catch(() => setError("We could not load your transactions. Please try again."))
      .finally(() => setLoading(false));
  }, [reloadKey]);

  return (
    <Shell page="dashboard" go={go}>
      <div className="dashboard">
        <div className="title">
          <p>Overview · October 2025</p>
          <h1>All transactions</h1>
          <span>Review your complete recent account activity.</span>
        </div>

        <div className="section-row">
          <h2>Transactions</h2>

          <Button className="small" onClick={() => go("dashboard")}>
            ← Back to dashboard
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
            <p className="dashboard-state">No transactions yet.</p>
          )}
        </TransactionList>
      </div>
    </Shell>
  );
}
