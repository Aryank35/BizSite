import { AlertTriangle, ExternalLink, Eye, LayoutList, Palette } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { PageHeader } from "@/components/app/page-header";
import { StatusBadge } from "@/components/app/status-badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { formatDateTime } from "@/lib/format";
import { publicSiteUrl } from "@/lib/site-url";
import { TEMPLATES } from "@/lib/website/theme";
import { requireTenant } from "@/server/session";
import { getWebsiteOverview } from "@/server/services/website";
import { PublishControls } from "./publish-controls";

export const metadata: Metadata = { title: "Website" };

export default async function WebsitePage() {
  const ctx = await requireTenant();
  const site = await getWebsiteOverview(ctx);
  const liveUrl = publicSiteUrl(site.slug);

  return (
    <>
      <PageHeader
        title="Website"
        description="Edit your draft freely — visitors only see changes after you publish."
        actions={
          <>
            <Button asChild variant="outline">
              <a href={`/preview/${ctx.businessId}`} target="_blank" rel="noreferrer">
                <Eye /> Preview draft
              </a>
            </Button>
            {site.isLive ? (
              <Button asChild variant="outline">
                <a href={`/site/${site.slug}`} target="_blank" rel="noreferrer">
                  <ExternalLink /> View live site
                </a>
              </Button>
            ) : null}
          </>
        }
      />

      <Card>
        <CardHeader>
          <CardTitle className="flex flex-wrap items-center gap-3">
            Publication <StatusBadge status={site.isLive ? "LIVE" : "OFFLINE"} />
            {site.hasUnpublishedChanges && site.hasPublishedVersion ? (
              <span className="rounded-full bg-amber-50 px-2 py-0.5 text-xs font-medium text-amber-800 ring-1 ring-amber-600/20 ring-inset">
                Unpublished changes
              </span>
            ) : null}
          </CardTitle>
          <CardDescription>
            {site.isLive ? (
              <>
                Live at{" "}
                <a href={`/site/${site.slug}`} target="_blank" rel="noreferrer" className="font-medium text-foreground hover:underline">
                  {liveUrl}
                </a>
                {site.lastPublishedAt ? ` · last published ${formatDateTime(site.lastPublishedAt)}` : ""}
              </>
            ) : site.hasPublishedVersion ? (
              "Your website is currently offline. Publishing makes the current draft live again."
            ) : (
              "Your website has not been published yet."
            )}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {site.draftErrors.length > 0 ? (
            <div className="flex gap-3 rounded-lg border border-destructive/30 bg-destructive/5 p-4 text-sm">
              <AlertTriangle className="mt-0.5 size-4 shrink-0 text-destructive" aria-hidden />
              <div>
                <p className="font-medium">Fix these before publishing:</p>
                <ul className="mt-1 list-disc pl-5 text-muted-foreground">
                  {site.draftErrors.map((e) => (
                    <li key={e}>{e}</li>
                  ))}
                </ul>
              </div>
            </div>
          ) : null}
          <PublishControls
            canPublish={site.canPublish}
            isLive={site.isLive}
            hasChanges={site.hasUnpublishedChanges}
            hasErrors={site.draftErrors.length > 0}
            blockedReason={
              site.canPublish
                ? null
                : site.allowSelfPublish
                  ? "Only the business owner can publish the website."
                  : "Publishing is managed by your platform administrator. Ask them to publish your changes."
            }
          />
        </CardContent>
      </Card>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Palette className="size-4" /> Appearance
            </CardTitle>
            <CardDescription>Template: {TEMPLATES[site.template].label}. Colours, fonts, logo, menu, footer and SEO.</CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild variant="outline">
              <Link href="/dashboard/website/appearance">Edit appearance</Link>
            </Button>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <LayoutList className="size-4" /> Homepage sections
            </CardTitle>
            <CardDescription>Turn sections on or off, change their order and edit their text and images.</CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild variant="outline">
              <Link href="/dashboard/website/sections">Edit sections</Link>
            </Button>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Publishing history</CardTitle>
          <CardDescription>Every publish stores the exact version that went live.</CardDescription>
        </CardHeader>
        <CardContent>
          {site.history.length === 0 ? (
            <p className="text-sm text-muted-foreground">Nothing has been published yet.</p>
          ) : (
            <ol className="divide-y text-sm">
              {site.history.map((h, index) => (
                <li key={h.id} className="flex justify-between gap-4 py-2.5">
                  <span>
                    {formatDateTime(h.createdAt)}
                    {index === 0 && site.isLive ? <span className="ml-2 text-xs font-medium text-emerald-700">current</span> : null}
                  </span>
                  <span className="text-muted-foreground">{h.publishedBy?.name ?? "Unknown"}</span>
                </li>
              ))}
            </ol>
          )}
        </CardContent>
      </Card>
    </>
  );
}
