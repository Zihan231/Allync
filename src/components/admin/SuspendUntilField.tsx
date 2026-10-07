"use client";

import { useLanguage } from "@/lib/i18n/LanguageContext";
import { format } from "@/lib/i18n/translations";
import { Field, inputClass } from "./ui";

const DAY_MS = 24 * 60 * 60 * 1000;

/** datetime-local value (local time) for a moment `days` from now. */
export function localInputValue(days: number): string {
  const d = new Date(Date.now() + days * DAY_MS);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

/** "Suspended until" picker with 1 / 3 / 7 / 30 day shortcuts. */
export function SuspendUntilField({ value, onChange, moderatorLimitDays }: { value: string; onChange: (v: string) => void; moderatorLimitDays?: number }) {
  const { t } = useLanguage();
  const d = t.admin.user.dialogs;
  const quick: Array<[number, string]> = [
    [1, d.quick.d1],
    [3, d.quick.d3],
    [7, d.quick.d7],
    [30, d.quick.d30],
  ];
  return (
    <Field label={d.untilLabel} hint={moderatorLimitDays ? format(d.moderatorLimit, { days: moderatorLimitDays }) : undefined}>
      <div className="mb-2 flex flex-wrap gap-1.5">
        {quick
          .filter(([days]) => !moderatorLimitDays || days <= moderatorLimitDays)
          .map(([days, label]) => (
            <button
              key={days}
              type="button"
              onClick={() => onChange(localInputValue(days))}
              className="rounded-full border border-surface-line-strong px-2.5 py-1 text-xs text-ink-soft hover:border-accent hover:text-ink"
            >
              {label}
            </button>
          ))}
      </div>
      <input type="datetime-local" value={value} onChange={(e) => onChange(e.target.value)} className={inputClass} />
    </Field>
  );
}
