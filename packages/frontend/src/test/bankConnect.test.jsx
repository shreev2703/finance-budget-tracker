// UI tests for connecting a bank (#94, US-10). Plaid's window can't run in a test, so
// react-plaid-link is replaced by a stand-in where the student "signs in" at once.
import { describe, expect, test, vi } from "vitest";
import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import App from "../App.jsx";
import { DEMO, installFakeBackend } from "./fakeBackend.js";

vi.mock("react-plaid-link", () => ({
  usePlaidLink: ({ token, onSuccess }) => ({
    ready: true,
    open: () => onSuccess(token === "link-sandbox-test" ? "public-sandbox-test" : "wrong"),
  }),
}));

async function logIn(user) {
  render(<App />);
  await user.type(screen.getByLabelText("Email"), DEMO.email);
  await user.type(screen.getByLabelText("Password"), DEMO.password);
  await user.click(screen.getByRole("button", { name: "Log In" }));
  await screen.findByRole("heading", { name: "Welcome back, Demo Student!" });
}

describe("US-10: connect a bank", () => {
  test("connecting imports the bank’s purchases into the dashboard", async () => {
    const backend = installFakeBackend({ bank: true });
    const user = userEvent.setup();
    await logIn(user);
    expect(screen.getByText("$446.17 left")).toBeInTheDocument();

    await user.click(await screen.findByRole("button", { name: "Connect bank" }));

    expect(await screen.findByRole("status")).toHaveTextContent(
      "Imported 1 transaction from your bank.",
    );
    expect(await screen.findByText("$404.07 left")).toBeInTheDocument();
    const groceries = screen
      .getByText("Groceries", { selector: ".budget-card b" })
      .closest("article");
    expect(within(groceries).getByText("$122.95 of $200.00")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Import from bank" })).toBeInTheDocument();
    expect(backend.bankConnected).toBe(true);

    // Importing again finds nothing new and adds nothing.
    await user.click(screen.getByRole("button", { name: "Import from bank" }));
    expect(await screen.findByText("Your bank has no new transactions.")).toBeInTheDocument();
    expect(screen.getByText("$404.07 left")).toBeInTheDocument();
  });

  test("the Connect bank button is hidden when the server has no bank connections", async () => {
    installFakeBackend();
    const user = userEvent.setup();
    await logIn(user);
    expect(screen.queryByRole("button", { name: "Connect bank" })).not.toBeInTheDocument();
  });
});
