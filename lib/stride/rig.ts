import * as THREE from "three";
import { DRACOLoader } from "three/examples/jsm/loaders/DRACOLoader.js";
import { GLTFLoader, type GLTF } from "three/examples/jsm/loaders/GLTFLoader.js";
import { disposeObject, loadMarwari, type Marwari } from "@/components/3d/marwari";
import {
  detectStance,
  footfallOrder,
  harmonicAmplitudes,
  mean,
  niceTicks,
  peakToPeak,
  periodicSecondOrder,
  sampleCyclic,
  secondOrderResponse,
  supportCount,
  wrap01,
  type Stance,
} from "./analysis";
import {
  ARRIVING_MPS,
  PLANTED_MPS,
  AUTHORED,
  HOOF_BONE,
  HOOF_LENGTH_M,
  LIMBS,
  SAMPLES,
  SOFT_SEAT,
  SOLE_TO_TOE_M,
  STANCE_CLEARANCE_M,
  STRIDE_MODEL_URL,
  STRIDE_RIDER_URL,
  STUDY_STRIDE_SECONDS,
  TORSO_SHARE,
  WALK_CLIP,
  type Limb,
} from "./constants";
import { PlantLayer } from "./plant";
import type { HotspotId } from "./store";

/* ------------------------------------------------------------------------------------------------ data types */

export type ChannelId = "vertical" | "lateral" | "foreaft" | "pitch" | "roll";

export type Channel = {
  id: ChannelId;
  label: string;
  unit: "mm" | "°";
  /** Horse's back at the saddle, rider's pelvis: one value per sample, minus the stride mean. */
  horse: Float64Array;
  rider: Float64Array;
  /** Peak-to-peak of each curve, and the cycles per stride that carry most of the movement. */
  horseP2P: number;
  riderP2P: number;
  perStride: number;
};

export type JointId = "elbow" | "carpus" | "fetlockF" | "stifle" | "hock" | "fetlockH";

export type StrideData = {
  samples: number;
  strideSeconds: number;
  channels: Record<ChannelId, Channel>;
  /** Footfalls from the toe paths of the animation. */
  stance: Record<Limb, Stance>;
  touchdownOrder: Limb[];
  /** Gaps between landings as a share of the stride, in landing order. */
  touchdownGaps: number[];
  support: number[];
  minSupport: number;
  maxSupport: number;
  /** Hoof-ground figures at the authored tempo (speeds scale with the tempo; distances do not). */
  feet: Record<Limb, { driftCm: number; plantedSpeedMps: number; toeAboveSoleMm: [number, number]; touchdownXZ: [number, number] }>;
  /** The same figures for the clip as authored, without the stance hold. */
  feetAuthored: Record<Limb, { driftCm: number; plantedSpeedMps: number }>;
  /** Right-side joint angles in degrees, one value per sample. */
  joints: Record<JointId, { series: Float64Array; min: number; max: number }>;
  /** The rider's soft-seat lag at the tempo of the page. */
  seatLagMs: number;
  seatGain: number;
  /** Seat movements per minute at the study tempo for the channels that repeat twice a stride. */
  seatCyclesPerMinute: number;
  /** Where each hotspot sits on average over the stride (horse model space), for the camera. */
  hotspotMean: Record<HotspotId, THREE.Vector3>;
};

export type HotspotKind = "horse" | "rider" | "hoof";
type HotspotGeometry = {
  id: HotspotId;
  kind: HotspotKind;
  /** The rig bone the point rides on (the joint, or the first of two whose midpoint it is), or a named anchor exported with the model. */
  bone?: string;
  bone2?: string;
  anchor?: string;
  /** Pushed out to the coat on the horse's right side (the side the default camera sees). */
  right?: boolean;
  /** Camera when the hotspot is chosen: azimuth and elevation in degrees, distance in metres. */
  cam: { az: number; el: number; dist: number };
};

export const HOTSPOTS: HotspotGeometry[] = [
  { id: "spine", kind: "horse", anchor: "Anchor_Loin", cam: { az: -28, el: 14, dist: 3.1 } },
  { id: "pelvis", kind: "horse", anchor: "Anchor_Croup", cam: { az: -52, el: 14, dist: 2.7 } },
  { id: "shoulder", kind: "horse", bone: "Humerus_R", right: true, cam: { az: 14, el: 8, dist: 2.7 } },
  { id: "hindquarters", kind: "horse", bone: "Femur_R", bone2: "Gaskin_R", right: true, cam: { az: -12, el: 8, dist: 2.9 } },
  { id: "rider-pelvis", kind: "rider", bone: "R_Pelvis", cam: { az: -22, el: 10, dist: 2.3 } },
  { id: "hoof", kind: "hoof", bone: "Hoof_F_R", cam: { az: 4, el: 7, dist: 2.5 } },
];

/* ------------------------------------------------------------------------------------------------ loading */

function loadGltf(url: string, onProgress?: (f: number) => void): Promise<GLTF> {
  const draco = new DRACOLoader();
  draco.setDecoderPath("/draco/");
  const loader = new GLTFLoader();
  loader.setDRACOLoader(draco);
  return new Promise((resolve, reject) => {
    loader.load(
      url,
      (gltf) => {
        draco.dispose();
        resolve(gltf);
      },
      (e) => e.total > 0 && onProgress?.(e.loaded / e.total),
      (err) => {
        draco.dispose();
        reject(err);
      },
    );
  });
}

