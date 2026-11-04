import { LOADER_HORSE, OPENING_ENABLED, type LoaderHorse } from "./config";

/** sessionStorage key meaning "this session has already seen the loader (and so the opening)". */
export const LOADER_SESSION_KEY = "bsah-loaded";

/**
 * The script that runs in <head> before first paint (see app/layout.tsx) and decides whether the loader shows.
 *
 *  - Seen the loader this session, reduced motion, or ?noload  ->  <html data-bsah-loaded> : no loader (so no opening either).
 *  - Otherwise the loader shows, and its picture (the running-horse GIF, or the earlier pixel horse's script) is requested at once.
 *  - ?opening forgets that the loader was seen, so the first-visit opening plays again. (The opening itself is the loader's last
 *    step on the home page: components/motion/Loader.tsx.)
 *
 * A pure function so the same text can be tested with a stand-in browser (tests/opening.test.mjs).
 */
export function buildLoaderBootScript({ sessionKey, horse, opening }: { sessionKey: string; horse: LoaderHorse; opening: boolean }): string {
  return [
    `try{`,
    `var d=document.documentElement,s=sessionStorage;`,
    opening ? `if(/[?&]opening(=|&|$)/.test(location.search)){s.removeItem("${sessionKey}")}` : "",
    `if(s.getItem("${sessionKey}")||matchMedia("(prefers-reduced-motion: reduce)").matches||location.search.indexOf("noload")!==-1){d.dataset.bsahLoaded="1"}`,
    `else{`,
    `var l=document.createElement("link");l.rel="preload";l.as="${horse === "pixel" ? "script" : "image"}";l.href="${horse === "pixel" ? "/animations/pixel-horse.js" : "/opening/loader.gif"}";document.head.appendChild(l)`,
    `}`,
    `}catch(e){}`,
  ].join("");
}

/** The script for this build, inlined in <head> by app/layout.tsx. */
export const loaderBootScript: string = buildLoaderBootScript({ sessionKey: LOADER_SESSION_KEY, horse: LOADER_HORSE, opening: OPENING_ENABLED });
