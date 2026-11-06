// The JWT from sign-up or login, kept in localStorage so a page refresh stays logged in.
// Storage can throw (e.g. blocked site data), so the current tab also keeps a copy in memory.
const TOKEN_KEY = "ledgerlogic-token";
let memoryToken = null;

export function getToken() {
  try {
    return localStorage.getItem(TOKEN_KEY) ?? memoryToken;
  } catch {
    return memoryToken;
  }
}

export function setToken(token) {
  memoryToken = token;
  try {
    localStorage.setItem(TOKEN_KEY, token);
  } catch {
    // The in-memory copy still covers this tab.
  }
}

export function clearToken() {
  memoryToken = null;
  try {
    localStorage.removeItem(TOKEN_KEY);
  } catch {
    // Nothing was stored.
  }
}
