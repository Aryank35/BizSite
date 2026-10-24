import { ExternalLink } from "lucide-react";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { PageHeader } from "@/components/app/page-header";
import { StatusBadge } from "@/components/app/status-badge";
import { Button } from "@/components/ui/button";
import { prisma } from "@/lib/db";
import { formatDateTime } from "@/lib/format";
import { minorToInput } from "@/lib/money";
import { NotFoundError } from "@/server/errors";
import { requireTenant } from "@/server/session";
import { listCategories } from "@/server/services/categories";
import { getProduct } from "@/server/services/products";
import { ProductForm } from "../product-form";

export const metadata: Metadata = { title: "Edit product" };

export default async function EditProductPage(props: PageProps<"/dashboard/products/[productId]">) {
  const ctx = await requireTenant();
  const { productId } = await props.params;
  // getProduct is scoped to the current business: another tenant's id is simply "not found".
  const product = await getProduct(ctx, productId).catch((error) => {
    if (error instanceof NotFoundError) notFound();
    throw error;
  });
  const [categories, business] = await Promise.all([
    listCategories(ctx),
    prisma.business.findUnique({ where: { id: ctx.businessId }, select: { currency: true, slug: true, publishedAt: true } }),
  ]);
  const isPublic = product.status === "PUBLISHED" && Boolean(business?.publishedAt);

  return (
    <>
      <PageHeader
        title={product.name}
        description={
          <span className="flex flex-wrap items-center gap-2">
            <StatusBadge status={product.status} /> Last updated {formatDateTime(product.updatedAt)}
          </span>
        }
        actions={
          isPublic ? (
            <Button asChild variant="outline">
              <a href={`/site/${business!.slug}/products/${product.slug}`} target="_blank" rel="noreferrer">
                <ExternalLink /> View on website
              </a>
            </Button>
          ) : null
        }
      />
      <ProductForm
        productId={product.id}
        currency={business?.currency ?? "INR"}
        categories={categories.map((c) => ({ id: c.id, name: c.name }))}
        defaults={{
          name: product.name,
          slug: product.slug,
          categoryId: product.categoryId ?? "",
          shortDescription: product.shortDescription ?? "",
          description: product.description ?? "",
          sku: product.sku ?? "",
          price: minorToInput(product.priceMinor),
          priceVisibility: product.priceVisibility,
          featuredImageUrl: product.featuredImageUrl,
          galleryImages: product.images.map((i) => ({ url: i.url, alt: i.alt ?? "" })),
          status: product.status,
          isFeatured: product.isFeatured,
          seoTitle: product.seoTitle ?? "",
          seoDescription: product.seoDescription ?? "",
        }}
      />
    </>
  );
}
