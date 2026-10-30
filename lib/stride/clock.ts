import { AUTHORED, SAMPLES, STUDY_STRIDE_SECONDS, type Speed } from "./constants";
import { wrap01 } from "./analysis";

type PhaseListener = (clock: StrideClock) => void;

/**
 * The one clock of the stride study. The horse, the rider, the ground, the graph and the timeline all read `phase` (0..1, one
 * stride) from here, and the only thing that moves it while playing is `advance()`, called once per frame by the 3D stage's
 * render loop, which then updates every listener in the same tick. Scrubbing, frame steps and the hotspot jumps call `set()`.
 * Nothing else runs a timer for this page.
 */
export class StrideClock {
  phase = 0;
  playing = false;
  speed: Speed = 1;
  readonly strideSeconds = STUDY_STRIDE_SECONDS;
  /** Schedules a render when something outside the loop moved the clock; the stage binds it with `bindRender`. */
  requestRender: () => void = () => {};
  bindRender(fn: () => void) {
    this.requestRender = fn;
  }

  private readonly phaseListeners = new Set<PhaseListener>();
  private readonly stateListeners = new Set<() => void>();
  private version = 0;

  /** Every change of phase (60 times a second while playing): for imperative updates of the DOM and the scene. */
  subscribe(fn: PhaseListener): () => void {
    this.phaseListeners.add(fn);
    return () => void this.phaseListeners.delete(fn);
  }

  /** Changes of state that React draws (playing, speed): a few times a minute. */
  subscribeState = (fn: () => void): (() => void) => {
    this.stateListeners.add(fn);
    return () => void this.stateListeners.delete(fn);
  };
  getStateVersion = () => this.version;

  private emitPhase() {
    for (const fn of this.phaseListeners) fn(this);
  }
  private emitState() {
    this.version++;
    for (const fn of this.stateListeners) fn();
  }

  /** Advances by `dt` seconds of real time while playing. Called by the render loop only. */
  advance(dt: number) {
    if (!this.playing) return;
    this.phase = wrap01(this.phase + (dt * this.speed) / this.strideSeconds);
    this.emitPhase();
  }

  set(phase: number) {
    this.phase = wrap01(phase);
    this.emitPhase();
    this.requestRender();
  }

  /** Moves to the previous or next authored frame (24 to a stride) and pauses. */
  step(direction: 1 | -1) {
    const f = this.phase * AUTHORED.frames;
    const snapped = direction > 0 ? Math.floor(f + 1e-6) + 1 : Math.ceil(f - 1e-6) - 1;
    this.pause();
    this.set(snapped / AUTHORED.frames);
  }

  /** The authored frame (0..23) nearest the current phase. */
  get frame() {
    return Math.round(this.phase * AUTHORED.frames) % AUTHORED.frames;
  }

  /** Seat cycles per minute implied by the clock's speed for a channel that repeats `perStride` times a stride. */
  perMinute(perStride: number) {
    return (60 / this.strideSeconds) * this.speed * perStride;
  }

  play() {
    if (this.playing) return;
    this.playing = true;
    this.emitState();
    this.requestRender();
  }
  pause() {
    if (!this.playing) return;
    this.playing = false;
    this.emitState();
  }
  toggle() {
    if (this.playing) this.pause();
    else this.play();
  }
  setSpeed(speed: Speed) {
    this.speed = speed;
    this.emitState();
  }
}

export const SAMPLE_COUNT = SAMPLES;
