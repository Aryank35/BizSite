/**
 * Prices are stored as integers in minor units (e.g. paise) to avoid
 * floating-point rounding. These helpers convert to and from user input.
 */

const PRICE_INPUT = /^(\d{1,9})(?:\.(\d{1,2}))?$/;

/** Parses "1499", "1,499.5" or "1499.50" into minor units. Returns null for invalid input. */
export function parsePriceToMinor(input: string): number | null {
  const normalised = input.trim().replace(/,/g, "");
  const match = PRICE_INPUT.exec(normalised);
  if (!match) return null;
  const major = Number(match[1]);
  const minor = Number((match[2] ?? "").padEnd(2, "0"));
  return major * 100 + minor;
}

/** Converts minor units back to an editable string ("1499.50"). */
export function minorToInput(minor: number | null | undefined): string {
  if (minor === null || minor === undefined) return "";
  const major = Math.floor(minor / 100);
  const rest = minor % 100;
  return rest === 0 ? String(major) : `${major}.${String(rest).padStart(2, "0")}`;
}

export function formatMoney(minor: number, currency = "INR", locale = "en-IN"): string {
  const hasFraction = minor % 100 !== 0;
  return new Intl.NumberFormat(locale, {
    style: "currency",
    currency,
    minimumFractionDigits: hasFraction ? 2 : 0,
    maximumFractionDigits: 2,
  }).format(minor / 100);
}
