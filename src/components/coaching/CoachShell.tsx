"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import { useLanguage } from "@/lib/i18n/LanguageContext";
import { useSession } from "@/lib/session/SessionContext";
import { useMyCoaching, useSetMyRoles } from "@/lib/api/hooks/useCoaching";
import type { MyCoaching } from "@/lib/api/coaching";
import { useToast } from "@/lib/useToast";
import { ToastContainer } from "@/components/common/Toast";
import { AppLoader } from "@/components/common/AppLoader";
import { EmptyState } from "@/components/dashboard/EmptyState";
import { ChartIcon } from "@/components/icons";

type Toast = (message: string, variant?: "success" | "error") => void;

/**
 * The frame of every coach page: a page title, the coach's data once loaded, toasts,
 * and (for users without the coach role) a button to take it on.
 */
export function CoachShell({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle?: string;
  children: (data: MyCoaching, toast: Toast) => ReactNode;
}) {
  const { t } = useLanguage();
  const tc = t.coaching.coach;
  const { user, refreshSession } = useSession();
  const isCoach = user.roles.includes("coach");
  const { data, isLoading } = useMyCoaching(isCoach);
  const addRole = useSetMyRoles();
  const { toasts, toast, dismiss } = useToast();

  if (!isCoach) {
    return (
      <div className="mx-auto max-w-xl space-y-4 text-center">
        <EmptyState icon={ChartIcon} title={tc.title} body={t.coaching.roles.blurbs.coach} />
        <button
          type="button"
          disabled={addRole.isPending}
          onClick={async () => {
            await addRole.mutateAsync({ roles: [...new Set([...user.roles, "esports_professional", "coach"] as const)], primaryRole: user.primaryRole });
            await refreshSession();
          }}
          className="rounded-full bg-accent px-5 py-2.5 font-display text-sm font-black text-bg disabled:opacity-50"
        >
          + {t.coaching.roles.names.coach}
        </button>
      </div>
    );
  }
  if (isLoading || !data) return <AppLoader />;

  return (
    <div className="space-y-6">
      <ToastContainer toasts={toasts} onDismiss={dismiss} />
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-black text-ink">{title}</h1>
          {subtitle ? <p className="mt-1 text-sm text-ink-soft">{subtitle}</p> : null}
        </div>
        {data.profile ? (
          <Link
            href={`/dashboard/efootball/coaches/${user.id}`}
            className="rounded-full border border-surface-line-strong px-4 py-2 text-xs font-semibold text-ink-soft hover:text-ink"
          >
            {tc.viewPublic}
          </Link>
        ) : null}
      </header>
      {children(data, toast)}
    </div>
  );
}
