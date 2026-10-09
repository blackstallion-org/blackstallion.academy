import type { HubSlug } from "./fleet";
import type { MediaKey } from "./media";

/** Reel 10 · The Citadel (school boards). Blueprint R10. */

export type TierId = "standard" | "signature" | "royal";

export type Tier = {
  id: TierId;
  name: string;
  stables: number;
  acres: string;
  cadets: string;
  capexLakh: number;
  capexLabel: string;
  includes: string[];
};

export const tiers: Tier[] = [
  { id: "standard", name: "Standard Hub", stables: 4, acres: "0.5 acre", cadets: "100–150", capexLakh: 8.2, capexLabel: "₹8.20 L", includes: ["4 stables", "Sand arena", "Fencing", "Tack room"] },
  { id: "signature", name: "Signature Hub", stables: 8, acres: "1 acre", cadets: "200–300", capexLakh: 15, capexLabel: "₹15.00 L", includes: ["8 stables", "Full arena", "AC lounge", "Floodlights"] },
  { id: "royal", name: "Royal Pavilion", stables: 12, acres: "1.5+ acres", cadets: "300+", capexLakh: 25, capexLabel: "₹25.00 L+", includes: ["12 stables", "Cavalry arena", "VIP deck", "STPCI host venue"] },
];

export const TUITION_PER_MONTH = 8000; // ₹ per cadet, before GST

/** Blueprint R10 §3. Payback at full enrolment; the footnote on the page explains the ramp. */
export function simulate(cadets: number, sharePct: number, capexLakh: number) {
  const annualTuition = cadets * TUITION_PER_MONTH * 12;
  const schoolYear = annualTuition * (sharePct / 100);
  const schoolMonth = schoolYear / 12;
  const paybackMonths = schoolMonth > 0 ? (capexLakh * 100000) / schoolMonth : 0;
  return { annualTuition, schoolYear, schoolMonth, paybackMonths };
}

/** ₹1,44,00,000 → "₹1.44 Cr"; ₹36,00,000 → "₹36.0 L" */
export function formatINR(n: number) {
  if (n >= 1e7) return `₹${(n / 1e7).toFixed(2)} Cr`;
  if (n >= 1e5) return `₹${(n / 1e5).toFixed(1)} L`;
  return `₹${new Intl.NumberFormat("en-IN").format(Math.round(n))}`;
}

export const model = [
  { n: "01", title: "The school funds the arena", line: "Construction is a campus asset that stays yours." },
  { n: "02", title: "BSAH designs, builds and operates", line: "Horses, faculty, vets, insurance, admissions and billing are ours." },
  { n: "03", title: "The school earns 25–30%", line: "Of gross tuition, every month, as enrolment grows." },
];

export const seals = [
  { title: "STPCI hosting rights", line: "Your arena on the national circuit." },
  { title: "EFI junior pathway", line: "Cadets registered with the federation." },
  { title: "Press & national coverage", line: "Tournament days bring the cameras." },
  { title: "Governor's Cup venue", line: "Royal Pavilion hubs host the finals." },
];

export type Hub = {
  slug: HubSlug;
  name: string;
  short: string;
  area: string;
  tier: TierId;
  stallions: number;
  cadets: number;
  image: MediaKey;
  note: string;
  /** Map position in % of the Hyderabad sketch map. */
  pin: { x: number; y: number };
  batches: { name: string; time: string; days: string }[];
};

/** Names from the client docs (confirm partnerships before launch). Numbers are SAMPLE. */
export const hubs: Hub[] = [
  {
    slug: "dps-hyderabad", name: "DPS Hyderabad Campus Hub", short: "DPS Hyderabad", area: "Hyderabad", tier: "signature",
    stallions: 8, cadets: 150, image: "schoolAerial", note: "Circuit leader and host of the 2026 Sovereign Governor's Cup.",
    pin: { x: 58, y: 66 },
    batches: [
      { name: "Dawn", time: "06:00–06:45", days: "Mon · Wed · Fri" },
      { name: "After school", time: "16:00–16:45", days: "Tue · Thu" },
      { name: "Weekend", time: "07:00–07:45", days: "Sat · Sun" },
    ],
  },
  {
    slug: "oakridge-gachibowli", name: "Oakridge International Hub", short: "Oakridge, Gachibowli", area: "Gachibowli", tier: "standard",
    stallions: 4, cadets: 96, image: "schoolArenaNight", note: "Floodlit evening batches under the arena lights.",
    pin: { x: 30, y: 44 },
    batches: [
      { name: "After school", time: "16:30–17:15", days: "Mon · Wed · Fri" },
      { name: "Evening", time: "18:00–18:45", days: "Tue · Thu" },
    ],
  },
  {
    slug: "hyderabad-public-school", name: "The Hyderabad Public School Hub", short: "HPS, Begumpet", area: "Begumpet", tier: "royal",
    stallions: 12, cadets: 210, image: "bgPavilion", note: "Heritage pavilion and host of the Junior Lancers Invitational.",
    pin: { x: 54, y: 32 },
    batches: [
      { name: "Dawn", time: "06:00–06:45", days: "Daily" },
      { name: "After school", time: "16:00–16:45", days: "Mon–Fri" },
      { name: "Lancer squad", time: "15:00–17:00", days: "Sat" },
    ],
  },
];

export const tierById = (id: TierId) => tiers.find((t) => t.id === id)!;
export const hubBySlug = (slug: string) => hubs.find((h) => h.slug === slug);
