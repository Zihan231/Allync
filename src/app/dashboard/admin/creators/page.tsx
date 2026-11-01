"use client";

import { useState } from "react";
import Link from "next/link";
import { useLanguage } from "@/lib/i18n/LanguageContext";
import { useSession } from "@/lib/session/SessionContext";
import { useToast } from "@/lib/useToast";
import { hasRole } from "@/lib/api/admin";
import { ToastContainer } from "@/components/common/Toast";
import { PageHeader } from "@/components/dashboard/PageHeader";
import { Pagination } from "@/components/dashboard/Pagination";
import { Button, EmptyRow, ReasonDialog, Tabs } from "@/components/admin/ui";
import { tk } from "@/components/dashboard/transfers/shared";
import { DesignPreview, DesignStatusChip } from "@/components/creators/DesignPreview";
import { useAdminDesigns, useReviewDesign } from "@/lib/api/hooks/useCreators";
import { apiMessage, RARITIES, type AdminDesign, type CreatorCategory, type DesignStatus, type Rarity } from "@/lib/api/creators";

/** One design to review: the live look and the proposed one side by side, with approve / reject. */
function ReviewCard({
  design,
  canAdjust,
  busy,
  onApprove,
  onReject,
}: {
  design: AdminDesign;
  canAdjust: boolean;
  busy: boolean;
  onApprove: (adjust: { priceTk?: number; rarity?: Rarity }) => void;
  onReject: () => void;
}) {
  const { t } = useLanguage();
  const tc = t.creators;
  const ta = tc.admin;
  const [price, setPrice] = useState(design.priceTk);
  const [rarity, setRarity] = useState<Rarity>((design.metadata?.rarity as Rarity) ?? "common");
  const category = design.category as CreatorCategory;
  const isChange = design.reviewStatus === "approved" && Boolean(design.pendingAssets);
  const toReview = design.reviewStatus === "pending" || isChange;
  const field = "rounded-lg border border-surface-line-strong bg-bg-raised px-2 py-1.5 text-sm text-ink outline-none focus:border-accent";

  return (
    <article className="grid gap-4 rounded-2xl border border-surface-line bg-surface/50 p-4 lg:grid-cols-[minmax(0,1fr)_240px]" data-testid="admin-design">
      <div className="space-y-3">
        <div className="flex flex-wrap items-center gap-2">
          <h3 className="font-display text-base font-black text-ink">{design.name}</h3>
          <DesignStatusChip design={design} />
          <span className="rounded-full bg-surface px-2 py-0.5 text-[10px] font-bold text-ink-soft">
            {tc.categories[category]} · {toReview ? (isChange ? ta.change : ta.newDesign) : null}
          </span>
        </div>
        {design.description ? <p className="text-xs text-ink-soft">{design.description}</p> : null}
        <div className={`grid gap-3 ${isChange ? "sm:grid-cols-2" : ""}`}>
          {isChange ? (
            <div className="space-y-1">
              <div className="font-mono text-[10px] font-bold uppercase tracking-wider text-ink-faint">{ta.current}</div>
              <DesignPreview category={category} name={design.name} assets={design.assets} rarity={design.metadata?.rarity} size="sm" />
            </div>
          ) : null}
          <div className="space-y-1">
            {isChange ? <div className="font-mono text-[10px] font-bold uppercase tracking-wider text-accent-ink">{ta.proposed}</div> : null}
            <DesignPreview
              category={category}
              name={design.name}
              assets={isChange ? { ...design.assets, ...design.pendingAssets } : design.assets}
              rarity={design.metadata?.rarity}
              size="sm"
            />
          </div>
        </div>
        {design.rejectReason && design.reviewStatus === "rejected" ? (
          <p className="rounded-lg bg-danger-soft px-3 py-2 text-xs text-danger-ink">{design.rejectReason}</p>
        ) : null}
      </div>

      <div className="flex flex-col gap-2 text-sm">
        {design.creator ? (
          <div className="text-xs text-ink-soft">
            {ta.creator}:{" "}
            <Link href={`/dashboard/admin/users/${design.creator.id}`} className="text-blue-ink underline">
              {design.creator.name}
            </Link>
          </div>
        ) : null}
        <div className="text-xs text-ink-soft">
          {ta.price}: <span className="font-bold text-ink">{tk(design.priceTk)}</span> · {tc.rarities[(design.metadata?.rarity as Rarity) ?? "common"]}
        </div>
        {toReview && !isChange ? (
          <fieldset disabled={!canAdjust} className="space-y-2 rounded-xl border border-surface-line p-2.5 disabled:opacity-60">
            <legend className="px-1 font-mono text-[10px] font-bold uppercase tracking-wider text-ink-faint">
              {ta.adjust}
              {!canAdjust ? ` · ${ta.adminOnly}` : ""}
            </legend>
            <div className="flex gap-2">
              <input
                type="number"
                min={0}
                value={price}
                onChange={(e) => setPrice(Math.max(0, Math.floor(Number(e.target.value) || 0)))}
                className={`${field} w-24`}
              />
              <select value={rarity} onChange={(e) => setRarity(e.target.value as Rarity)} className={`${field} flex-1`}>
                {RARITIES.map((r) => (
                  <option key={r} value={r}>
                    {tc.rarities[r]}
                  </option>
                ))}
              </select>
            </div>
          </fieldset>
        ) : null}
        {toReview ? (
          <>
            <Button
              variant="primary"
              disabled={busy}
              onClick={() =>
                onApprove({
                  ...(canAdjust && price !== design.priceTk ? { priceTk: price } : {}),
                  ...(canAdjust && rarity !== design.metadata?.rarity ? { rarity } : {}),
                })
              }
            >
              {ta.approve}
            </Button>
            <Button variant="danger" disabled={busy} onClick={onReject}>
              {ta.reject}
            </Button>
          </>
        ) : null}
      </div>
    </article>
  );
}

