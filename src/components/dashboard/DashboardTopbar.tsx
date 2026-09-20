"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useLanguage } from "@/lib/i18n/LanguageContext";
import { useSession } from "@/lib/session/SessionContext";
import { games, getGame } from "@/lib/games";
import { DEMO_PERSONAS } from "@/lib/mock/personas";
import { LanguageSwitch } from "../LanguageSwitch";
import { ToastContainer } from "../common/Toast";
import { Avatar } from "../common/Avatar";
import { BellIcon, ChevronDownIcon, LogoutIcon, SettingsIcon, UsersIcon } from "../icons";
import { useRealtimeNotifications } from "@/lib/hooks/useRealtimeNotifications";

export function DashboardTopbar({
  onMenuClick,
  showMenuButton = true,
}: {
  onMenuClick: () => void;
  showMenuButton?: boolean;
}) {
  const { t } = useLanguage();
  const { user, logout } = useSession();
  const router = useRouter();

  const [gameMenuOpen, setGameMenuOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);

  const gameMenuRef = useRef<HTMLDivElement>(null);
  const notifRef = useRef<HTMLDivElement>(null);
  const userMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handlePointerDown = (e: PointerEvent) => {
      const target = e.target as Node;
      if (gameMenuRef.current && !gameMenuRef.current.contains(target)) setGameMenuOpen(false);
      if (notifRef.current && !notifRef.current.contains(target)) setNotifOpen(false);
      if (userMenuRef.current && !userMenuRef.current.contains(target)) setUserMenuOpen(false);
    };
    document.addEventListener("pointerdown", handlePointerDown);
    return () => document.removeEventListener("pointerdown", handlePointerDown);
  }, []);

  const activeGame = getGame(user.activeGame);

  const { notifications, unreadCount, markAsRead, markAllRead, toasts, dismiss } = useRealtimeNotifications();

  return (
    <header className="sticky top-0 z-30 flex h-14 min-[400px]:h-16 items-center justify-between gap-1.5 min-[400px]:gap-3 border-b border-surface-line/70 bg-bg/90 px-2.5 min-[400px]:px-4 backdrop-blur lg:px-6 max-w-[100vw] overflow-x-clip">
      <div className="flex items-center gap-1.5 min-[400px]:gap-3 shrink-0">
        {showMenuButton ? (
          <button
            type="button"
            onClick={onMenuClick}
            aria-label="Toggle menu"
            className="flex h-8 w-8 min-[400px]:h-9 min-[400px]:w-9 items-center justify-center rounded-full border border-surface-line-strong text-ink shrink-0 lg:hidden"
          >
            <span className="relative block h-3 w-3.5 min-[400px]:h-3.5 min-[400px]:w-4">
              <span className="absolute left-0 top-0 block h-[1.5px] w-full bg-current" />
              <span className="absolute left-0 top-1/2 block h-[1.5px] w-full -translate-y-1/2 bg-current" />
              <span className="absolute bottom-0 left-0 block h-[1.5px] w-full bg-current" />
            </span>
          </button>
        ) : null}

        <Link href="/dashboard" className="font-display text-base min-[400px]:text-lg font-bold tracking-tight text-ink shrink-0">
          ALL<span className="text-accent">Y</span>NQ
        </Link>
      </div>

      <div className="flex items-center gap-1 min-[380px]:gap-2 shrink-0">
        {user.mode === "player" ? (
          <div className="relative shrink-0" ref={gameMenuRef}>
            <button
              type="button"
              onClick={() => setGameMenuOpen((o) => !o)}
              className="flex h-8 min-[400px]:h-auto items-center gap-1 min-[400px]:gap-2 rounded-full border border-surface-line-strong px-2 min-[400px]:px-3 py-1 min-[400px]:py-1.5 text-xs min-[400px]:text-sm text-ink shrink-0"
            >
              <activeGame.icon className="h-3.5 w-3.5 min-[400px]:h-4 min-[400px]:w-4 shrink-0" style={{ color: activeGame.color }} />
              <span className="hidden sm:inline">{activeGame.name}</span>
              <ChevronDownIcon className="h-3 w-3 min-[400px]:h-3.5 min-[400px]:w-3.5 text-ink-faint hidden min-[360px]:inline" />
            </button>
            {gameMenuOpen ? (
              <div className="absolute right-0 top-full z-40 mt-2 w-48 rounded-xl border border-surface-line bg-surface p-1.5 shadow-2xl">
                {games.map((g) => (
                  <Link
                    key={g.id}
                    href={`/dashboard/${g.id}`}
                    onClick={() => setGameMenuOpen(false)}
                    className="flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-sm text-ink-soft hover:bg-bg-raised hover:text-ink"
                  >
                    <g.icon className="h-4 w-4" style={{ color: g.color }} />
                    {g.name}
                    {!g.live ? (
                      <span className="ml-auto font-mono text-[9px] uppercase text-ink-faint">soon</span>
                    ) : null}
                  </Link>
                ))}
              </div>
            ) : null}
          </div>
        ) : null}

        <LanguageSwitch />

        <div className="relative shrink-0" ref={notifRef}>
          <button
            type="button"
            onClick={() => setNotifOpen((o) => !o)}
            aria-label={t.dashboard.shell.notificationsLabel}
            className="relative flex h-8 w-8 min-[400px]:h-9 min-[400px]:w-9 items-center justify-center rounded-full border border-surface-line-strong text-ink-soft hover:text-ink shrink-0"
          >
            <BellIcon className="h-4 w-4 min-[400px]:h-4.5 min-[400px]:w-4.5" />
            {unreadCount > 0 ? (
              <span className="absolute -top-1 -right-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-danger px-1 text-[9px] font-bold text-white shadow-sm ring-2 ring-bg animate-pulse">
                {unreadCount > 9 ? "9+" : unreadCount}
              </span>
            ) : null}
          </button>
          {notifOpen ? (
            <div className="absolute right-0 top-full z-40 mt-2 w-80 max-w-[calc(100vw-2rem)] rounded-xl border border-surface-line bg-surface p-3 shadow-2xl">
              <div className="flex items-center justify-between border-b border-surface-line/70 pb-2">
                <span className="font-mono text-[10px] uppercase tracking-wide text-ink-faint">
                  {t.dashboard.shell.notificationsLabel} ({unreadCount})
                </span>
                {unreadCount > 0 ? (
                  <button
                    type="button"
                    onClick={() => markAllRead()}
                    className="font-mono text-[10px] text-accent hover:underline"
                  >
                    Mark all as read
                  </button>
                ) : null}
              </div>
              <ul className="mt-2 max-h-72 overflow-y-auto space-y-2 pr-1 divide-y divide-surface-line/40">
                {notifications.length === 0 ? (
                  <li className="py-4 text-center text-xs text-ink-faint">
                    {t.dashboard.shell.notificationsEmpty || "You're all caught up."}
                  </li>
                ) : (
                  notifications.map((n) => (
                    <li
                      key={n.id}
                      onClick={() => {
                        if (!n.read) markAsRead(n.id);
                        if (n.link) {
                          setNotifOpen(false);
                          router.push(n.link);
                        }
                      }}
                      className={`pt-2 pb-1 text-xs cursor-pointer transition-colors rounded-lg px-2 hover:bg-bg-raised ${
                        !n.read ? "bg-accent/5 font-medium" : "opacity-80"
                      }`}
                    >
                      <div className="flex items-center justify-between gap-1">
                        <span className={`font-semibold ${!n.read ? "text-accent" : "text-ink"}`}>
                          {n.title}
                        </span>
                        {!n.read ? (
                          <span className="h-1.5 w-1.5 rounded-full bg-accent shrink-0" />
                        ) : null}
                      </div>
                      <p className="mt-0.5 leading-relaxed text-ink-soft line-clamp-2">{n.message}</p>
                    </li>
                  ))
                )}
              </ul>
            </div>
          ) : null}
        </div>

        <div className="relative shrink-0" ref={userMenuRef}>
          <button type="button" onClick={() => setUserMenuOpen((o) => !o)} className="block shrink-0">
            <Avatar dpUrl={user.dpUrl} name={user.name} size="sm" mode="static" />
          </button>
          {userMenuOpen ? (
            <div className="absolute right-0 top-full z-40 mt-2 w-52 rounded-xl border border-surface-line bg-surface p-1.5 shadow-2xl">
              <div className="px-2.5 py-2 text-sm font-medium text-ink">{user.name}</div>
              <Link
                href={`/dashboard/${user.activeGame}/profile`}
                onClick={() => setUserMenuOpen(false)}
                className="flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-sm text-ink-soft hover:bg-bg-raised hover:text-ink"
              >
                <UsersIcon className="h-4 w-4" />
                {t.dashboard.shell.userMenuProfile}
              </Link>
              <Link
                href="/dashboard/organizer/settings"
                onClick={() => setUserMenuOpen(false)}
                className="flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-sm text-ink-soft hover:bg-bg-raised hover:text-ink"
              >
                <SettingsIcon className="h-4 w-4" />
                {t.dashboard.shell.userMenuSettings}
              </Link>
              <button
                type="button"
                onClick={() => {
                  setUserMenuOpen(false);
                  logout();
                  router.push("/");
                }}
                className="flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-left text-sm text-danger-ink hover:bg-bg-raised"
              >
                <LogoutIcon className="h-4 w-4" />
                {t.dashboard.shell.userMenuLogout}
              </button>

              
            </div>
          ) : null}
        </div>
      </div>
      <ToastContainer toasts={toasts} onDismiss={dismiss} />
    </header>
  );
}
