"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useLanguage } from "@/lib/i18n/LanguageContext";
import { useSession } from "@/lib/session/SessionContext";
import { addTournament } from "@/lib/mock/store";
import { games } from "@/lib/games";
import type { GameId } from "@/lib/session/SessionContext";
import type { Tournament, TournamentFormat } from "@/lib/mock/types";
import { PageHeader } from "@/components/dashboard/PageHeader";
import { LockIcon } from "@/components/icons";

const steps = ["stepGame", "stepFormat", "stepDetails", "stepFee", "stepReview"] as const;

const formats: { value: TournamentFormat; titleKey: "formatDefaultTitle" | "formatCustomTitle" | "formatClubVsClubTitle" | "formatOpenTitle"; bodyKey: "formatDefaultBody" | "formatCustomBody" | "formatClubVsClubBody" | "formatOpenBody" }[] = [
  { value: "default", titleKey: "formatDefaultTitle", bodyKey: "formatDefaultBody" },
  { value: "custom", titleKey: "formatCustomTitle", bodyKey: "formatCustomBody" },
  { value: "clubVsClub", titleKey: "formatClubVsClubTitle", bodyKey: "formatClubVsClubBody" },
  { value: "open", titleKey: "formatOpenTitle", bodyKey: "formatOpenBody" },
];

