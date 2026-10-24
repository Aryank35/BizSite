"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2 } from "lucide-react";
import { Controller, useForm, useWatch } from "react-hook-form";
import { applyResult } from "@/components/forms/apply-result";
import { Field, fieldAria } from "@/components/forms/field";
import { ImageUpload } from "@/components/media/image-upload";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { WEEKDAYS } from "@/lib/constants";
import { SOCIAL_NETWORKS, businessProfileSchema, type BusinessProfileInput } from "@/lib/validators/business";
import { updateProfileAction } from "../actions";

const SOCIAL_LABELS: Record<(typeof SOCIAL_NETWORKS)[number], string> = {
  website: "Other website",
  facebook: "Facebook",
  instagram: "Instagram",
  linkedin: "LinkedIn",
  youtube: "YouTube",
  x: "X (Twitter)",
};

export function ProfileForm({ defaults, canEdit }: { defaults: BusinessProfileInput; canEdit: boolean }) {
  const form = useForm<BusinessProfileInput>({ resolver: zodResolver(businessProfileSchema), defaultValues: defaults });
  const { errors, isSubmitting, isDirty } = form.formState;
  const hours = useWatch({ control: form.control, name: "openingHours" });

  async function onSubmit(values: BusinessProfileInput) {
    const result = await updateProfileAction(values);
    if (applyResult(result, { success: "Profile saved", setError: form.setError })) form.reset(values);
  }

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} noValidate className="space-y-6">
      {!canEdit ? (
        <p className="rounded-lg border bg-muted px-4 py-3 text-sm text-muted-foreground">
          Only the business owner can edit the profile. You can view it here.
        </p>
      ) : null}
      <fieldset disabled={!canEdit || isSubmitting} className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>About the business</CardTitle>
            <CardDescription>Name, logo and a short description shown across your website.</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-6 md:grid-cols-[1fr_14rem]">
            <div className="grid gap-5">
              <Field id="name" label="Business name" required error={errors.name?.message}>
                <Input {...fieldAria("name", errors.name?.message)} {...form.register("name")} />
              </Field>
              <Field id="description" label="Description" hint="Two or three sentences about what you sell and who you serve." error={errors.description?.message}>
                <Textarea {...fieldAria("description", errors.description?.message, true)} rows={5} {...form.register("description")} />
              </Field>
            </div>
            <Field id="logo" label="Logo" error={errors.logoUrl?.message}>
              <Controller
                control={form.control}
                name="logoUrl"
                render={({ field }) => <ImageUpload value={field.value} onChange={field.onChange} label="Upload logo" aspect="aspect-square" />}
              />
            </Field>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Contact & location</CardTitle>
            <CardDescription>How customers reach you. The WhatsApp number powers every WhatsApp button on your site.</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-5 sm:grid-cols-2">
            <Field id="email" label="Email" error={errors.email?.message}>
              <Input {...fieldAria("email", errors.email?.message)} type="email" {...form.register("email")} />
            </Field>
            <Field id="phone" label="Phone" error={errors.phone?.message}>
              <Input {...fieldAria("phone", errors.phone?.message)} type="tel" {...form.register("phone")} />
            </Field>
            <Field id="whatsappNumber" label="WhatsApp number" hint="Include the country code, e.g. +91 98765 43210." error={errors.whatsappNumber?.message}>
              <Input {...fieldAria("whatsappNumber", errors.whatsappNumber?.message, true)} type="tel" {...form.register("whatsappNumber")} />
            </Field>
            <Field id="addressLine" label="Street address" error={errors.addressLine?.message}>
              <Input {...fieldAria("addressLine", errors.addressLine?.message)} {...form.register("addressLine")} />
            </Field>
            <Field id="city" label="City" error={errors.city?.message}>
              <Input {...fieldAria("city", errors.city?.message)} {...form.register("city")} />
            </Field>
            <div className="grid grid-cols-2 gap-4">
              <Field id="state" label="State" error={errors.state?.message}>
                <Input {...fieldAria("state", errors.state?.message)} {...form.register("state")} />
              </Field>
              <Field id="postalCode" label="PIN code" error={errors.postalCode?.message}>
                <Input {...fieldAria("postalCode", errors.postalCode?.message)} inputMode="numeric" {...form.register("postalCode")} />
              </Field>
            </div>
          </CardContent>
        </Card>

        <div className="grid gap-6 lg:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Opening hours</CardTitle>
              <CardDescription>Shown in the contact section and footer.</CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2">
                {WEEKDAYS.map((day, index) => {
                  const closed = hours?.[index]?.closed;
                  return (
                    <li key={day} className="grid grid-cols-[6rem_auto_1fr] items-center gap-3 text-sm">
                      <span className="font-medium">{day}</span>
                      <Controller
                        control={form.control}
                        name={`openingHours.${index}.closed`}
                        render={({ field }) => (
                          <Switch
                            checked={!field.value}
                            onCheckedChange={(open) => field.onChange(!open)}
                            aria-label={`Open on ${day}`}
                          />
                        )}
                      />
                      {closed ? (
                        <span className="text-muted-foreground">Closed</span>
                      ) : (
                        <span className="flex items-center gap-2">
                          <Input type="time" className="w-28" aria-label={`${day} opens`} {...form.register(`openingHours.${index}.open`)} />
                          <span className="text-muted-foreground">to</span>
                          <Input type="time" className="w-28" aria-label={`${day} closes`} {...form.register(`openingHours.${index}.close`)} />
                        </span>
                      )}
                    </li>
                  );
                })}
              </ul>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Social links</CardTitle>
              <CardDescription>Full https:// links. Leave blank to hide.</CardDescription>
            </CardHeader>
            <CardContent className="grid gap-4">
              {SOCIAL_NETWORKS.map((network) => {
                const error = errors.socialLinks?.[network]?.message;
                return (
                  <Field key={network} id={`social-${network}`} label={SOCIAL_LABELS[network]} error={error}>
                    <Input {...fieldAria(`social-${network}`, error)} type="url" placeholder="https://" {...form.register(`socialLinks.${network}`)} />
                  </Field>
                );
              })}
            </CardContent>
          </Card>
        </div>
      </fieldset>

      {canEdit ? (
        <div className="sticky bottom-0 -mx-4 flex justify-end gap-2 border-t bg-background/95 px-4 py-3 backdrop-blur sm:-mx-6 sm:px-6">
          <Button type="button" variant="ghost" disabled={!isDirty || isSubmitting} onClick={() => form.reset()}>
            Discard changes
          </Button>
          <Button type="submit" disabled={!isDirty || isSubmitting}>
            {isSubmitting ? <Loader2 className="animate-spin" /> : null} Save profile
          </Button>
        </div>
      ) : null}
    </form>
  );
}
