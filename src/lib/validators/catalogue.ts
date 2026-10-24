import { z } from "zod";
import { parsePriceToMinor } from "@/lib/money";
import {
  idSchema,
  imageUrlSchema,
  optionalImageUrl,
  optionalSlugSchema,
  optionalText,
  requiredText,
} from "@/lib/validators/common";

export const categorySchema = z.object({
  name: requiredText(80, "Category name"),
  slug: optionalSlugSchema,
  description: optionalText(500),
});

export type CategoryInput = z.input<typeof categorySchema>;

export const MAX_GALLERY_IMAGES = 8;

export const productSchema = z
  .object({
    name: requiredText(120, "Product name"),
    slug: optionalSlugSchema,
    categoryId: z
      .string()
      .transform((value) => (value === "" || value === "none" ? null : value))
      .pipe(idSchema.nullable()),
    shortDescription: optionalText(240),
    description: optionalText(5000),
    sku: optionalText(64),
    price: z
      .string()
      .trim()
      .refine((value) => value === "" || parsePriceToMinor(value) !== null, "Enter a price such as 1499 or 1499.50")
      .transform((value) => (value === "" ? null : parsePriceToMinor(value))),
    priceVisibility: z.enum(["SHOW", "CONTACT_FOR_PRICE"]),
    featuredImageUrl: optionalImageUrl,
    galleryImages: z
      .array(z.object({ url: imageUrlSchema, alt: optionalText(160) }))
      .max(MAX_GALLERY_IMAGES, `At most ${MAX_GALLERY_IMAGES} gallery images`),
    status: z.enum(["DRAFT", "PUBLISHED"]),
    isFeatured: z.boolean(),
    seoTitle: optionalText(70),
    seoDescription: optionalText(160),
  })
  .refine((value) => value.priceVisibility === "CONTACT_FOR_PRICE" || value.price !== null, {
    path: ["price"],
    message: "Enter a price, or choose “Contact for price”",
  });

export type ProductInput = z.input<typeof productSchema>;
export type ProductValues = z.output<typeof productSchema>;

export const productListFilterSchema = z.object({
  q: z.string().trim().max(100).optional().catch(undefined),
  category: z.string().max(64).optional().catch(undefined),
  status: z.enum(["DRAFT", "PUBLISHED"]).optional().catch(undefined),
  page: z.coerce.number().int().min(1).max(10_000).catch(1),
});
