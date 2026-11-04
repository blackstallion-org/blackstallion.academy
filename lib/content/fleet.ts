import type { MediaKey } from "./media";

/** Reel 06 · The Studbook. SAMPLE profiles from the client's fleet schema (Blueprint R06). */

export type HubSlug = "zone-01a-financial-district" | "zone-01c-gachibowli" | "zone-01b-begumpet";
export type StallStatus = "rest" | "arena" | "feed";

export type Stallion = {
  id: string;
  name: string;
  breed: "Purebred Marwari" | "Marwari" | "Kathiawari cavalry line";
  family: "Marwari" | "Kathiawari";
  chip: string;
  hub: HubSlug;
  character: string;
  quote: string;
  specialty: string;
  age: number;
  hands: string;
  coat: string;
  status: StallStatus;
  image: MediaKey;
  pedigree: { sire: string; dam: string; grandsire: string; granddam: string };
};

export const statusLabel: Record<StallStatus, string> = { rest: "Rest", arena: "Arena session", feed: "Night feed" };

export const fleet: Stallion[] = [
  {
    id: "chetak-ix", name: "Chetak IX", breed: "Purebred Marwari", family: "Marwari", chip: "356 098 112 004 912", hub: "zone-01a-financial-district",
    character: "The Calm Sovereign", quote: "A fortress of composure. Chetak grounds anxious first-time cadets.",
    specialty: "Breath calibration & beginner canter", age: 7, hands: "15.2", coat: "Dark bay, white blaze", status: "rest", image: "fleetChetak",
    pedigree: { sire: "Chetak VIII", dam: "Rani of Badgaon", grandsire: "Vangalia line", granddam: "Kesari" },
  },
  {
    id: "veer", name: "Veer", breed: "Kathiawari cavalry line", family: "Kathiawari", chip: "356 098 112 004 988", hub: "zone-01c-gachibowli",
    character: "The High-Velocity Lancer", quote: "Relentless focus under momentum. Veer answers ten grams of rein.",
    specialty: "Tent pegging & lance precision", age: 6, hands: "15.0", coat: "Chestnut gold", status: "arena", image: "fleetVeer",
    pedigree: { sire: "Toofan of Gondal", dam: "Moti", grandsire: "Sultan", granddam: "Heera" },
  },
  {
    id: "zilzal", name: "Zilzal", breed: "Purebred Marwari", family: "Marwari", chip: "356 098 112 005 011", hub: "zone-01b-begumpet",
    character: "The Stoic Leader", quote: "Commanding presence, unshakable patience. Notices a rider's nerves instantly.",
    specialty: "Formation drills & vaulting", age: 8, hands: "15.3", coat: "Jet black", status: "rest", image: "legendBlack",
    pedigree: { sire: "Shyam", dam: "Raat Rani", grandsire: "Kala Bhairav", granddam: "Chandni" },
  },
  {
    id: "tofan", name: "Tofan", breed: "Purebred Marwari", family: "Marwari", chip: "356 098 112 004 991", hub: "zone-01a-financial-district",
    character: "The Sensitive One", quote: "High sensitivity. Demands absolute rider composure.",
    specialty: "Advanced lancer speed targets", age: 9, hands: "15.1", coat: "Dappled grey", status: "feed", image: "legendGrey",
    pedigree: { sire: "Megh", dam: "Dhoop", grandsire: "Indra", granddam: "Saanjh" },
  },
  {
    id: "kesar", name: "Kesar", breed: "Marwari", family: "Marwari", chip: "356 098 112 005 027", hub: "zone-01c-gachibowli",
    character: "The Showman", quote: "Steps lightly and loves an audience.",
    specialty: "Mounted archery", age: 8, hands: "14.3", coat: "Skewbald", status: "rest", image: "fleetKesar",
    pedigree: { sire: "Rangeela", dam: "Kesar Kali", grandsire: "Nachan", granddam: "Pari" },
  },
  {
    id: "arbudh", name: "Arbudh", breed: "Marwari", family: "Marwari", chip: "356 098 112 005 034", hub: "zone-01b-begumpet",
    character: "The Endurance Horse", quote: "Never the fastest. Never the first to tire.",
    specialty: "Distance & terrain transitions", age: 10, hands: "15.0", coat: "Light bay, four white socks", status: "arena", image: "fleetArbudh",
    pedigree: { sire: "Durga", dam: "Thar Rani", grandsire: "Abu", granddam: "Retila" },
  },
];

export const FLEET_TOTAL = 21;

