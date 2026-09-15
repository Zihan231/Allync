"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { DashboardTopbar } from "@/components/dashboard/DashboardTopbar";
import { DashboardSidebar } from "@/components/dashboard/DashboardSidebar";
import { NAV_DEPTH_KEY } from "@/components/dashboard/BackButton";
import { useSession } from "@/lib/session/SessionContext";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const pathname = usePathname();
  const router = useRouter();
  const { isAuthenticated, isLoading } = useSession();
  const isHub = pathname === "/dashboard";

  const prevPathname = useRef<string | null>(null);
  useEffect(() => {
    if (prevPathname.current !== null && prevPathname.current !== pathname) {
      window.sessionStorage.setItem(NAV_DEPTH_KEY, "1");
    }
    prevPathname.current = pathname;
  }, [pathname]);

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.replace("/login");
    }
  }, [isLoading, isAuthenticated, router]);

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-bg">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-accent border-t-transparent" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  return (
    <div className="min-h-screen bg-bg">
      <DashboardTopbar onMenuClick={() => setMenuOpen(true)} showMenuButton={!isHub} />
      <div className="flex">
        {!isHub ? (
          <>
            <DashboardSidebar open={menuOpen} onClose={() => setMenuOpen(false)} />
            <div className="hidden lg:block w-60 shrink-0" aria-hidden="true" />
          </>
        ) : null}
        <main className="min-w-0 flex-1 px-4 py-8 lg:px-8">{children}</main>
      </div>
    </div>
  );
}
