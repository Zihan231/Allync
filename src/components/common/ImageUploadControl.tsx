"use client";

import { useRef, useState, type DragEvent } from "react";
import { useLanguage } from "@/lib/i18n/LanguageContext";

const MAX_DIMENSION = 1600;
const QUALITY = 0.85;

// Downscale and re-encode so raw phone photos (often 5–15 MB) don't exceed the API body limit.
// WebP keeps logo transparency; animated GIFs and SVGs are passed through untouched.
async function compressImage(file: File): Promise<string> {
  const original = await new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });
  if (file.type === "image/gif" || file.type === "image/svg+xml") return original;

  const img = new Image();
  img.src = original;
  await img.decode();

  const scale = Math.min(1, MAX_DIMENSION / Math.max(img.naturalWidth, img.naturalHeight));
  const canvas = document.createElement("canvas");
  canvas.width = Math.round(img.naturalWidth * scale);
  canvas.height = Math.round(img.naturalHeight * scale);
  canvas.getContext("2d")?.drawImage(img, 0, 0, canvas.width, canvas.height);

  let compressed = canvas.toDataURL("image/webp", QUALITY);
  // Browsers without WebP encoding silently return PNG; JPEG is smaller in that case.
  if (!compressed.startsWith("data:image/webp")) compressed = canvas.toDataURL("image/jpeg", QUALITY);
  return compressed.length < original.length ? compressed : original;
}

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
  const [dragOver, setDragOver] = useState(false);

  const handleFile = (file: File | undefined) => {
    if (!file || !file.type.startsWith("image/")) return;
    compressImage(file)
      .then(onChange)
      .catch((err) => console.error("Failed to process image", err));
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
          // eslint-disable-next-line @next/next/no-img-element
          <img src={value} alt="" className="h-16 w-16 shrink-0 rounded-lg object-cover" />
        ) : (
          <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-lg bg-surface text-xs text-ink-faint">
            —
          </div>
        )}
        <div className="min-w-0">
          <span className="inline-block rounded-full bg-accent px-3.5 py-1.5 text-xs font-semibold text-bg">
            {value ? t.dashboard.shared.changePhoto : t.dashboard.shared.uploadPhoto}
          </span>
          <p className="mt-1.5 text-xs text-ink-faint">{t.dashboard.shared.dropHint}</p>
        </div>
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
