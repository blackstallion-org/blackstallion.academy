import * as THREE from "three";
import { createGaze, loadMarwari, type Marwari } from "@/components/3d/marwari";

/**
 * The one horse. Loaded once, handed from world to world (each world's enter() calls attach()), so the viewer follows the same
 * animal through the whole journey. Ambient life (breathing, tail, mane, blinks, a weight shift now and then, the ears, which
 * move themselves) runs on the clock; anything scroll-driven (a gait) is set from a phase the world computes from p, so it is
 * deterministic and reverses with the scroll.
 */
export type GaitClip = "Walk" | "Trot" | "Canter_R" | "Gallop_R";
/** Stride length (m) per cycle, from public/models/marwari-gaits.json. */
export const STRIDE: Record<GaitClip, number> = { Walk: 1.152, Trot: 2.498, Canter_R: 2.898, Gallop_R: 4.2 };

export class HorseRig {
  m!: Marwari;
  mixer!: THREE.AnimationMixer;
  private actions = new Map<string, THREE.AnimationAction>();
  private gaze!: ReturnType<typeof createGaze>;
  private gait: { clip: GaitClip; phase: number; weight: number } | null = null;
  private nextBlink = 1.5;
  private nextShift = 9;
  private gazeT = { yaw: 0, pitch: 0 };
  private gazeC = { yaw: 0, pitch: 0 };
  /** world the horse is currently standing in */
  private holder: THREE.Object3D | null = null;
  readonly group = new THREE.Group();
  ready = false;

  /**
   * `coatMap` swaps the colour map for another painted on the same UVs. The worlds use the plain black coat (the baked map of
   * marwari-hero.glb), so the horse reads as the solid black Marwari of the references; the refined model's geometry, tail and rig stay.
   */
  async load(url: string, opts: { onProgress?: (f: number) => void; coatMap?: string } = {}) {
    const { promise } = loadMarwari(url, opts.onProgress);
    const [m, coat] = await Promise.all([promise, opts.coatMap ? new THREE.TextureLoader().loadAsync(opts.coatMap).catch(() => null) : Promise.resolve(null)]);
    this.m = m;
    if (coat) {
      const old = m.material.map;
      coat.flipY = false;
      coat.colorSpace = THREE.SRGBColorSpace;
      coat.anisotropy = 8;
      if (old) { coat.wrapS = old.wrapS; coat.wrapT = old.wrapT; coat.channel = old.channel; }
      m.material.map = coat;
      m.material.needsUpdate = true;
      old?.dispose();
    }
    this.group.name = "hero-horse";
    this.group.add(this.m.root);
    this.m.root.traverse((o) => {
      const mesh = o as THREE.Mesh;
      if (mesh.isMesh) { mesh.castShadow = true; mesh.receiveShadow = true; mesh.frustumCulled = false; }
    });
    this.mixer = new THREE.AnimationMixer(this.m.root);
    for (const [name, clip] of this.m.clips) this.actions.set(name, this.mixer.clipAction(clip));
    for (const n of ["Idle_Breathing", "Tail_Sway", "Mane_Sway"]) this.actions.get(n)?.play();
    const blink = this.actions.get("Blink");
    if (blink) { blink.setLoop(THREE.LoopOnce, 1); blink.clampWhenFinished = false; }
    const shift = this.actions.get("Weight_Shift");
    if (shift) { shift.setLoop(THREE.LoopOnce, 1); }
    for (const n of Object.keys(STRIDE)) {
      const a = this.actions.get(n);
      if (a) { a.play(); a.setEffectiveWeight(0); a.timeScale = 0; }
    }
    this.gaze = createGaze(this.m);
    this.ready = true;
  }

  /** Stand the horse in a world: parent, position (world units) and heading (radians about +Y, 0 faces +Z). */
  attach(parent: THREE.Object3D, pos: THREE.Vector3Like, heading: number, opts: { scale?: number; ground?: (x: number, z: number) => number; contactStrength?: number } = {}) {
    const scale = opts.scale ?? 1;
    if (this.holder !== parent) {
      this.group.removeFromParent();
      parent.add(this.group);
      this.holder = parent;
    }
    this.group.position.set(pos.x, pos.y, pos.z);
    this.group.rotation.set(0, heading, 0);
    this.group.scale.setScalar(scale);
    this.group.visible = true;
    this.m.contacts.group.removeFromParent();
    this.group.add(this.m.contacts.group);
    const y = pos.y;
    this.m.contacts.ground = opts.ground ?? (() => y);
    this.m.contacts.strength = opts.contactStrength ?? 0.6;
  }

  detach() {
    this.group.removeFromParent();
    this.holder = null;
  }

  /** Scroll-driven gait: clip and phase (cycles, any real number) and blend weight against standing (0..1). */
  setGait(clip: GaitClip | null, phase = 0, weight = 1) {
    this.gait = clip ? { clip, phase, weight } : null;
  }

  /** Where the horse should look (radians: yaw > 0 toward its left, pitch > 0 lowers the nose); eased. */
  look(yaw: number, pitch: number) {
    this.gazeT.yaw = yaw;
    this.gazeT.pitch = pitch;
  }

  /** World position of a bone (Head, Eye_L, Eye_R, Neck_1, Body ...). */
  bone(name: string, out = new THREE.Vector3()) {
    const b = this.m.bones[name];
    return b ? b.getWorldPosition(out) : this.group.getWorldPosition(out);
  }

  update(dt: number, time: number, opts: { still?: boolean } = {}) {
    if (!this.ready) return;
    this.gaze.undo();
    // gait: a clip whose time is set from the phase; the standing clips fade against it
    for (const n of Object.keys(STRIDE) as GaitClip[]) {
      const a = this.actions.get(n);
      if (!a) continue;
      if (this.gait && this.gait.clip === n) {
        const d = a.getClip().duration;
        a.time = (((this.gait.phase % 1) + 1) % 1) * d;
        a.setEffectiveWeight(this.gait.weight);
      } else a.setEffectiveWeight(0);
    }
    const standW = this.gait ? 1 - this.gait.weight : 1;
    this.actions.get("Idle_Breathing")?.setEffectiveWeight(Math.max(0.15, standW));
    if (!opts.still) {
      if (time > this.nextBlink) {
        this.actions.get("Blink")?.reset().play();
        this.nextBlink = time + 2.2 + Math.random() * 4.5;
      }
      if (time > this.nextShift && standW > 0.95) {
        this.actions.get("Weight_Shift")?.reset().play();
        this.nextShift = time + 16 + Math.random() * 12;
      }
    }
    this.mixer.update(opts.still ? 0 : dt);
    const k = 1 - Math.exp(-dt * 2.2);
    this.gazeC.yaw += (this.gazeT.yaw - this.gazeC.yaw) * k;
    this.gazeC.pitch += (this.gazeT.pitch - this.gazeC.pitch) * k;
    this.gaze.apply(this.gazeC.yaw, this.gazeC.pitch);
  }

  dispose() {
    this.detach();
    this.mixer?.stopAllAction();
  }
}
