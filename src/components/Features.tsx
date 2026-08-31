import { SectionHeading } from "./GameStrip";
import { Reveal } from "./Reveal";
import {
  ShieldIcon,
  WalletIcon,
  SwapIcon,
  TrophyIcon,
  UsersIcon,
  BracketIcon,
} from "./icons";

const features = [
  {
    icon: ShieldIcon,
    title: "Verified match results",
    body: "Both players submit their score with evidence. Matching claims auto-verify — conflicts go to a dispute ruling before anything is written to your stats.",
  },
  {
    icon: WalletIcon,
    title: "Real-money tournaments",
    body: "Entry fees escrow in BDT until the tournament ends, then the prize pool releases straight to verified winners, minus a flat 5% platform cut.",
  },
  {
    icon: SwapIcon,
    title: "A real transfer window",
    body: "Clubs make offers, players accept, fees move club to club — on a schedule the community sets, the way real football transfer windows work.",
  },
  {
    icon: TrophyIcon,
    title: "Club vs Club leagues",
    body: "Community-vs-community fixtures pair up each roster's 1v1s and sum the results into one club score — not just a shared label.",
  },
  {
    icon: UsersIcon,
    title: "Any game, one profile",
    body: "Your stats live under one account. Open it from eFootball and see eFootball; open the full profile and see every game you've played.",
  },
  {
    icon: BracketIcon,
    title: "Open tournaments, any organizer",
    body: "Switch to Organizer mode and run a tournament for any game — no community required. Paid tournaments need KYC before entry fees go live.",
  },
];

export function Features() {
  return (
    <section id="features" className="relative border-t border-surface-line/70 py-24">
      <div className="mx-auto max-w-7xl px-6 lg:px-10">
        <Reveal>
          <SectionHeading
            eyebrow="Built for competitive play"
            title="The parts every self-organized league eventually needs"
            description="Trust, structure, and money — handled, so a community can focus on the football."
          />
        </Reveal>

        <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {features.map((feature, i) => (
            <Reveal key={feature.title} delay={(i % 3) * 90}>
              <div className="group relative h-full overflow-hidden rounded-xl border border-surface-line bg-surface/50 p-6 transition-all duration-300 hover:-translate-y-1 hover:border-blue/40 hover:shadow-[0_16px_40px_-16px_rgba(76,141,255,0.35)]">
                <div
                  className="pointer-events-none absolute -right-10 -top-10 h-28 w-28 rounded-full bg-blue opacity-0 blur-3xl transition-opacity duration-300 group-hover:opacity-[0.12]"
                />
                <div className="relative flex h-11 w-11 items-center justify-center rounded-lg bg-blue-soft text-blue-ink transition-transform duration-300 group-hover:scale-110">
                  <feature.icon className="h-6 w-6" />
                </div>
                <h3 className="font-display relative mt-4 text-lg font-semibold text-ink">
                  {feature.title}
                </h3>
                <p className="relative mt-2 text-sm leading-relaxed text-ink-soft">
                  {feature.body}
                </p>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
