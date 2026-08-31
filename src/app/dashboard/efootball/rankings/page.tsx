"use client";

import { useState } from "react";
import { useLanguage } from "@/lib/i18n/LanguageContext";
import { useMockPeople, useMockClubs, useMockCommunities } from "@/lib/mock/communityStore";
import { PageHeader } from "@/components/dashboard/PageHeader";
import { LeaderboardTable } from "@/components/dashboard/LeaderboardTable";

type Tab = "players" | "clubs" | "communities";

export default function RankingsPage() {
  const { t } = useLanguage();
  const [tab, setTab] = useState<Tab>("players");
  const people = useMockPeople();
  const clubs = useMockClubs();
  const communities = useMockCommunities();

  const tabs: { key: Tab; label: string }[] = [
    { key: "players", label: t.dashboard.rankings.tabPlayers },
    { key: "clubs", label: t.dashboard.rankings.tabClubs },
    { key: "communities", label: t.dashboard.rankings.tabCommunities },
  ];

  const rows =
    tab === "players"
      ? [...people].sort((a, b) => b.points - a.points).map((p) => ({ id: p.id, name: p.name, dpUrl: p.dpUrl, points: p.points }))
      : tab === "clubs"
        ? [...clubs].sort((a, b) => b.points - a.points).map((c) => ({ id: c.id, name: c.name, dpUrl: c.dpUrl, points: c.points }))
        : [...communities].sort((a, b) => b.points - a.points).map((c) => ({ id: c.id, name: c.name, dpUrl: c.dpUrl, points: c.points }));

  const hrefBuilder =
    tab === "players"
      ? (id: string) => `/dashboard/efootball/players/${id}`
      : tab === "clubs"
        ? (id: string) => `/dashboard/efootball/clubs/${id}`
        : (id: string) => `/dashboard/efootball/community/${id}`;

  return (
    <div>
      <PageHeader eyebrow="eFootball" title={t.dashboard.rankings.pageTitle} />

      <div className="mt-6 flex gap-2">
        {tabs.map((tb) => (
          <button
            key={tb.key}
            onClick={() => setTab(tb.key)}
            className={`rounded-full border px-4 py-2 text-sm font-medium transition-colors ${
              tab === tb.key
                ? "border-accent bg-accent-soft text-accent-ink"
                : "border-surface-line-strong text-ink-soft hover:text-ink"
            }`}
          >
            {tb.label}
          </button>
        ))}
      </div>

      <div className="mt-6">
        <LeaderboardTable rows={rows} hrefBuilder={hrefBuilder} />
      </div>
    </div>
  );
}
