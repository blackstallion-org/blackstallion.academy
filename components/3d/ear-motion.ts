import * as THREE from "three";

/**
 * The Marwari's ears (3 Nov 2026). Each ear is its own bone (Ear_L, Ear_R) with a tip bone (Ear_Tip_L, Ear_Tip_R) and moves on its
 * own schedule: a quiet idle of small, irregular adjustments with pauses, now and then a moment when both ears come forward (the left
 * a little before or after the right), now and then one ear turning toward a sound while the other stays on the path ahead.
 * Nothing here is a loop: every target, hold time and spring is drawn at random per ear.
 *
 * The baked `Ear_Rotate`, `Alert` and `Attention_Response` clips used to turn both ears together; `loadMarwari` removes their ear
 * tracks, so this module is the only thing that moves the ear bones. It runs from the model root's `updateMatrixWorld`, which every
 * renderer in the site calls each frame, so a page does not have to call anything. `mood`, `attend` and `speed` are optional hints.
 * Reduced motion: the ears stay in their rest pose (the study page, which poses them itself, sets `enabled = false`).
 *
 * Axes are the bones' own. Per ear (sign = +1 left, -1 right): yaw turns the opening of the ear about its long axis (positive swivels
 * out and back, the sign convention of the ear study), pitch nods the ear forward (negative) or back, roll leans it toward or away from
 * the midline, and the tip bone bends the upper third (the cartilage) a little more than the base.
 */
export type EarMood = "idle" | "alert";

type Pose = { yaw: number; pitch: number; roll: number; tip: number; tipRoll: number };
const ZERO = (): Pose => ({ yaw: 0, pitch: 0, roll: 0, tip: 0, tipRoll: 0 });

/**
 * Rotation limits per ear [left, right], radians, in this module's convention (pitch and tip: negative is forward; yaw: positive
 * swivels out and back; roll: positive leans toward the midline). The base limits keep a swivel from tearing the ear off the head.
 * The crescent tips curl toward each other, so whatever brings them closer is held back, ear by ear: the two ears of the scan are
 * not mirror images (the right leans forward at its root), so the directions differ. Measured on the exported rig, one ear at a
 * time, vertex to vertex, 23 mm apart at rest; at 0.15 rad the left ear closes the gap by 6.6 mm with a forward nod, 2.3 mm with a
 * forward tip bend and 2.3 mm with roll; the right by 13.4 mm with a backward nod, 9 mm with a backward tip bend, 3.5 mm with a
 * forward swivel and 2.6 mm with roll. With these limits two ears at their worst stay about 9 mm apart.
 */
const LIM = {
  pitch: [[-0.08, 0.42], [-0.42, 0.06]],
  tip: [[-0.06, 0.3], [-0.3, 0.04]],
  yaw: [[-0.42, 1.05], [-0.05, 1.05]],
  roll: [[-0.34, 0.02], [-0.34, 0.02]],
  tipRoll: [[-0.26, 0.02], [-0.26, 0.02]],
} as const;
const within = (table: readonly (readonly [number, number])[], side: 0 | 1, v: number) => clamp(v, table[side][0], table[side][1]);
/**
 * Pitch and roll signs per ear [left, right], measured on the exported rig: +0.3 rad about a bone's local X moves the ear tip 2.5 cm forward
 * on both ears (so pitch, negative = forward, is -X), +0.3 about local Z moves it toward the midline on the left and away from it on the right.
 */
const SIGN = { pitch: [-1, -1], roll: [1, -1], tipRoll: [1, -1] };

const gauss = () => {
  let u = 0;
  while (u === 0) u = Math.random();
  return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * Math.random());
};
const rand = (a: number, b: number) => a + Math.random() * (b - a);
const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v));

class Ear {
  pose = ZERO();
  vel = ZERO();
  target = ZERO();
  /** seconds until this ear chooses a new idle target, and how stiffly it moves (rad/s natural frequency of its spring). */
  hold = rand(0.4, 2.5);
  omega = rand(6.5, 10.5);
  /** a deliberate pose (forward, listening) overrides the idle target until this many seconds have passed */
  override = 0;
  constructor(public readonly side: 0 | 1) {}

