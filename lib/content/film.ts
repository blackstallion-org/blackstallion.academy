/**
 * Copy and data for the one-page film (app/page.tsx).
 * Sources: docs/prd/web-portal-prd.md, docs/legal/cadet-creed.md, docs/design-brief.md,
 * and the Legend section of the plan doc (facts corrected there).
 * Anything marked SAMPLE is illustrative and must be replaced with real data.
 */

export type MediaKey =
  | "heroDust" | "rearing" | "gallop" | "eye" | "riderLance" | "duneSilhouette"
  | "bgFort" | "bgArena" | "bgStable" | "bgPavilion" | "bgPassport" | "bgCharge"
  | "dustPlume" | "dustWall";

/** Higgsfield placeholder stills. Drop the downloaded PNGs into public/media with these names. */
export const media: Record<MediaKey, { src: string; remote: string; alt: string }> = {
  heroDust: { src: "/media/hero-dust.png", remote: "https://d8j0ntlcm91z4.cloudfront.net/user_3KHOl32PLtCsaNMEkJTP0HHT06X/hf_20261009_002316_a9ac0234-9080-4a64-8d92-cf0705055f6b.png", alt: "A Marwari stallion emerging from a towering cloud of golden dust" },
  rearing: { src: "/media/rearing.png", remote: "https://d8j0ntlcm91z4.cloudfront.net/user_3KHOl32PLtCsaNMEkJTP0HHT06X/hf_20261009_002317_1504aa62-05a7-47df-9bf5-fbb2b0c78ecc.png", alt: "A Marwari stallion rearing against a molten gold sky" },
  gallop: { src: "/media/gallop.png", remote: "https://d8j0ntlcm91z4.cloudfront.net/user_3KHOl32PLtCsaNMEkJTP0HHT06X/hf_20261009_002435_48940254-f4cb-49fe-9236-d84b15570955.png", alt: "A Marwari stallion at full gallop across desert sand" },
  eye: { src: "/media/eye.png", remote: "https://d8j0ntlcm91z4.cloudfront.net/user_3KHOl32PLtCsaNMEkJTP0HHT06X/hf_20261009_002317_26761800-94f0-40d6-a6b2-a35941ddc7e0.png", alt: "Close-up of a Marwari's eye and inward-curving ear" },
  riderLance: { src: "/media/rider-lance.png", remote: "https://d8j0ntlcm91z4.cloudfront.net/user_3KHOl32PLtCsaNMEkJTP0HHT06X/hf_20261009_002435_480a7609-4bd8-46c6-83b4-8c740f8aaf4b.png", alt: "A young rider lowering a tent-pegging lance at a gallop at dusk" },
  duneSilhouette: { src: "/media/dune-silhouette.png", remote: "https://d8j0ntlcm91z4.cloudfront.net/user_3KHOl32PLtCsaNMEkJTP0HHT06X/hf_20261009_002317_0f749476-7e8d-47bf-b57a-9adcb7b21741.png", alt: "A lone Marwari silhouetted on a dune at dusk" },
  bgFort: { src: "/media/bg-fort.png", remote: "https://d8j0ntlcm91z4.cloudfront.net/user_3KHOl32PLtCsaNMEkJTP0HHT06X/hf_20261009_002435_531c9a37-9fa8-4152-ad47-e0d3d35105a4.png", alt: "Ruins of a sandstone Rajput fort above the Thar at dusk" },
  bgArena: { src: "/media/bg-arena.png", remote: "https://d8j0ntlcm91z4.cloudfront.net/user_3KHOl32PLtCsaNMEkJTP0HHT06X/hf_20261009_002435_e0aa5fef-e93d-4950-a155-e4c8a2883ae4.png", alt: "An empty riding arena at dusk with tent-pegging pegs and a lance" },
  bgStable: { src: "/media/bg-stable.png", remote: "https://d8j0ntlcm91z4.cloudfront.net/user_3KHOl32PLtCsaNMEkJTP0HHT06X/hf_20261009_002640_d9a4c4d4-d61a-4660-a63c-857a874f56aa.png", alt: "A lantern-lit stable corridor" },
  bgPavilion: { src: "/media/bg-pavilion.png", remote: "https://d8j0ntlcm91z4.cloudfront.net/user_3KHOl32PLtCsaNMEkJTP0HHT06X/hf_20261009_002640_8d4143ab-a4d7-479b-86d6-aaa3edfc9947.png", alt: "A sandstone pavilion beside a riding arena at dusk" },
  bgPassport: { src: "/media/bg-passport.png", remote: "https://d8j0ntlcm91z4.cloudfront.net/user_3KHOl32PLtCsaNMEkJTP0HHT06X/hf_20261009_002640_5e132524-4ec5-4185-8dc4-76b49caab8e4.png", alt: "A leather passport and a brass seal on dark wood" },
  bgCharge: { src: "/media/bg-charge.png", remote: "https://d8j0ntlcm91z4.cloudfront.net/user_3KHOl32PLtCsaNMEkJTP0HHT06X/hf_20261009_002640_5b5f28cc-654a-499d-8b0e-35093d96acb5.png", alt: "Three riders charging with lances lowered through dust" },
  dustPlume: { src: "/media/dust-plume.png", remote: "https://d8j0ntlcm91z4.cloudfront.net/user_3KHOl32PLtCsaNMEkJTP0HHT06X/hf_20261009_002905_56886768-0acc-459c-ae40-a8356254a871.png", alt: "" },
  dustWall: { src: "/media/dust-wall.png", remote: "https://d8j0ntlcm91z4.cloudfront.net/user_3KHOl32PLtCsaNMEkJTP0HHT06X/hf_20261009_002905_226a4699-2319-45c7-ac8d-3d48708a5a42.png", alt: "" },
};

