"use client";

import { useMemo, useState } from "react";
import { Avatar } from "@/components/common/Avatar";
import { CloseIcon, SearchIcon, SwapIcon, ShieldIcon } from "@/components/icons";
import { useSession } from "@/lib/session/SessionContext";
import { useTransferClubPresident } from "@/lib/api/hooks/useClubs";
import { useTransferCommunityPresident } from "@/lib/api/hooks/useCommunities";
import { isApiError } from "@/lib/api/axios";
import type { Person } from "@/lib/mock/types";

export interface TransferAuthorityModalProps {
  open: boolean;
  onClose: () => void;
  entityType: "club" | "community";
  entityId: string;
  entityName: string;
  members: Person[];
  onSuccess?: () => void;
}

export function TransferAuthorityModal({
  open,
  onClose,
  entityType,
  entityId,
  entityName,
  members,
  onSuccess,
}: TransferAuthorityModalProps) {
  const { user, setClub, setCommunity } = useSession();
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [search, setSearch] = useState<string>("");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  const transferClubPresident = useTransferClubPresident(entityId);
  const transferCommunityPresident = useTransferCommunityPresident(entityId);

  const isClub = entityType === "club";
  const userRole = isClub ? user.club?.role : user.community?.role;
  const isPresident = userRole === "President";
  const roleTitle = isPresident ? "President" : "General Secretary";

  // Filter out the current user and candidates who already hold this role
  const eligibleMembers = useMemo(() => {
    return members.filter((m) => {
      // Exclude self
      if (m.id === user.personId) return false;

      // Exclude members already holding this executive role
      if (isClub) {
        if (isPresident && m.clubRole === "President") return false;
        if (!isPresident && m.clubRole === "General Secretary") return false;
      } else {
        if (isPresident && m.communityRole === "President") return false;
        if (!isPresident && (m.communityRole === "General Secretary" || m.communityRole === "Vice President")) return false;
      }

      if (search.trim()) {
        const q = search.toLowerCase().trim();
        const matchesName = m.name.toLowerCase().includes(q);
        const matchesInGame = m.inGameId?.toLowerCase().includes(q);
        return matchesName || matchesInGame;
      }
      return true;
    });
  }, [members, user.personId, isClub, isPresident, search]);

  const selectedCandidate = useMemo(
    () => members.find((m) => m.id === selectedId),
    [members, selectedId]
  );

  if (!open) return null;

  const handleTransfer = async () => {
    if (!selectedCandidate) return;

    setIsSubmitting(true);
    setErrorMessage(null);

    try {
      if (isClub) {
        await transferClubPresident.mutateAsync({
          targetUserId: selectedCandidate.id,
          targetProfileId: selectedCandidate.id,
        });
        setClub({ id: entityId, name: entityName, role: "Player" });
      } else {
        await transferCommunityPresident.mutateAsync({
          targetUserId: selectedCandidate.id,
          targetProfileId: selectedCandidate.id,
        });
        setCommunity({ id: entityId, name: entityName, role: "Member" });
      }

      setIsSubmitting(false);
      onSuccess?.();
      onClose();
    } catch (err) {
      setIsSubmitting(false);
      setErrorMessage(
        isApiError(err)
          ? err.message
          : (err as Error)?.message || "Failed to transfer authority. Please try again."
      );
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/70 backdrop-blur-sm transition-opacity"
        onClick={!isSubmitting ? onClose : undefined}
      />

      {/* Modal Dialog */}
      <div className="relative z-10 w-full max-w-lg rounded-2xl border border-surface-line bg-surface p-0 shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-surface-line px-6 py-4">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-warning-soft text-warning-ink border border-warning/30">
              <SwapIcon className="h-5 w-5" />
            </div>
            <div>
              <h3 className="font-display text-base font-bold text-ink">
                {isPresident
                  ? (isClub ? "Transfer Club Presidency" : "Transfer Community Presidency")
                  : (isClub ? "Transfer General Secretary Authority" : "Transfer Executive GS Authority")}
              </h3>
              <p className="text-xs text-ink-faint">{entityName}</p>
            </div>
          </div>
          <button
            type="button"
            disabled={isSubmitting}
            onClick={onClose}
            className="rounded-lg p-1.5 text-ink-faint transition hover:bg-surface-elevated hover:text-ink disabled:opacity-40"
          >
            <CloseIcon className="h-5 w-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="space-y-4 px-6 py-4">
          {/* Executive Authority Guidance Notice */}
          <div className="rounded-xl border border-warning/30 bg-warning/10 p-3.5 text-xs text-warning-ink">
            <div className="flex items-start gap-2.5">
              <ShieldIcon className="mt-0.5 h-4 w-4 shrink-0 text-warning-ink" />
              <div className="space-y-1">
                <p className="font-semibold">{roleTitle} Handover Required</p>
                <p className="opacity-90 leading-relaxed text-[11px]">
                  As <span className="font-bold text-ink">{roleTitle}</span> of{" "}
                  <span className="font-bold text-ink">{entityName}</span>, authority handover is required before leaving. Select an eligible member to appoint to your role. Once confirmed, you will step down to a regular {isClub ? "Player" : "Member"} and be permitted to leave.
                </p>
              </div>
            </div>
          </div>

          {/* Search bar */}
          <div>
            <div className="mb-2 flex items-center justify-between">
              <label className="text-xs font-semibold text-ink">
                Select Appointee for {roleTitle} <span className="text-accent">*</span>
              </label>
              <span className="text-[11px] text-ink-faint">
                {eligibleMembers.length} eligible {eligibleMembers.length === 1 ? "member" : "members"}
              </span>
            </div>
            <div className="relative">
              <SearchIcon className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-faint" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search member by name or IGN..."
                className="w-full rounded-xl border border-surface-line bg-bg py-2 pl-9 pr-3 text-xs text-ink placeholder-ink-faint outline-none transition focus:border-accent"
              />
            </div>
          </div>

          {/* Candidates List */}
          <div className="space-y-1.5 max-h-56 overflow-y-auto pr-1">
            {eligibleMembers.length === 0 ? (
              <div className="rounded-xl border border-dashed border-surface-line py-8 text-center text-xs text-ink-faint">
                {search.trim()
                  ? "No eligible members match your search."
                  : `No eligible members in ${entityName} available for authority handover.`}
              </div>
            ) : (
              eligibleMembers.map((member) => {
                const isSelected = selectedId === member.id;
                const role = isClub ? (member.clubRole ?? "Player") : (member.communityRole ?? "Member");

                return (
                  <button
                    key={member.id}
                    type="button"
                    disabled={isSubmitting}
                    onClick={() => setSelectedId(member.id)}
                    className={`flex w-full items-center justify-between rounded-xl border p-3 text-left transition-all ${
                      isSelected
                        ? "border-accent bg-accent/10 shadow-[0_0_15px_rgba(217,165,68,0.15)]"
                        : "border-surface-line bg-surface/30 hover:border-surface-line-strong hover:bg-surface/60"
                    }`}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <Avatar dpUrl={member.dpUrl} name={member.name} size="sm" mode="static" />
                      <div className="min-w-0">
                        <div className="truncate text-xs font-semibold text-ink">{member.name}</div>
                        <div className="flex items-center gap-2 text-[11px] text-ink-faint">
                          <span>{role}</span>
                          {member.inGameId && <span>· IGN: {member.inGameId}</span>}
                        </div>
                      </div>
                    </div>

                    <div className="shrink-0 pl-2">
                      <div
                        className={`flex h-5 w-5 items-center justify-center rounded-full border transition-colors ${
                          isSelected
                            ? "border-accent bg-accent text-bg"
                            : "border-surface-line-strong bg-transparent"
                        }`}
                      >
                        {isSelected && <div className="h-2 w-2 rounded-full bg-bg" />}
                      </div>
                    </div>
                  </button>
                );
              })
            )}
          </div>

          {/* Selected Preview Notice */}
          {selectedCandidate && (
            <div className="flex items-center justify-between rounded-xl border border-accent/30 bg-accent/5 p-3 text-xs">
              <span className="text-ink-faint">New {roleTitle} Appointee:</span>
              <span className="font-semibold text-accent-ink">
                {selectedCandidate.name} ({isClub ? selectedCandidate.clubRole ?? "Player" : selectedCandidate.communityRole ?? "Member"})
              </span>
            </div>
          )}

          {/* Error Message Alert */}
          {errorMessage && (
            <div className="rounded-xl border border-danger/40 bg-danger-soft p-3 text-xs text-danger-ink">
              {errorMessage}
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-end gap-3 border-t border-surface-line px-6 py-4 bg-surface/30">
          <button
            type="button"
            disabled={isSubmitting}
            onClick={onClose}
            className="rounded-full border border-surface-line-strong px-4 py-2 text-xs font-semibold text-ink-soft transition-colors hover:text-ink disabled:opacity-40"
          >
            Cancel
          </button>
          <button
            type="button"
            disabled={!selectedId || isSubmitting}
            onClick={handleTransfer}
            className="flex items-center gap-2 rounded-full bg-warning px-5 py-2 text-xs font-display font-semibold text-bg shadow-[0_0_18px_rgba(245,158,11,0.3)] transition-all hover:brightness-110 disabled:opacity-40"
          >
            {isSubmitting ? (
              <>
                <div className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-bg border-t-transparent" />
                <span>Handing Over Authority...</span>
              </>
            ) : (
              <>
                <SwapIcon className="h-3.5 w-3.5" />
                <span>Confirm Handover & Step Down</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
