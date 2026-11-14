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
  { n: 4, href: "/worlds", act: "legend", title: "The Opening", inscription: "One horse.", voice: "One lineage.", blurb: "A scroll-controlled film: the valley above the academy, then the cavalry country of Marwar, with one black Marwari.", image: "duneSilhouette" },
  { n: 5, href: "/science", act: "citadel", title: "The Matrix", inscription: "What the saddle", voice: "does to a child.", blurb: "Four systems, one twenty-minute session.", image: "scienceRider" },
  { n: 6, href: "/why", act: "citadel", title: "Crisis & Cure", inscription: "Digital fragility", voice: "is a choice.", blurb: "Character is forged in the arena.", image: "whyCure" },
  { n: 7, href: "/curriculum", act: "citadel", title: "The Ledger", inscription: "Four ranks.", voice: "Thirteen pillars.", blurb: "An athletic curriculum that builds character.", image: "currLedger" },
  { n: 8, href: "/fleet", act: "citadel", title: "The Studbook", inscription: "Twenty-one", voice: "stallions.", blurb: "Every one has a name.", image: "bgStable" },
  { n: 9, href: "/cadets", act: "citadel", title: "The Hall of Valour", inscription: "The hall", voice: "of valour.", blurb: "Hour by hour, rank by rank, sealed in brass.", image: "cadetZayd" },
  { n: 10, href: "/parents", act: "citadel", title: "The Guardian", inscription: "The guardian", voice: "sees every stride.", blurb: "Admissions, fees and the parent app.", image: "parentsRail" },
  { n: 11, href: "/safety", act: "citadel", title: "The Shield", inscription: "Safety", voice: "before speed.", blurb: "Ex-cavalry faculty, daily vet care, insurance.", image: "safetyKit" },
  { n: 13, href: "/schools", act: "ledger", title: "The Citadel", inscription: "Your campus", voice: "becomes a citadel.", blurb: "Tiers, returns and the draft MOU for school boards.", image: "schoolAerial" },
  { n: 14, href: "/verify", act: "ledger", title: "The Seal", inscription: "Every hour", voice: "sealed in brass.", blurb: "Verify a cadet's passport.", image: "bgPassport" },
  { n: 15, href: "/tournaments", act: "ledger", title: "The Circuit", inscription: "Lances down.", voice: "Zones on the circuit.", blurb: "STPCI standings and fixtures.", image: "bgCharge" },
  { n: 16, href: "/command", act: "ledger", title: "The Command", inscription: "Questions,", voice: "answered.", blurb: "Fees, safety, curriculum and campus information.", image: "bgArena" },
  { n: 17, href: "/journal", act: "ledger", title: "The Chronicle", inscription: "Stories", voice: "from the stable.", blurb: "Legends, science and the circuit.", image: "journalReins" },
  { n: 18, href: "/contact", act: "ledger", title: "The Gate", inscription: "The arena", voice: "is open.", blurb: "Enrol, partner, or book a board audit.", image: "contactGate" },
  { n: 19, href: "/story/pratap-chetak", act: "ledger", title: "Pratap & Chetak", inscription: "A bond", voice: "through the storm.", blurb: "Six chapters, painted: the bond, Haldighati in 1576, and the legend of one final leap.", image: "bgCharge" },
  { n: 20, href: "/history/india", act: "ledger", title: "Horses of India", inscription: "Eight centuries.", voice: "One lineage.", blurb: "From Shalihotra to Haifa: the horses that carried a subcontinent.", image: "duneSilhouette" },
  { n: 21, href: "/history/world", act: "ledger", title: "Horses of the World", inscription: "Silk roads.", voice: "Iron roads.", blurb: "Xenophon to the Western Front: the horse beside every civilisation.", image: "bgCharge" },
  { n: 22, href: "/story/rani-lakshmibai", act: "ledger", title: "Rani Lakshmibai", inscription: "Jhansi will not", voice: "be surrendered.", blurb: "Four chapters, painted: the queen who rode out of a besieged fort.", image: "bgCharge" },
  { n: 23, href: "/story/alexander-bucephalus", act: "ledger", title: "Alexander & Bucephalus", inscription: "The shadow.", voice: "The boy.", blurb: "Twelve mosaic rooms: a boy, a horse no one could ride, and a city named for it on the Hydaspes.", image: "duneSilhouette" },
];

