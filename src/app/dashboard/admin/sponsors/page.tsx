"use client";

import { useState } from "react";
import Link from "next/link";
import { useLanguage } from "@/lib/i18n/LanguageContext";
import { useSession } from "@/lib/session/SessionContext";
import { hasRole } from "@/lib/api/admin";
import { useAdminSponsors, useVerifySponsor } from "@/lib/api/hooks/useSponsors";
import { apiMessage } from "@/lib/api/creators";
import { useToast } from "@/lib/useToast";
import { ToastContainer } from "@/components/common/Toast";
import { PageHeader } from "@/components/dashboard/PageHeader";
import { Pagination } from "@/components/dashboard/Pagination";
import { EmptyRow } from "@/components/admin/ui";
import { tk } from "@/components/dashboard/transfers/shared";
import { BrandLogo, VerifiedTick } from "@/components/sponsors/BrandLogo";

/** Staff: sponsor brands with their recent deals; admins verify a brand (badge, listed first). */
export default function AdminSponsorsPage() {
  const { t } = useLanguage();
  const ta = t.sponsors.admin;
  const { user } = useSession();
  const canVerify = hasRole(user.systemRole, "admin");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const { data, isLoading } = useAdminSponsors({ search: search || undefined, page });
  const verify = useVerifySponsor();
  const { toasts, toast, dismiss } = useToast();

  return (
    <div>
      <ToastContainer toasts={toasts} onDismiss={dismiss} />
      <PageHeader eyebrow={t.admin.eyebrow} title={ta.title} description={ta.subtitle} />
      <input
        value={search}
        onChange={(e) => {
          setSearch(e.target.value);
          setPage(1);
        }}
        placeholder={t.sponsors.directory.search}
        className="mt-6 w-full max-w-xs rounded-full border border-surface-line-strong bg-bg-raised px-4 py-2 text-sm text-ink outline-none focus:border-accent"
      />
      <div className="mt-6 space-y-4">
        {isLoading ? (
          <div className="h-40 animate-pulse rounded-2xl bg-surface/40" />
        ) : data?.data.length ? (
          data.data.map((s) => (
            <article key={s.userId} className="grid gap-4 rounded-2xl border border-surface-line bg-surface/50 p-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.4fr)]" data-testid="admin-sponsor">
              <div className="flex items-start gap-3">
                <BrandLogo name={s.brandName} logoUrl={s.logoUrl} size="lg" />
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1.5">
                    <Link href={`/dashboard/efootball/sponsors/${s.userId}`} className="truncate font-display text-base font-black text-ink hover:underline">
                      {s.brandName}
                    </Link>
                    {s.verified ? <VerifiedTick label={t.sponsors.profile.verified} /> : null}
                  </div>
                  <Link href={`/dashboard/admin/users/${s.userId}`} className="text-xs text-blue-ink underline">
                    {s.name}
                  </Link>
                  <div className="text-[11px] text-ink-faint">{s.tagline || s.industry}</div>
                  {canVerify ? (
                    <button
                      type="button"
                      disabled={verify.isPending}
                      onClick={async () => {
                        try {
                          await verify.mutateAsync({ userId: s.userId, verified: !s.verified });
                          toast(s.verified ? ta.unverifiedToast : ta.verifiedToast, "success");
                        } catch (err) {
                          toast(apiMessage(err, t.coaching.deals.errGeneric), "error");
                        }
                      }}
                      className={`mt-2 rounded-full px-3.5 py-1.5 text-xs font-bold ${s.verified ? "border border-surface-line-strong text-ink-soft" : "bg-accent text-bg"}`}
                    >
                      {s.verified ? ta.unverify : ta.verify}
                    </button>
                  ) : null}
                </div>
              </div>
              <div>
                <div className="mb-1.5 font-mono text-[10px] font-bold uppercase tracking-wider text-ink-faint">{ta.recentDeals}</div>
                {s.deals.length ? (
                  <ul className="space-y-1.5">
                    {s.deals.map((d) => (
                      <li key={d.id} className="flex items-center justify-between gap-2 rounded-lg bg-bg-raised/70 px-3 py-1.5 text-xs">
                        <Link href={d.target.link} className="truncate font-semibold text-ink hover:underline">
                          {d.target.name}
                        </Link>
                        <span className="shrink-0 text-ink-soft">
                          {t.sponsors.tiers[d.tier]} · {tk(d.amountTk)} · {t.sponsors.status[d.status]}
                        </span>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-xs text-ink-faint">—</p>
                )}
              </div>
            </article>
          ))
        ) : (
          <EmptyRow>{ta.empty}</EmptyRow>
        )}
      </div>
      {data && data.meta.totalPages > 1 ? (
        <div className="mt-6">
          <Pagination page={page} pageCount={data.meta.totalPages} onPageChange={setPage} />
        </div>
      ) : null}
    </div>
  );
}
