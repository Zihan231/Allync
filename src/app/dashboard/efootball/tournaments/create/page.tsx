"use client";

import { useState, useMemo, useEffect, type ComponentType, type ReactNode } from "react";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Suspense } from "react";
import { useLanguage } from "@/lib/i18n/LanguageContext";
import { format } from "@/lib/i18n/translations";
import {
  DEFAULT_PLAY_HOURS,
  minutesToTimeInput,
  playHoursError,
  timeInputToMinutes,
} from "@/components/dashboard/fixtures/labels";
import { useSession } from "@/lib/session/SessionContext";
import { getCommunities } from "@/lib/api/communities";
import { useCreateTournament } from "@/lib/api/hooks/useTournaments";
import { useMyTransfers } from "@/lib/api/hooks/useTransfers";
import { PaymentModal } from "@/components/dashboard/transfers/PaymentModal";
import type { BackendCommunity } from "@/lib/api/types";
import {
  TOURNAMENT_PRESET_ROSTERS,
  tournamentHref,
  type GamingPlatform,
  type TournamentType,
  type TournamentPreset,
} from "@/lib/api/tournaments";
import { PageHeader } from "@/components/dashboard/PageHeader";
import { EntityGuidelinesPanel } from "@/components/dashboard/EntityGuidelinesPanel";
import { MatchOfficialsPicker, type OfficialsHost } from "@/components/dashboard/MatchOfficialsPicker";
import {
  GavelIcon,
  TrophyIcon,
  UsersIcon,
  CrosshairIcon,
  LockIcon,
  ShieldIcon,
  CalendarIcon,
  ClockIcon,
  CheckIcon,
  BracketIcon,
  WalletIcon,
} from "@/components/icons";

const fieldClass =
  "mt-1.5 w-full rounded-xl border border-surface-line bg-surface px-4 py-3 text-sm text-ink placeholder:text-ink-faint outline-none focus:border-accent focus:ring-2 focus:ring-accent/20 transition-all [color-scheme:dark]";

type SectionTone = "neutral" | "accent" | "blue" | "success" | "danger";

// Theme tokens only (see globals.css). Full class strings so Tailwind picks them up.
const SECTION_TONES: Record<SectionTone, { card: string; bar: string; icon: string; title: string }> = {
  neutral: {
    card: "border-surface-line-strong bg-surface/40",
    bar: "bg-ink-soft",
    icon: "bg-surface-line text-ink",
    title: "text-ink",
  },
  accent: {
    card: "border-accent/30 bg-accent-soft/40",
    bar: "bg-accent",
    icon: "bg-accent-soft text-accent",
    title: "text-accent-ink",
  },
  blue: {
    card: "border-blue/30 bg-blue-soft/40",
    bar: "bg-blue",
    icon: "bg-blue-soft text-blue",
    title: "text-blue-ink",
  },
  success: {
    card: "border-success/30 bg-success-soft/40",
    bar: "bg-success",
    icon: "bg-success-soft text-success",
    title: "text-success-ink",
  },
  danger: {
    card: "border-danger/30 bg-danger-soft/40",
    bar: "bg-danger",
    icon: "bg-danger-soft text-danger",
    title: "text-danger-ink",
  },
};

// Each roster preset gets its own theme color so the options are easy to tell apart.
const PRESET_TONES: Record<TournamentPreset, { idle: string; active: string; text: string }> = {
  "16v16": {
    idle: "border-danger/30 hover:border-danger/60",
    active: "border-danger bg-danger-soft ring-1 ring-danger/40",
    text: "text-danger-ink",
  },
  "12v12": {
    idle: "border-accent/30 hover:border-accent/60",
    active: "border-accent bg-accent-soft ring-1 ring-accent/40",
    text: "text-accent-ink",
  },
  "8v8": {
    idle: "border-blue/30 hover:border-blue/60",
    active: "border-blue bg-blue-soft ring-1 ring-blue/40",
    text: "text-blue-ink",
  },
  "4v4": {
    idle: "border-success/30 hover:border-success/60",
    active: "border-success bg-success-soft ring-1 ring-success/40",
    text: "text-success-ink",
  },
  custom: {
    idle: "border-surface-line-strong hover:border-ink-soft",
    active: "border-ink-soft bg-surface-line/60 ring-1 ring-ink-soft/40",
    text: "text-ink",
  },
  "11v11": {
    idle: "border-surface-line hover:border-surface-line-strong",
    active: "border-ink-soft bg-surface-line/60",
    text: "text-ink",
  },
};

