"use client";

import { useEffect, useRef, useState, type CSSProperties } from "react";
import { useLenis } from "lenis/react";
import { useReducedMotion } from "@/lib/motion/reduced";
import { HERO_MODEL, HERO_MODEL_MOBILE } from "@/components/3d/marwari-paths";
import { ride, rideCards, rideRanges, rideStations, rideSwatches } from "@/lib/content/ride";
import type { RunwayEngine } from "@/components/runway/engine";
import { Halftone } from "./Halftone";
import "./ride.css";

const stationAt = (p: number) => {
  const i = rideStations.findIndex((s) => p < rideRanges[s.id][1]);
  return i < 0 ? rideStations.length - 1 : i;
};

/** The /ride runway: a sticky full-screen canvas over a tall scroll track, with the page's own controls on top. */
export function RideRunway() {
  const reduced = useReducedMotion();
  const lenis = useLenis();
  const track = useRef<HTMLDivElement>(null);
  const stage = useRef<HTMLDivElement>(null);
  const canvas = useRef<HTMLCanvasElement>(null);
  const hero = useRef<HTMLDivElement>(null);
  const info = useRef<HTMLDialogElement>(null);
  const engine = useRef<RunwayEngine | null>(null);
  const [bg, setBg] = useState<string>(rideSwatches[0].value);
  const [station, setStation] = useState(0);
  const [failed, setFailed] = useState(false);
  const [ready, setReady] = useState(false);
  const still = reduced || failed;

  useEffect(() => {
    const el = canvas.current;
    if (!el) return;
    const probe = document.createElement("canvas");
    if (!(probe.getContext("webgl2") || probe.getContext("webgl"))) {
      const id = requestAnimationFrame(() => setFailed(true));
      return () => cancelAnimationFrame(id);
    }
    let alive = true;
    const mobile = window.innerWidth < 768;
    Promise.all([
      import("@/components/runway/engine"),
      import("@/components/runway/stations/cards"),
      import("@/components/runway/stations/hud"),
      import("@/components/runway/stations/knobs"),
      import("@/components/runway/stations/glass"),
      import("@/components/runway/stations/finale"),
    ])
      .then(([{ RunwayEngine }, { cardStacks }, { hudStation }, { knobStation }, { glassStation }, { finaleStation }]) => {
        if (!alive) return;
        const e = new RunwayEngine({
          canvas: el,
          model: mobile ? HERO_MODEL_MOBILE : HERO_MODEL,
          mobile,
          background: bg,
          stations: [
            cardStacks(rideRanges.cards, rideCards),
            hudStation(rideRanges.hud),
            knobStation(rideRanges.knobs, ["BALANCE", "SEAT", "HANDS", "NERVE", "CARE", "DUTY"]),
            glassStation(rideRanges.glass, ["Safety before speed", "Ex-cavalry faculty", "Daily veterinary care"]),
            finaleStation(rideRanges.finale, ride.finale),
          ],
        });
        e.onReady = () => {
          setReady(true);
          if (reduced) e.still();
        };
        engine.current = e;
      })
      .catch((err) => {
        console.error("ride: engine", err);
        setFailed(true);
      });
    return () => {
      alive = false;
      engine.current?.dispose();
      engine.current = null;
    };
    // The background is applied by its own effect; recreating the engine for it would reload the horse.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [reduced]);

  useEffect(() => {
    engine.current?.setBackground(bg);
  }, [bg]);

  // Scroll to progress; the hero copy fades out as the run begins. No React state per frame except the station label.
  useEffect(() => {
    if (still) return;
    let raf = 0;
    let last = -1;
    const read = () => {
      raf = 0;
      const t = track.current;
      if (!t) return;
      const r = t.getBoundingClientRect();
      const p = Math.min(Math.max(-r.top / Math.max(r.height - window.innerHeight, 1), 0), 1);
      engine.current?.setProgress(p);
      stage.current?.style.setProperty("--rw-p", p.toFixed(4));
      if (hero.current) hero.current.style.opacity = String(Math.max(0, 1 - p * 12));
      const s = stationAt(p);
      if (s !== last) setStation((last = s));
    };
    const onScroll = () => {
      if (!raf) raf = requestAnimationFrame(read);
    };
    read();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    const io = new IntersectionObserver(([entry]) => engine.current?.setActive(entry.isIntersecting && !document.hidden));
    if (track.current) io.observe(track.current);
    const onVis = () => engine.current?.setActive(!document.hidden);
    document.addEventListener("visibilitychange", onVis);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      io.disconnect();
      document.removeEventListener("visibilitychange", onVis);
    };
  }, [still, ready]);

  const restart = () => {
    const top = (track.current?.getBoundingClientRect().top ?? 0) + window.scrollY;
    if (lenis) lenis.scrollTo(top, { duration: 1.6 });
    else window.scrollTo({ top, behavior: "smooth" });
  };

  const current = rideStations[station];
  return (
    <main id="main" className="rw" data-parallax-skip data-still={still || undefined} style={{ "--rw-bg": bg } as CSSProperties}>
      <div ref={track} style={{ height: still ? "auto" : "700svh" }}>
        <div ref={stage} className="rw-stage">
          <canvas ref={canvas} className="rw-canvas" aria-hidden />
          <div className="absolute inset-y-0 inset-x-[max(16px,4vw)]">
            <div className="rw-strip">
              <p className="rw-brand">
                {ride.brand} <span>/ {ride.tag}</span>
              </p>
              <button type="button" className="rw-btn" onClick={() => info.current?.showModal()}>
                Info
              </button>
            </div>

            <div ref={hero} className="rw-hero">
              <h1 className="sr-only">
                {ride.title.join(" ")}: {ride.subtitle}
              </h1>
              <Halftone lines={ride.title} />
              <p className="rw-sub">{ride.subtitle}</p>
            </div>

            {!still && (
              <p className="rw-station" aria-hidden>
                {current.label}
                <b>{current.title}</b>
              </p>
            )}

            <div className="rw-dock">
              <div className="rw-swatches" role="group" aria-label="Background colour">
                <span className="rw-brand mr-1 hidden sm:inline">Bg color</span>
                {rideSwatches.map((s) => (
                  <button
                    key={s.value}
                    type="button"
                    className="rw-swatch"
                    style={{ background: s.value }}
                    aria-pressed={bg === s.value}
                    aria-label={s.name}
                    onClick={() => setBg(s.value)}
                  />
                ))}
                <input className="rw-picker" type="color" value={bg} onChange={(e) => setBg(e.target.value)} aria-label="Pick any background colour" />
              </div>
              {!still && (
                <button type="button" className="rw-btn" onClick={restart}>
                  Restart
                </button>
              )}
            </div>
          </div>
          {!still && (
            <div className="rw-meter" aria-hidden>
              <i />
            </div>
          )}
        </div>
      </div>

      <section className={still ? "rw-text gutter" : "sr-only"} aria-label="The run, station by station">
        <ol className="mx-auto max-w-3xl">
          {rideStations.map((s) => (
            <li key={s.id}>
              <p className="font-mono text-xs uppercase tracking-[0.14em] opacity-75">{s.label}</p>
              <h2 className="mt-2 font-[family-name:var(--font-sans)] text-2xl font-bold">{s.title}</h2>
              {s.lines.map((l) => (
                <p key={l} className="mt-2 font-[family-name:var(--font-serif)] text-lg leading-relaxed">
                  {l}
                </p>
              ))}
            </li>
          ))}
        </ol>
      </section>

      <dialog ref={info} className="rw-dialog" aria-labelledby="rw-info-h">
        <h2 id="rw-info-h" className="rw-brand">
          {ride.info.title}
        </h2>
        {ride.info.body.map((p) => (
          <p key={p} className="mt-4 font-[family-name:var(--font-serif)] text-lg leading-relaxed">
            {p}
          </p>
        ))}
        <p className="mt-4 font-mono text-xs leading-relaxed opacity-80">{ride.info.keys}</p>
        <form method="dialog" className="mt-6">
          <button type="submit" className="rw-btn" autoFocus>
            Close
          </button>
        </form>
      </dialog>
    </main>
  );
}
