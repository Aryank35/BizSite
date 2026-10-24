import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";
import { BrandMark } from "@/components/marketing/brand";

export function NoticePage({
  icon: Icon,
  title,
  children,
  actions,
}: {
  icon: LucideIcon;
  title: string;
  children: ReactNode;
  actions?: ReactNode;
}) {
  return (
    <main className="flex min-h-svh items-center justify-center bg-muted/40 px-6 py-16">
      <div className="w-full max-w-md space-y-5 rounded-2xl border bg-card p-8 text-center shadow-sm">
        <BrandMark className="mx-auto size-8" />
        <span className="mx-auto flex size-11 items-center justify-center rounded-full bg-muted">
          <Icon className="size-5 text-muted-foreground" aria-hidden />
        </span>
        <h1 className="text-xl font-semibold">{title}</h1>
        <div className="text-sm text-muted-foreground">{children}</div>
        {actions ? <div className="flex justify-center gap-2">{actions}</div> : null}
      </div>
    </main>
  );
}
