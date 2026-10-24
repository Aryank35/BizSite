import "server-only";
import type { Prisma } from "@/generated/prisma/client";
import { PAGE_SIZE } from "@/lib/constants";
import { prisma } from "@/lib/db";
import { enquiryListFilterSchema, enquiryStatusSchema, publicEnquirySchema } from "@/lib/validators/enquiry";
import { NotFoundError, ValidationError } from "@/server/errors";
import { assertCan, type TenantContext } from "@/server/tenant";
import { enforceThrottle } from "@/server/throttle";

/** Submission from a public business website. `clientKey` is a hashed IP. */
export async function submitPublicEnquiry(input: unknown, clientKey: string): Promise<{ stored: boolean }> {
  const data = publicEnquirySchema.parse(input);

  // Bots that fill the hidden field get a normal-looking success and nothing is stored.
  if (data.hpField.trim() !== "") return { stored: false };

  await enforceThrottle(`enquiry:ip:${clientKey}`, 5, 10 * 60);

  const business = await prisma.business.findFirst({
    where: { slug: data.businessSlug, status: "ACTIVE", publishedAt: { not: null }, enquiriesEnabled: true },
    select: { id: true },
  });
  if (!business) throw new ValidationError("This business is not accepting enquiries right now.");

  await enforceThrottle(`enquiry:business:${business.id}`, 200, 60 * 60);

  let productId: string | null = null;
  if (data.productSlug) {
    const product = await prisma.product.findFirst({
      where: { businessId: business.id, slug: data.productSlug, status: "PUBLISHED" },
      select: { id: true },
    });
    productId = product?.id ?? null;
  }

  await prisma.enquiry.create({
    data: {
      businessId: business.id,
      productId,
      customerName: data.customerName,
      email: data.email,
      phone: data.phone,
      message: data.message,
    },
  });
  return { stored: true };
}

const enquirySelect = {
  id: true,
  customerName: true,
  email: true,
  phone: true,
  message: true,
  status: true,
  createdAt: true,
  product: { select: { id: true, name: true, slug: true } },
} as const;

export async function listEnquiries(ctx: TenantContext, rawFilter: unknown) {
  const filter = enquiryListFilterSchema.parse(rawFilter);
  const where: Prisma.EnquiryWhereInput = { businessId: ctx.businessId, ...(filter.status ? { status: filter.status } : {}) };
  const [total, items, counts] = await prisma.$transaction([
    prisma.enquiry.count({ where }),
    prisma.enquiry.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (filter.page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
      select: enquirySelect,
    }),
    prisma.enquiry.groupBy({ by: ["status"], where: { businessId: ctx.businessId }, orderBy: { status: "asc" }, _count: { _all: true } }),
  ]);
  const byStatus = Object.fromEntries(counts.map((c) => [c.status, (c._count as { _all: number })._all]));
  return { items, total, page: filter.page, pageCount: Math.max(1, Math.ceil(total / PAGE_SIZE)), filter, byStatus };
}

export async function getEnquiry(ctx: TenantContext, enquiryId: string) {
  const enquiry = await prisma.enquiry.findFirst({ where: { id: enquiryId, businessId: ctx.businessId }, select: enquirySelect });
  if (!enquiry) throw new NotFoundError("Enquiry");
  return enquiry;
}

export async function updateEnquiryStatus(ctx: TenantContext, enquiryId: string, rawStatus: unknown) {
  assertCan(ctx, "content:manage");
  const status = enquiryStatusSchema.parse(rawStatus);
  const result = await prisma.enquiry.updateMany({ where: { id: enquiryId, businessId: ctx.businessId }, data: { status } });
  if (result.count === 0) throw new NotFoundError("Enquiry");
}

export async function deleteEnquiry(ctx: TenantContext, enquiryId: string) {
  assertCan(ctx, "content:manage");
  const result = await prisma.enquiry.deleteMany({ where: { id: enquiryId, businessId: ctx.businessId } });
  if (result.count === 0) throw new NotFoundError("Enquiry");
}

/** Super admin: recent enquiries across all businesses (for platform oversight). */
export async function listPlatformEnquiries(rawFilter: unknown) {
  const filter = enquiryListFilterSchema.parse(rawFilter);
  const where: Prisma.EnquiryWhereInput = filter.status ? { status: filter.status } : {};
  const [total, items] = await prisma.$transaction([
    prisma.enquiry.count({ where }),
    prisma.enquiry.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (filter.page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
      select: { ...enquirySelect, business: { select: { id: true, name: true } } },
    }),
  ]);
  return { items, total, page: filter.page, pageCount: Math.max(1, Math.ceil(total / PAGE_SIZE)), filter };
}
