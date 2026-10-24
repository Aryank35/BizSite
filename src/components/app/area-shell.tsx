"use client";

import {
  Building2,
  Globe,
  Inbox,
  LayoutDashboard,
  LayoutList,
  LayoutTemplate,
  Package,
  Palette,
  Settings,
  Store,
  Tags,
  type LucideIcon,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Fragment, Suspense, type ReactNode } from "react";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { Separator } from "@/components/ui/separator";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarInset,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarRail,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import { cn } from "@/lib/utils";

type NavItem = { label: string; href: string; icon: LucideIcon; exact?: boolean };
type NavGroup = { label?: string; items: NavItem[] };

const NAV: Record<"admin" | "dashboard", NavGroup[]> = {
  admin: [
    {
      items: [
        { label: "Overview", href: "/admin", icon: LayoutDashboard, exact: true },
        { label: "Businesses", href: "/admin/businesses", icon: Building2 },
        { label: "Enquiries", href: "/admin/enquiries", icon: Inbox },
      ],
    },
    {
      label: "Platform",
      items: [
        { label: "Templates", href: "/admin/templates", icon: LayoutTemplate },
        { label: "Settings", href: "/admin/settings", icon: Settings },
      ],
    },
  ],
  dashboard: [
    {
      items: [
        { label: "Overview", href: "/dashboard", icon: LayoutDashboard, exact: true },
        { label: "Enquiries", href: "/dashboard/enquiries", icon: Inbox },
      ],
    },
    {
      label: "Catalogue",
      items: [
        { label: "Products", href: "/dashboard/products", icon: Package },
        { label: "Categories", href: "/dashboard/categories", icon: Tags },
      ],
    },
    {
      label: "Website",
      items: [
        { label: "Publishing", href: "/dashboard/website", icon: Globe, exact: true },
        { label: "Appearance", href: "/dashboard/website/appearance", icon: Palette },
        { label: "Sections", href: "/dashboard/website/sections", icon: LayoutList },
      ],
    },
    {
      label: "Business",
      items: [
        { label: "Profile", href: "/dashboard/profile", icon: Store },
        { label: "Settings", href: "/dashboard/settings", icon: Settings },
      ],
    },
  ],
};

const SEGMENT_LABELS: Record<string, string> = {
  admin: "Admin",
  dashboard: "Dashboard",
  businesses: "Businesses",
  new: "New",
  templates: "Templates",
  enquiries: "Enquiries",
  settings: "Settings",
  profile: "Profile",
  products: "Products",
  categories: "Categories",
  website: "Website",
  appearance: "Appearance",
  sections: "Sections",
};

function Breadcrumbs() {
  return <BreadcrumbTrail pathname={usePathname()} />;
}

function BreadcrumbTrail({ pathname }: { pathname: string }) {
  const segments = pathname.split("/").filter(Boolean);
  const crumbs = segments.map((segment, index) => ({
    href: "/" + segments.slice(0, index + 1).join("/"),
    label: SEGMENT_LABELS[segment] ?? "Details",
  }));
  return (
    <Breadcrumb>
      <BreadcrumbList>
        {crumbs.map((crumb, index) => (
          <Fragment key={crumb.href}>
            {index > 0 ? <BreadcrumbSeparator className="hidden sm:block" /> : null}
            <BreadcrumbItem className={index < crumbs.length - 1 ? "hidden sm:inline-flex" : undefined}>
              {index === crumbs.length - 1 ? (
                <BreadcrumbPage>{crumb.label}</BreadcrumbPage>
              ) : (
                <BreadcrumbLink asChild>
                  <Link href={crumb.href}>{crumb.label}</Link>
                </BreadcrumbLink>
              )}
            </BreadcrumbItem>
          </Fragment>
        ))}
      </BreadcrumbList>
    </Breadcrumb>
  );
}

function Nav({ groups }: { groups: NavGroup[] }) {
  return <NavList groups={groups} pathname={usePathname()} />;
}

/** pathname is null while it is not yet known (prerendered shell): nothing is highlighted. */
function NavList({ groups, pathname }: { groups: NavGroup[]; pathname: string | null }) {
  return (
    <>
      {groups.map((group, index) => (
        <SidebarGroup key={group.label ?? index}>
          {group.label ? <SidebarGroupLabel>{group.label}</SidebarGroupLabel> : null}
          <SidebarGroupContent>
            <SidebarMenu>
              {group.items.map((item) => {
                const active = pathname !== null && (item.exact ? pathname === item.href : pathname === item.href || pathname.startsWith(`${item.href}/`));
                return (
                  <SidebarMenuItem key={item.href}>
                    <SidebarMenuButton asChild isActive={active} tooltip={item.label}>
                      <Link href={item.href} aria-current={active ? "page" : undefined}>
                        <item.icon />
                        <span>{item.label}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      ))}
    </>
  );
}

export function AreaShell({
  area,
  sidebarHeader,
  sidebarFooter,
  account,
  banner,
  children,
}: {
  area: "admin" | "dashboard";
  sidebarHeader: ReactNode;
  sidebarFooter?: ReactNode;
  account: ReactNode;
  banner?: ReactNode;
  children: ReactNode;
}) {
  return (
    <SidebarProvider className={cn(area === "admin" && "admin-theme")}>
      <Sidebar collapsible="icon">
        <SidebarHeader>{sidebarHeader}</SidebarHeader>
        <SidebarContent>
          {/* usePathname is request data on dynamic routes, so it needs a Suspense boundary. */}
          <Suspense fallback={<NavList groups={NAV[area]} pathname={null} />}>
            <Nav groups={NAV[area]} />
          </Suspense>
        </SidebarContent>
        {sidebarFooter ? <SidebarFooter>{sidebarFooter}</SidebarFooter> : null}
        <SidebarRail />
      </Sidebar>
      <SidebarInset className="min-w-0 bg-background">
        <header className="sticky top-0 z-20 flex h-14 shrink-0 items-center gap-3 border-b bg-background/90 px-4 backdrop-blur">
          <SidebarTrigger className="-ml-1" />
          <Separator orientation="vertical" className="h-5" />
          <div className="min-w-0 flex-1">
            <Suspense>
              <Breadcrumbs />
            </Suspense>
          </div>
          {account}
        </header>
        {banner}
        <div className="mx-auto w-full max-w-6xl flex-1 space-y-6 px-4 py-6 sm:px-6 lg:py-8">{children}</div>
      </SidebarInset>
    </SidebarProvider>
  );
}
