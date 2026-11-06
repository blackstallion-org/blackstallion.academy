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

export class FrameGovernor {
  private samples: number[] = [];
  private goodFor = 0;
  private lastChange = 0;
  fps = 60;
  constructor(public tier: TierName, private onChange: (t: TierName) => void, private budgetMs = 1000 / 45) {}

  /** Feed one frame's duration (ms) and the current time (s). */
  tick(ms: number, now: number) {
    if (ms > 250) return; // a tab switch, not a slow frame
    this.samples.push(ms);
    if (this.samples.length > 60) this.samples.shift();
    if (this.samples.length < 30) return;
    const sorted = [...this.samples].sort((a, b) => a - b);
    const median = sorted[sorted.length >> 1];
    this.fps = 1000 / median;
    if (now - this.lastChange < 2) return;
    const i = ORDER.indexOf(this.tier);
    if (median > this.budgetMs * 1.12 && i > 0) {
      this.set(ORDER[i - 1], now);
    } else if (median < this.budgetMs * 0.6) {
      this.goodFor += ms / 1000;
      if (this.goodFor > 6 && i < ORDER.length - 1) this.set(ORDER[i + 1], now);
    } else {
      this.goodFor = 0;
    }
  }
  private set(t: TierName, now: number) {
    this.tier = t;
    this.lastChange = now;
    this.goodFor = 0;
    this.samples.length = 0;
    this.onChange(t);
  }
}
