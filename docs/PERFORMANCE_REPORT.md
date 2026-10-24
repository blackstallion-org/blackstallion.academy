# Performance report (24 Oct 2026)

Detailed method, every change and its own measurement: `docs/PERF_NOTES.md`. This report gives the final
before/after comparison and what remains.

## 1. How it was measured

- Lighthouse 12, **mobile** preset (simulated slow 4G + 4× CPU, "Lantern"), against `next start` production builds on
  the cloud sandbox (no CDN, no GPU: WebGL runs in software). Two runs per page, medians. Same machine, same settings,
  run back-to-back: **baseline** = the site before this pass (commit `2b88fc8` + its media), **after** = the
  integrated branch (`session/2026-10-24-final-completion`).
- These are lab numbers. The Vercel preview could not be measured from the sandbox (deployment protection and network
  rules), so CDN caching and real-device GPU rendering are not reflected. Software WebGL makes 3D/WebGL pages look much
  worse than on a phone with a GPU (see `/schools` and `/verify` below).
- Observed (unthrottled) LCP equals FCP (~0.4 s) on every "after" page: the simulated LCP below is Lantern's model of
  downloading JS + fonts on slow 4G, not a late-painting element.

## 2. Results (mobile, medians)

| Route | Perf before → after | LCP before → after | TBT before → after | Bytes before → after | JS before → after |
| --- | --- | --- | --- | --- | --- |
| `/` | **40 → 66** | 17.4 s → 6.5 s | 3,503 ms → 296 ms | 6.68 → 4.51 MB | 0.82 → 0.69 MB |
| `/parents` | **59 → 70–76** | 8.2 s → 5.7–7.8 s | 414 → 155–236 ms | 3.73 → 1.53 MB | 0.73 → 0.42 MB |
| `/legend` | **51 → 72** | 8.6 s → 7.4 s | 939 → 149 ms | 1.84 → 1.43 MB | 0.72 → 0.41 MB |
| `/anatomy` | **run did not finish → 74** | – → 6.0 s | – → 177 ms | 13.6 → 1.05 MB¹ | 0.80 → 0.41 MB¹ |
| `/safety` | – → **75** | – → 6.0 s | – → 133 ms | – → 1.04 MB | – → 0.42 MB |
| `/schools` | 32 → 33 | 7.8 s → 6.9 s | ≈165 s → ≈165 s² | 1.43 → 1.19 MB | 0.79 → 0.66 MB |

¹ from the performance pass's own baseline run (`docs/PERF_NOTES.md`). ² software rendering of the 3D campus
configurator (WebGL on the CPU); not representative of phones with a GPU, but it shows the page does continuous GPU
work at load.

CLS is 0 everywhere except `/schools` (0.103, pre-existing, from the configurator panel). Accessibility 96–100 on the
measured pages after the fixes (home 94 → 97).

## 2b. Effects integration (24 Oct, after the review fixes)

Same method; three interleaved runs per route (two where marked); **without** = this branch before the effects commit,
**with** = effects + review fixes.

| Route | Perf without → with | TBT without → with | Note |
| --- | --- | --- | --- |
| `/` | 67 → 66 | 261 → 285 ms | grain, ember trail, brass border, seal ring |
| `/why` | 69 → 70 | 255 → 204 ms | ASCII ripple (byte totals differ only by how much hero video buffered) |
| `/tournaments` | 75 → 75 | 186 → 153 ms | peg run (gallery, marquee) |
| `/legend` | 74 → 75 | 105 → 108 ms | masked word, film grain |
| `/parents` | 72 → 74 | 192 → 161 ms | curtain day |
| `/anatomy` | 74 → 75 (2 runs) | 141 → 120 ms | dual-body 3D (separate chunk, loads near the section) |
| `/about` | 76 → 76 (2 runs) | 117 → 127 ms | depth ribbon |
| `/schools` | 33 → 32 (2 runs) | — | expanding frame; page dominated by software WebGL as before |

As committed by the effects session, the home page and `/why` each lost 5 points (68 → 63; TBT +110–190 ms): grain
tiles, canvas measurements (forced layouts during hydration), the ASCII panel fetching and drawing its still, and the
ember trail's WebGL set-up all ran at page load, screens away from their sections. All of that now starts only when the
section is within a screen of the viewport; the remaining differences are within run-to-run noise (about ±3 points).

## 3. What changed

- The hero poster paints from the first frame (home LCP 17.4 s → 6.5 s).
- Scroll set-ups (SplitText, ScrollTrigger, parallax), story reels, the cube gallery, three.js / R3F stages and
  below-the-fold media start only as they approach the viewport; offscreen loops pause; the statue renders on demand.
- Title-card headlines rise with a CSS animation from first paint instead of waiting for hydration (same 1.55 s house
  curve; still visible without JavaScript; static with reduced motion).
- Stills ship as WebP (the PNG masters were never deployed, which also fixed blank stills on Vercel).
- Main-thread blocking (4× CPU, from traces): `/` 2.3 s → 0.46 s, `/legend` 1.49 s → 0.15 s, `/parents` 0.46 s →
  0.06 s.

## 4. Target and what remains

Target 80+ (stretch 90+) on mobile is **not reached** in this lab (66–76 on the reel pages). Measured bottlenecks:
1. **Bytes before first paint on slow 4G** — ~0.4–0.7 MB of JavaScript (React, GSAP, motion, Lenis on every page) and
   six preloaded font files (~265 KB). Options: preload only the two Noto Serif Display faces and Plus Jakarta Sans
   normal (≈ −120 KB at high priority, small risk of a font swap on body text); split GSAP plugins per route.
2. **WebGL at load** on `/schools` (campus configurator) and the WebGL sections of `/verify` and `/` — options: show a
   still frame on phones and start WebGL on interaction or when the section is in view; cap device-pixel ratio.
3. **Large stills** — 500–650 KB WebP backgrounds (`bg-fort`, `legend-sand`, `parents-rail`): serve responsive sizes
   through `next/image` (currently `unoptimized` for the grade filter) or export 1280 px variants.
4. **The first-visit loader** runs on every fresh Lighthouse visit; on phones its overlay could lift at first paint.
Each option changes something the owner sees (font swap, still instead of live WebGL, loader timing), so they are
listed for a decision rather than applied.

## 5. Asset inventory

Largest deployed assets: `public/video/hero-main.mp4` 32.9 MB (not used by the page; the page uses
`hero-main-desktop.mp4` 7.8 MB and `hero-main-mobile.mp4`), `public/models/rossbandiger-1/statue.glb` 31.7 MB (not
loaded by any route; `/statue` uses a 1.3 MB compressed model), `public/images/cinematic-images/6153468-uhd_…mp4`
22.7 MB. About 280 MB of tracked files under `public/` are not referenced by the code (filename search; see also `docs/MEDIA_INVENTORY.md`);
removing them shortens builds and clones but does not change page speed. Deleting files needs the owner's approval.
