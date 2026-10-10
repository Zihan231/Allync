"use client";

import { useState } from "react";
import { useLanguage } from "@/lib/i18n/LanguageContext";
import { useSession } from "@/lib/session/SessionContext";
import { useMyLoans, useMyTransfers } from "@/lib/api/hooks/useTransfers";
import { format } from "@/lib/i18n/translations";
import { formatShortDate } from "@/components/dashboard/fixtures/labels";
import { useToast } from "@/lib/useToast";
import { ToastContainer } from "@/components/common/Toast";
import { PageHeader } from "@/components/dashboard/PageHeader";
import { ContractDocument } from "@/components/dashboard/transfers/ContractDocument";
import { MakeOfferModal } from "@/components/dashboard/transfers/MakeOfferModal";
import { OfferCard } from "@/components/dashboard/transfers/OfferCard";
import { ProposalList } from "@/components/dashboard/transfers/ProposalList";
import { TransferHistoryList } from "@/components/dashboard/transfers/TransferHistoryList";
import { WalletCard } from "@/components/dashboard/transfers/WalletCard";
import { CommitmentNotice, TransferFeeBadge } from "@/components/dashboard/transfers/shared";
import { PlusIcon, SwapIcon } from "@/components/icons";

/** The signed-in player's transfer hub: contract and fee, offers, proposals, wallet, history. */
export default function TransfersPage() {
  const { t } = useLanguage();
  const tr = t.dashboard.transfers;
  const { user } = useSession();
  const { data, isLoading } = useMyTransfers();
  const { data: loans } = useMyLoans();
  const { locale } = useLanguage();
  // His running (or about to start / end) loan, else loan talks about him.
  const loan =
    loans?.find((l) => l.status === "active" || l.status === "returning" || l.status === "scheduled") ??
    loans?.find((l) => l.status === "pending") ??
    null;
  const { toasts, toast, dismiss } = useToast();
  // Propose form: open with no club picked (null clubId) or for one club.
  const [proposing, setProposing] = useState<{ clubId?: string } | null>(null);
  const [contract, setContract] = useState<{ offerId: string; signAs?: "player" | "club" } | null>(null);

  const offers = data?.offers ?? [];
  const received = offers.filter((o) => o.kind !== "player_proposal");
  const isClubLeader = data?.clubRole === "President" || data?.clubRole === "General Secretary";
  const lockedHere = Boolean(data?.contract?.locked);

  return (
    <div>
      <PageHeader eyebrow={tr.eyebrow} title={tr.pageTitle} />

      {isLoading || !data ? (
        <div className="mt-8 h-64 animate-pulse rounded-2xl border border-surface-line bg-surface/40" />
      ) : (
        <div className="mt-8 grid gap-6 lg:grid-cols-[1fr_340px]">
          <div className="min-w-0 space-y-6">
            {/* My contract */}
            <section className="rounded-2xl border border-surface-line bg-surface/50 p-5">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <h2 className="flex items-center gap-2 font-display text-base font-black text-ink">
                  <SwapIcon className="h-4 w-4 text-accent-ink" />
                  {tr.myContract}
                </h2>
                {!isClubLeader && !lockedHere ? (
                  <button
                    type="button"
                    onClick={() => setProposing({})}
                    className="inline-flex items-center gap-1.5 rounded-full bg-accent px-4 py-1.5 text-xs font-bold text-bg"
                  >
                    <PlusIcon className="h-3.5 w-3.5" />
                    {tr.proposeTitle}
                  </button>
                ) : null}
              </div>
              {data.contract ? (
                <div className="mt-4 space-y-3">
                  <div className="flex flex-wrap items-center justify-between gap-2 text-sm">
                    <span className="font-semibold text-ink">{data.contract.clubName}</span>
                    <span className="font-mono text-xs text-ink-faint">
                      {tr.contractNo} {data.contract.contractNo}
                    </span>
                  </div>
                  <TransferFeeBadge contract={data.contract} />
                  {data.contract.offerId ? (
                    <button
                      type="button"
                      onClick={() => setContract({ offerId: data.contract!.offerId! })}
                      className="text-xs font-bold text-accent-ink hover:underline"
                    >
                      {tr.viewContract}
                    </button>
                  ) : null}
                </div>
              ) : (
                <p className="mt-3 text-sm text-ink-soft">{tr.noContract}</p>
              )}
              {data.commitment ? (
                <div className="mt-3">
                  <CommitmentNotice commitment={data.commitment} playerName={user.name} />
                </div>
              ) : null}
              {loan ? (
                <p className="mt-3 rounded-xl border border-accent/40 bg-accent-soft px-3.5 py-2.5 text-xs font-semibold text-accent-ink">
                  {loan.status === "pending"
                    ? format(tr.loanTalks, { parent: loan.parentClub.name, club: loan.borrowClub.name, amount: loan.feeTk, matches: loan.matches })
                    : loan.status === "scheduled"
                      ? format(tr.loanMineScheduled, { parent: loan.parentClub.name, club: loan.borrowClub.name })
                      : format(tr.loanMine, {
                          club: loan.borrowClub.name,
                          parent: loan.parentClub.name,
                          played: loan.matchesPlayed,
                          total: loan.matches,
                          date: loan.endsBy ? formatShortDate(loan.endsBy, locale) : "—",
                        })}
                </p>
              ) : null}
              {isClubLeader ? <p className="mt-3 text-xs text-warning-ink">{tr.notTransferable}</p> : null}
            </section>

            {/* Offers */}
            <section className="rounded-2xl border border-surface-line bg-surface/50 p-5">
              <h2 className="font-display text-base font-black text-ink">{tr.offersTitle}</h2>
              {received.length === 0 ? (
                <p className="mt-3 text-sm text-ink-soft">{tr.noOffers}</p>
              ) : (
                <div className="mt-4 space-y-4">
                  {received.length ? (
                    <div>
                      <h3 className="mb-2 font-mono text-[10px] font-bold uppercase tracking-wider text-ink-faint">{tr.incoming}</h3>
                      <ul className="space-y-3">
                        {received.map((o) => (
                          <OfferCard key={o.id} offer={o} viewer="player" canAct onOpenContract={(id, signAs) => setContract({ offerId: id, signAs })} onToast={toast} />
                        ))}
                      </ul>
                    </div>
                  ) : null}
                </div>
              )}
            </section>

            {/* Every club he proposed to: withdraw open ones, propose again to closed ones. */}
            <section className="rounded-2xl border border-surface-line bg-surface/50 p-5">
              <h2 className="font-display text-base font-black text-ink">{tr.myProposals}</h2>
              <ProposalList
                proposals={data.proposals ?? []}
                openClubIds={new Set(offers.filter((o) => o.status === "pending").map((o) => o.toClub.id))}
                canPropose={!isClubLeader && !lockedHere}
                onProposeAgain={(clubId) => setProposing({ clubId })}
                onOpenContract={(offerId, signAs) => setContract({ offerId, signAs })}
                onToast={toast}
              />
            </section>

            {/* History */}
            <section>
              <h2 className="mb-3 font-display text-base font-black text-ink">{tr.historyTitle}</h2>
              <TransferHistoryList userId={user.id} onOpenContract={(offerId) => setContract({ offerId })} />
            </section>
          </div>

          <div className="space-y-6">
            <WalletCard wallet={data.wallet} onToast={toast} />
          </div>
        </div>
      )}

      {proposing ? (
        <MakeOfferModal mode="proposal" clubId={proposing.clubId} onClose={() => setProposing(null)} onToast={toast} />
      ) : null}
      {contract ? (
        <ContractDocument
          offerId={contract.offerId}
          signAs={contract.signAs}
          onClose={() => setContract(null)}
          onToast={toast}
        />
      ) : null}
      <ToastContainer toasts={toasts} onDismiss={dismiss} />
    </div>
  );
}
