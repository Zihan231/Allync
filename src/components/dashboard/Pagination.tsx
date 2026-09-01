"use client";

export function Pagination({
  page,
  pageCount,
  onPageChange,
}: {
  page: number;
  pageCount: number;
  onPageChange: (page: number) => void;
}) {
  if (pageCount <= 1) return null;

  const pages = new Set<number>([1, pageCount, page, page - 1, page + 1]);
  const sorted = [...pages].filter((p) => p >= 1 && p <= pageCount).sort((a, b) => a - b);

  const items: (number | "gap")[] = [];
  let prev = 0;
  for (const p of sorted) {
    if (prev && p - prev > 1) items.push("gap");
    items.push(p);
    prev = p;
  }

  return (
    <div className="flex flex-wrap items-center justify-center gap-1.5">
      <button
        type="button"
        disabled={page === 1}
        onClick={() => onPageChange(page - 1)}
        className="rounded-lg border border-surface-line-strong px-3 py-1.5 text-sm text-ink-soft transition-colors hover:text-ink disabled:opacity-40 disabled:hover:text-ink-soft"
      >
        Prev
      </button>
      {items.map((it, i) =>
        it === "gap" ? (
          <span key={`gap-${i}`} className="px-1.5 text-sm text-ink-faint">
            …
          </span>
        ) : (
          <button
            key={it}
            type="button"
            onClick={() => onPageChange(it)}
            className={`min-w-9 rounded-lg px-2.5 py-1.5 text-sm font-medium transition-colors ${
              it === page ? "bg-accent text-bg" : "border border-surface-line-strong text-ink-soft hover:text-ink"
            }`}
          >
            {it}
          </button>
        )
      )}
      <button
        type="button"
        disabled={page === pageCount}
        onClick={() => onPageChange(page + 1)}
        className="rounded-lg border border-surface-line-strong px-3 py-1.5 text-sm text-ink-soft transition-colors hover:text-ink disabled:opacity-40 disabled:hover:text-ink-soft"
      >
        Next
      </button>
    </div>
  );
}
