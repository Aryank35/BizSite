/**
 * Proves that a business administrator can never read, update or delete
 * another business's records, even when they know the record ids.
 */
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { prisma } from "@/lib/db";
import { NotFoundError, ValidationError } from "@/server/errors";
import { createCategory, deleteCategory, listCategories, moveCategory, updateCategory } from "@/server/services/categories";
import { deleteEnquiry, getEnquiry, listEnquiries, updateEnquiryStatus } from "@/server/services/enquiries";
import {
  createProduct,
  deleteProduct,
  getProduct,
  listProducts,
  moveProduct,
  setProductFeatured,
  setProductStatus,
  updateProduct,
} from "@/server/services/products";
import { getBusinessProfile, updateBusinessProfile } from "@/server/services/profile";
import { resolveTenantContext, type TenantContext } from "@/server/tenant";
import { createSuperAdmin, createTenant, productInput, resetDatabase } from "./helpers";

let a: Awaited<ReturnType<typeof createTenant>>;
let b: Awaited<ReturnType<typeof createTenant>>;
let productB: { id: string; name: string };
let categoryB: { id: string; name: string };
let enquiryB: { id: string };
let mediaUrlB: string;

beforeAll(async () => {
  await resetDatabase();
  const admin = await createSuperAdmin();
  a = await createTenant(admin, "Alpha Furniture");
  b = await createTenant(admin, "Beta Windows");

  categoryB = await createCategory(b.ctx, { name: "Doors", slug: "", description: "" });
  productB = await createProduct(b.ctx, productInput("Beta Door", { categoryId: categoryB.id }));
  enquiryB = await prisma.enquiry.create({
    data: { businessId: b.businessId, customerName: "Customer", phone: "+91 98765 43210", message: "Private enquiry for Beta" },
  });
  mediaUrlB = "/media/beta/0123456789abcdef0123456789abcdef.jpg";
  await prisma.mediaAsset.create({
    data: { businessId: b.businessId, storageKey: "beta/0123456789abcdef0123456789abcdef.jpg", url: mediaUrlB, mimeType: "image/jpeg", sizeBytes: 10 },
  });
});

afterAll(async () => {
  await prisma.$disconnect();
});

async function expectNotFound(promise: Promise<unknown>) {
  await expect(promise).rejects.toBeInstanceOf(NotFoundError);
}

describe("tenant context resolution", () => {
  it("never grants access to a business the user is not a member of", async () => {
    // Even when the user asks for business B (e.g. a tampered cookie), they get their own business.
    const ctx = await resolveTenantContext(a.user, b.businessId);
    expect(ctx?.businessId).toBe(a.businessId);
  });

  it("returns no context for a user without memberships", async () => {
    const stranger = await prisma.user.create({ data: { name: "Stranger", email: "stranger@test.local" } });
    expect(await resolveTenantContext({ id: stranger.id, name: "S", email: stranger.email, role: "BUSINESS_ADMIN" }, b.businessId)).toBeNull();
  });
});

describe("products", () => {
  it("cannot read another business's product", async () => {
    await expectNotFound(getProduct(a.ctx, productB.id));
  });

  it("cannot update, publish, feature, reorder or delete it", async () => {
    await expectNotFound(updateProduct(a.ctx, productB.id, productInput("Hijacked")));
    await expectNotFound(setProductStatus(a.ctx, productB.id, "DRAFT"));
    await expectNotFound(setProductFeatured(a.ctx, productB.id, true));
    await expectNotFound(moveProduct(a.ctx, productB.id, "up"));
    await expectNotFound(deleteProduct(a.ctx, productB.id));

    const unchanged = await prisma.product.findUniqueOrThrow({ where: { id: productB.id } });
    expect(unchanged.name).toBe("Beta Door");
    expect(unchanged.status).toBe("PUBLISHED");
    expect(unchanged.isFeatured).toBe(false);
  });

  it("does not list another business's products", async () => {
    await createProduct(a.ctx, productInput("Alpha Chair"));
    const list = await listProducts(a.ctx, {});
    expect(list.items.map((p) => p.name)).toEqual(["Alpha Chair"]);
    const filtered = await listProducts(a.ctx, { category: categoryB.id });
    expect(filtered.items).toHaveLength(0);
  });

  it("cannot attach another business's category or images", async () => {
    await expect(createProduct(a.ctx, productInput("Sneaky", { categoryId: categoryB.id }))).rejects.toBeInstanceOf(ValidationError);
    await expect(createProduct(a.ctx, productInput("Sneaky", { featuredImageUrl: mediaUrlB }))).rejects.toBeInstanceOf(ValidationError);
    await expect(
      createProduct(a.ctx, productInput("Sneaky", { galleryImages: [{ url: mediaUrlB, alt: "" }] })),
    ).rejects.toBeInstanceOf(ValidationError);
  });
});

