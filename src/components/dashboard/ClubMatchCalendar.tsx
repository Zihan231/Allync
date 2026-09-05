import { useLanguage } from "@/lib/i18n/LanguageContext";
import type { ClubCalendarEvent } from "@/lib/mock/clubInsights";
import { ClubCrest } from "../common/ClubCrest";
import { getClubLogo } from "@/lib/clubLogos";

const WEEKDAY_LABELS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const REFERENCE_NOW = new Date("2026-09-01T00:00:00+06:00");
const MAX_CRESTS_PER_DAY = 3;

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

  // A day can have more than one fixture (Main and Academy playing the same
  // day is normal), so each date maps to a list of events, not just one.
  const eventsByDate = new Map<string, ClubCalendarEvent[]>();
  events.forEach((e) => {
    const list = eventsByDate.get(e.dateIso) ?? [];
    list.push(e);
    eventsByDate.set(e.dateIso, list);
  });

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
          const dayEvents = cell.dateIso ? eventsByDate.get(cell.dateIso) ?? [] : [];
          const hasKnockout = dayEvents.some((e) => e.isKnockout);
          const isToday = cell.dateIso === todayIso;
          const visibleEvents = dayEvents.slice(0, MAX_CRESTS_PER_DAY);
          const overflowCount = dayEvents.length - visibleEvents.length;
          // More room to grow the crest when a day has fewer of them — only
          // at sm/md+ viewports so mobile's tight cells never overflow.
          const crestSizeClass =
            visibleEvents.length === 1 ? "sm:h-8 sm:w-8 md:h-9 md:w-9" : visibleEvents.length === 2 ? "sm:h-7 sm:w-7" : "";

          return (
            <div
              key={i}
              className={`relative flex aspect-square flex-col items-center justify-center gap-0.5 overflow-hidden rounded-lg p-0.5 ${
                hasKnockout
                  ? "border border-accent bg-accent-soft text-accent-ink"
                  : dayEvents.length > 0
                    ? "bg-blue-soft text-blue-ink"
                    : "bg-surface/40 text-ink-soft"
              } ${isToday ? "ring-1 ring-ink" : ""}`}
              title={dayEvents.map((e) => `${e.team}: vs ${e.opponentClubName}`).join(" · ") || undefined}
            >
              {hasKnockout ? <span className="glow-gold pointer-events-none absolute inset-0 -z-10 rounded-lg" /> : null}
              <span className="text-xs">{cell.day}</span>
              {visibleEvents.length > 0 ? (
                <div className="flex items-center justify-center gap-0.5">
                  {visibleEvents.map((e, idx) => (
                    <ClubCrest
                      key={idx}
                      name={e.opponentClubName}
                      imageUrl={getClubLogo(e.opponentClubName)}
                      size="xs"
                      className={crestSizeClass}
                    />
                  ))}
                  {overflowCount > 0 ? (
                    <span className="font-mono text-[7px] font-bold text-ink-faint">+{overflowCount}</span>
                  ) : null}
                </div>
              ) : null}
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
