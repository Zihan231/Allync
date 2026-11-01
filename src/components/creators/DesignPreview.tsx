"use client";

import type { CreatorCategory, CreatorDesign } from "@/lib/api/creators";
import type { DesignAssets, StoreItem } from "@/lib/api/store";
import type { CosmeticItem, CosmeticRarity } from "@/lib/mock/cosmetics";
import { storeItemToCosmetic } from "@/lib/storeCosmetics";
import { useLanguage } from "@/lib/i18n/LanguageContext";
import { useSession } from "@/lib/session/SessionContext";
import { Avatar } from "@/components/common/Avatar";
import { CosmeticAvatarFrame, CosmeticBadgePill, ThemedCoverArtwork } from "@/components/cosmetics/CosmeticDisplay";

/** A design's look as a cosmetic, from its (possibly not yet uploaded) artwork. */
export function designCosmetic(input: {
  sku?: string;
  name: string;
  category: CreatorCategory;
  rarity?: string;
  priceTk?: number;
  assets: DesignAssets | null | undefined;
}): CosmeticItem {
  return storeItemToCosmetic({
    id: input.sku ?? "preview",
    sku: input.sku ?? "preview",
    name: input.name || "—",
    description: null,
    category: input.category as StoreItem["category"],
    priceTk: input.priceTk ?? 0,
    assetUrl: null,
    active: true,
    sortOrder: 0,
    metadata: { rarity: (input.rarity as CosmeticRarity | undefined) ?? "common" },
    assets: input.assets ?? {},
  });
}

/** The design where it's used: next to a name, around a photo, or as a profile cover. */
export function DesignPreview({
  category,
  name,
  assets,
  rarity,
  size = "md",
}: {
  category: CreatorCategory;
  name: string;
  assets: DesignAssets | null | undefined;
  rarity?: string;
  size?: "sm" | "md";
}) {
  const { user } = useSession();
  const item = designCosmetic({ category, name, assets, rarity });

  if (category === "frame") {
    return (
      <div className="flex items-center justify-center rounded-xl bg-bg-raised/70 py-4">
        <CosmeticAvatarFrame frame={assets?.frameUrl ? item : null} dpUrl={user.dpUrl} name={user.name} size={size === "sm" ? "md" : "lg"} mode="static" />
      </div>
    );
  }

  if (category === "badge") {
    return (
      <div className="flex items-center gap-3 rounded-xl bg-bg-raised/70 p-3">
        <Avatar dpUrl={user.dpUrl} name={user.name} size="sm" mode="static" />
        <div className="min-w-0 flex-1 truncate text-sm font-bold text-ink">{user.name}</div>
        {assets?.imageUrl ? <CosmeticBadgePill item={item} /> : <span className="h-9 w-9 rounded-full border border-dashed border-surface-line-strong" />}
      </div>
    );
  }

  if (category === "sticker_pack") {
    return (
      <div className="grid grid-cols-4 gap-2 rounded-xl bg-bg-raised/70 p-3">
        {(assets?.stickers ?? []).map((src) => (
          // eslint-disable-next-line @next/next/no-img-element
          <img key={src} src={src} alt="" className="aspect-square w-full object-contain" />
        ))}
      </div>
    );
  }

  // Themes, club themes and tournament banners: the banner as a cover, with an avatar on it.
  return (
    <div className="overflow-hidden rounded-xl border border-surface-line bg-bg-raised/70">
      <ThemedCoverArtwork theme={assets?.bannerUrl || assets?.colors ? item : null} name={name} className={size === "sm" ? "h-24" : "h-36 sm:h-44"} />
      <div className="-mt-7 flex items-end gap-3 px-3 pb-3">
        <div className="rounded-full border-4 border-bg-raised">
          <Avatar dpUrl={user.dpUrl} name={user.name} size="md" mode="static" />
        </div>
        {assets?.colors ? (
          <div className="mb-1 flex gap-1.5">
            <span className="h-4 w-4 rounded-full border border-white/20" style={{ background: assets.colors.primary }} />
            <span className="h-4 w-4 rounded-full border border-white/20" style={{ background: assets.colors.secondary }} />
          </div>
        ) : null}
      </div>
    </div>
  );
}

/** Status of a design as the creator sees it. */
export function designStatus(design: Pick<CreatorDesign, "reviewStatus" | "active" | "pendingAssets">) {
  if (design.reviewStatus === "approved") return design.active ? (design.pendingAssets ? "changePending" : "approved") : "paused";
  return design.reviewStatus;
}

const STATUS_CLASS: Record<ReturnType<typeof designStatus>, string> = {
  pending: "bg-warning-soft text-warning-ink",
  changePending: "bg-warning-soft text-warning-ink",
  approved: "bg-success-soft text-success-ink",
  paused: "bg-surface text-ink-soft",
  rejected: "bg-danger-soft text-danger-ink",
};

export function DesignStatusChip({ design }: { design: Pick<CreatorDesign, "reviewStatus" | "active" | "pendingAssets"> }) {
  const { t } = useLanguage();
  const status = designStatus(design);
  return (
    <span className={`rounded-full px-2 py-0.5 font-mono text-[10px] font-bold uppercase tracking-wide ${STATUS_CLASS[status]}`}>
      {t.creators.status[status]}
    </span>
  );
}
