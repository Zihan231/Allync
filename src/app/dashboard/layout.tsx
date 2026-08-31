"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useSession } from "@/lib/session/SessionContext";
import { DashboardTopbar } from "@/components/dashboard/DashboardTopbar";
import { DashboardSidebar } from "@/components/dashboard/DashboardSidebar";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const pathname = usePathname();
  const router = useRouter();
  const { user } = useSession();
  const isHub = pathname === "/dashboard";

  useEffect(() => {
    if (user.verificationStatus !== "verified") {
      router.replace("/onboarding/verify");
    }
  }, [user.verificationStatus, router]);

  if (user.verificationStatus !== "verified") {
    return null;
  }

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
