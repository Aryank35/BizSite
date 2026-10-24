"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowDown, ArrowUp, Loader2, Pencil, Plus, Tags, Trash2 } from "lucide-react";
import Link from "next/link";
import { useState, useTransition } from "react";
import { useForm } from "react-hook-form";
import { ConfirmAction } from "@/components/app/confirm-action";
import { EmptyState } from "@/components/app/empty-state";
import { applyResult } from "@/components/forms/apply-result";
import { Field, fieldAria } from "@/components/forms/field";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { categorySchema, type CategoryInput } from "@/lib/validators/catalogue";
import { createCategoryAction, deleteCategoryAction, moveCategoryAction, updateCategoryAction } from "../actions";

type Category = { id: string; name: string; slug: string; description: string; productCount: number };

function CategoryDialog({ category, trigger }: { category?: Category; trigger: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  const form = useForm<CategoryInput>({
    resolver: zodResolver(categorySchema),
    defaultValues: { name: category?.name ?? "", slug: category?.slug ?? "", description: category?.description ?? "" },
  });
  const { errors, isSubmitting } = form.formState;

  async function onSubmit(values: CategoryInput) {
    const result = category ? await updateCategoryAction(category.id, values) : await createCategoryAction(values);
    if (applyResult(result, { success: category ? "Category updated" : "Category created", setError: form.setError })) {
      setOpen(false);
      if (!category) form.reset();
    }
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        setOpen(next);
        if (next && category) form.reset({ name: category.name, slug: category.slug, description: category.description });
      }}
    >
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4" noValidate>
          <DialogHeader>
            <DialogTitle>{category ? "Edit category" : "New category"}</DialogTitle>
            <DialogDescription>Categories appear as filters on your product catalogue.</DialogDescription>
          </DialogHeader>
          <Field id="category-name" label="Name" required error={errors.name?.message}>
            <Input {...fieldAria("category-name", errors.name?.message)} {...form.register("name")} />
          </Field>
          <Field id="category-slug" label="Web address" hint="Leave blank to create one from the name." error={errors.slug?.message}>
            <Input {...fieldAria("category-slug", errors.slug?.message, true)} {...form.register("slug")} />
          </Field>
          <Field id="category-description" label="Description" error={errors.description?.message}>
            <Textarea {...fieldAria("category-description", errors.description?.message)} rows={3} {...form.register("description")} />
          </Field>
          <DialogFooter>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? <Loader2 className="animate-spin" /> : null} {category ? "Save changes" : "Create category"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export function CategoriesManager({ categories }: { categories: Category[] }) {
  const [pending, startTransition] = useTransition();

  const move = (id: string, dir: "up" | "down") =>
    startTransition(async () => {
      applyResult(await moveCategoryAction(id, dir));
    });

  const addButton = (
    <Button>
      <Plus /> New category
    </Button>
  );

  if (categories.length === 0) {
    return (
      <EmptyState
        icon={Tags}
        title="No categories yet"
        description="Create categories such as “Living Room” or “Sarees” to organise your products."
        action={<CategoryDialog trigger={addButton} />}
      />
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <CategoryDialog trigger={addButton} />
      </div>
      <Card className="py-0">
        <ul className="divide-y">
          {categories.map((c, index) => (
            <li key={c.id} className="flex flex-wrap items-center gap-3 px-4 py-3">
              <div className="flex gap-1">
                <Button size="icon-sm" variant="ghost" disabled={pending || index === 0} onClick={() => move(c.id, "up")} aria-label={`Move ${c.name} up`}>
                  <ArrowUp />
                </Button>
                <Button
                  size="icon-sm"
                  variant="ghost"
                  disabled={pending || index === categories.length - 1}
                  onClick={() => move(c.id, "down")}
                  aria-label={`Move ${c.name} down`}
                >
                  <ArrowDown />
                </Button>
              </div>
              <div className="min-w-0 flex-1">
                <p className="font-medium">{c.name}</p>
                <p className="truncate text-sm text-muted-foreground">{c.description || `/${c.slug}`}</p>
              </div>
              <Link href={`/dashboard/products?category=${c.id}`} className="text-sm text-muted-foreground hover:text-foreground hover:underline">
                {c.productCount} {c.productCount === 1 ? "product" : "products"}
              </Link>
              <div className="flex gap-1">
                <CategoryDialog
                  category={c}
                  trigger={
                    <Button size="sm" variant="ghost" aria-label={`Edit ${c.name}`}>
                      <Pencil /> <span className="hidden sm:inline">Edit</span>
                    </Button>
                  }
                />
                <ConfirmAction
                  trigger={
                    <Button size="sm" variant="ghost" aria-label={`Delete ${c.name}`}>
                      <Trash2 /> <span className="hidden sm:inline">Delete</span>
                    </Button>
                  }
                  title={`Delete “${c.name}”?`}
                  description={
                    c.productCount > 0
                      ? `Its ${c.productCount} product(s) will be kept but become uncategorised.`
                      : "This category has no products."
                  }
                  confirmLabel="Delete category"
                  destructive
                  successMessage="Category deleted"
                  action={() => deleteCategoryAction(c.id)}
                />
              </div>
            </li>
          ))}
        </ul>
      </Card>
    </div>
  );
}
