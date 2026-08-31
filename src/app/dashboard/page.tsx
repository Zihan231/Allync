"use client";

import Link from "next/link";
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
            className="group relative flex h-40 flex-col justify-between overflow-hidden rounded-xl border border-surface-line p-5 transition-colors hover:border-surface-line-strong"
            style={{
              background: `radial-gradient(130% 90% at 50% 0%, ${game.color}22 0%, var(--bg-raised) 65%)`,
            }}
          >
            <div className="flex items-start justify-between">
              <div
                className="flex h-10 w-10 items-center justify-center rounded-lg"
                style={{ backgroundColor: `${game.color}1f`, color: game.color }}
              >
                <game.icon className="h-5 w-5" />
              </div>
              <StatusPill tone={game.live ? "success" : "neutral"}>
                {game.live ? t.games.live : t.games.comingSoon}
              </StatusPill>
            </div>
            <div className="font-display text-lg font-bold text-ink">{game.name}</div>
          </Link>
        ))}
      </div>
    </div>
  );
}
