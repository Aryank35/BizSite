import { Building2, CheckCircle2, Globe, Inbox, Package } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { PageHeader } from "@/components/app/page-header";
import { StatCard } from "@/components/app/stat-card";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { auditActionLabel, timeAgo } from "@/lib/format";
import { requireSuperAdmin } from "@/server/session";
import { getEnquiryCountsByBusiness, getPlatformStats, getRecentAuditLog } from "@/server/services/stats";

export const metadata: Metadata = { title: "Overview" };

export default async function AdminOverviewPage() {
  await requireSuperAdmin();
  const [stats, byBusiness, activity] = await Promise.all([getPlatformStats(), getEnquiryCountsByBusiness(6), getRecentAuditLog(10)]);

  return (
    <>
      <PageHeader
        title="Platform overview"
        description="Every figure is calculated from the database. Website traffic is not tracked."
        actions={
          <Button asChild>
            <Link href="/admin/businesses/new">
              <Building2 /> New business
            </Link>
          </Button>
        }
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        <StatCard label="Businesses" value={stats.businesses} icon={Building2} />
        <StatCard label="Active" value={stats.activeBusinesses} icon={CheckCircle2} hint={`${stats.businesses - stats.activeBusinesses} suspended`} />
        <StatCard label="Live websites" value={stats.publishedWebsites} icon={Globe} />
        <StatCard label="Products" value={stats.products} icon={Package} hint={`${stats.publishedProducts} published`} />
        <StatCard label="Enquiries" value={stats.enquiries} icon={Inbox} hint={`${stats.enquiries30d} in the last 30 days`} />
      </div>

      {stats.pendingRequests > 0 ? (
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-primary/20 bg-accent px-5 py-4 text-sm">
          <p>
            <strong>{stats.pendingRequests}</strong> new website {stats.pendingRequests === 1 ? "request" : "requests"} from the
            marketing site.
          </p>
          <Button asChild size="sm" variant="outline">
            <Link href="/admin/enquiries#requests">Review requests</Link>
          </Button>
        </div>
      ) : null}

      <div className="grid gap-6 lg:grid-cols-5">
        <Card className="lg:col-span-3">
          <CardHeader>
            <CardTitle>Enquiries by business</CardTitle>
            <CardDescription>Businesses receiving the most enquiries, with unread counts.</CardDescription>
          </CardHeader>
          <CardContent>
            {byBusiness.length === 0 ? (
              <p className="text-sm text-muted-foreground">No enquiries yet.</p>
            ) : (
              <ul className="divide-y">
                {byBusiness.map((row) => {
                  const max = byBusiness[0].total || 1;
                  return (
                    <li key={row.businessId} className="grid gap-2 py-3 first:pt-0 last:pb-0">
                      <div className="flex items-center justify-between gap-4 text-sm">
                        <Link href={`/admin/businesses/${row.businessId}`} className="font-medium hover:underline">
                          {row.name}
                        </Link>
                        <span className="text-muted-foreground tabular-nums">
                          {row.total} total{row.new ? ` · ${row.new} new` : ""}
                        </span>
                      </div>
                      <div className="h-1.5 overflow-hidden rounded-full bg-muted" aria-hidden>
                        <div className="h-full rounded-full bg-primary" style={{ width: `${(row.total / max) * 100}%` }} />
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Recent activity</CardTitle>
            <CardDescription>Audit trail of important actions.</CardDescription>
          </CardHeader>
          <CardContent>
            {activity.length === 0 ? (
              <p className="text-sm text-muted-foreground">No activity recorded yet.</p>
            ) : (
              <ol className="space-y-3 text-sm">
                {activity.map((event) => {
                  const name = (event.metadata as { name?: string } | null)?.name;
                  return (
                    <li key={event.id} className="flex gap-3">
                      <span className="mt-1.5 size-1.5 shrink-0 rounded-full bg-primary" aria-hidden />
                      <div>
                        <p>
                          <span className="font-medium">{event.actor?.name ?? "System"}</span> {auditActionLabel(event.action)}
                          {name ? <span className="text-muted-foreground"> · {name}</span> : null}
                        </p>
                        <p className="text-xs text-muted-foreground">{timeAgo(event.createdAt)}</p>
                      </div>
                    </li>
                  );
                })}
              </ol>
            )}
          </CardContent>
        </Card>
      </div>
    </>
  );
}
