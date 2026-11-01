"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useLanguage } from "@/lib/i18n/LanguageContext";
import { useMockClubs } from "@/lib/mock/communityStore";
import { Avatar } from "@/components/common/Avatar";
import { CoachShell } from "@/components/coaching/CoachShell";
import { CoachingDealModal } from "@/components/coaching/CoachingDealModal";
import { SearchIcon } from "@/components/icons";

/** Clubs the coach can ask to coach. */
export default function CoachFindClubsPage() {
  const { t } = useLanguage();
  const td = t.coaching.deals;
  const clubs = useMockClubs();
  const [search, setSearch] = useState("");
  const [askClub, setAskClub] = useState<{ id: string; name: string } | null>(null);

  const filtered = useMemo(
    () =>
      [...clubs]
        .filter((c) => c.name.toLowerCase().includes(search.trim().toLowerCase()))
        .sort((a, b) => a.name.localeCompare(b.name))
        .slice(0, 60),
    [clubs, search],
  );

  return (
    <CoachShell title={t.coaching.nav.findClubs}>
      {(data, toast) => (
        <div className="space-y-4">
          <label className="relative block max-w-md">
            <SearchIcon className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-faint" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={td.pickClub}
              className="w-full rounded-full border border-surface-line bg-bg py-2.5 pl-9 pr-4 text-sm text-ink outline-none focus:border-accent"
            />
          </label>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {filtered.map((c) => (
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
                  {td.askToCoach}
                </button>
              </div>
            ))}
          </div>
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
      )}
    </CoachShell>
  );
}
