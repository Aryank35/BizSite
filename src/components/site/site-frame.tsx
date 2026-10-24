import { Clock, Eye, Mail, MapPin, Menu, MessageCircle, Phone } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import type { CSSProperties, ReactNode } from "react";
import { WEEKDAYS } from "@/lib/constants";
import { cn } from "@/lib/utils";
import { formatWhatsappNumber } from "@/lib/whatsapp";
import { NAV_TARGETS, readableTextColor, type NavTarget } from "@/lib/website/theme";
import { siteFontStyles } from "@/components/site/fonts";
import { Container, SiteButton } from "@/components/site/primitives";
import { siteLinks, type SiteContext, type SiteLinks } from "@/components/site/site-context";
import { SOCIAL_ICON_COMPONENTS } from "@/components/site/social-icons";
import { TEMPLATE_STYLES } from "@/components/site/template-styles";
import type { OpeningHours, SocialLinks } from "@/lib/validators/business";

function navHref(links: SiteLinks, target: NavTarget): string {
  switch (target) {
    case "HOME":
      return links.home;
    case "PRODUCTS":
      return links.products;
    case "ABOUT":
      return links.about;
    case "GALLERY":
      return links.gallery;
    case "TESTIMONIALS":
      return links.testimonials;
    case "CONTACT":
      return links.contact;
  }
}

export function addressLines(business: SiteContext["business"]): string[] {
  return [business.addressLine, [business.city, business.state].filter(Boolean).join(", "), business.postalCode].filter(
    (line): line is string => Boolean(line),
  );
}

/** Groups consecutive days with identical hours: "Monday – Saturday: 10:00 – 19:00". */
export function summariseHours(hours: OpeningHours): { days: string; time: string }[] {
  const rows: { from: number; to: number; time: string }[] = [];
  hours.forEach((day, index) => {
    const time = day.closed ? "Closed" : `${day.open} – ${day.close}`;
    const last = rows.at(-1);
    if (last && last.time === time && last.to === index - 1) last.to = index;
    else rows.push({ from: index, to: index, time });
  });
  return rows.map((r) => ({
    days: r.from === r.to ? WEEKDAYS[r.from] : `${WEEKDAYS[r.from]} – ${WEEKDAYS[r.to]}`,
    time: r.time,
  }));
}

export function SocialIcons({ social, className }: { social: SocialLinks; className?: string }) {
  const entries = (Object.entries(social) as [keyof SocialLinks, string | null][]).filter(([, url]) => url);
  if (entries.length === 0) return null;
  return (
    <ul className={cn("flex gap-2", className)}>
      {entries.map(([network, url]) => {
        const Icon = SOCIAL_ICON_COMPONENTS[network];
        return (
          <li key={network}>
            <a
              href={url!}
              target="_blank"
              rel="noopener noreferrer"
              className="flex size-9 items-center justify-center rounded-full border border-current/20 transition hover:bg-current/10"
              aria-label={network === "x" ? "X (Twitter)" : network.charAt(0).toUpperCase() + network.slice(1)}
            >
              <Icon className="size-4" />
            </a>
          </li>
        );
      })}
    </ul>
  );
}

function Logo({ ctx }: { ctx: SiteContext }) {
  const { logoSettings } = ctx.snapshot.theme;
  const showLogo = logoSettings.showLogo && ctx.business.logoUrl;
  const height = { sm: 28, md: 36, lg: 48 }[logoSettings.size];
  return (
    <Link href={siteLinks(ctx).home} className="flex min-w-0 items-center gap-3">
      {showLogo ? (
        <Image
          src={ctx.business.logoUrl!}
          alt={logoSettings.showName ? "" : ctx.business.name}
          width={height * 3}
          height={height}
          style={{ height, width: "auto" }}
          className="max-w-[10rem] object-contain"
          priority
        />
      ) : null}
      {logoSettings.showName || !showLogo ? (
        <span className="truncate text-lg font-semibold" style={{ fontFamily: "var(--site-heading-font)" }}>
          {ctx.business.name}
        </span>
      ) : null}
    </Link>
  );
}

