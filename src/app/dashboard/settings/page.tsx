import type { Metadata } from "next";
import { AccountSettings } from "@/components/app/account-settings";
import { PageHeader } from "@/components/app/page-header";
import { StatusBadge } from "@/components/app/status-badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { can } from "@/server/tenant";
import { requireTenant, requireUser } from "@/server/session";

export const metadata: Metadata = { title: "Settings" };

function Feature({ label, enabled, note }: { label: string; enabled: boolean; note: string }) {
  return (
    <li className="flex items-start justify-between gap-4 py-3 first:pt-0 last:pb-0">
      <div>
        <p className="text-sm font-medium">{label}</p>
        <p className="text-xs text-muted-foreground">{note}</p>
      </div>
      <span className={enabled ? "text-sm font-medium text-emerald-700" : "text-sm text-muted-foreground"}>{enabled ? "Enabled" : "Disabled"}</span>
    </li>
  );
}

export default async function DashboardSettingsPage() {
  const [ctx, user] = await Promise.all([requireTenant(), requireUser()]);
  return (
    <>
      <PageHeader title="Settings" description="Your account and the features available to your business." />
      <AccountSettings name={user.name} email={user.email} />
      <Card>
        <CardHeader>
          <CardTitle>Business access</CardTitle>
          <CardDescription>Features are managed by your platform administrator.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="flex items-center gap-2 text-sm">
            Your role:{" "}
            {ctx.isSuperAdmin ? <span className="font-medium">Super admin</span> : <StatusBadge status={ctx.membershipRole ?? "EDITOR"} />}
          </p>
          <ul className="divide-y">
            <Feature
              label="Publish website"
              enabled={can(ctx, "website:publish")}
              note={ctx.business.allowSelfPublish ? "Owners can publish and unpublish the website." : "Publishing is handled by the platform administrator."}
            />
            <Feature label="Enquiry form" enabled={ctx.business.enquiriesEnabled} note="Visitors can send enquiries from your website." />
            <Feature label="WhatsApp buttons" enabled={ctx.business.whatsappEnabled} note="WhatsApp chat links appear on your website." />
          </ul>
        </CardContent>
      </Card>
    </>
  );
}
