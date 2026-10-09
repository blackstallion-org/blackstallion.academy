import localFont from "next/font/local";

/**
 * Self-hosted fonts (SIL Open Font License 1.1, from Fontsource). See app/fonts/LICENSES.md.
 *
 * Display + story: Bodoni Moda, a high-contrast didone with an optical-size axis.
 *   At 10–14vw it becomes hairline-thin and theatrical; at 18px its opsz makes it readable.
 * Labels: Barlow Condensed, uppercase and widely tracked, like film-poster credits.
 * Numbers: JetBrains Mono.
 */
export const bodoni = localFont({
  src: [
    { path: "../app/fonts/bodoni-moda-latin-standard-normal.woff2", weight: "400 900", style: "normal" },
    { path: "../app/fonts/bodoni-moda-latin-standard-italic.woff2", weight: "400 900", style: "italic" },
  ],
  variable: "--font-bodoni",
  display: "swap",
});

export const barlow = localFont({
  src: [
    { path: "../app/fonts/barlow-condensed-latin-400-normal.woff2", weight: "400", style: "normal" },
    { path: "../app/fonts/barlow-condensed-latin-500-normal.woff2", weight: "500", style: "normal" },
    { path: "../app/fonts/barlow-condensed-latin-600-normal.woff2", weight: "600", style: "normal" },
  ],
  variable: "--font-barlow",
  display: "swap",
});

export const jetbrains = localFont({
  src: "../app/fonts/jetbrains-mono-latin-wght-normal.woff2",
  weight: "100 800",
  variable: "--font-jetbrains",
  display: "swap",
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

export const fontVariables = [bodoni, barlow, jetbrains, rupee].map((f) => f.variable).join(" ");
