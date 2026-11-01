"use client";

import { useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useLanguage } from "@/lib/i18n/LanguageContext";
import { format } from "@/lib/i18n/translations";
import { useCoach } from "@/lib/api/hooks/useCoaching";
import { useFollowStats, useToggleFollow } from "@/lib/api/hooks/useFeed";
import { useSession } from "@/lib/session/SessionContext";
import { useToast } from "@/lib/useToast";
import { ToastContainer } from "@/components/common/Toast";
import { Avatar } from "@/components/common/Avatar";
import { CoverPhoto } from "@/components/common/CoverPhoto";
import { BackButton } from "@/components/dashboard/BackButton";
import { EmptyState } from "@/components/dashboard/EmptyState";
import { formatShortDate } from "@/components/dashboard/fixtures/labels";
import { CoachPostCard } from "@/components/coaching/CoachPostCard";
import { CoachingDealModal } from "@/components/coaching/CoachingDealModal";
import { useCoachingLeader } from "@/components/coaching/useCoachingLeader";
import { tk } from "@/components/dashboard/transfers/shared";
import { CalendarIcon, ChartIcon, FlagIcon, ShieldIcon, TrophyIcon, WalletIcon } from "@/components/icons";

/** A coach's public profile, laid out like a social profile: cover, intro, history and a feed of tutorials. */
export default function CoachProfilePage() {
  const { t, locale } = useLanguage();
  const tdir = t.coaching.directory;
  const tg = t.coaching.page;
  const { userId } = useParams<{ userId: string }>();
  const { user, isAuthenticated } = useSession();
  const { data, isLoading, isError } = useCoach(userId);
  const leader = useCoachingLeader();
  const { toasts, toast, dismiss } = useToast();
  const [offering, setOffering] = useState(false);
  const { data: followStats } = useFollowStats(userId);
  const follow = useToggleFollow();

  if (isLoading) return <CoachProfileSkeleton />;
  if (isError || !data) return <EmptyState icon={ChartIcon} title={tdir.empty} body="" />;

  const { profile } = data;
  const own = user.id === data.user.id;
  const pageUrl = `/dashboard/efootball/coaches/${data.user.id}`;
  const history = data.history ?? [];
  const publicPosts = data.posts.filter((p) => p.status === "approved").length;
  const share = async () => {
    await navigator.clipboard?.writeText(`${window.location.origin}${pageUrl}`).catch(() => undefined);
    toast(tg.copied, "success");
  };

  const following = followStats?.followedByMe ?? false;
  const stats: Array<[string, string]> = [
    [t.coaching.feed.followersLabel, String(followStats?.followers ?? 0)],
    [tg.tutorials, String(publicPosts)],
    [tg.clubsCoached, String(new Set(history.map((h) => h.clubId)).size)],
    [tg.usualFee, profile.askingFeeTk != null ? tk(profile.askingFeeTk) : "—"],
  ];

  return (
    <div className="mx-auto max-w-6xl space-y-6 pb-12">
      <ToastContainer toasts={toasts} onDismiss={dismiss} />
      <BackButton />

      {/* Cover, photo, name and actions */}
      <section className="overflow-hidden rounded-2xl border border-surface-line bg-surface/60" data-testid="coach-hero">
        <CoverPhoto coverUrl={data.user.coverUrl} name={data.user.name} hideInitial className="h-44 sm:h-64 lg:h-72" />
        <div className="relative px-4 pb-5 sm:px-8">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-end">
            <Avatar
              dpUrl={data.user.dpUrl}
              name={data.user.name}
              size="xl"
              mode="lightbox"
              className="-mt-14 ring-4 ring-bg sm:-mt-20"
            />
            <div className="min-w-0 flex-1 sm:pb-2">
              <h1 className="font-display text-2xl font-black text-ink sm:text-3xl">{data.user.name}</h1>
              {profile.headline ? <p className="mt-1 text-sm text-ink-soft sm:text-base">{profile.headline}</p> : null}
              <div className="mt-2 flex flex-wrap items-center gap-2 text-xs">
                <span className="rounded-full bg-blue-soft px-2.5 py-0.5 font-bold text-blue-ink">{t.coaching.roles.names.coach}</span>
                <span
                  className={`rounded-full px-2.5 py-0.5 font-bold ${
                    profile.available ? "bg-success-soft text-success-ink" : "bg-surface-line text-ink-faint"
                  }`}
                >
                  {profile.available ? tg.openToClubs : tg.notTaking}
                </span>
                {data.currentClub ? (
                  <Link
                    href={`/dashboard/efootball/clubs/${data.currentClub.id}`}
                    className="rounded-full bg-accent-soft px-2.5 py-0.5 font-bold text-accent-ink hover:underline"
                  >
                    {format(tg.coachingNow, { club: data.currentClub.name })}
                  </Link>
                ) : null}
              </div>
            </div>
            <div className="flex flex-wrap gap-2 sm:pb-2">
              {!own && isAuthenticated ? (
                <button
                  type="button"
                  onClick={() => follow.mutate({ coachId: data.user.id, on: !following })}
                  disabled={follow.isPending}
                  className={`rounded-full px-5 py-2.5 text-sm font-black ${
                    following ? "border border-surface-line-strong text-ink-soft" : "bg-blue text-white"
                  }`}
                >
                  {following ? t.coaching.feed.following : `+ ${t.coaching.feed.follow}`}
                </button>
              ) : null}
              {!own && leader.clubId && profile.available ? (
                <button type="button" onClick={() => setOffering(true)} className="rounded-full bg-accent px-5 py-2.5 text-sm font-black text-bg">
                  {tdir.offerDeal}
                </button>
              ) : null}
              {own ? (
                <Link href="/dashboard/coach/profile" className="rounded-full bg-accent px-5 py-2.5 text-sm font-black text-bg">
                  {tg.editCard}
                </Link>
              ) : null}
              {profile.youtubeChannelUrl ? (
                <a
                  href={profile.youtubeChannelUrl}
                  target="_blank"
                  rel="noopener noreferrer nofollow"
                  className="rounded-full border border-danger/40 bg-danger-soft/40 px-4 py-2.5 text-sm font-bold text-danger-ink hover:bg-danger-soft"
                >
                  ▶ {tdir.channel}
                </a>
              ) : null}
              <button
                type="button"
                onClick={share}
                className="rounded-full border border-surface-line-strong px-4 py-2.5 text-sm font-semibold text-ink-soft hover:text-ink"
              >
                ↗ {tg.share}
              </button>
            </div>
          </div>

          <div className="mt-5 grid grid-cols-4 divide-x divide-surface-line rounded-xl border border-surface-line bg-bg/40 text-center">
            {stats.map(([label, value]) => (
              <div key={label} className="px-2 py-3">
                <div className="font-display text-lg font-black text-ink sm:text-xl">{value}</div>
                <div className="font-mono text-[9px] font-bold uppercase tracking-wider text-ink-faint sm:text-[10px]">{label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,340px)_minmax(0,1fr)]">
        {/* Intro and history */}
        <aside className="space-y-4 lg:sticky lg:top-24 lg:self-start">
          <section className="rounded-2xl border border-surface-line bg-surface/60 p-5">
            <h2 className="font-display text-lg font-black text-ink">{tg.intro}</h2>
            <p className="mt-3 whitespace-pre-line text-sm leading-relaxed text-ink-soft">{profile.bio || tg.noBio}</p>
            <ul className="mt-4 space-y-3 text-sm">
              {data.currentClub ? (
                <li className="flex items-start gap-3">
                  <ShieldIcon className="mt-0.5 h-4 w-4 shrink-0 text-accent-ink" />
                  <span className="text-ink">
                    {format(tg.coachingNow, { club: data.currentClub.name })}
                    {data.currentClub.endsAt ? (
                      <span className="text-ink-faint"> · {format(tg.until, { date: formatShortDate(data.currentClub.endsAt, locale) })}</span>
                    ) : null}
                  </span>
                </li>
              ) : null}
              <li className="flex items-start gap-3">
                <WalletIcon className="mt-0.5 h-4 w-4 shrink-0 text-ink-faint" />
                <span className="text-ink">
                  {tg.usualFee}: <b>{profile.askingFeeTk != null ? tk(profile.askingFeeTk) : "—"}</b>
                </span>
              </li>
              <li className="flex items-start gap-3">
                <TrophyIcon className="mt-0.5 h-4 w-4 shrink-0 text-ink-faint" />
                <span className="text-ink">{profile.available ? tg.openToClubs : tg.notTaking}</span>
              </li>
              {data.user.country ? (
                <li className="flex items-start gap-3">
                  <FlagIcon className="mt-0.5 h-4 w-4 shrink-0 text-ink-faint" />
                  <span className="text-ink">{format(tg.from, { place: data.user.country })}</span>
                </li>
              ) : null}
              {data.user.joinedAt ? (
                <li className="flex items-start gap-3">
                  <CalendarIcon className="mt-0.5 h-4 w-4 shrink-0 text-ink-faint" />
                  <span className="text-ink">{format(tg.joined, { date: formatShortDate(data.user.joinedAt, locale) })}</span>
                </li>
              ) : null}
            </ul>
            {profile.specialities.length ? (
              <div className="mt-4 border-t border-surface-line pt-4">
                <h3 className="font-mono text-[10px] font-bold uppercase tracking-wider text-ink-faint">{tg.specialities}</h3>
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {profile.specialities.map((s) => (
                    <span key={s} className="rounded-full border border-blue/40 bg-blue-soft/50 px-3 py-1 text-xs font-semibold text-blue-ink">
                      {s}
                    </span>
                  ))}
                </div>
              </div>
            ) : null}
          </section>

          <section className="rounded-2xl border border-surface-line bg-surface/60 p-5">
            <h2 className="font-display text-lg font-black text-ink">{tg.history}</h2>
            {history.length ? (
              <ul className="mt-3 space-y-3">
                {history.map((h, i) => (
                  <li key={`${h.clubId}-${i}`}>
                    <Link href={`/dashboard/efootball/clubs/${h.clubId}`} className="flex items-center gap-3 rounded-xl p-1.5 hover:bg-surface">
                      <Avatar dpUrl={h.dpUrl} name={h.name} size="md" mode="static" shape="square" />
                      <div className="min-w-0 flex-1">
                        <div className="truncate text-sm font-semibold text-ink">{h.name}</div>
                        <div className="text-[11px] text-ink-faint">
                          {h.startedAt ? formatShortDate(h.startedAt, locale) : ""}
                          {" – "}
                          {h.status === "active" ? tg.now : h.endedAt ? formatShortDate(h.endedAt, locale) : ""}
                        </div>
                      </div>
                      {h.status === "active" ? (
                        <span className="rounded-full bg-accent px-2 py-0.5 font-mono text-[9px] font-bold uppercase text-bg">{tg.now}</span>
                      ) : null}
                    </Link>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="mt-3 text-sm text-ink-soft">{tg.historyEmpty}</p>
            )}
          </section>
        </aside>

        {/* Feed */}
        <section className="space-y-4">
          <h2 className="font-display text-lg font-black text-ink">{tg.feedTitle}</h2>
          {data.posts.length ? (
            data.posts.map((p) => (
              <CoachPostCard
                key={p.id}
                post={p}
                author={{ name: data.user.name, dpUrl: data.user.dpUrl }}
                showStatus={own && p.status !== "approved"}
                shareUrl={p.status === "approved" ? pageUrl : undefined}
                onShared={() => toast(tg.copied, "success")}
              />
            ))
          ) : (
            <EmptyState icon={ChartIcon} title={t.coaching.posts.publicEmpty} body="" />
          )}
        </section>
      </div>

      {offering && leader.clubId ? (
        <CoachingDealModal
          mode="offer"
          clubId={leader.clubId}
          clubName={leader.clubName ?? undefined}
          coach={{ id: data.user.id, name: data.user.name }}
          clubBalanceTk={leader.balanceTk}
          suggestedFeeTk={profile.askingFeeTk}
          onClose={() => setOffering(false)}
          onToast={toast}
        />
      ) : null}
    </div>
  );
}

/** Same shape as the page while it loads. */
function CoachProfileSkeleton() {
  return (
    <div className="mx-auto max-w-6xl animate-pulse space-y-6" aria-hidden="true">
      <div className="h-9 w-24 rounded-full bg-surface-line/60" />
      <div className="overflow-hidden rounded-2xl border border-surface-line bg-surface/60">
        <div className="h-44 bg-surface-line/50 sm:h-64 lg:h-72" />
        <div className="px-4 pb-5 sm:px-8">
          <div className="-mt-14 h-28 w-28 rounded-full bg-surface-line ring-4 ring-bg sm:-mt-20 sm:h-32 sm:w-32" />
          <div className="mt-4 h-7 w-56 rounded-md bg-surface-line/90" />
          <div className="mt-2 h-4 w-72 rounded-md bg-surface-line/60" />
          <div className="mt-5 h-16 rounded-xl bg-surface-line/40" />
        </div>
      </div>
      <div className="grid gap-6 lg:grid-cols-[minmax(0,340px)_minmax(0,1fr)]">
        <div className="h-80 rounded-2xl bg-surface-line/40" />
        <div className="space-y-4">
          <div className="h-72 rounded-2xl bg-surface-line/40" />
          <div className="h-56 rounded-2xl bg-surface-line/40" />
        </div>
      </div>
    </div>
  );
}
