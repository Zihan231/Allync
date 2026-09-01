"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import { DashboardTopbar } from "@/components/dashboard/DashboardTopbar";
import { DashboardSidebar } from "@/components/dashboard/DashboardSidebar";
import { NAV_DEPTH_KEY } from "@/components/dashboard/BackButton";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const pathname = usePathname();
  const isHub = pathname === "/dashboard";

  // Marks that at least one in-app route change has happened this tab
  // session, so BackButton knows a real "previous page" exists to pop back
  // to (vs. this page having been opened directly via a shared link).
  // Compares against the last-seen pathname (rather than a mount counter)
  // because React Strict Mode double-invokes this effect in dev with an
  // unchanged pathname, which would otherwise register as a false navigation.
  const prevPathname = useRef<string | null>(null);
  useEffect(() => {
    if (prevPathname.current !== null && prevPathname.current !== pathname) {
      window.sessionStorage.setItem(NAV_DEPTH_KEY, "1");
    }
    prevPathname.current = pathname;
  }, [pathname]);

  return (
    <div className="min-h-screen bg-bg">
      <DashboardTopbar onMenuClick={() => setMenuOpen(true)} showMenuButton={!isHub} />
      <div className="flex">
        {!isHub ? <DashboardSidebar open={menuOpen} onClose={() => setMenuOpen(false)} /> : null}
        <main className="min-w-0 flex-1 px-4 py-8 lg:px-8">{children}</main>
      </div>
    </div>
  );
}
