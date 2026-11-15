"use client";

import { useCallback, useEffect, useRef, useState, type PointerEvent as ReactPointerEvent, type ReactNode } from "react";
import { Pause, Play, SlidersHorizontal } from "lucide-react";
import { Headline } from "@/components/film/Headline";
import {
  LAB_CAVEAT, LAB_FILM as FILM, LAB_LANDINGS, LAB_LANDMARKS as L, LAB_PARTS, LAB_PLANTED, LAB_STANCE, LAB_TABLE, LAB_TEMPO,
  type PartId,
} from "@/lib/content/movement-lab";
import { useReducedMotion } from "@/lib/motion/reduced";
import { cn } from "@/lib/utils";

type Show = "both" | "horse" | "rider" | "skeleton";
type Camera = "side" | "three-quarter" | "behind" | "front" | "above";
type Hoof = keyof typeof LAB_STANCE;

const SHOWS: { id: Show; label: string }[] = [
  { id: "both", label: "Horse and rider" }, { id: "horse", label: "Horse" }, { id: "rider", label: "Rider" }, { id: "skeleton", label: "Skeleton" },
];
const CAMERAS: { id: Camera; label: string }[] = [
  { id: "side", label: "Side" }, { id: "three-quarter", label: "Three-quarter" }, { id: "behind", label: "Behind" }, { id: "front", label: "Front" }, { id: "above", label: "Above" },
];
const SPEEDS = [0.25, 0.5, 1] as const;
const STEPS = 24; // frame steps per stride
const REF_PHASE = 0.48; // the canonical pose: elbow 102°, knee 108°
const TAU = Math.PI * 2;

const RING = "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold";
const KICKER = "label flex items-center justify-between gap-3 border-b border-line pb-2 text-[0.68rem] text-brass";

/** Where the film is in the stride, 0..1. */
function phaseOf(v: HTMLVideoElement | null) {
  return v ? (((v.currentTime % FILM.period) + FILM.period) % FILM.period) / FILM.period : REF_PHASE;
}

/** The model's numbers at a point in the stride (phase 0..1); the reference pose is exact. */
function bio(phase: number, locked: boolean) {
  if (locked) return { elbow: 102, knee: 108, pitch: "+1.18", lat: "+3.0", frame: 12, hooves: "2 hooves down: LH LF" };
  const norm = (1 - Math.cos((phase - REF_PHASE) * TAU)) / 2;
  const pitch = Math.sin(phase * TAU * 2) * 1.23;
  const lat = Math.cos((phase - REF_PHASE) * TAU) * 3;
  const hooves = (Object.keys(LAB_STANCE) as Hoof[]).filter((h) => stance(h, phase) > 0);
  return {
    elbow: Math.round(102 + norm * 35),
    knee: Math.round(108 + norm * 72),
    pitch: `${pitch >= 0 ? "+" : ""}${pitch.toFixed(2)}`,
    lat: `${lat >= 0 ? "+" : ""}${lat.toFixed(1)}`,
    frame: Math.min(STEPS, Math.floor(phase * STEPS) + 1),
    hooves: `${hooves.length} hooves down: ${hooves.join(" ")}`,
  };
}

/** 0 when the hoof is in the air, rising to 1 mid-stance (for the ripple's strength). */
function stance(hoof: Hoof, phase: number) {
  for (const [a, b] of LAB_STANCE[hoof]) {
    if (phase >= a && phase < b) return Math.sin(((phase - a) / (b - a)) * Math.PI) * 0.6 + 0.4;
  }
  return 0;
}

/**
 * The Movement Laboratory: the owner's film of a horse and rider walking, in the middle, with the stride drawn over it (the spine's
 * wave, the rider's seat, the forelimb pendulum and its joint angles, hoof-contact ripples, six numbered parts) and the controls and
 * figures around it. The overlay reads the film's own clock, so play, pause, speed, frame steps and the timeline all move both.
 * Reduced motion: the film waits on its first frame until the visitor presses play; the overlay is drawn, still.
 */
