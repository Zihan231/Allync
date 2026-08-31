"use client";

import Link from "next/link";
import { useLanguage } from "@/lib/i18n/LanguageContext";
import { ArrowRightIcon, ShieldIcon } from "./icons";

export function Hero() {
  const { t } = useLanguage();

  return (
    <section id="top" className="relative overflow-hidden">
      <div className="bg-grid pointer-events-none absolute inset-0 [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_40%,transparent_100%)]" />
      <div className="glow-gold animate-pulse-slow pointer-events-none absolute -top-40 left-1/2 h-[560px] w-[560px] -translate-x-[70%] blur-3xl" />
      <div className="glow-blue pointer-events-none absolute -top-20 right-0 h-[420px] w-[420px] translate-x-[30%] blur-3xl" />

      <div className="relative mx-auto max-w-7xl px-6 pb-24 pt-20 lg:px-10 lg:pt-28">
        <div className="grid items-center gap-16 lg:grid-cols-[1.1fr_0.9fr]">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-surface-line-strong bg-surface/60 px-4 py-1.5 font-mono text-xs uppercase tracking-widest text-ink-soft">
              <span className="h-1.5 w-1.5 rounded-full bg-accent" />
              {t.hero.eyebrow}
            </div>

            <h1 className="font-display mt-6 text-balance text-5xl font-bold leading-[1.02] tracking-tight text-ink sm:text-6xl lg:text-[4.5rem]">
              {t.hero.titleLine1}
              <br />
              <span className="text-accent">{t.hero.titleLine2}</span>
            </h1>

            <p className="mt-6 max-w-lg text-lg leading-relaxed text-ink-soft">
              {t.hero.body}
            </p>

            <div className="mt-9 flex flex-wrap items-center gap-4">
              <Link
                href="/signup"
                className="group inline-flex items-center gap-2 rounded-full bg-accent px-6 py-3 font-display font-semibold text-bg shadow-[0_0_24px_rgba(217,165,68,0.3)] transition-transform hover:-translate-y-0.5"
              >
                {t.hero.ctaPrimary}
                <ArrowRightIcon className="h-4 w-4 transition-transform group-hover:translate-x-1" />
              </Link>
              <a
                href="#organizers"
                className="inline-flex items-center gap-2 rounded-full border border-surface-line-strong px-6 py-3 font-display font-semibold text-ink transition-colors hover:border-blue hover:text-blue-ink"
              >
                {t.hero.ctaSecondary}
              </a>
            </div>

            <div className="mt-12 flex flex-wrap gap-x-8 gap-y-3 font-mono text-xs uppercase tracking-wide text-ink-faint">
              <span>{t.hero.tickerEfootball}</span>
              <span>{t.hero.tickerPubg}</span>
              <span>{t.hero.tickerFreefire}</span>
              <span>{t.hero.tickerValorant}</span>
            </div>
          </div>

          <div className="relative hidden lg:block">
            <MatchCard />
          </div>
        </div>
      </div>
    </section>
  );
}

function MatchCard() {
  const { t } = useLanguage();

  return (
    <div className="animate-float relative mx-auto w-full max-w-sm rounded-2xl border border-surface-line-strong bg-surface/80 p-6 shadow-[0_30px_80px_-20px_rgba(0,0,0,0.6)] backdrop-blur">
      <div className="flex items-center justify-between font-mono text-[11px] uppercase tracking-wider text-ink-faint">
        <span className="flex items-center gap-1.5 text-live">
          <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-live" />
          {t.hero.cardLive}
        </span>
        <span>{t.hero.cardCommunity}</span>
      </div>

      <div className="mt-5 flex items-center justify-between">
        <div className="text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full border border-surface-line-strong bg-bg-raised font-display text-sm text-accent-ink">
            RF
          </div>
          <div className="mt-2 text-sm font-medium text-ink">Red Falcons</div>
        </div>
        <div className="font-display px-4 text-3xl font-bold text-ink">3–2</div>
        <div className="text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full border border-surface-line-strong bg-bg-raised font-display text-sm text-blue-ink">
            BT
          </div>
          <div className="mt-2 text-sm font-medium text-ink">Blue Tigers</div>
        </div>
      </div>

      <div className="mt-6 flex items-center gap-2 rounded-lg border border-surface-line bg-bg-raised px-3 py-2 font-mono text-[11px] text-ink-soft">
        <ShieldIcon className="h-4 w-4 text-accent" />
        {t.hero.cardVerified}
      </div>

      <div className="mt-3 flex items-center justify-between rounded-lg border border-surface-line bg-bg-raised px-3 py-2 font-mono text-[11px] text-ink-soft">
        <span>{t.hero.cardPrizePool}</span>
        <span className="text-ink">৳ 12,000</span>
      </div>
    </div>
  );
}
