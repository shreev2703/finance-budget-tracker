import { useState } from "react";
import { api, errorMessages } from "../api";
import { Button } from "../components/Button.jsx";
import { FormErrors } from "../components/FormErrors.jsx";
import { Mark } from "../components/Mark.jsx";

export function Login({ onLogin }) {
  const [isSignUp, setIsSignUp] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errors, setErrors] = useState([]);
  const [submitting, setSubmitting] = useState(false);

  function switchMode() {
    setIsSignUp(!isSignUp);
    setErrors([]);
    setPassword("");
  }

  async function submit(event) {
    event.preventDefault();
    setErrors([]);
    setSubmitting(true);
    try {
      const user = isSignUp
        ? await api.register({ name, email, password })
        : await api.login({ email, password });
      onLogin(user);
    } catch (error) {
      setErrors(errorMessages(error));
      setPassword("");
      setSubmitting(false);
    }
  }

  return (
    <main className="login">
      <section className="login-art">
        <Mark />
        <div className="rays" />

        <div className="login-message">
          <h1>Learn by Doing.</h1>
          <p>
            Track your income and spending, set monthly budgets, and get warned
            before you go over.
          </p>
        </div>
      </section>

      <section className="login-form">
        <form onSubmit={submit}>
          <h1>{isSignUp ? "Create your account" : "Log in to LedgerLogic"}</h1>
          <p>
            {isSignUp
              ? "Your budget stays private to your account."
              : "Enter your email and password to see your budget."}
          </p>

          <FormErrors errors={errors} />

          {isSignUp && (
            <label>
              Name
              <input
                value={name}
                onChange={(event) => setName(event.target.value)}
                autoComplete="name"
                required
              />
            </label>
          )}

          <label>
            Email
            <input
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="you@school.edu"
              autoComplete="email"
              required
            />
          </label>

          <label>
            Password
            <input
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              placeholder={isSignUp ? "At least 8 characters" : "••••••••••••"}
              autoComplete={isSignUp ? "new-password" : "current-password"}
              required
            />
          </label>

          <Button className="wide" type="submit" disabled={submitting}>
            {isSignUp ? "Sign Up" : "Log In"}
          </Button>

          <p className="account">
            {isSignUp ? "Already have an account? " : "Don't have an account? "}
            <button type="button" onClick={switchMode}>
              {isSignUp ? "Log in" : "Create one"}
            </button>
          </p>
        </form>
      </section>
    </main>
  );
}
