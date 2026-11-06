import { EDGES, KP_COUNT, VISIBLE_SCORE } from "./skeleton";

/** Colours come from the site's own tokens at draw time, so the overlay follows the palette (and a future theme) without hex codes here. */
export type Palette = { head: string; spine: string; fore: string; hind: string; joint: string; box: string; grid: string; axis: string; text: string; chart: [string, string, string, string] };

export function readPalette(): Palette {
  const s = typeof document !== "undefined" ? getComputedStyle(document.documentElement) : null;
  const v = (name: string, fallback: string) => (s?.getPropertyValue(name).trim() || fallback);
  return {
    head: v("--color-antique", "#c9a66b"), spine: v("--color-ivory", "#f3ede2"), fore: v("--color-caramel", "#b88a62"),
    hind: v("--color-parch", "#e8dece"), joint: v("--color-offwhite", "#faf7f0"), box: v("--color-antique", "#c9a66b"),
    grid: v("--color-sandline", "#d4c3ad"), axis: v("--color-dust", "#6f5b4b"), text: v("--color-sand", "#4d3c30"),
    chart: [v("--color-chestnut", "#78472f"), v("--color-caramel", "#b88a62"), v("--color-bone", "#30251e"), v("--color-brass", "#7b5636")],
  };
}

/** Where the video's pixels land inside a canvas of cw x ch when shown with object-fit: contain. */
export function containRect(vw: number, vh: number, cw: number, ch: number) {
  const k = Math.min(cw / vw, ch / vh);
  return { k, ox: (cw - vw * k) / 2, oy: (ch - vh * k) / 2 };
}

