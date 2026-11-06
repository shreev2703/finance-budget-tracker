import { centsToDollars } from "./api";

export const money = (cents = 0) =>
  `${cents < 0 ? "-" : ""}$${centsToDollars(Math.abs(cents)).toFixed(2)}`;

const longDate = new Intl.DateTimeFormat("en-US", {
  month: "short",
  day: "numeric",
  year: "numeric",
});

export const todayLabel = () => longDate.format(new Date());

// The investing mockup's first transfer: the 5th of next month.
export const firstTransferLabel = () => {
  const today = new Date();
  return longDate.format(new Date(today.getFullYear(), today.getMonth() + 1, 5));
};

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
