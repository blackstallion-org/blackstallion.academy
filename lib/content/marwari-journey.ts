import { asset } from "./asset";

/**
 * Reel 01 · The Marwari as one painted journey (docs/marwari-scroll/CLAUDE_IMPLEMENTATION_PROMPT.md, 14 Nov 2026).
 *
 * Twenty layered paintings (public/images/story/marwari/journey/mw##-{b,s,f}.webp, built by scripts/build-marwari-journey.mjs
 * from the PNG masters) in four acts. Scenes 00-09 carry the argument; 10-19 are detail inserts. The copy comes from
 * docs/marwari-scroll/STORY_SOURCE.txt and lib/content/legend.ts, with their qualifications kept:
 *  - `status` says what the PAINTING is: "illustration" (an evocation of the period), "reconstruction" (a scene no record shows
 *    as painted), "folklore" (a story told in Marwar, not a verified event) or "interpretive" (an imagined vignette of a told
 *    anecdote). It is rendered as HTML next to the reading copy, never inside the painting.
 *  - The Kutch shipwreck stays a legend about Kutch and the Kathiawari, not the Marwari's origin.
 */

export type Status = "illustration" | "reconstruction" | "folklore" | "interpretive";

export const STATUS_LABEL: Record<Status, string> = {
  illustration: "Painted illustration",
  reconstruction: "Painted reconstruction, not a record",
  folklore: "Folklore, as told in Marwar",
  interpretive: "Interpretive painting of a told story",
};

/** How a scene sits on the page (desktop; on phones every scene is the painting followed by its text). */
export type Layout = "panorama" | "plate" | "detail" | "inset";

/** Per-scene motion, all tied to scroll progress through the scene (0 to 1) and reversed when scrolling back. */
export type Motion = {
  /** subject cut-out: start and end translate (percent of the stage), optional scale, and a vertical cadence (bounces per scene) */
  s?: { x?: [number, number]; y?: [number, number]; scale?: [number, number]; cadence?: { n: number; amp: number }; origin?: string };
  b?: { x?: [number, number]; y?: [number, number]; scale?: [number, number] };
  f?: { x?: [number, number]; y?: [number, number]; hold?: boolean };
  /** whole stage: a slow push toward a point */
  push?: { scale: [number, number]; origin: string };
  /** atmosphere drawn in CSS over the painting, its strength following scroll */
  fx?: "dust" | "shimmer" | "lantern" | "embers" | "ripple" | "petals" | "warm";
  /** one-off moves */
  special?: "leap" | "fade-colour" | "reveal" | "breathe";
};

/** A point or a radius pair, in percent of the 16:9 stage (x of the width, y of the height). */
type Pt = [number, number];

/**
 * Idle life for one horse in the subject cut-out, running on its own clock (not scroll) while the scene is on screen.
 * The cut-out also holds riders and handlers, so nothing moves the whole layer: a feathered copy of the head and upper neck
 * nods about the withers (with a slow sheen across the mane), and a feathered copy of the barrel breathes.
 */
export type Idle = {
  /** head and upper neck: ellipse centre and radii */
  head: { at: Pt; r: Pt };
  /** the withers, where the neck meets the back: the nod's pivot */
  pivot: Pt;
  /** nod amplitude in degrees (default 1.5); the sign sets the direction */
  deg?: number;
  /** ribcage: ellipse centre and radii; breathes about 1.4 % */
  barrel?: { at: Pt; r: Pt };
};

/**
 * Atmosphere that loops on its own clock over the painting, by act: dust motes and heat haze in the desert, rising sparks
 * in battle, soft light shafts in palace courtyards. It sits under the reading panel and thins out on the panel's side.
 */
export type Ambient = "desert" | "battle" | "palace";

