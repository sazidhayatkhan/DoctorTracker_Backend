import { z } from "zod";

const isoDate = z
  .string()
  .trim()
  .regex(/^\d{4}-\d{2}-\d{2}$/, "Date must be in yyyy-mm-dd format");

/** `?from=&to=` (yyyy-mm-dd, both inclusive) for "created between" filters */
export const dateRangeQueryShape = {
  /** Created on or after this date */
  from: isoDate.optional(),
  /** Created on or before this date (inclusive) */
  to: isoDate.optional(),
};

export const isValidDateRange = (v: { from?: string; to?: string }) =>
  !v.from || !v.to || v.from <= v.to;

export const dateRangeError = {
  message: "'from' must be on or before 'to'",
  path: ["from"],
};

/** Mongo condition for createdAt within [from, to] (UTC days), or undefined */
export const buildCreatedAtRange = (from?: string, to?: string) => {
  if (!from && !to) return undefined;

  const range: { $gte?: Date; $lt?: Date } = {};
  if (from) range.$gte = new Date(`${from}T00:00:00.000Z`);
  if (to) {
    // `to` is inclusive: everything before the start of the next day.
    const end = new Date(`${to}T00:00:00.000Z`);
    end.setUTCDate(end.getUTCDate() + 1);
    range.$lt = end;
  }

  return range;
};