export const heroVideo = "/media/hero-loop.mp4";
/** Higgsfield CDN copy, used when the local file hasn't been fetched yet. */
export const heroVideoRemote = "https://d8j0ntlcm91z4.cloudfront.net/user_3KHOl32PLtCsaNMEkJTP0HHT06X/hf_20261009_002919_571f23fa-14a9-4d0b-bbe3-19f4311054d8.mp4";

export const chapters = [
  { id: "prologue", numeral: "", label: "Prologue" },
  { id: "legend", numeral: "I", label: "The Legend" },
  { id: "crucible", numeral: "II", label: "The Crucible" },
  { id: "ranks", numeral: "III", label: "The Ranks" },
  { id: "fleet", numeral: "IV", label: "The Fleet" },
  { id: "campus", numeral: "V", label: "The Campus" },
  { id: "verify", numeral: "VI", label: "The Ledger" },
  { id: "tournaments", numeral: "VII", label: "The Circuit" },
  { id: "contact", numeral: "VIII", label: "The Gate" },
] as const;

export type ChapterId = (typeof chapters)[number]["id"];

/* ------------------------------------------------------------- Legend */
export const legendBeats = [
  {
    kicker: "Born of the churning ocean",
    title: ["Before history,", "a horse king."],
    body: "The Vedas tell of Uchchaihshravas, the seven-headed white horse who rose from the churning of the cosmic ocean. Every horse, the bards say, descends from him. The Marwari was the one they never stopped singing about.",
    media: "bgFort" as MediaKey,
  },
  {
    kicker: "Marwar, 1193",
    title: ["The land", "of death."],
    body: "Driven from Kannauj, the Rathore clan rode into the Thar. Their horses learned to live on a cup of water and cross sand that killed everything else. From the twelfth century the Rathores bred only the strongest, the bravest, and the ones whose ears curled inward until the tips touched.",
    media: "duneSilhouette" as MediaKey,
  },
  {
    kicker: "The vow",
    title: ["Victory.", "Death.", "Or carrying", "its wounded rider."],
    body: "A Marwari left the battlefield for only three reasons. The bards tell of Chetak at Haldighati in 1576, wounded, carrying Maharana Pratap clear of the field before he fell.",
    media: "rearing" as MediaKey,
  },
  {
    kicker: "Fall and revival",
    title: ["Nearly lost.", "Never forgotten."],
    body: "After Independence the royal stables emptied; horses were shot, sold as pack animals, or crossbred away. In 1999 the Indigenous Horse Society of India began bringing the bloodline back. A few thousand purebreds remain. Every BSAH cadet rides one.",
    media: "gallop" as MediaKey,
  },
];

