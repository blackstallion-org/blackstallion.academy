"use client";

import { useLenis } from "lenis/react";
import { usePathname } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import { OPENING_ENABLED } from "@/lib/opening/config";
import styles from "./OpeningFilm.module.css";

type Phase = "idle" | "waiting" | "playing" | "leaving" | "done";

/**
 * The home page opening: the two supplied ink-horse pictures, one after the other, then the site's line. First visit of a session only, on "/"
 * only (the head script, lib/opening/boot.ts, marks <html data-bsah-opening> when it should run), never with reduced motion or
 * ?noload. `?opening` on the home page plays it again. It waits for its own pictures, then for the loader to finish, then plays
 * for about 5.6 seconds; Skip, Escape, or a click anywhere ends it at once. If anything fails it simply does not appear.
 *
 * The two pictures are small (about 60 KB together) and the first was requested by the head script, so it adds almost nothing
 * to the first load. See docs/OPENING.md, including how to switch it off or undo it.
 */
export function OpeningFilm() {
  const pathname = usePathname();
  const lenis = useLenis();
  const [phase, setPhase] = useState<Phase>("idle");
  const rootRef = useRef<HTMLDivElement>(null);
  const skipRef = useRef<HTMLButtonElement>(null);
  const returnFocus = useRef<Element | null>(null);

  const leave = useCallback(() => setPhase((current) => (current === "waiting" || current === "playing" ? "leaving" : current)), []);

  // 1. Decide, once per page load, whether this visit gets the opening.
  useEffect(() => {
    if (!OPENING_ENABLED || pathname !== "/") return;
    const root = document.documentElement;
    if (root.dataset.bsahOpening !== "1") return;
    const frame = requestAnimationFrame(() => {
      if (root.dataset.bsahOpeningStarted) return;
      root.dataset.bsahOpeningStarted = "1";
      setPhase("waiting");
    });
    return () => cancelAnimationFrame(frame);
  }, [pathname]);

  // 2. Wait for the pictures, tell the loader they are ready, then start when the loader has gone.
  useEffect(() => {
    if (phase !== "waiting") return;
    const root = document.documentElement;
    let alive = true;
    const start = () => { if (alive) setPhase((current) => (current === "waiting" ? "playing" : current)); };
    const images = Array.from(rootRef.current?.querySelectorAll("img") ?? []);
    const decoded = Promise.all(images.map((image) => image.decode().then(() => true, () => false)));
    const timeout = new Promise<boolean[]>((resolve) => setTimeout(() => resolve([]), 3500));
    void Promise.race([decoded, timeout]).then((results) => {
      if (!alive) return;
      // A picture that did not arrive means no opening: the site is already behind it.
      if (!results.length || results.some((ok) => !ok)) return setPhase("done");
      root.dataset.bsahOpeningReady = "1";
      window.dispatchEvent(new Event("bsah:opening-ready"));
      if (root.dataset.bsahLoaderGone) start();
      else window.addEventListener("bsah:loader-gone", start, { once: true });
    });
    const unstick = setTimeout(start, 9000); // the loader never reported in: do not hold the visitor
    return () => { alive = false; clearTimeout(unstick); window.removeEventListener("bsah:loader-gone", start); };
  }, [phase]);

  // 3. While it is up: the page behind stays still, focus stays on Skip, Escape leaves.
  useEffect(() => {
    if (phase !== "waiting" && phase !== "playing") return;
    returnFocus.current ??= document.activeElement;
    lenis?.stop();
    skipRef.current?.focus({ preventScroll: true });
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") leave();
      else if (event.key === "Tab") { event.preventDefault(); skipRef.current?.focus({ preventScroll: true }); }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [phase, lenis, leave]);

  // 4. The way out: fade, then remove, then give the page back.
  useEffect(() => {
    if (phase !== "playing") return;
    const timer = setTimeout(leave, 7500); // the clock below normally ends it first
    return () => clearTimeout(timer);
  }, [phase, leave]);
  useEffect(() => {
    if (phase !== "leaving") return;
    const timer = setTimeout(() => setPhase("done"), 380);
    return () => clearTimeout(timer);
  }, [phase]);
  useEffect(() => {
    if (phase !== "done") return;
    const root = document.documentElement;
    delete root.dataset.bsahOpening;
    delete root.dataset.bsahOpeningReady;
    lenis?.start();
    window.dispatchEvent(new Event("bsah:opening-done"));
    const back = returnFocus.current;
    if (back instanceof HTMLElement && back !== document.body) back.focus({ preventScroll: true });
  }, [phase, lenis]);

  if (phase === "idle" || phase === "done") return null;
  return (
    <div
      ref={rootRef}
      className={styles.root}
      data-phase={phase}
      role="dialog"
      aria-modal="true"
      aria-label="Opening film"
      onClick={leave}
      onAnimationEnd={(event) => { if (event.target === event.currentTarget && event.animationName.includes("master")) setPhase("done"); }}
    >
      {[1, 2].map((n) => (
        <div key={n} className={`${styles.shot} ${n === 1 ? styles.shot1 : styles.shot2}`} aria-hidden>
          {/* eslint-disable-next-line @next/next/no-img-element -- the supplied picture, shown as it is */}
          <img className={styles.pic} src={`/opening/ink-${n}.webp`} alt="" decoding="async" fetchPriority={n === 1 ? "high" : "auto"} draggable={false} />
        </div>
      ))}
      <div className={`gutter ${styles.caption}`}>
        <p className={styles.words}>
          <span className={`t-inscribe ${styles.line1}`}>An 800-year lineage,</span>
          <span className={`t-voice ${styles.line2}`}>handed to your child.</span>
        </p>
        <button
          ref={skipRef}
          type="button"
          onClick={(event) => { event.stopPropagation(); leave(); }}
          className={`label min-h-11 rounded-full border border-brass/50 px-5 text-sand hover:text-gold ${styles.skip}`}
        >
          Skip opening
        </button>
      </div>
    </div>
  );
}
