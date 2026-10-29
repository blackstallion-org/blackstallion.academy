/**
 * "One conversation. Two bodies." — the exhibit stage.
 *
 * A static module page (public/anatomy/dual-body.html) on the site's three.js (vendored by scripts/build-anatomy-vendor.mjs).
 * The horse is the site's rigged black Marwari (public/models/anatomy-exhibit.glb: the hero's rig and gait clips plus a skeleton,
 * a muscle layer and tack built from that same armature in tools/blender/06_exhibit). The cadet is public/models/cadet-rider.glb.
 * Walk / Trot / Canter play the Marwari's own clips; the cadet rides the real deformation of the horse's back.
 *
 * Page contract with components/sections/anatomy/DualBody.tsx (unchanged): `bsah-anatomy-visibility` in, `bsah-anatomy-height` out.
 */
import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import { RoomEnvironment } from "three/examples/jsm/environments/RoomEnvironment.js";
import { DRACOLoader } from "three/examples/jsm/loaders/DRACOLoader.js";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import { loadMarwari } from "./vendor/marwari/marwari.js";

const HORSE_URL = (() => {
  const o = new URLSearchParams(location.search).get("horse"); // QA: ?horse=/models/other.glb
  return o && /^\/models\/[\w.-]+\.glb$/.test(o) ? o : "/models/anatomy-exhibit.glb";
})();
const RIDER_URL = "/models/cadet-rider.glb";

/* ------------------------------------------------------------------ 1. copy and data */
const CONNECTIONS = [
  {
    number: "01",
    title: "Cervical alignment",
    subtitle: "EARS & ATTENTION",
    description:
      "A steady trunk and balanced seat help the rider follow the horse’s movement without gripping. Instructor feedback connects posture to a quieter, more responsive horse. Horse programmes have been linked to lower stress hormones in children (one trial: Pendry, Smith & Roeter, 2014).",
    pill: "Brain · attention",
    riderStructure: "Cranio-Cervical Axis & Soft Rein Contact",
    horseStructure: "Poll (C1–C2), Cervical Arch & Lyre Ears",
    pinCadetText: "CADET SPINE",
    pinEquineText: "MARWARI EQUINE",
    region: "poll_cervical",
    rider: "RAnchor_Neck",
    horse: "Anchor_Poll",
    zoomMix: [0, 0],
    intensity: [1.0, 0.85, 0.9],
  },
  {
    number: "02",
    title: "Core posture",
    subtitle: "WITHERS & SEAT",
    description:
      "When the cadet’s ribcage aligns vertically over the ischial seat bones, the horse’s trapezius and thoracolumbar bridge lift freely underneath the saddle tree without hollowing. Walk, trot and canter keep the heart and lungs working at a steady, moderate effort.",
    pill: "Heart · steady effort",
    riderStructure: "Thoracic Core (T1–T12) & Balanced Seat",
    horseStructure: "Withers (T3–T8), Scapula & Longissimus Bridge",
    pinCadetText: "CADET CORE & SEAT",
    pinEquineText: "THORACIC BRIDGE",
    region: "withers_thorax",
    rider: "RAnchor_Core",
    horse: "Anchor_Withers",
    zoomMix: [0, 0],
    intensity: [0.85, 1.0, 0.7],
  },
  {
    number: "03",
    title: "Lumbar balance",
    subtitle: "REINS & CONTACT",
    description:
      "A supple lumbar spine absorbs the three-dimensional oscillation of the horse’s back, allowing hindquarter impulsion to flow through the lumbosacral junction into a soft, elastic rein. At the walk the horse moves the rider’s pelvis about a hundred times a minute, much like human gait.",
    pill: "Spine · pelvis in motion",
    riderStructure: "Supple Lumbar L1–L5 & Following Pelvis",
    horseStructure: "Lumbosacral Junction, Pelvis & Gluteals",
    pinCadetText: "CADET LUMBAR",
    pinEquineText: "LUMBOSACRAL ENGINE",
    region: "lumbosacral_pelvis",
    rider: "RAnchor_Lumbar",
    horse: "Anchor_Loin",
    zoomMix: [0, 0],
    intensity: [0.8, 0.95, 1.0],
  },
];

const REGIONS = {
  poll_cervical: {
    title: "Splenius & Brachiocephalicus",
    subtitle: "CERVICAL ELEVATION & LATERAL SUPPLENESS",
    description:
      "Extending from the poll and nuchal crest along the cervical vertebrae to the shoulder, these muscles telescope the Marwari’s arched neck forward and upward when the rider maintains an unblocked hand.",
    riderStructure: "Soft Elbows & Visual Focus Ahead",
    horseStructure: "Splenius Cervicis, Brachiocephalicus & Poll (C1–C7)",
  },
  withers_thorax: {
    title: "Trapezius, Deltoideus & Triceps Brachii",
    subtitle: "SCAPULAR SLING & FOREHAND LIFT",
    description:
      "Suspends the scapula and lifts the base of the neck and withers (T3–T8) between the shoulders, creating self-carriage and freeing the forelimbs for expressive flexion.",
    riderStructure: "Balanced Thoracic Ribcage Over Stirrup",
    horseStructure: "Trapezius, Deltoideus, Triceps & Scapula",
  },
  thoracolumbar: {
    title: "Longissimus Dorsi & Abdominal Sling",
    subtitle: "PRIMARY THORACOLUMBAR TRANSMISSION BRIDGE",
    description:
      "Spanning from the sacrum and ilium along the thoracic spine to the neck, the longissimus dorsi transmits hindlimb propulsion forward while the rectus abdominis lifts the back under the cadet’s seat.",
    riderStructure: "Ischial Tuberosities (Seat Bones) & Core",
    horseStructure: "Longissimus Dorsi, T9–T18 Ribcage & Obliques",
  },
  lumbosacral_pelvis: {
    title: "Gluteus Medius & Biceps Femoris",
    subtitle: "HINDQUARTER COLLECTION & PROPULSION ENGINE",
    description:
      "Coiling the lumbosacral joint (L6–S1) and flexing the hip, stifle, and hock, these powerful hindquarter muscles shift weight off the forehand when met by a supple rider pelvis.",
    riderStructure: "Absorbing Lumbar L1–L5 & Hip Joint",
    horseStructure: "Gluteus Medius, Hamstrings & Pelvic Girdle",
  },
};

/** clip: the Marwari's own clip; slow: the share of real speed the exhibit plays it at (so the anatomy can be followed by eye). */
const GAITS = {
  walk: { badge: "4-BEAT LATERAL", clip: "Walk", slow: 0.7 },
  trot: { badge: "2-BEAT DIAGONAL", clip: "Trot", slow: 0.7 },
  canter: { badge: "3-BEAT BASCULE", clip: "Canter_R", slow: 0.7 },
};

const MODES = {
  external: { label: "Coat", badge: "COAT" },
  skeletal: { label: "Skeleton", badge: "SKELETON" },
  muscular: { label: "Muscle", badge: "MUSCLE" },
  posture: { label: "Posture line", badge: "POSTURE LINE" },
};

