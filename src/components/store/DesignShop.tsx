"use client";

import { useState, type ReactNode } from "react";
import Link from "next/link";
import { useLanguage } from "@/lib/i18n/LanguageContext";
import { format } from "@/lib/i18n/translations";
import { useSession } from "@/lib/session/SessionContext";
import {
  useClubStore,
  useMyStore,
  usePurchaseBanner,
  usePurchaseClubTheme,
  useSetClubTheme,
  useStoreCatalog,
} from "@/lib/api/hooks/useStore";
import { useTournament } from "@/lib/api/hooks/useTournaments";
import { apiMessage, type CreatorCategory } from "@/lib/api/creators";
import type { StoreItem } from "@/lib/api/store";
import { tk } from "@/components/dashboard/transfers/shared";
import { PaymentModal } from "@/components/dashboard/transfers/PaymentModal";
import { DesignPreview } from "@/components/creators/DesignPreview";

const CLUB_LEADERS = ["President", "General Secretary"];

/** One club theme or banner for sale: its look in place, its creator, price and action. */
function ShopCard({ item, action }: { item: StoreItem; action: ReactNode }) {
  const { t } = useLanguage();
  return (
    <article className="flex flex-col gap-3 rounded-2xl border border-surface-line bg-surface/60 p-4" data-testid="design-shop-card">
      <DesignPreview category={item.category as CreatorCategory} name={item.name} assets={item.assets} rarity={item.metadata?.rarity} />
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <h3 className="truncate font-display text-base font-bold text-ink">{item.name}</h3>
          {item.creator ? (
            <Link href={`/dashboard/efootball/creators/${item.creator.id}`} className="text-[11px] font-semibold text-ink-soft hover:text-accent-ink">
              {format(t.creators.store.by, { name: item.creator.name })}
            </Link>
          ) : null}
        </div>
        <span className="font-mono text-xs font-bold text-accent-ink">{item.priceTk ? tk(item.priceTk) : t.dashboard.store.free}</span>
      </div>
      {item.description ? <p className="text-xs text-ink-soft">{item.description}</p> : null}
      <div className="mt-auto flex flex-wrap items-center justify-end gap-2 border-t border-surface-line pt-3">{action}</div>
    </article>
  );
}

const pill = "rounded-full px-4 py-1.5 text-xs font-bold transition-colors disabled:opacity-50";

