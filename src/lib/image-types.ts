/** Pure helpers for validating uploaded images (no server dependencies). */

export const MAX_UPLOAD_BYTES = 5 * 1024 * 1024;

export type ImageType = { mime: "image/jpeg" | "image/png" | "image/webp" | "image/gif"; ext: string };

/**
 * Detects the image type from the file's magic bytes rather than trusting
 * the client-supplied name or MIME type. SVG is deliberately not accepted
 * because it can carry scripts.
 */
export function detectImageType(bytes: Uint8Array): ImageType | null {
  const starts = (...sig: number[]) => sig.every((b, i) => bytes[i] === b);
  if (starts(0xff, 0xd8, 0xff)) return { mime: "image/jpeg", ext: "jpg" };
  if (starts(0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a)) return { mime: "image/png", ext: "png" };
  if (starts(0x47, 0x49, 0x46, 0x38) && (bytes[4] === 0x37 || bytes[4] === 0x39) && bytes[5] === 0x61) {
    return { mime: "image/gif", ext: "gif" };
  }
  const ascii = (from: number, to: number) => String.fromCharCode(...bytes.slice(from, to));
  if (ascii(0, 4) === "RIFF" && ascii(8, 12) === "WEBP") return { mime: "image/webp", ext: "webp" };
  return null;
}

/** Storage keys look like "<owner>/<random>.<ext>"; anything else is rejected. */
export const STORAGE_KEY_PATTERN = /^[a-z0-9]{1,40}\/[a-f0-9]{32}\.(jpg|png|webp|gif)$/;

export const MIME_BY_EXT: Record<string, ImageType["mime"]> = {
  jpg: "image/jpeg",
  png: "image/png",
  webp: "image/webp",
  gif: "image/gif",
};