export type JourneyScene = {
  id: string;
  act: ActId;
  layout: Layout;
  side: "left" | "right";
  /** where the reading panel sits on the sticky stage (wide screens); "top" when the subject fills the lower frame */
  place?: "top" | "bottom";
  title: string;
  kicker?: string;
  body: string[];
  /** a short list (traits, milestones) */
  list?: { name: string; text: string }[];
  /** a pull line set apart from the body */
  pull?: string;
  link?: { href: string; label: string };
  status: Status;
  /** extra caveat for the painting, shown with the status */
  caveat?: string;
  alt: string;
  motion: Motion;
  idle?: Idle;
  ambient?: Ambient;
};

export type ActId = "land" | "body" | "service" | "return";

export const ACTS: { id: ActId; numeral: string; name: string; line: string }[] = [
  { id: "land", numeral: "I", name: "The land", line: "Where the horse came from, and what the desert made of it." },
  { id: "body", numeral: "II", name: "Body and culture", line: "What the breeders chose for, and what Marwar did with the horse it made." },
  { id: "service", numeral: "III", name: "Service and loss", line: "Cavalry, the ballads, and the years the breed nearly vanished." },
  { id: "return", numeral: "IV", name: "The return", line: "The people who kept the line alive, and the horse a cadet meets today." },
];

export const INTRO = {
  kicker: "Reel 01 · Act I · The Legend",
  inscription: "The Marwari",
  voice: "would not leave the field.",
  sub: "Marwar is often translated as “the land of death”. It gave India a horse that would not die easily, and would not leave the field.",
  note: "Twenty Rajasthani-style paintings made for this page. They illustrate the story; none of them is a historical record.",
};

const img = (id: string, layer: "b" | "s" | "f") => asset(`/images/story/marwari/journey/mw${id}-${layer}.webp`);

/** Layer paths, wrapped in asset() so the media base switch moves them with the rest of the site. */
export const LAYERS: Record<string, { b: string; s: string; f: string }> = Object.fromEntries(
  Array.from({ length: 20 }, (_, i) => {
    const id = String(i).padStart(2, "0");
    return [id, { b: img(id, "b"), s: img(id, "s"), f: img(id, "f") }];
  }),
);

