"use client";

import { usePathname } from "next/navigation";

function getContextualMessage(pathname: string | null): string {
  if (!pathname) return "Loading ALLYNQ...";
  if (pathname.includes("/efootball/clubs/") && pathname.split("/").filter(Boolean).length >= 4) {
    return "Loading club details...";
  }
  if (pathname.includes("/efootball/clubs")) {
    return "Loading clubs...";
  }
  if (pathname.includes("/efootball/community/") && pathname.split("/").filter(Boolean).length >= 4) {
    return "Loading community details...";
  }
  if (pathname.includes("/efootball/community")) {
    return "Loading communities...";
  }
  if (pathname.includes("/efootball/players")) {
    return "Loading player profile...";
  }
  if (pathname.includes("/efootball/tournaments")) {
    return "Loading tournaments...";
  }
  if (pathname.includes("/efootball/matches")) {
    return "Loading matches...";
  }
  if (pathname.includes("/efootball/rankings")) {
    return "Loading rankings...";
  }
  if (pathname.includes("/efootball/wallet")) {
    return "Loading wallet...";
  }
  if (pathname.includes("/efootball/store")) {
    return "Loading store...";
  }
  if (pathname.includes("/efootball/profile")) {
    return "Loading profile...";
  }
  if (pathname.includes("/organizer/settings")) {
    return "Loading settings...";
  }
  if (pathname.includes("/organizer/verification")) {
    return "Loading verification...";
  }
  if (pathname.includes("/organizer/payouts")) {
    return "Loading payouts...";
  }
  if (pathname.includes("/organizer/disputes")) {
    return "Loading disputes...";
  }
  if (pathname.includes("/organizer/tournaments")) {
    return "Loading tournaments...";
  }
  if (pathname.includes("/organizer/community")) {
    return "Loading community...";
  }
  if (pathname.includes("/organizer")) {
    return "Loading organizer dashboard...";
  }
  if (pathname === "/dashboard") {
    return "Loading dashboard...";
  }
  if (pathname === "/login") {
    return "Loading login...";
  }
  if (pathname === "/signup") {
    return "Loading signup...";
  }
  return "Loading ALLYNQ...";
}

export function AppLoader({
  message,
  inline = false,
}: {
  message?: string;
  inline?: boolean;
}) {
  const pathname = usePathname();
  const displayMessage = message || getContextualMessage(pathname);

  const content = (
    <div className="flex flex-col items-center justify-center gap-4 text-center select-none">
      <div className="relative flex h-16 w-16 items-center justify-center">
        {/* Outer glowing gold ring */}
        <div className="absolute inset-0 animate-spin rounded-full border-2 border-surface-line border-t-accent shadow-[0_0_20px_rgba(217,165,68,0.35)]" />
        {/* Inner reverse spinner */}
        <div
          className="absolute inset-2 animate-spin rounded-full border border-surface-line border-b-blue opacity-75"
          style={{ animationDirection: "reverse", animationDuration: "1.2s" }}
        />
        {/* Center Logo Icon */}
        <span className="font-display text-sm font-black tracking-wider text-accent animate-pulse">
          Y
        </span>
      </div>

      <div className="space-y-1">
        <p className="font-mono text-xs font-semibold uppercase tracking-widest text-ink-soft animate-pulse">
          {displayMessage}
        </p>
        <div className="flex items-center justify-center gap-1">
          <span className="h-1 w-1 rounded-full bg-accent animate-bounce" style={{ animationDelay: "0ms" }} />
          <span className="h-1 w-1 rounded-full bg-accent animate-bounce" style={{ animationDelay: "150ms" }} />
          <span className="h-1 w-1 rounded-full bg-accent animate-bounce" style={{ animationDelay: "300ms" }} />
        </div>
      </div>
    </div>
  );

  if (inline) {
    return (
      <div className="flex min-h-[350px] w-full items-center justify-center py-12">
        {content}
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-bg/95 backdrop-blur-md">
      {content}
    </div>
  );
}
