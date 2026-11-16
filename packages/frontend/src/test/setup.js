import "@testing-library/jest-dom/vitest";
import { afterEach } from "vitest";
import { cleanup } from "@testing-library/react";
import { clearToken } from "../token.js";

// Each test starts logged out: token.js keeps a copy of the token in memory as well as in
// localStorage, so clear both.
afterEach(() => {
  cleanup();
  clearToken();
  localStorage.clear();
});
