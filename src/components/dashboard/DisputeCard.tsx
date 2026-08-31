"use client";

import { useLanguage } from "@/lib/i18n/LanguageContext";
import { updateMatch } from "@/lib/mock/store";
import type { Match } from "@/lib/mock/types";

export function DisputeCard({ match }: { match: Match }) {
  const { t } = useLanguage();
  const c = t.dashboard.organizer.disputes;

  const rule = (status: "verified") => {
    updateMatch(match.id, { status });
  };

  return (
    <div className="rounded-xl border border-danger/30 bg-danger-soft p-5">
      <div className="flex items-center justify-between">
        <div className="text-sm font-semibold text-ink">
          {match.tournamentName} · {match.round} · vs {match.opponent}
        </div>
      </div>

      <div className="mt-3 grid gap-3 sm:grid-cols-2">
        <div className="rounded-lg border border-surface-line bg-surface/60 p-3">
          <div className="font-mono text-[10px] uppercase tracking-wide text-ink-faint">{c.evidenceA}</div>
          <div className="mt-1 text-sm text-ink">Score: {match.myScore} — {match.evidenceA}</div>
        </div>
        <div className="rounded-lg border border-surface-line bg-surface/60 p-3">
          <div className="font-mono text-[10px] uppercase tracking-wide text-ink-faint">{c.evidenceB}</div>
          <div className="mt-1 text-sm text-ink">Score: {match.opponentScore} — {match.evidenceB}</div>
        </div>
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        <button
          onClick={() => rule("verified")}
          className="rounded-full bg-success-soft px-3.5 py-1.5 text-xs font-semibold text-success-ink"
        >
          {c.ruleForA}
        </button>
        <button
          onClick={() => rule("verified")}
          className="rounded-full bg-blue-soft px-3.5 py-1.5 text-xs font-semibold text-blue-ink"
        >
          {c.ruleForB}
        </button>
        <button
          onClick={() => rule("verified")}
          className="rounded-full bg-surface-line px-3.5 py-1.5 text-xs font-semibold text-ink-soft"
        >
          {c.ruleVoid}
        </button>
      </div>
    </div>
  );
}
