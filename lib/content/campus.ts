import { tiers, type TierId } from "./schools";

/**
 * The campus scale model (Schools page, "The campus, to scale"). One source of truth for the 3D model, the 2D site plan,
 * the information cards and the validation test. Nothing in here is drawn or written by a component.
 *
 * WHERE THE NUMBERS COME FROM. Each spec row carries a `basis`:
 *  - "approved": stated by BSAH in the tier table (lib/content/schools.ts, Blueprint §6 Schools §2) or in the campus
 *    configurator copy already on the page (components/sections/schools/citadel/citadelData.ts: arena sizes, 12 ft stalls,
 *    "Timber-Louvred Loose Boxes", "AC lounge", "VIP Viewing Deck", "Veterinary Isolation Suite", "Royal Viewing Pavilion").
 *    The arena sizes and the 12 ft stall are NOT in the Blueprint: they are in the configurator data only, so BSAH should
 *    confirm them (the test cross-checks both files so they cannot drift apart).
 *  - "modelled": a drawing decision made so the model can be built (a lane width, a roof pitch, which end a bay sits at).
 *    Shown to the visitor as "As modelled". Not a BSAH requirement.
 *  - "tbc": missing from BSAH's documents. Shown as "To be confirmed". Never filled with an invented figure.
 *
 * Not in the approved requirements, so deliberately NOT modelled: equipment store, reception, instructor facilities,
 * paddocks, walking paths, landscaping, solar, parking. Trees and paving in the 3D view are model staging only.
 *
 * Units are metres. x runs east, z runs south (so the plan has north at the top), y is up. The origin is the centre of the
 * site; the terrain top is y = 0.
 */

export type Basis = "approved" | "modelled" | "tbc";
export const basisLabel: Record<Basis, string> = { approved: "Approved", modelled: "As modelled", tbc: "To be confirmed" };
export const TBC = "To be confirmed";

export type Spec = { label: string; value: string; basis: Basis };

/** Centre-based rectangle, metres. */
export type Rect = { x: number; z: number; w: number; d: number };
export type Side = "n" | "e" | "s" | "w";

export type ModuleKind = "arena" | "stable-block" | "tack-room" | "lounge" | "pavilion" | "vet-suite";
export type Bay = "stall" | "grooming" | "feed";

export type Gate = { side: Side; /** Offset of the gate centre from the middle of that side, metres. */ at: number; width: number };

export type CampusModule = {
  id: string;
  kind: ModuleKind;
  /** Hover label and card title. */
  name: string;
  /** Plan label. */
  short: string;
  /** Number in the plan key (1-based) and on the 3D marker. */
  key: number;
  /** Footprint including fences, columns and decks. */
  rect: Rect;
  /** Highest point, metres (as modelled): used for the marker, the focus pose and the clip box. */
  height: number;
  /** The side that faces the arena or the lane (the "front"). */
  facing: Side;
  purpose: string;
  specs: Spec[];
  // Stable block
  bays?: Bay[];
  // Arena
  arena?: { w: number; d: number; roof: "open" | "canopy" | "colonnade"; floodlights: boolean; gates: Gate[] };
};

export type CampusTier = {
  id: TierId;
  name: string;
  /** Drawing title as on the page's configurator. */
  layoutTitle: string;
  site: { acres: number; acresLabel: string; w: number; d: number };
  entrance: { side: Side; x: number; z: number; width: number };
  modules: CampusModule[];
  paths: Rect[];
  /** Overview figures, every one from the tier table. */
  overview: Spec[];
  includes: string[];
  note: string;
};

/** 12 ft x 12 ft loose box (citadelData FACILITY_INFO.stables), in metres. */
export const STALL = 3.658;
/** Covered walkway along the stall fronts, as modelled. */
export const WALKWAY = 2.4;
export const BLOCK_DEPTH = STALL + WALKWAY;
/** Paved lane between a stable block and the arena, as modelled. */
export const LANE = 3;
/** Edge margin between a building and the plot boundary, as modelled. */
const FENCE = 0.2;
const SQM_PER_ACRE = 4046.8564;

const approved = (label: string, value: string): Spec => ({ label, value, basis: "approved" });
const modelled = (label: string, value: string): Spec => ({ label, value, basis: "modelled" });
const tbc = (label: string): Spec => ({ label, value: TBC, basis: "tbc" });

const tier = (id: TierId) => tiers.find((t) => t.id === id)!;

