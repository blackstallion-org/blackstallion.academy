// Builds the pictures for the home page opening and the running-horse loader from the three supplied animations in
// scripts/opening-source/ (the sources stay out of deployments: .vercelignore lists scripts/).
//   node scripts/make-opening-assets.mjs
// Writes public/opening/:
//   plate-1.webp, plate-2.webp   the two ink shots with the horse (and its shadow) painted out, so the horse can run over a moving ground
//   horse-1.webp, horse-2.webp   the galloping ink horse of each shot, cut out with a soft edge, scaled up 3x with its edge re-sharpened
//   runner.webp                  the 15 gallop poses of the supplied silhouette GIF as an alpha-only sprite sheet (5 x 3)
// and lib/opening/layout.ts: where each horse sits inside its plate (percent of the plate) and the runner sheet's grid, imported by the components.
// The GIF's own fill is a collage of printed paper with third-party lettering: only its OUTLINE is used (everything not reachable
// from the white background), painted in the site's own ink by CSS. Needs `sharp`, which is installed with Next.js.
import { mkdirSync, writeFileSync } from "node:fs";
import { createRequire } from "node:module";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const SRC = path.join(root, "scripts", "opening-source");
const OUT = path.join(root, "public", "opening");
let sharp;
try {
  sharp = createRequire(path.join(root, "package.json"))("sharp");
} catch {
  console.error("sharp is not installed (it comes with Next.js: run `npm ci`).");
  process.exit(1);
}
mkdirSync(OUT, { recursive: true });

/** Connected components of a binary mask (8-neighbour). Returns { labels, sizes } with label 0 = background. */
function components(mask, w, h) {
  const labels = new Int32Array(w * h);
  const sizes = [0];
  let next = 0;
  const stack = [];
  for (let i = 0; i < w * h; i++) {
    if (!mask[i] || labels[i]) continue;
    next++;
    let size = 0;
    stack.push(i);
    labels[i] = next;
    while (stack.length) {
      const p = stack.pop();
      size++;
      const x = p % w, y = (p / w) | 0;
      for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) {
        const nx = x + dx, ny = y + dy;
        if (nx < 0 || ny < 0 || nx >= w || ny >= h) continue;
        const q = ny * w + nx;
        if (mask[q] && !labels[q]) { labels[q] = next; stack.push(q); }
      }
    }
    sizes.push(size);
  }
  return { labels, sizes };
}

function dilate(mask, w, h, r) {
  const out = new Uint8Array(w * h);
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
    if (!mask[y * w + x]) continue;
    for (let dy = -r; dy <= r; dy++) for (let dx = -r; dx <= r; dx++) {
      const nx = x + dx, ny = y + dy;
      if (nx >= 0 && ny >= 0 && nx < w && ny < h && dx * dx + dy * dy <= r * r) out[ny * w + nx] = 1;
    }
  }
  return out;
}

/* ------------------------------------------------------------------------------------------------ the two ink shots */
// Where to look for the horse in each 500 x 281 frame (the frames also hold a shrub, petals, hills: none are in these windows).
const SHOTS = [
  { n: 1, window: { x0: 120, x1: 290, y0: 160, y1: 252 } },
  { n: 2, window: { x0: 170, x1: 330, y0: 160, y1: 252 } },
];
const INK = [27, 23, 21]; // the horse in the site's warm black
const UP = 3; // the horse is drawn this much larger than the 500 px frame

