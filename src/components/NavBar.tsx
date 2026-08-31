"use client";

import Link from "next/link";
import { useLanguage } from "@/lib/i18n/LanguageContext";
import { LanguageSwitch } from "./LanguageSwitch";

export function NavBar() {
  const { t } = useLanguage();

  const links = [
    { label: t.nav.games, href: "#games" },
    { label: t.nav.howItWorks, href: "#how-it-works" },
    { label: t.nav.features, href: "#features" },
    { label: t.nav.organizers, href: "#organizers" },
  ];

  return (
    <header className="sticky top-0 z-50 border-b border-surface-line/70 bg-bg/85 backdrop-blur">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4 lg:px-10">
        <a href="#top" className="flex items-center gap-2">
          <span className="font-display text-xl font-bold tracking-tight text-ink">
            ALL<span className="text-accent">Y</span>NC
          </span>
        </a>

        <nav className="hidden items-center gap-8 md:flex">
          {links.map((link) => (
            <a
              key={link.href}
              href={link.href}
              className="font-mono text-[13px] uppercase tracking-wide text-ink-soft transition-colors hover:text-ink"
            >
              {link.label}
            </a>
          ))}
        </nav>

        <div className="flex items-center gap-3">
          <LanguageSwitch />
          <Link
            href="/login"
            className="hidden rounded-full border border-surface-line-strong px-4 py-2 font-mono text-[13px] uppercase tracking-wide text-ink transition-colors hover:border-accent hover:text-accent-ink sm:block"
          >
            {t.nav.login}
          </Link>
          <Link
            href="/signup"
            className="rounded-full bg-accent px-4 py-2 font-display text-sm font-semibold text-bg shadow-[0_0_0_1px_rgba(217,165,68,0.4)] transition-transform hover:-translate-y-0.5 hover:shadow-[0_0_20px_rgba(217,165,68,0.45)]"
          >
            {t.nav.getStarted}
          </Link>
        </div>
      </div>
    </header>
  );
}
