import { PDFDocument, StandardFonts, rgb, type PDFFont, type PDFPage } from "pdf-lib";
import { anglesOf, CONFIDENT, gaitTimeline, GAIT_LABEL, proportions, samplesOf, visibleCount } from "./analysis";
import { ANGLES, KEYPOINTS, KP_COUNT, VISIBLE_SCORE } from "./skeleton";
import { SPECIES } from "./species";
import type { AnimalInfo, GaitName, Sample, SessionMeta } from "./types";

/** Everything exported comes from the stored measurements of the session; no value is filled in or invented. */

const csvCell = (v: string | number) => {
  const s = String(v);
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
};

/**
 * One row per animal per analysed frame. Coordinates are pixels of the source video (width and height are in the first comment
 * line); empty cells mean "no skeleton" or "point not visible". t_ms is the session clock (video time for uploads). animal_id is
 * the tracker's ID and species what the detector's vote named it (empty while unsure); a row with animal_id 0 is a frame with no
 * animal in it.
 */
export function toCsv(meta: SessionMeta, samples: Sample[]): string {
  const head = ["t_ms", "frame", "animal_id", "species", "skeleton", "detector_score", "box_x1", "box_y1", "box_x2", "box_y2", "visible_joints"];
  for (const n of KEYPOINTS) head.push(`${n}_x`, `${n}_y`, `${n}_score`);
  for (const a of ANGLES) head.push(`angle_${a.id}_deg`);
  head.push("detector_ms", "pose_ms", "frame_ms");
  const lines = [
    `# BSAH Motion Lab session ${meta.id} "${meta.name.replace(/\n/g, " ")}" source=${meta.source} video=${meta.videoWidth}x${meta.videoHeight} created=${meta.createdAt}`,
    `# Experimental estimates from on-device models. Not a veterinary or lameness assessment. Models: ${meta.models.detector}; ${meta.models.pose}.`,
    head.join(","),
  ];
  let frame = -1, last = NaN;
  for (const s of samples) {
    if (s.t !== last) { frame++; last = s.t; }
    const has = s.kp.length >= KP_COUNT * 3;
    const row: (string | number)[] = [Math.round(s.t), frame, s.id ?? 1, s.sp === undefined ? "horse" : s.sp, has ? 1 : 0, has || s.det ? s.det.toFixed(3) : "", ...(s.box ?? ["", "", "", ""]), has ? visibleCount(s.kp) : ""];
    for (let k = 0; k < KP_COUNT; k++) row.push(has ? s.kp[k * 3] : "", has ? s.kp[k * 3 + 1] : "", has ? s.kp[k * 3 + 2] : "");
    const ang = has ? anglesOf(s.kp) : {};
    for (const a of ANGLES) row.push(ang[a.id] !== undefined ? (ang[a.id] as number).toFixed(1) : "");
    row.push(s.detMs.toFixed(1), s.poseMs.toFixed(1), s.totalMs.toFixed(1));
    lines.push(row.map(csvCell).join(","));
  }
  return lines.join("\n") + "\n";
}

export function toJson(meta: SessionMeta, samples: Sample[]): string {
  const strip = (a: AnimalInfo): AnimalInfo => ({ ...a, frames: undefined });
  return JSON.stringify({ format: "bsah-motion-lab-session/2", meta: { ...meta, thumbnail: undefined, animals: meta.animals?.map(strip) }, samples }, null, 0);
}

export function download(name: string, data: Blob | string, type = "text/plain") {
  const blob = typeof data === "string" ? new Blob([data], { type }) : data;
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url; a.download = name; a.rel = "noopener";
  document.body.appendChild(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 10_000);
}

export const safeName = (s: string) => s.trim().replace(/[^A-Za-z0-9._-]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 60) || "session";

// ------------------------------------------------------------------ PDF reports

const INK = rgb(0.19, 0.145, 0.118), DUST = rgb(0.435, 0.357, 0.294), CHEST = rgb(0.47, 0.28, 0.184), LINE = rgb(0.83, 0.77, 0.68);
const ascii = (s: string) => s.replace(/[^\x20-\x7e]/g, " ");
const GAIT_COLOURS: Record<GaitName, ReturnType<typeof rgb>> = {
  standing: rgb(0.83, 0.77, 0.68), walk: rgb(0.72, 0.54, 0.38), trot: rgb(0.47, 0.28, 0.18), canter: rgb(0.29, 0.2, 0.15), gallop: rgb(0.1, 0.08, 0.07),
  run: rgb(0.1, 0.08, 0.07), moving: rgb(0.6, 0.5, 0.4), unclear: rgb(0.93, 0.9, 0.85),
};

