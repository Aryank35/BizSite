import { cn } from "@/lib/utils";

type Tone = "green" | "amber" | "slate" | "red" | "blue";

const TONES: Record<Tone, string> = {
  green: "bg-emerald-50 text-emerald-700 ring-emerald-600/20",
  amber: "bg-amber-50 text-amber-800 ring-amber-600/20",
  slate: "bg-slate-100 text-slate-700 ring-slate-500/20",
  red: "bg-red-50 text-red-700 ring-red-600/20",
  blue: "bg-blue-50 text-blue-700 ring-blue-600/20",
};

const STATUS: Record<string, { label: string; tone: Tone }> = {
  ACTIVE: { label: "Active", tone: "green" },
  SUSPENDED: { label: "Suspended", tone: "red" },
  PUBLISHED: { label: "Published", tone: "green" },
  DRAFT: { label: "Draft", tone: "slate" },
  LIVE: { label: "Live", tone: "green" },
  OFFLINE: { label: "Not published", tone: "slate" },
  NEW: { label: "New", tone: "blue" },
  IN_PROGRESS: { label: "In progress", tone: "amber" },
  RESOLVED: { label: "Resolved", tone: "green" },
  SPAM: { label: "Spam", tone: "red" },
  OWNER: { label: "Owner", tone: "blue" },
  EDITOR: { label: "Editor", tone: "slate" },
  PENDING: { label: "Invited", tone: "amber" },
};

export function StatusBadge({ status, className }: { status: string; className?: string }) {
  const meta = STATUS[status] ?? { label: status, tone: "slate" as const };
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-xs font-medium whitespace-nowrap ring-1 ring-inset",
        TONES[meta.tone],
        className,
      )}
    >
      <span className="size-1.5 rounded-full bg-current" aria-hidden />
      {meta.label}
    </span>
  );
}

export const ENQUIRY_STATUS_LABELS = {
  NEW: "New",
  IN_PROGRESS: "In progress",
  RESOLVED: "Resolved",
  SPAM: "Spam",
} as const;
