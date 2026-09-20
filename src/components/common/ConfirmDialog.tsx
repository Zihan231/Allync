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

  useEffect(() => {
    if (open) {
      setTimeout(() => cancelRef.current?.focus(), 50);
    }
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onCancel();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [open, onCancel]);

  if (!open) return null;

  const isDanger = variant === "danger";
  const isWarning = variant === "warning";

  const confirmBtnStyle: React.CSSProperties = isDanger
    ? { background: "var(--danger)", color: "#fff" }
    : isWarning
      ? { background: "var(--warning)", color: "var(--bg)" }
      : { background: "var(--accent)", color: "var(--bg)" };

  const iconBg = isDanger
    ? "var(--danger-soft)"
    : isWarning
      ? "var(--warning-soft)"
      : "var(--accent-soft)";

  const iconColor = isDanger
    ? "var(--danger-ink)"
    : isWarning
      ? "var(--warning-ink)"
      : "var(--accent-ink)";

  return (
    <>
      {/* Backdrop */}
      <div
        onClick={onCancel}
        aria-hidden="true"
        style={{
          position: "fixed",
          inset: 0,
          zIndex: 9990,
          background: "rgba(0,0,0,0.6)",
          backdropFilter: "blur(4px)",
          animation: "cfFadeIn 0.2s ease both",
        }}
      />

      {/* Dialog — centered with inline flex on a full-screen wrapper */}
      <div
        style={{
          position: "fixed",
          inset: 0,
          zIndex: 9991,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          pointerEvents: "none",
        }}
      >
        <div
          role="alertdialog"
          aria-modal="true"
          aria-labelledby="confirm-title"
          aria-describedby="confirm-desc"
          style={{
            pointerEvents: "auto",
            width: "100%",
            maxWidth: "380px",
            background: "var(--surface)",
            border: "1px solid var(--surface-line-strong)",
            borderRadius: "1rem",
            padding: "1.5rem",
            boxShadow: "0 25px 60px rgba(0,0,0,0.5)",
            animation: "cfSlideIn 0.25s cubic-bezier(0.16,1,0.3,1) both",
          }}
        >
          {/* Icon */}
          <div
            style={{
              marginBottom: "1rem",
              width: "2.75rem",
              height: "2.75rem",
              borderRadius: "0.75rem",
              background: iconBg,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            {isDanger ? (
              <svg width="20" height="20" viewBox="0 0 20 20" fill={iconColor}>
                <path fillRule="evenodd" d="M8.485 2.495c.673-1.167 2.357-1.167 3.03 0l6.28 10.875c.673 1.167-.17 2.625-1.516 2.625H3.72c-1.347 0-2.189-1.458-1.515-2.625L8.485 2.495zM10 5a.75.75 0 01.75.75v3.5a.75.75 0 01-1.5 0v-3.5A.75.75 0 0110 5zm0 9a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd" />
              </svg>
            ) : (
              <svg width="20" height="20" viewBox="0 0 20 20" fill={iconColor}>
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a.75.75 0 000 1.5h.253a.25.25 0 01.244.304l-.459 2.066A1.75 1.75 0 0010.747 15H11a.75.75 0 000-1.5h-.253a.25.25 0 01-.244-.304l.459-2.066A1.75 1.75 0 009.253 9H9z" clipRule="evenodd" />
              </svg>
            )}
          </div>

          {/* Title */}
          <h2
            id="confirm-title"
            style={{
              fontFamily: "var(--font-display), sans-serif",
              fontSize: "1rem",
              fontWeight: 700,
              color: "var(--ink)",
              margin: 0,
            }}
          >
            {title}
          </h2>

          {/* Message */}
          <p
            id="confirm-desc"
            style={{
              marginTop: "0.375rem",
              fontSize: "0.875rem",
              lineHeight: 1.6,
              color: "var(--ink-soft)",
            }}
          >
            {message}
          </p>

          {/* Actions */}
          <div style={{ marginTop: "1.5rem", display: "flex", gap: "0.75rem" }}>
            <button
              ref={cancelRef}
              type="button"
              onClick={onCancel}
              style={{
                flex: 1,
                padding: "0.625rem 1rem",
                borderRadius: "0.75rem",
                border: "1px solid var(--surface-line-strong)",
                background: "var(--bg-raised)",
                color: "var(--ink)",
                fontSize: "0.875rem",
                fontWeight: 600,
                cursor: "pointer",
              }}
            >
              {cancelLabel}
            </button>
            <button
              type="button"
              onClick={onConfirm}
              style={{
                flex: 1,
                padding: "0.625rem 1rem",
                borderRadius: "0.75rem",
                border: "none",
                fontSize: "0.875rem",
                fontWeight: 700,
                cursor: "pointer",
                ...confirmBtnStyle,
              }}
            >
              {confirmLabel}
            </button>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes cfFadeIn {
          from { opacity: 0; }
          to   { opacity: 1; }
        }
        @keyframes cfSlideIn {
          from { opacity: 0; transform: scale(0.95) translateY(-8px); }
          to   { opacity: 1; transform: scale(1)    translateY(0);     }
        }
      `}</style>
    </>
  );
}