"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { Controller, useForm, useWatch } from "react-hook-form";
import { applyResult } from "@/components/forms/apply-result";
import { Field, fieldAria } from "@/components/forms/field";
import { NativeSelect } from "@/components/forms/native-select";
import { GalleryUpload } from "@/components/media/gallery-upload";
import { ImageUpload } from "@/components/media/image-upload";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { MAX_GALLERY_IMAGES, productSchema, type ProductInput, type ProductValues } from "@/lib/validators/catalogue";
import { createProductAction, updateProductAction } from "../actions";

export function ProductForm({
  productId,
  defaults,
  categories,
  currency,
}: {
  productId?: string;
  defaults: ProductInput;
  categories: { id: string; name: string }[];
  currency: string;
}) {
  const router = useRouter();
  const form = useForm<ProductInput, unknown, ProductValues>({ resolver: zodResolver(productSchema), defaultValues: defaults });
  const { errors, isSubmitting, isDirty } = form.formState;
  const priceVisibility = useWatch({ control: form.control, name: "priceVisibility" });

  // The server validates the raw input again, so submit it rather than the parsed output.
  async function onSubmit() {
    const values = form.getValues();
    if (productId) {
      const result = await updateProductAction(productId, values);
      if (applyResult(result, { success: "Product saved", setError: form.setError })) form.reset(values);
      return;
    }
    const result = await createProductAction(values);
    if (applyResult(result, { success: "Product created", setError: form.setError }) && result.ok) {
      router.replace(`/dashboard/products/${result.data.id}`);
    }
  }

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} noValidate className="grid gap-6 lg:grid-cols-[1fr_20rem]">
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Details</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-5">
            <Field id="name" label="Product name" required error={errors.name?.message}>
              <Input {...fieldAria("name", errors.name?.message)} {...form.register("name")} />
            </Field>
            <Field id="shortDescription" label="Short description" hint="One line shown on product cards." error={errors.shortDescription?.message}>
              <Input {...fieldAria("shortDescription", errors.shortDescription?.message, true)} {...form.register("shortDescription")} />
            </Field>
            <Field id="description" label="Full description" hint="Materials, sizes, options, delivery — plain text, line breaks are kept." error={errors.description?.message}>
              <Textarea {...fieldAria("description", errors.description?.message, true)} rows={8} {...form.register("description")} />
            </Field>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Images</CardTitle>
            <CardDescription>The featured image is used on product cards. Add up to {MAX_GALLERY_IMAGES} more for the product page.</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-6 md:grid-cols-[14rem_1fr]">
            <Field id="featuredImage" label="Featured image" error={errors.featuredImageUrl?.message}>
              <Controller
                control={form.control}
                name="featuredImageUrl"
                render={({ field }) => <ImageUpload value={field.value} onChange={field.onChange} aspect="aspect-[4/3]" />}
              />
            </Field>
            <div className="grid content-start gap-1.5">
              <span className="text-sm font-medium">Gallery</span>
              <Controller
                control={form.control}
                name="galleryImages"
                render={({ field }) => (
                  <GalleryUpload
                    value={(field.value ?? []).map((g) => ({ url: g.url, alt: g.alt ?? null }))}
                    onChange={field.onChange}
                    max={MAX_GALLERY_IMAGES}
                  />
                )}
              />
              {errors.galleryImages ? <p className="text-xs text-destructive">{errors.galleryImages.message ?? "Check the gallery images"}</p> : null}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Search engine listing</CardTitle>
            <CardDescription>Optional. Defaults to the product name and short description.</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-5">
            <Field id="seoTitle" label="Page title" hint="Up to 70 characters." error={errors.seoTitle?.message}>
              <Input {...fieldAria("seoTitle", errors.seoTitle?.message, true)} maxLength={70} {...form.register("seoTitle")} />
            </Field>
            <Field id="seoDescription" label="Meta description" hint="Up to 160 characters." error={errors.seoDescription?.message}>
              <Textarea {...fieldAria("seoDescription", errors.seoDescription?.message, true)} rows={2} maxLength={160} {...form.register("seoDescription")} />
            </Field>
            <Field id="slug" label="Web address" hint="Leave blank to create one from the name." error={errors.slug?.message}>
              <Input {...fieldAria("slug", errors.slug?.message, true)} {...form.register("slug")} />
            </Field>
          </CardContent>
        </Card>
      </div>

      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Visibility</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4">
            <Field id="status" label="Status" hint="Drafts are never shown on your website.">
              <NativeSelect {...fieldAria("status", undefined, true)} {...form.register("status")}>
                <option value="DRAFT">Draft</option>
                <option value="PUBLISHED">Published</option>
              </NativeSelect>
            </Field>
            <Controller
              control={form.control}
              name="isFeatured"
              render={({ field }) => (
                <div className="flex items-start justify-between gap-3 rounded-lg border p-3">
                  <div>
                    <label htmlFor="isFeatured" className="text-sm font-medium">
                      Featured
                    </label>
                    <p className="text-xs text-muted-foreground">Show in the Featured products section.</p>
                  </div>
                  <Switch id="isFeatured" checked={field.value} onCheckedChange={field.onChange} />
                </div>
              )}
            />
            <Field id="categoryId" label="Category" error={errors.categoryId?.message}>
              <NativeSelect {...fieldAria("categoryId", errors.categoryId?.message)} {...form.register("categoryId")}>
                <option value="">No category</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </NativeSelect>
            </Field>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Price</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4">
            <Field id="priceVisibility" label="Display">
              <NativeSelect {...fieldAria("priceVisibility")} {...form.register("priceVisibility")}>
                <option value="SHOW">Show price</option>
                <option value="CONTACT_FOR_PRICE">Contact for price</option>
              </NativeSelect>
            </Field>
            <Field
              id="price"
              label={`Price (${currency})`}
              hint={priceVisibility === "CONTACT_FOR_PRICE" ? "Optional — kept private, for your records." : "For example 1499 or 1499.50"}
              error={errors.price?.message}
            >
              <Input {...fieldAria("price", errors.price?.message, true)} inputMode="decimal" {...form.register("price")} />
            </Field>
            <Field id="sku" label="SKU" hint="Optional stock code." error={errors.sku?.message}>
              <Input {...fieldAria("sku", errors.sku?.message, true)} {...form.register("sku")} />
            </Field>
          </CardContent>
        </Card>

        <div className="flex flex-col gap-2">
          <Button type="submit" disabled={isSubmitting || (Boolean(productId) && !isDirty)}>
            {isSubmitting ? <Loader2 className="animate-spin" /> : null}
            {productId ? "Save changes" : "Create product"}
          </Button>
          <Button type="button" variant="ghost" onClick={() => router.push("/dashboard/products")}>
            Back to products
          </Button>
        </div>
      </div>
    </form>
  );
}
