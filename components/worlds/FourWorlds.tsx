"use client";

import { useEffect, useRef, useState } from "react";
import { useLenis } from "lenis/react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useCapabilities } from "@/lib/3d/use-capabilities";
import type { EngineStatus, WorldsEngine } from "./core/engine";
import { WorldsFallback } from "./WorldsFallback";
import { WorldsOverlay, type OverlayHandle } from "./WorldsOverlay";
import styles from "./four-worlds.module.css";

/**
 * /worlds: one scroll-scrubbed camera through four worlds. The section is tall (its height is the length of the film); the
 * stage inside it is sticky, and ScrollTrigger turns the section's scroll position into one progress value (0..1) that the
 * engine plays. The engine (three.js, the horse, every world) is a separate chunk, loaded only when WebGL 2 is available and
 * the visitor has not asked for reduced motion; otherwise the page shows the static version (four stills and the same copy).
 */
export function FourWorlds() {
  const caps = useCapabilities();
  const [reduced, setReduced] = useState<boolean | null>(null);
  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const set = () => setReduced(mq.matches);
    set();
    mq.addEventListener("change", set);
    return () => mq.removeEventListener("change", set);
  }, []);
  if (!caps || reduced === null) return <div className={styles.placeholder} aria-hidden />;
  if (!caps.webgl || reduced) return <WorldsFallback reason={reduced ? "reduced" : "webgl"} />;
  return <WorldsStage mobile={caps.quality === "low"} />;
}

/** Sets the smooth scroll's follow rate and wheel travel; returns the function that puts the previous values back. */
function tuneScroll(options: { lerp?: number; wheelMultiplier?: number }, lerp: number, wheelMultiplier: number): () => void {
  const prev = { lerp: options.lerp, wheelMultiplier: options.wheelMultiplier };
  options.lerp = lerp;
  options.wheelMultiplier = wheelMultiplier;
  return () => { options.lerp = prev.lerp; options.wheelMultiplier = prev.wheelMultiplier; };
}

function WorldsStage({ mobile }: { mobile: boolean }) {
  const section = useRef<HTMLElement>(null);
  const canvas = useRef<HTMLCanvasElement>(null);
  const engineRef = useRef<WorldsEngine | null>(null);
  const overlay = useRef<OverlayHandle>(null);
  const [status, setStatus] = useState<EngineStatus | null>(null);
  const [failed, setFailed] = useState(false);
  // light mode: the lowest tier, locked. A choice the visitor makes (and the page remembers) for a device that struggles.
  // (this component only renders in the browser, after the capability check, so reading storage here cannot mismatch the server)
  const [lite, setLite] = useState(() => {
    try { return new URLSearchParams(window.location.search).get("tier") === "low" || window.localStorage.getItem("bsah-worlds-lite") === "1"; } catch { return false; }
  });
  useEffect(() => { engineRef.current?.setLite(lite); }, [lite, status?.phase]);
  const toggleLite = () => setLite((v) => { try { window.localStorage.setItem("bsah-worlds-lite", v ? "0" : "1"); } catch { /* optional */ } return !v; });
  const lenis = useLenis();

  // the engine: created once, disposed on unmount
  useEffect(() => {
    const el = canvas.current;
    if (!el) return;
    let engine: WorldsEngine | null = null;
    let cancelled = false;
    const ro = new ResizeObserver(() => engine?.resize(el.clientWidth, el.clientHeight));
    const io = new IntersectionObserver(([e]) => engine?.setVisible(e.isIntersecting), { rootMargin: "100px" });
    void import("./core/engine")
      .then(({ WorldsEngine }) => {
        if (cancelled) return;
        const params = new URLSearchParams(window.location.search);
        const forced = params.get("tier");
        engine = new WorldsEngine(el, { mobile, tier: forced === "high" || forced === "medium" || forced === "low" ? forced : mobile ? "low" : "high" });
        engineRef.current = engine;
        engine.onStatus = (s) => {
          setStatus(s);
          if (s.phase === "failed") setFailed(true);
        };
        engine.resize(el.clientWidth, el.clientHeight);
        ro.observe(el);
        io.observe(el);
        // QA: ?p=0.42 opens the film at that point; ?freeze=1 stops ambient time for repeatable captures
        const p0 = Number(params.get("p"));
        if (params.get("freeze") === "1") engine.frozen = true;
        if (process.env.NODE_ENV !== "production" || params.has("debug")) (window as unknown as { __worlds: WorldsEngine }).__worlds = engine;
        void engine.start(Number.isFinite(p0) ? p0 : 0);
      })
      .catch(() => setFailed(true));
    return () => {
      cancelled = true;
      ro.disconnect();
      io.disconnect();
      engine?.dispose();
      engineRef.current = null;
    };
  }, [mobile]);

  // scroll -> progress (scrubbed, reversible). No snapping: the camera path holds on each story beat by itself, and a snap fights the
  // smooth scroll on a slower machine. The overlay is updated directly, so a scroll tick never re-renders React.
  useEffect(() => {
    const el = section.current;
    if (!el) return;
    gsap.registerPlugin(ScrollTrigger);
    const unsub = lenis?.on("scroll", ScrollTrigger.update);
    const st = ScrollTrigger.create({
      trigger: el,
      start: "top top",
      end: "bottom bottom",
      onUpdate: (self) => {
        engineRef.current?.setProgress(self.progress);
        overlay.current?.update(self.progress);
      },
    });
    overlay.current?.update(st.progress);
    const params = new URLSearchParams(window.location.search);
    const p0 = Number(params.get("p"));
    if (Number.isFinite(p0) && p0 > 0) {
      requestAnimationFrame(() => window.scrollTo({ top: st.start + (st.end - st.start) * p0, behavior: "instant" as ScrollBehavior }));
    }
    return () => { unsub?.(); st.kill(); };
  }, [lenis]);

  // The site's smooth scroll is tuned for reading pages (a long glide). For the film it follows the wheel more closely and travels
  // a little further per notch, which also feels lighter on a machine that is busy drawing; the page's own settings come back on leaving.
  useEffect(() => {
    if (!lenis) return;
    return tuneScroll(lenis.options, 0.12, 1.2);
  }, [lenis]);

  const goTo = (p: number) => {
    const el = section.current;
    if (!el) return;
    const top = el.getBoundingClientRect().top + window.scrollY;
    const y = top + (el.offsetHeight - window.innerHeight) * p;
    if (lenis) lenis.scrollTo(y, { duration: 2.4 });
    else window.scrollTo({ top: y, behavior: "smooth" });
  };

  if (failed) return <WorldsFallback reason="error" />;
  return (
    <section ref={section} className={`${styles.film} tone-photo`} aria-label="Four Worlds: a scroll-controlled film">
      <div className={styles.stage}>
        <canvas ref={canvas} className={styles.canvas} aria-hidden />
        {/* the first frame of the film, a still rendered from the real scene, stands in until the engine has drawn its own */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/worlds/posters/origins.webp" alt="" aria-hidden fetchPriority="high" decoding="async" className={`${styles.poster} ${status?.phase === "ready" ? styles.posterGone : ""}`} />
        <WorldsOverlay ref={overlay} status={status} onJump={goTo} lite={lite} onLite={toggleLite} />
      </div>
    </section>
  );
}