/** Traditional Marwar colour names (Master Refinement §5). Not an official registry: white horses cannot be registered as Marwari (checked 4 Nov 2026, docs/audits/PRELAUNCH-FACT-CHECK.md). */
export const coatRegistry = [
  { n: "01", name: "Bhanwar / Telia Kumat", coat: "Dark bay", hex: "#2a1d15", line: "Deep mahogany body, dark points. Grounded endurance." },
  { n: "02", name: "Kala", coat: "Black", hex: "#0f0e0d", line: "Rare obsidian sheen. The sovereign vow of loyalty." },
  { n: "03", name: "Surang / Kumat", coat: "Chestnut & bay", hex: "#593822", line: "Rich copper-brown to the golden-red tones of a Thar sunset." },
  { n: "04", name: "Shwet / Kagra", coat: "Grey & dappled", hex: "#8c8882", line: "Silver and iron tones maturing into a silver-white coat." },
  { n: "05", name: "Nukra", coat: "Pure white", hex: "#d9d5cd", line: "Pure white, kept in ceremony. White horses cannot be registered as Marwari." },
  { n: "06", name: "Ablak", coat: "Piebald / skewbald", hex: "dual", line: "Striking two-tone contrast patterns of individuality." },
];

export const feeds = [
  { cam: "CAM 01", horse: "Chetak IX", place: "Stall 3", status: "REST" },
  { cam: "CAM 02", horse: "Veer", place: "Arena", status: "SESSION" },
  { cam: "CAM 03", horse: "Zilzal", place: "Stall 7", status: "REST" },
  { cam: "CAM 04", horse: "Tofan", place: "Stall 1", status: "NIGHT FEED" },
];

/** SAMPLE stable log. */
export const careLog = [
  { time: "05:30", item: "Water check", detail: "All stalls", result: "OK" },
  { time: "06:00", item: "Feed", detail: "Oats, lucerne, salt", result: "Logged" },
  { time: "06:20", item: "Hoof inspection", detail: "21 of 21", result: "Tofan front-left stone bruise · rested" },
  { time: "09:00", item: "Vet round", detail: "Temperatures, eyes, gait", result: "Clear" },
  { time: "14:00", item: "Hydration log", detail: "Afternoon heat protocol", result: "Logged" },
  { time: "15:30", item: "Tack check", detail: "Before sessions", result: "OK" },
  { time: "18:30", item: "Cool-down", detail: "Walk out, rugs on", result: "Done" },
  { time: "21:00", item: "Night feed", detail: "On camera", result: "Live" },
];

/** The eight foundation bloodlines, as a plain index on /fleet (it replaced the bento studbook, 30 Oct 2026). Names and coats only. */
export const bloodlines = [
  { name: "Chetak IX", breed: "Purebred Marwari", coat: "Dark bay, blaze", trait: "The calm sovereign" },
  { name: "Veer", breed: "Kathiawari cavalry line", coat: "Chestnut gold", trait: "The lancer" },
  { name: "Kesar", breed: "Marwari ablak", coat: "Skewbald", trait: "The mounted archer" },
  { name: "Arbudh", breed: "Marwari endurance line", coat: "Light bay, four socks", trait: "The desert pillar" },
  { name: "Zilzal", breed: "Purebred Marwari", coat: "Black", trait: "The stoic leader" },
  { name: "Tofan", breed: "Purebred Marwari", coat: "Dappled grey", trait: "The tempest" },
  { name: "Bahadur", breed: "Purebred Marwari", coat: "Mahogany bay", trait: "The ridge sentinel" },
  { name: "Kala Bhairav", breed: "Purebred Marwari", coat: "Midnight black", trait: "The sovereign knight" },
] as const;

/**
 * R32 (2 Nov 2026): the opening of /fleet puts the academy's one rigged Marwari into three places it belongs, chosen with buttons.
 * Each world is a photographic plate (Higgsfield stills, `fleetWorld*` in media.ts) with the same 3D horse standing in front, lit to
 * match, and its own location sound (public/audio/LICENSES.md, "Location ambience"). `sound` says what the visitor will hear.
 */
export type FleetWorldId = "cavalry" | "village" | "field";
export const fleetWorlds: { id: FleetWorldId; label: string; title: string; line: string; image: MediaKey; sound: string }[] = [
  { id: "cavalry", label: "Cavalry", title: "Under the fort.", line: "A column of Marwar horsemen rides out below the hill fort at sunset: the work the breed was bred for, seen from a distance.", image: "fleetWorldCavalry", sound: "Desert wind, a distant drum, horses passing" },
  { id: "village", label: "Village", title: "In the lane.", line: "Water carried home, goats driven out, an elder on his charpai. In Marwar the horse has always been part of the day.", image: "fleetWorldVillage", sound: "A village afternoon, herders whistling" },
  { id: "field", label: "Field", title: "At the rack.", line: "Hay at the rack under the neem, and a tent-pegging lane marked out beyond the shamiana: where the horses spend their day.", image: "fleetWorldField", sound: "A horse eating, a far-off cheer" },
];
