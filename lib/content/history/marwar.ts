/**
 * /history/marwar · "Marwar: The Horse, the Crown & the Empire." Reel 24.
 *
 * Copy rules for this page:
 * - Every dated fact was checked against two sources (16 Nov 2026): Aitchison, Treaties, Engagements and Sanads, vol. III
 *   (1909); Imperial Gazetteer of India, Provincial Series: Rajputana (1908); Britannica; Wikipedia articles with their
 *   cited sources. See `sources` below. Anything that could not be confirmed was cut.
 * - Claims ledger (Blueprint Part 9): never say Marwari horses charged at Haifa; no breed is claimed for Haifa at all.
 * - The painted scenes are generated reconstructions and are always tagged so. Photographs live in marwar-archive.ts.
 * - Neither celebrate the Empire nor romanticise the alliance: name paramountcy, tribute and the cost of war.
 */

import { asset } from "../asset";

export type Era = "painting" | "archive" | "present";

/** A transparent subject layer, registered to its background plate (percent of the 1672 × 941 plate). */
export type Layer = { src: string; w: number; h: number; left: number; top: number; width: number };

export type PlateScene = {
  key: string;
  background: string;
  composite: string;
  subject: Layer;
  /** Horizontal focal point (0–1) when the plate is cropped to a narrow screen. */
  fx: number;
  alt: string;
  /** Fabric regions that may ripple (percent of the plate): only cloth, never people or horses. */
  fabric?: { id: string; clip: string }[];
  /** Shown with the reconstruction tag: what the picture is not. */
  caption: string;
};

// Every media path is written out in full inside asset(): the media manifest and the asset guard read literal paths.

export const scenes = {
  horsemen: {
    key: "scene-01",
    background: asset("/images/history/marwar/scenes/01-horsemen-background.webp"),
    composite: asset("/images/history/marwar/scenes/01-horsemen-composite.webp"),
    subject: { src: asset("/images/history/marwar/scenes/01-horsemen-subject.webp"), w: 1536, h: 1024, left: 46.77, top: 24.65, width: 58.61 },
    fx: 0.72,
    caption: "An imagined Rathore horseman. Not a portrait of any ruler.",
    alt: "Painted reconstruction: a Rathore horseman on a dark bay Marwari stands on a palace terrace, Mehrangarh on its rock behind, the Thar opening to the horizon.",
  },
  arrival: {
    key: "scene-02",
    background: asset("/images/history/marwar/scenes/02-british-enter-background.webp"),
    composite: asset("/images/history/marwar/scenes/02-british-enter-composite.webp"),
    subject: { src: asset("/images/history/marwar/scenes/02-british-enter-subject.webp"), w: 1024, h: 1536, left: 43.9, top: 26.35, width: 26.91 },
    fx: 0.58,
    caption: "An imagined meeting. The treaty itself was concluded at Delhi, between envoys.",
    alt: "Painted reconstruction: a Marwar courtier and a Company officer in a blue coat talk on a palace terrace; a map of the region hangs on the wall and the fort rises behind.",
    fabric: [
      { id: "canopy", clip: "polygon(0% 9%, 34% 9%, 34% 25.5%, 0% 25.5%)" },
      { id: "hanging", clip: "polygon(78.5% 10%, 99.5% 10%, 99.5% 58%, 78.5% 58%)" },
    ],
  },
  lancers: {
    key: "scene-03",
    background: asset("/images/history/marwar/scenes/03-jodhpur-lancers-background.webp"),
    composite: asset("/images/history/marwar/scenes/03-jodhpur-lancers-composite.webp"),
    subject: { src: asset("/images/history/marwar/scenes/03-jodhpur-lancers-subject.webp"), w: 1756, h: 895, left: 30, top: 30.5, width: 67 },
    fx: 0.55,
    caption: "An imagined charge on the Haifa road. Not a record of the action, and no claim about the horses' breed.",
    alt: "Painted reconstruction: five Indian lancers in khaki with pennoned lances canter along a dusty road above a coastal town and the sea.",
  },
  commander: {
    key: "scene-04",
    background: asset("/images/history/marwar/scenes/04-pratap-singh-background.webp"),
    composite: asset("/images/history/marwar/scenes/04-pratap-singh-composite.webp"),
    subject: { src: asset("/images/history/marwar/scenes/04-pratap-singh-subject.webp"), w: 1024, h: 1536, left: 39.11, top: 4.68, width: 34.39 },
    fx: 0.55,
    caption: "An imagined officer of the period. Not a portrait of Sir Pratap Singh; his photographs are on this page.",
    alt: "Painted reconstruction: a grey-bearded Rajput officer in khaki service dress and a crimson turban stands in a palace room, the fort framed by the arches behind him.",
    fabric: [{ id: "tapestry", clip: "polygon(5% 0%, 31% 0%, 31% 46%, 5% 46%)" }],
  },
  legacy: {
    key: "scene-05",
    background: asset("/images/history/marwar/scenes/05-living-legacy-background.webp"),
    composite: asset("/images/history/marwar/scenes/05-living-legacy-composite.webp"),
    subject: { src: asset("/images/history/marwar/scenes/05-living-legacy-subject.webp"), w: 1230, h: 1278, left: 45.69, top: 26.35, width: 35.11 },
    fx: 0.62,
    caption: "An imagined Marwari stallion.",
    alt: "Painted reconstruction: a black Marwari stallion with inward-curving ears stands in a sandstone stable court under a tree, the gate open to the desert.",
  },
} satisfies Record<string, PlateScene>;

