"use client";

import Link from "next/link";
import { useLanguage } from "@/lib/i18n/LanguageContext";
import { useClubStore, useMyStore, useSetClubTheme, useSetTournamentBanner, useStoreCatalog } from "@/lib/api/hooks/useStore";
import { apiMessage, type CreatorCategory } from "@/lib/api/creators";
import type { StoreItem } from "@/lib/api/store";
import { DesignPreview } from "@/components/creators/DesignPreview";
import { designAssetsAt } from "@/lib/storeCosmetics";

type Toast = (message: string, variant?: "success" | "error") => void;

/** A sheet listing owned designs (plus "none") to pick one, with a link to get more in the store. */
function PickerSheet({
  title,
  noneLabel,
  moreLabel,
  moreHref,
  items,
  versions,
  current,
  busy,
  onPick,
  onClose,
}: {
  title: string;
  noneLabel: string;
  moreLabel: string;
  moreHref: string;
  items: StoreItem[];
  /** The owner's chosen looks (SKU → version). */
  versions?: Record<string, number>;
  current: string | null;
  busy: boolean;
  onPick: (sku: string | null) => void;
  onClose: () => void;
}) {
  const { t } = useLanguage();
  const option = (active: boolean) =>
    `w-full rounded-2xl border p-2 text-left transition-colors disabled:opacity-50 ${active ? "border-accent bg-accent-soft" : "border-surface-line hover:border-accent/50"}`;

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 p-0 backdrop-blur-sm sm:items-center sm:p-4" onClick={onClose}>
      <div
        role="dialog"
        aria-label={title}
        className="max-h-[85vh] w-full max-w-2xl overflow-y-auto rounded-t-2xl border border-surface-line bg-bg-raised p-4 shadow-2xl sm:rounded-2xl sm:p-5"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-4 flex items-center justify-between gap-3">
          <h2 className="font-display text-lg font-black text-ink">{title}</h2>
          <button type="button" onClick={onClose} className="rounded-full px-3 py-1 text-xs font-semibold text-ink-soft hover:text-ink">
            {t.creators.picker.close}
          </button>
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          <button type="button" disabled={busy} onClick={() => onPick(null)} className={option(current === null)}>
            <div className="flex h-24 items-center justify-center rounded-xl bg-surface text-sm font-semibold text-ink-soft">{noneLabel}</div>
          </button>
          {items.map((item) => (
            <button key={item.sku} type="button" disabled={busy} onClick={() => onPick(item.sku)} className={option(current === item.sku)}>
              <DesignPreview category={item.category as CreatorCategory} name={item.name} assets={designAssetsAt(item, versions?.[item.sku])} size="sm" />
              <div className="mt-2 truncate px-1 text-sm font-bold text-ink">{item.name}</div>
            </button>
          ))}
        </div>
        <Link href={moreHref} className="mt-4 inline-flex rounded-full bg-accent px-5 py-2 text-sm font-bold text-bg hover:brightness-110">
          {moreLabel} →
        </Link>
      </div>
    </div>
  );
}

/** Club leaders: pick which of the club's themes is on its page. */
export function ClubThemePicker({
  clubId,
  current,
  onChanged,
  onClose,
  onToast,
}: {
  clubId: string;
  current: string | null;
  onChanged: (sku: string | null) => void;
  onClose: () => void;
  onToast: Toast;
}) {
  const { t } = useLanguage();
  const tp = t.creators.picker;
  const catalog = useStoreCatalog().data ?? [];
  const { data } = useClubStore(clubId);
  const setTheme = useSetClubTheme();
  const owned = catalog.filter((i) => data?.owned.includes(i.sku));

  return (
    <PickerSheet
      title={tp.clubTheme}
      noneLabel={tp.plain}
      moreLabel={tp.getThemes}
      moreHref="/dashboard/efootball/store?for=club"
      items={owned}
      versions={data?.versions}
      current={data?.equipped ?? current}
      busy={setTheme.isPending}
      onClose={onClose}
      onPick={async (sku) => {
        try {
          await setTheme.mutateAsync({ clubId, sku });
          onChanged(sku);
          onToast(t.creators.shop.themeUpdated, "success");
          onClose();
        } catch (err) {
          onToast(apiMessage(err, t.dashboard.store.actionError), "error");
        }
      }}
    />
  );
}

/** Organizers: pick which of their banners is on a tournament. */
export function TournamentBannerPicker({
  tournamentId,
  current,
  onClose,
  onToast,
}: {
  tournamentId: string;
  current: string | null;
  onClose: () => void;
  onToast: Toast;
}) {
  const { t } = useLanguage();
  const tp = t.creators.picker;
  const catalog = useStoreCatalog().data ?? [];
  const mine = useMyStore();
  const setBanner = useSetTournamentBanner();
  const owned = catalog.filter((i) => i.target === "tournament" && mine.data?.owned.includes(i.sku));

  return (
    <PickerSheet
      title={tp.banner}
      noneLabel={tp.noBanner}
      moreLabel={tp.getBanners}
      moreHref={`/dashboard/efootball/store?for=banner&tournament=${tournamentId}`}
      items={owned}
      versions={mine.data?.versions}
      current={current}
      busy={setBanner.isPending}
      onClose={onClose}
      onPick={async (sku) => {
        try {
          await setBanner.mutateAsync({ tournamentId, sku });
          onToast(t.creators.shop.bannerUpdated, "success");
          onClose();
        } catch (err) {
          onToast(apiMessage(err, t.dashboard.store.actionError), "error");
        }
      }}
    />
  );
}
