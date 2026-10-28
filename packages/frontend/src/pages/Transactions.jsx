import { useEffect, useState } from "react";
import { api } from "../api";
import { Button } from "../components/Button.jsx";
import { Shell } from "../components/Shell.jsx";
import { TransactionRow } from "../components/TransactionRow.jsx";

export function Transactions({ go }) {
  const [transactions, setTransactions] = useState([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.getTransactions()
      .then(setTransactions)
      .catch(() => setError("We could not load your transactions. Please try again."))
      .finally(() => setLoading(false));
  }, []);

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

        <section className="table">
          {error && <p className="dashboard-state error">{error}</p>}
          {!error && loading && (
            <p className="dashboard-state">Loading transactions…</p>
          )}
          {!error && !loading && transactions.length === 0 && (
            <p className="dashboard-state">No transactions yet.</p>
          )}
          {transactions.map((transaction) => (
            <TransactionRow key={transaction.id} transaction={transaction} />
          ))}
        </section>
      </div>
    </Shell>
  );
}
