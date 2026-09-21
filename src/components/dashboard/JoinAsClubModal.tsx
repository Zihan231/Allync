"use client";

import { useState } from "react";
import { ClubCrest } from "@/components/common/ClubCrest";
import { CloseIcon, ShieldIcon, UsersIcon } from "@/components/icons";
import { useAddClubToCommunity } from "@/lib/api/hooks/useCommunities";
import { isApiError } from "@/lib/api/axios";

export interface JoinAsClubModalProps {
  open: boolean;
  onClose: () => void;
  community: {
    id: string;
    name: string;
    joinPolicy: "instant" | "approval";
  };
  club: {
    id: string;
    name: string;
    dpUrl?: string | null;
    color?: string;
    initials?: string;
    memberCount?: number;
  };
  userRole: string;
  onSuccess: (status: "joined" | "pending") => void;
}

export function JoinAsClubModal({
  open,
  onClose,
  community,
  club,
  userRole,
  onSuccess,
}: JoinAsClubModalProps) {
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const addClubMutation = useAddClubToCommunity(community.id);

  if (!open) return null;

  const isApproval = community.joinPolicy === "approval";

  const handleConfirm = async () => {
    setErrorMessage(null);
    try {
      const res = await addClubMutation.mutateAsync(club.id);
      const status = res?.status === "pending" || isApproval ? "pending" : "joined";
      onSuccess(status);
      onClose();
    } catch (err: any) {
      const msg = isApiError(err)
        ? err.message
        : (err as Error)?.message || "Failed to join community as club.";
      setErrorMessage(msg);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
      <div className="relative w-full max-w-md rounded-2xl border border-surface-line bg-surface shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-surface-line px-6 py-4">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-accent-soft text-accent-ink border border-accent/30">
              <ShieldIcon className="h-5 w-5" />
            </div>
            <div>
              <h3 className="font-display text-base font-bold text-ink">
                Join Community as Club
              </h3>
              <p className="text-xs text-ink-faint">
                Enroll {club.name} into {community.name}
              </p>
            </div>
          </div>
          <button
            type="button"
            disabled={addClubMutation.isPending}
            onClick={onClose}
            className="rounded-lg p-1.5 text-ink-faint transition hover:bg-surface-elevated hover:text-ink disabled:opacity-40"
          >
            <CloseIcon className="h-5 w-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="space-y-4 px-6 py-4">
          {/* Club Info Card */}
          <div className="flex items-center gap-3.5 rounded-xl border border-surface-line bg-surface-elevated/60 p-3.5">
            <ClubCrest
              name={club.name}
              color={club.color}
              initials={club.initials}
              imageUrl={club.dpUrl}
              size="md"
              shape="square"
            />
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <span className="font-display text-sm font-bold text-ink truncate">
                  {club.name}
                </span>
                <span className="rounded-md bg-accent-soft px-2 py-0.5 text-[10px] font-semibold text-accent-ink">
                  {userRole}
                </span>
              </div>
              <div className="mt-1 flex items-center gap-1.5 font-mono text-[11px] text-ink-faint">
                <UsersIcon className="h-3.5 w-3.5" />
                <span>
                  {club.memberCount !== undefined
                    ? `${club.memberCount} members will join`
                    : "All club members will join"}
                </span>
              </div>
            </div>
          </div>

          {/* Policy Guidance Alert */}
          <div className="rounded-xl border border-accent/30 bg-accent/10 p-3.5 text-xs text-accent-ink">
            <p className="font-semibold">
              {isApproval ? "Community Approval Required" : "Instant Enrollment"}
            </p>
            <p className="mt-1 leading-relaxed text-[11px] opacity-90">
              {isApproval
                ? `This community operates with approval policy. Submitting this request will notify community administrators. Once approved, your club and all its players will become members.`
                : `Your club and all its active players will immediately be enrolled as members of ${community.name}.`}
            </p>
          </div>

          <div className="rounded-xl border border-surface-line bg-surface-elevated/40 p-3 text-[11px] text-ink-soft leading-relaxed">
            <span className="font-semibold text-ink">Important:</span> Club members
            cannot individually leave the community unless the club withdraws or a
            player leaves the club.
          </div>

          {errorMessage && (
            <div className="rounded-xl border border-danger/30 bg-danger/10 p-3 text-xs text-danger-ink">
              {errorMessage}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-2 border-t border-surface-line px-6 py-4 bg-surface-elevated/30">
          <button
            type="button"
            disabled={addClubMutation.isPending}
            onClick={onClose}
            className="rounded-full border border-surface-line-strong px-4 py-2 text-xs font-semibold text-ink transition hover:bg-surface-elevated disabled:opacity-40"
          >
            Cancel
          </button>
          <button
            type="button"
            disabled={addClubMutation.isPending}
            onClick={handleConfirm}
            className="inline-flex items-center justify-center gap-1.5 rounded-full bg-accent px-5 py-2 font-display text-xs font-semibold text-bg transition hover:opacity-90 disabled:opacity-40 shadow-sm"
          >
            {addClubMutation.isPending ? (
              <>
                <svg
                  className="h-3.5 w-3.5 animate-spin"
                  viewBox="0 0 24 24"
                  fill="none"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  />
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"
                  />
                </svg>
                <span>Processing...</span>
              </>
            ) : isApproval ? (
              "Submit Join Request"
            ) : (
              "Join Community as Club"
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
