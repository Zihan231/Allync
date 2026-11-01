"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useLanguage } from "@/lib/i18n/LanguageContext";
import { useSession, type Mode, type UserRole } from "@/lib/session/SessionContext";
import { ROLE_META, profileHref } from "@/lib/roles";
import { Avatar } from "@/components/common/Avatar";
import { LockIcon, SettingsIcon } from "@/components/icons";

/**
 * Top of every profile: the shared key info (one account) and the switch between the
 * user's profiles (player, organizer, coach; Admin for staff). Switching also switches
 * the dashboard mode, so Profile keeps opening the profile of the mode you're in.
 */
export function ProfileModeBar({ current }: { current: Mode | "central" }) {
  const { t } = useLanguage();
  const tr = t.coaching.roles;
  const { user, setMode } = useSession();
  const router = useRouter();

  const modes: Array<{ mode: Mode; label: string; role?: UserRole }> = [
    { mode: "player", label: tr.names.player, role: "player" },
    ...(user.roles.includes("organizer") ? [{ mode: "organizer" as const, label: tr.names.organizer, role: "organizer" as const }] : []),
    ...(user.roles.includes("coach") ? [{ mode: "coach" as const, label: tr.names.coach, role: "coach" as const }] : []),
    ...(user.roles.includes("creative") ? [{ mode: "creator" as const, label: tr.names.creative, role: "creative" as const }] : []),
    ...(user.systemRole ? [{ mode: "admin" as const, label: t.admin.modeAdmin }] : []),
  ];
  const otherRoles = user.roles.filter((r) => !["player", "organizer", "coach", "creative"].includes(r));

  const go = (mode: Mode) => {
    setMode(mode);
    router.push(profileHref(mode, user.activeGame));
  };

  return (
    <section className="rounded-2xl border border-surface-line bg-surface/60 p-4 backdrop-blur sm:p-5" data-testid="profile-mode-bar">
      <div className="flex flex-wrap items-center gap-4">
        <Avatar dpUrl={user.dpUrl} name={user.name} size="lg" mode="static" />
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="truncate font-display text-xl font-black text-ink">{user.name}</h2>
            {user.verificationLevel > 0 ? (
              <span className="inline-flex items-center gap-1 rounded-full bg-success-soft px-2 py-0.5 text-[10px] font-bold text-success-ink">
                <LockIcon className="h-3 w-3" /> KYC
              </span>
            ) : null}
          </div>
          <div className="mt-0.5 truncate text-xs text-ink-soft">
            {[user.email, user.phoneNumber, user.club?.name].filter(Boolean).join(" · ")}
          </div>
          <div className="mt-2 flex flex-wrap gap-1.5">
            {user.roles.map((role) => (
              <span
                key={role}
                className="rounded-full border px-2 py-0.5 text-[10px] font-bold"
                style={{ borderColor: `${ROLE_META[role]?.color ?? "#888"}66`, color: ROLE_META[role]?.color }}
              >
                {tr.names[role]}
                {role === user.primaryRole ? ` · ${tr.defaultBadge}` : ""}
              </span>
            ))}
          </div>
        </div>
        <Link
          href="/dashboard/profile"
          className={`inline-flex items-center gap-1.5 rounded-full border px-3.5 py-2 text-xs font-semibold transition-colors ${
            current === "central" ? "border-accent bg-accent-soft text-accent-ink" : "border-surface-line-strong text-ink-soft hover:text-ink"
          }`}
        >
          <SettingsIcon className="h-3.5 w-3.5" />
          {t.coaching.profile.personalInfo}
        </Link>
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-2 border-t border-surface-line pt-4">
        <span className="mr-1 font-mono text-[10px] font-bold uppercase tracking-wider text-ink-faint">{t.coaching.profile.profileAs}</span>
        {modes.map(({ mode, label, role }) => {
          const Icon = role ? ROLE_META[role].icon : LockIcon;
          const active = current === mode;
          return (
            <button
              key={mode}
              type="button"
              aria-pressed={active}
              onClick={() => go(mode)}
              className={`inline-flex items-center gap-1.5 rounded-full border px-3.5 py-1.5 text-xs font-semibold transition-colors ${
                active ? "border-accent bg-accent text-bg" : "border-surface-line-strong text-ink-soft hover:border-accent hover:text-ink"
              }`}
            >
              <Icon className="h-3.5 w-3.5" />
              {label}
            </button>
          );
        })}
        {otherRoles.map((role) => (
          <Link
            key={role}
            href={`/dashboard/roles/${role}`}
            className="inline-flex items-center gap-1.5 rounded-full border border-dashed border-surface-line-strong px-3.5 py-1.5 text-xs font-semibold text-ink-faint hover:text-ink"
          >
            {tr.names[role]}
          </Link>
        ))}
      </div>
    </section>
  );
}
