"use client";

import { useEffect, useRef } from "react";

export type ToastVariant = "error" | "warning" | "success" | "info";

export interface ToastMessage {
  id: string;
  message: string;
  variant: ToastVariant;
}

interface ToastItemProps {
  toast: ToastMessage;
  onDismiss: (id: string) => void;
}

const ICONS: Record<ToastVariant, string> = {
  error: "✕",
  warning: "⚠",
  success: "✓",
  info: "ℹ",
};

const VARIANT_STYLES: Record<ToastVariant, { border: string; icon: string; glow: string }> = {
  error: {
    border: "border-[var(--danger)]/40",
    icon: "bg-[var(--danger-soft)] text-[var(--danger-ink)]",
    glow: "shadow-[0_0_18px_rgba(255,84,112,0.18)]",
  },
  warning: {
    border: "border-[var(--warning)]/40",
    icon: "bg-[var(--warning-soft)] text-[var(--warning-ink)]",
    glow: "shadow-[0_0_18px_rgba(224,168,60,0.18)]",
  },
  success: {
    border: "border-[var(--success)]/40",
    icon: "bg-[var(--success-soft)] text-[var(--success-ink)]",
    glow: "shadow-[0_0_18px_rgba(63,191,127,0.18)]",
  },
  info: {
    border: "border-[var(--accent)]/40",
    icon: "bg-[var(--accent-soft)] text-[var(--accent-ink)]",
    glow: "shadow-[0_0_18px_rgba(217,165,68,0.18)]",
  },
};

export function ToastItem({ toast, onDismiss }: ToastItemProps) {
  const styles = VARIANT_STYLES[toast.variant];
  const progressRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = progressRef.current;
    if (!el) return;
    el.style.transition = "none";
    el.style.width = "100%";
    void el.offsetWidth;
    el.style.transition = "width 4s linear";
    el.style.width = "0%";
  }, []);

  const progressColor =
    toast.variant === "error"
      ? "var(--danger)"
      : toast.variant === "warning"
        ? "var(--warning)"
        : toast.variant === "success"
          ? "var(--success)"
          : "var(--accent)";

  return (
    <div
      className={`relative flex items-start gap-3 rounded-xl border bg-[var(--surface)] px-4 py-3 pr-10 ${styles.border} ${styles.glow} overflow-hidden`}
      style={{
        animation: "toastSlideIn 0.3s cubic-bezier(0.16, 1, 0.3, 1) both",
        backdropFilter: "blur(12px)",
        minWidth: "280px",
        maxWidth: "360px",
        pointerEvents: "auto",
      }}
      role="alert"
    >
      {/* Icon */}
      <span
        className={`mt-0.5 flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full text-[10px] font-black ${styles.icon}`}
      >
        {ICONS[toast.variant]}
      </span>

      {/* Message */}
      <p className="flex-1 text-sm leading-relaxed text-[var(--ink)]">{toast.message}</p>

      {/* Dismiss button */}
      <button
        type="button"
        onClick={() => onDismiss(toast.id)}
        aria-label="Dismiss"
        className="absolute right-2.5 top-2.5 flex h-5 w-5 items-center justify-center rounded-md text-[var(--ink-faint)] transition-colors hover:bg-[var(--surface-line)] hover:text-[var(--ink)]"
      >
        <svg viewBox="0 0 12 12" width="10" height="10" fill="currentColor">
          <path d="M1 1l10 10M11 1L1 11" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" fill="none" />
        </svg>
      </button>

      {/* Progress bar */}
      <div
        ref={progressRef}
        className="absolute bottom-0 left-0 h-[2px] rounded-full"
        style={{ backgroundColor: progressColor }}
      />
    </div>
  );
}

interface ToastContainerProps {
  toasts: ToastMessage[];
  onDismiss: (id: string) => void;
}

export function ToastContainer({ toasts, onDismiss }: ToastContainerProps) {
  if (toasts.length === 0) return null;

  return (
    <>
      <style>{`
        @keyframes toastSlideIn {
          from { opacity: 0; transform: scale(0.94); }
          to   { opacity: 1; transform: scale(1);    }
        }
      `}</style>
      <div
        role="region"
        aria-label="Notifications"
        style={{
          position: "fixed",
          inset: 0,
          zIndex: 9999,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          gap: "10px",
          pointerEvents: "none",
        }}
      >
        {toasts.map((t) => (
          <ToastItem key={t.id} toast={t} onDismiss={onDismiss} />
        ))}
      </div>
    </>
  );
}