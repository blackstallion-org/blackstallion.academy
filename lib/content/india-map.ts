import places from "./india-map-places.json";
import { network } from "./schools";

/**
 * Copy and markers for the national sculpture on /schools (components/sections/schools/india-map).
 * Every marker is either one of the six target circuits (the same corridors the Pan-India section lists, shown as prospects:
 * no campus is operating anywhere on this map) or a heritage place the site already writes about (anatomy.ts, academy.ts).
 * Nothing here is a school, a signed partner or an invented campus. Coordinates live in india-map-places.json, which the
 * data build also reads to check each point lies inside India's outline.
 */

/** How much the relief is exaggerated; the data build (scripts/build-india-map.py) writes the same number into meta.json and a test keeps them equal. */
export const MAP_EXAGGERATION = 12;

/** The palette of the brief. These are the physical materials of the model, not UI colours. */
export const mapPalette = {
  land: "#D8CEAB",
  sandstone: "#E7D9B6",
  highlight: "#F0E7D1",
  shadow: "#A99E87",
  ocean: "#102D35",
  river: "#66BDD0",
  background: "#10191B",
} as const;

export type MapPlace = {
  id: string;
  /** Text on the floating pill. */
  label: string;
  kind: "circuit" | "heritage";
  lon: number;
  lat: number;
  eyebrow: string;
  title: string;
  location: string;
  body: string;
  facts: { k: string; v: string }[];
  /** Plain statement of what this marker is not. */
  status: string;
  link?: { label: string; href: string };
};

const coords = new Map(places.map((p) => [p.id, p]));
const at = (id: string) => {
  const p = coords.get(id);
  if (!p) throw new Error(`india-map: unknown place ${id}`);
  return p;
};

/** Which place stands for each circuit of the network, and how to say where it is. */
const anchors: Record<string, { id: string; location: string; body: string; link?: MapPlace["link"] }> = {
  "01": {
    id: "hyderabad",
    location: "Hyderabad, Telangana",
    body: "The first circuit, and the one with a plan on paper: three proposed corridors around Hyderabad, with sample planning figures (not operating campuses).",
    link: { label: "See the three Hyderabad corridors", href: "#hubs" },
  },
  "02": { id: "new-delhi", location: "New Delhi, National Capital Region", body: "Gurugram, Greater Noida and the diplomatic and heritage-school belt of New Delhi: three target corridors." },
  "03": { id: "mumbai", location: "Mumbai, Maharashtra", body: "From the metropolitan day schools of Mumbai and Pune to the residential plateau at Panchgani and Mahabaleshwar." },
  "04": { id: "bengaluru", location: "Bengaluru, Karnataka", body: "Two Bengaluru belts for new international campuses, and the century-old hill boarding schools of Ooty and Kodaikanal." },
  "05": { id: "dehradun", location: "Dehradun, Uttarakhand", body: "The boarding-school north: the Doon Valley, the Ajmer–Jaipur royal corridor and the ridges around Shimla and Solan." },
  "06": { id: "kolkata", location: "Kolkata, West Bengal", body: "Heritage schools of Kolkata, and the progressive residential campuses of the Malwa plateau around Indore and Bhopal." },
};

const circuits: MapPlace[] = network.map((zone) => {
  const a = anchors[zone.code];
  const p = at(a.id);
  return {
    id: p.id,
    label: p.label,
    kind: "circuit",
    lon: p.lon,
    lat: p.lat,
    eyebrow: `Circuit ${zone.code} · target corridor`,
    title: zone.name,
    location: a.location,
    body: a.body,
    facts: zone.subzones.map((s) => ({ k: s.code, v: s.name })),
    status: "A target corridor, not a campus. No hub is contracted here and no partnership is implied for any institution in it.",
    link: a.link,
  };
});

const heritage: MapPlace[] = [
  {
    id: "marwar",
    label: "Marwar",
    kind: "heritage",
    lon: at("marwar").lon,
    lat: at("marwar").lat,
    eyebrow: "Heritage · where the Marwari comes from",
    title: "Marwar, Rajasthan",
    location: "Around Jodhpur, western Rajasthan",
    body: "The homeland of the Marwari, the breed the academy is built around.",
    facts: [
      { k: "Origin", v: "Marwar, Rajasthan, India" },
      { k: "Registry", v: "Marwari Horse Society; government-authorised registration since 2009" },
    ],
    status: "A place on the map of the breed, not a BSAH site.",
  },
  {
    id: "jaipur",
    label: "Jaipur",
    kind: "heritage",
    lon: at("jaipur").lon,
    lat: at("jaipur").lat,
    eyebrow: "Heritage · where the instructors come from",
    title: "Jaipur, Rajasthan",
    location: "Jaipur, Rajasthan",
    body: "The Indian Army's 61st Cavalry is stationed here. Its retired non-commissioned officers are one of the pools the academy's faculty plan names.",
    facts: [{ k: "Faculty plan", v: "Retired RVC, 61st Cavalry JCOs and NCOs, NCC Equestrian Wings" }],
    status: "A recruitment pipeline the academy is aiming at, not an agreement with any unit or person.",
  },
];

export const mapPlaces: MapPlace[] = [...circuits, ...heritage];

export const mapCopy = {
  regionLabel: "Interactive relief map of India with six target circuits and two heritage places",
  hintPointer: "Drag to turn · Ctrl or ⌘ + scroll, or the buttons, to zoom · Shift + drag to move",
  hintTouch: "Drag sideways to turn · pinch to zoom · two fingers to move",
  hintKeys: "Arrow keys turn it, + and − zoom, Esc returns to the whole country.",
  reset: "Whole country",
  zoomIn: "Zoom in",
  zoomOut: "Zoom out",
  close: "Close",
  legend: [
    { key: "circuit", label: "Target circuit" },
    { key: "heritage", label: "Heritage place" },
  ],
  loading: "Casting the model",
  fallbackNote: "The 3D model needs WebGL, which this device or browser has switched off. The same places are listed here.",
  noMotionNote: "Motion is reduced: the camera moves to a marker in one step and the rivers do not flow.",
  sources: `Outline: Natural Earth 1:10m, India point of view (public domain), drawn as India draws it; illustrative, not an authority on boundaries. Terrain: Terrain Tiles (SRTM and other public sources, via Mapzen) with the relief exaggerated ${MAP_EXAGGERATION} times. Rivers: Natural Earth. Mahanadi is not in the river dataset and is not shown.`,
};
