import "server-only";
import { PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { env } from "@/lib/env";
import { STORAGE_KEY_PATTERN } from "@/lib/image-types";

type StorageDriver = {
  put(key: string, body: Uint8Array, contentType: string): Promise<string>;
};

function localRoot(): string {
  return path.resolve(env.LOCAL_UPLOAD_DIR);
}

function localPath(key: string): string {
  if (!STORAGE_KEY_PATTERN.test(key)) throw new Error("Invalid storage key");
  return path.join(localRoot(), ...key.split("/"));
}

const localDriver: StorageDriver = {
  async put(key, body) {
    const target = localPath(key);
    await mkdir(path.dirname(target), { recursive: true });
    await writeFile(target, body);
    return `/media/${key}`;
  },
};

let s3: S3Client | undefined;
function s3Client(): S3Client {
  s3 ??= new S3Client({
    region: env.S3_REGION ?? "auto",
    endpoint: env.S3_ENDPOINT,
    forcePathStyle: Boolean(env.S3_ENDPOINT),
    credentials: { accessKeyId: env.S3_ACCESS_KEY_ID!, secretAccessKey: env.S3_SECRET_ACCESS_KEY! },
  });
  return s3;
}

const s3Driver: StorageDriver = {
  async put(key, body, contentType) {
    await s3Client().send(
      new PutObjectCommand({
        Bucket: env.S3_BUCKET,
        Key: key,
        Body: body,
        ContentType: contentType,
        CacheControl: "public, max-age=31536000, immutable",
      }),
    );
    return `${env.S3_PUBLIC_URL!.replace(/\/$/, "")}/${key}`;
  },
};

export const storage: StorageDriver = env.STORAGE_DRIVER === "s3" ? s3Driver : localDriver;

/** Reads a locally stored file (local driver only). Returns null when missing. */
export async function readLocalFile(key: string): Promise<Uint8Array | null> {
  if (env.STORAGE_DRIVER !== "local" || !STORAGE_KEY_PATTERN.test(key)) return null;
  return readFile(localPath(key)).catch(() => null);
}
