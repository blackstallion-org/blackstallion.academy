import type { HubSlug } from "./fleet";
import { hubs, hubStatusLabel, tierById } from "./schools";
import { mapPlaces, type MapPlace } from "./india-map";

/**
 * Data for the satellite map in the Zones section of /schools (components/sections/schools/SatelliteZoneMap.tsx).
 * Nothing is invented here. Hub copy, tiers and planning figures come from `hubs` in schools.ts; circuit and heritage markers come from
 * `mapPlaces` in india-map.ts (whose coordinates sit in india-map-places.json). The three Hyderabad coordinates below are the ones the
 * previous diorama printed on its cards (17.3912, 78.3568 and so on); each was checked against the published centre of its
 * neighbourhood. They mark an area, within about a kilometre, not a surveyed parcel, and no hub has a site yet.
 * Zone boundaries are deliberately absent: the project has no surveyed boundary for any zone, so none is drawn. The animated ring
 * around a marker is a marker halo, not a boundary.
 */

export type HubId = "01A" | "01B" | "01C";

/** [longitude, latitude] of the neighbourhood the hub is proposed for. */
export const hubCoordinates: Record<HubSlug, { id: HubId; lonLat: [number, number]; bearing: number }> = {
  "zone-01a-financial-district": { id: "01A", lonLat: [78.3568, 17.3912], bearing: -28 },
  "zone-01c-gachibowli": { id: "01C", lonLat: [78.3489, 17.4401], bearing: 24 },
  "zone-01b-begumpet": { id: "01B", lonLat: [78.4664, 17.4447], bearing: -12 },
};

/** The order the tour visits the hubs in: west to east across the city. */
export const tourOrder: HubId[] = ["01C", "01A", "01B"];

export type SatellitePlace = {
  id: string;
  kind: "hub" | "circuit" | "heritage";
  label: string;
  lonLat: [number, number];
  eyebrow: string;
  title: string;
  location: string;
  /** What this marker is, and that it is not an operating campus or an agreement. */
  status: string;
  body: string;
  facts: { k: string; v: string }[];
  link?: { label: string; href: string };
  hubId?: HubId;
};

export const hubPlaces: SatellitePlace[] = hubs.map((h) => {
  const c = hubCoordinates[h.slug];
  return {
    id: `hub-${c.id}`,
    kind: "hub",
    label: `${c.id} ${h.area}`,
    lonLat: c.lonLat,
    eyebrow: `Zone ${c.id} · ${tierById(h.tier).name}`,
    title: h.name.replace(/^Zone \w+ · /, ""),
    location: `${h.area}, Hyderabad`,
    status: hubStatusLabel[h.status],
    body: h.note,
    facts: [
      { k: "Stallions", v: `${h.stallions} (planning figure)` },
      { k: "Cadets", v: `${h.cadets} (planning figure)` },
      { k: "Marker", v: `${c.lonLat[1].toFixed(4)}° N, ${c.lonLat[0].toFixed(4)}° E · area, not a site` },
    ],
    link: { label: "Open the hub page", href: `/schools/${h.slug}` },
    hubId: c.id,
  };
});

const circuitPlace = (p: MapPlace): SatellitePlace => ({
  id: `${p.kind}-${p.id}`,
  kind: p.kind === "circuit" ? "circuit" : "heritage",
  label: p.label,
  lonLat: [p.lon, p.lat],
  eyebrow: p.eyebrow,
  title: p.title,
  location: p.location,
  status: p.status,
  body: p.body,
  facts: p.facts,
  link: p.id === "hyderabad" ? undefined : p.link,
});

/** The six circuits and two heritage places of the India view (the same markers as the relief model on the first screen). */
export const nationalPlaces: SatellitePlace[] = mapPlaces.map(circuitPlace);

export const allPlaces: SatellitePlace[] = [...hubPlaces, ...nationalPlaces];

/** Camera presets. The India view is fitted to the country's bounds, the Hyderabad view to the three hubs. */
export const views = {
  india: { bounds: [[68.2, 6.6], [97.5, 35.8]] as [[number, number], [number, number]] },
  hyderabad: { bounds: [[78.3, 17.34], [78.52, 17.5]] as [[number, number], [number, number]] },
};

export const satelliteCopy = {
  region: "Satellite map of Hyderabad and India with three proposed Hyderabad hubs, six planned circuits and two heritage places",
  views: { hyderabad: "Hyderabad", india: "All India" },
  tour: "Replay tour",
  stopTour: "Stop tour",
  reset: "Reset view",
  fullScreen: "Full screen",
  exitFull: "Exit full screen",
  close: "Close",
  hint: "Ctrl or ⌘ + scroll to zoom · drag to move. On a phone, use two fingers.",
  noKey: "The satellite view is switched off until a MapTiler key is set.",
  noGl: "The satellite view needs WebGL, which this device or browser has switched off. The same hubs are listed beside it.",
  loadFail: "The satellite imagery could not be loaded just now. The same hubs are listed beside it.",
  sources:
    "Imagery and labels: MapTiler Hybrid, with satellite and OpenStreetMap data. Marker positions are neighbourhood-level and the borders drawn are the provider's, not an authority on boundaries.",
};
