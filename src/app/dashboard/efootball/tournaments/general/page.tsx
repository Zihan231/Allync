"use client";

import { Suspense, useEffect, useMemo, useState } from "react";
import { useLanguage } from "@/lib/i18n/LanguageContext";
import { useTournaments } from "@/lib/api/hooks/useTournaments";
import { tournamentHref, type BackendTournament, type TournamentType } from "@/lib/api/tournaments";
import { useUrlTab } from "@/lib/navigation/useUrlTab";
import { AppLoader } from "@/components/common/AppLoader";
import { PageHeader } from "@/components/dashboard/PageHeader";
import { TournamentCard } from "@/components/dashboard/TournamentCard";
import { EmptyState } from "@/components/dashboard/EmptyState";
import { Pagination } from "@/components/dashboard/Pagination";
import { CrosshairIcon, SearchIcon, TrophyIcon, UsersIcon } from "@/components/icons";

const PAGE_SIZE = 9;
const TABS: readonly TournamentType[] = ["cvc", "pvp"];
type StatusFilter = "all" | "upcoming" | "live" | "completed";
type Platform = "all" | "mobile" | "console";
type Fee = "all" | "free" | "paid";
type Sort = "status" | "recent" | "prize" | "platform";

function statusGroup(status: string | undefined): Exclude<StatusFilter, "all"> {
  const s = (status ?? "").toLowerCase();
  if (s === "ongoing" || s === "live") return "live";
  if (s === "completed" || s === "cancelled") return "completed";
  return "upcoming";
}
const startMs = (tour: BackendTournament) => new Date(tour.startAt).getTime() || 0;
const RANK = { live: 0, upcoming: 1, completed: 2 } as const;

/**
 * Every general tournament (organizer-run, open to every player and club), with the
 * usual filters: CvC / PvP tabs, status, platform, fee, search and sort.
 */
