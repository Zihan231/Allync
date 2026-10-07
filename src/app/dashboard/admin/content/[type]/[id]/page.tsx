"use client";

import { use, useEffect, useState } from "react";
import Link from "next/link";
import { useLanguage } from "@/lib/i18n/LanguageContext";
import { format } from "@/lib/i18n/translations";
import { useSession } from "@/lib/session/SessionContext";
import { useToast } from "@/lib/useToast";
import { ToastContainer } from "@/components/common/Toast";
import { Avatar } from "@/components/common/Avatar";
import { BackButton } from "@/components/dashboard/BackButton";
import { Badge, Button, EmptyRow, Field, Kpi, Modal, Panel, ReasonDialog, fmtDate, fmtDateTime, inputClass } from "@/components/admin/ui";
import { getAdminUsers, hasRole } from "@/lib/api/admin";
import {
  searchCommunityMembers,
  type LeaderRole,
  type ManageAction,
  type ManagedClub,
  type ManagedCommunity,
  type ManagedTournament,
  type Member,
} from "@/lib/api/adminManage";
import { useAdminContent, useManageAction, useManagedClub, useManagedCommunity, useManagedTournament } from "@/lib/api/hooks/useAdmin";
import { WalletPanel } from "@/components/admin/WalletTools";

type Run = (action: ManageAction, done?: () => void) => Promise<void>;

/** Staff page for one club, community or tournament. */
export default function ManagePage({ params }: { params: Promise<{ type: string; id: string }> }) {
  const { type, id } = use(params);
  const { t } = useLanguage();
  const { toasts, toast, dismiss } = useToast();
  const mutation = useManageAction();
  const run: Run = async (action, done) => {
    try {
      await mutation.mutateAsync(action);
      done?.();
      toast(t.admin.manage.saved, "success");
    } catch (err) {
      toast((err as { message?: string }).message ?? t.admin.common.errGeneric, "error");
    }
  };
  return (
    <div>
      <BackButton href="/dashboard/admin/content" />
      <div className="mt-4">
        {type === "club" ? <ClubManage id={id} run={run} busy={mutation.isPending} notify={toast} /> : null}
        {type === "community" ? <CommunityManage id={id} run={run} busy={mutation.isPending} /> : null}
        {type === "tournament" ? <TournamentManage id={id} run={run} busy={mutation.isPending} /> : null}
      </div>
      <ToastContainer toasts={toasts} onDismiss={dismiss} />
    </div>
  );
}

// --------------------------------------------------------------- shared bits

function FrozenBanner({ item }: { item: { frozenAt: string | null; frozenReason: string | null; frozenByName: string | null } }) {
  const { t, locale } = useLanguage();
  if (!item.frozenAt) return null;
  return (
    <p className="mt-4 rounded-xl bg-blue-soft p-3 text-sm text-ink">
      ❄ {format(t.admin.manage.frozenBanner, { name: item.frozenByName ?? "ALLYNQ", date: fmtDate(item.frozenAt, locale), reason: item.frozenReason ?? "" })}
    </p>
  );
}

function Header({ name, dpUrl, sub, badges }: { name: string; dpUrl?: string | null; sub?: React.ReactNode; badges?: React.ReactNode }) {
  return (
    <div className="flex flex-wrap items-center gap-3">
      {dpUrl !== undefined ? <Avatar dpUrl={dpUrl} name={name} size="lg" mode="static" /> : null}
      <div className="min-w-0">
        <div className="flex flex-wrap items-center gap-2">
          <h1 className="font-display text-2xl font-black text-ink">{name}</h1>
          {badges}
        </div>
        {sub ? <div className="mt-0.5 text-sm text-ink-soft">{sub}</div> : null}
      </div>
    </div>
  );
}

