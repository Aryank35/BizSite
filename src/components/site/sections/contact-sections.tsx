import { Clock, Mail, MapPin, MessageCircle, Phone } from "lucide-react";
import type { ReactNode } from "react";
import { cn } from "@/lib/utils";
import type { RenderSection } from "@/lib/website/snapshot";
import { Container, SectionIntro, SiteButton, SiteHeading } from "@/components/site/primitives";
import { addressLines, summariseHours } from "@/components/site/site-frame";
import { siteLinks, type SiteContext } from "@/components/site/site-context";
import { TEMPLATE_STYLES } from "@/components/site/template-styles";
import { EnquiryForm } from "@/components/site/enquiry-form";

type Section<T extends RenderSection["type"]> = Extract<RenderSection, { type: T }>;

function InfoCard({ ctx, icon: Icon, title, children }: { ctx: SiteContext; icon: typeof Phone; title: string; children: ReactNode }) {
  const t = TEMPLATE_STYLES[ctx.template];
  return (
    <div className={cn("space-y-3 p-6", t.card)}>
      <span className="flex size-10 items-center justify-center rounded-full bg-[var(--site-primary-soft)] text-[var(--site-primary)]">
        <Icon className="size-5" aria-hidden />
      </span>
      <h3 className="font-semibold text-neutral-900">{title}</h3>
      <div className="space-y-1 text-sm text-neutral-600">{children}</div>
    </div>
  );
}

export function ContactInfoSection({ ctx, section }: { ctx: SiteContext; section: Section<"CONTACT_INFO"> }) {
  const { business } = ctx;
  const { showAddress, showPhone, showEmail, showHours } = section.content;
  const address = addressLines(business);
  const mapsUrl = address.length ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent([business.name, ...address].join(", "))}` : null;

  const cards: ReactNode[] = [];
  if (showAddress && address.length) {
    cards.push(
      <InfoCard key="address" ctx={ctx} icon={MapPin} title="Visit us">
        {address.map((line) => (
          <p key={line}>{line}</p>
        ))}
        {mapsUrl ? (
          <a href={mapsUrl} target="_blank" rel="noopener noreferrer" className="inline-block pt-2 font-medium text-[var(--site-primary)] hover:underline">
            Get directions
          </a>
        ) : null}
      </InfoCard>,
    );
  }
  if ((showPhone && business.phone) || (showEmail && business.email)) {
    cards.push(
      <InfoCard key="contact" ctx={ctx} icon={Phone} title="Call or email">
        {showPhone && business.phone ? (
          <p>
            <a href={`tel:${business.phone.replace(/[^\d+]/g, "")}`} className="hover:underline">
              {business.phone}
            </a>
          </p>
        ) : null}
        {showEmail && business.email ? (
          <p className="flex items-center gap-1.5 break-all">
            <Mail className="size-3.5 shrink-0" aria-hidden />
            <a href={`mailto:${business.email}`} className="hover:underline">
              {business.email}
            </a>
          </p>
        ) : null}
      </InfoCard>,
    );
  }
  if (showHours && business.openingHours) {
    cards.push(
      <InfoCard key="hours" ctx={ctx} icon={Clock} title="Opening hours">
        <dl className="space-y-1">
          {summariseHours(business.openingHours).map((row) => (
            <div key={row.days} className="flex justify-between gap-4">
              <dt>{row.days}</dt>
              <dd className="tabular-nums">{row.time}</dd>
            </div>
          ))}
        </dl>
      </InfoCard>,
    );
  }
  if (cards.length === 0) return null;

  return (
    <section id="contact" className="scroll-mt-20 py-16 sm:py-24">
      <Container>
        <SectionIntro ctx={ctx} eyebrow="Contact" title={section.title} subtitle={section.subtitle} />
        <div className={cn("grid gap-6", cards.length > 1 && "md:grid-cols-2", cards.length > 2 && "lg:grid-cols-3")}>{cards}</div>
      </Container>
    </section>
  );
}

export function WhatsappCtaSection({ ctx, section }: { ctx: SiteContext; section: Section<"WHATSAPP_CTA"> }) {
  const href = siteLinks(ctx).whatsapp(section.content.prefilledMessage);
  if (!href) return null;
  return (
    <section className="py-12">
      <Container>
        <div className="flex flex-col items-start justify-between gap-6 rounded-3xl bg-[var(--site-secondary)] p-8 text-[var(--site-on-secondary)] sm:flex-row sm:items-center sm:p-12">
          <div className="space-y-2">
            {section.title ? <SiteHeading className="text-2xl font-semibold sm:text-3xl">{section.title}</SiteHeading> : null}
            {section.subtitle ? <p className="opacity-80">{section.subtitle}</p> : null}
          </div>
          <SiteButton ctx={ctx} href={href} variant="whatsapp" className="h-12 px-7 text-base">
            <MessageCircle className="size-5" aria-hidden /> {section.content.buttonLabel}
          </SiteButton>
        </div>
      </Container>
    </section>
  );
}

export function EnquirySection({
  ctx,
  section,
  productSlug,
}: {
  ctx: SiteContext;
  section: Section<"ENQUIRY_FORM">;
  productSlug?: string;
}) {
  const t = TEMPLATE_STYLES[ctx.template];
  if (!ctx.business.enquiriesEnabled) return null;
  return (
    <section id="enquire" className={cn("scroll-mt-20 py-16 sm:py-24", t.altSection)}>
      <Container className="grid gap-10 lg:grid-cols-[1fr_1.2fr]">
        <div>
          <SectionIntro ctx={ctx} eyebrow="Enquiry" title={section.title} subtitle={section.subtitle} />
          <p className="text-sm text-neutral-600">We usually reply within one working day.</p>
        </div>
        <div className={cn("p-6 sm:p-8", t.card)}>
          <EnquiryForm
            businessSlug={ctx.business.slug}
            productSlug={productSlug}
            submitLabel={section.content.submitLabel}
            successMessage={section.content.successMessage}
            buttonClassName={t.button}
            disabled={ctx.mode === "preview"}
          />
        </div>
      </Container>
    </section>
  );
}
