"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { CheckCircle2, Loader2 } from "lucide-react";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { submitEnquiryAction } from "@/app/site/actions";
import { cn } from "@/lib/utils";
import { publicEnquirySchema, type PublicEnquiryInput } from "@/lib/validators/enquiry";
import type { z } from "zod";

const inputClass =
  "w-full rounded-lg border border-neutral-300 bg-white px-3 py-2.5 text-sm text-neutral-900 outline-none transition focus:border-[var(--site-primary)] focus:ring-2 focus:ring-[var(--site-primary)]/25 aria-invalid:border-red-500 disabled:bg-neutral-100";

function FormField({ id, label, error, children, optional }: { id: string; label: string; error?: string; children: React.ReactNode; optional?: boolean }) {
  return (
    <div className="grid gap-1.5">
      <label htmlFor={id} className="text-sm font-medium text-neutral-800">
        {label} {optional ? <span className="font-normal text-neutral-500">(optional)</span> : null}
      </label>
      {children}
      {error ? (
        <p id={`${id}-error`} role="alert" className="text-xs font-medium text-red-600">
          {error}
        </p>
      ) : null}
    </div>
  );
}

export function EnquiryForm({
  businessSlug,
  productSlug,
  productName,
  submitLabel,
  successMessage,
  buttonClassName,
  disabled = false,
}: {
  businessSlug: string;
  productSlug?: string;
  productName?: string;
  submitLabel: string;
  successMessage: string;
  buttonClassName?: string;
  disabled?: boolean;
}) {
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const form = useForm<PublicEnquiryInput, unknown, z.output<typeof publicEnquirySchema>>({
    resolver: zodResolver(publicEnquirySchema),
    defaultValues: {
      businessSlug,
      productSlug: productSlug ?? "",
      customerName: "",
      email: "",
      phone: "",
      message: productName ? `I am interested in “${productName}”. ` : "",
      hpField: "",
    },
  });
  const { errors, isSubmitting } = form.formState;

  // The server validates the raw input again, so submit it rather than the parsed output.
  async function onSubmit() {
    setError(null);
    const result = await submitEnquiryAction(form.getValues());
    if (result.ok) {
      setSent(true);
      form.reset();
    } else {
      setError(result.error);
    }
  }

  if (sent) {
    return (
      <div role="status" className="flex flex-col items-center gap-3 py-8 text-center">
        <CheckCircle2 className="size-10 text-emerald-600" aria-hidden />
        <p className="max-w-sm font-medium text-neutral-900">{successMessage}</p>
        <button type="button" className="text-sm text-[var(--site-primary)] underline-offset-4 hover:underline" onClick={() => setSent(false)}>
          Send another message
        </button>
      </div>
    );
  }

  const aria = (name: keyof PublicEnquiryInput) => ({
    id: `enquiry-${name}`,
    "aria-invalid": errors[name] ? true : undefined,
    "aria-describedby": errors[name] ? `enquiry-${name}-error` : undefined,
  });

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} noValidate className="grid gap-4">
      {disabled ? (
        <p className="rounded-lg bg-amber-50 px-3 py-2 text-sm text-amber-900">The form is disabled in preview.</p>
      ) : null}
      {error ? (
        <p role="alert" className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </p>
      ) : null}
      <fieldset disabled={disabled || isSubmitting} className="grid gap-4">
        <FormField id="enquiry-customerName" label="Your name" error={errors.customerName?.message}>
          <input {...aria("customerName")} autoComplete="name" className={inputClass} {...form.register("customerName")} />
        </FormField>
        <div className="grid gap-4 sm:grid-cols-2">
          <FormField id="enquiry-phone" label="Phone" optional error={errors.phone?.message}>
            <input {...aria("phone")} type="tel" autoComplete="tel" className={inputClass} {...form.register("phone")} />
          </FormField>
          <FormField id="enquiry-email" label="Email" optional error={errors.email?.message}>
            <input {...aria("email")} type="email" autoComplete="email" className={inputClass} {...form.register("email")} />
          </FormField>
        </div>
        <FormField id="enquiry-message" label="Message" error={errors.message?.message}>
          <textarea {...aria("message")} rows={5} className={inputClass} {...form.register("message")} />
        </FormField>
        {/* Honeypot: invisible to people and screen readers. */}
        <div aria-hidden className="absolute -left-[9999px] h-px w-px overflow-hidden">
          <label htmlFor="enquiry-hp">Leave this field empty</label>
          <input id="enquiry-hp" tabIndex={-1} autoComplete="off" {...form.register("hpField")} />
        </div>
        <p className="text-xs text-neutral-500">Please give a phone number or email so we can reply. Your details are only shared with this business.</p>
        <button
          type="submit"
          className={cn(
            "inline-flex h-11 items-center justify-center gap-2 bg-[var(--site-primary)] px-6 text-sm font-semibold text-[var(--site-on-primary)] transition hover:brightness-110 disabled:opacity-60",
            buttonClassName,
          )}
        >
          {isSubmitting ? <Loader2 className="size-4 animate-spin" aria-hidden /> : null}
          {submitLabel}
        </button>
      </fieldset>
    </form>
  );
}
