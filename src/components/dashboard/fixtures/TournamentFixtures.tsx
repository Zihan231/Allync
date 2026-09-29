"use client";

import { useState } from "react";
import { useSearchParams } from "next/navigation";
import { BracketIcon, TrophyIcon, UsersIcon } from "@/components/icons";
import { useLanguage } from "@/lib/i18n/LanguageContext";
import { format } from "@/lib/i18n/translations";
import { useTournamentStructure } from "@/lib/api/hooks/useTournaments";
import type { Fixture } from "@/lib/api/tournaments";
import { GroupStage } from "./GroupStage";
import { KnockoutBracket } from "./KnockoutBracket";
import { MatchDetailModal } from "./MatchDetailModal";
import { ReviewGameModal } from "./ReviewGameModal";
import { ReviewQueue } from "./ReviewQueue";

/** The tournament's Fixtures tab: group tables + fixtures, then the knockout tree. */
export function TournamentFixtures({
  tournamentId,
  entrantCount,
  myParticipantId,
  viewerUserId,
  isReviewer = false,
  onResultSubmitted,
}: {
  tournamentId: string;
  entrantCount: number;
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
  const summary =
    structure.format === "knockout"
      ? format(f.formatKnockout, { count: entrantCount })
      : format(f.formatGroups, { count: entrantCount, groups: structure.groups.length, size: structure.knockout.size });

  return (
    <div className="space-y-8">
      <div className="flex items-center gap-2.5 rounded-xl border border-accent/30 bg-accent-soft/40 px-4 py-3 text-xs font-semibold text-accent-ink">
        <TrophyIcon className="h-4 w-4 shrink-0" />
        {summary}
      </div>

      {isReviewer ? <ReviewQueue tournamentId={tournamentId} onReview={setReviewGameId} /> : null}

      {structure.groups.length ? (
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
      ) : null}

      <section>
        <h3 className="mb-4 flex items-center gap-2 font-display text-lg font-black text-ink">
          <BracketIcon className="h-5 w-5 text-accent" />
          {f.knockout}
        </h3>
        <KnockoutBracket
          knockout={structure.knockout}
          isCvC={structure.isCvC}
          highlightParticipantId={myParticipantId}
          onOpenMatch={(m) => setOpenMatchId(m.id)}
        />
      </section>

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
