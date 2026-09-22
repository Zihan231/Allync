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
  const { t } = useLanguage();
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
    return deadlineDate.toLocaleString([], {
      weekday: "short",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  }, [startAt]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErrorMessage("");

    const effectiveCommunityId = communityId || queryCommunityId || eligibleCommunities[0]?.id || user?.community?.id;
    if (!effectiveCommunityId) {
      setErrorMessage("No approved hosting community found for your account.");
      return;
    }

    if (!startAt) {
      setErrorMessage("Please set the tournament start date & time.");
      return;
    }

    const startDate = new Date(startAt);
    if (startDate.getTime() <= Date.now() + 2 * 60 * 60 * 1000) {
      setErrorMessage(
        "Tournament start time must be at least 2 hours in the future to allow lineup submissions.",
      );
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

      router.push(`/dashboard/efootball/tournaments/${tournament.id}`);
    } catch (err: any) {
      const resData = err?.response?.data;
      const resMsg = resData?.message || err?.message;
      let displayMsg = "Failed to create tournament. Please ensure you are the President or Vice President of the community.";
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

  if (!loadingCommunities && !isEligible) {
    return (
      <div>
        <PageHeader
          eyebrow="Community Tournament Management"
          title="Host a Tournament"
          backHref="/dashboard/efootball/tournaments"
        />
        <div className="mt-8">
          <div className="rounded-2xl border border-surface-line bg-surface/40 p-8 text-center max-w-lg mx-auto">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-warning/15 text-warning-ink">
              <LockIcon className="h-6 w-6" />
            </div>
            <h3 className="mt-4 font-display text-base font-bold text-ink">Access Restricted</h3>
            <p className="mt-2 text-xs text-ink-soft leading-relaxed">
              Only verified Presidents and Vice Presidents of a community can host tournaments.
            </p>
            <div className="mt-6">
              <Link
                href="/dashboard/efootball/tournaments"
                className="inline-flex items-center gap-2 rounded-full bg-surface-line px-5 py-2.5 text-xs font-semibold text-ink transition-colors hover:bg-surface-line-strong"
              >
                Back to Tournaments
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
        eyebrow={eligibleCommunities[0]?.name ? `Community · ${eligibleCommunities[0].name}` : "Community Tournament"}
        title="Host a Tournament"
        backHref="/dashboard/efootball/tournaments"
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
                  Tournament Title <span className="text-accent">*</span>
                </span>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g., Champions Cup Winter 2026"
                  required
                  className={fieldClass}
                />
              </label>
            </div>

            {/* Format: PvP vs CvC */}
            <div>
              <span className="text-xs font-mono font-semibold uppercase tracking-wider text-ink-soft">
                Tournament Format <span className="text-accent">*</span>
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
                      <div className="font-display text-sm font-bold text-ink">Club vs Club (CvC)</div>
                    </div>
                    {type === "cvc" && <CheckIcon className="h-4 w-4 text-accent" />}
                  </div>
                  <p className="mt-2 text-xs text-ink-soft">
                    Member clubs register their official squad roster. President, General Secretary, or Manager submits the match lineup.
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
                      <div className="font-display text-sm font-bold text-ink">Player vs Player (PvP)</div>
                    </div>
                    {type === "pvp" && <CheckIcon className="h-4 w-4 text-accent" />}
                  </div>
                  <p className="mt-2 text-xs text-ink-soft">
                    Individual players register directly and face off in 1v1 knockout bracket fixtures.
                  </p>
                </button>
              </div>
            </div>

            {/* CvC Roster Presets (11v11 or 8v8 or Custom) */}
            {type === "cvc" && (
              <div className="rounded-xl border border-surface-line/80 bg-surface/30 p-4 space-y-4">
                <span className="text-xs font-mono font-semibold uppercase tracking-wider text-ink-soft">
                  CvC Roster Limit Preset
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
                    <div className="font-display text-sm font-bold">11 v 11 Preset</div>
                    <div className="mt-1 text-xs text-ink-faint">11 Starters + 5 Subs</div>
                    <div className="mt-1 font-mono text-[11px] text-accent">16 Players Total</div>
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
                    <div className="font-display text-sm font-bold">8 v 8 Preset</div>
                    <div className="mt-1 text-xs text-ink-faint">8 Starters + 4 Subs</div>
                    <div className="mt-1 font-mono text-[11px] text-accent">12 Players Total</div>
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
                    <div className="font-display text-sm font-bold">Custom Roster</div>
                    <div className="mt-1 text-xs text-ink-faint">Configure custom counts</div>
                    <div className="mt-1 font-mono text-[11px] text-accent">Flexible</div>
                  </button>
                </div>

                {preset === "custom" && (
                  <div className="grid grid-cols-2 gap-4 pt-2">
                    <label className="block">
                      <span className="text-xs text-ink-soft">Starters Required</span>
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
                      <span className="text-xs text-ink-soft">Substitutes Allowed</span>
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
                Participant Capacity (Bracket Size)
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
                    {size} {type === "cvc" ? "Clubs" : "Players"}
                  </button>
                ))}
                <button
                  type="button"
                  onClick={() => setCustomParticipants(true)}
                  className={`rounded-lg border px-4 py-2 text-sm font-semibold transition-all ${
                    customParticipants
                      ? "border-accent bg-accent text-bg"
                      : "border-surface-line bg-surface/40 text-ink-soft hover:border-surface-line-strong"
                  }`}
                >
                  Custom
                </button>
              </div>

              {customParticipants && (
                <div className="mt-3 max-w-xs">
                  <input
                    type="number"
                    min={2}
                    max={128}
                    value={maxParticipants}
                    onChange={(e) => setMaxParticipants(Math.max(2, Number(e.target.value)))}
                    placeholder="Enter maximum participants"
                    className={fieldClass}
                  />
                </div>
              )}
            </div>

            {/* Schedule & 2h Submission Deadline */}
            <div className="space-y-4">
              <span className="text-xs font-mono font-semibold uppercase tracking-wider text-ink-soft">
                Tournament Schedule & Cutoff
              </span>

              <div className="grid gap-4 sm:grid-cols-2">
                <label className="block">
                  <span className="text-xs text-ink-soft">Tournament Starting Time *</span>
                  <input
                    type="datetime-local"
                    value={startAt}
                    onChange={(e) => setStartAt(e.target.value)}
                    required
                    className={fieldClass}
                  />
                </label>

                <label className="block">
                  <span className="text-xs text-ink-soft">Estimated End Time (Optional)</span>
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
                      Lineup Submission Strict Cutoff:
                    </span>{" "}
                    <span className="text-ink font-semibold">{submissionDeadlineText}</span>
                    <p className="mt-1 text-ink-soft leading-relaxed">
                      All club rosters and lineups must be submitted at least{" "}
                      <strong className="text-ink">2 hours before tournament kick-off</strong>.
                      Once this window elapses, rosters lock automatically and the bracket will be generated.
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* Entry Fee & Prize Pool */}
            <div className="space-y-4 pt-2 border-t border-surface-line">
              <span className="text-xs font-mono font-semibold uppercase tracking-wider text-ink-soft">
                Entry Fee & Prize Pool
              </span>

              <div className="grid grid-cols-2 gap-2 rounded-xl border border-surface-line bg-surface/40 p-1">
                <button
                  type="button"
                  onClick={() => setIsPaid(false)}
                  className={`rounded-lg py-2 text-xs font-bold uppercase tracking-wider transition-all ${
                    !isPaid ? "bg-accent text-bg" : "text-ink-soft hover:text-ink"
                  }`}
                >
                  Free Entry
                </button>
                <button
                  type="button"
                  onClick={() => setIsPaid(true)}
                  className={`rounded-lg py-2 text-xs font-bold uppercase tracking-wider transition-all ${
                    isPaid ? "bg-accent text-bg" : "text-ink-soft hover:text-ink"
                  }`}
                >
                  Paid Entry
                </button>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                {isPaid && (
                  <label className="block">
                    <span className="text-xs text-ink-soft">Entry Fee (BDT ৳)</span>
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
                  <span className="text-xs text-ink-soft">Prize Pool (BDT ৳ - 0 for Friendly)</span>
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
                {createMutation.isPending ? "Creating Tournament..." : "Publish Tournament"}
              </button>
            </div>
          </form>
        </div>

        {/* Guidelines Sidebar */}
        <div className="space-y-6 lg:col-span-4 lg:sticky lg:top-24 lg:self-start">
          <EntityGuidelinesPanel
            title="Tournament Rules"
            items={[
              {
                icon: ShieldIcon,
                title: "Creation Authority",
                body: "Only community Presidents and Vice Presidents can sanction and host tournaments under their community umbrella.",
              },
              {
                icon: UsersIcon,
                title: "Club Membership",
                body: "In CvC events, participant clubs must already be approved members of the hosting community.",
              },
              {
                icon: ClockIcon,
                title: "2-Hour Submission Cutoff",
                body: "Club President, General Secretary, or Manager must submit team lineups at least 2 hours before the start time.",
              },
            ]}
            tone="rules"
          />

          <EntityGuidelinesPanel
            title="Host Tips"
            items={[
              {
                icon: CalendarIcon,
                title: "Bracket Generation",
                body: "Single-elimination brackets will seed registered clubs with Byes if participant numbers are uneven.",
              },
              {
                icon: TrophyIcon,
                title: "Lineup Presets",
                body: "Participating clubs can choose from their pre-configured Team squads (Team A / Team B) or submit custom lineups.",
              },
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
