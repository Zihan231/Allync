export function RankBadge({ rank, className = "" }: { rank: number; className?: string }) {
  const tone =
    rank === 1 ? "bg-accent-soft text-accent-ink" : rank <= 3 ? "bg-blue-soft text-blue-ink" : "bg-surface-line/60 text-ink-faint";

  return (
    <span
      className={`inline-flex h-7 min-w-7 items-center justify-center rounded-full px-2 font-mono text-xs font-bold ${tone} ${className}`}
    >
      #{rank}
    </span>
  );
}
