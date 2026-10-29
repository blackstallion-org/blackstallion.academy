"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { PixelHorse } from "./PixelHorse";
import { RunningHorse } from "./RunningHorse";
import { usePathname } from "next/navigation";
import { LOADER_SESSION_KEY } from "@/lib/opening/boot";
import { LOADER_HORSE, OPENING_ENABLED } from "@/lib/opening/config";
import styles from "./Loader.module.css";

const SESSION_KEY = LOADER_SESSION_KEY;

/**
 * One controller for first hydration and internal route handoffs. Shows the running horse (the supplied GIF), or the earlier pixel
 * horse when NEXT_PUBLIC_LOADER_HORSE=pixel (lib/opening/config.ts). The script that decides, before first paint, whether the
 * loader (and the home page opening) shows is in lib/opening/boot.ts.
 */
export function Loader() {
  const pathname = usePathname();
  const lastPath = useRef(pathname);
  const [load, setLoad] = useState({ id: 0, phase: "running" as "running" | "settling" | "zooming" | "fading" | "gone" });
  const fallback = useRef<ReturnType<typeof setTimeout> | null>(null);
  const readyFrames = useRef<number[]>([]);
  const settle = () => setLoad((current) => current.phase === "running" ? { ...current, phase: "settling" } : current);
  // The opening: on the first visit to the home page the loader does not simply fade; the horse zooms into itself and the website opens.
  // Page changes and reloads keep the plain fade.
  const opening = useRef(false);
  const finishSettling = useCallback(() => setLoad((current) => current.phase === "settling" ? { ...current, phase: opening.current && current.id === 0 ? "zooming" : "fading" } : current), []);

  useEffect(() => {
    if (document.documentElement.dataset.bsahLoaded) {
      const frame = requestAnimationFrame(() => setLoad((current) => ({ ...current, phase: "gone" })));
      return () => cancelAnimationFrame(frame);
    }
    opening.current = OPENING_ENABLED && location.pathname === "/";
    try { sessionStorage.setItem(SESSION_KEY, "1"); } catch {}
    // Hydration + first DOM paint are essential; below-fold media stays lazy.
    const frames = readyFrames.current;
    const poster = document.querySelector<HTMLImageElement>("[data-hero-poster]");
    const ready = () => { frames.push(requestAnimationFrame(settle)); };
    const frame = requestAnimationFrame(() => {
      if (!poster || poster.complete) ready();
      else { poster.addEventListener("load", ready, { once: true }); poster.addEventListener("error", ready, { once: true }); }
    });
    const deadline = setTimeout(settle, 3500);
    return () => { cancelAnimationFrame(frame); frames.forEach(cancelAnimationFrame); clearTimeout(deadline); poster?.removeEventListener("load", ready); poster?.removeEventListener("error", ready); };
  }, []);

  useEffect(() => {
    const start = (event: MouseEvent) => {
      if (event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
      const anchor = event.target instanceof Element ? event.target.closest<HTMLAnchorElement>("a[href]") : null;
      if (!anchor || anchor.target === "_blank" || anchor.hasAttribute("download")) return;
      const destination = new URL(anchor.href, location.href);
      if (destination.origin !== location.origin || destination.pathname === location.pathname) return;
      if (fallback.current) clearTimeout(fallback.current);
      document.documentElement.removeAttribute("data-bsah-loaded");
      setLoad((current) => ({ id: current.id + 1, phase: "running" }));
      // Failed, cancelled and interrupted navigation must never leave an overlay behind.
      fallback.current = setTimeout(settle, 4500);
    };
    document.addEventListener("click", start, true);
    return () => { document.removeEventListener("click", start, true); if (fallback.current) clearTimeout(fallback.current); };
  }, []);

  useEffect(() => {
    if (lastPath.current === pathname) return;
    lastPath.current = pathname;
    const frame = requestAnimationFrame(settle);
    return () => cancelAnimationFrame(frame);
  }, [pathname]);

  useEffect(() => {
    if (load.phase !== "running" && load.phase !== "settling") return;
    const hardDeadline = setTimeout(() => setLoad((current) => ({ ...current, phase: "fading" })), 6000);
    return () => clearTimeout(hardDeadline);
  }, [load.id, load.phase]);

  useEffect(() => {
    if (load.phase !== "zooming") return;
    const timer = setTimeout(() => setLoad((current) => ({ ...current, phase: "gone" })), 2950);
    return () => clearTimeout(timer);
  }, [load.phase]);

  useEffect(() => {
    if (load.phase !== "fading") return;
    const timer = setTimeout(() => setLoad((current) => ({ ...current, phase: "gone" })), 260);
    return () => clearTimeout(timer);
  }, [load.phase]);

  if (load.phase === "gone") return null;
  return <div key={load.id} className={`bsah-loader ${styles.overlay}`} data-loading-phase={load.phase} data-horse={LOADER_HORSE} aria-hidden>
    {LOADER_HORSE === "pixel"
      ? <PixelHorse settling={load.phase === "settling"} onSettled={finishSettling} />
      : <RunningHorse settling={load.phase === "settling"} zooming={load.phase === "zooming"} onSettled={finishSettling} />}
  </div>;
}
