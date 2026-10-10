"use client";

import { useState } from "react";
import { useLanguage } from "@/lib/i18n/LanguageContext";
import { format } from "@/lib/i18n/translations";
import { usePlayerTransferStatus } from "@/lib/api/hooks/useTransfers";
import { CloseIcon, InfoIcon } from "@/components/icons";
import { ModalPortal } from "./shared";

/**
 * Public profile: "Request loan" plus an info button. The button opens the loan form
 * for a President / GS of another club; anyone else sees why they can't. The info
 * panel explains how a loan works and exactly where the request goes.
 */
export function LoanRequestControl({
  player,
  playerClub,
  viewerClub,
  viewerLeads,
  onRequest,
}: {
  player: { id: string; name: string };
  /** The player's club (the parent club that gets the request). */
  playerClub: { id: string; name: string } | null;
  /** The viewer's club, if any. */
  viewerClub: { id: string; name: string } | null;
  /** The viewer is that club's President or General Secretary. */
  viewerLeads: boolean;
  onRequest: () => void;
}) {
  const { t } = useLanguage();
  const tr = t.dashboard.transfers;
  const { data: status } = usePlayerTransferStatus(player.id);
  const [info, setInfo] = useState(false);

  // His club comes from the server's transfer status (the local club list may not be loaded yet).
  const playerClubId = status ? status.clubId : (playerClub?.id ?? null);
  const vars = { player: player.name, club: playerClub?.name ?? tr.hisClub, mine: viewerClub?.name ?? "" };
  // Why the viewer can't ask for him (null = they can). Wait for the status before deciding.
  const blocked = !status
    ? null
    : !playerClubId
    ? format(tr.loanNoClub, vars)
    : viewerClub?.id === playerClubId
      ? format(tr.loanOwnClub, vars)
      : !viewerClub || !viewerLeads
        ? tr.loanNotLeader
        : status?.loan
          ? format(tr.loanAlready, { ...vars, club: status.loan.borrowClub.name })
          : status && !status.transferable
            ? format(tr.loanUnavailable, vars)
            : null;

  return (
    <div className="flex items-center gap-1.5">
      <button
        type="button"
        onClick={!status ? undefined : blocked ? () => setInfo(true) : onRequest}
        disabled={!status}
        aria-disabled={Boolean(blocked)}
        title={blocked ?? undefined}
        className={`rounded-full border px-3.5 py-1.5 text-xs font-bold transition-colors ${
          blocked
            ? "cursor-help border-surface-line text-ink-faint"
            : "border-accent/50 text-accent-ink hover:bg-accent hover:text-bg"
        }`}
      >
        {tr.requestLoan}
      </button>
      <button
        type="button"
        onClick={() => setInfo(true)}
        aria-label={tr.loanInfoTitle}
        title={tr.loanInfoTitle}
        className="rounded-full border border-surface-line-strong p-1.5 text-ink-soft transition-colors hover:border-accent hover:text-accent-ink"
      >
        <InfoIcon className="h-4 w-4" />
      </button>

      {info ? (
        <ModalPortal>
          <div className="fixed inset-0 z-[60] flex items-start justify-center overflow-y-auto bg-black/75 p-4 pt-[8vh] backdrop-blur-md" role="dialog" aria-modal="true">
            <button type="button" aria-label={tr.close} onClick={() => setInfo(false)} className="fixed inset-0 cursor-default" tabIndex={-1} />
            <div className="relative w-full max-w-md rounded-2xl border border-surface-line-strong bg-bg-raised shadow-2xl">
              <header className="flex items-center justify-between border-b border-surface-line px-5 py-3.5">
                <h2 className="font-display text-base font-black text-ink">{tr.loanInfoTitle}</h2>
                <button type="button" onClick={() => setInfo(false)} aria-label={tr.close} className="rounded-full p-1.5 text-ink-faint hover:bg-surface-line/60 hover:text-ink">
                  <CloseIcon className="h-4 w-4" />
                </button>
              </header>
              <div className="space-y-4 px-5 py-4 text-sm leading-relaxed text-ink-soft">
                {blocked ? (
                  <p className="rounded-lg border border-warning/40 bg-warning-soft px-3 py-2 text-xs font-semibold text-warning-ink">{blocked}</p>
                ) : null}

                <ol className="list-decimal space-y-1.5 pl-5">
                  <li>{tr.loanStep1}</li>
                  <li>{tr.loanStep2}</li>
                  <li>{tr.loanStep3}</li>
                  <li>{tr.loanStep4}</li>
                  <li>{tr.loanStep5}</li>
                </ol>

                {playerClubId ? (
                  <div className="rounded-xl border border-accent/30 bg-accent-soft/40 p-3">
                    <div className="font-mono text-[10px] font-bold uppercase tracking-wider text-accent-ink">{tr.loanWhereTitle}</div>
                    <p className="mt-1 text-sm text-ink">{format(tr.loanWhere, vars)}</p>
                    <p className="mt-1.5 text-xs">{format(tr.loanTrack, { mine: viewerClub?.name ?? tr.yourClub })}</p>
                  </div>
                ) : null}
              </div>
              <footer className="flex justify-end gap-2 border-t border-surface-line px-5 py-3">
                <button type="button" onClick={() => setInfo(false)} className="rounded-full border border-surface-line-strong px-4 py-2 text-xs font-bold text-ink-soft hover:text-ink">
                  {tr.close}
                </button>
                {!blocked ? (
                  <button
                    type="button"
                    onClick={() => {
                      setInfo(false);
                      onRequest();
                    }}
                    className="rounded-full bg-accent px-5 py-2 text-xs font-black text-bg"
                  >
                    {tr.requestLoan}
                  </button>
                ) : null}
              </footer>
            </div>
          </div>
        </ModalPortal>
      ) : null}
    </div>
  );
}
