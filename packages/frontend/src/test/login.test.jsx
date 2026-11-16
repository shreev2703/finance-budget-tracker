// UI tests for US-07: "As a privacy-conscious user, I want to create an account and log in
// with an email and password so that my financial records stay private."
import { describe, expect, test } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import App from "../App.jsx";
import { DEMO, installFakeBackend } from "./fakeBackend.js";

describe("US-07: log in", () => {
  test("a wrong password shows an error and keeps the budget hidden", async () => {
    installFakeBackend();
    const user = userEvent.setup();
    render(<App />);

    await user.type(screen.getByLabelText("Email"), DEMO.email);
    await user.type(screen.getByLabelText("Password"), "not-my-password");
    await user.click(screen.getByRole("button", { name: "Log In" }));

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "Incorrect email or password.",
    );
    expect(screen.getByRole("heading", { name: "Log in to LedgerLogic" })).toBeInTheDocument();
    expect(screen.queryByText(/Welcome back/)).not.toBeInTheDocument();
    // The password box is cleared so it can be typed again.
    expect(screen.getByLabelText("Password")).toHaveValue("");
  });

  test("the right password opens the dashboard, and a refresh stays logged in", async () => {
    installFakeBackend();
    const user = userEvent.setup();
    const { unmount } = render(<App />);

    await user.type(screen.getByLabelText("Email"), DEMO.email);
    await user.type(screen.getByLabelText("Password"), DEMO.password);
    await user.click(screen.getByRole("button", { name: "Log In" }));
    expect(
      await screen.findByRole("heading", { name: "Welcome back, Demo Student!" }),
    ).toBeInTheDocument();

    // Simulate a page refresh: a new App with the token still in the browser.
    unmount();
    render(<App />);
    expect(
      await screen.findByRole("heading", { name: "Welcome back, Demo Student!" }),
    ).toBeInTheDocument();
    expect(screen.queryByLabelText("Password")).not.toBeInTheDocument();
  });
});
