import { useContext } from "react";
import { UserContext } from "../UserContext.js";
import { Mark } from "./Mark.jsx";

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

const initials = (name) =>
  name
    .split(/\s+/)
    .slice(0, 2)
    .map((word) => word[0].toUpperCase())
    .join("");

function Top() {
  const { user, logOut } = useContext(UserContext);

  return (
    <header className="top">
      <b>Learn by Doing.</b>

      <span>
        {user.name} <i>{initials(user.name)}</i>
        <button className="log-out" onClick={logOut}>
          Log Out
        </button>
      </span>
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
