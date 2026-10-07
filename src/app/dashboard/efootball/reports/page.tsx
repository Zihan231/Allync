"use client";

import { useEffect, useState } from "react";
import { useLanguage } from "@/lib/i18n/LanguageContext";
import { format } from "@/lib/i18n/translations";
import { useConfirm } from "@/lib/useConfirm";
import { ConfirmDialog } from "@/components/common/ConfirmDialog";
import { PageHeader } from "@/components/dashboard/PageHeader";
import { Pagination } from "@/components/dashboard/Pagination";
import { Badge, Button, EmptyRow, fmtDateTime, inputClass, type Tone } from "@/components/admin/ui";
import { useMyReport, useMyReports, useReplyToReport, useWithdrawReport } from "@/lib/api/hooks/useReports";
import { reportTargetHref as targetHref, type MyReport, type ReportStatus } from "@/lib/api/reports";

const STATUS_TONE: Record<ReportStatus, Tone> = {
  open: "blue",
  in_review: "warning",
  action_taken: "success",
  rejected: "neutral",
  withdrawn: "neutral",
};
const ACTIVE: ReportStatus[] = ["open", "in_review"];

/** Reports the player has sent, with the staff conversation for each. */
export default function MyReportsPage() {
  const { t, locale } = useLanguage();
  const tr = t.reports;
  const [page, setPage] = useState(1);
  const [selected, setSelected] = useState<string | null>(null);
  const { data, isLoading } = useMyReports({ page, limit: 15 });

  // Notifications link here with ?id=…
  useEffect(() => {
    function fromUrl() {
      const id = new URLSearchParams(window.location.search).get("id");
      if (id) setSelected(id);
    }
    fromUrl();
  }, []);

  return (
    <div>
      <PageHeader eyebrow="eFootball" title={tr.myTitle} description={tr.myDescription} />
      <div className="mt-6 grid gap-4 lg:grid-cols-[minmax(0,2fr)_minmax(0,3fr)]">
        <div>
          {isLoading ? (
            <div className="h-48 animate-pulse rounded-xl bg-surface/40" />
          ) : data?.data.length ? (
            <ul className="space-y-2">
              {data.data.map((r) => (
                <li key={r.id}>
                  <ReportRow report={r} active={selected === r.id} onOpen={() => setSelected(r.id)} locale={locale} />
                </li>
              ))}
            </ul>
          ) : (
            <EmptyRow>{tr.empty}</EmptyRow>
          )}
          {data && data.meta.totalPages > 1 ? (
            <div className="mt-3">
              <Pagination page={page} pageCount={data.meta.totalPages} onPageChange={setPage} />
            </div>
          ) : null}
        </div>
        <div>{selected ? <ReportThread id={selected} /> : null}</div>
      </div>
    </div>
  );
}

function ReportRow({ report, active, onOpen, locale }: { report: MyReport; active: boolean; onOpen: () => void; locale: "en" | "bn" }) {
  const { t } = useLanguage();
  const tr = t.reports;
  return (
    <button
      type="button"
      onClick={onOpen}
      className={`w-full rounded-xl border p-3 text-left transition-colors ${active ? "border-accent bg-accent-soft/30" : "border-surface-line bg-surface/40 hover:border-surface-line-strong"}`}
    >
      <div className="flex items-center justify-between gap-2">
        <span className="truncate text-sm font-semibold text-ink">{report.targetName}</span>
        <Badge tone={STATUS_TONE[report.status]}>{tr.statuses[report.status]}</Badge>
      </div>
      <div className="mt-1 text-xs text-ink-soft">
        {tr.kinds[report.targetType]} · {tr.reasons[report.reason]}
      </div>
      <div className="mt-0.5 font-mono text-[10px] text-ink-faint">{format(tr.sentOn, { date: fmtDateTime(report.createdAt, locale) })}</div>
    </button>
  );
}

