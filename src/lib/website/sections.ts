import { z } from "zod";
import { imageUrlSchema, optionalText, requiredText } from "@/lib/validators/common";
import { CTA_TARGET_KEYS } from "@/lib/website/theme";

/** Section types in their default homepage order (mirrors the Prisma enum). */
export const SECTION_TYPES = [
  "ANNOUNCEMENT_BAR",
  "HEADER",
  "HERO",
  "ABOUT",
  "FEATURED_PRODUCTS",
  "CATEGORIES",
  "CATALOGUE",
  "WHY_CHOOSE_US",
  "GALLERY",
  "TESTIMONIALS",
  "CONTACT_INFO",
  "WHATSAPP_CTA",
  "ENQUIRY_FORM",
  "FOOTER",
] as const;

export type SectionType = (typeof SECTION_TYPES)[number];

export const FEATURE_ICONS = [
  "shield",
  "truck",
  "award",
  "sparkles",
  "wrench",
  "clock",
  "leaf",
  "thumbs-up",
  "ruler",
  "headset",
] as const;

export type FeatureIcon = (typeof FEATURE_ICONS)[number];

const ctaTarget = z.enum(CTA_TARGET_KEYS);

/** Per-type content schemas. They accept their own output, so stored JSON re-validates. */
export const sectionContentSchemas = {
  ANNOUNCEMENT_BAR: z.object({
    text: requiredText(160, "Announcement text"),
    linkLabel: optionalText(30),
    linkTarget: z.enum(["NONE", ...CTA_TARGET_KEYS]),
  }),
  HEADER: z.object({}),
  HERO: z.object({
    primaryCtaLabel: requiredText(30, "Button label"),
    primaryCtaTarget: ctaTarget,
    secondaryCtaLabel: optionalText(30),
    secondaryCtaTarget: ctaTarget,
  }),
  ABOUT: z.object({
    body: requiredText(2000, "About text"),
    highlights: z.array(requiredText(80, "Highlight")).max(4, "At most 4 highlights"),
  }),
  FEATURED_PRODUCTS: z.object({ limit: z.number().int().min(3).max(12) }),
  CATEGORIES: z.object({ showDescriptions: z.boolean() }),
  CATALOGUE: z.object({ limit: z.number().int().min(4).max(24) }),
  WHY_CHOOSE_US: z.object({
    items: z
      .array(
        z.object({
          icon: z.enum(FEATURE_ICONS),
          title: requiredText(60, "Title"),
          description: requiredText(240, "Description"),
        }),
      )
      .min(1, "Add at least one reason")
      .max(6, "At most 6 reasons"),
  }),
  GALLERY: z.object({
    images: z.array(z.object({ url: imageUrlSchema, alt: optionalText(160) })).max(12, "At most 12 images"),
  }),
  TESTIMONIALS: z.object({
    items: z
      .array(
        z.object({
          quote: requiredText(500, "Quote"),
          author: requiredText(80, "Name"),
          role: optionalText(80),
        }),
      )
      .max(6, "At most 6 testimonials"),
  }),
  CONTACT_INFO: z.object({
    showAddress: z.boolean(),
    showPhone: z.boolean(),
    showEmail: z.boolean(),
    showHours: z.boolean(),
  }),
  WHATSAPP_CTA: z.object({
    buttonLabel: requiredText(30, "Button label"),
    prefilledMessage: requiredText(300, "Message"),
  }),
  ENQUIRY_FORM: z.object({
    submitLabel: requiredText(30, "Button label"),
    successMessage: requiredText(200, "Success message"),
  }),
  FOOTER: z.object({}),
} satisfies Record<SectionType, z.ZodType>;

export type SectionContent<T extends SectionType> = z.output<(typeof sectionContentSchemas)[T]>;
export type SectionContentInput<T extends SectionType> = z.input<(typeof sectionContentSchemas)[T]>;

export type Placement = "top" | "body" | "bottom";

type SectionDefinition<T extends SectionType> = {
  label: string;
  description: string;
  placement: Placement;
  fields: { title: boolean; subtitle: boolean; image: boolean };
  defaults: (businessName: string) => {
    title: string | null;
    subtitle: string | null;
    content: SectionContent<T>;
    isVisible: boolean;
  };
};

