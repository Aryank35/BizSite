import type { Metadata } from "next";
import { PageHeader } from "@/components/app/page-header";
import { requireTenant } from "@/server/session";
import { listCategories } from "@/server/services/categories";
import { CategoriesManager } from "./categories-manager";

export const metadata: Metadata = { title: "Categories" };

export default async function CategoriesPage() {
  const ctx = await requireTenant();
  const categories = await listCategories(ctx);
  return (
    <>
      <PageHeader
        title="Categories"
        description="Group products so visitors can browse your catalogue. The order here is the order on your website."
      />
      <CategoriesManager
        categories={categories.map((c) => ({
          id: c.id,
          name: c.name,
          slug: c.slug,
          description: c.description ?? "",
          productCount: c._count.products,
        }))}
      />
    </>
  );
}