/** Staff review of creators' designs: nothing goes on sale (or changes its look) until approved. */
export default function AdminCreatorsPage() {
  const { t } = useLanguage();
  const ta = t.creators.admin;
  const { user } = useSession();
  const canAdjust = hasRole(user.systemRole, "admin");
  const [status, setStatus] = useState<DesignStatus>("pending");
  const [page, setPage] = useState(1);
  const { data, isLoading } = useAdminDesigns(status, page);
  const review = useReviewDesign();
  const { toasts, toast, dismiss } = useToast();
  const [rejecting, setRejecting] = useState<AdminDesign | null>(null);

  const act = async (design: AdminDesign, input: { approve: boolean; reason?: string; priceTk?: number; rarity?: Rarity }) => {
    try {
      await review.mutateAsync({ id: design.id, ...input });
      toast(input.approve ? ta.approved : ta.rejected, "success");
      setRejecting(null);
    } catch (err) {
      toast(apiMessage(err, t.coaching.deals.errGeneric), "error");
    }
  };

  return (
    <div>
      <ToastContainer toasts={toasts} onDismiss={dismiss} />
      <PageHeader eyebrow={t.admin.eyebrow} title={ta.title} description={ta.subtitle} />
      <div className="mt-6">
        <Tabs
          value={status}
          onChange={(v) => {
            setStatus(v);
            setPage(1);
          }}
          options={(["pending", "approved", "rejected"] as const).map((v) => ({ value: v, label: ta.tabs[v], count: data?.counts?.[v] ?? 0 }))}
        />
      </div>

      <div className="mt-6 space-y-4">
        {isLoading ? (
          <div className="h-48 animate-pulse rounded-2xl bg-surface/40" />
        ) : data?.data.length ? (
          data.data.map((design) => (
            <ReviewCard
              key={`${design.id}-${design.updatedAt}`}
              design={design}
              canAdjust={canAdjust}
              busy={review.isPending}
              onApprove={(adjust) => act(design, { approve: true, ...adjust })}
              onReject={() => setRejecting(design)}
            />
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

      {rejecting ? (
        <ReasonDialog
          title={ta.reject}
          reasonLabel={ta.reason}
          confirmLabel={ta.reject}
          danger
          busy={review.isPending}
          onCancel={() => setRejecting(null)}
          onConfirm={(reason) => act(rejecting, { approve: false, reason })}
        />
      ) : null}
    </div>
  );
}
