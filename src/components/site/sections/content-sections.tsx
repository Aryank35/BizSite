import {
  Award,
  CheckCircle2,
  Clock,
  Headset,
  Leaf,
  Quote,
  Ruler,
  ShieldCheck,
  Sparkles,
  ThumbsUp,
  Truck,
  Wrench,
  type LucideIcon,
} from "lucide-react";
import Image from "next/image";
import { cn } from "@/lib/utils";
import type { FeatureIcon, SectionContent } from "@/lib/website/sections";
import type { RenderSection } from "@/lib/website/snapshot";
import { Container, SectionIntro, SiteButton, SiteHeading } from "@/components/site/primitives";
import { siteLinks, type SiteContext } from "@/components/site/site-context";
import { TEMPLATE_STYLES } from "@/components/site/template-styles";

type Section<T extends RenderSection["type"]> = Extract<RenderSection, { type: T }>;

const FEATURE_ICON_MAP: Record<FeatureIcon, LucideIcon> = {
  shield: ShieldCheck,
  truck: Truck,
  award: Award,
  sparkles: Sparkles,
  wrench: Wrench,
  clock: Clock,
  leaf: Leaf,
  "thumbs-up": ThumbsUp,
  ruler: Ruler,
  headset: Headset,
};

function HeroButtons({ ctx, content }: { ctx: SiteContext; content: SectionContent<"HERO"> }) {
  const links = siteLinks(ctx);
  const primary = links.cta(content.primaryCtaTarget);
  const secondary = content.secondaryCtaLabel ? links.cta(content.secondaryCtaTarget) : null;
  const dark = ctx.template === "PROFESSIONAL_BUSINESS";
  return (
    <div className="flex flex-wrap gap-3">
      {primary ? (
        <SiteButton ctx={ctx} href={primary} variant={dark ? "accent" : "primary"}>
          {content.primaryCtaLabel}
        </SiteButton>
      ) : null}
      {secondary ? (
        <SiteButton
          ctx={ctx}
          href={secondary}
          variant={content.secondaryCtaTarget === "WHATSAPP" ? "whatsapp" : dark ? "light" : "outline"}
        >
          {content.secondaryCtaLabel}
        </SiteButton>
      ) : null}
    </div>
  );
}

export function HeroSection({ ctx, section }: { ctx: SiteContext; section: Section<"HERO"> }) {
  const { business } = ctx;
  const location = [business.city, business.state].filter(Boolean).join(", ");

  if (ctx.template === "PROFESSIONAL_BUSINESS") {
    return (
      <section className="relative isolate overflow-hidden bg-[var(--site-secondary)] text-white">
        {section.imageUrl ? (
          <>
            <Image src={section.imageUrl} alt={section.imageAlt ?? ""} fill priority sizes="100vw" className="-z-20 object-cover" />
            <div className="absolute inset-0 -z-10 bg-gradient-to-r from-[var(--site-secondary)] via-[var(--site-secondary)]/85 to-[var(--site-secondary)]/40" />
          </>
        ) : (
          <div className="absolute inset-0 -z-10 bg-[radial-gradient(circle_at_80%_20%,var(--site-primary),transparent_60%)] opacity-70" />
        )}
        <Container className="py-24 sm:py-32">
          <div className="max-w-2xl space-y-6">
            {location ? <p className="text-xs font-semibold tracking-[0.2em] text-white/70 uppercase">{location}</p> : null}
            <SiteHeading as="h1" className="text-4xl leading-tight font-bold sm:text-5xl">
              {section.title ?? business.name}
            </SiteHeading>
            {section.subtitle ? <p className="text-lg text-white/80">{section.subtitle}</p> : null}
            <HeroButtons ctx={ctx} content={section.content} />
          </div>
        </Container>
        <div className="h-1.5 bg-[var(--site-accent)]" />
      </section>
    );
  }

  return (
    <section className="bg-[var(--site-primary-soft)]">
      <Container className="grid items-center gap-12 py-16 sm:py-24 lg:grid-cols-2">
        <div className="space-y-6">
          <SiteHeading as="h1" className="text-4xl leading-[1.1] font-semibold tracking-tight text-neutral-950 sm:text-5xl">
            {section.title ?? business.name}
          </SiteHeading>
          {section.subtitle ? <p className="max-w-xl text-lg text-neutral-600">{section.subtitle}</p> : null}
          <HeroButtons ctx={ctx} content={section.content} />
        </div>
        <div className="relative aspect-[4/3] overflow-hidden rounded-3xl bg-[var(--site-primary)] shadow-xl">
          {section.imageUrl ? (
            <Image src={section.imageUrl} alt={section.imageAlt ?? ""} fill priority sizes="(min-width: 1024px) 560px, 100vw" className="object-cover" />
          ) : (
            <div className="absolute inset-0 flex items-end bg-[radial-gradient(circle_at_30%_20%,var(--site-accent),transparent_55%)] p-8" aria-hidden>
              <span className="text-7xl font-semibold text-[var(--site-on-primary)] opacity-90" style={{ fontFamily: "var(--site-heading-font)" }}>
                {business.name}
              </span>
            </div>
          )}
        </div>
      </Container>
    </section>
  );
}

