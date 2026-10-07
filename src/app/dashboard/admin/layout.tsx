"use client";

import { useLanguage } from "@/lib/i18n/LanguageContext";
import { useSession } from "@/lib/session/SessionContext";
import { LockIcon } from "@/components/icons";

/** The staff area: only moderators, admins and super admins get past this. The API checks too. */
export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const { t } = useLanguage();
  const { user } = useSession();

  if (!user.systemRole) {
    return (
      <div className="mx-auto mt-10 max-w-md rounded-2xl border border-surface-line bg-surface/50 p-8 text-center">
        <LockIcon className="mx-auto h-8 w-8 text-ink-faint" />
        <h1 className="mt-3 font-display text-xl font-black text-ink">{t.admin.noAccessTitle}</h1>
        <p className="mt-2 text-sm text-ink-soft">{t.admin.noAccessBody}</p>
      </div>
    );
  }
  return <>{children}</>;
}
