"use client";

import { useState } from "react";
import { useLanguage } from "@/lib/i18n/LanguageContext";

export function RoleToggle() {
  const { t } = useLanguage();
  const [role, setRole] = useState("player");

  const roles = [
    { value: "player", label: t.auth.player },
    { value: "organizer", label: t.auth.organizer },
  ];

  return (
    <div>
      <span className="text-sm font-medium text-ink-soft">{t.auth.joinAs}</span>
      <div className="mt-1.5 grid grid-cols-2 gap-2 rounded-lg border border-surface-line bg-surface p-1">
        {roles.map((r) => (
          <button
            key={r.value}
            type="button"
            onClick={() => setRole(r.value)}
            aria-pressed={role === r.value}
            className={`rounded-md py-2 text-sm font-medium transition-colors ${
              role === r.value
                ? "bg-accent text-bg"
                : "text-ink-soft hover:text-ink"
            }`}
          >
            {r.label}
          </button>
        ))}
      </div>
      <input type="hidden" name="role" value={role} />
      <p className="mt-1.5 text-xs text-ink-faint">
        {role === "player" ? t.auth.joinAsPlayerHint : t.auth.joinAsOrganizerHint}
      </p>
    </div>
  );
}
