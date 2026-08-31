"use client";

import Link from "next/link";
import { useLanguage } from "@/lib/i18n/LanguageContext";
import { ArrowRightIcon } from "./icons";
import { SiteFooter } from "./SiteFooter";

export function CTAFooter() {
  const { t } = useLanguage();

  return (
    <>
      <section id="get-started" className="relative overflow-hidden border-t border-surface-line/70 py-28">
        <div className="glow-gold animate-pulse-slow pointer-events-none absolute left-1/2 top-1/2 h-[500px] w-[700px] -translate-x-1/2 -translate-y-1/2 blur-3xl" />
        <div className="relative mx-auto max-w-3xl px-6 text-center lg:px-10">
          <h2 className="font-display text-balance text-4xl font-bold tracking-tight text-ink sm:text-5xl">
            {t.ctaFooter.title}
          </h2>
          <p className="mt-5 text-lg leading-relaxed text-ink-soft">
            {t.ctaFooter.body}
          </p>
          <div className="mt-9 flex flex-wrap items-center justify-center gap-4">
            <Link
              href="/signup"
              className="group inline-flex items-center gap-2 rounded-full bg-accent px-7 py-3.5 font-display font-semibold text-bg shadow-[0_0_24px_rgba(217,165,68,0.3)] transition-transform hover:-translate-y-0.5"
            >
              {t.ctaFooter.ctaPrimary}
              <ArrowRightIcon className="h-4 w-4 transition-transform group-hover:translate-x-1" />
            </Link>
            <Link
              href="/signup"
              className="inline-flex items-center gap-2 rounded-full border border-surface-line-strong px-7 py-3.5 font-display font-semibold text-ink transition-colors hover:border-blue hover:text-blue-ink"
            >
              {t.ctaFooter.ctaSecondary}
            </Link>
          </div>
        </div>
      </section>

      <SiteFooter />
    </>
  );
}
