/**
 * Date helpers for analytics. Months and ages are computed in the app's
 * timezone (APP_TIMEZONE, default UTC) so "this month" matches the clinic's
 * calendar rather than the server's.
 */

const resolveTimezone = (): string => {
  const tz = process.env.APP_TIMEZONE || "UTC";

  try {
    new Intl.DateTimeFormat("en-US", { timeZone: tz });
    return tz;
  } catch {
    console.warn(`Invalid APP_TIMEZONE "${tz}", falling back to UTC`);
    return "UTC";
  }
};

export const TIMEZONE = resolveTimezone();

/** Today's calendar date in TIMEZONE */
export const todayParts = (now = new Date()) => {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: TIMEZONE,
    year: "numeric",
    month: "numeric",
    day: "numeric",
  }).formatToParts(now);

  const get = (type: string) =>
    Number(parts.find((p) => p.type === type)!.value);

  return { year: get("year"), month: get("month"), day: get("day") };
};

const pad = (n: number) => String(n).padStart(2, "0");

export interface MonthBucket {
  /** yyyy-mm, matches $dateToString "%Y-%m" */
  key: string;
  /** e.g. "Nov 2026" */
  label: string;
}

/** The last `count` months in TIMEZONE, oldest first, ending with this month */
export const lastMonths = (count: number, now = new Date()): MonthBucket[] => {
  const { year, month } = todayParts(now);

  return Array.from({ length: count }, (_, i) => {
    const d = new Date(Date.UTC(year, month - 1 - (count - 1 - i), 1));
    return {
      key: `${d.getUTCFullYear()}-${pad(d.getUTCMonth() + 1)}`,
      label: d.toLocaleDateString("en-GB", {
        month: "short",
        year: "numeric",
        timeZone: "UTC",
      }),
    };
  });
};

/**
 * A safe lower bound for documents created in or after the month `key`
 * in TIMEZONE: the UTC start of that month minus a day covers any offset.
 * Exact month membership is then decided by $dateToString with the timezone.
 */
export const monthLowerBound = (key: string) => {
  const [y, m] = key.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, 1) - 24 * 60 * 60 * 1000);
};

/**
 * Birth dates are stored as UTC midnight of the calendar date.
 * Someone is at least `years` old today iff birthDate < ageCutoff(years).
 */
export const ageCutoff = (years: number, now = new Date()) => {
  const { year, month, day } = todayParts(now);
  const targetYear = year - years;

  // "Today minus N years", clamped so Feb 29 maps to Feb 28 in common years
  // (letting Date roll it over to Mar 1 would count Mar 1 birthdays a day early).
  const daysInMonth = new Date(Date.UTC(targetYear, month, 0)).getUTCDate();
  const sameDay = Math.min(day, daysInMonth);

  // The day after that date.
  return new Date(Date.UTC(targetYear, month - 1, sameDay + 1));
};
