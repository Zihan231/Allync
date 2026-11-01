/** A feed post's shape while it loads. */
export function FeedCardSkeleton({ media = false }: { media?: boolean }) {
  return (
    <div className="-mx-4 animate-pulse border-y border-surface-line bg-surface/60 sm:mx-0 sm:rounded-2xl sm:border" aria-hidden="true">
      <div className="flex items-center gap-3 px-4 pt-4">
        <div className="h-10 w-10 rounded-full bg-surface-line/80" />
        <div className="flex-1 space-y-2">
          <div className="h-3.5 w-1/3 rounded bg-surface-line/90" />
          <div className="h-2.5 w-1/2 rounded bg-surface-line/60" />
        </div>
        <div className="h-7 w-20 rounded-full bg-accent/20" />
      </div>
      <div className="space-y-2 px-4 pt-4">
        <div className="h-3 w-full rounded bg-surface-line/70" />
        <div className="h-3 w-5/6 rounded bg-surface-line/70" />
      </div>
      {media ? <div className="mt-4 aspect-video bg-surface-line/50" /> : <div className="h-3" />}
      <div className="mx-2 mt-3 flex gap-2 border-t border-surface-line px-2 py-3">
        {[0, 1, 2, 3].map((i) => (
          <div key={i} className="h-5 flex-1 rounded bg-surface-line/60" />
        ))}
      </div>
    </div>
  );
}
