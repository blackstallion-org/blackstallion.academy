import type { WorldId } from "./types";
import { smoothstep } from "./math";

export type TransitionPhase = "idle" | "out" | "load" | "in";

/**
 * The state of switching worlds, as a small machine so it can be tested without a renderer. One switch runs at a time:
 * the current world fades out (the horse settles to idle meanwhile), the next one loads if it has not yet, then fades in.
 * A request made while a switch is running is kept (only the latest) and runs when this one ends; it never overlaps.
 *
 *   idle --request--> out (0.45 s) --> load (for as long as the next world's art takes) --> in (0.55 s) --> idle
 *
 * The wait in `load` has no time limit: a place is never shown before its art is here (showing the old place under the new
 * place's name would be worse than waiting), and a download that fails for good is the controller's business (it falls back to
 * stills). The visitor is never stuck meanwhile: a request made during `load` replaces the world being waited for, and a world
 * whose art is already here (the one that was on screen, or any cached one) ends the wait on the next frame.
 */
export class TransitionMachine {
  phase: TransitionPhase = "idle";
  /** The world on screen (or being faded out); changes at the moment of the swap. */
  current: WorldId;
  /** The world being switched to, while a switch is running. */
  target: WorldId | null = null;
  /** The latest request that arrived mid-switch. */
  queued: WorldId | null = null;
  /** 0 = nothing of the world visible, 1 = fully visible. */
  fade = 1;
  /** 0..1 progress of the lights from the old rig to the new one. */
  lightMix = 1;
  /** Total seconds a switch has taken, for tests. */
  elapsed = 0;
  private t = 0;

  constructor(initial: WorldId, private readonly opts = { out: 0.45, in: 0.55 }) {
    this.current = initial;
  }

  get busy() {
    return this.phase !== "idle";
  }

  /** Ask for a world. Returns true if it will be shown (now or after the running switch), false if it is already shown. */
  request(id: WorldId) {
    if (this.phase === "idle") {
      if (id === this.current) return false;
      this.target = id;
      this.phase = "out";
      this.t = 0;
      this.elapsed = 0;
      this.lightMix = 0;
      return true;
    }
    if (this.phase === "out") {
      if (id === this.current) {
        // changed their mind before the swap: fade the same world back in from where it is
        this.phase = "in";
        this.t = 1 - this.t;
        this.target = null;
        this.queued = null;
        this.lightMix = 0;
        return true;
      }
      this.target = id; // still fading out: simply aim at the newer choice
      this.queued = null;
      return true;
    }
    if (this.phase === "load") {
      // The next world's art is still on its way and the screen is dark. Wait for whichever world was asked for last: if it is
      // the one already being waited for nothing changes; any other (including the one that was on screen) takes its place at
      // once, the lights head for it again, and it is shown as soon as its art is here, which for a cached world is next frame.
      if (id !== this.current) {
        this.current = id;
        this.target = id;
        this.lightMix = 0;
      }
      this.queued = null;
      return true;
    }
    // fading in: the world being shown finishes first, then the newest request runs
    this.queued = id === this.target ? null : id;
    return true;
  }

  /**
   * Advance by `dt`. `ready(id)` says whether a world's art is loaded. Returns the world to swap in on the frame the swap happens
   * (the moment the old world is fully faded out), otherwise null.
   */
  update(dt: number, ready: (id: WorldId) => boolean): WorldId | null {
    if (this.phase === "idle") return null;
    this.elapsed += dt;
    let swapped: WorldId | null = null;
    if (this.phase === "out") {
      this.t += dt / this.opts.out;
      this.fade = 1 - smoothstep(0, 1, this.t);
      if (this.t >= 1) {
        this.fade = 0;
        this.current = this.target as WorldId;
        swapped = this.current;
        this.phase = "load";
      }
    } else if (this.phase === "load") {
      this.fade = 0;
      this.lightMix = Math.min(1, this.lightMix + dt / 0.8);
      if (ready(this.current)) {
        this.phase = "in";
        this.t = 0;
      }
    } else {
      this.t += dt / this.opts.in;
      this.fade = smoothstep(0, 1, this.t);
      this.lightMix = Math.min(1, this.lightMix + dt / 0.8);
      if (this.t >= 1) {
        this.fade = 1;
        this.lightMix = 1;
        this.phase = "idle";
        this.target = null;
        const next = this.queued;
        this.queued = null;
        if (next && next !== this.current) this.request(next);
      }
    }
    return swapped;
  }
}