/* ------------------------------------------------------------------ 2. state */
const $ = (id) => document.getElementById(id);
const state = {
  activeConnection: 0,
  activeMode: "posture",
  selectedRegion: "poll_cervical",
  isZoomedIn: false,
  focus: false,
  baseCameraZ: 8,
  baseTarget: new THREE.Vector3(0, 1.2, 0),
  isPlaying: false,
  gaitPosed: false, // true once a gait was played or scrubbed: the pose then follows the stride phase
  activeGait: "walk",
  stridePhase: 0,
  riderVisible: true,
  soundEnabled: false,
  reducedMotion: window.matchMedia("(prefers-reduced-motion: reduce)").matches || /[?&]reduced\b/.test(location.search), // ?reduced: QA switch
};
if (window.gsap) window.gsap.ticker.lagSmoothing(0);

/* ------------------------------------------------------------------ 3. tiny web-audio cues (only when the site's sound is on) */
let audioCtx = null;
function chime(freq) {
  if (!state.soundEnabled) return;
  try {
    const Ctx = window.AudioContext || window.webkitAudioContext;
    if (!audioCtx && Ctx) audioCtx = new Ctx();
    if (!audioCtx) return;
    if (audioCtx.state === "suspended") audioCtx.resume();
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.type = "sine";
    osc.frequency.setValueAtTime(freq || 420, audioCtx.currentTime);
    gain.gain.setValueAtTime(0.025, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.0001, audioCtx.currentTime + 0.16);
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    osc.start();
    osc.stop(audioCtx.currentTime + 0.17);
  } catch {
    /* audio is optional */
  }
}

/* ------------------------------------------------------------------ 4. scene objects (filled in by init) */
const canvas = $("equineCanvas");
const stage = $("stageWrapper");
const raycaster = new THREE.Raycaster();
const pointer = new THREE.Vector2();

let renderer, scene, camera, controls;
let world; // everything that stands on the floor
let horse = null; // Marwari struct from loadMarwari
let rider = null; // { root, bones, anchors }
let mixer = null;
let sceneReady = false;
let rafId = null;
let hostVisible = true;
let lastTime = 0;
let clockTime = 0;

const layers = { bones: [], muscles: [], tack: [], hairMeshes: [], eyeMeshes: [] };
const gaitActions = {};
const idleActions = [];
const gaitWeight = { idle: 1, walk: 0, trot: 0, canter: 0 };
const anchors = {}; // name -> Object3D, from both models
const tmpA = new THREE.Vector3();
const tmpB = new THREE.Vector3();
const posture = []; // { tube, points: () => Vector3[], uniforms }
let reins = [];

/* ------------------------------------------------------------------ 5. live tube (re-lofted every frame from tracked points) */
class LiveTube {
  constructor(segments, radial, radius, material) {
    this.segments = segments;
    this.radial = radial;
    this.radius = radius;
    this.curve = new THREE.CatmullRomCurve3([new THREE.Vector3(), new THREE.Vector3(0, 0, 1)], false, "centripetal");
    const count = (segments + 1) * (radial + 1);
    const geo = new THREE.BufferGeometry();
    geo.setAttribute("position", new THREE.BufferAttribute(new Float32Array(count * 3), 3));
    geo.setAttribute("uv", new THREE.BufferAttribute(new Float32Array(count * 2), 2));
    const index = [];
    for (let i = 0; i < segments; i++) {
      for (let j = 0; j < radial; j++) {
        const a = i * (radial + 1) + j;
        const b = a + radial + 1;
        index.push(a, b, a + 1, b, b + 1, a + 1);
      }
    }
    geo.setIndex(index);
    for (let i = 0; i <= segments; i++) {
      for (let j = 0; j <= radial; j++) geo.attributes.uv.setXY(i * (radial + 1) + j, i / segments, j / radial);
    }
    this.mesh = new THREE.Mesh(geo, material);
    this.mesh.frustumCulled = false;
    this.p = new THREE.Vector3();
    this.t = new THREE.Vector3();
    this.n = new THREE.Vector3();
    this.b = new THREE.Vector3();
  }

  update(points, radiusScale = 1) {
    const c = this.curve;
    c.points.length = 0;
    for (const p of points) c.points.push(p.clone());
    c.updateArcLengths();
    const pos = this.mesh.geometry.attributes.position;
    const up = tmpA.set(0, 0, 1);
    for (let i = 0; i <= this.segments; i++) {
      const u = i / this.segments;
      c.getPointAt(u, this.p);
      c.getTangentAt(u, this.t);
      this.n.crossVectors(this.t, up);
      if (this.n.lengthSq() < 1e-6) this.n.set(1, 0, 0);
      this.n.normalize();
      this.b.crossVectors(this.t, this.n).normalize();
      const taper = Math.min(1, 0.35 + Math.sin(u * Math.PI) * 0.9) * radiusScale;
      for (let j = 0; j <= this.radial; j++) {
        const a = (j / this.radial) * Math.PI * 2;
        const r = this.radius * taper;
        const x = this.p.x + (this.n.x * Math.cos(a) + this.b.x * Math.sin(a)) * r;
        const y = this.p.y + (this.n.y * Math.cos(a) + this.b.y * Math.sin(a)) * r;
        const z = this.p.z + (this.n.z * Math.cos(a) + this.b.z * Math.sin(a)) * r;
        pos.setXYZ(i * (this.radial + 1) + j, x, y, z);
      }
    }
    pos.needsUpdate = true;
  }
}

function glowMaterial(uniforms) {
  return new THREE.ShaderMaterial({
    uniforms,
    transparent: true,
    depthTest: false,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
    vertexShader: `varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }`,
    fragmentShader: `
      uniform float uTime; uniform float uIntensity; uniform vec3 uBaseColor; uniform vec3 uPulseColor; varying vec2 vUv;
      void main(){
        float w1 = exp(-pow(fract(vUv.x - uTime * 0.28) - 0.5, 2.0) * 32.0);
        float w2 = exp(-pow(fract(vUv.x - uTime * 0.28 + 0.5) - 0.5, 2.0) * 32.0);
        float pulse = max(w1, w2 * 0.6);
        vec3 col = mix(uBaseColor, uPulseColor, pulse);
        float edge = sin(vUv.y * 3.14159);
        float a = (0.58 + 0.42 * pulse) * uIntensity * (0.7 + 0.3 * edge);
        gl_FragColor = vec4(col, a);
      }`,
  });
}

/* ------------------------------------------------------------------ 6. the seat: the rider rides the real deformation of the back */
class SeatFrame {
  constructor(mesh, targets) {
    // four skinned vertices, found by position in the bind pose (vertex indices are not stable across exports)
    this.mesh = mesh;
    const pos = mesh.geometry.attributes.position;
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
    this.matrix = new THREE.Matrix4();
    this.rest = new THREE.Matrix4();
    this.restInv = new THREE.Matrix4();
    this.delta = new THREE.Matrix4();
    this.q = new THREE.Quaternion();
    this.qSmooth = new THREE.Quaternion();
    this.compute(this.rest);
    this.restInv.copy(this.rest).invert();
  }

  compute(out) {
    this.index.forEach((vi, k) => this.mesh.getVertexPosition(vi, this.pts[k]));
    const [f, b, l, r] = this.pts;
    const fwd = tmpA.subVectors(f, b).normalize();
    const left = tmpB.subVectors(l, r);
    left.addScaledVector(fwd, -left.dot(fwd)).normalize();
    const up = new THREE.Vector3().crossVectors(fwd, left).normalize();
    const origin = new THREE.Vector3().add(f).add(b).add(l).add(r).multiplyScalar(0.25);
    return out.makeBasis(left, up, fwd).setPosition(origin);
  }

  /** The seat's move since the bind pose, in the horse's local space. */
  update() {
    this.compute(this.matrix);
    this.delta.multiplyMatrices(this.matrix, this.restInv);
    return this.delta;
  }
}

