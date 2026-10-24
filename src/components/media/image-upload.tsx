"use client";

import { ImagePlus, Loader2, Trash2 } from "lucide-react";
import Image from "next/image";
import { useId, useRef, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const ACCEPT = "image/jpeg,image/png,image/webp,image/gif";

export async function uploadImage(file: File): Promise<string | null> {
  if (file.size > 5 * 1024 * 1024) {
    toast.error("Images must be 5 MB or smaller");
    return null;
  }
  const body = new FormData();
  body.append("file", file);
  const response = await fetch("/api/uploads", { method: "POST", body });
  const data = (await response.json().catch(() => ({}))) as { url?: string; error?: string };
  if (!response.ok || !data.url) {
    toast.error(data.error ?? "Upload failed");
    return null;
  }
  return data.url;
}

/** Single image field: upload, preview and remove. */
export function ImageUpload({
  value,
  onChange,
  label = "Upload image",
  aspect = "aspect-video",
  className,
}: {
  value: string | null | undefined;
  onChange: (url: string | null) => void;
  label?: string;
  aspect?: string;
  className?: string;
}) {
  const inputId = useId();
  const input = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);

  async function handleFile(file: File | undefined) {
    if (!file) return;
    setBusy(true);
    const url = await uploadImage(file);
    setBusy(false);
    if (input.current) input.current.value = "";
    if (url) onChange(url);
  }

  return (
    <div className={cn("space-y-2", className)}>
      <div className={cn("relative overflow-hidden rounded-lg border bg-muted", aspect)}>
        {value ? (
          <Image src={value} alt="" fill sizes="320px" className="object-cover" />
        ) : (
          <label
            htmlFor={inputId}
            className="flex h-full cursor-pointer flex-col items-center justify-center gap-2 text-sm text-muted-foreground hover:bg-accent/60"
          >
            {busy ? <Loader2 className="size-5 animate-spin" /> : <ImagePlus className="size-5" />}
            <span>{busy ? "Uploading…" : label}</span>
          </label>
        )}
      </div>
      <input
        ref={input}
        id={inputId}
        type="file"
        accept={ACCEPT}
        className="sr-only"
        onChange={(e) => handleFile(e.target.files?.[0])}
        aria-label={label}
      />
      {value ? (
        <div className="flex gap-2">
          <Button type="button" variant="outline" size="sm" onClick={() => input.current?.click()} disabled={busy}>
            {busy ? <Loader2 className="animate-spin" /> : <ImagePlus />} Replace
          </Button>
          <Button type="button" variant="ghost" size="sm" onClick={() => onChange(null)} disabled={busy}>
            <Trash2 /> Remove
          </Button>
        </div>
      ) : (
        <p className="text-xs text-muted-foreground">JPEG, PNG, WebP or GIF, up to 5 MB.</p>
      )}
    </div>
  );
}
