import { z } from "zod";

/** Removes ASCII control characters (keeping tab/newline) that have no place in form text. */
export function cleanText(value: string): string {
  return value.replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, "").trim();
}

const emptyToNull = (value: string) => (value === "" ? null : value);

/**
 * Accepts a string, null or undefined and yields a trimmed string, so optional
 * fields parse both form input ("") and previously stored values (null).
 */
const nullableInput = z
  .string()
  .nullish()
  .transform((value) => (value ?? "").trim());

/** Required single-line text. */
export const requiredText = (max: number, label = "This field") =>
  z
    .string()
    .transform(cleanText)
    .pipe(z.string().min(1, `${label} is required`).max(max, `Must be at most ${max} characters`));

/** Optional text: empty input becomes null. */
export const optionalText = (max: number) =>
  nullableInput
    .transform(cleanText)
    .pipe(z.string().max(max, `Must be at most ${max} characters`))
    .transform(emptyToNull);

export const SLUG_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

export const slugSchema = z
  .string()
  .trim()
  .toLowerCase()
  .min(2, "Must be at least 2 characters")
  .max(60, "Must be at most 60 characters")
  .regex(SLUG_PATTERN, "Use lowercase letters, numbers and single hyphens");

/** Optional slug: empty input becomes null (callers derive one from the name). */
export const optionalSlugSchema = nullableInput
  .transform((value) => emptyToNull(value.toLowerCase()))
  .pipe(slugSchema.nullable());

export const optionalEmail = nullableInput
  .transform((value) => emptyToNull(value.toLowerCase()))
  .pipe(z.email("Enter a valid email address").max(254).nullable());

export const optionalPhone = nullableInput.transform(emptyToNull).pipe(
  z
    .string()
    .regex(/^\+?[0-9][0-9 ()-]{6,19}$/, "Enter a valid phone number")
    .nullable(),
);

/**
 * WhatsApp number in international format. Stored as digits only
 * (country code + number), which is what wa.me links require.
 */
export const optionalWhatsapp = nullableInput
  .transform((value) => emptyToNull(value.replace(/[\s()+-]/g, "")))
  .pipe(
    z
      .string()
      .regex(/^[1-9][0-9]{9,14}$/, "Include the country code, e.g. +91 98765 43210")
      .nullable(),
  );

export const optionalHttpsUrl = nullableInput.transform(emptyToNull).pipe(
  z
    .url({ protocol: /^https$/, message: "Enter a full https:// link" })
    .max(500)
    .nullable(),
);

/**
 * Image reference: a path served by this app (/media/...) or an https URL.
 * Services additionally verify that the image belongs to the business' media library.
 */
export const imageUrlSchema = z
  .string()
  .trim()
  .max(1000)
  .refine((value) => value.startsWith("/media/") || value.startsWith("https://"), "Invalid image reference");

export const optionalImageUrl = nullableInput.transform(emptyToNull).pipe(imageUrlSchema.nullable());

export const hexColorSchema = z
  .string()
  .trim()
  .regex(/^#[0-9a-fA-F]{6}$/, "Use a hex colour such as #1f4d3a")
  .transform((value) => value.toLowerCase());

export const idSchema = z.string().min(1).max(64);

export function slugify(input: string): string {
  return input
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60)
    .replace(/-+$/g, "");
}
