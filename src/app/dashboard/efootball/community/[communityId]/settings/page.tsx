"use client";

import { Suspense, use, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useUrlTab } from "@/lib/navigation/useUrlTab";
import { EntityEditForm } from "@/components/dashboard/EntityEditForm";
import { useLanguage } from "@/lib/i18n/LanguageContext";
import { format, roleLabel } from "@/lib/i18n/translations";
import { useSession } from "@/lib/session/SessionContext";
import { syncFromBackend, useMockPeople } from "@/lib/mock/communityStore";
import { ASSIGNABLE_COMMUNITY_ROLES, type CommunityPosition } from "@/lib/api/communities";
import type { BackendCommunityMember } from "@/lib/api/types";
import {
  useAssignCommunityRole,
  useCommunity,
  useCommunityMembers,
  useDeleteCommunity,
  useUpdateCommunity,
} from "@/lib/api/hooks/useCommunities";
import { useToast } from "@/lib/useToast";
import { useConfirm } from "@/lib/useConfirm";
import { ToastContainer } from "@/components/common/Toast";
import { ConfirmDialog } from "@/components/common/ConfirmDialog";
import { Avatar } from "@/components/common/Avatar";
import { AppLoader } from "@/components/common/AppLoader";
import { PageHeader } from "@/components/dashboard/PageHeader";
import { EmptyState } from "@/components/dashboard/EmptyState";
import { TransferAuthorityModal } from "@/components/dashboard/TransferAuthorityModal";
import { CloseIcon, GavelIcon, LockIcon, SettingsIcon, ShieldIcon, SwapIcon, TrashIcon, UsersIcon } from "@/components/icons";

const errorMessage = (err: unknown) => {
  const data = (err as { response?: { data?: { message?: string | string[] } } })?.response?.data;
  return Array.isArray(data?.message) ? data.message.join(", ") : data?.message;
};

const SETTINGS_TABS = ["details", "positions"] as const;
const OFFICIAL_ROLES = ASSIGNABLE_COMMUNITY_ROLES.filter((r) => r !== "Vice President");

type Notify = (message: string, variant?: "success" | "error") => void;

/**
 * Community Settings, in two tabs: community details (with the danger zone), and
 * positions. The President edits everything; a Vice President can open it to hand
 * over their role, and sees the rest read-only.
 */
export default function CommunitySettingsPage({ params }: { params: Promise<{ communityId: string }> }) {
  // The tab lives in the URL (?tab=), which needs a Suspense boundary.
  return (
    <Suspense fallback={<AppLoader />}>
      <CommunitySettingsContent params={params} />
    </Suspense>
  );
}

