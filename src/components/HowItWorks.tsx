"use client";

import { SectionHeading } from "./GameStrip";
import { Reveal } from "./Reveal";
import { useLanguage } from "@/lib/i18n/LanguageContext";
import { UsersIcon, TrophyIcon, BracketIcon, ShieldIcon } from "./icons";

const stepMeta = [
  { n: "01", icon: UsersIcon, titleKey: "step1Title", bodyKey: "step1Body" },
  { n: "02", icon: TrophyIcon, titleKey: "step2Title", bodyKey: "step2Body" },
  { n: "03", icon: BracketIcon, titleKey: "step3Title", bodyKey: "step3Body" },
  { n: "04", icon: ShieldIcon, titleKey: "step4Title", bodyKey: "step4Body" },
] as const;

export function HowItWorks() {
  const { t } = useLanguage();

  return (
    <section id="how-it-works" className="relative overflow-hidden border-t border-surface-line/70 py-24">
      <div className="glow-blue pointer-events-none absolute left-1/2 top-0 h-[420px] w-[720px] -translate-x-1/2 -translate-y-1/2 opacity-60 blur-3xl" />

      <div className="relative mx-auto max-w-7xl px-6 lg:px-10">
        <Reveal>
          <SectionHeading eyebrow={t.howItWorks.eyebrow} title={t.howItWorks.title} />
        </Reveal>

        <div className="relative mt-16">
          <div className="pointer-events-none absolute left-0 right-0 top-8 hidden h-px bg-gradient-to-r from-transparent via-surface-line-strong to-transparent lg:block" />

          <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-4 lg:gap-6">
            {stepMeta.map((step, i) => (
              <Reveal key={step.n} delay={i * 110}>
                <div className="group relative">
                  <div className="relative z-10 flex h-16 w-16 items-center justify-center rounded-2xl border border-surface-line-strong bg-surface text-accent-ink shadow-[0_8px_24px_-8px_rgba(0,0,0,0.5)] transition-transform duration-300 group-hover:-translate-y-1 group-hover:border-accent/60">
                    <step.icon className="h-7 w-7" />
                    <span className="font-mono absolute -right-2 -top-2 flex h-6 w-6 items-center justify-center rounded-full border border-surface-line-strong bg-bg-raised text-[10px] text-ink-faint">
                      {step.n}
                    </span>
                  </div>

                  <h3 className="font-display mt-5 text-xl font-semibold text-ink">
                    {t.howItWorks[step.titleKey]}
                  </h3>
                  <p className="mt-2.5 text-sm leading-relaxed text-ink-soft">
                    {t.howItWorks[step.bodyKey]}
                  </p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