function GeneralTournaments() {
  const { t } = useLanguage();
  const o = t.dashboard.organizerMode;
  const m = t.dashboard.myTournaments;
  const [tab, setTab] = useUrlTab(TABS, "cvc");
  const [status, setStatus] = useState<StatusFilter>("all");
  const [platform, setPlatform] = useState<Platform>("all");
  const [fee, setFee] = useState<Fee>("all");
  const [sort, setSort] = useState<Sort>("status");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const { data, isLoading } = useTournaments({ host: "general" });

  useEffect(() => setPage(1), [tab, status, platform, fee, sort, search]);

  const ofTab = useMemo(() => (data ?? []).filter((tour) => tour.type === tab), [data, tab]);
  const shown = useMemo(() => {
    const q = search.trim().toLowerCase();
    return ofTab
      .filter((tour) => status === "all" || statusGroup(tour.status) === status)
      .filter((tour) => platform === "all" || (tour.platform ?? "mobile") === platform)
      .filter((tour) => fee === "all" || (fee === "paid") === (tour.entryFeeBdt ?? 0) > 0)
      .filter((tour) => !q || tour.name.toLowerCase().includes(q) || (tour.creator?.name ?? "").toLowerCase().includes(q))
      .sort((a, b) => {
        if (sort === "platform" && (a.platform ?? "mobile") !== (b.platform ?? "mobile")) return a.platform === "console" ? -1 : 1;
        if (sort === "prize") return (b.prizePoolBdt ?? 0) - (a.prizePoolBdt ?? 0) || startMs(b) - startMs(a);
        if (sort === "recent") return startMs(b) - startMs(a);
        const ga = statusGroup(a.status);
        const gb = statusGroup(b.status);
        if (ga !== gb) return RANK[ga] - RANK[gb];
        return ga === "completed" ? startMs(b) - startMs(a) : startMs(a) - startMs(b);
      });
  }, [ofTab, status, platform, fee, sort, search]);

  const pageCount = Math.max(1, Math.ceil(shown.length / PAGE_SIZE));
  const current = Math.min(page, pageCount);
  const items = shown.slice((current - 1) * PAGE_SIZE, current * PAGE_SIZE);

  const pill = (active: boolean) =>
    `rounded-md px-2.5 py-1 font-medium transition-colors ${active ? "bg-accent text-bg" : "text-ink-soft hover:text-ink"}`;
  const group = "flex flex-wrap items-center rounded-lg border border-surface-line bg-surface/50 p-1 text-xs";
  function options<T extends string>(value: T, set: (v: T) => void, list: ReadonlyArray<readonly [T, string]>) {
    return (
      <div className={group}>
        {list.map(([v, label]) => (
          <button key={v} type="button" onClick={() => set(v)} className={pill(value === v)}>
            {label}
          </button>
        ))}
      </div>
    );
  }

  return (
    <div>
      <PageHeader eyebrow={o.generalEyebrow} title={o.generalTitle} />

      <div className="mt-8 flex overflow-x-auto border-b border-surface-line">
        {(
          [
            ["cvc", o.tabCvc, UsersIcon],
            ["pvp", o.tabPvp, CrosshairIcon],
          ] as const
        ).map(([value, label, Icon]) => (
          <button
            key={value}
            type="button"
            onClick={() => setTab(value)}
            className={`flex shrink-0 items-center gap-2 border-b-2 px-6 py-3 font-display text-sm font-semibold transition-colors ${
              tab === value ? "border-accent text-accent-ink" : "border-transparent text-ink-soft hover:text-ink"
            }`}
          >
            <Icon className="h-4 w-4" />
            {label}
            <span className="rounded-full bg-surface-line px-2 py-0.5 text-xs text-ink-faint">
              {(data ?? []).filter((tour) => tour.type === value).length}
            </span>
          </button>
        ))}
      </div>

      <div className="mt-6 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="relative max-w-md flex-1">
          <SearchIcon className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-faint" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={o.generalSearch}
            className="w-full rounded-xl border border-surface-line bg-surface/60 py-2 pl-10 pr-3 text-sm text-ink placeholder:text-ink-faint outline-none focus:border-accent"
          />
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {options(status, setStatus, [
            ["all", m.statusAll],
            ["upcoming", m.statusUpcoming],
            ["live", m.statusLive],
            ["completed", m.statusCompleted],
          ])}
          {options(platform, setPlatform, [
            ["all", m.platformAll],
            ["mobile", m.platformMobile],
            ["console", m.platformConsole],
          ])}
          {options(fee, setFee, [
            ["all", m.feeAll],
            ["free", m.feeFree],
            ["paid", m.feePaid],
          ])}
          <select
            value={sort}
            onChange={(e) => setSort(e.target.value as Sort)}
            aria-label={m.sortLabel}
            className="rounded-lg border border-surface-line bg-surface px-3 py-1.5 text-xs text-ink-soft outline-none focus:border-accent [color-scheme:dark]"
          >
            <option value="status">{m.sortStatus}</option>
            <option value="recent">{m.sortRecent}</option>
            <option value="prize">{m.sortPrize}</option>
            <option value="platform">{m.sortPlatform}</option>
          </select>
        </div>
      </div>

      <div className="mt-6">
        {isLoading ? (
          <div className="flex h-64 items-center justify-center">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-accent border-t-transparent" />
          </div>
        ) : items.length ? (
          <>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {items.map((tour) => (
                <TournamentCard key={tour.id} tournament={tour} href={tournamentHref(tour)} />
              ))}
            </div>
            {pageCount > 1 ? (
              <div className="mt-8">
                <Pagination page={current} pageCount={pageCount} onPageChange={setPage} />
              </div>
            ) : null}
          </>
        ) : (
          <EmptyState icon={TrophyIcon} title={o.generalEmpty} body={o.generalEmptyBody} />
        )}
      </div>
    </div>
  );
}

export default function GeneralTournamentsPage() {
  return (
    <Suspense fallback={<AppLoader />}>
      <GeneralTournaments />
    </Suspense>
  );
}
