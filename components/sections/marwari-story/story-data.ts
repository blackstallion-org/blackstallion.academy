/**
 * Copy and layer layout for the Marwari cavalry story (components/sections/marwari-story/MarwariStory.tsx).
 *
 * Eighteen pages in four chapters, five + five + four + four. Each page is one viewport of scroll. Every line
 * of copy is either a fact stated in lib/content/anatomy.ts or a legend phrased as "said to", or a description
 * of what the picture shows. The painted standard and the midground riders are illustrations made for this story,
 * not historical objects, and the copy says so where it matters. Each line's source is recorded in docs/marwari-story/SPEC.md.
 */

export type ChapterId = "origin" | "cavalry" | "warfare" | "legacy";

export type StoryPage = {
  title: string;
  body: string;
  /** Optional closing link on the last page. */
  link?: { label: string; href: string };
};

/** A painted layer, positioned as CSS values on the stage (percentages of the stage, not pixels). */
export type LayerSpec = {
  file: string;
  width: string;
  bottom: string;
  /** Horizontal drift in percent across the chapter, [from, to]. Scrubbed on scroll. */
  drift?: [number, number];
};

export type SmokeSpec = { file: string; left: string; top: string; width: string };
export type FlagSpec = { left: string; top: string; height: string };

export type StoryChapter = {
  id: ChapterId;
  numeral: string;
  name: string;
  art: { bg: string; mid?: LayerSpec; fg?: LayerSpec };
  smoke?: SmokeSpec;
  flag?: FlagSpec;
  pages: StoryPage[];
};

export const PAGE_TOTAL = 18;

export const CHAPTERS: StoryChapter[] = [
  {
    id: "origin",
    numeral: "I",
    name: "Origin",
    art: {
      bg: "/images/story/marwari/origin-bg.webp",
      mid: { file: "/images/story/marwari/origin-mid.webp", width: "100%", bottom: "0%", drift: [-2, 2] },
      fg: { file: "/images/story/marwari/origin-fg.webp", width: "100%", bottom: "0%" },
    },
    pages: [
      {
        title: "Marwar",
        body: "A dry country in western Rajasthan, India, where the Marwari horse takes its name.",
      },
      {
        title: "Sand that is hard to cross",
        body: "The desert sand is soft and deep, and a horse had to keep its footing in it.",
      },
      {
        title: "Ears that turn on their own",
        body: "Lyre-shaped ears curve inward until the tips touch, and each one turns through 180° independently.",
      },
      {
        title: "Watched at night",
        body: "Marwar riders are said to have watched the ears at night, trusting them to turn toward ambushers in the dark.",
      },
      {
        title: "Bare hooves on the sand",
        body: "Stories from Marwar say the horses crossed soft sand with no iron shoes at all.",
      },
    ],
  },
  {
    id: "cavalry",
    numeral: "II",
    name: "Cavalry",
    art: {
      bg: "/images/story/marwari/cavalry-bg.webp",
      mid: { file: "/images/story/marwari/cavalry-mid.webp", width: "100%", bottom: "10%", drift: [-4, 4] },
      fg: { file: "/images/story/marwari/cavalry-fg.webp", width: "100%", bottom: "0%" },
    },
    pages: [
      {
        title: "Riders in red and gold",
        body: "The line of riders sits deep on dark horses, the saddle cloths bright with gold thread.",
      },
      {
        title: "A neck that carries the weight",
        body: "High-carried and muscular, the neck works as a counterweight across shifting sand.",
      },
      {
        title: "A seat that stays quiet",
        body: "Rajput riders are said to have learned to sit bareback until the seat never seemed to move.",
      },
      {
        title: "Hands free for the lance",
        body: "Marwar horses are said to answer thigh pressure, so the rider's hands could stay free for the lance.",
      },
      {
        title: "Attention in the head",
        body: "A horse that is listening is paying attention, and its ears show it first.",
      },
    ],
  },
  {
    id: "warfare",
    numeral: "III",
    name: "Warfare",
    art: {
      bg: "/images/story/marwari/warfare-bg.webp",
      mid: { file: "/images/story/marwari/warfare-mid.webp", width: "100%", bottom: "0%", drift: [6, -6] },
      fg: { file: "/images/story/marwari/warfare-fg.webp", width: "92%", bottom: "0%" },
    },
    smoke: { file: "/images/story/marwari/smoke.webp", left: "-6%", top: "16%", width: "46%" },
    flag: { left: "62%", top: "12%", height: "42vh" },
    pages: [
      {
        title: "The charge",
        body: "Lances raised and swords drawn, the line of riders breaks into motion across the plain.",
      },
      {
        title: "Dust over the plain",
        body: "Dust rises behind the charge and hangs in the low light. The painting keeps the moment, not the outcome.",
      },
      {
        title: "Two horses rearing",
        body: "At the edge of the line, two dark horses rear together, held in one still moment of the story.",
      },
      {
        title: "The standard",
        body: "A red standard with a gold horse leads the line. It is an illustration made for this story, not a historical banner.",
      },
    ],
  },
  {
    id: "legacy",
    numeral: "IV",
    name: "Legacy",
    art: {
      bg: "/images/story/marwari/legacy-bg.webp",
      mid: { file: "/images/story/marwari/legacy-mid.webp", width: "100%", bottom: "24%", drift: [3, -3] },
      fg: { file: "/images/story/marwari/legacy-fg.webp", width: "100%", bottom: "0%" },
    },
    pages: [
      {
        title: "Registered since 2009",
        body: "The Marwari Horse Society has held government-authorised registration of the breed since 2009.",
      },
      {
        title: "Still in the saddle",
        body: "The breed and its discipline are taught at the academy today, on horses that carry the same traditions.",
      },
      {
        title: "What the ears still show",
        body: "A horse that is listening is paying attention. Its ears show it first, and the rider can read them.",
      },
      {
        title: "What the story keeps",
        body: "Ears that read the rider, a neck that carries the weight, and feet that cross soft sand.",
        link: { label: "Continue to the academy", href: "/cadets" },
      },
    ],
  },
];

/** Global page number (1-based) of the first page of each chapter, for the "03 / 18" counter. */
export function firstPageNumber(index: number): number {
  return CHAPTERS.slice(0, index).reduce((n, c) => n + c.pages.length, 0) + 1;
}
