import { useClubTransfers, useMyTransfers } from "@/lib/api/hooks/useTransfers";
import { useSession } from "@/lib/session/SessionContext";

/** The club the viewer leads (President / General Secretary), with its available balance. */
export function useCoachingLeader() {
  const { isAuthenticated } = useSession();
  const { data: mine } = useMyTransfers(isAuthenticated);
  const leads = mine?.clubId && (mine.clubRole === "President" || mine.clubRole === "General Secretary") ? mine.clubId : undefined;
  const { data: club } = useClubTransfers(leads);
  return {
    clubId: leads ?? null,
    clubName: mine?.clubName ?? null,
    balanceTk: club?.wallet?.balanceTk ?? null,
  };
}
