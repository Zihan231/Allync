"use client";

import { Suspense, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useLanguage } from "@/lib/i18n/LanguageContext";
import { useSession } from "@/lib/session/SessionContext";
import { format } from "@/lib/i18n/translations";
import { useMockPeople, updatePersonProfile } from "@/lib/mock/communityStore";
import { useEquipStoreItem, useMyStore, usePurchaseStoreItem, useStoreCatalog } from "@/lib/api/hooks/useStore";
import type { MyStore } from "@/lib/api/store";
import { PaymentModal } from "@/components/dashboard/transfers/PaymentModal";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { STORE_RETURN_KEY, storeItemToCosmetic } from "@/lib/storeCosmetics";
import {
  RARITY_CONFIG,
  type CosmeticCategory,
  type CosmeticItem,
  type CosmeticRarity,
} from "@/lib/mock/cosmetics";
import { PageHeader } from "@/components/dashboard/PageHeader";
import {
  ShieldIcon,
  BallIcon,
  FlameIcon,
} from "@/components/icons";
import {
  CosmeticAvatarFrame,
  CosmeticBadgePill,
  CosmeticTitleText,
  ThemedCoverArtwork,
  COSMETIC_ICON_MAP,
} from "@/components/cosmetics/CosmeticDisplay";

function CardPreview({
  item,
  userName,
  dpUrl,
}: {
  item: CosmeticItem;
  userName: string;
  dpUrl: string | null;
}) {
  if (item.category === "badge") {
    return (
      <div className="relative flex h-28 items-center justify-center overflow-hidden rounded-xl border border-surface-line bg-gradient-to-b from-surface/90 to-bg-raised/90 p-4 shadow-inner">
        <div
          className="pointer-events-none absolute -inset-4 opacity-30 blur-xl"
          style={{ background: `radial-gradient(circle, ${item.color} 0%, transparent 70%)` }}
        />
        <div className="relative z-10 transition-transform duration-300 hover:scale-110">
          <CosmeticBadgePill item={item} />
        </div>
      </div>
    );
  }

  if (item.category === "title") {
    return (
      <div className="relative flex h-28 flex-col items-center justify-center overflow-hidden rounded-xl border border-surface-line bg-gradient-to-b from-surface/90 to-bg-raised/90 p-4 text-center shadow-inner">
        <div
          className="pointer-events-none absolute -inset-4 opacity-25 blur-xl"
          style={{ background: `radial-gradient(circle, ${item.color} 0%, transparent 70%)` }}
        />
        <span className="text-xs font-semibold text-ink-faint tracking-wider">{userName}</span>
        <div className="mt-1 relative z-10 transition-transform duration-300 hover:scale-105">
          <CosmeticTitleText item={item} size="md" />
        </div>
      </div>
    );
  }

  if (item.category === "frame") {
    return (
      <div className="relative flex h-28 items-center justify-center overflow-hidden rounded-xl border border-surface-line bg-gradient-to-b from-surface/90 to-bg-raised/90 p-4 shadow-inner">
        <div
          className="pointer-events-none absolute -inset-4 opacity-30 blur-xl"
          style={{ background: `radial-gradient(circle, ${item.color} 0%, transparent 70%)` }}
        />
        <div className="relative z-10 transition-transform duration-300 hover:scale-110">
          <CosmeticAvatarFrame frame={item} dpUrl={dpUrl} name={userName} size="md" mode="static" />
        </div>
      </div>
    );
  }

  // Profile Theme Preview Mockup
  return (
    <div className="relative flex h-32 flex-col justify-between overflow-hidden rounded-xl border border-surface-line text-left shadow-inner transition-transform duration-300 hover:scale-[1.02]">
      {/* Real Animated Bespoke Themed Cover Artwork in Preview */}
      <div className="absolute inset-0">
        <ThemedCoverArtwork theme={item} name={userName} className="h-full w-full" />
      </div>

      <div className="relative z-10 flex items-center justify-between p-2.5">
        <span
          className="font-mono text-[9px] uppercase px-2 py-0.5 rounded-full font-black border backdrop-blur shadow-md"
          style={{
            borderColor: `${item.color}90`,
            backgroundColor: "rgba(0,0,0,0.75)",
            color: item.color,
          }}
        >
          {item.rarity.toUpperCase()} STAGE
        </span>
      </div>

      <div className="relative z-10 m-2 flex items-center gap-2 rounded-lg bg-bg/90 p-1.5 backdrop-blur border border-white/10 shadow-xl">
        <div
          className="h-6 w-6 rounded-full border-2 bg-surface shrink-0 shadow-inner"
          style={{ borderColor: item.color }}
        />
        <div className="min-w-0 flex-1">
          <div className="flex items-center justify-between gap-1">
            <span className="text-[10px] font-black text-ink truncate">{userName}</span>
            <span
              className="text-[8px] font-mono font-bold uppercase truncate"
              style={{ color: item.color }}
            >
              {item.name}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * The cosmetics store: items are bought with the wallet (free ones claimed) and kept on
 * the account; the user switches between the items they own. Prices and availability
 * come from the server (staff manage them in the admin store manager).
 */
const CATEGORY_IDS: CosmeticCategory[] = ["theme", "frame", "title", "badge"];
const THEME_FILTERS = ["all", "team", "esports"] as const;
const RARITY_IDS: Array<CosmeticRarity | "all"> = ["all", "mythic", "legendary", "epic", "rare", "common"];
const pick = <T extends string>(value: string | null, allowed: readonly T[], fallback: T): T =>
  allowed.includes(value as T) ? (value as T) : fallback;

export default function StorePage() {
  return (
    <Suspense fallback={null}>
      <StoreContent />
    </Suspense>
  );
}

function StoreContent() {
  const { t } = useLanguage();
  const ts = t.dashboard.store;
  const { user } = useSession();
  const people = useMockPeople();
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const [activeCategory, setActiveCategory] = useState<CosmeticCategory>(() => pick(searchParams.get("cat"), CATEGORY_IDS, "theme"));
  const [themeFilter, setThemeFilter] = useState<"all" | "team" | "esports">(() => pick(searchParams.get("theme"), THEME_FILTERS, "all"));
  const [selectedRarity, setSelectedRarity] = useState<CosmeticRarity | "all">(() => pick(searchParams.get("rarity"), RARITY_IDS, "all"));
  const [ownedOnly, setOwnedOnly] = useState(() => searchParams.get("owned") === "1");
  const [lastEquippedItem, setLastEquippedItem] = useState<CosmeticItem | null>(null);
  const [notice, setNotice] = useState("");
  const [error, setError] = useState("");
  const [checkout, setCheckout] = useState<CosmeticItem | null>(null);
  const router = useRouter();

  const catalog = useStoreCatalog();

  // The filters live in the URL, so leaving and coming back keeps them.
  const query = new URLSearchParams({
    ...(activeCategory !== "theme" ? { cat: activeCategory } : {}),
    ...(themeFilter !== "all" ? { theme: themeFilter } : {}),
    ...(selectedRarity !== "all" ? { rarity: selectedRarity } : {}),
    ...(ownedOnly ? { owned: "1" } : {}),
  }).toString();
  const storeUrl = query ? `${pathname}?${query}` : pathname;
  useEffect(() => {
    router.replace(storeUrl, { scroll: false });
  }, [router, storeUrl]);

  // Back from "Try": scroll to where the user was, once the items are on the page.
  const scrolled = useRef(false);
  useEffect(() => {
    if (scrolled.current || !catalog.data) return;
    scrolled.current = true;
    let saved: { url: string; y: number } | null = null;
    try {
      saved = JSON.parse(sessionStorage.getItem(STORE_RETURN_KEY) ?? "null");
      sessionStorage.removeItem(STORE_RETURN_KEY);
    } catch {
      saved = null;
    }
    if (!saved) return;
    const y = saved.y;
    requestAnimationFrame(() => requestAnimationFrame(() => window.scrollTo({ top: y, behavior: "instant" })));
  }, [catalog.data]);

  /** Opens the real profile with the item on, remembering where the store was. */
  function tryOn(item: CosmeticItem) {
    try {
      sessionStorage.setItem(STORE_RETURN_KEY, JSON.stringify({ url: storeUrl, y: window.scrollY }));
    } catch {
      // Storage blocked: the store just opens at the top.
    }
    router.push(`/dashboard/efootball/players/${user.personId}?try=${encodeURIComponent(item.id)}`);
  }
  const mine = useMyStore();
  const purchase = usePurchaseStoreItem();
  const equip = useEquipStoreItem();
  const busy = purchase.isPending || equip.isPending;

  const person = people.find((p) => p.id === user.personId);
  const owned = new Set(mine.data?.owned ?? []);
  const allItems = (catalog.data ?? []).map(storeItemToCosmetic);

  const categories: { id: CosmeticCategory; label: string }[] = [
    { id: "theme", label: t.dashboard.store.tabThemes },
    { id: "frame", label: t.dashboard.store.tabFrames },
    { id: "title", label: t.dashboard.store.tabTitles },
    { id: "badge", label: t.dashboard.store.tabBadges },
  ];

  const rarities: { id: CosmeticRarity | "all"; label: string }[] = [
    { id: "all", label: "All Rarities" },
    { id: "mythic", label: "✦ Mythic" },
    { id: "legendary", label: "★ Legendary" },
    { id: "epic", label: "◆ Epic" },
    { id: "rare", label: "▲ Rare" },
    { id: "common", label: "• Common" },
  ];

  const rawItems = allItems.filter((i) => i.category === activeCategory);
  const items = rawItems
    .filter((i) => {
      if (activeCategory === "theme" && themeFilter !== "all") {
        if (themeFilter === "team") return i.subCategory === "team" || Boolean(i.teamDetails);
        if (themeFilter === "esports") return i.subCategory !== "team" && !i.teamDetails;
      }
      return true;
    })
    .filter((i) => (selectedRarity === "all" ? true : i.rarity === selectedRarity))
    .filter((i) => !ownedOnly || owned.has(i.id));

  /** Keeps the locally cached profile (used for cosmetics around the app) in step with the server. */
  const sync = (state: MyStore) => {
    if (!person) return;
    updatePersonProfile(person.id, {
      ownedCosmeticIds: state.owned,
      equippedBadgeId: state.equipped.badge ?? undefined,
      equippedTitleId: state.equipped.title ?? undefined,
      equippedFrameId: state.equipped.frame ?? undefined,
      equippedThemeId: state.equipped.theme ?? undefined,
    });
  };

  const errorText = (err: unknown) => {
    const message = (err as { response?: { data?: { message?: string | string[] } } })?.response?.data?.message;
    return (Array.isArray(message) ? message.join(", ") : message) || ts.actionError;
  };

  async function buy(item: CosmeticItem): Promise<null> {
    const state = await purchase.mutateAsync({ sku: item.id });
    sync(state);
    setLastEquippedItem(item);
    setNotice(format(ts.boughtToast, { name: item.name }));
    return null;
  }

  const handleBuy = async (item: CosmeticItem) => {
    setError("");
    setNotice("");
    if (item.priceBdt > 0) {
      setCheckout(item);
      return;
    }
    try {
      await buy(item);
    } catch (err) {
      setError(errorText(err));
    }
  };

  const handleInstantEquip = async (item: CosmeticItem) => {
    setError("");
    try {
      const state = await equip.mutateAsync({ category: item.category, sku: item.id });
      sync(state);
      setLastEquippedItem(item);
      setNotice(format(ts.equippedToast, { name: item.name }));
    } catch (err) {
      setError(errorText(err));
    }
  };

  const handleUnequip = async (item: CosmeticItem) => {
    setError("");
    try {
      const state = await equip.mutateAsync({ category: item.category, sku: null });
      sync(state);
      if (lastEquippedItem?.id === item.id) setLastEquippedItem(null);
    } catch (err) {
      setError(errorText(err));
    }
  };

  const isItemEquipped = (item: CosmeticItem): boolean => mine.data?.equipped[item.category] === item.id;

  return (
    <div className="relative pb-16">
      {/* Background ambient lighting */}
      <div className="glow-gold pointer-events-none absolute left-1/2 top-0 -z-10 h-[500px] w-[500px] -translate-x-1/2 blur-[100px] opacity-40" />
      <div className="glow-blue pointer-events-none absolute right-0 top-32 -z-10 h-[380px] w-[380px] blur-[90px] opacity-35" />

      <PageHeader
        eyebrow={ts.eyebrow}
        title={ts.pageTitle}
        description={ts.description}
        action={
          <div className="flex flex-wrap items-center gap-2.5">
            <Link
              href="/dashboard/efootball/wallet"
              className="flex items-center gap-2 rounded-full border border-emerald-400/40 bg-emerald-500/10 px-4 py-2 text-sm font-semibold text-emerald-200 transition-colors hover:bg-emerald-500/20"
              title={ts.addFunds}
            >
              <span className="font-mono text-[11px] uppercase tracking-wide text-emerald-300/80">{ts.balanceLabel}</span>
              <span className="font-display font-black">৳{(mine.data?.balanceTk ?? 0).toLocaleString()}</span>
            </Link>
            <Link
              href="/dashboard/efootball/profile"
              className="flex items-center gap-1.5 rounded-full border border-accent bg-accent/20 px-4 py-2 text-sm font-semibold text-accent-ink transition-all hover:bg-accent hover:text-bg shadow-sm"
            >
              <BallIcon className="h-4 w-4" />
              {t.dashboard.shell.navProfile}
            </Link>
            <Link
              href={`/dashboard/efootball/players/${user.personId}`}
              className="rounded-full border border-surface-line-strong bg-surface/40 px-4 py-2 text-sm font-semibold text-ink-soft transition-colors hover:border-accent hover:text-accent-ink"
            >
              {t.dashboard.playerProfile.viewPublicProfile}
            </Link>
          </div>
        }
      />

      {/* Collection summary, last action and errors */}
      <div className="mt-6 rounded-2xl border border-accent/30 bg-gradient-to-r from-accent/10 via-bg-raised/90 to-accent/10 p-4 shadow-xl backdrop-blur">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <p className="font-display text-sm font-bold text-ink">
              {format(ts.ownedCount, { owned: owned.size, total: allItems.length })}
            </p>
            <div className="flex rounded-full border border-surface-line-strong bg-surface/60 p-0.5 text-xs font-semibold">
              {([false, true] as const).map((value) => (
                <button
                  key={String(value)}
                  type="button"
                  onClick={() => setOwnedOnly(value)}
                  className={`rounded-full px-3 py-1 transition-colors ${ownedOnly === value ? "bg-accent text-bg" : "text-ink-soft hover:text-ink"}`}
                >
                  {value ? ts.ownedOnly : ts.allItems}
                </button>
              ))}
            </div>
          </div>
          {notice ? (
            <div className="flex items-center gap-2 rounded-full border border-accent/40 bg-accent/15 px-3.5 py-1 text-xs font-bold text-accent-ink">
              <FlameIcon className="h-3.5 w-3.5" />
              {notice}
            </div>
          ) : null}
        </div>
        {error ? (
          <p className="mt-3 rounded-lg border border-danger/40 bg-danger-soft px-3 py-2 text-xs font-semibold text-danger-ink" role="alert">
            {error}
          </p>
        ) : null}
        {catalog.isError ? <p className="mt-3 text-xs font-semibold text-danger-ink">{ts.loadError}</p> : null}
      </div>

      {/* Category tabs */}
      {/* Category tabs & Theme Sub-filter */}
      <div className="mt-8 flex flex-col gap-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex flex-wrap gap-1.5 rounded-full border border-surface-line-strong p-1 w-fit bg-surface/60 backdrop-blur">
            {categories.map((cat) => (
              <button
                key={cat.id}
                type="button"
                onClick={() => {
                  setActiveCategory(cat.id);
                  if (cat.id !== "theme") setThemeFilter("all");
                }}
                className={`rounded-full px-4 py-1.5 text-xs font-semibold transition-all ${
                  activeCategory === cat.id
                    ? "bg-accent text-bg shadow-md"
                    : "text-ink-soft hover:text-ink"
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>

          {/* Rarity filter pills */}
          <div className="flex flex-wrap gap-1.5">
            {rarities.map((r) => (
              <button
                key={r.id}
                type="button"
                onClick={() => setSelectedRarity(r.id)}
                className={`rounded-full px-3 py-1 text-[11px] font-mono font-medium transition-colors border ${
                  selectedRarity === r.id
                    ? "border-accent bg-accent-soft text-accent-ink shadow-sm"
                    : "border-surface-line bg-surface/40 text-ink-faint hover:text-ink"
                }`}
              >
                {r.label}
              </button>
            ))}
          </div>
        </div>

        {/* Theme Sub-filter Tabs (When Themes category is active) */}
        {activeCategory === "theme" ? (
          <div className="flex flex-wrap items-center gap-2 pt-1 border-t border-surface-line/50">
            <span className="text-xs font-mono font-bold text-ink-faint mr-1">THEME CATEGORY:</span>
            <button
              type="button"
              onClick={() => setThemeFilter("all")}
              className={`rounded-xl px-3 py-1 text-xs font-bold transition-all border ${
                themeFilter === "all"
                  ? "border-accent bg-accent text-bg shadow-sm"
                  : "border-surface-line bg-surface/40 text-ink-soft hover:text-ink"
              }`}
            >
              All Themes ({rawItems.length})
            </button>
            <button
              type="button"
              onClick={() => setThemeFilter("team")}
              className={`rounded-xl px-3 py-1 text-xs font-bold transition-all border flex items-center gap-1.5 ${
                themeFilter === "team"
                  ? "border-amber-400 bg-amber-400/20 text-amber-200 shadow-sm"
                  : "border-surface-line bg-surface/40 text-ink-soft hover:text-amber-300"
              }`}
            >
              <span>🏟️</span> Official Team Themes ({rawItems.filter((i) => i.subCategory === "team" || Boolean(i.teamDetails)).length})
            </button>
            <button
              type="button"
              onClick={() => setThemeFilter("esports")}
              className={`rounded-xl px-3 py-1 text-xs font-bold transition-all border flex items-center gap-1.5 ${
                themeFilter === "esports"
                  ? "border-cyan-400 bg-cyan-400/20 text-cyan-200 shadow-sm"
                  : "border-surface-line bg-surface/40 text-ink-soft hover:text-cyan-300"
              }`}
            >
              <span>⚡</span> Esports Concepts ({rawItems.filter((i) => i.subCategory !== "team" && !i.teamDetails).length})
            </button>
          </div>
        ) : null}
      </div>

      {catalog.isLoading ? (
        <div className="mt-6 flex h-48 items-center justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-accent border-t-transparent" />
        </div>
      ) : ownedOnly && items.length === 0 ? (
        <p className="mt-6 rounded-2xl border border-dashed border-surface-line p-8 text-center text-sm text-ink-soft">{ts.emptyOwned}</p>
      ) : null}

      {/* Items Grid */}
      <div className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {items.map((item) => {
          const isEquipped = isItemEquipped(item);
          const Icon = COSMETIC_ICON_MAP[item.icon] ?? ShieldIcon;
          const rarityCfg = RARITY_CONFIG[item.rarity];
          const tDetails = item.teamDetails;

          return (
            <div
              key={item.id}
              className={`group relative flex flex-col justify-between overflow-hidden rounded-2xl border bg-surface/60 p-5 backdrop-blur transition-all duration-300 hover:border-surface-line-strong hover:shadow-2xl ${
                isEquipped
                  ? "border-accent ring-2 ring-accent/70 shadow-[0_0_28px_rgba(217,165,68,0.3)]"
                  : rarityCfg.border
              }`}
            >
              {/* Corner decorative ambient glow */}
              <div
                className="pointer-events-none absolute -right-12 -top-12 h-32 w-32 rounded-full opacity-25 blur-2xl transition-opacity group-hover:opacity-50"
                style={{ backgroundColor: item.color }}
              />

              <div>
                {/* Top bar: Icon, Name, Rarity Badge */}
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div
                      className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-surface-line shadow-inner"
                      style={{
                        backgroundColor: `${item.color}15`,
                        borderColor: `${item.color}40`,
                        color: item.color,
                      }}
                    >
                      <Icon className="h-5 w-5" />
                    </div>
                    <div>
                      <h3 className="font-display text-base font-bold text-ink group-hover:text-accent-ink transition-colors">
                        {item.name}
                      </h3>
                      {item.tagline ? (
                        <p className="font-mono text-[10px] uppercase tracking-wider text-ink-faint">
                          {item.tagline}
                        </p>
                      ) : null}
                    </div>
                  </div>

                  {/* Rarity Chip */}
                  <span
                    className={`rounded-full px-2.5 py-0.5 font-mono text-[10px] font-extrabold uppercase tracking-wider border shadow-sm ${rarityCfg.pillClass}`}
                  >
                    {rarityCfg.label}
                  </span>
                </div>

                {/* Visual Live Preview */}
                <div className="mt-4">
                  <CardPreview item={item} userName={user.name} dpUrl={user.dpUrl} />
                </div>

                {/* Team Details Attachment Pill if applicable */}
                {tDetails ? (
                  <div className="mt-3 flex flex-wrap items-center gap-1.5 rounded-xl border border-white/10 bg-black/40 p-2 text-left font-mono text-[10px] backdrop-blur">
                    {tDetails.logoUrl ? (
                      <div className="flex h-5 w-5 shrink-0 items-center justify-center rounded-md overflow-hidden bg-white/10 p-0.5 shadow-inner">
                        <img
                          src={tDetails.logoUrl}
                          alt={tDetails.clubName}
                          className="h-full w-full object-contain"
                        />
                      </div>
                    ) : (
                      <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-md bg-white/10 text-xs">
                        {tDetails.badgeSymbol}
                      </span>
                    )}
                    <span className="font-bold text-white truncate max-w-[120px]">{tDetails.clubName}</span>
                    <span className="text-ink-muted">•</span>
                    <span className="text-ink-soft truncate max-w-[110px]">🏟️ {tDetails.stadium}</span>
                  </div>
                ) : null}

                {/* Description */}
                <p className="mt-2.5 text-xs leading-relaxed text-ink-soft min-h-[36px]">
                  {item.description}
                </p>
              </div>

              {/* Bottom Action Footer */}
              <div className="mt-5 border-t border-surface-line pt-4 flex items-center justify-between gap-3">
                {owned.has(item.id) ? (
                  <span className="font-mono text-[11px] font-bold text-emerald-400 flex items-center gap-1">
                    <span>✓</span> {ts.owned}
                  </span>
                ) : (
                  <span className="font-display text-sm font-black text-ink">
                    {item.priceBdt > 0 ? `৳${item.priceBdt.toLocaleString()}` : ts.free}
                  </span>
                )}

                {/* Instant Equip Action Button */}
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    // See it on your real profile: every section the item changes.
                    onClick={() => tryOn(item)}
                    className="rounded-full border border-surface-line-strong px-3.5 py-2 text-xs font-bold text-ink-soft transition-colors hover:border-accent hover:text-accent-ink"
                  >
                    {ts.try}
                  </button>
                  {!owned.has(item.id) ? (
                    <button
                      type="button"
                      onClick={() => handleBuy(item)}
                      disabled={busy || mine.isLoading}
                      className="rounded-full bg-accent px-5 py-2 text-xs font-black uppercase tracking-wider text-bg shadow-lg transition-all hover:brightness-110 active:scale-95 disabled:opacity-50"
                    >
                      {item.priceBdt > 0 ? format(ts.buyFor, { amount: item.priceBdt.toLocaleString() }) : ts.getFree}
                    </button>
                  ) : isEquipped ? (
                    <>
                      <span className="rounded-full bg-emerald-500/20 border border-emerald-400/50 px-3.5 py-1.5 text-xs font-bold text-emerald-300 shadow-sm flex items-center gap-1">
                        <span>●</span> {t.dashboard.store.equipped}
                      </span>
                      <button
                        type="button"
                        onClick={() => handleUnequip(item)}
                        disabled={busy}
                        className="text-xs text-ink-faint underline hover:text-ink transition-colors"
                      >
                        {t.dashboard.store.unequip}
                      </button>
                    </>
                  ) : (
                    <button
                      type="button"
                      onClick={() => handleInstantEquip(item)}
                      disabled={busy}
                      className={`disabled:opacity-50 rounded-full px-5 py-2 text-xs font-black uppercase tracking-wider shadow-lg transition-all duration-200 active:scale-95 ${
                        item.rarity === "mythic"
                          ? "bg-gradient-to-r from-rose-500 via-purple-600 to-cyan-500 text-white hover:brightness-110 shadow-[0_0_16px_rgba(255,0,128,0.5)]"
                          : item.rarity === "legendary"
                          ? "bg-gradient-to-r from-amber-400 to-yellow-500 text-bg hover:brightness-110 shadow-[0_0_14px_rgba(217,165,68,0.5)]"
                          : item.rarity === "epic"
                          ? "bg-gradient-to-r from-purple-500 to-pink-500 text-white hover:brightness-110 shadow-[0_0_12px_rgba(168,85,247,0.4)]"
                          : "bg-accent text-bg hover:bg-accent-hover"
                      }`}
                    >
                      {t.dashboard.store.equip}
                    </button>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {checkout ? (
        <PaymentModal
          amountTk={checkout.priceBdt}
          payeeName="ALLYNQ Store"
          purpose={format(ts.purchaseTitle, { name: checkout.name })}
          balanceTk={mine.data?.balanceTk ?? null}
          onPay={() => buy(checkout)}
          onClose={() => setCheckout(null)}
        />
      ) : null}
    </div>
  );
}
