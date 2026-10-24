import { useEffect, useState } from "react";
import "./index.css";
import { api, centsToDollars } from "./api";

const money = (cents = 0) => `$${centsToDollars(cents).toFixed(2)}`;

const formatPeriod = (period) =>
  new Intl.DateTimeFormat("en-US", { month: "long", year: "numeric" }).format(
    new Date(`${period}-01T00:00:00`),
  );

const formatTransactionDate = (date) =>
  new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric" }).format(
    new Date(`${date}T00:00:00`),
  );

function Mark() {
  return (
    <div className="mark">
      <b>CAL POLY</b>
      <span>SAN LUIS OBISPO</span>
      <i />
    </div>
  );
}

function Button({ children, className = "", ...props }) {
  return (
    <button className={`button ${className}`} {...props}>
      {children}
    </button>
  );
}

function Login({ enter }) {
  return (

    <main className="login">
      <section className="login-art">
        <Mark />
        <div className="rays" />

        <div className="login-message">
          <h1>Learn by Doing.</h1>
          <p>
            Welcome back to the Mustang Portal. Securely access your academic
            resources, administration dashboard, and campus workspace.
          </p>
        </div>
      </section>

      <section className="login-form">
        <div>
          <h1>Log in to Cal Poly</h1>
          <p>
            Enter your credentials to access your secure university portal.
          </p>

          <label>
            Email or Username
            <input placeholder="username@calpoly.edu" />
          </label>

          <label>
            Password
            <input type="password" placeholder="••••••••••••" />
          </label>

          <label className="check">
            <input type="checkbox" />
            Keep me logged in for 30 days
          </label>

          <div className="login-actions">
            <Button onClick={enter}>Log In</Button>
            <Button className="outline">Help</Button>
          </div>

          <div className="or">or</div>

          <Button className="wide outline">
            ◉ &nbsp; Continue with Google
          </Button>

          <Button className="wide outline">
            ◌ &nbsp; Continue with Apple
          </Button>

          <Button className="wide outline">
            ⌘ &nbsp; Log in with passkeys
          </Button>

          <a>Forgot Password?</a>

          <p className="account">
            Don't have an account? <b>Create one</b>
          </p>
        </div>
      </section>
    </main>
  );
}

function Side({ page, go }) {
  return (
    <aside className="side">
      <Mark />

      <nav>
        <button
          onClick={() => go("dashboard")}
          className={page === "dashboard" ? "selected" : ""}
        >
          ⌂ <span>Home</span>
        </button>

        <button
          onClick={() => go("investing")}
          className={page === "investing" || page === "funds" ? "selected" : ""}
        >
          ⌁ <span>Investing</span>
        </button>

        <button>
          ◌ <span>Tutorial Help</span>
        </button>
      </nav>

      <div className="portal">
        ●
        <span>
          Mustang Portal
          <br />
          <small>Finance Workspace</small>
        </span>
      </div>
    </aside>
  );
}

function Top() {
  return (
    <header className="top">
      <b>Learn by Doing.</b>

      <span>
        Mustang Student <i>MS</i> ◌
      </span>
    </header>
  );
}

function Shell({ page, go, children }) {
  return (
    <div className="shell">
      <Side page={page} go={go} />

      <div className="main">
        <Top />
        {children}
      </div>
    </div>
  );
}

