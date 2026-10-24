import { Building2, Plus, Search } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { EmptyState } from "@/components/app/empty-state";
import { PageHeader } from "@/components/app/page-header";
import { Pagination } from "@/components/app/pagination";
import { StatusBadge } from "@/components/app/status-badge";
import { NativeSelect } from "@/components/forms/native-select";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { BUSINESS_CATEGORIES, categoryLabel } from "@/lib/constants";
import { formatDate } from "@/lib/format";
import { requireSuperAdmin } from "@/server/session";
import { listBusinesses } from "@/server/services/businesses";

export const metadata: Metadata = { title: "Businesses" };

export default async function BusinessesPage(props: PageProps<"/admin/businesses">) {
  await requireSuperAdmin();
  const result = await listBusinesses(await props.searchParams);
  const { filter } = result;
  const filtered = Boolean(filter.q || filter.category || filter.status);

  return (
    <>
      <PageHeader
        title="Businesses"
        description="Every business on the platform, their website status and activity."
        actions={
          <Button asChild>
            <Link href="/admin/businesses/new">
              <Plus /> New business
            </Link>
          </Button>
        }
      />

      <form className="flex flex-col gap-2 sm:flex-row" role="search" aria-label="Filter businesses">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground" aria-hidden />
          <Input name="q" defaultValue={filter.q ?? ""} placeholder="Search by name" className="pl-8" aria-label="Search by name" />
        </div>
        <NativeSelect name="category" defaultValue={filter.category ?? ""} aria-label="Category" className="sm:w-52">
          <option value="">All categories</option>
          {BUSINESS_CATEGORIES.map((c) => (
            <option key={c.value} value={c.value}>
              {c.label}
            </option>
          ))}
        </NativeSelect>
        <NativeSelect name="status" defaultValue={filter.status ?? ""} aria-label="Status" className="sm:w-40">
          <option value="">Any status</option>
          <option value="ACTIVE">Active</option>
          <option value="SUSPENDED">Suspended</option>
        </NativeSelect>
        <Button type="submit" variant="secondary">
          Apply
        </Button>
        {filtered ? (
          <Button asChild variant="ghost">
            <Link href="/admin/businesses">Clear</Link>
          </Button>
        ) : null}
      </form>

      {result.items.length === 0 ? (
        <EmptyState
          icon={Building2}
          title={filtered ? "No businesses match these filters" : "No businesses yet"}
          description={filtered ? "Try a different search or clear the filters." : "Create the first business to start building its website."}
          action={
            filtered ? null : (
              <Button asChild>
                <Link href="/admin/businesses/new">
                  <Plus /> New business
                </Link>
              </Button>
            )
          }
        />
      ) : (
        <Card className="py-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="pl-4">Business</TableHead>
                <TableHead className="hidden md:table-cell">Category</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Website</TableHead>
                <TableHead className="hidden text-right lg:table-cell">Products</TableHead>
                <TableHead className="hidden text-right lg:table-cell">Enquiries</TableHead>
                <TableHead className="hidden pr-4 sm:table-cell">Created</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {result.items.map((b) => (
                <TableRow key={b.id}>
                  <TableCell className="pl-4">
                    <Link href={`/admin/businesses/${b.id}`} className="font-medium hover:underline">
                      {b.name}
                    </Link>
                    <p className="text-xs text-muted-foreground">
                      /{b.slug}
                      {b.city ? ` · ${b.city}` : ""}
                    </p>
                  </TableCell>
                  <TableCell className="hidden md:table-cell">{categoryLabel(b.category)}</TableCell>
                  <TableCell>
                    <StatusBadge status={b.status} />
                  </TableCell>
                  <TableCell>
                    <StatusBadge status={b.publishedAt && b.status === "ACTIVE" ? "LIVE" : "OFFLINE"} />
                  </TableCell>
                  <TableCell className="hidden text-right tabular-nums lg:table-cell">{b._count.products}</TableCell>
                  <TableCell className="hidden text-right tabular-nums lg:table-cell">{b._count.enquiries}</TableCell>
                  <TableCell className="hidden pr-4 text-muted-foreground sm:table-cell">{formatDate(b.createdAt)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>
      )}

      <Pagination
        basePath="/admin/businesses"
        params={{ q: filter.q, category: filter.category, status: filter.status }}
        page={result.page}
        pageCount={result.pageCount}
        total={result.total}
        noun="businesses"
      />
    </>
  );
}