async function dataUrlBytes(url: string): Promise<Uint8Array> {
  const res = await fetch(url);
  return new Uint8Array(await res.arrayBuffer());
}

export type ReportChart = { title: string; png: string };

/** A small layout helper over pdf-lib: flowing text, rules, tables, images and page breaks on A4. */
class Doc {
  pdf!: PDFDocument; font!: PDFFont; bold!: PDFFont; page!: PDFPage; y = 0;
  readonly W = 595.28; readonly H = 841.89; readonly M = 48;
  static async create() { const d = new Doc(); d.pdf = await PDFDocument.create(); d.font = await d.pdf.embedFont(StandardFonts.Helvetica); d.bold = await d.pdf.embedFont(StandardFonts.HelveticaBold); d.page = d.pdf.addPage([d.W, d.H]); d.y = d.H - d.M; return d; }
  text(t: string, o: { size?: number; bold?: boolean; color?: ReturnType<typeof rgb>; x?: number; max?: number } = {}) {
    const size = o.size ?? 10, f = o.bold ? this.bold : this.font, maxW = o.max ?? this.W - 2 * this.M - (o.x ?? 0);
    let line = "";
    const flush = () => { if (!line) return; this.ensure(size * 1.5); this.page.drawText(line, { x: this.M + (o.x ?? 0), y: this.y, size, font: f, color: o.color ?? INK }); this.y -= size * 1.45; line = ""; };
    for (const w of ascii(t).split(/\s+/)) { const next = line ? `${line} ${w}` : w; if (f.widthOfTextAtSize(next, size) > maxW) { flush(); line = w; } else line = next; }
    flush();
  }
  ensure(need: number) { if (this.y - need < this.M) { this.page = this.pdf.addPage([this.W, this.H]); this.y = this.H - this.M; } }
  rule() { this.page.drawLine({ start: { x: this.M, y: this.y }, end: { x: this.W - this.M, y: this.y }, thickness: 0.5, color: DUST }); this.y -= 10; }
  gap(n: number) { this.y -= n; }
  h(t: string) { this.ensure(40); this.gap(8); this.text(t, { size: 13, bold: true }); this.gap(2); }
  kv(rows: [string, string][]) { for (const [k, v] of rows) { this.ensure(28); this.text(k.toUpperCase(), { size: 7.5, bold: true, color: DUST }); this.text(v, { size: 10 }); this.gap(3); } }
  /** Table with fixed column x-offsets (points from the left margin). */
  table(head: string[], rows: string[][], cols: number[]) {
    this.ensure(30);
    head.forEach((c, i) => this.page.drawText(ascii(c).toUpperCase(), { x: this.M + cols[i], y: this.y, size: 7.5, font: this.bold, color: DUST }));
    this.y -= 4; this.page.drawLine({ start: { x: this.M, y: this.y }, end: { x: this.W - this.M, y: this.y }, thickness: 0.4, color: LINE }); this.y -= 11;
    for (const r of rows) { this.ensure(14); r.forEach((c, i) => this.page.drawText(ascii(c), { x: this.M + cols[i], y: this.y, size: 9, font: this.font, color: INK })); this.y -= 12.5; }
  }
  async image(url: string, width: number, kind: "png" | "jpg") {
    const bytes = await dataUrlBytes(url);
    const img = kind === "png" ? await this.pdf.embedPng(bytes) : await this.pdf.embedJpg(bytes);
    const h = (img.height / img.width) * width;
    this.ensure(h + 8);
    this.page.drawImage(img, { x: this.M, y: this.y - h, width, height: h }); this.y -= h + 8;
    return { w: width, h };
  }
}

const IST = (iso: string) => new Date(iso).toLocaleString("en-GB", { timeZone: "Asia/Kolkata" }) + " IST";
const acc = (m: SessionMeta) => (m.models.accelerator === "webgpu" ? "WebGPU" : "WebAssembly (CPU)");

