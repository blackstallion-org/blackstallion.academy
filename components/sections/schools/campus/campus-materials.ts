import * as THREE from "three";

/**
 * Materials, textures and the lighting environment of the campus scale model. The hexes below exist only here, inside the
 * 3D materials (the brief's palette); every piece of interface around the model uses the site's colour tokens.
 */
export const PALETTE = {
  ivory: 0xeae3d4,
  sandstone: 0xc8b99d,
  gold: 0xb49a67,
  brown: 0x352a24,
  terrain: 0xdcd1bb,
  /** Arena footing: a little deeper than the terrain so the riding surface reads at a glance. */
  sand: 0xd6c8a8,
} as const;

export type MaterialKey = "wall" | "stone" | "timber" | "roof" | "trim" | "floor" | "glass" | "canopy" | "lamp";
export type Materials = Record<MaterialKey, THREE.MeshStandardMaterial>;

const color = (hex: number) => new THREE.Color(hex);
const mix = (a: number, b: number, t: number) => color(a).lerp(color(b), t);

/** One set per building, so that hover and selection can tint a single building without touching its neighbours. */
export function createMaterials(): Materials {
  const std = (c: THREE.Color, roughness: number, metalness = 0, extra: THREE.MeshStandardMaterialParameters = {}) => {
    const m = new THREE.MeshStandardMaterial({ color: c, roughness, metalness, ...extra });
    m.userData.base = c.clone();
    return m;
  };
  return {
    wall: std(color(PALETTE.ivory), 0.9),
    stone: std(color(PALETTE.sandstone), 0.94),
    timber: std(mix(PALETTE.brown, PALETTE.sandstone, 0.18), 0.72),
    roof: std(color(PALETTE.brown), 0.52, 0.28),
    trim: std(color(PALETTE.gold), 0.36, 0.7),
    floor: std(mix(PALETTE.sandstone, PALETTE.ivory, 0.55), 0.96),
    glass: std(mix(PALETTE.brown, PALETTE.gold, 0.45), 0.12, 0.2, { transparent: true, opacity: 0.55 }),
    canopy: std(color(PALETTE.ivory), 0.55, 0, { transparent: true, opacity: 0.6, depthWrite: false }),
    lamp: std(color(0xf3e2b4), 0.5, 0, { emissive: color(0xf3e2b4), emissiveIntensity: 0.9 }),
  };
}

const FADE = new THREE.Color(PALETTE.terrain);
const HOVER = new THREE.Color(PALETTE.gold);
const scratch = new THREE.Color();

/** hover and selection tint a building warm; `dim` washes the others towards the terrain so the chosen one leads. */
export function tintMaterials(m: Materials, hover: number, dim: number) {
  for (const key of Object.keys(m) as MaterialKey[]) {
    if (key === "lamp") continue;
    const mat = m[key];
    scratch.copy(mat.userData.base as THREE.Color).lerp(FADE, dim * 0.5);
    mat.color.copy(scratch);
    mat.emissive.copy(HOVER).multiplyScalar(hover * 0.2);
  }
}

export function disposeMaterials(m: Materials) {
  for (const mat of Object.values(m)) mat.dispose();
}

/* ---------------------------------------------------------------- textures */

let grain: THREE.CanvasTexture | null = null;

function canvas(size: number) {
  const c = document.createElement("canvas");
  c.width = c.height = size;
  return c;
}

/** Fine, even grain in greys near white: multiplies a material's colour by a few percent so large flat faces are not flat. */
export function grainTexture(): THREE.CanvasTexture {
  if (grain) return grain;
  const c = canvas(256);
  const ctx = c.getContext("2d")!;
  ctx.fillStyle = "#f4f4f4";
  ctx.fillRect(0, 0, 256, 256);
  for (let i = 0; i < 9000; i++) {
    const v = 228 + Math.floor(Math.random() * 27);
    ctx.fillStyle = `rgb(${v},${v},${v})`;
    ctx.fillRect(Math.random() * 256, Math.random() * 256, 1 + Math.random() * 1.5, 1 + Math.random() * 1.5);
  }
  grain = new THREE.CanvasTexture(c);
  grain.wrapS = grain.wrapT = THREE.RepeatWrapping;
  grain.colorSpace = THREE.SRGBColorSpace;
  grain.anisotropy = 4;
  return grain;
}

