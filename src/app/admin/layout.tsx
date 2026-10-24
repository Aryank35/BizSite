import type { Metadata } from "next";
import { Suspense } from "react";
import { AccountMenu } from "@/components/app/account-menu";
import { AreaShell } from "@/components/app/area-shell";
import { BrandMark } from "@/components/marketing/brand";
import { Skeleton } from "@/components/ui/skeleton";
import { requireSuperAdmin } from "@/server/session";

export const metadata: Metadata = {
  title: { default: "Platform admin", template: "%s · BizSite admin" },
  robots: { index: false, follow: false },
};

async function AdminAccount() {
  const user = await requireSuperAdmin();
  return <AccountMenu name={user.name} email={user.email} roleLabel="Super admin" settingsHref="/admin/settings" />;
}

export default function AdminLayout({ children }: LayoutProps<"/admin">) {
  return (
    <AreaShell
      area="admin"
      sidebarHeader={
        <div className="flex items-center gap-2 px-1 py-1.5">
          <BrandMark className="size-8" />
          <div className="grid leading-tight group-data-[collapsible=icon]:hidden">
            <span className="font-semibold">BizSite</span>
            <span className="text-xs text-sidebar-foreground/60">Platform admin</span>
          </div>
        </div>
      }
      account={
        <Suspense fallback={<Skeleton className="size-8 rounded-full" />}>
          <AdminAccount />
        </Suspense>
      }
    >
      {children}
    </AreaShell>
  );
}