function Dashboard({ go }) {
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
            <div key={transaction.id}>
              <span>◉</span>
              <b>{transaction.note || transaction.categoryName} · {formatTransactionDate(transaction.date)}</b>
              <small>{transaction.categoryName}</small>

              <strong className={transaction.type === "INCOME" ? "income" : ""}>
                {transaction.type === "INCOME" ? "+" : "−"}{money(transaction.amountCents)}
              </strong>
            </div>
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

function Investing({ go, step = 0, setStep }) {
  const screens = [
    <Setup go={go} setStep={setStep} />,
    <ChooseFund setStep={setStep} />,
    <Amount setStep={setStep} />,
    <Schedule setStep={setStep} />,
    <Account setStep={setStep} />,
    <Review setStep={setStep} go={go} />,
  ];

  return (
    <Shell page="investing" go={go}>
      <div className="investing">
        <div className="title">
          <p>Investing · Oct 14, 2025</p>
          <h1>Automatic investing</h1>
          <span>
            Build wealth gradually with a simple, recurring plan.
          </span>
        </div>

        {screens[step]}
      </div>
    </Shell>
  );
}

function Setup({ setStep }) {
  return (
    <div className="invest-grid">
      <section className="setup">
        <h2>Set up your recurring plan</h2>
        <p>
          Choose what to invest in and how much. You’ll be able to adjust
          everything later.
        </p>

        <label>
          Index fund

          <select>
            <option>VTI · Vanguard Total Stock Market ETF</option>
          </select>
        </label>

        <div className="two">
          <label>
            Contribution amount
            <input value="$50.00" readOnly />
          </label>

          <label>
            Start date
            <input value="Nov 5, 2025" readOnly />
          </label>
        </div>

        <label>
          Funding account

          <select>
            <option>Chase College Checking · 4821</option>
          </select>
        </label>

        <div className="notice">
          ◉ &nbsp; You’re in control. You can pause, change, or cancel your
          plan anytime.
        </div>

        <Button className="right" onClick={() => setStep(1)}>
          Review investment
        </Button>
      </section>

      <PlanCard />
    </div>
  );
}

function PlanCard() {
  return (
    <aside className="plan-card">
      <small>Your plan at a glance</small>
      <h1>$50.00</h1>
      <b>Every month on the 5th</b>

      <hr />

      <p>VTI · Vanguard Total Stock Market ETF</p>
      <strong>$600.00</strong>
      <span>Invested in the first year</span>

      <hr />

      <p>Start Nov 5, 2025. Changes, pause, or cancel anytime.</p>
    </aside>
  );
}

function Modal({ children }) {
  return (
    <div className="modal-wrap">
      <div className="modal">{children}</div>
    </div>
  );
}

function ChooseFund({ setStep }) {
  return (
    <Modal>
      <button className="close" onClick={() => setStep(0)}>
        ×
      </button>

      <b className="eyebrow">▣</b>
      <h2>Choose an index fund</h2>
      <p>
        Pick a fund to invest in. These are diversified, low-cost options.
      </p>

      <label>
        Fund type

        <select>
          <option>All fund types</option>
        </select>
      </label>

      <button className="fund-choice selected">
        <b>VTI</b>

        <span>
          <strong>Vanguard Total Stock Market ETF</strong>
          <small>
            Tracks the entire U.S. stock market · 0.03% expense ratio
          </small>
        </span>

        ✓
      </button>

      <button className="fund-choice">
        <b>VXUS</b>

        <span>
          <strong>Vanguard Total International Stock ETF</strong>
          <small>Global stocks outside the U.S.</small>
        </span>
      </button>

      <div className="modal-actions">
        <Button className="outline" onClick={() => setStep(0)}>
          Cancel
        </Button>

        <Button onClick={() => setStep(2)}>Continue</Button>
      </div>
    </Modal>
  );
}

function Amount({ setStep }) {
  return (
    <Modal>
      <button className="close" onClick={() => setStep(1)}>
        ×
      </button>

      <b className="eyebrow">▣</b>
      <h2>Set your contribution</h2>

      <p>
        How much would you like to move from your bank account into VTI each
        month?
      </p>

      <label>
        Amount per transfer

        <div className="currency">
          <span>$</span>
          <input value="50.00" readOnly />
          <small>USD</small>
        </div>
      </label>

      <p>This amount is taken each time your schedule repeats.</p>

      <div className="amounts">
        {[10, 25, 50, 100].map((n) => (
          <button className={n === 50 ? "selected" : ""} key={n}>
            ${n}
          </button>
        ))}
      </div>

      <div className="notice">
        ◉ &nbsp; $50 monthly = $600 over 12 contributions, before gains or
        losses.
      </div>

      <div className="modal-actions">
        <Button className="outline" onClick={() => setStep(1)}>
          Cancel
        </Button>

        <Button onClick={() => setStep(3)}>Save amount</Button>
      </div>
    </Modal>
  );
}

function Schedule({ setStep }) {
  return (
    <Modal>
      <button className="close" onClick={() => setStep(2)}>
        ×
      </button>

      <b className="eyebrow">▣</b>
      <h2>Choose your schedule</h2>
      <p>Select how often and when your money will move.</p>

      <div className="two">
        <label>
          Frequency

          <select>
            <option>Monthly</option>
          </select>
        </label>

        <label>
          Day of month

          <select>
            <option>5th</option>
          </select>
        </label>
      </div>

      <button className="fund-choice selected">
        <b>◉</b>

        <span>
          <strong>Monthly</strong>
          <small>Transfers repeat on the 5th of every month.</small>
        </span>

        ✓
      </button>

      <div className="notice">
        ◉ &nbsp; Your first transfer will be scheduled for Nov 5, 2025.
      </div>

      <div className="modal-actions">
        <Button className="outline" onClick={() => setStep(2)}>
          Cancel
        </Button>

        <Button onClick={() => setStep(4)}>Save schedule</Button>
      </div>
    </Modal>
  );
}

function Account({ setStep }) {
  return (
    <Modal>
      <button className="close" onClick={() => setStep(3)}>
        ×
      </button>

      <b className="eyebrow">▣</b>
      <h2>Select a funding account</h2>

      <p>
        Your recurring contribution will be transferred from this linked bank
        account.
      </p>

      <button className="account-choice selected">
        <span>
          <b>◉ Chase College Checking · 4821</b>
          <small>Checking · Linked · Sample account</small>
        </span>

        Selected
      </button>

      <button className="account-choice">
        <span>
          <b>◯ Chase Savings · 9063</b>
          <small>Savings · Linked · Sample account</small>
        </span>
      </button>

      <Button className="wide outline">＋ Link another bank account</Button>

      <div className="notice">
        ◉ &nbsp; Keep at least $500 available before each transfer.
      </div>

      <div className="modal-actions">
        <Button className="outline" onClick={() => setStep(3)}>
          Cancel
        </Button>

        <Button onClick={() => setStep(5)}>Use this account</Button>
      </div>
    </Modal>
  );
}

function Review({ setStep, go }) {
  return (
    <Modal>
      <button className="close" onClick={() => setStep(4)}>
        ×
      </button>

      <b className="eyebrow">▣</b>
      <h2>Review your investment</h2>
      <p>Review the plan before authorizing the recurring transfer.</p>

      <div className="review">
        <p>
          Index fund <b>VTI · Vanguard Total Stock Market ETF</b>
        </p>

        <p>
          Amount <b>$50.00 per transfer</b>
        </p>

        <p>
          From <b>Chase College Checking · 4821</b>
        </p>

        <p>
          Frequency <b>Monthly on the 5th</b>
        </p>

        <p>
          First transfer <b>Nov 5, 2025</b>
        </p>
      </div>

      <label className="check">
        <input type="checkbox" defaultChecked />
        I authorize recurring $50.00 transfers from Chase College Checking.
      </label>

      <div className="notice">
        ◉ &nbsp; Pause or cancel from My funds. Transfers are scheduled in
        advance.
      </div>

      <div className="modal-actions">
        <Button className="outline" onClick={() => setStep(0)}>
          Back to edit
        </Button>

        <Button onClick={() => go("funds")}>Authorize $50 monthly</Button>
      </div>
    </Modal>
  );
}

function Funds({ go }) {
  return (
    <Shell page="funds" go={go}>
      <div className="funds">
        <div className="title">
          <p>Investing · Oct 14, 2025</p>
          <h1>My funds</h1>
          <span>
            See what you’ve invested and how your funds have changed.
          </span>
        </div>

        <section className="portfolio">
          <small>Total portfolio value</small>
          <h1>$1,284.60</h1>

          <div>
            <span>
              <small>Total contributions</small>
              <b>$1,200.00</b>
            </span>

            <span>
              <small>Investment gains</small>
              <b className="income">+$84.60 (+7.05%)</b>
            </span>
          </div>

          <div className="chart">╱╲╱╲╱╲╱╲╱╲╱╲╱╲</div>
        </section>

        <div className="fund-grid">
          <section className="holdings">
            <h2>Your holdings</h2>

            <div>
              <b>VTI</b>
              <span>Vanguard Total Stock Market ETF</span>
              <strong>$960.00</strong>
            </div>

            <div>
              <b>VXUS</b>
              <span>Vanguard Total International Stock ETF</span>
              <strong>$324.60</strong>
            </div>
          </section>

          <PlanCard />
        </div>
      </div>
    </Shell>
  );
}

function Transactions({ go }) {
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
            <div key={transaction.id}>
              <span>◉</span>
              <b>{transaction.note || transaction.categoryName} · {formatTransactionDate(transaction.date)}</b>
              <small>{transaction.categoryName}</small>

              <strong className={transaction.type === "INCOME" ? "income" : ""}>
                {transaction.type === "INCOME" ? "+" : "−"}{money(transaction.amountCents)}
              </strong>
            </div>
          ))}
        </section>
      </div>
    </Shell>
  );
}


