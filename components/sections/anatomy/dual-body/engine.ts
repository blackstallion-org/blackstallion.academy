import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import type { GaitKey, MuscleRegion, ViewMode } from "@/lib/content/anatomy-dualbody";
import { loftMesh, populateLoft, v3, type ShapeMod } from "./loft";

/**
 * Dual-body engine: a sculpted Marwari stallion with a seated cadet, built from lofted splines, with four
 * view modes (coat, bone, muscle, posture), procedural walk / trot / canter, and camera framing per
 * rider ↔ horse connection. Ported from the standalone three r128 prototype to r186.
 * Imperative and framework-free: DualBody.tsx owns the DOM, this owns the canvas.
 */

/** Colours read at runtime from the section's CSS role tokens (app/globals.css). */
export type DualBodyPalette = {
  gold: string;
  brass: string;
  bone: string;
  dust: string;
  ivory: string;
  parch: string;
  leather: string;
  chestnut: string;
  caramel: string;
  antique: string;
  bhanwar: string;
  kala: string;
  surang: string;
};

export type PinPoint = { x: number; y: number; visible: boolean };
export type PinFrame = { rider: PinPoint; horse: PinPoint; width: number; height: number };

export type DualBodyEngineOptions = {
  host: HTMLElement;
  palette: DualBodyPalette;
  reducedMotion: boolean;
  /** Rider/horse anchor positions in CSS px relative to the host, every rendered frame. */
  onPins?: (frame: PinFrame) => void;
};

type ConnectionFrame = {
  target: [number, number];
  distance: number;
  riderAnchor: THREE.Vector3;
  horseAnchor: THREE.Vector3;
  pulse: [number, number];
};

/* Seat height on the horse's back (thorax-local). */
const SEAT = new THREE.Vector3(-0.04, 0.66, 0);

/* Per connection (index order matches lib/content/anatomy-dualbody.ts). Anchors are thorax-local. */
const CONNECTION_FRAMES: ConnectionFrame[] = [
  { target: [-0.58, 0.58], distance: 0.74, riderAnchor: v3(-0.07, 1.16, 0), horseAnchor: v3(-1.1, 0.8, 0), pulse: [1, 0.85] },
  { target: [-0.16, 0.6], distance: 0.74, riderAnchor: v3(-0.05, 0.95, 0), horseAnchor: v3(-0.3, 0.76, 0), pulse: [0.9, 1] },
  { target: [0.3, 0.55], distance: 0.74, riderAnchor: v3(-0.02, 0.76, 0), horseAnchor: v3(0.48, 0.66, 0), pulse: [0.85, 1] },
];

const GAITS: Record<GaitKey, { speed: number; strideAmp: number; liftAmp: number; headNodAmp: number; spineWaveAmp: number }> = {
  walk: { speed: 1.25, strideAmp: 0.3, liftAmp: 0.28, headNodAmp: 0.038, spineWaveAmp: 0.015 },
  trot: { speed: 2.15, strideAmp: 0.42, liftAmp: 0.4, headNodAmp: 0.02, spineWaveAmp: 0.028 },
  canter: { speed: 2.6, strideAmp: 0.48, liftAmp: 0.44, headNodAmp: 0.062, spineWaveAmp: 0.048 },
};

/* The house curve, cubic-bezier(0.16, 1, 0.3, 1). */
function houseEase(t: number): number {
  const x1 = 0.16, y1 = 1, x2 = 0.3, y2 = 1;
  const bx = (s: number) => 3 * x1 * s * (1 - s) ** 2 + 3 * x2 * s * s * (1 - s) + s ** 3;
  const by = (s: number) => 3 * y1 * s * (1 - s) ** 2 + 3 * y2 * s * s * (1 - s) + s ** 3;
  let lo = 0, hi = 1, s = t;
  for (let i = 0; i < 24; i++) {
    s = (lo + hi) / 2;
    if (bx(s) < t) lo = s; else hi = s;
  }
  return by(s);
}

type Limb = {
  isFore: boolean;
  zOffset: number;
  geo: THREE.BufferGeometry;
  hoofGeo: THREE.BufferGeometry;
  radiiZ: number[];
  radiiY: number[];
};

const col = (c: string, fallback: string) => {
  const color = new THREE.Color();
  try {
    color.setStyle(c.trim() || fallback);
  } catch {
    color.setStyle(fallback);
  }
  return color;
};

export class DualBodyEngine {
  private host: HTMLElement;
  private canvas: HTMLCanvasElement;
  private renderer: THREE.WebGLRenderer;
  private scene = new THREE.Scene();
  private camera = new THREE.PerspectiveCamera(28, 1, 0.1, 100);
  private controls: OrbitControls | null = null;
  private onPins?: (frame: PinFrame) => void;
  private reduced: boolean;
  private p: Record<keyof DualBodyPalette, THREE.Color>;

  private root = new THREE.Group();
  private pelvisRoot = new THREE.Group();
  private thorax = new THREE.Group();
  private head = new THREE.Group();
  private leftEar = new THREE.Group();
  private rightEar = new THREE.Group();
  private tail = new THREE.Group();
  private coatGroup = new THREE.Group();
  private trunkGroup = new THREE.Group();
  private tackGroup = new THREE.Group();
  private skeletonGroup = new THREE.Group();
  private muscleGroup = new THREE.Group();
  private postureGroup = new THREE.Group();
  private riderGroup = new THREE.Group();
  private groundGroup = new THREE.Group();

  private trunkMaterials: THREE.MeshPhysicalMaterial[] = [];
  private riderMaterials: THREE.MeshStandardMaterial[] = [];
  private muscles: { mesh: THREE.Mesh; region: MuscleRegion; mat: THREE.MeshPhysicalMaterial }[] = [];
  private pulseUniforms: { uTime: { value: number }; uIntensity: { value: number } }[] = [];
  private limbs: Record<"fl" | "fr" | "hl" | "hr", Limb> | null = null;
  private textures: THREE.Texture[] = [];

  private mode: ViewMode = "posture";
  private trunkOpacity = 0.55;
  private trunkTarget = 0.55;
  private riderOpacity = 0.62;
  private riderTarget = 0.62;
  private connection = 0;
  private zoomed = false;
  private playing = false;
  private gait: GaitKey = "walk";
  private stridePhase = 0;
  private posed = false;
  private base = { target: new THREE.Vector2(-0.06, 0.12), distance: 5 };
  private tween: { from: THREE.Vector3; fromT: THREE.Vector3; to: THREE.Vector3; toT: THREE.Vector3; t0: number; dur: number } | null = null;

  private raf = 0;
  private running = false;
  private dirty = true;
  private last = 0;
  private elapsed = 0;
  private width = 1;
  private height = 1;
  private resizeObserver: ResizeObserver;
  private disposed = false;

