export function SiteSkeleton() {
  return (
    <div className="min-h-svh animate-pulse bg-white" aria-busy="true" aria-label="Loading">
      <div className="h-16 border-b bg-neutral-50" />
      <div className="mx-auto grid max-w-6xl gap-10 px-8 py-20 lg:grid-cols-2">
        <div className="space-y-4">
          <div className="h-12 w-4/5 rounded-lg bg-neutral-100" />
          <div className="h-5 w-3/5 rounded bg-neutral-100" />
          <div className="h-11 w-40 rounded-full bg-neutral-100" />
        </div>
        <div className="aspect-[4/3] rounded-3xl bg-neutral-100" />
      </div>
    </div>
  );
}
