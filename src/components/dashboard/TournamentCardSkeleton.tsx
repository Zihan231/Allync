export function TournamentCardSkeleton() {
  return (
    <div className="relative flex flex-col overflow-hidden rounded-2xl border border-surface-line bg-surface/80 shadow-md backdrop-blur-sm animate-pulse">
      {/* 1. VISUAL COVER BANNER SKELETON */}
      <div className="relative h-28 w-full overflow-hidden bg-gradient-to-br from-[#0e1626] via-[#161f33] to-[#0c1017]">
        {/* Subtle grid pattern */}
        <div className="absolute inset-0 opacity-10 bg-[linear-gradient(45deg,rgba(255,255,255,0.08)_25%,transparent_25%,transparent_50%,rgba(255,255,255,0.08)_50%,rgba(255,255,255,0.08)_75%,transparent_75%,transparent)] bg-[length:24px_24px]" />
        
        {/* Top edge glow */}
        <div className="pointer-events-none absolute inset-x-0 top-0 h-[2px] bg-gradient-to-r from-transparent via-accent/50 to-transparent" />

        {/* Top Overlay Pills */}
        <div className="relative z-10 flex items-center justify-between p-3">
          <div className="h-6 w-24 rounded-full bg-surface-line/70" />
          <div className="h-6 w-28 rounded-full bg-surface-line/70" />
        </div>

        {/* Bottom Prize Badge Skeleton */}
        <div className="absolute bottom-2.5 right-3 z-10">
          <div className="h-6 w-24 rounded-full bg-accent/20" />
        </div>
      </div>

      {/* 2. CARD CONTENT BODY SKELETON */}
      <div className="relative p-5 pt-4">
        {/* Title */}
        <div className="h-5 w-3/4 rounded-md bg-surface-line/90" />
        {/* Subtitle / Host */}
        <div className="mt-2.5 flex items-center gap-1.5">
          <div className="h-2 w-2 rounded-full bg-accent/40" />
          <div className="h-3.5 w-1/3 rounded bg-surface-line/60" />
        </div>

        {/* Feature Pills */}
        <div className="mt-4 flex items-center gap-2">
          <div className="h-6 w-24 rounded-lg bg-surface-line/70" />
          <div className="h-6 w-16 rounded-lg bg-surface-line/50" />
        </div>

        {/* 3. CARD FOOTER SKELETON */}
        <div className="mt-5 border-t border-surface-line/80 pt-3.5">
          <div className="flex items-center justify-between gap-3">
            <div className="space-y-1.5">
              <div className="h-3 w-24 rounded bg-surface-line/70" />
              <div className="h-1.5 w-24 rounded-full bg-surface-line/40" />
            </div>
            <div className="space-y-1.5 text-right flex flex-col items-end">
              <div className="h-2.5 w-12 rounded bg-surface-line/50" />
              <div className="h-3.5 w-20 rounded bg-surface-line/70" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
