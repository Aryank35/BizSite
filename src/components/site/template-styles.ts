import type { TemplateKey } from "@/lib/website/theme";

/**
 * Visual vocabulary of each template. Section components read these tokens,
 * so one set of components renders both templates.
 */
export const TEMPLATE_STYLES: Record<
  TemplateKey,
  {
    button: string;
    card: string;
    media: string;
    sectionTitle: string;
    eyebrow: string;
    altSection: string;
    darkSection: string;
    header: string;
    headerLink: string;
  }
> = {
  MODERN_CATALOGUE: {
    button: "rounded-full px-6",
    card: "rounded-2xl bg-white ring-1 ring-black/5 shadow-sm",
    media: "rounded-2xl",
    sectionTitle: "text-3xl font-semibold tracking-tight sm:text-4xl",
    eyebrow: "hidden",
    altSection: "bg-[var(--site-primary-soft)]",
    darkSection: "bg-[var(--site-secondary)] text-[var(--site-on-secondary)]",
    header: "bg-white/90 text-neutral-900 backdrop-blur border-b border-black/5",
    headerLink: "text-neutral-600 hover:text-neutral-950",
  },
  PROFESSIONAL_BUSINESS: {
    button: "rounded-md px-5",
    card: "rounded-md bg-white border border-neutral-200",
    media: "rounded-md",
    sectionTitle: "text-3xl font-bold tracking-tight sm:text-4xl",
    eyebrow: "text-xs font-semibold tracking-[0.18em] uppercase text-[var(--site-accent-text)]",
    altSection: "bg-neutral-50",
    darkSection: "bg-[var(--site-secondary)] text-[var(--site-on-secondary)]",
    header: "bg-[var(--site-secondary)] text-[var(--site-on-secondary)]",
    headerLink: "opacity-80 hover:opacity-100",
  },
};
