"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { applyResult } from "@/components/forms/apply-result";
import { Field, fieldAria } from "@/components/forms/field";
import { NativeSelect } from "@/components/forms/native-select";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { BUSINESS_CATEGORIES } from "@/lib/constants";
import { businessCreateSchema, type BusinessCreateInput } from "@/lib/validators/business";
import { slugify } from "@/lib/validators/common";
import { createBusinessAction } from "../../actions";

export function NewBusinessForm() {
  const router = useRouter();
  const form = useForm<BusinessCreateInput>({
    resolver: zodResolver(businessCreateSchema),
    defaultValues: {
      name: "",
      slug: "",
      category: "" as BusinessCreateInput["category"],
      description: "",
      email: "",
      phone: "",
      whatsappNumber: "",
      city: "",
      state: "",
    },
  });
  const { errors, isSubmitting, dirtyFields } = form.formState;

  async function onSubmit(values: BusinessCreateInput) {
    const result = await createBusinessAction(values);
    if (applyResult(result, { success: "Business created", setError: form.setError }) && result.ok) {
      router.push(`/admin/businesses/${result.data.id}`);
    }
  }

  const nameField = form.register("name", {
    onChange: (e) => {
      if (!dirtyFields.slug) form.setValue("slug", slugify(e.target.value));
    },
  });

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} noValidate>
      <Card>
        <CardHeader>
          <CardTitle>Business details</CardTitle>
          <CardDescription>The business administrator can complete the full profile later.</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-5 sm:grid-cols-2">
          <Field id="name" label="Business name" required error={errors.name?.message}>
            <Input {...fieldAria("name", errors.name?.message)} {...nameField} />
          </Field>
          <Field id="slug" label="Web address" required hint="Used in /site/your-address" error={errors.slug?.message}>
            <Input {...fieldAria("slug", errors.slug?.message, true)} {...form.register("slug")} />
          </Field>
          <Field id="category" label="Category" required error={errors.category?.message}>
            <NativeSelect {...fieldAria("category", errors.category?.message)} {...form.register("category")}>
              <option value="">Choose a category</option>
              {BUSINESS_CATEGORIES.map((c) => (
                <option key={c.value} value={c.value}>
                  {c.label}
                </option>
              ))}
            </NativeSelect>
          </Field>
          <Field id="email" label="Contact email" error={errors.email?.message}>
            <Input {...fieldAria("email", errors.email?.message)} type="email" {...form.register("email")} />
          </Field>
          <Field id="phone" label="Phone" error={errors.phone?.message}>
            <Input {...fieldAria("phone", errors.phone?.message)} type="tel" {...form.register("phone")} />
          </Field>
          <Field id="whatsappNumber" label="WhatsApp number" hint="With country code, e.g. +91 98765 43210" error={errors.whatsappNumber?.message}>
            <Input {...fieldAria("whatsappNumber", errors.whatsappNumber?.message, true)} type="tel" {...form.register("whatsappNumber")} />
          </Field>
          <Field id="city" label="City" error={errors.city?.message}>
            <Input {...fieldAria("city", errors.city?.message)} {...form.register("city")} />
          </Field>
          <Field id="state" label="State" error={errors.state?.message}>
            <Input {...fieldAria("state", errors.state?.message)} {...form.register("state")} />
          </Field>
          <Field id="description" label="Short description" className="sm:col-span-2" error={errors.description?.message}>
            <Textarea {...fieldAria("description", errors.description?.message)} rows={3} {...form.register("description")} />
          </Field>
        </CardContent>
        <CardFooter className="justify-end gap-2 border-t">
          <Button type="button" variant="ghost" onClick={() => router.back()}>
            Cancel
          </Button>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? <Loader2 className="animate-spin" /> : null}
            Create business
          </Button>
        </CardFooter>
      </Card>
    </form>
  );
}
