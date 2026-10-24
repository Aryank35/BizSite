import { MailX } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { BrandMark } from "@/components/marketing/brand";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { getInvitationPreview } from "@/server/services/invitations";
import { AcceptInvitationForm } from "./accept-form";

export const metadata: Metadata = { title: "Accept invitation", robots: { index: false, follow: false } };

async function Invitation({ params }: { params: PageProps<"/invite/[token]">["params"] }) {
  const { token } = await params;
  const invitation = await getInvitationPreview(token);

  if (!invitation) {
    return (
      <div className="space-y-4 text-center">
        <span className="mx-auto flex size-11 items-center justify-center rounded-full bg-muted">
          <MailX className="size-5 text-muted-foreground" />
        </span>
        <h1 className="text-xl font-semibold">This invitation is no longer valid</h1>
        <p className="text-sm text-muted-foreground">
          It may have expired, been used already or been withdrawn. Ask your platform administrator for a new link.
        </p>
        <Button asChild variant="outline">
          <Link href="/login">Go to sign in</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <h1 className="text-2xl font-semibold tracking-tight">Join {invitation.businessName}</h1>
        <p className="text-sm text-muted-foreground">
          You have been invited to manage the website for <strong className="text-foreground">{invitation.businessName}</strong>.
          Choose a password to finish setting up your account for <strong className="text-foreground">{invitation.email}</strong>.
        </p>
      </div>
      <AcceptInvitationForm token={token} defaultName={invitation.name ?? ""} />
    </div>
  );
}

export default function InvitePage(props: PageProps<"/invite/[token]">) {
  return (
    <main className="flex min-h-svh items-center justify-center bg-muted/40 px-6 py-16">
      <div className="w-full max-w-md space-y-8 rounded-2xl border bg-card p-8 shadow-sm">
        <Link href="/" className="flex items-center gap-2 font-semibold">
          <BrandMark className="size-7" /> BizSite
        </Link>
        <Suspense fallback={<div className="space-y-3"><Skeleton className="h-8 w-2/3" /><Skeleton className="h-16" /><Skeleton className="h-40" /></div>}>
          <Invitation params={props.params} />
        </Suspense>
      </div>
    </main>
  );
}
