import type * as THREE from "three";
import type { AssetLoader } from "./assets";
import type { HorseRig } from "./horse";
import type { QualitySettings } from "./quality";

/**
 * Four Worlds: one horse, four worlds, one continuous camera.
 * Every world is a module that owns its own THREE.Scene, its own camera path and its own grade. The engine owns the
 * renderer, the camera, the horse, the post chain and the scroll progress; worlds never touch each other.
 *
 * Units: metres, +Y up, three.js right-handed. The horse model faces +Z at heading 0.
 */
/** 14 Nov 2026 (owner): the film is two worlds now. The inner world of cells (Life) and the space world (Beyond) were cut; it
 * runs from the hill straight into the memory world and ends in the sky above it. */
export type WorldId = "origins" | "legacy";
export const WORLD_ORDER: WorldId[] = ["origins", "legacy"];

/** A camera pose: where the lens is, what it looks at, its vertical field of view (degrees) and a roll (radians). */
export type ShotPose = { pos: THREE.Vector3; look: THREE.Vector3; fov: number; roll: number };

/** Per-world look of the final image (applied by the post chain). */
export type Grade = {
  exposure: number;
  /** bloom strength / radius / threshold (linear HDR) */
  bloom: [number, number, number];
  /** multiplies shadows, mids, highlights (linear) */
  lift: THREE.ColorRepresentation;
  gain: THREE.ColorRepresentation;
  saturation: number;
  vignette: number;
  grain: number;
};

export type WorldContext = {
  renderer: THREE.WebGLRenderer;
  assets: AssetLoader;
  horse: HorseRig;
  quality: QualitySettings;
  mobile: boolean;
};

export interface World {
  readonly id: WorldId;
  readonly scene: THREE.Scene;
  readonly grade: Grade;
  /** Whether this world stands the shared hero horse in its scene (World 02 draws its own anatomical horse instead). */
  readonly usesHorse: boolean;
  /** Loads assets and builds the scene. Called once, ahead of time (the engine preloads the next world). */
  load(ctx: WorldContext): Promise<void>;
  /** The world becomes the one on screen: take the shared horse (horse.attach(this.scene, ...)). */
  enter(ctx: WorldContext): void;
  /** Another world took over. Hand nothing back: the next world's enter() re-attaches the horse. */
  exit(): void;
  /**
   * Deterministic for a given p: the camera pose and everything scroll-driven is a pure function of p (0..1 through this world),
   * so scrolling backwards plays the film backwards. `time` (s) drives only ambient life (wind, breathing, particles).
   * Write the camera pose into `out`.
   */
  update(p: number, dt: number, time: number, out: ShotPose, aspect: number): void;
  /** Quality changed (tier up/down). */
  setQuality?(q: QualitySettings): void;
  dispose(): void;
}

/** A world module's factory (dynamically imported, so each world's code and assets load only when needed). */
export type WorldFactory = () => World;
