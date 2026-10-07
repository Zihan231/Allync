"use client";

import { use, useState } from "react";
import Link from "next/link";
import { useLanguage } from "@/lib/i18n/LanguageContext";
import { format } from "@/lib/i18n/translations";
import { useSession } from "@/lib/session/SessionContext";
import { useToast } from "@/lib/useToast";
import { ToastContainer } from "@/components/common/Toast";
import { Avatar } from "@/components/common/Avatar";
import { BackButton } from "@/components/dashboard/BackButton";
import { Pagination } from "@/components/dashboard/Pagination";
import { hasRole, type AdminUserDetail, type SystemRole, type UserAction } from "@/lib/api/admin";
import { useAdminUser, useAdminUserActivity, useUserAction } from "@/lib/api/hooks/useAdmin";
import {
  Badge,
  Button,
  EmptyRow,
  Field,
  Modal,
  Panel,
  ReasonDialog,
  RoleBadge,
  StatusBadge,
  Tabs,
  VerificationBadge,
  accountState,
  fmtDate,
  fmtDateTime,
  inputClass,
} from "@/components/admin/ui";
import { SuspendUntilField, localInputValue } from "@/components/admin/SuspendUntilField";
import { DocumentViewer } from "@/components/admin/DocumentViewer";
import { tk } from "@/components/dashboard/transfers/shared";

type Tab = "overview" | "logins" | "activity" | "audit";
const STAFF_ROLES = ["moderator", "admin", "super_admin"];
type Dialog = "warn" | "suspend" | "unsuspend" | "ban" | "unban" | "logout" | "reset" | "role" | "edit" | "bin" | null;

