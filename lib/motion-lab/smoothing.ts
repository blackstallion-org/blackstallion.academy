import { KP_COUNT, VISIBLE_SCORE } from "./skeleton";
import type { Pose } from "./types";

/** One Euro filter (Casiez et al. 2012): little lag when moving fast, little jitter when still. Used for the drawn skeleton only. */
class OneEuro {
  private x = 0; private dx = 0; private t = 0; private init = false;
  constructor(private minCutoff: number, private beta: number, private dCutoff = 1) {}
  private alpha(cutoff: number, dt: number) { const tau = 1 / (2 * Math.PI * cutoff); return 1 / (1 + tau / dt); }
  filter(v: number, tMs: number): number {
    if (!this.init) { this.x = v; this.dx = 0; this.t = tMs; this.init = true; return v; }
    const dt = Math.max(1e-3, (tMs - this.t) / 1000);
    this.t = tMs;
    const rate = (v - this.x) / dt;
    this.dx += this.alpha(this.dCutoff, dt) * (rate - this.dx);
    const a = this.alpha(this.minCutoff + this.beta * Math.abs(this.dx), dt);
    this.x += a * (v - this.x);
    return this.x;
  }
}

/** Smooths each visible keypoint's x and y over time. Stored measurements stay raw; only the overlay uses this. */
export class PoseSmoother {
  private fx: OneEuro[] = []; private fy: OneEuro[] = [];
  constructor(private minCutoff = 1.2, private beta = 0.02) { this.reset(); }
  reset() {
    this.fx = Array.from({ length: KP_COUNT }, () => new OneEuro(this.minCutoff, this.beta));
    this.fy = Array.from({ length: KP_COUNT }, () => new OneEuro(this.minCutoff, this.beta));
  }
  smooth(p: Pose, tMs: number): Pose {
    const x = new Float32Array(KP_COUNT), y = new Float32Array(KP_COUNT);
    for (let k = 0; k < KP_COUNT; k++) {
      if (p.score[k] < VISIBLE_SCORE) { x[k] = p.x[k]; y[k] = p.y[k]; continue; }
      x[k] = this.fx[k].filter(p.x[k], tMs); y[k] = this.fy[k].filter(p.y[k], tMs);
    }
    return { x, y, score: p.score };
  }
}