function CommunitySettingsContent({ params }: { params: Promise<{ communityId: string }> }) {
  const { communityId } = use(params);
  const { t } = useLanguage();
  const cs = t.dashboard.communitySettings;
  const router = useRouter();
  const [tab, setTab] = useUrlTab(SETTINGS_TABS, "details");
  const { user, isLoading: isSessionLoading, setCommunity } = useSession();
  const { data: community, isLoading: isCommunityLoading } = useCommunity(communityId);
  const updateCommunity = useUpdateCommunity(communityId);
  const { data: members = [], isLoading: isMembersLoading } = useCommunityMembers(communityId);
  const { toasts, toast, dismiss } = useToast();
  const { confirm, confirmProps } = useConfirm();
  const deleteCommunity = useDeleteCommunity();
  const [showTransfer, setShowTransfer] = useState(false);

  // The authority transfer dialog works from the synced people store.
  const people = useMockPeople();
  useEffect(() => {
    void syncFromBackend(true);
  }, [communityId]);
  const storeMembers = useMemo(
    () =>
      people.filter(
        (p) => p.communityId === communityId || (p.clubId && community?.memberClubIds.includes(p.clubId)),
      ),
    [people, communityId, community],
  );

  const myRole = user.community?.id === communityId ? user.community?.role : null;
  const isPresident = myRole === "President";
  const isLeader = isPresident || myRole === "Vice President";

  if (isSessionLoading || isCommunityLoading) return <AppLoader />;

  const backHref = `/dashboard/efootball/community/${communityId}`;

  if (!community || !isLeader) {
    return (
      <div>
        <PageHeader eyebrow={cs.eyebrow} title={community?.name ?? ""} backHref={backHref} />
        <div className="mt-8">
          <EmptyState icon={LockIcon} title={cs.restrictedTitle} body={cs.restrictedBody} />
        </div>
      </div>
    );
  }

  async function handleDelete() {
    if (!community) return;
    const ok = await confirm(format(cs.deleteConfirm, { community: community.name }), {
      title: cs.deleteConfirmTitle,
      variant: "danger",
      confirmLabel: cs.deleteConfirmLabel,
    });
    if (!ok) return;
    try {
      await deleteCommunity.mutateAsync(community.id);
      setCommunity(null);
      router.push("/dashboard/efootball/community");
    } catch (err) {
      toast(errorMessage(err) || cs.deleteError, "error");
    }
  }

  const readOnlyNotice = !isPresident ? (
    <p className="flex items-start gap-2 rounded-xl border border-warning/35 bg-warning-soft/40 px-3.5 py-2.5 text-xs text-warning-ink">
      <LockIcon className="mt-px h-3.5 w-3.5 shrink-0" />
      <span>{cs.presidentOnlyEdit}</span>
    </p>
  ) : null;

  return (
    <div className="mx-auto max-w-4xl">
      <PageHeader eyebrow={cs.eyebrow} title={community.name} backHref={backHref} />

      {/* Tabs: community details (and the danger zone) | positions */}
      <div className="mt-6 flex border-b border-surface-line" role="tablist">
        {(
          [
            ["details", cs.tabDetails, SettingsIcon],
            ["positions", cs.tabPositions, UsersIcon],
          ] as const
        ).map(([key, label, Icon]) => (
          <button
            key={key}
            type="button"
            role="tab"
            aria-selected={tab === key}
            onClick={() => setTab(key)}
            className={`-mb-px flex items-center gap-2 border-b-2 px-5 py-3 font-display text-sm font-semibold transition-colors ${
              tab === key ? "border-accent text-accent-ink" : "border-transparent text-ink-soft hover:text-ink"
            }`}
          >
            <Icon className="h-4 w-4" />
            {label}
          </button>
        ))}
      </div>

      {tab === "details" ? (
        <div className="mt-6 space-y-6">
          {readOnlyNotice}

          {/* Community details (the update endpoint is President-only) */}
          {isPresident ? (
            <SettingsCard icon={SettingsIcon} title={cs.detailsTitle} body={cs.detailsBody}>
              <EntityEditForm
                key={[community.name, community.rules, community.dpUrl, community.coverUrl, community.joinPolicy, community.location].join("|")}
                nameLabel={t.dashboard.community.createNameLabel}
                descriptionLabel={t.dashboard.community.rulesLabel}
                submitLabel={updateCommunity.isPending ? cs.detailsSaving : cs.detailsSave}
                initialName={community.name}
                initialDescription={community.rules}
                initialDpUrl={community.dpUrl}
                initialCoverUrl={community.coverUrl}
                initialJoinPolicy={community.joinPolicy}
                showLocation
                locationLabel={cs.detailsLocation}
                initialLocation={community.location ?? ""}
                onSubmit={async (values) => {
                  try {
                    await updateCommunity.mutateAsync({
                      name: values.name,
                      rules: values.description,
                      dpUrl: values.dpUrl,
                      coverUrl: values.coverUrl,
                      joinPolicy: values.joinPolicy,
                      location: values.location,
                    });
                    toast(cs.detailsSaved, "success");
                  } catch (err) {
                    toast(errorMessage(err) || cs.detailsError, "error");
                  }
                }}
              />
            </SettingsCard>
          ) : null}

          {/* Danger zone */}
          <section className="rounded-2xl border border-danger/35 bg-danger-soft/20 p-5">
            <h3 className="font-display text-base font-black text-danger-ink">{cs.dangerTitle}</h3>
            <div className="mt-4 divide-y divide-danger/20">
              <DangerRow title={cs.transferTitle} body={cs.transferBody}>
                <button
                  type="button"
                  onClick={() => setShowTransfer(true)}
                  className="inline-flex items-center gap-1.5 rounded-full border border-warning/40 bg-warning-soft px-4 py-2 text-sm font-semibold text-warning-ink transition-colors hover:bg-warning/20"
                >
                  <SwapIcon className="h-4 w-4" />
                  {cs.transferButton}
                </button>
              </DangerRow>
              <DangerRow title={cs.deleteTitle} body={isPresident ? cs.deleteBody : `${cs.deleteBody} ${cs.presidentOnly}`}>
                <button
                  type="button"
                  onClick={handleDelete}
                  disabled={!isPresident || deleteCommunity.isPending}
                  className="inline-flex items-center gap-1.5 rounded-full border border-danger/50 bg-danger px-4 py-2 text-sm font-semibold text-white transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  <TrashIcon className="h-4 w-4" />
                  {deleteCommunity.isPending ? cs.deleting : cs.deleteButton}
                </button>
              </DangerRow>
            </div>
          </section>
        </div>
      ) : (
        <div className="mt-6 space-y-6">
          {readOnlyNotice}

          <SettingsCard icon={ShieldIcon} title={cs.leadersTitle} body={cs.leadersBody}>
            {isMembersLoading ? (
              <Spinner />
            ) : (
              <LeadershipEditor communityId={communityId} members={members} canEdit={isPresident} onSaved={toast} />
            )}
          </SettingsCard>

          <SettingsCard icon={GavelIcon} title={cs.officialsTitle} body={cs.officialsBody}>
            {isMembersLoading ? (
              <Spinner />
            ) : (
              <OfficialsEditor communityId={communityId} members={members} canEdit={isPresident} onSaved={toast} />
            )}
          </SettingsCard>
        </div>
      )}

      <TransferAuthorityModal
        open={showTransfer}
        onClose={() => setShowTransfer(false)}
        entityType="community"
        entityId={community.id}
        entityName={community.name}
        members={storeMembers}
        onSuccess={() => router.push(backHref)}
      />
      <ConfirmDialog {...confirmProps} />
      <ToastContainer toasts={toasts} onDismiss={dismiss} />
    </div>
  );
}

