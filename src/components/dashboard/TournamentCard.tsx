import Link from "next/link";
import { useLanguage } from "@/lib/i18n/LanguageContext";
import type { Tournament } from "@/lib/mock/types";
import type { BackendTournament } from "@/lib/api/tournaments";
import { TrophyIcon, UsersIcon, CrosshairIcon, CalendarIcon } from "../icons";

export function TournamentCard({
  tournament,
  href,
}: {
  tournament: Tournament | BackendTournament | any;
  href: string;
}) {
  const { t } = useLanguage();

  // Normalize format
  const rawFormat = (tournament.type || tournament.format || "pvp").toLowerCase();
  const isCvC = rawFormat === "cvc" || rawFormat === "clubvsclub";

  // Status mapping
  const rawStatus = (tournament.status || "open").toLowerCase();
  const isLive = rawStatus === "live" || rawStatus === "ongoing";
  const isOpen = rawStatus === "open" || rawStatus === "registration_open";
  const isCompleted = rawStatus === "completed";

  // Format label
  let formatBadgeText = "PvP · 1 v 1";
  let startersLabel = "1 v 1 Knockout";
  if (isCvC) {
    const starters = tournament.startersCount || 11;
    const subs = tournament.subsCount || 5;
    if (tournament.preset === "preset_11v11" || starters === 11) {
      formatBadgeText = "CvC · 11 v 11";
      startersLabel = "11 Starters · 5 Subs";
    } else if (tournament.preset === "preset_8v8" || starters === 8) {
      formatBadgeText = "CvC · 8 v 8";
      startersLabel = "8 Starters · 4 Subs";
    } else {
      formatBadgeText = `CvC · ${starters}v${starters}`;
      startersLabel = `${starters} Starters · ${subs} Subs`;
    }
  }

  // Host Name
  const hostName =
    tournament.community?.name || tournament.organizerName || "eFootball Community";

  // Entrants and capacity
  const entrantsCount = tournament.participants?.length ?? tournament.entrants ?? 0;
  const maxCapacity = tournament.maxParticipants || 16;
  const fillPercent = Math.min(100, Math.round((entrantsCount / maxCapacity) * 100));

  // Dates
  const startAt = tournament.startAt ? new Date(tournament.startAt) : new Date();
  const startDateStr = startAt.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  const startTimeStr = startAt.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" });

  // Financials
  const isPaid = Boolean(tournament.isPaid || (tournament.entryFeeBdt && tournament.entryFeeBdt > 0));
  const entryFee = tournament.entryFeeBdt ?? 0;
  const prizePool = tournament.prizePoolBdt ?? 0;

  return (
    <Link
      href={href}
      className="group relative flex flex-col overflow-hidden rounded-2xl border border-surface-line bg-surface/90 shadow-md backdrop-blur-sm transition-all duration-300 hover:-translate-y-1.5 hover:border-accent/60 hover:shadow-[0_20px_45px_-12px_rgba(0,0,0,0.85)]"
    >
      {/* 1. VISUAL COVER BANNER AT TOP */}
      <div className="relative h-28 w-full overflow-hidden bg-gradient-to-br from-[#0e1626] via-[#161f33] to-[#0c1017]">
        {/* Esports stadium lighting & geometric grid backdrop */}
        {isCvC ? (
          // Gold / Championship Stadium Aura for CvC
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-amber-500/25 via-yellow-600/10 to-transparent" />
        ) : (
          // Neon Cyan / Electric Blue Arena Aura for PvP
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-blue-500/30 via-cyan-600/10 to-transparent" />
        )}

        {/* Diagonal high-tech accent stripes */}
        <div className="absolute inset-0 opacity-15 bg-[linear-gradient(45deg,rgba(255,255,255,0.08)_25%,transparent_25%,transparent_50%,rgba(255,255,255,0.08)_50%,rgba(255,255,255,0.08)_75%,transparent_75%,transparent)] bg-[length:24px_24px]" />

        {/* Top edge subtle glow */}
        <div className="pointer-events-none absolute inset-x-0 top-0 h-[2px] bg-gradient-to-r from-transparent via-accent to-transparent opacity-80" />

        {/* Top Overlay Elements: Format Pill on Left, Status Pill on Right */}
        <div className="relative z-10 flex items-center justify-between p-3">
          {/* Format Badge */}
          <span
            className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 font-mono text-[11px] font-extrabold uppercase tracking-wider backdrop-blur-md shadow-sm ${
              isCvC
                ? "border border-amber-400/50 bg-black/60 text-amber-200"
                : "border border-blue-400/50 bg-black/60 text-blue-200"
            }`}
          >
            {isCvC ? <UsersIcon className="h-3.5 w-3.5 text-amber-300" /> : <CrosshairIcon className="h-3.5 w-3.5 text-blue-300" />}
            <span>{formatBadgeText}</span>
          </span>

          {/* High-Contrast Crisp Status Badge */}
          {isLive ? (
            <span className="flex items-center gap-1.5 rounded-full border border-rose-400/60 bg-rose-950/85 px-3 py-1 text-[11px] font-bold text-rose-100 backdrop-blur-md shadow-[0_0_14px_rgba(244,63,94,0.35)]">
              <span className="h-2 w-2 rounded-full bg-rose-400 animate-pulse shadow-[0_0_8px_#f43f5e]" />
              <span className="tracking-wide">Live Now</span>
            </span>
          ) : isOpen ? (
            <span className="flex items-center gap-1.5 rounded-full border border-emerald-400/60 bg-emerald-950/85 px-3 py-1 text-[11px] font-bold text-emerald-200 backdrop-blur-md shadow-[0_0_14px_rgba(52,211,153,0.35)]">
              <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse shadow-[0_0_8px_#34d399]" />
              <span className="tracking-wide">Registration Open</span>
            </span>
          ) : isCompleted ? (
            <span className="rounded-full border border-surface-line bg-black/60 px-3 py-1 font-mono text-[11px] text-ink-soft backdrop-blur-md font-semibold">
              Completed
            </span>
          ) : (
            <span className="rounded-full border border-surface-line bg-black/60 px-3 py-1 font-mono text-[11px] text-ink-soft backdrop-blur-md font-semibold">
              Registration Closed
            </span>
          )}
        </div>

        {/* Bottom of Banner: Prominent Floating Prize Badge on Right */}
        <div className="absolute bottom-2.5 right-3 z-10">
          {prizePool > 0 ? (
            <span className="inline-flex items-center gap-1.5 rounded-full bg-gradient-to-r from-amber-500 via-yellow-400 to-amber-500 px-3.5 py-1 font-display text-xs font-black text-black shadow-[0_0_20px_rgba(217,165,68,0.6)]">
              <TrophyIcon className="h-3.5 w-3.5 text-black" />
              <span>৳{prizePool.toLocaleString()} Prize</span>
            </span>
          ) : (
            <span className="inline-flex items-center gap-1 rounded-full border border-surface-line-strong bg-black/70 px-3 py-0.5 font-mono text-[10px] font-bold text-ink-soft backdrop-blur-md">
              Friendly Cup
            </span>
          )}
        </div>
      </div>

      {/* 2. CARD CONTENT BODY - Cleanly aligned without floating "C" */}
      <div className="relative p-5 pt-4">
        <div>
          <h3 className="font-display text-base font-bold text-white group-hover:text-accent-ink transition-colors line-clamp-1 drop-shadow-sm">
            {tournament.name}
          </h3>
          <p className="mt-1 flex items-center gap-1.5 text-xs text-ink-soft truncate font-medium">
            <span className="h-1.5 w-1.5 rounded-full bg-accent" />
            <span>{hostName}</span>
          </p>
        </div>

        {/* Feature Pills */}
        <div className="mt-3.5 flex flex-wrap items-center gap-2">
          {/* Entry Fee Badge */}
          {isPaid ? (
            <span className="inline-flex items-center gap-1.5 rounded-lg border border-amber-400/80 bg-amber-950/70 px-3 py-1 font-mono text-xs font-bold text-amber-100 shadow-sm">
              <span className="h-1.5 w-1.5 rounded-full bg-amber-400" />
              <span>৳{entryFee.toLocaleString()} Entry Fee</span>
            </span>
          ) : (
            <span className="inline-flex items-center gap-1.5 rounded-lg border border-emerald-400/80 bg-emerald-950/70 px-3 py-1 font-mono text-xs font-bold text-emerald-100 shadow-sm">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 shadow-[0_0_6px_#34d399]" />
              <span>Free Entry</span>
            </span>
          )}

          {/* Roster Size Tag */}
          <span className="inline-flex items-center rounded-lg border border-surface-line-strong bg-surface-raised px-3 py-1 font-mono text-xs font-semibold text-white">
            {startersLabel}
          </span>
        </div>

        {/* 3. CARD FOOTER: CAPACITY PROGRESS & START SCHEDULE */}
        <div className="mt-5 border-t border-surface-line/80 pt-3.5">
          <div className="flex items-center justify-between gap-3">
            {/* Left: Entrants Capacity */}
            <div className="space-y-1">
              <div className="flex items-baseline gap-1 font-mono text-xs">
                <span className="font-bold text-white">{entrantsCount}</span>
                <span className="text-ink-soft">/ {maxCapacity} Registered</span>
              </div>
              {/* Sleek Mini Progress Bar */}
              <div className="h-1.5 w-24 overflow-hidden rounded-full bg-surface-line">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-accent to-amber-300 transition-all duration-300"
                  style={{ width: `${fillPercent}%` }}
                />
              </div>
            </div>

            {/* Right: Kickoff Schedule */}
            <div className="text-right">
              <div className="flex items-center justify-end gap-1 font-mono text-[10px] text-ink-faint font-semibold uppercase tracking-wider">
                <CalendarIcon className="h-3 w-3 text-accent" />
                <span>Starts</span>
              </div>
              <div className="font-display text-xs font-bold text-white">
                {startDateStr}{" "}
                <span className="font-mono text-[11px] text-accent-ink font-semibold">
                  {startTimeStr}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Link>
  );
}
