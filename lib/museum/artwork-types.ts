export type GalleryWall = "left" | "right";

export interface ArtworkImage {
  /** Display image (path under /public). Used for the 3D texture and the catalogue. */
  src: string;
  /** Smaller display image for phones and tablets (the low quality tier). */
  srcSmall?: string;
  /** Pixel size of `src`; its ratio is the plate's displayed aspect ratio. */
  width: number;
  height: number;
  /** Describes what the plate shows, for screen readers. */
  alt: string;
}

/** Physical size of the plate; only the ratio between plates matters in the 3D corridor. */
export interface PhysicalSize {
  widthCm: number;
  heightCm: number;
}

/**
 * One plate on the museum wall. Every label is written from the breed history in lib/content/legend.ts;
 * anything that is folklore says so in `facts` ("Basis").
 */
export interface Painting {
  id: string;
  title: string;
  image: ArtworkImage;
  /** Chapter of the Marwari story the plate belongs to, e.g. "II · Marwar, 1193". */
  chapter: string;
  /** Label lines: the first line is set as an italic lead, the rest as body text. */
  description: string;
  /** Term / value pairs shown under the label, e.g. ["Basis", "Folklore as told in Marwar"]. */
  facts: readonly (readonly [string, string])[];
  /** Used to scale plates relative to each other in the 3D gallery. */
  physicalSize: PhysicalSize;
  /** Which corridor wall the plate hangs on. Defaults to alternating by order, starting on the left. */
  wall?: GalleryWall;
  /** Hanging order along the corridor, starting at 1 nearest the entrance. */
  order: number;
}
