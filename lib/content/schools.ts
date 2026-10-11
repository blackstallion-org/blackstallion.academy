import type { HubSlug } from "./fleet";
import type { MediaKey } from "./media";
import { price } from "./pricing";

/**
 * Reel 10 · The Citadel (school boards). Blueprint R10, revised per the
 * Pan-India Regional Architecture Directive and Directive 04 (Zero-CapEx model):
 * BSAH funds, builds and operates; the school provides land and earns 25–30%.
 * No claims of signed contracts with named schools anywhere in this file.
 */

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

/** Capital figures are BSAH's investment in the campus arena, not the school's. */
export const tiers: Tier[] = [
  { id: "standard", name: "Standard Hub", stables: 4, acres: "0.5 acre", cadets: "100–150", capexLakh: 8.2, capexLabel: "₹8.20 L", includes: ["4 stables", "Sand arena", "Fencing", "Tack room"] },
  { id: "signature", name: "Signature Hub", stables: 8, acres: "1 acre", cadets: "200–300", capexLakh: 15, capexLabel: "₹15.00 L", includes: ["8 stables", "Full arena", "AC lounge", "Floodlights"] },
  { id: "royal", name: "Royal Pavilion", stables: 12, acres: "1.5+ acres", cadets: "300+", capexLakh: 25, capexLabel: "₹25.00 L+", includes: ["12 stables", "Cavalry arena", "VIP deck", "STPCI host venue"] },
];

export const TUITION_PER_MONTH = price.core; // ₹ per cadet (Core tier), before GST

/** School income at a given enrolment and revenue share. The school carries no capital. */
export function simulate(cadets: number, sharePct: number) {
  const annualTuition = cadets * TUITION_PER_MONTH * 12;
  const schoolYear = annualTuition * (sharePct / 100);
  const schoolMonth = schoolYear / 12;
  return { annualTuition, schoolYear, schoolMonth };
}

/** ₹1,44,00,000 → "₹1.44 Cr"; ₹36,00,000 → "₹36.0 L" */
export function formatINR(n: number) {
  if (n >= 1e7) return `₹${(n / 1e7).toFixed(2)} Cr`;
  if (n >= 1e5) return `₹${(n / 1e5).toFixed(1)} L`;
  return `₹${new Intl.NumberFormat("en-IN").format(Math.round(n))}`;
}

export const model = [
  { n: "01", title: "BSAH funds and builds the arena", line: "Zero capital expenditure to the school board. The school provides land, access and utilities." },
  { n: "02", title: "BSAH operates everything", line: "Horses, ex-cavalry faculty, vets, insurance, admissions and billing are ours." },
  { n: "03", title: "The school earns 25–30%", line: "Of gross cadet tuition, returned directly to the institution, settled quarterly." },
];

export const seals = [
  { title: "STPCI hosting rights", line: "Your arena on the national circuit." },
  { title: "EFI junior pathway", line: "Cadets registered with the federation." },
  { title: "Press & national coverage", line: "Tournament days bring the cameras." },
  { title: "Governor's Cup venue", line: "Royal Pavilion hubs host the finals." },
];

/* ------------------------------------------------------- Pan-India network */

export type Zone = {
  code: string;
  name: string;
  circuit: string;
  subzones: { code: string; name: string; demographic: string }[];
};

/** The Sovereign Pan-India Regional Hub Network (Pan-India Directive §1–2). Target corridors, not signed partners. */
export const network: Zone[] = [
  {
    code: "01", name: "Telangana & Andhra Pradesh Circuit", circuit: "Hyderabad hub network",
    subzones: [
      { code: "01A", name: "Financial District & Narsingi Corridor", demographic: "Premium IB & Cambridge international hubs" },
      { code: "01B", name: "Begumpet & Jubilee Hills Heritage Belt", demographic: "Legacy private & historical day schools" },
      { code: "01C", name: "Gachibowli & Madhapur Academic Axis", demographic: "Progressive K-12 & STEM institutions" },
    ],
  },
  {
    code: "02", name: "National Capital Region Circuit", circuit: "NCR",
    subzones: [
      { code: "02A", name: "Golf Course Road & Cyber City Belt (Gurugram)", demographic: "Ultra-premium global & IB world campuses" },
      { code: "02B", name: "Noida Expressway & Knowledge Park Axis (Greater Noida)", demographic: "Sprawling multi-acre integrated institutional hubs" },
      { code: "02C", name: "Chanakyapuri & Lutyens' Institutional Zone (New Delhi)", demographic: "Diplomatic & heritage boarding institutions" },
    ],
  },
  {
    code: "03", name: "Maharashtra & Western India Circuit", circuit: "West",
    subzones: [
      { code: "03A", name: "Bandra-Kurla Complex & South Mumbai Hub (Mumbai)", demographic: "Elite metropolitan day schools & legacy academies" },
      { code: "03B", name: "Baner-Wakad & Pimpri-Chinchwad Axis (Pune)", demographic: "Technical, IB & global boarding institutions" },
      { code: "03C", name: "Panchgani & Mahabaleshwar Residential Plateau", demographic: "Legacy heritage boarding schools & hill academies" },
    ],
  },
  {
    code: "04", name: "Karnataka & Southern Metropolitan Circuit", circuit: "South",
    subzones: [
      { code: "04A", name: "Whitefield & Sarjapur Innovation Belt (Bengaluru)", demographic: "New-age global tech & international residential campuses" },
      { code: "04B", name: "Hebbal & Yelahanka North Corridor (Bengaluru)", demographic: "Sprawling acreage international academies" },
      { code: "04C", name: "Ooty & Kodaikanal Hill Sanctuary Circuit (Tamil Nadu)", demographic: "Century-old residential boarding schools" },
    ],
  },
  {
    code: "05", name: "Northern Heritage & Boarding Circuit", circuit: "Northern corridor",
    subzones: [
      { code: "05A", name: "Doon Valley & Mussoorie Foothills Belt (Dehradun)", demographic: "India's premier legacy residential & all-boys/all-girls boarding academies" },
      { code: "05B", name: "Ajmer & Jaipur Royal Heritage Corridor (Rajasthan)", demographic: "Historical Rajputana equestrian & boarding institutions" },
      { code: "05C", name: "Shimla Hills & Solan Ridge Circuit (Himachal Pradesh)", demographic: "Heritage colonial residential boarding campuses" },
    ],
  },
  {
    code: "06", name: "Eastern & Central Regional Circuit", circuit: "East & Centre",
    subzones: [
      { code: "06A", name: "Alipore & Salt Lake Institutional Axis (Kolkata)", demographic: "Legacy metropolitan heritage schools" },
      { code: "06B", name: "Central Malwa Educational Plateau (Indore / Bhopal)", demographic: "Sprawling residential & progressive CBSE/ICSE campuses" },
    ],
  },
];

