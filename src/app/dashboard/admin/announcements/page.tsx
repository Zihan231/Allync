"use client";

import { useState } from "react";
import { useLanguage } from "@/lib/i18n/LanguageContext";
import { format } from "@/lib/i18n/translations";
import { useSession } from "@/lib/session/SessionContext";
import { COUNTRIES } from "@/lib/countries";
import { useToast } from "@/lib/useToast";
import { ToastContainer } from "@/components/common/Toast";
import { PageHeader } from "@/components/dashboard/PageHeader";
import { Pagination } from "@/components/dashboard/Pagination";
import { Badge, Button, EmptyRow, Field, Panel, fmtDateTime, inputClass } from "@/components/admin/ui";
import { hasRole } from "@/lib/api/admin";
import { previewAnnouncement, type AnnouncementInput, type AudienceType } from "@/lib/api/adminPlatform";
import { useAdminContent, useAnnouncements, useCancelAnnouncement, useCreateAnnouncement } from "@/lib/api/hooks/useAdmin";

const AUDIENCES: AudienceType[] = ["all", "leaders", "country", "community", "club", "staff"];

export default function AnnouncementsPage() {
  const { t, locale } = useLanguage();
  const ta = t.admin.announce;
  const { user: me } = useSession();
  const { toasts, toast, dismiss } = useToast();
  const [page, setPage] = useState(1);
  const { data, isLoading } = useAnnouncements({ page, limit: 15 });
  const cancel = useCancelAnnouncement();

  if (!hasRole(me.systemRole, "admin")) return <EmptyRow>{t.admin.noAccessBody}</EmptyRow>;

  return (
    <div>
      <PageHeader eyebrow={t.admin.eyebrow} title={ta.title} description={ta.description} />
      <div className="mt-6 grid gap-4 lg:grid-cols-[minmax(0,3fr)_minmax(0,2fr)]">
        <Compose onDone={(msg) => toast(msg, "success")} onError={(msg) => toast(msg, "error")} />
        <Panel title={ta.history}>
          {isLoading ? (
            <div className="h-48 animate-pulse rounded-xl bg-surface/40" />
          ) : data?.data.length ? (
            <ul className="space-y-3">
              {data.data.map((a) => (
                <li key={a.id} className="rounded-xl border border-surface-line p-3">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <div className="truncate text-sm font-semibold text-ink">{a.title}</div>
                      <div className="text-xs text-ink-faint">{a.audienceLabel}</div>
                    </div>
                    <Badge tone={a.status === "sent" ? "success" : a.status === "scheduled" ? "blue" : "neutral"}>{ta.statuses[a.status]}</Badge>
                  </div>
                  <p className="mt-1 line-clamp-2 text-xs text-ink-soft">{a.message}</p>
                  <div className="mt-1.5 flex items-center justify-between gap-2 font-mono text-[10px] text-ink-faint">
                    <span>
                      {a.status === "sent"
                        ? format(ta.sentInfo, { count: a.recipients, date: fmtDateTime(a.sentAt, locale) })
                        : a.status === "scheduled"
                          ? format(ta.scheduledInfo, { date: fmtDateTime(a.scheduledFor, locale) })
                          : fmtDateTime(a.createdAt, locale)}
                      {a.createdByName ? ` · ${format(ta.by, { name: a.createdByName })}` : ""}
                    </span>
                    {a.status === "scheduled" ? (
                      <button
                        type="button"
                        disabled={cancel.isPending}
                        onClick={() => cancel.mutateAsync(a.id).catch((err) => toast((err as { message?: string }).message ?? t.admin.common.errGeneric, "error"))}
                        className="font-sans text-xs font-bold text-danger-ink hover:underline"
                      >
                        {ta.cancel}
                      </button>
                    ) : null}
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <EmptyRow>{ta.empty}</EmptyRow>
          )}
          {data && data.meta.totalPages > 1 ? (
            <div className="mt-3">
              <Pagination page={page} pageCount={data.meta.totalPages} onPageChange={setPage} />
            </div>
          ) : null}
        </Panel>
      </div>
      <ToastContainer toasts={toasts} onDismiss={dismiss} />
    </div>
  );
}

function Compose({ onDone, onError }: { onDone: (msg: string) => void; onError: (msg: string) => void }) {
  const { t } = useLanguage();
  const ta = t.admin.announce;
  const create = useCreateAnnouncement();
  const empty: AnnouncementInput = { title: "", message: "", link: "", audience: "all", country: "Bangladesh", targetId: "" };
  const [form, setForm] = useState<AnnouncementInput>(empty);
  const [later, setLater] = useState(false);
  const [when, setWhen] = useState("");
  const [reach, setReach] = useState<{ recipients: number; label: string } | null>(null);
  const { data: communities } = useAdminContent("community", { limit: 200 });
  const { data: clubs } = useAdminContent("club", { limit: 200 });
  const set = (patch: Partial<AnnouncementInput>) => {
    setForm({ ...form, ...patch });
    setReach(null);
  };
  const needsTarget = form.audience === "community" || form.audience === "club";
  const valid =
    form.title.trim().length >= 3 &&
    form.message.trim().length >= 3 &&
    (!needsTarget || Boolean(form.targetId)) &&
    (form.audience !== "country" || Boolean(form.country)) &&
    (!later || Boolean(when));

  const payload = (): AnnouncementInput => ({
    title: form.title.trim(),
    message: form.message.trim(),
    link: form.link?.trim() || undefined,
    audience: form.audience,
    country: form.audience === "country" ? form.country : undefined,
    targetId: needsTarget ? form.targetId : undefined,
    scheduledFor: later && when ? new Date(when).toISOString() : undefined,
  });

  async function checkReach() {
    try {
      const p = payload();
      setReach(await previewAnnouncement({ ...p }));
    } catch (err) {
      onError((err as { message?: string }).message ?? t.admin.common.errGeneric);
    }
  }

  async function submit() {
    try {
      const result = await create.mutateAsync(payload());
      onDone(result.status === "sent" ? format(ta.sent, { count: result.recipients }) : ta.scheduled);
      setForm(empty);
      setLater(false);
      setWhen("");
      setReach(null);
    } catch (err) {
      onError((err as { message?: string }).message ?? t.admin.common.errGeneric);
    }
  }

  return (
    <Panel title={ta.compose}>
      <div className="space-y-3">
        <Field label={ta.titleLabel}>
          <input value={form.title} onChange={(e) => set({ title: e.target.value })} maxLength={120} className={inputClass} />
        </Field>
        <Field label={ta.messageLabel}>
          <textarea value={form.message} onChange={(e) => set({ message: e.target.value })} rows={4} maxLength={2000} className={inputClass} />
        </Field>
        <Field label={ta.linkLabel}>
          <input value={form.link} onChange={(e) => set({ link: e.target.value })} placeholder={ta.linkPlaceholder} className={inputClass} />
        </Field>
        <div className="grid gap-3 sm:grid-cols-2">
          <Field label={ta.audience}>
            <select value={form.audience} onChange={(e) => set({ audience: e.target.value as AudienceType, targetId: "" })} className={inputClass}>
              {AUDIENCES.map((a) => (
                <option key={a} value={a}>
                  {ta.audiences[a]}
                </option>
              ))}
            </select>
          </Field>
          {form.audience === "country" ? (
            <Field label={ta.country}>
              <select value={form.country} onChange={(e) => set({ country: e.target.value })} className={inputClass}>
                {COUNTRIES.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </Field>
          ) : null}
          {needsTarget ? (
            <Field label={form.audience === "club" ? ta.pickClub : ta.pickCommunity}>
              <select value={form.targetId} onChange={(e) => set({ targetId: e.target.value })} className={inputClass}>
                <option value="">–</option>
                {((form.audience === "club" ? clubs : communities)?.data ?? []).map((x) => (
                  <option key={x.id} value={x.id}>
                    {x.name}
                  </option>
                ))}
              </select>
            </Field>
          ) : null}
        </div>
        <label className="flex items-center gap-2 text-sm text-ink-soft">
          <input type="checkbox" checked={later} onChange={(e) => setLater(e.target.checked)} className="h-4 w-4 accent-[var(--color-accent)]" />
          {ta.schedule}
        </label>
        {later ? (
          <Field label={ta.scheduleAt}>
            <input type="datetime-local" value={when} onChange={(e) => setWhen(e.target.value)} className={inputClass} />
          </Field>
        ) : null}
        {reach ? <p className="rounded-lg bg-blue-soft px-3 py-2 text-sm text-ink">{format(ta.reach, { count: reach.recipients, label: reach.label })}</p> : null}
        <div className="flex flex-wrap justify-end gap-2">
          <Button small variant="outline" disabled={!valid} onClick={checkReach}>
            {ta.checkReach}
          </Button>
          <Button small variant="primary" disabled={!valid || create.isPending} onClick={submit}>
            {later ? ta.scheduleIt : ta.sendNow}
          </Button>
        </div>
      </div>
    </Panel>
  );
}
