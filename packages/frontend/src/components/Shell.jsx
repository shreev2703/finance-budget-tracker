import { useContext, useState } from "react";
import { PAGES } from "../pages/pages.js";
import { UserContext } from "../UserContext.js";
import { AccountSettings } from "./AccountSettings.jsx";
import { Mark } from "./Mark.jsx";

function Side({ page, go }) {
  return (
    <aside className="side">
      <Mark />

      <nav>
        <button
          onClick={() => go(PAGES.DASHBOARD)}
          className={page === PAGES.DASHBOARD ? "selected" : ""}
        >
          ⌂ <span>Home</span>
        </button>

        <button
          onClick={() => go(PAGES.INVESTING)}
          className={page === PAGES.INVESTING || page === PAGES.FUNDS ? "selected" : ""}
        >
          ⌁ <span>Investing</span>
        </button>

      </nav>

      <div className="portal">
        ●
        <span>
          LedgerLogic
          <br />
          <small>Finance Workspace</small>
        </span>
      </div>
    </aside>
  );
}

const initials = (name) =>
  name
    .split(/\s+/)
    .slice(0, 2)
    .map((word) => word[0].toUpperCase())
    .join("");

function Top() {
  const { user, logOut } = useContext(UserContext);
  const [showAccount, setShowAccount] = useState(false);

  return (
    <header className="top">
      <b>LedgerLogic</b>

      <span>
        {user.name} <i>{initials(user.name)}</i>
        <button className="log-out" onClick={() => setShowAccount(true)}>
          Account
        </button>
        <button className="log-out" onClick={logOut}>
          Log Out
        </button>
      </span>

      {showAccount && <AccountSettings onClose={() => setShowAccount(false)} />}
    </header>
  );
}

export function Shell({ page, go, children }) {
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
