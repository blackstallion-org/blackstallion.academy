/**
 * The eleven moments of the Maharana Pratap and Chetak story, in six chapters: the bond, preparing for battle,
 * Haldighati, courage, the legendary escape, and remembrance.
 *
 * The story is one continuous take. The sky, the clouds, the ridges, the ground and the grass in front are the same
 * for every moment (see `BANDS` in PratapStory.tsx): they never change, they only slide past at their own speeds, so
 * the eye always has one blue world to rest on. A moment is only what stands in that world: figures, scenery and
 * weather. Each comes in from its own side, stays for its moment, and leaves the other way.
 *
 * Placement is in percentages of the stage (desktop `d`, phone `m`, falling back to `d`). `b` is the layer's foot
 * above the bottom of the painted world: the ground runs from 0 to about 20%, so a figure standing on it has `b` of
 * 4-8%. `from` is the side a layer enters from (-1 left, 1 right, 0 it fades in place), `fromY` the edge it also
 * enters from (-1 above, 1 below). `depth` 3 is a hero (moves most), 2 is scenery (moves less).
 */
import { asset } from "@/lib/content/asset";

export type Box = { x?: string; r?: string; b: string; w: string };

export type LayerSpec = {
  src: string;
  alt: string;
  depth: 2 | 3;
  from: -1 | 0 | 1;
  fromY?: -1 | 0 | 1;
  /** Where it stands: "sky" (behind the ridges), "back" (on the ridges, behind the ground), "mid" (on the ground),
   *  "hero" (in front, the default for depth 3), "front" (in front of the grass). */
  plane?: "sky" | "back" | "mid" | "hero" | "front";
  d: Box;
  m?: Box;
  opacity?: number;
};

export type CopyPos = "top-left" | "top-right";

export type StoryScene = {
  label: string;
  title: string;
  body: string;
  note?: string;
  pos: CopyPos;
  /** A flat colour wash over the whole world for this moment's light: it fades in and out with the moment. */
  tint?: string;
  layers: LayerSpec[];
};

const STORY = "pratap";
const P = asset(`/images/story/${STORY}/`);

/** The constant blue the whole story sits on. */
export const SKY = `${P}band-sky.webp`;

