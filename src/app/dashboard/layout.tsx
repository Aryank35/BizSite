import { ShieldCheck } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { AccountMenu } from "@/components/app/account-menu";
import { AreaShell } from "@/components/app/area-shell";
import { StatusBadge } from "@/components/app/status-badge";
import { Skeleton } from "@/components/ui/skeleton";
import { prisma } from "@/lib/db";
import { getSessionUser, requireTenant } from "@/server/session";

export const metadata: Metadata = {
  title: { default: "Dashboard", template: "%s · BizSite" },
  robots: { index: false, follow: false },
};

async function BusinessIdentity() {
  const ctx = await requireTenant();
  const business = await prisma.business.findUnique({
    where: { id: ctx.businessId },
    select: { name: true, logoUrl: true, publishedAt: true },
  });
  const initial = (business?.name ?? "?").charAt(0).toUpperCase();
  return (
    <div className="flex items-center gap-2 px-1 py-1.5">
      <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-primary text-sm font-semibold text-primary-foreground">
        {initial}
      </span>
      <div className="grid min-w-0 leading-tight group-data-[collapsible=icon]:hidden">
        <span className="truncate font-semibold">{business?.name}</span>
        <span className="mt-0.5">
          <StatusBadge status={business?.publishedAt ? "LIVE" : "OFFLINE"} className="px-1.5 text-[11px]" />
        </span>
      </div>
    </div>
  );
}

async function Account() {
  const ctx = await requireTenant();
  const user = await getSessionUser();
  if (!user) return null;
  const roleLabel = ctx.isSuperAdmin ? "Super admin" : ctx.membershipRole === "OWNER" ? "Business owner" : "Editor";
  return <AccountMenu name={user.name} email={user.email} roleLabel={roleLabel} settingsHref="/dashboard/settings" />;
}

/** Shown when a super admin is working inside a business dashboard. */
async function SuperAdminBanner() {
  const ctx = await requireTenant();
  if (!ctx.isSuperAdmin) return null;
  return (
    <div className="flex flex-wrap items-center justify-between gap-2 border-b bg-amber-50 px-4 py-2 text-sm text-amber-900 sm:px-6">
      <span className="flex items-center gap-2">
        <ShieldCheck className="size-4" aria-hidden /> You are managing <strong>{ctx.business.name}</strong> as a super admin.
        {ctx.business.status === "SUSPENDED" ? " This business is suspended." : null}
      </span>
      <Link href={`/admin/businesses/${ctx.businessId}`} className="font-medium underline-offset-4 hover:underline">
        Back to platform admin
      </Link>
    </div>
  );
}

export default function DashboardLayout({ children }: LayoutProps<"/dashboard">) {
  return (
    <AreaShell
      area="dashboard"
      sidebarHeader={
        <Suspense fallback={<Skeleton className="h-11 w-full" />}>
          <BusinessIdentity />
        </Suspense>
      }
      account={
        <Suspense fallback={<Skeleton className="size-8 rounded-full" />}>
          <Account />
        </Suspense>
      }
      banner={
        <Suspense>
          <SuperAdminBanner />
        </Suspense>
      }
    >
      {children}
    </AreaShell>
  );
}
