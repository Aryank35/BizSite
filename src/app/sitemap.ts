import type { MetadataRoute } from "next";
import { connection } from "next/server";
import { publicSiteUrl } from "@/lib/site-url";
import { getSitemapEntries } from "@/server/services/public-site";

/** Marketing pages plus every live business website and its published products. */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  await connection(); // read the database at request time, not at build time
  const appUrl = (process.env.APP_URL ?? "http://localhost:3000").replace(/\/$/, "");
  const businesses = await getSitemapEntries();

  return [
    ...["", "/features", "/pricing", "/contact"].map((path) => ({ url: `${appUrl}${path}` })),
    ...businesses.flatMap((business) => [
      { url: publicSiteUrl(business.slug), lastModified: business.updatedAt },
      { url: publicSiteUrl(business.slug, "/products"), lastModified: business.updatedAt },
      ...business.products.map((product) => ({
        url: publicSiteUrl(business.slug, `/products/${product.slug}`),
        lastModified: product.updatedAt,
      })),
    ]),
  ];
}
