import { Inbox, Mail, MessageCircle, Phone, X } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { EmptyState } from "@/components/app/empty-state";
import { PageHeader } from "@/components/app/page-header";
import { Pagination, hrefWith } from "@/components/app/pagination";
import { ENQUIRY_STATUS_LABELS, StatusBadge } from "@/components/app/status-badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatDateTime, timeAgo } from "@/lib/format";
import { cn } from "@/lib/utils";
import { whatsappLink } from "@/lib/whatsapp";
import { NotFoundError } from "@/server/errors";
import { requireTenant } from "@/server/session";
import { getEnquiry, listEnquiries } from "@/server/services/enquiries";
import { EnquiryActions } from "./enquiry-actions";

export const metadata: Metadata = { title: "Enquiries" };

export default async function EnquiriesPage(props: PageProps<"/dashboard/enquiries">) {
  const ctx = await requireTenant();
  const searchParams = await props.searchParams;
  const result = await listEnquiries(ctx, searchParams);
  const openId = typeof searchParams.open === "string" ? searchParams.open : null;
  const open = openId
    ? await getEnquiry(ctx, openId).catch((error) => {
        if (error instanceof NotFoundError) return null;
        throw error;
      })
    : null;

  const status = result.filter.status;
  const baseParams = { status, page: result.page };
  const total = Object.values(result.byStatus).reduce((sum, n) => sum + n, 0);
  const tabs: { value?: string; label: string; count: number }[] = [
    { label: "All", count: total },
    ...Object.entries(ENQUIRY_STATUS_LABELS).map(([value, label]) => ({ value, label, count: result.byStatus[value] ?? 0 })),
  ];

  return (
    <>
      <PageHeader title="Enquiries" description="Messages sent through your website. Update the status as you follow up." />

      <nav aria-label="Filter by status" className="flex flex-wrap gap-2">
        {tabs.map((tab) => {
          const active = tab.value === status;
          return (
            <Link
              key={tab.label}
              href={hrefWith("/dashboard/enquiries", { status: tab.value })}
              aria-current={active ? "page" : undefined}
              className={cn(
                "inline-flex items-center gap-2 rounded-full border px-3 py-1 text-sm transition-colors",
                active ? "border-primary bg-primary text-primary-foreground" : "bg-card hover:bg-muted",
              )}
            >
              {tab.label}
              <span className={cn("text-xs tabular-nums", active ? "text-primary-foreground/80" : "text-muted-foreground")}>{tab.count}</span>
            </Link>
          );
        })}
      </nav>

      {result.items.length === 0 ? (
        <EmptyState
          icon={Inbox}
          title={status ? "Nothing here" : "No enquiries yet"}
          description={
            status ? "No enquiries have this status." : "When visitors use the enquiry form on your website, their messages appear here."
          }
        />
      ) : (
        <div className={cn("grid gap-6", open && "lg:grid-cols-[minmax(0,1fr)_24rem]")}>
          <Card className="order-2 py-0 lg:order-1">
            <ul className="divide-y">
              {result.items.map((e) => (
                <li key={e.id}>
                  <Link
                    href={hrefWith("/dashboard/enquiries", { ...baseParams, open: e.id })}
                    scroll={false}
                    className={cn("block space-y-1 px-4 py-3 hover:bg-muted/60", open?.id === e.id && "bg-accent/60")}
                    aria-current={open?.id === e.id ? "true" : undefined}
                  >
                    <div className="flex items-center justify-between gap-3">
                      <p className={cn("truncate", e.status === "NEW" ? "font-semibold" : "font-medium")}>{e.customerName}</p>
                      <span className="shrink-0 text-xs text-muted-foreground">{timeAgo(e.createdAt)}</span>
                    </div>
                    <p className="line-clamp-1 text-sm text-muted-foreground">{e.message}</p>
                    <div className="flex items-center gap-2 pt-0.5">
                      <StatusBadge status={e.status} />
                      {e.product ? <span className="truncate text-xs text-muted-foreground">About: {e.product.name}</span> : null}
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
          </Card>

          {open ? (
            <Card className="order-1 h-fit lg:sticky lg:top-20 lg:order-2">
              <CardHeader className="flex flex-row items-start justify-between gap-3">
                <div className="min-w-0 space-y-1">
                  <CardTitle className="truncate">{open.customerName}</CardTitle>
                  <p className="text-xs text-muted-foreground">Received {formatDateTime(open.createdAt)}</p>
                </div>
                <Button asChild size="icon-sm" variant="ghost" aria-label="Close enquiry">
                  <Link href={hrefWith("/dashboard/enquiries", baseParams)} scroll={false}>
                    <X />
                  </Link>
                </Button>
              </CardHeader>
              <CardContent className="space-y-5">
                {open.product ? (
                  <p className="rounded-lg bg-muted px-3 py-2 text-sm">
                    About <Link href={`/dashboard/products/${open.product.id}`} className="font-medium hover:underline">{open.product.name}</Link>
                  </p>
                ) : null}
                <p className="text-sm whitespace-pre-line">{open.message}</p>
                <div className="flex flex-wrap gap-2">
                  {open.email ? (
                    <Button asChild size="sm" variant="outline">
                      <a href={`mailto:${open.email}`}>
                        <Mail /> {open.email}
                      </a>
                    </Button>
                  ) : null}
                  {open.phone ? (
                    <Button asChild size="sm" variant="outline">
                      <a href={`tel:${open.phone.replace(/[^\d+]/g, "")}`}>
                        <Phone /> {open.phone}
                      </a>
                    </Button>
                  ) : null}
                  {whatsappLink(open.phone, `Hello ${open.customerName}, thank you for your enquiry.`) ? (
                    <Button asChild size="sm" variant="outline">
                      <a href={whatsappLink(open.phone, `Hello ${open.customerName}, thank you for your enquiry.`)!} target="_blank" rel="noreferrer">
                        <MessageCircle /> WhatsApp
                      </a>
                    </Button>
                  ) : null}
                </div>
                <EnquiryActions
                  id={open.id}
                  status={open.status}
                  closeHref={hrefWith("/dashboard/enquiries", baseParams)}
                />
              </CardContent>
            </Card>
          ) : null}
        </div>
      )}

      <Pagination
        basePath="/dashboard/enquiries"
        params={{ status }}
        page={result.page}
        pageCount={result.pageCount}
        total={result.total}
        noun="enquiries"
      />
    </>
  );
}