/** Loads the Marwari and the cadet and builds the rig, including every curve (no WebGL needed). */
export async function loadStrideRig(onProgress?: (fraction: number) => void): Promise<StrideRig> {
  const progress = { horse: 0, rider: 0 };
  const report = () => onProgress?.(progress.horse * 0.75 + progress.rider * 0.25);
  const horseLoad = loadMarwari(STRIDE_MODEL_URL, (f) => {
    progress.horse = f;
    report();
  });
  const riderLoad = loadGltf(STRIDE_RIDER_URL, (f) => {
    progress.rider = f;
    report();
  });
  try {
    const [horse, riderGltf] = await Promise.all([horseLoad.promise, riderLoad]);
    return new StrideRig(horse, riderGltf);
  } finally {
    horseLoad.dispose();
  }
}

/* ------------------------------------------------------------------------------------------------ helpers */

type Anchor = { bone: THREE.Object3D; local: THREE.Vector3 };

const RAD = 180 / Math.PI;

function rotVec(q: THREE.Quaternion, out: number[]) {
  let { x, y, z, w } = q;
  if (w < 0) {
    x = -x;
    y = -y;
    z = -z;
    w = -w;
  }
  const s = Math.hypot(x, y, z);
  if (s < 1e-12) {
    out[0] = out[1] = out[2] = 0;
    return out;
  }
  const k = (2 * Math.atan2(s, w)) / s;
  out[0] = x * k;
  out[1] = y * k;
  out[2] = z * k;
  return out;
}

const AXIS = new THREE.Vector3();
function fromRotVec(v: ArrayLike<number>, out: THREE.Quaternion) {
  const a = Math.hypot(v[0], v[1], v[2]);
  if (a < 1e-12) return out.identity();
  return out.setFromAxisAngle(AXIS.set(v[0] / a, v[1] / a, v[2] / a), a);
}

/** The seat: four skinned vertices of the coat under the saddle give a frame that moves with the real deformation of the back. */
class SeatFrame {
  readonly index: number[];
  readonly pts: THREE.Vector3[];
  readonly rest = new THREE.Matrix4();
  readonly restInv = new THREE.Matrix4();
  readonly restPosition = new THREE.Vector3();
  readonly restQuat = new THREE.Quaternion();
  readonly matrix = new THREE.Matrix4();
  readonly delta = new THREE.Matrix4();
  private readonly a = new THREE.Vector3();
  private readonly b = new THREE.Vector3();
  private readonly up = new THREE.Vector3();
  private readonly origin = new THREE.Vector3();

  constructor(private readonly mesh: THREE.SkinnedMesh, targets: THREE.Vector3[]) {
    const pos = mesh.geometry.attributes.position;
    // found by position in the bind pose: vertex indices are not stable across exports
    this.index = targets.map((t) => {
      let best = 0;
      let d2 = Infinity;
      for (let i = 0; i < pos.count; i++) {
        const dx = pos.getX(i) - t.x;
        const dy = pos.getY(i) - t.y;
        const dz = pos.getZ(i) - t.z;
        const d = dx * dx + dy * dy + dz * dz;
        if (d < d2) {
          d2 = d;
          best = i;
        }
      }
      return best;
    });
    this.pts = targets.map(() => new THREE.Vector3());
    this.compute(this.rest);
    this.restInv.copy(this.rest).invert();
    this.rest.decompose(this.restPosition, this.restQuat, new THREE.Vector3());
  }

  private compute(out: THREE.Matrix4) {
    this.index.forEach((vi, k) => this.mesh.getVertexPosition(vi, this.pts[k]));
    const [f, b, l, r] = this.pts;
    const fwd = this.a.subVectors(f, b).normalize();
    const left = this.b.subVectors(l, r);
    left.addScaledVector(fwd, -left.dot(fwd)).normalize();
    this.up.crossVectors(fwd, left).normalize();
    this.origin.set(0, 0, 0).add(f).add(b).add(l).add(r).multiplyScalar(0.25);
    return out.makeBasis(left, this.up, fwd).setPosition(this.origin);
  }

  /** The seat's move since the bind pose, in the horse's model space. */
  update() {
    this.compute(this.matrix);
    return this.delta.multiplyMatrices(this.matrix, this.restInv);
  }
}

/** A tube re-lofted every frame through tracked points (the reins). */
class LiveTube {
  readonly mesh: THREE.Mesh;
  private readonly curve = new THREE.CatmullRomCurve3([new THREE.Vector3(), new THREE.Vector3(0, 0, 1)], false, "centripetal");
  private readonly p = new THREE.Vector3();
  private readonly t = new THREE.Vector3();
  private readonly n = new THREE.Vector3();
  private readonly b = new THREE.Vector3();
  private readonly ref = new THREE.Vector3(0, 0, 1);