/* ------------------------------------------------------------------ 7. loading */
function loadGltf(url, onProgress) {
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
      (e) => e.total > 0 && onProgress && onProgress(e.loaded / e.total),
      reject,
    );
  });
}

const progress = { horse: 0, rider: 0 };
function setProgress() {
  const bar = $("loadingProgressBar");
  if (bar) bar.style.width = `${Math.round(8 + 92 * ((progress.horse * 0.7) + (progress.rider * 0.3)))}%`;
}

const boneMaterial = new THREE.MeshStandardMaterial({ color: "#d4c19b", roughness: 0.6, metalness: 0, name: "ExhibitBone" });
const tendonColor = new THREE.Color("#d9ccaa");
const muscleColor = new THREE.Color("#a24a32");

function muscleMaterial(tendon) {
  const m = new THREE.MeshStandardMaterial({
    color: tendon ? tendonColor : muscleColor.clone().offsetHSL((Math.random() - 0.5) * 0.02, 0, (Math.random() - 0.5) * 0.05),
    roughness: tendon ? 0.5 : 0.58,
    metalness: 0,
    emissive: new THREE.Color("#2b0c05"),
    emissiveIntensity: 0.18,
  });
  m.userData.base = m.color.clone();
  // fibres run along the first UV axis of a muscle patch; the second runs across it (0 and 1 are its borders, where the fascia dips)
  m.onBeforeCompile = (shader) => {
    shader.vertexShader = shader.vertexShader
      .replace("#include <common>", "#include <common>\nvarying vec2 vMu;")
      .replace("#include <uv_vertex>", "#include <uv_vertex>\nvMu = uv;");
    shader.fragmentShader = shader.fragmentShader
      .replace("#include <common>", "#include <common>\nvarying vec2 vMu;")
      .replace(
        "#include <color_fragment>",
        `#include <color_fragment>
        {
          float across = vMu.y;
          float fibre = 0.5 + 0.5 * sin(across * 140.0 + sin(vMu.x * 9.0) * 1.7);
          float seam = smoothstep(0.0, 0.1, across) * (1.0 - smoothstep(0.9, 1.0, across));
          float belly = 0.8 + 0.2 * sin(clamp(vMu.x, 0.0, 1.0) * 3.14159);
          diffuseColor.rgb *= (0.82 + 0.22 * fibre) * (0.55 + 0.45 * seam) * belly;
        }`,
      );
  };
  m.customProgramCacheKey = () => (tendon ? "ex-tendon-v1" : "ex-muscle-v1");
  return m;
}

function sortLayers(root) {
  root.traverse((o) => {
    if (o.isMesh) {
      const n = o.name || "";
      if (n.startsWith("Bone_")) {
        o.material = boneMaterial;
        layers.bones.push(o);
      } else if (n.startsWith("Muscle_")) {
        o.material = muscleMaterial(o.userData.kind === "tendon");
        o.userData.region = o.userData.region || "thoracolumbar";
        o.userData.muscleName = o.userData.label || n.replace(/^Muscle_/, "").replace(/_/g, " ");
        layers.muscles.push(o);
      } else if (n.startsWith("Tack_")) {
        layers.tack.push(o);
      }
      // the hair layer: the new locks (core and fringe passes); the exported ribbons only if the locks could not be built
      if (n.startsWith("Marwari_HairLocks") || (n === "Marwari_Hair" && !o.userData.replacedByLocks)) layers.hairMeshes.push(o);
      if (n === "Marwari_Eyes") layers.eyeMeshes.push(o);
      o.castShadow = !(n === "Marwari_Hair" || n === "Marwari_HairLocks_fringe" || n.startsWith("Muscle_") || n.startsWith("Bone_"));
      o.receiveShadow = n === "Marwari_Low" || n.startsWith("Tack_") || n.startsWith("Cadet_");
    }
  });
}

/** Empties exported with the models are anchors: a rest position plus the bone that carries it. Each frame the page asks for the point's world position. */
function bindAnchors(root, boneOf) {
  const found = [];
  root.traverse((o) => {
    if (o.userData && o.userData.layer === "anchor") found.push(o);
  });
  const rest = {};
  for (const o of found) {
    const bone = boneOf(o.userData.bone);
    const p = o.getWorldPosition(new THREE.Vector3());
    rest[o.name] = p.clone();
    if (bone) anchors[o.name] = { bone, local: bone.worldToLocal(p.clone()) };
    o.removeFromParent();
  }
  return rest;
}

/* ------------------------------------------------------------------ 8. scene */
function buildGround() {
  const floor = new THREE.Mesh(new THREE.PlaneGeometry(16, 16), new THREE.ShadowMaterial({ opacity: 0.26 }));
  floor.rotation.x = -Math.PI / 2;
  floor.receiveShadow = true;
  world.add(floor);
  const ring = (rx, rz, color, opacity, y) => {
    const pts = new THREE.EllipseCurve(0, 0, rx, rz, 0, Math.PI * 2, false, 0).getPoints(120).map((p) => new THREE.Vector3(p.x, y, p.y));
    const line = new THREE.LineLoop(new THREE.BufferGeometry().setFromPoints(pts), new THREE.LineBasicMaterial({ color, transparent: true, opacity }));
    world.add(line);
  };
  ring(1.75, 0.46, 0xfff8eb, 0.78, 0.004);
  ring(1.36, 0.33, 0xdfbf8f, 0.55, 0.005);
}

function initScene() {
  scene = new THREE.Scene();
  const width = stage.clientWidth || window.innerWidth;
  const height = stage.clientHeight || 720;
  camera = new THREE.PerspectiveCamera(28, width / height, 0.1, 100);
  renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true, powerPreference: "high-performance" });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, window.innerWidth < 768 ? 1.5 : 2));
  renderer.setSize(width, height, false);
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFShadowMap;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.05;

  const pmrem = new THREE.PMREMGenerator(renderer);
  scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
  scene.environmentIntensity = 0.85;
  pmrem.dispose();

  controls = new OrbitControls(camera, renderer.domElement);
  controls.enableDamping = true;
  controls.dampingFactor = 0.06;
  controls.enablePan = false;
  // The page scrolls past this exhibit: the wheel must not be taken for zoom (OrbitControls calls preventDefault on every wheel
  // event over the canvas, which froze the page under the cursor), and a vertical swipe on a phone must still scroll the page.
  controls.enableZoom = false;
  renderer.domElement.style.touchAction = "pan-y";
  controls.minPolarAngle = Math.PI * 0.28;
  controls.maxPolarAngle = Math.PI * 0.54;
  controls.minAzimuthAngle = -Math.PI * 0.38;
  controls.maxAzimuthAngle = Math.PI * 0.38;

  const hemi = new THREE.HemisphereLight(0xfff6e8, 0x8f7153, 1.1);
  scene.add(hemi);
  const key = new THREE.DirectionalLight(0xfff1dc, 3.2);
  key.position.set(-3.4, 5.2, 4.2);
  key.castShadow = true;
  key.shadow.mapSize.set(2048, 2048);
  key.shadow.camera.near = 1;
  key.shadow.camera.far = 14;
  const d = 2.6;
  Object.assign(key.shadow.camera, { left: -d, right: d, top: d, bottom: -d });
  key.shadow.bias = -0.0004;
  key.shadow.normalBias = 0.02;
  key.shadow.radius = 3;
  scene.add(key);
  const rim = new THREE.DirectionalLight(0xffd8a6, 2.4);
  rim.position.set(2.8, 3.6, -3.4);
  scene.add(rim);
  const fill = new THREE.DirectionalLight(0xf5e5d0, 0.9);
  fill.position.set(3.2, 1.4, 3.8);
  scene.add(fill);

  world = new THREE.Group();
  scene.add(world);
  buildGround();
}

