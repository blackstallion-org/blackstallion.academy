"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState, useSyncExternalStore, type CSSProperties } from "react";
import { useLenis } from "lenis/react";
import { HERO_MODEL, HERO_MODEL_MOBILE } from "@/components/3d/marwari-paths";
import { FilmImage } from "@/components/film/FilmImage";
import { BEATS, beatStates, clamp, dashFill, gridDotTop, lerpFactor } from "@/lib/bronze/choreography";
import { bronze, statuePose, type Beat } from "@/lib/content/bronze";
import { useCapabilities } from "@/lib/3d/use-capabilities";
import { useNearViewport } from "@/lib/motion/use-near-viewport";
import { useReducedMotion } from "@/lib/motion/reduced";
import { cn } from "@/lib/utils";
import styles from "./BronzeAndTime.module.css";

const noopSubscribe = () => () => {};

/** One delay per letter (0.035 s apart, spaces skipped), for the lift-and-unblur of a title; words stay whole so a narrow column never breaks one. */
function split(lines: readonly string[]) {
  let n = 0;
  return lines.map((line) => line.split(" ").map((word) => Array.from(word).map((ch) => ({ ch, delay: `${(n++ * 0.035).toFixed(3)}s` }))));
}

function Title({ lines }: { lines: readonly [string, string] }) {
  return (
    <h2 className={styles.title} aria-label={lines.join(" ")}>
      {split(lines).map((words, li) => (
        <span key={li} aria-hidden className={li === 1 ? styles.voice : undefined}>
          {words.map((chars, wi) => (
            <span key={wi}>
              {wi > 0 && " "}
              <span className={styles.word}>
                {chars.map((c, i) => (
                  <span key={i} className={styles.char} style={{ "--d": c.delay } as CSSProperties}>
                    {c.ch}
                  </span>
                ))}
              </span>
            </span>
          ))}
          {li === 0 && <br />}
        </span>
      ))}
    </h2>
  );
}

/**
 * "Bronze and Time": a bronze Marwari on a black stage. A tall track, one sticky stage; the scroll position inside the track
 * turns the camera once around the statue, bends the liquid-bronze wave from bronze to sapphire, and brings four chapters
 * in letter by letter. One animation frame loop owns the scene, the chapters, the grid and the pointer.
 *
 * Reduced motion, a device without WebGL 2, a failed model and a lost context all land on the same still page: the poster
 * and the four chapters one under the other (no pinning, no canvas, no cursor).
 */
