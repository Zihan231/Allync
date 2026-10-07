"use client";

import { useEffect, useState, type ReactNode } from "react";
import { useLanguage } from "@/lib/i18n/LanguageContext";
import type { Locale } from "@/lib/i18n/translations";
import type { AdminUserRow, SystemRole } from "@/lib/api/admin";
import { ModalPortal } from "@/components/dashboard/transfers/shared";
import { CloseIcon } from "@/components/icons";

const intlLocale = (locale: Locale) => (locale === "bn" ? "bn-BD" : "en-US");
const TZ = "Asia/Dhaka";

/** "7 Oct 2026" */
export function fmtDate(iso: string | null | undefined, locale: Locale): string {
  if (!iso) return "–";
  return new Intl.DateTimeFormat(intlLocale(locale), { timeZone: TZ, day: "numeric", month: "short", year: "numeric" }).format(new Date(iso));
}

/** "7 Oct 2026, 3:20 PM" */
export function fmtDateTime(iso: string | null | undefined, locale: Locale): string {
  if (!iso) return "–";
  return new Intl.DateTimeFormat(intlLocale(locale), {
    timeZone: TZ,
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(iso));
}

export const fmtNumber = (n: number | null | undefined, locale: Locale) =>
  n == null ? "–" : new Intl.NumberFormat(intlLocale(locale)).format(n);

/** Reads / writes a per-viewer preference; storage can be unavailable (private mode), so it never throws. */
export function useLocalState<T>(key: string, initial: T): [T, (value: T) => void] {
  const [value, setValue] = useState<T>(initial);
  useEffect(() => {
    function hydrate() {
      try {
        const raw = window.localStorage.getItem(key);
        if (raw) setValue(JSON.parse(raw) as T);
      } catch {
        // storage unavailable: keep the default
      }
    }
    hydrate();
  }, [key]);
  const update = (next: T) => {
    setValue(next);
    try {
      window.localStorage.setItem(key, JSON.stringify(next));
    } catch {
      // storage unavailable: still works for this visit
    }
  };
  return [value, update];
}

export function Modal({
  title,
  onClose,
  children,
  footer,
  wide = false,
}: {
  title: string;
  onClose: () => void;
  children: ReactNode;
  footer?: ReactNode;
  wide?: boolean;
}) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);
  return (
    <ModalPortal>
      <div className="fixed inset-0 z-50 flex items-end justify-center p-0 sm:items-center sm:p-4" role="dialog" aria-modal="true">
        <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
        <div
          className={`relative flex max-h-[92vh] w-full flex-col overflow-hidden rounded-t-2xl border border-surface-line bg-bg-raised shadow-2xl sm:rounded-2xl ${
            wide ? "sm:max-w-3xl" : "sm:max-w-md"
          }`}
        >
          <div className="flex items-center justify-between gap-3 border-b border-surface-line px-5 py-4">
            <h2 className="font-display text-base font-black text-ink">{title}</h2>
            <button type="button" onClick={onClose} className="rounded-lg p-1 text-ink-faint hover:bg-surface hover:text-ink" aria-label="Close">
              <CloseIcon className="h-4 w-4" />
            </button>
          </div>
          <div className="overflow-y-auto px-5 py-4">{children}</div>
          {footer ? <div className="flex flex-wrap justify-end gap-2 border-t border-surface-line px-5 py-3">{footer}</div> : null}
        </div>
      </div>
    </ModalPortal>
  );
}

export const inputClass =
  "w-full rounded-lg border border-surface-line-strong bg-surface px-3 py-2 text-sm text-ink placeholder:text-ink-faint focus:border-accent focus:outline-none";

/** For selects that sit in a row with other controls (no full width). */
export const inlineSelectClass =
  "w-auto max-w-full rounded-lg border border-surface-line-strong bg-surface px-3 py-2 text-sm text-ink focus:border-accent focus:outline-none";

export function Field({ label, children, hint }: { label: string; children: ReactNode; hint?: string }) {
  return (
    <label className="block">
      <span className="mb-1 block text-xs font-medium text-ink-soft">{label}</span>
      {children}
      {hint ? <span className="mt-1 block text-[11px] text-ink-faint">{hint}</span> : null}
    </label>
  );
}

export function Button({
  children,
  onClick,
  variant = "ghost",
  disabled,
  type = "button",
  small = false,
}: {
  children: ReactNode;
  onClick?: () => void;
  variant?: "primary" | "danger" | "ghost" | "outline";
  disabled?: boolean;
  type?: "button" | "submit";
  small?: boolean;
}) {
  const styles = {
    primary: "bg-accent text-bg hover:opacity-90",
    danger: "bg-danger text-white hover:opacity-90",
    ghost: "text-ink-soft hover:bg-surface hover:text-ink",
    outline: "border border-surface-line-strong text-ink hover:border-accent",
  }[variant];
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={`inline-flex items-center justify-center gap-1.5 rounded-full font-semibold transition-colors disabled:cursor-not-allowed disabled:opacity-50 ${
        small ? "px-3 py-1 text-xs" : "px-4 py-2 text-sm"
      } ${styles}`}
    >
      {children}
    </button>
  );
}

