"use client";

import { useEffect } from "react";
import { CloseIcon } from "@/components/icons";

export function FilterModal({
  open,
  title,
  onClose,
  onApply,
  onReset,
  applyLabel,
  resetLabel,
  children,
}: {
  open: boolean;
  title: string;
  onClose: () => void;
  onApply: () => void;
  onReset: () => void;
  applyLabel: string;
  resetLabel: string;
  children: React.ReactNode;
}) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/60 p-4 pt-[8vh] backdrop-blur-sm sm:items-center sm:pt-4">
      <button
        type="button"
        aria-label="Close"
        onClick={onClose}
        className="fixed inset-0 cursor-default"
        tabIndex={-1}
      />
      <div className="relative w-full max-w-md rounded-2xl border border-surface-line bg-bg-raised shadow-[0_30px_80px_-30px_rgba(0,0,0,0.7)]">
        <div className="flex items-center justify-between border-b border-surface-line px-5 py-4">
          <h3 className="font-display text-base font-bold text-ink">{title}</h3>
          <button
            type="button"
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-full text-ink-faint transition-colors hover:bg-surface-line/60 hover:text-ink"
          >
            <CloseIcon className="h-4 w-4" />
          </button>
        </div>

        <div className="max-h-[60vh] space-y-5 overflow-y-auto px-5 py-5">{children}</div>

        <div className="flex gap-3 border-t border-surface-line px-5 py-4">
          <button
            type="button"
            onClick={onReset}
            className="flex-1 rounded-full border border-surface-line-strong px-4 py-2.5 text-sm font-medium text-ink-soft transition-colors hover:text-ink"
          >
            {resetLabel}
          </button>
          <button
            type="button"
            onClick={onApply}
            className="flex-1 rounded-full bg-accent px-4 py-2.5 text-sm font-display font-semibold text-bg shadow-[0_0_20px_rgba(217,165,68,0.3)] transition-transform hover:-translate-y-0.5"
          >
            {applyLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
