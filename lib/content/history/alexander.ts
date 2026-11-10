import { asset } from "@/lib/content/asset";
import type { HistoryPage, Placement, Scene } from "./types";

const away = (side: Scene["side"], w: string, b = "6%", m?: Placement): Scene["subject"] => ({
  d: side === "left" ? { r: "6%", b, w } : { x: "6%", b, w },
  m: m ?? { x: "8%", b: "8%", w: "84%" },
});

const L = (n: string) => ({ B: `AL${n}-B`, S: `AL${n}-S`, F: `AL${n}-F` });

const scenes: Scene[] = [
  {
    id: "AL01",
    anchor: "a-horse-nobody-could-settle",
    label: "Macedon, Alexander's boyhood",
    title: "A horse nobody could settle",
    body: [
      "Plutarch tells that a horse dealer from Thessaly brought a large black horse to King Philip II of Macedon, asking a very high price. The horse reared and would let no one mount. Philip ordered it led away. His young son Alexander said they were losing a fine horse through clumsiness.",
    ],
    qualification: "Told by Plutarch, writing about four hundred years later. He gives the price as thirteen talents.",
    sources: [{ label: "Plutarch, Life of Alexander 6" }],
    layers: L("01"),
    side: "left",
    subject: away("left", "36%"),
  },
  {
    id: "AL02",
    anchor: "turning-toward-the-sun",
    label: "Macedon, Alexander's boyhood",
    title: "Turning toward the sun",
    body: [
      "Alexander, Plutarch writes, had noticed that the horse was frightened by its own moving shadow. He took the bridle and turned the horse to face the sun, so the shadow fell behind it. He spoke to it quietly, waited until it calmed, and only then mounted. The horse was Bucephalus.",
    ],
    qualification: "Plutarch's account. No earlier source for the shadow episode survives.",
    sources: [{ label: "Plutarch, Life of Alexander 6" }],
    layers: L("02"),
    side: "right",
    subject: away("right", "38%"),
  },
  {
    id: "AL03",
    anchor: "trust-takes-time",
    label: "Pella, Macedon",
    title: "Trust takes time",
    body: [
      "His name means 'ox-head', perhaps from a brand or the broad shape of his head. Ancient writers say that once Bucephalus wore his royal trappings he would accept no rider but Alexander. A partnership like that is built in ordinary days of handling, feeding and riding, long before any battle.",
    ],
    interpretation: true,
    qualification: "The everyday scene is an artistic interpretation; the explanations of his name come from Arrian and others.",
    sources: [{ label: "Arrian, Anabasis 5.19" }, { label: "Plutarch, Life of Alexander 6, 32" }],
    layers: L("03"),
    side: "left",
    subject: away("left", "34%"),
  },
  {
    id: "AL04",
    anchor: "across-the-sea-along-the-roads",
    label: "The Hellespont, 334 BC",
    title: "Across the sea, along the roads",
    body: [
      "In 334 BC Alexander, now king, crossed the Hellespont into Asia. Over the next eight years his army marched through Anatolia, the Levant, Egypt, Mesopotamia and Persia. Ancient writers say Bucephalus carried him in his greatest battles, though by then other horses did the daily work of the march.",
    ],
    qualification: "The route on the map is simplified from the main stages recorded by Arrian.",
    sources: [{ label: "Arrian, Anabasis 1–3" }, { label: "Robin Lane Fox, Alexander the Great (1973)" }],
    layers: L("04"),
    side: "right",
    subject: away("right", "30%", "6%", { r: "4%", b: "4%", w: "40%" }),
    relief: "AL04",
  },
  {
    id: "AL05",
    anchor: "beyond-familiar-country",
    label: "The Hindu Kush, 329–327 BC",
    title: "Beyond familiar country",
    body: [
      "Beyond Persia the army crossed the Hindu Kush into Bactria and Sogdiana. Somewhere on these marches, the ancient accounts say, Bucephalus was seized by local people. Alexander threatened their whole land unless the horse came back. It was returned, and he treated the people well.",
    ],
    qualification: "Plutarch and Arrian name different peoples and places for the theft.",
    sources: [{ label: "Plutarch, Life of Alexander 44" }, { label: "Arrian, Anabasis 5.19" }],
    layers: L("05"),
    side: "left",
    subject: away("left", "40%"),
  },
  {
    id: "AL06",
    anchor: "at-the-hydaspes",
    label: "The Hydaspes, 326 BC",
    title: "At the Hydaspes",
    body: [
      "In 326 BC Alexander reached the Hydaspes, the river now called the Jhelum, in Punjab. On the far bank stood King Porus, who ruled the lands beyond, with cavalry, infantry and war elephants. Alexander crossed in a storm. Porus fought on after his army broke, and Alexander later restored him as king.",
    ],
    qualification: "Known through Greek and Roman writers; no account from Porus's side survives.",
    sources: [{ label: "Arrian, Anabasis 5.8–19" }, { label: "Plutarch, Life of Alexander 60" }],
    layers: L("06"),
    side: "right",
    subject: away("right", "44%", "4%"),
  },
  {
    id: "AL07",
    anchor: "the-companion-is-gone",
    label: "The Hydaspes, 326 BC",
    title: "The companion is gone",
    body: [
      "Bucephalus died at the Hydaspes. Arrian writes that he was not wounded but died of age and exhaustion, at about thirty. Other writers said he died of wounds from the battle. All agree that Alexander grieved for him as for a friend.",
    ],
    qualification: "Competing ancient accounts: Arrian and Onesicritus give old age; others give wounds.",
    sources: [{ label: "Arrian, Anabasis 5.19" }, { label: "Plutarch, Life of Alexander 61" }],
    layers: L("07"),
    side: "left",
    subject: away("left", "40%"),
  },
  {
    id: "AL08",
    anchor: "a-name-remembered",
    label: "Bucephala, 326 BC",
    title: "A name remembered",
    body: [
      "Near the river Alexander founded a city and named it Bucephala, after the horse. Its exact site has never been found, though it lay somewhere near the modern town of Jhelum, in Pakistan. The name outlived the city, carried by historians, painters and storytellers for more than two thousand years.",
    ],
    qualification: "The location of Bucephala is unknown; several sites have been proposed.",
    sources: [{ label: "Arrian, Anabasis 5.19" }, { label: "Plutarch, Life of Alexander 61" }],
    layers: L("08"),
    side: "right",
    subject: away("right", "34%"),
  },
];

