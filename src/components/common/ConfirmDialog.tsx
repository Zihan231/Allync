"use client";

import { useEffect, useRef } from "react";

export interface ConfirmDialogProps {
  open: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: "danger" | "warning" | "info" | "success" | "default";
  onConfirm: () => void;
  onCancel: () => void;
}

export function ConfirmDialog({
  open,
  title,
  message,
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
  variant = "warning",
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  const cancelRef = useRef<HTMLButtonElement>(null);

  // Focus cancel button on open for keyboard accessibility
  useEffect(() => {
    if (open) {
      setTimeout(() => cancelRef.current?.focus(), 50);
    }
  }, [open]);

  // Close on Escape
  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onCancel();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [open, onCancel]);

  if (!open) return null;

  const confirmBg =
    variant === "danger"
      ? "bg-[var(--danger)] hover:brightness-110 text-white"
      : "bg-[var(--warning)] hover:brightness-110 text-[var(--bg)]";

  const iconColor = variant === "danger" ? "text-[var(--danger-ink)]" : "text-[var(--warning-ink)]";
  const iconBg = variant === "danger" ? "bg-[var(--danger-soft)]" : "bg-[var(--warning-soft)]";

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-[9990] bg-black/60 backdrop-blur-sm"
        onClick={onCancel}
        aria-hidden="true"
        style={{ animation: "confirmFadeIn 0.2s ease both" }}
      />

      {/* Dialog */}
      <div
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="confirm-title"
        aria-describedby="confirm-desc"
        className="fixed left-1/2 top-1/2 z-[9991] w-full max-w-sm -translate-x-1/2 -translate-y-1/2 rounded-2xl border border-[var(--surface-line-strong)] bg-[var(--surface)] p-6 shadow-2xl"
        style={{ animation: "confirmSlideIn 0.25s cubic-bezier(0.16,1,0.3,1) both" }}
      >
        {/* Icon */}
        <div className={`mb-4 flex h-11 w-11 items-center justify-center rounded-xl ${iconBg}`}>
          {variant === "danger" ? (
            <svg className={`h-5 w-5 ${iconColor}`} viewBox="0 0 20 20" fill="currentColor">
              <path
                fillRule="evenodd"
                d="M8.485 2.495c.673-1.167 2.357-1.167 3.03 0l6.28 10.875c.673 1.167-.17 2.625-1.516 2.625H3.72c-1.347 0-2.189-1.458-1.515-2.625L8.485 2.495zM10 5a.75.75 0 01.75.75v3.5a.75.75 0 01-1.5 0v-3.5A.75.75 0 0110 5zm0 9a1 1 0 100-2 1 1 0 000 2z"
                clipRule="evenodd"
              />
            </svg>
          ) : (
            <svg className={`h-5 w-5 ${iconColor}`} viewBox="0 0 20 20" fill="currentColor">
              <path
                fillRule="evenodd"
                d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a.75.75 0 000 1.5h.253a.25.25 0 01.244.304l-.459 2.066A1.75 1.75 0 0010.747 15H11a.75.75 0 000-1.5h-.253a.25.25 0 01-.244-.304l.459-2.066A1.75 1.75 0 009.253 9H9z"
                clipRule="evenodd"
              />
            </svg>
          )}
        </div>

        {/* Title */}
        <h2 id="confirm-title" className="font-display text-base font-bold text-[var(--ink)]">
          {title}
        </h2>

        {/* Message */}
        <p id="confirm-desc" className="mt-1.5 text-sm leading-relaxed text-[var(--ink-soft)]">
          {message}
        </p>

        {/* Actions */}
        <div className="mt-6 flex gap-3">
          <button
            ref={cancelRef}
            type="button"
            onClick={onCancel}
            className="flex-1 rounded-xl border border-[var(--surface-line-strong)] bg-[var(--bg-raised)] py-2.5 text-sm font-semibold text-[var(--ink)] transition-colors hover:bg-[var(--surface-line)]"
          >
            {cancelLabel}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className={`flex-1 rounded-xl py-2.5 text-sm font-bold transition-all ${confirmBg}`}
          >
            {confirmLabel}
          </button>
        </div>
      </div>

      <style>{`
        @keyframes confirmFadeIn {
          from { opacity: 0; }
          to   { opacity: 1; }
        }
        @keyframes confirmSlideIn {
          from { opacity: 0; transform: translate(-50%, -48%) scale(0.96); }
          to   { opacity: 1; transform: translate(-50%, -50%) scale(1); }
        }
      `}</style>
    </>
  );
}