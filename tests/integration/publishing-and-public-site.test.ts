/**
 * Draft vs. published behaviour and what anonymous visitors can see.
 */
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { prisma } from "@/lib/db";
import { ForbiddenError, ValidationError } from "@/server/errors";
import { setBusinessStatus } from "@/server/services/businesses";
import { submitPublicEnquiry } from "@/server/services/enquiries";
import { createProduct } from "@/server/services/products";
import { getHomeData, getLiveSite, getPublicCatalogue, getPublicProduct } from "@/server/services/public-site";
import {
  getWebsiteOverview,
  moveSection,
  publishWebsite,
  setSectionVisibility,
  unpublishWebsite,
  updateSection,
} from "@/server/services/website";
import type { SessionUser } from "@/server/tenant";
import { createSuperAdmin, createTenant, productInput, resetDatabase } from "./helpers";

let admin: SessionUser;
let t: Awaited<ReturnType<typeof createTenant>>;

beforeAll(async () => {
  await resetDatabase();
  admin = await createSuperAdmin();
  t = await createTenant(admin, "Royal Test Furniture");
  await createProduct(t.ctx, productInput("Published Sofa", { isFeatured: true }));
  await createProduct(t.ctx, productInput("Draft Bed", { status: "DRAFT", isFeatured: true }));
  await createProduct(t.ctx, productInput("Secret Price Table", { price: "99999", priceVisibility: "CONTACT_FOR_PRICE" }));
});

afterAll(async () => {
  await prisma.$disconnect();
});

const heroTitle = async (slug: string) => {
  const site = await getLiveSite(slug);
  const hero = site?.snapshot.sections.find((s) => s.type === "HERO");
  return hero?.title;
};

const heroInput = (title: string) => ({
  title,
  subtitle: "",
  imageUrl: null,
  imageAlt: "",
  content: { primaryCtaLabel: "Browse", primaryCtaTarget: "PRODUCTS", secondaryCtaLabel: "", secondaryCtaTarget: "CONTACT" },
});

describe("unpublished websites", () => {
  it("are not visible to anonymous visitors", async () => {
    expect(await getLiveSite(t.slug)).toBeNull();
  });

  it("do not accept enquiries", async () => {
    const input = { businessSlug: t.slug, productSlug: "", customerName: "Visitor", email: "", phone: "+91 98765 43210", message: "Hello, is this open?", hpField: "" };
    await expect(submitPublicEnquiry(input, "ip-unpublished")).rejects.toBeInstanceOf(ValidationError);
  });
});

describe("draft and publish", () => {
  it("publishing makes the draft live", async () => {
    await updateSection(t.ctx, "HERO", heroInput("First headline"));
    await publishWebsite(t.ctx);
    expect(await heroTitle(t.slug)).toBe("First headline");
    expect((await getWebsiteOverview(t.ctx)).hasUnpublishedChanges).toBe(false);
  });

  it("draft edits do not change the live website until published", async () => {
    await updateSection(t.ctx, "HERO", heroInput("Second headline"));
    await setSectionVisibility(t.ctx, "ABOUT", false);
    await moveSection(t.ctx, "HERO", "down");

    expect(await heroTitle(t.slug)).toBe("First headline");
    const live = await getLiveSite(t.slug);
    expect(live?.snapshot.sections.some((s) => s.type === "ABOUT")).toBe(true);
    expect((await getWebsiteOverview(t.ctx)).hasUnpublishedChanges).toBe(true);

    await publishWebsite(t.ctx);
    expect(await heroTitle(t.slug)).toBe("Second headline");
    const republished = await getLiveSite(t.slug);
    expect(republished?.snapshot.sections.some((s) => s.type === "ABOUT")).toBe(false);
    expect(await prisma.websitePublication.count({ where: { businessId: t.businessId } })).toBe(2);
  });

  it("rejects invalid section content", async () => {
    await expect(updateSection(t.ctx, "HERO", { ...heroInput("X"), content: { primaryCtaLabel: "" } })).rejects.toThrow();
    await expect(updateSection(t.ctx, "NOT_A_SECTION", heroInput("X"))).rejects.toThrow();
  });

  it("unpublishing takes the website offline", async () => {
    await unpublishWebsite(t.ctx);
    expect(await getLiveSite(t.slug)).toBeNull();
    await publishWebsite(t.ctx);
    expect(await getLiveSite(t.slug)).not.toBeNull();
  });

  it("respects the platform's self-publish setting", async () => {
    await prisma.business.update({ where: { id: t.businessId }, data: { allowSelfPublish: false } });
    const ctx = { ...t.ctx, business: { ...t.ctx.business, allowSelfPublish: false } };
    await expect(publishWebsite(ctx)).rejects.toBeInstanceOf(ForbiddenError);
    await prisma.business.update({ where: { id: t.businessId }, data: { allowSelfPublish: true } });
  });
});

