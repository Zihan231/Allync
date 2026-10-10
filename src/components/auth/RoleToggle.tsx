"use client";

import { useLanguage } from "@/lib/i18n/LanguageContext";
import type { Mode } from "@/lib/session/SessionContext";

/** Player / Organizer switch for everyone, plus Admin for Allync staff. */
export function RoleToggle({
  value,
  onChange,
  staff = false,
  className = "",
}: {
  value: Mode;
  onChange: (mode: Mode) => void;
  /** Show the Admin option. */
  staff?: boolean;
  className?: string;
}) {
  const { t } = useLanguage();

  const options: { value: Mode; label: string }[] = [
    { value: "player", label: t.admin.modePlayer },
    { value: "organizer", label: t.admin.modeOrganizer },
    ...(staff ? [{ value: "admin" as const, label: t.admin.modeAdmin }] : []),
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
            className={`flex-1 rounded-full px-2.5 py-1.5 text-xs font-medium transition-colors ${
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
        {value === "player" ? t.auth.joinAsPlayerHint : value === "organizer" ? t.admin.modeOrganizerHint : t.admin.modeHint}
      </p>
    </div>
  );
}
