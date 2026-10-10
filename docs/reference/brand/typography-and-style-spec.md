# Typography & UI Styling Spec

> Source: `instructions/02_Brand_Guide/typography_and_style_spec.md.docx` (converted to Markdown for Claude Code; the original file is unchanged).

# BSAH Typography & UI Styling Specifications

## 1. Font Family Import Sources (Google Fonts)

- Headings: Cinzel (Serif) & Cormorant Garamond (Serif)

- Body & Controls: Inter (Sans-Serif)

- Tickers & Telemetry: JetBrains Mono (Monospace)

## 2. Card Surface & Vignette CSS

/* Card Container */

.bsah-card {

background-color: #12141A;

border: 1px solid rgba(197, 160, 89, 0.25);

box-shadow: 0 0 15px rgba(197, 160, 89, 0.10);

}

/* Radial Vignette Mask */

.cinematic-vignette {

background: radial-gradient(

circle at center,

rgba(10, 11, 14, 0.15) 0%,

rgba(10, 11, 14, 0.70) 65%,

rgba(10, 11, 14, 0.98) 100%

);

}