describe("categories", () => {
  it("cannot update, reorder or delete another business's category", async () => {
    await expectNotFound(updateCategory(a.ctx, categoryB.id, { name: "Hijacked", slug: "", description: "" }));
    await expectNotFound(moveCategory(a.ctx, categoryB.id, "down"));
    await expectNotFound(deleteCategory(a.ctx, categoryB.id));
    expect((await prisma.category.findUniqueOrThrow({ where: { id: categoryB.id } })).name).toBe("Doors");
    expect((await listCategories(a.ctx)).some((c) => c.id === categoryB.id)).toBe(false);
  });
});

describe("enquiries", () => {
  it("cannot read, update or delete another business's enquiries", async () => {
    await expectNotFound(getEnquiry(a.ctx, enquiryB.id));
    await expectNotFound(updateEnquiryStatus(a.ctx, enquiryB.id, "RESOLVED"));
    await expectNotFound(deleteEnquiry(a.ctx, enquiryB.id));
    expect((await prisma.enquiry.findUniqueOrThrow({ where: { id: enquiryB.id } })).status).toBe("NEW");
    expect((await listEnquiries(a.ctx, {})).total).toBe(0);
  });
});

describe("business profile", () => {
  it("only ever reads and writes the caller's own business", async () => {
    expect((await getBusinessProfile(a.ctx)).name).toBe("Alpha Furniture");
    const profile = await getBusinessProfile(a.ctx);
    await updateBusinessProfile(a.ctx, {
      ...profile,
      name: "Alpha Furniture Ltd",
      whatsappNumber: "919437012345",
      socialLinks: profile.socialLinks,
    });
    expect((await prisma.business.findUniqueOrThrow({ where: { id: b.businessId } })).name).toBe("Beta Windows");
  });

  it("cannot point the logo at another business's upload", async () => {
    const profile = await getBusinessProfile(a.ctx);
    await expect(updateBusinessProfile(a.ctx, { ...profile, logoUrl: mediaUrlB })).rejects.toBeInstanceOf(ValidationError);
  });

  it("ignores any businessId smuggled into the input", async () => {
    const profile = await getBusinessProfile(a.ctx);
    const tampered = { ...profile, name: "Smuggled", businessId: b.businessId, id: b.businessId } as unknown;
    await updateBusinessProfile(a.ctx, tampered);
    expect((await prisma.business.findUniqueOrThrow({ where: { id: b.businessId } })).name).toBe("Beta Windows");
  });
});

describe("permissions within a business", () => {
  it("editors manage content but cannot change the profile or publish", async () => {
    const admin = await createSuperAdmin();
    const editor = await createTenant(admin, "Gamma Decor", "EDITOR");
    const ctx: TenantContext = editor.ctx;
    await expect(createProduct(ctx, productInput("Lamp"))).resolves.toBeTruthy();
    const profile = await getBusinessProfile(ctx);
    await expect(updateBusinessProfile(ctx, profile)).rejects.toThrow(/permission/);
  });

  it("members of a suspended business cannot change anything", async () => {
    await prisma.business.update({ where: { id: b.businessId }, data: { status: "SUSPENDED" } });
    const suspended = await resolveTenantContext(b.user, b.businessId);
    await expect(createProduct(suspended!, productInput("Blocked"))).rejects.toThrow(/permission/);
    await prisma.business.update({ where: { id: b.businessId }, data: { status: "ACTIVE" } });
  });
});
