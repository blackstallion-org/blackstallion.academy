"use client";

import gsap from "gsap";
import { useCallback, useEffect, useMemo, useRef, useState, type PointerEvent as RPointerEvent } from "react";
import { Headline } from "@/components/film/Headline";
import { GAITS, place, pose, vec, type GaitId, type Pose, type V } from "@/lib/anatomy/atlas-rig";
import { SHAPES, geometry, type Layer } from "@/lib/anatomy/atlas-scene";
import { CONNECTIONS, GAIT_INFO, LABELS, LIMB_NAMES, LIMB_ORDER, REVIEW, STRUCTURES, ZOOMS, type AtlasView } from "@/lib/content/anatomy-atlas";
import { useReducedMotion } from "@/lib/motion/reduced";
import { useMediaQuery } from "@/lib/stride/hooks";
import { cn } from "@/lib/utils";
import styles from "./atlas.module.css";

type Box = [number, number, number, number];
const FULL: Box = [-120, 50, 1200, 790];
/** phones open framed on the horse; the labels are read from the list below the drawing */
const NARROW: Box = [0, 45, 960, 632];
const SPEEDS = [0.25, 0.5, 1] as const;
const UNIT_MM = 10 / 2.9; // drawing units → millimetres (about 2.9 units to the centimetre)

/* the drawing area, with margins around the horse for the labels */
const VIEWS: { id: AtlasView; label: string; intro: string }[] = [
  { id: "skeleton", label: "Skeleton", intro: "The equine skeleton in lateral view, near side. Choose a bone to read what it does; the rider's skeleton sits in the saddle above." },
  { id: "muscle", label: "Muscles", intro: "The superficial muscle groups that move the neck, shoulder, back and hindquarters. Choose one to see its role." },
  { id: "rider", label: "Horse & rider", intro: "Horse and cadet together: the rider's seat follows the horse's back while the upper body stays upright over it." },
];

const LAYER_ORDER: Layer[] = ["farBody", "farBone", "body", "tack", "bone", "muscle", "riderBody", "riderBone", "riderNear"];

/**
 * The anatomy atlas: an interactive 2D (SVG) horse and rider, replacing the earlier three.js exhibit and the embedded stride
 * lab on /anatomy. A small rig (lib/anatomy/atlas-rig.ts) poses the skeleton for the walk, trot and canter, and the drawing
 * (lib/anatomy/atlas-scene.ts) is rebuilt from that pose every frame. The animation loop writes the paths directly; React only
 * re-renders when a control changes.
 */
