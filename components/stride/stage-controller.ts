import * as THREE from "three";
import { groundPatch } from "@/components/3d/contact";
import { addLights, daylight } from "@/components/3d/marwari";
import { createStudioEnv } from "@/components/3d/studio";
import { AUTHORED, LIMBS } from "@/lib/stride/constants";
import { HOTSPOTS, type StrideRig } from "@/lib/stride/rig";
import { wrap01 } from "@/lib/stride/analysis";
import type { StrideClock } from "@/lib/stride/clock";
import { CAMERAS, type CameraId, type HotspotId, type StrideStore } from "@/lib/stride/store";

/** Where the camera looks when nothing else says: the middle of the horse and rider. */
const CENTRE = new THREE.Vector3(0, 1.12, 0.26);
const smooth = (a: number, b: number, v: number) => {
  const t = Math.min(1, Math.max(0, (v - a) / (b - a)));
  return t * t * (3 - 2 * t);
};

type Goal = { az: number; el: number; dist: number; target: THREE.Vector3; shiftX: number; shiftY: number };

/**
 * Story camera: one pose per beat of the page (opening, four beats, the back, the seat, the laboratory). `story` is a position
 * between them (0 = opening, 4 = laboratory); the pose between two beats is eased, so the camera glides while the page scrolls.
 * shiftX / shiftY are fractions of the stage: positive moves the scene left / up.
 */
const BEATS: { az: number; el: number; fit: number; target: [number, number, number]; shiftX: number; shiftY: number }[] = [
  { az: 24, el: 9, fit: 1.0, target: [0, 1.1, 0.3], shiftX: -0.12, shiftY: -0.08 },
  { az: 3, el: 5, fit: 1.04, target: [0, 1.05, 0.3], shiftX: -0.14, shiftY: -0.05 },
  { az: -42, el: 12, fit: 0.98, target: [0, 1.2, -0.05], shiftX: -0.14, shiftY: -0.03 },
  { az: -22, el: 9, fit: 0.76, target: [0, 1.58, 0.05], shiftX: -0.14, shiftY: 0 },
  { az: 0, el: 6, fit: 1.0, target: [0, 1.12, 0.26], shiftX: 0, shiftY: 0 },
];

export type StageOptions = {
  gl: THREE.WebGLRenderer;
  scene: THREE.Scene;
  camera: THREE.PerspectiveCamera;
  rig: StrideRig;
  clock: StrideClock;
  store: StrideStore;
  reduced: boolean;
  wide: boolean;
  quality: "high" | "low";
  markers: Map<HotspotId, HTMLElement>;
};

function cssColor(name: string, fallback: string) {
  if (typeof document === "undefined") return new THREE.Color(fallback);
  const v = getComputedStyle(document.documentElement).getPropertyValue(name).trim();
  try {
    return new THREE.Color(v || fallback);
  } catch {
    return new THREE.Color(fallback);
  }
}

/**
 * Everything that happens in a frame of the stride study, in one place. The stage's single render loop calls `frame()`; it advances
 * the one clock, poses the horse and rider for the clock's phase, slides the floor under the hooves, steers the camera, and places
 * the DOM markers. Nothing here owns a timer.
 */
export class StageController {
  private readonly o: StageOptions;
  private readonly envTarget: THREE.WebGLRenderTarget;
  private readonly floorMaterial: THREE.ShaderMaterial;
  private readonly rings: THREE.InstancedMesh;
  private readonly ringDummy = new THREE.Object3D();
  private readonly ringColors: { planted: THREE.Color; past: THREE.Color };
  private readonly focusRing: THREE.Mesh;
  private readonly disposables: { dispose(): void }[] = [];
  private lastPhase = -1;
  private appearance = { coat: 1, rider: 1 };
  private cur: Goal;
  private readonly goalTarget = new THREE.Vector3();
  private seenCamera: CameraId | null = null;
  private seenHotspot: HotspotId | null = null;
  private time = 0;
  private readonly tmp = new THREE.Vector3();
  private readonly tmp2 = new THREE.Vector3();
  private readonly canvas: HTMLCanvasElement;
  private readonly drag = { active: false, x: 0, y: 0 };
  private readonly cleanup: (() => void)[] = [];
  /** Updated every frame for the readouts: the screen-space position (CSS px) of each hotspot. */
  readonly markerScreen = new Map<HotspotId, { x: number; y: number; visible: boolean }>();

