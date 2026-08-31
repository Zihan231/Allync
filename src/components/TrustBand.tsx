import { Reveal } from "./Reveal";
import { ShieldIcon, WalletIcon, LockIcon } from "./icons";

const points = [
  {
    icon: ShieldIcon,
    label: "Evidence, not just claims",
    body: "Screenshot or clip required on every submitted result — the Head of Discipline rules on anything contested.",
  },
  {
    icon: WalletIcon,
    label: "KYC-gated paid organizing",
    body: "Free tournaments are open to anyone. Real-money ones need identity verification before entry fees go live.",
  },
  {
    icon: LockIcon,
    label: "Escrow, not a promise",
    body: "The platform holds entry fees — not the organizer — until the tournament actually ends and results are verified.",
  },
];

export function TrustBand() {
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
              Built for organizers and brand sponsors alike
            </div>
            <h2 className="font-display mt-3 text-balance text-3xl font-bold tracking-tight text-ink sm:text-4xl">
              Real money. A standard everyone can trust.
            </h2>
            <p className="mt-4 max-w-sm text-sm leading-relaxed text-ink-soft">
              A grassroots community league and a brand-sponsored championship
              run on the same rails — same escrow, same verification, same
              accountability.
            </p>
          </Reveal>

          <div className="grid gap-5 sm:grid-cols-3">
            {points.map((point, i) => (
              <Reveal key={point.label} delay={120 + i * 110}>
                <div className="group relative h-full rounded-xl border border-surface-line bg-surface/40 p-5 transition-all duration-300 hover:-translate-y-1 hover:border-accent/40">
                  <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-accent-soft text-accent-ink transition-transform duration-300 group-hover:scale-110">
                    <point.icon className="h-5 w-5" />
                  </div>
                  <div className="font-display mt-4 text-sm font-semibold text-ink">
                    {point.label}
                  </div>
                  <p className="mt-1.5 text-sm leading-relaxed text-ink-soft">
                    {point.body}
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
