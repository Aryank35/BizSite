"use client";

import { Loader2 } from "lucide-react";
import { useForm } from "react-hook-form";
import { applyResult } from "@/components/forms/apply-result";
import { Field, fieldAria } from "@/components/forms/field";
import { NativeSelect } from "@/components/forms/native-select";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { TEMPLATES, type TemplateKey } from "@/lib/website/theme";
import { updatePlatformSettingsAction } from "../actions";

type Values = { platformName: string; supportEmail: string; defaultTemplate: TemplateKey };

export function PlatformSettingsForm({ defaults, enabledTemplates }: { defaults: Values; enabledTemplates: TemplateKey[] }) {
  const form = useForm<Values>({ defaultValues: defaults });
  const { errors, isSubmitting, isDirty } = form.formState;

  return (
    <form
      noValidate
      onSubmit={form.handleSubmit(async (values) => {
        const result = await updatePlatformSettingsAction(values);
        if (applyResult(result, { success: "Platform settings saved", setError: form.setError })) form.reset(values);
      })}
    >
      <Card>
        <CardHeader>
          <CardTitle>Platform</CardTitle>
          <CardDescription>Defaults applied to newly created businesses.</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-5 md:grid-cols-3">
          <Field id="platformName" label="Platform name" error={errors.platformName?.message}>
            <Input {...fieldAria("platformName", errors.platformName?.message)} {...form.register("platformName")} />
          </Field>
          <Field id="supportEmail" label="Support email" error={errors.supportEmail?.message}>
            <Input {...fieldAria("supportEmail", errors.supportEmail?.message)} type="email" {...form.register("supportEmail")} />
          </Field>
          <Field id="defaultTemplate" label="Default template for new businesses" error={errors.defaultTemplate?.message}>
            <NativeSelect {...fieldAria("defaultTemplate", errors.defaultTemplate?.message)} {...form.register("defaultTemplate")}>
              {enabledTemplates.map((key) => (
                <option key={key} value={key}>
                  {TEMPLATES[key].label}
                </option>
              ))}
            </NativeSelect>
          </Field>
        </CardContent>
        <CardFooter className="justify-end border-t">
          <Button type="submit" disabled={isSubmitting || !isDirty}>
            {isSubmitting ? <Loader2 className="animate-spin" /> : null} Save
          </Button>
        </CardFooter>
      </Card>
    </form>
  );
}