/** Club themes: browsed by anyone, bought (from the club wallet) and switched by the club's leaders. */
export function ClubThemeShop({ onToast }: { onToast: (message: string, variant?: "success" | "error") => void }) {
  const { t } = useLanguage();
  const ts = t.creators.shop;
  const { user } = useSession();
  const club = user.club;
  const isLeader = Boolean(club && CLUB_LEADERS.includes(club.role));
  const items = (useStoreCatalog().data ?? []).filter((i) => i.target === "club");
  const clubStore = useClubStore(club?.id, isLeader);
  const buy = usePurchaseClubTheme();
  const setTheme = useSetClubTheme();
  const [checkout, setCheckout] = useState<StoreItem | null>(null);

  const use = async (sku: string) => {
    try {
      await setTheme.mutateAsync({ clubId: club!.id, sku });
      onToast(ts.themeUpdated, "success");
    } catch (err) {
      onToast(apiMessage(err, t.dashboard.store.actionError), "error");
    }
  };

  return (
    <section className="mt-8 space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-surface-line bg-surface/50 px-4 py-3 text-sm">
        {isLeader && club ? (
          <>
            <span className="text-ink-soft">
              {format(ts.clubWallet, { club: club.name })}: <b className="text-ink">{clubStore.data ? tk(clubStore.data.balanceTk) : "…"}</b>
            </span>
            <Link href={`/dashboard/efootball/clubs/${club.id}`} className="text-xs font-semibold text-accent-ink hover:underline">
              {ts.viewClub} →
            </Link>
          </>
        ) : (
          <span className="text-ink-soft">{ts.leadersOnly}</span>
        )}
      </div>
      {items.length ? (
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {items.map((item) => {
            const owned = clubStore.data?.owned.includes(item.sku);
            const onPage = clubStore.data?.equipped === item.sku;
            return (
              <ShopCard
                key={item.id}
                item={item}
                action={
                  !isLeader ? null : onPage ? (
                    <span className="text-xs font-bold text-success-ink">✓ {ts.onPage}</span>
                  ) : owned ? (
                    <button type="button" disabled={setTheme.isPending} onClick={() => use(item.sku)} className={`${pill} border border-accent text-accent-ink hover:bg-accent hover:text-bg`}>
                      {ts.use}
                    </button>
                  ) : (
                    <button type="button" onClick={() => setCheckout(item)} className={`${pill} bg-accent text-bg hover:brightness-110`}>
                      {item.priceTk ? format(ts.buyFor, { amount: tk(item.priceTk) }) : t.dashboard.store.getFree}
                    </button>
                  )
                }
              />
            );
          })}
        </div>
      ) : (
        <p className="rounded-2xl border border-dashed border-surface-line p-8 text-center text-sm text-ink-soft">{ts.empty}</p>
      )}
      {checkout && club ? (
        <PaymentModal
          amountTk={checkout.priceTk}
          payeeName="ALLYNQ Store"
          purpose={format(t.dashboard.store.purchaseTitle, { name: checkout.name })}
          balanceTk={clubStore.data?.balanceTk ?? null}
          onPay={async () => {
            await buy.mutateAsync({ clubId: club.id, sku: checkout.sku });
            onToast(format(ts.bought, { name: checkout.name }), "success");
            return null;
          }}
          onClose={() => setCheckout(null)}
        />
      ) : null}
    </section>
  );
}

/** Tournament banners: bought by organizers from their wallet; with `tournamentId` it goes straight on that tournament. */
export function BannerShop({
  tournamentId,
  onToast,
}: {
  tournamentId: string | null;
  onToast: (message: string, variant?: "success" | "error") => void;
}) {
  const { t } = useLanguage();
  const ts = t.creators.shop;
  const items = (useStoreCatalog().data ?? []).filter((i) => i.target === "tournament");
  const mine = useMyStore();
  const { data: tournament } = useTournament(tournamentId ?? "");
  const buy = usePurchaseBanner();
  const [checkout, setCheckout] = useState<StoreItem | null>(null);

  return (
    <section className="mt-8 space-y-4">
      <p className="rounded-2xl border border-surface-line bg-surface/50 px-4 py-3 text-sm text-ink-soft">
        {tournamentId && tournament ? format(ts.bannerFor, { name: tournament.name }) : ts.bannerHint}
      </p>
      {items.length ? (
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {items.map((item) => (
            <ShopCard
              key={item.id}
              item={item}
              action={
                mine.data?.owned.includes(item.sku) ? (
                  <span className="text-xs font-bold text-success-ink">✓ {ts.owned}</span>
                ) : (
                  <button type="button" onClick={() => setCheckout(item)} className={`${pill} bg-accent text-bg hover:brightness-110`}>
                    {item.priceTk ? format(ts.buyFor, { amount: tk(item.priceTk) }) : t.dashboard.store.getFree}
                  </button>
                )
              }
            />
          ))}
        </div>
      ) : (
        <p className="rounded-2xl border border-dashed border-surface-line p-8 text-center text-sm text-ink-soft">{ts.empty}</p>
      )}
      {checkout ? (
        <PaymentModal
          amountTk={checkout.priceTk}
          payeeName="ALLYNQ Store"
          purpose={format(t.dashboard.store.purchaseTitle, { name: checkout.name })}
          balanceTk={mine.data?.balanceTk ?? null}
          onPay={async () => {
            await buy.mutateAsync({ sku: checkout.sku, tournamentId: tournamentId ?? undefined });
            onToast(format(ts.bought, { name: checkout.name }), "success");
            return null;
          }}
          onClose={() => setCheckout(null)}
        />
      ) : null}
    </section>
  );
}
