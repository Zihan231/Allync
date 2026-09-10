"use client";

import { use } from "react";
import Link from "next/link";
import { useLanguage } from "@/lib/i18n/LanguageContext";
import { useMockMatches } from "@/lib/mock/store";
import { PageHeader } from "@/components/dashboard/PageHeader";
import { StatusPill, type StatusTone } from "@/components/dashboard/StatusPill";
import { StatTile } from "@/components/dashboard/StatTile";
import { ResultSubmissionForm } from "@/components/dashboard/ResultSubmissionForm";
import { EmptyState } from "@/components/dashboard/EmptyState";
import { SectionHeading } from "@/components/dashboard/SectionHeading";
import { fmtMatchDateTime, isDeadlinePassed } from "@/components/dashboard/MatchCard";
import { colorFromString, initialsFromName } from "@/lib/colorHash";
import { CalendarIcon, BellIcon, TrophyIcon, ArrowRightIcon, ShieldIcon, GavelIcon, SwapIcon } from "@/components/icons";
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
    unplayed: t.dashboard.matches.statusUnplayed,
    pending_submission: t.dashboard.matches.filterPending,
    awaiting_opponent: t.dashboard.matches.filterAwaiting,
    verified: t.dashboard.matches.filterVerified,
    disputed: t.dashboard.matches.filterDisputed,
  };

  const overdue = isDeadlinePassed(match);
  const opponentColor = colorFromString(match.opponent);
  const opponentInitials = initialsFromName(match.opponent);
  const hasEvidence = Boolean(match.evidenceA || match.evidenceB);

  return (
    <div className="mx-auto max-w-3xl">
      <PageHeader
        eyebrow={`${match.tournamentName} · ${match.round}`}
        title={`vs ${match.opponent}`}
        action={<StatusPill tone={toneByStatus[match.status]}>{statusLabel[match.status]}</StatusPill>}
        backHref="/dashboard/efootball/matches"
      />

      <div className="mt-6 flex flex-wrap items-center gap-4 rounded-2xl border border-surface-line bg-surface/40 p-5">
        <div
          className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full font-display text-lg font-bold"
          style={{ backgroundColor: `${opponentColor}26`, color: opponentColor }}
        >
          {opponentInitials}
        </div>
        <div className="min-w-0 flex-1">
          <div className="font-display text-lg font-bold text-ink">{match.opponent}</div>
          <Link
            href={`/dashboard/efootball/tournaments/${match.tournamentId}`}
            className="group mt-1 inline-flex items-center gap-1.5 text-xs text-ink-faint transition-colors hover:text-accent-ink"
          >
            <TrophyIcon className="h-3.5 w-3.5" />
            {match.tournamentName}
            <ArrowRightIcon className="h-3 w-3 transition-transform group-hover:translate-x-1" />
          </Link>
        </div>
        {typeof match.myScore === "number" ? (
          <div className="shrink-0 font-display text-3xl font-black text-ink">
            {match.myScore}–{typeof match.opponentScore === "number" ? match.opponentScore : "?"}
          </div>
        ) : null}
      </div>

      <div className="mt-6 grid gap-4 sm:grid-cols-3">
        <StatTile label={t.dashboard.matches.scheduledLabel} value={fmtMatchDateTime(match.scheduledAt)} icon={CalendarIcon} />
        {match.submissionDeadline ? (
          <StatTile
            label={t.dashboard.matches.deadlineLabel}
            value={overdue ? t.dashboard.matches.deadlinePassedLabel : fmtMatchDateTime(match.submissionDeadline)}
            icon={BellIcon}
          />
        ) : null}
        <StatTile label={t.dashboard.matches.roundLabel} value={match.round} icon={SwapIcon} />
      </div>

      {overdue && (match.status === "unplayed" || match.status === "pending_submission") ? (
        <p className="mt-4 rounded-xl border border-danger/30 bg-danger-soft px-4 py-3 text-sm text-danger-ink">
          {t.dashboard.matches.deadlinePassedNotice}
        </p>
      ) : null}

      <div className="mt-8">
        {match.status === "unplayed" && (
          <div className="rounded-2xl border border-surface-line bg-surface/50 p-6">
            <SectionHeading tone="warning" size="title" className="mb-4">
              {t.dashboard.matches.submitResultTitle}
            </SectionHeading>
            <ResultSubmissionForm match={match} />
          </div>
        )}

        {match.status === "pending_submission" && (
          <div className="rounded-2xl border border-warning/30 bg-gradient-to-b from-warning/10 via-surface/50 to-surface/50 p-6">
            <div className="flex items-center gap-3">
              <BellIcon className="h-6 w-6 shrink-0 text-warning-ink" />
              <p className="text-sm text-warning-ink">{t.dashboard.matches.filterPending}</p>
            </div>
          </div>
        )}

        {match.status === "verified" && (
          <div className="rounded-2xl border border-success/30 bg-gradient-to-b from-success/10 via-surface/50 to-surface/50 p-6">
            <div className="flex items-center gap-3">
              <ShieldIcon className="h-6 w-6 shrink-0 text-success-ink" />
              <div>
                <div className="font-display text-3xl font-bold text-ink">
                  {match.myScore}–{match.opponentScore}
                </div>
                <p className="mt-1 text-sm text-success-ink">{t.dashboard.matches.autoVerifiedNote}</p>
              </div>
            </div>
          </div>
        )}

        {match.status === "awaiting_opponent" && (
          <div className="rounded-2xl border border-blue/30 bg-gradient-to-b from-blue/10 via-surface/50 to-surface/50 p-6">
            <div className="flex items-center gap-3">
              <SwapIcon className="h-6 w-6 shrink-0 text-blue-ink" />
              <div>
                <div className="font-display text-3xl font-bold text-ink">{match.myScore}–?</div>
                <p className="mt-1 text-sm text-blue-ink">{t.dashboard.matches.filterAwaiting}</p>
              </div>
            </div>
          </div>
        )}

        {match.status === "disputed" && (
          <div className="rounded-2xl border border-danger/30 bg-gradient-to-b from-danger/10 via-surface/50 to-surface/50 p-6">
            <div className="flex items-center gap-3">
              <GavelIcon className="h-6 w-6 shrink-0 text-danger-ink" />
              <div>
                <div className="font-display text-3xl font-bold text-ink">
                  {match.myScore}–{match.opponentScore}
                </div>
                <p className="mt-1 text-sm text-danger-ink">{t.dashboard.matches.disputedNote}</p>
              </div>
            </div>
          </div>
        )}
      </div>

      {hasEvidence ? (
        <div className="mt-6 rounded-2xl border border-surface-line bg-surface/40 p-5">
          <SectionHeading tone="blue" size="title" className="mb-4">
            {t.dashboard.matches.evidenceTitle}
          </SectionHeading>
          <div className="grid gap-3 sm:grid-cols-2">
            {match.evidenceA ? (
              <div className="rounded-lg border border-surface-line-strong bg-bg-raised px-4 py-3">
                <div className="font-mono text-[10px] uppercase tracking-wide text-ink-faint">
                  {t.dashboard.matches.yourEvidenceLabel}
                </div>
                <div className="mt-1 truncate text-sm text-ink">{match.evidenceA}</div>
              </div>
            ) : null}
            {match.evidenceB ? (
              <div className="rounded-lg border border-surface-line-strong bg-bg-raised px-4 py-3">
                <div className="font-mono text-[10px] uppercase tracking-wide text-ink-faint">
                  {t.dashboard.matches.opponentEvidenceLabel}
                </div>
                <div className="mt-1 truncate text-sm text-ink">{match.evidenceB}</div>
              </div>
            ) : null}
          </div>
        </div>
      ) : null}
    </div>
  );
}
