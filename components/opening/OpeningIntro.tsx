"use client";

import { useCallback, useEffect, useSyncExternalStore } from "react";
import { useLenis } from "lenis/react";
import { markIntroSeen } from "@/lib/opening/intro-boot";

import { PaintedTrailer } from "./PaintedTrailer";

/** the page tells the stores below when the intro marker on <html> changes */
const EVENT = "bsah:intro-state";
const subscribe = (cb: () => void) => { window.addEventListener(EVENT, cb); return () => window.removeEventListener(EVENT, cb); };
/** "1" while the film plays, "reveal" while it fades and the page shows beneath it; either way the film is on screen. */
const markerOn = () => !!document.documentElement.dataset.bsahIntro;
const never = () => false;

/**
 * The introduction. Lives in the root layout. On the first visit to the home page in a browser session (decided before first paint
 * by lib/opening/intro-boot.ts) it lays the film over the page, holds the page still underneath while it plays, and lets go when the
 * film has faded out. Since 15 Nov 2026 the film is a 25 s trailer cut from the painted Marwari journey
 * (components/opening/PaintedTrailer.tsx); the Marwar Journey video it replaced stays mid-page on the home page. When the film is gone, focus lands on the first screen (#doctrine),
 * so a keyboard visitor who pressed Skip is not left on <body>.
 */
export function OpeningIntro() {
  const playing = useSyncExternalStore(subscribe, markerOn, never);
  const lenis = useLenis();

  // the page underneath stays still and unreachable while the film plays
  useEffect(() => {
    if (!playing) return;
    (window as unknown as { __bsahIntroMounted?: boolean }).__bsahIntroMounted = true;
    const main = document.getElementById("main");
    main?.setAttribute("inert", "");
    lenis?.stop();
    // the film starts, and the homepage is revealed, at the top of the page (a reload would otherwise restore an old scroll position under it)
    const previous = history.scrollRestoration;
    history.scrollRestoration = "manual";
    const top = () => { if (window.scrollY !== 0) window.scrollTo(0, 0); };
    top();
    window.addEventListener("scroll", top);
    return () => {
      window.removeEventListener("scroll", top);
      history.scrollRestoration = previous;
      main?.removeAttribute("inert");
      lenis?.start();
      // the film has gone (not just a re-run of this effect): hand focus to the first screen if it was on the film's controls or
      // nowhere, now that the page is no longer inert, so a keyboard visitor who pressed Skip is not left on <body>
      if (document.documentElement.dataset.bsahIntro) return;
      const active = document.activeElement;
      if (!active || active === document.body || active.closest("[data-intro-film]")) document.getElementById("doctrine")?.focus({ preventScroll: true });
    };
  }, [playing, lenis]);

  // the film has ended and starts to fade: the page beneath it is shown now, so the film dissolves into the home hero instead of into black
  const reveal_ = useCallback(() => {
    markIntroSeen();
    document.documentElement.dataset.bsahIntro = "reveal";
    window.scrollTo(0, 0);
    // the hero film waits for this signal before it starts playing: it begins while the film is still fading
    window.dispatchEvent(new Event("bsah:loader-gone"));
  }, []);

  const done = useCallback(() => {
    markIntroSeen();
    document.documentElement.removeAttribute("data-bsah-intro");
    window.dispatchEvent(new Event(EVENT));
    window.dispatchEvent(new Event("bsah:loader-gone"));
  }, []);


  return (
    <>
      {playing && <PaintedTrailer onDone={done} onReveal={reveal_} />}
    </>
  );
}
