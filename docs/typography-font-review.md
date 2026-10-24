# Reference-inspired typography — 19 October 2026

Added type pairings to the 13 routes containing the previously requested horizontal GSAP chapter effect, seven automatic reveal sections, and the existing gallery/horse-sequence/portrait scramble text. This is a font treatment of those motion components, not a replacement of every font on the site. Existing primary brand typography, body text, forms and navigation remain intact. No palette, content, backend, animation timing or dependency changes.

## Fonts

The exact commercial families pictured in the screenshots were not supplied as font files or webfont licences. These are reference-inspired alternatives, not claims to have installed Weird Horses, Village Horse, Bright Horse, Red Horse, Horsen, Horse Pro, Western Sheriff, Hot Road, Rosex or Elship.

| Role | Family | Source version | Licence |
| --- | --- | --- | --- |
| Western | Rye | Fontsource 5.3.0 | SIL OFL 1.1 |
| Heritage / blackletter | Pirata One | Fontsource 5.3.0 | SIL OFL 1.1 |
| Brush | Permanent Marker | Fontsource 5.3.0 | Apache 2.0 |
| Condensed | Anton | Fontsource 5.3.0 | SIL OFL 1.1 |
| Elegant contrast | Existing Newsreader | Existing project asset | Existing SIL OFL 1.1 |

Original sources and notices: app/fonts/LICENSES.md and app/fonts/editorial/*-LICENSE.txt. Upstream catalogue: https://github.com/google/fonts. The unchanged Latin WOFF2 assets total 98,460 bytes. next/font/local supplies self-hosting with swap and preload disabled. Browser requests only faces actually used; no font CDN requests at runtime. No npm package was installed.

## Page pairings

| Route | Horizontal chapter | Automatic reveal |
| --- | --- | --- |
| / | Western | Existing cube-gallery title: heritage; sequence titles: condensed |
| /legend | Heritage | Elegant |
| /anatomy | Condensed | — |
| /why | Brush | Condensed |
| /curriculum | Condensed | Heritage |
| /schools | Elegant | — |
| /cadets | Brush | Western |
| /parents | Elegant | Brush |
| /fleet | Western | Elegant; portrait scramble: western |
| /equipment | Condensed | — |
| /tournaments | Western | Condensed |
| /lore | Heritage | — |
| /command | Elegant | — |

The opt-in `typeface` prop is shared by HorizontalChapter, ReplayHeadline and ScrambleText. EditorialType.module.css sets family-specific line height, tracking and measure. Extra vertical padding protects brush/western accents; narrow layouts allow long words to wrap. The existing font-ready animation initialization, cleanup and reduced-motion paths remain.

## Validation actually run

- `npm run typecheck`: passed.
- Focused ESLint on lib/editorial-type.ts, the three motion components, three scramble consumers and all 13 opted-in page files: passed.
- `npm run build`: passed, 49 static pages generated.
- Scoped `git diff --check`: passed.
- IAB browser checks on all 13 routes at 390×844: intended computed font family present; 0px document horizontal overflow on each route. Raw evidence: output/typography/mobile-checks.json.
- Desktop 1440×1000 screenshots visually inspected for western, brush, condensed replay and an active condensed horizontal chapter. Western mobile screenshot inspected at 390×844; no text clipping visible.
- Browser error logs returned an empty array in the final checked session.

## Screenshots

- output/typography/cadets-western-desktop.png
- output/typography/cadets-western-mobile.png
- output/typography/parents-brush-desktop.png
- output/typography/curriculum-condensed-scroll-desktop.png (active horizontal scroll, deliberately partial sentence)
- output/typography/tournaments-condensed-desktop.png

## Files

New: lib/editorial-type.ts; components/motion/EditorialType.module.css; four app/fonts/editorial WOFF2 files and four licence notices. Modified: app/fonts/LICENSES.md; HorizontalChapter.tsx/.module.css; ReplayHeadline.tsx/.module.css; ScrambleText.tsx; the 13 route files above (typeface props only in this task); components/sections/editorial/ReferencePanels.tsx; components/sections/home/ImageCubeGallery.tsx; components/sections/home/HorseSequence.tsx (typeface props only). Existing unrelated working changes were preserved.

Limits: no physical-device, screen-reader, reduced-motion emulation, cross-browser or Lighthouse run in this task. Mobile route checks measure layout and font assignment, not a screenshot of every entire route. Exact commercial typefaces still require their supplied webfont files/licences if desired. No deployment or commit performed.
