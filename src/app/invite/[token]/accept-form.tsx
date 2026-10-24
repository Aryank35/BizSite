"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2 } from "lucide-react";
import { useForm } from "react-hook-form";
import { applyResult } from "@/components/forms/apply-result";
import { Field, fieldAria } from "@/components/forms/field";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PASSWORD_MIN_LENGTH } from "@/lib/constants";
import { acceptInvitationSchema, type AcceptInvitationInput } from "@/lib/validators/auth";
import { acceptInvitationAction } from "./actions";

export function AcceptInvitationForm({ token, defaultName }: { token: string; defaultName: string }) {
  const form = useForm<AcceptInvitationInput>({
    resolver: zodResolver(acceptInvitationSchema),
    defaultValues: { name: defaultName, password: "", confirmPassword: "" },
  });
  const { errors, isSubmitting } = form.formState;

  async function onSubmit(values: AcceptInvitationInput) {
    const result = await acceptInvitationAction(token, values);
    if (applyResult(result, { success: "Welcome! Your account is ready.", setError: form.setError })) {
      window.location.assign(new URL("/dashboard", window.location.origin).href);
    }
  }

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4" noValidate>
      <Field id="name" label="Your name" error={errors.name?.message}>
        <Input {...fieldAria("name", errors.name?.message)} autoComplete="name" {...form.register("name")} />
      </Field>
      <Field id="password" label="Password" hint={`At least ${PASSWORD_MIN_LENGTH} characters.`} error={errors.password?.message}>
        <Input {...fieldAria("password", errors.password?.message, true)} type="password" autoComplete="new-password" {...form.register("password")} />
      </Field>
      <Field id="confirmPassword" label="Confirm password" error={errors.confirmPassword?.message}>
        <Input
          {...fieldAria("confirmPassword", errors.confirmPassword?.message)}
          type="password"
          autoComplete="new-password"
          {...form.register("confirmPassword")}
        />
      </Field>
      <Button type="submit" className="h-9 w-full" disabled={isSubmitting}>
        {isSubmitting ? <Loader2 className="animate-spin" /> : null}
        Create account
      </Button>
    </form>
  );
}
