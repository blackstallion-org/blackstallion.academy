/**
 * The guided camera of the hero stage: five shots on the standing stallion, started by a button and stopped by any input.
 *
 *   I   The reveal. The lights go down to a rim-lit silhouette against the dark stage, the camera is cut to a low view from behind,
 *       then swings round to the three-quarter view while the key light comes up on the neck, the head and the whole animal.
 *   II  The eye.         Close on the eye, lid and catch-light, while the horse breathes and blinks.
 *   III The ears.        Close on the lyre-shaped ears as they swivel on their own.
 *   IV  The anatomy.     A slow pass along the shoulder, the barrel and the hindquarters at two and a half metres.
 *   V   The full stallion. Back to the three-quarter composition.
 *
 * Every move is eased in and out, positions are anchored to the horse's bones (so a close-up follows the head, which moves a
 * little), and the sequence never touches the camera it hands back: on any input, scroll, key or click it eases to the normal
 * view in 1.2 s. It is off under reduced motion (the stage does not offer it).
 */
import * as THREE from "three";

export type Pose = { pos: THREE.Vector3; look: THREE.Vector3; fov: number };
/** Offsets are [forward, left, up] metres in the horse's frame (it faces +Z, its left is +X). A bone makes them relative to that bone. */
type Anchor = { bone?: string; off: [number, number, number] };
type Key = { at: number; cam: Anchor | "default"; look: Anchor | "default"; fov: number; rim?: number; label?: string };

const A = (off: [number, number, number], bone?: string): Anchor => ({ bone, off });
const KEYS: Key[] = [
  { at: 0, cam: "default", look: "default", fov: 0 },
  // the lights go down on the standing horse, and while the stage is dark the camera is cut (not moved) to a low shot from behind
  { at: 1, cam: "default", look: "default", fov: 0 },
  { at: 1.02, cam: A([-3.4, 3.1, 0.85]), look: A([0.2, 0, 1.25]), fov: 28, label: "I · The reveal" },
  { at: 2.4, cam: A([-3.4, 3.1, 0.85]), look: A([0.2, 0, 1.25]), fov: 28 },
  // the key light rises while the camera swings round the near side, always more than four metres out so the whole horse stays in frame
  { at: 6.6, cam: A([0.2, 4.7, 1.1]), look: A([0.1, 0, 1.2]), fov: 28 },
  { at: 11, cam: "default", look: "default", fov: 0 },
  { at: 11.8, cam: "default", look: "default", fov: 0 },
  { at: 15, cam: A([0.3, 0.75, -0.02], "Eye_L"), look: A([0, 0, -0.025], "Eye_L"), fov: 11, rim: 0.3, label: "II · The eye" },
  { at: 17.2, cam: A([0.3, 0.75, -0.02], "Eye_L"), look: A([0, 0, -0.025], "Eye_L"), fov: 11, rim: 0.3 },
  // between two close-ups the camera pulls out to a head portrait and a three-quarter front, so it never skims the mane
  { at: 19.2, cam: A([1.7, 1.15, 0.45], "Head"), look: A([0, 0, 0.1], "Head"), fov: 24, rim: 0.3 },
  { at: 21.6, cam: A([1.25, 0.35, 0.35], "Head"), look: A([0.05, 0, 0.2], "Head"), fov: 17, rim: 0.3, label: "III · The ears" },
  { at: 23.6, cam: A([1.25, 0.35, 0.35], "Head"), look: A([0.05, 0, 0.2], "Head"), fov: 17, rim: 0.3 },
  { at: 25.6, cam: A([2.3, 2.3, 1.7]), look: A([0.3, 0, 1.3]), fov: 26 },
  { at: 28, cam: A([0.5, 2.6, 1.5]), look: A([0.35, 0, 1.35]), fov: 22, label: "IV · The anatomy" },
  { at: 28.7, cam: A([0.5, 2.6, 1.5]), look: A([0.35, 0, 1.35]), fov: 22 },
  { at: 31.1, cam: A([0.1, 2.4, 1.2]), look: A([0, 0, 1.15]), fov: 22 },
  { at: 31.8, cam: A([0.1, 2.4, 1.2]), look: A([0, 0, 1.15]), fov: 22 },
  { at: 34.2, cam: A([-1.7, 2.3, 1.4]), look: A([-0.35, 0, 1.2]), fov: 24 },
  { at: 34.9, cam: A([-1.7, 2.3, 1.4]), look: A([-0.35, 0, 1.2]), fov: 24 },
  { at: 39, cam: "default", look: "default", fov: 0, label: "V · The full stallion" },
  { at: 40.6, cam: "default", look: "default", fov: 0 },
];
/** The lights go down at the start and come up slowly while the camera travels to the three-quarter view. */
const LIGHT: [number, number][] = [[0, 1], [0.2, 1], [1, 0], [2.4, 0], [6.6, 1]];
const RETURN_S = 1.2;

const ease = (t: number) => t * t * t * (t * (t * 6 - 15) + 10);
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

export type RevealFrame = { pose: Pose; light: number; rim: number; label: string };