const LIMITS = [
  "Skeleton points come from RTMPose-m trained on AP-10K, a general animal data set: eyes, nose, neck, root of tail, and for each leg a shoulder or hip, elbow or knee and paw. They are not hoof, fetlock or hock markers, and angles between them are approximate.",
  "Species comes from a COCO-trained detector (YOLOX-Nano) and the tracker's vote over time. Only species that were tested on real video get a skeleton and a movement estimate; any other animal is shown as detected only.",
  "Movement labels come from how each paw moves along the body, or how high it is lifted, over about four seconds. They need a steady side or three-quarter view; an animal facing the camera, hidden by a rider, rail or other animal, or too small in the picture, is reported as unclear rather than guessed.",
  "This is an experimental coaching aid. It is not a medical or veterinary diagnosis and must not be used to judge lameness, fitness or welfare. Ask a qualified professional.",
];

function header(d: Doc, kicker: string, title: string, sub: string) {
  d.text("BLACK STALLION ACADEMY OF HORSEMANSHIP", { size: 8, bold: true, color: CHEST }); d.gap(14);
  d.text(kicker, { size: 8, bold: true, color: DUST }); d.gap(12);
  d.text(title, { size: 22, bold: true }); d.gap(2);
  d.text(sub, { size: 9, color: DUST });
  d.gap(4); d.rule();
}

function performance(d: Doc, meta: SessionMeta, a: AnimalInfo | null) {
  const s = (a ?? { summary: meta.summary }).summary;
  const frames = meta.frameCount ?? s.frames;
  const wall = meta.wallMs;
  d.h("Analysis speed and models");
  d.kv([
    ["Analysis", `${frames} frames of ${meta.videoWidth} x ${meta.videoHeight} video${wall ? ` in ${(wall / 1000).toFixed(1)} s on this device` : ""} (${acc(meta)})`],
    ["Processing speed", `${s.meanFps.toFixed(1)} frames/s, ${s.meanLatencyMs.toFixed(0)} ms per frame (95th percentile ${s.p95LatencyMs.toFixed(0)} ms), all animals of the frame together`],
    ["Models", `${meta.models.detector}; ${meta.models.pose}; ${meta.models.runtime}`],
  ]);
}

function limits(d: Doc, extra?: string) {
  d.ensure(150); d.gap(6); d.rule();
  d.text("Limitations", { size: 11, bold: true });
  if (extra) d.text(extra, { size: 9, color: INK });
  for (const l of LIMITS) { d.text(l, { size: 8.5, color: DUST }); d.gap(1); }
}

function timelineBar(d: Doc, tl: { t: number; est: { gait: GaitName; confidence: number } }[]) {
  const barW = d.W - 2 * d.M, barH = 12;
  d.ensure(barH + 28);
  tl.forEach((p, i) => {
    const g: GaitName = p.est.confidence >= CONFIDENT ? p.est.gait : "unclear";
    d.page.drawRectangle({ x: d.M + (i / tl.length) * barW, y: d.y - barH, width: barW / tl.length + 0.4, height: barH, color: GAIT_COLOURS[g] });
  });
  d.y -= barH + 6;
  const used = [...new Set(tl.map((p) => (p.est.confidence >= CONFIDENT ? p.est.gait : "unclear")))] as GaitName[];
  let lx = d.M;
  for (const g of used) { d.page.drawRectangle({ x: lx, y: d.y - 1, width: 8, height: 8, color: GAIT_COLOURS[g], borderColor: LINE, borderWidth: 0.4 }); d.page.drawText(ascii(GAIT_LABEL[g]), { x: lx + 11, y: d.y, size: 8, font: d.font, color: INK }); lx += 24 + d.font.widthOfTextAtSize(ascii(GAIT_LABEL[g]), 8); }
  d.y -= 14;
}

const REASON_TEXT: Record<string, string> = {
  short: "too little footage of the animal in the window",
  hidden: "legs hidden or uncertain",
  foreshortened: "animal seen end-on",
  "no-rhythm": "no steady leg rhythm",
  pattern: "leg timing fits no named gait",
  "slow-frames": "too few frames a second for this speed",
  range: "rhythm outside the believable range",
  untested: "species not validated",
};

/**
 * One animal's report (A4): who it is, how well it was seen, skeleton visibility per point, movement over time with the reasons for
 * anything unclear, joint angles, proportions, charts, annotated frames, analysis speed, models and limitations.
 */