  constructor(
    private readonly segments: number,
    private readonly radial: number,
    private readonly radius: number,
    material: THREE.Material,
  ) {
    const count = (segments + 1) * (radial + 1);
    const geo = new THREE.BufferGeometry();
    geo.setAttribute("position", new THREE.BufferAttribute(new Float32Array(count * 3), 3));
    const index: number[] = [];
    for (let i = 0; i < segments; i++) {
      for (let j = 0; j < radial; j++) {
        const a = i * (radial + 1) + j;
        const b = a + radial + 1;
        index.push(a, b, a + 1, b, b + 1, a + 1);
      }
    }
    geo.setIndex(index);
    this.mesh = new THREE.Mesh(geo, material);
    this.mesh.frustumCulled = false;
  }

  update(points: THREE.Vector3[]) {
    const c = this.curve;
    c.points = points.map((p) => p.clone());
    c.updateArcLengths();
    const pos = this.mesh.geometry.attributes.position as THREE.BufferAttribute;
    for (let i = 0; i <= this.segments; i++) {
      const u = i / this.segments;
      c.getPointAt(u, this.p);
      c.getTangentAt(u, this.t);
      this.n.crossVectors(this.t, this.ref);
      if (this.n.lengthSq() < 1e-6) this.n.set(1, 0, 0);
      this.n.normalize();
      this.b.crossVectors(this.t, this.n).normalize();
      for (let j = 0; j <= this.radial; j++) {
        const a = (j / this.radial) * Math.PI * 2;
        const r = this.radius;
        pos.setXYZ(
          i * (this.radial + 1) + j,
          this.p.x + (this.n.x * Math.cos(a) + this.b.x * Math.sin(a)) * r,
          this.p.y + (this.n.y * Math.cos(a) + this.b.y * Math.sin(a)) * r,
          this.p.z + (this.n.z * Math.cos(a) + this.b.z * Math.sin(a)) * r,
        );
      }
    }
    pos.needsUpdate = true;
  }
}

/* ------------------------------------------------------------------------------------------------ the rig */

export type Appearance = { coat: number; skeleton: boolean; rider: number; tack: boolean };

const BONE_COLOR = new THREE.Color("#d4c19b");

export class StrideRig {
  /** Add this to the scene. Model space: +Y up, the horse faces +Z, +X is its left, metres. */
  readonly root = new THREE.Group();
  readonly data!: StrideData;

  private readonly mixer: THREE.AnimationMixer;
  private readonly plant: PlantLayer;
  private readonly walkAction: THREE.AnimationAction;
  private readonly walkDuration: number;
  private readonly seat: SeatFrame;
  private readonly anchors = new Map<string, Anchor>();
  private readonly hotspotAnchors = new Map<HotspotId, Anchor>();
  private readonly saddleAttach = new THREE.Group();
  private readonly riderAttach = new THREE.Group();
  private readonly riderRoot: THREE.Object3D;
  private readonly riderBones: Record<string, THREE.Bone> = {};
  private readonly riderChain: THREE.Bone[];
  private readonly riderChainRest: THREE.Quaternion[];
  private readonly riderMaterials: THREE.Material[] = [];
  private readonly reins: { tube: LiveTube; hand: string; bit: string; mid: string }[] = [];
  private readonly layers = { bones: [] as THREE.Mesh[], tack: [] as THREE.Mesh[], hair: [] as THREE.Mesh[], eyes: [] as THREE.Mesh[] };

  /** Filtered (soft-seat) frame of the rider's pelvis, one entry per sample: displacement of the seat origin and rotation vector, both from the rest frame. */
  private followP: [Float64Array, Float64Array, Float64Array] = [new Float64Array(0), new Float64Array(0), new Float64Array(0)];
  private followR: [Float64Array, Float64Array, Float64Array] = [new Float64Array(0), new Float64Array(0), new Float64Array(0)];
  private followReady = false;

  private appearance: Appearance = { coat: 1, skeleton: false, rider: 1, tack: true };
  private readonly boneMaterial = new THREE.MeshStandardMaterial({ color: BONE_COLOR, roughness: 0.6, metalness: 0, name: "StrideBone" });
  private disposed = false;

  private readonly tmpA = new THREE.Vector3();
  private readonly tmpB = new THREE.Vector3();
  private readonly tmpC = new THREE.Vector3();
  private readonly tmpQ = new THREE.Quaternion();
  private readonly tmpM = new THREE.Matrix4();
  private readonly qParent = new THREE.Quaternion();
  private readonly qTarget = new THREE.Quaternion();
  private readonly qWork = new THREE.Quaternion();
  private readonly qId = new THREE.Quaternion();
  private readonly riderDelta = new THREE.Matrix4();
  private readonly riderDq = new THREE.Quaternion();
  private readonly rv = new THREE.Vector3();

