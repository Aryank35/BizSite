"use client";

import { ArrowLeft, ArrowRight, ImagePlus, Loader2, X } from "lucide-react";
import Image from "next/image";
import { useId, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { uploadImage } from "@/components/media/image-upload";

export type GalleryItem = { url: string; alt: string | null };

/** Ordered list of images with alt text, used for product galleries and the gallery section. */
export function GalleryUpload({
  value,
  onChange,
  max,
}: {
  value: GalleryItem[];
  onChange: (items: GalleryItem[]) => void;
  max: number;
}) {
  const inputId = useId();
  const input = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);

  async function handleFiles(files: FileList | null) {
    if (!files) return;
    setBusy(true);
    const added: GalleryItem[] = [];
    for (const file of Array.from(files).slice(0, max - value.length)) {
      const url = await uploadImage(file);
      if (url) added.push({ url, alt: null });
    }
    setBusy(false);
    if (input.current) input.current.value = "";
    if (added.length) onChange([...value, ...added]);
  }

  function move(index: number, delta: number) {
    const next = [...value];
    const [item] = next.splice(index, 1);
    next.splice(index + delta, 0, item);
    onChange(next);
  }

  return (
    <div className="space-y-3">
      {value.length > 0 ? (
        <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
          {value.map((item, index) => (
            <li key={item.url} className="space-y-2 rounded-lg border bg-card p-2">
              <div className="relative aspect-square overflow-hidden rounded-md bg-muted">
                <Image src={item.url} alt={item.alt ?? ""} fill sizes="200px" className="object-cover" />
              </div>
              <Input
                value={item.alt ?? ""}
                onChange={(e) => onChange(value.map((v, i) => (i === index ? { ...v, alt: e.target.value } : v)))}
                placeholder="Describe the image"
                aria-label={`Alt text for image ${index + 1}`}
                maxLength={160}
              />
              <div className="flex justify-between">
                <div className="flex gap-1">
                  <Button type="button" size="icon-sm" variant="ghost" disabled={index === 0} onClick={() => move(index, -1)} aria-label="Move earlier">
                    <ArrowLeft />
                  </Button>
                  <Button type="button" size="icon-sm" variant="ghost" disabled={index === value.length - 1} onClick={() => move(index, 1)} aria-label="Move later">
                    <ArrowRight />
                  </Button>
                </div>
                <Button type="button" size="icon-sm" variant="ghost" onClick={() => onChange(value.filter((_, i) => i !== index))} aria-label="Remove image">
                  <X />
                </Button>
              </div>
            </li>
          ))}
        </ul>
      ) : null}
      {value.length < max ? (
        <label
          htmlFor={inputId}
          className="flex cursor-pointer items-center justify-center gap-2 rounded-lg border border-dashed py-6 text-sm text-muted-foreground hover:bg-accent/60"
        >
          {busy ? <Loader2 className="size-4 animate-spin" /> : <ImagePlus className="size-4" />}
          {busy ? "Uploading…" : `Add images (${value.length}/${max})`}
        </label>
      ) : null}
      <input
        ref={input}
        id={inputId}
        type="file"
        multiple
        accept="image/jpeg,image/png,image/webp,image/gif"
        className="sr-only"
        onChange={(e) => handleFiles(e.target.files)}
      />
    </div>
  );
}
