"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2 } from "lucide-react";
import { useSearchParams } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";
import type { z } from "zod";
import { Field, fieldAria } from "@/components/forms/field";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { authClient } from "@/lib/auth-client";
import { safeRedirectPath } from "@/lib/safe-redirect";
import { loginSchema } from "@/lib/validators/auth";

type Values = z.input<typeof loginSchema>;

export function LoginForm() {
  const searchParams = useSearchParams();
  const [error, setError] = useState<string | null>(null);
  const form = useForm<Values>({ resolver: zodResolver(loginSchema), defaultValues: { email: "", password: "" } });
  const { errors, isSubmitting } = form.formState;

  async function onSubmit(values: Values) {
    setError(null);
    const { error: signInError } = await authClient.signIn.email({
      email: values.email.trim().toLowerCase(),
      password: values.password,
    });
    if (signInError) {
      // Deliberately generic: do not reveal whether the email exists or is suspended.
      setError(
        signInError.status === 429
          ? "Too many sign-in attempts. Please wait a minute and try again."
          : "The email or password is incorrect, or the account is not active.",
      );
      return;
    }
    // Full navigation so the server renders with the new session.
    const destination = safeRedirectPath(searchParams.get("next")) ?? "/auth/continue";
    window.location.assign(new URL(destination, window.location.origin).href);
  }

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5" noValidate>
      {error ? (
        <p role="alert" className="rounded-lg border border-destructive/30 bg-destructive/5 px-3 py-2 text-sm text-destructive">
          {error}
        </p>
      ) : null}
      <Field id="email" label="Email" error={errors.email?.message}>
        <Input {...fieldAria("email", errors.email?.message)} type="email" autoComplete="email" {...form.register("email")} />
      </Field>
      <Field id="password" label="Password" error={errors.password?.message}>
        <Input
          {...fieldAria("password", errors.password?.message)}
          type="password"
          autoComplete="current-password"
          {...form.register("password")}
        />
      </Field>
      <Button type="submit" className="h-9 w-full" disabled={isSubmitting}>
        {isSubmitting ? <Loader2 className="animate-spin" /> : null}
        Sign in
      </Button>
    </form>
  );
}