async function shot({ n, window: win }) {
  const { data, info } = await sharp(path.join(SRC, `ink-horse-${n}.webp`)).removeAlpha().raw().toBuffer({ resolveWithObject: true });
  const { width: w, height: h } = info;
  const lum = new Float32Array(w * h);
  for (let i = 0; i < w * h; i++) lum[i] = 0.299 * data[i * 3] + 0.587 * data[i * 3 + 1] + 0.114 * data[i * 3 + 2];

  // 1. the horse = the large ink component (dark pixels) inside the window. Specks, petals and the shrub's strands are far smaller,
  //    so a size filter on the raw pixels drops them; the horse's outline is then grown 3 px to take in its soft edge.
  const ink = new Uint8Array(w * h);
  for (let y = win.y0; y < win.y1; y++) for (let x = win.x0; x < win.x1; x++) if (lum[y * w + x] < 105) ink[y * w + x] = 1;
  const { labels, sizes } = components(ink, w, h);
  const solid = new Uint8Array(w * h);
  for (let i = 0; i < w * h; i++) if (ink[i] && sizes[labels[i]] >= 100) solid[i] = 1;
  const horse = dilate(solid, w, h, 3);
  let x0 = w, x1 = 0, y0 = h, y1 = 0;
  for (let i = 0; i < w * h; i++) if (horse[i]) {
    const x = i % w, y = (i / w) | 0;
    if (x < x0) x0 = x; if (x > x1) x1 = x; if (y < y0) y0 = y; if (y > y1) y1 = y;
  }
  const pad = 6;
  x0 = Math.max(0, x0 - pad); y0 = Math.max(0, y0 - pad); x1 = Math.min(w - 1, x1 + pad); y1 = Math.min(h - 1, y1 + pad);
  const bw = x1 - x0 + 1, bh = y1 - y0 + 1;

  // 2. the cut-out: alpha from darkness (soft, so the anti-aliased edge survives), only inside the horse region
  const alpha = Buffer.alloc(bw * bh);
  for (let y = 0; y < bh; y++) for (let x = 0; x < bw; x++) {
    const p = (y + y0) * w + (x + x0);
    if (!horse[p]) continue;
    alpha[y * bw + x] = Math.round(255 * Math.min(1, Math.max(0, (165 - lum[p]) / 105)));
  }
  // up 3x, then a short blur and a steeper curve so the edge is smooth and crisp instead of stair-stepped
  const bigAlpha = await sharp(alpha, { raw: { width: bw, height: bh, channels: 1 } })
    .resize(bw * UP, bh * UP, { kernel: "lanczos3" }).blur(1.1).linear(2.4, -127.5 * 2.4 + 127.5).extractChannel(0).raw().toBuffer();
  const rgba = Buffer.alloc(bw * UP * bh * UP * 4);
  for (let i = 0; i < bigAlpha.length; i++) { rgba[i * 4] = INK[0]; rgba[i * 4 + 1] = INK[1]; rgba[i * 4 + 2] = INK[2]; rgba[i * 4 + 3] = bigAlpha[i]; }
  await sharp(rgba, { raw: { width: bw * UP, height: bh * UP, channels: 4 } }).webp({ quality: 86, alphaQuality: 92, effort: 5 }).toFile(path.join(OUT, `horse-${n}.webp`));

  // 3. the plate without the horse or its shadow: fill each row across the hole from the pixels either side, then soften
  const hole = dilate(horse, w, h, 5);
  for (let y = y1 - 4; y <= Math.min(h - 1, y1 + 26); y++) for (let x = Math.max(0, x0 - 22); x <= Math.min(w - 1, x1 + 22); x++) hole[y * w + x] = 1;
  const plate = Buffer.from(data);
  for (let y = 0; y < h; y++) {
    let x = 0;
    while (x < w) {
      if (!hole[y * w + x]) { x++; continue; }
      let a = x; while (a < w && hole[y * w + a]) a++;
      const left = Math.max(0, x - 1), right = Math.min(w - 1, a);
      for (let k = x; k < a; k++) {
        const t = (k - left) / Math.max(1, right - left);
        for (let c = 0; c < 3; c++) plate[(y * w + k) * 3 + c] = Math.round(data[(y * w + left) * 3 + c] * (1 - t) + data[(y * w + right) * 3 + c] * t);
      }
      x = a;
    }
  }
  const soft = await sharp(plate, { raw: { width: w, height: h, channels: 3 } }).blur(2.2).raw().toBuffer(); // used only inside the filled region
  for (let i = 0; i < w * h; i++) if (hole[i]) for (let c = 0; c < 3; c++) plate[i * 3 + c] = soft[i * 3 + c];
  await sharp(plate, { raw: { width: w, height: h, channels: 3 } }).resize(Math.round(w * 2.5), Math.round(h * 2.5), { kernel: "lanczos3" }).webp({ quality: 80, effort: 5 }).toFile(path.join(OUT, `plate-${n}.webp`));

  // where the horse sits in the plate, as percent of the plate (the cut-out file is the padded box)
  return { n, plate: { w, h }, box: { left: (100 * x0) / w, top: (100 * y0) / h, width: (100 * bw) / w, height: (100 * bh) / h } };
}

