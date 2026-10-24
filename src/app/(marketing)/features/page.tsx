import { Check, Eye, FileSearch, Inbox, LayoutList, Lock, MessageCircle, Package, Palette, Smartphone } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export const metadata: Metadata = {
  title: "Features",
  description: "Product catalogue, enquiry inbox, WhatsApp buttons, templates and a draft-and-publish website editor.",
  alternates: { canonical: "/features" },
};

const GROUPS = [
  {
    icon: Package,
    title: "Product catalogue",
    points: ["Unlimited categories", "Photo galleries for each product", "Show a price or “contact for price”", "Featured products on your homepage", "Draft products stay private until published"],
  },
  {
    icon: LayoutList,
    title: "Section-based website editor",
    points: ["14 ready-made sections", "Turn sections on or off", "Reorder with one click", "Edit text and images in place"],
  },
  {
    icon: Palette,
    title: "Templates & branding",
    points: ["Modern Catalogue and Professional Business templates", "Your colours, fonts and logo", "Readable button colours chosen automatically"],
  },
  {
    icon: Eye,
    title: "Preview, then publish",
    points: ["Changes are saved as a draft", "Preview exactly what visitors will see", "Publish when ready — the live site never changes by accident", "Full publishing history"],
  },
  {
    icon: Inbox,
    title: "Enquiry inbox",
    points: ["Enquiries linked to the product they are about", "New, in progress and resolved statuses", "Reply by phone, email or WhatsApp in one click", "Spam protection built in"],
  },
  {
    icon: MessageCircle,
    title: "WhatsApp",
    points: ["Click-to-chat on every product page", "Pre-written messages that mention the product", "A dedicated WhatsApp call-to-action section"],
  },
  {
    icon: Smartphone,
    title: "Fast on every device",
    points: ["Designed for phones first", "Optimised, responsive images", "Server-rendered pages"],
  },
  {
    icon: FileSearch,
    title: "Found on search engines",
    points: ["Page titles and descriptions per product", "Sitemap generated automatically", "Social sharing previews"],
  },
  {
    icon: Lock,
    title: "Secure by design",
    points: ["Each business sees only its own data", "Invitation-only accounts", "Audit trail of administrative actions"],
  },
];

export default function FeaturesPage() {
  return (
    <div className="mx-auto max-w-6xl space-y-14 px-5 py-20">
      <div className="max-w-2xl space-y-4">
        <h1 className="text-4xl font-semibold tracking-tight text-balance">Everything you need to show your products and win enquiries</h1>
        <p className="text-lg text-muted-foreground">
          BizSite is a catalogue and enquiry platform — not a complicated online shop. Customers browse, then contact you.
        </p>
      </div>
      <ul className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {GROUPS.map(({ icon: Icon, title, points }) => (
          <li key={title} className="space-y-4 rounded-2xl border bg-card p-6">
            <span className="flex size-10 items-center justify-center rounded-lg bg-accent text-accent-foreground">
              <Icon className="size-5" aria-hidden />
            </span>
            <h2 className="text-lg font-semibold">{title}</h2>
            <ul className="space-y-2 text-sm text-muted-foreground">
              {points.map((point) => (
                <li key={point} className="flex gap-2">
                  <Check className="mt-0.5 size-4 shrink-0 text-primary" aria-hidden /> {point}
                </li>
              ))}
            </ul>
          </li>
        ))}
      </ul>
      <div className="flex justify-center">
        <Button asChild size="lg" className="h-11 px-6">
          <Link href="/contact">Request a website</Link>
        </Button>
      </div>
    </div>
  );
}
