import { z } from "zod";
import { BUSINESS_CATEGORY_VALUES } from "@/lib/constants";
import {
  optionalEmail,
  optionalHttpsUrl,
  optionalImageUrl,
  optionalPhone,
  optionalText,
  optionalWhatsapp,
  requiredText,
  slugSchema,
} from "@/lib/validators/common";

const time = z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/, "Use HH:MM");

export const openingHoursSchema = z
  .array(
    z.object({
      closed: z.boolean(),
      open: time,
      close: time,
    }),
  )
  .length(7);

export type OpeningHours = z.infer<typeof openingHoursSchema>;

export const DEFAULT_OPENING_HOURS: OpeningHours = [
  ...Array.from({ length: 6 }, () => ({ closed: false, open: "10:00", close: "19:00" })),
  { closed: true, open: "10:00", close: "19:00" },
];

export const SOCIAL_NETWORKS = ["website", "facebook", "instagram", "linkedin", "youtube", "x"] as const;
export type SocialNetwork = (typeof SOCIAL_NETWORKS)[number];

export const socialLinksSchema = z.object({
  website: optionalHttpsUrl,
  facebook: optionalHttpsUrl,
  instagram: optionalHttpsUrl,
  linkedin: optionalHttpsUrl,
  youtube: optionalHttpsUrl,
  x: optionalHttpsUrl,
});

export type SocialLinks = z.output<typeof socialLinksSchema>;

export const businessCategorySchema = z.enum(BUSINESS_CATEGORY_VALUES, { message: "Choose a category" });

/** Fields a business administrator may edit on their own profile. */
export const businessProfileSchema = z.object({
  name: requiredText(120, "Business name"),
  description: optionalText(2000),
  logoUrl: optionalImageUrl,
  email: optionalEmail,
  phone: optionalPhone,
  whatsappNumber: optionalWhatsapp,
  addressLine: optionalText(200),
  city: optionalText(80),
  state: optionalText(80),
  postalCode: optionalText(12),
  openingHours: openingHoursSchema,
  socialLinks: socialLinksSchema,
});

export type BusinessProfileInput = z.input<typeof businessProfileSchema>;
export type BusinessProfileValues = z.output<typeof businessProfileSchema>;

/** Super admin: create a business. */
export const businessCreateSchema = z.object({
  name: requiredText(120, "Business name"),
  slug: slugSchema,
  category: businessCategorySchema,
  description: optionalText(2000),
  email: optionalEmail,
  phone: optionalPhone,
  whatsappNumber: optionalWhatsapp,
  city: optionalText(80),
  state: optionalText(80),
});

export type BusinessCreateInput = z.input<typeof businessCreateSchema>;

/** Super admin: platform-controlled settings of a business. */
export const businessPlatformSettingsSchema = z.object({
  slug: slugSchema,
  category: businessCategorySchema,
  allowSelfPublish: z.boolean(),
  enquiriesEnabled: z.boolean(),
  whatsappEnabled: z.boolean(),
});

export type BusinessPlatformSettingsInput = z.input<typeof businessPlatformSettingsSchema>;

export const businessStatusSchema = z.enum(["ACTIVE", "SUSPENDED"]);

export const inviteAdminSchema = z.object({
  email: z.string().trim().toLowerCase().pipe(z.email("Enter a valid email address")),
  name: optionalText(100),
  role: z.enum(["OWNER", "EDITOR"]),
});

export type InviteAdminInput = z.input<typeof inviteAdminSchema>;

export const businessListFilterSchema = z.object({
  q: z.string().trim().max(100).optional().catch(undefined),
  category: businessCategorySchema.optional().catch(undefined),
  status: businessStatusSchema.optional().catch(undefined),
  page: z.coerce.number().int().min(1).max(10_000).catch(1),
});