/** Raked sand: faint parallel furrows and grain. Repeat is set by the caller from the arena's size. */
export function sandTexture(repeatX: number, repeatY: number): THREE.CanvasTexture {
  const c = canvas(512);
  const ctx = c.getContext("2d")!;
  ctx.fillStyle = "#f2f2f2";
  ctx.fillRect(0, 0, 512, 512);
  ctx.strokeStyle = "rgba(120,110,95,0.20)";
  ctx.lineWidth = 1.2;
  for (let y = 4; y < 512; y += 8) {
    ctx.beginPath();
    ctx.moveTo(0, y + Math.sin(y) * 0.6);
    ctx.lineTo(512, y - Math.sin(y) * 0.6);
    ctx.stroke();
  }
  for (let i = 0; i < 14000; i++) {
    const v = 214 + Math.floor(Math.random() * 41);
    ctx.fillStyle = `rgba(${v},${v - 6},${v - 18},0.55)`;
    ctx.fillRect(Math.random() * 512, Math.random() * 512, 1.4, 1.4);
  }
  const t = new THREE.CanvasTexture(c);
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  t.repeat.set(repeatX, repeatY);
  t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = 8;
  return t;
}

/**
 * A soft rounded rectangle for an alpha map: solid under the building, fading to nothing over `band` metres beyond its edge.
 * Baked once per building size; this is the contact shadow (ambient occlusion where a wall meets the ground).
 */
export function contactShadowTexture(w: number, d: number, band: number): THREE.CanvasTexture {
  const W = 128;
  const total = w + band * 2;
  const H = Math.min(256, Math.max(32, Math.round((W * (d + band * 2)) / total)));
  const px = Math.max(3, Math.round((band * W) / total));
  const c = document.createElement("canvas");
  c.width = W;
  c.height = H;
  const ctx = c.getContext("2d")!;
  ctx.fillStyle = "#000";
  ctx.fillRect(0, 0, W, H);
  for (let inset = 0; inset <= px; inset++) {
    const t = inset / px;
    const v = Math.round(255 * t * t * (3 - 2 * t));
    ctx.fillStyle = `rgb(${v},${v},${v})`;
    ctx.beginPath();
    ctx.roundRect(inset, inset, W - inset * 2, H - inset * 2, Math.max(1, px - inset * 0.6));
    ctx.fill();
  }
  return new THREE.CanvasTexture(c);
}

/**
 * A bright, warm photographic studio rendered once into a prefiltered map: a large softbox high on one side, a low warm
 * bounce from the table and an ivory room. It gives the gold trim and the roofs something to reflect. Nothing is downloaded.
 * The caller disposes the returned target (and must dispose the render target itself: disposing only its texture leaks).
 */
export function createCampusEnvironment(renderer: THREE.WebGLRenderer): THREE.WebGLRenderTarget {
  const room = new THREE.Scene();
  const disposables: { dispose(): void }[] = [];
  const add = (geo: THREE.BufferGeometry, hex: string, intensity: number, side: THREE.Side, place: (m: THREE.Mesh) => void) => {
    const mat = new THREE.MeshBasicMaterial({ color: new THREE.Color(hex).multiplyScalar(intensity), side });
    const mesh = new THREE.Mesh(geo, mat);
    place(mesh);
    room.add(mesh);
    disposables.push(geo, mat);
  };
  add(new THREE.BoxGeometry(40, 28, 40), "#d9cfbd", 0.85, THREE.BackSide, () => {});
  add(new THREE.PlaneGeometry(14, 9), "#fff4e0", 5.2, THREE.DoubleSide, (m) => {
    m.position.set(-8, 14, 9);
    m.lookAt(0, 0, 0);
  });
  add(new THREE.PlaneGeometry(9, 3), "#ffeccf", 2.6, THREE.DoubleSide, (m) => {
    m.position.set(11, 7, -9);
    m.lookAt(0, 0, 0);
  });
  add(new THREE.PlaneGeometry(30, 30), "#cdb892", 0.7, THREE.DoubleSide, (m) => {
    m.rotation.x = -Math.PI / 2;
    m.position.y = -6;
  });
  const generator = new THREE.PMREMGenerator(renderer);
  const target = generator.fromScene(room, 0.03);
  generator.dispose();
  for (const d of disposables) d.dispose();
  return target;
}
