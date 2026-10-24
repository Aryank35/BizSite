import { randomUUID } from "node:crypto";
import { prisma } from "@/lib/db";
import { createBusiness } from "@/server/services/businesses";
import { resolveTenantContext, type SessionUser, type TenantContext } from "@/server/tenant";

export async function resetDatabase() {
  await prisma.$executeRawUnsafe(`
    TRUNCATE TABLE audit_logs, enquiries, product_images, products, categories, website_sections,
      website_publications, website_configs, media_assets, invitations, business_memberships, businesses,
      sessions, accounts, verifications, users, auth_rate_limits, throttle_buckets, website_requests,
      platform_settings CASCADE`);
}

export async function createSuperAdmin(): Promise<SessionUser> {
  const user = await prisma.user.create({
    data: { name: "Platform Admin", email: `admin-${randomUUID()}@test.local`, role: "SUPER_ADMIN" },
  });
  return { id: user.id, name: user.name, email: user.email, role: "SUPER_ADMIN" };
}

/** A business with one administrator, and the tenant context that administrator gets. */
export async function createTenant(
  admin: SessionUser,
  name: string,
  role: "OWNER" | "EDITOR" = "OWNER",
): Promise<{ businessId: string; slug: string; user: SessionUser; ctx: TenantContext }> {
  const slug = `${name.toLowerCase().replace(/[^a-z0-9]+/g, "-")}-${randomUUID().slice(0, 6)}`;
  const business = await createBusiness(admin, {
    name,
    slug,
    category: "furniture",
    description: "",
    email: "",
    phone: "",
    whatsappNumber: "919437012345",
    city: "",
    state: "",
  });
  const user = await prisma.user.create({ data: { name: `${name} Owner`, email: `${slug}@test.local` } });
  await prisma.businessMembership.create({ data: { userId: user.id, businessId: business.id, role } });
  const sessionUser: SessionUser = { id: user.id, name: user.name, email: user.email, role: "BUSINESS_ADMIN" };
  const ctx = await resolveTenantContext(sessionUser, business.id);
  if (!ctx) throw new Error("tenant context not resolved");
  return { businessId: business.id, slug, user: sessionUser, ctx };
}

export function productInput(name: string, overrides: Record<string, unknown> = {}) {
  return {
    name,
    slug: "",
    categoryId: "",
    shortDescription: "",
    description: "",
    sku: "",
    price: "1000",
    priceVisibility: "SHOW",
    featuredImageUrl: null,
    galleryImages: [],
    status: "PUBLISHED",
    isFeatured: false,
    seoTitle: "",
    seoDescription: "",
    ...overrides,
  };
}
