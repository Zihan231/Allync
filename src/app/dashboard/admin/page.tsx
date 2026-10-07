"use client";

import { useMemo, useState } from "react";
import { useLanguage } from "@/lib/i18n/LanguageContext";
import { downloadCsv } from "@/lib/csv";
import { COUNTRIES } from "@/lib/countries";
import { BD_DIVISIONS } from "@/lib/bangladeshLocations";
import type { DashboardFilters, GroupBy, PeriodFigures, SeriesPoint } from "@/lib/api/admin";
import { useAdminContent, useAdminDashboard } from "@/lib/api/hooks/useAdmin";
import { PageHeader } from "@/components/dashboard/PageHeader";
import { BarList, Button, Delta, Field, Kpi, Panel, SeriesChart, Tabs, fmtDate, fmtNumber, inputClass, useLocalState } from "@/components/admin/ui";
import { tk } from "@/components/dashboard/transfers/shared";
import { ArrowRightIcon, InfoIcon } from "@/components/icons";

type Preset = "today" | "d7" | "d30" | "d90" | "year" | "custom";
const DAY_MS = 24 * 60 * 60 * 1000;
const SERIES: Array<keyof Omit<SeriesPoint, "date">> = ["signups", "activeUsers", "matches", "tournaments", "transfers", "transferTk"];

interface Filters {
  preset: Preset;
  from: string;
  to: string;
  groupBy: GroupBy | "";
  compare: boolean;
  country: string;
  division: string;
  communityId: string;
  clubId: string;
  clubName: string;
  tournamentType: "" | "pvp" | "cvc" | "club";
}

const DEFAULT_FILTERS: Filters = {
  preset: "d30",
  from: "",
  to: "",
  groupBy: "",
  compare: true,
  country: "",
  division: "",
  communityId: "",
  clubId: "",
  clubName: "",
  tournamentType: "",
};

/** Start of today in Bangladesh time, as an ISO string. */
function startOfTodayDhaka(): Date {
  const now = new Date();
  const dhaka = new Date(now.getTime() + 6 * 60 * 60 * 1000);
  dhaka.setUTCHours(0, 0, 0, 0);
  return new Date(dhaka.getTime() - 6 * 60 * 60 * 1000);
}

function rangeOf(f: Filters): { from?: string; to?: string } {
  const now = new Date();
  switch (f.preset) {
    case "today":
      return { from: startOfTodayDhaka().toISOString() };
    case "d7":
      return { from: new Date(now.getTime() - 7 * DAY_MS).toISOString() };
    case "d90":
      return { from: new Date(now.getTime() - 90 * DAY_MS).toISOString() };
    case "year":
      return { from: new Date(Date.UTC(now.getUTCFullYear(), 0, 1) - 6 * 60 * 60 * 1000).toISOString() };
    case "custom":
      return {
        from: f.from ? new Date(f.from).toISOString() : undefined,
        to: f.to ? new Date(f.to).toISOString() : undefined,
      };
    default:
      return {};
  }
}

