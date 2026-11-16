// UI tests for US-01: "As a budget-conscious student, I want to log a new expense with an
// amount, date, category, and description so that I can track where my money goes each day."
// They use only what a user sees: labels, buttons, and text on the screen.
import { describe, expect, test } from "vitest";
import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import App from "../App.jsx";
import { DEMO, installFakeBackend } from "./fakeBackend.js";

async function logInAsDemoStudent(user) {
  render(<App />);
  await user.type(screen.getByLabelText("Email"), DEMO.email);
  await user.type(screen.getByLabelText("Password"), DEMO.password);
  await user.click(screen.getByRole("button", { name: "Log In" }));
  await screen.findByRole("heading", { name: "Welcome back, Demo Student!" });
}

function budgetCard(name) {
  return screen.getByText(name, { selector: ".budget-card b" }).closest("article");
}

describe("US-01: log an expense", () => {
  test("a student logs in, adds an expense, and sees it in the list, the totals, and the budget", async () => {
    const backend = installFakeBackend();
    const user = userEvent.setup();
    await logInAsDemoStudent(user);

    // Before: the demo month's numbers.
    expect(screen.getByText("$720.00")).toBeInTheDocument();
    expect(screen.getByText("$446.17 left")).toBeInTheDocument();
    expect(within(budgetCard("Groceries")).getByText("On track")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "+ Add transaction" }));
    await user.type(screen.getByLabelText("Amount ($)"), "85");
    await user.selectOptions(screen.getByLabelText("Category"), "Groceries");
    await user.type(screen.getByLabelText("Note"), "Costco run");
    await user.click(screen.getByRole("button", { name: "Add expense" }));

    // After: the new expense is listed, the totals moved, and Groceries is near its limit.
    expect(await screen.findByText(/Costco run/)).toBeInTheDocument();
    expect(screen.getByText("$361.17 left")).toBeInTheDocument();
    const groceries = budgetCard("Groceries");
    expect(within(groceries).getByText("$165.85 of $200.00")).toBeInTheDocument();
    expect(within(groceries).getByText("Near limit")).toBeInTheDocument();
    expect(screen.queryByRole("heading", { name: "Add transaction" })).not.toBeInTheDocument();

    expect(backend.transactions.at(-1)).toMatchObject({
      type: "EXPENSE",
      amountCents: 8500,
      note: "Costco run",
    });
  });

  test("an expense without an amount shows a plain-language error and nothing is saved", async () => {
    const backend = installFakeBackend();
    const user = userEvent.setup();
    await logInAsDemoStudent(user);
    const savedBefore = backend.transactions.length;

    await user.click(screen.getByRole("button", { name: "+ Add transaction" }));
    await user.selectOptions(screen.getByLabelText("Category"), "Groceries");
    await user.click(screen.getByRole("button", { name: "Add expense" }));

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "amount must be a positive number",
    );
    // The form stays open so the student can fix it, and the totals did not change.
    expect(screen.getByRole("heading", { name: "Add transaction" })).toBeInTheDocument();
    expect(screen.getByText("$446.17 left")).toBeInTheDocument();
    expect(backend.transactions).toHaveLength(savedBefore);
  });

  test("an expense can only use an expense category", async () => {
    installFakeBackend();
    const user = userEvent.setup();
    await logInAsDemoStudent(user);

    await user.click(screen.getByRole("button", { name: "+ Add transaction" }));
    const options = within(screen.getByLabelText("Category"))
      .getAllByRole("option")
      .map((option) => option.textContent);
    expect(options).toContain("Groceries");
    expect(options).not.toContain("Allowance");

    await user.click(screen.getByRole("radio", { name: "Income" }));
    const incomeOptions = within(screen.getByLabelText("Category"))
      .getAllByRole("option")
      .map((option) => option.textContent);
    expect(incomeOptions).toContain("Allowance");
    expect(incomeOptions).not.toContain("Groceries");
  });
});
