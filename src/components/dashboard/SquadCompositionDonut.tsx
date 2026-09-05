"use client";

import { useLanguage } from "@/lib/i18n/LanguageContext";
import type { useMockPeople } from "@/lib/mock/communityStore";

type Person = ReturnType<typeof useMockPeople>[number];

const SEGMENT_COLORS = {
  main: "var(--color-accent)",
  academy: "var(--color-blue)",
  legend: "var(--color-success)",
  other: "var(--color-surface-line-strong)",
} as const;

export function SquadCompositionDonut({ members }: { members: Person[] }) {
  const { t } = useLanguage();

  const total = members.length;
  const counts = {
    main: members.filter((p) => (p.squadTeam ?? "Main") === "Main").length,
    academy: members.filter((p) => p.squadTeam === "Academy").length,
    legend: members.filter((p) => p.squadTeam === "Legend").length,
  };
  const other = Math.max(0, total - counts.main - counts.academy - counts.legend);

  const segments: { key: keyof typeof SEGMENT_COLORS; count: number; label: string }[] = [
    { key: "main", count: counts.main, label: t.dashboard.clubOverview.compositionMain },
    { key: "academy", count: counts.academy, label: t.dashboard.clubOverview.compositionAcademy },
    { key: "legend", count: counts.legend, label: t.dashboard.clubOverview.compositionLegend },
    { key: "other", count: other, label: t.dashboard.clubOverview.compositionOther },
  ];

  let cursor = 0;
  const stops: string[] = [];
  for (const seg of segments) {
    if (seg.count <= 0) continue;
    const start = (cursor / Math.max(1, total)) * 100;
    cursor += seg.count;
    const end = (cursor / Math.max(1, total)) * 100;
    stops.push(`${SEGMENT_COLORS[seg.key]} ${start}% ${end}%`);
  }
  const conicGradient = stops.length ? `conic-gradient(${stops.join(", ")})` : "var(--color-surface-line-strong)";

  return (
    <div className="rounded-xl border border-surface-line bg-surface/30 p-5">
      <h3 className="font-display text-sm font-bold text-ink">{t.dashboard.clubOverview.compositionTitle}</h3>
      <div className="mt-4 flex flex-wrap items-center gap-6">
        <div className="relative h-40 w-40 shrink-0 rounded-full" style={{ background: conicGradient }}>
          <div className="absolute inset-3 flex flex-col items-center justify-center rounded-full bg-bg">
            <span className="font-display text-2xl font-bold text-ink">{total}</span>
            <span className="font-mono text-[10px] uppercase tracking-wide text-ink-faint">
              {t.dashboard.club.playersLabel}
            </span>
          </div>
        </div>
        <div className="space-y-2.5">
          {segments
            .filter((s) => s.count > 0)
            .map((s) => (
              <div key={s.key} className="flex items-center gap-2 text-sm">
                <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ backgroundColor: SEGMENT_COLORS[s.key] }} />
                <span className="text-ink-soft">{s.label}</span>
                <span className="font-mono font-semibold text-ink">{s.count}</span>
              </div>
            ))}
        </div>
      </div>
    </div>
  );
}
