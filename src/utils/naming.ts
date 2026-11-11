/**
 * Canonical form of a display name, used for case/space-insensitive
 * uniqueness: "  Square   Hospital " and "square hospital" collide.
 */
export const toNameKey = (name: string) =>
  name.trim().replace(/\s+/g, " ").toLowerCase();

/** MongoDB duplicate-key error (E11000), optionally on a specific field */
export const isDuplicateKeyError = (err: unknown, field?: string) => {
  if (typeof err !== "object" || err === null) return false;

  const { code, keyPattern } = err as {
    code?: number;
    keyPattern?: Record<string, unknown>;
  };

  return code === 11000 && (!field || field in (keyPattern ?? {}));
};
