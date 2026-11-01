"use client";

import { Suspense, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useLanguage } from "@/lib/i18n/LanguageContext";
import { format } from "@/lib/i18n/translations";
import { useSession } from "@/lib/session/SessionContext";
import { useDeleteCoachPost, useMyCoaching, useSetMyRoles } from "@/lib/api/hooks/useCoaching";
import { useMockClubs } from "@/lib/mock/communityStore";
import { useToast } from "@/lib/useToast";
import { ToastContainer } from "@/components/common/Toast";
import { Avatar } from "@/components/common/Avatar";
import { AppLoader } from "@/components/common/AppLoader";
import { EmptyState } from "@/components/dashboard/EmptyState";
import { formatShortDate } from "@/components/dashboard/fixtures/labels";
import { tk } from "@/components/dashboard/transfers/shared";
import { CoachProfileForm } from "@/components/coaching/CoachProfileForm";
import { CoachPostComposer } from "@/components/coaching/CoachPostComposer";
import { CoachPostCard } from "@/components/coaching/CoachPostCard";
import { CoachingDealCard } from "@/components/coaching/CoachingDealCard";
import { CoachingDealModal } from "@/components/coaching/CoachingDealModal";
import { ChartIcon, SearchIcon, SwapIcon } from "@/components/icons";

const TABS = ["overview", "profile", "posts", "deals", "clubs"] as const;
type Tab = (typeof TABS)[number];

export default function CoachPage() {
  return (
    <Suspense fallback={<AppLoader />}>
      <CoachArea />
    </Suspense>
  );
}

