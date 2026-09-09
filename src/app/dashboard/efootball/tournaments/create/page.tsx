"use client";

import { Suspense, useState, type FormEvent } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useLanguage } from "@/lib/i18n/LanguageContext";
import { useSession } from "@/lib/session/SessionContext";
import { useMockClubs } from "@/lib/mock/communityStore";
import { addTournament } from "@/lib/mock/store";
import type { Tournament, TournamentFormat } from "@/lib/mock/types";
import { PageHeader } from "@/components/dashboard/PageHeader";
import { EntityGuidelinesPanel } from "@/components/dashboard/EntityGuidelinesPanel";
import { EmptyState } from "@/components/dashboard/EmptyState";
import { LockIcon, ShieldIcon, UsersIcon, SwapIcon, CrosshairIcon, CalendarIcon } from "@/components/icons";

const formats: {
  value: TournamentFormat;
  titleKey: "formatPlayerVsPlayerTitle" | "formatClubVsClubTitle";
  bodyKey: "formatPlayerVsPlayerBody" | "formatClubVsClubBody";
}[] = [
  { value: "playerVsPlayer", titleKey: "formatPlayerVsPlayerTitle", bodyKey: "formatPlayerVsPlayerBody" },
  { value: "clubVsClub", titleKey: "formatClubVsClubTitle", bodyKey: "formatClubVsClubBody" },
];

const fieldClass =
  "mt-1.5 w-full rounded-lg border border-surface-line bg-surface px-4 py-3 text-sm text-ink outline-none focus:border-accent focus:ring-2 focus:ring-accent/20";

