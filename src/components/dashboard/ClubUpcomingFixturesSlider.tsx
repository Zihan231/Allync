import { useLanguage } from "@/lib/i18n/LanguageContext";
import type { ClubFixture } from "@/lib/mock/clubInsights";
import { TrophyIcon } from "../icons";

export function ClubUpcomingFixturesSlider({ fixtures }: { fixtures: ClubFixture[] }) {
  const { t } = useLanguage();

  if (fixtures.length === 0) {
    return (
      <div className="rounded-xl border border-surface-line bg-surface/30 p-5">
        <h3 className="font-display text-sm font-bold text-ink">{t.dashboard.clubOverview.upcomingFixturesTitle}</h3>
        <p className="mt-3 text-sm text-ink-soft">{t.dashboard.clubOverview.noUpcomingFixtures}</p>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-surface-line bg-surface/30 p-5">
      <h3 className="font-display text-sm font-bold text-ink">{t.dashboard.clubOverview.upcomingFixturesTitle}</h3>
      <div className="mt-4 flex gap-3 overflow-x-auto pb-1">
        {fixtures.map((f) => (
          <div
            key={f.id}
            className={`w-56 shrink-0 rounded-xl border p-4 ${
              f.isKnockout ? "glow-gold border-accent bg-accent-soft/40" : "border-surface-line bg-surface/40"
            }`}
          >
            <div className="flex items-center justify-between gap-2">
              <span className="font-mono text-[10px] uppercase tracking-wide text-ink-faint">{f.dateLabel}</span>
              {f.isKnockout ? (
                <span className="inline-flex items-center gap-1 rounded-full bg-accent-soft px-2 py-0.5 font-mono text-[9px] font-bold uppercase text-accent-ink">
                  <TrophyIcon className="h-2.5 w-2.5" />
                  {t.dashboard.clubOverview.knockoutLabel}
                </span>
              ) : null}
            </div>
            <div className="mt-2 truncate text-sm font-semibold text-ink">vs {f.opponentClubName}</div>
            <div className="mt-1 truncate text-xs text-ink-soft">{f.competition}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
