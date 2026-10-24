import "server-only";
import { z } from "zod";

/** Treats empty strings (common in .env files) as "not set". */
const optional = z
  .string()
  .trim()
  .optional()
  .transform((value) => (value ? value : undefined));

const schema = z
  .object({
    NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
    DATABASE_URL: z.url(),
    APP_URL: z.url().transform((value) => value.replace(/\/$/, "")),
    BETTER_AUTH_SECRET: z.string().min(32, "BETTER_AUTH_SECRET must be at least 32 characters"),
    BETTER_AUTH_URL: optional,
    STORAGE_DRIVER: z.enum(["local", "s3"]).default("local"),
    LOCAL_UPLOAD_DIR: z.string().default(".data/uploads"),
    S3_BUCKET: optional,
    S3_REGION: optional,
    S3_ENDPOINT: optional,
    S3_ACCESS_KEY_ID: optional,
    S3_SECRET_ACCESS_KEY: optional,
    S3_PUBLIC_URL: optional,
    TENANT_ROOT_DOMAIN: optional,
  })
  .superRefine((value, ctx) => {
    if (value.STORAGE_DRIVER !== "s3") return;
    for (const key of ["S3_BUCKET", "S3_ACCESS_KEY_ID", "S3_SECRET_ACCESS_KEY", "S3_PUBLIC_URL"] as const) {
      if (!value[key]) {
        ctx.addIssue({ code: "custom", path: [key], message: `${key} is required when STORAGE_DRIVER=s3` });
      }
    }
  });

const parsed = schema.safeParse(process.env);

if (!parsed.success) {
  const details = parsed.error.issues.map((issue) => `  - ${issue.path.join(".")}: ${issue.message}`).join("\n");
  throw new Error(`Invalid environment configuration:\n${details}\nSee .env.example.`);
}

export const env = parsed.data;
