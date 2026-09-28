"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useLanguage } from "@/lib/i18n/LanguageContext";
import { format, formatNodes, roleLabel } from "@/lib/i18n/translations";
import { useSession } from "@/lib/session/SessionContext";
import { clubCreateBlockReason } from "@/lib/session/createPermissions";
import { useCreateClub } from "@/lib/api/hooks/useClubs";
import { isApiError } from "@/lib/api/axios";
import { colorFromString } from "@/lib/colorHash";
import { PageHeader } from "@/components/dashboard/PageHeader";
import { EntityEditForm } from "@/components/dashboard/EntityEditForm";
import { EntityGuidelinesPanel } from "@/components/dashboard/EntityGuidelinesPanel";
import { ShieldIcon, LockIcon, UsersIcon, TrophyIcon, ArrowRightIcon } from "@/components/icons";

export default function CreateClubPage() {
  const { t } = useLanguage();
  const { user, setClub } = useSession();
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const createClub = useCreateClub();

  const rules = t.dashboard.clubs.rules;
  const tips = t.dashboard.clubs.tips;

  const ruleItems = [
    { icon: LockIcon, title: rules.item1Title, body: rules.item1Body },
    { icon: ShieldIcon, title: rules.item2Title, body: rules.item2Body },
    { icon: UsersIcon, title: rules.item3Title, body: rules.item3Body },
  ];
  const tipItems = [
    { icon: LockIcon, title: tips.item1Title, body: tips.item1Body },
    { icon: UsersIcon, title: tips.item2Title, body: tips.item2Body },
    { icon: TrophyIcon, title: tips.item3Title, body: tips.item3Body },
  ];

  const handleSubmit = async ({
    name,
    description,
    dpUrl,
    coverUrl,
    joinPolicy,
    location,
  }: {
    name: string;
    description: string;
    dpUrl: string | null;
    coverUrl: string | null;
    joinPolicy: "instant" | "approval";
    location: string;
  }) => {
    const blockedReason = clubCreateBlockReason(user, t);
    if (blockedReason) {
      setError(blockedReason.full);
      return;
    }

    setError(null);
    try {
      const club = await createClub.mutateAsync({
        input: { name, description, color: colorFromString(name), joinPolicy, dpUrl, coverUrl, location },
        creatorPersonId: user.personId,
      });
      setClub({ id: club.id, name: club.name, role: "President" });
      router.push(`/dashboard/efootball/clubs/${club.id}`);
    } catch (err) {
      setError(isApiError(err) ? err.message : (err as Error)?.message || t.dashboard.createEntity.errCreateClub);
    }
  };

  return (
    <div>
      <PageHeader eyebrow="eFootball" title={t.dashboard.clubs.createCta} backHref="/dashboard/efootball/clubs" />

      {error ? (
        <div className="mt-6 rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-400">
          {error}
        </div>
      ) : null}

      {/* If user is ALREADY in a club, strictly block creating a new one */}
      {user.club ? (
        <div className="mt-8 rounded-2xl border border-warning/40 bg-surface/60 p-8 text-center backdrop-blur">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-warning-soft text-warning-ink">
            <LockIcon className="h-7 w-7" />
          </div>
          <h2 className="mt-4 font-display text-xl font-bold text-ink">
            {t.dashboard.createEntity.alreadyInClubTitle}
          </h2>
          <p className="mx-auto mt-2 max-w-md text-sm text-ink-soft">
            {formatNodes(t.dashboard.createEntity.alreadyInClubBody, {
              name: <span className="font-semibold text-accent-ink">{user.club.name}</span>,
              role: <span className="font-semibold text-ink">{roleLabel(user.club.role, t)}</span>,
            })}
          </p>
          <p className="mt-1 text-xs text-ink-faint">
            {t.dashboard.createEntity.alreadyInClubHint}
          </p>

          <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
            <Link
              href={`/dashboard/efootball/clubs/${user.club.id}`}
              className="inline-flex items-center gap-2 rounded-full bg-accent px-5 py-2.5 font-display text-sm font-semibold text-bg shadow-md transition-transform hover:-translate-y-0.5"
            >
              {format(t.dashboard.createEntity.goToMyClubNamed, { name: user.club.name })}
              <ArrowRightIcon className="h-4 w-4" />
            </Link>
            <Link
              href="/dashboard/efootball/clubs"
              className="inline-flex items-center gap-2 rounded-full border border-surface-line-strong px-5 py-2.5 font-display text-sm font-medium text-ink transition-colors hover:bg-surface"
            >
              {t.dashboard.createEntity.browseAllClubs}
            </Link>
          </div>
        </div>
      ) : clubCreateBlockReason(user, t) ? (
        // Leadership conflict: community Presidents/VPs can't found clubs and vice versa
        <div className="mt-8 rounded-2xl border border-warning/40 bg-surface/60 p-8 text-center backdrop-blur">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-warning-soft text-warning-ink">
            <LockIcon className="h-7 w-7" />
          </div>
          <h2 className="mt-4 font-display text-xl font-bold text-ink">{t.dashboard.createEntity.leadershipRoleTitle}</h2>
          <p className="mx-auto mt-2 max-w-md text-sm text-ink-soft">{clubCreateBlockReason(user, t)?.full}</p>
          <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
            <Link
              href={`/dashboard/efootball/community/${user.community?.id ?? ""}`}
              className="inline-flex items-center gap-2 rounded-full bg-accent px-5 py-2.5 font-display text-sm font-semibold text-bg shadow-md transition-transform hover:-translate-y-0.5"
            >
              {t.dashboard.createEntity.goToMyCommunity}
              <ArrowRightIcon className="h-4 w-4" />
            </Link>
          </div>
        </div>
      ) : (
        <div className="mt-8 grid gap-6 lg:grid-cols-2">
          <div className="rounded-xl border border-surface-line bg-surface/50 p-6">
            <EntityEditForm
              nameLabel={t.dashboard.clubs.createNameLabel}
              descriptionLabel={t.dashboard.clubs.descriptionLabel}
              submitLabel={createClub.isPending ? t.dashboard.createEntity.creatingClub : t.dashboard.clubs.createSubmit}
              showLocation
              locationLabel={t.dashboard.createEntity.clubLocation}
              onSubmit={handleSubmit}
            />
          </div>
          <div className="space-y-6 lg:sticky lg:top-24 lg:self-start">
            <EntityGuidelinesPanel title={rules.title} items={ruleItems} tone="rules" />
            <EntityGuidelinesPanel title={tips.title} items={tipItems} tone="tips" />
          </div>
        </div>
      )}
    </div>
  );
}
