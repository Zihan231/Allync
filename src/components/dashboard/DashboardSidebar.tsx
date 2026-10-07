"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useRouter } from "next/navigation";
import { useLanguage } from "@/lib/i18n/LanguageContext";
import { useSession, type Mode } from "@/lib/session/SessionContext";
import { hasRole } from "@/lib/api/admin";
import { useAdminReportCounts } from "@/lib/api/hooks/useReports";
import { RoleToggle } from "../auth/RoleToggle";
import {
  HomeIcon,
  UsersIcon,
  TrophyIcon,
  CalendarIcon,
  SwapIcon,
  WalletIcon,
  StoreIcon,
  ShieldIcon,
  ChartIcon,
  LockIcon,
  TrashIcon,
  ClockIcon,
  FlagIcon,
  GavelIcon,
  BellIcon,
  SettingsIcon,
} from "../icons";

type NavItem = {
  href: string;
  label: string;
  icon: (props: { className?: string }) => React.ReactElement;
  /** Small count shown next to the label (e.g. open reports). */
  badge?: number;
};

export function DashboardSidebar({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const { t } = useLanguage();
  const { user } = useSession();
  const pathname = usePathname();
  const router = useRouter();
  const isStaff = Boolean(user.systemRole);
  const mode: Mode = isStaff && pathname.startsWith("/dashboard/admin") ? "admin" : "player";
  const { data: reportCounts } = useAdminReportCounts(mode === "admin");

  const handleModeChange = (next: Mode) => {
    onClose();
    router.push(next === "admin" ? "/dashboard/admin" : "/dashboard");
  };

  const playerBase = `/dashboard/${user.activeGame}`;
  const playerItems: NavItem[] = [
    { href: playerBase, label: t.dashboard.shell.navOverview, icon: HomeIcon },
    {
      href: `${playerBase}/clubs`,
      label: t.dashboard.clubs.browseTitle,
      icon: UsersIcon,
    },
    {
      href: `${playerBase}/community`,
      label: t.dashboard.community.browseTitle,
      icon: ShieldIcon,
    },
    { href: `${playerBase}/tournaments`, label: t.dashboard.shell.navMyTournaments, icon: TrophyIcon },
    { href: `${playerBase}/matches`, label: t.dashboard.shell.navMatches, icon: CalendarIcon },
    { href: `${playerBase}/transfers`, label: t.dashboard.transfers.pageTitle, icon: SwapIcon },
    { href: `${playerBase}/wallet`, label: t.dashboard.shell.navWallet, icon: WalletIcon },
    { href: `${playerBase}/rankings`, label: t.dashboard.rankings.pageTitle, icon: TrophyIcon },
    { href: `${playerBase}/store`, label: t.dashboard.shell.navStore, icon: StoreIcon },
    { href: `${playerBase}/profile`, label: t.dashboard.shell.navProfile, icon: ChartIcon },
    { href: `${playerBase}/reports`, label: t.reports.myTitle, icon: FlagIcon },
  ];

  const adminItems: NavItem[] = [
    { href: "/dashboard/admin", label: t.admin.nav.dashboard, icon: ChartIcon },
    { href: "/dashboard/admin/users", label: t.admin.nav.users, icon: UsersIcon },
    { href: "/dashboard/admin/reports", label: t.admin.nav.reports, icon: FlagIcon, badge: reportCounts?.active },
    { href: "/dashboard/admin/disputes", label: t.admin.nav.disputes, icon: GavelIcon },
    { href: "/dashboard/admin/verification", label: t.admin.nav.verification, icon: LockIcon },
    { href: "/dashboard/admin/activity", label: t.admin.nav.activity, icon: CalendarIcon },
    ...(hasRole(user.systemRole, "admin")
      ? [
          { href: "/dashboard/admin/content", label: t.admin.nav.content, icon: TrophyIcon },
          { href: "/dashboard/admin/transfers", label: t.admin.nav.market, icon: WalletIcon },
          { href: "/dashboard/admin/announcements", label: t.admin.nav.announce, icon: BellIcon },
          { href: "/dashboard/admin/bin", label: t.admin.nav.bin, icon: TrashIcon },
          { href: "/dashboard/admin/health", label: t.admin.nav.health, icon: ChartIcon },
        ]
      : []),
    ...(hasRole(user.systemRole, "super_admin")
      ? [
          { href: "/dashboard/admin/settings", label: t.admin.nav.settings, icon: SettingsIcon },
          { href: "/dashboard/admin/audit", label: t.admin.nav.audit, icon: ClockIcon },
        ]
      : []),
  ];

  const items = mode === "admin" ? adminItems : playerItems;

  const isActive = (href: string) =>
    href === playerBase || href === "/dashboard/admin"
      ? pathname === href
      : pathname.startsWith(href);

  const content = (
    <nav className="flex flex-col gap-1 p-3">
      {items.map((item) => {
        const active = isActive(item.href);
        return (
          <a
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
            <span className="flex-1">{item.label}</span>
            {item.badge ? (
              <span className="rounded-full bg-danger px-1.5 py-0.5 font-mono text-[10px] font-bold leading-none text-white">{item.badge}</span>
            ) : null}
          </a>
        );
      })}
    </nav>
  );

  return (
    <>
      <aside className="fixed top-14 min-[400px]:top-16 left-0 bottom-0 z-20 hidden w-60 shrink-0 overflow-y-auto border-r border-surface-line/70 bg-bg/95 backdrop-blur-md lg:block">
        {isStaff ? (
          <div className="border-b border-surface-line/70 p-3">
            <RoleToggle value={mode} onChange={handleModeChange} className="w-full" />
          </div>
        ) : null}
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
              <Link href="/dashboard" onClick={onClose} className="font-display text-lg font-bold tracking-tight text-ink">
                ALL<span className="text-accent">Y</span>NQ
              </Link>
            </div>
            {isStaff ? (
              <div className="border-b border-surface-line/70 p-3">
                <RoleToggle value={mode} onChange={handleModeChange} className="w-full" />
              </div>
            ) : null}
            {content}
          </div>
        </div>
      ) : null}
    </>
  );
}
