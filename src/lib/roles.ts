import { BallIcon, ChartIcon, FlameIcon, ShieldIcon, SpikeIcon, TrophyIcon, WalletIcon } from "@/components/icons";
import type { UserRole } from "@/lib/session/SessionContext";

/** The top-level choices on the role picker. */
export const ROLE_ORDER: UserRole[] = ["player", "organizer", "sponsor", "esports_professional"];

/** What an esports professional can be; picked under Esports Professional. */
export const ESPORTS_PRO_SUBROLES: UserRole[] = ["creative", "social", "coach"];

/** Icon and colour of each role in the picker and on the profile. */
export const ROLE_META: Record<UserRole, { icon: typeof BallIcon; color: string }> = {
  player: { icon: BallIcon, color: "#22c55e" },
  organizer: { icon: TrophyIcon, color: "#f59e0b" },
  sponsor: { icon: WalletIcon, color: "#a855f7" },
  esports_professional: { icon: ShieldIcon, color: "#06b6d4" },
  coach: { icon: ChartIcon, color: "#3b82f6" },
  creative: { icon: SpikeIcon, color: "#ec4899" },
  social: { icon: FlameIcon, color: "#f97316" },
};

/**
 * Roles to save from a picker selection: sub-roles only count under Esports Professional,
 * which is dropped if none is left. The default is the first pick that has its own area
 * (Esports Professional itself has none, so a sub-role is the default).
 */
export function rolesToSave(picked: UserRole[]): { roles: UserRole[]; primaryRole: UserRole } | null {
  const isSub = (r: UserRole) => ESPORTS_PRO_SUBROLES.includes(r);
  const hasPro = picked.includes("esports_professional");
  const roles = picked.filter((r) => (isSub(r) ? hasPro : true));
  if (hasPro && !roles.some(isSub)) return null;
  const primaryRole = roles.find((r) => r !== "esports_professional");
  return primaryRole ? { roles, primaryRole } : null;
}

/** Roles with their own area today; the others show a coming-soon page. */
export const LIVE_ROLES: UserRole[] = ["player", "organizer", "coach", "creative", "sponsor"];

/**
 * Where the dashboard opens for a role. Esports Professional is only a group with no area
 * of its own, so it opens the first of the user's `roles` that has one (else the player area).
 */
export function homeForRole(role: UserRole, game = "efootball", roles: UserRole[] = []): string {
  if (role === "esports_professional") {
    const sub = ESPORTS_PRO_SUBROLES.find((r) => LIVE_ROLES.includes(r) && roles.includes(r));
    return homeForRole(sub ?? "player", game, roles);
  }
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