/** Scene order: Land 00 10 02 01 11 · Body 03 12 04 13 14 15 · Service 05 06 16 17 07 · Return 08 19 18 09. */
export const SCENES: JourneyScene[] = [
  // ---------------------------------------------------------------- I · The land
  {
    id: "00", act: "land", layout: "plate", side: "left", place: "top",
    title: "Before the names and dates, there was the bond.",
    body: [
      "A horse, and the person walking beside it at first light. Follow the Marwari from the land that shaped it to the riders who carry its legacy today.",
    ],
    status: "illustration",
    alt: "A black Marwari horse in festival tack walks beside its handler across green ground at dawn, a hill fort behind them.",
    motion: { s: { x: [-5, 2] }, b: { scale: [1.05, 1] }, f: { x: [5, -9] } },
    idle: { head: { at: [60, 17], r: [8, 17] }, pivot: [50, 32], deg: 1.5, barrel: { at: [36, 51], r: [13, 10] } },
    ambient: "desert",
  },
  {
    id: "10", act: "land", layout: "panorama", side: "left",
    kicker: "Where it came from",
    title: "Three accounts of an origin no one has settled.",
    body: [
      "Genetic and phenotypic studies describe the Marwari as a distinct population, though its precise ancestry is not settled.",
    ],
    list: [
      { name: "The native · a common view", text: "An indigenous horse of India, shaped by natural selection in the Thar." },
      { name: "The steppe · historical influence", text: "Over centuries, campaigns, migrations and trade brought Turkoman, Afghan and Central Asian horses into northern and western India, where they were bred with local mares." },
      { name: "The shipwreck · legend, of Kutch", text: "The Ain-i-Akbari repeats a tale of an Arab ship wrecked on the coast of Kutch with seven fine horses aboard. It belongs to Kutch and the Kathiawari, and breed writers find little Arab influence in the Marwari. We tell it as a legend, not as the Marwari's origin." },
    ],
    status: "illustration",
    caveat: "Travellers and horses on a trade road; the painting does not show the breed's ancestry.",
    alt: "Travellers on horseback and on foot gather on a trade road through the desert, a royal parasol over the riders.",
    motion: { s: { x: [6, -8], scale: [1.02, 0.95] }, b: { x: [0, -2] }, f: { x: [4, -6] } },
    idle: { head: { at: [74, 40], r: [5, 11] }, pivot: [79, 51], deg: -2 },
    ambient: "desert",
  },
  {
    id: "02", act: "land", layout: "panorama", side: "left",
    kicker: "Marwar, 1193",
    title: "Driven into the desert.",
    body: [
      "Driven from fertile river plains into the arid expanse of the Thar, the horsemen of Marwar survived on terrain, not ideology. The desert did not yield to rank, title or rhetoric.",
    ],
    status: "reconstruction",
    caveat: "An evocation of the move into Marwar, not a picture of a witnessed event.",
    alt: "A small party of Rathore riders on bay, black and white horses approaches a hill fort across an arid plain.",
    motion: { s: { x: [-8, 4], y: [2, -1] }, b: { scale: [1.02, 1] }, f: { x: [3, -5] } },
    idle: { head: { at: [93, 47], r: [4, 9] }, pivot: [88, 52], deg: 2 },
    ambient: "desert",
  },
  {
    id: "01", act: "land", layout: "panorama", side: "right",
    kicker: "Born in the Thar",
    title: "The horses that lived were the ones that could keep going.",
    body: [
      "Little grew there. Water came by the cupful. The horses that lived were the ones that could march for days, through heat by day and cold by night, on scraps of fodder, and still carry a rider.",
    ],
    status: "illustration",
    alt: "A black Marwari stallion gallops through deep desert sand, dust rising from its hooves, a fort on the ridge behind.",
    motion: { s: { x: [-14, 10], cadence: { n: 2, amp: 2.4 } }, b: { x: [1, -1] }, f: { x: [8, -12] }, fx: "dust" },
    idle: { head: { at: [50, 26], r: [8, 15] }, pivot: [38, 36], deg: 1.5, barrel: { at: [27, 53], r: [10, 9] } },
    ambient: "desert",
  },
  {
    id: "11", act: "land", layout: "detail", side: "right",
    kicker: "The well",
    title: "It rewarded stamina, efficiency and stillness.",
    body: [
      "Lost in the desert, the saying goes, trust your horse to find the way home. In time the Thar had given the people of Marwar a horse.",
    ],
    status: "illustration",
    alt: "A black horse lowers its head to drink at a stone desert well while a man draws water beside it.",
    motion: { s: { y: [1.2, 0] }, b: { scale: [1.03, 1] }, fx: "shimmer" },
    idle: { head: { at: [34, 66], r: [7, 14] }, pivot: [24, 45], deg: -1.8, barrel: { at: [15, 57], r: [10, 8] } },
    ambient: "desert",
  },

  // ---------------------------------------------------------------- II · Body and culture
  {
    id: "03", act: "body", layout: "plate", side: "right",
    kicker: "Bred by law",
    title: "Keeping only the finest stallions.",
    body: [
      "For centuries the horse-breeders of Marwar bred strictly, keeping only the finest stallions. What they chose for is still in the breed.",
    ],
    list: [
      { name: "Slim, hard legs", text: "Built for distance, not the sprint." },
      { name: "Fine, silky coat", text: "Sheds desert heat." },
      { name: "Endurance", text: "Not the fastest horse alive. One of the hardest to tire." },
    ],
    status: "illustration",
    alt: "A breeder in a sandstone stable courtyard holds the head of a black horse to examine it.",
    motion: { special: "breathe", b: { scale: [1.02, 1] } },
    idle: { head: { at: [34, 23], r: [8, 15] }, pivot: [44, 32], deg: -1.4, barrel: { at: [55, 49], r: [11, 9] } },
    ambient: "palace",
  },
  {
    id: "12", act: "body", layout: "detail", side: "left",
    kicker: "The working hoof",
    title: "An upright shoulder lifts the hoof clean out of soft sand.",
    body: ["A horse built to cross the Thar on foot, day after day, has to pull each hoof free of the sand with as little effort as possible."],
    status: "illustration",
    alt: "Close view of a dark horse's shoulder and raised foreleg, the hoof lifting from deep sand.",
    motion: { s: { x: [-4, 0], scale: [1, 1.04], origin: "60% 70%" }, f: { x: [10, -6], hold: true } },
    idle: { head: { at: [60, 21], r: [9, 15] }, pivot: [75, 30], deg: -1.2, barrel: { at: [85, 49], r: [9, 10] } },
    ambient: "desert",
  },
  {
    id: "04", act: "body", layout: "plate", side: "left",
    kicker: "The ears",
    title: "The tips touch.",
    body: [
      "A Marwari's ears curve inward until the tips meet, like the arms of a lyre.",
      "Each ear turns on its own, toward whatever the horse is listening to.",
      "Breeders say that when the blood is mixed, the curve is the first thing to go, and read the ears as a seal of purity. That curve is our monogram.",
    ],
    status: "illustration",
    alt: "Portrait of a black Marwari's head in a jewelled bridle, its ears curving inward until the tips meet.",
    motion: { push: { scale: [1, 1.06], origin: "64% 12%" }, f: { y: [0, 4] } },
    idle: { head: { at: [60, 45], r: [24, 44] }, pivot: [91, 98], deg: 0.9 },
    ambient: "palace",
  },
  {
    id: "13", act: "body", layout: "panorama", side: "right",
    kicker: "The revaal",
    title: "A smooth natural amble, easy on a rider over long distances.",
    body: ["Not a gallop: an even, gliding gait the breed is known for, kept for the long road rather than the charge."],
    status: "illustration",
    alt: "A rider in yellow on a bay horse moves at an easy amble along a desert road, a pavilion behind.",
    motion: { s: { x: [-10, 7], cadence: { n: 4, amp: 0.6 } }, f: { x: [5, -7] } },
    idle: { head: { at: [47, 29], r: [6, 14] }, pivot: [39, 35], deg: 1.5, barrel: { at: [20, 55], r: [9, 7] } },
    ambient: "desert",
  },
  {
    id: "14", act: "body", layout: "panorama", side: "left",
    kicker: "Born to dance",
    title: "At night the Marwari danced in wedding processions.",
    body: [
      "Certain lines, known as Nachni (“born to dance”), were trained to step and prance to music with high knee action. The tradition varies from breeder to breeder and region to region.",
    ],
    status: "folklore",
    caveat: "A tradition painted as an imagined procession, not a record of any one wedding.",
    alt: "A night wedding procession: a groom on a white horse under a parasol, musicians and lantern bearers around him.",
    motion: { s: { x: [-3, 3], cadence: { n: 5, amp: 0.7 } }, f: { x: [2, -3] }, fx: "lantern" },
    idle: { head: { at: [53, 43], r: [5, 13] }, pivot: [60, 49], deg: -1.6, barrel: { at: [67, 64], r: [7, 6] } },
  },
  {
    id: "15", act: "body", layout: "detail", side: "right",
    kicker: "The bards",
    title: "The oral histories of Marwar were sung, not written.",
    body: [
      "Folklore is kept in a reel of its own, apart from this history and from the science: Kala, the hair whorls, the Nukra lineage and the Nachni heritage.",
    ],
    link: { href: "/lore", label: "Enter the lore of the bards" },
    status: "folklore",
    alt: "A bard plays a string instrument by a campfire for a seated listener, a black horse standing behind them.",
    motion: { f: { x: [3, -3], y: [0, -2] }, fx: "embers" },
    idle: { head: { at: [44, 18], r: [5, 12] }, pivot: [38, 28], deg: 1.4 },
  },

  // ---------------------------------------------------------------- III · Service and loss
  {
    id: "05", act: "service", layout: "panorama", side: "right",
    kicker: "Three reasons",
    title: "A Marwari leaves the battlefield in only three ways.",
    body: [
      "In the late sixteenth century the horsemen of Marwar faced the ultimate test of terrain and survival, and fielded a cavalry of more than fifty thousand. They held one belief about their horses.",
    ],
    pull: "Victory. Death. Or carrying its rider home.",
    status: "illustration",
    alt: "Marwari cavalry with banners and parasols advances through desert dust, a fort on the horizon.",
    motion: { s: { x: [10, -12] }, b: { x: [-1, 1] }, f: { x: [-6, 10] }, fx: "dust" },
    idle: { head: { at: [27, 47], r: [5, 10] }, pivot: [21, 55], deg: 1.8 },
    ambient: "battle",
  },
  {
    id: "06", act: "service", layout: "plate", side: "left",
    kicker: "The ballads",
    title: "The stallion at the stream.",
    body: [
      "A blue-grey stallion, wounded in the leg, would not leave the field until his rider turned him, then carried his rider across a stream to safety before he fell. Ballads across Rajasthan tell the story, and the details differ from teller to teller.",
    ],
    status: "folklore",
    alt: "A grey horse carries a rider through a shallow stream at dusk, a white palace on the hill behind.",
    motion: { s: { x: [5, -5] }, f: { x: [-3, 3] }, fx: "ripple" },
    idle: { head: { at: [54, 45], r: [5, 11] }, pivot: [62, 45], deg: -1.6, barrel: { at: [77, 64], r: [9, 6] } },
    ambient: "battle",
  },
  {
    id: "16", act: "service", layout: "inset", side: "left",
    kicker: "Folklore",
    title: "The leap from the wall.",
    body: [
      "In one told story, a horse carried its rider up onto a fortress rampart and leapt from the wall to save him. The horse did not survive the fall. Folklore, not record.",
    ],
    status: "folklore",
    alt: "A white horse and rider leap from a fortress wall toward the plain below, figures watching from the battlements.",
    motion: { special: "leap", f: { y: [0, 3] } },
    idle: { head: { at: [47, 27], r: [5, 11] }, pivot: [54, 36], deg: -1.6, barrel: { at: [62, 51], r: [8, 6] } },
    ambient: "battle",
  },
  {
    id: "17", act: "service", layout: "panorama", side: "right",
    kicker: "Near the end of the age of cavalry",
    title: "Marwar's lancers still rode.",
    body: [
      "Marwar's lancers rode for Sir Pratap Singh in the First World War, near the end of the age of cavalry.",
    ],
    status: "interpretive",
    caveat: "An imagined period parade; it shows no particular unit, place or battle.",
    alt: "Mounted lancers in khaki with pennants ride in file past a red sandstone wall.",
    motion: { s: { x: [-7, 5] }, f: { x: [4, -5] } },
    idle: { head: { at: [68, 42], r: [4.5, 11] }, pivot: [63, 55], deg: 1.8 },
    ambient: "desert",
  },
  {
    id: "07", act: "service", layout: "plate", side: "right",
    kicker: "The fall",
    title: "From royalty to the cart.",
    body: [
      "For centuries only royal and Rajput warrior families could own these horses. The British preferred their Thoroughbreds; through the colonial years the Marwari went to fewer battles and was bred with less care.",
      "After independence the princes gave up their states and, in the land reforms that followed, their estates. The stables had nowhere to go. Thousands of horses were sold as pack animals, castrated or shot. Crossed with other breeds, the pure line began to disappear.",
    ],
    status: "illustration",
    alt: "A pale horse pulls a cart of sacks and fodder past an empty sandstone stable.",
    motion: { s: { x: [3, -3] }, special: "fade-colour" },
    idle: { head: { at: [55, 57], r: [5, 10] }, pivot: [46, 60], deg: 1.2, barrel: { at: [42, 68], r: [5, 4] } },
  },

  // ---------------------------------------------------------------- IV · The return
  {
    id: "08", act: "return", layout: "plate", side: "right",
    kicker: "The revival",
    title: "The line that refused to end.",
    body: [
      "In the first half of the twentieth century Maharaja Umaid Singh of Jodhpur kept the breed from disappearing; his grandson, Maharaja Gaj Singh II, carried the work on.",
    ],
    list: [
      { name: "1995", text: "The British horsewoman Francesca Kelly founds Marwari Bloodlines to bring the breed back to notice." },
      { name: "1999", text: "Kelly and Raghuvendra Singh Dundlod lead the group that founds the Indigenous Horse Society of India." },
      { name: "2000s", text: "Marwaris win endurance races at India's national equestrian games; shows for indigenous horses follow." },
    ],
    status: "illustration",
    alt: "A breeder tends a grey foal while bay and black horses feed at a trough in a stud courtyard.",
    motion: { s: { y: [1.5, 0] }, f: { y: [3, -3] }, fx: "warm" },
    idle: { head: { at: [31, 10], r: [6, 12] }, pivot: [41, 28], deg: -1.4, barrel: { at: [60, 49], r: [9, 7] } },
    ambient: "palace",
  },
  {
    id: "19", act: "return", layout: "detail", side: "left",
    kicker: "As told in Marwar",
    title: "The stallion that stayed.",
    body: [
      "When Maharaja Gaj Singh II visited the thikana of Badgaon to choose a colt sired by its famous stallion Vangalia, he asked to see the sire himself. The thakur, afraid of losing his best horse, led Vangalia out. The Maharaja admired him and left him where he stood: the stallion served the breed best where the mares of south Marwar could reach him. He chose a colt and rode home.",
    ],
    status: "interpretive",
    alt: "A kneeling nobleman greets a chestnut colt while a man holds a black stallion beside a pavilion.",
    motion: { push: { scale: [1, 1.05], origin: "62% 58%" } },
    idle: { head: { at: [34, 15], r: [6, 14] }, pivot: [43, 30], deg: -1.4 },
    ambient: "palace",
  },
  {
    id: "18", act: "return", layout: "detail", side: "left",
    kicker: "A register",
    title: "Each registered horse carries its number.",
    body: [
      "Official registration of the breed began in 2009; each registered horse is cold-branded with its registration number. Today the breed is listed as not at risk (FAO 2007; DAD-IS 2020).",
    ],
    status: "illustration",
    caveat: "The studbook in the painting is left blank on purpose.",
    alt: "A horse keeper sits with an open blank studbook between a bay and a black horse.",
    motion: { special: "reveal", s: { scale: [1.03, 1] } },
    idle: { head: { at: [75, 34], r: [5, 13] }, pivot: [83, 40], deg: -1.4, barrel: { at: [88, 51], r: [6, 6] } },
    ambient: "palace",
  },
  {
    id: "09", act: "return", layout: "plate", side: "right",
    kicker: "Every cadet rides one",
    title: "It carries the next generation.",
    body: [
      "The Marwari survived the desert, the wars and the years when India almost forgot it. At BSAH it does what it was bred for: it carries the next generation, and asks them to be worthy of the ride.",
    ],
    status: "illustration",
    alt: "A present-day cadet in riding uniform stands at dawn facing a black Marwari, holding its reins.",
    motion: { s: { y: [2, 0] }, b: { scale: [1.03, 1] } },
    idle: { head: { at: [37, 30], r: [6, 13] }, pivot: [28, 36], deg: 1.4, barrel: { at: [20, 53], r: [9, 8] } },
    ambient: "palace",
  },
];

export const SOURCES =
  "Breed history from the Marwari horse literature and breed-society records; the revival from Wikipedia, “Marwari horse”, and the FEI, “Discover… the Marwari” (2020), checked 2 November 2026. Stories marked folklore are told in Marwar; details vary between sources.";
