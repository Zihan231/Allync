"use client";

import Link from "next/link";
import { useLanguage } from "@/lib/i18n/LanguageContext";
import { useSession } from "@/lib/session/SessionContext";
import { useMockCommunities } from "@/lib/mock/communityStore";
import { PageHeader } from "@/components/dashboard/PageHeader";
import { CoverPhoto } from "@/components/common/CoverPhoto";
import { Avatar } from "@/components/common/Avatar";
import { StatusPill } from "@/components/dashboard/StatusPill";
import { SectionHeading } from "@/components/dashboard/SectionHeading";
import { PlusIcon, UsersIcon } from "@/components/icons";

export default function CommunityBrowsePage() {
  const { t } = useLanguage();
  const { user } = useSession();
  const communities = useMockCommunities();

  const myCommunity = user.community ? communities.find((c) => c.id === user.community!.id) : null;
  const otherCommunities = communities.filter((c) => c.id !== user.community?.id);

  return (
    <div>
      <PageHeader
        eyebrow="eFootball"
        title={t.dashboard.community.browseTitle}
        action={
          !user.community ? (
            <Link
              href="/dashboard/efootball/community/create"
              className="inline-flex items-center gap-1.5 rounded-full bg-accent px-4 py-2 font-display text-sm font-semibold text-bg transition-transform hover:-translate-y-0.5"
            >
              <PlusIcon className="h-4 w-4" />
              {t.dashboard.community.createCta}
            </Link>
          ) : undefined
        }
      />

      {myCommunity ? (
        <div className="mt-8">
          <SectionHeading tone="accent">{t.dashboard.community.myClubHeading}</SectionHeading>
          <CommunityCard community={myCommunity} isMine />
        </div>
      ) : null}

      <div className="mt-8">
        <SectionHeading tone="blue">{t.dashboard.community.allClubsHeading}</SectionHeading>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {otherCommunities.map((c) => (
            <CommunityCard key={c.id} community={c} />
          ))}
        </div>
      </div>
    </div>
  );
}

function CommunityCard({
  community,
  isMine = false,
}: {
  community: ReturnType<typeof useMockCommunities>[number];
  isMine?: boolean;
}) {
  const { t } = useLanguage();

  return (
    <Link
      href={`/dashboard/efootball/community/${community.id}`}
      className="group block overflow-hidden rounded-xl border border-surface-line bg-surface/40 transition-colors hover:border-surface-line-strong"
    >
      <div className="h-1.5 w-full bg-blue" />
      <div className="relative">
        <CoverPhoto
          coverUrl={community.coverUrl}
          name={community.name}
          color="#4c8dff"
          className={isMine ? "h-48 sm:h-64" : "h-40 sm:h-48"}
        />
        <div className="absolute left-3 top-3 inline-flex items-center gap-1.5 rounded-full bg-black/60 px-2.5 py-1 shadow-[0_0_0_1px_rgba(76,141,255,0.4)] backdrop-blur-sm">
          <UsersIcon className="h-3.5 w-3.5 text-blue-ink" />
          <span className="font-mono text-[10px] font-bold uppercase tracking-wider text-white">
            {t.dashboard.community.entityLabel}
          </span>
        </div>
      </div>
      <div className="flex items-start gap-3 p-4 pt-0">
        <div className="-mt-8 rounded-xl border-4 border-bg bg-surface">
          <Avatar dpUrl={community.dpUrl} name={community.name} size="lg" mode="static" shape="square" />
        </div>
        <div className="mt-1 min-w-0 flex-1">
          <div className="flex items-center justify-between gap-2">
            <span className="truncate text-sm font-semibold text-ink">{community.name}</span>
            {isMine ? <StatusPill tone="success">{t.dashboard.community.myClubHeading}</StatusPill> : null}
          </div>
          <p className="mt-1 line-clamp-2 text-xs text-ink-soft">{community.rules}</p>
          <div className="mt-2 flex items-center gap-1.5 font-mono text-[11px] text-ink-faint">
            <UsersIcon className="h-3.5 w-3.5 text-blue-ink" />
            {community.memberClubIds.length} clubs · {community.freeAgentCount} free agents
          </div>
        </div>
      </div>
    </Link>
  );
}
