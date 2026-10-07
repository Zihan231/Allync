"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useLanguage } from "@/lib/i18n/LanguageContext";
import { format } from "@/lib/i18n/translations";
import { useSession } from "@/lib/session/SessionContext";
import { useToast } from "@/lib/useToast";
import { ToastContainer } from "@/components/common/Toast";
import { Avatar } from "@/components/common/Avatar";
import { PageHeader } from "@/components/dashboard/PageHeader";
import { Pagination } from "@/components/dashboard/Pagination";
import { hasRole, type ContentRow, type ContentType } from "@/lib/api/admin";
import { useAdminContent, useBinContent } from "@/lib/api/hooks/useAdmin";
import { Badge, Button, EmptyRow, ReasonDialog, Tabs, fmtDate, inputClass } from "@/components/admin/ui";
import { SearchIcon } from "@/components/icons";

const PAGE_SIZE = 20;

const linkFor = (type: ContentType, row: ContentRow) =>
  type === "club"
    ? `/dashboard/efootball/clubs/${row.id}`
    : type === "community"
      ? `/dashboard/efootball/community/${row.id}`
      : `/dashboard/efootball/tournaments/${row.id}`;

export default function AdminContentPage() {
  const { t, locale } = useLanguage();
  const tc = t.admin.content;
  const { user: me } = useSession();
  const { toasts, toast, dismiss } = useToast();
  const [type, setType] = useState<ContentType>("club");
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [binning, setBinning] = useState<ContentRow | null>(null);
  const bin = useBinContent();
  const { data, isLoading, isFetching } = useAdminContent(type, { search: search || undefined, page, limit: PAGE_SIZE });

  useEffect(() => {
    const id = setTimeout(() => {
      setSearch(searchInput.trim());
      setPage(1);
    }, 350);
    return () => clearTimeout(id);
  }, [searchInput]);

  async function moveToBin(row: ContentRow, reason: string) {
    try {
      await bin.mutateAsync({ type, id: row.id, reason });
      setBinning(null);
      toast(format(tc.binned, { name: row.name }), "success");
    } catch (err) {
      toast((err as { message?: string }).message ?? t.admin.common.errGeneric, "error");
    }
  }

  if (!hasRole(me.systemRole, "admin")) return <EmptyRow>{t.admin.noAccessBody}</EmptyRow>;

  const statusLabels = t.admin.dashboard.statusLabels as Record<string, string>;
  const binBody = type === "club" ? tc.binClubBody : type === "community" ? tc.binCommunityBody : tc.binTournamentBody;

  return (
    <div>
      <PageHeader eyebrow={t.admin.eyebrow} title={tc.title} description={tc.description} />

      <div className="mt-6 flex flex-wrap items-center justify-between gap-3">
        <Tabs<ContentType>
          value={type}
          onChange={(v) => {
            setType(v);
            setPage(1);
          }}
          options={(Object.keys(tc.tabs) as ContentType[]).map((k) => ({ value: k, label: tc.tabs[k], count: k === type ? data?.meta.total : undefined }))}
        />
        <div className="relative w-full sm:max-w-xs">
          <SearchIcon className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-faint" />
          <input value={searchInput} onChange={(e) => setSearchInput(e.target.value)} placeholder={t.admin.common.search} className={`${inputClass} pl-9`} />
        </div>
      </div>

      <div className={`mt-4 transition-opacity ${isFetching && !isLoading ? "opacity-60" : ""}`}>
        {isLoading ? (
          <div className="h-48 animate-pulse rounded-xl bg-surface/40" />
        ) : data?.data.length ? (
          <ul className="divide-y divide-surface-line/70 rounded-xl border border-surface-line">
            {data.data.map((row) => (
              <li key={row.id} className="flex flex-wrap items-center gap-3 px-4 py-3">
                {type !== "tournament" ? <Avatar dpUrl={row.dpUrl} name={row.name} size="sm" mode="static" /> : null}
                <div className="min-w-0 flex-1">
                  <Link href={linkFor(type, row)} className="block truncate text-sm font-semibold text-ink hover:text-accent-ink">
                    {row.name}
                  </Link>
                  <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 text-xs text-ink-faint">
                    {type === "club" ? <span>{format(tc.members, { count: row.members ?? 0 })}</span> : null}
                    {type === "community" ? <span>{format(tc.clubs, { count: row.clubs ?? 0 })}</span> : null}
                    {type === "tournament" ? (
                      <>
                        <Badge tone={row.status === "ongoing" ? "success" : row.status === "completed" ? "neutral" : "blue"}>
                          {statusLabels[row.status ?? ""] ?? row.status}
                        </Badge>
                        <span className="uppercase">{row.type}</span>
                        <span>{format(tc.participants, { count: row.participants ?? 0 })}</span>
                        {row.host ? <span>{format(tc.host, { name: row.host })}</span> : null}
                      </>
                    ) : null}
                    {row.leader ? <span>{format(tc.leader, { name: row.leader })}</span> : null}
                    <span>{format(tc.created, { date: fmtDate(row.createdAt, locale) })}</span>
                  </div>
                </div>
                <Button small variant="danger" onClick={() => setBinning(row)}>
                  {tc.moveToBin}
                </Button>
              </li>
            ))}
          </ul>
        ) : (
          <EmptyRow>{t.admin.common.noResults}</EmptyRow>
        )}
      </div>
      {data && data.meta.totalPages > 1 ? (
        <div className="mt-4">
          <Pagination page={page} pageCount={data.meta.totalPages} onPageChange={setPage} />
        </div>
      ) : null}

      {binning ? (
        <ReasonDialog
          title={format(tc.binTitle, { name: binning.name })}
          body={binBody}
          confirmLabel={tc.moveToBin}
          reasonLabel={t.admin.common.reasonInternal}
          danger
          busy={bin.isPending}
          onCancel={() => setBinning(null)}
          onConfirm={(reason) => moveToBin(binning, reason)}
        />
      ) : null}
      <ToastContainer toasts={toasts} onDismiss={dismiss} />
    </div>
  );
}
