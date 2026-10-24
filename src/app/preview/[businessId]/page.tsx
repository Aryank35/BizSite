import { SiteHomePage } from "@/components/site/site-pages";
import { getHomeData } from "@/server/services/public-site";
import { PreviewErrors, loadPreview } from "./preview-data";

export default async function PreviewHomePage(props: PageProps<"/preview/[businessId]">) {
  const { businessId } = await props.params;
  const { ctx, errors } = await loadPreview(businessId);
  if (!ctx) return <PreviewErrors errors={errors} />;
  return <SiteHomePage ctx={ctx} data={await getHomeData(ctx.business.id, ctx.snapshot)} />;
}
