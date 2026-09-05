"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useLanguage } from "@/lib/i18n/LanguageContext";
import { useSession } from "@/lib/session/SessionContext";
import { useMockClubs } from "@/lib/mock/communityStore";
import { PageHeader } from "@/components/dashboard/PageHeader";
import { CoverPhoto } from "@/components/common/CoverPhoto";
import { Avatar } from "@/components/common/Avatar";
import { StatusPill } from "@/components/dashboard/StatusPill";
import { SectionHeading } from "@/components/dashboard/SectionHeading";
import { PlusIcon, TrophyIcon, SearchIcon } from "@/components/icons";
import { CLUB_STAGES, type ClubStage } from "@/lib/mock/types";

type StageFilter = "all" | ClubStage;

export default function ClubsPage() {
  const { t } = useLanguage();
  const { user } = useSession();
  const clubs = useMockClubs();
  const [search, setSearch] = useState("");
  const [stageFilter, setStageFilter] = useState<StageFilter>("all");

  const myClub = user.club ? clubs.find((c) => c.id === user.club!.id) : null;
  const otherClubs = clubs.filter((c) => c.id !== user.club?.id);

  const filteredClubs = useMemo(() => {
    const q = search.trim().toLowerCase();
    return otherClubs.filter((club) => {
      if (q && !club.name.toLowerCase().includes(q)) return false;
      if (stageFilter !== "all" && club.stage !== stageFilter) return false;
      return true;
    });
  }, [otherClubs, search, stageFilter]);

  const stageOptions: { key: StageFilter; label: string }[] = [
    { key: "all", label: t.dashboard.clubs.allStages },
    ...CLUB_STAGES.map((s) => ({ key: s, label: s })),
  ];

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

        <div className="mt-3 relative w-full sm:max-w-xs">
          <SearchIcon className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-faint" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={t.dashboard.clubs.searchPlaceholder}
            className="w-full rounded-lg border border-surface-line-strong bg-surface py-2 pl-9 pr-3 text-sm text-ink placeholder:text-ink-faint"
          />
        </div>

        <div className="mt-3">
          <div className="font-mono text-[10px] uppercase tracking-wide text-ink-faint">
            {t.dashboard.clubs.exploreByStage}
          </div>
          <div className="mt-2 flex flex-wrap items-center gap-2">
            {stageOptions.map((opt) => (
              <button
                key={opt.key}
                type="button"
                onClick={() => setStageFilter(opt.key)}
                className={`rounded-full border px-3.5 py-1.5 text-xs font-medium transition-colors ${
                  stageFilter === opt.key
                    ? "border-blue bg-blue-soft text-blue-ink"
                    : "border-surface-line-strong text-ink-soft hover:text-ink"
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        {filteredClubs.length === 0 ? (
          <p className="mt-6 text-sm text-ink-soft">{t.dashboard.rankings.noResults}</p>
        ) : (
          <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {filteredClubs.map((club) => (
              <ClubCard key={club.id} club={club} />
            ))}
          </div>
        )}
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
        <CoverPhoto
          coverUrl={club.coverUrl}
          name={club.name}
          color={club.color}
          className={isMine ? "h-48 sm:h-64" : "h-40 sm:h-48"}
        />
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
