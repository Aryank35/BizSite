import { Clock, Mail, ShieldCheck } from "lucide-react";
import type { Metadata } from "next";
import { Suspense } from "react";
import { WebsiteRequestForm } from "./website-request-form";

export const metadata: Metadata = {
  title: "Request a website",
  description: "Tell us about your business and we will set up your BizSite website.",
  alternates: { canonical: "/contact" },
};

export default function ContactPage() {
  return (
    <div className="mx-auto grid max-w-6xl gap-12 px-5 py-20 lg:grid-cols-[1fr_1.2fr]">
      <div className="space-y-6">
        <h1 className="text-4xl font-semibold tracking-tight text-balance">Request a website for your business</h1>
        <p className="text-lg text-muted-foreground">Share a few details and our team will get in touch to set up your account and starter website.</p>
        <ul className="space-y-4 text-sm">
          <li className="flex gap-3">
            <Clock className="size-5 shrink-0 text-primary" aria-hidden />
            <span>We reply within one working day.</span>
          </li>
          <li className="flex gap-3">
            <Mail className="size-5 shrink-0 text-primary" aria-hidden />
            <span>You receive an invitation link to create your login.</span>
          </li>
          <li className="flex gap-3">
            <ShieldCheck className="size-5 shrink-0 text-primary" aria-hidden />
            <span>Your details are only used to contact you about BizSite.</span>
          </li>
        </ul>
      </div>
      <div className="rounded-2xl border bg-card p-6 shadow-sm sm:p-8">
        <Suspense>
          <WebsiteRequestForm />
        </Suspense>
      </div>
    </div>
  );
}