  idle(amp: number) {
    const t = this.target;
    t.yaw = gauss() * 0.075 * amp;
    t.pitch = gauss() * 0.04 * amp;
    t.roll = gauss() * 0.035 * amp;
    t.tip = gauss() * 0.06 * amp;
    t.tipRoll = gauss() * 0.04 * amp;
    // a cartilage flick now and then: the tip moves faster than the base and settles back
    if (Math.random() < 0.18 * amp) this.vel.tip += (Math.random() < 0.5 ? -1 : 1) * rand(0.5, 1.1);
    this.hold = rand(1.1, 5.2) / Math.max(0.5, amp);
    this.omega = rand(6.5, 10.5);
  }

  step(dt: number) {
    // critically damped spring toward the target for every channel: smooth, no overshoot, no snapping
    const w = this.omega;
    for (const k of ["yaw", "pitch", "roll", "tip", "tipRoll"] as const) {
      const x = this.pose[k] - this.target[k];
      const v = this.vel[k];
      const a = -2 * w * v - w * w * x;
      this.vel[k] = v + a * dt;
      this.pose[k] += this.vel[k] * dt;
    }
  }
}

export class EarMotion {
  enabled = true;
  mood: EarMood = "idle";
  /** Horse speed, m/s: restrains the idle and brings the ears forward at a gallop. */
  speed = 0;
  private readonly ears = [new Ear(0), new Ear(1)] as const;
  private readonly bones: { base: THREE.Bone | undefined; tip: THREE.Bone | undefined }[];
  private readonly rest: { base?: THREE.Quaternion; tip?: THREE.Quaternion }[];
  private readonly still: boolean;
  private last = 0;
  private forwardIn = rand(4, 9);
  private listenIn = rand(9, 18);
  private forwardLeft = 0;
  private listenSide: 0 | 1 | -1 = -1;
  private attention = 0;
  private bias = 0;
  private readonly q = new THREE.Quaternion();
  private readonly e = new THREE.Euler();
  private readonly headPrev = new THREE.Vector3();
  private readonly headNow = new THREE.Vector3();
  private headVy = 0;
  private headReady = false;
  private readonly head: THREE.Object3D | undefined;

  constructor(bones: Record<string, THREE.Bone>) {
    this.bones = [
      { base: bones.Ear_L, tip: bones.Ear_Tip_L },
      { base: bones.Ear_R, tip: bones.Ear_Tip_R },
    ];
    this.rest = this.bones.map((b) => ({ base: b.base?.quaternion.clone(), tip: b.tip?.quaternion.clone() }));
    this.head = bones.Head;
    this.still = typeof window !== "undefined" && typeof window.matchMedia === "function" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    // the two ears start out of step
    this.ears[1].hold += rand(0.3, 1.4);
  }

  /** Turn toward a sound: -1 is the horse's left, 1 its right, 0 straight ahead (clears the hint). The nearer ear swivels toward it. */
  attend(side: number) {
    this.bias = clamp(side, -1, 1);
  }

  /** The ears' own pose in radians, for tests and tuning. */
  poseOf(i: 0 | 1): Readonly<Pose> {
    return this.ears[i].pose;
  }

  /** Force a pose on one ear for `seconds` (the ear study and the tests use this). */
  hold(i: 0 | 1, pose: Partial<Pose>, seconds = 2) {
    const e = this.ears[i];
    Object.assign(e.target, ZERO(), pose);
    e.override = seconds;
  }

  /** Call once per frame (the model root's matrix update does). */
  update(now: number) {
    if (!this.enabled || this.still) return;
    const dt = this.last ? Math.min(0.05, (now - this.last) / 1000) : 0;
    this.last = now;
    if (dt > 0.0005) this.tick(dt);
    this.writeBones();
  }

