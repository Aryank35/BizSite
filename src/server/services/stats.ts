import "server-only";
import { prisma } from "@/lib/db";
import type { TenantContext } from "@/server/tenant";

/** Platform statistics, computed from the database. No traffic analytics are tracked. */
export async function getPlatformStats() {
  const since = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
  const [businesses, activeBusinesses, publishedWebsites, products, publishedProducts, enquiries, enquiries30d, newEnquiries, pendingRequests] =
    await prisma.$transaction([
      prisma.business.count(),
      prisma.business.count({ where: { status: "ACTIVE" } }),
      prisma.business.count({ where: { status: "ACTIVE", publishedAt: { not: null } } }),
      prisma.product.count(),
      prisma.product.count({ where: { status: "PUBLISHED" } }),
      prisma.enquiry.count(),
      prisma.enquiry.count({ where: { createdAt: { gte: since } } }),
      prisma.enquiry.count({ where: { status: "NEW" } }),
      prisma.websiteRequest.count({ where: { handled: false } }),
    ]);
  return { businesses, activeBusinesses, publishedWebsites, products, publishedProducts, enquiries, enquiries30d, newEnquiries, pendingRequests };
}

/** Enquiries per business, busiest first. */
export async function getEnquiryCountsByBusiness(take = 10) {
  const groups = await prisma.enquiry.groupBy({
    by: ["businessId"],
    _count: { _all: true },
    orderBy: { _count: { businessId: "desc" } },
    take,
  });
  const businesses = await prisma.business.findMany({
    where: { id: { in: groups.map((g) => g.businessId) } },
    select: { id: true, name: true },
  });
  const names = new Map(businesses.map((b) => [b.id, b.name]));
  const newCounts = await prisma.enquiry.groupBy({
    by: ["businessId"],
    where: { status: "NEW", businessId: { in: groups.map((g) => g.businessId) } },
    _count: { _all: true },
  });
  const newMap = new Map(newCounts.map((g) => [g.businessId, g._count._all]));
  return groups.map((g) => ({
    businessId: g.businessId,
    name: names.get(g.businessId) ?? "Unknown",
    total: g._count._all,
    new: newMap.get(g.businessId) ?? 0,
  }));
}

export async function getBusinessStats(ctx: TenantContext) {
  const id = ctx.businessId;
  const [products, publishedProducts, enquiries, newEnquiries, categories, business, recentEnquiries] = await prisma.$transaction([
    prisma.product.count({ where: { businessId: id } }),
    prisma.product.count({ where: { businessId: id, status: "PUBLISHED" } }),
    prisma.enquiry.count({ where: { businessId: id } }),
    prisma.enquiry.count({ where: { businessId: id, status: "NEW" } }),
    prisma.category.count({ where: { businessId: id } }),
    prisma.business.findUnique({ where: { id }, select: { publishedAt: true, slug: true } }),
    prisma.enquiry.findMany({
      where: { businessId: id },
      orderBy: { createdAt: "desc" },
      take: 5,
      select: { id: true, customerName: true, message: true, status: true, createdAt: true, product: { select: { name: true } } },
    }),
  ]);
  return {
    products,
    publishedProducts,
    enquiries,
    newEnquiries,
    categories,
    isLive: Boolean(business?.publishedAt),
    publishedAt: business?.publishedAt ?? null,
    slug: business?.slug ?? "",
    recentEnquiries,
  };
}

export async function getRecentAuditLog(take = 12) {
  return prisma.auditLog.findMany({
    orderBy: { createdAt: "desc" },
    take,
    select: { id: true, action: true, entityType: true, businessId: true, createdAt: true, metadata: true, actor: { select: { name: true } } },
  });
}
