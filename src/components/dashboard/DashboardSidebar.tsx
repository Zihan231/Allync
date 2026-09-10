"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useLanguage } from "@/lib/i18n/LanguageContext";
import {
  HomeIcon,
  UsersIcon,
  TrophyIcon,
  CalendarIcon,
  WalletIcon,
  ChartIcon,
} from "../icons";

type NavItem = {
  href: string;
  label: string;
  icon: (props: { className?: string }) => React.ReactElement;
};

export function DashboardSidebar({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const { t } = useLanguage();
  const pathname = usePathname();

  const playerBase = "/dashboard/efootball";
  const playerItems: NavItem[] = [
    { href: playerBase, label: t.dashboard.shell.navOverview, icon: HomeIcon },
    {
      href: `${playerBase}/clubs`,
      label: t.dashboard.clubs.browseTitle,
      icon: UsersIcon,
    },
    { href: `${playerBase}/tournaments`, label: t.dashboard.shell.navTournaments, icon: TrophyIcon },
    { href: `${playerBase}/matches`, label: t.dashboard.shell.navMatches, icon: CalendarIcon },
    { href: `${playerBase}/wallet`, label: t.dashboard.shell.navWallet, icon: WalletIcon },
    { href: `${playerBase}/rankings`, label: t.dashboard.rankings.pageTitle, icon: TrophyIcon },
    { href: `${playerBase}/profile`, label: t.dashboard.shell.navProfile, icon: ChartIcon },
  ];

  const items = playerItems;

  const isActive = (href: string) =>
    href === playerBase
      ? pathname === href
      : pathname.startsWith(href);

  const content = (
    <nav className="flex flex-col gap-1 p-3">
      {items.map((item) => {
        const active = isActive(item.href);
        return (
          <Link
            key={item.href}
            href={item.href}
            onClick={onClose}
            className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
              active
                ? "bg-accent-soft text-accent-ink"
                : "text-ink-soft hover:bg-surface hover:text-ink"
            }`}
          >
            <item.icon className="h-4.5 w-4.5" />
            {item.label}
          </Link>
        );
      })}
    </nav>
  );

  return (
    <>
      <aside className="fixed top-14 min-[400px]:top-16 left-0 bottom-0 z-20 hidden w-60 shrink-0 overflow-y-auto border-r border-surface-line/70 bg-bg/95 backdrop-blur-md lg:block">
        {content}
      </aside>

      {open ? (
        <div className="fixed inset-0 z-40 lg:hidden">
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={onClose}
          />
          <div className="relative flex h-full w-64 flex-col border-r border-surface-line bg-bg-raised shadow-2xl overflow-y-auto">
            <div className="flex items-center justify-center border-b border-surface-line/70 px-4 py-3.5">
              <Link
                href={playerBase}
                onClick={onClose}
                className="font-display text-lg font-bold tracking-tight text-ink"
              >
                eFootball <span className="text-accent">Hub</span>
              </Link>
            </div>
            {content}
          </div>
        </div>
      ) : null}
    </>
  );
}
