import "./index.css";
import { useCallback, useEffect, useState } from "react";
import { api, setUnauthorizedHandler } from "./api";
import { CreateCategory } from "./pages/CreateCategory.jsx";
import { Dashboard } from "./pages/Dashboard.jsx";
import { Funds } from "./pages/Funds.jsx";
import { Login } from "./pages/Login.jsx";
import { Transactions } from "./pages/Transactions.jsx";
import { Investing } from "./pages/investing/Investing.jsx";
import { PAGES } from "./pages/pages.js";
import { clearToken, getToken } from "./token.js";
import { UserContext } from "./UserContext.js";

const PAGE_COMPONENTS = {
  [PAGES.DASHBOARD]: Dashboard,
  [PAGES.TRANSACTIONS]: Transactions,
  [PAGES.CATEGORY]: CreateCategory,
  [PAGES.INVESTING]: Investing,
  [PAGES.FUNDS]: Funds,
};

function Pages() {
  const [page, go] = useState(PAGES.DASHBOARD);
  const [step, setStep] = useState(0);
  const Page = PAGE_COMPONENTS[page];

  return <Page go={go} step={step} setStep={setStep} />;
}

export default function App() {
  const [user, setUser] = useState(null);
  const [checkingToken, setCheckingToken] = useState(() => Boolean(getToken()));

  const logOut = useCallback(() => {
    clearToken();
    setUser(null);
  }, []);

  // Any 401 on a protected call means the token is no longer good.
  useEffect(() => {
    setUnauthorizedHandler(logOut);
  }, [logOut]);

  // A stored token skips the login page after a refresh, as long as the API still accepts it.
  useEffect(() => {
    if (!getToken()) return;
    api
      .me()
      .then(setUser)
      .catch(() => {})
      .finally(() => setCheckingToken(false));
  }, []);

  if (checkingToken) return null;
  if (!user) return <Login onLogin={setUser} />;

  return (
    <UserContext.Provider value={{ user, logOut }}>
      <Pages />
    </UserContext.Provider>
  );
}
