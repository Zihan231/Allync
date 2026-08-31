"use client";

import { SectionHeading } from "./GameStrip";
import { Reveal } from "./Reveal";
import { useLanguage } from "@/lib/i18n/LanguageContext";
import {
  ShieldIcon,
  WalletIcon,
  SwapIcon,
  TrophyIcon,
  UsersIcon,
  BracketIcon,
} from "./icons";

const featureMeta = [
  { icon: ShieldIcon, titleKey: "f1Title", bodyKey: "f1Body" },
  { icon: WalletIcon, titleKey: "f2Title", bodyKey: "f2Body" },
  { icon: SwapIcon, titleKey: "f3Title", bodyKey: "f3Body" },
  { icon: TrophyIcon, titleKey: "f4Title", bodyKey: "f4Body" },
  { icon: UsersIcon, titleKey: "f5Title", bodyKey: "f5Body" },
  { icon: BracketIcon, titleKey: "f6Title", bodyKey: "f6Body" },
] as const;

export function Features() {
  const { t } = useLanguage();

  return (
    <section id="features" className="relative border-t border-surface-line/70 py-24">
      <div className="mx-auto max-w-7xl px-6 lg:px-10">
        <Reveal>
          <SectionHeading
            eyebrow={t.features.eyebrow}
            title={t.features.title}
            description={t.features.description}
          />
        </Reveal>

        <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {featureMeta.map((feature, i) => (
            <Reveal key={feature.titleKey} delay={(i % 3) * 90}>
              <div className="group relative h-full overflow-hidden rounded-xl border border-surface-line bg-surface/50 p-6 transition-all duration-300 hover:-translate-y-1 hover:border-blue/40 hover:shadow-[0_16px_40px_-16px_rgba(76,141,255,0.35)]">
                <div className="pointer-events-none absolute -right-10 -top-10 h-28 w-28 rounded-full bg-blue opacity-0 blur-3xl transition-opacity duration-300 group-hover:opacity-[0.12]" />
                <div className="relative flex h-11 w-11 items-center justify-center rounded-lg bg-blue-soft text-blue-ink transition-transform duration-300 group-hover:scale-110">
                  <feature.icon className="h-6 w-6" />
                </div>
                <h3 className="font-display relative mt-4 text-lg font-semibold text-ink">
                  {t.features[feature.titleKey]}
                </h3>
                <p className="relative mt-2 text-sm leading-relaxed text-ink-soft">
                  {t.features[feature.bodyKey]}
                </p>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