function FreezeButtons({ item, target, run, busy }: { item: { id: string; name: string; frozenAt: string | null }; target: "club" | "community"; run: Run; busy: boolean }) {
  const { t } = useLanguage();
  const tm = t.admin.manage;
  const [open, setOpen] = useState<"freeze" | "unfreeze" | null>(null);
  return (
    <>
      <Button small variant={item.frozenAt ? "outline" : "danger"} onClick={() => setOpen(item.frozenAt ? "unfreeze" : "freeze")}>
        {item.frozenAt ? tm.unfreeze : tm.freeze}
      </Button>
      {open ? (
        <ReasonDialog
          title={format(open === "freeze" ? tm.freezeTitle : tm.unfreezeTitle, { name: item.name })}
          body={open === "freeze" ? tm.freezeBody : undefined}
          confirmLabel={open === "freeze" ? tm.freeze : tm.unfreeze}
          danger={open === "freeze"}
          reasonRequired={open === "freeze"}
          busy={busy}
          onCancel={() => setOpen(null)}
          onConfirm={(reason) => run({ kind: open, target, id: item.id, body: { reason: reason || undefined } }, () => setOpen(null))}
        />
      ) : null}
    </>
  );
}

/** Edit dialog for a few text / number fields; only changed values are sent. */
function EditDialog<T extends Record<string, string | number | null>>({
  title,
  initial,
  labels,
  busy,
  onCancel,
  onSave,
}: {
  title: string;
  initial: T;
  labels: Record<keyof T, string>;
  busy: boolean;
  onCancel: () => void;
  onSave: (patch: Partial<Record<keyof T, string | number>>, reason: string) => void;
}) {
  const { t } = useLanguage();
  const [form, setForm] = useState<Record<string, string>>(Object.fromEntries(Object.entries(initial).map(([k, v]) => [k, v == null ? "" : String(v)])));
  const patch = Object.fromEntries(
    Object.entries(form)
      .filter(([k, v]) => v !== (initial[k] == null ? "" : String(initial[k])))
      .map(([k, v]) => [k, typeof initial[k] === "number" ? Number(v) : v]),
  ) as Partial<Record<keyof T, string | number>>;
  return (
    <ReasonDialog
      title={title}
      confirmLabel={t.admin.common.save}
      reasonRequired={false}
      reasonLabel={t.admin.common.reasonInternal}
      canSubmit={Object.keys(patch).length > 0}
      busy={busy}
      extra={
        <div className="grid gap-3 sm:grid-cols-2">
          {Object.keys(initial).map((k) => (
            <Field key={k} label={labels[k as keyof T]}>
              <input
                value={form[k]}
                type={typeof initial[k] === "number" ? "number" : "text"}
                onChange={(e) => setForm({ ...form, [k]: e.target.value })}
                className={inputClass}
              />
            </Field>
          ))}
        </div>
      }
      onCancel={onCancel}
      onConfirm={(reason) => onSave(patch, reason)}
    />
  );
}

/** Pick a person (from a fixed list, or by searching) to become a leader. */
function LeaderDialog({
  title,
  body,
  candidates,
  search,
  busy,
  onCancel,
  onConfirm,
}: {
  title: string;
  body: string;
  candidates?: Member[];
  search?: (q: string) => Promise<Array<{ userId: string; name: string; dpUrl: string | null; role: string }>>;
  busy: boolean;
  onCancel: () => void;
  onConfirm: (userId: string, reason: string) => void;
}) {
  const { t } = useLanguage();
  const tm = t.admin.manage;
  const [query, setQuery] = useState("");
  const [found, setFound] = useState<Array<{ userId: string; name: string; dpUrl: string | null; role: string }>>(candidates ?? []);
  const [picked, setPicked] = useState<string | null>(null);

  useEffect(() => {
    if (!search) return;
    let alive = true;
    const id = setTimeout(() => {
      search(query)
        .then((rows) => alive && setFound(rows))
        .catch(() => undefined);
    }, 300);
    return () => {
      alive = false;
      clearTimeout(id);
    };
  }, [query, search]);

  const shown = search ? found : (candidates ?? []).filter((c) => c.name.toLowerCase().includes(query.trim().toLowerCase()));
  return (
    <ReasonDialog
      title={title}
      body={body}
      confirmLabel={t.admin.common.save}
      canSubmit={Boolean(picked)}
      busy={busy}
      extra={
        <Field label={tm.pickMember}>
          <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder={tm.searchMember} className={inputClass} />
          <ul className="mt-2 max-h-56 space-y-1 overflow-y-auto">
            {shown.slice(0, 30).map((m) => (
              <li key={m.userId}>
                <button
                  type="button"
                  onClick={() => setPicked(m.userId)}
                  className={`flex w-full items-center gap-2 rounded-lg border px-2.5 py-1.5 text-left text-sm ${
                    picked === m.userId ? "border-accent bg-accent-soft/40 text-ink" : "border-transparent text-ink-soft hover:bg-surface"
                  }`}
                >
                  <Avatar dpUrl={m.dpUrl} name={m.name} size="sm" mode="static" />
                  <span className="flex-1 truncate">{m.name}</span>
                  <span className="text-[11px] text-ink-faint">{m.role}</span>
                </button>
              </li>
            ))}
          </ul>
        </Field>
      }
      onCancel={onCancel}
      onConfirm={(reason) => picked && onConfirm(picked, reason)}
    />
  );
}

