"use client";

import { mediaSrc } from "@/lib/content/media";
import { ViscousLiquidCanvas, type ViscousSlide } from "@/components/sections/shared/ViscousLiquidCanvas";

export interface DoorItem {
  who: string;
  title: string;
  tagline: string;
  image: string;
  href: string;
  cta: string;
}

const DOOR_ITEMS: DoorItem[] = [
  {
    who: "Parents",
    title: "The Guardian",
    tagline: "Watch your cadet's journey from the rail. Planned for the parent app: 24/7 stall-cams, gate alerts and verified session reels.",
    image: mediaSrc("parentsRail") || "/media/parents-rail.png",
    href: "/parents",
    cta: "For parents",
  },
  {
    who: "Cadets",
    title: "The Hall of Valour",
    tagline: "A sealed leather passport, your own Marwari stallion, and the national circuit.",
    image: mediaSrc("cadetZayd") || "/media/cadet-zayd.png",
    href: "/cadets",
    cta: "For cadets",
  },
  {
    who: "Schools",
    title: "The Zero-CapEx Engine",
    tagline: "Turnkey campus riding arena funded, built, and operated by BSAH with zero school expenditure.",
    image: mediaSrc("schoolArenaNight") || mediaSrc("schoolAerial") || "/media/school-arena-night.png",
    href: "/schools",
    cta: "For schools",
  },
];

const slides: ViscousSlide[] = DOOR_ITEMS.map((d, i) => ({
  image: d.image,
  title: d.title,
  subtitle: d.tagline,
  tag: d.who,
  badge: `0${i + 1} · FOR ${d.who.toUpperCase()}`,
  ctaText: d.cta,
  ctaHref: d.href,
}));

export function Doors() {
  return (
    <ViscousLiquidCanvas
      id="doors"
      label="REEL 04 · THREE DOORS"
      title="Through the Gate"
      subtitle="Select a path into the sovereign stable."
      fullScreen={true}
      slides={slides}
      showTabs={true}
    />
  );
}
