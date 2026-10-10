"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useLanguage } from "@/lib/i18n/LanguageContext";
import type { Club } from "@/lib/mock/types";
import { useClubTransfers, useFreeAgents } from "@/lib/api/hooks/useTransfers";
import { useToast } from "@/lib/useToast";
import { ToastContainer } from "@/components/common/Toast";
import { Avatar } from "../common/Avatar";
import { ContractDocument } from "./transfers/ContractDocument";
import { OfferToPlayerModal } from "./transfers/MakeOfferModal";
import { OfferCard } from "./transfers/OfferCard";
import { TransferHistoryList } from "./transfers/TransferHistoryList";
import { WalletCard } from "./transfers/WalletCard";
import { TransferFeeBadge } from "./transfers/shared";
import { Pagination } from "./Pagination";
import { SearchIcon, SwapIcon } from "../icons";

const LEADERS = ["President", "General Secretary"];

/**
 * A club's transfer hub. Everyone sees the squad's contracts and the history;
 * the President / General Secretary also get the club wallet, proposals and
 * offers, and the free-agent market.
 */
export function ClubTransfersTab({ club }: { club: Club }) {
  const { t } = useLanguage();
  const tr = t.dashboard.transfers;
  const { data, isLoading } = useClubTransfers(club.id);
  const { toasts, toast, dismiss } = useToast();
  const [contract, setContract] = useState<{ offerId: string; signAs?: "player" | "club" } | null>(null);
  const [offerTo, setOfferTo] = useState<{ id: string; name: string } | null>(null);

  const leader = Boolean(data?.isLeader);
  const balance = data?.wallet?.balanceTk ?? null;

  if (isLoading || !data) return <div className="h-64 animate-pulse rounded-2xl border border-surface-line bg-surface/40" />;

  return (
    <div className="space-y-6">
      <div className="grid gap-6 lg:grid-cols-[1fr_340px]">
        <div className="min-w-0 space-y-6">
          {leader ? (
            <>
              <OfferList title={tr.joinRequests} offers={data.incoming} clubId={club.id} onOpen={(id, signAs) => setContract({ offerId: id, signAs })} onToast={toast} />
              <OfferList title={tr.ourOffers} offers={data.outgoing} clubId={club.id} onOpen={(id, signAs) => setContract({ offerId: id, signAs })} onToast={toast} />
            </>
          ) : (
            <p className="rounded-xl border border-dashed border-surface-line p-4 text-xs text-ink-faint">{tr.leaderOnly}</p>
          )}

          {/* Squad contracts */}
          <section className="rounded-2xl border border-surface-line bg-surface/50 p-5">
            <h3 className="flex items-center gap-2 font-display text-base font-black text-ink">
              <SwapIcon className="h-4 w-4 text-accent-ink" />
              {tr.squadTitle}
            </h3>
            <ul className="mt-3 divide-y divide-surface-line/70">
              {data.squad.map((m) => {
                const isLeaderRole = LEADERS.includes(m.clubRole ?? "");
                return (
                  <li key={m.userId} className="flex flex-wrap items-center gap-3 py-2.5">
                    <Link href={`/dashboard/efootball/players/${m.userId}`} className="flex min-w-0 flex-1 items-center gap-2.5">
                      <Avatar dpUrl={m.dpUrl} name={m.name} size="sm" mode="static" />
                      <span className="min-w-0">
                        <span className="block truncate text-sm font-semibold text-ink">{m.name}</span>
                        <span className="block text-[11px] text-ink-faint">{m.clubRole ?? "Player"}</span>
                      </span>
                    </Link>
                    {m.contract ? <TransferFeeBadge contract={m.contract} compact /> : <span className="text-[11px] text-ink-faint">{tr.noContractYet}</span>}
                    {leader && !isLeaderRole ? (
                      <button
                        type="button"
                        onClick={() => setOfferTo({ id: m.userId, name: m.name })}
                        className="rounded-full border border-accent/50 px-3 py-1 text-[11px] font-bold text-accent-ink hover:bg-accent hover:text-bg"
                      >
                        {tr.renew}
                      </button>
                    ) : null}
                    {m.contract?.offerId ? (
                      <button type="button" onClick={() => setContract({ offerId: m.contract!.offerId! })} className="text-[11px] font-bold text-ink-soft hover:text-ink">
                        {tr.viewContract}
                      </button>
                    ) : null}
                  </li>
                );
              })}
            </ul>
          </section>

          {leader ? <FreeAgentMarket clubId={club.id} onOffer={setOfferTo} /> : null}

          <section>
            <h3 className="mb-3 font-display text-base font-black text-ink">{tr.historyTitle}</h3>
            <TransferHistoryList clubId={club.id} onOpenContract={leader ? (offerId) => setContract({ offerId }) : undefined} />
          </section>
        </div>

        {leader && data.wallet ? (
          <div className="space-y-6">
            <WalletCard wallet={data.wallet} clubId={club.id} title={tr.clubWalletTitle} onToast={toast} />
          </div>
        ) : null}
      </div>

      {offerTo ? (
        <OfferToPlayerModal
          clubId={club.id}
          clubName={club.name}
          clubBalanceTk={balance}
          player={offerTo}
          onClose={() => setOfferTo(null)}
          onToast={toast}
        />
      ) : null}
      {contract ? (
        <ContractDocument
          offerId={contract.offerId}
          signAs={contract.signAs}
          balanceTk={balance}
          onClose={() => setContract(null)}
          onToast={toast}
        />
      ) : null}
      <ToastContainer toasts={toasts} onDismiss={dismiss} />
    </div>
  );
}

