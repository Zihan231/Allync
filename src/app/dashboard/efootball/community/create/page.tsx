"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useLanguage } from "@/lib/i18n/LanguageContext";
import { useSession } from "@/lib/session/SessionContext";
import { useCreateCommunity } from "@/lib/api/hooks/useCommunities";
import { isApiError } from "@/lib/api/axios";
import { PageHeader } from "@/components/dashboard/PageHeader";
import { EntityEditForm } from "@/components/dashboard/EntityEditForm";
import { EntityGuidelinesPanel } from "@/components/dashboard/EntityGuidelinesPanel";
import { ShieldIcon, LockIcon, UsersIcon, SwapIcon, ArrowRightIcon } from "@/components/icons";

export default function CreateCommunityPage() {
  const { t } = useLanguage();
  const { user, setCommunity } = useSession();
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const createCommunity = useCreateCommunity();

  const rules = t.dashboard.community.rules;
  const tips = t.dashboard.community.tips;

  const ruleItems = [
    { icon: LockIcon, title: rules.item1Title, body: rules.item1Body },
    { icon: ShieldIcon, title: rules.item2Title, body: rules.item2Body },
    { icon: UsersIcon, title: rules.item3Title, body: rules.item3Body },
  ];
  const tipItems = [
    { icon: ShieldIcon, title: tips.item1Title, body: tips.item1Body },
    { icon: UsersIcon, title: tips.item2Title, body: tips.item2Body },
    { icon: SwapIcon, title: tips.item3Title, body: tips.item3Body },
  ];

  const handleSubmit = async ({
    name,
    description,
    dpUrl,
    coverUrl,
    joinPolicy,
  }: {
    name: string;
    description: string;
    dpUrl: string | null;
    coverUrl: string | null;
    joinPolicy: "instant" | "approval";
  }) => {
    if (user.community) {
      setError(`You are already a member of ${user.community.name}. You cannot create a new community.`);
      return;
    }
    setError(null);

    try {
      const community = await createCommunity.mutateAsync({
        input: { name, rules: description, joinPolicy, dpUrl, coverUrl },
        creatorPersonId: user.personId,
      });

      setCommunity({ id: community.id, name: community.name, role: "President" });
      router.push(`/dashboard/efootball/community/${community.id}`);
    } catch (err) {
      setError(
        isApiError(err)
          ? err.message
          : (err as Error)?.message || "Failed to create community. Please try again."
      );
    }
  };

  return (
    <div>
      <PageHeader eyebrow="eFootball" title={t.dashboard.community.createCta} backHref="/dashboard/efootball/community" />

      {error ? (
        <div className="mt-6 rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-400">
          {error}
        </div>
      ) : null}

      {/* If user is ALREADY in a community, strictly block creating a new one */}
      {user.community ? (
        <div className="mt-8 rounded-2xl border border-warning/40 bg-surface/60 p-8 text-center backdrop-blur">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-warning-soft text-warning-ink">
            <LockIcon className="h-7 w-7" />
          </div>
          <h2 className="mt-4 font-display text-xl font-bold text-ink">
            You are already in a community
          </h2>
          <p className="mx-auto mt-2 max-w-md text-sm text-ink-soft">
            You currently belong to <span className="font-semibold text-accent-ink">{user.community.name}</span> as{" "}
            <span className="font-semibold text-ink">{user.community.role}</span>. Members and officials cannot create another community while already affiliated with an existing one.
          </p>
          <p className="mt-1 text-xs text-ink-faint">
            If you wish to create a new community, you must leave or resign from your current community first.
          </p>

          <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
            <Link
              href={`/dashboard/efootball/community/${user.community.id}`}
              className="inline-flex items-center gap-2 rounded-full bg-accent px-5 py-2.5 font-display text-sm font-semibold text-bg shadow-md transition-transform hover:-translate-y-0.5"
            >
              Go to My Community ({user.community.name})
              <ArrowRightIcon className="h-4 w-4" />
            </Link>
            <Link
              href="/dashboard/efootball/community"
              className="inline-flex items-center gap-2 rounded-full border border-surface-line-strong px-5 py-2.5 font-display text-sm font-medium text-ink transition-colors hover:bg-surface"
            >
              Browse All Communities
            </Link>
          </div>
        </div>
      ) : (
        <div className="mt-8 grid gap-6 lg:grid-cols-2">
          <div className="rounded-xl border border-surface-line bg-surface/50 p-6">
            <EntityEditForm
              nameLabel={t.dashboard.community.createNameLabel}
              descriptionLabel={t.dashboard.community.rulesLabel}
              submitLabel={createCommunity.isPending ? "Creating community..." : t.dashboard.community.createSubmit}
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
