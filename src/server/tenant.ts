import "server-only";
import type { BusinessStatus, MembershipRole, UserRole } from "@/generated/prisma/client";
import { prisma } from "@/lib/db";
import { ForbiddenError } from "@/server/errors";

export type SessionUser = {
  id: string;
  name: string;
  email: string;
  role: UserRole;
};

/**
 * Everything a tenant-scoped operation is allowed to act on. Always built on
 * the server from the session and database — never from client input.
 */
export type TenantContext = {
  userId: string;
  isSuperAdmin: boolean;
  /** Null when a super admin is managing the business without a membership. */
  membershipRole: MembershipRole | null;
  businessId: string;
  business: {
    id: string;
    name: string;
    slug: string;
    status: BusinessStatus;
    allowSelfPublish: boolean;
    enquiriesEnabled: boolean;
    whatsappEnabled: boolean;
  };
};

export type Permission = "content:manage" | "website:publish" | "business:settings";

export function can(ctx: TenantContext, permission: Permission): boolean {
  if (ctx.isSuperAdmin) return true;
  if (ctx.business.status !== "ACTIVE" || !ctx.membershipRole) return false;
  switch (permission) {
    case "content:manage":
      return true;
    case "business:settings":
      return ctx.membershipRole === "OWNER";
    case "website:publish":
      return ctx.membershipRole === "OWNER" && ctx.business.allowSelfPublish;
  }
}

export function assertCan(ctx: TenantContext, permission: Permission): void {
  if (!can(ctx, permission)) throw new ForbiddenError();
}

const businessSelect = {
  id: true,
  name: true,
  slug: true,
  status: true,
  allowSelfPublish: true,
  enquiriesEnabled: true,
  whatsappEnabled: true,
} as const;

/**
 * Resolves which business the user is working on.
 * - Super admins act on the business they chose to manage (if it exists).
 * - Business admins act on a business they are a member of; a preferred id is
 *   honoured only when a membership for it exists.
 */
export async function resolveTenantContext(
  user: SessionUser,
  preferredBusinessId: string | null | undefined,
): Promise<TenantContext | null> {
  if (user.role === "SUPER_ADMIN") {
    if (!preferredBusinessId) return null;
    const business = await prisma.business.findUnique({ where: { id: preferredBusinessId }, select: businessSelect });
    if (!business) return null;
    return { userId: user.id, isSuperAdmin: true, membershipRole: null, businessId: business.id, business };
  }

  const memberships = await prisma.businessMembership.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: "asc" },
    select: { role: true, business: { select: businessSelect } },
  });
  const membership = memberships.find((m) => m.business.id === preferredBusinessId) ?? memberships[0];
  if (!membership) return null;

  return {
    userId: user.id,
    isSuperAdmin: false,
    membershipRole: membership.role,
    businessId: membership.business.id,
    business: membership.business,
  };
}