export const alexander: HistoryPage = {
  route: "/story/alexander-bucephalus",
  format: "personal",
  title: "Alexander and Bucephalus · A Scroll Story",
  description:
    "Eight painted scenes of Alexander and his horse Bucephalus: the horse nobody could settle, the turn toward the sun, the long march east, the Hydaspes and Porus, and the city named after a horse, told from Plutarch and Arrian.",
  opening: {
    label: "A scroll story · Macedon to the Hydaspes, c. 344–326 BC",
    inscription: "Alexander and Bucephalus",
    voice: "a horse nobody could settle.",
    lede: "The best-known horse of the ancient world, as the ancient writers told it. Scroll to unroll the painting, or read the story straight through.",
  },
  chapters: [
    { id: "chapter-the-horse", numeral: "I", title: "The horse", scenes: scenes.slice(0, 2) },
    { id: "chapter-the-partnership", numeral: "II", title: "The partnership", scenes: scenes.slice(2, 4) },
    { id: "chapter-far-country", numeral: "III", title: "Far country", scenes: scenes.slice(4, 6) },
    { id: "chapter-remembrance", numeral: "IV", title: "Remembrance", scenes: scenes.slice(6, 8) },
  ],
  statue: {
    src: asset("/images/story/alexander/statue.webp"),
    width: 960,
    height: 1280,
    alt: "The bronze equestrian statue of Alexander the Great on a rearing Bucephalus, sword in hand, on the seafront at Thessaloniki",
    caption: "Alexander on Bucephalus, in bronze, at Thessaloniki.",
    credit: "Photograph: Yair Haklai, CC BY-SA 4.0, via Wikimedia Commons",
    creditHref: "https://commons.wikimedia.org/wiki/File:Equestrian_statue_of_Alexander_the_Great,_Thessaloniki.jpg",
  },
  afterword: {
    label: "Afterword",
    inscription: "How we know",
    voice: "what we know.",
    paragraphs: [
      "Nothing written by Alexander's own companions survives complete. What we have are later histories that used those lost works: Arrian's Anabasis, written in the second century AD from the memoirs of Ptolemy and Aristobulus, and Plutarch's Life of Alexander, written around the same time. Both lived roughly four centuries after the events.",
      "The taming scene, with the horse afraid of its shadow, comes from Plutarch. It is a story about attention: Alexander succeeds not by force but by noticing what the horse fears. Whether it happened exactly so, no one can now say, and this scroll attributes it to Plutarch rather than presenting it as fact.",
      "Porus is often reduced to the king Alexander defeated. The Greek writers themselves describe him as tall, brave and dignified in defeat, and say Alexander returned his kingdom to him and enlarged it. His own people's account of the battle has not survived, which is a reminder of whose stories the record keeps.",
      "The ancient writers disagree about how Bucephalus died, and about where the city named for him stood. We give both accounts. For BSAH cadets the lesson is the first scene: a frightened horse, a rider who looks before acting, and trust that has to be earned.",
    ],
  },
  related: [
    { href: "/story/rani-lakshmibai", label: "Rani Lakshmibai", blurb: "The queen who would not give up Jhansi." },
    { href: "/story/pratap-chetak", label: "Pratap & Chetak", blurb: "Six painted chapters from Mewar, 1576." },
    { href: "/history/world", label: "Seven roads of the world's horse", blurb: "From Xenophon to the veterinary lines of 1914–18." },
  ],
};
