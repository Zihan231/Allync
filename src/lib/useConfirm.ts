"use client";

import { useState, useCallback } from "react";

interface ConfirmState {
  open: boolean;
  title: string;
  message: string;
  confirmLabel: string;
  cancelLabel: string;
  variant: "danger" | "warning";
  resolve: ((confirmed: boolean) => void) | null;
}

const DEFAULT_STATE: ConfirmState = {
  open: false,
  title: "",
  message: "",
  confirmLabel: "Confirm",
  cancelLabel: "Cancel",
  variant: "danger",
  resolve: null,
};

export interface ConfirmOptions {
  title?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: "danger" | "warning";
}

/**
 * Drop-in replacement for window.confirm().
 *
 * Usage:
 *   const { confirm, confirmProps } = useConfirm();
 *   // in handler:
 *   if (!await confirm("Are you sure?", { title: "Delete club", variant: "danger" })) return;
 *   // in JSX:
 *   <ConfirmDialog {...confirmProps} />
 */
export function useConfirm() {
  const [state, setState] = useState<ConfirmState>(DEFAULT_STATE);

  const confirm = useCallback(
    (message: string, opts: ConfirmOptions = {}): Promise<boolean> => {
      return new Promise((resolve) => {
        setState({
          open: true,
          title: opts.title ?? "Are you sure?",
          message,
          confirmLabel: opts.confirmLabel ?? "Confirm",
          cancelLabel: opts.cancelLabel ?? "Cancel",
          variant: opts.variant ?? "danger",
          resolve,
        });
      });
    },
    [],
  );

  const handleConfirm = useCallback(() => {
    state.resolve?.(true);
    setState(DEFAULT_STATE);
  }, [state]);

  const handleCancel = useCallback(() => {
    state.resolve?.(false);
    setState(DEFAULT_STATE);
  }, [state]);

  return {
    confirm,
    confirmProps: {
      open: state.open,
      title: state.title,
      message: state.message,
      confirmLabel: state.confirmLabel,
      cancelLabel: state.cancelLabel,
      variant: state.variant,
      onConfirm: handleConfirm,
      onCancel: handleCancel,
    },
  };
}