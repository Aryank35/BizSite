import "server-only";
import type { Prisma } from "@/generated/prisma/client";
import { PAGE_SIZE } from "@/lib/constants";
import { prisma } from "@/lib/db";
import { moveInOrder, uniqueSlug, type MoveDirection } from "@/lib/reorder";
import { productListFilterSchema, productSchema } from "@/lib/validators/catalogue";
import { slugify } from "@/lib/validators/common";
import { ConflictError, NotFoundError, ValidationError } from "@/server/errors";
import { assertImagesOwned } from "@/server/services/media";
import { assertCan, type TenantContext } from "@/server/tenant";

export async function listProducts(ctx: TenantContext, rawFilter: unknown) {
  const filter = productListFilterSchema.parse(rawFilter);
  const where: Prisma.ProductWhereInput = {
    businessId: ctx.businessId,
    ...(filter.q
      ? { OR: [{ name: { contains: filter.q, mode: "insensitive" } }, { sku: { contains: filter.q, mode: "insensitive" } }] }
      : {}),
    ...(filter.category === "none" ? { categoryId: null } : filter.category ? { categoryId: filter.category } : {}),
    ...(filter.status ? { status: filter.status } : {}),
  };
  const [total, items] = await prisma.$transaction([
    prisma.product.count({ where }),
    prisma.product.findMany({
      where,
      orderBy: [{ sortOrder: "asc" }, { createdAt: "desc" }],
      skip: (filter.page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
      select: {
        id: true,
        name: true,
        slug: true,
        sku: true,
        status: true,
        isFeatured: true,
        priceMinor: true,
        priceVisibility: true,
        featuredImageUrl: true,
        updatedAt: true,
        category: { select: { id: true, name: true } },
      },
    }),
  ]);
  return { items, total, page: filter.page, pageCount: Math.max(1, Math.ceil(total / PAGE_SIZE)), filter };
}

export async function getProduct(ctx: TenantContext, productId: string) {
  const product = await prisma.product.findFirst({
    where: { id: productId, businessId: ctx.businessId },
    include: { images: { orderBy: { sortOrder: "asc" } }, category: { select: { id: true, name: true } } },
  });
  if (!product) throw new NotFoundError("Product");
  return product;
}

async function slugTaken(businessId: string, slug: string, exceptId?: string) {
  const found = await prisma.product.findFirst({
    where: { businessId, slug, NOT: exceptId ? { id: exceptId } : undefined },
    select: { id: true },
  });
  return Boolean(found);
}

async function validateRelations(ctx: TenantContext, data: ReturnType<typeof productSchema.parse>) {
  if (data.categoryId) {
    const category = await prisma.category.findFirst({ where: { id: data.categoryId, businessId: ctx.businessId }, select: { id: true } });
    if (!category) throw new ValidationError("Choose a valid category", { categoryId: ["Unknown category"] });
  }
  await assertImagesOwned(ctx.businessId, [data.featuredImageUrl, ...data.galleryImages.map((g) => g.url)]);
}

function productData(data: ReturnType<typeof productSchema.parse>) {
  return {
    name: data.name,
    categoryId: data.categoryId,
    shortDescription: data.shortDescription,
    description: data.description,
    sku: data.sku,
    priceMinor: data.price,
    priceVisibility: data.priceVisibility,
    featuredImageUrl: data.featuredImageUrl,
    status: data.status,
    isFeatured: data.isFeatured,
    seoTitle: data.seoTitle,
    seoDescription: data.seoDescription,
  };
}

async function assertSkuFree(ctx: TenantContext, sku: string | null, exceptId?: string) {
  if (!sku) return;
  const found = await prisma.product.findFirst({
    where: { businessId: ctx.businessId, sku, NOT: exceptId ? { id: exceptId } : undefined },
    select: { id: true },
  });
  if (found) throw new ConflictError("SKU already used", { sku: ["Another product uses this SKU"] });
}

export async function createProduct(ctx: TenantContext, input: unknown) {
  assertCan(ctx, "content:manage");
  const data = productSchema.parse(input);
  await validateRelations(ctx, data);
  await assertSkuFree(ctx, data.sku);

  let slug: string;
  if (data.slug) {
    if (await slugTaken(ctx.businessId, data.slug)) throw new ConflictError("Slug already used", { slug: ["Another product uses this slug"] });
    slug = data.slug;
  } else {
    slug = await uniqueSlug(slugify(data.name), (s) => slugTaken(ctx.businessId, s));
  }

  // New products appear first.
  const first = await prisma.product.aggregate({ where: { businessId: ctx.businessId }, _min: { sortOrder: true } });
  return prisma.product.create({
    data: {
      ...productData(data),
      businessId: ctx.businessId,
      slug,
      sortOrder: (first._min.sortOrder ?? 1) - 1,
      publishedAt: data.status === "PUBLISHED" ? new Date() : null,
      images: { create: data.galleryImages.map((img, index) => ({ url: img.url, alt: img.alt, sortOrder: index })) },
    },
  });
}

export async function updateProduct(ctx: TenantContext, productId: string, input: unknown) {
  assertCan(ctx, "content:manage");
  const existing = await getProduct(ctx, productId);
  const data = productSchema.parse(input);
  await validateRelations(ctx, data);
  await assertSkuFree(ctx, data.sku, existing.id);

  const slug = data.slug ?? existing.slug;
  if (slug !== existing.slug && (await slugTaken(ctx.businessId, slug, existing.id))) {
    throw new ConflictError("Slug already used", { slug: ["Another product uses this slug"] });
  }

  return prisma.$transaction(async (tx) => {
    await tx.productImage.deleteMany({ where: { productId: existing.id } });
    return tx.product.update({
      where: { id: existing.id },
      data: {
        ...productData(data),
        slug,
        publishedAt: data.status === "PUBLISHED" ? (existing.publishedAt ?? new Date()) : existing.publishedAt,
        images: { create: data.galleryImages.map((img, index) => ({ url: img.url, alt: img.alt, sortOrder: index })) },
      },
    });
  });
}

export async function setProductStatus(ctx: TenantContext, productId: string, status: "DRAFT" | "PUBLISHED") {
  assertCan(ctx, "content:manage");
  const existing = await getProduct(ctx, productId);
  await prisma.product.update({
    where: { id: existing.id },
    data: { status, publishedAt: status === "PUBLISHED" ? (existing.publishedAt ?? new Date()) : existing.publishedAt },
  });
}

export async function setProductFeatured(ctx: TenantContext, productId: string, isFeatured: boolean) {
  assertCan(ctx, "content:manage");
  const existing = await getProduct(ctx, productId);
  await prisma.product.update({ where: { id: existing.id }, data: { isFeatured } });
}

export async function deleteProduct(ctx: TenantContext, productId: string) {
  assertCan(ctx, "content:manage");
  const existing = await getProduct(ctx, productId);
  await prisma.product.delete({ where: { id: existing.id } });
}

/**
 * Moves a product one place within the full catalogue order. Featured
 * products are displayed in the same order, so this also orders them.
 */
export async function moveProduct(ctx: TenantContext, productId: string, direction: MoveDirection, featuredOnly = false) {
  assertCan(ctx, "content:manage");
  await getProduct(ctx, productId);
  const all = await prisma.product.findMany({
    where: { businessId: ctx.businessId, ...(featuredOnly ? { isFeatured: true } : {}) },
    orderBy: [{ sortOrder: "asc" }, { createdAt: "desc" }],
    select: { id: true, sortOrder: true },
  });
  const order = moveInOrder(all.map((p) => p.id), productId, direction);
  if (!order) return;
  // Reuse the existing sort slots so products outside this list keep their positions.
  const slots = all.map((p) => p.sortOrder).sort((a, b) => a - b);
  const distinct = new Set(slots).size === slots.length;
  const base = distinct ? slots : order.map((_, i) => i + (slots[0] ?? 0));
  await prisma.$transaction(
    order.map((id, index) => prisma.product.update({ where: { id, businessId: ctx.businessId }, data: { sortOrder: base[index] } })),
  );
}

export async function listFeaturedProducts(ctx: TenantContext) {
  return prisma.product.findMany({
    where: { businessId: ctx.businessId, isFeatured: true },
    orderBy: [{ sortOrder: "asc" }, { createdAt: "desc" }],
    select: { id: true, name: true, status: true, featuredImageUrl: true },
  });
}
