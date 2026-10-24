"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowDown, ArrowUp, Loader2, Plus, X } from "lucide-react";
import Link from "next/link";
import { Controller, useFieldArray, useForm, useWatch, type Control, type FieldPath } from "react-hook-form";
import { applyResult } from "@/components/forms/apply-result";
import { Field, fieldAria } from "@/components/forms/field";
import { NativeSelect } from "@/components/forms/native-select";
import { ImageUpload } from "@/components/media/image-upload";
import { TemplateThumbnail } from "@/components/site/template-thumbnail";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import {
  CTA_TARGETS,
  NAV_TARGETS,
  SITE_FONTS,
  TEMPLATES,
  readableTextColor,
  themeSchema,
  type TemplateKey,
  type ThemeInput,
} from "@/lib/website/theme";
import { updateAppearanceAction } from "../../actions";

function ToggleRow({ control, name, label, hint }: { control: Control<ThemeInput>; name: FieldPath<ThemeInput>; label: string; hint?: string }) {
  return (
    <Controller
      control={control}
      name={name}
      render={({ field }) => (
        <div className="flex items-start justify-between gap-4 rounded-lg border p-3">
          <div>
            <label htmlFor={name} className="text-sm font-medium">
              {label}
            </label>
            {hint ? <p className="text-xs text-muted-foreground">{hint}</p> : null}
          </div>
          <Switch id={name} checked={Boolean(field.value)} onCheckedChange={field.onChange} />
        </div>
      )}
    />
  );
}

const COLOURS = [
  { name: "primaryColor", label: "Primary", hint: "Buttons, links and highlights." },
  { name: "secondaryColor", label: "Secondary", hint: "Footer and dark bands." },
  { name: "accentColor", label: "Accent", hint: "Announcement bar and small details." },
] as const;