  constructor(readonly horse: Marwari, riderGltf: GLTF) {
    this.root.name = "stride-rig";
    this.root.add(horse.root);
    this.root.updateMatrixWorld(true);

    // anchors exported with the horse (seat corners, spine line, withers, loin, croup, poll, bit) and with the cadet
    const horseRest = this.bindAnchors(horse.root, (n) => horse.bones[n]);
    this.sortLayers(horse.root);
    horse.mesh.renderOrder = 4;
    horse.root.traverse((o) => {
      if ((o as THREE.SkinnedMesh).isSkinnedMesh) o.frustumCulled = false;
    });

    // the animation: one clip, driven by hand (paused; time is set from the stride phase)
    this.mixer = new THREE.AnimationMixer(horse.root);
    this.plant = new PlantLayer(horse.bones, AUTHORED.strideLengthM);
    this.plant.enabled = false;
    const clip = horse.clips.get(WALK_CLIP);
    if (!clip) throw new Error("The Walk clip is missing from the model");
    this.walkDuration = clip.duration;
    this.walkAction = this.mixer.clipAction(clip);
    this.walkAction.play();
    this.walkAction.paused = true;

    // the seat, found in the bind pose
    const seatNames = ["Seat_F", "Seat_B", "Seat_L", "Seat_R"];
    const seatRest = seatNames.map((n) => horseRest[n]);
    if (!seatRest.every(Boolean)) throw new Error("The seat anchors are missing from the model");
    this.seat = new SeatFrame(horse.mesh, seatRest.map((p) => horse.root.worldToLocal(p.clone())));

    // saddle (rigid on the seat) and rider (rigid on the soft-seat pelvis)
    this.root.add(this.saddleAttach, this.riderAttach);
    for (const a of [this.saddleAttach, this.riderAttach]) {
      a.matrixAutoUpdate = false;
    }
    for (const m of this.layers.tack) if (m.name === "Tack_Saddle" || m.name === "Tack_Flaps") this.saddleAttach.add(m);

    this.riderRoot = riderGltf.scene;
    this.riderAttach.add(this.riderRoot);
    this.riderAttach.updateMatrixWorld(true);
    this.riderRoot.traverse((o) => {
      if ((o as THREE.Bone).isBone) this.riderBones[o.name] = o as THREE.Bone;
      const mesh = o as THREE.Mesh;
      if (mesh.isMesh) {
        mesh.castShadow = false;
        if ((o as THREE.SkinnedMesh).isSkinnedMesh) o.frustumCulled = false;
        for (const mat of Array.isArray(mesh.material) ? mesh.material : [mesh.material]) if (!this.riderMaterials.includes(mat)) this.riderMaterials.push(mat);
      }
    });
    this.bindAnchors(this.riderRoot, (n) => this.riderBones[n]);
    const chainNames = ["R_Pelvis", "R_Spine", "R_Chest", "R_Neck", "R_Head"];
    this.riderChain = chainNames.map((n) => this.riderBones[n]).filter(Boolean);
    this.riderChainRest = this.riderChain.map((b) => b.quaternion.clone());

    // reins: from the rider's hands out around the neck to the bit
    const reinMaterial = new THREE.MeshStandardMaterial({ color: "#2a1a10", roughness: 0.6 });
    for (const side of ["L", "R"]) {
      const tube = new LiveTube(24, 6, 0.0045, reinMaterial);
      this.root.add(tube.mesh);
      this.reins.push({ tube, hand: `RAnchor_Hand_${side}`, bit: `Anchor_Bit_${side}`, mid: `Anchor_ReinMid_${side}` });
    }

    this.root.add(horse.contacts.group);

    this.resolveHotspots();
    this.data = this.buildData();
    this.setPhase(0);
    this.applyAppearance(this.appearance, true);
  }

  /* -------------------------------------------------------------------------------------------- scene graph pieces */

  private bindAnchors(root: THREE.Object3D, boneOf: (name: string) => THREE.Object3D | undefined) {
    root.updateMatrixWorld(true);
    const found: THREE.Object3D[] = [];
    root.traverse((o) => {
      if (o.userData && o.userData.layer === "anchor") found.push(o);
    });
    const rest: Record<string, THREE.Vector3> = {};
    for (const o of found) {
      const bone = boneOf(o.userData.bone as string);
      const p = o.getWorldPosition(new THREE.Vector3());
      rest[o.name] = p.clone();
      if (bone) this.anchors.set(o.name, { bone, local: bone.worldToLocal(p.clone()) });
      o.removeFromParent();
    }
    return rest;
  }

  private sortLayers(root: THREE.Object3D) {
    const drop: THREE.Mesh[] = [];
    root.traverse((o) => {
      const mesh = o as THREE.Mesh;
      if (!mesh.isMesh) return;
      const n = mesh.name || "";
      if (n.startsWith("Bone_")) {
        mesh.material = this.boneMaterial;
        this.layers.bones.push(mesh);
      } else if (n.startsWith("Muscle_")) {
        drop.push(mesh); // the muscle layer belongs to the anatomy exhibit; this study does not show it
      } else if (n.startsWith("Tack_")) {
        this.layers.tack.push(mesh);
      }
      if (n === "Marwari_Hair") this.layers.hair.push(mesh);
      if (n === "Marwari_Eyes") this.layers.eyes.push(mesh);
      mesh.castShadow = false;
    });
    for (const mesh of drop) {
      mesh.removeFromParent();
      mesh.geometry.dispose();
    }
  }