/* ------------------------------------------------------------------------------------------------ the running silhouette */
async function runner() {
  const gif = path.join(SRC, "gallop-silhouette.gif");
  const meta = await sharp(gif, { animated: true }).metadata();
  const W = meta.width, H = meta.pageHeight, N = meta.pages;
  const all = await sharp(gif, { pages: -1 }).removeAlpha().raw().toBuffer({ resolveWithObject: true });
  const FW = 400, FH = Math.round((H * FW) / W), COLS = 5, ROWS = Math.ceil(N / COLS);
  const sheet = Buffer.alloc(FW * COLS * FH * ROWS * 4);
  for (let f = 0; f < N; f++) {
    const base = f * H * W * 3;
    // the background is the white that touches the picture's edge; whatever it cannot reach is the horse and rider
    const bg = new Uint8Array(W * H);
    const stack = [];
    const white = (p) => all.data[base + p * 3] >= 250 && all.data[base + p * 3 + 1] >= 250 && all.data[base + p * 3 + 2] >= 250;
    const push = (p) => { if (!bg[p] && white(p)) { bg[p] = 1; stack.push(p); } };
    for (let x = 0; x < W; x++) { push(x); push((H - 1) * W + x); }
    for (let y = 0; y < H; y++) { push(y * W); push(y * W + W - 1); }
    while (stack.length) {
      const p = stack.pop(), x = p % W, y = (p / W) | 0;
      if (x > 0) push(p - 1); if (x < W - 1) push(p + 1); if (y > 0) push(p - W); if (y < H - 1) push(p + W);
    }
    const shape = new Uint8Array(W * H);
    for (let i = 0; i < W * H; i++) shape[i] = bg[i] ? 0 : 1;
    const { labels, sizes } = components(shape, W, H);
    const big = new Set(sizes.map((s, i) => [s, i]).filter(([s, i]) => i > 0 && s >= 60).map(([, i]) => i));
    const mask = Buffer.alloc(W * H);
    for (let i = 0; i < W * H; i++) mask[i] = shape[i] && big.has(labels[i]) ? 255 : 0;
    const small = await sharp(mask, { raw: { width: W, height: H, channels: 1 } }).resize(FW, FH, { kernel: "lanczos3" }).extractChannel(0).raw().toBuffer(); // one channel (sharp would return three)
    const cx = (f % COLS) * FW, cy = Math.floor(f / COLS) * FH;
    for (let y = 0; y < FH; y++) for (let x = 0; x < FW; x++) sheet[((cy + y) * FW * COLS + cx + x) * 4 + 3] = small[y * FW + x]; // RGB stays 0 (black); only alpha is used
  }
  await sharp(sheet, { raw: { width: FW * COLS, height: FH * ROWS, channels: 4 } }).webp({ quality: 80, alphaQuality: 88, effort: 5 }).toFile(path.join(OUT, "runner.webp"));
  return { frames: N, frame: { w: FW, h: FH }, grid: { cols: COLS, rows: ROWS } };
}

const shots = [];
for (const s of SHOTS) shots.push(await shot(s));
const runnerInfo = await runner();
const round = (v) => Math.round(v * 100) / 100;
const layout = `// Generated by scripts/make-opening-assets.mjs. Do not edit by hand.
export const OPENING_SHOTS = ${JSON.stringify(shots.map((s) => ({ n: s.n, box: Object.fromEntries(Object.entries(s.box).map(([k, v]) => [k, round(v)])) })), null, 2)} as const;

export const RUNNER_SHEET = ${JSON.stringify(runnerInfo, null, 2)} as const;
`;
mkdirSync(path.join(root, "lib", "opening"), { recursive: true });
writeFileSync(path.join(root, "lib", "opening", "layout.ts"), layout);
console.log(JSON.stringify({ shots: shots.map((s) => ({ n: s.n, box: Object.fromEntries(Object.entries(s.box).map(([k, v]) => [k, +v.toFixed(2)])) })), runner: runnerInfo }));
