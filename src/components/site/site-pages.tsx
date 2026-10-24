import { ChevronLeft, ChevronRight, MessageCircle, Send } from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { SECTION_DEFINITIONS } from "@/lib/website/sections";
import type { RenderSection } from "@/lib/website/snapshot";
import { Container, Price, ProductGrid, ProductImage, SiteButton, SiteHeading } from "@/components/site/primitives";
import { AboutSection, GallerySection, HeroSection, TestimonialsSection, WhyChooseUsSection } from "@/components/site/sections/content-sections";
import { CatalogueSection, CategoriesSection, FeaturedProductsSection } from "@/components/site/sections/catalogue-sections";
import { ContactInfoSection, EnquirySection, WhatsappCtaSection } from "@/components/site/sections/contact-sections";
import { EnquiryForm } from "@/components/site/enquiry-form";
import { SiteFrame } from "@/components/site/site-frame";
import { siteLinks, type SiteContext } from "@/components/site/site-context";
import { TEMPLATE_STYLES } from "@/components/site/template-styles";
import type { HomeData, PublicProductDetail, getPublicCatalogue } from "@/server/services/public-site";

function BodySection({ ctx, section, data }: { ctx: SiteContext; section: RenderSection; data: HomeData }) {
  switch (section.type) {
    case "HERO":
      return <HeroSection ctx={ctx} section={section} />;
    case "ABOUT":
      return <AboutSection ctx={ctx} section={section} />;
    case "FEATURED_PRODUCTS":
      return <FeaturedProductsSection ctx={ctx} section={section} data={data} />;
    case "CATEGORIES":
      return <CategoriesSection ctx={ctx} section={section} data={data} />;
    case "CATALOGUE":
      return <CatalogueSection ctx={ctx} section={section} data={data} />;
    case "WHY_CHOOSE_US":
      return <WhyChooseUsSection ctx={ctx} section={section} />;
    case "GALLERY":
      return <GallerySection ctx={ctx} section={section} />;
    case "TESTIMONIALS":
      return <TestimonialsSection ctx={ctx} section={section} />;
    case "CONTACT_INFO":
      return <ContactInfoSection ctx={ctx} section={section} />;
    case "WHATSAPP_CTA":
      return <WhatsappCtaSection ctx={ctx} section={section} />;
    case "ENQUIRY_FORM":
      return <EnquirySection ctx={ctx} section={section} />;
    // Announcement bar, header and footer are rendered by SiteFrame.
    default:
      return null;
  }
}

export function SiteHomePage({ ctx, data }: { ctx: SiteContext; data: HomeData }) {
  const body = ctx.snapshot.sections.filter((s) => SECTION_DEFINITIONS[s.type].placement === "body");
  return (
    <SiteFrame ctx={ctx}>
      {body.length === 0 ? (
        <Container className="py-24 text-center">
          <SiteHeading as="h1" className="text-3xl font-semibold">
            {ctx.business.name}
          </SiteHeading>
          {ctx.business.description ? <p className="mx-auto mt-4 max-w-xl text-neutral-600">{ctx.business.description}</p> : null}
        </Container>
      ) : (
        body.map((section) => <BodySection key={section.type} ctx={ctx} section={section} data={data} />)
      )}
    </SiteFrame>
  );
}

type Catalogue = Awaited<ReturnType<typeof getPublicCatalogue>>;