function ReportThread({ id }: { id: string }) {
  const { t, locale } = useLanguage();
  const tr = t.reports;
  const { data: r, isLoading, error } = useMyReport(id);
  const reply = useReplyToReport();
  const withdraw = useWithdrawReport();
  const { confirm, confirmProps } = useConfirm();
  const [body, setBody] = useState("");
  const [failure, setFailure] = useState<string | null>(null);

  if (isLoading) return <div className="h-64 animate-pulse rounded-2xl bg-surface/40" />;
  if (error || !r) return <EmptyRow>{tr.errGeneric}</EmptyRow>;
  const isActive = ACTIVE.includes(r.status);
  const href = targetHref(r.targetType, r.targetId);

  async function send() {
    setFailure(null);
    try {
      await reply.mutateAsync({ id, body: body.trim() });
      setBody("");
    } catch (err) {
      setFailure((err as { message?: string }).message ?? tr.errGeneric);
    }
  }

  async function doWithdraw() {
    const ok = await confirm(tr.withdrawBody, { title: tr.withdrawTitle, confirmLabel: tr.withdraw, cancelLabel: t.admin.common.cancel, variant: "warning" });
    if (ok) await withdraw.mutateAsync(id).catch((err) => setFailure((err as { message?: string }).message ?? tr.errGeneric));
  }

  return (
    <section className="rounded-2xl border border-surface-line bg-surface/40 p-4 sm:p-5">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div className="min-w-0">
          <div className="font-mono text-[10px] uppercase tracking-wide text-ink-faint">{tr.kinds[r.targetType]}</div>
          <h2 className="truncate font-display text-lg font-black text-ink">{r.targetName}</h2>
          {href ? (
            <a href={href} className="text-xs font-bold text-accent-ink hover:underline">
              {tr.viewTarget} →
            </a>
          ) : null}
        </div>
        <Badge tone={STATUS_TONE[r.status]}>{tr.statuses[r.status]}</Badge>
      </div>

      <div className="mt-3 text-sm font-semibold text-ink">{tr.reasons[r.reason]}</div>
      <p className="mt-1 whitespace-pre-wrap text-sm text-ink-soft">{r.details}</p>
      {r.attachments.length ? (
        <div className="mt-3">
          <div className="mb-1 font-mono text-[10px] uppercase tracking-wide text-ink-faint">{tr.proof}</div>
          <div className="flex flex-wrap gap-2">
            {r.attachments.map((url) => (
              <a key={url} href={url} target="_blank" rel="noreferrer" className="block h-20 w-20 overflow-hidden rounded-lg border border-surface-line">
                {/* eslint-disable-next-line @next/next/no-img-element -- uploaded proof served from /uploads */}
                <img src={url} alt="" className="h-full w-full object-cover" />
              </a>
            ))}
          </div>
        </div>
      ) : null}

      {r.resolution ? (
        <div className="mt-4 rounded-xl bg-bg-raised p-3">
          <div className="font-mono text-[10px] uppercase tracking-wide text-ink-faint">{tr.outcome}</div>
          <p className="mt-1 text-sm text-ink">{r.resolution}</p>
        </div>
      ) : null}

      <h3 className="mt-5 text-xs font-bold uppercase tracking-wide text-ink-faint">{tr.conversation}</h3>
      {r.messages.length ? (
        <ul className="mt-2 space-y-2">
          {r.messages.map((m) => (
            <li key={m.id} className={`flex ${m.fromStaff ? "justify-start" : "justify-end"}`}>
              <div className={`max-w-[85%] rounded-xl px-3 py-2 text-sm ${m.fromStaff ? "bg-blue-soft text-ink" : "bg-accent-soft text-ink"}`}>
                <div className="mb-0.5 font-mono text-[10px] text-ink-faint">
                  {m.fromStaff ? tr.staffName : tr.you} · {fmtDateTime(m.createdAt, locale)}
                </div>
                <p className="whitespace-pre-wrap">{m.body}</p>
              </div>
            </li>
          ))}
        </ul>
      ) : (
        <p className="mt-2 text-xs text-ink-faint">{tr.noMessages}</p>
      )}

      {isActive ? (
        <div className="mt-3 space-y-2">
          <textarea value={body} onChange={(e) => setBody(e.target.value)} rows={2} maxLength={2000} placeholder={tr.replyPlaceholder} className={inputClass} />
          <div className="flex flex-wrap justify-between gap-2">
            <Button small variant="ghost" onClick={doWithdraw} disabled={withdraw.isPending}>
              {tr.withdraw}
            </Button>
            <Button small variant="primary" onClick={send} disabled={!body.trim() || reply.isPending}>
              {tr.send}
            </Button>
          </div>
        </div>
      ) : (
        <p className="mt-3 text-xs text-ink-faint">{tr.closedNote}</p>
      )}
      {failure ? <p className="mt-2 rounded-lg bg-danger-soft px-3 py-2 text-xs text-danger-ink">{failure}</p> : null}
      <ConfirmDialog {...confirmProps} />
    </section>
  );
}