/* ----------------------------------------------------------------- helpers */

const blockLength = (bays: Bay[]) => bays.length * STALL;

/** Footprint of a stable block whose centre is (x, z); the long side runs along x for facing n/s and along z for e/w. */
function blockRect(x: number, z: number, bays: Bay[], facing: Side): Rect {
  const len = blockLength(bays);
  return facing === "n" || facing === "s" ? { x, z, w: len, d: BLOCK_DEPTH } : { x, z, w: BLOCK_DEPTH, d: len };
}

export const left = (r: Rect) => r.x - r.w / 2;
export const right = (r: Rect) => r.x + r.w / 2;
export const top = (r: Rect) => r.z - r.d / 2;
export const bottom = (r: Rect) => r.z + r.d / 2;

const stallCount = (bays: Bay[]) => bays.filter((b) => b === "stall").length;

/* ------------------------------------------------- shared spec wording (all from the configurator copy) */

const stableSpecs = (bays: Bay[], arrangement: string, groomingBasis: Spec): Spec[] => [
  approved("Stalls in this block", `${stallCount(bays)} timber-louvred loose boxes`),
  approved("Stall size", "12 ft × 12 ft (3.66 m × 3.66 m)"),
  modelled("Stall arrangement", arrangement),
  approved("Ventilation", "Cross-ventilated: louvred stall fronts, plus a high vent band along the rear wall (as modelled)"),
  groomingBasis,
  bays.includes("feed") ? { label: "Feed and storage", value: "One closed end bay (feed storage is not in the approved list: to be confirmed)", basis: "tbc" } : tbc("Feed and storage"),
  modelled("Circulation", `Covered walkway, ${WALKWAY.toFixed(1)} m, along every stall front; paved lane ${LANE} m to the arena`),
  approved("Services", "Warm linear LED soffits · automated drinkers"),
];

const standardGrooming = approved("Grooming access", "Grooming bay at the end of the row (East Tack Room & Grooming Bay)");
const carriedGrooming = { label: "Grooming access", value: "Grooming bay at the end of the row. Listed for the Standard tier; carried here as modelled, to be confirmed", basis: "modelled" } as Spec;

const tackSpecs = (size: string, extra: Spec[]): Spec[] => [
  approved("Purpose", "Glazed tack room and cadet briefing pavilion"),
  approved("Storage", "Climate-controlled saddle and bridle vault"),
  approved("Glazing", "Floor-to-ceiling bronze glazing"),
  approved("Frontage", "Shaded veranda"),
  modelled("Footprint", size),
  ...extra,
];

/* -------------------------------------------------------------- Standard */

