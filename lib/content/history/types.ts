/**
 * Typed specifications for the illustrated history scrolls (/history/india, /history/world, /story/rani-lakshmibai,
 * /story/alexander-bucephalus). Plan and acceptance gates: docs/history-scrolls/PLAN.md.
 */

export type LayerRole = "B" | "S" | "F";
export type AssetStatus = "pending" | "candidate" | "accepted" | "rejected";

/** One master image in docs/history-scrolls/ASSET_LEDGER.json. */
export type AssetSpec = {
  id: string;
  role: LayerRole | "opening" | "shared" | "poster";
  path: string;
  width: number;
  height: number;
  alpha: boolean;
  alt: string;
  focal?: string;
  version: number;
  status: AssetStatus;
  prompt: string;
  review?: string;
};

/** Placement of a subject layer in percentages of the art box: `b` is its foot above the bottom edge. */
export type Placement = { x?: string; r?: string; b: string; w: string };

export type SourceRef = { label: string; detail?: string };

export type ReliefId = "IN01" | "WO02" | "JH01" | "AL04";

export type Scene = {
  id: string;
  anchor: string;
  label: string;
  title: string;
  body: string[];
  /** What the scene cannot claim: tradition, debate or reconstruction. Always shown beside the narrative. */
  qualification?: string;
  /** A reconstructed everyday scene, labelled as an artistic interpretation. */
  interpretation?: boolean;
  sources: SourceRef[];
  /** Asset ids for the background plate, the separate subject and the foreground that crosses the next join. */
  layers: { B: string; S: string; F: string };
  subject: { d: Placement; m?: Placement };
  /** Reading area side on desktop; the subject is placed on the other side. */
  side: "left" | "right";
  relief?: ReliefId;
};

export type Chapter = { id: string; numeral: string; title: string; scenes: Scene[] };

export type Photo = { src: string; width: number; height: number; alt: string; caption: string; credit: string; creditHref: string };

export type RelatedLink = { href: string; label: string; blurb: string };

export type HistoryPage = {
  route: string;
  format: "anthology" | "personal";
  title: string;
  description: string;
  opening: {
    label: string;
    inscription: string;
    voice: string;
    lede: string;
    asset?: string;
    /** Ledger id of the full-screen key art that opens the page (components/film/StoryPoster); the title card follows. */
    poster?: string;
  };
  chapters: Chapter[];
  afterword?: { label: string; inscription: string; voice: string; paragraphs: string[] };
  /** A photograph of a real statue, shown before the afterword: public/images/..., with its licence and photographer. */
  statue?: Photo;
  /** A standalone section with a photograph (not a painted scene), shown after the scenes of an anthology. */
  feature?: { id: string; label: string; inscription: string; voice: string; paragraphs: string[]; qualification?: string; sources: SourceRef[]; photo: Photo };
  related: RelatedLink[];
};

export type ReliefSpec = {
  id: ReliefId;
  /** "plate": the accepted background plate on a shallow mesh displaced by its depth map. "map": a modelled map. */
  kind: "plate" | "map";
  title: string;
  /** Where the relief sits inside the art box, in percent; the flat plate stays visible everywhere else. */
  bounds: { x: number; y: number; w: number; h: number };
  /** Bounds in the phone/tablet art box (4:3) when they differ. */
  mobile?: { x: number; y: number; w: number; h: number };
  /** Orthographic camera: start and end azimuth (radians) and zoom, interpolated by scroll progress. */
  camera: { azimuth: [number, number]; elevation: number; zoom: [number, number] };
  units: string;
  provenance: string;
  fallback: string;
};
