import { ChevronLeft, ChevronRight } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

type Params = Record<string, string | number | null | undefined>;

export function hrefWith(basePath: string, params: Params): string {
  const search = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value !== null && value !== undefined && value !== "" && !(key === "page" && Number(value) === 1)) {
      search.set(key, String(value));
    }
  }
  const query = search.toString();
  return query ? `${basePath}?${query}` : basePath;
}

export function Pagination({
  basePath,
  params,
  page,
  pageCount,
  total,
  noun = "results",
}: {
  basePath: string;
  params: Params;
  page: number;
  pageCount: number;
  total: number;
  noun?: string;
}) {
  if (total === 0) return null;
  return (
    <nav aria-label="Pagination" className="flex items-center justify-between gap-4 pt-2 text-sm text-muted-foreground">
      <p>
        {total} {noun} · page {page} of {pageCount}
      </p>
      <div className="flex gap-2">
        {page > 1 ? (
          <Button asChild variant="outline" size="sm">
            <Link href={hrefWith(basePath, { ...params, page: page - 1 })}>
              <ChevronLeft /> Previous
            </Link>
          </Button>
        ) : (
          <Button variant="outline" size="sm" disabled>
            <ChevronLeft /> Previous
          </Button>
        )}
        {page < pageCount ? (
          <Button asChild variant="outline" size="sm">
            <Link href={hrefWith(basePath, { ...params, page: page + 1 })}>
              Next <ChevronRight />
            </Link>
          </Button>
        ) : (
          <Button variant="outline" size="sm" disabled>
            Next <ChevronRight />
          </Button>
        )}
      </div>
    </nav>
  );
}
