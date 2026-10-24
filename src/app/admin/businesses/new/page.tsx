import type { Metadata } from "next";
import { PageHeader } from "@/components/app/page-header";
import { requireSuperAdmin } from "@/server/session";
import { NewBusinessForm } from "./new-business-form";

export const metadata: Metadata = { title: "New business" };

export default async function NewBusinessPage() {
  await requireSuperAdmin();
  return (
    <>
      <PageHeader
        title="New business"
        description="Creates the business with a starter website (unpublished). You can invite its administrator on the next screen."
      />
      <NewBusinessForm />
    </>
  );
}
