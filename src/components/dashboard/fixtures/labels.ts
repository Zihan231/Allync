import { format, type TranslationDict } from "@/lib/i18n/translations";
import type { FixtureGameStatus, FixtureStatus } from "@/lib/api/tournaments";

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
  return { pending: f.gamePending, submitted: f.gameSubmitted, approved: f.gameApproved, rejected: f.gameRejected }[status];
}

export const FIXTURE_STATUS_CLASSES: Record<FixtureStatus, string> = {
  scheduled: "bg-surface-line text-ink-soft",
  in_review: "bg-warning-soft text-warning-ink",
  completed: "bg-success-soft text-success-ink",
  bye: "bg-blue-soft text-blue-ink",
};

export const GAME_STATUS_CLASSES: Record<FixtureGameStatus, string> = {
  pending: "bg-surface-line text-ink-soft",
  submitted: "bg-warning-soft text-warning-ink",
  approved: "bg-success-soft text-success-ink",
  rejected: "bg-danger-soft text-danger-ink",
};
