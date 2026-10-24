import {
  ArrowRight,
  Armchair,
  DoorOpen,
  Globe,
  Inbox,
  LayoutTemplate,
  MessageCircle,
  Package,
  Palette,
  Shirt,
  Sofa,
  Tv,
  Truck,
  Wrench,
} from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { SiteMockup } from "@/components/marketing/site-mockup";
import { Button } from "@/components/ui/button";

export const metadata: Metadata = {
  title: { absolute: "BizSite — Catalogue websites for local businesses" },
  alternates: { canonical: "/" },
};

const BUSINESS_TYPES = [
  { icon: Sofa, label: "Furniture shops" },
  { icon: Shirt, label: "Clothing stores" },
  { icon: DoorOpen, label: "Window & door makers" },
  { icon: Armchair, label: "Interior designers" },
  { icon: Tv, label: "Electronics retailers" },
  { icon: Truck, label: "Wholesalers" },
  { icon: Wrench, label: "Local services" },
];

const STEPS = [
  { title: "We set you up", body: "Tell us about your business. We create your account and a starter website in your colours." },
  { title: "Add your products", body: "Upload photos, write descriptions, and choose whether to show prices or “contact for price”." },
  { title: "Publish and get enquiries", body: "Go live with one click. Enquiries land in your dashboard and customers can WhatsApp you directly." },
];

const FEATURES = [
  { icon: Package, title: "Product catalogue", body: "Categories, photo galleries, featured products and search-friendly product pages." },
  { icon: Inbox, title: "Enquiries in one inbox", body: "Every enquiry is saved with the product it was about. Track new, in-progress and resolved." },
  { icon: MessageCircle, title: "WhatsApp built in", body: "Click-to-chat buttons with a pre-written message, on every product." },
  { icon: Palette, title: "Your brand", body: "Pick a template, set your colours, fonts and logo. Preview before you publish." },
];

export default function HomePage() {
  return (
    <>
      <section className="relative overflow-hidden">
        <div className="pointer-events-none absolute inset-x-0 -top-40 -z-10 h-[32rem] bg-[radial-gradient(ellipse_at_top,oklch(0.47_0.16_262/0.12),transparent_65%)]" />
        <div className="mx-auto grid max-w-6xl items-center gap-14 px-5 py-20 lg:grid-cols-[1.05fr_1fr] lg:py-28">
          <div className="space-y-7">
            <p className="inline-flex items-center gap-2 rounded-full border bg-card px-3 py-1 text-xs font-medium text-muted-foreground">
              <Globe className="size-3.5 text-primary" /> For shops, showrooms and manufacturers
            </p>
            <h1 className="text-4xl leading-[1.08] font-semibold tracking-tight text-balance sm:text-5xl lg:text-6xl">
              A professional website for your business — without the agency.
            </h1>
            <p className="max-w-xl text-lg text-muted-foreground">
              BizSite gives your business a product catalogue, an enquiry form and WhatsApp buttons, all managed from one simple
              dashboard. You update the products; we handle the rest.
            </p>
            <div className="flex flex-wrap gap-3">
              <Button asChild size="lg" className="h-11 px-5">
                <Link href="/contact">
                  Request your website <ArrowRight />
                </Link>
              </Button>
              <Button asChild size="lg" variant="outline" className="h-11 px-5">
                <Link href="/features">See what is included</Link>
              </Button>
            </div>
          </div>
          <SiteMockup />
        </div>
      </section>

      <section className="border-y bg-card">
        <div className="mx-auto max-w-6xl px-5 py-10">
          <p className="mb-6 text-center text-sm font-medium text-muted-foreground">Built for businesses that sell through conversations</p>
          <ul className="flex flex-wrap justify-center gap-3">
            {BUSINESS_TYPES.map(({ icon: Icon, label }) => (
              <li key={label} className="flex items-center gap-2 rounded-full border bg-background px-4 py-2 text-sm">
                <Icon className="size-4 text-primary" aria-hidden /> {label}
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-5 py-20">
        <div className="mb-12 max-w-2xl space-y-3">
          <h2 className="text-3xl font-semibold tracking-tight">Live in three steps</h2>
          <p className="text-muted-foreground">No design skills or developers needed. Most businesses are online within a day.</p>
        </div>
        <ol className="grid gap-6 md:grid-cols-3">
          {STEPS.map((step, index) => (
            <li key={step.title} className="space-y-3 rounded-2xl border bg-card p-6">
              <span className="flex size-9 items-center justify-center rounded-full bg-primary text-sm font-semibold text-primary-foreground">{index + 1}</span>
              <h3 className="text-lg font-semibold">{step.title}</h3>
              <p className="text-sm text-muted-foreground">{step.body}</p>
            </li>
          ))}
        </ol>
      </section>

      <section className="bg-[oklch(0.2_0.025_262)] text-white">
        <div className="mx-auto max-w-6xl px-5 py-20">
          <div className="mb-12 flex flex-col justify-between gap-6 md:flex-row md:items-end">
            <div className="max-w-2xl space-y-3">
              <h2 className="text-3xl font-semibold tracking-tight">Everything a catalogue business needs</h2>
              <p className="text-white/70">Not an online shop — a website that turns visitors into conversations.</p>
            </div>
            <Button asChild variant="secondary">
              <Link href="/features">
                <LayoutTemplate /> All features
              </Link>
            </Button>
          </div>
          <ul className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {FEATURES.map(({ icon: Icon, title, body }) => (
              <li key={title} className="space-y-3 rounded-2xl bg-white/5 p-6 ring-1 ring-white/10">
                <Icon className="size-6 text-[oklch(0.78_0.12_262)]" aria-hidden />
                <h3 className="font-semibold">{title}</h3>
                <p className="text-sm text-white/70">{body}</p>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-5 py-20">
        <div className="flex flex-col items-start justify-between gap-6 rounded-3xl border bg-card p-10 md:flex-row md:items-center">
          <div className="space-y-2">
            <h2 className="text-2xl font-semibold tracking-tight">Ready to bring your showroom online?</h2>
            <p className="text-muted-foreground">Tell us about your business and we will get back to you within one working day.</p>
          </div>
          <Button asChild size="lg" className="h-11 px-5">
            <Link href="/contact">
              Request a website <ArrowRight />
            </Link>
          </Button>
        </div>
      </section>
    </>
  );
}
