import * as THREE from "three";

/** The site's font stacks, resolved once from CSS (next/font gives hashed family names). */
export function siteFonts() {
  const probe = (v: string) => {
    const el = document.createElement("span");
    el.style.fontFamily = `var(${v})`;
    document.body.appendChild(el);
    const f = getComputedStyle(el).fontFamily;
    el.remove();
    return f || "sans-serif";
  };
  return { sans: probe("--font-sans"), mono: probe("--font-mono"), display: probe("--font-display") };
}

/** A canvas-backed texture; `draw` paints it, `redraw` repaints and flags the upload. */
export function canvasTexture(w: number, h: number, draw: (g: CanvasRenderingContext2D, w: number, h: number) => void) {
  const c = document.createElement("canvas");
  c.width = w;
  c.height = h;
  const g = c.getContext("2d")!;
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 4;
  const redraw = () => {
    g.clearRect(0, 0, w, h);
    draw(g, w, h);
    tex.needsUpdate = true;
  };
  redraw();
  return { tex, redraw, canvas: c };
}

/** Samples the ink of `text` into points on a plane `width` metres wide, centred on the origin. */
export function textPoints(text: string, font: string, width: number, step = 3) {
  const W = 900;
  const H = 300;
  const c = document.createElement("canvas");
  c.width = W;
  c.height = H;
  const g = c.getContext("2d")!;
  g.fillStyle = "#fff";
  g.textAlign = "center";
  g.textBaseline = "middle";
  g.font = `800 250px ${font}`;
  g.fillText(text, W / 2, H / 2 + 10);
  const data = g.getImageData(0, 0, W, H).data;
  const pts: number[] = [];
  const s = width / W;
  for (let y = 0; y < H; y += step)
    for (let x = 0; x < W; x += step) if (data[(y * W + x) * 4 + 3] > 128) pts.push((x - W / 2) * s, (H / 2 - y) * s, 0);
  return new Float32Array(pts);
}