export default function AdminUserDetailPage({ params }: { params: Promise<{ userId: string }> }) {
  const { userId } = use(params);
  const { t, locale } = useLanguage();
  const au = t.admin.user;
  const { user: me } = useSession();
  const { toasts, toast, dismiss } = useToast();
  const { data: u, isLoading, error } = useAdminUser(userId);
  const action = useUserAction();
  const [tab, setTab] = useState<Tab>("overview");
  const [dialog, setDialog] = useState<Dialog>(null);
  const [showDoc, setShowDoc] = useState(false);

  async function run(next: UserAction) {
    try {
      await action.mutateAsync({ id: userId, action: next });
      setDialog(null);
      toast(au.done, "success");
    } catch (err) {
      toast((err as { message?: string }).message ?? t.admin.common.errGeneric, "error");
    }
  }

  if (isLoading) return <div className="h-96 animate-pulse rounded-2xl bg-surface/40" />;
  if (error || !u) {
    return <EmptyRow>{(error as { message?: string } | null)?.message ?? t.admin.common.noResults}</EmptyRow>;
  }

  const state = accountState(u);
  const isSelf = me.id === u.id;
  const isAdmin = hasRole(me.systemRole, "admin");
  const isSuper = hasRole(me.systemRole, "super_admin");
  const rank = { moderator: 1, admin: 2, super_admin: 3 } as const;
  const outranks = !isSelf && (me.systemRole ? rank[me.systemRole] : 0) > (u.systemRole ? rank[u.systemRole] : 0);
  const canAct = outranks && state !== "deleted";
  const name = u.name;

  return (
    <div>
      <BackButton href="/dashboard/admin/users" />

      {/* Header */}
      <div className="mt-4 flex flex-wrap items-start gap-4">
        <Avatar dpUrl={u.dpUrl} name={u.name} size="lg" />
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="font-display text-2xl font-black text-ink">{u.name}</h1>
            <RoleBadge role={u.systemRole} />
            <StatusBadge user={u} />
            {u.warningsCount ? <Badge tone="warning">⚠ {u.warningsCount}</Badge> : null}
          </div>
          <div className="mt-1 font-mono text-xs text-ink-faint">{u.id}</div>
          <Link href={`/dashboard/efootball/players/${u.id}`} className="mt-1 inline-block text-xs font-bold text-accent-ink hover:underline">
            {au.actions.openProfile} →
          </Link>
        </div>
      </div>

      {/* Moderation banner */}
      {state !== "active" ? (
        <div className={`mt-4 rounded-xl p-3 text-sm ${state === "suspended" ? "bg-warning-soft text-warning-ink" : "bg-danger-soft text-danger-ink"}`}>
          {state === "suspended"
            ? format(au.banner.suspended, { date: fmtDateTime(u.suspendedUntil, locale), reason: u.suspendReason ?? "" })
            : state === "banned"
              ? format(au.banner.banned, { date: fmtDate(u.bannedAt, locale), reason: u.banReason ?? "" })
              : format(au.banner.deleted, { date: fmtDate(u.deletedAt, locale) })}
        </div>
      ) : null}

      {/* Actions */}
      {canAct ? (
        <div className="mt-4 flex flex-wrap gap-2">
          <Button small variant="outline" onClick={() => setDialog("warn")}>
            {au.actions.warn}
          </Button>
          {state === "suspended" ? (
            isAdmin ? (
              <Button small variant="outline" onClick={() => setDialog("unsuspend")}>
                {au.actions.unsuspend}
              </Button>
            ) : null
          ) : state === "active" ? (
            <Button small variant="outline" onClick={() => setDialog("suspend")}>
              {au.actions.suspend}
            </Button>
          ) : null}
          {isAdmin ? (
            <>
              {state === "banned" ? (
                <Button small variant="outline" onClick={() => setDialog("unban")}>
                  {au.actions.unban}
                </Button>
              ) : (
                <Button small variant="danger" onClick={() => setDialog("ban")}>
                  {au.actions.ban}
                </Button>
              )}
              <Button small variant="outline" onClick={() => setDialog("logout")}>
                {au.actions.forceLogout}
              </Button>
              <Button small variant="outline" onClick={() => setDialog("reset")}>
                {au.actions.resetPassword}
              </Button>
              <Button small variant="outline" onClick={() => setDialog("edit")}>
                {au.actions.edit}
              </Button>
              <Button small variant="danger" onClick={() => setDialog("bin")}>
                {au.actions.moveToBin}
              </Button>
            </>
          ) : null}
        </div>
      ) : null}
      {isSuper && !isSelf && state !== "deleted" ? (
        <div className="mt-2">
          <Button small variant="outline" onClick={() => setDialog("role")}>
            {au.actions.changeRole}
          </Button>
        </div>
      ) : null}

      <div className="mt-6">
        <Tabs<Tab> value={tab} onChange={setTab} options={(Object.keys(au.tabs) as Tab[]).map((k) => ({ value: k, label: au.tabs[k] }))} />
      </div>

      <div className="mt-4">
        {tab === "overview" ? <Overview u={u} onViewDocument={() => setShowDoc(true)} /> : null}
        {tab === "logins" ? <Logins u={u} /> : null}
        {tab === "activity" ? <Activity userId={u.id} /> : null}
        {tab === "audit" ? <AuditList u={u} /> : null}
      </div>

      {/* Dialogs */}
      {dialog === "warn" ? (
        <ReasonDialog
          title={format(au.dialogs.warnTitle, { name })}
          body={au.dialogs.warnBody}
          confirmLabel={au.actions.warn}
          busy={action.isPending}
          onCancel={() => setDialog(null)}
          onConfirm={(reason) => run({ kind: "warn", reason })}
        />
      ) : null}
      {dialog === "suspend" ? (
        <SuspendDialog name={name} moderatorLimitDays={isAdmin ? undefined : 7} busy={action.isPending} onCancel={() => setDialog(null)} onConfirm={(until, reason) => run({ kind: "suspend", until, reason })} />
      ) : null}
      {dialog === "unsuspend" ? (
        <ReasonDialog
          title={format(au.dialogs.unsuspendTitle, { name })}
          confirmLabel={au.actions.unsuspend}
          reasonRequired={false}
          reasonLabel={t.admin.common.reasonInternal}
          busy={action.isPending}
          onCancel={() => setDialog(null)}
          onConfirm={(reason) => run({ kind: "unsuspend", reason: reason || undefined })}
        />
      ) : null}
      {dialog === "ban" ? (
        <ReasonDialog
          title={format(au.dialogs.banTitle, { name })}
          body={au.dialogs.banBody}
          confirmLabel={au.actions.ban}
          danger
          busy={action.isPending}
          onCancel={() => setDialog(null)}
          onConfirm={(reason) => run({ kind: "ban", reason })}
        />
      ) : null}
      {dialog === "unban" ? (
        <ReasonDialog
          title={format(au.dialogs.unbanTitle, { name })}
          confirmLabel={au.actions.unban}
          reasonRequired={false}
          reasonLabel={t.admin.common.reasonInternal}
          busy={action.isPending}
          onCancel={() => setDialog(null)}
          onConfirm={(reason) => run({ kind: "unban", reason: reason || undefined })}
        />
      ) : null}
      {dialog === "logout" ? (
        <Modal
          title={format(au.dialogs.logoutTitle, { name })}
          onClose={() => setDialog(null)}
          footer={
            <>
              <Button onClick={() => setDialog(null)}>{t.admin.common.cancel}</Button>
              <Button variant="primary" disabled={action.isPending} onClick={() => run({ kind: "force-logout" })}>
                {au.actions.forceLogout}
              </Button>
            </>
          }
        >
          <p className="text-sm text-ink-soft">{au.dialogs.logoutBody}</p>
        </Modal>
      ) : null}
      {dialog === "reset" ? <ResetDialog name={name} busy={action.isPending} onCancel={() => setDialog(null)} onConfirm={(password) => run({ kind: "reset-password", password })} /> : null}
      {dialog === "role" ? (
        <RoleDialog name={name} current={u.systemRole} busy={action.isPending} onCancel={() => setDialog(null)} onConfirm={(role, reason) => run({ kind: "role", role, reason: reason || undefined })} />
      ) : null}
      {dialog === "edit" ? <EditDialog u={u} busy={action.isPending} onCancel={() => setDialog(null)} onConfirm={(fields, reason) => run({ kind: "edit", fields, reason: reason || undefined })} /> : null}
      {dialog === "bin" ? (
        <ReasonDialog
          title={format(au.dialogs.binTitle, { name })}
          body={format(au.dialogs.binBody, { days: 30 })}
          confirmLabel={au.actions.moveToBin}
          danger
          busy={action.isPending}
          onCancel={() => setDialog(null)}
          onConfirm={(reason) => run({ kind: "bin", reason })}
        />
      ) : null}
      {showDoc ? <DocumentViewer userId={u.id} name={u.name} onClose={() => setShowDoc(false)} /> : null}
      <ToastContainer toasts={toasts} onDismiss={dismiss} />
    </div>
  );
}

