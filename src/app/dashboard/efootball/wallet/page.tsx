"use client";

import Link from "next/link";
import { useLanguage } from "@/lib/i18n/LanguageContext";
import { useSession } from "@/lib/session/SessionContext";
import { mockWalletTransactions } from "@/lib/mock";
import { PageHeader } from "@/components/dashboard/PageHeader";
import { StatTile } from "@/components/dashboard/StatTile";
import { TransactionRow } from "@/components/dashboard/TransactionRow";
import { SectionHeading } from "@/components/dashboard/SectionHeading";
import { WalletIcon } from "@/components/icons";

export default function WalletPage() {
  const { t } = useLanguage();
  const { user } = useSession();

  return (
    <div>
      <PageHeader eyebrow="eFootball" title={t.dashboard.shell.navWallet} />

      <div className="mt-8 grid gap-4 sm:grid-cols-2">
        <StatTile label={t.dashboard.wallet.balanceLabel} value={`৳ ${user.wallet.balanceBdt.toLocaleString()}`} icon={WalletIcon} />
      </div>

      {user.kycStatus !== "verified" ? (
        <div className="mt-6 rounded-xl border border-warning/30 bg-warning-soft px-4 py-3 text-sm text-warning-ink">
          {t.dashboard.wallet.kycBanner}{" "}
          <Link href="/dashboard/organizer/verification" className="font-semibold underline">
            {t.dashboard.shell.navVerification}
          </Link>
        </div>
      ) : null}

      <div className="mt-8">
        <SectionHeading tone="success">{t.dashboard.wallet.historyTitle}</SectionHeading>
        <div className="space-y-2">
          {mockWalletTransactions.map((tx) => (
            <TransactionRow key={tx.id} tx={tx} />
          ))}
        </div>
      </div>
    </div>
  );
}
