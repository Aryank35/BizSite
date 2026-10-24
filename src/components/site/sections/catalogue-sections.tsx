import { ArrowRight } from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import type { RenderSection } from "@/lib/website/snapshot";
import { Container, ProductGrid, SectionIntro, SiteButton } from "@/components/site/primitives";
import { siteLinks, type SiteContext } from "@/components/site/site-context";
import { TEMPLATE_STYLES } from "@/components/site/template-styles";
import type { HomeData } from "@/server/services/public-site";

type Section<T extends RenderSection["type"]> = Extract<RenderSection, { type: T }>;

function ViewAll({ ctx }: { ctx: SiteContext }) {
  return (
    <SiteButton ctx={ctx} href={siteLinks(ctx).products} variant="outline" className="h-10 self-start sm:self-auto">
      View all products <ArrowRight className="size-4" />
    </SiteButton>
  );
}

export function FeaturedProductsSection({ ctx, section, data }: { ctx: SiteContext; section: Section<"FEATURED_PRODUCTS">; data: HomeData }) {
  if (data.featured.length === 0) return null;
  return (
    <section className="py-16 sm:py-24">
      <Container>
        <SectionIntro ctx={ctx} eyebrow="Featured" title={section.title} subtitle={section.subtitle} action={<ViewAll ctx={ctx} />} />
        <ProductGrid ctx={ctx} products={data.featured} />
      </Container>
    </section>
  );
}

export function CatalogueSection({ ctx, section, data }: { ctx: SiteContext; section: Section<"CATALOGUE">; data: HomeData }) {
  if (data.latest.length === 0) return null;
  return (
    <section id="products" className="scroll-mt-20 py-16 sm:py-24">
      <Container>
        <SectionIntro ctx={ctx} eyebrow="Products" title={section.title} subtitle={section.subtitle} action={<ViewAll ctx={ctx} />} />
        <ProductGrid ctx={ctx} products={data.latest} columns={4} />
      </Container>
    </section>
  );
}

export function CategoriesSection({ ctx, section, data }: { ctx: SiteContext; section: Section<"CATEGORIES">; data: HomeData }) {
  const t = TEMPLATE_STYLES[ctx.template];
  const links = siteLinks(ctx);
  if (data.categories.length === 0) return null;
  return (
    <section className={cn("py-16 sm:py-24", t.altSection)}>
      <Container>
        <SectionIntro ctx={ctx} eyebrow="Categories" title={section.title} subtitle={section.subtitle} />
        <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {data.categories.map((category) => (
            <li key={category.slug} className="flex">
              <Link href={links.category(category.slug)} className={cn("group flex w-full flex-col justify-between gap-6 p-6 transition hover:-translate-y-0.5 hover:shadow-md", t.card)}>
                <div className="space-y-2">
                  <h3 className="text-lg font-semibold text-neutral-900" style={{ fontFamily: "var(--site-heading-font)" }}>
                    {category.name}
                  </h3>
                  {section.content.showDescriptions && category.description ? (
                    <p className="text-sm text-neutral-600">{category.description}</p>
                  ) : null}
                </div>
                <span className="flex items-center justify-between text-sm font-medium text-[var(--site-primary)]">
                  {category.productCount} {category.productCount === 1 ? "product" : "products"}
                  <ArrowRight className="size-4 transition group-hover:translate-x-1" aria-hidden />
                </span>
              </Link>
            </li>
          ))}
        </ul>
      </Container>
    </section>
  );
}