  /** Places the hotspots from the rig: a named anchor, or a joint pushed out to the coat on the horse's right side. */
  private resolveHotspots() {
    const coat = this.horse.mesh.geometry.attributes.position;
    for (const h of HOTSPOTS) {
      if (h.anchor) {
        const a = this.anchors.get(h.anchor);
        if (a) this.hotspotAnchors.set(h.id, a);
        continue;
      }
      const isRider = h.kind === "rider";
      const bone: THREE.Object3D | undefined = isRider ? this.riderBones[h.bone!] : this.horse.bones[h.bone!];
      if (!bone) continue;
      const p = bone.getWorldPosition(new THREE.Vector3());
      if (h.bone2) {
        const q = this.horse.bones[h.bone2]?.getWorldPosition(new THREE.Vector3());
        if (q) p.lerp(q, 0.5);
      }
      // the hoof: the lower end of the hoof bone, where the wall meets the ground
      if (h.kind === "hoof") bone.localToWorld(p.set(0, HOOF_LENGTH_M * 0.85, 0));
      if (h.right) {
        // the right-most coat vertex within a hand's breadth of the joint, so the marker sits on the visible flank
        let minX = p.x;
        for (let i = 0; i < coat.count; i++) {
          const dy = coat.getY(i) - p.y;
          const dz = coat.getZ(i) - p.z;
          if (dy * dy + dz * dz < 0.12 * 0.12 && coat.getX(i) < minX) minX = coat.getX(i);
        }
        p.x = minX;
      }
      this.hotspotAnchors.set(h.id, { bone, local: bone.worldToLocal(p.clone()) });
    }
  }

  /** World position (horse model space) of a hotspot at the current pose. */
  hotspotWorld(id: HotspotId, out: THREE.Vector3): THREE.Vector3 | null {
    const a = this.hotspotAnchors.get(id);
    return a ? a.bone.localToWorld(out.copy(a.local)) : null;
  }

  anchorWorld(name: string, out: THREE.Vector3): THREE.Vector3 | null {
    const a = this.anchors.get(name);
    return a ? a.bone.localToWorld(out.copy(a.local)) : null;
  }

  /** World position of a hoof's toe point at the current pose. */
  toeWorld(limb: Limb, out: THREE.Vector3): THREE.Vector3 {
    return out.set(0, HOOF_LENGTH_M, 0).applyMatrix4(this.horse.bones[HOOF_BONE[limb]].matrixWorld);
  }

  /** The poll and the points of the spine line, for overlays. */
  spineLine(): THREE.Vector3[] {
    const out: THREE.Vector3[] = [];
    for (let i = 0; i < 8; i++) {
      const p = this.anchorWorld(`SpineLine_${i}`, new THREE.Vector3());
      if (p) out.push(p);
    }
    return out;
  }

  /* -------------------------------------------------------------------------------------------- posing */

  /** Horse pose for a stride phase: the only place the clip is evaluated. */
  private poseHorse(phase: number) {
    this.plant.undo();
    this.walkAction.time = wrap01(phase) * this.walkDuration;
    this.mixer.update(0);
    this.horse.root.updateMatrixWorld(true);
    this.plant.apply(phase);
    this.horse.mesh.skeleton.update();
  }

  /** Switch the stance hold on or off (the page keeps it on; checks compare with the clip as authored). */
  setPlanting(on: boolean) {
    this.plant.enabled = on;
  }
  get planting() {
    return this.plant.enabled;
  }

  /** The saddle follows the horse's back exactly. */
  private poseSaddle() {
    this.saddleAttach.matrix.copy(this.seat.update());
    this.saddleAttach.matrixWorldNeedsUpdate = true;
    this.saddleAttach.updateMatrixWorld(true);
  }

  /** The rider follows the soft-seat frame at this phase, and the torso keeps a share of the tilt. */
  private poseRider(phase: number) {
    if (!this.followReady) return;
    const n = SAMPLES;
    const x = wrap01(phase) * n;
    const i0 = Math.floor(x) % n;
    const i1 = (i0 + 1) % n;
    const f = x - Math.floor(x);
    const lerp = (a: Float64Array) => a[i0] * (1 - f) + a[i1] * f;
    const dP = this.tmpA.set(lerp(this.followP[0]), lerp(this.followP[1]), lerp(this.followP[2]));
    const dq = fromRotVec(this.rv.set(lerp(this.followR[0]), lerp(this.followR[1]), lerp(this.followR[2])).toArray(), this.riderDq);
    // delta = frame * restInverse: rotation dq about the seat's rest origin, then the origin's own displacement
    const rest = this.seat.restPosition;
    const t = this.tmpB.copy(rest).add(dP).sub(this.tmpC.copy(rest).applyQuaternion(dq));
    this.riderDelta.compose(t, dq, this.tmpC.set(1, 1, 1));
    this.riderAttach.matrix.copy(this.riderDelta);
    this.riderAttach.matrixWorldNeedsUpdate = true;

    this.qParent.copy(dq);
    this.riderChain.forEach((bone, i) => {
      if (i === 0) {
        bone.quaternion.copy(this.riderChainRest[0]);
        return;
      }
      this.qTarget.copy(this.qId).slerp(dq, TORSO_SHARE[i]);
      this.qWork.copy(this.qParent).invert().multiply(this.qTarget);
      bone.quaternion.copy(this.riderChainRest[i]).premultiply(this.qWork);
      this.qParent.copy(this.qTarget);
    });
    this.riderAttach.updateMatrixWorld(true);
  }