const toneClasses = {
  neutral: "bg-surface-line text-ink-soft",
  accent: "bg-accent-soft text-accent-ink",
  blue: "bg-blue-soft text-blue-ink",
  success: "bg-success-soft text-success-ink",
  warning: "bg-warning-soft text-warning-ink",
  danger: "bg-danger-soft text-danger-ink",
};
export type Tone = keyof typeof toneClasses;

export function Badge({ tone = "neutral", children }: { tone?: Tone; children: ReactNode }) {
  return (
    <span className={`inline-flex items-center whitespace-nowrap rounded-full px-2 py-0.5 font-mono text-[10px] font-bold uppercase tracking-wide ${toneClasses[tone]}`}>
      {children}
    </span>
  );
}

export function RoleBadge({ role }: { role: SystemRole | null | undefined }) {
  const { t } = useLanguage();
  if (!role) return null;
  return <Badge tone={role === "super_admin" ? "danger" : role === "admin" ? "accent" : "blue"}>{t.admin.roles[role]}</Badge>;
}

/** Account state: in the bin > banned > suspended > active. */
export function accountState(user: Pick<AdminUserRow, "deletedAt" | "bannedAt" | "suspendedUntil">): "deleted" | "banned" | "suspended" | "active" {
  if (user.deletedAt) return "deleted";
  if (user.bannedAt) return "banned";
  if (user.suspendedUntil && new Date(user.suspendedUntil).getTime() > Date.now()) return "suspended";
  return "active";
}

export function StatusBadge({ user }: { user: Pick<AdminUserRow, "deletedAt" | "bannedAt" | "suspendedUntil"> }) {
  const { t } = useLanguage();
  const state = accountState(user);
  const tone: Tone = state === "active" ? "success" : state === "suspended" ? "warning" : "danger";
  return <Badge tone={tone}>{t.admin.users.statuses[state]}</Badge>;
}

export function VerificationBadge({ status, level }: { status: string; level: string | number }) {
  const { t } = useLanguage();
  const labels = t.admin.users.verificationStatuses as Record<string, string>;
  const tone: Tone = status === "approved" ? "success" : status === "pending" ? "warning" : status === "rejected" ? "danger" : "neutral";
  return (
    <span className="inline-flex items-center gap-1">
      <Badge tone={tone}>{labels[status] ?? status}</Badge>
      {Number(level) > 0 ? <span className="font-mono text-[10px] text-ink-faint">L{Number(level)}</span> : null}
    </span>
  );
}

export function Tabs<T extends string>({
  value,
  onChange,
  options,
}: {
  value: T;
  onChange: (value: T) => void;
  options: Array<{ value: T; label: string; count?: number }>;
}) {
  return (
    <div className="flex flex-wrap gap-2" role="tablist">
      {options.map((o) => (
        <button
          key={o.value}
          type="button"
          role="tab"
          aria-selected={value === o.value}
          onClick={() => onChange(o.value)}
          className={`rounded-full border px-3.5 py-1.5 text-xs font-medium transition-colors ${
            value === o.value ? "border-accent bg-accent-soft text-accent-ink" : "border-surface-line-strong text-ink-soft hover:text-ink"
          }`}
        >
          {o.label}
          {o.count != null ? <span className="ml-1.5 font-mono text-[10px] opacity-70">{o.count}</span> : null}
        </button>
      ))}
    </div>
  );
}

export function EmptyRow({ children }: { children: ReactNode }) {
  return <p className="rounded-xl border border-dashed border-surface-line p-6 text-center text-sm text-ink-faint">{children}</p>;
}

export function Panel({ title, action, children, className = "" }: { title?: string; action?: ReactNode; children: ReactNode; className?: string }) {
  return (
    <section className={`rounded-2xl border border-surface-line bg-surface/40 p-4 sm:p-5 ${className}`}>
      {title || action ? (
        <div className="mb-3 flex items-center justify-between gap-3">
          {title ? <h2 className="font-display text-sm font-black text-ink">{title}</h2> : <span />}
          {action}
        </div>
      ) : null}
      {children}
    </section>
  );
}

/**
 * Dialog for a staff action that needs a reason (warn, ban, bin…). `extra` renders more
 * fields above the reason; `reasonRequired` false makes it optional.
 */
