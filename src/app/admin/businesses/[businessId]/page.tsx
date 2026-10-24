import { ExternalLink, Eye, LayoutDashboard } from "lucide-react";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { PageHeader } from "@/components/app/page-header";
import { StatusBadge } from "@/components/app/status-badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { categoryLabel } from "@/lib/constants";
import { formatDate, formatDateTime } from "@/lib/format";
import { NotFoundError } from "@/server/errors";
import { requireSuperAdmin } from "@/server/session";
import { getBusinessForAdmin } from "@/server/services/businesses";
import { manageBusinessAction } from "../../actions";
import { AdministratorsPanel, DangerZone, PlatformSettingsForm, WebsitePublishPanel } from "./panels";

export const metadata: Metadata = { title: "Business" };

export default async function AdminBusinessPage(props: PageProps<"/admin/businesses/[businessId]">) {
  await requireSuperAdmin();
  const { businessId } = await props.params;
  const business = await getBusinessForAdmin(businessId).catch((error) => {
    if (error instanceof NotFoundError) notFound();
    throw error;
  });

  const isLive = business.status === "ACTIVE" && business.publishedAt !== null;
  const manage = manageBusinessAction.bind(null, business.id, "dashboard");
  const preview = manageBusinessAction.bind(null, business.id, "preview");

  return (
    <>
      <PageHeader
        title={business.name}
        description={
          <span className="flex flex-wrap items-center gap-2">
            <StatusBadge status={business.status} />
            <StatusBadge status={isLive ? "LIVE" : "OFFLINE"} />
            <span>
              {categoryLabel(business.category)} · /site/{business.slug} · created {formatDate(business.createdAt)}
            </span>
          </span>
        }
        actions={
          <>
            {isLive ? (
              <Button asChild variant="outline">
                <a href={`/site/${business.slug}`} target="_blank" rel="noreferrer">
                  <ExternalLink /> View live site
                </a>
              </Button>
            ) : null}
            <form action={preview}>
              <Button type="submit" variant="outline">
                <Eye /> Preview draft
              </Button>
            </form>
            <form action={manage}>
              <Button type="submit">
                <LayoutDashboard /> Manage content
              </Button>
            </form>
          </>
        }
      />

      <div className="grid gap-4 sm:grid-cols-4">
        {[
          ["Products", `${business.publishedProducts} / ${business._count.products}`, "published / total"],
          ["Categories", business._count.categories, null],
          ["Enquiries", business._count.enquiries, `${business.newEnquiries} new`],
          ["Last published", business.websiteConfig?.lastPublishedAt ? formatDateTime(business.websiteConfig.lastPublishedAt) : "Never", null],
        ].map(([label, value, hint]) => (
          <Card key={String(label)} className="gap-1 px-5 py-4">
            <p className="text-sm text-muted-foreground">{label}</p>
            <p className="text-lg font-semibold tabular-nums">{value}</p>
            {hint ? <p className="text-xs text-muted-foreground">{hint}</p> : null}
          </Card>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <WebsitePublishPanel
          businessId={business.id}
          isLive={isLive}
          isSuspended={business.status === "SUSPENDED"}
          hasPublishedVersion={business.websiteConfig?.publishedConfig != null}
        />
        <Card>
          <CardHeader>
            <CardTitle>Contact details</CardTitle>
            <CardDescription>Managed by the business in its profile.</CardDescription>
          </CardHeader>
          <CardContent>
            <dl className="grid grid-cols-[8rem_1fr] gap-y-2 text-sm">
              <dt className="text-muted-foreground">Email</dt>
              <dd className="break-all">{business.email ?? "—"}</dd>
              <dt className="text-muted-foreground">Phone</dt>
              <dd>{business.phone ?? "—"}</dd>
              <dt className="text-muted-foreground">WhatsApp</dt>
              <dd>{business.whatsappNumber ? `+${business.whatsappNumber}` : "—"}</dd>
              <dt className="text-muted-foreground">Location</dt>
              <dd>{[business.city, business.state].filter(Boolean).join(", ") || "—"}</dd>
            </dl>
          </CardContent>
        </Card>
      </div>

      <PlatformSettingsForm
        businessId={business.id}
        defaults={{
          slug: business.slug,
          category: business.category as never,
          allowSelfPublish: business.allowSelfPublish,
          enquiriesEnabled: business.enquiriesEnabled,
          whatsappEnabled: business.whatsappEnabled,
        }}
      />

      <AdministratorsPanel
        businessId={business.id}
        members={business.memberships.map((m) => ({
          userId: m.user.id,
          name: m.user.name,
          email: m.user.email,
          userStatus: m.user.status,
          role: m.role,
        }))}
        invitations={business.invitations.map((i) => ({
          id: i.id,
          email: i.email,
          role: i.role,
          expiresAt: formatDate(i.expiresAt),
        }))}
      />

      <DangerZone businessId={business.id} slug={business.slug} status={business.status} />
    </>
  );
}
