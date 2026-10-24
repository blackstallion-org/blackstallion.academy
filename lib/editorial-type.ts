import localFont from "next/font/local";

// Reference-inspired, licensed display faces. These are not the commercial
// families pictured in the user's moodboard. Notices ship beside the assets.
const western = localFont({ src: "../app/fonts/editorial/rye-latin-400-normal.woff2", weight: "400", variable: "--font-western", display: "swap", preload: false });
const heritage = localFont({ src: "../app/fonts/editorial/pirata-one-latin-400-normal.woff2", weight: "400", variable: "--font-heritage", display: "swap", preload: false });
const brush = localFont({ src: "../app/fonts/editorial/permanent-marker-latin-400-normal.woff2", weight: "400", variable: "--font-brush", display: "swap", preload: false });
const condensed = localFont({ src: "../app/fonts/editorial/anton-latin-400-normal.woff2", weight: "400", variable: "--font-condensed", display: "swap", preload: false });

export type EditorialTypeface = "western" | "heritage" | "brush" | "condensed" | "elegant";
export const editorialFontVariables = [western, heritage, brush, condensed].map((font) => font.variable).join(" ");
