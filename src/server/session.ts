import "server-only";
import { cookies, headers } from "next/headers";
import { redirect } from "next/navigation";
import { cache } from "react";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { resolveTenantContext, type SessionUser, type TenantContext } from "@/server/tenant";

/** Cookie holding the business a user chose to work on (validated on every request). */
export const ACTIVE_BUSINESS_COOKIE = "bizsite_active_business";

/**
 * Current user, re-read from the database on every request so that role
 * changes and suspensions take effect immediately.
 */
export const getSessionUser = cache(async (): Promise<SessionUser | null> => {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) return null;
  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { id: true, name: true, email: true, role: true, status: true },
  });
  if (!user || user.status !== "ACTIVE") return null;
  return { id: user.id, name: user.name, email: user.email, role: user.role };
});

export async function requireUser(): Promise<SessionUser> {
  const user = await getSessionUser();
  if (!user) redirect("/login");
  return user;
}

export async function requireSuperAdmin(): Promise<SessionUser> {
  const user = await requireUser();
  if (user.role !== "SUPER_ADMIN") redirect("/dashboard");
  return user;
}

/** Tenant context for /dashboard pages and actions. */
export const requireTenant = cache(async (): Promise<TenantContext> => {
  const user = await requireUser();
  const preferred = (await cookies()).get(ACTIVE_BUSINESS_COOKIE)?.value;
  const ctx = await resolveTenantContext(user, preferred);
  if (!ctx) redirect(user.role === "SUPER_ADMIN" ? "/admin/businesses" : "/no-business");
  if (!ctx.isSuperAdmin && ctx.business.status !== "ACTIVE") redirect("/business-suspended");
  return ctx;
});
