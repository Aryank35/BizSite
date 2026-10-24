import { Package, Plus, Search } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { EmptyState } from "@/components/app/empty-state";
import { PageHeader } from "@/components/app/page-header";
import { Pagination } from "@/components/app/pagination";
import { NativeSelect } from "@/components/forms/native-select";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { prisma } from "@/lib/db";
import { requireTenant } from "@/server/session";
import { listCategories } from "@/server/services/categories";
import { listFeaturedProducts, listProducts } from "@/server/services/products";
import { FeaturedOrder, ProductTable } from "./product-table";

export const metadata: Metadata = { title: "Products" };

export default async function ProductsPage(props: PageProps<"/dashboard/products">) {
  const ctx = await requireTenant();
  const [result, categories, featured, business] = await Promise.all([
    listProducts(ctx, await props.searchParams),
    listCategories(ctx),
    listFeaturedProducts(ctx),
    prisma.business.findUnique({ where: { id: ctx.businessId }, select: { currency: true } }),
  ]);
  const { filter } = result;
  const filtered = Boolean(filter.q || filter.category || filter.status);

  return (
    <>
      <PageHeader
        title="Products"
        description="Only published products appear on your website."
        actions={
          <Button asChild>
            <Link href="/dashboard/products/new">
              <Plus /> Add product
            </Link>
          </Button>
        }
      />

      <form className="flex flex-col gap-2 sm:flex-row" role="search" aria-label="Filter products">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground" aria-hidden />
          <Input name="q" defaultValue={filter.q ?? ""} placeholder="Search by name or SKU" className="pl-8" aria-label="Search products" />
        </div>
        <NativeSelect name="category" defaultValue={filter.category ?? ""} aria-label="Category" className="sm:w-48">
          <option value="">All categories</option>
          <option value="none">Uncategorised</option>
          {categories.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </NativeSelect>
        <NativeSelect name="status" defaultValue={filter.status ?? ""} aria-label="Status" className="sm:w-40">
          <option value="">Any status</option>
          <option value="PUBLISHED">Published</option>
          <option value="DRAFT">Draft</option>
        </NativeSelect>
        <Button type="submit" variant="secondary">
          Apply
        </Button>
        {filtered ? (
          <Button asChild variant="ghost">
            <Link href="/dashboard/products">Clear</Link>
          </Button>
        ) : null}
      </form>

      {result.items.length === 0 ? (
        <EmptyState
          icon={Package}
          title={filtered ? "No products match these filters" : "Add your first product"}
          description={
            filtered ? "Try a different search or clear the filters." : "Products you publish appear in your website catalogue with enquiry and WhatsApp buttons."
          }
          action={
            filtered ? null : (
              <Button asChild>
                <Link href="/dashboard/products/new">
                  <Plus /> Add product
                </Link>
              </Button>
            )
          }
        />
      ) : (
        <ProductTable
          canReorder={!filtered && result.pageCount === 1}
          currency={business?.currency ?? "INR"}
          products={result.items.map((p) => ({
            id: p.id,
            name: p.name,
            sku: p.sku,
            status: p.status,
            isFeatured: p.isFeatured,
            priceMinor: p.priceMinor,
            priceVisibility: p.priceVisibility,
            imageUrl: p.featuredImageUrl,
            categoryName: p.category?.name ?? null,
          }))}
        />
      )}

      <Pagination
        basePath="/dashboard/products"
        params={{ q: filter.q, category: filter.category, status: filter.status }}
        page={result.page}
        pageCount={result.pageCount}
        total={result.total}
        noun="products"
      />

      {featured.length > 1 ? (
        <FeaturedOrder products={featured.map((p) => ({ id: p.id, name: p.name, status: p.status, imageUrl: p.featuredImageUrl }))} />
      ) : null}
    </>
  );
}
