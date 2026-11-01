import { api } from "./axios";

export type StoreCategory = "badge" | "title" | "frame" | "theme";

/** An item on sale (store_items, managed by staff). Built-in items share their SKU with the app's cosmetics. */
export interface StoreItem {
  id: string;
  sku: string;
  name: string;
  description: string | null;
  category: StoreCategory;
  priceTk: number;
  assetUrl: string | null;
  active: boolean;
  sortOrder: number;
  metadata: { rarity?: string } & Record<string, unknown>;
  /** Who the item is for: players, or (bought by their leaders) clubs and tournaments. */
  target?: "player" | "club" | "tournament";
  /** A creator's artwork (null for ALLYNQ's own items). */
  assets?: DesignAssets | null;
  creatorUserId?: string | null;
  creator?: { id: string; name: string } | null;
  salesCount?: number;
}

/** A creator's uploaded files (by design type) and theme colours. */
export interface DesignAssets {
  imageUrl?: string;
  bannerUrl?: string;
  frameUrl?: string;
  colors?: { primary: string; secondary: string };
  stickers?: string[];
}

/** The signed-in user's side of the store. */
export interface MyStore {
  balanceTk: number;
  /** SKUs the user owns. */
  owned: string[];
  /** Equipped SKU per category. */
  equipped: Record<StoreCategory, string | null>;
}

export const getStoreCatalog = async () => (await api.get<StoreItem[]>("/store/catalog")).data;
export const getMyStore = async () => (await api.get<MyStore>("/store/me")).data;
/** Buys an item with the wallet (free items are just added); equips it unless `equip` is false. */
export const purchaseStoreItem = async (sku: string, equip = true) =>
  (await api.post<MyStore>("/store/purchase", { sku, equip })).data;
/** Wears an owned item, or takes a category off (`sku` null). */
export const equipStoreItem = async (category: StoreCategory, sku: string | null) =>
  (await api.post<MyStore>("/store/equip", { category, sku })).data;
