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
  /** False for designs no longer sold (owners still show them). */
  onSale?: boolean;
  /** The approved look's number, and earlier looks owners may keep. */
  version?: number;
  versions?: DesignVersion[];
}

/** An earlier approved look of a creator's design. */
export interface DesignVersion {
  version: number;
  assets: DesignAssets;
  approvedAt: string | null;
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
  /** Creator designs kept on an earlier look: SKU → version (missing = latest). */
  versions: Record<string, number>;
}

export const getStoreCatalog = async () => (await api.get<StoreItem[]>("/store/catalog")).data;
export const getMyStore = async () => (await api.get<MyStore>("/store/me")).data;
/** Buys an item with the wallet (free items are just added); equips it unless `equip` is false. */
export const purchaseStoreItem = async (sku: string, equip = true) =>
  (await api.post<MyStore>("/store/purchase", { sku, equip })).data;
/** Wears an owned item, or takes a category off (`sku` null). */
export const equipStoreItem = async (category: StoreCategory, sku: string | null) =>
  (await api.post<MyStore>("/store/equip", { category, sku })).data;

/** A club's themes and wallet, for its President / General Secretary. */
export interface ClubStore {
  clubId: string;
  /** Club themes are paid from the club wallet. */
  balanceTk: number;
  owned: string[];
  equipped: string | null;
  versions: Record<string, number>;
}

export const getClubStore = async (clubId: string) => (await api.get<ClubStore>(`/store/clubs/${clubId}`)).data;
/** A club leader buys a club theme from the club wallet (and puts it on the club page). */
export const purchaseClubTheme = async (clubId: string, sku: string, equip = true) =>
  (await api.post<ClubStore>("/store/purchase", { sku, clubId, equip })).data;
/** Puts one of the club's themes on its page, or (null) none. */
export const setClubTheme = async (clubId: string, sku: string | null) =>
  (await api.post<ClubStore>(`/store/clubs/${clubId}/theme`, { sku })).data;
/** Buys a tournament banner; with `tournamentId` it goes on that tournament. */
export const purchaseBanner = async (sku: string, tournamentId?: string) =>
  (await api.post<MyStore>("/store/purchase", { sku, tournamentId })).data;
/** Keeps an earlier look of a design I (or, with clubId, my club) own; null follows the latest. */
export const setDesignVersion = async (sku: string, version: number | null, clubId?: string) =>
  (await api.post<MyStore | ClubStore>("/store/version", { sku, version, clubId })).data;
/** Puts a banner I own on a tournament I manage, or (null) takes it off. */
export const setTournamentBanner = async (tournamentId: string, sku: string | null) =>
  (await api.post<{ tournamentId: string; bannerSku: string | null }>(`/store/tournaments/${tournamentId}/banner`, { sku })).data;
