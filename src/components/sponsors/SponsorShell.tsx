"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import { useLanguage } from "@/lib/i18n/LanguageContext";
import { useSession } from "@/lib/session/SessionContext";
import { useSetMyRoles } from "@/lib/api/hooks/useCoaching";
import { useMySponsor } from "@/lib/api/hooks/useSponsors";
import type { MySponsor } from "@/lib/api/sponsors";
import { useToast } from "@/lib/useToast";
import { ToastContainer } from "@/components/common/Toast";
import { AppLoader } from "@/components/common/AppLoader";
import { EmptyState } from "@/components/dashboard/EmptyState";
import { WalletIcon } from "@/components/icons";
import { SponsorProfileForm } from "./SponsorProfileForm";

type Toast = (message: string, variant?: "success" | "error") => void;

/**
 * The frame of every sponsor page: a title, the sponsor's data, toasts; the brand set-up
 * form until the brand has a name, and for users without the Sponsor role a button to add it.
 */
export function SponsorShell({
  title,
  subtitle,
  children,
  requireProfile = true,
}: {
  title: string;
  subtitle?: string;
  children: (data: MySponsor, toast: Toast) => ReactNode;
  /** Show the brand set-up form instead of the page until the brand has a name. */
  requireProfile?: boolean;
}) {
  const { t } = useLanguage();
  const ts = t.sponsors.shell;
  const { user, refreshSession } = useSession();
  const isSponsor = user.roles.includes("sponsor");
  const { data, isLoading } = useMySponsor(isSponsor);
  const addRole = useSetMyRoles();
  const { toasts, toast, dismiss } = useToast();

  if (!isSponsor) {
    return (
      <div className="mx-auto max-w-xl space-y-4 text-center">
        <EmptyState icon={WalletIcon} title={ts.title} body={ts.subtitle} />
        <button
          type="button"
          disabled={addRole.isPending}
          onClick={async () => {
            await addRole.mutateAsync({ roles: [...user.roles, "sponsor"], primaryRole: user.primaryRole });
            await refreshSession();
          }}
          className="rounded-full bg-accent px-5 py-2.5 font-display text-sm font-black text-bg disabled:opacity-50"
        >
          + {ts.addRole}
        </button>
      </div>
    );
  }
  if (isLoading || !data) return <AppLoader />;

  const ready = Boolean(data.profile?.brandName);
  return (
    <div className="space-y-6">
      <ToastContainer toasts={toasts} onDismiss={dismiss} />
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-black text-ink">{title}</h1>
          {subtitle ? <p className="mt-1 text-sm text-ink-soft">{subtitle}</p> : null}
        </div>
        {ready ? (
          <Link
            href={`/dashboard/efootball/sponsors/${user.id}`}
            className="rounded-full border border-surface-line-strong px-4 py-2 text-xs font-semibold text-ink-soft hover:text-ink"
          >
            {ts.viewPublic}
          </Link>
        ) : null}
      </header>
      {requireProfile && !ready ? (
        <div className="space-y-3">
          <p className="rounded-xl bg-accent-soft px-4 py-3 text-sm text-accent-ink">{ts.setupFirst}</p>
          <SponsorProfileForm profile={data.profile} onSaved={(m) => toast(m, "success")} onError={(m) => toast(m, "error")} />
        </div>
      ) : (
        children(data, toast)
      )}
    </div>
  );
}
