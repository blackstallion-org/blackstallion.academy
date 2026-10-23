import type { MediaKey } from "./media";

/**
 * Site-wide structure: the fifteen reels, navigation and the entity block.
 * Blueprint Parts 2 and 5.
 */

export type Act = "legend" | "citadel" | "ledger";

export const acts: Record<Act, { numeral: string; name: string; zone: string; feeling: string }> = {
  legend: { numeral: "I", name: "The Legend", zone: "Hook", feeling: "Awe" },
  citadel: { numeral: "II", name: "The Citadel", zone: "Proof", feeling: "Trust" },
  ledger: { numeral: "III", name: "The Ledger", zone: "Convert", feeling: "Decision" },
};

export type Reel = {
  n: number;
  href: string;
  act: Act;
  title: string;
  inscription: string;
  voice: string;
  blurb: string;
  image: MediaKey;
};

export const reels: Reel[] = [
  { n: 1, href: "/legend", act: "legend", title: "The Marwari", inscription: "The land", voice: "of death.", blurb: "Eight hundred years of the horse that would not leave the field.", image: "duneSilhouette" },
  { n: 2, href: "/anatomy", act: "legend", title: "The Instrument", inscription: "The", voice: "instrument.", blurb: "Five hundred kilograms that read you first.", image: "anatomyProfile" },
  { n: 3, href: "/statue", act: "legend", title: "The 3D Monument", inscription: "Cast in bronze.", voice: "Built to endure.", blurb: "A five-chapter cinematic 3D journey through the Rossbändiger monument.", image: "curriculumHeroStatue" },
  { n: 4, href: "/science", act: "citadel", title: "The Matrix", inscription: "What the saddle", voice: "does to a child.", blurb: "Four systems, one twenty-minute session.", image: "scienceRider" },
  { n: 5, href: "/why", act: "citadel", title: "Crisis & Cure", inscription: "Digital fragility", voice: "is a choice.", blurb: "Character is forged in the arena.", image: "whyCure" },
  { n: 6, href: "/curriculum", act: "citadel", title: "The Ledger", inscription: "Four ranks.", voice: "Thirteen pillars.", blurb: "An athletic curriculum that builds character.", image: "currLedger" },
  { n: 7, href: "/fleet", act: "citadel", title: "The Studbook", inscription: "Twenty-one", voice: "stallions.", blurb: "Every one has a name.", image: "bgStable" },
  { n: 8, href: "/cadets", act: "citadel", title: "The Hall of Valour", inscription: "The hall", voice: "of valour.", blurb: "Hour by hour, rank by rank, sealed in brass.", image: "cadetZayd" },
  { n: 9, href: "/parents", act: "citadel", title: "The Guardian", inscription: "The guardian", voice: "sees every stride.", blurb: "Admissions, fees and the parent app.", image: "parentsRail" },
  { n: 10, href: "/safety", act: "citadel", title: "The Shield", inscription: "Safety", voice: "before speed.", blurb: "Ex-cavalry faculty, daily vet care, insurance.", image: "safetyKit" },
  { n: 11, href: "/schools", act: "ledger", title: "The Citadel", inscription: "Your campus", voice: "becomes a citadel.", blurb: "Tiers, returns and the draft MOU for school boards.", image: "schoolAerial" },
  { n: 12, href: "/verify", act: "ledger", title: "The Seal", inscription: "Every hour", voice: "sealed in brass.", blurb: "Verify a cadet's passport.", image: "bgPassport" },
  { n: 13, href: "/tournaments", act: "ledger", title: "The Circuit", inscription: "Lances down.", voice: "Zones on the circuit.", blurb: "STPCI standings and fixtures.", image: "bgCharge" },
  { n: 14, href: "/command", act: "ledger", title: "Information desk", inscription: "Questions,", voice: "answered.", blurb: "Fees, safety, curriculum and campus information.", image: "bgArena" },
  { n: 15, href: "/journal", act: "ledger", title: "The Chronicle", inscription: "Stories", voice: "from the stable.", blurb: "Legends, science and the circuit.", image: "journalReins" },
  { n: 16, href: "/contact", act: "ledger", title: "The Gate", inscription: "The arena", voice: "is open.", blurb: "Enrol, partner, or book a board audit.", image: "contactGate" },
];

export const TOTAL_REELS = reels.length;

export function reelFor(pathname: string): Reel | undefined {
  if (pathname === "/lithos") return reels.find((r) => r.href === "/statue");
  return reels.find((r) => pathname === r.href || pathname.startsWith(`${r.href}/`));
}

export function nextReel(n: number): Reel {
  return reels[n % reels.length];
}

export function reelByHref(href: string): Reel {
  const r = reels.find((x) => x.href === href);
  if (!r) throw new Error(`Unknown reel ${href}`);
  return r;
}

export const primaryNav = [
  { label: "Legend", href: "/legend" },
  { label: "Curriculum", href: "/curriculum" },
  { label: "Parents", href: "/parents" },
  { label: "Schools", href: "/schools" },
  { label: "Circuit", href: "/tournaments" },
  { label: "Verify", href: "/verify" },
];

export const navCta = { label: "Enrol a cadet", href: "/contact?gate=parents" };

export const entity = {
  parent: "Vicarius Infinitum Holdings Pvt Ltd",
  operator: "The Black Stallion Academy of Horsemanship Pvt Ltd",
  council: "School Tent Pegging Council of India",
  councilShort: "STPCI",
  motto: "Dominus Sui, Dominus Equi",
  mottoEn: "Master of oneself, master of the horse",
  city: "Hyderabad, Telangana, India",
};

export const corridors = [
  { id: "schools", title: "School boards", email: "boards@blackstallion.academy" },
  { id: "parents", title: "Parent helpdesk", email: "parents@blackstallion.academy" },
  { id: "partners", title: "Regional partners", email: "partners@blackstallion.academy" },
] as const;

export const legalNav = [
  { label: "About", href: "/about" },
  { label: "Lore of the Bards", href: "/lore" },
  { label: "Journal", href: "/journal" },
  { label: "Information desk", href: "/command" },
  { label: "Privacy", href: "/privacy" },
];
