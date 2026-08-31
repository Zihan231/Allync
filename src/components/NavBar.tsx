import Link from "next/link";

export function NavBar() {
  const links = [
    { label: "Games", href: "#games" },
    { label: "How it works", href: "#how-it-works" },
    { label: "Features", href: "#features" },
    { label: "Organizers", href: "#organizers" },
  ];

  return (
    <header className="sticky top-0 z-50 border-b border-surface-line/70 bg-bg/85 backdrop-blur">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4 lg:px-10">
        <a href="#top" className="flex items-center gap-2">
          <span className="font-display text-xl font-bold tracking-tight text-ink">
            ALL<span className="text-accent">Y</span>NC
          </span>
        </a>

        <nav className="hidden items-center gap-8 md:flex">
          {links.map((link) => (
            <a
              key={link.href}
              href={link.href}
              className="font-mono text-[13px] uppercase tracking-wide text-ink-soft transition-colors hover:text-ink"
            >
              {link.label}
            </a>
          ))}
        </nav>

        <div className="flex items-center gap-3">
          <Link
            href="/login"
            className="hidden font-mono text-[13px] uppercase tracking-wide text-ink-soft transition-colors hover:text-ink sm:block"
          >
            Log in
          </Link>
          <Link
            href="/signup"
            className="rounded-full bg-accent px-4 py-2 font-display text-sm font-semibold text-bg shadow-[0_0_0_1px_rgba(217,165,68,0.4)] transition-transform hover:-translate-y-0.5 hover:shadow-[0_0_20px_rgba(217,165,68,0.45)]"
          >
            Get Started
          </Link>
        </div>
      </div>
    </header>
  );
}