  private poseReins() {
    const a = new THREE.Vector3();
    const b = new THREE.Vector3();
    const m = new THREE.Vector3();
    for (const r of this.reins) {
      const hasMid = this.anchorWorld(r.mid, m);
      if (!this.anchorWorld(r.hand, a) || !this.anchorWorld(r.bit, b)) {
        r.tube.mesh.visible = false;
        continue;
      }
      r.tube.mesh.visible = this.appearance.rider > 0.02;
      if (!hasMid) m.copy(a).lerp(b, 0.5);
      m.y -= 0.01;
      r.tube.update([a, m, b]);
    }
  }

  /** Puts the whole rig at a stride phase (0..1). Everything is a function of the phase alone, so scrubbing and playing agree. */
  setPhase(phase: number) {
    this.poseHorse(phase);
    this.poseSaddle();
    this.poseRider(phase);
    this.poseReins();
  }

  /* -------------------------------------------------------------------------------------------- appearance */

  applyAppearance(next: Appearance, force = false) {
    const a = this.appearance;
    if (!force && a.coat === next.coat && a.skeleton === next.skeleton && a.rider === next.rider && a.tack === next.tack) return;
    this.appearance = { ...next };
    const m = this.horse.material;
    m.transparent = next.coat < 0.995;
    m.opacity = next.coat;
    m.depthWrite = next.coat >= 0.995;
    for (const bone of this.layers.bones) bone.visible = next.skeleton;
    for (const h of this.layers.hair) h.visible = !next.skeleton && next.coat > 0.5;
    for (const e of this.layers.eyes) e.visible = !next.skeleton && next.coat > 0.5;
    for (const t of this.layers.tack) t.visible = next.tack;
    for (const mat of this.riderMaterials) {
      mat.transparent = next.rider < 0.995;
      mat.opacity = next.rider;
      mat.depthWrite = next.rider >= 0.995;
    }
    this.riderAttach.visible = next.rider > 0.01;
    for (const r of this.reins) r.tube.mesh.visible = next.rider > 0.02;
  }

  /* -------------------------------------------------------------------------------------------- the curves */

  private joint(a: string, b: string, c: string) {
    const pa = this.tmpA.setFromMatrixPosition(this.horse.bones[a].matrixWorld);
    const pb = this.tmpB.setFromMatrixPosition(this.horse.bones[b].matrixWorld);
    const pc = this.tmpC.setFromMatrixPosition(this.horse.bones[c].matrixWorld);
    pa.sub(pb).normalize();
    pc.sub(pb).normalize();
    return Math.acos(Math.max(-1, Math.min(1, pa.dot(pc)))) * RAD;
  }

