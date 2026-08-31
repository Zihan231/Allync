"use client";

import { use } from "react";
import { useLanguage } from "@/lib/i18n/LanguageContext";
import { useMockMatches } from "@/lib/mock/store";
import { PageHeader } from "@/components/dashboard/PageHeader";
import { StatusPill, type StatusTone } from "@/components/dashboard/StatusPill";
import { ResultSubmissionForm } from "@/components/dashboard/ResultSubmissionForm";
import { EmptyState } from "@/components/dashboard/EmptyState";
import { SectionHeading } from "@/components/dashboard/SectionHeading";
import { CalendarIcon } from "@/components/icons";
import type { Match } from "@/lib/mock/types";

const toneByStatus: Record<Match["status"], StatusTone> = {
  unplayed: "neutral",
  pending_submission: "warning",
  awaiting_opponent: "info",
  verified: "success",
  disputed: "danger",
};

export default function MatchDetailPage({
  params,
}: {
  params: Promise<{ matchId: string }>;
}) {
  const { matchId } = use(params);
  const { t } = useLanguage();
  const matches = useMockMatches();
  const match = matches.find((m) => m.id === matchId);

  if (!match) {
    return <EmptyState icon={CalendarIcon} title={t.dashboard.matches.noMatches} body="" />;
  }

  const statusLabel: Record<Match["status"], string> = {
    unplayed: t.dashboard.matches.filterAll,
    pending_submission: t.dashboard.matches.filterPending,
    awaiting_opponent: t.dashboard.matches.filterAwaiting,
    verified: t.dashboard.matches.filterVerified,
    disputed: t.dashboard.matches.filterDisputed,
  };

  return (
    <div className="mx-auto max-w-xl">
      <PageHeader
        eyebrow={`${match.tournamentName} · ${match.round}`}
        title={`vs ${match.opponent}`}
        action={<StatusPill tone={toneByStatus[match.status]}>{statusLabel[match.status]}</StatusPill>}
        backHref="/dashboard/efootball/matches"
      />

      <div className="mt-8">
        {match.status === "unplayed" && (
          <div className="rounded-xl border border-surface-line bg-surface/50 p-6">
            <SectionHeading tone="warning" size="title" className="mb-4">
              {t.dashboard.matches.submitResultTitle}
            </SectionHeading>
            <ResultSubmissionForm match={match} />
          </div>
        )}

        {match.status === "verified" && (
          <div className="rounded-xl border border-success/30 bg-success-soft p-6">
            <div className="font-display text-3xl font-bold text-ink">
              {match.myScore}–{match.opponentScore}
            </div>
            <p className="mt-2 text-sm text-success-ink">{t.dashboard.matches.autoVerifiedNote}</p>
          </div>
        )}

        {match.status === "awaiting_opponent" && (
          <div className="rounded-xl border border-blue/30 bg-blue-soft p-6">
            <div className="font-display text-3xl font-bold text-ink">
              {match.myScore}–?
            </div>
            <p className="mt-2 text-sm text-blue-ink">{t.dashboard.matches.filterAwaiting}</p>
          </div>
        )}

        {match.status === "disputed" && (
          <div className="rounded-xl border border-danger/30 bg-danger-soft p-6">
            <div className="font-display text-3xl font-bold text-ink">
              {match.myScore}–{match.opponentScore}
            </div>
            <p className="mt-2 text-sm text-danger-ink">{t.dashboard.matches.disputedNote}</p>
          </div>
        )}
      </div>
    </div>
  );
}
