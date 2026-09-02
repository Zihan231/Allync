"use client";

import { useState } from "react";
import Link from "next/link";
import { useLanguage } from "@/lib/i18n/LanguageContext";
import { useSession } from "@/lib/session/SessionContext";
import { useMockPeople, purchaseCosmetic, equipCosmetic } from "@/lib/mock/communityStore";
import {
  getCosmeticsByCategory,
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

export default function StorePage() {
  const { t } = useLanguage();
  const { user } = useSession();
  const people = useMockPeople();
  const [activeCategory, setActiveCategory] = useState<CosmeticCategory>("theme");
  const [selectedRarity, setSelectedRarity] = useState<CosmeticRarity | "all">("all");
  const [lastEquippedItem, setLastEquippedItem] = useState<CosmeticItem | null>(null);

  const person = people.find((p) => p.id === user.personId);

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

  const rawItems = getCosmeticsByCategory(activeCategory);
  const items =
    selectedRarity === "all"
      ? rawItems
      : rawItems.filter((i) => i.rarity === selectedRarity);

  const handleInstantEquip = (item: CosmeticItem) => {
    if (!person) return;
    purchaseCosmetic(person.id, item.id);
    equipCosmetic(person.id, item.category, item.id);
    setLastEquippedItem(item);
  };

  const handleUnequip = (item: CosmeticItem) => {
    if (!person) return;
    equipCosmetic(person.id, item.category, null);
    if (lastEquippedItem?.id === item.id) {
      setLastEquippedItem(null);
    }
  };

  const isItemEquipped = (item: CosmeticItem): boolean => {
    if (!person) return false;
    if (item.category === "badge") return person.equippedBadgeId === item.id;
    if (item.category === "title") return person.equippedTitleId === item.id;
    if (item.category === "frame") return person.equippedFrameId === item.id;
    if (item.category === "theme") return person.equippedThemeId === item.id;
    return false;
  };

  return (
    <div className="relative pb-16">
      {/* Background ambient lighting */}
      <div className="glow-gold pointer-events-none absolute left-1/2 top-0 -z-10 h-[500px] w-[500px] -translate-x-1/2 blur-[100px] opacity-40" />
      <div className="glow-blue pointer-events-none absolute right-0 top-32 -z-10 h-[380px] w-[380px] blur-[90px] opacity-35" />

      <PageHeader
        eyebrow="Cosmetic Locker"
        title="Unlimited Cosmetics Showcase"
        description="All 28 Mythic, Legendary, Epic & Rare Themes, Frames, Titles, and Badges are fully unlocked with unlimited instant access."
        action={
          <div className="flex flex-wrap items-center gap-2.5">
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

      {/* Unlimited Access Banner */}
      <div className="mt-6 rounded-2xl border border-emerald-500/40 bg-gradient-to-r from-emerald-950/70 via-bg-raised/90 to-emerald-950/70 p-4 shadow-xl backdrop-blur">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <span className="flex h-7 w-7 items-center justify-center rounded-full bg-emerald-500/20 text-emerald-300 font-black">
              ✓
            </span>
            <div>
              <p className="font-display text-sm font-bold text-ink">
                Unlocked Sandbox Mode
              </p>
              <p className="text-xs text-ink-soft">
                Click any Theme, Frame, Title or Badge to instantly equip it to your profile.
              </p>
            </div>
          </div>
          {lastEquippedItem ? (
            <div className="flex items-center gap-2 rounded-full border border-accent/40 bg-accent/15 px-3.5 py-1 text-xs font-bold text-accent-ink animate-pulse">
              <FlameIcon className="h-3.5 w-3.5" />
              Equipped: {lastEquippedItem.name}
            </div>
          ) : null}
        </div>
      </div>

      {/* Category tabs */}
      <div className="mt-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap gap-1.5 rounded-full border border-surface-line-strong p-1 w-fit bg-surface/60 backdrop-blur">
          {categories.map((cat) => (
            <button
              key={cat.id}
              type="button"
              onClick={() => setActiveCategory(cat.id)}
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

      {/* Items Grid */}
      <div className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {items.map((item) => {
          const isEquipped = isItemEquipped(item);
          const Icon = COSMETIC_ICON_MAP[item.icon] ?? ShieldIcon;
          const rarityCfg = RARITY_CONFIG[item.rarity];

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

                {/* Description */}
                <p className="mt-3 text-xs leading-relaxed text-ink-soft min-h-[36px]">
                  {item.description}
                </p>
              </div>

              {/* Bottom Action Footer */}
              <div className="mt-5 border-t border-surface-line pt-4 flex items-center justify-between gap-3">
                <span className="font-mono text-[11px] font-bold text-emerald-400 flex items-center gap-1">
                  <span>✓</span> UNLOCKED
                </span>

                {/* Instant Equip Action Button */}
                <div className="flex items-center gap-2">
                  {isEquipped ? (
                    <>
                      <span className="rounded-full bg-emerald-500/20 border border-emerald-400/50 px-3.5 py-1.5 text-xs font-bold text-emerald-300 shadow-sm flex items-center gap-1">
                        <span>●</span> {t.dashboard.store.equipped}
                      </span>
                      <button
                        type="button"
                        onClick={() => handleUnequip(item)}
                        className="text-xs text-ink-faint underline hover:text-ink transition-colors"
                      >
                        {t.dashboard.store.unequip}
                      </button>
                    </>
                  ) : (
                    <button
                      type="button"
                      onClick={() => handleInstantEquip(item)}
                      className={`rounded-full px-5 py-2 text-xs font-black uppercase tracking-wider shadow-lg transition-all duration-200 active:scale-95 ${
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
    </div>
  );
}
