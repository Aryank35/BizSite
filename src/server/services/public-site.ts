import "server-only";
import type { Prisma } from "@/generated/prisma/client";
import { PUBLIC_PAGE_SIZE } from "@/lib/constants";
import { prisma } from "@/lib/db";
import { openingHoursSchema, socialLinksSchema, type OpeningHours, type SocialLinks } from "@/lib/validators/business";
import { parseSnapshot, type SiteSnapshot } from "@/lib/website/snapshot";
import { buildDraftSnapshot } from "@/server/services/website";

/** Only explicitly public profile fields. */
const publicBusinessSelect = {
  id: true,
  name: true,
  slug: true,
  description: true,
  logoUrl: true,
  email: true,
  phone: true,
  whatsappNumber: true,
  addressLine: true,
  city: true,
  state: true,
  postalCode: true,
  openingHours: true,
  socialLinks: true,
  currency: true,
  enquiriesEnabled: true,
  whatsappEnabled: true,
  updatedAt: true,
} satisfies Prisma.BusinessSelect;

type BusinessRow = Prisma.BusinessGetPayload<{ select: typeof publicBusinessSelect }>;

export type PublicBusiness = Omit<BusinessRow, "openingHours" | "socialLinks"> & {
  openingHours: OpeningHours | null;
  socialLinks: SocialLinks;
};

function toPublicBusiness(row: BusinessRow): PublicBusiness {
  const hours = openingHoursSchema.safeParse(row.openingHours);
  const social = socialLinksSchema.safeParse(row.socialLinks ?? {});
  return {
    ...row,
    // Respect feature flags: a disabled channel is not exposed at all.
    whatsappNumber: row.whatsappEnabled ? row.whatsappNumber : null,
    openingHours: hours.success ? hours.data : null,
    socialLinks: social.success ? social.data : socialLinksSchema.parse({}),
  };
}

export type SiteBundle = { business: PublicBusiness; snapshot: SiteSnapshot };

/** The live website: active business, published, with a valid published snapshot. */
export async function getLiveSite(slug: string): Promise<SiteBundle | null> {
  const row = await prisma.business.findFirst({
    where: { slug, status: "ACTIVE", publishedAt: { not: null } },
    select: { ...publicBusinessSelect, websiteConfig: { select: { publishedConfig: true } } },
  });
  if (!row) return null;
  const snapshot = parseSnapshot(row.websiteConfig?.publishedConfig);
  if (!snapshot) return null;
  const { websiteConfig: _config, ...business } = row;
  return { business: toPublicBusiness(business), snapshot };
}

/** Draft preview. The caller must have authorised access to the business. */
export async function getPreviewSite(
  businessId: string,
): Promise<{ business: PublicBusiness; snapshot: SiteSnapshot | null; errors: string[] } | null> {
  const row = await prisma.business.findUnique({ where: { id: businessId }, select: publicBusinessSelect });
  if (!row) return null;
  const draft = await buildDraftSnapshot(businessId);
  return {
    business: toPublicBusiness(row),
    snapshot: draft.ok ? draft.snapshot : null,
    errors: draft.ok ? [] : draft.errors,
  };
}

const publicProductSelect = {
  id: true,
  slug: true,
  name: true,
  shortDescription: true,
  priceMinor: true,
  priceVisibility: true,
  featuredImageUrl: true,
  category: { select: { name: true, slug: true } },
} satisfies Prisma.ProductSelect;

type ProductRow = Prisma.ProductGetPayload<{ select: typeof publicProductSelect }>;
export type PublicProductCard = Omit<ProductRow, "id">;

/** Hidden prices never leave the server. */
function toCard({ id: _id, ...row }: ProductRow): PublicProductCard {
  return { ...row, priceMinor: row.priceVisibility === "SHOW" ? row.priceMinor : null };
}

const publishedOrder: Prisma.ProductOrderByWithRelationInput[] = [{ sortOrder: "asc" }, { createdAt: "desc" }];

export type PublicCategory = { name: string; slug: string; description: string | null; productCount: number };

