"use client";

import { useLanguage } from "@/lib/i18n/LanguageContext";
import { format } from "@/lib/i18n/translations";
import { useMyEvidence } from "@/lib/api/hooks/useTournaments";

/** The player's own uploaded evidence for a game: the score they entered, screenshots and video. */
export function MyEvidencePanel({ tournamentId, gameId }: { tournamentId: string; gameId: string }) {
  const { t, locale } = useLanguage();
  const r = t.dashboard.results;
  const { data: evidence, isLoading, isError } = useMyEvidence(tournamentId, gameId, true);

  return (
    <div className="mt-2 rounded-lg border border-surface-line bg-bg/50 p-3 text-[11px]">
      <div className="mb-2 font-mono text-[10px] font-bold uppercase tracking-wide text-ink-soft">{r.myEvidenceTitle}</div>
      {isLoading ? (
        <p className="text-ink-faint">{r.myEvidenceLoading}</p>
      ) : isError ? (
        <p className="font-semibold text-danger-ink">{r.myEvidenceError}</p>
      ) : !evidence ? (
        <p className="text-ink-faint">{r.myEvidenceNone}</p>
      ) : (
        <div className="space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-2 rounded-lg bg-surface/60 px-3 py-2">
            <span className="text-ink-soft">{r.myClaimedScore}</span>
            <span className="font-display text-base font-black tabular-nums text-ink">
              {evidence.goalsA} : {evidence.goalsB}
            </span>
          </div>
          <p className="font-mono text-[10px] text-ink-faint">
            {format(r.myEvidenceUploadedAt, {
              date: new Date(evidence.submittedAt).toLocaleString(locale === "bn" ? "bn-BD" : "en-GB", {
                timeZone: "Asia/Dhaka",
                day: "2-digit",
                month: "short",
                hour: "2-digit",
                minute: "2-digit",
              }),
            })}
          </p>
          {evidence.screenshotUrls.length ? (
            <div>
              <div className="mb-1.5 font-semibold text-ink-soft">{r.myScreenshots}</div>
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                {evidence.screenshotUrls.map((url) => (
                  <a
                    key={url}
                    href={url}
                    target="_blank"
                    rel="noreferrer"
                    title={r.openFull}
                    className="block overflow-hidden rounded-lg border border-surface-line"
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element -- evidence served from the backend uploads folder */}
                    <img src={url} alt="" className="h-24 w-full object-cover transition-transform hover:scale-105" />
                  </a>
                ))}
              </div>
            </div>
          ) : null}
          {evidence.videoUrl ? (
            <div>
              <div className="mb-1.5 font-semibold text-ink-soft">{r.myVideo}</div>
              <video src={evidence.videoUrl} controls preload="metadata" className="max-h-64 w-full rounded-lg bg-black" />
            </div>
          ) : null}
        </div>
      )}
    </div>
  );
}
