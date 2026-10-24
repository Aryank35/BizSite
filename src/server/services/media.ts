import "server-only";
import { randomBytes } from "node:crypto";
import { prisma } from "@/lib/db";
import { ValidationError } from "@/server/errors";
import { MAX_UPLOAD_BYTES, detectImageType } from "@/lib/image-types";
import { storage } from "@/server/storage";

export type UploadedImage = { id: string; url: string; mimeType: string; sizeBytes: number };

/**
 * Validates and stores an uploaded image for a business (or the platform when
 * businessId is null). The caller is responsible for authorising the owner.
 */
export async function storeImage(params: {
  businessId: string | null;
  uploadedById: string;
  file: File;
  altText?: string | null;
}): Promise<UploadedImage> {
  const { file } = params;
  if (file.size === 0) throw new ValidationError("The file is empty");
  if (file.size > MAX_UPLOAD_BYTES) throw new ValidationError("Images must be 5 MB or smaller");

  const bytes = new Uint8Array(await file.arrayBuffer());
  const type = detectImageType(bytes);
  if (!type) throw new ValidationError("Only JPEG, PNG, WebP and GIF images are allowed");

  const key = `${params.businessId ?? "platform"}/${randomBytes(16).toString("hex")}.${type.ext}`;
  const url = await storage.put(key, bytes, type.mime);

  const asset = await prisma.mediaAsset.create({
    data: {
      businessId: params.businessId,
      storageKey: key,
      url,
      mimeType: type.mime,
      sizeBytes: bytes.byteLength,
      altText: params.altText?.slice(0, 160) || null,
      uploadedById: params.uploadedById,
    },
  });
  return { id: asset.id, url: asset.url, mimeType: asset.mimeType, sizeBytes: asset.sizeBytes };
}

/**
 * Ensures every image reference belongs to the business' media library (or is
 * a platform asset). Prevents pointing a website at arbitrary external URLs or
 * at another tenant's uploads.
 */
export async function assertImagesOwned(businessId: string, urls: (string | null | undefined)[]): Promise<void> {
  const unique = [...new Set(urls.filter((u): u is string => Boolean(u)))];
  if (unique.length === 0) return;
  const found = await prisma.mediaAsset.findMany({
    where: { url: { in: unique }, OR: [{ businessId }, { businessId: null }] },
    select: { url: true },
  });
  const owned = new Set(found.map((f) => f.url));
  if (unique.some((url) => !owned.has(url))) {
    throw new ValidationError("One or more images are not in this business' media library. Please upload them again.");
  }
}
