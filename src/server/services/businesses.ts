import "server-only";
import { createHash, randomBytes } from "node:crypto";
import type { Prisma } from "@/generated/prisma/client";
import { PAGE_SIZE } from "@/lib/constants";
import { prisma } from "@/lib/db";
import {
  DEFAULT_OPENING_HOURS,
  businessCreateSchema,
  businessListFilterSchema,
  businessPlatformSettingsSchema,
  businessStatusSchema,
  inviteAdminSchema,
} from "@/lib/validators/business";
import { SECTION_DEFINITIONS, SECTION_TYPES } from "@/lib/website/sections";
import { defaultTheme, type TemplateKey } from "@/lib/website/theme";
import { recordAudit } from "@/server/audit";
import { ConflictError, NotFoundError, ValidationError } from "@/server/errors";
import { getPlatformSettings } from "@/server/services/platform";
import type { SessionUser } from "@/server/tenant";

export const INVITATION_TTL_DAYS = 7;

export function hashToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

/** Initial website configuration and sections for a new business. */
export function initialWebsiteData(businessName: string, template: TemplateKey) {
  const theme = defaultTheme(template);
  return {
    config: {
      template: theme.template,
      primaryColor: theme.primaryColor,
      secondaryColor: theme.secondaryColor,
      accentColor: theme.accentColor,
      fontFamily: theme.fontFamily,
      logoSettings: theme.logoSettings,
      navigationSettings: theme.navigationSettings,
      footerSettings: theme.footerSettings,
      seoSettings: theme.seoSettings,
    },
    sections: SECTION_TYPES.map((type, index) => {
      const d = SECTION_DEFINITIONS[type].defaults(businessName);
      return {
        type,
        title: d.title,
        subtitle: d.subtitle,
        content: d.content as Prisma.InputJsonValue,
        sortOrder: index,
        isVisible: d.isVisible,
      };
    }),
  };
}

export async function listBusinesses(rawFilter: unknown) {
  const filter = businessListFilterSchema.parse(rawFilter);
  const where: Prisma.BusinessWhereInput = {
    ...(filter.q ? { name: { contains: filter.q, mode: "insensitive" } } : {}),
    ...(filter.category ? { category: filter.category } : {}),
    ...(filter.status ? { status: filter.status } : {}),
  };
  const [total, items] = await prisma.$transaction([
    prisma.business.count({ where }),
    prisma.business.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (filter.page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
      select: {
        id: true,
        name: true,
        slug: true,
        category: true,
        city: true,
        status: true,
        publishedAt: true,
        createdAt: true,
        _count: { select: { products: true, enquiries: true, memberships: true } },
      },
    }),
  ]);
  return { items, total, page: filter.page, pageCount: Math.max(1, Math.ceil(total / PAGE_SIZE)), filter };
}

export async function getBusinessForAdmin(businessId: string) {
  const business = await prisma.business.findUnique({
    where: { id: businessId },
    include: {
      memberships: {
        orderBy: { createdAt: "asc" },
        include: { user: { select: { id: true, name: true, email: true, status: true } } },
      },
      invitations: {
        where: { acceptedAt: null, revokedAt: null },
        orderBy: { createdAt: "desc" },
        select: { id: true, email: true, name: true, role: true, expiresAt: true, createdAt: true },
      },
      websiteConfig: { select: { template: true, lastPublishedAt: true, publishedConfig: true } },
      _count: { select: { products: true, categories: true, enquiries: true } },
    },
  });
  if (!business) throw new NotFoundError("Business");
  const [publishedProducts, newEnquiries] = await Promise.all([
    prisma.product.count({ where: { businessId, status: "PUBLISHED" } }),
    prisma.enquiry.count({ where: { businessId, status: "NEW" } }),
  ]);
  return { ...business, publishedProducts, newEnquiries };
}

export async function createBusiness(actor: SessionUser, input: unknown) {
  const data = businessCreateSchema.parse(input);
  if (await prisma.business.findUnique({ where: { slug: data.slug }, select: { id: true } })) {
    throw new ConflictError("That web address is already taken", { slug: ["Choose a different web address"] });
  }
  const platform = await getPlatformSettings();
  const website = initialWebsiteData(data.name, platform.defaultTemplate);

  const business = await prisma.$transaction(async (tx) => {
    const created = await tx.business.create({
      data: {
        ...data,
        openingHours: DEFAULT_OPENING_HOURS,
        socialLinks: {},
        websiteConfig: { create: website.config },
        sections: { create: website.sections },
      },
    });
    await recordAudit(
      { actorId: actor.id, action: "business.created", entityType: "Business", entityId: created.id, businessId: created.id, metadata: { name: created.name, slug: created.slug } },
      tx,
    );
    return created;
  });
  return business;
}

export async function updateBusinessPlatformSettings(actor: SessionUser, businessId: string, input: unknown) {
  const data = businessPlatformSettingsSchema.parse(input);
  const existing = await prisma.business.findUnique({ where: { id: businessId }, select: { slug: true } });
  if (!existing) throw new NotFoundError("Business");
  if (data.slug !== existing.slug) {
    const taken = await prisma.business.findUnique({ where: { slug: data.slug }, select: { id: true } });
    if (taken) throw new ConflictError("That web address is already taken", { slug: ["Choose a different web address"] });
  }
  await prisma.business.update({ where: { id: businessId }, data });
  await recordAudit({
    actorId: actor.id,
    action: "business.settings_updated",
    entityType: "Business",
    entityId: businessId,
    businessId,
    metadata: { ...data, previousSlug: existing.slug },
  });
}