export async function buildAnimalReport(meta: SessionMeta, all: Sample[], animal: AnimalInfo, charts: ReportChart[]): Promise<Uint8Array> {
  const d = await Doc.create();
  const prof = animal.species ? SPECIES[animal.species] : null;
  const ss = samplesOf(all, animal.id);
  const s = animal.summary;
  header(d, "MOTION LAB ANIMAL REPORT", `${animal.label}, ID ${animal.id}`, `${meta.name} | ${meta.source === "camera" ? "recorded with the camera" : "uploaded video"} | ${IST(meta.createdAt)}`);

  d.kv([
    ["Species and tracking ID", animal.species ? `${animal.label}, track ${animal.id}. The detector named it as ${animal.label.toLowerCase()} for ${(animal.speciesShare * 100).toFixed(0)}% of its (confidence-weighted) votes.` : `Track ${animal.id}. The detector's votes were split between species, so it is not named and no skeleton or movement estimate was attempted.`],
    ["In view", `${(animal.firstMs / 1000).toFixed(1)} s to ${(animal.lastMs / 1000).toFixed(1)} s (${animal.presencePct.toFixed(0)}% of the session, ${animal.lifeFrames} frames)`],
    ["Detection", `mean detector score ${s.meanDetScore.toFixed(2)}${animal.supported ? "" : " (the box only; no skeleton for this animal)"}`],
    ["Skeleton coverage", animal.supported ? `${animal.skeletonFrames} of ${animal.lifeFrames} frames carried a skeleton (${s.coveragePct.toFixed(0)}%), ${s.meanVisibleJoints.toFixed(1)} of 17 points visible on average` : "Not offered for this animal"],
  ]);
  if (!animal.supported) {
    d.h("Not analysed");
    d.text(prof ? prof.note : "The species could not be named with enough agreement, so nothing beyond its box is reported. Showing an unnamed animal as a horse, dog or cat would be a guess.", { size: 10 });
    performance(d, meta, animal); limits(d);
    return d.pdf.save();
  }

  d.h("Movement");
  const tl = gaitTimeline(ss, 1, animal.species ?? "horse");
  d.text(`${GAIT_LABEL[s.dominantGait]}${s.strideHzMedian ? `, about ${s.strideHzMedian.toFixed(2)} strides/s (${(s.strideHzMedian * 60).toFixed(0)} per minute)` : ""}. ${prof ? prof.note : ""}`, { size: 10 });
  if (!tl.length) d.text("Less than two seconds of this animal with a skeleton: no movement estimate.", { color: DUST });
  else {
    const shares = Object.entries(s.gaitShares).sort((a, b) => b[1] - a[1]);
    d.text(shares.map(([g, v]) => `${GAIT_LABEL[g as GaitName]} ${(v * 100).toFixed(0)}%`).join("   "), { size: 10 });
    const confident = tl.filter((p) => p.est.confidence >= CONFIDENT);
    d.text(`${confident.length} of ${tl.length} one-second windows were confident enough to name (mean confidence ${confident.length ? ((confident.reduce((x, p) => x + p.est.confidence, 0) / confident.length) * 100).toFixed(0) : 0}%).`, { size: 9, color: DUST });
    d.gap(4); timelineBar(d, tl);
    const why = Object.entries(s.unclearReasons ?? {}).sort((a, b) => b[1] - a[1]);
    if (why.length) d.text(`Not named because: ${why.map(([r, n]) => `${REASON_TEXT[r] ?? r} (${n})`).join("; ")}.`, { size: 9, color: DUST });
  }

  d.h("Skeleton visibility by point");
  const rows = KEYPOINTS.map((n, i) => {
    const have = ss.filter((x) => x.kp.length >= KP_COUNT * 3);
    const vis = have.filter((x) => x.kp[i * 3 + 2] >= VISIBLE_SCORE).length;
    const mean = have.length ? have.reduce((a, x) => a + x.kp[i * 3 + 2], 0) / have.length : 0;
    return [n.replace(/_/g, " "), have.length ? `${((vis / have.length) * 100).toFixed(0)}%` : "-", mean.toFixed(2)];
  });
  const half = Math.ceil(rows.length / 2);
  const a1 = rows.slice(0, half), a2 = rows.slice(half);
  d.table(["Point", "Visible", "Mean score"], a1, [0, 120, 170]);
  if (a2.length) { d.gap(2); d.table(["Point", "Visible", "Mean score"], a2, [0, 120, 170]); }

  d.h("Joint angle ranges (degrees)");
  const any = ANGLES.some((a) => s.angleRanges[a.id]);
  if (!any) d.text("No joint was visible often enough to measure.", { color: DUST });
  for (const a of ANGLES) { const r = s.angleRanges[a.id]; if (r) d.text(`${a.label}: min ${r.min.toFixed(0)}, mean ${r.mean.toFixed(0)}, max ${r.max.toFixed(0)}`, { size: 10 }); }
  const pr = proportions(ss);
  if (pr) d.text(`Proportions on ${pr.frames} side-on frames (generic points, not bones): forelimb ${pr.fore.toFixed(2)}, hind limb ${pr.hind.toFixed(2)} and head ${pr.head.toFixed(2)} of body length (neck to root of tail, about ${pr.bodyPx.toFixed(0)} px in the video).`, { size: 9, color: DUST });

  for (const c of charts) { d.ensure(190); d.gap(6); d.text(c.title, { size: 11, bold: true }); await d.image(c.png, d.W - 2 * d.M, "png"); }

  if (animal.frames?.length) {
    d.h("Annotated frames (box, species tag and skeleton from the model output)");
    const w = (d.W - 2 * d.M - 12) / 2;
    for (let i = 0; i < animal.frames.length; i += 2) {
      const pair = animal.frames.slice(i, i + 2);
      const imgs = await Promise.all(pair.map(async (u) => d.pdf.embedJpg(await dataUrlBytes(u))));
      const h = Math.max(...imgs.map((im) => (im.height / im.width) * w));
      d.ensure(h + 8);
      imgs.forEach((im, k) => d.page.drawImage(im, { x: d.M + k * (w + 12), y: d.y - (im.height / im.width) * w, width: w, height: (im.height / im.width) * w }));
      d.y -= h + 8;
    }
  }

  performance(d, meta, animal);
  limits(d, prof?.note);
  return d.pdf.save();
}

