import { notFound } from "next/navigation";
import { cache } from "react";
import { SiteProductPage } from "@/components/site/site-pages";
import { publicSiteUrl } from "@/lib/site-url";
import { getPublicProduct } from "@/server/services/public-site";
import { liveSiteContext, liveSiteMetadata } from "../../site-data";

const loadProduct = cache(async (slug: string, productSlug: string) => {
  const ctx = await liveSiteContext(slug);
  if (!ctx) return null;
  const product = await getPublicProduct(ctx.business.id, productSlug);
  return product ? { ctx, product } : null;
});

// No loading skeleton: the page renders in one pass on the server (see layout).
export const instant = false;

export async function generateMetadata(props: PageProps<"/site/[slug]/products/[productSlug]">) {
  const { slug, productSlug } = await props.params;
  const loaded = await loadProduct(slug, productSlug);
  if (!loaded) return { title: "Page not found", robots: { index: false, follow: false } };
  const { product } = loaded;
  return liveSiteMetadata(slug, {
    title: product.seoTitle ?? product.name,
    description: product.seoDescription ?? product.shortDescription,
    path: `/products/${product.slug}`,
    image: product.featuredImageUrl,
  });
}

export default async function BusinessProductPage(props: PageProps<"/site/[slug]/products/[productSlug]">) {
  const { slug, productSlug } = await props.params;
  // Unpublished products, unknown slugs and offline websites all resolve to "not found".
  const loaded = await loadProduct(slug, productSlug);
  if (!loaded) notFound();
  return <SiteProductPage ctx={loaded.ctx} product={loaded.product} productUrl={publicSiteUrl(slug, `/products/${loaded.product.slug}`)} />;
}