/* ------------------------------------------------------------- Crucible */
export const hotspots = [
  {
    id: "ears",
    name: "The Ears",
    title: "180° acoustic sensitivity",
    layers: [
      ["Equine science", "Lyre ears rotate independently to read the rider's breathing and heartbeat."],
      ["Rider biomechanics", "Calm breath slows the horse; the rider learns to govern the body first."],
      ["Neuroscience", "Slow, rhythmic riding engages the parasympathetic system: calm under pressure."],
      ["Trait forged", "Emotional self-governance and composure."],
    ],
  },
  {
    id: "spine",
    name: "The Saddle",
    title: "Core and postural realignment",
    layers: [
      ["Equine science", "A walking horse moves the rider's pelvis in three dimensions, stride after stride."],
      ["Rider biomechanics", "Deep core and spine engage to stay upright: the opposite of tech-neck."],
      ["Neuroscience", "Constant balance work trains the vestibular system and spatial sense."],
      ["Trait forged", "Physical poise and unshakable balance."],
    ],
  },
  {
    id: "reins",
    name: "The Reins",
    title: "Ten grams of intent",
    layers: [
      ["Equine science", "A few grams of rein pressure tells a 500 kg animal where to go."],
      ["Rider biomechanics", "Hands, legs and seat must agree: left and right working as one."],
      ["Neuroscience", "Coordinating timing, pressure and space trains split-second decisions."],
      ["Trait forged", "Clear communication, diplomacy, decisiveness."],
    ],
  },
];

/* ------------------------------------------------------------- Ranks */
export const ranks = [
  { numeral: "I", name: "Cadet Squire", skills: "Handling, balance, walk-to-trot transitions, equine anatomy." },
  { numeral: "II", name: "Cadet Rider", skills: "Independent canter, obstacle navigation, vagal-tone control." },
  { numeral: "III", name: "Cadet Knight", skills: "Dressage, vaulting, formation riding." },
  { numeral: "IV", name: "Sovereign Lancer", skills: "Target piercing at speed. The STPCI national circuit." },
];

export const assessment = ["Riding", "Ground", "Stable"];

export const creed = [
  "I do not ride to conquer the horse; I command to master myself.",
  "My posture reflects my internal state: unshakable, calm, and erect.",
  "Excuses vanish in the arena. Fall nine times, mount the tenth.",
];

/* ------------------------------------------------------------- Fleet (SAMPLE) */
export const fleet = [
  { name: "Chetak", breed: "Marwari", chip: "356 098 100 482 117", hands: "15.2", temper: "Bold" },
  { name: "Vangalia", breed: "Marwari", chip: "356 098 100 482 203", hands: "15.3", temper: "Proud" },
  { name: "Kesar Kalmi", breed: "Marwari", chip: "356 098 100 482 318", hands: "15.1", temper: "Steady" },
  { name: "Arbudh", breed: "Kathiawari", chip: "356 098 100 482 441", hands: "14.3", temper: "Quick" },
  { name: "Bahadur", breed: "Marwari", chip: "356 098 100 482 509", hands: "15.2", temper: "Fearless" },
];

/* ------------------------------------------------------------- Campus */
export const tiers = [
  { id: "standard", name: "Standard Hub", capexLakh: 8.2, label: "₹8.20 L", includes: "Professional arena, fencing, stables, tack room." },
  { id: "signature", name: "Signature", capexLakh: 15, label: "₹15.00 L", includes: "Adds concrete breeze-block walls and dusk lighting." },
  { id: "royal", name: "Royal Pavilion", capexLakh: 25, label: "₹25.00 L+", includes: "Full heritage stone pavilion and an air-conditioned lounge." },
] as const;

export const TUITION_PER_MONTH = 8000; // ₹, before GST

/* ------------------------------------------------------------- Verify (SAMPLE) */
export const sampleCredential = {
  code: "BSAH-2026-HYD-042",
  name: "Cadet Z. Khan",
  rank: "Cadet Knight",
  hub: "DPS Hyderabad Hub",
  hours: 48,
  efi: "EFI-JR-99823",
};

/* ------------------------------------------------------------- Tournaments (SAMPLE) */
export const standings = [
  { school: "Hyderabad Hub", points: 412 },
  { school: "Vijayawada Hub", points: 388 },
  { school: "Secunderabad Hub", points: 351 },
  { school: "Warangal Hub", points: 297 },
];

export const fixtures = [
  { date: "2026-11-14", name: "The Sovereign Governor's Cup", place: "Hyderabad" },
  { date: "2027-01-23", name: "Junior National Equestrian Championship", place: "To be announced" },
];

/* ------------------------------------------------------------- Contact */
export const corridors = [
  { id: "schools", title: "School boards", line: "Book a campus feasibility audit and a 15-minute executive briefing.", cta: "Request a briefing" },
  { id: "parents", title: "Parents", line: "Enrolment, uniform sizing and Sovereign Passport support.", cta: "Ask about enrolment" },
  { id: "partners", title: "Sports directors", line: "PT teachers, sports heads and regional partners.", cta: "Become a partner" },
];
