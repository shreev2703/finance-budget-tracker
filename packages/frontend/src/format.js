import { centsToDollars } from "./api";

export const money = (cents = 0) => `$${centsToDollars(cents).toFixed(2)}`;

export const formatPeriod = (period) =>
  new Intl.DateTimeFormat("en-US", { month: "long", year: "numeric" }).format(
    new Date(`${period}-01T00:00:00`),
  );

export const formatTransactionDate = (date) =>
  new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric" }).format(
    new Date(`${date}T00:00:00`),
  );

// Today's date in the user's time zone, as YYYY-MM-DD.
export const todayIso = () => new Date().toLocaleDateString("en-CA");
