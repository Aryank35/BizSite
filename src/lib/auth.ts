import "server-only";
import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { nextCookies } from "better-auth/next-js";
import { prisma } from "@/lib/db";
import { PASSWORD_MIN_LENGTH } from "@/lib/constants";
import { env } from "@/lib/env";

export const auth = betterAuth({
  appName: "BizSite",
  baseURL: env.BETTER_AUTH_URL ?? env.APP_URL,
  secret: env.BETTER_AUTH_SECRET,
  database: prismaAdapter(prisma, { provider: "postgresql" }),
  emailAndPassword: {
    enabled: true,
    // Accounts are created only by invitation; there is no public sign-up.
    disableSignUp: true,
    minPasswordLength: PASSWORD_MIN_LENGTH,
    maxPasswordLength: 128,
  },
  user: {
    additionalFields: {
      role: { type: "string", input: false, required: false },
      status: { type: "string", input: false, required: false },
    },
  },
  session: {
    expiresIn: 60 * 60 * 24 * 7,
    updateAge: 60 * 60 * 24,
  },
  rateLimit: {
    enabled: true,
    storage: "database",
    window: 60,
    max: 100,
    customRules: {
      "/sign-in/email": { window: 60, max: 5 },
      "/change-password": { window: 60, max: 5 },
    },
  },
  databaseHooks: {
    session: {
      create: {
        // Suspended users cannot start new sessions.
        before: async (session) => {
          const user = await prisma.user.findUnique({ where: { id: session.userId }, select: { status: true } });
          if (!user || user.status !== "ACTIVE") return false;
        },
      },
    },
  },
  plugins: [nextCookies()],
});