export function AnatomyAtlas() {
  const reduced = useReducedMotion();
  const [view, setView] = useState<AtlasView>("skeleton");
  const [gait, setGait] = useState<GaitId>("walk");
  // null = the default: play, unless the visitor prefers reduced motion (then nothing moves until they press play)
  const [playChoice, setPlaying] = useState<boolean | null>(null);
  const [speed, setSpeed] = useState<(typeof SPEEDS)[number]>(0.5);
  const narrow = useMediaQuery("(max-width: 767px)");
  const [labelChoice, setLabels] = useState<boolean | null>(null);
  const labels = labelChoice ?? !narrow;
  const [rider, setRider] = useState(true);
  const [overlay, setOverlay] = useState(false);
  const [selected, setSelected] = useState<string | null>(null);
  const [hover, setHover] = useState<string | null>(null);
  const [connection, setConnection] = useState<string | null>(null);
  const [zoomed, setZoomed] = useState(false);

  const svgRef = useRef<SVGSVGElement>(null);
  const paths = useRef(new Map<string, SVGPathElement>());
  const leaders = useRef(new Map<string, SVGLineElement>());
  const dots = useRef(new Map<string, SVGCircleElement>());
  const groundRef = useRef<SVGGElement>(null);
  const headRef = useRef<SVGLineElement>(null);
  const plumbRef = useRef<SVGLineElement>(null);
  const cogHorse = useRef<SVGGElement>(null);
  const cogRider = useRef<SVGGElement>(null);
  const read = useRef(new Map<string, HTMLElement>());
  const phaseRef = useRef(0);
  const box = useRef<Box>([...FULL]);
  const playing = playChoice ?? !reduced;
  const state = useRef({ gait, playing, speed, view });
  useEffect(() => {
    state.current = { gait, playing, speed, view };
  }, [gait, playing, speed, view]);

  const initial = useMemo(() => geometry(pose("halt", 0)), []);
  const labelDefs = LABELS[view];

  /* ------------------------------------------------------------ drawing a frame */
  const draw = useCallback((pz: Pose) => {
    const g = geometry(pz);
    for (const [id, el] of paths.current) {
      const d = g[id];
      if (d) el.setAttribute("d", d);
    }
    const defs = LABELS[state.current.view];
    for (const l of defs) {
      const key = `${state.current.view}:${l.s}`;
      const a = place(pz, l.at);
      const line = leaders.current.get(key);
      const dot = dots.current.get(key);
      if (line) {
        line.setAttribute("x2", a[0].toFixed(1));
        line.setAttribute("y2", a[1].toFixed(1));
      }
      if (dot) {
        dot.setAttribute("cx", a[0].toFixed(1));
        dot.setAttribute("cy", a[1].toFixed(1));
      }
    }
    if (groundRef.current) groundRef.current.setAttribute("transform", `translate(${(-(pz.travel % 48)).toFixed(1)} 0)`);
    // footfall playhead
    if (headRef.current) {
      const x = (24 + pz.phase * 552).toFixed(1);
      headRef.current.setAttribute("x1", x);
      headRef.current.setAttribute("x2", x);
    }
    // rider alignment and centres of gravity (approximate)
    const rj = pz.rider.joints;
    if (plumbRef.current) {
      plumbRef.current.setAttribute("x1", rj.head[0].toFixed(1));
      plumbRef.current.setAttribute("y1", (rj.head[1] - 30).toFixed(1));
      plumbRef.current.setAttribute("x2", rj.head[0].toFixed(1));
      plumbRef.current.setAttribute("y2", (rj.ankle[1] + 20).toFixed(1));
    }
    const ch = place(pz, ["trunk", 500, 410]);
    cogHorse.current?.setAttribute("transform", `translate(${ch[0].toFixed(1)} ${ch[1].toFixed(1)})`);
    const cr = place(pz, ["R.pelvis", 538, 262]);
    cogRider.current?.setAttribute("transform", `translate(${cr[0].toFixed(1)} ${cr[1].toFixed(1)})`);
    // readouts
    const angle = (a: V, b: V, c: V) => {
      const u = vec.sub(a, b);
      const v = vec.sub(c, b);
      const d = Math.abs(vec.ang(u) - vec.ang(v));
      return Math.round(d > 180 ? 360 - d : d);
    };
    const set = (k: string, v: string) => {
      const el = read.current.get(k);
      if (el && el.textContent !== v) el.textContent = v;
    };
    set("rise", `${pz.saddleRise >= 0 ? "+" : "−"}${Math.abs(pz.saddleRise * UNIT_MM).toFixed(0)} mm`);
    set("hip", `${angle(rj.c7, rj.hip, rj.knee)}°`);
    set("knee", `${angle(rj.hip, rj.knee, rj.ankle)}°`);
    set("elbow", `${angle(rj.shoulder, rj.elbow, rj.hand)}°`);
    set("align", `${((rj.ankle[0] - rj.hip[0]) / 2.9).toFixed(0)} cm`);
    for (const id of LIMB_ORDER) set(`limb-${id}`, pz.limbs[id].stance ? "on the ground" : "in the air");
  }, []);

  /* ------------------------------------------------------------ animation loop */
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const el = svgRef.current;
    if (!el || typeof IntersectionObserver === "undefined") return;
    const io = new IntersectionObserver(([e]) => setVisible(e.isIntersecting), { rootMargin: "120px" });
    io.observe(el);
    return () => io.disconnect();
  }, []);

  useEffect(() => {
    draw(pose(gait, phaseRef.current));
    if (!visible || !playing || gait === "halt") return;
    let raf = 0;
    let last = performance.now();
    const tick = (now: number) => {
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;
      const s = state.current;
      phaseRef.current = (phaseRef.current + (dt * s.speed) / GAITS[s.gait].period) % 1;
      draw(pose(s.gait, phaseRef.current));
      const scrub = read.current.get("scrub") as HTMLInputElement | undefined;
      if (scrub) scrub.value = String(Math.round(phaseRef.current * 1000));
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [visible, playing, gait, draw]);

  // a view change re-places the labels for the current pose
  useEffect(() => {
    draw(pose(state.current.gait, phaseRef.current));
  }, [view, labels, draw]);

  /* ------------------------------------------------------------ zoom and pan */
  // the starting frame follows the screen width (set directly on the element; nothing else depends on it)
  useEffect(() => {
    const b: Box = narrow ? [...NARROW] : [...FULL];
    box.current = b;
    svgRef.current?.setAttribute("viewBox", b.join(" "));
  }, [narrow]);
  const applyBox = (b: Box) => {
    box.current = b;
    svgRef.current?.setAttribute("viewBox", b.map((n) => n.toFixed(1)).join(" "));
    setZoomed(b[2] < (narrow ? NARROW : FULL)[2] - 1);
  };
  const tweenTo = (b: Box) => {
    if (reduced) return applyBox(b);
    const o = { x: box.current[0], y: box.current[1], w: box.current[2], h: box.current[3] };
    gsap.killTweensOf(o);
    gsap.to(o, { x: b[0], y: b[1], w: b[2], h: b[3], duration: 0.9, ease: "power3.inOut", onUpdate: () => applyBox([o.x, o.y, o.w, o.h]) });
  };
  const fit = (b: Box): Box => {
    // keep the drawing's aspect ratio so nothing is squashed
    const ar = FULL[2] / FULL[3];
    let [x, y, w, h] = b;
    if (w / h > ar) {
      const nh = w / ar;
      y -= (nh - h) / 2;
      h = nh;
    } else {
      const nw = h * ar;
      x -= (nw - w) / 2;
      w = nw;
    }
    return [x, y, w, h];
  };
  const zoomBy = (k: number) => {
    const [x, y, w, h] = box.current;
    const nw = Math.min(FULL[2], Math.max(FULL[2] / 5, w / k));
    const nh = (nw / FULL[2]) * FULL[3];
    tweenTo([x + (w - nw) / 2, y + (h - nh) / 2, nw, nh]);
  };
  const drag = useRef<{ x: number; y: number; b: Box } | null>(null);
  const onDown = (e: RPointerEvent<SVGSVGElement>) => {
    if (!zoomed) return;
    drag.current = { x: e.clientX, y: e.clientY, b: [...box.current] };
    e.currentTarget.setPointerCapture(e.pointerId);
  };
  const onMove = (e: RPointerEvent<SVGSVGElement>) => {
    const d = drag.current;
    const el = svgRef.current;
    if (!d || !el) return;
    const k = d.b[2] / el.getBoundingClientRect().width;
    applyBox([d.b[0] - (e.clientX - d.x) * k, d.b[1] - (e.clientY - d.y) * k, d.b[2], d.b[3]]);
  };
  const onUp = () => {
    drag.current = null;
  };
  useEffect(() => {
    const el = svgRef.current;
    if (!el) return;
    // pinch or ctrl/⌘ + wheel zooms; a plain wheel keeps scrolling the page
    const onWheel = (e: WheelEvent) => {
      if (!e.ctrlKey && !e.metaKey) return;
      e.preventDefault();
      const [x, y, w, h] = box.current;
      const r = el.getBoundingClientRect();
      const px = x + ((e.clientX - r.left) / r.width) * w;
      const py = y + ((e.clientY - r.top) / r.height) * h;
      const k = Math.exp(-e.deltaY * 0.004);
      const nw = Math.min(FULL[2], Math.max(FULL[2] / 5, w / k));
      const nh = (nw / FULL[2]) * FULL[3];
      applyBox([px - ((px - x) * nw) / w, py - ((py - y) * nh) / h, nw, nh]);
    };
    el.addEventListener("wheel", onWheel, { passive: false });
    return () => el.removeEventListener("wheel", onWheel);
  }, []);

  /* ------------------------------------------------------------ selection */
  const conn = CONNECTIONS.find((c) => c.id === connection) ?? null;
  const lit = new Set<string>(conn ? conn.lights : []);
  if (selected) lit.add(selected);
  if (hover) lit.add(hover);
  const info = selected ? STRUCTURES[selected] : null;
  const chooseConnection = (id: string) => {
    if (connection === id) {
      setConnection(null);
      tweenTo(narrow ? [...NARROW] : [...FULL]);
      return;
    }
    const c = CONNECTIONS.find((x) => x.id === id)!;
    setConnection(id);
    setSelected(null);
    tweenTo(fit(c.focus));
  };
  const showRiderBody = view === "rider" || (rider && view !== "skeleton");
  const showRiderBone = rider && (view === "skeleton" || (view === "rider" && overlay));
  const layerOn: Record<Layer, boolean> = {
    farBody: true,
    body: true,
    tack: view === "rider" && rider,
    farBone: view === "skeleton" || (view === "rider" && overlay),
    bone: view === "skeleton" || (view === "rider" && overlay),
    muscle: view === "muscle",
    riderBody: showRiderBody && rider,
    riderNear: showRiderBody && rider,
    riderBone: showRiderBone,
  };
  const g = GAITS[gait];
  const gi = GAIT_INFO[gait];

  return (
    <section id="horse-rider-study" aria-labelledby="atlas-h" className={cn("relative bg-night py-20 md:py-28", styles.section)}>
      <div className="gutter">
        <p className="label text-brass">The anatomy atlas</p>
        <Headline id="atlas-h" inscription="One conversation." voice="Two bodies." size="2" className="mt-3" />
        <p className="mt-6 max-w-2xl text-lede leading-relaxed text-sand">
          Select a connection to explore how balanced riding helps both horse and rider reach the same purpose. Switch between the skeleton, the muscles and the horse with its rider, and watch each gait slowly, joint by joint.
        </p>
      </div>

      <div className="gutter mt-12 grid gap-8 xl:grid-cols-[minmax(0,1fr)_23rem]">
        {/* the drawing */}
        <div className="min-w-0">
          <div className={styles.toolbar} role="toolbar" aria-label="Atlas view">
            <div className={styles.segment} role="group" aria-label="Layer">
              {VIEWS.map((v) => (
                <button key={v.id} type="button" aria-pressed={view === v.id} onClick={() => setView(v.id)} className={styles.segBtn}>
                  {v.label}
                </button>
              ))}
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <Toggle on={labels} onClick={() => setLabels(!labels)} label="Labels" />
              <Toggle on={rider} onClick={() => setRider((x) => !x)} label="Rider" />
              {view === "rider" && <Toggle on={overlay} onClick={() => setOverlay((x) => !x)} label="Skeletons" />}
            </div>
          </div>

          <div className={styles.plate}>
            <svg
              ref={svgRef}
              viewBox={FULL.join(" ")}
              className={cn(styles.svg, zoomed && styles.grab)}
              data-view={view}
              data-lit={lit.size > 0 || undefined}
              role="img"
              aria-label={`${VIEWS.find((v) => v.id === view)?.label} of a Marwari horse${rider ? " with a cadet rider" : ""}, ${gi.label.toLowerCase()}`}
              onPointerDown={onDown}
              onPointerMove={onMove}
              onPointerUp={onUp}
              onPointerLeave={() => {
                onUp();
                setHover(null);
              }}
              onPointerOver={(e) => {
                const s = (e.target as Element).getAttribute?.("data-s");
                if (s && STRUCTURES[s]) setHover(s);
              }}
              onClick={(e) => {
                const s = (e.target as Element).getAttribute?.("data-s");
                if (s && STRUCTURES[s]) {
                  setSelected(s);
                  setConnection(null);
                }
              }}
            >
              <defs>
                <linearGradient id="atlas-ground" x1="0" x2="0" y1="0" y2="1">
                  <stop offset="0" stopColor="var(--atlas-ground)" stopOpacity="0.55" />
                  <stop offset="1" stopColor="var(--atlas-ground)" stopOpacity="0" />
                </linearGradient>
              </defs>
              <rect x="-400" y="700" width="2000" height="200" fill="url(#atlas-ground)" />
              <g ref={groundRef} aria-hidden>
                <line x1="-400" x2="1600" y1="700" y2="700" className={styles.groundLine} />
                {Array.from({ length: 42 }, (_, i) => (
                  <line key={i} x1={-400 + i * 48} x2={-394 + i * 48} y1="704" y2="704" className={styles.tick} />
                ))}
              </g>

              {LAYER_ORDER.map((layer) => (
                <g key={layer} className={cn(styles.layer, styles[`l-${layer}`])} data-on={layerOn[layer] || undefined} aria-hidden>
                  {SHAPES.filter((s) => s.layer === layer).map((s) => (
                    <path
                      key={s.id}
                      ref={(el) => {
                        if (el) paths.current.set(s.id, el);
                        else paths.current.delete(s.id);
                      }}
                      d={initial[s.id] ?? ""}
                      data-s={s.structure}
                      className={cn(styles.shape, styles[`t-${s.tone}`], s.stroke && styles.stroke, s.structure && lit.has(s.structure) && styles.lit, s.structure && styles.pick)}
                    />
                  ))}
                </g>
              ))}

              {/* rider view: the vertical line through ear, shoulder, hip and heel, and approximate centres of gravity */}
              <g className={styles.layer} data-on={(view === "rider" && rider) || undefined} aria-hidden>
                <line ref={plumbRef} className={styles.plumb} />
                <g ref={cogHorse}>
                  <circle r="9" className={styles.cog} />
                  <path d="M-9,0H9M0,-9V9" className={styles.cogCross} />
                </g>
                <g ref={cogRider}>
                  <circle r="6" className={styles.cog} />
                  <path d="M-6,0H6M0,-6V6" className={styles.cogCross} />
                </g>
              </g>

              {/* labels: fixed text, leader lines that follow the anatomy */}
              <g className={styles.layer} data-on={labels || undefined}>
                {labelDefs.map((l) => {
                  const key = `${view}:${l.s}`;
                  const st = STRUCTURES[l.s];
                  if (!st) return null;
                  const on = lit.has(l.s);
                  return (
                    <g key={key} className={cn(styles.label, on && styles.labelOn)} onClick={() => { setSelected(l.s); setConnection(null); }} onPointerEnter={() => setHover(l.s)} onPointerLeave={() => setHover(null)}>
                      <line
                        ref={(el) => {
                          if (el) leaders.current.set(key, el);
                          else leaders.current.delete(key);
                        }}
                        x1={l.text[0] + (l.align === "end" ? 6 : -6)}
                        y1={l.text[1] - 4}
                        className={styles.leader}
                      />
                      <circle
                        ref={(el) => {
                          if (el) dots.current.set(key, el);
                          else dots.current.delete(key);
                        }}
                        r="2.6"
                        className={styles.dot}
                      />
                      <text x={l.text[0]} y={l.text[1]} textAnchor={l.align === "end" ? "end" : "start"} className={styles.labelText}>
                        {l.name ?? st.name}
                      </text>
                    </g>
                  );
                })}
              </g>
            </svg>

            <div className={styles.zoom}>
              <button type="button" onClick={() => zoomBy(1.5)} aria-label="Zoom in" className={styles.round}>+</button>
              <button type="button" onClick={() => zoomBy(1 / 1.5)} aria-label="Zoom out" className={styles.round}>−</button>
              <button type="button" onClick={() => { setConnection(null); tweenTo(narrow ? [...NARROW] : [...FULL]); }} aria-label="Show the whole horse" className={styles.round} disabled={!zoomed}>⤢</button>
            </div>
            {hover && STRUCTURES[hover] && <p className={styles.tip}>{STRUCTURES[hover].name}</p>}
          </div>

          <div className="mt-3 flex flex-wrap items-center gap-x-6 gap-y-2">
            <p className="t-ui text-xs text-dust">{zoomed ? "Drag to move around. " : ""}Pinch, or hold Ctrl / ⌘ and scroll, to zoom.</p>
            <div className="flex flex-wrap gap-2">
              {ZOOMS.slice(1).map((z) => (
                <button key={z.id} type="button" onClick={() => { setConnection(null); tweenTo(fit(z.box)); }} className={styles.chip}>
                  {z.label}
                </button>
              ))}
            </div>
          </div>

          {/* movement */}
          <div className={styles.movement}>
            <div className="flex flex-wrap items-center gap-3">
              <button type="button" onClick={() => setPlaying(!playing)} className={styles.play} aria-label={playing ? "Pause" : "Play"} disabled={gait === "halt"}>
                {playing && gait !== "halt" ? "❚❚" : "▶"}
              </button>
              <div className={styles.segment} role="group" aria-label="Gait">
                {(["halt", "walk", "trot", "canter"] as GaitId[]).map((id) => (
                  <button key={id} type="button" aria-pressed={gait === id} onClick={() => setGait(id)} className={styles.segBtn}>
                    {GAIT_INFO[id].label}
                  </button>
                ))}
              </div>
              <div className={styles.segment} role="group" aria-label="Speed">
                {SPEEDS.map((s) => (
                  <button key={s} type="button" aria-pressed={speed === s} onClick={() => setSpeed(s)} className={styles.segBtn}>
                    {s === 1 ? "Real time" : `${s}×`}
                  </button>
                ))}
              </div>
            </div>
            <label className="mt-4 flex items-center gap-4">
              <span className="label shrink-0 text-dust">Stride</span>
              <input
                ref={(el) => {
                  if (el) read.current.set("scrub", el);
                }}
                type="range"
                min={0}
                max={999}
                defaultValue={0}
                disabled={gait === "halt"}
                onChange={(e) => {
                  setPlaying(false);
                  phaseRef.current = Number(e.target.value) / 1000;
                  draw(pose(state.current.gait, phaseRef.current));
                }}
                className={styles.range}
                aria-label="Position in the stride"
              />
            </label>

            {/* footfall diagram */}
            <div className="mt-6 grid gap-6 lg:grid-cols-[minmax(0,1fr)_16rem] lg:items-start">
              <figure>
                <svg viewBox="0 0 600 132" className="w-full" role="img" aria-label={`Footfall pattern of the ${gi.label.toLowerCase()}: ${gi.sequence}`}>
                  {LIMB_ORDER.map((id, row) => {
                    const y = 10 + row * 28;
                    const off = g.offset[id];
                    const segs: [number, number][] = gait === "halt" ? [[0, 1]] : off + g.duty <= 1 ? [[off, off + g.duty]] : [[off, 1], [0, off + g.duty - 1]];
                    return (
                      <g key={id}>
                        <text x="0" y={y + 13} className={styles.ffLabel}>{id}</text>
                        <rect x="24" y={y} width="552" height="18" className={styles.ffTrack} />
                        {segs.map(([a, b], i) => (
                          <rect key={i} x={24 + a * 552} y={y} width={(b - a) * 552} height="18" className={id.endsWith("F") ? styles.ffFore : styles.ffHind} />
                        ))}
                      </g>
                    );
                  })}
                  <line ref={headRef} y1="4" y2="122" className={styles.ffHead} />
                </svg>
                <figcaption className="t-ui mt-2 text-xs text-dust">
                  Dark bars: the hoof is on the ground. {gi.beats}: {gi.sequence}.
                </figcaption>
              </figure>
              <dl className={styles.readouts}>
                {LIMB_ORDER.map((id) => (
                  <div key={id}>
                    <dt>{LIMB_NAMES[id]}</dt>
                    <dd ref={(el) => { if (el) read.current.set(`limb-${id}`, el); }}>on the ground</dd>
                  </div>
                ))}
              </dl>
            </div>
          </div>
        </div>

        {/* the side panel: connections, what is selected, readouts */}
        <aside className="flex flex-col gap-6">
          <div className={styles.card}>
            <p className="label text-dust">Follow the system</p>
            <ul className="mt-4 flex flex-col gap-2">
              {CONNECTIONS.map((c) => (
                <li key={c.id}>
                  <button type="button" aria-pressed={connection === c.id} onClick={() => chooseConnection(c.id)} className={styles.conn}>
                    <span className="font-mono text-xs text-brass">{c.number}</span>
                    <span className="flex flex-col text-left">
                      <span className="t-voice text-xl text-bone">{c.system}</span>
                      <span className="t-ui text-xs text-sand">{c.title} · {c.subtitle}</span>
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          </div>

          <div className={styles.card} aria-live="polite">
            {conn ? (
              <>
                <p className="font-mono text-xs text-brass">{conn.number} · {conn.subtitle}</p>
                <h3 className="t-voice mt-2 text-3xl text-bone">{conn.title}</h3>
                <p className="t-story mt-3 text-sand">{conn.text}</p>
                <dl className="mt-4 grid gap-3 text-sm">
                  <div><dt className="label text-dust">Cadet</dt><dd className="t-ui mt-1 text-bone">{conn.rider}</dd></div>
                  <div><dt className="label text-dust">Horse</dt><dd className="t-ui mt-1 text-bone">{conn.horse}</dd></div>
                </dl>
              </>
            ) : info ? (
              <>
                <p className="label text-brass">{info.kind === "rider" ? "The cadet" : info.kind}</p>
                <h3 className="t-voice mt-2 text-3xl text-bone">{info.name}</h3>
                <p className="t-story mt-3 text-sand">{info.text}</p>
                <button type="button" onClick={() => setSelected(null)} className="label mt-4 text-dust hover:text-bone">Clear ✕</button>
              </>
            ) : (
              <>
                <p className="label text-brass">{VIEWS.find((v) => v.id === view)?.label}</p>
                <p className="t-story mt-3 text-sand">{VIEWS.find((v) => v.id === view)?.intro}</p>
                <p className="t-ui mt-3 text-xs text-dust">{gi.label}: {gi.note}</p>
              </>
            )}
          </div>

          {view === "rider" && (
            <div className={styles.card}>
              <p className="label text-dust">The cadet, this moment</p>
              <dl className={cn(styles.readouts, "mt-4")}>
                <div><dt>Saddle rise</dt><dd ref={(el) => { if (el) read.current.set("rise", el); }}>0 mm</dd></div>
                <div><dt>Hip angle</dt><dd ref={(el) => { if (el) read.current.set("hip", el); }}>—</dd></div>
                <div><dt>Knee angle</dt><dd ref={(el) => { if (el) read.current.set("knee", el); }}>—</dd></div>
                <div><dt>Elbow angle</dt><dd ref={(el) => { if (el) read.current.set("elbow", el); }}>—</dd></div>
                <div><dt>Heel ahead of hip</dt><dd ref={(el) => { if (el) read.current.set("align", el); }}>—</dd></div>
              </dl>
              <p className="t-ui mt-4 text-xs leading-relaxed text-dust">
                Gold line: ear, shoulder, hip and heel. Crosses: approximate centres of gravity of horse and rider. At halt the forehand carries roughly 55–60% of the horse&rsquo;s weight.
              </p>
            </div>
          )}

          <div className={styles.card}>
            <p className="label text-dust">Structures in this view</p>
            <ul className="mt-3 flex flex-wrap gap-1.5">
              {labelDefs.map((l) => (
                <li key={l.s}>
                  <button type="button" aria-pressed={selected === l.s} onClick={() => { setSelected(l.s); setConnection(null); }} onFocus={() => setHover(l.s)} onBlur={() => setHover(null)} className={styles.chip}>
                    {STRUCTURES[l.s]?.name}
                  </button>
                </li>
              ))}
            </ul>
          </div>
        </aside>
      </div>

      <details className="gutter mt-10">
        <summary className="label cursor-pointer text-dust hover:text-bone">How this drawing was made, and what an expert should check</summary>
        <ul className="t-ui mt-4 max-w-3xl list-disc space-y-2 pl-5 text-sm text-sand">
          {REVIEW.map((r) => (
            <li key={r}>{r}</li>
          ))}
        </ul>
      </details>
    </section>
  );
}

function Toggle({ on, onClick, label }: { on: boolean; onClick: () => void; label: string }) {
  return (
    <button type="button" role="switch" aria-checked={on} onClick={onClick} className={styles.toggle}>
      <span aria-hidden className={styles.knob} />
      {label}
    </button>
  );
}
