import { HomeTypography, HomeAct as Intermission } from "@/components/sections/home/HomeTypography";
import { CrisisCure } from "@/components/sections/home/CrisisCure";
import { Doors } from "@/components/sections/home/Doors";
import { Hero } from "@/components/sections/home/Hero";
import { HomeChronicle, HomeCommand, Finale } from "@/components/sections/home/HomeClose";
import { HomeShield, HomeStandings, HomeVerifier } from "@/components/sections/home/HomeConvert";
import { Instrument } from "@/components/sections/home/Instrument";
import { LedgerAscent } from "@/components/sections/home/LedgerAscent";
import { StoryStrip } from "@/components/sections/home/StoryStrip";
import { Studbook } from "@/components/sections/home/Studbook";
import { HomeThresholds } from "@/components/sections/home/HomeThresholds";
import { PageCurtain } from "@/components/sections/shared/PageCurtain";
import { HorseFirst } from "@/components/sections/home/HorseFirst";
import { FirstRideEditorial } from "@/components/sections/editorial/ReferencePanels";
import { EditorialGallery } from "@/components/film/EditorialGallery";

/**
 * R00 · The Trailer. Fifteen sections in three zones (Blueprint Part 6, home).
 * Every section teases one reel and hands off to it.
 */
/** Organisation facts only (names, domain, logo): no ratings, counts or claims that need evidence. */
const organisationJsonLd = {
  "@context": "https://schema.org",
  "@type": "EducationalOrganization",
  name: "The Black Stallion Academy of Horsemanship",
  legalName: "The Black Stallion Academy of Horsemanship Private Limited",
  url: "https://blackstallion.academy",
  logo: "https://blackstallion.academy/icon.png",
  parentOrganization: { "@type": "Organization", name: "Vicarius Infinitum Holdings Private Limited" },
};

export default function Home() {
  return (
    <HomeTypography>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(organisationJsonLd).replace(/</g, "\\u003c") }} />
      {/* Zone A · Hook. Order (owner, 2 Nov 2026): the opening zoom (Loader) → who we are and what we do → the hero film →
          the Rajasthan desert horse (StallionHero) → the rest. "Bronze and Time" was removed from here the same day. */}
      <Hero />
      <div data-home-story><StoryStrip /></div>
      <FirstRideEditorial />
      <Instrument />
      <EditorialGallery page="home" />

      <Intermission act="citadel" line="Now, the proof." />

      {/* Zone B · Proof. The Matrix (brain, spine, muscle, heart, the walk) lives on /science, in 3D; it no longer repeats here. */}
      <CrisisCure />
      <Doors />
      <LedgerAscent />
      <Studbook />
      {/* 14 Nov 2026 (owner): five heritage photographs, big (lib/content/home-thresholds.ts) */}
      <HomeThresholds />
      {/* 2 Nov 2026: the public colour-palette moodboard (Atelier) is replaced by a photograph and a short story. The colour
          tokens themselves are unchanged (app/globals.css). */}
      <HorseFirst />

      <Intermission act="ledger" line="Now, the decision." />

      {/* Zone C · Convert */}
      <PageCurtain page="home" />
      <HomeVerifier />
      <HomeStandings />
      <HomeShield />
      <HomeCommand />
      <HomeChronicle />
      <Finale />
    </HomeTypography>
  );
}
