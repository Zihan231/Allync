import { usePathname } from "next/navigation";
import { useSession, type Mode } from "@/lib/session/SessionContext";

/**
 * The dashboard mode right now: the organizer, coach and admin areas set it by their
 * address; shared pages (wallet, tournaments, ...) keep the mode the user last switched to.
 */
export function useCurrentMode(): Mode {
  const { user } = useSession();
  const pathname = usePathname();
  if (user.systemRole && pathname.startsWith("/dashboard/admin")) return "admin";
  if (pathname.startsWith("/dashboard/organizer")) return "organizer";
  if (pathname.startsWith("/dashboard/coach")) return "coach";
  if (pathname.startsWith("/dashboard/creator")) return "creator";
  if (pathname.startsWith("/dashboard/sponsor")) return "sponsor";
  if (user.mode === "coach" && !user.roles.includes("coach")) return "player";
  if (user.mode === "organizer" && !user.roles.includes("organizer")) return "player";
  if (user.mode === "creator" && !user.roles.includes("creative")) return "player";
  if (user.mode === "sponsor" && !user.roles.includes("sponsor")) return "player";
  if (user.mode === "admin" && !user.systemRole) return "player";
  return user.mode;
}
