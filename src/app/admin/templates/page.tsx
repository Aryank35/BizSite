import type { Metadata } from "next";
import { PageHeader } from "@/components/app/page-header";
import { prisma } from "@/lib/db";
import { requireSuperAdmin } from "@/server/session";
import { getPlatformSettings } from "@/server/services/platform";
import { TemplateAvailabilityForm } from "./template-availability-form";

export const metadata: Metadata = { title: "Templates" };

export default async function TemplatesPage() {
  await requireSuperAdmin();
  const [settings, usage] = await Promise.all([
    getPlatformSettings(),
    prisma.websiteConfig.groupBy({ by: ["template"], _count: { _all: true }, orderBy: { template: "asc" } }),
  ]);
  const usageByTemplate = Object.fromEntries(usage.map((u) => [u.template, (u._count as { _all: number })._all]));

  return (
    <>
      <PageHeader
        title="Templates & sections"
        description="Choose which website templates and homepage sections businesses can use. Disabling a section hides it from editors and from websites the next time they publish."
      />
      <TemplateAvailabilityForm
        enabledTemplates={settings.enabledTemplates}
        enabledSectionTypes={settings.enabledSectionTypes}
        usage={usageByTemplate}
      />
    </>
  );
}
