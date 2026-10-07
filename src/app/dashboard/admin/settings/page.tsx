"use client";

import { useState } from "react";
import { useLanguage } from "@/lib/i18n/LanguageContext";
import { useSession } from "@/lib/session/SessionContext";
import { useToast } from "@/lib/useToast";
import { ToastContainer } from "@/components/common/Toast";
import { PageHeader } from "@/components/dashboard/PageHeader";
import { Button, EmptyRow, Field, Panel, inputClass } from "@/components/admin/ui";
import { hasRole } from "@/lib/api/admin";
import type { PlatformSettings, SettingsSection } from "@/lib/api/adminPlatform";
import { usePlatformSettings, useUpdatePlatformSettings } from "@/lib/api/hooks/useAdmin";

export default function SystemSettingsPage() {
  const { t } = useLanguage();
  const ts = t.admin.settingsPage;
  const { user: me } = useSession();
  const isSuper = hasRole(me.systemRole, "super_admin");
  const { data, isLoading } = usePlatformSettings(isSuper);
  const { toasts, toast, dismiss } = useToast();
  const update = useUpdatePlatformSettings();

  if (!isSuper) return <EmptyRow>{t.admin.noAccessBody}</EmptyRow>;

  async function save(section: SettingsSection, patch: Record<string, unknown>) {
    try {
      await update.mutateAsync({ section, patch });
      toast(ts.saved, "success");
    } catch (err) {
      toast((err as { message?: string }).message ?? t.admin.common.errGeneric, "error");
    }
  }

  return (
    <div>
      <PageHeader eyebrow={t.admin.eyebrow} title={ts.title} description={ts.description} />
      {isLoading || !data ? (
        <div className="mt-6 h-96 animate-pulse rounded-2xl bg-surface/40" />
      ) : (
        <div className="mt-6 grid gap-4 lg:grid-cols-2">
          <MaintenancePanel value={data.maintenance} busy={update.isPending} onSave={(patch) => save("maintenance", patch)} />
          <FeaturesPanel value={data.features} busy={update.isPending} onSave={(patch) => save("features", patch)} />
          <NumbersPanel
            title={ts.transfers}
            note={ts.transfersNote}
            labels={ts.transferFields}
            value={data.transfers}
            busy={update.isPending}
            onSave={(patch) => save("transfers", patch)}
          />
          <NumbersPanel title={ts.moderation} labels={ts.adminFields} value={data.admin} busy={update.isPending} onSave={(patch) => save("admin", patch)} />
        </div>
      )}
      <ToastContainer toasts={toasts} onDismiss={dismiss} />
    </div>
  );
}

function Toggle({ checked, onChange, label }: { checked: boolean; onChange: (v: boolean) => void; label: string }) {
  return (
    <label className="flex cursor-pointer items-center justify-between gap-3 py-2 text-sm text-ink">
      <span>{label}</span>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        onClick={() => onChange(!checked)}
        className={`relative h-6 w-11 shrink-0 rounded-full transition-colors ${checked ? "bg-accent" : "bg-surface-line-strong"}`}
      >
        <span className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-all ${checked ? "left-[22px]" : "left-0.5"}`} />
      </button>
    </label>
  );
}

function MaintenancePanel({ value, busy, onSave }: { value: PlatformSettings["maintenance"]; busy: boolean; onSave: (p: Record<string, unknown>) => void }) {
  const { t } = useLanguage();
  const ts = t.admin.settingsPage;
  const [form, setForm] = useState(value);
  const changed = form.enabled !== value.enabled || form.message !== value.message;
  return (
    <Panel title={ts.maintenance} className={value.enabled ? "border-warning" : ""}>
      <p className="text-xs text-ink-soft">{ts.maintenanceBody}</p>
      <Toggle checked={form.enabled} onChange={(enabled) => setForm({ ...form, enabled })} label={ts.maintenanceToggle} />
      <Field label={ts.maintenanceMessage}>
        <input value={form.message} onChange={(e) => setForm({ ...form, message: e.target.value })} maxLength={300} placeholder={ts.maintenancePlaceholder} className={inputClass} />
      </Field>
      <div className="mt-3 flex justify-end">
        <Button small variant={form.enabled ? "danger" : "primary"} disabled={!changed || busy} onClick={() => onSave(form)}>
          {ts.save}
        </Button>
      </div>
    </Panel>
  );
}

function FeaturesPanel({ value, busy, onSave }: { value: PlatformSettings["features"]; busy: boolean; onSave: (p: Record<string, unknown>) => void }) {
  const { t } = useLanguage();
  const ts = t.admin.settingsPage;
  const [form, setForm] = useState(value);
  const keys = Object.keys(ts.featureFields) as Array<keyof PlatformSettings["features"]>;
  const changed = keys.some((k) => form[k] !== value[k]);
  return (
    <Panel title={ts.features}>
      <div className="divide-y divide-surface-line/70">
        {keys.map((k) => (
          <Toggle key={k} checked={form[k]} onChange={(v) => setForm({ ...form, [k]: v })} label={ts.featureFields[k]} />
        ))}
      </div>
      <div className="mt-3 flex justify-end">
        <Button small variant="primary" disabled={!changed || busy} onClick={() => onSave(Object.fromEntries(keys.filter((k) => form[k] !== value[k]).map((k) => [k, form[k]])))}>
          {ts.save}
        </Button>
      </div>
    </Panel>
  );
}

function NumbersPanel<T extends Record<string, number>>({
  title,
  note,
  labels,
  value,
  busy,
  onSave,
}: {
  title: string;
  note?: string;
  labels: Record<keyof T, string>;
  value: T;
  busy: boolean;
  onSave: (p: Record<string, unknown>) => void;
}) {
  const { t } = useLanguage();
  const [form, setForm] = useState<Record<string, string>>(Object.fromEntries(Object.entries(value).map(([k, v]) => [k, String(v)])));
  const keys = Object.keys(labels) as Array<keyof T & string>;
  const patch = Object.fromEntries(keys.filter((k) => form[k] !== String(value[k])).map((k) => [k, Number(form[k])]));
  const valid = keys.every((k) => /^\d+$/.test(form[k] ?? ""));
  return (
    <Panel title={title}>
      {note ? <p className="mb-3 text-xs text-ink-soft">{note}</p> : null}
      <div className="grid gap-3 sm:grid-cols-2">
        {keys.map((k) => (
          <Field key={k} label={labels[k]}>
            <input value={form[k] ?? ""} onChange={(e) => setForm({ ...form, [k]: e.target.value })} inputMode="numeric" className={inputClass} />
          </Field>
        ))}
      </div>
      <div className="mt-3 flex justify-end">
        <Button small variant="primary" disabled={!Object.keys(patch).length || !valid || busy} onClick={() => onSave(patch)}>
          {t.admin.settingsPage.save}
        </Button>
      </div>
    </Panel>
  );
}
