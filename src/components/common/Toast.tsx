"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export type ToastVariant = "error" | "warning" | "success" | "info";

export interface ToastMessage {
  id: string;
  message: string;
  variant: ToastVariant;
  /** Bold first line (notifications). */
  title?: string;
  /** Clicking the toast opens this page. */
  link?: string | null;
  /** How long it stays (paused while hovered). */
  durationMs?: number;
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
    glow: "shadow-[0_4px_20px_rgba(255,84,112,0.22)]",
  },
  warning: {
    border: "border-[var(--warning)]/40",
    icon: "bg-[var(--warning-soft)] text-[var(--warning-ink)]",
    glow: "shadow-[0_4px_20px_rgba(224,168,60,0.22)]",
  },
  success: {
    border: "border-[var(--success)]/40",
    icon: "bg-[var(--success-soft)] text-[var(--success-ink)]",
    glow: "shadow-[0_4px_20px_rgba(63,191,127,0.22)]",
  },
  info: {
    border: "border-[var(--accent)]/40",
    icon: "bg-[var(--accent-soft)] text-[var(--accent-ink)]",
    glow: "shadow-[0_4px_20px_rgba(217,165,68,0.22)]",
  },
};

export function ToastItem({ toast, onDismiss }: ToastItemProps) {
  const styles = VARIANT_STYLES[toast.variant];
  const router = useRouter();
  // Hovering pauses the countdown so a long message can be read in full.
  const [paused, setPaused] = useState(false);
  const durationMs = toast.durationMs ?? 4000;
  const link = toast.link;

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
      className={`relative flex items-start gap-3 rounded-xl border bg-[var(--surface)] px-4 py-3.5 pr-10 ${styles.border} ${styles.glow} overflow-hidden ${
        link ? "cursor-pointer transition-colors hover:bg-[var(--surface-raised)]" : ""
      }`}
      style={{
        animation: "toastSlideInRight 0.35s cubic-bezier(0.16, 1, 0.3, 1) both",
        backdropFilter: "blur(12px)",
        minWidth: "280px",
        maxWidth: "380px",
        pointerEvents: "auto",
      }}
      role="alert"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onClick={
        link
          ? () => {
              onDismiss(toast.id);
              router.push(link);
            }
          : undefined
      }
    >
      {/* Icon */}
      <span
        className={`mt-0.5 flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full text-[10px] font-black ${styles.icon}`}
      >
        {ICONS[toast.variant]}
      </span>

      {/* Message (the full text is always in the notifications list) */}
      <div className="min-w-0 flex-1">
        {toast.title ? <p className="text-sm font-bold leading-snug text-[var(--ink)]">{toast.title}</p> : null}
        <p
          className={`text-sm leading-snug ${
            toast.title ? "mt-0.5 line-clamp-3 font-normal text-[var(--ink-soft)]" : "font-medium text-[var(--ink)]"
          }`}
        >
          {toast.message}
        </p>
      </div>

      {/* Dismiss button */}
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          onDismiss(toast.id);
        }}
        aria-label="Dismiss"
        className="absolute right-2.5 top-2.5 flex h-5 w-5 items-center justify-center rounded-md text-[var(--ink-faint)] transition-colors hover:bg-[var(--surface-line)] hover:text-[var(--ink)]"
      >
        <svg viewBox="0 0 12 12" width="10" height="10" fill="currentColor">
          <path d="M1 1l10 10M11 1L1 11" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" fill="none" />
        </svg>
      </button>

      {/* Countdown bar: dismisses the toast when it runs out; hovering pauses it */}
      <div
        className="absolute bottom-0 left-0 h-[2px] w-full rounded-full"
        style={{
          backgroundColor: progressColor,
          animation: `toastCountdown ${durationMs}ms linear forwards`,
          animationPlayState: paused ? "paused" : "running",
        }}
        onAnimationEnd={() => onDismiss(toast.id)}
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
        @keyframes toastCountdown {
          from { width: 100%; }
          to { width: 0%; }
        }
        @keyframes toastSlideInRight {
          from {
            opacity: 0;
            transform: translateX(40px) scale(0.95);
          }
          to {
            opacity: 1;
            transform: translateX(0) scale(1);
          }
        }
      `}</style>
      <div
        role="region"
        aria-label="Notifications"
        style={{
          position: "fixed",
          top: "20px",
          right: "20px",
          zIndex: 9999,
          display: "flex",
          flexDirection: "column",
          alignItems: "flex-end",
          gap: "10px",
          pointerEvents: "none",
          maxWidth: "calc(100vw - 32px)",
        }}
      >
        {toasts.map((t) => (
          <ToastItem key={t.id} toast={t} onDismiss={onDismiss} />
        ))}
      </div>
    </>
  );
}
