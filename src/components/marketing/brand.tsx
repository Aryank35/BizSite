import { cn } from "@/lib/utils";

/** BizSite logo mark: a storefront awning on a rounded square. */
export function BrandMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 32 32" className={cn("shrink-0", className)} aria-hidden>
      <rect width="32" height="32" rx="8" fill="oklch(0.47 0.16 262)" />
      <path d="M7 12.5 9 8h14l2 4.5a3 3 0 0 1-6 0 3 3 0 0 1-6 0 3 3 0 0 1-6 0Z" fill="#fff" />
      <path d="M9 17v7h14v-7" fill="none" stroke="#fff" strokeWidth="2" strokeLinejoin="round" />
      <path d="M14 24v-4h4v4" fill="none" stroke="#fff" strokeWidth="2" strokeLinejoin="round" />
    </svg>
  );
}
