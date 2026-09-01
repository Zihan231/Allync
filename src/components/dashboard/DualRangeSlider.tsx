"use client";

export function DualRangeSlider({
  label,
  min,
  max,
  value,
  onChange,
}: {
  label: string;
  min: number;
  max: number;
  value: [number, number];
  onChange: (value: [number, number]) => void;
}) {
  const [lo, hi] = value;
  const pctLo = ((lo - min) / (max - min)) * 100;
  const pctHi = ((hi - min) / (max - min)) * 100;

  return (
    <div>
      <div className="flex items-center justify-between text-xs">
        <span className="font-medium text-ink">{label}</span>
        <span className="font-mono text-ink-faint">Max {max.toLocaleString()}</span>
      </div>
      <div className="relative mt-3 h-4">
        <div className="absolute top-1/2 h-1 w-full -translate-y-1/2 rounded-full bg-surface-line-strong" />
        <div
          className="absolute top-1/2 h-1 -translate-y-1/2 rounded-full bg-accent"
          style={{ left: `${pctLo}%`, right: `${100 - pctHi}%` }}
        />
        <input
          type="range"
          min={min}
          max={max}
          value={lo}
          onChange={(e) => {
            const next = Math.min(Number(e.target.value), hi);
            onChange([next, hi]);
          }}
          className="range-thumb pointer-events-none absolute inset-0 w-full appearance-none bg-transparent"
          style={{ zIndex: lo > max - (max - min) / 2 ? 5 : 3 }}
        />
        <input
          type="range"
          min={min}
          max={max}
          value={hi}
          onChange={(e) => {
            const next = Math.max(Number(e.target.value), lo);
            onChange([lo, next]);
          }}
          className="range-thumb pointer-events-none absolute inset-0 w-full appearance-none bg-transparent"
          style={{ zIndex: 4 }}
        />
      </div>
      <div className="mt-1.5 flex items-center justify-between font-mono text-[11px] text-ink-faint">
        <span>{lo.toLocaleString()}</span>
        <span>{hi.toLocaleString()}</span>
      </div>
    </div>
  );
}
