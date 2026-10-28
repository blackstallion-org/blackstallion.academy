import { HomeTypography, HomeAct as Intermission } from "@/components/sections/home/HomeTypography";
import { CrisisCure } from "@/components/sections/home/CrisisCure";
import { Doors } from "@/components/sections/home/Doors";
import { Hero } from "@/components/sections/home/Hero";
import { HomeChronicle, HomeCommand, Finale } from "@/components/sections/home/HomeClose";
import { HomeShield, HomeStandings, HomeVerifier } from "@/components/sections/home/HomeConvert";
import { Instrument } from "@/components/sections/home/Instrument";
import { LedgerAscent } from "@/components/sections/home/LedgerAscent";
import { Matrix } from "@/components/sections/home/Matrix";
import { StoryStrip } from "@/components/sections/home/StoryStrip";
import { Studbook } from "@/components/sections/home/Studbook";
import { PageCurtain } from "@/components/sections/shared/PageCurtain";
import { Atelier } from "@/components/sections/home/Atelier";
import { FirstRideEditorial } from "@/components/sections/editorial/ReferencePanels";
import { HorizontalChapter } from "@/components/motion/HorizontalChapter";

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
      {/* Zone A · Hook */}
      <Hero />
      <div data-home-story><StoryStrip /></div>
      <FirstRideEditorial />
      <Instrument />
      <HorizontalChapter typeface="western" chapter="The first bond" text="Every ride begins with a moment of trust." />

      <Intermission act="citadel" line="Now, the proof." />

      {/* Zone B · Proof */}
      <Matrix />
      <CrisisCure />
      <Doors />
      <LedgerAscent />
      <Studbook />
      <Atelier />

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