export class RevealDirector {
  state: "idle" | "running" | "returning" = "idle";
  private t = 0;
  private retT = 0;
  private label = "";
  private start: Pose = { pos: new THREE.Vector3(), look: new THREE.Vector3(), fov: 30 };
  private from: Pose = { pos: new THREE.Vector3(), look: new THREE.Vector3(), fov: 30 };
  private fromLight = 1;
  private fromRim = 1;
  private light = 1;
  private rim = 1;
  private readonly pose: Pose = { pos: new THREE.Vector3(), look: new THREE.Vector3(), fov: 30 };
  private readonly pa = new THREE.Vector3();
  private readonly pb = new THREE.Vector3();
  private readonly la = new THREE.Vector3();
  private readonly lb = new THREE.Vector3();
  private readonly tmp = new THREE.Vector3();

  get active() {
    return this.state !== "idle";
  }

  /** Drop the sequence at once (the film took over the camera). */
  reset() {
    this.state = "idle";
    this.light = 1;
    this.rim = 1;
  }

  begin(from: Pose) {
    this.state = "running";
    this.t = 0;
    this.label = "";
    this.start.pos.copy(from.pos);
    this.start.look.copy(from.look);
    this.start.fov = from.fov;
  }

  /** Any input: ease back to the normal view. */
  cancel() {
    if (this.state !== "running") return;
    this.state = "returning";
    this.retT = 0;
    this.from.pos.copy(this.pose.pos);
    this.from.look.copy(this.pose.look);
    this.from.fov = this.pose.fov;
    this.fromLight = this.light;
    this.fromRim = this.rim;
  }

  private anchor(a: Anchor, bone: (name: string, out: THREE.Vector3) => THREE.Vector3, out: THREE.Vector3) {
    if (a.bone) bone(a.bone, out);
    else out.set(0, 0, 0);
    return out.add(this.tmp.set(a.off[1], a.off[2], a.off[0]));
  }

  private at(key: Key, which: "cam" | "look", dflt: Pose, bone: (name: string, out: THREE.Vector3) => THREE.Vector3, out: THREE.Vector3, first: boolean) {
    const a = key[which];
    if (a === "default") return out.copy(which === "cam" ? (first ? this.start.pos : dflt.pos) : first ? this.start.look : dflt.look);
    return this.anchor(a, bone, out);
  }

  /**
   * Advance by dt. `dflt` is the normal hero view of this frame; `bone(name, out)` writes a bone's world position.
   * Returns null once the horse is back in the normal view.
   */
  update(dt: number, dflt: Pose, bone: (name: string, out: THREE.Vector3) => THREE.Vector3): RevealFrame | null {
    if (this.state === "idle") return null;
    if (this.state === "running") {
      this.t += dt;
      const last = KEYS[KEYS.length - 1];
      if (this.t >= last.at) {
        this.reset();
        return null;
      }
      let i = 0;
      while (i < KEYS.length - 2 && this.t >= KEYS[i + 1].at) i++;
      const k0 = KEYS[i], k1 = KEYS[i + 1];
      const u = ease((this.t - k0.at) / (k1.at - k0.at));
      this.at(k0, "cam", dflt, bone, this.pa, i === 0);
      this.at(k1, "cam", dflt, bone, this.pb, false);
      this.at(k0, "look", dflt, bone, this.la, i === 0);
      this.at(k1, "look", dflt, bone, this.lb, false);
      this.pose.pos.lerpVectors(this.pa, this.pb, u);
      this.pose.look.lerpVectors(this.la, this.lb, u);
      const f0 = k0.fov || (i === 0 ? this.start.fov : dflt.fov);
      const f1 = k1.fov || dflt.fov;
      this.pose.fov = lerp(f0, f1, u);
      this.rim = lerp(k0.rim ?? 1, k1.rim ?? 1, u);
      // a held shot is never dead still
      this.pose.pos.x += Math.sin(this.t * 0.55) * 0.012;
      this.pose.pos.y += Math.sin(this.t * 0.43 + 1.3) * 0.008;
      let li = 0;
      while (li < LIGHT.length - 2 && this.t >= LIGHT[li + 1][0]) li++;
      const [t0, l0] = LIGHT[li], [t1, l1] = LIGHT[li + 1];
      this.light = this.t >= LIGHT[LIGHT.length - 1][0] ? 1 : lerp(l0, l1, ease(Math.min(1, Math.max(0, (this.t - t0) / (t1 - t0)))));
      for (const k of KEYS) if (k.label && this.t >= k.at - 0.4) this.label = k.label;
      return { pose: this.pose, light: this.light, rim: this.rim, label: this.label };
    }
    // returning
    this.retT += dt;
    const u = ease(Math.min(1, this.retT / RETURN_S));
    this.pose.pos.lerpVectors(this.from.pos, dflt.pos, u);
    this.pose.look.lerpVectors(this.from.look, dflt.look, u);
    this.pose.fov = lerp(this.from.fov, dflt.fov, u);
    this.light = lerp(this.fromLight, 1, u);
    this.rim = lerp(this.fromRim, 1, u);
    if (this.retT >= RETURN_S) {
      this.reset();
      return null;
    }
    return { pose: this.pose, light: this.light, rim: this.rim, label: "" };
  }
}
