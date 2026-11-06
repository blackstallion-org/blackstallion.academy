import * as THREE from "three";
import type { GLTF } from "three/examples/jsm/loaders/GLTFLoader.js";
import { clone as cloneSkinned } from "three/examples/jsm/utils/SkeletonUtils.js";

/**
 * The cavalry of World 03: one long column of riders, two files, cantering along a track across the plain (z = TRACK_Z,
 * travelling +X) round a 120 m loop, so whenever the camera looks at the track there are riders in shot.
 * Each horse is a clone of cavalry.glb (the academy's Marwari rig, decimated, untextured, two rider variants skinned to the
 * lumbar spine). The canter is foot-locked to the ground: each horse's clip phase is its distance travelled divided by the
 * stride length, so the hooves do not skate, at any scroll speed and in either direction.
 * Travel = a fixed slot per rider + the canter speed x time (ambient) + a share of the scroll progress (so scrolling moves them
 * too), wrapped over a loop whose seam lies far outside every shot.
 */
export const TRACK_Z = -105;
const LOOP = 120; // metres, x from -LOOP/2 to +LOOP/2: one continuous column round the loop, so riders are always in shot
const SPEED = 5.4; // m/s, a working canter
const STRIDE = 2.898 * (5.4 / 4.83); // the canter clip's stride, scaled with the speed (longer, not faster, strides)

type Rider = { root: THREE.Object3D; mixer: THREE.AnimationMixer; action: THREE.AnimationAction; slot: number; lane: number; bob: number; dur: number };

export class Cavalry {
  readonly group = new THREE.Group();
  private riders: Rider[] = [];
  readonly materials: THREE.Material[] = [];
  centroid = new THREE.Vector3(0, 0, TRACK_Z);
  private shadows = true;
  set castShadow(v: boolean) {
    if (v === this.shadows) return;
    this.shadows = v;
    this.group.traverse((o) => { if ((o as THREE.Mesh).isMesh) o.castShadow = v; });
  }

  constructor(gltf: GLTF, count: number, private ground: (x: number, z: number) => number) {
    this.group.name = "cavalry";
    const coats = [new THREE.Color("#0d0b0a"), new THREE.Color("#3a1f12"), new THREE.Color("#22140d"), new THREE.Color("#6d6660"), new THREE.Color("#120e0c")];
    const coatMats = coats.map((c, i) => new THREE.MeshStandardMaterial({ color: c, roughness: i === 3 ? 0.7 : 0.48, metalness: 0, name: `cavalry-coat-${i}` }));
    const riderMat = new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.85, metalness: 0, name: "cavalry-rider" });
    this.materials.push(...coatMats, riderMat);
    const clip = gltf.animations.find((a) => a.name === "Canter_R") ?? gltf.animations[0];
    const spacing = LOOP / count;
    for (let i = 0; i < count; i++) {
      const group = i % 3;
      const root = cloneSkinned(gltf.scene);
      root.traverse((o) => {
        const m = o as THREE.SkinnedMesh;
        if (!m.isMesh) return;
        // cull per horse: a fixed sphere round the horse, rider and raised lance (the bind-pose bounds would miss the lance tip)
        m.boundingSphere = new THREE.Sphere(new THREE.Vector3(0, 1.6, 0), 4.2);
        m.frustumCulled = true;
        m.castShadow = true;
        m.receiveShadow = true;
        if (m.name.startsWith("Rider")) {
          m.material = riderMat;
          // alternate the two rider variants
          const variantB = m.name.endsWith("B");
          m.visible = variantB === ((i * 7 + 3) % 3 === 0);
        } else {
          m.material = coatMats[(i * 5 + group) % coatMats.length];
        }
      });
      const mixer = new THREE.AnimationMixer(root);
      const action = mixer.clipAction(clip);
      action.play();
      action.timeScale = 0; // the phase is set from the distance travelled
      this.group.add(root);
      this.riders.push({
        root,
        mixer,
        action,
        slot: i * spacing + Math.sin(i * 12.9) * spacing * 0.22,
        lane: (i % 2 === 0 ? -1.1 : 1.1) * (spacing < 6 ? 1 : 0.4) + Math.sin(i * 3.1) * 0.45,
        bob: i * 0.37,
        dur: clip.duration,
      });
    }
  }

  /** p: the world's progress (0..1); time: ambient seconds. */
  update(p: number, time: number) {
    let cx = 0;
    let n = 0;
    for (const r of this.riders) {
      const travel = r.slot + SPEED * time + 60 * p;
      const x = ((((travel + LOOP / 2) % LOOP) + LOOP) % LOOP) - LOOP / 2;
      const z = TRACK_Z + r.lane;
      r.root.position.set(x, this.ground(x, z), z);
      r.root.rotation.y = Math.PI / 2; // facing +X
      const phase = (travel / STRIDE + r.bob) % 1;
      r.action.time = ((phase + 1) % 1) * r.dur;
      r.mixer.update(0);
      // riders near the loop seam are hidden (far off screen in every shot)
      r.root.visible = Math.abs(x) < LOOP / 2 - 5;
      if (Math.abs(x) < 60) { cx += x; n++; }
    }
    this.centroid.set(n ? cx / n : 0, 0, TRACK_Z);
  }

  dispose() {
    for (const r of this.riders) r.mixer.stopAllAction();
    for (const m of this.materials) m.dispose();
    // geometries are shared with the source gltf (disposed by the world)
  }
}
