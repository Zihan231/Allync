import type { StoreItem } from "@/lib/api/store";
import { getCosmetic, type CosmeticItem, type CosmeticRarity } from "@/lib/mock/cosmetics";

/** sessionStorage key: the store URL (tab, filters) and scroll height to return to after "Try". */
export const STORE_RETURN_KEY = "store:return";

/**
 * A store item with its look: built-in items reuse the app's cosmetic design (same SKU);
 * items staff created get a plain one. Price and name come from the store.
 */
export function storeItemToCosmetic(item: StoreItem, version?: number | null): CosmeticItem {
  const base = getCosmetic(item.sku);
  if (item.assets) return creatorCosmetic({ ...item, assets: designAssetsAt(item, version) });
  if (base) return { ...base, name: item.name || base.name, description: item.description ?? base.description, priceBdt: item.priceTk };
  return {
    id: item.sku,
    category: item.category,
    tier: item.priceTk > 0 ? "premium" : "free",
    rarity: (item.metadata?.rarity as CosmeticRarity | undefined) ?? "common",
    unlockMethod: item.priceTk > 0 ? "purchase" : "free",
    name: item.name,
    description: item.description ?? "",
    icon: "shield",
    tone: "accent",
    color: "#d9a544",
    priceBdt: item.priceTk,
  };
}

/** A creator's design: its uploaded artwork, coloured by the creator's theme colours. */
function creatorCosmetic(item: StoreItem): CosmeticItem {
  const { assets } = item;
  const primary = assets?.colors?.primary ?? "#d9a544";
  return {
    id: item.sku,
    category: item.category as CosmeticItem["category"],
    tier: item.priceTk > 0 ? "premium" : "free",
    rarity: (item.metadata?.rarity as CosmeticRarity | undefined) ?? "common",
    unlockMethod: item.priceTk > 0 ? "purchase" : "free",
    name: item.name,
    description: item.description ?? "",
    icon: "shield",
    tone: "accent",
    color: primary,
    secondaryColor: assets?.colors?.secondary,
    priceBdt: item.priceTk,
    custom: { ...assets, creator: item.creator ?? null },
  };
}

/** A creator design's look at `version` (an earlier one its owner kept); 0 or none = the latest. */
export function designAssetsAt(item: StoreItem, version?: number | null) {
  if (!version || version === item.version) return item.assets;
  return item.versions?.find((v) => v.version === version)?.assets ?? item.assets;
}

/**
 * The look of an item by SKU: from the store catalogue when loaded, else the built-in design.
 * `versions` is its owner's choice of look for creator designs (SKU → version).
 */
export function cosmeticBySku(
  sku: string | null | undefined,
  catalog: StoreItem[] | undefined,
  versions?: Record<string, number> | null,
): CosmeticItem | null {
  if (!sku) return null;
  const item = catalog?.find((i) => i.sku === sku);
  return item ? storeItemToCosmetic(item, versions?.[sku]) : (getCosmetic(sku) ?? null);
}
