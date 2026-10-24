import "server-only";
import type { Prisma } from "@/generated/prisma/client";
import { prisma } from "@/lib/db";
import { moveInOrder, type MoveDirection } from "@/lib/reorder";
import {
  SECTION_DEFINITIONS,
  SECTION_TYPES,
  orderSections,
  sectionEditSchema,
  type SectionType,
} from "@/lib/website/sections";
import { parseSnapshot, siteSnapshotSchema, snapshotsEqual, type SiteSnapshot } from "@/lib/website/snapshot";
import { themeSchema, type Theme } from "@/lib/website/theme";
import { recordAudit } from "@/server/audit";
import { ForbiddenError, NotFoundError, ValidationError } from "@/server/errors";
import { assertImagesOwned } from "@/server/services/media";
import { getPlatformSettings } from "@/server/services/platform";
import { assertCan, can, type TenantContext } from "@/server/tenant";

async function loadDraft(businessId: string) {
  const [config, sections, platform] = await Promise.all([
    prisma.websiteConfig.findUnique({ where: { businessId } }),
    prisma.websiteSection.findMany({ where: { businessId } }),
    getPlatformSettings(),
  ]);
  if (!config) throw new NotFoundError("Website configuration");
  return { config, sections, platform };
}

function themeFromConfig(config: NonNullable<Awaited<ReturnType<typeof prisma.websiteConfig.findUnique>>>): unknown {
  return {
    template: config.template,
    primaryColor: config.primaryColor,
    secondaryColor: config.secondaryColor,
    accentColor: config.accentColor,
    fontFamily: config.fontFamily,
    logoSettings: config.logoSettings,
    navigationSettings: config.navigationSettings,
    footerSettings: config.footerSettings,
    seoSettings: config.seoSettings,
  };
}

/**
 * Builds the snapshot the public site would render from the current draft:
 * visible sections that are enabled platform-wide, in display order.
 */
export async function buildDraftSnapshot(businessId: string): Promise<
  { ok: true; snapshot: SiteSnapshot } | { ok: false; errors: string[] }
> {
  const { config, sections, platform } = await loadDraft(businessId);
  const enabled = new Set(platform.enabledSectionTypes);
  const visible = orderSections(sections.filter((s) => s.isVisible && enabled.has(s.type)));
  const result = siteSnapshotSchema.safeParse({
    version: 1,
    theme: themeFromConfig(config),
    sections: visible.map((s) => ({
      type: s.type,
      title: s.title,
      subtitle: s.subtitle,
      imageUrl: s.imageUrl,
      imageAlt: s.imageAlt,
      content: s.content,
    })),
  });
  if (!result.success) return { ok: false, errors: [...new Set(result.error.issues.map((i) => i.message))] };
  return { ok: true, snapshot: result.data as SiteSnapshot };
}

export async function getWebsiteOverview(ctx: TenantContext) {
  const [config, business, history, draft] = await Promise.all([
    prisma.websiteConfig.findUnique({
      where: { businessId: ctx.businessId },
      select: { template: true, publishedConfig: true, lastPublishedAt: true, updatedAt: true },
    }),
    prisma.business.findUnique({ where: { id: ctx.businessId }, select: { publishedAt: true, slug: true, allowSelfPublish: true } }),
    prisma.websitePublication.findMany({
      where: { businessId: ctx.businessId },
      orderBy: { createdAt: "desc" },
      take: 10,
      select: { id: true, createdAt: true, publishedBy: { select: { name: true } } },
    }),
    buildDraftSnapshot(ctx.businessId),
  ]);
  if (!config || !business) throw new NotFoundError("Website");
  const published = parseSnapshot(config.publishedConfig);
  return {
    isLive: business.publishedAt !== null && published !== null,
    slug: business.slug,
    publishedAt: business.publishedAt,
    lastPublishedAt: config.lastPublishedAt,
    template: config.template,
    hasPublishedVersion: published !== null,
    hasUnpublishedChanges: draft.ok ? !snapshotsEqual(draft.snapshot, published) : true,
    draftErrors: draft.ok ? [] : draft.errors,
    canPublish: can(ctx, "website:publish"),
    allowSelfPublish: business.allowSelfPublish,
    history,
  };
}

export async function getAppearance(ctx: TenantContext) {
  const [{ config, platform }, business] = await Promise.all([
    loadDraft(ctx.businessId),
    prisma.business.findUnique({ where: { id: ctx.businessId }, select: { logoUrl: true, name: true } }),
  ]);
  const theme = themeSchema.safeParse(themeFromConfig(config));
  return {
    theme: theme.success ? theme.data : null,
    enabledTemplates: platform.enabledTemplates,
    logoUrl: business?.logoUrl ?? null,
    businessName: business?.name ?? "",
  };
}