function Header({ ctx }: { ctx: SiteContext }) {
  const t = TEMPLATE_STYLES[ctx.template];
  const links = siteLinks(ctx);
  const nav = ctx.snapshot.theme.navigationSettings;
  const ctaHref = nav.ctaLabel ? links.cta(nav.ctaTarget) : null;
  const items = nav.items.map((item) => ({ label: item.label || NAV_TARGETS[item.target], href: navHref(links, item.target) }));

  return (
    <header className={cn("z-40", nav.sticky && "sticky top-0", t.header)}>
      <Container className="flex h-16 items-center justify-between gap-6">
        <Logo ctx={ctx} />
        <nav aria-label="Main" className="hidden items-center gap-6 text-sm font-medium md:flex">
          {items.map((item) => (
            <Link key={item.label + item.href} href={item.href} className={t.headerLink}>
              {item.label}
            </Link>
          ))}
          {ctaHref ? (
            <SiteButton ctx={ctx} href={ctaHref} variant={ctx.template === "PROFESSIONAL_BUSINESS" ? "accent" : "primary"} className="h-9">
              {nav.ctaLabel}
            </SiteButton>
          ) : null}
        </nav>
        {/* No-JavaScript mobile menu */}
        <details className="group relative md:hidden">
          <summary className="flex size-10 cursor-pointer list-none items-center justify-center rounded-md [&::-webkit-details-marker]:hidden" aria-label="Open menu">
            <Menu className="size-5" />
          </summary>
          <nav aria-label="Mobile" className="absolute right-0 mt-2 w-60 rounded-xl border bg-white p-2 text-neutral-900 shadow-lg">
            {items.map((item) => (
              <Link key={item.label + item.href} href={item.href} className="block rounded-lg px-3 py-2.5 text-sm font-medium hover:bg-neutral-100">
                {item.label}
              </Link>
            ))}
            {ctaHref ? (
              <SiteButton ctx={ctx} href={ctaHref} className="mt-1 w-full">
                {nav.ctaLabel}
              </SiteButton>
            ) : null}
          </nav>
        </details>
      </Container>
    </header>
  );
}

function AnnouncementBar({ ctx }: { ctx: SiteContext }) {
  const section = ctx.snapshot.sections.find((s) => s.type === "ANNOUNCEMENT_BAR");
  if (section?.type !== "ANNOUNCEMENT_BAR") return null;
  const { text, linkLabel, linkTarget } = section.content;
  const href = linkLabel && linkTarget !== "NONE" ? siteLinks(ctx).cta(linkTarget) : null;
  return (
    <div className="bg-[var(--site-accent)] px-4 py-2 text-center text-sm font-medium text-[var(--site-on-accent)]">
      {text}
      {href ? (
        <>
          {" "}
          <a href={href} className="underline underline-offset-4" {...(href.startsWith("https://") ? { target: "_blank", rel: "noopener noreferrer" } : {})}>
            {linkLabel}
          </a>
        </>
      ) : null}
    </div>
  );
}

