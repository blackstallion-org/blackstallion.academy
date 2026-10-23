"use client";

import { useCallback, useEffect, useRef, useState, type KeyboardEvent } from "react";
import { FilmImage } from "@/components/film/FilmImage";
import { Label } from "@/components/film/Marks";
import { EditorialHeadline as Headline } from "@/components/motion/EditorialMotion";
import { ModelBoundary } from "@/components/three/ModelBoundary";
import { useReducedMotion } from "@/lib/motion/reduced";
import { cn } from "@/lib/utils";
import {
  dualBodyConnections as connections,
  dualBodyIntro as intro,
  gaits,
  muscleGroups,
  viewModes,
  type GaitKey,
  type ViewMode,
} from "@/lib/content/anatomy-dualbody";
import type { DualBodyEngine, DualBodyPalette, PinFrame } from "./dual-body/engine";

type Status = "idle" | "loading" | "ready" | "failed";

const toggle =
  "label inline-flex min-h-11 items-center gap-2 border border-line px-3.5 text-sand transition-colors duration-300 hover:border-brass hover:text-bone aria-pressed:border-gold aria-pressed:text-gold disabled:pointer-events-none disabled:opacity-40";

/** Reads the colour role tokens of this (tone-dark) scope for the three.js materials. */
function readPalette(el: HTMLElement): DualBodyPalette {
  const cs = getComputedStyle(el);
  const v = (name: string) => cs.getPropertyValue(`--color-${name}`).trim();
  return {
    gold: v("gold"), brass: v("brass"), bone: v("bone"), dust: v("dust"),
    ivory: v("ivory"), parch: v("parch"), leather: v("leather"), chestnut: v("chestnut"),
    caramel: v("caramel"), antique: v("antique"), bhanwar: v("bhanwar"), kala: v("kala"), surang: v("surang"),
  };
}

/**
 * §1b · "One conversation. Two bodies." A 3D Marwari with a seated cadet. Choose a rider ↔ horse
 * connection and the camera frames where it starts in the rider and where it lands in the horse.
 * The canvas is decorative (aria-hidden); everything it shows is also written out as text.
 */
