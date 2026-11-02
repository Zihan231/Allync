"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useLanguage } from "@/lib/i18n/LanguageContext";
import { format } from "@/lib/i18n/translations";
import { useSession } from "@/lib/session/SessionContext";
import { useSponsor } from "@/lib/api/hooks/useSponsors";
import { useFollowStats, useToggleFollow } from "@/lib/api/hooks/useFeed";
import { BackButton } from "@/components/dashboard/BackButton";
import { EmptyState } from "@/components/dashboard/EmptyState";
import { formatShortDate } from "@/components/dashboard/fixtures/labels";
import { CoachPostCard } from "@/components/coaching/CoachPostCard";
import { WalletIcon } from "@/components/icons";
import { BrandLogo, VerifiedTick } from "@/components/sponsors/BrandLogo";

/** A sponsor's public page (Facebook-style): banner, brand, follow, what they sponsor, and their posts. */
export default function SponsorPublicPage() {
  const { userId } = useParams<{ userId: string }>();
  const { t, locale } = useLanguage();
  const tp = t.sponsors.publicPage;
  const { user, isAuthenticated } = useSession();
  const { data, isLoading, isError } = useSponsor(userId);
  const follow = useToggleFollow();
  const stats = useFollowStats(userId);
  const own = user.id === userId;

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="h-56 animate-pulse rounded-2xl bg-surface" />
        <div className="grid gap-4 lg:grid-cols-[320px_minmax(0,1fr)]">
          <div className="h-64 animate-pulse rounded-2xl bg-surface" />
          <div className="h-96 animate-pulse rounded-2xl bg-surface" />
        </div>
      </div>
    );
  }
  if (isError || !data) return <EmptyState icon={WalletIcon} title={tp.notFound} body="" />;
  const { profile } = data;
  const current = data.sponsorships.filter((s) => s.status === "active");
  const past = data.sponsorships.filter((s) => s.status !== "active");
  const following = stats.data?.followedByMe ?? false;

  return (
    <div className="space-y-6">
      <BackButton />
      <section className="overflow-hidden rounded-2xl border border-surface-line bg-surface/50">
        <div className="relative aspect-[4/1] min-h-32 w-full bg-gradient-to-r from-surface to-surface-line">
          {profile.bannerUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={profile.bannerUrl} alt="" className="absolute inset-0 h-full w-full object-cover" />
          ) : null}
        </div>
        <div className="flex flex-wrap items-end gap-4 px-4 pb-4 sm:px-6">
          <BrandLogo name={profile.brandName} logoUrl={profile.logoUrl} size="xl" className="relative z-10 -mt-12 border-4 border-bg" />
          <div className="min-w-0 flex-1 pt-2">
            <div className="flex items-center gap-2">
              <h1 className="truncate font-display text-2xl font-black text-ink">{profile.brandName}</h1>
              {profile.verified ? <VerifiedTick label={t.sponsors.profile.verified} /> : null}
            </div>
            <p className="text-sm text-ink-soft">{profile.tagline}</p>
            <div className="mt-1 flex flex-wrap gap-x-3 text-xs text-ink-faint">
              <span className="font-semibold text-accent-ink">{t.coaching.roles.names.sponsor}</span>
              {profile.industry ? <span>{profile.industry}</span> : null}
              <span>{format(t.coaching.feed.followers, { n: stats.data?.followers ?? 0 })}</span>
              {data.user.joinedAt ? <span>{format(tp.since, { date: formatShortDate(data.user.joinedAt, locale) })}</span> : null}
            </div>
          </div>
          <div className="flex gap-2">
            {profile.website ? (
              <a href={profile.website} target="_blank" rel="noopener noreferrer" className="rounded-full border border-surface-line-strong px-4 py-2 text-xs font-semibold text-ink-soft hover:text-ink">
                {t.sponsors.profile.website}
              </a>
            ) : null}
            {!own && isAuthenticated ? (
              <button
                type="button"
                onClick={() => follow.mutate({ coachId: userId, on: !following })}
                className={`rounded-full px-4 py-2 text-xs font-bold ${following ? "border border-surface-line-strong text-ink-soft" : "bg-accent text-bg"}`}
              >
                {following ? t.coaching.feed.following : `+ ${t.coaching.feed.follow}`}
              </button>
            ) : null}
          </div>
        </div>
      </section>

      <div className="grid gap-6 lg:grid-cols-[320px_minmax(0,1fr)]">
        <aside className="space-y-4 lg:sticky lg:top-24 lg:self-start">
          {profile.about ? <p className="whitespace-pre-line rounded-2xl border border-surface-line bg-surface/50 p-4 text-sm text-ink-soft">{profile.about}</p> : null}
          {[
            { title: tp.sponsoring, list: current },
            { title: tp.pastSponsorships, list: past },
          ].map(({ title, list }) =>
            list.length ? (
              <section key={title} className="space-y-2 rounded-2xl border border-surface-line bg-surface/50 p-4">
                <h2 className="font-display text-sm font-black text-ink">{title}</h2>
                {list.map((s) => (
                  <Link key={s.id} href={s.target.link} className="flex items-center justify-between gap-2 rounded-xl px-2 py-1.5 hover:bg-surface">
                    <span className="truncate text-sm font-semibold text-ink">{s.target.name}</span>
                    <span className="shrink-0 font-mono text-[10px] font-bold uppercase text-accent-ink">{t.sponsors.tiers[s.tier]}</span>
                  </Link>
                ))}
              </section>
            ) : null,
          )}
        </aside>
        <div className="mx-auto w-full max-w-2xl space-y-4">
          <h2 className="font-display text-lg font-black text-ink">{tp.posts}</h2>
          {data.posts.length ? (
            data.posts.map((post) => <CoachPostCard key={post.id} post={post} author={{ name: profile.brandName, dpUrl: profile.logoUrl }} showStatus={own} />)
          ) : (
            <p className="rounded-2xl border border-dashed border-surface-line-strong py-10 text-center text-sm text-ink-faint">{tp.noPosts}</p>
          )}
        </div>
      </div>
    </div>
  );
}
