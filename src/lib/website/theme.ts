import { z } from "zod";
import { hexColorSchema, optionalImageUrl, optionalText, requiredText } from "@/lib/validators/common";

export const TEMPLATES = {
  MODERN_CATALOGUE: {
    label: "Modern Catalogue",
    description: "Clean and spacious with large imagery. Puts products front and centre.",
  },
  PROFESSIONAL_BUSINESS: {
    label: "Professional Business",
    description: "Structured, corporate layout with strong bands of colour. Suits service-led businesses.",
  },
} as const;

export type TemplateKey = keyof typeof TEMPLATES;
export const TEMPLATE_KEYS = Object.keys(TEMPLATES) as [TemplateKey, ...TemplateKey[]];

export const SITE_FONTS = {
  inter: { label: "Inter", sample: "Modern and neutral" },
  poppins: { label: "Poppins", sample: "Friendly and geometric" },
  lora: { label: "Lora", sample: "Warm serif for craft brands" },
  playfair: { label: "Playfair Display", sample: "Elegant, high-contrast serif" },
} as const;

export type SiteFontKey = keyof typeof SITE_FONTS;
export const SITE_FONT_KEYS = Object.keys(SITE_FONTS) as [SiteFontKey, ...SiteFontKey[]];

export const NAV_TARGETS = {
  HOME: "Home",
  PRODUCTS: "Products",
  ABOUT: "About",
  GALLERY: "Gallery",
  TESTIMONIALS: "Testimonials",
  CONTACT: "Contact",
} as const;

export type NavTarget = keyof typeof NAV_TARGETS;
export const NAV_TARGET_KEYS = Object.keys(NAV_TARGETS) as [NavTarget, ...NavTarget[]];

export const CTA_TARGETS = {
  PRODUCTS: "Product catalogue",
  CONTACT: "Enquiry form",
  WHATSAPP: "WhatsApp chat",
  ABOUT: "About section",
} as const;

export type CtaTarget = keyof typeof CTA_TARGETS;
export const CTA_TARGET_KEYS = Object.keys(CTA_TARGETS) as [CtaTarget, ...CtaTarget[]];

export const logoSettingsSchema = z.object({
  showLogo: z.boolean(),
  showName: z.boolean(),
  size: z.enum(["sm", "md", "lg"]),
});

export const navigationSettingsSchema = z.object({
  items: z
    .array(z.object({ label: requiredText(30, "Link label"), target: z.enum(NAV_TARGET_KEYS) }))
    .max(6, "At most 6 menu links"),
  sticky: z.boolean(),
  ctaLabel: optionalText(30),
  ctaTarget: z.enum(CTA_TARGET_KEYS),
});

export const footerSettingsSchema = z.object({
  tagline: optionalText(200),
  showSocialLinks: z.boolean(),
  showOpeningHours: z.boolean(),
  showAddress: z.boolean(),
});

export const seoSettingsSchema = z.object({
  title: optionalText(70),
  description: optionalText(160),
  ogImageUrl: optionalImageUrl,
});

export const themeSchema = z.object({
  template: z.enum(TEMPLATE_KEYS),
  primaryColor: hexColorSchema,
  secondaryColor: hexColorSchema,
  accentColor: hexColorSchema,
  fontFamily: z.enum(SITE_FONT_KEYS),
  logoSettings: logoSettingsSchema,
  navigationSettings: navigationSettingsSchema,
  footerSettings: footerSettingsSchema,
  seoSettings: seoSettingsSchema,
});

export type ThemeInput = z.input<typeof themeSchema>;
export type Theme = z.output<typeof themeSchema>;

export function defaultTheme(template: TemplateKey = "MODERN_CATALOGUE"): Theme {
  return {
    template,
    primaryColor: "#1f4d3a",
    secondaryColor: "#13231b",
    accentColor: "#d97706",
    fontFamily: "inter",
    logoSettings: { showLogo: true, showName: true, size: "md" },
    navigationSettings: {
      items: [
        { label: "Home", target: "HOME" },
        { label: "Products", target: "PRODUCTS" },
        { label: "About", target: "ABOUT" },
        { label: "Contact", target: "CONTACT" },
      ],
      sticky: true,
      ctaLabel: "Enquire now",
      ctaTarget: "CONTACT",
    },
    footerSettings: { tagline: null, showSocialLinks: true, showOpeningHours: true, showAddress: true },
    seoSettings: { title: null, description: null, ogImageUrl: null },
  };
}

/** Picks black or white text for readable contrast on a background colour. */
export function readableTextColor(hex: string): "#ffffff" | "#111111" {
  const value = hex.replace("#", "");
  const [r, g, b] = [0, 2, 4].map((i) => {
    const channel = parseInt(value.slice(i, i + 2), 16) / 255;
    return channel <= 0.03928 ? channel / 12.92 : ((channel + 0.055) / 1.055) ** 2.4;
  });
  const luminance = 0.2126 * r + 0.7152 * g + 0.0722 * b;
  return luminance > 0.45 ? "#111111" : "#ffffff";
}