export function BronzeAndTime() {
  const trackRef = useRef<HTMLElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const imageEl = useRef<HTMLDivElement>(null);
  const cursorIn = useRef<HTMLDivElement>(null);
  const cursorOut = useRef<HTMLDivElement>(null);

  const reduced = useReducedMotion();
  const caps = useCapabilities();
  const hydrated = useSyncExternalStore(noopSubscribe, () => true, () => false);
  const near = useNearViewport(trackRef);
  const [failed, setFailed] = useState(false);
  const lenis = useLenis();

  const mode = reduced || failed || (caps !== null && !caps.webgl) ? "static" : "pinned";
  const active = mode === "pinned" && hydrated && near && caps !== null;
  const quality = caps?.quality ?? "high";

  useEffect(() => {
    if (!active) return;
    const track = trackRef.current;
    const stage = stageRef.current;
    const canvas = canvasRef.current;
    if (!track || !stage || !canvas) return;

    let cancelled = false;
    let raf = 0;
    let last = 0;
    let visible = true;
    let engine: import("@/lib/bronze/engine").BronzeStage | null = null;
    const cleanups: (() => void)[] = [];

    const slides = Array.from(stage.querySelectorAll<HTMLElement>("[data-slide]"));
    const image = imageEl.current;
    const dots = Array.from(stage.querySelectorAll<HTMLElement>("[data-dot]"));
    const fills = Array.from(stage.querySelectorAll<HTMLElement>("[data-fill]"));
    const navButtons = Array.from(stage.querySelectorAll<HTMLElement>("[data-nav]"));
    const shown = [false, false, false, false];
    let current = -1;
    const fine = window.matchMedia("(hover: hover) and (pointer: fine)").matches;
    let cx = 0;
    let cy = 0;
    let ox = 0;
    let oy = 0;

    /** Everything the scroll position drives besides the scene: chapters, the still, the progress bar, the grid, the index. */
    const overlay = (p: number, dt: number) => {
      const on = beatStates(p);
      on.forEach((v, i) => {
        if (v === shown[i]) return;
        shown[i] = v;
        slides[i]?.classList.toggle(styles.active, v);
        if (i === 1) image?.classList.toggle(styles.active, v);
      });
      fills.forEach((el, i) => (el.style.height = `${dashFill(p, i) * 100}%`));
      dots.forEach((el, i) => (el.style.top = `${gridDotTop(i, p)}%`));
      const now = on.lastIndexOf(true);
      if (now !== -1 && now !== current) {
        current = now;
        navButtons.forEach((b, i) => b.setAttribute("aria-current", String(i === now)));
      }
      if (fine && cursorOut.current) {
        // the outer ring eases after the inner one (which sits on the pointer)
        ox += (cx - ox) * lerpFactor(0.2, dt);
        oy += (cy - oy) * lerpFactor(0.2, dt);
        cursorOut.current.style.transform = `translate3d(${ox}px, ${oy}px, 0)`;
      }
    };

    const tick = (now: number) => {
      raf = requestAnimationFrame(tick);
      if (!engine) return;
      const dt = last ? (now - last) / 1000 : 0;
      last = now;
      const rect = track.getBoundingClientRect();
      const span = rect.height - stage.clientHeight;
      const target = span > 0 ? clamp(-rect.top / span, 0, 1) : 0;
      const { progress } = engine.frame(dt, target);
      overlay(progress, dt);
    };
    const start = () => {
      if (raf || !engine || !visible || document.hidden) return;
      last = 0;
      engine.jump();
      raf = requestAnimationFrame(tick);
    };
    const stop = () => {
      cancelAnimationFrame(raf);
      raf = 0;
    };

    const io = new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting;
      if (visible) start();
      else stop();
    });
    io.observe(stage);
    cleanups.push(() => io.disconnect());
    const onVisibility = () => (document.hidden ? stop() : start());
    document.addEventListener("visibilitychange", onVisibility);
    cleanups.push(() => document.removeEventListener("visibilitychange", onVisibility));

    const onLost = (event: Event) => {
      event.preventDefault();
      stop();
      setFailed(true);
    };
    canvas.addEventListener("webglcontextlost", onLost);
    cleanups.push(() => canvas.removeEventListener("webglcontextlost", onLost));

    const onMove = (event: PointerEvent) => {
      const rect = stage.getBoundingClientRect();
      engine?.setPointer(((event.clientX - rect.left) / rect.width) * 2 - 1, ((event.clientY - rect.top) / rect.height) * 2 - 1);
      if (!fine || event.pointerType !== "mouse") return;
      cx = event.clientX - rect.left;
      cy = event.clientY - rect.top;
      if (!stage.classList.contains(styles.cursorOn)) {
        ox = cx;
        oy = cy;
        stage.classList.add(styles.cursorOn);
      }
      if (cursorIn.current) cursorIn.current.style.transform = `translate3d(${cx}px, ${cy}px, 0)`;
      stage.dataset.over = (event.target as Element).closest("a, button") ? "link" : "";
    };
    const onLeave = () => {
      engine?.setPointer(0, 0);
      stage.classList.remove(styles.cursorOn);
    };
    stage.addEventListener("pointermove", onMove);
    stage.addEventListener("pointerleave", onLeave);
    cleanups.push(() => {
      stage.removeEventListener("pointermove", onMove);
      stage.removeEventListener("pointerleave", onLeave);
      stage.classList.remove(styles.cursorOn);
    });

    (async () => {
      try {
        const { BronzeStage } = await import("@/lib/bronze/engine");
        if (cancelled) return;
        const box = stage.getBoundingClientRect();
        engine = new BronzeStage(canvas, quality, box.width, box.height);
        const resize = new ResizeObserver(() => {
          const r = stage.getBoundingClientRect();
          if (r.width > 0 && r.height > 0) engine?.resize(r.width, r.height);
        });
        resize.observe(stage);
        cleanups.push(() => resize.disconnect());
        if (process.env.NODE_ENV !== "production") (window as unknown as { __bronze?: unknown }).__bronze = engine;
        await engine.load(quality === "low" ? HERO_MODEL_MOBILE : HERO_MODEL, statuePose);
        if (cancelled) return;
        start();
      } catch (error) {
        console.warn("[bsah] Bronze and Time could not start; showing the still page.", error instanceof Error ? error.message : error);
        if (!cancelled) setFailed(true);
      }
    })();

    return () => {
      cancelled = true;
      stop();
      cleanups.forEach((fn) => fn());
      engine?.dispose();
      engine = null;
    };
  }, [active, quality]);

  /** The chapter index: scrolls the track to where that chapter reads best. */
  const jump = useCallback(
    (fraction: number) => {
      const track = trackRef.current;
      const stage = stageRef.current;
      if (!track || !stage) return;
      const span = track.offsetHeight - stage.clientHeight;
      const y = track.getBoundingClientRect().top + window.scrollY + fraction * span;
      if (lenis) lenis.scrollTo(y, { duration: reduced ? 0 : 1.8 });
      else window.scrollTo({ top: y, behavior: reduced ? "auto" : "smooth" });
    },
    [lenis, reduced],
  );

  const [b1, b2, b3, b4] = bronze.beats;

  return (
    <section
      ref={trackRef}
      id="bronze-and-time"
      aria-label={bronze.describe}
      data-mode={mode}
      data-js={hydrated ? "true" : undefined}
      data-parallax-skip
      className={cn("tone-dark", styles.track)}
    >
      <div ref={stageRef} className={styles.stage}>
        <canvas ref={canvasRef} className={styles.canvas} aria-hidden />

        {/* The still page's poster: not shown while the scene runs (display: none keeps the image from loading). */}
        <div className={styles.poster}>
          <FilmImage name={bronze.poster} sizes="(min-width: 1024px) 64rem, 100vw" grade="film" />
        </div>

        <div className={styles.gridH} aria-hidden />
        <div className={styles.grid} aria-hidden>
          {[0, 1, 2, 3].map((i) => (
            <div key={i} className={styles.line}>
              <span data-dot className={styles.dot} />
              <span data-dot className={styles.dot} />
            </div>
          ))}
          <div className={styles.line}>
            <span data-dot className={styles.dot} />
            <span data-dot className={styles.dot} />
            <div className={styles.dashes}>
              {[0, 1, 2, 3].map((i) => (
                <div key={i} className={styles.dash}>
                  <div data-fill className={styles.fill} />
                </div>
              ))}
            </div>
          </div>
        </div>

        <nav className={styles.index} aria-label={`${bronze.label}: chapters`}>
          {bronze.beats.map((beat, i) => (
            <span key={beat.id} style={{ display: "contents" }}>
              {i > 0 && <i aria-hidden />}
              <button type="button" data-nav aria-current={i === 0 ? "true" : "false"} onClick={() => jump(BEATS[i].jump)}>
                {beat.nav}
              </button>
            </span>
          ))}
        </nav>

        <Slide beat={b1} index={0} className={styles.s1}>
          <div className={styles.row}>
            <p className={cn(styles.body, styles.reveal, styles.col1)}>{b1.body[0]}</p>
            <p className={cn(styles.body, styles.reveal, styles.col2)}>{b1.body[1]}</p>
          </div>
        </Slide>

        <div ref={imageEl} className={styles.image}>
          <FilmImage name={bronze.image} sizes="(min-width: 1024px) 25vw, 45vw" grade="film" />
        </div>
        <Slide beat={b2} index={1} className={styles.s2}>
          <p className={cn(styles.body, styles.reveal)}>{b2.body[0]}</p>
        </Slide>

        <Slide beat={b3} index={2} className={styles.s3}>
          <p className={cn(styles.body, styles.reveal)}>{b3.body[0]}</p>
        </Slide>

        <Slide beat={b4} index={3} className={styles.s4}>
          <p className={cn(styles.body, styles.reveal)}>{b4.body[0]}</p>
          {b4.links && (
            // a keyboard user can tab to these before the chapter is on screen: bring the chapter to them
            <div className={cn(styles.links, styles.reveal)} onFocusCapture={() => mode === "pinned" && jump(BEATS[3].jump)}>
              {b4.links.map((link) => (
                <Link key={link.href} href={link.href}>
                  {link.label}
                </Link>
              ))}
            </div>
          )}
        </Slide>

        <p className={styles.note}>{bronze.note}</p>

        <div ref={cursorOut} className={styles.cursorOut} aria-hidden />
        <div ref={cursorIn} className={styles.cursorIn} aria-hidden />
      </div>
    </section>
  );
}

function Slide({ beat, index, className, children }: { beat: Beat; index: number; className: string; children: React.ReactNode }) {
  return (
    <article data-slide={index} className={cn(styles.slide, className)} aria-labelledby={`bronze-${beat.id}`}>
      <div id={`bronze-${beat.id}`} style={{ display: "contents" }}>
        <Title lines={beat.title} />
      </div>
      {children}
    </article>
  );
}