export type ChapterId = "horsemen" | "arrival" | "crown" | "commander" | "lancers" | "end" | "legacy";

export type Chapter = {
  id: ChapterId;
  n: string;
  era: Era;
  when: string;
  /** Short year for the rail. */
  rail: string;
  inscription: string;
  voice: string;
  lede: string;
  body: string[];
  quote: string;
};

export const chapters: Chapter[] = [
  {
    id: "horsemen",
    n: "01",
    era: "painting",
    when: "Before 1818",
    rail: "1459",
    inscription: "The land",
    voice: "of horsemen.",
    lede: "Rao Jodha founded Jodhpur in 1459 and raised Mehrangarh on the rock above it. For three centuries the Rathore rulers of Marwar held the desert from the saddle.",
    body: [
      "Their horse was bred for the Thar: hardy, sure on sand, with ears that curve inward until the tips meet.",
    ],
    quote: "Before the Empire, there was Marwar.",
  },
  {
    id: "arrival",
    n: "02",
    era: "painting",
    when: "1818",
    rail: "1818",
    inscription: "The arrival",
    voice: "of British power.",
    lede: "On 6 January 1818, at Delhi, the East India Company concluded a treaty with Maharaja Man Singh of Jodhpur. Marwar kept its throne. It lost the right to choose its own friends.",
    body: [
      "Jodhpur came under British protection and paid the Company the tribute it had once paid to Sindia: one lakh and eight thousand rupees a year.",
    ],
    quote: "A kingdom remained. Its independence changed.",
  },
  {
    id: "crown",
    n: "03",
    era: "archive",
    when: "Nineteenth century",
    rail: "1873",
    inscription: "The maharajas",
    voice: "& the Crown.",
    lede: "After 1858 the Company's treaties passed to the Crown. A British political officer was posted at Jodhpur, and a maharaja's standing was counted in guns: Jodhpur's salute was seventeen.",
    body: [
      "Jaswant Singh II ruled from 1873 to 1895. In 1889 he offered six hundred cavalry for imperial service: the beginning of the Jodhpur Lancers.",
      "Ceremony did the work of diplomacy: durbars, honours, the reception of royal visitors. Real power rested with the paramount state.",
    ],
    quote: "Two powers. One complicated alliance.",
  },
  {
    id: "commander",
    n: "04",
    era: "archive",
    when: "Late 1800s to early 1900s",
    rail: "1845",
    inscription: "The royal",
    voice: "commander.",
    lede: "Sir Pratap Singh, a son of Maharaja Takht Singh, governed Jodhpur through three regencies and rode with its cavalry from the North-West Frontier to France.",
    body: [
      "His career is the bargain of the princely states in one life: service to the Crown, in return for a place within its order.",
    ],
    quote: "A Rajput commander in an imperial world.",
  },
  {
    id: "lancers",
    n: "05",
    era: "archive",
    when: "1889 to 1918",
    rail: "1918",
    inscription: "The Jodhpur",
    voice: "Lancers.",
    lede: "The regiments organised from 1889 served in China, on the North-West Frontier, in France and in Palestine. In July 1915 a photographer found them at Linghem, behind the Western Front.",
    body: [
      "On 23 September 1918 the Jodhpur and Mysore Lancers of the 15th (Imperial Service) Cavalry Brigade rode against Haifa and took the town. The Jodhpur Lancers' acting commander, Major Dalpat Singh, was mortally wounded.",
      "The Indian Army still marks 23 September as Haifa Day, and the Teen Murti memorial in New Delhi stands for the brigade.",
    ],
    quote: "From the sands of Marwar to the fields of a world war.",
  },
  {
    id: "end",
    n: "06",
    era: "archive",
    when: "1947 to 1949",
    rail: "1947",
    inscription: "The end",
    voice: "of an empire.",
    lede: "On 11 August 1947 Maharaja Hanwant Singh signed Jodhpur's accession to India. On 30 March 1949 the state joined Greater Rajasthan, and the merger took effect on 7 April.",
    body: [
      "With the princely armies gone, the Marwari lost its patrons. Many horses were sold, gelded or shot, and the breed declined sharply.",
    ],
    quote: "The Empire departed. The heritage endured.",
  },
  {
    id: "legacy",
    n: "07",
    era: "present",
    when: "Present day",
    rail: "Now",
    inscription: "The living",
    voice: "Marwari legacy.",
    lede: "Breeders and horse societies brought the Marwari back from the 1990s. A breed that carried kings now carries the people who keep it.",
    body: [
      "The Black Stallion Academy teaches horsemanship to children with the Marwari at its centre: its history, its care, and the discipline of riding it well.",
    ],
    quote: "Empires fade. Traditions can live on.",
  },
];

