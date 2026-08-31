"use client";

import Image from "next/image";
import { useLanguage } from "@/lib/i18n/LanguageContext";

const games = [
  {
    name: "eFootball",
    live: true,
    image: "/efootball.png",
    color: "#3fbf7f",
    blurbKey: "efootballBlurb" as const,
  },
  {
    name: "PUBG",
    live: false,
    image: "/PUBG.webp",
    color: "#e08a3c",
    blurbKey: "pubgBlurb" as const,
  },
  {
    name: "Free Fire",
    live: false,
    image: "/FreeFire.jpg",
    color: "#ff6b4a",
    blurbKey: "freefireBlurb" as const,
  },
  {
    name: "Valorant",
    live: false,
    image: "/Valorant.jpg",
    color: "#ff4d5e",
    blurbKey: "valorantBlurb" as const,
  },
];

export function GameStrip() {
  const { t } = useLanguage();

  return (
    <section id="games" className="relative border-t border-surface-line/70 py-24">
      <div className="mx-auto max-w-7xl px-6 lg:px-10">
        <SectionHeading
          eyebrow={t.games.eyebrow}
          title={t.games.title}
          description={t.games.description}
        />

        <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {games.map((game) => (
            <div
              key={game.name}
              className="group relative flex h-80 flex-col justify-between overflow-hidden rounded-xl border border-surface-line transition-colors hover:border-surface-line-strong"
            >
              <Image
                src={game.image}
                alt={game.name}
                fill
                sizes="(min-width: 1024px) 25vw, (min-width: 640px) 50vw, 100vw"
                className="pointer-events-none object-cover opacity-80 transition-transform duration-500 group-hover:scale-110"
              />
              <div
                className="pointer-events-none absolute inset-0"
                style={{
                  background: `radial-gradient(130% 90% at 50% 0%, ${game.color}22 0%, transparent 65%)`,
                }}
              />

              <div className="relative flex items-start justify-end p-5">
                <span
                  className={`rounded-full px-2.5 py-1 font-mono text-[10px] uppercase tracking-wider backdrop-blur ${
                    game.live
                      ? "bg-accent-soft text-accent-ink"
                      : "bg-amber-400/90 text-black"
                  }`}
                >
                  {game.live ? t.games.live : t.games.comingSoon}
                </span>
              </div>

              <div
                className="relative p-5 pt-14"
                style={{
                  background: `linear-gradient(to top, var(--bg-raised) 30%, transparent 100%)`,
                }}
              >
                <h3
                  className="font-display text-2xl font-bold tracking-tight text-ink"
                  style={{ textShadow: `0 0 30px ${game.color}40` }}
                >
                  {game.name}
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-ink-soft">
                  {t.games[game.blurbKey]}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

export function SectionHeading({
  eyebrow,
  title,
  description,
  align = "left",
}: {
  eyebrow: string;
  title: string;
  description?: string;
  align?: "left" | "center";
}) {
  return (
    <div className={align === "center" ? "mx-auto max-w-2xl text-center" : "max-w-2xl"}>
      <div className="font-mono text-xs uppercase tracking-widest text-blue-ink">
        {eyebrow}
      </div>
      <h2 className="font-display mt-3 text-balance text-3xl font-bold tracking-tight text-ink sm:text-4xl">
        {title}
      </h2>
      {description ? (
        <p className="mt-4 text-base leading-relaxed text-ink-soft">
          {description}
        </p>
      ) : null}
    </div>
  );
}
