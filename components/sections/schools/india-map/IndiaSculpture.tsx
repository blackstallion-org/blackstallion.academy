"use client";

import Image from "next/image";
import { motion } from "motion/react";
import { useCallback, useEffect, useMemo, useRef, useState, type KeyboardEvent, type PointerEvent as ReactPointerEvent, type ReactNode, type RefObject } from "react";
import { useCapabilities } from "@/lib/3d/use-capabilities";
import { mapCopy, mapPalette, mapPlaces, type MapPlace } from "@/lib/content/india-map";
import { useReducedMotion } from "@/lib/motion/reduced";
import { useNearViewport, useOnScreen } from "@/lib/motion/use-near-viewport";
import { cn } from "@/lib/utils";
import { coastUrl, loadMeta, loadRivers, loadTerrain } from "./data";
import type { IndiaEngine } from "./engine";
import { asset } from "@/lib/content/asset";

type Side = "r" | "l" | "t" | "b";
type Rect = { l: number; t: number; r: number; b: number };

const POSTER = asset("/images/schools/india-sculpture-poster.webp");
const WIDE = 820; // the card sits beside the map from this frame width up, below it under that

const hit = (a: Rect, b: Rect, pad = 4) => a.l < b.r + pad && a.r > b.l - pad && a.t < b.b + pad && a.b > b.t - pad;

function loadImage(src: string) {
  return new Promise<HTMLImageElement>((resolve, reject) => {
    const img = new window.Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error(`could not load ${src}`));
    img.src = src;
  });
}

/**
 * The national sculpture: a lit relief model of India you can turn and zoom, with the six target circuits and two heritage places
 * as floating markers. Choosing one flies the camera there and opens an editorial card tied to its marker by a line of light.
 * The three.js side is in engine.ts; this file is the frame around it: loading, controls, markers, card, fallbacks.
 */
