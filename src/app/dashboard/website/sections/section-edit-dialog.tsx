"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2, Pencil, Plus, X } from "lucide-react";
import { useState } from "react";
import { Controller, useFieldArray, useForm, type FieldValues, type Resolver, type UseFormReturn } from "react-hook-form";
import { applyResult } from "@/components/forms/apply-result";
import { Field } from "@/components/forms/field";
import { NativeSelect } from "@/components/forms/native-select";
import { GalleryUpload } from "@/components/media/gallery-upload";
import { ImageUpload } from "@/components/media/image-upload";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { FEATURE_ICONS, SECTION_DEFINITIONS, sectionEditSchema } from "@/lib/website/sections";
import { CTA_TARGETS } from "@/lib/website/theme";
import { updateSectionAction } from "../../actions";
import type { EditorSection } from "./sections-editor";

type Form = UseFormReturn<FieldValues>;

/** Stored JSON uses null for empty optional text; inputs need "". */
function nullsToEmpty(value: unknown): unknown {
  if (value === null) return "";
  if (Array.isArray(value)) return value.map(nullsToEmpty);
  if (value && typeof value === "object") return Object.fromEntries(Object.entries(value).map(([k, v]) => [k, nullsToEmpty(v)]));
  return value;
}

function errorAt(form: Form, path: string): string | undefined {
  const parts = path.split(".");
  let node: unknown = form.formState.errors;
  for (const part of parts) node = (node as Record<string, unknown> | undefined)?.[part];
  return (node as { message?: string } | undefined)?.message;
}

function TextInput({ form, name, label, hint, multiline, rows = 3 }: { form: Form; name: string; label: string; hint?: string; multiline?: boolean; rows?: number }) {
  const error = errorAt(form, name);
  const id = `section-${name.replaceAll(".", "-")}`;
  const aria = { id, "aria-invalid": error ? true : undefined };
  return (
    <Field id={id} label={label} hint={hint} error={error}>
      {multiline ? <Textarea {...aria} rows={rows} {...form.register(name)} /> : <Input {...aria} {...form.register(name)} />}
    </Field>
  );
}

function CtaSelect({ form, name, label, includeNone }: { form: Form; name: string; label: string; includeNone?: boolean }) {
  const id = `section-${name.replaceAll(".", "-")}`;
  return (
    <Field id={id} label={label}>
      <NativeSelect id={id} {...form.register(name)}>
        {includeNone ? <option value="NONE">No link</option> : null}
        {Object.entries(CTA_TARGETS).map(([value, label]) => (
          <option key={value} value={value}>
            {label}
          </option>
        ))}
      </NativeSelect>
    </Field>
  );
}

function SwitchField({ form, name, label }: { form: Form; name: string; label: string }) {
  const id = `section-${name.replaceAll(".", "-")}`;
  return (
    <Controller
      control={form.control}
      name={name}
      render={({ field }) => (
        <div className="flex items-center justify-between gap-4 rounded-lg border p-3">
          <label htmlFor={id} className="text-sm font-medium">
            {label}
          </label>
          <Switch id={id} checked={Boolean(field.value)} onCheckedChange={field.onChange} />
        </div>
      )}
    />
  );
}

function NumberSelect({ form, name, label, options }: { form: Form; name: string; label: string; options: number[] }) {
  const id = `section-${name.replaceAll(".", "-")}`;
  return (
    <Field id={id} label={label}>
      <NativeSelect id={id} {...form.register(name, { valueAsNumber: true })}>
        {options.map((n) => (
          <option key={n} value={n}>
            {n}
          </option>
        ))}
      </NativeSelect>
    </Field>
  );
}