function CreateTournamentForm() {
  const { t } = useLanguage();
  const { user } = useSession();
  const router = useRouter();
  const searchParams = useSearchParams();
  const clubs = useMockClubs();
  const c = t.dashboard.organizer.create;
  const rules = t.dashboard.tournaments.rules;
  const tips = t.dashboard.tournaments.tips;

  const clubId = searchParams.get("clubId");
  const club = clubId ? (clubs.find((cl) => cl.id === clubId) ?? null) : null;
  const canManageClub = !!club && user.club?.id === club.id && (user.club?.role === "President" || user.club?.role === "Manager");

  const [name, setName] = useState("");
  const [format, setFormat] = useState<TournamentFormat>("playerVsPlayer");
  const [startAt, setStartAt] = useState("");
  const [endAt, setEndAt] = useState("");
  const [isPaid, setIsPaid] = useState(false);
  const [entryFee, setEntryFee] = useState(200);
  const [prizePool, setPrizePool] = useState(1000);

  if (clubId && !canManageClub) {
    return <EmptyState icon={LockIcon} title={t.dashboard.clubs.emptyState} body="" />;
  }

  const ruleItems = [
    { icon: LockIcon, title: rules.item1Title, body: rules.item1Body },
    { icon: ShieldIcon, title: rules.item2Title, body: rules.item2Body },
    { icon: UsersIcon, title: rules.item3Title, body: rules.item3Body },
  ];
  const tipItems = [
    { icon: CrosshairIcon, title: tips.item1Title, body: tips.item1Body },
    { icon: SwapIcon, title: tips.item2Title, body: tips.item2Body },
    { icon: CalendarIcon, title: tips.item3Title, body: tips.item3Body },
  ];

  const kycBlocked = isPaid && user.kycStatus !== "verified";

  function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (kycBlocked) return;
    const id = `tournament-${Date.now()}`;
    const tournament: Tournament = {
      id,
      name: name.trim() || "Untitled tournament",
      game: "efootball",
      format,
      status: "open",
      entrants: 0,
      entryFeeBdt: isPaid ? entryFee : null,
      prizePoolBdt: isPaid ? prizePool : null,
      communityId: null,
      clubId: club?.id ?? null,
      organizerName: club?.name ?? user.name,
      startAt: startAt || new Date().toISOString(),
      endAt: endAt || new Date().toISOString(),
    };
    addTournament(tournament);
    router.push(`/dashboard/efootball/tournaments/${id}`);
  }

  return (
    <div>
      <PageHeader
        eyebrow={club ? club.name : "eFootball"}
        title={t.dashboard.shell.navCreateTournament}
        backHref={club ? `/dashboard/efootball/clubs/${club.id}` : "/dashboard/efootball/tournaments"}
      />

      <div className="mt-8 grid gap-6 lg:grid-cols-2">
        <form onSubmit={handleSubmit} className="space-y-6 rounded-xl border border-surface-line bg-surface/50 p-6">
          <label className="block">
            <span className="text-sm font-medium text-ink-soft">{c.nameLabel}</span>
            <input value={name} onChange={(e) => setName(e.target.value)} required className={fieldClass} />
          </label>

          <div>
            <span className="text-sm font-medium text-ink-soft">{c.stepFormat}</span>
            <div className="mt-2 grid gap-3 sm:grid-cols-2">
              {formats.map((f) => (
                <button
                  key={f.value}
                  type="button"
                  onClick={() => setFormat(f.value)}
                  className={`rounded-lg border p-4 text-left transition-colors ${
                    format === f.value ? "border-accent bg-accent-soft" : "border-surface-line-strong hover:border-ink-faint"
                  }`}
                >
                  <div className="text-sm font-semibold text-ink">{c[f.titleKey]}</div>
                  <div className="mt-1 text-xs text-ink-soft">{c[f.bodyKey]}</div>
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <label className="block">
              <span className="text-sm font-medium text-ink-soft">{c.startLabel}</span>
              <input
                type="datetime-local"
                value={startAt}
                onChange={(e) => setStartAt(e.target.value)}
                className={fieldClass}
              />
            </label>
            <label className="block">
              <span className="text-sm font-medium text-ink-soft">{c.endLabel}</span>
              <input type="datetime-local" value={endAt} onChange={(e) => setEndAt(e.target.value)} className={fieldClass} />
            </label>
          </div>

          <div>
            <div className="grid grid-cols-2 gap-2 rounded-lg border border-surface-line bg-surface p-1">
              <button
                type="button"
                onClick={() => setIsPaid(false)}
                className={`rounded-md py-2 text-sm font-medium transition-colors ${!isPaid ? "bg-accent text-bg" : "text-ink-soft"}`}
              >
                {c.freeLabel}
              </button>
              <button
                type="button"
                onClick={() => setIsPaid(true)}
                className={`rounded-md py-2 text-sm font-medium transition-colors ${isPaid ? "bg-accent text-bg" : "text-ink-soft"}`}
              >
                {c.paidLabel}
              </button>
            </div>

            {isPaid && kycBlocked ? (
              <div className="mt-4 flex items-start gap-3 rounded-lg border border-warning/30 bg-warning-soft p-4">
                <LockIcon className="mt-0.5 h-4 w-4 shrink-0 text-warning-ink" />
                <div className="text-sm text-warning-ink">
                  {c.kycRequiredNotice}{" "}
                  <Link href="/dashboard/organizer/verification" className="font-semibold underline">
                    {c.kycRequiredCta}
                  </Link>
                </div>
              </div>
            ) : isPaid ? (
              <div className="mt-4 grid grid-cols-2 gap-4">
                <label className="block">
                  <span className="text-sm font-medium text-ink-soft">{c.entryFeeLabel}</span>
                  <input
                    type="number"
                    value={entryFee}
                    onChange={(e) => setEntryFee(Number(e.target.value))}
                    className={fieldClass}
                  />
                </label>
                <label className="block">
                  <span className="text-sm font-medium text-ink-soft">{c.prizePoolLabel}</span>
                  <input
                    type="number"
                    value={prizePool}
                    onChange={(e) => setPrizePool(Number(e.target.value))}
                    className={fieldClass}
                  />
                </label>
              </div>
            ) : null}
          </div>

          <button
            type="submit"
            disabled={kycBlocked}
            className="rounded-full bg-accent px-6 py-3 font-display font-semibold text-bg transition-transform hover:-translate-y-0.5 disabled:opacity-40"
          >
            {c.createSubmit}
          </button>
        </form>

        <div className="space-y-6 lg:sticky lg:top-24 lg:self-start">
          <EntityGuidelinesPanel title={rules.title} items={ruleItems} tone="rules" />
          <EntityGuidelinesPanel title={tips.title} items={tipItems} tone="tips" />
        </div>
      </div>
    </div>
  );
}

export default function CreateTournamentPage() {
  return (
    <Suspense fallback={null}>
      <CreateTournamentForm />
    </Suspense>
  );
}
