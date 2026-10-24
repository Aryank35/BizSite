import { Package } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import type { ComponentProps, ReactNode } from "react";
import { cn } from "@/lib/utils";
import { formatMoney } from "@/lib/money";
import type { SiteContext } from "@/components/site/site-context";
import { TEMPLATE_STYLES } from "@/components/site/template-styles";
import type { PublicProductCard } from "@/server/services/public-site";

export function Container({ className, ...props }: ComponentProps<"div">) {
  return <div className={cn("mx-auto w-full max-w-6xl px-5 sm:px-8", className)} {...props} />;
}

export function SiteHeading({ as: Tag = "h2", className, ...props }: ComponentProps<"h2"> & { as?: "h1" | "h2" | "h3" }) {
  return <Tag className={cn("text-balance", className)} style={{ fontFamily: "var(--site-heading-font)" }} {...props} />;
}

export function SectionIntro({
  ctx,
  eyebrow,
  title,
  subtitle,
  align = "left",
  action,
}: {
  ctx: SiteContext;
  eyebrow?: string;
  title: string | null;
  subtitle?: string | null;
  align?: "left" | "center";
  action?: ReactNode;
}) {
  const t = TEMPLATE_STYLES[ctx.template];
  if (!title && !subtitle) return null;
  return (
    <div className={cn("mb-10 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between", align === "center" && "items-center text-center sm:flex-col sm:items-center")}>
      <div className={cn("max-w-2xl space-y-3", align === "center" && "mx-auto")}>
        {eyebrow ? <p className={t.eyebrow}>{eyebrow}</p> : null}
        {title ? <SiteHeading className={t.sectionTitle}>{title}</SiteHeading> : null}
        {subtitle ? <p className="text-lg text-neutral-600">{subtitle}</p> : null}
      </div>
      {action}
    </div>
  );
}

type ButtonVariant = "primary" | "outline" | "accent" | "light" | "whatsapp";

const VARIANTS: Record<ButtonVariant, string> = {
  primary: "bg-[var(--site-primary)] text-[var(--site-on-primary)] hover:brightness-110",
  accent: "bg-[var(--site-accent)] text-[var(--site-on-accent)] hover:brightness-105",
  outline: "border border-current/25 hover:bg-black/5",
  light: "bg-white text-neutral-900 hover:bg-white/90",
  whatsapp: "bg-[#25D366] text-[#0b2e13] hover:brightness-105",
};

/** Link styled as a button. External links (WhatsApp) open in a new tab. */
export function SiteButton({
  ctx,
  href,
  variant = "primary",
  className,
  children,
}: {
  ctx: SiteContext;
  href: string;
  variant?: ButtonVariant;
  className?: string;
  children: ReactNode;
}) {
  const t = TEMPLATE_STYLES[ctx.template];
  const classes = cn(
    "inline-flex h-11 items-center justify-center gap-2 text-sm font-semibold whitespace-nowrap transition focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--site-accent)]",
    t.button,
    VARIANTS[variant],
    className,
  );
  if (href.startsWith("https://")) {
    return (
      <a href={href} target="_blank" rel="noopener noreferrer" className={classes}>
        {children}
      </a>
    );
  }
  return (
    <Link href={href} className={classes}>
      {children}
    </Link>
  );
}

/** Product image, or a branded placeholder when none was uploaded. */
export function ProductImage({
  url,
  alt,
  name,
  sizes,
  className,
  priority,
}: {
  url: string | null;
  alt: string;
  name: string;
  sizes: string;
  className?: string;
  priority?: boolean;
}) {
  return (
    <div className={cn("relative overflow-hidden bg-[var(--site-primary-soft)]", className)}>
      {url ? (
        <Image src={url} alt={alt} fill sizes={sizes} className="object-cover" priority={priority} />
      ) : (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 text-[var(--site-primary)]" aria-hidden>
          <Package className="size-8 opacity-40" strokeWidth={1.5} />
          <span className="px-4 text-center text-xs font-medium opacity-50">{name}</span>
        </div>
      )}
    </div>
  );
}

export function Price({ product, currency, className }: { product: Pick<PublicProductCard, "priceMinor" | "priceVisibility">; currency: string; className?: string }) {
  if (product.priceVisibility === "CONTACT_FOR_PRICE" || product.priceMinor === null) {
    return <span className={cn("text-sm font-medium text-neutral-500", className)}>Contact for price</span>;
  }
  return <span className={cn("font-semibold text-neutral-900 tabular-nums", className)}>{formatMoney(product.priceMinor, currency)}</span>;
}

export function ProductCard({ ctx, product, href }: { ctx: SiteContext; product: PublicProductCard; href: string }) {
  const t = TEMPLATE_STYLES[ctx.template];
  return (
    <Link href={href} className={cn("group flex w-full flex-col overflow-hidden transition hover:-translate-y-0.5 hover:shadow-md", t.card)}>
      <ProductImage
        url={product.featuredImageUrl}
        alt={product.name}
        name={product.name}
        sizes="(min-width: 1024px) 280px, (min-width: 640px) 45vw, 90vw"
        className="aspect-[4/3]"
      />
      <div className="flex flex-1 flex-col gap-2 p-4">
        {product.category ? <p className="text-xs font-medium tracking-wide text-neutral-500 uppercase">{product.category.name}</p> : null}
        <h3 className="font-semibold text-neutral-900 group-hover:underline" style={{ fontFamily: "var(--site-heading-font)" }}>
          {product.name}
        </h3>
        {product.shortDescription ? <p className="line-clamp-2 text-sm text-neutral-600">{product.shortDescription}</p> : null}
        <div className="mt-auto pt-2">
          <Price product={product} currency={ctx.business.currency} />
        </div>
      </div>
    </Link>
  );
}

export function ProductGrid({ ctx, products, columns = 3 }: { ctx: SiteContext; products: PublicProductCard[]; columns?: 3 | 4 }) {
  const links = { product: (slug: string) => `${ctx.basePath}/products/${slug}` };
  return (
    <ul className={cn("grid gap-6 sm:grid-cols-2", columns === 4 ? "lg:grid-cols-4" : "lg:grid-cols-3")}>
      {products.map((p) => (
        <li key={p.slug} className="flex">
          <ProductCard ctx={ctx} product={p} href={links.product(p.slug)} />
        </li>
      ))}
    </ul>
  );
}