  constructor(options: StageOptions) {
    this.o = options;
    const { gl, scene, rig } = options;
    this.canvas = gl.domElement;

    // light: the studio reflections that keep a black coat black, and a noon key
    this.envTarget = createStudioEnv(gl);
    scene.environment = this.envTarget.texture;
    scene.environmentIntensity = 0.85;
    const lights = addLights(scene);
    const noon = daylight(12);
    lights(noon);
    gl.toneMappingExposure = noon.exposure * 0.9;
    this.disposables.push({ dispose: () => scene.remove(...lights.lights) });

    scene.add(rig.root);

    // a soft shadow under the body, and the floor: fine lines across the ground that slide under the hooves
    const patch = groundPatch(2.5, 3.5);
    // the studio shadow is made for a dark stage; on the ivory floor it is a lighter, tighter pool, and the warm light pool is dropped
    patch.traverse((o) => {
      const mesh = o as THREE.Mesh;
      if (!mesh.isMesh) return;
      const mat = mesh.material as THREE.MeshBasicMaterial;
      if (mat.blending === THREE.AdditiveBlending) mesh.visible = false;
      else mat.opacity = 0.42;
    });
    scene.add(patch);
    const brass = cssColor("--color-brass", "#7b5636");
    this.floorMaterial = new THREE.ShaderMaterial({
      transparent: true,
      depthWrite: false,
      uniforms: { uOffset: { value: 0 }, uSpacing: { value: AUTHORED.strideLengthM / 4 }, uColor: { value: brass }, uAlpha: { value: 0.26 } },
      vertexShader: `varying vec2 vXZ; void main(){ vXZ = position.xy; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }`,
      fragmentShader: `
        varying vec2 vXZ; uniform float uOffset; uniform float uSpacing; uniform vec3 uColor; uniform float uAlpha;
        void main(){
          // vXZ.y is the horse's forward axis once the plane is laid flat; lines stand across it and slide backwards with the stride
          float z = vXZ.y;
          float d = abs(mod(z + uOffset + uSpacing * 0.5, uSpacing) - uSpacing * 0.5);
          float line = 1.0 - smoothstep(0.0, 0.0065, d);
          float r = length(vec2(vXZ.x * 0.78, z - 0.2));
          float fade = 1.0 - smoothstep(0.9, 3.2, r);
          float a = line * fade * uAlpha;
          if (a < 0.003) discard;
          gl_FragColor = vec4(uColor, a);
        }`,
    });
    const floor = new THREE.Mesh(new THREE.PlaneGeometry(9, 9), this.floorMaterial);
    floor.rotation.x = -Math.PI / 2;
    floor.position.y = 0.0015;
    floor.renderOrder = 2;
    scene.add(floor);
    this.disposables.push(floor.geometry, this.floorMaterial);

    // rings where each hoof landed: they stay on the ground while the horse moves on, so a hoof that slides leaves its ring
    const ringGeo = new THREE.RingGeometry(0.052, 0.068, 36);
    ringGeo.rotateX(-Math.PI / 2);
    ringGeo.scale(1, 1, 1.25);
    const ringMat = new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.95, depthWrite: false });
    this.rings = new THREE.InstancedMesh(ringGeo, ringMat, LIMBS.length * RING_STRIDES);
    this.rings.frustumCulled = false;
    this.rings.renderOrder = 3;
    this.rings.setColorAt(0, new THREE.Color());
    scene.add(this.rings);
    this.ringColors = { planted: cssColor("--color-gold", "#78472f"), past: cssColor("--color-caramel", "#b88a62") };
    this.disposables.push(ringGeo, ringMat);

    // the ring that marks the chosen hotspot
    const ringTorus = new THREE.RingGeometry(0.09, 0.1, 64);
    this.focusRing = new THREE.Mesh(ringTorus, new THREE.MeshBasicMaterial({ color: cssColor("--color-gold", "#78472f"), transparent: true, opacity: 0.0, depthTest: false, depthWrite: false }));
    this.focusRing.renderOrder = 30;
    this.focusRing.visible = false;
    scene.add(this.focusRing);
    this.disposables.push(ringTorus, this.focusRing.material as THREE.Material);

    if (options.reduced) {
      rig.horse.hair.wind.value.set(0, 0, 0);
      rig.horse.hair.flow.value = 0;
    }

    this.cur = this.goalFor();
    this.snapCamera();
    this.attachDrag();
  }

  /* ------------------------------------------------------------------------------------------ camera */

  private get aspect() {
    const el = this.canvas;
    return (el.clientWidth || 1) / (el.clientHeight || 1);
  }

  /** Distance at which the horse and rider fit the part of the stage that the panel and the dock leave free. */
  private fitDistance(fit: number, inset: number, dock: number) {
    const fov = this.o.camera.fov * (Math.PI / 180);
    const half = Math.tan(fov / 2);
    const aspect = this.aspect * (1 - Math.max(0, inset));
    const needH = 3.05;
    const needW = 3.9;
    // the navigation covers the top of the stage: the horse and rider are framed in what is left under it (and above the dock)
    const free = 1 - Math.max(0, dock) - (dock > 0 ? this.topFraction : 0);
    return Math.max(needH / 2 / (half * free), needW / 2 / (half * aspect)) * fit;
  }

  /** The share of the stage's height taken by the navigation bar. */
  private get topFraction() {
    return 100 / (this.canvas.clientHeight || 900);
  }

  private goalFor(): Goal {
    const { store, wide } = this.o;
    const inset = wide ? store.inset : 0;
    const dock = wide ? store.dock : 0;
    const labZone = store.story >= 3.5;
    if (store.manual && labZone) {
      if (store.hotspot) {
        const h = HOTSPOTS.find((x) => x.id === store.hotspot)!;
        const mean = this.o.rig.data.hotspotMean[h.id];
        const target = CENTRE.clone().lerp(mean, 0.8);
        return { az: h.cam.az, el: h.cam.el, dist: Math.max(1.5, h.cam.dist), target, shiftX: inset / 2, shiftY: dock > 0 ? (dock - this.topFraction) / 2 : 0 };
      }
      const c = CAMERAS.find((x) => x.id === store.camera) ?? CAMERAS[0];
      return { az: c.az, el: c.el, dist: this.fitDistance(c.fit, inset, dock), target: CENTRE.clone(), shiftX: inset / 2, shiftY: dock > 0 ? (dock - this.topFraction) / 2 : 0 };
    }
    // story: between two beats; the last beat is the laboratory, where the panel takes the right-hand side
    const story = Math.min(BEATS.length - 1, Math.max(0, store.story));
    const i = Math.min(BEATS.length - 2, Math.floor(story));
    const t = smooth(0, 1, story - i);
    const from = BEATS[i];
    const to = BEATS[i + 1];
    const lerp = (x: number, y: number) => x + (y - x) * t;
    const last = BEATS.length - 1;
    const shiftOf = (beat: (typeof BEATS)[number], index: number) => (!wide ? 0 : index === last ? inset / 2 : beat.shiftX);
    const shiftYOf = (beat: (typeof BEATS)[number], index: number) => (index === last ? (dock > 0 ? (dock - this.topFraction) / 2 : 0) : beat.shiftY * (wide ? 1 : 0.5));
    const arrive = i + 1 === last ? t : story >= last ? 1 : 0; // how far the panel and the dock have come in
    return {
      az: lerp(from.az, to.az),
      el: lerp(from.el, to.el),
      dist: this.fitDistance(lerp(from.fit, to.fit), inset * arrive, dock * arrive),
      target: new THREE.Vector3(lerp(from.target[0], to.target[0]), lerp(from.target[1], to.target[1]), lerp(from.target[2], to.target[2])),
      shiftX: lerp(shiftOf(from, i), shiftOf(to, i + 1)),
      shiftY: lerp(shiftYOf(from, i), shiftYOf(to, i + 1)),
    };
  }

  private applyCamera(g: Goal) {
    const { camera } = this.o;
    const az = (g.az * Math.PI) / 180;
    const el = (g.el * Math.PI) / 180;
    camera.position.set(g.target.x - Math.cos(el) * Math.cos(az) * g.dist, g.target.y + Math.sin(el) * g.dist, g.target.z + Math.cos(el) * Math.sin(az) * g.dist);
    camera.up.set(0, 1, 0);
    camera.lookAt(g.target);
    const w = this.canvas.clientWidth || 1;
    const h = this.canvas.clientHeight || 1;
    if (Math.abs(g.shiftX) > 1e-4 || Math.abs(g.shiftY) > 1e-4) camera.setViewOffset(w, h, g.shiftX * w, g.shiftY * h, w, h);
    else camera.clearViewOffset();
    camera.updateMatrixWorld(true);
  }

  private snapCamera() {
    this.applyCamera(this.cur);
  }

  private attachDrag() {
    const el = this.canvas;
    el.style.touchAction = "pan-y"; // a vertical swipe still scrolls the page; the wheel is never taken
    const store = this.o.store;
    const down = (e: PointerEvent) => {
      if (e.button !== 0) return;
      this.drag.active = true;
      this.drag.x = e.clientX;
      this.drag.y = e.clientY;
    };
    const move = (e: PointerEvent) => {
      if (!this.drag.active) return;
      const dx = e.clientX - this.drag.x;
      const dy = e.clientY - this.drag.y;
      if (Math.abs(dx) < 3 && Math.abs(dy) < 3) return;
      this.drag.x = e.clientX;
      this.drag.y = e.clientY;
      if (store.story < 3.5) return; // while the page tells its story the camera is the page's
      if (!store.manual) store.patch({ manual: true, hotspot: null });
      // dragging orbits the current angle: it becomes a custom camera
      this.cur.az = Math.max(-140, Math.min(140, this.cur.az - dx * 0.3));
      this.cur.el = Math.max(2, Math.min(82, this.cur.el + dy * 0.2));
      this.dragGoal = { az: this.cur.az, el: this.cur.el };
      this.o.clock.requestRender();
    };
    const up = () => {
      this.drag.active = false;
    };
    el.addEventListener("pointerdown", down);
    window.addEventListener("pointermove", move);
    window.addEventListener("pointerup", up);
    window.addEventListener("pointercancel", up);
    this.cleanup.push(() => {
      el.removeEventListener("pointerdown", down);
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerup", up);
      window.removeEventListener("pointercancel", up);
    });
  }
  private dragGoal: { az: number; el: number } | null = null;

  /* ------------------------------------------------------------------------------------------ floor */

  private placeRings(phase: number) {
    const { rig } = this.o;
    const L = AUTHORED.strideLengthM;
    let n = 0;
    for (const l of rig.landing) {
      const stance = rig.data.stance[l.limb];
      for (let k = 0; k < RING_STRIDES; k++) {
        const age = wrap01(phase - l.phase) + k; // strides since this hoof landed
        const z = l.z - L * age;
        const planted = k === 0 && wrap01(phase - l.phase) < stance.duty;
        const fade = 1 - smooth(1.7, 2.7, age);
        const grow = smooth(0, 0.03, age);
        const s = Math.max(0.0001, fade * grow);
        this.ringDummy.position.set(l.x, 0.004, z);
        this.ringDummy.scale.set(s, 1, s);
        this.ringDummy.updateMatrix();
        this.rings.setMatrixAt(n, this.ringDummy.matrix);
        this.rings.setColorAt(n, planted ? this.ringColors.planted : this.ringColors.past);
        n++;
      }
    }
    this.rings.instanceMatrix.needsUpdate = true;
    if (this.rings.instanceColor) this.rings.instanceColor.needsUpdate = true;
  }

  /* ------------------------------------------------------------------------------------------ the frame */

  /** Returns true while something is still moving, so the loop asks for another frame. */
  frame(dtRaw: number): boolean {
    const t0 = performance.now();
    const busy = this.step(dtRaw);
    const ms = performance.now() - t0;
    this.stats.frames++;
    this.stats.cpuMs += ms;
    if (ms > this.stats.maxMs) this.stats.maxMs = ms;
    return busy;
  }

  private step(dtRaw: number): boolean {
    const { clock, store, rig, reduced } = this.o;
    // smoothing uses a short step so a slow frame never throws the camera; the clock keeps real time (up to a quarter of a second, after a stall)
    const dt = Math.min(0.05, Math.max(0, dtRaw));
    this.time += dt;
    clock.advance(Math.min(0.25, Math.max(0, dtRaw)));
    let busy = clock.playing;

    // pose and floor follow the clock's phase
    if (clock.phase !== this.lastPhase) {
      this.lastPhase = clock.phase;
      rig.setPhase(clock.phase);
      this.floorMaterial.uniforms.uOffset.value = AUTHORED.strideLengthM * clock.phase;
      this.placeRings(clock.phase);
    }

    // what is shown: horse and rider, the horse, or the rider on a ghost of the horse; the skeleton shows through the coat
    const wantCoat = store.skeleton ? 0.16 : store.view === "rider" ? 0.1 : 1;
    const wantRider = store.view === "horse" ? 0 : 1;
    const k = reduced ? 1 : 1 - Math.exp(-dt * 9);
    const a = this.appearance;
    a.coat += (wantCoat - a.coat) * k;
    a.rider += (wantRider - a.rider) * k;
    if (Math.abs(wantCoat - a.coat) < 0.004) a.coat = wantCoat;
    if (Math.abs(wantRider - a.rider) < 0.004) a.rider = wantRider;
    rig.applyAppearance({ coat: a.coat, skeleton: store.skeleton, rider: a.rider, tack: true });
    if (a.coat !== wantCoat || a.rider !== wantRider) busy = true;

    // camera: a preset or hotspot chosen by hand ends any drag; otherwise a drag orbits the preset
    if (store.camera !== this.seenCamera || store.hotspot !== this.seenHotspot) {
      this.dragGoal = null;
      this.seenCamera = store.camera;
      this.seenHotspot = store.hotspot;
    }
    const goal = this.goalFor();
    if (this.dragGoal && store.manual && !store.hotspot) {
      goal.az = this.dragGoal.az;
      goal.el = this.dragGoal.el;
    }
    const kc = reduced ? 1 : 1 - Math.exp(-dt * 5.5);
    const c = this.cur;
    c.az += (goal.az - c.az) * kc;
    c.el += (goal.el - c.el) * kc;
    c.dist += (goal.dist - c.dist) * kc;
    c.shiftX += (goal.shiftX - c.shiftX) * kc;
    c.shiftY += (goal.shiftY - c.shiftY) * kc;
    c.target.lerp(goal.target, kc);
    const err = Math.abs(goal.az - c.az) + Math.abs(goal.el - c.el) + Math.abs(goal.dist - c.dist) * 10 + (Math.abs(goal.shiftX - c.shiftX) + Math.abs(goal.shiftY - c.shiftY)) * 100 + goal.target.distanceTo(c.target) * 100;
    if (err < 0.02) {
      Object.assign(c, { az: goal.az, el: goal.el, dist: goal.dist, shiftX: goal.shiftX, shiftY: goal.shiftY });
      c.target.copy(goal.target);
    } else {
      busy = true;
    }
    this.applyCamera(c);

    this.placeMarkers();
    this.focus(store.hotspot, dt);
    if (this.o.store.hotspot) busy = busy || !reduced;
    return busy;
  }

  /* ------------------------------------------------------------------------------------------ hotspots */

  private placeMarkers() {
    const { rig, camera, markers } = this.o;
    const w = this.canvas.clientWidth || 1;
    const h = this.canvas.clientHeight || 1;
    const camX = camera.position.x;
    for (const spot of HOTSPOTS) {
      const el = markers.get(spot.id);
      const p = rig.hotspotWorld(spot.id, this.tmp);
      if (!el || !p) continue;
      const ndc = this.tmp2.copy(p).project(camera);
      const x = (ndc.x * 0.5 + 0.5) * w;
      const y = (-ndc.y * 0.5 + 0.5) * h;
      // behind the camera, under the navigation, or on the far side of the horse: not shown
      const topClear = 100; // the marker's own box stays below the top 80 px (the navigation)
      const farSide = !!spot.right && camX > 0.35;
      const shownInView = this.o.store.view === "rider" ? spot.kind === "rider" : this.o.store.view === "horse" ? spot.kind !== "rider" : true;
      const visible = this.o.store.story >= 3.4 && ndc.z < 1 && y > topClear && y < h - 8 && x > 8 && x < w - 8 && !farSide && shownInView;
      el.style.transform = `translate3d(${x.toFixed(1)}px, ${y.toFixed(1)}px, 0)`;
      el.style.opacity = visible ? "1" : "0";
      el.style.pointerEvents = visible ? "auto" : "none";
      let m = this.markerScreen.get(spot.id);
      if (!m) this.markerScreen.set(spot.id, (m = { x, y, visible }));
      m.x = x;
      m.y = y;
      m.visible = visible;
    }
  }

  /** The ring and the coat glow on the chosen hotspot. */
  private focus(id: HotspotId | null, dt: number) {
    const { rig, camera, reduced } = this.o;
    const ring = this.focusRing;
    const mat = ring.material as THREE.MeshBasicMaterial;
    const glow = rig.horse.highlight;
    if (!id) {
      mat.opacity += (0 - mat.opacity) * Math.min(1, dt * 10);
      ring.visible = mat.opacity > 0.01;
      glow.strength.value += (0 - glow.strength.value) * Math.min(1, dt * 8);
      if (glow.strength.value < 0.01) glow.set([]);
      return;
    }
    const p = rig.hotspotWorld(id, this.tmp);
    if (!p) return;
    const spot = HOTSPOTS.find((s) => s.id === id)!;
    ring.visible = true;
    ring.position.copy(p);
    ring.quaternion.copy(camera.quaternion);
    const pulse = reduced ? 1 : 1 + 0.08 * Math.sin(this.time * 3.2);
    ring.scale.setScalar(pulse * (spot.kind === "hoof" ? 0.8 : 1));
    mat.opacity += (0.9 - mat.opacity) * Math.min(1, dt * 8);
    if (spot.kind === "horse" && this.o.store.view !== "rider") {
      glow.set([{ center: p.clone(), radius: spot.id === "pelvis" || spot.id === "hindquarters" ? 0.3 : 0.26 }]);
      glow.strength.value += (0.5 - glow.strength.value) * Math.min(1, dt * 6);
    } else {
      glow.strength.value += (0 - glow.strength.value) * Math.min(1, dt * 8);
    }
  }

  /** The camera's presets, for the buttons. */
  static cameraIds: CameraId[] = CAMERAS.map((c) => c.id);

  /** For checks: the live camera and renderer. */
  get camera() {
    return this.o.camera;
  }
  get renderer() {
    return this.o.gl;
  }
  readonly stats = { frames: 0, cpuMs: 0, maxMs: 0 };

  /** For checks: draws `n` frames back to back at successive phases and waits for the GPU each time; returns the mean milliseconds (no vsync). */
  benchmark(n = 60) {
    const gl = this.o.gl;
    const ctx = gl.getContext();
    const px = new Uint8Array(4);
    const t0 = performance.now();
    for (let i = 0; i < n; i++) {
      this.o.rig.setPhase(i / n);
      this.o.gl.render(this.o.scene, this.o.camera);
      ctx.readPixels(0, 0, 1, 1, ctx.RGBA, ctx.UNSIGNED_BYTE, px);
    }
    const ms = (performance.now() - t0) / n;
    const info = gl.info;
    return { ms, calls: info.render.calls, triangles: info.render.triangles, geometries: info.memory.geometries, textures: info.memory.textures, programs: info.programs?.length ?? 0 };
  }

  dispose() {
    for (const fn of this.cleanup) fn();
    for (const d of this.disposables) {
      try {
        d.dispose();
      } catch {
        /* already released */
      }
    }
    this.rings.dispose();
    this.o.scene.remove(this.rings, this.focusRing);
    this.o.scene.environment = null;
    this.envTarget.dispose();
    this.o.rig.horse.highlight.strength.value = 0;
    this.o.rig.horse.highlight.set([]);
    this.o.camera.clearViewOffset();
  }
}

const RING_STRIDES = 5;
