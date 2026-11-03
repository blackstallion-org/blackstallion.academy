/**
 * The nine scenes of the Maharana Pratap and Chetak story. The painting carries the story: copy is one title and
 * one or two short lines per scene. Positions are percentages of the stage, given for desktop (`d`) and for a phone
 * (`m`, falling back to `d`). `from` is the side a layer enters from: -1 left, 1 right, 0 fades in place.
 * `depth` sets how far a layer moves: 1 is far (moves least), 3 is near (moves most).
 */

export type Box = { x?: string; r?: string; b: string; w: string };

export type LayerSpec = {
  src: string;
  alt: string;
  depth: 1 | 2 | 3;
  from: -1 | 0 | 1;
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
  bg?: string;
  layers: LayerSpec[];
};

export const SKY = "/images/story/pratap/sky.webp";

export const SCENES: StoryScene[] = [
  {
    label: "The Bond",
    title: "Before the battle, there was a bond.",
    body: "Maharana Pratap and his horse Chetak, in the Aravalli hills of Mewar, trusting one another.",
    pos: "top-right",
    layers: [
      { src: "/images/story/pratap/aravalli.webp", alt: "", depth: 1, from: 0, d: { b: "34%", w: "100%" }, m: { x: "-15%", b: "40%", w: "130%" } },
      { src: "/images/story/pratap/bond.webp", alt: "Maharana Pratap stands beside his horse Chetak, one hand on the horse's neck", depth: 3, from: -1, d: { x: "10%", b: "0%", w: "38%" }, m: { x: "6%", b: "34%", w: "62%" } },
      { src: "/images/story/pratap/rocks.webp", alt: "", depth: 3, from: 0, d: { b: "-3%", w: "100%" }, m: { b: "-3%", w: "100%" } },
    ],
  },
  {
    label: "Mewar",
    title: "Hills that kept their own.",
    body: "Mewar's forts stood above its passes, watching the roads below.",
    pos: "top-left",
    layers: [
      { src: "/images/story/pratap/dusk-hills.webp", alt: "", depth: 1, from: 0, d: { b: "18%", w: "100%" }, m: { b: "22%", w: "120%" } },
      { src: "/images/story/pratap/fort.webp", alt: "A hill fort with ramparts, bastions and gateways on a ridge", depth: 2, from: 1, d: { r: "6%", b: "28%", w: "40%" }, m: { r: "-6%", b: "34%", w: "72%" } },
      { src: "/images/story/pratap/rocks.webp", alt: "", depth: 3, from: 0, d: { b: "-3%", w: "100%" }, m: { b: "-3%", w: "100%" } },
    ],
  },
  {
    label: "A Call to Courage",
    title: "Banners rise.",
    body: "Pratap prepares to ride, and Chetak is ready beside him.",
    pos: "top-left",
    layers: [
      { src: "/images/story/pratap/aravalli.webp", alt: "", depth: 1, from: 0, d: { b: "30%", w: "100%" }, m: { x: "-15%", b: "34%", w: "130%" } },
      { src: "/images/story/pratap/banners.webp", alt: "Three Mewar banners on tall poles, saffron and crimson with gold borders", depth: 2, from: -1, d: { x: "4%", b: "22%", w: "26%" }, m: { x: "0%", b: "30%", w: "40%" } },
      { src: "/images/story/pratap/mount.webp", alt: "Maharana Pratap mounts Chetak, a lance held upright", depth: 3, from: 1, d: { r: "6%", b: "0%", w: "42%" }, m: { r: "2%", b: "34%", w: "62%" } },
    ],
  },
  {
    label: "The March",
    title: "Riders gather at dawn.",
    body: "Columns of Mewar cavalry move toward the hills of Haldighati.",
    pos: "top-right",
    layers: [
      { src: "/images/story/pratap/haldighati.webp", alt: "", depth: 1, from: 0, d: { b: "30%", w: "100%" }, m: { b: "34%", w: "130%" } },
      { src: "/images/story/pratap/cavalry.webp", alt: "A column of Mewar cavalry in procession across the hills", depth: 2, from: 1, d: { x: "0%", b: "20%", w: "80%" }, m: { x: "-6%", b: "24%", w: "120%" } },
      { src: "/images/story/pratap/dust.webp", alt: "", depth: 2, from: 0, d: { b: "14%", w: "100%" }, m: { b: "14%", w: "120%" }, opacity: 0.6 },
    ],
  },
  {
    label: "Haldighati · 1576",
    title: "Haldighati. 1576.",
    body: "Mewar's army meets the forces of the Mughal emperor Akbar among the ochre hills.",
    pos: "top-left",
    layers: [
      { src: "/images/story/pratap/haldighati.webp", alt: "", depth: 1, from: 0, d: { b: "26%", w: "100%" }, m: { b: "30%", w: "130%" } },
      { src: "/images/story/pratap/melee.webp", alt: "The battle line at Haldighati: cavalry and foot soldiers in dust, painted without close detail", depth: 2, from: 1, d: { b: "6%", w: "100%" }, m: { x: "-25%", b: "14%", w: "150%" } },
      { src: "/images/story/pratap/dust.webp", alt: "", depth: 3, from: 0, d: { b: "24%", w: "100%" }, m: { b: "24%", w: "120%" }, opacity: 0.7 },
    ],
  },
  {
    label: "Together",
    title: "Together through the storm.",
    body: "Pratap and Chetak stay together while the battle moves around them.",
    pos: "top-right",
    layers: [
      { src: "/images/story/pratap/melee.webp", alt: "", depth: 1, from: 0, d: { b: "8%", w: "100%" }, m: { x: "-25%", b: "12%", w: "150%" }, opacity: 0.5 },
      { src: "/images/story/pratap/dust.webp", alt: "", depth: 2, from: 0, d: { b: "18%", w: "100%" }, m: { b: "18%", w: "120%" }, opacity: 0.6 },
      { src: "/images/story/pratap/charge.webp", alt: "Maharana Pratap charges on Chetak, lance levelled, horse and rider as one silhouette", depth: 3, from: -1, d: { x: "4%", b: "0%", w: "56%" }, m: { x: "4%", b: "34%", w: "72%" } },
    ],
  },
  {
    label: "The Carry",
    title: "Still, Chetak carries on.",
    body: "Tradition says the wounded horse carried his rider out of the battle.",
    note: "Remembered in tradition, not undisputed history.",
    pos: "top-left",
    layers: [
      { src: "/images/story/pratap/haldighati.webp", alt: "", depth: 1, from: 0, d: { b: "30%", w: "100%" }, m: { b: "34%", w: "130%" } },
      { src: "/images/story/pratap/dust.webp", alt: "", depth: 2, from: 0, d: { b: "18%", w: "100%" }, m: { b: "18%", w: "120%" }, opacity: 0.5 },
      { src: "/images/story/pratap/carry.webp", alt: "Chetak walks on with his rider upright in the saddle, head lowered and steady", depth: 3, from: 1, d: { r: "6%", b: "0%", w: "46%" }, m: { r: "4%", b: "34%", w: "64%" } },
    ],
  },
  {
    label: "The Leap",
    title: "Legend remembers one final leap.",
    body: "Chetak is said to leap a stream with Pratap on his back.",
    note: "A legend told across generations, not a recorded event.",
    pos: "top-right",
    layers: [
      { src: "/images/story/pratap/aravalli.webp", alt: "", depth: 1, from: 0, d: { b: "32%", w: "100%" }, m: { x: "-15%", b: "36%", w: "130%" } },
      { src: "/images/story/pratap/stream.webp", alt: "", depth: 2, from: 0, d: { b: "0%", w: "100%" }, m: { x: "-15%", b: "0%", w: "130%" } },
      { src: "/images/story/pratap/leap.webp", alt: "Chetak leaps over a stream with Maharana Pratap low on his back, lance forward", depth: 3, from: -1, d: { x: "6%", b: "14%", w: "56%" }, m: { x: "0%", b: "36%", w: "92%" } },
    ],
  },
  {
    label: "A Bond Remembered",
    title: "A bond remembered.",
    body: "The battle fades. The legend of Chetak lives on.",
    pos: "top-left",
    bg: "/images/story/pratap/sunset.webp",
    layers: [
      { src: "/images/story/pratap/dusk-hills.webp", alt: "", depth: 1, from: 0, d: { b: "20%", w: "100%" }, m: { b: "24%", w: "120%" } },
      { src: "/images/story/pratap/chhatri.webp", alt: "A small memorial pavilion, with a stone horse memorial beside it", depth: 2, from: 1, d: { r: "12%", b: "24%", w: "32%" }, m: { r: "6%", b: "36%", w: "46%" } },
      { src: "/images/story/pratap/bond.webp", alt: "Maharana Pratap and Chetak together, at rest", depth: 3, from: -1, d: { x: "8%", b: "0%", w: "30%" }, m: { x: "4%", b: "36%", w: "46%" } },
      { src: "/images/story/pratap/rocks.webp", alt: "", depth: 3, from: 0, d: { b: "-3%", w: "100%" }, m: { b: "-3%", w: "100%" } },
    ],
  },
];

export const SCENE_TOTAL = SCENES.length;