export async function getPublicCategories(businessId: string): Promise<PublicCategory[]> {
  const categories = await prisma.category.findMany({
    where: { businessId },
    orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
    select: { name: true, slug: true, description: true, _count: { select: { products: { where: { status: "PUBLISHED" } } } } },
  });
  return categories
    .map((c) => ({ name: c.name, slug: c.slug, description: c.description, productCount: c._count.products }))
    .filter((c) => c.productCount > 0);
}

export type HomeData = {
  featured: PublicProductCard[];
  latest: PublicProductCard[];
  categories: PublicCategory[];
};

/** Loads only the data the visible homepage sections need. */
export async function getHomeData(businessId: string, snapshot: SiteSnapshot): Promise<HomeData> {
  const featuredSection = snapshot.sections.find((s) => s.type === "FEATURED_PRODUCTS");
  const catalogueSection = snapshot.sections.find((s) => s.type === "CATALOGUE");
  const needsCategories = snapshot.sections.some((s) => s.type === "CATEGORIES");

  const [featured, latest, categories] = await Promise.all([
    featuredSection
      ? prisma.product.findMany({
          where: { businessId, status: "PUBLISHED", isFeatured: true },
          orderBy: publishedOrder,
          take: featuredSection.content.limit,
          select: publicProductSelect,
        })
      : [],
    catalogueSection
      ? prisma.product.findMany({
          where: { businessId, status: "PUBLISHED" },
          orderBy: publishedOrder,
          take: catalogueSection.content.limit,
          select: publicProductSelect,
        })
      : [],
    needsCategories ? getPublicCategories(businessId) : [],
  ]);
  return { featured: featured.map(toCard), latest: latest.map(toCard), categories };
}

export async function getPublicCatalogue(businessId: string, options: { page: number; categorySlug?: string | null }) {
  const categories = await getPublicCategories(businessId);
  const activeCategory = options.categorySlug ? (categories.find((c) => c.slug === options.categorySlug) ?? null) : null;
  const where: Prisma.ProductWhereInput = {
    businessId,
    status: "PUBLISHED",
    ...(activeCategory ? { category: { slug: activeCategory.slug } } : {}),
  };
  const total = await prisma.product.count({ where });
  const pageCount = Math.max(1, Math.ceil(total / PUBLIC_PAGE_SIZE));
  const page = Math.min(Math.max(1, options.page), pageCount);
  const products = await prisma.product.findMany({
    where,
    orderBy: publishedOrder,
    skip: (page - 1) * PUBLIC_PAGE_SIZE,
    take: PUBLIC_PAGE_SIZE,
    select: publicProductSelect,
  });
  return { products: products.map(toCard), categories, activeCategory, page, pageCount, total };
}

export async function getPublicProduct(businessId: string, productSlug: string) {
  const product = await prisma.product.findFirst({
    where: { businessId, slug: productSlug, status: "PUBLISHED" },
    select: {
      ...publicProductSelect,
      description: true,
      sku: true,
      seoTitle: true,
      seoDescription: true,
      updatedAt: true,
      categoryId: true,
      images: { orderBy: { sortOrder: "asc" }, select: { url: true, alt: true } },
    },
  });
  if (!product) return null;
  const related = await prisma.product.findMany({
    where: {
      businessId,
      status: "PUBLISHED",
      id: { not: product.id },
      ...(product.categoryId ? { categoryId: product.categoryId } : {}),
    },
    orderBy: publishedOrder,
    take: 4,
    select: publicProductSelect,
  });
  const { categoryId: _categoryId, ...rest } = product;
  return {
    ...toCard(rest),
    description: rest.description,
    sku: rest.sku,
    seoTitle: rest.seoTitle,
    seoDescription: rest.seoDescription,
    updatedAt: rest.updatedAt,
    images: rest.images,
    related: related.map(toCard),
  };
}

export type PublicProductDetail = NonNullable<Awaited<ReturnType<typeof getPublicProduct>>>;

/** Published, active businesses and their published products, for the sitemap. */
export async function getSitemapEntries() {
  return prisma.business.findMany({
    where: { status: "ACTIVE", publishedAt: { not: null } },
    select: {
      slug: true,
      updatedAt: true,
      products: { where: { status: "PUBLISHED" }, select: { slug: true, updatedAt: true } },
    },
  });
}