function errorMessages(error) {
  return error.details?.length ? error.details : [error.message];
}

function FormErrors({ errors }) {
  if (errors.length === 0) return null;
  return (
    <ul className="form-error" role="alert">
      {errors.map((message) => (
        <li key={message}>{message}</li>
      ))}
    </ul>
  );
}

function CreateCategory({ go }) {
  const [name, setName] = useState("");
  const [budget, setBudget] = useState("");
  const [errors, setErrors] = useState([]);

  async function handleCreateCategory() {
    if (name.trim() === "" || Number(budget) <= 0) {
      setErrors(["Enter a category name and a valid budget limit."]);
      return;
    }

    try {
      const category = await api.createCategory({ name: name.trim() });
      await api.createBudget({ categoryId: category.id, limit: Number(budget) });
      go("dashboard");
    } catch (error) {
      setErrors(errorMessages(error));
    }
  }

  return (
    <Modal>
      <button className="close" onClick={() => go("dashboard")}>
        ×
      </button>

      <h2>Create category</h2>

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
        <Button className="outline" onClick={() => go("dashboard")}>
          Cancel
        </Button>

        <Button onClick={handleCreateCategory}>
          Create category
        </Button>
      </div>
    </Modal>
  );
}

function EditCategory({ category, onClose, onSave, onDelete }) {
  const [name, setName] = useState(category.name);
  const [budget, setBudget] = useState(category.budget);
  const [errors, setErrors] = useState([]);

  async function handleSave() {
    if (name.trim() === "" || Number(budget) <= 0) {
      setErrors(["Enter a category name and a valid budget limit."]);
      return;
    }

    try {
      await onSave({
        ...category,
        name: name.trim(),
        budget: Number(budget),
      });
    } catch (error) {
      setErrors(errorMessages(error));
    }
  }

  async function handleDelete() {
    if (!window.confirm(`Delete "${category.name}"?`)) return;
    try {
      await onDelete(category.id);
    } catch (error) {
      setErrors(errorMessages(error));
    }
  }

  return (
    <Modal>
      <button className="close" onClick={onClose}>
        ×
      </button>

      <h2>Edit category</h2>

      <label>
        Category name
        <input
          value={name}
          onChange={(event) => setName(event.target.value)}
        />
      </label>

      <label>
        Monthly budget limit
        <input
          type="number"
          min="1"
          value={budget}
          onChange={(event) => setBudget(event.target.value)}
        />
      </label>

      <FormErrors errors={errors} />

      <div className="modal-actions">
        <Button className="outline" onClick={handleDelete}>
          Delete category
        </Button>

        <Button onClick={handleSave}>Save changes</Button>
      </div>
    </Modal>
  );
}