export function SiteCataloguePage({ ctx, catalogue }: { ctx: SiteContext; catalogue: Catalogue }) {
  const links = siteLinks(ctx);
  const t = TEMPLATE_STYLES[ctx.template];
  const pageHref = (page: number) => {
    const params = new URLSearchParams();
    if (catalogue.activeCategory) params.set("category", catalogue.activeCategory.slug);
    if (page > 1) params.set("page", String(page));
    const query = params.toString();
    return query ? `${links.products}?${query}` : links.products;
  };
  const chip = (active: boolean) =>
    cn(
      "inline-flex h-9 items-center rounded-full border px-4 text-sm font-medium transition",
      active
        ? "border-[var(--site-primary)] bg-[var(--site-primary)] text-[var(--site-on-primary)]"
        : "border-neutral-200 bg-white text-neutral-700 hover:border-neutral-400",
    );

  return (
    <SiteFrame ctx={ctx}>
      <section className={cn("py-12 sm:py-16", t.altSection)}>
        <Container className="space-y-3">
          <nav aria-label="Breadcrumb" className="text-sm text-neutral-500">
            <Link href={links.home} className="hover:underline">
              Home
            </Link>{" "}
            / Products
          </nav>
          <SiteHeading as="h1" className={t.sectionTitle}>
            {catalogue.activeCategory ? catalogue.activeCategory.name : "Our products"}
          </SiteHeading>
          <p className="text-neutral-600">
            {catalogue.total} {catalogue.total === 1 ? "product" : "products"}
            {catalogue.activeCategory?.description ? ` · ${catalogue.activeCategory.description}` : ""}
          </p>
        </Container>
      </section>
      <Container className="space-y-8 py-12">
        {catalogue.categories.length > 0 ? (
          <nav aria-label="Categories" className="flex flex-wrap gap-2">
            <Link href={links.products} className={chip(!catalogue.activeCategory)} aria-current={!catalogue.activeCategory ? "page" : undefined}>
              All
            </Link>
            {catalogue.categories.map((c) => {
              const active = catalogue.activeCategory?.slug === c.slug;
              return (
                <Link key={c.slug} href={links.category(c.slug)} className={chip(active)} aria-current={active ? "page" : undefined}>
                  {c.name}
                </Link>
              );
            })}
          </nav>
        ) : null}

        {catalogue.products.length === 0 ? (
          <div className="rounded-2xl border border-dashed p-12 text-center text-neutral-600">
            <p className="font-medium text-neutral-900">No products to show yet.</p>
            <p className="mt-1 text-sm">Please check back soon, or get in touch to ask about our range.</p>
            <SiteButton ctx={ctx} href={links.contact} className="mt-6">
              Contact us
            </SiteButton>
          </div>
        ) : (
          <ProductGrid ctx={ctx} products={catalogue.products} />
        )}

        {catalogue.pageCount > 1 ? (
          <nav aria-label="Pagination" className="flex items-center justify-center gap-4 text-sm">
            {catalogue.page > 1 ? (
              <Link href={pageHref(catalogue.page - 1)} className="inline-flex items-center gap-1 font-medium hover:underline" rel="prev">
                <ChevronLeft className="size-4" /> Previous
              </Link>
            ) : null}
            <span className="text-neutral-500">
              Page {catalogue.page} of {catalogue.pageCount}
            </span>
            {catalogue.page < catalogue.pageCount ? (
              <Link href={pageHref(catalogue.page + 1)} className="inline-flex items-center gap-1 font-medium hover:underline" rel="next">
                Next <ChevronRight className="size-4" />
              </Link>
            ) : null}
          </nav>
        ) : null}
      </Container>
    </SiteFrame>
  );
}