function CoachArea() {
  const { t, locale } = useLanguage();
  const tc = t.coaching.coach;
  const { user, refreshSession } = useSession();
  const router = useRouter();
  const params = useSearchParams();
  const tab: Tab = (TABS as readonly string[]).includes(params.get("tab") ?? "") ? (params.get("tab") as Tab) : "overview";
  const isCoach = user.roles.includes("coach");
  const { data, isLoading } = useMyCoaching(isCoach);
  const del = useDeleteCoachPost();
  const addRole = useSetMyRoles();
  const { toasts, toast, dismiss } = useToast();
  const clubs = useMockClubs();
  const [search, setSearch] = useState("");
  const [askClub, setAskClub] = useState<{ id: string; name: string } | null>(null);

  const setTab = (next: Tab) => router.replace(next === "overview" ? "/dashboard/coach" : `/dashboard/coach?tab=${next}`, { scroll: false });

  const filteredClubs = useMemo(
    () =>
      [...clubs]
        .filter((c) => c.name.toLowerCase().includes(search.trim().toLowerCase()))
        .sort((a, b) => a.name.localeCompare(b.name))
        .slice(0, 60),
    [clubs, search],
  );

  if (!isCoach) {
    return (
      <div className="mx-auto max-w-xl space-y-4 text-center">
        <EmptyState icon={ChartIcon} title={tc.title} body={t.coaching.roles.blurbs.coach} />
        <button
          type="button"
          disabled={addRole.isPending}
          onClick={async () => {
            await addRole.mutateAsync({ roles: [...user.roles, "coach"], primaryRole: user.primaryRole });
            await refreshSession();
          }}
          className="rounded-full bg-accent px-5 py-2.5 font-display text-sm font-black text-bg disabled:opacity-50"
        >
          + {t.coaching.roles.names.coach}
        </button>
      </div>
    );
  }
  if (isLoading || !data) return <AppLoader />;

  const pending = data.posts.filter((p) => p.status === "pending").length;
  const approved = data.posts.filter((p) => p.status === "approved").length;
  const openDeals = data.deals.filter((d) => d.status === "pending").length;

  return (
    <div className="space-y-6">
      <ToastContainer toasts={toasts} onDismiss={dismiss} />
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-black text-ink">{tc.title}</h1>
          <p className="mt-1 text-sm text-ink-soft">{tc.subtitle}</p>
        </div>
        {data.profile ? (
          <Link href={`/dashboard/efootball/coaches/${user.id}`} className="rounded-full border border-surface-line-strong px-4 py-2 text-xs font-semibold text-ink-soft hover:text-ink">
            {tc.viewPublic}
          </Link>
        ) : null}
      </header>

      <nav className="flex flex-wrap gap-1.5" role="tablist">
        {TABS.map((key) => (
          <button
            key={key}
            type="button"
            role="tab"
            aria-selected={tab === key}
            onClick={() => setTab(key)}
            className={`rounded-full border px-4 py-1.5 text-xs font-semibold transition-colors ${
              tab === key ? "border-accent bg-accent-soft text-accent-ink" : "border-surface-line-strong text-ink-soft hover:text-ink"
            }`}
          >
            {tc.tabs[key]}
          </button>
        ))}
      </nav>

      {tab === "overview" ? (
        <div className="space-y-6">
          {!data.profile ? <CoachProfileForm profile={null} onSaved={(m) => toast(m, "success")} /> : null}
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <div className="rounded-2xl border border-surface-line bg-surface/50 p-4 sm:col-span-2">
              <div className="font-mono text-[10px] font-bold uppercase tracking-wider text-ink-faint">{tc.currentClub}</div>
              {data.current ? (
                <Link href={`/dashboard/efootball/clubs/${data.current.club.id}`} className="mt-2 flex items-center gap-3">
                  <Avatar dpUrl={data.current.club.dpUrl} name={data.current.club.name} size="md" mode="static" shape="square" />
                  <div>
                    <div className="font-display text-base font-black text-ink">{data.current.club.name}</div>
                    {data.current.endsAt ? (
                      <div className="text-xs text-ink-soft">{format(tc.endsOn, { date: formatShortDate(data.current.endsAt, locale) })}</div>
                    ) : null}
                  </div>
                </Link>
              ) : (
                <p className="mt-2 text-sm text-ink-soft">{tc.noClub}</p>
              )}
            </div>
            <div className="rounded-2xl border border-surface-line bg-surface/50 p-4">
              <div className="font-mono text-[10px] font-bold uppercase tracking-wider text-ink-faint">{tc.earned}</div>
              <div className="mt-2 font-display text-2xl font-black text-ink" data-testid="coach-earned">
                {tk(data.earnedTk)}
              </div>
              <div className="text-[11px] text-ink-faint">{format(tc.earnedHint, { pct: data.settings.commissionPct })}</div>
            </div>
            <div className="rounded-2xl border border-surface-line bg-surface/50 p-4">
              <div className="font-mono text-[10px] font-bold uppercase tracking-wider text-ink-faint">{tc.openDeals}</div>
              <div className="mt-2 font-display text-2xl font-black text-ink">{openDeals}</div>
              <div className="text-[11px] text-ink-faint">
                {tc.approvedPosts}: {approved} · {tc.pendingPosts}: {pending}
              </div>
            </div>
          </div>
          {data.deals.filter((d) => ["pending", "scheduled", "active"].includes(d.status)).length ? (
            <div className="grid gap-3 md:grid-cols-2">
              {data.deals
                .filter((d) => ["pending", "scheduled", "active"].includes(d.status))
                .map((d) => (
                  <CoachingDealCard key={d.id} deal={d} viewer="coach" canAct settings={data.settings} onToast={toast} />
                ))}
            </div>
          ) : null}
        </div>
      ) : null}

      {tab === "profile" ? (
        <CoachProfileForm key={data.profile?.updatedAt ?? "new"} profile={data.profile} onSaved={(m) => toast(m, "success")} />
      ) : null}

      {tab === "posts" ? (
        <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
          <div>
            {data.profile ? <CoachPostComposer onToast={toast} /> : <CoachProfileForm profile={null} onSaved={(m) => toast(m, "success")} />}
          </div>
          <div className="space-y-4">
            {data.posts.length ? (
              data.posts.map((p) => (
                <CoachPostCard
                  key={p.id}
                  post={p}
                  showStatus
                  onDelete={() => {
                    if (window.confirm(t.coaching.posts.deleteConfirm)) del.mutate(p.id);
                  }}
                />
              ))
            ) : (
              <EmptyState title={t.coaching.posts.empty} body="" />
            )}
          </div>
        </div>
      ) : null}

      {tab === "deals" ? (
        data.deals.length ? (
          <div className="grid gap-3 md:grid-cols-2">
            {data.deals.map((d) => (
              <CoachingDealCard key={d.id} deal={d} viewer="coach" canAct settings={data.settings} onToast={toast} />
            ))}
          </div>
        ) : (
          <EmptyState icon={SwapIcon} title={t.coaching.deals.empty} body="" />
        )
      ) : null}

      {tab === "clubs" ? (
        <div className="space-y-4">
          <label className="relative block max-w-md">
            <SearchIcon className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-faint" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={t.coaching.deals.pickClub}
              className="w-full rounded-full border border-surface-line bg-bg py-2.5 pl-9 pr-4 text-sm text-ink outline-none focus:border-accent"
            />
          </label>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {filteredClubs.map((c) => (
              <div key={c.id} className="flex items-center gap-3 rounded-2xl border border-surface-line bg-surface/50 p-3">
                <Avatar dpUrl={c.dpUrl} name={c.name} size="md" mode="static" shape="square" />
                <Link href={`/dashboard/efootball/clubs/${c.id}`} className="min-w-0 flex-1 truncate text-sm font-semibold text-ink hover:text-accent-ink">
                  {c.name}
                </Link>
                <button
                  type="button"
                  disabled={!data.profile}
                  onClick={() => setAskClub({ id: c.id, name: c.name })}
                  className="shrink-0 rounded-full border border-accent/50 px-3 py-1.5 text-xs font-bold text-accent-ink hover:bg-accent hover:text-bg disabled:opacity-40"
                >
                  {t.coaching.deals.askToCoach}
                </button>
              </div>
            ))}
          </div>
        </div>
      ) : null}

      {askClub ? (
        <CoachingDealModal
          mode="request"
          clubId={askClub.id}
          clubName={askClub.name}
          settings={data.settings}
          suggestedFeeTk={data.profile?.askingFeeTk}
          onClose={() => setAskClub(null)}
          onToast={toast}
        />
      ) : null}
    </div>
  );
}
