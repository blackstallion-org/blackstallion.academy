"use client";

import { useCallback, useEffect, useRef, useState, type ReactNode } from "react";
import { Pause, Play, SlidersHorizontal } from "lucide-react";
import { Headline } from "@/components/film/Headline";
import {
  CAMERA_MEDIA, CAMERA_ORDER, LAB_CAVEAT, LAB_CONTACT, LAB_FILM as FILM, LAB_JOINT_NOTE, LAB_LANDINGS, LAB_LANDMARKS as L, LAB_PARTS,
  LAB_STANCE, LAB_STRIDES_PER_MIN, LAB_SUPPORT, LAB_TABLE, LAB_TEMPO,
  type Camera, type PartId,
} from "@/lib/content/movement-lab";
import { useReducedMotion } from "@/lib/motion/reduced";
import { cn } from "@/lib/utils";

type Show = "both" | "horse" | "rider" | "skeleton";
type Hoof = keyof typeof LAB_STANCE;
type Option<T extends string> = { id: T; label: string; disabled?: boolean; note?: string };

const SHOWS: Option<Show>[] = [
  { id: "both", label: "Horse and rider" }, { id: "horse", label: "Horse" }, { id: "rider", label: "Rider" }, { id: "skeleton", label: "Skeleton" },
];
const CAMERAS: Option<Camera>[] = CAMERA_ORDER.map((id) => ({
  id, label: CAMERA_MEDIA[id].label, disabled: !CAMERA_MEDIA[id].available, note: CAMERA_MEDIA[id].pendingNote,
}));
const SPEEDS = [0.25, 0.5, 1] as const;
const REF_PHASE = 0.5; // the held pose: half a stride, as the right hind lands (by the stride convention)
const TAU = Math.PI * 2;
const FADE = "transition-opacity duration-[400ms] ease-out motion-reduce:transition-none";

const RING = "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold";
const KICKER = "label flex items-center justify-between gap-3 border-b border-line pb-2 text-[0.68rem] text-brass";

/** Where the side film is in its stride, 0..1: the film's own clock over its measured period (the one measured quantity). */
function phaseOf(v: HTMLVideoElement | null | undefined) {
  return v ? (((v.currentTime % FILM.period) + FILM.period) % FILM.period) / FILM.period : REF_PHASE;
}

/** A hoof in its own cycle: in stance (k 0..1 from landing to lift-off) or in the swing (k 0..1 from lift-off to landing). */
function limb(h: Hoof, phase: number) {
  const { on, off } = LAB_CONTACT[h];
  const stanceLen = (((off - on) % 1) + 1) % 1;
  const t = (((phase - on) % 1) + 1) % 1;
  return t < stanceLen ? { stance: true, k: t / stanceLen } : { stance: false, k: (t - stanceLen) / (1 - stanceLen) };
}

/** The limb's angle from vertical (radians; + = back): it sweeps back while the hoof is planted and swings forward in the air. */
function limbAngle(h: Hoof, phase: number, amp: number) {
  const { stance, k } = limb(h, phase);
  return stance ? amp * (2 * k - 1) : amp * Math.cos(k * Math.PI);
}

/**
 * The educational simulation at a point in the stride (phase 0..1), from the typical walk (LAB_STANCE): which hooves are down,
 * and how far the near foreleg's elbow and carpus are folded (0 straight under load .. 1 mid-swing). Nothing here is measured.
 */
function sim(phase: number) {
  const hooves = (Object.keys(LAB_STANCE) as Hoof[]).filter((h) => stance(h, phase) > 0);
  const lf = limb("LF", phase);
  return { hooves, fold: lf.stance ? 0 : Math.sin(lf.k * Math.PI) };
}

/** 0 when the hoof is in the air, rising to 1 mid-stance (for the ripple's strength). */
function stance(hoof: Hoof, phase: number) {
  for (const [a, b] of LAB_STANCE[hoof]) {
    if (phase >= a && phase < b) return Math.sin(((phase - a) / (b - a)) * Math.PI) * 0.6 + 0.4;
  }
  return 0;
}

/**
 * The Movement Laboratory: five camera views of a horse and rider walking (side, three-quarter, behind, front, above), the stride
 * drawn over the side film (the topline's wave, the rider's seat, the limb pendulums, hoof-contact ripples, six numbered parts),
 * and the controls and figures around it. Only the stride period is measured from the film; the drawing is an educational
 * simulation timed to it, the footfall timing is the typical walk, and the figures beneath are published findings (sources in
 * lib/content/movement-lab.ts and docs/BIOMECHANICS_AUDIT.md). Switching views crossfades in 400 ms (instantly under reduced
 * motion). Reduced motion: no film plays until the visitor presses play; the posters show.
 */
