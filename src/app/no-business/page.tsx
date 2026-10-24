import { Building2 } from "lucide-react";
import type { Metadata } from "next";
import { NoticePage } from "@/components/app/notice-page";
import { SignOutButton } from "@/components/app/sign-out-button";

export const metadata: Metadata = { title: "No business assigned", robots: { index: false } };

export default function NoBusinessPage() {
  return (
    <NoticePage icon={Building2} title="No business assigned yet" actions={<SignOutButton />}>
      Your account is not connected to a business. Please contact your platform administrator to be added.
    </NoticePage>
  );
}
