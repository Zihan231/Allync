"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useLanguage } from "@/lib/i18n/LanguageContext";
import { format } from "@/lib/i18n/translations";
import { Avatar } from "@/components/common/Avatar";
import { PageHeader } from "@/components/dashboard/PageHeader";
import { Pagination } from "@/components/dashboard/Pagination";
import { Badge, EmptyRow, Tabs, fmtDateTime, inputClass } from "@/components/admin/ui";
import { useDisputes } from "@/lib/api/hooks/useAdmin";
import type { DisputeState } from "@/lib/api/adminManage";
import { SearchIcon } from "@/components/icons";

const PAGE_SIZE = 20;

export default function DisputeCentrePage() {
  const { t, locale } = useLanguage();
  const td = t.admin.disputes;
  const [state, setState] = useState<DisputeState>("review");
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [tournamentId, setTournamentId] = useState<string | undefined>(undefined);
  const [paging, setPaging] = useState({ key: "", page: 1 });

  useEffect(() => {
    const id = setTimeout(() => setSearch(searchInput.trim()), 350);
    return () => clearTimeout(id);
  }, [searchInput]);

  // ?tournamentId=… (from a tournament's manage page) narrows the list.
  useEffect(() => {
    function fromUrl() {
      const id = new URLSearchParams(window.location.search).get("tournamentId");
      if (id) setTournamentId(id);
    }
    fromUrl();
  }, []);

  const filters = useMemo(() => ({ state, search: search || undefined, tournamentId }), [state, search, tournamentId]);
  const key = JSON.stringify(filters);
  const page = paging.key === key ? paging.page : 1;
  const { data, isLoading, isFetching } = useDisputes({ ...filters, page, limit: PAGE_SIZE });

  return (
    <div>
      <PageHeader eyebrow={t.admin.eyebrow} title={td.title} description={td.description} />
      <div className="mt-6 flex flex-wrap items-center justify-between gap-3">
        <Tabs<DisputeState>
          value={state}
          onChange={setState}
          options={(Object.keys(td.states) as DisputeState[]).map((s) => ({ value: s, label: td.states[s], count: s === state ? data?.meta.total : undefined }))}
        />
        <div className="relative w-full sm:max-w-xs">
          <SearchIcon className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-faint" />
          <input value={searchInput} onChange={(e) => setSearchInput(e.target.value)} placeholder={td.searchPlaceholder} className={`${inputClass} pl-9`} />
        </div>
      </div>
      {tournamentId ? (
        <button type="button" onClick={() => setTournamentId(undefined)} className="mt-2 text-xs font-bold text-accent-ink hover:underline">
          × {t.admin.common.reset}
        </button>
      ) : null}

      <div className={`mt-4 transition-opacity ${isFetching && !isLoading ? "opacity-60" : ""}`}>
        {isLoading ? (
          <div className="h-48 animate-pulse rounded-xl bg-surface/40" />
        ) : data?.data.length ? (
          <ul className="grid gap-3 md:grid-cols-2">
            {data.data.map((g) => (
              <li key={g.id}>
                <Link href={`/dashboard/admin/disputes/${g.id}`} className="block rounded-2xl border border-surface-line bg-surface/40 p-4 transition-colors hover:border-accent">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <div className="truncate text-sm font-bold text-ink">{g.tournamentName}</div>
                      <div className="truncate text-xs text-ink-faint">
                        {g.hostName} · {g.roundName}
                        {g.groupLabel ? ` · ${g.groupLabel}` : ""} · #{g.slot}
                      </div>
                    </div>
                    <div className="flex shrink-0 flex-col items-end gap-1">
                      {g.status === "rejected" ? (
                        <Badge tone="neutral">{td.states.rejected}</Badge>
                      ) : g.reviewOpen ? (
                        <Badge tone="danger">{td.states.ready}</Badge>
                      ) : (
                        <Badge tone="blue">{td.windowOpen}</Badge>
                      )}
                      {g.stale ? <Badge tone="warning">{td.stale}</Badge> : null}
                    </div>
                  </div>
                  <div className="mt-3 flex items-center justify-between gap-2 text-sm">
                    <span className="flex min-w-0 items-center gap-2">
                      <Avatar dpUrl={g.playerADpUrl} name={g.playerAName} size="sm" mode="static" />
                      <span className="truncate text-ink">{g.playerAName}</span>
                    </span>
                    <span className="font-mono text-xs text-ink-faint">vs</span>
                    <span className="flex min-w-0 items-center justify-end gap-2">
                      <span className="truncate text-right text-ink">{g.playerBName}</span>
                      <Avatar dpUrl={g.playerBDpUrl} name={g.playerBName} size="sm" mode="static" />
                    </span>
                  </div>
                  <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1 border-t border-surface-line/70 pt-2 text-[11px] text-ink-faint">
                    <span>{format(td.evidenceCount, { count: g.submissions })}</span>
                    {g.officials === 0 ? <span className="text-warning-ink">{td.noOfficials}</span> : null}
                    <span className="ml-auto">{fmtDateTime(g.updatedAt, locale)}</span>
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        ) : (
          <EmptyRow>{td.empty}</EmptyRow>
        )}
      </div>
      {data && data.meta.totalPages > 1 ? (
        <div className="mt-4">
          <Pagination page={page} pageCount={data.meta.totalPages} onPageChange={(p) => setPaging({ key, page: p })} />
        </div>
      ) : null}
    </div>
  );
}
