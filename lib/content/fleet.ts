import type { MediaKey } from "./media";

/** Reel 06 · The Studbook. SAMPLE profiles from the client's fleet schema (Blueprint R06). */

export type HubSlug = "dps-hyderabad" | "oakridge-gachibowli" | "hyderabad-public-school";
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
    id: "chetak-ix", name: "Chetak IX", breed: "Purebred Marwari", family: "Marwari", chip: "356 098 112 004 912", hub: "dps-hyderabad",
    character: "The Calm Sovereign", quote: "A fortress of composure. Chetak grounds anxious first-time cadets.",
    specialty: "Breath calibration & beginner canter", age: 7, hands: "15.2", coat: "Dark bay, white blaze", status: "rest", image: "fleetChetak",
    pedigree: { sire: "Chetak VIII", dam: "Rani of Badgaon", grandsire: "Vangalia line", granddam: "Kesari" },
  },
  {
    id: "veer", name: "Veer", breed: "Kathiawari cavalry line", family: "Kathiawari", chip: "356 098 112 004 988", hub: "oakridge-gachibowli",
    character: "The High-Velocity Lancer", quote: "Relentless focus under momentum. Veer answers ten grams of rein.",
    specialty: "Tent pegging & lance precision", age: 6, hands: "15.0", coat: "Chestnut gold", status: "arena", image: "fleetVeer",
    pedigree: { sire: "Toofan of Gondal", dam: "Moti", grandsire: "Sultan", granddam: "Heera" },
  },
  {
    id: "zilzal", name: "Zilzal", breed: "Purebred Marwari", family: "Marwari", chip: "356 098 112 005 011", hub: "hyderabad-public-school",
    character: "The Stoic Leader", quote: "Commanding presence, unshakable patience. Notices a rider's nerves instantly.",
    specialty: "Formation drills & vaulting", age: 8, hands: "15.3", coat: "Jet black", status: "rest", image: "legendBlack",
    pedigree: { sire: "Shyam", dam: "Raat Rani", grandsire: "Kala Bhairav", granddam: "Chandni" },
  },
  {
    id: "tofan", name: "Tofan", breed: "Purebred Marwari", family: "Marwari", chip: "356 098 112 004 991", hub: "dps-hyderabad",
    character: "The Sensitive One", quote: "High sensitivity. Demands absolute rider composure.",
    specialty: "Advanced lancer speed targets", age: 9, hands: "15.1", coat: "Dappled grey", status: "feed", image: "legendGrey",
    pedigree: { sire: "Megh", dam: "Dhoop", grandsire: "Indra", granddam: "Saanjh" },
  },
  {
    id: "kesar", name: "Kesar", breed: "Marwari", family: "Marwari", chip: "356 098 112 005 027", hub: "oakridge-gachibowli",
    character: "The Showman", quote: "Steps lightly and loves an audience.",
    specialty: "Mounted archery", age: 8, hands: "14.3", coat: "Skewbald", status: "rest", image: "fleetKesar",
    pedigree: { sire: "Rangeela", dam: "Kesar Kali", grandsire: "Nachan", granddam: "Pari" },
  },
  {
    id: "arbudh", name: "Arbudh", breed: "Marwari", family: "Marwari", chip: "356 098 112 005 034", hub: "hyderabad-public-school",
    character: "The Endurance Horse", quote: "Never the fastest. Never the first to tire.",
    specialty: "Distance & terrain transitions", age: 10, hands: "15.0", coat: "Light bay, four white socks", status: "arena", image: "fleetArbudh",
    pedigree: { sire: "Durga", dam: "Thar Rani", grandsire: "Abu", granddam: "Retila" },
  },
];

export const FLEET_TOTAL = 21;

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
