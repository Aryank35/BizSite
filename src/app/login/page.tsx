import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { BrandMark } from "@/components/marketing/brand";
import { LoginForm } from "./login-form";

export const metadata: Metadata = { title: "Sign in", robots: { index: false, follow: false } };

export default function LoginPage() {
  return (
    <div className="grid min-h-svh lg:grid-cols-2">
      <aside className="relative hidden overflow-hidden bg-[oklch(0.2_0.025_262)] p-12 text-white lg:flex lg:flex-col lg:justify-between">
        <Link href="/" className="flex items-center gap-2 font-semibold">
          <BrandMark className="size-8" /> BizSite
        </Link>
        <div className="max-w-md space-y-4">
          <p className="text-3xl leading-tight font-semibold text-balance">
            Your catalogue, your enquiries, your website — managed in one place.
          </p>
          <p className="text-white/70">
            Update products, change your homepage and reply to customers without waiting on a developer.
          </p>
        </div>
        <p className="text-sm text-white/50">Accounts are created by invitation from your platform administrator.</p>
        <div className="pointer-events-none absolute -right-24 -bottom-24 size-96 rounded-full bg-[oklch(0.47_0.16_262)] opacity-30 blur-3xl" />
      </aside>
      <main className="flex items-center justify-center px-6 py-16">
        <div className="w-full max-w-sm space-y-8">
          <div className="space-y-2">
            <Link href="/" className="flex items-center gap-2 font-semibold lg:hidden">
              <BrandMark className="size-7" /> BizSite
            </Link>
            <h1 className="text-2xl font-semibold tracking-tight">Sign in</h1>
            <p className="text-sm text-muted-foreground">Welcome back. Enter the email and password for your account.</p>
          </div>
          <Suspense>
            <LoginForm />
          </Suspense>
          <p className="text-center text-sm text-muted-foreground">
            New to BizSite?{" "}
            <Link href="/contact" className="font-medium text-primary hover:underline">
              Request a website
            </Link>
          </p>
        </div>
      </main>
    </div>
  );
}
