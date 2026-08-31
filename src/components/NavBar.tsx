"use client";

import Link from "next/link";
import { useState } from "react";
import { useLanguage } from "@/lib/i18n/LanguageContext";
import { LanguageSwitch } from "./LanguageSwitch";

export function NavBar() {
  const { t } = useLanguage();
  const [menuOpen, setMenuOpen] = useState(false);

  const links = [
    { label: t.nav.games, href: "#games" },
    { label: t.nav.howItWorks, href: "#how-it-works" },
    { label: t.nav.features, href: "#features" },
    { label: t.nav.organizers, href: "#organizers" },
  ];

  return (
    <header className="sticky top-0 z-50 border-b border-surface-line/70 bg-bg/85 backdrop-blur">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-3 px-4 py-4 sm:px-6 lg:px-10">
        <Link href="/" className="flex shrink-0 items-center gap-2">
          <span className="font-display text-xl font-bold tracking-tight text-ink">
            ALL<span className="text-accent">Y</span>NQ
          </span>
        </Link>

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

        <div className="flex items-center gap-2 sm:gap-3">
          <LanguageSwitch />
          <Link
            href="/login"
            className="rounded-full border border-surface-line-strong px-3 py-1.5 font-mono text-xs uppercase tracking-wide text-ink transition-colors hover:border-accent hover:text-accent-ink sm:px-4 sm:py-2 sm:text-[13px]"
          >
            {t.nav.login}
          </Link>
          <Link
            href="/signup"
            className="hidden rounded-full bg-accent px-4 py-2 font-display text-sm font-semibold text-bg shadow-[0_0_0_1px_rgba(217,165,68,0.4)] transition-transform hover:-translate-y-0.5 hover:shadow-[0_0_20px_rgba(217,165,68,0.45)] sm:block"
          >
            {t.nav.getStarted}
          </Link>

          <button
            type="button"
            onClick={() => setMenuOpen((open) => !open)}
            aria-expanded={menuOpen}
            aria-label="Toggle menu"
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-surface-line-strong text-ink transition-colors hover:border-accent md:hidden"
          >
            <span className="relative block h-3.5 w-4">
              <span
                className={`absolute left-0 top-0 block h-[1.5px] w-4 bg-current transition-transform ${
                  menuOpen ? "translate-y-[6px] rotate-45" : ""
                }`}
              />
              <span
                className={`absolute left-0 top-1/2 block h-[1.5px] w-4 -translate-y-1/2 bg-current transition-opacity ${
                  menuOpen ? "opacity-0" : "opacity-100"
                }`}
              />
              <span
                className={`absolute bottom-0 left-0 block h-[1.5px] w-4 bg-current transition-transform ${
                  menuOpen ? "-translate-y-[6px] -rotate-45" : ""
                }`}
              />
            </span>
          </button>
        </div>
      </div>

      {menuOpen ? (
        <nav className="border-t border-surface-line/70 px-4 py-4 sm:px-6 md:hidden">
          <div className="flex flex-col gap-1">
            {links.map((link) => (
              <a
                key={link.href}
                href={link.href}
                onClick={() => setMenuOpen(false)}
                className="rounded-lg px-2 py-2.5 font-mono text-sm uppercase tracking-wide text-ink-soft transition-colors hover:bg-surface hover:text-ink"
              >
                {link.label}
              </a>
            ))}
          </div>
          <Link
            href="/signup"
            onClick={() => setMenuOpen(false)}
            className="mt-4 block rounded-full bg-accent px-4 py-2.5 text-center font-display text-sm font-semibold text-bg sm:hidden"
          >
            {t.nav.getStarted}
          </Link>
        </nav>
      ) : null}
    </header>
  );
}
