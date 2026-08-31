"use client";

import { useEffect } from "react";

export function AvatarLightbox({
  src,
  alt,
  open,
  onClose,
}: {
  src: string;
  alt: string;
  open: boolean;
  onClose: () => void;
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
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 p-6 backdrop-blur-sm"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={src}
        alt={alt}
        onClick={(e) => e.stopPropagation()}
        className="max-h-[85vh] max-w-[90vw] rounded-2xl object-contain shadow-2xl"
      />
      <button
        type="button"
        onClick={onClose}
        aria-label="Close"
        className="absolute right-6 top-6 flex h-10 w-10 items-center justify-center rounded-full border border-surface-line-strong bg-surface text-ink"
      >
        <svg viewBox="0 0 24 24" fill="none" className="h-4 w-4" aria-hidden="true">
          <path d="m6 6 12 12M18 6 6 18" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
        </svg>
      </button>
    </div>
  );
}
