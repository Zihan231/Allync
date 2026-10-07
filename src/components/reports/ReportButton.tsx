"use client";

import { useEffect, useState } from "react";
import { useLanguage } from "@/lib/i18n/LanguageContext";
import { format } from "@/lib/i18n/translations";
import { useSession } from "@/lib/session/SessionContext";
import { useToast } from "@/lib/useToast";
import { ToastContainer } from "@/components/common/Toast";
import { Button, Field, Modal, inputClass } from "@/components/admin/ui";
import { FlagIcon, CloseIcon } from "@/components/icons";
import { useCreateReport } from "@/lib/api/hooks/useReports";
import { MAX_REPORT_IMAGES, REPORT_REASONS, type ReportReason, type ReportTarget, type ReportedAs } from "@/lib/api/reports";

const IMAGE_TYPES = ["image/png", "image/jpeg", "image/webp"];
const MAX_IMAGE_BYTES = 10 * 1024 * 1024;
const CLUB_LEADERS = ["President", "General Secretary"];
const COMMUNITY_LEADERS = ["President", "Vice President"];

/**
 * "Report" flag button for a player, club, community, tournament or match. Opens the report
 * form; club and community leaders can send it on behalf of their club or community.
 */
export function ReportButton({
  targetType,
  targetId,
  targetName,
  compact = false,
}: {
  targetType: ReportTarget;
  targetId: string;
  targetName: string;
  compact?: boolean;
}) {
  const { t } = useLanguage();
  const { isAuthenticated } = useSession();
  const { toasts, toast, dismiss } = useToast();
  const [open, setOpen] = useState(false);
  if (!isAuthenticated) return null;
  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        title={t.reports.button}
        className={`inline-flex items-center gap-1.5 rounded-full border border-surface-line-strong text-ink-soft transition-colors hover:border-danger hover:text-danger-ink ${
          compact ? "p-1.5" : "px-3 py-1.5 text-xs font-semibold sm:px-4 sm:py-2 sm:text-sm"
        }`}
      >
        <FlagIcon className="h-3.5 w-3.5" />
        {compact ? <span className="sr-only">{t.reports.button}</span> : t.reports.button}
      </button>
      {open ? (
        <ReportModal
          targetType={targetType}
          targetId={targetId}
          targetName={targetName}
          onClose={() => setOpen(false)}
          onSent={() => {
            setOpen(false);
            toast(t.reports.sent, "success");
          }}
        />
      ) : null}
      <ToastContainer toasts={toasts} onDismiss={dismiss} />
    </>
  );
}

