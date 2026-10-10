import type { StoreItem } from "@/lib/api/store";
import { getCosmetic, type CosmeticItem, type CosmeticRarity } from "@/lib/mock/cosmetics";

/** sessionStorage key: the store URL (tab, filters) and scroll height to return to after "Try". */
export const STORE_RETURN_KEY = "store:return";

/**
 * A store item with its look: built-in items reuse the app's cosmetic design (same SKU);
 * items staff created get a plain one. Price and name come from the store.
 */
export function storeItemToCosmetic(item: StoreItem): CosmeticItem {
  const base = getCosmetic(item.sku);
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

/** The look of an item by SKU: from the store catalogue when loaded, else the built-in design. */
export function cosmeticBySku(sku: string | null | undefined, catalog: StoreItem[] | undefined): CosmeticItem | null {
  if (!sku) return null;
  const item = catalog?.find((i) => i.sku === sku);
  return item ? storeItemToCosmetic(item) : (getCosmetic(sku) ?? null);
}