function SettingsCard({
  icon: Icon,
  title,
  body,
  children,
}: {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  body: string;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-2xl border border-surface-line bg-surface/50 p-5">
      <div className="flex items-start gap-3">
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-accent-soft text-accent-ink">
          <Icon className="h-4.5 w-4.5" />
        </span>
        <div className="min-w-0">
          <h3 className="font-display text-base font-black text-ink">{title}</h3>
          <p className="mt-0.5 text-xs leading-relaxed text-ink-faint">{body}</p>
        </div>
      </div>
      <div className="mt-4">{children}</div>
    </section>
  );
}

function DangerRow({ title, body, children }: { title: string; body: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-3 py-4 first:pt-0 last:pb-0 sm:flex-row sm:items-center sm:justify-between">
      <div className="min-w-0">
        <div className="text-sm font-bold text-ink">{title}</div>
        <p className="mt-0.5 text-xs text-ink-soft">{body}</p>
      </div>
      <div className="shrink-0">{children}</div>
    </div>
  );
}

function Spinner() {
  return (
    <div className="flex h-24 items-center justify-center">
      <div className="h-6 w-6 animate-spin rounded-full border-2 border-accent border-t-transparent" />
    </div>
  );
}

const byName = (a: BackendCommunityMember, b: BackendCommunityMember) => a.name.localeCompare(b.name);

/** Saves one role change and reports it; `pending` marks the role being saved. */
function useRoleChange(communityId: string, onSaved: Notify) {
  const { t } = useLanguage();
  const cs = t.dashboard.communitySettings;
  const assign = useAssignCommunityRole(communityId);
  const [pending, setPending] = useState<string | null>(null);

  async function change(profileId: string, role: CommunityPosition, label: string) {
    setPending(label);
    try {
      await assign.mutateAsync({ targetProfileId: profileId, role });
      onSaved(format(cs.positionSaved, { role: roleLabel(label, t) }), "success");
    } catch (err) {
      onSaved(errorMessage(err) || cs.positionError, "error");
    } finally {
      setPending(null);
    }
  }

  return { change, pending };
}

function RoleLabel({ role, accent }: { role: string; accent?: boolean }) {
  const { t } = useLanguage();
  return (
    <span
      className={`w-40 shrink-0 font-mono text-[11px] font-bold uppercase tracking-wider ${
        accent ? "text-accent-ink" : "text-ink-soft"
      }`}
    >
      {roleLabel(role, t)}
    </span>
  );
}

const selectClass =
  "min-w-0 flex-1 rounded-lg border border-surface-line bg-bg px-3 py-2 text-sm text-ink outline-none focus:border-accent disabled:opacity-50 [color-scheme:dark]";

