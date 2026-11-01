"use client";

import { useLanguage } from "@/lib/i18n/LanguageContext";
import { ROLE_META, ROLE_ORDER } from "@/lib/roles";
import type { UserRole } from "@/lib/session/SessionContext";
import { CheckIcon } from "@/components/icons";

/**
 * Multi-select role cards. `picked` keeps the order of choice; the first one is the
 * default (where the dashboard opens), and any picked card can be made the default.
 */
export function RolePicker({ picked, onChange }: { picked: UserRole[]; onChange: (next: UserRole[]) => void }) {
  const { t } = useLanguage();
  const tr = t.coaching.roles;

  const toggle = (role: UserRole) =>
    onChange(picked.includes(role) ? picked.filter((r) => r !== role) : [...picked, role]);
  const makeDefault = (role: UserRole) => onChange([role, ...picked.filter((r) => r !== role)]);

  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
      {ROLE_ORDER.map((role) => {
        const { icon: Icon, color } = ROLE_META[role];
        const on = picked.includes(role);
        const isDefault = picked[0] === role;
        return (
          <div
            key={role}
            className={`relative flex flex-col rounded-2xl border p-4 text-left transition-all ${
              on ? "border-accent bg-accent-soft/40 shadow-[0_0_24px_rgba(217,165,68,0.15)]" : "border-surface-line bg-surface/50 hover:border-surface-line-strong"
            }`}
          >
            <button
              type="button"
              role="checkbox"
              aria-checked={on}
              aria-label={tr.names[role]}
              onClick={() => toggle(role)}
              className="absolute inset-0 rounded-2xl"
            />
            <div className="pointer-events-none flex items-start justify-between gap-3">
              <span className="flex h-11 w-11 items-center justify-center rounded-xl" style={{ backgroundColor: `${color}22`, color }}>
                <Icon className="h-5 w-5" />
              </span>
              <span
                className={`flex h-5 w-5 items-center justify-center rounded-md border ${
                  on ? "border-accent bg-accent text-bg" : "border-surface-line-strong"
                }`}
              >
                {on ? <CheckIcon className="h-3.5 w-3.5" /> : null}
              </span>
            </div>
            <div className="pointer-events-none mt-3 font-display text-base font-black text-ink">{tr.names[role]}</div>
            <p className="pointer-events-none mt-1 text-xs leading-relaxed text-ink-soft">{tr.blurbs[role]}</p>
            {on ? (
              <div className="relative mt-3">
                {isDefault ? (
                  <span className="inline-flex rounded-full bg-accent px-2.5 py-0.5 font-mono text-[10px] font-bold uppercase tracking-wider text-bg">
                    {tr.defaultBadge}
                  </span>
                ) : (
                  <button
                    type="button"
                    onClick={() => makeDefault(role)}
                    className="rounded-full border border-surface-line-strong px-2.5 py-0.5 text-[11px] font-semibold text-ink-soft hover:border-accent hover:text-accent-ink"
                  >
                    {tr.makeDefault}
                  </button>
                )}
              </div>
            ) : null}
          </div>
        );
      })}
    </div>
  );
}
