import * as THREE from "three";
import { mulberry32 } from "./noise";

function canvas(size: number) {
  const c = document.createElement("canvas");
  c.width = c.height = size;
  return c;
}
function tex(c: HTMLCanvasElement, repeat = true, srgb = true) {
  const t = new THREE.CanvasTexture(c);
  if (repeat) t.wrapS = t.wrapT = THREE.RepeatWrapping;
  if (srgb) t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = 4;
  t.needsUpdate = true;
  return t;
}
const rgb = (r: number, g: number, b: number, a = 1) => `rgba(${r | 0},${g | 0},${b | 0},${a})`;

/** Lime-washed plaster: broad tonal drift, mottling, hair cracks, rain streaks. White-ish so per-instance colour tints it. */
export function plasterTexture(seed = 3) {
  const r = mulberry32(seed);
  const c = canvas(512);
  const g = c.getContext("2d")!;
  g.fillStyle = "#f1ebe0";
  g.fillRect(0, 0, 512, 512);
  for (let i = 0; i < 260; i++) {
    const x = r() * 512, y = r() * 512, rad = 20 + r() * 90;
    const grad = g.createRadialGradient(x, y, 0, x, y, rad);
    const v = 215 + r() * 40;
    grad.addColorStop(0, rgb(v, v - 4, v - 12, 0.13));
    grad.addColorStop(1, rgb(v, v - 4, v - 12, 0));
    g.fillStyle = grad;
    g.fillRect(x - rad, y - rad, rad * 2, rad * 2);
  }
  for (let i = 0; i < 70; i++) {
    const x = r() * 512;
    g.strokeStyle = rgb(120, 100, 80, 0.018 + r() * 0.022);
    g.lineWidth = 3 + r() * 10;
    g.beginPath(); g.moveTo(x, 0);
    let y = 0, xx = x;
    while (y < 512) { y += 20 + r() * 30; xx += (r() - 0.5) * 6; g.lineTo(xx, y); }
    g.stroke();
  }
  g.strokeStyle = rgb(90, 75, 60, 0.1);
  g.lineWidth = 1;
  for (let i = 0; i < 18; i++) {
    let x = r() * 512, y = r() * 512;
    g.beginPath(); g.moveTo(x, y);
    for (let k = 0; k < 10; k++) { x += (r() - 0.5) * 40; y += (r() - 0.2) * 34; g.lineTo(x, y); }
    g.stroke();
  }
  return tex(c);
}

/** Dressed sandstone in even courses with slight tonal variety. */
export function sandstoneTexture(seed = 5) {
  const r = mulberry32(seed);
  const c = canvas(512);
  const g = c.getContext("2d")!;
  g.fillStyle = "#c79a6a";
  g.fillRect(0, 0, 512, 512);
  const rows = 8;
  const h = 512 / rows;
  for (let j = 0; j < rows; j++) {
    let x = -r() * 90;
    while (x < 512) {
      const w = 70 + r() * 90;
      const v = 0.82 + r() * 0.3;
      g.fillStyle = rgb(198 * v, 152 * v, 104 * v);
      g.fillRect(x, j * h, w, h);
      g.strokeStyle = rgb(70, 48, 30, 0.55);
      g.lineWidth = 3;
      g.strokeRect(x, j * h, w, h);
      for (let k = 0; k < 40; k++) { g.fillStyle = rgb(110, 80, 50, 0.07); g.fillRect(x + r() * w, j * h + r() * h, 2 + r() * 4, 1 + r() * 2); }
      x += w;
    }
  }
  return tex(c);
}

