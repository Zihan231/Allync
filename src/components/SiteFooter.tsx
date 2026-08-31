"use client";

import { useLanguage } from "@/lib/i18n/LanguageContext";

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

export function SiteFooter() {
  const { t } = useLanguage();

  return (
    <footer className="border-t border-surface-line/70">
      <div className="mx-auto max-w-7xl px-6 py-16 lg:px-10">
        <div className="grid gap-12 sm:grid-cols-2 lg:grid-cols-[1.4fr_1fr_1fr_1fr]">
          <div>
            <span className="font-display text-lg font-bold text-ink">
              ALL<span className="text-accent">Y</span>NQ
            </span>
            <p className="mt-4 max-w-xs text-sm leading-relaxed text-ink-soft">
              {t.ctaFooter.brandBlurb}
            </p>
          </div>

          <FooterColumn
            heading={t.ctaFooter.colPlatform}
            links={[
              { label: t.ctaFooter.linkGames, href: "/#games" },
              { label: t.ctaFooter.linkHowItWorks, href: "/#how-it-works" },
              { label: t.ctaFooter.linkFeatures, href: "/#features" },
            ]}
          />
          <FooterColumn
            heading={t.ctaFooter.colCommunity}
            links={[
              { label: t.ctaFooter.linkOrganizers, href: "/#organizers" },
              { label: t.ctaFooter.linkBecomeOrganizer, href: "/signup" },
              { label: t.ctaFooter.linkCreateAccount, href: "/signup" },
            ]}
          />
          <FooterColumn
            heading={t.ctaFooter.colGames}
            links={[
              { label: t.ctaFooter.linkEfootball, href: "/#games" },
              { label: t.ctaFooter.linkPubg, href: "/#games" },
              { label: t.ctaFooter.linkFreefire, href: "/#games" },
              { label: t.ctaFooter.linkValorant, href: "/#games" },
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
  );
}