export function IndiaSculpture({ className }: { className?: string }) {
  const frameRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const cardRef = useRef<HTMLElement>(null);
  const controlsRef = useRef<HTMLDivElement>(null);
  const legendRef = useRef<HTMLUListElement>(null);
  const lineRef = useRef<SVGPathElement>(null);
  const markerRefs = useRef(new Map<string, HTMLLIElement>());
  const engineRef = useRef<IndiaEngine | null>(null);
  const sides = useRef(new Map<string, Side>());
  const widths = useRef(new Map<string, number>());
  const selectedRef = useRef<string | null>(null);
  const wideRef = useRef(true);

  const near = useNearViewport(frameRef, "150% 0px");
  const onScreen = useOnScreen(frameRef);
  const capabilities = useCapabilities();
  const reduced = useReducedMotion();
  const [result, setResult] = useState<"ready" | "fallback" | null>(null);
  const [selected, setSelected] = useState<string | null>(null);
  const [wide, setWide] = useState(true);
  const place = useMemo(() => mapPlaces.find((p) => p.id === selected) ?? null, [selected]);

  const webgl = capabilities?.webgl ?? true;
  const status = capabilities && !capabilities.webgl ? "fallback" : result ?? (near ? "loading" : "idle");

  // ------------------------------------------------------------------ the overlay follows the camera
  const updateOverlay = useCallback(() => {
    const engine = engineRef.current;
    const frame = frameRef.current;
    if (!engine || !frame) return;
    const fw = frame.clientWidth;
    const fh = frame.clientHeight;
    const proj = engine.project();
    const frameBox = frame.getBoundingClientRect();
    const rectOf = (el: Element | null): Rect | null => {
      if (!el) return null;
      const b = el.getBoundingClientRect();
      return b.width > 0 && b.height > 0 ? { l: b.left - frameBox.left, t: b.top - frameBox.top, r: b.right - frameBox.left, b: b.bottom - frameBox.top } : null;
    };
    const cardRect = rectOf(cardRef.current);
    const obstacles = [cardRect, rectOf(controlsRef.current), selectedRef.current ? null : rectOf(legendRef.current)].filter((r): r is Rect => r !== null);
    const taken: Rect[] = proj.filter((p) => p.visible).map((p) => ({ l: p.x - 13, t: p.y - 13, r: p.x + 13, b: p.y + 13 }));
    const order = [...proj].sort((a, b) => (a.id === selectedRef.current ? -1 : b.id === selectedRef.current ? 1 : 0));
    for (const p of order) {
      const el = markerRefs.current.get(p.id);
      if (!el) continue;
      const anchor: Rect = { l: p.x - 13, t: p.y - 13, r: p.x + 13, b: p.y + 13 };
      const covered = obstacles.some((o) => hit(anchor, o, 14));
      el.style.transform = `translate3d(${p.x.toFixed(1)}px, ${p.y.toFixed(1)}px, 0)`;
      el.style.visibility = p.visible && !covered ? "visible" : "hidden";
      el.dataset.covered = covered ? "true" : "false";
      if (!p.visible || covered) continue;
      let w = widths.current.get(p.id);
      if (!w) {
        w = (el.querySelector("[data-label]") as HTMLElement | null)?.offsetWidth ?? 90;
        widths.current.set(p.id, w);
      }
      const rects: Record<Side, Rect> = {
        r: { l: p.x + 14, t: p.y - 13, r: p.x + 14 + w, b: p.y + 13 },
        l: { l: p.x - 14 - w, t: p.y - 13, r: p.x - 14, b: p.y + 13 },
        t: { l: p.x - w / 2, t: p.y - 42, r: p.x + w / 2, b: p.y - 14 },
        b: { l: p.x - w / 2, t: p.y + 14, r: p.x + w / 2, b: p.y + 42 },
      };
      const prefer = sides.current.get(p.id);
      const tries: Side[] = prefer ? [prefer, ...(["r", "l", "t", "b"] as Side[]).filter((s) => s !== prefer)] : ["r", "l", "t", "b"];
      let chosen: Side | "none" = "none";
      for (const s of tries) {
        const r = rects[s];
        const inside = r.l > 6 && r.r < fw - 6 && r.t > 6 && r.b < fh - 6;
        const clear = !taken.some((t) => hit(r, t, 2) && !(t.l === anchor.l && t.t === anchor.t));
        const blocked = obstacles.some((o) => hit(r, o, 6));
        if (inside && clear && !blocked) { chosen = s; break; }
      }
      if (chosen !== "none") { sides.current.set(p.id, chosen); taken.push(rects[chosen]); }
      el.dataset.side = chosen;
    }
    // the line of light from the selected marker to the card
    const line = lineRef.current;
    if (line) {
      const sel = selectedRef.current && proj.find((p) => p.id === selectedRef.current);
      // the line of light joins a marker to a card that sits on the map; under a phone's map there is nothing to join
      if (sel && sel.visible && cardRect && wideRef.current) {
        const wide = cardRect.l > fw * 0.4;
        const ax = wide ? cardRect.l : (cardRect.l + cardRect.r) / 2;
        const ay = wide ? Math.min(Math.max(sel.y, cardRect.t + 26), cardRect.b - 26) : cardRect.t;
        const mx = wide ? (sel.x + ax) / 2 : sel.x;
        const my = wide ? sel.y : (sel.y + ay) / 2;
        line.setAttribute("d", `M ${sel.x.toFixed(1)} ${sel.y.toFixed(1)} Q ${mx.toFixed(1)} ${my.toFixed(1)} ${ax.toFixed(1)} ${ay.toFixed(1)}`);
        line.style.opacity = "1";
      } else {
        line.style.opacity = "0";
      }
    }
  }, []);

  // ------------------------------------------------------------------ load and start
  useEffect(() => {
    if (!near || !capabilities || !capabilities.webgl) return;
    const abort = new AbortController();
    let engine: IndiaEngine | null = null;
    let cancelled = false;
    const quality = capabilities.quality;
    (async () => {
      try {
        const meta = await loadMeta(abort.signal);
        const [terrain, rivers, coast, mod] = await Promise.all([
          loadTerrain(quality === "high" ? "hi" : "lo", abort.signal),
          loadRivers(abort.signal),
          loadImage(coastUrl(meta.coast.file)),
          import("./engine"),
        ]);
        if (cancelled || !canvasRef.current) return;
        engine = new mod.IndiaEngine({
          canvas: canvasRef.current,
          meta,
          terrain,
          rivers,
          coast,
          quality,
          reducedMotion: window.matchMedia("(prefers-reduced-motion: reduce)").matches,
          onFrame: updateOverlay,
          onContextLost: () => setResult("fallback"),
        });
        engineRef.current = engine;
        if (process.env.NODE_ENV !== "production") (window as unknown as { __indiaMap?: IndiaEngine }).__indiaMap = engine;
        const frame = frameRef.current;
        if (frame) engine.setSize(frame.clientWidth, frame.clientHeight);
        setResult("ready");
      } catch (error) {
        if (!cancelled && !(error instanceof DOMException && error.name === "AbortError")) {
          console.error("[india-sculpture] unavailable:", error instanceof Error ? error.message : error);
          setResult("fallback");
        }
      }
    })();
    return () => {
      cancelled = true;
      abort.abort();
      engine?.dispose();
      engineRef.current = null;
    };
  }, [near, capabilities, updateOverlay]);

  useEffect(() => { engineRef.current?.setReduced(reduced); }, [reduced, result]);
  useEffect(() => { engineRef.current?.setActive(onScreen); }, [onScreen, result]);

  useEffect(() => {
    const frame = frameRef.current;
    if (!frame) return;
    const ro = new ResizeObserver(() => {
      widths.current.clear();
      wideRef.current = frame.clientWidth >= WIDE;
      setWide(wideRef.current);
      engineRef.current?.setSize(frame.clientWidth, frame.clientHeight);
    });
    ro.observe(frame);
    void document.fonts?.ready.then(() => widths.current.clear());
    return () => ro.disconnect();
  }, []);

  // ------------------------------------------------------------------ choosing a place
  // beside the map the card covers its right side, so the picture slides left; under the map nothing is covered
  const shiftFor = useCallback(() => ((frameRef.current?.clientWidth ?? 0) >= WIDE ? { sx: 0.16, sy: 0 } : { sx: 0, sy: 0 }), []);

  const select = useCallback((id: string) => {
    selectedRef.current = id;
    setSelected(id);
    const engine = engineRef.current;
    if (!engine) return;
    const s = shiftFor();
    engine.setCardShift(s.sx, s.sy);
    engine.flyTo(id);
  }, [shiftFor]);

  const close = useCallback(() => {
    selectedRef.current = null;
    setSelected(null);
    const engine = engineRef.current;
    engine?.setCardShift(0, 0);
    engine?.reset();
  }, []);

  // the card has just mounted or gone: draw the overlay again so the markers and the line agree with it; under the map, bring it into view
  useEffect(() => {
    const id = requestAnimationFrame(() => {
      updateOverlay();
      engineRef.current?.invalidate();
      if (selected && !wide) cardRef.current?.scrollIntoView({ behavior: reduced ? "auto" : "smooth", block: "nearest" });
    });
    return () => cancelAnimationFrame(id);
  }, [selected, wide, reduced, updateOverlay]);

  // ------------------------------------------------------------------ pointer, wheel, keys
  const pointers = useRef(new Map<number, { x: number; y: number }>());
  const gesture = useRef<{ mode: "orbit" | "pan"; touch: boolean; pinch: number; cx: number; cy: number } | null>(null);
  const engaged = useRef(false);

  const begin = () => { if (!engaged.current) { engaged.current = true; engineRef.current?.beginInteraction(); } };
  const end = () => { if (engaged.current) { engaged.current = false; engineRef.current?.endInteraction(); } };

  const onPointerDown = (e: ReactPointerEvent<HTMLCanvasElement>) => {
    const engine = engineRef.current;
    if (!engine) return;
    e.currentTarget.setPointerCapture(e.pointerId);
    pointers.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
    frameRef.current?.setAttribute("data-engaged", "true");
    begin();
    const pts = [...pointers.current.values()];
    if (pts.length === 2) {
      gesture.current = { mode: "pan", touch: true, pinch: Math.hypot(pts[0].x - pts[1].x, pts[0].y - pts[1].y), cx: (pts[0].x + pts[1].x) / 2, cy: (pts[0].y + pts[1].y) / 2 };
    } else {
      gesture.current = { mode: e.button === 2 || e.shiftKey ? "pan" : "orbit", touch: e.pointerType === "touch", pinch: 0, cx: e.clientX, cy: e.clientY };
    }
  };
  const onPointerMove = (e: ReactPointerEvent<HTMLCanvasElement>) => {
    const engine = engineRef.current;
    const g = gesture.current;
    if (!engine || !g || !pointers.current.has(e.pointerId)) return;
    pointers.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
    const pts = [...pointers.current.values()];
    const h = frameRef.current?.clientHeight ?? 600;
    if (pts.length >= 2) {
      const d = Math.hypot(pts[0].x - pts[1].x, pts[0].y - pts[1].y);
      const cx = (pts[0].x + pts[1].x) / 2, cy = (pts[0].y + pts[1].y) / 2;
      if (g.pinch > 0 && d > 0) engine.rig.zoom(g.pinch / d);
      engine.rig.pan(cx - g.cx, cy - g.cy, h);
      g.pinch = d; g.cx = cx; g.cy = cy;
    } else {
      const dx = e.clientX - g.cx, dy = e.clientY - g.cy;
      g.cx = e.clientX; g.cy = e.clientY;
      if (g.mode === "pan") engine.rig.pan(dx, dy, h);
      else engine.rig.orbit(-dx * 0.0055, g.touch ? 0 : -dy * 0.0045);
    }
    engine.invalidate();
  };
  const onPointerUp = (e: ReactPointerEvent<HTMLCanvasElement>) => {
    pointers.current.delete(e.pointerId);
    const rest = [...pointers.current.values()];
    if (rest.length === 0) { gesture.current = null; end(); }
    else if (gesture.current) { gesture.current = { ...gesture.current, mode: "orbit", pinch: 0, cx: rest[0].x, cy: rest[0].y }; }
  };

  useEffect(() => {
    const frame = frameRef.current;
    if (!frame) return;
    // Scrolling the page must not be swallowed by the map: wheel zooms only with Ctrl or ⌘ (also a trackpad pinch), or once the map has been touched.
    const wheel = (e: WheelEvent) => {
      const engine = engineRef.current;
      if (!engine || !(e.ctrlKey || e.metaKey || frame.dataset.engaged === "true")) return;
      e.preventDefault();
      engine.stopTween();
      engine.rig.zoom(Math.exp(e.deltaY * (e.ctrlKey ? 0.01 : 0.0016)));
      engine.invalidate();
    };
    const leave = () => { frame.dataset.engaged = "false"; };
    frame.addEventListener("wheel", wheel, { passive: false });
    frame.addEventListener("pointerleave", leave);
    return () => { frame.removeEventListener("wheel", wheel); frame.removeEventListener("pointerleave", leave); };
  }, []);

  const onKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    const engine = engineRef.current;
    if (!engine) return;
    if (e.key === "Escape" || e.key === "Home") { e.preventDefault(); close(); return; }
    if (e.key === "+" || e.key === "=") { e.preventDefault(); engine.zoomBy(0.8); return; }
    if (e.key === "-" || e.key === "_") { e.preventDefault(); engine.zoomBy(1.25); return; }
    if (e.target !== frameRef.current) return;
    const step = 0.09;
    const move: Record<string, [number, number]> = { ArrowLeft: [-step, 0], ArrowRight: [step, 0], ArrowUp: [0, -step * 0.8], ArrowDown: [0, step * 0.8] };
    const m = move[e.key];
    if (!m) return;
    e.preventDefault();
    engine.stopTween();
    if (e.shiftKey) engine.rig.pan(-m[0] * 700, -m[1] * 700, frameRef.current?.clientHeight ?? 600);
    else engine.rig.orbit(m[0], m[1]);
    engine.invalidate();
  };

  const ready = status === "ready";

  return (
    <div className={className} onKeyDown={onKeyDown}>
      <div
        ref={frameRef}
        role="group"
        aria-roledescription="interactive map"
        aria-label={mapCopy.regionLabel}
        aria-describedby="india-sculpture-hint"
        tabIndex={ready ? 0 : -1}
        onContextMenu={(e) => { if (ready) e.preventDefault(); }}
        style={{ backgroundColor: mapPalette.background }}
        className="tone-dark relative isolate h-[clamp(25rem,62svh,31rem)] w-full overflow-hidden border border-line min-[820px]:h-[clamp(30rem,78svh,58rem)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-gold"
      >
        {status !== "fallback" && (
          <Image
            src={POSTER}
            alt=""
            fill
            sizes="(min-width: 1024px) 90vw, 100vw"
            priority={false}
            className={cn("object-cover object-center transition-opacity duration-1000", ready ? "pointer-events-none opacity-0" : "opacity-100")}
          />
        )}
        <canvas
          ref={canvasRef}
          aria-hidden
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
          onPointerCancel={onPointerUp}
          className={cn("absolute inset-0 block h-full w-full cursor-grab touch-pan-y select-none transition-opacity duration-1000 active:cursor-grabbing", ready ? "opacity-100" : "pointer-events-none opacity-0")}
        />
        {/* a vignette keeps the plate in the gallery; it never takes part in the pointer */}
        <div aria-hidden className="pointer-events-none absolute inset-0 [background:radial-gradient(ellipse_at_50%_46%,transparent_58%,color-mix(in_srgb,var(--color-night)_55%,transparent)_100%)]" />

        {status === "loading" && (
          <p role="status" className="label pointer-events-none absolute inset-x-0 bottom-6 text-center text-gold/90 motion-safe:animate-pulse">{mapCopy.loading}</p>
        )}

        {ready && (
          <>
            <svg aria-hidden className="pointer-events-none absolute inset-0 z-20 h-full w-full overflow-visible">
              <defs>
                <filter id="india-line-glow" x="-20%" y="-20%" width="140%" height="140%"><feGaussianBlur stdDeviation="2.2" /></filter>
              </defs>
              <motion.path key={selected ?? "none"} ref={lineRef} fill="none" stroke="var(--color-gold)" strokeWidth={1.1} strokeLinecap="round" initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ duration: reduced ? 0 : 0.9, delay: reduced ? 0 : 0.5 }} style={{ opacity: 0, filter: "drop-shadow(0 0 4px var(--color-gold))" }} />
            </svg>
            <ul aria-label="Places on the map" className="pointer-events-none absolute inset-0 z-30 m-0 list-none p-0">
              {mapPlaces.map((p) => (
                <Marker key={p.id} place={p} selected={selected === p.id} dim={selected !== null && selected !== p.id} onSelect={() => select(p.id)} register={(el) => { if (el) markerRefs.current.set(p.id, el); else markerRefs.current.delete(p.id); }} />
              ))}
            </ul>

            <div ref={controlsRef} className={cn("absolute bottom-4 left-4 z-40 flex items-center gap-2", selected && "max-sm:hidden")}>
              <ControlButton label={mapCopy.zoomIn} onClick={() => engineRef.current?.zoomBy(0.7)}>+</ControlButton>
              <ControlButton label={mapCopy.zoomOut} onClick={() => engineRef.current?.zoomBy(1.4)}>−</ControlButton>
              <button type="button" onClick={close} className="label min-h-11 border border-line bg-night/80 px-4 text-sand backdrop-blur-sm transition-colors hover:border-gold hover:text-gold focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold">
                {mapCopy.reset}
              </button>
            </div>
            {wide && <Legend legendRef={legendRef} className={cn("pointer-events-none absolute bottom-4 right-4 z-30", selected && "invisible")} />}

            {place && wide && <Card key={place.id} place={place} cardRef={cardRef} onClose={close} />}
          </>
        )}

        {status === "fallback" && <FallbackList onSelect={select} selected={selected} place={place} onClose={close} />}
      </div>

      {ready && !wide && <Legend className="mt-3" />}
      {ready && place && !wide && <Card key={place.id} place={place} cardRef={cardRef} onClose={close} inline />}

      {ready && (
        <div className="mt-4 flex flex-wrap gap-2" role="group" aria-label="Choose a place">
          {mapPlaces.map((p) => (
            <button
              key={p.id}
              type="button"
              aria-pressed={selected === p.id}
              onClick={() => select(p.id)}
              className={cn(
                "label min-h-11 border px-3 py-2 transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold",
                selected === p.id ? "border-gold text-gold" : "border-line text-sand hover:text-bone",
              )}
            >
              {p.label}
            </button>
          ))}
        </div>
      )}
      <p id="india-sculpture-hint" className="t-ui mt-3 text-xs text-dust">
        <span className="[@media(hover:none)]:hidden">{mapCopy.hintPointer}. </span>
        <span className="hidden [@media(hover:none)]:inline">{mapCopy.hintTouch}. </span>
        {mapCopy.hintKeys}
        {reduced ? ` ${mapCopy.noMotionNote}` : ""}
        {!webgl ? ` ${mapCopy.fallbackNote}` : ""}
      </p>
    </div>
  );
}