/** The 1818 treaty, quoted from Aitchison (1909), vol. III, no. LIV, pp. 159–60. Spelling as printed. */
export const treaty = {
  heading: "Treaty with Maharajah Maun Sing of Jodhpore",
  dated: "Done at Delhi, this sixth day of January A.D. 1818",
  articles: [
    {
      n: "III",
      text: "Maharajah Maun Sing and his heirs and successors will act in subordinate co-operation with the British Government and acknowledge its supremacy, and will not have any connection with other Chiefs and States.",
    },
    {
      n: "VIII",
      text: "The State of Jodhpore shall furnish fifteen hundred horse for the service of the British Government whenever required…",
      note: "The horse, written into the treaty. Commuted in 1835 to an annual payment for the Jodhpur Legion.",
    },
    {
      n: "IX",
      text: "The Maharajah and his heirs and successors shall remain absolute rulers of their country, and the jurisdiction of the British Government shall not be introduced into that principality.",
    },
  ],
  source: "C. U. Aitchison, A Collection of Treaties, Engagements and Sanads, vol. III (Calcutta, 1909), no. LIV",
  sourceHref: "https://archive.org/details/collectionoftrea014371mbp",
};

/** Chapter 01: hotspots on the painted plate (percent of the plate). Facts only. */
export const hotspots = [
  { id: "fort", x: 22, y: 14, label: "Mehrangarh", text: "Raised by Rao Jodha about 1459 on a rock above the new city of Jodhpur." },
  { id: "ears", x: 64.6, y: 36, label: "The ears", text: "The Marwari's ears curve inward until the tips meet, and can turn through 180 degrees." },
  { id: "thar", x: 88, y: 38, label: "The Thar", text: "Marwar is the dry country west of the Aravalli hills, reaching deep into the Thar." },
] as const;

