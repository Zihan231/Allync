"use client";

import { useRef } from "react";
import { useLanguage } from "@/lib/i18n/LanguageContext";

export function ImageUploadControl({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string | null;
  onChange: (dataUrl: string) => void;
}) {
  const { t } = useLanguage();
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFile = (file: File | undefined) => {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === "string") onChange(reader.result);
    };
    reader.readAsDataURL(file);
  };

  return (
    <div>
      <span className="text-sm font-medium text-ink-soft">{label}</span>
      <div className="mt-1.5 flex items-center gap-3">
        {value ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={value} alt="" className="h-14 w-14 rounded-lg object-cover" />
        ) : (
          <div className="flex h-14 w-14 items-center justify-center rounded-lg border border-dashed border-surface-line-strong text-ink-faint">
            —
          </div>
        )}
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          className="rounded-full bg-accent px-3.5 py-1.5 text-xs font-semibold text-bg"
        >
          {value ? t.dashboard.shared.changePhoto : t.dashboard.shared.uploadPhoto}
        </button>
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(e) => handleFile(e.target.files?.[0])}
        />
      </div>
    </div>
  );
}
