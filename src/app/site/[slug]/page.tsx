import { notFound } from "next/navigation";
import { SiteHomePage } from "@/components/site/site-pages";
import { getHomeData } from "@/server/services/public-site";
import { liveSiteContext, liveSiteMetadata } from "./site-data";

// No loading skeleton: the page renders in one pass on the server (see layout).
export const instant = false;

export async function generateMetadata(props: PageProps<"/site/[slug]">) {
  const { slug } = await props.params;
  return liveSiteMetadata(slug);
}

export default async function BusinessHomePage(props: PageProps<"/site/[slug]">) {
  const { slug } = await props.params;
  const ctx = await liveSiteContext(slug);
  if (!ctx) notFound();
  const data = await getHomeData(ctx.business.id, ctx.snapshot);
  return <SiteHomePage ctx={ctx} data={data} />;
}