export default function AdminDashboardPage() {
  const { t, locale } = useLanguage();
  const ad = t.admin.dashboard;
  const [filters, setFilters] = useLocalState<Filters>("allynq.admin.dashboard.filters", DEFAULT_FILTERS);
  const [metric, setMetric] = useState<(typeof SERIES)[number]>("signups");
  const [clubQuery, setClubQuery] = useState("");
  const set = (patch: Partial<Filters>) => setFilters({ ...filters, ...patch });

  // The date range is fixed when the filters change, so the query key stays stable between renders.
  const query: DashboardFilters = useMemo(
    () => ({
      ...rangeOf(filters),
      groupBy: filters.groupBy || undefined,
      compare: filters.compare,
      country: filters.country || undefined,
      division: filters.division || undefined,
      communityId: filters.communityId || undefined,
      clubId: filters.clubId || undefined,
      tournamentType: filters.tournamentType || undefined,
    }),
    [filters],
  );
  const { data, isLoading, isFetching, error } = useAdminDashboard(query);
  const { data: communities } = useAdminContent("community", { limit: 200 });
  const { data: clubMatches } = useAdminContent("club", { search: clubQuery, limit: 8 });

  const n = (v: number | undefined) => fmtNumber(v ?? 0, locale);
  const prev = data?.previous ?? undefined;
  const periodKpi = (key: keyof PeriodFigures, label: string, money = false) => (
    <Kpi
      key={key}
      label={label}
      value={money ? tk(data?.period[key] ?? 0) : n(data?.period[key])}
      delta={filters.compare && data ? <Delta now={data.period[key]} before={prev?.[key]} /> : undefined}
    />
  );
  const bucketLabel = (date: string) => {
    const d = new Date(`${date}T00:00:00Z`);
    const opts: Intl.DateTimeFormatOptions =
      data?.range.groupBy === "month" ? { month: "short", year: "2-digit", timeZone: "UTC" } : { day: "numeric", month: "short", timeZone: "UTC" };
    return new Intl.DateTimeFormat(locale === "bn" ? "bn-BD" : "en-US", opts).format(d);
  };

  function exportSeries() {
    if (!data) return;
    downloadCsv(`allynq-dashboard-${data.range.from.slice(0, 10)}-${data.range.to.slice(0, 10)}.csv`, [
      ["date", ...SERIES],
      ...data.series.map((p) => [p.date, ...SERIES.map((k) => p[k])]),
    ]);
  }

  const att = data?.attention;
  const attentionRows = att
    ? ([
        [ad.attention.leaderReports, att.leaderReports, "/dashboard/admin/reports"],
        [ad.attention.unassignedReports, att.unassignedReports, "/dashboard/admin/reports"],
        [ad.attention.openReports, att.openReports, "/dashboard/admin/reports"],
        [ad.attention.pendingVerifications, att.pendingVerifications, "/dashboard/admin/verification"],
        [ad.attention.openDisputes, att.openDisputes, "/dashboard/admin/disputes"],
        [ad.attention.staleDisputes, att.staleDisputes, "/dashboard/admin/disputes"],
        [ad.attention.binExpiringSoon, att.binExpiringSoon, "/dashboard/admin/bin"],
        [ad.attention.suspensionsEndingToday, att.suspensionsEndingToday, "/dashboard/admin/users?status=suspended"],
        [ad.attention.suspiciousIps, att.suspiciousIps, null],
        [ad.attention.sharedIps, att.sharedIps, null],
      ] as Array<[string, number, string | null]>).filter(([, count]) => count > 0)
    : [];

  return (
    <div>
      <PageHeader eyebrow={t.admin.eyebrow} title={ad.title} description={ad.description} />

      {/* Filters */}
      <Panel className="mt-6">
        <div className="flex flex-wrap items-center gap-2">
          <Tabs<Preset>
            value={filters.preset}
            onChange={(preset) => set({ preset })}
            options={(Object.keys(ad.presets) as Preset[]).map((p) => ({ value: p, label: ad.presets[p] }))}
          />
          <Button small variant="ghost" onClick={() => setFilters(DEFAULT_FILTERS)}>
            {t.admin.common.reset}
          </Button>
        </div>
        {filters.preset === "custom" ? (
          <div className="mt-3 grid gap-3 sm:grid-cols-2">
            <Field label={t.admin.common.from}>
              <input type="datetime-local" value={filters.from} onChange={(e) => set({ from: e.target.value })} className={inputClass} />
            </Field>
            <Field label={t.admin.common.to}>
              <input type="datetime-local" value={filters.to} onChange={(e) => set({ to: e.target.value })} className={inputClass} />
            </Field>
          </div>
        ) : null}
        <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <Field label={ad.country}>
            <select value={filters.country} onChange={(e) => set({ country: e.target.value })} className={inputClass}>
              <option value="">{ad.anyCountry}</option>
              {COUNTRIES.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </Field>
          <Field label={ad.division}>
            <select value={filters.division} onChange={(e) => set({ division: e.target.value })} className={inputClass}>
              <option value="">{ad.anyDivision}</option>
              {BD_DIVISIONS.map((d) => (
                <option key={d} value={d}>
                  {d}
                </option>
              ))}
            </select>
          </Field>
          <Field label={ad.community}>
            <select value={filters.communityId} onChange={(e) => set({ communityId: e.target.value })} className={inputClass}>
              <option value="">{ad.anyCommunity}</option>
              {(communities?.data ?? []).map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </Field>
          <Field label={ad.club}>
            {filters.clubId ? (
              <div className="flex items-center justify-between gap-2 rounded-lg border border-accent bg-accent-soft/40 px-3 py-2 text-sm">
                <span className="truncate text-ink">{filters.clubName}</span>
                <button type="button" className="text-xs font-bold text-accent-ink" onClick={() => set({ clubId: "", clubName: "" })}>
                  ×
                </button>
              </div>
            ) : (
              <div className="relative">
                <input value={clubQuery} onChange={(e) => setClubQuery(e.target.value)} placeholder={ad.clubSearch} className={inputClass} />
                {clubQuery.trim() && clubMatches?.data.length ? (
                  <ul className="absolute z-20 mt-1 max-h-56 w-full overflow-y-auto rounded-lg border border-surface-line bg-bg-raised shadow-xl">
                    {clubMatches.data.map((c) => (
                      <li key={c.id}>
                        <button
                          type="button"
                          onClick={() => {
                            set({ clubId: c.id, clubName: c.name });
                            setClubQuery("");
                          }}
                          className="block w-full truncate px-3 py-2 text-left text-sm text-ink-soft hover:bg-surface hover:text-ink"
                        >
                          {c.name}
                        </button>
                      </li>
                    ))}
                  </ul>
                ) : null}
              </div>
            )}
          </Field>
          <Field label={ad.tournamentType}>
            <select
              value={filters.tournamentType}
              onChange={(e) => set({ tournamentType: e.target.value as Filters["tournamentType"] })}
              className={inputClass}
            >
              <option value="">{ad.typeAll}</option>
              <option value="pvp">{ad.typePvp}</option>
              <option value="cvc">{ad.typeCvc}</option>
              <option value="club">{ad.typeClub}</option>
            </select>
          </Field>
          <Field label={ad.groupBy}>
            <select value={filters.groupBy} onChange={(e) => set({ groupBy: e.target.value as GroupBy | "" })} className={inputClass}>
              <option value="">{ad.auto}</option>
              <option value="day">{ad.day}</option>
              <option value="week">{ad.week}</option>
              <option value="month">{ad.month}</option>
            </select>
          </Field>
          <label className="flex items-center gap-2 self-end pb-2 text-sm text-ink-soft sm:col-span-2">
            <input type="checkbox" checked={filters.compare} onChange={(e) => set({ compare: e.target.checked })} className="h-4 w-4 accent-[var(--color-accent)]" />
            {ad.compare}
          </label>
        </div>
        {data ? (
          <p className="mt-3 font-mono text-[11px] text-ink-faint">
            {fmtDate(data.range.from, locale)} – {fmtDate(data.range.to, locale)}
            {data.previousRange ? ` · ${ad.vsPrevious}: ${fmtDate(data.previousRange.from, locale)} – ${fmtDate(data.previousRange.to, locale)}` : ""}
          </p>
        ) : null}
      </Panel>

      {error ? <p className="mt-4 rounded-xl bg-danger-soft p-3 text-sm text-danger-ink">{(error as { message?: string }).message ?? t.admin.common.errGeneric}</p> : null}

      <div className={`transition-opacity ${isFetching && !isLoading ? "opacity-60" : ""}`}>
        {/* Needs attention */}
        <Panel title={ad.attention.title} className="mt-6">
          {!att ? (
            <div className="h-16 animate-pulse rounded-lg bg-surface-line/40" />
          ) : attentionRows.length ? (
            <ul className="divide-y divide-surface-line/70">
              {attentionRows.map(([label, count, href]) => (
                <li key={label} className="flex items-center justify-between gap-3 py-2 text-sm">
                  <span className="text-ink-soft">{label}</span>
                  <span className="flex items-center gap-2">
                    <span className="rounded-full bg-warning-soft px-2 py-0.5 font-mono text-xs font-bold text-warning-ink">{count}</span>
                    {href ? (
                      <a href={href} className="text-accent-ink hover:underline" aria-label={label}>
                        <ArrowRightIcon className="h-4 w-4" />
                      </a>
                    ) : null}
                  </span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-success-ink">{ad.attention.allClear}</p>
          )}
          {att?.oldestDisputes.length ? (
            <div className="mt-3">
              <div className="mb-1 font-mono text-[10px] uppercase tracking-wide text-ink-faint">{ad.attention.oldestDisputes}</div>
              <ul className="space-y-1 text-xs">
                {att.oldestDisputes.map((m) => (
                  <li key={m.id}>
                    <a href={`/dashboard/admin/disputes?tournamentId=${m.tournamentId}`} className="text-ink-soft hover:text-accent-ink">
                      {m.tournamentName} · {m.roundName} · {fmtDate(m.updatedAt, locale)}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ) : null}
        </Panel>

        {/* Right now */}
        <h2 className="mt-8 font-display text-base font-black text-ink">{ad.nowTitle}</h2>
        <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
          <Kpi label={ad.totals.users} value={n(data?.totals.users)} href="/dashboard/admin/users" />
          <Kpi label={ad.totals.verifiedUsers} value={n(data?.totals.verifiedUsers)} />
          <Kpi label={ad.totals.suspendedUsers} value={n(data?.totals.suspendedUsers)} href="/dashboard/admin/users?status=suspended" />
          <Kpi label={ad.totals.bannedUsers} value={n(data?.totals.bannedUsers)} href="/dashboard/admin/users?status=banned" />
          <Kpi label={ad.totals.staff} value={n(data?.totals.staff)} href="/dashboard/admin/users?systemRole=staff" />
          <Kpi label={ad.totals.clubs} value={n(data?.totals.clubs)} />
          <Kpi label={ad.totals.communities} value={n(data?.totals.communities)} />
          <Kpi label={ad.totals.liveTournaments} value={n(data?.totals.liveTournaments)} />
          <Kpi label={ad.totals.upcomingTournaments} value={n(data?.totals.upcomingTournaments)} />
          <Kpi label={ad.totals.openDisputes} value={n(data?.totals.openDisputes)} href="/dashboard/admin/disputes" />
          <Kpi label={ad.totals.walletBalance} value={tk(data?.totals.walletBalanceTk ?? 0)} />
          <Kpi label={ad.totals.walletHeld} value={tk(data?.totals.walletHeldTk ?? 0)} />
          <Kpi label={ad.totals.openOffers} value={n(data?.totals.openOffers)} />
        </div>

        {/* This period */}
        <h2 className="mt-8 font-display text-base font-black text-ink">{ad.periodTitle}</h2>
        <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
          {periodKpi("newUsers", ad.period.newUsers)}
          {periodKpi("activeUsers", ad.period.activeUsers)}
          {periodKpi("newClubs", ad.period.newClubs)}
          {periodKpi("tournamentsCreated", ad.period.tournamentsCreated)}
          {periodKpi("tournamentsCompleted", ad.period.tournamentsCompleted)}
          {periodKpi("matchesPlayed", ad.period.matchesPlayed)}
          {periodKpi("transfers", ad.period.transfers)}
          {periodKpi("transferVolumeTk", ad.period.transferVolume, true)}
          {periodKpi("verificationsReviewed", ad.period.verificationsReviewed)}
          {periodKpi("staffActions", ad.period.staffActions)}
        </div>
        <p className="mt-2 flex items-start gap-1.5 text-[11px] text-ink-faint">
          <InfoIcon className="mt-px h-3.5 w-3.5 shrink-0" />
          {ad.activeUsersHint}
        </p>

        {/* Trends */}
        <Panel
          title={ad.trendsTitle}
          className="mt-8"
          action={
            <Button small variant="outline" onClick={exportSeries} disabled={!data}>
              {t.admin.common.exportCsv}
            </Button>
          }
        >
          <Tabs value={metric} onChange={setMetric} options={SERIES.map((k) => ({ value: k, label: ad.series[k] }))} />
          <div className="mt-4">
            {data ? (
              <SeriesChart points={data.series.map((p) => ({ date: p.date, value: p[metric] }))} label={bucketLabel} />
            ) : (
              <div className="h-48 animate-pulse rounded-lg bg-surface-line/40" />
            )}
          </div>
        </Panel>

        {/* Breakdown */}
        <div className="mt-6 grid gap-4 lg:grid-cols-2">
          <Panel title={ad.breakdown.byCountry}>
            <BarList rows={data?.breakdowns.usersByCountry ?? []} />
          </Panel>
          <Panel title={ad.breakdown.byDivision}>
            <BarList rows={data?.breakdowns.usersByDivision ?? []} />
          </Panel>
          <Panel title={ad.breakdown.tournamentsByStatus}>
            <BarList
              rows={(data?.breakdowns.tournamentsByStatus ?? []).map((r) => ({
                ...r,
                label: (ad.statusLabels as Record<string, string>)[r.label] ?? r.label,
              }))}
            />
          </Panel>
          <Panel title={ad.breakdown.topClubs}>
            <BarList rows={data?.breakdowns.topClubsByMatches ?? []} />
          </Panel>
        </div>
      </div>
    </div>
  );
}
