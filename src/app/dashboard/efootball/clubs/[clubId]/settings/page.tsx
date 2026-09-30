"use client";

import { use, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useLanguage } from "@/lib/i18n/LanguageContext";
import { format, roleLabel } from "@/lib/i18n/translations";
import { useSession } from "@/lib/session/SessionContext";
import { syncFromBackend, useMockPeople } from "@/lib/mock/communityStore";
import { ASSIGNABLE_CLUB_POSITIONS, type ClubPosition } from "@/lib/api/clubs";
import {
  useAssignClubPosition,
  useClub,
  useDeleteClub,
  useSetClubMatchOfficials,
} from "@/lib/api/hooks/useClubs";
import { useClubMembers } from "@/lib/api/hooks/useTeams";
import type { ClubMemberProfile } from "@/lib/api/teams";
import { useToast } from "@/lib/useToast";
import { useConfirm } from "@/lib/useConfirm";
import { ToastContainer } from "@/components/common/Toast";
import { ConfirmDialog } from "@/components/common/ConfirmDialog";
import { Avatar } from "@/components/common/Avatar";
import { AppLoader } from "@/components/common/AppLoader";
import { PageHeader } from "@/components/dashboard/PageHeader";
import { EmptyState } from "@/components/dashboard/EmptyState";
import { TransferAuthorityModal } from "@/components/dashboard/TransferAuthorityModal";
import {
  ArrowRightIcon,
  CheckIcon,
  ChevronDownIcon,
  CloseIcon,
  GavelIcon,
  LockIcon,
  SearchIcon,
  SettingsIcon,
  SwapIcon,
  TrashIcon,
  UsersIcon,
} from "@/components/icons";

const MAX_NOMINEES = 20;
const errorMessage = (err: unknown) => {
  const data = (err as { response?: { data?: { message?: string | string[] } } })?.response?.data;
  return Array.isArray(data?.message) ? data.message.join(", ") : data?.message;
};