function buildStandard(): CampusTier {
  const t = tier("standard");
  const site = { acres: 0.5, acresLabel: t.acres, w: 52, d: 38.9 };
  const arena = { w: 40, d: 25 };
  const bays: Bay[] = ["stall", "stall", "stall", "stall", "grooming", "feed"];
  const stable = blockRect(0, 0, bays, "s");
  stable.x = -site.w / 2 + 2.5 + stable.w / 2;
  stable.z = -site.d / 2 + 2.35 + stable.d / 2;
  const arenaRect: Rect = { x: -site.w / 2 + 2.5 + arena.w / 2 + FENCE, z: bottom(stable) + LANE + arena.d / 2 + FENCE, w: arena.w + 2 * FENCE, d: arena.d + 2 * FENCE };
  const tack: Rect = { x: right(arenaRect) + 3 + 2.75, z: -13.1, w: 5.5, d: 8 };
  const entrance = { side: "s" as Side, x: 8, z: site.d / 2, width: 3 };
  const gateS = entrance.x - arenaRect.x;

  const modules: CampusModule[] = [
    {
      id: "arena", kind: "arena", key: 1, name: "Sand arena", short: "ARENA", rect: arenaRect, height: 1.5, facing: "s",
      purpose: "The riding surface. Every session, drill and tent-pegging lane runs here.",
      arena: { ...arena, roof: "open", floodlights: false, gates: [{ side: "s", at: gateS, width: 3.6 }, { side: "n", at: -4, width: 3.6 }] },
      specs: [
        approved("Size", "40 m × 25 m"),
        approved("Surface", "All-weather sand: laser-graded silica sand on geotextile footing"),
        approved("Boundary", "Perimeter fencing"),
        modelled("Fence", "Three-rail timber post-and-rail, 1.5 m"),
        modelled("Entrance gates", "Main gate on the south side, service gate on the north side"),
        modelled("Circulation", `Paved lane ${LANE} m on the stable side; 3 m on the entrance and tack-room sides`),
        approved("Roof", "None: open to the sky"),
      ],
    },
    {
      id: "stables", kind: "stable-block", key: 2, name: "Stable block", short: "STABLES", rect: stable, height: 3.4, facing: "s", bays,
      purpose: "Four loose boxes for the hub's stallions, fronts open to the arena lane.",
      specs: stableSpecs(bays, "Single row of four, fronts to the south", standardGrooming),
    },
    {
      id: "tack", kind: "tack-room", key: 3, name: "Tack room and grooming bay", short: "TACK", rect: tack, height: 4, facing: "w",
      purpose: "Saddles, bridles and the cadets' briefing point, on the east side of the arena.",
      specs: tackSpecs("5.5 m × 8 m, single storey", [approved("Position", "East of the arena")]),
    },
  ];

  const paths: Rect[] = [
    { x: arenaRect.x, z: (bottom(stable) + top(arenaRect)) / 2, w: arenaRect.w, d: LANE },
    { x: right(arenaRect) + 1.5, z: (top(stable) + bottom(arenaRect)) / 2, w: 3, d: bottom(arenaRect) - top(stable) },
    { x: (entrance.x - 1.5 + right(arenaRect) + 3) / 2, z: (bottom(arenaRect) + site.d / 2) / 2, w: right(arenaRect) + 3 - (entrance.x - 1.5), d: site.d / 2 - bottom(arenaRect) },
  ];

  return {
    id: "standard", name: t.name, layoutTitle: "STANDARD HUB LAYOUT", site, entrance, modules, paths, includes: t.includes,
    overview: [
      approved("Site", `${t.acres} (schematic ${site.w} m × ${site.d} m)`),
      approved("Arena", "40 m × 25 m, all-weather sand"),
      approved("Stables", `${t.stables} loose boxes`),
      approved("Cadet capacity", `${t.cadets} cadets`),
      approved("Tier capital", t.capexLabel),
    ],
    note: "The plot is drawn as a rectangle sized to the approved acreage. Its real shape, orientation and gate positions follow the site survey.",
  };
}

/* ------------------------------------------------------------- Signature */

