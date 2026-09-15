"use client";

import { useEffect, useState } from "react";
import { usePathname, useSearchParams } from "next/navigation";

export function NavigationProgress() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);

  // Complete progress on route change
  useEffect(() => {
    setProgress(100);
    const timer = setTimeout(() => {
      setLoading(false);
      setProgress(0);
    }, 250);
    return () => clearTimeout(timer);
  }, [pathname, searchParams]);

  // Intercept click on links to start progress
  useEffect(() => {
    const handleAnchorClick = (e: MouseEvent) => {
      const target = (e.target as HTMLElement).closest("a");
      if (!target) return;
      const href = target.getAttribute("href");
      if (!href || href.startsWith("#") || href.startsWith("mailto:") || href.startsWith("tel:") || target.target === "_blank") {
        return;
      }
      try {
        const targetUrl = new URL(target.href, window.location.origin);
        if (targetUrl.origin === window.location.origin && targetUrl.pathname !== window.location.pathname) {
          setLoading(true);
          setProgress(25);
          setTimeout(() => setProgress((p) => (p === 25 ? 65 : p)), 100);
          setTimeout(() => setProgress((p) => (p === 65 ? 85 : p)), 300);
        }
      } catch {}
    };

    document.addEventListener("click", handleAnchorClick, true);
    return () => document.removeEventListener("click", handleAnchorClick, true);
  }, []);

  if (!loading && progress === 0) return null;

  return (
    <div className="pointer-events-none fixed left-0 top-0 z-[99999] h-1 w-full overflow-hidden bg-transparent">
      <div
        className="h-full bg-gradient-to-r from-accent via-amber-400 to-accent transition-all duration-300 ease-out shadow-[0_0_12px_rgba(217,165,68,0.9)]"
        style={{
          width: `${progress}%`,
          opacity: progress === 100 ? 0 : 1,
        }}
      />
    </div>
  );
}
