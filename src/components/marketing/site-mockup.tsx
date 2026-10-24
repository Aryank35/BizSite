/** Illustration of a business website inside a browser frame (pure HTML, no images). */
export function SiteMockup() {
  return (
    <div aria-hidden className="overflow-hidden rounded-2xl border bg-white shadow-2xl shadow-primary/10">
      <div className="flex items-center gap-2 border-b bg-muted/60 px-4 py-2.5">
        <span className="size-2.5 rounded-full bg-red-300" />
        <span className="size-2.5 rounded-full bg-amber-300" />
        <span className="size-2.5 rounded-full bg-emerald-300" />
        <span className="ml-3 truncate rounded-md bg-background px-3 py-0.5 text-xs text-muted-foreground">yourbusiness.bizsite.in</span>
      </div>
      <div className="flex items-center justify-between px-5 py-3 text-xs">
        <span className="font-semibold text-[#7c2d12]">Royal Furniture</span>
        <span className="flex gap-3 text-neutral-500">
          <span>Products</span>
          <span>About</span>
          <span className="rounded-full bg-[#7c2d12] px-2.5 py-0.5 font-semibold text-white">Enquire</span>
        </span>
      </div>
      <div className="grid grid-cols-2 gap-4 bg-[#fbf3ef] px-5 py-6">
        <div className="space-y-2">
          <div className="h-3 w-4/5 rounded bg-neutral-800" />
          <div className="h-3 w-3/5 rounded bg-neutral-800" />
          <div className="h-2 w-full rounded bg-neutral-300" />
          <div className="h-2 w-4/5 rounded bg-neutral-300" />
          <div className="mt-3 h-5 w-24 rounded-full bg-[#7c2d12]" />
        </div>
        <div className="rounded-xl bg-[radial-gradient(circle_at_30%_20%,#d97706,#7c2d12_65%)]" />
      </div>
      <div className="grid grid-cols-3 gap-3 px-5 py-5">
        {["Sheesham Sofa", "Teak Coffee Table", "King Bed"].map((name, i) => (
          <div key={name} className="space-y-1.5 rounded-lg ring-1 ring-black/5">
            <div className={`aspect-[4/3] rounded-t-lg ${["bg-amber-100", "bg-orange-100", "bg-stone-200"][i]}`} />
            <div className="space-y-1 px-2 pb-2">
              <div className="truncate text-[10px] font-medium text-neutral-800">{name}</div>
              <div className="h-1.5 w-1/2 rounded bg-neutral-300" />
            </div>
          </div>
        ))}
      </div>
      <div className="flex items-center justify-between bg-[#1c1917] px-5 py-3 text-[10px] text-white/70">
        <span>Janpath Road, Bhubaneswar</span>
        <span className="rounded-full bg-[#25D366] px-2 py-0.5 font-semibold text-[#0b2e13]">WhatsApp</span>
      </div>
    </div>
  );
}
