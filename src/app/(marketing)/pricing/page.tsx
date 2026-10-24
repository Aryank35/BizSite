import { Check } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Pricing",
  description: "Plans for single shops, growing showrooms and multi-location businesses.",
  alternates: { canonical: "/pricing" },
};

const PLANS = [
  {
    name: "Starter",
    audience: "A single shop getting online",
    features: ["Catalogue website with both templates", "Up to 50 products", "Enquiry inbox", "WhatsApp buttons", "BizSite web address"],
  },
  {
    name: "Growth",
    audience: "Showrooms with a larger range",
    highlighted: true,
    features: ["Everything in Starter", "Unlimited products and categories", "Image galleries on every product", "Owner and editor accounts", "Priority support"],
  },
  {
    name: "Managed",
    audience: "Businesses that want it done for them",
    features: ["Everything in Growth", "We upload your catalogue", "Seasonal homepage updates", "Help with photography briefs"],
  },
];

export default function PricingPage() {
  return (
    <div className="mx-auto max-w-6xl space-y-14 px-5 py-20">
      <div className="mx-auto max-w-2xl space-y-4 text-center">
        <h1 className="text-4xl font-semibold tracking-tight">Simple plans, set up for you</h1>
        <p className="text-lg text-muted-foreground">
          Every website is set up by our team, so we agree pricing with you directly. Tell us which plan fits and we will send a quote.
        </p>
      </div>
      <ul className="grid gap-6 lg:grid-cols-3">
        {PLANS.map((plan) => (
          <li
            key={plan.name}
            className={cn("flex flex-col gap-6 rounded-2xl border bg-card p-7", plan.highlighted && "border-primary shadow-lg ring-1 ring-primary")}
          >
            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold">{plan.name}</h2>
                {plan.highlighted ? <span className="rounded-full bg-primary px-2.5 py-0.5 text-xs font-medium text-primary-foreground">Most popular</span> : null}
              </div>
              <p className="text-sm text-muted-foreground">{plan.audience}</p>
            </div>
            <ul className="flex-1 space-y-2.5 text-sm">
              {plan.features.map((f) => (
                <li key={f} className="flex gap-2">
                  <Check className="mt-0.5 size-4 shrink-0 text-primary" aria-hidden /> {f}
                </li>
              ))}
            </ul>
            <Button asChild variant={plan.highlighted ? "default" : "outline"} className="h-10">
              <Link href={`/contact?plan=${plan.name.toLowerCase()}`}>Get a quote</Link>
            </Button>
          </li>
        ))}
      </ul>
      <p className="text-center text-sm text-muted-foreground">Online payments are not part of BizSite websites — customers contact you directly.</p>
    </div>
  );
}