function Legend({ className, legendRef }: { className?: string; legendRef?: RefObject<HTMLUListElement | null> }) {
  return (
    <ul ref={legendRef} aria-hidden className={cn("flex flex-wrap items-center gap-x-5 gap-y-1", className)}>
      {mapCopy.legend.map((l) => (
        <li key={l.key} className="label flex items-center gap-2 text-dust">
          <span className={cn("h-2 w-2 rounded-full", l.key === "circuit" ? "bg-gold" : "border border-bone")} />
          {l.label}
        </li>
      ))}
    </ul>
  );
}

function ControlButton({ label, onClick, children }: { label: string; onClick: () => void; children: ReactNode }) {
  return (
    <button type="button" aria-label={label} onClick={onClick} className="grid h-11 w-11 place-items-center border border-line bg-night/80 text-lg leading-none text-sand backdrop-blur-sm transition-colors hover:border-gold hover:text-gold focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold">
      {children}
    </button>
  );
}

function Marker({ place, selected, dim, onSelect, register }: { place: MapPlace; selected: boolean; dim: boolean; onSelect: () => void; register: (el: HTMLLIElement | null) => void }) {
  const circuit = place.kind === "circuit";
  return (
    <li ref={register} data-side="r" className="group absolute left-0 top-0 [will-change:transform]" style={{ visibility: "hidden" }}>
      <button
        type="button"
        onClick={onSelect}
        aria-pressed={selected}
        aria-label={`${place.label}: ${place.eyebrow}`}
        className={cn(
          "pointer-events-auto absolute -left-3.5 -top-3.5 grid h-7 w-7 place-items-center rounded-full transition-opacity duration-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold",
          dim ? "opacity-45" : "opacity-100",
          "group-data-[covered=true]:pointer-events-none",
        )}
      >
        <span aria-hidden className={cn("absolute rounded-full border transition-all duration-300", circuit ? "border-gold" : "border-bone", selected ? "h-7 w-7 border-2 shadow-[0_0_22px_var(--color-gold)]" : "h-[1.4rem] w-[1.4rem] shadow-[0_0_12px_color-mix(in_srgb,var(--color-gold)_55%,transparent)] group-hover:h-7 group-hover:w-7 group-hover:shadow-[0_0_20px_var(--color-gold)]", !circuit && "border-dashed")} />
        <span aria-hidden className={cn("relative h-2.5 w-2.5 rounded-full shadow-[0_0_8px_var(--color-gold)] transition-transform duration-300", circuit ? "bg-gold" : "bg-bone", selected && "scale-125")} />
        {/* the hairline from the anchor to its label, and the floating pill */}
        <span aria-hidden className="absolute hidden h-px w-2.5 bg-gold/60 group-data-[side=l]:right-full group-data-[side=l]:block group-data-[side=r]:left-full group-data-[side=r]:block" />
        <span aria-hidden className="absolute hidden h-2.5 w-px bg-gold/60 group-data-[side=t]:bottom-full group-data-[side=t]:block group-data-[side=b]:top-full group-data-[side=b]:block" />
        <span
          data-label
          className={cn(
            "label absolute whitespace-nowrap rounded-full border px-3 py-1 text-[0.62rem] shadow-[0_6px_22px_rgb(0_0_0/0.45)] backdrop-blur-sm transition-colors duration-300",
            "bg-[color-mix(in_srgb,var(--color-night)_84%,transparent)] group-hover:border-gold group-hover:text-gold",
            selected ? "border-gold text-gold" : "border-line text-bone",
            "group-data-[side=r]:left-[calc(100%+0.65rem)] group-data-[side=r]:top-1/2 group-data-[side=r]:-translate-y-1/2",
            "group-data-[side=l]:right-[calc(100%+0.65rem)] group-data-[side=l]:top-1/2 group-data-[side=l]:-translate-y-1/2",
            "group-data-[side=t]:bottom-[calc(100%+0.65rem)] group-data-[side=t]:left-1/2 group-data-[side=t]:-translate-x-1/2",
            "group-data-[side=b]:left-1/2 group-data-[side=b]:top-[calc(100%+0.65rem)] group-data-[side=b]:-translate-x-1/2",
            "group-data-[side=none]:hidden",
          )}
        >
          {place.label}
        </span>
      </button>
    </li>
  );
}

