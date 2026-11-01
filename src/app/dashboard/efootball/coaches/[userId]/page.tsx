"use client";

import { useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useLanguage } from "@/lib/i18n/LanguageContext";
import { format } from "@/lib/i18n/translations";
import { useCoach } from "@/lib/api/hooks/useCoaching";
import { useSession } from "@/lib/session/SessionContext";
import { useToast } from "@/lib/useToast";
import { ToastContainer } from "@/components/common/Toast";
import { Avatar } from "@/components/common/Avatar";
import { AppLoader } from "@/components/common/AppLoader";
import { BackButton } from "@/components/dashboard/BackButton";
import { EmptyState } from "@/components/dashboard/EmptyState";
import { StatusPill } from "@/components/dashboard/StatusPill";
import { formatShortDate } from "@/components/dashboard/fixtures/labels";
import { CoachPostCard } from "@/components/coaching/CoachPostCard";
import { CoachingDealModal } from "@/components/coaching/CoachingDealModal";
import { useCoachingLeader } from "@/components/coaching/useCoachingLeader";
import { tk } from "@/components/dashboard/transfers/shared";
import { ChartIcon } from "@/components/icons";

/** A coach's public page: his card and approved tutorials; club leaders can offer him a deal. */
export default function CoachProfilePage() {
  const { t, locale } = useLanguage();
  const tdir = t.coaching.directory;
  const { userId } = useParams<{ userId: string }>();
  const { user } = useSession();
  const { data, isLoading, isError } = useCoach(userId);
  const leader = useCoachingLeader();
  const { toasts, toast, dismiss } = useToast();
  const [offering, setOffering] = useState(false);

  if (isLoading) return <AppLoader />;
  if (isError || !data) return <EmptyState icon={ChartIcon} title={tdir.empty} body="" />;
  const { profile } = data;
  const own = user.id === data.user.id;

  return (
    <div className="space-y-6">
      <ToastContainer toasts={toasts} onDismiss={dismiss} />
      <BackButton />
      <section className="overflow-hidden rounded-2xl border border-surface-line bg-surface/50">
        <div
          className="h-28 bg-gradient-to-r from-blue/30 via-surface to-accent/20 bg-cover bg-center sm:h-36"
          style={data.user.coverUrl ? { backgroundImage: `url(${data.user.coverUrl})` } : undefined}
        />
        <div className="flex flex-wrap items-end gap-4 px-5 pb-5">
          <Avatar dpUrl={data.user.dpUrl} name={data.user.name} size="xl" mode="lightbox" className="-mt-12 ring-4 ring-bg" />
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="font-display text-2xl font-black text-ink">{data.user.name}</h1>
              <StatusPill tone="info">{t.coaching.roles.names.coach}</StatusPill>
              {profile.available ? <StatusPill tone="success">{tdir.availableOnly}</StatusPill> : null}
            </div>
            {profile.headline ? <p className="mt-1 text-sm text-ink-soft">{profile.headline}</p> : null}
          </div>
          <div className="flex flex-wrap gap-2">
            {profile.youtubeChannelUrl ? (
              <a
                href={profile.youtubeChannelUrl}
                target="_blank"
                rel="noopener noreferrer nofollow"
                className="rounded-full border border-danger/40 px-4 py-2 text-xs font-bold text-danger-ink hover:bg-danger-soft"
              >
                ▶ {tdir.channel}
              </a>
            ) : null}
            {!own && leader.clubId && profile.available ? (
              <button type="button" onClick={() => setOffering(true)} className="rounded-full bg-accent px-4 py-2 text-xs font-black text-bg">
                {tdir.offerDeal}
              </button>
            ) : null}
          </div>
        </div>
        <div className="grid gap-3 border-t border-surface-line px-5 py-4 text-sm sm:grid-cols-3">
          <div>
            <div className="font-mono text-[10px] font-bold uppercase tracking-wider text-ink-faint">{t.coaching.coach.currentClub}</div>
            {data.currentClub ? (
              <Link href={`/dashboard/efootball/clubs/${data.currentClub.id}`} className="mt-1 block font-semibold text-ink hover:text-accent-ink">
                {data.currentClub.name}
                {data.currentClub.endsAt ? (
                  <span className="ml-1 text-xs font-normal text-ink-faint">· {format(t.coaching.coach.endsOn, { date: formatShortDate(data.currentClub.endsAt, locale) })}</span>
                ) : null}
              </Link>
            ) : (
              <div className="mt-1 text-ink-soft">{t.coaching.coach.noClub}</div>
            )}
          </div>
          <div>
            <div className="font-mono text-[10px] font-bold uppercase tracking-wider text-ink-faint">{t.coaching.coach.askingFee}</div>
            <div className="mt-1 font-semibold text-ink">{profile.askingFeeTk != null ? tk(profile.askingFeeTk) : "—"}</div>
          </div>
          <div>
            <div className="font-mono text-[10px] font-bold uppercase tracking-wider text-ink-faint">{t.coaching.coach.specialities}</div>
            <div className="mt-1 flex flex-wrap gap-1.5">
              {profile.specialities.length ? profile.specialities.map((s) => <StatusPill key={s} tone="info">{s}</StatusPill>) : "—"}
            </div>
          </div>
        </div>
        {profile.bio ? <p className="whitespace-pre-line border-t border-surface-line px-5 py-4 text-sm leading-relaxed text-ink-soft">{profile.bio}</p> : null}
      </section>

      <section className="space-y-4">
        {data.posts.length ? (
          <div className="mx-auto max-w-2xl space-y-4">
            {data.posts.map((p) => (
              <CoachPostCard key={p.id} post={p} author={{ name: data.user.name, dpUrl: data.user.dpUrl }} showStatus={own} />
            ))}
          </div>
        ) : (
          <EmptyState icon={ChartIcon} title={t.coaching.posts.publicEmpty} body="" />
        )}
      </section>

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
