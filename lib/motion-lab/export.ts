import { PDFDocument, StandardFonts, rgb, type PDFFont, type PDFPage } from "pdf-lib";
import { anglesOf, CONFIDENT, gaitTimeline, GAIT_LABEL, visibleCount } from "./analysis";
import { ANGLES, KEYPOINTS, KP_COUNT } from "./skeleton";
import type { GaitName, Sample, SessionMeta } from "./types";

/** Everything exported comes from the stored measurements of the session; no value is filled in or invented. */

const csvCell = (v: string | number) => {
  const s = String(v);
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
};

/**
 * One row per analysed frame. Coordinates are pixels of the source video (width and height are in the first comment line);
 * empty cells mean "no horse tracked" or "point not visible". t_ms is the session clock (video time for uploads).
 */
export function toCsv(meta: SessionMeta, samples: Sample[]): string {
  const head = ["t_ms", "frame", "horse_detected", "detector_score", "box_x1", "box_y1", "box_x2", "box_y2", "visible_joints"];
  for (const n of KEYPOINTS) head.push(`${n}_x`, `${n}_y`, `${n}_score`);
  for (const a of ANGLES) head.push(`angle_${a.id}_deg`);
  head.push("detector_ms", "pose_ms", "frame_ms");
  const lines = [
    `# BSAH Motion Lab session ${meta.id} "${meta.name.replace(/\n/g, " ")}" source=${meta.source} video=${meta.videoWidth}x${meta.videoHeight} created=${meta.createdAt}`,
    `# Experimental estimates from an on-device pose model. Not a veterinary or lameness assessment. Models: ${meta.models.detector}; ${meta.models.pose}.`,
    head.join(","),
  ];
  samples.forEach((s, i) => {
    const has = s.kp.length >= KP_COUNT * 3;
    const row: (string | number)[] = [Math.round(s.t), i, has ? 1 : 0, has ? s.det.toFixed(3) : "", ...(s.box ?? ["", "", "", ""]), has ? visibleCount(s.kp) : ""];
    for (let k = 0; k < KP_COUNT; k++) row.push(has ? s.kp[k * 3] : "", has ? s.kp[k * 3 + 1] : "", has ? s.kp[k * 3 + 2] : "");
    const ang = has ? anglesOf(s.kp) : {};
    for (const a of ANGLES) row.push(ang[a.id] !== undefined ? (ang[a.id] as number).toFixed(1) : "");
    row.push(s.detMs.toFixed(1), s.poseMs.toFixed(1), s.totalMs.toFixed(1));
    lines.push(row.map(csvCell).join(","));
  });
  return lines.join("\n") + "\n";
}