function CardBody({ place, onClose, closeLabel = mapCopy.close }: { place: MapPlace; onClose?: () => void; closeLabel?: string }) {
  return (
    <>
      <div className="flex items-start justify-between gap-4">
        <p className="label text-brass">{place.eyebrow}</p>
        {onClose && (
          <button type="button" onClick={onClose} aria-label={closeLabel} className="-mr-2 -mt-2 grid h-10 w-10 shrink-0 place-items-center text-sand transition-colors hover:text-gold focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold">
            <span aria-hidden className="text-xl leading-none">×</span>
          </button>
        )}
      </div>
      <h3 className="t-voice mt-3 text-[1.6rem] leading-tight text-bone">{place.title}</h3>
      <p className="font-mono mt-2 text-[0.68rem] uppercase tracking-[0.14em] text-copper">{place.location}</p>
      <p className="t-story mt-4 text-sand">{place.body}</p>
      <dl className="mt-5 divide-y divide-line/20 border-y border-line/40 text-sm">
        {place.facts.map((f) => (
          <div key={`${f.k}-${f.v}`} className="grid grid-cols-[minmax(3.2rem,auto)_1fr] gap-x-4 gap-y-1 py-2.5">
            <dt className="font-mono text-[0.68rem] uppercase tracking-[0.12em] text-dust">{f.k}</dt>
            <dd className="t-ui text-sand">{f.v}</dd>
          </div>
        ))}
      </dl>
      <p className="t-ui mt-4 text-xs leading-relaxed text-dust">{place.status}</p>
      {place.link && (
        <a href={place.link.href} className="label mt-4 inline-flex min-h-11 items-center gap-2 text-gold underline-offset-4 hover:underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold">
          {place.link.label}
        </a>
      )}
    </>
  );
}

