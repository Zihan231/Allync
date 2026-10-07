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
import { Badge, Button, EmptyRow, Field, Panel, REPORT_STATUS_TONE, fmtDateTime, inputClass } from "@/components/admin/ui";
import { SuspendUntilField, localInputValue } from "@/components/admin/SuspendUntilField";
import { hasRole } from "@/lib/api/admin";
import { useAddReportNote, useAdminReport, useAssignReport, useResolveReport } from "@/lib/api/hooks/useReports";
import { reportTargetHref, type AdminReportDetail, type ReportAction } from "@/lib/api/reports";

const ACTIVE = ["open", "in_review"];

export default function AdminReportDetailPage({ params }: { params: Promise<{ reportId: string }> }) {
  const { reportId } = use(params);
  const { t, locale } = useLanguage();
  const ar = t.admin.reports;
  const tr = t.reports;
  const { user: me } = useSession();
  const { toasts, toast, dismiss } = useToast();
  const { data: r, isLoading, error } = useAdminReport(reportId);
  const assign = useAssignReport();
  const note = useAddReportNote();
  const [body, setBody] = useState("");
  const [internal, setInternal] = useState(false);

  const fail = (err: unknown) => toast((err as { message?: string }).message ?? t.admin.common.errGeneric, "error");

  if (isLoading) return <div className="h-96 animate-pulse rounded-2xl bg-surface/40" />;
  if (error || !r) return <EmptyRow>{(error as { message?: string } | null)?.message ?? ar.empty}</EmptyRow>;

  const isActive = ACTIVE.includes(r.status);
  const target = r.target as Record<string, unknown> | null;
  const publicHref = reportTargetHref(r.targetType, r.targetId, { tournamentId: target?.tournamentId as string | undefined });
  const openRelated = r.related.filter((x) => ACTIVE.includes(x.status)).length;

  async function sendNote() {
    try {
      await note.mutateAsync({ id: reportId, body: body.trim(), internal });
      setBody("");
    } catch (err) {
      fail(err);
    }
  }

  return (
    <div>
      <BackButton href="/dashboard/admin/reports" />

      {/* Header */}
      <div className="mt-4 flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <Badge tone={REPORT_STATUS_TONE[r.status]}>{ar.statusFilter[r.status]}</Badge>
            <Badge tone="neutral">{tr.kinds[r.targetType]}</Badge>
            {r.reportedAs !== "self" ? <Badge tone="accent">{ar.leader}</Badge> : null}
          </div>
          <h1 className="mt-2 font-display text-2xl font-black text-ink">{r.targetName}</h1>
          <div className="mt-1 text-sm font-semibold text-ink-soft">{tr.reasons[r.reason]}</div>
          <div className="mt-1 font-mono text-[11px] text-ink-faint">{fmtDateTime(r.createdAt, locale)}</div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs text-ink-soft">{r.assigneeName ? format(ar.assignedTo, { name: r.assigneeName }) : ar.unassigned}</span>
          {isActive && r.assigneeId !== me.id ? (
            <Button small variant="outline" disabled={assign.isPending} onClick={() => assign.mutateAsync({ id: reportId, assigneeId: me.id }).catch(fail)}>
              {ar.assignMe}
            </Button>
          ) : null}
          {isActive && r.assigneeId ? (
            <Button small disabled={assign.isPending} onClick={() => assign.mutateAsync({ id: reportId, assigneeId: null }).catch(fail)}>
              {ar.unassign}
            </Button>
          ) : null}
        </div>
      </div>

      {!isActive ? (
        <div className="mt-4 rounded-xl bg-bg-raised p-3 text-sm">
          <div className="text-ink">
            {format(ar.closedBy, { status: ar.statusFilter[r.status], name: r.resolvedByName ?? "–", date: fmtDateTime(r.resolvedAt, locale) })}
          </div>
          {r.resolutionAction ? <div className="mt-0.5 text-xs text-ink-soft">{format(ar.actionTaken, { action: ar.actions[r.resolutionAction as ReportAction] ?? r.resolutionAction })}</div> : null}
          {r.resolution ? <p className="mt-1 text-ink-soft">“{r.resolution}”</p> : null}
        </div>
      ) : null}

      <div className="mt-6 grid gap-4 lg:grid-cols-[minmax(0,3fr)_minmax(0,2fr)]">
        <div className="space-y-4">
          <Panel title={ar.details}>
            <p className="whitespace-pre-wrap text-sm text-ink">{r.details}</p>
            {r.attachments.length ? (
              <div className="mt-3">
                <div className="mb-1 font-mono text-[10px] uppercase tracking-wide text-ink-faint">{ar.proof}</div>
                <div className="flex flex-wrap gap-2">
                  {r.attachments.map((url) => (
                    <a key={url} href={url} target="_blank" rel="noreferrer" className="block h-28 w-28 overflow-hidden rounded-lg border border-surface-line">
                      {/* eslint-disable-next-line @next/next/no-img-element -- uploaded proof served from /uploads */}
                      <img src={url} alt="" className="h-full w-full object-cover" />
                    </a>
                  ))}
                </div>
              </div>
            ) : null}
          </Panel>

          {/* Conversation */}
          <Panel title={ar.thread}>
            {r.messages.length ? (
              <ul className="space-y-2">
                {r.messages.map((m) => (
                  <li key={m.id} className={`flex ${m.fromStaff ? "justify-end" : "justify-start"}`}>
                    <div
                      className={`max-w-[85%] rounded-xl px-3 py-2 text-sm ${
                        m.internal ? "border border-dashed border-warning/60 bg-warning-soft/40" : m.fromStaff ? "bg-blue-soft" : "bg-surface"
                      }`}
                    >
                      <div className="mb-0.5 flex items-center gap-1.5 font-mono text-[10px] text-ink-faint">
                        {m.authorName} · {fmtDateTime(m.createdAt, locale)}
                        {m.internal ? <Badge tone="warning">{ar.internalBadge}</Badge> : null}
                      </div>
                      <p className="whitespace-pre-wrap text-ink">{m.body}</p>
                    </div>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-xs text-ink-faint">{ar.noMessages}</p>
            )}
            <div className="mt-3 space-y-2">
              <textarea value={body} onChange={(e) => setBody(e.target.value)} rows={2} maxLength={2000} placeholder={ar.notePlaceholder} className={inputClass} />
              <div className="flex flex-wrap items-center justify-between gap-2">
                <label className="flex items-center gap-2 text-xs text-ink-soft">
                  <input type="checkbox" checked={internal} onChange={(e) => setInternal(e.target.checked)} className="h-4 w-4 accent-[var(--color-warning)]" />
                  {ar.internalToggle}
                </label>
                <Button small variant="primary" disabled={!body.trim() || note.isPending} onClick={sendNote}>
                  {ar.send}
                </Button>
              </div>
            </div>
          </Panel>

          {isActive ? (
            <ResolvePanel
              report={r}
              openRelated={openRelated}
              onDone={() => toast(ar.resolved, "success")}
              onError={fail}
              canAdmin={hasRole(me.systemRole, "admin")}
            />
          ) : null}
        </div>

        <div className="space-y-4">
          <Panel title={ar.target}>
            {target ? <TargetSummary report={r} target={target} /> : <p className="text-sm text-ink-faint">{ar.targetGone}</p>}
            <div className="mt-3 flex flex-wrap gap-2">
              {publicHref ? (
                <a href={publicHref} className="text-xs font-bold text-accent-ink hover:underline">
                  {ar.openTarget} →
                </a>
              ) : null}
              {r.targetType === "user" ? (
                <Link href={`/dashboard/admin/users/${r.targetId}`} className="text-xs font-bold text-accent-ink hover:underline">
                  {ar.staffView} →
                </Link>
              ) : null}
            </div>
          </Panel>

          <Panel title={ar.reporter}>
            <Link href={`/dashboard/admin/users/${r.reporterId}`} className="flex items-center gap-2.5">
              <Avatar dpUrl={r.reporterDpUrl} name={r.reporterName} size="sm" mode="static" />
              <span className="text-sm font-semibold text-ink hover:text-accent-ink">{r.reporterName}</span>
            </Link>
            {r.reporterClubName || r.reporterCommunityName ? (
              <div className="mt-1 text-xs text-ink-soft">{format(ar.forGroup, { name: (r.reporterClubName ?? r.reporterCommunityName)! })}</div>
            ) : null}
            <div className="mt-1 font-mono text-[11px] text-ink-faint">
              {format(ar.reporterStats, { total: r.reporterTotal, false: r.reporterFalse, strikes: r.reporterStrikes })}
            </div>
          </Panel>

          <Panel title={ar.related}>
            {r.related.length ? (
              <ul className="space-y-1.5">
                {r.related.map((x) => (
                  <li key={x.id}>
                    <Link href={`/dashboard/admin/reports/${x.id}`} className="flex items-center justify-between gap-2 text-xs hover:text-accent-ink">
                      <span className="truncate text-ink-soft">
                        {tr.reasons[x.reason]} · {x.reporterName}
                      </span>
                      <Badge tone={REPORT_STATUS_TONE[x.status]}>{ar.statusFilter[x.status]}</Badge>
                    </Link>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-xs text-ink-faint">–</p>
            )}
          </Panel>
        </div>
      </div>
      <ToastContainer toasts={toasts} onDismiss={dismiss} />
    </div>
  );
}

function TargetSummary({ report, target }: { report: AdminReportDetail; target: Record<string, unknown> }) {
  const { t, locale } = useLanguage();
  const str = (k: string) => (target[k] == null ? null : String(target[k]));
  if (report.targetType === "match") {
    return (
      <div className="text-sm">
        <div className="font-semibold text-ink">
          {str("sideA") ?? "–"} {target.scoreA != null ? `${str("scoreA")} – ${str("scoreB")}` : "vs"} {str("sideB") ?? "–"}
        </div>
        <div className="text-xs text-ink-soft">
          {str("tournamentName")} · {str("roundName")} · {str("status")}
        </div>
      </div>
    );
  }
  return (
    <div className="flex items-center gap-2.5">
      {report.targetType !== "tournament" ? <Avatar dpUrl={str("dpUrl")} name={str("name") ?? report.targetName} size="md" mode="static" /> : null}
      <div className="min-w-0 text-sm">
        <div className="truncate font-semibold text-ink">{str("name")}</div>
        <div className="flex flex-wrap gap-1.5 text-xs text-ink-soft">
          {str("clubName") ? <span>{str("clubName")}</span> : null}
          {str("communityName") ? <span>· {str("communityName")}</span> : null}
          {target.members != null ? <span>{format(t.admin.content.members, { count: Number(target.members) })}</span> : null}
          {str("status") ? <span>{str("status")}</span> : null}
          {Number(target.warningsCount ?? 0) > 0 ? <Badge tone="warning">⚠ {str("warningsCount")}</Badge> : null}
          {target.bannedAt ? <Badge tone="danger">{t.admin.users.statuses.banned}</Badge> : null}
          {target.suspendedUntil && new Date(String(target.suspendedUntil)).getTime() > Date.parse(report.createdAt) ? (
            <Badge tone="warning">{format(t.admin.users.suspendedUntil, { date: fmtDateTime(String(target.suspendedUntil), locale) })}</Badge>
          ) : null}
          {target.deletedAt ? <Badge tone="danger">{t.admin.users.statuses.deleted}</Badge> : null}
        </div>
      </div>
    </div>
  );
}

function ResolvePanel({
  report,
  openRelated,
  canAdmin,
  onDone,
  onError,
}: {
  report: AdminReportDetail;
  openRelated: number;
  canAdmin: boolean;
  onDone: () => void;
  onError: (err: unknown) => void;
}) {
  const { t } = useLanguage();
  const ar = t.admin.reports;
  const resolve = useResolveReport();
  const [outcome, setOutcome] = useState<"action_taken" | "rejected">("action_taken");
  const [action, setAction] = useState<ReportAction>("none");
  const [resolution, setResolution] = useState("");
  const [actionReason, setActionReason] = useState("");
  const [until, setUntil] = useState(localInputValue(1));
  const [falseReport, setFalseReport] = useState(false);
  const [closeSimilar, setCloseSimilar] = useState(false);

  // Which actions fit this target, and this staff member's role.
  const available: ReportAction[] =
    report.targetType === "user"
      ? ["none", "warn", "suspend", ...(canAdmin ? (["ban", "bin"] as ReportAction[]) : [])]
      : report.targetType === "match"
        ? ["none"]
        : ["none", ...(canAdmin ? (["bin"] as ReportAction[]) : [])];

  async function submit() {
    try {
      await resolve.mutateAsync({
        id: report.id,
        outcome,
        resolution: resolution.trim(),
        action: outcome === "action_taken" ? action : "none",
        actionReason: actionReason.trim() || undefined,
        until: outcome === "action_taken" && action === "suspend" ? new Date(until).toISOString() : undefined,
        falseReport: outcome === "rejected" ? falseReport : undefined,
        closeSimilar: closeSimilar || undefined,
      });
      onDone();
    } catch (err) {
      onError(err);
    }
  }

  return (
    <Panel title={ar.resolveTitle}>
      <div className="flex gap-2">
        {(["action_taken", "rejected"] as const).map((o) => (
          <button
            key={o}
            type="button"
            onClick={() => setOutcome(o)}
            className={`flex-1 rounded-lg border px-3 py-2 text-sm font-semibold ${
              outcome === o ? (o === "action_taken" ? "border-success bg-success-soft text-success-ink" : "border-surface-line-strong bg-surface text-ink") : "border-surface-line text-ink-faint"
            }`}
          >
            {ar.outcomes[o]}
          </button>
        ))}
      </div>
      <div className="mt-3 space-y-3">
        {outcome === "action_taken" && available.length > 1 ? (
          <>
            <Field label={format(ar.actionLabel, { name: report.targetName })}>
              <select value={action} onChange={(e) => setAction(e.target.value as ReportAction)} className={inputClass}>
                {available.map((a) => (
                  <option key={a} value={a}>
                    {ar.actions[a]}
                  </option>
                ))}
              </select>
            </Field>
            {action === "suspend" ? <SuspendUntilField value={until} onChange={setUntil} moderatorLimitDays={canAdmin ? undefined : 7} /> : null}
            {action !== "none" && action !== "bin" ? (
              <Field label={ar.actionReasonLabel}>
                <input value={actionReason} onChange={(e) => setActionReason(e.target.value)} maxLength={500} className={inputClass} />
              </Field>
            ) : null}
          </>
        ) : null}
        <Field label={ar.resolutionLabel}>
          <textarea value={resolution} onChange={(e) => setResolution(e.target.value)} rows={3} maxLength={1000} placeholder={ar.resolutionPlaceholder} className={inputClass} />
        </Field>
        {outcome === "rejected" ? (
          <label className="flex items-start gap-2 text-xs text-ink-soft">
            <input type="checkbox" checked={falseReport} onChange={(e) => setFalseReport(e.target.checked)} className="mt-0.5 h-4 w-4 accent-[var(--color-danger)]" />
            {ar.falseReport}
          </label>
        ) : null}
        {openRelated > 0 ? (
          <label className="flex items-start gap-2 text-xs text-ink-soft">
            <input type="checkbox" checked={closeSimilar} onChange={(e) => setCloseSimilar(e.target.checked)} className="mt-0.5 h-4 w-4 accent-[var(--color-accent)]" />
            {format(ar.closeSimilar, { count: openRelated })}
          </label>
        ) : null}
        <div className="flex justify-end">
          <Button variant={outcome === "action_taken" && action !== "none" ? "danger" : "primary"} disabled={resolution.trim().length < 3 || resolve.isPending} onClick={submit}>
            {ar.resolve}
          </Button>
        </div>
      </div>
    </Panel>
  );
}
