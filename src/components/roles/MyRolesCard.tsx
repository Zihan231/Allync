"use client";

import { useState } from "react";
import { useLanguage } from "@/lib/i18n/LanguageContext";
import { useSession, type UserRole } from "@/lib/session/SessionContext";
import { useSetMyRoles } from "@/lib/api/hooks/useCoaching";
import { RolePicker } from "./RolePicker";

/** Profile: the roles the user takes on and the default one (where the dashboard opens). */
export function MyRolesCard({ onSaved }: { onSaved?: (message: string) => void }) {
  const { t } = useLanguage();
  const tr = t.coaching.roles;
  const { user, refreshSession } = useSession();
  const save = useSetMyRoles();
  const initial: UserRole[] = [user.primaryRole, ...user.roles.filter((r) => r !== user.primaryRole)];
  const [picked, setPicked] = useState<UserRole[]>(initial);
  const [error, setError] = useState("");
  const [saved, setSaved] = useState(false);
  const changed = picked.join(",") !== initial.join(",");

  async function submit() {
    setError("");
    if (!picked.length) return setError(tr.pickOne);
    try {
      await save.mutateAsync({ roles: picked, primaryRole: picked[0] });
      await refreshSession();
      setSaved(true);
      onSaved?.(tr.saved);
    } catch {
      setError(tr.saveError);
    }
  }

  return (
    <section className="rounded-2xl border border-surface-line bg-surface/50 p-4 sm:p-6" data-testid="my-roles">
      <h2 className="font-display text-lg font-black text-ink">{tr.profileTitle}</h2>
      <p className="mt-1 text-xs text-ink-soft">{tr.profileHint}</p>
      <div className="mt-4">
        <RolePicker
          picked={picked}
          onChange={(next) => {
            setPicked(next);
            setSaved(false);
          }}
        />
      </div>
      {error ? (
        <p role="alert" className="mt-3 text-xs font-semibold text-danger-ink">
          {error}
        </p>
      ) : null}
      <div className="mt-4 flex items-center justify-end gap-3">
        {saved && !changed ? <span className="text-xs font-semibold text-success-ink">{tr.saved}</span> : null}
        <button
          type="button"
          onClick={submit}
          disabled={!changed || save.isPending}
          className="rounded-full bg-accent px-5 py-2.5 font-display text-sm font-black text-bg disabled:opacity-40"
        >
          {save.isPending ? tr.saving : tr.saveRoles}
        </button>
      </div>
    </section>
  );
}