function LeaderRows({ roles, people, onChange, canEdit }: { roles: LeaderRole[]; people: Member[]; onChange: (role: LeaderRole) => void; canEdit: boolean }) {
  const { t } = useLanguage();
  const tm = t.admin.manage;
  return (
    <ul className="space-y-2">
      {roles.map((role) => {
        const holders = people.filter((p) => p.role === role);
        return (
          <li key={role} className="flex items-center gap-3">
            <span className="w-36 shrink-0 font-mono text-[10px] uppercase text-ink-faint">{tm.roles[role]}</span>
            <span className="min-w-0 flex-1 truncate text-sm text-ink">
              {holders.length ? (
                holders.map((h) => (
                  <Link key={h.userId} href={`/dashboard/admin/users/${h.userId}`} className="mr-2 hover:text-accent-ink">
                    {h.name}
                  </Link>
                ))
              ) : (
                <span className="text-ink-faint">{tm.vacant}</span>
              )}
            </span>
            {canEdit ? (
              <Button small variant="outline" onClick={() => onChange(role)}>
                {tm.change}
              </Button>
            ) : null}
          </li>
        );
      })}
    </ul>
  );
}

// --------------------------------------------------------------------- clubs

function ClubManage({ id, run, busy, notify }: { id: string; run: Run; busy: boolean; notify: (text: string, tone: "success" | "error") => void }) {
  const { t, locale } = useLanguage();
  const tm = t.admin.manage;
  const { data: club, isLoading, error } = useManagedClub(id);
  const { data: allCommunities } = useAdminContent("community", { limit: 200 });
  const [dialog, setDialog] = useState<null | "edit" | LeaderRole | { remove: { id: string; name: string } }>(null);
  const [addCommunity, setAddCommunity] = useState("");

  if (isLoading) return <div className="h-96 animate-pulse rounded-2xl bg-surface/40" />;
  if (error || !club) return <EmptyRow>{(error as { message?: string } | null)?.message ?? t.admin.common.noResults}</EmptyRow>;
  const c: ManagedClub = club;
  const available = (allCommunities?.data ?? []).filter((x) => !c.communities.some((m) => m.id === x.id));

  return (
    <div>
      <Header
        name={c.name}
        dpUrl={c.dpUrl}
        sub={[c.motto, c.location, format(t.admin.content.created, { date: fmtDate(c.createdAt, locale) })].filter(Boolean).join(" · ")}
        badges={c.frozenAt ? <Badge tone="blue">{tm.frozenShort}</Badge> : null}
      />
      <FrozenBanner item={c} />
      <div className="mt-4 flex flex-wrap gap-2">
        <Button small variant="outline" onClick={() => setDialog("edit")}>
          {tm.edit}
        </Button>
        <FreezeButtons item={c} target="club" run={run} busy={busy} />
        <a href={`/dashboard/efootball/clubs/${c.id}`} className="self-center text-xs font-bold text-accent-ink hover:underline">
          {t.admin.content.open} →
        </a>
      </div>

      <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Kpi label={tm.stats.members} value={`${c.members.length}/${c.maxRoster}`} />
        <Kpi label={tm.stats.hostedTournaments} value={String(c.stats.hostedTournaments)} />
        <Kpi label={tm.stats.openOffers} value={String(c.stats.openOffers)} />
        <Kpi label={tm.stats.openReports} value={String(c.stats.openReports)} href={`/dashboard/admin/reports?targetId=${c.id}`} />
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-2">
        <Panel title={tm.leaders}>
          <LeaderRows roles={["President", "General Secretary"]} people={c.members} onChange={(role) => setDialog(role)} canEdit />
        </Panel>
        <Panel title={tm.communities}>
          {c.communities.length ? (
            <ul className="space-y-1.5">
              {c.communities.map((co) => (
                <li key={co.id} className="flex items-center justify-between gap-2 text-sm">
                  <Link href={`/dashboard/admin/content/community/${co.id}`} className="truncate text-ink hover:text-accent-ink">
                    {co.name}
                  </Link>
                  <Button small onClick={() => setDialog({ remove: co })}>
                    {tm.removeFromCommunity}
                  </Button>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-ink-faint">–</p>
          )}
          <div className="mt-3 flex gap-2">
            <select value={addCommunity} onChange={(e) => setAddCommunity(e.target.value)} className={inputClass}>
              <option value="">{tm.pickCommunity}</option>
              {available.map((x) => (
                <option key={x.id} value={x.id}>
                  {x.name}
                </option>
              ))}
            </select>
            <Button small variant="primary" disabled={!addCommunity || busy} onClick={() => run({ kind: "clubCommunity", id, body: { communityId: addCommunity, action: "add" } }, () => setAddCommunity(""))}>
              {tm.addToCommunity}
            </Button>
          </div>
        </Panel>
      </div>

      <div className="mt-4">
        <WalletPanel ownerType="club" ownerId={c.id} ownerName={c.name} onMessage={notify} />
      </div>

      <Panel title={format(tm.members, { count: c.members.length })} className="mt-4">
        <ul className="grid gap-1.5 sm:grid-cols-2 lg:grid-cols-3">
          {c.members.map((m) => (
            <li key={m.userId}>
              <Link href={`/dashboard/admin/users/${m.userId}`} className="flex items-center gap-2 rounded-lg px-2 py-1.5 text-sm hover:bg-surface">
                <Avatar dpUrl={m.dpUrl} name={m.name} size="sm" mode="static" />
                <span className="flex-1 truncate text-ink">{m.name}</span>
                <span className="text-[11px] text-ink-faint">{m.role}</span>
              </Link>
            </li>
          ))}
        </ul>
      </Panel>

      {dialog === "edit" ? (
        <EditDialog
          title={format(tm.editTitle, { name: c.name })}
          initial={{ name: c.name, motto: c.motto, location: c.location, minRoster: c.minRoster, maxRoster: c.maxRoster }}
          labels={tm.fields}
          busy={busy}
          onCancel={() => setDialog(null)}
          onSave={(patch, reason) => run({ kind: "editClub", id, body: { ...patch, reason: reason || undefined } }, () => setDialog(null))}
        />
      ) : null}
      {dialog === "President" || dialog === "General Secretary" ? (
        <LeaderDialog
          title={format(tm.leaderTitle, { role: tm.roles[dialog], name: c.name })}
          body={format(tm.leaderBody, { role: tm.roles[dialog] })}
          candidates={c.members.filter((m) => m.role !== dialog && m.role !== "President")}
          busy={busy}
          onCancel={() => setDialog(null)}
          onConfirm={(userId, reason) => run({ kind: "clubLeader", id, body: { userId, role: dialog, reason } }, () => setDialog(null))}
        />
      ) : null}
      {dialog && typeof dialog === "object" ? (
        <ReasonDialog
          title={format(tm.removeCommunityTitle, { club: c.name, community: dialog.remove.name })}
          body={tm.removeCommunityBody}
          confirmLabel={tm.removeFromCommunity}
          danger
          reasonRequired={false}
          reasonLabel={t.admin.common.reasonInternal}
          busy={busy}
          onCancel={() => setDialog(null)}
          onConfirm={(reason) => run({ kind: "clubCommunity", id, body: { communityId: dialog.remove.id, action: "remove", reason: reason || undefined } }, () => setDialog(null))}
        />
      ) : null}
    </div>
  );
}

// --------------------------------------------------------------- communities

function CommunityManage({ id, run, busy }: { id: string; run: Run; busy: boolean }) {
  const { t, locale } = useLanguage();
  const tm = t.admin.manage;
  const { data: community, isLoading, error } = useManagedCommunity(id);
  const [dialog, setDialog] = useState<null | "edit" | LeaderRole>(null);

  if (isLoading) return <div className="h-96 animate-pulse rounded-2xl bg-surface/40" />;
  if (error || !community) return <EmptyRow>{(error as { message?: string } | null)?.message ?? t.admin.common.noResults}</EmptyRow>;
  const c: ManagedCommunity = community;

  return (
    <div>
      <Header
        name={c.name}
        dpUrl={c.dpUrl}
        sub={[c.motto, c.location, c.tier, format(t.admin.content.created, { date: fmtDate(c.createdAt, locale) })].filter(Boolean).join(" · ")}
        badges={c.frozenAt ? <Badge tone="blue">{tm.frozenShort}</Badge> : null}
      />
      <FrozenBanner item={c} />
      <div className="mt-4 flex flex-wrap gap-2">
        <Button small variant="outline" onClick={() => setDialog("edit")}>
          {tm.edit}
        </Button>
        <FreezeButtons item={c} target="community" run={run} busy={busy} />
        <a href={`/dashboard/efootball/community/${c.id}`} className="self-center text-xs font-bold text-accent-ink hover:underline">
          {t.admin.content.open} →
        </a>
      </div>

      <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Kpi label={tm.stats.members} value={String(c.stats.members)} />
        <Kpi label={format(tm.clubs, { count: c.clubs.length })} value={String(c.clubs.length)} />
        <Kpi label={tm.stats.tournaments} value={String(c.stats.tournaments)} />
        <Kpi label={tm.stats.openReports} value={String(c.stats.openReports)} />
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-2">
        <Panel title={tm.leaders}>
          <LeaderRows roles={["President", "Vice President"]} people={c.leaders} onChange={(role) => setDialog(role)} canEdit />
          {c.leaders.filter((l) => l.role !== "President" && l.role !== "Vice President").length ? (
            <ul className="mt-3 space-y-1 border-t border-surface-line/70 pt-2 text-xs text-ink-soft">
              {c.leaders
                .filter((l) => l.role !== "President" && l.role !== "Vice President")
                .map((l) => (
                  <li key={l.userId}>
                    {l.role}: {l.name}
                  </li>
                ))}
            </ul>
          ) : null}
        </Panel>
        <Panel title={format(tm.clubs, { count: c.clubs.length })}>
          <ul className="max-h-72 space-y-1 overflow-y-auto">
            {c.clubs.map((club) => (
              <li key={club.id}>
                <Link href={`/dashboard/admin/content/club/${club.id}`} className="flex items-center gap-2 rounded-lg px-2 py-1 text-sm hover:bg-surface">
                  <Avatar dpUrl={club.dpUrl} name={club.name} size="sm" mode="static" />
                  <span className="truncate text-ink">{club.name}</span>
                </Link>
              </li>
            ))}
          </ul>
        </Panel>
      </div>

      {dialog === "edit" ? (
        <EditDialog
          title={format(tm.editTitle, { name: c.name })}
          initial={{ name: c.name, motto: c.motto, location: c.location }}
          labels={{ name: tm.fields.name, motto: tm.fields.motto, location: tm.fields.location }}
          busy={busy}
          onCancel={() => setDialog(null)}
          onSave={(patch, reason) => run({ kind: "editCommunity", id, body: { ...patch, reason: reason || undefined } }, () => setDialog(null))}
        />
      ) : null}
      {dialog === "President" || dialog === "Vice President" ? (
        <LeaderDialog
          title={format(tm.leaderTitle, { role: tm.roles[dialog], name: c.name })}
          body={format(tm.leaderBody, { role: tm.roles[dialog] })}
          search={(q) => searchCommunityMembers(id, q)}
          busy={busy}
          onCancel={() => setDialog(null)}
          onConfirm={(userId, reason) => run({ kind: "communityLeader", id, body: { userId, role: dialog, reason } }, () => setDialog(null))}
        />
      ) : null}
    </div>
  );
}

// --------------------------------------------------------------- tournaments

/** datetime-local value for an ISO time (local clock). */
function toLocalInput(iso: string | null): string {
  if (!iso) return "";
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function TournamentManage({ id, run, busy }: { id: string; run: Run; busy: boolean }) {
  const { t, locale } = useLanguage();
  const tm = t.admin.manage;
  const tt = tm.tournament;
  const { user: me } = useSession();
  const isAdmin = hasRole(me.systemRole, "admin");
  const { data: tournament, isLoading, error } = useManagedTournament(id);
  const [dialog, setDialog] = useState<null | "status" | "times" | "officials" | { remove: { id: string; name: string } }>(null);

  if (isLoading) return <div className="h-96 animate-pulse rounded-2xl bg-surface/40" />;
  if (error || !tournament) return <EmptyRow>{(error as { message?: string } | null)?.message ?? t.admin.common.noResults}</EmptyRow>;
  const tour: ManagedTournament = tournament;

  return (
    <div>
      <Header
        name={tour.name}
        sub={`${tt.host}: ${tour.hostName ?? "–"} · ${tt.creator}: ${tour.creatorName ?? "–"} · ${tour.type.toUpperCase()}`}
        badges={<Badge tone={tour.status === "ongoing" ? "success" : tour.status === "cancelled" ? "danger" : "neutral"}>{tm.statuses[tour.status]}</Badge>}
      />
      <div className="mt-4 flex flex-wrap gap-2">
        {isAdmin ? (
          <>
            <Button small variant="outline" onClick={() => setDialog("status")}>
              {tt.changeStatus}
            </Button>
            <Button small variant="outline" onClick={() => setDialog("times")}>
              {tt.editTimes}
            </Button>
          </>
        ) : null}
        <Button small variant="outline" onClick={() => setDialog("officials")}>
          {tt.editOfficials}
        </Button>
        <a href={`/dashboard/efootball/tournaments/${tour.id}`} className="self-center text-xs font-bold text-accent-ink hover:underline">
          {t.admin.content.open} →
        </a>
      </div>

      <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Kpi label={format(tt.participants, { count: tour.participants.length })} value={`${tour.participants.length}/${tour.maxParticipants}`} />
        <Kpi label={tm.stats.matches} value={`${tour.stats.matchesDone}/${tour.stats.matches}`} />
        <Kpi label={tm.stats.gamesInReview} value={String(tour.stats.gamesInReview)} href={`/dashboard/admin/disputes?tournamentId=${tour.id}`} />
        <Kpi label={tt.startAt} value={fmtDate(tour.startAt, locale)} />
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-2">
        <Panel title={tt.times}>
          <dl className="space-y-1.5 text-sm">
            <div className="flex justify-between gap-2">
              <dt className="text-ink-faint">{tt.startAt}</dt>
              <dd className="text-ink">{fmtDateTime(tour.startAt, locale)}</dd>
            </div>
            <div className="flex justify-between gap-2">
              <dt className="text-ink-faint">{tt.ends}</dt>
              <dd className="text-ink">{tour.endAt ? fmtDateTime(tour.endAt, locale) : "–"}</dd>
            </div>
            <div className="flex justify-between gap-2">
              <dt className="text-ink-faint">{tt.registrationDeadline}</dt>
              <dd className="text-ink">{tour.registrationDeadline ? fmtDateTime(tour.registrationDeadline, locale) : "–"}</dd>
            </div>
          </dl>
        </Panel>
        <Panel title={tt.officials}>
          {tour.officials.length ? (
            <ul className="space-y-1 text-sm">
              {tour.officials.map((o) => (
                <li key={o.id} className="flex items-center gap-2">
                  <Avatar dpUrl={o.dpUrl} name={o.name} size="sm" mode="static" />
                  <Link href={`/dashboard/admin/users/${o.id}`} className="text-ink hover:text-accent-ink">
                    {o.name}
                  </Link>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-warning-ink">{tt.noOfficials}</p>
          )}
        </Panel>
      </div>

      <Panel title={format(tt.participants, { count: tour.participants.length })} className="mt-4">
        {tour.format ? <p className="mb-2 text-xs text-ink-faint">{tt.locked}</p> : null}
        <ul className="divide-y divide-surface-line/70">
          {tour.participants.map((p) => (
            <li key={p.id} className="flex items-center gap-2 py-2 text-sm">
              <Avatar dpUrl={p.dpUrl} name={p.name} size="sm" mode="static" />
              <Link
                href={p.clubId ? `/dashboard/admin/content/club/${p.clubId}` : `/dashboard/admin/users/${p.userId}`}
                className="flex-1 truncate text-ink hover:text-accent-ink"
              >
                {p.name}
              </Link>
              <span className="text-[11px] text-ink-faint">{p.status}</span>
              {isAdmin && !tour.format ? (
                <Button small onClick={() => setDialog({ remove: p })}>
                  {tt.removeEntry}
                </Button>
              ) : null}
            </li>
          ))}
        </ul>
      </Panel>

      {dialog === "status" ? <StatusDialog tour={tour} busy={busy} onCancel={() => setDialog(null)} run={run} /> : null}
      {dialog === "times" ? <TimesDialog tour={tour} busy={busy} onCancel={() => setDialog(null)} run={run} /> : null}
      {dialog === "officials" ? <OfficialsDialog tour={tour} busy={busy} onCancel={() => setDialog(null)} run={run} /> : null}
      {dialog && typeof dialog === "object" ? (
        <ReasonDialog
          title={format(tt.removeEntryTitle, { name: dialog.remove.name, tournament: tour.name })}
          body={tt.removeEntryBody}
          confirmLabel={tt.removeEntry}
          danger
          busy={busy}
          onCancel={() => setDialog(null)}
          onConfirm={(reason) => run({ kind: "removeEntry", id, participantId: dialog.remove.id, body: { reason } }, () => setDialog(null))}
        />
      ) : null}
    </div>
  );
}

function StatusDialog({ tour, busy, onCancel, run }: { tour: ManagedTournament; busy: boolean; onCancel: () => void; run: Run }) {
  const { t } = useLanguage();
  const tm = t.admin.manage;
  const options = (["registration_open", "ongoing", "completed", "cancelled"] as const).filter((s) => s !== tour.status);
  const [status, setStatus] = useState<string>(options[0]);
  return (
    <ReasonDialog
      title={format(tm.tournament.statusTitle, { name: tour.name })}
      body={tm.tournament.statusBody}
      confirmLabel={tm.tournament.changeStatus}
      danger={status === "cancelled"}
      busy={busy}
      extra={
        <Field label={tm.tournament.status}>
          <select value={status} onChange={(e) => setStatus(e.target.value)} className={inputClass}>
            {options.map((s) => (
              <option key={s} value={s}>
                {tm.statuses[s]}
              </option>
            ))}
          </select>
        </Field>
      }
      onCancel={onCancel}
      onConfirm={(reason) => run({ kind: "tournamentStatus", id: tour.id, body: { status, reason } }, onCancel)}
    />
  );
}

function TimesDialog({ tour, busy, onCancel, run }: { tour: ManagedTournament; busy: boolean; onCancel: () => void; run: Run }) {
  const { t } = useLanguage();
  const tt = t.admin.manage.tournament;
  const initial = { startAt: toLocalInput(tour.startAt), endAt: toLocalInput(tour.endAt), registrationDeadline: toLocalInput(tour.registrationDeadline) };
  const [form, setForm] = useState(initial);
  const iso = (v: string) => (v ? new Date(v).toISOString() : "");
  const body = Object.fromEntries(
    (Object.keys(form) as Array<keyof typeof form>).filter((k) => form[k] !== initial[k]).map((k) => [k, iso(form[k])]),
  );
  return (
    <ReasonDialog
      title={format(tt.timesTitle, { name: tour.name })}
      confirmLabel={t.admin.common.save}
      reasonRequired={false}
      reasonLabel={t.admin.common.reasonPlaceholder}
      canSubmit={Object.keys(body).length > 0 && Boolean(form.startAt)}
      busy={busy}
      extra={
        <div className="grid gap-3">
          {(["startAt", "endAt", "registrationDeadline"] as const).map((k) => (
            <Field key={k} label={tt[k]}>
              <input type="datetime-local" value={form[k]} onChange={(e) => setForm({ ...form, [k]: e.target.value })} className={inputClass} />
            </Field>
          ))}
        </div>
      }
      onCancel={onCancel}
      onConfirm={(reason) => run({ kind: "tournamentTimes", id: tour.id, body: { ...body, reason: reason || undefined } }, onCancel)}
    />
  );
}

function OfficialsDialog({ tour, busy, onCancel, run }: { tour: ManagedTournament; busy: boolean; onCancel: () => void; run: Run }) {
  const { t } = useLanguage();
  const tt = t.admin.manage.tournament;
  const [picked, setPicked] = useState(tour.officials.map((o) => ({ id: o.id, name: o.name })));
  const [query, setQuery] = useState("");
  const [found, setFound] = useState<Array<{ id: string; name: string; dpUrl: string | null }>>([]);
  const [reason, setReason] = useState("");

  useEffect(() => {
    let alive = true;
    const id = setTimeout(() => {
      if (!query.trim()) {
        if (alive) setFound([]);
        return;
      }
      getAdminUsers({ search: query.trim(), limit: 8 })
        .then((r) => alive && setFound(r.data.map((u) => ({ id: u.id, name: u.name, dpUrl: u.dpUrl }))))
        .catch(() => undefined);
    }, 300);
    return () => {
      alive = false;
      clearTimeout(id);
    };
  }, [query]);

  const changed = picked.map((p) => p.id).sort().join() !== tour.officials.map((o) => o.id).sort().join();
  return (
    <Modal
      title={format(tt.officialsTitle, { name: tour.name })}
      onClose={onCancel}
      footer={
        <>
          <Button onClick={onCancel}>{t.admin.common.cancel}</Button>
          <Button
            variant="primary"
            disabled={!changed || busy}
            onClick={() => run({ kind: "tournamentOfficials", id: tour.id, body: { userIds: picked.map((p) => p.id), reason: reason.trim() || undefined } }, onCancel)}
          >
            {t.admin.common.save}
          </Button>
        </>
      }
    >
      <p className="mb-3 text-sm text-ink-soft">{tt.officialsBody}</p>
      <div className="flex flex-wrap gap-1.5">
        {picked.map((p) => (
          <span key={p.id} className="inline-flex items-center gap-1 rounded-full bg-accent-soft py-0.5 pl-2.5 pr-1 text-xs text-accent-ink">
            {p.name}
            <button type="button" onClick={() => setPicked(picked.filter((x) => x.id !== p.id))} className="px-1" aria-label="Remove">
              ×
            </button>
          </span>
        ))}
      </div>
      <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder={tt.addOfficial} className={`${inputClass} mt-3`} />
      <ul className="mt-1 space-y-1">
        {found
          .filter((f) => !picked.some((p) => p.id === f.id))
          .map((f) => (
            <li key={f.id}>
              <button
                type="button"
                onClick={() => {
                  setPicked([...picked, { id: f.id, name: f.name }]);
                  setQuery("");
                }}
                className="flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-left text-sm text-ink-soft hover:bg-surface hover:text-ink"
              >
                <Avatar dpUrl={f.dpUrl} name={f.name} size="sm" mode="static" />
                {f.name}
              </button>
            </li>
          ))}
      </ul>
      <Field label={t.admin.common.reasonInternal}>
        <input value={reason} onChange={(e) => setReason(e.target.value)} maxLength={500} className={inputClass} />
      </Field>
    </Modal>
  );
}
