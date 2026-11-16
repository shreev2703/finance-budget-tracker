/** Largest value a Postgres INTEGER column can hold. */
export const MAX_DB_INTEGER = 2147483647;

/**
 * A record id from a URL, query string, or body, as a number, or undefined if it
 * can't be one (abc, 1.5, 0, -1, too large). Postgres rejects those with an
 * error, so callers must treat undefined as "no such record" before querying.
 */
export function parseId(value) {
  const text = String(value ?? '');
  if (!/^\d+$/.test(text)) return undefined;
  const n = Number(text);
  return n > 0 && n <= MAX_DB_INTEGER ? n : undefined;
}