function buildSignature(): CampusTier {
  const t = tier("signature");
  const site = { acres: 1, acresLabel: t.acres, w: 72, d: 56.2 };
  const arena = { w: 50, d: 30 };
  const colInset = 0.8;
  const arenaRect: Rect = { x: -6, z: 0, w: arena.w + 2 * FENCE, d: arena.d + 2 * (colInset + 0.3) };
  const north: Bay[] = ["stall", "stall", "stall", "stall", "feed"];
  const south: Bay[] = ["stall", "stall", "stall", "stall", "grooming"];
  const wingX = -site.w / 2 + 5 + blockLength(north) / 2;
  const northRect = blockRect(wingX, top(arenaRect) - LANE - BLOCK_DEPTH / 2, north, "s");
  const southRect = blockRect(wingX, bottom(arenaRect) + LANE + BLOCK_DEPTH / 2, south, "n");
  const lounge: Rect = { x: 28.25, z: 0, w: 11.5, d: 14 };
  const tack: Rect = { x: 28.5, z: 21.5, w: 7, d: 9 };
  const entrance = { side: "s" as Side, x: 10, z: site.d / 2, width: 3.5 };

  const modules: CampusModule[] = [
    {
      id: "arena", kind: "arena", key: 1, name: "Covered arena", short: "ARENA", rect: arenaRect, height: 8.4, facing: "e",
      purpose: "A full arena under a wide-span canopy, floodlit for evening batches.",
      arena: { ...arena, roof: "canopy", floodlights: true, gates: [{ side: "s", at: entrance.x - arenaRect.x, width: 3.6 }, { side: "n", at: 6, width: 3.6 }] },
      specs: [
        approved("Size", "50 m × 30 m"),
        approved("Cover", "Covered canopy"),
        approved("Floodlights", "Included in the Signature tier"),
        approved("Surface", "Laser-graded silica sand on geotextile footing"),
        approved("Boundary", "Perimeter fencing"),
        modelled("Canopy", "Shallow-pitch timber and steel roof on twelve slim columns outside the fence line; eaves about 6.5 m"),
        modelled("Entrance gates", "Main gate on the south side, service gate on the north side"),
        tbc("Floodlight count and mast height"),
      ],
    },
    {
      id: "stables-north", kind: "stable-block", key: 2, name: "North stable wing", short: "N. WING", rect: northRect, height: 3.4, facing: "s", bays: north,
      purpose: "Four of the eight stables: the north wing, fronts to the arena.",
      specs: stableSpecs(north, "Single row of four, fronts to the south", carriedGrooming),
    },
    {
      id: "stables-south", kind: "stable-block", key: 3, name: "South stable wing", short: "S. WING", rect: southRect, height: 3.4, facing: "n", bays: south,
      purpose: "Four of the eight stables: the south wing, fronts to the arena.",
      specs: stableSpecs(south, "Single row of four, fronts to the north", carriedGrooming),
    },
    {
      id: "tack", kind: "tack-room", key: 4, name: "Expanded tack room", short: "TACK", rect: tack, height: 4.2, facing: "w",
      purpose: "The expanded tack room and briefing pavilion for a larger cohort.",
      specs: tackSpecs("7 m × 9 m, single storey", [approved("Tier", "Expanded tack room")]),
    },
    {
      id: "lounge", kind: "lounge", key: 5, name: "AC lounge and viewing deck", short: "LOUNGE", rect: lounge, height: 4.6, facing: "w",
      purpose: "An air-conditioned lounge and VIP viewing deck at the east end of the arena.",
      specs: [
        approved("Lounge", "Air-conditioned"),
        approved("Viewing", "VIP viewing deck facing the arena"),
        modelled("Footprint", "Lounge 8 m × 14 m with a raised deck 3.5 m deep"),
        tbc("Capacity of the lounge and deck"),
      ],
    },
  ];

  const paths: Rect[] = [
    { x: arenaRect.x, z: top(arenaRect) - LANE / 2, w: arenaRect.w, d: LANE },
    { x: arenaRect.x, z: bottom(arenaRect) + LANE / 2, w: arenaRect.w, d: LANE },
    { x: (right(arenaRect) + left(lounge)) / 2, z: 0, w: left(lounge) - right(arenaRect), d: bottom(arenaRect) - top(arenaRect) + 2 * LANE },
    { x: entrance.x, z: (bottom(arenaRect) + site.d / 2) / 2, w: entrance.width, d: site.d / 2 - bottom(arenaRect) },
  ];

  return {
    id: "signature", name: t.name, layoutTitle: "SIGNATURE COVERED HUB", site, entrance, modules, paths, includes: t.includes,
    overview: [
      approved("Site", `${t.acres} (schematic ${site.w} m × ${site.d} m)`),
      approved("Arena", "50 m × 30 m, covered canopy"),
      approved("Stables", `${t.stables} loose boxes: south and north wings`),
      approved("Cadet capacity", `${t.cadets} cadets`),
      approved("Tier capital", t.capexLabel),
    ],
    note: "The plot is drawn as a rectangle sized to the approved acreage. Its real shape, orientation and gate positions follow the site survey.",
  };
}

/* ----------------------------------------------------------------- Royal */

