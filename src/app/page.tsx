import { NavBar } from "@/components/NavBar";
import { Hero } from "@/components/Hero";
import { GameStrip } from "@/components/GameStrip";
import { HowItWorks } from "@/components/HowItWorks";
import { Features } from "@/components/Features";
import { TrustBand } from "@/components/TrustBand";
import { CTAFooter } from "@/components/CTAFooter";

export default function Home() {
  return (
    <>
      <NavBar />
      <main>
        <Hero />
        <GameStrip />
        <HowItWorks />
        <Features />
        <TrustBand />
        <CTAFooter />
      </main>
    </>
  );
}
