"use client";

import { useLanguage } from "@/lib/i18n/LanguageContext";
import type { Mode } from "@/lib/session/SessionContext";

/** Player / Admin switch, shown to Allync staff only. */
export function RoleToggle({
  value,
  onChange,
  className = "",
}: {
  value: Mode;
  onChange: (mode: Mode) => void;
  className?: string;
}) {
  const { t } = useLanguage();

  const options: { value: Mode; label: string }[] = [
    { value: "player", label: t.admin.modePlayer },
    { value: "admin", label: t.admin.modeAdmin },
  ];

  return (
    <div>
      <div
        className={`inline-flex items-center rounded-full border border-surface-line-strong bg-surface p-0.5 ${className}`}
      >
        {options.map((option) => (
          <button
            key={option.value}
            type="button"
            onClick={() => onChange(option.value)}
            aria-pressed={value === option.value}
            className={`flex-1 rounded-full px-3.5 py-1.5 text-sm font-medium transition-colors ${
              value === option.value
                ? "bg-accent text-bg"
                : "text-ink-soft hover:text-ink"
            }`}
          >
            {option.label}
          </button>
        ))}
      </div>
      <p className="mt-1.5 text-xs text-ink-faint">
        {value === "player" ? t.auth.joinAsPlayerHint : t.admin.modeHint}
      </p>
    </div>
  );
}
