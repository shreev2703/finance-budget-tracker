import "./index.css";
import { useCallback, useEffect, useState } from "react";
import { api, setUnauthorizedHandler } from "./api";
import { CreateCategory } from "./pages/CreateCategory.jsx";
import { Dashboard } from "./pages/Dashboard.jsx";
import { Funds } from "./pages/Funds.jsx";
import { Login } from "./pages/Login.jsx";
import { Transactions } from "./pages/Transactions.jsx";
import { Investing } from "./pages/investing/Investing.jsx";
import { clearToken, getToken } from "./token.js";
import { UserContext } from "./UserContext.js";

function Pages() {
  const [page, go] = useState("dashboard");
  const [step, setStep] = useState(0);

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