export function MovementLab({ headingAs = "h2" }: { headingAs?: "h1" | "h2" }) {
  const reduced = useReducedMotion();
  const sectionRef = useRef<HTMLElement>(null);
  const videos = useRef<Partial<Record<Camera, HTMLVideoElement | null>>>({});
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);

  const [playing, setPlaying] = useState(false);
  const [speed, setSpeed] = useState<(typeof SPEEDS)[number]>(1);
  const [locked, setLocked] = useState(false);
  const [show, setShow] = useState<Show>("both");
  const [camera, setCamera] = useState<Camera>("side");
  const [part, setPart] = useState<PartId>("03");
  const [hint, setHint] = useState<Camera | null>(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const [menuFit, setMenuFit] = useState({ up: true, max: 480 });
  const menuRef = useRef<HTMLDivElement>(null);
  const menuButtonRef = useRef<HTMLButtonElement>(null);
  const hintTimer = useRef<number | undefined>(undefined);
  const userPaused = useRef(false);
  const inView = useRef(false);
  const state = useRef({ locked, show, camera, part });
  useEffect(() => { state.current = { locked, show, camera, part }; }, [locked, show, camera, part]);

  const seekPhase = useCallback((phase: number) => {
    const v = videos.current.side;
    if (!v) return;
    const base = Math.floor(v.currentTime / FILM.period) * FILM.period;
    const duration = Number.isFinite(v.duration) ? v.duration : 6 * FILM.period;
    v.currentTime = Math.min(duration - 0.01, base + Math.min(0.999, Math.max(0, phase)) * FILM.period);
  }, []);

  // the view's film plays while on screen (not under reduced motion, not after the visitor paused); every film pauses off screen
  useEffect(() => {
    const section = sectionRef.current;
    if (!section) return;
    const io = new IntersectionObserver(([e]) => {
      inView.current = e.isIntersecting;
      const v = videos.current[state.current.camera];
      if (e.isIntersecting && v && !reduced && !userPaused.current && !state.current.locked) v.play().catch(() => {});
      else if (!e.isIntersecting) Object.values(videos.current).forEach((x) => x?.pause());
    }, { threshold: 0.2 });
    io.observe(section);
    return () => io.disconnect();
  }, [reduced]);
  // a film that loads later resets its rate to the default, so both are set
  useEffect(() => {
    Object.values(videos.current).forEach((v) => { if (v) { v.defaultPlaybackRate = speed; v.playbackRate = speed; } });
  }, [speed]);

  // the overlay and every live readout, once a frame while the section is on screen
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

    // every live readout, collected once (plain DOM nodes; React renders them once and leaves them alone)
    const out: Record<string, Element | undefined> = {};
    section.querySelectorAll("[data-lab]").forEach((el) => { out[el.getAttribute("data-lab") ?? ""] = el; });
    const text = (key: string, value: string) => { const el = out[key]; if (el && el.textContent !== value) el.textContent = value; };

    const frame = () => {
      raf = visible ? requestAnimationFrame(frame) : 0;
      const { locked: lock, show: mode, camera: cam, part: active } = state.current;

      // the stride clock and footfall timeline belong to the side film; the other views are separate footage
      if (cam !== "side") {
        text("pct", CAMERA_MEDIA[cam].kind === "video" ? "Looping footage" : "Still photograph");
        text("support", "The stride timeline follows the side film.");
        return;
      }
      const phase = lock ? REF_PHASE : phaseOf(videos.current.side);
      const b = sim(phase);

      // live readouts (the DOM, not React state: no re-render each frame)
      const pct = Math.round(phase * 100);
      text("pct", `${pct}% of the stride`);
      text("support", `Typical walk: ${b.hooves.length} hooves down · ${b.hooves.join(" ")}`);
      const slider = out.slider as HTMLInputElement | null;
      if (slider && document.activeElement !== slider) { slider.value = String(phase * 100); slider.setAttribute("aria-valuetext", `${pct}% of the stride`); }
      const playhead = out.playhead as HTMLElement | null;
      if (playhead) playhead.style.left = `${phase * 100}%`;
      const open = 1 - b.fold; // the joint diagrams: 1 straight, 0 folded
      out.svgElbowLine?.setAttribute("x2", (105 - open * 16).toFixed(1)); out.svgElbowLine?.setAttribute("y2", (54 + open * 22).toFixed(1));
      out.svgElbowTip?.setAttribute("cx", (105 - open * 16).toFixed(1)); out.svgElbowTip?.setAttribute("cy", (54 + open * 22).toFixed(1));
      out.svgKneeLine?.setAttribute("x2", (64 + open * 50).toFixed(1)); out.svgKneeLine?.setAttribute("y2", (73 - open * 28).toFixed(1));
      out.svgKneeTip?.setAttribute("cx", (64 + open * 50).toFixed(1)); out.svgKneeTip?.setAttribute("cy", (73 - open * 28).toFixed(1));

      // the overlay, in film pixels (an educational simulation: drawn at the landmarks, timed to the measured stride, not tracked)
      const s = canvas.width / FILM.width;
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.setTransform(s, 0, 0, s, 0, 0);
      ctx.lineCap = "round"; ctx.lineJoin = "round";

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
      // the trunk rises and falls twice a stride at the walk (Faber et al. 2000); the amplitude is a drawing value
      const bob = Math.sin(phase * TAU * 2) * 4;

      // 1 · the topline: tail head → croup → loin → over the saddle → withers → crest → poll
      ctx.save();
      ctx.shadowColor = C.gold; ctx.shadowBlur = 14;
      ctx.strokeStyle = active === "01" ? C.bone : C.gold; ctx.lineWidth = (active === "01" || strong ? 5 : 3.4) * C.u;
      const P = L.topline;
      ctx.beginPath(); ctx.moveTo(P[0][0], P[0][1] + bob);
      for (let i = 1; i < P.length - 1; i++) ctx.quadraticCurveTo(P[i][0], P[i][1] + bob, (P[i][0] + P[i + 1][0]) / 2, (P[i][1] + P[i + 1][1]) / 2 + bob);
      ctx.lineTo(P[P.length - 1][0], P[P.length - 1][1] + bob);
      ctx.stroke();
      ctx.shadowBlur = 0; ctx.fillStyle = C.gold;
      P.forEach(([x, y], i) => { if (i % 2 === 0) { ctx.beginPath(); ctx.arc(x, y + bob, 4.5 * C.u, 0, TAU); ctx.fill(); } });
      ctx.restore();

      // 2 · the rider's seat: a trace through the pelvis, two rises a stride
      if (mode !== "horse") {
        ctx.save();
        ctx.strokeStyle = active === "05" ? C.bone : C.copper; ctx.lineWidth = (active === "05" ? 4.5 : 3) * C.u;
        ctx.beginPath();
        for (let dx = -120; dx <= 120; dx += 6) {
          const y = L.riderPelvis.y - 8 + Math.sin((dx / 120) * Math.PI * 2 - phase * TAU * 2 + 0.45) * 14;
          if (dx === -120) ctx.moveTo(L.riderPelvis.x + dx, y); else ctx.lineTo(L.riderPelvis.x + dx, y);
        }
        ctx.stroke();
        // posture line: head, shoulder, pelvis, knee, heel (shoulder, hip and heel stack in this film)
        ctx.setLineDash(strong ? [] : [8, 8]); ctx.strokeStyle = C.bone; ctx.globalAlpha = strong ? 0.9 : 0.5; ctx.lineWidth = (strong ? 3.4 : 2.2) * C.u;
        ctx.beginPath();
        ctx.moveTo(L.riderHead.x, L.riderHead.y); ctx.lineTo(L.riderShoulder.x, L.riderShoulder.y); ctx.lineTo(L.riderPelvis.x, L.riderPelvis.y);
        ctx.lineTo(L.riderKnee.x, L.riderKnee.y); ctx.lineTo(L.riderHeel.x, L.riderHeel.y);
        ctx.stroke(); ctx.restore();
      }

      // 3 · pelvis and hindquarters: croup → hip, and the near hind's pendulum (back while planted, forward in the swing)
      ctx.save();
      const hind = active === "02" || active === "04" || strong;
      ctx.strokeStyle = C.gold; ctx.globalAlpha = hind ? 0.95 : 0.6; ctx.lineWidth = (hind ? 3.6 : 2.4) * C.u;
      ctx.setLineDash(strong ? [] : [8, 8]);
      ctx.beginPath(); ctx.moveTo(L.croup.x, L.croup.y + bob); ctx.lineTo(L.hip.x, L.hip.y); ctx.stroke();
      pendulum(ctx, L.hip.x, L.hip.y, 440, limbAngle("LH", phase, 0.26), C);
      ctx.restore();

      // 4 · the forelimb from the shoulder: withers → shoulder → elbow, an arc at the elbow, and the near fore folding at the carpus
      ctx.save();
      const hot = active === "03" || strong;
      ctx.shadowColor = C.gold; ctx.shadowBlur = hot ? 12 : 4;
      ctx.strokeStyle = C.gold; ctx.lineWidth = (hot ? 5 : 3.2) * C.u;
      ctx.beginPath(); ctx.moveTo(L.withers.x, L.withers.y + bob); ctx.lineTo(L.shoulder.x, L.shoulder.y); ctx.lineTo(L.elbow.x, L.elbow.y); ctx.stroke();
      ctx.shadowBlur = 0;
      ctx.strokeStyle = C.copper; ctx.lineWidth = 3.4 * C.u;
      ctx.beginPath(); ctx.arc(L.elbow.x, L.elbow.y, 40, -1.9, -1.9 + (0.62 - 0.14 * b.fold) * Math.PI); ctx.stroke();
      foreleg(ctx, L.elbow.x, L.elbow.y, limbAngle("LF", phase, 0.28), b.fold, C, hot);
      [L.shoulder, L.elbow, L.hip].forEach((p) => { ctx.fillStyle = C.night; ctx.beginPath(); ctx.arc(p.x, p.y, 8 * C.u, 0, TAU); ctx.fill(); ctx.strokeStyle = C.gold; ctx.lineWidth = 3 * C.u; ctx.stroke(); });
      ctx.restore();

      // 5 · hoof contact: a ripple for every hoof the typical walk has down, strongest mid-stance (schematic spacing)
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

  const activeVideo = () => videos.current[state.current.camera] ?? null;
  const togglePlay = () => {
    const v = activeVideo();
    if (!v) return;
    setLocked(false);
    if (v.paused) { userPaused.current = false; v.play().catch(() => {}); }
    else { userPaused.current = true; v.pause(); }
  };
  const step = (dir: 1 | -1) => {
    const v = activeVideo();
    if (!v) return;
    userPaused.current = true; setLocked(false); v.pause();
    const duration = Number.isFinite(v.duration) ? v.duration : 6 * FILM.period;
    v.currentTime = (v.currentTime + dir / FILM.fps + duration) % duration;
  };
  const refPose = () => {
    const v = videos.current.side;
    const next = !locked;
    setLocked(next);
    if (!v) return;
    if (next) { userPaused.current = true; v.pause(); seekPhase(REF_PHASE); }
    else { userPaused.current = false; v.play().catch(() => {}); }
  };
  const scrub = (pct: number) => { setLocked(false); seekPhase(pct / 100); };

  // switch the view: the old film pauses and fades out, the new one fades in and plays if the lab is playing
  const chooseCamera = (next: Camera) => {
    if (!CAMERA_MEDIA[next].available || next === state.current.camera) return;
    state.current = { ...state.current, camera: next, locked: false };
    setCamera(next); setLocked(false); setPlaying(false);
    Object.entries(videos.current).forEach(([id, v]) => { if (v && id !== next) v.pause(); });
    const v = videos.current[next];
    if (v && inView.current && !reduced && !userPaused.current) v.play().catch(() => {});
  };
  // a disabled view (no footage yet) says so on hover or tap, and to screen readers through its description
  useEffect(() => () => window.clearTimeout(hintTimer.current), []);
  const peek = (id: Camera | null) => {
    window.clearTimeout(hintTimer.current);
    setHint(id);
    if (id) hintTimer.current = window.setTimeout(() => setHint(null), 2600);
  };

  const view = CAMERA_MEDIA[camera];
  const side = camera === "side";
  const info = LAB_PARTS.find((p) => p.id === part) ?? LAB_PARTS[2];
  const showLabel = SHOWS.find((x) => x.id === show)?.label ?? "Horse and rider";
  const menuNote = hint ? `${CAMERA_MEDIA[hint].label}: ${CAMERA_MEDIA[hint].pendingNote ?? "not available yet"}.` : !side ? "Show, the drawn stride and the timeline apply to the side film." : "";

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
            <span className="block">Four-beat walk · one stride every {FILM.period.toFixed(2)} s</span>
            <span className="block">About {Math.round(LAB_STRIDES_PER_MIN)} a minute, measured from the side film</span>
          </p>
        </header>

        <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_21rem] xl:grid-cols-[minmax(0,1fr)_24rem]">
          {/* the views, crossfading; the side film carries the drawn stride; one quiet control strip under it */}
          <figure className="plate flex min-w-0 flex-col self-start">
            <div ref={stageRef} className="tone-photo relative aspect-video w-full select-none overflow-hidden bg-night">
              {CAMERA_ORDER.filter((id) => CAMERA_MEDIA[id].available).map((id) => {
                const m = CAMERA_MEDIA[id];
                const on = id === camera;
                return (
                  <div key={id} inert={!on} className={cn("absolute inset-0", FADE, reduced && "transition-none", on ? "opacity-100" : "pointer-events-none opacity-0")}>
                    {m.kind === "video" ? (
                      <video
                        ref={(el) => { videos.current[id] = el; }}
                        className="absolute inset-0 h-full w-full object-cover"
                        style={{ objectPosition: m.objectPosition }}
                        muted loop playsInline preload={id === "side" ? "metadata" : "none"} poster={m.poster}
                        aria-label={m.alt}
                        onPlay={() => { if (state.current.camera === id) setPlaying(true); }}
                        onPause={() => { if (state.current.camera === id) setPlaying(false); }}
                      >
                        <source media="(max-width: 767px)" src={m.src.mobile} type="video/mp4" />
                        <source src={m.src.desktop} type="video/mp4" />
                      </video>
                    ) : (
                      // eslint-disable-next-line @next/next/no-img-element -- a fixed 16:9 plate inside the stage; srcSet covers phone and desktop
                      <img
                        src={m.src.desktop} srcSet={`${m.src.mobile} 1280w, ${m.src.desktop} 1920w`} sizes="(min-width: 1024px) 70vw, 100vw"
                        alt={m.alt} loading="lazy" decoding="async" draggable={false}
                        className="absolute inset-0 h-full w-full object-cover" style={{ objectPosition: m.objectPosition }}
                      />
                    )}
                    {id === "side" && (
                      <>
                        <canvas ref={canvasRef} aria-hidden className="pointer-events-none absolute inset-0 h-full w-full" />
                        <span className="pointer-events-none absolute left-[2.5%] top-[4%] bg-night/70 px-2 py-1 font-mono text-[0.58rem] uppercase tracking-[0.12em] text-sand sm:text-[0.62rem]">
                          Simulation<span className="hidden sm:inline"> · not tracked</span>
                        </span>
                        {LAB_PARTS.map((p) => (
                          <button
                            key={p.id} type="button" onClick={() => setPart(p.id)} aria-pressed={part === p.id} aria-label={`${p.id} ${p.name}`}
                            className={cn("absolute grid h-7 w-7 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full border font-mono text-[0.62rem] transition-colors before:absolute sm:h-8 sm:w-8 before:-inset-2 before:content-['']", part === p.id ? "border-bone bg-gold text-night" : "border-gold/80 bg-night/70 text-gold hover:bg-gold/20", RING)}
                            style={{ left: `${(p.at.x / FILM.width) * 100}%`, top: `${(p.at.y / FILM.height) * 100}%` }}
                          >{p.id}</button>
                        ))}
                      </>
                    )}
                  </div>
                );
              })}
            </div>

            <div className="flex flex-col gap-5 px-4 pb-5 pt-4 md:px-6">
              {/* one row: play, where we are in the stride, and the one View menu */}
              <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
                <button
                  type="button" onClick={togglePlay} disabled={view.kind !== "video"}
                  aria-label={view.kind !== "video" ? "A still photograph: nothing to play" : playing ? "Pause the film" : "Play the film"}
                  className={cn("grid h-11 w-11 shrink-0 place-items-center rounded-full border border-gold/60 text-bone transition-colors hover:border-gold hover:text-gold disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:border-gold/60 disabled:hover:text-bone", RING)}
                >
                  {playing ? <Pause size={17} strokeWidth={1.5} aria-hidden /> : <Play size={17} strokeWidth={1.5} aria-hidden className="translate-x-[1px]" />}
                </button>
                <div className="min-w-0 flex-1 font-mono text-[0.7rem] leading-snug">
                  <p data-lab="pct" className="font-semibold text-gold">50% of the stride</p>
                  <p data-lab="support" className="text-sand">Typical walk: 3 hooves down · LH LF RH</p>
                </div>
                <div ref={menuRef} className="relative">
                  <button
                    ref={menuButtonRef} type="button" onClick={toggleMenu} aria-expanded={menuOpen} aria-controls="lab-view-menu"
                    className={cn("inline-flex min-h-11 items-center gap-2 px-1 font-mono text-[0.72rem] text-sand transition-colors hover:text-gold aria-expanded:text-gold", RING)}
                  >
                    <SlidersHorizontal size={16} strokeWidth={1.5} aria-hidden /> View
                    <span className="hidden text-dust md:inline">· {view.label} · {showLabel} · {speed === 1 ? "1.0" : speed}×</span>
                  </button>
                  {menuOpen && (
                    <div id="lab-view-menu" role="group" aria-label="View and playback settings" className={cn("plate absolute right-0 z-20 flex w-[min(26rem,calc(100vw-4.5rem))] flex-col gap-3 overflow-y-auto overscroll-contain bg-ember p-4", menuFit.up ? "bottom-full mb-2" : "top-full mt-2")} style={{ maxHeight: menuFit.max }}>
                      <Choice inline legend="Show" name="lab-show" value={show} options={SHOWS} onChange={setShow} />
                      <Choice inline legend="Camera" name="lab-camera" value={camera} options={CAMERAS} onChange={chooseCamera} onPeek={peek} />
                      <p aria-live="polite" className="min-h-[1rem] pl-[4.7rem] font-mono text-[0.64rem] text-dust">{menuNote}</p>
                      <Choice inline legend="Speed" name="lab-speed" value={String(speed)} options={SPEEDS.map((v) => ({ id: String(v), label: `${v === 1 ? "1.0" : v}×` }))} onChange={(v) => setSpeed(Number(v) as (typeof SPEEDS)[number])} />
                      <div className="flex flex-wrap items-center gap-x-5 gap-y-2 border-t border-line pt-3 font-mono text-[0.74rem]">
                        <button type="button" disabled={view.kind !== "video"} onClick={() => step(-1)} className={cn("min-h-9 text-sand hover:text-gold disabled:cursor-not-allowed disabled:opacity-40", RING)}>‹ Back a frame</button>
                        <button type="button" disabled={view.kind !== "video"} onClick={() => step(1)} className={cn("min-h-9 text-sand hover:text-gold disabled:cursor-not-allowed disabled:opacity-40", RING)}>Forward a frame ›</button>
                        <label className={cn("flex min-h-9 items-center gap-2 text-sand", side ? "cursor-pointer" : "cursor-not-allowed opacity-40")}>
                          <input type="checkbox" checked={locked} disabled={!side} onChange={refPose} className="h-4 w-4 accent-[var(--color-gold)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold" />
                          Hold at half a stride
                        </label>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* the footfall chart is also the scrubber (side film): press or drag anywhere on it */}
              <div className={cn("grid grid-cols-[2rem_1fr] gap-x-3 transition-opacity", !side && "opacity-40")}>
                <div aria-hidden className="flex flex-col gap-2 self-start text-right font-mono text-[0.66rem] font-semibold text-gold">
                  {(Object.keys(LAB_STANCE) as Hoof[]).map((h) => <span key={h} className="flex h-2.5 items-center justify-end">{h}</span>)}
                </div>
                <div>
                  <div
                    className="relative has-[input:focus-visible]:outline has-[input:focus-visible]:outline-2 has-[input:focus-visible]:outline-offset-4 has-[input:focus-visible]:outline-gold"
                    role="img" aria-label="Typical walk footfall bars, timed to the side film's measured stride: left hind on the ground from 0 to 62% of the stride, left fore from 25 to 87%, right hind from 50% to 12% of the next, right fore from 75% to 37% of the next."
                  >
                    <div className="flex flex-col gap-2">
                      {(Object.keys(LAB_STANCE) as Hoof[]).map((h) => (
                        <span key={h} className="relative h-2.5 overflow-hidden rounded-full bg-bone/10">
                          {LAB_STANCE[h].map(([a, b]) => <span key={a} className="absolute inset-y-0 rounded-full bg-gradient-to-r from-caramel to-gold" style={{ left: `${a * 100}%`, width: `${(b - a) * 100}%` }} />)}
                        </span>
                      ))}
                    </div>
                    <span data-lab="playhead" aria-hidden className="pointer-events-none absolute -inset-y-1.5 w-0.5 -translate-x-1/2 bg-bone" style={{ left: "50%" }}>
                      <span className="absolute -top-1 left-1/2 h-2.5 w-2.5 -translate-x-1/2 rounded-full bg-bone" />
                    </span>
                    <input
                      data-lab="slider" type="range" min={0} max={100} step={0.5} defaultValue={50} disabled={!side}
                      aria-label="Point in the stride (side film)"
                      onChange={(e) => scrub(Number(e.currentTarget.value))}
                      onPointerDown={() => { userPaused.current = true; videos.current.side?.pause(); }}
                      className="absolute -inset-y-3 left-0 h-[calc(100%+1.5rem)] w-full cursor-ew-resize opacity-0 disabled:cursor-not-allowed"
                    />
                  </div>
                  <p aria-hidden className="mt-2 flex justify-between font-mono text-[0.6rem] uppercase tracking-[0.06em] text-dust">
                    <span>0 · LH lands</span><span>25 · LF</span><span>50 · RH</span><span>75 · RF</span><span>100</span>
                  </p>
                </div>
              </div>

              <p className="flex flex-col gap-1 border-t border-line pt-3">
                <span className="font-mono text-[0.68rem] text-sand">{view.caption}</span>
                {side && <span className="text-[0.66rem] italic leading-snug text-dust">{LAB_CAVEAT}</span>}
              </p>
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
              <AngleCard name="Elbow" note="Folds in the swing">
                <svg viewBox="0 0 140 86" className="h-full w-full" aria-hidden>
                  <path d="M 52 46 L 106 54 A 54 54 0 0 1 88 78 Z" fill="color-mix(in srgb, var(--color-gold) 14%, transparent)" stroke="var(--color-gold)" strokeOpacity="0.4" strokeDasharray="2 2" />
                  <line x1="74" y1="12" x2="36" y2="28" stroke="var(--color-bone)" strokeOpacity="0.3" strokeWidth="2" strokeLinecap="round" />
                  <line x1="36" y1="28" x2="52" y2="46" stroke="var(--color-caramel)" strokeWidth="3.2" strokeLinecap="round" />
                  <line data-lab="svgElbowLine" x1="52" y1="46" x2="89" y2="76" stroke="var(--color-gold)" strokeWidth="3.2" strokeLinecap="round" />
                  <path d="M 43 36 A 14 14 0 0 1 66 48" fill="none" stroke="var(--color-caramel)" strokeWidth="1.8" />
                  <circle cx="36" cy="28" r="3" fill="var(--color-caramel)" />
                  <circle cx="52" cy="46" r="4.2" fill="var(--color-gold)" stroke="var(--color-night)" strokeWidth="1.5" />
                  <circle data-lab="svgElbowTip" cx="89" cy="76" r="3" fill="var(--color-caramel)" />
                  <text x="10" y="80" fill="var(--color-dust)" fontFamily="var(--font-mono)" fontSize="8">Humerus → radius</text>
                </svg>
              </AngleCard>
              <AngleCard name="Carpus (knee)" note="Straight under load">
                <svg viewBox="0 0 140 86" className="h-full w-full" aria-hidden>
                  <path d="M 78 36 L 62 74 A 40 40 0 0 0 116 44 Z" fill="color-mix(in srgb, var(--color-caramel) 14%, transparent)" stroke="var(--color-caramel)" strokeOpacity="0.4" strokeDasharray="2 2" />
                  <line x1="30" y1="26" x2="78" y2="36" stroke="var(--color-caramel)" strokeWidth="3.2" strokeLinecap="round" />
                  <line data-lab="svgKneeLine" x1="78" y1="36" x2="114" y2="45" stroke="var(--color-gold)" strokeWidth="3.2" strokeLinecap="round" />
                  <line x1="78" y1="36" x2="116" y2="44" stroke="var(--color-gold)" strokeOpacity="0.3" strokeWidth="1.5" strokeDasharray="3 3" />
                  <path d="M 63 33 A 15 15 0 0 0 72 50" fill="none" stroke="var(--color-caramel)" strokeWidth="1.8" />
                  <circle cx="30" cy="26" r="3" fill="var(--color-caramel)" />
                  <circle cx="78" cy="36" r="4.2" fill="var(--color-gold)" stroke="var(--color-night)" strokeWidth="1.5" />
                  <circle data-lab="svgKneeTip" cx="114" cy="45" r="3" fill="var(--color-caramel)" />
                  <text x="10" y="80" fill="var(--color-dust)" fontFamily="var(--font-mono)" fontSize="8">Radius → cannon</text>
                </svg>
              </AngleCard>
            </div>
            <p className="font-mono text-[0.62rem] italic leading-snug text-dust">{LAB_JOINT_NOTE}</p>
            <p className="border-l-2 border-gold pl-3 text-[0.86rem] leading-relaxed text-sand">{info.focus}</p>
          </aside>
        </div>

        {/* the figures */}
        <div className="grid gap-6 lg:grid-cols-[1.35fr_0.75fr_1fr]">
          <div className="plate min-w-0 p-5">
            <div className="flex flex-wrap items-baseline justify-between gap-2">
              <h3 className="t-voice text-[1.35rem] text-bone">What moves in each stride</h3>
              <p className="font-mono text-[0.64rem] text-brass">{LAB_TABLE.sources}</p>
            </div>
            <p className="mt-1 text-[0.8rem] italic text-dust">{LAB_TABLE.caption}.</p>
            <div className="mt-3 overflow-x-auto">
              <table className="w-full min-w-[30rem] border-collapse text-[0.84rem]">
                <thead>
                  <tr className="border-b border-line font-mono text-[0.62rem] uppercase tracking-[0.1em] text-dust">
                    <th scope="col" className="py-2 pr-2 text-left font-normal">Movement</th>
                    <th scope="col" className="px-2 py-2 text-left font-normal">Horse&apos;s back</th>
                    <th scope="col" className="px-2 py-2 text-left font-normal">Rider</th>
                    <th scope="col" className="py-2 pl-2 text-right font-normal">Cycles a stride</th>
                  </tr>
                </thead>
                <tbody>
                  {LAB_TABLE.rows.map((r) => (
                    <tr key={r.metric} className="border-b border-line/60 align-top">
                      <th scope="row" className="py-2 pr-2 text-left font-normal text-bone">{r.metric}</th>
                      <td className="px-2 py-2 text-left text-gold">{r.horse}</td>
                      <td className="px-2 py-2 text-left text-sand">{r.rider}</td>
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
            <p className="label text-[0.62rem] text-dust">Landing order · typical walk, about a quarter-stride apart</p>
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
              {LAB_SUPPORT.map((p) => (
                <div key={p.label} className="border border-line p-2.5">
                  <p className="text-[0.72rem] leading-snug text-sand">{p.label}</p>
                  <p className="mt-1 text-[0.84rem] font-semibold leading-snug text-gold">{p.value}</p>
                  <p className="font-mono text-[0.6rem] text-dust">{p.note}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

/**
 * A group of choices drawn as plain words (the chosen one underlined in gold): real radio buttons underneath, so the arrow keys
 * work. A disabled option stays visible, is skipped by the arrow keys, carries its note as its description, and reports a hover
 * or tap through `onPeek` so the group can show the note.
 */
function Choice<T extends string>({ legend, name, value, options, onChange, onPeek, compact, inline }: { legend: string; name: string; value: T; options: Option<T>[]; onChange: (v: T) => void; onPeek?: (v: T | null) => void; compact?: boolean; inline?: boolean }) {
  return (
    <fieldset className={cn(compact && "flex flex-wrap items-center gap-x-3 gap-y-1 border-b border-line pb-3", inline && "grid grid-cols-[4.2rem_1fr] items-start gap-x-2")}>
      <legend className={cn("label text-[0.62rem] text-dust", compact ? "float-left mr-1" : inline ? "float-left w-[4.2rem] pt-2.5" : "mb-1")}>{legend}</legend>
      <div className={cn("flex flex-wrap gap-x-1 gap-y-0.5", inline && "col-start-2")}>
        {options.map((o) => (
          <label
            key={o.id}
            className={cn("relative", o.disabled ? "cursor-not-allowed" : "cursor-pointer")}
            onClick={o.disabled ? () => onPeek?.(o.id) : undefined}
            onPointerEnter={o.disabled ? () => onPeek?.(o.id) : undefined}
            onPointerLeave={o.disabled ? () => onPeek?.(null) : undefined}
          >
            <input
              type="radio" name={name} value={o.id} checked={value === o.id} disabled={o.disabled} onChange={() => onChange(o.id)}
              aria-describedby={o.note ? `${name}-${o.id}-note` : undefined} className="peer sr-only"
            />
            <span className={cn("block min-h-9 border-b-2 border-transparent px-2 py-1.5 font-mono text-[0.78rem] transition-colors peer-checked:border-gold peer-checked:text-gold peer-focus-visible:outline peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-gold", o.disabled ? "text-dust/60 line-through decoration-dust/40" : "text-sand hover:text-bone")}>{o.label}</span>
            {o.note && <span id={`${name}-${o.id}-note`} hidden>{o.note}</span>}
          </label>
        ))}
      </div>
    </fieldset>
  );
}

function AngleCard({ name, note, children }: { name: string; note: string; children: ReactNode }) {
  return (
    <div className="flex flex-col gap-1.5 border border-line p-2.5">
      <p className="font-mono text-[0.6rem] uppercase tracking-[0.08em] text-sand">{name}</p>
      <p className="font-mono text-[0.6rem] text-caramel">{note}</p>
      <div className="h-[5.5rem] border border-line/60">{children}</div>
    </div>
  );
}

type Palette = { gold: string; brass: string; bone: string; sand: string; night: string; copper: string; shade: (alpha: number) => string; u: number };

/** A swinging limb: a dashed arc for its range, a line to where it is now, a dot at its end. */
function pendulum(ctx: CanvasRenderingContext2D, x: number, y: number, length: number, angle: number, C: Palette) {
  ctx.save();
  ctx.setLineDash([6, 10]); ctx.strokeStyle = C.gold; ctx.globalAlpha = 0.45; ctx.lineWidth = 2 * C.u;
  ctx.beginPath(); ctx.arc(x, y, length, Math.PI / 2 - 0.34, Math.PI / 2 + 0.34); ctx.stroke();
  ctx.setLineDash([8, 8]); ctx.globalAlpha = 0.6; ctx.lineWidth = 2.4 * C.u;
  const tx = x - Math.sin(angle) * length, ty = y + Math.cos(angle) * length;
  ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(tx, ty); ctx.stroke();
  ctx.globalAlpha = 1; ctx.fillStyle = C.gold; ctx.beginPath(); ctx.arc(tx, ty, 7 * C.u, 0, TAU); ctx.fill();
  ctx.restore();
}

/** The near foreleg from the elbow: forearm to the carpus, then the cannon to the hoof, folding back at the carpus in the swing. */
function foreleg(ctx: CanvasRenderingContext2D, x: number, y: number, angle: number, fold: number, C: Palette, hot: boolean) {
  ctx.save();
  ctx.setLineDash([6, 10]); ctx.strokeStyle = C.gold; ctx.globalAlpha = 0.45; ctx.lineWidth = 2 * C.u;
  ctx.beginPath(); ctx.arc(x, y, 300, Math.PI / 2 - 0.34, Math.PI / 2 + 0.34); ctx.stroke();
  const kx = x - Math.sin(angle) * 152, ky = y + Math.cos(angle) * 152;
  const lower = angle + fold * 1.2;
  const hx = kx - Math.sin(lower) * 148, hy = ky + Math.cos(lower) * 148;
  ctx.setLineDash([]); ctx.globalAlpha = 0.85; ctx.lineWidth = (hot ? 3.6 : 3) * C.u;
  ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(kx, ky); ctx.lineTo(hx, hy); ctx.stroke();
  ctx.globalAlpha = 1;
  ctx.fillStyle = C.night; ctx.strokeStyle = C.copper; ctx.lineWidth = 2.6 * C.u;
  ctx.beginPath(); ctx.arc(kx, ky, 7 * C.u, 0, TAU); ctx.fill(); ctx.stroke();
  ctx.fillStyle = C.gold; ctx.beginPath(); ctx.arc(hx, hy, 7 * C.u, 0, TAU); ctx.fill();
  ctx.restore();
}
