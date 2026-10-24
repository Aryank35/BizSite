import { notFound } from "next/navigation";
import { SiteProductPage } from "@/components/site/site-pages";
import { getPublicProduct } from "@/server/services/public-site";
import { PreviewErrors, loadPreview } from "../../preview-data";

export default async function PreviewProductPage(props: PageProps<"/preview/[businessId]/products/[productSlug]">) {
  const { businessId, productSlug } = await props.params;
  const { ctx, errors } = await loadPreview(businessId);
  if (!ctx) return <PreviewErrors errors={errors} />;
  const product = await getPublicProduct(ctx.business.id, productSlug);
  if (!product) notFound();
  return <SiteProductPage ctx={ctx} product={product} productUrl={`/preview/${businessId}/products/${product.slug}`} />;
}
