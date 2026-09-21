"use client";

import { CloseIcon, TrashIcon, ShieldIcon } from "@/components/icons";

export interface WithdrawClubModalProps {
  open: boolean;
  onClose: () => void;
  communityName: string;
  clubName: string;
  onConfirm: () => Promise<void>;
  isPending: boolean;
}

export function WithdrawClubModal({
  open,
  onClose,
  communityName,
  clubName,
  onConfirm,
  isPending,
}: WithdrawClubModalProps) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
      <div className="relative w-full max-w-md rounded-2xl border border-surface-line bg-surface shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-surface-line px-6 py-4">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-danger-soft text-danger-ink border border-danger/30">
              <TrashIcon className="h-5 w-5" />
            </div>
            <div>
              <h3 className="font-display text-base font-bold text-ink">
                Withdraw Club from Community
              </h3>
              <p className="text-xs text-ink-faint">{communityName}</p>
            </div>
          </div>
          <button
            type="button"
            disabled={isPending}
            onClick={onClose}
            className="rounded-lg p-1.5 text-ink-faint transition hover:bg-surface-elevated hover:text-ink disabled:opacity-40"
          >
            <CloseIcon className="h-5 w-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="space-y-4 px-6 py-4">
          <div className="rounded-xl border border-danger/30 bg-danger/10 p-3.5 text-xs text-danger-ink">
            <div className="flex items-start gap-2.5">
              <ShieldIcon className="mt-0.5 h-4 w-4 shrink-0 text-danger-ink" />
              <div className="space-y-1">
                <p className="font-semibold">All Club Members Will Leave</p>
                <p className="leading-relaxed text-[11px] opacity-90">
                  Withdrawing <span className="font-bold text-ink">{clubName}</span> will remove your club and all of its players from <span className="font-bold text-ink">{communityName}</span> immediately.
                </p>
              </div>
            </div>
          </div>

          <p className="text-xs text-ink-soft">
            Are you sure you want to proceed? Only the Club President or General Secretary can withdraw the club.
          </p>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-2 border-t border-surface-line px-6 py-4 bg-surface-elevated/30">
          <button
            type="button"
            disabled={isPending}
            onClick={onClose}
            className="rounded-full border border-surface-line-strong px-4 py-2 text-xs font-semibold text-ink transition hover:bg-surface-elevated disabled:opacity-40"
          >
            Cancel
          </button>
          <button
            type="button"
            disabled={isPending}
            onClick={onConfirm}
            className="inline-flex items-center justify-center gap-1.5 rounded-full bg-danger px-5 py-2 font-display text-xs font-semibold text-white transition hover:bg-danger/90 disabled:opacity-40 shadow-sm"
          >
            {isPending ? (
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
                <span>Withdrawing...</span>
              </>
            ) : (
              "Confirm Withdrawal"
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
