"use client";

import { ArrowDown, ArrowUp, Eye, EyeOff, MoreHorizontal, Package, Pencil, Star, Trash2 } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useState, useTransition } from "react";
import { ConfirmAction } from "@/components/app/confirm-action";
import { StatusBadge } from "@/components/app/status-badge";
import { applyResult } from "@/components/forms/apply-result";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { formatMoney } from "@/lib/money";
import { cn } from "@/lib/utils";
import { deleteProductAction, moveProductAction, setProductFeaturedAction, setProductStatusAction } from "../actions";

type Row = {
  id: string;
  name: string;
  sku: string | null;
  status: "DRAFT" | "PUBLISHED";
  isFeatured: boolean;
  priceMinor: number | null;
  priceVisibility: "SHOW" | "CONTACT_FOR_PRICE";
  imageUrl: string | null;
  categoryName: string | null;
};

function Thumb({ url }: { url: string | null }) {
  return (
    <span className="relative flex size-10 shrink-0 items-center justify-center overflow-hidden rounded-md border bg-muted">
      {url ? <Image src={url} alt="" fill sizes="40px" className="object-cover" /> : <Package className="size-4 text-muted-foreground" />}
    </span>
  );
}

export function ProductTable({ products, canReorder, currency }: { products: Row[]; canReorder: boolean; currency: string }) {
  const [pending, startTransition] = useTransition();
  const [deleting, setDeleting] = useState<Row | null>(null);
  const run =(fn: () => Promise<Parameters<typeof applyResult>[0]>, success?: string) =>
    startTransition(async () => {
      applyResult(await fn(), { success });
    });

  return (
    <Card className="py-0">
      <Table>
        <TableHeader>
          <TableRow>
            {canReorder ? <TableHead className="w-20 pl-4"><span className="sr-only">Order</span></TableHead> : null}
            <TableHead className={cn(!canReorder && "pl-4")}>Product</TableHead>
            <TableHead className="hidden md:table-cell">Category</TableHead>
            <TableHead className="hidden sm:table-cell">Price</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="w-12 pr-4"><span className="sr-only">Actions</span></TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {products.map((p, index) => (
            <TableRow key={p.id}>
              {canReorder ? (
                <TableCell className="pl-4">
                  <div className="flex">
                    <Button size="icon-sm" variant="ghost" disabled={pending || index === 0} onClick={() => run(() => moveProductAction(p.id, "up"))} aria-label={`Move ${p.name} up`}>
                      <ArrowUp />
                    </Button>
                    <Button
                      size="icon-sm"
                      variant="ghost"
                      disabled={pending || index === products.length - 1}
                      onClick={() => run(() => moveProductAction(p.id, "down"))}
                      aria-label={`Move ${p.name} down`}
                    >
                      <ArrowDown />
                    </Button>
                  </div>
                </TableCell>
              ) : null}
              <TableCell className={cn(!canReorder && "pl-4")}>
                <div className="flex items-center gap-3">
                  <Thumb url={p.imageUrl} />
                  <div className="min-w-0">
                    <Link href={`/dashboard/products/${p.id}`} className="flex items-center gap-1.5 font-medium hover:underline">
                      <span className="truncate">{p.name}</span>
                      {p.isFeatured ? <Star className="size-3.5 shrink-0 fill-amber-400 text-amber-400" aria-label="Featured" /> : null}
                    </Link>
                    {p.sku ? <p className="text-xs text-muted-foreground">SKU {p.sku}</p> : null}
                  </div>
                </div>
              </TableCell>
              <TableCell className="hidden text-muted-foreground md:table-cell">{p.categoryName ?? "—"}</TableCell>
              <TableCell className="hidden tabular-nums sm:table-cell">
                {p.priceVisibility === "CONTACT_FOR_PRICE" || p.priceMinor === null ? (
                  <span className="text-muted-foreground">On request</span>
                ) : (
                  formatMoney(p.priceMinor, currency)
                )}
              </TableCell>
              <TableCell>
                <StatusBadge status={p.status} />
              </TableCell>
              <TableCell className="pr-4">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button size="icon-sm" variant="ghost" aria-label={`Actions for ${p.name}`}>
                      <MoreHorizontal />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem asChild>
                      <Link href={`/dashboard/products/${p.id}`}>
                        <Pencil /> Edit
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onSelect={() =>
                        run(
                          () => setProductStatusAction(p.id, p.status === "PUBLISHED" ? "DRAFT" : "PUBLISHED"),
                          p.status === "PUBLISHED" ? "Product unpublished" : "Product published",
                        )
                      }
                    >
                      {p.status === "PUBLISHED" ? <EyeOff /> : <Eye />}
                      {p.status === "PUBLISHED" ? "Unpublish" : "Publish"}
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onSelect={() =>
                        run(() => setProductFeaturedAction(p.id, !p.isFeatured), p.isFeatured ? "Removed from featured" : "Marked as featured")
                      }
                    >
                      <Star /> {p.isFeatured ? "Remove from featured" : "Mark as featured"}
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem variant="destructive" onSelect={() => setDeleting(p)}>
                      <Trash2 /> Delete
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
      {/* Rendered outside the dropdown so closing the menu does not unmount the dialog. */}
      <ConfirmAction
        open={deleting !== null}
        onOpenChange={(open) => {
          if (!open) setDeleting(null);
        }}
        title={`Delete “${deleting?.name ?? ""}”?`}
        description="The product and its images are removed from your catalogue. Past enquiries are kept. This cannot be undone."
        confirmLabel="Delete product"
        destructive
        successMessage="Product deleted"
        action={() => deleteProductAction(deleting?.id ?? "")}
      />
    </Card>
  );
}

export function FeaturedOrder({
  products,
}: {
  products: { id: string; name: string; status: "DRAFT" | "PUBLISHED"; imageUrl: string | null }[];
}) {
  const [pending, startTransition] = useTransition();
  const move = (id: string, dir: "up" | "down") =>
    startTransition(async () => {
      applyResult(await moveProductAction(id, dir, true));
    });

  return (
    <Card>
      <CardHeader>
        <CardTitle>Featured product order</CardTitle>
        <CardDescription>The order featured products appear in on your homepage. Draft products are not shown publicly.</CardDescription>
      </CardHeader>
      <CardContent>
        <ol className="divide-y rounded-lg border">
          {products.map((p, index) => (
            <li key={p.id} className="flex items-center gap-3 px-3 py-2">
              <span className="w-5 text-sm text-muted-foreground tabular-nums">{index + 1}</span>
              <Thumb url={p.imageUrl} />
              <span className="min-w-0 flex-1 truncate text-sm font-medium">{p.name}</span>
              {p.status === "DRAFT" ? <StatusBadge status="DRAFT" /> : null}
              <Button size="icon-sm" variant="ghost" disabled={pending || index === 0} onClick={() => move(p.id, "up")} aria-label={`Move ${p.name} up`}>
                <ArrowUp />
              </Button>
              <Button
                size="icon-sm"
                variant="ghost"
                disabled={pending || index === products.length - 1}
                onClick={() => move(p.id, "down")}
                aria-label={`Move ${p.name} down`}
              >
                <ArrowDown />
              </Button>
            </li>
          ))}
        </ol>
      </CardContent>
    </Card>
  );
}
