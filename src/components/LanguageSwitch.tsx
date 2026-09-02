"use client";

import { useLanguage } from "@/lib/i18n/LanguageContext";

export function LanguageSwitch({ className = "" }: { className?: string }) {
  const { locale, setLocale } = useLanguage();

  return (
    <div
      className={`inline-flex items-center rounded-full border border-surface-line-strong bg-surface p-0.5 font-mono text-[10px] min-[380px]:text-[11px] font-medium shrink-0 ${className}`}
    >
      <button
        type="button"
        onClick={() => setLocale("en")}
        aria-pressed={locale === "en"}
        className={`rounded-full px-1.5 py-0.5 min-[380px]:px-2.5 min-[380px]:py-1 transition-colors ${
          locale === "en" ? "bg-accent text-bg" : "text-ink-soft hover:text-ink"
        }`}
      >
        EN
      </button>
      <button
        type="button"
        onClick={() => setLocale("bn")}
        aria-pressed={locale === "bn"}
        className={`rounded-full px-1.5 py-0.5 min-[380px]:px-2.5 min-[380px]:py-1 transition-colors ${
          locale === "bn" ? "bg-accent text-bg" : "text-ink-soft hover:text-ink"
        }`}
      >
        বাং
      </button>
    </div>
  );
}