function Info({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="min-w-0">
      <dt className="font-mono text-[10px] uppercase tracking-wide text-ink-faint">{label}</dt>
      <dd className="mt-0.5 truncate text-sm text-ink">{children || "–"}</dd>
    </div>
  );
}

function Overview({ u, onViewDocument }: { u: AdminUserDetail; onViewDocument: () => void }) {
  const { t, locale } = useLanguage();
  const f = t.admin.user.fields;
  const docLabels = t.admin.verification.documentTypes as Record<string, string>;
  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <Panel>
        <dl className="grid grid-cols-2 gap-4">
          <Info label={f.email}>{u.email}</Info>
          <Info label={f.phone}>{u.phoneNumber}</Info>
          <Info label={f.country}>{u.country}</Info>
          <Info label={f.division}>{[u.division, u.district].filter(Boolean).join(" · ")}</Info>
          <Info label={f.birthday}>{u.birthday ? fmtDate(u.birthday, locale) : null}</Info>
          <Info label={f.inGameId}>{u.inGameId ?? u.konamiUid}</Info>
          <Info label={f.joined}>{fmtDateTime(u.createdAt, locale)}</Info>
          <Info label={f.lastLogin}>{u.lastLoginAt ? fmtDateTime(u.lastLoginAt, locale) : t.admin.common.never}</Info>
        </dl>
      </Panel>
      <Panel>
        <dl className="grid grid-cols-2 gap-4">
          <Info label={f.club}>
            {u.clubId ? (
              <Link href={`/dashboard/efootball/clubs/${u.clubId}`} className="hover:text-accent-ink">
                {u.clubName} · {u.clubRole}
              </Link>
            ) : null}
          </Info>
          <Info label={f.community}>
            {u.communityId ? (
              <Link href={`/dashboard/efootball/community/${u.communityId}`} className="hover:text-accent-ink">
                {u.communityName} · {u.communityRole}
              </Link>
            ) : null}
          </Info>
          <Info label={f.wallet}>{u.walletTk != null ? `${tk(u.walletTk)}${u.walletHeldTk ? ` · ${f.held} ${tk(u.walletHeldTk)}` : ""}` : null}</Info>
          <Info label={f.contract}>{u.contractNo ? `${u.contractNo} · ${format(f.lockEnds, { date: fmtDate(u.lockEndsAt, locale) })}` : null}</Info>
          <Info label={f.points}>{u.points != null ? String(u.points) : null}</Info>
          <Info label={f.transfers}>{String(u.stats.transfers)}</Info>
          <Info label={f.failedLogins}>{String(u.stats.failedLogins7d)}</Info>
          <Info label={f.warnings}>{String(u.warningsCount)}</Info>
        </dl>
      </Panel>
      <Panel title={f.verification}>
        <div className="flex flex-wrap items-center gap-3">
          <VerificationBadge status={u.verificationStatus} level={u.verificationLevel} />
          <span className="text-sm text-ink-soft">{u.documentType ? docLabels[u.documentType] ?? u.documentType : t.admin.user.noDocument}</span>
          {u.hasDocument ? (
            <Button small variant="outline" onClick={onViewDocument}>
              {t.admin.user.viewDocument}
            </Button>
          ) : null}
        </div>
        {u.verificationReviewedAt ? (
          <p className="mt-2 text-xs text-ink-faint">
            {u.verificationReviewedBy} · {fmtDateTime(u.verificationReviewedAt, locale)}
            {u.verificationNote ? ` — ${u.verificationNote}` : ""}
          </p>
        ) : null}
        <a href="/dashboard/admin/verification" className="mt-2 inline-block text-xs font-bold text-accent-ink hover:underline">
          {t.admin.nav.verification} →
        </a>
      </Panel>
      <Panel title={t.admin.user.sharedIp}>
        {u.sharedIp.length ? (
          <>
            <ul className="space-y-1.5 text-sm">
              {u.sharedIp.map((o) => (
                <li key={`${o.id}-${o.ip}`} className="flex items-center justify-between gap-2">
                  <Link href={`/dashboard/admin/users/${o.id}`} className="truncate text-ink hover:text-accent-ink">
                    {o.name}
                  </Link>
                  <span className="font-mono text-xs text-ink-faint">{o.ip}</span>
                </li>
              ))}
            </ul>
            <p className="mt-2 text-[11px] text-ink-faint">{t.admin.user.sharedIpHint}</p>
          </>
        ) : (
          <p className="text-sm text-ink-faint">–</p>
        )}
      </Panel>
    </div>
  );
}

