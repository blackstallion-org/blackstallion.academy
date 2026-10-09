import localFont from "next/font/local";

/**
 * Self-hosted fonts (SIL OFL 1.1, from Fontsource). See app/fonts/LICENSES.md.
 *
 * The system is built to avoid the usual "luxury template" faces
 * (Cinzel, Cormorant, Playfair, Inter):
 *
 * Kalnia      Display. Two voices from one family:
 *             - INSCRIPTION: wide (wdth 125), hairline (wght 200), capitals. Reads like a fort inscription.
 *             - WAR VOICE: normal width, heavy (wght 600), lowercase. The line that lands.
 * Newsreader  Story and body. Italic is the quiet, documentary voice.
 * Mona Sans   Labels, nav, buttons: condensed (wdth 75), uppercase, tracked. Also small UI text.
 * Martian Mono Numbers, passport codes, microchips, the terminal.
 */
export const kalnia = localFont({
  src: "../app/fonts/kalnia-latin-standard-normal.woff2",
  weight: "100 700",
  variable: "--font-kalnia",
  display: "swap",
  declarations: [{ prop: "font-stretch", value: "100% 125%" }],
});

export const newsreader = localFont({
  src: [
    { path: "../app/fonts/newsreader-latin-wght-normal.woff2", weight: "200 800", style: "normal" },
    { path: "../app/fonts/newsreader-latin-wght-italic.woff2", weight: "200 800", style: "italic" },
  ],
  variable: "--font-newsreader",
  display: "swap",
});

export const mona = localFont({
  src: "../app/fonts/mona-sans-latin-standard-normal.woff2",
  weight: "200 900",
  variable: "--font-mona",
  display: "swap",
  declarations: [{ prop: "font-stretch", value: "75% 125%" }],
});

export const martian = localFont({
  src: "../app/fonts/martian-mono-latin-standard-normal.woff2",
  weight: "100 800",
  variable: "--font-martian",
  display: "swap",
  preload: false,
  declarations: [{ prop: "font-stretch", value: "75% 112.5%" }],
});

/** ₹ only, cut from Inter: none of the fonts above include it. */
export const rupee = localFont({
  src: "../app/fonts/inter-rupee-wght-normal.woff2",
  weight: "100 900",
  variable: "--font-rupee",
  display: "swap",
  adjustFontFallback: false,
  preload: false,
  declarations: [{ prop: "unicode-range", value: "U+20B9" }],
});

export const fontVariables = [kalnia, newsreader, mona, martian, rupee].map((f) => f.variable).join(" ");
