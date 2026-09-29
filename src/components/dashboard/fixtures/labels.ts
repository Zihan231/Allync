import { format, type Locale, type TranslationDict } from "@/lib/i18n/translations";
import type { FixtureGame, FixtureGameStatus, FixtureStatus } from "@/lib/api/tournaments";

/** Backend round names ("Semi-final", "Round of 16", "Matchday 3") in the viewer's language. */
export function roundLabel(name: string, t: TranslationDict): string {
  const f = t.dashboard.fixtures;
  if (name === "Final") return f.roundFinal;
  if (name === "Semi-final") return f.roundSemi;
  if (name === "Quarter-final") return f.roundQuarter;
  const roundOf = name.match(/^Round of (\d+)$/);
  if (roundOf) return format(f.roundOf, { count: roundOf[1] });
  const matchday = name.match(/^Matchday (\d+)$/);
  if (matchday) return format(f.matchday, { number: matchday[1] });
  return name;
}

export function fixtureStatusLabel(status: FixtureStatus, t: TranslationDict): string {
  const f = t.dashboard.fixtures;
  return { scheduled: f.statusScheduled, in_review: f.statusInReview, completed: f.statusCompleted, bye: f.statusBye }[status];
}

export function gameStatusLabel(status: FixtureGameStatus, t: TranslationDict): string {
  const f = t.dashboard.fixtures;
  const s = t.dashboard.schedule;
  return {
    pending: f.gamePending,
    awaiting_opponent: s.gameAwaitingOpponent,
    submitted: f.gameSubmitted,
    approved: f.gameApproved,
    rejected: f.gameRejected,
    walkover: s.gameWalkover,
    forfeited: s.gameForfeited,
  }[status];
}

export const FIXTURE_STATUS_CLASSES: Record<FixtureStatus, string> = {
  scheduled: "bg-surface-line text-ink-soft",
  in_review: "bg-warning-soft text-warning-ink",
  completed: "bg-success-soft text-success-ink",
  bye: "bg-blue-soft text-blue-ink",
};

export const GAME_STATUS_CLASSES: Record<FixtureGameStatus, string> = {
  pending: "bg-surface-line text-ink-soft",
  awaiting_opponent: "bg-blue-soft text-blue-ink",
  submitted: "bg-warning-soft text-warning-ink",
  approved: "bg-success-soft text-success-ink",
  rejected: "bg-danger-soft text-danger-ink",
  walkover: "bg-accent-soft text-accent-ink",
  forfeited: "bg-danger-soft text-danger-ink",
};

// ---- Match times (always shown in Bangladesh time, where the tournament runs)

export const TOURNAMENT_TIME_ZONE = "Asia/Dhaka";
const DHAKA_OFFSET_MS = 6 * 60 * 60 * 1000;
const DAY_MS = 24 * 60 * 60 * 1000;

const intlLocale = (locale: Locale) => (locale === "bn" ? "bn-BD" : "en-US");

export function formatMatchDate(iso: string, locale: Locale): string {
  return new Intl.DateTimeFormat(intlLocale(locale), {
    timeZone: TOURNAMENT_TIME_ZONE,
    weekday: "short",
    day: "numeric",
    month: "short",
  }).format(new Date(iso));
}

export function formatMatchTime(iso: string, locale: Locale): string {
  return new Intl.DateTimeFormat(intlLocale(locale), {
    timeZone: TOURNAMENT_TIME_ZONE,
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(iso));
}

/** "Sat 5 Sep · 5:00 PM – 8:00 PM" for a game's range, or null when unscheduled. */
export function formatGameRange(game: Pick<FixtureGame, "scheduledStart" | "scheduledEnd">, t: TranslationDict, locale: Locale): string | null {
  if (!game.scheduledStart || !game.scheduledEnd) return null;
  return format(t.dashboard.schedule.range, {
    date: formatMatchDate(game.scheduledStart, locale),
    start: formatMatchTime(game.scheduledStart, locale),
    end: formatMatchTime(game.scheduledEnd, locale),
  });
}

/** Compact duration, e.g. "2h 15m", "12m", "3d 4h". */
export function formatDuration(ms: number): string {
  const minutes = Math.max(0, Math.ceil(ms / 60000));
  const days = Math.floor(minutes / 1440);
  const hours = Math.floor((minutes % 1440) / 60);
  const mins = minutes % 60;
  if (days) return `${days}d ${hours}h`;
  if (hours) return `${hours}h ${mins}m`;
  return `${mins}m`;
}

/** "HH:MM" (24h, Bangladesh time) of an instant, for time inputs. */
export function toLocalTimeInput(iso: string): string {
  const local = new Date(new Date(iso).getTime() + DHAKA_OFFSET_MS);
  return `${String(local.getUTCHours()).padStart(2, "0")}:${String(local.getUTCMinutes()).padStart(2, "0")}`;
}

/** Same Bangladesh calendar date as `dateOf`, at the "HH:MM" time → ISO string. */
export function localTimeOnSameDate(dateOf: string, time: string): string {
  const [hours, minutes] = time.split(":").map(Number);
  const dayStart = Math.floor((new Date(dateOf).getTime() + DHAKA_OFFSET_MS) / DAY_MS) * DAY_MS - DHAKA_OFFSET_MS;
  return new Date(dayStart + (hours * 60 + minutes) * 60000).toISOString();
}

/** Where a game is in its timeline right now. */
export type GamePhase = "unscheduled" | "upcoming" | "playing" | "evidence" | "closed";

export function gamePhase(game: Pick<FixtureGame, "scheduledStart" | "scheduledEnd" | "evidenceDeadline">, now: number): GamePhase {
  if (!game.scheduledStart || !game.scheduledEnd || !game.evidenceDeadline) return "unscheduled";
  if (now < new Date(game.scheduledStart).getTime()) return "upcoming";
  if (now < new Date(game.scheduledEnd).getTime()) return "playing";
  if (now <= new Date(game.evidenceDeadline).getTime()) return "evidence";
  return "closed";
}

// ---- Organizer play hours (minutes after midnight, Bangladesh time)

export const DEFAULT_PLAY_HOURS = { start: 19 * 60, end: 60 };

export const minutesToTimeInput = (minutes: number) =>
  `${String(Math.floor(minutes / 60) % 24).padStart(2, "0")}:${String(minutes % 60).padStart(2, "0")}`;

export const timeInputToMinutes = (value: string) => {
  const [hours, minutes] = value.split(":").map(Number);
  return hours * 60 + minutes;
};

/** Mirrors the backend rule: ≥ 3h long, entirely between 7am and 1am. */
export function playHoursError(start: number, end: number, t: TranslationDict): string | null {
  const s = t.dashboard.schedule;
  const normalizedEnd = end <= start ? end + 1440 : end;
  if (normalizedEnd - start < 180) return s.errPlayHoursShort;
  if (start < 7 * 60 || normalizedEnd > 25 * 60) return s.errPlayHoursNight;
  return null;
}
