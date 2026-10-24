/** WhatsApp numbers are stored as digits with country code, e.g. "919876543210". */
const WHATSAPP_DIGITS = /^[1-9][0-9]{9,14}$/;

/**
 * Builds a wa.me click-to-chat link. Returns null when the number is missing
 * or invalid, so callers simply hide the button.
 */
export function whatsappLink(number: string | null | undefined, message?: string | null): string | null {
  if (!number) return null;
  const digits = number.replace(/\D/g, "");
  if (!WHATSAPP_DIGITS.test(digits)) return null;
  const text = message?.trim();
  return text ? `https://wa.me/${digits}?text=${encodeURIComponent(text.slice(0, 500))}` : `https://wa.me/${digits}`;
}

export function formatWhatsappNumber(number: string): string {
  const digits = number.replace(/\D/g, "");
  if (digits.startsWith("91") && digits.length === 12) {
    return `+91 ${digits.slice(2, 7)} ${digits.slice(7)}`;
  }
  return `+${digits}`;
}
