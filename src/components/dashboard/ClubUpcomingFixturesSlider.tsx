"use client";

import { useState } from "react";
import { useLanguage } from "@/lib/i18n/LanguageContext";
import type { ClubFixture } from "@/lib/mock/clubInsights";
import { Pagination } from "./Pagination";
import { TrophyIcon } from "../icons";

const PAGE_SIZE = 10;

export function ClubUpcomingFixturesSlider({ fixtures }: { fixtures: ClubFixture[] }) {
  const { t } = useLanguage();
  const [page, setPage] = useState(1);

  if (fixtures.length === 0) {
    return (
      <div className="flex h-full flex-col rounded-xl border border-surface-line bg-surface/30 p-5">
        <h3 className="font-display text-sm font-bold text-ink">{t.dashboard.clubOverview.upcomingFixturesTitle}</h3>
        <p className="mt-3 text-sm text-ink-soft">{t.dashboard.clubOverview.noUpcomingFixtures}</p>
      </div>
    );
  }

  const pageCount = Math.max(1, Math.ceil(fixtures.length / PAGE_SIZE));
  const pageFixtures = fixtures.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  return (
    <div className="flex h-full flex-col rounded-xl border border-surface-line bg-surface/30 p-5">
      <h3 className="font-display text-sm font-bold text-ink">{t.dashboard.clubOverview.upcomingFixturesTitle}</h3>

      <div className="mt-4 grid flex-1 auto-rows-min grid-cols-2 gap-3">
        {pageFixtures.map((f) => (
          <div
            key={f.id}
            className={`min-w-0 rounded-xl border p-3 ${
              f.isKnockout ? "glow-gold border-accent bg-accent-soft/40" : "border-surface-line bg-surface/40"
            }`}
          >
            <div className="flex items-center justify-between gap-1.5">
              <span className="truncate font-mono text-sm uppercase tracking-wide text-ink-faint">{f.dateLabel}</span>
              {f.isKnockout ? (
                <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-accent-soft px-1.5 py-0.5 font-mono text-[10px] font-bold uppercase text-accent-ink">
                  <TrophyIcon className="h-3 w-3" />
                </span>
              ) : null}
            </div>
            <div className="mt-1.5 truncate text-base font-semibold text-ink">vs {f.opponentClubName}</div>
            <div className="mt-0.5 truncate text-sm text-ink-faint">{f.competition}</div>
          </div>
        ))}
      </div>

      <div className="mt-4">
        <Pagination page={page} pageCount={pageCount} onPageChange={setPage} />
      </div>
    </div>
  );
}
