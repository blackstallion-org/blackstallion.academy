import { asset } from "./asset";
import type { Painting } from "@/lib/museum/artwork-types";

/**
 * Reel 01 · The Marwari, chapter "The museum". A scroll-driven 3D corridor (adapted from the open "Arvista" museum
 * demo's engine; none of its paintings, name or copy are used) hung with six plates from the Marwari story.
 *
 * Every label is drawn from lib/content/legend.ts and so from the claims ledger (Blueprint Part 9). The images are
 * Higgsfield placeholder art, shown as illustrations, never as archival photographs; folklore says so in "Basis".
 */
export const GALLERY = {
  name: "THE MARWARI",
  subtitle: "A museum of the horse",
  /** Carved over the doors, in capitals: the 3D tablet draws these two lines. */
  inscription: ["MARWARI", "MUSEUM OF THE HORSE"],
  tagline: "Six plates. One bloodline.",
  /** Shown under the hall title. */
  attribution: "Walk the hall of the breed",
  /** Short sentence for the lead-in above the stage and the static fallback. */
  lead: "Scroll to walk a gallery of six plates from the Marwari story, from the desert that bred the horse to the revival that saved it. Each plate carries its chapter.",
  fallbackNotice: "The 3D hall could not start on this device, so the six plates are shown in a simple view below.",
  reducedNotice: "The walking hall is switched off because your device asks for less motion. The six plates are shown in a simple view below.",
} as const;

/** The people the museum speaks for; shown on the closing wall. */
export const CURATOR = {
  name: "The Black Stallion Academy",
  attribution: "Hung by the Black Stallion Academy of Horsemanship",
  closing: "The Marwari survived the desert, the wars and the years when India almost forgot it. At BSAH it carries the next generation.",
  closingCue: "Begin the story",
} as const;

const BASIS = {
  history: "Breed history",
  standard: "Breed standard",
  tradition: "Cavalry tradition",
  folklore: "Folklore as told in Marwar, not record",
  record: "Breed-society records",
} as const;

const ILLUSTRATION = "Illustration (placeholder art)";

/** Plates in hanging order; walls alternate left / right. */
export const paintings: Painting[] = [
  {
    id: "driven-into-the-desert",
    title: "Driven into the desert",
    chapter: "II · Marwar, 1193",
    image: {
      src: asset("/images/legend/legend-fort.webp"),
      srcSmall: asset("/images/legend/museum/fort-small.webp"),
      width: 1920,
      height: 1072,
      alt: "A wall of dust rolling across red desert sand under a heavy sky.",
    },
    description:
      "Little grew there. Water came by the cupful.\nThe horses that lived were the ones that could march for days, through heat by day and cold by night, on scraps of fodder, and still carry a rider.",
    facts: [["Chapter", "II · Marwar, 1193"], ["Basis", BASIS.history], ["Image", ILLUSTRATION]],
    physicalSize: { widthCm: 46, heightCm: 26 },
    wall: "left",
    order: 1,
  },
  {
    id: "the-tips-touch",
    title: "The tips touch",
    chapter: "IV · The ears",
    image: {
      src: asset("/images/legend/legend-ears.webp"),
      srcSmall: asset("/images/legend/museum/ears-small.webp"),
      width: 1434,
      height: 1920,
      alt: "A horse seen from behind, its two ears curving inward until the tips meet, edged in warm light against darkness.",
    },
    description:
      "A Marwari's ears curve inward until the tips meet, like the arms of a lyre.\nThey can turn through 180 degrees, and the horse's hearing is famously sharp. When the blood is mixed, the curve is the first thing to go.",
    facts: [["Chapter", "IV · The ears"], ["Basis", BASIS.standard], ["Image", ILLUSTRATION]],
    physicalSize: { widthCm: 33, heightCm: 44 },
    wall: "right",
    order: 2,
  },
  {
    id: "victory-death-or-home",
    title: "Victory. Death. Or home.",
    chapter: "VI · Three reasons",
    image: {
      src: asset("/images/legend/legend-cavalry.webp"),
      srcSmall: asset("/images/legend/museum/cavalry-small.webp"),
      width: 1920,
      height: 1072,
      alt: "A line of horsemen riding out of golden dust at dusk, seen in silhouette.",
    },
    description:
      "A Marwari leaves the battlefield in only three ways.\nIn the late sixteenth century the horsemen of Marwar fielded a cavalry of more than fifty thousand. Victory. Death. Or carrying its rider home.",
    facts: [["Chapter", "VI · Three reasons"], ["Basis", BASIS.tradition], ["Image", ILLUSTRATION]],
    physicalSize: { widthCm: 46, heightCm: 26 },
    wall: "left",
    order: 3,
  },
  {
    id: "the-leap-from-the-wall",
    title: "The leap from the wall",
    chapter: "VII · Roll of honour",
    image: {
      src: asset("/images/legend/legend-bahadur.webp"),
      srcSmall: asset("/images/legend/museum/bahadur-small.webp"),
      width: 1920,
      height: 1072,
      alt: "A single black stallion in silhouette on a desert dune against an amber sunset.",
    },
    description:
      "A horse carried its rider up onto a fortress rampart and leapt from the wall to save him.\nThe horse did not survive the fall. Folklore, not record.",
    facts: [["Chapter", "VII · Roll of honour"], ["Basis", BASIS.folklore], ["Image", ILLUSTRATION]],
    physicalSize: { widthCm: 46, heightCm: 26 },
    wall: "right",
    order: 4,
  },
  {
    id: "from-royalty-to-the-cart",
    title: "From royalty to the cart",
    chapter: "VIII · The fall",
    image: {
      src: asset("/images/legend/legend-fall.webp"),
      srcSmall: asset("/images/legend/museum/fall-small.webp"),
      width: 1920,
      height: 1072,
      alt: "A worn black-and-white scene of a horse pulling a cart heaped with sacks along a dirt road.",
    },
    description:
      "For centuries only royal and Rajput warrior families could own these horses.\nThen came independence. Thousands of horses were sold as pack animals, castrated or shot. Crossed with other breeds, the pure line began to disappear.",
    facts: [["Chapter", "VIII · The fall"], ["Basis", BASIS.history], ["Image", ILLUSTRATION]],
    physicalSize: { widthCm: 46, heightCm: 26 },
    wall: "left",
    order: 5,
  },
  {
    id: "the-line-that-refused-to-end",
    title: "The line that refused to end",
    chapter: "IX · The revival",
    image: {
      src: asset("/images/legend/legend-revival.webp"),
      srcSmall: asset("/images/legend/museum/revival-small.webp"),
      width: 1920,
      height: 815,
      alt: "A herd of horses galloping toward the viewer through golden dust.",
    },
    description:
      "The breed is no longer at risk.\nFrom the founding of Marwari Bloodlines in 1995 to official registration in 2009, the revival took shape. Today it works in endurance, tent pegging, weddings and festivals.",
    facts: [["Chapter", "IX · The revival"], ["Basis", BASIS.record], ["Image", ILLUSTRATION]],
    physicalSize: { widthCm: 52, heightCm: 22 },
    wall: "right",
    order: 6,
  },
];
