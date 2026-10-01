/**
 * Tier labels for a player's headline stats (Total matches, Total wins, Win
 * rate, Goals for). Each stat climbs the same ladder on its own thresholds;
 * adjust the numbers here to rebalance.
 */
export const TIER_KEYS = ["rookie", "amateur", "semiPro", "pro", "elite", "legend"] as const;
export type TierKey = (typeof TIER_KEYS)[number];
export type TierStat = "matches" | "wins" | "winRate" | "goals";

/** Minimum value for each tier above Rookie: [Amateur, Semi-Pro, Pro, Elite, Legend]. */
export const TIER_THRESHOLDS: Record<TierStat, [number, number, number, number, number]> = {
  matches: [25, 100, 250, 500, 1000],
  wins: [10, 50, 150, 300, 600],
  winRate: [35, 45, 55, 65, 75], // percent
  goals: [25, 150, 400, 800, 1500],
};

/** Win rate means little over a handful of games: below this many matches it stays Rookie. */
export const WIN_RATE_MIN_MATCHES = 20;

export type Tier = {
  key: TierKey;
  /** 0 (Rookie) … 5 (Legend). */
  level: number;
  /** Value needed for the next tier, or null at Legend. */
  next: { key: TierKey; at: number } | null;
};

export function tierFor(stat: TierStat, value: number, matchesPlayed?: number): Tier {
  const thresholds = TIER_THRESHOLDS[stat];
  const tooFewGames = stat === "winRate" && (matchesPlayed ?? 0) < WIN_RATE_MIN_MATCHES;
  const level = tooFewGames ? 0 : thresholds.filter((min) => value >= min).length;
  return {
    key: TIER_KEYS[level],
    level,
    next: level < thresholds.length ? { key: TIER_KEYS[level + 1], at: thresholds[level] } : null,
  };
}

/** Badge colors per tier, lowest to highest. */
export const TIER_COLORS: Record<TierKey, { text: string; bg: string; border: string }> = {
  rookie: { text: "#9aa4b2", bg: "rgba(154,164,178,0.12)", border: "rgba(154,164,178,0.35)" },
  amateur: { text: "#6aa8ff", bg: "rgba(76,141,255,0.14)", border: "rgba(76,141,255,0.4)" },
  semiPro: { text: "#3fd2a3", bg: "rgba(42,201,150,0.14)", border: "rgba(42,201,150,0.4)" },
  pro: { text: "#f0c060", bg: "rgba(217,165,68,0.16)", border: "rgba(217,165,68,0.45)" },
  elite: { text: "#c08bff", bg: "rgba(155,93,229,0.16)", border: "rgba(155,93,229,0.45)" },
  legend: { text: "#ff7a59", bg: "rgba(255,92,57,0.16)", border: "rgba(255,92,57,0.5)" },
};