/** Benchmark copy for the Pan-India section (Pan-India Directive §3). */
export const benchmark = {
  lines: [
    "Equestrian excellence has historically been the sole privilege of select, century-old heritage academies.",
    "BSAH democratizes and elevates this sovereign infrastructure: turnkey, ex-cavalry managed arenas, STPCI-sanctioned national competition and zero-CapEx revenue-sharing models, brought directly to prospective premier campuses across India's leading educational corridors.",
  ],
};

/** Commercial lifecycle (Architecture Blueprint L7). No hub is shown as contracted or active without evidence. */
export type HubStatus = "prospect" | "pipeline" | "contracted" | "active" | "paused" | "closed";
export const hubStatusLabel: Record<HubStatus, string> = {
  prospect: "Prospect · not yet contracted",
  pipeline: "In pipeline",
  contracted: "Contracted",
  active: "Active",
  paused: "Paused",
  closed: "Closed",
};

export type Hub = {
  slug: HubSlug;
  status: HubStatus;
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

/** Zone 01 proposed flagship corridors (SAMPLE planning figures, not operating campuses). Identified by zone codename, never by school name. */
export const hubs: Hub[] = [
  {
    slug: "zone-01a-financial-district", status: "prospect", name: "Zone 01A · Financial District & Narsingi Corridor", short: "Zone 01A · Narsingi", area: "Financial District", tier: "signature",
    stallions: 8, cadets: 150, image: "schoolAerial", note: "Proposed flagship corridor and candidate host venue for the Sovereign Governor's Cup (subject to STPCI confirmation).",
    pin: { x: 58, y: 66 },
    batches: [
      { name: "Dawn Patrol", time: "06:15 AM–07:00 AM", days: "Mon · Wed · Fri" },
      { name: "Twilight Batch", time: "03:45 PM–04:30 PM", days: "Tue · Thu · Fri" },
      { name: "Weekend Circuit", time: "07:00 AM–07:45 AM", days: "Sat & Sun" },
    ],
  },
  {
    slug: "zone-01c-gachibowli", status: "prospect", name: "Zone 01C · Gachibowli & Madhapur Academic Axis", short: "Zone 01C · Gachibowli", area: "Gachibowli", tier: "standard",
    stallions: 4, cadets: 96, image: "schoolArenaNight", note: "Proposed corridor planned for floodlit evening batches.",
    pin: { x: 30, y: 44 },
    batches: [
      { name: "Twilight Batch", time: "03:45 PM–04:30 PM", days: "Mon · Wed · Fri" },
      { name: "Sunset Command", time: "04:45 PM–05:30 PM", days: "Tue · Thu" },
    ],
  },
  {
    slug: "zone-01b-begumpet", status: "prospect", name: "Zone 01B · Begumpet & Jubilee Hills Heritage Belt", short: "Zone 01B · Begumpet", area: "Begumpet", tier: "royal",
    stallions: 12, cadets: 210, image: "bgPavilion", note: "Proposed heritage pavilion; candidate host for the Junior Lancers Invitational.",
    pin: { x: 54, y: 32 },
    batches: [
      { name: "Dawn Patrol", time: "06:15 AM–07:00 AM", days: "Daily" },
      { name: "Twilight Batch", time: "03:45 PM–04:30 PM", days: "Mon–Fri" },
      { name: "Sunset Command", time: "04:45 PM–05:30 PM", days: "Mon–Thu" },
    ],
  },
];

export const tierById = (id: TierId) => tiers.find((t) => t.id === id)!;
export const hubBySlug = (slug: string) => hubs.find((h) => h.slug === slug);
