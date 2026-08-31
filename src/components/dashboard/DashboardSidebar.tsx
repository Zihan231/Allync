"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useRouter } from "next/navigation";
import { useLanguage } from "@/lib/i18n/LanguageContext";
import { useSession, type Mode } from "@/lib/session/SessionContext";
import { RoleToggle } from "../auth/RoleToggle";
import {
  HomeIcon,
  UsersIcon,
  TrophyIcon,
  BracketIcon,
  CalendarIcon,
  SwapIcon,
  WalletIcon,
  ShieldIcon,
  PlusIcon,
  GavelIcon,
  ChartIcon,
  LockIcon,
  SettingsIcon,
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
  const { user, setMode } = useSession();
  const pathname = usePathname();
  const router = useRouter();

  const handleModeChange = (mode: Mode) => {
    setMode(mode);
    onClose();
    router.push(mode === "organizer" ? "/dashboard/organizer" : "/dashboard");
  };

  const playerBase = `/dashboard/${user.activeGame}`;
  const playerItems: NavItem[] = [
    { href: playerBase, label: t.dashboard.shell.navOverview, icon: HomeIcon },
    { href: `${playerBase}/club`, label: t.dashboard.shell.navMyClub, icon: UsersIcon },
    { href: `${playerBase}/community`, label: t.dashboard.shell.navCommunity, icon: ShieldIcon },
    { href: `${playerBase}/tournaments`, label: t.dashboard.shell.navTournaments, icon: TrophyIcon },
    { href: `${playerBase}/matches`, label: t.dashboard.shell.navMatches, icon: CalendarIcon },
    { href: `${playerBase}/transfers`, label: t.dashboard.shell.navTransfers, icon: SwapIcon },
    { href: `${playerBase}/wallet`, label: t.dashboard.shell.navWallet, icon: WalletIcon },
    { href: `${playerBase}/profile`, label: t.dashboard.shell.navProfile, icon: ChartIcon },
  ];

  const organizerItems: NavItem[] = [
    { href: "/dashboard/organizer", label: t.dashboard.shell.navOrganizerOverview, icon: HomeIcon },
    { href: "/dashboard/organizer/tournaments", label: t.dashboard.shell.navMyTournaments, icon: TrophyIcon },
    { href: "/dashboard/organizer/tournaments/create", label: t.dashboard.shell.navCreateTournament, icon: PlusIcon },
    { href: "/dashboard/organizer/disputes", label: t.dashboard.shell.navDisputes, icon: GavelIcon },
    { href: "/dashboard/organizer/payouts", label: t.dashboard.shell.navPayouts, icon: WalletIcon },
    { href: "/dashboard/organizer/verification", label: t.dashboard.shell.navVerification, icon: LockIcon },
    ...(user.community && user.community.role !== "Member"
      ? [{ href: "/dashboard/organizer/community", label: t.dashboard.shell.navCommunityMgmt, icon: ShieldIcon }]
      : []),
    { href: "/dashboard/organizer/settings", label: t.dashboard.shell.navSettings, icon: SettingsIcon },
  ];

  const items = user.mode === "player" ? playerItems : organizerItems;

  const isActive = (href: string) =>
    href === playerBase || href === "/dashboard/organizer"
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
      <aside className="hidden w-60 shrink-0 border-r border-surface-line/70 lg:block">
        {content}
      </aside>

      {open ? (
        <div className="fixed inset-0 z-40 lg:hidden">
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={onClose}
          />
          <div className="relative flex h-full w-64 flex-col border-r border-surface-line bg-bg-raised shadow-2xl">
            <div className="border-b border-surface-line/70 p-3 sm:hidden">
              <RoleToggle value={user.mode} onChange={handleModeChange} className="w-full" />
            </div>
            {content}
          </div>
        </div>
      ) : null}
    </>
  );
}