function ReasonsEditor({ form }: { form: Form }) {
  const items = useFieldArray({ control: form.control, name: "content.items" });
  const listError = errorAt(form, "content.items");
  return (
    <div className="space-y-3">
      {items.fields.map((item, index) => (
        <div key={item.id} className="grid gap-3 rounded-lg border p-3">
          <div className="flex items-end gap-2">
            <Field id={`reason-icon-${index}`} label="Icon" className="w-36">
              <NativeSelect id={`reason-icon-${index}`} {...form.register(`content.items.${index}.icon`)}>
                {FEATURE_ICONS.map((icon) => (
                  <option key={icon} value={icon}>
                    {icon.replace("-", " ")}
                  </option>
                ))}
              </NativeSelect>
            </Field>
            <div className="flex-1">
              <TextInput form={form} name={`content.items.${index}.title`} label="Title" />
            </div>
            <Button type="button" size="icon-sm" variant="ghost" onClick={() => items.remove(index)} aria-label="Remove reason">
              <X />
            </Button>
          </div>
          <TextInput form={form} name={`content.items.${index}.description`} label="Description" multiline rows={2} />
        </div>
      ))}
      {listError ? <p className="text-xs text-destructive">{listError}</p> : null}
      {items.fields.length < 6 ? (
        <Button type="button" size="sm" variant="outline" onClick={() => items.append({ icon: "award", title: "", description: "" })}>
          <Plus /> Add reason
        </Button>
      ) : null}
    </div>
  );
}

function TestimonialsEditor({ form }: { form: Form }) {
  const items = useFieldArray({ control: form.control, name: "content.items" });
  return (
    <div className="space-y-3">
      {items.fields.length === 0 ? <p className="text-sm text-muted-foreground">No testimonials yet. The section stays hidden until you add one.</p> : null}
      {items.fields.map((item, index) => (
        <div key={item.id} className="grid gap-3 rounded-lg border p-3">
          <div className="flex items-start gap-2">
            <div className="flex-1">
              <TextInput form={form} name={`content.items.${index}.quote`} label="Quote" multiline rows={2} />
            </div>
            <Button type="button" size="icon-sm" variant="ghost" onClick={() => items.remove(index)} aria-label="Remove testimonial">
              <X />
            </Button>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <TextInput form={form} name={`content.items.${index}.author`} label="Customer name" />
            <TextInput form={form} name={`content.items.${index}.role`} label="Location or role (optional)" />
          </div>
        </div>
      ))}
      {items.fields.length < 6 ? (
        <Button type="button" size="sm" variant="outline" onClick={() => items.append({ quote: "", author: "", role: "" })}>
          <Plus /> Add testimonial
        </Button>
      ) : null}
    </div>
  );
}

function ContentFields({ type, form }: { type: EditorSection["type"]; form: Form }) {
  switch (type) {
    case "ANNOUNCEMENT_BAR":
      return (
        <>
          <TextInput form={form} name="content.text" label="Announcement" />
          <div className="grid gap-3 sm:grid-cols-2">
            <TextInput form={form} name="content.linkLabel" label="Link text (optional)" />
            <CtaSelect form={form} name="content.linkTarget" label="Link opens" includeNone />
          </div>
        </>
      );
    case "HERO":
      return (
        <div className="grid gap-3 sm:grid-cols-2">
          <TextInput form={form} name="content.primaryCtaLabel" label="Main button label" />
          <CtaSelect form={form} name="content.primaryCtaTarget" label="Main button opens" />
          <TextInput form={form} name="content.secondaryCtaLabel" label="Second button label (optional)" />
          <CtaSelect form={form} name="content.secondaryCtaTarget" label="Second button opens" />
        </div>
      );
    case "ABOUT":
      return (
        <>
          <TextInput form={form} name="content.body" label="About text" multiline rows={6} />
          <Controller
            control={form.control}
            name="content.highlights"
            render={({ field }) => (
              <Field id="section-highlights" label="Highlights" hint="One per line, up to four." error={errorAt(form, "content.highlights")}>
                <Textarea
                  id="section-highlights"
                  rows={4}
                  value={(field.value as string[]).join("\n")}
                  onChange={(e) => field.onChange(e.target.value.split("\n"))}
                  onBlur={() => field.onChange((field.value as string[]).map((l) => l.trim()).filter(Boolean))}
                />
              </Field>
            )}
          />
        </>
      );
    case "FEATURED_PRODUCTS":
      return <NumberSelect form={form} name="content.limit" label="Number of products" options={[3, 6, 9, 12]} />;
    case "CATALOGUE":
      return <NumberSelect form={form} name="content.limit" label="Number of products" options={[4, 8, 12, 16, 24]} />;
    case "CATEGORIES":
      return <SwitchField form={form} name="content.showDescriptions" label="Show category descriptions" />;
    case "WHY_CHOOSE_US":
      return <ReasonsEditor form={form} />;
    case "GALLERY":
      return (
        <Controller
          control={form.control}
          name="content.images"
          render={({ field }) => <GalleryUpload value={field.value} onChange={field.onChange} max={12} />}
        />
      );
    case "TESTIMONIALS":
      return <TestimonialsEditor form={form} />;
    case "CONTACT_INFO":
      return (
        <div className="grid gap-2 sm:grid-cols-2">
          <SwitchField form={form} name="content.showAddress" label="Address" />
          <SwitchField form={form} name="content.showPhone" label="Phone" />
          <SwitchField form={form} name="content.showEmail" label="Email" />
          <SwitchField form={form} name="content.showHours" label="Opening hours" />
        </div>
      );
    case "WHATSAPP_CTA":
      return (
        <>
          <TextInput form={form} name="content.buttonLabel" label="Button label" />
          <TextInput form={form} name="content.prefilledMessage" label="Pre-filled message" hint="The text a visitor's WhatsApp opens with." multiline rows={2} />
        </>
      );
    case "ENQUIRY_FORM":
      return (
        <>
          <TextInput form={form} name="content.submitLabel" label="Button label" />
          <TextInput form={form} name="content.successMessage" label="Message after sending" multiline rows={2} />
        </>
      );
    default:
      return null;
  }
}