/** Weathered timber planks (doors, shutters, fencing). */
export function woodTexture(seed = 9, base: [number, number, number] = [92, 62, 40]) {
  const r = mulberry32(seed);
  const c = canvas(256);
  const g = c.getContext("2d")!;
  const planks = 6;
  const w = 256 / planks;
  for (let i = 0; i < planks; i++) {
    const v = 0.78 + r() * 0.4;
    g.fillStyle = rgb(base[0] * v, base[1] * v, base[2] * v);
    g.fillRect(i * w, 0, w, 256);
    for (let k = 0; k < 40; k++) {
      g.strokeStyle = rgb(30, 18, 10, 0.12 + r() * 0.12);
      g.lineWidth = 1;
      const x = i * w + r() * w;
      g.beginPath(); g.moveTo(x, 0); g.bezierCurveTo(x + (r() - 0.5) * 6, 80, x + (r() - 0.5) * 6, 170, x + (r() - 0.5) * 5, 256); g.stroke();
    }
    g.fillStyle = rgb(15, 10, 6, 0.55);
    g.fillRect(i * w - 1, 0, 2, 256);
  }
  return tex(c);
}

/** A cut-out tuft of dry grass blades (alpha) for crossed cards. */
export function grassTuftTexture(seed = 13) {
  const r = mulberry32(seed);
  const c = canvas(128);
  const g = c.getContext("2d")!;
  g.clearRect(0, 0, 128, 128);
  for (let i = 0; i < 46; i++) {
    const x = 64 + (r() - 0.5) * 70;
    const h = 50 + r() * 70;
    const lean = (r() - 0.5) * 50;
    const v = 0.6 + r() * 0.5;
    g.strokeStyle = rgb(176 * v, 150 * v, 92 * v, 1);
    g.lineWidth = 1.6 + r() * 1.8;
    g.beginPath();
    g.moveTo(x, 128);
    g.quadraticCurveTo(x + lean * 0.3, 128 - h * 0.6, x + lean, 128 - h);
    g.stroke();
  }
  const t = tex(c, false);
  return t;
}

/** Signage plate for the academy: charcoal board, gold lettering (a conceptual setting, not a surveyed facility). */
export function signTexture(lines: string[]) {
  const c = document.createElement("canvas");
  c.width = 1024; c.height = 256;
  const g = c.getContext("2d")!;
  g.fillStyle = "#1a1714";
  g.fillRect(0, 0, 1024, 256);
  g.strokeStyle = "#c9a66b";
  g.lineWidth = 5;
  g.strokeRect(14, 14, 996, 228);
  g.fillStyle = "#c9a66b";
  g.textAlign = "center";
  g.textBaseline = "middle";
  const sizes = [46, 30];
  lines.forEach((line, i) => {
    g.font = `${i === 0 ? "600" : "400"} ${sizes[i] ?? 28}px "Noto Serif Display", Georgia, serif`;
    g.fillText(line, 512, 100 + i * 66, 940);
  });
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = 4;
  return t;
}

/** Horizontal terracotta/terrazzo noise for pots and paving details. */
export function clayTexture(seed = 17) {
  const r = mulberry32(seed);
  const c = canvas(128);
  const g = c.getContext("2d")!;
  g.fillStyle = "#b5683d";
  g.fillRect(0, 0, 128, 128);
  for (let i = 0; i < 500; i++) { g.fillStyle = rgb(120 + r() * 80, 70 + r() * 40, 40 + r() * 30, 0.18); g.fillRect(r() * 128, r() * 128, 1 + r() * 3, 1 + r() * 3); }
  return tex(c);
}

/** Leaf clusters for tree crowns: dark ground with lighter and darker blotches. White-balanced so vertex colour sets the hue. */
export function foliageTexture(seed = 23) {
  const r = mulberry32(seed);
  const c = canvas(256);
  const g = c.getContext("2d")!;
  g.fillStyle = "#9aa58a";
  g.fillRect(0, 0, 256, 256);
  for (let i = 0; i < 1100; i++) {
    const x = r() * 256, y = r() * 256, rad = 2 + r() * 7;
    const v = r();
    g.fillStyle = v < 0.5 ? rgb(70 + r() * 40, 90 + r() * 40, 60 + r() * 30, 0.55) : rgb(190 + r() * 50, 205 + r() * 40, 150 + r() * 50, 0.4);
    g.beginPath();
    g.ellipse(x, y, rad, rad * (0.45 + r() * 0.4), r() * 3.14, 0, 6.3);
    g.fill();
  }
  return tex(c);
}