function assemble(horseData, riderGltf) {
  horse = horseData;
  // glTF horse faces +Z; the exhibit shows it facing left (-X) with its left flank toward the camera.
  const horseRig = new THREE.Group();
  horseRig.rotation.y = -Math.PI / 2;
  horseRig.position.x = 0.26;
  horseRig.add(horse.root);
  world.add(horseRig);
  horseRig.updateMatrixWorld(true);
  const restPts = bindAnchors(horse.root, (n) => horse.bones[n]);
  sortLayers(horse.root);
  horse.root.traverse((o) => {
    if (o.isSkinnedMesh) o.frustumCulled = false;
  });
  horse.mesh.renderOrder = 4;
  if (state.reducedMotion) {
    horse.hair.wind.value.set(0, 0, 0); // the mane and tail shader flutters on its own clock: still when motion is reduced
    if (horse.hair.setReducedMotion) horse.hair.setReducedMotion(true); // and so does the new hair's lag, flutter and lift
  }
  world.userData.horseRig = horseRig;

  // clips: the gaits are driven by stride phase; the idle clips run on their own
  mixer = new THREE.AnimationMixer(horse.root);
  for (const key of Object.keys(GAITS)) {
    const clip = horse.clips.get(GAITS[key].clip);
    if (!clip) continue;
    const action = mixer.clipAction(clip);
    action.play();
    action.paused = true;
    action.setEffectiveWeight(0);
    gaitActions[key] = action;
  }
  for (const name of ["Idle_Breathing", "Blink", "Ear_Rotate", "Tail_Sway", "Mane_Sway"]) {
    const clip = horse.clips.get(name);
    if (!clip) continue;
    const action = mixer.clipAction(clip);
    action.play();
    idleActions.push({ name, action });
  }

  // the seat and the rider
  const seatPts = ["Seat_F", "Seat_B", "Seat_L", "Seat_R"].map((n) => restPts[n] || null);
  const attach = new THREE.Group();
  attach.matrixAutoUpdate = false;
  horseRig.add(attach);
  world.userData.attach = attach;
  // the saddle is rigid: it rides the seat frame like the rider (the girth and bridle are skinned to the horse)
  for (const m of layers.tack) if (m.name === "Tack_Saddle" || m.name === "Tack_Flaps") attach.add(m);
  if (riderGltf && seatPts.every(Boolean)) {
    // vertex positions are in the coat mesh's own (bind) space, which is the horse model space (no node transforms above it)
    world.userData.seat = new SeatFrame(horse.mesh, seatPts.map((p) => horse.root.worldToLocal(p.clone())));
    attach.add(riderGltf.scene);
    riderGltf.scene.updateMatrixWorld(true);
    const bones = {};
    riderGltf.scene.traverse((o) => {
      if (o.isBone) bones[o.name] = o;
      if (o.isMesh) {
        o.castShadow = true;
        if (o.isSkinnedMesh) o.frustumCulled = false;
      }
    });
    bindAnchors(riderGltf.scene, (n) => bones[n]);
    sortLayers(riderGltf.scene);
    const chain = ["R_Pelvis", "R_Spine", "R_Chest", "R_Neck", "R_Head"].map((n) => bones[n]).filter(Boolean);
    rider = { root: riderGltf.scene, bones, chain, rest: chain.map((b) => b.quaternion.clone()) };
  }

  // posture lines and reins
  const lineA = new LiveTube(90, 10, 0.011, glowMaterial(lineUniforms(0xf6d694)));
  const lineB = new LiveTube(90, 10, 0.014, glowMaterial(lineUniforms(0xf6d694)));
  const lineC = new LiveTube(60, 10, 0.009, glowMaterial(lineUniforms(0xf6d694)));
  for (const t of [lineA, lineB, lineC]) {
    t.mesh.renderOrder = 20;
    scene.add(t.mesh);
  }
  posture.push(
    { tube: lineA, names: ["RAnchor_Ear", "RAnchor_Shoulder", "RAnchor_Hip", "RAnchor_Heel"], extend: 0.0 },
    { tube: lineB, names: ["SpineLine_0", "SpineLine_1", "SpineLine_2", "SpineLine_3", "SpineLine_4", "SpineLine_5", "SpineLine_6", "SpineLine_7"] },
    { tube: lineC, names: ["RAnchor_Elbow", "RAnchor_Hand_L", "Anchor_Bit_L"] },
  );
  const reinMat = new THREE.MeshStandardMaterial({ color: "#2a1a10", roughness: 0.6 });
  reins = [["RAnchor_Hand_L", "Anchor_Bit_L"], ["RAnchor_Hand_R", "Anchor_Bit_R"]].map(([a, b]) => {
    const t = new LiveTube(24, 6, 0.0045, reinMat);
    t.mesh.castShadow = true;
    scene.add(t.mesh);
    return { tube: t, a, b };
  });

  world.add(horse.contacts.group);
  state.layers = layers;
}

function lineUniforms(color) {
  return {
    uTime: { value: 0 },
    uIntensity: { value: 1 },
    uBaseColor: { value: new THREE.Color(color) },
    uPulseColor: { value: new THREE.Color(0xfffdf8) },
  };
}

/* ------------------------------------------------------------------ 9. per-frame pose */
function easeWeights(dt) {
  const k = 1 - Math.exp(-dt * 8);
  const target = { idle: 0, walk: 0, trot: 0, canter: 0 };
  if (state.gaitPosed) target[state.activeGait] = 1;
  else target.idle = 1;
  for (const key of Object.keys(gaitWeight)) gaitWeight[key] += (target[key] - gaitWeight[key]) * k;
}

function updatePose(dt) {
  if (!mixer) return;
  const still = state.reducedMotion && !state.isPlaying && !state.gaitPosed;
  if (still) {
    for (const a of idleActions) a.action.setEffectiveWeight(0);
    for (const k of Object.keys(gaitActions)) gaitActions[k].setEffectiveWeight(0);
    mixer.update(0);
    syncSkeleton();
    return;
  }
  if (state.isPlaying) {
    const g = GAITS[state.activeGait];
    const dur = gaitActions[state.activeGait] ? gaitActions[state.activeGait].getClip().duration : 1;
    state.stridePhase = (state.stridePhase + (dt * g.slow) / dur) % 1;
    updateStrideScrubberUI();
  }
  easeWeights(dt);
  for (const key of Object.keys(gaitActions)) {
    const a = gaitActions[key];
    a.time = (((state.stridePhase % 1) + 1) % 1) * a.getClip().duration;
    a.setEffectiveWeight(gaitWeight[key]);
  }
  for (const a of idleActions) {
    const breathing = a.name === "Idle_Breathing";
    a.action.setEffectiveWeight(breathing ? gaitWeight.idle : state.reducedMotion ? 0 : 1);
  }
  mixer.update(state.reducedMotion && !state.isPlaying ? 0 : dt);
  syncSkeleton();
}

function syncSkeleton() {
  horse.root.updateMatrixWorld(true);
  horse.mesh.skeleton.update();
}

