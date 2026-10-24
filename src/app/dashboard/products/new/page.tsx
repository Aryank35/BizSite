import type { Metadata } from "next";
import { PageHeader } from "@/components/app/page-header";
import { prisma } from "@/lib/db";
import { requireTenant } from "@/server/session";
import { listCategories } from "@/server/services/categories";
import { ProductForm } from "../product-form";

export const metadata: Metadata = { title: "Add product" };

export default async function NewProductPage() {
  const ctx = await requireTenant();
  const [categories, business] = await Promise.all([
    listCategories(ctx),
    prisma.business.findUnique({ where: { id: ctx.businessId }, select: { currency: true } }),
  ]);
  return (
    <>
      <PageHeader title="Add product" description="Save as a draft while you work on it, then publish when it is ready." />
      <ProductForm
        currency={business?.currency ?? "INR"}
        categories={categories.map((c) => ({ id: c.id, name: c.name }))}
        defaults={{
          name: "",
          slug: "",
          categoryId: "",
          shortDescription: "",
          description: "",
          sku: "",
          price: "",
          priceVisibility: "SHOW",
          featuredImageUrl: null,
          galleryImages: [],
          status: "DRAFT",
          isFeatured: false,
          seoTitle: "",
          seoDescription: "",
        }}
      />
    </>
  );
}