export function MovementLab({ headingAs = "h2" }: { headingAs?: "h1" | "h2" }) {
  const reduced = useReducedMotion();
  const sectionRef = useRef<HTMLElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);

  const [playing, setPlaying] = useState(false);
  const [speed, setSpeed] = useState<(typeof SPEEDS)[number]>(1);
  const [locked, setLocked] = useState(false);
  const [show, setShow] = useState<Show>("both");
  const [camera, setCamera] = useState<Camera>("side");
  const [part, setPart] = useState<PartId>("03");
  const [yaw, setYaw] = useState(0);
  const [menuOpen, setMenuOpen] = useState(false);
  const [menuFit, setMenuFit] = useState({ up: true, max: 480 });
  const menuRef = useRef<HTMLDivElement>(null);
  const menuButtonRef = useRef<HTMLButtonElement>(null);
  const userPaused = useRef(false);
  const state = useRef({ locked, show, camera, part });
  useEffect(() => { state.current = { locked, show, camera, part }; }, [locked, show, camera, part]);

  const seekPhase = useCallback((phase: number) => {
    const v = videoRef.current;
    if (!v) return;
    const base = Math.floor(v.currentTime / FILM.period) * FILM.period;
    const duration = Number.isFinite(v.duration) ? v.duration : 6 * FILM.period;
    v.currentTime = Math.min(duration - 0.01, base + Math.min(0.999, Math.max(0, phase)) * FILM.period);
  }, []);

  // autoplay while on screen (not under reduced motion, not after the visitor paused)
  useEffect(() => {
    const v = videoRef.current;
    const section = sectionRef.current;
    if (!v || !section) return;
    const io = new IntersectionObserver(([e]) => {
      if (e.isIntersecting && !reduced && !userPaused.current && !state.current.locked) v.play().catch(() => {});
      else if (!e.isIntersecting) v.pause();
    }, { threshold: 0.2 });
    io.observe(section);
    return () => io.disconnect();
  }, [reduced]);
  useEffect(() => { if (videoRef.current) videoRef.current.playbackRate = speed; }, [speed]);

  // the overlay and every live number, once a frame while the section is on screen
  useEffect(() => {
    const canvas = canvasRef.current;
    const section = sectionRef.current;
    if (!canvas || !section) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const css = getComputedStyle(stageRef.current ?? section);
    const token = (name: string) => css.getPropertyValue(name).trim() || "currentColor";
    const shadeRgb = (css.getPropertyValue("--shade-rgb").trim() || "23 21 19").split(/\s+/).join(", ");
    const C = { gold: token("--color-gold"), brass: token("--color-brass"), bone: token("--color-bone"), sand: token("--color-sand"), night: token("--color-night"), copper: token("--color-caramel"), shade: (a: number) => `rgba(${shadeRgb}, ${a})`, u: 1 };
    const mono = css.getPropertyValue("--font-mono").trim() || "monospace";
    let raf = 0;
    let visible = false;

    const size = () => {
      const r = canvas.getBoundingClientRect();
      const dpr = Math.min(2, window.devicePixelRatio || 1);
      canvas.width = Math.max(1, Math.round(r.width * dpr));
      canvas.height = Math.max(1, Math.round(r.height * dpr));
      // strokes, dots and labels grow when the stage is small, so the overlay reads at every size
      C.u = Math.min(2.6, Math.max(1, 1100 / Math.max(1, r.width)));
    };
    const ro = new ResizeObserver(size);
    ro.observe(canvas);
    size();

    // every live readout, collected once (they are plain DOM nodes; React renders them once and leaves them alone)
    const out: Record<string, Element | undefined> = {};
    section.querySelectorAll("[data-lab]").forEach((el) => { out[el.getAttribute("data-lab") ?? ""] = el; });
    const text = (key: string, value: string) => { const el = out[key]; if (el && el.textContent !== value) el.textContent = value; };

    const frame = () => {
      raf = visible ? requestAnimationFrame(frame) : 0;
      const { locked: lock, show: mode, camera: cam, part: active } = state.current;
      const phase = lock ? REF_PHASE : phaseOf(videoRef.current);
      const b = bio(phase, lock);

      // live numbers (the DOM, not React state: no re-render each frame)
      text("frame", `Frame ${b.frame} of ${STEPS} · ${b.hooves}`);
      text("elbow", `${b.elbow}°`); text("knee", `${b.knee}°`); text("pitch", `${b.pitch}°`); text("lat", `${b.lat} mm`);
      text("cardElbow", `${b.elbow}°`); text("cardKnee", `${b.knee}°`); text("svgElbow", `${b.elbow}°`); text("svgKnee", `${b.knee}°`);
      const pct = Math.round(phase * 100);
      text("pct", `${pct}% of the stride`);
      const slider = out.slider as HTMLInputElement | null;
      if (slider && document.activeElement !== slider) { slider.value = String(phase * 100); slider.setAttribute("aria-valuetext", `${pct}% of the stride`); }
      const playhead = out.playhead as HTMLElement | null;
      if (playhead) playhead.style.left = `${phase * 100}%`;
      const en = (b.elbow - 102) / 35;
      out.svgElbowLine?.setAttribute("x2", (105 - en * 16).toFixed(1)); out.svgElbowLine?.setAttribute("y2", (54 + en * 22).toFixed(1));
      out.svgElbowTip?.setAttribute("cx", (105 - en * 16).toFixed(1)); out.svgElbowTip?.setAttribute("cy", (54 + en * 22).toFixed(1));
      const kn = (b.knee - 108) / 72;
      out.svgKneeLine?.setAttribute("x2", (64 + kn * 50).toFixed(1)); out.svgKneeLine?.setAttribute("y2", (73 - kn * 28).toFixed(1));
      out.svgKneeTip?.setAttribute("cx", (64 + kn * 50).toFixed(1)); out.svgKneeTip?.setAttribute("cy", (73 - kn * 28).toFixed(1));

      // the overlay, in film pixels
      const s = canvas.width / FILM.width;
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.setTransform(s, 0, 0, s, 0, 0);
      ctx.lineCap = "round"; ctx.lineJoin = "round";

      if (cam === "behind" || cam === "front" || cam === "above") { drawSchematic(ctx, cam, phase, C, mono); return; }

      // show modes: spotlights over the film
      if (mode === "horse") {
        const g = ctx.createRadialGradient(925, 250, 20, 925, 250, 230);
        g.addColorStop(0, C.shade(0.82)); g.addColorStop(1, C.shade(0));
        ctx.fillStyle = g; ctx.fillRect(600, 0, 650, 520);
      } else if (mode === "rider" || mode === "skeleton") {
        ctx.fillStyle = C.shade(mode === "rider" ? 0.62 : 0.5);
        ctx.fillRect(0, 0, FILM.width, FILM.height);
        if (mode === "rider") {
          ctx.save(); ctx.globalCompositeOperation = "destination-out";
          ctx.beginPath(); ctx.ellipse(950, 330, 200, 330, 0, 0, TAU); ctx.fill(); ctx.restore();
        }
      }
      const strong = mode === "skeleton";
      const bob = lock ? 0 : Math.sin(phase * TAU * 2) * 4;

      // 1 · the spine's wave: croup → back → withers → crest → poll, riding up and down twice a stride
      ctx.save();
      ctx.shadowColor = C.gold; ctx.shadowBlur = 14;
      ctx.strokeStyle = active === "01" ? C.bone : C.gold; ctx.lineWidth = (active === "01" || strong ? 5 : 3.4) * C.u;
      ctx.beginPath();
      ctx.moveTo(L.croup.x, L.croup.y + bob);
      ctx.bezierCurveTo(680, 380 + bob, 880, 410 + bob, L.withers.x, L.withers.y + bob);
      ctx.bezierCurveTo(1160, 320 + bob, 1200, 268 + bob, L.poll.x, L.poll.y + bob);
      ctx.stroke();
      ctx.shadowBlur = 0; ctx.fillStyle = C.gold;
      [[640, 410], [700, 396], [760, 392], [830, 398], [900, 402], [980, 392], [1040, 372], [1120, 330], [1190, 280], [1260, 232]].forEach(([x, y]) => { ctx.beginPath(); ctx.arc(x, y + bob, 4.5 * C.u, 0, TAU); ctx.fill(); });
      ctx.restore();

      // 2 · the rider's seat: a phase-lagged trace through the pelvis
      if (mode !== "horse") {
        ctx.save();
        ctx.strokeStyle = active === "05" ? C.bone : C.copper; ctx.lineWidth = (active === "05" ? 4.5 : 3) * C.u;
        ctx.beginPath();
        for (let dx = -120; dx <= 120; dx += 6) {
          const y = L.riderPelvis.y - 8 + Math.sin((dx / 120) * Math.PI * 2 - phase * TAU * 2 + 0.45) * 14;
          if (dx === -120) ctx.moveTo(L.riderPelvis.x + dx, y); else ctx.lineTo(L.riderPelvis.x + dx, y);
        }
        ctx.stroke();
        // posture line: head, shoulder, pelvis, knee, heel
        ctx.setLineDash(strong ? [] : [8, 8]); ctx.strokeStyle = C.bone; ctx.globalAlpha = strong ? 0.9 : 0.5; ctx.lineWidth = (strong ? 3.4 : 2.2) * C.u;
        ctx.beginPath();
        ctx.moveTo(L.riderHead.x, L.riderHead.y); ctx.lineTo(L.riderShoulder.x, L.riderShoulder.y); ctx.lineTo(L.riderPelvis.x, L.riderPelvis.y);
        ctx.lineTo(L.riderKnee.x, L.riderKnee.y); ctx.lineTo(L.riderHeel.x, L.riderHeel.y);
        ctx.stroke(); ctx.restore();
      }

      // 3 · hindquarters: croup → hip, and the hind leg's pendulum under the hip
      ctx.save();
      ctx.strokeStyle = C.gold; ctx.globalAlpha = active === "04" || strong ? 0.95 : 0.6; ctx.lineWidth = (active === "04" || strong ? 3.6 : 2.4) * C.u;
      ctx.setLineDash(strong ? [] : [8, 8]);
      ctx.beginPath(); ctx.moveTo(L.croup.x, L.croup.y + bob); ctx.lineTo(L.hip.x, L.hip.y); ctx.stroke();
      pendulum(ctx, L.hip.x, L.hip.y, 330, Math.sin(phase * TAU) * 0.32, C, false);
      ctx.restore();

      // 4 · the forelimb from the shoulder: withers → shoulder point → elbow, the goniometer, the pendulum to the hoof
      ctx.save();
      const hot = active === "03" || strong;
      ctx.shadowColor = C.gold; ctx.shadowBlur = hot ? 12 : 4;
      ctx.strokeStyle = C.gold; ctx.lineWidth = (hot ? 5 : 3.2) * C.u;
      ctx.beginPath(); ctx.moveTo(L.withers.x, L.withers.y + bob); ctx.lineTo(L.shoulder.x, L.shoulder.y); ctx.lineTo(L.elbow.x, L.elbow.y); ctx.stroke();
      ctx.shadowBlur = 0;
      ctx.strokeStyle = C.copper; ctx.lineWidth = (3.4) * C.u;
      ctx.beginPath(); ctx.arc(L.elbow.x, L.elbow.y, 40, -1.9, -1.9 + (b.elbow / 180) * Math.PI); ctx.stroke();
      const swing = lock ? 0 : Math.sin((phase - REF_PHASE) * TAU) * 0.3;
      const tip = pendulum(ctx, L.elbow.x, L.elbow.y, 300, swing, C, true);
      [L.shoulder, L.elbow, L.hip].forEach((p) => { ctx.fillStyle = C.night; ctx.beginPath(); ctx.arc(p.x, p.y, 8 * C.u, 0, TAU); ctx.fill(); ctx.strokeStyle = C.gold; ctx.lineWidth = (3) * C.u; ctx.stroke(); });
      // the angle tags need room: on a small stage the numbers are in the readout and the cards beside it instead
      if (C.u < 1.8) {
        badge(ctx, L.elbow.x - 150 - 90 * C.u, L.elbow.y + 6, `ELBOW ${b.elbow}°`, C, mono);
        badge(ctx, tip.x + 26, tip.y - 70, `KNEE ${b.knee}°`, C, mono);
      }
      ctx.restore();

      // 5 · hoof contact: a ripple under every planted hoof, strongest mid-stance
      ctx.save();
      (Object.keys(L.hoofX) as Hoof[]).forEach((h) => {
        const k = stance(h, phase);
        if (!k) return;
        for (let r = 1; r <= 3; r++) {
          ctx.globalAlpha = (0.75 * k) / r;
          ctx.strokeStyle = C.gold; ctx.lineWidth = (active === "06" ? 3.4 : 2.2) * C.u;
          ctx.beginPath(); ctx.ellipse(L.hoofX[h], L.ground, 34 * r + k * 10, 6.5 * r + k * 2, 0, 0, TAU); ctx.stroke();
        }
        ctx.globalAlpha = 0.9 * k; ctx.fillStyle = C.gold; ctx.font = `600 ${Math.round(18 * C.u)}px ${mono}`; ctx.textAlign = "center";
        ctx.fillText(h, L.hoofX[h], L.ground + 30 + 16 * C.u);
      });
      ctx.restore();
    };

    const start = () => { if (!raf) raf = requestAnimationFrame(frame); };
    const io = new IntersectionObserver(([e]) => { visible = e.isIntersecting; if (visible) start(); }, { rootMargin: "120px" });
    io.observe(section);
    return () => { io.disconnect(); ro.disconnect(); cancelAnimationFrame(raf); };
  }, []);

  // the one settings menu: Escape or a tap outside closes it (a scroll gesture ends in pointercancel, so scrolling never closes it)
  useEffect(() => {
    if (!menuOpen) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") { setMenuOpen(false); menuButtonRef.current?.focus(); } };
    const onUp = (e: PointerEvent) => { if (!menuRef.current?.contains(e.target as Node)) setMenuOpen(false); };
    document.addEventListener("keydown", onKey);
    document.addEventListener("pointerup", onUp);
    return () => { document.removeEventListener("keydown", onKey); document.removeEventListener("pointerup", onUp); };
  }, [menuOpen]);
  // opens on whichever side of the button has more room (the fixed nav takes the top 80 px), and scrolls inside itself if it must
  const toggleMenu = () => {
    if (!menuOpen) {
      const r = menuButtonRef.current?.getBoundingClientRect();
      if (r) {
        const above = r.top - 96, below = window.innerHeight - r.bottom - 16;
        setMenuFit({ up: above >= below, max: Math.max(220, Math.min(520, Math.max(above, below))) });
      }
    }
    setMenuOpen((open) => !open);
  };

  const togglePlay = () => {
    const v = videoRef.current;
    if (!v) return;
    setLocked(false);
    if (v.paused) { userPaused.current = false; v.play().catch(() => {}); }
    else { userPaused.current = true; v.pause(); }
  };
  const step = (dir: 1 | -1) => {
    const v = videoRef.current;
    if (!v) return;
    userPaused.current = true; setLocked(false); v.pause();
    const duration = Number.isFinite(v.duration) ? v.duration : 6 * FILM.period;
    v.currentTime = (v.currentTime + dir * (FILM.period / STEPS) + duration) % duration;
  };
  const refPose = () => {
    const v = videoRef.current;
    const next = !locked;
    setLocked(next);
    if (!v) return;
    if (next) { userPaused.current = true; v.pause(); seekPhase(REF_PHASE); }
    else { userPaused.current = false; v.play().catch(() => {}); }
  };
  const scrub = (pct: number) => { setLocked(false); seekPhase(pct / 100); };

  // drag the stage to turn the view a little (side and three-quarter only); the wheel never zooms
  const drag = useRef<number | null>(null);
  const onPointerDown = (e: ReactPointerEvent) => { if ((e.target as HTMLElement).closest("button")) return; drag.current = e.clientX; (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId); };
  const onPointerMove = (e: ReactPointerEvent) => {
    if (drag.current === null || reduced) return;
    const dx = e.clientX - drag.current; drag.current = e.clientX;
    setYaw((y) => Math.max(-28, Math.min(28, y + dx * 0.25)));
  };
  const onPointerUp = () => { drag.current = null; };
  const turn = camera === "three-quarter" ? -18 + yaw : camera === "side" ? yaw : 0;
  const schematic = camera === "behind" || camera === "front" || camera === "above";
  const info = LAB_PARTS.find((p) => p.id === part) ?? LAB_PARTS[2];
  const camLabel = CAMERAS.find((c) => c.id === camera)?.label ?? "Side";
  const showLabel = SHOWS.find((x) => x.id === show)?.label ?? "Horse and rider";

  return (
    <section ref={sectionRef} id="movement-lab" aria-labelledby="movement-lab-h" data-parallax-skip className="bg-night pb-[clamp(4rem,10vh,7rem)] pt-24 text-bone md:pt-28">
      <div className="gutter mx-auto flex max-w-[1500px] flex-col gap-8 md:gap-10">
        {/* the title: no controls up here */}
        <header className="flex flex-wrap items-end justify-between gap-x-10 gap-y-4">
          <div>
            <p className="label text-[0.68rem] text-brass">BSAH · Scientific motion study</p>
            <Headline id="movement-lab-h" as={headingAs} size="3" className="mt-2" inscription="Movement laboratory" voice="horse and rider biomechanics." />
          </div>
          <p className="font-mono text-[0.7rem] uppercase leading-relaxed tracking-[0.08em] text-dust md:text-right md:tracking-[0.14em]">
            <span className="block">Four-beat walk · about 48 strides a minute</span>
            <span className="block">Rider&apos;s seat: about 95 cycles a minute</span>
          </p>
        </header>

        <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_21rem] xl:grid-cols-[minmax(0,1fr)_24rem]">
          {/* the film, with the stride drawn over it, and one quiet control strip under it */}
          <figure className="plate flex min-w-0 flex-col self-start">
            <div
              ref={stageRef}
              className={cn("tone-photo relative aspect-video w-full touch-pan-y select-none overflow-hidden bg-night", !reduced && "cursor-grab active:cursor-grabbing")}
              style={{ perspective: "1600px" }}
              onPointerDown={onPointerDown} onPointerMove={onPointerMove} onPointerUp={onPointerUp} onPointerCancel={onPointerUp}
            >
              <div className="absolute inset-0 transition-transform duration-700 ease-out" style={{ transform: schematic ? undefined : `rotateY(${turn}deg)`, transformStyle: "preserve-3d" }}>
                <video
                  ref={videoRef}
                  className={cn("absolute inset-0 h-full w-full object-cover transition-opacity duration-700", schematic && "opacity-20")}
                  muted loop playsInline preload="metadata" poster={FILM.poster}
                  aria-label={FILM.alt}
                  onPlay={() => setPlaying(true)} onPause={() => setPlaying(false)}
                >
                  <source media="(max-width: 767px)" src={FILM.mobile} type="video/mp4" />
                  <source src={FILM.desktop} type="video/mp4" />
                </video>
                <canvas ref={canvasRef} aria-hidden className="pointer-events-none absolute inset-0 h-full w-full" />
                {!schematic && LAB_PARTS.map((p) => (
                  <button
                    key={p.id} type="button" onClick={() => setPart(p.id)} aria-pressed={part === p.id} aria-label={`${p.id} ${p.name}`}
                    className={cn("absolute grid h-7 w-7 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full border font-mono text-[0.62rem] transition-colors before:absolute sm:h-8 sm:w-8 before:-inset-2 before:content-['']", part === p.id ? "border-bone bg-gold text-night" : "border-gold/80 bg-night/70 text-gold hover:bg-gold/20", RING)}
                    style={{ left: `${(p.at.x / FILM.width) * 100}%`, top: `${(p.at.y / FILM.height) * 100}%` }}
                  >{p.id}</button>
                ))}
              </div>
            </div>

            <div className="flex flex-col gap-5 px-4 pb-5 pt-4 md:px-6">
              {/* one row: play, where we are in the stride, and the one View menu */}
              <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
                <button type="button" onClick={togglePlay} aria-label={playing ? "Pause the film" : "Play the film"} className={cn("grid h-11 w-11 shrink-0 place-items-center rounded-full border border-gold/60 text-bone transition-colors hover:border-gold hover:text-gold", RING)}>
                  {playing ? <Pause size={17} strokeWidth={1.5} aria-hidden /> : <Play size={17} strokeWidth={1.5} aria-hidden className="translate-x-[1px]" />}
                </button>
                <div className="min-w-0 flex-1 font-mono text-[0.7rem] leading-snug">
                  <p data-lab="pct" className="font-semibold text-gold">48% of the stride</p>
                  <p data-lab="frame" className="text-sand">Frame 12 of 24 · 2 hooves down: LH LF</p>
                </div>
                <div ref={menuRef} className="relative">
                  <button
                    ref={menuButtonRef} type="button" onClick={toggleMenu} aria-expanded={menuOpen} aria-controls="lab-view-menu"
                    className={cn("inline-flex min-h-11 items-center gap-2 px-1 font-mono text-[0.72rem] text-sand transition-colors hover:text-gold aria-expanded:text-gold", RING)}
                  >
                    <SlidersHorizontal size={16} strokeWidth={1.5} aria-hidden /> View
                    <span className="hidden text-dust md:inline">· {camLabel} · {showLabel} · {speed === 1 ? "1.0" : speed}×</span>
                  </button>
                  {menuOpen && (
                    <div id="lab-view-menu" role="group" aria-label="View and playback settings" className={cn("plate absolute right-0 z-20 flex w-[min(26rem,calc(100vw-4.5rem))] flex-col gap-3 overflow-y-auto overscroll-contain bg-ember p-4", menuFit.up ? "bottom-full mb-2" : "top-full mt-2")} style={{ maxHeight: menuFit.max }}>
                      <Choice inline legend="Show" name="lab-show" value={show} options={SHOWS} onChange={setShow} />
                      <Choice inline legend="Camera" name="lab-camera" value={camera} options={CAMERAS} onChange={(c) => { setCamera(c); setYaw(0); }} />
                      <Choice inline legend="Speed" name="lab-speed" value={String(speed)} options={SPEEDS.map((v) => ({ id: String(v), label: `${v === 1 ? "1.0" : v}×` }))} onChange={(v) => setSpeed(Number(v) as (typeof SPEEDS)[number])} />
                      <div className="flex flex-wrap items-center gap-x-5 gap-y-2 border-t border-line pt-3 font-mono text-[0.74rem]">
                        <button type="button" onClick={() => step(-1)} className={cn("min-h-9 text-sand hover:text-gold", RING)}>‹ Back a frame</button>
                        <button type="button" onClick={() => step(1)} className={cn("min-h-9 text-sand hover:text-gold", RING)}>Forward a frame ›</button>
                        <label className="flex min-h-9 cursor-pointer items-center gap-2 text-sand">
                          <input type="checkbox" checked={locked} onChange={refPose} className="h-4 w-4 accent-[var(--color-gold)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold" />
                          Hold the 102° / 108° pose
                        </label>
                      </div>
                      {!reduced && <p className="font-mono text-[0.66rem] text-dust">Drag the film to turn the view. The wheel never zooms.</p>}
                    </div>
                  )}
                </div>
              </div>

              {/* the footfall chart is also the scrubber: press or drag anywhere on it */}
              <div className="grid grid-cols-[2rem_1fr] gap-x-3">
                <div aria-hidden className="flex flex-col gap-2 self-start text-right font-mono text-[0.66rem] font-semibold text-gold">
                  {(Object.keys(LAB_STANCE) as Hoof[]).map((h) => <span key={h} className="flex h-2.5 items-center justify-end">{h}</span>)}
                </div>
                <div>
                  <div
                    className="relative has-[input:focus-visible]:outline has-[input:focus-visible]:outline-2 has-[input:focus-visible]:outline-offset-4 has-[input:focus-visible]:outline-gold"
                    role="img" aria-label="Footfall bars: left hind on the ground from 0 to 62% of the stride, left fore from 25 to 87%, right hind from 50% to 12% of the next, right fore from 75% to 37% of the next."
                  >
                    <div className="flex flex-col gap-2">
                      {(Object.keys(LAB_STANCE) as Hoof[]).map((h) => (
                        <span key={h} className="relative h-2.5 overflow-hidden rounded-full bg-bone/10">
                          {LAB_STANCE[h].map(([a, b]) => <span key={a} className="absolute inset-y-0 rounded-full bg-gradient-to-r from-caramel to-gold" style={{ left: `${a * 100}%`, width: `${(b - a) * 100}%` }} />)}
                        </span>
                      ))}
                    </div>
                    <span data-lab="playhead" aria-hidden className="pointer-events-none absolute -inset-y-1.5 w-0.5 -translate-x-1/2 bg-bone" style={{ left: "48%" }}>
                      <span className="absolute -top-1 left-1/2 h-2.5 w-2.5 -translate-x-1/2 rounded-full bg-bone" />
                    </span>
                    <input
                      data-lab="slider" type="range" min={0} max={100} step={0.5} defaultValue={48}
                      aria-label="Point in the stride"
                      onChange={(e) => scrub(Number(e.currentTarget.value))}
                      onPointerDown={() => { userPaused.current = true; videoRef.current?.pause(); }}
                      className="absolute -inset-y-3 left-0 h-[calc(100%+1.5rem)] w-full cursor-ew-resize opacity-0"
                    />
                  </div>
                  <p aria-hidden className="mt-2 flex justify-between font-mono text-[0.6rem] uppercase tracking-[0.06em] text-dust">
                    <span>0 · LH lands</span><span>25 · LF</span><span>50 · RH</span><span>75 · RF</span><span>100</span>
                  </p>
                </div>
              </div>

              <dl className="flex flex-wrap gap-x-6 gap-y-1 border-t border-line pt-3 font-mono text-[0.68rem] text-dust">
                {[["Elbow", "elbow", "102°"], ["Knee", "knee", "108°"], ["Back pitch", "pitch", "+1.18°"], ["Seat lateral", "lat", "+3.0 mm"]].map(([k, key, v]) => (
                  <div key={key} className="flex gap-1.5"><dt>{k}</dt><dd data-lab={key} className="font-semibold text-gold">{v}</dd></div>
                ))}
                <p className="basis-full text-[0.64rem] italic">{LAB_CAVEAT}</p>
              </dl>
            </div>
          </figure>

          {/* the selected part */}
          <aside aria-label="Biomechanical analysis" className="plate flex flex-col gap-4 p-5 md:p-6">
            <Choice legend="Part" name="lab-part" value={part} options={LAB_PARTS.map((p) => ({ id: p.id, label: p.id }))} onChange={setPart} compact />
            <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
              <h3 className="t-inscribe text-[1.6rem] leading-tight text-bone">{info.name}</h3>
              <span className="font-mono text-[0.66rem] uppercase tracking-[0.1em] text-gold">{info.badge}</span>
            </div>
            <p className="t-voice text-[1.15rem] leading-snug text-gold">{info.lead}</p>
            {info.body.map((t) => <p key={t} className="t-story text-[0.92rem] leading-relaxed text-sand">{t}</p>)}
            <div className="grid grid-cols-2 gap-3">
              <AngleCard name="Elbow angle" range="Range: 102° to 137°" lab="cardElbow" value="102°">
                <svg viewBox="0 0 140 86" className="h-full w-full" aria-hidden>
                  <path d="M 52 46 L 106 54 A 54 54 0 0 1 88 78 Z" fill="color-mix(in srgb, var(--color-gold) 14%, transparent)" stroke="var(--color-gold)" strokeOpacity="0.4" strokeDasharray="2 2" />
                  <line x1="74" y1="12" x2="36" y2="28" stroke="var(--color-bone)" strokeOpacity="0.3" strokeWidth="2" strokeLinecap="round" />
                  <line x1="36" y1="28" x2="52" y2="46" stroke="var(--color-caramel)" strokeWidth="3.2" strokeLinecap="round" />
                  <line data-lab="svgElbowLine" x1="52" y1="46" x2="105" y2="54" stroke="var(--color-gold)" strokeWidth="3.2" strokeLinecap="round" />
                  <path d="M 43 36 A 14 14 0 0 1 66 48" fill="none" stroke="var(--color-caramel)" strokeWidth="1.8" />
                  <circle cx="36" cy="28" r="3" fill="var(--color-caramel)" />
                  <circle cx="52" cy="46" r="4.2" fill="var(--color-gold)" stroke="var(--color-night)" strokeWidth="1.5" />
                  <circle data-lab="svgElbowTip" cx="105" cy="54" r="3" fill="var(--color-caramel)" />
                  <text x="10" y="80" fill="var(--color-dust)" fontFamily="var(--font-mono)" fontSize="8">Humerus → radius</text>
                  <text data-lab="svgElbow" x="64" y="38" fill="var(--color-gold)" fontFamily="var(--font-mono)" fontSize="9.5" fontWeight="600">102°</text>
                </svg>
              </AngleCard>
              <AngleCard name="Knee angle" range="Range: 107° to 180°" lab="cardKnee" value="108°">
                <svg viewBox="0 0 140 86" className="h-full w-full" aria-hidden>
                  <path d="M 78 36 L 62 74 A 40 40 0 0 0 116 44 Z" fill="color-mix(in srgb, var(--color-caramel) 14%, transparent)" stroke="var(--color-caramel)" strokeOpacity="0.4" strokeDasharray="2 2" />
                  <line x1="30" y1="26" x2="78" y2="36" stroke="var(--color-caramel)" strokeWidth="3.2" strokeLinecap="round" />
                  <line data-lab="svgKneeLine" x1="78" y1="36" x2="64" y2="73" stroke="var(--color-gold)" strokeWidth="3.2" strokeLinecap="round" />
                  <line x1="78" y1="36" x2="116" y2="44" stroke="var(--color-gold)" strokeOpacity="0.3" strokeWidth="1.5" strokeDasharray="3 3" />
                  <path d="M 63 33 A 15 15 0 0 0 72 50" fill="none" stroke="var(--color-caramel)" strokeWidth="1.8" />
                  <circle cx="30" cy="26" r="3" fill="var(--color-caramel)" />
                  <circle cx="78" cy="36" r="4.2" fill="var(--color-gold)" stroke="var(--color-night)" strokeWidth="1.5" />
                  <circle data-lab="svgKneeTip" cx="64" cy="73" r="3" fill="var(--color-caramel)" />
                  <text x="10" y="80" fill="var(--color-dust)" fontFamily="var(--font-mono)" fontSize="8">Carpal fold 107°–180°</text>
                  <text data-lab="svgKnee" x="86" y="30" fill="var(--color-gold)" fontFamily="var(--font-mono)" fontSize="9.5" fontWeight="600">108°</text>
                </svg>
              </AngleCard>
            </div>
            <p className="border-l-2 border-gold pl-3 text-[0.86rem] leading-relaxed text-sand">{info.focus}</p>
          </aside>
        </div>

        {/* the figures */}
        <div className="grid gap-6 lg:grid-cols-[1.35fr_0.75fr_1fr]">
          <div className="plate min-w-0 p-5">
            <div className="flex flex-wrap items-baseline justify-between gap-2">
              <h3 className="t-voice text-[1.35rem] text-bone">Numbers from the stride model</h3>
              <p className="font-mono text-[0.64rem] text-brass">{LAB_TABLE.caption}</p>
            </div>
            <p className="mt-1 text-[0.8rem] italic text-dust">{LAB_CAVEAT}</p>
            <div className="mt-3 overflow-x-auto">
              <table className="w-full min-w-[30rem] border-collapse text-[0.84rem]">
                <thead>
                  <tr className="border-b border-line font-mono text-[0.62rem] uppercase tracking-[0.1em] text-dust">
                    <th scope="col" className="py-2 pr-2 text-left font-normal">Movement over one stride</th>
                    <th scope="col" className="px-2 py-2 text-right font-normal">Horse&apos;s back</th>
                    <th scope="col" className="px-2 py-2 text-right font-normal">Rider&apos;s pelvis</th>
                    <th scope="col" className="py-2 pl-2 text-right font-normal">Cycles a stride</th>
                  </tr>
                </thead>
                <tbody>
                  {LAB_TABLE.rows.map((r) => (
                    <tr key={r.metric} className="border-b border-line/60">
                      <th scope="row" className="py-2 pr-2 text-left font-normal text-bone">{r.metric}</th>
                      <td className="px-2 py-2 text-right font-mono text-gold">{r.horse}</td>
                      <td className="px-2 py-2 text-right font-mono text-caramel">{r.rider}</td>
                      <td className="py-2 pl-2 text-right font-mono text-sand">{r.cycles}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
          <div className="plate flex flex-col gap-3 p-5">
            <p className={KICKER}><span>Tempo and rhythm</span><span className="shrink-0 whitespace-nowrap font-mono">Cadence</span></p>
            {LAB_TEMPO.map((t) => (
              <div key={t.label} className="border-l-2 border-gold py-1 pl-3">
                <p className="label text-[0.62rem] text-dust">{t.label}</p>
                <p className="t-voice text-[1.3rem] leading-tight text-gold">{t.value}</p>
                <p className="font-mono text-[0.64rem] text-sand">{t.sub}</p>
              </div>
            ))}
          </div>
          <div className="plate flex flex-col gap-3 p-5">
            <p className={KICKER}><span>Hoof and stride mechanics</span><span className="shrink-0 whitespace-nowrap font-mono">Ground contact</span></p>
            <p className="label text-[0.62rem] text-dust">Landing order · a quarter of a stride apart</p>
            <ol className="grid grid-cols-4 gap-1.5">
              {LAB_LANDINGS.map((h, i) => (
                <li key={h.code} className="border border-line px-1 py-2 text-center">
                  <p className="font-mono text-[0.7rem] font-semibold text-gold">0{i + 1} · {h.code}</p>
                  <p className="text-[0.72rem] text-bone">{h.name}</p>
                  <p className="font-mono text-[0.6rem] text-caramel">+{i * 25}%</p>
                </li>
              ))}
            </ol>
            <div className="grid grid-cols-2 gap-2">
              {LAB_PLANTED.map((p) => (
                <div key={p.label} className="border border-line p-2.5">
                  <p className="text-[0.72rem] leading-snug text-sand">{p.label}</p>
                  <p className="mt-1 font-mono text-[0.86rem] font-semibold text-gold">{p.value}</p>
                  <p className="font-mono text-[0.6rem] text-dust">({p.authored})</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

/** A group of choices drawn as plain words (the chosen one underlined in gold): real radio buttons underneath, so the arrow keys work. */
function Choice<T extends string>({ legend, name, value, options, onChange, compact, inline }: { legend: string; name: string; value: T; options: { id: T; label: string }[]; onChange: (v: T) => void; compact?: boolean; inline?: boolean }) {
  return (
    <fieldset className={cn(compact && "flex flex-wrap items-center gap-x-3 gap-y-1 border-b border-line pb-3", inline && "grid grid-cols-[4.2rem_1fr] items-start gap-x-2")}>
      <legend className={cn("label text-[0.62rem] text-dust", compact ? "float-left mr-1" : inline ? "float-left w-[4.2rem] pt-2.5" : "mb-1")}>{legend}</legend>
      <div className={cn("flex flex-wrap gap-x-1 gap-y-0.5", inline && "col-start-2")}>
        {options.map((o) => (
          <label key={o.id} className="relative cursor-pointer">
            <input type="radio" name={name} value={o.id} checked={value === o.id} onChange={() => onChange(o.id)} className="peer sr-only" />
            <span className="block min-h-9 border-b-2 border-transparent px-2 py-1.5 font-mono text-[0.78rem] text-sand transition-colors hover:text-bone peer-checked:border-gold peer-checked:text-gold peer-focus-visible:outline peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-gold">{o.label}</span>
          </label>
        ))}
      </div>
    </fieldset>
  );
}

function AngleCard({ name, range, value, lab, children }: { name: string; range: string; value: string; lab: string; children: ReactNode }) {
  return (
    <div className="flex flex-col gap-1.5 border border-line p-2.5">
      <p className="flex items-baseline justify-between gap-2">
        <span className="font-mono text-[0.6rem] uppercase tracking-[0.08em] text-sand">{name}</span>
        <span data-lab={lab} className="font-mono text-[1.15rem] font-semibold text-gold">{value}</span>
      </p>
      <p className="font-mono text-[0.6rem] text-caramel">{range}</p>
      <div className="h-[5.5rem] border border-line/60">{children}</div>
    </div>
  );
}

type Palette = { gold: string; brass: string; bone: string; sand: string; night: string; copper: string; shade: (alpha: number) => string; u: number };

/** A swinging limb: a dashed arc for its range, a line to where it is now, a dot at its end. Returns that end point. */
function pendulum(ctx: CanvasRenderingContext2D, x: number, y: number, length: number, angle: number, C: Palette, solid: boolean) {
  ctx.save();
  ctx.setLineDash([6, 10]); ctx.strokeStyle = C.gold; ctx.globalAlpha = 0.45; ctx.lineWidth = (2) * C.u;
  ctx.beginPath(); ctx.arc(x, y, length, Math.PI / 2 - 0.34, Math.PI / 2 + 0.34); ctx.stroke();
  ctx.setLineDash(solid ? [] : [8, 8]); ctx.globalAlpha = solid ? 0.85 : 0.6; ctx.lineWidth = (solid ? 3 : 2.4) * C.u;
  const tx = x - Math.sin(angle) * length, ty = y + Math.cos(angle) * length;
  ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(tx, ty); ctx.stroke();
  ctx.globalAlpha = 1; ctx.fillStyle = C.gold; ctx.beginPath(); ctx.arc(tx, ty, 7 * C.u, 0, TAU); ctx.fill();
  ctx.restore();
  return { x: tx, y: ty };
}

function badge(ctx: CanvasRenderingContext2D, x: number, y: number, label: string, C: Palette, mono: string) {
  ctx.save();
  ctx.font = `600 ${Math.round(20 * C.u)}px ${mono}`;
  const w = ctx.measureText(label).width + 26 * C.u, h = 38 * C.u;
  ctx.fillStyle = C.shade(0.86); ctx.strokeStyle = C.gold; ctx.globalAlpha = 1; ctx.lineWidth = (1.5) * C.u;
  ctx.beginPath(); ctx.rect(x, y - h / 2, w, h); ctx.fill(); ctx.stroke();
  ctx.fillStyle = C.gold; ctx.textAlign = "left"; ctx.textBaseline = "middle"; ctx.fillText(label, x + 13 * C.u, y + 1);
  ctx.restore();
}

/** Behind, front and above: a drawn plan of the same stride over the dimmed film. */
function drawSchematic(ctx: CanvasRenderingContext2D, cam: "behind" | "front" | "above", phase: number, C: Palette, mono: string) {
  const cx = 960, cy = 590;
  const rock = Math.sin(phase * TAU) * 26, bounce = Math.sin(phase * TAU * 2) * 9;
  ctx.save();
  ctx.strokeStyle = C.gold; ctx.globalAlpha = 0.3; ctx.lineWidth = (2) * C.u;
  ctx.beginPath(); ctx.moveTo(cx - 420, cy + 300); ctx.lineTo(cx + 420, cy + 300); ctx.moveTo(cx, cy - 360); ctx.lineTo(cx, cy + 330); ctx.stroke();
  ctx.globalAlpha = 1; ctx.font = `600 24px ${mono}`; ctx.fillStyle = C.gold; ctx.textAlign = "center";
  if (cam === "above") {
    ctx.fillText("ABOVE · THE SPINE'S SIDEWAYS WAVE AND THE NECK AS A BALANCING POLE", cx, 110);
    ctx.lineWidth = (8) * C.u; ctx.strokeStyle = C.gold; ctx.beginPath();
    for (let x = cx - 460; x <= cx + 460; x += 12) { const u = (x - (cx - 460)) / 920; const y = cy + Math.sin(u * TAU * 1.5 - phase * TAU) * 34; if (x === cx - 460) ctx.moveTo(x, y); else ctx.lineTo(x, y); }
    ctx.stroke();
    ctx.fillStyle = C.copper; ctx.beginPath(); ctx.ellipse(cx - 20, cy + Math.sin(phase * TAU) * 26, 72, 50, 0, 0, TAU); ctx.fill();
  } else {
    ctx.fillText(cam === "behind" ? "BEHIND · CROUP AND RIDER'S PELVIS, SIDE TO SIDE (14.0 / 15.7 mm)" : "FRONT · SHOULDER AND FORELIMB PENDULUM (ELBOW 102° / KNEE 108°)", cx, 110);
    ctx.fillStyle = C.shade(0.35); ctx.strokeStyle = C.gold; ctx.lineWidth = (4.5) * C.u;
    ctx.beginPath(); ctx.ellipse(cx + rock * 0.6, cy + 20 + bounce, 128, 148, rock * 0.008, 0, TAU); ctx.fill(); ctx.stroke();
    ctx.strokeStyle = C.copper; ctx.lineWidth = (7) * C.u;
    ctx.beginPath(); ctx.moveTo(cx - 110 + rock, cy - 34 + bounce - rock * 0.35); ctx.lineTo(cx + 110 + rock, cy - 34 + bounce + rock * 0.35); ctx.stroke();
    ctx.strokeStyle = C.bone; ctx.lineWidth = (5) * C.u;
    ctx.beginPath(); ctx.arc(cx + rock * 0.85, cy - 255 + bounce, 26, 0, TAU);
    ctx.moveTo(cx + rock * 0.85, cy - 228 + bounce); ctx.lineTo(cx + rock * 0.75, cy - 85 + bounce); ctx.stroke();
    ctx.strokeStyle = C.gold;
    ctx.beginPath(); ctx.moveTo(cx - 80 + rock * 0.4, cy + 122); ctx.lineTo(cx - 80, cy + 300); ctx.moveTo(cx + 80 + rock * 0.4, cy + 122); ctx.lineTo(cx + 80, cy + 268); ctx.stroke();
  }
  ctx.restore();
}
