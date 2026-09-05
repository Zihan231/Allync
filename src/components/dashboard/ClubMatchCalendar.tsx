import { useLanguage } from "@/lib/i18n/LanguageContext";
import type { ClubCalendarEvent } from "@/lib/mock/clubInsights";

const WEEKDAY_LABELS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const REFERENCE_NOW = new Date("2026-09-01T00:00:00+06:00");

// Matches clubInsights.ts's toIso: local-timezone getters, not toISOString
// (UTC-based) — so "today" lines up with the same fixture/calendar keys.
function toIso(d: Date) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export function ClubMatchCalendar({ events }: { events: ClubCalendarEvent[] }) {
  const { t } = useLanguage();

  const reference = events.length ? new Date(`${events[0].dateIso}T00:00:00`) : REFERENCE_NOW;
  const year = reference.getFullYear();
  const month = reference.getMonth();
  const monthLabel = reference.toLocaleString("en-US", { month: "long", year: "numeric" });

  const eventsByDate = new Map<string, ClubCalendarEvent>();
  events.forEach((e) => eventsByDate.set(e.dateIso, e));

  const firstOfMonth = new Date(year, month, 1);
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const leadingBlanks = (firstOfMonth.getDay() + 6) % 7; // Monday-first offset

  const todayIso = toIso(REFERENCE_NOW);

  const cells: { day: number | null; dateIso: string | null }[] = [];
  for (let i = 0; i < leadingBlanks; i++) cells.push({ day: null, dateIso: null });
  for (let d = 1; d <= daysInMonth; d++) {
    const dateIso = `${year}-${String(month + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
    cells.push({ day: d, dateIso });
  }

  return (
    <div className="h-full rounded-xl border border-surface-line bg-surface/30 p-5">
      <div className="flex items-center justify-between">
        <h3 className="font-display text-sm font-bold text-ink">{t.dashboard.clubOverview.calendarTitle}</h3>
        <span className="font-mono text-xs text-ink-faint">{monthLabel}</span>
      </div>

      <div className="mt-4 grid grid-cols-7 gap-1 text-center font-mono text-[10px] uppercase text-ink-faint">
        {WEEKDAY_LABELS.map((w) => (
          <span key={w}>{w}</span>
        ))}
      </div>
      <div className="mt-1.5 grid grid-cols-7 gap-1">
        {cells.map((cell, i) => {
          if (cell.day === null) return <div key={i} className="aspect-square" />;
          const event = cell.dateIso ? eventsByDate.get(cell.dateIso) : undefined;
          const isToday = cell.dateIso === todayIso;
          return (
            <div
              key={i}
              className={`relative flex aspect-square items-center justify-center rounded-lg text-xs ${
                event?.isKnockout
                  ? "border border-accent bg-accent-soft text-accent-ink"
                  : event
                    ? "bg-blue-soft text-blue-ink"
                    : "bg-surface/40 text-ink-soft"
              } ${isToday ? "ring-1 ring-ink" : ""}`}
            >
              {event?.isKnockout ? <span className="glow-gold pointer-events-none absolute inset-0 -z-10 rounded-lg" /> : null}
              {cell.day}
            </div>
          );
        })}
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-4 font-mono text-[10px] uppercase tracking-wide text-ink-faint">
        <span className="flex items-center gap-1.5">
          <span className="h-2 w-2 rounded-full bg-blue-soft" /> {t.dashboard.clubOverview.fixtureLabel}
        </span>
        <span className="flex items-center gap-1.5">
          <span className="h-2 w-2 rounded-full border border-accent bg-accent-soft" /> {t.dashboard.clubOverview.knockoutLabel}
        </span>
      </div>
    </div>
  );
}
