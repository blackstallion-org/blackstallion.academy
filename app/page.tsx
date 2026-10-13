import { Intermission } from "@/components/film/Intermission";
import { CrisisCure } from "@/components/sections/home/CrisisCure";
import { Doors } from "@/components/sections/home/Doors";
import { Hero } from "@/components/sections/home/Hero";
import { FluidFlowmapSection } from "@/components/sections/fluid/FluidFlowmapSection";
import { HomeChronicle, HomeCommand, Finale } from "@/components/sections/home/HomeClose";
import { HomeShield, HomeStandings, HomeVerifier } from "@/components/sections/home/HomeConvert";
import { Instrument } from "@/components/sections/home/Instrument";
import { LedgerAscent } from "@/components/sections/home/LedgerAscent";
import { Matrix } from "@/components/sections/home/Matrix";
import { SchoolsTeaser } from "@/components/sections/home/SchoolsTeaser";
import { StoryStrip } from "@/components/sections/home/StoryStrip";
import { Studbook } from "@/components/sections/home/Studbook";

/**
 * R00 · The Trailer. Fifteen sections in three zones (Blueprint Part 6, home).
 * Every section teases one reel and hands off to it.
 */
export default function Home() {
  return (
    <>
      {/* Zone A · Hook */}
      <Hero />
      <StoryStrip />
      <Instrument />

      <Intermission act="citadel" line="Now, the proof." />

      {/* Zone B · Proof */}
      <Matrix />
      <CrisisCure />
      <Doors />
      <LedgerAscent />
      <Studbook />

      <Intermission act="ledger" line="Now, the decision." />

      {/* Zone C · Convert */}
      <SchoolsTeaser />
      <HomeVerifier />
      <HomeStandings />
      <HomeShield />
      <HomeCommand />
      <HomeChronicle />
      <FluidFlowmapSection />
      <Finale />
    </>
  );
}
