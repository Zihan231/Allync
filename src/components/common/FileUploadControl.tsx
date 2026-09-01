"use client";

import { useRef, useState, type DragEvent } from "react";
import { useLanguage } from "@/lib/i18n/LanguageContext";

export function FileUploadControl({
  label,
  value,
  onChange,
  uploadLabel,
  changeLabel,
}: {
  label: string;
  value: string | null;
  onChange: (dataUrl: string) => void;
  uploadLabel: string;
  changeLabel: string;
}) {
  const { t } = useLanguage();
  const inputRef = useRef<HTMLInputElement>(null);
  const [fileName, setFileName] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const isImage = value?.startsWith("data:image/");

  const handleFile = (file: File | undefined) => {
    if (!file) return;
    setFileName(file.name);
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === "string") onChange(reader.result);
    };
    reader.readAsDataURL(file);
  };

  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setDragOver(false);
    handleFile(e.dataTransfer.files?.[0]);
  };

  return (
    <div>
      <span className="text-sm font-medium text-ink-soft">{label}</span>
      <div
        role="button"
        tabIndex={0}
        onClick={() => inputRef.current?.click()}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") inputRef.current?.click();
        }}
        onDragOver={(e) => {
          e.preventDefault();
          setDragOver(true);
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={handleDrop}
        className={`mt-1.5 flex cursor-pointer items-center gap-4 rounded-xl border-2 border-dashed p-4 transition-colors ${
          dragOver ? "border-accent bg-accent/5" : "border-surface-line-strong hover:border-accent/60"
        }`}
      >
        {value ? (
          isImage ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={value} alt="" className="h-16 w-16 shrink-0 rounded-lg object-cover" />
          ) : (
            <div className="flex h-16 max-w-[10rem] shrink-0 items-center justify-center truncate rounded-lg bg-surface px-2 text-xs text-ink-soft">
              {fileName ?? "document.pdf"}
            </div>
          )
        ) : (
          <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-lg bg-surface text-xs text-ink-faint">
            —
          </div>
        )}
        <div className="min-w-0">
          <span className="inline-block rounded-full bg-accent px-3.5 py-1.5 text-xs font-semibold text-bg">
            {value ? changeLabel : uploadLabel}
          </span>
          <p className="mt-1.5 text-xs text-ink-faint">{t.dashboard.shared.dropHint}</p>
        </div>
        <input
          ref={inputRef}
          type="file"
          accept="image/*,application/pdf"
          className="hidden"
          onChange={(e) => handleFile(e.target.files?.[0])}
        />
      </div>
    </div>
  );
}