export function SectionEditDialog({ section }: { section: EditorSection }) {
  const [open, setOpen] = useState(false);
  const def = SECTION_DEFINITIONS[section.type];
  const defaults = () => ({
    title: section.title ?? "",
    subtitle: section.subtitle ?? "",
    imageUrl: section.imageUrl,
    imageAlt: section.imageAlt ?? "",
    content: nullsToEmpty(section.content),
  });
  const form = useForm<FieldValues>({
    resolver: zodResolver(sectionEditSchema(section.type)) as unknown as Resolver<FieldValues>,
    defaultValues: defaults(),
  });

  async function onSubmit(values: FieldValues) {
    const result = await updateSectionAction(section.type, values);
    if (applyResult(result, { success: `${def.label} saved to draft`, setError: form.setError })) setOpen(false);
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        setOpen(next);
        if (next) form.reset(defaults());
      }}
    >
      <DialogTrigger asChild>
        <Button size="sm" variant="ghost" aria-label={`Edit ${def.label}`}>
          <Pencil /> <span className="hidden sm:inline">Edit</span>
        </Button>
      </DialogTrigger>
      <DialogContent className="max-h-[90svh] overflow-y-auto sm:max-w-2xl">
        <form onSubmit={form.handleSubmit(onSubmit)} noValidate className="space-y-5">
          <DialogHeader>
            <DialogTitle>{def.label}</DialogTitle>
            <DialogDescription>{def.description}</DialogDescription>
          </DialogHeader>
          {def.fields.title ? <TextInput form={form} name="title" label="Heading" /> : null}
          {def.fields.subtitle ? <TextInput form={form} name="subtitle" label="Subheading" multiline rows={2} /> : null}
          {def.fields.image ? (
            <div className="grid gap-4 sm:grid-cols-[14rem_1fr]">
              <Field id="section-image" label="Image" error={errorAt(form, "imageUrl")}>
                <Controller
                  control={form.control}
                  name="imageUrl"
                  render={({ field }) => <ImageUpload value={field.value} onChange={field.onChange} aspect="aspect-[4/3]" />}
                />
              </Field>
              <TextInput form={form} name="imageAlt" label="Image description" hint="Describes the image for screen readers and search engines." />
            </div>
          ) : null}
          <ContentFields type={section.type} form={form} />
          <DialogFooter>
            <Button type="button" variant="ghost" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={form.formState.isSubmitting}>
              {form.formState.isSubmitting ? <Loader2 className="animate-spin" /> : null} Save to draft
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
