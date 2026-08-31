"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { useLanguage } from "@/lib/i18n/LanguageContext";
import { useSession } from "@/lib/session/SessionContext";
import { PageHeader } from "@/components/dashboard/PageHeader";

export default function OrganizerSettingsPage() {
  const { t } = useLanguage();
  const { user, updateProfile, logout } = useSession();
  const router = useRouter();
  const c = t.dashboard.organizer.settings;
  const [saved, setSaved] = useState(false);

  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const data = new FormData(e.currentTarget);
    updateProfile({
      name: String(data.get("name") ?? user.name),
      email: String(data.get("email") ?? user.email),
    });
    setSaved(true);
  };

  return (
    <div className="mx-auto max-w-lg">
      <PageHeader eyebrow={t.dashboard.shell.modeOrganizer} title={t.dashboard.shell.navSettings} />

      <form onSubmit={handleSubmit} className="mt-8 space-y-4 rounded-xl border border-surface-line bg-surface/50 p-6">
        <label className="block">
          <span className="text-sm font-medium text-ink-soft">{c.displayName}</span>
          <input
            name="name"
            defaultValue={user.name}
            className="mt-1.5 w-full rounded-lg border border-surface-line bg-surface px-4 py-3 text-sm text-ink outline-none focus:border-accent focus:ring-2 focus:ring-accent/20"
          />
        </label>
        <label className="block">
          <span className="text-sm font-medium text-ink-soft">{c.email}</span>
          <input
            name="email"
            type="email"
            defaultValue={user.email}
            className="mt-1.5 w-full rounded-lg border border-surface-line bg-surface px-4 py-3 text-sm text-ink outline-none focus:border-accent focus:ring-2 focus:ring-accent/20"
          />
        </label>
        <button
          type="submit"
          className="rounded-full bg-accent px-6 py-3 font-display font-semibold text-bg transition-transform hover:-translate-y-0.5"
        >
          {c.saveButton}
        </button>
        {saved ? <p className="text-xs text-success-ink">✓</p> : null}
      </form>

      <button
        onClick={() => {
          logout();
          router.push("/");
        }}
        className="mt-4 rounded-full border border-surface-line-strong px-6 py-3 text-sm font-medium text-danger-ink"
      >
        {c.logoutButton}
      </button>
    </div>
  );
}
