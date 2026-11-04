export type ViewMode = "combined" | "horse" | "rider";
export type CameraId = "beauty" | "profile" | "three-quarter" | "rear" | "front" | "top";
export type HotspotId = "spine" | "pelvis" | "shoulder" | "hindquarters" | "rider-pelvis" | "hoof";

export const VIEWS: { id: ViewMode; label: string }[] = [
  { id: "combined", label: "Horse and rider" },
  { id: "horse", label: "Horse" },
  { id: "rider", label: "Rider" },
];

/** Camera angles: azimuth (0 = the horse's right side, 90 = from the front, -90 = from behind), elevation, and how far back. */
export const CAMERAS: { id: CameraId; label: string; az: number; el: number; fit: number }[] = [
  { id: "profile", label: "Side", az: 0, el: 6, fit: 1 },
  { id: "three-quarter", label: "Three-quarter", az: -38, el: 11, fit: 0.9 },
  { id: "rear", label: "Behind", az: -90, el: 7, fit: 0.78 },
  { id: "front", label: "Front", az: 90, el: 7, fit: 0.78 },
  { id: "top", label: "Above", az: -90, el: 78, fit: 0.9 },
  { id: "beauty", label: "Opening", az: 24, el: 9, fit: 1.04 },
];

/**
 * UI state shared by the page's controls and the 3D stage. The stage reads these fields every frame; React reads them through
 * `subscribe`. Scroll progress is written without notifying (it changes on every scroll event and nothing in React draws it).
 */
export class StrideStore {
  view: ViewMode = "combined";
  camera: CameraId = "beauty";
  skeleton = false;
  hotspot: HotspotId | null = null;
  /** The narrative position, 0 (opening) to 1 (laboratory): drives the camera until the visitor takes it over. */
  story = 0;
  /** The visitor chose a camera angle, a hotspot, or dragged the view: the story no longer steers. */
  manual = false;
  /** Share of the width the laboratory panel covers, and of the height the dock covers, 0..1: the stage keeps the horse clear of them. */
  inset = 0;
  dock = 0;
  /** Set by the stage (`bindRender`) so changes made outside the loop render. */
  requestRender: () => void = () => {};
  bindRender(fn: () => void) {
    this.requestRender = fn;
  }

  private readonly listeners = new Set<() => void>();
  private version = 0;

  subscribe = (fn: () => void) => {
    this.listeners.add(fn);
    return () => void this.listeners.delete(fn);
  };
  getVersion = () => this.version;

  patch(next: Partial<Pick<StrideStore, "view" | "camera" | "skeleton" | "hotspot" | "manual">>) {
    Object.assign(this, next);
    this.version++;
    for (const fn of this.listeners) fn();
    this.requestRender();
  }

  setStory(value: number, inset: number, dock: number) {
    if (Math.abs(value - this.story) < 1e-4 && Math.abs(inset - this.inset) < 1e-4 && Math.abs(dock - this.dock) < 1e-4) return;
    this.story = value;
    this.inset = inset;
    this.dock = dock;
    this.requestRender();
  }
}
