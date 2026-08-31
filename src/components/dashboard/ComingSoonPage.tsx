"use client";

import Link from "next/link";
import { useLanguage } from "@/lib/i18n/LanguageContext";
import type { GameMeta } from "@/lib/games";

export function ComingSoonPage({ game }: { game: GameMeta }) {
  const { t } = useLanguage();

  return (
    <div className="mx-auto flex max-w-md flex-col items-center py-16 text-center">
      <div
        className="flex h-16 w-16 items-center justify-center rounded-2xl"
        style={{ backgroundColor: `${game.color}22`, color: game.color }}
      >
        <game.icon className="h-8 w-8" />
      </div>
      <h1 className="font-display mt-5 text-2xl font-bold text-ink">{game.name}</h1>
      <div className="font-mono mt-1 text-xs uppercase tracking-widest text-ink-faint">
        {t.dashboard.comingSoon.title}
      </div>
      <p className="mt-4 text-sm leading-relaxed text-ink-soft">{t.dashboard.comingSoon.body}</p>
      <Link
        href="/dashboard/efootball"
        className="mt-6 rounded-full bg-accent px-6 py-3 font-display font-semibold text-bg transition-transform hover:-translate-y-0.5"
      >
        {t.dashboard.comingSoon.cta}
      </Link>
    </div>
  );
}
