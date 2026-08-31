"use client";

import type { ReactNode } from "react";
import { Reveal } from "../Reveal";
import { useLanguage } from "@/lib/i18n/LanguageContext";
import { ShieldIcon, TrophyIcon, UsersIcon } from "../icons";

export function AuthShell({
  children,
  variant,
}: {
  children: ReactNode;
  variant: "login" | "signup";
}) {
  const { t } = useLanguage();

  const eyebrow = variant === "login" ? t.auth.loginEyebrow : t.auth.signupEyebrow;
  const title = variant === "login" ? t.auth.loginTitle : t.auth.signupTitle;
  const subtitle = variant === "login" ? t.auth.loginSubtitle : t.auth.signupSubtitle;

  const highlights = [
    { icon: UsersIcon, title: t.auth.highlight1Title, body: t.auth.highlight1Body },
    { icon: TrophyIcon, title: t.auth.highlight2Title, body: t.auth.highlight2Body },
    { icon: ShieldIcon, title: t.auth.highlight3Title, body: t.auth.highlight3Body },
  ];

  return (
    <div className="relative flex flex-1 flex-col lg:flex-row">
      <div className="bg-grid pointer-events-none absolute inset-0 opacity-60 [mask-image:radial-gradient(ellipse_70%_60%_at_20%_0%,#000_0%,transparent_70%)]" />
      <div className="glow-gold animate-pulse-slow pointer-events-none absolute -left-40 top-0 h-[520px] w-[520px] blur-3xl" />
      <div className="glow-blue pointer-events-none absolute -right-20 bottom-0 h-[420px] w-[420px] blur-3xl" />

      {/* Brand panel */}
      <div className="relative flex flex-col justify-between border-b border-surface-line/70 px-8 py-10 lg:w-[44%] lg:border-b-0 lg:border-r lg:px-14 lg:py-14">
        <Reveal className="mt-0">
          <div className="inline-flex items-center gap-2 rounded-full border border-surface-line-strong bg-surface/60 px-4 py-1.5 font-mono text-xs uppercase tracking-widest text-ink-soft">
            <span className="h-1.5 w-1.5 rounded-full bg-accent" />
            {eyebrow}
          </div>
          <h1 className="font-display mt-5 text-balance text-4xl font-bold leading-[1.05] tracking-tight text-ink lg:text-5xl">
            {title}
          </h1>
          <p className="mt-4 max-w-sm text-base leading-relaxed text-ink-soft">
            {subtitle}
          </p>
        </Reveal>

        <div className="mt-10 hidden space-y-6 lg:block">
          {highlights.map((h, i) => (
            <Reveal key={h.title} delay={150 + i * 100}>
              <div className="flex items-start gap-3">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-blue-soft text-blue-ink">
                  <h.icon className="h-5 w-5" />
                </div>
                <div>
                  <div className="text-sm font-semibold text-ink">{h.title}</div>
                  <p className="mt-0.5 text-sm leading-relaxed text-ink-soft">{h.body}</p>
                </div>
              </div>
            </Reveal>
          ))}
        </div>

        <p className="mt-10 font-mono text-[11px] uppercase tracking-wide text-ink-faint lg:mt-0">
          {t.auth.tagline}
        </p>
      </div>

      {/* Form panel */}
      <div className="relative flex flex-1 items-center justify-center px-6 py-14 lg:px-14">
        <Reveal delay={100} className="w-full max-w-sm">
          {children}
        </Reveal>
      </div>
    </div>
  );
}