const qWork = new THREE.Quaternion();
const qParent = new THREE.Quaternion();
const qTarget = new THREE.Quaternion();
const qId = new THREE.Quaternion();
const SHARE = [1, 0.55, 0.34, 0.2, 0.12]; // how much of the seat's tilt each part of the body keeps (the spine absorbs the rest)

function updateRider(dt) {
  const seat = world.userData.seat;
  const attach = world.userData.attach;
  if (!seat || !rider) return;
  const delta = seat.update();
  attach.matrix.copy(delta);
  attach.matrixWorldNeedsUpdate = true;
  attach.updateMatrixWorld(true);
  // the torso keeps a lagged share of the seat's tilt; the head stays nearly level
  seat.q.setFromRotationMatrix(delta);
  seat.qSmooth.slerp(seat.q, state.reducedMotion && !state.isPlaying ? 1 : 1 - Math.exp(-dt * 7));
  qParent.copy(seat.q);
  rider.chain.forEach((bone, i) => {
    if (i === 0) {
      bone.quaternion.copy(rider.rest[0]);
      return;
    }
    qTarget.copy(qId).slerp(seat.qSmooth, SHARE[i]);
    qWork.copy(qParent).invert().multiply(qTarget);
    bone.quaternion.copy(rider.rest[i]).premultiply(qWork);
    qParent.copy(qTarget);
  });
  rider.root.updateMatrixWorld(true);
}

function worldPoint(name, out) {
  const a = anchors[name];
  return a ? a.bone.localToWorld(out.copy(a.local)) : null;
}

function updateLines(time) {
  const bright = state.activeMode === "posture";
  for (const line of posture) {
    line.tube.mesh.visible = bright && !!layers.muscles;
    if (!line.tube.mesh.visible) continue;
    const pts = [];
    for (const n of line.names) {
      const p = worldPoint(n, new THREE.Vector3());
      if (p) pts.push(p);
    }
    if (pts.length < 2) {
      line.tube.mesh.visible = false;
      continue;
    }
    line.tube.update(pts);
    line.tube.mesh.material.uniforms.uTime.value = time;
  }
  for (const r of reins) {
    const a = worldPoint(r.a, tmpA.clone());
    const b = worldPoint(r.b, tmpB.clone());
    r.tube.mesh.visible = !!(a && b) && state.riderVisible;
    if (!r.tube.mesh.visible) continue;
    const mid = a.clone().lerp(b, 0.5);
    mid.y -= 0.035 + 0.03 * Math.min(1, a.distanceTo(b));
    r.tube.update([a, mid, b], 1);
  }
}

/* ------------------------------------------------------------------ 10. modes, regions, connections */
const coatOpacity = { value: 1 };
function applyCoatOpacity() {
  const m = horse.material;
  const o = coatOpacity.value;
  m.transparent = o < 0.995;
  m.opacity = o;
  m.depthWrite = o >= 0.995;
}

function applyVisualizationMode(mode, immediate) {
  state.activeMode = mode;
  const dur = immediate || state.reducedMotion ? 0.01 : 0.48;
  const info = MODES[mode] || MODES.posture;
  $("viewModeNameLabel").textContent = info.label;
  $("expModeBadge").textContent = info.badge;
  document.querySelectorAll(".mode-btn").forEach((btn) => {
    btn.classList.toggle("active", btn.dataset.mode === mode);
    btn.setAttribute("aria-pressed", String(btn.dataset.mode === mode));
  });
  placeThumb($("viewSeg"), immediate);
  setFocus(state.focus && mode === "posture");
  $("telemetryHud").style.display = mode === "posture" ? "flex" : "none";
  if (mode === "posture") animateTo($("telemetryHud"), { opacity: 1 }, immediate);

  const cfg = {
    external: { coat: 1, bones: false, muscles: false, hair: true, tack: true, eyes: true },
    skeletal: { coat: 0.1, bones: true, muscles: false, hair: false, tack: false, eyes: false },
    muscular: { coat: 0.1, bones: "some", muscles: true, hair: false, tack: false, eyes: false },
    posture: { coat: 0.34, bones: true, muscles: "region", hair: true, tack: true, eyes: true },
  }[mode];
  // the muscle view keeps the bones the muscles do not cover (skull, jaw, lower limbs); the trunk bones lie within a few cm of the muscle layer
  const exposed = /^Bone_(Skull|Mandible|Teeth|Carpus|Cannon|Pastern|Coffin|Tarsus|Caudal)/;
  layers.bones.forEach((m) => (m.visible = mode === "muscular" ? exposed.test(m.name) : cfg.bones));
  layers.muscles.forEach((m) => (m.visible = cfg.muscles === true || cfg.muscles === "region"));
  layers.tack.forEach((m) => (m.visible = cfg.tack));
  layers.hairMeshes.forEach((m) => (m.visible = cfg.hair));
  layers.eyeMeshes.forEach((m) => (m.visible = cfg.eyes));

  const pinsVisible = mode === "posture";
  $("pinCadetSpine").style.opacity = pinsVisible ? "1" : "0";
  $("pinMarwariEquine").style.opacity = pinsVisible ? "1" : "0";

  if (window.gsap && dur > 0.05) {
    window.gsap.to(coatOpacity, { value: cfg.coat, duration: dur, ease: "power2.out", onUpdate: applyCoatOpacity });
  } else {
    coatOpacity.value = cfg.coat;
    applyCoatOpacity();
  }
  // coat view glows the selected region on the coat; the other views show it in the muscles
  horse.highlight.strength.value = mode === "external" ? 0.55 : 0;
  highlightAnatomicalRegion(state.selectedRegion, false);
}

function highlightAnatomicalRegion(regionKey, fromUserSelect) {
  state.selectedRegion = regionKey;
  const mode = state.activeMode;
  layers.muscles.forEach((mesh) => {
    const match = mesh.userData.region === regionKey;
    const mat = mesh.material;
    mat.emissive.setHex(match ? 0xc85a24 : 0x2b0c05);
    mat.emissiveIntensity = match ? 0.55 : 0.14;
    mat.color.copy(mat.userData.base).multiplyScalar(match || mode === "muscular" ? 1 : 0.92);
    // the align view shows only the selected group, the muscle view shows them all with the group lit
    if (mode === "posture") mesh.visible = match;
    else if (mode === "muscular") mesh.visible = true;
  });
  document.querySelectorAll(".region-chip").forEach((chip) => {
    const active = chip.dataset.focusRegion === regionKey;
    chip.style.background = active ? "#513624" : "#DFD1BD";
    chip.style.color = active ? "#F9F3EA" : "#4A3323";
  });
  if (fromUserSelect && REGIONS[regionKey]) {
    const m = REGIONS[regionKey];
    $("expTitle").textContent = m.title;
    $("expSubtitle").textContent = m.subtitle;
    $("expDescription").textContent = m.description;
    $("expRiderStructure").textContent = m.riderStructure;
    $("expHorseStructure").textContent = m.horseStructure;
    $("activeSelectionPill").textContent = "Muscle group";
  }
  updateCoatGlow();
}

function updateCoatGlow() {
  const conn = CONNECTIONS.find((c) => c.region === state.selectedRegion) || CONNECTIONS[state.activeConnection];
  const p = worldPoint(conn.horse, new THREE.Vector3());
  horse.highlight.set(p ? [{ center: p, radius: 0.32 }] : []);
}