/**
 * Working pages that sit in the menu beside the reels without being part of the film: they have no reel mark and no end
 * card. The menu numbers them with the reels (so a reel mark reads "REEL n / 23"), after the reels of their act.
 */
export const tools = [
  { n: 12, href: "/motion-lab", act: "citadel" as Act, title: "Motion Lab", badge: "3D page" },
] as const;

/** The menu numbers the reels and the working pages together, so the count is both. */
export const TOTAL_REELS = reels.length + tools.length;

export function reelFor(pathname: string): Reel | undefined {
  if (pathname === "/lithos") return reels.find((r) => r.href === "/statue");
  return reels.find((r) => pathname === r.href || pathname.startsWith(`${r.href}/`));
}

export function nextReel(n: number): Reel {
  const i = reels.findIndex((r) => r.n === n);
  return reels[(i + 1) % reels.length];
}

export function reelByHref(href: string): Reel {
  const r = reels.find((x) => x.href === href);
  if (!r) throw new Error(`Unknown reel ${href}`);
  return r;
}

/** A numbered page (a reel or a working page): the one number and the one title every menu shows for it. */
export type NumberedPage = { n: number; href: string; title: string };

/** Every numbered page, in menu order. The only place a page's number and title come from. */
export const numberedPages: NumberedPage[] = [...reels, ...tools]
  .map(({ n, href, title }) => ({ n, href, title }))
  .sort((a, b) => a.n - b.n);

/** The numbered page at an address, if it is one. */
export function numberedPage(href: string): NumberedPage | undefined {
  return numberedPages.find((p) => p.href === href);
}

/**
 * A menu entry as written below: a numbered page by its address alone (its number and title are looked up, never typed), or
 * a page outside the reels (sign-up forms, privacy, the gallery) with its own label and no number.
 */
type MenuEntry = string | { label: string; href: string };

/** A menu link as the menus draw it: `n` is set only for numbered pages. */
export type NavMenuLink = { label: string; href: string; n?: number };

function menuLink(entry: MenuEntry): NavMenuLink {
  if (typeof entry === "string") {
    const page = numberedPage(entry);
    if (!page) throw new Error(`Menu entry ${entry} is not a numbered page: give it a label`);
    return { label: page.title, href: page.href, n: page.n };
  }
  // A numbered page written with a label would retitle it in one menu only (owner's rule, CLAUDE.md → Navigation).
  if (numberedPage(entry.href)) throw new Error(`Menu entry ${entry.href} is a numbered page: list it by its address only`);
  return { label: entry.label, href: entry.href };
}

const links = (entries: MenuEntry[]) => entries.map(menuLink);

export const primaryNav: NavMenuLink[] = links(["/legend", "/worlds", "/curriculum", "/parents", "/schools", "/tournaments", "/verify"]);

export const navCta = { label: "Enrol a cadet", href: "/contact?gate=parents" };

type NavMenuColumn = { heading: string; links: NavMenuLink[] };
export type NavMenu = {
  /** The word in the header bar. */
  label: string;
  /** One line under the menu's title. */
  lead: string;
  /** Exactly three columns, so every menu has the same balance. */
  columns: [NavMenuColumn, NavMenuColumn, NavMenuColumn];
};

const column = (heading: string, entries: MenuEntry[]): NavMenuColumn => ({ heading, links: links(entries) });

/**
 * The header's full-screen mega menus: one per header word, three columns each. A numbered page shows its own number and
 * title (from `reels` / `tools`), the same as in the Reels menu and the footer; the menus never number their links 01, 02,
 * 03 themselves. Every public page appears at least once. Left out on purpose: /stills and /worlds/credits (production pages,
 * noindex), /schools/access (a private invitation), /sovereign (the school dashboard behind sign-in), /login, /lithos (the
 * same monument as /statue, its canonical address), and the detail pages under /journal, /schools, /tournaments and /verify.
 */
