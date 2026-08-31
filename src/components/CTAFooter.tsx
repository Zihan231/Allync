"use client";

import Link from "next/link";
import { useLanguage } from "@/lib/i18n/LanguageContext";
import { ArrowRightIcon } from "./icons";

function FooterColumn({
  heading,
  links,
}: {
  heading: string;
  links: { label: string; href: string }[];
}) {
  return (
    <div>
      <div className="font-mono text-xs uppercase tracking-widest text-ink-faint">
        {heading}
      </div>
      <ul className="mt-4 space-y-3">
        {links.map((link) => (
          <li key={link.label}>
            <a
              href={link.href}
              className="text-sm text-ink-soft transition-colors hover:text-ink"
            >
              {link.label}
            </a>
          </li>
        ))}
      </ul>
    </div>
  );
}

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

      <footer className="border-t border-surface-line/70">
        <div className="mx-auto max-w-7xl px-6 py-16 lg:px-10">
          <div className="grid gap-12 sm:grid-cols-2 lg:grid-cols-[1.4fr_1fr_1fr_1fr]">
            <div>
              <span className="font-display text-lg font-bold text-ink">
                ALL<span className="text-accent">Y</span>NC
              </span>
              <p className="mt-4 max-w-xs text-sm leading-relaxed text-ink-soft">
                {t.ctaFooter.brandBlurb}
              </p>
            </div>

            <FooterColumn
              heading={t.ctaFooter.colPlatform}
              links={[
                { label: t.ctaFooter.linkGames, href: "#games" },
                { label: t.ctaFooter.linkHowItWorks, href: "#how-it-works" },
                { label: t.ctaFooter.linkFeatures, href: "#features" },
              ]}
            />
            <FooterColumn
              heading={t.ctaFooter.colCommunity}
              links={[
                { label: t.ctaFooter.linkOrganizers, href: "#organizers" },
                { label: t.ctaFooter.linkBecomeOrganizer, href: "/signup" },
                { label: t.ctaFooter.linkCreateAccount, href: "/signup" },
              ]}
            />
            <FooterColumn
              heading={t.ctaFooter.colGames}
              links={[
                { label: t.ctaFooter.linkEfootball, href: "#games" },
                { label: t.ctaFooter.linkPubg, href: "#games" },
                { label: t.ctaFooter.linkFreefire, href: "#games" },
                { label: t.ctaFooter.linkValorant, href: "#games" },
              ]}
            />
          </div>

          <div className="mt-14 flex flex-col gap-4 border-t border-surface-line/70 pt-8 sm:flex-row sm:items-center sm:justify-between">
            <p className="font-mono text-xs text-ink-faint">{t.ctaFooter.copyright}</p>
            <p className="font-mono text-xs uppercase tracking-wide text-ink-faint">
              {t.ctaFooter.tagline}
            </p>
          </div>
        </div>
      </footer>
    </>
  );
}
