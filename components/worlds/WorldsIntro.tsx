"use client";

import dynamic from "next/dynamic";
import { useCallback, useEffect, useRef, useSyncExternalStore } from "react";
import { useLenis } from "lenis/react";
import { INTRO_REVEAL_KEY } from "@/lib/opening/intro-boot";

const FourWorlds = dynamic(() => import("./FourWorlds").then((m) => m.FourWorlds), { ssr: false });

/** the page tells the stores below when the intro marker on <html> changes */
const EVENT = "bsah:intro-state";
const subscribe = (cb: () => void) => { window.addEventListener(EVENT, cb); return () => window.removeEventListener(EVENT, cb); };
const markerOn = () => document.documentElement.dataset.bsahIntro === "1";
const revealPending = () => { try { return sessionStorage.getItem(INTRO_REVEAL_KEY) === "1"; } catch { return false; } };
const never = () => false;
const noSubscribe = () => () => {};

/**
 * The introduction. Lives in the root layout. On the first visit to the home page in a browser session (decided before first paint
 * by lib/opening/intro-boot.ts) it lays the film over the page, holds the page still underneath while it plays, and lets go when the
 * film has faded out. The film's code (three.js and the worlds) is fetched only in that case.
 * When the film ends on /worlds, the homepage it hands over to comes up from black instead (INTRO_REVEAL_KEY).
 */
export function WorldsIntro() {
  const playing = useSyncExternalStore(subscribe, markerOn, never);
  const reveal = useSyncExternalStore(noSubscribe, revealPending, never);
  const lenis = useLenis();
  const cover = useRef<HTMLDivElement>(null);

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
    return () => { window.removeEventListener("scroll", top); history.scrollRestoration = previous; main?.removeAttribute("inert"); lenis?.start(); };
  }, [playing, lenis]);

  const done = useCallback(() => {
    document.documentElement.removeAttribute("data-bsah-intro");
    window.dispatchEvent(new Event(EVENT));
    // the hero film waits for this signal before it starts playing
    window.dispatchEvent(new Event("bsah:loader-gone"));
  }, []);

  // handed over from /worlds: a black cover that fades up to show the homepage
  useEffect(() => {
    const el = cover.current;
    if (!reveal || !el) return;
    try { sessionStorage.removeItem(INTRO_REVEAL_KEY); } catch {}
    const a = el.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 2400, delay: 200, easing: "cubic-bezier(0.4, 0, 0.2, 1)", fill: "forwards" });
    a.onfinish = () => { el.style.display = "none"; window.dispatchEvent(new Event("bsah:loader-gone")); };
    return () => a.cancel();
  }, [reveal]);

  return (
    <>
      {playing && <FourWorlds mode="intro" onDone={done} />}
      {reveal && <div ref={cover} aria-hidden style={{ position: "fixed", inset: 0, zIndex: 200, background: "#000", pointerEvents: "none" }} />}
    </>
  );
}
