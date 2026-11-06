"use client";

import { useCallback, useEffect, useMemo, useRef, useState, useSyncExternalStore } from "react";
import { angleTrace, anglesOf, estimateGait, gaitTimeline, GAIT_WINDOW_S, limbTrace, mainAnimal, sampleAt, samplesOf, summarize, summarizeAnimals, trackIds, visibleCount, frameCount } from "@/lib/motion-lab/analysis";
import { drawAnimals, drawChart as drawChartInto, readPalette, type DrawAnimal, type Series } from "@/lib/motion-lab/draw";
import { buildAnimalReport, buildSummaryReport, download, safeName, toCsv, toJson } from "@/lib/motion-lab/export";
import { ModelsMissingError, MotionEstimator, type AnimalFrame, type FrameResult, type Status } from "@/lib/motion-lab/runtime";
import { SPECIES, type SpeciesKey } from "@/lib/motion-lab/species";
import { PoseSmoother } from "@/lib/motion-lab/smoothing";
import { KP_COUNT } from "@/lib/motion-lab/skeleton";
import { deleteSession, listSessions, loadSession, saveSession } from "@/lib/motion-lab/store";
import type { AnimalInfo, Angles, GaitEstimate, Sample, SessionMeta } from "@/lib/motion-lab/types";
import { cloudSave, type CloudResult } from "@/app/motion-lab/cloud";
import { clock, fmt, GaitCard, JointTable, Meter, SessionCard, Stat, TimeChart } from "./Panels";

type Consent = { camera: boolean; record: boolean };
/** One animal in view right now: what the panels need to name it and, for the selected one, measure it. */
type LiveAnimal = { id: number; name: string; species: SpeciesKey | null; supported: boolean; unsure: boolean; det: number; share: number; kp: number[] | null; box: Sample["box"] };
type Live = { detected: boolean; det: number; visible: number; fps: number; detMs: number; poseMs: number; totalMs: number; kp: number[] | null; angles: Angles; gait: GaitEstimate | null; frames: number; animals: LiveAnimal[]; sel: LiveAnimal | null };
type Mode = "idle" | "camera" | "analyzing" | "replay";
type Load = { phase: "idle" | "loading" | "ready" | "missing" | "error"; message: string };
type Replay = { meta: SessionMeta; samples: Sample[]; url: string | null };

const CONSENT_KEY = "bsah-motion-lab-consent-v1";
const ANALYSIS_FPS = 15;
const EMPTY: Live = { detected: false, det: 0, visible: 0, fps: 0, detMs: 0, poseMs: 0, totalMs: 0, kp: null, angles: {}, gait: null, frames: 0, animals: [], sel: null };
const FRAME_BUCKETS = 6;

/** "Dog 2", or "Animal 2" while the species vote is split; the label on the box adds the confidence and anything not offered. */
const nameOf = (id: number, species: SpeciesKey | null) => `${species ? SPECIES[species].label : "Animal"} ${id}`;
const tagOf = (a: LiveAnimal) => `${a.name} · ${a.species ? `${Math.round(a.det * 100)}%` : "species unsure"}${a.species && !a.supported ? " · detected only" : ""}`;

type Bank = Map<number, Map<number, { score: number; jpeg: string; t: number }>>;

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

/** The permissions a person has given, kept in localStorage and read as an external store (server and first paint: nothing given). */
const consentListeners = new Set<() => void>();
const noop = () => () => {};
const hasWebGpu = () => "gpu" in navigator;
const noGpu = () => false;
const readConsentRaw = () => { try { return localStorage.getItem(CONSENT_KEY) ?? ""; } catch { return ""; } };
function useConsent(): [Consent, (c: Consent) => void] {
  const raw = useSyncExternalStore(
    (cb) => { consentListeners.add(cb); window.addEventListener("storage", cb); return () => { consentListeners.delete(cb); window.removeEventListener("storage", cb); }; },
    readConsentRaw, () => "",
  );
  const consent = useMemo<Consent>(() => { try { const c = JSON.parse(raw || "null") as Consent | null; return { camera: !!c?.camera, record: !!c?.record }; } catch { return { camera: false, record: false }; } }, [raw]);
  const save = useCallback((c: Consent) => { try { localStorage.setItem(CONSENT_KEY, JSON.stringify(c)); } catch { /* private mode: lasts until the tab closes */ } consentListeners.forEach((l) => l()); }, []);
  return [consent, save];
}

function cameraError(e: unknown): string {
  const name = (e as { name?: string })?.name;
  if (name === "NotAllowedError" || name === "SecurityError") return "The browser blocked the camera. Allow camera access for this site in the browser's address bar or settings, then press Open camera again.";
  if (name === "NotFoundError" || name === "OverconstrainedError") return "No camera was found on this device.";
  if (name === "NotReadableError" || name === "AbortError") return "The camera is in use by another app or tab. Close it and try again.";
  return "The camera could not be opened.";
}

function pickMime(): string {
  if (typeof MediaRecorder === "undefined") return "";
  for (const m of ["video/webm;codecs=vp9", "video/webm;codecs=vp8", "video/webm", "video/mp4"]) if (MediaRecorder.isTypeSupported(m)) return m;
  return "";
}

/** One stored sample per animal in the frame, or a single empty one (ID 0) so a frame with no animal still counts for coverage and speed. */
function frameSamples(res: FrameResult, t: number): Sample[] {
  if (res.animals.length) return res.animals.map((a) => ({ ...a.sample, t }));
  return [{ t, id: 0, sp: "", det: 0, box: null, kp: [], detMs: res.detMs, poseMs: res.poseMs, totalMs: res.totalMs }];
}