  private tick(dt: number) {
    const alert = this.mood === "alert" ? 1 : 0;
    const gallop = clamp((this.speed - 1.5) / 6, 0, 1);
    this.attention += (Math.max(alert, gallop * 0.8) - this.attention) * (1 - Math.pow(0.04, dt));
    const amp = 1 - 0.65 * this.attention;

    // secondary motion: the head's vertical acceleration lags the tips (cartilage), restrained
    if (this.head) {
      this.head.getWorldPosition(this.headNow);
      if (this.headReady) {
        const vy = (this.headNow.y - this.headPrev.y) / dt;
        this.headVy += (vy - this.headVy) * (1 - Math.pow(0.001, dt));
      }
      this.headPrev.copy(this.headNow);
      this.headReady = true;
    }

    // occasional moments for both ears: forward, one a touch ahead of the other
    this.forwardIn -= dt;
    if (this.forwardIn <= 0 && this.attention < 0.5) {
      this.forwardLeft = rand(2, 4);
      this.forwardIn = rand(8, 18);
      this.ears[0].override = this.ears[1].override = 0;
      const first = Math.random() < 0.5 ? 0 : 1;
      this.ears[first].hold = 0;
      this.ears[1 - first].hold = rand(0.12, 0.45);
    }
    // occasionally one ear listens: it swivels toward a sound while the other keeps its place
    this.listenIn -= dt;
    if (this.listenIn <= 0 && this.listenSide < 0 && this.attention < 0.6) {
      this.listenSide = this.bias !== 0 ? (this.bias < 0 ? 0 : 1) : Math.random() < 0.5 ? 0 : 1;
      const e = this.ears[this.listenSide];
      Object.assign(e.target, ZERO(), { yaw: rand(0.45, 0.8), pitch: rand(-0.02, 0.06), roll: rand(0.05, 0.12), tip: rand(0.05, 0.14) });
      e.override = rand(1.4, 3.2);
      this.listenIn = rand(14, 30);
    }
    this.forwardLeft = Math.max(0, this.forwardLeft - dt);

    for (const e of this.ears) {
      if (e.override > 0) {
        e.override -= dt;
        if (e.override <= 0 && this.listenSide === e.side) this.listenSide = -1;
      } else {
        e.hold -= dt;
        if (e.hold <= 0) {
          if (this.attention > 0.4 || this.forwardLeft > 0) {
            // both ears forward and attentive: the ear on the hinted side turns a little toward it, otherwise nearly still
            const t = e.target;
            const near = (this.bias < 0 && e.side === 0) || (this.bias > 0 && e.side === 1);
            t.yaw = -0.06 + (near ? 0.18 * Math.abs(this.bias) : 0) + gauss() * 0.02;
            t.pitch = -0.1 * (0.5 + 0.5 * this.attention) + gauss() * 0.015;
            t.roll = gauss() * 0.015;
            t.tip = -0.03 + gauss() * 0.015;
            t.tipRoll = gauss() * 0.01;
            e.hold = rand(0.9, 2.2);
            e.omega = rand(9, 13);
          } else {
            e.idle(amp);
          }
        }
      }
      e.step(dt);
    }
  }

  private writeBones() {
    const dy = clamp(this.headVy * 0.05, -0.12, 0.12);
    for (const e of this.ears) {
      const s = e.side === 0 ? 1 : -1;
      const p = e.pose;
      const b = this.bones[e.side];
      const r = this.rest[e.side];
      if (b.base && r.base) {
        this.e.set(within(LIM.pitch, e.side, p.pitch) * SIGN.pitch[e.side], within(LIM.yaw, e.side, p.yaw) * s, within(LIM.roll, e.side, p.roll) * SIGN.roll[e.side], "YXZ");
        b.base.quaternion.copy(r.base).multiply(this.q.setFromEuler(this.e));
      }
      if (b.tip && r.tip) {
        this.e.set(within(LIM.tip, e.side, p.tip + dy) * SIGN.pitch[e.side], 0, within(LIM.tipRoll, e.side, p.tipRoll) * SIGN.tipRoll[e.side], "YXZ");
        b.tip.quaternion.copy(r.tip).multiply(this.q.setFromEuler(this.e));
      }
    }
  }

  /** Put the ears back at rest and stop driving them (the pose a clip would leave). */
  reset() {
    for (let i = 0; i < 2; i++) {
      const b = this.bones[i];
      const r = this.rest[i];
      if (b.base && r.base) b.base.quaternion.copy(r.base);
      if (b.tip && r.tip) b.tip.quaternion.copy(r.tip);
    }
  }
}

/** Removes the ear tracks from every clip (the ears are driven by `EarMotion`) and returns how many tracks went. */
export function stripEarTracks(clips: THREE.AnimationClip[]): number {
  let n = 0;
  for (const clip of clips) {
    const keep = clip.tracks.filter((t) => !/^Ear_/.test(t.name));
    n += clip.tracks.length - keep.length;
    clip.tracks = keep;
  }
  return n;
}

/**
 * Drives `motion` from the model root's own matrix update (the renderer updates the scene's matrices every frame, after any mixer),
 * so no page has to call it. Returns a function that detaches the hook.
 */
export function attachEarMotion(root: THREE.Object3D, motion: EarMotion): () => void {
  const original = root.updateMatrixWorld.bind(root);
  root.updateMatrixWorld = (force?: boolean) => {
    motion.update(performance.now());
    original(force);
  };
  return () => {
    root.updateMatrixWorld = original;
  };
}
