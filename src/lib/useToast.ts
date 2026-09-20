"use client";

import { useState, useCallback } from "react";
import type { ToastMessage, ToastVariant } from "@/components/common/Toast";

export function useToast() {
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const toast = useCallback(
    (message: string, variant: ToastVariant = "info") => {
      const id = `${Date.now()}-${Math.random().toString(36).slice(2)}`;
      setToasts((prev) => [...prev, { id, message, variant }]);

      // Auto-dismiss after 4s
      setTimeout(() => {
        setToasts((prev) => prev.filter((t) => t.id !== id));
      }, 4000);
    },
    [],
  );

  const dismiss = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  return { toasts, toast, dismiss };
}
