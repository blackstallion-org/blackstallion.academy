import { asset } from "@/lib/content/asset";

/**
 * Reel 23, Alexander & Bucephalus: an exhibition in twelve rooms (12 Nov 2026; replaced the puppet-rig scroll story at the
 * owner's request, whose content stays in alexander.ts for the rig bench and the history scripts).
 *
 * Each room is one of the owner's mosaic-style animations (19 GIFs supplied; 12 used, see the selection notes below), turned
 * into a looping MP4 that keeps the GIF's own frame timing and colours. History follows the reel-23 scroll story
 * (lib/content/history/alexander.ts): Plutarch and Arrian, with the disagreements named. The mosaics are modern artworks.
 *
 * Selection (Downloads, 12 Nov 2026, 01:01–01:05):
 * - fe4a6221…(1).gif is a byte-identical copy of fe4a6221….gif.
 * - daa4e120 (close eye, brow line) repeats the eye opening used in room I.
 * - 3240f74b (boy turns to a rearing horse), eaf93a4b (calming a rearing horse in camp) and 579f948f (portrait of the boy)
 *   repeat the taming scenes kept in rooms II and III.
 * - ae403f58 (rider waves the army into a charge) repeats the cavalry charge kept in room VII.
 * - Animated Mosaic Market Exchange is off the thread of Alexander and his horse, and runs at a hurried 0.35 s a frame.
 */

export type RoomLayout = "opening" | "left" | "right" | "wide" | "quiet" | "coda";

export type Room = {
  id: string;
  numeral: string;
  place: string;
  title: string;
  text: string;
  /** A short line on what the sources do not settle, or where the picture is an interpretation. */
  note?: string;
  source: string;
  alt: string;
  layout: RoomLayout;
  video: string;
  videoSmall: string;
  poster: string;
};

const film = (slug: string) => ({
  video: asset(`/video/alexander/${slug}.mp4`),
  videoSmall: asset(`/video/alexander/${slug}-sm.mp4`),
  poster: asset(`/images/alexander/${slug}.webp`),
});

