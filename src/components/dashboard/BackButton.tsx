"use client";

import { useRouter } from "next/navigation";
import { useLanguage } from "@/lib/i18n/LanguageContext";
import { ArrowLeftIcon } from "@/components/icons";

// Next's app router history.state carries no usable "depth" field of its
// own, so DashboardLayout sets this sessionStorage flag the first time the
// pathname changes after mount. Its presence means at least one in-app
// navigation happened this tab session, so there's a real previous page to
// pop back to; its absence means this page was opened directly (shared
// link, new tab), so `href` is used as the fallback destination instead.
export const NAV_DEPTH_KEY = "allync-nav-depth";

export function BackButton({ href, label, className = "" }: { href?: string; label?: string; className?: string }) {
  const router = useRouter();
  const { t } = useLanguage();
  const text = label ?? t.dashboard.shared.back;

  const buttonClass = `group mb-4 inline-flex items-center gap-2 rounded-full border border-surface-line-strong bg-surface px-4 py-2 text-sm font-semibold text-ink shadow-[0_2px_8px_rgba(0,0,0,0.25)] transition-colors hover:border-accent hover:text-accent-ink ${className}`;

  function handleClick() {
    const canGoBack = typeof window !== "undefined" && window.sessionStorage.getItem(NAV_DEPTH_KEY) === "1";
    if (canGoBack) {
      router.back();
    } else if (href) {
      router.push(href);
    } else {
      router.back();
    }
  }

  return (
    <button type="button" onClick={handleClick} className={buttonClass}>
      <ArrowLeftIcon className="h-4 w-4 transition-transform group-hover:-translate-x-0.5" />
      {text}
    </button>
  );
}
