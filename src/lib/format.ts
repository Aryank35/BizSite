const dateFormat = new Intl.DateTimeFormat("en-IN", { day: "numeric", month: "short", year: "numeric" });
const dateTimeFormat = new Intl.DateTimeFormat("en-IN", {
  day: "numeric",
  month: "short",
  year: "numeric",
  hour: "numeric",
  minute: "2-digit",
});

export function formatDate(date: Date | string): string {
  return dateFormat.format(new Date(date));
}

export function formatDateTime(date: Date | string): string {
  return dateTimeFormat.format(new Date(date));
}

const relative = new Intl.RelativeTimeFormat("en", { numeric: "auto" });

/** "3 hours ago", "yesterday"… Only call during request-time rendering. */
export function timeAgo(date: Date | string, now: number = Date.now()): string {
  const seconds = Math.round((new Date(date).getTime() - now) / 1000);
  const steps: [Intl.RelativeTimeFormatUnit, number][] = [
    ["year", 31_536_000],
    ["month", 2_592_000],
    ["week", 604_800],
    ["day", 86_400],
    ["hour", 3_600],
    ["minute", 60],
  ];
  for (const [unit, size] of steps) {
    if (Math.abs(seconds) >= size) return relative.format(Math.round(seconds / size), unit);
  }
  return "just now";
}

export function auditActionLabel(action: string): string {
  const labels: Record<string, string> = {
    "business.created": "created a business",
    "business.settings_updated": "updated business settings",
    "business.suspended": "suspended a business",
    "business.activated": "activated a business",
    "business.deleted": "deleted a business",
    "business.admin_added": "added an administrator",
    "business.admin_invited": "invited an administrator",
    "business.admin_removed": "removed an administrator",
    "business.invitation_revoked": "revoked an invitation",
    "business.invitation_accepted": "accepted an invitation",
    "business.profile_updated": "updated a business profile",
    "business.manage_started": "opened a business dashboard",
    "website.published": "published a website",
    "website.unpublished": "unpublished a website",
    "platform.settings_updated": "updated platform settings",
    "platform.templates_updated": "updated template availability",
    "user.suspended": "suspended a user",
    "user.activated": "reactivated a user",
  };
  return labels[action] ?? action;
}