export async function updateAppearance(ctx: TenantContext, input: unknown) {
  assertCan(ctx, "content:manage");
  const theme: Theme = themeSchema.parse(input);
  const { config, platform } = await loadDraft(ctx.businessId);
  if (theme.template !== config.template && !platform.enabledTemplates.includes(theme.template)) {
    throw new ValidationError("This template is not available", { template: ["Choose an available template"] });
  }
  await assertImagesOwned(ctx.businessId, [theme.seoSettings.ogImageUrl]);
  await prisma.websiteConfig.update({
    where: { businessId: ctx.businessId },
    data: {
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
  });
}

export async function listSectionsForEditor(ctx: TenantContext) {
  const { sections, platform } = await loadDraft(ctx.businessId);
  const enabled = new Set(platform.enabledSectionTypes);
  return orderSections(sections)
    .filter((s) => enabled.has(s.type))
    .map((s) => ({
      id: s.id,
      type: s.type as SectionType,
      title: s.title,
      subtitle: s.subtitle,
      imageUrl: s.imageUrl,
      imageAlt: s.imageAlt,
      content: s.content,
      isVisible: s.isVisible,
      placement: SECTION_DEFINITIONS[s.type].placement,
    }));
}

async function findSection(ctx: TenantContext, type: SectionType) {
  const section = await prisma.websiteSection.findUnique({ where: { businessId_type: { businessId: ctx.businessId, type } } });
  if (!section) throw new NotFoundError("Section");
  return section;
}

export function parseSectionType(value: unknown): SectionType {
  if (typeof value === "string" && (SECTION_TYPES as readonly string[]).includes(value)) return value as SectionType;
  throw new NotFoundError("Section");
}

export async function updateSection(ctx: TenantContext, rawType: unknown, input: unknown) {
  assertCan(ctx, "content:manage");
  const type = parseSectionType(rawType);
  const section = await findSection(ctx, type);
  const data = sectionEditSchema(type).parse(input);
  const galleryUrls = type === "GALLERY" ? (data.content as { images: { url: string }[] }).images.map((i) => i.url) : [];
  await assertImagesOwned(ctx.businessId, [data.imageUrl, ...galleryUrls]);
  await prisma.websiteSection.update({
    where: { id: section.id },
    data: {
      title: data.title,
      subtitle: data.subtitle,
      imageUrl: data.imageUrl,
      imageAlt: data.imageAlt,
      content: data.content as Prisma.InputJsonValue,
    },
  });
}

export async function setSectionVisibility(ctx: TenantContext, rawType: unknown, isVisible: boolean) {
  assertCan(ctx, "content:manage");
  const section = await findSection(ctx, parseSectionType(rawType));
  await prisma.websiteSection.update({ where: { id: section.id }, data: { isVisible } });
}

/** Moves a body section; header, announcement and footer have fixed positions. */
export async function moveSection(ctx: TenantContext, rawType: unknown, direction: MoveDirection) {
  assertCan(ctx, "content:manage");
  const type = parseSectionType(rawType);
  if (SECTION_DEFINITIONS[type].placement !== "body") throw new ValidationError("This section has a fixed position");
  const sections = orderSections(await prisma.websiteSection.findMany({ where: { businessId: ctx.businessId } })).filter(
    (s) => SECTION_DEFINITIONS[s.type].placement === "body",
  );
  const moving = sections.find((s) => s.type === type);
  if (!moving) throw new NotFoundError("Section");
  const order = moveInOrder(sections.map((s) => s.id), moving.id, direction);
  if (!order) return;
  await prisma.$transaction(
    order.map((id, index) => prisma.websiteSection.update({ where: { id, businessId: ctx.businessId }, data: { sortOrder: index + 1 } })),
  );
}

/** Validates the draft and atomically makes it the live website. */
export async function publishWebsite(ctx: TenantContext) {
  if (!can(ctx, "website:publish")) {
    throw new ForbiddenError(
      ctx.business.allowSelfPublish ? "Only the business owner can publish" : "Publishing is managed by the platform administrator",
    );
  }
  const draft = await buildDraftSnapshot(ctx.businessId);
  if (!draft.ok) throw new ValidationError(`Fix these issues before publishing: ${draft.errors.join("; ")}`);
  const snapshot = draft.snapshot as unknown as Prisma.InputJsonValue;

  await prisma.$transaction(async (tx) => {
    const now = new Date();
    await tx.websiteConfig.update({ where: { businessId: ctx.businessId }, data: { publishedConfig: snapshot, lastPublishedAt: now } });
    await tx.business.update({ where: { id: ctx.businessId }, data: { publishedAt: now } });
    await tx.websitePublication.create({ data: { businessId: ctx.businessId, snapshot, publishedById: ctx.userId } });
    await recordAudit({ actorId: ctx.userId, action: "website.published", entityType: "Business", entityId: ctx.businessId, businessId: ctx.businessId }, tx);
  });
}

/** Takes the website offline. The last published snapshot is kept for re-publishing. */
export async function unpublishWebsite(ctx: TenantContext) {
  if (!can(ctx, "website:publish")) throw new ForbiddenError("You cannot change the publication status of this website");
  await prisma.$transaction(async (tx) => {
    await tx.business.update({ where: { id: ctx.businessId }, data: { publishedAt: null } });
    await recordAudit({ actorId: ctx.userId, action: "website.unpublished", entityType: "Business", entityId: ctx.businessId, businessId: ctx.businessId }, tx);
  });
}
