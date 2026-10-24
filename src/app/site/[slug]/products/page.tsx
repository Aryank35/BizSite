import { notFound } from "next/navigation";
import { z } from "zod";
import { SiteCataloguePage } from "@/components/site/site-pages";
import { getPublicCatalogue } from "@/server/services/public-site";
import { liveSiteContext, liveSiteMetadata } from "../site-data";

const querySchema = z.object({
  page: z.coerce.number().int().min(1).max(10_000).catch(1),
  category: z.string().max(60).optional().catch(undefined),
});

// No loading skeleton: the page renders in one pass on the server (see layout).
export const instant = false;

export async function generateMetadata(props: PageProps<"/site/[slug]/products">) {
  const { slug } = await props.params;
  return liveSiteMetadata(slug, { title: "Products", path: "/products" });
}

export default async function BusinessCataloguePage(props: PageProps<"/site/[slug]/products">) {
  const { slug } = await props.params;
  const ctx = await liveSiteContext(slug);
  if (!ctx) notFound();
  const query = querySchema.parse(await props.searchParams);
  const catalogue = await getPublicCatalogue(ctx.business.id, { page: query.page, categorySlug: query.category });
  return <SiteCataloguePage ctx={ctx} catalogue={catalogue} />;
}