export async function setBusinessStatus(actor: SessionUser, businessId: string, rawStatus: unknown) {
  const status = businessStatusSchema.parse(rawStatus);
  const result = await prisma.business.updateMany({ where: { id: businessId }, data: { status } });
  if (result.count === 0) throw new NotFoundError("Business");
  await recordAudit({
    actorId: actor.id,
    action: status === "SUSPENDED" ? "business.suspended" : "business.activated",
    entityType: "Business",
    entityId: businessId,
    businessId,
  });
}

/** Deletion requires typing the business slug, as a guard against accidents. */
export async function deleteBusiness(actor: SessionUser, businessId: string, confirmSlug: string) {
  const business = await prisma.business.findUnique({ where: { id: businessId }, select: { slug: true, name: true } });
  if (!business) throw new NotFoundError("Business");
  if (confirmSlug.trim() !== business.slug) {
    throw new ValidationError("The confirmation does not match", { confirmSlug: [`Type ${business.slug} to confirm`] });
  }
  await prisma.$transaction(async (tx) => {
    await tx.business.delete({ where: { id: businessId } });
    await recordAudit(
      { actorId: actor.id, action: "business.deleted", entityType: "Business", entityId: businessId, businessId, metadata: business },
      tx,
    );
  });
}

export type InviteResult = { kind: "added-existing-user" } | { kind: "invited"; token: string };

/**
 * Assigns a business administrator. Existing (non-super-admin) users are added
 * directly; new people receive a single-use invitation link.
 */
export async function inviteBusinessAdmin(actor: SessionUser, businessId: string, input: unknown): Promise<InviteResult> {
  const data = inviteAdminSchema.parse(input);
  const business = await prisma.business.findUnique({ where: { id: businessId }, select: { id: true } });
  if (!business) throw new NotFoundError("Business");

  const existingUser = await prisma.user.findUnique({ where: { email: data.email }, select: { id: true, role: true } });
  if (existingUser) {
    if (existingUser.role === "SUPER_ADMIN") {
      throw new ValidationError("Super admins already have access to every business", { email: ["This is a super admin account"] });
    }
    const already = await prisma.businessMembership.findUnique({
      where: { userId_businessId: { userId: existingUser.id, businessId } },
    });
    if (already) throw new ConflictError("This person already manages the business", { email: ["Already a member"] });
    await prisma.businessMembership.create({ data: { userId: existingUser.id, businessId, role: data.role } });
    await recordAudit({
      actorId: actor.id,
      action: "business.admin_added",
      entityType: "BusinessMembership",
      entityId: existingUser.id,
      businessId,
      metadata: { email: data.email, role: data.role },
    });
    return { kind: "added-existing-user" };
  }

  const token = randomBytes(32).toString("base64url");
  await prisma.$transaction(async (tx) => {
    // Only one open invitation per email and business.
    await tx.invitation.updateMany({
      where: { businessId, email: data.email, acceptedAt: null, revokedAt: null },
      data: { revokedAt: new Date() },
    });
    const invitation = await tx.invitation.create({
      data: {
        businessId,
        email: data.email,
        name: data.name,
        role: data.role,
        tokenHash: hashToken(token),
        expiresAt: new Date(Date.now() + INVITATION_TTL_DAYS * 24 * 60 * 60 * 1000),
        invitedById: actor.id,
      },
    });
    await recordAudit(
      { actorId: actor.id, action: "business.admin_invited", entityType: "Invitation", entityId: invitation.id, businessId, metadata: { email: data.email, role: data.role } },
      tx,
    );
  });
  return { kind: "invited", token };
}

export async function revokeInvitation(actor: SessionUser, businessId: string, invitationId: string) {
  const result = await prisma.invitation.updateMany({
    where: { id: invitationId, businessId, acceptedAt: null, revokedAt: null },
    data: { revokedAt: new Date() },
  });
  if (result.count === 0) throw new NotFoundError("Invitation");
  await recordAudit({ actorId: actor.id, action: "business.invitation_revoked", entityType: "Invitation", entityId: invitationId, businessId });
}

export async function removeBusinessMember(actor: SessionUser, businessId: string, userId: string) {
  const result = await prisma.businessMembership.deleteMany({ where: { businessId, userId } });
  if (result.count === 0) throw new NotFoundError("Member");
  await recordAudit({ actorId: actor.id, action: "business.admin_removed", entityType: "BusinessMembership", entityId: userId, businessId });
}

export async function setUserStatus(actor: SessionUser, userId: string, status: "ACTIVE" | "SUSPENDED") {
  if (userId === actor.id) throw new ValidationError("You cannot change the status of your own account");
  const user = await prisma.user.findUnique({ where: { id: userId }, select: { role: true } });
  if (!user) throw new NotFoundError("User");
  if (user.role === "SUPER_ADMIN") throw new ValidationError("Super admin accounts cannot be suspended here");
  await prisma.$transaction([
    prisma.user.update({ where: { id: userId }, data: { status } }),
    // Suspension signs the user out everywhere.
    ...(status === "SUSPENDED" ? [prisma.session.deleteMany({ where: { userId } })] : []),
  ]);
  await recordAudit({ actorId: actor.id, action: `user.${status === "SUSPENDED" ? "suspended" : "activated"}`, entityType: "User", entityId: userId });
}

/** Verifies the business exists before a super admin starts managing its content. */
export async function startManagingBusiness(actor: SessionUser, businessId: string) {
  const business = await prisma.business.findUnique({ where: { id: businessId }, select: { id: true, name: true } });
  if (!business) throw new NotFoundError("Business");
  await recordAudit({ actorId: actor.id, action: "business.manage_started", entityType: "Business", entityId: businessId, businessId });
  return business;
}
