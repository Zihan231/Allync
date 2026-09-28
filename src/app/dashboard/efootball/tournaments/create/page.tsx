"use client";

import { useState, useMemo, useEffect } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense } from "react";
import { useLanguage } from "@/lib/i18n/LanguageContext";
import { useSession } from "@/lib/session/SessionContext";
import { getCommunities } from "@/lib/api/communities";
import { useCreateTournament } from "@/lib/api/hooks/useTournaments";
import type { BackendCommunity } from "@/lib/api/types";
import type { TournamentType, TournamentPreset } from "@/lib/api/tournaments";
import { PageHeader } from "@/components/dashboard/PageHeader";
import { EntityGuidelinesPanel } from "@/components/dashboard/EntityGuidelinesPanel";
import {
  TrophyIcon,
  UsersIcon,
  CrosshairIcon,
  LockIcon,
  ShieldIcon,
  CalendarIcon,
  ClockIcon,
  CheckIcon,
} from "@/components/icons";

const fieldClass =
  "mt-1.5 w-full rounded-xl border border-surface-line bg-surface px-4 py-3 text-sm text-ink placeholder:text-ink-faint outline-none focus:border-accent focus:ring-2 focus:ring-accent/20 transition-all [color-scheme:dark]";

function CreateTournamentForm() {
  const { t, locale } = useLanguage();
  const tc = t.dashboard.tournamentCreate;
  const { user } = useSession();
  const router = useRouter();
  const searchParams = useSearchParams();
  const queryCommunityId = searchParams.get("communityId");
  const createMutation = useCreateTournament();

  const [communities, setCommunities] = useState<BackendCommunity[]>([]);
  const [loadingCommunities, setLoadingCommunities] = useState(true);

  // Form states
  const [name, setName] = useState("");
  const [communityId, setCommunityId] = useState("");
  const [type, setType] = useState<TournamentType>("cvc");
  const [preset, setPreset] = useState<TournamentPreset>("preset_11v11");
  const [startersCount, setStartersCount] = useState(11);
  const [subsCount, setSubsCount] = useState(5);
  const [maxParticipants, setMaxParticipants] = useState(16);
  const [customParticipants, setCustomParticipants] = useState(false);
  const [participantsInput, setParticipantsInput] = useState("16");
  const isCvc = type === "cvc";
  const participantsError = !customParticipants
    ? null
    : participantsInput === ""
      ? (isCvc ? tc.errCapacityEmptyClubs : tc.errCapacityEmptyPlayers)
      : maxParticipants < 2
        ? (isCvc ? tc.errCapacityMinClubs : tc.errCapacityMinPlayers)
        : maxParticipants > 128
          ? (isCvc ? tc.errCapacityMaxClubs : tc.errCapacityMaxPlayers)
          : maxParticipants % 2 !== 0
            ? (isCvc ? tc.errCapacityOddClubs : tc.errCapacityOddPlayers)
            : null;

  // Schedule
  const [startAt, setStartAt] = useState("");
  const [endAt, setEndAt] = useState("");

  // Financials
  const [isPaid, setIsPaid] = useState(false);
  const [entryFeeBdt, setEntryFeeBdt] = useState(500);
  const [prizePoolBdt, setPrizePoolBdt] = useState(5000);

  const [errorMessage, setErrorMessage] = useState("");

  // Load communities to determine President / VP roles
  useEffect(() => {
    let isMounted = true;
    async function load() {
      try {
        const comms = await getCommunities();
        if (isMounted) {
          setCommunities(comms);
        }
      } catch (err) {
        console.error("Failed to load communities", err);
      } finally {
        if (isMounted) setLoadingCommunities(false);
      }
    }
    load();
    return () => {
      isMounted = false;
    };
  }, []);

  // Filter communities where user is President or Vice President
  const eligibleCommunities = useMemo(() => {
    return communities.filter((c: any) => {
      const isCreator = c.creatorId === user?.id || c.creator?.id === user?.id;
      const isPres = c.presidentId === user?.id || c.president?.id === user?.id;
      const isVP = c.vicePresidentId === user?.id || c.vicePresident?.id === user?.id;
      const sessionRole =
        user?.community?.id === c.id &&
        (user?.community?.role === "President" || user?.community?.role === "Vice President");
      return isCreator || isPres || isVP || sessionRole;
    });
  }, [communities, user]);

  useEffect(() => {
    if (queryCommunityId) {
      setCommunityId(queryCommunityId);
    } else if (eligibleCommunities.length > 0 && !communityId) {
      setCommunityId(eligibleCommunities[0].id);
    }
  }, [eligibleCommunities, communityId, queryCommunityId]);

  // Adjust starters and subs when preset changes
  function handlePresetSelect(selectedPreset: TournamentPreset) {
    setPreset(selectedPreset);
    if (selectedPreset === "preset_11v11") {
      setStartersCount(11);
      setSubsCount(5);
    } else if (selectedPreset === "preset_8v8") {
      setStartersCount(8);
      setSubsCount(4);
    }
  }

  // Calculate submission deadline (2 hours before start time)
  const submissionDeadlineText = useMemo(() => {
    if (!startAt) return null;
    const startDate = new Date(startAt);
    if (isNaN(startDate.getTime())) return null;
    const deadlineDate = new Date(startDate.getTime() - 2 * 60 * 60 * 1000);
    return deadlineDate.toLocaleString(locale === "bn" ? "bn-BD" : "en-US", {
      weekday: "short",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  }, [startAt, locale]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErrorMessage("");

    const effectiveCommunityId = communityId || queryCommunityId || eligibleCommunities[0]?.id || user?.community?.id;
    if (!effectiveCommunityId) {
      setErrorMessage(tc.errNoCommunity);
      return;
    }

    if (!startAt) {
      setErrorMessage(tc.errNoStart);
      return;
    }

    const startDate = new Date(startAt);
    if (startDate.getTime() <= Date.now() + 2 * 60 * 60 * 1000) {
      setErrorMessage(tc.errStartTooSoon);
      return;
    }

    if (participantsError) {
      setErrorMessage(participantsError);
      return;
    }

    try {
      const normalizedPreset = type === "cvc"
        ? (preset === "preset_11v11" ? "11v11" : preset === "preset_8v8" ? "8v8" : "custom")
        : "custom";

      const tournament = await createMutation.mutateAsync({
        name: name.trim(),
        type,
        preset: normalizedPreset as any,
        startersCount: type === "cvc" ? startersCount : 1,
        subsCount: type === "cvc" ? subsCount : 0,
        maxParticipants,
        isPaid,
        entryFeeBdt: isPaid ? entryFeeBdt : 0,
        prizePoolBdt: prizePoolBdt > 0 ? prizePoolBdt : 0,
        startAt: startDate.toISOString(),
        endAt: endAt ? new Date(endAt).toISOString() : undefined,
        communityId: effectiveCommunityId,
      });

      router.push(
        `/dashboard/efootball/community/${tournament.communityId}/tournaments/${tournament.id}`,
      );
    } catch (err: any) {
      const resData = err?.response?.data;
      const resMsg = resData?.message || err?.message;
      let displayMsg: string = tc.errCreateFailed;
      if (Array.isArray(resMsg)) {
        displayMsg = resMsg.join(", ");
      } else if (typeof resMsg === "string" && resMsg.trim()) {
        displayMsg = resMsg;
      } else if (err?.message) {
        displayMsg = err.message;
      }
      console.warn("Tournament creation error:", displayMsg);
      setErrorMessage(displayMsg);
    }
  }

  const isEligible = eligibleCommunities.length > 0 || Boolean(queryCommunityId) || Boolean(user?.community?.id);
  const backCommunityId = communityId || queryCommunityId || user?.community?.id;
  const communityBackHref = backCommunityId
    ? `/dashboard/efootball/community/${backCommunityId}?tab=tournaments`
    : "/dashboard/efootball/community";

  if (!loadingCommunities && !isEligible) {
    return (
      <div>
        <PageHeader
          eyebrow={tc.eyebrowRestricted}
          title={tc.pageTitle}
          backHref={communityBackHref}
        />
        <div className="mt-8">
          <div className="rounded-2xl border border-surface-line bg-surface/40 p-8 text-center max-w-lg mx-auto">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-warning/15 text-warning-ink">
              <LockIcon className="h-6 w-6" />
            </div>
            <h3 className="mt-4 font-display text-base font-bold text-ink">{tc.accessRestrictedTitle}</h3>
            <p className="mt-2 text-xs text-ink-soft leading-relaxed">
              {tc.accessRestrictedBody}
            </p>
            <div className="mt-6">
              <Link
                href={communityBackHref}
                className="inline-flex items-center gap-2 rounded-full bg-surface-line px-5 py-2.5 text-xs font-semibold text-ink transition-colors hover:bg-surface-line-strong"
              >
                {tc.backToCommunity}
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div>
      <PageHeader
        eyebrow={eligibleCommunities[0]?.name ? `${tc.eyebrowCommunity} · ${eligibleCommunities[0].name}` : tc.eyebrowDefault}
        title={tc.pageTitle}
        backHref={communityBackHref}
      />

      <div className="mt-8 grid gap-8 lg:grid-cols-12">
        <div className="lg:col-span-8">
          <form
            onSubmit={handleSubmit}
            className="space-y-6 rounded-2xl border border-surface-line bg-surface/50 p-6 md:p-8"
          >
            {errorMessage && (
              <div className="rounded-xl border border-rose-500/30 bg-rose-500/10 p-4 text-xs font-medium text-rose-400">
                {errorMessage}
              </div>
            )}



            {/* Tournament Title */}
            <div>
              <label className="block">
                <span className="text-xs font-mono font-semibold uppercase tracking-wider text-ink-soft">
                  {tc.titleLabel} <span className="text-accent">*</span>
                </span>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder={tc.titlePlaceholder}
                  required
                  className={fieldClass}
                />
              </label>
            </div>

            {/* Format: PvP vs CvC */}
            <div>
              <span className="text-xs font-mono font-semibold uppercase tracking-wider text-ink-soft">
                {tc.formatLabel} <span className="text-accent">*</span>
              </span>
              <div className="mt-2 grid gap-3 sm:grid-cols-2">
                <button
                  type="button"
                  onClick={() => setType("cvc")}
                  className={`group relative flex flex-col rounded-xl border p-4 text-left transition-all ${
                    type === "cvc"
                      ? "border-accent bg-accent-soft/80 shadow-[0_0_20px_rgba(217,165,68,0.15)]"
                      : "border-surface-line bg-surface/40 hover:border-surface-line-strong"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-accent/20 text-accent">
                        <UsersIcon className="h-4 w-4" />
                      </div>
                      <div className="font-display text-sm font-bold text-ink">{tc.cvcTitle}</div>
                    </div>
                    {type === "cvc" && <CheckIcon className="h-4 w-4 text-accent" />}
                  </div>
                  <p className="mt-2 text-xs text-ink-soft">
                    {tc.cvcBody}
                  </p>
                </button>

                <button
                  type="button"
                  onClick={() => setType("pvp")}
                  className={`group relative flex flex-col rounded-xl border p-4 text-left transition-all ${
                    type === "pvp"
                      ? "border-accent bg-accent-soft/80 shadow-[0_0_20px_rgba(217,165,68,0.15)]"
                      : "border-surface-line bg-surface/40 hover:border-surface-line-strong"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-500/20 text-blue-400">
                        <CrosshairIcon className="h-4 w-4" />
                      </div>
                      <div className="font-display text-sm font-bold text-ink">{tc.pvpTitle}</div>
                    </div>
                    {type === "pvp" && <CheckIcon className="h-4 w-4 text-accent" />}
                  </div>
                  <p className="mt-2 text-xs text-ink-soft">
                    {tc.pvpBody}
                  </p>
                </button>
              </div>
            </div>

            {/* CvC Roster Presets (11v11 or 8v8 or Custom) */}
            {type === "cvc" && (
              <div className="rounded-xl border border-surface-line/80 bg-surface/30 p-4 space-y-4">
                <span className="text-xs font-mono font-semibold uppercase tracking-wider text-ink-soft">
                  {tc.rosterPresetLabel}
                </span>
                <div className="grid gap-3 sm:grid-cols-3">
                  <button
                    type="button"
                    onClick={() => handlePresetSelect("preset_11v11")}
                    className={`rounded-lg border p-3 text-left transition-all ${
                      preset === "preset_11v11"
                        ? "border-accent bg-accent/15 text-ink"
                        : "border-surface-line text-ink-soft hover:border-surface-line-strong"
                    }`}
                  >
                    <div className="font-display text-sm font-bold">{tc.preset11Title}</div>
                    <div className="mt-1 text-xs text-ink-faint">{tc.preset11Detail}</div>
                    <div className="mt-1 font-mono text-[11px] text-accent">{tc.preset11Total}</div>
                  </button>

                  <button
                    type="button"
                    onClick={() => handlePresetSelect("preset_8v8")}
                    className={`rounded-lg border p-3 text-left transition-all ${
                      preset === "preset_8v8"
                        ? "border-accent bg-accent/15 text-ink"
                        : "border-surface-line text-ink-soft hover:border-surface-line-strong"
                    }`}
                  >
                    <div className="font-display text-sm font-bold">{tc.preset8Title}</div>
                    <div className="mt-1 text-xs text-ink-faint">{tc.preset8Detail}</div>
                    <div className="mt-1 font-mono text-[11px] text-accent">{tc.preset8Total}</div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setPreset("custom")}
                    className={`rounded-lg border p-3 text-left transition-all ${
                      preset === "custom"
                        ? "border-accent bg-accent/15 text-ink"
                        : "border-surface-line text-ink-soft hover:border-surface-line-strong"
                    }`}
                  >
                    <div className="font-display text-sm font-bold">{tc.presetCustomTitle}</div>
                    <div className="mt-1 text-xs text-ink-faint">{tc.presetCustomDetail}</div>
                    <div className="mt-1 font-mono text-[11px] text-accent">{tc.presetCustomTotal}</div>
                  </button>
                </div>

                {preset === "custom" && (
                  <div className="grid grid-cols-2 gap-4 pt-2">
                    <label className="block">
                      <span className="text-xs text-ink-soft">{tc.startersLabel}</span>
                      <input
                        type="number"
                        min={1}
                        max={15}
                        value={startersCount}
                        onChange={(e) => setStartersCount(Math.max(1, Number(e.target.value)))}
                        className={fieldClass}
                      />
                    </label>
                    <label className="block">
                      <span className="text-xs text-ink-soft">{tc.subsLabel}</span>
                      <input
                        type="number"
                        min={0}
                        max={10}
                        value={subsCount}
                        onChange={(e) => setSubsCount(Math.max(0, Number(e.target.value)))}
                        className={fieldClass}
                      />
                    </label>
                  </div>
                )}
              </div>
            )}

            {/* Bracket Participant Size Presets */}
            <div>
              <span className="text-xs font-mono font-semibold uppercase tracking-wider text-ink-soft">
                {tc.capacityLabel}
              </span>
              <div className="mt-2 flex flex-wrap gap-2">
                {[8, 16, 32, 64].map((size) => (
                  <button
                    key={size}
                    type="button"
                    onClick={() => {
                      setMaxParticipants(size);
                      setCustomParticipants(false);
                    }}
                    className={`rounded-lg border px-4 py-2 text-sm font-semibold transition-all ${
                      !customParticipants && maxParticipants === size
                        ? "border-accent bg-accent text-bg"
                        : "border-surface-line bg-surface/40 text-ink-soft hover:border-surface-line-strong"
                    }`}
                  >
                    {size} {isCvc ? tc.unitClubs : tc.unitPlayers}
                  </button>
                ))}
                <button
                  type="button"
                  onClick={() => {
                    setCustomParticipants(true);
                    setParticipantsInput(String(maxParticipants));
                  }}
                  className={`rounded-lg border px-4 py-2 text-sm font-semibold transition-all ${
                    customParticipants
                      ? "border-accent bg-accent text-bg"
                      : "border-surface-line bg-surface/40 text-ink-soft hover:border-surface-line-strong"
                  }`}
                >
                  {tc.customCapacity}
                </button>
              </div>

              {customParticipants && (
                <div className="mt-3 max-w-xs">
                  <input
                    type="text"
                    inputMode="numeric"
                    value={participantsInput}
                    onChange={(e) => {
                      const digits = e.target.value.replace(/\D/g, "");
                      setParticipantsInput(digits);
                      setMaxParticipants(digits === "" ? 0 : Number(digits));
                    }}
                    placeholder={tc.capacityPlaceholder}
                    aria-invalid={participantsError !== null}
                    className={`${fieldClass} ${participantsError ? "border-danger focus:border-danger" : ""}`}
                  />
                  {participantsError ? (
                    <p className="mt-1.5 text-xs font-semibold text-danger-ink" role="alert">
                      {participantsError}
                    </p>
                  ) : null}
                </div>
              )}
            </div>

            {/* Schedule & 2h Submission Deadline */}
            <div className="space-y-4">
              <span className="text-xs font-mono font-semibold uppercase tracking-wider text-ink-soft">
                {tc.scheduleLabel}
              </span>

              <div className="grid gap-4 sm:grid-cols-2">
                <label className="block">
                  <span className="text-xs text-ink-soft">{tc.startLabel}</span>
                  <input
                    type="datetime-local"
                    value={startAt}
                    onChange={(e) => setStartAt(e.target.value)}
                    required
                    className={fieldClass}
                  />
                </label>

                <label className="block">
                  <span className="text-xs text-ink-soft">{tc.endLabel}</span>
                  <input
                    type="datetime-local"
                    value={endAt}
                    onChange={(e) => setEndAt(e.target.value)}
                    className={fieldClass}
                  />
                </label>
              </div>

              {/* Live Cutoff Highlight */}
              {submissionDeadlineText && (
                <div className="flex items-start gap-3 rounded-xl border border-accent/30 bg-accent/10 p-4">
                  <ClockIcon className="mt-0.5 h-5 w-5 shrink-0 text-accent" />
                  <div className="text-xs">
                    <span className="font-bold text-accent-ink">
                      {tc.cutoffLabel}
                    </span>{" "}
                    <span className="text-ink font-semibold">{submissionDeadlineText}</span>
                    <p className="mt-1 text-ink-soft leading-relaxed">
                      {tc.cutoffBodyBefore}{" "}
                      <strong className="text-ink">{tc.cutoffBodyStrong}</strong>
                      {tc.cutoffBodyAfter}
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* Entry Fee & Prize Pool */}
            <div className="space-y-4 pt-2 border-t border-surface-line">
              <span className="text-xs font-mono font-semibold uppercase tracking-wider text-ink-soft">
                {tc.feesLabel}
              </span>

              <div className="grid grid-cols-2 gap-2 rounded-xl border border-surface-line bg-surface/40 p-1">
                <button
                  type="button"
                  onClick={() => setIsPaid(false)}
                  className={`rounded-lg py-2 text-xs font-bold uppercase tracking-wider transition-all ${
                    !isPaid ? "bg-accent text-bg" : "text-ink-soft hover:text-ink"
                  }`}
                >
                  {tc.freeEntry}
                </button>
                <button
                  type="button"
                  onClick={() => setIsPaid(true)}
                  className={`rounded-lg py-2 text-xs font-bold uppercase tracking-wider transition-all ${
                    isPaid ? "bg-accent text-bg" : "text-ink-soft hover:text-ink"
                  }`}
                >
                  {tc.paidEntry}
                </button>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                {isPaid && (
                  <label className="block">
                    <span className="text-xs text-ink-soft">{tc.entryFeeLabel}</span>
                    <input
                      type="number"
                      min={0}
                      value={entryFeeBdt}
                      onChange={(e) => setEntryFeeBdt(Math.max(0, Number(e.target.value)))}
                      className={fieldClass}
                    />
                  </label>
                )}

                <label className="block">
                  <span className="text-xs text-ink-soft">{tc.prizePoolLabel}</span>
                  <input
                    type="number"
                    min={0}
                    value={prizePoolBdt}
                    onChange={(e) => setPrizePoolBdt(Math.max(0, Number(e.target.value)))}
                    className={fieldClass}
                  />
                </label>
              </div>
            </div>

            {/* Submit Button */}
            <div className="pt-4">
              <button
                type="submit"
                disabled={createMutation.isPending}
                className="w-full sm:w-auto rounded-full bg-accent px-8 py-3.5 font-display text-sm font-bold text-bg shadow-[0_0_25px_rgba(217,165,68,0.3)] transition-all hover:-translate-y-0.5 disabled:opacity-40 disabled:pointer-events-none"
              >
                {createMutation.isPending ? tc.submitting : tc.submit}
              </button>
            </div>
          </form>
        </div>

        {/* Guidelines Sidebar */}
        <div className="space-y-6 lg:col-span-4 lg:sticky lg:top-24 lg:self-start">
          <EntityGuidelinesPanel
            title={tc.rules.title}
            items={[
              { icon: ShieldIcon, title: tc.rules.item1Title, body: tc.rules.item1Body },
              { icon: UsersIcon, title: tc.rules.item2Title, body: tc.rules.item2Body },
              { icon: ClockIcon, title: tc.rules.item3Title, body: tc.rules.item3Body },
            ]}
            tone="rules"
          />

          <EntityGuidelinesPanel
            title={tc.tips.title}
            items={[
              { icon: CalendarIcon, title: tc.tips.item1Title, body: tc.tips.item1Body },
              { icon: TrophyIcon, title: tc.tips.item2Title, body: tc.tips.item2Body },
            ]}
            tone="tips"
          />
        </div>
      </div>
    </div>
  );
}

export default function CreateTournamentPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-xs text-ink-faint">Loading...</div>}>
      <CreateTournamentForm />
    </Suspense>
  );
}