/** Upper limit for an entry fee or prize pool (৳1 crore). */
const MAX_AMOUNT_BDT = 10_000_000;
const ORGANIZER_PROFILE_ERROR =
  "Complete your profile and submit an NID or passport before creating a club, community or tournament.";
/** Keeps digits only, without leading zeros (Bangla digits are converted). */
const amountDigits = (value: string) =>
  value
    .replace(/[০-৯]/g, (d) => String("০১২৩৪৫৬৭৮৯".indexOf(d)))
    .replace(/\D/g, "")
    .replace(/^0+(?=\d)/, "")
    .slice(0, 9);

function FormSection({
  tone,
  icon: Icon,
  title,
  required = false,
  children,
}: {
  tone: SectionTone;
  icon: ComponentType<{ className?: string }>;
  title: string;
  required?: boolean;
  children: ReactNode;
}) {
  const styles = SECTION_TONES[tone];
  return (
    <section className={`relative overflow-hidden rounded-2xl border p-4 pl-5 sm:p-5 sm:pl-6 ${styles.card}`}>
      <div className={`pointer-events-none absolute inset-y-0 left-0 w-1 ${styles.bar}`} aria-hidden="true" />
      <h3 className="flex items-center gap-2.5">
        <span className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${styles.icon}`}>
          <Icon className="h-4 w-4" />
        </span>
        <span className={`font-display text-sm font-bold uppercase tracking-wide ${styles.title}`}>
          {title}
          {required ? <span className="ml-1 text-accent">*</span> : null}
        </span>
      </h3>
      <div className="mt-4">{children}</div>
    </section>
  );
}

function CreateTournamentForm() {
  const { t, locale } = useLanguage();
  const tc = t.dashboard.tournamentCreate;
  const { user } = useSession();
  const router = useRouter();
  const searchParams = useSearchParams();
  const queryCommunityId = searchParams.get("communityId");
  // `?clubId=` → a club-hosted tournament: PvP between the club's members, run by its President / GS.
  const hostClubId = searchParams.get("clubId");
  const isClubHost = Boolean(hostClubId);
  // Organizer mode (/dashboard/organizer/create): a general tournament, no community or club,
  // open to everyone. Its prize is paid from the organizer's wallet.
  const isGeneralHost = usePathname().startsWith("/dashboard/organizer");
  const { data: myTransfers } = useMyTransfers(isGeneralHost);
  const [prizeCheckout, setPrizeCheckout] = useState(false);
  const createMutation = useCreateTournament();

  const [communities, setCommunities] = useState<BackendCommunity[]>([]);
  const [loadingCommunities, setLoadingCommunities] = useState(true);

  // Form states
  const [name, setName] = useState("");
  const [communityId, setCommunityId] = useState("");
  const [type, setType] = useState<TournamentType>(() => (searchParams.get("clubId") ? "pvp" : "cvc"));
  const [platform, setPlatform] = useState<GamingPlatform>("mobile");
  const [preset, setPreset] = useState<TournamentPreset>("8v8");
  const [startersCount, setStartersCount] = useState(8);
  const [subsCount, setSubsCount] = useState(4);
  // Raw text of the custom roster boxes, so they can be cleared while typing.
  const [startersInput, setStartersInput] = useState("8");
  const [subsInput, setSubsInput] = useState("4");
  const [maxParticipants, setMaxParticipants] = useState(16);
  const [customParticipants, setCustomParticipants] = useState(false);
  const [participantsInput, setParticipantsInput] = useState("16");
  const isCvc = type === "cvc";
  const isCustomRoster = isCvc && preset === "custom";
  const startersError = !isCustomRoster
    ? null
    : startersInput === ""
      ? tc.errStartersEmpty
      : startersCount < 4 || startersCount > 16
        ? tc.errStartersRange
        : startersCount % 4 !== 0
          ? tc.errStartersOdd
          : null;
  const subsError = !isCustomRoster
    ? null
    : subsInput === ""
      ? tc.errSubsEmpty
      : subsCount > 10
        ? tc.errSubsRange
        : null;
  const participantsError = !customParticipants
    ? null
    : participantsInput === ""
      ? (isCvc ? tc.errCapacityEmptyClubs : tc.errCapacityEmptyPlayers)
      : maxParticipants < 4
        ? (isCvc ? tc.errCapacityMinClubs : tc.errCapacityMinPlayers)
        : maxParticipants > 128
          ? (isCvc ? tc.errCapacityMaxClubs : tc.errCapacityMaxPlayers)
          : maxParticipants % 4 !== 0
            ? (isCvc ? tc.errCapacityOddClubs : tc.errCapacityOddPlayers)
            : null;

  // Schedule
  const [startAt, setStartAt] = useState("");
  const [endAt, setEndAt] = useState("");
  const [playStart, setPlayStart] = useState(minutesToTimeInput(DEFAULT_PLAY_HOURS.start));
  const [playEnd, setPlayEnd] = useState(minutesToTimeInput(DEFAULT_PLAY_HOURS.end));
  const ts = t.dashboard.schedule;
  const playHoursProblem =
    playStart && playEnd ? playHoursError(timeInputToMinutes(playStart), timeInputToMinutes(playEnd), t) : ts.errPlayHoursShort;

  // Financials
  const [isPaid, setIsPaid] = useState(false);
  // Typed as text (digits only) so the fields can be cleared and validated inline.
  const [entryFeeInput, setEntryFeeInput] = useState("500");
  const [prizePoolInput, setPrizePoolInput] = useState("5000");
  const entryFeeBdt = Number(entryFeeInput || 0);
  const prizePoolBdt = Number(prizePoolInput || 0);
  const entryFeeError =
    isClubHost || !isPaid
      ? null
      : entryFeeInput === ""
        ? tc.errEntryFeeEmpty
        : entryFeeBdt <= 0
          ? tc.errEntryFeeZero
          : entryFeeBdt > MAX_AMOUNT_BDT
            ? tc.errAmountMax
            : null;
  const prizePoolError = isClubHost
    ? null
    : prizePoolInput === ""
      ? tc.errPrizePoolEmpty
      : prizePoolBdt > MAX_AMOUNT_BDT
        ? tc.errAmountMax
        : null;

  // Match officials (user ids) belong to one host; switching community starts over.
  const [officials, setOfficials] = useState<{ hostId: string; ids: string[] }>({ hostId: "", ids: [] });

  const [errorMessage, setErrorMessage] = useState("");
  const rawUser = user.raw ?? {};
  const hasValue = (value: unknown) => typeof value === "string" && value.trim().length > 0;
  const organizerProfileIncomplete =
    ![
      user.dpUrl ?? rawUser.dpUrl,
      user.coverUrl ?? rawUser.coverUrl,
      rawUser.inGameId,
      rawUser.facebookProfileName,
      rawUser.facebookUrl,
      rawUser.deviceName,
      rawUser.deviceModel,
      rawUser.division,
      rawUser.district,
      rawUser.permanentAddress,
    ].every(hasValue) ||
    !(["national_id", "passport"].includes(rawUser.documentType) && hasValue(rawUser.documentDataUrl));

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

  const hostCommunityId = communityId || queryCommunityId || eligibleCommunities[0]?.id || user?.community?.id || "";
  const officialsHost: OfficialsHost = isClubHost
    ? { kind: "club", id: hostClubId! }
    : { kind: "community", id: hostCommunityId };
  const matchOfficialIds = officials.hostId === officialsHost.id ? officials.ids : [];

  // Adjust starters and subs when preset changes
  function handlePresetSelect(selectedPreset: TournamentPreset) {
    setPreset(selectedPreset);
    const roster = TOURNAMENT_PRESET_ROSTERS.find((r) => r.preset === selectedPreset);
    if (roster) {
      setStartersCount(roster.startersCount);
      setSubsCount(roster.subsCount);
      setStartersInput(String(roster.startersCount));
      setSubsInput(String(roster.subsCount));
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

    if (organizerProfileIncomplete) {
      setErrorMessage(ORGANIZER_PROFILE_ERROR);
      return;
    }

    const effectiveCommunityId = hostCommunityId;
    if (!isClubHost && !isGeneralHost && !effectiveCommunityId) {
      setErrorMessage(tc.errNoCommunity);
      return;
    }

    if (!startAt) {
      setErrorMessage(tc.errNoStart);
      return;
    }

    const startDate = new Date(startAt);
    // TEMP (testing auto bracket generation): start times < 2h away are allowed. Set back to true.
    const enforceStartLead = false;
    if (enforceStartLead && startDate.getTime() <= Date.now() + 2 * 60 * 60 * 1000) {
      setErrorMessage(tc.errStartTooSoon);
      return;
    }

    const rosterError = startersError || subsError;
    if (rosterError) {
      setErrorMessage(rosterError);
      return;
    }

    if (playHoursProblem) {
      setErrorMessage(playHoursProblem);
      return;
    }

    if (participantsError) {
      setErrorMessage(participantsError);
      return;
    }

    const amountError = entryFeeError || prizePoolError;
    if (amountError) {
      setErrorMessage(amountError);
      return;
    }

    // A general tournament with a prize: pay the prize into a hold first (the checkout creates it).
    if (isGeneralHost && prizePoolBdt > 0) {
      setPrizeCheckout(true);
      return;
    }

    try {
      const tournament = await createNow();
      router.push(tournamentHref(tournament));
    } catch (err: any) {
      setErrorMessage(createErrorMessage(err));
    }
  }

  function createErrorMessage(err: any): string {
    const resMsg = err?.response?.data?.message || err?.message;
    if (Array.isArray(resMsg)) return resMsg.join(", ");
    if (typeof resMsg === "string" && resMsg.trim()) return resMsg;
    return tc.errCreateFailed;
  }

  function createNow() {
    {
      return createMutation.mutateAsync({
        name: name.trim(),
        type,
        platform,
        preset: type === "cvc" ? preset : "custom",
        startersCount: type === "cvc" ? startersCount : 1,
        subsCount: type === "cvc" ? subsCount : 0,
        maxParticipants,
        // Club tournaments are friendlies: no entry fee or prize.
        isPaid: isClubHost ? false : isPaid,
        entryFeeBdt: !isClubHost && isPaid ? entryFeeBdt : 0,
        prizePoolBdt: !isClubHost && prizePoolBdt > 0 ? prizePoolBdt : 0,
        startAt: new Date(startAt).toISOString(),
        endAt: endAt ? new Date(endAt).toISOString() : undefined,
        playHoursStart: timeInputToMinutes(playStart),
        playHoursEnd: timeInputToMinutes(playEnd),
        matchOfficialIds: isGeneralHost ? [] : matchOfficialIds,
        ...(isClubHost
          ? { hostClubId: hostClubId! }
          : isGeneralHost
            ? { general: true }
            : { communityId: hostCommunityId }),
      });
    }
  }

  const isClubLeader =
    isClubHost &&
    user?.club?.id === hostClubId &&
    (user?.club?.role === "President" || user?.club?.role === "General Secretary");
  const isEligible = isGeneralHost
    ? true
    : isClubHost
      ? isClubLeader
      : eligibleCommunities.length > 0 || Boolean(queryCommunityId) || Boolean(user?.community?.id);
  const backCommunityId = communityId || queryCommunityId || user?.community?.id;
  const communityBackHref = isGeneralHost
    ? "/dashboard/organizer"
    : isClubHost
    ? `/dashboard/efootball/clubs/${hostClubId}?tab=tournaments`
    : backCommunityId
      ? `/dashboard/efootball/community/${backCommunityId}?tab=tournaments`
      : "/dashboard/efootball/community";

  if ((isClubHost || !loadingCommunities) && !isEligible) {
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
              {isClubHost ? tc.accessRestrictedClubBody : tc.accessRestrictedBody}
            </p>
            <div className="mt-6">
              <Link
                href={communityBackHref}
                className="inline-flex items-center gap-2 rounded-full bg-surface-line px-5 py-2.5 text-xs font-semibold text-ink transition-colors hover:bg-surface-line-strong"
              >
                {isClubHost ? tc.backToClub : tc.backToCommunity}
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
        eyebrow={
          isGeneralHost
            ? tc.eyebrowOrganizer
            : isClubHost
            ? `${tc.eyebrowClub}${user?.club?.name ? ` · ${user.club.name}` : ""}`
            : eligibleCommunities[0]?.name
              ? `${tc.eyebrowCommunity} · ${eligibleCommunities[0].name}`
              : tc.eyebrowDefault
        }
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
              <div className="rounded-xl border border-danger/30 bg-danger-soft p-4 text-xs font-medium text-danger-ink">
                {errorMessage}
              </div>
            )}



            {/* Tournament Title */}
            <FormSection tone="neutral" icon={TrophyIcon} title={tc.titleLabel} required>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder={tc.titlePlaceholder}
                aria-label={tc.titleLabel}
                required
                className={fieldClass}
              />
            </FormSection>

            {/* Platform: mobile vs console */}
            <FormSection tone="blue" icon={ShieldIcon} title={tc.platformLabel} required>
              <div className="grid gap-3 sm:grid-cols-2">
                {(
                  [
                    ["mobile", tc.platformMobileTitle, tc.platformMobileBody],
                    ["console", tc.platformConsoleTitle, tc.platformConsoleBody],
                  ] as const
                ).map(([value, title, body]) => (
                  <button
                    key={value}
                    type="button"
                    onClick={() => setPlatform(value)}
                    className={`relative flex flex-col rounded-xl border p-4 text-left transition-all ${
                      platform === value
                        ? "border-blue bg-blue-soft shadow-[0_0_20px_rgba(76,141,255,0.18)]"
                        : "border-surface-line bg-surface/40 hover:border-surface-line-strong"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="font-display text-sm font-bold text-ink">{title}</div>
                      {platform === value && <CheckIcon className="h-4 w-4 text-blue" />}
                    </div>
                    <p className="mt-2 text-xs text-ink-soft">{body}</p>
                  </button>
                ))}
              </div>
            </FormSection>

            {/* Format: PvP vs CvC */}
            <FormSection tone="blue" icon={CrosshairIcon} title={tc.formatLabel} required>
              {isClubHost ? (
                <p className="mb-3 rounded-xl border border-blue/30 bg-blue-soft/40 px-3 py-2 text-xs leading-relaxed text-blue-ink">
                  {tc.clubPvpOnly}
                </p>
              ) : null}
              <div className={`grid gap-3 ${isClubHost ? "" : "sm:grid-cols-2"}`}>
                {isClubHost ? null : (
                <button
                  type="button"
                  onClick={() => setType("cvc")}
                  className={`group relative flex flex-col rounded-xl border p-4 text-left transition-all ${
                    type === "cvc"
                      ? "border-blue bg-blue-soft shadow-[0_0_20px_rgba(76,141,255,0.18)]"
                      : "border-surface-line bg-surface/40 hover:border-surface-line-strong"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-soft text-blue">
                        <UsersIcon className="h-4 w-4" />
                      </div>
                      <div className="font-display text-sm font-bold text-ink">{tc.cvcTitle}</div>
                    </div>
                    {type === "cvc" && <CheckIcon className="h-4 w-4 text-blue" />}
                  </div>
                  <p className="mt-2 text-xs text-ink-soft">
                    {tc.cvcBody}
                  </p>
                </button>
                )}

                <button
                  type="button"
                  onClick={() => setType("pvp")}
                  className={`group relative flex flex-col rounded-xl border p-4 text-left transition-all ${
                    type === "pvp"
                      ? "border-blue bg-blue-soft shadow-[0_0_20px_rgba(76,141,255,0.18)]"
                      : "border-surface-line bg-surface/40 hover:border-surface-line-strong"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-soft text-blue">
                        <CrosshairIcon className="h-4 w-4" />
                      </div>
                      <div className="font-display text-sm font-bold text-ink">{tc.pvpTitle}</div>
                    </div>
                    {type === "pvp" && <CheckIcon className="h-4 w-4 text-blue" />}
                  </div>
                  <p className="mt-2 text-xs text-ink-soft">
                    {tc.pvpBody}
                  </p>
                </button>
              </div>

              {/* CvC Roster Presets (16v16 / 12v12 / 8v8 / 4v4 or Custom): a sub-step of the format choice */}
              {type === "cvc" && (
                <div className="mt-5 rounded-xl border border-surface-line bg-bg/50 p-4">
                  <h4 className="mb-3 flex items-center gap-2 font-mono text-[11px] font-semibold uppercase tracking-wider text-ink-soft">
                    <ShieldIcon className="h-3.5 w-3.5 text-blue" />
                    {tc.rosterPresetLabel}
                  </h4>
                  <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
                    {TOURNAMENT_PRESET_ROSTERS.map((roster) => (
                      <button
                        key={roster.preset}
                        type="button"
                        onClick={() => handlePresetSelect(roster.preset)}
                        className={`rounded-lg border p-3 text-left text-ink transition-all ${
                          preset === roster.preset
                            ? PRESET_TONES[roster.preset].active
                            : PRESET_TONES[roster.preset].idle
                        }`}
                      >
                        <div className={`font-display text-sm font-bold ${PRESET_TONES[roster.preset].text}`}>
                          {format(tc.presetTitle, { count: roster.startersCount })}
                        </div>
                        <div className="mt-1 text-xs text-ink-faint">
                          {format(tc.presetDetail, { starters: roster.startersCount, subs: roster.subsCount })}
                        </div>
                        <div className={`mt-1 font-mono text-[11px] ${PRESET_TONES[roster.preset].text}`}>
                          {format(tc.presetTotal, { total: roster.startersCount + roster.subsCount })}
                        </div>
                      </button>
                    ))}

                    <button
                      type="button"
                      onClick={() => setPreset("custom")}
                      className={`rounded-lg border p-3 text-left text-ink transition-all ${
                        preset === "custom" ? PRESET_TONES.custom.active : PRESET_TONES.custom.idle
                      }`}
                    >
                      <div className="font-display text-sm font-bold">{tc.presetCustomTitle}</div>
                      <div className="mt-1 text-xs text-ink-faint">{tc.presetCustomDetail}</div>
                      <div className="mt-1 font-mono text-[11px] text-ink-soft">{tc.presetCustomTotal}</div>
                    </button>
                  </div>

                  {preset === "custom" && (
                    <div className="mt-4 grid grid-cols-2 gap-4">
                      <label className="block">
                        <span className="text-xs text-ink-soft">{tc.startersLabel}</span>
                        <input
                          type="text"
                          inputMode="numeric"
                          value={startersInput}
                          onChange={(e) => {
                            const digits = e.target.value.replace(/\D/g, "");
                            setStartersInput(digits);
                            setStartersCount(digits === "" ? 0 : Number(digits));
                          }}
                          aria-invalid={startersError !== null}
                          className={`${fieldClass} ${startersError ? "border-danger focus:border-danger" : ""}`}
                        />
                        {startersError ? (
                          <p className="mt-1.5 text-xs font-semibold text-danger-ink" role="alert">
                            {startersError}
                          </p>
                        ) : null}
                      </label>
                      <label className="block">
                        <span className="text-xs text-ink-soft">{tc.subsLabel}</span>
                        <input
                          type="text"
                          inputMode="numeric"
                          value={subsInput}
                          onChange={(e) => {
                            const digits = e.target.value.replace(/\D/g, "");
                            setSubsInput(digits);
                            setSubsCount(digits === "" ? 0 : Number(digits));
                          }}
                          aria-invalid={subsError !== null}
                          className={`${fieldClass} ${subsError ? "border-danger focus:border-danger" : ""}`}
                        />
                        {subsError ? (
                          <p className="mt-1.5 text-xs font-semibold text-danger-ink" role="alert">
                            {subsError}
                          </p>
                        ) : null}
                      </label>
                    </div>
                  )}
                </div>
              )}
            </FormSection>

            {/* Bracket Participant Size Presets */}
            <FormSection tone="success" icon={BracketIcon} title={tc.capacityLabel}>
              <div className="flex flex-wrap gap-2">
                {[4, 8, 12, 16, 24, 32].map((size) => (
                  <button
                    key={size}
                    type="button"
                    onClick={() => {
                      setMaxParticipants(size);
                      setCustomParticipants(false);
                    }}
                    className={`rounded-lg border px-4 py-2 text-sm font-semibold transition-all ${
                      !customParticipants && maxParticipants === size
                        ? "border-success bg-success text-bg"
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
                      ? "border-success bg-success text-bg"
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
            </FormSection>

            {/* Schedule & 2h Submission Deadline */}
            <FormSection tone="danger" icon={CalendarIcon} title={tc.scheduleLabel}>
              <div className="space-y-4">
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

              {/* Daily play hours: where the system places each match's 3h range */}
              <div className="rounded-xl border border-surface-line bg-bg/40 p-4">
                <div className="text-xs font-semibold text-ink">{ts.playHours}</div>
                <p className="mt-1 text-[11px] leading-relaxed text-ink-faint">{ts.playHoursHint}</p>
                <div className="mt-3 grid max-w-sm grid-cols-2 gap-3">
                  <label className="block">
                    <span className="text-xs text-ink-soft">{ts.playHoursFrom}</span>
                    <input
                      type="time"
                      step={1800}
                      value={playStart}
                      onChange={(e) => setPlayStart(e.target.value)}
                      aria-invalid={playHoursProblem !== null}
                      className={`${fieldClass} ${playHoursProblem ? "border-danger focus:border-danger" : ""}`}
                    />
                  </label>
                  <label className="block">
                    <span className="text-xs text-ink-soft">{ts.playHoursTo}</span>
                    <input
                      type="time"
                      step={1800}
                      value={playEnd}
                      onChange={(e) => setPlayEnd(e.target.value)}
                      aria-invalid={playHoursProblem !== null}
                      className={`${fieldClass} ${playHoursProblem ? "border-danger focus:border-danger" : ""}`}
                    />
                  </label>
                </div>
                {playHoursProblem ? (
                  <p className="mt-1.5 text-xs font-semibold text-danger-ink" role="alert">{playHoursProblem}</p>
                ) : null}
              </div>

              {/* Live Cutoff Highlight */}
              {submissionDeadlineText && (
                <div className="flex items-start gap-3 rounded-xl border border-danger/30 bg-danger-soft p-4">
                  <ClockIcon className="mt-0.5 h-5 w-5 shrink-0 text-danger" />
                  <div className="text-xs">
                    <span className="font-bold text-danger-ink">
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
            </FormSection>

            {/* Match officials: review evidence with the President / Vice President (general: the organizer reviews) */}
            {isGeneralHost ? null : (
            <FormSection tone="blue" icon={GavelIcon} title={t.dashboard.matchOfficials.title}>
              <MatchOfficialsPicker
                host={officialsHost}
                value={matchOfficialIds}
                onChange={(ids) => setOfficials({ hostId: officialsHost.id, ids })}
              />
            </FormSection>
            )}

            {/* Entry Fee & Prize Pool (community tournaments; club ones are friendlies) */}
            {isClubHost ? (
              <FormSection tone="accent" icon={WalletIcon} title={tc.friendlyClubTitle}>
                <p className="text-sm text-ink-soft">{tc.friendlyClubBody}</p>
              </FormSection>
            ) : (
            <FormSection tone="accent" icon={WalletIcon} title={tc.feesLabel}>
              <div className="space-y-4">
              {isGeneralHost ? (
                <p className="rounded-xl border border-accent/30 bg-accent-soft/40 px-3 py-2 text-xs leading-relaxed text-ink-soft">
                  {tc.generalNote}
                </p>
              ) : null}
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
                      type="text"
                      inputMode="numeric"
                      autoComplete="off"
                      value={entryFeeInput}
                      onChange={(e) => setEntryFeeInput(amountDigits(e.target.value))}
                      aria-invalid={entryFeeError !== null}
                      className={`${fieldClass} ${entryFeeError ? "border-danger focus:border-danger" : ""}`}
                    />
                    {entryFeeError ? (
                      <p className="mt-1.5 text-xs font-semibold text-danger-ink" role="alert">
                        {entryFeeError}
                      </p>
                    ) : null}
                  </label>
                )}

                <label className="block">
                  <span className="text-xs text-ink-soft">{tc.prizePoolLabel}</span>
                  <input
                    type="text"
                    inputMode="numeric"
                    autoComplete="off"
                    value={prizePoolInput}
                    onChange={(e) => setPrizePoolInput(amountDigits(e.target.value))}
                    aria-invalid={prizePoolError !== null}
                    className={`${fieldClass} ${prizePoolError ? "border-danger focus:border-danger" : ""}`}
                  />
                  {prizePoolError ? (
                    <p className="mt-1.5 text-xs font-semibold text-danger-ink" role="alert">
                      {prizePoolError}
                    </p>
                  ) : null}
                </label>
              </div>
              </div>
            </FormSection>
            )}

            {/* Submit Button */}
            <div className="pt-4">
              {organizerProfileIncomplete ? (
                <div className="mb-4 rounded-xl border border-danger/40 bg-danger-soft p-4 text-sm font-semibold text-danger-ink" role="alert">
                  <p>{ORGANIZER_PROFILE_ERROR}</p>
                  <Link href="/dashboard/efootball/profile" className="mt-2 inline-flex font-bold underline underline-offset-4">
                    Complete profile
                  </Link>
                </div>
              ) : null}
              <button
                type="submit"
                disabled={createMutation.isPending || organizerProfileIncomplete}
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

      {prizeCheckout ? (
        <PaymentModal
          amountTk={prizePoolBdt}
          payeeName={tc.champion}
          purpose={format(tc.prizePurpose, { tournament: name.trim() })}
          balanceTk={myTransfers?.wallet.balanceTk ?? null}
          onPay={async () => {
            // Creating the tournament holds the prize from the organizer's wallet.
            const tournament = await createNow();
            setPrizeCheckout(false);
            router.push(tournamentHref(tournament));
            return null;
          }}
          onClose={() => setPrizeCheckout(false)}
        />
      ) : null}
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
