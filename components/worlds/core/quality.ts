/**
 * Quality tiers. The starting tier comes from the device (lib/3d/device-tier: phones and low-core machines start at "low"),
 * then the runtime moves one step at a time on measured frame time: down when the median frame runs over budget for a second,
 * up only after several seconds of headroom (hysteresis, so it does not oscillate).
 */
export type TierName = "high" | "medium" | "low";

export type QualitySettings = {
  tier: TierName;
  /** device-pixel-ratio cap */
  dpr: number;
  shadows: boolean;
  shadowSize: number;
  bloom: boolean;
  /** 0..1 density of instanced vegetation, particles, crowds */
  density: number;
  /** textures: "hi" (2-4K) or "lo" (1K) variants */
  textures: "hi" | "lo";
  /** render both worlds and mix them during a transition (otherwise a cheaper fade through the transition colour) */
  dualRender: boolean;
};

export const TIERS: Record<TierName, QualitySettings> = {
  high: { tier: "high", dpr: 1.5, shadows: true, shadowSize: 2048, bloom: true, density: 1, textures: "hi", dualRender: true },
  medium: { tier: "medium", dpr: 1.15, shadows: true, shadowSize: 1024, bloom: true, density: 0.6, textures: "hi", dualRender: true },
  low: { tier: "low", dpr: 1, shadows: false, shadowSize: 512, bloom: false, density: 0.32, textures: "lo", dualRender: false },
};
const ORDER: TierName[] = ["low", "medium", "high"];
const MIN_SCALE = 0.7;

export class FrameGovernor {
  private samples: number[] = [];
  private goodFor = 0;
  private lastChange = 0;
  private startedAt = -1;
  /** true while the visitor has chosen the light mode: the governor leaves the tier alone */
  locked = false;
  fps = 60;
  /** resolution multiplier (MIN_SCALE..1): a slow device loses pixels (soft edges, same scene) before it loses a whole tier */
  scale = 1;
  constructor(public tier: TierName, private onChange: (t: TierName) => void, private budgetMs = 1000 / 45, private onScale: (s: number) => void = () => {}) {}

  /** Set the tier from outside (the light mode) without waiting for measurements. */
  force(t: TierName) {
    this.tier = t;
    this.scale = 1;
    this.samples.length = 0;
    this.goodFor = 0;
  }

  /** Feed one frame's duration (ms) and the current time (s). */
  tick(ms: number, now: number) {
    if (this.locked) return;
    if (ms > 250) return; // a tab switch, not a slow frame
    if (this.startedAt < 0) this.startedAt = now;
    if (now - this.startedAt < 1.5) return; // shader compiles and first uploads in the first second and a half are not the device's real speed
    this.samples.push(ms);
    if (this.samples.length > 60) this.samples.shift();
    if (this.samples.length < 20) return;
    const sorted = [...this.samples].sort((a, b) => a - b);
    const median = sorted[sorted.length >> 1];
    this.fps = 1000 / median;
    if (now - this.lastChange < 1.2) return;
    const i = ORDER.indexOf(this.tier);
    if (median > this.budgetMs * 1.12) {
      // far over budget (under about 28 fps): losing pixels will not be enough, drop a whole tier at once
      if (median > this.budgetMs * 1.55 && i > 0) this.set(ORDER[i - 1], now);
      else if (this.scale > MIN_SCALE + 0.01) this.setScale(Math.max(MIN_SCALE, this.scale - 0.15), now);
      else if (i > 0) this.set(ORDER[i - 1], now);
    } else if (median < this.budgetMs * 0.6) {
      this.goodFor += ms / 1000;
      if (this.goodFor > 6) {
        if (this.scale < 1) this.setScale(Math.min(1, this.scale + 0.15), now);
        else if (i < ORDER.length - 1) this.set(ORDER[i + 1], now);
      }
    } else {
      this.goodFor = 0;
    }
  }
  private setScale(s: number, now: number) {
    this.scale = s;
    this.lastChange = now;
    this.goodFor = 0;
    this.samples.length = 0;
    this.onScale(s);
  }
  private set(t: TierName, now: number) {
    this.tier = t;
    this.scale = 0.85; // a new tier starts a little under full resolution; it climbs back if there is room
    this.lastChange = now;
    this.goodFor = 0;
    this.samples.length = 0;
    this.onChange(t);
  }
}
