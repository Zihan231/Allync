import { BallIcon, ChartIcon, FlameIcon, SpikeIcon, TrophyIcon, WalletIcon } from "@/components/icons";
import type { UserRole } from "@/lib/session/SessionContext";

export const ROLE_ORDER: UserRole[] = ["player", "organizer", "coach", "creative", "sponsor", "social"];

/** Icon and colour of each role in the picker and on the profile. */
export const ROLE_META: Record<UserRole, { icon: typeof BallIcon; color: string }> = {
  player: { icon: BallIcon, color: "#22c55e" },
  organizer: { icon: TrophyIcon, color: "#f59e0b" },
  coach: { icon: ChartIcon, color: "#3b82f6" },
  creative: { icon: SpikeIcon, color: "#ec4899" },
  sponsor: { icon: WalletIcon, color: "#a855f7" },
  social: { icon: FlameIcon, color: "#f97316" },
};

/** Roles with their own area today; the others show a coming-soon page. */
export const LIVE_ROLES: UserRole[] = ["player", "organizer", "coach", "creative", "sponsor"];

/** Where the dashboard opens for a role. */
export function homeForRole(role: UserRole, game = "efootball"): string {
  if (role === "organizer") return "/dashboard/organizer";
  if (role === "coach") return "/dashboard/coach";
  if (role === "creative") return "/dashboard/creator";
  if (role === "sponsor") return "/dashboard/sponsor";
  if (role === "player") return `/dashboard/${game}`;
  return `/dashboard/roles/${role}`;
}

/** Each mode's own profile page (the shared personal info lives on /dashboard/profile). */
export function profileHref(mode: "player" | "organizer" | "coach" | "creator" | "sponsor" | "admin", game = "efootball"): string {
  if (mode === "sponsor") return "/dashboard/sponsor/profile";
  if (mode === "creator") return "/dashboard/creator/profile";
  if (mode === "organizer") return "/dashboard/organizer/profile";
  if (mode === "coach") return "/dashboard/coach/profile";
  if (mode === "admin") return "/dashboard/admin";
  return `/dashboard/${game}/profile`;
}