function selectConnection(index, immediate, zoomToRegion) {
  const idx = ((index % 3) + 3) % 3;
  state.activeConnection = idx;
  const data = CONNECTIONS[idx];
  document.querySelectorAll(".connection-card").forEach((card, i) => {
    card.classList.toggle("active", i === idx);
    card.setAttribute("aria-pressed", String(i === idx));
  });
  $("expIndex").textContent = data.number;
  $("expTitle").textContent = data.title;
  $("expSubtitle").textContent = data.subtitle;
  $("expDescription").textContent = data.description;
  $("expRiderStructure").textContent = data.riderStructure;
  $("expHorseStructure").textContent = data.horseStructure;
  $("expPaginationText").textContent = `${idx + 1} / 3`;
  $("activeSelectionPill").textContent = data.pill;
  $("pinCadetLabel").textContent = data.pinCadetText;
  $("pinEquineLabel").textContent = data.pinEquineText;
  if (window.gsap && !immediate && !state.reducedMotion) {
    window.gsap.fromTo($("explanationCard"), { opacity: 0.75, y: 4 }, { opacity: 1, y: 0, duration: 0.32, ease: "power2.out" });
  }
  if (horse) {
    highlightAnatomicalRegion(data.region, false);
    posture.forEach((line, i) => {
      line.tube.mesh.material.uniforms.uIntensity.value = data.intensity[i] || 0.9;
    });
  }
  state.isZoomedIn = !!zoomToRegion;
  state.focus = !!zoomToRegion;
  placeThumb($("systemRows"), immediate, true);
  setFocus(state.focus && state.activeMode === "posture");
  const resetBtn = $("resetCameraBtn");
  if (resetBtn) {
    const narrow = (stage.clientWidth || window.innerWidth) < 768;
    resetBtn.hidden = !(state.isZoomedIn && camera) || narrow;
  }
  if (!camera || !controls) return;
  // Narrow stages already fit the horse edge to edge, so a connection only nudges the framing there;
  // wider stages move in towards the region without cropping the horse.
  const stageW = stage.clientWidth || window.innerWidth;
  const mix = stageW < 768 ? 0 : 0.3;
  const goal = state.baseTarget.clone();
  let zoom = 1;
  if (state.isZoomedIn) {
    const a = worldPoint(data.horse, new THREE.Vector3());
    if (a) goal.lerp(a, mix);
    zoom = 1 - 0.07;
  }
  const offset = camera.position.clone().sub(controls.target);
  const dist = state.baseCameraZ * zoom;
  const dir = offset.lengthSq() > 1e-6 ? offset.normalize() : new THREE.Vector3(0, 0.04, 1).normalize();
  const camGoal = goal.clone().addScaledVector(dir, dist);
  if (window.gsap) {
    window.gsap.killTweensOf(camera.position);
    window.gsap.killTweensOf(controls.target);
  }
  if (window.gsap && !immediate && !state.reducedMotion) {
    window.gsap.to(camera.position, { x: camGoal.x, y: camGoal.y, z: camGoal.z, duration: 0.95, ease: "power3.out" });
    window.gsap.to(controls.target, { x: goal.x, y: goal.y, z: goal.z, duration: 0.95, ease: "power3.out" });
  } else {
    camera.position.copy(camGoal);
    controls.target.copy(goal);
  }
}

/* ------------------------------------------------------------------ 11. pins (labels follow the tracked anchors) */
function project(vec) {
  const w = stage.clientWidth || window.innerWidth;
  const h = stage.clientHeight || 720;
  const v = vec.clone().project(camera);
  return { x: (v.x * 0.5 + 0.5) * w, y: (-v.y * 0.5 + 0.5) * h };
}

function updateProjectedCalloutPins() {
  const pinCadet = $("pinCadetSpine");
  const pinEquine = $("pinMarwariEquine");
  const lineCadet = $("leaderLineCadet");
  const lineEquine = $("leaderLineEquine");
  if (!pinCadet || !pinEquine || !camera || state.activeMode !== "posture") return;
  const width = stage.clientWidth || window.innerWidth;
  const isDesktop = width >= 1024;
  const data = CONNECTIONS[state.activeConnection];
  const rp = worldPoint(data.rider, new THREE.Vector3()) || new THREE.Vector3(0, 1.8, 0);
  const hp = worldPoint(data.horse, new THREE.Vector3()) || new THREE.Vector3(-0.8, 1.5, 0);
  const p1 = project(rp);
  const p2 = project(hp);
  const minX = isDesktop ? 480 : 70;
  const maxX = isDesktop ? width - 420 : width - 70;
  const gap = isDesktop ? 170 : 150;
  const pins = [
    { pin: pinCadet, line: lineCadet, p: p1 },
    { pin: pinEquine, line: lineEquine, p: p2 },
  ].sort((a, b) => a.p.x - b.p.x);
  let xa = Math.max(minX, Math.min(maxX - gap, pins[0].p.x));
  let xb = Math.max(xa + gap, Math.min(maxX, pins[1].p.x));
  if (xb - xa < gap) xa = xb - gap;
  const halfA = (pins[0].pin.offsetWidth || 120) / 2 + 6;
  const halfB = (pins[1].pin.offsetWidth || 120) / 2 + 6;
  xb = Math.min(xb, width - halfB);
  xa = Math.max(halfA, Math.min(xa, xb - halfA - halfB - 8));
  pins[0].x = xa;
  pins[1].x = xb;
  // labels sit in a row above the cadet's helmet so they never cover the rider or the horse
  const top = anchors.RAnchor_Top ? worldPoint("RAnchor_Top", new THREE.Vector3()) : new THREE.Vector3(0, 2.5, 0);
  const helmetTop = project(top).y;
  const labelTopY = Math.max(4, Math.min(isDesktop ? 150 : 40, helmetTop - 46));
  pins.forEach((item) => {
    item.pin.style.left = `${Math.round(item.x)}px`;
    item.pin.style.top = `${Math.round(labelTopY)}px`;
    if (item.line) item.line.style.height = `${Math.round(Math.max(18, item.p.y - labelTopY - 22))}px`;
  });
}

/* ------------------------------------------------------------------ 12. framing */
function updateResponsiveFraming() {
  if (!renderer || !camera) return;
  const width = stage.clientWidth || window.innerWidth;
  const height = stage.clientHeight || 680;
  camera.aspect = width / height;
  camera.fov = width < 768 ? 30 : 28;
  const tanHalf = Math.tan((camera.fov * Math.PI) / 360);
  // visible world box: muzzle to tail, hooves to the helmet, plus headroom for the labels
  let reqW;
  let reqH;
  if (width < 1024) {
    reqW = 2.8;
    reqH = 2.85;
    state.baseTarget.set(0.05, 1.22, 0);
  } else {
    reqW = 5.35;
    reqH = 3.25;
    state.baseTarget.set(0.05, 1.3, 0);
  }
  state.baseCameraZ = Math.max((reqW * 0.5) / (camera.aspect * tanHalf), (reqH * 0.5) / tanHalf);
  camera.updateProjectionMatrix();
  renderer.setSize(width, height, false);
  if (state.isZoomedIn) {
    selectConnection(state.activeConnection, true, true);
  } else {
    camera.position.set(state.baseTarget.x, state.baseTarget.y + 0.12, state.baseTarget.z + state.baseCameraZ);
    controls.target.copy(state.baseTarget);
  }
  if (sceneReady && rafId === null && !isPaused()) renderOnce();
}

