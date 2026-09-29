"use client";

import { Fragment, useState } from "react";
import { useSearchParams } from "next/navigation";
import { BracketIcon, CheckIcon, UsersIcon } from "@/components/icons";
import { useLanguage } from "@/lib/i18n/LanguageContext";
import { format } from "@/lib/i18n/translations";
import { useTournamentStructure } from "@/lib/api/hooks/useTournaments";
import type { Fixture } from "@/lib/api/tournaments";
import { GroupStage } from "./GroupStage";
import { KnockoutBracket } from "./KnockoutBracket";
import { roundLabel } from "./labels";
import { MatchDetailModal } from "./MatchDetailModal";
import { ReviewGameModal } from "./ReviewGameModal";
import { ReviewQueue } from "./ReviewQueue";

/**
 * The tournament's Fixtures tab. With a group stage, "Knockout" and "Group stage"
 * are separate tabs, opening on the knockout once it has been drawn.
 */
export function TournamentFixtures({
  tournamentId,
  tournamentName,
  myParticipantId,
  viewerUserId,
  isReviewer = false,
  onResultSubmitted,
}: {
  tournamentId: string;
  tournamentName?: string;
  myParticipantId?: string | null;
  viewerUserId?: string | null;
  /** Tournament creator, community President / VP or Head of Discipline. */
  isReviewer?: boolean;
  onResultSubmitted?: (message: string) => void;
}) {
  const { t } = useLanguage();
  const f = t.dashboard.fixtures;
  const { data: structure, isLoading } = useTournamentStructure(tournamentId);
  // Notification links open a fixture directly (?match=<id>).
  const searchParams = useSearchParams();
  const [openMatchId, setOpenMatchId] = useState<string | null>(() => searchParams.get("match"));
  // Timing notifications also point at a game and its timing panel (&game=…&panel=time).
  const focusGameId = searchParams.get("game");
  const focusPanel = searchParams.get("panel");
  const [reviewGameId, setReviewGameId] = useState<string | null>(null);
  // null = pick automatically (knockout once drawn, otherwise the group stage).
  const [stage, setStage] = useState<"groups" | "knockout" | null>(null);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center gap-3 py-16 text-xs text-ink-faint">
        <div className="h-5 w-5 animate-spin rounded-full border-2 border-accent border-t-transparent" />
        {f.loading}
      </div>
    );
  }

  if (!structure?.format) {
    return (
      <div className="rounded-3xl border border-surface-line bg-surface/40 p-12 text-center">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-accent-soft text-accent-ink">
          <BracketIcon className="h-7 w-7" />
        </div>
        <h3 className="mt-4 font-display text-base font-bold text-ink">{f.notGeneratedTitle}</h3>
        <p className="mx-auto mt-1.5 max-w-md text-xs leading-relaxed text-ink-soft">{f.notGeneratedBody}</p>
      </div>
    );
  }

  const allMatches = [...structure.groups.flatMap((g) => g.matches), ...structure.knockout.rounds.flatMap((r) => r.matches)];
  const openMatch: Fixture | undefined = allMatches.find((m) => m.id === openMatchId);

  const hasGroups = structure.groups.length > 0;
  const knockoutDrawn = !structure.knockout.pending && structure.knockout.rounds.some((r) => r.matches.length > 0);
  const linkedGroupMatch = structure.groups.some((g) => g.matches.some((m) => m.id === searchParams.get("match")));
  const activeStage = !hasGroups
    ? "knockout"
    : (stage ?? (knockoutDrawn && !linkedGroupMatch ? "knockout" : "groups"));

  // One-line status under each stage switch.
  const groupFixtures = structure.groups.flatMap((g) => g.matches);
  const groupsPlayed = groupFixtures.filter((m) => m.status === "completed").length;
  const currentRound = structure.knockout.rounds.find((r) =>
    r.matches.some((m) => m.status !== "completed" && m.status !== "bye"),
  );
  const groupsState: StepState = knockoutDrawn ? "done" : "live";
  const knockoutState: StepState = !knockoutDrawn ? "upcoming" : currentRound ? "live" : "done";
  const stageSteps = [
    {
      key: "groups" as const,
      label: f.groupStage,
      state: groupsState,
      hint: format(f.stageGroupsSummary, {
        groups: structure.groups.length,
        played: groupsPlayed,
        total: groupFixtures.length,
      }),
    },
    {
      key: "knockout" as const,
      label: f.knockout,
      state: knockoutState,
      hint: !knockoutDrawn
        ? f.stageKnockoutPending
        : currentRound
          ? format(f.stageNow, { round: roundLabel(currentRound.name, t) })
          : f.statusCompleted,
    },
  ];

  return (
    <div className="space-y-8">
      {hasGroups ? (
        <nav
          className="sticky top-[3.75rem] z-20 -mx-1 flex items-center gap-2 border-b border-surface-line bg-bg/90 px-1 backdrop-blur min-[400px]:top-[4.25rem] sm:gap-3"
          role="tablist"
          aria-label={f.stageSwitch}
        >
          {stageSteps.map(({ key, label, state, hint }, index) => {
            const active = activeStage === key;
            return (
              <Fragment key={key}>
                {index > 0 ? (
                  <span
                    aria-hidden
                    className={`h-px min-w-4 flex-1 ${groupsState === "done" ? "bg-success/60" : "bg-surface-line-strong"}`}
                  />
                ) : null}
                <button
                  type="button"
                  role="tab"
                  aria-selected={active}
                  onClick={() => setStage(key)}
                  className={`-mb-px flex min-w-0 items-center gap-2.5 border-b-2 py-3 text-left transition-colors ${
                    active ? "border-accent" : "border-transparent opacity-70 hover:opacity-100"
                  }`}
                >
                  <StepBadge state={state} number={index + 1} />
                  <span className="min-w-0">
                    <span className={`block font-display text-sm font-black ${active ? "text-ink" : "text-ink-soft"}`}>
                      {label}
                    </span>
                    <span
                      className={`block truncate text-[11px] font-semibold ${
                        state === "live" ? "text-accent-ink" : state === "done" ? "text-success-ink" : "text-ink-faint"
                      }`}
                    >
                      {hint}
                    </span>
                  </span>
                </button>
              </Fragment>
            );
          })}
        </nav>
      ) : null}

      {isReviewer ? <ReviewQueue tournamentId={tournamentId} onReview={setReviewGameId} /> : null}

      {activeStage === "groups" ? (
        <section>
          <h3 className="mb-4 flex items-center gap-2 font-display text-lg font-black text-ink">
            <UsersIcon className="h-5 w-5 text-accent" />
            {f.groupStage}
          </h3>
          <GroupStage
            groups={structure.groups}
            isCvC={structure.isCvC}
            highlightParticipantId={myParticipantId}
            onOpenMatch={(m) => setOpenMatchId(m.id)}
          />
        </section>
      ) : (
        <section>
          <h3 className="mb-4 flex items-center gap-2 font-display text-lg font-black text-ink">
            <BracketIcon className="h-5 w-5 text-accent" />
            {f.knockout}
          </h3>
          <KnockoutBracket
            knockout={structure.knockout}
            title={tournamentName}
            isCvC={structure.isCvC}
            highlightParticipantId={myParticipantId}
            onOpenMatch={(m) => setOpenMatchId(m.id)}
          />
        </section>
      )}

      {openMatch ? (
        <MatchDetailModal
          match={openMatch}
          isCvC={structure.isCvC}
          tournamentId={tournamentId}
          viewerUserId={viewerUserId}
          focusGameId={openMatch.id === searchParams.get("match") ? focusGameId : null}
          focusPanel={focusPanel}
          onClose={() => setOpenMatchId(null)}
          onMessage={onResultSubmitted}
          onReviewGame={
            isReviewer
              ? (gameId) => {
                  setOpenMatchId(null);
                  setReviewGameId(gameId);
                }
              : undefined
          }
        />
      ) : null}

      {reviewGameId ? (
        <ReviewGameModal
          tournamentId={tournamentId}
          gameId={reviewGameId}
          onClose={() => setReviewGameId(null)}
          onReviewed={(message) => onResultSubmitted?.(message)}
        />
      ) : null}
    </div>
  );
}

type StepState = "done" | "live" | "upcoming";

/** Stage step marker: ✓ when finished, pulsing while in play, its number before it starts. */
function StepBadge({ state, number }: { state: StepState; number: number }) {
  if (state === "done") {
    return (
      <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-success text-bg">
        <CheckIcon className="h-4 w-4" />
      </span>
    );
  }
  if (state === "live") {
    return (
      <span className="relative flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-accent font-display text-xs font-black text-bg">
        <span aria-hidden className="absolute inset-0 animate-ping rounded-full bg-accent/40" />
        <span className="relative">{number}</span>
      </span>
    );
  }
  return (
    <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-surface-line-strong font-display text-xs font-black text-ink-faint">
      {number}
    </span>
  );
}
