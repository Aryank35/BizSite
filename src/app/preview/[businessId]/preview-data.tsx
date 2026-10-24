import "server-only";
import { AlertTriangle } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { cache } from "react";
import { NoticePage } from "@/components/app/notice-page";
import { Button } from "@/components/ui/button";
import type { SiteContext } from "@/components/site/site-context";
import { requireUser } from "@/server/session";
import { getPreviewSite } from "@/server/services/public-site";
import { resolveTenantContext } from "@/server/tenant";

/**
 * Draft preview, available only to super admins and members of this business.
 * A business id the user cannot access is reported as "not found".
 */
export const loadPreview = cache(async (businessId: string) => {
  const user = await requireUser();
  const tenant = await resolveTenantContext(user, businessId);
  if (!tenant || tenant.businessId !== businessId) notFound();
  const preview = await getPreviewSite(businessId);
  if (!preview) notFound();
  if (!preview.snapshot) return { ctx: null, errors: preview.errors };
  const ctx: SiteContext = {
    business: preview.business,
    snapshot: preview.snapshot,
    template: preview.snapshot.theme.template,
    basePath: `/preview/${businessId}`,
    mode: "preview",
  };
  return { ctx, errors: [] };
});

export function PreviewErrors({ errors }: { errors: string[] }) {
  return (
    <NoticePage
      icon={AlertTriangle}
      title="The draft cannot be previewed yet"
      actions={
        <Button asChild>
          <Link href="/dashboard/website/sections">Fix sections</Link>
        </Button>
      }
    >
      <ul className="list-disc space-y-1 pl-5 text-left">
        {errors.map((e) => (
          <li key={e}>{e}</li>
        ))}
      </ul>
    </NoticePage>
  );
}
