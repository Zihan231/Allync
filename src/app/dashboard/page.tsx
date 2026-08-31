"use client";

import Link from "next/link";
import Image from "next/image";
import { useLanguage } from "@/lib/i18n/LanguageContext";
import { useSession } from "@/lib/session/SessionContext";
import { games } from "@/lib/games";
import { PageHeader } from "@/components/dashboard/PageHeader";
import { StatusPill } from "@/components/dashboard/StatusPill";
import { ArrowRightIcon } from "@/components/icons";

export default function DashboardHubPage() {
  const { t } = useLanguage();
  const { user } = useSession();

  if (user.mode === "organizer") {
    return (
      <div className="mx-auto max-w-2xl">
        <div className="rounded-2xl border border-surface-line bg-surface/50 p-8 text-center">
          <div className="font-mono text-xs uppercase tracking-widest text-blue-ink">
            {t.dashboard.shell.modeOrganizer}
          </div>
          <h1 className="font-display mt-3 text-2xl font-bold text-ink">
            {t.dashboard.hub.organizerTitle}
          </h1>
          <p className="mt-3 text-sm leading-relaxed text-ink-soft">
            {t.dashboard.hub.organizerBody}
          </p>
          <Link
            href="/dashboard/organizer"
            className="group mt-6 inline-flex items-center gap-2 rounded-full bg-accent px-6 py-3 font-display font-semibold text-bg transition-transform hover:-translate-y-0.5"
          >
            {t.dashboard.hub.organizerCta}
            <ArrowRightIcon className="h-4 w-4 transition-transform group-hover:translate-x-1" />
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div>
      <PageHeader title={t.dashboard.hub.title} description={t.dashboard.hub.subtitle} />

      <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {games.map((game) => (
          <Link
            key={game.id}
            href={`/dashboard/${game.id}`}
            className="group relative flex h-56 flex-col justify-between overflow-hidden rounded-2xl border border-surface-line transition-all duration-300 hover:-translate-y-1 hover:border-surface-line-strong"
            style={{ boxShadow: `0 0 0 1px transparent` }}
          >
            <Image
              src={game.image}
              alt={game.name}
              fill
              sizes="(min-width: 1024px) 25vw, (min-width: 640px) 50vw, 100vw"
              className="pointer-events-none object-cover opacity-70 transition-transform duration-500 group-hover:scale-110 group-hover:opacity-85"
            />
            <div
              className="pointer-events-none absolute inset-0"
              style={{
                background: `linear-gradient(to top, var(--bg-raised) 8%, ${game.color}30 55%, transparent 100%)`,
              }}
            />
            <div
              className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-300 group-hover:opacity-100"
              style={{ boxShadow: `inset 0 0 0 2px ${game.color}99` }}
            />

            <div className="relative flex items-start justify-between p-4">
              <div
                className="flex h-10 w-10 items-center justify-center rounded-lg backdrop-blur-sm"
                style={{ backgroundColor: `${game.color}33`, color: game.color }}
              >
                <game.icon className="h-5 w-5" />
              </div>
              <StatusPill tone={game.live ? "success" : "neutral"} className="backdrop-blur-sm">
                {game.live ? t.games.live : t.games.comingSoon}
              </StatusPill>
            </div>

            <div className="relative flex items-end justify-between p-4 pt-10">
              <div
                className="font-display text-xl font-bold text-ink"
                style={{ textShadow: `0 2px 16px rgba(0,0,0,0.6), 0 0 30px ${game.color}40` }}
              >
                {game.name}
              </div>
              <ArrowRightIcon className="h-4 w-4 shrink-0 text-ink-soft opacity-0 transition-all duration-300 group-hover:translate-x-1 group-hover:opacity-100" />
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
