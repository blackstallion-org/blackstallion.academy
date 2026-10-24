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

## 2c. Request hygiene (24 Oct, last pass before the preview was re-checked)

Four additive edits (details and verification: `docs/PERF_NOTES.md` section 8): the paper "deed" still, the footer
poster and the four anatomy overlay plates are requested when they are about to be seen instead of at load, and
`public/` media now carries `Cache-Control: public, max-age=86400, stale-while-revalidate=604800` (it was
`max-age=0, must-revalidate`). Home, mobile, 4 interleaved runs each on a quiet machine:

| `/` | Perf | LCP | Speed Index | TBT | Requests | Bytes |
| --- | --- | --- | --- | --- | --- | --- |
| before | 60 (58–64) | 7.21 s | 5.15 s | 477 ms | 64 | 3.16 MB |
| after | 60 (55–70) | **6.00 s** | **4.62 s** | 540 ms (noisy: 226–695) | 58 | **2.89 MB** |

The real saving is 267 KB less before the first paint and 0.27 MB less per visit; the lab *score* is unchanged
because it is limited by main-thread work, not by bytes (an offline model with every font and image removed still
scores only 71: `docs/PERF_NOTES.md` 8a). Run-to-run noise is about ±5 points.

## 2d. Server region (24 Oct, after the request-hygiene pass)

The database is in Seoul; the Vercel functions defaulted to Washington, D.C. (`iad1`). `vercel.json` now pins them to
Seoul (`icn1`). The read-only database probe behind `GET /api/health?deep=1`, eight samples each, from a browser in
India: median **635 ms before, 45 ms after** (clean run; range 39–179 ms). This is the server-to-database leg only; it
does not change the Lighthouse scores above (which measure the statically served home page) but applies to every
enquiry, passport lookup and admin page. Method, all samples and limits: `docs/DEPLOYMENT_RUNBOOK.md` section 10.

## 2e. Media served by the image provider's CDN (24 Oct, measured from the browser, not Lighthouse)

Lighthouse could not see this because the sandbox cannot reach the provider's CDN (the proxy refuses it), so every
size below comes from `HEAD` requests (`Content-Length`) made by the browser on the protected preview. They are what a
visitor downloads on top of the numbers in §2.

| Group | Used by | Items | Size |
| --- | --- | --- | --- |
| The eight new stills (peg run, academy morning), **as the CDN stores them** | `/tournaments` (4), `/parents` (4), `/about` ribbon (3 of them + `pegLift`) | 8 PNG, 2K | 7.2–8.0 MB **each, 60.8 MB in all** |
| The same eight stills **through the provider's resizer** (`w=1920`, WebP, q 82) — shipped in `561c8c8` | same | 8 WebP | landscape 0.21–0.28 MB; portrait 0.42–0.78 MB; **about 3.5 MB in all** |
| Journal sphere (`FieldSphereHero`) | `/journal` | 21 `_min.webp` | 6.2 MB in all (largest 0.72 MB); the first four were also seen requested through `<link rel="preload">` hints while browsing `/tournaments` (probably Next's prefetch of `/journal`; not investigated further) |
| Videos that exist only on the CDN | `/fleet` (4), `/legend` (1), `/curriculum` (1) | 6 MP4 | 3.6–15.1 MB each |
| Videos with a local first choice and the CDN as fallback | footer, `/why` | 2 MP4 | 3.6 and 5.1 MB, fetched only if the local file fails |
| Lithos hero | `LithosHero` (through the resizer); the component exists but no route renders it today | 2 WebP | one measured at 0.13 MB; the other could not be read by a cross-origin `HEAD` |

Before `561c8c8` the four peg-run stages alone were about 30 MB on `/tournaments` and the four morning stills about
30 MB on `/parents`; after it the peg run loads about 1 MB (verified on the preview: 213, 255, 281 and 225 KB, stage
switching and the WebGL transition still work, no console errors except Vercel's own feedback toolbar being refused by
the CSP) and the morning stills 2.5 MB. The resizer is an interim measure: the real fix is to download the masters,
ship WebP copies in git and drop the third-party dependency (`scripts/fetch-media.sh`, then switch `cdnOnly(...)` to
`m(...)` in `lib/content/media.ts`). Self-hosting also settles the licence question in `docs/BUSINESS_LEGAL_REVIEW.md`
(D8) because the files become ours to keep. Every item above is third-party-dependent: if the provider removes or
renames a file the page shows the gradient placeholder.

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

Target 80+ (stretch 90+) on mobile is **not reached** in this lab (home 60–67 depending on machine load, reels 70–77,
`/schools` 32–33). Home cannot get there without removing fonts, images or effects the brief says to keep (offline
what-if: `docs/PERF_NOTES.md` 8a), and `/schools` is dominated by software rendering of its WebGL opening (the
page does continuous GPU work that a phone's GPU is expected to absorb; not yet confirmed on a device). The honest
verdict is "as good as the design allows in the lab; re-measure on a real device and PageSpeed Insights after the
production deploy". Measured bottlenecks:
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
