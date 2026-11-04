"use client";

import Link from "next/link";
import { useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { useLanguage } from "@/lib/i18n/LanguageContext";
import { format } from "@/lib/i18n/translations";
import { useSession, type UserRole } from "@/lib/session/SessionContext";
import { LIVE_ROLES, ROLE_META, homeForRole } from "@/lib/roles";

/** Roles without an area yet (Social media expert): picked already, the area comes later. Live roles and Esports Professional go to a real area. */
export default function RoleComingSoonPage() {
  const { t } = useLanguage();
  const tr = t.coaching.roles;
  const { user } = useSession();
  const { role: raw } = useParams<{ role: string }>();
  const role = (raw in ROLE_META ? raw : "sponsor") as UserRole;
  const router = useRouter();
  const redirects = LIVE_ROLES.includes(role) || role === "esports_professional";
  useEffect(() => {
    if (redirects) router.replace(homeForRole(role, user.activeGame, user.roles));
  }, [redirects, role, router, user.activeGame, user.roles]);
  if (redirects) return null;
  const { icon: Icon, color } = ROLE_META[role];
  const name = tr.names[role];

  return (
    <div className="mx-auto mt-6 max-w-lg rounded-2xl border border-surface-line bg-surface/50 p-8 text-center">
      <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl" style={{ backgroundColor: `${color}22`, color }}>
        <Icon className="h-7 w-7" />
      </span>
      <h1 className="mt-4 font-display text-2xl font-black text-ink">{format(tr.comingSoonTitle, { role: name })}</h1>
      <p className="mt-2 text-sm leading-relaxed text-ink-soft">{format(tr.comingSoonBody, { role: name })}</p>
      <p className="mt-2 text-xs text-ink-faint">{tr.blurbs[role]}</p>
      <Link
        href={`/dashboard/${user.activeGame}`}
        className="mt-6 inline-flex rounded-full bg-accent px-6 py-2.5 font-display text-sm font-black text-bg"
      >
        {tr.goToDashboard}
      </Link>
    </div>
  );
}
