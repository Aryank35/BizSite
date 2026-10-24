import { PauseCircle } from "lucide-react";
import type { Metadata } from "next";
import { NoticePage } from "@/components/app/notice-page";
import { SignOutButton } from "@/components/app/sign-out-button";

export const metadata: Metadata = { title: "Account suspended", robots: { index: false } };

export default function BusinessSuspendedPage() {
  return (
    <NoticePage icon={PauseCircle} title="This business is suspended" actions={<SignOutButton />}>
      Access to the dashboard has been paused by the platform administrator and the website is offline. Please get in
      touch with them to restore access.
    </NoticePage>
  );
}
