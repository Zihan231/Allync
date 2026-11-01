"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import { useLanguage } from "@/lib/i18n/LanguageContext";
import { useSession } from "@/lib/session/SessionContext";
import { useSetMyRoles } from "@/lib/api/hooks/useCoaching";
import { useMyCreator } from "@/lib/api/hooks/useCreators";
import type { MyCreator } from "@/lib/api/creators";
import { useToast } from "@/lib/useToast";
import { ToastContainer } from "@/components/common/Toast";
import { AppLoader } from "@/components/common/AppLoader";
import { EmptyState } from "@/components/dashboard/EmptyState";
import { SpikeIcon } from "@/components/icons";

type Toast = (message: string, variant?: "success" | "error") => void;

/**
 * The frame of every creator page: a title, the creator's designs once loaded, toasts,
 * and (for users without the Creative artist role) a button to take it on.
 */
export function CreatorShell({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle?: string;
  children: (data: MyCreator, toast: Toast) => ReactNode;
}) {
  const { t } = useLanguage();
  const tc = t.creators.shell;
  const { user, refreshSession } = useSession();
  const isCreator = user.roles.includes("creative");
  const { data, isLoading } = useMyCreator(isCreator);
  const addRole = useSetMyRoles();
  const { toasts, toast, dismiss } = useToast();

  if (!isCreator) {
    return (
      <div className="mx-auto max-w-xl space-y-4 text-center">
        <EmptyState icon={SpikeIcon} title={tc.title} body={tc.subtitle} />
        <button
          type="button"
          disabled={addRole.isPending}
          onClick={async () => {
            await addRole.mutateAsync({ roles: [...user.roles, "creative"], primaryRole: user.primaryRole });
            await refreshSession();
          }}
          className="rounded-full bg-accent px-5 py-2.5 font-display text-sm font-black text-bg disabled:opacity-50"
        >
          + {tc.addRole}
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
        <Link
          href={`/dashboard/efootball/creators/${user.id}`}
          className="rounded-full border border-surface-line-strong px-4 py-2 text-xs font-semibold text-ink-soft hover:text-ink"
        >
          {tc.viewPublic}
        </Link>
      </header>
      {children(data, toast)}
    </div>
  );
}
