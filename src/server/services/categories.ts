import "server-only";
import { prisma } from "@/lib/db";
import { moveInOrder, uniqueSlug, type MoveDirection } from "@/lib/reorder";
import { categorySchema } from "@/lib/validators/catalogue";
import { slugify } from "@/lib/validators/common";
import { ConflictError, NotFoundError } from "@/server/errors";
import { assertCan, type TenantContext } from "@/server/tenant";

export async function listCategories(ctx: TenantContext) {
  return prisma.category.findMany({
    where: { businessId: ctx.businessId },
    orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
    select: { id: true, name: true, slug: true, description: true, sortOrder: true, _count: { select: { products: true } } },
  });
}

async function findOwned(ctx: TenantContext, categoryId: string) {
  const category = await prisma.category.findFirst({ where: { id: categoryId, businessId: ctx.businessId } });
  if (!category) throw new NotFoundError("Category");
  return category;
}

async function slugTaken(businessId: string, slug: string, exceptId?: string) {
  const found = await prisma.category.findFirst({ where: { businessId, slug, NOT: exceptId ? { id: exceptId } : undefined }, select: { id: true } });
  return Boolean(found);
}

export async function createCategory(ctx: TenantContext, input: unknown) {
  assertCan(ctx, "content:manage");
  const data = categorySchema.parse(input);
  let slug: string;
  if (data.slug) {
    if (await slugTaken(ctx.businessId, data.slug)) throw new ConflictError("Slug already used", { slug: ["Another category uses this slug"] });
    slug = data.slug;
  } else {
    slug = await uniqueSlug(slugify(data.name), (s) => slugTaken(ctx.businessId, s));
  }
  const last = await prisma.category.aggregate({ where: { businessId: ctx.businessId }, _max: { sortOrder: true } });
  return prisma.category.create({
    data: { businessId: ctx.businessId, name: data.name, slug, description: data.description, sortOrder: (last._max.sortOrder ?? -1) + 1 },
  });
}

export async function updateCategory(ctx: TenantContext, categoryId: string, input: unknown) {
  assertCan(ctx, "content:manage");
  const existing = await findOwned(ctx, categoryId);
  const data = categorySchema.parse(input);
  const slug = data.slug ?? existing.slug;
  if (slug !== existing.slug && (await slugTaken(ctx.businessId, slug, existing.id))) {
    throw new ConflictError("Slug already used", { slug: ["Another category uses this slug"] });
  }
  return prisma.category.update({ where: { id: existing.id }, data: { name: data.name, slug, description: data.description } });
}

/** Products in the category are kept and become uncategorised. */
export async function deleteCategory(ctx: TenantContext, categoryId: string) {
  assertCan(ctx, "content:manage");
  const existing = await findOwned(ctx, categoryId);
  await prisma.category.delete({ where: { id: existing.id } });
}

export async function moveCategory(ctx: TenantContext, categoryId: string, direction: MoveDirection) {
  assertCan(ctx, "content:manage");
  await findOwned(ctx, categoryId);
  const all = await prisma.category.findMany({
    where: { businessId: ctx.businessId },
    orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
    select: { id: true },
  });
  const order = moveInOrder(all.map((c) => c.id), categoryId, direction);
  if (!order) return;
  await prisma.$transaction(
    order.map((id, index) => prisma.category.update({ where: { id, businessId: ctx.businessId }, data: { sortOrder: index } })),
  );
}