/** The President (fixed) and the single Vice President seat. */
function LeadershipEditor({
  communityId,
  members,
  canEdit,
  onSaved,
}: {
  communityId: string;
  members: BackendCommunityMember[];
  canEdit: boolean;
  onSaved: Notify;
}) {
  const { t } = useLanguage();
  const cs = t.dashboard.communitySettings;
  const { change, pending } = useRoleChange(communityId, onSaved);
  const president = members.find((m) => m.communityRole === "President");
  const vp = members.find((m) => m.communityRole === "Vice President");
  // Leaders can't be in a club, so only members outside clubs can be Vice President.
  const candidates = members.filter((m) => m.communityRole !== "President" && !m.clubId).sort(byName);

  function pick(profileId: string) {
    if (profileId) void change(profileId, "Vice President", "Vice President");
    else if (vp) void change(vp.profileId, "Member", "Vice President");
  }

  return (
    <div className="divide-y divide-surface-line/70 rounded-xl border border-surface-line">
      {president ? (
        <div className="flex items-center gap-3 px-3.5 py-3">
          <RoleLabel role="President" accent />
          <Avatar dpUrl={president.dpUrl} name={president.name} size="sm" mode="static" />
          <span className="truncate text-sm font-semibold text-ink">{president.name}</span>
        </div>
      ) : null}
      <div className="flex flex-col gap-2 px-3.5 py-3 sm:flex-row sm:items-center">
        <RoleLabel role="Vice President" />
        <div className="flex min-w-0 flex-1 items-center gap-3">
          {vp ? (
            <Avatar dpUrl={vp.dpUrl} name={vp.name} size="sm" mode="static" />
          ) : (
            <span className="h-8 w-8 shrink-0 rounded-full border border-dashed border-surface-line-strong" />
          )}
          <select
            value={vp?.profileId ?? ""}
            disabled={!canEdit || pending !== null}
            onChange={(e) => pick(e.target.value)}
            aria-label={roleLabel("Vice President", t)}
            className={selectClass}
          >
            <option value="">{cs.vacant}</option>
            {candidates.map((m) => (
              <option key={m.profileId} value={m.profileId}>
                {m.name}
                {m.communityRole !== "Member" && m.communityRole !== "Vice President"
                  ? ` (${roleLabel(m.communityRole, t)})`
                  : ""}
              </option>
            ))}
          </select>
          {pending ? (
            <span className="h-4 w-4 shrink-0 animate-spin rounded-full border-2 border-accent border-t-transparent" />
          ) : null}
        </div>
      </div>
    </div>
  );
}

/** Team Managers, Heads of Discipline and Scouts: several holders per role. */
function OfficialsEditor({
  communityId,
  members,
  canEdit,
  onSaved,
}: {
  communityId: string;
  members: BackendCommunityMember[];
  canEdit: boolean;
  onSaved: Notify;
}) {
  const { t } = useLanguage();
  const cs = t.dashboard.communitySettings;
  const { change, pending } = useRoleChange(communityId, onSaved);
  // Only plain members and other officials can be added; the leaders keep their seats.
  const candidates = members
    .filter((m) => m.communityRole !== "President" && m.communityRole !== "Vice President")
    .sort(byName);

  return (
    <div className="divide-y divide-surface-line/70 rounded-xl border border-surface-line">
      {OFFICIAL_ROLES.map((role) => {
        const holders = members.filter((m) => m.communityRole === role).sort(byName);
        return (
          <div key={role} className="flex flex-col gap-2.5 px-3.5 py-3 sm:flex-row sm:items-start">
            <span className="pt-2">
              <RoleLabel role={role} />
            </span>
            <div className="min-w-0 flex-1 space-y-2.5">
              {holders.length ? (
                <div className="flex flex-wrap gap-2">
                  {holders.map((m) => (
                    <span
                      key={m.profileId}
                      className="inline-flex items-center gap-2 rounded-full border border-blue/40 bg-blue-soft py-1 pl-1 pr-1.5 text-xs"
                    >
                      <Avatar dpUrl={m.dpUrl} name={m.name} size="sm" mode="static" />
                      <span className="font-semibold text-ink">{m.name}</span>
                      {canEdit ? (
                        <button
                          type="button"
                          onClick={() => void change(m.profileId, "Member", role)}
                          disabled={pending !== null}
                          aria-label={format(cs.remove, { name: m.name, role: roleLabel(role, t) })}
                          className="rounded-full p-1 text-ink-faint transition-colors hover:bg-danger-soft hover:text-danger-ink disabled:opacity-40"
                        >
                          <CloseIcon className="h-3 w-3" />
                        </button>
                      ) : null}
                    </span>
                  ))}
                </div>
              ) : (
                <p className="pt-2 text-xs text-ink-faint">{cs.none}</p>
              )}
              {canEdit ? (
                <div className="flex items-center gap-3">
                  <select
                    value=""
                    disabled={pending !== null}
                    onChange={(e) => e.target.value && void change(e.target.value, role, role)}
                    aria-label={`${roleLabel(role, t)}: ${cs.addMember}`}
                    className={selectClass}
                  >
                    <option value="">{cs.addMember}</option>
                    {candidates
                      .filter((m) => m.communityRole !== role)
                      .map((m) => (
                        <option key={m.profileId} value={m.profileId}>
                          {m.name}
                          {m.communityRole !== "Member" ? ` (${roleLabel(m.communityRole, t)})` : ""}
                        </option>
                      ))}
                  </select>
                  {pending === role ? (
                    <span className="h-4 w-4 shrink-0 animate-spin rounded-full border-2 border-accent border-t-transparent" />
                  ) : null}
                </div>
              ) : null}
            </div>
          </div>
        );
      })}
    </div>
  );
}