  /** Samples one stride of the playing animation and derives everything the graph and the timeline draw. */
  private buildData(): StrideData {
    const N = SAMPLES;
    const T = STUDY_STRIDE_SECONDS;
    const L = AUTHORED.strideLengthM;

    const scratch = new THREE.Vector3();
    type Toes = Record<Limb, { x: number[]; y: number[]; z: number[] }>;
    const sampleHorse = () => {
      const seatP: THREE.Vector3[] = [];
      const rotRaw: number[][] = [];
      const toe: Toes = { FL: { x: [], y: [], z: [] }, FR: { x: [], y: [], z: [] }, HL: { x: [], y: [], z: [] }, HR: { x: [], y: [], z: [] } };
      const jointSeries: Record<JointId, number[]> = { elbow: [], carpus: [], fetlockF: [], stifle: [], hock: [], fetlockH: [] };
      const hotspotSum = new Map<HotspotId, THREE.Vector3>(HOTSPOTS.map((h) => [h.id, new THREE.Vector3()]));
      for (let i = 0; i < N; i++) {
        this.poseHorse(i / N);
        this.seat.update();
        const P = new THREE.Vector3();
        const Q = new THREE.Quaternion();
        this.seat.matrix.decompose(P, Q, scratch.set(1, 1, 1));
        seatP.push(P);
        rotRaw.push(rotVec(Q.clone().multiply(this.seat.restQuat.clone().invert()), [0, 0, 0]));
        for (const l of LIMBS) {
          this.toeWorld(l, scratch);
          toe[l].x.push(scratch.x);
          toe[l].y.push(scratch.y);
          toe[l].z.push(scratch.z);
        }
        jointSeries.elbow.push(this.joint("Humerus_R", "Forearm_R", "Cannon_F_R"));
        jointSeries.carpus.push(this.joint("Forearm_R", "Cannon_F_R", "Pastern_F_R"));
        jointSeries.fetlockF.push(this.joint("Cannon_F_R", "Pastern_F_R", "Hoof_F_R"));
        jointSeries.stifle.push(this.joint("Femur_R", "Gaskin_R", "Cannon_B_R"));
        jointSeries.hock.push(this.joint("Gaskin_R", "Cannon_B_R", "Pastern_B_R"));
        jointSeries.fetlockH.push(this.joint("Cannon_B_R", "Pastern_B_R", "Hoof_B_R"));
        for (const h of HOTSPOTS) {
          if (h.kind === "rider") continue;
          const w = this.hotspotWorld(h.id, scratch);
          if (w) hotspotSum.get(h.id)!.add(w);
        }
      }
      return { seatP, rotRaw, toe, jointSeries, hotspotSum };
    };

    // pass one: the clip as authored. Its toe paths give the stance windows and where each hoof landed.
    this.plant.enabled = false;
    const authored = sampleHorse();
    const stance = {} as Record<Limb, Stance>;
    for (const l of LIMBS) {
      const st = detectStance(authored.toe[l].y, authored.toe[l].z, { strideLength: L, cycleSeconds: AUTHORED.strideSeconds, clearance: STANCE_CLEARANCE_M, approachMax: ARRIVING_MPS, plantedSpeed: PLANTED_MPS });
      stance[l] = st;
      const anchorPhase = wrap01(st.touchdown + 0.05);
      const ai = Math.round(anchorPhase * N) % N;
      this.plant.configure(l, { touchdown: st.touchdown, liftoff: st.liftoff, anchorPhase, anchor: [authored.toe[l].x[ai], Math.max(SOLE_TO_TOE_M, st.plantedHeight), authored.toe[l].z[ai]] });
    }
    // pass two: the same stride with the stance hold on; everything the page shows is read from this one
    this.plant.enabled = true;
    const { seatP, rotRaw, toe, jointSeries, hotspotSum } = sampleHorse();

    // the soft seat: the pelvis follows the saddle through a second-order low-pass, exactly and periodically
    const col = (rows: ArrayLike<number>[], k: number) => Float64Array.from(rows, (r) => r[k]);
    const filt = (series: Float64Array) => periodicSecondOrder(series, T, SOFT_SEAT.fnHz, SOFT_SEAT.zeta);
    const restP = this.seat.restPosition;
    this.followP = [0, 1, 2].map((k) => filt(Float64Array.from(seatP, (p) => (k === 0 ? p.x : k === 1 ? p.y : p.z) - (k === 0 ? restP.x : k === 1 ? restP.y : restP.z)))) as typeof this.followP;
    this.followR = [0, 1, 2].map((k) => filt(col(rotRaw, k))) as typeof this.followR;
    this.followReady = true;

    // read the rider's pelvis bone while the rider follows the filtered frame
    const pelvis = this.riderBones.R_Pelvis;
    this.riderRoot.updateMatrixWorld(true);
    const pelvisRestQ = new THREE.Quaternion();
    {
      // rest = no displacement
      const keepP = this.followP.map((a) => a.slice()) as typeof this.followP;
      const keepR = this.followR.map((a) => a.slice()) as typeof this.followR;
      for (const a of this.followP) a.fill(0);
      for (const a of this.followR) a.fill(0);
      this.poseRider(0);
      pelvis.getWorldQuaternion(pelvisRestQ);
      this.followP = keepP;
      this.followR = keepR;
    }
    const riderP: THREE.Vector3[] = [];
    const riderRot: number[][] = [];
    for (let i = 0; i < N; i++) {
      this.poseRider(i / N);
      riderP.push(pelvis.getWorldPosition(new THREE.Vector3()));
      const q = pelvis.getWorldQuaternion(new THREE.Quaternion()).multiply(pelvisRestQ.clone().invert());
      riderRot.push(rotVec(q, [0, 0, 0]));
    }

    const centred = (values: number[], scale: number) => {
      const m = mean(values);
      return Float64Array.from(values, (v) => (v - m) * scale);
    };
    const mk = (id: ChannelId, label: string, unit: "mm" | "°", horse: Float64Array, rider: Float64Array): Channel => {
      const amps = harmonicAmplitudes(horse, 6);
      let best = 0;
      for (let k = 1; k < amps.length; k++) if (amps[k] > amps[best]) best = k;
      return { id, label, unit, horse, rider, horseP2P: peakToPeak(horse), riderP2P: peakToPeak(rider), perStride: best + 1 };
    };
    const channels: Record<ChannelId, Channel> = {
      vertical: mk("vertical", "Up and down", "mm", centred(seatP.map((p) => p.y), 1000), centred(riderP.map((p) => p.y), 1000)),
      lateral: mk("lateral", "Side to side", "mm", centred(seatP.map((p) => p.x), 1000), centred(riderP.map((p) => p.x), 1000)),
      foreaft: mk("foreaft", "Forward and back", "mm", centred(seatP.map((p) => p.z), 1000), centred(riderP.map((p) => p.z), 1000)),
      pitch: mk("pitch", "Tilt forward and back", "°", centred(rotRaw.map((r) => r[0]), RAD), centred(riderRot.map((r) => r[0]), RAD)),
      roll: mk("roll", "Tilt side to side", "°", centred(rotRaw.map((r) => r[2]), RAD), centred(riderRot.map((r) => r[2]), RAD)),
    };

    // hoof figures at the authored tempo (speeds scale with the tempo; distances do not), over the planted period of each stance: from 5 % of a
    // stride after touchdown to 6 % before lift-off (a hoof is still arriving or already leaving outside it)
    const dtAuthored = AUTHORED.strideSeconds / N;
    const vAuthored = L / AUTHORED.strideSeconds;
    const figures = (toes: Toes, l: Limb) => {
      const s = stance[l];
      const start = Math.round(s.touchdown * N);
      const len = Math.round(s.duty * N);
      const k0 = Math.round(0.05 * N);
      const k1 = len - Math.round(0.06 * N);
      const t = toes[l];
      let drift = 0;
      let speed = 0;
      let lo = Infinity;
      let hi = -Infinity;
      const i0 = (start + k0) % N;
      for (let k = k0; k < k1; k++) {
        const i = (start + k) % N;
        const dz = (t.z[(i + 1) % N] - t.z[(i + N - 1) % N]) / (2 * dtAuthored);
        const dx = (t.x[(i + 1) % N] - t.x[(i + N - 1) % N]) / (2 * dtAuthored);
        speed = Math.max(speed, Math.hypot(dz + vAuthored, dx));
        drift = Math.max(drift, Math.hypot(t.x[i] - t.x[i0], t.z[i] + L * ((k - k0) / N) - t.z[i0]));
        const above = (t.y[i] - SOLE_TO_TOE_M) * 1000;
        lo = Math.min(lo, above);
        hi = Math.max(hi, above);
      }
      return { driftCm: drift * 100, plantedSpeedMps: speed, toeAboveSoleMm: [lo, hi] as [number, number], touchdownXZ: [t.x[start], t.z[start]] as [number, number] };
    };
    const feet = {} as StrideData["feet"];
    const feetAuthored = {} as StrideData["feetAuthored"];
    for (const l of LIMBS) {
      feet[l] = figures(toe, l);
      const a = figures(authored.toe, l);
      feetAuthored[l] = { driftCm: a.driftCm, plantedSpeedMps: a.plantedSpeedMps };
    }
    const masks = LIMBS.map((l) => stance[l].mask);
    const support = supportCount(masks);
    const td = Object.fromEntries(LIMBS.map((l) => [l, stance[l].touchdown])) as Record<Limb, number>;
    const { order, gaps } = footfallOrder(td);

    const joints = {} as StrideData["joints"];
    for (const k of Object.keys(jointSeries) as JointId[]) {
      const s = Float64Array.from(jointSeries[k]);
      joints[k] = { series: s, min: Math.min(...s), max: Math.max(...s) };
    }

    const hotspotMean = {} as Record<HotspotId, THREE.Vector3>;
    for (const h of HOTSPOTS) hotspotMean[h.id] = h.kind === "rider" ? new THREE.Vector3() : hotspotSum.get(h.id)!.clone().divideScalar(N);
    {
      const rp = new THREE.Vector3();
      for (let i = 0; i < N; i++) rp.add(riderP[i]);
      hotspotMean["rider-pelvis"] = rp.divideScalar(N);
    }

    const response = secondOrderResponse((2 / T), SOFT_SEAT.fnHz, SOFT_SEAT.zeta);

    return {
      samples: N,
      strideSeconds: T,
      channels,
      stance,
      touchdownOrder: order as Limb[],
      touchdownGaps: gaps,
      support,
      minSupport: Math.min(...support),
      maxSupport: Math.max(...support),
      feet,
      feetAuthored,
      joints,
      seatLagMs: response.delaySeconds * 1000,
      seatGain: response.gain,
      seatCyclesPerMinute: (60 / T) * channels.vertical.perStride,
      hotspotMean,
    };
  }

