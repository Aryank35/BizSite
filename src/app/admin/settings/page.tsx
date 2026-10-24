import type { Metadata } from "next";
import { AccountSettings } from "@/components/app/account-settings";
import { PageHeader } from "@/components/app/page-header";
import { requireSuperAdmin } from "@/server/session";
import { getPlatformSettings } from "@/server/services/platform";
import { PlatformSettingsForm } from "./platform-settings-form";

export const metadata: Metadata = { title: "Settings" };

export default async function AdminSettingsPage() {
  const user = await requireSuperAdmin();
  const settings = await getPlatformSettings();
  return (
    <>
      <PageHeader title="Settings" description="Platform-wide defaults and your own account." />
      <PlatformSettingsForm
        enabledTemplates={settings.enabledTemplates}
        defaults={{
          platformName: settings.platformName,
          supportEmail: settings.supportEmail ?? "",
          defaultTemplate: settings.defaultTemplate,
        }}
      />
      <AccountSettings name={user.name} email={user.email} />
    </>
  );
}
