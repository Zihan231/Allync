"use client";

import { useState, type FormEvent } from "react";
import { useLanguage } from "@/lib/i18n/LanguageContext";
import { updateMatch } from "@/lib/mock/store";
import type { Match } from "@/lib/mock/types";

export function ResultSubmissionForm({ match }: { match: Match }) {
  const { t } = useLanguage();
  const [fileName, setFileName] = useState<string | null>(null);

  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const data = new FormData(e.currentTarget);
    const myScore = Number(data.get("myScore") ?? 0);
    const opponentScore = Number(data.get("opponentScore") ?? 0);

    // Demo heuristic: the "Semi-final" round always demonstrates the
    // auto-verify path (as if the opponent's claim already matched);
    // every other round demonstrates the awaiting-opponent path.
    const autoVerify = match.round === "Semi-final";

    updateMatch(match.id, {
      myScore,
      opponentScore,
      evidenceA: fileName ?? "result-screenshot.png",
      status: autoVerify ? "verified" : "awaiting_opponent",
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div className="grid grid-cols-2 gap-4">
        <label className="block">
          <span className="text-sm font-medium text-ink-soft">You</span>
          <input
            type="number"
            name="myScore"
            min={0}
            required
            className="mt-1.5 w-full rounded-lg border border-surface-line bg-surface px-4 py-3 text-sm text-ink outline-none focus:border-accent focus:ring-2 focus:ring-accent/20"
          />
        </label>
        <label className="block">
          <span className="text-sm font-medium text-ink-soft">{match.opponent}</span>
          <input
            type="number"
            name="opponentScore"
            min={0}
            required
            className="mt-1.5 w-full rounded-lg border border-surface-line bg-surface px-4 py-3 text-sm text-ink outline-none focus:border-accent focus:ring-2 focus:ring-accent/20"
          />
        </label>
      </div>

      <label className="block">
        <span className="text-sm font-medium text-ink-soft">{t.dashboard.matches.evidenceLabel}</span>
        <input
          type="file"
          onChange={(e) => setFileName(e.target.files?.[0]?.name ?? null)}
          className="mt-1.5 block w-full text-sm text-ink-soft file:mr-3 file:rounded-full file:border-0 file:bg-accent file:px-3.5 file:py-1.5 file:text-xs file:font-semibold file:text-bg"
        />
        <p className="mt-1.5 text-xs text-ink-faint">{t.dashboard.matches.evidenceHint}</p>
      </label>

      <button
        type="submit"
        className="rounded-full bg-accent px-6 py-3 font-display font-semibold text-bg transition-transform hover:-translate-y-0.5"
      >
        {t.dashboard.matches.submitButton}
      </button>
    </form>
  );
}
