import "server-only";
import type { Metadata } from "next";
import { headers } from "next/headers";
import { cache } from "react";
import type { SiteContext } from "@/components/site/site-context";
import { SUBDOMAIN_HEADER, publicSiteUrl } from "@/lib/site-url";
import { getLiveSite } from "@/server/services/public-site";

/** Live site for this request (deduplicated between generateMetadata and the page). */
const loadLiveSite = cache((slug: string) => getLiveSite(slug));

export async function liveSiteContext(slug: string): Promise<SiteContext | null> {
  const bundle = await loadLiveSite(slug);
  if (!bundle) return null;
  const onSubdomain = (await headers()).get(SUBDOMAIN_HEADER) === slug;
  return {
    ...bundle,
    template: bundle.snapshot.theme.template,
    basePath: onSubdomain ? "" : `/site/${slug}`,
    mode: "live",
  };
}

export async function liveSiteMetadata(
  slug: string,
  page: { title?: string; description?: string | null; path?: string; image?: string | null } = {},
): Promise<Metadata> {
  const bundle = await loadLiveSite(slug);
  if (!bundle) return { title: "Page not found", robots: { index: false, follow: false } };
  const { business, snapshot } = bundle;
  const seo = snapshot.theme.seoSettings;
  const siteTitle = seo.title ?? business.name;
  const title = page.title ? `${page.title} | ${business.name}` : siteTitle;
  const description = page.description ?? seo.description ?? business.description ?? undefined;
  const url = publicSiteUrl(slug, page.path ?? "");
  const image = page.image ?? seo.ogImageUrl ?? business.logoUrl;
  return {
    title: { absolute: title },
    description,
    alternates: { canonical: url },
    openGraph: {
      type: "website",
      siteName: business.name,
      title,
      description,
      url,
      images: image ? [{ url: image }] : undefined,
    },
    twitter: { card: image ? "summary_large_image" : "summary", title, description },
    robots: { index: true, follow: true },
  };
}
