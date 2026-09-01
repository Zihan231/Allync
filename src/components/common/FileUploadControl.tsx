"use client";

import { useRef, useState } from "react";

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
  const inputRef = useRef<HTMLInputElement>(null);
  const [fileName, setFileName] = useState<string | null>(null);
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

  return (
    <div>
      <span className="text-sm font-medium text-ink-soft">{label}</span>
      <div className="mt-1.5 flex items-center gap-3">
        {value ? (
          isImage ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={value} alt="" className="h-14 w-14 rounded-lg object-cover" />
          ) : (
            <div className="flex h-14 max-w-[10rem] items-center justify-center truncate rounded-lg border border-surface-line bg-surface px-2 text-xs text-ink-soft">
              {fileName ?? "document.pdf"}
            </div>
          )
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
          {value ? changeLabel : uploadLabel}
        </button>
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
