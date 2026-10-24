"use client";

import { ArrowDown, ArrowUp, Lock, Pencil } from "lucide-react";
import Link from "next/link";
import { useTransition } from "react";
import { applyResult } from "@/components/forms/apply-result";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { cn } from "@/lib/utils";
import { SECTION_DEFINITIONS, type Placement, type SectionType } from "@/lib/website/sections";
import { moveSectionAction, setSectionVisibilityAction } from "../../actions";
import { SectionEditDialog } from "./section-edit-dialog";

export type EditorSection = {
  type: SectionType;
  title: string | null;
  subtitle: string | null;
  imageUrl: string | null;
  imageAlt: string | null;
  content: Record<string, unknown>;
  isVisible: boolean;
  placement: Placement;
};

/** Sections configured on the Appearance page rather than in a dialog. */
const CONFIGURED_IN_APPEARANCE: SectionType[] = ["HEADER", "FOOTER"];

export function SectionsEditor({ sections }: { sections: EditorSection[] }) {
  const [pending, startTransition] = useTransition();
  const body = sections.filter((s) => s.placement === "body");

  const run = (fn: () => ReturnType<typeof moveSectionAction>, success?: string) =>
    startTransition(async () => {
      applyResult(await fn(), { success });
    });

  return (
    <Card className="py-0">
      <ol className="divide-y">
        {sections.map((section) => {
          const def = SECTION_DEFINITIONS[section.type];
          const bodyIndex = body.findIndex((s) => s.type === section.type);
          return (
            <li key={section.type} className={cn("flex flex-wrap items-center gap-3 px-4 py-3", !section.isVisible && "bg-muted/40")}>
              <div className="flex w-16 shrink-0 gap-0.5">
                {section.placement === "body" ? (
                  <>
                    <Button
                      size="icon-sm"
                      variant="ghost"
                      disabled={pending || bodyIndex === 0}
                      onClick={() => run(() => moveSectionAction(section.type, "up"))}
                      aria-label={`Move ${def.label} up`}
                    >
                      <ArrowUp />
                    </Button>
                    <Button
                      size="icon-sm"
                      variant="ghost"
                      disabled={pending || bodyIndex === body.length - 1}
                      onClick={() => run(() => moveSectionAction(section.type, "down"))}
                      aria-label={`Move ${def.label} down`}
                    >
                      <ArrowDown />
                    </Button>
                  </>
                ) : (
                  <span className="flex size-7 items-center justify-center text-muted-foreground" title="Fixed position">
                    <Lock className="size-3.5" aria-label="Fixed position" />
                  </span>
                )}
              </div>
              <div className="min-w-0 flex-1">
                <p className={cn("font-medium", !section.isVisible && "text-muted-foreground")}>{def.label}</p>
                <p className="truncate text-sm text-muted-foreground">{section.title ?? def.description}</p>
              </div>
              {CONFIGURED_IN_APPEARANCE.includes(section.type) ? (
                <Button asChild size="sm" variant="ghost">
                  <Link href="/dashboard/website/appearance">
                    <Pencil /> Appearance
                  </Link>
                </Button>
              ) : (
                <SectionEditDialog section={section} />
              )}
              <Switch
                checked={section.isVisible}
                disabled={pending}
                onCheckedChange={(visible) =>
                  run(() => setSectionVisibilityAction(section.type, visible), visible ? `${def.label} shown` : `${def.label} hidden`)
                }
                aria-label={`Show ${def.label}`}
              />
            </li>
          );
        })}
      </ol>
    </Card>
  );
}