export function AboutSection({ ctx, section }: { ctx: SiteContext; section: Section<"ABOUT"> }) {
  const t = TEMPLATE_STYLES[ctx.template];
  const professional = ctx.template === "PROFESSIONAL_BUSINESS";
  return (
    <section id="about" className="scroll-mt-20 py-16 sm:py-24">
      <Container className={cn("grid items-center gap-12", section.imageUrl && "lg:grid-cols-2")}>
        {section.imageUrl ? (
          <div className={cn("relative aspect-[4/3] overflow-hidden", t.media, professional && "lg:order-2")}>
            <Image src={section.imageUrl} alt={section.imageAlt ?? ""} fill sizes="(min-width: 1024px) 560px, 100vw" className="object-cover" />
          </div>
        ) : null}
        <div className={cn("space-y-6", !section.imageUrl && "max-w-3xl")}>
          {professional ? <p className={t.eyebrow}>About us</p> : null}
          {section.title ? <SiteHeading className={t.sectionTitle}>{section.title}</SiteHeading> : null}
          <p className="text-lg leading-relaxed whitespace-pre-line text-neutral-600">{section.content.body}</p>
          {section.content.highlights.length ? (
            <ul className="grid gap-3 sm:grid-cols-2">
              {section.content.highlights.map((h) => (
                <li key={h} className={cn("flex items-center gap-3 p-3 text-sm font-medium", professional ? "border-l-4 border-[var(--site-accent)] bg-neutral-50" : "rounded-xl bg-[var(--site-primary-soft)]")}>
                  <CheckCircle2 className="size-5 shrink-0 text-[var(--site-primary)]" aria-hidden />
                  {h}
                </li>
              ))}
            </ul>
          ) : null}
        </div>
      </Container>
    </section>
  );
}

export function WhyChooseUsSection({ ctx, section }: { ctx: SiteContext; section: Section<"WHY_CHOOSE_US"> }) {
  const t = TEMPLATE_STYLES[ctx.template];
  return (
    <section className={cn("py-16 sm:py-24", t.altSection)}>
      <Container>
        <SectionIntro ctx={ctx} eyebrow="Our promise" title={section.title} subtitle={section.subtitle} align={ctx.template === "MODERN_CATALOGUE" ? "center" : "left"} />
        <ul className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {section.content.items.map((item) => {
            const Icon = FEATURE_ICON_MAP[item.icon];
            return (
              <li key={item.title} className={cn("space-y-3 p-6", t.card)}>
                <span className={cn("flex size-11 items-center justify-center bg-[var(--site-primary)] text-[var(--site-on-primary)]", ctx.template === "MODERN_CATALOGUE" ? "rounded-full" : "rounded-md")}>
                  <Icon className="size-5" aria-hidden />
                </span>
                <h3 className="text-lg font-semibold text-neutral-900" style={{ fontFamily: "var(--site-heading-font)" }}>
                  {item.title}
                </h3>
                <p className="text-sm leading-relaxed text-neutral-600">{item.description}</p>
              </li>
            );
          })}
        </ul>
      </Container>
    </section>
  );
}

export function GallerySection({ ctx, section }: { ctx: SiteContext; section: Section<"GALLERY"> }) {
  const t = TEMPLATE_STYLES[ctx.template];
  if (section.content.images.length === 0) return null;
  return (
    <section id="gallery" className="scroll-mt-20 py-16 sm:py-24">
      <Container>
        <SectionIntro ctx={ctx} eyebrow="Gallery" title={section.title} subtitle={section.subtitle} />
        <ul className="grid grid-cols-2 gap-4 md:grid-cols-3">
          {section.content.images.map((image, index) => (
            <li key={image.url} className={cn("relative overflow-hidden", t.media, index % 5 === 0 ? "row-span-2 aspect-[3/4]" : "aspect-square")}>
              <Image src={image.url} alt={image.alt ?? ""} fill sizes="(min-width: 768px) 33vw, 50vw" className="object-cover transition duration-500 hover:scale-105" />
            </li>
          ))}
        </ul>
      </Container>
    </section>
  );
}

export function TestimonialsSection({ ctx, section }: { ctx: SiteContext; section: Section<"TESTIMONIALS"> }) {
  const t = TEMPLATE_STYLES[ctx.template];
  if (section.content.items.length === 0) return null;
  const dark = ctx.template === "PROFESSIONAL_BUSINESS";
  return (
    <section id="testimonials" className={cn("scroll-mt-20 py-16 sm:py-24", dark ? t.darkSection : t.altSection)}>
      <Container>
        {section.title ? (
          <div className="mb-10 max-w-2xl space-y-3">
            {dark ? <p className="text-xs font-semibold tracking-[0.18em] uppercase opacity-70">Testimonials</p> : null}
            <SiteHeading className={t.sectionTitle}>{section.title}</SiteHeading>
          </div>
        ) : null}
        <ul className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {section.content.items.map((item) => (
            <li key={item.author + item.quote.slice(0, 20)}>
              <figure className={cn("flex h-full flex-col gap-4 p-6", dark ? "rounded-md bg-white/5 ring-1 ring-white/10" : t.card)}>
                <Quote className="size-6 text-[var(--site-accent)]" aria-hidden />
                <blockquote className={cn("flex-1 leading-relaxed", dark ? "text-white/90" : "text-neutral-700")}>{item.quote}</blockquote>
                <figcaption className="text-sm">
                  <span className="font-semibold">{item.author}</span>
                  {item.role ? <span className={dark ? "text-white/60" : "text-neutral-500"}> · {item.role}</span> : null}
                </figcaption>
              </figure>
            </li>
          ))}
        </ul>
      </Container>
    </section>
  );
}