  constructor({ host, palette, reducedMotion, onPins }: DualBodyEngineOptions) {
    this.host = host;
    this.onPins = onPins;
    this.reduced = reducedMotion;
    this.p = {
      gold: col(palette.gold, "#c9a66b"),
      brass: col(palette.brass, "#b88a62"),
      bone: col(palette.bone, "#f3ede2"),
      dust: col(palette.dust, "#a8957f"),
      ivory: col(palette.ivory, "#f3ede2"),
      parch: col(palette.parch, "#e8dece"),
      leather: col(palette.leather, "#493126"),
      chestnut: col(palette.chestnut, "#78472f"),
      caramel: col(palette.caramel, "#b88a62"),
      antique: col(palette.antique, "#c9a66b"),
      bhanwar: col(palette.bhanwar, "#2a1d15"),
      kala: col(palette.kala, "#0f0e0d"),
      surang: col(palette.surang, "#593822"),
    };

    this.canvas = document.createElement("canvas");
    this.canvas.setAttribute("aria-hidden", "true");
    this.canvas.style.display = "block";
    this.canvas.style.width = "100%";
    this.canvas.style.height = "100%";
    host.appendChild(this.canvas);

    // Throws when WebGL is unavailable; DualBody catches it and shows the still.
    // Default power preference: a decorative scene should not wake the discrete GPU on dual-GPU laptops.
    this.renderer = new THREE.WebGLRenderer({ canvas: this.canvas, antialias: true, alpha: true });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.75));
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.05;
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFShadowMap;
    this.renderer.setClearColor(0x000000, 0);

    if (window.matchMedia("(pointer: fine)").matches) {
      const controls = new OrbitControls(this.camera, this.canvas);
      controls.enableDamping = true;
      controls.dampingFactor = 0.08;
      controls.enablePan = false;
      controls.enableZoom = false; // never hijack page scroll
      controls.minPolarAngle = Math.PI * 0.32;
      controls.maxPolarAngle = Math.PI * 0.54;
      controls.minAzimuthAngle = -Math.PI * 0.36;
      controls.maxAzimuthAngle = Math.PI * 0.36;
      controls.addEventListener("change", () => (this.dirty = true));
      controls.addEventListener("start", () => (this.tween = null));
      // OrbitControls sets touch-action: none; keep vertical page scrolling for a finger on a touch-screen laptop.
      this.canvas.style.touchAction = "pan-y";
      this.controls = controls;
    }

    this.buildLights();
    this.root.position.set(0.04, -0.04, 0);
    this.scene.add(this.groundGroup, this.root);
    this.buildGround();
    this.buildHorse();
    this.buildRider();
    this.buildSkeleton();
    this.buildMuscles();
    this.buildPostureLines();

    this.applyMode("posture", true);
    this.setConnection(0, false, true);
    this.pose(0);

    const rect = host.getBoundingClientRect();
    this.resize(rect.width, rect.height);
    this.resizeObserver = new ResizeObserver((entries) => {
      const box = entries[0]?.contentRect;
      if (box) this.resize(box.width, box.height);
    });
    this.resizeObserver.observe(host);
  }

  /* ------------------------------------------------------------------ lights & ground */

  private buildLights() {
    // r155+ uses physical light units: the r128 values are scaled by π to keep the same exposure.
    const PI = Math.PI;
    const hemi = new THREE.HemisphereLight(this.p.ivory, this.p.leather, 0.7 * PI);
    const key = new THREE.DirectionalLight(this.p.ivory, 1.5 * PI);
    key.position.set(-3.4, 4.6, 3.6);
    key.castShadow = true;
    key.shadow.mapSize.set(1024, 1024);
    key.shadow.camera.near = 1;
    key.shadow.camera.far = 14;
    const d = 2.4;
    Object.assign(key.shadow.camera, { left: -d, right: d, top: d, bottom: -d });
    key.shadow.bias = -0.0005;
    key.shadow.camera.updateProjectionMatrix();
    const rim = new THREE.DirectionalLight(this.p.antique, 1.4 * PI);
    rim.position.set(2.4, 3.4, -3.2);
    const fill = new THREE.DirectionalLight(this.p.parch, 0.45 * PI);
    fill.position.set(2.8, 1.0, 3.4);
    this.scene.add(hemi, key, rim, fill);
  }

  private buildGround() {
    const floorY = -0.78;
    const shadow = new THREE.Mesh(new THREE.PlaneGeometry(14, 14), new THREE.ShadowMaterial({ opacity: 0.35 }));
    shadow.rotation.x = -Math.PI / 2;
    shadow.position.y = floorY;
    shadow.receiveShadow = true;
    this.groundGroup.add(shadow);
    const ring = (rx: number, rz: number, color: THREE.Color, opacity: number, lift: number) => {
      const pts = new THREE.EllipseCurve(0.06, 0, rx, rz, 0, Math.PI * 2, false, 0)
        .getPoints(120)
        .map((pp) => new THREE.Vector3(pp.x, floorY + lift, pp.y));
      return new THREE.LineLoop(
        new THREE.BufferGeometry().setFromPoints(pts),
        new THREE.LineBasicMaterial({ color, transparent: true, opacity }),
      );
    };
    this.groundGroup.add(ring(1.38, 0.32, this.p.brass, 0.55, 0.005), ring(1.05, 0.22, this.p.gold, 0.35, 0.006));
  }

  /* ------------------------------------------------------------------ textures */

  private canvasTexture(w: number, h: number, draw: (ctx: CanvasRenderingContext2D) => void) {
    const c = document.createElement("canvas");
    c.width = w;
    c.height = h;
    const ctx = c.getContext("2d");
    if (ctx) draw(ctx);
    const tex = new THREE.CanvasTexture(c);
    tex.colorSpace = THREE.SRGBColorSpace;
    this.textures.push(tex);
    return tex;
  }

  private css(c: THREE.Color, alpha = 1) {
    return `rgba(${Math.round(c.r * 255)}, ${Math.round(c.g * 255)}, ${Math.round(c.b * 255)}, ${alpha})`;
  }

  /* ------------------------------------------------------------------ horse */

  private buildHorse() {
    const { p } = this;
    this.root.add(this.pelvisRoot);
    this.pelvisRoot.add(this.thorax);
    this.thorax.add(this.coatGroup, this.skeletonGroup, this.muscleGroup, this.tackGroup, this.postureGroup, this.riderGroup);
    this.coatGroup.add(this.trunkGroup);

    // Dark bay: near-black points, a warm red-brown body (kala → bhanwar → surang).
    const bayLight = p.surang.clone().lerp(p.chestnut, 0.55);
    const coatTex = this.canvasTexture(512, 512, (ctx) => {
      const g = ctx.createLinearGradient(0, 0, 0, 512);
      g.addColorStop(0, this.css(p.kala));
      g.addColorStop(0.2, this.css(p.bhanwar));
      g.addColorStop(0.5, this.css(bayLight));
      g.addColorStop(0.82, this.css(p.surang));
      g.addColorStop(1, this.css(p.kala));
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, 512, 512);
    });
    const hairTex = this.canvasTexture(256, 256, (ctx) => {
      for (let s = 0; s < 48; s++) {
        const x0 = 16 + (s / 47) * 224;
        const hi = s % 5 === 0;
        const g = ctx.createLinearGradient(0, 0, 0, 256);
        g.addColorStop(0, this.css(hi ? p.bhanwar : p.kala, 0.96));
        g.addColorStop(0.65, this.css(hi ? p.bhanwar : p.kala, 0.86));
        g.addColorStop(1, this.css(p.kala, 0));
        ctx.strokeStyle = g;
        ctx.lineWidth = hi ? 2.2 : 3.2;
        ctx.beginPath();
        ctx.moveTo(x0, 0);
        ctx.quadraticCurveTo(x0 + Math.sin(s * 1.7) * 14, 128, x0 + Math.cos(s * 2.3) * 18, 252);
        ctx.stroke();
      }
    });

    const coatParams = { color: 0xffffff, map: coatTex, roughness: 0.4, metalness: 0.04, clearcoat: 0.3, clearcoatRoughness: 0.4 };
    const coatMat = new THREE.MeshPhysicalMaterial(coatParams);
    const farCoatMat = new THREE.MeshPhysicalMaterial({ ...coatParams, color: 0xb8b0a8 });
    const coreMat = new THREE.MeshStandardMaterial({ color: p.kala.clone().lerp(p.bhanwar, 0.5), roughness: 0.6 });
    const trunkMat = new THREE.MeshPhysicalMaterial({ ...coatParams, transparent: true, opacity: 0.55, depthWrite: false });
    trunkMat.onBeforeCompile = (shader) => {
      // Both chunks verified present in r186 meshphysical.glsl.js.
      shader.vertexShader =
        "varying vec3 vCustomWorldPos;\n" +
        shader.vertexShader.replace(
          "#include <worldpos_vertex>",
          "#include <worldpos_vertex>\nvCustomWorldPos = (modelMatrix * vec4(transformed, 1.0)).xyz;",
        );
      shader.fragmentShader =
        "varying vec3 vCustomWorldPos;\n" +
        shader.fragmentShader.replace(
          "#include <dithering_fragment>",
          `#include <dithering_fragment>
          if (diffuseColor.a < 0.96) {
            float dNeck = length((vCustomWorldPos.xy - vec2(-0.78, 0.52)) / vec2(0.32, 0.22));
            float dSh = length((vCustomWorldPos.xy - vec2(-0.48, 0.14)) / vec2(0.28, 0.34));
            float dSp = length((vCustomWorldPos.xy - vec2(0.06, 0.32)) / vec2(0.62, 0.24));
            float dPe = length((vCustomWorldPos.xy - vec2(0.60, 0.14)) / vec2(0.28, 0.34));
            float dW = min(min(dNeck, dSh), min(dSp, dPe));
            float mask = smoothstep(0.38, 1.05, dW);
            mask = max(mask, smoothstep(-0.02, -0.14, vCustomWorldPos.y));
            gl_FragColor.a = mix(diffuseColor.a * 0.38, 0.98, mask);
          }`,
        );
    };
    this.trunkMaterials.push(trunkMat);

    const pointsMat = new THREE.MeshStandardMaterial({ color: p.kala.clone().lerp(p.bhanwar, 0.4), roughness: 0.4, metalness: 0.05 });
    const hairMat = new THREE.MeshStandardMaterial({ color: 0xffffff, map: hairTex, roughness: 0.55, transparent: true, side: THREE.DoubleSide });
    const hoofMat = new THREE.MeshPhysicalMaterial({ color: p.leather.clone().lerp(p.kala, 0.3), roughness: 0.3, metalness: 0.1, clearcoat: 0.4 });

    // A. One continuous poll → neck → withers → barrel → loin → croup mesh.
    const bodyPts = [
      v3(-1.12, 0.72), v3(-0.96, 0.7), v3(-0.74, 0.58), v3(-0.52, 0.41), v3(-0.3, 0.44),
      v3(-0.02, 0.34), v3(0.28, 0.35), v3(0.56, 0.4), v3(0.8, 0.3), v3(0.94, 0.18),
    ];
    const bodyRz = [0.088, 0.105, 0.135, 0.23, 0.27, 0.3, 0.28, 0.28, 0.22, 0.1];
    const bodyRy = [0.115, 0.15, 0.205, 0.29, 0.35, 0.34, 0.3, 0.32, 0.25, 0.12];
    const bodyMod: ShapeMod = (u, _t, cosT, sinT) => {
      const neckCrest = u < 0.38 && cosT > 0.2 ? Math.sin((u / 0.38) * Math.PI) * Math.pow(cosT, 1.8) * 0.18 : 0;
      const chest = u > 0.26 && u < 0.5 && cosT < 0 ? Math.exp(-(((u - 0.37) / 0.08) ** 2)) * Math.pow(-cosT, 1.3) * 0.32 : 0;
      const shoulder = Math.exp(-(((u - 0.39) / 0.08) ** 2)) * Math.pow(Math.abs(sinT), 1.3) * 0.18;
      const haunch = Math.exp(-(((u - 0.84) / 0.09) ** 2)) * Math.pow(Math.abs(sinT), 1.3) * 0.2;
      const flank = u > 0.58 && u < 0.82 && cosT < 0 ? -Math.exp(-(((u - 0.7) / 0.08) ** 2)) * Math.pow(-cosT, 1.4) * 0.18 : 0;
      return { rzScale: 1 + shoulder + haunch, ryScale: 1 + neckCrest + chest + flank, yShift: flank * 0.05 - chest * 0.06 };
    };
    const core = loftMesh(bodyPts, bodyRz.map((r) => r * 0.16), bodyRy.map((r) => r * 0.96), 88, 28, coreMat, bodyMod);
    core.renderOrder = 1;
    this.thorax.add(core);
    const body = loftMesh(bodyPts, bodyRz, bodyRy, 96, 36, trunkMat, bodyMod);
    body.renderOrder = 6;
    this.trunkGroup.add(body);

    // B. Mane cards along the crest.
    const crest = new THREE.CatmullRomCurve3([v3(-1.1, 0.82), v3(-0.9, 0.84), v3(-0.68, 0.74), v3(-0.44, 0.58), v3(-0.28, 0.54)]);
    for (let m = 0; m < 38; m++) {
      const u = m / 37;
      const c = crest.getPointAt(u);
      const side = m % 2 === 0 ? 1 : -1;
      const card = loftMesh(
        [v3(c.x, c.y - 0.035), v3(c.x + 0.025, c.y + 0.032 * (1 - u * 0.3), side * 0.016), v3(c.x + 0.065, c.y - 0.025, side * 0.038)],
        [0.014, 0.018, 0.004], [0.024, 0.02, 0.006], 8, 8, hairMat,
      );
      card.renderOrder = 7;
      this.coatGroup.add(card);
    }

    // C. Head, eyes, nostrils, forelock, inward-curving lyre ears.
    this.head.position.set(-1.12, 0.72, 0);
    this.thorax.add(this.head);
    const headMesh = loftMesh(
      [v3(0.05, 0.04), v3(-0.04, -0.05), v3(-0.11, -0.16), v3(-0.17, -0.29), v3(-0.21, -0.41), v3(-0.22, -0.47)],
      [0.092, 0.106, 0.092, 0.066, 0.068, 0.044],
      [0.11, 0.13, 0.122, 0.084, 0.078, 0.048],
      44, 32, coatMat,
      (u, _t, cosT, sinT) => {
        const jowl = Math.exp(-(((u - 0.34) / 0.14) ** 2)) * (cosT < 0 ? Math.pow(-cosT, 0.8) * 0.3 : 0);
        const brow = Math.exp(-(((u - 0.22) / 0.07) ** 2)) * (cosT > 0.1 ? Math.abs(sinT) * 0.15 : 0);
        const nostril = Math.exp(-(((u - 0.86) / 0.06) ** 2)) * Math.abs(sinT) * 0.18;
        return { rzScale: 1 + brow + nostril + jowl * 0.3, ryScale: 1 + jowl, yShift: -jowl * 0.04 };
      },
    );
    headMesh.renderOrder = 7;
    this.head.add(headMesh);

    const eyeMat = new THREE.MeshPhysicalMaterial({ color: p.kala, roughness: 0.05, clearcoat: 1 });
    const glintMat = new THREE.MeshBasicMaterial({ color: p.ivory });
    const nostrilMat = new THREE.MeshStandardMaterial({ color: p.kala, roughness: 0.65 });
    for (const side of [-1, 1]) {
      const eyeGeo = new THREE.SphereGeometry(0.02, 16, 14);
      eyeGeo.scale(1.1, 0.95, 0.85);
      const eye = new THREE.Mesh(eyeGeo, eyeMat);
      eye.position.set(-0.08, -0.068, side * 0.092);
      const glint = new THREE.Mesh(new THREE.SphereGeometry(0.0045, 8, 8), glintMat);
      glint.position.set(-0.086, -0.062, side * 0.104);
      const nGeo = new THREE.SphereGeometry(0.018, 14, 12);
      nGeo.scale(1.2, 0.85, 0.65);
      const nostril = new THREE.Mesh(nGeo, nostrilMat);
      nostril.position.set(-0.212, -0.405, side * 0.052);
      this.head.add(eye, glint, nostril);
    }
    for (let f = -2; f <= 2; f++) {
      const fl = loftMesh([v3(0.01, 0.06, f * 0.011), v3(-0.04, 0.01, f * 0.014), v3(-0.1, -0.07, f * 0.015)], [0.008, 0.01, 0.003], [0.018, 0.015, 0.005], 8, 6, hairMat);
      fl.renderOrder = 8;
      this.head.add(fl);
    }
    const ear = (side: number) => {
      const g = new THREE.Group();
      g.position.set(0.015, 0.055, side * 0.06);
      g.add(
        loftMesh(
          [v3(0, 0), v3(-0.016, 0.05, side * 0.02), v3(-0.028, 0.105, side * 0.005), v3(-0.038, 0.148, -side * 0.034), v3(-0.04, 0.165, -side * 0.048)],
          [0.019, 0.025, 0.019, 0.009, 0.0025], [0.017, 0.021, 0.015, 0.007, 0.0025], 20, 16, pointsMat,
        ),
      );
      return g;
    };
    this.leftEar = ear(1);
    this.rightEar = ear(-1);
    this.head.add(this.leftEar, this.rightEar);

    // D. Tail.
    this.tail.position.set(0.92, 0.19, 0);
    this.thorax.add(this.tail);
    for (let s = 0; s < 26; s++) {
      const spread = s / 25;
      const zOff = ((s % 7) - 3) * 0.02;
      const xFan = (spread - 0.35) * 0.18;
      const yLen = -0.72 - (s % 4) * 0.05;
      const card = loftMesh(
        [v3(0, 0, zOff * 0.2), v3(0.09 + xFan * 0.25, -0.14, zOff * 0.5), v3(0.16 + xFan * 0.55, -0.38, zOff * 0.9), v3(0.22 + xFan * 0.85, yLen * 0.82, zOff * 1.2), v3(0.27 + xFan * 1.15, yLen, zOff * 1.4)],
        [0.016, 0.024, 0.028, 0.02, 0.004], [0.016, 0.013, 0.01, 0.006, 0.002], 24, 10, hairMat,
      );
      card.renderOrder = 7;
      this.tail.add(card);
    }

    // E. Four continuous limbs, re-lofted each frame from a joint chain.
    const limb = (isFore: boolean, near: boolean, zOffset: number): Limb => {
      const geo = new THREE.BufferGeometry();
      const mesh = new THREE.Mesh(geo, near ? coatMat : farCoatMat);
      mesh.castShadow = true;
      mesh.receiveShadow = true;
      mesh.renderOrder = 2;
      const hoofGeo = new THREE.BufferGeometry();
      const hoof = new THREE.Mesh(hoofGeo, hoofMat);
      hoof.castShadow = true;
      hoof.renderOrder = near ? 7 : 2;
      this.coatGroup.add(mesh, hoof);
      return {
        isFore, zOffset, geo, hoofGeo,
        radiiZ: isFore ? [0.085, 0.078, 0.055, 0.046, 0.035, 0.04, 0.033, 0.04] : [0.105, 0.092, 0.064, 0.05, 0.036, 0.042, 0.034, 0.041],
        radiiY: isFore ? [0.105, 0.092, 0.062, 0.052, 0.039, 0.045, 0.036, 0.042] : [0.13, 0.112, 0.076, 0.06, 0.042, 0.048, 0.038, 0.044],
      };
    };
    this.limbs = { fl: limb(true, true, 0.135), fr: limb(true, false, -0.135), hl: limb(false, true, 0.135), hr: limb(false, false, -0.135) };

    // F. Tack: close-contact saddle, girth, bridle, reins.
    const saddleMat = new THREE.MeshPhysicalMaterial({ color: p.leather.clone().lerp(p.chestnut, 0.35), roughness: 0.36, metalness: 0.05, clearcoat: 0.35 });
    const strapMat = new THREE.MeshStandardMaterial({ color: p.leather.clone().lerp(p.kala, 0.5), roughness: 0.42, metalness: 0.1 });
    const brassMat = new THREE.MeshStandardMaterial({ color: p.antique, roughness: 0.25, metalness: 0.85 });
    const seat = loftMesh(
      [v3(SEAT.x - 0.17, SEAT.y + 0.06), v3(SEAT.x - 0.03, SEAT.y - 0.005), v3(SEAT.x + 0.12, SEAT.y + 0.005), v3(SEAT.x + 0.23, SEAT.y + 0.06)],
      [0.13, 0.17, 0.17, 0.13], [0.03, 0.03, 0.032, 0.028], 24, 20, saddleMat,
    );
    seat.renderOrder = 8;
    this.tackGroup.add(seat);
    for (const side of [-1, 1]) {
      const flap = loftMesh(
        [v3(-0.04, SEAT.y - 0.04, side * 0.24), v3(-0.05, SEAT.y - 0.2, side * 0.31), v3(-0.03, SEAT.y - 0.36, side * 0.3)],
        [0.014, 0.018, 0.012], [0.115, 0.145, 0.095], 18, 16, saddleMat,
      );
      flap.renderOrder = 8;
      const girth = new THREE.Mesh(
        new THREE.TubeGeometry(new THREE.CatmullRomCurve3([v3(-0.08, 0.2, side * 0.3), v3(-0.1, 0.05, side * 0.27), v3(-0.1, -0.12, 0)]), 14, 0.018, 10, false),
        strapMat,
      );
      girth.renderOrder = 8;
      this.tackGroup.add(flap, girth);
    }
    const tube = (pts: THREE.Vector3[], r: number, mat: THREE.Material, segs = 20) => {
      const m = new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), segs, r, 8, false), mat);
      m.renderOrder = 8;
      return m;
    };
    this.head.add(
      tube([v3(-0.228, -0.275, -0.056), v3(-0.242, -0.268, 0), v3(-0.228, -0.275, 0.056), v3(-0.145, -0.325, 0.064), v3(-0.132, -0.335, 0), v3(-0.145, -0.325, -0.064), v3(-0.228, -0.275, -0.056)], 0.007, saddleMat, 28),
      tube([v3(-0.005, 0.015, -0.085), v3(-0.065, -0.005, -0.095), v3(-0.092, -0.012, 0), v3(-0.065, -0.005, 0.095), v3(-0.005, 0.015, 0.085)], 0.0065, brassMat),
      tube([v3(0.01, 0.025, -0.082), v3(-0.02, -0.175, -0.092), v3(-0.028, -0.205, 0), v3(-0.02, -0.175, 0.092), v3(0.01, 0.025, 0.082)], 0.006, saddleMat),
    );
    for (const side of [-1, 1]) {
      this.head.add(tube([v3(0.015, 0.03, side * 0.082), v3(-0.095, -0.16, side * 0.088), v3(-0.198, -0.39, side * 0.072)], 0.007, saddleMat, 16));
      const bit = new THREE.Mesh(new THREE.TorusGeometry(0.024, 0.0045, 12, 24), brassMat);
      bit.position.set(-0.202, -0.41, side * 0.074);
      this.head.add(bit);
    }
    this.reinMat = saddleMat;
    this.brassMat = brassMat;
    this.strapMat = strapMat;
  }

  private reinMat!: THREE.MeshPhysicalMaterial;
  private brassMat!: THREE.MeshStandardMaterial;
  private strapMat!: THREE.MeshStandardMaterial;

  /* ------------------------------------------------------------------ rider */

  private buildRider() {
    const { p } = this;
    const mk = (color: THREE.Color, roughness = 0.6) => {
      const m = new THREE.MeshStandardMaterial({ color, roughness, metalness: 0.02, transparent: true, opacity: 1 });
      this.riderMaterials.push(m);
      return m;
    };
    const jacket = mk(p.caramel.clone().lerp(p.chestnut, 0.25), 0.7);
    const breeches = mk(p.parch, 0.75);
    const boots = mk(p.kala.clone().lerp(p.bhanwar, 0.4), 0.35);
    const skin = mk(p.caramel.clone().lerp(p.parch, 0.35), 0.6);
    const helmet = mk(p.kala.clone().lerp(p.leather, 0.3), 0.3);

    const g = this.riderGroup;
    g.position.copy(SEAT);
    const add = (m: THREE.Mesh) => {
      m.renderOrder = 9;
      g.add(m);
      return m;
    };
    // Torso: seat → ribcage → shoulders, upright and stacked.
    add(loftMesh([v3(0.02, 0.0), v3(0.01, 0.14), v3(-0.0, 0.3), v3(-0.02, 0.42)], [0.12, 0.11, 0.13, 0.1], [0.07, 0.075, 0.08, 0.05], 24, 20, jacket));
    add(loftMesh([v3(-0.02, 0.4), v3(-0.025, 0.47)], [0.035, 0.035], [0.035, 0.035], 6, 12, skin));
    const headMesh = add(new THREE.Mesh(new THREE.SphereGeometry(0.068, 24, 18), skin));
    headMesh.position.set(-0.035, 0.53, 0);
    headMesh.scale.set(1, 1.12, 0.92);
    const helm = add(new THREE.Mesh(new THREE.SphereGeometry(0.076, 24, 14, 0, Math.PI * 2, 0, Math.PI * 0.55), helmet));
    helm.position.set(-0.03, 0.545, 0);
    const peak = add(new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.055, 0.008, 18, 1, false, Math.PI * 0.5, Math.PI), helmet));
    peak.position.set(-0.075, 0.56, 0);
    peak.rotation.z = -0.25;

    for (const side of [-1, 1]) {
      // Thigh wraps the barrel, knee on the flap, heel under the hip.
      add(loftMesh([v3(0.0, 0.03, side * 0.1), v3(-0.07, -0.04, side * 0.25), v3(-0.13, -0.2, side * 0.32)], [0.06, 0.055, 0.045], [0.06, 0.055, 0.045], 16, 14, breeches));
      add(loftMesh([v3(-0.13, -0.2, side * 0.32), v3(-0.08, -0.38, side * 0.33), v3(-0.03, -0.52, side * 0.33)], [0.045, 0.04, 0.034], [0.045, 0.04, 0.034], 14, 12, boots));
      add(loftMesh([v3(-0.03, -0.53, side * 0.33), v3(-0.09, -0.56, side * 0.33)], [0.03, 0.026], [0.024, 0.02], 8, 10, boots));
      // Stirrup leather and iron under the ball of the foot.
      const leather = new THREE.Mesh(new THREE.TubeGeometry(new THREE.LineCurve3(v3(-0.02, -0.06, side * 0.27), v3(-0.06, -0.54, side * 0.335)), 6, 0.008, 6, false), this.strapMat);
      const iron = new THREE.Mesh(new THREE.TorusGeometry(0.04, 0.006, 10, 20, Math.PI * 1.15), this.brassMat);
      iron.position.set(-0.06, -0.57, side * 0.335);
      iron.rotation.z = Math.PI * 0.92;
      g.add(leather, iron);
      // Arms: elbows soft at the hip, hands low over the withers.
      add(loftMesh([v3(-0.02, 0.4, side * 0.13), v3(-0.05, 0.27, side * 0.15), v3(-0.07, 0.17, side * 0.14)], [0.032, 0.03, 0.028], [0.032, 0.03, 0.028], 12, 10, jacket));
      add(loftMesh([v3(-0.07, 0.17, side * 0.14), v3(-0.15, 0.13, side * 0.1), v3(-0.21, 0.12, side * 0.07)], [0.026, 0.024, 0.022], [0.026, 0.024, 0.022], 12, 10, jacket));
      const hand = add(new THREE.Mesh(new THREE.SphereGeometry(0.025, 12, 10), skin));
      hand.position.set(-0.23, 0.12, side * 0.065);
      // Rein from the bit ring to the hand (thorax space).
      const handT = v3(SEAT.x - 0.23, SEAT.y + 0.12, side * 0.065);
      const bitT = v3(-1.12 - 0.202, 0.72 - 0.41, side * 0.074);
      const rein = new THREE.Mesh(
        new THREE.TubeGeometry(new THREE.CatmullRomCurve3([bitT, v3(-0.95, 0.42, side * 0.12), v3(-0.55, 0.66, side * 0.12), handT]), 32, 0.0065, 8, false),
        this.reinMat,
      );
      rein.renderOrder = 8;
      this.tackGroup.add(rein);
    }
  }

  /* ------------------------------------------------------------------ skeleton */

  private buildSkeleton() {
    const boneMat = new THREE.MeshPhysicalMaterial({
      color: this.p.ivory.clone().lerp(this.p.caramel, 0.3), emissive: this.p.brass, emissiveIntensity: 0.06, roughness: 0.55, clearcoat: 0.1, transparent: true, opacity: 0.88,
    });
    const add = (m: THREE.Mesh) => {
      m.renderOrder = 3;
      this.skeletonGroup.add(m);
    };
    const spinePts = [v3(-1.1, 0.7), v3(-0.92, 0.64), v3(-0.72, 0.51), v3(-0.52, 0.36), v3(-0.3, 0.39), v3(-0.02, 0.32), v3(0.28, 0.33), v3(0.54, 0.36), v3(0.78, 0.29)];
    const spineCurve = new THREE.CatmullRomCurve3(spinePts);
    const nearPts = spinePts.map((q) => v3(q.x, q.y, 0.08));
    const nearCurve = new THREE.CatmullRomCurve3(nearPts);
    add(loftMesh(nearPts, [0.022, 0.024, 0.026, 0.028, 0.026, 0.025, 0.025, 0.026, 0.02], [0.024, 0.026, 0.028, 0.03, 0.028, 0.025, 0.025, 0.026, 0.02], 64, 14, boneMat));

    const vBodyGeo = populateLoftGeo([v3(-0.016, 0), v3(0, 0), v3(0.016, 0)], [0.024, 0.036, 0.024], [0.024, 0.032, 0.024], 6, 10);
    for (let i = 0; i < 30; i++) {
      const u = i / 29;
      const q = nearCurve.getPointAt(u);
      const t = nearCurve.getTangentAt(u);
      const vg = new THREE.Group();
      vg.position.copy(q);
      const vb = new THREE.Mesh(vBodyGeo, boneMat);
      vb.renderOrder = 3;
      vg.add(vb);
      let h = 0.038;
      if (u > 0.32 && u < 0.56) h = 0.04 + Math.sin(((u - 0.32) / 0.24) * Math.PI) * 0.072;
      else if (u >= 0.56) h = 0.042;
      const proc = loftMesh([v3(0, 0.01), v3(-0.006, h * 0.6), v3(-0.01, h)], [0.009, 0.007, 0.005], [0.012, 0.01, 0.007], 6, 8, boneMat);
      proc.renderOrder = 3;
      vg.add(proc);
      vg.rotation.z = Math.atan2(t.y, t.x);
      this.skeletonGroup.add(vg);
    }
    for (let r = 0; r < 14; r++) {
      const sp = spineCurve.getPointAt(0.37 + (r / 13) * 0.35);
      const drop = 0.26 * Math.sin(((r + 2) / 16) * Math.PI);
      const out = 0.1 + 0.11 * Math.sin(((r + 1.5) / 15) * Math.PI);
      for (const side of [-1, 1]) {
        add(loftMesh([v3(sp.x, sp.y - 0.01, side * 0.02), v3(sp.x + 0.02, sp.y - drop * 0.46, side * out), v3(sp.x - 0.015, sp.y - drop, side * out * 0.52)], [0.006, 0.01, 0.005], [0.009, 0.012, 0.007], 14, 10, boneMat));
      }
    }
    for (const side of [-1, 1]) {
      add(loftMesh([v3(-0.32, 0.38, side * 0.1), v3(-0.44, 0.24, side * 0.14), v3(-0.54, 0.11, side * 0.13)], [0.014, 0.018, 0.026], [0.085, 0.06, 0.036], 16, 14, boneMat));
      add(loftMesh([v3(-0.54, 0.11, side * 0.13), v3(-0.48, 0.03, side * 0.13), v3(-0.43, -0.05, side * 0.125)], [0.03, 0.022, 0.028], [0.035, 0.026, 0.032], 14, 12, boneMat));
      add(loftMesh([v3(0.52, 0.37, side * 0.09), v3(0.62, 0.19, side * 0.14), v3(0.8, 0.17, side * 0.11)], [0.022, 0.03, 0.02], [0.075, 0.052, 0.042], 16, 14, boneMat));
      add(loftMesh([v3(0.62, 0.19, side * 0.14), v3(0.57, 0.07, side * 0.14), v3(0.53, -0.04, side * 0.135)], [0.035, 0.026, 0.032], [0.04, 0.03, 0.036], 14, 12, boneMat));
      add(loftMesh([v3(-0.43, -0.05, side * 0.125), v3(-0.46, -0.14, side * 0.125), v3(-0.5, -0.22, side * 0.125)], [0.026, 0.018, 0.022], [0.03, 0.022, 0.026], 12, 10, boneMat));
      add(loftMesh([v3(0.53, -0.04, side * 0.135), v3(0.6, -0.14, side * 0.135), v3(0.67, -0.24, side * 0.135)], [0.028, 0.02, 0.024], [0.032, 0.024, 0.028], 12, 10, boneMat));
    }
  }

  /* ------------------------------------------------------------------ muscles */

  private buildMuscles() {
    const { p } = this;
    const deep = p.chestnut.clone().lerp(p.bhanwar, 0.35);
    const tex = this.canvasTexture(256, 256, (ctx) => {
      const g = ctx.createLinearGradient(0, 0, 256, 0);
      g.addColorStop(0, this.css(p.parch));
      g.addColorStop(0.14, this.css(p.chestnut));
      g.addColorStop(0.5, this.css(deep));
      g.addColorStop(0.86, this.css(p.chestnut));
      g.addColorStop(1, this.css(p.parch));
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, 256, 256);
      for (let i = 0; i < 110; i++) {
        ctx.strokeStyle = i % 2 === 0 ? this.css(p.caramel, 0.3) : this.css(p.kala, 0.35);
        ctx.lineWidth = 1.8;
        const y = (i / 110) * 256;
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.bezierCurveTo(85, y + 6, 170, y - 6, 256, y);
        ctx.stroke();
      }
    });
    const bundle = (pts: THREE.Vector3[], rz: number[], ry: number[], region: MuscleRegion) => {
      const mat = new THREE.MeshPhysicalMaterial({ color: 0xffffff, map: tex, emissive: p.antique, emissiveIntensity: 0, roughness: 0.45, clearcoat: 0.2, transparent: true, opacity: 0.84 });
      for (const side of [-1, 1]) {
        const mesh = loftMesh(pts.map((q) => v3(q.x, q.y, q.z * side)), rz, ry, 28, 18, mat);
        mesh.renderOrder = 4;
        this.muscleGroup.add(mesh);
        this.muscles.push({ mesh, region, mat });
      }
    };
    bundle([v3(-0.96, 0.65, 0.05), v3(-0.72, 0.54, 0.08), v3(-0.48, 0.38, 0.12)], [0.024, 0.04, 0.044], [0.04, 0.068, 0.075], "poll_cervical");
    bundle([v3(-0.33, 0.37, 0.11), v3(-0.46, 0.21, 0.16), v3(-0.49, 0.02, 0.14)], [0.03, 0.052, 0.04], [0.062, 0.098, 0.072], "withers_thorax");
    bundle([v3(-0.24, 0.32, 0.12), v3(0.06, 0.27, 0.17), v3(0.42, 0.31, 0.15)], [0.036, 0.05, 0.042], [0.055, 0.085, 0.065], "thoracolumbar");
    bundle([v3(0.52, 0.35, 0.11), v3(0.66, 0.21, 0.16), v3(0.62, 0.01, 0.14)], [0.04, 0.058, 0.04], [0.072, 0.108, 0.075], "lumbosacral_pelvis");
  }

  /* ------------------------------------------------------------------ posture lines */

  private buildPostureLines() {
    const line = (pts: THREE.Vector3[], radius: number, index: number) => {
      const uniforms = {
        uTime: { value: 0 },
        uIntensity: { value: 1 },
        uBase: { value: this.p.gold.clone() },
        uPulse: { value: this.p.ivory.clone() },
      };
      this.pulseUniforms[index] = uniforms;
      const mat = new THREE.ShaderMaterial({
        uniforms,
        transparent: true,
        depthTest: false,
        vertexShader: /* glsl */ `
          varying vec2 vUv;
          void main() { vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }`,
        fragmentShader: /* glsl */ `
          uniform float uTime; uniform float uIntensity; uniform vec3 uBase; uniform vec3 uPulse;
          varying vec2 vUv;
          void main() {
            float w = exp(-pow(fract(vUv.x - uTime * 0.22) - 0.5, 2.0) * 40.0);
            vec3 c = mix(uBase, uPulse, w * 0.6);
            gl_FragColor = vec4(c, (0.82 + 0.18 * w) * uIntensity);
            #include <colorspace_fragment>
          }`,
      });
      const mesh = new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), 80, radius, 10, false), mat);
      mesh.renderOrder = 10;
      this.postureGroup.add(mesh);
    };
    // Rider: seat bones → lumbar → ribcage → cervical → crown.
    const s = SEAT;
    line([v3(s.x + 0.02, s.y + 0.0), v3(s.x + 0.015, s.y + 0.14), v3(s.x, s.y + 0.3), v3(s.x - 0.025, s.y + 0.46), v3(s.x - 0.035, s.y + 0.6)], 0.008, 0);
    // Horse: poll → crest → withers → back → loin → croup → dock.
    line([v3(-1.1, 0.8), v3(-0.9, 0.8), v3(-0.6, 0.68), v3(-0.3, 0.74), v3(0.0, 0.64), v3(0.28, 0.62), v3(0.56, 0.68), v3(0.86, 0.48)], 0.008, 1);
  }


  /* ------------------------------------------------------------------ kinematics */

  private limbPose(l: Limb, a1In: number, kneeAngle: number, cannonAngle: number, pastern: number) {
    const z = l.zOffset;
    const fore = l.isFore;
    const p0 = fore ? v3(-0.47, 0.1, z * 0.85) : v3(0.58, 0.1, z * 0.85);
    const p1 = fore ? v3(-0.5, 0.02, z * 0.95) : v3(0.61, 0.02, z * 0.95);
    const a1 = fore ? a1In : a1In + 0.22;
    const L1 = fore ? 0.22 : 0.23;
    const jX = p1.x + Math.sin(a1) * L1;
    const jY = p1.y - Math.cos(a1) * L1;
    const p2 = v3((p1.x + jX) * 0.5 + (fore ? 0.01 : -0.01), (p1.y + jY) * 0.5, z);
    const p3 = v3(jX, jY, z);
    const a2 = fore ? a1 + kneeAngle : a1In + kneeAngle - 0.05;
    const L2 = fore ? 0.24 : 0.26;
    const fX = jX + Math.sin(a2) * L2;
    const fY = jY - Math.cos(a2) * L2;
    const p4 = v3((jX + fX) * 0.5, (jY + fY) * 0.5, z);
    const p5 = v3(fX, fY, z);
    const a3 = a2 + cannonAngle - (fore ? 0.32 : 0.3);
    const cX = fX + Math.sin(a3) * 0.095;
    const cY = fY - Math.cos(a3) * 0.095;
    const p6 = v3((fX + cX) * 0.5, (fY + cY) * 0.5, z);
    const p7 = v3(cX, cY, z);
    populateLoft(l.geo, [p0, p1, p2, p3, p4, p5, p6, p7], l.radiiZ, l.radiiY, 36, 20);
    const ah = a3 + pastern;
    const rz = fore ? [0.042, 0.052, 0.06] : [0.043, 0.053, 0.061];
    const ry = fore ? [0.045, 0.055, 0.064] : [0.046, 0.056, 0.065];
    populateLoft(l.hoofGeo, [v3(cX, cY + 0.01, z), v3(cX + Math.sin(ah) * 0.04, cY - Math.cos(ah) * 0.04, z), v3(cX + Math.sin(ah) * 0.075, cY - Math.cos(ah) * 0.075, z)], rz, ry, 10, 16);
  }

  /** Standing exhibition pose: near fore lifted, the other three grounded. */
  private standPose() {
    const L = this.limbs;
    if (!L) return;
    this.limbPose(L.fl, -0.45, 0.82, 0.55, 0.2);
    this.limbPose(L.fr, 0.03, 0, 0, 0);
    this.limbPose(L.hl, -0.22, 0.14, 0.06, 0);
    this.limbPose(L.hr, 0.14, -0.06, 0.04, 0);
  }

  private gaitPose(phase: number) {
    const L = this.limbs;
    if (!L) return;
    const g = GAITS[this.gait];
    const p = ((phase % 1) + 1) % 1;
    let fl: number, fr: number, hl: number, hr: number;
    if (this.gait === "walk") [hl, fl, hr, fr] = [p, (p + 0.25) % 1, (p + 0.5) % 1, (p + 0.75) % 1];
    else if (this.gait === "trot") [fl, hr, fr, hl] = [p, p, (p + 0.5) % 1, (p + 0.5) % 1];
    else [hr, hl, fr, fl] = [p, (p + 0.32) % 1, (p + 0.34) % 1, (p + 0.64) % 1];
    const fore = (l: Limb, lp: number) => {
      const a = lp * Math.PI * 2;
      const lift = Math.max(0, Math.cos(a));
      this.limbPose(l, -Math.sin(a) * g.strideAmp, lift * g.liftAmp * 1.6, lift * g.liftAmp * 0.9, lift * 0.25);
    };
    const hind = (l: Limb, lp: number) => {
      const a = lp * Math.PI * 2;
      const lift = Math.max(0, Math.cos(a));
      this.limbPose(l, -Math.sin(a) * g.strideAmp * 0.85, lift * g.liftAmp * 1.1, lift * g.liftAmp * 0.8, lift * 0.25);
    };
    fore(L.fl, fl);
    fore(L.fr, fr);
    hind(L.hl, hl);
    hind(L.hr, hr);
  }

  /** Body, head, ears and tail for the current stride phase and idle time. */
  private pose(t: number) {
    const tau = Math.PI * 2;
    const p = ((this.stridePhase % 1) + 1) % 1;
    const g = GAITS[this.gait];
    const idle = this.reduced ? 0 : 1;
    if (this.playing) this.gaitPose(p);
    else if (!this.posed) {
      this.standPose();
      this.posed = true;
    }
    const moving = this.playing;
    const bounce = moving ? Math.sin(p * tau * (this.gait === "canter" ? 1 : 2)) * g.spineWaveAmp : 0;
    this.thorax.position.y = bounce + Math.sin(t * 1.9) * 0.005 * idle;
    this.thorax.rotation.z = moving ? Math.cos(p * tau) * (this.gait === "canter" ? 0.042 : 0.012) : Math.sin(t * 0.9) * 0.0025 * idle;
    const nod = moving ? Math.sin(p * tau * (this.gait === "trot" ? 2 : 1)) * g.headNodAmp : Math.sin(t * 1.3) * 0.008 * idle;
    this.head.rotation.z = -nod * 0.65;
    const ear = Math.sin(t * 2.3) * 0.06 * idle;
    this.leftEar.rotation.y = ear;
    this.rightEar.rotation.y = -ear;
    this.tail.rotation.z = 0.05 + Math.sin(t * 1.8 + p * tau) * (moving ? 0.1 : 0.022) * (moving ? 1 : idle);
  }

  /* ------------------------------------------------------------------ public API */

  setMode(mode: ViewMode) {
    this.applyMode(mode, this.reduced);
  }

  private applyMode(mode: ViewMode, immediate: boolean) {
    this.mode = mode;
    const trunk = { coat: 1, bone: 0.28, muscle: 0.3, posture: 0.5 }[mode];
    this.skeletonGroup.visible = mode === "bone" || mode === "muscle" || mode === "posture";
    this.muscleGroup.visible = mode === "muscle";
    this.postureGroup.visible = mode === "posture";
    this.trunkTarget = trunk;
    this.riderTarget = mode === "coat" ? 1 : 0.62;
    for (const m of this.trunkMaterials) m.depthWrite = mode === "coat";
    for (const m of this.riderMaterials) m.depthWrite = mode === "coat";
    if (immediate) {
      this.trunkOpacity = trunk;
      this.riderOpacity = this.riderTarget;
      this.syncOpacity();
    }
    this.dirty = true;
  }

  private syncOpacity() {
    for (const m of this.trunkMaterials) m.opacity = this.trunkOpacity;
    for (const m of this.riderMaterials) m.opacity = this.riderOpacity;
  }

  setRegions(regions: readonly MuscleRegion[]) {
    for (const { region, mat } of this.muscles) {
      const on = regions.includes(region);
      mat.emissiveIntensity = on ? 0.14 : 0;
      mat.opacity = on ? 0.96 : 0.3;
    }
    this.dirty = true;
  }

  setConnection(index: number, zoom: boolean, immediate = false) {
    this.connection = ((index % CONNECTION_FRAMES.length) + CONNECTION_FRAMES.length) % CONNECTION_FRAMES.length;
    this.zoomed = zoom;
    const f = CONNECTION_FRAMES[this.connection];
    this.pulseUniforms.forEach((u, i) => (u.uIntensity.value = f.pulse[i] ?? 1));
    this.frameCamera(immediate || this.reduced);
  }

  resetView() {
    this.zoomed = false;
    this.frameCamera(this.reduced);
  }

  setGait(gait: GaitKey) {
    this.gait = gait;
    if (!this.playing) {
      // A still frame of the chosen gait, mid-stride.
      this.stridePhase = 0.15;
      this.gaitPose(this.stridePhase);
      this.posed = true;
    }
    this.dirty = true;
  }

  setPlaying(playing: boolean) {
    this.playing = playing;
    this.dirty = true;
  }

  setReducedMotion(reduced: boolean) {
    this.reduced = reduced;
    this.dirty = true;
  }

  /** Start or stop the render loop (off-screen, hidden tab). */
  setActive(active: boolean) {
    if (active === this.running || this.disposed) return;
    this.running = active;
    if (active) {
      this.last = performance.now();
      this.dirty = true;
      this.raf = requestAnimationFrame(this.tick);
    } else {
      cancelAnimationFrame(this.raf);
    }
  }

  dispose() {
    this.disposed = true;
    this.setActive(false);
    this.resizeObserver.disconnect();
    this.controls?.dispose();
    const geos = new Set<THREE.BufferGeometry>();
    const mats = new Set<THREE.Material>();
    this.scene.traverse((o) => {
      const m = o as THREE.Mesh;
      if (m.geometry) geos.add(m.geometry);
      if (m.material) (Array.isArray(m.material) ? m.material : [m.material]).forEach((x) => mats.add(x));
    });
    geos.forEach((g) => g.dispose());
    mats.forEach((m) => m.dispose());
    this.textures.forEach((t) => t.dispose());
    this.renderer.dispose();
    this.renderer.forceContextLoss();
    this.canvas.remove();
  }

  /* ------------------------------------------------------------------ camera */

  private resize(width: number, height: number) {
    if (width < 2 || height < 2) return;
    this.width = width;
    this.height = height;
    this.renderer.setSize(width, height, false);
    this.camera.aspect = width / height;
    this.camera.fov = width < 768 ? 30 : 28;
    const tanHalf = Math.tan((this.camera.fov * Math.PI) / 360);
    // Fit the horse, rider and floor ring with a margin.
    const reqW = width < 768 ? 2.72 : 3.1;
    const reqH = 2.3;
    this.base.distance = Math.max(reqW / 2 / (this.camera.aspect * tanHalf), reqH / 2 / tanHalf);
    this.base.target.set(-0.08, 0.13);
    this.camera.updateProjectionMatrix();
    this.frameCamera(true);
  }

  private frameCamera(immediate: boolean) {
    const f = CONNECTION_FRAMES[this.connection];
    const tx = this.zoomed ? f.target[0] : this.base.target.x;
    const ty = this.zoomed ? f.target[1] : this.base.target.y;
    const dist = this.base.distance * (this.zoomed ? f.distance : 1);
    // A slight three-quarter view from the near (left) side, a touch above the withers.
    const az = -0.2, el = 0.07;
    const toT = new THREE.Vector3(tx, ty, 0);
    const to = new THREE.Vector3(tx + Math.sin(az) * Math.cos(el) * dist, ty + Math.sin(el) * dist, Math.cos(az) * Math.cos(el) * dist);
    if (immediate) {
      this.tween = null;
      this.camera.position.copy(to);
      this.camera.lookAt(toT);
      if (this.controls) {
        this.controls.target.copy(toT);
        this.controls.update();
      }
    } else {
      const fromT = this.controls ? this.controls.target.clone() : this.lookTarget.clone();
      this.tween = { from: this.camera.position.clone(), fromT, to, toT, t0: performance.now(), dur: 1100 };
    }
    this.lookTarget.copy(toT);
    this.dirty = true;
  }

  private lookTarget = new THREE.Vector3();

  /* ------------------------------------------------------------------ loop */

  private tmp = new THREE.Vector3();
  private idleFrame = 0;

  private project(local: THREE.Vector3): PinPoint {
    this.tmp.copy(local);
    this.thorax.localToWorld(this.tmp);
    this.tmp.project(this.camera);
    return {
      x: (this.tmp.x * 0.5 + 0.5) * this.width,
      y: (-this.tmp.y * 0.5 + 0.5) * this.height,
      visible: this.tmp.z < 1 && Math.abs(this.tmp.x) < 1.05 && Math.abs(this.tmp.y) < 1.05,
    };
  }

  private tick = (now: number) => {
    if (!this.running) return;
    this.raf = requestAnimationFrame(this.tick);
    const dt = Math.min(0.05, (now - this.last) / 1000);
    this.last = now;
    const animating = !this.reduced || this.playing || !!this.tween || this.trunkOpacity !== this.trunkTarget || this.riderOpacity !== this.riderTarget;
    if (!this.reduced || this.playing) this.elapsed += dt;

    if (this.playing) this.stridePhase = (this.stridePhase + dt * GAITS[this.gait].speed * 0.45) % 1;
    if (animating) this.pose(this.elapsed);

    // Ease trunk and rider opacity between modes.
    const k = this.reduced ? 1 : 1 - Math.exp(-dt * 7);
    this.trunkOpacity += (this.trunkTarget - this.trunkOpacity) * k;
    this.riderOpacity += (this.riderTarget - this.riderOpacity) * k;
    if (Math.abs(this.trunkOpacity - this.trunkTarget) < 0.004) this.trunkOpacity = this.trunkTarget;
    if (Math.abs(this.riderOpacity - this.riderTarget) < 0.004) this.riderOpacity = this.riderTarget;
    this.syncOpacity();

    if (this.tween) {
      const tw = this.tween;
      const t = Math.min(1, (now - tw.t0) / tw.dur);
      const e = houseEase(t);
      this.camera.position.lerpVectors(tw.from, tw.to, e);
      const target = this.tmp.lerpVectors(tw.fromT, tw.toT, e);
      if (this.controls) this.controls.target.copy(target);
      else this.camera.lookAt(target);
      if (t >= 1) this.tween = null;
    }
    if (this.controls) this.controls.update();

    if (!this.reduced) for (const u of this.pulseUniforms) u.uTime.value = this.elapsed;

    if (animating || this.dirty) {
      // Idle sway only (nothing playing, tweening or fading, no input): render every other frame.
      const idleOnly = !this.dirty && !this.playing && !this.tween && this.trunkOpacity === this.trunkTarget && this.riderOpacity === this.riderTarget;
      this.idleFrame = (this.idleFrame + 1) % 2;
      if (idleOnly && this.idleFrame === 1) return;
      this.renderer.render(this.scene, this.camera);
      this.dirty = false;
      const f = CONNECTION_FRAMES[this.connection];
      this.onPins?.({ rider: this.project(f.riderAnchor), horse: this.project(f.horseAnchor), width: this.width, height: this.height });
    }
  };
}

function populateLoftGeo(pts: THREE.Vector3[], rz: number[], ry: number[], t: number, r: number) {
  return populateLoft(new THREE.BufferGeometry(), pts, rz, ry, t, r);
}