/* ------------------------------------------------------------------ 13. pointer picking */
function setupRaycasting() {
  const tooltip = $("anatomicalHoverTooltip");
  const tooltipTitle = $("tooltipTitle");
  let pending = null;
  const pick = () => {
    const e = pending;
    pending = null;
    if (!e) return;
    const list = layers.muscles.filter((m) => m.visible);
    if (!list.length || state.activeMode === "external") {
      tooltip.classList.add("hidden");
      return;
    }
    raycaster.setFromCamera(pointer, camera);
    const hits = raycaster.intersectObjects(list, false);
    if (hits.length) {
      tooltipTitle.textContent = hits[0].object.userData.muscleName || "Equine Structure";
      tooltip.style.left = `${e.clientX + 14}px`;
      tooltip.style.top = `${e.clientY - 12}px`;
      tooltip.classList.remove("hidden");
      canvas.style.cursor = "pointer";
    } else {
      tooltip.classList.add("hidden");
      canvas.style.cursor = "grab";
    }
  };
  canvas.addEventListener("pointermove", (e) => {
    const rect = canvas.getBoundingClientRect();
    pointer.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
    pointer.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;
    if (e.pointerType === "touch") return;
    if (!pending) requestAnimationFrame(pick);
    pending = e;
  });
  canvas.addEventListener("pointerleave", () => tooltip.classList.add("hidden"));
  let down = { x: 0, y: 0 };
  canvas.addEventListener("pointerdown", (e) => {
    down = { x: e.clientX, y: e.clientY };
  });
  canvas.addEventListener("pointerup", (e) => {
    if (Math.hypot(e.clientX - down.x, e.clientY - down.y) > 6) return;
    const rect = canvas.getBoundingClientRect();
    pointer.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
    pointer.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;
    raycaster.setFromCamera(pointer, camera);
    const hits = raycaster.intersectObjects(layers.muscles.filter((m) => m.visible), false);
    if (hits.length && hits[0].object.userData.region) {
      chime(520);
      highlightAnatomicalRegion(hits[0].object.userData.region, true);
    }
  });
}

/* ------------------------------------------------------------------ 13b. control deck: springs from motion, quiet when motion is reduced */
const M = window.Motion;
const SPRING = { type: "spring", stiffness: 520, damping: 40 };

function animateTo(el, keyframes, instant) {
  if (!el) return;
  if (M && !instant && !state.reducedMotion) M.animate(el, keyframes, SPRING);
  else for (const [k, v] of Object.entries(keyframes)) el.style[k] = String(v);
}

/** Slides the pill behind the active button of a segmented control or of the system rows. */
function placeThumb(host, instant, vertical) {
  if (!host) return;
  const thumb = host.querySelector(".seg-thumb, .deck-thumb");
  const active = host.querySelector(".active");
  if (!thumb || !active) return;
  const w = active.offsetWidth;
  const h = active.offsetHeight;
  if (!w) return;
  const x = vertical ? 0 : active.offsetLeft - 3.5;
  const y = vertical ? active.offsetTop : 0;
  if (M && !instant && !state.reducedMotion && thumb.dataset.placed) {
    M.animate(thumb, vertical ? { x, y, width: w, height: h } : { x, width: w }, SPRING);
  } else {
    thumb.style.width = `${w}px`;
    if (vertical) thumb.style.height = `${h}px`;
    thumb.style.transform = `translate(${x}px, ${y}px)`;
  }
  thumb.dataset.placed = "1";
}

/** Obsidian spotlight behind the horse while a system is followed in the align view. */
function setFocus(on) {
  const veil = $("obsidianVeil");
  if (!veil) return;
  const to = on ? 1 : 0;
  if (M && !state.reducedMotion) M.animate(veil, { opacity: to }, { duration: 0.7, ease: [0.16, 1, 0.3, 1] });
  else veil.style.opacity = String(to);
}

function initDeck() {
  const hosts = [$("viewSeg"), $("gaitSeg")];
  const replace = () => {
    hosts.forEach((h) => placeThumb(h, true));
    placeThumb($("systemRows"), true, true);
  };
  replace();
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(replace);
  if ("ResizeObserver" in window) new ResizeObserver(replace).observe($("controlsCluster"));
  window.addEventListener("resize", replace);
  if (!M || state.reducedMotion) return;
  // press and hover feel: a small spring on every control
  M.press(".seg-btn, .play-btn, .deck-row, .rider-switch, .stride-dot, .region-chip", (el) => {
    M.animate(el, { scale: 0.95 }, { duration: 0.12 });
    return () => M.animate(el, { scale: 1 }, SPRING);
  });
  M.hover(".seg-btn:not(.active), .deck-row:not(.active), .play-btn", (el) => {
    M.animate(el, { y: -1.5 }, { duration: 0.2 });
    return () => M.animate(el, { y: 0 }, SPRING);
  });
  // previewing a system with the pointer dims the background toward obsidian before it is chosen
  M.hover(".deck-row", () => {
    if (state.activeMode === "posture" && !state.focus) M.animate($("obsidianVeil"), { opacity: 0.55 }, { duration: 0.5 });
    return () => {
      if (!state.focus) M.animate($("obsidianVeil"), { opacity: 0 }, { duration: 0.6 });
    };
  });
}

/* ------------------------------------------------------------------ 14. controls */
function updateStrideScrubberUI() {
  const p = ((state.stridePhase % 1) + 1) % 1;
  const fill = $("strideProgressFill");
  if (fill) fill.style.width = `${Math.round(p * 100)}%`;
  document.querySelectorAll(".stride-dot").forEach((dot) => {
    const t = parseFloat(dot.dataset.stridePhase || "0");
    const near = Math.abs(p - t) < 0.14 || (t === 1 && p > 0.88);
    dot.style.background = near ? "#3E2718" : "#9E7B50";
    dot.style.width = near ? "10px" : "8px";
    dot.style.height = near ? "10px" : "8px";
  });
}

function togglePlayMovement(force) {
  state.isPlaying = typeof force === "boolean" ? force : !state.isPlaying;
  if (state.isPlaying) state.gaitPosed = true;
  chime(state.isPlaying ? 460 : 340);
  $("playIconSvg")?.classList.toggle("hidden", state.isPlaying);
  $("pauseIconSvg")?.classList.toggle("hidden", !state.isPlaying);
  const btn = $("playPauseBtn");
  if (btn) {
    btn.setAttribute("aria-pressed", String(state.isPlaying));
    btn.setAttribute("aria-label", state.isPlaying ? "Pause movement" : "Play movement");
  }
}

function selectGait(key) {
  if (!GAITS[key]) return;
  state.activeGait = key;
  chime(440);
  $("gaitBeatBadge").textContent = GAITS[key].badge;
  document.querySelectorAll(".gait-btn").forEach((btn) => {
    const on = btn.dataset.gait === key;
    btn.classList.toggle("active", on);
    btn.setAttribute("aria-pressed", String(on));
  });
  placeThumb($("gaitSeg"));
}

