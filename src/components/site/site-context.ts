import type { PublicBusiness } from "@/server/services/public-site";
import type { SiteSnapshot } from "@/lib/website/snapshot";
import type { CtaTarget, TemplateKey } from "@/lib/website/theme";
import { whatsappLink } from "@/lib/whatsapp";

/** Everything a site component needs: data plus link building for live or preview mode. */
export type SiteContext = {
  business: PublicBusiness;
  snapshot: SiteSnapshot;
  template: TemplateKey;
  /** "" on a tenant subdomain, "/site/<slug>" on the main domain, "/preview/<id>" for drafts. */
  basePath: string;
  mode: "live" | "preview";
};

export function siteLinks(ctx: SiteContext) {
  const home = ctx.basePath || "/";
  const has = (type: string) => ctx.snapshot.sections.some((s) => s.type === type);
  const whatsappSection = ctx.snapshot.sections.find((s) => s.type === "WHATSAPP_CTA");
  const defaultMessage =
    whatsappSection?.type === "WHATSAPP_CTA" ? whatsappSection.content.prefilledMessage : `Hello ${ctx.business.name}, I have a question.`;
  const anchor = (id: string) => `${home}#${id}`;

  return {
    home,
    products: `${ctx.basePath}/products`,
    product: (slug: string) => `${ctx.basePath}/products/${slug}`,
    category: (slug: string) => `${ctx.basePath}/products?category=${encodeURIComponent(slug)}`,
    about: anchor("about"),
    gallery: anchor("gallery"),
    testimonials: anchor("testimonials"),
    contact: has("ENQUIRY_FORM") && ctx.business.enquiriesEnabled ? anchor("enquire") : anchor("contact"),
    whatsapp: (message?: string) => whatsappLink(ctx.business.whatsappNumber, message ?? defaultMessage),
    cta(target: CtaTarget): string | null {
      switch (target) {
        case "PRODUCTS":
          return this.products;
        case "CONTACT":
          return this.contact;
        case "ABOUT":
          return this.about;
        case "WHATSAPP":
          return this.whatsapp();
      }
    },
  };
}

export type SiteLinks = ReturnType<typeof siteLinks>;
