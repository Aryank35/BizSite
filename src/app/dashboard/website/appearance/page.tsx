import { Eye } from "lucide-react";
import type { Metadata } from "next";
import { PageHeader } from "@/components/app/page-header";
import { Button } from "@/components/ui/button";
import { defaultTheme } from "@/lib/website/theme";
import { requireTenant } from "@/server/session";
import { getAppearance } from "@/server/services/website";
import { AppearanceForm } from "./appearance-form";

export const metadata: Metadata = { title: "Appearance" };

export default async function AppearancePage() {
  const ctx = await requireTenant();
  const appearance = await getAppearance(ctx);
  const theme = appearance.theme ?? defaultTheme();
  return (
    <>
      <PageHeader
        title="Appearance"
        description="Changes are saved to your draft. Preview them, then publish from the Website page."
        actions={
          <Button asChild variant="outline">
            <a href={`/preview/${ctx.businessId}`} target="_blank" rel="noreferrer">
              <Eye /> Preview draft
            </a>
          </Button>
        }
      />
      <AppearanceForm
        businessName={appearance.businessName}
        logoUrl={appearance.logoUrl}
        enabledTemplates={[...new Set([...appearance.enabledTemplates, theme.template])]}
        defaults={{
          ...theme,
          navigationSettings: { ...theme.navigationSettings, ctaLabel: theme.navigationSettings.ctaLabel ?? "" },
          footerSettings: { ...theme.footerSettings, tagline: theme.footerSettings.tagline ?? "" },
          seoSettings: {
            title: theme.seoSettings.title ?? "",
            description: theme.seoSettings.description ?? "",
            ogImageUrl: theme.seoSettings.ogImageUrl,
          },
        }}
      />
    </>
  );
}