export function MotionLab() {
  const stageRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const estRef = useRef<MotionEstimator | null>(null);
  const smoothers = useRef(new Map<number, PoseSmoother>());
  const selRef = useRef<number | null>(null);
  const bank = useRef<Bank>(new Map());
  const lastBank = useRef(new Map<number, number>());
  const token = useRef(0);                       // cancels the running loop
  const streamRef = useRef<MediaStream | null>(null);
  const liveClock0 = useRef(0);
  const liveBuf = useRef<Sample[]>([]);
  const lastDraw = useRef<DrawAnimal[]>([]);
  const fpsEma = useRef(0);
  const lastTick = useRef(0);
  const lastGait = useRef(0);
  const lastUi = useRef(0);
  const frames = useRef(0);
  // recording
  const rec = useRef<{ recorder: MediaRecorder | null; chunks: BlobPart[]; start: number; pausedMs: number; pauseAt: number; state: "off" | "on" | "paused"; auto: boolean; samples: Sample[]; mime: string; w: number; h: number } | null>(null);
  const stable = useRef({ since: 0, lostSince: 0 });
  const cancelAnalysis = useRef(false);
  const autoRef = useRef(false);
  const cursorRef = useRef(0);
  const pending = useRef<(() => void) | null>(null);
  const recordAllowed = useRef(false);

  const [consent, saveConsent] = useConsent();
  const gpuAvailable = useSyncExternalStore(noop, hasWebGpu, noGpu);
  const [dlg, setDlg] = useState<{ want: "camera" | "record"; cam: boolean; rec: boolean } | null>(null);
  const [load, setLoad] = useState<Load>({ phase: "idle", message: "" });
  const [accelerator, setAccelerator] = useState<"wasm" | "webgpu">("wasm");
  const [mode, setMode] = useState<Mode>("idle");
  const [notice, setNotice] = useState<{ kind: "info" | "error"; text: string } | null>(null);
  const [live, setLive] = useState<Live>(EMPTY);
  const [chartSamples, setChartSamples] = useState<Sample[]>([]);
  const [modelInfo, setModelInfo] = useState<MotionEstimator["info"] | null>(null);
  const [recUi, setRecUi] = useState<{ state: "off" | "on" | "paused"; ms: number }>({ state: "off", ms: 0 });
  const [progress, setProgress] = useState<{ done: number; total: number } | null>(null);
  const [showSkeleton, setShowSkeleton] = useState(true);
  const [showBox, setShowBox] = useState(true);
  const [autoRecord, setAutoRecord] = useState(false);
  const [sessions, setSessions] = useState<SessionMeta[]>([]);
  const [storeError, setStoreError] = useState<string | null>(null);
  const [replay, setReplay] = useState<Replay | null>(null);
  const [cursor, setCursor] = useState(0);
  const [busy, setBusy] = useState(false);
  const [cloud, setCloud] = useState<Record<string, "saved" | "saving" | "signin">>({});
  const [selectedId, setSelectedId] = useState<number | null>(null);

  const flags = useRef({ showSkeleton, showBox });
  useEffect(() => { flags.current = { showSkeleton, showBox }; }, [showSkeleton, showBox]);

  // ---------------------------------------------------------------- setup
  useEffect(() => {
    listSessions().then(setSessions).catch((e: Error) => setStoreError(e.message));
  }, []);

  const syncCanvas = useCallback(() => {
    const c = canvasRef.current, s = stageRef.current;
    if (!c || !s) return;
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    const w = Math.round(s.clientWidth * dpr), h = Math.round(s.clientHeight * dpr);
    if (c.width !== w || c.height !== h) { c.width = w; c.height = h; }
  }, []);

  const paint = useCallback((animals: DrawAnimal[], dims?: { w: number; h: number }) => {
    syncCanvas();
    const c = canvasRef.current, v = videoRef.current;
    if (!c || !v) return;
    const ctx = c.getContext("2d");
    if (!ctx) return;
    ctx.clearRect(0, 0, c.width, c.height);
    const vw = v.videoWidth || dims?.w || 0, vh = v.videoHeight || dims?.h || 0;
    if (!animals.length || !vw || !vh) return;
    drawAnimals(ctx, animals, vw, vh, readPalette(), { skeleton: flags.current.showSkeleton, box: flags.current.showBox, dpr: Math.min(2, window.devicePixelRatio || 1) });
  }, [syncCanvas]);

  useEffect(() => {
    const s = stageRef.current;
    if (!s) return;
    const ro = new ResizeObserver(() => { syncCanvas(); paint(lastDraw.current); });
    ro.observe(s);
    return () => ro.disconnect();
  }, [syncCanvas, paint]);

  const ensureEstimator = useCallback(async (): Promise<MotionEstimator | null> => {
    if (estRef.current) return estRef.current;
    setLoad({ phase: "loading", message: "Starting the on-device runtime" });
    const onStatus = (s: Status) => setLoad({ phase: s.phase === "ready" ? "ready" : "loading", message: s.message });
    try {
      let est: MotionEstimator;
      try { est = await MotionEstimator.create(accelerator, onStatus); }
      catch (e) {
        if (e instanceof ModelsMissingError || accelerator === "wasm") throw e;
        setNotice({ kind: "info", text: "The graphics accelerator could not run the models; using the processor instead." });
        setAccelerator("wasm");
        est = await MotionEstimator.create("wasm", onStatus);
      }
      estRef.current = est;
      // Benchmarks and tests in a development browser drive the models directly through this handle; production builds never set it.
      if (process.env.NODE_ENV !== "production") (window as unknown as { __bsahMotion?: MotionEstimator }).__bsahMotion = est;
      setModelInfo(est.info);
      setLoad({ phase: "ready", message: "Ready" });
      return est;
    } catch (e) {
      if (e instanceof ModelsMissingError) setLoad({ phase: "missing", message: "The AI model files are not installed on this server yet, so nothing can be tracked. They are fetched by `npm run motion-lab:assets` (see docs/MOTION_LAB.md)." });
      else setLoad({ phase: "error", message: "The AI runtime could not start in this browser. A recent Chrome, Edge, Safari or Firefox is needed." });
      return null;
    }
  }, [accelerator]);

  const stopLoop = useCallback(() => { token.current++; }, []);

  const stopCamera = useCallback(() => {
    stopLoop();
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
    const v = videoRef.current;
    if (v) { v.pause(); v.srcObject = null; }
    estRef.current?.reset();
    smoothers.current.clear();
    lastDraw.current = []; paint([]);
  }, [paint, stopLoop]);

  useEffect(() => () => { token.current++; streamRef.current?.getTracks().forEach((t) => t.stop()); estRef.current?.dispose(); estRef.current = null; if (rec.current?.recorder && rec.current.recorder.state !== "inactive") rec.current.recorder.stop(); }, []);

  // ---------------------------------------------------------------- results shared by camera and upload
  /** A small JPEG of the current video frame with every animal drawn; `highlight` is drawn solid, the rest dashed. */
  const takeFrame = useCallback((list: DrawAnimal[], highlight: number): string | null => {
    const v = videoRef.current;
    if (!v || !v.videoWidth) return null;
    const w = 480, h = Math.round((w * v.videoHeight) / v.videoWidth);
    const c = document.createElement("canvas"); c.width = w; c.height = h;
    const ctx = c.getContext("2d");
    if (!ctx) return null;
    ctx.drawImage(v, 0, 0, w, h);
    drawAnimals(ctx, list.map((a) => ({ ...a, selected: a.id === highlight })), v.videoWidth, v.videoHeight, readPalette(), { dpr: 0.7 });
    try { return c.toDataURL("image/jpeg", 0.72); } catch { return null; }
  }, []);

  /** Keeps, per animal and time bucket, the clearest annotated frame; the report picks up to three of them from different moments. */
  const bankFrames = useCallback((list: DrawAnimal[], animals: LiveAnimal[], t: number, bucket: number) => {
    const now = performance.now();
    for (const a of animals) {
      if (!a.kp && !a.box) continue;
      const vis = a.kp ? visibleCount(a.kp) : 0;
      const score = vis + a.det * 3;
      const per = bank.current.get(a.id) ?? new Map();
      const cur = per.get(bucket);
      if (cur && cur.score >= score) continue;
      if (now - (lastBank.current.get(a.id) ?? 0) < 400) continue;
      const jpeg = takeFrame(list, a.id);
      if (jpeg) { per.set(bucket, { score, jpeg, t }); bank.current.set(a.id, per); lastBank.current.set(a.id, now); }
    }
  }, [takeFrame]);

  /** Turns what the live loop or the analysis produced into one stored session: every animal's summary, frames and the shared timings. */
  const finalize = useCallback(async (source: "camera" | "upload", samples: Sample[], blob: Blob | null, wallMs: number, name: string) => {
    const v = videoRef.current;
    const est = estRef.current;
    const animals = summarizeAnimals(samples, wallMs).map((a): AnimalInfo => {
      const per = bank.current.get(a.id);
      if (!per) return a;
      const picks = [...per.values()].sort((x, y) => x.t - y.t);
      const chosen = picks.length <= 3 ? picks : [picks[0], picks[Math.floor(picks.length / 2)], picks[picks.length - 1]];
      return { ...a, frames: chosen.map((p) => p.jpeg) };
    });
    const main = mainAnimal(animals);
    const best = main ? [...(bank.current.get(main.id)?.values() ?? [])].sort((x, y) => y.score - x.score)[0]?.jpeg : undefined;
    const meta: SessionMeta = {
      id: crypto.randomUUID(), name, createdAt: new Date().toISOString(), source,
      videoWidth: v?.videoWidth ?? 0, videoHeight: v?.videoHeight ?? 0, hasVideo: !!blob,
      summary: main?.summary ?? summarize([], wallMs, [], "horse", frameCount(samples)), animals, fleetingTracks: trackIds(samples).length - animals.length, wallMs, frameCount: frameCount(samples), thumbnail: best,
      models: { detector: est?.info.detector ?? "", pose: est?.info.pose ?? "", runtime: est?.info.runtime ?? "", accelerator: est?.info.accelerator ?? "wasm" },
    };
    bank.current = new Map();
    try {
      await saveSession(meta, samples, blob);
      setSessions(await listSessions());
      setNotice({ kind: "info", text: `Session saved on this device: ${meta.name}${animals.length > 1 ? ` (${animals.length} animals tracked)` : ""}. Open it in the history below to replay, export or build a report.` });
    } catch (e) {
      setNotice({ kind: "error", text: `${(e as Error).message} The session was not saved; nothing was uploaded.` });
    }
    return meta;
  }, []);

  /**
   * Shared by the camera loop and the upload analysis: turns a frame result into the overlay (smoothed for the eye; the stored
   * measurement stays raw) and into the per-animal facts the panels show, and settles which animal the panels follow.
   */
  const present = useCallback((res: FrameResult, tMs: number): { draw: DrawAnimal[]; animals: LiveAnimal[]; sel: LiveAnimal | null } => {
    const sm = smoothers.current;
    const seen = new Set<number>();
    const draw: DrawAnimal[] = [];
    const animals: LiveAnimal[] = [];
    for (const a of res.animals as AnimalFrame[]) {
      seen.add(a.id);
      let kp: number[] | null = null;
      if (a.pose) {
        let f = sm.get(a.id);
        if (!f) { f = new PoseSmoother(); sm.set(a.id, f); }
        const p = f.smooth(a.pose, tMs);
        kp = []; for (let k = 0; k < KP_COUNT; k++) kp.push(p.x[k], p.y[k], a.pose.score[k]);
      } else sm.get(a.id)?.reset();
      const live: LiveAnimal = { id: a.id, name: nameOf(a.id, a.species), species: a.species, supported: a.supported, unsure: a.unsure, det: a.sample.det, share: a.share, kp: a.sample.kp.length ? a.sample.kp : null, box: a.sample.box };
      animals.push(live);
      draw.push({ id: a.id, label: tagOf(live), kp, box: a.sample.box, selected: false });
    }
    for (const id of [...sm.keys()]) if (!seen.has(id)) sm.delete(id);
    const want = selRef.current;
    const sel = animals.find((a) => a.id === want) ?? animals.find((a) => a.supported) ?? animals[0] ?? null;
    for (const d of draw) d.selected = d.id === sel?.id;
    return { draw, animals, sel };
  }, []);

  // ---------------------------------------------------------------- recording
  const startRecording = useCallback((auto: boolean) => {
    const stream = streamRef.current, v = videoRef.current;
    if (!stream || !v || rec.current?.state === "on") return;
    if (!recordAllowed.current) { setDlg({ want: "record", cam: consent.camera, rec: false }); return; }
    const mime = pickMime();
    let recorder: MediaRecorder | null = null;
    try { recorder = new MediaRecorder(stream, mime ? { mimeType: mime, videoBitsPerSecond: 2_500_000 } : undefined); } catch { setNotice({ kind: "error", text: "This browser cannot record video. Tracking and measurements still work, and the session is saved without a video." }); }
    const r = { recorder, chunks: [] as BlobPart[], start: performance.now(), pausedMs: 0, pauseAt: 0, state: "on" as const, auto, samples: [] as Sample[], mime: recorder?.mimeType ?? mime, w: v.videoWidth, h: v.videoHeight };
    if (recorder) { recorder.ondataavailable = (e) => { if (e.data.size) r.chunks.push(e.data); }; recorder.start(1000); }
    rec.current = r;
    bank.current = new Map();
    setRecUi({ state: "on", ms: 0 });
    setNotice({ kind: "info", text: auto ? "Recording started automatically: an animal has been steady in view." : "Recording." });
  }, [consent.camera]);

  const pauseRecording = useCallback(() => {
    const r = rec.current;
    if (!r) return;
    if (r.state === "on") { r.recorder?.pause(); r.state = "paused"; r.pauseAt = performance.now(); setRecUi({ state: "paused", ms: r.pauseAt - r.start - r.pausedMs }); }
    else if (r.state === "paused") { r.recorder?.resume(); r.pausedMs += performance.now() - r.pauseAt; r.state = "on"; setRecUi({ state: "on", ms: performance.now() - r.start - r.pausedMs }); }
  }, []);

  const stopRecording = useCallback(async () => {
    const r = rec.current;
    if (!r) return;
    if (r.state === "paused") r.pausedMs += performance.now() - r.pauseAt;
    const wall = performance.now() - r.start - r.pausedMs;
    rec.current = null;
    setRecUi({ state: "off", ms: 0 });
    const blob = await new Promise<Blob | null>((resolve) => {
      if (!r.recorder || r.recorder.state === "inactive") return resolve(r.chunks.length ? new Blob(r.chunks, { type: r.mime || "video/webm" }) : null);
      r.recorder.onstop = () => resolve(r.chunks.length ? new Blob(r.chunks, { type: r.mime || "video/webm" }) : null);
      r.recorder.stop();
    });
    if (r.samples.length < 3) { setNotice({ kind: "info", text: "That recording was too short to analyse, so it was not kept." }); return; }
    const stamp = new Date().toLocaleString("en-GB", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" });
    await finalize("camera", r.samples, blob, wall, `Camera session ${stamp}`);
  }, [finalize]);

  // ---------------------------------------------------------------- the live loop (camera)
  const runLoop = useCallback((est: MotionEstimator) => {
    const my = ++token.current;
    const v = videoRef.current as HTMLVideoElement;
    liveClock0.current = performance.now(); liveBuf.current = []; frames.current = 0; fpsEma.current = 0; lastTick.current = 0; lastGait.current = 0;
    stable.current = { since: 0, lostSince: 0 };
    est.reset(); smoothers.current.clear(); bank.current = new Map();
    const schedule = () => { if (my !== token.current) return; if ("requestVideoFrameCallback" in v) v.requestVideoFrameCallback(tick); else requestAnimationFrame(tick); };
    const tick = async () => {
      if (my !== token.current) return;
      if (v.readyState < 2 || !v.videoWidth) return schedule();
      const now = performance.now();
      let res: FrameResult;
      try { res = await est.processFrame(v, v.videoWidth, v.videoHeight, now - liveClock0.current); }
      catch { setNotice({ kind: "error", text: "The AI model stopped responding on this device. Close other tabs or try the upload option." }); return; }
      if (my !== token.current) return;
      frames.current++;
      const dt = now - lastTick.current; lastTick.current = now;
      if (dt > 0 && dt < 5000) fpsEma.current = fpsEma.current ? fpsEma.current * 0.85 + (1000 / dt) * 0.15 : 1000 / dt;
      const t = now - liveClock0.current;
      const frame = frameSamples(res, t);
      liveBuf.current.push(...frame);
      const keepFrom = t - 14_000;
      let drop = 0; while (drop < liveBuf.current.length && liveBuf.current[drop].t < keepFrom) drop++;
      if (drop) liveBuf.current.splice(0, drop);
      const { draw, animals, sel } = present(res, now);
      lastDraw.current = draw;
      paint(draw);
      // recording bookkeeping
      const r = rec.current;
      if (r && r.state === "on") {
        const rt = now - r.start - r.pausedMs;
        r.samples.push(...frameSamples(res, rt));
        bankFrames(draw, animals, rt, Math.min(FRAME_BUCKETS - 1, Math.floor(rt / 4000)));
      }
      const vis = sel?.kp ? visibleCount(sel.kp) : 0;
      // automatic recording: an animal steady in view for two seconds starts it; five seconds without one ends an automatic recording
      const st = stable.current;
      if (res.detected && vis >= 8) { st.lostSince = 0; if (!st.since) st.since = now; } else { st.since = 0; if (!st.lostSince) st.lostSince = now; }
      if (autoRef.current && !rec.current && st.since && now - st.since >= 2000) startRecording(true);
      if (rec.current?.auto && rec.current.state === "on" && st.lostSince && now - st.lostSince >= 5000) void stopRecording();
      // UI at about 4 Hz
      if (now - lastGait.current > 500) {
        lastGait.current = now;
        const gait = sel && sel.supported && sel.species ? estimateGait(samplesOf(liveBuf.current, sel.id), t, GAIT_WINDOW_S, sel.species) : null;
        setLive((p) => ({ ...p, gait }));
      }
      if (now - lastUi.current > 250) {
        lastUi.current = now;
        const kp = sel?.kp ?? null;
        setLive((p) => ({ detected: res.detected, det: sel?.det ?? 0, visible: vis, fps: fpsEma.current, detMs: res.detMs, poseMs: res.poseMs, totalMs: res.totalMs, kp, angles: kp ? anglesOf(kp) : {}, gait: sel?.id === p.sel?.id ? p.gait : null, frames: frames.current, animals, sel }));
        setChartSamples(sel ? samplesOf(liveBuf.current, sel.id).slice(-320) : []);
        if (rec.current) setRecUi({ state: rec.current.state, ms: (rec.current.state === "on" ? now : rec.current.pauseAt) - rec.current.start - rec.current.pausedMs });
      }
      schedule();
    };
    schedule();
  }, [paint, present, bankFrames, startRecording, stopRecording]);

  useEffect(() => { autoRef.current = autoRecord; }, [autoRecord]);
  useEffect(() => { recordAllowed.current = consent.record; }, [consent.record]);

  // ---------------------------------------------------------------- opening the camera
  const resetStage = useCallback(() => {
    cancelAnalysis.current = true;
    stopCamera();
    if (rec.current) { const r = rec.current; rec.current = null; if (r.recorder && r.recorder.state !== "inactive") { r.recorder.ondataavailable = null; r.recorder.stop(); } setRecUi({ state: "off", ms: 0 }); }
    setReplay((p) => { if (p?.url) URL.revokeObjectURL(p.url); return null; });
    setProgress(null); setLive(EMPTY); setMode("idle");
  }, [stopCamera]);

  const openCamera = useCallback(async (facing: "environment" | "user" = "environment") => {
    resetStage();
    setNotice(null);
    if (!window.isSecureContext || !navigator.mediaDevices?.getUserMedia) { setNotice({ kind: "error", text: "This browser only opens the camera on secure (https) pages. You can still upload a video." }); return; }
    const est = await ensureEstimator();
    if (!est) return;
    let stream: MediaStream;
    try { stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: { ideal: facing }, width: { ideal: 1280 }, height: { ideal: 720 }, frameRate: { ideal: 30 } }, audio: false }); }
    catch (e) { setNotice({ kind: "error", text: cameraError(e) }); return; }
    streamRef.current = stream;
    const v = videoRef.current as HTMLVideoElement;
    v.srcObject = stream; v.muted = true; v.playsInline = true; v.controls = false;
    try { await v.play(); } catch { /* autoplay policy: the stream still renders on the next frame */ }
    stream.getVideoTracks()[0]?.addEventListener("ended", () => { setNotice({ kind: "error", text: "The camera stopped (it was unplugged or taken by another app)." }); resetStage(); });
    setMode("camera");
    runLoop(est);
  }, [ensureEstimator, resetStage, runLoop]);

  // ---------------------------------------------------------------- replay
  const openReplay = useCallback(async (id: string) => {
    setBusy(true);
    try {
      resetStage();
      const s = await loadSession(id);
      if (!s) { setNotice({ kind: "error", text: "That session could not be found on this device." }); return; }
      const url = s.video ? URL.createObjectURL(s.video) : null;
      setReplay({ meta: s.meta, samples: s.samples, url });
      setMode("replay"); setCursor(0); setLive(EMPTY);
    } catch (e) { setNotice({ kind: "error", text: (e as Error).message }); } finally { setBusy(false); }
  }, [resetStage]);

  // ---------------------------------------------------------------- upload analysis
  const seekTo = (v: HTMLVideoElement, t: number) => new Promise<void>((resolve) => {
    const done = () => { v.removeEventListener("seeked", done); resolve(); };
    v.addEventListener("seeked", done);
    v.currentTime = Math.min(t, Math.max(0, v.duration - 0.001));
  });

  const analyzeFile = useCallback(async (file: File) => {
    resetStage();
    cancelAnalysis.current = false;
    setNotice(null);
    if (!file.type.startsWith("video/") && !/\.(mp4|mov|m4v|webm|mkv|avi)$/i.test(file.name)) { setNotice({ kind: "error", text: "Choose a video file (MP4, MOV or WebM)." }); return; }
    const est = await ensureEstimator();
    if (!est) return;
    const v = videoRef.current as HTMLVideoElement;
    const url = URL.createObjectURL(file);
    v.srcObject = null; v.src = url; v.muted = true; v.playsInline = true; v.controls = false;
    const ok = await new Promise<boolean>((resolve) => { v.onloadedmetadata = () => resolve(true); v.onerror = () => resolve(false); });
    if (!ok || !Number.isFinite(v.duration) || v.duration <= 0) { setNotice({ kind: "error", text: "This browser could not read that video. Try an MP4 (H.264) or WebM file." }); URL.revokeObjectURL(url); return; }
    setMode("analyzing");
    est.reset(); smoothers.current.clear(); bank.current = new Map();
    const samples: Sample[] = [];
    const total = Math.floor(v.duration * ANALYSIS_FPS);
    const wall0 = performance.now();
    for (let i = 0; i < total; i++) {
      if (cancelAnalysis.current) { URL.revokeObjectURL(url); setProgress(null); setMode("idle"); return; }
      const t = i / ANALYSIS_FPS;
      await seekTo(v, t);
      await Promise.race([new Promise<void>((r) => ("requestVideoFrameCallback" in v ? v.requestVideoFrameCallback(() => r()) : r())), sleep(120)]);
      let res: FrameResult;
      try { res = await est.processFrame(v, v.videoWidth, v.videoHeight, t * 1000); } catch { setNotice({ kind: "error", text: "The AI model stopped responding on this device during analysis." }); URL.revokeObjectURL(url); setProgress(null); setMode("idle"); return; }
      samples.push(...frameSamples(res, t * 1000));
      const { draw, animals, sel } = present(res, t * 1000);
      lastDraw.current = draw;
      paint(draw);
      bankFrames(draw, animals, t * 1000, Math.min(FRAME_BUCKETS - 1, Math.floor((i / Math.max(1, total)) * FRAME_BUCKETS)));
      liveBuf.current = samples.filter((x) => x.t >= t * 1000 - 14_000);
      const nowMs = performance.now();
      if (nowMs - lastUi.current > 200) {
        lastUi.current = nowMs;
        const kp = sel?.kp ?? null;
        const vis = kp ? visibleCount(kp) : 0;
        const gait = sel && sel.supported && sel.species ? estimateGait(samplesOf(liveBuf.current, sel.id), t * 1000, GAIT_WINDOW_S, sel.species) : null;
        setLive({ detected: res.detected, det: sel?.det ?? 0, visible: vis, fps: ((i + 1) / (nowMs - wall0)) * 1000, detMs: res.detMs, poseMs: res.poseMs, totalMs: res.totalMs, kp, angles: kp ? anglesOf(kp) : {}, gait, frames: i + 1, animals, sel });
        setChartSamples(sel ? samplesOf(liveBuf.current, sel.id).slice(-320) : []);
        setProgress({ done: i + 1, total });
        setCursor(t * 1000);
      }
    }
    const wall = performance.now() - wall0;
    setProgress({ done: total, total });
    const meta = await finalize("upload", samples, file, wall, file.name.replace(/\.[^.]+$/, "").slice(0, 60) || "Uploaded video");
    URL.revokeObjectURL(url);
    setProgress(null);
    if (meta) await openReplay(meta.id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [consent.record, ensureEstimator, finalize, paint, resetStage, present, bankFrames]);

  // the replayed session's animals and each one's own samples
  const replayInfo = useMemo(() => {
    if (!replay) return null;
    const animals = replay.meta.animals ?? summarizeAnimals(replay.samples, replay.meta.wallMs ?? 0);
    return { animals, byId: new Map(animals.map((a) => [a.id, samplesOf(replay.samples, a.id)] as const)) };
  }, [replay]);
  useEffect(() => { selRef.current = selectedId; }, [selectedId]);

  // load the recording (or nothing) into the video element once per replay
  useEffect(() => {
    if (mode !== "replay" || !replay) return;
    const v = videoRef.current;
    if (!v) return;
    v.srcObject = null;
    if (replay.url) {
      v.preload = "auto"; v.src = replay.url; v.muted = true; v.playsInline = true; v.controls = true;
      // Browser-recorded WebM has no duration in its header: seeking far ahead and back makes the player work it out (so the scrub bar works).
      v.addEventListener("loadedmetadata", () => {
        if (v.duration !== Infinity) { v.currentTime = 0.001; return; }   // paints the first frame instead of a black box
        const back = () => { v.removeEventListener("timeupdate", back); v.currentTime = 0; };
        v.addEventListener("timeupdate", back); v.currentTime = 1e101;
      }, { once: true });
    }
    else { v.removeAttribute("src"); v.load(); v.controls = false; }
  }, [mode, replay]);

  // keep overlay, cursor and live cards in step with the replayed video
  useEffect(() => {
    if (mode !== "replay" || !replay || !replayInfo) return;
    const v = videoRef.current;
    if (!v) return;
    const dims = { w: replay.meta.videoWidth, h: replay.meta.videoHeight };
    let raf = 0, stop = false;
    const draw = () => {
      if (stop) return;
      const t = (replay.url ? v.currentTime : cursorRef.current / 1000) * 1000;
      const here: LiveAnimal[] = [];
      for (const a of replayInfo.animals) {
        const own = replayInfo.byId.get(a.id) ?? [];
        const s = sampleAt(own, t);
        if (!s || t - s.t > 500) continue;
        here.push({ id: a.id, name: nameOf(a.id, a.species), species: a.species, supported: a.supported, unsure: !a.species, det: s.det, share: a.speciesShare, kp: s.kp.length ? s.kp : null, box: s.box });
      }
      const want = selRef.current;
      const sel = here.find((a) => a.id === want) ?? here.find((a) => a.supported) ?? here[0] ?? null;
      paint(here.map((a) => ({ id: a.id, label: tagOf(a), kp: a.kp, box: a.box, selected: a.id === sel?.id })), dims);
      setCursor(t);
      if (sel) {
        const own = replayInfo.byId.get(sel.id) ?? [];
        const s = sampleAt(own, t);
        const gait = sel.supported && sel.species ? estimateGait(own, t, GAIT_WINDOW_S, sel.species) : null;
        setLive({ detected: true, det: sel.det, visible: sel.kp ? visibleCount(sel.kp) : 0, fps: replay.meta.summary.meanFps, detMs: s?.detMs ?? 0, poseMs: s?.poseMs ?? 0, totalMs: s?.totalMs ?? 0, kp: sel.kp, angles: sel.kp ? anglesOf(sel.kp) : {}, gait, frames: s ? own.indexOf(s) + 1 : 0, animals: here, sel });
      } else setLive((p) => ({ ...p, detected: false, animals: [], sel: null, kp: null, angles: {}, visible: 0 }));
      raf = window.setTimeout(draw, 80) as unknown as number;
    };
    draw();
    return () => { stop = true; clearTimeout(raf); };
  }, [mode, replay, replayInfo, paint, selectedId]);
  useEffect(() => { cursorRef.current = cursor; }, [cursor]);

  // ---------------------------------------------------------------- consent
  const askThen = (want: "camera" | "record", run: () => void) => {
    if ((want === "camera" && consent.camera) || (want === "record" && consent.record)) { run(); return; }
    pending.current = run;
    setDlg({ want, cam: consent.camera, rec: consent.record });
  };
  const confirmConsent = () => {
    if (!dlg) return;
    const next = { camera: consent.camera || dlg.cam, record: consent.record || dlg.rec };
    recordAllowed.current = next.record;
    saveConsent(next);
    setDlg(null);
    const run = pending.current; pending.current = null;
    if (run && ((dlg.want === "camera" && next.camera) || (dlg.want === "record" && next.record))) setTimeout(run, 0);
  };

  // ---------------------------------------------------------------- charts
  const sessionMs = useMemo(() => (replay && replay.samples.length ? replay.samples[replay.samples.length - 1].t - replay.samples[0].t : 0), [replay]);
  const chartData = useMemo(() => {
    const pal = readPalette();
    const samples = mode === "replay" && replay ? (replayInfo?.byId.get(live.sel?.id ?? replayInfo.animals[0]?.id ?? 1) ?? []) : chartSamples;
    const endT = mode === "replay" ? cursor : samples.length ? samples[samples.length - 1].t : 0;
    const dur = mode === "replay" && replay ? sessionMs : 0;
    const whole = mode === "replay" && dur <= 40_000;
    const t1 = whole ? Math.max(dur, 1000) : Math.max(endT + (mode === "replay" ? 15_000 : 0), 10_000);
    const t0 = whole ? 0 : t1 - (mode === "replay" ? 30_000 : 10_000);
    const win = samples.filter((s) => s.t >= t0 - 500 && s.t <= t1 + 500);
    const sc = (id: string, label: string, color: string, pts: [number, number][]): Series => ({ id, label, color, pts });
    const limbs = limbTrace(win);
    return {
      t0, t1, cursor: mode === "replay" ? cursor : null,
      angles: [
        sc("el", "Elbow L", pal.chart[0], angleTrace(win, "elbow_l")), sc("er", "Elbow R", pal.chart[1], angleTrace(win, "elbow_r")),
        { ...sc("kl", "Knee L", pal.chart[2], angleTrace(win, "stifle_l")), dash: true }, { ...sc("kr", "Knee R", pal.chart[3], angleTrace(win, "stifle_r")), dash: true },
      ],
      limbs: [
        sc("lf", "Front L", pal.chart[0], limbs.map((p) => [p.t, p.lf] as [number, number])), sc("rf", "Front R", pal.chart[1], limbs.map((p) => [p.t, p.rf] as [number, number])),
        { ...sc("lh", "Hind L", pal.chart[2], limbs.map((p) => [p.t, p.lh] as [number, number])), dash: true }, { ...sc("rh", "Hind R", pal.chart[3], limbs.map((p) => [p.t, p.rh] as [number, number])), dash: true },
      ],
      perf: [
        sc("conf", "Detector score", pal.chart[0], win.map((s) => [s.t, s.det || NaN] as [number, number])),
        { ...sc("lat", "Frame time ÷ 100 ms", pal.chart[2], win.map((s) => [s.t, s.totalMs / 100] as [number, number])), dash: true },
      ],
    };
  }, [chartSamples, mode, replay, replayInfo, live.sel, cursor, sessionMs]);

  // ---------------------------------------------------------------- session actions
  /** `which`: an animal's ID for that animal's report, "summary" for the session overview. */
  const onReport = async (id: string, which: number | "summary") => {
    setBusy(true);
    try {
      const s = await loadSession(id);
      if (!s) return;
      const animals = s.meta.animals ?? summarizeAnimals(s.samples, s.meta.wallMs ?? 0);
      const meta = { ...s.meta, animals };
      if (which === "summary") {
        download(`motion-lab-${safeName(s.meta.name)}-summary.pdf`, new Blob([(await buildSummaryReport(meta, s.samples, animals)) as BlobPart], { type: "application/pdf" }));
        return;
      }
      const animal = animals.find((a) => a.id === which);
      if (!animal) return;
      const pal = readPalette();
      const ss = samplesOf(s.samples, animal.id);
      const t0 = ss.length ? ss[0].t : 0, t1 = ss.length ? ss[ss.length - 1].t : 1000;
      const mk = (title: string, series: Series[], y0: number, y1: number) => {
        const c = document.createElement("canvas"); c.width = 1400; c.height = 380;
        const ctx = c.getContext("2d");
        if (!ctx) return null;
        ctx.fillStyle = "#faf7f0"; ctx.fillRect(0, 0, c.width, c.height);
        drawChartInto(ctx, series, { t0, t1: Math.max(t0 + 1000, t1), y0, y1, pal, legend: true, dpr: 1.4 });
        return { title, png: c.toDataURL("image/png") };
      };
      const tl = animal.supported ? gaitTimeline(ss, 1, animal.species ?? "horse") : [];
      const l = limbTrace(ss);
      const charts = animal.supported ? [
        mk("Joint angles (degrees)", [{ id: "el", label: "Elbow L", color: pal.chart[0], pts: angleTrace(ss, "elbow_l") }, { id: "er", label: "Elbow R", color: pal.chart[1], pts: angleTrace(ss, "elbow_r") }, { id: "kl", label: "Knee L", color: pal.chart[2], dash: true, pts: angleTrace(ss, "stifle_l") }, { id: "kr", label: "Knee R", color: pal.chart[3], dash: true, pts: angleTrace(ss, "stifle_r") }], 60, 200),
        mk("Paw position along the body (fraction of body length; gaps where the animal is seen end-on)", [{ id: "lf", label: "Front L", color: pal.chart[0], pts: l.map((p) => [p.t, p.lf] as [number, number]) }, { id: "rf", label: "Front R", color: pal.chart[1], pts: l.map((p) => [p.t, p.rf] as [number, number]) }, { id: "lh", label: "Hind L", color: pal.chart[2], dash: true, pts: l.map((p) => [p.t, p.lh] as [number, number]) }, { id: "rh", label: "Hind R", color: pal.chart[3], dash: true, pts: l.map((p) => [p.t, p.rh] as [number, number]) }], -1, 1),
        mk("Movement estimate: confidence (0 to 1) and stride frequency (strides per second, only where named)", [{ id: "c", label: "Confidence", color: pal.chart[0], pts: tl.map((p) => [p.t, p.est.confidence] as [number, number]) }, { id: "f", label: "Stride freq.", color: pal.chart[2], dash: true, pts: tl.map((p) => [p.t, p.est.confidence >= 0.45 && p.est.strideHz ? p.est.strideHz : NaN] as [number, number]) }], 0, 4),
      ].filter((c): c is { title: string; png: string } => !!c) : [];
      const bytes = await buildAnimalReport(meta, s.samples, animal, charts);
      download(`motion-lab-${safeName(s.meta.name)}-${safeName(animal.label)}-${animal.id}.pdf`, new Blob([bytes as BlobPart], { type: "application/pdf" }));
    } catch (e) { setNotice({ kind: "error", text: `The report could not be built: ${(e as Error).message}` }); } finally { setBusy(false); }
  };
  const onExport = async (id: string, kind: "csv" | "json") => {
    const s = await loadSession(id);
    if (!s) return;
    if (kind === "csv") download(`motion-lab-${safeName(s.meta.name)}.csv`, toCsv(s.meta, s.samples), "text/csv");
    else download(`motion-lab-${safeName(s.meta.name)}.json`, toJson(s.meta, s.samples), "application/json");
  };
  const onDelete = async (id: string) => {
    if (replay?.meta.id === id) resetStage();
    await deleteSession(id);
    setSessions(await listSessions());
  };
  const onCloud = async (id: string) => {
    setCloud((c) => ({ ...c, [id]: "saving" }));
    try {
      const s = await loadSession(id);
      if (!s) throw new Error("Session not found on this device.");
      const r: CloudResult = await cloudSave({ ...s.meta, thumbnail: undefined }, toJson(s.meta, s.samples), s.video);
      if (r.status === "signin") { setCloud((c) => ({ ...c, [id]: "signin" })); setNotice({ kind: "info", text: "Sign in first (Sign in at the top of the page), then press Save to account again." }); return; }
      if (r.status === "error") throw new Error(r.message);
      setCloud((c) => ({ ...c, [id]: "saved" }));
      setNotice({ kind: "info", text: "Saved to your account: summary, measurements and recording are private to you." });
    } catch (e) {
      setCloud((c) => { const n = { ...c }; delete n[id]; return n; });
      setNotice({ kind: "error", text: (e as Error).message });
    }
  };

  // ---------------------------------------------------------------- render
  const camera = mode === "camera", analyzing = mode === "analyzing", replaying = mode === "replay";
  const active = camera || analyzing || replaying;
  const recording = recUi.state !== "off";
  const loadingModels = load.phase === "loading";
  const primary = "label bg-gold px-5 py-3.5 text-night transition-colors hover:bg-bone disabled:opacity-50";
  const ghost = "label border border-line px-5 py-3.5 text-bone transition-colors hover:border-gold hover:text-gold disabled:opacity-50";
  const lowFps = camera && live.fps > 0 && live.fps < 4;

  return (
    <div className="flex flex-col gap-[clamp(2rem,5vh,3.5rem)]">
      <section aria-label="Live preview" className="grid gap-6 lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
        <div className="flex flex-col gap-4">
          <div ref={stageRef} className="relative aspect-video w-full overflow-hidden bg-charcoal">
            <video ref={videoRef} className="absolute inset-0 h-full w-full object-contain" playsInline muted onEnded={() => { /* replay stays on the last frame */ }} />
            <canvas ref={canvasRef} aria-hidden="true" className="pointer-events-none absolute inset-0 h-full w-full" />
            {!active && (
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 px-6 text-center">
                <p className="t-voice text-[clamp(1.4rem,3vw,2.2rem)] text-ivory">Point a camera at a horse, dog or cat, or upload a video.</p>
                <p className="t-ui max-w-md text-sm text-sandline">Detection and tracking run on this device. Nothing is uploaded unless you save a session to your account.</p>
              </div>
            )}
            {loadingModels && <div role="status" className="absolute inset-x-0 bottom-0 bg-charcoal/80 px-4 py-2 text-center"><p className="label text-ivory">{load.message}…</p></div>}
            {active && (
              <div className="absolute left-3 top-3 flex flex-wrap items-center gap-2">
                <span className={`label px-2.5 py-1 ${live.detected ? "bg-gold text-night" : "bg-charcoal/80 text-ivory"}`}>{analyzing ? "Analysing" : replaying ? "Replay" : live.detected ? (live.animals.length > 1 ? `${live.animals.length} animals` : `${live.sel?.name ?? "Animal"} detected`) : "Searching for an animal"}</span>
                {recording && <span className="label flex items-center gap-2 bg-charcoal/80 px-2.5 py-1 text-ivory"><span aria-hidden className={`inline-block h-2 w-2 rounded-full ${recUi.state === "on" ? "bg-blood" : "bg-sandline"}`} />{recUi.state === "on" ? "REC" : "Paused"} {clock(recUi.ms)}</span>}
              </div>
            )}
            {progress && <div className="absolute inset-x-0 bottom-0 h-1 bg-charcoal/60"><div className="h-full bg-gold transition-[width] duration-150" style={{ width: `${(progress.done / Math.max(1, progress.total)) * 100}%` }} /></div>}
          </div>

          <div className="flex flex-wrap items-center gap-3" role="group" aria-label="Camera, upload and recording controls">
            {!camera ? <button type="button" className={primary} disabled={loadingModels || analyzing} onClick={() => askThen("camera", () => void openCamera())}>Open camera</button>
              : <button type="button" className={ghost} onClick={resetStage}>Close camera</button>}
            <label className={`${ghost} cursor-pointer ${analyzing ? "pointer-events-none opacity-50" : ""} has-[:focus-visible]:outline has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-gold`}>
              Upload a video
              <input type="file" accept="video/*" className="sr-only" disabled={loadingModels || analyzing} onChange={(e) => { const f = e.target.files?.[0]; e.target.value = ""; if (f) void analyzeFile(f); }} />
            </label>
            {analyzing && <button type="button" className={ghost} onClick={() => { cancelAnalysis.current = true; }}>Cancel analysis</button>}
            {camera && (
              <>
                <span aria-hidden className="mx-1 hidden h-6 w-px bg-line sm:block" />
                {!recording ? <button type="button" className={ghost} onClick={() => askThen("record", () => startRecording(false))}>● Record</button> : (
                  <>
                    <button type="button" className={ghost} onClick={pauseRecording}>{recUi.state === "paused" ? "Resume" : "Pause"}</button>
                    <button type="button" className={primary} onClick={() => void stopRecording()}>Stop and save</button>
                  </>
                )}
              </>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-x-6 gap-y-2">
            <Toggle label="Skeleton" checked={showSkeleton} onChange={setShowSkeleton} />
            <Toggle label="Detection box" checked={showBox} onChange={setShowBox} />
            <Toggle label="Auto-record when an animal is steady" checked={autoRecord} onChange={(v) => { if (v && !consent.record) { setDlg({ want: "record", cam: consent.camera, rec: false }); pending.current = () => setAutoRecord(true); return; } setAutoRecord(v); }} />
            <Toggle label="Use the graphics chip (experimental)" checked={accelerator === "webgpu"} onChange={(v) => { if (estRef.current) { estRef.current.dispose(); estRef.current = null; setModelInfo(null); setLoad({ phase: "idle", message: "" }); if (camera) resetStage(); } setAccelerator(v ? "webgpu" : "wasm"); }} disabled={!gpuAvailable} />
          </div>
          {(consent.camera || consent.record) && <p className="t-ui text-xs text-dust">Permissions you gave: {[consent.camera && "camera", consent.record && "recording on this device"].filter(Boolean).join(", ")}. <button type="button" className="underline underline-offset-2 hover:text-gold" onClick={() => saveConsent({ camera: false, record: false })}>Withdraw</button></p>}

          {notice && <p role={notice.kind === "error" ? "alert" : "status"} className={`t-ui border-l-2 pl-3 text-sm ${notice.kind === "error" ? "border-blood text-blood" : "border-gold text-sand"}`}>{notice.text}</p>}
          {(load.phase === "missing" || load.phase === "error") && <p role="alert" className="t-ui border-l-2 border-blood pl-3 text-sm text-blood">{load.message}</p>}
          {lowFps && <p role="status" className="t-ui border-l-2 border-gold pl-3 text-sm text-sand">This device analyses about {fmt(live.fps, 1)} frames a second. Tracking still works but looks steppy; a newer phone or a laptop will be smoother.</p>}
          {storeError && <p className="t-ui text-xs text-dust">Sessions cannot be kept on this device: {storeError}</p>}
        </div>

        <aside aria-label="Live tracking status" className="grid content-start gap-4 sm:grid-cols-2 lg:grid-cols-1">
          <div className="plate flex flex-col gap-2 p-4">
            <p className="label text-dust">Animal</p>
            <p className="t-voice text-[clamp(1.6rem,2.6vw,2.2rem)] leading-none text-bone" aria-live="polite">{!active ? "No camera" : live.sel ? live.sel.name : "None in view"}</p>
            {live.sel && <p className="t-ui text-xs text-sand">{live.sel.species ? `${SPECIES[live.sel.species].label}${live.sel.supported ? "" : ": detected only, no skeleton or movement estimate for this species yet"}` : "Species unsure: the detector's votes are split, so it is not named"}</p>}
            {live.animals.length > 1 && (
              <div role="group" aria-label="Animals in view" className="flex flex-wrap gap-2">
                {live.animals.map((a) => (
                  <button key={a.id} type="button" aria-pressed={a.id === live.sel?.id} onClick={() => setSelectedId(a.id)}
                    className={`label border px-2.5 py-1 transition-colors ${a.id === live.sel?.id ? "border-gold text-gold" : "border-line text-sand hover:border-gold hover:text-gold"}`}>{a.name}</button>
                ))}
              </div>
            )}
            <Meter value={live.detected ? live.det : 0} label="Tracking confidence" />
            <p className="t-ui text-xs text-dust">Tracking confidence {fmt(live.detected ? live.det * 100 : null, 0, "%")} · {live.visible} of 17 joints visible</p>
          </div>
          <GaitCard est={live.gait} live={!replaying} blocked={live.sel && !live.sel.supported ? (live.sel.species ? `${SPECIES[live.sel.species].label} movement has not been validated` : "Species unsure") : undefined} />
          <div className="grid grid-cols-2 gap-4 sm:col-span-2 lg:col-span-1">
            <Stat label="Inference" value={fmt(live.fps, 1)} sub="frames per second" tone={!active ? "off" : lowFps ? "warn" : undefined} />
            <Stat label="Latency" value={fmt(live.totalMs, 0)} sub={`ms · detect ${fmt(live.detMs, 0)} + pose ${fmt(live.poseMs, 0)}`} tone={!active ? "off" : undefined} />
          </div>
        </aside>
      </section>

      <section aria-label="Live measurements" className="grid grid-cols-2 gap-4 md:grid-cols-4 xl:grid-cols-6">
        <Stat label="Joints visible" value={active ? `${live.visible}/17` : "–"} />
        <Stat label="Detector score" value={fmt(live.detected ? live.det : null, 2)} />
        <Stat label="Stride frequency" value={fmt(live.gait?.strideHz ?? null, 2)} sub={live.gait?.strideHz ? `${fmt(live.gait.strideHz * 60, 0)} strides/min` : "strides per second"} />
        <Stat label={replaying ? "Session length" : "Recording"} value={replaying && replay ? clock(sessionMs) : recording ? clock(recUi.ms) : "00:00"} sub={replaying ? `cursor ${clock(cursor)}` : recording ? (recUi.state === "paused" ? "paused" : "recording") : "not recording"} />
        <Stat label={analyzing ? "Analysis progress" : "Frames analysed"} value={analyzing && progress ? `${Math.round((progress.done / Math.max(1, progress.total)) * 100)}%` : String(live.frames)} sub={analyzing && progress ? `${progress.done} of ${progress.total} frames` : "this session"} />
        <Stat label="Model" value={modelInfo?.accelerator === "webgpu" ? "WebGPU" : modelInfo ? "CPU" : "–"} sub={load.phase === "ready" ? "on this device" : "not loaded"} />
      </section>

      <section aria-label="Movement graphs" className="grid gap-4 lg:grid-cols-2">
        <TimeChart title="Joint angles (degrees)" series={chartData.angles} t0={chartData.t0} t1={chartData.t1} y0={60} y1={200} cursor={chartData.cursor} />
        <TimeChart title="Paw position along the body" series={chartData.limbs} t0={chartData.t0} t1={chartData.t1} y0={-1} y1={1} cursor={chartData.cursor} />
        <div className="lg:col-span-2"><TimeChart title="Detector score and frame time" series={chartData.perf} t0={chartData.t0} t1={chartData.t1} y0={0} y1={2} cursor={chartData.cursor} height={110} /></div>
      </section>

      <JointTable kp={live.kp} angles={live.angles} />

      <section aria-labelledby="sessions-h" className="flex flex-col gap-4">
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <h2 id="sessions-h" className="label text-gold">Saved sessions</h2>
          <p className="t-ui text-xs text-dust">Kept in this browser. Export or save to your account to keep them elsewhere.</p>
        </div>
        {sessions.length === 0 ? <p className="t-ui border-t border-line pt-4 text-sm text-dust">No sessions yet. Record from the camera or upload a video and the session appears here with its recording, data and report.</p> : (
          <ul className="grid grid-cols-1 gap-4 md:grid-cols-2">
            {sessions.map((m) => (
              <SessionCard key={m.id} meta={m} busy={busy || analyzing} active={replay?.meta.id === m.id} cloudState={cloud[m.id] ?? "none"}
                onReplay={() => void openReplay(m.id)} onCsv={() => void onExport(m.id, "csv")} onJson={() => void onExport(m.id, "json")} onReport={(which) => void onReport(m.id, which)}
                onDelete={() => void onDelete(m.id)} onCloud={() => void onCloud(m.id)} />
            ))}
          </ul>
        )}
      </section>

      {dlg && <ConsentDialog dlg={dlg} setDlg={setDlg} onConfirm={confirmConsent} />}
    </div>
  );
}


function Toggle({ label, checked, onChange, disabled }: { label: string; checked: boolean; onChange: (v: boolean) => void; disabled?: boolean }) {
  return (
    <label className={`t-ui flex items-center gap-2 text-sm text-sand ${disabled ? "opacity-50" : "cursor-pointer"}`}>
      <input type="checkbox" checked={checked} disabled={disabled} onChange={(e) => onChange(e.target.checked)} className="h-4 w-4 accent-[var(--color-gold)]" />
      {label}
    </label>
  );
}

function ConsentDialog({ dlg, setDlg, onConfirm }: { dlg: { want: "camera" | "record"; cam: boolean; rec: boolean }; setDlg: (d: null | { want: "camera" | "record"; cam: boolean; rec: boolean }) => void; onConfirm: () => void }) {
  const ref = useRef<HTMLDialogElement>(null);
  useEffect(() => { ref.current?.showModal(); }, []);
  const ok = (dlg.want === "camera" && dlg.cam) || (dlg.want === "record" && dlg.rec);
  return (
    <dialog ref={ref} onClose={() => setDlg(null)} onCancel={() => setDlg(null)} aria-labelledby="consent-h" className="m-auto w-[min(32rem,calc(100vw-2rem))] border border-line bg-ember p-6 text-sand backdrop:bg-charcoal/60">
      <h2 id="consent-h" className="t-voice text-2xl text-bone">Before we start</h2>
      <p className="t-ui mt-3 text-sm">Motion Lab looks at your camera feed with an AI model that runs on this device. Frames are not sent anywhere. Please confirm what you are happy with:</p>
      <div className="mt-4 flex flex-col gap-3">
        <label className="flex items-start gap-3"><input type="checkbox" checked={dlg.cam} onChange={(e) => setDlg({ ...dlg, cam: e.target.checked })} className="mt-1 h-4 w-4 accent-[var(--color-gold)]" /><span className="t-ui text-sm"><strong className="text-bone">Use my camera.</strong> Your browser will ask once more. The camera is used only while the camera is open here, and no sound is captured.</span></label>
        <label className="flex items-start gap-3"><input type="checkbox" checked={dlg.rec} onChange={(e) => setDlg({ ...dlg, rec: e.target.checked })} className="mt-1 h-4 w-4 accent-[var(--color-gold)]" /><span className="t-ui text-sm"><strong className="text-bone">Record and keep video on this device.</strong> I have the permission of the owner of the animal, and of anyone who appears, to record them. Recordings stay in this browser until I save them to my account or delete them.</span></label>
      </div>
      <div className="mt-6 flex flex-wrap justify-end gap-3">
        <button type="button" onClick={() => setDlg(null)} className="label border border-line px-5 py-3 text-bone hover:border-gold hover:text-gold">Not now</button>
        <button type="button" disabled={!ok} onClick={onConfirm} className="label bg-gold px-5 py-3 text-night hover:bg-bone disabled:opacity-50">Continue</button>
      </div>
    </dialog>
  );
}
