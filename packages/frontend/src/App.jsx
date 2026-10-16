import { useState } from "react";
import "./index.css";

const money = (n) => `$${Number(n).toFixed(2)}`;

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

const initialCategories = [
  {
    id: 1,
    name: "Food & Dining",
    spent: 486.53,
    budget: 600,
    color: "#1c9457",
  },
  {
    id: 2,
    name: "Shopping",
    spent: 250,
    budget: 350,
    color: "#d69b0c",
  },
  {
    id: 3,
    name: "Fixed & Recurring",
    spent: 800,
    budget: 900,
    color: "#d66b38",
  },
  {
    id: 4,
    name: "Transportation",
    spent: 180,
    budget: 250,
    color: "#15916c",
  },
  {
    id: 5,
    name: "Bills & Payments",
    spent: 150,
    budget: 200,
    color: "#d28d07",
  },
  {
    id: 6,
    name: "Entertainment",
    spent: 40,
    budget: 100,
    color: "#35a076",
  },
];

function Dashboard({ go, categories, setCategories }) {
  const [editingCategory, setEditingCategory] = useState(null);

  const transactions = [
    ["Union Square · Yesterday", "Food & Dining", "−$12.84"],
    ["Campus Market · Oct 13", "Shopping", "−$28.46"],
    ["Amazon · Oct 12", "Entertainment", "−$19.99"],
    ["Cal Poly Direct Deposit", "Income", "+$1,800.00"], 
  ];

  return (
    <Shell page="dashboard" go={go}>
      <div className="dashboard">
        <div className="title">
          <p>Overview · October 2025</p>
          <h1>Welcome back, Mustang!</h1>
          <span>Here’s your financial snapshot for the month.</span>
        </div>

        <div className="stat-grid">
          <article>
            <small>Monthly budget</small>
            <h2>$2,400.00</h2>
            <p>
              $1,645.00 spent <b>$755.00 left</b>
            </p>
          </article>

          <article className="green-card">
            <small>Investing frequency savings</small>
            <h2>$250.00</h2>
            <p>Set aside from your monthly income</p>
          </article>

          <article className="plan-mini">
            <small>Ready to invest?</small>
            <h2>$50.00</h2>

            <Button onClick={() => go("investing")}>
              Start investing
            </Button>
          </article>
        </div>

        <div className="section-row">
          <div>
            <h2>Category Allocation Breakdown</h2>
            <p>Track spending across the categories you care about.</p>
          </div>

          <Button className="small" onClick={() => go("category")}>
            + Create category
          </Button>
        </div>

        <div className="category-grid">
  {categories.map((category) => (
    <article key={category.id}>
      <div>
        <b>{category.name}</b>

        <Button
          className="small outline"
          onClick={() => setEditingCategory(category)}
        >
          Edit
        </Button>
      </div>

      <span>
        {money(category.spent)} of {money(category.budget)}
      </span>

      <i>
        <em
          style={{
            width: `${Math.min(
              (category.spent / category.budget) * 100,
              100
            )}%`,
            background: category.color,
          }}
        />
      </i>

      <small>
        {money(category.budget - category.spent)} remaining
      </small>
    </article>
  ))}
 </div>
 {editingCategory && (
  <EditCategory
    category={editingCategory}
    onClose={() => setEditingCategory(null)}
    onSave={(updatedCategory) => {
      setCategories(
        categories.map((category) =>
          category.id === updatedCategory.id
            ? updatedCategory
            : category
        )
      );

      setEditingCategory(null);
    }}
    onDelete={(id) => {
      setCategories(
        categories.filter((category) => category.id !== id)
      );

      setEditingCategory(null);
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
          {transactions.map((row) => (
            <div key={row[0]}>
              <span>◉</span>
              <b>{row[0]}</b>
              <small>{row[1]}</small>

              <strong className={row[2][0] === "+" ? "income" : ""}>
                {row[2]}
              </strong>
            </div>
          ))}
        </section>
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
  const transactions = [
    ["Union Square · Yesterday", "Food & Dining", "−$12.84"],
    ["Campus Market · Oct 13", "Shopping", "−$28.46"],
    ["Amazon · Oct 12", "Entertainment", "−$19.99"],
    ["Cal Poly Direct Deposit", "Income", "+$1,800.00"],
    ["Netflix · Oct 9", "Entertainment", "−$15.49"],
    ["Chase College Checking · Oct 7", "Transfer", "−$100.00"],
  ];

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
          {transactions.map((transaction) => (
            <div key={transaction[0]}>
              <span>◉</span>
              <b>{transaction[0]}</b>
              <small>{transaction[1]}</small>

              <strong
                className={transaction[2][0] === "+" ? "income" : ""}
              >
                {transaction[2]}
              </strong>
            </div>
          ))}
        </section>
      </div>
    </Shell>
  );
}


function CreateCategory({ go, setCategories }) {
  const [name, setName] = useState("");
  const [budget, setBudget] = useState("");

  function handleCreateCategory() {
    if (name.trim() === "" || Number(budget) <= 0) {
      alert("Enter a category name and a valid budget limit.");
      return;
    }

    setCategories((currentCategories) => [
      ...currentCategories,
      {
        id: Date.now(),
        name: name.trim(),
        spent: 0,
        budget: Number(budget),
        color: "#1c9457",
      },
    ]);

    go("dashboard");
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

  function handleSave() {
    if (name.trim() === "" || Number(budget) <= 0) {
      alert("Enter a category name and a valid budget limit.");
      return;
    }

    onSave({
      ...category,
      name: name.trim(),
      budget: Number(budget),
    });
  }

  function handleDelete() {
    if (window.confirm(`Delete "${category.name}"?`)) {
      onDelete(category.id);
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

      <div className="modal-actions">
        <Button className="outline" onClick={handleDelete}>
          Delete category
        </Button>

        <Button onClick={handleSave}>Save changes</Button>
      </div>
    </Modal>
  );
}
export default function App() {
  const [categories, setCategories] = useState(initialCategories);
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
    return (
      <CreateCategory
        go={go}
        setCategories={setCategories}
      />
    );
  }

  return (
    <Dashboard
      go={go}
      categories={categories}
      setCategories={setCategories}
    />
  );
}