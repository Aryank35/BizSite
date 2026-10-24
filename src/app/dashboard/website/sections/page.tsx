import { Eye } from "lucide-react";
import type { Metadata } from "next";
import { PageHeader } from "@/components/app/page-header";
import { Button } from "@/components/ui/button";
import { requireTenant } from "@/server/session";
import { listSectionsForEditor } from "@/server/services/website";
import { SectionsEditor } from "./sections-editor";

export const metadata: Metadata = { title: "Homepage sections" };

export default async function SectionsPage() {
  const ctx = await requireTenant();
  const sections = await listSectionsForEditor(ctx);
  return (
    <>
      <PageHeader
        title="Homepage sections"
        description="Switch sections on or off, reorder them and edit their content. Changes are saved to your draft until you publish."
        actions={
          <Button asChild variant="outline">
            <a href={`/preview/${ctx.businessId}`} target="_blank" rel="noreferrer">
              <Eye /> Preview draft
            </a>
          </Button>
        }
      />
      <SectionsEditor
        sections={sections.map((s) => ({
          type: s.type,
          title: s.title,
          subtitle: s.subtitle,
          imageUrl: s.imageUrl,
          imageAlt: s.imageAlt,
          content: s.content as Record<string, unknown>,
          isVisible: s.isVisible,
          placement: s.placement,
        }))}
      />
    </>
  );
}
