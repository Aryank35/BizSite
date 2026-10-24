"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { CheckCircle2, Loader2 } from "lucide-react";
import { useSearchParams } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";
import type { z } from "zod";
import { submitWebsiteRequestAction } from "@/app/site/actions";
import { Field, fieldAria } from "@/components/forms/field";
import { NativeSelect } from "@/components/forms/native-select";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { BUSINESS_CATEGORIES } from "@/lib/constants";
import { websiteRequestSchema, type WebsiteRequestInput } from "@/lib/validators/enquiry";

export function WebsiteRequestForm() {
  const plan = useSearchParams().get("plan");
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const form = useForm<WebsiteRequestInput, unknown, z.output<typeof websiteRequestSchema>>({
    resolver: zodResolver(websiteRequestSchema),
    defaultValues: {
      name: "",
      email: "",
      phone: "",
      businessName: "",
      category: "",
      message: plan && /^[a-z]{1,20}$/.test(plan) ? `I am interested in the ${plan} plan.` : "",
      hpField: "",
    },
  });
  const { errors, isSubmitting } = form.formState;

  // The server validates the raw input again, so submit it rather than the parsed output.
  async function onSubmit() {
    setError(null);
    const result = await submitWebsiteRequestAction(form.getValues());
    if (result.ok) setSent(true);
    else setError(result.error);
  }

  if (sent) {
    return (
      <div role="status" className="flex flex-col items-center gap-3 py-12 text-center">
        <CheckCircle2 className="size-10 text-emerald-600" aria-hidden />
        <h2 className="text-xl font-semibold">Thank you — request received</h2>
        <p className="max-w-sm text-muted-foreground">We will contact you within one working day to set up your website.</p>
      </div>
    );
  }

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} noValidate className="grid gap-5 sm:grid-cols-2">
      {error ? (
        <p role="alert" className="rounded-lg border border-destructive/30 bg-destructive/5 px-3 py-2 text-sm text-destructive sm:col-span-2">
          {error}
        </p>
      ) : null}
      <Field id="name" label="Your name" required error={errors.name?.message}>
        <Input {...fieldAria("name", errors.name?.message)} autoComplete="name" {...form.register("name")} />
      </Field>
      <Field id="businessName" label="Business name" required error={errors.businessName?.message}>
        <Input {...fieldAria("businessName", errors.businessName?.message)} autoComplete="organization" {...form.register("businessName")} />
      </Field>
      <Field id="email" label="Email" required error={errors.email?.message}>
        <Input {...fieldAria("email", errors.email?.message)} type="email" autoComplete="email" {...form.register("email")} />
      </Field>
      <Field id="phone" label="Phone" error={errors.phone?.message}>
        <Input {...fieldAria("phone", errors.phone?.message)} type="tel" autoComplete="tel" {...form.register("phone")} />
      </Field>
      <Field id="category" label="Type of business" className="sm:col-span-2" error={errors.category?.message}>
        <NativeSelect {...fieldAria("category", errors.category?.message)} {...form.register("category")}>
          <option value="">Choose one (optional)</option>
          {BUSINESS_CATEGORIES.map((c) => (
            <option key={c.value} value={c.value}>
              {c.label}
            </option>
          ))}
        </NativeSelect>
      </Field>
      <Field id="message" label="What would you like on your website?" className="sm:col-span-2" error={errors.message?.message}>
        <Textarea {...fieldAria("message", errors.message?.message)} rows={4} {...form.register("message")} />
      </Field>
      <div aria-hidden className="absolute -left-[9999px] h-px w-px overflow-hidden">
        <label htmlFor="hp-field">Leave this field empty</label>
        <input id="hp-field" tabIndex={-1} autoComplete="off" {...form.register("hpField")} />
      </div>
      <Button type="submit" className="h-10 sm:col-span-2" disabled={isSubmitting}>
        {isSubmitting ? <Loader2 className="animate-spin" /> : null} Send request
      </Button>
    </form>
  );
}
