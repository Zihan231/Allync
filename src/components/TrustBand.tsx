"use client";

import { Reveal } from "./Reveal";
import { useLanguage } from "@/lib/i18n/LanguageContext";
import { ShieldIcon, WalletIcon, LockIcon } from "./icons";

const pointMeta = [
  { icon: ShieldIcon, labelKey: "p1Label", bodyKey: "p1Body" },
  { icon: WalletIcon, labelKey: "p2Label", bodyKey: "p2Body" },
  { icon: LockIcon, labelKey: "p3Label", bodyKey: "p3Body" },
] as const;

export function TrustBand() {
  const { t } = useLanguage();

  return (
    <section
      id="organizers"
      className="relative overflow-hidden border-t border-surface-line/70 bg-bg-raised py-20"
    >
      <div className="bg-grid pointer-events-none absolute inset-0 opacity-40 [mask-image:radial-gradient(ellipse_70%_60%_at_0%_50%,#000_0%,transparent_75%)]" />

      <div className="relative mx-auto max-w-7xl px-6 lg:px-10">
        <div className="grid gap-10 lg:grid-cols-[0.8fr_1.2fr] lg:items-center">
          <Reveal>
            <div className="font-mono text-xs uppercase tracking-widest text-blue-ink">
              {t.trust.eyebrow}
            </div>
            <h2 className="font-display mt-3 text-balance text-3xl font-bold tracking-tight text-ink sm:text-4xl">
              {t.trust.title}
            </h2>
            <p className="mt-4 max-w-sm text-sm leading-relaxed text-ink-soft">
              {t.trust.body}
            </p>
          </Reveal>

          <div className="grid gap-5 sm:grid-cols-3">
            {pointMeta.map((point, i) => (
              <Reveal key={point.labelKey} delay={120 + i * 110}>
                <div className="group relative h-full rounded-xl border border-surface-line bg-surface/40 p-5 transition-all duration-300 hover:-translate-y-1 hover:border-accent/40">
                  <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-accent-soft text-accent-ink transition-transform duration-300 group-hover:scale-110">
                    <point.icon className="h-5 w-5" />
                  </div>
                  <div className="font-display mt-4 text-sm font-semibold text-ink">
                    {t.trust[point.labelKey]}
                  </div>
                  <p className="mt-1.5 text-sm leading-relaxed text-ink-soft">
                    {t.trust[point.bodyKey]}
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
