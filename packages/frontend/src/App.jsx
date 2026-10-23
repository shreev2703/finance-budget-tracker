import "./index.css";
import { useState } from "react";
import { CreateCategory } from "./pages/CreateCategory.jsx";
import { Dashboard } from "./pages/Dashboard.jsx";
import { Funds } from "./pages/Funds.jsx";
import { Login } from "./pages/Login.jsx";
import { Transactions } from "./pages/Transactions.jsx";
import { Investing } from "./pages/investing/Investing.jsx";

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
