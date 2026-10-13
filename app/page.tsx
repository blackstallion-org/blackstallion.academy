import { Intermission } from "@/components/film/Intermission";
import { CourageFeature } from "@/components/sections/home/CourageFeature";
import { CrisisCure } from "@/components/sections/home/CrisisCure";
import { Doors } from "@/components/sections/home/Doors";
import { EditorialPillars } from "@/components/sections/home/EditorialPillars";
import { Hero } from "@/components/sections/home/Hero";
import { HomeChronicle, HomeCommand, Finale } from "@/components/sections/home/HomeClose";
import { HomeShield, HomeStandings, HomeVerifier } from "@/components/sections/home/HomeConvert";
import { Instrument } from "@/components/sections/home/Instrument";
import { LedgerAscent } from "@/components/sections/home/LedgerAscent";
import { LuxuryContact } from "@/components/sections/home/LuxuryContact";
import { Matrix } from "@/components/sections/home/Matrix";
import { SchoolsTeaser } from "@/components/sections/home/SchoolsTeaser";
import { StoryStrip } from "@/components/sections/home/StoryStrip";
import { Studbook } from "@/components/sections/home/Studbook";
import { VideoPinSection } from "@/components/cinematic/VideoPinSection";

/**
 * R00 · BSAH CINEMATIC HOMEPAGE MASTERPIECE
 *
 * Three Cinematic Acts:
 * ACT I — THE LEGEND (Full-viewport film opening, 5-frame split-slider, courage feature, instrument hotspots)
 * ACT II — THE CITADEL (Matrix HUD, Crisis & Cure slider, Three Doors, Ledger Ascent, Studbook)
 * ACT III — THE LEDGER (Campus citadel, circular video pin aperture, brass verifier, standings, shield, command AI, chronicle, editorial pillars, luxury contact, grand finale credits)
 */
export default function Home() {
  return (
    <>
      {/* ── ACT I · THE LEGEND (Reels 00–02) ── */}
      <Hero />
      <StoryStrip />
      <CourageFeature />
      <Instrument />

      <Intermission act="citadel" line="Now, the proof." />

      {/* ── ACT II · THE CITADEL (Reels 03–09) ── */}
      <Matrix />
      <CrisisCure />
      <Doors />
      <LedgerAscent />
      <Studbook />

      <Intermission act="ledger" line="Now, the decision." />

      {/* ── ACT III · THE LEDGER (Reels 10–15) ── */}
      <SchoolsTeaser />
      <VideoPinSection />
      <HomeVerifier />
      <HomeStandings />
      <HomeShield />
      <HomeCommand />
      <HomeChronicle />
      <EditorialPillars />
      <LuxuryContact />
      <Finale />
    </>
  );
}
