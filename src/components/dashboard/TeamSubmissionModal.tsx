"use client";

import { useEffect, useState } from "react";
import { CloseIcon, UsersIcon } from "@/components/icons";
import { useLanguage } from "@/lib/i18n/LanguageContext";
import { format } from "@/lib/i18n/translations";
import { useJoinTournament, useSubmitTournamentLineup } from "@/lib/api/hooks/useTournaments";
import type { ClubMemberProfile, Team } from "@/lib/api/teams";
import type { BackendTournament, SubmitLineupPayload, TournamentParticipant } from "@/lib/api/tournaments";
import { TeamSubmissionForm } from "./TeamSubmissionForm";

function apiErrorMessage(err: unknown): string | undefined {
  const data = (err as { response?: { data?: { message?: string | string[] } } })?.response?.data;
  return Array.isArray(data?.message) ? data.message.join(", ") : data?.message;
}

/**
 * CvC team popup. Without `participant` it registers the club together with its
 * team; with `participant` it edits that club's submitted team (pre-filled).
 * Mount only while open.
 */
export function TeamSubmissionModal({
  tournament,
  club,
  participant,
  members,
  teams,
  isLoadingSquad,
  onClose,
  onSaved,
}: {
  tournament: BackendTournament;
  club: { id: string; name: string };
  participant?: TournamentParticipant | null;
  members: ClubMemberProfile[];
  teams: Team[];
  isLoadingSquad: boolean;
  onClose: () => void;
  onSaved: (message: string) => void;
}) {
  const { t } = useLanguage();
  const ts = t.dashboard.teamSubmission;
  const isEditing = Boolean(participant);
  const joinMutation = useJoinTournament(tournament.id);
  const lineupMutation = useSubmitTournamentLineup(tournament.id);
  const isPending = joinMutation.isPending || lineupMutation.isPending;
  const [error, setError] = useState("");

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !isPending) onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose, isPending]);

  async function handleSubmit(lineup: SubmitLineupPayload) {
    setError("");
    try {
      if (participant) {
        await lineupMutation.mutateAsync({ participantId: participant.id, payload: lineup });
        onSaved(ts.lineupSaved);
      } else {
        await joinMutation.mutateAsync({ clubId: club.id, lineup });
        onSaved(format(ts.registered, { club: club.name }));
      }
      onClose();
    } catch (err: unknown) {
      setError(
        apiErrorMessage(err) || (err as Error)?.message || (isEditing ? ts.errLineup : ts.errRegister),
      );
    }
  }

  const preset = `${tournament.startersCount} v ${tournament.startersCount}`;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/75 p-4 pt-[4vh] backdrop-blur-md">
      <button
        type="button"
        aria-label={ts.close}
        disabled={isPending}
        onClick={onClose}
        className="fixed inset-0 cursor-default"
        tabIndex={-1}
      />

      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="register-club-title"
        className="relative mb-8 w-full max-w-4xl overflow-hidden rounded-3xl border border-accent/30 bg-bg-raised shadow-[0_30px_90px_-20px_rgba(0,0,0,0.85)]"
      >
        <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-accent to-transparent" />

        <div className="flex items-start justify-between gap-4 border-b border-surface-line bg-gradient-to-r from-accent/10 via-transparent to-blue/10 px-6 py-5">
          <div className="flex items-start gap-3">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-accent text-bg shadow-[0_0_18px_rgba(217,165,68,0.45)]">
              <UsersIcon className="h-5 w-5" />
            </div>
            <div>
              <h3 id="register-club-title" className="font-display text-lg font-black text-ink">
                {format(isEditing ? ts.editTitle : ts.registerTitle, { club: club.name })}
              </h3>
              <p className="mt-0.5 max-w-xl text-xs leading-relaxed text-ink-soft">
                {format(isEditing ? ts.editSubtitle : ts.registerSubtitle, { preset })}
              </p>
            </div>
          </div>
          <button
            type="button"
            disabled={isPending}
            onClick={onClose}
            aria-label={ts.close}
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-ink-faint transition-colors hover:bg-surface-line/60 hover:text-ink disabled:opacity-40"
          >
            <CloseIcon className="h-4 w-4" />
          </button>
        </div>

        <div className="px-6 py-5">
          {isLoadingSquad ? (
            <div className="flex flex-col items-center justify-center gap-3 py-16 text-ink-faint">
              <div className="h-7 w-7 animate-spin rounded-full border-2 border-accent border-t-transparent" />
              <span className="text-xs">{ts.loadingSquad}</span>
            </div>
          ) : (
            <TeamSubmissionForm
              startersCount={tournament.startersCount}
              subsCount={tournament.subsCount}
              members={members}
              teams={teams}
              initialLineup={participant?.lineup}
              submitLabel={isEditing ? ts.updateSubmit : ts.registerSubmit}
              submittingLabel={isEditing ? ts.updating : ts.registering}
              isSubmitting={isPending}
              error={error}
              onSubmit={handleSubmit}
            />
          )}
        </div>
      </div>
    </div>
  );
}
