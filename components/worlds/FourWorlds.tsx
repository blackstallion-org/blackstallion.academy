"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useCapabilities } from "@/lib/3d/use-capabilities";
import type { EngineStatus, WorldsEngine } from "./core/engine";
import { WorldsFallback } from "./WorldsFallback";
import { WorldsOverlay, type OverlayHandle } from "./WorldsOverlay";
import styles from "./four-worlds.module.css";

/**
 * Four Worlds as a short film that plays by itself. One fixed stage; the engine (three.js, the horse, every world) is a separate
 * chunk, loaded only when WebGL 2 is available and the visitor has not asked for reduced motion. The film starts only once the
 * horse and the first world are loaded; it never runs ahead of a world that is still loading; at the end the bars close, the
 * picture goes to black, and `onDone` is called when the stage has finished fading away.
 *
 * `mode="intro"`: laid over the homepage, which is revealed underneath when the stage fades.
 * `mode="page"` (/worlds): the same film as a page of its own; reduced motion or no WebGL shows the stills instead.
 */
export function FourWorlds({ mode, onDone }: { mode: "intro" | "page"; onDone: () => void }) {
  const caps = useCapabilities();
  const [reduced, setReduced] = useState<boolean | null>(null);
  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const set = () => setReduced(mq.matches);
    set();
    mq.addEventListener("change", set);
    return () => mq.removeEventListener("change", set);
  }, []);
  const unavailable = !!caps && (!caps.webgl || reduced === true);
  // as an intro with nothing to play (no WebGL 2, reduced motion): hand straight over to the page
  useEffect(() => { if (mode === "intro" && unavailable) onDone(); }, [mode, unavailable, onDone]);
  if (!caps || reduced === null) return mode === "page" ? <div className={styles.placeholder} aria-hidden /> : null;
  if (unavailable) return mode === "page" ? <WorldsFallback reason={reduced ? "reduced" : "webgl"} /> : null;
  return <WorldsStage mobile={caps.quality === "low"} mode={mode} onDone={onDone} />;
}

/** The longest the visitor waits for the essential assets before the page is shown instead (seconds). */
const LOAD_LIMIT = 25;

function WorldsStage({ mobile, mode, onDone }: { mobile: boolean; mode: "intro" | "page"; onDone: () => void }) {
  const canvas = useRef<HTMLCanvasElement>(null);
  const engineRef = useRef<WorldsEngine | null>(null);
  const overlay = useRef<OverlayHandle>(null);
  const [status, setStatus] = useState<EngineStatus | null>(null);
  const [failed, setFailed] = useState(false);
  const [veil, setVeil] = useState(false);
  const [reveal, setReveal] = useState(false);
  const finished = useRef(false);

  // the end (or a skip): the picture is black, the stage fades away over the page, then the page is told
  const finish = useCallback(() => {
    if (finished.current) return;
    finished.current = true;
    engineRef.current?.stop();
    setReveal(true);
    window.setTimeout(onDone, 2300);
  }, [onDone]);
  const skip = useCallback(() => {
    if (finished.current) return;
    setVeil(true);
    window.setTimeout(finish, 950);
  }, [finish]);

  useEffect(() => {
    const key = (e: KeyboardEvent) => { if (e.key === "Escape") skip(); };
    window.addEventListener("keydown", key);
    return () => window.removeEventListener("keydown", key);
  }, [skip]);

  // the engine: created once, disposed on unmount
  useEffect(() => {
    const el = canvas.current;
    if (!el) return;
    let engine: WorldsEngine | null = null;
    let cancelled = false;
    const ro = new ResizeObserver(() => engine?.resize(el.clientWidth, el.clientHeight));
    const io = new IntersectionObserver(([e]) => engine?.setVisible(e.isIntersecting), { rootMargin: "100px" });
    // essential assets did not arrive in time (a slow connection): the page is shown instead
    const giveUp = window.setTimeout(() => { if (!engine || engine.status.phase !== "ready") setFailed(true); }, LOAD_LIMIT * 1000);
    void import("./core/engine")
      .then(({ WorldsEngine }) => {
        if (cancelled) return;
        const params = new URLSearchParams(window.location.search);
        const forced = params.get("tier");
        engine = new WorldsEngine(el, { mobile, tier: forced === "high" || forced === "medium" || forced === "low" ? forced : mobile ? "low" : "high" });
        engineRef.current = engine;
        engine.onFrame = (p, t) => overlay.current?.update(p, t);
        engine.onStatus = (s) => {
          setStatus(s);
          if (s.phase === "failed") setFailed(true);
          // the film starts only now: the horse and the first world are loaded and their shaders compiled
          if (s.phase === "ready" && !engine!.isPlaying && params.get("autoplay") !== "0") engine!.play(finish);
        };
        engine.resize(el.clientWidth, el.clientHeight);
        ro.observe(el);
        io.observe(el);
        // QA: ?p=0.42 opens the film at that point and does not play (?autoplay=0); ?freeze=1 stops ambient time
        const p0 = Number(params.get("p"));
        if (params.get("freeze") === "1") engine.frozen = true;
        if (process.env.NODE_ENV !== "production" || params.has("debug")) (window as unknown as { __worlds: WorldsEngine }).__worlds = engine;
        void engine.start(Number.isFinite(p0) ? p0 : 0);
      })
      .catch(() => setFailed(true));
    return () => {
      cancelled = true;
      window.clearTimeout(giveUp);
      ro.disconnect();
      io.disconnect();
      engine?.dispose();
      engineRef.current = null;
    };
  }, [mobile, finish]);

  // nothing to show: let the page through
  useEffect(() => { if (failed && mode === "intro") onDone(); }, [failed, mode, onDone]);
  if (failed) return mode === "page" ? <WorldsFallback reason="error" /> : null;

  return (
    <div className={`${styles.root} tone-photo`} data-reveal={reveal || undefined} data-mode={mode} role="region" aria-label="Introduction film">
      <canvas ref={canvas} className={styles.canvas} aria-hidden />
      <WorldsOverlay ref={overlay} status={status} onSkip={skip} veil={veil} />
    </div>
  );
}
