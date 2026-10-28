import { sampleCyclic } from "./analysis";
import type { StrideData } from "./rig";
import type { HotspotId } from "./store";

export type Readout = { key: string; label: string; value: (phase: number) => string };

const signed = (v: number, d: number, unit: string) => `${v >= 0 ? "+" : "−"}${Math.abs(v).toFixed(d)} ${unit}`;

/** Live numbers for each hotspot, read from the sampled animation at the clock's phase. */
export function hotspotReadouts(id: HotspotId, data: StrideData): Readout[] {
  const c = data.channels;
  const j = data.joints;
  const range = (k: keyof StrideData["joints"]) => `${j[k].min.toFixed(0)}° to ${j[k].max.toFixed(0)}°`;
  switch (id) {
    case "spine":
      return [
        { key: "v", label: "Saddle height", value: (p) => signed(sampleCyclic(c.vertical.horse, p), 1, "mm") },
        { key: "t", label: "Back tilts forward and back", value: (p) => signed(sampleCyclic(c.pitch.horse, p), 2, "°") },
      ];
    case "pelvis":
      return [
        { key: "r", label: "Back tilts side to side", value: (p) => signed(sampleCyclic(c.roll.horse, p), 2, "°") },
        { key: "l", label: "Saddle moves sideways", value: (p) => signed(sampleCyclic(c.lateral.horse, p), 1, "mm") },
      ];
    case "shoulder":
      return [
        { key: "e", label: "Elbow angle", value: (p) => `${sampleCyclic(j.elbow.series, p).toFixed(0)}°` },
        { key: "k", label: "Knee angle", value: (p) => `${sampleCyclic(j.carpus.series, p).toFixed(0)}°` },
        { key: "rg", label: "Range over the stride", value: () => `elbow ${range("elbow")}, knee ${range("carpus")}` },
      ];
    case "hindquarters":
      return [
        { key: "s", label: "Stifle angle", value: (p) => `${sampleCyclic(j.stifle.series, p).toFixed(0)}°` },
        { key: "h", label: "Hock angle", value: (p) => `${sampleCyclic(j.hock.series, p).toFixed(0)}°` },
        { key: "rg", label: "Range over the stride", value: () => `stifle ${range("stifle")}, hock ${range("hock")}` },
      ];
    case "rider-pelvis":
      return [
        { key: "v", label: "Pelvis height", value: (p) => signed(sampleCyclic(c.vertical.rider, p), 1, "mm") },
        { key: "t", label: "Pelvis tilts forward and back", value: (p) => signed(sampleCyclic(c.pitch.rider, p), 2, "°") },
        { key: "lag", label: "Follows the saddle", value: () => `about ${Math.round(data.seatLagMs)} ms later` },
      ];
    case "hoof": {
      const s = data.stance.FR;
      return [
        {
          key: "state",
          label: "Right fore hoof",
          value: (p) => {
            const idx = Math.floor(p * data.samples) % data.samples;
            return s.mask[idx] ? "on the ground" : "in the air";
          },
        },
        { key: "duty", label: "On the ground", value: () => `${Math.round(s.duty * 100)}% of the stride` },
        { key: "drift", label: "Moves over the ground while planted", value: () => `${data.feet.FR.driftCm.toFixed(1)} cm (the clip as authored: ${data.feetAuthored.FR.driftCm.toFixed(1)} cm)` },
      ];
    }
  }
}
