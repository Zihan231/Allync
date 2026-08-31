import { SectionHeading } from "./GameStrip";
import { Reveal } from "./Reveal";
import { UsersIcon, TrophyIcon, BracketIcon, ShieldIcon } from "./icons";

const steps = [
  {
    n: "01",
    icon: UsersIcon,
    title: "Join a community",
    body: "Every community is its own league — run by a President, Manager, and Head of Discipline, not a faceless admin panel.",
  },
  {
    n: "02",
    icon: TrophyIcon,
    title: "Build or join a club",
    body: "Clubs sit above any one community — the same squad can register into several at once, like a real football club playing league and cup.",
  },
  {
    n: "03",
    icon: BracketIcon,
    title: "Compete in tournaments",
    body: "Default 4/8-player rooms, custom group-and-knockout brackets, or Club vs Club ties where individual results roll into one team score.",
  },
  {
    n: "04",
    icon: ShieldIcon,
    title: "Results, verified",
    body: "Both sides submit the result with evidence. Matched claims auto-verify; disputes go to a ruling. Paid tournaments settle straight to your wallet.",
  },
];

export function HowItWorks() {
  return (
    <section id="how-it-works" className="relative overflow-hidden border-t border-surface-line/70 py-24">
      <div className="glow-blue pointer-events-none absolute left-1/2 top-0 h-[420px] w-[720px] -translate-x-1/2 -translate-y-1/2 opacity-60 blur-3xl" />

      <div className="relative mx-auto max-w-7xl px-6 lg:px-10">
        <Reveal>
          <SectionHeading
            eyebrow="How it works"
            title="From sign-up to prize pool, in four steps"
          />
        </Reveal>

        <div className="relative mt-16">
          <div className="pointer-events-none absolute left-0 right-0 top-8 hidden h-px bg-gradient-to-r from-transparent via-surface-line-strong to-transparent lg:block" />

          <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-4 lg:gap-6">
            {steps.map((step, i) => (
              <Reveal key={step.n} delay={i * 110}>
                <div className="group relative">
                  <div className="relative z-10 flex h-16 w-16 items-center justify-center rounded-2xl border border-surface-line-strong bg-surface text-accent-ink shadow-[0_8px_24px_-8px_rgba(0,0,0,0.5)] transition-transform duration-300 group-hover:-translate-y-1 group-hover:border-accent/60">
                    <step.icon className="h-7 w-7" />
                    <span className="font-mono absolute -right-2 -top-2 flex h-6 w-6 items-center justify-center rounded-full border border-surface-line-strong bg-bg-raised text-[10px] text-ink-faint">
                      {step.n}
                    </span>
                  </div>

                  <h3 className="font-display mt-5 text-xl font-semibold text-ink">
                    {step.title}
                  </h3>
                  <p className="mt-2.5 text-sm leading-relaxed text-ink-soft">
                    {step.body}
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