function Card({ place, cardRef, onClose, inline = false }: { place: MapPlace; cardRef: RefObject<HTMLElement | null>; onClose: () => void; inline?: boolean }) {
  if (inline) {
    return (
      <motion.aside ref={cardRef as RefObject<HTMLElement>} aria-live="polite" aria-label={place.title} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }} className="plate mt-4 scroll-mb-24 p-5">
        <CardBody place={place} onClose={onClose} />
      </motion.aside>
    );
  }
  return (
    <motion.aside
      ref={cardRef as RefObject<HTMLElement>}
      aria-live="polite"
      aria-label={place.title}
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, delay: 0.35, ease: [0.16, 1, 0.3, 1] }}
      className="plate absolute bottom-5 right-5 top-5 z-40 w-[min(23rem,40%)] overflow-y-auto p-6"
    >
      <CardBody place={place} onClose={onClose} />
    </motion.aside>
  );
}

/** Without WebGL (or after a failure) the same places stay readable: the picture of the model and a list of the cards. */
function FallbackList({ onSelect, selected, place, onClose }: { onSelect: (id: string) => void; selected: string | null; place: MapPlace | null; onClose: () => void }) {
  return (
    <div className="absolute inset-0 z-10 overflow-y-auto bg-night/85 p-5 backdrop-blur-sm">
      <p className="t-ui max-w-xl text-sm text-sand">{mapCopy.fallbackNote}</p>
      <ul className="mt-5 grid gap-3 sm:grid-cols-2">
        {mapPlaces.map((p) => (
          <li key={p.id} className="plate p-4">
            {selected === p.id && place ? (
              <CardBody place={place} onClose={onClose} />
            ) : (
              <button type="button" onClick={() => onSelect(p.id)} className="block w-full text-left focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold">
                <span className="label text-brass">{p.eyebrow}</span>
                <span className="t-voice mt-2 block text-xl text-bone">{p.title}</span>
                <span className="font-mono mt-1 block text-[0.68rem] uppercase tracking-[0.14em] text-copper">{p.location}</span>
              </button>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}