export const SCENES: StoryScene[] = [
  {
    label: "I · The Bond",
    title: "Before the battle, there was a bond.",
    body: "Maharana Pratap and Chetak, trusting one another.",
    pos: "top-right",
    tint: "rgba(244, 190, 110, 0.12)",
    layers: [
      { src: `${P}el-birds.webp`, alt: "", depth: 2, from: 1, plane: "sky", d: { x: "8%", b: "62%", w: "30%" }, m: { x: "4%", b: "62%", w: "52%" } },
      { src: `${P}bond.webp`, alt: "Maharana Pratap stands beside his horse Chetak, one hand on the horse's neck", depth: 3, from: -1, d: { x: "12%", b: "5%", w: "36%" }, m: { x: "8%", b: "5%", w: "62%" } },
    ],
  },
  {
    label: "I · The Bond",
    title: "Hills that kept their own.",
    body: "Mewar's forts watched the roads below.",
    pos: "top-left",
    tint: "rgba(96, 60, 120, 0.14)",
    layers: [
      { src: `${P}dusk-hills.webp`, alt: "", depth: 2, from: 0, plane: "back", d: { b: "17%", w: "100%" }, m: { x: "-10%", b: "17%", w: "125%" }, opacity: 0.9 },
      { src: `${P}fort.webp`, alt: "A hill fort with ramparts, bastions and gateways on a ridge", depth: 2, from: 1, fromY: 1, plane: "back", d: { r: "6%", b: "17%", w: "42%" }, m: { r: "-4%", b: "17%", w: "76%" } },
    ],
  },
  {
    label: "II · Preparing for Battle",
    title: "Banners rise.",
    body: "Pratap prepares to ride. Chetak is ready.",
    pos: "top-left",
    tint: "rgba(232, 128, 58, 0.12)",
    layers: [
      { src: `${P}banners.webp`, alt: "Mewar banners on tall poles, saffron and crimson with gold borders", depth: 2, from: -1, fromY: -1, plane: "mid", d: { x: "3%", b: "7%", w: "28%" }, m: { x: "-2%", b: "7%", w: "46%" } },
      { src: `${P}mount.webp`, alt: "Maharana Pratap mounts Chetak, a lance held upright", depth: 3, from: 1, fromY: 1, d: { r: "8%", b: "5%", w: "38%" }, m: { r: "4%", b: "5%", w: "62%" } },
    ],
  },
  {
    label: "II · Preparing for Battle",
    title: "Riders gather at dawn.",
    body: "Columns of cavalry move toward the hills.",
    pos: "top-right",
    tint: "rgba(240, 200, 140, 0.12)",
    layers: [
      { src: `${P}haldighati.webp`, alt: "", depth: 2, from: 0, plane: "back", d: { r: "-2%", b: "17%", w: "62%" }, m: { x: "-10%", b: "17%", w: "120%" }, opacity: 0.85 },
      { src: `${P}cavalry.webp`, alt: "A column of Mewar cavalry in procession across the hills", depth: 2, from: 1, fromY: 1, plane: "mid", d: { x: "4%", b: "8%", w: "86%" }, m: { x: "-8%", b: "8%", w: "124%" } },
    ],
  },
  {
    label: "III · Haldighati",
    title: "Haldighati. 1576.",
    body: "Mewar meets the Mughal army among the ochre hills.",
    pos: "top-left",
    tint: "rgba(204, 132, 64, 0.16)",
    layers: [
      { src: `${P}haldighati.webp`, alt: "", depth: 2, from: 0, plane: "back", d: { x: "34%", b: "17%", w: "66%" }, m: { x: "-10%", b: "17%", w: "120%" } },
      { src: `${P}melee.webp`, alt: "The battle line at Haldighati: cavalry and foot soldiers in dust, painted without close detail", depth: 2, from: 1, fromY: 1, plane: "mid", d: { x: "0%", b: "4%", w: "100%" }, m: { x: "-26%", b: "4%", w: "152%" } },
      { src: `${P}dust.webp`, alt: "", depth: 2, from: -1, plane: "mid", d: { x: "-6%", b: "10%", w: "44%" }, m: { x: "-10%", b: "8%", w: "70%" }, opacity: 0.45 },
    ],
  },
  {
    label: "III · Haldighati",
    title: "Into the line.",
    body: "Pratap and Chetak meet the Mughal commander in battle.",
    note: "Remembered in tradition and painting, not a documentary record.",
    pos: "top-right",
    tint: "rgba(190, 96, 48, 0.18)",
    layers: [
      { src: `${P}battle-army.webp`, alt: "Mewar horsemen, foot soldiers and two Mughal war elephants with golden canopies, in a painted battle column", depth: 2, from: 1, fromY: 1, plane: "mid", d: { x: "0%", b: "6%", w: "100%" }, m: { x: "-34%", b: "10%", w: "172%" } },
      { src: `${P}battle-duel-cutout.webp`, alt: "A painted battle scene showing Maharana Pratap on Chetak confronting a mounted opponent", depth: 3, from: -1, fromY: -1, d: { x: "4%", b: "4%", w: "50%" }, m: { x: "2%", b: "4%", w: "92%" } },
    ],
  },
  {
    label: "IV · Courage",
    title: "Together through the storm.",
    body: "Pratap and Chetak stay together through the battle.",
    pos: "top-right",
    tint: "rgba(10, 14, 40, 0.3)",
    layers: [
      { src: `${P}dust.webp`, alt: "", depth: 2, from: 1, plane: "mid", d: { r: "-4%", b: "8%", w: "54%" }, m: { r: "-12%", b: "8%", w: "80%" }, opacity: 0.4 },
      { src: `${P}charge.webp`, alt: "Maharana Pratap charges on Chetak, lance levelled, horse and rider as one silhouette", depth: 3, from: -1, d: { x: "4%", b: "5%", w: "56%" }, m: { x: "2%", b: "6%", w: "92%" } },
      { src: `${P}el-spears.webp`, alt: "", depth: 2, from: 1, plane: "front", d: { x: "30%", b: "0%", w: "72%" }, m: { x: "26%", b: "0%", w: "104%" }, opacity: 0.55 },
    ],
  },
  {
    label: "V · The Legendary Escape",
    title: "Still, Chetak carries on.",
    body: "Tradition says the wounded horse carried his rider out.",
    note: "Remembered in tradition, not undisputed history.",
    pos: "top-left",
    tint: "rgba(200, 150, 90, 0.12)",
    layers: [
      { src: `${P}dust.webp`, alt: "", depth: 2, from: -1, plane: "mid", d: { x: "30%", b: "8%", w: "46%" }, m: { x: "10%", b: "8%", w: "78%" }, opacity: 0.35 },
      { src: `${P}carry.webp`, alt: "Chetak walks on with his rider upright in the saddle, head lowered and steady", depth: 3, from: 1, fromY: 1, d: { r: "8%", b: "5%", w: "44%" }, m: { r: "6%", b: "5%", w: "66%" } },
    ],
  },
  {
    label: "V · The Legendary Escape",
    title: "Legend remembers one final leap.",
    body: "Chetak is said to leap a stream with Pratap on his back.",
    note: "A legend told across generations, not a recorded event.",
    pos: "top-right",
    tint: "rgba(40, 128, 136, 0.16)",
    layers: [
      { src: `${P}band-stream.webp`, alt: "A shallow stream crossing the ground, painted in swirling teal and cream", depth: 2, from: 0, fromY: 1, plane: "mid", d: { b: "-1%", w: "104%", x: "-2%" }, m: { x: "-12%", b: "-1%", w: "126%" } },
      { src: `${P}leap.webp`, alt: "Chetak leaps over a stream with Maharana Pratap low on his back, lance forward", depth: 3, from: -1, fromY: -1, d: { x: "6%", b: "16%", w: "56%" }, m: { x: "0%", b: "16%", w: "96%" } },
    ],
  },
  {
    label: "V · The Legendary Escape",
    title: "Chetak rests.",
    body: "Tradition says the wounded horse fell once his rider was safe, and Pratap stayed beside him.",
    note: "A legend told across generations, not a recorded event.",
    pos: "top-left",
    tint: "rgba(10, 14, 40, 0.34)",
    layers: [
      { src: `${P}dusk-hills.webp`, alt: "", depth: 2, from: 0, plane: "back", d: { b: "17%", w: "100%" }, m: { x: "-10%", b: "17%", w: "125%" }, opacity: 0.7 },
      { src: `${P}chetak-rest-cutout.webp`, alt: "Maharana Pratap kneels beside and holds the fallen Chetak", depth: 3, from: 1, fromY: 1, d: { r: "4%", b: "5%", w: "54%" }, m: { x: "2%", b: "5%", w: "94%" } },
    ],
  },
  {
    label: "VI · Remembrance",
    title: "A bond remembered.",
    body: "The battle fades. The legend lives on.",
    pos: "top-left",
    tint: "rgba(232, 120, 60, 0.18)",
    layers: [
      { src: `${P}el-birds.webp`, alt: "", depth: 2, from: -1, plane: "sky", d: { r: "10%", b: "60%", w: "28%" }, m: { r: "4%", b: "60%", w: "50%" } },
      { src: `${P}chhatri.webp`, alt: "A small memorial pavilion, with a stone horse memorial beside it", depth: 2, from: 1, fromY: -1, plane: "mid", d: { r: "10%", b: "9%", w: "32%" }, m: { r: "4%", b: "9%", w: "52%" } },
      { src: `${P}bond.webp`, alt: "Maharana Pratap and Chetak together, at rest", depth: 3, from: -1, d: { x: "10%", b: "5%", w: "32%" }, m: { x: "6%", b: "5%", w: "52%" } },
    ],
  },
];

export const SCENE_TOTAL = SCENES.length;