export const rooms: Room[] = [
  {
    id: "room-i",
    numeral: "I",
    place: "Pella, Macedon · 356 BC",
    title: "The boy who watched",
    text: "Alexander was born at Pella in 356 BC, son of King Philip II. The story that made his name begins not with a battle but with a look.",
    source: "Plutarch, Life of Alexander 2–3",
    alt: "Mosaic of a young man's face in profile; his closed eye slowly opens",
    layout: "opening",
    ...film("awakening"),
  },
  {
    id: "room-ii",
    numeral: "II",
    place: "Macedon · Alexander's boyhood",
    title: "A horse no one could ride",
    text: "A dealer from Thessaly offered Philip a great black horse for thirteen talents. It reared at every rider, and the king ordered it led away.",
    source: "Plutarch, Life of Alexander 6",
    alt: "Mosaic of grooms hauling on ropes as a black horse rears; a boy in a red cloak steps toward it",
    layout: "left",
    ...film("untamed"),
  },
  {
    id: "room-iii",
    numeral: "III",
    place: "Macedon · Alexander's boyhood",
    title: "He saw the shadow",
    text: "Alexander noticed what the grooms had missed: the horse was afraid of its own moving shadow. He took the bridle and spoke to it quietly.",
    source: "Plutarch, Life of Alexander 6",
    alt: "Mosaic of the young Alexander reaching up to stroke the muzzle of a black horse",
    layout: "right",
    ...film("calm"),
  },
  {
    id: "room-iv",
    numeral: "IV",
    place: "Macedon · Alexander's boyhood",
    title: "Turned toward the sun",
    text: "He turned the horse to face the sun, so its shadow fell behind it, and only then mounted. Find a kingdom equal to yourself, Philip told him; Macedon is too small.",
    note: "Plutarch's account. No earlier source for the shadow survives.",
    source: "Plutarch, Life of Alexander 6",
    alt: "Mosaic of Alexander walking up to a horse under a blazing sun, then mounting it",
    layout: "wide",
    ...film("sun"),
  },
  {
    id: "room-v",
    numeral: "V",
    place: "Pella, Macedon",
    title: "Ox-head",
    text: "His name, Bucephalus, means ox-head. Once he wore his royal trappings, the ancient writers say, he would carry no one but Alexander.",
    source: "Arrian, Anabasis 5.19",
    alt: "Mosaic of Alexander in armour resting his forehead against his horse's head",
    layout: "left",
    ...film("companions"),
  },
  {
    id: "room-vi",
    numeral: "VI",
    place: "Memphis, Egypt · 332–331 BC",
    title: "Received as pharaoh",
    text: "In 334 BC Alexander crossed into Asia. By 332 he had reached Egypt, which opened its gates to him; at Memphis he sacrificed to its gods.",
    note: "The crowning is told by later tradition; Arrian records only the sacrifice.",
    source: "Arrian, Anabasis 3.1",
    alt: "Mosaic of an elderly priest lowering a gold wreath onto the head of a kneeling Alexander",
    layout: "right",
    ...film("egypt"),
  },
  {
    id: "room-vii",
    numeral: "VII",
    place: "Gaugamela · 331 BC",
    title: "The charge",
    text: "Against Darius III, Alexander led his cavalry into a gap in the Persian line. Bucephalus, by then past his prime, was spared until the attack itself.",
    source: "Plutarch, Life of Alexander 32–33",
    alt: "Mosaic of Alexander galloping ahead of his cavalry under sunburst banners",
    layout: "wide",
    ...film("gaugamela"),
  },
  {
    id: "room-viii",
    numeral: "VIII",
    place: "Babylon · 331 BC",
    title: "Through the Ishtar Gate",
    text: "After the battle Babylon opened to him. Its people strewed the road with flowers and garlands as the army rode in.",
    source: "Curtius Rufus, Histories 5.1",
    alt: "Mosaic of Alexander riding past the blue Ishtar Gate as people throw rose petals",
    layout: "left",
    ...film("babylon"),
  },
  {
    id: "room-ix",
    numeral: "IX",
    place: "Bactria and Sogdiana · 329–327 BC",
    title: "Beyond the map",
    text: "Past Persia the army crossed the Hindu Kush into Bactria and Sogdiana, the far edge of the world the Greeks had heard of.",
    source: "Arrian, Anabasis 3.28–4.22",
    alt: "Mosaic of a lone rider crossing tall grass toward distant mountains at sunset",
    layout: "right",
    ...film("east"),
  },
  {
    id: "room-x",
    numeral: "X",
    place: "The Hydaspes · 326 BC",
    title: "Porus and the elephants",
    text: "At the river now called the Jhelum, in Punjab, King Porus waited with war elephants. Alexander crossed in a storm; Porus fought on after his army broke.",
    note: "Known only from Greek and Roman writers; no account from Porus's side survives.",
    source: "Arrian, Anabasis 5.8–19",
    alt: "Mosaic of Alexander charging on horseback toward war elephants carrying archers",
    layout: "wide",
    ...film("hydaspes"),
  },
  {
    id: "room-xi",
    numeral: "XI",
    place: "The Hydaspes · 326 BC",
    title: "The companion is gone",
    text: "Bucephalus died at the river, about thirty years old. Alexander grieved for him as for a friend.",
    note: "Arrian says of age and exhaustion; other writers say of wounds.",
    source: "Arrian, Anabasis 5.19; Plutarch 61",
    alt: "Mosaic of Alexander kneeling beside his fallen horse at sunset, his hand on its head",
    layout: "quiet",
    ...film("farewell"),
  },
  {
    id: "room-xii",
    numeral: "XII",
    place: "Bucephala · 326 BC",
    title: "A city named for a horse",
    text: "Beside the river Alexander founded a city and called it Bucephala. Its site is lost. The name outlived it.",
    note: "The statue is a modern tribute; no ancient likeness of Bucephalus survives.",
    source: "Arrian, Anabasis 5.19; Plutarch 61",
    alt: "Mosaic of a bronze statue of Alexander on a rearing horse above a city at sunset",
    layout: "coda",
    ...film("legacy"),
  },
];

export const exhibition = {
  route: "/story/alexander-bucephalus",
  title: "Alexander & Bucephalus · An Exhibition",
  description:
    "Twelve mosaic rooms on Alexander and his horse Bucephalus, from the boy who turned a frightened horse toward the sun to the city named for it on the Hydaspes, told from Plutarch and Arrian.",
  folio: "An exhibition in twelve rooms · Macedon to the Hydaspes, 356–326 BC",
  inscription: "Alexander & Bucephalus",
  voice: "the boy and the horse.",
  lede: "Twelve rooms of living mosaic. Walk through slowly.",
  colophon:
    "Told from Plutarch's Life of Alexander, Arrian's Anabasis and Curtius Rufus, all written centuries after the events; where they disagree, the rooms say so. The mosaics are modern animated artworks made for this exhibition, not ancient finds.",
};