function buildRoyal(): CampusTier {
  const t = tier("royal");
  const site = { acres: 1.5, acresLabel: t.acres, w: 90, d: 67.5 };
  const arena = { w: 60, d: 35 };
  const colInset = 1.8;
  const arenaRect: Rect = { x: -6, z: 0, w: arena.w + 2 * FENCE, d: arena.d + 2 * (colInset + 0.4) };
  const north: Bay[] = ["stall", "stall", "stall", "stall", "stall", "stall", "feed"];
  const south: Bay[] = ["stall", "stall", "stall", "stall", "stall", "stall", "grooming"];
  const wingX = -site.w / 2 + 9 + blockLength(north) / 2;
  const northRect = blockRect(wingX, top(arenaRect) - LANE - BLOCK_DEPTH / 2, north, "s");
  const southRect = blockRect(wingX, bottom(arenaRect) + LANE + BLOCK_DEPTH / 2, south, "n");
  const pavilion: Rect = { x: 36.5, z: 0, w: 12, d: 20 };
  const tack: Rect = { x: 34.5, z: -26, w: 8, d: 8 };
  const vet: Rect = { x: 35, z: 26.5, w: 9, d: 8 };
  const entrance = { side: "s" as Side, x: 12, z: site.d / 2, width: 4 };

  const modules: CampusModule[] = [
    {
      id: "arena", kind: "arena", key: 1, name: "Colonnaded arena", short: "ARENA", rect: arenaRect, height: 6.4, facing: "e",
      purpose: "The championship arena, framed by a stone colonnade along both long sides: a host venue for STPCI fixtures.",
      arena: { ...arena, roof: "colonnade", floodlights: false, gates: [{ side: "s", at: entrance.x - arenaRect.x, width: 4 }, { side: "n", at: 12, width: 4 }] },
      specs: [
        approved("Size", "60 m × 35 m"),
        approved("Type", "Colonnaded championship arena, the cavalry arena of the Royal Pavilion tier"),
        approved("Role", "STPCI host venue"),
        approved("Surface", "Laser-graded silica sand on geotextile footing"),
        approved("Boundary", "Perimeter fencing"),
        modelled("Colonnade", "Free-standing stone arcade, 3 m bays, along both long sides, 6.4 m to the cornice"),
        modelled("Entrance gates", "Main gate through the south colonnade, service gate on the north side"),
        tbc("Floodlights"),
      ],
    },
    {
      id: "stables-north", kind: "stable-block", key: 2, name: "North stable wing", short: "N. WING", rect: northRect, height: 3.4, facing: "s", bays: north,
      purpose: "Six of the twelve stables: the north wing, fronts to the arena.",
      specs: stableSpecs(north, "Single row of six, fronts to the south", carriedGrooming),
    },
    {
      id: "stables-south", kind: "stable-block", key: 3, name: "South stable wing", short: "S. WING", rect: southRect, height: 3.4, facing: "n", bays: south,
      purpose: "Six of the twelve stables: the south wing, fronts to the arena.",
      specs: stableSpecs(south, "Single row of six, fronts to the north", carriedGrooming),
    },
    {
      id: "tack", kind: "tack-room", key: 4, name: "Tack room", short: "TACK", rect: tack, height: 4.2, facing: "w",
      purpose: "The tack room and briefing pavilion, carried up from the lower tiers.",
      specs: tackSpecs("8 m × 8 m, single storey", [{ label: "Tier", value: "Listed for Standard and Signature; carried to the Royal tier as modelled, to be confirmed", basis: "modelled" }]),
    },
    {
      id: "vet", kind: "vet-suite", key: 5, name: "Veterinary isolation suite", short: "VET", rect: vet, height: 4.2, facing: "w",
      purpose: "Veterinary support: a separate suite for a stallion that must be kept apart.",
      specs: [
        approved("Facility", "Veterinary isolation suite"),
        approved("Tier", "Royal Pavilion"),
        modelled("Position", "Far corner from the stable wings, with its own fenced yard"),
        modelled("Footprint", "9 m × 8 m, single storey"),
        tbc("Fitting-out and number of isolation boxes"),
      ],
    },
    {
      id: "pavilion", kind: "pavilion", key: 6, name: "Royal viewing pavilion", short: "PAVILION", rect: pavilion, height: 9.6, facing: "w",
      purpose: "A two-storey viewing pavilion and gallery at the east end of the arena, with the VIP deck for school-board hospitality.",
      specs: [
        approved("Type", "Two-storey royal viewing pavilion and gallery"),
        approved("VIP deck", "Included in the Royal Pavilion tier"),
        approved("Gallery", "Elevated school-board hospitality gallery"),
        modelled("Footprint", "12 m × 20 m, two storeys"),
        tbc("Gallery seating and hospitality capacity"),
      ],
    },
  ];

  const paths: Rect[] = [
    { x: arenaRect.x, z: top(arenaRect) - LANE / 2, w: arenaRect.w, d: LANE },
    { x: arenaRect.x, z: bottom(arenaRect) + LANE / 2, w: arenaRect.w, d: LANE },
    { x: (right(arenaRect) + left(tack)) / 2, z: (top(tack) + bottom(vet)) / 2, w: left(tack) - right(arenaRect), d: bottom(vet) - top(tack) },
    { x: entrance.x, z: (bottom(arenaRect) + site.d / 2) / 2, w: entrance.width, d: site.d / 2 - bottom(arenaRect) },
  ];

  return {
    id: "royal", name: t.name, layoutTitle: "ROYAL COLONNADE ESTATE", site, entrance, modules, paths, includes: t.includes,
    overview: [
      approved("Site", `${t.acres} (schematic ${site.w} m × ${site.d} m, the 1.5-acre minimum)`),
      approved("Arena", "60 m × 35 m, colonnaded championship arena"),
      approved("Stables", `${t.stables} loose boxes plus a veterinary isolation suite`),
      approved("Cadet capacity", `${t.cadets} cadets`),
      approved("Tier capital", t.capexLabel),
    ],
    note: "The Royal tier is open-ended ('1.5+ acres'). The model draws the 1.5-acre minimum; a larger plot adds space, not facilities. The plot shape follows the site survey.",
  };
}

