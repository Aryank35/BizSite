import "server-only";
import { prisma } from "@/lib/db";
import {
  DEFAULT_OPENING_HOURS,
  businessProfileSchema,
  openingHoursSchema,
  socialLinksSchema,
} from "@/lib/validators/business";
import { recordAudit } from "@/server/audit";
import { NotFoundError } from "@/server/errors";
import { assertImagesOwned } from "@/server/services/media";
import { assertCan, type TenantContext } from "@/server/tenant";

export async function getBusinessProfile(ctx: TenantContext) {
  const business = await prisma.business.findUnique({
    where: { id: ctx.businessId },
    select: {
      name: true,
      slug: true,
      category: true,
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
    },
  });
  if (!business) throw new NotFoundError("Business");
  const hours = openingHoursSchema.safeParse(business.openingHours);
  const social = socialLinksSchema.safeParse(business.socialLinks ?? {});
  return {
    ...business,
    openingHours: hours.success ? hours.data : DEFAULT_OPENING_HOURS,
    socialLinks: social.success ? social.data : socialLinksSchema.parse({}),
  };
}

export async function updateBusinessProfile(ctx: TenantContext, input: unknown) {
  assertCan(ctx, "business:settings");
  const data = businessProfileSchema.parse(input);
  await assertImagesOwned(ctx.businessId, [data.logoUrl]);
  await prisma.business.update({ where: { id: ctx.businessId }, data });
  if (ctx.isSuperAdmin) {
    await recordAudit({ actorId: ctx.userId, action: "business.profile_updated", entityType: "Business", entityId: ctx.businessId, businessId: ctx.businessId });
  }
}