export function DualBody() {
  const sectionRef = useRef<HTMLElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const hostRef = useRef<HTMLDivElement>(null);
  const engineRef = useRef<DualBodyEngine | null>(null);
  const tabRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const pinRefs = useRef<{ rider: HTMLDivElement | null; horse: HTMLDivElement | null }>({ rider: null, horse: null });
  const svgRefs = useRef<{ rLine: SVGLineElement | null; hLine: SVGLineElement | null; rDot: SVGCircleElement | null; hDot: SVGCircleElement | null }>({
    rLine: null, hLine: null, rDot: null, hDot: null,
  });

  const reduced = useReducedMotion();
  const reducedRef = useRef(reduced);
  const [status, setStatus] = useState<Status>("idle");
  const [index, setIndex] = useState(0);
  const [zoomed, setZoomed] = useState(false);
  const [mode, setMode] = useState<ViewMode>("posture");
  const [gait, setGait] = useState<GaitKey>("walk");
  const [playing, setPlaying] = useState(false);

  const active = connections[index];
  const activeMode = viewModes.find((m) => m.id === mode) ?? viewModes[0];
  const activeGait = gaits.find((g) => g.id === gait) ?? gaits[0];

  /* Pins follow the projected anchors every rendered frame, written straight to the DOM. */
  const onPins = useCallback((f: PinFrame) => {
    const place = (
      label: HTMLDivElement | null,
      line: SVGLineElement | null,
      dot: SVGCircleElement | null,
      pt: PinFrame["rider"],
      side: "left" | "right",
    ) => {
      if (!label || !line || !dot) return;
      const show = pt.visible;
      label.style.opacity = dot.style.opacity = line.style.opacity = show ? "1" : "0";
      const w = label.offsetWidth;
      const h = label.offsetHeight;
      const dx = f.width < 640 ? 18 : 34;
      const lx = side === "right" ? pt.x + dx : pt.x - dx - w;
      const x = Math.max(8, Math.min(f.width - w - 8, lx));
      const y = Math.max(8, Math.min(f.height - h - 8, pt.y - (f.width < 640 ? 48 : 64) - h));
      label.style.transform = `translate3d(${Math.round(x)}px, ${Math.round(y)}px, 0)`;
      dot.setAttribute("cx", String(pt.x));
      dot.setAttribute("cy", String(pt.y));
      line.setAttribute("x1", String(pt.x));
      line.setAttribute("y1", String(pt.y));
      line.setAttribute("x2", String(side === "right" ? x : x + w));
      line.setAttribute("y2", String(y + h));
    };
    // The anchor further forward (left on screen) labels to the left, the other to the right.
    const riderLeft = f.rider.x < f.horse.x;
    place(pinRefs.current.rider, svgRefs.current.rLine, svgRefs.current.rDot, f.rider, riderLeft ? "left" : "right");
    place(pinRefs.current.horse, svgRefs.current.hLine, svgRefs.current.hDot, f.horse, riderLeft ? "right" : "left");
  }, []);

  /* Mount the engine lazily (when the stage nears the viewport); run it only while visible. */
  useEffect(() => {
    const stage = stageRef.current;
    const host = hostRef.current;
    const section = sectionRef.current;
    if (!stage || !host || !section) return;
    let cancelled = false;
    let visible = false;
    let started = false;
    const sync = () => engineRef.current?.setActive(visible && !document.hidden);

    const start = async () => {
      started = true;
      setStatus("loading");
      try {
        const { DualBodyEngine } = await import("./dual-body/engine");
        if (cancelled) return;
        engineRef.current = new DualBodyEngine({ host, palette: readPalette(section), reducedMotion: reducedRef.current, onPins });
        setStatus("ready");
        sync();
      } catch (error) {
        if (cancelled) return;
        console.warn("[bsah] dual-body 3D unavailable; showing the still.", error instanceof Error ? error.message : error);
        engineRef.current?.dispose();
        engineRef.current = null;
        host.replaceChildren();
        setStatus("failed");
      }
    };

    const io = new IntersectionObserver(
      ([entry]) => {
        visible = entry.isIntersecting;
        if (visible && !started) void start();
        sync();
      },
      { rootMargin: "240px 0px" },
    );
    io.observe(stage);
    document.addEventListener("visibilitychange", sync);
    return () => {
      cancelled = true;
      io.disconnect();
      document.removeEventListener("visibilitychange", sync);
      engineRef.current?.dispose();
      engineRef.current = null;
    };
  }, [onPins]);

  /* Keep the engine in step with the controls. */
  useEffect(() => {
    reducedRef.current = reduced;
    engineRef.current?.setReducedMotion(reduced);
  }, [reduced, status]);
  useEffect(() => {
    engineRef.current?.setConnection(index, zoomed);
    engineRef.current?.setRegions(connections[index].regions);
  }, [index, zoomed, status]);
  useEffect(() => engineRef.current?.setMode(mode), [mode, status]);
  useEffect(() => engineRef.current?.setGait(gait), [gait, status]);
  useEffect(() => engineRef.current?.setPlaying(playing), [playing, status]);

  const select = (i: number, focus = false) => {
    const next = (i + connections.length) % connections.length;
    setIndex(next);
    setZoomed(true);
    if (focus) tabRefs.current[next]?.focus();
  };

  const onTabKey = (e: KeyboardEvent<HTMLButtonElement>) => {
    const keys: Record<string, number> = {
      ArrowDown: index + 1, ArrowRight: index + 1, ArrowUp: index - 1, ArrowLeft: index - 1, Home: 0, End: connections.length - 1,
    };
    if (!(e.key in keys)) return;
    e.preventDefault();
    select(keys[e.key], true);
  };

  const failed = status === "failed";
  const ready = status === "ready";
  const regionNotes = active.regions.map((r) => muscleGroups[r]);

  return (
    <section ref={sectionRef} aria-labelledby="dualbody-h" className="tone-dark relative bg-night py-[clamp(6rem,14vh,12rem)]">
      <div className="gutter">
        <Label>{intro.label}</Label>
        <Headline id="dualbody-h" technique="words" className="mt-4" inscription={intro.inscription} voice={intro.voice} />
        <p className="t-story mt-6 max-w-2xl text-sand">{intro.body}</p>

        <div className="mt-12 grid gap-10 lg:grid-cols-[minmax(0,1.7fr)_minmax(0,1fr)] lg:gap-14">
          {/* Stage */}
          <div className="min-w-0">
            <div
              ref={stageRef}
              className="relative h-[60svh] min-h-[22rem] overflow-hidden border-y border-line bg-[radial-gradient(ellipse_at_50%_42%,var(--color-ember),var(--color-night)_72%)] lg:h-[min(74svh,44rem)]"
            >
              <ModelBoundary fallback={<FilmImage name="anatomyProfile" sizes="(min-width: 1024px) 60vw, 100vw" grade="none" />}>
                {failed ? (
                  <FilmImage name="anatomyProfile" sizes="(min-width: 1024px) 60vw, 100vw" grade="none" />
                ) : (
                  <div ref={hostRef} aria-hidden className="absolute inset-0 cursor-grab active:cursor-grabbing" />
                )}
              </ModelBoundary>

              {!ready && !failed && (
                <p className="label absolute inset-x-0 top-1/2 -translate-y-1/2 text-center text-dust" aria-hidden>
                  Preparing the plate
                </p>
              )}

              {/* Callout pins: decorative mirrors of the text in the panel. */}
              {ready && (
                <div aria-hidden className="pointer-events-none absolute inset-0">
                  <svg className="absolute inset-0 h-full w-full overflow-visible">
                    <line ref={(n) => { svgRefs.current.rLine = n; }} stroke="var(--color-brass)" strokeWidth="1" />
                    <line ref={(n) => { svgRefs.current.hLine = n; }} stroke="var(--color-brass)" strokeWidth="1" />
                    <circle ref={(n) => { svgRefs.current.rDot = n; }} r="3.5" fill="var(--color-gold)" />
                    <circle ref={(n) => { svgRefs.current.hDot = n; }} r="3.5" fill="var(--color-gold)" />
                  </svg>
                  <div ref={(n) => { pinRefs.current.rider = n; }} className="label absolute left-0 top-0 max-w-[11rem] text-bone [text-shadow:0_1px_10px_var(--color-night)] will-change-transform">
                    {active.pinRider}
                  </div>
                  <div ref={(n) => { pinRefs.current.horse = n; }} className="label absolute left-0 top-0 max-w-[11rem] text-gold [text-shadow:0_1px_10px_var(--color-night)] will-change-transform">
                    {active.pinHorse}
                  </div>
                </div>
              )}

              <p className="font-mono pointer-events-none absolute bottom-3 left-3 text-[0.65rem] tracking-[0.12em] text-dust" aria-hidden>
                {active.number} / {String(connections.length).padStart(2, "0")}
                {failed ? "" : ` · ${activeMode.label.toUpperCase()}`}
                {playing ? ` · ${activeGait.label.toUpperCase()}` : ""}
              </p>
            </div>

            {failed ? (
              <p className="mt-4 text-sm text-dust">The 3D view is not available on this device. The connections still read in full.</p>
            ) : (
              <>
                <div className="flex flex-wrap items-start gap-x-10 gap-y-5 border-b border-line py-5">
                  <div role="group" aria-label="View" className="flex flex-wrap items-center gap-2">
                    <span className="label mr-2 w-full text-dust sm:w-auto">View</span>
                    {viewModes.map((m) => (
                      <button key={m.id} type="button" className={toggle} aria-pressed={mode === m.id} onClick={() => setMode(m.id)} disabled={!ready}>
                        {m.label}
                      </button>
                    ))}
                  </div>
                  <div role="group" aria-label="Gait" className="flex flex-wrap items-center gap-2">
                    <span className="label mr-2 w-full text-dust sm:w-auto">Gait</span>
                    <button type="button" className={toggle} aria-pressed={playing} onClick={() => setPlaying((v) => !v)} disabled={!ready}>
                      <svg aria-hidden viewBox="0 0 12 12" className="h-3 w-3 fill-current">
                        {playing ? <path d="M2 1h3v10H2zM7 1h3v10H7z" /> : <path d="M2.5 1l8 5-8 5z" />}
                      </svg>
                      {playing ? "Pause" : "Play"}
                    </button>
                    {gaits.map((g) => (
                      <button key={g.id} type="button" className={toggle} aria-pressed={gait === g.id} onClick={() => setGait(g.id)} disabled={!ready}>
                        {g.label}
                      </button>
                    ))}
                  </div>
                  <button type="button" className={cn(toggle, "lg:ml-auto")} onClick={() => setZoomed(false)} disabled={!ready || !zoomed}>
                    Reset view
                  </button>
                </div>
                <p className="mt-4 text-sm text-dust">
                  {activeMode.note} <span className="text-sand">{activeGait.label}: {activeGait.beat.toLowerCase()}.</span>{" "}
                  <span className="hidden [@media(pointer:fine)]:inline">{intro.canvasNote}</span>
                </p>
              </>
            )}
          </div>

          {/* Connections */}
          <div className="min-w-0">
            <div role="tablist" aria-label="Rider and horse connections" aria-orientation="vertical" className="border-t border-line">
              {connections.map((c, i) => {
                const selected = i === index;
                return (
                  <button
                    key={c.id}
                    ref={(n) => { tabRefs.current[i] = n; }}
                    id={`dualbody-tab-${c.id}`}
                    type="button"
                    role="tab"
                    aria-selected={selected}
                    aria-controls="dualbody-panel"
                    tabIndex={selected ? 0 : -1}
                    onClick={() => select(i)}
                    onKeyDown={onTabKey}
                    className={cn(
                      "group grid w-full grid-cols-[3rem_1fr] items-baseline border-b border-line py-4 text-left transition-colors duration-300",
                      selected ? "text-bone" : "text-dust hover:text-sand",
                    )}
                  >
                    <span className={cn("font-mono text-xs tracking-[0.12em]", selected ? "text-gold" : "text-dust")}>{c.number}</span>
                    <span className="text-lede">{c.title}</span>
                  </button>
                );
              })}
            </div>

            <div id="dualbody-panel" role="tabpanel" aria-labelledby={`dualbody-tab-${active.id}`} tabIndex={0} className="pt-8">
              <dl className="grid gap-5">
                <div>
                  <dt className="label text-brass">The rider</dt>
                  <dd className="mt-1.5 text-bone">{active.rider}</dd>
                </div>
                <div>
                  <dt className="label text-brass">The horse</dt>
                  <dd className="mt-1.5 text-gold">{active.horse}</dd>
                </div>
              </dl>
              <p className="t-story mt-6 text-sand">{active.lesson}</p>

              {mode === "muscle" && (
                <ul className="mt-6 grid gap-4 border-t border-line pt-5">
                  {regionNotes.map((g) => (
                    <li key={g.title}>
                      <p className="label text-brass">{g.title}</p>
                      <p className="mt-1.5 text-sm text-sand">{g.note}</p>
                    </li>
                  ))}
                </ul>
              )}

              <div className="mt-8 flex items-center gap-3">
                <button type="button" className={toggle} onClick={() => select(index - 1)} aria-label="Previous connection">
                  <span aria-hidden>←</span> Prev
                </button>
                <button type="button" className={toggle} onClick={() => select(index + 1)} aria-label="Next connection">
                  Next <span aria-hidden>→</span>
                </button>
                <span className="font-mono ml-auto text-xs tracking-[0.12em] text-dust">
                  {active.number} / {String(connections.length).padStart(2, "0")}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
