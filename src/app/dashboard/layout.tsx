"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { DashboardTopbar } from "@/components/dashboard/DashboardTopbar";
import { DashboardSidebar } from "@/components/dashboard/DashboardSidebar";
import { NAV_DEPTH_KEY } from "@/components/dashboard/BackButton";
import { useSession } from "@/lib/session/SessionContext";
import { AppLoader } from "@/components/common/AppLoader";
import { MaintenanceBanner } from "@/components/common/MaintenanceBanner";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const pathname = usePathname();
  const router = useRouter();
  const { user, isAuthenticated, isLoading } = useSession();
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

  // Staff sign in to operate the platform, so the dashboard root is their
  // control centre. They can still switch to a specific player game view.
  useEffect(() => {
    if (!isLoading && isAuthenticated && user.systemRole && pathname === "/dashboard") {
      router.replace("/dashboard/admin");
    }
  }, [isLoading, isAuthenticated, pathname, router, user.systemRole]);

  if (isLoading) {
    return <AppLoader />;
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
        <main className="min-w-0 flex-1 px-4 py-8 lg:px-8">
          <MaintenanceBanner />
          {children}
        </main>
      </div>
    </div>
  );
}