function Logins({ u }: { u: AdminUserDetail }) {
  const { t, locale } = useLanguage();
  const failures = t.admin.user.loginFailure as Record<string, string>;
  if (!u.logins.length) return <EmptyRow>{t.admin.user.noLogins}</EmptyRow>;
  return (
    <ul className="divide-y divide-surface-line/70 rounded-xl border border-surface-line">
      {u.logins.map((l) => (
        <li key={l.id} className="flex flex-wrap items-center gap-x-3 gap-y-1 px-4 py-2.5 text-sm">
          <Badge tone={l.success ? "success" : "danger"}>{l.success ? t.admin.user.loginOk : failures[l.failureReason ?? ""] ?? l.failureReason}</Badge>
          <span className="text-ink-soft">{fmtDateTime(l.createdAt, locale)}</span>
          <span className="font-mono text-xs text-ink-faint">{l.ip ?? "–"}</span>
          <span className="w-full truncate text-[11px] text-ink-faint sm:w-auto sm:flex-1">{l.userAgent}</span>
        </li>
      ))}
    </ul>
  );
}

function Activity({ userId }: { userId: string }) {
  const { t, locale } = useLanguage();
  const types = t.admin.user.activityTypes;
  const [type, setType] = useState<"all" | "account" | "moderation">("all");
  const [page, setPage] = useState(1);
  const { data, isLoading } = useAdminUserActivity(userId, { type: type === "all" ? undefined : type, page, limit: 20 });
  return (
    <div>
      <Tabs
        value={type}
        onChange={(v) => {
          setType(v);
          setPage(1);
        }}
        options={(Object.keys(types) as Array<keyof typeof types>).map((k) => ({ value: k, label: types[k] }))}
      />
      <div className="mt-3">
        {isLoading ? (
          <div className="h-32 animate-pulse rounded-xl bg-surface/40" />
        ) : data?.data.length ? (
          <ul className="divide-y divide-surface-line/70 rounded-xl border border-surface-line">
            {data.data.map((a) => (
              <li key={a.id} className="flex flex-wrap items-center gap-x-3 gap-y-1 px-4 py-2.5 text-sm">
                <span className="font-mono text-[10px] uppercase text-ink-faint">{a.type}</span>
                <span className="min-w-0 flex-1 text-ink">{a.summary}</span>
                <span className="text-xs text-ink-faint">{fmtDateTime(a.createdAt, locale)}</span>
              </li>
            ))}
          </ul>
        ) : (
          <EmptyRow>{t.admin.user.noActivity}</EmptyRow>
        )}
      </div>
      {data && data.meta.totalPages > 1 ? (
        <div className="mt-3">
          <Pagination page={page} pageCount={data.meta.totalPages} onPageChange={setPage} />
        </div>
      ) : null}
    </div>
  );
}

