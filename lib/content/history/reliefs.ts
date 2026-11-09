import type { ReliefId, ReliefSpec } from "./types";

/**
 * The four painted reliefs (components/history-scroll/reliefs/ReliefCanvas.tsx), all orthographic, matte and unlit.
 * IN01, WO02 and JH01 are plate reliefs: the scene's own accepted background painting laid on a shallow mesh displaced
 * by a depth map made from it (scripts/history-relief-depth.py), so the fort or the range rises out of the painting it
 * is painted in and is never drawn twice. AL04 is a modelled map. Without WebGL, or before the plate is accepted, the
 * flat painting shows. Provenance in artifacts/history-scrolls/3d/RELIEFS.md.
 */
export const RELIEFS: Record<ReliefId, ReliefSpec> = {
  IN01: {
    id: "IN01",
    kind: "plate",
    title: "Thar terrain with a distant fort",
    bounds: { x: 0, y: 0, w: 100, h: 100 },
    camera: { azimuth: [-0.07, 0.07], elevation: 0.035, zoom: [1, 1.03] },
    units: "Plate width = 1 unit; displacement up to 0.055 units",
    provenance: "IN01-B (Higgsfield, accepted) on a 256×144 mesh displaced by in01-b-depth.webp.",
    fallback: "IN01-B",
  },
  WO02: {
    id: "WO02",
    kind: "plate",
    title: "Silk Road mountain pass",
    bounds: { x: 0, y: 0, w: 100, h: 100 },
    camera: { azimuth: [0.07, -0.07], elevation: 0.035, zoom: [1, 1.03] },
    units: "Plate width = 1 unit; displacement up to 0.055 units",
    provenance: "WO02-B (Higgsfield, accepted) on a 256×144 mesh displaced by wo02-b-depth.webp. A generic high pass of the Pamirs, unlabelled.",
    fallback: "WO02-B",
  },
  JH01: {
    id: "JH01",
    kind: "plate",
    title: "Jhansi fort and Bundelkhand terrain",
    bounds: { x: 0, y: 0, w: 100, h: 100 },
    camera: { azimuth: [-0.07, 0.06], elevation: 0.035, zoom: [1, 1.03] },
    units: "Plate width = 1 unit; displacement up to 0.055 units",
    provenance:
      "JH01-B (Higgsfield, accepted) on a 256×144 mesh displaced by jh01-b-depth.webp. The plate follows the ASI description of Jhansi fort: curtain walls and bastions on the crest of a single granite hill (Bangra) above the walled town and its tank.",
    fallback: "JH01-B",
  },
  AL04: {
    id: "AL04",
    kind: "map",
    title: "Alexander's route, Pella to the Hydaspes",
    bounds: { x: 3, y: 8, w: 58, h: 36 },
    mobile: { x: 3, y: 5, w: 94, h: 50 },
    camera: { azimuth: [-0.06, 0.06], elevation: 1.15, zoom: [1, 1.04] },
    units: "Equirectangular, longitude 18°E–78°E, latitude 24°N–44°N; heights schematic",
    provenance:
      "Route stops placed at published coordinates of the ancient sites (Pella, the Hellespont crossing, Issus, Tyre, Memphis, Alexandria, Gaugamela, Babylon, Persepolis, Bactra, Taxila, the Hydaspes). Seas drawn as simplified outlines for orientation only; no political borders.",
    fallback: "AL04-B",
  },
};

/** Route stops for AL04 (degrees). Labels are rendered as HTML, not baked into the scene. */
export const ALEXANDER_ROUTE: { name: string; lon: number; lat: number; year?: string; below?: boolean }[] = [
  { name: "Pella", lon: 22.52, lat: 40.76, year: "336 BC" },
  { name: "Hellespont", lon: 26.4, lat: 40.2, year: "334 BC", below: true },
  { name: "Issus", lon: 36.2, lat: 36.85, year: "333 BC" },
  { name: "Tyre", lon: 35.2, lat: 33.27, year: "332 BC" },
  { name: "Memphis", lon: 31.25, lat: 29.85, below: true },
  { name: "Alexandria", lon: 29.92, lat: 31.2, year: "331 BC" },
  { name: "Gaugamela", lon: 43.25, lat: 36.36, year: "331 BC" },
  { name: "Babylon", lon: 44.42, lat: 32.54, below: true },
  { name: "Persepolis", lon: 52.89, lat: 29.93, year: "330 BC" },
  { name: "Bactra", lon: 66.9, lat: 36.76, year: "329 BC" },
  { name: "Taxila", lon: 72.79, lat: 33.74, below: true },
  { name: "Hydaspes", lon: 73.73, lat: 32.94, year: "326 BC" },
];

export const MAP_EXTENT = { lon: [18, 78] as const, lat: [24, 44] as const };
