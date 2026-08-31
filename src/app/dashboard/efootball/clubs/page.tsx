"use client";

import Link from "next/link";
import { useLanguage } from "@/lib/i18n/LanguageContext";
import { useSession } from "@/lib/session/SessionContext";
import { useMockClubs } from "@/lib/mock/communityStore";
import { PageHeader } from "@/components/dashboard/PageHeader";
import { CoverPhoto } from "@/components/common/CoverPhoto";
import { Avatar } from "@/components/common/Avatar";
import { StatusPill } from "@/components/dashboard/StatusPill";
import { SectionHeading } from "@/components/dashboard/SectionHeading";
import { PlusIcon, TrophyIcon } from "@/components/icons";

export default function ClubsPage() {
  const { t } = useLanguage();
  const { user } = useSession();
  const clubs = useMockClubs();

  const myClub = user.club ? clubs.find((c) => c.id === user.club!.id) : null;
  const otherClubs = clubs.filter((c) => c.id !== user.club?.id);

  return (
    <div>
      <PageHeader
        eyebrow="eFootball"
        title={t.dashboard.clubs.browseTitle}
        action={
          !user.club ? (
            <Link
              href="/dashboard/efootball/clubs/create"
              className="inline-flex items-center gap-1.5 rounded-full bg-accent px-4 py-2 font-display text-sm font-semibold text-bg transition-transform hover:-translate-y-0.5"
            >
              <PlusIcon className="h-4 w-4" />
              {t.dashboard.clubs.createCta}
            </Link>
          ) : undefined
        }
      />

      {myClub ? (
        <div className="mt-8">
          <SectionHeading tone="accent">{t.dashboard.clubs.myClubHeading}</SectionHeading>
          <ClubCard club={myClub} isMine />
        </div>
      ) : null}

      <div className="mt-8">
        <SectionHeading tone="blue">{t.dashboard.clubs.allClubsHeading}</SectionHeading>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {otherClubs.map((club) => (
            <ClubCard key={club.id} club={club} />
          ))}
        </div>
      </div>
    </div>
  );
}

function ClubCard({ club, isMine = false }: { club: ReturnType<typeof useMockClubs>[number]; isMine?: boolean }) {
  const { t } = useLanguage();

  return (
    <Link
      href={`/dashboard/efootball/clubs/${club.id}`}
      className="group block overflow-hidden rounded-xl border border-surface-line bg-surface/40 transition-colors hover:border-surface-line-strong"
    >
      <div className="h-1.5 w-full" style={{ backgroundColor: club.color }} />
      <div className="relative">
        <CoverPhoto coverUrl={club.coverUrl} name={club.name} color={club.color} className="h-32" />
        <div
          className="absolute left-3 top-3 inline-flex items-center gap-1.5 rounded-full bg-black/60 px-2.5 py-1 backdrop-blur-sm"
          style={{ boxShadow: `0 0 0 1px ${club.color}66` }}
        >
          <TrophyIcon className="h-3.5 w-3.5" style={{ color: club.color }} />
          <span className="font-mono text-[10px] font-bold uppercase tracking-wider text-white">
            {t.dashboard.clubs.entityLabel}
          </span>
        </div>
      </div>
      <div className="flex items-start gap-3 p-4 pt-0">
        <div className="-mt-8 rounded-full border-4 border-bg bg-surface">
          <Avatar dpUrl={club.dpUrl} name={club.name} size="lg" mode="static" shape="circle" />
        </div>
        <div className="mt-1 min-w-0 flex-1">
          <div className="flex items-center justify-between gap-2">
            <span className="truncate text-sm font-semibold text-ink">{club.name}</span>
            {isMine ? <StatusPill tone="success">{t.dashboard.clubs.myClubHeading}</StatusPill> : null}
          </div>
          <p className="mt-1 line-clamp-2 text-xs text-ink-soft">{club.description}</p>
          <div className="mt-2 flex items-center gap-1.5 font-mono text-[11px] text-ink-faint">
            <TrophyIcon className="h-3.5 w-3.5" style={{ color: club.color }} />
            {club.points.toLocaleString()} pts · {club.minRoster}-{club.maxRoster} squad
          </div>
        </div>
      </div>
    </Link>
  );
}
