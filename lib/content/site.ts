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
  { n: 2, href: "/anatomy", act: "legend", title: "The Instrument", inscription: "The", voice: "instrument.", blurb: "Several hundred kilograms that read you first.", image: "anatomyProfile" },
  { n: 3, href: "/statue", act: "legend", title: "The 3D Monument", inscription: "Cast in bronze.", voice: "Built to endure.", blurb: "Six chapters around the academy's bronze of a cadet and a Marwari.", image: "curriculumHeroStatue" },
  { n: 4, href: "/worlds", act: "legend", title: "Four Worlds", inscription: "One horse.", voice: "Four worlds.", blurb: "A scroll-controlled film: the valley, the anatomy, the cavalry country and the future, with one black Marwari.", image: "duneSilhouette" },
  { n: 5, href: "/science", act: "citadel", title: "The Matrix", inscription: "What the saddle", voice: "does to a child.", blurb: "Four systems, one twenty-minute session.", image: "scienceRider" },
  { n: 6, href: "/why", act: "citadel", title: "Crisis & Cure", inscription: "Digital fragility", voice: "is a choice.", blurb: "Character is forged in the arena.", image: "whyCure" },
  { n: 7, href: "/curriculum", act: "citadel", title: "The Ledger", inscription: "Four ranks.", voice: "Thirteen pillars.", blurb: "An athletic curriculum that builds character.", image: "currLedger" },
  { n: 8, href: "/fleet", act: "citadel", title: "The Studbook", inscription: "Twenty-one", voice: "stallions.", blurb: "Every one has a name.", image: "bgStable" },
  { n: 9, href: "/cadets", act: "citadel", title: "The Hall of Valour", inscription: "The hall", voice: "of valour.", blurb: "Hour by hour, rank by rank, sealed in brass.", image: "cadetZayd" },
  { n: 10, href: "/parents", act: "citadel", title: "The Guardian", inscription: "The guardian", voice: "sees every stride.", blurb: "Admissions, fees and the parent app.", image: "parentsRail" },
  { n: 11, href: "/safety", act: "citadel", title: "The Shield", inscription: "Safety", voice: "before speed.", blurb: "Ex-cavalry faculty, daily vet care, insurance.", image: "safetyKit" },
  { n: 12, href: "/schools", act: "ledger", title: "The Citadel", inscription: "Your campus", voice: "becomes a citadel.", blurb: "Tiers, returns and the draft MOU for school boards.", image: "schoolAerial" },
  { n: 13, href: "/verify", act: "ledger", title: "The Seal", inscription: "Every hour", voice: "sealed in brass.", blurb: "Verify a cadet's passport.", image: "bgPassport" },
  { n: 14, href: "/tournaments", act: "ledger", title: "The Circuit", inscription: "Lances down.", voice: "Zones on the circuit.", blurb: "STPCI standings and fixtures.", image: "bgCharge" },
  { n: 15, href: "/command", act: "ledger", title: "The Command", inscription: "Questions,", voice: "answered.", blurb: "Fees, safety, curriculum and campus information.", image: "bgArena" },
  { n: 16, href: "/journal", act: "ledger", title: "The Chronicle", inscription: "Stories", voice: "from the stable.", blurb: "Legends, science and the circuit.", image: "journalReins" },
  { n: 17, href: "/contact", act: "ledger", title: "The Gate", inscription: "The arena", voice: "is open.", blurb: "Enrol, partner, or book a board audit.", image: "contactGate" },
  { n: 18, href: "/story/pratap-chetak", act: "ledger", title: "Pratap & Chetak", inscription: "A bond", voice: "through the storm.", blurb: "Six chapters, painted: the bond, Haldighati in 1576, and the legend of one final leap.", image: "bgCharge" },
  { n: 19, href: "/history/india", act: "ledger", title: "Horses of India", inscription: "Eight centuries.", voice: "One lineage.", blurb: "From Shalihotra to Haifa: the horses that carried a subcontinent.", image: "duneSilhouette" },
  { n: 20, href: "/history/world", act: "ledger", title: "Horses of the World", inscription: "Silk roads.", voice: "Iron roads.", blurb: "Xenophon to the Western Front: the horse beside every civilisation.", image: "bgCharge" },
  { n: 21, href: "/story/rani-lakshmibai", act: "ledger", title: "Rani Lakshmibai", inscription: "Jhansi will not", voice: "be surrendered.", blurb: "Four chapters, painted: the queen who rode out of a besieged fort.", image: "bgCharge" },
  { n: 22, href: "/story/alexander-bucephalus", act: "ledger", title: "Alexander & Bucephalus", inscription: "The shadow.", voice: "The boy.", blurb: "Four chapters, painted: a boy, a horse no one could ride, and the edge of the known world.", image: "duneSilhouette" },
];

export const TOTAL_REELS = reels.length;

/**
 * Working pages that sit in the menu beside the reels without being part of the film: they have no reel mark and no end card,
 * and do not change the reel count (so the "REEL n / 22" marks and the hand-off from reel to reel stay as they were).
 */
export const tools = [
  { n: 23, href: "/motion-lab", act: "ledger" as Act, title: "Motion Lab", badge: "3D page" },
] as const;

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
  { label: "Worlds", href: "/worlds" },
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
  { label: "Painted histories", href: "/history/india" },
  { label: "Journal", href: "/journal" },
  { label: "The Command", href: "/command" },
  { label: "Privacy", href: "/privacy" },
  { label: "Film credits", href: "/worlds/credits" },
];

/** Application screens (the staff console, its sign-in, and the dev preview of its overview): no public nav or footer. */
export const isConsolePath = (pathname: string) => pathname.startsWith("/admin") || pathname.startsWith("/dev/admin-dashboard");

/** The signed-in member area keeps the site's nav (it is part of the site) but, being an application screen, not the public footer. */
export const hidesFooter = (pathname: string) => isConsolePath(pathname) || pathname === "/account" || pathname.startsWith("/account/");

/** The crest files. `?v=` is bumped whenever the artwork changes: `/brand/*` is cached by browsers for a day, so a new file at the old address would not show. */
export const LOGO = { sm: "/brand/bsah-logo-sm.webp?v=4", lg: "/brand/bsah-logo.webp?v=4" } as const;
