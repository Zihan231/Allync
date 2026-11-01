"use client";

import { useState } from "react";
import Link from "next/link";
import { useLanguage } from "@/lib/i18n/LanguageContext";
import { format } from "@/lib/i18n/translations";
import { useCoaches } from "@/lib/api/hooks/useCoaching";
import { useToast } from "@/lib/useToast";
import { ToastContainer } from "@/components/common/Toast";
import { Avatar } from "@/components/common/Avatar";
import { EmptyState } from "@/components/dashboard/EmptyState";
import { Pagination } from "@/components/dashboard/Pagination";
import { StatusPill } from "@/components/dashboard/StatusPill";
import { CoachingDealModal } from "@/components/coaching/CoachingDealModal";
import { useCoachingLeader } from "@/components/coaching/useCoachingLeader";
import { CoachCardSkeleton } from "@/components/coaching/CoachCardSkeleton";
import { ChartIcon, SearchIcon } from "@/components/icons";

/** Coaches clubs can approach; club leaders offer a deal straight from the list. */
export default function CoachesPage() {
  const { t } = useLanguage();
  const tdir = t.coaching.directory;
  const [search, setSearch] = useState("");
  const [availableOnly, setAvailableOnly] = useState(true);
  const [page, setPage] = useState(1);
  const { data, isLoading } = useCoaches({ search: search.trim() || undefined, available: availableOnly || undefined, page, limit: 12 });
  const leader = useCoachingLeader();
  const { toasts, toast, dismiss } = useToast();
  const [offerTo, setOfferTo] = useState<{ id: string; name: string; fee: number | null } | null>(null);

  return (
    <div className="space-y-6">
      <ToastContainer toasts={toasts} onDismiss={dismiss} />
      <header>
        <h1 className="font-display text-2xl font-black text-ink">{tdir.title}</h1>
        <p className="mt-1 text-sm text-ink-soft">{tdir.subtitle}</p>
      </header>

      <div className="flex flex-wrap items-center gap-3">
        <label className="relative block w-full max-w-sm">
          <SearchIcon className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-faint" />
          <input
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            placeholder={tdir.search}
            className="w-full rounded-full border border-surface-line bg-bg py-2.5 pl-9 pr-4 text-sm text-ink outline-none focus:border-accent"
          />
        </label>
        <button
          type="button"
          onClick={() => {
            setAvailableOnly(!availableOnly);
            setPage(1);
          }}
          aria-pressed={availableOnly}
          className={`rounded-full border px-3.5 py-1.5 text-xs font-semibold ${
            availableOnly ? "border-accent bg-accent-soft text-accent-ink" : "border-surface-line-strong text-ink-soft"
          }`}
        >
          {tdir.availableOnly}
        </button>
      </div>

      {isLoading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3" data-testid="coaches-loading">
          {Array.from({ length: 6 }, (_, i) => (
            <CoachCardSkeleton key={i} />
          ))}
        </div>
      ) : data?.data.length ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {data.data.map((c) => (
            <div key={c.userId} className="flex flex-col rounded-2xl border border-surface-line bg-surface/50 p-4" data-testid="coach-card">
              <div className="flex items-center gap-3">
                <Avatar dpUrl={c.dpUrl} name={c.name} size="md" mode="static" />
                <div className="min-w-0 flex-1">
                  <Link href={`/dashboard/efootball/coaches/${c.userId}`} className="block truncate font-display text-base font-black text-ink hover:text-accent-ink">
                    {c.name}
                  </Link>
                  <div className="truncate text-xs text-ink-soft">{c.headline}</div>
                </div>
              </div>
              {c.specialities.length ? (
                <div className="mt-3 flex flex-wrap gap-1.5">
                  {c.specialities.slice(0, 4).map((s) => (
                    <StatusPill key={s} tone="info">
                      {s}
                    </StatusPill>
                  ))}
                </div>
              ) : null}
              <div className="mt-3 flex flex-wrap gap-x-3 gap-y-1 text-[11px] text-ink-faint">
                <span>{format(tdir.posts, { n: c.posts })}</span>
                {c.askingFeeTk != null ? <span>{format(tdir.askingFee, { amount: c.askingFeeTk.toLocaleString("en-US") })}</span> : null}
                {c.currentClub ? <span className="text-accent-ink">{format(tdir.coachingClub, { club: c.currentClub.name })}</span> : null}
              </div>
              <div className="mt-4 flex gap-2 pt-1">
                <Link
                  href={`/dashboard/efootball/coaches/${c.userId}`}
                  className="flex-1 rounded-full border border-surface-line-strong px-3 py-1.5 text-center text-xs font-semibold text-ink-soft hover:text-ink"
                >
                  {tdir.viewProfile}
                </Link>
                {leader.clubId && c.available ? (
                  <button
                    type="button"
                    onClick={() => setOfferTo({ id: c.userId, name: c.name, fee: c.askingFeeTk })}
                    className="flex-1 rounded-full bg-accent px-3 py-1.5 text-xs font-black text-bg"
                  >
                    {tdir.offerDeal}
                  </button>
                ) : null}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <EmptyState icon={ChartIcon} title={tdir.empty} body="" />
      )}

      {data && data.meta.totalPages > 1 ? <Pagination page={page} pageCount={data.meta.totalPages} onPageChange={setPage} /> : null}

      {offerTo && leader.clubId ? (
        <CoachingDealModal
          mode="offer"
          clubId={leader.clubId}
          clubName={leader.clubName ?? undefined}
          coach={{ id: offerTo.id, name: offerTo.name }}
          clubBalanceTk={leader.balanceTk}
          suggestedFeeTk={offerTo.fee}
          onClose={() => setOfferTo(null)}
          onToast={toast}
        />
      ) : null}
    </div>
  );
}