function AuditList({ u }: { u: AdminUserDetail }) {
  const { t, locale } = useLanguage();
  const labels = t.admin.audit.actions as Record<string, string>;
  if (!u.audit.length) return <EmptyRow>{t.admin.user.noAudit}</EmptyRow>;
  return (
    <ul className="divide-y divide-surface-line/70 rounded-xl border border-surface-line">
      {u.audit.map((a) => (
        <li key={a.id} className="px-4 py-2.5 text-sm">
          <div className="flex flex-wrap items-center gap-2">
            <span className="font-semibold text-ink">{labels[a.action] ?? a.action}</span>
            <span className="text-ink-soft">· {a.actorName}</span>
            <RoleBadge role={STAFF_ROLES.includes(a.actorRole) ? (a.actorRole as SystemRole) : null} />
            <span className="ml-auto text-xs text-ink-faint">{fmtDateTime(a.createdAt, locale)}</span>
          </div>
          {a.reason ? <p className="mt-0.5 text-xs text-ink-soft">“{a.reason}”</p> : null}
        </li>
      ))}
    </ul>
  );
}

function SuspendDialog({
  name,
  moderatorLimitDays,
  busy,
  onCancel,
  onConfirm,
}: {
  name: string;
  moderatorLimitDays?: number;
  busy: boolean;
  onCancel: () => void;
  onConfirm: (untilIso: string, reason: string) => void;
}) {
  const { t } = useLanguage();
  const [until, setUntil] = useState(localInputValue(1));
  return (
    <ReasonDialog
      title={format(t.admin.user.dialogs.suspendTitle, { name })}
      body={t.admin.user.dialogs.suspendBody}
      confirmLabel={t.admin.user.actions.suspend}
      canSubmit={Boolean(until)}
      busy={busy}
      extra={<SuspendUntilField value={until} onChange={setUntil} moderatorLimitDays={moderatorLimitDays} />}
      onCancel={onCancel}
      onConfirm={(reason) => onConfirm(new Date(until).toISOString(), reason)}
    />
  );
}

