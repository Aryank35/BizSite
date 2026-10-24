import { ArrowRight, CheckCircle2, Circle, ExternalLink, Globe, Inbox, MailOpen, Package, PackageCheck, Plus } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { PageHeader } from "@/components/app/page-header";
import { StatCard } from "@/components/app/stat-card";
import { StatusBadge } from "@/components/app/status-badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { formatDate, timeAgo } from "@/lib/format";
import { requireTenant } from "@/server/session";
import { getBusinessProfile } from "@/server/services/profile";
import { getBusinessStats } from "@/server/services/stats";

export const metadata: Metadata = { title: "Overview" };

export default async function DashboardPage() {
  const ctx = await requireTenant();
  const [stats, profile] = await Promise.all([getBusinessStats(ctx), getBusinessProfile(ctx)]);

  const checklist = [
    { done: Boolean(profile.description && profile.phone), label: "Complete your business profile", href: "/dashboard/profile" },
    { done: Boolean(profile.logoUrl), label: "Upload your logo", href: "/dashboard/profile" },
    { done: stats.categories > 0, label: "Create product categories", href: "/dashboard/categories" },
    { done: stats.publishedProducts > 0, label: "Publish your first product", href: "/dashboard/products/new" },
    { done: stats.isLive, label: "Publish your website", href: "/dashboard/website" },
  ];
  const remaining = checklist.filter((c) => !c.done);

  return (
    <>
      <PageHeader
        title={`Welcome back`}
        description={`Here is what is happening with ${ctx.business.name}.`}
        actions={
          <>
            {stats.isLive ? (
              <Button asChild variant="outline">
                <a href={`/site/${stats.slug}`} target="_blank" rel="noreferrer">
                  <ExternalLink /> View website
                </a>
              </Button>
            ) : null}
            <Button asChild>
              <Link href="/dashboard/products/new">
                <Plus /> Add product
              </Link>
            </Button>
          </>
        }
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        <StatCard label="Products" value={stats.products} icon={Package} />
        <StatCard label="Published" value={stats.publishedProducts} icon={PackageCheck} hint={`${stats.products - stats.publishedProducts} in draft`} />
        <StatCard label="Enquiries" value={stats.enquiries} icon={Inbox} />
        <StatCard label="New enquiries" value={stats.newEnquiries} icon={MailOpen} hint="Not yet opened" />
        <StatCard
          label="Website"
          value={<StatusBadge status={stats.isLive ? "LIVE" : "OFFLINE"} className="text-sm" />}
          icon={Globe}
          hint={stats.publishedAt ? `Since ${formatDate(stats.publishedAt)}` : "Not published yet"}
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-5">
        <Card className="lg:col-span-3">
          <CardHeader className="flex flex-row items-start justify-between">
            <div className="space-y-1.5">
              <CardTitle>Latest enquiries</CardTitle>
              <CardDescription>Messages from your website visitors.</CardDescription>
            </div>
            <Button asChild variant="ghost" size="sm">
              <Link href="/dashboard/enquiries">
                View all <ArrowRight />
              </Link>
            </Button>
          </CardHeader>
          <CardContent>
            {stats.recentEnquiries.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                No enquiries yet. Once your website is live, messages sent through it appear here.
              </p>
            ) : (
              <ul className="divide-y">
                {stats.recentEnquiries.map((e) => (
                  <li key={e.id} className="py-3 first:pt-0 last:pb-0">
                    <Link href={`/dashboard/enquiries?open=${e.id}`} className="group block space-y-1">
                      <div className="flex items-center justify-between gap-3">
                        <p className="font-medium group-hover:underline">{e.customerName}</p>
                        <StatusBadge status={e.status} />
                      </div>
                      <p className="line-clamp-1 text-sm text-muted-foreground">{e.message}</p>
                      <p className="text-xs text-muted-foreground">
                        {timeAgo(e.createdAt)}
                        {e.product ? ` · about ${e.product.name}` : ""}
                      </p>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>{remaining.length === 0 ? "You are all set" : "Get your website ready"}</CardTitle>
            <CardDescription>
              {remaining.length === 0 ? "Everything on the setup checklist is complete." : `${remaining.length} of ${checklist.length} steps left.`}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ul className="space-y-1">
              {checklist.map((item) => (
                <li key={item.label}>
                  <Link href={item.href} className="flex items-center gap-3 rounded-lg px-2 py-2 text-sm hover:bg-muted">
                    {item.done ? (
                      <CheckCircle2 className="size-4 text-emerald-600" aria-label="Done" />
                    ) : (
                      <Circle className="size-4 text-muted-foreground" aria-label="To do" />
                    )}
                    <span className={item.done ? "text-muted-foreground line-through" : undefined}>{item.label}</span>
                  </Link>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      </div>
    </>
  );
}