export const campusTiers: Record<TierId, CampusTier> = { standard: buildStandard(), signature: buildSignature(), royal: buildRoyal() };
export const campusTierList: CampusTier[] = [campusTiers.standard, campusTiers.signature, campusTiers.royal];
export const campusModuleById = (t: CampusTier, id: string) => t.modules.find((m) => m.id === id);

/* ------------------------------------------------------------ page copy */

export const campusCopy = {
  inscription: "THE CAMPUS,",
  voice: "to scale.",
  lede: "Every hub is built from the same parts: an arena, stable blocks, and the few buildings that serve them. Choose a tier and the model rebuilds. Select any building to read what the requirements say about it.",
  footnote:
    "A schematic model of the approved tier requirements. Figures marked As modelled are drawing decisions, not BSAH requirements; figures marked To be confirmed are awaiting BSAH sign-off. Trees and paving are model staging only.",
};

/* --------------------------------------------------------------- checks */

export type Issue = { tier: TierId; message: string };

const inside = (r: Rect, w: number, d: number) => left(r) >= -w / 2 - 1e-6 && right(r) <= w / 2 + 1e-6 && top(r) >= -d / 2 - 1e-6 && bottom(r) <= d / 2 + 1e-6;
const overlap = (a: Rect, b: Rect, tol = 1e-6) => left(a) < right(b) - tol && right(a) > left(b) + tol && top(a) < bottom(b) - tol && bottom(a) > top(b) + tol;

/** Geometry checks the test runs: the data must describe a model that fits its own plot. */
export function validateCampus(): Issue[] {
  const issues: Issue[] = [];
  for (const t of campusTierList) {
    const push = (message: string) => issues.push({ tier: t.id, message });
    const area = t.site.w * t.site.d;
    const target = t.site.acres * SQM_PER_ACRE;
    if (Math.abs(area - target) / target > 0.005) push(`site area ${area.toFixed(1)} m² is not ${t.site.acres} acre (${target.toFixed(1)} m²) within 0.5%`);
    const source = tier(t.id);
    const stalls = t.modules.filter((m) => m.kind === "stable-block").reduce((n, m) => n + stallCount(m.bays ?? []), 0);
    if (stalls !== source.stables) push(`stall count ${stalls} does not match the tier table (${source.stables})`);
    if (t.name !== source.name) push("tier name differs from the tier table");
    for (const m of t.modules) {
      if (!inside(m.rect, t.site.w, t.site.d)) push(`${m.id} lies outside the site`);
      if (m.kind === "stable-block" && m.bays) {
        const len = blockLength(m.bays);
        const along = m.facing === "n" || m.facing === "s" ? m.rect.w : m.rect.d;
        if (Math.abs(along - len) > 0.01) push(`${m.id} length ${along} does not match ${m.bays.length} bays`);
      }
      if (m.arena) {
        if (m.rect.w < m.arena.w || m.rect.d < m.arena.d) push("arena footprint is smaller than the arena surface");
      }
      if (m.specs.some((s) => s.basis === "tbc" && s.value !== TBC && !/to be confirmed/i.test(s.value))) push(`${m.id} has a tbc spec without the words "to be confirmed"`);
    }
    for (let i = 0; i < t.modules.length; i++) {
      for (let j = i + 1; j < t.modules.length; j++) {
        if (overlap(t.modules[i].rect, t.modules[j].rect)) push(`${t.modules[i].id} overlaps ${t.modules[j].id}`);
      }
    }
    for (const [i, p] of t.paths.entries()) {
      if (!inside(p, t.site.w, t.site.d)) push(`path ${i} lies outside the site`);
      for (const m of t.modules) if (overlap(p, m.rect, 0.05)) push(`path ${i} runs through ${m.id}`);
    }
    const keys = t.modules.map((m) => m.key).sort((a, b) => a - b);
    if (keys.some((k, i) => k !== i + 1)) push("plan key numbers are not 1..n");
    const ids = new Set(t.modules.map((m) => m.id));
    if (ids.size !== t.modules.length) push("duplicate module ids");
  }
  return issues;
}