describe("public catalogue", () => {
  it("never exposes draft products", async () => {
    const site = (await getLiveSite(t.slug))!;
    const catalogue = await getPublicCatalogue(site.business.id, { page: 1 });
    expect(catalogue.products.map((p) => p.name).sort()).toEqual(["Published Sofa", "Secret Price Table"]);
    expect(await getPublicProduct(site.business.id, "draft-bed")).toBeNull();
    const home = await getHomeData(site.business.id, site.snapshot);
    expect(home.featured.map((p) => p.name)).toEqual(["Published Sofa"]);
  });

  it("does not send hidden prices to the browser", async () => {
    const site = (await getLiveSite(t.slug))!;
    const product = await getPublicProduct(site.business.id, "secret-price-table");
    expect(product?.priceVisibility).toBe("CONTACT_FOR_PRICE");
    expect(product?.priceMinor).toBeNull();
  });

  it("hides the website of a suspended business", async () => {
    await setBusinessStatus(admin, t.businessId, "SUSPENDED");
    expect(await getLiveSite(t.slug)).toBeNull();
    await setBusinessStatus(admin, t.businessId, "ACTIVE");
    expect(await getLiveSite(t.slug)).not.toBeNull();
  });
});

describe("public enquiries", () => {
  const enquiry = (overrides: Record<string, string> = {}) => ({
    businessSlug: t.slug,
    productSlug: "",
    customerName: "Asha Patnaik",
    email: "asha@example.com",
    phone: "",
    message: "Do you deliver to Cuttack?",
    hpField: "",
    ...overrides,
  });

  it("are stored against the right business and product", async () => {
    await submitPublicEnquiry(enquiry({ productSlug: "published-sofa" }), "ip-a");
    const stored = await prisma.enquiry.findFirstOrThrow({ where: { businessId: t.businessId }, include: { product: true } });
    expect(stored.product?.name).toBe("Published Sofa");
    expect(stored.status).toBe("NEW");
  });

  it("do not link draft products", async () => {
    await submitPublicEnquiry(enquiry({ productSlug: "draft-bed", message: "Asking about the bed please" }), "ip-b");
    const stored = await prisma.enquiry.findFirstOrThrow({ where: { message: "Asking about the bed please" } });
    expect(stored.productId).toBeNull();
  });

  it("silently drop submissions that fill the honeypot", async () => {
    const before = await prisma.enquiry.count();
    expect(await submitPublicEnquiry(enquiry({ hpField: "http://spam.example" }), "ip-c")).toEqual({ stored: false });
    expect(await prisma.enquiry.count()).toBe(before);
  });

  it("are rate limited per visitor", async () => {
    for (let i = 0; i < 5; i++) await submitPublicEnquiry(enquiry({ message: `Message number ${i}` }), "ip-flood");
    await expect(submitPublicEnquiry(enquiry(), "ip-flood")).rejects.toThrow(/Too many requests/);
  });

  it("are rejected when the business has enquiries switched off", async () => {
    await prisma.business.update({ where: { id: t.businessId }, data: { enquiriesEnabled: false } });
    await expect(submitPublicEnquiry(enquiry(), "ip-d")).rejects.toBeInstanceOf(ValidationError);
    await prisma.business.update({ where: { id: t.businessId }, data: { enquiriesEnabled: true } });
  });
});