/** Club Settings (President / General Secretary): details, positions, match-official nominees, danger zone. */
export default function ClubSettingsPage({ params }: { params: Promise<{ clubId: string }> }) {
  const { clubId } = use(params);
  const { t } = useLanguage();
  const cs = t.dashboard.clubSettings;
  const router = useRouter();
  const { user, isLoading: isSessionLoading, setClub } = useSession();
  const { data: club, isLoading: isClubLoading } = useClub(clubId);
  const { data: members = [], isLoading: isMembersLoading } = useClubMembers(clubId);
  const { toasts, toast, dismiss } = useToast();
  const { confirm, confirmProps } = useConfirm();
  const deleteClub = useDeleteClub();
  const [showTransfer, setShowTransfer] = useState(false);

  // The presidency transfer dialog works from the synced people store.
  const people = useMockPeople();
  useEffect(() => {
    void syncFromBackend(true);
  }, [clubId]);
  const storeMembers = useMemo(() => people.filter((p) => p.clubId === clubId), [people, clubId]);

  const myRole = user.club?.id === clubId ? user.club?.role : null;
  const isLeader = myRole === "President" || myRole === "General Secretary";
  const isPresident = myRole === "President";

  if (isSessionLoading || isClubLoading) return <AppLoader />;

  if (!club || !isLeader) {
    return (
      <div>
        <PageHeader eyebrow={cs.eyebrow} title={club?.name ?? ""} backHref={`/dashboard/efootball/clubs/${clubId}`} />
        <div className="mt-8">
          <EmptyState icon={LockIcon} title={cs.restrictedTitle} body={cs.restrictedBody} />
        </div>
      </div>
    );
  }

  async function handleDelete() {
    if (!club) return;
    const ok = await confirm(format(cs.deleteConfirm, { club: club.name }), {
      title: cs.deleteConfirmTitle,
      variant: "danger",
      confirmLabel: cs.deleteConfirmLabel,
    });
    if (!ok) return;
    try {
      await deleteClub.mutateAsync(club.id);
      setClub(null);
      router.push("/dashboard/efootball/clubs");
    } catch (err) {
      toast(errorMessage(err) || cs.deleteError, "error");
    }
  }

  return (
    <div className="mx-auto max-w-4xl">
      <PageHeader eyebrow={cs.eyebrow} title={club.name} backHref={`/dashboard/efootball/clubs/${clubId}`} />

      <div className="mt-8 space-y-6">
        {/* Club details */}
        <SettingsCard icon={SettingsIcon} title={cs.detailsTitle} body={cs.detailsBody}>
          <Link
            href={`/dashboard/efootball/clubs/${clubId}/edit`}
            className="inline-flex items-center gap-1.5 rounded-full border border-accent/40 bg-accent-soft px-4 py-2 text-sm font-semibold text-accent-ink transition-colors hover:bg-accent hover:text-bg"
          >
            {cs.detailsEdit}
            <ArrowRightIcon className="h-4 w-4" />
          </Link>
        </SettingsCard>

        {/* Positions */}
        <SettingsCard icon={UsersIcon} title={cs.positionsTitle} body={cs.positionsBody}>
          {isMembersLoading ? (
            <Spinner />
          ) : (
            <PositionsEditor clubId={clubId} members={members} onSaved={toast} />
          )}
        </SettingsCard>

        {/* Match-official nominees */}
        <SettingsCard icon={GavelIcon} title={cs.officialsTitle} body={cs.officialsBody}>
          {isMembersLoading ? (
            <Spinner />
          ) : (
            <NomineesEditor
              key={(club.matchOfficialIds ?? []).join(",")}
              clubId={clubId}
              members={members}
              initial={club.matchOfficialIds ?? []}
              onSaved={toast}
            />
          )}
        </SettingsCard>

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
                disabled={!isPresident || deleteClub.isPending}
                className="inline-flex items-center gap-1.5 rounded-full border border-danger/50 bg-danger px-4 py-2 text-sm font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-40"
              >
                <TrashIcon className="h-4 w-4" />
                {deleteClub.isPending ? cs.deleting : cs.deleteButton}
              </button>
            </DangerRow>
          </div>
        </section>
      </div>

      <TransferAuthorityModal
        open={showTransfer}
        onClose={() => setShowTransfer(false)}
        entityType="club"
        entityId={club.id}
        entityName={club.name}
        members={storeMembers}
        onSuccess={() => router.push(`/dashboard/efootball/clubs/${clubId}`)}
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

const nameOf = (m: ClubMemberProfile) => m.user?.name || "Player";

/** One row per staff position: its holder, and a member picker that saves on change. */
function PositionsEditor({
  clubId,
  members,
  onSaved,
}: {
  clubId: string;
  members: ClubMemberProfile[];
  onSaved: (message: string, variant?: "success" | "error") => void;
}) {
  const { t } = useLanguage();
  const cs = t.dashboard.clubSettings;
  const assign = useAssignClubPosition(clubId);
  const [pending, setPending] = useState<string | null>(null);
  const candidates = members
    .filter((m) => m.clubRole !== "President")
    .sort((a, b) => nameOf(a).localeCompare(nameOf(b)));

  async function change(position: (typeof ASSIGNABLE_CLUB_POSITIONS)[number], profileId: string) {
    const holder = members.find((m) => m.clubRole === position);
    // "Vacant" clears the current holder; picking someone moves the position to them.
    const target: { profileId: string; role: ClubPosition } | null = profileId
      ? { profileId, role: position }
      : holder
        ? { profileId: holder.id, role: "Player" }
        : null;
    if (!target) return;
    setPending(position);
    try {
      await assign.mutateAsync(target);
      onSaved(format(cs.positionSaved, { role: roleLabel(position, t) }), "success");
    } catch (err) {
      onSaved(errorMessage(err) || cs.positionError, "error");
    } finally {
      setPending(null);
    }
  }

  const president = members.find((m) => m.clubRole === "President");

  return (
    <div className="divide-y divide-surface-line/70 rounded-xl border border-surface-line">
      {president ? (
        <div className="flex items-center gap-3 px-3.5 py-3">
          <span className="w-36 shrink-0 font-mono text-[11px] font-bold uppercase tracking-wider text-accent-ink">
            {roleLabel("President", t)}
          </span>
          <Avatar dpUrl={president.user?.dpUrl} name={nameOf(president)} size="sm" mode="static" />
          <span className="truncate text-sm font-semibold text-ink">{nameOf(president)}</span>
        </div>
      ) : null}
      {ASSIGNABLE_CLUB_POSITIONS.map((position) => {
        const holder = members.find((m) => m.clubRole === position);
        return (
          <div key={position} className="flex flex-col gap-2 px-3.5 py-3 sm:flex-row sm:items-center">
            <span className="w-36 shrink-0 font-mono text-[11px] font-bold uppercase tracking-wider text-ink-soft">
              {roleLabel(position, t)}
            </span>
            <div className="flex min-w-0 flex-1 items-center gap-3">
              {holder ? (
                <Avatar dpUrl={holder.user?.dpUrl} name={nameOf(holder)} size="sm" mode="static" />
              ) : (
                <span className="h-8 w-8 shrink-0 rounded-full border border-dashed border-surface-line-strong" />
              )}
              <select
                value={holder?.id ?? ""}
                disabled={pending !== null}
                onChange={(e) => change(position, e.target.value)}
                aria-label={roleLabel(position, t)}
                className="min-w-0 flex-1 rounded-lg border border-surface-line bg-bg px-3 py-2 text-sm text-ink outline-none focus:border-accent disabled:opacity-50 [color-scheme:dark]"
              >
                <option value="">{cs.vacant}</option>
                {candidates.map((m) => (
                  <option key={m.id} value={m.id}>
                    {nameOf(m)}
                    {m.clubRole && m.clubRole !== "Player" && m.clubRole !== position ? ` (${roleLabel(m.clubRole, t)})` : ""}
                  </option>
                ))}
              </select>
              {pending === position ? (
                <span className="h-4 w-4 shrink-0 animate-spin rounded-full border-2 border-accent border-t-transparent" />
              ) : null}
            </div>
          </div>
        );
      })}
    </div>
  );
}

/** Chips of the club's match-official nominees, a searchable member list, and Save. */
function NomineesEditor({
  clubId,
  members,
  initial,
  onSaved,
}: {
  clubId: string;
  members: ClubMemberProfile[];
  initial: string[];
  onSaved: (message: string, variant?: "success" | "error") => void;
}) {
  const { t } = useLanguage();
  const cs = t.dashboard.clubSettings;
  const save = useSetClubMatchOfficials(clubId);
  const [selected, setSelected] = useState<string[]>(initial);
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");

  const byUser = new Map(members.map((m) => [m.userId, m]));
  const dirty = selected.length !== initial.length || selected.some((id) => !initial.includes(id));
  const full = selected.length >= MAX_NOMINEES;
  const query = search.trim().toLowerCase();
  const options = members
    .filter((m) => !query || nameOf(m).toLowerCase().includes(query))
    .sort((a, b) => nameOf(a).localeCompare(nameOf(b)));

  const toggle = (userId: string) =>
    setSelected((cur) => (cur.includes(userId) ? cur.filter((x) => x !== userId) : full ? cur : [...cur, userId]));

  async function handleSave() {
    try {
      await save.mutateAsync(selected);
      onSaved(cs.officialsSaved, "success");
    } catch (err) {
      onSaved(errorMessage(err) || cs.officialsError, "error");
    }
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between font-mono text-[10px] font-bold uppercase tracking-wider text-ink-faint">
        <span>
          {selected.length}/{MAX_NOMINEES}
        </span>
        {dirty ? <span className="text-warning-ink">{cs.officialsUnsaved}</span> : null}
      </div>

      {selected.length ? (
        <div className="flex flex-wrap gap-2">
          {selected.map((userId) => {
            const m = byUser.get(userId);
            if (!m) return null;
            return (
              <span
                key={userId}
                className="inline-flex items-center gap-2 rounded-full border border-blue/40 bg-blue-soft py-1 pl-1 pr-1.5 text-xs"
              >
                <Avatar dpUrl={m.user?.dpUrl} name={nameOf(m)} size="sm" mode="static" />
                <span className="font-semibold text-ink">{nameOf(m)}</span>
                <button
                  type="button"
                  onClick={() => toggle(userId)}
                  aria-label={nameOf(m)}
                  className="rounded-full p-1 text-ink-faint transition-colors hover:bg-danger-soft hover:text-danger-ink"
                >
                  <CloseIcon className="h-3 w-3" />
                </button>
              </span>
            );
          })}
        </div>
      ) : (
        <p className="rounded-xl border border-dashed border-surface-line px-3 py-2.5 text-xs text-ink-faint">{cs.officialsNone}</p>
      )}

      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        className={`flex w-full items-center justify-between rounded-xl border bg-bg px-3.5 py-2.5 text-left text-sm transition-colors ${
          open ? "border-blue" : "border-surface-line hover:border-surface-line-strong"
        }`}
      >
        <span className="text-ink-soft">{cs.officialsAdd}</span>
        <ChevronDownIcon className={`h-4 w-4 text-ink-faint transition-transform ${open ? "rotate-180" : ""}`} />
      </button>

      {open ? (
        <div className="overflow-hidden rounded-xl border border-surface-line-strong bg-bg-raised">
          <div className="relative border-b border-surface-line p-2">
            <SearchIcon className="pointer-events-none absolute left-5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-ink-faint" />
            <input
              type="search"
              value={search}
              autoFocus
              onChange={(e) => setSearch(e.target.value)}
              placeholder={cs.officialsSearch}
              className="w-full rounded-lg border border-surface-line bg-bg py-2 pl-9 pr-3 text-sm text-ink outline-none placeholder:text-ink-faint focus:border-blue"
            />
          </div>
          <ul className="max-h-64 overflow-y-auto p-1">
            {options.length ? (
              options.map((m) => {
                const picked = selected.includes(m.userId);
                return (
                  <li key={m.id}>
                    <button
                      type="button"
                      onClick={() => toggle(m.userId)}
                      disabled={!picked && full}
                      className={`flex w-full items-center gap-3 rounded-lg px-2.5 py-2 text-left transition-colors disabled:opacity-40 ${
                        picked ? "bg-blue-soft" : "hover:bg-surface-line/60"
                      }`}
                    >
                      <Avatar dpUrl={m.user?.dpUrl} name={nameOf(m)} size="sm" mode="static" />
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-sm font-semibold text-ink">{nameOf(m)}</span>
                        <span className="block truncate text-[11px] text-ink-faint">{roleLabel(m.clubRole ?? "Player", t)}</span>
                      </span>
                      <span
                        className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-md border ${
                          picked ? "border-blue bg-blue text-bg" : "border-surface-line-strong"
                        }`}
                      >
                        {picked ? <CheckIcon className="h-3.5 w-3.5" /> : null}
                      </span>
                    </button>
                  </li>
                );
              })
            ) : (
              <li className="px-3 py-4 text-center text-xs text-ink-faint">{cs.officialsNoResults}</li>
            )}
          </ul>
        </div>
      ) : null}

      <div className="flex justify-end">
        <button
          type="button"
          onClick={handleSave}
          disabled={!dirty || save.isPending}
          className="rounded-full bg-accent px-5 py-2 font-display text-sm font-semibold text-bg shadow-[0_0_18px_rgba(217,165,68,0.3)] transition-all hover:brightness-110 disabled:opacity-40 disabled:shadow-none"
        >
          {save.isPending ? cs.officialsSaving : cs.officialsSave}
        </button>
      </div>
    </div>
  );
}
