import Link from "next/link";
import { ArrowRightIcon } from "./icons";

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

export function CTAFooter() {
  return (
    <>
      <section id="get-started" className="relative overflow-hidden border-t border-surface-line/70 py-28">
        <div className="glow-gold animate-pulse-slow pointer-events-none absolute left-1/2 top-1/2 h-[500px] w-[700px] -translate-x-1/2 -translate-y-1/2 blur-3xl" />
        <div className="relative mx-auto max-w-3xl px-6 text-center lg:px-10">
          <h2 className="font-display text-balance text-4xl font-bold tracking-tight text-ink sm:text-5xl">
            Your community is one login away.
          </h2>
          <p className="mt-5 text-lg leading-relaxed text-ink-soft">
            Create an account, pick eFootball, and find or found a community —
            player mode and organizer mode, on the same login.
          </p>
          <div className="mt-9 flex flex-wrap items-center justify-center gap-4">
            <Link
              href="/signup"
              className="group inline-flex items-center gap-2 rounded-full bg-accent px-7 py-3.5 font-display font-semibold text-bg shadow-[0_0_24px_rgba(217,165,68,0.3)] transition-transform hover:-translate-y-0.5"
            >
              Create your account
              <ArrowRightIcon className="h-4 w-4 transition-transform group-hover:translate-x-1" />
            </Link>
            <Link
              href="/signup"
              className="inline-flex items-center gap-2 rounded-full border border-surface-line-strong px-7 py-3.5 font-display font-semibold text-ink transition-colors hover:border-blue hover:text-blue-ink"
            >
              Become an Organizer
            </Link>
          </div>
        </div>
      </section>

      <footer className="border-t border-surface-line/70">
        <div className="mx-auto max-w-7xl px-6 py-16 lg:px-10">
          <div className="grid gap-12 sm:grid-cols-2 lg:grid-cols-[1.4fr_1fr_1fr_1fr]">
            <div>
              <span className="font-display text-lg font-bold text-ink">
                ALL<span className="text-accent">Y</span>NC
              </span>
              <p className="mt-4 max-w-xs text-sm leading-relaxed text-ink-soft">
                The infrastructure behind competitive gaming — communities,
                clubs, and verified tournaments for players, organizers, and
                brand sponsors alike.
              </p>
            </div>

            <FooterColumn
              heading="Platform"
              links={[
                { label: "Games", href: "#games" },
                { label: "How it works", href: "#how-it-works" },
                { label: "Features", href: "#features" },
              ]}
            />
            <FooterColumn
              heading="Community"
              links={[
                { label: "Organizers & brands", href: "#organizers" },
                { label: "Become an Organizer", href: "/signup" },
                { label: "Create an account", href: "/signup" },
              ]}
            />
            <FooterColumn
              heading="Games"
              links={[
                { label: "eFootball — live", href: "#games" },
                { label: "PUBG — coming soon", href: "#games" },
                { label: "Free Fire — coming soon", href: "#games" },
                { label: "Valorant — coming soon", href: "#games" },
              ]}
            />
          </div>

          <div className="mt-14 flex flex-col gap-4 border-t border-surface-line/70 pt-8 sm:flex-row sm:items-center sm:justify-between">
            <p className="font-mono text-xs text-ink-faint">
              &copy; 2026 Allync. All rights reserved.
            </p>
            <p className="font-mono text-xs uppercase tracking-wide text-ink-faint">
              eFootball live · more games queued
            </p>
          </div>
        </div>
      </footer>
    </>
  );
}
