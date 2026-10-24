import type { Metadata } from "next";
import { PageHeader } from "@/components/app/page-header";
import { can } from "@/server/tenant";
import { requireTenant } from "@/server/session";
import { getBusinessProfile } from "@/server/services/profile";
import { ProfileForm } from "./profile-form";

export const metadata: Metadata = { title: "Business profile" };

export default async function ProfilePage() {
  const ctx = await requireTenant();
  const profile = await getBusinessProfile(ctx);
  return (
    <>
      <PageHeader
        title="Business profile"
        description="Your contact details, logo and opening hours. Changes appear on your website straight away."
      />
      <ProfileForm
        canEdit={can(ctx, "business:settings")}
        defaults={{
          name: profile.name,
          description: profile.description ?? "",
          logoUrl: profile.logoUrl,
          email: profile.email ?? "",
          phone: profile.phone ?? "",
          whatsappNumber: profile.whatsappNumber ? `+${profile.whatsappNumber}` : "",
          addressLine: profile.addressLine ?? "",
          city: profile.city ?? "",
          state: profile.state ?? "",
          postalCode: profile.postalCode ?? "",
          openingHours: profile.openingHours,
          socialLinks: Object.fromEntries(Object.entries(profile.socialLinks).map(([k, v]) => [k, v ?? ""])) as Record<string, string>,
        }}
      />
    </>
  );
}
