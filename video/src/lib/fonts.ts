import { continueRender, delayRender } from "remotion";
import display from "../../../app/fonts/noto-serif-display-latin-wght-normal.woff2";
import displayItalic from "../../../app/fonts/noto-serif-display-latin-wght-italic.woff2";
import sans from "../../../app/fonts/plus-jakarta-sans-latin-wght-normal.woff2";

/** The website's own faces (app/fonts, SIL OFL): Noto Serif Display for titles, Plus Jakarta Sans for small labels. */
export const DISPLAY = "BSAH Display";
export const SANS = "BSAH Sans";

let started = false;
export function loadFonts() {
  if (started || typeof document === "undefined") return;
  started = true;
  const handle = delayRender("fonts");
  const faces = [
    new FontFace(DISPLAY, `url(${display})`, { weight: "100 900", style: "normal" }),
    new FontFace(DISPLAY, `url(${displayItalic})`, { weight: "100 900", style: "italic" }),
    new FontFace(SANS, `url(${sans})`, { weight: "200 800", style: "normal" }),
  ];
  Promise.all(faces.map((f) => f.load()))
    .then((loaded) => {
      loaded.forEach((f) => document.fonts.add(f));
      continueRender(handle);
    })
    .catch(() => continueRender(handle));
}