// Today's date in the user's time zone, as YYYY-MM-DD.
const todayIso = () => new Date().toLocaleDateString("en-CA");

/** US-01 log an expense, US-02 record income. */
function AddTransaction({ categories, onClose, onAdded }) {
  const [type, setType] = useState("EXPENSE");
  const [amount, setAmount] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [date, setDate] = useState(todayIso());
  const [note, setNote] = useState("");
  const [errors, setErrors] = useState([]);
  const [saving, setSaving] = useState(false);

  const options = categories.filter((category) => category.type === type);

  function chooseType(nextType) {
    setType(nextType);
    setCategoryId("");
  }

  async function handleAdd() {
    setSaving(true);
    setErrors([]);
    try {
      await api.addTransaction({
        type,
        amount: Number(amount),
        categoryId: Number(categoryId),
        date,
        note,
      });
      await onAdded();
    } catch (error) {
      setErrors(errorMessages(error));
      setSaving(false);
    }
  }

  return (
    <Modal>
      <button className="close" onClick={onClose}>
        ×
      </button>

      <h2>Add transaction</h2>

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

        <Button onClick={handleAdd} disabled={saving}>
          {saving ? "Saving…" : type === "EXPENSE" ? "Add expense" : "Add income"}
        </Button>
      </div>
    </Modal>
  );
}

export default function App() {
  const [page, go] = useState("login");
  const [step, setStep] = useState(0);

  if (page === "login") {
    return <Login enter={() => go("dashboard")} />;
  }

  if (page === "investing") {
    return <Investing go={go} step={step} setStep={setStep} />;
  }

  if (page === "funds") {
    return <Funds go={go} />;
  }

  if (page === "transactions") {
    return <Transactions go={go} />;
  }

  if (page === "category") {
    return <CreateCategory go={go} />;
  }

  return <Dashboard go={go} />;
}
