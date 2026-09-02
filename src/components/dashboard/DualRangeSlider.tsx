"use client";

import { useRef, useState } from "react";

function sanitizeDigits(raw: string) {
  return raw.replace(/[^0-9]/g, "");
}

function NumberField({
  value,
  min,
  max,
  align,
  onCommit,
}: {
  value: number;
  min: number;
  max: number;
  align: "left" | "right";
  onCommit: (n: number) => void;
}) {
  const [text, setText] = useState(String(value));
  const [prevValue, setPrevValue] = useState(value);

  if (prevValue !== value) {
    setPrevValue(value);
    setText(String(value));
  }

  function commit() {
    const digits = sanitizeDigits(text);
    const n = digits === "" ? min : Math.min(max, Math.max(min, parseInt(digits, 10)));
    setText(String(n));
    onCommit(n);
  }

  return (
    <input
      type="text"
      inputMode="numeric"
      pattern="[0-9]*"
      value={text}
      onChange={(e) => setText(sanitizeDigits(e.target.value))}
      onBlur={commit}
      onKeyDown={(e) => {
        if (e.key === "Enter") {
          e.currentTarget.blur();
        }
      }}
      className={`w-20 rounded-md border border-surface-line-strong bg-surface px-2 py-1 font-mono text-[11px] text-ink outline-none focus:border-accent ${
        align === "right" ? "text-right" : "text-left"
      }`}
    />
  );
}

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
  const trackRef = useRef<HTMLDivElement>(null);

  function handleTrackClick(e: React.MouseEvent<HTMLDivElement>) {
    const el = trackRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const ratio = Math.min(1, Math.max(0, (e.clientX - rect.left) / rect.width));
    const clicked = Math.round(min + ratio * (max - min));
    // Move whichever thumb is closer to the click point.
    if (Math.abs(clicked - lo) <= Math.abs(clicked - hi)) {
      onChange([Math.min(clicked, hi), hi]);
    } else {
      onChange([lo, Math.max(clicked, lo)]);
    }
  }

  return (
    <div>
      <div className="flex items-center justify-between text-xs">
        <span className="font-medium text-ink">{label}</span>
        <span className="font-mono text-ink-faint">Max {max.toLocaleString()}</span>
      </div>
      <div ref={trackRef} onClick={handleTrackClick} className="relative mt-3 h-4 cursor-pointer">
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
      <div className="mt-2.5 flex items-center justify-between gap-3">
        <NumberField
          value={lo}
          min={min}
          max={hi}
          align="left"
          onCommit={(n) => onChange([n, hi])}
        />
        <span className="text-ink-faint">–</span>
        <NumberField
          value={hi}
          min={lo}
          max={max}
          align="right"
          onCommit={(n) => onChange([lo, n])}
        />
      </div>
    </div>
  );
}
