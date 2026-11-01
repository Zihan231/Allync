/** Placeholder with the shape of a coach card (photo, name, tags, stats, buttons) while the list loads. */
export function CoachCardSkeleton() {
  return (
    <div className="flex animate-pulse flex-col rounded-2xl border border-surface-line bg-surface/50 p-4" aria-hidden="true">
      <div className="flex items-center gap-3">
        <div className="h-11 w-11 shrink-0 rounded-full bg-surface-line/80" />
        <div className="min-w-0 flex-1 space-y-2">
          <div className="h-4 w-2/3 rounded-md bg-surface-line/90" />
          <div className="h-3 w-5/6 rounded-md bg-surface-line/60" />
        </div>
      </div>
      <div className="mt-3 flex gap-1.5">
        <div className="h-5 w-16 rounded-full bg-blue/15" />
        <div className="h-5 w-20 rounded-full bg-blue/15" />
        <div className="h-5 w-12 rounded-full bg-blue/15" />
      </div>
      <div className="mt-3 flex gap-3">
        <div className="h-3 w-20 rounded-md bg-surface-line/60" />
        <div className="h-3 w-24 rounded-md bg-surface-line/60" />
      </div>
      <div className="mt-4 flex gap-2 pt-1">
        <div className="h-7 flex-1 rounded-full bg-surface-line/70" />
        <div className="h-7 flex-1 rounded-full bg-accent/20" />
      </div>
    </div>
  );
}