function setupUIListeners() {
  document.querySelectorAll(".connection-card").forEach((card) => {
    card.addEventListener("click", () => selectConnection(parseInt(card.dataset.connection || "0", 10), false, true));
  });
  $("prevConnBtn").addEventListener("click", () => selectConnection(state.activeConnection - 1, false, state.isZoomedIn));
  $("nextConnBtn").addEventListener("click", () => selectConnection(state.activeConnection + 1, false, state.isZoomedIn));
  document.querySelectorAll(".mode-btn").forEach((btn) => btn.addEventListener("click", () => horse && applyVisualizationMode(btn.dataset.mode, false)));
  document.querySelectorAll(".region-chip").forEach((chip) => {
    chip.addEventListener("click", () => {
      chime(510);
      if (state.activeMode === "external") applyVisualizationMode("muscular", false);
      highlightAnatomicalRegion(chip.dataset.focusRegion, true);
    });
  });
  $("playPauseBtn").addEventListener("click", () => togglePlayMovement());
  document.querySelectorAll(".stride-dot").forEach((dot) => {
    dot.addEventListener("click", () => {
      state.stridePhase = parseFloat(dot.dataset.stridePhase || "0") % 1;
      state.gaitPosed = true;
      togglePlayMovement(false);
      updateStrideScrubberUI();
      if (rafId === null && sceneReady) renderOnce(0);
    });
  });
  document.querySelectorAll(".gait-btn").forEach((btn) => {
    btn.addEventListener("click", () => {
      selectGait(btn.dataset.gait);
      state.gaitPosed = true;
      if (!state.isPlaying && !state.reducedMotion) togglePlayMovement(true);
      else if (rafId === null && sceneReady) renderOnce(0);
    });
  });
  const riderBtn = $("toggleRiderBtn");
  if (riderBtn) {
    riderBtn.addEventListener("click", () => {
      state.riderVisible = !state.riderVisible;
      if (rider) rider.root.visible = state.riderVisible;
      riderBtn.setAttribute("aria-pressed", String(state.riderVisible));
      $("riderToggleLabel").textContent = state.riderVisible ? "Cadet rider: on" : "Cadet rider: off";
      $("riderStatusDot").style.background = state.riderVisible ? "#9E7B50" : "transparent";
      if (rafId === null && sceneReady) renderOnce(0);
    });
  }
  $("resetCameraBtn").addEventListener("click", () => selectConnection(state.activeConnection, false, false));
  initDeck();
}

/* ------------------------------------------------------------------ 15. loop */
function isPaused() {
  return document.hidden || !hostVisible;
}

function renderOnce(dt = 0) {
  updatePose(dt);
  updateRider(dt);
  updateLines(clockTime);
  controls.update();
  renderer.render(scene, camera);
  updateCoatGlow();
  updateProjectedCalloutPins();
  updateHud();
}

const hud = { lift: null, tilt: null, last: 0 };
function updateHud() {
  const seat = world.userData.seat;
  if (!seat || state.activeMode !== "posture") return;
  const now = performance.now();
  if (now - hud.last < 90) return;
  hud.last = now;
  hud.lift = hud.lift || $("hudLift");
  hud.tilt = hud.tilt || $("hudTilt");
  const lift = seat.delta.elements[13] * 1000;
  const e = new THREE.Euler().setFromQuaternion(seat.q, "XYZ");
  hud.lift.textContent = String(Math.round(Math.abs(lift)));
  hud.tilt.textContent = Math.abs((e.x * 180) / Math.PI).toFixed(1);
}

function renderFrame(now) {
  rafId = null;
  if (!sceneReady || isPaused()) return;
  const dt = lastTime ? Math.min(0.05, Math.max(0, (now - lastTime) / 1000)) : 0;
  lastTime = now;
  if (!state.reducedMotion || state.isPlaying) clockTime += dt;
  renderOnce(dt);
  rafId = requestAnimationFrame(renderFrame);
}

function resumeLoop() {
  if (!sceneReady || rafId !== null || isPaused()) return;
  lastTime = 0;
  rafId = requestAnimationFrame(renderFrame);
}

function pauseLoop() {
  if (rafId !== null) cancelAnimationFrame(rafId);
  rafId = null;
}

function setHostVisible(visible) {
  hostVisible = !!visible;
  window.bsahPaused = !hostVisible;
  if (hostVisible) resumeLoop();
  else pauseLoop();
}

window.addEventListener("message", (e) => {
  if (e.origin !== location.origin || !e.data || e.data.type !== "bsah-anatomy-visibility") return;
  setHostVisible(e.data.visible);
});
document.addEventListener("visibilitychange", () => (document.hidden ? pauseLoop() : resumeLoop()));

// Exposed for automated checks only (read-only state snapshot).
window.bsahExhibit = {
  get running() {
    return rafId !== null;
  },
  get clock() {
    return clockTime;
  },
  get playing() {
    return state.isPlaying;
  },
  get gait() {
    return state.activeGait;
  },
  get mode() {
    return state.activeMode;
  },
  get connection() {
    return state.activeConnection;
  },
  get riderVisible() {
    return state.riderVisible;
  },
  get webgl() {
    return sceneReady;
  },
  get phase() {
    return state.stridePhase;
  },
  debug: () => ({ THREE, scene, camera, controls, renderer, horse, rider, anchors, layers, state, world }),
};

/* ------------------------------------------------------------------ 16. boot */
function webglAvailable() {
  try {
    const probe = document.createElement("canvas");
    return !!(window.WebGLRenderingContext && (probe.getContext("webgl2") || probe.getContext("webgl")));
  } catch {
    return false;
  }
}

function enterFallback() {
  document.documentElement.classList.add("no-webgl");
  const fallback = $("noWebglFallback");
  if (fallback) fallback.hidden = false;
  $("loadingOverlay")?.classList.add("hidden");
}

/** Test hooks for captures: ?mode=skeletal|muscular|external|posture &gait=walk|trot|canter &phase=0..1 (a paused stride pose) &rider=off &conn=0..2 */
function applyQaParams() {
  const q = new URLSearchParams(location.search);
  if (MODES[q.get("mode")]) applyVisualizationMode(q.get("mode"), true);
  if (GAITS[q.get("gait")]) {
    selectGait(q.get("gait"));
    state.gaitPosed = true;
    state.stridePhase = Math.min(0.999, Math.max(0, parseFloat(q.get("phase") || "0") || 0));
    updateStrideScrubberUI();
  }
  if (q.get("conn")) selectConnection(parseInt(q.get("conn"), 10) || 0, true, false);
  if (q.get("rider") === "off") $("toggleRiderBtn")?.click();
}

async function boot() {
  const overlay = $("loadingOverlay");
  setupUIListeners();
  updateStrideScrubberUI();
  selectConnection(0, true, false);
  try {
    if (/[?&]nowebgl\b/.test(location.search) || !webglAvailable()) throw new Error("WebGL unavailable");
    initScene();
    const horseLoad = loadMarwari(HORSE_URL, (f) => {
      progress.horse = f;
      setProgress();
    });
    const riderLoad = loadGltf(RIDER_URL, (f) => {
      progress.rider = f;
      setProgress();
    }).catch((err) => {
      console.warn("[bsah] cadet model unavailable; showing the horse alone.", err);
      return null;
    });
    const [h, r] = await Promise.all([horseLoad.promise, riderLoad]);
    horseLoad.dispose();
    assemble(h, r);
    setupRaycasting();
    updateResponsiveFraming();
    new ResizeObserver(() => updateResponsiveFraming()).observe(stage);
    sceneReady = true;
    applyVisualizationMode("posture", true);
    selectConnection(0, true, false);
    applyQaParams();
    renderOnce(0);
    if (overlay) {
      overlay.style.opacity = "0";
      setTimeout(() => overlay.classList.add("hidden"), 350);
    }
    resumeLoop();
  } catch (err) {
    console.warn("[bsah] anatomy exhibit 3D unavailable; showing the drawing.", err instanceof Error ? err.message : err);
    sceneReady = false;
    enterFallback();
  }
}

boot();
