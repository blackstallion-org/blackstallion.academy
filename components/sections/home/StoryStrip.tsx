"use client";

import { CinematicStoryReel, type ReelSlide } from "@/components/film/CinematicStoryReel";

const STORY_SLIDES: ReelSlide[] = [
  {
    id: "origin",
    reelNum: "01",
    subtitle: "REEL 01 · 1193 AD · THAR BASIN",
    titleLine1: "Eight Hundred",
    titleLine2: "Years",
    imageKey: "legendSand",
    alt: "A Marwari's hooves lifting out of deep desert sand in the Thar Basin",
    align: "left",
    caption: "Driven onto the arid dunes of Marwar, forged by desert endurance.",
  },
  {
    id: "terrain",
    reelNum: "02",
    subtitle: "REEL 02 · 1350 AD · THE DESERT SHIELD",
    titleLine1: "Bred By",
    titleLine2: "Terrain",
    imageKey: "bgFort",
    alt: "Sandstone Rajput fortress towering above the Thar at dusk",
    align: "right",
    caption: "Bred by geography, not ideology. Surviving on a cup of desert water.",
  },
  {
    id: "covenant",
    reelNum: "03",
    subtitle: "REEL 03 · 1576 AD · THE LIVING VOW",
    titleLine1: "The Art",
    titleLine2: "Of Life",
    imageKey: "legendCavalry",
    alt: "Marwari horsemen silhouettes charging through a plume of golden desert dust",
    align: "left",
    caption: "Victory, death, or carrying the rider home. The unbroken covenant.",
  },
];

export function StoryStrip() {
  return (
    <CinematicStoryReel
      sectionId="legend-reel-h"
      sectionLabel="The Legend Reel"
      sectionSubLabel="800 Years of the Marwari"
      slides={STORY_SLIDES}
      exploreHref="/history"
      exploreLabel="Explore chronicle"
      heightClass="h-screen min-h-[640px] max-h-[1100px]"
    />
  );
}