export const navMenus: NavMenu[] = [
  {
    label: "Academy",
    lead: "Who we are, why the saddle, and how a child is kept safe.",
    columns: [
      column("The Mandate", [{ label: "The Mandate", href: "/about" }, "/science", "/why"]),
      column("Safeguards", ["/safety", "/command", { label: "Privacy notice", href: "/privacy" }]),
      column("The Record", ["/journal", "/contact", { label: "Gallery", href: "/gallery" }]),
    ],
  },
  {
    label: "Cadets",
    lead: "The corps, its passports and its circuit, and how a child joins it.",
    columns: [
      column("The Corps", ["/cadets", "/verify", { label: "Your riding journey", href: "/account" }]),
      column("The Circuit", ["/motion-lab", "/tournaments", { label: "Horse Shoes & Equipment", href: "/equipment" }]),
      column("Join the Corps", [
        { label: "Enrol a cadet", href: "/enroll" },
        { label: "Your applications", href: "/enroll/status" },
        { label: "Register", href: "/register" },
      ]),
    ],
  },
  {
    label: "Training",
    lead: "Four ranks, the horse a cadet rides, and the arena that holds them.",
    columns: [
      column("The Curriculum", ["/science", "/curriculum", { label: "The Science of the Stride", href: "/stride" }]),
      column("The Horse", ["/anatomy", "/fleet", { label: "Horse Shoes & Equipment", href: "/equipment" }]),
      column("The Arena", ["/safety", "/motion-lab", "/tournaments"]),
    ],
  },
  {
    label: "Programs",
    lead: "For parents, for school boards, and for those who would serve with us.",
    columns: [
      column("For Parents", ["/parents", "/command", { label: "Enrol a cadet", href: "/enroll" }]),
      column("For Schools", ["/schools", { label: "Draft MOU", href: "/schools/mou" }, { label: "Schools & institutions", href: "/schools/apply" }]),
      column("Serve with Us", ["/contact", { label: "Partners & sponsors", href: "/partners/apply" }, { label: "Instructors & staff", href: "/careers/apply" }]),
    ],
  },
  {
    label: "Heritage",
    lead: "Eight hundred years of the Marwari, and the riders who made it a legend.",
    columns: [
      column("The Marwari", ["/legend", "/statue", "/worlds"]),
      column("Painted Histories", ["/story/pratap-chetak", "/story/rani-lakshmibai", "/story/alexander-bucephalus"]),
      column("The Archive", ["/history/india", "/history/world", { label: "Lore of the Bards", href: "/lore" }]),
    ],
  },
];

/** Whether a path is one of a menu's pages (or below one), for the header's "you are here" mark. */
export function menuHolds(menu: NavMenu, pathname: string): boolean {
  const p = pathname === "/lithos" ? "/statue" : pathname;
  return menu.columns.some((c) => c.links.some((l) => p === l.href || p.startsWith(`${l.href}/`)));
}

/** The footer's page list: numbered pages only, shown with their own number and title. */
export const footerNav: NavMenuLink[] = links([
  "/legend",
  "/anatomy",
  "/statue",
  "/science",
  "/why",
  "/curriculum",
  "/fleet",
  "/cadets",
  "/parents",
  "/motion-lab",
  "/schools",
  "/tournaments",
  "/command",
  "/journal",
  "/contact",
  "/history/india",
]).sort((a, b) => (a.n ?? 0) - (b.n ?? 0));

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

/** The footer's small print: pages outside the reels (numbered pages belong in `footerNav`). */
export const legalNav: NavMenuLink[] = links([
  { label: "About", href: "/about" },
  { label: "Lore of the Bards", href: "/lore" },
  { label: "Privacy", href: "/privacy" },
  { label: "Film credits", href: "/worlds/credits" },
]);

/** Application screens (the staff console, its sign-in, and the dev preview of its overview): no public nav or footer. */
export const isConsolePath = (pathname: string) => pathname.startsWith("/admin") || pathname.startsWith("/dev/admin-dashboard");

/** The signed-in member area keeps the site's nav (it is part of the site) but, being an application screen, not the public footer. */
export const hidesFooter = (pathname: string) => isConsolePath(pathname) || pathname === "/account" || pathname.startsWith("/account/");

/** The crest files. `?v=` is bumped whenever the artwork changes: `/brand/*` is cached by browsers for a day, so a new file at the old address would not show. */
export const LOGO = { sm: "/brand/bsah-logo-sm.webp?v=4", lg: "/brand/bsah-logo.webp?v=4" } as const;
