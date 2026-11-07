/** localStorage key meaning "this browser has seen the intro film to its end (or skipped it)". Remembered for this visit only (sessionStorage); ?intro plays it again. */
export const INTRO_SEEN_KEY = "bsah-intro-seen";
/** sessionStorage key set when the film ends on /worlds and hands over to the homepage (the homepage then fades up from black). */
export const INTRO_REVEAL_KEY = "bsah-intro-reveal";

/** Remembers that the intro has been seen. localStorage when the browser allows it, else this session only. Safe to call anywhere. */
export function markIntroSeen(): void {
  // this visit only: whoever opens the website again (a new tab or window, another day) sees the intro again
  try { window.sessionStorage.setItem(INTRO_SEEN_KEY, "1"); } catch { /* nothing can be remembered */ }
}

/**
 * Runs in <head> before first paint (app/layout.tsx), ahead of the first-visit loader's own script. On a visitor's first visit to the
 * home page (never seen the intro: no INTRO_SEEN_KEY in localStorage) it marks <html data-bsah-intro="1"> and hides the page (the intro
 * film is laid over it), and marks the loader as already seen so the running horse does not play in front of the film. It leaves
 * everything alone when the visitor asks for reduced motion, has data saver on or a very slow connection, or adds ?nointro (?intro
 * plays it again). The component that plays the film moves the marker to "reveal" when the film starts to fade (the page then shows
 * beneath it) and removes it when the film cannot play (no WebGL 2) or has gone. Completion is stored by markIntroSeen(), not here,
 * so a visit that is closed halfway through plays again next time.
 */
export function buildIntroBootScript(): string {
  return [
    `try{`,
    `var d=document.documentElement,s=sessionStorage,q=location.search,K="${INTRO_SEEN_KEY}",L=null;`,
    `try{L=localStorage}catch(e){}`,
    `if(/[?&]intro(=|&|$)/.test(q)){try{if(L)L.removeItem(K)}catch(e){}s.removeItem(K)}`,
    `try{if(L)L.removeItem(K)}catch(e){}var seen=!!s.getItem(K);`,
    `var c=navigator.connection||{};`,
    `if(location.pathname==="/"&&!seen&&q.indexOf("nointro")===-1&&q.indexOf("noload")===-1&&!matchMedia("(prefers-reduced-motion: reduce)").matches&&!c.saveData&&!/(^|-)(slow-)?2g$/.test(c.effectiveType||"")){`,
    `s.setItem("bsah-loaded","1");d.dataset.bsahIntro="1";`,
    `var t=document.createElement("style");t.textContent="html[data-bsah-intro=\\"1\\"]{background:#000}html[data-bsah-intro=\\"1\\"] body{visibility:hidden}";document.head.appendChild(t);`,
    // failsafe: if the film's code has not started within 20 s (a failed script, a blocked chunk), the page is shown
    `setTimeout(function(){if(!window.__bsahIntroMounted)d.removeAttribute("data-bsah-intro")},20000)`,
    `}`,
    `}catch(e){}`,
  ].join("");
}

export const introBootScript: string = buildIntroBootScript();
