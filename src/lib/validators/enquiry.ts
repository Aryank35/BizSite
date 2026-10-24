import { z } from "zod";
import { BUSINESS_CATEGORY_VALUES } from "@/lib/constants";
import { cleanText, optionalEmail, optionalPhone, optionalText, requiredText, slugSchema } from "@/lib/validators/common";

const messageText = (min: number, max: number) =>
  z
    .string()
    .transform(cleanText)
    .pipe(z.string().min(min, `Please write at least ${min} characters`).max(max, `Must be at most ${max} characters`));

/** Public enquiry form on a business website. */
export const publicEnquirySchema = z
  .object({
    businessSlug: slugSchema,
    productSlug: z
      .string()
      .trim()
      .transform((value) => (value === "" ? null : value))
      .pipe(slugSchema.nullable()),
    customerName: requiredText(100, "Your name"),
    email: optionalEmail,
    phone: optionalPhone,
    message: messageText(10, 2000),
    /** Honeypot: hidden from people, often filled in by bots. */
    hpField: z.string().max(200),
  })
  .refine((value) => value.email !== null || value.phone !== null, {
    path: ["phone"],
    message: "Please give an email address or a phone number",
  });

export type PublicEnquiryInput = z.input<typeof publicEnquirySchema>;

export const enquiryStatusSchema = z.enum(["NEW", "IN_PROGRESS", "RESOLVED", "SPAM"]);

export const enquiryListFilterSchema = z.object({
  status: enquiryStatusSchema.optional().catch(undefined),
  page: z.coerce.number().int().min(1).max(10_000).catch(1),
});

/** Marketing site "request a website" form. */
export const websiteRequestSchema = z.object({
  name: requiredText(100, "Your name"),
  email: z.string().trim().toLowerCase().pipe(z.email("Enter a valid email address")),
  phone: optionalPhone,
  businessName: requiredText(120, "Business name"),
  category: z
    .string()
    .transform((value) => (value === "" ? null : value))
    .pipe(z.enum(BUSINESS_CATEGORY_VALUES).nullable()),
  message: optionalText(2000),
  hpField: z.string().max(200),
});

export type WebsiteRequestInput = z.input<typeof websiteRequestSchema>;
