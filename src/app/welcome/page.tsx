"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useLanguage } from "@/lib/i18n/LanguageContext";
import { useSession, type UserRole } from "@/lib/session/SessionContext";
import { useSetMyRoles } from "@/lib/api/hooks/useCoaching";
import { homeForRole, rolesToSave } from "@/lib/roles";
import { AppLoader } from "@/components/common/AppLoader";
import { RolePicker } from "@/components/roles/RolePicker";

/** "What suits you best?": shown once after sign-up (and once to accounts that never answered). */
export default function WelcomePage() {
  const { t } = useLanguage();
  const tr = t.coaching.roles;
  const router = useRouter();
  const { user, isAuthenticated, isLoading, refreshSession } = useSession();
  const save = useSetMyRoles();
  const [picked, setPicked] = useState<UserRole[]>([]);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!isLoading && !isAuthenticated) router.replace("/login");
  }, [isLoading, isAuthenticated, router]);

  if (isLoading || !isAuthenticated) return <AppLoader />;

  const current = picked.length ? picked : user.rolesChosen ? user.roles : [];

  async function submit() {
    setError("");
    if (!current.length) return setError(tr.pickOne);
    const toSave = rolesToSave(current);
    if (!toSave) return setError(tr.pickSub);
    try {
      await save.mutateAsync(toSave);
      await refreshSession();
      router.replace(homeForRole(toSave.primaryRole, user.activeGame, toSave.roles));
    } catch {
      setError(tr.saveError);
    }
  }

  return (
    <main className="min-h-screen bg-bg px-4 py-10 sm:py-16">
      <div className="mx-auto max-w-4xl">
        <p className="font-mono text-xs font-bold uppercase tracking-[0.2em] text-accent-ink">{tr.eyebrow}</p>
        <h1 className="mt-2 font-display text-3xl font-black text-ink sm:text-4xl">{tr.title}</h1>
        <p className="mt-3 max-w-2xl text-sm leading-relaxed text-ink-soft">{tr.subtitle}</p>

        <div className="mt-8">
          <RolePicker picked={current} onChange={setPicked} />
        </div>

        {error ? (
          <p role="alert" className="mt-4 text-sm font-semibold text-danger-ink">
            {error}
          </p>
        ) : null}

        <div className="mt-8 flex justify-end">
          <button
            type="button"
            onClick={submit}
            disabled={save.isPending}
            className="rounded-full bg-accent px-8 py-3 font-display text-sm font-black text-bg transition-transform hover:-translate-y-0.5 disabled:opacity-50"
          >
            {save.isPending ? tr.saving : tr.continue}
          </button>
        </div>
      </div>
    </main>
  );
}
