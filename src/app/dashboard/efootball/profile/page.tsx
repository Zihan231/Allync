"use client";

import { useState, type FormEvent } from "react";
import { useLanguage } from "@/lib/i18n/LanguageContext";
import { useSession } from "@/lib/session/SessionContext";
import { useMockMatches } from "@/lib/mock/store";
import { updatePersonProfile } from "@/lib/mock/communityStore";
import { PageHeader } from "@/components/dashboard/PageHeader";
import { StatTile } from "@/components/dashboard/StatTile";
import { MiniMatchRow } from "@/components/dashboard/MiniMatchRow";
import { SectionHeading } from "@/components/dashboard/SectionHeading";
import { ImageUploadControl } from "@/components/common/ImageUploadControl";
import { ChartIcon, TrophyIcon, CalendarIcon } from "@/components/icons";

function VerifyAccountSection() {
  const { t } = useLanguage();
  const { user, setDpUrl, setVerificationStatus } = useSession();
  const [photo, setPhoto] = useState<string | null>(null);

  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const data = new FormData(e.currentTarget);
    updatePersonProfile(user.personId, {
      dpUrl: photo,
      inGameId: String(data.get("inGameId") ?? ""),
      facebookUrl: String(data.get("facebookUrl") ?? ""),
    });
    setDpUrl(photo);
    setVerificationStatus("verified");
  };

  return (
    <div className="mt-8 rounded-2xl border border-surface-line bg-surface/60 p-6">
      <h2 className="font-display text-xl font-bold text-ink">{t.dashboard.onboarding.title}</h2>
      <p className="mt-1.5 text-sm leading-relaxed text-ink-soft">{t.dashboard.onboarding.intro}</p>

      <form onSubmit={handleSubmit} className="mt-6 space-y-5">
        <ImageUploadControl label={t.dashboard.onboarding.photoLabel} value={photo} onChange={setPhoto} />

        <label className="block">
          <span className="text-sm font-medium text-ink-soft">{t.dashboard.onboarding.inGameIdLabel}</span>
          <input
            name="inGameId"
            required
            className="mt-1.5 w-full rounded-lg border border-surface-line bg-surface px-4 py-3 text-sm text-ink outline-none focus:border-accent focus:ring-2 focus:ring-accent/20"
          />
        </label>

        <label className="block">
          <span className="text-sm font-medium text-ink-soft">{t.dashboard.onboarding.facebookLabel}</span>
          <input
            name="facebookUrl"
            type="url"
            required
            placeholder="https://facebook.com/..."
            className="mt-1.5 w-full rounded-lg border border-surface-line bg-surface px-4 py-3 text-sm text-ink outline-none focus:border-accent focus:ring-2 focus:ring-accent/20"
          />
        </label>

        <div className="grid grid-cols-2 gap-4">
          <label className="block">
            <span className="text-sm font-medium text-ink-soft">{t.dashboard.onboarding.deviceNameLabel}</span>
            <input
              name="deviceName"
              required
              className="mt-1.5 w-full rounded-lg border border-surface-line bg-surface px-3 py-3 text-sm text-ink outline-none focus:border-accent focus:ring-2 focus:ring-accent/20"
            />
          </label>
          <label className="block">
            <span className="text-sm font-medium text-ink-soft">{t.dashboard.onboarding.deviceModelLabel}</span>
            <input
              name="deviceModel"
              required
              className="mt-1.5 w-full rounded-lg border border-surface-line bg-surface px-3 py-3 text-sm text-ink outline-none focus:border-accent focus:ring-2 focus:ring-accent/20"
            />
          </label>
        </div>

        <button
          type="submit"
          className="w-full rounded-full bg-accent px-6 py-3 font-display font-semibold text-bg transition-transform hover:-translate-y-0.5"
        >
          {t.dashboard.onboarding.submitCta}
        </button>
      </form>
    </div>
  );
}

export default function ProfilePage() {
  const { t } = useLanguage();
  const { user } = useSession();
  const matches = useMockMatches().filter((m) => m.game === "efootball");

  return (
    <div>
      <PageHeader
        eyebrow="eFootball"
        title={user.name}
        description={t.dashboard.profile.crossGameNote}
      />

      <div className="mt-8 flex items-center gap-4">
        <div className="flex h-14 w-14 items-center justify-center rounded-full bg-accent font-display text-lg font-bold text-bg">
          {user.initials}
        </div>
        <div className="flex flex-wrap gap-2">
          {user.club ? (
            <span className="rounded-full border border-surface-line-strong bg-bg-raised px-3 py-1.5 text-xs font-medium text-ink">
              {user.club.name} · {user.club.role}
            </span>
          ) : null}
          {user.community ? (
            <span className="rounded-full border border-surface-line-strong bg-bg-raised px-3 py-1.5 text-xs font-medium text-ink">
              {user.community.name}
            </span>
          ) : null}
        </div>
      </div>

      <div className="mt-8">
        <SectionHeading tone="accent">{t.dashboard.profile.statsTitle}</SectionHeading>
        <div className="grid gap-4 sm:grid-cols-3">
          <StatTile label={t.dashboard.overview.statWinRate} value="68%" icon={ChartIcon} />
          <StatTile label={t.dashboard.shell.navTournaments} value="4" icon={TrophyIcon} />
          <StatTile label={t.dashboard.profile.historyTitle} value={String(matches.length)} icon={CalendarIcon} />
        </div>
      </div>

      <div className="mt-8">
        <SectionHeading tone="blue">{t.dashboard.profile.historyTitle}</SectionHeading>
        <div className="space-y-2">
          {matches.map((m) => (
            <MiniMatchRow key={m.id} match={m} />
          ))}
        </div>
      </div>

      {user.verificationStatus !== "verified" ? <VerifyAccountSection /> : null}
    </div>
  );
}
