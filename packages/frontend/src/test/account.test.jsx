// UI tests for account management (#95, US-07): change the password and delete the account.
import { describe, expect, test, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import App from "../App.jsx";
import { DEMO, installFakeBackend } from "./fakeBackend.js";

async function openAccount(user) {
  render(<App />);
  await user.type(screen.getByLabelText("Email"), DEMO.email);
  await user.type(screen.getByLabelText("Password"), DEMO.password);
  await user.click(screen.getByRole("button", { name: "Log In" }));
  await screen.findByRole("heading", { name: "Welcome back, Demo Student!" });
  await user.click(screen.getByRole("button", { name: "Account" }));
  expect(screen.getByText(`${DEMO.name} · ${DEMO.email}`)).toBeInTheDocument();
}

describe("Account settings", () => {
  test("a wrong current password is refused; the right one changes the password", async () => {
    const backend = installFakeBackend();
    const user = userEvent.setup();
    await openAccount(user);

    await user.type(screen.getByLabelText("Current password"), "not-my-password");
    await user.type(screen.getByLabelText("New password"), "a-brand-new-password");
    await user.click(screen.getByRole("button", { name: "Change password" }));
    expect(await screen.findByRole("alert")).toHaveTextContent("Current password is incorrect.");
    expect(backend.password).toBe(DEMO.password);
    // Still logged in: a wrong password here must not log the user out.
    expect(screen.getByRole("heading", { name: "Welcome back, Demo Student!" })).toBeInTheDocument();

    await user.clear(screen.getByLabelText("Current password"));
    await user.type(screen.getByLabelText("Current password"), DEMO.password);
    await user.clear(screen.getByLabelText("New password"));
    await user.type(screen.getByLabelText("New password"), "a-brand-new-password");
    await user.click(screen.getByRole("button", { name: "Change password" }));
    expect(await screen.findByRole("status")).toHaveTextContent("Your password was changed.");
    expect(backend.password).toBe("a-brand-new-password");
  });

  test("deleting the account asks for confirmation, then returns to the login page", async () => {
    const backend = installFakeBackend();
    const confirm = vi.spyOn(window, "confirm").mockReturnValue(true);
    const user = userEvent.setup();
    await openAccount(user);

    await user.type(screen.getByLabelText("Password to confirm"), DEMO.password);
    await user.click(screen.getByRole("button", { name: "Delete my account" }));

    expect(confirm).toHaveBeenCalledOnce();
    expect(
      await screen.findByRole("heading", { name: "Log in to LedgerLogic" }),
    ).toBeInTheDocument();
    expect(backend.deleted).toBe(true);
  });

  test("cancelling the confirmation keeps the account", async () => {
    const backend = installFakeBackend();
    vi.spyOn(window, "confirm").mockReturnValue(false);
    const user = userEvent.setup();
    await openAccount(user);

    await user.type(screen.getByLabelText("Password to confirm"), DEMO.password);
    await user.click(screen.getByRole("button", { name: "Delete my account" }));

    expect(backend.deleted).toBe(false);
    expect(screen.getByRole("heading", { name: "Account" })).toBeInTheDocument();
  });
});
