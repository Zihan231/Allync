"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useLanguage } from "@/lib/i18n/LanguageContext";
import { useSession } from "@/lib/session/SessionContext";
import { useMockCommunities, syncFromBackend, hasSyncedFromBackend } from "@/lib/mock/communityStore";
import { AppLoader } from "@/components/common/AppLoader";
import { PageHeader } from "@/components/dashboard/PageHeader";
import { CoverPhoto } from "@/components/common/CoverPhoto";
import { ClubCrest } from "@/components/common/ClubCrest";
import { StatusPill } from "@/components/dashboard/StatusPill";
import { SectionHeading } from "@/components/dashboard/SectionHeading";
import { Pagination } from "@/components/dashboard/Pagination";
import { PlusIcon, SearchIcon, UsersIcon } from "@/components/icons";

export default function CommunityBrowsePage() {
  const { t } = useLanguage();
  const { user, isLoading: sessionLoading } = useSession();
  const communities = useMockCommunities();
  const [loading, setLoading] = useState(() => !hasSyncedFromBackend());
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const PAGE_SIZE = 9;

  useEffect(() => {
    let mounted = true;
    syncFromBackend().finally(() => {
      if (mounted) setLoading(false);
    });
    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    setPage(1);
  }, [search]);

  const myCommunity = user.community ? communities.find((c) => c.id === user.community!.id) : null;
  const otherCommunities = communities.filter((c) => c.id !== user.community?.id);

  const filteredCommunities = useMemo(() => {
    const q = search.trim().toLowerCase();
    return otherCommunities.filter((c) => {
      if (q && !c.name.toLowerCase().includes(q) && !(c.rules || "").toLowerCase().includes(q)) {
        return false;
      }
      return true;
    });
  }, [otherCommunities, search]);

  const totalPages = Math.ceil(filteredCommunities.length / PAGE_SIZE) || 1;
  const paginatedCommunities = useMemo(() => {
    const start = (page - 1) * PAGE_SIZE;
    return filteredCommunities.slice(start, start + PAGE_SIZE);
  }, [filteredCommunities, page]);

  if (loading || sessionLoading) {
    return <AppLoader />;
  }

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
          ) : null
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

        <div className="mt-3 relative w-full sm:max-w-xs">
          <SearchIcon className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-faint" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search communities..."
            className="w-full rounded-lg border border-surface-line-strong bg-surface py-2 pl-9 pr-3 text-sm text-ink placeholder:text-ink-faint"
          />
        </div>

        {filteredCommunities.length === 0 ? (
          <p className="mt-6 text-sm text-ink-soft">No communities found.</p>
        ) : (
          <>
            <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {paginatedCommunities.map((c) => (
                <CommunityCard key={c.id} community={c} />
              ))}
            </div>

            {totalPages > 1 ? (
              <div className="mt-8 flex flex-col items-center justify-between gap-4 border-t border-surface-line pt-6 sm:flex-row">
                <span className="font-mono text-xs text-ink-faint">
                  Showing {(page - 1) * PAGE_SIZE + 1} - {Math.min(page * PAGE_SIZE, filteredCommunities.length)} of {filteredCommunities.length} communities
                </span>
                <Pagination page={page} pageCount={totalPages} onPageChange={setPage} />
              </div>
            ) : null}
          </>
        )}
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
      <div className="h-1.5 w-full" style={{ backgroundColor: community.color }} />
      <div className="relative">
        <CoverPhoto
          coverUrl={community.coverUrl}
          name={community.name}
          color={community.color}
          className={isMine ? "h-48 sm:h-64" : "h-40 sm:h-48"}
          mode="static"
        />
        <div
          className="absolute left-3 top-3 inline-flex items-center gap-1.5 rounded-full bg-black/60 px-2.5 py-1 backdrop-blur-sm"
          style={{ boxShadow: `0 0 0 1px ${community.color}66` }}
        >
          <UsersIcon className="h-3.5 w-3.5" style={{ color: community.color }} />
          <span className="font-mono text-[10px] font-bold uppercase tracking-wider text-white">
            {t.dashboard.community.entityLabel}
          </span>
        </div>
      </div>
      <div className="flex items-start gap-3 p-4 pt-0">
        <div className="-mt-8 rounded-xl border-4 border-bg bg-surface">
          <ClubCrest
            name={community.name}
            color={community.color}
            initials={community.initials}
            imageUrl={community.dpUrl}
            size="lg"
            shape="square"
          />
        </div>
        <div className="mt-1 min-w-0 flex-1">
          <div className="flex items-center justify-between gap-2">
            <span className="truncate text-sm font-semibold text-ink">{community.name}</span>
            {isMine ? <StatusPill tone="success">{t.dashboard.community.myClubHeading}</StatusPill> : null}
          </div>
          <p className="mt-1 line-clamp-2 text-xs text-ink-soft">{community.rules}</p>
          <div className="mt-2 flex items-center gap-1.5 font-mono text-[11px] text-ink-faint">
            <UsersIcon className="h-3.5 w-3.5" style={{ color: community.color }} />
            {community.memberClubIds.length} clubs - {community.freeAgentCount} free agents
          </div>
        </div>
      </div>
    </Link>
  );
}