export function ReasonDialog({
  title,
  body,
  confirmLabel,
  danger = false,
  reasonRequired = true,
  reasonLabel,
  extra,
  canSubmit = true,
  busy,
  onCancel,
  onConfirm,
}: {
  title: string;
  body?: string;
  confirmLabel: string;
  danger?: boolean;
  reasonRequired?: boolean;
  reasonLabel?: string;
  extra?: ReactNode;
  canSubmit?: boolean;
  busy?: boolean;
  onCancel: () => void;
  onConfirm: (reason: string) => void;
}) {
  const { t } = useLanguage();
  const [reason, setReason] = useState("");
  const valid = canSubmit && (!reasonRequired || reason.trim().length >= 3);
  return (
    <Modal
      title={title}
      onClose={onCancel}
      footer={
        <>
          <Button onClick={onCancel}>{t.admin.common.cancel}</Button>
          <Button variant={danger ? "danger" : "primary"} disabled={!valid || busy} onClick={() => onConfirm(reason.trim())}>
            {confirmLabel}
          </Button>
        </>
      }
    >
      {body ? <p className="mb-4 text-sm leading-relaxed text-ink-soft">{body}</p> : null}
      <div className="space-y-3">
        {extra}
        <Field label={reasonLabel ?? t.admin.common.reason}>
          <textarea
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            rows={3}
            maxLength={500}
            placeholder={t.admin.common.reasonPlaceholder}
            className={inputClass}
          />
        </Field>
      </div>
    </Modal>
  );
}

/** Small "+12% vs previous" line for a KPI. */
export function Delta({ now, before }: { now: number; before: number | undefined }) {
  const { t } = useLanguage();
  if (before == null) return null;
  const diff = now - before;
  const pct = before === 0 ? (now === 0 ? 0 : 100) : Math.round((diff / before) * 100);
  const tone = diff > 0 ? "text-success-ink" : diff < 0 ? "text-danger-ink" : "text-ink-faint";
  return (
    <span className={`font-mono text-[11px] ${tone}`}>
      {diff > 0 ? "+" : ""}
      {pct}% {t.admin.dashboard.vsPrevious}
    </span>
  );
}

export function Kpi({ label, value, delta, href }: { label: string; value: string; delta?: ReactNode; href?: string }) {
  const content = (
    <>
      <div className="font-mono text-[10px] uppercase tracking-wide text-ink-faint">{label}</div>
      <div className="mt-1.5 font-display text-xl font-black tabular-nums text-ink sm:text-2xl">{value}</div>
      {delta ? <div className="mt-0.5">{delta}</div> : null}
    </>
  );
  const cls = "block rounded-xl border border-surface-line bg-surface/50 p-3.5 sm:p-4";
  return href ? (
    <a href={href} className={`${cls} transition-colors hover:border-accent`}>
      {content}
    </a>
  ) : (
    <div className={cls}>{content}</div>
  );
}

/** Horizontal bars for a ranked breakdown. */
export function BarList({ rows, format }: { rows: Array<{ label: string; value: number }>; format?: (n: number) => string }) {
  const max = Math.max(1, ...rows.map((r) => r.value));
  if (!rows.length) return <p className="text-xs text-ink-faint">–</p>;
  return (
    <ul className="space-y-2">
      {rows.map((r) => (
        <li key={r.label}>
          <div className="flex items-center justify-between gap-2 text-xs">
            <span className="truncate text-ink-soft">{r.label}</span>
            <span className="font-mono tabular-nums text-ink">{format ? format(r.value) : r.value}</span>
          </div>
          <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-surface-line">
            <div className="h-full rounded-full bg-accent" style={{ width: `${(r.value / max) * 100}%` }} />
          </div>
        </li>
      ))}
    </ul>
  );
}

/** Column chart for a time series, with an axis label every few buckets and a hover value. */
export function SeriesChart({ points, label }: { points: Array<{ date: string; value: number }>; label: (date: string) => string }) {
  const [hover, setHover] = useState<number | null>(null);
  const max = Math.max(1, ...points.map((p) => p.value));
  const every = Math.max(1, Math.ceil(points.length / 8));
  const active = hover != null ? points[hover] : null;
  return (
    <div>
      <div className="mb-2 h-5 text-xs text-ink-soft">
        {active ? (
          <>
            <span className="font-mono">{label(active.date)}</span> · <span className="font-bold text-ink">{active.value}</span>
          </>
        ) : null}
      </div>
      <div className="flex h-44 items-end gap-[2px]" onMouseLeave={() => setHover(null)}>
        {points.map((p, i) => (
          <div
            key={p.date}
            className="group relative flex h-full min-w-0 flex-1 cursor-default items-end"
            onMouseEnter={() => setHover(i)}
            onTouchStart={() => setHover(i)}
          >
            <div
              className={`w-full rounded-t-sm transition-colors ${hover === i ? "bg-accent" : "bg-accent/55"}`}
              style={{ height: `${Math.max(p.value > 0 ? 3 : 1, (p.value / max) * 100)}%` }}
            />
          </div>
        ))}
      </div>
      <div className="mt-1.5 flex gap-[2px]">
        {points.map((p, i) => (
          <div key={p.date} className="min-w-0 flex-1 overflow-visible whitespace-nowrap font-mono text-[9px] text-ink-faint">
            {i % every === 0 ? label(p.date) : ""}
          </div>
        ))}
      </div>
    </div>
  );
}