/** Chapter 04: Sir Pratap Singh in dates. */
export const pratapDates = [
  { year: "1845", text: "Born 22 October, a son of Maharaja Takht Singh of Jodhpur." },
  { year: "1895", text: "Regent of Jodhpur, the first of three regencies (1895–98, 1911–16, 1918–22)." },
  { year: "1897", text: "With the Jodhpur cavalry in the Tirah campaign on the North-West Frontier." },
  { year: "1900", text: "With the Jodhpur Lancers in China." },
  { year: "1902", text: "Maharaja of Idar, a throne he gave up in 1911 to serve again as regent of Jodhpur." },
  { year: "1914", text: "In France with the Indian cavalry, at the age of sixty-nine." },
  { year: "1916", text: "Honorary Lieutenant-General." },
  { year: "1922", text: "Died at Jodhpur on 4 September." },
];

export const page = {
  route: "/history/marwar",
  title: "Marwar: The Horse, the Crown & the Empire",
  description:
    "Seven chapters from the Rathore horsemen of Marwar to the 1818 treaty, Sir Pratap Singh, the Jodhpur Lancers at Haifa, independence and the living Marwari horse. Painted reconstructions beside genuine archive photographs.",
  kicker: "A history in seven chapters",
  lede: "From the royal horsemen of the Thar to the British Empire, the battlefields of the First World War, and the horse that outlived them all.",
  note: "The coloured paintings on this page are modern reconstructions. The black-and-white photographs are genuine records, credited in full at the end.",
  bridge: "Two links onward",
};

export const sources = [
  { label: "C. U. Aitchison, A Collection of Treaties, Engagements and Sanads, vol. III (1909)", href: "https://archive.org/details/collectionoftrea014371mbp" },
  { label: "Imperial Gazetteer of India, Provincial Series: Rajputana (1908)", href: "https://archive.org/details/in.ernet.dli.2015.207013" },
  { label: "Encyclopaedia Britannica, ‘Mehrangarh Fort’", href: "https://www.britannica.com/place/Mehrangarh-Fort" },
  { label: "‘Pratap Singh of Idar’, Wikipedia, and the London Gazette, 6 June 1916", href: "https://en.wikipedia.org/wiki/Pratap_Singh_of_Idar" },
  { label: "‘Battle of Haifa (1918)’ and ‘15th (Imperial Service) Cavalry Brigade’, Wikipedia, citing the official history", href: "https://en.wikipedia.org/wiki/Battle_of_Haifa_(1918)" },
  { label: "‘Jodhpur State’ and ‘Rajasthan Day’, Wikipedia", href: "https://en.wikipedia.org/wiki/Jodhpur_State" },
  { label: "‘Marwari horse’, Wikipedia, and the breed literature in the BSAH claims ledger", href: "https://en.wikipedia.org/wiki/Marwari_horse" },
];

/** Web copies of the archive plates (public/images/history/marwar/archive), by archive id. Masters: output/imagegen/marwar-story/british-archive. */
export const archiveSrc: Record<string, string> = {
  "001": asset("/images/history/marwar/archive/001.webp"),
  "002": asset("/images/history/marwar/archive/002.webp"),
  "003": asset("/images/history/marwar/archive/003.webp"),
  "004": asset("/images/history/marwar/archive/004.webp"),
  "005": asset("/images/history/marwar/archive/005.webp"),
  "006": asset("/images/history/marwar/archive/006.webp"),
  "007": asset("/images/history/marwar/archive/007.webp"),
  "008": asset("/images/history/marwar/archive/008.webp"),
  "009": asset("/images/history/marwar/archive/009.webp"),
  "010": asset("/images/history/marwar/archive/010.webp"),
  "011": asset("/images/history/marwar/archive/011.webp"),
  "101": asset("/images/history/marwar/archive/101.webp"),
  "102": asset("/images/history/marwar/archive/102.webp"),
  "103": asset("/images/history/marwar/archive/103.webp"),
  "104": asset("/images/history/marwar/archive/104.webp"),
};