export function AppearanceForm({
  defaults,
  enabledTemplates,
  businessName,
  logoUrl,
}: {
  defaults: ThemeInput;
  enabledTemplates: TemplateKey[];
  businessName: string;
  logoUrl: string | null;
}) {
  const form = useForm<ThemeInput>({ resolver: zodResolver(themeSchema), defaultValues: defaults });
  const { errors, isSubmitting, isDirty } = form.formState;
  const nav = useFieldArray({ control: form.control, name: "navigationSettings.items" });
  const [primary, secondary, accent, template] = useWatch({
    control: form.control,
    name: ["primaryColor", "secondaryColor", "accentColor", "template"],
  });
  const validHex = (v: string, fallback: string) => (/^#[0-9a-fA-F]{6}$/.test(v) ? v : fallback);
  const p = validHex(primary, "#1f4d3a");
  const s = validHex(secondary, "#13231b");
  const a = validHex(accent, "#d97706");

  async function onSubmit(values: ThemeInput) {
    const result = await updateAppearanceAction(values);
    if (applyResult(result, { success: "Draft saved. Publish when you are ready.", setError: form.setError })) form.reset(values);
  }

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} noValidate className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Template</CardTitle>
          <CardDescription>The overall layout and style of your website.</CardDescription>
        </CardHeader>
        <CardContent>
          <Controller
            control={form.control}
            name="template"
            render={({ field }) => (
              <div role="radiogroup" aria-label="Template" className="grid gap-4 sm:grid-cols-2">
                {enabledTemplates.map((key) => {
                  const selected = field.value === key;
                  return (
                    <button
                      key={key}
                      type="button"
                      role="radio"
                      aria-checked={selected}
                      onClick={() => field.onChange(key)}
                      className={cn(
                        "space-y-3 rounded-xl border p-3 text-left transition focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none",
                        selected ? "border-primary ring-2 ring-primary/30" : "hover:border-foreground/30",
                      )}
                    >
                      <TemplateThumbnail template={key} primary={p} accent={a} />
                      <div>
                        <p className="font-medium">{TEMPLATES[key].label}</p>
                        <p className="text-sm text-muted-foreground">{TEMPLATES[key].description}</p>
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Colours & font</CardTitle>
          <CardDescription>Text colour on buttons is chosen automatically for readability.</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-8 lg:grid-cols-[1fr_18rem]">
          <div className="grid gap-6">
            <div className="grid gap-4 sm:grid-cols-3">
              {COLOURS.map((c) => {
                const error = errors[c.name]?.message;
                return (
                  <Field key={c.name} id={c.name} label={c.label} hint={c.hint} error={error}>
                    <Controller
                      control={form.control}
                      name={c.name}
                      render={({ field }) => (
                        <div className="flex gap-2">
                          <input
                            type="color"
                            aria-label={`${c.label} colour picker`}
                            value={validHex(field.value, "#000000")}
                            onChange={(e) => field.onChange(e.target.value)}
                            className="h-8 w-10 cursor-pointer rounded-md border bg-background p-0.5"
                          />
                          <Input {...fieldAria(c.name, error, true)} value={field.value} onChange={field.onChange} onBlur={field.onBlur} className="font-mono" />
                        </div>
                      )}
                    />
                  </Field>
                );
              })}
            </div>
            <Controller
              control={form.control}
              name="fontFamily"
              render={({ field }) => (
                <fieldset className="grid gap-2">
                  <legend className="mb-1 text-sm font-medium">Heading font</legend>
                  <div className="grid gap-2 sm:grid-cols-2">
                    {Object.entries(SITE_FONTS).map(([key, font]) => (
                      <label
                        key={key}
                        className={cn(
                          "flex cursor-pointer items-center gap-3 rounded-lg border p-3 text-sm has-[:checked]:border-primary has-[:checked]:bg-accent/50",
                        )}
                      >
                        <input type="radio" name={field.name} value={key} checked={field.value === key} onChange={() => field.onChange(key)} className="accent-primary" />
                        <span>
                          <span className="block font-medium">{font.label}</span>
                          <span className="text-xs text-muted-foreground">{font.sample}</span>
                        </span>
                      </label>
                    ))}
                  </div>
                </fieldset>
              )}
            />
          </div>
          <div aria-hidden className="overflow-hidden rounded-xl border text-sm shadow-sm">
            <div className="flex items-center justify-between px-3 py-2" style={{ background: template === "PROFESSIONAL_BUSINESS" ? s : "#fff", color: template === "PROFESSIONAL_BUSINESS" ? readableTextColor(s) : "#111" }}>
              <span className="truncate font-semibold">{businessName}</span>
              <span className="rounded-full px-2 py-0.5 text-xs font-semibold" style={{ background: p, color: readableTextColor(p) }}>
                Enquire
              </span>
            </div>
            <div className="space-y-2 px-3 py-6" style={{ background: `color-mix(in oklab, ${p} 8%, white)` }}>
              <p className="font-semibold text-neutral-900">Your headline here</p>
              <span className="inline-block rounded-full px-3 py-1 text-xs font-semibold" style={{ background: p, color: readableTextColor(p) }}>
                View products
              </span>
            </div>
            <div className="px-3 py-1.5 text-center text-xs font-medium" style={{ background: a, color: readableTextColor(a) }}>
              Announcement
            </div>
            <div className="px-3 py-3 text-xs" style={{ background: s, color: readableTextColor(s) }}>
              Footer · {businessName}
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Logo</CardTitle>
            <CardDescription>
              {logoUrl ? "Your logo is set in the business profile." : (
                <>
                  No logo yet — <Link href="/dashboard/profile" className="font-medium text-foreground hover:underline">upload one in your profile</Link>.
                </>
              )}
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-3">
            <ToggleRow control={form.control} name="logoSettings.showLogo" label="Show logo in the header" />
            <ToggleRow control={form.control} name="logoSettings.showName" label="Show business name next to the logo" />
            <Field id="logo-size" label="Logo size">
              <NativeSelect id="logo-size" {...form.register("logoSettings.size")}>
                <option value="sm">Small</option>
                <option value="md">Medium</option>
                <option value="lg">Large</option>
              </NativeSelect>
            </Field>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Footer</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-3">
            <Field id="tagline" label="Tagline" error={errors.footerSettings?.tagline?.message}>
              <Input {...fieldAria("tagline", errors.footerSettings?.tagline?.message)} {...form.register("footerSettings.tagline")} />
            </Field>
            <ToggleRow control={form.control} name="footerSettings.showAddress" label="Show address" />
            <ToggleRow control={form.control} name="footerSettings.showOpeningHours" label="Show opening hours" />
            <ToggleRow control={form.control} name="footerSettings.showSocialLinks" label="Show social links" />
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Header & menu</CardTitle>
          <CardDescription>Up to six menu links, plus an optional call-to-action button.</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-6 lg:grid-cols-2">
          <div className="space-y-3">
            <ul className="space-y-2">
              {nav.fields.map((item, index) => {
                const error = errors.navigationSettings?.items?.[index]?.label?.message;
                return (
                  <li key={item.id} className="flex items-start gap-2">
                    <div className="grid flex-1 gap-1">
                      <Input aria-label={`Menu link ${index + 1} label`} aria-invalid={error ? true : undefined} {...form.register(`navigationSettings.items.${index}.label`)} />
                      {error ? <p className="text-xs text-destructive">{error}</p> : null}
                    </div>
                    <NativeSelect aria-label={`Menu link ${index + 1} destination`} className="w-36" {...form.register(`navigationSettings.items.${index}.target`)}>
                      {Object.entries(NAV_TARGETS).map(([value, label]) => (
                        <option key={value} value={value}>
                          {label}
                        </option>
                      ))}
                    </NativeSelect>
                    <Button type="button" size="icon-sm" variant="ghost" disabled={index === 0} onClick={() => nav.move(index, index - 1)} aria-label="Move link up">
                      <ArrowUp />
                    </Button>
                    <Button type="button" size="icon-sm" variant="ghost" disabled={index === nav.fields.length - 1} onClick={() => nav.move(index, index + 1)} aria-label="Move link down">
                      <ArrowDown />
                    </Button>
                    <Button type="button" size="icon-sm" variant="ghost" onClick={() => nav.remove(index)} aria-label="Remove link">
                      <X />
                    </Button>
                  </li>
                );
              })}
            </ul>
            {nav.fields.length < 6 ? (
              <Button type="button" variant="outline" size="sm" onClick={() => nav.append({ label: "Products", target: "PRODUCTS" })}>
                <Plus /> Add link
              </Button>
            ) : null}
          </div>
          <div className="grid content-start gap-4">
            <ToggleRow control={form.control} name="navigationSettings.sticky" label="Keep the header visible while scrolling" />
            <div className="grid grid-cols-2 gap-3">
              <Field id="ctaLabel" label="Button label" hint="Leave blank for no button." error={errors.navigationSettings?.ctaLabel?.message}>
                <Input {...fieldAria("ctaLabel", errors.navigationSettings?.ctaLabel?.message, true)} {...form.register("navigationSettings.ctaLabel")} />
              </Field>
              <Field id="ctaTarget" label="Button opens">
                <NativeSelect id="ctaTarget" {...form.register("navigationSettings.ctaTarget")}>
                  {Object.entries(CTA_TARGETS).map(([value, label]) => (
                    <option key={value} value={value}>
                      {label}
                    </option>
                  ))}
                </NativeSelect>
              </Field>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Search & sharing</CardTitle>
          <CardDescription>How your homepage appears in search results and when shared on social media.</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-6 md:grid-cols-[1fr_16rem]">
          <div className="grid content-start gap-4">
            <Field id="seoTitle" label="Page title" hint="Defaults to your business name. Up to 70 characters." error={errors.seoSettings?.title?.message}>
              <Input {...fieldAria("seoTitle", errors.seoSettings?.title?.message, true)} maxLength={70} {...form.register("seoSettings.title")} />
            </Field>
            <Field id="seoDescription" label="Description" hint="Up to 160 characters." error={errors.seoSettings?.description?.message}>
              <Textarea {...fieldAria("seoDescription", errors.seoSettings?.description?.message, true)} rows={3} maxLength={160} {...form.register("seoSettings.description")} />
            </Field>
          </div>
          <Field id="ogImage" label="Sharing image" hint="Defaults to your logo.">
            <Controller
              control={form.control}
              name="seoSettings.ogImageUrl"
              render={({ field }) => <ImageUpload value={field.value} onChange={field.onChange} aspect="aspect-[1.91/1]" />}
            />
          </Field>
        </CardContent>
      </Card>

      <div className="sticky bottom-0 -mx-4 flex justify-end gap-2 border-t bg-background/95 px-4 py-3 backdrop-blur sm:-mx-6 sm:px-6">
        <Button type="button" variant="ghost" disabled={!isDirty || isSubmitting} onClick={() => form.reset()}>
          Discard changes
        </Button>
        <Button type="submit" disabled={!isDirty || isSubmitting}>
          {isSubmitting ? <Loader2 className="animate-spin" /> : null} Save draft
        </Button>
      </div>
    </form>
  );
}