export default function CreateTournamentPage() {
  const { t } = useLanguage();
  const { user } = useSession();
  const router = useRouter();
  const c = t.dashboard.organizer.create;

  const [step, setStep] = useState(0);
  const [game, setGame] = useState<GameId>("efootball");
  const [format, setFormat] = useState<TournamentFormat>("default");
  const [name, setName] = useState("");
  const [startAt, setStartAt] = useState("");
  const [endAt, setEndAt] = useState("");
  const [isPaid, setIsPaid] = useState(false);
  const [entryFee, setEntryFee] = useState(200);
  const [prizePool, setPrizePool] = useState(1000);

  const kycBlocked = isPaid && user.kycStatus !== "verified";

  const next = () => setStep((s) => Math.min(s + 1, steps.length - 1));
  const back = () => setStep((s) => Math.max(s - 1, 0));

  const handleCreate = () => {
    const id = `tournament-${Date.now()}`;
    const tournament: Tournament = {
      id,
      name: name || "Untitled tournament",
      game,
      format,
      status: "open",
      entrants: 0,
      entryFeeBdt: isPaid ? entryFee : null,
      prizePoolBdt: isPaid ? prizePool : null,
      communityId: null,
      organizerName: user.name,
      startAt: startAt || new Date().toISOString(),
      endAt: endAt || new Date().toISOString(),
    };
    addTournament(tournament);
    router.push(`/dashboard/organizer/tournaments/${id}`);
  };

  return (
    <div className="mx-auto max-w-2xl">
      <PageHeader
        eyebrow={t.dashboard.shell.modeOrganizer}
        title={t.dashboard.shell.navCreateTournament}
        backHref="/dashboard/organizer/tournaments"
      />

      <div className="mt-6 flex items-center gap-2">
        {steps.map((s, i) => (
          <div key={s} className="flex flex-1 items-center gap-2">
            <div
              className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full font-mono text-[11px] font-semibold ${
                i <= step ? "bg-accent text-bg" : "bg-surface-line text-ink-faint"
              }`}
            >
              {i + 1}
            </div>
            {i < steps.length - 1 ? (
              <div className={`h-px flex-1 ${i < step ? "bg-accent" : "bg-surface-line"}`} />
            ) : null}
          </div>
        ))}
      </div>
      <div className="mt-2 font-mono text-xs uppercase tracking-wide text-ink-faint">
        {c[steps[step]]}
      </div>

      <div className="mt-6 rounded-xl border border-surface-line bg-surface/50 p-6">
        {step === 0 ? (
          <div className="grid grid-cols-2 gap-3">
            {games.map((g) => (
              <button
                key={g.id}
                onClick={() => setGame(g.id)}
                className={`flex items-center gap-2.5 rounded-lg border p-3.5 text-left transition-colors ${
                  game === g.id ? "border-accent bg-accent-soft" : "border-surface-line-strong hover:border-ink-faint"
                }`}
              >
                <g.icon className="h-5 w-5" style={{ color: g.color }} />
                <span className="text-sm font-medium text-ink">{g.name}</span>
              </button>
            ))}
          </div>
        ) : null}

        {step === 1 ? (
          <div className="grid gap-3 sm:grid-cols-2">
            {formats.map((f) => (
              <button
                key={f.value}
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
        ) : null}

        {step === 2 ? (
          <div className="space-y-4">
            <label className="block">
              <span className="text-sm font-medium text-ink-soft">{c.nameLabel}</span>
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="mt-1.5 w-full rounded-lg border border-surface-line bg-surface px-4 py-3 text-sm text-ink outline-none focus:border-accent focus:ring-2 focus:ring-accent/20"
              />
            </label>
            <div className="grid grid-cols-2 gap-4">
              <label className="block">
                <span className="text-sm font-medium text-ink-soft">{c.startLabel}</span>
                <input
                  type="datetime-local"
                  value={startAt}
                  onChange={(e) => setStartAt(e.target.value)}
                  className="mt-1.5 w-full rounded-lg border border-surface-line bg-surface px-3 py-3 text-sm text-ink outline-none focus:border-accent focus:ring-2 focus:ring-accent/20"
                />
              </label>
              <label className="block">
                <span className="text-sm font-medium text-ink-soft">{c.endLabel}</span>
                <input
                  type="datetime-local"
                  value={endAt}
                  onChange={(e) => setEndAt(e.target.value)}
                  className="mt-1.5 w-full rounded-lg border border-surface-line bg-surface px-3 py-3 text-sm text-ink outline-none focus:border-accent focus:ring-2 focus:ring-accent/20"
                />
              </label>
            </div>
          </div>
        ) : null}

        {step === 3 ? (
          <div className="space-y-5">
            <div className="grid grid-cols-2 gap-2 rounded-lg border border-surface-line bg-surface p-1">
              <button
                onClick={() => setIsPaid(false)}
                className={`rounded-md py-2 text-sm font-medium transition-colors ${!isPaid ? "bg-accent text-bg" : "text-ink-soft"}`}
              >
                {c.freeLabel}
              </button>
              <button
                onClick={() => setIsPaid(true)}
                className={`rounded-md py-2 text-sm font-medium transition-colors ${isPaid ? "bg-accent text-bg" : "text-ink-soft"}`}
              >
                {c.paidLabel}
              </button>
            </div>

            {isPaid && kycBlocked ? (
              <div className="flex items-start gap-3 rounded-lg border border-warning/30 bg-warning-soft p-4">
                <LockIcon className="mt-0.5 h-4 w-4 shrink-0 text-warning-ink" />
                <div className="text-sm text-warning-ink">
                  {c.kycRequiredNotice}{" "}
                  <Link href="/dashboard/organizer/verification" className="font-semibold underline">
                    {c.kycRequiredCta}
                  </Link>
                </div>
              </div>
            ) : isPaid ? (
              <div className="grid grid-cols-2 gap-4">
                <label className="block">
                  <span className="text-sm font-medium text-ink-soft">{c.entryFeeLabel}</span>
                  <input
                    type="number"
                    value={entryFee}
                    onChange={(e) => setEntryFee(Number(e.target.value))}
                    className="mt-1.5 w-full rounded-lg border border-surface-line bg-surface px-4 py-3 text-sm text-ink outline-none focus:border-accent focus:ring-2 focus:ring-accent/20"
                  />
                </label>
                <label className="block">
                  <span className="text-sm font-medium text-ink-soft">{c.prizePoolLabel}</span>
                  <input
                    type="number"
                    value={prizePool}
                    onChange={(e) => setPrizePool(Number(e.target.value))}
                    className="mt-1.5 w-full rounded-lg border border-surface-line bg-surface px-4 py-3 text-sm text-ink outline-none focus:border-accent focus:ring-2 focus:ring-accent/20"
                  />
                </label>
              </div>
            ) : null}
          </div>
        ) : null}

        {step === 4 ? (
          <div className="space-y-3 font-mono text-sm">
            <div className="flex justify-between border-b border-surface-line pb-2.5">
              <span className="text-ink-faint">{c.stepGame}</span>
              <span className="text-ink">{games.find((g) => g.id === game)?.name}</span>
            </div>
            <div className="flex justify-between border-b border-surface-line pb-2.5">
              <span className="text-ink-faint">{c.stepFormat}</span>
              <span className="text-ink">{formats.find((f) => f.value === format)?.value}</span>
            </div>
            <div className="flex justify-between border-b border-surface-line pb-2.5">
              <span className="text-ink-faint">{c.nameLabel}</span>
              <span className="text-ink">{name || "Untitled tournament"}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-ink-faint">{isPaid ? c.paidLabel : c.freeLabel}</span>
              <span className="text-ink">{isPaid ? `৳${entryFee} → ৳${prizePool}` : "—"}</span>
            </div>
          </div>
        ) : null}
      </div>

      <div className="mt-6 flex items-center justify-between">
        <button
          onClick={back}
          disabled={step === 0}
          className="rounded-full border border-surface-line-strong px-5 py-2.5 text-sm font-medium text-ink disabled:opacity-40"
        >
          {c.back}
        </button>
        {step < steps.length - 1 ? (
          <button
            onClick={next}
            disabled={isPaid && kycBlocked && step === 3}
            className="rounded-full bg-accent px-6 py-2.5 font-display text-sm font-semibold text-bg transition-transform hover:-translate-y-0.5 disabled:opacity-40"
          >
            {c.next}
          </button>
        ) : (
          <button
            onClick={handleCreate}
            className="rounded-full bg-accent px-6 py-2.5 font-display text-sm font-semibold text-bg transition-transform hover:-translate-y-0.5"
          >
            {c.createSubmit}
          </button>
        )}
      </div>
    </div>
  );
}
