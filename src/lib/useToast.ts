"use client";

import { useState, useCallback } from "react";
import type { ToastMessage, ToastVariant } from "@/components/common/Toast";

/** On screen long enough to read: 4s, plus ~45ms per character, up to 10s. */
function readingTimeMs(text: string): number {
  return Math.min(10_000, Math.max(4_000, 4_000 + text.length * 45));
}

export function useToast() {
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const toast = useCallback(
    (message: string, variant: ToastVariant = "info", options: { title?: string; link?: string | null } = {}) => {
      const id = `${Date.now()}-${Math.random().toString(36).slice(2)}`;
      const durationMs = readingTimeMs(`${options.title ?? ""} ${message}`);
      // The toast dismisses itself when its countdown ends (paused while hovered).
      setToasts((prev) => [...prev, { id, message, variant, durationMs, ...options }]);
    },
    [],
  );

  const dismiss = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  return { toasts, toast, dismiss };
}
