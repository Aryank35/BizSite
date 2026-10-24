import { z } from "zod";
import { SiteCataloguePage } from "@/components/site/site-pages";
import { getPublicCatalogue } from "@/server/services/public-site";
import { PreviewErrors, loadPreview } from "../preview-data";

const querySchema = z.object({
  page: z.coerce.number().int().min(1).max(10_000).catch(1),
  category: z.string().max(60).optional().catch(undefined),
});

export default async function PreviewCataloguePage(props: PageProps<"/preview/[businessId]/products">) {
  const { businessId } = await props.params;
  const { ctx, errors } = await loadPreview(businessId);
  if (!ctx) return <PreviewErrors errors={errors} />;
  const query = querySchema.parse(await props.searchParams);
  const catalogue = await getPublicCatalogue(ctx.business.id, { page: query.page, categorySlug: query.category });
  return <SiteCataloguePage ctx={ctx} catalogue={catalogue} />;
}
