import { Inbox } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { EmptyState } from "@/components/app/empty-state";
import { PageHeader } from "@/components/app/page-header";
import { Pagination } from "@/components/app/pagination";
import { ENQUIRY_STATUS_LABELS, StatusBadge } from "@/components/app/status-badge";
import { NativeSelect } from "@/components/forms/native-select";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { categoryLabel } from "@/lib/constants";
import { formatDateTime } from "@/lib/format";
import { requireSuperAdmin } from "@/server/session";
import { listPlatformEnquiries } from "@/server/services/enquiries";
import { getEnquiryCountsByBusiness, getPlatformStats } from "@/server/services/stats";
import { listWebsiteRequests } from "@/server/services/website-requests";
import { RequestHandledToggle } from "./request-handled-toggle";

export const metadata: Metadata = { title: "Enquiries" };

export default async function AdminEnquiriesPage(props: PageProps<"/admin/enquiries">) {
  await requireSuperAdmin();
  const [result, stats, byBusiness, requests] = await Promise.all([
    listPlatformEnquiries(await props.searchParams),
    getPlatformStats(),
    getEnquiryCountsByBusiness(5),
    listWebsiteRequests(),
  ]);

  return (
    <>
      <PageHeader
        title="Enquiries"
        description="Customer enquiries across all business websites, and website requests from the marketing site."
      />

      <div className="grid gap-4 sm:grid-cols-3">
        <Card className="gap-1 px-5 py-4">
          <p className="text-sm text-muted-foreground">Total enquiries</p>
          <p className="text-2xl font-semibold tabular-nums">{stats.enquiries}</p>
        </Card>
        <Card className="gap-1 px-5 py-4">
          <p className="text-sm text-muted-foreground">Unread (new)</p>
          <p className="text-2xl font-semibold tabular-nums">{stats.newEnquiries}</p>
        </Card>
        <Card className="gap-1 px-5 py-4">
          <p className="text-sm text-muted-foreground">Last 30 days</p>
          <p className="text-2xl font-semibold tabular-nums">{stats.enquiries30d}</p>
        </Card>
      </div>

      {byBusiness.length > 0 ? (
        <p className="text-sm text-muted-foreground">
          Busiest:{" "}
          {byBusiness.map((b, i) => (
            <span key={b.businessId}>
              {i > 0 ? ", " : ""}
              <Link href={`/admin/businesses/${b.businessId}`} className="font-medium text-foreground hover:underline">
                {b.name}
              </Link>{" "}
              ({b.total})
            </span>
          ))}
        </p>
      ) : null}

      <form className="flex gap-2" aria-label="Filter enquiries">
        <NativeSelect name="status" defaultValue={result.filter.status ?? ""} aria-label="Status" className="w-48">
          <option value="">All statuses</option>
          {Object.entries(ENQUIRY_STATUS_LABELS).map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </NativeSelect>
        <Button type="submit" variant="secondary">
          Filter
        </Button>
      </form>

      {result.items.length === 0 ? (
        <EmptyState icon={Inbox} title="No enquiries" description="Enquiries submitted on business websites appear here." />
      ) : (
        <Card className="py-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="pl-4">Customer</TableHead>
                <TableHead>Business</TableHead>
                <TableHead className="hidden md:table-cell">Message</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="hidden pr-4 sm:table-cell">Received</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {result.items.map((e) => (
                <TableRow key={e.id}>
                  <TableCell className="pl-4 font-medium">{e.customerName}</TableCell>
                  <TableCell>
                    <Link href={`/admin/businesses/${e.business.id}`} className="hover:underline">
                      {e.business.name}
                    </Link>
                  </TableCell>
                  <TableCell className="hidden max-w-sm truncate text-muted-foreground md:table-cell">{e.message}</TableCell>
                  <TableCell>
                    <StatusBadge status={e.status} />
                  </TableCell>
                  <TableCell className="hidden pr-4 text-muted-foreground sm:table-cell">{formatDateTime(e.createdAt)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>
      )}
      <Pagination
        basePath="/admin/enquiries"
        params={{ status: result.filter.status }}
        page={result.page}
        pageCount={result.pageCount}
        total={result.total}
        noun="enquiries"
      />

      <Card id="requests" className="scroll-mt-20">
        <CardHeader>
          <CardTitle>Website requests</CardTitle>
          <CardDescription>Submitted through the contact page of the BizSite marketing website.</CardDescription>
        </CardHeader>
        <CardContent>
          {requests.length === 0 ? (
            <p className="text-sm text-muted-foreground">No requests yet.</p>
          ) : (
            <ul className="divide-y rounded-lg border">
              {requests.map((r) => (
                <li key={r.id} className="flex flex-col gap-3 p-4 sm:flex-row sm:items-start sm:justify-between">
                  <div className="min-w-0 space-y-1 text-sm">
                    <p className="font-medium">
                      {r.businessName}
                      {r.category ? <span className="font-normal text-muted-foreground"> · {categoryLabel(r.category)}</span> : null}
                    </p>
                    <p className="text-muted-foreground">
                      {r.name} · <a className="hover:underline" href={`mailto:${r.email}`}>{r.email}</a>
                      {r.phone ? ` · ${r.phone}` : ""}
                    </p>
                    {r.message ? <p className="whitespace-pre-line">{r.message}</p> : null}
                    <p className="text-xs text-muted-foreground">{formatDateTime(r.createdAt)}</p>
                  </div>
                  <RequestHandledToggle id={r.id} handled={r.handled} />
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </>
  );
}