/** Draws one pose (flat x,y,score triplets in video pixels) and optionally its box. Low-score points are skipped, never guessed. */
export function drawPose(ctx: CanvasRenderingContext2D, kp: number[], box: [number, number, number, number] | null, vw: number, vh: number, pal: Palette, opts: { skeleton?: boolean; box?: boolean; dpr?: number } = {}) {
  const dpr = opts.dpr ?? 1;
  const cw = ctx.canvas.width, ch = ctx.canvas.height;
  const { k, ox, oy } = containRect(vw, vh, cw, ch);
  const px = (x: number) => ox + x * k, py = (y: number) => oy + y * k;
  if (opts.box !== false && box) {
    ctx.save(); ctx.strokeStyle = pal.box; ctx.globalAlpha = 0.55; ctx.lineWidth = 1.5 * dpr; ctx.setLineDash([6 * dpr, 5 * dpr]);
    ctx.strokeRect(px(box[0]), py(box[1]), (box[2] - box[0]) * k, (box[3] - box[1]) * k); ctx.restore();
  }
  if (opts.skeleton === false || kp.length < KP_COUNT * 3) return;
  const col = { head: pal.head, spine: pal.spine, fore: pal.fore, hind: pal.hind } as const;
  ctx.save(); ctx.lineCap = "round";
  for (const e of EDGES) {
    const sa = kp[e.a * 3 + 2], sb = kp[e.b * 3 + 2];
    if (sa < VISIBLE_SCORE || sb < VISIBLE_SCORE) continue;
    ctx.strokeStyle = col[e.group]; ctx.globalAlpha = 0.45 + 0.55 * Math.min(1, Math.min(sa, sb));
    ctx.lineWidth = 3 * dpr;
    ctx.beginPath(); ctx.moveTo(px(kp[e.a * 3]), py(kp[e.a * 3 + 1])); ctx.lineTo(px(kp[e.b * 3]), py(kp[e.b * 3 + 1])); ctx.stroke();
  }
  for (let i = 0; i < KP_COUNT; i++) {
    const s = kp[i * 3 + 2];
    if (s < VISIBLE_SCORE) continue;
    ctx.globalAlpha = 1; ctx.fillStyle = pal.joint; ctx.strokeStyle = "rgba(23,21,19,0.7)"; ctx.lineWidth = 1.5 * dpr;
    ctx.beginPath(); ctx.arc(px(kp[i * 3]), py(kp[i * 3 + 1]), (3.5 + 2 * Math.min(1, s)) * dpr, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
  }
  ctx.restore();
}

/** One animal to draw: its box and skeleton in video pixels, plus the text on its tag. */
export type DrawAnimal = { id: number; label: string; kp: number[] | null; box: [number, number, number, number] | null; selected: boolean };

/**
 * Draws every tracked animal: a box with a tag ("Dog 2 · 91%"), and a skeleton where the species has been tested and enough points
 * were seen. The selected animal is drawn solid, the others dashed and a little fainter. Each ID keeps its own box colour.
 */
export function drawAnimals(ctx: CanvasRenderingContext2D, animals: DrawAnimal[], vw: number, vh: number, pal: Palette, opts: { skeleton?: boolean; box?: boolean; dpr?: number } = {}) {
  const dpr = opts.dpr ?? 1;
  const cw = ctx.canvas.width, ch = ctx.canvas.height;
  const { k, ox, oy } = containRect(vw, vh, cw, ch);
  const px = (x: number) => ox + x * k, py = (y: number) => oy + y * k;
  const tint = [pal.box, pal.fore, pal.hind, pal.head, pal.spine];
  ctx.save();
  ctx.font = `${11 * dpr}px ui-sans-serif, system-ui, sans-serif`; ctx.textBaseline = "middle";
  for (const a of animals) {
    const colour = tint[(a.id - 1 + tint.length * 4) % tint.length];
    if (a.box && opts.box !== false) {
      const [x1, y1, x2, y2] = a.box;
      ctx.save();
      ctx.strokeStyle = colour; ctx.globalAlpha = a.selected ? 0.95 : 0.6; ctx.lineWidth = (a.selected ? 2 : 1.5) * dpr; ctx.setLineDash(a.selected ? [] : [6 * dpr, 5 * dpr]);
      ctx.strokeRect(px(x1), py(y1), (x2 - x1) * k, (y2 - y1) * k);
      ctx.restore();
      const text = a.label, pad = 5 * dpr, th = 16 * dpr;
      const tw = ctx.measureText(text).width + 2 * pad;
      const tx = Math.min(Math.max(0, px(x1)), Math.max(0, cw - tw)), ty = Math.max(0, py(y1) - th - 2 * dpr);
      ctx.save(); ctx.globalAlpha = 0.86; ctx.fillStyle = "rgba(23,21,19,0.82)"; ctx.fillRect(tx, ty, tw, th); ctx.globalAlpha = 1; ctx.fillStyle = colour; ctx.fillRect(tx, ty, 3 * dpr, th);
      ctx.fillStyle = "#faf7f0"; ctx.textAlign = "left"; ctx.fillText(text, tx + pad + 2 * dpr, ty + th / 2); ctx.restore();
    }
    if (a.kp && opts.skeleton !== false) { ctx.save(); ctx.globalAlpha = a.selected ? 1 : 0.75; drawPose(ctx, a.kp, null, vw, vh, pal, { skeleton: true, box: false, dpr }); ctx.restore(); }
  }
  ctx.restore();
}

export type Series = { id: string; label: string; color: string; dash?: boolean; pts: [number, number][] };

/** Simple time-series chart on a canvas: x = seconds, y = value; gaps (NaN) break the line. Cursor draws a vertical marker. */
export function drawChart(ctx: CanvasRenderingContext2D, series: Series[], o: { t0: number; t1: number; y0: number; y1: number; cursor?: number | null; pal: Palette; unit?: string; dpr?: number; legend?: boolean }) {
  const dpr = o.dpr ?? 1;
  const W = ctx.canvas.width, H = ctx.canvas.height;
  const padL = 40 * dpr, padR = 8 * dpr, padT = 8 * dpr, padB = 18 * dpr;
  const x = (t: number) => padL + ((t - o.t0) / Math.max(1, o.t1 - o.t0)) * (W - padL - padR);
  const y = (v: number) => padT + (1 - (v - o.y0) / Math.max(1e-9, o.y1 - o.y0)) * (H - padT - padB);
  ctx.clearRect(0, 0, W, H);
  ctx.font = `${10 * dpr}px ui-sans-serif, system-ui, sans-serif`;
  ctx.fillStyle = o.pal.axis; ctx.strokeStyle = o.pal.grid; ctx.lineWidth = 1 * dpr; ctx.textBaseline = "middle";
  for (let i = 0; i <= 3; i++) {
    const v = o.y0 + ((o.y1 - o.y0) * i) / 3;
    ctx.globalAlpha = 0.6; ctx.beginPath(); ctx.moveTo(padL, y(v)); ctx.lineTo(W - padR, y(v)); ctx.stroke();
    ctx.globalAlpha = 1; ctx.textAlign = "right"; ctx.fillText(Math.abs(v) >= 10 ? v.toFixed(0) : v.toFixed(2), padL - 5 * dpr, y(v));
  }
  ctx.textAlign = "center"; ctx.textBaseline = "alphabetic";
  const span = (o.t1 - o.t0) / 1000;
  const step = span > 40 ? 10 : span > 16 ? 5 : span > 6 ? 2 : 1;
  for (let s = Math.ceil(o.t0 / 1000 / step) * step; s * 1000 <= o.t1; s += step) ctx.fillText(`${s}s`, x(s * 1000), H - 4 * dpr);
  ctx.save(); ctx.beginPath(); ctx.rect(padL, padT, W - padL - padR, H - padT - padB); ctx.clip();
  for (const s of series) {
    ctx.strokeStyle = s.color; ctx.lineWidth = 1.8 * dpr; ctx.lineJoin = "round"; ctx.setLineDash(s.dash ? [6 * dpr, 4 * dpr] : []);
    ctx.beginPath(); let pen = false;
    for (const [t, v] of s.pts) {
      if (t < o.t0 - 1000 || t > o.t1 + 1000) continue;
      if (!Number.isFinite(v)) { pen = false; continue; }
      if (!pen) { ctx.moveTo(x(t), y(v)); pen = true; } else ctx.lineTo(x(t), y(v));
    }
    ctx.stroke();
  }
  ctx.setLineDash([]);
  if (o.legend) {
    ctx.restore(); ctx.save();
    ctx.font = `${11 * dpr}px ui-sans-serif, system-ui, sans-serif`; ctx.textAlign = "left"; ctx.textBaseline = "middle"; ctx.lineWidth = 2 * dpr;
    let lx = padL + 8 * dpr;
    for (const s of series) {
      ctx.strokeStyle = s.color; ctx.setLineDash(s.dash ? [6 * dpr, 4 * dpr] : []);
      ctx.beginPath(); ctx.moveTo(lx, padT + 8 * dpr); ctx.lineTo(lx + 22 * dpr, padT + 8 * dpr); ctx.stroke();
      ctx.setLineDash([]); ctx.fillStyle = o.pal.text; ctx.fillText(s.label, lx + 28 * dpr, padT + 8 * dpr);
      lx += 40 * dpr + ctx.measureText(s.label).width;
    }
    ctx.restore(); ctx.save(); ctx.beginPath(); ctx.rect(padL, padT, W - padL - padR, H - padT - padB); ctx.clip();
  }
  if (o.cursor != null && o.cursor >= o.t0 && o.cursor <= o.t1) {
    ctx.strokeStyle = o.pal.text; ctx.lineWidth = 1 * dpr; ctx.setLineDash([3 * dpr, 3 * dpr]);
    ctx.beginPath(); ctx.moveTo(x(o.cursor), padT); ctx.lineTo(x(o.cursor), H - padB); ctx.stroke();
  }
  ctx.restore();
}