  /* -------------------------------------------------------------------------------------------- readouts */

  /** What the scene actually holds right now (read from the posed objects, not from the tables): the saddle seat and the rider's pelvis, in mm from the rest pose. For checks. */
  liveSample() {
    const seat = this.seat.update();
    const p = this.tmpA.setFromMatrixPosition(this.seat.matrix);
    const pelvis = this.riderBones.R_Pelvis.getWorldPosition(this.tmpB);
    void seat;
    return { seat: [p.x, p.y, p.z] as [number, number, number], pelvis: [pelvis.x, pelvis.y, pelvis.z] as [number, number, number] };
  }

  /** The toe of each hoof right now, from the posed skeleton. For checks. */
  liveToes() {
    return Object.fromEntries(LIMBS.map((l) => [l, this.toeWorld(l, new THREE.Vector3()).toArray()])) as unknown as Record<Limb, number[]>;
  }

  get shown() {
    return { coat: this.appearance.coat, rider: this.appearance.rider, skeleton: this.appearance.skeleton, riderVisible: this.riderAttach.visible };
  }

  /** A curve's value at a phase, for live readouts. */
  at(series: Float64Array, phase: number) {
    return sampleCyclic(series, phase);
  }

  /** Ground-frame landing spots of the hooves, for the rings on the floor: z in horse model space at phase 0 of every stride. */
  get landing() {
    return LIMBS.map((l) => ({ limb: l, x: this.data.feet[l].touchdownXZ[0], z: this.data.feet[l].touchdownXZ[1], phase: this.data.stance[l].touchdown }));
  }

  /** Round y-axis range for a channel (mm or degrees). */
  axis(channel: Channel) {
    const span = Math.max(channel.horseP2P, channel.riderP2P);
    const half = Math.max(span / 2, 1e-6) * 1.25;
    const ticks = niceTicks(-half, half, 4);
    const top = Math.max(...ticks.map(Math.abs));
    return { min: -top, max: top, ticks };
  }

  dispose() {
    if (this.disposed) return;
    this.disposed = true;
    this.mixer.stopAllAction();
    this.horse.contacts.dispose();
    for (const r of this.reins) {
      r.tube.mesh.geometry.dispose();
      (r.tube.mesh.material as THREE.Material).dispose();
    }
    this.boneMaterial.dispose();
    disposeObject(this.root);
  }
}
