"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useLanguage } from "@/lib/i18n/LanguageContext";
import { format } from "@/lib/i18n/translations";
import { useToast } from "@/lib/useToast";
import { ToastContainer } from "@/components/common/Toast";
import { Avatar } from "@/components/common/Avatar";
import { PageHeader } from "@/components/dashboard/PageHeader";
import { Pagination } from "@/components/dashboard/Pagination";
import type { VerificationRow } from "@/lib/api/admin";
import { useReviewVerification, useVerifications } from "@/lib/api/hooks/useAdmin";
import { Button, EmptyRow, Field, Modal, Tabs, VerificationBadge, fmtDateTime, inputClass } from "@/components/admin/ui";
import { DocumentViewer } from "@/components/admin/DocumentViewer";
import { SearchIcon } from "@/components/icons";

type Status = "pending" | "approved" | "rejected";
const PAGE_SIZE = 12;

/** Level each document type suggests (the reviewer can change it). */
const SUGGESTED_LEVEL: Record<string, number> = {
  national_id: 3,
  passport: 3,
  birth_certificate: 2,
  driver_license: 2,
  university_docs: 1,
  college_docs: 1,
};

export default function VerificationQueuePage() {
  const { t, locale } = useLanguage();
  const tv = t.admin.verification;
  const { toasts, toast, dismiss } = useToast();
  const [status, setStatus] = useState<Status>("pending");
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [viewing, setViewing] = useState<VerificationRow | null>(null);
  const [rejecting, setRejecting] = useState<VerificationRow | null>(null);
  const [levels, setLevels] = useState<Record<string, number>>({});
  const review = useReviewVerification();
  const { data, isLoading, isFetching } = useVerifications({ status, search: search || undefined, page, limit: PAGE_SIZE });

  useEffect(() => {
    const id = setTimeout(() => {
      setSearch(searchInput.trim());
      setPage(1);
    }, 350);
    return () => clearTimeout(id);
  }, [searchInput]);

  const docLabel = (type: string | null) => (type ? ((tv.documentTypes as Record<string, string>)[type] ?? type) : "–");
  const levelFor = (row: VerificationRow) => levels[row.id] ?? SUGGESTED_LEVEL[row.documentType ?? ""] ?? 1;

  async function approve(row: VerificationRow) {
    const level = levelFor(row);
    try {
      await review.mutateAsync({ id: row.id, approve: true, level });
      toast(format(tv.approved, { level }), "success");
    } catch (err) {
      toast((err as { message?: string }).message ?? t.admin.common.errGeneric, "error");
    }
  }

  async function reject(row: VerificationRow, note: string) {
    try {
      await review.mutateAsync({ id: row.id, approve: false, note });
      setRejecting(null);
      toast(tv.rejected, "success");
    } catch (err) {
      toast((err as { message?: string }).message ?? t.admin.common.errGeneric, "error");
    }
  }

  return (
    <div>
      <PageHeader eyebrow={t.admin.eyebrow} title={tv.title} description={tv.description} />

      <div className="mt-6 flex flex-wrap items-center justify-between gap-3">
        <Tabs<Status>
          value={status}
          onChange={(s) => {
            setStatus(s);
            setPage(1);
          }}
          options={(Object.keys(tv.tabs) as Status[]).map((s) => ({ value: s, label: tv.tabs[s], count: s === status ? data?.meta.total : undefined }))}
        />
        <div className="relative w-full sm:max-w-xs">
          <SearchIcon className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-faint" />
          <input value={searchInput} onChange={(e) => setSearchInput(e.target.value)} placeholder={t.admin.common.search} className={`${inputClass} pl-9`} />
        </div>
      </div>
      <p className="mt-3 text-[11px] text-ink-faint">{tv.levelHint}</p>

      <div className={`mt-4 transition-opacity ${isFetching && !isLoading ? "opacity-60" : ""}`}>
        {isLoading ? (
          <div className="h-48 animate-pulse rounded-xl bg-surface/40" />
        ) : data?.data.length ? (
          <ul className="grid gap-3 md:grid-cols-2">
            {data.data.map((row) => (
              <li key={row.id} className="rounded-2xl border border-surface-line bg-surface/40 p-4">
                <div className="flex items-start gap-3">
                  <Avatar dpUrl={row.dpUrl} name={row.name} size="md" mode="static" />
                  <div className="min-w-0 flex-1">
                    <Link href={`/dashboard/admin/users/${row.id}`} className="block truncate font-semibold text-ink hover:text-accent-ink">
                      {row.name}
                    </Link>
                    <div className="truncate text-xs text-ink-faint">{row.email}</div>
                    <div className="mt-1.5 flex flex-wrap items-center gap-2">
                      <span className="text-sm text-ink-soft">{docLabel(row.documentType)}</span>
                      <VerificationBadge status={row.verificationStatus} level={row.verificationLevel} />
                    </div>
                    <div className="mt-1 font-mono text-[11px] text-ink-faint">
                      {status === "pending"
                        ? format(tv.submitted, { date: fmtDateTime(row.updatedAt, locale) })
                        : format(tv.reviewed, {
                            status: t.admin.users.verificationStatuses[row.verificationStatus],
                            name: row.reviewedBy ?? "–",
                            date: fmtDateTime(row.verificationReviewedAt, locale),
                          })}
                    </div>
                    {row.verificationNote ? <p className="mt-1 text-xs text-ink-soft">“{row.verificationNote}”</p> : null}
                  </div>
                </div>
                <div className="mt-3 flex flex-wrap items-end gap-2 border-t border-surface-line/70 pt-3">
                  <Button small variant="outline" onClick={() => setViewing(row)}>
                    {tv.viewDocument}
                  </Button>
                  <span className="flex-1" />
                  {status !== "approved" ? (
                    <>
                      <label className="flex items-center gap-1.5 text-xs text-ink-soft">
                        {tv.level}
                        <select
                          value={levelFor(row)}
                          onChange={(e) => setLevels({ ...levels, [row.id]: Number(e.target.value) })}
                          className="rounded-lg border border-surface-line-strong bg-surface px-2 py-1 text-xs text-ink"
                        >
                          {[1, 2, 3].map((l) => (
                            <option key={l} value={l}>
                              {l}
                            </option>
                          ))}
                        </select>
                      </label>
                      <Button small variant="primary" disabled={review.isPending} onClick={() => approve(row)}>
                        {tv.approve}
                      </Button>
                    </>
                  ) : null}
                  {status !== "rejected" ? (
                    <Button small variant="danger" disabled={review.isPending} onClick={() => setRejecting(row)}>
                      {tv.reject}
                    </Button>
                  ) : null}
                </div>
              </li>
            ))}
          </ul>
        ) : (
          <EmptyRow>{tv.empty}</EmptyRow>
        )}
      </div>
      {data && data.meta.totalPages > 1 ? (
        <div className="mt-4">
          <Pagination page={page} pageCount={data.meta.totalPages} onPageChange={setPage} />
        </div>
      ) : null}

      {viewing ? <DocumentViewer userId={viewing.id} name={viewing.name} onClose={() => setViewing(null)} /> : null}
      {rejecting ? <RejectDialog row={rejecting} busy={review.isPending} onCancel={() => setRejecting(null)} onConfirm={(note) => reject(rejecting, note)} /> : null}
      <ToastContainer toasts={toasts} onDismiss={dismiss} />
    </div>
  );
}

function RejectDialog({ row, busy, onCancel, onConfirm }: { row: VerificationRow; busy: boolean; onCancel: () => void; onConfirm: (note: string) => void }) {
  const { t } = useLanguage();
  const tv = t.admin.verification;
  const [note, setNote] = useState("");
  return (
    <Modal
      title={`${tv.reject}: ${row.name}`}
      onClose={onCancel}
      footer={
        <>
          <Button onClick={onCancel}>{t.admin.common.cancel}</Button>
          <Button variant="danger" disabled={note.trim().length < 3 || busy} onClick={() => onConfirm(note.trim())}>
            {tv.reject}
          </Button>
        </>
      }
    >
      <Field label={tv.rejectNote}>
        <textarea value={note} onChange={(e) => setNote(e.target.value)} rows={3} maxLength={500} placeholder={tv.rejectPlaceholder} className={inputClass} />
      </Field>
    </Modal>
  );
}
