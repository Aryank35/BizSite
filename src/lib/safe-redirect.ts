/** Only same-site relative paths are allowed as post-login destinations (no open redirects). */
export function safeRedirectPath(value: string | null | undefined): string | null {
  if (!value || !value.startsWith("/") || value.startsWith("//") || value.startsWith("/\\")) return null;
  if (!/^\/(admin|dashboard|preview)(\/|\?|$)/.test(value)) return null;
  return value;
}
