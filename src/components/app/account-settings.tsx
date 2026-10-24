"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2 } from "lucide-react";
import { useForm } from "react-hook-form";
import { applyResult } from "@/components/forms/apply-result";
import { Field, fieldAria } from "@/components/forms/field";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { PASSWORD_MIN_LENGTH } from "@/lib/constants";
import { accountNameSchema, changePasswordSchema, type ChangePasswordInput } from "@/lib/validators/auth";
import { changePasswordAction, updateAccountNameAction } from "@/server/account-actions";

export function AccountSettings({ name, email }: { name: string; email: string }) {
  const nameForm = useForm<{ name: string }>({ resolver: zodResolver(accountNameSchema), defaultValues: { name } });
  const passwordForm = useForm<ChangePasswordInput>({
    resolver: zodResolver(changePasswordSchema),
    defaultValues: { currentPassword: "", newPassword: "", confirmPassword: "" },
  });
  const nameErrors = nameForm.formState.errors;
  const pwErrors = passwordForm.formState.errors;

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <form
        noValidate
        onSubmit={nameForm.handleSubmit(async (values) => {
          const result = await updateAccountNameAction(values);
          if (applyResult(result, { success: "Name updated", setError: nameForm.setError })) nameForm.reset(values);
        })}
      >
        <Card className="h-full">
          <CardHeader>
            <CardTitle>Your account</CardTitle>
            <CardDescription>Signed in as {email}.</CardDescription>
          </CardHeader>
          <CardContent>
            <Field id="account-name" label="Name" error={nameErrors.name?.message}>
              <Input {...fieldAria("account-name", nameErrors.name?.message)} autoComplete="name" {...nameForm.register("name")} />
            </Field>
          </CardContent>
          <CardFooter className="justify-end border-t">
            <Button type="submit" disabled={nameForm.formState.isSubmitting || !nameForm.formState.isDirty}>
              Save name
            </Button>
          </CardFooter>
        </Card>
      </form>

      <form
        noValidate
        onSubmit={passwordForm.handleSubmit(async (values) => {
          const result = await changePasswordAction(values);
          if (applyResult(result, { success: "Password changed. Other devices have been signed out.", setError: passwordForm.setError })) {
            passwordForm.reset();
          }
        })}
      >
        <Card>
          <CardHeader>
            <CardTitle>Change password</CardTitle>
            <CardDescription>Changing your password signs you out on other devices.</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4">
            <Field id="currentPassword" label="Current password" error={pwErrors.currentPassword?.message}>
              <Input
                {...fieldAria("currentPassword", pwErrors.currentPassword?.message)}
                type="password"
                autoComplete="current-password"
                {...passwordForm.register("currentPassword")}
              />
            </Field>
            <Field id="newPassword" label="New password" hint={`At least ${PASSWORD_MIN_LENGTH} characters.`} error={pwErrors.newPassword?.message}>
              <Input
                {...fieldAria("newPassword", pwErrors.newPassword?.message, true)}
                type="password"
                autoComplete="new-password"
                {...passwordForm.register("newPassword")}
              />
            </Field>
            <Field id="confirmPassword" label="Confirm new password" error={pwErrors.confirmPassword?.message}>
              <Input
                {...fieldAria("confirmPassword", pwErrors.confirmPassword?.message)}
                type="password"
                autoComplete="new-password"
                {...passwordForm.register("confirmPassword")}
              />
            </Field>
          </CardContent>
          <CardFooter className="justify-end border-t">
            <Button type="submit" disabled={passwordForm.formState.isSubmitting}>
              {passwordForm.formState.isSubmitting ? <Loader2 className="animate-spin" /> : null} Change password
            </Button>
          </CardFooter>
        </Card>
      </form>
    </div>
  );
}
