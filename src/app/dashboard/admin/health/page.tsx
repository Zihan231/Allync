"use client";

import Link from "next/link";
import { useLanguage } from "@/lib/i18n/LanguageContext";
import { format } from "@/lib/i18n/translations";
import { useSession } from "@/lib/session/SessionContext";
import { PageHeader } from "@/components/dashboard/PageHeader";
import { Badge, EmptyRow, Kpi, Panel, fmtDateTime, fmtNumber } from "@/components/admin/ui";
import { hasRole } from "@/lib/api/admin";
import { useHealth } from "@/lib/api/hooks/useAdmin";

const size = (bytes: number) =>
  bytes >= 1e9 ? `${(bytes / 1e9).toFixed(2)} GB` : bytes >= 1e6 ? `${(bytes / 1e6).toFixed(1)} MB` : `${Math.round(bytes / 1e3)} KB`;

function duration(seconds: number) {
  const d = Math.floor(seconds / 86400);
  const h = Math.floor((seconds % 86400) / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  return d ? `${d}d ${h}h` : h ? `${h}h ${m}m` : `${m}m`;
}

export default function SystemHealthPage() {
  const { t, locale } = useLanguage();
  const th = t.admin.health;
  const { user: me } = useSession();
  const { data, isLoading, error } = useHealth();

  if (!hasRole(me.systemRole, "admin")) return <EmptyRow>{t.admin.noAccessBody}</EmptyRow>;
  if (isLoading) return <div className="h-96 animate-pulse rounded-2xl bg-surface/40" />;
  if (error || !data) return <EmptyRow>{(error as { message?: string } | null)?.message ?? t.admin.common.errGeneric}</EmptyRow>;

  const anyFailing = data.jobs.some((j) => j.lastOk === false);
  return (
    <div>
      <PageHeader eyebrow={t.admin.eyebrow} title={th.title} description={th.description} />

      <div className={`mt-6 rounded-xl p-3 text-sm ${data.maintenance.enabled ? "bg-warning-soft text-warning-ink" : "bg-success-soft text-success-ink"}`}>
        {data.maintenance.enabled ? th.maintenanceOn : th.maintenanceOff}
        {data.maintenance.enabled && data.maintenance.message ? ` — ${data.maintenance.message}` : ""}
        {hasRole(me.systemRole, "super_admin") ? (
          <Link href="/dashboard/admin/settings" className="ml-2 font-bold underline">
            {th.manage}
          </Link>
        ) : null}
      </div>

      <div className="mt-4 grid grid-cols-2 gap-3 lg:grid-cols-4">
        {(Object.keys(th.activityFields) as Array<keyof typeof th.activityFields>).map((k) => (
          <Kpi key={k} label={th.activityFields[k]} value={fmtNumber(data.activity[k], locale)} />
        ))}
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-2">
        <Panel title={th.server}>
          <div className="space-y-1 text-sm text-ink-soft">
            <div>{format(th.uptime, { time: duration(data.server.uptimeSeconds) })} · Node {data.server.node}</div>
            <div>{format(th.memory, { used: data.server.memoryMb.heapUsed, total: data.server.memoryMb.heapTotal, rss: data.server.memoryMb.rss })}</div>
            <div className="text-xs text-ink-faint">{format(th.restartNote, { date: fmtDateTime(data.startedAt, locale) })}</div>
          </div>
          <div className="mt-3 flex flex-wrap gap-2">
            {(Object.keys(t.admin.settingsPage.featureFields) as Array<keyof typeof data.features>).map((k) => (
              <Badge key={k} tone={data.features[k] ? "success" : "danger"}>
                {t.admin.settingsPage.featureFields[k]}: {data.features[k] ? t.admin.settingsPage.on : t.admin.settingsPage.off}
              </Badge>
            ))}
          </div>
        </Panel>

        <Panel title={th.jobs} action={<Badge tone={anyFailing ? "danger" : "success"}>{anyFailing ? th.failing : th.ok}</Badge>}>
          {data.jobs.length ? (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="font-mono text-[10px] uppercase text-ink-faint">
                  <tr>
                    <th className="py-1 pr-3">{th.jobCols.name}</th>
                    <th className="py-1 pr-3">{th.jobCols.runs}</th>
                    <th className="py-1 pr-3">{th.jobCols.failures}</th>
                    <th className="py-1 pr-3">{th.jobCols.last}</th>
                    <th className="py-1">{th.jobCols.result}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-surface-line/70">
                  {data.jobs.map((j) => (
                    <tr key={j.name} className="align-top">
                      <td className="py-1.5 pr-3 font-mono text-ink">{j.name}</td>
                      <td className="py-1.5 pr-3 tabular-nums">{j.runs}</td>
                      <td className={`py-1.5 pr-3 tabular-nums ${j.failures ? "text-danger-ink" : ""}`}>{j.failures}</td>
                      <td className="py-1.5 pr-3 text-ink-soft">
                        {j.lastFinishedAt ? fmtDateTime(j.lastFinishedAt, locale) : th.neverRan}
                        {j.lastDurationMs != null ? <span className="text-ink-faint"> · {j.lastDurationMs} ms</span> : null}
                      </td>
                      <td className="py-1.5 text-ink-soft">
                        {j.lastResult}
                        {j.lastError ? <div className="text-danger-ink">{j.lastError}</div> : null}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="text-sm text-ink-faint">{th.neverRan}</p>
          )}
        </Panel>

        <Panel title={th.errors} action={<span className="font-mono text-xs text-ink-faint">{format(th.errorCount, { count: data.errorCount })}</span>}>
          {data.errors.length ? (
            <ul className="max-h-72 space-y-1.5 overflow-y-auto text-xs">
              {data.errors.map((e, i) => (
                <li key={`${e.at}-${i}`} className="rounded-lg bg-danger-soft/40 px-2.5 py-1.5">
                  <div className="font-mono text-ink">
                    {e.status} {e.method} {e.path}
                  </div>
                  <div className="text-ink-soft">{e.message}</div>
                  <div className="text-[10px] text-ink-faint">{fmtDateTime(e.at, locale)}</div>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-success-ink">{th.noErrors}</p>
          )}
        </Panel>

        <Panel title={th.database}>
          <p className="text-sm text-ink-soft">{format(th.dbSize, { size: size(data.database.bytes), connections: data.database.connections })}</p>
          <div className="mt-2 font-mono text-[10px] uppercase text-ink-faint">{th.tables}</div>
          <ul className="mt-1 space-y-1 text-xs">
            {data.database.tables.map((tb) => (
              <li key={tb.name} className="flex justify-between gap-2">
                <span className="truncate font-mono text-ink">{tb.name}</span>
                <span className="shrink-0 text-ink-faint">
                  {format(th.rows, { count: fmtNumber(tb.rows, locale) })} · {size(tb.bytes)}
                </span>
              </li>
            ))}
          </ul>
        </Panel>

        <Panel title={th.uploads}>
          <ul className="space-y-1 text-sm">
            {data.uploads.map((u) => (
              <li key={u.folder} className="flex justify-between gap-2">
                <span className="font-mono text-ink">{u.folder}/</span>
                <span className="text-ink-faint">
                  {format(th.files, { count: fmtNumber(u.files, locale) })} · {size(u.bytes)}
                </span>
              </li>
            ))}
          </ul>
        </Panel>
      </div>
    </div>
  );
}
