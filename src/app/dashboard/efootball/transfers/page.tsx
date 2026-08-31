"use client";

import { useLanguage } from "@/lib/i18n/LanguageContext";
import { useMockTransferOffers } from "@/lib/mock/store";
import { mockTransferWindow } from "@/lib/mock";
import { PageHeader } from "@/components/dashboard/PageHeader";
import { StatusPill } from "@/components/dashboard/StatusPill";
import { TransferOfferCard } from "@/components/dashboard/TransferOfferCard";
import { EmptyState } from "@/components/dashboard/EmptyState";
import { SectionHeading } from "@/components/dashboard/SectionHeading";
import { SwapIcon } from "@/components/icons";

export default function TransfersPage() {
  const { t } = useLanguage();
  const offers = useMockTransferOffers();

  return (
    <div>
      <PageHeader
        eyebrow="eFootball"
        title={t.dashboard.shell.navTransfers}
        action={
          <StatusPill tone={mockTransferWindow.isOpen ? "success" : "neutral"}>
            {mockTransferWindow.isOpen
              ? t.dashboard.transfers.windowOpenLabel
              : t.dashboard.transfers.windowClosedLabel}
          </StatusPill>
        }
      />

      <div className="mt-8">
        <SectionHeading tone="warning">{t.dashboard.transfers.offersTitle}</SectionHeading>
        <div className="space-y-2">
          {offers.length > 0 ? (
            offers.map((offer) => <TransferOfferCard key={offer.id} offer={offer} />)
          ) : (
            <EmptyState icon={SwapIcon} title={t.dashboard.transfers.noOffers} body="" />
          )}
        </div>
      </div>
    </div>
  );
}