export const SECTION_DEFINITIONS: { [T in SectionType]: SectionDefinition<T> } = {
  ANNOUNCEMENT_BAR: {
    label: "Announcement bar",
    description: "A slim strip above the header for offers or news.",
    placement: "top",
    fields: { title: false, subtitle: false, image: false },
    defaults: () => ({
      title: null,
      subtitle: null,
      content: { text: "Visit our showroom this week for new arrivals.", linkLabel: "Enquire", linkTarget: "CONTACT" },
      isVisible: false,
    }),
  },
  HEADER: {
    label: "Header & navigation",
    description: "Logo, menu links and call-to-action. Configure links under Appearance.",
    placement: "top",
    fields: { title: false, subtitle: false, image: false },
    defaults: () => ({ title: null, subtitle: null, content: {}, isVisible: true }),
  },
  HERO: {
    label: "Hero banner",
    description: "The first thing visitors see: headline, intro and buttons.",
    placement: "body",
    fields: { title: true, subtitle: true, image: true },
    defaults: (name) => ({
      title: `Welcome to ${name}`,
      subtitle: "Browse our range and get in touch for a quote.",
      content: {
        primaryCtaLabel: "View products",
        primaryCtaTarget: "PRODUCTS",
        secondaryCtaLabel: "Contact us",
        secondaryCtaTarget: "CONTACT",
      },
      isVisible: true,
    }),
  },
  ABOUT: {
    label: "About the business",
    description: "Your story, experience and what makes you different.",
    placement: "body",
    fields: { title: true, subtitle: false, image: true },
    defaults: (name) => ({
      title: `About ${name}`,
      subtitle: null,
      content: { body: `${name} serves customers with quality products and honest advice.`, highlights: [] },
      isVisible: true,
    }),
  },
  FEATURED_PRODUCTS: {
    label: "Featured products",
    description: "Products you have marked as featured.",
    placement: "body",
    fields: { title: true, subtitle: true, image: false },
    defaults: () => ({
      title: "Featured products",
      subtitle: "A selection of our most popular pieces.",
      content: { limit: 6 },
      isVisible: true,
    }),
  },
  CATEGORIES: {
    label: "Product categories",
    description: "Links to each of your product categories.",
    placement: "body",
    fields: { title: true, subtitle: true, image: false },
    defaults: () => ({
      title: "Shop by category",
      subtitle: null,
      content: { showDescriptions: true },
      isVisible: true,
    }),
  },
  CATALOGUE: {
    label: "Product catalogue",
    description: "Your latest published products, with a link to the full catalogue.",
    placement: "body",
    fields: { title: true, subtitle: true, image: false },
    defaults: () => ({ title: "Our products", subtitle: null, content: { limit: 8 }, isVisible: true }),
  },
  WHY_CHOOSE_US: {
    label: "Why choose us",
    description: "Up to six reasons customers pick you.",
    placement: "body",
    fields: { title: true, subtitle: true, image: false },
    defaults: () => ({
      title: "Why choose us",
      subtitle: null,
      content: {
        items: [
          { icon: "award", title: "Quality you can trust", description: "Carefully selected products backed by our experience." },
          { icon: "headset", title: "Personal service", description: "Talk to a real person who knows the products." },
          { icon: "truck", title: "Reliable delivery", description: "On-time delivery and installation support." },
        ],
      },
      isVisible: true,
    }),
  },
  GALLERY: {
    label: "Image gallery",
    description: "Photos of your shop, projects or work.",
    placement: "body",
    fields: { title: true, subtitle: true, image: false },
    defaults: () => ({ title: "Gallery", subtitle: null, content: { images: [] }, isVisible: false }),
  },
  TESTIMONIALS: {
    label: "Testimonials",
    description: "Quotes from happy customers.",
    placement: "body",
    fields: { title: true, subtitle: false, image: false },
    defaults: () => ({ title: "What our customers say", subtitle: null, content: { items: [] }, isVisible: false }),
  },
  CONTACT_INFO: {
    label: "Contact information",
    description: "Address, phone, email and opening hours from your profile.",
    placement: "body",
    fields: { title: true, subtitle: true, image: false },
    defaults: () => ({
      title: "Visit or contact us",
      subtitle: null,
      content: { showAddress: true, showPhone: true, showEmail: true, showHours: true },
      isVisible: true,
    }),
  },
  WHATSAPP_CTA: {
    label: "WhatsApp call-to-action",
    description: "A prominent button that opens a WhatsApp chat.",
    placement: "body",
    fields: { title: true, subtitle: true, image: false },
    defaults: (name) => ({
      title: "Prefer to chat?",
      subtitle: "Message us on WhatsApp and we will reply quickly.",
      content: { buttonLabel: "Chat on WhatsApp", prefilledMessage: `Hello ${name}, I would like to know more about your products.` },
      isVisible: true,
    }),
  },
  ENQUIRY_FORM: {
    label: "Enquiry form",
    description: "Lets visitors send you a message. Enquiries appear in your dashboard.",
    placement: "body",
    fields: { title: true, subtitle: true, image: false },
    defaults: () => ({
      title: "Send us an enquiry",
      subtitle: "Tell us what you are looking for and we will get back to you.",
      content: { submitLabel: "Send enquiry", successMessage: "Thank you! We have received your enquiry and will be in touch soon." },
      isVisible: true,
    }),
  },
  FOOTER: {
    label: "Footer",
    description: "Contact details, social links and opening hours. Configure under Appearance.",
    placement: "bottom",
    fields: { title: false, subtitle: false, image: false },
    defaults: () => ({ title: null, subtitle: null, content: {}, isVisible: true }),
  },
};

export function sectionLabel(type: SectionType): string {
  return SECTION_DEFINITIONS[type].label;
}

/** Common editable fields of every section; `content` is checked per type. */
export const sectionBaseSchema = z.object({
  title: optionalText(120),
  subtitle: optionalText(300),
  imageUrl: z
    .string()
    .nullish()
    .transform((value) => (value ? value.trim() : null))
    .pipe(imageUrlSchema.nullable()),
  imageAlt: optionalText(160),
});

export function sectionEditSchema<T extends SectionType>(type: T) {
  return sectionBaseSchema.extend({ content: sectionContentSchemas[type] });
}

/** Rendering order: top sections, body sections by sortOrder, then bottom sections. */
export function orderSections<S extends { type: SectionType; sortOrder: number }>(sections: S[]): S[] {
  const rank: Record<Placement, number> = { top: 0, body: 1, bottom: 2 };
  return [...sections].sort((a, b) => {
    const byPlacement = rank[SECTION_DEFINITIONS[a.type].placement] - rank[SECTION_DEFINITIONS[b.type].placement];
    if (byPlacement !== 0) return byPlacement;
    if (a.sortOrder !== b.sortOrder) return a.sortOrder - b.sortOrder;
    return SECTION_TYPES.indexOf(a.type) - SECTION_TYPES.indexOf(b.type);
  });
}