function ReportModal({
  targetType,
  targetId,
  targetName,
  onClose,
  onSent,
}: {
  targetType: ReportTarget;
  targetId: string;
  targetName: string;
  onClose: () => void;
  onSent: () => void;
}) {
  const { t } = useLanguage();
  const tr = t.reports;
  const { user } = useSession();
  const create = useCreateReport();
  const [reason, setReason] = useState<ReportReason | "">("");
  const [details, setDetails] = useState("");
  const [images, setImages] = useState<File[]>([]);
  const [previews, setPreviews] = useState<string[]>([]);
  const [reportedAs, setReportedAs] = useState<ReportedAs>("self");
  const [error, setError] = useState<string | null>(null);

  // Object URLs for the thumbnails, released when the images change or the form closes.
  useEffect(() => {
    const urls = images.map((file) => URL.createObjectURL(file));
    function show() {
      setPreviews(urls);
    }
    show();
    return () => urls.forEach((url) => URL.revokeObjectURL(url));
  }, [images]);

  const asOptions: Array<{ value: ReportedAs; label: string }> = [{ value: "self", label: tr.reportAs.self }];
  if (user.club && CLUB_LEADERS.includes(user.club.role)) asOptions.push({ value: "club", label: format(tr.reportAs.club, { name: user.club.name }) });
  if (user.community && COMMUNITY_LEADERS.includes(user.community.role)) {
    asOptions.push({ value: "community", label: format(tr.reportAs.community, { name: user.community.name }) });
  }

  function addFiles(list: FileList | null) {
    if (!list) return;
    const picked = Array.from(list);
    if (picked.some((f) => !IMAGE_TYPES.includes(f.type) || f.size > MAX_IMAGE_BYTES)) {
      setError(tr.imageTooBig);
      return;
    }
    setError(null);
    setImages((current) => [...current, ...picked].slice(0, MAX_REPORT_IMAGES));
  }

  async function submit() {
    if (!reason) return;
    setError(null);
    try {
      await create.mutateAsync({ targetType, targetId, reason, details: details.trim(), reportedAs, images });
      onSent();
    } catch (err) {
      setError((err as { message?: string }).message ?? tr.errGeneric);
    }
  }

  const valid = Boolean(reason) && details.trim().length >= 10;
  return (
    <Modal
      title={format(tr.modalTitle, { name: targetName })}
      onClose={onClose}
      footer={
        <>
          <Button onClick={onClose}>{t.admin.common.cancel}</Button>
          <Button variant="danger" disabled={!valid || create.isPending} onClick={submit}>
            {create.isPending ? tr.sending : tr.submit}
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        <fieldset>
          <legend className="mb-1.5 text-xs font-medium text-ink-soft">{tr.reasonLabel}</legend>
          <div className="grid gap-1.5">
            {REPORT_REASONS.map((r) => (
              <label
                key={r}
                className={`flex cursor-pointer items-center gap-2.5 rounded-lg border px-3 py-2 text-sm transition-colors ${
                  reason === r ? "border-danger bg-danger-soft/40 text-ink" : "border-surface-line-strong text-ink-soft hover:text-ink"
                }`}
              >
                <input type="radio" name="reason" value={r} checked={reason === r} onChange={() => setReason(r)} className="accent-[var(--color-danger)]" />
                {tr.reasons[r]}
              </label>
            ))}
          </div>
        </fieldset>

        <Field label={tr.detailsLabel} hint={tr.detailsHint}>
          <textarea value={details} onChange={(e) => setDetails(e.target.value)} rows={4} maxLength={2000} placeholder={tr.detailsPlaceholder} className={inputClass} />
        </Field>

        <div>
          <span className="mb-1.5 block text-xs font-medium text-ink-soft">{tr.imagesLabel}</span>
          <div className="flex flex-wrap gap-2">
            {previews.map((src, i) => (
              <div key={src} className="relative h-20 w-20 overflow-hidden rounded-lg border border-surface-line">
                {/* eslint-disable-next-line @next/next/no-img-element -- a local preview of the picked file */}
                <img src={src} alt="" className="h-full w-full object-cover" />
                <button
                  type="button"
                  onClick={() => setImages(images.filter((_, j) => j !== i))}
                  className="absolute right-1 top-1 rounded-full bg-black/70 p-0.5 text-white"
                  aria-label={tr.remove}
                >
                  <CloseIcon className="h-3 w-3" />
                </button>
              </div>
            ))}
            {images.length < MAX_REPORT_IMAGES ? (
              <label className="flex h-20 w-20 cursor-pointer flex-col items-center justify-center rounded-lg border border-dashed border-surface-line-strong text-center text-[10px] text-ink-faint hover:border-accent hover:text-ink">
                +<span>{tr.addImage}</span>
                <input type="file" accept={IMAGE_TYPES.join(",")} multiple className="hidden" onChange={(e) => addFiles(e.target.files)} />
              </label>
            ) : null}
          </div>
        </div>

        {asOptions.length > 1 ? (
          <Field label={tr.reportAsLabel} hint={tr.reportAsHint}>
            <select value={reportedAs} onChange={(e) => setReportedAs(e.target.value as ReportedAs)} className={inputClass}>
              {asOptions.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
          </Field>
        ) : null}

        <p className="text-[11px] text-ink-faint">{tr.privacyNote}</p>
        {error ? <p className="rounded-lg bg-danger-soft px-3 py-2 text-xs text-danger-ink">{error}</p> : null}
      </div>
    </Modal>
  );
}