export function SiteProductPage({ ctx, product, productUrl }: { ctx: SiteContext; product: PublicProductDetail; productUrl: string }) {
  const links = siteLinks(ctx);
  const t = TEMPLATE_STYLES[ctx.template];
  const images = [
    ...(product.featuredImageUrl ? [{ url: product.featuredImageUrl, alt: product.name }] : []),
    ...product.images.map((img) => ({ url: img.url, alt: img.alt ?? product.name })),
  ];
  const whatsapp = links.whatsapp(`Hello ${ctx.business.name}, I am interested in “${product.name}”. ${productUrl}`);
  const enquirySection = ctx.snapshot.sections.find((s) => s.type === "ENQUIRY_FORM");
  const enquiryContent =
    enquirySection?.type === "ENQUIRY_FORM"
      ? enquirySection.content
      : { submitLabel: "Send enquiry", successMessage: "Thank you! We have received your enquiry and will be in touch soon." };

  return (
    <SiteFrame ctx={ctx}>
      <Container className="py-10 sm:py-14">
        <nav aria-label="Breadcrumb" className="mb-8 flex flex-wrap gap-1 text-sm text-neutral-500">
          <Link href={links.home} className="hover:underline">
            Home
          </Link>
          <span>/</span>
          <Link href={links.products} className="hover:underline">
            Products
          </Link>
          {product.category ? (
            <>
              <span>/</span>
              <Link href={links.category(product.category.slug)} className="hover:underline">
                {product.category.name}
              </Link>
            </>
          ) : null}
        </nav>

        <div className="grid gap-10 lg:grid-cols-2">
          <div className="space-y-4">
            <ProductImage
              url={images[0]?.url ?? null}
              alt={images[0]?.alt ?? product.name}
              name={product.name}
              sizes="(min-width: 1024px) 560px, 100vw"
              className={cn("aspect-[4/3]", t.media)}
              priority
            />
            {images.length > 1 ? (
              <ul className="grid grid-cols-4 gap-3">
                {images.slice(1).map((img) => (
                  <li key={img.url}>
                    <a href={img.url} target="_blank" rel="noopener noreferrer" aria-label={`Open image: ${img.alt}`}>
                      <ProductImage url={img.url} alt={img.alt} name={product.name} sizes="140px" className={cn("aspect-square", t.media)} />
                    </a>
                  </li>
                ))}
              </ul>
            ) : null}
          </div>

          <div className="space-y-6">
            <div className="space-y-3">
              {product.category ? <p className="text-sm font-medium tracking-wide text-neutral-500 uppercase">{product.category.name}</p> : null}
              <SiteHeading as="h1" className="text-3xl font-semibold tracking-tight text-neutral-950 sm:text-4xl">
                {product.name}
              </SiteHeading>
              {product.shortDescription ? <p className="text-lg text-neutral-600">{product.shortDescription}</p> : null}
              <Price product={product} currency={ctx.business.currency} className="block text-2xl" />
              {product.sku ? <p className="text-sm text-neutral-500">Product code: {product.sku}</p> : null}
            </div>
            <div className="flex flex-wrap gap-3">
              {ctx.business.enquiriesEnabled ? (
                <SiteButton ctx={ctx} href="#product-enquiry">
                  <Send className="size-4" aria-hidden /> Enquire about this product
                </SiteButton>
              ) : null}
              {whatsapp ? (
                <SiteButton ctx={ctx} href={whatsapp} variant="whatsapp">
                  <MessageCircle className="size-4" aria-hidden /> Ask on WhatsApp
                </SiteButton>
              ) : null}
            </div>
            {product.description ? (
              <div className="space-y-2 border-t pt-6">
                <h2 className="font-semibold text-neutral-900">Description</h2>
                <p className="leading-relaxed whitespace-pre-line text-neutral-700">{product.description}</p>
              </div>
            ) : null}
          </div>
        </div>
      </Container>

      {ctx.business.enquiriesEnabled ? (
        <section id="product-enquiry" className={cn("scroll-mt-20 py-14", t.altSection)}>
          <Container className="grid gap-8 lg:grid-cols-[1fr_1.2fr]">
            <div className="space-y-3">
              <SiteHeading className="text-2xl font-semibold">Enquire about {product.name}</SiteHeading>
              <p className="text-neutral-600">Ask about sizes, finishes, availability or delivery. {ctx.business.name} will reply directly.</p>
            </div>
            <div className={cn("p-6 sm:p-8", t.card)}>
              <EnquiryForm
                businessSlug={ctx.business.slug}
                productSlug={product.slug}
                productName={product.name}
                submitLabel={enquiryContent.submitLabel}
                successMessage={enquiryContent.successMessage}
                buttonClassName={t.button}
                disabled={ctx.mode === "preview"}
              />
            </div>
          </Container>
        </section>
      ) : null}

      {product.related.length > 0 ? (
        <section className="py-14">
          <Container className="space-y-8">
            <SiteHeading className="text-2xl font-semibold">You may also like</SiteHeading>
            <ProductGrid ctx={ctx} products={product.related} columns={4} />
          </Container>
        </section>
      ) : null}
    </SiteFrame>
  );
}
