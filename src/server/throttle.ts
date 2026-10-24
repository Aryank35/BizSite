import "server-only";
import { createHmac } from "node:crypto";
import { prisma } from "@/lib/db";
import { env } from "@/lib/env";
import { RateLimitError } from "@/server/errors";

/**
 * Fixed-window counter stored in PostgreSQL, so limits hold across server
 * instances. A single upsert statement keeps it atomic.
 */
export async function hitThrottle(key: string, limit: number, windowSeconds: number): Promise<boolean> {
  const rows = await prisma.$queryRaw<{ count: number }[]>`
    INSERT INTO throttle_buckets ("key", "windowStart", "count")
    VALUES (${key}, now(), 1)
    ON CONFLICT ("key") DO UPDATE SET
      "count" = CASE
        WHEN throttle_buckets."windowStart" < now() - make_interval(secs => ${windowSeconds}) THEN 1
        ELSE throttle_buckets."count" + 1
      END,
      "windowStart" = CASE
        WHEN throttle_buckets."windowStart" < now() - make_interval(secs => ${windowSeconds}) THEN now()
        ELSE throttle_buckets."windowStart"
      END
    RETURNING "count"`;
  return (rows[0]?.count ?? 0) <= limit;
}

export async function enforceThrottle(key: string, limit: number, windowSeconds: number): Promise<void> {
  if (!(await hitThrottle(key, limit, windowSeconds))) throw new RateLimitError();
}

/** Client IP as reported by the proxy in front of the app. Hashed before storage. */
export function clientIpFrom(headerList: Headers): string {
  const forwarded = headerList.get("x-forwarded-for")?.split(",")[0]?.trim();
  return forwarded || headerList.get("x-real-ip") || "unknown";
}

export function hashIdentifier(value: string): string {
  return createHmac("sha256", env.BETTER_AUTH_SECRET).update(value).digest("hex").slice(0, 32);
}