function ResetDialog({ name, busy, onCancel, onConfirm }: { name: string; busy: boolean; onCancel: () => void; onConfirm: (password: string) => void }) {
  const { t } = useLanguage();
  const d = t.admin.user.dialogs;
  const [password, setPassword] = useState("");
  return (
    <Modal
      title={format(d.resetTitle, { name })}
      onClose={onCancel}
      footer={
        <>
          <Button onClick={onCancel}>{t.admin.common.cancel}</Button>
          <Button variant="primary" disabled={password.length < 6 || busy} onClick={() => onConfirm(password)}>
            {t.admin.user.actions.resetPassword}
          </Button>
        </>
      }
    >
      <p className="mb-3 text-sm text-ink-soft">{d.resetBody}</p>
      <Field label={d.newPassword}>
        <input type="text" value={password} onChange={(e) => setPassword(e.target.value)} minLength={6} maxLength={72} autoComplete="off" className={inputClass} />
      </Field>
    </Modal>
  );
}

function RoleDialog({
  name,
  current,
  busy,
  onCancel,
  onConfirm,
}: {
  name: string;
  current: SystemRole | null;
  busy: boolean;
  onCancel: () => void;
  onConfirm: (role: SystemRole | "none", reason: string) => void;
}) {
  const { t } = useLanguage();
  const [role, setRole] = useState<SystemRole | "none">(current ?? "none");
  return (
    <ReasonDialog
      title={format(t.admin.user.dialogs.roleTitle, { name })}
      body={t.admin.user.dialogs.roleBody}
      confirmLabel={t.admin.common.save}
      reasonRequired={false}
      reasonLabel={t.admin.common.reasonInternal}
      canSubmit={role !== (current ?? "none")}
      busy={busy}
      extra={
        <Field label={t.admin.users.role}>
          <select value={role} onChange={(e) => setRole(e.target.value as SystemRole | "none")} className={inputClass}>
            <option value="none">{t.admin.roleNone}</option>
            {(Object.keys(t.admin.roles) as SystemRole[]).map((r) => (
              <option key={r} value={r}>
                {t.admin.roles[r]}
              </option>
            ))}
          </select>
        </Field>
      }
      onCancel={onCancel}
      onConfirm={(reason) => onConfirm(role, reason)}
    />
  );
}

function EditDialog({
  u,
  busy,
  onCancel,
  onConfirm,
}: {
  u: AdminUserDetail;
  busy: boolean;
  onCancel: () => void;
  onConfirm: (fields: Record<string, string>, reason: string) => void;
}) {
  const { t } = useLanguage();
  const f = t.admin.user.fields;
  const [form, setForm] = useState({
    name: u.name,
    email: u.email ?? "",
    phoneNumber: u.phoneNumber ?? "",
    country: u.country ?? "",
    division: u.division ?? "",
    district: u.district ?? "",
  });
  const changed = Object.fromEntries(
    Object.entries(form).filter(([k, v]) => v !== ((u as unknown as Record<string, string | null>)[k] ?? "")),
  ) as Record<string, string>;
  const field = (key: keyof typeof form, label: string) => (
    <Field label={label}>
      <input value={form[key]} onChange={(e) => setForm({ ...form, [key]: e.target.value })} className={inputClass} />
    </Field>
  );
  return (
    <ReasonDialog
      title={format(t.admin.user.dialogs.editTitle, { name: u.name })}
      confirmLabel={t.admin.common.save}
      reasonRequired={false}
      reasonLabel={t.admin.common.reasonInternal}
      canSubmit={Object.keys(changed).length > 0 && form.name.trim().length >= 2}
      busy={busy}
      extra={
        <div className="grid gap-3 sm:grid-cols-2">
          {field("name", t.admin.users.cols.user)}
          {field("email", f.email)}
          {field("phoneNumber", f.phone)}
          {field("country", f.country)}
          {field("division", f.division)}
          {field("district", f.district)}
        </div>
      }
      onCancel={onCancel}
      onConfirm={(reason) => onConfirm(changed, reason)}
    />
  );
}