/** Combined summary of a session: one table row per tracked animal, then the shared limits. Per-animal reports hold the detail. */
export async function buildSummaryReport(meta: SessionMeta, all: Sample[], animals: AnimalInfo[]): Promise<Uint8Array> {
  const d = await Doc.create();
  header(d, "MOTION LAB SESSION SUMMARY", meta.name, `${meta.source === "camera" ? "recorded with the camera" : "uploaded video"} | ${IST(meta.createdAt)} | ${animals.length} tracked ${animals.length === 1 ? "animal" : "animals"}`);
  d.kv([["Video", `${meta.frameCount ?? meta.summary.frames} frames, ${meta.videoWidth} x ${meta.videoHeight}, ${(meta.summary.durationMs / 1000).toFixed(1)} s`]]);
  d.h("Animals");
  if (!animals.length) d.text("No animal was tracked in this session.", { color: DUST });
  else d.table(["ID", "Animal", "In view", "Skeleton", "Movement", "Stride/s"], animals.map((a) => [
    String(a.id), a.label, `${a.presencePct.toFixed(0)}%`,
    a.supported ? `${a.summary.coveragePct.toFixed(0)}% of ${a.lifeFrames}f` : "not offered",
    a.supported ? GAIT_LABEL[a.summary.dominantGait] : "-", a.summary.strideHzMedian ? a.summary.strideHzMedian.toFixed(2) : "-",
  ]), [0, 26, 150, 205, 290, 440]);
  d.gap(6);
  for (const a of animals) {
    const tl = a.supported ? gaitTimeline(samplesOf(all, a.id), 1, a.species ?? "horse") : [];
    d.ensure(48); d.text(`${a.label}, ID ${a.id}`, { size: 10, bold: true });
    d.text(a.supported ? `${a.summary.meanVisibleJoints.toFixed(1)} of 17 points visible on average; detector ${a.summary.meanDetScore.toFixed(2)}; ${tl.filter((p) => p.est.confidence >= CONFIDENT).length} of ${tl.length} movement windows named.` : "Detected only: no skeleton or movement estimate for this animal.", { size: 9, color: DUST });
    d.gap(3);
  }
  performance(d, meta, null);
  limits(d);
  return d.pdf.save();
}

export type { PDFPage };