export function toJson(meta: SessionMeta, samples: Sample[]): string {
  return JSON.stringify({ format: "bsah-motion-lab-session/1", meta: { ...meta, thumbnail: undefined }, samples }, null, 0);
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

// ------------------------------------------------------------------ PDF report

const INK = rgb(0.19, 0.145, 0.118), DUST = rgb(0.435, 0.357, 0.294), CHEST = rgb(0.47, 0.28, 0.184);
const ascii = (s: string) => s.replace(/[^\x20-\x7e]/g, " ");

async function dataUrlBytes(url: string): Promise<Uint8Array> {
  const res = await fetch(url);
  return new Uint8Array(await res.arrayBuffer());
}

/** A4 report: session facts, summary measures, gait shares over time, joint-angle ranges, the clearest frame, and the limits of the method. */
export async function buildReport(meta: SessionMeta, samples: Sample[], charts: { title: string; png: string }[]): Promise<Uint8Array> {
  const pdf = await PDFDocument.create();
  const font = await pdf.embedFont(StandardFonts.Helvetica), bold = await pdf.embedFont(StandardFonts.HelveticaBold);
  const W = 595.28, H = 841.89, M = 48;
  let page = pdf.addPage([W, H]);
  let y = H - M;
  const text = (t: string, o: { size?: number; font?: PDFFont; color?: ReturnType<typeof rgb>; x?: number; max?: number } = {}) => {
    const size = o.size ?? 10, f = o.font ?? font, maxW = o.max ?? W - 2 * M - (o.x ?? 0);
    const words = ascii(t).split(/\s+/);
    let line = "";
    const flush = () => { if (!line) return; page.drawText(line, { x: M + (o.x ?? 0), y, size, font: f, color: o.color ?? INK }); y -= size * 1.45; line = ""; };
    for (const w of words) { const next = line ? `${line} ${w}` : w; if (f.widthOfTextAtSize(next, size) > maxW) { flush(); line = w; } else line = next; }
    flush();
  };
  const ensure = (need: number) => { if (y - need < M) { page = pdf.addPage([W, H]); y = H - M; } };
  const rule = () => { page.drawLine({ start: { x: M, y }, end: { x: W - M, y }, thickness: 0.5, color: DUST }); y -= 10; };

  text("BLACK STALLION ACADEMY OF HORSEMANSHIP", { size: 8, font: bold, color: CHEST }); y -= 18;
  text("Motion Lab session report", { size: 22, font: bold }); y -= 4;
  text(`${meta.name} | ${meta.source === "camera" ? "recorded with the camera" : "uploaded video"} | ${new Date(meta.createdAt).toLocaleString("en-GB", { timeZone: "Asia/Kolkata" })} IST`, { size: 9, color: DUST });
  y -= 6; rule();

  const s = meta.summary;
  const rows: [string, string][] = [
    ["Duration analysed", `${(s.durationMs / 1000).toFixed(1)} s (${s.frames} frames, video ${meta.videoWidth} x ${meta.videoHeight})`],
    ["Horse tracked", `${s.coveragePct.toFixed(0)}% of frames, mean detector score ${s.meanDetScore.toFixed(2)}`],
    ["Visible joints", `${s.meanVisibleJoints.toFixed(1)} of 17 on average`],
    ["Dominant gait (estimate)", `${GAIT_LABEL[s.dominantGait]}${s.strideHzMedian ? `, about ${s.strideHzMedian.toFixed(2)} strides/s (${(s.strideHzMedian * 60).toFixed(0)} per minute)` : ""}`],
    ["Inference speed", `${s.meanFps.toFixed(1)} frames/s, ${s.meanLatencyMs.toFixed(0)} ms per frame (95th percentile ${s.p95LatencyMs.toFixed(0)} ms)`],
    ["Models", `${meta.models.detector}; ${meta.models.pose}; ${meta.models.runtime} on ${meta.models.accelerator === "webgpu" ? "WebGPU" : "WebAssembly (CPU)"}`],
  ];
  for (const [k, v] of rows) { ensure(28); text(k.toUpperCase(), { size: 7.5, font: bold, color: DUST }); text(v, { size: 10 }); y -= 3; }

  y -= 4; ensure(60); text("Gait over time", { size: 13, font: bold }); y -= 2;
  const timeline = gaitTimeline(samples);
  if (!timeline.length) text("Less than two seconds of the horse in view: no gait estimate.", { color: DUST });
  else {
    const shares = Object.entries(s.gaitShares).sort((a, b) => b[1] - a[1]);
    text(shares.map(([g, v]) => `${GAIT_LABEL[g as GaitName]} ${(v * 100).toFixed(0)}%`).join("   "), { size: 10 });
    const barW = W - 2 * M, barH = 12;
    const colours: Record<GaitName, ReturnType<typeof rgb>> = { standing: rgb(0.83, 0.77, 0.68), walk: rgb(0.72, 0.54, 0.38), trot: rgb(0.47, 0.28, 0.18), canter: rgb(0.29, 0.2, 0.15), gallop: rgb(0.1, 0.08, 0.07), unclear: rgb(0.91, 0.87, 0.81) };
    y -= 4;
    timeline.forEach((p, i) => {
      const g: GaitName = p.est.confidence >= CONFIDENT ? p.est.gait : "unclear";
      page.drawRectangle({ x: M + (i / timeline.length) * barW, y: y - barH, width: barW / timeline.length + 0.4, height: barH, color: colours[g] });
    });
    y -= barH + 12;
  }

  y -= 2; ensure(110); text("Joint angle ranges (degrees)", { size: 13, font: bold }); y -= 2;
  const anyAngle = ANGLES.some((a) => s.angleRanges[a.id]);
  if (!anyAngle) text("No joint was visible often enough to measure.", { color: DUST });
  for (const a of ANGLES) {
    const r = s.angleRanges[a.id];
    if (r) { ensure(16); text(`${a.label}: min ${r.min.toFixed(0)}, mean ${r.mean.toFixed(0)}, max ${r.max.toFixed(0)}`, { size: 10 }); }
  }

  for (const c of charts) {
    ensure(190);
    y -= 6; text(c.title, { size: 11, font: bold });
    const img = await pdf.embedPng(await dataUrlBytes(c.png));
    const w = W - 2 * M, h = (img.height / img.width) * w;
    ensure(h + 8);
    page.drawImage(img, { x: M, y: y - h, width: w, height: h }); y -= h + 8;
  }

  if (meta.thumbnail) {
    try {
      const img = await pdf.embedJpg(await dataUrlBytes(meta.thumbnail));
      const w = 300, h = (img.height / img.width) * w;
      ensure(h + 40); y -= 6; text("Clearest frame (skeleton drawn from the model output)", { size: 11, font: bold });
      page.drawImage(img, { x: M, y: y - h, width: w, height: h }); y -= h + 8;
    } catch { /* thumbnail is optional */ }
  }

  ensure(120); y -= 6; rule();
  text("How to read this report", { size: 11, font: bold });
  text("Skeleton points are predicted by RTMPose-m trained on AP-10K, a general animal data set: eyes, nose, neck, root of tail, and for each leg a shoulder or hip, elbow or knee and paw. They are not hoof, fetlock or hock markers. Angles and the gait label are estimates from those points and from the paw movement relative to the body; they depend on the camera angle, the light and how clearly the legs are seen. The gait method needs a steady side or three-quarter view for several seconds.", { size: 9, color: DUST });
  y -= 2;
  text("This is an experimental coaching aid. It is not a medical or veterinary diagnosis and must not be used to judge lameness or fitness. Ask a qualified equine professional.", { size: 9, font: bold, color: INK });
  return pdf.save();
}

export type { PDFPage };
