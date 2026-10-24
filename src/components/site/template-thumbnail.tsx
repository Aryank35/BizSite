import type { TemplateKey } from "@/lib/website/theme";

/** Schematic preview of a template's layout, used in pickers. */
export function TemplateThumbnail({ template, primary = "#1f4d3a", accent = "#d97706" }: { template: TemplateKey; primary?: string; accent?: string }) {
  if (template === "PROFESSIONAL_BUSINESS") {
    return (
      <svg viewBox="0 0 160 100" className="h-auto w-full rounded-md border bg-white" aria-hidden>
        <rect width="160" height="12" fill="#0f172a" />
        <rect x="8" y="4" width="22" height="4" rx="1" fill="#fff" />
        <rect x="118" y="3" width="34" height="6" rx="1" fill={accent} />
        <rect y="12" width="160" height="40" fill={primary} />
        <rect x="12" y="22" width="70" height="6" rx="1" fill="#fff" />
        <rect x="12" y="32" width="50" height="3" rx="1" fill="#ffffff99" />
        <rect x="12" y="40" width="24" height="6" rx="1" fill={accent} />
        {[0, 1, 2].map((i) => (
          <g key={i}>
            <rect x={12 + i * 48} y="60" width="40" height="26" rx="2" fill="#f1f5f9" stroke="#e2e8f0" />
            <rect x={16 + i * 48} y="64" width="8" height="8" rx="1" fill={primary} />
            <rect x={16 + i * 48} y="76" width="28" height="3" rx="1" fill="#94a3b8" />
          </g>
        ))}
        <rect y="92" width="160" height="8" fill="#0f172a" />
      </svg>
    );
  }
  return (
    <svg viewBox="0 0 160 100" className="h-auto w-full rounded-md border bg-white" aria-hidden>
      <rect x="8" y="5" width="22" height="4" rx="2" fill={primary} />
      <rect x="100" y="5" width="12" height="3" rx="1.5" fill="#cbd5e1" />
      <rect x="116" y="5" width="12" height="3" rx="1.5" fill="#cbd5e1" />
      <rect x="132" y="3" width="20" height="7" rx="3.5" fill={primary} />
      <rect x="8" y="20" width="62" height="7" rx="2" fill="#0f172a" />
      <rect x="8" y="31" width="50" height="3" rx="1.5" fill="#94a3b8" />
      <rect x="8" y="40" width="26" height="8" rx="4" fill={primary} />
      <rect x="80" y="16" width="72" height="36" rx="6" fill={`${primary}33`} />
      {[0, 1, 2, 3].map((i) => (
        <g key={i}>
          <rect x={8 + i * 37} y="60" width="33" height="24" rx="5" fill="#f1f5f9" />
          <rect x={8 + i * 37} y="87" width="24" height="3" rx="1.5" fill="#94a3b8" />
        </g>
      ))}
    </svg>
  );
}
