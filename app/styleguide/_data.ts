/** Swatch data for /styleguide. Hex values mirror the @theme tokens in app/globals.css. */
export type Swatch = { token: string; hex: string; role: string; className: string };

export const swatches: Swatch[] = [
  { token: "obsidian", hex: "#0A0B0E", role: "Page canvas. Never #000.", className: "bg-obsidian" },
  { token: "carbon", hex: "#12141A", role: "Cards, modals, nav", className: "bg-carbon" },
  { token: "brass", hex: "#C5A059", role: "Accent: hairlines, active states, crests, key numbers", className: "bg-brass" },
  { token: "parchment-gold", hex: "#E6CA65", role: "Rim highlights, hover glow, the one number that matters", className: "bg-parchment-gold" },
  { token: "crimson", hex: "#8B0000", role: "Alerts and the war chapter. Background only", className: "bg-crimson" },
  { token: "thar-sand", hex: "#B8946A", role: "Legend chapters: desert light, map lines", className: "bg-thar-sand" },
  { token: "ink", hex: "#F4F4F6", role: "Body text", className: "bg-ink" },
  { token: "muted", hex: "#8E93A1", role: "Captions, labels, secondary text", className: "bg-muted" },
];

function luminance(hex: string) {
  const [r, g, b] = [1, 3, 5].map((i) => {
    const c = parseInt(hex.slice(i, i + 2), 16) / 255;
    return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

/** WCAG contrast ratio between two hex colours. */
export function contrast(a: string, b: string) {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (hi + 0.05) / (lo + 0.05);
}

export const motionTokens = [
  { token: "ease.citadel", value: "[0.16, 1, 0.3, 1]", use: "Everything" },
  { token: "dur.micro", value: "0.2 s", use: "Hover, focus, brass highlight" },
  { token: "dur.ui", value: "0.4 s", use: "Drawers, modals, tabs" },
  { token: "dur.reveal", value: "0.8 s", use: "Text and image reveals" },
  { token: "dur.cinematic", value: "1.4 s", use: "Curtain, chapter changes" },
  { token: "stagger", value: "0.06 s", use: "Lines and list items" },
];

export const sections = [
  { id: "colour", label: "Colour" },
  { id: "type", label: "Typography" },
  { id: "marks", label: "Brand marks" },
  { id: "buttons", label: "Buttons" },
  { id: "cards", label: "Cards" },
  { id: "headings", label: "Headings and dividers" },
  { id: "stats", label: "Stats" },
  { id: "motion", label: "Motion" },
  { id: "ambient", label: "Ambient" },
];
