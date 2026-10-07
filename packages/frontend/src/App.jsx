import "./index.css";

const budgets = [
  { name: "Food & Dining", spent: 168, limit: 250, color: "green" },
  { name: "Shopping", spent: 90, limit: 150, color: "green" },
  { name: "Entertainment", spent: 95, limit: 100, color: "orange" }
];

const transactions = [
  ["Starbucks Coffee", "Food & Dining", "-$6.45"],
  ["Paycheck", "Income", "+$850.00"],
  ["Target", "Shopping", "-$28.90"],
  ["Netflix", "Entertainment", "-$15.49"]
];

export default function App() {
  return (
    <div className="app">
      <aside className="sidebar">
        <div>
          <p className="brand">CAL POLY</p>
          <p className="brand-subtitle">LEDGERLOGIC</p>
        </div>

        <nav>
          <button className="nav-link active">⌂ Dashboard</button>
          <button className="nav-link">↕ Transactions</button>
          <button className="nav-link">▣ Budgets</button>
          <button className="nav-link">⚙ Settings</button>
        </nav>

        <div className="profile">
          <div className="avatar">M</div>
          <div>
            <strong>Mustang Student</strong>
            <p>Student account</p>
          </div>
        </div>
      </aside>

      <main className="content">
        <header>
          <div>
            <p className="eyebrow">OVERVIEW</p>
            <h1>Welcome back, Mustang!</h1>
            <p className="subtitle">Here is how your money is looking this month.</p>
          </div>
          <button className="add-button">+ Add transaction</button>
        </header>

        <section className="top-cards">
          <article className="card balance-card">
            <p>Available balance</p>
            <h2>$2,400.00</h2>
            <span>+$285.00 from last month</span>
          </article>

          <article className="card spending-card">
            <p>Monthly spending</p>
            <h2>$625.00</h2>
            <span>$375.00 remaining in budget</span>
          </article>

          <article className="card income-card">
            <p>Monthly income</p>
            <h2>$1,450.00</h2>
            <span>On track this month</span>
          </article>
        </section>

        <section className="section-heading">
          <div>
            <h2>Category budgets</h2>
            <p>Keep an eye on your spending.</p>
          </div>
          <button className="text-button">View all budgets →</button>
        </section>

        <section className="budget-grid">
          {budgets.map((budget) => {
            const percent = (budget.spent / budget.limit) * 100;

            return (
              <article className="card budget-card" key={budget.name}>
                <div className="budget-title">
                  <strong>{budget.name}</strong>
                  <span>{Math.round(percent)}%</span>
                </div>
                <p>
                  ${budget.spent} spent of ${budget.limit}
                </p>
                <div className="progress-track">
                  <div
                    className={`progress-fill ${budget.color}`}
                    style={{ width: `${percent}%` }}
                  />
                </div>
                <small>${budget.limit - budget.spent} remaining</small>
              </article>
            );
          })}
        </section>

        <section className="transactions-section">
          <div className="section-heading">
            <div>
              <h2>Recent transactions</h2>
              <p>Your latest activity.</p>
            </div>
            <button className="text-button">View all →</button>
          </div>

          <div className="card transaction-card">
            {transactions.map(([name, category, amount]) => (
              <div className="transaction-row" key={name}>
                <div className="transaction-icon">$</div>
                <div>
                  <strong>{name}</strong>
                  <p>{category} · Oct 7, 2026</p>
                </div>
                <strong className={amount.startsWith("+") ? "income" : "expense"}>
                  {amount}
                </strong>
              </div>
            ))}
          </div>
        </section>
      </main>
    </div>
  );
}
