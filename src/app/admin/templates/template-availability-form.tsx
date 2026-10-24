"use client";

import { Loader2 } from "lucide-react";
import { useState, useTransition } from "react";
import { applyResult } from "@/components/forms/apply-result";
import { TemplateThumbnail } from "@/components/site/template-thumbnail";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Switch } from "@/components/ui/switch";
import { SECTION_DEFINITIONS, SECTION_TYPES, type SectionType } from "@/lib/website/sections";
import { TEMPLATES, TEMPLATE_KEYS, type TemplateKey } from "@/lib/website/theme";
import { updateTemplateAvailabilityAction } from "../actions";

const STRUCTURAL: SectionType[] = ["HEADER", "FOOTER"];

export function TemplateAvailabilityForm({
  enabledTemplates,
  enabledSectionTypes,
  usage,
}: {
  enabledTemplates: TemplateKey[];
  enabledSectionTypes: SectionType[];
  usage: Record<string, number>;
}) {
  const [templates, setTemplates] = useState(new Set(enabledTemplates));
  const [sections, setSections] = useState(new Set(enabledSectionTypes));
  const [pending, startTransition] = useTransition();

  function toggle<T>(set: Set<T>, value: T, on: boolean) {
    const next = new Set(set);
    if (on) next.add(value);
    else next.delete(value);
    return next;
  }

  function save() {
    startTransition(async () => {
      const result = await updateTemplateAvailabilityAction({
        enabledTemplates: [...templates],
        enabledSectionTypes: [...sections],
      });
      applyResult(result, { success: "Availability saved" });
    });
  }

  return (
    <div className="space-y-6">
      <div className="grid gap-6 md:grid-cols-2">
        {TEMPLATE_KEYS.map((key) => (
          <Card key={key}>
            <CardHeader className="flex flex-row items-start justify-between gap-4">
              <div className="space-y-1.5">
                <CardTitle>{TEMPLATES[key].label}</CardTitle>
                <CardDescription>{TEMPLATES[key].description}</CardDescription>
              </div>
              <Switch
                checked={templates.has(key)}
                onCheckedChange={(on) => setTemplates((s) => toggle(s, key, on))}
                aria-label={`Enable ${TEMPLATES[key].label}`}
              />
            </CardHeader>
            <CardContent className="space-y-3">
              <TemplateThumbnail template={key} />
              <p className="text-sm text-muted-foreground">Used by {usage[key] ?? 0} business websites.</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Homepage sections</CardTitle>
          <CardDescription>Header and footer are always available.</CardDescription>
        </CardHeader>
        <CardContent>
          <ul className="grid gap-3 sm:grid-cols-2">
            {SECTION_TYPES.map((type) => {
              const fixed = STRUCTURAL.includes(type);
              return (
                <li key={type} className="flex items-start gap-3 rounded-lg border p-3">
                  <Checkbox
                    id={`section-${type}`}
                    checked={fixed || sections.has(type)}
                    disabled={fixed}
                    onCheckedChange={(on) => setSections((s) => toggle(s, type, on === true))}
                    className="mt-0.5"
                  />
                  <label htmlFor={`section-${type}`} className="grid gap-0.5">
                    <span className="text-sm font-medium">{SECTION_DEFINITIONS[type].label}</span>
                    <span className="text-xs text-muted-foreground">{SECTION_DEFINITIONS[type].description}</span>
                  </label>
                </li>
              );
            })}
          </ul>
        </CardContent>
        <CardFooter className="justify-end border-t">
          <Button onClick={save} disabled={pending || templates.size === 0}>
            {pending ? <Loader2 className="animate-spin" /> : null} Save availability
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
