import { LOADER_HORSE, OPENING_ENABLED, type LoaderHorse } from "./config";

/** sessionStorage key meaning "this session has already seen the loader (and so the opening)". */
export const LOADER_SESSION_KEY = "bsah-loaded";

/**
 * The script that runs in <head> before first paint (see app/layout.tsx) and decides what the first visit shows.
 *
 *  - Seen the loader this session, reduced motion, or ?noload  ->  <html data-bsah-loaded> : no loader, no opening.
 *  - Otherwise the loader shows, and its picture is requested straight away (the running-horse GIF, or the
 *    earlier pixel horse's script).
 *  - On the home page, first visit, the opening will also run: <html data-bsah-opening="1"> and its first shot is requested.
 *    HeroFilm and the loader read that flag (the film waits, the loader waits for the opening's pictures). A last-resort timer
 *    clears it so a page whose opening never starts is never held.
 *  - ?opening on the home page forgets that the loader was seen, so the whole first visit plays again.
 *
 * A pure function so the same text can be tested with a stand-in browser (tests/opening.test.mjs).
 */
export function buildLoaderBootScript({ sessionKey, horse, opening }: { sessionKey: string; horse: LoaderHorse; opening: boolean }): string {
  const preload = (href: string, as: string) => `p("${href}","${as}")`;
  return [
    `try{`,
    `var d=document.documentElement,s=sessionStorage;`,
    opening ? `if(/[?&]opening(=|&|$)/.test(location.search)){s.removeItem("${sessionKey}")}` : "",
    `if(s.getItem("${sessionKey}")||matchMedia("(prefers-reduced-motion: reduce)").matches||location.search.indexOf("noload")!==-1){d.dataset.bsahLoaded="1"}`,
    `else{`,
    `var p=function(h,a){var l=document.createElement("link");l.rel="preload";l.as=a;l.href=h;document.head.appendChild(l)};`,
    horse === "pixel" ? preload("/animations/pixel-horse.js", "script") : preload("/opening/loader.gif", "image"),
    `;`,
    opening
      ? `if(location.pathname==="/"){d.dataset.bsahOpening="1";${preload("/opening/ink-1.webp", "image")};setTimeout(function(){if(d.dataset.bsahOpening){delete d.dataset.bsahOpening;dispatchEvent(new Event("bsah:opening-done"))}},12000)}`
      : "",
    `}`,
    `}catch(e){}`,
  ].join("");
}

/** The script for this build, inlined in <head> by app/layout.tsx. */
export const loaderBootScript: string = buildLoaderBootScript({ sessionKey: LOADER_SESSION_KEY, horse: LOADER_HORSE, opening: OPENING_ENABLED });