function OfferList({
  title,
  offers,
  clubId,
  onOpen,
  onToast,
}: {
  title: string;
  offers: import("@/lib/api/transfers").TransferOffer[];
  clubId: string;
  onOpen: (offerId: string, signAs?: "player" | "club") => void;
  onToast: (message: string, variant?: "success" | "error") => void;
}) {
  const { t } = useLanguage();
  return (
    <section className="rounded-2xl border border-surface-line bg-surface/50 p-5">
      <h3 className="font-display text-base font-black text-ink">
        {title} <span className="ml-1 rounded-full bg-surface-line px-2 py-0.5 font-mono text-[11px] text-ink-faint">{offers.length}</span>
      </h3>
      {offers.length ? (
        <ul className="mt-3 space-y-3">
          {offers.map((o) => (
            // Only the signing club acts; a club whose player is being bought out just follows the deal.
            <OfferCard key={o.id} offer={o} viewer="club" canAct={o.toClub.id === clubId} onOpenContract={onOpen} onToast={onToast} />
          ))}
        </ul>
      ) : (
        <p className="mt-2 text-xs text-ink-faint">{t.dashboard.transfers.noOffers}</p>
      )}
    </section>
  );
}

/** Players a club can sign without a buyout: clubless, or out of their lock. */
function FreeAgentMarket({ clubId, onOffer }: { clubId: string; onOffer: (p: { id: string; name: string }) => void }) {
  const { t } = useLanguage();
  const tr = t.dashboard.transfers;
  const [input, setInput] = useState("");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  useEffect(() => {
    const timer = window.setTimeout(() => {
      setSearch(input.trim());
      setPage(1);
    }, 300);
    return () => window.clearTimeout(timer);
  }, [input]);
  const { data } = useFreeAgents({ search: search || undefined, page, limit: 10 });

  return (
    <section className="rounded-2xl border border-surface-line bg-surface/50 p-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h3 className="font-display text-base font-black text-ink">{tr.marketTitle}</h3>
        <div className="relative w-full sm:w-60">
          <SearchIcon className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-ink-faint" />
          <input
            type="search"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={tr.searchPlayers}
            className="w-full rounded-lg border border-surface-line bg-bg py-1.5 pl-8 pr-3 text-xs text-ink outline-none focus:border-accent"
          />
        </div>
      </div>
      <ul className="mt-3 divide-y divide-surface-line/70">
        {(data?.data ?? []).length ? (
          data!.data
            .filter((p) => p.clubId !== clubId)
            .map((p) => (
              <li key={p.id} className="flex items-center gap-3 py-2">
                <Link href={`/dashboard/efootball/players/${p.id}`} className="flex min-w-0 flex-1 items-center gap-2.5">
                  <Avatar dpUrl={p.dpUrl} name={p.name} size="sm" mode="static" />
                  <span className="min-w-0">
                    <span className="block truncate text-sm font-semibold text-ink">{p.name}</span>
                    <span className="block truncate text-[11px] text-ink-faint">
                      {p.clubName ?? tr.noClub} · {p.points} pts{p.gamePosition ? ` · ${p.gamePosition}` : ""}
                    </span>
                  </span>
                </Link>
                <button
                  type="button"
                  onClick={() => onOffer({ id: p.id, name: p.name })}
                  className="rounded-full bg-accent px-3 py-1 text-[11px] font-bold text-bg"
                >
                  {tr.makeOffer}
                </button>
              </li>
            ))
        ) : (
          <li className="py-4 text-center text-xs text-ink-faint">{tr.noAgents}</li>
        )}
      </ul>
      {(data?.meta.totalPages ?? 1) > 1 ? (
        <div className="mt-3">
          <Pagination page={page} pageCount={data!.meta.totalPages} onPageChange={setPage} />
        </div>
      ) : null}
    </section>
  );
}