function Footer({ ctx }: { ctx: SiteContext }) {
  const { business } = ctx;
  const settings = ctx.snapshot.theme.footerSettings;
  const links = siteLinks(ctx);
  const address = addressLines(business);
  const whatsapp = links.whatsapp();

  return (
    <footer className="bg-[var(--site-secondary)] text-[var(--site-on-secondary)]">
      <Container className="grid gap-10 py-14 md:grid-cols-3">
        <div className="space-y-4">
          <p className="text-lg font-semibold" style={{ fontFamily: "var(--site-heading-font)" }}>
            {business.name}
          </p>
          {settings.tagline ? <p className="text-sm opacity-75">{settings.tagline}</p> : null}
          {settings.showSocialLinks ? <SocialIcons social={business.socialLinks} /> : null}
        </div>
        <div className="space-y-3 text-sm">
          <p className="font-semibold">Contact</p>
          <ul className="space-y-2 opacity-85">
            {settings.showAddress && address.length ? (
              <li className="flex gap-2">
                <MapPin className="mt-0.5 size-4 shrink-0" aria-hidden />
                <span>{address.join(", ")}</span>
              </li>
            ) : null}
            {business.phone ? (
              <li className="flex gap-2">
                <Phone className="mt-0.5 size-4 shrink-0" aria-hidden />
                <a href={`tel:${business.phone.replace(/[^\d+]/g, "")}`} className="hover:underline">
                  {business.phone}
                </a>
              </li>
            ) : null}
            {business.email ? (
              <li className="flex gap-2">
                <Mail className="mt-0.5 size-4 shrink-0" aria-hidden />
                <a href={`mailto:${business.email}`} className="break-all hover:underline">
                  {business.email}
                </a>
              </li>
            ) : null}
            {whatsapp && business.whatsappNumber ? (
              <li className="flex gap-2">
                <MessageCircle className="mt-0.5 size-4 shrink-0" aria-hidden />
                <a href={whatsapp} target="_blank" rel="noopener noreferrer" className="hover:underline">
                  WhatsApp {formatWhatsappNumber(business.whatsappNumber)}
                </a>
              </li>
            ) : null}
          </ul>
        </div>
        {settings.showOpeningHours && business.openingHours ? (
          <div className="space-y-3 text-sm">
            <p className="flex items-center gap-2 font-semibold">
              <Clock className="size-4" aria-hidden /> Opening hours
            </p>
            <dl className="space-y-1.5 opacity-85">
              {summariseHours(business.openingHours).map((row) => (
                <div key={row.days} className="flex justify-between gap-4">
                  <dt>{row.days}</dt>
                  <dd className="tabular-nums">{row.time}</dd>
                </div>
              ))}
            </dl>
          </div>
        ) : null}
      </Container>
      <div className="border-t border-current/10">
        <Container className="flex flex-col gap-2 py-5 text-xs opacity-70 sm:flex-row sm:justify-between">
          <p>© {business.name}. All rights reserved.</p>
          <p>
            Website by{" "}
            <Link href="/" className="underline-offset-4 hover:underline">
              BizSite
            </Link>
          </p>
        </Container>
      </div>
    </footer>
  );
}

function PreviewBanner() {
  return (
    <div className="sticky top-0 z-50 flex flex-wrap items-center justify-center gap-x-4 gap-y-1 bg-amber-400 px-4 py-2 text-sm font-medium text-amber-950">
      <span className="flex items-center gap-2">
        <Eye className="size-4" aria-hidden /> Draft preview — this is not visible to the public. Forms are disabled.
      </span>
      <Link href="/dashboard/website" className="underline underline-offset-4">
        Back to the website editor
      </Link>
    </div>
  );
}

/** Wraps every page of a business website with its theme, header and footer. */
export function SiteFrame({ ctx, children }: { ctx: SiteContext; children: ReactNode }) {
  const { theme } = ctx.snapshot;
  const fonts = siteFontStyles(theme.fontFamily);
  const has = (type: string) => ctx.snapshot.sections.some((s) => s.type === type);

  // Colours are validated hex values, so they are safe to place in a style attribute.
  const style = {
    "--site-primary": theme.primaryColor,
    "--site-on-primary": readableTextColor(theme.primaryColor),
    "--site-secondary": theme.secondaryColor,
    "--site-on-secondary": readableTextColor(theme.secondaryColor),
    "--site-accent": theme.accentColor,
    "--site-on-accent": readableTextColor(theme.accentColor),
    "--site-accent-text": readableTextColor(theme.accentColor) === "#111111" ? `color-mix(in oklab, ${theme.accentColor} 70%, black)` : theme.accentColor,
    "--site-primary-soft": `color-mix(in oklab, ${theme.primaryColor} 8%, white)`,
    "--site-heading-font": fonts.headingFamily,
    fontFamily: fonts.bodyFamily,
  } as CSSProperties;

  return (
    <div className={cn(fonts.className, "flex min-h-svh flex-col bg-white text-neutral-800")} style={style}>
      {ctx.mode === "preview" ? <PreviewBanner /> : null}
      <AnnouncementBar ctx={ctx} />
      {has("HEADER") ? <Header ctx={ctx} /> : null}
      <main id="main" className="flex-1">
        {children}
      </main>
      {has("FOOTER") ? <Footer ctx={ctx} /> : null}
    </div>
  );
}
