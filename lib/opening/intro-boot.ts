/** sessionStorage key meaning "this session has been shown the intro film". */
export const INTRO_SESSION_KEY = "bsah-intro";
/** sessionStorage key set when the film ends on /worlds and hands over to the homepage (the homepage then fades up from black). */
export const INTRO_REVEAL_KEY = "bsah-intro-reveal";

/**
 * Runs in <head> before first paint (app/layout.tsx), ahead of the first-visit loader's own script. On the first visit to the home
 * page in a browser session it marks <html data-bsah-intro> and hides the page (the intro film is laid over it), and marks the
 * loader as already seen so the running horse does not play in front of the film. It leaves everything alone when the visitor asks
 * for reduced motion, has data saver on or a very slow connection, or adds ?nointro (?intro plays it again). The component that
 * plays the film removes the marker the moment the film cannot play (no WebGL 2) or ends.
 */
export function buildIntroBootScript(): string {
  return [
    `try{`,
    `var d=document.documentElement,s=sessionStorage,q=location.search;`,
    `if(/[?&]intro(=|&|$)/.test(q)){s.removeItem("${INTRO_SESSION_KEY}")}`,
    `var c=navigator.connection||{};`,
    `if(location.pathname==="/"&&!s.getItem("${INTRO_SESSION_KEY}")&&q.indexOf("nointro")===-1&&q.indexOf("noload")===-1&&!matchMedia("(prefers-reduced-motion: reduce)").matches&&!c.saveData&&!/(^|-)(slow-)?2g$/.test(c.effectiveType||"")){`,
    `s.setItem("${INTRO_SESSION_KEY}","1");s.setItem("bsah-loaded","1");d.dataset.bsahIntro="1";`,
    `var t=document.createElement("style");t.textContent="html[data-bsah-intro]{background:#000}html[data-bsah-intro] body{visibility:hidden}";document.head.appendChild(t);`,
    // failsafe: if the film's code has not started within 20 s (a failed script, a blocked chunk), the page is shown
    `setTimeout(function(){if(!window.__bsahIntroMounted)d.removeAttribute("data-bsah-intro")},20000)`,
    `}`,
    `}catch(e){}`,
  ].join("");
}

export const introBootScript: string = buildIntroBootScript();
