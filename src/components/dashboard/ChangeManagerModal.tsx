"use client";

import { useEffect, useMemo, useState } from "react";
import { Avatar } from "@/components/common/Avatar";
import { CloseIcon, SearchIcon, SwapIcon, ShieldIcon } from "@/components/icons";
import { useClubManager, useChangeClubManager, useTransferClubManager } from "@/lib/api/hooks/useClubs";
import { useSession } from "@/lib/session/SessionContext";
import type { Person } from "@/lib/mock/types";

export interface ChangeManagerModalProps {
  open: boolean;
  onClose: () => void;
  clubId: string;
  clubName: string;
  members: Person[];
  isManagerSelfTransfer: boolean;
}

export function ChangeManagerModal({
  open,
  onClose,
  clubId,
  clubName,
  members,
  isManagerSelfTransfer,
}: ChangeManagerModalProps) {
  const { user, setClub, refreshSession } = useSession();
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [search, setSearch] = useState<string>("");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const { data: managerData, isLoading: isLoadingManager } = useClubManager(clubId);
  const changeMutation = useChangeClubManager(clubId);
  const transferMutation = useTransferClubManager(clubId);

  const isSubmitting = changeMutation.isPending || transferMutation.isPending;

  // Resolve current manager: supports both direct profile and wrapped object
  const currentManager = useMemo(() => {
    if (managerData) {
      const uId = (managerData as any).userId || (managerData as any).manager?.userId;
      const uName = (managerData as any).user?.name || (managerData as any).manager?.name;
      const inGame = (managerData as any).user?.inGameId || (managerData as any).manager?.inGameId;
      if (uId) {
        const match = members.find((m) => m.id === uId);
        return {
          id: uId,
          name: uName || match?.name || "Manager",
          inGameId: inGame || match?.inGameId || null,
          dpUrl: match?.dpUrl ?? null,
        };
      }
    }
    const fromMock = members.find((m) => m.clubRole === "Manager");
    if (fromMock) {
      return {
        id: fromMock.id,
        name: fromMock.name,
        inGameId: fromMock.inGameId ?? null,
        dpUrl: fromMock.dpUrl,
      };
    }
    return null;
  }, [managerData, members]);

  // Exclude current manager and President from eligible candidates
  const eligibleMembers = useMemo(() => {
    return members.filter((m) => {
      if (currentManager && m.id === currentManager.id) return false;
      if (m.clubRole === "Manager") return false;
      if (m.clubRole === "President") return false;

      if (search.trim()) {
        const q = search.toLowerCase().trim();
        const matchesName = m.name.toLowerCase().includes(q);
        const matchesInGame = m.inGameId?.toLowerCase().includes(q);
        return matchesName || matchesInGame;
      }
      return true;
    });
  }, [members, currentManager, search]);

  const selectedCandidate = useMemo(() => {
    return members.find((m) => m.id === selectedId) ?? null;
  }, [members, selectedId]);

  // Keyboard accessibility: Escape to close
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !isSubmitting) onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose, isSubmitting]);

  // Reset local state when modal opens
  useEffect(() => {
    if (open) {
      setSelectedId(null);
      setSearch("");
      setErrorMessage(null);
      setSuccessMessage(null);
    }
  }, [open]);

  if (!open) return null;

  const handleSubmit = async () => {
    if (!selectedId || isSubmitting) return;
    setErrorMessage(null);
    setSuccessMessage(null);

    try {
      let res;
      if (isManagerSelfTransfer) {
        res = await transferMutation.mutateAsync({ targetUserId: selectedId });
      } else {
        res = await changeMutation.mutateAsync({ targetUserId: selectedId });
      }

      // If manager stepped down, update local session state immediately
      if (isManagerSelfTransfer && user.club?.id === clubId) {
        setClub({ ...user.club, role: "Player" });
      }

      await refreshSession().catch(() => {});
      setSuccessMessage(res.message || "Manager updated successfully!");

      setTimeout(() => {
        onClose();
      }, 1200);
    } catch (err: any) {
      setErrorMessage(err?.message || "Failed to update manager. Please try again.");
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/70 p-4 pt-[6vh] backdrop-blur-md sm:items-center sm:pt-4">
      <button
        type="button"
        aria-label="Close"
        disabled={isSubmitting}
        onClick={onClose}
        className="fixed inset-0 cursor-default"
        tabIndex={-1}
      />

      <div className="relative w-full max-w-lg rounded-2xl border border-surface-line bg-bg-raised shadow-[0_30px_90px_-20px_rgba(0,0,0,0.85)]">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-surface-line px-6 py-4">
          <div className="flex items-center gap-3">
            <div
              className={`flex h-9 w-9 items-center justify-center rounded-xl ${
                isManagerSelfTransfer
                  ? "bg-warning/15 text-warning-ink border border-warning/30"
                  : "bg-accent/15 text-accent-ink border border-accent/30"
              }`}
            >
              <SwapIcon className="h-5 w-5" />
            </div>
            <div>
              <h3 className="font-display text-base font-bold text-ink">
                {isManagerSelfTransfer ? "Hand Over Manager Role" : "Change Club Manager"}
              </h3>
              <p className="text-xs text-ink-faint">{clubName}</p>
            </div>
          </div>

          <button
            type="button"
            disabled={isSubmitting}
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-full text-ink-faint transition-colors hover:bg-surface-line/60 hover:text-ink disabled:opacity-40"
          >
            <CloseIcon className="h-4 w-4" />
          </button>
        </div>

        <div className="max-h-[70vh] space-y-5 overflow-y-auto px-6 py-5">
          {/* Informational Callout */}
          {isManagerSelfTransfer ? (
            <div className="rounded-xl border border-warning/30 bg-warning/10 p-3.5 text-xs text-warning-ink">
              <div className="flex items-start gap-2.5">
                <ShieldIcon className="mt-0.5 h-4 w-4 shrink-0" />
                <div className="space-y-1">
                  <p className="font-semibold">Manager Handover Notice</p>
                  <p className="opacity-90 leading-relaxed">
                    You are handing over manager authority to another member. You will automatically step down to a
                    regular <span className="font-semibold text-ink">Player</span> in this club.
                  </p>
                </div>
              </div>
            </div>
          ) : (
            <div className="rounded-xl border border-accent/30 bg-accent/10 p-3.5 text-xs text-accent-ink">
              <div className="flex items-start gap-2.5">
                <ShieldIcon className="mt-0.5 h-4 w-4 shrink-0" />
                <div className="space-y-1">
                  <p className="font-semibold">Executive Club Action</p>
                  <p className="opacity-90 leading-relaxed">
                    As President / General Secretary, you can appoint any eligible club member as Manager. The previous
                    manager will automatically be demoted to Player.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Current Manager Banner */}
          <div className="rounded-xl border border-surface-line bg-surface/40 p-3.5">
            <div className="text-[11px] font-semibold uppercase tracking-wider text-ink-faint">
              Current Manager
            </div>
            <div className="mt-2 flex items-center justify-between">
              {isLoadingManager ? (
                <div className="text-xs text-ink-faint animate-pulse">Loading manager details...</div>
              ) : currentManager ? (
                <div className="flex items-center gap-3">
                  <Avatar dpUrl={currentManager.dpUrl} name={currentManager.name} size="sm" mode="static" />
                  <div>
                    <div className="text-sm font-semibold text-ink">{currentManager.name}</div>
                    {currentManager.inGameId && (
                      <div className="text-xs text-ink-faint">IGN: {currentManager.inGameId}</div>
                    )}
                  </div>
                </div>
              ) : (
                <span className="text-xs italic text-ink-faint">No manager currently assigned</span>
              )}
              <span className="rounded-full border border-surface-line-strong bg-bg-raised px-2.5 py-0.5 text-[11px] font-medium text-ink-soft">
                Active
              </span>
            </div>
          </div>

          {/* Search bar */}
          <div>
            <div className="mb-2 flex items-center justify-between">
              <label className="text-xs font-semibold text-ink">
                Select New Manager <span className="text-accent">*</span>
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
                placeholder="Search by member name or IGN..."
                className="w-full rounded-xl border border-surface-line bg-bg py-2 pl-9 pr-3 text-xs text-ink placeholder-ink-faint outline-none transition focus:border-accent"
              />
            </div>
          </div>

          {/* Candidates List */}
          <div className="space-y-1.5 max-h-56 overflow-y-auto pr-1">
            {eligibleMembers.length === 0 ? (
              <div className="rounded-xl border border-dashed border-surface-line py-8 text-center text-xs text-ink-faint">
                {search.trim() ? "No eligible members match your search." : "No eligible members available to appoint."}
              </div>
            ) : (
              eligibleMembers.map((member) => {
                const isSelected = selectedId === member.id;
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
                          <span>{member.clubRole ?? "Player"}</span>
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
                        {isSelected && (
                          <div className="h-2 w-2 rounded-full bg-bg" />
                        )}
                      </div>
                    </div>
                  </button>
                );
              })
            )}
          </div>

          {/* Selected Preview Notice */}
          {selectedCandidate && (
            <div className="flex items-center justify-between rounded-xl border border-surface-line bg-bg-raised p-3 text-xs">
              <span className="text-ink-faint">Target Appointee:</span>
              <span className="font-semibold text-accent-ink">
                {selectedCandidate.name} ({selectedCandidate.clubRole ?? "Player"})
              </span>
            </div>
          )}

          {/* Error Message Alert */}
          {errorMessage && (
            <div className="rounded-xl border border-danger/40 bg-danger-soft p-3 text-xs text-danger-ink">
              {errorMessage}
            </div>
          )}

          {/* Success Message Alert */}
          {successMessage && (
            <div className="rounded-xl border border-success/40 bg-success-soft p-3 text-xs text-success-ink font-medium">
              ✓ {successMessage}
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-end gap-3 border-t border-surface-line px-6 py-4">
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
            disabled={!selectedId || isSubmitting || !!successMessage}
            onClick={handleSubmit}
            className={`flex items-center gap-2 rounded-full px-5 py-2 text-xs font-display font-semibold transition-all disabled:opacity-40 ${
              isManagerSelfTransfer
                ? "bg-warning text-bg shadow-[0_0_18px_rgba(245,158,11,0.3)] hover:brightness-110"
                : "bg-accent text-bg shadow-[0_0_18px_rgba(217,165,68,0.3)] hover:brightness-110"
            }`}
          >
            {isSubmitting ? (
              <>
                <div className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-bg border-t-transparent" />
                <span>Processing...</span>
              </>
            ) : isManagerSelfTransfer ? (
              <>
                <SwapIcon className="h-3.5 w-3.5" />
                <span>Confirm Handover & Step Down</span>
              </>
            ) : (
              <>
                <SwapIcon className="h-3.5 w-3.5" />
                <span>Appoint New Manager</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
